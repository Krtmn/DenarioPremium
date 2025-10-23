@echo off
REM 0. Configuración de variables absolutas (ajustadas al usuario actual)
set ANDROID_DIR=C:\Users\franc\Documents\Repositorios\DenarioPremiumMovil\DenarioPremiunMovil\android
set PROJECT_DIR=C:\Users\franc\Documents\Repositorios\DenarioPremiumMovil\DenarioPremiunMovil
set APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-unsigned.apk
set SIGNED_APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-signed-unaligned.apk
set ALIGNED_APK_PATH=%ANDROID_DIR%\app\build\outputs\apk\release\app-release-signed.apk
set KEYSTORE_PATH=%PROJECT_DIR%\app\my-denarioPremium-key.keystore
set ALIAS=my-key-denariopremium
set APK_NAME=%1
set OUTPUT_DIR=C:\Users\franc\Documents\Apks\%APK_NAME%



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

REM Localizar APK unsigned (evitar ruta fija si Gradle genera splits)
set "FOUND_APK="
for /f "delims=" %%F in ('dir /b /s "%ANDROID_DIR%\app\build\outputs\apk\release\*.apk" 2^>nul') do (
  set "FOUND_APK=%%F"
  goto :FOUND_APK_LABEL
)
:FOUND_APK_LABEL
if "%FOUND_APK%"=="" (
  echo ERROR: No se encontró ningún .apk en %ANDROID_DIR%\app\build\outputs\apk\release
  dir "%ANDROID_DIR%\app\build\outputs\apk\release" /s
  exit /b 1
)
set APK_PATH=%FOUND_APK%
echo Usando APK: %APK_PATH%

REM Firmar el APK con jarsigner (opcional, legacy)
call jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore "%KEYSTORE_PATH%" -storepass Peace4us2025* -signedjar "%SIGNED_APK_PATH%" "%APK_PATH%" %ALIAS%
if %errorlevel% neq 0 (
    echo Error al firmar el APK con jarsigner.
    REM continuar para intentar apksigner si jarsigner falla
)

REM 5b. Firmar con apksigner (firma v2/v3, requerido por Android modernos)
REM Detectar build-tools en SDK (usa ANDROID_SDK_ROOT o LOCALAPPDATA fallback)
set SDK=%ANDROID_SDK_ROOT%
if "%SDK%"=="" set SDK=%LOCALAPPDATA%\Android\Sdk

REM detectar la versión más alta de build-tools disponible
set "BUILDTOOL_VER="
for /f "delims=" %%V in ('dir /b /ad "%SDK%\build-tools" 2^>nul ^| sort /r') do (
  set "BUILDTOOL_VER=%%V"
  goto :FOUND_BUILD_TOOLS
)
:FOUND_BUILD_TOOLS
if "%BUILDTOOL_VER%"=="" (
  echo ERROR: No se encontró build-tools en %SDK%\build-tools
  exit /b 1
)

set APK_SIGNER_PATH=%SDK%\build-tools\%BUILDTOOL_VER%\apksigner.bat
if not exist "%APK_SIGNER_PATH%" (
    echo ERROR: No se encontró apksigner.bat en %APK_SIGNER_PATH%.
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Usar el APK generado por jarsigner/aligned si existe, sino usar el original unsigned
if exist "%ALIGNED_APK_PATH%" (
  set APK_TO_SIGN="%ALIGNED_APK_PATH%"
) else if exist "%SIGNED_APK_PATH%" (
  set APK_TO_SIGN="%SIGNED_APK_PATH%"
) else (
  set APK_TO_SIGN="%APK_PATH%"
)

call "%APK_SIGNER_PATH%" sign --ks "%KEYSTORE_PATH%" --ks-pass pass:Peace4us2025* --ks-key-alias %ALIAS% --out "%OUTPUT_DIR%\%APK_NAME%.apk" %APK_TO_SIGN%
if %errorlevel% neq 0 (
    echo Error al firmar el APK con apksigner.
    exit /b %errorlevel%
)
if exist "%OUTPUT_DIR%\%APK_NAME%.apk.idsig" del /f /q "%OUTPUT_DIR%\%APK_NAME%.apk.idsig"



REM 6. Verificar y notificar resultado
if not exist "%OUTPUT_DIR%\%APK_NAME%.apk" (
    echo ERROR: No se encontró el APK final en %OUTPUT_DIR%\%APK_NAME%.apk
    exit /b 1
)

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
