@echo off
echo ========================================
echo        NOPE CHAT - LOCAL DEVELOPMENT
echo ========================================
echo.

cd /d "%~dp0"

echo Choose what to run:
echo.
echo 1. Start Backend Server (Port 3001)
echo 2. Start Frontend Dev Server (Port 5173)
echo 3. Start Both (Recommended)
echo 4. Install Dependencies
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto install
if "%choice%"=="5" goto exit

:backend
echo Starting backend server...
cd server
npm run dev
goto end

:frontend
echo Starting frontend dev server...
cd client
npm run dev
goto end

:both
echo Starting both servers...
echo.
echo Opening 2 new command windows...
start "Backend Server" cmd /k "cd server && npm run dev"
start "Frontend Server" cmd /k "cd client && npm run dev"
echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo Admin: http://localhost:5173/admin
goto end

:install
echo Installing dependencies...
echo.
echo [1/2] Installing server dependencies...
cd server
npm install
cd ..
echo.
echo [2/2] Installing client dependencies...
cd client
npm install
cd ..
echo.
echo All dependencies installed!
goto end

:exit
exit

:end
echo.
pause