$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$PythonWindowed = Join-Path $ProjectRoot ".venv\Scripts\pythonw.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    throw "未找到项目虚拟环境：$Python。请先按 README 安装 backend/requirements.txt。"
}

if (-not (Test-Path -LiteralPath $PythonWindowed)) {
    throw "未找到无控制台启动器：$PythonWindowed"
}

Push-Location (Join-Path $ProjectRoot 'frontend-vue')
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        & npm.cmd ci --cache (Join-Path $ProjectRoot 'work\npm-cache')
        if ($LASTEXITCODE -ne 0) { throw '前端依赖安装失败。' }
    }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Vue 前端构建失败。' }
} finally { Pop-Location }
Start-Process -WindowStyle Hidden -FilePath $PythonWindowed -WorkingDirectory $ProjectRoot -ArgumentList @('-B',('"{0}"' -f (Join-Path $PSScriptRoot 'desktop_app.py')))
