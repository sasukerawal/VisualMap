"""
Town graph — 7 city blocks × 6 houses = 42 delivery addresses.

One-way perimeter loop:
  North road: W → E (z=-25)
  East column: N → S (x=38)
  South road:  E → W (z=19)
  West column: S → N (x=-30)

All addresses are connected orthogonally to the alleyways (vertical streets).
This allows rendering clean roads "between" the houses, and stops the van from clipping.
"""
import math
from typing import Dict, List, Tuple

NODES: Dict[str, dict] = {
    # Warehouse
    "warehouse": {"label": "Warehouse",   "pos_3d": [-34, 0, -16], "type": "warehouse"},

    # North perimeter (one-way W→E, z=-25)
    "n_wh":  {"label":"Industrial Pkwy & West Ave",   "pos_3d":[-30,0,-25], "type":"intersection"},
    "n_A":   {"label":"Industrial Pkwy & Apple St",    "pos_3d":[-18,0,-25], "type":"intersection"},
    "n_AB":  {"label":"Industrial Pkwy & Central Blvd", "pos_3d":[-10,0,-25], "type":"intersection"},
    "n_B":   {"label":"Industrial Pkwy & Baker Ave",    "pos_3d":[ -2,0,-25], "type":"intersection"},
    "n_BC":  {"label":"Industrial Pkwy & Cedar Ln",     "pos_3d":[  6,0,-25], "type":"intersection"},
    "n_C":   {"label":"Industrial Pkwy & Cedar Ln Exit", "pos_3d":[ 14,0,-25], "type":"intersection"},
    "n_CD":  {"label":"Industrial Pkwy & Daisy Rd",     "pos_3d":[ 22,0,-25], "type":"intersection"},
    "n_D":   {"label":"Industrial Pkwy & Daisy Connector", "pos_3d":[ 30,0,-25], "type":"intersection"},
    "n_De":  {"label":"Industrial Pkwy & East Blvd",    "pos_3d":[ 38,0,-25], "type":"intersection"},

    # Middle road (two-way, z=-3)
    "m_w":   {"label":"Liberty Ave & West Ave",   "pos_3d":[-30,0, -3], "type":"intersection"},
    "m_A":   {"label":"Liberty Ave & Apple St",   "pos_3d":[-18,0, -3], "type":"intersection"},
    "m_AB":  {"label":"Liberty Ave & Central Blvd", "pos_3d":[-10,0, -3], "type":"intersection"},
    "m_B":   {"label":"Liberty Ave & Baker Ave",    "pos_3d":[ -2,0, -3], "type":"intersection"},
    "m_BC":  {"label":"Liberty Ave & Cedar Ln",     "pos_3d":[  6,0, -3], "type":"intersection"},
    "m_C":   {"label":"Liberty Ave & Cedar Pkwy",   "pos_3d":[ 14,0, -3], "type":"intersection"},
    "m_CD":  {"label":"Liberty Ave & Daisy Rd",     "pos_3d":[ 22,0, -3], "type":"intersection"},
    "m_D":   {"label":"Liberty Ave & Daisy Connector", "pos_3d":[ 30,0, -3], "type":"intersection"},
    "m_e":   {"label":"Liberty Ave & East Blvd",    "pos_3d":[ 38,0, -3], "type":"intersection"},

    # Row-1 north road (two-way, z=3)
    "r1_w":  {"label":"Oak St & West Ave",         "pos_3d":[-30,0,  3], "type":"intersection"},
    "r1_E":  {"label":"Oak St & Elm Way Connector", "pos_3d":[-11,0,  3], "type":"intersection"},
    "r1_EF": {"label":"Oak St & Central Blvd",     "pos_3d":[ -4,0,  3], "type":"intersection"},
    "r1_F":  {"label":"Oak St & Fig Blvd Connector", "pos_3d":[  3,0,  3], "type":"intersection"},
    "r1_FG": {"label":"Oak St & Pine Pkwy",        "pos_3d":[ 10,0,  3], "type":"intersection"},
    "r1_G":  {"label":"Oak St & Grove Ct Connector", "pos_3d":[ 17,0,  3], "type":"intersection"},
    "r1_e":  {"label":"Oak St & East Blvd",        "pos_3d":[ 38,0,  3], "type":"intersection"},

    # South perimeter (one-way E→W, z=19)
    "s_e":   {"label":"Coastline Hwy & East Blvd",       "pos_3d":[ 38,0, 19], "type":"intersection"},
    "s_G":   {"label":"Coastline Hwy & Grove Ct South",  "pos_3d":[ 17,0, 19], "type":"intersection"},
    "s_FG":  {"label":"Coastline Hwy & Pine Pkwy South", "pos_3d":[ 10,0, 19], "type":"intersection"},
    "s_F":   {"label":"Coastline Hwy & Fig Blvd South",  "pos_3d":[  3,0, 19], "type":"intersection"},
    "s_EF":  {"label":"Coastline Hwy & Central Blvd South", "pos_3d":[ -4,0, 19], "type":"intersection"},
    "s_E":   {"label":"Coastline Hwy & Elm Way South",   "pos_3d":[-11,0, 19], "type":"intersection"},
    "s_w":   {"label":"Coastline Hwy & West Ave",        "pos_3d":[-30,0, 19], "type":"intersection"},

    # ---- Block A Driveway Nodes (X=-18) ----
    "drv_A1": {"label":"", "pos_3d":[-18,0,-20], "type":"intersection"},
    "drv_A2": {"label":"", "pos_3d":[-18,0,-14], "type":"intersection"},
    "drv_A3": {"label":"", "pos_3d":[-18,0,-8],  "type":"intersection"},

    # Block A houses (Alley X=-18)
    "a1":{"label":"12 Apple St", "pos_3d":[-23,0,-20],"type":"address"},
    "a4":{"label":"18 Apple St", "pos_3d":[-13,0,-20],"type":"address"},
    "a2":{"label":"14 Apple St", "pos_3d":[-23,0,-14],"type":"address"},
    "a5":{"label":"20 Apple St", "pos_3d":[-13,0,-14],"type":"address"},
    "a3":{"label":"16 Apple St", "pos_3d":[-23,0,-8], "type":"address"},
    "a6":{"label":"22 Apple St", "pos_3d":[-13,0,-8], "type":"address"},

    # ---- Block B Driveway Nodes (X=-2) ----
    "drv_B1": {"label":"", "pos_3d":[-2,0,-20], "type":"intersection"},
    "drv_B2": {"label":"", "pos_3d":[-2,0,-14], "type":"intersection"},
    "drv_B3": {"label":"", "pos_3d":[-2,0,-8],  "type":"intersection"},

    # Block B houses (Alley X=-2)
    "b1":{"label":"5 Baker Ave",  "pos_3d":[ -7,0,-20],"type":"address"},
    "b4":{"label":"11 Baker Ave", "pos_3d":[  3,0,-20],"type":"address"},
    "b2":{"label":"7 Baker Ave",  "pos_3d":[ -7,0,-14],"type":"address"},
    "b5":{"label":"13 Baker Ave", "pos_3d":[  3,0,-14],"type":"address"},
    "b3":{"label":"9 Baker Ave",  "pos_3d":[ -7,0,-8], "type":"address"},
    "b6":{"label":"15 Baker Ave", "pos_3d":[  3,0,-8], "type":"address"},

    # ---- Block C Driveway Nodes (X=14) ----
    "drv_C1": {"label":"", "pos_3d":[14,0,-20], "type":"intersection"},
    "drv_C2": {"label":"", "pos_3d":[14,0,-14], "type":"intersection"},
    "drv_C3": {"label":"", "pos_3d":[14,0,-8],  "type":"intersection"},

    # Block C houses (Alley X=14)
    "c1":{"label":"3 Cedar Ln",  "pos_3d":[  9,0,-20],"type":"address"},
    "c4":{"label":"9 Cedar Ln",  "pos_3d":[ 19,0,-20],"type":"address"},
    "c2":{"label":"5 Cedar Ln",  "pos_3d":[  9,0,-14],"type":"address"},
    "c5":{"label":"11 Cedar Ln", "pos_3d":[ 19,0,-14],"type":"address"},
    "c3":{"label":"7 Cedar Ln",  "pos_3d":[  9,0,-8], "type":"address"},
    "c6":{"label":"13 Cedar Ln", "pos_3d":[ 19,0,-8], "type":"address"},

    # ---- Block D Driveway Nodes (X=30) ----
    "drv_D1": {"label":"", "pos_3d":[30,0,-20], "type":"intersection"},
    "drv_D2": {"label":"", "pos_3d":[30,0,-14], "type":"intersection"},
    "drv_D3": {"label":"", "pos_3d":[30,0,-8],  "type":"intersection"},

    # Block D houses (Alley X=30)
    "d1":{"label":"1 Daisy Rd",  "pos_3d":[ 25,0,-20],"type":"address"},
    "d4":{"label":"7 Daisy Rd",  "pos_3d":[ 35,0,-20],"type":"address"},
    "d2":{"label":"3 Daisy Rd",  "pos_3d":[ 25,0,-14],"type":"address"},
    "d5":{"label":"9 Daisy Rd",  "pos_3d":[ 35,0,-14],"type":"address"},
    "d3":{"label":"5 Daisy Rd",  "pos_3d":[ 25,0,-8], "type":"address"},
    "d6":{"label":"11 Daisy Rd", "pos_3d":[ 35,0,-8], "type":"address"},

    # ---- Block E Driveway Nodes (X=-11) ----
    "drv_E1": {"label":"", "pos_3d":[-11,0, 7], "type":"intersection"},
    "drv_E2": {"label":"", "pos_3d":[-11,0,11], "type":"intersection"},
    "drv_E3": {"label":"", "pos_3d":[-11,0,15], "type":"intersection"},

    # Block E houses (Alley X=-11)
    "e1":{"label":"2 Elm Way",   "pos_3d":[-16,0, 7],"type":"address"},
    "e4":{"label":"8 Elm Way",   "pos_3d":[ -6,0, 7],"type":"address"},
    "e2":{"label":"4 Elm Way",   "pos_3d":[-16,0,11],"type":"address"},
    "e5":{"label":"10 Elm Way",  "pos_3d":[ -6,0,11],"type":"address"},
    "e3":{"label":"6 Elm Way",   "pos_3d":[-16,0,15],"type":"address"},
    "e6":{"label":"12 Elm Way",  "pos_3d":[ -6,0,15],"type":"address"},

    # ---- Block F Driveway Nodes (X=3) ----
    "drv_F1": {"label":"", "pos_3d":[3,0, 7], "type":"intersection"},
    "drv_F2": {"label":"", "pos_3d":[3,0,11], "type":"intersection"},
    "drv_F3": {"label":"", "pos_3d":[3,0,15], "type":"intersection"},

    # Block F houses (Alley X=3)
    "f1":{"label":"1 Fig Blvd",  "pos_3d":[ -2,0, 7],"type":"address"},
    "f4":{"label":"7 Fig Blvd",  "pos_3d":[  8,0, 7],"type":"address"},
    "f2":{"label":"3 Fig Blvd",  "pos_3d":[ -2,0,11],"type":"address"},
    "f5":{"label":"9 Fig Blvd",  "pos_3d":[  8,0,11],"type":"address"},
    "f3":{"label":"5 Fig Blvd",  "pos_3d":[ -2,0,15],"type":"address"},
    "f6":{"label":"11 Fig Blvd", "pos_3d":[  8,0,15],"type":"address"},

    # ---- Block G Driveway Nodes (X=17) ----
    "drv_G1": {"label":"", "pos_3d":[17,0, 7], "type":"intersection"},
    "drv_G2": {"label":"", "pos_3d":[17,0,11], "type":"intersection"},
    "drv_G3": {"label":"", "pos_3d":[17,0,15], "type":"intersection"},

    # Block G houses (Alley X=17)
    "g1":{"label":"10 Grove Ct", "pos_3d":[ 12,0, 7],"type":"address"},
    "g4":{"label":"16 Grove Ct", "pos_3d":[ 22,0, 7],"type":"address"},
    "g2":{"label":"12 Grove Ct", "pos_3d":[ 12,0,11],"type":"address"},
    "g5":{"label":"18 Grove Ct", "pos_3d":[ 22,0,11],"type":"address"},
    "g3":{"label":"14 Grove Ct", "pos_3d":[ 12,0,15],"type":"address"},
    "g6":{"label":"20 Grove Ct", "pos_3d":[ 22,0,15],"type":"address"},
}

def _elevation(x: float, z: float) -> float:
    """
    Synthetic elevation model (a gentle hill + a small dip) used to demonstrate
    fuel-aware routing (uphill costs more).

    Note: We keep pos_3d y=0 for the 3D scene; elevation is a separate value.
    """
    # Hill centered near the town's "middle road" area.
    hx, hz = 6.0, -3.0
    dx, dz = (x - hx), (z - hz)
    hill = 4.0 * math.exp(-(dx * dx + dz * dz) / 520.0)

    # A shallow dip near the south-west to add variation.
    vx, vz = -22.0, 17.0
    dx2, dz2 = (x - vx), (z - vz)
    valley = 1.8 * math.exp(-(dx2 * dx2 + dz2 * dz2) / 700.0)

    return hill - valley

# Attach elevation to every node.
for _nid, _d in NODES.items():
    x, _, z = _d["pos_3d"]
    _d["elev"] = round(_elevation(x, z), 3)

def _dist(n1: str, n2: str) -> float:
    p1, p2 = NODES[n1]["pos_3d"], NODES[n2]["pos_3d"]
    # Return Euclidean distance correctly
    return math.sqrt((p1[0]-p2[0])**2 + (p1[2]-p2[2])**2)

# Edges are defined as: (src, tgt, one_way, road_type)
# road_type implies speed limit: 'main' (fast), 'local' (medium), 'alley' (slow)
_RAW: List[Tuple[str, str, bool, str]] = [
    # Warehouse
    ("warehouse","n_wh", False, "main"),

    # North perimeter ONE-WAY W→E
    ("n_wh","n_A",True, "main"), ("n_A","n_AB",True, "main"), ("n_AB","n_B",True, "main"),
    ("n_B","n_BC",True, "main"), ("n_BC","n_C",True, "main"), ("n_C","n_CD",True, "main"),
    ("n_CD","n_D",True, "main"), ("n_D","n_De",True, "main"),

    # East column ONE-WAY N→S
    ("n_De","m_e",True, "main"), ("m_e","r1_e",True, "main"), ("r1_e","s_e",True, "main"),

    # South perimeter ONE-WAY E→W
    ("s_e","s_G",True, "main"), ("s_G","s_FG",True, "main"), ("s_FG","s_F",True, "main"),
    ("s_F","s_EF",True, "main"), ("s_EF","s_E",True, "main"), ("s_E","s_w",True, "main"),

    # West column ONE-WAY S→N
    ("s_w","r1_w",True, "main"), ("r1_w","m_w",True, "main"), ("m_w","n_wh",True, "main"),

    # Middle horizontal two-way
    ("m_w","m_A",False, "local"), ("m_A","m_AB",False, "local"), ("m_AB","m_B",False, "local"),
    ("m_B","m_BC",False, "local"), ("m_BC","m_C",False, "local"), ("m_C","m_CD",False, "local"),
    ("m_CD","m_D",False, "local"), ("m_D","m_e",False, "local"),

    # Middle→row1 connectors two-way
    ("m_w","r1_w",False, "local"), ("m_AB","r1_EF",False, "local"), ("m_BC","r1_FG",False, "local"),
    ("m_e","r1_e",False, "local"),

    # Row-1 north horizontal two-way
    ("r1_w","r1_E",False, "local"), ("r1_E","r1_EF",False, "local"), ("r1_EF","r1_F",False, "local"),
    ("r1_F","r1_FG",False, "local"), ("r1_FG","r1_G",False, "local"), ("r1_G","r1_e",False, "local"),

    # Inter-block verticals two-way
    ("n_AB","m_AB",False, "local"), ("n_BC","m_BC",False, "local"), ("n_CD","m_CD",False, "local"),
    ("r1_EF","s_EF",False, "local"), ("r1_FG","s_FG",False, "local"),

    # --- Block A Alley & Driveways ---
    ("n_A","drv_A1",False, "alley"), ("drv_A1","drv_A2",False, "alley"), ("drv_A2","drv_A3",False, "alley"), ("drv_A3","m_A",False, "alley"),
    ("drv_A1","a1",False, "alley"), ("drv_A1","a4",False, "alley"),
    ("drv_A2","a2",False, "alley"), ("drv_A2","a5",False, "alley"),
    ("drv_A3","a3",False, "alley"), ("drv_A3","a6",False, "alley"),

    # --- Block B Alley & Driveways ---
    ("n_B","drv_B1",False, "alley"), ("drv_B1","drv_B2",False, "alley"), ("drv_B2","drv_B3",False, "alley"), ("drv_B3","m_B",False, "alley"),
    ("drv_B1","b1",False, "alley"), ("drv_B1","b4",False, "alley"),
    ("drv_B2","b2",False, "alley"), ("drv_B2","b5",False, "alley"),
    ("drv_B3","b3",False, "alley"), ("drv_B3","b6",False, "alley"),

    # --- Block C Alley & Driveways ---
    ("n_C","drv_C1",False, "alley"), ("drv_C1","drv_C2",False, "alley"), ("drv_C2","drv_C3",False, "alley"), ("drv_C3","m_C",False, "alley"),
    ("drv_C1","c1",False, "alley"), ("drv_C1","c4",False, "alley"),
    ("drv_C2","c2",False, "alley"), ("drv_C2","c5",False, "alley"),
    ("drv_C3","c3",False, "alley"), ("drv_C3","c6",False, "alley"),

    # --- Block D Alley & Driveways ---
    ("n_D","drv_D1",False, "alley"), ("drv_D1","drv_D2",False, "alley"), ("drv_D2","drv_D3",False, "alley"), ("drv_D3","m_D",False, "alley"),
    ("drv_D1","d1",False, "alley"), ("drv_D1","d4",False, "alley"),
    ("drv_D2","d2",False, "alley"), ("drv_D2","d5",False, "alley"),
    ("drv_D3","d3",False, "alley"), ("drv_D3","d6",False, "alley"),

    # --- Block E Alley & Driveways ---
    ("r1_E","drv_E1",False, "alley"), ("drv_E1","drv_E2",False, "alley"), ("drv_E2","drv_E3",False, "alley"), ("drv_E3","s_E",False, "alley"),
    ("drv_E1","e1",False, "alley"), ("drv_E1","e4",False, "alley"),
    ("drv_E2","e2",False, "alley"), ("drv_E2","e5",False, "alley"),
    ("drv_E3","e3",False, "alley"), ("drv_E3","e6",False, "alley"),

    # --- Block F Alley & Driveways ---
    ("r1_F","drv_F1",False, "alley"), ("drv_F1","drv_F2",False, "alley"), ("drv_F2","drv_F3",False, "alley"), ("drv_F3","s_F",False, "alley"),
    ("drv_F1","f1",False, "alley"), ("drv_F1","f4",False, "alley"),
    ("drv_F2","f2",False, "alley"), ("drv_F2","f5",False, "alley"),
    ("drv_F3","f3",False, "alley"), ("drv_F3","f6",False, "alley"),

    # --- Block G Alley & Driveways ---
    ("r1_G","drv_G1",False, "alley"), ("drv_G1","drv_G2",False, "alley"), ("drv_G2","drv_G3",False, "alley"), ("drv_G3","s_G",False, "alley"),
    ("drv_G1","g1",False, "alley"), ("drv_G1","g4",False, "alley"),
    ("drv_G2","g2",False, "alley"), ("drv_G2","g5",False, "alley"),
    ("drv_G3","g3",False, "alley"), ("drv_G3","g6",False, "alley"),
]

def _speed(road_type: str) -> float:
    # Speed multipliers (higher means faster transit time)
    if road_type == "main": return 1.5
    if road_type == "local": return 1.0
    return 0.5  # alley

def _make_edges():
    edges = []
    for a, b, ow, road_type in _RAW:
        dist = _dist(a, b)
        speed = _speed(road_type)
        time_cost = dist / speed
        edges.append((a, b, time_cost, dist, ow, speed, road_type))
    return edges

EDGES = _make_edges()


def _build_adjacency():
    adj = {n: [] for n in NODES}
    for src, tgt, time_cost, raw_dist, one_way, speed, r_type in EDGES:
        adj[src].append((tgt, time_cost, raw_dist))
        if not one_way:
            adj[tgt].append((src, time_cost, raw_dist))
    return adj

ADJ = _build_adjacency()


def get_graph_data() -> dict:
    return {
        "nodes": [
            {"id": nid, "label": d["label"], "pos_3d": d["pos_3d"], "type": d["type"], "elev": d.get("elev", 0.0)}
            for nid, d in NODES.items()
        ],
        "edges": [
            {"source": src, "target": tgt, "time_cost": tc, "distance": rd, "one_way": ow, "road_type": r_type, "speed_limit": sp}
            for src, tgt, tc, rd, ow, sp, r_type in EDGES
        ],
    }
