@echo off
title Noblesse PMS - Prisma Studio
color 0B

echo ============================================
echo   Noblesse PMS - Prisma Studio
echo   Visual database editor at :5555
echo ============================================
echo.

set ROOT=%~dp0..

echo [1/2] Making sure Docker (Postgres) is running...
docker-compose -f "%ROOT%\docker-compose.yml" up -d postgres
if %errorlevel% neq 0 (
    echo ERROR: Docker failed to start. Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo       Waiting 5 seconds for Postgres to be ready...
timeout /t 5 /nobreak >nul
echo       Done.
echo.

echo [2/2] Starting Prisma Studio at http://localhost:5555 ...
echo       (A browser window will open automatically)
echo.
cd /d "%ROOT%\apps\api"
start "" "http://localhost:5555"
npx prisma studio
