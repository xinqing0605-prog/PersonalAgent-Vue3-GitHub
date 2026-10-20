param(
    [int]$Port = 8001
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
$env:PYTHONUTF8 = "1"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
    throw ".venv not found. Run scripts\setup_local.ps1 first."
}

$testRoot = Join-Path $projectRoot ".runtime\test"
New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
$env:APP_ENV = "test"
$env:AGENT_ROOT_DIR = $projectRoot
$env:AGENT_RUNTIME_DIR = $testRoot
$env:AUTH_DB_PATH = (Join-Path $testRoot "auth.db")
$env:AGENT_USER_DATA_ROOT = (Join-Path $testRoot "users")
$env:AGENT_LEGACY_USER_ID = "0"
$env:APP_HOST = "127.0.0.1"
$env:APP_PORT = [string]$Port
$env:ALLOW_KEY_REVEAL = "false"

Push-Location $projectRoot
try {
    & $venvPython -B -m uvicorn backend.app.main:app --host 127.0.0.1 --port $Port
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
