@echo off
echo Building and deploying NOPE CHAT...

cd /d "%~dp0"

echo [1/4] Building frontend...
cd client
call npm run build
cd ..

echo [2/4] Preparing server...
cd server
call npm install --production
cd ..

echo [3/4] Committing to git...
git add .
git commit -m "Auto build and deploy - %time%"

echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo Deploy completed! Sites will update in 2-3 minutes.
echo Main: https://nhie.yennhie.site
echo Admin: https://nhie.yennhie.site/admin
timeout /t 3