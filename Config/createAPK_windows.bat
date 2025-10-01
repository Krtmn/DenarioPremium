@echo off
REM 0. Configuración de variables absolutas
set ANDROID_DIR=C:\Users\Admin\Documents\denarioPremiumMovil-IonicAngular\DenarioPremiunMovil\android
set PROJECT_DIR=C:\Users\Admin\Documents\denarioPremiumMovil-IonicAngular\DenarioPremiunMovil
set APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-unsigned.apk
set SIGNED_APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-signed-unaligned.apk
set ALIGNED_APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-signed.apk
set KEYSTORE_PATH=%PROJECT_DIR%\app\my-denarioPremium-key.keystore
set ALIAS=my-key-denariopremium
set APK_NAME=%1
set OUTPUT_DIR=C:\Users\Admin\Documents\Apks\%APK_NAME%



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
REM Firmar el APK y generar un APK firmado pero aún no alineado
REM Firmar el APK con SHA256withRSA (más seguro y requerido por Android modernos)
call jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "%KEYSTORE_PATH%" -storepass Peace4us2025* -signedjar "%SIGNED_APK_PATH%" "%APK_PATH%" %ALIAS%
if %errorlevel% neq 0 (
    echo Error al firmar el APK.
    exit /b %errorlevel%
)



REM 5. (Opcional) Alinear el APK con zipalign (requiere Android SDK build-tools en el PATH)
REM 5. (Opcional) Alinear el APK firmado con zipalign (requiere Android SDK build-tools en el PATH)

REM Ya no se alinea el APK, se usará el APK firmado directamente

REM 5b. Firmar con apksigner (firma v2/v3, requerido por Android 7+)
REM Cambia la ruta de apksigner si tu build-tools está en otra ubicación
REM Buscar la versión más alta de build-tools instalada para apksigner

set APK_SIGNER_PATH=C:\Users\Admin\AppData\Local\Android\Sdk\build-tools\36.1.0\apksigner.bat
if not exist "%APK_SIGNER_PATH%" (
    echo ERROR: No se encontró apksigner.bat en %APK_SIGNER_PATH%.
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

call "%APK_SIGNER_PATH%" sign --ks "%KEYSTORE_PATH%" --ks-pass pass:Peace4us2025* --ks-key-alias %ALIAS% --out "%OUTPUT_DIR%\%APK_NAME%.apk" "%ALIGNED_APK_PATH%"
if %errorlevel% neq 0 (
    echo Error al firmar el APK con apksigner.
    exit /b %errorlevel%
)
if exist "%OUTPUT_DIR%\%APK_NAME%.apk.idsig" del /f /q "%OUTPUT_DIR%\%APK_NAME%.apk.idsig"



REM 6. Mover el APK firmado a la carpeta deseada
REM 6. Mover el APK alineado a la carpeta deseada
if not exist "%ALIGNED_APK_PATH%" (
    echo ERROR: No se encontró el APK alineado en %ALIGNED_APK_PATH%.
    exit /b 1
)
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
REM Ya no es necesario mover, apksigner genera el APK final en OUTPUT_DIR


echo Proceso completado. El APK firmado está en %OUTPUT_DIR%\%APK_NAME%.apk

REM 7. Instalar el APK en el dispositivo conectado (si hay alguno)
echo Instalando APK en el dispositivo conectado (si existe)...
adb devices > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: adb no está en el PATH o no se pudo ejecutar.
    
    exit /b 1
)
adb install -r "%OUTPUT_DIR%\%APK_NAME%.apk"
if %errorlevel% neq 0 (
    echo ERROR: No se pudo instalar el APK en el dispositivo. ¿Está conectado y con depuración USB activa?
    
    exit /b %errorlevel%
)
echo APK instalado correctamente en el dispositivo.
