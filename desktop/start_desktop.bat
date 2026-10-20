@echo off
setlocal
set "PROJECT_ROOT=%~dp0.."
start "" /b "%PROJECT_ROOT%\.venv\Scripts\pythonw.exe" "%~dp0desktop_app.py"
exit /b 0
