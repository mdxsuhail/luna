"""Regression tests for LUNA's security-sensitive backend helpers.

Run from the repository root with:
    python -m unittest discover -s backend/tests -v
"""
from pathlib import Path
import sys
import tempfile
import unittest

# Make backend modules importable when unittest discovery is run from the repo root.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import extract_page_text, is_allowed_local_host, is_allowed_origin, is_path_within_directory
from pypdf import PdfReader, PdfWriter


class LocalHostValidationTests(unittest.TestCase):
    def test_accepts_supported_local_hosts(self):
        for host in ("localhost", "localhost:8000", "127.0.0.1", "127.0.0.1:8000"):
            with self.subTest(host=host):
                self.assertTrue(is_allowed_local_host(host))

    def test_rejects_remote_or_unexpected_hosts(self):
        for host in (None, "", "example.com", "localhost:9999", "127.0.0.1:9999", "[::1]:8000"):
            with self.subTest(host=host):
                self.assertFalse(is_allowed_local_host(host))

    def test_only_allows_known_frontend_origins(self):
        self.assertTrue(is_allowed_origin("http://localhost:5173"))
        self.assertTrue(is_allowed_origin("http://127.0.0.1:5173"))
        for origin in (None, "", "https://localhost:5173", "http://localhost:5174", "https://evil.example"):
            with self.subTest(origin=origin):
                self.assertFalse(is_allowed_origin(origin))


class PathSafetyTests(unittest.TestCase):
    def test_path_must_resolve_inside_books_directory(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            books_dir = root / "books"
            books_dir.mkdir()
            inside = books_dir / "book.pdf"
            outside = root / "secret.txt"
            inside.touch()
            outside.touch()
            self.assertTrue(is_path_within_directory(inside, books_dir))
            self.assertFalse(is_path_within_directory(outside, books_dir))


class PdfTextExtractionTests(unittest.TestCase):
    def test_rejects_page_numbers_outside_document(self):
        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        reader = PdfReader(writer)
        with self.assertRaises(ValueError):
            extract_page_text(reader, 0)
        with self.assertRaises(ValueError):
            extract_page_text(reader, 2)

    def test_blank_page_returns_empty_text(self):
        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        reader = PdfReader(writer)
        self.assertEqual(extract_page_text(reader, 1), "")


if __name__ == "__main__":
    unittest.main()
