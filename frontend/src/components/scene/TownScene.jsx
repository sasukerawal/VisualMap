/**
 * TownScene — 7-block town with peaked-roof houses inside each block,
 * proper road network between blocks, fixed camera toggle, and
 * reduced OrbitControls mouse sensitivity.
 */
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Road } from './Road';
import { House } from './House';
import { Warehouse } from './Warehouse';
import { DeliveryVan } from './DeliveryVan';
import { NodeMarker } from './NodeMarker';
import { DeliveryPin } from './DeliveryPin';
import { NODES, EDGES, ADDRESS_NODES } from '../../data/townGraph';
import useStore from '../../store/useStore';

// Block definitions: center [cx, cz] and color theme index
const BLOCKS = [
    { id: 'A', cx: -18, cz: -16 },
    { id: 'B', cx: -2, cz: -16 },
    { id: 'C', cx: 14, cz: -16 },
    { id: 'D', cx: 30, cz: -16 },
    { id: 'E', cx: -11, cz: 10 },
    { id: 'F', cx: 3, cz: 10 },
    { id: 'G', cx: 17, cz: 10 },
];

// Block sidewalk/pavement pads
function BlockPad({ cx, cz }) {
    return (
        <mesh receiveShadow position={[cx, 0.01, cz]}>
            <boxGeometry args={[14, 0.06, 12]} />
            <meshStandardMaterial color="#d4c9b8" roughness={0.95} />
        </mesh>
    );
}

// Block boundary (low wall / curb)
function BlockOutline({ cx, cz }) {
    const w = 14.4, d = 12.4, h = 0.25;
    return (
        <mesh position={[cx, h / 2, cz]}>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#b8c0cc" roughness={0.9} wireframe={false} />
        </mesh>
    );
}

/** Camera controller that resets when cameraAngle changes */
function CameraRig({ cameraAngle }) {
    const { camera, gl } = useThree();
    const controlsRef = useRef();

    useEffect(() => {
        if (cameraAngle === 'top') {
            camera.position.set(2, 70, 0.01);
            camera.up.set(0, 0, -1);
            if (camera.isOrthographicCamera) {
                camera.zoom = 14;
                camera.updateProjectionMatrix();
            }
        } else {
            camera.position.set(-5, 38, 50);
            camera.up.set(0, 1, 0);
        }
        if (controlsRef.current) {
            controlsRef.current.target.set(4, 0, -4);
            controlsRef.current.update();
        }
    }, [cameraAngle]);

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan
            enableRotate={cameraAngle === 'perspective'}
            enableZoom
            panSpeed={0.35}
            rotateSpeed={0.3}
            zoomSpeed={0.6}
            dampingFactor={0.06}
            enableDamping
            maxPolarAngle={Math.PI / 2.1}
            minDistance={12}
            maxDistance={100}
            target={[4, 0, -4]}
        />
    );
}

function SceneContent() {
    const { cameraAngle, showLabels, destinations, exploredNodes, exploredEdges, routeResult } = useStore();
    const { camera } = useThree();

    // Switch camera type on angle change
    useEffect(() => {
        if (cameraAngle === 'top') {
            // Switch to orthographic-like perspective by angling straight down
            camera.fov = 50;
            camera.updateProjectionMatrix();
        } else {
            camera.fov = 50;
            camera.updateProjectionMatrix();
        }
    }, [cameraAngle, camera]);

    const finalPath = routeResult?.path || [];
    const finalEdgeSet = useMemo(() => {
        const s = new Set();
        (routeResult?.edges_traversed || []).forEach(([a, b]) => { s.add(`${a}-${b}`); s.add(`${b}-${a}`); });
        return s;
    }, [routeResult]);

    const exploredSet = useMemo(() => {
        const s = new Set();
        exploredEdges.forEach(k => { s.add(k); s.add(k.split('-').reverse().join('-')); });
        return s;
    }, [exploredEdges]);

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

            {/* Stars & atmosphere */}
            <Stars radius={120} depth={50} count={1500} factor={3} fade speed={0.2} />
            <fog attach="fog" args={['#1a2035', 60, 130]} />

            {/* Lights */}
            <ambientLight intensity={0.55} color="#ddeeff" />
            <directionalLight
                castShadow
                position={[-20, 40, 20]}
                intensity={1.8}
                color="#fff5e8"
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={120}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />
            <pointLight position={[-34, 5, -16]} color="#ffd700" intensity={3} distance={14} />
            <pointLight position={[4, 6, -4]} color="#6480ff" intensity={1.5} distance={35} />
            <pointLight position={[4, 6, 10]} color="#5566ff" intensity={1} distance={30} />

            {/* Ground */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                <planeGeometry args={[120, 90]} />
                <meshStandardMaterial color="#2a3040" roughness={0.95} />
            </mesh>

            {/* Block pads and outlines */}
            {BLOCKS.map(b => (
                <group key={b.id}>
                    <BlockOutline cx={b.cx} cz={b.cz} />
                    <BlockPad cx={b.cx} cz={b.cz} />
                </group>
            ))}

            {/* Roads */}
            {EDGES.map(([a, b, ow], i) => (
                <Road
                    key={`e-${i}`}
                    from={NODES[a]?.pos}
                    to={NODES[b]?.pos}
                    oneWay={ow}
                    isExplored={exploredSet.has(`${a}-${b}`) || exploredSet.has(`${b}-${a}`)}
                    isFinal={finalEdgeSet.has(`${a}-${b}`)}
                />
            ))}

            {/* Houses */}
            {ADDRESS_NODES.map((node, i) => (
                <House
                    key={node.id}
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
                        label={showLabels ? node.label : null}
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
                    showLabel={showLabels}
                />
            ))}

            {/* Delivery Van */}
            <DeliveryVan />
        </>
    );
}

export function TownScene() {
    const { cameraAngle } = useStore();
    return (
        <div style={{ width: '100%', height: '100%', background: '#1a2035' }}>
            <Canvas
                shadows
                camera={{ fov: 50, position: [-5, 38, 50], near: 0.1, far: 200 }}
                gl={{ antialias: true }}
            >
                <SceneContent />
            </Canvas>
        </div>
    );
}
