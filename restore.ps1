param(
    [Parameter(Mandatory = $true)][string]$BackupFile,
    [string]$DataDirectory,
    [string]$BackendImage,
    [switch]$ConfirmRestore,
    [string]$ConfirmationText,
    [switch]$NoRestart,
    [switch]$Standard
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$archiveImage = 'alpine@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b'
$productionVolume = 'energy_copilot_data'
$stagingDirectory = $null
$restoreSucceeded = $false
$stackWasRunning = $false
$recoveryArchive = $null
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

function Test-GuardedRestorePath([string]$Path) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $temporary = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($temporary, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    $relative = $resolved.Substring($temporary.Length)
    $firstSegment = ($relative -split '[\\/]')[0]
    return $firstSegment -match '^energy-copilot-restore-test-[a-f0-9]+$'
}

function Assert-SafeStagingDirectory([string]$Path) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $temporary = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($temporary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw '拒绝使用系统临时目录之外的恢复暂存目录。'
    }
    if ((Split-Path -Leaf $resolved) -notmatch '^energy-copilot-restore-stage-[a-f0-9]+$') {
        throw '恢复暂存目录名称无效。'
    }
}

function Get-ValidatedManifest([string]$SourceType, [string]$Source, [string]$Image, [string]$Context) {
    if ($SourceType -eq 'Volume') {
        $lines = @(& docker run --rm -v "${Source}:/app/data:ro" $Image python -m app.backup_validation --data-root /app/data 2>&1)
    } else {
        $lines = @(& docker run --rm -v "${Source}:/app/data:ro" $Image python -m app.backup_validation --data-root /app/data 2>&1)
    }
    $exitCode = $LASTEXITCODE
    $text = @($lines | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    if ($exitCode -ne 0) {
        if (-not $text) { $text = '未返回错误详情' }
        throw "$Context 数据完整性检查失败：$text"
    }
    try {
        $manifest = $text | ConvertFrom-Json
    } catch {
        throw "$Context 数据完整性检查未返回有效 JSON。"
    }
    if ($manifest.status -ne 'ok') { throw "$Context 数据完整性检查未返回成功状态。" }
    return $manifest
}

function Assert-ManifestMatch($Actual, $Expected, [string]$Context) {
    $checks = @(
        @('database.alembic_version', [string]$Actual.database.alembic_version, [string]$Expected.database.alembic_version),
        @('database.sha256', [string]$Actual.database.sha256, [string]$Expected.database.sha256),
        @('papers.file_count', [string]$Actual.papers.file_count, [string]$Expected.papers.file_count),
        @('papers.total_bytes', [string]$Actual.papers.total_bytes, [string]$Expected.papers.total_bytes),
        @('papers.referenced_file_count', [string]$Actual.papers.referenced_file_count, [string]$Expected.papers.referenced_file_count)
    )
    foreach ($check in $checks) {
        if ($check[1] -ne $check[2]) {
            throw "$Context 与备份清单不一致：$($check[0])。"
        }
    }
    if (@($Actual.papers.missing_referenced_files).Count -ne 0) {
        throw "$Context 仍有缺失论文文件。"
    }
}

function Get-UniqueRecoveryPath([string]$Directory) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmssfff'
    $candidate = Join-Path $Directory "recovery-before-restore-$stamp.tar.gz"
    $suffix = 1
    while (Test-Path -LiteralPath $candidate) {
        $candidate = Join-Path $Directory "recovery-before-restore-$stamp-$suffix.tar.gz"
        $suffix += 1
    }
    return $candidate
}

$runtimeRoot = Get-CanonicalProjectRoot $projectRoot
$productionDataDirectory = [System.IO.Path]::GetFullPath((Join-Path $runtimeRoot 'local_state\energy-data'))
if ($Standard -and $PSBoundParameters.ContainsKey('DataDirectory')) {
    throw '使用 -Standard 时不能同时指定 -DataDirectory。'
}
if (-not $Standard) {
    if (-not $DataDirectory) { $DataDirectory = $productionDataDirectory }
    $resolvedDataDirectory = [System.IO.Path]::GetFullPath($DataDirectory)
    $isGuardedTest = Test-GuardedRestorePath $resolvedDataDirectory
    if (
        -not $resolvedDataDirectory.Equals($productionDataDirectory, [System.StringComparison]::OrdinalIgnoreCase) -and
        -not $isGuardedTest
    ) {
        throw '恢复目标必须是 Harness local_state\energy-data 或受保护的临时测试目录。'
    }
    if (-not (Test-Path -LiteralPath $resolvedDataDirectory -PathType Container)) {
        throw "恢复目标不存在：$resolvedDataDirectory"
    }
}

if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) { throw "找不到备份文件：$BackupFile" }
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
if (-not $resolvedBackup.EndsWith('.tar.gz', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw '备份文件必须是 .tar.gz 归档。'
}
$archiveDirectory = Split-Path -Parent $resolvedBackup
$archiveLeaf = Split-Path -Leaf $resolvedBackup
$hashPath = "$resolvedBackup.sha256"
$manifestPath = "$resolvedBackup.manifest.json"
if (-not (Test-Path -LiteralPath $hashPath -PathType Leaf)) { throw "缺少 SHA-256 文件：$hashPath" }
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "缺少清单文件：$manifestPath" }

$hashParts = (Get-Content -LiteralPath $hashPath -Raw -Encoding UTF8).Trim() -split '\s+'
if ($hashParts.Count -lt 1 -or $hashParts[0] -notmatch '^[a-fA-F0-9]{64}$') { throw 'SHA-256 文件格式无效。' }
$actualHash = (Get-FileHash -LiteralPath $resolvedBackup -Algorithm SHA256).Hash.ToLowerInvariant()
if ($hashParts[0].ToLowerInvariant() -ne $actualHash) { throw '备份 SHA-256 校验失败。' }
try {
    $expectedManifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    throw '备份清单不是有效 JSON。'
}
if ($expectedManifest.status -ne 'ok') { throw '备份清单未标记为可恢复。' }

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

$memberInspectionCode = @'
import json
import sys
import tarfile
with tarfile.open('/backup/' + sys.argv[1], 'r:gz') as archive:
    print(json.dumps([
        {
            'name': member.name,
            'is_link': member.issym() or member.islnk(),
            'is_supported': member.isfile() or member.isdir(),
        }
        for member in archive.getmembers()
    ]))
'@
$encodedInspection = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($memberInspectionCode))
$inspectionCommand = "import base64;exec(base64.b64decode('$encodedInspection'))"
$inspectionLines = @(& docker run --rm -v "${archiveDirectory}:/backup:ro" $BackendImage python -c $inspectionCommand $archiveLeaf)
Assert-NativeSuccess '无法读取备份归档原始目录。'
try {
    $members = ($inspectionLines -join [Environment]::NewLine) | ConvertFrom-Json
} catch {
    throw '备份归档原始目录不是有效 JSON。'
}
foreach ($entry in @($members)) {
    $member = ([string]$entry.name).Trim().Replace('\', '/')
    if (-not $member) { throw '备份包含空路径。' }
    if ($member.StartsWith('/') -or $member -match '^[A-Za-z]:') { throw '备份包含不安全路径。' }
    $segments = @($member.Split('/') | Where-Object { $_ -and $_ -ne '.' })
    if ($segments -contains '..') { throw '备份包含不安全路径。' }
    if ($entry.is_link) { throw '备份包含不允许的链接条目。' }
    if (-not $entry.is_supported) { throw '备份包含不支持的条目类型。' }
    foreach ($forbidden in @('.env', 'runtime-secret.key', 'runtime-secrets.json')) {
        if ($segments -contains $forbidden) { throw "备份包含不允许的 $forbidden。" }
    }
}

try {
    $stagingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) "energy-copilot-restore-stage-$([Guid]::NewGuid().ToString('N'))"
    Assert-SafeStagingDirectory $stagingDirectory
    New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
    & docker run --rm -v "${archiveDirectory}:/backup:ro" -v "${stagingDirectory}:/staged" $archiveImage tar -xzf "/backup/$archiveLeaf" -C /staged
    Assert-NativeSuccess '备份无法安全解压到暂存目录。'
    $stagedManifest = Get-ValidatedManifest 'Directory' $stagingDirectory $BackendImage '暂存备份'
    Assert-ManifestMatch $stagedManifest $expectedManifest '暂存备份'

    $recoveryArchive = Get-UniqueRecoveryPath $archiveDirectory
    Write-Host "准备恢复的备份：$resolvedBackup"
    if ($Standard) {
        Write-Host "恢复目标：Docker 数据卷 $productionVolume"
    } else {
        Write-Host "恢复目标：$resolvedDataDirectory"
    }
    Write-Host "计划的恢复前快照：$recoveryArchive"

    if (-not $ConfirmRestore) {
        $providedConfirmation = $ConfirmationText
        if (-not $PSBoundParameters.ContainsKey('ConfirmationText')) {
            $providedConfirmation = Read-Host "请输入备份文件名 $archiveLeaf 以确认恢复"
        }
        if ($providedConfirmation -cne $archiveLeaf) { throw '确认文字不匹配，恢复已取消。' }
    }

    if (-not $isGuardedTest) {
        $runningServices = @(& docker @composeArguments ps --status running -q 2>$null)
        $stackWasRunning = $runningServices.Count -gt 0
        & docker @composeArguments stop
        Assert-NativeSuccess '无法停止 Harness，恢复未开始。'
    }

    $recoveryLeaf = Split-Path -Leaf $recoveryArchive
    $recoveryTarArguments = @(
        'tar',
        '--exclude=./.env',
        '--exclude=./runtime-secret.key',
        '--exclude=./runtime-secrets.json',
        '--exclude=./backups',
        '--exclude=./cache',
        '--exclude=*.partial',
        '-czf', "/backup/$recoveryLeaf", '-C', '/data', '.'
    )
    if ($Standard) {
        & docker run --rm -v "${productionVolume}:/data:ro" -v "${archiveDirectory}:/backup" $archiveImage @recoveryTarArguments
    } else {
        & docker run --rm -v "${resolvedDataDirectory}:/data:ro" -v "${archiveDirectory}:/backup" $archiveImage @recoveryTarArguments
    }
    Assert-NativeSuccess '无法创建恢复前快照，目标数据未修改。'
    & docker run --rm -v "${archiveDirectory}:/backup:ro" $archiveImage tar -tzf "/backup/$recoveryLeaf" *> $null
    Assert-NativeSuccess '恢复前快照无法读取，目标数据未修改。'
    $recoveryHash = (Get-FileHash -LiteralPath $recoveryArchive -Algorithm SHA256).Hash.ToLowerInvariant()
    [System.IO.File]::WriteAllText(
        "$recoveryArchive.sha256",
        "$recoveryHash  $recoveryLeaf$([Environment]::NewLine)",
        (New-Object System.Text.UTF8Encoding($false))
    )

    if ($Standard) {
        $replaceCommand = 'find /data -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + && cp -a /staged/. /data/'
        & docker run --rm -v "${productionVolume}:/data" -v "${stagingDirectory}:/staged:ro" $archiveImage sh -eu -c $replaceCommand
        Assert-NativeSuccess '替换数据卷失败。系统保持停止，请使用恢复前快照人工恢复。'
        $restoredManifest = Get-ValidatedManifest 'Volume' $productionVolume $BackendImage '恢复后的数据卷'
    } else {
        foreach ($child in @(Get-ChildItem -LiteralPath $resolvedDataDirectory -Force)) {
            Remove-Item -LiteralPath $child.FullName -Recurse -Force
        }
        foreach ($child in @(Get-ChildItem -LiteralPath $stagingDirectory -Force)) {
            Copy-Item -LiteralPath $child.FullName -Destination $resolvedDataDirectory -Recurse -Force
        }
        $restoredManifest = Get-ValidatedManifest 'Directory' $resolvedDataDirectory $BackendImage '恢复后的数据目录'
    }
    Assert-ManifestMatch $restoredManifest $expectedManifest '恢复目标'
    $restoreSucceeded = $true

    if ($stackWasRunning -and -not $NoRestart) {
        & docker @composeArguments start
        Assert-NativeSuccess '数据已恢复，但 Harness 未能重新启动，请运行 .\start.ps1。'
    }
    Write-Host '恢复已完成并通过完整性校验。' -ForegroundColor Green
    Write-Host "恢复前快照：$recoveryArchive"
}
finally {
    if ($stagingDirectory -and (Test-Path -LiteralPath $stagingDirectory)) {
        Assert-SafeStagingDirectory $stagingDirectory
        Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
    }
    if (-not $restoreSucceeded -and $recoveryArchive -and (Test-Path -LiteralPath $recoveryArchive)) {
        Write-Warning "恢复未完成。Harness 保持停止；恢复前快照：$recoveryArchive"
    }
}
