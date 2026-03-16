"""
Pydantic schemas for VisualMap API request / response models.
"""

from __future__ import annotations
from typing import List, Literal, Optional
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
    heuristic: Optional[float] = None   # A* h(n)
    f_score: Optional[float] = None     # A* f(n)
    round_num: Optional[int] = None     # Bellman-Ford relaxation round
    neighbors_updated: List[dict] = []
    description: str


class StepsResponse(BaseModel):
    algorithm: str
    steps: List[AlgoStep]
    tree_nodes: List[TreeNode]
    tree_edges: List[TreeEdge]
    final_path: List[str]
    total_distance: float
