"""Stage 1: Semantic Webpage and Task Modeling.

Turns a pruned DOM snapshot into a PageModel -- page purpose, semantic
regions/components (groups, not individual DOM elements, per W3C COGA
guidance), their relationships, and current state.
"""

import json

from ..claude_client import call_structured
from ..schemas.page_model import (
    DomSnapshotNode,
    GeneratedPageModel,
    ModelPageRequest,
    PageComponent,
    PageModel,
)

SYSTEM_PROMPT = """You are the semantic webpage modeling stage of AccessCrafter, \
a system that helps people author cognitive-accessibility support strategies. \
You are given a pruned, accessibility-tree-like snapshot of a webpage (not raw HTML).

Your job is to identify the page's overall purpose, the *major semantic \
components* on the page, and the relationships and state of those components. \
Group elements into meaningful semantic units (e.g. an entire form section, \
not each individual input) -- per W3C COGA guidance, semantic structure and \
relationships among groups of elements matter more than element-by-element detail.

For each component, infer:
- semanticRole: a short role label (e.g. "form-section", "navigation", \
"progress-indicator", "submit-action", "document-upload")
- label: the human-visible name if there is one
- description: what this component is for
- domSelector: the selector of the element in the snapshot that best represents \
this component as a whole (use the "selector" field from the snapshot)
- state: status is one of empty/partial/complete/error/n-a, based on visible \
signals in the snapshot (e.g. filled vs empty inputs, upload status text); \
details is a short human-readable note
- relationships: how this component relates to other components you identified \
(part-of, depends-on, precedes, sibling-of), referencing their componentId

Assign each component a short, stable componentId (e.g. "c1", "c2", ...).
Be concrete and grounded only in what's actually present in the snapshot."""


def _serialize_node_for_prompt(node: DomSnapshotNode) -> dict:
    data = {"tag": node.tag, "selector": node.selector}
    if node.role:
        data["role"] = node.role
    if node.accessibleName:
        data["accessibleName"] = node.accessibleName
    if node.text:
        data["text"] = node.text
    if node.children:
        data["children"] = [_serialize_node_for_prompt(c) for c in node.children]
    return data


def model_page(request: ModelPageRequest) -> PageModel:
    snapshot_json = json.dumps(_serialize_node_for_prompt(request.domSnapshot.root))

    user_content = (
        f"Page URL: {request.url}\n"
        f"Page title: {request.pageTitle}\n\n"
        f"DOM snapshot (pruned, accessibility-tree-like JSON):\n{snapshot_json}"
    )

    generated = call_structured(
        system=SYSTEM_PROMPT,
        user_content=user_content,
        output_model=GeneratedPageModel,
        tool_name="emit_page_model",
    )

    components = [
        PageComponent(
            componentId=c.componentId,
            semanticRole=c.semanticRole,
            label=c.label,
            description=c.description,
            domSelector=c.domSelector,
            state=c.state,
            relationships=c.relationships,
        )
        for c in generated.components
    ]

    return PageModel(
        url=request.url,
        pageTitle=request.pageTitle,
        pagePurpose=generated.pagePurpose,
        taskType=generated.taskType,
        components=components,
    )
