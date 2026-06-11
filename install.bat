@echo off
chcp 65001 >nul
title Quality KPI System — Installer
cd /d "%~dp0"

mode 90,30
color 0F

echo ═══════════════════════════════════════════════
echo      Quality KPI System — Installer
echo ═══════════════════════════════════════════════
echo.

REM ──── Check Python ────
echo [1/4] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   [MISSING] Python not found.
    echo   Download from: https://www.python.org/downloads/
    echo   Check "Add Python to PATH" during installation.
    pause
    exit /b 1
)
python --version

REM ──── Virtual Environment ────
echo.
echo [2/4] Setting up virtual environment...
if exist venv (
    echo   [OK] Virtual environment already exists
) else (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo   [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo   [OK] Virtual environment created
)
call venv\Scripts\activate.bat

echo   Installing dependencies...
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
echo   [OK] Dependencies installed

REM ──── Database ────
echo.
echo [3/4] Setting up database...
if exist quality_kpi.db (
    echo   [OK] Database already exists
) else (
    python seed_dev.py
    if %errorlevel% neq 0 (
        echo   [ERROR] Database setup failed.
        pause
        exit /b 1
    )
    echo   [OK] Database created with sample data
)

REM ──── Run ────
echo.
echo ═══════════════════════════════════════════════
echo      Starting server...
echo      Open http://127.0.0.1:8000
echo      Login: admin / admin123
echo ═══════════════════════════════════════════════
echo.

python run.py
pause
