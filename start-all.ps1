# Leaf Anomaly Detection - Full Stack Startup (PowerShell)
# =========================================================
# Starts MongoDB, Backend, DB Service, and Frontend.
# Data is saved permanently in the data\db folder.

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Leaf Anomaly Detection - Full Stack" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Check/Start MongoDB ----
Write-Host "[1/4] Checking MongoDB..." -ForegroundColor Yellow
try {
    python -c "import pymongo; c=pymongo.MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000); c.admin.command('ping'); print('[OK] MongoDB is already running.')" 2>$null
} catch {
    Write-Host "[INFO] MongoDB is not running. Starting with persistent data..." -ForegroundColor Yellow
    $mongod = Get-Command mongod -ErrorAction SilentlyContinue
    if ($mongod) {
        Start-Process mongod -ArgumentList "--dbpath", "$scriptDir\data\db", "--bind_ip", "127.0.0.1" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "[OK] MongoDB started (data saved in data\db)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] MongoDB not found. Please install MongoDB." -ForegroundColor Red
        Write-Host "[ERROR] Download: https://www.mongodb.com/try/download/community" -ForegroundColor Red
        Write-Host "[INFO] Without MongoDB, registration and history will not work." -ForegroundColor Yellow
    }
}

# ---- Step 2: Start Backend ----
Write-Host "[2/4] Starting Backend (port 8000)..." -ForegroundColor Yellow
$backendDir = Join-Path $scriptDir "backend"
Push-Location $backendDir

if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "[INFO] Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
    pip install -r requirements.txt --quiet 2>$null
} else {
    & "venv\Scripts\Activate.ps1"
}

Get-ChildItem -Path . -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Start-Process cmd -ArgumentList "/c", "title Backend - Leaf Anomaly Detection && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Hidden
Write-Host "[OK] Backend starting on http://localhost:8000" -ForegroundColor Green
Pop-Location

# ---- Step 3: Start DB Service ----
Write-Host "[3/4] Starting DB Service (port 4000)..." -ForegroundColor Yellow
$dbServiceDir = Join-Path $scriptDir "db-service"
Push-Location $dbServiceDir

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install --silent 2>$null
}

Start-Process cmd -ArgumentList "/c", "title DB Service - Leaf Anomaly Detection && node server.js" -WindowStyle Hidden
Write-Host "[OK] DB Service starting on http://localhost:4000" -ForegroundColor Green
Pop-Location

# ---- Step 4: Start Frontend ----
Write-Host "[4/4] Starting Frontend (port 3000)..." -ForegroundColor Yellow
$frontendDir = Join-Path $scriptDir "frontend"
Push-Location $frontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --silent 2>$null
}

Start-Process cmd -ArgumentList "/c", "title Frontend - Leaf Anomaly Detection && npm run dev" -WindowStyle Normal
Write-Host "[OK] Frontend starting on http://localhost:3000" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All services are starting up!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:    http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "  DB Service: http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "  Data is saved permanently in data\db folder." -ForegroundColor Green
Write-Host "  Open http://localhost:3000 in your browser." -ForegroundColor Green
Write-Host ""
