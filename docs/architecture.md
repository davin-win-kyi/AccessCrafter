# AccessCrafter — Architecture

This is the working reference for the system design. For the full rationale
behind each decision, see the original research proposal
([`proposal.md`](proposal.md)); this file is the condensed, living version
meant to stay in sync with the code.

## Two processes, one contract

- **`extension/`** (WXT + React, Manifest V3) — conversational authoring UI
  (side panel) and the mounting/monitoring of generated support widgets on the
  live page (content script). Never calls an LLM directly.
- **`server/`** (FastAPI) — semantic webpage modeling, strategy generation,
  and cross-page matching. The only thing that calls the Claude API. Owns a
  local flat-file data store under `server/data/`.
- **Transport**: HTTP only, `http://localhost:8787`, JSON request/response.
  All calls are routed through the extension's background service worker.
  There is no shared file between the two processes for IPC.

## Data schemas (`shared/schemas/`)

| Schema | Purpose |
|---|---|
| `page-model.schema.json` | Page purpose, semantic components (groups, not individual DOM elements), their state, and their relationships. |
| `conversation-state.schema.json` | One authoring session's state machine, messages, difficulty grounding, candidate strategies, refinement history. |
| `strategy-spec.schema.json` | A configured strategy across 4 dimensions: information, behavior, triggering, presentation. |
| `widget-spec.schema.json` | Declarative widget description (fixed template + monitors) the content script mounts. Never executable code. |
| `transferable-strategy.schema.json` | The decoupled, role-shaped record used for Stage 6 matching — page-specific identifiers stripped. |
| `user-profile.schema.json` | A small distilled standing profile of presentation preferences, reconciled (not appended to) after each approved strategy. |

## Backend-owned data store (`server/data/`)

| Directory | Contents |
|---|---|
| `page_models/` | Cached `PageModel` per page seen. |
| `strategies/` | The persisted, matchable `TransferableStrategyRecord` library — Stage 5/6 core data. |
| `sessions/` | Per-session working state and refinement trail — also a research log. |
| `profile/` | `user_profile.json`, the single reconciled profile file. |

`server/data/` is git-ignored at the content level (`.gitkeep` placeholders
ship instead) since it's local runtime/research data, not source.

## API contract

All endpoints live under `server/app/routers/`, one file per endpoint, with
the actual LLM/business logic in the matching `server/app/services/*.py`.

| Endpoint | Stage | Request → Response |
|---|---|---|
| `POST /model-page` | 1 | `{url, pageTitle, domSnapshot}` → `PageModel` (cached to `data/page_models/`) |
| `POST /suggest-strategies` | 2 | `{sessionId, pageModel, messages, userDifficultyDescription}` → `{groundedInterpretation, clarifyingQuestions?, candidateStrategies?}` |
| `POST /configure-strategy` | 2 | `{sessionId, pageModel, selectedStrategyOptionId, userConfigInput, currentDraft?}` → draft `StrategySpec` (reads `data/profile/user_profile.json` for defaults) |
| `POST /generate-support` | 3 | `{pageModel, strategySpec}` → `WidgetSpec` |
| `POST /refine` | 4 | `{pageModel, strategySpec, widgetSpec, userFeedback}` → `{updatedStrategySpec?, updatedWidgetSpec, changeSummary}` |
| `POST /extract-transferable-strategy` | 5 | `{pageModel, strategySpec}` → `TransferableStrategyRecord` (persisted; triggers profile reconciliation) |
| `POST /match-strategies` | 6 | `{newPageModel}` → `{matches: [...]}` (reads the saved library directly from disk) |
| `GET /strategies` | 5 | List of saved strategy summaries |
| `DELETE /strategies/{id}` | 5 | Remove a saved strategy |

**DOM snapshot format**: a pruned, accessibility-tree-like JSON (tag, ARIA
role, accessible name, truncated text, stable selector/path, visibility,
children) — not raw HTML. Produced by `extension/entrypoints/content/domSnapshot.ts`.
Caps: ~500 nodes, ~12 levels deep. All backend LLM calls use Claude's
structured-outputs mode so responses parse directly into Pydantic models.

## Content-script widget mounting (Stage 3/4)

1. Backend returns a `WidgetSpec`; selectors are resolved against the cached
   `PageModel` for that URL (the backend never touches live DOM).
2. `widgetHost.tsx` mounts each widget into an open Shadow DOM host with a
   scoped stylesheet — no CSS bleed either direction, no iframe needed.
3. Each `monitors[]` entry becomes a `MutationObserver` or event listener,
   debounced, driving a re-render through the matching fixed template.
4. A `widgetRegistry` tracks mounted widgets for teardown/remount on SPA
   navigation and degrades gracefully if a selector stops resolving.

## Stage 6 — cross-page transfer

The extension re-models the new page and calls `/match-strategies` with just
the new `PageModel`. The backend reasons over the new page's roles/
relationships/state against every saved `TransferableStrategyRecord` (an LLM
reasoning task, not embedding similarity — matching "Work Experience" against
"Employment History" is exactly where surface similarity fails and structural
reasoning works). A match returns a `reconstructionProposal` that re-enters
the *same* `/generate-support` → mount → preview/refine/approve/reject loop as
authoring. Nothing is ever auto-applied.

## Build phases

See the plan document for full phase-by-phase verification steps. Summary:

- **A** — Page modeling pipeline, debug panel only.
- **B** — Authoring conversation wired to the real backend.
- **C** — Real generation + widget mounting + preview/refine.
- **D** — Transferable strategy persistence + library UI.
- **E** — Cross-page transfer on a second, differently-labeled fixture.
