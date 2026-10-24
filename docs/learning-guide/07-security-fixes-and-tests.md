# Security Fixes and Automated Checks

This note explains the reliability changes in the current branch. Read the source file alongside this document; comments and names in code are the authoritative implementation.

## 1. PDF streaming path validation

File: `backend/main.py`

### The problem with string-prefix checks

A check such as:

```python
str(candidate).startswith(str(allowed_directory))
```

is not a safe directory containment test. For example, the path `/data/books-backup/secret.pdf` begins with the string `/data/books`, even though it is not inside that directory.

### The helper

```python
def is_path_within_directory(candidate: Path, directory: Path) -> bool:
    """Return True only when candidate resolves to a path inside directory."""
    try:
        candidate.resolve().relative_to(directory.resolve())
        return True
    except ValueError:
        return False
```

- `Path.resolve()` converts paths to canonical paths and follows symbolic links.
- `relative_to()` succeeds only if the candidate is the same directory or a descendant of the allowed directory.
- `ValueError` means the candidate is outside the allowed directory, so the helper returns `False`.
- The PDF endpoint rejects an unsafe path with HTTP 403 before returning the file.

This is a defense-in-depth check. The endpoint also takes only the stored filename component before combining it with the books directory.

## 2. Safer error responses and logs

The import endpoint now logs unexpected server-side failures while returning a generic error message to the browser. This is preferable to returning raw exception strings, which can reveal internal file paths or database implementation details.

- `logger.info(...)` records a PDF parsing failure without treating an invalid user file as an unexpected server crash.
- `logger.exception(...)` records the unexpected exception and its traceback in the backend terminal/log.
- The client receives a helpful message that does not expose the internal exception.

When debugging locally, inspect the backend terminal for the detailed traceback.

## 3. Path-safety tests

File: `backend/tests/test_path_safety.py`

The tests use Python's built-in `unittest` framework and temporary directories. They check that the helper:

1. accepts a PDF path inside the allowed books directory;
2. rejects a similarly named sibling directory such as `books-backup`;
3. rejects a symbolic link that resolves outside the books directory, where the OS permits symlink creation.

Temporary directories are automatically cleaned up after each test. The tests do not read or modify the user's real LUNA library.

Run the tests from the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m unittest discover -s backend/tests -v
```

If you already installed backend dependencies in `backend/.venv`, use:

```powershell
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend/tests -v
```

## 4. GitHub Actions checks

File: `.github/workflows/ci.yml`

On each push and pull request, GitHub Actions:

- installs backend requirements and runs the path-safety tests;
- installs frontend dependencies using the committed lockfile with `npm ci`;
- runs `npm run build`, which type-checks TypeScript and builds the Vite frontend.

A passing workflow means these automated checks passed in GitHub's clean runner. It does not prove every UI interaction works, so manually test importing and opening a PDF as well.

## 5. Current limitations to explain honestly

- PDF upload, metadata extraction, SQLite storage, and PDF streaming are backend features.
- The reader canvas still uses placeholder content; full PDF page rendering has not been implemented yet.
- Audiobook controls are currently a user-interface prototype. Actual local TTS generation and real audio playback are not implemented.
- Playlist and some reading-session state are held in frontend memory and are not yet persisted in SQLite.

Do not describe these prototype screens as completed PDF rendering or audiobook playback during a project presentation.


## 6. Developer token verification and CORS regression fixes

Files: `backend/main.py`, `backend/tests/test_developer_auth.py`

The developer login and verification endpoints must use the same signing secret. Previously, login could sign a token with the local fallback secret while verification required an environment variable and rejected that same token. The verifier now uses the same configured secret fallback as the issuer, checks the signature and developer role, rejects malformed/oversized tokens, and treats a token as expired when its expiry is equal to or earlier than the current time.

The local developer code is a convenience gate, not production authentication. The checked-in fallback values are public because this repository is public; keep the API on loopback only. Use private `LUNA_DEV_CODE` and `LUNA_DEV_TOKEN_SECRET` values in an untracked `backend/.env` for local overrides. Do not expose the backend to a LAN or the internet.

The CORS method list now includes `DELETE`, which is required for the frontend's PDF-removal request. The host/origin middleware still restricts state-changing requests to the expected local frontend origins.

The regression suite verifies the default and overridden developer configuration, invalid codes, token tampering, expiry, invalid token payloads, and the configured CORS methods. Run all backend tests with:

```powershell
python -m unittest discover -s backend/tests -v
```

## 7. Diagnostic UI cleanup

File: `frontend/src/pages/DeveloperPage.tsx`

Developer Mode now contains diagnostics and debugging actions only. The non-functional roadmap cards were removed rather than presenting planned features as working controls. Diagnostic checks reset their loading state in a `finally` block, local-storage test data is cleaned up when possible, warning counts are shown separately from failures, and library refresh now reports its actual success/failure result.

The shared `refreshBooks` function returns a boolean result so callers can communicate the outcome accurately. This is a small contract change: existing callers may continue to await or ignore the returned value.
