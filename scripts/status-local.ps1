$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-runtime.ps1')
if (!(Test-Path -LiteralPath $processFile)) { Write-Output 'No managed local services found.'; exit 1 }
$saved = Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
foreach ($name in @('backend', 'frontend')) {
    $owned = Get-OwnedProcess $saved.$name
    if (!$owned) { throw "Managed $name is not running." }
    Write-Output "$name process verified (PID $($owned.Id))."
}
Assert-LocalHealth
Write-Output 'Both services healthy: http://localhost:3000'
