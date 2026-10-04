@echo off
cd /d "%~dp0"
"%~dp0runtime\python\python.exe" "%~dp0portable_launcher.py"
if errorlevel 1 pause
