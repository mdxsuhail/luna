"""Cloud deployment entry point for LUNA.

Uses Supabase PostgREST + private Storage for durable cloud persistence.
The original main.py/database.py/auth.py remain the local SQLite implementation.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
import pypdf
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager

logger = logging.getLogger("luna.cloud")
MAX_UPLOAD = 50 * 1024 * 1024
MAX_PAGES = 20_000
MAX_TEXT = 1_000_000
BUCKET = os.getenv("LUNA_STORAGE_BUCKET", "luna-books")


def config() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.")
    return url, key


def headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    _, key = config()
    result = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if extra:
        result.update(extra)
    return result


def rest(method: str, table: str, *, params: dict | None = None, payload: Any = None,
         prefer: str | None = None) -> Any:
    url, _ = config()
    h = headers({"Prefer": prefer} if prefer else None)
    response = httpx.request(method, f"{url}/rest/v1/{table}", headers=h, params=params, json=payload, timeout=30)
    if response.status_code >= 400:
        logger.error("Supabase REST error (%s): %s", response.status_code, response.text[:500])
        raise RuntimeError("Cloud database request failed.")
    return response.json() if response.content else None


def storage_request(method: str, path: str, *, content: bytes | None = None, content_type: str | None = None):
    url, _ = config()
    h = headers()
    h.pop("Content-Type", None)
    if content_type:
        h["Content-Type"] = content_type
    response = httpx.request(method, f"{url}/storage/v1{path}", headers=h, content=content, timeout=90)
    if response.status_code >= 400 and response.status_code != 409:
        logger.error("Supabase Storage error (%s): %s", response.status_code, response.text[:500])
        raise RuntimeError("Cloud file storage request failed.")
    return response


def ensure_bucket() -> None:
    url, _ = config()
    response = httpx.post(f"{url}/storage/v1/bucket", headers=headers(),
                          json={"id": BUCKET, "name": BUCKET, "public": False, "file_size_limit": MAX_UPLOAD},
                          timeout=20)
    if response.status_code in (200, 201):
        return

    # Supabase may report an existing bucket as HTTP 400 with an embedded
    # statusCode of 409 (BucketAlreadyExists). Verify the existing bucket
    # rather than treating this idempotent startup condition as fatal.
    duplicate = response.status_code == 409
    if response.status_code == 400:
        try:
            duplicate = response.json().get("code") == "BucketAlreadyExists"
        except (ValueError, AttributeError):
            duplicate = False

    if duplicate:
        existing = httpx.get(f"{url}/storage/v1/bucket/{BUCKET}", headers=headers(), timeout=20)
        if existing.status_code == 200:
            try:
                bucket_info = existing.json()
            except ValueError:
                bucket_info = {}
            if bucket_info.get("public") is False:
                logger.info("Using existing private Supabase Storage bucket '%s'.", BUCKET)
                return
            logger.error("Existing storage bucket '%s' is not confirmed private: %s", BUCKET, existing.text[:500])
        else:
            logger.error("Could not verify existing storage bucket (%s): %s", existing.status_code, existing.text[:500])
    else:
        logger.error("Storage bucket setup failed (%s): %s", response.status_code, response.text[:500])

    raise RuntimeError("Could not initialize private PDF storage bucket.")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(row: dict) -> dict:
    return {k: row.get(k) for k in ("id", "username", "email", "display_name", "role", "bio", "skill", "created_at")}


def password_hash(password: str, salt: bytes) -> str:
    return hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=64).hex()


def create_session(user_id: int) -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    rest("POST", "user_sessions", payload={"user_id": user_id, "token_hash": hashlib.sha256(token.encode()).hexdigest(),
        "expires_at": expires, "created_at": now_iso()}, prefer="return=minimal")
    return token, expires


def user_for_token(token: str) -> dict | None:
    digest = hashlib.sha256(token.encode()).hexdigest()
    rows = rest("GET", "user_sessions", params={"select": "user_id,expires_at", "token_hash": f"eq.{digest}", "expires_at": f"gt.{now_iso()}", "limit": "1"})
    if not rows:
        return None
    users = rest("GET", "users", params={"select": "*", "id": f"eq.{rows[0]['user_id']}", "limit": "1"})
    return public_user(users[0]) if users else None


def require_user(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Please sign in to continue.")
    user = user_for_token(auth[7:].strip())
    if not user:
        raise HTTPException(401, "Session expired or invalid. Please sign in again.")
    return user


class Signup(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=300)
    display_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=300)


class Signin(BaseModel):
    username_or_email: str = Field(min_length=1, max_length=300)
    password: str = Field(min_length=1, max_length=300)


class Profile(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    bio: str = Field(max_length=500)
    skill: str = Field(min_length=1, max_length=100)


def book_row(row: dict) -> dict:
    row["stored_pdf_path"] = row.pop("storage_path", "")
    return row


def get_book(book_id: int) -> dict | None:
    rows = rest("GET", "books", params={"select": "*", "id": f"eq.{book_id}", "limit": "1"})
    return book_row(rows[0]) if rows else None


@asynccontextmanager
async def lifespan(app: FastAPI):
    config()
    ensure_bucket()
    yield


app = FastAPI(title="LUNA API", description="LUNA cloud API using Supabase durable storage.", version="1.0.0", lifespan=lifespan)
allowed_origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_origin_regex=r"^https://.*\.vercel\.app$",
                   allow_credentials=False, allow_methods=["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
                   allow_headers=["Accept", "Content-Type", "Authorization"])


@app.get("/")
@app.get("/api")
@app.get("/api/")
def root():
    return {"app": "LUNA API", "status": "healthy", "health": "/api/health", "books": "/api/books"}


@app.get("/api/health")
def health():
    try:
        rest("GET", "books", params={"select": "id", "limit": "1"})
        return {"status": "healthy", "app": "LUNA API", "database_initialized": True, "storage": "configured"}
    except Exception:
        logger.exception("Health check failed")
        raise HTTPException(503, "LUNA cloud storage is not ready.")


@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: Signup):
    username, email, display = payload.username.strip(), payload.email.strip().lower(), payload.display_name.strip()
    password = payload.password
    if not 3 <= len(username) <= 24 or not username.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(400, "Username must be 3–24 characters and use letters, numbers, underscores, or hyphens.")
    if not 2 <= len(display) <= 60 or len(email) > 254 or "@" not in email:
        raise HTTPException(400, "Enter a valid display name and email address.")
    if not 10 <= len(password) <= 128 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        raise HTTPException(400, "Password must be 10–128 characters and contain at least one letter and one number.")
    salt = secrets.token_bytes(16)
    row = {"username": username, "email": email, "display_name": display, "role": "Reader", "bio": "",
           "skill": "Reading", "password_salt": salt.hex(), "password_hash": password_hash(password, salt), "created_at": now_iso()}
    try:
        created = rest("POST", "users", payload=row, prefer="return=representation")
    except RuntimeError:
        raise HTTPException(409, "That username or email may already be registered.")
    user = public_user(created[0])
    token, expires = create_session(int(user["id"]))
    return {"user": user, "token": token, "expires_at": expires}


@app.post("/api/auth/signin")
def signin(payload: Signin):
    identifier = payload.username_or_email.strip()
    rows = rest("GET", "users", params={"select": "*", "username": f"ilike.{identifier}", "limit": "1"})
    if not rows:
        rows = rest("GET", "users", params={"select": "*", "email": f"ilike.{identifier}", "limit": "1"})
    if not rows:
        password_hash(payload.password, b"luna-dummy-salt!")
        raise HTTPException(401, "Username/email or password is incorrect.")
    row = rows[0]
    try:
        valid = hmac.compare_digest(password_hash(payload.password, bytes.fromhex(row["password_salt"])), row["password_hash"])
    except (ValueError, TypeError):
        valid = False
    if not valid:
        raise HTTPException(401, "Username/email or password is incorrect.")
    user = public_user(row)
    token, expires = create_session(int(user["id"]))
    return {"user": user, "token": token, "expires_at": expires}


@app.get("/api/auth/me")
def current_user(request: Request):
    return {"user": require_user(request)}


@app.patch("/api/auth/profile")
def update_profile(payload: Profile, request: Request):
    user = require_user(request)
    display, role, bio, skill = payload.display_name.strip(), payload.role.strip(), payload.bio.strip(), payload.skill.strip()
    if not 2 <= len(display) <= 60 or not 2 <= len(role) <= 60 or len(bio) > 300 or not 2 <= len(skill) <= 40:
        raise HTTPException(400, "Profile fields are outside the allowed length.")
    rows = rest("PATCH", "users", params={"id": f"eq.{user['id']}"}, payload={"display_name": display, "role": role, "bio": bio, "skill": skill}, prefer="return=representation")
    if not rows:
        raise HTTPException(404, "Profile was not found.")
    return {"user": public_user(rows[0])}


@app.post("/api/auth/signout")
def signout(request: Request):
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Please sign in to continue.")
    digest = hashlib.sha256(auth[7:].strip().encode()).hexdigest()
    rest("DELETE", "user_sessions", params={"token_hash": f"eq.{digest}"}, prefer="return=minimal")
    return {"signed_out": True}


@app.post("/api/dev/login")
def developer_login(payload: dict = Body(...)):
    code, expected, secret = payload.get("code"), os.getenv("LUNA_DEV_CODE", ""), os.getenv("LUNA_DEV_TOKEN_SECRET", "")
    if not isinstance(code, str) or not code:
        raise HTTPException(400, "Enter the developer login code.")
    if len(expected) < 8 or len(secret) < 32:
        raise HTTPException(503, "Developer Mode is not configured on this deployment.")
    if not hmac.compare_digest(code, expected):
        raise HTTPException(401, "Developer code was not accepted.")
    encoded = base64.urlsafe_b64encode(json.dumps({"role": "developer", "exp": int(time.time()) + 3600}, separators=(",", ":")).encode()).rstrip(b"=").decode()
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return {"token": f"{encoded}.{signature}", "expires_in": "3600"}


@app.get("/api/dev/verify")
def developer_verify(request: Request):
    auth = request.headers.get("authorization", "")
    secret = os.getenv("LUNA_DEV_TOKEN_SECRET", "")
    if not auth.startswith("Bearer ") or len(secret) < 32:
        raise HTTPException(401, "Developer login required.")
    try:
        part, sig = auth[7:].strip().split(".", 1)
        expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), part.encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
        payload = json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
        if not hmac.compare_digest(sig, expected) or payload.get("role") != "developer" or int(payload.get("exp", 0)) <= int(time.time()):
            raise ValueError("invalid token")
    except Exception:
        raise HTTPException(401, "Developer login expired or invalid. Please sign in again.")
    return {"authenticated": True}


@app.get("/api/books")
def list_books():
    rows = rest("GET", "books", params={"select": "*", "order": "id.desc"})
    return [book_row(r) for r in rows]


@app.post("/api/books/import", status_code=status.HTTP_201_CREATED)
async def import_book(file: UploadFile = File(...)):
    filename = Path(file.filename or "unknown.pdf").name
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF documents (.pdf) are supported.")
    chunks, size = [], 0
    while chunk := await file.read(1024 * 1024):
        size += len(chunk)
        if size > MAX_UPLOAD:
            raise HTTPException(413, "PDF exceeds the maximum upload size of 50 MB.")
        chunks.append(chunk)
    await file.close()
    data = b"".join(chunks)
    if not data or not data.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid or empty PDF file.")
    try:
        reader = pypdf.PdfReader(__import__("io").BytesIO(data))
        if reader.is_encrypted and reader.decrypt("") == 0:
            raise HTTPException(400, "Password-protected PDFs are not supported.")
        pages = len(reader.pages)
        if pages < 1 or pages > MAX_PAGES:
            raise HTTPException(413, "PDF page count is outside the supported range.")
        title = (str(reader.metadata.title).strip() if reader.metadata and reader.metadata.title else "") or Path(filename).stem or "Untitled Document"
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Unable to read this PDF. Check that the file is valid and not password-protected.")
    object_path = f"{uuid.uuid4().hex}.pdf"
    try:
        storage_request("POST", f"/object/{BUCKET}/{object_path}", content=data, content_type="application/pdf")
        rows = rest("POST", "books", payload={"title": title[:300], "original_filename": filename[:300],
            "storage_path": object_path, "page_count": pages, "file_size_bytes": size,
            "import_timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"), "extracted_text_status": "pending"},
            prefer="return=representation")
        return book_row(rows[0])
    except Exception:
        try:
            storage_request("DELETE", f"/object/{BUCKET}/{object_path}")
        except Exception:
            logger.exception("Failed to clean up orphaned PDF object")
        logger.exception("Cloud PDF import failed")
        raise HTTPException(503, "LUNA could not save this PDF to cloud storage. Please retry.")


def download_book(book_id: int) -> tuple[dict, bytes]:
    book = get_book(book_id)
    if not book:
        raise HTTPException(404, "Book not found.")
    path = book.get("stored_pdf_path", "")
    if not path or "/" in path or "\\" in path or path in {".", ".."}:
        raise HTTPException(500, "Invalid PDF storage record.")
    result = storage_request("GET", f"/object/{BUCKET}/{path}")
    return book, result.content


@app.delete("/api/books/{book_id}")
def delete_book(book_id: int):
    book = get_book(book_id)
    if not book:
        raise HTTPException(404, "Book not found.")
    rest("DELETE", "books", params={"id": f"eq.{book_id}"}, prefer="return=minimal")
    storage_request("DELETE", f"/object/{BUCKET}/{book['stored_pdf_path']}")
    return {"deleted": True, "book_id": book_id}


@app.get("/api/books/{book_id}/text")
def get_book_text(book_id: int, page: int = Query(default=1, ge=1)):
    book, data = download_book(book_id)
    try:
        reader = pypdf.PdfReader(__import__("io").BytesIO(data))
        if reader.is_encrypted and reader.decrypt("") == 0:
            raise HTTPException(422, "This PDF is encrypted and its text cannot be extracted.")
        if page > len(reader.pages):
            raise HTTPException(404, f"Page {page} does not exist. This PDF has {len(reader.pages)} pages.")
        text = (reader.pages[page - 1].extract_text() or "").strip()[:MAX_TEXT]
        return {"book_id": book_id, "title": book["title"], "page": page, "page_count": len(reader.pages),
                "text": text, "has_text": bool(text),
                "message": None if text else "No selectable text was found on this page. It may be a scanned image."}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Text extraction failed for book %s", book_id)
        raise HTTPException(422, "LUNA could not extract text from this PDF page.")


@app.api_route("/api/books/{book_id}/pdf", methods=["GET", "HEAD"])
def get_book_pdf(book_id: int, request: Request):
    book, data = download_book(book_id)
    if request.method == "HEAD":
        return Response(status_code=200, media_type="application/pdf", headers={"Content-Length": str(len(data))})
    safe_name = book["original_filename"].replace('"', "")
    return Response(content=data, media_type="application/pdf",
                    headers={"Content-Disposition": f'inline; filename="{safe_name}"'})
