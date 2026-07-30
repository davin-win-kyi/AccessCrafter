from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import model_page

app = FastAPI(title="AccessCrafter Backend")

# Local-only research prototype: the extension's background service worker
# is the sole caller, so a permissive CORS policy is fine here and keeps
# the extension side simple (chrome-extension:// origins otherwise need to
# be enumerated by ID, which changes per install/build).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(model_page.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
