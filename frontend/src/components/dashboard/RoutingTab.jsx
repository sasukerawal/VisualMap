import { useMemo } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { NODES, displayNodeName } from '../../data/townGraph';

function euclid(a, b) {
    const pa = NODES[a]?.pos;
    const pb = NODES[b]?.pos;
    if (!pa || !pb) return null;
    const dx = (pa[0] ?? 0) - (pb[0] ?? 0);
    const dz = (pa[2] ?? 0) - (pb[2] ?? 0);
    return Math.sqrt(dx * dx + dz * dz);
}

export function RoutingTab() {
    const { routeResult, orderMode, destinations, learningMode } = useStore(
        (s) => ({
            routeResult: s.routeResult,
            orderMode: s.orderMode,
            destinations: s.destinations,
            learningMode: s.learningMode,
        }),
        shallow
    );

    const stops = useMemo(() => {
        const segs = routeResult?.segments;
        if (!Array.isArray(segs) || !segs.length) return null;
        const arr = [segs[0]?.from].filter(Boolean);
        for (const s of segs) {
            if (s?.to) arr.push(s.to);
        }
        return arr;
    }, [routeResult?.segments]);

    const showMatrix = learningMode !== 'beginner';
    const showDetails = learningMode === 'advanced' || learningMode === 'professor';

    if (!routeResult || !stops) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '6px 0' }}>
                <div className="card" style={{ borderRadius: 16, padding: '14px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Multi-stop routing</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#93a6c3', lineHeight: 1.55 }}>
                        Start navigation to compute a route. This tab explains how stop ordering works and how routes are assembled across stops.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '6px 0' }}>
            <div className="card" style={{ borderRadius: 16, padding: '14px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Route overview</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                            <strong style={{ color: '#eef2ff' }}>Order mode:</strong> {orderMode === 'optimized' ? 'Optimized (nearest-neighbor)' : 'Manual'}
                            {' '}• <strong style={{ color: '#eef2ff' }}>Stops:</strong> {destinations.length}
                        </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#d6f9ff' }}>
                        total={routeResult.total_distance?.toFixed?.(2) ?? routeResult.total_distance}
                    </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {routeResult.segments.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '10px 10px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {idx + 1}. {displayNodeName(s.from)} → {displayNodeName(s.to)}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9fb0ca' }}>
                                {typeof s.distance === 'number' ? s.distance.toFixed(2) : s.distance}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 12, fontSize: 11, color: '#93a6c3', lineHeight: 1.55 }}>
                    {orderMode === 'optimized'
                        ? 'Optimized ordering uses a simple nearest-neighbor idea: from the current stop, pick the next unvisited stop with the smallest estimated travel cost.'
                        : 'Manual ordering respects the order you clicked stops. The route is computed segment-by-segment in that sequence.'}
                </div>
            </div>

            {showMatrix && (
                <div className="card" style={{ borderRadius: 16, padding: '14px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Distance matrix (heuristic)</div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#93a6c3', lineHeight: 1.55 }}>
                        Straight-line distances between stops (useful for intuition). The actual route uses road-network shortest paths.
                    </div>

                    <div style={{ overflowX: 'auto', marginTop: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>From \\ To</th>
                                    {stops.slice(0, 10).map((b) => (
                                        <th key={b} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 10, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                                            {displayNodeName(b)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stops.slice(0, 10).map((a) => (
                                    <tr key={a}>
                                        <td style={{ padding: '9px 10px', fontSize: 11, fontWeight: 900, color: '#eef2ff', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                                            {displayNodeName(a)}
                                        </td>
                                        {stops.slice(0, 10).map((b) => {
                                            const d = euclid(a, b);
                                            return (
                                                <td key={b} style={{ padding: '9px 10px', fontSize: 11, color: '#cbd5e1', borderBottom: '1px solid rgba(148,163,184,0.08)', fontFamily: 'var(--font-mono)' }}>
                                                    {a === b ? '—' : d == null ? '—' : d.toFixed(2)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showDetails && (
                <div className="card" style={{ borderRadius: 16, padding: '14px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Constraints (future-proof)</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#93a6c3', lineHeight: 1.55 }}>
                        Multi-stop routing generalizes VRP/TSP. This UI slot can later show constraints like capacity, time windows, or “must visit” badges per stop.
                    </div>
                </div>
            )}
        </div>
    );
}

