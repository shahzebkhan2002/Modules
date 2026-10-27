@echo off
echo ========================================================
echo Starting Digital Labour Marketplace (Local Environment)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/2] Starting Backend Server (Port 5000)...
start "DLM Backend Server" cmd /k "cd /d "%ROOT_DIR%backend" && npm run dev"

echo [2/2] Starting Frontend Vite Server (Port 5173)...
start "DLM Frontend Client" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ========================================================
echo Servers launched! Open http://localhost:5173 in browser.
echo ========================================================
pause
