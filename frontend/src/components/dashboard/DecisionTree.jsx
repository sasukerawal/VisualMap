/**
 * DecisionTree — visualizes algorithm exploration with a clean light-theme
 * React Flow diagram and a readable step log.
 */
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo } from 'react';
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';

function buildFlowGraph(stepsResult) {
    if (!stepsResult?.steps?.length) return { nodes: [], edges: [] };
    const steps = stepsResult.steps.slice(0, 28);
    const seen = new Map();
    const rfNodes = [];
    const rfEdges = [];
    const COLS = 5;
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
                        <div style={{ textAlign: 'center', lineHeight: 1.35, padding: '2px 0' }}>
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
                    border: `1.5px solid ${isOnPath ? '#2ecc71' : '#c8d4e8'}`,
                    borderRadius: 9,
                    minWidth: 120,
                    padding: '5px 3px',
                    boxShadow: isOnPath ? '0 2px 10px rgba(46,204,113,0.25)' : '0 1px 4px rgba(0,0,0,0.1)',
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
                style: { stroke: isPathEdge ? '#2ecc71' : '#b0bcd4', strokeWidth: isPathEdge ? 2 : 1 },
                labelStyle: { fill: '#5a7090', fontSize: 8, fontFamily: 'monospace' },
                type: 'smoothstep',
                animated: isPathEdge,
            });
        });
    });

    return { nodes: rfNodes, edges: rfEdges };
}

export function DecisionTree() {
    const { stepsResult, algorithm } = useStore();
    const { nodes, edges } = useMemo(() => buildFlowGraph(stepsResult), [stepsResult]);

    if (!stepsResult) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px' }}>🌳</div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    Run navigation to see the decision tree — each node shows the cost settled by the algorithm.
                </p>
            </div>
        );
    }

    const algoLabel = { dijkstra: "Dijkstra", astar: "A*", bellman_ford: "Bellman-Ford" }[algorithm];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                    {algoLabel} Search Tree
                </p>
                <span className="badge badge-blue">{stepsResult.steps?.length} steps</span>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#eafaf1', border: '1.5px solid #2ecc71', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />On path</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f4f7fc', border: '1.5px solid #c8d4e8', borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />Explored</span>
            </div>

            {/* Diagram */}
            <div style={{ height: '300px', background: '#f8fafc', borderRadius: 10, border: '1px solid #dde5f0', overflow: 'hidden' }}>
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
                    <Controls showInteractive={false} style={{ background: '#fff', border: '1px solid #dde5f0', borderRadius: 7 }} />
                </ReactFlow>
            </div>

            {/* Step log */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {stepsResult.steps?.slice(0, 20).map((step) => (
                    <div key={step.step} style={{
                        fontSize: '11px', fontFamily: 'var(--font-mono)',
                        color: '#4a5a70', padding: '4px 8px',
                        background: '#f4f7fc', borderRadius: 5,
                        borderLeft: '2.5px solid #5b9cf6', lineHeight: 1.4,
                    }}>
                        <span style={{ color: '#3a7dc8', fontWeight: 600 }}>#{step.step}</span> {step.description}
                    </div>
                ))}
            </div>
        </div>
    );
}
