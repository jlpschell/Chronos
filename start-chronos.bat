@echo off
title Chronos Life OS
color 0A
cd /d "%~dp0"

echo.
echo   ██████╗██╗  ██╗██████╗  ██████╗ ███╗   ██╗ ██████╗ ███████╗
echo  ██╔════╝██║  ██║██╔══██╗██╔═══██╗████╗  ██║██╔═══██╗██╔════╝
echo  ██║     ███████║██████╔╝██║   ██║██╔██╗ ██║██║   ██║███████╗
echo  ██║     ██╔══██║██╔══██╗██║   ██║██║╚██╗██║██║   ██║╚════██║
echo  ╚██████╗██║  ██║██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝███████║
echo   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
echo.
echo  Life Operating System - Starting up...
echo.

:: Check if root node_modules exist
if not exist "node_modules" (
    echo  [1/3] Installing root dependencies...
    call npm install
) else (
    echo  [1/3] Root dependencies OK
)

:: Check if server node_modules exist
if not exist "server\node_modules" (
    echo  [2/3] Installing server dependencies...
    cd server && call npm install && cd ..
) else (
    echo  [2/3] Server dependencies OK
)

:: Check if web node_modules exist
if not exist "web\node_modules" (
    echo  [3/3] Installing web dependencies...
    cd web && call npm install && cd ..
) else (
    echo  [3/3] Web dependencies OK
)

echo.
echo  All systems go! Launching Chronos...
echo  Browser will open automatically.
echo  Press Ctrl+C to stop.
echo.

npm start
