@echo off
echo Pushing all changes to GitHub...

cd /d "%~dp0"

git add .
git commit -m "Update project - %date% %time%"
git push origin main

echo.
echo Done! Changes pushed to GitHub.
echo Render and Vercel will auto-deploy in 2-3 minutes.
echo.
pause