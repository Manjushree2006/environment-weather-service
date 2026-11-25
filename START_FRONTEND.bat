@echo off
cd /d "%~dp0frontend"
if not exist node_modules (
  echo Run npm install in this folder first.
  pause
  exit /b 1
)
npm run dev
