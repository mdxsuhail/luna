"""
LUNA API - Offline-First Backend Application
Core FastAPI server exposing health checks, book listing, PDF import, PDF text extraction, and PDF streaming.
"""

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import uuid
import logging

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pypdf

from database import (
    init_db,
    get_all_books,
    get_book_by_id,
    insert_book,
    DB_PATH,
    BOOKS_DIR,
    ensure_directories,
)

# Configurable maximum file upload size: 50 MB
MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
CHUNK_SIZE = 1024 * 1024  # 1 MB chunk

logger = logging.getLogger(__name__)


def is_path_within_directory(candidate: Path, directory: Path) -> bool:
    """Return True only when candidate resolves to a path inside directory."""
    try:
        candidate.resolve().relative_to(directory.resolve())
        return True
    except ValueError:
        return False


def extract_page_text(reader: pypdf.PdfReader, page_number: int) -> str:
    """Extract text from one 1-based PDF page number, returning an empty string if none exists."""
    if page_number < 1 or page_number > len(reader.pages):
        raise ValueError("Page number is outside the document.")
    return (reader.pages[page_number - 1].extract_text() or "").strip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes local directory structure and SQLite database schema automatically on startup.
    """
    ensure_directories()
    init_db()
    yield


app = FastAPI(
    title="LUNA API",
    description="Offline-first PDF eBook reader and audiobook companion platform API.",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """Return API status, storage directory, and database initialization information."""
    return {
        "status": "healthy",
        "app": "LUNA API",
        "database_initialized": DB_PATH.exists(),
        "database_path": str(DB_PATH),
        "books_directory": str(BOOKS_DIR),
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
            if page_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The uploaded PDF contains 0 pages.",
                )

            extracted_title = None
            if reader.metadata and reader.metadata.title:
                candidate_title = str(reader.metadata.title).strip()
                if candidate_title:
                    extracted_title = candidate_title
            if not extracted_title:
                extracted_title = Path(original_filename).stem.strip() or "Untitled Document"

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
                original_filename=original_filename,
                stored_pdf_path=relative_storage_path,
                page_count=page_count,
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

    filename_only = Path(book["stored_pdf_path"]).name
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


@app.get("/api/books/{book_id}/text")
def get_book_page_text(
    book_id: int,
    page: int = Query(default=1, ge=1, description="1-based PDF page number"),
) -> Dict[str, Any]:
    """
    Extract text from a single PDF page on demand.
    This endpoint is local-only and can later provide page text to LUNA's offline TTS engine.
    """
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
        if page > len(reader.pages):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page {page} does not exist. This PDF has {len(reader.pages)} pages.",
            )
        text = extract_page_text(reader, page)
        return {
            "book_id": book_id,
            "title": book["title"],
            "page": page,
            "page_count": len(reader.pages),
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
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
