import { memo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const NodeMarker = memo(function NodeMarker({ nodeId, position, label, isExplored, isOnPath, isActive }) {
    const meshRef = useRef();
    const haloRef = useRef();
    const [hovered, setHovered] = useState(false);
    const tmpScaleRef = useRef(new THREE.Vector3(1, 1, 1));
    const haloScaleRef = useRef(new THREE.Vector3(1, 1, 1));

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime + position[0];
        const heartbeat = isExplored || isOnPath ? Math.sin(t * 3) * 0.12 : 0;
        const targetScale = hovered ? 1.5 : 1.0;
        const currentScale = 1 + heartbeat;
        const s = targetScale * currentScale;
        tmpScaleRef.current.set(s, s, s);
        meshRef.current.scale.lerp(tmpScaleRef.current, delta * 10);

        if (haloRef.current) {
            const a = isActive ? 1 : 0;
            const pulse = 1 + (isActive ? Math.sin(t * 4.5) * 0.07 : 0);
            haloScaleRef.current.set(pulse, 1, pulse);
            haloRef.current.scale.lerp(haloScaleRef.current, delta * 8);
            haloRef.current.material.opacity = 0.15 + a * 0.35;
        }
    });

    let color = '#aabcc4';
    let emissive = '#101827';
    let emissiveIntensity = 0;
    let size = 0.2;

    if (isOnPath) {
        color = '#2ecc71';
        emissive = '#27ae60';
        emissiveIntensity = 1;
        size = 0.28;
    } else if (isExplored) {
        color = '#5b9cf6';
        emissive = '#3a7dc8';
        emissiveIntensity = 0.7;
        size = 0.24;
    } else if (isActive) {
        color = '#fbbf24';
        emissive = '#fbbf24';
        emissiveIntensity = 1.1;
        size = 0.26;
    }

    return (
        <group
            position={position}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
                document.body.style.cursor = 'auto';
            }}
        >
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 10, 10]} />
                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
            </mesh>

            <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry args={[size * 2.2, size * 3.2, 24]} />
                <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.8} transparent opacity={isActive ? 0.5 : 0} />
            </mesh>

            {label && (
                <Html
                    center
                    distanceFactor={18}
                    position={[0, 0.65, 0]}
                    style={{
                        fontSize: '10px',
                        color: isOnPath ? '#86efac' : isExplored ? '#9fd0ff' : '#9fb0ca',
                        background: 'rgba(12, 18, 30, 0.76)',
                        border: '1px solid rgba(148,163,184,0.22)',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 12px 26px rgba(0,0,0,0.22)',
                        backdropFilter: 'blur(10px)',
                        transform: `translateY(-10px) scale(${hovered ? 1.12 : 1.0})`,
                        transition: 'transform 0.2s ease-out',
                    }}
                >
                    {label}
                </Html>
            )}
        </group>
    );
});
