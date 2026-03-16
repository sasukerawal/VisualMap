import React from 'react';

const ALGO_PSEUDOCODE = {
    dijkstra: [
        { line: 'function Dijkstra(graph, start):', indent: 0 },
        { line: '  for each node n in graph:', indent: 0 },
        { line: '    dist[n] = infinity, prev[n] = undefined', indent: 0 },
        { line: '    priority_queue.add(n, dist[n])', indent: 0 },
        { line: '  dist[start] = 0', indent: 0 },
        { line: '  while priority_queue is not empty:', indent: 0 },
        { line: '    u = priority_queue.extract_min()', indent: 1 },
        { line: '    for each neighbor v of u:', indent: 1 },
        { line: '      alt = dist[u] + weight(u, v)', indent: 2 },
        { line: '      if alt < dist[v]:', indent: 2 },
        { line: '        dist[v] = alt, prev[v] = u', indent: 3 },
        { line: '        priority_queue.decrease_priority(v, alt)', indent: 3 }
    ],
    astar: [
        { line: 'function AStar(graph, start, goal):', indent: 0 },
        { line: '  openSet = {start}', indent: 0 },
        { line: '  gScore[start] = 0', indent: 0 },
        { line: '  fScore[start] = h(start)', indent: 0 },
        { line: '  while openSet is not empty:', indent: 0 },
        { line: '    u = node in openSet with lowest fScore', indent: 1 },
        { line: '    if u == goal: return reconstruct_path(u)', indent: 1 },
        { line: '    for each neighbor v of u:', indent: 1 },
        { line: '      tentative_g = gScore[u] + weight(u, v)', indent: 2 },
        { line: '      if tentative_g < gScore[v]:', indent: 2 },
        { line: '        prev[v] = u, gScore[v] = tentative_g', indent: 3 },
        { line: '        fScore[v] = gScore[v] + h(v)', indent: 3 },
        { line: '        if v not in openSet: openSet.add(v)', indent: 3 }
    ],
    bellman_ford: [
        { line: 'function BellmanFord(graph, start):', indent: 0 },
        { line: '  dist[start] = 0', indent: 0 },
        { line: '  for i from 1 to |V| - 1:', indent: 0 },
        { line: '    for each edge (u, v) with weight w:', indent: 1 },
        { line: '      if dist[u] + w < dist[v]:', indent: 2 },
        { line: '        dist[v] = dist[u] + w, prev[v] = u', indent: 3 },
        { line: '  for each edge (u, v) with weight w:', indent: 0 },
        { line: '    if dist[u] + w < dist[v]: error "Negative cycle"', indent: 1 }
    ]
};

// Map simulation states to pseudocode line indices
const STEP_MAP = {
    'dijkstra': { 'extract': 6, 'relax': 10 },
    'astar': { 'extract': 5, 'relax': 11 },
    'bellman_ford': { 'relax': 5 }
};

export default function PseudocodeViewer({ algorithm, currentStep, simpleMode = false }) {
    const lines = ALGO_PSEUDOCODE[algorithm] || [];
    const activeMapping = STEP_MAP[algorithm] || {};

    // Determine which line to highlight based on step action
    let activeLineIndex = -1;
    if (currentStep?.action === 'extract') activeLineIndex = activeMapping.extract;
    else if (currentStep?.action === 'relax' || currentStep?.neighbors_updated) activeLineIndex = activeMapping.relax;

    const baseStyle = {
        fontFamily: '"JetBrains Mono", monospace',
        color: '#94a3b8',
        fontSize: '12px',
        lineHeight: 1.5,
        overflow: 'hidden',
        position: 'relative',
        height: '100%'
    };

    const containerStyle = simpleMode ? { ...baseStyle, padding: '12px' } : {
        ...baseStyle,
        background: 'rgba(10, 15, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    };

    return (
        <div style={containerStyle}>
            {!simpleMode && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    padding: '8px 16px', background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                    color: '#6366f1', letterSpacing: '1px'
                }}>
                    Source Execution: {algorithm.replace('_', ' ')}
                </div>
            )}

            <div style={{ marginTop: simpleMode ? '0' : '24px', overflowY: 'auto', height: '100%', scrollbarWidth: 'none' }}>
                {lines.map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: '1px 8px',
                            borderRadius: 4,
                            background: activeLineIndex === idx ? 'rgba(34, 211, 238, 0.12)' : 'transparent',
                            color: activeLineIndex === idx ? '#fff' : 'inherit',
                            borderLeft: activeLineIndex === idx ? '2px solid #06b6d4' : '2px solid transparent',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'pre',
                            opacity: activeLineIndex === -1 || activeLineIndex === idx ? 1 : 0.4,
                            fontSize: '11px'
                        }}
                    >
                        <span style={{ opacity: 0.2, marginRight: 8, fontSize: '9px', display: 'inline-block', width: '12px' }}>
                            {idx + 1}
                        </span>
                        {item.line}
                    </div>
                ))}
            </div>
        </div>
    );
}
