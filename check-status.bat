@echo off
title Leaf Anomaly Detection - Status Check
echo.
echo ============================================
echo   Service Status Check
echo ============================================
echo.

REM Check MongoDB
echo [1/4] MongoDB:
python -c "import pymongo; c=pymongo.MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000); c.admin.command('ping'); print('  [OK] MongoDB is running on port 27017')" 2>nul
if %errorlevel% neq 0 (
    echo  [X] MongoDB is NOT running
    echo  [INFO] Run start-all.bat or install-mongodb-service.bat
)

REM Check Backend
echo.
echo [2/4] Backend (port 8000):
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Backend is running on port 8000
) else (
    echo  [X] Backend is NOT running on port 8000
    echo  [INFO] Run start-all.bat
)

REM Check Frontend
echo.
echo [3/4] Frontend (port 3000):
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Frontend is running on port 3000
) else (
    echo  [X] Frontend is NOT running on port 3000
    echo  [INFO] Run start-all.bat
)

REM Check DB Service
echo.
echo [4/4] DB Service (port 4000):
curl -s http://localhost:4000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] DB Service is running on port 4000
) else (
    echo  [X] DB Service is NOT running on port 4000
    echo  [INFO] Run start-all.bat
)

echo.
echo ============================================
echo.
echo If services are not running:
echo   1. Run "start-all.bat" to start all services
echo   2. Run "install-mongodb-service.bat" to make MongoDB start on boot
echo   3. Data is saved permanently in data\db folder
echo.
pause
