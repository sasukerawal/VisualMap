/**
 * Road — segment between two 3D points.
 * Shows direction arrows for one-way roads.
 * Brighter color scheme to match lighter overall theme.
 */
import { memo, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export const Road = memo(function Road({ from, to, oneWay = false, isExplored, isFinal, isActiveRelaxed, isDriveway = false, roadType, speedLimit, uiOverlayOpen = false }) {
    const [hovered, setHovered] = useState(false);
    if (!from || !to) return null;

    const { position, rotY, length } = useMemo(() => {
        const s = new THREE.Vector3(...from);
        const e = new THREE.Vector3(...to);
        const dir = e.clone().sub(s);
        const len = dir.length();
        const mid = s.clone().add(e).multiplyScalar(0.5);
        return { position: [mid.x, 0, mid.z], rotY: Math.atan2(dir.x, dir.z), length: len };
    }, [from, to]);

    let roadColor = '#1a1f26'; // deeper asphalt
    if (roadType === 'main') roadColor = '#12181d';
    if (roadType === 'alley') roadColor = '#2a201a';

    let emissive = '#000';
    let emissiveInt = 0;
    let glowColor = '#6366f1'; // premium indigo for exploration

    if (isDriveway) {
        roadColor = '#94a3b8';
    } else if (isFinal) {
        roadColor = '#064e3b'; emissive = '#10b981'; emissiveInt = 0.6; glowColor = '#34d399';
    } else if (isExplored) {
        roadColor = '#1e1b4b'; emissive = '#6366f1'; emissiveInt = 0.45; glowColor = '#818cf8';
    }

    const baseY = isDriveway ? 0.08 : 0;
    const roadWidth = isDriveway ? 1.2 : 2.2; // Slightly wider main roads

    // Calculate transit time for display
    const transitTime = (length / (speedLimit || 1)).toFixed(1);

    return (
        <group
            position={[position[0], baseY, position[2]]}
            rotation={[0, rotY, 0]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* Road surface */}
            <mesh receiveShadow>
                <boxGeometry args={[roadWidth, 0.06, length]} />
                <meshStandardMaterial color={roadColor} emissive={emissive} emissiveIntensity={emissiveInt} roughness={0.9} />
            </mesh>

            {/* RELAXATION HIGHLIGHT (Active Search Pulse) */}
            {isActiveRelaxed && (
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[roadWidth * 0.9, 0.08, length * 1.02]} />
                    <meshStandardMaterial
                        color="#fbbf24"
                        emissive="#fbbf24"
                        emissiveIntensity={2}
                        transparent
                        opacity={0.7}
                    />
                </mesh>
            )}

            {/* DATA LABEL (Transit Time Insight) */}
            {(isActiveRelaxed || hovered) && !isDriveway && !uiOverlayOpen && (
                <Html position={[0, 1.5, 0]} center distanceFactor={15}>
                    <div style={{
                        background: 'rgba(7, 10, 20, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: isActiveRelaxed ? '#fbbf24' : '#fff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: isActiveRelaxed ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
                        fontSize: '9px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        boxShadow: isActiveRelaxed ? '0 0 15px rgba(251,191,36,0.3)' : '0 4px 12px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        transform: 'translateY(-10px)'
                    }}>
                        <div style={{ opacity: 0.6, fontSize: '7px', textTransform: 'uppercase' }}>{isActiveRelaxed ? "Analyzing Edge..." : "Road Data"}</div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span>⚡ {speedLimit}km/h</span>
                            <span style={{ color: '#818cf8' }}>⏱️ {transitTime}s</span>
                        </div>
                    </div>
                </Html>
            )}

            {/* Realistic Curb/Side Strips */}
            {!isDriveway && [-roadWidth / 2 + 0.05, roadWidth / 2 - 0.05].map((cx, i) => (
                <mesh key={i} position={[cx, 0.035, 0]}>
                    <boxGeometry args={[0.08, 0.08, length]} />
                    <meshStandardMaterial color="#334155" roughness={1} />
                </mesh>
            ))}

            {/* Solid white edge lines */}
            {!isDriveway && !isExplored && !isFinal && !isActiveRelaxed && [-roadWidth / 2 + 0.25, roadWidth / 2 - 0.25].map((ex, i) => (
                <mesh key={i} position={[ex, 0.045, 0]}>
                    <boxGeometry args={[0.05, 0.01, length]} />
                    <meshStandardMaterial color="#cbd5e1" roughness={1} />
                </mesh>
            ))}

            {/* Dashed center line */}
            {!isDriveway && !isFinal && !isExplored && !isActiveRelaxed && !oneWay && (
                <group position={[0, 0.045, 0]}>
                    {Array.from({ length: Math.floor(length / 2) }).map((_, i, arr) => {
                        const spacing = 2.0;
                        const zOff = (i - arr.length / 2) * spacing + spacing / 2;
                        let centerLineColor = '#fbbf24'; // American style mustard yellow
                        if (roadType === 'main') centerLineColor = '#f59e0b';
                        if (roadType === 'alley') centerLineColor = '#64748b';

                        return (
                            <mesh key={i} position={[0, 0, zOff]}>
                                <boxGeometry args={[0.08, 0.012, 0.8]} />
                                <meshStandardMaterial color={centerLineColor} roughness={1} />
                            </mesh>
                        );
                    })}
                </group>
            )}

            {/* Glow strip for visited roads */}
            {(isFinal || isExplored) && !isActiveRelaxed && (
                <mesh position={[0, 0.065, 0]}>
                    <boxGeometry args={[roadWidth * 0.4, 0.02, length]} />
                    <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={isFinal ? 2.5 : 1.2} transparent opacity={0.6} />
                </mesh>
            )}

            {/* One-way arrows */}
            {oneWay && !isFinal && !isActiveRelaxed && (
                <group rotation={[0, 0, 0]}>
                    {[-length * 0.35, 0, length * 0.35].map((offset, i) => (
                        <mesh key={i} position={[0, 0.05, offset]} rotation={[Math.PI / 2, 0, 0]}>
                            <coneGeometry args={[0.15, 0.4, 4]} />
                            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
});
