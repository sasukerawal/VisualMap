/**
 * DeliveryPin — floats above each house.
 * Click to toggle as delivery destination.
 */
import { memo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';

const PIN_BASE_Y = 3.2;

export const DeliveryPin = memo(function DeliveryPin({ nodeId, position, label, isSelected, isOnPath, showLabel }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    const { addDestination, removeDestination, isPlaying, deliveredNodes } = useStore(
        (s) => ({
            addDestination: s.addDestination,
            removeDestination: s.removeDestination,
            isPlaying: s.isPlaying,
            deliveredNodes: s.deliveredNodes,
        }),
        shallow
    );

    const isDelivered = deliveredNodes.includes(nodeId);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime + position[0] * 0.3;
        meshRef.current.position.y = PIN_BASE_Y + 0.4 + Math.sin(t * 2.2) * 0.1;
    });

    const handleClick = (e) => {
        e.stopPropagation();
        if (isPlaying) return;
        if (isSelected) removeDestination(nodeId);
        else addDestination(nodeId);
    };

    let pinColor = '#4a90e8';
    let pinEmissive = '#3070c8';
    if (isDelivered) {
        pinColor = '#2ecc71';
        pinEmissive = '#27ae60';
    } else if (isSelected) {
        pinColor = '#f39c12';
        pinEmissive = '#e67e22';
    } else if (isOnPath) {
        pinColor = '#2ecc71';
        pinEmissive = '#27ae60';
    } else if (hovered) {
        pinColor = '#74b9ff';
        pinEmissive = '#5a9de8';
    }

    return (
        <group position={[position[0], 0, position[2]]}>
            <mesh position={[0, PIN_BASE_Y + 0.15, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
                <meshStandardMaterial color="#8ea2bf" metalness={0.6} roughness={0.3} />
            </mesh>

            <mesh
                ref={meshRef}
                position={[0, PIN_BASE_Y + 0.4, 0]}
                onClick={handleClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'default';
                }}
            >
                <sphereGeometry args={[isSelected ? 0.32 : 0.24, 14, 14]} />
                <meshStandardMaterial
                    color={pinColor}
                    emissive={pinEmissive}
                    emissiveIntensity={isSelected ? 0.9 : 0.4}
                    roughness={0.2}
                    metalness={0.3}
                />
            </mesh>

            {isDelivered && (
                <mesh position={[0, PIN_BASE_Y + 0.4, 0]}>
                    <torusGeometry args={[0.42, 0.05, 8, 18]} />
                    <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={1.2} />
                </mesh>
            )}

            {isSelected && !isDelivered && (
                <mesh position={[0, PIN_BASE_Y + 0.4, 0]}>
                    <torusGeometry args={[0.45, 0.055, 8, 18]} />
                    <meshStandardMaterial color="#f39c12" emissive="#f39c12" emissiveIntensity={0.9} />
                </mesh>
            )}

            {(showLabel || hovered || isSelected) && (
                <Html
                    center
                    distanceFactor={20}
                    position={[0, PIN_BASE_Y + 1.1, 0]}
                    style={{
                        background: isSelected ? 'rgba(243,156,18,0.14)' : 'rgba(12, 18, 30, 0.78)',
                        border: `1px solid ${
                            isSelected ? 'rgba(243,156,18,0.45)' : 'rgba(148,163,184,0.24)'
                        }`,
                        borderRadius: '10px',
                        padding: '6px 10px',
                        fontSize: '10px',
                        color: isSelected ? '#ffd08a' : '#d6e4ff',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        fontWeight: 600,
                        boxShadow: '0 12px 26px rgba(0,0,0,0.22)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    {isDelivered ? 'Delivered: ' : isSelected ? 'Stop: ' : ''}
                    {label}
                </Html>
            )}
        </group>
    );
});
