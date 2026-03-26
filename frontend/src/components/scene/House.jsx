/**
 * House — low-poly but more realistic + varied.
 * Uses deterministic per-node variation so the town doesn't "shuffle" on re-render.
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

function hashStringToUint32(str) {
    // Simple deterministic hash (FNV-1a-ish).
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function makeRng(seedUint32) {
    // xorshift32
    let s = seedUint32 || 1;
    return () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return ((s >>> 0) / 4294967296);
    };
}

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

    const variation = useMemo(() => {
        const seed = hashStringToUint32(`${nodeId || ''}|${colorIndex}`);
        const rand = makeRng(seed);
        const variant = Math.floor(rand() * 4); // 0..3

        // Keep rotation mostly "grid-aligned" to reduce visual noise.
        const snapped = Math.round(rand() * 3) * (Math.PI / 2);
        const jitter = (rand() - 0.5) * 0.10;

        return {
            variant,
            rotY: snapped + jitter,
            wMul: 0.88 + rand() * 0.32,
            hMul: 0.86 + rand() * 0.38,
            dMul: 0.88 + rand() * 0.30,
            accent: rand(),
        };
    }, [nodeId, colorIndex]);

    const roofColor = useMemo(() => {
        const c = new THREE.Color(wallColor);
        c.multiplyScalar(0.62 + variation.accent * 0.10);
        return `#${c.getHexString()}`;
    }, [wallColor, variation.accent]);

    const trimColor = useMemo(() => {
        const c = new THREE.Color(wallColor);
        c.lerp(new THREE.Color('#0f172a'), 0.55);
        return `#${c.getHexString()}`;
    }, [wallColor]);

    const windowColor = useMemo(() => (hovered || isSelected ? '#b9ecff' : '#99d4ff'), [hovered, isSelected]);

    const [sw, sh, sd] = propScale;
    const bW = 2.2 * sw * variation.wMul;
    const bH = 1.6 * sh * variation.hMul;
    const bD = 2.2 * sd * variation.dMul;

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

    const bodyMat = useMemo(() => ({
        color: wallColor,
        roughness: 0.72,
        metalness: 0.05,
        emissive: isSelected ? '#00ff85' : hovered ? '#223' : '#000000',
        emissiveIntensity: isSelected ? 0.22 : hovered ? 0.06 : 0,
    }), [wallColor, isSelected, hovered]);

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={[0, variation.rotY, 0]}
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

            {/* House variants (deterministic) */}
            {variation.variant === 0 && (
                <>
                    {/* Modern: flat roof + big glass */}
                    <mesh castShadow receiveShadow position={[0, bH / 2, 0]}>
                        <boxGeometry args={[bW * 1.05, bH, bD]} />
                        <meshStandardMaterial {...bodyMat} />
                    </mesh>

                    <mesh castShadow receiveShadow position={[0, bH + 0.18, 0]}>
                        <boxGeometry args={[bW * 1.1, 0.22, bD * 1.04]} />
                        <meshStandardMaterial color={roofColor} roughness={0.6} metalness={0.06} />
                    </mesh>

                    <mesh position={[bW * 0.48, bH * 0.65, 0]}>
                        <boxGeometry args={[0.05, bH * 0.55, bD * 0.55]} />
                        <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={0.35} transparent opacity={0.65} />
                    </mesh>

                    <mesh position={[0, 0.45, bD / 2 + 0.01]}>
                        <boxGeometry args={[0.42, 0.7, 0.02]} />
                        <meshStandardMaterial color={trimColor} roughness={0.85} />
                    </mesh>
                </>
            )}

            {variation.variant === 1 && (
                <>
                    {/* Classic: peaked roof + chimney */}
                    <mesh castShadow receiveShadow position={[0, bH / 2, 0]}>
                        <boxGeometry args={[bW, bH, bD]} />
                        <meshStandardMaterial {...bodyMat} />
                    </mesh>

                    <mesh castShadow position={[0, bH + 0.55, 0]}>
                        <coneGeometry args={[bW * 0.82, 1.1, 4]} />
                        <meshStandardMaterial color={roofColor} roughness={0.55} metalness={0.05} />
                    </mesh>

                    <mesh castShadow position={[bW * 0.25, bH + 0.95, -bD * 0.15]}>
                        <boxGeometry args={[0.25, 0.55, 0.25]} />
                        <meshStandardMaterial color="#334155" roughness={0.9} />
                    </mesh>

                    <mesh receiveShadow position={[0, 0.16, bD / 2 + 0.22]}>
                        <boxGeometry args={[bW * 0.55, 0.08, 0.35]} />
                        <meshStandardMaterial color={isSelected ? '#00ff85' : '#a8b3c4'} roughness={0.9} />
                    </mesh>

                    <mesh position={[0, 0.45, bD / 2 + 0.01]}>
                        <boxGeometry args={[0.45, 0.7, 0.02]} />
                        <meshStandardMaterial color="#4a3020" roughness={0.8} />
                    </mesh>

                    <mesh position={[bW * 0.26, 0.8, bD / 2 + 0.01]}>
                        <boxGeometry args={[0.4, 0.35, 0.02]} />
                        <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={0.3} transparent opacity={0.8} />
                    </mesh>
                </>
            )}

            {variation.variant === 2 && (
                <>
                    {/* Suburban: wider + garage */}
                    <mesh castShadow receiveShadow position={[-0.25, bH / 2, 0]}>
                        <boxGeometry args={[bW * 1.05, bH, bD]} />
                        <meshStandardMaterial {...bodyMat} />
                    </mesh>

                    <mesh castShadow receiveShadow position={[bW * 0.62, bH * 0.42, 0]}>
                        <boxGeometry args={[bW * 0.55, bH * 0.82, bD * 0.92]} />
                        <meshStandardMaterial color="#9aa7b8" roughness={0.95} />
                    </mesh>

                    <mesh castShadow position={[-0.25, bH + 0.55, 0]}>
                        <coneGeometry args={[bW * 0.95, 1.05, 4]} />
                        <meshStandardMaterial color={roofColor} roughness={0.58} metalness={0.05} />
                    </mesh>

                    <mesh position={[0, 0.45, bD / 2 + 0.01]}>
                        <boxGeometry args={[0.42, 0.7, 0.02]} />
                        <meshStandardMaterial color={trimColor} roughness={0.85} />
                    </mesh>

                    {/* Garage door */}
                    <mesh position={[bW * 0.62, 0.42, bD / 2 + 0.01]}>
                        <boxGeometry args={[bW * 0.42, 0.64, 0.02]} />
                        <meshStandardMaterial color="#6b7280" roughness={0.95} />
                    </mesh>

                    <mesh position={[-bW * 0.15, 0.8, bD / 2 + 0.01]}>
                        <boxGeometry args={[0.46, 0.35, 0.02]} />
                        <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={0.28} transparent opacity={0.78} />
                    </mesh>
                </>
            )}

            {variation.variant === 3 && (
                <>
                    {/* Apartment block: taller + window grid */}
                    <mesh castShadow receiveShadow position={[0, bH * 0.78, 0]}>
                        <boxGeometry args={[bW * 0.85, bH * 1.75, bD * 0.9]} />
                        <meshStandardMaterial {...bodyMat} />
                    </mesh>

                    <mesh castShadow receiveShadow position={[0, bH * 1.7 + 0.16, 0]}>
                        <boxGeometry args={[bW * 0.9, 0.22, bD * 0.92]} />
                        <meshStandardMaterial color={roofColor} roughness={0.6} metalness={0.06} />
                    </mesh>

                    {Array.from({ length: 6 }).map((_, i) => (
                        <mesh key={i} position={[bW * 0.36, 0.55 + i * 0.36, 0]}>
                            <boxGeometry args={[0.05, 0.18, 0.28]} />
                            <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={0.22} transparent opacity={0.7} />
                        </mesh>
                    ))}

                    <mesh position={[0, 0.55, bD / 2 + 0.01]}>
                        <boxGeometry args={[0.42, 0.82, 0.02]} />
                        <meshStandardMaterial color={trimColor} roughness={0.92} />
                    </mesh>
                </>
            )}

            {/* Side windows (common small detail so all variants have depth) */}
            <mesh position={[-bW / 2 - 0.01, 0.8, 0]}>
                <boxGeometry args={[0.02, 0.35, 0.35]} />
                <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={0.2} transparent opacity={0.7} />
            </mesh>
            <mesh position={[bW / 2 + 0.01, 0.8, 0]}>
                <boxGeometry args={[0.02, 0.35, 0.35]} />
                <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={0.18} transparent opacity={0.7} />
            </mesh>
        </group>
    );
});
