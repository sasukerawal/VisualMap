/**
 * RouteStats — displays route computation result metrics.
 */
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';

function StatRow({ label, value, mono, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
                color: color || 'var(--text-primary)',
            }}>
                {value ?? '—'}
            </span>
        </div>
    );
}

export function RouteStats() {
    const { routeResult, algorithm, isLoading, error, currentSegment, destinations } = useStore(
        (s) => ({
            routeResult: s.routeResult,
            algorithm: s.algorithm,
            isLoading: s.isLoading,
            error: s.error,
            currentSegment: s.currentSegment,
            destinations: s.destinations,
        }),
        shallow
    );

    const algoLabels = { dijkstra: "Dijkstra's", astar: "A* Search", bellman_ford: "Bellman-Ford" };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Error */}
            {error && (
                <div style={{ background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--accent-red)', margin: 0 }}>⚠️ {error}</p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div style={{ background: 'rgba(99,120,255,0.08)', border: '1px solid rgba(99,120,255,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--accent-blue)', margin: 0 }}>⏳ Computing route...</p>
                </div>
            )}

            <div className="card">
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                    Post-Run Insights
                </p>

                <div style={{ borderTop: '1px solid var(--border)' }}>
                    <StatRow label="Algorithm" value={algoLabels[algorithm]} color="var(--accent-blue)" />
                    <div style={{ height: 1, background: 'var(--border)' }} />

                    {/* Time vs Distance */}
                    <StatRow
                        label="Transit Time"
                        value={routeResult?.total_time != null ? `${routeResult.total_time.toFixed(1)}s` : null}
                        mono
                        color="#d946ef"
                    />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <StatRow
                        label="Physical Distance"
                        value={routeResult?.total_physical_distance != null ? `${routeResult.total_physical_distance.toFixed(1)}m` : null}
                        mono
                        color="#10b981"
                    />

                    {routeResult?.total_time != null && routeResult?.total_physical_distance != null && (
                        <div style={{ marginTop: 8, marginBottom: 8, padding: '8px 10px', background: 'rgba(99,102,241,0.06)', borderRadius: 6, borderLeft: '3px solid #6366f1' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 }}>
                                Course of Path
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                                {routeResult.total_time < routeResult.total_physical_distance
                                    ? "🚙 The algorithm routed out to the main perimeter roads. Even though it's physically longer, the higher speed limits save transit time."
                                    : "🛵 The algorithm took a direct route through local roads and alleys. The physical distance was so short that detouring to a main road wasn't worth it."}
                            </div>
                        </div>
                    )}

                    <div style={{ height: 1, background: 'var(--border)' }} />

                    {/* Performance */}
                    <StatRow
                        label="Nodes Explored"
                        value={routeResult?.efficiency_metrics ? `${routeResult.efficiency_metrics.nodes_explored} / ${routeResult.efficiency_metrics.total_nodes_in_graph}` : null}
                        mono
                        color="var(--accent-orange)"
                    />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <StatRow
                        label="Computation"
                        value={routeResult ? `${routeResult.computation_time_ms?.toFixed(2) || '0.00'} ms` : null}
                        mono
                    />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <StatRow
                        label="Stops"
                        value={destinations.length > 0 ? `${currentSegment} / ${destinations.length}` : null}
                        color="var(--accent-cyan)"
                    />
                </div>
            </div>

            {/* Efficiency Box */}
            {routeResult?.efficiency_metrics && (
                <div style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 8, padding: '10px 12px',
                    borderLeft: '4px solid var(--accent-orange)'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Efficiency Analysis
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-primary)' }}>
                        <div><span style={{ color: '#64748b' }}>Time Complexity:</span> {routeResult.efficiency_metrics.time_complexity}</div>
                        <div><span style={{ color: '#64748b' }}>Space:</span> {routeResult.efficiency_metrics.space_complexity}</div>
                        <div style={{ marginTop: 4, lineHeight: 1.4, fontFamily: 'var(--font-sans)', fontStyle: 'italic', color: '#475569' }}>
                            "{routeResult.efficiency_metrics.algorithm_efficiency}"
                        </div>
                    </div>
                </div>
            )}

            {/* Order mode */}
            <OrderModeToggle />
        </div>
    );
}

function OrderModeToggle() {
    const { orderMode, setOrderMode, isPlaying } = useStore(
        (s) => ({
            orderMode: s.orderMode,
            setOrderMode: s.setOrderMode,
            isPlaying: s.isPlaying,
        }),
        shallow
    );

    return (
        <div className="card">
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
                Stop Order
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
                {['manual', 'optimized'].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => !isPlaying && setOrderMode(mode)}
                        disabled={isPlaying}
                        style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '11px',
                            fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                            cursor: isPlaying ? 'not-allowed' : 'pointer',
                            border: `1px solid ${orderMode === mode ? 'var(--accent-cyan)' : 'rgba(99,120,255,0.15)'}`,
                            borderRadius: 6,
                            background: orderMode === mode ? 'rgba(0,212,255,0.1)' : 'transparent',
                            color: orderMode === mode ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            textTransform: 'capitalize',
                            opacity: isPlaying ? 0.5 : 1,
                        }}
                    >
                        {mode === 'optimized' ? '⚡ Optimized' : '📋 Manual'}
                    </button>
                ))}
            </div>
        </div>
    );
}
