import useStore from '../../store/useStore';
import ReasoningPanel from './ReasoningPanel';
import PseudocodeViewer from './PseudocodeViewer';
import { StateVariablesPanel } from './StateVariablesPanel';
import { computePathSteps } from '../../api/pathfinding';
import { displayNodeName } from '../../data/townGraph';

const shellStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    gap: 12,
    padding: 12,
    background: 'radial-gradient(circle at top left, rgba(91,156,246,0.16), transparent 28%), linear-gradient(180deg, rgba(8,14,24,0.96), rgba(15,23,42,0.92))',
};

const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    background: 'linear-gradient(180deg, rgba(14,22,36,0.92), rgba(9,15,26,0.88))',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: 18,
    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.28)',
    overflow: 'hidden',
    backdropFilter: 'blur(16px)',
};

function TheoryCard({ title, subtitle, children, footer }) {
    return (
        <section style={cardStyle}>
            <header
                style={{
                    padding: '14px 16px 12px',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#eef2ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            {title}
                        </h3>
                        {subtitle ? (
                            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#7f93b2' }}>{subtitle}</p>
                        ) : null}
                    </div>
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#22d3ee',
                            boxShadow: '0 0 18px rgba(34,211,238,0.8)',
                            flexShrink: 0,
                        }}
                    />
                </div>
            </header>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</div>
            {footer ? (
                <div
                    style={{
                        padding: '12px 16px',
                        borderTop: '1px solid rgba(148, 163, 184, 0.12)',
                        background: 'rgba(255,255,255,0.02)',
                    }}
                >
                    {footer}
                </div>
            ) : null}
        </section>
    );
}

function EmptyTheoryState() {
    return (
        <div
            style={{
                ...shellStyle,
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    maxWidth: 420,
                    padding: 28,
                    borderRadius: 24,
                    border: '1px solid rgba(148,163,184,0.14)',
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(9,15,26,0.92))',
                    boxShadow: '0 18px 50px rgba(0,0,0,0.3)',
                }}
            >
                <div style={{ fontSize: 42, marginBottom: 12 }}>Theory</div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#eef2ff' }}>No active simulation</h2>
                <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.7, color: '#8fa4c1' }}>
                    Generate a route first. The theory workspace will then show the search space, reasoning logs,
                    pseudocode, and state variables in resizable panes.
                </p>
            </div>
        </div>
    );
}

export function TheoryOverlay() {
    const {
        algorithm,
        stepsResult,
        currentStepIndex,
        setCurrentStepIndex,
        destinations,
        orderMode,
        routeResult,
        currentSegment,
        setStepsResult,
    } = useStore();

    if (!routeResult || !destinations?.length) {
        return <EmptyTheoryState />;
    }

    const hasSteps = !!stepsResult?.steps?.length;
    if (!hasSteps) {
        return <EmptyTheoryState />;
    }
    const currentStep = stepsResult.steps[currentStepIndex] || stepsResult.steps[0];
    const algorithmLabel = algorithm === 'astar' ? 'A* Search' : algorithm === 'bellman_ford' ? 'Bellman-Ford' : "Dijkstra's";

    const stops = ['warehouse', ...(destinations || [])];
    const activeSegIndex = Math.min(Math.max(currentSegment || 0, 0), Math.max(stops.length - 2, 0));
    const segFrom = stops[activeSegIndex];
    const segTo = stops[activeSegIndex + 1];

    async function loadSegment(segIndex) {
        if (!destinations?.length) return;
        const idx = Math.min(Math.max(segIndex, 0), Math.max(destinations.length - 1, 0));
        try {
            const res = await computePathSteps({
                algorithm,
                start: 'warehouse',
                destinations,
                orderMode,
                segmentIndex: idx,
            });
            setStepsResult(res);
            setCurrentStepIndex(0);
            useStore.getState().resetSimulation();
        } catch (e) {
            console.warn('Failed to load steps for segment', idx, e);
        }
    }

    return (
        <div style={shellStyle}>
            <div
                style={{
                    padding: '12px 14px',
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.14)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#9fc7ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Stop Progression
                        </div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#cbd5e1', fontWeight: 800 }}>
                            {displayNodeName(segFrom)} → {displayNodeName(segTo)}
                        </div>
                    </div>
                    <button
                        className="btn btn-ghost"
                        onClick={() => loadSegment(activeSegIndex)}
                        style={{ borderRadius: 14, padding: '10px 12px', fontWeight: 850 }}
                        title="Reload step trace for the current live stop-to-stop segment"
                    >
                        Follow Live
                    </button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {stops.map((id, i) => {
                        const isStop = i > 0;
                        const isDelivered = isStop && i <= (currentSegment || 0);
                        const isActive = i === activeSegIndex || i === activeSegIndex + 1;
                        return (
                            <button
                                key={id + i}
                                onClick={() => {
                                    // segments are between stops: clicking stop i loads segment i (warehouse->dest0 is 0)
                                    if (i === 0) loadSegment(0);
                                    else loadSegment(i - 1);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: 999,
                                    padding: '8px 10px',
                                    border: `1px solid ${isActive ? 'rgba(34,211,238,0.35)' : 'rgba(148,163,184,0.14)'}`,
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(91,156,246,0.10))'
                                        : 'rgba(255,255,255,0.03)',
                                    color: isDelivered ? '#86efac' : '#d6e4ff',
                                    fontSize: 11,
                                    fontWeight: 850,
                                    maxWidth: 220,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                                title={displayNodeName(id)}
                            >
                                {i === 0 ? 'Warehouse' : `Stop ${i}`}: {displayNodeName(id)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 10,
                    flexShrink: 0,
                }}
            >
                {[
                    { label: 'Algorithm', value: algorithmLabel },
                    { label: 'Focused Node', value: currentStep?.node || 'n/a' },
                    { label: 'Distance', value: currentStep?.distance?.toFixed ? `${currentStep.distance.toFixed(2)}s` : 'n/a' },
                    { label: 'Action', value: currentStep?.action || 'n/a' },
                ].map((item) => (
                    <div
                        key={item.label}
                        style={{
                            padding: '12px 14px',
                            borderRadius: 16,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                            border: '1px solid rgba(148,163,184,0.12)',
                        }}
                    >
                        <p style={{ margin: 0, fontSize: 9, color: '#7f93b2', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                            {item.label}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#eef2ff', fontWeight: 700 }}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, height: '100%', minHeight: 0 }}>
                    <TheoryCard title="Historical Trace" subtitle="Narrative playback of executed decisions.">
                        <ReasoningPanel steps={stepsResult.steps} currentIndex={currentStepIndex} variant="minimal" />
                    </TheoryCard>
                    <TheoryCard title="Live Reasoning" subtitle="Technical interpretation of the current step.">
                        <ReasoningPanel steps={stepsResult.steps} currentIndex={currentStepIndex} variant="technical-minimal" />
                    </TheoryCard>
                    <TheoryCard title="Implementation Logic" subtitle="Pseudocode aligned to the current step.">
                        <PseudocodeViewer algorithm={algorithm} currentStep={currentStep} simpleMode />
                    </TheoryCard>
                    <TheoryCard title="State Inspector" subtitle="Scores and heuristic signals.">
                        <StateVariablesPanel
                            f_score={currentStep?.f_score}
                            distance={currentStep?.distance}
                            heuristic={currentStep?.heuristic}
                            nodeLabel={currentStep?.node_label || currentStep?.node}
                            minimal
                        />
                    </TheoryCard>
                </div>
            </div>
        </div>
    );
}
