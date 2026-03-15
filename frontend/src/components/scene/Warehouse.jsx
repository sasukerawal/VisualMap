/**
 * Warehouse — the distinctive starting depot location.
 * Golden-colored with a glowing beacon light.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Warehouse({ position }) {
    const beaconRef = useRef();

    useFrame((state) => {
        if (beaconRef.current) {
            const t = state.clock.elapsedTime;
            beaconRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.8;
        }
    });

    return (
        <group position={position}>
            {/* Main building body */}
            <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
                <boxGeometry args={[3.5, 3, 3]} />
                <meshStandardMaterial color="#1a1500" roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Roof */}
            <mesh position={[0, 3.1, 0]}>
                <boxGeometry args={[3.7, 0.2, 3.2]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.4} />
            </mesh>

            {/* Loading bay door */}
            <mesh position={[0, 1.0, 1.51]}>
                <boxGeometry args={[1.8, 2, 0.05]} />
                <meshStandardMaterial color="#2a2200" metalness={0.6} />
            </mesh>
            {/* Door frame */}
            <mesh position={[0, 1.0, 1.53]}>
                <boxGeometry args={[2.0, 2.2, 0.04]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
            </mesh>

            {/* Sign board */}
            <mesh position={[0, 2.8, 1.52]}>
                <boxGeometry args={[2.5, 0.5, 0.05]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
            </mesh>

            {/* Beacon tower */}
            <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
                <meshStandardMaterial color="#888" metalness={0.9} />
            </mesh>

            {/* Beacon light sphere */}
            <mesh position={[0, 5.6, 0]}>
                <sphereGeometry args={[0.25, 12, 12]} />
                <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffd700"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Dynamic point light for beacon */}
            <pointLight
                ref={beaconRef}
                position={[0, 5.6, 0]}
                color="#ffd700"
                intensity={1.5}
                distance={12}
            />
        </group>
    );
}
