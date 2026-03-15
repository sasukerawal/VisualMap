/**
 * Building — a single city building rendered as a 3D box.
 * 20 distinct curated building color palettes for variety.
 */
import { useMemo } from 'react';

const PALETTES = [
    { body: '#1a2444', roof: '#2244aa', accent: '#5577ff' },
    { body: '#1e2538', roof: '#3a3060', accent: '#9966ff' },
    { body: '#22181a', roof: '#661133', accent: '#ff4466' },
    { body: '#122010', roof: '#224422', accent: '#44cc66' },
    { body: '#1e1600', roof: '#443300', accent: '#ffaa22' },
    { body: '#0e1e2e', roof: '#1a3344', accent: '#22aadd' },
    { body: '#1e1620', roof: '#442244', accent: '#cc44cc' },
    { body: '#1a1a1a', roof: '#2a2a2a', accent: '#888888' },
    { body: '#14201a', roof: '#1a3328', accent: '#33ddaa' },
    { body: '#201414', roof: '#3c2020', accent: '#ff7744' },
    { body: '#131828', roof: '#222444', accent: '#4466ff' },
    { body: '#1a1a2e', roof: '#2a2a4a', accent: '#6666ff' },
    { body: '#201c14', roof: '#403820', accent: '#ddbb44' },
    { body: '#162020', roof: '#243434', accent: '#44ccbb' },
    { body: '#1e1420', roof: '#362040', accent: '#bb44ff' },
    { body: '#200e14', roof: '#3c1a28', accent: '#ff4488' },
    { body: '#10181e', roof: '#1a2c38', accent: '#33aacc' },
    { body: '#1c1c10', roof: '#343418', accent: '#cccc44' },
    { body: '#1a1428', roof: '#2a1e44', accent: '#8855ff' },
    { body: '#10201a', roof: '#1e3a2c', accent: '#44ee88' },
];

export function Building({ position, scale, colorIndex }) {
    const palette = useMemo(() => PALETTES[colorIndex % PALETTES.length], [colorIndex]);
    const [w, h, d] = scale;

    return (
        <group position={position}>
            {/* Main body */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={palette.body} roughness={0.75} metalness={0.1} />
            </mesh>

            {/* Roof panel */}
            <mesh position={[0, h / 2 + 0.04, 0]}>
                <boxGeometry args={[w + 0.05, 0.12, d + 0.05]} />
                <meshStandardMaterial color={palette.roof} roughness={0.6} metalness={0.2} />
            </mesh>

            {/* Accent trim stripe */}
            <mesh position={[0, h * 0.1, 0]}>
                <boxGeometry args={[w + 0.02, 0.08, d + 0.02]} />
                <meshStandardMaterial
                    color={palette.accent}
                    emissive={palette.accent}
                    emissiveIntensity={0.4}
                />
            </mesh>

            {/* Window grids — front face */}
            {h > 2 && (
                <WindowGrid
                    width={w * 0.75}
                    height={h * 0.62}
                    offsetZ={d / 2 + 0.01}
                    accentColor={palette.accent}
                    cols={Math.max(1, Math.round(w * 0.7))}
                    rows={Math.max(1, Math.round(h * 0.5))}
                />
            )}

            {/* Rooftop tower/antenna on taller buildings */}
            {h > 4 && (
                <mesh position={[0, h / 2 + 0.3, 0]}>
                    <cylinderGeometry args={[0.05, 0.07, 0.6, 6]} />
                    <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.8} />
                </mesh>
            )}
        </group>
    );
}

function WindowGrid({ width, height, offsetZ, accentColor, cols, rows }) {
    const windows = [];
    const baseY = -(height / 2) + (height / (rows + 1));
    const stepY = height / (rows + 1);
    const baseX = -(width / 2) + (width / (cols + 1));
    const stepX = width / (cols + 1);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const lit = (r + c) % 3 !== 0; // some windows off
            windows.push(
                <mesh key={`${r}-${c}`} position={[baseX + c * stepX, baseY + r * stepY, offsetZ]}>
                    <boxGeometry args={[0.15, 0.22, 0.01]} />
                    <meshStandardMaterial
                        color={lit ? accentColor : '#111'}
                        emissive={lit ? accentColor : '#0a0a0a'}
                        emissiveIntensity={lit ? 0.6 : 0}
                        transparent
                        opacity={lit ? 0.85 : 1}
                    />
                </mesh>
            );
        }
    }
    return <group>{windows}</group>;
}
