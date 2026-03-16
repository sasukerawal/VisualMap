/**
 * TablesTab — Live-updating data tables for educational transparency.
 * Reconstructs full algorithm state from the step history, including
 * the open set (priority queue) which is inferred from neighbors.
 */
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';

export function TablesTab() {
    const { stepsResult, algorithm, currentStepIndex } = useStore();

    if (!stepsResult?.steps?.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: 'var(--text-secondary)', gap: 12 }}>
                <span style={{ fontSize: '32px' }}>📊</span>
                <p style={{ margin: 0, fontSize: '12px', textAlign: 'center', lineHeight: 1.6, maxWidth: 220 }}>
                    Run a navigation first. The algorithm's internal state tables will appear here step-by-step.
                </p>
            </div>
        );
    }

    // ── Reconstruct full state up to the current step ─────────────────────
    const stepsUpTo = stepsResult.steps.slice(0, currentStepIndex + 1);

    const visitedOrder = [];    // settled node IDs in order
    const distMap = {};         // distTo[]: nodeId -> best cost seen
    const hMap = {};            // heuristic
    const fMap = {};            // f-score
    const edgeToMap = {};       // edgeTo[]: nodeId -> "fromNode -> toNode"

    // Track the "open set" — nodes that have been discovered but not settled
    const openSet = new Map();  // nodeId -> { score, label }

    stepsUpTo.forEach((step, stepIdx) => {
        const u = step.node;

        // Mark as settled
        if (!visitedOrder.includes(u)) {
            visitedOrder.push(u);
        }
        openSet.delete(u);  // remove from open set when settled

        if (step.distance != null) distMap[u] = step.distance;
        if (step.heuristic != null) hMap[u] = step.heuristic;
        if (step.f_score != null) fMap[u] = step.f_score;

        // Add/update neighbors in the open set
        step.neighbors_updated?.forEach(nb => {
            const v = nb.node;
            const score = nb.f ?? nb.new_dist ?? nb.g;
            // Only update if not already settled
            if (!visitedOrder.includes(v) || openSet.has(v)) {
                if (!openSet.has(v) || score < (openSet.get(v)?.score ?? Infinity)) {
                    openSet.set(v, { score, label: NODES[v]?.label || v });
                }
            }
            if (nb.new_dist != null && (distMap[v] === undefined || nb.new_dist < distMap[v])) {
                distMap[v] = nb.new_dist;

                // Construct the edgeTo[] string mapping source -> target
                const sourceLabel = NODES[u]?.label || u;
                const targetLabel = NODES[v]?.label || v;
                // e.g. "0 → 4" or "n_A → n_B"
                edgeToMap[v] = `${sourceLabel} → ${targetLabel}`;
            }
            if (nb.heuristic != null) hMap[v] = nb.heuristic;
            if (nb.f != null) fMap[v] = nb.f;
        });

        // Also use backend-provided queue if available (prefer it)
        if (step.queue?.length > 0 && stepIdx === currentStepIndex) {
            openSet.clear();
            step.queue.forEach(item => {
                const id = Array.isArray(item) ? item[0] : item;
                const score = Array.isArray(item) ? item[1] : distMap[id];
                openSet.set(id, { score: score ?? 0, label: NODES[id]?.label || id });
            });
        }
    });

    // Sort open set by score ascending (priority queue order)
    const sortedOpenSet = [...openSet.entries()]
        .sort((a, b) => (a[1].score ?? Infinity) - (b[1].score ?? Infinity));

    const isAstar = algorithm === 'astar';
    const currentNode = stepsUpTo[stepsUpTo.length - 1]?.node;

    const headerCell = {
        padding: '8px 10px', color: '#64748b', fontWeight: 700,
        fontSize: '11px', background: 'rgba(91,156,246,0.08)',
        borderBottom: '1px solid #e2e8f0', textAlign: 'left'
    };
    const cell = (right) => ({
        padding: '8px 10px', fontSize: '11px', textAlign: right ? 'right' : 'left'
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Current Step Highlight */}
            {currentNode && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.04))',
                    border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10,
                    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10
                }}>
                    <span style={{ fontSize: '20px' }}>🔵</span>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700 }}>Currently Processing</p>
                        <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#1e293b', fontWeight: 800 }}>
                            {NODES[currentNode]?.label || currentNode}
                            <span style={{ marginLeft: 8, fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                                g = {distMap[currentNode]?.toFixed(2) ?? '?'}
                                {isAstar && fMap[currentNode] != null && `  •  f = ${fMap[currentNode]?.toFixed(2)}`}
                            </span>
                        </p>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                        Step {currentStepIndex + 1} / {stepsResult.steps.length}
                    </span>
                </div>
            )}

            {/* Visited / Settled Nodes Table — Princeton Style */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 6, borderBottom: '2px solid #334155' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        {algorithm === 'dijkstra' ? "Dijkstra's algorithm demo" :
                            algorithm === 'astar' ? "A* search demo" : "Bellman-Ford demo"}
                    </h3>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px 20px', display: 'flex', justifyContent: 'center' }}>
                    <table style={{ width: 'auto', minWidth: '280px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #000' }}>
                                <th style={{ padding: '4px 12px', fontSize: '13px', fontWeight: 600, color: '#000', textAlign: 'left' }}>v</th>
                                <th style={{ padding: '4px 12px', fontSize: '13px', fontWeight: 600, color: '#000', textAlign: 'right' }}>distTo[]</th>
                                <th style={{ padding: '4px 12px', fontSize: '13px', fontWeight: 600, color: '#000', textAlign: 'center' }}>edgeTo[]</th>
                                {isAstar && <th style={{ padding: '4px 12px', fontSize: '13px', fontWeight: 600, color: '#000', textAlign: 'right' }}>f(n)</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visitedOrder.length === 0 && (
                                <tr><td colSpan={isAstar ? 4 : 3} style={{ ...cell(), color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingTop: 16 }}>No vertices processed</td></tr>
                            )}
                            {visitedOrder.map((id, i) => {
                                const isLatest = i === visitedOrder.length - 1;
                                return (
                                    <tr key={id} style={{ background: isLatest ? 'rgba(153, 27, 27, 0.08)' : 'transparent' }}>
                                        <td style={{ ...cell(), fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                                            {isLatest ? <span style={{ color: '#b91c1c', fontWeight: 700, marginRight: 6 }}>→</span> : <span style={{ marginRight: 18 }} />}
                                            {NODES[id]?.label || id}
                                        </td>
                                        <td style={{ ...cell(true), fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                                            {distMap[id]?.toFixed(1) ?? '—'}
                                        </td>
                                        <td style={{ ...cell(true), fontSize: '13px', color: '#991b1b', textAlign: 'center' }}>
                                            {i === 0 ? '-' : edgeToMap[id] || '—'}
                                        </td>
                                        {isAstar && (
                                            <td style={{ ...cell(true), fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                                                {fMap[id]?.toFixed(1) ?? '—'}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Open Set / Priority Queue */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span>⚡</span>
                    <h3 style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                        Open Set — Priority Queue ({sortedOpenSet.length} items)
                    </h3>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '10px', color: '#64748b', fontStyle: 'italic', paddingLeft: 24 }}>
                    Nodes we have discovered but not visited yet. The queue is always sorted to test the most promising node next.
                </p>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={headerCell}>Rank</th>
                                <th style={headerCell}>Node</th>
                                <th style={{ ...headerCell, textAlign: 'right' }}>{isAstar ? 'F-Score (priority)' : 'Distance'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedOpenSet.length === 0 && (
                                <tr><td colSpan="3" style={{ ...cell(), color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                                    {visitedOrder.length > 0 ? '✅ All discovered nodes settled' : 'Queue empty'}
                                </td></tr>
                            )}
                            {sortedOpenSet.slice(0, 10).map(([nodeId, info], i) => (
                                <tr key={nodeId} style={{ borderBottom: '1px solid #f1f5f9', background: i === 0 ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                                    <td style={{ ...cell(), color: i === 0 ? '#f59e0b' : '#94a3b8', fontWeight: i === 0 ? 800 : 400 }}>
                                        {i === 0 ? '★ Next' : `#${i + 1}`}
                                    </td>
                                    <td style={{ ...cell(), color: '#1e293b', fontWeight: 600 }}>{info.label}</td>
                                    <td style={{ ...cell(true), color: '#0891b2', fontFamily: 'monospace', fontWeight: 600 }}>
                                        {info.score?.toFixed(2) ?? '∞'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* A* Formula Card */}
            {isAstar && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(124,58,237,0.05))',
                    border: '1px solid rgba(99,102,241,0.18)',
                    borderRadius: 10, padding: '12px 14px'
                }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        📐 A* Cost Function
                    </p>
                    <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#4338ca', fontWeight: 800, marginBottom: 8 }}>
                        f(n) = g(n) + h(n)
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#16a34a' }}>🟢 g = actual cost from start</span>
                        <span style={{ fontSize: '11px', color: '#ea580c' }}>🟠 h = heuristic (straight-line)</span>
                        <span style={{ fontSize: '11px', color: '#7c3aed' }}>🟣 f = priority (lower = better)</span>
                    </div>
                </div>
            )}
        </div>
    );
}
