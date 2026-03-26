/**
 * TablesTab — Mission-control view of the algorithm's internal structures.
 * Replaces dense HTML tables with a more visual layout:
 * - Delivery manifest (stops + status)
 * - Best-known costs + predecessor tree snapshot
 * - Frontier (priority queue) as ranked cards
 */
import { useMemo } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { displayNodeName } from '../../data/townGraph';

export function TablesTab() {
    const {
        stepsResult,
        algorithm,
        currentStepIndex,
        learningMode,
        destinations,
        deliveredNodes,
        currentSegment,
        routeResult,
        isPlaying,
    } = useStore(
        (s) => ({
            stepsResult: s.stepsResult,
            algorithm: s.algorithm,
            currentStepIndex: s.currentStepIndex,
            learningMode: s.learningMode,
            destinations: s.destinations,
            deliveredNodes: s.deliveredNodes,
            currentSegment: s.currentSegment,
            routeResult: s.routeResult,
            isPlaying: s.isPlaying,
        }),
        shallow
    );

    if (!stepsResult?.steps?.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', gap: 16 }}>
                <div style={{ fontSize: '40px', opacity: 0.5 }}>📊</div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#eef2fb' }}>State Space Standby</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', maxWidth: 220 }}>
                        Internal data structures will populate here once the simulation begins.
                    </p>
                </div>
            </div>
        );
    }

    const derived = useMemo(() => {
        const stepsUpTo = stepsResult.steps.slice(0, currentStepIndex + 1);
        const visitedOrder = [];

        const timeMap = {};
        const rawMap = {};
        const fuelMap = {};
        const hMap = {};
        const fMap = {};
        const fFuelMap = {};
        const edgeToMap = {};
        const openSet = new Map();

        const setBest = (map, key, val) => {
            if (val == null) return;
            if (map[key] == null || val < map[key]) map[key] = val;
        };

        for (let stepIdx = 0; stepIdx < stepsUpTo.length; stepIdx += 1) {
            const step = stepsUpTo[stepIdx];
            const u = step.node;
            if (!visitedOrder.includes(u)) visitedOrder.push(u);
            openSet.delete(u);

            if (step.distance != null) timeMap[u] = step.distance;
            if (step.raw_distance != null) rawMap[u] = step.raw_distance;
            if (step.fuel_cost != null) fuelMap[u] = step.fuel_cost;
            if (step.heuristic != null) hMap[u] = step.heuristic;
            if (step.f_score != null) fMap[u] = step.f_score;
            if (step.f_fuel != null) fFuelMap[u] = step.f_fuel;

            const nbs = step.neighbors_updated || [];
            for (const nb of nbs) {
                const v = nb.node;
                if (!v) continue;

                const score = nb.f ?? nb.new_dist ?? nb.g ?? 0;
                if (!openSet.has(v) || score < (openSet.get(v)?.score ?? Infinity)) {
                    openSet.set(v, { score, label: displayNodeName(v) });
                }

                if (nb.relaxed) {
                    edgeToMap[v] = displayNodeName(nb.from_node ?? u);
                    if (nb.new_dist != null) setBest(timeMap, v, nb.new_dist);
                    if (nb.new_raw_dist != null) setBest(rawMap, v, nb.new_raw_dist);
                    if (nb.new_fuel_cost != null) setBest(fuelMap, v, nb.new_fuel_cost);
                    if (nb.h != null) hMap[v] = nb.h;
                    if (nb.f != null) {
                        if (algorithm === 'astar') fFuelMap[v] = nb.f;
                        else fMap[v] = nb.f;
                    }
                }
            }

            // If the backend provides a queue snapshot (optional), prefer it for frontier order.
            if (Array.isArray(step.queue) && step.queue.length > 0 && stepIdx === currentStepIndex) {
                openSet.clear();
                step.queue.forEach((item) => {
                    const id = Array.isArray(item) ? item[0] : item;
                    const score = Array.isArray(item) ? item[1] : timeMap[id];
                    openSet.set(id, { score: score ?? 0, label: displayNodeName(id) });
                });
            }
        }

        const sortedOpenSet = [...openSet.entries()].sort((a, b) => (a[1].score ?? Infinity) - (b[1].score ?? Infinity));
        const currentNode = stepsUpTo[stepsUpTo.length - 1]?.node;
        return { stepsUpTo, visitedOrder, timeMap, rawMap, fuelMap, hMap, fMap, fFuelMap, edgeToMap, sortedOpenSet, currentNode };
    }, [stepsResult, currentStepIndex, algorithm]);

    const isBeginner = learningMode === 'beginner';
    const isAstar = algorithm === 'astar';

    const fmt = (n, digits = 1, suffix = '') =>
        typeof n === 'number' && Number.isFinite(n) ? `${n.toFixed(digits)}${suffix}` : '—';

    const stops = ['warehouse', ...(destinations || [])];
    const liveSeg = Math.min(Math.max(currentSegment || 0, 0), Math.max(stops.length - 2, 0));
    const liveFrom = stops[liveSeg];
    const liveTo = stops[liveSeg + 1];

    return (
        <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 6, overflowY: 'auto', height: '100%', minHeight: 0 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 14px',
                    borderRadius: 16,
                    border: '1px solid rgba(148,163,184,0.14)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#9fc7ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Mission Control
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, fontWeight: 850, color: '#eef2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayNodeName(liveFrom)} → {displayNodeName(liveTo)}
                    </div>
                    {derived.currentNode && (
                        <div style={{ marginTop: 6, fontSize: 11, color: '#93a6c3' }}>
                            Focus: <span style={{ color: '#dbeafe', fontWeight: 850 }}>{displayNodeName(derived.currentNode)}</span>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexShrink: 0 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(34,211,238,0.18)', background: 'rgba(34,211,238,0.06)', minWidth: 120 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Steps</div>
                        <div style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 850, color: '#d6f9ff' }}>
                            {currentStepIndex + 1} / {stepsResult.steps.length}
                        </div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(251,191,36,0.18)', background: 'rgba(251,191,36,0.06)', minWidth: 120 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Frontier</div>
                        <div style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 850, color: '#fde68a' }}>
                            {derived.sortedOpenSet.length}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isBeginner ? '1fr' : '1.05fr 1.25fr', gap: 12, minHeight: 0 }}>
                <section
                    style={{
                        borderRadius: 16,
                        border: '1px solid rgba(148,163,184,0.14)',
                        background: 'linear-gradient(180deg, rgba(14,22,36,0.92), rgba(9,15,26,0.88))',
                        overflow: 'hidden',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#eef2ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Delivery Manifest
                        </div>
                        <div style={{ marginTop: 4, fontSize: 11, color: '#7f93b2' }}>
                            Stops, delivery status, and what the algorithm is optimizing.
                        </div>
                    </div>
                    <div className="custom-scroll" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                        {stops.map((id, idx) => {
                            const isWarehouse = idx === 0;
                            const isReturnLeg = (destinations?.length || 0) > 0 && (routeResult?.segments?.length || 0) === (destinations.length + 1) && (currentSegment === destinations.length);
                            const isDelivered = !isWarehouse && deliveredNodes.includes(id);
                            const isNext = (!isWarehouse && idx === (currentSegment || 0) + 1) || (isWarehouse && isReturnLeg && isPlaying);
                            return (
                                <div
                                    key={id + idx}
                                    style={{
                                        borderRadius: 14,
                                        padding: '10px 12px',
                                        border: `1px solid ${isNext ? 'rgba(34,211,238,0.22)' : 'rgba(148,163,184,0.12)'}`,
                                        background: isNext ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 10, fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                            {isWarehouse ? 'Origin' : `Stop ${idx}`}
                                        </div>
                                        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: '#eef2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {displayNodeName(id)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        {isDelivered ? (
                                            <span style={{ fontSize: 11, fontWeight: 900, color: '#86efac' }}>Delivered</span>
                                        ) : isWarehouse && isNext ? (
                                            <span style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9' }}>Returning</span>
                                        ) : isNext ? (
                                            <span style={{ fontSize: 11, fontWeight: 900, color: '#67e8f9' }}>In Progress</span>
                                        ) : (
                                            <span style={{ fontSize: 11, fontWeight: 900, color: '#93a6c3' }}>Queued</span>
                                        )}
                                        <div style={{ width: 10, height: 10, borderRadius: 999, background: isDelivered ? '#22c55e' : isNext ? '#22d3ee' : '#475569' }} />
                                    </div>
                                </div>
                            );
                        })}

                        <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Optimization Target
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: '#dbeafe', fontWeight: 850 }}>
                                {algorithm === 'astar' ? 'Fuel (with slope)' : 'Time (fastest ETA)'}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 11, color: '#7f93b2', lineHeight: 1.5 }}>
                                {algorithm === 'astar'
                                    ? 'A* minimizes a fuel proxy: distance plus uphill penalty (downhill saves a bit).'
                                    : 'Dijkstra / Bellman-Ford minimize total transit time using speed limits (main roads are faster).'
                                }
                            </div>
                        </div>
                    </div>
                </section>

                {!isBeginner && (
                    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
                        <div
                            style={{
                                borderRadius: 16,
                                border: '1px solid rgba(148,163,184,0.14)',
                                background: 'linear-gradient(180deg, rgba(14,22,36,0.92), rgba(9,15,26,0.88))',
                                overflow: 'hidden',
                                minHeight: 0,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: '#eef2ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Best-Known Costs (distTo / edgeTo)
                                </div>
                                <div style={{ marginTop: 4, fontSize: 11, color: '#7f93b2' }}>
                                    Snapshot of what the algorithm currently believes is optimal so far.
                                </div>
                            </div>

                            <div className="custom-scroll" style={{ overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: isAstar ? '1.35fr 0.8fr 0.8fr 0.8fr 1fr' : '1.6fr 1fr 1fr 1fr', gap: 0, padding: '10px 12px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                                    <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vertex</div>
                                    {isAstar ? (
                                        <>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Time</div>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Dist</div>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Fuel</div>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>edgeTo</div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Time</div>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Dist</div>
                                            <div style={{ fontSize: 9, fontWeight: 900, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>edgeTo</div>
                                        </>
                                    )}
                                </div>

                                {derived.visitedOrder.map((id, idx) => {
                                    const isLatest = idx === derived.visitedOrder.length - 1;
                                    return (
                                        <div
                                            key={id}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: isAstar ? '1.35fr 0.8fr 0.8fr 0.8fr 1fr' : '1.6fr 1fr 1fr 1fr',
                                                padding: '10px 12px',
                                                borderBottom: '1px solid rgba(148,163,184,0.06)',
                                                background: isLatest ? 'rgba(34,211,238,0.06)' : 'transparent',
                                                gap: 0,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div style={{ minWidth: 0, fontWeight: 850, color: isLatest ? '#67e8f9' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {displayNodeName(id)}
                                            </div>
                                            {isAstar ? (
                                                <>
                                                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{fmt(derived.timeMap[id], 1, 's')}</div>
                                                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{fmt(derived.rawMap[id], 1, 'u')}</div>
                                                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#fde68a' }}>{fmt(derived.fuelMap[id], 1, '')}</div>
                                                    <div style={{ textAlign: 'right', fontSize: 11, color: '#93a6c3' }}>{idx === 0 ? 'START' : (derived.edgeToMap[id] || '—')}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{fmt(derived.timeMap[id], 1, 's')}</div>
                                                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{fmt(derived.rawMap[id], 1, 'u')}</div>
                                                    <div style={{ textAlign: 'right', fontSize: 11, color: '#93a6c3' }}>{idx === 0 ? 'START' : (derived.edgeToMap[id] || '—')}</div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            style={{
                                borderRadius: 16,
                                border: '1px solid rgba(148,163,184,0.14)',
                                background: 'linear-gradient(180deg, rgba(14,22,36,0.92), rgba(9,15,26,0.88))',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                                <div style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Frontier (Priority Queue)
                                </div>
                                <div style={{ marginTop: 4, fontSize: 11, color: '#7f93b2' }}>
                                    Next candidates ranked by priority. Top card is the likely next expansion.
                                </div>
                            </div>
                            <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                                {derived.sortedOpenSet.slice(0, 8).map(([nodeId, info], i) => {
                                    const isNext = i === 0;
                                    return (
                                        <div
                                            key={nodeId}
                                            style={{
                                                borderRadius: 16,
                                                padding: '12px 12px',
                                                border: `1px solid ${isNext ? 'rgba(251,191,36,0.30)' : 'rgba(148,163,184,0.12)'}`,
                                                background: isNext ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                                                boxShadow: isNext ? '0 18px 40px rgba(251,191,36,0.12)' : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                                                <div style={{ fontSize: 10, fontWeight: 900, color: isNext ? '#fbbf24' : '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {isNext ? 'Next' : `#${i + 1}`}
                                                </div>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 850, color: '#e2e8f0' }}>
                                                    {fmt(info.score, 1)}
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: '#eef2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {info.label}
                                            </div>
                                            <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.12)', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.max(10, 100 - i * 11)}%`,
                                                    height: '100%',
                                                    background: isNext ? 'linear-gradient(90deg, rgba(251,191,36,0.9), rgba(34,211,238,0.6))' : 'linear-gradient(90deg, rgba(148,163,184,0.45), rgba(148,163,184,0.12))',
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {derived.sortedOpenSet.length === 0 && (
                                    <div style={{ padding: 14, fontSize: 12, color: '#7f93b2' }}>Frontier is empty for this step.</div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
