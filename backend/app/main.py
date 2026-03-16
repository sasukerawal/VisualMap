"""
VisualMap Backend — FastAPI Application Entry Point
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.pathfinding import router

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="VisualMap API",
    description="Shortest-path algorithm backend for the 3D delivery routing simulator.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow React dev server and deployed Vercel frontend
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:5173",       # Vite dev server
    "http://127.0.0.1:5173",       # Vite dev server (alt host)
    "http://localhost:3000",       # Alternative dev port
    "http://127.0.0.1:3000",       # Alternative dev port (alt host)
    os.getenv("FRONTEND_URL", ""), # Production Vercel URL
]
# Filter empty strings
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "service": "VisualMap API"}


# ---------------------------------------------------------------------------
# Run with: uvicorn app.main:app --reload
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
