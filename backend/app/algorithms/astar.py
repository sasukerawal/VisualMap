"""
A* (A-Star) Search Algorithm with step-by-step tracking for VisualMap.

Uses Euclidean distance as the heuristic h(n).
Tracks g(n), h(n), and f(n) = g(n)+h(n) at every step.
"""

import heapq
import math
from typing import Dict, List, Optional, Tuple

from app.graph.town_graph import NODES


def _heuristic(node_id: str, target_id: str) -> float:
    """Euclidean distance heuristic between two nodes in 3D world, converted to time."""
    p1 = NODES[node_id]["pos_3d"]
    p2 = NODES[target_id]["pos_3d"]
    raw_dist = math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2)
    # Admissible assumption: assume we can travel at max speed (1.5) all the way
    return raw_dist / 1.5


def astar(
    graph: Dict[str, List[Tuple[str, float, float]]],
    start: str,
    end: str,
) -> dict:
    """
    Run A* from `start` to `end`.

    Returns:
        {
            path, total_distance, visited_nodes,
            exploration_order, edges_traversed, steps
        }
    """
    # Line 1: Initialize
    g: Dict[str, float] = {n: float("inf") for n in graph}
    g_raw: Dict[str, float] = {n: float("inf") for n in graph}
    g[start] = 0.0
    g_raw[start] = 0.0
    f: Dict[str, float] = {n: float("inf") for n in graph}
    f[start] = _heuristic(start, end)
    prev: Dict[str, Optional[str]] = {n: None for n in graph}

    # Line 2: Push start
    open_heap: List[Tuple[float, str]] = [(f[start], start)]
    closed: set = set()

    visited: List[str] = []
    exploration_order = []
    step_counter = 0

    # Line 3: Loop while open_heap
    while open_heap:
        # Line 4: Pop min f
        _, u = heapq.heappop(open_heap)

        if u in closed:
            continue
        closed.add(u)
        visited.append(u)
        step_counter += 1

        h_u = _heuristic(u, end)
        neighbors_updated = []

        # Line 6: Neighbors loop
        for v, time_cost, phys_dist in graph.get(u, []):
            if v in closed:
                continue
            # Line 7: Relaxation check
            tentative_g = g[u] + time_cost
            tentative_raw = g_raw[u] + phys_dist
            if tentative_g < g[v]:
                g[v] = tentative_g
                g_raw[v] = tentative_raw
                h_v = _heuristic(v, end)
                f[v] = tentative_g + h_v
                prev[v] = u
                # Line 8: Push to open list
                heapq.heappush(open_heap, (f[v], v))
                neighbors_updated.append({
                    "node": v,
                    "from_node": u,
                    "edge_time_cost": round(time_cost, 2),
                    "edge_distance": round(phys_dist, 2),
                    "g": round(tentative_g, 2),
                    "new_dist": round(tentative_g, 2),
                    "new_raw_dist": round(tentative_raw, 2),
                    "h": round(h_v, 2),
                    "f": round(f[v], 2),
                    "relaxed": True
                })

        # Record step metadata
        exploration_order.append({
            "step": step_counter,
            "node": u,
            "distance": round(g[u], 2), # time cost
            "raw_distance": round(g_raw[u], 2),
            "heuristic": round(h_u, 2),
            "f_score": round(f[u], 2),
            "action": "settle",
            "active_line": 4, # Pop node
            "explanation": f"Selecting '{NODES[u].get('label', u)}' because it has the lowest total estimated time (f={f[u]:.2f}s).",
            "math_breakdown": {
                "g": round(g[u], 2),
                "h": round(h_u, 2),
                "f": round(f[u], 2)
            },
            "description": (
                f"Step {step_counter}: Expand '{u}' — "
                f"g={g[u]:.2f}, h={h_u:.2f}, f={f[u]:.2f}. "
                f"Relaxed {len(neighbors_updated)} neighbor(s)."
            ),
            "neighbors_updated": neighbors_updated,
        })

        # Line 5: Check goal
        if u == end:
            # Update the last entry to indicate goal reached
            exploration_order[-1]["active_line"] = 5
            exploration_order[-1]["explanation"] = f"Goal reached! '{NODES[u].get('label', u)}' is the target destination."
            break

    # Reconstruct
    path: List[str] = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()

    if not path or path[0] != start:
        path = []

    edges_traversed = [[path[i], path[i + 1]] for i in range(len(path) - 1)]
    total_dist = g[end] if g[end] != float("inf") else -1
    total_raw = g_raw[end] if g_raw[end] != float("inf") else -1

    return {
        "path": path,
        "total_distance": round(total_dist, 2),
        "total_time": round(total_dist, 2), 
        "total_physical_distance": round(total_raw, 2),
        "visited_nodes": visited,
        "exploration_order": exploration_order,
        "edges_traversed": edges_traversed,
        "steps": _build_steps(exploration_order),
        "efficiency_metrics": {
            "time_complexity": "O(E) in best case, O((V+E) log V) worst",
            "space_complexity": "O(V)",
            "nodes_explored": len(visited),
            "total_nodes_in_graph": len(graph),
            "algorithm_efficiency": "Heuristic h(n) perfectly targets search towards the goal."
        }
    }


def _build_steps(exploration_order: list) -> list:
    return [
        {
            "step": e["step"],
            "action": e["action"],
            "node": e["node"],
            "distance": e["distance"],
            "raw_distance": e.get("raw_distance"),
            "heuristic": e.get("heuristic"),
            "f_score": e.get("f_score"),
            "neighbors_updated": e["neighbors_updated"],
            "description": e["description"],
            "active_line": e.get("active_line"),
            "explanation": e.get("explanation"),
            "math_breakdown": e.get("math_breakdown"),
        }
        for e in exploration_order
    ]
