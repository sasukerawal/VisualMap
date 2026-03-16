/**
 * House — a colorful low-poly house with peaked roof.
 * Each house has a unique color from a curated palette.
 */
import { memo, useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';

const HOUSE_COLORS = [
    '#e2e8f0', // Mist
    '#cbd5e1', // Slate
    '#94a3b8', // Blue Grey
    '#64748b', // Deep Slate
    '#7dd3fc', // Sky
    '#fcd34d', // Amber
    '#fda4af', // Rose
    '#bef264', // Lime
    '#fdba74', // Peach
    '#a5b4fc', // Indigo
];

export const House = memo(function House({ nodeId, position, colorIndex, scale: propScale = [1, 1, 1], interactive = true }) {
    const { addDestination, destinations, removeDestination } = useStore(
        (s) => ({
            addDestination: s.addDestination,
            removeDestination: s.removeDestination,
            destinations: s.destinations,
        }),
        shallow
    );
    const groupRef = useRef();
    const ringRef = useRef();
    const tmpScaleRef = useRef(new THREE.Vector3(1, 1, 1));
    const [hovered, setHovered] = useState(false);

    const isSelected = destinations.includes(nodeId);

    const wallColor = useMemo(() => HOUSE_COLORS[colorIndex % HOUSE_COLORS.length], [colorIndex]);
    const roofColor = useMemo(() => {
        const c = new THREE.Color(wallColor);
        c.multiplyScalar(0.65);
        return `#${c.getHexString()}`;
    }, [wallColor]);

    const [sw, sh, sd] = propScale;
    const bW = 2.2 * sw;
    const bH = 1.6 * sh;
    const bD = 2.2 * sd;

    // Smooth hover scaling
    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const targetScale = hovered ? 1.08 : 1.0;
        tmpScaleRef.current.set(targetScale, targetScale, targetScale);
        groupRef.current.scale.lerp(tmpScaleRef.current, delta * 10);

        if (ringRef.current) {
            const target = isSelected ? 1 : hovered ? 0.7 : 0.25;
            ringRef.current.material.opacity = THREE.MathUtils.lerp(ringRef.current.material.opacity, target, delta * 10);
            ringRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
                ringRef.current.material.emissiveIntensity,
                isSelected ? 1.1 : hovered ? 0.6 : 0.2,
                delta * 10
            );
        }
    });

    const handleClick = (e) => {
        if (!interactive) return;
        e.stopPropagation();
        if (isSelected) {
            removeDestination(nodeId);
        } else {
            addDestination(nodeId);
        }
    };

    return (
        <group
            ref={groupRef}
            position={position}
            onClick={interactive ? handleClick : undefined}
            onPointerOver={interactive ? (e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'pointer';
            } : undefined}
            onPointerOut={interactive ? (e) => {
                e.stopPropagation();
                setHovered(false);
                document.body.style.cursor = 'auto';
            } : undefined}
        >
            {/* Selection / hover ring */}
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
                <ringGeometry args={[bW * 0.52, bW * 0.68, 32]} />
                <meshStandardMaterial
                    color={isSelected ? '#00ff85' : '#5b9cf6'}
                    emissive={isSelected ? '#00ff85' : '#22d4e8'}
                    emissiveIntensity={isSelected ? 1.1 : 0.4}
                    transparent
                    opacity={isSelected ? 1 : hovered ? 0.7 : 0.25}
                    roughness={0.5}
                />
            </mesh>

            {/* Soft contact shadow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[bW * 0.55, 24]} />
                <meshStandardMaterial color="#000" transparent opacity={0.18} />
            </mesh>

            {/* Foundation / base */}
            <mesh receiveShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[bW + 0.2, 0.12, bD + 0.2]} />
                <meshStandardMaterial color={isSelected ? "#00ff85" : "#c8c0b0"} roughness={0.95} />
            </mesh>

            {/* Main wall body */}
            <mesh castShadow receiveShadow position={[0, bH / 2, 0]}>
                <boxGeometry args={[bW, bH, bD]} />
                <meshStandardMaterial
                    color={wallColor}
                    roughness={0.7}
                    metalness={0.05}
                    emissive={isSelected ? "#00ff85" : hovered ? "#223" : "#000000"}
                    emissiveIntensity={isSelected ? 0.22 : hovered ? 0.06 : 0}
                />
            </mesh>

            {/* Peaked roof */}
            <mesh castShadow position={[0, bH + 0.55, 0]}>
                <coneGeometry args={[bW * 0.82, 1.1, 4]} />
                <meshStandardMaterial color={roofColor} roughness={0.55} metalness={0.05} />
            </mesh>

            {/* Chimney */}
            <mesh castShadow position={[bW * 0.25, bH + 0.95, -bD * 0.15]}>
                <boxGeometry args={[0.25, 0.55, 0.25]} />
                <meshStandardMaterial color="#334155" roughness={0.9} />
            </mesh>

            {/* Porch */}
            <mesh receiveShadow position={[0, 0.16, bD / 2 + 0.22]}>
                <boxGeometry args={[bW * 0.55, 0.08, 0.35]} />
                <meshStandardMaterial color={isSelected ? 'rgba(0,255,133,1)' : '#a8b3c4'} roughness={0.9} />
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

            {/* Side window right */}
            <mesh position={[bW / 2 + 0.01, 0.8, 0]}>
                <boxGeometry args={[0.02, 0.35, 0.35]} />
                <meshStandardMaterial color="#99d4ff" emissive="#99d4ff" emissiveIntensity={0.2} transparent opacity={0.7} />
            </mesh>
        </group>
    );
});
