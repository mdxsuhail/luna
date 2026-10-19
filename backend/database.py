"""
Database configuration and operations for LUNA.
Offline-first SQLite storage management.
"""

from contextlib import contextmanager
from pathlib import Path
import sqlite3
from typing import Generator, List, Dict, Any, Optional

# Resolve absolute path to the project root and storage directories
# backend/database.py -> backend -> project_root -> local-data
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
LOCAL_DATA_DIR = PROJECT_ROOT / "local-data"
DB_DIR = LOCAL_DATA_DIR / "database"
DB_PATH = DB_DIR / "luna.db"
BOOKS_DIR = LOCAL_DATA_DIR / "books"
AUDIO_DIR = LOCAL_DATA_DIR / "audio"


def ensure_directories() -> None:
    """Ensure all required local-data parent directories exist."""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)


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


def init_db() -> None:
    """
    Initialize SQLite database and create the books table if not exists.
    Stores metadata for imported PDFs with local offline tracking.
    """
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
                file_size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (file_size_bytes >= 0),
                import_timestamp TEXT NOT NULL,
                extracted_text_status TEXT NOT NULL DEFAULT 'pending'
            );
            """
        )
        # Add file-size tracking to existing databases without losing imported books.
        columns = {row["name"] for row in cursor.execute("PRAGMA table_info(books)").fetchall()}
        if "file_size_bytes" not in columns:
            cursor.execute("ALTER TABLE books ADD COLUMN file_size_bytes INTEGER NOT NULL DEFAULT 0")
        # Imported PDFs use generated UUID filenames, so storage paths must be unique.
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_books_stored_pdf_path_unique ON books(stored_pdf_path)")


def get_all_books() -> List[Dict[str, Any]]:
    """
    Retrieve all books stored in SQLite database.
    Returns an empty list if no books are recorded.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                id,
                title,
                original_filename,
                stored_pdf_path,
                page_count,
                file_size_bytes,
                import_timestamp,
                extracted_text_status
            FROM books
            ORDER BY id DESC;
            """
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_book_by_id(book_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve a specific book record by its primary key ID.
    Returns None if not found.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                id,
                title,
                original_filename,
                stored_pdf_path,
                page_count,
                file_size_bytes,
                import_timestamp,
                extracted_text_status
            FROM books
            WHERE id = ?;
            """,
            (book_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def insert_book(
    title: str,
    original_filename: str,
    stored_pdf_path: str,
    page_count: int,
    file_size_bytes: int,
    import_timestamp: str,
    extracted_text_status: str = "pending",
) -> Dict[str, Any]:
    """
    Insert a newly imported book record into SQLite using parameterized queries.
    Returns the newly created book dictionary including its generated ID.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO books (
                title,
                original_filename,
                stored_pdf_path,
                page_count,
                file_size_bytes,
                import_timestamp,
                extracted_text_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
            """,
            (
                title,
                original_filename,
                stored_pdf_path,
                page_count,
                file_size_bytes,
                import_timestamp,
                extracted_text_status,
            ),
        )
        new_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT 
                id,
                title,
                original_filename,
                stored_pdf_path,
                page_count,
                file_size_bytes,
                import_timestamp,
                extracted_text_status
            FROM books
            WHERE id = ?;
            """,
            (new_id,),
        )
        row = cursor.fetchone()
        return dict(row)


def delete_book_record(book_id: int) -> Optional[Dict[str, Any]]:
    """Delete one book row and return its former metadata, or None if absent."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        row = cursor.fetchone()
        if not row:
            return None
        book = dict(row)
        cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
        return book
