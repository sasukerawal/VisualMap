export const PSEUDOCODE = {
    dijkstra: [
        { line: 1, text: "Initialize dist[start]=0, others=∞" },
        { line: 2, text: "Push start node into PriorityQueue" },
        { line: 3, text: "while PriorityQueue is not empty:" },
        { line: 4, text: "  Pop node 'u' with smallest distance" },
        { line: 5, text: "  if 'u' is destination, stop" },
        { line: 6, text: "  for each neighbor 'v' of 'u':" },
        { line: 7, text: "    if dist[u] + weight(u,v) < dist[v]:" },
        { line: 8, text: "      Update dist[v] and Push 'v' to queue" }
    ],
    astar: [
        { line: 1, text: "Initialize g[start]=0, f[start]=h(start)" },
        { line: 2, text: "Push start node into PriorityQueue" },
        { line: 3, text: "while PriorityQueue is not empty:" },
        { line: 4, text: "  Pop node 'u' with smallest f(u) = g(u)+h(u)" },
        { line: 5, text: "  if 'u' is goal, stop" },
        { line: 6, text: "  for each neighbor 'v' of 'u':" },
        { line: 7, text: "    if new_g(v) < g[v]:" },
        { line: 8, text: "      Update g[v], f[v] and Push 'v'" }
    ],
    bellman_ford: [
        { line: 1, text: "Initialize distances[start]=0, others=∞" },
        { line: 2, text: "for i from 1 to |V|-1:" },
        { line: 3, text: "  for each edge (u, v) in graph:" },
        { line: 4, text: "    if distance[u] + weight < distance[v]:" },
        { line: 5, text: "      Relax: distance[v] = dist[u] + weight" },
        { line: 6, text: "Check for negative weight cycles" }
    ]
};
