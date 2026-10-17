# LUNA — Final Session Audit and Handoff

**Audit date:** 2026-10-17  
**Repository:** [mdxsuhail/luna](https://github.com/mdxsuhail/luna)  
**Purpose:** Record what was verified at the end of this work session and provide a safe starting point for the next session.

## Current repository status

- The mobile responsive CSS improvement is merged to `main`.
- The Playwright browser-check workflow is merged to `main` in [PR #17](https://github.com/mdxsuhail/luna/pull/17).
- The CI run for that change completed successfully: [workflow run #39053310215](https://github.com/mdxsuhail/luna/actions/runs/39053310215).
- The run's four jobs passed: backend tests, frontend build/type-check, dependency security audits, and responsive browser checks.
- Browser checks simulate 320×568, 375×667, 390×844, 768×1024, and 1280×800. They are not a substitute for testing on a physical phone or for a complete manual PDF import/read workflow.

## Implemented functionality (do not overstate)

- FastAPI backend with a local SQLite database.
- PDF import with extension and `%PDF-` header checks, 50 MB file limit, page-count limit, UUID storage names, metadata extraction, and cleanup on failure.
- PDF streaming and one-page text extraction with path-boundary checks.
- React/Vite frontend with a responsive layout and a browser-native PDF viewing path.
- CI tests, dependency audits, and responsive-layout smoke tests.
- Windows launcher `start-luna.bat`; confirm it on the target Windows machine before relying on it.

## Known limitations

- Audiobook player controls are a UI prototype; real audio playback and local text-to-speech are not implemented.
- PDF viewing uses the browser's built-in viewer. Custom PDF.js rendering, integrated extracted-text reading, OCR for scanned PDFs, and persistent bookmarks/reading progress are not implemented.
- Playlist persistence and some dashboard statistics may still be client-side or demonstration state.
- The application has no login or multi-user authentication.
- No physical-device browser testing or complete manual end-to-end test is claimed by this audit.
- The optional ESP32 companion is not required for the software app.

## Security posture and boundaries

The current code includes:
- Loopback Host allowlisting for the local API.
- Exact local frontend Origin allowlisting for state-changing requests.
- CORS allowlisting for the two supported Vite origins.
- A required and validated `Content-Length` on PDF upload, plus a request-body ceiling.
- Streamed 1 MB file writes and a 50 MB PDF file limit.
- PDF header, encryption, non-empty page count, and 20,000-page limit checks.
- Canonical path containment checks before serving or extracting text from stored PDFs.
- Parameterized SQLite statements and reduced health-endpoint filesystem disclosure.
- CI dependency audits for Python packages and high-severity production npm vulnerabilities.

These controls reduce risk for a local, single-user prototype; they do **not** make the app safe to expose to a LAN or the public internet. There is no authentication, rate limiting, sandboxed PDF parsing process, or comprehensive protection from parser denial-of-service. Treat uploaded PDFs as untrusted input.

## Reproduce checks locally

From the repository root:

### Backend tests (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
cd ..
```

### Frontend type-check and production build

```powershell
cd frontend
npm ci
npm run build
```

### Dependency audits

```powershell
python -m pip install --upgrade pip pip-audit
python -m pip_audit -r backend/requirements.txt
cd frontend
npm audit --omit=dev --audit-level=high
```

If the Python audit command fails because the module name is not recognized, use `pip-audit -r backend/requirements.txt` after installing `pip-audit`. The GitHub Actions workflow is the authoritative record for the CI audit result.

### Responsive browser test

The CI job installs Playwright and Chromium temporarily and runs:

```bash
node frontend/tests/mobile-layout.mjs
```

The test expects the Vite preview server at `http://127.0.0.1:4173` by default. To run locally, build and start the preview server first, then execute the script. Playwright is not a regular project dependency.

## Recommended next-session order

1. Pull the latest `main` and review this handoff before editing.
2. Start the backend and frontend using the instructions in the root README.
3. Manually import a small, non-sensitive sample PDF, open it, restart the app, and verify that the library entry and stored file remain available.
4. Test at least one physical phone and one desktop browser; record actual results rather than assuming viewport emulation proves device behavior.
5. Fix any reproduced bugs before adding features.
6. Add regression tests for each bug, update the relevant numbered learning guide, and update the README only when the user-facing behavior or setup instructions change.
7. Prioritize local TTS and real audio playback only after the PDF workflow is verified end to end.

## Session exit checklist

- [x] Mobile responsive CSS merged.
- [x] Automated responsive browser smoke test merged.
- [x] Latest associated CI run passed all four jobs.
- [x] README links to the learning guide and describes current CI coverage.
- [x] Security boundaries and known limitations documented.
- [ ] Physical phone test completed.
- [ ] Full manual PDF import/restart/read test completed.
- [ ] Audio playback/TTS implemented.

The unchecked items above are intentionally left open; do not describe them as completed.
