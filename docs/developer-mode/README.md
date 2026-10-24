# LUNA Developer Mode

Developer Mode is for technical diagnostics and troubleshooting only. App appearance, PDF reader preferences, narration speed, and general project information belong in the ordinary user interface.

## Access and session security

The default local developer code is `123456789`. The backend verifies it at `POST /api/dev/login` and returns a signed token that expires after one hour. `GET /api/dev/verify` checks the token signature, role, and expiry using the same signing secret used by login.

For a private local override, set these variables in `backend/.env` and restart the backend:

```dotenv
LUNA_DEV_CODE=your-private-code
LUNA_DEV_TOKEN_SECRET=replace-with-a-random-secret-at-least-32-characters
```

Keep `backend/.env` private and never commit real secrets. The checked-in fallback code and signing secret are for local development only, not a security boundary for a network-facing application. Keep FastAPI bound to `127.0.0.1:8000`; do not expose it to a LAN or the public internet. The frontend stores the short-lived developer token in the current browser tab's session storage and removes it when Developer Mode is locked.

## Developer-only tools

- **Run diagnostics:** checks browser network status, Speech Synthesis API availability, browser local-storage access, backend health, and the most recent library request state.
- **Inspect runtime status:** shows API reachability, backend/app record counts, loading state, and the latest API error.
- **Retry backend/library loading:** refreshes the health endpoint and library records and reports whether the refresh succeeded.
- **Export/copy a JSON report:** includes API status, record counts, browser details, and diagnostic results. It does not include PDF contents, but it does include browser/runtime metadata; review it before sharing.
- **Lock Developer Mode:** clears the current tab's developer token and returns to the dashboard.

Diagnostics are best-effort checks, not a guarantee that every feature works. A browser's “online” flag does not prove internet access, and LUNA's local features are intended to work without internet.

## Regression tests

Run from the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
```

The developer-auth tests cover default and overridden configuration, wrong codes, token expiry, token tampering, malformed/incorrect-role tokens, and the CORS method required for PDF deletion.

## Deferred hardware

ESP32/device integration is intentionally deferred. Developer Mode does not attempt to connect to hardware.
