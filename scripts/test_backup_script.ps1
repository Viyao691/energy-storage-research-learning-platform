param([string]$BackendImage)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backupScript = Join-Path $projectRoot 'backup.ps1'
$archiveImage = 'alpine@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b'
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) "energy-copilot-backup-test-$([Guid]::NewGuid().ToString('N'))"
$dataDirectory = Join-Path $testRoot 'data'
$outputDirectory = Join-Path $testRoot 'output'

function Assert-NativeSuccess([string]$Message) {
    if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Assert-SafeTestRoot([string]$Path) {
    $resolved = [System.IO.Path]::GetFullPath($Path)
    $temporary = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $resolved.StartsWith($temporary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to use a backup test directory outside the system temp directory.'
    }
    if ((Split-Path -Leaf $resolved) -notmatch '^energy-copilot-backup-test-[a-f0-9]+$') {
        throw 'Refusing to use an unexpected backup test directory.'
    }
}

Assert-SafeTestRoot $testRoot
$tokens = $null
$parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile($backupScript, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count -gt 0) { throw "backup.ps1 has syntax errors: $($parseErrors[0].Message)" }
$parameterNames = @($ast.ParamBlock.Parameters | ForEach-Object { $_.Name.VariablePath.UserPath })
foreach ($requiredParameter in @('DataDirectory', 'OutputDirectory', 'BackendImage', 'NoRestart', 'Standard')) {
    if ($parameterNames -notcontains $requiredParameter) {
        throw "backup.ps1 does not expose required parameter: $requiredParameter"
    }
}

try {
    New-Item -ItemType Directory -Force -Path (Join-Path $dataDirectory 'papers') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $dataDirectory 'backups') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $dataDirectory 'cache') | Out-Null
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

    if (-not $BackendImage) {
        $BackendImage = (& docker inspect energy-research-copilot-deepseek-harness-2026-08-21-backend-1 --format '{{.Image}}').Trim()
        Assert-NativeSuccess 'Failed to resolve the running Harness backend image.'
    }
    if (-not $BackendImage) { throw 'Harness backend image id is empty.' }

    $fixturePython = @'
import sqlite3
from pathlib import Path
root = Path('/data')
(root / 'papers' / 'sample.pdf').write_bytes(b'%PDF-1.4\nHarness backup fixture\n')
with sqlite3.connect(root / 'energy_copilot.db') as connection:
    connection.execute('CREATE TABLE alembic_version (version_num TEXT NOT NULL)')
    connection.execute('INSERT INTO alembic_version (version_num) VALUES (?)', ('0022',))
    connection.execute('CREATE TABLE papers (id INTEGER PRIMARY KEY, file_path TEXT)')
    connection.execute('INSERT INTO papers (id, file_path) VALUES (?, ?)', (1, '/app/data/papers/sample.pdf'))
'@
    & docker run --rm -v "${dataDirectory}:/data" $BackendImage python -c $fixturePython
    Assert-NativeSuccess 'Failed to create the disposable Harness backup fixture.'

    [System.IO.File]::WriteAllText((Join-Path $dataDirectory '.env'), 'must-not-be-archived')
    [System.IO.File]::WriteAllText((Join-Path $dataDirectory 'runtime-secret.key'), 'must-not-be-archived')
    [System.IO.File]::WriteAllText((Join-Path $dataDirectory 'runtime-secrets.json'), 'must-not-be-archived')
    [System.IO.File]::WriteAllText((Join-Path $dataDirectory 'backups\nested.tar.gz'), 'must-not-be-archived')
    [System.IO.File]::WriteAllText((Join-Path $dataDirectory 'cache\cached.bin'), 'must-not-be-archived')

    $arguments = @{
        DataDirectory = $dataDirectory
        OutputDirectory = $outputDirectory
        BackendImage = $BackendImage
        NoRestart = $true
    }
    & $backupScript @arguments | Out-Host
    & $backupScript @arguments | Out-Host

    $archives = @(Get-ChildItem -LiteralPath $outputDirectory -Filter '*.tar.gz' -File)
    if ($archives.Count -ne 2) { throw "Expected two collision-safe archives, found $($archives.Count)." }
    foreach ($archive in $archives) {
        $hashPath = "$($archive.FullName).sha256"
        $manifestPath = "$($archive.FullName).manifest.json"
        if (-not (Test-Path -LiteralPath $hashPath -PathType Leaf)) { throw 'archive sha256 missing' }
        if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw 'archive manifest missing' }
        $expectedHash = ((Get-Content -LiteralPath $hashPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
        $actualHash = (Get-FileHash -LiteralPath $archive.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($expectedHash -ne $actualHash) { throw 'archive sha256 mismatch' }
        $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($manifest.status -ne 'ok') { throw 'manifest status is not ok' }
        if ($manifest.database.alembic_version -ne '0022') { throw 'manifest migration version mismatch' }
        if ($manifest.papers.file_count -ne 1) { throw 'manifest paper count mismatch' }
        $members = @(& docker run --rm -v "${outputDirectory}:/backup:ro" $archiveImage tar -tzf "/backup/$($archive.Name)")
        Assert-NativeSuccess 'Backup archive listing failed.'
        $memberText = $members -join "`n"
        foreach ($required in @('./energy_copilot.db', './papers/sample.pdf')) {
            if ($memberText -notmatch [regex]::Escape($required)) { throw "archive member missing: $required" }
        }
        foreach ($forbidden in @('.env', 'runtime-secret.key', 'runtime-secrets.json', './backups/', './cache/')) {
            if ($memberText -match [regex]::Escape($forbidden)) { throw "forbidden archive member present: $forbidden" }
        }
    }
    Write-Host 'Harness backup script integration tests passed.' -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $testRoot) {
        Assert-SafeTestRoot $testRoot
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
}
