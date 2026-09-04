@echo off
title Install Permanent Auto-Start
echo.
echo ============================================
echo   PERMANENT Setup - One-Time Install
echo ============================================
echo.
echo This will make everything auto-start on boot
echo so you NEVER have to run scripts again.
echo.
echo MUST run as Administrator!
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [OK] Running as Administrator.
echo.

REM Run the PowerShell setup script
powershell -ExecutionPolicy Bypass -File "%~dp0install-permanent.ps1"
