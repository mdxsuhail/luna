# Module 06: Viva & Technical Interview Prep

This module contains **25+ rigorous, technically accurate questions and answers** designed for college project evaluations, viva examinations, and technical engineering interviews about the LUNA codebase.

---

## Section 1: System Architecture & Design Patterns

### Q1: What does "offline-first" mean in the context of LUNA, and how is it implemented?
**Answer**:
Offline-first means the software treats local device storage as the primary, authoritative source of data rather than an auxiliary cache for a remote cloud service. 
In LUNA, this is implemented by:
1. Storing all document metadata in an embedded SQLite database (`local-data/database/luna.db`).
2. Storing physical PDF documents on the local filesystem (`local-data/books/`).
3. Binding backend APIs exclusively to the loopback interface (`127.0.0.1`), ensuring zero outbound calls or reliance on external cloud storage.

---

### Q2: Why did you separate the system into a FastAPI backend and a React/Vite frontend rather than using a server-side rendered (SSR) framework like Django or Next.js?
**Answer**:
1. **Separation of Concerns**: Decouples the presentation layer (UI state, themes, audio playback) from data persistence and file parsing logic.
2. **Streaming & Heavy I/O**: Python is ideal for binary file processing (`pypdf`, chunked streaming), while modern React provides smooth, instant micro-interactions for the reader and persistent audio player without page reloads.
3. **Future Extensibility**: The REST API can serve alternative clients in the future (such as a CLI tool, a mobile app, or an optional hardware e-ink reader) without altering backend logic.

---

### Q3: How is the optional physical device (`optional-device/`) decoupled from the core application?
**Answer**:
LUNA is architected so that the web application has zero runtime dependencies on external hardware. The `DevicePage.tsx` interface and the backend operate completely independently in standalone desktop mode. An ESP32 or microcontroller companion is designed strictly as an optional peripheral that would communicate via local serial USB or BLE, with no required presence for reading or audio playback.

---

## Section 2: Backend & Python Architecture

### Q4: Why did you choose FastAPI over Flask or Django?
**Answer**:
1. **Asynchronous Concurrency (ASGI)**: FastAPI is built on Starlette and ASGI, natively supporting `async`/`await` for non-blocking file streaming and upload ingestion.
2. **High Performance**: FastAPI matches the throughput of NodeJS and Go due to Starlette's lightweight event loop and Pydantic's data serialization.
3. **Automatic Documentation**: FastAPI automatically generates interactive OpenAPI/Swagger documentation (`/docs`) and JSON schema endpoints directly from function signatures and type annotations.
4. **Lightweight Footprint**: Unlike Django, FastAPI does not impose an unneeded ORM, admin dashboard, or session middleware for a local-first single-user desktop application.

---

### Q5: What is the difference between ASGI and WSGI? Which one does LUNA use?
**Answer**:
- **WSGI (Web Server Gateway Interface)**: A synchronous standard (used by traditional Flask and Django). Each incoming HTTP request blocks an operating system thread until completion.
- **ASGI (Asynchronous Server Gateway Interface)**: An asynchronous standard supporting async coroutines, WebSockets, and long-lived streaming connections.
- **LUNA uses ASGI**: Uvicorn is an ASGI web server that runs FastAPI's asynchronous application instance, enabling memory-safe chunked file streaming without thread starvation.

---

### Q6: In `backend/main.py`, why are some route handlers defined with `async def` and others with plain `def`?
**Answer**:
- `async def import_book(...)`: Needs `async` because it performs asynchronous non-blocking I/O using `await file.read(CHUNK_SIZE)` to stream incoming multipart upload bytes.
- `def list_books(...)` and `def health_check(...)`: Defined with plain `def` because they execute synchronous SQLite queries. FastAPI automatically runs standard synchronous `def` endpoints in a separate background threadpool (`anyio`), preventing synchronous database I/O from blocking the main asynchronous event loop.

---

### Q7: Explain the purpose and operation of the `lifespan` context manager in `main.py`.
**Answer**:
The `lifespan` handler manages application startup and shutdown lifecycle hooks. 
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_directories()
    init_db()
    yield
```
Before the ASGI server begins accepting requests, the code prior to `yield` runs: it ensures the required folders (`local-data/database`, `local-data/books`, `local-data/audio`) exist and executes the SQLite schema DDL (`CREATE TABLE IF NOT EXISTS`). When the server shuts down, execution resumes after `yield` for any needed cleanup.

---

## Section 3: Database & Persistence Layer

### Q8: Why use SQLite instead of PostgreSQL, MySQL, or MongoDB?
**Answer**:
1. **Zero Configuration**: SQLite is serverless—it requires no standalone server daemon, background service, or network socket configuration.
2. **Single-File Portability**: The entire database lives in a single local file (`luna.db`). Backing up, inspecting, or migrating the user's library requires simply copying the file.
3. **Acid Compliance**: Full support for Atomic, Consistent, Isolated, and Durable transactions with minimal resource utilization on desktop systems.
4. **Embedded Performance**: Because SQLite runs in-process with the Python interpreter, query execution involves zero network overhead or IPC latency.

---

### Q9: How does LUNA prevent SQL Injection attacks in `backend/database.py`?
**Answer**:
By utilizing **parameterized queries** with placeholder bindings (`?`) rather than Python f-strings or string concatenation:
```python
cursor.execute(
    "INSERT INTO books (title, original_filename) VALUES (?, ?);",
    (title, original_filename)
)
```
The SQLite driver compiles the SQL statement template first. The parameter values are passed separately as pure data literals and are never interpreted as executable SQL syntax, completely neutralizing injection attempts.

---

### Q10: How does `get_db_connection()` guarantee transactional consistency and connection cleanup?
**Answer**:
It is implemented as a generator decorated with `@contextmanager`:
- **Commit on Success**: If the enclosed code block finishes without exceptions, `conn.commit()` commits the transaction to disk.
- **Rollback on Error**: If any exception is raised, `conn.rollback()` restores the database state, preventing partial inserts.
- **Guaranteed Closure**: The `finally:` block executes `conn.close()` in all execution paths, guaranteeing that SQLite file locks are released and preventing database locking errors.

---

## Section 4: Security & File Handling

### Q11: What is a path traversal attack, and how does LUNA defend against it?
**Answer**:
A path traversal attack occurs when an attacker passes relative path components (like `../../Windows/System32/calc.exe`) to access or execute files outside the intended root directory.
LUNA defends against this in `backend/main.py`:
1. Strips directory prefixes: `filename_only = Path(stored_path_str).name`.
2. Resolves canonical absolute paths: `target_file = (BOOKS_DIR / filename_only).resolve()`.
3. Verifies that the resolved path strictly starts with the canonical directory prefix:
   ```python
   if not str(target_file).startswith(str(books_dir_resolved)):
       raise HTTPException(status_code=403, detail="Access denied.")
   ```

---

### Q12: Why check the `%PDF-` magic-byte header during upload instead of relying on the `.pdf` extension?
**Answer**:
File extensions are purely cosmetic naming conventions that can easily be spoofed (e.g., renaming an executable `trojan.exe` to `book.pdf`). 
A genuine PDF file must adhere to ISO 32000 specifications and start with the magic byte sequence `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`). Inspecting `chunk.startswith(b"%PDF-")` ensures the uploaded stream is a legitimate PDF before handing it to the parser.

---

### Q13: How does LUNA handle memory management during large file uploads?
**Answer**:
Rather than buffering entire files into RAM using `contents = await file.read()`, the endpoint streams the file in **1 MB chunks** (`CHUNK_SIZE = 1024 * 1024`):
```python
while True:
    chunk = await file.read(CHUNK_SIZE)
    if not chunk: break
    total_bytes_read += len(chunk)
    if total_bytes_read > MAX_UPLOAD_SIZE_BYTES: ...
    out_file.write(chunk)
```
This guarantees that server memory usage remains constant ($\sim 1\text{ MB}$) regardless of whether the uploaded document is 5 MB or 50 MB.

---

### Q14: How does LUNA prevent orphaned partial files on disk if an upload fails mid-stream?
**Answer**:
If an upload exceeds 50 MB, fails magic-byte validation, encounters a corrupted PDF header, or triggers a database error, all exception handlers invoke:
```python
destination_path.unlink(missing_ok=True)
```
This immediately deletes the temporary UUID file, preventing leaked partial files from consuming disk space.

---

## Section 5: Frontend & State Architecture

### Q15: Why use React Context (`AppContext`) instead of Redux Toolkit or Zustand?
**Answer**:
- **Minimal Bundle Size**: React Context is built into `react`, adding 0 KB to the production bundle.
- **Domain Scope**: LUNA's state machine is focused (active book, library list, playback status, theme). Redux introduces boilerplate (actions, reducers, slices) and middleware complexity that is unnecessary for this architecture.
- **Performance**: High-frequency updates (e.g., audio scrubbing) are scoped to local components, while global context manages page navigation and library synchronization.

---

### Q16: What is the purpose of `adaptApiBook` in `frontend/src/services/api.ts`?
**Answer**:
It acts as an **Anti-Corruption Layer (Adapter Pattern)**. The SQLite database schema uses relational database naming conventions (`stored_pdf_path`, `original_filename`), while the frontend React components expect camelCase properties (`storedPdfPath`, `originalFilename`) and computed UI fields (`coverHue`, `progressPercentage`, `chapters`). `adaptApiBook` maps and enriches raw API data before it enters React state.

---

### Q17: How does `AbortController` prevent memory leaks and UI freezing in `frontend/src/services/api.ts`?
**Answer**:
Standard `fetch` requests can hang indefinitely if the network port is unresponsive. By tying `controller.signal` to `setTimeout(() => controller.abort(), 4000)`, LUNA automatically cancels hung requests after 4 seconds, catching the `AbortError` and allowing the UI to display a helpful retry notice without freezing.

---

### Q18: Why did you choose Vanilla CSS design tokens over Tailwind CSS?
**Answer**:
1. **Dynamic CSS Variables**: Custom properties like `--bg-primary` and `--accent-emerald` can be updated dynamically at runtime without rebuilding CSS classes.
2. **Instant Theme Switching**: Reader themes (`charcoal`, `sepia`, `paper`, `oled`) switch instantaneously by toggling a parent class name (`.theme-sepia`) without CSS bundle bloat.
3. **Zero Build Dependency**: Pure CSS requires no PostCSS compilation plugins or Tailwind compiler passes, maximizing Vite build and HMR speed.

---

## Section 6: Windows Process Management & DevOps

### Q19: In `start-luna.bat`, why did you use `setlocal EnableDelayedExpansion`?
**Answer**:
By default, Windows CMD evaluates `%VARIABLE%` expressions at **parse time** (when the statement or parenthesized block is first read). 
With delayed expansion enabled, variables written with exclamation marks (`!VARIABLE!`) are evaluated dynamically at **execution time**. This is mandatory for checking dynamic variables (like `!BACKEND_RUNNING!` and `!WAIT_SECONDS!`) inside loops and conditionals.

---

### Q20: What does the `/D` switch in the `start` command do, and why is it essential?
**Answer**:
`start ["title"] /D "path" command`
The `/D` switch explicitly sets the **working directory** for the new console process before it runs.
In LUNA, using `/D "%ROOT_DIR%backend"` ensures the child console opens directly in `backend/`. This allows Python to be invoked as `.venv\Scripts\python.exe` without requiring nested quotation marks or chained `cd /d` commands that corrupt Windows CMD command-line parsing.

---

### Q21: Why can't you place a label like `:WAIT_LOOP` inside an `if (...)` block in Windows CMD?
**Answer**:
Windows CMD parses parenthesized blocks `(...)` in their entirety into an internal memory buffer before executing any statement inside. Placing a label (`:LABEL`) inside parentheses corrupts CMD's syntax token parser, causing it to misplace the matching closing parenthesis and throw `) was unexpected at this time`. Labels must always reside at the top level of the script.

---

### Q22: What is the purpose of `netstat -ano | findstr ":5173" | findstr "LISTENING"` in `start-luna.bat`?
**Answer**:
It actively queries the operating system's TCP socket table:
- `:5173`: Filters for the Vite frontend port.
- `LISTENING`: Confirms that a process has bound the socket and is ready to accept incoming TCP connections.
This replaces unreliable static timers (`ping -n 4`) and guarantees that the browser is opened only when the web server is ready, completely eliminating `ERR_CONNECTION_REFUSED`.

---

## Section 7: Critical Thinking & Viva Edge Cases

### Q23: What happens if a user imports an encrypted or password-protected PDF?
**Answer**:
`pypdf.PdfReader` detects `reader.is_encrypted == True`. LUNA first attempts an empty-string decryption (`reader.decrypt("")`), which succeeds for PDFs that permit read access without a password. If decryption fails, LUNA:
1. Deletes the partial file from disk via `destination_path.unlink(missing_ok=True)`.
2. Raises an HTTP 400 Bad Request with a clear explanation: `"The uploaded PDF is password-protected or encrypted and cannot be processed."`

---

### Q24: What happens if the SQLite database file (`luna.db`) is deleted while the server is running?
**Answer**:
Because SQLite connections are ephemeral and managed via the `get_db_connection()` context manager, the next incoming request invokes `ensure_directories()` and `init_db()`. SQLite will automatically recreate a fresh `luna.db` file and re-initialize the `books` table schema with zero manual intervention.

---

### Q25: Why is the database schema designed with `extracted_text_status TEXT DEFAULT 'pending'`?
**Answer**:
This represents forward-compatible **schema design for asynchronous background processing**. Extracting text or running optical character recognition (OCR) on a 500-page PDF is CPU-intensive and can take tens of seconds. Storing `'pending'` allows the file import to return immediately to the user (`201 Created`), while a future worker pipeline can asynchronously update the column to `'processing'` and `'completed'`.
