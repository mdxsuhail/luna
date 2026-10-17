# Module 02: Backend Deep Dive

This module provides a line-by-line code explanation of the LUNA backend implementation. The backend consists of two Python modules:
1. `backend/database.py`: Database connection management, table schemas, and data access objects (DAOs).
2. `backend/main.py`: FastAPI server, CORS middleware, REST routes, upload streaming, and security controls.

---

## Part 1: Database Layer (`backend/database.py`)

### 1. Module Imports & Path Resolution (Lines 1–20)

```python
from contextlib import contextmanager
from pathlib import Path
import sqlite3
from typing import Generator, List, Dict, Any, Optional

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
LOCAL_DATA_DIR = PROJECT_ROOT / "local-data"
DB_DIR = LOCAL_DATA_DIR / "database"
DB_PATH = DB_DIR / "luna.db"
BOOKS_DIR = LOCAL_DATA_DIR / "books"
AUDIO_DIR = LOCAL_DATA_DIR / "audio"
```

#### Why it's written this way:
- **`Path(__file__).resolve().parent`**: Determines the absolute canonical path of the `backend/` folder on disk regardless of the current working directory from which Python was launched.
- **`PROJECT_ROOT = BACKEND_DIR.parent`**: Traverses up one directory level to the repository root (`c:\Users\ADMIN\Desktop\community`).
- **Dynamic Path Construction**: By deriving `local-data/` relative to `PROJECT_ROOT`, LUNA functions correctly whether started from the project root, from inside `backend/`, or from an automated batch script.

---

### 2. Idempotent Directory Initialization (Lines 22–27)

```python
def ensure_directories() -> None:
    """Ensure all required local-data parent directories exist."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
```

- **`parents=True`**: Creates intermediate directories in the path if they do not exist.
- **`exist_ok=True`**: Prevents an `OSError: [Errno 17] File exists` exception if the directory is already present. This makes the function **idempotent** (can be called repeatedly with no side effects).

---

### 3. Connection Management Context Manager (Lines 29–46)

```python
@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager providing a SQLite database connection with row access
    and guaranteed cleanup.
    """
    ensure_directories()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
```

#### Code Mechanics & Viva Points:
- **`@contextmanager` Decorator**: Transforms a generator function into a Python context manager compatible with the `with` statement.
- **`conn.row_factory = sqlite3.Row`**: Configures SQLite to return dict-like row objects instead of plain tuples. This allows fields to be accessed by column name (e.g., `row["title"]`) while remaining subscriptable by index (`row[0]`).
- **Transaction Safety (`commit` & `rollback`)**:
  - If the code inside the `with` block executes without error, `conn.commit()` commits the transaction to disk.
  - If any exception is raised, `conn.rollback()` restores the database to its pre-transaction state, preventing partial or corrupted data.
- **Guaranteed Resource Cleanup**: The `finally: conn.close()` block guarantees that the file lock and connection are closed even when uncaught exceptions occur, preventing SQLite database lock errors (`sqlite3.OperationalError: database is locked`).

---

### 4. Database Schema DDL (`init_db`) (Lines 48–69)

```python
def init_db() -> None:
    ensure_directories()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                stored_pdf_path TEXT NOT NULL,
                page_count INTEGER NOT NULL DEFAULT 0,
                import_timestamp TEXT NOT NULL,
                extracted_text_status TEXT NOT NULL DEFAULT 'pending'
            );
            """
        )
```

#### Table Schema Breakdown:
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier automatically incremented with each insert. |
| `title` | `TEXT` | `NOT NULL` | Document title extracted from PDF metadata or clean filename stem. |
| `original_filename` | `TEXT` | `NOT NULL` | The original filename on the user's computer (e.g., `computer_systems.pdf`). |
| `stored_pdf_path` | `TEXT` | `NOT NULL` | The relative path to the UUID-named storage file (e.g., `local-data/books/f3a8...pdf`). |
| `page_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Total number of pages extracted by `pypdf`. |
| `import_timestamp` | `TEXT` | `NOT NULL` | Formatted timestamp string (`YYYY-MM-DD HH:MM:SS`) when imported. |
| `extracted_text_status` | `TEXT` | `NOT NULL DEFAULT 'pending'` | Tracks background OCR/text extraction (`pending`, `processing`, `completed`). |

---

### 5. Data Access Methods (Lines 71–175)

```python
def get_all_books() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT ... FROM books ORDER BY id DESC;")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
```
- **`[dict(row) for row in rows]`**: Converts the `sqlite3.Row` instances into standard Python dictionaries so that FastAPI can serialize them directly into JSON responses.

```python
def insert_book(title: str, original_filename: str, stored_pdf_path: str,
                page_count: int, import_timestamp: str,
                extracted_text_status: str = "pending") -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO books (title, original_filename, stored_pdf_path,
                               page_count, import_timestamp, extracted_text_status)
            VALUES (?, ?, ?, ?, ?, ?);
            """,
            (title, original_filename, stored_pdf_path, page_count, import_timestamp, extracted_text_status),
        )
        new_id = cursor.lastrowid
        cursor.execute("SELECT ... FROM books WHERE id = ?;", (new_id,))
        row = cursor.fetchone()
        return dict(row)
```
- **Parameterized Queries (`?` placeholders)**: Values are bound via tuples `(title, ...)`. This prevents **SQL Injection** attacks because user-supplied strings are treated strictly as data literals, never executable SQL commands.
- **`cursor.lastrowid`**: Retrieves the newly generated auto-incrementing integer ID from the insert operation to immediately return the full database record.

---

## Part 2: API & Application Core (`backend/main.py`)

### 1. Lifespan Handler & FastAPI Setup (Lines 1–49)

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_directories()
    init_db()
    yield

app = FastAPI(
    title="LUNA API",
    description="Offline-first PDF eBook reader and audiobook companion platform API.",
    version="0.1.0",
    lifespan=lifespan,
)
```

#### Why `lifespan` is used instead of `@app.on_event("startup")`:
FastAPI deprecated `@app.on_event("startup")` in favor of standard ASGI `lifespan` context managers.
- Everything before the `yield` runs **before** the server starts receiving requests (ensures directories and tables exist).
- Everything after the `yield` runs when the server shuts down (can be used for resource cleanup).

---

### 2. Cross-Origin Resource Sharing (CORS) (Lines 51–64)

```python
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
```

#### Why CORS is necessary:
In a web browser, the frontend runs at `http://localhost:5173` while the backend runs at `http://127.0.0.1:8000`. Because the port numbers differ, the browser's **Same-Origin Policy (SOP)** treats them as separate origins and blocks XMLHttpRequests/fetch unless the server returns headers permitting the frontend origin (`Access-Control-Allow-Origin: http://localhost:5173`).

---

### 3. Health Check Endpoint (Lines 66–78)

```python
@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "app": "LUNA API",
        "database_initialized": DB_PATH.exists(),
        "database_path": str(DB_PATH),
        "books_directory": str(BOOKS_DIR),
    }
```
- Returns storage diagnostics for developer inspection and launcher verification.
- Used by `start-luna.bat` and the frontend `AppContext` to verify backend readiness before attempting book queries.

---

### 4. PDF Import Pipeline (`/api/books/import`) (Lines 89–233)

This is the core business logic of the backend:

```python
@app.post("/api/books/import", status_code=status.HTTP_201_CREATED)
async def import_book(file: UploadFile = File(...)) -> Dict[str, Any]:
```

#### Step A: Extension Validation
```python
original_filename = file.filename or "unknown.pdf"
if not original_filename.lower().endswith(".pdf"):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid file type. Only PDF documents (.pdf) are supported.",
    )
```

#### Step B: Unique UUID Storage Path Generation
```python
unique_filename = f"{uuid.uuid4().hex}.pdf"
destination_path = BOOKS_DIR / unique_filename
```
- Avoids naming collisions if the user imports two files with the same name (e.g., `notes.pdf`).
- Avoids path-injection vulnerabilities from unsanitized filenames.

#### Step C: Chunked Streaming with Size Ceiling and Magic-Byte Inspection
```python
total_bytes_read = 0
first_chunk = True

with open(destination_path, "wb") as out_file:
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break

        total_bytes_read += len(chunk)

        # Enforce 50 MB ceiling
        if total_bytes_read > MAX_UPLOAD_SIZE_BYTES:
            destination_path.unlink(missing_ok=True)
            raise HTTPException(status_code=413, detail="File exceeds 50 MB limit.")

        # Inspect initial chunk magic bytes
        if first_chunk:
            if not chunk.startswith(b"%PDF-"):
                destination_path.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="Invalid PDF file format.")
            first_chunk = False

        out_file.write(chunk)
```

#### Step D: Metadata Parsing with `pypdf`
```python
reader = pypdf.PdfReader(str(destination_path))

# Check for encryption
if reader.is_encrypted:
    try:
        decrypted = reader.decrypt("") != 0
    except Exception:
        decrypted = False
    if not decrypted and reader.is_encrypted:
        destination_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="The PDF is password-protected.")

page_count = len(reader.pages)
if page_count == 0:
    destination_path.unlink(missing_ok=True)
    raise HTTPException(status_code=400, detail="The PDF contains 0 pages.")

# Title extraction fallback
extracted_title = None
if reader.metadata and reader.metadata.title:
    extracted_title = str(reader.metadata.title).strip()
if not extracted_title:
    extracted_title = Path(original_filename).stem.strip() or "Untitled Document"
```

#### Step E: Database Insertion & Cleanup Handling
```python
new_book = insert_book(
    title=extracted_title,
    original_filename=original_filename,
    stored_pdf_path=f"local-data/books/{unique_filename}",
    page_count=page_count,
    import_timestamp=now_str,
    extracted_text_status="pending",
)
return new_book
```
- In the event of any exception during parsing or database insertion, the `except` blocks call `destination_path.unlink(missing_ok=True)` to ensure partial files never leak on disk.

---

### 5. Safe PDF Streaming Endpoint (`/api/books/{book_id}/pdf`) (Lines 235–275)

```python
@app.api_route("/api/books/{book_id}/pdf", methods=["GET", "HEAD"])
def get_book_pdf(book_id: int):
    book = get_book_by_id(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found in database.")

    stored_path_str = book["stored_pdf_path"]
    filename_only = Path(stored_path_str).name

    target_file = (BOOKS_DIR / filename_only).resolve()
    books_dir_resolved = BOOKS_DIR.resolve()

    # Path traversal assertion
    if not str(target_file).startswith(str(books_dir_resolved)):
        raise HTTPException(status_code=403, detail="Access denied: invalid file path.")

    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(status_code=404, detail="PDF missing from local disk.")

    return FileResponse(
        path=str(target_file),
        media_type="application/pdf",
        filename=book["original_filename"],
    )
```

#### Key Implementation Details:
- **Supports Both `GET` and `HEAD`**: Browsers and PDF viewer components frequently issue `HEAD` requests to verify file size (`Content-Length`) and range headers before fetching binary chunks.
- **`FileResponse`**: Uses Starlette/FastAPI's optimized streaming file response, which streams the file in chunks with proper `Content-Type: application/pdf` headers rather than buffering the entire file into server memory.
