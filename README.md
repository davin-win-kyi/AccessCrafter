# AccessCrafter

AccessCrafter is a browser extension that lets a user author custom, task-aware
cognitive-accessibility support strategies on a webpage they're actively using,
and later have those strategies semantically reconstructed on a different,
previously-unseen but analogous webpage.

## Motivation

People who share the same cognitive difficulty often rely on different
strategies to get through a web task, and existing personalization systems
generally only support strategies and interfaces anticipated by their
designers in advance. Because users move across independently developed
webpages that no designer could anticipate, support built for one interface
usually doesn't carry over to the next — users end up recreating the same
accommodation over and over.

AccessCrafter addresses this by letting users author a support strategy
directly on whatever page they're using: describe the difficulty, confirm the
system's interpretation, then select or describe a form of support and
refine it. The strategy is grounded in that page's semantic structure and
task state, but its underlying *intent* and *task dependencies* are stored
separately from its page-specific implementation. When the user later lands
on an analogous but previously unseen interface, AccessCrafter matches
corresponding semantic structures and task state and proposes a reconstructed
version of the strategy — always as a preview the user can refine, approve,
or reject, never applied automatically.

See [`docs/proposal.md`](docs/proposal.md) for the full research proposal
(abstract, motivation, and related work) this project implements.

## How it works

- **`extension/`** — a Manifest V3 browser extension (WXT + React). It has two
  jobs: the conversational authoring UI (a side panel chat) and mounting the
  generated support widgets onto the live page (via a content script). It never
  calls an LLM directly.
- **`server/`** — a local FastAPI server. It does all the semantic webpage
  modeling, strategy generation, and cross-page matching by calling the Claude
  API. It persists its own local data store under `server/data/` (page model
  cache, the transferable-strategy library, per-session records, and a
  distilled user profile) — this is the durable source of truth, not the
  extension.
- **`shared/`** — JSON Schema contracts (`shared/schemas/`) that both sides
  validate against, and static fixture pages (`shared/testing/`) used to
  exercise the pipeline end to end without depending on live third-party
  sites.

All communication between the extension and the server happens over plain
HTTP to `http://localhost:8787` (JSON in, JSON out) — there is no shared file
or other IPC channel between the two processes. The extension's background
service worker is the only thing that talks to the server; the side panel and
content script go through it.

## Running it locally

**Backend:**
```
cd server
pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8787
```

**Extension:**
```
cd extension
npm install
npm run dev
```
Then load the generated `extension/.output/chrome-mv3` directory as an
unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load
unpacked).

See `docs/architecture.md` for the full design (data schemas, API contract,
build phases).
