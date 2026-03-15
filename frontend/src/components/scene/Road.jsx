/**
 * Road — segment between two 3D points.
 * Shows direction arrows for one-way roads.
 * Brighter color scheme to match lighter overall theme.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

export function Road({ from, to, oneWay = false, isExplored, isFinal, isDriveway = false }) {
    if (!from || !to) return null;

    const { position, rotY, length } = useMemo(() => {
        const s = new THREE.Vector3(...from);
        const e = new THREE.Vector3(...to);
        const dir = e.clone().sub(s);
        const len = dir.length();
        const mid = s.clone().add(e).multiplyScalar(0.5);
        return { position: [mid.x, 0, mid.z], rotY: Math.atan2(dir.x, dir.z), length: len };
    }, [from, to]);

    let roadColor = '#2c323c'; // realistic dark asphalt
    let emissive = '#000';
    let emissiveInt = 0;
    let glowColor = '#00d470';

    if (isDriveway) {
        roadColor = '#a0a8bb'; // Flat concrete color for driveways
    } else if (isFinal) {
        roadColor = '#1a4a2a'; emissive = '#2ecc71'; emissiveInt = 0.5; glowColor = '#2ecc71';
    } else if (isExplored) {
        roadColor = '#1a3a5a'; emissive = '#3a7dc8'; emissiveInt = 0.4; glowColor = '#3a7dc8';
    }

    // Grass is up to y=0.07. Driveways must sit on top.
    const baseY = isDriveway ? 0.08 : 0;
    const roadWidth = isDriveway ? 1.2 : 2.0;

    return (
        <group position={[position[0], baseY, position[2]]} rotation={[0, rotY, 0]}>
            {/* Road surface */}
            <mesh receiveShadow>
                <boxGeometry args={[roadWidth, 0.06, length]} />
                <meshStandardMaterial color={roadColor} emissive={emissive} emissiveIntensity={emissiveInt} roughness={0.85} />
            </mesh>


            {/* Curb strips (slightly darker/grayer) */}
            {!isDriveway && [-0.96, 0.96].map((cx, i) => (
                <mesh key={i} position={[cx, 0.035, 0]}>
                    <boxGeometry args={[0.1, 0.07, length]} />
                    <meshStandardMaterial color="#404854" roughness={0.9} />
                </mesh>
            ))}

            {/* Solid white edge lines for realistic roads */}
            {!isDriveway && !isExplored && !isFinal && [-0.8, 0.8].map((ex, i) => (
                <mesh key={i} position={[ex, 0.045, 0]}>
                    <boxGeometry args={[0.04, 0.01, length]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} roughness={0.9} />
                </mesh>
            ))}

            {/* Dashed center line for two-way roads (not one-way) */}
            {!isDriveway && !isFinal && !isExplored && !oneWay && (
                <group position={[0, 0.045, 0]}>
                    {Array.from({ length: Math.floor(length / 1.5) }).map((_, i, arr) => {
                        const spacing = 1.5;
                        const zOff = (i - arr.length / 2) * spacing + spacing / 2;
                        return (
                            <mesh key={i} position={[0, 0, zOff]}>
                                <boxGeometry args={[0.06, 0.01, 0.6]} />
                                <meshStandardMaterial color="#fcd730" roughness={0.9} />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* Glow strip for active roads */}
            {(isFinal || isExplored) && (
                <mesh position={[0, 0.075, 0]}>
                    <boxGeometry args={[0.3, 0.02, length * 0.97]} />
                    <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={isFinal ? 1.8 : 1.0} transparent opacity={0.9} />
                </mesh>
            )}

            {/* Edge glow lines for final path */}
            {isFinal && [-0.65, 0.65].map((ex, i) => (
                <mesh key={i} position={[ex, 0.065, 0]}>
                    <boxGeometry args={[0.07, 0.01, length]} />
                    <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={2} transparent opacity={0.6} />
                </mesh>
            ))}

            {/* One-way arrows */}
            {oneWay && !isFinal && (
                <>
                    {[-length * 0.25, length * 0.25].map((offset, i) => (
                        <mesh key={i} position={[0, 0.05, offset]} rotation={[Math.PI / 2, 0, 0]}>
                            <coneGeometry args={[0.18, 0.4, 3]} />
                            <meshStandardMaterial color="#e8a020" emissive="#e8a020" emissiveIntensity={0.7} />
                        </mesh>
                    ))}
                </>
            )}
        </group>
    );
}
