@echo off
setlocal
title Neverwinter Forge
cd /d "%~dp0"

if exist "Neverwinter Forge.exe" (
  "Neverwinter Forge.exe"
  echo.
  echo Neverwinter Forge has stopped.
  pause
  exit /b 0
)

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found on this system.
  echo.
  echo Install Python 3.10 or newer, then run this file again.
  echo https://www.python.org/downloads/
  echo.
  pause
  exit /b 1
)

python launch.py
echo.
echo Neverwinter Forge has stopped.
pause
