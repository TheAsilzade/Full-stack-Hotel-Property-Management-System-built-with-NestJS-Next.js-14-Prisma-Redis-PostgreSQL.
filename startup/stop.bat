@echo off
title Noblesse PMS - Stop
color 0C

echo ============================================
echo   Noblesse PMS - Stopping Docker Services
echo ============================================
echo.

set ROOT=%~dp0..

echo Stopping Postgres, Redis, Mailhog...
docker-compose -f "%ROOT%\docker-compose.yml" down
echo Done.
echo.
echo Note: API and Web windows must be closed manually (just close those terminal windows).
echo.
pause