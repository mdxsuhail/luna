@echo off
setlocal EnableExtensions EnableDelayedExpansion

title LUNA Launcher
echo ===================================================
echo               LUNA System Launcher
echo ===================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

if not exist "%ROOT_DIR%backend\main.py" (
    echo [ERROR] backend\main.py was not found.
    goto :ERROR_EXIT
)
if not exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    echo [ERROR] Backend virtual environment not found.
    echo Create it and install backend\requirements.txt first.
    goto :ERROR_EXIT
)
if not exist "%ROOT_DIR%frontend\package.json" (
    echo [ERROR] frontend\package.json was not found.
    goto :ERROR_EXIT
)
if not exist "%ROOT_DIR%frontend\node_modules" (
    echo [ERROR] frontend\node_modules was not found.
    echo Open a terminal in frontend and run: npm install
    goto :ERROR_EXIT
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm was not found in PATH. Install Node.js and reopen the terminal.
    goto :ERROR_EXIT
)
where curl.exe >nul 2>&1
if errorlevel 1 (
    echo [ERROR] curl.exe was not found. This launcher uses curl to check HTTP readiness.
    echo Update Windows or run the backend and frontend manually.
    goto :ERROR_EXIT
)

echo [INFO] Checking whether LUNA is already running...
curl.exe --silent --show-error --fail --max-time 2 http://127.0.0.1:8000/api/health >nul 2>&1
if errorlevel 1 (
    echo [STARTING] Launching FastAPI backend...
    start "LUNA Backend (FastAPI)" /D "%ROOT_DIR%backend" cmd /k ".venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
) else (
    echo [INFO] LUNA backend health endpoint already responds.
)

curl.exe --silent --show-error --fail --max-time 2 http://127.0.0.1:5173/ >nul 2>&1
if errorlevel 1 (
    echo [STARTING] Launching Vite frontend...
    start "LUNA Frontend (Vite)" /D "%ROOT_DIR%frontend" cmd /k "npm run dev -- --host 127.0.0.1"
) else (
    echo [INFO] Frontend already responds on port 5173.
)

echo.
echo [WAITING] Waiting up to 30 seconds for the backend health endpoint...
set "B_WAIT_SECONDS=0"
:WAIT_BACKEND
curl.exe --silent --show-error --fail --max-time 2 http://127.0.0.1:8000/api/health >nul 2>&1
if not errorlevel 1 goto :BACKEND_READY
set /a B_WAIT_SECONDS+=1
if !B_WAIT_SECONDS! geq 30 (
    echo [ERROR] Backend did not respond at http://127.0.0.1:8000/api/health.
    echo Inspect the "LUNA Backend (FastAPI)" terminal for the Python error.
    goto :ERROR_EXIT
)
timeout /t 1 /nobreak >nul
goto :WAIT_BACKEND

:BACKEND_READY
echo [READY] Backend HTTP health check passed.
echo.
echo [WAITING] Waiting up to 45 seconds for the frontend...
set "F_WAIT_SECONDS=0"
:WAIT_FRONTEND
curl.exe --silent --show-error --fail --max-time 2 http://127.0.0.1:5173/ >nul 2>&1
if not errorlevel 1 goto :FRONTEND_READY
set /a F_WAIT_SECONDS+=1
if !F_WAIT_SECONDS! geq 45 (
    echo [ERROR] Frontend did not respond at http://127.0.0.1:5173/.
    echo Inspect the "LUNA Frontend (Vite)" terminal for the npm/Vite error.
    goto :ERROR_EXIT
)
timeout /t 1 /nobreak >nul
goto :WAIT_FRONTEND

:FRONTEND_READY
echo [READY] Frontend HTTP check passed.
echo.
echo [BROWSER] Opening LUNA at http://127.0.0.1:5173/ ...
start "" "http://127.0.0.1:5173/"

echo.
echo ===================================================
echo [SUCCESS] LUNA is responding.
echo Keep both service terminal windows open while using it.
echo ===================================================
echo.
pause
exit /b 0

:ERROR_EXIT
echo.
echo ===================================================
echo [FAILURE] LUNA could not be started successfully.
echo Read the error above, then check the service terminal windows.
echo ===================================================
echo.
pause
exit /b 1
