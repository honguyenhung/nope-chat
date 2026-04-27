@echo off
echo ========================================
echo    🚀 NOPE CHAT AUTO DEPLOY 🚀
echo ========================================
echo.
echo Choose an option:
echo [1] Quick Deploy (commit + push)
echo [2] Full Deploy (commit + push + open dashboards)
echo [3] Check Status (open dashboards + live site)
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

cd /d "%~dp0"

if "%choice%"=="1" goto quick_deploy
if "%choice%"=="2" goto full_deploy
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto exit
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
echo ✅ Deployed! Check in 2-3 minutes.
timeout /t 3
goto exit

:full_deploy
echo.
echo [1/4] Checking git status...
git status --porcelain
if errorlevel 1 (
    echo ❌ Git error! Make sure you're in a git repository.
    pause
    exit /b 1
)

echo.
echo [2/4] Adding all changes...
git add .

echo.
echo [3/4] Committing with timestamp...
set timestamp=%date:~-4,4%-%date:~-10,2%-%date:~-7,2% %time:~0,8%
git commit -m "Auto deploy: %timestamp%"

if errorlevel 1 (
    echo ⚠️  No changes to commit or commit failed
    echo Continuing with push anyway...
)

echo.
echo [4/4] Pushing to GitHub (triggers auto-deploy)...
git push origin main

if errorlevel 1 (
    echo ❌ Push failed! Check your internet connection and GitHub credentials.
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Code pushed to GitHub
echo.
echo 🔄 Auto-deploy triggered:
echo    • Render.com (Backend) - will redeploy automatically
echo    • Vercel (Frontend) - will redeploy automatically
echo.
echo 📊 Opening deployment dashboards...
start https://dashboard.render.com
start https://vercel.com/dashboard
echo.
echo ⏱️  Deployment usually takes 2-3 minutes...
timeout /t 3
goto exit

:check_status
echo.
echo 📊 Checking deployment status...
echo.
echo Opening deployment dashboards...
start https://dashboard.render.com
start https://vercel.com/dashboard
echo.
echo 🌐 Opening your live site...
timeout /t 2
start https://nhie.yennhie.site
echo.
echo ✅ All links opened in browser!
timeout /t 3
goto exit

:exit
echo.
echo 👋 Done! Have a great day!
timeout /t 2