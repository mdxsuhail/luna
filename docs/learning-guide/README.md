# LUNA Engineering & Learning Handbook

Welcome to the **LUNA Learning Handbook**. This guide provides an exhaustive, code-accurate technical walkthrough of the entire LUNA codebase (`C:\Users\ADMIN\Desktop\community`). It is specifically crafted for self-learners, software engineering students, open-source contributors, and college project viva/evaluation preparation.

Unlike high-level user manuals, this handbook explains **how the actual code works under the hood**—including line-by-line analyses, database schemas, streaming protocols, Windows process management, debugging case studies, and architectural trade-offs.

---

## 🗺️ Learning Path & Curriculum

To build a thorough understanding of LUNA, follow these modules in order:

| Module | Title | Primary Focus | Key Files Covered |
|---|---|---|---|
| **01** | [Architecture & Data Flow](01-architecture-and-data-flow.md) | High-level system design, offline-first philosophy, end-to-end data pipelines | System topology, `local-data/` layout |
| **02** | [Backend Deep Dive](02-backend-deep-dive.md) | Line-by-line explanation of FastAPI endpoints, SQLite schema, `pypdf` parsing, security | `backend/main.py`, `backend/database.py` |
| **03** | [Frontend Deep Dive](03-frontend-deep-dive.md) | React 18 component tree, Context state machine, API clients, reader engine, styling | `frontend/src/App.tsx`, `AppContext.tsx`, `api.ts`, `LibraryPage.tsx`, `ReaderPage.tsx` |
| **04** | [Launcher & DevOps](04-launcher-and-devops.md) | Windows CMD quote parsing rules, background daemon spawning, socket polling, Vite bundler | `start-luna.bat`, `frontend/vite.config.ts`, `package.json` |
| **05** | [Debugging & Troubleshooting](05-debugging-and-troubleshooting.md) | Real-world bug postmortems, socket collisions, syntax quirks, and diagnostic commands | Shell diagnostics, port utilities |
| **06** | [Viva & Technical Interview Prep](06-viva-and-interview-prep.md) | Academic evaluation and engineering interview preparation | Full-stack concepts, ASGI, ACID, CORS, security |
| **07** | [Security Fixes & Tests](07-security-fixes-and-tests.md) | Regression testing, path safety, CI checks | Backend tests and GitHub Actions |
| **08** | [Functional PDF Reader](08-functional-pdf-reader.md) | PDF viewing flow and known reader limits | Reader page and PDF streaming |
| **09** | [PDF Text Extraction API](09-pdf-text-extraction-api.md) | One-page selectable text extraction | FastAPI, pypdf |
| **10–11** | [Security Hardening](10-security-hardening.md) and [Advanced Local API Security](11-advanced-local-api-security.md) | Local host/origin and request-size defenses | Middleware and security tests |
| **12** | [Browser Audiobook & Playback State](12-browser-audiobook-and-playback-state.md) | Speech synthesis, timer, refs and playback limits | AppContext, AudiobooksPage, API client |
| **13** | [Current UI & Library Experience](13-current-ui-and-library-experience.md) | Pages, reusable components and actual persistence | App shell, library, dashboard, reader, playlists |
| **14** | [Developer Access Gate](14-developer-access-gate.md) | Local code, signed session token, gated pages | App.tsx, backend login/verify routes |
| **15** | [Account, Navigation & Appearance](15-account-navigation-and-themes.md) | Sidebar order, System/Light/Dark preference, localStorage, account shortcut, password/session flow | Sidebar.tsx, AppContext.tsx, SettingsPage.tsx, ProfilesPage.tsx, auth.py, index.css |

---

## 🧭 Source Code to Handbook Map

Use this directory map to trace each repository file to its detailed handbook explanation:

```
c:\Users\ADMIN\Desktop\community\
├── start-luna.bat                -> Covered in Module 04 (Launcher & DevOps) & Module 05 (Debugging)
├── backend/
│   ├── main.py                   -> Covered in Module 02 (Backend Deep Dive) & Module 01 (Data Flow)
│   ├── database.py               -> Covered in Module 02 (Backend Deep Dive - SQLite & Concurrency)
│   └── requirements.txt          -> Covered in Module 02 (Backend Deep Dive - Dependency Ecosystem)
├── frontend/
│   ├── package.json              -> Covered in Module 04 (Launcher & DevOps - NPM Scripts & Tooling)
│   ├── vite.config.ts            -> Covered in Module 04 (Launcher & DevOps - Vite Bundler Setup)
│   └── src/
│       ├── App.tsx               -> Covered in Module 03 (Frontend Deep Dive - Root Shell & View Switch)
│       ├── main.tsx              -> Covered in Module 03 (Frontend Deep Dive - React DOM Mounting)
│       ├── index.css             -> Covered in Module 03 (Frontend Deep Dive - Pure CSS Token System)
│       ├── types/index.ts        -> Covered in Module 03 (Frontend Deep Dive - TypeScript Data Models)
│       ├── context/
│       │   └── AppContext.tsx    -> Covered in Module 03 (Frontend Deep Dive - Central State Machine)
│       ├── services/
│       │   └── api.ts            -> Covered in Module 03 (Frontend Deep Dive - HTTP Client & Adapters)
│       ├── pages/
│       │   ├── LibraryPage.tsx   -> Covered in Module 03 (Frontend Deep Dive - PDF Upload & Catalog)
│       │   ├── ReaderPage.tsx    -> Covered in Module 03 (Frontend Deep Dive - Multi-Theme Document Canvas)
│       │   ├── AudiobooksPage.tsx-> Covered in Module 03 (Frontend Deep Dive - Audiobook Directory)
│       │   └── DevicePage.tsx    -> Covered in Module 01 (Architecture - Hardware Decoupling)
│       └── components/layout/
│           ├── Sidebar.tsx       -> Covered in Module 03 (Frontend Deep Dive - Layout Components)
│           ├── Header.tsx        -> Covered in Module 03 (Frontend Deep Dive - Layout Components)
│           └── PersistentPlayer.tsx -> Covered in Module 03 (Frontend Deep Dive - Global Audio Dock)
└── local-data/
    ├── database/luna.db          -> Covered in Module 02 (Backend Deep Dive - SQLite Tables & DDL)
    ├── books/                    -> Covered in Module 01 & 02 (PDF Streaming & Storage)
    └── audio/                    -> Covered in Module 01 (Reserved Audio Directory)
```

---

## 🔄 Documentation Freshness & Maintenance Ledger

This section tracks the review status of every source file in the repository to guarantee documentation integrity.

| Source File / Module | Handbook Section | Last Reviewed | Review Trigger / Dependencies | Status |
|---|---|---|---|---|
| `start-luna.bat` | [Module 04](04-launcher-and-devops.md), [Module 05](05-debugging-and-troubleshooting.md) | 2026-10-17 | Changes to launch flags, port checks, quoting logic | **Current** |
| `backend/main.py` | [Module 02](02-backend-deep-dive.md), [Module 01](01-architecture-and-data-flow.md) | 2026-10-17 | Changes to FastAPI routes, file streaming, CORS, upload limits | **Current** |
| `backend/database.py` | [Module 02](02-backend-deep-dive.md) | 2026-10-17 | Schema alterations, SQL queries, directory helpers | **Current** |
| `frontend/src/context/AppContext.tsx` | [Module 03](03-frontend-deep-dive.md) | 2026-10-17 | State additions, `refreshBooks()` logic, active book tracking | **Current** |
| `frontend/src/services/api.ts` | [Module 03](03-frontend-deep-dive.md) | 2026-10-17 | New API endpoints, HTTP timeout changes, model adapters | **Current** |
| `frontend/src/pages/LibraryPage.tsx` | [Module 03](03-frontend-deep-dive.md) | 2026-10-17 | Upload modal behavior, drag-and-drop validation, search logic | **Current** |
| `frontend/src/pages/ReaderPage.tsx` | [Module 03](03-frontend-deep-dive.md) | 2026-10-17 | Themes, typography scaling, PDF rendering canvas integration | **Current** |
| `frontend/src/components/layout/PersistentPlayer.tsx` | [Module 03](03-frontend-deep-dive.md) | 2026-10-17 | Audio progress scrubbing, playback speed handlers | **Current** |
| `frontend/package.json` | [Module 04](04-launcher-and-devops.md) | 2026-10-17 | Dependencies updates, build script modifications | **Current** |
| `optional-device/` | [Module 01](01-architecture-and-data-flow.md) | 2026-10-17 | Physical device firmware or serial communication additions | **Stub (Empty in repo)** |

### Known Coverage Gaps & Honest Disclosures
1. **Automated Backend OCR / TTS**: The database table contains `extracted_text_status TEXT DEFAULT 'pending'`, but `backend/main.py` does not yet contain a background OCR or TTS worker. This is accurately documented as a future pipeline rather than claimed as working code.
2. **Client-Side Playlists**: Playlist creation and track lists in `frontend/src/pages/PlaylistsPage.tsx` currently run off client-side mock data (`mockPlaylists`) because backend audio/playlist CRUD endpoints have not yet been implemented.
3. **Hardware Companion**: The folder `optional-device/` is currently empty. The handbook documents the proposed USB/BLE communication pattern while clearly emphasizing that LUNA functions 100% independently as a desktop application.


---

## Current Feature Truth Table (Reviewed 2026-10-19)

| Feature | Actual implementation | What must not be claimed |
|---|---|---|
| PDF import | FastAPI streams an upload to local disk, validates size/header, parses metadata with pypdf, and stores a row in SQLite. | Do not claim OCR or that all arbitrary PDFs are safe to parse. |
| PDF reading | Browser displays the registered PDF via the local API; reader controls provide a UI around the browser PDF viewer. | Do not claim a custom PDF.js canvas renderer or persistent bookmarks. |
| PDF text extraction | `GET /api/books/{book_id}/text?page=N` extracts selectable text on demand. | Do not claim extracted text is persisted or scanned pages are OCR'd. |
| Audiobook/narration | Frontend uses browser Speech Synthesis for extracted text. | Do not claim LUNA generates, caches, or exports MP3/WAV files. |
| Playback progress | Frontend keeps playback-related state in React and uses an elapsed-time counter. | Do not claim exact audio duration, true seeking, or SQLite persistence. |
| Playlists | Current playlist state is client-side/mock data. | Do not claim playlist changes survive reload or sync to SQLite. |
| Settings/About pages | Accessible without the developer code; optional Device Integration remains gated. | Do not claim that password reset/email verification exists or that this protects all backend routes. |
| Account login | SQLite-backed user records; scrypt password hashes and hashed session tokens. | Test signup/sign-in locally; do not commit real credentials or claim cloud synchronization. |
| Appearance preference | System/Light/Dark choice stored in browser `localStorage`. | This is browser-local, not a synchronized account preference; audit hardcoded colours across pages. |
| Developer login | HMAC-signed token with an expiry, using secrets from local backend environment. | Do not commit real `backend/.env` values or expose the local backend publicly. |
| Hardware companion | Optional concept/UI only. | ESP32 hardware is not required and a completed hardware connection is not implemented by these UI components. |

## Keeping the Handbook Synchronized

For every feature-changing pull request:

1. List the source files whose behavior changed.
2. Update the matching chapter(s) and the root README if the public feature description changed.
3. Update the source-to-handbook map if files or endpoints were added/removed.
4. Separate verified behavior from intended behavior and known limitations.
5. Run the relevant tests/build and record the exact result; never write “tested” if the command was not run.
6. Include documentation in the same pull request as the code change whenever possible.

The handbook is a learning aid, not a substitute for reading the actual source. Code is authoritative if documentation and implementation ever disagree.
