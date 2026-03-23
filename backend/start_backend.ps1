# ─────────────────────────────────────────────────────────────────
# Insurance App — Full Backend Startup Script
# Run from: d:\Insurance_Comparison_Recommendation\backend\
# Usage:    .\start_backend.ps1
# ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Insurance App - Backend Startup Script  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Verify .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found in the backend directory!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ .env file found" -ForegroundColor Green

# 2. Check virtual environment
if (-not (Test-Path "venv\Scripts\activate")) {
    Write-Host "❌ ERROR: Virtual environment not found. Run: python -m venv venv" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Virtual environment found" -ForegroundColor Green

# 3. Activate venv and run config check
Write-Host ""
Write-Host "🔍 Checking credentials from .env file..." -ForegroundColor Yellow
& venv\Scripts\python.exe check_config.py

# 4. Check if Redis (Docker) is running
Write-Host "🔍 Checking Redis connection..." -ForegroundColor Yellow
$redis_check = & venv\Scripts\python.exe -c "import redis; r = redis.Redis(); r.ping(); print('OK')" 2>&1
if ($redis_check -eq "OK") {
    Write-Host "✅ Redis is running on localhost:6379" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis is NOT running. Starting it via Docker..." -ForegroundColor Yellow
    & docker run -p 6379:6379 -d redis
    Start-Sleep -Seconds 2
    Write-Host "✅ Redis started via Docker" -ForegroundColor Green
}

# 5. Start Celery in a NEW terminal window
Write-Host ""
Write-Host "🚀 Starting Celery worker in a new terminal window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; venv\Scripts\activate; celery -A app.worker.celery_app worker --loglevel=info --pool=solo"

Start-Sleep -Seconds 2

# 6. Start FastAPI uvicorn in the CURRENT terminal
Write-Host "🚀 Starting FastAPI server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend is ready! Visit: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""
& venv\Scripts\uvicorn.exe app.main:app --reload
