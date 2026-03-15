"""
Bellman-Ford Algorithm with step-by-step tracking for VisualMap.

Relaxes all edges |V|-1 times. Detects negative-weight cycles.
Each relaxation round is tracked for visualization.
"""

from typing import Dict, List, Optional, Tuple


def bellman_ford(
    graph: Dict[str, List[Tuple[str, float]]],
    start: str,
    end: str,
) -> dict:
    """
    Run Bellman-Ford from `start` to `end`.

    Args:
        graph: {node_id: [(neighbor_id, weight), ...]}
        start: source node ID
        end:   target node ID

    Returns:
        {
            path, total_distance, visited_nodes,
            exploration_order, edges_traversed, steps,
            negative_cycle_detected
        }
    """
    nodes = list(graph.keys())
    V = len(nodes)

    dist: Dict[str, float] = {n: float("inf") for n in nodes}
    dist[start] = 0.0
    prev: Dict[str, Optional[str]] = {n: None for n in nodes}

    # Build flat edge list from adjacency list
    edges: List[Tuple[str, str, float]] = []
    for u, neighbors in graph.items():
        for v, w in neighbors:
            edges.append((u, v, w))

    exploration_order = []
    step_counter = 0
    visited_set: set = set()
    visited: List[str] = []
    negative_cycle = False

    # Relax edges V-1 times
    for round_num in range(1, V):
        relaxed_any = False
        round_updates = []

        for u, v, w in edges:
            if dist[u] == float("inf"):
                continue
            new_dist = dist[u] + w
            if new_dist < dist[v]:
                dist[v] = new_dist
                prev[v] = u
                relaxed_any = True
                round_updates.append({
                    "edge": [u, v],
                    "new_dist": round(new_dist, 2),
                    "node": v,
                })
                # Track visited nodes (order of first relaxation)
                if v not in visited_set:
                    visited_set.add(v)
                    visited.append(v)

        step_counter += 1
        exploration_order.append({
            "step": step_counter,
            "node": f"round_{round_num}",
            "distance": 0,
            "round_num": round_num,
            "action": "relax_round",
            "description": (
                f"Round {round_num}: Relaxed {len(round_updates)} edge(s). "
                + ("Distances improved." if relaxed_any else "No improvement — early stop.")
            ),
            "neighbors_updated": round_updates,
        })

        if not relaxed_any:
            break  # Early termination optimisation

    # Detect negative-weight cycles (V-th relaxation)
    for u, v, w in edges:
        if dist[u] != float("inf") and dist[u] + w < dist[v]:
            negative_cycle = True
            break

    # Reconstruct path
    path: List[str] = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
        if len(path) > V:  # cycle guard
            path = []
            break
    path.reverse()

    if not path or path[0] != start:
        path = []

    edges_traversed = [[path[i], path[i + 1]] for i in range(len(path) - 1)]
    total_dist = dist[end] if dist[end] != float("inf") else -1

    # Ensure start is in visited
    if start not in visited:
        visited.insert(0, start)

    return {
        "path": path,
        "total_distance": round(total_dist, 2),
        "visited_nodes": visited,
        "exploration_order": exploration_order,
        "edges_traversed": edges_traversed,
        "negative_cycle_detected": negative_cycle,
        "steps": _build_steps(exploration_order),
    }


def _build_steps(exploration_order: list) -> list:
    return [
        {
            "step": e["step"],
            "action": e["action"],
            "node": e["node"],
            "distance": e["distance"],
            "round_num": e.get("round_num"),
            "neighbors_updated": e.get("neighbors_updated", []),
            "description": e["description"],
        }
        for e in exploration_order
    ]
