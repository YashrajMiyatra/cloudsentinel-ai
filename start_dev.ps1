# CloudSentinel AI Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  CloudSentinel AI - Starting Dev Environment" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend
Write-Host "Starting FastAPI Backend on http://localhost:8005 ..." -ForegroundColor Green
$backendJob = Start-Process -FilePath ".\backend\venv\Scripts\python.exe" -ArgumentList "-m uvicorn backend.app.main:app --host 0.0.0.0 --port 8005 --reload" -PassThru

# 2. Start Frontend
Write-Host "Starting React Frontend on http://localhost:5173 ..." -ForegroundColor Green
Set-Location -Path "frontend"
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev"

Set-Location -Path ".."
Write-Host "`nEnvironment Ready!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:8005/docs" -ForegroundColor Yellow
Write-Host "Press Ctrl+C or close windows to stop."
