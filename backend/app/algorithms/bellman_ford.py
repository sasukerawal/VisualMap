"""
Bellman-Ford Algorithm with step-by-step tracking for VisualMap.

Relaxes all edges |V|-1 times. Detects negative-weight cycles.
Each relaxation round is tracked for visualization.
"""

from typing import Dict, List, Optional, Tuple


def bellman_ford(
    graph: Dict[str, List[Tuple[str, float, float]]],
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

    # Line 1: Initialize
    dist: Dict[str, float] = {n: float("inf") for n in nodes}
    raw_dist: Dict[str, float] = {n: float("inf") for n in nodes}
    dist[start] = 0.0
    raw_dist[start] = 0.0
    prev: Dict[str, Optional[str]] = {n: None for n in nodes}

    # Build flat edge list from adjacency list
    edges: List[Tuple[str, str, float, float]] = []
    for u, neighbors in graph.items():
        for v, time_cost, phys_dist in neighbors:
            edges.append((u, v, time_cost, phys_dist))

    exploration_order = []
    step_counter = 0
    visited_set: set = set()
    visited: List[str] = []
    negative_cycle = False

    # Line 2: Relax V-1 rounds
    for round_num in range(1, V):
        relaxed_any = False
        round_updates = []

        # Line 3: Edge iteration
        for u, v, time_cost, phys_dist in edges:
            if dist[u] == float("inf"):
                continue
            new_dist = dist[u] + time_cost
            new_raw = raw_dist[u] + phys_dist
            # Line 4: Check Improvement
            if new_dist < dist[v]:
                # Line 5: Relax
                dist[v] = new_dist
                raw_dist[v] = new_raw
                prev[v] = u
                relaxed_any = True
                round_updates.append({
                    "edge": [u, v],
                    "new_dist": round(new_dist, 2),
                    "new_raw_dist": round(new_raw, 2),
                    "node": v,
                    "relaxed": True
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
            "active_line": 2, # Round expansion
            "explanation": f"Round {round_num}: Checking all edges to see if any node's transit time can be improved by going through its neighbors.",
            "math_breakdown": {
                "relaxations_found": len(round_updates)
            },
            "description": (
                f"Round {round_num}: Relaxed {len(round_updates)} edge(s). "
                + ("Distances improved." if relaxed_any else "No improvement — early stop.")
            ),
            "neighbors_updated": round_updates,
        })

        if not relaxed_any:
            break  # Early termination optimisation

    # Detect negative-weight cycles (V-th relaxation)
    for u, v, time_cost, phys_dist in edges:
        if dist[u] != float("inf") and dist[u] + time_cost < dist[v]:
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
    total_raw = raw_dist[end] if raw_dist[end] != float("inf") else -1

    # Ensure start is in visited
    if start not in visited:
        visited.insert(0, start)

    return {
        "path": path,
        "total_distance": round(total_dist, 2),
        "total_time": round(total_dist, 2), 
        "total_physical_distance": round(total_raw, 2),
        "visited_nodes": visited,
        "exploration_order": exploration_order,
        "edges_traversed": edges_traversed,
        "negative_cycle_detected": negative_cycle,
        "steps": _build_steps(exploration_order),
        "efficiency_metrics": {
            "time_complexity": "O(V × E)",
            "space_complexity": "O(V)",
            "nodes_explored": len(visited),
            "total_nodes_in_graph": len(graph),
            "algorithm_efficiency": "Expensive but exhaustive. Safely handles negative edges."
        }
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
            "active_line": e.get("active_line"),
            "explanation": e.get("explanation"),
            "math_breakdown": e.get("math_breakdown"),
        }
        for e in exploration_order
    ]
