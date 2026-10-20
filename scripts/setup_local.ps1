param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
$env:PYTHONUTF8 = "1"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $venvPython)) {
    python -m venv (Join-Path $projectRoot ".venv")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $SkipInstall) {
    & $venvPython -m pip install --upgrade pip
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & $venvPython -m pip install -r (Join-Path $projectRoot "backend\requirements.txt")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$localEnv = Join-Path $projectRoot ".env.local"
if (-not (Test-Path -LiteralPath $localEnv)) {
    $legacyEnv = Join-Path $projectRoot ".env"
    if (Test-Path -LiteralPath $legacyEnv) {
        Write-Host "Existing .env detected. It will remain in use; .env.local was not created."
    }
    else {
        Copy-Item -LiteralPath (Join-Path $projectRoot ".env.local.example") -Destination $localEnv
        Write-Host "Created .env.local. Keep local secrets out of version control."
    }
}

Write-Host "Local environment is ready. Run scripts\run_vue.ps1 to build and start the Vue application."
