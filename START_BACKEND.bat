@echo off
cd /d "%~dp0backend"
if not exist venv\Scripts\python.exe (
  echo Create the virtual environment and install requirements first.
  pause
  exit /b 1
)
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
