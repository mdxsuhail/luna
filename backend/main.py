"""
LUNA API - Offline-First Backend Application
Core FastAPI server exposing health checks, book listing, PDF import, PDF text extraction, and PDF streaming.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
import time
import hmac
import hashlib
import base64
import binascii
import json
from pathlib import Path
from typing import List, Dict, Any
import uuid
import logging

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
import pypdf
from auth import (init_auth_tables, create_user, verify_credentials, create_session, get_user_for_token, update_user_profile, delete_session)

from database import (
    init_db,
    get_all_books,
    get_book_by_id,
    delete_book_record,
    insert_book,
    DB_PATH,
    BOOKS_DIR,
    ensure_directories,
)

MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024
# Allow multipart boundaries/headers while rejecting oversized request bodies before parsing.
MAX_UPLOAD_REQUEST_BYTES = MAX_UPLOAD_SIZE_BYTES + 1024 * 1024
MAX_PDF_PAGES = 20_000
MAX_EXTRACTED_TEXT_CHARS = 1_000_000
MAX_BOOK_TITLE_CHARS = 300
CHUNK_SIZE = 1024 * 1024

logger = logging.getLogger(__name__)


def load_local_backend_env() -> None:
    """Load backend/.env without overriding environment variables already set by the OS."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_backend_env()


def is_path_within_directory(candidate: Path, directory: Path) -> bool:
    """Return True only when candidate resolves to a path inside directory."""
    try:
        candidate.resolve().relative_to(directory.resolve())
        return True
    except (OSError, RuntimeError, ValueError):
        return False


def extract_page_text(reader: pypdf.PdfReader, page_number: int) -> str:
    """Extract a bounded amount of text from one 1-based PDF page."""
    if page_number < 1 or page_number > len(reader.pages):
        raise ValueError("Page number is outside the document.")
    text = (reader.pages[page_number - 1].extract_text() or "").strip()
    return text[:MAX_EXTRACTED_TEXT_CHARS]


def is_allowed_local_host(host: str | None) -> bool:
    """Allow only expected loopback Host values and the default LUNA API port."""
    if not host:
        return False
    normalized = host.strip().lower()
    return normalized in {
        "127.0.0.1",
        "127.0.0.1:8000",
        "localhost",
        "localhost:8000",
    }


def is_allowed_origin(origin: str | None) -> bool:
    """Check the exact browser origins used by the local Vite frontend."""
    return origin in {"http://localhost:5173", "http://127.0.0.1:5173"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize local directories and the SQLite schema on startup."""
    ensure_directories()
    init_db()
    init_auth_tables()
    yield


app = FastAPI(
    title="LUNA API",
    description="Offline-first PDF eBook reader and audiobook companion platform API.",
    version="0.1.0",
    lifespan=lifespan,
)

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "HEAD", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Accept", "Content-Type", "Authorization"],
)


@app.middleware("http")
async def protect_local_api(request: Request, call_next):
    """Restrict local API hosts, enforce browser-origin checks, and cap upload bodies."""
    # Validate the complete Host header, including its port. Checking only URL.hostname
    # would also accept malformed or unexpected ports such as localhost:9999.
    if not is_allowed_local_host(request.headers.get("host")):
        return JSONResponse(
            status_code=400,
            content={"detail": "LUNA accepts requests only through localhost on port 8000."},
        )

    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        # LUNA's supported frontend is a browser app, which sends Origin on state changes.
        # Requiring it prevents requests with a missing Origin from bypassing the allowlist.
        if not is_allowed_origin(origin):
            return JSONResponse(
                status_code=403,
                content={"detail": "A trusted LUNA frontend Origin is required for changes."},
            )

    if request.method == "POST" and request.url.path == "/api/books/import":
        content_length = request.headers.get("content-length")
        # Require a declared body size for this local upload endpoint. Otherwise a
        # chunked/unknown-length request could reach multipart parsing before the
        # endpoint's streamed file-size check gets a chance to run.
        if content_length is None:
            return JSONResponse(
                status_code=411,
                content={"detail": "Content-Length is required for PDF uploads."},
            )
        try:
            request_size = int(content_length)
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid Content-Length header."},
            )
        if request_size < 0:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid Content-Length header."},
            )
        if request_size > MAX_UPLOAD_REQUEST_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Upload request exceeds the maximum allowed size."},
            )

    return await call_next(request)


class SignUpPayload(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=300)
    display_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=300)

class SignInPayload(BaseModel):
    username_or_email: str = Field(min_length=1, max_length=300)
    password: str = Field(min_length=1, max_length=300)

class ProfileUpdatePayload(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    bio: str = Field(max_length=500)
    skill: str = Field(min_length=1, max_length=100)

def require_user(request: Request) -> Dict[str, Any]:
    authorization = request.headers.get('authorization', '')
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Please sign in to continue.')
    token = authorization[7:].strip()
    if not token or len(token) > 200:
        raise HTTPException(status_code=401, detail='Session is invalid. Please sign in again.')
    user = get_user_for_token(token)
    if not user:
        raise HTTPException(status_code=401, detail='Session expired or invalid. Please sign in again.')
    return user

@app.post('/api/auth/signup', status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpPayload) -> Dict[str, Any]:
    try:
        user = create_user(payload.username, payload.email, payload.display_name, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    token, expires_at = create_session(int(user['id']))
    return {'user': user, 'token': token, 'expires_at': expires_at}

@app.post('/api/auth/signin')
def signin(payload: SignInPayload) -> Dict[str, Any]:
    user = verify_credentials(payload.username_or_email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail='Username/email or password is incorrect.')
    token, expires_at = create_session(int(user['id']))
    return {'user': user, 'token': token, 'expires_at': expires_at}

@app.get('/api/auth/me')
def current_user(request: Request) -> Dict[str, Any]:
    return {'user': require_user(request)}

@app.patch('/api/auth/profile')
def save_profile(payload: ProfileUpdatePayload, request: Request) -> Dict[str, Any]:
    user = require_user(request)
    try:
        updated = update_user_profile(int(user['id']), payload.display_name, payload.role, payload.bio, payload.skill)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not updated:
        raise HTTPException(status_code=404, detail='Profile was not found.')
    return {'user': updated}

@app.post('/api/auth/signout')
def signout(request: Request) -> Dict[str, bool]:
    authorization = request.headers.get('authorization', '')
    if not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Please sign in to continue.')
    token = authorization[7:].strip()
    if not token or len(token) > 200:
        raise HTTPException(status_code=401, detail='Session is invalid.')
    delete_session(token)
    return {'signed_out': True}


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _developer_token(code: str) -> str | None:
    """Issue a short-lived signed token only when a local developer secret is configured."""
    expected_code = os.environ.get("LUNA_DEV_CODE", "")
    signing_secret = os.environ.get("LUNA_DEV_TOKEN_SECRET", "")
    if not expected_code or len(expected_code) < 8 or not signing_secret or len(signing_secret) < 32:
        return None
    if not hmac.compare_digest(code, expected_code):
        return ""
    payload = _b64url(json.dumps({"role": "developer", "exp": int(time.time()) + 3600}, separators=(",", ":")).encode())
    signature = _b64url(hmac.new(signing_secret.encode(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{signature}"


@app.post("/api/dev/login")
def developer_login(payload: Dict[str, Any] = Body(...)) -> Dict[str, str]:
    """Verify a developer code without exposing the configured secret to the frontend."""
    code = payload.get("code")
    if not isinstance(code, str) or not code:
        raise HTTPException(status_code=400, detail="Enter the developer login code.")
    token = _developer_token(code)
    if token is None:
        raise HTTPException(status_code=503, detail="Developer access is not configured. Set LUNA_DEV_CODE and LUNA_DEV_TOKEN_SECRET in the local backend environment.")
    if not token:
        raise HTTPException(status_code=401, detail="Developer code was not accepted.")
    return {"token": token, "expires_in": "3600"}


@app.get("/api/dev/verify")
def developer_verify(request: Request) -> Dict[str, bool]:
    """Validate the signed developer token and its one-hour expiry."""
    signing_secret = os.environ.get("LUNA_DEV_TOKEN_SECRET", "")
    authorization = request.headers.get("authorization", "")
    if not signing_secret or len(signing_secret) < 32 or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Developer login required.")
    token = authorization[7:].strip()
    try:
        payload_part, signature_part = token.split(".", 1)
        expected_signature = _b64url(hmac.new(signing_secret.encode(), payload_part.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature_part, expected_signature):
            raise ValueError("signature")
        payload = json.loads(base64.urlsafe_b64decode(payload_part + "=" * (-len(payload_part) % 4)))
        if payload.get("role") != "developer" or int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
    except (ValueError, TypeError, json.JSONDecodeError, binascii.Error):
        raise HTTPException(status_code=401, detail="Developer login expired. Please sign in again.")
    return {"authenticated": True}


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Return API status without revealing local filesystem paths."""
    return {
        "status": "healthy",
        "app": "LUNA API",
        "database_initialized": DB_PATH.exists(),
    }


@app.get("/api/books")
def list_books() -> List[Dict[str, Any]]:
    """Return all book records stored in SQLite."""
    return get_all_books()


@app.post("/api/books/import", status_code=status.HTTP_201_CREATED)
async def import_book(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Validate, store, parse metadata from, and register an uploaded PDF."""
    original_filename = file.filename or "unknown.pdf"

    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents (.pdf) are supported.",
        )

    ensure_directories()
    unique_filename = f"{uuid.uuid4().hex}.pdf"
    destination_path = BOOKS_DIR / unique_filename
    total_bytes_read = 0
    first_chunk = True

    try:
        with open(destination_path, "wb") as out_file:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                total_bytes_read += len(chunk)
                if total_bytes_read > MAX_UPLOAD_SIZE_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum upload size limit of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
                    )
                if first_chunk:
                    if not chunk.startswith(b"%PDF-"):
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid PDF file format. The file header does not match standard PDF specifications.",
                        )
                    first_chunk = False
                out_file.write(chunk)

        if total_bytes_read == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        try:
            reader = pypdf.PdfReader(str(destination_path))
            if reader.is_encrypted:
                try:
                    decrypted = reader.decrypt("") != 0
                except Exception:
                    decrypted = False
                if not decrypted and reader.is_encrypted:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="The uploaded PDF is password-protected or encrypted and cannot be processed.",
                    )

            page_count = len(reader.pages)
            if page_count > MAX_PDF_PAGES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"PDF exceeds the maximum supported page count of {MAX_PDF_PAGES}.",
                )
            if page_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The uploaded PDF contains 0 pages.",
                )

            extracted_title = None
            if reader.metadata and reader.metadata.title:
                candidate_title = str(reader.metadata.title).strip()
                if candidate_title:
                    extracted_title = candidate_title[:MAX_BOOK_TITLE_CHARS]
            if not extracted_title:
                extracted_title = Path(original_filename).stem.strip()[:MAX_BOOK_TITLE_CHARS] or "Untitled Document"

        except HTTPException:
            raise
        except Exception as pdf_err:
            logger.info("PDF parsing failed for uploaded file %r: %s", original_filename, pdf_err)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to read this PDF. Check that the file is valid and is not password-protected.",
            )

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        relative_storage_path = f"local-data/books/{unique_filename}"
        try:
            return insert_book(
                title=extracted_title,
                original_filename=original_filename[:MAX_BOOK_TITLE_CHARS],
                stored_pdf_path=relative_storage_path,
                page_count=page_count,
                file_size_bytes=total_bytes_read,
                import_timestamp=now_str,
                extracted_text_status="pending",
            )
        except Exception:
            logger.exception("Failed to save metadata for uploaded PDF %r", original_filename)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The PDF was received, but LUNA could not save its metadata. Check the backend terminal for details.",
            )

    except HTTPException:
        destination_path.unlink(missing_ok=True)
        raise
    except Exception:
        logger.exception("Unexpected error while importing PDF %r", original_filename)
        destination_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while importing this PDF. Check the backend terminal for details.",
        )
    finally:
        await file.close()


def resolve_registered_pdf(book_id: int) -> tuple[Dict[str, Any], Path]:
    """Find a registered book and safely resolve its PDF path inside BOOKS_DIR."""
    book = get_book_by_id(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in database.",
        )

    stored_path = book.get("stored_pdf_path")
    if not isinstance(stored_path, str) or not stored_path.startswith("local-data/books/"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid PDF storage record.")
    filename_only = Path(stored_path).name
    if not filename_only.endswith(".pdf") or filename_only in {"", ".", ".."} or Path(filename_only).name != filename_only:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid PDF storage record.")
    target_file = (BOOKS_DIR / filename_only).resolve()
    if not is_path_within_directory(target_file, BOOKS_DIR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: invalid file path.",
        )
    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested PDF file is missing from local disk storage.",
        )
    return book, target_file


@app.delete("/api/books/{book_id}", status_code=status.HTTP_200_OK)
def delete_book(book_id: int) -> Dict[str, Any]:
    """Delete a registered PDF and its metadata from local storage."""
    book = get_book_by_id(book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
    stored_path = book.get("stored_pdf_path")
    if not isinstance(stored_path, str) or not stored_path.startswith("local-data/books/"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid PDF storage record.")
    filename_only = Path(stored_path).name
    if not filename_only.lower().endswith(".pdf") or filename_only in {"", ".", ".."} or Path(filename_only).name != filename_only:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid PDF storage record.")
    target_file = (BOOKS_DIR / filename_only).resolve()
    if not is_path_within_directory(target_file, BOOKS_DIR):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: invalid file path.")
    # Remove the DB row first; only unlink the file after the record is confirmed.
    deleted = delete_book_record(book_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
    try:
        target_file.unlink(missing_ok=True)
    except OSError as exc:
        logger.exception("Book %s metadata deleted but PDF file cleanup failed", book_id)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Book metadata was removed, but the PDF file could not be deleted.") from exc
    return {"deleted": True, "book_id": book_id}


@app.get("/api/books/{book_id}/text")
def get_book_page_text(
    book_id: int,
    page: int = Query(default=1, ge=1, description="1-based PDF page number"),
) -> Dict[str, Any]:
    """Extract one PDF page's text for future offline text-to-speech support."""
    book, target_file = resolve_registered_pdf(book_id)
    try:
        reader = pypdf.PdfReader(str(target_file))
        if reader.is_encrypted:
            try:
                decrypted = reader.decrypt("") != 0
            except Exception:
                decrypted = False
            if not decrypted and reader.is_encrypted:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="This PDF is encrypted and its text cannot be extracted.",
                )
        page_count = len(reader.pages)
        if page_count > MAX_PDF_PAGES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"PDF exceeds the maximum supported page count of {MAX_PDF_PAGES}.",
            )
        if page > page_count:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page {page} does not exist. This PDF has {page_count} pages.",
            )
        text = extract_page_text(reader, page)
        return {
            "book_id": book_id,
            "title": book["title"],
            "page": page,
            "page_count": page_count,
            "text": text,
            "has_text": bool(text),
            "message": None if text else "No selectable text was found on this page. It may be a scanned image.",
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Text extraction failed for book %s, page %s", book_id, page)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="LUNA could not extract text from this PDF page.",
        )


@app.api_route("/api/books/{book_id}/pdf", methods=["GET", "HEAD"])
def get_book_pdf(book_id: int):
    """Safely stream the registered PDF after validating its resolved path."""
    book, target_file = resolve_registered_pdf(book_id)
    return FileResponse(
        path=str(target_file),
        media_type="application/pdf",
        filename=book["original_filename"],
        content_disposition_type="inline",
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
