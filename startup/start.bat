@echo off
title Noblesse PMS - Startup
color 0A

echo ============================================
echo   Noblesse PMS - Starting All Services
echo ============================================
echo.

:: Get the project root (one level up from startup folder)
set ROOT=%~dp0..

:: ── Kill any existing processes on ports 3000 and 3001 ──────────
echo [0/6] Killing any existing processes on ports 3000 and 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo       Done.
echo.

echo [1/6] Starting Docker containers (Postgres + Redis + Mailhog)...
:: Use --remove-orphans so existing stopped containers are replaced cleanly
docker-compose -f "%ROOT%\docker-compose.yml" up -d --remove-orphans
if %errorlevel% neq 0 (
    echo       Containers may already be running, attempting to restart...
    docker-compose -f "%ROOT%\docker-compose.yml" down
    docker-compose -f "%ROOT%\docker-compose.yml" up -d --remove-orphans
    if %errorlevel% neq 0 (
        echo ERROR: Docker failed to start. Make sure Docker Desktop is running.
        pause
        exit /b 1
    )
)
echo       Done.
echo.

echo [2/6] Waiting 8 seconds for Postgres to be ready...
ping -n 9 127.0.0.1 > nul
echo       Done.
echo.

echo [3/6] Building shared package...
cd /d "%ROOT%\packages\shared"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Shared package build failed.
    pause
    exit /b 1
)
echo       Done.
echo.

echo [4/6] Running Prisma migrations and seed...
cd /d "%ROOT%\apps\api"
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERROR: Migration failed.
    pause
    exit /b 1
)
call npx prisma db seed
echo       Done.
echo.

echo [5/6] Starting NestJS API (port 3001)...
start "Noblesse API" cmd /k "cd /d %ROOT%\apps\api && npm run start:dev"
echo       Opened in new window.
echo.

echo [6/6] Starting Next.js Web App (port 3000)...
start "Noblesse Web" cmd /k "cd /d %ROOT%\apps\web && npm run dev"
echo       Opened in new window.
echo.

echo ============================================
echo   All services started!
echo ============================================
echo.
echo   Web App:       http://localhost:3000
echo   API:           http://localhost:3001/api
echo   Swagger Docs:  http://localhost:3001/api/docs
echo   Mailhog:       http://localhost:8025
echo   Prisma Studio: run startup\prisma-studio.bat
echo.
echo   Waiting 15 seconds then opening browser...
ping -n 16 127.0.0.1 > nul
start "" "http://localhost:3000"