@echo off
setlocal
set PORT=4173
set ROOT=app
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found on PATH.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)

start "" "http://localhost:%PORT%"
node server.mjs --root "%ROOT%" --port %PORT%
