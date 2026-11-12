@echo off
rem Registers briefing.ps1 to run at Windows login (current user only).
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
(
  echo @echo off
  echo start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0briefing.ps1"
) > "%STARTUP%\startup-briefing.bat"
echo Installed: "%STARTUP%\startup-briefing.bat"
echo The briefing will open the first time you turn on the PC each day.
pause
