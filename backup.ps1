param(
    [string]$DataDirectory,
    [string]$OutputDirectory,
    [string]$BackendImage,
    [switch]$NoRestart,
    [switch]$Standard
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$archiveImage = 'alpine@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b'
$productionVolume = 'energy_copilot_data'
$partialPath = $null
$backendWasRunning = $false
$isGuardedTest = $false

function Assert-NativeSuccess([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Get-CanonicalProjectRoot([string]$CurrentRoot) {
    try {
        $commonDirectory = (& git -C $CurrentRoot rev-parse --path-format=absolute --git-common-dir 2>$null | Select-Object -First 1)
        if ($LASTEXITCODE -eq 0 -and $commonDirectory) {
            $resolvedCommon = [System.IO.Path]::GetFullPath([string]$commonDirectory)
            if ((Split-Path -Leaf $resolvedCommon) -eq '.git') {
                $candidate = Split-Path -Parent $resolvedCommon
                if (Test-Path -LiteralPath (Join-Path $candidate 'docker-compose.yml') -PathType Leaf) {
                    return [System.IO.Path]::GetFullPath($candidate)
                }
            }
        }
    } catch { }
    return [System.IO.Path]::GetFullPath($CurrentRoot)
}

function Test-GuardedTestPath([string]$Path) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $temporary = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($temporary, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    $relative = $resolved.Substring($temporary.Length)
    $firstSegment = ($relative -split '[\\/]')[0]
    return $firstSegment -match '^energy-copilot-backup-test-[a-f0-9]+$'
}

function Get-UniqueArchivePath([string]$Directory) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmssfff'
    $candidate = Join-Path $Directory "energy-copilot-$stamp.tar.gz"
    $suffix = 1
    while (
        (Test-Path -LiteralPath $candidate) -or
        (Test-Path -LiteralPath "$candidate.partial") -or
        (Test-Path -LiteralPath "$candidate.sha256") -or
        (Test-Path -LiteralPath "$candidate.manifest.json")
    ) {
        $candidate = Join-Path $Directory "energy-copilot-$stamp-$suffix.tar.gz"
        $suffix += 1
    }
    return $candidate
}

$runtimeRoot = Get-CanonicalProjectRoot $projectRoot
$productionDataDirectory = [System.IO.Path]::GetFullPath((Join-Path $runtimeRoot 'local_state\energy-data'))
$defaultOutputDirectory = [System.IO.Path]::GetFullPath((Join-Path $runtimeRoot 'backups'))

if ($Standard -and $PSBoundParameters.ContainsKey('DataDirectory')) {
    throw '使用 -Standard 时不能同时指定 -DataDirectory。'
}
if (-not $Standard) {
    if (-not $DataDirectory) { $DataDirectory = $productionDataDirectory }
    $resolvedDataDirectory = [System.IO.Path]::GetFullPath($DataDirectory)
    $isGuardedTest = Test-GuardedTestPath $resolvedDataDirectory
    if (
        -not $resolvedDataDirectory.Equals($productionDataDirectory, [System.StringComparison]::OrdinalIgnoreCase) -and
        -not $isGuardedTest
    ) {
        throw '数据目录必须是 Harness local_state\energy-data 或受保护的临时测试目录。'
    }
    if (-not (Test-Path -LiteralPath $resolvedDataDirectory -PathType Container)) {
        throw "数据目录不存在：$resolvedDataDirectory"
    }
}

if (-not $OutputDirectory) { $OutputDirectory = $defaultOutputDirectory }
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$resolvedOutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
if (
    -not $resolvedOutputDirectory.Equals($defaultOutputDirectory, [System.StringComparison]::OrdinalIgnoreCase) -and
    -not (Test-GuardedTestPath $resolvedOutputDirectory)
) {
    throw '正式备份只能写入项目 backups 目录。'
}

$composeArguments = @('compose')
if (-not $Standard) {
    $composeArguments += @(
        '--project-directory', $runtimeRoot,
        '-f', (Join-Path $runtimeRoot 'docker-compose.yml'),
        '-f', (Join-Path $runtimeRoot 'docker-compose.harness.yml')
    )
} else {
    $composeArguments += @(
        '--project-directory', $runtimeRoot,
        '-f', (Join-Path $runtimeRoot 'docker-compose.yml')
    )
}

try {
    if (-not $BackendImage) {
        $backendContainer = (& docker @composeArguments ps -q backend 2>$null | Select-Object -First 1)
        if ($backendContainer) {
            $BackendImage = (& docker inspect $backendContainer --format '{{.Image}}').Trim()
            Assert-NativeSuccess '无法读取 Harness 后端镜像。'
        }
        if (-not $BackendImage) {
            $BackendImage = (& docker @composeArguments images -q backend 2>$null | Select-Object -First 1)
        }
    }
    if (-not $BackendImage) { throw '未找到 Harness 后端镜像，请先运行 .\start.ps1 -Rebuild。' }
    & docker image inspect $BackendImage *> $null
    Assert-NativeSuccess 'Harness 后端镜像不可用。'

    if (-not $isGuardedTest) {
        $runningContainer = (& docker @composeArguments ps --status running -q backend 2>$null | Select-Object -First 1)
        $backendWasRunning = [bool]$runningContainer
        if ($backendWasRunning) {
            & docker @composeArguments stop backend
            Assert-NativeSuccess '无法暂停 Harness 后端，备份已取消。'
        }
    }

    if ($Standard) {
        $manifestLines = @(& docker run --rm -v "${productionVolume}:/app/data:ro" $BackendImage python -m app.backup_validation --data-root /app/data)
    } else {
        $manifestLines = @(& docker run --rm -v "${resolvedDataDirectory}:/app/data:ro" $BackendImage python -m app.backup_validation --data-root /app/data)
    }
    Assert-NativeSuccess '备份前数据完整性检查失败。'
    $manifestJson = ($manifestLines -join [Environment]::NewLine).Trim()
    $manifest = $manifestJson | ConvertFrom-Json
    if ($manifest.status -ne 'ok') { throw '备份前数据完整性检查未返回成功状态。' }

    $archivePath = Get-UniqueArchivePath $resolvedOutputDirectory
    $archiveLeaf = Split-Path -Leaf $archivePath
    $partialPath = "$archivePath.partial"
    $partialLeaf = Split-Path -Leaf $partialPath
    $tarArguments = @(
        'tar',
        '--exclude=./.env',
        '--exclude=./runtime-secret.key',
        '--exclude=./runtime-secrets.json',
        '--exclude=./backups',
        '--exclude=./cache',
        '--exclude=*.partial',
        '-czf', "/backup/$partialLeaf", '-C', '/data', '.'
    )
    if ($Standard) {
        & docker run --rm -v "${productionVolume}:/data:ro" -v "${resolvedOutputDirectory}:/backup" $archiveImage @tarArguments
    } else {
        & docker run --rm -v "${resolvedDataDirectory}:/data:ro" -v "${resolvedOutputDirectory}:/backup" $archiveImage @tarArguments
    }
    Assert-NativeSuccess '创建备份归档失败。'
    & docker run --rm -v "${resolvedOutputDirectory}:/backup:ro" $archiveImage tar -tzf "/backup/$partialLeaf" *> $null
    Assert-NativeSuccess '备份归档无法读取。'

    Move-Item -LiteralPath $partialPath -Destination $archivePath
    $partialPath = $null
    $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText("$archivePath.manifest.json", "$manifestJson$([Environment]::NewLine)", $utf8WithoutBom)
    [System.IO.File]::WriteAllText("$archivePath.sha256", "$hash  $archiveLeaf$([Environment]::NewLine)", $utf8WithoutBom)

    Write-Host "备份已创建：$archivePath" -ForegroundColor Green
    Write-Host "SHA-256：$hash"
    Write-Host "清单：$archivePath.manifest.json"
}
finally {
    if ($partialPath -and (Test-Path -LiteralPath $partialPath)) {
        Remove-Item -LiteralPath $partialPath -Force
    }
    if ($backendWasRunning -and -not $NoRestart) {
        & docker @composeArguments start backend
        if ($LASTEXITCODE -ne 0) {
            Write-Warning '备份结束后未能重新启动 Harness 后端，请运行 .\start.ps1。'
        }
    }
}
