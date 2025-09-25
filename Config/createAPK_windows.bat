
@echo off
REM 0. Configuración de variables absolutas
set ANDROID_DIR=C:\Users\Admin\Documents\denarioPremiumMovil-IonicAngular\DenarioPremiunMovil\android
set PROJECT_DIR=C:\Users\Admin\Documents\denarioPremiumMovil-IonicAngular\DenarioPremiunMovil
set APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-unsigned.apk
set SIGNED_APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-signed.apk
set KEYSTORE_PATH=%PROJECT_DIR%\app\my-denarioPremium-key.keystore
set ALIAS=denarioPremiumKey
set OUTPUT_DIR=%USERPROFILE%\Documents\Apks



REM 1. Compilar la app para producción
cd /d %PROJECT_DIR%
if not exist package.json (
    echo ERROR: No se encontró package.json en %PROJECT_DIR%.
    exit /b 1
)
call npm run build -- --configuration=production
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
cd /d %ANDROID_DIR%
if not exist gradlew (
    echo ERROR: No se encontró gradlew en %ANDROID_DIR%.
    exit /b 1
)
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo Error al compilar el APK.
    exit /b %errorlevel%
)
cd /d %~dp0

REM 4. Firmar el APK




REM Cambia la contraseña y el alias según tu configuración
if not exist "%KEYSTORE_PATH%" (
    echo ERROR: No se encontró el keystore en %KEYSTORE_PATH%.
    exit /b 1
)
if not exist "%APK_PATH%" (
    echo ERROR: No se encontró el APK sin firmar en %APK_PATH%.
    exit /b 1
)
call jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore "%KEYSTORE_PATH%" -storepass Peace4us2025* "%APK_PATH%" %ALIAS%
if %errorlevel% neq 0 (
    echo Error al firmar el APK.
    exit /b %errorlevel%
)



REM 5. (Opcional) Alinear el APK con zipalign (requiere Android SDK build-tools en el PATH)
if not exist "%SIGNED_APK_PATH%" (
    echo INFO: El APK firmado aún no existe, se intentará alinear.
)
call zipalign -v 4 "%APK_PATH%" "%SIGNED_APK_PATH%"
if %errorlevel% neq 0 (
    echo Error al alinear el APK.
    exit /b %errorlevel%
)



REM 6. Mover el APK firmado a la carpeta deseada
if not exist "%SIGNED_APK_PATH%" (
    echo ERROR: No se encontró el APK firmado en %SIGNED_APK_PATH%.
    exit /b 1
)
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
move /Y "%SIGNED_APK_PATH%" "%OUTPUT_DIR%\app-release-signed.apk"

pause
echo Proceso completado. El APK firmado está en %OUTPUT_DIR%

REM 7. Instalar el APK en el dispositivo conectado (si hay alguno)
echo Instalando APK en el dispositivo conectado (si existe)...
adb devices > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: adb no está en el PATH o no se pudo ejecutar.
    pause
    exit /b 1
)
adb install -r "%OUTPUT_DIR%\app-release-signed.apk"
if %errorlevel% neq 0 (
    echo ERROR: No se pudo instalar el APK en el dispositivo. ¿Está conectado y con depuración USB activa?
    pause
    exit /b %errorlevel%
)
echo APK instalado correctamente en el dispositivo.
pause