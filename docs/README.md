# LUNA Documentation

Start here, depending on what you need:

- [Root README](../README.md) — overview, setup, supported features, API examples, testing, security boundaries, and roadmap.
- [01 — Architecture and data flow](learning-guide/01-architecture-and-data-flow.md)
- [02 — Backend deep dive](learning-guide/02-backend-deep-dive.md)
- [03 — Frontend deep dive](learning-guide/03-frontend-deep-dive.md)
- [04 — Launcher and development operations](learning-guide/04-launcher-and-devops.md)
- [05 — Debugging and troubleshooting](learning-guide/05-debugging-and-troubleshooting.md)
- [06 — Viva and interview preparation](learning-guide/06-viva-and-interview-prep.md)
- [07 — Security fixes and tests](learning-guide/07-security-fixes-and-tests.md)
- [08 — Functional PDF reader](learning-guide/08-functional-pdf-reader.md)
- [09 — PDF text extraction API](learning-guide/09-pdf-text-extraction-api.md)
- [10 — Security hardening](learning-guide/10-security-hardening.md)
- [11 — Advanced local API hardening](learning-guide/11-advanced-local-api-hardening.md)
- [12 — Final session audit and handoff](learning-guide/12-final-session-audit-and-handoff.md)

## Learning method

Read the architecture guide first, then follow the request from the React UI through the API client, FastAPI route, SQLite operation, and local file storage. Keep the source open while reading: line-level details can change as the code evolves. For each change, explain what it does, why it exists, what data it receives/returns, what can fail, and which test covers it.
