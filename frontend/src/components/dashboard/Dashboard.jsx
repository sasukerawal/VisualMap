/**
 * Dashboard — right-side panel with all algorithm info + controls.
 */
import { useState } from 'react';
import { AlgoSelector } from './AlgoSelector';
import { RouteStats } from './RouteStats';
import { DeliveryList } from './DeliveryList';
import { DecisionTree } from './DecisionTree';
import { PlaybackControls } from '../controls/PlaybackControls';
import useStore from '../../store/useStore';

const TABS = ['Route', 'Algorithm', 'Tree'];

export function Dashboard() {
    const [activeTab, setActiveTab] = useState('Route');
    const { showLabels, setShowLabels, cameraAngle, setCameraAngle, toggleDarkMode } = useStore();

    return (
        <aside style={{
            width: '340px',
            minWidth: '340px',
            height: '100vh',
            background: 'linear-gradient(180deg, #1f2a3d 0%, #192338 100%)',
            borderLeft: '1px solid rgba(140,170,220,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
        }}>

            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(140,170,220,0.14)',
                background: 'rgba(91,156,246,0.07)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: '#e8ecf8', margin: 0 }}>
                            🗺️ VisualMap
                        </h1>
                        <p style={{ fontSize: '11px', color: '#8892b0', margin: '2px 0 0' }}>
                            3D Delivery Router
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            className="btn btn-ghost btn-icon"
                            title={showLabels ? 'Hide Labels' : 'Show Labels'}
                            onClick={() => setShowLabels(!showLabels)}
                            style={{ fontSize: '14px' }}
                        >
                            {showLabels ? '🏷️' : '🔇'}
                        </button>
                        <button
                            className="btn btn-ghost btn-icon"
                            title="Toggle Camera"
                            onClick={() => setCameraAngle(cameraAngle === 'perspective' ? 'top' : 'perspective')}
                            style={{ fontSize: '14px' }}
                        >
                            {cameraAngle === 'perspective' ? '📐' : '🔭'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Algorithm Selector */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(99,120,255,0.1)', flexShrink: 0 }}>
                <AlgoSelector />
            </div>

            {/* Tab navigation */}
            <div style={{
                display: 'flex',
                padding: '0 20px',
                gap: '4px',
                borderBottom: '1px solid rgba(99,120,255,0.1)',
                flexShrink: 0,
                paddingTop: 12,
                paddingBottom: 0,
            }}>
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '7px 14px',
                            fontSize: '12px',
                            fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                            cursor: 'pointer',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                            background: 'transparent',
                            color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            borderRadius: '4px 4px 0 0',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeTab === 'Route' && (
                    <>
                        <RouteStats />
                        <DeliveryList />
                    </>
                )}
                {activeTab === 'Algorithm' && <AlgoInfo />}
                {activeTab === 'Tree' && <DecisionTree />}
            </div>

            {/* Playback controls — pinned to bottom */}
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(99,120,255,0.15)', flexShrink: 0 }}>
                <PlaybackControls />
            </div>
        </aside>
    );
}

function AlgoInfo() {
    const { algorithm } = useStore();

    const info = {
        dijkstra: {
            name: "Dijkstra's Algorithm",
            badge: 'Guaranteed Optimal',
            badgeClass: 'badge-green',
            complexity: 'O((V + E) log V)',
            description: "Explores nodes greedily by minimum known distance from the source. Uses a priority queue to always settle the cheapest unvisited node next. Guarantees the shortest path in graphs with non-negative edge weights.",
            howIt: [
                'Initialize source distance = 0, all others = ∞',
                'Push source into a min-priority queue',
                'Pop the node with minimum distance',
                'Relax all neighbors: update if shorter path found',
                'Repeat until the target node is settled',
            ],
            bestFor: 'Road networks, GPS routing, non-negative weights',
        },
        astar: {
            name: 'A* Search',
            badge: 'Heuristic Optimal',
            badgeClass: 'badge-blue',
            complexity: 'O(E·log V) with good heuristic',
            description: "Extends Dijkstra with a heuristic h(n) — an estimate of remaining cost to the goal. Uses f(n) = g(n) + h(n) to guide expansion toward the target. With an admissible (non-overestimating) heuristic, it is both optimal and faster than Dijkstra.",
            howIt: [
                'g(n) = known cost from start to n',
                'h(n) = heuristic estimate to goal (here: Euclidean distance)',
                'f(n) = g(n) + h(n) — priority queue key',
                'Always expand node with lowest f(n)',
                'Optimal if h(n) never overestimates real cost',
            ],
            bestFor: 'Grid pathfinding, game AI, directed search toward known goal',
        },
        bellman_ford: {
            name: 'Bellman-Ford',
            badge: 'Negative-Safe',
            badgeClass: 'badge-orange',
            complexity: 'O(V · E)',
            description: "Relaxes all edges V-1 times to find shortest paths. Slower than Dijkstra but handles negative edge weights and detects negative cycles. Essential when edge costs can be negative (e.g., discounts, refunds).",
            howIt: [
                'Initialize source distance = 0, all others = ∞',
                'For i = 1 to V-1 rounds:',
                '  Relax all edges: if d[u] + w < d[v], update d[v]',
                'After V-1 rounds, shortest paths are found',
                'V-th round: if any edge relaxes → negative cycle',
            ],
            bestFor: 'Networks with negative costs, cycle detection, simpler implementation',
        },
    };

    const d = info[algorithm];
    if (!d) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e8ecf8', margin: 0 }}>{d.name}</h3>
                <span className={`badge ${d.badgeClass}`}>{d.badge}</span>
            </div>

            <div className="card" style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {d.description}
            </div>

            <div className="card">
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Time Complexity
                </p>
                <code style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#e8ecf8' }}>{d.complexity}</code>
            </div>

            <div className="card">
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    How It Works
                </p>
                <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {d.howIt.map((step, i) => (
                        <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: step.startsWith(' ') ? 'var(--font-mono)' : 'inherit' }}>
                            {step}
                        </li>
                    ))}
                </ol>
            </div>

            <div style={{ background: 'rgba(99,120,255,0.05)', border: '1px solid rgba(99,120,255,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4 }}>Best For</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{d.bestFor}</p>
            </div>
        </div>
    );
}
