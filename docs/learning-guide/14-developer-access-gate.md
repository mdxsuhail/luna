# Module 14: Developer-Only Access Gate

The current application shell asks for a locally configured developer code before showing the About, Settings, and Device Integration pages. The main dashboard, library, PDF reader, and normal reading workflow remain available without unlocking this area.

## Files involved

- `frontend/src/App.tsx`: gate UI, login request, browser session token storage, and verification.
- `backend/main.py`: local environment loading, signed-token creation, login and verification endpoints.
- `backend/.env.example`: placeholder configuration instructions.
- `.gitignore`: excludes real environment files; inspect it before adding any secret file.

## Local configuration

1. From the repository, copy `backend/.env.example` to `backend/.env`.
2. Replace `LUNA_DEV_CODE` with a private code of at least 8 characters.
3. Replace `LUNA_DEV_TOKEN_SECRET` with a random secret of at least 32 characters.
4. Do not commit `backend/.env`, paste these values into an issue, or place them in frontend code.
5. Restart the backend after changing the file because values are loaded when the Python module starts.

The simple local environment loader reads key/value lines and does not override variables already set by the operating system. It is not a full implementation of every feature supported by the third-party `python-dotenv` format.

## Login flow

1. The user enters a code in the frontend gate.
2. `POST /api/dev/login` receives JSON such as `{"code":"..." }`.
3. The backend checks that the configured code and signing secret meet minimum lengths.
4. It compares the submitted code using `hmac.compare_digest`.
5. If valid, the backend signs a compact payload with HMAC-SHA256. The payload contains the developer role and an expiry approximately one hour in the future.
6. The frontend stores the token in `sessionStorage` as `luna_dev_token`.
7. When restoring or entering a gated page, the frontend calls `GET /api/dev/verify` with an `Authorization: Bearer <token>` header.
8. Locking the area removes the session token and returns to the dashboard if the user was on a gated page.

## Why the token is signed

A client can edit browser storage, so the backend must not trust a plain value such as `developerUnlocked=true`. The signature lets the backend detect token changes without keeping a database session table. The expiry limits the useful lifetime of a copied token.

## Security boundary and limitations

- This is a lightweight developer-area gate for a local single-user app, not a full account system.
- The secret is kept in backend environment configuration; never embed it in the React bundle.
- Session tokens are stored in browser `sessionStorage`, which is scoped to the browser tab/session and is still accessible to same-origin JavaScript.
- The code currently does not implement login rate limiting, multi-user identity, password reset, audit logs, or server-side session revocation.
- The gate only controls which pages the frontend renders. It does not protect the repository source code or automatically authenticate every backend endpoint.
- Keep Uvicorn bound to `127.0.0.1`; do not expose this prototype on a LAN or the public internet.
- Security tests and CI are regression checks, not a formal penetration test.

## API responses

| Endpoint | Expected purpose | Typical result |
|---|---|---|
| `POST /api/dev/login` | Check the submitted developer code | Returns a token when configured and correct; 400 for missing code, 401 for wrong code, 503 if secrets are not configured. |
| `GET /api/dev/verify` | Verify bearer token signature and expiry | Returns `{"authenticated": true}` for a valid token; otherwise 401. |

## Current implementation review note

Malformed token strings must always be treated as unauthenticated input. The verification function should catch decoding errors from the Base64 library as well as JSON/type/value errors and return HTTP 401, not an unhandled HTTP 500. See the active fix review in [PR #48](https://github.com/mdxsuhail/luna/pull/48); that fix is not part of the main branch until merged.
