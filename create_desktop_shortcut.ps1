$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcherName = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('8J+TmiDlgqjog73np5HnoJRBSeWKqeaJiy5leGU='))
$launcher = Join-Path $root $launcherName

if (-not (Test-Path $launcher)) {
    throw "Launcher was not found: $launcher. Run .\launcher\pack_iexpress.ps1 first."
}

$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Energy Research Copilot.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$root\start.ps1`""
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe,0"
$shortcut.Description = 'Start Energy Research Copilot'
$shortcut.Save()
Write-Host "Desktop shortcut created: $shortcutPath" -ForegroundColor Green
