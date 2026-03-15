/**
 * NodeMarker — renders intersection nodes as glowing dots.
 * Highlights explored and path nodes with different colors.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export function NodeMarker({ nodeId, position, label, isExplored, isOnPath }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current && (isExplored || isOnPath)) {
            const t = state.clock.elapsedTime + position[0];
            meshRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
        }
    });

    let color = '#aabcc4';
    let emissive = '#1a2035';
    let emissiveIntensity = 0;
    let size = 0.2;

    if (isOnPath) {
        color = '#2ecc71';
        emissive = '#27ae60';
        emissiveIntensity = 1;
        size = 0.28;
    } else if (isExplored) {
        color = '#3a7dc8';
        emissive = '#2e6bb3';
        emissiveIntensity = 0.7;
        size = 0.24;
    }

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 10, 10]} />
                <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={emissiveIntensity}
                />
            </mesh>

            {label && (
                <Html
                    center
                    distanceFactor={18}
                    style={{
                        fontSize: '9px',
                        color: isOnPath ? '#2ecc71' : isExplored ? '#3a7dc8' : '#8892b0',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    position={[0, 0.6, 0]}
                >
                    {nodeId}
                </Html>
            )}
        </group>
    );
}
