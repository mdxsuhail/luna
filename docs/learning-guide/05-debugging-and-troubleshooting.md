# Module 05: Debugging & Troubleshooting

This module documents real-world technical bugs encountered during LUNA's development, their root causes, and how they were systematically resolved. It includes diagnostic commands for debugging networking, batch scripts, and server processes.

---

## Case Study 1: Windows CMD Quote Stripping & Volume Label Syntax Error

### The Symptom:
When running `start-luna.bat`, the backend console window immediately crashed or printed:
```text
The filename, directory name, or volume label syntax is incorrect.
C:\Users\ADMIN\Desktop\community\backend>
```

### The Root Cause:
In the initial version of `start-luna.bat`, the launch command was written as:
```bat
start "LUNA Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%backend" && "%ROOT_DIR%backend\.venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
```

In Windows Command Prompt (CMD), **quotation marks do not nest**. When CMD parses a command string with nested quotes and delimiters (`&&`), it does not recognize inner strings. Instead, it pairs quotes strictly from left to right:
1. `"` before `cd` opened a quote.
2. `"` before `%ROOT_DIR%` closed the quote.
3. Therefore, `%ROOT_DIR%backend` was evaluated **outside of quotes**.
4. If `%ROOT_DIR%` contained a space (e.g., `C:\My Projects\community\`), `cd /d C:\My` was executed, failing immediately with an invalid path.
5. In another iteration with double quotes `""cd /d ...""`, CMD stripped only one quote, leaving a stray leading quote `"cd /d ...`, which Windows attempted to execute as an executable filename, triggering `The filename, directory name, or volume label syntax is incorrect.`

### The Permanent Fix:
Instead of chaining `cd /d` inside `cmd /k`, we leveraged `start`'s native `/D` directory parameter:
```bat
start "LUNA Backend (FastAPI)" /D "%ROOT_DIR%backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
```
Because `/D` enters the folder **before** launching `cmd.exe`, the command inside `cmd /k` is simple, relative, and requires **zero nested quotes**.

---

## Case Study 2: Batch Block Parsing Error: `) was unexpected at this time`

### The Symptom:
When running the batch file, the script exited abruptly with:
```text
) was unexpected at this time.
```

### The Root Cause:
The wait loop was initially placed inside an `if (...)` parenthesized block:
```bat
if "!BACKEND_RUNNING!"=="0" (
    :WAIT_BACKEND_LOOP
    netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 goto :BACKEND_READY_OK
    ping -n 2 127.0.0.1 >nul
    goto :WAIT_BACKEND_LOOP
    :BACKEND_READY_OK
)
```

In Windows CMD, the batch interpreter reads parenthesized blocks `(...)` into memory as a **single logical command line** before executing any of it. If a label (`:LABEL`) is placed inside parentheses, CMD's pre-parser loses track of the matching closing parenthesis `)` and aborts with `) was unexpected at this time`.

### The Permanent Fix:
Labels must **never** be placed inside parenthesized blocks in CMD scripts. We refactored the wait logic to use top-level jump labels:
```bat
if "!BACKEND_RUNNING!"=="1" goto :SKIP_BACKEND_WAIT

:WAIT_BACKEND_LOOP
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto :BACKEND_READY_OK
ping -n 2 127.0.0.1 >nul
goto :WAIT_BACKEND_LOOP

:BACKEND_READY_OK
:SKIP_BACKEND_WAIT
```

---

## Case Study 3: Premature Browser Launch & `ERR_CONNECTION_REFUSED`

### The Symptom:
The launcher opened Google Chrome or Edge to `http://localhost:5173`, but the page showed:
```text
This site can't be reached
localhost refused to connect.
ERR_CONNECTION_REFUSED
```

### The Root Cause:
The original launcher executed:
```bat
ping -n 4 127.0.0.1 >nul
start http://localhost:5173
```
`ping -n 4` pauses for approximately 3 seconds. On cold boots, or when Vite needs to optimize dependencies, Vite often requires 4–6 seconds to bind port 5173. The browser requested the page while the socket was closed, producing `ERR_CONNECTION_REFUSED`.

### The Permanent Fix:
Replaced the blind pause with an active retry loop that polls `netstat -ano` every second (up to 30 retries) until port 5173 reports `LISTENING`. The browser is only opened **after** the socket responds.

---

## Case Study 4: Socket Collisions & `[WinError 10048]`

### The Symptom:
FastAPI crashed on startup with:
```text
ERROR:    [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000):
[winerror 10048] only one usage of each socket address (protocol/network address/port) is normally permitted
```

### The Root Cause:
A previously running Uvicorn process or orphaned Python task was still bound to `127.0.0.1:8000`. In TCP networking, only one process can bind to a specific IP and port combination at a time unless `SO_REUSEADDR`/`SO_REUSEPORT` socket sharing is configured.

### Diagnostic & Resolution Workflow:
```powershell
# 1. Identify which PID is listening on port 8000
netstat -ano | findstr ":8000" | findstr "LISTENING"
# Example output: TCP   127.0.0.1:8000   0.0.0.0:0   LISTENING   12212

# 2. Check the process name for PID 12212
tasklist | findstr "12212"
# Example output: python.exe   12212   Console   1   38,400 K

# 3. Terminate the process by PID
taskkill /F /PID 12212
```

---

## Case Study 5: CORS Policy Violation (`Failed to fetch`)

### The Symptom:
The frontend UI displays a red toast: `Could not retrieve books from SQLite. Backend is unreachable.` The browser developer tools console shows:
```text
Access to fetch at 'http://127.0.0.1:8000/api/books' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### The Root Cause:
The frontend requested `http://127.0.0.1:8000` from `http://localhost:5173`. Even though `localhost` resolves to `127.0.0.1`, browsers treat `localhost` and `127.0.0.1` as distinct string origins. If the backend only allows `http://localhost:5173`, opening the app via `http://127.0.0.1:5173` fails CORS validation.

### The Permanent Fix:
In `backend/main.py`, both variations are included in the allowed origins list:
```python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

---

## Case Study 6: Upload Validation & Security Failures

### 1. `413 Request Entity Too Large`
- **Cause**: User attempted to import a PDF larger than 50 MB.
- **Handling**: In `backend/main.py`, the chunked loop verifies `total_bytes_read <= MAX_UPLOAD_SIZE_BYTES`. If exceeded, `destination_path.unlink(missing_ok=True)` deletes the partial file, and an HTTP 413 error is returned.

### 2. `400 Bad Request: Invalid PDF file format`
- **Cause**: A non-PDF file disguised with a `.pdf` extension (e.g., `image.png` renamed to `image.pdf`) was uploaded.
- **Handling**: The backend inspects the first 5 bytes of the first chunk: `chunk.startswith(b"%PDF-")`. If missing, the file is rejected immediately without executing the `pypdf` parser.

---

## Diagnostic Cheat Sheet

| Task | PowerShell Command | Command Prompt (CMD) |
|---|---|---|
| **Check Port 8000** | `Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue` | `netstat -ano \| findstr ":8000"` |
| **Check Port 5173** | `Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue` | `netstat -ano \| findstr ":5173"` |
| **Kill Python Processes** | `Stop-Process -Name python -Force` | `taskkill /F /IM python.exe` |
| **Kill Node/Vite Processes** | `Stop-Process -Name node -Force` | `taskkill /F /IM node.exe` |
| **Query Backend Health** | `Invoke-RestMethod http://127.0.0.1:8000/api/health` | `curl http://127.0.0.1:8000/api/health` |
| **Inspect SQLite Records** | `sqlite3 local-data/database/luna.db "SELECT * FROM books;"` | `sqlite3 local-data\database\luna.db "SELECT * FROM books;"` |
