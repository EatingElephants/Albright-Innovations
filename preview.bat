@echo off
rem Double-click this file to look at the website on this computer, full screen in your browser.
rem Leave the black window open while you look. Close it when you're done.
cd /d "%~dp0"
echo.
echo  Showing the Albright Innovations site at http://localhost:8080
echo  Leave this window open while you look. Close it when you're done.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080/"
py -3 -m http.server 8080 --bind 127.0.0.1
pause
