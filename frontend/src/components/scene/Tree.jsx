/**
 * Tree — simple low-poly trees scattered in the suburban lawns.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

export function Tree({ position, scale = 1, type = 'deciduous' }) {
    const isPine = type === 'pine';
    const trunkH = isPine ? 0.6 : 0.8;
    const trunkW = 0.15;

    // Slight variations in green
    const colorSeed = Math.abs(position[0] + position[2]) % 3;
    const leavesColor = isPine ? '#2d4c1e' : (colorSeed < 1 ? '#4a7c2f' : colorSeed < 2 ? '#548c35' : '#649e41');

    return (
        <group position={position} scale={[scale, scale, scale]}>
            {/* Trunk */}
            <mesh position={[0, trunkH / 2, 0]} castShadow>
                <cylinderGeometry args={[trunkW, trunkW, trunkH, 5]} />
                <meshStandardMaterial color="#4a3623" roughness={0.9} />
            </mesh>
            {/* Leaves */}
            {isPine ? (
                <mesh position={[0, trunkH + 0.8, 0]} castShadow>
                    <coneGeometry args={[0.5, 2.0, 5]} />
                    <meshStandardMaterial color={leavesColor} roughness={0.8} />
                </mesh>
            ) : (
                <mesh position={[0, trunkH + 0.6, 0]} castShadow>
                    <dodecahedronGeometry args={[0.7, 1]} />
                    <meshStandardMaterial color={leavesColor} roughness={0.8} />
                </mesh>
            )}
        </group>
    );
}
