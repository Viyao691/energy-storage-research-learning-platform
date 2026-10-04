$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$temp = Join-Path $PSScriptRoot 'iexpress-temp'
$cmdFile = Join-Path $temp 'launch.cmd'
$sedFile = Join-Path $temp 'launcher.sed'
$asciiExe = Join-Path $root 'Energy Research Copilot Launcher.exe'
$unicodeName = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('8J+TmiDlgqjog73np5HnoJRBSeWKqeaJiy5leGU='))
$exe = Join-Path $root $unicodeName
New-Item -ItemType Directory -Force -Path $temp | Out-Null
if (Test-Path $asciiExe) { Remove-Item -LiteralPath $asciiExe -Force }

@"
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$root\start.ps1"
"@ | Set-Content -Path $cmdFile -Encoding Ascii

@"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=$asciiExe
FriendlyName=Energy Research Copilot Launcher
AppLaunched=launch.cmd
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles
[Strings]
FILE0="launch.cmd"
[SourceFiles]
SourceFiles0=$temp\
[SourceFiles0]
%FILE0%=
"@ | Set-Content -Path $sedFile -Encoding Ascii

& "$env:SystemRoot\System32\iexpress.exe" /N $sedFile
$deadline = (Get-Date).AddSeconds(20)
while (-not (Test-Path $asciiExe) -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 250 }
if (-not (Test-Path $asciiExe)) { throw 'IExpress failed to generate the launcher.' }
Move-Item -LiteralPath $asciiExe -Destination $exe -Force
Write-Host "Generated: $exe" -ForegroundColor Green
