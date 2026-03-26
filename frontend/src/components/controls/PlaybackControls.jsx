import { useEffect, useRef, useCallback } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
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
        stepsResult,
        currentSegment,
        currentStepIndex,
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
        setCurrentSegment,
        resetAnimation,
        resetAll,
    } = useStore(
        (s) => ({
            destinations: s.destinations,
            algorithm: s.algorithm,
            orderMode: s.orderMode,
            isPlaying: s.isPlaying,
            isPaused: s.isPaused,
            animationSpeed: s.animationSpeed,
            routeResult: s.routeResult,
            stepsResult: s.stepsResult,
            currentSegment: s.currentSegment,
            currentStepIndex: s.currentStepIndex,
            isLoading: s.isLoading,
            error: s.error,
            setIsPlaying: s.setIsPlaying,
            setIsPaused: s.setIsPaused,
            setAnimationSpeed: s.setAnimationSpeed,
            setRouteResult: s.setRouteResult,
            setStepsResult: s.setStepsResult,
            setIsLoading: s.setIsLoading,
            setError: s.setError,
            setExploredNodes: s.setExploredNodes,
            setExploredEdges: s.setExploredEdges,
            setCurrentStepIndex: s.setCurrentStepIndex,
            setCurrentSegment: s.setCurrentSegment,
            resetAnimation: s.resetAnimation,
            resetAll: s.resetAll,
        }),
        shallow
    );

    const explorationTimer = useRef(null);
    const explorationSteps = useRef([]);
    const stepIndex = useRef(0);
    const pausedRef = useRef(isPaused);
    const lastLoadedSegment = useRef(null);

    useEffect(() => {
        pausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => () => stopExploration(), []);

    useEffect(() => {
        // Auto-load the step trace for the currently active delivery segment (stop-to-stop).
        // currentSegment is "delivered count", so segment_index == currentSegment yields:
        // 0: warehouse->dest[0], 1: dest[0]->dest[1], etc.
        if (!isPlaying || !routeResult || !destinations?.length) return;
        if (currentSegment == null) return;
        if (currentSegment >= destinations.length) return; // completed

        if (lastLoadedSegment.current === currentSegment) return;
        lastLoadedSegment.current = currentSegment;

        (async () => {
            try {
                const stepsRes = await computePathSteps({
                    algorithm,
                    start: 'warehouse',
                    destinations,
                    orderMode,
                    segmentIndex: currentSegment,
                });

                setStepsResult(stepsRes);
                setCurrentStepIndex(0);
                useStore.getState().resetSimulation();

                // Highlight exploration edges for just this segment (keeps visuals aligned with the stop the user is on).
                const segPath = routeResult?.segments?.[currentSegment]?.path;
                const segEdges = Array.isArray(segPath) && segPath.length > 1
                    ? segPath.slice(0, -1).map((a, i) => [a, segPath[i + 1]])
                    : [];
                startProgressiveExploration(stepsRes.steps || [], segEdges);
            } catch (err) {
                // Non-fatal: navigation can continue even if the steps trace fails.
                console.warn('Failed to load steps for segment', currentSegment, err);
            }
        })();
    }, [isPlaying, routeResult, currentSegment, destinations, algorithm, orderMode]);

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
            setCurrentStepIndex(idx);
            stepIndex.current = idx + 1;
        }, intervalMs);
    }

    function clampStep(i) {
        const len = stepsResult?.steps?.length || 0;
        if (!len) return 0;
        return Math.max(0, Math.min(len - 1, i));
    }

    function applyExplorationSnapshot(i) {
        const { nodeHistory: nh, edgeHistory: eh } = explorationSteps.current || {};
        if (!Array.isArray(nh) || !Array.isArray(eh)) return;
        if (i < 0 || i >= nh.length) return;
        setExploredNodes(nh[i]);
        setExploredEdges(eh[i]);
    }

    function setStep(i) {
        const next = clampStep(i);
        stopExploration();
        stepIndex.current = next;
        setCurrentStepIndex(next);
        applyExplorationSnapshot(next);
    }

    function isEditableTarget(target) {
        if (!target) return false;
        const el = target;
        if (el.isContentEditable) return true;
        const tag = (el.tagName || '').toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }

    function isDecisionAction(action) {
        return action === 'settle' || action === 'relax_round' || action === 'select' || action === 'expand';
    }

    function nextDecision() {
        const steps = stepsResult?.steps || [];
        if (!steps.length) return;
        const start = clampStep((currentStepIndex ?? 0) + 1);
        let i = start;
        while (i < steps.length && !isDecisionAction(steps[i]?.action)) i += 1;
        setStep(Math.min(i, steps.length - 1));
    }

    function prevDecision() {
        const steps = stepsResult?.steps || [];
        if (!steps.length) return;
        const start = clampStep((currentStepIndex ?? 0) - 1);
        let i = start;
        while (i >= 0 && !isDecisionAction(steps[i]?.action)) i -= 1;
        setStep(Math.max(i, 0));
    }

    const togglePause = useCallback(() => {
        const state = useStore.getState();
        if (!state.isPlaying) return;
        state.setIsPaused(!state.isPaused);
    }, []);

    // Keyboard parity: space=play/pause, arrows=step, shift+arrows=decision-step.
    useEffect(() => {
        function onKeyDown(e) {
            if (isEditableTarget(e.target)) return;

            const state = useStore.getState();
            const hasSteps = (state.stepsResult?.steps?.length || 0) > 0;

            if (e.code === 'Space') {
                e.preventDefault();
                togglePause();
                return;
            }

            if (!hasSteps) return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (e.shiftKey) nextDecision();
                else setStep((state.currentStepIndex ?? 0) + 1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (e.shiftKey) prevDecision();
                else setStep((state.currentStepIndex ?? 0) - 1);
            }
        }

        window.addEventListener('keydown', onKeyDown, { passive: false });
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [togglePause, stepsResult, currentStepIndex]);

    async function handleStart() {
        if (!destinations.length) return;

        setIsLoading(true);
        setError(null);
        resetAnimation();
        setCurrentStepIndex(0);

        try {
            const [pathRes, stepsRes] = await Promise.all([
                computePath({ algorithm, start: 'warehouse', destinations, orderMode }),
                computePathSteps({ algorithm, start: 'warehouse', destinations, orderMode, segmentIndex: 0 }),
            ]);

            setRouteResult(pathRes);
            setStepsResult(stepsRes);
            setCurrentSegment(0);
            startProgressiveExploration(stepsRes.steps || [], pathRes.edges_traversed || []);
            setIsPlaying(true);
            setIsPaused(false);
            lastLoadedSegment.current = 0;
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
                setError("Backend API isn't reachable. Start it with: `cd backend; uvicorn app.main:app --reload --port 8000`");
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

                    {stepsResult?.steps?.length ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn btn-ghost" onClick={() => setStep((currentStepIndex ?? 0) - 1)} style={{ height: 32, padding: '0 10px', fontSize: 11, borderRadius: 12 }}>
                                Prev
                            </button>
                            <button className="btn btn-ghost" onClick={() => setStep((currentStepIndex ?? 0) + 1)} style={{ height: 32, padding: '0 10px', fontSize: 11, borderRadius: 12 }}>
                                Next
                            </button>
                            <button className="btn" onClick={nextDecision} style={{ height: 32, padding: '0 10px', fontSize: 11, borderRadius: 12, fontWeight: 900, background: 'rgba(34,211,238,0.14)', border: '1px solid rgba(34,211,238,0.22)', color: '#d6f9ff' }}>
                                Next Decision
                            </button>
                            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#93a6c3', fontFamily: 'var(--font-mono)' }}>
                                step {Math.min((currentStepIndex ?? 0) + 1, stepsResult.steps.length)} / {stepsResult.steps.length}
                            </div>
                        </div>
                    ) : null}
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
