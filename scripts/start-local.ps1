param([switch]$SkipInstall, [switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-runtime.ps1')
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'
$pythonPath = Join-Path $projectRoot '.venv\Scripts\python.exe'
New-Item -ItemType Directory -Force -Path $runtimePath | Out-Null
if (Test-Path -LiteralPath $processFile) {
    $saved = Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
    $existingBackend = Get-OwnedProcess $saved.backend
    $existingFrontend = Get-OwnedProcess $saved.frontend
    if ($existingBackend -and $existingFrontend) {
        Assert-LocalHealth
        Write-Output 'Already running: http://localhost:3000'
        exit 0
    }
    if ($existingBackend -or $existingFrontend) { throw 'One managed service is still running. Run scripts\stop-local.ps1, then start again.' }
}
foreach ($port in @(3000, 8000)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is occupied by another service. No processes were stopped." }
}
if (!(Test-Path -LiteralPath $pythonPath)) {
    if ($SkipInstall) { throw 'Virtual environment missing; omit -SkipInstall.' }
    python -m venv (Join-Path $projectRoot '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Virtual environment creation failed' }
}
if (!$SkipInstall) {
    & $pythonPath -m pip install -r (Join-Path $backendPath 'requirements.lock.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend installation failed' }
}
Push-Location $backendPath
try {
    & $pythonPath -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
    & $pythonPath -m app.seed
    if ($LASTEXITCODE -ne 0) { throw 'Demo seeding failed' }
} finally { Pop-Location }
Push-Location $frontendPath
try {
    $env:NEXT_TELEMETRY_DISABLED = '1'
    if (!$SkipInstall) {
        npm.cmd ci --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Frontend installation failed' }
    }
    if (!$SkipBuild) {
        npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }
    }
    if (!(Test-Path -LiteralPath '.next\standalone\server.js')) { throw 'Production build missing; omit -SkipBuild.' }
} finally { Pop-Location }
$backendProcess = $null
$frontendProcess = $null
try {
    $backendProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000','--no-access-log') -WorkingDirectory $backendPath -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimePath 'backend.log') -RedirectStandardError (Join-Path $runtimePath 'backend-error.log')
    $nextPath = Join-Path $frontendPath 'scripts\start-production.mjs'
    $frontendProcess = Start-Process -FilePath 'node.exe' -ArgumentList @(('"' + $nextPath + '"')) -WorkingDirectory $frontendPath -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimePath 'frontend.log') -RedirectStandardError (Join-Path $runtimePath 'frontend-error.log')
    $deadline = [DateTime]::UtcNow.AddSeconds(35)
    do {
        $backendProcess.Refresh(); $frontendProcess.Refresh()
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) { throw 'A service exited during startup. Inspect .local/*-error.log.' }
        try { Assert-LocalHealth; $ready = $true } catch { $ready = $false }
        if (!$ready) { Start-Sleep -Milliseconds 300 }
    } while (!$ready -and [DateTime]::UtcNow -lt $deadline)
    if (!$ready) { throw 'Services did not become healthy within 35 seconds. Inspect .local/*-error.log.' }
    @{ backend = (Get-ProcessRecord $backendProcess); frontend = (Get-ProcessRecord $frontendProcess) } | ConvertTo-Json | Set-Content -LiteralPath $processFile
} catch {
    foreach ($owned in @($frontendProcess, $backendProcess)) { if ($owned -and !$owned.HasExited) { Stop-OwnedProcess $owned } }
    throw
}
Write-Output 'Healthy website: http://localhost:3000'
Write-Output ('Private credentials: ' + (Join-Path $backendPath 'demo-credentials.txt'))
