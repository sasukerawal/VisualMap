/**
 * townGraph.js — Frontend graph matching backend perfectly.
 * 42 houses, with orthogonal driveways running down central alleyways.
 */

export const NODES = {
    // Warehouse
    warehouse: { label: "Warehouse", pos: [-34, 0, -16], type: "warehouse" },

    // North perimeter (one-way W→E, z=-25)
    n_wh: { label: "N-WH", pos: [-30, 0, -25], type: "intersection" },
    n_A: { label: "N-A", pos: [-18, 0, -25], type: "intersection" },
    n_AB: { label: "N-AB", pos: [-10, 0, -25], type: "intersection" },
    n_B: { label: "N-B", pos: [-2, 0, -25], type: "intersection" },
    n_BC: { label: "N-BC", pos: [6, 0, -25], type: "intersection" },
    n_C: { label: "N-C", pos: [14, 0, -25], type: "intersection" },
    n_CD: { label: "N-CD", pos: [22, 0, -25], type: "intersection" },
    n_D: { label: "N-D", pos: [30, 0, -25], type: "intersection" },
    n_De: { label: "N-De", pos: [38, 0, -25], type: "intersection" },

    // Middle road (two-way, z=-3)
    m_w: { label: "M-W", pos: [-30, 0, -3], type: "intersection" },
    m_A: { label: "M-A", pos: [-18, 0, -3], type: "intersection" },
    m_AB: { label: "M-AB", pos: [-10, 0, -3], type: "intersection" },
    m_B: { label: "M-B", pos: [-2, 0, -3], type: "intersection" },
    m_BC: { label: "M-BC", pos: [6, 0, -3], type: "intersection" },
    m_C: { label: "M-C", pos: [14, 0, -3], type: "intersection" },
    m_CD: { label: "M-CD", pos: [22, 0, -3], type: "intersection" },
    m_D: { label: "M-D", pos: [30, 0, -3], type: "intersection" },
    m_e: { label: "M-E", pos: [38, 0, -3], type: "intersection" },

    // Row-1 north road (two-way, z=3)
    r1_w: { label: "R1-W", pos: [-30, 0, 3], type: "intersection" },
    r1_E: { label: "R1-E", pos: [-11, 0, 3], type: "intersection" },
    r1_EF: { label: "R1-EF", pos: [-4, 0, 3], type: "intersection" },
    r1_F: { label: "R1-F", pos: [3, 0, 3], type: "intersection" },
    r1_FG: { label: "R1-FG", pos: [10, 0, 3], type: "intersection" },
    r1_G: { label: "R1-G", pos: [17, 0, 3], type: "intersection" },
    r1_e: { label: "R1-GE", pos: [38, 0, 3], type: "intersection" },

    // South perimeter (one-way E→W, z=19)
    s_e: { label: "S-E", pos: [38, 0, 19], type: "intersection" },
    s_G: { label: "S-G", pos: [17, 0, 19], type: "intersection" },
    s_FG: { label: "S-FG", pos: [10, 0, 19], type: "intersection" },
    s_F: { label: "S-F", pos: [3, 0, 19], type: "intersection" },
    s_EF: { label: "S-EF", pos: [-4, 0, 19], type: "intersection" },
    s_E: { label: "S-E2", pos: [-11, 0, 19], type: "intersection" },
    s_w: { label: "S-W", pos: [-30, 0, 19], type: "intersection" },

    // ---- Block A Driveways ----
    drv_A1: { label: "", pos: [-18, 0, -20], type: "intersection" },
    drv_A2: { label: "", pos: [-18, 0, -14], type: "intersection" },
    drv_A3: { label: "", pos: [-18, 0, -8], type: "intersection" },
    a1: { label: "12 Apple St", pos: [-23, 0, -20], type: "address", block: 'A' },
    a4: { label: "18 Apple St", pos: [-13, 0, -20], type: "address", block: 'A' },
    a2: { label: "14 Apple St", pos: [-23, 0, -14], type: "address", block: 'A' },
    a5: { label: "20 Apple St", pos: [-13, 0, -14], type: "address", block: 'A' },
    a3: { label: "16 Apple St", pos: [-23, 0, -8], type: "address", block: 'A' },
    a6: { label: "22 Apple St", pos: [-13, 0, -8], type: "address", block: 'A' },

    // ---- Block B Driveways ----
    drv_B1: { label: "", pos: [-2, 0, -20], type: "intersection" },
    drv_B2: { label: "", pos: [-2, 0, -14], type: "intersection" },
    drv_B3: { label: "", pos: [-2, 0, -8], type: "intersection" },
    b1: { label: "5 Baker Ave", pos: [-7, 0, -20], type: "address", block: 'B' },
    b4: { label: "11 Baker Ave", pos: [3, 0, -20], type: "address", block: 'B' },
    b2: { label: "7 Baker Ave", pos: [-7, 0, -14], type: "address", block: 'B' },
    b5: { label: "13 Baker Ave", pos: [3, 0, -14], type: "address", block: 'B' },
    b3: { label: "9 Baker Ave", pos: [-7, 0, -8], type: "address", block: 'B' },
    b6: { label: "15 Baker Ave", pos: [3, 0, -8], type: "address", block: 'B' },

    // ---- Block C Driveways ----
    drv_C1: { label: "", pos: [14, 0, -20], type: "intersection" },
    drv_C2: { label: "", pos: [14, 0, -14], type: "intersection" },
    drv_C3: { label: "", pos: [14, 0, -8], type: "intersection" },
    c1: { label: "3 Cedar Ln", pos: [9, 0, -20], type: "address", block: 'C' },
    c4: { label: "9 Cedar Ln", pos: [19, 0, -20], type: "address", block: 'C' },
    c2: { label: "5 Cedar Ln", pos: [9, 0, -14], type: "address", block: 'C' },
    c5: { label: "11 Cedar Ln", pos: [19, 0, -14], type: "address", block: 'C' },
    c3: { label: "7 Cedar Ln", pos: [9, 0, -8], type: "address", block: 'C' },
    c6: { label: "13 Cedar Ln", pos: [19, 0, -8], type: "address", block: 'C' },

    // ---- Block D Driveways ----
    drv_D1: { label: "", pos: [30, 0, -20], type: "intersection" },
    drv_D2: { label: "", pos: [30, 0, -14], type: "intersection" },
    drv_D3: { label: "", pos: [30, 0, -8], type: "intersection" },
    d1: { label: "1 Daisy Rd", pos: [25, 0, -20], type: "address", block: 'D' },
    d4: { label: "7 Daisy Rd", pos: [35, 0, -20], type: "address", block: 'D' },
    d2: { label: "3 Daisy Rd", pos: [25, 0, -14], type: "address", block: 'D' },
    d5: { label: "9 Daisy Rd", pos: [35, 0, -14], type: "address", block: 'D' },
    d3: { label: "5 Daisy Rd", pos: [25, 0, -8], type: "address", block: 'D' },
    d6: { label: "11 Daisy Rd", pos: [35, 0, -8], type: "address", block: 'D' },

    // ---- Block E Driveways ----
    drv_E1: { label: "", pos: [-11, 0, 7], type: "intersection" },
    drv_E2: { label: "", pos: [-11, 0, 11], type: "intersection" },
    drv_E3: { label: "", pos: [-11, 0, 15], type: "intersection" },
    e1: { label: "2 Elm Way", pos: [-16, 0, 7], type: "address", block: 'E' },
    e4: { label: "8 Elm Way", pos: [-6, 0, 7], type: "address", block: 'E' },
    e2: { label: "4 Elm Way", pos: [-16, 0, 11], type: "address", block: 'E' },
    e5: { label: "10 Elm Way", pos: [-6, 0, 11], type: "address", block: 'E' },
    e3: { label: "6 Elm Way", pos: [-16, 0, 15], type: "address", block: 'E' },
    e6: { label: "12 Elm Way", pos: [-6, 0, 15], type: "address", block: 'E' },

    // ---- Block F Driveways ----
    drv_F1: { label: "", pos: [3, 0, 7], type: "intersection" },
    drv_F2: { label: "", pos: [3, 0, 11], type: "intersection" },
    drv_F3: { label: "", pos: [3, 0, 15], type: "intersection" },
    f1: { label: "1 Fig Blvd", pos: [-2, 0, 7], type: "address", block: 'F' },
    f4: { label: "7 Fig Blvd", pos: [8, 0, 7], type: "address", block: 'F' },
    f2: { label: "3 Fig Blvd", pos: [-2, 0, 11], type: "address", block: 'F' },
    f5: { label: "9 Fig Blvd", pos: [8, 0, 11], type: "address", block: 'F' },
    f3: { label: "5 Fig Blvd", pos: [-2, 0, 15], type: "address", block: 'F' },
    f6: { label: "11 Fig Blvd", pos: [8, 0, 15], type: "address", block: 'F' },

    // ---- Block G Driveways ----
    drv_G1: { label: "", pos: [17, 0, 7], type: "intersection" },
    drv_G2: { label: "", pos: [17, 0, 11], type: "intersection" },
    drv_G3: { label: "", pos: [17, 0, 15], type: "intersection" },
    g1: { label: "10 Grove Ct", pos: [12, 0, 7], type: "address", block: 'G' },
    g4: { label: "16 Grove Ct", pos: [22, 0, 7], type: "address", block: 'G' },
    g2: { label: "12 Grove Ct", pos: [12, 0, 11], type: "address", block: 'G' },
    g5: { label: "18 Grove Ct", pos: [22, 0, 11], type: "address", block: 'G' },
    g3: { label: "14 Grove Ct", pos: [12, 0, 15], type: "address", block: 'G' },
    g6: { label: "20 Grove Ct", pos: [22, 0, 15], type: "address", block: 'G' },
};

// Map object mapping for ease-of-use
export const ADDRESS_NODES = Object.keys(NODES)
    .filter(k => NODES[k].type === 'address')
    .map(k => ({ id: k, ...NODES[k] }));

const _RAW = [
    // Warehouse
    ["warehouse", "n_wh", false, "main"],

    // North perimeter ONE-WAY W→E
    ["n_wh", "n_A", true, "main"], ["n_A", "n_AB", true, "main"], ["n_AB", "n_B", true, "main"],
    ["n_B", "n_BC", true, "main"], ["n_BC", "n_C", true, "main"], ["n_C", "n_CD", true, "main"],
    ["n_CD", "n_D", true, "main"], ["n_D", "n_De", true, "main"],

    // East column ONE-WAY N→S
    ["n_De", "m_e", true, "main"], ["m_e", "r1_e", true, "main"], ["r1_e", "s_e", true, "main"],

    // South perimeter ONE-WAY E→W
    ["s_e", "s_G", true, "main"], ["s_G", "s_FG", true, "main"], ["s_FG", "s_F", true, "main"],
    ["s_F", "s_EF", true, "main"], ["s_EF", "s_E", true, "main"], ["s_E", "s_w", true, "main"],

    // West column ONE-WAY S→N
    ["s_w", "r1_w", true, "main"], ["r1_w", "m_w", true, "main"], ["m_w", "n_wh", true, "main"],

    // Middle horizontal two-way
    ["m_w", "m_A", false, "local"], ["m_A", "m_AB", false, "local"], ["m_AB", "m_B", false, "local"],
    ["m_B", "m_BC", false, "local"], ["m_BC", "m_C", false, "local"], ["m_C", "m_CD", false, "local"],
    ["m_CD", "m_D", false, "local"], ["m_D", "m_e", false, "local"],

    // Middle→row1 connectors two-way
    ["m_w", "r1_w", false, "local"], ["m_AB", "r1_EF", false, "local"], ["m_BC", "r1_FG", false, "local"],
    ["m_e", "r1_e", false, "local"],

    // Row-1 north horizontal two-way
    ["r1_w", "r1_E", false, "local"], ["r1_E", "r1_EF", false, "local"], ["r1_EF", "r1_F", false, "local"],
    ["r1_F", "r1_FG", false, "local"], ["r1_FG", "r1_G", false, "local"], ["r1_G", "r1_e", false, "local"],

    // Inter-block verticals two-way
    ["n_AB", "m_AB", false, "local"], ["n_BC", "m_BC", false, "local"], ["n_CD", "m_CD", false, "local"],
    ["r1_EF", "s_EF", false, "local"], ["r1_FG", "s_FG", false, "local"],

    // --- Block A Alley & Driveways ---
    ["n_A", "drv_A1", false, "alley"], ["drv_A1", "drv_A2", false, "alley"], ["drv_A2", "drv_A3", false, "alley"], ["drv_A3", "m_A", false, "alley"],
    ["drv_A1", "a1", false, "alley"], ["drv_A1", "a4", false, "alley"],
    ["drv_A2", "a2", false, "alley"], ["drv_A2", "a5", false, "alley"],
    ["drv_A3", "a3", false, "alley"], ["drv_A3", "a6", false, "alley"],

    // --- Block B Alley & Driveways ---
    ["n_B", "drv_B1", false, "alley"], ["drv_B1", "drv_B2", false, "alley"], ["drv_B2", "drv_B3", false, "alley"], ["drv_B3", "m_B", false, "alley"],
    ["drv_B1", "b1", false, "alley"], ["drv_B1", "b4", false, "alley"],
    ["drv_B2", "b2", false, "alley"], ["drv_B2", "b5", false, "alley"],
    ["drv_B3", "b3", false, "alley"], ["drv_B3", "b6", false, "alley"],

    // --- Block C Alley & Driveways ---
    ["n_C", "drv_C1", false, "alley"], ["drv_C1", "drv_C2", false, "alley"], ["drv_C2", "drv_C3", false, "alley"], ["drv_C3", "m_C", false, "alley"],
    ["drv_C1", "c1", false, "alley"], ["drv_C1", "c4", false, "alley"],
    ["drv_C2", "c2", false, "alley"], ["drv_C2", "c5", false, "alley"],
    ["drv_C3", "c3", false, "alley"], ["drv_C3", "c6", false, "alley"],

    // --- Block D Alley & Driveways ---
    ["n_D", "drv_D1", false, "alley"], ["drv_D1", "drv_D2", false, "alley"], ["drv_D2", "drv_D3", false, "alley"], ["drv_D3", "m_D", false, "alley"],
    ["drv_D1", "d1", false, "alley"], ["drv_D1", "d4", false, "alley"],
    ["drv_D2", "d2", false, "alley"], ["drv_D2", "d5", false, "alley"],
    ["drv_D3", "d3", false, "alley"], ["drv_D3", "d6", false, "alley"],

    // --- Block E Alley & Driveways ---
    ["r1_E", "drv_E1", false, "alley"], ["drv_E1", "drv_E2", false, "alley"], ["drv_E2", "drv_E3", false, "alley"], ["drv_E3", "s_E", false, "alley"],
    ["drv_E1", "e1", false, "alley"], ["drv_E1", "e4", false, "alley"],
    ["drv_E2", "e2", false, "alley"], ["drv_E2", "e5", false, "alley"],
    ["drv_E3", "e3", false, "alley"], ["drv_E3", "e6", false, "alley"],

    // --- Block F Alley & Driveways ---
    ["r1_F", "drv_F1", false, "alley"], ["drv_F1", "drv_F2", false, "alley"], ["drv_F2", "drv_F3", false, "alley"], ["drv_F3", "s_F", false, "alley"],
    ["drv_F1", "f1", false, "alley"], ["drv_F1", "f4", false, "alley"],
    ["drv_F2", "f2", false, "alley"], ["drv_F2", "f5", false, "alley"],
    ["drv_F3", "f3", false, "alley"], ["drv_F3", "f6", false, "alley"],

    // --- Block G Alley & Driveways ---
    ["r1_G", "drv_G1", false, "alley"], ["drv_G1", "drv_G2", false, "alley"], ["drv_G2", "drv_G3", false, "alley"], ["drv_G3", "s_G", false, "alley"],
    ["drv_G1", "g1", false, "alley"], ["drv_G1", "g4", false, "alley"],
    ["drv_G2", "g2", false, "alley"], ["drv_G2", "g5", false, "alley"],
    ["drv_G3", "g3", false, "alley"], ["drv_G3", "g6", false, "alley"],
];

function _speed(roadType) {
    if (roadType === "main") return 1.5;
    if (roadType === "local") return 1.0;
    return 0.5; // alley
}

function _makeEdges() {
    return _RAW.map(([a, b, one_way, road_type]) => {
        const p1 = NODES[a].pos;
        const p2 = NODES[b].pos;
        const raw_dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[2] - p2[2], 2));
        const speed = _speed(road_type);
        const time_cost = raw_dist / speed;
        return {
            source: a,
            target: b,
            time_cost,
            raw_dist,
            one_way,
            speed_limit: speed,
            road_type
        };
    });
}

export const EDGES = _makeEdges();

// Helper to get one-way edges
export const ONE_WAY_EDGES = EDGES.filter(e => e.one_way === true).map(e => [e.source, e.target, e.one_way]);
