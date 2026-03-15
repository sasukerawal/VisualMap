"""
Town graph — 7 city blocks × 6 houses = 42 delivery addresses.

One-way perimeter loop:
  North road: W → E
  East column: N → S
  South road:  E → W
  West column: S → N

Middle inter-row road and block driveways: bidirectional.
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

    # Block A houses (center -18, -16)
    "a1":{"label":"12 Apple St", "pos_3d":[-22,0,-19],"type":"address"},
    "a2":{"label":"14 Apple St", "pos_3d":[-18,0,-19],"type":"address"},
    "a3":{"label":"16 Apple St", "pos_3d":[-14,0,-19],"type":"address"},
    "a4":{"label":"18 Apple St", "pos_3d":[-22,0,-13],"type":"address"},
    "a5":{"label":"20 Apple St", "pos_3d":[-18,0,-13],"type":"address"},
    "a6":{"label":"22 Apple St", "pos_3d":[-14,0,-13],"type":"address"},

    # Block B houses (center -2, -16)
    "b1":{"label":"5 Baker Ave",  "pos_3d":[ -6,0,-19],"type":"address"},
    "b2":{"label":"7 Baker Ave",  "pos_3d":[ -2,0,-19],"type":"address"},
    "b3":{"label":"9 Baker Ave",  "pos_3d":[  2,0,-19],"type":"address"},
    "b4":{"label":"11 Baker Ave", "pos_3d":[ -6,0,-13],"type":"address"},
    "b5":{"label":"13 Baker Ave", "pos_3d":[ -2,0,-13],"type":"address"},
    "b6":{"label":"15 Baker Ave", "pos_3d":[  2,0,-13],"type":"address"},

    # Block C houses (center 14, -16)
    "c1":{"label":"3 Cedar Ln",  "pos_3d":[ 10,0,-19],"type":"address"},
    "c2":{"label":"5 Cedar Ln",  "pos_3d":[ 14,0,-19],"type":"address"},
    "c3":{"label":"7 Cedar Ln",  "pos_3d":[ 18,0,-19],"type":"address"},
    "c4":{"label":"9 Cedar Ln",  "pos_3d":[ 10,0,-13],"type":"address"},
    "c5":{"label":"11 Cedar Ln", "pos_3d":[ 14,0,-13],"type":"address"},
    "c6":{"label":"13 Cedar Ln", "pos_3d":[ 18,0,-13],"type":"address"},

    # Block D houses (center 30, -16)
    "d1":{"label":"1 Daisy Rd",  "pos_3d":[ 26,0,-19],"type":"address"},
    "d2":{"label":"3 Daisy Rd",  "pos_3d":[ 30,0,-19],"type":"address"},
    "d3":{"label":"5 Daisy Rd",  "pos_3d":[ 34,0,-19],"type":"address"},
    "d4":{"label":"7 Daisy Rd",  "pos_3d":[ 26,0,-13],"type":"address"},
    "d5":{"label":"9 Daisy Rd",  "pos_3d":[ 30,0,-13],"type":"address"},
    "d6":{"label":"11 Daisy Rd", "pos_3d":[ 34,0,-13],"type":"address"},

    # Block E houses (center -11, 10)
    "e1":{"label":"2 Elm Way",   "pos_3d":[-15,0,  7],"type":"address"},
    "e2":{"label":"4 Elm Way",   "pos_3d":[-11,0,  7],"type":"address"},
    "e3":{"label":"6 Elm Way",   "pos_3d":[ -7,0,  7],"type":"address"},
    "e4":{"label":"8 Elm Way",   "pos_3d":[-15,0, 13],"type":"address"},
    "e5":{"label":"10 Elm Way",  "pos_3d":[-11,0, 13],"type":"address"},
    "e6":{"label":"12 Elm Way",  "pos_3d":[ -7,0, 13],"type":"address"},

    # Block F houses (center 3, 10)
    "f1":{"label":"1 Fig Blvd",  "pos_3d":[ -1,0,  7],"type":"address"},
    "f2":{"label":"3 Fig Blvd",  "pos_3d":[  3,0,  7],"type":"address"},
    "f3":{"label":"5 Fig Blvd",  "pos_3d":[  7,0,  7],"type":"address"},
    "f4":{"label":"7 Fig Blvd",  "pos_3d":[ -1,0, 13],"type":"address"},
    "f5":{"label":"9 Fig Blvd",  "pos_3d":[  3,0, 13],"type":"address"},
    "f6":{"label":"11 Fig Blvd", "pos_3d":[  7,0, 13],"type":"address"},

    # Block G houses (center 17, 10)
    "g1":{"label":"10 Grove Ct", "pos_3d":[ 13,0,  7],"type":"address"},
    "g2":{"label":"12 Grove Ct", "pos_3d":[ 17,0,  7],"type":"address"},
    "g3":{"label":"14 Grove Ct", "pos_3d":[ 21,0,  7],"type":"address"},
    "g4":{"label":"16 Grove Ct", "pos_3d":[ 13,0, 13],"type":"address"},
    "g5":{"label":"18 Grove Ct", "pos_3d":[ 17,0, 13],"type":"address"},
    "g6":{"label":"20 Grove Ct", "pos_3d":[ 21,0, 13],"type":"address"},
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

    # North↔middle vertical two-way
    ("n_A","m_A",False), ("n_AB","m_AB",False), ("n_B","m_B",False),
    ("n_BC","m_BC",False), ("n_C","m_C",False), ("n_CD","m_CD",False),
    ("n_D","m_D",False),

    # Middle horizontal two-way
    ("m_w","m_A",False), ("m_A","m_AB",False), ("m_AB","m_B",False),
    ("m_B","m_BC",False), ("m_BC","m_C",False), ("m_C","m_CD",False),
    ("m_CD","m_D",False), ("m_D","m_e",False),

    # Middle→row1 connectors two-way
    ("m_w","r1_w",False), ("r1_w","r1_E",False),
    ("m_AB","r1_EF",False), ("m_BC","r1_FG",False), ("m_e","r1_e",False),

    # Row-1 north horizontal two-way
    ("r1_E","r1_EF",False), ("r1_EF","r1_F",False),
    ("r1_F","r1_FG",False), ("r1_FG","r1_G",False), ("r1_G","r1_e",False),

    # Row-1 south verticals two-way
    ("r1_E","s_E",False), ("r1_EF","s_EF",False), ("r1_F","s_F",False),
    ("r1_FG","s_FG",False), ("r1_G","s_G",False),

    # House driveways (two-way)
    ("n_A","a1",False),("n_A","a2",False),("n_A","a3",False),
    ("m_A","a4",False),("m_A","a5",False),("m_A","a6",False),
    ("n_B","b1",False),("n_B","b2",False),("n_B","b3",False),
    ("m_B","b4",False),("m_B","b5",False),("m_B","b6",False),
    ("n_C","c1",False),("n_C","c2",False),("n_C","c3",False),
    ("m_C","c4",False),("m_C","c5",False),("m_C","c6",False),
    ("n_D","d1",False),("n_D","d2",False),("n_D","d3",False),
    ("m_D","d4",False),("m_D","d5",False),("m_D","d6",False),
    ("r1_E","e1",False),("r1_E","e2",False),("r1_E","e3",False),
    ("s_E","e4",False),("s_E","e5",False),("s_E","e6",False),
    ("r1_F","f1",False),("r1_F","f2",False),("r1_F","f3",False),
    ("s_F","f4",False),("s_F","f5",False),("s_F","f6",False),
    ("r1_G","g1",False),("r1_G","g2",False),("r1_G","g3",False),
    ("s_G","g4",False),("s_G","g5",False),("s_G","g6",False),
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
