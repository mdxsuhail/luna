# Module 03: Frontend Deep Dive

This module provides a comprehensive technical breakdown of the LUNA frontend application. The frontend is built with **React 18**, **TypeScript 5.6**, and **Vite 5.4**, using native CSS3 custom properties for its design system.

---

## 1. Frontend Architecture & State Flow

LUNA employs the **React Context API** rather than heavy external state management libraries (like Redux or MobX). Because LUNA is an offline, single-user desktop application, React's built-in `createContext` and `useReducer`/`useState` hooks provide high performance and zero external bundle overhead.

```
┌──────────────────────────────────────────────────────────┐
│                   <AppProvider />                        │
│  (Holds activeBook, isPlaying, books, readerTheme, etc.) │
└────────────────────────────┬─────────────────────────────┘
                             │ Provides Context Values
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│ <Sidebar />  │     │ <Header />   │     │ <PersistentPlayer│
│ Page Nav     │     │ Search/Stats │     │ Global Audio Bar │
└──────────────┘     └──────────────┘     └──────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Current Active Viewport      │
              │  - <DashboardPage />         │
              │  - <LibraryPage /> (Upload)  │
              │  - <ReaderPage /> (Themes)   │
              │  - <AudiobooksPage />        │
              │  - <SettingsPage />          │
              └──────────────────────────────┘
```

---

## 2. Type System (`frontend/src/types/index.ts`)

TypeScript interfaces guarantee strict contract adherence between the FastAPI backend response payloads and the React UI:

### Backend-to-Frontend Data Contract

```typescript
// 1. Raw SQLite book record returned by GET /api/books
export interface ApiBook {
  id: number;
  title: string;
  original_filename: string;
  stored_pdf_path: string;
  page_count: number;
  import_timestamp: string;
  extracted_text_status: string;
}

// 2. Extended Frontend Book model with UI presentation properties
export interface Book {
  id: string | number;
  title: string;
  originalFilename?: string;
  storedPdfPath?: string;
  pageCount?: number;
  importTimestamp?: string;
  extractedTextStatus?: string;
  author: string;
  category: string;
  format: 'PDF' | 'EPUB';
  fileSize: string;
  totalPages: number;
  currentPage: number;
  progressPercentage: number;
  lastRead: string;
  coverHue: string;
  description: string;
  hasAudio: boolean;
  audioStatus: 'ready' | 'queued' | 'not_generated';
  audioDuration: string;
  chapters: Chapter[];
}
```

#### Why two separate interfaces exist:
- **`ApiBook`**: Reflects the exact database schema columns returned by FastAPI (`snake_case`).
- **`Book`**: Extends the raw record with computed frontend metadata (`camelCase`, calculated cover hue colors, estimated reading progress, and chapter objects).
- The adapter function `adaptApiBook` in `frontend/src/services/api.ts` maps `ApiBook` into `Book`.

---

## 3. Central State Machine (`frontend/src/context/AppContext.tsx`)

The `AppProvider` component manages application lifecycle, server synchronization, reading state, and audio sessions:

### 1. Data Synchronization Lifecycle (`refreshBooks`)

```typescript
const refreshBooks = useCallback(async () => {
  setIsLoadingBooks(true);
  setApiError(null);

  try {
    // Step 1: Query backend health status
    const health = await fetchHealth();
    setBackendHealth(health);
    setIsBackendOnline(true);

    // Step 2: Fetch SQLite book catalog
    const rawBooks = await fetchBooks();
    setApiBooks(rawBooks);

    // Step 3: Adapt SQLite rows to frontend models
    const adapted = rawBooks.map(adaptApiBook);
    setBooks(adapted);

    // Step 4: Ensure active book remains valid
    setActiveBook((current) => {
      if (!current && adapted.length > 0) return adapted[0];
      if (current && !adapted.some((b) => b.id === current.id)) {
        return adapted.length > 0 ? adapted[0] : null;
      }
      return current;
    });
  } catch (err: any) {
    setIsBackendOnline(false);
    setBackendHealth(null);
    setBooks([]);
    setApiBooks([]);
    setActiveBook(null);
    setApiError(err.message || 'Unable to connect to LUNA backend.');
  } finally {
    setIsLoadingBooks(false);
  }
}, []);
```

#### Key Architecture Notes:
- **`useCallback`**: Memoizes the function so it can be passed safely to child components and dependencies without causing unnecessary component re-renders.
- **Graceful Failure**: If the FastAPI backend is offline when the frontend loads, LUNA does not crash. It sets `isBackendOnline = false`, displays a non-intrusive warning banner, and offers a retry button.

---

## 4. API Service Layer (`frontend/src/services/api.ts`)

Centralizes all network interaction with the backend at `http://127.0.0.1:8000`:

### 1. Timeout Protection with `AbortController`

```typescript
export async function fetchHealth(): Promise<ApiHealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection to LUNA backend timed out after 4 seconds.');
    }
    throw new Error(`Unable to connect to LUNA backend at ${API_BASE_URL}.`);
  }
}
```
- **Why this is critical**: Standard `fetch` in JavaScript has no default timeout and can hang indefinitely if the backend port is deadlocked or unreceptive. `AbortController` enforces a strict 4–5 second ceiling before freeing up the UI thread.

### 2. PDF Upload Function (`uploadBookPdf`)

```typescript
export async function uploadBookPdf(file: File): Promise<ApiBook> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/books/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Upload failed with HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.detail) errorMessage = errorJson.detail;
    } catch {
      // JSON parse fallback
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
```
- Constructs a browser `FormData` instance which causes `fetch` to automatically set the HTTP header `Content-Type: multipart/form-data; boundary=...`.

---

## 5. Key UI Component Walkthroughs

### 1. Book Library (`frontend/src/pages/LibraryPage.tsx`)
- **Drag-and-Drop Ingestion**: The upload modal binds `onDragOver`, `onDragLeave`, and `onDrop` events directly to an HTML drop target.
- **Client-Side Validation**: Checks `file.size <= 50 * 1024 * 1024` and `file.name.toLowerCase().endsWith('.pdf')` **before** sending bytes across the network.
- **Search Filtering**: Performs instant, case-insensitive substring search across both `book.title` and `book.originalFilename`.

### 2. Distraction-Free Reader (`frontend/src/pages/ReaderPage.tsx`)
- **Multi-Theme Canvas**: Supports four reading themes using CSS classes:
  - `.theme-charcoal`: Low-contrast dark mode for night reading.
  - `.theme-sepia`: Warm cream background (`#f7eed7`) reducing blue-light exposure.
  - `.theme-paper`: High-contrast black-on-white print style.
  - `.theme-oled`: Absolute black (`#000000`) for high power efficiency on OLED displays.
- **Typography Sizing**: Allows real-time font adjustment from `14px` to `26px` stored directly in the active reader state.
- **Bookmark State**: Local toggle tracking saved pages for fast re-navigation.

### 3. Persistent Audio Player (`frontend/src/components/layout/PersistentPlayer.tsx`)
- **Global Dock**: Fixed to the bottom of the viewport so users can listen to audiobooks while browsing their library, dashboard, or settings.
- **Playback Controls**: Features interactive play/pause toggling, 15-second skip backward/forward, playback speed selection (0.75x, 1.0x, 1.25x, 1.5x, 2.0x), and interactive progress scrubbing.

---

## 6. Styling Architecture (`frontend/src/index.css`)

LUNA uses **Pure Vanilla CSS with Design Tokens** rather than Tailwind CSS or CSS-in-JS.

### Design Tokens (`:root`)
```css
:root {
  --bg-primary: #0a0b10;
  --bg-sidebar: #0f1118;
  --bg-card: #151824;
  --bg-elevated: #1b1f2e;
  
  --text-main: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;

  --accent-primary: #6366f1;   /* Indigo */
  --accent-emerald: #10b981;   /* Emerald */
  --accent-amber: #f59e0b;     /* Amber */

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(99, 102, 241, 0.4);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

#### Advantages of this approach:
1. **Zero Runtime Overhead**: No style-invalidation or JavaScript runtime computation required.
2. **Instant Theming**: Modifying a CSS variable instantly cascades across the entire DOM tree without re-rendering React components.
3. **Glassmorphism**: Combines `backdrop-filter: blur(12px)` with subtle border alpha channels (`rgba(255, 255, 255, 0.08)`) to produce a sleek, contemporary reading interface.
