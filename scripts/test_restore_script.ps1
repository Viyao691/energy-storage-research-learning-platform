param([string]$BackendImage)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backupScript = Join-Path $projectRoot 'backup.ps1'
$restoreScript = Join-Path $projectRoot 'restore.ps1'
$archiveImage = 'alpine@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b'
$backupRoot = Join-Path ([System.IO.Path]::GetTempPath()) "energy-copilot-backup-test-$([Guid]::NewGuid().ToString('N'))"
$restoreRoot = Join-Path ([System.IO.Path]::GetTempPath()) "energy-copilot-restore-test-$([Guid]::NewGuid().ToString('N'))"
$sourceDirectory = Join-Path $backupRoot 'source'
$archiveDirectory = Join-Path $backupRoot 'archives'
$targetDirectory = Join-Path $restoreRoot 'target'

function Assert-NativeSuccess([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Assert-SafeTestRoot([string]$Path, [string]$Pattern) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $temporary = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($temporary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to use a restore test directory outside the system temp directory.'
    }
    if ((Split-Path -Leaf $resolved) -notmatch $Pattern) {
        throw 'Refusing to use an unexpected restore test directory.'
    }
}

function Initialize-DataDirectory(
    [string]$Directory,
    [string]$Revision,
    [string]$PaperName,
    [string]$PaperBody,
    [bool]$WithSentinel
) {
    New-Item -ItemType Directory -Force -Path $Directory | Out-Null
    $sentinelCode = if ($WithSentinel) {
        @'
(root / 'sentinel.txt').write_text('keep-target', encoding='utf-8')
(root / '.env').write_text('DUMMY_SECRET=not-real', encoding='utf-8')
(root / 'runtime-secret.key').write_text('not-real', encoding='utf-8')
(root / 'runtime-secrets.json').write_text('{}', encoding='utf-8')
'@
    } else { '' }
    $fixtureCode = @"
from pathlib import Path
import sqlite3
root = Path('/app/data')
(root / 'papers').mkdir(parents=True, exist_ok=True)
(root / 'papers' / '$PaperName').write_bytes(b'%PDF-1.4\n$PaperBody\n')
$sentinelCode
with sqlite3.connect(root / 'energy_copilot.db') as connection:
    connection.execute('CREATE TABLE alembic_version (version_num TEXT NOT NULL)')
    connection.execute('INSERT INTO alembic_version (version_num) VALUES (?)', ('$Revision',))
    connection.execute('CREATE TABLE papers (id INTEGER PRIMARY KEY, file_path TEXT)')
    connection.execute('INSERT INTO papers (id, file_path) VALUES (?, ?)', (1, '/app/data/papers/$PaperName'))
"@
    $fixtureCode | & docker run -i --rm -v "${Directory}:/app/data" $BackendImage python -
    Assert-NativeSuccess 'Failed to initialize disposable restore data.'
}

function Get-SentinelHash {
    if (-not (Test-Path -LiteralPath (Join-Path $targetDirectory 'sentinel.txt') -PathType Leaf)) {
        throw 'Target sentinel is missing.'
    }
    return (Get-FileHash -LiteralPath (Join-Path $targetDirectory 'sentinel.txt') -Algorithm SHA256).Hash
}

function Write-Sidecars([string]$ArchivePath, [string]$ManifestSource) {
    Copy-Item -LiteralPath $ManifestSource -Destination "$ArchivePath.manifest.json"
    $hash = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    $leaf = Split-Path -Leaf $ArchivePath
    [System.IO.File]::WriteAllText(
        "$ArchivePath.sha256",
        "$hash  $leaf$([Environment]::NewLine)",
        (New-Object System.Text.UTF8Encoding($false))
    )
}

function Assert-RestoreRejectedWithoutTargetChange(
    [string]$ArchivePath,
    [string]$ExpectedMessage = '',
    [string]$ConfirmationText = ''
) {
    $before = Get-SentinelHash
    $rejected = $false
    try {
        $arguments = @{
            BackupFile = $ArchivePath
            DataDirectory = $targetDirectory
            BackendImage = $BackendImage
            ConfirmRestore = $true
            NoRestart = $true
        }
        if ($ConfirmationText) {
            $arguments.Remove('ConfirmRestore')
            $arguments.ConfirmationText = $ConfirmationText
        }
        & $restoreScript @arguments
    }
    catch {
        $rejected = $true
        if ($ExpectedMessage -and $_.Exception.Message -notmatch [regex]::Escape($ExpectedMessage)) {
            throw "Restore rejected for the wrong reason: $($_.Exception.Message)"
        }
    }
    if (-not $rejected) { throw "Restore unexpectedly accepted $ArchivePath" }
    $after = Get-SentinelHash
    if ($before -ne $after) { throw 'Rejected restore changed the target directory.' }
}

Assert-SafeTestRoot $backupRoot '^energy-copilot-backup-test-[a-f0-9]+$'
Assert-SafeTestRoot $restoreRoot '^energy-copilot-restore-test-[a-f0-9]+$'
$tokens = $null
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($restoreScript, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) { throw "restore.ps1 has syntax errors: $($parseErrors[0].Message)" }
$parameterNames = @($ast.ParamBlock.Parameters | ForEach-Object { $_.Name.VariablePath.UserPath })
foreach ($requiredParameter in @('BackupFile', 'DataDirectory', 'BackendImage', 'ConfirmRestore', 'ConfirmationText', 'NoRestart', 'Standard')) {
    if ($parameterNames -notcontains $requiredParameter) {
        throw "restore.ps1 does not expose required parameter: $requiredParameter"
    }
}

try {
    if (-not $BackendImage) {
        $BackendImage = (& docker inspect energy-research-copilot-deepseek-harness-2026-08-21-backend-1 --format '{{.Image}}').Trim()
        Assert-NativeSuccess 'Failed to resolve the running Harness backend image.'
    }
    & docker image inspect $BackendImage *> $null
    Assert-NativeSuccess 'Harness backend test image is unavailable.'
    New-Item -ItemType Directory -Force -Path $archiveDirectory | Out-Null
    Initialize-DataDirectory $sourceDirectory '0022' 'source.pdf' 'source-paper' $false
    Initialize-DataDirectory $targetDirectory '0021' 'old.pdf' 'old-paper' $true

    & $backupScript -DataDirectory $sourceDirectory -OutputDirectory $archiveDirectory -BackendImage $BackendImage -NoRestart | Out-Host
    $validArchive = Get-ChildItem -LiteralPath $archiveDirectory -Filter '*.tar.gz' -File | Select-Object -First 1
    if ($null -eq $validArchive) { throw 'Valid source archive was not created.' }
    $validManifest = "$($validArchive.FullName).manifest.json"

    $tamperedArchive = Join-Path $archiveDirectory 'tampered.tar.gz'
    Copy-Item -LiteralPath $validArchive.FullName -Destination $tamperedArchive
    [System.IO.File]::AppendAllText($tamperedArchive, 'tamper')
    Copy-Item -LiteralPath $validManifest -Destination "$tamperedArchive.manifest.json"
    $originalHash = (Get-FileHash -LiteralPath $validArchive.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    [System.IO.File]::WriteAllText("$tamperedArchive.sha256", "$originalHash  tampered.tar.gz`n", (New-Object System.Text.UTF8Encoding($false)))
    Assert-RestoreRejectedWithoutTargetChange $tamperedArchive 'SHA-256'

    $pathTraversalArchive = Join-Path $archiveDirectory 'path-traversal.tar.gz'
    $pathTraversalCode = @'
import io, tarfile
with tarfile.open('/out/path-traversal.tar.gz', 'w:gz') as archive:
    payload = b'escape'
    member = tarfile.TarInfo('../escape.txt')
    member.size = len(payload)
    archive.addfile(member, io.BytesIO(payload))
'@
    $pathTraversalCode | & docker run -i --rm -v "${archiveDirectory}:/out" $BackendImage python -
    Assert-NativeSuccess 'Failed to create path traversal fixture.'
    Write-Sidecars $pathTraversalArchive $validManifest
    Assert-RestoreRejectedWithoutTargetChange $pathTraversalArchive '路径'

    $linkArchive = Join-Path $archiveDirectory 'contains-link.tar.gz'
    $linkCode = @'
import tarfile
with tarfile.open('/out/contains-link.tar.gz', 'w:gz') as archive:
    member = tarfile.TarInfo('papers/link.pdf')
    member.type = tarfile.SYMTYPE
    member.linkname = '../energy_copilot.db'
    archive.addfile(member)
'@
    $linkCode | & docker run -i --rm -v "${archiveDirectory}:/out" $BackendImage python -
    Assert-NativeSuccess 'Failed to create link fixture.'
    Write-Sidecars $linkArchive $validManifest
    Assert-RestoreRejectedWithoutTargetChange $linkArchive '链接'

    $corruptDatabaseArchive = Join-Path $archiveDirectory 'corrupt-database.tar.gz'
    $corruptCode = @'
import io, tarfile
with tarfile.open('/out/corrupt-database.tar.gz', 'w:gz') as archive:
    payload = b'not-a-sqlite-database'
    member = tarfile.TarInfo('energy_copilot.db')
    member.size = len(payload)
    archive.addfile(member, io.BytesIO(payload))
'@
    $corruptCode | & docker run -i --rm -v "${archiveDirectory}:/out" $BackendImage python -
    Assert-NativeSuccess 'Failed to create corrupt database fixture.'
    Write-Sidecars $corruptDatabaseArchive $validManifest
    Assert-RestoreRejectedWithoutTargetChange $corruptDatabaseArchive '完整性'

    $missingPaperArchive = Join-Path $archiveDirectory 'missing-paper.tar.gz'
    $missingPaperCode = @'
import tarfile
with tarfile.open('/out/missing-paper.tar.gz', 'w:gz') as archive:
    archive.add('/source/energy_copilot.db', arcname='energy_copilot.db')
'@
    $missingPaperCode | & docker run -i --rm -v "${archiveDirectory}:/out" -v "${sourceDirectory}:/source:ro" $BackendImage python -
    Assert-NativeSuccess 'Failed to create missing paper fixture.'
    Write-Sidecars $missingPaperArchive $validManifest
    Assert-RestoreRejectedWithoutTargetChange $missingPaperArchive '论文文件不完整'

    $missingManifestArchive = Join-Path $archiveDirectory 'missing-manifest.tar.gz'
    Copy-Item -LiteralPath $validArchive.FullName -Destination $missingManifestArchive
    $missingHash = (Get-FileHash -LiteralPath $missingManifestArchive -Algorithm SHA256).Hash.ToLowerInvariant()
    [System.IO.File]::WriteAllText("$missingManifestArchive.sha256", "$missingHash  missing-manifest.tar.gz`n", (New-Object System.Text.UTF8Encoding($false)))
    Assert-RestoreRejectedWithoutTargetChange $missingManifestArchive '清单'

    Assert-RestoreRejectedWithoutTargetChange $validArchive.FullName '确认文字不匹配' 'wrong-name'

    $restoreOutput = @(& $restoreScript -BackupFile $validArchive.FullName -DataDirectory $targetDirectory -BackendImage $BackendImage -ConfirmRestore -NoRestart *>&1)
    $restoreOutput | Out-Host
    $outputText = @($restoreOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
    if ($outputText -notmatch '计划的恢复前快照') { throw 'Restore did not print the planned recovery archive.' }
    if (Test-Path -LiteralPath (Join-Path $targetDirectory 'sentinel.txt')) { throw 'Successful restore did not replace the target.' }
    if (-not (Test-Path -LiteralPath (Join-Path $targetDirectory 'papers\source.pdf') -PathType Leaf)) { throw 'Successful restore did not copy the source paper.' }

    $targetManifestLines = @(& docker run --rm -v "${targetDirectory}:/app/data:ro" $BackendImage python -m app.backup_validation --data-root /app/data)
    Assert-NativeSuccess 'Restored target validation failed.'
    $targetManifest = ($targetManifestLines -join [Environment]::NewLine) | ConvertFrom-Json
    $sourceManifest = Get-Content -LiteralPath $validManifest -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($targetManifest.database.sha256 -ne $sourceManifest.database.sha256) { throw 'Restored database hash mismatch.' }
    $recoveryArchives = @(Get-ChildItem -LiteralPath $archiveDirectory -Filter 'recovery-before-restore-*.tar.gz' -File)
    if ($recoveryArchives.Count -ne 1) { throw 'Restore did not retain exactly one recovery archive.' }
    $recoveryMembers = @(& docker run --rm -v "${archiveDirectory}:/backup:ro" $archiveImage tar -tzf "/backup/$($recoveryArchives[0].Name)")
    Assert-NativeSuccess 'Recovery archive listing failed.'
    $recoveryText = $recoveryMembers -join "`n"
    foreach ($forbidden in @('.env', 'runtime-secret.key', 'runtime-secrets.json')) {
        if ($recoveryText -match [regex]::Escape($forbidden)) { throw "Recovery archive contains $forbidden" }
    }
    Write-Host 'Harness restore integration tests passed.' -ForegroundColor Green
}
finally {
    foreach ($item in @(
        @{ Path = $backupRoot; Pattern = '^energy-copilot-backup-test-[a-f0-9]+$' },
        @{ Path = $restoreRoot; Pattern = '^energy-copilot-restore-test-[a-f0-9]+$' }
    )) {
        if (Test-Path -LiteralPath $item.Path) {
            Assert-SafeTestRoot $item.Path $item.Pattern
            Remove-Item -LiteralPath $item.Path -Recurse -Force
        }
    }
}
