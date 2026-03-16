/**
 * DecisionTree — visualizes algorithm exploration with an expandable
 * React Flow diagram and a readable step log.
 */
import ReactFlow, { Background, Controls, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';
import { BubbleNode } from './BubbleNode';

const nodeTypes = { bubble: BubbleNode };

function buildFlowGraph(stepsResult, maxSteps = 1000) {
    if (!stepsResult?.steps?.length) return { nodes: [], edges: [] };

    const currentSteps = stepsResult.steps.slice(0, Math.min(stepsResult.steps.length, maxSteps));
    if (currentSteps.length === 0) return { nodes: [], edges: [] };

    const activeNodeId = currentSteps[currentSteps.length - 1].node;
    const destinations = useStore.getState().destinations;
    const isFinished = currentSteps.length === stepsResult.steps.length && activeNodeId === destinations[destinations.length - 1];

    const nodeStates = new Map();
    const edgesSet = new Map();

    currentSteps.forEach((step, idx) => {
        const u = step.node;
        const isLastStep = idx === currentSteps.length - 1;

        nodeStates.set(u, {
            state: isLastStep && !isFinished ? 'active' : 'settled',
            d: step.distance,
            h: step.heuristic,
            f: step.f_score
        });

        step.neighbors_updated?.forEach(nb => {
            const v = nb.node;
            edgesSet.set(`${u}-${v}`, { source: u, target: v, action: 'relax' });
            if (!nodeStates.has(v) || nodeStates.get(v).state === 'candidate') {
                nodeStates.set(v, {
                    state: 'candidate',
                    d: nb.new_dist,
                    h: nb.heuristic,
                    f: nb.f
                });
            }
        });
    });

    const rfNodes = [];
    const rfEdges = [];

    nodeStates.forEach((data, nId) => {
        const nodeDef = NODES[nId];
        if (!nodeDef) return;

        // Map abstract React Flow positions perfectly to the 3D town geometry
        // X maps to posX, Z maps to posY for a top-down view.
        // Scale by 35 to give the bubbles breathing room.
        const posX = nodeDef.pos[0] * 35;
        const posY = nodeDef.pos[2] * 35;

        let state = data.state;
        if (state === 'settled' && isFinished && nId === destinations[destinations.length - 1]) {
            state = 'goal';
        }

        rfNodes.push({
            id: nId,
            type: 'bubble',
            position: { x: posX, y: posY },
            data: {
                label: nodeDef.label || nId,
                state,
                distance: data.d,
                heuristic: data.h,
                f_score: data.f
            },
        });
    });

    edgesSet.forEach((val, key) => {
        const isFromActive = val.source === activeNodeId;
        rfEdges.push({
            id: key,
            source: val.source,
            target: val.target,
            animated: isFromActive,
            style: {
                stroke: isFromActive ? '#6366f1' : '#cbd5e1',
                strokeWidth: isFromActive ? 2.5 : 1.5,
                opacity: isFromActive ? 1 : 0.6
            }
        });
    });

    return { nodes: rfNodes, edges: rfEdges };
}

function FlowView({ nodes, edges, isExpanded, onClose }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        fitView({ padding: 0.15, duration: 400 });
    }, [nodes, fitView]);

    if (isExpanded) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px'
            }}>
                <div style={{
                    width: '100%', maxWidth: '1400px', height: '92vh',
                    background: '#f8fafc', borderRadius: 16,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #dde5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexShrink: 0 }}>
                        <h2 style={{ margin: 0, fontSize: '16px', color: '#1a2a3a', fontWeight: 700 }}>🌳 Algorithm Search Tree — Full View</h2>
                        <button onClick={onClose} className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '12px' }}>✕ Close</button>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.1 }} proOptions={{ hideAttribution: true }} nodesDraggable minZoom={0.1} maxZoom={3}>
                            <Background color="#dde5f0" gap={30} size={1} />
                            <Controls style={{ background: '#fff', border: '1px solid #dde5f0', borderRadius: 8 }} />
                        </ReactFlow>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.15 }} proOptions={{ hideAttribution: true }} nodesDraggable nodesConnectable={false} elementsSelectable={false} minZoom={0.2} maxZoom={2}>
            <Background color="#dde5f0" gap={22} size={1} />
        </ReactFlow>
    );
}

const Legend = () => (
    <div style={{ display: 'flex', gap: 10, fontSize: '10px', color: '#4a5a70', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '50%', display: 'inline-block' }} />Settled</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#fffbeb', border: '2px dashed #f59e0b', borderRadius: '50%', display: 'inline-block' }} />Candidate</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#eef2ff', border: '3px solid #6366f1', borderRadius: '50%', display: 'inline-block' }} />Active</span>
    </div>
);

export function DecisionTree() {
    const { stepsResult, algorithm, currentStepIndex, setCurrentStepIndex } = useStore();
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (stepsResult?.steps?.length) {
            setCurrentStepIndex(stepsResult.steps.length - 1);
        }
    }, [stepsResult, setCurrentStepIndex]);

    const { nodes, edges } = useMemo(() => buildFlowGraph(stepsResult, currentStepIndex + 1), [stepsResult, currentStepIndex]);

    const algoLabel = { dijkstra: 'Dijkstra', astar: 'A*', bellman_ford: 'Bellman-Ford' }[algorithm];

    if (!stepsResult) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 14px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '36px', opacity: 0.6 }}>🌳</div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6 }}>Run navigation to see how the algorithm thinks. The decision tree will appear here.</p>
            </div>
        );
    }

    return (
        <ReactFlowProvider>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                            {algoLabel} Tree
                        </p>
                        <span className="badge badge-blue">{stepsResult.steps?.length} steps</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <button onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} className="btn btn-ghost btn-icon" title="Previous Step">⏮</button>
                        <button onClick={() => setCurrentStepIndex(Math.min((stepsResult?.steps?.length || 1) - 1, currentStepIndex + 1))} className="btn btn-ghost btn-icon" title="Next Step">⏭</button>
                        <button onClick={() => setIsExpanded(true)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>⛶ Full View</button>
                    </div>
                </div>

                <Legend />

                {/* Playback Slider */}
                <div style={{ background: 'linear-gradient(135deg, #f4f7fc, #eef2fb)', padding: '8px 10px', borderRadius: 8, border: '1px solid #dce5f5', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline</span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 800, background: 'rgba(91,156,246,0.12)', padding: '1px 8px', borderRadius: 12 }}>
                            Step {currentStepIndex + 1} / {stepsResult.steps.length}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={stepsResult.steps.length - 1}
                        value={currentStepIndex}
                        onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
                        style={{ cursor: 'pointer', width: '100%', accentColor: 'var(--accent-blue)', height: '12px' }}
                    />
                </div>

                {/* Flow Diagram */}
                <div style={{ flex: 1, minHeight: '140px', background: '#f8fafc', borderRadius: 10, border: '1px solid #dde5f0', overflow: 'hidden', position: 'relative' }}>
                    <FlowView nodes={nodes} edges={edges} isExpanded={false} />
                </div>

                {/* Step Log + Evaluated column */}
                <div style={{ display: 'flex', gap: 8, height: '140px', flexShrink: 0 }}>
                    {/* Step Log */}
                    <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {stepsResult.steps?.slice(0, currentStepIndex + 1).reverse().map((step) => (
                            <div key={step.step} style={{
                                fontSize: '11px', fontFamily: 'var(--font-mono)',
                                color: '#4a5a70', padding: '5px 8px',
                                background: '#f4f7fc', borderRadius: 5,
                                borderLeft: '2.5px solid #5b9cf6', lineHeight: 1.4,
                            }}>
                                <span style={{ color: '#3a7dc8', fontWeight: 700 }}>#{step.step}</span>{' '}{step.description || `Settled ${step.node}`}
                            </div>
                        ))}
                    </div>
                    {/* Neighbors Panel */}
                    <div style={{ width: '90px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '1px solid #dde5f0', paddingLeft: 8 }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, color: '#1a2a3a', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evaluated</div>
                        <div className="custom-scroll" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {stepsResult.steps[currentStepIndex]?.neighbors_updated?.map((nb, i) => (
                                <div key={i} style={{ background: '#eafaf1', border: '1px solid #2ecc71', borderRadius: 4, padding: '4px', fontSize: '9px', textAlign: 'center', color: '#1e8449' }}>
                                    <div style={{ fontWeight: 700 }}>{NODES[nb.node]?.label || nb.node}</div>
                                    <div>{nb.f != null ? `f:${nb.f}` : nb.new_dist != null ? `d:${nb.new_dist}` : ''}</div>
                                </div>
                            ))}
                            {!stepsResult.steps[currentStepIndex]?.neighbors_updated?.length && (
                                <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>None</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Modal */}
            {isExpanded && (
                <ReactFlowProvider>
                    <FlowView nodes={nodes} edges={edges} isExpanded={true} onClose={() => setIsExpanded(false)} />
                </ReactFlowProvider>
            )}
        </ReactFlowProvider>
    );
}
