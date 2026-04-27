@echo off
echo ========================================
echo    🚀 NOPE CHAT AUTO DEPLOY 🚀
echo ========================================
echo.
echo Choose an option:
echo [1] Quick Deploy (fast commit + push)
echo [2] Full Deploy (detailed commit + push)
echo [3] Exit
echo.
set /p choice="Enter your choice (1-3): "

cd /d "%~dp0"

if "%choice%"=="1" goto quick_deploy
if "%choice%"=="2" goto full_deploy
if "%choice%"=="3" goto exit
echo Invalid choice! Please try again.
pause
goto start

:quick_deploy
echo.
echo 🚀 Quick Deploy Mode...
git add .
git commit -m "Quick update - %time:~0,8%"
git push origin main
if errorlevel 1 (
    echo ❌ Push failed!
    pause
    exit /b 1
)
echo ✅ Deployed! Auto-deploy triggered.
timeout /t 2
goto exit

:full_deploy
echo.
echo [1/4] Checking git status...
git status --porcelain

echo.
echo [2/4] Adding all changes...
git add .

echo.
echo [3/4] Committing with timestamp...
set timestamp=%date:~-4,4%-%date:~-10,2%-%date:~-7,2% %time:~0,8%
git commit -m "Auto deploy: %timestamp%"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ Push failed! Check your internet connection.
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Code pushed to GitHub
echo 🔄 Auto-deploy triggered on Render + Vercel
echo ⏱️  Deployment takes 2-3 minutes...
timeout /t 3
goto exit

:exit
echo.
echo 👋 Done!
timeout /t 1