/**
 * LearningWorkspace — right-side panel with resizable sub-sections.
 * This is the primary educational interface of the AlgoSim platform.
 */
import { useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import { AlgoSelector } from './AlgoSelector';
import { RouteStats } from './RouteStats';
import { DeliveryList } from './DeliveryList';
import { StateSpaceExplorer } from './StateSpaceExplorer';
import { TheoryTab } from './TheoryTab';
import { TheoryOverlay } from './TheoryOverlay';
import { TablesTab } from './TablesTab';
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';
import { displayNodeName } from '../../data/townGraph';

const TABS = ['configuration', 'theory', 'tables'];
const TAB_LABELS = {
    configuration: 'Simulation',
    theory: 'Theory',
    tables: 'Tables'
};

export function LearningWorkspace() {
    const [activeTab, setActiveTab] = useState('configuration');
    const [theoryOpen, setTheoryOpen] = useState(false);
    const {
        showLabels, setShowLabels,
        cameraAngle, setCameraAngle,
        destinations, routeResult,
        stepsResult,
        learningMode, setLearningMode,
        currentSegment,
        deliveredNodes,
        currentStepIndex,
        setCurrentStepIndex,
        isTimelinePlaying,
        isTimelinePaused,
    } = useStore();

    useEffect(() => {
        // Ensure overlay flag is cleared if this component remounts.
        useStore.getState().setUiOverlayOpen(false);
    }, []);

    return (
        <aside style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            {/* Header: Academic Branding & Mode Selector */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(140,170,220,0.14)', background: 'rgba(91,156,246,0.07)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                        <h1 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', color: '#e8ecf8', margin: 0 }}>ALGOSIM: Graph Theory</h1>
                        <p style={{ fontSize: '9px', color: '#7a8aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '1px 0 0' }}>Interactive Educational Laboratory</p>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-ghost btn-icon" title={showLabels ? 'Hide Labels' : 'Show Labels'} onClick={() => setShowLabels(!showLabels)} style={{ fontSize: '13px' }}>
                            {showLabels ? '🏷️' : '🔇'}
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Toggle Camera" onClick={() => setCameraAngle(cameraAngle === 'perspective' ? 'top' : 'perspective')} style={{ fontSize: '13px' }}>
                            {cameraAngle === 'perspective' ? '📐' : '🔭'}
                        </button>
                    </div>
                </div>

                {/* Learning Mode Selector with Framer Motion Layout */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: 2, gap: 2, position: 'relative' }}>
                    {['beginner', 'intermediate', 'advanced'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setLearningMode(mode)}
                            style={{
                                flex: 1,
                                padding: '4px 0',
                                fontSize: '9px',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                position: 'relative',
                                background: 'transparent',
                                color: learningMode === mode ? '#8090ff' : '#556080',
                                transition: 'color 0.2s'
                            }}
                        >
                            {learningMode === mode && (
                                <motion.div
                                    layoutId="active-mode"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(99,120,255,0.25)',
                                        border: '1px solid rgba(99,120,255,0.3)',
                                        borderRadius: 4,
                                        zIndex: 0
                                    }}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span style={{ position: 'relative', zIndex: 1 }}>{mode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main resizable vertical split */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Group direction="vertical">

                    {/* Top Half: State Space Explorer (resizable) */}
                    <Panel defaultSize={40} minSize={25} style={{ overflow: 'hidden' }}>
                        <div style={{ height: '100%', padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <StateSpaceExplorer />
                        </div>
                    </Panel>

                    {/* Vertical Resize Handle */}
                    <Separator className="resize-handle-vertical" />

                    {/* Bottom Half: Learning Console (resizable) */}
                    <Panel defaultSize={60} minSize={35} style={{ overflow: 'hidden' }}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Tab Nav */}
                            <div style={{ display: 'flex', padding: '8px 16px 0', gap: '3px', borderBottom: '1px solid rgba(99,120,255,0.12)', flexShrink: 0 }}>
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '8px 14px',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.3px',
                                            fontFamily: 'var(--font-sans)',
                                            cursor: 'pointer',
                                            border: 'none',
                                            borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                            background: 'transparent',
                                            color: activeTab === tab ? 'var(--accent-blue)' : '#7a8aaa',
                                            transition: 'all 0.15s',
                                            borderRadius: '4px 4px 0 0',
                                            whiteSpace: 'nowrap',
                                            position: 'relative'
                                        }}
                                    >
                                        {TAB_LABELS[tab]}
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="active-tab-underline"
                                                style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent-blue)' }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content with AnimatePresence */}
                            <div
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: 'hidden',
                                    padding: activeTab === 'theory' ? 0 : '14px 16px',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15, ease: "easeOut" }}
                                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: activeTab === 'theory' ? 0 : 12, minHeight: 0, overflow: 'hidden' }}
                                    >
                                        {activeTab === 'configuration' && (
                                            <>
                                                <AlgoSelector />
                                                {destinations.length < 2 && !routeResult ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, textAlign: 'center', color: 'var(--text-secondary)', padding: '16px' }}>
                                                        <div style={{ fontSize: '28px', opacity: 0.7 }}>🏠</div>
                                                        <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.6, color: '#8892b0' }}>Define the problem by selecting at least 2 locations on the map.</p>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ marginTop: 4, padding: '8px 16px', fontSize: '11px', fontWeight: 600, background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,120,255,0.2)' }}
                                                            onClick={() => {
                                                                const arr = Object.keys(NODES).filter(k => NODES[k].type === 'address');
                                                                const r1 = arr[Math.floor(Math.random() * arr.length)];
                                                                let r2 = arr[Math.floor(Math.random() * arr.length)];
                                                                while (r2 === r1) r2 = arr[Math.floor(Math.random() * arr.length)];
                                                                useStore.getState().addDestination(r1);
                                                                useStore.getState().addDestination(r2);
                                                            }}
                                                        >
                                                            🎲 Initialize Random Stops
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div style={{ flex: 1, minHeight: 0 }}>
                                                        <Group direction="vertical">
                                                            <Panel defaultSize={44} minSize={26}>
                                                                <div style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
                                                                    <RouteStats />
                                                                </div>
                                                            </Panel>

                                                            <Separator className="resize-handle-vertical" />

                                                            <Panel defaultSize={56} minSize={26}>
                                                                <div style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
                                                                    <DeliveryList />
                                                                </div>
                                                            </Panel>
                                                        </Group>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {activeTab === 'theory' && (
                                            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 14px' }}>
                                                <div className="card" style={{ borderRadius: 16, padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                        <div>
                                                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9fc7ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                                                Theory Mode
                                                            </div>
                                                            <div style={{ marginTop: 6, fontSize: '12px', color: '#93a6c3', lineHeight: 1.5 }}>
                                                                Use the schematic topography above to scrub through the algorithm. Open details when you want the deeper reasoning, pseudocode, and state inspector.
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-ghost"
                                                            onClick={() => {
                                                                setTheoryOpen(true);
                                                                useStore.getState().setUiOverlayOpen(true);
                                                            }}
                                                            style={{ borderRadius: 14, padding: '10px 14px', fontWeight: 800 }}
                                                        >
                                                            Open Details
                                                        </button>
                                                    </div>
                                                    {destinations?.length > 0 && (
                                                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                            {['warehouse', ...destinations].map((id, i) => {
                                                                const isWarehouse = i === 0;
                                                                const isDelivered = !isWarehouse && deliveredNodes?.includes(id);
                                                                const isActive = i === (currentSegment || 0) + 1 || (isWarehouse && (currentSegment || 0) === 0);
                                                                return (
                                                                    <div
                                                                        key={id + i}
                                                                        style={{
                                                                            padding: '7px 10px',
                                                                            borderRadius: 999,
                                                                            border: `1px solid ${isActive ? 'rgba(34,211,238,0.25)' : 'rgba(148,163,184,0.14)'}`,
                                                                            background: isActive ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
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
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {stepsResult?.steps?.length ? (
                                                        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.02)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                                                                <div style={{ fontSize: 10, fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                                    Search Progress
                                                                </div>
                                                                <div style={{ fontSize: 12, fontWeight: 900, color: '#eef2ff' }}>
                                                                    Consideration {currentStepIndex + 1} / {stepsResult.steps.length}
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max={Math.max(0, stepsResult.steps.length - 1)}
                                                                value={currentStepIndex}
                                                                onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
                                                                style={{ marginTop: 10, cursor: 'pointer', width: '100%', accentColor: '#35d7e8', height: '6px' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                                                <button
                                                                    onClick={() => (isTimelinePlaying && !isTimelinePaused ? useStore.getState().pauseSimulation() : useStore.getState().runSimulation())}
                                                                    className="btn"
                                                                    style={{ flex: 1, borderRadius: 12, fontWeight: 900, background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(91,156,246,0.14))', border: '1px solid rgba(34,211,238,0.22)', color: '#d6f9ff' }}
                                                                >
                                                                    {isTimelinePlaying && !isTimelinePaused ? 'Pause Timeline' : 'Play Timeline'}
                                                                </button>
                                                                <button
                                                                    onClick={() => useStore.getState().resetSimulation()}
                                                                    className="btn"
                                                                    style={{ borderRadius: 12, fontWeight: 900, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)', color: '#fca5a5' }}
                                                                >
                                                                    Reset
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {!stepsResult && (
                                                    <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <div style={{ textAlign: 'center', color: '#93a6c3', fontSize: '12px' }}>
                                                            Start navigation first to generate algorithm steps.
                                                        </div>
                                                    </div>
                                                )}

                                                {theoryOpen && (
                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(7, 10, 18, 0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
                                                        <div style={{ width: 'min(1400px, 98vw)', height: 'min(900px, 92vh)', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 120px rgba(0,0,0,0.75)', background: '#0b0e14', display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                                <div>
                                                                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#eef2ff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Theory Details</div>
                                                                    <div style={{ marginTop: 4, fontSize: '11px', color: '#93a6c3' }}>Reasoning, pseudocode, and state inspection in resizable panes.</div>
                                                                </div>
                                                                <button
                                                                    className="btn btn-danger"
                                                                    onClick={() => {
                                                                        setTheoryOpen(false);
                                                                        useStore.getState().setUiOverlayOpen(false);
                                                                    }}
                                                                    style={{ borderRadius: 14, padding: '10px 14px', fontWeight: 900 }}
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>
                                                            <div style={{ flex: 1, minHeight: 0 }}>
                                                                <TheoryOverlay />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {activeTab === 'tables' && <TablesTab />}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </Panel>

                </Group>
            </div>
        </aside>
    );
}
