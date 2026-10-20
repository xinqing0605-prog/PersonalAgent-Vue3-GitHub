param([int]$Port = 8000)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '找不到 Node.js。' }
Push-Location (Join-Path $root 'frontend-vue')
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        npm.cmd ci --cache (Join-Path $root 'work\npm-cache')
        if ($LASTEXITCODE -ne 0) { throw '前端依赖安装失败。' }
    }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Vue 前端构建失败。' }
} finally { Pop-Location }
$env:APP_ENV='local'; $env:AGENT_ROOT_DIR=$root; $env:APP_HOST='127.0.0.1'; $env:APP_PORT=[string]$Port
$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { $python = (Get-Command python).Source }
Push-Location $root
try { & $python -B -m uvicorn backend.app.main:app --host 127.0.0.1 --port $Port --reload; exit $LASTEXITCODE } finally { Pop-Location }
