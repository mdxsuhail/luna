"""
Vercel Serverless Function entry point for LUNA API.
Works when Vercel project root directory is set to frontend/.
"""
import os
import sys
from pathlib import Path

# Mark environment as Vercel serverless
os.environ.setdefault("VERCEL", "1")

# From frontend/api/index.py:
# parent.parent is frontend
# parent.parent.parent is project root
FRONTEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = FRONTEND_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

for p in (PROJECT_ROOT, BACKEND_DIR, FRONTEND_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

try:
    from backend.main import app  # noqa: E402
except ImportError:
    from main import app  # noqa: E402

# Ensure requests forwarded without /api prefix still match FastAPI routes
@app.middleware("http")
async def ensure_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if path and not path.startswith("/api") and not path.startswith("/docs") and not path.startswith("/openapi.json"):
        request.scope["path"] = f"/api{path}"
    return await call_next(request)
