/**
 * Dashboard — right-side panel with resizable sub-sections.
 * Uses react-resizable-panels (Group/Panel/Separator) for internal layout.
 */
import { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { AlgoSelector } from './AlgoSelector';
import { RouteStats } from './RouteStats';
import { DeliveryList } from './DeliveryList';
import { DecisionTree } from './DecisionTree';
import { TheoryTab } from './TheoryTab';
import { TablesTab } from './TablesTab';
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';

const TABS = ['setup', 'theory', 'tables'];
const TAB_LABELS = { setup: '⚙️ Setup', theory: '📖 Theory', tables: '📊 Tables' };

export function Dashboard() {
    const [activeTab, setActiveTab] = useState('setup');
    const { showLabels, setShowLabels, cameraAngle, setCameraAngle, destinations, routeResult } = useStore();

    return (
        <aside style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(140,170,220,0.14)', background: 'rgba(91,156,246,0.07)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', color: '#e8ecf8', margin: 0 }}>🗺️ VisualMap</h1>
                        <p style={{ fontSize: '10px', color: '#8892b0', margin: '1px 0 0' }}>3D Algorithm Visualizer</p>
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
            </div>

            {/* Main resizable vertical split */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Group direction="vertical">

                    {/* Top Half: Decision Tree (resizable) */}
                    <Panel defaultSize={48} minSize={25} style={{ overflow: 'hidden' }}>
                        <div style={{ height: '100%', padding: '12px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <DecisionTree />
                        </div>
                    </Panel>

                    {/* Vertical Resize Handle */}
                    <Separator className="resize-handle-vertical" />

                    {/* Bottom Half: Tabbed Console (resizable) */}
                    <Panel defaultSize={52} minSize={25} style={{ overflow: 'hidden' }}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Tab Nav */}
                            <div style={{ display: 'flex', padding: '8px 16px 0', gap: '3px', borderBottom: '1px solid rgba(99,120,255,0.12)', flexShrink: 0 }}>
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            fontFamily: 'var(--font-sans)',
                                            cursor: 'pointer',
                                            border: 'none',
                                            borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                            background: 'transparent',
                                            color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                            transition: 'all 0.15s',
                                            borderRadius: '4px 4px 0 0',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {TAB_LABELS[tab]}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="tab-transition" key={activeTab} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {activeTab === 'setup' && (
                                    <>
                                        <AlgoSelector />
                                        {destinations.length < 2 && !routeResult ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, textAlign: 'center', color: 'var(--text-secondary)', padding: '16px' }}>
                                                <div style={{ fontSize: '28px', opacity: 0.7 }}>🏠</div>
                                                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>Click any <strong>house</strong> in the 3D scene to add a delivery stop. You need at least 2 stops.</p>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ marginTop: 4, padding: '6px 14px', fontSize: '12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                                    onClick={() => {
                                                        const arr = Object.keys(NODES).filter(k => NODES[k].type === 'address');
                                                        const r1 = arr[Math.floor(Math.random() * arr.length)];
                                                        let r2 = arr[Math.floor(Math.random() * arr.length)];
                                                        while (r2 === r1) r2 = arr[Math.floor(Math.random() * arr.length)];
                                                        useStore.getState().addDestination(r1);
                                                        useStore.getState().addDestination(r2);
                                                    }}
                                                >
                                                    🎲 Add 2 Random Stops
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <RouteStats />
                                                <DeliveryList />
                                            </>
                                        )}
                                    </>
                                )}
                                {activeTab === 'theory' && <TheoryTab />}
                                {activeTab === 'tables' && <TablesTab />}
                            </div>
                        </div>
                    </Panel>

                </Group>
            </div>
        </aside>
    );
}
