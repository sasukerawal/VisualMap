"""
Dijkstra's Algorithm with step-by-step tracking for VisualMap.

Computes the single-source shortest path using a min-priority queue.
Returns the path, total distance, and detailed exploration steps for
frontend visualization.
"""

import heapq
import math
from typing import Dict, List, Optional, Tuple

from app.graph.town_graph import NODES


def _euclidean(node_id: str, target_id: str) -> float:
    p1 = NODES[node_id]["pos_3d"]
    p2 = NODES[target_id]["pos_3d"]
    return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[2] - p2[2]) ** 2)


def dijkstra(
    graph: Dict[str, List[Tuple[str, float]]],
    start: str,
    end: str,
) -> dict:
    """
    Run Dijkstra from `start` to `end` on an adjacency-list graph.

    Args:
        graph: {node_id: [(neighbor_id, weight), ...]}
        start: source node ID
        end:   target node ID

    Returns:
        {
            path, total_distance, visited_nodes,
            exploration_order, edges_traversed, steps
        }
    """
    # dist[n] = best known distance from start to n
    dist: Dict[str, float] = {n: float("inf") for n in graph}
    dist[start] = 0.0
    prev: Dict[str, Optional[str]] = {n: None for n in graph}

    # (distance, node)
    heap: List[Tuple[float, str]] = [(0.0, start)]

    visited: List[str] = []
    exploration_order = []
    step_counter = 0

    while heap:
        d, u = heapq.heappop(heap)

        # Skip if we already found a better path
        if d > dist[u]:
            continue

        visited.append(u)
        step_counter += 1

        neighbors_updated = []
        for v, w in graph.get(u, []):
            new_dist = dist[u] + w
            if new_dist < dist[v]:
                dist[v] = new_dist
                prev[v] = u
                heapq.heappush(heap, (new_dist, v))
                neighbors_updated.append({"node": v, "new_dist": round(new_dist, 2)})

        exploration_order.append({
            "step": step_counter,
            "node": u,
            "distance": round(d, 2),
            "action": "settle",
            "description": (
                f"Step {step_counter}: Settle node '{u}' with distance {d:.2f}. "
                f"Updated {len(neighbors_updated)} neighbor(s)."
            ),
            "neighbors_updated": neighbors_updated,
        })

        if u == end:
            break

    # Reconstruct path
    path: List[str] = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()

    if not path or path[0] != start:
        path = []  # unreachable

    edges_traversed = [[path[i], path[i + 1]] for i in range(len(path) - 1)]
    total_dist = dist[end] if dist[end] != float("inf") else -1

    return {
        "path": path,
        "total_distance": round(total_dist, 2),
        "visited_nodes": visited,
        "exploration_order": exploration_order,
        "edges_traversed": edges_traversed,
        "steps": _build_steps(exploration_order, "dijkstra"),
    }


def _build_steps(exploration_order: list, algorithm: str) -> list:
    """Convert raw exploration events into structured AlgoStep dicts."""
    return [
        {
            "step": e["step"],
            "action": e["action"],
            "node": e["node"],
            "distance": e["distance"],
            "neighbors_updated": e["neighbors_updated"],
            "description": e["description"],
        }
        for e in exploration_order
    ]
