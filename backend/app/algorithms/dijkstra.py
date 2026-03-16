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
    graph: Dict[str, List[Tuple[str, float, float]]],
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
    # Line 1: Initialize values
    dist: Dict[str, float] = {n: float("inf") for n in graph}
    raw_dist: Dict[str, float] = {n: float("inf") for n in graph}
    dist[start] = 0.0
    raw_dist[start] = 0.0
    prev: Dict[str, Optional[str]] = {n: None for n in graph}

    # Line 2: Initial push
    heap: List[Tuple[float, str]] = [(0.0, start)]

    visited: List[str] = []
    exploration_order = []
    step_counter = 0

    # Line 3: Process priority queue
    while heap:
        d, u = heapq.heappop(heap)

        # Skip if we already found a better path
        if d > dist[u]:
            continue

        visited.append(u)
        step_counter += 1

        neighbors_updated = []
        # Line 5: Check neighbors
        for v, time_cost, phys_dist in graph.get(u, []):
            # Line 6: Calculate tentative distance
            new_dist = dist[u] + time_cost
            new_raw = raw_dist[u] + phys_dist
            # Line 7: Relaxation
            if new_dist < dist[v]:
                dist[v] = new_dist
                raw_dist[v] = new_raw
                prev[v] = u
                # Line 8: Update queue
                heapq.heappush(heap, (new_dist, v))
                neighbors_updated.append({
                    "node": v, 
                    "from_node": u,
                    "edge_time_cost": round(time_cost, 2),
                    "edge_distance": round(phys_dist, 2),
                    "new_dist": round(new_dist, 2),
                    "new_raw_dist": round(new_raw, 2),
                    "relaxed": True
                })

        # Record step metadata
        exploration_order.append({
            "step": step_counter,
            "node": u,
            "distance": round(d, 2), # time cost
            "raw_distance": round(raw_dist[u], 2), # physical dist
            "action": "settle",
            "active_line": 3, # Pop node
            "explanation": f"Expanding '{NODES[u].get('label', u)}'. It has the shortest confirmed transit time from start (t = {d:.2f}s).",
            "math_breakdown": {"g": round(d, 2)},
            "description": (
                f"Step {step_counter}: Settle node '{u}' with time {d:.2f}. "
                f"Relaxed {len(neighbors_updated)} neighbor(s)."
            ),
            "neighbors_updated": neighbors_updated,
        })

        # Line 4: Check if goal
        if u == end:
            exploration_order[-1]["active_line"] = 4
            exploration_order[-1]["explanation"] = f"Destination reached! '{NODES[u].get('label', u)}' found with optimal time of {d:.2f}s."
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
    total_raw = raw_dist[end] if raw_dist[end] != float("inf") else -1

    return {
        "path": path,
        "total_distance": round(total_dist, 2), # Backwards compatibility name (actually time)
        "total_time": round(total_dist, 2), 
        "total_physical_distance": round(total_raw, 2),
        "visited_nodes": visited,
        "exploration_order": exploration_order,
        "edges_traversed": edges_traversed,
        "steps": _build_steps(exploration_order, "dijkstra"),
        "efficiency_metrics": {
            "time_complexity": "O((V + E) log V)",
            "space_complexity": "O(V)",
            "nodes_explored": len(visited),
            "total_nodes_in_graph": len(graph),
            "algorithm_efficiency": "Guarantees optimal time without guessing direction."
        }
    }


def _build_steps(exploration_order: list, algorithm: str) -> list:
    """Convert raw exploration events into structured AlgoStep dicts."""
    return [
        {
            "step": e["step"],
            "action": e["action"],
            "node": e["node"],
            "distance": e["distance"],
            "raw_distance": e.get("raw_distance"),
            "neighbors_updated": e["neighbors_updated"],
            "description": e["description"],
            "active_line": e.get("active_line"),
            "explanation": e.get("explanation"),
            "math_breakdown": e.get("math_breakdown"),
        }
        for e in exploration_order
    ]
