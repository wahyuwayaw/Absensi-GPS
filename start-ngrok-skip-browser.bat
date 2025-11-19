@echo off
echo ========================================
echo START NGROK - SKIP BROWSER WARNING
echo ========================================
echo.

echo Starting ngrok with skip-browser-warning...
echo.

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok not found!
    echo Please install ngrok first.
    echo Download: https://ngrok.com/download
    pause
    exit /b 1
)

echo Ngrok will start with:
echo - Port: 8000
echo - Skip browser warning (no interstitial!)
echo.

REM Start ngrok with custom header to skip warning
ngrok http 8000 --request-header-add "ngrok-skip-browser-warning:true"

pause
