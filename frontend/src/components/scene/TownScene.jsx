/**
 * TownScene — 7-block town with peaked-roof houses inside each block,
 * proper road network between blocks, fixed camera toggle, and
 * reduced OrbitControls mouse sensitivity.
 */
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Road } from './Road';
import { House } from './House';
import { Warehouse } from './Warehouse';
import { DeliveryVan } from './DeliveryVan';
import { NodeMarker } from './NodeMarker';
import { DeliveryPin } from './DeliveryPin';
import { Tree } from './Tree';
import { NODES, EDGES, ADDRESS_NODES, displayNodeName } from '../../data/townGraph';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';

// Block definitions: center [cx, cz] and color theme index
// Each block is split into Left and Right lots with an alleyway in the middle
const BLOCKS = [
    { id: 'A', cx: -18, cz: -14, w: 20, d: 22 },
    { id: 'B', cx: -2, cz: -14, w: 20, d: 22 },
    { id: 'C', cx: 14, cz: -14, w: 20, d: 22 },
    { id: 'D', cx: 30, cz: -14, w: 20, d: 22 },
    { id: 'E', cx: -11, cz: 11, w: 20, d: 16 },
    { id: 'F', cx: 3, cz: 11, w: 20, d: 16 },
    { id: 'G', cx: 17, cz: 11, w: 20, d: 16 },
];

// A green lawn with a white concrete sidewalk border
// And sprinkled trees inside
function BlockLot({ cx, cz, w, d, seed }) {
    // Generate some random tree positions within this lot
    const trees = useMemo(() => {
        const arr = [];
        const count = 5; // Increased density
        for (let i = 0; i < count; i++) {
            const rx = (Math.sin(seed * 42 + i * 17) * 0.45) * w;
            const rz = (Math.cos(seed * 24 + i * 13) * 0.45) * d;
            const isPine = Math.sin(seed + i * 2) > 0;
            const scale = 0.6 + Math.abs(Math.sin(seed * i)) * 1.2; // More scale variety

            // Place trees away from the direct center to avoid clipping with houses
            if (Math.abs(rx) > 2.5 || Math.abs(rz) > 2.5) {
                arr.push({ x: rx, z: rz, type: isPine ? 'pine' : 'deciduous', scale });
            }
        }
        return arr;
    }, [w, d, seed]);

    return (
        <group position={[cx, 0, cz]}>
            {/* Sidewalk base */}
            <mesh receiveShadow position={[0, 0.02, 0]}>
                <boxGeometry args={[w + 1.2, 0.04, d + 1.2]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
            </mesh>
            {/* Green Lawn */}
            <mesh receiveShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[w, 0.06, d]} />
                <meshStandardMaterial color="#4d7c0f" roughness={1.0} />
            </mesh>
            {/* Trees */}
            {trees.map((t, i) => (
                <Tree key={i} position={[t.x, 0.07, t.z]} scale={t.scale} type={t.type} />
            ))}
        </group>
    );
}

/** Camera controller that resets when cameraAngle changes */
function CameraRig({ cameraAngle }) {
    const { camera, gl } = useThree();
    const controlsRef = useRef();

    useEffect(() => {
        if (cameraAngle === 'top') {
            camera.position.set(0, 80, 0.01);
            camera.up.set(0, 0, -1);
            if (camera.isOrthographicCamera) {
                camera.zoom = 12;
                camera.updateProjectionMatrix();
            }
        } else {
            camera.position.set(-15, 45, 60);
            camera.up.set(0, 1, 0);
        }
        if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, -2);
            controlsRef.current.update();
        }
    }, [cameraAngle]);

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan
            enableRotate={cameraAngle === 'perspective'}
            enableZoom
            panSpeed={0.4}
            rotateSpeed={0.4}
            zoomSpeed={0.8}
            dampingFactor={0.05}
            enableDamping
            maxPolarAngle={Math.PI / 2.2}
            minDistance={15}
            maxDistance={120}
            target={[0, 0, -2]}
        />
    );
}

function SceneContent() {
    const { cameraAngle, showLabels, destinations, exploredNodes, exploredEdges, routeResult, stepsResult, currentStepIndex } = useStore(
        (s) => ({
            cameraAngle: s.cameraAngle,
            showLabels: s.showLabels,
            destinations: s.destinations,
            exploredNodes: s.exploredNodes,
            exploredEdges: s.exploredEdges,
            routeResult: s.routeResult,
            stepsResult: s.stepsResult,
            currentStepIndex: s.currentStepIndex,
        }),
        shallow
    );
    const uiOverlayOpen = useStore((s) => s.isUiOverlayOpen);
    const { camera } = useThree();

    // Switch camera type on angle change
    useEffect(() => {
        if (cameraAngle === 'top') {
            camera.fov = 50;
            camera.updateProjectionMatrix();
        } else {
            camera.fov = 50;
            camera.updateProjectionMatrix();
        }
    }, [cameraAngle, camera]);

    const finalPath = routeResult?.path || [];
    const addressNodeIds = useMemo(() => new Set(ADDRESS_NODES.map(n => n.id)), []);

    // Edges belonging to the final shortest path
    const finalEdgeSet = useMemo(() => {
        const s = new Set();
        (routeResult?.edges_traversed || []).forEach(([a, b]) => { s.add(`${a}-${b}`); s.add(`${b}-${a}`); });
        return s;
    }, [routeResult]);

    // Edges that have been visited/settled throughout the simulation so far
    const exploredSet = useMemo(() => {
        const s = new Set();
        exploredEdges.forEach(k => { s.add(k); s.add(k.split('-').reverse().join('-')); });
        return s;
    }, [exploredEdges]);

    // Edges being "relaxed" in the current single step
    const activeRelaxedEdges = useMemo(() => {
        const s = new Set();
        const currentStep = stepsResult?.steps?.[currentStepIndex];
        if (currentStep && currentStep.node && currentStep.neighbors_updated) {
            const u = currentStep.node;
            currentStep.neighbors_updated.forEach(nb => {
                const v = nb.node;
                s.add(`${u}-${v}`);
                s.add(`${v}-${u}`);
            });
        }
        return s;
    }, [stepsResult, currentStepIndex]);

    // Group houses by block for index offset
    const housesByBlock = useMemo(() => {
        const map = {};
        let globalIdx = 0;
        ADDRESS_NODES.forEach(n => {
            if (!map[n.block]) map[n.block] = [];
            map[n.block].push({ ...n, colorIndex: globalIdx++ });
        });
        return map;
    }, []);

    return (
        <>
            <CameraRig cameraAngle={cameraAngle} />

            {/* Atmosphere (Daytime) */}
            <fog attach="fog" args={['#87CEEB', 60, 150]} />
            <Sky distance={450000} sunPosition={[-1, 0.6, 0.2]} turbidity={7} rayleigh={2.5} mieCoefficient={0.006} mieDirectionalG={0.8} />

            {/* Lights (Bright Daylight) */}
            <ambientLight intensity={1.3} color="#ffffff" />
            <hemisphereLight intensity={0.55} groundColor="#334155" color="#dbeafe" />
            <directionalLight
                castShadow
                position={[-30, 60, 40]}
                intensity={2.8}
                color="#fffcf0"
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={120}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
                shadow-bias={-0.0005}
            />

            {/* Ground (Dirt/Earth underneath) */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <planeGeometry args={[120, 90]} />
                <meshStandardMaterial color="#3b3a2f" roughness={0.98} />
            </mesh>

            {/* Block Lots (Left and Right of the alleyway) */}
            {BLOCKS.map(b => (
                <group key={b.id}>
                    <BlockLot cx={b.cx - 5} cz={b.cz} w={b.w / 2 - 2} d={b.d - 2} seed={b.cx} />
                    <BlockLot cx={b.cx + 5} cz={b.cz} w={b.w / 2 - 2} d={b.d - 2} seed={b.cz} />
                </group>
            ))}

            {/* Roads */}
            {EDGES.map((edge, i) => {
                const edgeKey = `${edge.source}-${edge.target}`;
                const revEdgeKey = `${edge.target}-${edge.source}`;
                return (
                    <Road
                        key={`e-${i}`}
                        from={NODES[edge.source]?.pos}
                        to={NODES[edge.target]?.pos}
                        oneWay={edge.one_way}
                        speedLimit={edge.speed_limit}
                        roadType={edge.road_type}
                        isExplored={exploredSet.has(edgeKey) || exploredSet.has(revEdgeKey)}
                        isFinal={finalEdgeSet.has(edgeKey) || finalEdgeSet.has(revEdgeKey)}
                        isActiveRelaxed={activeRelaxedEdges.has(edgeKey) || activeRelaxedEdges.has(revEdgeKey)}
                        isDriveway={addressNodeIds.has(edge.source) || addressNodeIds.has(edge.target)}
                        uiOverlayOpen={uiOverlayOpen}
                    />
                );
            })}

            {/* Houses */}
            {ADDRESS_NODES.map((node, i) => (
                <House
                    key={node.id}
                    nodeId={node.id}
                    position={[node.pos[0], 0, node.pos[2]]}
                    colorIndex={i}
                />
            ))}

            {/* Warehouse */}
            <Warehouse position={NODES.warehouse.pos} />

            {/* Intersection markers (small dots) */}
            {Object.entries(NODES)
                .filter(([, v]) => v.type === 'intersection')
                .map(([id, node]) => (
                    <NodeMarker
                        key={id}
                        nodeId={id}
                        position={node.pos}
                        label={showLabels && !uiOverlayOpen ? displayNodeName(id) : null}
                        isExplored={exploredNodes.includes(id)}
                        isOnPath={finalPath.includes(id)}
                    />
                ))}

            {/* Delivery pins — sit ON TOP of each house */}
            {ADDRESS_NODES.map((node) => (
                <DeliveryPin
                    key={node.id}
                    nodeId={node.id}
                    position={node.pos}
                    label={node.label}
                    isSelected={destinations.includes(node.id)}
                    isOnPath={finalPath.includes(node.id)}
                    showLabel={showLabels && !uiOverlayOpen}
                    uiOverlayOpen={uiOverlayOpen}
                />
            ))}

            {/* Delivery Van */}
            <DeliveryVan />
        </>
    );
}

export function TownScene() {
    const cameraAngle = useStore((s) => s.cameraAngle);

    return (
        <div style={{ width: '100%', height: '100%', background: '#87CEEB' }}>
            <Canvas
                shadows
                camera={{ fov: 50, position: [-5, 38, 50], near: 0.1, far: 200 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, failIfMajorPerformanceCaveat: false, powerPreference: 'high-performance' }}
            >
                <SceneContent />
            </Canvas>
        </div>
    );
}
