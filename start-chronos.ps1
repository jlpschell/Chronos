# Chronos Life OS - PowerShell Launcher
# Right-click -> Run with PowerShell, or pin shortcut to taskbar

$Host.UI.RawUI.WindowTitle = "Chronos Life OS"
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "  ██████╗██╗  ██╗██████╗  ██████╗ ███╗   ██╗ ██████╗ ███████╗" -ForegroundColor Cyan
Write-Host " ██╔════╝██║  ██║██╔══██╗██╔═══██╗████╗  ██║██╔═══██╗██╔════╝" -ForegroundColor Cyan
Write-Host " ██║     ███████║██████╔╝██║   ██║██╔██╗ ██║██║   ██║███████╗" -ForegroundColor Cyan
Write-Host " ██║     ██╔══██║██╔══██╗██║   ██║██║╚██╗██║██║   ██║╚════██║" -ForegroundColor Cyan
Write-Host " ╚██████╗██║  ██║██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝███████║" -ForegroundColor Cyan
Write-Host "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host " Life Operating System - Starting up..." -ForegroundColor Green
Write-Host ""

# Check and install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host " [1/3] Installing root dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host " [1/3] Root dependencies OK" -ForegroundColor Green
}

if (-not (Test-Path "server/node_modules")) {
    Write-Host " [2/3] Installing server dependencies..." -ForegroundColor Yellow
    Push-Location server
    npm install
    Pop-Location
} else {
    Write-Host " [2/3] Server dependencies OK" -ForegroundColor Green
}

if (-not (Test-Path "web/node_modules")) {
    Write-Host " [3/3] Installing web dependencies..." -ForegroundColor Yellow
    Push-Location web
    npm install
    Pop-Location
} else {
    Write-Host " [3/3] Web dependencies OK" -ForegroundColor Green
}

Write-Host ""
Write-Host " All systems go! Launching Chronos..." -ForegroundColor Green
Write-Host " Browser will open automatically." -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

npm start
