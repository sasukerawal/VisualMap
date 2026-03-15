/**
 * VisualMap Town Graph — 7 blocks × 6 houses = 42 delivery addresses.
 *
 * Layout (top-down):
 *   Row 0: [Block A] [Block B] [Block C] [Block D]  (z ≈ -16)
 *   Row 1:       [Block E] [Block F] [Block G]       (z ≈ 10)
 *   Warehouse: far west
 *
 * One‑way roads:
 *   North perimeter (z=-25): W → E  (warehouse → east)
 *   East column (x=38):      N → S
 *   South perimeter (z=19):  E → W
 *   West column (x=-30):     S → N  (completing the loop)
 *
 * Middle inter‑row road (z=-3): two‑way east/west
 * Vertical block driveways: two‑way
 */

// ------------------------------------------------------------------
// NODES
// ------------------------------------------------------------------
// pos = [x, y, z]  (y=0 = ground level)
// type: "warehouse" | "intersection" | "address"
// For "address" nodes, 'block' and 'houseIndex' annotate which block/slot

export const NODES = {
    // ── Warehouse ─────────────────────────────────────────────────
    warehouse: { label: "Warehouse", pos: [-34, 0, -16], type: "warehouse" },

    // ── North perimeter road (one-way W→E, z=-25) ─────────────────
    n_wh: { label: "N-WH", pos: [-30, 0, -25], type: "intersection" },
    n_A: { label: "N-A", pos: [-18, 0, -25], type: "intersection" },
    n_AB: { label: "N-AB", pos: [-10, 0, -25], type: "intersection" },
    n_B: { label: "N-B", pos: [-2, 0, -25], type: "intersection" },
    n_BC: { label: "N-BC", pos: [6, 0, -25], type: "intersection" },
    n_C: { label: "N-C", pos: [14, 0, -25], type: "intersection" },
    n_CD: { label: "N-CD", pos: [22, 0, -25], type: "intersection" },
    n_D: { label: "N-D", pos: [30, 0, -25], type: "intersection" },
    n_De: { label: "N-De", pos: [38, 0, -25], type: "intersection" },

    // ── Middle road (two-way, z=-3) ────────────────────────────────
    m_w: { label: "M-W", pos: [-30, 0, -3], type: "intersection" },
    m_A: { label: "M-A", pos: [-18, 0, -3], type: "intersection" },
    m_AB: { label: "M-AB", pos: [-10, 0, -3], type: "intersection" },
    m_B: { label: "M-B", pos: [-2, 0, -3], type: "intersection" },
    m_BC: { label: "M-BC", pos: [6, 0, -3], type: "intersection" },
    m_C: { label: "M-C", pos: [14, 0, -3], type: "intersection" },
    m_CD: { label: "M-CD", pos: [22, 0, -3], type: "intersection" },
    m_D: { label: "M-D", pos: [30, 0, -3], type: "intersection" },
    m_e: { label: "M-E", pos: [38, 0, -3], type: "intersection" },

    // ── Row-1 north road (two-way, z=3) ───────────────────────────
    r1_w: { label: "R1-W", pos: [-30, 0, 3], type: "intersection" },
    r1_E: { label: "R1-E", pos: [-11, 0, 3], type: "intersection" },
    r1_EF: { label: "R1-EF", pos: [-4, 0, 3], type: "intersection" },
    r1_F: { label: "R1-F", pos: [3, 0, 3], type: "intersection" },
    r1_FG: { label: "R1-FG", pos: [10, 0, 3], type: "intersection" },
    r1_G: { label: "R1-G", pos: [17, 0, 3], type: "intersection" },
    r1_e: { label: "R1-GE", pos: [38, 0, 3], type: "intersection" },

    // ── South perimeter road (one-way E→W, z=19) ──────────────────
    s_e: { label: "S-E", pos: [38, 0, 19], type: "intersection" },
    s_G: { label: "S-G", pos: [17, 0, 19], type: "intersection" },
    s_FG: { label: "S-FG", pos: [10, 0, 19], type: "intersection" },
    s_F: { label: "S-F", pos: [3, 0, 19], type: "intersection" },
    s_EF: { label: "S-EF", pos: [-4, 0, 19], type: "intersection" },
    s_E: { label: "S-E2", pos: [-11, 0, 19], type: "intersection" },
    s_w: { label: "S-W", pos: [-30, 0, 19], type: "intersection" },

    // ── West column (one-way S→N, x=-30) ──────────────────────────
    // connects s_w → r1_w → m_w → n_wh (already defined above)

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DELIVERY ADDRESSES — 7 blocks × 6 houses
    // Houses sit INSIDE each block (off-road)
    // Block extents (x: cx±7, z: cz±5)
    // House grid: 3 cols (cx-4, cx, cx+4), 2 rows (cz-3, cz+2.5)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Block A — center (-18, -16) ──────────────────────────────────
    a1: { label: "12 Apple St", pos: [-22, 0, -19], type: "address", block: "A" },
    a2: { label: "14 Apple St", pos: [-18, 0, -19], type: "address", block: "A" },
    a3: { label: "16 Apple St", pos: [-14, 0, -19], type: "address", block: "A" },
    a4: { label: "18 Apple St", pos: [-22, 0, -13], type: "address", block: "A" },
    a5: { label: "20 Apple St", pos: [-18, 0, -13], type: "address", block: "A" },
    a6: { label: "22 Apple St", pos: [-14, 0, -13], type: "address", block: "A" },

    // Block B — center (-2, -16) ───────────────────────────────────
    b1: { label: "5 Baker Ave", pos: [-6, 0, -19], type: "address", block: "B" },
    b2: { label: "7 Baker Ave", pos: [-2, 0, -19], type: "address", block: "B" },
    b3: { label: "9 Baker Ave", pos: [2, 0, -19], type: "address", block: "B" },
    b4: { label: "11 Baker Ave", pos: [-6, 0, -13], type: "address", block: "B" },
    b5: { label: "13 Baker Ave", pos: [-2, 0, -13], type: "address", block: "B" },
    b6: { label: "15 Baker Ave", pos: [2, 0, -13], type: "address", block: "B" },

    // Block C — center (14, -16) ───────────────────────────────────
    c1: { label: "3 Cedar Ln", pos: [10, 0, -19], type: "address", block: "C" },
    c2: { label: "5 Cedar Ln", pos: [14, 0, -19], type: "address", block: "C" },
    c3: { label: "7 Cedar Ln", pos: [18, 0, -19], type: "address", block: "C" },
    c4: { label: "9 Cedar Ln", pos: [10, 0, -13], type: "address", block: "C" },
    c5: { label: "11 Cedar Ln", pos: [14, 0, -13], type: "address", block: "C" },
    c6: { label: "13 Cedar Ln", pos: [18, 0, -13], type: "address", block: "C" },

    // Block D — center (30, -16) ───────────────────────────────────
    d1: { label: "1 Daisy Rd", pos: [26, 0, -19], type: "address", block: "D" },
    d2: { label: "3 Daisy Rd", pos: [30, 0, -19], type: "address", block: "D" },
    d3: { label: "5 Daisy Rd", pos: [34, 0, -19], type: "address", block: "D" },
    d4: { label: "7 Daisy Rd", pos: [26, 0, -13], type: "address", block: "D" },
    d5: { label: "9 Daisy Rd", pos: [30, 0, -13], type: "address", block: "D" },
    d6: { label: "11 Daisy Rd", pos: [34, 0, -13], type: "address", block: "D" },

    // Block E — center (-11, 10) ──────────────────────────────────
    e1: { label: "2 Elm Way", pos: [-15, 0, 7], type: "address", block: "E" },
    e2: { label: "4 Elm Way", pos: [-11, 0, 7], type: "address", block: "E" },
    e3: { label: "6 Elm Way", pos: [-7, 0, 7], type: "address", block: "E" },
    e4: { label: "8 Elm Way", pos: [-15, 0, 13], type: "address", block: "E" },
    e5: { label: "10 Elm Way", pos: [-11, 0, 13], type: "address", block: "E" },
    e6: { label: "12 Elm Way", pos: [-7, 0, 13], type: "address", block: "E" },

    // Block F — center (3, 10) ────────────────────────────────────
    f1: { label: "1 Fig Blvd", pos: [-1, 0, 7], type: "address", block: "F" },
    f2: { label: "3 Fig Blvd", pos: [3, 0, 7], type: "address", block: "F" },
    f3: { label: "5 Fig Blvd", pos: [7, 0, 7], type: "address", block: "F" },
    f4: { label: "7 Fig Blvd", pos: [-1, 0, 13], type: "address", block: "F" },
    f5: { label: "9 Fig Blvd", pos: [3, 0, 13], type: "address", block: "F" },
    f6: { label: "11 Fig Blvd", pos: [7, 0, 13], type: "address", block: "F" },

    // Block G — center (17, 10) ───────────────────────────────────
    g1: { label: "10 Grove Ct", pos: [13, 0, 7], type: "address", block: "G" },
    g2: { label: "12 Grove Ct", pos: [17, 0, 7], type: "address", block: "G" },
    g3: { label: "14 Grove Ct", pos: [21, 0, 7], type: "address", block: "G" },
    g4: { label: "16 Grove Ct", pos: [13, 0, 13], type: "address", block: "G" },
    g5: { label: "18 Grove Ct", pos: [17, 0, 13], type: "address", block: "G" },
    g6: { label: "20 Grove Ct", pos: [21, 0, 13], type: "address", block: "G" },
};

// ------------------------------------------------------------------
// EDGES  [from, to, oneWay?]
// oneWay=true  → only adds from→to in backend adjacency (directed)
// oneWay=false → bidirectional
// ------------------------------------------------------------------
export const EDGES = [
    // ── Warehouse to north loop ────────────────────────────────────
    ["warehouse", "n_wh", false],

    // ── North perimeter road (ONE-WAY W→E) ────────────────────────
    ["n_wh", "n_A", true],
    ["n_A", "n_AB", true],
    ["n_AB", "n_B", true],
    ["n_B", "n_BC", true],
    ["n_BC", "n_C", true],
    ["n_C", "n_CD", true],
    ["n_CD", "n_D", true],
    ["n_D", "n_De", true],

    // ── East column (ONE-WAY N→S) ──────────────────────────────────
    ["n_De", "m_e", true],
    ["m_e", "r1_e", true],
    ["r1_e", "s_e", true],

    // ── South perimeter road (ONE-WAY E→W) ────────────────────────
    ["s_e", "s_G", true],
    ["s_G", "s_FG", true],
    ["s_FG", "s_F", true],
    ["s_F", "s_EF", true],
    ["s_EF", "s_E", true],
    ["s_E", "s_w", true],

    // ── West column (ONE-WAY S→N) ──────────────────────────────────
    ["s_w", "r1_w", true],
    ["r1_w", "m_w", true],
    ["m_w", "n_wh", true],

    // ── Middle road vertical connectors (two-way) ──────────────────
    ["n_A", "m_A", false],
    ["n_AB", "m_AB", false],
    ["n_B", "m_B", false],
    ["n_BC", "m_BC", false],
    ["n_C", "m_C", false],
    ["n_CD", "m_CD", false],
    ["n_D", "m_D", false],

    // ── Middle road horizontal (two-way) ──────────────────────────
    ["m_w", "m_A", false],
    ["m_A", "m_AB", false],
    ["m_AB", "m_B", false],
    ["m_B", "m_BC", false],
    ["m_BC", "m_C", false],
    ["m_C", "m_CD", false],
    ["m_CD", "m_D", false],
    ["m_D", "m_e", false],

    // ── Middle → row1 north road connectors (two-way) ─────────────
    ["m_w", "r1_w", false],
    ["r1_w", "r1_E", false],
    ["m_AB", "r1_EF", false],
    ["m_BC", "r1_FG", false],
    ["m_e", "r1_e", false],

    // ── Row-1 north road (two-way) ────────────────────────────────
    ["r1_E", "r1_EF", false],
    ["r1_EF", "r1_F", false],
    ["r1_F", "r1_FG", false],
    ["r1_FG", "r1_G", false],
    ["r1_G", "r1_e", false],

    // ── Row-1 south vertical connectors ───────────────────────────
    ["r1_E", "s_E", false],
    ["r1_EF", "s_EF", false],
    ["r1_F", "s_F", false],
    ["r1_FG", "s_FG", false],
    ["r1_G", "s_G", false],

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // HOUSE ACCESS — driveways from road intersections to houses
    // North rows connect from n_ nodes, south rows from m_ nodes
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Block A driveways
    ["n_A", "a1", false], ["n_A", "a2", false], ["n_A", "a3", false],
    ["m_A", "a4", false], ["m_A", "a5", false], ["m_A", "a6", false],

    // Block B driveways
    ["n_B", "b1", false], ["n_B", "b2", false], ["n_B", "b3", false],
    ["m_B", "b4", false], ["m_B", "b5", false], ["m_B", "b6", false],

    // Block C driveways
    ["n_C", "c1", false], ["n_C", "c2", false], ["n_C", "c3", false],
    ["m_C", "c4", false], ["m_C", "c5", false], ["m_C", "c6", false],

    // Block D driveways
    ["n_D", "d1", false], ["n_D", "d2", false], ["n_D", "d3", false],
    ["m_D", "d4", false], ["m_D", "d5", false], ["m_D", "d6", false],

    // Block E driveways (from row-1 roads)
    ["r1_E", "e1", false], ["r1_E", "e2", false], ["r1_E", "e3", false],
    ["s_E", "e4", false], ["s_E", "e5", false], ["s_E", "e6", false],

    // Block F driveways
    ["r1_F", "f1", false], ["r1_F", "f2", false], ["r1_F", "f3", false],
    ["s_F", "f4", false], ["s_F", "f5", false], ["s_F", "f6", false],

    // Block G driveways
    ["r1_G", "g1", false], ["r1_G", "g2", false], ["r1_G", "g3", false],
    ["s_G", "g4", false], ["s_G", "g5", false], ["s_G", "g6", false],
];

/** Euclidean distance between two node positions */
export function nodeDist(idA, idB) {
    const a = NODES[idA]?.pos;
    const b = NODES[idB]?.pos;
    if (!a || !b) return 0;
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2);
}

/** All address (delivery) nodes as array */
export const ADDRESS_NODES = Object.entries(NODES)
    .filter(([, v]) => v.type === "address")
    .map(([id, v]) => ({ id, ...v }));

/** One-way edge keys for rendering arrows */
export const ONE_WAY_EDGES = EDGES.filter(e => e[2] === true);
