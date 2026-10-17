"""Regression tests for LUNA's local API security helpers and resource caps."""

import sys
import unittest
from pathlib import Path
from unittest.mock import Mock

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import (  # noqa: E402
    MAX_EXTRACTED_TEXT_CHARS,
    extract_page_text,
    is_allowed_local_host,
    is_allowed_origin,
)


class LocalApiSecurityTests(unittest.TestCase):
    def test_accepts_only_expected_local_hosts(self):
        self.assertTrue(is_allowed_local_host("127.0.0.1"))
        self.assertTrue(is_allowed_local_host("localhost"))
        self.assertFalse(is_allowed_local_host("192.168.1.10"))
        self.assertFalse(is_allowed_local_host("attacker.example"))
        self.assertFalse(is_allowed_local_host(None))

    def test_accepts_only_exact_frontend_origins(self):
        self.assertTrue(is_allowed_origin("http://localhost:5173"))
        self.assertTrue(is_allowed_origin("http://127.0.0.1:5173"))
        self.assertFalse(is_allowed_origin("https://localhost:5173"))
        self.assertFalse(is_allowed_origin("http://localhost.evil.example:5173"))
        self.assertFalse(is_allowed_origin("null"))
        self.assertFalse(is_allowed_origin(None))

    def test_caps_extracted_text_size(self):
        reader = Mock()
        reader.pages = [Mock()]
        reader.pages[0].extract_text.return_value = "x" * (MAX_EXTRACTED_TEXT_CHARS + 100)

        result = extract_page_text(reader, 1)

        self.assertEqual(len(result), MAX_EXTRACTED_TEXT_CHARS)


if __name__ == "__main__":
    unittest.main()
