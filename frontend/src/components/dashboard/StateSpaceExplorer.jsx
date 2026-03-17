/**
 * StateSpaceExplorer — "Schematic Topography"
 *
 * Replaced the old ReactFlow dots/edges schematic with a true top-down 2D render
 * of the town assets (roads/houses/warehouse) so the view matches the 3D map.
 */
import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { TopographyMap2DCanvas } from './TopographyMap2DCanvas';
import { displayNodeName } from '../../data/townGraph';

// Legend categories matching the reference style.
const LEGEND_ITEMS = [
    { label: 'Warehouse / Origin', color: '#f97316', type: 'circle' },
    { label: 'Current Selected Node (car)', color: '#a855f7', type: 'pulse' },
    { label: 'Open Set / Unsettled Candidates', color: '#22c55e', type: 'circle' },
    { label: 'No-update Comparisons', color: '#f97316', type: 'circle' },
    { label: 'Calculated Path', color: '#3b82f6', type: 'glow' },
];

function LegendOverlay({ dashboardMode }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setOpen((v) => !v)}
                style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    zIndex: 20,
                    padding: '8px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.16)',
                    background: open ? 'rgba(34,211,238,0.10)' : 'rgba(255,255,255,0.04)',
                    color: open ? '#d6f9ff' : '#cbd5e1',
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                }}
                title="Toggle legend"
            >
                Legend {open ? '▾' : '▸'}
            </button>

            {open ? (
                <div
                    style={{
                        position: 'absolute',
                        right: 12,
                        top: 48,
                        width: 220,
                        maxHeight: 320,
                        background: 'rgba(7, 10, 18, 0.88)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        padding: '14px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        zIndex: 15,
                        backdropFilter: 'blur(12px)',
                        borderRadius: 14,
                        boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
                    }}
                >
                    <h4
                        style={{
                            margin: 0,
                            fontSize: '10px',
                            color: '#fff',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                    >
                        Topography Legend
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                        {LEGEND_ITEMS.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {item.type === 'circle' && (
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                )}
                                {item.type === 'pulse' && (
                                    <div
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            border: `1px solid ${item.color}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: item.color }} />
                                    </div>
                                )}
                                {item.type === 'glow' && (
                                    <div
                                        style={{
                                            width: 14,
                                            height: 4,
                                            background: item.color,
                                            borderRadius: 2,
                                            boxShadow: `0 0 6px ${item.color}`,
                                            flexShrink: 0,
                                        }}
                                    />
                                )}
                                <span style={{ fontSize: '10px', color: '#b7c7e6', fontWeight: 700, lineHeight: 1.2 }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    );
}

function ZoneOverlay() {
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <div style={{ position: 'absolute', left: 16, top: '25%', color: '#fff', opacity: 0.08, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>
                Northern Zone
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: '100%',
                    borderBottom: '2px dashed rgba(255,255,255,0.05)',
                }}
            />
            <div style={{ position: 'absolute', left: 16, top: '60%', color: '#fff', opacity: 0.08, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>
                Southern Zone
            </div>
        </div>
    );
}

function DecisionSidebar({ stepsResult, currentStepIndex, routeResult, currentSegment }) {
    const step = stepsResult?.steps?.[currentStepIndex] || null;
    const narr = step?.narration || null;
    const nodeLabel = step?.node ? displayNodeName(step.node) : '-';
    const actionTitle = narr?.action_title || 'Current Step';
    const actionSubtitle = narr?.action_subtitle || null;
    const why = narr?.why || step?.explanation || '';
    const comparisons = Array.isArray(narr?.comparisons) ? narr.comparisons : [];
    const updated = comparisons.filter((c) => c?.updated);
    const noChange = comparisons.filter((c) => c && !c.updated);
    const [showAllComparisons, setShowAllComparisons] = useState(false);

    const seg = routeResult?.segments?.[currentSegment] || null;
    const segFrom = seg?.from ? displayNodeName(seg.from) : null;
    const segTo = seg?.to ? displayNodeName(seg.to) : null;

    return (
        <div
            style={{
                width: 'clamp(380px, 34vw, 520px)',
                flexShrink: 0,
                height: '100%',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(180deg, rgba(15,20,32,0.96), rgba(9,12,20,0.92))',
                padding: '18px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                minHeight: 0,
                resize: 'horizontal',
                overflow: 'hidden',
                minWidth: 360,
                maxWidth: 640,
            }}
        >
            <div>
                <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', color: '#9fb0ca', textTransform: 'uppercase' }}>
                    Current Step
                </div>
                {segFrom && segTo ? (
                    <div style={{ marginTop: 6, fontSize: '11px', color: '#93a6c3', fontWeight: 700 }}>
                        Segment: {segFrom} to {segTo}
                    </div>
                ) : null}
                <div style={{ marginTop: 8, fontSize: '16px', fontWeight: 950, color: '#fbbf24', lineHeight: 1.25 }}>
                    {actionTitle}
                </div>
                {actionSubtitle ? (
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#93a6c3', lineHeight: 1.5, fontWeight: 750 }}>
                        {actionSubtitle}
                    </div>
                ) : null}
                <div style={{ marginTop: 10, fontSize: '11px', color: '#7f93b2', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Focus
                </div>
                <div style={{ marginTop: 6, fontSize: '16px', fontWeight: 950, color: '#eef2ff' }}>
                    {nodeLabel}
                </div>
                {why ? (
                    <div style={{ marginTop: 12, fontSize: '13px', color: '#dbeafe', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                        {String(why)}
                    </div>
                ) : (
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#7a8aaa', lineHeight: 1.45 }}>
                        Start the simulation to see step-by-step decisions.
                    </div>
                )}
            </div>

            <div style={{ height: 1, background: 'rgba(148,163,184,0.14)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', color: '#9fb0ca', textTransform: 'uppercase' }}>
                    Step Comparisons
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingRight: 6 }}>
                    {comparisons.length ? (
                        <>
                            {[{ label: 'Updates (Relaxations That Improved a Value)', items: updated, color: '#22c55e' },
                              { label: 'No Update (Candidate Was Not Better)', items: noChange, color: '#f97316' }].map((group) => (
                                <div key={group.label} style={{ marginBottom: 10 }}>
                                    <div style={{ fontSize: '10px', fontWeight: 950, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '8px 0 6px' }}>
                                        {group.label}
                                    </div>
                                    {group.items.length ? (showAllComparisons ? group.items : group.items.slice(0, 10)).map((c, i) => {
                                        const edge = c?.edge || null;
                                        const from = edge?.from ? displayNodeName(edge.from) : null;
                                        const to = edge?.to ? displayNodeName(edge.to) : (c?.node ? displayNodeName(c.node) : null);
                                        const edgeName = from && to ? `${from} → ${to}` : (to || '-');
                                        const wTime = edge?.time_cost != null ? `${edge.time_cost}s` : null;
                                        const wDist = edge?.physical_distance != null ? `${edge.physical_distance}m` : null;
                                        const wFuel = edge?.fuel_cost != null ? `${edge.fuel_cost} fuel` : null;
                                        const slope = edge?.elev_delta != null ? `Δelev=${edge.elev_delta}` : null;
                                        const metrics = [wTime, wDist, wFuel, slope].filter(Boolean).join(' · ');
                                        const oldVal = c?.old_value ?? '—';
                                        const candVal = c?.candidate_value ?? '—';
                                        const newVal = c?.new_value ?? '—';
                                        const parentLine = (c?.new_parent || c?.old_parent) ? `parent: ${c?.old_parent ?? '—'} → ${c?.new_parent ?? c?.old_parent ?? '—'}` : null;

                                        return (
                                            <div
                                                key={`${group.label}-${edgeName}-${i}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 10,
                                                    padding: '10px 10px',
                                                    borderRadius: 12,
                                                    border: `1px solid ${c.updated ? 'rgba(34,197,94,0.22)' : 'rgba(249,115,22,0.22)'}`,
                                                    background: c.updated ? 'rgba(34,197,94,0.06)' : 'rgba(249,115,22,0.06)',
                                                }}
                                            >
                                                <div style={{ width: 10, height: 10, borderRadius: 999, background: group.color, boxShadow: `0 0 12px ${group.color}`, flexShrink: 0, marginTop: 3 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#eef2ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {edgeName}
                                                    </div>
                                                    {metrics ? (
                                                        <div style={{ fontSize: '10px', color: '#9fb0ca', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                                                            w = {metrics}
                                                        </div>
                                                    ) : null}
                                                    <div style={{ fontSize: '10px', color: '#b7c7e6', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                                                        old: {String(oldVal)} · candidate: {String(candVal)} · new: {String(newVal)}
                                                    </div>
                                                    {typeof c?.candidate_g !== 'undefined' || typeof c?.h !== 'undefined' ? (
                                                        <div style={{ fontSize: '10px', color: '#9fb0ca', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                                                            g: {String(c?.candidate_g ?? '—')} · h: {String(c?.h ?? '—')} · f: {String(c?.candidate_f ?? '—')}
                                                        </div>
                                                    ) : null}
                                                    {parentLine ? (
                                                        <div style={{ fontSize: '10px', color: '#93a6c3', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                                                            {parentLine}
                                                        </div>
                                                    ) : null}
                                                    {c?.note ? (
                                                        <div style={{ fontSize: '10px', color: '#93a6c3', marginTop: 4, lineHeight: 1.35 }}>
                                                            {String(c.note)}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div style={{ fontSize: '12px', color: '#7a8aaa' }}>None in this step.</div>
                                    )}
                                    {!showAllComparisons && group.items.length > 10 ? (
                                        <button
                                            onClick={() => setShowAllComparisons(true)}
                                            style={{
                                                marginTop: 8,
                                                width: '100%',
                                                padding: '9px 10px',
                                                borderRadius: 12,
                                                border: '1px solid rgba(148,163,184,0.16)',
                                                background: 'rgba(255,255,255,0.03)',
                                                color: '#cbd5e1',
                                                fontWeight: 850,
                                                fontSize: 11,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Show all comparisons ({group.items.length})
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                            {showAllComparisons ? (
                                <button
                                    onClick={() => setShowAllComparisons(false)}
                                    style={{
                                        marginTop: 6,
                                        width: '100%',
                                        padding: '9px 10px',
                                        borderRadius: 12,
                                        border: '1px solid rgba(148,163,184,0.16)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: '#93a6c3',
                                        fontWeight: 850,
                                        fontSize: 11,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Collapse comparisons
                                </button>
                            ) : null}
                            {narr?.summary ? (
                                <div style={{ marginTop: 8, padding: '10px 10px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 950, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                                        End of Step Summary
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#dbeafe', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{String(narr.summary)}</div>
                                </div>
                            ) : null}
                            {narr?.state_after ? (
                                <div style={{ marginTop: 10, padding: '10px 10px', borderRadius: 12, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 950, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                        State After This Step
                                    </div>
                                    {Array.isArray(narr.state_after.unsettled_frontier) && narr.state_after.unsettled_frontier.length ? (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontSize: '9px', fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                                Frontier (Smallest Tentative Distances)
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)' }}>
                                                {narr.state_after.unsettled_frontier.slice(0, 8).map((it) => (
                                                    <div key={it.node} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, color: '#b7c7e6' }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayNodeName(it.node)}</span>
                                                        <span style={{ color: '#93a6c3' }}>{String(it.key)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {Array.isArray(narr.state_after.open_set) && narr.state_after.open_set.length ? (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ fontSize: '9px', fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                                Open Set (Smallest f(n))
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)' }}>
                                                {narr.state_after.open_set.slice(0, 8).map((it) => (
                                                    <div key={it.node} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10, color: '#b7c7e6' }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayNodeName(it.node)}</span>
                                                        <span style={{ color: '#93a6c3' }}>{String(it.key)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {typeof narr.state_after.pass_num === 'number' ? (
                                        <div style={{ marginBottom: 10, fontSize: 10, color: '#b7c7e6', fontFamily: 'var(--font-mono)' }}>
                                            pass: {narr.state_after.pass_num} / {narr.state_after.passes_total ?? '—'} · updates in pass: {narr.state_after.updates_in_step ?? '—'}
                                        </div>
                                    ) : null}
                                    {narr.state_after.dist_preview ? (
                                        <div>
                                            <div style={{ fontSize: '9px', fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                                dist[] / parent[] preview
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'var(--font-mono)' }}>
                                                {Object.entries(narr.state_after.dist_preview).slice(0, 10).map(([id, val]) => (
                                                    <div key={id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, fontSize: 10, color: '#b7c7e6' }}>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayNodeName(id)}</span>
                                                        <span style={{ color: '#93a6c3' }}>{String(val)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div style={{ fontSize: '12px', color: '#7a8aaa' }}>No comparisons recorded for this step.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ResetButton({ mapRef }) {
    return (
        <button
            onClick={() => mapRef?.current?.recenter?.()}
            style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
            }}
        >
            Re-center
        </button>
    );
}

export function StateSpaceExplorer({ expanded = false, onClose, internalHeader = true, dashboardMode = false }) {
    const {
        stepsResult,
        routeResult,
        algorithm,
        currentStepIndex,
        setCurrentStepIndex,
        currentSegment,
        showLabels,
        setShowLabels,
        isTimelinePlaying,
        isTimelinePaused,
        animationSpeed,
    } = useStore(
        (s) => ({
            stepsResult: s.stepsResult,
            routeResult: s.routeResult,
            algorithm: s.algorithm,
            currentStepIndex: s.currentStepIndex,
            setCurrentStepIndex: s.setCurrentStepIndex,
            currentSegment: s.currentSegment,
            showLabels: s.showLabels,
            setShowLabels: s.setShowLabels,
            isTimelinePlaying: s.isTimelinePlaying,
            isTimelinePaused: s.isTimelinePaused,
            animationSpeed: s.animationSpeed,
        }),
        shallow
    );

    const [isExpanded, setIsExpanded] = useState(expanded);
    const [previousLabelState, setPreviousLabelState] = useState(true);
    const mapRef = useRef(null);
    const mapRefExpanded = useRef(null);
    const mapApiRef = useRef(null);
    const mapApiExpandedRef = useRef(null);

    // Auto-disable map labels when expanded (or in dashboard mode which fills the view)
    useEffect(() => {
        if (isExpanded || dashboardMode) {
            setPreviousLabelState(showLabels);
            setShowLabels(false);
            useStore.getState().setUiOverlayOpen(true);
        } else {
            setShowLabels(previousLabelState);
            useStore.getState().setUiOverlayOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded, dashboardMode]);

    const hasSteps = !!stepsResult?.steps?.length;
    const maxSteps = Math.max(0, (stepsResult?.steps?.length || 1) - 1);

    const searchProgress = useMemo(() => {
        if (!hasSteps) return 'Ready (start navigation)';
        return `Consideration ${currentStepIndex + 1} / ${stepsResult.steps.length}`;
    }, [hasSteps, currentStepIndex, stepsResult]);

    if (dashboardMode) {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
                <TopographyMap2DCanvas
                    selectedOnly
                    onReadyApi={(api) => {
                        mapApiRef.current = api;
                        mapRef.current = api;
                    }}
                    autoPauseAtNodes
                />
                <ZoneOverlay />
                <LegendOverlay dashboardMode />
            </div>
        );
    }

    const mapCard = (
        <div
            style={{
                flex: 1,
                minHeight: '120px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            <TopographyMap2DCanvas
                selectedOnly
                onReadyApi={(api) => {
                    mapApiRef.current = api;
                    mapRef.current = api;
                }}
                autoPauseAtNodes
            />
            <ZoneOverlay />
            <LegendOverlay dashboardMode={false} />
        </div>
    );

    const shouldRenderInlineMap = !isExpanded;

    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                        Schematic Topography
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#556080', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                            {String(algorithm || '').toUpperCase()} MODEL 1A
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <ResetButton mapRef={mapRef} />
                    {!onClose && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="btn-expand"
                            style={{
                                background: 'rgba(251,191,36,0.1)',
                                color: '#fbbf24',
                                border: '1px solid rgba(251,191,36,0.2)',
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: 6,
                                cursor: 'pointer',
                            }}
                        >
                            Expand
                        </button>
                    )}
                </div>
            </div>

            {shouldRenderInlineMap ? mapCard : (
                <div
                    style={{
                        flex: 1,
                        minHeight: '120px',
                        background: 'rgba(0,0,0,0.28)',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8aaa', textTransform: 'uppercase' }}>Algorithm Progress</span>
                        <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>{searchProgress}</span>
                    </div>
                    {hasSteps ? (
                        <input
                            type="range"
                            min="0"
                            max={maxSteps}
                            value={Math.min(currentStepIndex, maxSteps)}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                startTransition(() => setCurrentStepIndex(next));
                            }}
                            style={{ cursor: 'pointer', width: '100%', accentColor: '#fbbf24', height: '6px' }}
                        />
                    ) : (
                        <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.14)' }} />
                    )}
                </div>
            </div>
        </div>
    );

    if (onClose) return content;

    return (
        <>
            {content}
            {isExpanded && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(7, 10, 18, 0.98)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '1400px',
                            height: '90vh',
                            background: '#0b0e14',
                            borderRadius: 24,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 0 100px rgba(0,0,0,0.8)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 24px',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#161f2f',
                                flexShrink: 0,
                            }}
                        >
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', color: '#fbbf24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Algorithm Topography Model
                                </h2>
                                <p style={{ fontSize: '10px', color: '#7a8aaa', fontWeight: 700, margin: '2px 0 0' }}>
                                    Ref: Neighborhood Map View (Top-down 2D of the 3D town)
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <ResetButton mapRef={mapRefExpanded} />
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="btn-close"
                                    style={{
                                        background: 'rgba(255,100,100,0.1)',
                                        color: '#ff6b6b',
                                        padding: '8px 16px',
                                        border: '1px solid rgba(255,100,100,0.2)',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                            <DecisionSidebar stepsResult={stepsResult} currentStepIndex={currentStepIndex} routeResult={routeResult} currentSegment={currentSegment} />
                            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                                <TopographyMap2DCanvas
                                    selectedOnly
                                    onReadyApi={(api) => {
                                        mapApiExpandedRef.current = api;
                                        mapRefExpanded.current = api;
                                    }}
                                    autoPauseAtNodes
                                />
                                <ZoneOverlay />
                                <LegendOverlay dashboardMode />
                            </div>
                        </div>

                        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,24,0.92)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Algorithm Progress
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#eef2ff' }}>
                                        {hasSteps ? `Consideration ${currentStepIndex + 1} / ${stepsResult.steps.length}` : 'Ready'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {[0.5, 1, 1.5, 2].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => useStore.getState().setAnimationSpeed(s)}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                border: `1px solid ${animationSpeed === s ? 'rgba(91,156,246,0.35)' : 'rgba(148,163,184,0.16)'}`,
                                                background: animationSpeed === s ? 'rgba(58,125,200,0.16)' : 'rgba(255,255,255,0.03)',
                                                color: animationSpeed === s ? '#9fd0ff' : '#93a6c3',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                fontFamily: 'var(--font-mono)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {s}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <input
                                type="range"
                                min="0"
                                max={maxSteps}
                                value={Math.min(currentStepIndex, maxSteps)}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                startTransition(() => setCurrentStepIndex(next));
                            }}
                                style={{ cursor: 'pointer', width: '100%', accentColor: '#35d7e8', height: '6px' }}
                                disabled={!hasSteps}
                            />

                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button
                                    onClick={() =>
                                        isTimelinePlaying && !isTimelinePaused
                                            ? useStore.getState().pauseSimulation()
                                            : useStore.getState().runSimulation()
                                    }
                                    style={{
                                        flex: 1,
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        border: '1px solid rgba(34,211,238,0.22)',
                                        background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(91,156,246,0.14))',
                                        color: '#d6f9ff',
                                        fontWeight: 900,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        opacity: hasSteps ? 1 : 0.6,
                                    }}
                                    disabled={!hasSteps}
                                >
                                    {isTimelinePlaying && !isTimelinePaused ? 'Pause Timeline' : 'Play Timeline'}
                                </button>
                                <button
                                    onClick={() => useStore.getState().resetSimulation()}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: 14,
                                        border: '1px solid rgba(248,113,113,0.22)',
                                        background: 'rgba(248,113,113,0.1)',
                                        color: '#fca5a5',
                                        fontWeight: 900,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
