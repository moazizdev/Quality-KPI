@echo off
title Quality KPI System — Server
cd /d "%~dp0"

echo Starting Quality KPI Web Server...
echo.

REM Activate venv
if not exist venv\Scripts\activate.bat (
    echo [ERROR] Virtual environment not found.
    echo Please run setup.bat first.
    pause
    exit /b 1
)
call venv\Scripts\activate.bat

REM Start server
echo Opening http://127.0.0.1:8000 in your browser...
start http://127.0.0.1:8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info

pause
