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
    settled: set = set()
    exploration_order = []
    step_counter = 0

    # Line 3: Process priority queue
    while heap:
        d, u = heapq.heappop(heap)

        # Skip if we already found a better path
        if d > dist[u]:
            continue

        visited.append(u)
        settled.add(u)
        step_counter += 1

        neighbors_updated = []  # backwards-compatible (only updates)
        comparisons = []        # v2 narration (updates + non-updates)
        # Line 5: Check neighbors
        for v, time_cost, phys_dist in graph.get(u, []):
            # Line 6: Calculate tentative distance
            old_dist_v = dist[v]
            old_raw_v = raw_dist[v]
            old_prev_v = prev[v]
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
                comparisons.append({
                    "kind": "edge_relaxation",
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
                    "note": "Tentative distance improved, so we update dist[v] and predecessor.",
                })
            else:
                comparisons.append({
                    "kind": "edge_relaxation",
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
                    "note": "No update: the candidate path is not better than the current best-known distance.",
                })

        # Record step metadata
        # Compact frontier snapshot (top-k unsettled by tentative distance).
        frontier = sorted(
            [(dist[n], n) for n in graph if n not in settled and dist[n] != float("inf")],
            key=lambda x: x[0],
        )[:8]
        frontier_nodes = [n for _, n in frontier]
        preview_nodes = list(dict.fromkeys([u] + [c.get("edge", {}).get("to") for c in comparisons if c.get("edge")] + frontier_nodes))[:12]
        dist_preview = {}
        parent_preview = {}
        for n in preview_nodes:
            dv = dist.get(n, float("inf"))
            dist_preview[n] = "inf" if dv == float("inf") else round(dv, 2)
            parent_preview[n] = prev.get(n)

        # Some internal nodes (e.g. driveways) may have an empty label; fall back to node id.
        node_label = (NODES.get(u, {}) or {}).get("label") or u
        why = (
            f"We choose vertex {node_label} because it has the smallest tentative distance among all unsettled vertices "
            f"in the priority queue. This makes {node_label} a settled vertex: its shortest distance from the start is now confirmed."
        )
        updates_count = sum(1 for c in comparisons if c.get("updated"))
        no_updates_count = len(comparisons) - updates_count
        summary = (
            f"End of step: settled {node_label}. Relaxed {len(comparisons)} outgoing edge(s): "
            f"{updates_count} update(s) and {no_updates_count} no-change comparison(s). "
            f"Next, Dijkstra will settle the unsettled vertex with the smallest tentative distance in the frontier."
        )

        exploration_order.append({
            "step": step_counter,
            "node": u,
            "distance": round(d, 2), # time cost
            "raw_distance": round(raw_dist[u], 2), # physical dist
            "action": "settle",
            "active_line": 3, # Pop node
            "explanation": why,
            "math_breakdown": {
                "tentative_distance(u)": round(d, 2),
                "settled_vertices": len(settled),
                "frontier_size": len(frontier),
            },
            "description": (
                f"Step {step_counter}: Settle {node_label} (Dijkstra). Compare all outgoing edges and relax any that improve tentative distances."
            ),
            "neighbors_updated": neighbors_updated,
            "narration": {
                "action_title": f"Step {step_counter}: Settle vertex {node_label}",
                "action_subtitle": "Dijkstra selects the unsettled vertex with the smallest tentative distance, then relaxes its outgoing edges.",
                "why": why,
                "comparisons": comparisons,
                "summary": summary,
                "state_after": {
                    "settled": list(visited)[-24:],  # keep small
                    "unsettled_frontier": [{"node": n, "key": round(k, 2)} for k, n in frontier],
                    "updates_in_step": updates_count,
                    "changed_nodes": [c.get("edge", {}).get("to") for c in comparisons if c.get("updated")][:12],
                    "dist_preview": dist_preview,
                    "parent_preview": parent_preview,
                },
            },
        })

        # Line 4: Check if goal
        if u == end:
            exploration_order[-1]["active_line"] = 4
            exploration_order[-1]["explanation"] = (
                f"Goal check: we settled {node_label}, and it is the destination. "
                f"Because Dijkstra only settles a vertex when its shortest distance is confirmed, "
                f"the optimal time is now proven to be {d:.2f}s."
            )
            if exploration_order[-1].get("narration"):
                exploration_order[-1]["narration"]["action_title"] = f"Step {step_counter}: Goal reached at {node_label}"
                exploration_order[-1]["narration"]["action_subtitle"] = "The destination vertex becomes settled, so the shortest path is confirmed."
                exploration_order[-1]["narration"]["summary"] = (
                    f"End of step: destination settled. The shortest path from start to {node_label} is now confirmed."
                )
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
            "narration": e.get("narration"),
        }
        for e in exploration_order
    ]
