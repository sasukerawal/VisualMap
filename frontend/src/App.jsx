/**
 * App root — 3D canvas (left/center) + Dashboard panel (right).
 * Improved layout with status bar, a better overlay, and clean compositing.
 */
import { Suspense } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { TownScene } from './components/scene/TownScene';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlaybackControls } from './components/controls/PlaybackControls';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import useStore from './store/useStore';
import './index.css';

function LoadingScreen() {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: '#070a12',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            zIndex: 200,
        }}>
            <div style={{ fontSize: '52px', filter: 'drop-shadow(0 0 20px rgba(99,120,255,0.6))' }}>🗺️</div>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#e8ecf8', margin: '0 0 4px', letterSpacing: '-0.5px' }}>VisualMap</h2>
                <p style={{ fontSize: '12px', color: '#556080', margin: 0 }}>Initializing 3D scene…</p>
            </div>
            <div style={{ width: 180, height: 3, background: 'rgba(99,120,255,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6378ff, #00d4ff)',
                    borderRadius: 2,
                    animation: 'loading-bar 1.8s ease-in-out infinite',
                }} />
            </div>
        </div>
    );
}

function LegendItem({ color, label, glow }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                background: color,
                boxShadow: glow ? `0 0 6px ${color}` : 'none',
            }} />
            <span style={{ fontSize: '10px', color: '#778' }}>{label}</span>
        </div>
    );
}

function SceneOverlays() {
    const { isPlaying, routeResult, destinations, currentSegment } = useStore();

    return (
        <>
            {/* Warehouse badge — top left */}
            <div style={{
                position: 'absolute', top: 14, left: 14, zIndex: 10,
                background: 'rgba(10,14,22,0.88)',
                border: '1px solid rgba(255,215,0,0.25)',
                borderRadius: 10,
                padding: '8px 13px',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
                <span style={{ fontSize: '16px' }}>🏭</span>
                <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#ffd700', margin: 0 }}>Warehouse</p>
                    <p style={{ fontSize: '9px', color: '#667', margin: '1px 0 0' }}>Starting depot</p>
                </div>
            </div>

            {/* Status pill — top center (shown when navigating) */}
            {isPlaying && (
                <div style={{
                    position: 'absolute', top: 14, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    background: 'rgba(0,200,100,0.15)',
                    border: '1px solid rgba(0,200,100,0.35)',
                    borderRadius: 20,
                    padding: '6px 16px',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', gap: 7,
                    boxShadow: '0 0 20px rgba(0,200,100,0.2)',
                }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#00c864',
                        boxShadow: '0 0 8px #00c864',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#00d470' }}>
                        Navigating — {currentSegment}/{destinations.length} stops
                    </span>
                </div>
            )}

            {/* Route complete badge */}
            {routeResult && !isPlaying && (
                <div style={{
                    position: 'absolute', top: 14, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    background: 'rgba(99,120,255,0.12)',
                    border: '1px solid rgba(99,120,255,0.3)',
                    borderRadius: 20,
                    padding: '6px 16px',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', gap: 7,
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#8090ff' }}>
                        ✓ Route computed — {routeResult.total_distance.toFixed(1)} units
                    </span>
                </div>
            )}

            {/* Legend — bottom left */}
            <div style={{
                position: 'absolute', bottom: 14, left: 14, zIndex: 10,
                background: 'rgba(10,14,22,0.88)',
                border: '1px solid rgba(99,120,255,0.12)',
                borderRadius: 10,
                padding: '10px 13px',
                backdropFilter: 'blur(12px)',
                display: 'flex', flexDirection: 'column', gap: 5,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
                <LegendItem color="#16202e" label="Road" />
                <LegendItem color="#00ff85" label="Optimal Path" glow />
                <LegendItem color="#ff7a2b" label="Explored" glow />
                <LegendItem color="#00d4ff" label="Selected Stop" glow />
                <LegendItem color="#ffd700" label="Warehouse" glow />
                <div style={{ height: 1, background: 'rgba(99,120,255,0.12)', margin: '3px 0' }} />
                <p style={{ fontSize: '9px', color: '#445', margin: 0, lineHeight: 1.4 }}>
                    🖱️ Drag · Scroll = zoom
                </p>
            </div>

            {/* Controls hint — bottom center */}
            {!isPlaying && destinations.length === 0 && (
                <div style={{
                    position: 'absolute', bottom: 14, left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    background: 'rgba(10,14,22,0.75)',
                    border: '1px solid rgba(99,120,255,0.15)',
                    borderRadius: 20,
                    padding: '6px 14px',
                    backdropFilter: 'blur(10px)',
                    whiteSpace: 'nowrap',
                }}>
                    <span style={{ fontSize: '11px', color: '#7a8aaa' }}>
                        🏠 Click any <strong style={{ color: '#aab8cc' }}>house</strong> to add a delivery stop
                    </span>
                </div>
            )}
        </>
    );
}

export default function App() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#070a12' }}>
            {/* Main Area: Resizable Split */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Group direction="horizontal">
                    {/* Left Pane: 3D Simulation */}
                    <Panel defaultSize={60} minSize={30}>
                        <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                            <ErrorBoundary>
                                <SceneOverlays />
                                <Suspense fallback={<LoadingScreen />}>
                                    <TownScene />
                                </Suspense>
                            </ErrorBoundary>
                        </div>
                    </Panel>

                    {/* Draggable Divider */}
                    <Separator className="resize-handle-horizontal" />

                    {/* Right Pane: Educational Console */}
                    <Panel defaultSize={40} minSize={25}>
                        <div style={{
                            height: '100%',
                            position: 'relative',
                            zIndex: 10,
                            background: 'linear-gradient(180deg, #1f2a3d 0%, #192338 100%)',
                            borderLeft: '1px solid rgba(140,170,220,0.18)'
                        }}>
                            <ErrorBoundary>
                                <Dashboard />
                            </ErrorBoundary>
                        </div>
                    </Panel>
                </Group>
            </div>

            {/* Bottom Anchor: Unified Timeline Controller */}
            <div style={{ background: '#121826', borderTop: '1px solid rgba(140,170,220,0.18)', padding: '10px 20px' }}>
                <PlaybackControls />
            </div>
        </div>
    );
}
