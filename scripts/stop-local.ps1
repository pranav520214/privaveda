$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-runtime.ps1')
if (!(Test-Path -LiteralPath $processFile)) { Write-Output 'No managed local services found.'; exit 0 }
$saved = Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
foreach ($name in @('frontend', 'backend')) {
    $owned = Get-OwnedProcess $saved.$name
    if ($owned) { Stop-OwnedProcess $owned; Write-Output "Stopped managed $name." }
    else { Write-Output "No matching managed $name process; nothing stopped." }
}
Remove-Item -LiteralPath $processFile
