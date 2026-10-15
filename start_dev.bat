@echo off
echo ===================================================
echo   CloudSentinel AI - Launching Dev Environment
echo ===================================================
echo Starting FastAPI Backend on http://localhost:8005 ...
start "CloudSentinel Backend" cmd /k ".\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8005 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
cd frontend
start "CloudSentinel Frontend" cmd /k "npm run dev"

echo.
echo Both servers are launching!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8005/docs
echo ===================================================
pause
