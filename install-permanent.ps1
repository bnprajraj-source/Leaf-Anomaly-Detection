# ============================================
# Leaf Anomaly Detection - PERMANENT Setup
# ============================================
# Run this script ONCE as Administrator to make
# everything auto-start on Windows boot forever.
#
# Right-click → Run as Administrator
# ============================================

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PERMANENT Setup - Auto-Start on Boot" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- Step 1: Install MongoDB as Windows Service ----
Write-Host "[1/4] Setting up MongoDB as Windows service..." -ForegroundColor Yellow

$dataDir = Join-Path $scriptDir "data\db"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "  Created data directory: $dataDir" -ForegroundColor Gray
}

$mongodPath = $null
$possiblePaths = @(
    "mongod",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe",
    "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
)

foreach ($path in $possiblePaths) {
    try {
        $null = Get-Command $path -ErrorAction Stop
        $mongodPath = $path
        break
    } catch {}
}

if ($mongodPath) {
    # Check if service already exists
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "  [OK] MongoDB service already installed" -ForegroundColor Green
        if ($service.Status -ne "Running") {
            Start-Service MongoDB
            Write-Host "  [OK] MongoDB service started" -ForegroundColor Green
        }
    } else {
        Write-Host "  Installing MongoDB service..." -ForegroundColor Gray
        & $mongodPath --dbpath $dataDir --bind_ip 127.0.0.1 --install --serviceName "MongoDB" --serviceDisplayName "MongoDB Database" --description "MongoDB for Leaf Anomaly Detection"
        Start-Service MongoDB
        Write-Host "  [OK] MongoDB service installed and started" -ForegroundColor Green
    }
    Write-Host "  [OK] MongoDB auto-starts on boot" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] mongod not found. Install MongoDB first." -ForegroundColor Red
    Write-Host "  Download: https://www.mongodb.com/try/download/community" -ForegroundColor Gray
}

# ---- Step 2: Create auto-start batch script ----
Write-Host ""
Write-Host "[2/4] Creating auto-start script..." -ForegroundColor Yellow

$autoStartScript = @"
@echo off
:: Auto-start Leaf Anomaly Detection services
:: This runs at Windows login silently
timeout /t 5 /nobreak >nul

:: Start MongoDB (should already be running as service)
net start MongoDB >nul 2>&1

:: Start Backend
cd /d "$scriptDir\backend"
if exist "venv\Scripts\activate.bat" call venv\Scripts\activate.bat
start /min "Backend" cmd /c "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

:: Start DB Service
cd /d "$scriptDir\db-service"
start /min "DB Service" cmd /c "node server.js"
timeout /t 2 /nobreak >nul

:: Start Frontend
cd /d "$scriptDir\frontend"
start "" cmd /c "npm run dev"

exit
"@

$autoStartPath = Join-Path $scriptDir "auto-start.bat"
Set-Content -Path $autoStartPath -Value $autoStartScript -Encoding ASCII
Write-Host "  [OK] Created: auto-start.bat" -ForegroundColor Green

# ---- Step 3: Add to Windows Startup (Registry) ----
Write-Host ""
Write-Host "[3/4] Registering to start on Windows login..." -ForegroundColor Yellow

$startupPath = [Environment]::GetFolderPath("Startup")
$startupScript = Join-Path $startupPath "LeafScan-AutoStart.bat"
Set-Content -Path $startupScript -Value $autoStartScript -Encoding ASCII
Write-Host "  [OK] Added to Windows Startup folder" -ForegroundColor Green
Write-Host "  Location: $startupPath\LeafScan-AutoStart.bat" -ForegroundColor Gray

# ---- Step 4: Create Task Scheduler job (backup method) ----
Write-Host ""
Write-Host "[4/4] Creating scheduled task (backup method)..." -ForegroundColor Yellow

$taskName = "LeafScan-AutoStart"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute $autoStartPath
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Auto-start Leaf Anomaly Detection services on login" | Out-Null
Write-Host "  [OK] Scheduled task created" -ForegroundColor Green

# ---- Done ----
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  What was done:" -ForegroundColor White
Write-Host "  - MongoDB installed as Windows service (auto-starts on boot)" -ForegroundColor Gray
Write-Host "  - All services auto-start when you login to Windows" -ForegroundColor Gray
Write-Host "  - Data saved permanently in: $dataDir" -ForegroundColor Gray
Write-Host ""
Write-Host "  From now on:" -ForegroundColor White
Write-Host "  1. Turn on your PC" -ForegroundColor Yellow
Write-Host "  2. Wait 10 seconds after login" -ForegroundColor Yellow
Write-Host "  3. Open http://localhost:3000" -ForegroundColor Yellow
Write-Host "  4. Everything works! Registration data persists forever." -ForegroundColor Yellow
Write-Host ""
Write-Host "  To stop services: run stop-all.bat" -ForegroundColor Gray
Write-Host "  To check status:  run check-status.bat" -ForegroundColor Gray
Write-Host ""
pause
