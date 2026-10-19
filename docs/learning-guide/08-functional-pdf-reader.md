# LUNA Reader: How PDF Viewing Works

This note explains the first functional PDF-reader implementation.

## What happens when a user opens a book?

1. The Library page selects a book and sends its database ID to the app context.
2. The Reader page calls `getBookPdfUrl(activeBook.id)`.
3. The helper in `frontend/src/services/api.ts` builds a local URL such as `http://127.0.0.1:8000/api/books/12/pdf`.
4. FastAPI looks up that ID in SQLite using `get_book_by_id`.
5. The backend takes the stored filename, resolves it under the local books directory, and checks that the resolved path remains inside the permitted directory.
6. FastAPI returns a `FileResponse` with media type `application/pdf` and `content_disposition_type="inline"`. Starlette otherwise defaults to attachment disposition when a filename is supplied, which can trigger downloading instead of embedded viewing.
7. The `iframe` in `ReaderPage.tsx` displays the returned PDF using the browser's built-in PDF viewer. No cloud service or paid API is required.

## Important code

### `getBookPdfUrl`

In `frontend/src/services/api.ts`:

```ts
export function getBookPdfUrl(bookId: number | string): string {
  return `${API_BASE_URL}/api/books/${bookId}/pdf`;
}
```

- `bookId` identifies the database record, not a user-supplied filesystem path.
- `API_BASE_URL` is the local FastAPI server.
- The backend decides which stored file corresponds to that ID.

### The iframe

In `frontend/src/pages/ReaderPage.tsx`:

```tsx
<iframe
  key={String(activeBook.id)}
  title={`PDF reader: ${activeBook.title}`}
  src={`${getBookPdfUrl(activeBook.id)}#page=${readerPage}&toolbar=0&navpanes=0`}
/>
```

- `key` makes React recreate the viewer when a different book is opened.
- `title` provides an accessible name for the embedded document.
- `src` points to the local PDF endpoint.
- The fragment beginning with `#page=` asks supported browser PDF viewers to open at the selected page. This fragment is handled by the browser's PDF viewer; it is not sent to FastAPI.
- `toolbar=0` and `navpanes=0` are viewer hints and may be ignored by some browsers.

## What is and is not implemented?

Implemented:
- PDF import and metadata storage in SQLite.
- Local PDF streaming through FastAPI.
- Browser-native PDF viewing in the Reader page.
- An option to open the PDF in a separate browser tab.

Still planned:
- A custom PDF.js canvas viewer for consistent page controls across browsers.
- Persistent reading position and bookmarks.
- Extracted PDF text connected to the reader and local text-to-speech.
- Real audiobook audio generation and playback.

## Manual test

1. Start LUNA with the project's launcher.
2. Open My Library and import a valid, non-password-protected PDF.
3. Open that book in the Reader.
4. Confirm that the original PDF pages appear inside the reader.
5. Use the page controls and confirm whether your browser's PDF viewer follows the requested page. Browser behavior can differ.
6. Select **Open PDF separately** to confirm the local backend serves the document in a new tab.

If the embedded viewer is blank, open the separate PDF link. If both fail, check that the backend is running and inspect the backend terminal for an HTTP error.
