import { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { displayNodeName } from '../../data/townGraph';

function baseSlidesFor(algorithm) {
    if (algorithm === 'dijkstra') {
        return [
            {
                title: 'Dijkstra: The Big Idea',
                bullets: [
                    'Goal: shortest paths from a source when all edge weights are non-negative.',
                    'Maintain a tentative distance dist[v] for each vertex v (best known so far).',
                    'Repeatedly settle the unsettled vertex with the smallest dist[v].',
                ],
                formula: 'Selection rule: choose u with smallest dist[u] among unsettled.',
            },
            {
                title: 'Relaxation',
                bullets: [
                    'For each edge u → v with weight w(u,v): candidate = dist[u] + w(u,v).',
                    'If candidate < dist[v], update dist[v] and set parent[v] = u.',
                    'If not, nothing changes for v.',
                ],
                formula: 'if dist[u] + w(u,v) < dist[v] then update',
            },
            {
                title: 'What “Settled” Means',
                bullets: [
                    'Once u is settled, dist[u] is final and will never improve.',
                    'Reason: any other path to u would need to come from a vertex with dist ≥ dist[u].',
                ],
            },
        ];
    }

    if (algorithm === 'astar') {
        return [
            {
                title: 'A*: The Big Idea',
                bullets: [
                    'Goal: shortest path from start to goal using a heuristic to guide the search.',
                    'Open set: candidates to explore; Closed set: already explored.',
                    'Always expand the open-set node with the smallest estimated total cost.',
                ],
                formula: 'f(n) = g(n) + h(n)',
            },
            {
                title: 'Scores Explained',
                bullets: [
                    'g(n): cost from start to node n (confirmed along the current best route).',
                    'h(n): heuristic estimate from n to the goal (should not overestimate).',
                    'f(n): estimated total cost through n.',
                ],
            },
            {
                title: 'Relaxation in A*',
                bullets: [
                    'For each neighbor v of current node u, compute candidate g and candidate f.',
                    'If candidate g is smaller than the current stored g(v), update parent[v]=u and refresh v in the open set.',
                ],
            },
        ];
    }

    if (algorithm === 'bellman_ford') {
        return [
            {
                title: 'Bellman-Ford: The Big Idea',
                bullets: [
                    'Goal: shortest paths even with negative edge weights (if no negative cycles).',
                    'Does not choose a “best next node”. It repeatedly checks every edge.',
                    'Performs up to V−1 passes; each pass relaxes all edges once.',
                ],
                formula: 'Repeat passes: for i=1..V−1 relax all edges',
            },
            {
                title: 'Relaxation Check',
                bullets: [
                    'For each edge u → v with weight w(u,v): candidate = dist[u] + w(u,v).',
                    'If candidate < dist[v], update dist[v] and parent[v] = u.',
                    'If no distances change in a pass, you can stop early.',
                ],
            },
            {
                title: 'Negative Cycle Check (if enabled)',
                bullets: [
                    'After V−1 passes, do one more pass.',
                    'If any edge can still relax a distance, a negative cycle exists.',
                ],
            },
        ];
    }

    return [
        {
            title: 'Algorithm Tutor',
            bullets: [
                'Select an algorithm and start a simulation to generate step narration.',
                'Ask questions like: “why this node?”, “what changed?”, “what is dist[]?”, “what happens next?”',
            ],
        },
    ];
}

function answerFromStep({ algorithm, step, question }) {
    const q = String(question || '').toLowerCase();
    const narr = step?.narration || null;
    const focus = step?.node ? displayNodeName(step.node) : null;
    const comparisons = Array.isArray(narr?.comparisons) ? narr.comparisons : [];
    const updates = comparisons.filter((c) => c?.updated);
    const noUpdates = comparisons.filter((c) => c && !c.updated);

    const header = `${algorithm?.toUpperCase?.() || 'ALGORITHM'}${focus ? ` · Focus: ${focus}` : ''}`;

    if (!step || !narr) {
        return {
            title: header,
            markdown:
                'No step narration is available yet.\n\nStart the simulation so the tutor can explain each step using the generated action/why/comparisons/state.',
        };
    }

    if (q.includes('why') || q.includes('chosen') || q.includes('select')) {
        return {
            title: header,
            markdown:
                `**Why this choice?**\n\n${narr.why}\n\n**End-of-step summary**\n\n${narr.summary || '(no summary provided)'}`,
        };
    }

    if (q.includes('what changed') || q.includes('update') || q.includes('relax')) {
        const lines = updates.slice(0, 12).map((c) => {
            const e = c?.edge || {};
            const to = e?.to ? displayNodeName(e.to) : '(unknown)';
            const oldV = c?.old_value ?? '—';
            const cand = c?.candidate_value ?? '—';
            const newV = c?.new_value ?? '—';
            const parent = c?.new_parent ? `parent=${c.new_parent}` : '';
            return `- ${to}: ${String(oldV)} → ${String(newV)} (candidate=${String(cand)}) ${parent}`.trim();
        });
        return {
            title: header,
            markdown:
                `**What changed in this step**\n\n` +
                (lines.length ? lines.join('\n') : 'No values were updated in this step.') +
                `\n\n**What did not change**\n\nNo-update comparisons: ${noUpdates.length}`,
        };
    }

    if (q.includes('compare') || q.includes('candidate') || q.includes('old') || q.includes('new')) {
        const sample = comparisons.slice(0, 10).map((c) => {
            const e = c?.edge || {};
            const to = e?.to ? displayNodeName(e.to) : '(unknown)';
            const oldV = c?.old_value ?? '—';
            const cand = c?.candidate_value ?? '—';
            const newV = c?.new_value ?? '—';
            const verdict = c?.updated ? 'UPDATE' : 'NO UPDATE';
            return `- ${verdict}: ${to} (old=${String(oldV)}, candidate=${String(cand)}, new=${String(newV)})`;
        });
        return {
            title: header,
            markdown:
                `**Comparisons in this step**\n\n` +
                (sample.length ? sample.join('\n') : 'No comparisons recorded.') +
                `\n\nTip: ask “what changed?” to focus only on updates.`,
        };
    }

    if (q.includes('state') || q.includes('frontier') || q.includes('open set') || q.includes('closed') || q.includes('queue')) {
        const s = narr.state_after || {};
        const open = Array.isArray(s.open_set) ? s.open_set.slice(0, 8) : [];
        const frontier = Array.isArray(s.unsettled_frontier) ? s.unsettled_frontier.slice(0, 8) : [];
        const settled = Array.isArray(s.settled) ? s.settled.slice(-10) : [];

        const lines = [];
        if (frontier.length) lines.push(`**Frontier**: ${frontier.map((x) => displayNodeName(x.node)).join(', ')}`);
        if (open.length) lines.push(`**Open set**: ${open.map((x) => displayNodeName(x.node)).join(', ')}`);
        if (settled.length) lines.push(`**Settled/Closed (recent)**: ${settled.map(displayNodeName).join(', ')}`);
        if (typeof s.pass_num === 'number') lines.push(`**Pass**: ${s.pass_num} / ${s.passes_total ?? '—'}`);

        return {
            title: header,
            markdown:
                `**Algorithm state after this step**\n\n` +
                (lines.length ? lines.join('\n\n') : 'State snapshot not available for this step.'),
        };
    }

    // Default: slide-like narration
    return {
        title: header,
        markdown:
            `**${narr.action_title || 'Current step'}**\n\n` +
            (narr.action_subtitle ? `${narr.action_subtitle}\n\n` : '') +
            `**Why**\n\n${narr.why}\n\n` +
            `**End-of-step summary**\n\n${narr.summary || '(no summary provided)'}` +
            `\n\nTry asking:\n- “Why was this node chosen?”\n- “What changed?”\n- “Show comparisons”\n- “What is the open set/frontier?”`,
    };
}

export function OfflineTutorOverlay() {
    const {
        tutorOpen,
        setTutorOpen,
        tutorHistory,
        tutorAddMessage,
        tutorClear,
        algorithm,
        stepsResult,
        currentStepIndex,
        pushUiOverlayLock,
        popUiOverlayLock,
    } = useStore(
        (s) => ({
            tutorOpen: s.tutorOpen,
            setTutorOpen: s.setTutorOpen,
            tutorHistory: s.tutorHistory,
            tutorAddMessage: s.tutorAddMessage,
            tutorClear: s.tutorClear,
            algorithm: s.algorithm,
            stepsResult: s.stepsResult,
            currentStepIndex: s.currentStepIndex,
            pushUiOverlayLock: s.pushUiOverlayLock,
            popUiOverlayLock: s.popUiOverlayLock,
        }),
        shallow
    );

    const [draft, setDraft] = useState('');
    const scrollRef = useRef(null);

    const currentStep = stepsResult?.steps?.[currentStepIndex] || null;
    const slides = useMemo(() => baseSlidesFor(algorithm), [algorithm]);

    useEffect(() => {
        if (!tutorOpen) return;
        // Ensure 3D HTML labels are suppressed while overlay is visible.
        pushUiOverlayLock();
        return () => {
            popUiOverlayLock();
        };
    }, [tutorOpen, pushUiOverlayLock, popUiOverlayLock]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [tutorHistory?.length]);

    if (!tutorOpen) return null;

    function send(text) {
        const t = String(text || '').trim();
        if (!t) return;

        tutorAddMessage({ role: 'user', content: t });

        const a = answerFromStep({ algorithm, step: currentStep, question: t });
        tutorAddMessage({ role: 'assistant', content: `**${a.title}**\n\n${a.markdown}` });
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 8000,
                background: 'rgba(0,0,0,0.62)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
            }}
            onMouseDown={(e) => {
                // clicking backdrop closes
                if (e.target === e.currentTarget) setTutorOpen(false);
            }}
        >
            <div
                style={{
                    width: 'min(1120px, 96vw)',
                    height: 'min(840px, 92vh)',
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.16)',
                    background: 'linear-gradient(180deg, rgba(10,15,25,0.98), rgba(7,10,18,0.96))',
                    boxShadow: '0 30px 120px rgba(0,0,0,0.60)',
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div
                        style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid rgba(148,163,184,0.14)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9fb0ca' }}>
                                Offline Tutor
                            </div>
                            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 950, color: '#eef2ff' }}>
                                {algorithm?.toUpperCase?.() || 'ALGORITHM'} · Slides + Q&A (No Internet)
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => tutorClear()}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 12,
                                    border: '1px solid rgba(148,163,184,0.16)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: '#93a6c3',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                }}
                            >
                                Clear Chat
                            </button>
                            <button
                                onClick={() => setTutorOpen(false)}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 12,
                                    border: '1px solid rgba(248,113,113,0.22)',
                                    background: 'rgba(248,113,113,0.10)',
                                    color: '#fca5a5',
                                    fontWeight: 950,
                                    cursor: 'pointer',
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            <button
                                disabled={!currentStep}
                                onClick={() => send('Explain the current step as a lecture slide.')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(34,211,238,0.22)',
                                    background: 'linear-gradient(135deg, rgba(34,211,238,0.14), rgba(91,156,246,0.10))',
                                    color: '#d6f9ff',
                                    fontWeight: 950,
                                    fontSize: 12,
                                    cursor: currentStep ? 'pointer' : 'not-allowed',
                                    opacity: currentStep ? 1 : 0.5,
                                }}
                            >
                                Explain This Step
                            </button>
                            <button
                                disabled={!currentStep}
                                onClick={() => send('Why was this node chosen?')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(148,163,184,0.16)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: '#cbd5e1',
                                    fontWeight: 900,
                                    fontSize: 12,
                                    cursor: currentStep ? 'pointer' : 'not-allowed',
                                    opacity: currentStep ? 1 : 0.5,
                                }}
                            >
                                Why This Choice?
                            </button>
                            <button
                                onClick={() => send('Explain the algorithm overall from scratch.')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(148,163,184,0.16)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: '#cbd5e1',
                                    fontWeight: 900,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                }}
                            >
                                Explain Algorithm
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 12,
                                overflowX: 'auto',
                                paddingBottom: 6,
                                scrollSnapType: 'x mandatory',
                            }}
                        >
                            {slides.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        scrollSnapAlign: 'start',
                                        border: '1px solid rgba(148,163,184,0.14)',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 16,
                                        padding: 14,
                                        minWidth: 290,
                                    }}
                                >
                                    <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9fb0ca' }}>
                                        Slide {i + 1}
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 14, fontWeight: 950, color: '#eef2ff' }}>
                                        {s.title}
                                    </div>
                                    {s.formula ? (
                                        <div
                                            style={{
                                                marginTop: 10,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 12,
                                                color: '#dbeafe',
                                                background: 'rgba(34,211,238,0.08)',
                                                border: '1px solid rgba(34,211,238,0.18)',
                                                padding: '8px 10px',
                                                borderRadius: 12,
                                            }}
                                        >
                                            {String(s.formula)}
                                        </div>
                                    ) : null}
                                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {(Array.isArray(s.bullets) ? s.bullets : []).slice(0, 8).map((b, bi) => (
                                            <div key={bi} style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.6 }}>
                                                {String(b)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div
                            ref={scrollRef}
                            style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                borderRadius: 16,
                                border: '1px solid rgba(148,163,184,0.14)',
                                background: 'rgba(255,255,255,0.02)',
                                padding: 12,
                            }}
                        >
                            {(tutorHistory || []).map((m, idx) => (
                                <div key={idx} style={{ marginBottom: 10 }}>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 950,
                                            color: m.role === 'user' ? '#86efac' : '#93c5fd',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.12em',
                                        }}
                                    >
                                        {m.role}
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                        {String(m.content || '')}
                                    </div>
                                </div>
                            ))}
                            {!tutorHistory?.length ? (
                                <div style={{ fontSize: 12, color: '#7a8aaa' }}>
                                    Ask a question. Example: “Why was this node chosen?” or “What changed in this step?”
                                </div>
                            ) : null}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <input
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        const t = draft;
                                        setDraft('');
                                        send(t);
                                    }
                                }}
                                placeholder="Ask anything (offline)…"
                                style={{
                                    flex: 1,
                                    padding: '12px 14px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(148,163,184,0.16)',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: '#e2e8f0',
                                    fontSize: 13,
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={() => {
                                    const t = draft;
                                    setDraft('');
                                    send(t);
                                }}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: 14,
                                    border: '1px solid rgba(34,211,238,0.22)',
                                    background: 'linear-gradient(135deg, rgba(34,211,238,0.14), rgba(91,156,246,0.10))',
                                    color: '#d6f9ff',
                                    fontWeight: 950,
                                    cursor: 'pointer',
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(148,163,184,0.14)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9fb0ca' }}>
                        Current Step (Source Data)
                    </div>
                    <div style={{ fontSize: 12, color: '#93a6c3', lineHeight: 1.65 }}>
                        The offline tutor explains using your structured `narration` payload. This panel shows exactly what it reads.
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ padding: 12, borderBottom: '1px solid rgba(148,163,184,0.14)', fontSize: 10, fontWeight: 950, color: '#cbd5e1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            narration (JSON)
                        </div>
                        <pre style={{ margin: 0, padding: 12, fontSize: 10, color: '#b7c7e6', overflow: 'auto', height: '100%', fontFamily: 'var(--font-mono)' }}>
                            {JSON.stringify(currentStep?.narration || null, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
