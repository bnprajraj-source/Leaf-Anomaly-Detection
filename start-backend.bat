@echo off
title Leaf Anomaly Detection - Backend
echo.
echo ============================================
echo   Leaf Anomaly Detection - Backend Server
echo ============================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.10+ from https://python.org
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Check if venv exists, if not create it
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [INFO] Virtual environment created.
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo [INFO] Checking dependencies...
pip install -r requirements.txt --quiet 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies may not have installed correctly.
    echo [INFO] Continuing anyway...
)

REM Check if MongoDB is running
echo [INFO] Checking MongoDB connection...
python -c "import motor.motor_asyncio; import asyncio; asyncio.run(motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000).admin.command('ping'))" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] MongoDB is NOT running on port 27017.
    echo [WARNING] History and auth features will be unavailable.
    echo [WARNING] Start MongoDB and the server will auto-reconnect.
    echo.
) else (
    echo [OK] MongoDB is running.
)

REM Clean __pycache__ directories to avoid stale bytecode
if exist "__pycache__" rd /s /q "__pycache__" >nul 2>&1
if exist "app\__pycache__" rd /s /q "app\__pycache__" >nul 2>&1
if exist "app\routes\__pycache__" rd /s /q "app\routes\__pycache__" >nul 2>&1
if exist "app\models\__pycache__" rd /s /q "app\models\__pycache__" >nul 2>&1
if exist "app\utils\__pycache__" rd /s /q "app\utils\__pycache__" >nul 2>&1

echo.
echo [INFO] Starting backend server on http://localhost:8000
echo [INFO] API docs available at http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
