/**
 * RouteStats — displays route computation result metrics.
 */
import useStore from '../../store/useStore';

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
    const { routeResult, algorithm, isLoading, error, currentSegment, destinations } = useStore();

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
                    Route Statistics
                </p>

                <div style={{ borderTop: '1px solid var(--border)' }}>
                    <StatRow label="Algorithm" value={algoLabels[algorithm]} color="var(--accent-blue)" />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <StatRow
                        label="Total Distance"
                        value={routeResult ? `${routeResult.total_distance.toFixed(1)} units` : null}
                        mono
                        color="var(--accent-green)"
                    />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <StatRow
                        label="Nodes Visited"
                        value={routeResult?.visited_nodes?.length ?? null}
                        mono
                        color="var(--accent-orange)"
                    />
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <StatRow
                        label="Computation"
                        value={routeResult ? `${routeResult.computation_time_ms.toFixed(2)} ms` : null}
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

            {/* Order mode */}
            <OrderModeToggle />
        </div>
    );
}

function OrderModeToggle() {
    const { orderMode, setOrderMode, isPlaying } = useStore();

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
