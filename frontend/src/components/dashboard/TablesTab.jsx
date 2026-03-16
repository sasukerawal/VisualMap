/**
 * TablesTab — Live-updating data structures for educational transparency.
 * Mirrors classic CS slides (distTo[], edgeTo[]) for algorithm visualization.
 */
import useStore from '../../store/useStore';
import { NODES, displayNodeName } from '../../data/townGraph';

export function TablesTab() {
    const { stepsResult, algorithm, currentStepIndex, learningMode } = useStore();

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

    const stepsUpTo = stepsResult.steps.slice(0, currentStepIndex + 1);
    const visitedOrder = [];
    const distMap = {};
    const hMap = {};
    const fMap = {};
    const edgeToMap = {};
    const openSet = new Map();

    stepsUpTo.forEach((step, stepIdx) => {
        const u = step.node;
        if (!visitedOrder.includes(u)) visitedOrder.push(u);
        openSet.delete(u);

        if (step.distance != null) distMap[u] = step.distance;
        if (step.heuristic != null) hMap[u] = step.heuristic;
        if (step.f_score != null) fMap[u] = step.f_score;

        step.neighbors_updated?.forEach(nb => {
            const v = nb.node;
            const score = nb.f ?? nb.new_dist ?? nb.g;
            if (!visitedOrder.includes(v) || openSet.has(v)) {
                if (!openSet.has(v) || score < (openSet.get(v)?.score ?? Infinity)) {
                    openSet.set(v, { score, label: NODES[v]?.label || v });
                }
            }
            if (nb.new_dist != null && (distMap[v] === undefined || nb.new_dist < distMap[v])) {
                distMap[v] = nb.new_dist;
                const sourceLabel = displayNodeName(u);
                edgeToMap[v] = sourceLabel;
            }
        });

        if (step.queue?.length > 0 && stepIdx === currentStepIndex) {
            openSet.clear();
            step.queue.forEach(item => {
                const id = Array.isArray(item) ? item[0] : item;
                const score = Array.isArray(item) ? item[1] : distMap[id];
                openSet.set(id, { score: score ?? 0, label: NODES[id]?.label || id });
            });
        }
    });

    const sortedOpenSet = [...openSet.entries()]
        .sort((a, b) => (a[1].score ?? Infinity) - (b[1].score ?? Infinity));

    const isBeginner = learningMode === 'beginner';
    const isAstar = algorithm === 'astar';
    const currentNode = stepsUpTo[stepsUpTo.length - 1]?.node;

    const headerCellStyle = {
        padding: '10px 12px', fontSize: '9px', fontWeight: 800, color: '#7a8aaa',
        textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid rgba(255,255,255,0.06)'
    };

    const cellStyle = (right) => ({
        padding: '10px 12px', fontSize: '11px', color: '#cbd5e1', textAlign: right ? 'right' : 'left'
    });

    return (
        <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px', overflowY: 'auto', height: '100%', minHeight: 0 }}>

            {/* Current Context Highlight */}
            {currentNode && (
                <div style={{
                    background: 'rgba(99,120,255,0.05)',
                    border: '1px solid rgba(99,120,255,0.15)',
                    borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 14
                }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8090ff', boxShadow: '0 0 10px #8090ff' }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '9px', color: '#8090ff', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 800 }}>Extracting Vertex</p>
                        <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#eef2fb', fontWeight: 700 }}>{displayNodeName(currentNode)}</p>
                    </div>
                    {!isBeginner && (
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '9px', color: '#556080', fontWeight: 800 }}>CURRENT COST</p>
                            <p style={{ margin: '2px 0 0', fontSize: '15px', color: '#eef2fb', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{distMap[currentNode]?.toFixed(2)}s</p>
                        </div>
                    )}
                </div>
            )}

            {/* Beginner View: Simplified Summary */}
            {isBeginner && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 700, color: '#eef2fb' }}>Algorithm Progress</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '11px', color: '#7a8aaa' }}>Visited Intersections</span>
                            <span style={{ fontSize: '11px', color: '#eef2fb', fontWeight: 700 }}>{visitedOrder.length} nodes</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '11px', color: '#7a8aaa' }}>Locations to explore</span>
                            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>{sortedOpenSet.length} nearby</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                            <span style={{ fontSize: '11px', color: '#7a8aaa' }}>Total Simulation Time</span>
                            <span style={{ fontSize: '11px', color: '#8090ff', fontWeight: 700 }}>{distMap[currentNode]?.toFixed(1)} seconds</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Intermediate/Advanced View: Formal Tables */}
            {!isBeginner && (
                <>
                    <section style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#eef2fb', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Shortest-Path Tree (SPT) Snapshot</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={headerCellStyle}>Vertex (v)</th>
                                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>distTo[v]</th>
                                    <th style={{ ...headerCellStyle, textAlign: 'center' }}>edgeTo[v]</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitedOrder.map((id, i) => {
                                    const isLatest = i === visitedOrder.length - 1;
                                    return (
                                        <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isLatest ? 'rgba(128,144,255,0.05)' : 'transparent' }}>
                                            <td style={{ ...cellStyle(), fontWeight: 700, color: isLatest ? '#8090ff' : '#cbd5e1' }}>{displayNodeName(id)}</td>
                                            <td style={{ ...cellStyle(true), fontFamily: 'var(--font-mono)' }}>{distMap[id]?.toFixed(1) ?? '∞'}s</td>
                                            <td style={{ ...cellStyle(), textAlign: 'center', color: '#556080', fontSize: '10px' }}>{i === 0 ? 'START' : edgeToMap[id]}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>

                    <section style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Priority Queue (Open Set)</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={headerCellStyle}>Rank</th>
                                    <th style={headerCellStyle}>Node</th>
                                    <th style={{ ...headerCellStyle, textAlign: 'right' }}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedOpenSet.slice(0, 10).map(([nodeId, info], i) => (
                                    <tr key={nodeId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i === 0 ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                                        <td style={{ ...cellStyle(), color: i === 0 ? '#fbbf24' : '#556080', fontSize: '10px', fontWeight: 800 }}>{i === 0 ? 'NEXT' : `#${i + 1}`}</td>
                                        <td style={cellStyle()}>{info.label}</td>
                                        <td style={{ ...cellStyle(true), fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{info.score?.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </div>
    );
}
