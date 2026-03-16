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
    """
    Fuel heuristic: straight-line physical distance (admissible).

    We intentionally do NOT add elevation penalty here to avoid overestimating fuel.
    """
    p1 = NODES[node_id]["pos_3d"]
    p2 = NODES[target_id]["pos_3d"]
    raw_dist = math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2)
    return raw_dist


UPHILL_PENALTY = 0.35
DOWNHILL_REGEN = 0.12
MIN_FUEL_MULT = 0.55


def _edge_fuel_cost(u: str, v: str, phys_dist: float) -> Tuple[float, float, float]:
    """
    Fuel proxy model:
      base fuel proportional to distance
      uphill increases fuel (penalty)
      downhill slightly reduces fuel (regen), but never below MIN_FUEL_MULT

    Returns: (fuel_cost, elev_delta, fuel_multiplier)
    """
    eu = float(NODES[u].get("elev", 0.0))
    ev = float(NODES[v].get("elev", 0.0))
    delta = ev - eu
    mult = 1.0 + UPHILL_PENALTY * max(0.0, delta) - DOWNHILL_REGEN * max(0.0, -delta)
    mult = max(MIN_FUEL_MULT, mult)
    return phys_dist * mult, delta, mult


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
    # Line 1: Initialize (we optimize fuel but still track time + physical distance)
    g_fuel: Dict[str, float] = {n: float("inf") for n in graph}
    g_time: Dict[str, float] = {n: float("inf") for n in graph}
    g_raw: Dict[str, float] = {n: float("inf") for n in graph}
    g_fuel[start] = 0.0
    g_time[start] = 0.0
    g_raw[start] = 0.0

    f_fuel: Dict[str, float] = {n: float("inf") for n in graph}
    f_fuel[start] = _heuristic(start, end)
    prev: Dict[str, Optional[str]] = {n: None for n in graph}

    # Line 2: Push start
    open_heap: List[Tuple[float, str]] = [(f_fuel[start], start)]
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
            edge_fuel, elev_delta, fuel_mult = _edge_fuel_cost(u, v, phys_dist)
            tentative_fuel = g_fuel[u] + edge_fuel
            tentative_time = g_time[u] + time_cost
            tentative_raw = g_raw[u] + phys_dist

            if tentative_fuel < g_fuel[v]:
                g_fuel[v] = tentative_fuel
                g_time[v] = tentative_time
                g_raw[v] = tentative_raw
                h_v = _heuristic(v, end)
                f_fuel[v] = tentative_fuel + h_v
                prev[v] = u
                # Line 8: Push to open list
                heapq.heappush(open_heap, (f_fuel[v], v))
                neighbors_updated.append({
                    "node": v,
                    "from_node": u,
                    "edge_time_cost": round(time_cost, 2),
                    "edge_distance": round(phys_dist, 2),
                    "edge_fuel_cost": round(edge_fuel, 2),
                    "elev_delta": round(elev_delta, 3),
                    "fuel_mult": round(fuel_mult, 3),
                    "g": round(tentative_time, 2),
                    "new_dist": round(tentative_time, 2),
                    "new_raw_dist": round(tentative_raw, 2),
                    "new_fuel_cost": round(tentative_fuel, 2),
                    "h": round(h_v, 2),
                    "f": round(f_fuel[v], 2),
                    "relaxed": True
                })

        # Record step metadata
        exploration_order.append({
            "step": step_counter,
            "node": u,
            "distance": round(g_time[u], 2), # time so far (seconds proxy)
            "raw_distance": round(g_raw[u], 2),
            "fuel_cost": round(g_fuel[u], 2),
            "heuristic": round(h_u, 2),
            "f_score": round(g_time[u] + (h_u / 1.5), 2),
            "f_fuel": round(f_fuel[u], 2),
            "action": "settle",
            "active_line": 4, # Pop node
            "explanation": f"Selecting '{NODES[u].get('label', u)}' because it has the lowest estimated fuel cost (f_fuel={f_fuel[u]:.2f}).",
            "math_breakdown": {
                "time_g": round(g_time[u], 2),
                "fuel_g": round(g_fuel[u], 2),
                "h": round(h_u, 2),
                "f_fuel": round(f_fuel[u], 2)
            },
            "description": (
                f"Step {step_counter}: Expand '{u}' — "
                f"time={g_time[u]:.2f}s, fuel={g_fuel[u]:.2f}, h={h_u:.2f}, f_fuel={f_fuel[u]:.2f}. "
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
    total_time = g_time[end] if g_time[end] != float("inf") else -1
    total_fuel = g_fuel[end] if g_fuel[end] != float("inf") else -1
    total_raw = g_raw[end] if g_raw[end] != float("inf") else -1

    return {
        "path": path,
        # For A*, we treat "total_distance" as the optimized cost (fuel proxy).
        "total_distance": round(total_fuel, 2),
        "total_time": round(total_time, 2),
        "total_fuel": round(total_fuel, 2),
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
            "fuel_cost": e.get("fuel_cost"),
            "heuristic": e.get("heuristic"),
            "f_score": e.get("f_score"),
            "f_fuel": e.get("f_fuel"),
            "neighbors_updated": e["neighbors_updated"],
            "description": e["description"],
            "active_line": e.get("active_line"),
            "explanation": e.get("explanation"),
            "math_breakdown": e.get("math_breakdown"),
        }
        for e in exploration_order
    ]
