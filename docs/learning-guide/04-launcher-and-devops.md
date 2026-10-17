# Module 04: Launcher & DevOps

This module explains the automated deployment and orchestration mechanisms used to launch and run LUNA on Windows. It contains a line-by-line code explanation of `start-luna.bat`, details on Windows Command Prompt (CMD) quoting mechanics, background process spawning, and frontend build tooling.

---

## Part 1: Windows Batch Orchestrator (`start-luna.bat`)

The root `start-luna.bat` script is an automated launcher that verifies prerequisites, checks for running port collisions, spawns backend and frontend servers in independent console windows, polls sockets until services are ready, and opens the user's browser.

### 1. Environment Setup & Delayed Expansion (Lines 1–12)

```bat
@echo off
setlocal EnableDelayedExpansion

title LUNA Launcher

echo ===================================================
echo               LUNA System Launcher
echo ===================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
```

#### Code Explanation & Viva Concepts:
- **`@echo off`**: Suppresses the printing of each batch command to stdout before it is executed, keeping the console output clean.
- **`setlocal EnableDelayedExpansion`**: 
  - Standard batch variables (`%VAR%`) are expanded at **parse time** when an entire block is first read.
  - Delayed expansion (`!VAR!`) evaluates variables dynamically at **runtime** (execution time). This is mandatory when setting and evaluating variables inside `if` statements or loops.
- **`%~dp0`**: A special batch expansion modifier:
  - `%0`: Represents the running batch file itself.
  - `~d`: Extracts the drive letter (e.g., `C:`).
  - `~p`: Extracts the parent directory path with a trailing slash (`\Users\ADMIN\Desktop\community\`).
  - Combined, `%~dp0` yields the absolute path to the directory containing `start-luna.bat`, regardless of the working directory from which it was run.
- **`cd /d "%ROOT_DIR%"`**: The `/d` switch ensures changing drives (e.g., switching from `D:` to `C:`) works seamlessly alongside directory changes.

---

### 2. Prerequisite & File Validation (Lines 14–46)

```bat
:: 1. Validate required backend components
if not exist "%ROOT_DIR%backend\main.py" (
    echo [ERROR] backend\main.py was not found.
    goto :ERROR_EXIT
)

if not exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment Python executable was not found.
    goto :ERROR_EXIT
)

:: 2. Validate required frontend components
if not exist "%ROOT_DIR%frontend\package.json" (
    echo [ERROR] frontend\package.json was not found.
    goto :ERROR_EXIT
)

if not exist "%ROOT_DIR%frontend\node_modules" (
    echo [ERROR] frontend\node_modules directory was not found.
    goto :ERROR_EXIT
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] "npm" command was not found in your system PATH.
    goto :ERROR_EXIT
)
```

- **Fail-Fast Design**: Instead of launching processes that would inevitably fail later, the script performs pre-flight checks for `main.py`, `.venv`, `package.json`, and `node_modules`.
- **`where npm >nul 2>&1`**: Checks if Node's `npm` executable exists on the system `PATH`.
  - `>nul`: Redirects standard output to null (hides output).
  - `2>&1`: Redirects standard error (file descriptor 2) to standard output (file descriptor 1).
  - `if errorlevel 1`: Evaluates whether the command returned an exit code $\ge 1$ (meaning `npm` was not found).

---

### 3. Duplicate Port Detection (Lines 48–60)

```bat
set "BACKEND_RUNNING=0"
set "FRONTEND_RUNNING=0"

netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    set "BACKEND_RUNNING=1"
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    set "FRONTEND_RUNNING=1"
)
```

- **`netstat -ano`**:
  - `-a`: Displays all active connections and listening ports.
  - `-n`: Displays addresses and port numbers in numerical format (prevents slow DNS lookups).
  - `-o`: Displays the owning process identifier (PID) associated with each socket.
- **Pipelined Filtering (`findstr`)**: Filters the list for `:8000` (FastAPI) and `:5173` (Vite) currently in the `LISTENING` state.
- **`if not errorlevel 1`**: If `findstr` finds a match, its return code is `0` (success). If so, the script marks the service as already running to avoid creating duplicate competing instances.

---

### 4. Process Spawning & Working Directory Handling (Lines 62–76)

```bat
:: 4. Start FastAPI Backend if not already running
if "!BACKEND_RUNNING!"=="1" (
    echo [INFO] FastAPI backend is already running on http://127.0.0.1:8000. Skipping backend startup.
) else (
    echo [STARTING] Launching FastAPI backend in a separate window...
    start "LUNA Backend (FastAPI)" /D "%ROOT_DIR%backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
)

:: 5. Start Vite Frontend if not already running
if "!FRONTEND_RUNNING!"=="1" (
    echo [INFO] Vite frontend is already running on http://localhost:5173. Skipping frontend startup.
) else (
    echo [STARTING] Launching Vite frontend in a separate window...
    start "LUNA Frontend (Vite)" /D "%ROOT_DIR%frontend" cmd /k "npm run dev"
)
```

#### Detailed Command Anatomy:
`start ["window_title"] [/D target_dir] cmd /k "command_to_run"`

1. **`"LUNA Backend (FastAPI)"`**: Sets the window title for the newly spawned console.
2. **`/D "%ROOT_DIR%backend"`**: Crucial switch specifying the **working directory** for the new process before it launches.
3. **`cmd /k`**: Runs the command processor and keeps the console window open after the command finishes so developers can see runtime logs or traceback errors.
4. **`.venv\Scripts\python.exe`**: Because `/D` already navigated into `backend/`, the virtual environment Python can be executed as a relative path without spaces.

---

### 5. Socket Readiness Polling (Lines 78–135)

```bat
:: 6. Wait for services to be ready before opening the browser
if "!BACKEND_RUNNING!"=="1" goto :SKIP_BACKEND_WAIT

echo.
echo [WAITING] Verifying FastAPI backend on http://127.0.0.1:8000 ...
set "B_WAIT_SECONDS=0"
set "B_MAX_WAIT=15"

:WAIT_BACKEND_LOOP
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [READY] FastAPI backend is listening on port 8000.
    goto :BACKEND_READY_OK
)

set /a B_WAIT_SECONDS+=1
if !B_WAIT_SECONDS! geq !B_MAX_WAIT! (
    echo [WARNING] FastAPI backend is not yet detected on port 8000.
    goto :BACKEND_READY_OK
)

ping -n 2 127.0.0.1 >nul
goto :WAIT_BACKEND_LOOP

:BACKEND_READY_OK
:SKIP_BACKEND_WAIT

if "!FRONTEND_RUNNING!"=="1" (
    echo [INFO] Vite frontend is already active on port 5173.
    goto :SKIP_FRONTEND_WAIT
)

echo.
echo [WAITING] Waiting for Vite frontend to start on http://localhost:5173 ...
set "WAIT_SECONDS=0"
set "MAX_WAIT_SECONDS=30"

:WAIT_FRONTEND_LOOP
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [READY] Vite frontend is listening on port 5173.
    goto :SKIP_FRONTEND_WAIT
)

set /a WAIT_SECONDS+=1
if !WAIT_SECONDS! geq !MAX_WAIT_SECONDS! (
    echo [ERROR] Vite frontend failed to start on http://localhost:5173 within !MAX_WAIT_SECONDS! seconds.
    goto :ERROR_EXIT
)

ping -n 2 127.0.0.1 >nul
goto :WAIT_FRONTEND_LOOP

:SKIP_FRONTEND_WAIT
```

#### Why this eliminates `ERR_CONNECTION_REFUSED`:
1. Older batch scripts used a fixed `ping -n 4 127.0.0.1 >nul` (a 3-second sleep) and then opened the browser regardless of server status. If Vite took 4 seconds to bundle dependencies, the browser opened to an inactive port and displayed `ERR_CONNECTION_REFUSED`.
2. This refactored polling loop uses `netstat -ano` to actively verify that port `5173` is in `LISTENING` status before launching the browser.
3. **`ping -n 2 127.0.0.1 >nul`**: Serves as a standard, non-blocking 1-second delay between checks without requiring external sleep utilities.

---

### 6. Browser Launch & Exit (Lines 137–161)

```bat
:: 7. Launch browser preview at http://localhost:5173
echo.
echo [BROWSER] Opening LUNA preview at http://localhost:5173 ...
start http://localhost:5173

echo ===================================================
echo [SUCCESS] LUNA services are ready.
echo ===================================================
ping -n 4 127.0.0.1 >nul
exit /b 0

:ERROR_EXIT
echo ===================================================
echo [FAILURE] LUNA could not be launched.
echo ===================================================
pause
exit /b 1
```

- **`start http://localhost:5173`**: Uses Windows file/protocol associations to open the URL in the operating system's default web browser.
- **`exit /b 0` vs `exit /b 1`**: The `/b` switch exits the current batch script rather than closing the calling command prompt, returning explicit exit codes for automated tooling (`0` for success, `1` for error).

---

## Part 2: Frontend Build Tooling (`Vite`)

The frontend build pipeline is configured in `frontend/package.json` and `frontend/vite.config.ts`:

### 1. NPM Scripts
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

- **`npm run dev`**: Starts the local Vite development server with Hot Module Replacement (HMR).
- **`npm run build`**:
  1. Executes `tsc` (TypeScript Compiler) to perform static type checking without emitting files (`noEmit` configured in `tsconfig.json`).
  2. If type checking passes, executes `vite build` to bundle, minify, and tree-shake assets into `dist/`.
- **`npm run preview`**: Launches a local static web server serving the compiled `dist/` directory to test production behavior.

### 2. Vite Plugin Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
```
- **`@vitejs/plugin-react`**: Enables Fast Refresh (React HMR) using Babel/Babel-SWC.
- **`port: 5173`**: Explicitly fixes the development server to port 5173 to match backend CORS origins and batch launcher health checks.
