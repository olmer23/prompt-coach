@echo off
chcp 65001 >nul
setlocal
set "SCRIPT=%~dp0install.ps1"
if not exist "%SCRIPT%" (
  echo install.ps1 not found. Extract the archive fully.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "RC=%ERRORLEVEL%"
echo.
if %RC% neq 0 (
  echo Installation FAILED. Exit code: %RC%
  echo See log: %TEMP%\prompt-coach-install.log
) else (
  echo Installation finished. Open OpenCode and type /coach
)
pause
exit /b %RC%
