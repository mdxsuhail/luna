"""Regression tests for LUNA's local API security helpers and resource caps."""

import asyncio
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock

from starlette.requests import Request
from starlette.responses import Response

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import (  # noqa: E402
    MAX_EXTRACTED_TEXT_CHARS,
    extract_page_text,
    is_allowed_local_host,
    is_allowed_origin,
    protect_local_api,
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


    def _request(self, method="POST", host="127.0.0.1:8000", origin="http://localhost:5173"):
        headers = [(b"host", host.encode("ascii"))]
        if origin is not None:
            headers.append((b"origin", origin.encode("ascii")))
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method,
            "scheme": "http",
            "path": "/api/books/import",
            "raw_path": b"/api/books/import",
            "query_string": b"",
            "headers": headers,
            "client": ("127.0.0.1", 12345),
            "server": ("127.0.0.1", 8000),
        }
        return Request(scope)

    def test_middleware_blocks_untrusted_browser_origin(self):
        async def call_next(_request):
            return Response("should not run")
        response = asyncio.run(protect_local_api(self._request(origin="http://attacker.example"), call_next))
        self.assertEqual(response.status_code, 403)

    def test_middleware_blocks_non_loopback_host_header(self):
        async def call_next(_request):
            return Response("should not run")
        response = asyncio.run(protect_local_api(self._request(host="attacker.example"), call_next))
        self.assertEqual(response.status_code, 400)

    def test_middleware_allows_local_frontend_origin(self):
        async def call_next(_request):
            return Response("allowed", status_code=200)
        response = asyncio.run(protect_local_api(self._request(origin="http://localhost:5173"), call_next))
        self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
