/**
 * StateSpaceExplorer — "Schematic Topography"
 *
 * Replaced the old ReactFlow dots/edges schematic with a true top-down 2D render
 * of the town assets (roads/houses/warehouse) so the view matches the 3D map.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { TownTopography2D } from '../scene/TownTopography2D';

// Legend categories matching the reference style.
const LEGEND_ITEMS = [
    { label: 'Warehouse / Origin', color: '#f97316', type: 'circle' },
    { label: 'Apple neighborhood', color: '#fbbf24', type: 'circle' },
    { label: 'Cedar neighborhood', color: '#fda4af', type: 'circle' },
    { label: 'Fig neighborhood', color: '#a5f3fc', type: 'circle' },
    { label: 'Elm neighborhood', color: '#bef264', type: 'circle' },
    { label: 'Grove neighborhood', color: '#d8b4fe', type: 'circle' },
    { label: 'Road / Intersection', color: '#94a3b8', type: 'circle' },
    { label: 'Current Explorer', color: '#fbbf24', type: 'pulse' },
    { label: 'Calculated Path', color: '#3b82f6', type: 'glow' },
];

function LegendOverlay({ dashboardMode }) {
    return (
        <div
            style={{
                position: 'absolute',
                right: 12,
                top: 12,
                bottom: 12,
                width: 160,
                background: 'rgba(7, 10, 18, 0.85)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                zIndex: 10,
                backdropFilter: 'blur(10px)',
                borderRadius: '12px 0 0 12px',
            }}
        >
            <h4
                style={{
                    margin: 0,
                    fontSize: '10px',
                    color: '#fff',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                Topography Legend
            </h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto' }}>
                {LEGEND_ITEMS.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                    width: 12,
                                    height: 4,
                                    background: item.color,
                                    borderRadius: 2,
                                    boxShadow: `0 0 6px ${item.color}`,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        <span style={{ fontSize: '8px', color: '#7a8aaa', fontWeight: 600, lineHeight: 1.1 }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
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
        algorithm,
        currentStepIndex,
        setCurrentStepIndex,
        showLabels,
        setShowLabels,
        isTimelinePlaying,
        isTimelinePaused,
        animationSpeed,
    } = useStore();

    const [isExpanded, setIsExpanded] = useState(expanded);
    const [previousLabelState, setPreviousLabelState] = useState(true);
    const mapRef = useRef(null);
    const mapRefExpanded = useRef(null);

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
                <TownTopography2D ref={mapRef} selectedOnly />
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
            <TownTopography2D ref={mapRef} selectedOnly />
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
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8aaa', textTransform: 'uppercase' }}>Search Progress</span>
                        <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>{searchProgress}</span>
                    </div>
                    {hasSteps ? (
                        <input
                            type="range"
                            min="0"
                            max={maxSteps}
                            value={Math.min(currentStepIndex, maxSteps)}
                            onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
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

                        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                            <TownTopography2D ref={mapRefExpanded} selectedOnly />
                            <ZoneOverlay />
                            <LegendOverlay dashboardMode />
                        </div>

                        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,24,0.92)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Search Progress
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
                                onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
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
