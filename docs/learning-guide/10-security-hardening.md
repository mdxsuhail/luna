# LUNA Security Hardening Notes

This document records the defensive checks added to the local FastAPI backend. LUNA is a single-user local prototype, not an internet-facing service.

## Threats addressed

- **Host-header / DNS-rebinding boundary:** requests are accepted only when the backend URL hostname is `localhost` or `127.0.0.1`. The backend should continue binding to `127.0.0.1`, never `0.0.0.0`, for ordinary desktop use.
- **Cross-origin state-changing requests:** mutating HTTP methods reject a supplied `Origin` header unless it exactly matches one of the local Vite frontend origins. This supplements CORS; CORS alone is not a complete CSRF defense.
- **Excessive PDF processing:** imports reject documents above 20,000 pages after parsing the page tree. Text extraction returns at most 1,000,000 characters for one page response.
- **Information disclosure:** the health endpoint reports readiness without returning absolute local filesystem paths.
- **Least-privilege CORS:** only the frontend origins, required methods, and common request headers are allowed; credentialed cross-origin requests are disabled.

## Checks and limits

Automated unit tests cover accepted/rejected hostnames, exact allowed origins, and the extracted-text response cap. Existing path-containment tests cover sibling paths and symlinks where supported. CI also runs the backend test suite and the frontend TypeScript/build check.

These are targeted hardening measures, not a formal penetration test. There is no authentication because the intended app is a local single-user prototype; do not expose the backend to a LAN or the internet. The page-count limit is applied after pypdf reads the page tree, so it cannot eliminate every parser CPU/memory denial-of-service risk. Keep pypdf updated and only import documents from sources you trust.

## Manual verification

1. Start the backend bound to `127.0.0.1:8000`.
2. Open `http://127.0.0.1:8000/api/health`; it should not reveal absolute disk paths.
3. Open the frontend at `http://localhost:5173`; library and PDF import operations should continue working.
4. A browser request from an unrelated origin attempting a state-changing operation should receive HTTP 403.
5. A request sent with a non-loopback Host header should receive HTTP 400.
