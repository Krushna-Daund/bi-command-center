@echo off
cd /d "%~dp0"
echo Starting BI Command Center...

echo Starting Backend API...
start "BI Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload"

echo Starting Frontend React App...
start "BI Frontend" cmd /k "cd frontend && npm run dev"

echo Both servers are starting up in separate windows!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
