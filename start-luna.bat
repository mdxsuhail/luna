@echo off
setlocal EnableDelayedExpansion

title LUNA Launcher

echo ===================================================
echo               LUNA System Launcher
echo ===================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Validate required backend components
if not exist "%ROOT_DIR%backend\main.py" (
    echo [ERROR] backend\main.py was not found.
    echo Please make sure start-luna.bat is placed in the root folder of the LUNA project.
    goto :ERROR_EXIT
)

if not exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment Python executable was not found at:
    echo   backend\.venv\Scripts\python.exe
    echo Please ensure the backend virtual environment is created before launching.
    goto :ERROR_EXIT
)

:: 2. Validate required frontend components
if not exist "%ROOT_DIR%frontend\package.json" (
    echo [ERROR] frontend\package.json was not found.
    goto :ERROR_EXIT
)

if not exist "%ROOT_DIR%frontend\node_modules" (
    echo [ERROR] frontend\node_modules directory was not found.
    echo Please run "npm install" inside the frontend directory before running this launcher.
    goto :ERROR_EXIT
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] "npm" command was not found in your system PATH.
    echo Please ensure Node.js is installed and accessible via PATH.
    goto :ERROR_EXIT
)

:: 3. Check for existing running instances on ports 8000 and 5173 to avoid duplicate servers
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
    echo Please check the "LUNA Backend (FastAPI)" terminal window if issues persist.
    goto :BACKEND_READY_OK
)

ping -n 2 127.0.0.1 >nul
goto :WAIT_BACKEND_LOOP

:BACKEND_READY_OK
:SKIP_BACKEND_WAIT

if "!FRONTEND_RUNNING!"=="1" (
    echo.
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
    echo.
    echo [ERROR] Vite frontend failed to start on http://localhost:5173 within !MAX_WAIT_SECONDS! seconds.
    echo Please inspect the "LUNA Frontend (Vite)" terminal window for error details.
    goto :ERROR_EXIT
)

ping -n 2 127.0.0.1 >nul
goto :WAIT_FRONTEND_LOOP

:SKIP_FRONTEND_WAIT

:: 7. Launch browser preview at http://localhost:5173
echo.
echo [BROWSER] Opening LUNA preview at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================
echo [SUCCESS] LUNA services are ready.
echo Keep the backend and frontend terminal windows open.
echo You may close this launcher window at any time.
echo ===================================================
echo.
:: Brief 3 second pause before launcher window exits
ping -n 4 127.0.0.1 >nul
exit /b 0

:ERROR_EXIT
echo.
echo ===================================================
echo [FAILURE] LUNA could not be launched.
echo Please review the error messages above.
echo ===================================================
echo.
pause
exit /b 1
