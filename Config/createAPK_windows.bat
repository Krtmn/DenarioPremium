@echo off
REM 1. Compilar la app para producción
call npm run build -- --prod
if %errorlevel% neq 0 (
    echo Error en la compilación de Angular.
    exit /b %errorlevel%
)

REM 2. Sincronizar cambios con Android
call npx cap sync android
if %errorlevel% neq 0 (
    echo Error en la sincronización de Capacitor.
    exit /b %errorlevel%
)

REM 3. Compilar el APK de Android
cd android
call .\gradlew assembleRelease
if %errorlevel% neq 0 (
    echo Error al compilar el APK.
    exit /b %errorlevel%
)
cd ..

REM 4. Firmar el APK
set APK_PATH=android\app\build\outputs\apk\release\app-release-unsigned.apk
set SIGNED_APK_PATH=android\app\build\outputs\apk\release\app-release-signed.apk
set KEYSTORE_PATH=app\my-denarioPremium-key.keystore
set ALIAS=denarioPremiumKey
set OUTPUT_DIR=%USERPROFILE%\Documents

REM Cambia la contraseña y el alias según tu configuración
call jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore %KEYSTORE_PATH% -storepass Peace4us2025* %APK_PATH% %ALIAS%
if %errorlevel% neq 0 (
    echo Error al firmar el APK.
    exit /b %errorlevel%
)

REM 5. (Opcional) Alinear el APK con zipalign (requiere Android SDK build-tools en el PATH)
call zipalign -v 4 %APK_PATH% %SIGNED_APK_PATH%
if %errorlevel% neq 0 (
    echo Error al alinear el APK.
    exit /b %errorlevel%
)

REM 6. Mover el APK firmado a la carpeta deseada
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
move /Y %SIGNED_APK_PATH% "%OUTPUT_DIR%\app-release-signed.apk"

echo Proceso completado. El APK firmado está en %OUTPUT_DIR%
pause