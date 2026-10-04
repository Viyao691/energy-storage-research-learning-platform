$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
    python -m venv (Join-Path $PSScriptRoot '.venv')
}

& $python -m pip install --disable-pip-version-check -r (Join-Path $PSScriptRoot 'requirements-build.txt')
& $python -m PyInstaller --noconfirm --clean --onefile --noconsole --name '📚 储能科研AI助手' --distpath $root --workpath (Join-Path $PSScriptRoot 'build') --specpath $PSScriptRoot (Join-Path $PSScriptRoot 'desktop_launcher.py')
Write-Host "已生成：$(Join-Path $root '📚 储能科研AI助手.exe')" -ForegroundColor Green
