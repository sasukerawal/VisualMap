import { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import { computePath, computePathSteps } from '../../api/pathfinding';

export function PlaybackControls() {
    const {
        destinations,
        algorithm,
        orderMode,
        isPlaying,
        isPaused,
        animationSpeed,
        routeResult,
        isLoading,
        error,
        setIsPlaying,
        setIsPaused,
        setAnimationSpeed,
        setRouteResult,
        setStepsResult,
        setIsLoading,
        setError,
        setExploredNodes,
        setExploredEdges,
        setCurrentStepIndex,
        resetAnimation,
        resetAll,
    } = useStore();

    const explorationTimer = useRef(null);
    const explorationSteps = useRef([]);
    const stepIndex = useRef(0);
    const pausedRef = useRef(isPaused);

    useEffect(() => {
        pausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => () => stopExploration(), []);

    function stopExploration() {
        if (explorationTimer.current) {
            clearInterval(explorationTimer.current);
            explorationTimer.current = null;
        }
    }

    function startProgressiveExploration(steps, edgesTraversed) {
        stopExploration();
        stepIndex.current = 0;

        const nodeHistory = [];
        const edgeHistory = [];
        let cumulativeNodes = [];
        let cumulativeEdges = [];

        for (const step of steps) {
            if (step.node && !cumulativeNodes.includes(step.node)) {
                cumulativeNodes = [...cumulativeNodes, step.node];
            }

            const newEdges = (step.neighbors_updated || [])
                .filter((nb) => nb.node)
                .map((nb) => `${step.node}-${nb.node}`);

            if (newEdges.length) {
                cumulativeEdges = [...new Set([...cumulativeEdges, ...newEdges])];
            }

            nodeHistory.push([...cumulativeNodes]);
            edgeHistory.push([...cumulativeEdges]);
        }

        explorationSteps.current = { nodeHistory, edgeHistory, finalEdges: edgesTraversed };

        const intervalMs = Math.max(30, Math.round(180 / animationSpeed));
        explorationTimer.current = setInterval(() => {
            if (pausedRef.current) return;

            const idx = stepIndex.current;
            const { nodeHistory: nh, edgeHistory: eh, finalEdges: fe } = explorationSteps.current;

            if (idx >= nh.length) {
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
        setCurrentStepIndex(0);

        try {
            const [pathRes, stepsRes] = await Promise.all([
                computePath({ algorithm, start: 'warehouse', destinations, orderMode }),
                computePathSteps({ algorithm, start: 'warehouse', destinations, orderMode }),
            ]);

            setRouteResult(pathRes);
            setStepsResult(stepsRes);
            startProgressiveExploration(stepsRes.steps || [], pathRes.edges_traversed || []);
            setIsPlaying(true);
            setIsPaused(false);
        } catch (err) {
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail;
            const rawData = err?.response?.data;
            const message = err?.message;

            // Common dev failure: Vite proxy returns 500 when backend is down (ECONNREFUSED).
            const maybeProxyDown =
                status === 500 &&
                typeof rawData === 'string' &&
                (rawData.includes('ECONNREFUSED') || rawData.includes('connect ECONNREFUSED'));

            const maybeBackendDown =
                err?.code === 'ERR_NETWORK' ||
                (typeof message === 'string' && (message.includes('Network Error') || message.includes('ECONNREFUSED')));

            if (maybeProxyDown || maybeBackendDown) {
                setError("Backend API isn’t reachable. Start it with: `cd backend; uvicorn app.main:app --reload --port 8000`");
            } else {
                setError(detail || message || 'Failed to compute path');
            }
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
        cursor: 'pointer',
        border: 'none',
        borderRadius: 16,
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: '12px',
        transition: 'all 0.18s',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {error && (
                <div
                    style={{
                        background: 'rgba(220,50,50,0.1)',
                        border: '1px solid rgba(220,50,50,0.3)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: '11px',
                        color: '#f0a4a4',
                    }}
                >
                    {error}
                </div>
            )}

            {!isPlaying ? (
                <button
                    onClick={handleStart}
                    disabled={!destinations.length || isLoading}
                    style={{
                        ...btnBase,
                        width: '100%',
                        padding: '15px 18px',
                        background: destinations.length > 0 ? 'linear-gradient(135deg, rgba(76,208,155,0.2), rgba(33,115,84,0.45))' : 'rgba(255,255,255,0.06)',
                        color: destinations.length > 0 ? '#dff9ed' : '#7f8ca4',
                        border: `1px solid ${destinations.length > 0 ? 'rgba(76,208,155,0.28)' : 'rgba(148,163,184,0.12)'}`,
                        boxShadow: destinations.length > 0 ? '0 12px 30px rgba(39,174,96,0.18)' : 'none',
                        opacity: isLoading ? 0.7 : 1,
                    }}
                >
                    {isLoading ? 'Computing route...' : destinations.length > 0 ? 'Start Navigation' : 'Add stops first'}
                </button>
            ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        style={{
                            ...btnBase,
                            flex: 1,
                            padding: '14px',
                            background: isPaused ? 'rgba(76,208,155,0.14)' : 'rgba(255,255,255,0.06)',
                            color: isPaused ? '#7ef0b8' : '#dde7f5',
                            border: `1px solid ${isPaused ? 'rgba(39,174,96,0.35)' : 'rgba(148,163,184,0.12)'}`,
                        }}
                    >
                        {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            ...btnBase,
                            flex: 1,
                            padding: '14px',
                            background: 'rgba(220,50,50,0.08)',
                            color: '#f39a9a',
                            border: '1px solid rgba(220,50,50,0.2)',
                        }}
                    >
                        Reset
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#9aabc6', flexShrink: 0 }}>Speed:</span>
                {speeds.map((speed) => (
                    <button
                        key={speed}
                        onClick={() => setAnimationSpeed(speed)}
                        style={{
                            ...btnBase,
                            padding: '6px 11px',
                            fontSize: '11px',
                            borderRadius: 999,
                            fontFamily: 'var(--font-mono)',
                            border: `1px solid ${animationSpeed === speed ? 'rgba(91,156,246,0.35)' : 'rgba(148,163,184,0.16)'}`,
                            background: animationSpeed === speed ? 'rgba(58,125,200,0.16)' : 'rgba(255,255,255,0.03)',
                            color: animationSpeed === speed ? '#9fd0ff' : '#93a6c3',
                        }}
                    >
                        {speed}x
                    </button>
                ))}
                {routeResult && !isPlaying && (
                    <button
                        onClick={handleReset}
                        style={{
                            ...btnBase,
                            marginLeft: 'auto',
                            padding: '6px 12px',
                            fontSize: '11px',
                            borderRadius: 999,
                            border: '1px solid rgba(148,163,184,0.16)',
                            background: 'rgba(255,255,255,0.03)',
                            color: '#93a6c3',
                        }}
                    >
                        Reset
                    </button>
                )}
            </div>

            {!isPlaying && !routeResult && !error && (
                <p style={{ fontSize: '11px', color: '#8ea2bf', textAlign: 'center', margin: 0 }}>
                    Choose an algorithm, click houses, then start the simulation
                </p>
            )}
        </div>
    );
}
