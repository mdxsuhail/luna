# Module 13: Current UI, Library, Dashboard, and Editorial Components

This module maps the user-facing views to the code that implements them. The visual design is not itself evidence that a backend feature exists; always check whether an action changes React state, calls an API, or persists to SQLite.

## Application shell

File: `frontend/src/App.tsx`

- Wraps the application in `AppProvider`, which exposes shared state.
- Renders the sidebar, header, active page, and persistent player.
- Uses the `activePage` value from `useApp()` to select a page component. This is an in-app view switch, not a full URL-based router.
- Handles the developer-only gate for the Developer Mode page. About and Settings are ordinary user-facing pages. See [Module 14](14-developer-access-gate.md).

## Shared state and data models

- `frontend/src/context/AppContext.tsx` owns the library records loaded from the API, active book/chapter, reader preferences, notifications, and narration state.
- `frontend/src/types/index.ts` defines TypeScript interfaces for API records and UI models.
- `frontend/src/services/api.ts` is the centralized HTTP adapter. `adaptApiBook` maps the backend's snake_case fields to the frontend's `Book` model and adds presentation defaults.

A displayed field is not necessarily database-backed. For example, category, author, cover color, file-size estimate, reading progress, and some dashboard activity values can be presentation defaults or demonstration data rather than extracted metadata.

## Main pages and supporting components

| File | Responsibility | Data/persistence notes |
|---|---|---|
| `pages/DashboardPage.tsx` | Landing dashboard and overview widgets | Some cards use the current library; activity/statistics can be illustrative. |
| `pages/LibraryPage.tsx` | Search, view modes, selection, and PDF import | The authoritative book catalogue comes from `GET /api/books`; imported PDF metadata persists in SQLite. |
| `components/library/BookCard.tsx`, `BookListRow.tsx` | Reusable grid/list book displays | Presentation of the shared book model. |
| `components/library/ShelfCarousel.tsx` | Shelf-style library presentation | Reuses filtered library records; it does not create a separate catalogue. |
| `components/dashboard/ContinueReading.tsx`, `RecentBooks.tsx`, `StatsOverview.tsx` | Dashboard sections | Treat progress/activity as illustrative unless a real persistence path is confirmed. |
| `pages/ReaderPage.tsx` | Opens the selected PDF, reader appearance controls, page navigation UI | PDF bytes come from the local API. Custom PDF.js rendering and durable bookmarks/reading position are not implemented. |
| `pages/AudiobooksPage.tsx` | Speech narration controls | Uses browser speech synthesis and extracted page text; not a generated MP3 library. |
| `components/layout/PersistentPlayer.tsx` | Playback controls available across views | Shares state with `AppContext`; it is not an independent audio engine. |
| `pages/PlaylistsPage.tsx` | Playlist-themed interface and tape selection | Playlist data is currently client-side/mock data; no playlist CRUD API exists. |
| `pages/AboutPage.tsx` | About/mission presentation | Ordinary user-facing page; no developer code required. |
| `pages/SettingsPage.tsx` | Local UI settings | Ordinary user-facing page. Distinguish settings that persist in browser storage from temporary React state. |
| `pages/DevicePage.tsx` | Legacy companion-device prototype | Not wired into current navigation; hardware integration is deferred and is not required to run LUNA. |
| `components/common/FolderStack.tsx`, `TapeStack.tsx` | Interactive editorial-inspired visual components | Visual/state interactions; not real filesystem folders or audio-cassette media. |
| `components/common/StatusBanner.tsx`, `Modal.tsx` | Reusable status and modal UI | Presentation primitives. |

## Data flow examples

### Library import

`LibraryPage.tsx` selects a browser `File` → `uploadBookPdf` in `services/api.ts` sends multipart form data → FastAPI validates and writes the PDF → `pypdf` reads metadata/page count → SQLite stores the book record → frontend refreshes `books` and adapts records for display.

### Opening a PDF

The selected UI `Book` provides its ID → `getBookPdfUrl(id)` builds a local URL → browser requests `GET /api/books/{id}/pdf` → backend looks up the registered record, resolves the stored filename inside the allowed books directory, and returns a PDF response.

### Dashboard and shelf

The UI consumes the shared `books` array. Filtering and alternate presentation modes do not imply extra backend records, file-system directories, or database tables.

## CSS and responsive design

- `frontend/src/index.css` contains global styles and CSS custom properties.
- Component-specific CSS files include `FolderStack.css`, `TapeStack.css`, `ShelfCarousel.css`, and `AboutPage.css`.
- Responsive rules and accessible button semantics are part of the interface, but mobile browser checks are still automated checks, not a substitute for testing the app on actual devices.

## Safe documentation rule

For every UI control, identify the handler and follow it to the end. If the handler only calls `setState`, describe it as session/UI state. If it calls an API, name the endpoint. If it writes to SQLite or disk, name the table/path. Do not claim persistence simply because a control appears in Settings, Library, or a player.
