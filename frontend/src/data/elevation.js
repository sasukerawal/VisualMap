// elevation.js — shared synthetic elevation field used for both UI and routing visuals.
//
// Keep this in sync with backend/app/graph/town_graph.py (_elevation).

export function elevationAt(x, z) {
    const hx = 6.0;
    const hz = -3.0;
    const dx = x - hx;
    const dz = z - hz;
    const hill = 4.0 * Math.exp(-(dx * dx + dz * dz) / 520.0);

    const vx = -22.0;
    const vz = 17.0;
    const dx2 = x - vx;
    const dz2 = z - vz;
    const valley = 1.8 * Math.exp(-(dx2 * dx2 + dz2 * dz2) / 700.0);

    return hill - valley;
}

// Terrain constants used by the 3D scene. Keeping these here avoids "amp/base"
// drifting between the ground mesh and the objects that should sit on it.
export const TERRAIN_AMP = 0.22;
export const TERRAIN_BASE_Y = -0.07;

export function groundHeightAt(x, z) {
    return TERRAIN_BASE_Y + elevationAt(x, z) * TERRAIN_AMP;
}
