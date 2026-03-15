/**
 * Road — segment between two 3D points.
 * Shows direction arrows for one-way roads.
 * Brighter color scheme to match lighter overall theme.
 */
import { useMemo } from 'react';
import * as THREE from 'three';

export function Road({ from, to, oneWay = false, isExplored, isFinal }) {
    if (!from || !to) return null;

    const { position, rotY, length } = useMemo(() => {
        const s = new THREE.Vector3(...from);
        const e = new THREE.Vector3(...to);
        const dir = e.clone().sub(s);
        const len = dir.length();
        const mid = s.clone().add(e).multiplyScalar(0.5);
        return { position: [mid.x, 0, mid.z], rotY: Math.atan2(dir.x, dir.z), length: len };
    }, [from, to]);

    let roadColor = '#3a4a5e';
    let emissive = '#000';
    let emissiveInt = 0;
    let glowColor = '#00d470';

    if (isFinal) {
        roadColor = '#1a4a2a'; emissive = '#00d470'; emissiveInt = 0.5; glowColor = '#00d470';
    } else if (isExplored) {
        roadColor = '#4a2a0a'; emissive = '#ff9a3c'; emissiveInt = 0.4; glowColor = '#ff9a3c';
    }

    return (
        <group position={position} rotation={[0, rotY, 0]}>
            {/* Road surface */}
            <mesh receiveShadow>
                <boxGeometry args={[2.0, 0.06, length]} />
                <meshStandardMaterial color={roadColor} emissive={emissive} emissiveIntensity={emissiveInt} roughness={0.85} />
            </mesh>

            {/* Curb strips */}
            {[-0.96, 0.96].map((cx, i) => (
                <mesh key={i} position={[cx, 0.035, 0]}>
                    <boxGeometry args={[0.1, 0.07, length]} />
                    <meshStandardMaterial color="#5a6880" roughness={0.9} />
                </mesh>
            ))}

            {/* Center line for plain roads */}
            {!isFinal && !isExplored && !oneWay && (
                <mesh position={[0, 0.045, 0]}>
                    <boxGeometry args={[0.06, 0.01, length * 0.5]} />
                    <meshStandardMaterial color="#4a5870" />
                </mesh>
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
                    <meshStandardMaterial color="#00ff85" emissive="#00ff85" emissiveIntensity={2} transparent opacity={0.5} />
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
