@echo off
echo ========================================
echo      ADMIN SESSION FIX - QUICK PUSH
echo ========================================
echo.

cd /d "%~dp0"

echo Pushing admin session persistence fixes...
echo.

git add .
git commit -m "Fix admin session persistence - auto-login after refresh"
git push origin main

echo.
echo ========================================
echo            FIXES DEPLOYED!
echo ========================================
echo.
echo What was fixed:
echo - Admin session now persists after page refresh
echo - Auto-login when returning to admin panel
echo - Session extended to 7 days
echo - Auto-refresh session every hour
echo.
echo Wait 2-3 minutes for deployment, then test:
echo https://nhie.yennhie.site/admin
echo.
echo Login: Nhie / 1
echo.
pause