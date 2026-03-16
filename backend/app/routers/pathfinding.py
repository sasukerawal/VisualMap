"""
FastAPI router for pathfinding endpoints.
Exposes:
  GET  /api/graph           — full town graph data
  POST /api/path            — compute shortest path(s) through destinations
  POST /api/path/steps      — step-by-step algorithm visualization data
"""

import time
import itertools
from typing import Dict, List, Tuple

from fastapi import APIRouter, HTTPException

from app.graph.town_graph import NODES, EDGES, ADJ, get_graph_data
from app.models.schemas import PathRequest, PathResponse, StepsResponse
from app.algorithms.dijkstra import dijkstra
from app.algorithms.astar import astar
from app.algorithms.bellman_ford import bellman_ford

router = APIRouter(prefix="/api")
# ADJ is pre-built in town_graph.py respecting one-way edges


# ---------------------------------------------------------------------------
# Algorithm dispatcher
# ---------------------------------------------------------------------------
def _run_algorithm(algorithm: str, start: str, end: str) -> dict:
    if algorithm == "dijkstra":
        return dijkstra(ADJ, start, end)
    elif algorithm == "astar":
        return astar(ADJ, start, end)
    elif algorithm == "bellman_ford":
        return bellman_ford(ADJ, start, end)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algorithm}")


# ---------------------------------------------------------------------------
# TSP nearest-neighbor heuristic for optimized ordering
# ---------------------------------------------------------------------------
def _nearest_neighbor_order(start: str, destinations: List[str]) -> List[str]:
    """
    Simple nearest-neighbor TSP to order delivery stops.
    Uses Dijkstra total_distance as the distance metric between stops.
    """
    if len(destinations) <= 1:
        return destinations

    unvisited = list(destinations)
    ordered: List[str] = []
    current = start

    while unvisited:
        best = min(
            unvisited,
            key=lambda d: dijkstra(ADJ, current, d)["total_distance"]
        )
        ordered.append(best)
        unvisited.remove(best)
        current = best

    return ordered


# ---------------------------------------------------------------------------
# Build React Flow tree nodes/edges from algorithm steps
# ---------------------------------------------------------------------------
def _build_tree(steps: list, algorithm: str) -> Tuple[list, list]:
    tree_nodes = []
    tree_edges = []
    seen_nodes: set = set()

    for s in steps:
        nid = s["node"]
        if nid not in seen_nodes:
            seen_nodes.add(nid)
            label = nid
            if algorithm == "astar" and s.get("f_score") is not None:
                label = f"{nid}\nf={s['f_score']}"
            elif algorithm == "bellman_ford" and s.get("round_num"):
                label = f"Round {s['round_num']}"

            tree_nodes.append({
                "id": nid,
                "label": label,
                "data": {
                    "distance": s["distance"],
                    "heuristic": s.get("heuristic"),
                    "f_score": s.get("f_score"),
                    "round_num": s.get("round_num"),
                },
            })

        # Add edges to neighbors
        for nb in s.get("neighbors_updated", []):
            edge_id = f"{nid}-{nb['node']}-{s['step']}"
            tree_edges.append({
                "id": edge_id,
                "source": nid,
                "target": nb["node"],
                "label": str(nb.get("new_dist", nb.get("f", ""))),
            })

    return tree_nodes, tree_edges


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/graph")
async def get_graph():
    """Return the full town graph (nodes + edges) for frontend rendering."""
    return get_graph_data()


@router.post("/path", response_model=PathResponse)
async def compute_path(req: PathRequest):
    """
    Compute the shortest path through all delivery destinations.
    Supports 'manual' and 'optimized' (nearest-neighbor TSP) ordering.
    """
    # Validate nodes exist
    for dest in req.destinations:
        if dest not in NODES:
            raise HTTPException(status_code=422, detail=f"Unknown node: '{dest}'")
    if req.start not in NODES:
        raise HTTPException(status_code=422, detail=f"Unknown start node: '{req.start}'")

    start_time = time.perf_counter()

    # Determine visit order
    if req.order_mode == "optimized" and len(req.destinations) > 1:
        ordered_dests = _nearest_neighbor_order(req.start, list(req.destinations))
    else:
        ordered_dests = list(req.destinations)

    # Chain path: warehouse -> d1 -> d2 -> ... -> dN
    full_path: List[str] = []
    all_visited: List[str] = []
    all_exploration: list = []
    all_edges: List[List[str]] = []
    segments = []
    total_dist = 0.0
    step_offset = 0

    stops = [req.start] + ordered_dests
    for i in range(len(stops) - 1):
        seg_start = stops[i]
        seg_end = stops[i + 1]
        result = _run_algorithm(req.algorithm, seg_start, seg_end)

        if not result["path"]:
            raise HTTPException(
                status_code=422,
                detail=f"No path found between '{seg_start}' and '{seg_end}'",
            )

        seg_path = result["path"]
        # Avoid duplicating the junction node between segments
        if full_path and seg_path[0] == full_path[-1]:
            seg_path = seg_path[1:]

        full_path.extend(seg_path)
        all_visited.extend(result["visited_nodes"])
        total_dist += result["total_distance"]

        # Offset step numbers so they're globally sequential
        for exp in result["exploration_order"]:
            exp_copy = dict(exp)
            exp_copy["step"] += step_offset
            all_exploration.append(exp_copy)
        step_offset += len(result["exploration_order"])

        all_edges.extend(result["edges_traversed"])
        segments.append({
            "from": stops[i],
            "to": stops[i + 1],
            "path": result["path"],
            "distance": result["total_distance"],
        })

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return PathResponse(
        algorithm=req.algorithm,
        path=full_path,
        total_distance=round(total_dist, 2),
        visited_nodes=list(dict.fromkeys(all_visited)),  # deduplicate, preserve order
        exploration_order=all_exploration,
        edges_traversed=all_edges,
        computation_time_ms=round(elapsed_ms, 3),
        segments=segments,
    )


@router.post("/path/steps", response_model=StepsResponse)
async def compute_path_steps(req: PathRequest):
    """
    Return step-by-step algorithm data for decision-tree visualization.
    Visualizes one segment at a time (warehouse → dest[0], dest[0] → dest[1], ...).
    """
    if not req.destinations:
        raise HTTPException(status_code=422, detail="No destinations provided")

    # Validate nodes exist
    for dest in req.destinations:
        if dest not in NODES:
            raise HTTPException(status_code=422, detail=f"Unknown node: '{dest}'")
    if req.start not in NODES:
        raise HTTPException(status_code=422, detail=f"Unknown start node: '{req.start}'")

    # Determine visit order (must match /api/path)
    if req.order_mode == "optimized" and len(req.destinations) > 1:
        ordered_dests = _nearest_neighbor_order(req.start, list(req.destinations))
    else:
        ordered_dests = list(req.destinations)

    segment_index = req.segment_index or 0
    if segment_index < 0:
        raise HTTPException(status_code=422, detail="segment_index must be >= 0")

    stops = [req.start] + ordered_dests
    if segment_index >= len(stops) - 1:
        raise HTTPException(status_code=422, detail=f"segment_index out of range (max {len(stops) - 2})")

    seg_start = stops[segment_index]
    seg_end = stops[segment_index + 1]

    result = _run_algorithm(req.algorithm, seg_start, seg_end)
    tree_nodes, tree_edges = _build_tree(result.get("steps", []), req.algorithm)

    return StepsResponse(
        algorithm=req.algorithm,
        steps=result.get("steps", []),
        tree_nodes=tree_nodes,
        tree_edges=tree_edges,
        final_path=result["path"],
        total_distance=result["total_distance"],
    )
