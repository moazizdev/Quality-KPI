@echo off
title Quality KPI System — Installation
cd /d "%~dp0"

mode 90,40
color 0F

echo ═══════════════════════════════════════════════
echo      Quality KPI System — Setup
echo ═══════════════════════════════════════════════
echo.
echo  This will install everything needed to run the
echo  Quality KPI System on your computer.
echo.

REM ──────────────────── Check / Install Python ────────────────────

:CHECK_PYTHON
echo [1/5] Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python --version
    echo   [OK] Python found
    goto :PYTHON_OK
)

echo   [MISSING] Python not found
echo   Attempting to install Python automatically...

where winget >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] Automatic install requires Windows 10/11 with winget.
    echo.
    echo   Please manually install Python 3.10+ from:
    echo   https://www.python.org/downloads/
    echo.
    echo   Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo   Downloading Python via winget (this may take a few minutes)...
winget install --id Python.Python.3.13 --silent --accept-package-agreements 2>&1 | findstr /i "success" >nul
if %errorlevel% neq 0 (
    echo   [WARNING] Python install may have failed. Trying again with verbose...
    winget install --id Python.Python.3.13 --accept-package-agreements 2>&1
)

REM Refresh PATH so Python is found
echo   Refreshing PATH...
call "%USERPROFILE%\AppData\Local\Microsoft\WindowsApps\vsdevcmd\ext\fresh.cmd" 2>nul
for /f "tokens=*" %%a in ('where python 2^>nul') do set "PYTHON_PATH=%%a"
if not defined PYTHON_PATH (
    for /f "tokens=*" %%a in ('dir /s /b "%LOCALAPPDATA%\Microsoft\WindowsApps\python*" 2^>nul') do set "PYTHON_PATH=%%a"
)

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] Python still not found after installation.
    echo   Please restart this setup after Python is installed.
    pause
    exit /b 1
)
echo   [OK] Python installed successfully
python --version

:PYTHON_OK

REM ──────────────────── Create Virtual Environment ────────────────────

echo.
echo [2/5] Creating virtual environment...
if exist "venv" (
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

REM ──────────────────── Install Dependencies ────────────────────

echo.
echo [3/5] Installing dependencies (this may take a while)...
call venv\Scripts\activate.bat

echo   Updating pip...
python -m pip install --upgrade pip -q
echo   [OK] Pip updated

echo   Installing packages from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo   [WARNING] Some packages failed to install.
    echo   The app may still work for basic features.
) else (
    echo   [OK] All packages installed
)

REM ──────────────────── Check / Install GTK (for PDF export) ────────────────────

echo.
echo [4/5] Checking PDF export support (GTK+)...
python -c "import weasyprint" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] PDF export ready
    goto :GTK_OK
)

echo   [MISSING] GTK+ runtime needed for PDF export
set "GTK_INSTALLER=%TEMP%\gtk3-runtime-installer.exe"
if not exist "%GTK_INSTALLER%" (
    echo   Downloading GTK+ runtime (6 MB)...
    powershell -Command "& {try{ $wc = New-Object System.Net.WebClient; $wc.DownloadFile('https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases/download/2024-08-03/gtk3-runtime-3.24.42-2024-08-03-ts-win64.exe', '%GTK_INSTALLER%') }catch{ exit 1 }}"
    if %errorlevel% neq 0 (
        echo   [WARNING] Download failed.
        echo   PDF export will not work without GTK+.
        echo   To install manually, download from:
        echo   https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer
        goto :GTK_SKIP
    )
)
if exist "%GTK_INSTALLER%" (
    echo   Installing GTK+ runtime...
    start /wait "" "%GTK_INSTALLER%" /S /D=C:\GTK
    echo   [OK] GTK+ installed. PDF export ready after restart.
)

:GTK_SKIP
echo   [SKIP] PDF export will show an error but the app will still work

:GTK_OK

REM ──────────────────── Setup Database ────────────────────

echo.
echo [5/5] Setting up database...
if exist "quality_kpi.db" (
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

REM ──────────────────── Create Shortcuts ────────────────────

echo.
echo  Creating shortcuts...
if not exist "%USERPROFILE%\Desktop\QC KPI (Desktop).lnk" (
    powershell -Command ^
        $WshShell = New-Object -ComObject WScript.Shell; ^
        $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\QC KPI (Desktop).lnk'); ^
        $Shortcut.TargetPath = '%~dp0QC KPI.bat'; ^
        $Shortcut.WorkingDirectory = '%~dp0'; ^
        $Shortcut.Description = 'Quality KPI System - Desktop App'; ^
        $Shortcut.Save() >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] "QC KPI (Desktop)" shortcut created
    )
)
if not exist "%USERPROFILE%\Desktop\QC KPI (Browser).lnk" (
    powershell -Command ^
        $WshShell = New-Object -ComObject WScript.Shell; ^
        $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\QC KPI (Browser).lnk'); ^
        $Shortcut.TargetPath = '%~dp0start_server.bat'; ^
        $Shortcut.WorkingDirectory = '%~dp0'; ^
        $Shortcut.Description = 'Quality KPI System - Web Browser'; ^
        $Shortcut.Save() >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] "QC KPI (Browser)" shortcut created
    )
)

REM ──────────────────── Done ────────────────────

color 0A
echo.
echo ═══════════════════════════════════════════════
echo       Installation Complete!
echo ═══════════════════════════════════════════════
echo.
echo   To start the app, double-click one of these shortcuts:
echo     "QC KPI (Desktop)" — opens as a desktop window
echo     "QC KPI (Browser)" — opens in your web browser
echo.
echo   Login: admin
echo   Password: admin123
echo.
echo   App will open at: http://127.0.0.1:8000
echo.
pause
