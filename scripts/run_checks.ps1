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
$env:ALLOW_KEY_REVEAL = "false"
$env:ALLOW_SHARED_MODEL_CREDENTIALS = "false"

Push-Location $projectRoot
try {
    Push-Location (Join-Path $projectRoot 'frontend-vue')
    try {
        npm.cmd ci --cache (Join-Path $projectRoot 'work\npm-cache')
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        npm.cmd run typecheck
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        npm.cmd run build
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    } finally { Pop-Location }
    & $venvPython -B -m unittest discover -s tests -v
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & node scripts\test_chat_history.cjs
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
