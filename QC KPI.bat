@echo off
title Quality KPI System
cd /d "%~dp0"

echo Starting Quality KPI System...
echo.

REM Activate venv
if not exist venv\Scripts\activate.bat (
    echo [ERROR] Virtual environment not found.
    echo Please run setup.bat first.
    pause
    exit /b 1
)
call venv\Scripts\activate.bat

REM Start the desktop app
python desktop_app.py

REM If desktop closes, keep window open to show any error
echo.
echo Application closed.
pause
