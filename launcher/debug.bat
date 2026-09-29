@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
pushd "%ROOT%" >nul 2>nul
if errorlevel 1 goto :root_failed

set "ELECTRON_EXE=%ROOT%\node_modules\electron\dist\electron.exe"
if not exist "%ELECTRON_EXE%" goto :electron_missing
if not exist "%ROOT%\node_modules\.bin\vite.cmd" goto :vite_missing

echo Preparing the local debug bundle...
call "%ROOT%\node_modules\.bin\vite.cmd" build
if errorlevel 1 goto :failed

echo Starting the Electron source debug window...
set "ELECTRON_DEBUG=1"
set "ELECTRON_WATCH=1"
set "DEBUG_NODE_PATH=node"
start "AblaufDiagramm Debug" /wait "%ELECTRON_EXE%" "%ROOT%"
set "APP_EXIT=%errorlevel%"

popd
exit /b %APP_EXIT%

:root_failed
echo ERROR: Could not locate the project root.
goto :failed_without_popd

:electron_missing
echo ERROR: Local Electron runtime was not found:
echo %ELECTRON_EXE%
echo No Electron download will be started. Install or restore the local runtime first.
goto :failed

:vite_missing
echo ERROR: Local Vite executable was not found:
echo %ROOT%\node_modules\.bin\vite.cmd
goto :failed

:failed
popd
:failed_without_popd
echo.
echo Debug session failed.
pause
exit /b 1
