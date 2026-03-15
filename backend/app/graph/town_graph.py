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
    "n_wh":  {"label":"N-WH",  "pos_3d":[-30,0,-25], "type":"intersection"},
    "n_A":   {"label":"N-A",   "pos_3d":[-18,0,-25], "type":"intersection"},
    "n_AB":  {"label":"N-AB",  "pos_3d":[-10,0,-25], "type":"intersection"},
    "n_B":   {"label":"N-B",   "pos_3d":[ -2,0,-25], "type":"intersection"},
    "n_BC":  {"label":"N-BC",  "pos_3d":[  6,0,-25], "type":"intersection"},
    "n_C":   {"label":"N-C",   "pos_3d":[ 14,0,-25], "type":"intersection"},
    "n_CD":  {"label":"N-CD",  "pos_3d":[ 22,0,-25], "type":"intersection"},
    "n_D":   {"label":"N-D",   "pos_3d":[ 30,0,-25], "type":"intersection"},
    "n_De":  {"label":"N-De",  "pos_3d":[ 38,0,-25], "type":"intersection"},

    # Middle road (two-way, z=-3)
    "m_w":   {"label":"M-W",   "pos_3d":[-30,0, -3], "type":"intersection"},
    "m_A":   {"label":"M-A",   "pos_3d":[-18,0, -3], "type":"intersection"},
    "m_AB":  {"label":"M-AB",  "pos_3d":[-10,0, -3], "type":"intersection"},
    "m_B":   {"label":"M-B",   "pos_3d":[ -2,0, -3], "type":"intersection"},
    "m_BC":  {"label":"M-BC",  "pos_3d":[  6,0, -3], "type":"intersection"},
    "m_C":   {"label":"M-C",   "pos_3d":[ 14,0, -3], "type":"intersection"},
    "m_CD":  {"label":"M-CD",  "pos_3d":[ 22,0, -3], "type":"intersection"},
    "m_D":   {"label":"M-D",   "pos_3d":[ 30,0, -3], "type":"intersection"},
    "m_e":   {"label":"M-E",   "pos_3d":[ 38,0, -3], "type":"intersection"},

    # Row-1 north road (two-way, z=3)
    "r1_w":  {"label":"R1-W",  "pos_3d":[-30,0,  3], "type":"intersection"},
    "r1_E":  {"label":"R1-E",  "pos_3d":[-11,0,  3], "type":"intersection"},
    "r1_EF": {"label":"R1-EF", "pos_3d":[ -4,0,  3], "type":"intersection"},
    "r1_F":  {"label":"R1-F",  "pos_3d":[  3,0,  3], "type":"intersection"},
    "r1_FG": {"label":"R1-FG", "pos_3d":[ 10,0,  3], "type":"intersection"},
    "r1_G":  {"label":"R1-G",  "pos_3d":[ 17,0,  3], "type":"intersection"},
    "r1_e":  {"label":"R1-GE", "pos_3d":[ 38,0,  3], "type":"intersection"},

    # South perimeter (one-way E→W, z=19)
    "s_e":   {"label":"S-E",   "pos_3d":[ 38,0, 19], "type":"intersection"},
    "s_G":   {"label":"S-G",   "pos_3d":[ 17,0, 19], "type":"intersection"},
    "s_FG":  {"label":"S-FG",  "pos_3d":[ 10,0, 19], "type":"intersection"},
    "s_F":   {"label":"S-F",   "pos_3d":[  3,0, 19], "type":"intersection"},
    "s_EF":  {"label":"S-EF",  "pos_3d":[ -4,0, 19], "type":"intersection"},
    "s_E":   {"label":"S-E2",  "pos_3d":[-11,0, 19], "type":"intersection"},
    "s_w":   {"label":"S-W",   "pos_3d":[-30,0, 19], "type":"intersection"},

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

def _dist(n1: str, n2: str) -> float:
    p1, p2 = NODES[n1]["pos_3d"], NODES[n2]["pos_3d"]
    return round(math.sqrt((p1[0]-p2[0])**2 + (p1[2]-p2[2])**2), 2)

# (src, tgt, one_way)  — one_way=True means directed src→tgt only
_RAW: List[Tuple[str, str, bool]] = [
    # Warehouse
    ("warehouse","n_wh", False),

    # North perimeter ONE-WAY W→E
    ("n_wh","n_A",True), ("n_A","n_AB",True), ("n_AB","n_B",True),
    ("n_B","n_BC",True), ("n_BC","n_C",True), ("n_C","n_CD",True),
    ("n_CD","n_D",True), ("n_D","n_De",True),

    # East column ONE-WAY N→S
    ("n_De","m_e",True), ("m_e","r1_e",True), ("r1_e","s_e",True),

    # South perimeter ONE-WAY E→W
    ("s_e","s_G",True), ("s_G","s_FG",True), ("s_FG","s_F",True),
    ("s_F","s_EF",True), ("s_EF","s_E",True), ("s_E","s_w",True),

    # West column ONE-WAY S→N
    ("s_w","r1_w",True), ("r1_w","m_w",True), ("m_w","n_wh",True),

    # Middle horizontal two-way
    ("m_w","m_A",False), ("m_A","m_AB",False), ("m_AB","m_B",False),
    ("m_B","m_BC",False), ("m_BC","m_C",False), ("m_C","m_CD",False),
    ("m_CD","m_D",False), ("m_D","m_e",False),

    # Middle→row1 connectors two-way
    ("m_w","r1_w",False), ("m_AB","r1_EF",False), ("m_BC","r1_FG",False),
    ("m_e","r1_e",False),

    # Row-1 north horizontal two-way
    ("r1_w","r1_E",False), ("r1_E","r1_EF",False), ("r1_EF","r1_F",False),
    ("r1_F","r1_FG",False), ("r1_FG","r1_G",False), ("r1_G","r1_e",False),

    # Inter-block verticals two-way
    ("n_AB","m_AB",False), ("n_BC","m_BC",False), ("n_CD","m_CD",False),
    ("r1_EF","s_EF",False), ("r1_FG","s_FG",False),

    # --- Block A Alley & Driveways ---
    ("n_A","drv_A1",False), ("drv_A1","drv_A2",False), ("drv_A2","drv_A3",False), ("drv_A3","m_A",False),
    ("drv_A1","a1",False), ("drv_A1","a4",False),
    ("drv_A2","a2",False), ("drv_A2","a5",False),
    ("drv_A3","a3",False), ("drv_A3","a6",False),

    # --- Block B Alley & Driveways ---
    ("n_B","drv_B1",False), ("drv_B1","drv_B2",False), ("drv_B2","drv_B3",False), ("drv_B3","m_B",False),
    ("drv_B1","b1",False), ("drv_B1","b4",False),
    ("drv_B2","b2",False), ("drv_B2","b5",False),
    ("drv_B3","b3",False), ("drv_B3","b6",False),

    # --- Block C Alley & Driveways ---
    ("n_C","drv_C1",False), ("drv_C1","drv_C2",False), ("drv_C2","drv_C3",False), ("drv_C3","m_C",False),
    ("drv_C1","c1",False), ("drv_C1","c4",False),
    ("drv_C2","c2",False), ("drv_C2","c5",False),
    ("drv_C3","c3",False), ("drv_C3","c6",False),

    # --- Block D Alley & Driveways ---
    ("n_D","drv_D1",False), ("drv_D1","drv_D2",False), ("drv_D2","drv_D3",False), ("drv_D3","m_D",False),
    ("drv_D1","d1",False), ("drv_D1","d4",False),
    ("drv_D2","d2",False), ("drv_D2","d5",False),
    ("drv_D3","d3",False), ("drv_D3","d6",False),

    # --- Block E Alley & Driveways ---
    ("r1_E","drv_E1",False), ("drv_E1","drv_E2",False), ("drv_E2","drv_E3",False), ("drv_E3","s_E",False),
    ("drv_E1","e1",False), ("drv_E1","e4",False),
    ("drv_E2","e2",False), ("drv_E2","e5",False),
    ("drv_E3","e3",False), ("drv_E3","e6",False),

    # --- Block F Alley & Driveways ---
    ("r1_F","drv_F1",False), ("drv_F1","drv_F2",False), ("drv_F2","drv_F3",False), ("drv_F3","s_F",False),
    ("drv_F1","f1",False), ("drv_F1","f4",False),
    ("drv_F2","f2",False), ("drv_F2","f5",False),
    ("drv_F3","f3",False), ("drv_F3","f6",False),

    # --- Block G Alley & Driveways ---
    ("r1_G","drv_G1",False), ("drv_G1","drv_G2",False), ("drv_G2","drv_G3",False), ("drv_G3","s_G",False),
    ("drv_G1","g1",False), ("drv_G1","g4",False),
    ("drv_G2","g2",False), ("drv_G2","g5",False),
    ("drv_G3","g3",False), ("drv_G3","g6",False),
]

def _make_edges():
    return [(a, b, _dist(a, b), ow) for a, b, ow in _RAW]

EDGES = _make_edges()


def _build_adjacency():
    adj = {n: [] for n in NODES}
    for src, tgt, w, one_way in EDGES:
        adj[src].append((tgt, w))
        if not one_way:
            adj[tgt].append((src, w))
    return adj

ADJ = _build_adjacency()


def get_graph_data() -> dict:
    return {
        "nodes": [
            {"id": nid, "label": d["label"], "pos_3d": d["pos_3d"], "type": d["type"]}
            for nid, d in NODES.items()
        ],
        "edges": [
            {"source": src, "target": tgt, "weight": w, "one_way": ow}
            for src, tgt, w, ow in EDGES
        ],
    }
