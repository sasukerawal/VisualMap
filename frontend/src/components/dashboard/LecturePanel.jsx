import { useEffect, useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { computePathSteps } from '../../api/pathfinding';
import { displayNodeName } from '../../data/townGraph';

function asDisplayNumber(v) {
    if (v == null) return '—';
    if (v === 'inf' || v === '∞') return '∞';
    if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2) : String(v);
    return String(v);
}

function getFrontierCandidates(narr) {
    const s = narr?.state_after || null;
    const frontier = Array.isArray(s?.unsettled_frontier) ? s.unsettled_frontier : null;
    if (frontier?.length) return frontier.map((x) => x?.node).filter(Boolean);
    const open = Array.isArray(s?.open_set) ? s.open_set : null;
    if (open?.length) return open.map((x) => x?.node).filter(Boolean);
    return [];
}

function CompareRulesTable() {
    const rows = [
        {
            algo: 'Dijkstra',
            rule: 'Choose the unsettled node with the smallest tentative distance.',
            assumptions: 'Requires non-negative weights (standard form).',
            failure: 'Negative weights can break “finalized” correctness.',
        },
        {
            algo: 'A*',
            rule: 'Choose the node with the smallest f(n) = g(n) + h(n).',
            assumptions: 'Optimal with admissible/consistent heuristic (classic conditions).',
            failure: 'Bad heuristics can expand more nodes; non-admissible can be suboptimal.',
        },
        {
            algo: 'Bellman-Ford',
            rule: 'Relax all edges repeatedly (|V|-1 passes), then check for further relaxations.',
            assumptions: 'Supports negative edges.',
            failure: 'If an edge still relaxes after |V|-1 passes, a reachable negative cycle exists.',
        },
    ];

    const th = { textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9fb0ca', padding: '8px 10px', borderBottom: '1px solid rgba(148,163,184,0.12)' };
    const td = { fontSize: 11, color: '#cbd5e1', padding: '10px', borderBottom: '1px solid rgba(148,163,184,0.10)', verticalAlign: 'top', lineHeight: 1.45 };

    return (
        <div className="card" style={{ borderRadius: 14, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ ...th, width: 100 }}>Algorithm</th>
                        <th style={th}>Decision rule</th>
                        <th style={th}>Assumptions</th>
                        <th style={th}>Failure mode</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.algo}>
                            <td style={{ ...td, fontWeight: 900, color: '#eef2ff' }}>{r.algo}</td>
                            <td style={td}>{r.rule}</td>
                            <td style={td}>{r.assumptions}</td>
                            <td style={td}>{r.failure}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StateAfter({ narr, mode }) {
    const s = narr?.state_after || null;
    if (!s) return null;

    const showSets = mode !== 'beginner';
    const showPreviewTables = mode === 'advanced' || mode === 'professor';

    return (
        <div className="card" style={{ borderRadius: 14, padding: '12px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>State After</div>
                {typeof s.updates_in_step === 'number' && (
                    <div style={{ fontSize: 10, color: '#9fb0ca', fontFamily: 'var(--font-mono)' }}>
                        updates={s.updates_in_step}
                    </div>
                )}
            </div>

            {showSets && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {Array.isArray(s.settled) && (
                        <div style={{ fontSize: 10, color: '#cbd5e1' }}>
                            <strong style={{ color: '#eef2ff' }}>Settled:</strong> {s.settled.slice(0, 8).map(displayNodeName).join(', ')}{s.settled.length > 8 ? '…' : ''}
                        </div>
                    )}
                    {Array.isArray(s.closed_set) && s.closed_set.length > 0 && (
                        <div style={{ fontSize: 10, color: '#cbd5e1' }}>
                            <strong style={{ color: '#eef2ff' }}>Closed:</strong> {s.closed_set.slice(0, 8).map(displayNodeName).join(', ')}{s.closed_set.length > 8 ? '…' : ''}
                        </div>
                    )}
                </div>
            )}

            {Array.isArray(s.unsettled_frontier) && s.unsettled_frontier.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 10, color: '#cbd5e1' }}>
                    <strong style={{ color: '#eef2ff' }}>Frontier:</strong>{' '}
                    {s.unsettled_frontier.slice(0, 6).map((x) => `${displayNodeName(x.node)}(${asDisplayNumber(x.key)})`).join(', ')}
                    {s.unsettled_frontier.length > 6 ? '…' : ''}
                </div>
            )}

            {Array.isArray(s.open_set) && s.open_set.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 10, color: '#cbd5e1' }}>
                    <strong style={{ color: '#eef2ff' }}>Open set:</strong>{' '}
                    {s.open_set.slice(0, 6).map((x) => `${displayNodeName(x.node)}(${asDisplayNumber(x.key)})`).join(', ')}
                    {s.open_set.length > 6 ? '…' : ''}
                </div>
            )}

            {showPreviewTables && (s.dist_preview || s.parent_preview) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    {s.dist_preview && (
                        <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 10px' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>dist preview</div>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {Object.entries(s.dist_preview).slice(0, 8).map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayNodeName(k)}</span>
                                        <span style={{ color: '#d6f9ff' }}>{asDisplayNumber(v)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {s.parent_preview && (
                        <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: '10px 10px' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>parent preview</div>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {Object.entries(s.parent_preview).slice(0, 8).map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayNodeName(k)}</span>
                                        <span style={{ color: '#d6f9ff' }}>{v ? displayNodeName(v) : '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Comparisons({ narr, mode, metricLabel }) {
    const comparisons = Array.isArray(narr?.comparisons) ? narr.comparisons : [];
    if (!comparisons.length) return null;
    if (mode === 'beginner') return null;

    const updated = comparisons.filter((c) => c?.updated);
    const noChange = comparisons.filter((c) => c && !c.updated);
    const showAllDefault = mode === 'professor';
    const [showAll, setShowAll] = useState(showAllDefault);

    const visible = showAll ? comparisons : [...updated.slice(0, 4), ...noChange.slice(0, 2)];

    return (
        <div className="card" style={{ borderRadius: 14, padding: '12px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Comparisons</div>
                {comparisons.length > visible.length && (
                    <button className="btn btn-ghost" onClick={() => setShowAll((v) => !v)} style={{ height: 28, padding: '0 10px', fontSize: 11, borderRadius: 10 }}>
                        {showAll ? 'Show less' : `Show all (${comparisons.length})`}
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {visible.map((c, idx) => {
                    const edge = c?.edge || null;
                    const from = edge?.from ? displayNodeName(edge.from) : null;
                    const to = edge?.to ? displayNodeName(edge.to) : (c?.node ? displayNodeName(c.node) : null);
                    const title = from && to ? `${from} → ${to}` : (to || '—');

                    const oldV = c?.old_value ?? c?.old_f ?? c?.old_g ?? c?.old_fuel;
                    const candV = c?.candidate_value ?? c?.candidate_f ?? c?.candidate_g ?? c?.candidate_fuel;
                    const newV = c?.new_value ?? c?.new_f ?? c?.new_g ?? c?.new_fuel;

                    const updatedFlag = !!c?.updated;
                    const accent = updatedFlag ? '#22c55e' : '#f97316';

                    const formula =
                        oldV != null && candV != null
                            ? `${asDisplayNumber(oldV)} > ${asDisplayNumber(candV)}`
                            : null;

                    const note = c?.note || (updatedFlag ? 'Updated dist and predecessor.' : 'No update (candidate was not better).');

                    return (
                        <div key={idx} style={{ border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: '10px 10px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 999, background: accent, boxShadow: `0 0 14px ${accent}`, flexShrink: 0, marginTop: 3 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 900, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                                        {formula && (
                                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#d6f9ff' }}>
                                                {metricLabel}: {formula} {updatedFlag ? '→ update' : '→ keep'}
                                            </span>
                                        )}
                                        {newV != null && updatedFlag && (
                                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#a7f3d0' }}>
                                                new={asDisplayNumber(newV)}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 10, color: '#9fb0ca', lineHeight: 1.45 }}>{note}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function LecturePanel() {
    const {
        algorithm,
        orderMode,
        learningMode,
        stepsResult,
        currentStepIndex,
        destinations,
        currentSegment,
    } = useStore(
        (s) => ({
            algorithm: s.algorithm,
            orderMode: s.orderMode,
            learningMode: s.learningMode,
            stepsResult: s.stepsResult,
            currentStepIndex: s.currentStepIndex,
            destinations: s.destinations,
            currentSegment: s.currentSegment,
        }),
        shallow
    );

    const steps = stepsResult?.steps || [];
    const step = steps?.[currentStepIndex] || null;
    const narr = step?.narration || null;
    const optimization = stepsResult?.optimization_target || null;
    const lintWarnings = Array.isArray(stepsResult?.lint_warnings) ? stepsResult.lint_warnings : [];

    const [collapsed, setCollapsed] = useState(false);
    const [compareOpen, setCompareOpen] = useState(false);
    const [compareRun, setCompareRun] = useState(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [liveText, setLiveText] = useState('');

    const mode = learningMode === 'professor' ? 'professor' : learningMode;
    const metricLabel = algorithm === 'astar' ? 'gFuel' : 'dist';

    // Prediction prompt: offer a tiny active task on decision steps.
    const frontierCandidates = useMemo(() => (narr ? getFrontierCandidates(narr) : []), [narr]);
    const [predictionChoice, setPredictionChoice] = useState(null);
    const [predictionRevealed, setPredictionRevealed] = useState(false);

    const predictionOptions = useMemo(() => {
        if (!frontierCandidates.length) return [];
        const opts = frontierCandidates.slice(0, 4);
        return opts;
    }, [frontierCandidates]);

    useEffect(() => {
        setPredictionChoice(null);
        setPredictionRevealed(false);
    }, [currentStepIndex]);

    useEffect(() => {
        const title = narr?.action_title || `Step ${step?.step ?? currentStepIndex + 1}`;
        const why = narr?.why ? ` Why: ${narr.why}` : '';
        setLiveText(`${title}.${why}`.trim());
    }, [currentStepIndex, narr?.action_title, narr?.why, step?.step]);

    async function runCompare() {
        if (!destinations?.length) return;
        setCompareLoading(true);
        try {
            const algos = ['dijkstra', 'astar', 'bellman_ford'];
            const results = await Promise.all(
                algos.map((a) =>
                    computePathSteps({
                        algorithm: a,
                        start: 'warehouse',
                        destinations,
                        orderMode,
                        segmentIndex: typeof currentSegment === 'number' ? currentSegment : 0,
                    })
                )
            );
            const summary = results.map((r, i) => ({
                algorithm: algos[i],
                total_distance: r?.total_distance,
                steps: r?.steps?.length || 0,
            }));
            setCompareRun(summary);
        } catch (e) {
            setCompareRun([{ algorithm: 'error', total_distance: null, steps: 0, error: e?.message || 'Compare failed' }]);
        } finally {
            setCompareLoading(false);
        }
    }

    if (!stepsResult || !steps?.length) {
        return (
            <div className="card" style={{ borderRadius: 16, padding: '14px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Lecture</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#93a6c3', lineHeight: 1.55 }}>
                    Start navigation to generate a step-by-step trace. Then use the step controls to move through the explanation.
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ borderRadius: 16, padding: 0, overflow: 'hidden' }} aria-label="Lecture panel">
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {liveText}
            </div>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(148,163,184,0.10)', background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>
                        Lecture - {mode}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 900, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {narr?.action_title || `Step ${step?.step ?? currentStepIndex + 1}`}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {step?.step_type && (
                            <span className="badge badge-blue" style={{ borderRadius: 999, fontSize: 9 }}>
                                {String(step.step_type).replaceAll('_', ' ')}
                            </span>
                        )}
                        {optimization?.metric && optimization?.queue_key && (
                            <span style={{ fontSize: 10, color: '#9fb0ca', lineHeight: 1.4 }}>
                                <strong style={{ color: '#eef2ff' }}>Optimizing:</strong> {optimization.metric} - <strong style={{ color: '#eef2ff' }}>Key:</strong> {optimization.queue_key}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" onClick={() => setCompareOpen((v) => !v)} style={{ height: 30, padding: '0 10px', fontSize: 11, borderRadius: 10 }}>
                        Compare
                    </button>
                    <button className="btn btn-ghost" onClick={() => setCollapsed((v) => !v)} style={{ height: 30, padding: '0 10px', fontSize: 11, borderRadius: 10 }}>
                        {collapsed ? 'Expand' : 'Collapse'}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {mode === 'professor' && lintWarnings.length > 0 && (
                        <div className="card" style={{ borderRadius: 14, padding: '12px 12px', background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.22)' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fecaca' }}>
                                Narration lint
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {lintWarnings.slice(0, 6).map((w, i) => (
                                    <div key={i} style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.45 }}>
                                        {w}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {narr?.action_subtitle && mode !== 'beginner' && (
                        <div style={{ fontSize: 11, color: '#9fb0ca', lineHeight: 1.55 }}>{narr.action_subtitle}</div>
                    )}

                    <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                        <strong style={{ color: '#eef2ff' }}>Why:</strong> {narr?.why || '-'}
                    </div>

                    {(mode === 'intermediate' || mode === 'advanced' || mode === 'professor') && predictionOptions.length > 1 && (
                        <div className="card" style={{ borderRadius: 14, padding: '12px 12px', background: 'rgba(34,211,238,0.06)', borderColor: 'rgba(34,211,238,0.18)' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d6f9ff' }}>Predict</div>
                            <div style={{ marginTop: 6, fontSize: 11, color: '#cbd5e1', lineHeight: 1.55 }}>
                                Which node do you think will be chosen next from the frontier?
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                {predictionOptions.map((id) => (
                                    <button
                                        key={id}
                                        className="btn btn-ghost"
                                        onClick={() => setPredictionChoice(id)}
                                        style={{
                                            height: 30,
                                            padding: '0 10px',
                                            fontSize: 11,
                                            borderRadius: 10,
                                            borderColor: predictionChoice === id ? 'rgba(34,211,238,0.45)' : 'rgba(148,163,184,0.16)',
                                            color: predictionChoice === id ? '#d6f9ff' : '#cbd5e1',
                                        }}
                                    >
                                        {displayNodeName(id)}
                                    </button>
                                ))}
                                <button
                                    className="btn"
                                    onClick={() => setPredictionRevealed(true)}
                                    disabled={!predictionChoice}
                                    style={{ height: 30, padding: '0 10px', fontSize: 11, borderRadius: 10, background: 'rgba(34,211,238,0.14)', border: '1px solid rgba(34,211,238,0.22)', color: '#d6f9ff', fontWeight: 900 }}
                                >
                                    Reveal
                                </button>
                            </div>
                            {predictionRevealed && (
                                <div style={{ marginTop: 10, fontSize: 11, color: '#9fb0ca', lineHeight: 1.55 }}>
                                    Likely next: <strong style={{ color: '#eef2ff' }}>{displayNodeName(predictionOptions[0])}</strong>
                                    {predictionChoice ? (
                                            <>
                                                {' '} - You chose{' '}
                                                <strong style={{ color: '#eef2ff' }}>{displayNodeName(predictionChoice)}</strong>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                        </div>
                    )}

                    <Comparisons narr={narr} mode={mode} metricLabel={metricLabel} />
                    <StateAfter narr={narr} mode={mode} />

                    {(mode === 'advanced' || mode === 'professor') && narr?.summary && (
                        <div className="card" style={{ borderRadius: 14, padding: '12px 12px' }}>
                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fc7ff' }}>Checkpoint</div>
                            <div style={{ marginTop: 8, fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 }}>{narr.summary}</div>
                        </div>
                    )}

                    {compareOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <CompareRulesTable />
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                                <button className="btn" onClick={runCompare} disabled={compareLoading} style={{ borderRadius: 12, fontWeight: 900, background: 'rgba(91,156,246,0.16)', border: '1px solid rgba(91,156,246,0.26)', color: '#b3c7ff' }}>
                                    {compareLoading ? 'Running…' : 'Run Compare (same stops)'}
                                </button>
                                {compareRun && (
                                    <div style={{ fontSize: 10, color: '#9fb0ca' }}>
                                        {compareRun.map((r) => `${r.algorithm}: steps=${r.steps}, dist=${asDisplayNumber(r.total_distance)}`).join(' • ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
