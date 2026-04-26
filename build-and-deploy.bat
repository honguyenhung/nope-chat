@echo off
echo Building and deploying NOPE CHAT...

cd /d "%~dp0"

echo [1/3] Committing current changes...
git add .
git commit -m "Fix deployment - %time%"

echo [2/3] Pushing to GitHub...
git push origin main

echo [3/3] Triggering Vercel redeploy...
echo Done! Check Vercel dashboard for deployment status.
echo.
echo If still broken, manually redeploy in Vercel dashboard.
timeout /t 3