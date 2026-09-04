@echo off
title Leaf Anomaly Detection - Full Stack (Persistent)
echo.
echo ============================================
echo   Leaf Anomaly Detection - Starting All
echo ============================================
echo.

set "PROJECT_DIR=%~dp0"

REM ---- Step 1: Start MongoDB as a Windows Service ----
echo [1/4] Ensuring MongoDB is running...

REM First try to start as Windows service (persistent across reboots)
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    sc start MongoDB >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo [OK] MongoDB service started.
) else (
    REM Not installed as service - start manually with persistent data
    python -c "import pymongo; c=pymongo.MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000); c.admin.command('ping'); print('[OK] MongoDB is already running.')" 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] MongoDB not running. Starting with persistent data...
        where mongod >nul 2>&1
        if %errorlevel% equ 0 (
            start /min "MongoDB" mongod --dbpath "%PROJECT_DIR%data\db" --bind_ip 127.0.0.1
            timeout /t 3 /nobreak >nul
            echo [OK] MongoDB started (data saved in data\db).
        ) else if exist "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" (
            for /d %%i in ("C:\Program Files\MongoDB\Server\*") do (
                start /min "MongoDB" "%%i\bin\mongod.exe" --dbpath "%PROJECT_DIR%data\db" --bind_ip 127.0.0.1
            )
            timeout /t 3 /nobreak >nul
            echo [OK] MongoDB started (data saved in data\db).
        ) else (
            echo [ERROR] MongoDB not found. Please install MongoDB.
            echo [ERROR] Download: https://www.mongodb.com/try/download/community
            echo [INFO] Without MongoDB, registration and history will not work.
        )
    )
)

REM ---- Step 2: Start Backend (Python FastAPI) ----
echo.
echo [2/4] Starting Backend (port 8000)...
cd /d "%PROJECT_DIR%backend"

REM Activate venv if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet 2>nul
)

REM Clean pycache
for /d /r %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul

start /min "Backend" cmd /c "title Backend - Leaf Anomaly Detection && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo [OK] Backend starting on http://localhost:8000

REM ---- Step 3: Start DB Service (Node.js) ----
echo.
echo [3/4] Starting DB Service (port 4000)...
cd /d "%PROJECT_DIR%db-service"

if exist "node_modules" (
    start /min "DB Service" cmd /c "title DB Service - Leaf Anomaly Detection && node server.js"
    echo [OK] DB Service starting on http://localhost:4000
) else (
    echo [INFO] Installing Node.js dependencies...
    npm install --silent 2>nul
    start /min "DB Service" cmd /c "title DB Service - Leaf Anomaly Detection && node server.js"
    echo [OK] DB Service starting on http://localhost:4000
)

REM ---- Step 4: Start Frontend ----
echo.
echo [4/4] Starting Frontend (port 3000)...
cd /d "%PROJECT_DIR%frontend"

if exist "node_modules" (
    start "" cmd /c "title Frontend - Leaf Anomaly Detection && npm run dev"
    echo [OK] Frontend starting on http://localhost:3000
) else (
    echo [INFO] Installing frontend dependencies...
    npm install --silent 2>nul
    start "" cmd /c "title Frontend - Leaf Anomaly Detection && npm run dev"
    echo [OK] Frontend starting on http://localhost:3000
)

cd /d "%PROJECT_DIR%"

echo.
echo ============================================
echo   All services are starting up!
echo ============================================
echo.
echo   Frontend:   http://localhost:3000
echo   Backend:    http://localhost:8000
echo   API Docs:   http://localhost:8000/docs
echo   DB Service: http://localhost:4000
echo.
echo   Data is saved permanently in data\db folder.
echo   Close this window - services will keep running.
echo ============================================
echo.
timeout /t 5 /nobreak >nul
