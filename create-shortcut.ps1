# Create Desktop & Start Menu Shortcut for Chronos
# Run this once: Right-click -> Run with PowerShell

$scriptPath = $PSScriptRoot
$batPath = Join-Path $scriptPath "start-chronos.bat"
$shortcutName = "Chronos"

# Create shortcut on Desktop
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "$shortcutName.lnk"

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $batPath
$shortcut.WorkingDirectory = $scriptPath
$shortcut.Description = "Chronos Life Operating System"
$shortcut.WindowStyle = 1  # Normal window
$shortcut.Save()

Write-Host "✓ Desktop shortcut created: $shortcutPath" -ForegroundColor Green

# Also create in Start Menu for easy search
$startMenuPath = [Environment]::GetFolderPath("StartMenu")
$startMenuShortcut = Join-Path $startMenuPath "Programs\$shortcutName.lnk"
$shortcut2 = $WScriptShell.CreateShortcut($startMenuShortcut)
$shortcut2.TargetPath = $batPath
$shortcut2.WorkingDirectory = $scriptPath
$shortcut2.Description = "Chronos Life Operating System"
$shortcut2.WindowStyle = 1
$shortcut2.Save()

Write-Host "✓ Start Menu shortcut created: $startMenuShortcut" -ForegroundColor Green
Write-Host ""
Write-Host "NOW:" -ForegroundColor Yellow
Write-Host "1. Find 'Chronos' on your Desktop" -ForegroundColor Cyan
Write-Host "2. Right-click it -> Pin to taskbar" -ForegroundColor Cyan
Write-Host "3. Click anytime to launch!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or just press Win key and type 'Chronos' to launch!" -ForegroundColor Gray

Read-Host "Press Enter to close"
