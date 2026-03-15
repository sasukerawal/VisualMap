/**
 * PlaybackControls
 *
 * KEY FIX: Progressive exploration animation now uses a stable
 * ref to track state and doesn't call useStore.getState() inside
 * the interval (which caused stale-state issues).
 *
 * Instead it builds the full exploration sequence up-front and
 * replays it step-by-step by index.
 */
import { useRef } from 'react';
import useStore from '../../store/useStore';
import { computePath, computePathSteps } from '../../api/pathfinding';

export function PlaybackControls() {
    const {
        destinations, algorithm, orderMode,
        isPlaying, isPaused, animationSpeed, routeResult, isLoading, error,
        setIsPlaying, setIsPaused, setAnimationSpeed,
        setRouteResult, setStepsResult, setIsLoading, setError,
        setExploredNodes, setExploredEdges,
        resetAnimation, resetAll,
    } = useStore();

    const explorationTimer = useRef(null);
    // Pre-built step sequence stored in ref
    const explorationSteps = useRef([]);
    const stepIndex = useRef(0);

    function stopExploration() {
        if (explorationTimer.current) {
            clearInterval(explorationTimer.current);
            explorationTimer.current = null;
        }
    }

    function startProgressiveExploration(explorationOrder, edgesTraversed) {
        stopExploration();
        stepIndex.current = 0;

        // Build cumulative node & edge sets for each step
        const nodeHistory = [];
        const edgeHistory = [];
        let cumulativeNodes = [];
        let cumulativeEdges = [];

        for (const exp of explorationOrder) {
            if (exp.node && !cumulativeNodes.includes(exp.node)) {
                cumulativeNodes = [...cumulativeNodes, exp.node];
            }
            const newEdges = (exp.neighbors_updated || []).map(nb => `${exp.node}-${nb.node}`);
            if (newEdges.length) {
                cumulativeEdges = [...new Set([...cumulativeEdges, ...newEdges])];
            }
            nodeHistory.push([...cumulativeNodes]);
            edgeHistory.push([...cumulativeEdges]);
        }
        explorationSteps.current = { nodeHistory, edgeHistory, finalEdges: edgesTraversed };

        const intervalMs = Math.max(30, Math.round(180 / animationSpeed));

        explorationTimer.current = setInterval(() => {
            const idx = stepIndex.current;
            const { nodeHistory: nh, edgeHistory: eh, finalEdges: fe } = explorationSteps.current;

            if (idx >= nh.length) {
                // Done — show all final edges
                setExploredEdges((fe || []).map(([a, b]) => `${a}-${b}`));
                stopExploration();
                return;
            }
            setExploredNodes(nh[idx]);
            setExploredEdges(eh[idx]);
            stepIndex.current = idx + 1;
        }, intervalMs);
    }

    async function handleStart() {
        if (!destinations.length) return;
        setIsLoading(true);
        setError(null);
        resetAnimation();

        try {
            const [pathRes, stepsRes] = await Promise.all([
                computePath({ algorithm, start: 'warehouse', destinations, orderMode }),
                computePathSteps({ algorithm, start: 'warehouse', destinations, orderMode }),
            ]);
            setRouteResult(pathRes);
            setStepsResult(stepsRes);
            startProgressiveExploration(pathRes.exploration_order || [], pathRes.edges_traversed || []);
            setIsPlaying(true);
            setIsPaused(false);
        } catch (err) {
            setError(err?.response?.data?.detail || err.message || 'Failed to compute path');
        } finally {
            setIsLoading(false);
        }
    }

    function handleReset() {
        stopExploration();
        resetAll();
    }

    const speeds = [0.5, 1, 1.5, 2];

    const btnBase = {
        cursor: 'pointer', border: 'none', borderRadius: 9,
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '12px',
        transition: 'all 0.18s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && (
                <div style={{ background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '11px', color: '#e05555' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Main button */}
            {!isPlaying ? (
                <button
                    onClick={handleStart}
                    disabled={!destinations.length || isLoading}
                    style={{
                        ...btnBase,
                        width: '100%', padding: '12px',
                        background: destinations.length > 0 ? 'linear-gradient(135deg,#27ae60,#1e8449)' : '#e8ecf0',
                        color: destinations.length > 0 ? '#fff' : '#aab',
                        boxShadow: destinations.length > 0 ? '0 4px 16px rgba(39,174,96,0.3)' : 'none',
                        opacity: isLoading ? 0.7 : 1,
                    }}
                >
                    {isLoading ? '⏳ Computing...' : destinations.length > 0 ? '🚚 Start Navigation' : '← Add stops first'}
                </button>
            ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setIsPaused(!isPaused)} style={{ ...btnBase, flex: 1, padding: '10px', background: isPaused ? 'rgba(39,174,96,0.12)' : '#f0f2f5', color: isPaused ? '#27ae60' : '#556', border: '1px solid ' + (isPaused ? 'rgba(39,174,96,0.35)' : '#dde') }}>
                        {isPaused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                    <button onClick={handleReset} style={{ ...btnBase, flex: 1, padding: '10px', background: 'rgba(220,50,50,0.08)', color: '#e05555', border: '1px solid rgba(220,50,50,0.2)' }}>
                        ↺ Reset
                    </button>
                </div>
            )}

            {/* Speed row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '11px', color: '#889', flexShrink: 0 }}>Speed:</span>
                {speeds.map(s => (
                    <button
                        key={s}
                        onClick={() => setAnimationSpeed(s)}
                        style={{
                            ...btnBase, padding: '3px 7px', fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            border: `1px solid ${animationSpeed === s ? '#3a7dc8' : '#dde'}`,
                            background: animationSpeed === s ? 'rgba(58,125,200,0.12)' : 'transparent',
                            color: animationSpeed === s ? '#3a7dc8' : '#889',
                        }}
                    >
                        {s}x
                    </button>
                ))}
                {routeResult && !isPlaying && (
                    <button onClick={handleReset} style={{ ...btnBase, marginLeft: 'auto', padding: '3px 10px', fontSize: '11px', border: '1px solid #dde', background: 'transparent', color: '#889' }}>Reset</button>
                )}
            </div>

            {!isPlaying && !routeResult && !error && (
                <p style={{ fontSize: '11px', color: '#aab', textAlign: 'center', margin: 0 }}>
                    Choose algo → click house pins → navigate
                </p>
            )}
        </div>
    );
}
