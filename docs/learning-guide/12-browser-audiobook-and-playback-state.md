# Module 12: Browser Text-to-Speech and Playback State

This module documents the current browser-based narration path. It is important to distinguish speech synthesis from a generated audiobook file: LUNA asks the browser to speak extracted PDF text. It does not currently render and store an MP3/WAV audiobook.

## Source files

- `frontend/src/context/AppContext.tsx`: playback state and speech queue orchestration.
- `frontend/src/pages/AudiobooksPage.tsx`: audiobook controls and status.
- `frontend/src/components/layout/PersistentPlayer.tsx`: persistent playback controls.
- `frontend/src/services/api.ts`: HTTP calls, including PDF page-text requests.
- `backend/main.py`: `GET /api/books/{book_id}/text?page=N`.

## End-to-end playback flow

1. The user opens a book in the app and selects Play.
2. `AppContext.togglePlay` checks that a book is selected and that the browser exposes `speechSynthesis` and `SpeechSynthesisUtterance`.
3. The frontend requests selectable text for a PDF page from the local API.
4. FastAPI resolves the book ID through SQLite, validates the registered PDF path, opens the PDF with `pypdf`, and extracts only the requested page.
5. The backend returns JSON containing `book_id`, `title`, `page`, `page_count`, `text`, `has_text`, and `message`.
6. The frontend creates a `SpeechSynthesisUtterance`, applies the selected rate, and queues it with the browser speech engine.
7. Speech completion/error callbacks and session identifiers help the app progress through pages or ignore callbacks from an older playback session.

No PDF content is sent to a remote LUNA service. The browser's own installed speech voices are used; voice availability and quality depend on the operating system and browser.

## Important React state and refs

| Name | Purpose |
|---|---|
| `isPlaying` | UI state indicating whether narration is considered active. |
| `audioPositionSeconds` | Elapsed-time display; it is not a decoded audio timestamp. |
| `playbackSpeed` | Speech rate, clamped by the context setter to the range 0.5–2.0. |
| `sleepTimerMinutes` | Shared sleep-timer selection; when active, a timer can stop speech. |
| `activeUtteranceRef` | Keeps a reference to the current utterance so its rate can be updated. |
| `speechSessionRef` | Session counter used to distinguish current playback from stale callbacks. |
| `speechPageRef` | Tracks the page being narrated. |
| `speechBookIdRef` | Tracks which book belongs to the current narration session. |
| `speechPausedRef` | Tracks whether Play/Pause should resume an existing speech queue. |

Refs are used for values needed by asynchronous callbacks without making every change trigger a React render. State is used for values that the UI displays.

## What the controls can and cannot do

- **Play/Pause:** uses the browser speech queue's speak/pause/resume/cancel behavior.
- **Speed:** changes the speech utterance rate. Browser engines may apply a rate change differently depending on when the utterance was queued.
- **Sleep timer:** is a client-side timer, not an OS-level alarm. It only runs while this app page is alive.
- **Elapsed time:** is an approximate wall-clock counter. It is not an exact measure of spoken words.
- **Seeking and rewind/fast-forward:** browser speech synthesis does not expose a reliable seek API or total duration. Do not present a counter change as if it moved the spoken position.
- **Voice profile:** labels in the UI are not proof that a specific installed voice was selected. A real voice picker should enumerate `speechSynthesis.getVoices()` and set `utterance.voice`.
- **Chapters:** PDF page text is not automatically a semantic chapter structure. Any chapter labels supplied by client-side data should not be described as PDF outline parsing unless that implementation is added.

## Known limitations

- Scanned PDFs contain page images and need OCR; OCR is not included.
- Text extraction can return empty text for pages with no selectable text.
- No generated audio file is cached or persisted.
- Playback position, voice choice, sleep timer, and reading state are not currently persisted in SQLite.
- Browser speech may pause or behave differently when the tab is backgrounded, the browser changes, or the operating system suspends the machine.
- The current UI and timer must be tested in the target browser before being treated as production-grade.

## Debugging checklist

1. Confirm the backend is listening at `http://127.0.0.1:8000`.
2. Check `GET /api/health` and `GET /api/books`.
3. Test `GET /api/books/{id}/text?page=1` at `http://127.0.0.1:8000/docs`.
4. Confirm the returned `has_text` is true before expecting narration.
5. In the browser console, check that `window.speechSynthesis` exists.
6. If the UI says it is playing but there is no sound, verify system volume, output device, browser permissions/settings, and available speech voices.
7. Stop the previous speech session before switching books; otherwise a queued utterance may continue reading the old book.

## How to explain this in a viva

> LUNA extracts one page of selectable PDF text through a local FastAPI endpoint. The frontend passes that text to the browser's Speech Synthesis API. This gives basic offline narration without a paid cloud API, but it is not the same as generating an audiobook file. OCR, durable playback progress, accurate seeking, and audio-file caching are future improvements.
