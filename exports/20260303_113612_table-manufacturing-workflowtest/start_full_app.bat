@echo off
setlocal EnableExtensions EnableDelayedExpansion
set BUNDLE_ID=20260303_113612_table-manufacturing-workflowtest
set ROOT=app
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found on PATH.
  echo Install Node.js and run this file again.
  pause
  exit /b 1
)

set PORT=
for /L %%P in (4173,1,4199) do (
  netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul
  if errorlevel 1 (
    set PORT=%%P
    goto :port_found
  )
)

echo Could not find a free port in range 4173-4199.
pause
exit /b 1

:port_found
echo Starting %BUNDLE_ID% on http://localhost:%PORT%/
start "Export Full App Server (%BUNDLE_ID%)" cmd /k "cd /d ""%~dp0"" && node server.mjs --root ""%ROOT%"" --port %PORT%"
timeout /t 1 /nobreak >nul
start "" "http://localhost:%PORT%/?bundle=%BUNDLE_ID%"
