$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$runtimePath = Join-Path $projectRoot '.local'
$processFile = Join-Path $runtimePath 'processes.json'

function Get-ProcessRecord($Process) {
    return @{ id = $Process.Id; started = $Process.StartTime.ToUniversalTime().ToString('o'); executable = $Process.Path }
}

function Get-OwnedProcess($Record) {
    if (!$Record -or !$Record.id -or !$Record.started -or !$Record.executable) { return $null }
    $candidate = Get-Process -Id $Record.id -ErrorAction SilentlyContinue
    if (!$candidate) { return $null }
    if ($candidate.StartTime.ToUniversalTime().Ticks -ne ([DateTime]$Record.started).ToUniversalTime().Ticks -or $candidate.Path -ne $Record.executable) { return $null }
    $command = (Get-CimInstance Win32_Process -Filter "ProcessId = $($candidate.Id)").CommandLine
    if (!$command -or $command.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -lt 0) { return $null }
    return $candidate
}

function Stop-OwnedProcess($Process) {
    # Windows virtualenv launchers have a Python child; stop only project-scoped children.
    foreach ($child in @(Get-CimInstance Win32_Process -Filter "ParentProcessId = $($Process.Id)")) {
        if ($child.CommandLine -and $child.CommandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            $childProcess = Get-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
            if ($childProcess) { Stop-OwnedProcess $childProcess }
        }
    }
    if (Get-Process -Id $Process.Id -ErrorAction SilentlyContinue) { Stop-Process -Id $Process.Id }
}

function Assert-LocalHealth {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 2
    if ($health.status -ne 'ok' -or $health.prototype -ne $true) { throw 'Backend health check failed' }
    $page = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 2
    if ($page.StatusCode -ne 200 -or $page.Content -notmatch 'Personalized Medicine AI') { throw 'Frontend health check failed' }
}
