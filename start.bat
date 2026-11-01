@echo off
echo ===================================================
echo  Starting CampusAssetSecurity Local Dev Server...
echo ===================================================
echo.
if not exist node_modules (
  echo [1/2] Installing dependencies with npm...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install encountered an error. Please ensure Node.js is installed.
    pause
    exit /b %errorlevel%
  )
)
echo.
echo [2/2] Starting server at http://localhost:3000 ...
echo Press Ctrl+C at any time to stop the server.
echo.
call npm run dev
pause
