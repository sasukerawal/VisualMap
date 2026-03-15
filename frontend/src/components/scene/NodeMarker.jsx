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

    let color = '#2a3555';
    let emissive = '#2a3555';
    let emissiveIntensity = 0;
    let size = 0.2;

    if (isOnPath) {
        color = '#00ff85';
        emissive = '#00ff85';
        emissiveIntensity = 1;
        size = 0.28;
    } else if (isExplored) {
        color = '#ff7a2b';
        emissive = '#ff7a2b';
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
                        color: isOnPath ? '#00ff85' : '#8892b0',
                        background: 'rgba(10,12,19,0.7)',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                    }}
                    position={[0, 0.6, 0]}
                >
                    {nodeId}
                </Html>
            )}
        </group>
    );
}
