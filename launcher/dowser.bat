@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/"
pushd "%ROOT%" >nul 2>nul
if errorlevel 1 goto :root_failed

echo [1/4] Checking Node.js and npm...
where node >nul 2>nul
if errorlevel 1 goto :missing_node
where npm >nul 2>nul
if errorlevel 1 goto :missing_npm

if not exist "node_modules\vite\bin\vite.js" (
  echo [2/4] Installing dependencies...
  call npm.cmd ci
  if errorlevel 1 goto :failed
) else (
  echo [2/4] Dependencies are already installed.
)

if exist "release\AD.exe" del /q "release\AD.exe"

echo [3/4] Building the web app and packaging AD.exe...
call npm.cmd run build:desktop
if errorlevel 1 goto :failed

if not exist "release\AD.exe" goto :artifact_missing
echo [4/4] Copying AD.exe to the project root...
copy /Y "release\AD.exe" "AD.exe" >nul
if errorlevel 1 goto :failed

echo.
echo AD.exe has been generated:
echo %ROOT%\AD.exe
popd
pause
exit /b 0

:root_failed
echo ERROR: Could not locate the project root.
goto :failed_without_popd

:missing_node
echo ERROR: Node.js was not found. Install Node.js 22 or newer first.
goto :failed

:missing_npm
echo ERROR: npm was not found. Check the Node.js installation.
goto :failed

:artifact_missing
echo ERROR: electron-builder did not generate release\AD.exe.
goto :failed

:failed
popd
:failed_without_popd
echo.
echo Build failed. Check the error messages above.
pause
exit /b 1
