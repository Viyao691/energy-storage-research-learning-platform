$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Desktop was not found, so the application could not be stopped." -ForegroundColor Yellow
    exit 1
}

docker compose down
Write-Host "Energy Research Copilot stopped. Persistent data was kept." -ForegroundColor Cyan
