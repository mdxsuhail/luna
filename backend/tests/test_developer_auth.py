"""Regression tests for LUNA's developer login token lifecycle and CORS methods."""

import base64
import hashlib
import hmac
import json
import os
import unittest
from unittest.mock import patch

from fastapi.middleware.cors import CORSMiddleware

from main import (
    DEFAULT_DEV_CODE,
    DEFAULT_DEV_TOKEN_SECRET,
    _developer_token,
    _is_valid_developer_token,
    app,
)


class DeveloperTokenTests(unittest.TestCase):
    def test_default_local_code_can_issue_and_verify_token(self):
        with patch.dict(os.environ, {}, clear=True):
            token = _developer_token(DEFAULT_DEV_CODE)
            self.assertIsNotNone(token)
            self.assertTrue(token)
            self.assertTrue(_is_valid_developer_token(token))

    def test_wrong_code_is_rejected(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(_developer_token("wrong-code"), "")

    def test_environment_configuration_overrides_local_defaults(self):
        env = {
            "LUNA_DEV_CODE": "my-private-code",
            "LUNA_DEV_TOKEN_SECRET": "test-only-signing-secret-with-more-than-32-characters",
        }
        with patch.dict(os.environ, env, clear=True):
            self.assertEqual(_developer_token(DEFAULT_DEV_CODE), "")
            token = _developer_token("my-private-code")
            self.assertTrue(token)
            self.assertTrue(_is_valid_developer_token(token))

    def test_expired_token_is_rejected(self):
        with patch.dict(os.environ, {}, clear=True):
            token = _developer_token(DEFAULT_DEV_CODE)
            self.assertTrue(token)
            self.assertFalse(_is_valid_developer_token(token, now=2**31))

    def test_tampered_signature_is_rejected(self):
        with patch.dict(os.environ, {}, clear=True):
            token = _developer_token(DEFAULT_DEV_CODE)
            self.assertTrue(token)
            payload, signature = token.split(".", 1)
            replacement = ("A" if signature[0] != "A" else "B") + signature[1:]
            self.assertFalse(_is_valid_developer_token(f"{payload}.{replacement}"))

    def test_token_with_invalid_payload_is_rejected(self):
        with patch.dict(os.environ, {}, clear=True):
            payload = base64.urlsafe_b64encode(
                json.dumps({"role": "user", "exp": 2**31}).encode()
            ).rstrip(b"=").decode()
            self.assertFalse(_is_valid_developer_token(f"{payload}.not-a-valid-signature"))

    def test_signed_non_object_payload_is_rejected_without_server_error(self):
        with patch.dict(os.environ, {}, clear=True):
            payload = base64.urlsafe_b64encode(json.dumps(["not", "an", "object"]).encode()).rstrip(b"=").decode()
            signature = base64.urlsafe_b64encode(
                hmac.new(DEFAULT_DEV_TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).digest()
            ).rstrip(b"=").decode()
            self.assertFalse(_is_valid_developer_token(f"{payload}.{signature}"))

    def test_cors_allows_delete_for_book_removal(self):
        cors_middleware = next(
            middleware for middleware in app.user_middleware
            if middleware.cls is CORSMiddleware
        )
        self.assertIn("DELETE", cors_middleware.options["allow_methods"])


if __name__ == "__main__":
    unittest.main()
