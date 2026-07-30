"""Thin wrapper around the Anthropic SDK.

The only structured-output mechanism this project relies on is forced tool
use: define a single tool whose input_schema is the target Pydantic model's
JSON schema, force the model to call it (tool_choice), and parse the
resulting tool_use.input directly into that Pydantic model. This removes the
"the model almost returned valid JSON" class of bugs entirely.
"""

from typing import Type, TypeVar

import anthropic
from pydantic import BaseModel

from .config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

TModel = TypeVar("TModel", bound=BaseModel)

_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def call_structured(
    *,
    system: str,
    user_content: str,
    output_model: Type[TModel],
    tool_name: str,
    max_tokens: int = 4096,
) -> TModel:
    schema = output_model.model_json_schema()
    # Anthropic's tool input_schema doesn't use $defs the same way FastAPI's
    # OpenAPI generation does, but Pydantic v2's model_json_schema() output
    # is valid JSON Schema and Claude handles $defs/$ref fine in practice.
    tool = {
        "name": tool_name,
        "description": f"Emit a {output_model.__name__} object matching the required schema.",
        "input_schema": schema,
    }

    response = _client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        tools=[tool],
        tool_choice={"type": "tool", "name": tool_name},
        messages=[{"role": "user", "content": user_content}],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == tool_name:
            return output_model.model_validate(block.input)

    raise RuntimeError(f"Claude did not return a '{tool_name}' tool call.")
