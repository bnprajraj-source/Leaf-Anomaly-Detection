@echo off
title Leaf Anomaly Detection - Stop All Services
echo.
echo ============================================
echo   Stopping All Services...
echo ============================================
echo.

REM Stop Backend (uvicorn)
echo [1/3] Stopping Backend...
taskkill /FI "WINDOWTITLE eq Backend - Leaf Anomaly Detection*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq Backend*" /F >nul 2>&1
REM Kill uvicorn specifically
for /f "tokens=2" %%a in ('tasklist /fi "IMAGENAME eq python.exe" /v ^| findstr /i "uvicorn"') do taskkill /PID %%a /F >nul 2>&1
echo [OK] Backend stopped.

REM Stop DB Service (node)
echo [2/3] Stopping DB Service...
taskkill /FI "WINDOWTITLE eq DB Service - Leaf Anomaly Detection*" /F >nul 2>&1
echo [OK] DB Service stopped.

REM Stop Frontend (npm/vite)
echo [3/3] Stopping Frontend...
taskkill /FI "WINDOWTITLE eq Frontend - Leaf Anomaly Detection*" /F >nul 2>&1
echo [OK] Frontend stopped.

echo.
echo ============================================
echo   All services stopped.
echo ============================================
echo.
echo   NOTE: MongoDB may still be running in the background.
echo   To stop MongoDB: taskkill /IM mongod.exe /F
echo.
pause
