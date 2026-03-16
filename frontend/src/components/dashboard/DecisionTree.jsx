/**
 * DecisionTree — visualizes algorithm exploration with an expandable
 * React Flow diagram and a readable step log.
 * Colors:
 * - Green (#2ecc71): On Optimal Path
 * - Blue/Mint (#3a7dc8): Explored (visited, queued, or settled by algo)
 */
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo, useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';

function buildFlowGraph(stepsResult, isExpanded = false, maxSteps = 1000) {
    if (!stepsResult?.steps?.length) return { nodes: [], edges: [] };
    const steps = stepsResult.steps.slice(0, Math.min(stepsResult.steps.length, maxSteps));
    const seen = new Map();
    const rfNodes = [];
    const rfEdges = [];
    const COLS = isExpanded ? 8 : 5;
    const COL_W = 160, ROW_H = 110;

    steps.forEach((step, i) => {
        const nid = step.node;
        if (!seen.has(nid)) {
            seen.set(nid, i);
            const isOnPath = stepsResult.final_path?.includes(nid);
            const label = NODES[nid]?.label || nid;
            rfNodes.push({
                id: nid,
                position: { x: (i % COLS) * COL_W + 10, y: Math.floor(i / COLS) * ROW_H + 10 },
                data: {
                    label: (
                        <div style={{ textAlign: 'center', lineHeight: 1.35, padding: '2px 0' }} title={`g=${step.distance?.toFixed ? step.distance.toFixed(1) : step.distance}${step.heuristic != null ? `\nh=${Number(step.heuristic).toFixed(1)}` : ''}${step.f_score != null ? `\nf=g+h=${Number(step.f_score).toFixed(1)}` : ''}`}>
                            <div style={{ fontWeight: 700, fontSize: '10px', color: isOnPath ? '#1e8449' : '#1a2a3a', marginBottom: 2 }}>
                                {label.length > 12 ? label.slice(0, 12) + '…' : label}
                            </div>
                            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#3a7dc8' }}>
                                d={step.distance?.toFixed ? step.distance.toFixed(1) : step.distance}
                            </div>
                            {step.f_score != null && (
                                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#9b59b6' }}>f={Number(step.f_score).toFixed(1)}</div>
                            )}
                        </div>
                    ),
                },
                style: {
                    background: isOnPath ? '#eafaf1' : '#f4f7fc',
                    border: `2px solid ${isOnPath ? '#2ecc71' : '#3a7dc8'}`, // Green for path, Blue for explored
                    borderRadius: 9,
                    minWidth: 120,
                    padding: '5px 3px',
                    boxShadow: isOnPath ? '0 2px 10px rgba(46,204,113,0.35)' : '0 1px 4px rgba(58,125,200,0.15)',
                },
            });
        }

        step.neighbors_updated?.slice(0, 3).forEach((nb, j) => {
            if (!NODES[nb.node]) return;
            const isPathEdge = stepsResult.final_path?.includes(nb.node) && stepsResult.final_path?.includes(nid);
            rfEdges.push({
                id: `e-${nid}-${nb.node}-${i}-${j}`,
                source: nid,
                target: nb.node,
                label: nb.new_dist != null ? String(Number(nb.new_dist).toFixed(1)) : '',
                style: { stroke: isPathEdge ? '#2ecc71' : '#9bb0cc', strokeWidth: isPathEdge ? 2 : 1.5 },
                labelStyle: { fill: '#4a5a70', fontSize: 8, fontFamily: 'monospace' },
                type: 'smoothstep',
                animated: isPathEdge,
            });
        });
    });

    return { nodes: rfNodes, edges: rfEdges };
}

export function DecisionTree() {
    const { stepsResult, algorithm } = useStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentStepLimit, setCurrentStepLimit] = useState(1);

    // Auto-reset slider when new result comes in
    useEffect(() => {
        if (stepsResult?.steps?.length) {
            setCurrentStepLimit(stepsResult.steps.length);
        }
    }, [stepsResult]);

    const { nodes, edges } = useMemo(() => buildFlowGraph(stepsResult, isExpanded, currentStepLimit), [stepsResult, isExpanded, currentStepLimit]);

    if (!stepsResult) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '32px', opacity: 0.7 }}>🌳</div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>Run navigation to see how the algorithm thinks. The decision tree will appear here!</p>
            </div>
        );
    }

    const algoLabel = { dijkstra: "Dijkstra", astar: "A*", bellman_ford: "Bellman-Ford" }[algorithm];

    const Legend = () => (
        <div style={{ display: 'flex', gap: 12, fontSize: '10px', color: 'var(--text-secondary)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#eafaf1', border: '2px solid #2ecc71', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />On path</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f4f7fc', border: '2px solid #3a7dc8', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Explored</span>
            <span style={{ color: '#889aae', fontStyle: 'italic' }}>* Unvisited nodes hidden</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                        {algoLabel} Tree
                    </p>
                    <span className="badge badge-blue">{stepsResult.steps?.length} steps</span>
                </div>
                <button
                    onClick={() => setIsExpanded(true)}
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                >
                    ⛶ Expand
                </button>
            </div>

            <Legend />

            {/* Expanded Math Tooltip Guide */}
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', margin: '-4px 0 2px' }}>
                * Hover over node boxes to reveal the math formula.
            </div>

            {/* Tree Playback Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #dde5f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#4a5a70' }}>Step Playback</span>
                    <span style={{ fontSize: '10px', color: 'var(--accent-blue)', fontWeight: 600 }}>{currentStepLimit} / {stepsResult.steps.length}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max={stepsResult.steps.length}
                    value={currentStepLimit}
                    onChange={(e) => setCurrentStepLimit(Number(e.target.value))}
                    style={{ cursor: 'pointer', width: '100%', accentColor: 'var(--accent-blue)' }}
                />
            </div>

            {/* Small inline Diagram */}
            <div style={{ height: '200px', background: '#f8fafc', borderRadius: 10, border: '1px solid #dde5f0', overflow: 'hidden', position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    fitViewOptions={{ padding: 0.15 }}
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    minZoom={0.25}
                    maxZoom={2}
                >
                    <Background color="#dde5f0" gap={22} size={1} />
                </ReactFlow>
            </div>

            {/* Step log & Priority Queue */}
            <div style={{ display: 'flex', gap: 8, height: '160px' }}>
                {/* Step Log */}
                <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 4 }}>
                    {stepsResult.steps?.slice(0, currentStepLimit).reverse().map((step) => (
                        <div key={step.step} style={{
                            fontSize: '11px', fontFamily: 'var(--font-mono)',
                            color: '#4a5a70', padding: '6px 8px',
                            background: '#f4f7fc', borderRadius: 6,
                            borderLeft: '2.5px solid #5b9cf6', lineHeight: 1.4,
                        }}>
                            <span style={{ color: '#3a7dc8', fontWeight: 600 }}>#{step.step}</span> {step.description}
                        </div>
                    ))}
                </div>

                {/* Priority Queue state for the current step */}
                <div style={{ width: '100px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '1px solid #dde5f0', paddingLeft: 8 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#1a2a3a', textAlign: 'center', marginBottom: 2 }}>Evaluated👇</div>
                    <div className="custom-scroll" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {stepsResult.steps[currentStepLimit - 1]?.neighbors_updated?.map((nb, i) => (
                            <div key={i} style={{ background: '#eafaf1', border: '1px solid #2ecc71', borderRadius: 4, padding: '4px', fontSize: '9px', textAlign: 'center', color: '#1e8449' }}>
                                <div style={{ fontWeight: 600 }}>{NODES[nb.node]?.label || nb.node}</div>
                                <div>{nb.f != null ? `f: ${nb.f}` : `d: ${nb.new_dist}`}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expanded Modal Overlay */}
            {isExpanded && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '1200px', height: '90vh',
                        background: '#f8fafc', borderRadius: 16,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #dde5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <h2 style={{ margin: 0, fontSize: '18px', color: '#1a2a3a' }}>{algoLabel} Search Tree Detail</h2>
                                <Legend />
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="btn btn-danger"
                                style={{ padding: '8px 16px' }}
                            >
                                ✕ Close
                            </button>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                fitView
                                fitViewOptions={{ padding: 0.1 }}
                                proOptions={{ hideAttribution: true }}
                                nodesDraggable={true}
                                minZoom={0.1}
                                maxZoom={3}
                            >
                                <Background color="#dde5f0" gap={30} size={1} />
                                <Controls style={{ background: '#fff', border: '1px solid #dde5f0', borderRadius: 8, padding: 4 }} />
                            </ReactFlow>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
