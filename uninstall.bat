@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

mode 90, 30
color 0C

echo ═══════════════════════════════════════════════
echo      Quality KPI System — Uninstaller
echo ═══════════════════════════════════════════════
echo.
echo  This will remove:
echo    [1] Database file (quality_kpi.db)
echo    [2] Virtual environment (venv folder)
echo    [3] Python cache files (__pycache__)
echo.
echo  Your source code files will NOT be deleted.
echo.

setlocal disabledelayedexpansion
set /p "keepdb=Keep database file? (y/n) [n]: "
if /i "%keepdb%"=="y" ( set "KEEP_DB=1" ) else ( set "KEEP_DB=0" )
setlocal enabledelayedexpansion

echo.
echo ──────────────────────────────────────────────
echo  WARNING: This cannot be undone!
echo ──────────────────────────────────────────────
echo.
set /p "confirm=Type YES to continue: "
if /i not "!confirm!"=="YES" (
    color 0A
    echo.
    echo Cancelled. Nothing was changed.
    echo.
    pause
    exit /b 0
)

echo.
echo [1/5] Stopping server...

set "FOUND_PID="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" 2^>nul') do (
    if not "%%a"=="0" (
        set "FOUND_PID=%%a"
        taskkill /F /PID %%a >nul 2>&1
    )
)
if defined FOUND_PID (
    echo   [OK] Server stopped
) else (
    echo   [OK] No server was running
)

echo [2/5] Removing database...
if "!KEEP_DB!"=="1" (
    echo   [SKIP] Database kept (as you requested)
) else if exist "quality_kpi.db" (
    del /f /q "quality_kpi.db" >nul 2>&1
    if exist "quality_kpi.db" (
        echo   [FAILED] Could not delete database. Is it open in another program?
    ) else (
        echo   [OK] Database deleted
    )
) else (
    echo   [OK] No database found
)

echo [3/5] Removing virtual environment...
set "VENV_DELETED=0"
if exist "venv" (
    rmdir /s /q "venv" >nul 2>&1
    if not exist "venv" (
        echo   [OK] Virtual environment deleted (venv)
        set "VENV_DELETED=1"
    )
)
if "!VENV_DELETED!"=="0" if exist "..\venv" (
    rmdir /s /q "..\venv" >nul 2>&1
    if not exist "..\venv" (
        echo   [OK] Virtual environment deleted (..\venv)
        set "VENV_DELETED=1"
    )
)
if "!VENV_DELETED!"=="0" if exist "..\.venv" (
    rmdir /s /q "..\.venv" >nul 2>&1
    if not exist "..\.venv" (
        echo   [OK] Virtual environment deleted (..\.venv)
        set "VENV_DELETED=1"
    )
)
if "!VENV_DELETED!"=="0" (
    echo   [OK] No virtual environment found
)

echo [4/5] Cleaning temporary files...
for /d /r . %%d in (__pycache__) do if exist "%%d" rmdir /s /q "%%d" >nul 2>&1
del /s /f /q *.pyc *.pyo >nul 2>&1
echo   [OK] Temporary files cleaned

echo [5/5] Removing uninstaller...
del /f /q "uninstall.bat" >nul 2>&1
echo   [OK] Done

color 0A
echo.
echo ═══════════════════════════════════════════════
echo       Uninstall Complete!
echo ═══════════════════════════════════════════════
echo.
echo  Your files are still here:
echo    %CD%
echo.
echo  To reinstall, run: setup.bat
echo.
pause
