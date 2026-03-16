/**
 * TownMap2D — orthographic, top-down 2D view of the SAME town assets (roads/houses/warehouse),
 * used by "Schematic Topography".
 *
 * Goal: replace the ReactFlow schematic with an actual map render that matches the 3D scene.
 */
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, MapControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { NODES, EDGES, ADDRESS_NODES } from '../../data/townGraph';
import { elevationAt, groundHeightAt, TERRAIN_AMP, TERRAIN_BASE_Y } from '../../data/elevation';
import { Road } from './Road';
import { House } from './House';
import { Warehouse } from './Warehouse';
import { DeliveryPin } from './DeliveryPin';
import { NodeMarker } from './NodeMarker';

const DEFAULT_TARGET = new THREE.Vector3(0, 0, -2);
const DEFAULT_ZOOM = 12.5;

function CameraAndControls({ controlsRef }) {
    const { camera } = useThree();

    useEffect(() => {
        // Orthographic top-down
        camera.position.set(0, 80, 0.01);
        camera.up.set(0, 0, -1);
        camera.zoom = DEFAULT_ZOOM;
        camera.near = 0.1;
        camera.far = 500;
        camera.updateProjectionMatrix();
    }, [camera]);

    return (
        <MapControls
            ref={controlsRef}
            enableRotate={false}
            enableDamping
            dampingFactor={0.08}
            screenSpacePanning
            zoomSpeed={0.9}
            panSpeed={0.9}
            minZoom={7}
            maxZoom={26}
            target={[DEFAULT_TARGET.x, DEFAULT_TARGET.y, DEFAULT_TARGET.z]}
        />
    );
}

const DecisionCallout = memo(function DecisionCallout({ step }) {
    if (!step?.node) return null;
    const n = NODES[step.node];
    if (!n) return null;

    const x = n.pos[0];
    const z = n.pos[2];
    const y = groundHeightAt(x, z) + 0.25;

    const neighbors = Array.isArray(step.neighbors_updated) ? step.neighbors_updated.slice(0, 4) : [];

    return (
        <Html position={[x, y, z]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    width: 340,
                    maxWidth: 'min(360px, 60vw)',
                    background: 'rgba(7, 10, 20, 0.88)',
                    border: '1px solid rgba(148,163,184,0.22)',
                    borderRadius: 14,
                    padding: '10px 12px',
                    color: '#e5eefc',
                    boxShadow: '0 22px 50px rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fb0ca' }}>
                        Current Decision
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24' }}>{n.label || step.node}</div>
                </div>

                {step.explanation && (
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: '#dbeafe', lineHeight: 1.25 }}>
                        {step.explanation}
                    </div>
                )}

                {neighbors.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {neighbors.map((nb) => (
                            <div
                                key={nb.node}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    padding: '6px 8px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(148,163,184,0.12)',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ fontSize: 11, fontWeight: 850, color: nb.relaxed ? '#86efac' : '#cbd5e1' }}>
                                        {NODES[nb.node]?.label || nb.node}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#8ea3c2' }}>{nb.note || ''}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#cbd5e1' }}>
                                    {nb.edge_time != null && <div>+{Number(nb.edge_time).toFixed(1)} s</div>}
                                    {nb.edge_dist != null && <div>+{Number(nb.edge_dist).toFixed(1)} u</div>}
                                    {nb.edge_fuel_cost != null && <div>+{Number(nb.edge_fuel_cost).toFixed(2)} fuel</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Html>
    );
});

function ActiveEdgeProbe({ step, speed }) {
    const ref = useRef();
    const tRef = useRef(0);

    const edge = useMemo(() => {
        if (!step?.node || !Array.isArray(step.neighbors_updated) || step.neighbors_updated.length === 0) return null;
        const from = NODES[step.node];
        const to = NODES[step.neighbors_updated[0].node];
        if (!from || !to) return null;
        return { from, to };
    }, [step]);

    useFrame((_, delta) => {
        if (!ref.current || !edge) return;
        tRef.current = (tRef.current + delta * (speed || 1)) % 1;
        const t = tRef.current;

        const ax = edge.from.pos[0];
        const az = edge.from.pos[2];
        const bx = edge.to.pos[0];
        const bz = edge.to.pos[2];

        const x = THREE.MathUtils.lerp(ax, bx, t);
        const z = THREE.MathUtils.lerp(az, bz, t);
        const y = groundHeightAt(x, z) + 0.22;
        ref.current.position.set(x, y, z);
    });

    if (!edge) return null;

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2.2} />
        </mesh>
    );
}

function Scene2D({ selectedOnly = true }) {
    const {
        destinations,
        exploredEdges,
        routeResult,
        stepsResult,
        currentStepIndex,
        isTimelinePlaying,
        isTimelinePaused,
        animationSpeed,
    } = useStore(
        (s) => ({
            destinations: s.destinations,
            exploredEdges: s.exploredEdges,
            routeResult: s.routeResult,
            stepsResult: s.stepsResult,
            currentStepIndex: s.currentStepIndex,
            isTimelinePlaying: s.isTimelinePlaying,
            isTimelinePaused: s.isTimelinePaused,
            animationSpeed: s.animationSpeed,
        }),
        shallow
    );

    const terrainGeo = useMemo(() => {
        const geo = new THREE.PlaneGeometry(120, 90, 90, 70);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const e = elevationAt(x, z);
            const y = e * TERRAIN_AMP;
            pos.setY(i, y);

            const t = Math.max(0, Math.min(1, (y / (TERRAIN_AMP * 3.0) + 0.5)));
            const c = new THREE.Color().setHSL(0.30 - t * 0.12, 0.45, 0.18 + t * 0.18);
            colors[i * 3 + 0] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        pos.needsUpdate = true;
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, []);

    const step = stepsResult?.steps?.[currentStepIndex] || null;

    const finalEdgeSet = useMemo(() => {
        const s = new Set();
        (routeResult?.edges_traversed || []).forEach(([a, b]) => {
            s.add(`${a}-${b}`);
            s.add(`${b}-${a}`);
        });
        return s;
    }, [routeResult]);

    const exploredSet = useMemo(() => {
        const s = new Set();
        (exploredEdges || []).forEach((k) => {
            s.add(k);
            s.add(k.split('-').reverse().join('-'));
        });
        return s;
    }, [exploredEdges]);

    const activeRelaxedEdges = useMemo(() => {
        const s = new Set();
        if (step?.node && Array.isArray(step.neighbors_updated)) {
            const u = step.node;
            step.neighbors_updated.forEach((nb) => {
                const v = nb.node;
                s.add(`${u}-${v}`);
                s.add(`${v}-${u}`);
            });
        }
        return s;
    }, [step]);

    const addressNodeIds = useMemo(() => new Set(ADDRESS_NODES.map((n) => n.id)), []);
    const selectedSet = useMemo(() => new Set(destinations), [destinations.join('|')]);

    const warehousePos = useMemo(() => {
        const p = NODES.warehouse.pos;
        return [p[0], groundHeightAt(p[0], p[2]), p[2]];
    }, []);

    const showSelectedOnly = selectedOnly;

    const visibleHouses = useMemo(() => {
        if (!showSelectedOnly) return ADDRESS_NODES;
        return ADDRESS_NODES.filter((n) => selectedSet.has(n.id));
    }, [showSelectedOnly, selectedSet]);

    return (
        <>
            {/* Quick daylight */}
            <ambientLight intensity={1.35} />
            <directionalLight position={[-30, 60, 40]} intensity={2.2} />

            {/* Ground */}
            <mesh receiveShadow={false} position={[0, TERRAIN_BASE_Y, 0]} geometry={terrainGeo}>
                <meshStandardMaterial vertexColors roughness={0.98} metalness={0} />
            </mesh>

            {/* Roads (always show) */}
            {EDGES.map((edge, i) => {
                const edgeKey = `${edge.source}-${edge.target}`;
                const revEdgeKey = `${edge.target}-${edge.source}`;
                return (
                    <Road
                        key={`e2d-${i}`}
                        from={NODES[edge.source]?.pos}
                        to={NODES[edge.target]?.pos}
                        oneWay={edge.one_way}
                        speedLimit={edge.speed_limit}
                        roadType={edge.road_type}
                        isExplored={exploredSet.has(edgeKey) || exploredSet.has(revEdgeKey)}
                        isFinal={finalEdgeSet.has(edgeKey) || finalEdgeSet.has(revEdgeKey)}
                        isActiveRelaxed={activeRelaxedEdges.has(edgeKey) || activeRelaxedEdges.has(revEdgeKey)}
                        isDriveway={addressNodeIds.has(edge.source) || addressNodeIds.has(edge.target)}
                        uiOverlayOpen
                    />
                );
            })}

            {/* Houses (selected only) */}
            {visibleHouses.map((node, i) => (
                <House
                    key={`h2d-${node.id}`}
                    nodeId={node.id}
                    position={[node.pos[0], groundHeightAt(node.pos[0], node.pos[2]) + 0.02, node.pos[2]]}
                    colorIndex={i}
                    interactive={false}
                />
            ))}

            {/* Warehouse */}
            <Warehouse position={warehousePos} />

            {/* Pins on selected houses (labels always on in schematic) */}
            {visibleHouses.map((node) => (
                <DeliveryPin
                    key={`p2d-${node.id}`}
                    nodeId={node.id}
                    position={[node.pos[0], groundHeightAt(node.pos[0], node.pos[2]) + 0.02, node.pos[2]]}
                    label={node.label}
                    isSelected={selectedSet.has(node.id)}
                    isOnPath={(routeResult?.path || []).includes(node.id)}
                    showLabel
                    uiOverlayOpen={false}
                    interactive={false}
                />
            ))}

            {/* Minimal intersection markers (only when steps exist) */}
            {stepsResult?.steps?.length
                ? Object.entries(NODES)
                    .filter(([, v]) => v.type === 'intersection')
                    .map(([id, node]) => (
                        <NodeMarker
                            key={`m2d-${id}`}
                            nodeId={id}
                            position={[node.pos[0], groundHeightAt(node.pos[0], node.pos[2]) + 0.09, node.pos[2]]}
                            label={null}
                            isExplored={false}
                            isOnPath={false}
                        />
                    ))
                : null}

            {/* Decision callout + animated probe along current relaxed edge */}
            <DecisionCallout step={step} />
            {isTimelinePlaying && !isTimelinePaused && <ActiveEdgeProbe step={step} speed={animationSpeed} />}
        </>
    );
}

export const TownMap2D = forwardRef(function TownMap2D({ selectedOnly = true }, ref) {
    const controlsRef = useRef();

    useImperativeHandle(ref, () => ({
        recenter: () => {
            const controls = controlsRef.current;
            if (controls?.target) controls.target.copy(DEFAULT_TARGET);
            if (controls?.object) {
                controls.object.zoom = DEFAULT_ZOOM;
                controls.object.position.set(0, 80, 0.01);
                controls.object.up.set(0, 0, -1);
                controls.object.updateProjectionMatrix?.();
            }
            controls?.update?.();
        }
    }), []);

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <Canvas
                orthographic
                shadows={false}
                dpr={[1, 1.25]}
                camera={{ zoom: DEFAULT_ZOOM, position: [0, 80, 0.01], near: 0.1, far: 500 }}
                gl={{ antialias: true, failIfMajorPerformanceCaveat: false, powerPreference: 'high-performance' }}
            >
                <CameraAndControls controlsRef={controlsRef} />
                <Scene2D selectedOnly={selectedOnly} />
            </Canvas>
        </div>
    );
});
