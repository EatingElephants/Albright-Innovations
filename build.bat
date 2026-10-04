@echo off
rem Double-click this file to rebuild the website from the src folder.
cd /d "%~dp0"
py -3 build.py
if errorlevel 1 (
  echo.
  echo Something needs fixing. Read the message above.
) else (
  echo.
  echo The site is rebuilt. Commit and push to publish.
)
pause
