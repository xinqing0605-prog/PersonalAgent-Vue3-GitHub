param([string]$OutputDir = '', [string]$WorkDir = '', [string]$PythonPath = '', [switch]$SkipFrontendBuild)
$ErrorActionPreference = 'Stop'
$ProjectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$Python = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
if ($PythonPath) { $Python = $PythonPath }
if (-not $OutputDir) { $OutputDir = Join-Path $ProjectRoot 'dist' }
if (-not $WorkDir) { $WorkDir = Join-Path $ProjectRoot 'build' }
function ProjectChild([string]$path) {
    $full = [IO.Path]::GetFullPath($path)
    $projectPrefix = $ProjectRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $full.StartsWith($projectPrefix,[StringComparison]::OrdinalIgnoreCase)) { throw "打包路径必须位于项目目录内：$full" }
    return $full
}
$Dist = ProjectChild $OutputDir
$Build = ProjectChild $WorkDir
$Package = ProjectChild (Join-Path $Dist 'PersonalAgent')
$BuildPackage = ProjectChild (Join-Path $Build 'PersonalAgent')
$PackageExe = Join-Path $Package 'PersonalAgent.exe'
$running = @(Get-Process PersonalAgent -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $PackageExe })
if ($running.Count) { throw '目标桌面程序仍在运行；请从托盘退出，或指定临时 OutputDir 后再安装。' }
if (-not (Test-Path -LiteralPath $Python)) { throw "找不到 Python：$Python" }
& $Python -B -c 'import PIL, PyInstaller, pystray, webview'
if ($LASTEXITCODE -ne 0) { throw '缺少桌面打包依赖。' }
if (-not $SkipFrontendBuild) {
    Push-Location (Join-Path $ProjectRoot 'frontend-vue')
    try {
        & npm.cmd ci --cache (Join-Path $ProjectRoot 'work\npm-cache')
        if ($LASTEXITCODE -ne 0) { throw '前端依赖安装失败。' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Vue 前端构建失败。' }
    } finally { Pop-Location }
}
$FrontendDist = Join-Path $ProjectRoot 'frontend-vue\dist'
if (-not (Test-Path -LiteralPath (Join-Path $FrontendDist 'index.html'))) { throw '请先构建 Vue 前端。' }

foreach ($target in @($Package,$BuildPackage)) {
    if (Test-Path -LiteralPath $target) {
        if ((Get-Item -LiteralPath $target -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw '不清理链接目录' }
        Remove-Item -LiteralPath $target -Recurse -Force
    }
}
New-Item -ItemType Directory -Path $Dist,$Build -Force | Out-Null
$env:PYINSTALLER_CONFIG_DIR = Join-Path $Build 'pyinstaller-cache'
$env:TEMP = Join-Path $Build 'tmp'
$env:TMP = $env:TEMP
$env:PYTHONDONTWRITEBYTECODE = '1'
New-Item -ItemType Directory -Path $env:TEMP -Force | Out-Null
& $Python -B -m PyInstaller --noconfirm --clean --log-level WARN --onedir --windowed `
    --name PersonalAgent --paths $ProjectRoot --workpath $Build --distpath $Dist --specpath $Build `
    --collect-all PIL --collect-all pystray --collect-all webview --hidden-import phonenumbers.data.region_CN `
    --add-data "$FrontendDist;frontend" (Join-Path $PSScriptRoot 'desktop_app.py')
if ($LASTEXITCODE -ne 0) { throw "打包失败：$LASTEXITCODE" }
$PackagedFrontend = Join-Path $Package '_internal\frontend\index.html'
if (-not (Test-Path -LiteralPath $PackageExe)) { throw '没有生成桌面 EXE' }
if ((Get-FileHash -LiteralPath $PackagedFrontend).Hash -ne (Get-FileHash -LiteralPath (Join-Path $FrontendDist 'index.html')).Hash) { throw '打包前端与源码不一致' }
$checkRoot = Join-Path $Build 'isolated-check'
$keys = @('AGENT_DESKTOP_DATA_DIR','AGENT_RUNTIME_DIR','AGENT_USER_DATA_ROOT','AUTH_DB_PATH','AGENT_LEGACY_USER_ID','APP_ENV','ALLOW_SHARED_MODEL_CREDENTIALS')
$previous = @{}
foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key,'Process') }
try {
    $env:AGENT_DESKTOP_DATA_DIR=$checkRoot
    $env:AGENT_RUNTIME_DIR=Join-Path $checkRoot '.runtime'
    $env:AGENT_USER_DATA_ROOT=Join-Path $checkRoot 'users'
    $env:AUTH_DB_PATH=Join-Path $checkRoot 'auth.db'
    $env:AGENT_LEGACY_USER_ID='0'
    $env:APP_ENV='test'
    $env:ALLOW_SHARED_MODEL_CREDENTIALS='false'
    $process = Start-Process -FilePath $PackageExe -ArgumentList '--server-check','--port','18881' -PassThru -WindowStyle Hidden
    if (-not $process.WaitForExit(30000)) { $process.Kill(); throw '隔离启动检查超时' }
    if ($process.ExitCode -ne 0) { throw "隔离启动失败：$($process.ExitCode)" }
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key,$previous[$key],'Process') }
}
Write-Output "打包与隔离启动检查通过：$PackageExe"
