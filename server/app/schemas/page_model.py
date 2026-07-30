"""Pydantic models mirroring shared/schemas/page-model.schema.json.

Keep in sync manually when the JSON Schema changes -- see
docs/architecture.md for the full data-schema contract.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field

ComponentStatus = Literal["empty", "partial", "complete", "error", "n/a"]
RelationshipType = Literal["part-of", "depends-on", "precedes", "sibling-of"]


class ComponentState(BaseModel):
    status: ComponentStatus
    details: Optional[str] = None
    lastUpdated: Optional[datetime] = None


class ComponentRelationship(BaseModel):
    targetComponentId: str
    type: RelationshipType
    description: Optional[str] = None


class PageComponent(BaseModel):
    componentId: str
    semanticRole: str
    label: Optional[str] = None
    description: str
    domSelector: Optional[str] = None
    state: ComponentState
    relationships: list[ComponentRelationship] = Field(default_factory=list)


class PageModel(BaseModel):
    modelId: str = Field(default_factory=lambda: str(uuid4()))
    url: str
    capturedAt: datetime = Field(default_factory=datetime.utcnow)
    pageTitle: str
    pagePurpose: str
    taskType: str
    components: list[PageComponent]


# --- Request-side models: the pruned DOM snapshot sent by the extension ---


class DomSnapshotNode(BaseModel):
    tag: str
    role: Optional[str] = None
    accessibleName: Optional[str] = None
    text: Optional[str] = None
    selector: str
    visible: bool = True
    children: list["DomSnapshotNode"] = Field(default_factory=list)


DomSnapshotNode.model_rebuild()


class DomSnapshot(BaseModel):
    nodeCount: int
    root: DomSnapshotNode


class ModelPageRequest(BaseModel):
    url: str
    pageTitle: str
    domSnapshot: DomSnapshot


# --- LLM-facing output model: what we ask Claude to emit for Stage 1 ---
# Same shape as PageComponent/PageModel but without the fields the server
# fills in itself (modelId, capturedAt, url) -- the LLM only reasons about
# page purpose, task type, components, and their state/relationships.


class GeneratedPageComponent(BaseModel):
    componentId: str
    semanticRole: str
    label: Optional[str] = None
    description: str
    domSelector: Optional[str] = None
    state: ComponentState
    relationships: list[ComponentRelationship] = Field(default_factory=list)


class GeneratedPageModel(BaseModel):
    pagePurpose: str
    taskType: str
    components: list[GeneratedPageComponent]
