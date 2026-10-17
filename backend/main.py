"""
LUNA API - Offline-First Backend Application
Core FastAPI server exposing health checks, book listing, PDF import, and PDF streaming.
"""

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import uuid
import logging

from fastapi import FastAPI, UploadFile, File, HTTPException, status
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes local directory structure and SQLite database schema automatically on startup.
    """
    ensure_directories()
    init_db()
    yield


# Initialize FastAPI application
app = FastAPI(
    title="LUNA API",
    description="Offline-first PDF eBook reader and audiobook companion platform API.",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for local Vite frontend
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
    """
    Health check endpoint confirming API status, storage directories, and SQLite database initialization.
    """
    return {
        "status": "healthy",
        "app": "LUNA API",
        "database_initialized": DB_PATH.exists(),
        "database_path": str(DB_PATH),
        "books_directory": str(BOOKS_DIR),
    }


@app.get("/api/books")
def list_books() -> List[Dict[str, Any]]:
    """
    Retrieve all books stored in the local SQLite database.
    Returns an empty list if no books have been imported yet.
    """
    return get_all_books()


@app.post("/api/books/import", status_code=status.HTTP_201_CREATED)
async def import_book(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Import an offline PDF eBook file:
    1. Validates that the uploaded file is a genuine PDF (.pdf extension & %PDF- magic header).
    2. Enforces a 50 MB file size limit without exhausting memory.
    3. Saves the file under local-data/books/ with an isolated UUID-generated filename.
    4. Extracts title and page count using pypdf (handles encryption and corruption).
    5. Inserts metadata into the SQLite books table.
    6. Ensures complete cleanup of orphaned files if any step fails.
    """
    original_filename = file.filename or "unknown.pdf"

    # Step 1: Validate file extension
    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents (.pdf) are supported.",
        )

    ensure_directories()

    # Step 2: Generate unique storage filename
    unique_filename = f"{uuid.uuid4().hex}.pdf"
    destination_path = BOOKS_DIR / unique_filename

    total_bytes_read = 0
    first_chunk = True

    try:
        # Step 3: Stream and write file with size and magic-header checks
        with open(destination_path, "wb") as out_file:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break

                total_bytes_read += len(chunk)

                # Check max upload size
                if total_bytes_read > MAX_UPLOAD_SIZE_BYTES:
                    destination_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum upload size limit of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB.",
                    )

                # Validate magic header on initial bytes (%PDF-)
                if first_chunk:
                    if not chunk.startswith(b"%PDF-"):
                        destination_path.unlink(missing_ok=True)
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid PDF file format. The file header does not match standard PDF specifications.",
                        )
                    first_chunk = False

                out_file.write(chunk)

        if total_bytes_read == 0:
            destination_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )

        # Step 4: Parse PDF metadata with pypdf
        try:
            reader = pypdf.PdfReader(str(destination_path))

            if reader.is_encrypted:
                # Attempt empty password decryption (some PDFs have empty password permissions)
                try:
                    decrypted = reader.decrypt("") != 0
                except Exception:
                    decrypted = False

                if not decrypted and reader.is_encrypted:
                    destination_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="The uploaded PDF is password-protected or encrypted and cannot be processed.",
                    )

            page_count = len(reader.pages)
            if page_count == 0:
                destination_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The uploaded PDF contains 0 pages.",
                )

            # Extract title from metadata or fallback to clean original filename
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
            destination_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to read this PDF. Check that the file is valid and is not password-protected.",
            )

        # Step 5: Save record to SQLite database
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        relative_storage_path = f"local-data/books/{unique_filename}"

        try:
            new_book = insert_book(
                title=extracted_title,
                original_filename=original_filename,
                stored_pdf_path=relative_storage_path,
                page_count=page_count,
                import_timestamp=now_str,
                extracted_text_status="pending",
            )
            return new_book
        except Exception:
            logger.exception("Failed to save metadata for uploaded PDF %r", original_filename)
            destination_path.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The PDF was received, but LUNA could not save its metadata. Check the backend terminal for details.",
            )

    except HTTPException:
        # Re-raise explicit HTTP exceptions after ensuring cleanup
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


@app.api_route("/api/books/{book_id}/pdf", methods=["GET", "HEAD"])
def get_book_pdf(book_id: int):
    """
    Safely retrieve and serve the stored PDF binary for a registered book:
    1. Validates that the book exists in the SQLite database.
    2. Resolves path strictly within local-data/books/ to prevent path traversal attacks.
    3. Returns standard application/pdf stream with original filename headers.
    """
    book = get_book_by_id(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in database.",
        )

    stored_path_str = book["stored_pdf_path"]
    filename_only = Path(stored_path_str).name

    # Strictly resolve within BOOKS_DIR
    target_file = (BOOKS_DIR / filename_only).resolve()
    books_dir_resolved = BOOKS_DIR.resolve()

    # Use Path.relative_to instead of string-prefix checks. A string-prefix check
    # can mistakenly accept a sibling such as "books-backup" as being inside "books".
    # Resolving first also detects symlinks that point outside the permitted directory.
    try:
        target_file.relative_to(books_dir_resolved)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: invalid file path.",
        )

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested PDF file is missing from local disk storage.",
        )

    return FileResponse(
        path=str(target_file),
        media_type="application/pdf",
        filename=book["original_filename"],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
