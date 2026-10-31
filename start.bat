@echo off
title CLYNORA Clinical Platform - Port 8081
echo ========================================================
echo Starting CLYNORA Frontend Platform on Port 8081...
echo ========================================================
echo Development URL: http://localhost:8081
echo.
echo Launching browser at http://localhost:8081 ...
start "" http://localhost:8081

echo Starting HTTP Server on port 8081...
python -m http.server 8081

if %errorlevel% neq 0 (
    echo Python server exited or unavailable. Trying Node.js on port 8081...
    npx --yes serve -l 8081 .
)

pause
