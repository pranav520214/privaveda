# PRIVAVEDA Verification Runner for Windows PowerShell
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "Running PRIVAVEDA Automated Verification Suite..." -ForegroundColor Cyan
& "$RootDir\.venv\Scripts\python.exe" "$ScriptDir\verify.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Verification suite failed."
    exit $LASTEXITCODE
}
Write-Host "Verification completed successfully." -ForegroundColor Green
