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
    """Euclidean distance heuristic between two nodes in 3D world."""
    p1 = NODES[node_id]["pos_3d"]
    p2 = NODES[target_id]["pos_3d"]
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2)


def astar(
    graph: Dict[str, List[Tuple[str, float]]],
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
    g: Dict[str, float] = {n: float("inf") for n in graph}
    g[start] = 0.0
    f: Dict[str, float] = {n: float("inf") for n in graph}
    f[start] = _heuristic(start, end)
    prev: Dict[str, Optional[str]] = {n: None for n in graph}

    # (f_score, node)
    open_heap: List[Tuple[float, str]] = [(f[start], start)]
    closed: set = set()

    visited: List[str] = []
    exploration_order = []
    step_counter = 0

    while open_heap:
        _, u = heapq.heappop(open_heap)

        if u in closed:
            continue
        closed.add(u)
        visited.append(u)
        step_counter += 1

        h_u = _heuristic(u, end)
        neighbors_updated = []

        for v, w in graph.get(u, []):
            if v in closed:
                continue
            tentative_g = g[u] + w
            if tentative_g < g[v]:
                g[v] = tentative_g
                h_v = _heuristic(v, end)
                f[v] = tentative_g + h_v
                prev[v] = u
                heapq.heappush(open_heap, (f[v], v))
                neighbors_updated.append({
                    "node": v,
                    "g": round(tentative_g, 2),
                    "h": round(h_v, 2),
                    "f": round(f[v], 2),
                })

        exploration_order.append({
            "step": step_counter,
            "node": u,
            "distance": round(g[u], 2),
            "heuristic": round(h_u, 2),
            "f_score": round(f[u], 2),
            "action": "settle",
            "description": (
                f"Step {step_counter}: Expand '{u}' — "
                f"g={g[u]:.2f}, h={h_u:.2f}, f={f[u]:.2f}. "
                f"Updated {len(neighbors_updated)} neighbor(s)."
            ),
            "neighbors_updated": neighbors_updated,
        })

        if u == end:
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

    return {
        "path": path,
        "total_distance": round(total_dist, 2),
        "visited_nodes": visited,
        "exploration_order": exploration_order,
        "edges_traversed": edges_traversed,
        "steps": _build_steps(exploration_order),
    }


def _build_steps(exploration_order: list) -> list:
    return [
        {
            "step": e["step"],
            "action": e["action"],
            "node": e["node"],
            "distance": e["distance"],
            "heuristic": e.get("heuristic"),
            "f_score": e.get("f_score"),
            "neighbors_updated": e["neighbors_updated"],
            "description": e["description"],
        }
        for e in exploration_order
    ]
