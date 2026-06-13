@echo off
echo ============================================
echo   Experiment Platform - Local Development
echo ============================================
echo.

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo  MongoDB not found in PATH!
    echo  Please install MongoDB from: https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

REM Create data directory if it doesn't exist
if not exist "C:\data\db" (
    echo  Creating MongoDB data directory...
    mkdir "C:\data\db" 2>nul
    if %errorlevel% neq 0 (
        echo  Warning: Could not create C:\data\db
        echo  You may need to run as Administrator or create it manually.
    )
)

REM Check if MongoDB is already running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if %errorlevel% equ 0 (
    echo  MongoDB is already running.
) else (
    echo  Starting MongoDB...
    start /B mongod --dbpath C:\data\db >nul 2>&1
    timeout /t 3 /nobreak >nul
    echo  MongoDB started.
)

echo.
echo  Starting Flask backend...
echo ============================================
echo.

cd backend
python run_local.py
