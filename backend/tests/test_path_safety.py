"""Unit tests for LUNA's local file path safety helpers."""

import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import is_path_within_directory  # noqa: E402


class PathContainmentTests(unittest.TestCase):
    def test_accepts_file_inside_books_directory(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            books = Path(temp_dir) / "books"
            books.mkdir()
            candidate = books / "sample.pdf"
            candidate.touch()

            self.assertTrue(is_path_within_directory(candidate, books))

    def test_rejects_sibling_directory_with_similar_prefix(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            books = root / "books"
            sibling = root / "books-backup"
            books.mkdir()
            sibling.mkdir()
            candidate = sibling / "private.pdf"
            candidate.touch()

            self.assertFalse(is_path_within_directory(candidate, books))

    def test_rejects_symlink_that_resolves_outside_books_directory(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            books = root / "books"
            outside = root / "outside.pdf"
            books.mkdir()
            outside.touch()
            link = books / "linked.pdf"

            try:
                link.symlink_to(outside)
            except (OSError, NotImplementedError):
                self.skipTest("Symlink creation is not available in this environment")

            self.assertFalse(is_path_within_directory(link, books))


if __name__ == "__main__":
    unittest.main()
