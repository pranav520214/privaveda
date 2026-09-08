$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    & .venv\Scripts\python.exe -m PyInstaller --noconfirm --clean --onedir --windowed --name PersonalizedMedicineAI --distpath desktop/dist --workpath desktop/build --specpath desktop --paths backend --paths desktop --add-data "$projectRoot/data;data" --add-data "$projectRoot/backend/migrations;backend/migrations" --collect-submodules app --hidden-import alembic --hidden-import passlib.handlers.argon2 --hidden-import sqlalchemy.dialects.sqlite --exclude-module torch --exclude-module transformers --exclude-module PySide6.QtWebEngineWidgets --exclude-module PySide6.QtWebEngineCore desktop/main.py
    if ($LASTEXITCODE -ne 0) { throw 'Desktop build failed' }
    $destination = Join-Path $PSScriptRoot 'dist/PersonalizedMedicineAI'
    # Qt 6.11 uses Windows' ICU API. A Poppler runtime on PATH can make PyInstaller
    # collect a different ICU ABI under the same filename. Use the OS DLL.
    $resolvedDestination = (Resolve-Path -LiteralPath $destination).Path
    foreach ($name in @('icuuc.dll','icudt78.dll')) {
        $wrongIcu = Join-Path $resolvedDestination "_internal/$name"
        if (Test-Path -LiteralPath $wrongIcu) {
            $resolvedIcu = (Resolve-Path -LiteralPath $wrongIcu).Path
            if (-not $resolvedIcu.StartsWith($resolvedDestination + [IO.Path]::DirectorySeparatorChar)) { throw 'Unexpected ICU target' }
            Remove-Item -LiteralPath $resolvedIcu
        }
    }
    New-Item -ItemType Directory -Force -Path (Join-Path $destination 'resources') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $destination 'resources/model') | Out-Null
    foreach ($name in @('medical-1.5b-q4.gguf','manifest.json','MODEL_CARD.md')) {
        Copy-Item -LiteralPath (Join-Path $projectRoot ".assets/model/$name") -Destination (Join-Path $destination 'resources/model') -Force
    }
    foreach ($name in @('runtime','references.sqlite','references-manifest.json')) {
        $source = Join-Path $projectRoot ".assets/$name"
        if (-not (Test-Path -LiteralPath $source)) { throw "Required asset missing: $name" }
        Copy-Item -LiteralPath $source -Destination (Join-Path $destination 'resources') -Recurse -Force
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'THIRD_PARTY_NOTICES.md') -Destination $destination -Force
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README.md') -Destination $destination -Force
    & .venv\Scripts\python.exe scripts/desktop-licenses.py $destination
    if ($LASTEXITCODE -ne 0) { throw 'License collection failed' }
    Write-Output "Desktop application built: $destination/PersonalizedMedicineAI.exe"
} finally { Pop-Location }
