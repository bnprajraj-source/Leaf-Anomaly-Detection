@echo off
title Install MongoDB as Windows Service
echo.
echo ============================================
echo   MongoDB Service Installer
echo ============================================
echo.
echo This will install MongoDB as a Windows service
echo so it starts automatically every time you boot.
echo.

set "PROJECT_DIR=%~dp0"
set "DATA_DIR=%PROJECT_DIR%data\db"

REM Check if mongod is available
where mongod >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] mongod not found in PATH.
    echo.
    echo Please install MongoDB from:
    echo   https://www.mongodb.com/try/download/community
    echo.
    echo Or check if MongoDB is installed and add its bin folder to PATH.
    echo.
    pause
    exit /b 1
)

REM Create data directory if it doesn't exist
if not exist "%DATA_DIR%" (
    mkdir "%DATA_DIR%"
    echo [OK] Created data directory: %DATA_DIR%
)

echo.
echo [INFO] MongoDB will be installed as a Windows service.
echo [INFO] Data directory: %DATA_DIR%
echo.

REM Install MongoDB service
echo [1/2] Installing MongoDB service...
mongod --dbpath "%DATA_DIR%" --bind_ip 127.0.0.1 --install --serviceName "MongoDB" --serviceDisplayName "MongoDB Database" --description "MongoDB Server for Leaf Anomaly Detection"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install MongoDB service.
    echo [INFO] You may need to run this script as Administrator.
    echo [INFO] Right-click the script and select "Run as administrator".
    pause
    exit /b 1
)

REM Start the service
echo [2/2] Starting MongoDB service...
net start MongoDB
if %errorlevel% neq 0 (
    echo [WARNING] Could not start service. Trying to start mongod directly...
    start /min "MongoDB" mongod --dbpath "%DATA_DIR%" --bind_ip 127.0.0.1
    timeout /t 3 /nobreak >nul
)

echo.
echo ============================================
echo   MongoDB is now running as a Windows service!
echo ============================================
echo.
echo   It will start automatically when you boot Windows.
echo   Data is saved permanently in: %DATA_DIR%
echo.
echo   To verify: python -c "import pymongo; c=pymongo.MongoClient('mongodb://localhost:27017'); c.admin.command('ping'); print('MongoDB OK')"
echo.
pause
