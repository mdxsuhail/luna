"""Unit tests for PDF page text extraction.""" 

import sys
import unittest
from pathlib import Path
from unittest.mock import Mock

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import extract_page_text  # noqa: E402


class PageTextExtractionTests(unittest.TestCase):
    def setUp(self):
        self.reader = Mock()
        self.reader.pages = [
            Mock(),
            Mock(),
        ]

    def test_extracts_requested_one_based_page(self):
        self.reader.pages[1].extract_text.return_value = "  Hello from page two.  "

        self.assertEqual(extract_page_text(self.reader, 2), "Hello from page two.")
        self.reader.pages[1].extract_text.assert_called_once_with()
        self.reader.pages[0].extract_text.assert_not_called()

    def test_returns_empty_string_when_page_has_no_selectable_text(self):
        self.reader.pages[0].extract_text.return_value = None

        self.assertEqual(extract_page_text(self.reader, 1), "")

    def test_rejects_page_number_below_one(self):
        with self.assertRaises(ValueError):
            extract_page_text(self.reader, 0)

    def test_rejects_page_number_above_page_count(self):
        with self.assertRaises(ValueError):
            extract_page_text(self.reader, 3)


if __name__ == "__main__":
    unittest.main()
