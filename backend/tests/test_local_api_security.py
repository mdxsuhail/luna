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
    MAX_UPLOAD_REQUEST_BYTES,
    extract_page_text,
    is_allowed_local_host,
    is_allowed_origin,
    protect_local_api,
)


class LocalApiSecurityTests(unittest.TestCase):
    def test_accepts_only_expected_local_hosts_and_port(self):
        for host in ("127.0.0.1", "127.0.0.1:8000", "localhost", "localhost:8000"):
            with self.subTest(host=host):
                self.assertTrue(is_allowed_local_host(host))

        for host in (
            "192.168.1.10",
            "attacker.example",
            "localhost.evil.example",
            "localhost:9999",
            "127.0.0.1:9999",
            "localhost:8000.evil",
            None,
            "",
        ):
            with self.subTest(host=host):
                self.assertFalse(is_allowed_local_host(host))

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
        self.assertEqual(len(extract_page_text(reader, 1)), MAX_EXTRACTED_TEXT_CHARS)

    def _request(self, method="POST", host="127.0.0.1:8000", origin="http://localhost:5173", content_length=None):
        headers = [(b"host", host.encode("ascii"))]
        if origin is not None:
            headers.append((b"origin", origin.encode("ascii")))
        if content_length is not None:
            headers.append((b"content-length", str(content_length).encode("ascii")))
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

    def _run_middleware(self, request):
        async def call_next(_request):
            return Response("allowed", status_code=200)
        return asyncio.run(protect_local_api(request, call_next))

    def test_middleware_blocks_untrusted_browser_origin(self):
        response = self._run_middleware(self._request(origin="http://attacker.example"))
        self.assertEqual(response.status_code, 403)

    def test_middleware_blocks_missing_origin_on_state_change(self):
        response = self._run_middleware(self._request(origin=None))
        self.assertEqual(response.status_code, 403)

    def test_middleware_blocks_non_loopback_host_header(self):
        response = self._run_middleware(self._request(host="attacker.example"))
        self.assertEqual(response.status_code, 400)

    def test_middleware_blocks_unexpected_host_port(self):
        response = self._run_middleware(self._request(host="127.0.0.1:9999"))
        self.assertEqual(response.status_code, 400)

    def test_middleware_allows_local_frontend_origin(self):
        response = self._run_middleware(self._request(origin="http://localhost:5173"))
        self.assertEqual(response.status_code, 200)

    def test_middleware_rejects_oversized_upload_before_body_parsing(self):
        response = self._run_middleware(self._request(content_length=MAX_UPLOAD_REQUEST_BYTES + 1))
        self.assertEqual(response.status_code, 413)

    def test_middleware_rejects_invalid_content_length(self):
        request = self._request()
        request.scope["headers"].append((b"content-length", b"not-a-number"))
        response = self._run_middleware(request)
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
