/**
 * DeliveryVan — smooth path traversal.
 * Fixed: proper delta-based speed so 1x = realistic road speed.
 * Van moves smoothly between path waypoints and tracks delivery stops.
 */
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';

// Units per second at 1x speed
const BASE_SPEED = 5.0;

export function DeliveryVan() {
    const vanRef = useRef();
    const progressRef = useRef(0);
    const segmentRef = useRef(0);
    const targetRotRef = useRef(0);

    const {
        routeResult,
        isPlaying,
        isPaused,
        animationSpeed,
        setCurrentPathIndex,
        setCurrentSegment,
        addDelivered,
        setIsPlaying,
        destinations,
    } = useStore();

    const path = routeResult?.path || [];

    const waypoints = path.map((id) => {
        const n = NODES[id];
        return n ? new THREE.Vector3(n.pos[0], 0.35, n.pos[2]) : new THREE.Vector3(0, 0.35, 0);
    });

    // Reset when new route computed
    useEffect(() => {
        progressRef.current = 0;
        segmentRef.current = 0;
        if (vanRef.current && waypoints.length > 0) {
            vanRef.current.position.copy(waypoints[0]);
        }
    }, [routeResult]);

    useFrame((_, delta) => {
        if (!vanRef.current || !isPlaying || isPaused || waypoints.length < 2) return;

        const seg = segmentRef.current;
        if (seg >= waypoints.length - 1) {
            setIsPlaying(false);
            return;
        }

        const from = waypoints[seg];
        const to = waypoints[seg + 1];

        const segLen = from.distanceTo(to);
        // Advance by distance this frame
        const distThisFrame = BASE_SPEED * animationSpeed * delta;
        progressRef.current += segLen > 0 ? distThisFrame / segLen : 1;

        // Clamp at 1
        if (progressRef.current >= 1) {
            progressRef.current = 0;
            segmentRef.current += 1;
            setCurrentPathIndex(segmentRef.current);

            const arrivedNodeId = path[segmentRef.current];
            if (arrivedNodeId && destinations.includes(arrivedNodeId)) {
                addDelivered(arrivedNodeId);
                setCurrentSegment(destinations.indexOf(arrivedNodeId) + 1);
            }
        }

        // Interpolate position
        const t = Math.min(progressRef.current, 1);
        vanRef.current.position.lerpVectors(from, to, t);

        // Smooth rotation to face travel direction
        const dir = to.clone().sub(from);
        if (dir.length() > 0.001) {
            const targetAngle = Math.atan2(dir.x, dir.z);
            targetRotRef.current = targetAngle;
        }
        vanRef.current.rotation.y = THREE.MathUtils.lerp(
            vanRef.current.rotation.y,
            targetRotRef.current,
            Math.min(delta * 8, 1)
        );
    });

    const startPos = waypoints[0] ?? new THREE.Vector3(NODES.warehouse.pos[0], 0.35, NODES.warehouse.pos[2]);

    return (
        <group ref={vanRef} position={[startPos.x, startPos.y, startPos.z]}>
            {/* Van body */}
            <mesh castShadow position={[0, 0.42, 0]}>
                <boxGeometry args={[0.9, 0.65, 1.9]} />
                <meshStandardMaterial color="#1845c0" roughness={0.35} metalness={0.6} />
            </mesh>

            {/* Cab */}
            <mesh castShadow position={[0, 0.75, 0.62]}>
                <boxGeometry args={[0.88, 0.48, 0.72]} />
                <meshStandardMaterial color="#113399" roughness={0.4} metalness={0.5} />
            </mesh>

            {/* Windshield tinted cyan */}
            <mesh position={[0, 0.78, 0.99]}>
                <boxGeometry args={[0.76, 0.32, 0.04]} />
                <meshStandardMaterial
                    color="#00d4ff"
                    emissive="#00d4ff"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.75}
                />
            </mesh>

            {/* Side windows */}
            {[-0.455, 0.455].map((wx, i) => (
                <mesh key={i} position={[wx, 0.78, 0.62]}>
                    <boxGeometry args={[0.04, 0.22, 0.55]} />
                    <meshStandardMaterial color="#1aaeff" transparent opacity={0.6} />
                </mesh>
            ))}

            {/* Wheels */}
            {[[-0.48, 0, 0.62], [0.48, 0, 0.62], [-0.48, 0, -0.52], [0.48, 0, -0.52]].map(([wx, , wz], i) => (
                <mesh key={i} position={[wx, 0.18, wz]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.18, 0.18, 0.14, 14]} />
                    <meshStandardMaterial color="#111" metalness={0.7} roughness={0.7} />
                </mesh>
            ))}

            {/* Wheel hubs */}
            {[[-0.48, 0, 0.62], [0.48, 0, 0.62], [-0.48, 0, -0.52], [0.48, 0, -0.52]].map(([wx, , wz], i) => (
                <mesh key={`hub-${i}`} position={[wx, 0.18, wz]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.09, 0.09, 0.16, 8]} />
                    <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
                </mesh>
            ))}

            {/* Headlights */}
            {[-0.3, 0.3].map((hx, i) => (
                <group key={i}>
                    <mesh position={[hx, 0.70, 0.98]}>
                        <sphereGeometry args={[0.075, 8, 8]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
                    </mesh>
                    <pointLight position={[hx, 0.7, 1.5]} color="#e8f4ff" intensity={isPlaying ? 2.5 : 0.5} distance={7} />
                </group>
            ))}

            {/* Tail lights */}
            {[-0.28, 0.28].map((tx, i) => (
                <mesh key={`tail-${i}`} position={[tx, 0.58, -0.96]}>
                    <boxGeometry args={[0.14, 0.1, 0.03]} />
                    <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={1.5} />
                </mesh>
            ))}

            {/* Roof beacon */}
            <mesh position={[0, 1.12, 0.1]}>
                <boxGeometry args={[0.55, 0.07, 0.2]} />
                <meshStandardMaterial color="#ff4466" emissive="#ff4466" emissiveIntensity={isPlaying ? 2.5 : 0.8} />
            </mesh>
            {isPlaying && (
                <pointLight position={[0, 1.3, 0.1]} color="#ff4466" intensity={1.5} distance={4} />
            )}

            {/* USPS logo stripe */}
            <mesh position={[0, 0.42, -0.01]}>
                <boxGeometry args={[0.92, 0.12, 1.91]} />
                <meshStandardMaterial color="#e8ecff" emissive="#8090ff" emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}
