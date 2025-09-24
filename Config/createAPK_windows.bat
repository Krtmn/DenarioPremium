@echo off
REM 1. Validate input
IF "%~1"=="" (
    echo Usage: %0 ApkName
    exit /b 1
)

SET "APK_NAME=%~1"
SET "ROOT=%CD%\..\Repositorios\denarioPremiunAngular\DenarioPremiunMovil"
SET "ANDROID_DIR=%ROOT%\android"
SET "KEYSTORE=%ROOT%\android\app\my-denarioPremium-key.keystore"
SET "KS_PASS=Peace4us2025*"
SET "OUTPUT_DIR=%CD%\..\Apks\%APK_NAME%"

REM Prepare output folder
IF NOT EXIST "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM 2. Build web assets in production mode
cd /d "%ROOT%"
npm ci
ionic build --prod

REM 3. Sync assets into Android (Capacitor) or Cordova copy step
npx cap sync android

REM 4. Compile Android APK
cd /d "%ANDROID_DIR%"
call gradlew assembleRelease
cd /d "%~dp0"

REM 5. Sign APK
SET "UNSIGNED_APK=%ANDROID_DIR%\app\build\outputs\apk\release\app-release.apk"
apksigner sign --ks "%KEYSTORE%" --ks-pass pass:%KS_PASS% --out "%OUTPUT_DIR%\%APK_NAME%.apk" "%UNSIGNED_APK%"

REM 6. Clean up signature file and verify
IF EXIST "%OUTPUT_DIR%\%APK_NAME%.apk.idsig" del "%OUTPUT_DIR%\%APK_NAME%.apk.idsig"
apksigner verify "%OUTPUT_DIR%\%APK_NAME%.apk"

REM 7. Install on connected device
FOR /F "skip=1 tokens=1" %%D IN ('adb devices') DO (
    IF "%%D" NEQ "" (
        echo Installing APK on device...
        adb install -r "%OUTPUT_DIR%\%APK_NAME%.apk"
        GOTO fin
    )
)
echo No devices connected

:fin
pause