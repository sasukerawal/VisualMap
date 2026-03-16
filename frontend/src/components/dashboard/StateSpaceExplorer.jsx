/**
 * StateSpaceExplorer — previously DecisionTree.
 * Visualizes the algorithm's state space exploration as an interactive "Path Choice Explorer".
 */
import ReactFlow, { Background, Controls, useReactFlow, ReactFlowProvider, getStraightPath } from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemo, useState, useEffect, useCallback } from 'react';
import useStore from '../../store/useStore';
import { NODES, EDGES, displayNodeName } from '../../data/townGraph';
import { BubbleNode } from './BubbleNode';

// Custom Pulse Edge Component
function PulseEdge({ id, sourceX, sourceY, targetX, targetY, style, animated }) {
    const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
                d={edgePath}
            />
            {animated && (
                <circle r="4" fill="#fbbf24">
                    <animateMotion
                        dur="1s"
                        repeatCount="indefinite"
                        path={edgePath}
                    />
                </circle>
            )}
        </>
    );
}

const edgeTypes = { pulse: PulseEdge };

function MapDotNode({ data }) {
    const isActive = data?.state === 'active';
    const isVisited = data?.state === 'visited';

    const bg = isActive ? '#fbbf24' : isVisited ? '#22c55e' : '#64748b';
    const ring = isActive ? '0 0 0 6px rgba(251,191,36,0.16), 0 0 18px rgba(251,191,36,0.22)' : 'none';

    return (
        <div
            style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: bg,
                boxShadow: ring,
                border: '1px solid rgba(15,23,42,0.55)',
                opacity: data?.opacity ?? 1,
            }}
        />
    );
}

function MapGhostNode() {
    // Invisible anchor so edges can still render to hidden houses.
    return <div style={{ width: 2, height: 2, opacity: 0 }} />;
}

function MapPinNode({ data }) {
    const color = data?.color || '#f97316';
    const label = data?.label;
    const isWarehouse = data?.kind === 'warehouse';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {label && (
                <div
                    style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: isWarehouse ? 'rgba(249,115,22,0.16)' : 'rgba(12, 18, 30, 0.72)',
                        border: `1px solid ${isWarehouse ? 'rgba(249,115,22,0.4)' : 'rgba(148,163,184,0.22)'}`,
                        color: isWarehouse ? '#ffd0ad' : '#d6e4ff',
                        fontSize: '11px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 16px 30px rgba(0,0,0,0.24)',
                        backdropFilter: 'blur(10px)',
                        pointerEvents: 'none',
                    }}
                >
                    {label}
                </div>
            )}
            <div
                style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: color,
                    boxShadow: `0 0 0 6px ${color}1f, 0 0 22px ${color}2a`,
                    border: '1px solid rgba(15,23,42,0.55)',
                }}
            />
        </div>
    );
}

const nodeTypes = { bubble: BubbleNode, mapDot: MapDotNode, mapPin: MapPinNode, mapGhost: MapGhostNode };

// Legend categories matching the reference image
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

function buildFlowGraph(stepsResult, currentStepIndex, learningMode, destinations, routeResult, isTimelinePlaying) {
    if (!stepsResult?.steps?.length) return { nodes: [], edges: [] };

    const currentSteps = stepsResult.steps.slice(0, currentStepIndex + 1);
    if (currentSteps.length === 0) return { nodes: [], edges: [] };

    const activeNodeId = currentSteps[currentSteps.length - 1].node;
    const isFinished = currentSteps.length === stepsResult.steps.length && activeNodeId === destinations[destinations.length - 1];

    const nodeStates = new Map();
    const edgesSet = new Map();

    // Final Path highlighting logic
    const pathEdges = new Set();
    if (routeResult?.path) {
        for (let i = 0; i < routeResult.path.length - 1; i++) {
            pathEdges.add(`${routeResult.path[i]}-${routeResult.path[i + 1]}`);
        }
    }

    currentSteps.forEach((step, idx) => {
        const u = step.node;
        const isLastStep = idx === currentSteps.length - 1;

        nodeStates.set(u, {
            state: isLastStep && !isFinished ? 'active' : 'visited',
            d: step.distance,
            h: step.heuristic,
            f: step.f_score,
            explanation: isLastStep ? (step.explanation || step.description) : undefined,
        });

        step.neighbors_updated?.forEach(nb => {
            const v = nb.node;
            edgesSet.set(`${u}-${v}`, { source: u, target: v, action: 'relax' });

            if (!nodeStates.has(v) || nodeStates.get(v).state === 'candidate') {
                nodeStates.set(v, {
                    state: 'candidate',
                    d: nb.new_dist ?? nb.g,
                    h: nb.h ?? nb.heuristic,
                    f: nb.f,
                    via: nb.from_node ?? u,
                    edge_time_cost: nb.edge_time_cost,
                    edge_distance: nb.edge_distance,
                });
            }
        });
    });

    const rfNodes = [];
    const rfEdges = [];

    nodeStates.forEach((data, nId) => {
        const nodeDef = NODES[nId];
        if (!nodeDef) return;

        if (learningMode === 'beginner') {
            const isStop = destinations.includes(nId) || nId === 'warehouse';
            if (data.state !== 'active' && data.state !== 'candidate' && !isStop) {
                return;
            }
        }

        // Use the town's real coordinates so the schematic matches the 3D map orientation (north up).
        const scale = 14;
        const posX = nodeDef.pos[0] * scale;
        const posY = -nodeDef.pos[2] * scale;

        let state = data.state;
        if (state === 'visited' && isFinished && destinations.includes(nId)) {
            state = 'goal';
        }
        if (nId === 'warehouse') state = 'start';

        rfNodes.push({
            id: nId,
            type: 'bubble',
            position: { x: posX, y: posY },
            data: {
                label: displayNodeName(nId),
                state,
                distance: data.d,
                heuristic: data.h,
                f_score: data.f,
                block: nodeDef.block,
                learningMode,
                explanation: data.explanation,
                via: data.via,
                edge_time_cost: data.edge_time_cost,
                edge_distance: data.edge_distance,
            },
        });
    });

    edgesSet.forEach((val, key) => {
        const isFromActive = val.source === activeNodeId;
        const isPath = pathEdges.has(key);

        if (!nodeStates.has(val.source) || !nodeStates.has(val.target)) return;

        rfEdges.push({
            id: key,
            source: val.source,
            target: val.target,
            type: isFromActive ? 'pulse' : 'straight',
            animated: (isTimelinePlaying && isFromActive) || (isPath && isFinished),
            style: {
                stroke: isPath && isFinished ? '#3b82f6' : (isFromActive ? '#fbbf24' : '#475569'),
                strokeWidth: isPath && isFinished ? 5 : (isFromActive ? 3 : 1.5),
                opacity: isPath && isFinished ? 1 : (isFromActive ? 1 : 0.3),
                filter: isPath && isFinished ? 'drop-shadow(0 0 8px #3b82f6)' : 'none',
            }
        });
    });

    return { nodes: rfNodes, edges: rfEdges };
}

function buildMapGraph(stepsResult, currentStepIndex, destinations, routeResult, isTimelinePlaying) {
    if (!stepsResult?.steps?.length) return { nodes: [], edges: [] };

    const stepsSoFar = stepsResult.steps.slice(0, currentStepIndex + 1);
    const activeNodeId = stepsSoFar[stepsSoFar.length - 1]?.node;
    const visitedSet = new Set(stepsSoFar.map(s => s.node));

    const activeRelaxed = new Set();
    const activeStep = stepsResult.steps[currentStepIndex];
    if (activeStep?.node && Array.isArray(activeStep.neighbors_updated)) {
        const u = activeStep.node;
        for (const nb of activeStep.neighbors_updated) {
            const v = nb.node;
            activeRelaxed.add(`${u}-${v}`);
            activeRelaxed.add(`${v}-${u}`);
        }
    }

    const finalEdgeSet = new Set();
    (routeResult?.edges_traversed || []).forEach(([a, b]) => {
        finalEdgeSet.add(`${a}-${b}`);
        finalEdgeSet.add(`${b}-${a}`);
    });
    if (finalEdgeSet.size === 0 && routeResult?.path?.length) {
        for (let i = 0; i < routeResult.path.length - 1; i++) {
            const a = routeResult.path[i];
            const b = routeResult.path[i + 1];
            finalEdgeSet.add(`${a}-${b}`);
            finalEdgeSet.add(`${b}-${a}`);
        }
    }

    const selectedSet = new Set([...(destinations || []), 'warehouse']);

    const scale = 14;
    const rfNodes = Object.entries(NODES).map(([id, def]) => {
        const x = def.pos[0] * scale;
        const y = -def.pos[2] * scale;

        const isSelectedHouse = def.type === 'address' && selectedSet.has(id);
        const isHiddenHouse = def.type === 'address' && !selectedSet.has(id);

        if (isHiddenHouse) {
            return {
                id,
                type: 'mapGhost',
                position: { x, y },
                data: {},
                draggable: false,
                selectable: false,
                style: { width: 2, height: 2, opacity: 0, pointerEvents: 'none' },
            };
        }

        if (id === 'warehouse') {
            return {
                id,
                type: 'mapPin',
                position: { x, y },
                data: { kind: 'warehouse', label: displayNodeName(id), color: '#f97316' },
            };
        }

        if (isSelectedHouse) {
            return {
                id,
                type: 'mapPin',
                position: { x, y },
                data: { kind: 'stop', label: displayNodeName(id), color: '#fbbf24' },
            };
        }

        const state = id === activeNodeId ? 'active' : visitedSet.has(id) ? 'visited' : 'idle';
        return {
            id,
            type: 'mapDot',
            position: { x, y },
            data: { state },
            draggable: false,
            selectable: false,
        };
    });

    const rfEdges = EDGES.map((e) => {
        const edgeId = `${e.source}-${e.target}`;
        const isMain = e.road_type === 'main';
        const isAlley = e.road_type === 'alley';
        const isFinal = finalEdgeSet.has(edgeId);
        const isActive = activeRelaxed.has(edgeId);

        return {
            id: edgeId,
            source: e.source,
            target: e.target,
            type: isActive ? 'pulse' : 'straight',
            animated: isTimelinePlaying && isActive,
            style: {
                stroke: isFinal ? '#3b82f6' : isActive ? '#fbbf24' : isMain ? 'rgba(148,163,184,0.35)' : isAlley ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.26)',
                strokeWidth: isFinal ? 4.5 : isActive ? 2.5 : isMain ? 2 : 1.3,
                opacity: isFinal ? 1 : isActive ? 0.95 : 0.7,
                filter: isFinal ? 'drop-shadow(0 0 10px rgba(59,130,246,0.45))' : 'none',
            },
        };
    });

    return { nodes: rfNodes, edges: rfEdges };
}

function LegendOverlay({ dashboardMode }) {
    return (
        <div style={{
            position: 'absolute', right: 12, top: dashboardMode ? 12 : 12, bottom: 12,
            width: 140, background: 'rgba(7, 10, 18, 0.85)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10,
            zIndex: 10, backdropFilter: 'blur(10px)', borderRadius: '12px 0 0 12px',
        }}>
            <h4 style={{ margin: 0, fontSize: '10px', color: '#fff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Topography Legend</h4>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto' }}>
                {LEGEND_ITEMS.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.type === 'circle' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />}
                        {item.type === 'pulse' && (
                            <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1px solid ${item.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: item.color }} />
                            </div>
                        )}
                        {item.type === 'glow' && <div style={{ width: 12, height: 4, background: item.color, borderRadius: 2, boxShadow: `0 0 6px ${item.color}`, flexShrink: 0 }} />}
                        <span style={{ fontSize: '8px', color: '#7a8aaa', fontWeight: 600, lineHeight: 1.1 }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ZoneOverlay() {
    return (
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ position: 'absolute', left: 16, top: '25%', color: '#fff', opacity: 0.1, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>Northern Zone</div>
            <div style={{
                position: 'absolute', left: 0, top: '50%', width: '100%',
                borderBottom: '2px dashed rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <span style={{ background: 'transparent', padding: '2px 10px', fontSize: '9px', color: 'rgba(255,255,255,0.1)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Regional Divide</span>
            </div>
            <div style={{ position: 'absolute', left: 16, top: '70%', color: '#fff', opacity: 0.1, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase' }}>Southern Zone</div>
        </div>
    );
}

function FlowView({ nodes, edges, isExpanded, onClose, internalHeader = true }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        fitView({ padding: 0.15, duration: 400 });
    }, [nodes, fitView]);

    const header = (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161f2f', flexShrink: 0 }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#fbbf24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Algorithm Topography Model</h2>
                <p style={{ fontSize: '10px', color: '#7a8aaa', fontWeight: 700, margin: '2px 0 0' }}>Ref: Neighborhood Schematic Map 1A (Optimized Search Space)</p>
            </div>
            {onClose && (
                <button onClick={onClose} className="btn-close" style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', padding: '8px 16px', border: '1px solid rgba(255,100,100,0.2)', fontSize: '12px', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>✕ Close</button>
            )}
        </div>
    );

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {isExpanded && internalHeader && header}
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{ type: 'straight' }}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable
                    minZoom={0.05}
                >
                    <Background color="transparent" gap={30} size={1} />
                    <ZoneOverlay />
                    <LegendOverlay dashboardMode={!internalHeader} />
                </ReactFlow>
            </div>
        </div>
    );
}

function MapFlowView({ nodes, edges, onClose }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        fitView({ padding: 0.12, duration: 450 });
    }, [nodes, fitView]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161f2f', flexShrink: 0 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#fbbf24', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Algorithm Topography Model</h2>
                    <p style={{ fontSize: '10px', color: '#7a8aaa', fontWeight: 700, margin: '2px 0 0' }}>Ref: Neighborhood Map View (Selected Stops)</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="btn-close" style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', padding: '8px 16px', border: '1px solid rgba(255,100,100,0.2)', fontSize: '12px', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>✕ Close</button>
                )}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{ type: 'straight' }}
                    fitView
                    nodesDraggable
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnScroll
                    proOptions={{ hideAttribution: true }}
                    minZoom={0.05}
                >
                    <Background color="transparent" gap={30} size={1} />
                    <ZoneOverlay />
                    <LegendOverlay dashboardMode={false} />
                </ReactFlow>
            </div>
        </div>
    );
}

function ResetButton() {
    const { fitView } = useReactFlow();
    return (
        <button onClick={() => fitView({ padding: 0.2, duration: 400 })} style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>🎯 Re-center</button>
    );
}

export function StateSpaceExplorer({ expanded = false, onClose, internalHeader = true, dashboardMode = false }) {
    const {
        stepsResult,
        routeResult,
        algorithm,
        currentStepIndex,
        setCurrentStepIndex,
        learningMode,
        destinations,
        showLabels,
        setShowLabels,
        isTimelinePlaying,
        isTimelinePaused,
        animationSpeed,
    } = useStore();
    const [isExpanded, setIsExpanded] = useState(expanded);
    const [previousLabelState, setPreviousLabelState] = useState(true);

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
    }, [isExpanded, dashboardMode]);

    const { nodes: schematicNodes, edges: schematicEdges } = useMemo(() =>
        buildFlowGraph(stepsResult, currentStepIndex, learningMode, destinations, routeResult, isTimelinePlaying),
        [stepsResult, currentStepIndex, learningMode, destinations, routeResult, isTimelinePlaying]
    );

    const { nodes: mapNodes, edges: mapEdges } = useMemo(() =>
        buildMapGraph(stepsResult, currentStepIndex, destinations, routeResult, isTimelinePlaying),
        [stepsResult, currentStepIndex, destinations, routeResult, isTimelinePlaying]
    );

    if (!stepsResult) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, padding: '28px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', animation: 'float 3s ease-in-out infinite' }}>📊</div>
                <div style={{ maxWidth: '200px' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.2px' }}>Topography Standby</p>
                    <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#7a8aaa', lineHeight: 1.5 }}>Schematic topography will map the algorithm's search patterns once a simulation begins.</p>
                </div>
            </div>
        );
    }

    // In Dashboard Mode, we just return the FlowView directly within its provider
    if (dashboardMode) {
        return (
            <ReactFlowProvider>
                <FlowView nodes={schematicNodes} edges={schematicEdges} isExpanded={true} onClose={null} internalHeader={false} />
            </ReactFlowProvider>
        );
    }

    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                        Schematic Topography
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#556080', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                            {algorithm.toUpperCase()} MODEL 1A
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <ResetButton />
                    {!onClose && (
                        <button onClick={() => setIsExpanded(true)} className="btn-expand" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>⛶ Expand</button>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, minHeight: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                <FlowView nodes={schematicNodes} edges={schematicEdges} isExpanded={isExpanded} onClose={onClose} internalHeader={internalHeader} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#7a8aaa', textTransform: 'uppercase' }}>Search Progress</span>
                        <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 800 }}>
                            Consideration {currentStepIndex + 1} / {stepsResult.steps.length}
                        </span>
                    </div>
                    <input type="range" min="0" max={stepsResult.steps.length - 1} value={currentStepIndex} onChange={(e) => setCurrentStepIndex(Number(e.target.value))} style={{ cursor: 'pointer', width: '100%', accentColor: '#fbbf24', height: '6px' }} />
                </div>
            </div>
        </div>
    );

    if (onClose) return <ReactFlowProvider>{content}</ReactFlowProvider>;

    return (
        <ReactFlowProvider>
            {content}
            {isExpanded && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 10, 18, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '1400px', height: '90vh', background: '#0b0e14', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 100px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
                        <ReactFlowProvider>
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <MapFlowView nodes={mapNodes} edges={mapEdges} onClose={() => setIsExpanded(false)} />
                            </div>
                            <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(10,14,24,0.92)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 900, color: '#9fb0ca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Search Progress</div>
                                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#eef2ff' }}>
                                            Consideration {currentStepIndex + 1} / {stepsResult?.steps?.length || 0}
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
                                                    fontFamily: 'var(--font-mono)'
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
                                    max={(stepsResult?.steps?.length || 1) - 1}
                                    value={currentStepIndex}
                                    onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
                                    style={{ cursor: 'pointer', width: '100%', accentColor: '#35d7e8', height: '6px' }}
                                />

                                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                    <button
                                        onClick={() => (isTimelinePlaying && !isTimelinePaused ? useStore.getState().pauseSimulation() : useStore.getState().runSimulation())}
                                        style={{
                                            flex: 1,
                                            padding: '12px 14px',
                                            borderRadius: 14,
                                            border: '1px solid rgba(34,211,238,0.22)',
                                            background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(91,156,246,0.14))',
                                            color: '#d6f9ff',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                        }}
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
                                            fontWeight: 800,
                                            fontSize: '12px',
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </ReactFlowProvider>
                    </div>
                </div>
            )}
        </ReactFlowProvider>
    );
}

