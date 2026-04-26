@echo off
echo Pushing admin panel code to GitHub...

cd /d "%~dp0"

git add .
git commit -m "Add admin panel system with dashboard"
git push origin main

echo.
echo Code pushed successfully!
echo Render will auto-deploy in 2-3 minutes.
echo.
pause