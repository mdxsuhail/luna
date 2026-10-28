"""
Vercel Serverless Function entry point for LUNA API.
Exposes the FastAPI application to Vercel's Python runtime.
"""
import os
import sys
from pathlib import Path

# Mark environment as Vercel serverless
os.environ.setdefault("VERCEL", "1")

# Add project root and backend directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402

# Ensure requests forwarded without /api prefix still match FastAPI routes
@app.middleware("http")
async def ensure_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if path and not path.startswith("/api") and not path.startswith("/docs") and not path.startswith("/openapi.json"):
        request.scope["path"] = f"/api{path}"
    return await call_next(request)
