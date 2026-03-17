"""
Pydantic schemas for VisualMap API request / response models.
"""

from __future__ import annotations
from typing import Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class PathRequest(BaseModel):
    algorithm: Literal["dijkstra", "astar", "bellman_ford"] = Field(
        default="dijkstra",
        description="Pathfinding algorithm to use"
    )
    start: str = Field(
        default="warehouse",
        description="Node ID of the starting location"
    )
    destinations: List[str] = Field(
        description="Ordered list of delivery destination node IDs"
    )
    order_mode: Literal["manual", "optimized"] = Field(
        default="optimized",
        description="'manual' respects the given order; 'optimized' uses nearest-neighbor TSP"
    )
    segment_index: Optional[int] = Field(
        default=None,
        description="Optional segment index for step-by-step trace: 0=warehouse→dest[0], 1=dest[0]→dest[1], ..."
    )


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class ExplorationStep(BaseModel):
    node: str
    distance: float
    step: int
    action: str          # "visit" | "update" | "settle"
    description: str


class PathSegment(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str   = Field(alias="to")
    path: List[str]
    distance: float

    model_config = {"populate_by_name": True}


class PathResponse(BaseModel):
    algorithm: str
    path: List[str]
    total_distance: float
    total_time: Optional[float] = None
    total_physical_distance: Optional[float] = None
    visited_nodes: List[str]
    exploration_order: List[ExplorationStep]
    edges_traversed: List[List[str]]
    computation_time_ms: float
    efficiency_metrics: Optional[dict] = None
    segments: List[PathSegment]


# ---------------------------------------------------------------------------
# Step-by-Step / Decision-tree Models
# ---------------------------------------------------------------------------

class TreeNode(BaseModel):
    id: str
    label: str
    data: dict = {}


class TreeEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str = ""


class AlgoStep(BaseModel):
    step: int
    action: str
    node: str
    distance: float
    raw_distance: Optional[float] = None
    fuel_cost: Optional[float] = None
    heuristic: Optional[float] = None   # A* h(n)
    f_score: Optional[float] = None     # A* f(n)
    f_fuel: Optional[float] = None      # Fuel-aware A* f_fuel(n)
    round_num: Optional[int] = None     # Bellman-Ford relaxation round
    neighbors_updated: List[dict] = []
    description: str
    explanation: Optional[str] = None
    active_line: Optional[int] = None
    math_breakdown: Optional[dict] = None
    # v2 teaching narration payload (structured + lecture-style strings).
    narration: Optional["AlgoNarration"] = None


NumberLike = Union[float, str]


class AlgoEdge(BaseModel):
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    time_cost: Optional[float] = None
    physical_distance: Optional[float] = None
    fuel_cost: Optional[float] = None
    elev_delta: Optional[float] = None
    fuel_multiplier: Optional[float] = None

    model_config = {"populate_by_name": True}


class AlgoComparison(BaseModel):
    """
    One comparison in a step (usually an edge relaxation check).
    This is intentionally algorithm-agnostic; algorithm-specific fields are optional.
    """
    kind: Literal["edge_relaxation", "edge_check", "node_selection", "goal_check", "note"] = "edge_relaxation"
    edge: Optional[AlgoEdge] = None
    node: Optional[str] = None  # e.g. "current node u" for selection
    updated: bool = False

    # Core comparison numbers (Dijkstra/Bellman-Ford time distance).
    old_value: Optional[NumberLike] = None
    candidate_value: Optional[NumberLike] = None
    new_value: Optional[NumberLike] = None

    # Optional additional metrics.
    old_raw: Optional[NumberLike] = None
    candidate_raw: Optional[NumberLike] = None
    new_raw: Optional[NumberLike] = None

    old_fuel: Optional[NumberLike] = None
    candidate_fuel: Optional[NumberLike] = None
    new_fuel: Optional[NumberLike] = None

    old_parent: Optional[str] = None
    new_parent: Optional[str] = None

    # A* specific: g/h/f scoring
    old_g: Optional[NumberLike] = None
    candidate_g: Optional[NumberLike] = None
    new_g: Optional[NumberLike] = None
    h: Optional[NumberLike] = None
    old_f: Optional[NumberLike] = None
    candidate_f: Optional[NumberLike] = None
    new_f: Optional[NumberLike] = None

    note: Optional[str] = None


class AlgoStateSnapshot(BaseModel):
    """
    Small state snapshot after a step.
    We keep it intentionally compact for performance.
    """
    settled: Optional[List[str]] = None
    unsettled_frontier: Optional[List[dict]] = None  # [{node, key}]
    open_set: Optional[List[dict]] = None            # A* open set top-k
    closed_set: Optional[List[str]] = None           # A* closed nodes (small subset)
    pass_num: Optional[int] = None                   # Bellman-Ford
    passes_total: Optional[int] = None               # Bellman-Ford
    updates_in_step: Optional[int] = None
    changed_nodes: Optional[List[str]] = None
    dist_preview: Optional[Dict[str, NumberLike]] = None
    parent_preview: Optional[Dict[str, Optional[str]]] = None


class AlgoNarration(BaseModel):
    """
    Lecture-style narration model:
      - action: what is happening
      - why: reason for the choice
      - comparisons: what values were compared and what updated / did not
      - summary: end-of-step summary for teaching
      - state_after: compact algorithm state snapshot
    """
    action_title: str
    action_subtitle: Optional[str] = None
    why: str
    comparisons: List[AlgoComparison] = []
    summary: str
    state_after: Optional[AlgoStateSnapshot] = None


AlgoStep.model_rebuild()


class StepsResponse(BaseModel):
    algorithm: str
    steps: List[AlgoStep]
    tree_nodes: List[TreeNode]
    tree_edges: List[TreeEdge]
    final_path: List[str]
    total_distance: float
