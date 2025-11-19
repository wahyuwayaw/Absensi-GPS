@echo off
echo ========================================
echo START LOCALTUNNEL
echo ========================================
echo.

echo INSTRUCTIONS:
echo 1. Pastikan Laravel server sudah jalan: php artisan serve
echo 2. LocalTunnel akan create tunnel ke port 8000
echo 3. Copy URL yang muncul
echo 4. Buka di HP
echo 5. Klik "Click to Continue" (pertama kali)
echo 6. Login & test!
echo.
echo Starting LocalTunnel...
echo.

REM Start localtunnel
npx localtunnel --port 8000

pause
