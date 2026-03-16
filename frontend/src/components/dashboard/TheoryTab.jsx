/**
 * TheoryTab - Step-by-step algorithm explanation viewer
 * Has its own step navigator so users can click through
 * each algorithmic decision and see the "Why this step?" reason.
 */
import { useState, useEffect } from 'react';
import { PSEUDOCODE } from '../../data/pseudocode';
import useStore from '../../store/useStore';

export function TheoryTab() {
    const { algorithm, stepsResult, currentStepIndex, setCurrentStepIndex } = useStore();
    const pseudocode = PSEUDOCODE[algorithm] || [];

    // Use a local step index that syncs with the global one but can be controlled here too
    const [localStep, setLocalStep] = useState(currentStepIndex);

    // Sync local when global changes (e.g. from DecisionTree slider)
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>

            {/* Step Navigator — always visible if there are steps */}
            {totalSteps > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    border: '1px solid #334155',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Step Navigator
                        </span>
                        <span style={{
                            fontSize: '12px', fontWeight: 800,
                            color: '#818cf8', background: 'rgba(99,102,241,0.15)',
                            padding: '2px 10px', borderRadius: 10
                        }}>
                            {localStep + 1} / {totalSteps}
                        </span>
                    </div>

                    {/* Slider */}
                    <input
                        type="range"
                        min="0"
                        max={totalSteps - 1}
                        value={localStep}
                        onChange={(e) => goTo(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer', marginBottom: 8, height: '12px' }}
                    />

                    {/* Prev / Next buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={() => goTo(localStep - 1)}
                            disabled={localStep === 0}
                            style={{
                                flex: 1, padding: '5px', fontSize: '12px', cursor: localStep === 0 ? 'not-allowed' : 'pointer',
                                background: localStep === 0 ? 'rgba(51,65,85,0.4)' : 'rgba(99,102,241,0.2)',
                                border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6,
                                color: localStep === 0 ? '#475569' : '#818cf8', fontWeight: 600
                            }}
                        >
                            ⬅ Prev
                        </button>
                        <button
                            onClick={() => goTo(localStep + 1)}
                            disabled={localStep === totalSteps - 1}
                            style={{
                                flex: 1, padding: '5px', fontSize: '12px', cursor: localStep === totalSteps - 1 ? 'not-allowed' : 'pointer',
                                background: localStep === totalSteps - 1 ? 'rgba(51,65,85,0.4)' : 'rgba(99,102,241,0.2)',
                                border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6,
                                color: localStep === totalSteps - 1 ? '#475569' : '#818cf8', fontWeight: 600
                            }}
                        >
                            Next ➡
                        </button>
                    </div>
                </div>
            )}

            {/* Core Demo Logic Info Box (Princeton Style) */}
            <div style={{ background: '#f8fafc', borderBottom: '2px solid #334155', padding: '12px 16px', flexShrink: 0 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 500, color: '#000' }}>
                    {algorithm === 'dijkstra' ? "Dijkstra's algorithm demo" :
                        algorithm === 'astar' ? "A* algorithm demo" : "Bellman-Ford demo"}
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '13px', color: '#1e293b', lineHeight: 1.6 }}>
                    {algorithm === 'dijkstra' && (
                        <>
                            <li>Consider vertices in increasing order of distance from <strong>s</strong> (non-tree vertex with the lowest <code>distTo[]</code> value).</li>
                            <li>Add vertex to tree and <strong>relax</strong> all edges pointing from that vertex.</li>
                        </>
                    )}
                    {algorithm === 'astar' && (
                        <>
                            <li>Consider vertices in increasing order of estimated total distance <strong>f(n) = g(n) + h(n)</strong>.</li>
                            <li>Add vertex to tree and <strong>relax</strong> all edges pointing from that vertex.</li>
                        </>
                    )}
                    {algorithm === 'bellman_ford' && (
                        <>
                            <li>Initialize <code>distTo[s] = 0</code> and all other <code>distTo[]</code> values to infinity.</li>
                            <li>Repeat <strong>V</strong> times: <strong>relax</strong> each edge in the graph.</li>
                        </>
                    )}
                </ul>
            </div>

            {/* WHY THIS STEP & MATH BREAKDOWN */}
            <div style={{
                background: explanation
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(124,58,237,0.05))'
                    : '#f8fafc',
                borderRadius: 10,
                border: explanation ? '1px solid rgba(99,102,241,0.25)' : '1px solid #e2e8f0',
                padding: '12px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: '18px' }}>💡</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: explanation ? '#6366f1' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Why this step?
                    </span>
                    {currentStep && (
                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>
                            step #{localStep + 1} — {currentStep.node}
                        </span>
                    )}
                </div>
                {explanation ? (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{
                            fontSize: '13px', color: '#1e293b', lineHeight: 1.65,
                            fontWeight: 500, margin: 0,
                            background: 'rgba(255,255,255,0.7)', padding: '8px 10px',
                            borderRadius: 6, borderLeft: '3px solid #6366f1'
                        }}>
                            {explanation}
                        </p>

                        {/* Math Breakdown Panel */}
                        {currentStep.math_breakdown && (
                            <div style={{
                                background: 'rgba(255,255,255,0.9)',
                                borderRadius: 6,
                                padding: '8px 10px',
                                border: '1px solid rgba(99,102,241,0.15)',
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)',
                                color: '#334155'
                            }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', marginBottom: 4, textTransform: 'uppercase' }}>
                                    Math Breakdown
                                </div>
                                {currentStep.math_breakdown.f !== undefined ? (
                                    <div>
                                        <span style={{ fontWeight: 600, color: '#d946ef' }}>f(n)</span> =
                                        <span style={{ color: '#3b82f6' }}> g(n)</span> +
                                        <span style={{ color: '#10b981' }}> h(n)</span>
                                        <br />
                                        <span style={{ fontWeight: 600, color: '#d946ef' }}>{currentStep.math_breakdown.f.toFixed(2)}s</span> =
                                        <span style={{ color: '#3b82f6' }}> {currentStep.math_breakdown.g.toFixed(2)}s</span> +
                                        <span style={{ color: '#10b981' }}> {currentStep.math_breakdown.h.toFixed(2)}s</span>
                                    </div>
                                ) : currentStep.math_breakdown.g !== undefined ? (
                                    <div>
                                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>Transit Time g(n)</span> =
                                        <span style={{ color: '#3b82f6' }}>{currentStep.math_breakdown.g.toFixed(2)}s</span>
                                    </div>
                                ) : currentStep.math_breakdown.relaxations_found !== undefined ? (
                                    <div>
                                        Edges fully relaxed: <span style={{ fontWeight: 800, color: '#f59e0b' }}>{currentStep.math_breakdown.relaxations_found}</span>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                ) : totalSteps > 0 ? (
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                        Use the slider above to navigate to a step.
                    </p>
                ) : (
                    <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                        Explanations will appear here as you step through the algorithm.
                    </p>
                )}
            </div>

            {/* Pseudocode Viewer */}
            <div style={{ flex: 1, background: '#0f172a', borderRadius: 10, padding: '12px', border: '1px solid #1e293b', overflowY: 'auto' }}>
                <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, fontWeight: 700 }}>
                    📋 Pseudocode
                    {activeLine && <span style={{ marginLeft: 8, color: '#818cf8' }}>← line {activeLine} active</span>}
                </div>
                {pseudocode.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                        Select an algorithm to see its pseudocode.
                    </p>
                ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.7 }}>
                        {pseudocode.map((line) => {
                            const isActive = line.line === activeLine;

                            // Map simple plain English explanations to the pseudocode index
                            let englishExplanation = "";
                            if (isActive) {
                                if (algorithm === 'dijkstra') {
                                    if (line.line === 1) englishExplanation = "Initialize distTo[start]=0, others=∞.";
                                    else if (line.line === 2) englishExplanation = "Enqueue start vertex to begin search.";
                                    else if (line.line === 3) englishExplanation = "Consider vertices in increasing order of distance.";
                                    else if (line.line === 4) englishExplanation = `Select non-tree vertex ${currentStep?.node ? `'${currentStep.node}'` : 'u'} with the lowest distTo[] value.`;
                                    else if (line.line === 5) englishExplanation = `Target vertex reached. Shortest-paths tree complete.`;
                                    else if (line.line === 6) englishExplanation = `Explore neighbors adjacent to ${currentStep?.node ? `'${currentStep.node}'` : 'u'}.`;
                                    else if (line.line === 7) englishExplanation = "Check if taking this edge improves the known distance (relaxation condition).";
                                    else if (line.line === 8) englishExplanation = `relax all edges pointing from ${currentStep?.node ? `'${currentStep.node}'` : 'this vertex'}. update edgeTo[] and distTo[].`;
                                } else if (algorithm === 'astar') {
                                    if (line.line === 1) englishExplanation = "Initialize arrays: g[start]=0, f[start]=h(start).";
                                    else if (line.line === 2) englishExplanation = "Enqueue start vertex to begin search.";
                                    else if (line.line === 3) englishExplanation = "Consider vertices in increasing order of f(n).";
                                    else if (line.line === 4) englishExplanation = `Select non-tree vertex ${currentStep?.node ? `'${currentStep.node}'` : 'u'} with the lowest f(n) value.`;
                                    else if (line.line === 5) englishExplanation = `Target vertex reached. Shortest-paths tree complete.`;
                                    else if (line.line === 6) englishExplanation = `Explore neighbors adjacent to ${currentStep?.node ? `'${currentStep.node}'` : 'u'}.`;
                                    else if (line.line === 7) englishExplanation = "Check if taking this edge improves the known distance (relaxation condition).";
                                    else if (line.line === 8) englishExplanation = `relax all edges pointing from ${currentStep?.node ? `'${currentStep.node}'` : 'this vertex'}. update edgeTo[].`;
                                } else if (algorithm === 'bellman_ford') {
                                    if (line.line === 1) englishExplanation = "Initialize distTo[start]=0, others=∞.";
                                    else if (line.line === 2) englishExplanation = "Outer loop: repeat V times.";
                                    else if (line.line === 3) englishExplanation = "Inner loop: consider every edge in the graph.";
                                    else if (line.line === 4) englishExplanation = "Check if taking this edge improves the known distance (relaxation condition).";
                                    else if (line.line === 5) englishExplanation = "relax the edge. update edgeTo[] and distTo[].";
                                    else if (line.line === 6) englishExplanation = "Final pass: if any edge can still be relaxed, a negative cycle exists.";
                                }
                            }

                            return (
                                <div key={line.line} style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div
                                        onClick={() => {
                                            // Find a step that activates this line
                                            const idx = stepsResult?.steps?.findIndex(s => s.active_line === line.line);
                                            if (idx >= 0) goTo(idx);
                                        }}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                            color: isActive ? '#a5b4fc' : '#64748b',
                                            borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                                            transition: 'all 0.2s ease',
                                            whiteSpace: 'pre-wrap',
                                            cursor: 'pointer',
                                        }}
                                        title="Click to jump to this line's first step"
                                    >
                                        <span style={{ opacity: 0.35, marginRight: 12, userSelect: 'none', display: 'inline-block', width: 14, textAlign: 'right' }}>
                                            {line.line}
                                        </span>
                                        {line.text}
                                    </div>
                                    {isActive && englishExplanation && (
                                        <div style={{ marginLeft: 34, marginTop: 4, marginBottom: 6, fontSize: '10px', color: '#10b981', fontStyle: 'italic', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: 4 }}>
                                            💡 {englishExplanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
