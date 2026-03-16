import React, { useMemo } from 'react';

const ALGO_PSEUDOCODE = {
    dijkstra: [
        { no: 1, line: 'function Dijkstra(graph, start):' },
        { no: 2, line: '  dist[*] = ∞; prev[*] = undefined; dist[start] = 0' },
        { no: 3, line: '  heap.push(0, start)' },
        { no: 4, line: '  while heap not empty:' },
        { no: 5, line: '    (d, u) = heap.pop_min()   // settle u' },
        { no: 6, line: '    if u == goal: break' },
        { no: 7, line: '    for each neighbor v of u:' },
        { no: 8, line: '      new = dist[u] + time_cost(u, v)' },
        { no: 9, line: '      if new < dist[v]:' },
        { no: 10, line: '        dist[v] = new; prev[v] = u; heap.push(new, v)' },
    ],
    astar: [
        { no: 1, line: 'function AStarFuel(graph, start, goal):' },
        { no: 2, line: '  gFuel[*]=∞; gTime[*]=∞; gDist[*]=∞; prev[*]=undefined' },
        { no: 3, line: '  gFuel[start]=0; gTime[start]=0; gDist[start]=0' },
        { no: 4, line: '  open.push(fFuel(start)=hDist(start), start)' },
        { no: 5, line: '  while open not empty:' },
        { no: 6, line: '    u = open.pop_min_fFuel()' },
        { no: 7, line: '    if u == goal: return reconstruct_path(u)' },
        { no: 8, line: '    for each neighbor v of u:' },
        { no: 9, line: '      edgeFuel = dist(u,v) * slopeMultiplier(elev(u→v))' },
        { no: 10, line: '      if gFuel[u] + edgeFuel < gFuel[v]:' },
        { no: 11, line: '        prev[v]=u; update gFuel/gTime/gDist; push(open, fFuel=v)' },
    ],
    bellman_ford: [
        { no: 1, line: 'function BellmanFord(graph, start):' },
        { no: 2, line: '  dist[*]=∞; prev[*]=undefined; dist[start]=0' },
        { no: 3, line: '  for round in 1..|V|-1:' },
        { no: 4, line: '    for each edge (u,v):' },
        { no: 5, line: '      if dist[u] + time_cost(u,v) < dist[v]:' },
        { no: 6, line: '        dist[v]=dist[u]+time_cost; prev[v]=u' },
        { no: 7, line: '  extra pass: if any edge relaxes → negative cycle' },
    ]
};

export default function PseudocodeViewer({ algorithm, currentStep, simpleMode = false }) {
    const lines = ALGO_PSEUDOCODE[algorithm] || [];

    const activeLineNo = useMemo(() => {
        if (typeof currentStep?.active_line === 'number') return currentStep.active_line;
        // Fallbacks if older steps don’t have active_line.
        if (algorithm === 'dijkstra') return 5;
        if (algorithm === 'astar') return 6;
        if (algorithm === 'bellman_ford') return 3;
        return null;
    }, [currentStep?.active_line, algorithm]);

    const explanation = currentStep?.explanation || currentStep?.description || '';
    const math = currentStep?.math_breakdown || null;

    const formatNumber = (n, digits = 2) =>
        typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : null;

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
                {!simpleMode && explanation && (
                    <div style={{
                        marginBottom: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(34,211,238,0.08)',
                        border: '1px solid rgba(34,211,238,0.18)',
                        color: '#d9fbff',
                        fontSize: 11,
                        lineHeight: 1.5,
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 650,
                    }}>
                        {explanation}
                        {algorithm === 'astar' && typeof currentStep?.fuel_cost === 'number' && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#b7c7e6' }}>
                                <span>time={formatNumber(currentStep.distance, 2) ?? '—'}s</span>
                                <span>dist={formatNumber(currentStep.raw_distance, 2) ?? '—'}u</span>
                                <span>fuel={formatNumber(currentStep.fuel_cost, 2) ?? '—'}</span>
                                <span>f_fuel={formatNumber(currentStep.f_fuel, 2) ?? '—'}</span>
                            </div>
                        )}
                    </div>
                )}

                {!simpleMode && math && (
                    <div style={{
                        marginBottom: 12,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(148,163,184,0.14)',
                        fontSize: 10,
                        color: '#cbd5e1',
                    }}>
                        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fb0ca', marginBottom: 6 }}>
                            Math Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: '"JetBrains Mono", monospace' }}>
                            {Object.entries(math).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                    <span style={{ color: '#8ea3c2' }}>{k}</span>
                                    <span>{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {lines.map((item) => {
                    const isActive = activeLineNo != null && item.no === activeLineNo;
                    const dim = activeLineNo != null && !isActive;
                    return (
                        <div
                            key={item.no}
                            style={{
                                padding: '2px 10px',
                                borderRadius: 8,
                                background: isActive ? 'rgba(34, 211, 238, 0.12)' : 'transparent',
                                color: isActive ? '#fff' : 'inherit',
                                borderLeft: isActive ? '3px solid #06b6d4' : '3px solid transparent',
                                transition: 'all 0.18s ease',
                                whiteSpace: 'pre',
                                opacity: dim ? 0.35 : 1,
                                fontSize: '11px'
                            }}
                        >
                            <span style={{ opacity: 0.22, marginRight: 10, fontSize: '9px', display: 'inline-block', width: 18 }}>
                                {item.no}
                            </span>
                            {item.line}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
