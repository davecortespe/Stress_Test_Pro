@echo off
setlocal EnableExtensions
set "LATEST_FILE=%~dp0exports\LATEST_EXPORT.txt"

if not exist "%LATEST_FILE%" (
  echo LATEST_EXPORT.txt not found. Run workflow:vsm:image first.
  pause
  exit /b 1
)

set /p BUNDLE_PATH=<"%LATEST_FILE%"
if "%BUNDLE_PATH%"=="" (
  echo LATEST_EXPORT.txt is empty.
  pause
  exit /b 1
)

if not exist "%BUNDLE_PATH%\start_full_app.bat" (
  echo start_full_app.bat not found in:
  echo %BUNDLE_PATH%
  pause
  exit /b 1
)

call "%BUNDLE_PATH%\start_full_app.bat"
