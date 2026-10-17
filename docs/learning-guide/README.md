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
| **06** | [Viva & Technical Interview Prep](06-viva-and-interview-prep.md) | 25+ academic evaluation and engineering interview questions with rigorous technical answers | Full stack concepts, ASGI, ACID, CORS, security |

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
