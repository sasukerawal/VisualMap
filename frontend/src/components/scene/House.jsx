/**
 * House — a colorful low-poly house with peaked roof.
 * Each house has a unique color from a curated palette.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

// 30 realistic suburban house colors (siding, brick, stucco)
const HOUSE_COLORS = [
    '#e1d7c9', '#d4ceb8', '#bcc4cb', '#a4b1bb', '#c5bbae',
    '#b4a390', '#c2c9d1', '#9ca8b5', '#d6d1c4', '#e8e4db',
    '#9ea498', '#8b968c', '#a69076', '#bdab94', '#dcd8ce',
    '#c4b7a6', '#d1ccc0', '#b9b0a2', '#828c98', '#666666',
    '#b0a89f', '#c9cfd4', '#d8d4cb', '#8b7d6b', '#a69f95',
    '#e2dfd8', '#c0c5c1', '#9a8f82', '#b3b8b1', '#d4ccbf'
];

export function House({ position, colorIndex, scale = [1, 1, 1] }) {
    const wallColor = useMemo(() => HOUSE_COLORS[colorIndex % HOUSE_COLORS.length], [colorIndex]);
    const roofColor = useMemo(() => {
        // Slightly darken roof
        const c = new THREE.Color(wallColor);
        c.multiplyScalar(0.65);
        return `#${c.getHexString()}`;
    }, [wallColor]);

    const [sw, sh, sd] = scale;
    const bW = 2.2 * sw;
    const bH = 1.6 * sh;
    const bD = 2.2 * sd;

    return (
        <group position={position}>
            {/* Foundation / base */}
            <mesh receiveShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[bW + 0.2, 0.12, bD + 0.2]} />
                <meshStandardMaterial color="#c8c0b0" roughness={0.9} />
            </mesh>

            {/* Main wall body */}
            <mesh castShadow receiveShadow position={[0, bH / 2, 0]}>
                <boxGeometry args={[bW, bH, bD]} />
                <meshStandardMaterial color={wallColor} roughness={0.7} metalness={0.05} />
            </mesh>

            {/* Peaked roof */}
            <mesh castShadow position={[0, bH + 0.55, 0]}>
                <coneGeometry args={[bW * 0.82, 1.1, 4]} />
                <meshStandardMaterial color={roofColor} roughness={0.6} />
            </mesh>

            {/* Door */}
            <mesh position={[0, 0.45, bD / 2 + 0.01]}>
                <boxGeometry args={[0.45, 0.7, 0.02]} />
                <meshStandardMaterial color="#4a3020" roughness={0.8} />
            </mesh>

            {/* Front window */}
            <mesh position={[bW * 0.26, 0.8, bD / 2 + 0.01]}>
                <boxGeometry args={[0.4, 0.35, 0.02]} />
                <meshStandardMaterial color="#99d4ff" emissive="#99d4ff" emissiveIntensity={0.3} transparent opacity={0.8} />
            </mesh>

            {/* Side window left */}
            <mesh position={[-bW / 2 - 0.01, 0.8, 0]}>
                <boxGeometry args={[0.02, 0.35, 0.35]} />
                <meshStandardMaterial color="#99d4ff" emissive="#99d4ff" emissiveIntensity={0.25} transparent opacity={0.75} />
            </mesh>
        </group>
    );
}
