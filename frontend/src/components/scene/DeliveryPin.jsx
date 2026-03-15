/**
 * DeliveryPin — floats on top of each house (house height ~2.7 units).
 * Click to toggle as delivery destination.
 */
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import useStore from '../../store/useStore';

// Height above ground at top of house (wall 1.6 + roof ~1.1 = 2.7 + stem)
const PIN_BASE_Y = 3.2;

export function DeliveryPin({ nodeId, position, label, isSelected, isOnPath, showLabel }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    const { addDestination, removeDestination, isPlaying, deliveredNodes } = useStore();

    const isDelivered = deliveredNodes.includes(nodeId);

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.elapsedTime + position[0] * 0.3;
            meshRef.current.position.y = PIN_BASE_Y + 0.4 + Math.sin(t * 2.2) * 0.1;
        }
    });

    const handleClick = (e) => {
        e.stopPropagation();
        if (isPlaying) return;
        if (isSelected) removeDestination(nodeId);
        else addDestination(nodeId);
    };

    let pinColor = '#4a90e8';
    let pinEmissive = '#3070c8';
    if (isDelivered) { pinColor = '#2ecc71'; pinEmissive = '#27ae60'; }
    else if (isSelected) { pinColor = '#f39c12'; pinEmissive = '#e67e22'; }
    else if (isOnPath) { pinColor = '#2ecc71'; pinEmissive = '#27ae60'; }
    else if (hovered) { pinColor = '#74b9ff'; pinEmissive = '#5a9de8'; }

    return (
        <group position={[position[0], 0, position[2]]}>
            {/* Thin stem going from roof peak up to ball */}
            <mesh position={[0, PIN_BASE_Y + 0.15, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
                <meshStandardMaterial color="#888" metalness={0.6} />
            </mesh>

            {/* Pin ball */}
            <mesh
                ref={meshRef}
                position={[0, PIN_BASE_Y + 0.4, 0]}
                onClick={handleClick}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
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

            {/* Delivered ring */}
            {isDelivered && (
                <mesh position={[0, PIN_BASE_Y + 0.4, 0]}>
                    <torusGeometry args={[0.42, 0.05, 8, 18]} />
                    <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={1.2} />
                </mesh>
            )}

            {/* Selected ring */}
            {isSelected && !isDelivered && (
                <mesh position={[0, PIN_BASE_Y + 0.4, 0]}>
                    <torusGeometry args={[0.45, 0.055, 8, 18]} />
                    <meshStandardMaterial color="#f39c12" emissive="#f39c12" emissiveIntensity={0.9} />
                </mesh>
            )}

            {/* Label chip */}
            {(showLabel || hovered || isSelected) && (
                <Html
                    center
                    distanceFactor={20}
                    position={[0, PIN_BASE_Y + 1.1, 0]}
                    style={{
                        background: isSelected ? 'rgba(243,156,18,0.18)' : 'rgba(255,255,255,0.88)',
                        border: `1.5px solid ${isSelected ? '#f39c12' : '#aab'}`,
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        color: isSelected ? '#e67e22' : '#223',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        fontWeight: 600,
                        boxShadow: '0 1px 5px rgba(0,0,0,0.12)',
                    }}
                >
                    {isDelivered ? '✓ ' : isSelected ? '📦 ' : ''}{label}
                </Html>
            )}
        </group>
    );
}
