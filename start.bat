@echo off
title AnonChat Launcher
cd /d "%~dp0"

echo.
echo  ^>^>^> AnonChat Launcher
echo.

:: --- Copy .env files if not exist ---
if not exist "server\.env" (
    copy "server\.env.example" "server\.env" >nul
    echo [OK] server\.env created
)
if not exist "client\.env" (
    copy "client\.env.example" "client\.env" >nul
    echo [OK] client\.env created
)

:: --- Install server deps ---
if not exist "server\node_modules" (
    echo [..] Installing server dependencies, please wait...
    cd server
    call npm install
    cd ..
    echo [OK] Server deps installed
)

:: --- Install client deps ---
if not exist "client\node_modules" (
    echo [..] Installing client dependencies, please wait...
    cd client
    call npm install
    cd ..
    echo [OK] Client deps installed
)

echo.
echo  [1] Opening Backend window  (port 3001)...
start "AnonChat - Backend" cmd /k "cd /d "%~dp0server" && npm run dev"

echo  [2] Opening Frontend window (port 5173)...
start "AnonChat - Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo  Waiting for servers to start...
timeout /t 4 /nobreak >nul

echo.
echo  ================================
echo   http://localhost:5173
echo  ================================
echo.
start "" "http://localhost:5173"

echo  Launcher done. You can close this window.
echo  (Backend and Frontend are running in their own windows)
echo.
pause
