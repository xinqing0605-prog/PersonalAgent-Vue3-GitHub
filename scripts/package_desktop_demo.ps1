param([string]$OutputDir = '', [string]$WorkDir = '', [string]$PythonPath = '', [switch]$SkipFrontendBuild)
$ErrorActionPreference = 'Stop'
$ProjectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Python = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
if ($PythonPath) { $Python = [IO.Path]::GetFullPath($PythonPath) }
if (-not (Test-Path -LiteralPath $Python)) { throw "找不到 Python：$Python。请先安装桌面打包依赖，或指定 PythonPath。" }
if (-not $OutputDir) { $OutputDir = Join-Path $ProjectRoot 'work\desktop-demo-stage' }
if (-not $WorkDir) { $WorkDir = Join-Path $ProjectRoot 'work\desktop-demo-build' }
function ProjectChild([string]$path) {
    $full = [IO.Path]::GetFullPath($path)
    $prefix = $ProjectRoot.TrimEnd('\') + '\'
    if (-not $full.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw '打包路径必须在项目内' }
    $cursor = $full
    while ($cursor -and $cursor -ne $ProjectRoot) {
        if ((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw '打包路径不能经过链接目录' }
        $cursor = Split-Path -Parent $cursor
    }
    return $full
}
$OutputDir = ProjectChild $OutputDir
$WorkDir = ProjectChild $WorkDir
if (Test-Path -LiteralPath $OutputDir) { throw "暂存目录已存在，请指定新的空目录，避免覆盖曾使用的演示数据：$OutputDir" }
$buildArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $ProjectRoot 'desktop\build.ps1'),'-OutputDir',$OutputDir,'-WorkDir',$WorkDir,'-PythonPath',$Python)
if ($SkipFrontendBuild) { $buildArgs += '-SkipFrontendBuild' }
& powershell @buildArgs
if ($LASTEXITCODE -ne 0) { throw "桌面版打包失败：$LASTEXITCODE" }
$Launcher = @'
@echo off
setlocal
cd /d "%~dp0"
set "AGENT_DESKTOP_DATA_DIR=%~dp0desktop-data"
if "%~1"=="--server-check" if defined AGENT_DEMO_CHECK_ROOT set "AGENT_DESKTOP_DATA_DIR=%AGENT_DEMO_CHECK_ROOT%"
set "AGENT_ROOT_DIR=%AGENT_DESKTOP_DATA_DIR%"
set "AGENT_RUNTIME_DIR=%AGENT_DESKTOP_DATA_DIR%\data"
set "AUTH_DB_PATH=%AGENT_RUNTIME_DIR%\auth.db"
set "AGENT_USER_DATA_ROOT=%AGENT_RUNTIME_DIR%\users"
set "AGENT_LEGACY_USER_ID=0"
set "APP_ENV=local"
set "APP_DEBUG=false"
set "ALLOW_KEY_REVEAL=false"
set "ALLOW_SHARED_MODEL_CREDENTIALS=false"
set "SESSION_COOKIE_SECURE=false"
set "SMS_PROVIDER=disabled"
set "SMS_DEV_MODE=false"
set "TEMP=%AGENT_DESKTOP_DATA_DIR%\temp"
set "TMP=%TEMP%"
if not exist "%TEMP%" mkdir "%TEMP%"
if "%~1"=="--server-check" (
    "%~dp0PersonalAgent\PersonalAgent.exe" --server-check --port 18882
    exit /b
)
start "" /D "%~dp0" "%~dp0PersonalAgent\PersonalAgent.exe"
endlocal
'@
$LauncherPath = Join-Path $OutputDir '启动演示版.cmd'
[IO.File]::WriteAllText($LauncherPath,($Launcher -replace '\r?\n',[Environment]::NewLine),[Text.Encoding]::ASCII)
Copy-Item -LiteralPath (Join-Path $ProjectRoot 'desktop\README.md') -Destination (Join-Path $OutputDir '使用说明.md')
$oldCheckRoot = $env:AGENT_DEMO_CHECK_ROOT
try {
    $env:AGENT_DEMO_CHECK_ROOT = Join-Path $WorkDir 'launcher-check'
    $proc = Start-Process -FilePath $env:ComSpec -ArgumentList ('/d /c ""{0}" --server-check"' -f $LauncherPath) -PassThru -WindowStyle Hidden
    if (-not $proc.WaitForExit(30000)) { $proc.Kill(); throw '启动器隔离检查超时' }
    if ($proc.ExitCode -ne 0) { throw "启动器隔离检查失败：$($proc.ExitCode)" }
    if (-not (Test-Path -LiteralPath (Join-Path $env:AGENT_DEMO_CHECK_ROOT 'data\auth.db'))) { throw '启动器未在预期位置创建数据库' }
} finally { $env:AGENT_DEMO_CHECK_ROOT = $oldCheckRoot }
$unexpected = @(Get-ChildItem -LiteralPath $OutputDir -Force | Where-Object { $_.Name -notin @('PersonalAgent','启动演示版.cmd','使用说明.md') })
if ($unexpected.Count) { throw '暂存目录出现额外文件，停止分发' }
$zipOutput = if ($env:DESKTOP_ZIP_OUTPUT) { $env:DESKTOP_ZIP_OUTPUT } else { Join-Path $ProjectRoot '交付\PersonalAgent-Windows-demo.zip' }
$env:DESKTOP_ZIP_OUTPUT = $zipOutput
& $Python -B (Join-Path $ProjectRoot 'scripts\zip_desktop.py') $OutputDir
if ($LASTEXITCODE -ne 0) { throw '桌面 ZIP 校验失败；保留暂存目录供排查' }
# ZIP content hashes were checked. Remove only this newly created staging copy.
$verifiedStage = ProjectChild $OutputDir
Remove-Item -LiteralPath $verifiedStage -Recurse -Force
Write-Output '已生成并校验：交付\PersonalAgent-Windows-demo.zip'
