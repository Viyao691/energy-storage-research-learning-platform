param(
    [switch]$Rebuild,
    [switch]$Standard
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot
. (Join-Path $projectRoot 'launcher\port_selection.ps1')

function Show-LauncherError([string]$Message) {
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($Message, 'Energy Research Copilot', 'OK', 'Error') | Out-Null
    } catch {
        Write-Host $Message -ForegroundColor Red
    }
}

function Get-DockerExecutable {
    $onPath = Get-Command docker -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }
    $desktopCli = Join-Path ${env:ProgramFiles} 'Docker\Docker\resources\bin\docker.exe'
    if (Test-Path $desktopCli) { return $desktopCli }
    return $null
}

function Wait-DockerDaemon([string]$DockerExecutable) {
    $deadline = (Get-Date).AddSeconds(60)
    do {
        & $DockerExecutable info *> $null
        if ($LASTEXITCODE -eq 0) { return $true }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)
    return $false
}

function Stop-ProjectNextDevServer([string]$Root) {
    $frontendPath = (Join-Path $Root 'frontend').ToLowerInvariant()
    $listenerIds = @()
    $netstat = Join-Path $env:SystemRoot 'System32\netstat.exe'
    foreach ($line in & $netstat -ano -p tcp) {
        $parts = @($line -split '\s+' | Where-Object { $_ })
        if (
            $parts.Count -ge 5 -and
            $parts[0] -eq 'TCP' -and
            $parts[1] -match ':3000$' -and
            $parts[3] -eq 'LISTENING'
        ) {
            $listenerIds += [int]$parts[4]
        }
    }

    foreach ($listenerId in ($listenerIds | Select-Object -Unique)) {
        $candidateId = $listenerId
        $devServerId = $null
        for ($depth = 0; $depth -lt 4 -and $candidateId; $depth++) {
            $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$candidateId" -ErrorAction SilentlyContinue
            if (-not $processInfo) { break }
            $commandLine = ([string]$processInfo.CommandLine).ToLowerInvariant()
            if (
                $commandLine.Contains($frontendPath) -and
                $commandLine -match '\bnext\b' -and
                $commandLine -match '\bdev\b'
            ) {
                $devServerId = [int]$processInfo.ProcessId
                break
            }
            $candidateId = [int]$processInfo.ParentProcessId
        }
        if ($devServerId) {
            Write-Host "Stopping a stale local Next.js development server (PID $devServerId)." -ForegroundColor Yellow
            & "$env:SystemRoot\System32\taskkill.exe" /PID $devServerId /T /F *> $null
            Start-Sleep -Milliseconds 500
        }
    }
}

$docker = Get-DockerExecutable
if (-not $docker) {
    $dockerDesktop = Join-Path ${env:ProgramFiles} 'Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dockerDesktop) { Start-Process -FilePath $dockerDesktop -WindowStyle Hidden }
    Show-LauncherError 'Docker Desktop was not found. Install and start it, then run the launcher again.'
    exit 1
}

& $docker info *> $null
if ($LASTEXITCODE -ne 0) {
    $dockerDesktop = Join-Path ${env:ProgramFiles} 'Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dockerDesktop) { Start-Process -FilePath $dockerDesktop -WindowStyle Hidden }
    if (-not (Wait-DockerDaemon $docker)) {
        Show-LauncherError 'Docker Desktop did not become ready within 60 seconds. Open Docker Desktop and try again.'
        exit 1
    }
}

Stop-ProjectNextDevServer $projectRoot

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host "Created .env in Mock mode. Continue configuration in the web setup wizard." -ForegroundColor Cyan
}

# Reuse installed local models and data when local_state/ is present. A fresh
# clone starts with named volumes. -Standard always selects named volumes.
# NOTE: -f flags must precede the compose subcommand: docker compose -f a -f b up.
$composeBaseArguments = @('compose')
if (-not $Standard -and (Test-Path (Join-Path $projectRoot 'local_state') -PathType Container)) {
    $composeBaseArguments += @('-f', 'docker-compose.yml', '-f', 'docker-compose.harness.yml')
}
$occupiedPorts = @()
$occupiedFrontendPorts = @()
$netstat = Join-Path $env:SystemRoot 'System32\netstat.exe'
foreach ($line in & $netstat -ano -p tcp) {
    $parts = @($line -split '\s+' | Where-Object { $_ })
    if ($parts.Count -ge 5 -and $parts[0] -eq 'TCP' -and $parts[3] -eq 'LISTENING' -and $parts[1] -match ':(\d+)$') {
        $port = [int]$Matches[1]
        if ($port -ge 8000 -and $port -le 8099) { $occupiedPorts += $port }
        if ($port -ge 3000 -and $port -le 3099) { $occupiedFrontendPorts += $port }
    }
}
$currentBackendId = (& $docker @composeBaseArguments ps -q backend 2>$null | Select-Object -First 1)
if ($currentBackendId) {
    $publishedPortsJson = & $docker inspect --format '{{json .NetworkSettings.Ports}}' $currentBackendId 2>$null
    if ($LASTEXITCODE -eq 0 -and $publishedPortsJson) {
        $publishedPorts = $publishedPortsJson | ConvertFrom-Json
        foreach ($binding in @($publishedPorts.'8000/tcp')) {
            if ($binding.HostPort) { $occupiedPorts = @($occupiedPorts | Where-Object { $_ -ne [int]$binding.HostPort }) }
        }
    }
}
$currentFrontendId = (& $docker @composeBaseArguments ps -q frontend 2>$null | Select-Object -First 1)
if ($currentFrontendId) {
    $publishedPortsJson = & $docker inspect --format '{{json .NetworkSettings.Ports}}' $currentFrontendId 2>$null
    if ($LASTEXITCODE -eq 0 -and $publishedPortsJson) {
        $publishedPorts = $publishedPortsJson | ConvertFrom-Json
        foreach ($binding in @($publishedPorts.'3000/tcp')) {
            if ($binding.HostPort) { $occupiedFrontendPorts = @($occupiedFrontendPorts | Where-Object { $_ -ne [int]$binding.HostPort }) }
        }
    }
}
$backendHostPort = Resolve-BackendHostPort -OccupiedPorts ($occupiedPorts | Select-Object -Unique)
$frontendHostPort = Resolve-FrontendHostPort -OccupiedPorts ($occupiedFrontendPorts | Select-Object -Unique)
$env:BACKEND_HOST_PORT = [string]$backendHostPort
$env:FRONTEND_HOST_PORT = [string]$frontendHostPort
if ($backendHostPort -ne 8000) {
    Write-Host "Port 8000 is used by another application; backend diagnostics will use 127.0.0.1:$backendHostPort." -ForegroundColor Yellow
}
if ($frontendHostPort -ne 3000) {
    Write-Host "Port 3000 is used by another application; the web address will be http://localhost:$frontendHostPort." -ForegroundColor Yellow
}

$composeArguments = @($composeBaseArguments) + @('up', '-d')
if ($Rebuild) {
    $composeArguments += '--build'
}
& $docker @composeArguments
if ($LASTEXITCODE -ne 0) {
    Show-LauncherError 'Docker Compose could not start the application. Run docker compose logs for details.'
    exit 1
}

$deadline = (Get-Date).AddSeconds(90)
do {
    try {
        $response = Invoke-RestMethod "http://127.0.0.1:$frontendHostPort/backend-api/health" -TimeoutSec 3
        if ($response.status -eq 'ok') {
            Start-Process "http://localhost:$frontendHostPort"
            Write-Host "Energy Research Copilot is ready: http://localhost:$frontendHostPort" -ForegroundColor Green
            exit 0
        }
    } catch { Start-Sleep -Seconds 2 }
} while ((Get-Date) -lt $deadline)

Show-LauncherError 'Startup timed out. Run docker compose logs to inspect details.'
exit 1
