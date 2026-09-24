@echo off
chcp 65001 >nul
echo ======================================================================
echo    TankPilot - Android Auto Auto-Installer (Play Store Spoofing)
echo ======================================================================
echo.
echo Verbinde dein Smartphone (Pixel 7 Pro) per USB-Kabel mit dem PC...
echo.

set ADB="%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

if not exist %ADB% (
    echo [FEHLER] adb.exe wurde unter %ADB% nicht gefunden!
    echo Bitte stelle sicher, dass das Android SDK installiert ist.
    pause
    exit /b 1
)

echo Pruefe verbundene Geraete...
%ADB% devices
echo.

echo Installiere TankPilot mit Play-Store-Herkuenftskennung (com.android.vending)...
%ADB% install -i "com.android.vending" -r "android\app\build\outputs\apk\debug\app-debug.apk"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================================================
    echo   ERFOLGREICH INSTALLIERT!
    echo ======================================================================
    echo Die App wurde mit offizieller 'Google Play Store'-Herkunft registriert.
    echo.
    echo Naechste Schritte:
    echo 1. Oeffne auf dem Smartphone die Android Auto-Einstellungen.
    echo 2. Gehe auf "Launcher anpassen".
    echo 3. TankPilot wird jetzt aufgelistet sein und kann im Auto gestartet werden!
) else (
    echo.
    echo [FEHLER] Die Installation ist fehlgeschlagen.
    echo Bitte stelle sicher, dass das Smartphone entsperrt ist und
    echo USB-Debugging auf dem Smartphone bestaetigt wurde.
)

echo.
pause
