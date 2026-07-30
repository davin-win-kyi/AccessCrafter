"""Read/write helpers over the backend-owned local flat-file store at
server/data/. This is the durable source of truth described in
docs/architecture.md -- the extension does not need to resend this data on
every request, since the backend already has it on disk.
"""

import json
from pathlib import Path
from typing import Any

from ..config import DATA_DIR

PAGE_MODELS_DIR = DATA_DIR / "page_models"
STRATEGIES_DIR = DATA_DIR / "strategies"
SESSIONS_DIR = DATA_DIR / "sessions"
PROFILE_PATH = DATA_DIR / "profile" / "user_profile.json"


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, default=str))


def _read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    return json.loads(path.read_text())


# --- Page models (Stage 1) ---


def save_page_model(model_id: str, page_model: dict[str, Any]) -> None:
    _write_json(PAGE_MODELS_DIR / f"{model_id}.json", page_model)


def load_page_model(model_id: str) -> dict[str, Any] | None:
    return _read_json(PAGE_MODELS_DIR / f"{model_id}.json")


# --- Transferable strategies (Stage 5/6) ---


def save_strategy(strategy_id: str, strategy: dict[str, Any]) -> None:
    _write_json(STRATEGIES_DIR / f"{strategy_id}.json", strategy)


def load_strategy(strategy_id: str) -> dict[str, Any] | None:
    return _read_json(STRATEGIES_DIR / f"{strategy_id}.json")


def load_all_strategies() -> list[dict[str, Any]]:
    if not STRATEGIES_DIR.exists():
        return []
    return [
        json.loads(p.read_text())
        for p in sorted(STRATEGIES_DIR.glob("*.json"))
    ]


def delete_strategy(strategy_id: str) -> bool:
    path = STRATEGIES_DIR / f"{strategy_id}.json"
    if not path.exists():
        return False
    path.unlink()
    return True


# --- Sessions (working state + refinement/research trail) ---


def save_session_artifact(session_id: str, filename: str, data: dict[str, Any]) -> None:
    _write_json(SESSIONS_DIR / session_id / filename, data)


# --- User profile (single reconciled, overwritten-not-appended file) ---


def load_user_profile() -> dict[str, Any] | None:
    return _read_json(PROFILE_PATH)


def save_user_profile(profile: dict[str, Any]) -> None:
    _write_json(PROFILE_PATH, profile)
