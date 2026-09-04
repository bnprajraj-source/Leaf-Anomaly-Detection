# Leaf Anomaly Detection - Backend Server (PowerShell)
# =====================================================
# This script starts the Python FastAPI backend with proper error handling.

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Leaf Anomaly Detection - Backend Server" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.10+ from https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to backend directory
$backendDir = Join-Path $scriptDir "backend"
Set-Location $backendDir

# Check if venv exists, if not create it
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to create virtual environment." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[INFO] Virtual environment created." -ForegroundColor Green
}

# Activate virtual environment
Write-Host "[INFO] Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install/upgrade dependencies
Write-Host "[INFO] Checking dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet 2>$null

# Check if MongoDB is running
Write-Host "[INFO] Checking MongoDB connection..." -ForegroundColor Yellow
python -c "import motor.motor_asyncio; import asyncio; asyncio.run(motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000).admin.command('ping'))" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] MongoDB is NOT running on port 27017." -ForegroundColor Yellow
    Write-Host "[WARNING] History and auth features will be unavailable." -ForegroundColor Yellow
    Write-Host "[WARNING] Start MongoDB and the server will auto-reconnect." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "[OK] MongoDB is running." -ForegroundColor Green
}

# Clean __pycache__ directories
Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[INFO] Starting backend server on http://localhost:8000" -ForegroundColor Cyan
Write-Host "[INFO] API docs available at http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
