param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
$env:PYTHONUTF8 = "1"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
    throw ".venv not found. Install production dependencies first."
}

$env:APP_ENV = "production"
$env:AGENT_ROOT_DIR = $projectRoot
$env:APP_PORT = [string]$Port

Push-Location $projectRoot
try {
    & $venvPython -B scripts\check_environment.py
    if ($LASTEXITCODE -ne 0) {
        throw "Production environment validation failed. Service was not started."
    }
    & $venvPython -B -m uvicorn backend.app.main:app --host 0.0.0.0 --port $Port --workers 1
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
