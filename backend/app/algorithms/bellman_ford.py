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
        round_updates = []  # backwards compatible: only updates
        comparisons = []    # v2 narration: updates + non-updates

        # Line 3: Edge iteration
        for u, v, time_cost, phys_dist in edges:
            if dist[u] == float("inf"):
                comparisons.append({
                    "kind": "edge_check",
                    "edge": {
                        "from": u,
                        "to": v,
                        "time_cost": round(time_cost, 2),
                        "physical_distance": round(phys_dist, 2),
                    },
                    "updated": False,
                    "old_value": "inf" if dist[v] == float("inf") else round(dist[v], 2),
                    "candidate_value": "inf",
                    "new_value": "inf" if dist[v] == float("inf") else round(dist[v], 2),
                    "old_parent": prev.get(v),
                    "new_parent": prev.get(v),
                    "note": f"Skip update: dist[{u}] is still infinity, so no path to {u} is known yet.",
                })
                continue

            new_dist = dist[u] + time_cost
            new_raw = raw_dist[u] + phys_dist
            # Line 4: Check Improvement
            old_dist_v = dist[v]
            old_raw_v = raw_dist[v]
            old_prev_v = prev[v]
            if new_dist < dist[v]:
                # Line 5: Relax
                dist[v] = new_dist
                raw_dist[v] = new_raw
                prev[v] = u
                relaxed_any = True
                round_updates.append({
                    "edge": [u, v],
                    "from_node": u,
                    "edge_time_cost": round(time_cost, 2),
                    "edge_distance": round(phys_dist, 2),
                    "new_dist": round(new_dist, 2),
                    "new_raw_dist": round(new_raw, 2),
                    "node": v,
                    "relaxed": True
                })
                comparisons.append({
                    "kind": "edge_check",
                    "edge": {
                        "from": u,
                        "to": v,
                        "time_cost": round(time_cost, 2),
                        "physical_distance": round(phys_dist, 2),
                    },
                    "updated": True,
                    "old_value": "inf" if old_dist_v == float("inf") else round(old_dist_v, 2),
                    "candidate_value": round(new_dist, 2),
                    "new_value": round(dist[v], 2),
                    "old_raw": "inf" if old_raw_v == float("inf") else round(old_raw_v, 2),
                    "candidate_raw": round(new_raw, 2),
                    "new_raw": round(raw_dist[v], 2),
                    "old_parent": old_prev_v,
                    "new_parent": u,
                    "note": "Distance improved, so we relax the edge and update predecessor.",
                })
                # Track visited nodes (order of first relaxation)
                if v not in visited_set:
                    visited_set.add(v)
                    visited.append(v)
            else:
                comparisons.append({
                    "kind": "edge_check",
                    "edge": {
                        "from": u,
                        "to": v,
                        "time_cost": round(time_cost, 2),
                        "physical_distance": round(phys_dist, 2),
                    },
                    "updated": False,
                    "old_value": "inf" if old_dist_v == float("inf") else round(old_dist_v, 2),
                    "candidate_value": round(new_dist, 2),
                    "new_value": "inf" if old_dist_v == float("inf") else round(old_dist_v, 2),
                    "old_raw": "inf" if old_raw_v == float("inf") else round(old_raw_v, 2),
                    "candidate_raw": round(new_raw, 2),
                    "new_raw": "inf" if old_raw_v == float("inf") else round(old_raw_v, 2),
                    "old_parent": old_prev_v,
                    "new_parent": old_prev_v,
                    "note": "No update: the candidate distance is not smaller than the current best-known distance.",
                })

        step_counter += 1

        why = (
            f"Bellman-Ford performs repeated relaxation. In pass {round_num} of {V-1}, the algorithm checks every edge (u→v) "
            f"to see whether dist[u] + w(u,v) improves dist[v]."
        )
        updates_count = len(round_updates)
        summary = (
            f"End of pass {round_num}: examined {len(comparisons)} edge(s). "
            f"{updates_count} improvement(s) were found. "
            + ("At least one value changed, so we continue to the next pass." if relaxed_any else "No values changed, so the solution has stabilized and we can stop early.")
        )
        changed_nodes = [u.get("node") for u in round_updates][:24]

        preview_nodes = list(dict.fromkeys([start, end] + changed_nodes))[:12]
        dist_preview = {}
        parent_preview = {}
        for n in preview_nodes:
            dv = dist.get(n, float("inf"))
            dist_preview[n] = "inf" if dv == float("inf") else round(dv, 2)
            parent_preview[n] = prev.get(n)

        exploration_order.append({
            "step": step_counter,
            "node": f"round_{round_num}",
            "distance": 0,
            "round_num": round_num,
            "action": "relax_round",
            "active_line": 2, # Round expansion
            "explanation": why,
            "math_breakdown": {
                "pass": round_num,
                "edges_checked": len(comparisons),
                "updates_found": len(round_updates),
            },
            "description": (
                f"Pass {round_num}: Check every edge and relax any that improves a distance (Bellman-Ford)."
            ),
            "neighbors_updated": round_updates,
            "narration": {
                "action_title": f"Pass {round_num}: Relax all edges once",
                "action_subtitle": "Bellman-Ford does not pick a 'best next node'. It repeatedly checks every edge for improvements.",
                "why": why,
                "comparisons": comparisons,
                "summary": summary,
                "state_after": {
                    "pass_num": round_num,
                    "passes_total": V - 1,
                    "updates_in_step": updates_count,
                    "changed_nodes": changed_nodes,
                    "dist_preview": dist_preview,
                    "parent_preview": parent_preview,
                },
            },
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
            "narration": e.get("narration"),
        }
        for e in exploration_order
    ]
