import { Suspense } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { TownScene } from './components/scene/TownScene';
import { LearningWorkspace } from './components/dashboard/LearningWorkspace';
import { PlaybackControls } from './components/controls/PlaybackControls';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import useStore from './store/useStore';
import './index.css';
import { shallow } from 'zustand/shallow';

function LoadingScreen() {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                background: '#070a12',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                zIndex: 200,
            }}
        >
            <div style={{ fontSize: 52, filter: 'drop-shadow(0 0 20px rgba(99,120,255,0.6))' }}>Map</div>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e8ecf8', margin: '0 0 4px', letterSpacing: '-0.5px' }}>VisualMap</h2>
                <p style={{ fontSize: 12, color: '#556080', margin: 0 }}>Initializing 3D scene...</p>
            </div>
            <div style={{ width: 180, height: 3, background: 'rgba(99,120,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                    style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #6378ff, #00d4ff)',
                        borderRadius: 2,
                        animation: 'loading-bar 1.8s ease-in-out infinite',
                    }}
                />
            </div>
        </div>
    );
}

function LegendItem({ color, label, glow = false }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: color,
                    boxShadow: glow ? `0 0 10px ${color}` : 'none',
                    flexShrink: 0,
                }}
            />
            <span style={{ fontSize: 10, color: '#93a6c3', fontWeight: 500 }}>{label}</span>
        </div>
    );
}

function GlassBadge({ children, style }) {
    return (
        <div
            style={{
                background: 'linear-gradient(180deg, rgba(15,20,32,0.92), rgba(8,12,20,0.86))',
                border: '1px solid rgba(148,163,184,0.14)',
                borderRadius: 18,
                backdropFilter: 'blur(16px)',
                boxShadow: '0 14px 30px rgba(0,0,0,0.35)',
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function SceneOverlays() {
    const { isPlaying, routeResult, destinations, currentSegment, deliveredNodes } = useStore(
        (s) => ({
            isPlaying: s.isPlaying,
            routeResult: s.routeResult,
            destinations: s.destinations,
            currentSegment: s.currentSegment,
            deliveredNodes: s.deliveredNodes,
        }),
        shallow
    );

    const deliveriesDone = Math.min(deliveredNodes?.length || 0, destinations?.length || 0);
    const deliveriesTotal = destinations?.length || 0;

    const missionStatus = useMemo(() => {
        if (!isPlaying) return null;
        if (deliveriesTotal <= 0) return null;
        if (deliveriesDone < deliveriesTotal) return `Out for delivery — ${deliveriesDone}/${deliveriesTotal} delivered`;
        return 'Deliveries complete — returning to warehouse';
    }, [isPlaying, deliveriesDone, deliveriesTotal]);
    const uiOverlayOpen = useStore((s) => s.isUiOverlayOpen);

    if (uiOverlayOpen) return null;

    return (
        <>
            <GlassBadge
                style={{
                    position: 'absolute',
                    top: 18,
                    left: 18,
                    zIndex: 10,
                    borderColor: 'rgba(255,215,0,0.22)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <span style={{ fontSize: 18 }}>WH</span>
                <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#ffd76a', margin: 0 }}>Warehouse</p>
                    <p style={{ fontSize: 10, color: '#7888a2', margin: '2px 0 0' }}>Starting depot</p>
                </div>
            </GlassBadge>

            {isPlaying && (
                <GlassBadge
                    style={{
                        position: 'absolute',
                        top: 18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        background: 'linear-gradient(180deg, rgba(53,174,129,0.18), rgba(25,82,60,0.18))',
                        borderColor: 'rgba(77,225,157,0.28)',
                        borderRadius: 999,
                        padding: '9px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 10px 30px rgba(31,190,125,0.2)',
                    }}
                >
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#37d88e',
                            boxShadow: '0 0 10px #37d88e',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#8ef3c2' }}>
                        {missionStatus || `Navigating — leg ${Math.min((currentSegment || 0) + 1, (routeResult?.segments?.length || 1))}/${routeResult?.segments?.length || 1}`}
                    </span>
                </GlassBadge>
            )}

            {routeResult && !isPlaying && (
                <GlassBadge
                    style={{
                        position: 'absolute',
                        top: 18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        background: 'linear-gradient(180deg, rgba(91,156,246,0.16), rgba(45,74,129,0.16))',
                        borderColor: 'rgba(115,156,255,0.28)',
                        borderRadius: 999,
                        padding: '9px 18px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b3c7ff' }}>
                        Route computed - {routeResult.total_distance.toFixed(1)} units
                    </span>
                </GlassBadge>
            )}

            <GlassBadge
                style={{
                    position: 'absolute',
                    bottom: 18,
                    left: 18,
                    zIndex: 10,
                    width: 190,
                    padding: '14px 14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: 'linear-gradient(180deg, rgba(16,20,30,0.92), rgba(8,12,18,0.88))',
                    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#eef2ff', letterSpacing: '0.08em' }}>LEGEND</span>
                    <span style={{ fontSize: 12, color: '#90a4c3' }}>v</span>
                </div>
                <LegendItem color="#16202e" label="Road" />
                <LegendItem color="#00ff85" label="Optimal Path" glow />
                <LegendItem color="#ff7a2b" label="Explored" glow />
                <LegendItem color="#00d4ff" label="Selected Stop" glow />
                <LegendItem color="#ffd700" label="Warehouse" glow />
                <div style={{ height: 1, background: 'rgba(99,120,255,0.12)', margin: '6px 0 4px' }} />
                <p style={{ fontSize: 10, color: '#667a97', margin: 0, lineHeight: 1.4 }}>Drag to orbit - Scroll to zoom</p>
            </GlassBadge>

            {!isPlaying && destinations.length === 0 && (
                <GlassBadge
                    style={{
                        position: 'absolute',
                        bottom: 18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        borderRadius: 999,
                        padding: '8px 16px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span style={{ fontSize: 11, color: '#7a8aaa' }}>
                        Click any <strong style={{ color: '#c6d3e6' }}>house</strong> to add a delivery stop
                    </span>
                </GlassBadge>
            )}
        </>
    );
}

export default function App() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#070a12' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Group direction="horizontal" className="vm-root-panels">
                    <Panel defaultSize={60} minSize={30}>
                        <div className="vm-scene-shell" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                            <ErrorBoundary>
                                <SceneOverlays />
                                <Suspense fallback={<LoadingScreen />}>
                                    <TownScene />
                                </Suspense>
                            </ErrorBoundary>
                        </div>
                    </Panel>

                    <Separator className="resize-handle-horizontal" />

                    <Panel defaultSize={40} minSize={25}>
                        <div
                            className="vm-dashboard-shell"
                            style={{
                                height: '100%',
                                position: 'relative',
                                zIndex: 10,
                                background: 'linear-gradient(180deg, rgba(34,45,68,0.98) 0%, rgba(18,26,42,0.98) 100%)',
                                borderLeft: '1px solid rgba(140,170,220,0.18)',
                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                            }}
                        >
                            <ErrorBoundary>
                                <LearningWorkspace />
                            </ErrorBoundary>
                        </div>
                    </Panel>
                </Group>
            </div>

            <div
                style={{
                    background: 'linear-gradient(180deg, rgba(23,31,49,0.98), rgba(14,20,34,0.98))',
                    borderTop: '1px solid rgba(140,170,220,0.18)',
                    padding: '10px 20px',
                    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
                }}
            >
                <PlaybackControls />
            </div>
        </div>
    );
}
