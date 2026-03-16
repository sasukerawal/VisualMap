/**
 * TheoryTab - Step-by-step algorithm explanation viewer
 * Dynamically adjusts complexity based on the selected Learning Mode.
 */
import { useState, useEffect } from 'react';
import { PSEUDOCODE } from '../../data/pseudocode';
import useStore from '../../store/useStore';

export function TheoryTab() {
    const { algorithm, stepsResult, currentStepIndex, setCurrentStepIndex, learningMode } = useStore();
    const pseudocode = PSEUDOCODE[algorithm] || [];

    const [localStep, setLocalStep] = useState(currentStepIndex);

    useEffect(() => {
        setLocalStep(currentStepIndex);
    }, [currentStepIndex]);

    const totalSteps = stepsResult?.steps?.length || 0;
    const currentStep = stepsResult?.steps?.[localStep];
    const activeLine = currentStep?.active_line;
    const explanation = currentStep?.explanation;

    function goTo(i) {
        const clamped = Math.max(0, Math.min(totalSteps - 1, i));
        setLocalStep(clamped);
        setCurrentStepIndex(clamped);
    }

    const isBeginner = learningMode === 'beginner';
    const isAdvanced = learningMode === 'advanced';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', minHeight: 0 }}>

            {/* Step Navigator */}
            {totalSteps > 0 && (
                <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8aaa', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Algorithmic Step Trace
                        </span>
                        <span style={{
                            fontSize: '11px', fontWeight: 800,
                            color: '#8090ff', background: 'rgba(99,120,255,0.1)',
                            padding: '2px 10px', borderRadius: 10,
                            border: '1px solid rgba(99,120,255,0.2)'
                        }}>
                            {localStep + 1} / {totalSteps}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max={totalSteps - 1}
                        value={localStep}
                        onChange={(e) => goTo(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6378ff', cursor: 'pointer', marginBottom: 10, height: '6px' }}
                    />

                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => goTo(localStep - 1)}
                            disabled={localStep === 0}
                            style={{
                                flex: 1, padding: '7px', fontSize: '11px', cursor: localStep === 0 ? 'not-allowed' : 'pointer',
                                background: localStep === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(99,120,255,0.1)',
                                border: '1px solid rgba(99,120,255,0.2)', borderRadius: 8,
                                color: localStep === 0 ? '#4a5a70' : '#8090ff', fontWeight: 700,
                                transition: 'all 0.2s'
                            }}
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={() => goTo(localStep + 1)}
                            disabled={localStep === totalSteps - 1}
                            style={{
                                flex: 1, padding: '7px', fontSize: '11px', cursor: localStep === totalSteps - 1 ? 'not-allowed' : 'pointer',
                                background: localStep === totalSteps - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(99,120,255,0.1)',
                                border: '1px solid rgba(99,120,255,0.2)', borderRadius: 8,
                                color: localStep === totalSteps - 1 ? '#4a5a70' : '#8090ff', fontWeight: 700,
                                transition: 'all 0.2s'
                            }}
                        >
                            Proceed →
                        </button>
                    </div>
                </div>
            )}

            {/* Core Logic Rules (Context Sensitive) */}
            {!isBeginner && (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '14px', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#eef2fb', letterSpacing: '-0.2px' }}>
                        {algorithm === 'dijkstra' ? "Dijkstra's Invariant" :
                            algorithm === 'astar' ? "A* Mathematical Guidance" : "Bellman-Ford Convergence"}
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: '11px', color: '#7a8aaa', lineHeight: 1.6 }}>
                        {algorithm === 'dijkstra' && (
                            <>
                                <li>Select vertex <strong>v</strong> with minimum <code>distTo[v]</code> which is not yet in the shortest-path tree.</li>
                                <li><strong>Relax</strong> all outgoing edges from <strong>v</strong> to update neighbors.</li>
                            </>
                        )}
                        {algorithm === 'astar' && (
                            <>
                                <li>Prioritize node <strong>n</strong> with lowest estimated total cost: <code>f(n) = g(n) + h(n)</code>.</li>
                                <li>Use the <strong>Euclidean Heuristic</strong> to guide search toward the geographical goal.</li>
                            </>
                        )}
                        {algorithm === 'bellman_ford' && (
                            <>
                                <li>Systematically <strong>relax</strong> all edges in the graph across <strong>V-1</strong> iterations.</li>
                                <li>Guarantees shortest paths even with negative edge weights (not present in this map).</li>
                            </>
                        )}
                    </ul>
                </div>
            )}

            {/* WHY THIS STEP & MATH BREAKDOWN */}
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,120,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8090ff', fontSize: '12px' }}>💡</div>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#8090ff', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Conceptual Reasoning
                    </span>
                    {currentStep && (
                        <span style={{ fontSize: '9px', color: '#556080', fontWeight: 700, marginLeft: 'auto', textTransform: 'uppercase' }}>
                            Step {localStep + 1}
                        </span>
                    )}
                </div>

                {explanation ? (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <p style={{
                            fontSize: '12px', color: '#cbd5e1', lineHeight: 1.7,
                            fontWeight: 500, margin: 0,
                        }}>
                            {explanation}
                        </p>

                        {/* Math Breakdown Panel (Hidden in Beginner) */}
                        {!isBeginner && currentStep.math_breakdown && (
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8,
                                padding: '10px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                color: '#94a3b8'
                            }}>
                                <div style={{ fontSize: '9px', fontWeight: 800, color: '#8090ff', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Calculation Trace
                                </div>
                                {currentStep.math_breakdown.f !== undefined ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div>
                                            <span style={{ color: '#818cf8', fontWeight: 700 }}>f(n)</span> =
                                            <span style={{ color: '#6366f1' }}> g(n)</span> +
                                            <span style={{ color: '#10b981' }}> h(n)</span>
                                        </div>
                                        <div style={{ color: '#e2e8f0', fontWeight: 700 }}>
                                            {currentStep.math_breakdown.f.toFixed(2)}s =
                                            <span style={{ color: '#6366f1' }}> {currentStep.math_breakdown.g.toFixed(2)}s</span> +
                                            <span style={{ color: '#10b981' }}> {currentStep.math_breakdown.h.toFixed(2)}s</span>
                                        </div>
                                    </div>
                                ) : currentStep.math_breakdown.g !== undefined ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: '#6366f1', fontWeight: 700 }}>Transit Cost g(n):</span>
                                        <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{currentStep.math_breakdown.g.toFixed(2)}s</span>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ fontSize: '11px', color: '#556080', fontStyle: 'italic', margin: 0, textAlign: 'center', padding: '10px 0' }}>
                        {totalSteps > 0 ? "Use the trace navigator above to explore the reasoning." : "Initialize a simulation to reveal algorithmic insights."}
                    </p>
                )}
            </div>

            {/* Pseudocode Viewer (Simplified in Intermediate, Full in Advanced, Hidden in Beginner) */}
            {!isBeginner && (
                <div style={{ flex: 1, minHeight: 0, background: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', color: '#7a8aaa', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 800 }}>
                            Implementation Pseudocode
                        </div>
                        {activeLine && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                                ACTIVE L#{activeLine}
                            </span>
                        )}
                    </div>

                    <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                        {pseudocode.length === 0 ? (
                            <p style={{ fontSize: '11px', color: '#4a5a70', fontStyle: 'italic' }}>
                                Awaiting algorithm selection...
                            </p>
                        ) : (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', lineHeight: 1.8 }}>
                                {pseudocode.map((line) => {
                                    const isActive = line.line === activeLine;

                                    // Map simple plain English explanations to the pseudocode index
                                    let englishExplanation = "";
                                    if (isActive) {
                                        if (algorithm === 'dijkstra') {
                                            if (line.line === 1) englishExplanation = "Initialization: Assigning the starting distance of 0 to the source, and ∞ to all other nodes.";
                                            else if (line.line === 3) englishExplanation = `Greedy choice: Extracting node "${currentStep.node}" because it has the current minimum distance from start.`;
                                            else if (line.line === 5) englishExplanation = `Found the absolute shortest path to node "${currentStep.node}". Mark it as settled.`;
                                            else if (line.line === 8) englishExplanation = "Edge Relaxation: Checking if passing through the current node creates a faster path to its neighbors.";
                                        } else if (algorithm === 'astar') {
                                            if (line.line === 4) englishExplanation = `Focused search: Picking node "${currentStep.node}" with the lowest total estimated cost f(n) = g(n) + h(n).`;
                                            else if (line.line === 8) englishExplanation = "Heuristic improvement: Updating neighbor's distance and priority based on physical proximity to goal.";
                                        } else if (algorithm === 'bellman_ford') {
                                            if (line.line === 5) englishExplanation = "Systematic pass: Relaxing every edge in the graph to propagate shortest distance values.";
                                        }
                                    }

                                    return (
                                        <div key={line.line} style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div
                                                onClick={() => {
                                                    const idx = stepsResult?.steps?.findIndex(s => s.active_line === line.line);
                                                    if (idx >= 0) goTo(idx);
                                                }}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    background: isActive ? 'rgba(99, 120, 255, 0.15)' : 'transparent',
                                                    color: isActive ? '#eef2fb' : '#4a5a70',
                                                    borderLeft: isActive ? '3px solid #6378ff' : '3px solid transparent',
                                                    transition: 'all 0.2s ease',
                                                    whiteSpace: 'pre-wrap',
                                                    cursor: 'pointer',
                                                    fontWeight: isActive ? 700 : 400
                                                }}
                                            >
                                                <span style={{ opacity: 0.35, marginRight: 14, userSelect: 'none', display: 'inline-block', width: 14, textAlign: 'right' }}>
                                                    {line.line}
                                                </span>
                                                {line.text}
                                            </div>
                                            {isActive && englishExplanation && (
                                                <div style={{ marginLeft: 38, marginTop: 4, marginBottom: 8, fontSize: '9px', color: '#10b981', fontWeight: 700, fontStyle: 'italic', background: 'rgba(16,185,129,0.08)', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.1)' }}>
                                                    ➜ {englishExplanation}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
