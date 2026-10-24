# Module 14: Developer Mode Access Gate

Developer Mode is a gated, developer-only diagnostics page. The About page, Settings page, dashboard, library, and reading workflow remain available without unlocking it. ESP32 integration is deferred and the legacy `DevicePage.tsx` is not wired into current navigation.

## Files involved

- `frontend/src/App.tsx`: access form, login request, browser session token storage, token verification, and lock action.
- `frontend/src/pages/DeveloperPage.tsx`: browser/backend diagnostics, library refresh, and JSON report export.
- `backend/main.py`: local environment loading, signed-token creation, login/verification endpoints, and local API restrictions.
- `backend/tests/test_developer_auth.py`: regression tests for developer token handling and CORS configuration.
- `docs/developer-mode/README.md`: practical developer tools and local-only security instructions.

## Local configuration and access code

The requested local default code is `123456789`. The backend also has a checked-in fallback signing secret so local Developer Mode can work without a `.env` file. These defaults are visible in this public repository and are **not production secrets**.

For a private local override, create `backend/.env` with:

```dotenv
LUNA_DEV_CODE=your-private-code
LUNA_DEV_TOKEN_SECRET=replace-with-a-random-secret-at-least-32-characters
```

Restart the backend after changing the file. The local loader does not override environment variables already set by the operating system. Keep real environment files untracked and never place secrets in frontend code.

## Login and verification flow

1. The user enters the developer code in the frontend access form.
2. The frontend sends the code to `POST /api/dev/login` as JSON.
3. The backend checks the submitted code with `hmac.compare_digest`.
4. If it matches, the backend signs a payload containing the developer role and an expiry one hour in the future using HMAC-SHA256.
5. The frontend stores the token in `sessionStorage` as `luna_dev_token`.
6. On session restore and when opening Developer Mode, the frontend calls `GET /api/dev/verify` with an `Authorization: Bearer` header.
7. The backend verifies the signature, confirms that the payload is an object with the developer role, and rejects expired, malformed, oversized, or tampered tokens.
8. Locking Developer Mode removes the tab's token and returns to the dashboard when the user is on the developer page.

Login and verification must use the same signing-secret configuration. A mismatch would allow the backend to issue a token and then reject that token during verification; the regression tests cover this case using both defaults and environment overrides.

## Security boundary and limitations

- This is a lightweight page-access gate for a local single-user prototype, not a full authentication system.
- The default code and fallback signing secret are public local-development defaults. Keep FastAPI bound to `127.0.0.1:8000`; do not expose it to a LAN or the internet.
- Use a private `LUNA_DEV_CODE` and random `LUNA_DEV_TOKEN_SECRET` in an untracked `backend/.env` for local overrides.
- Tokens live in `sessionStorage`, which is accessible to same-origin JavaScript.
- There is no login rate limiting, multi-user developer identity, audit log, or server-side developer-session revocation.
- The gate controls frontend page access; it does not authenticate every backend route.
- Host/origin restrictions and CORS reduce some browser-based abuse but are not a substitute for security review before network deployment.
- Automated tests are regression checks, not a formal penetration test.

## API behavior

| Endpoint | Purpose | Expected behavior |
|---|---|---|
| `POST /api/dev/login` | Verify the submitted code | Returns a signed token for a correct code; 400 for a missing code; 401 for an incorrect code. |
| `GET /api/dev/verify` | Verify a bearer token | Returns `{"authenticated": true}` for a valid token; otherwise returns 401. |

## Run regression tests

From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
```

The developer-auth tests cover default and overridden codes/secrets, incorrect codes, token expiry, signature tampering, non-developer roles, non-object payloads, and the CORS method used by PDF deletion.
