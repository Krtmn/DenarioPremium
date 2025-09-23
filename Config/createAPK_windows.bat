@echo off
REM filepath: createAPK.bat

REM Verifica que se pase el nombre del APK como argumento
IF "%~1"=="" (
    echo Uso: %0 NombreAPK
    exit /b 1
)



REM #!!!!!!!!OJO!!!!!!!!!!!!!!


REM #ACTUALIZAR LAS RUTAS SEGUN SU SISTEMA OPERATIVO Y AMBIENTES


REM #!!!!!!!!!!!!!!!!!!!!!!!!!

SET "APK_NAME=%~1"
SET "RUTA_ANDROID=%CD%\..\Repositorios\denarioPremiunAngular\DenarioPremiunMovil\android"
SET "RUTA_KEYSTORE=%CD%\..\Repositorios\denarioPremiunAngular\DenarioPremiunMovil\android\app\my-denarioPremium-key.keystore"
SET "KEYSTORE_PASS=Peace4us2025*"
SET "RUTA_APK_RELEASE=%RUTA_ANDROID%\app\build\outputs\apk\release\app-release.apk"
SET "RUTA_APK_FIRMADO=%CD%\..\Apks\%APK_NAME%\"

REM Crea la carpeta de salida si no existe
IF NOT EXIST "%RUTA_APK_FIRMADO%" (
    mkdir "%RUTA_APK_FIRMADO%"
)

REM Compila el APK en modo release
cd /d "%RUTA_ANDROID%"
call gradlew assembleRelease
cd /d "%~dp0"

REM Firma el APK
apksigner sign --ks "%RUTA_KEYSTORE%" --ks-pass pass:%KEYSTORE_PASS% --out "%RUTA_APK_FIRMADO%%APK_NAME%.apk" "%RUTA_APK_RELEASE%"

REM Elimina el archivo .apk.idsig si existe
IF EXIST "%RUTA_APK_FIRMADO%%APK_NAME%.apk.idsig" (
    del "%RUTA_APK_FIRMADO%%APK_NAME%.apk.idsig"
)

REM Verifica la firma
apksigner verify "%RUTA_APK_FIRMADO%%APK_NAME%.apk"

REM Instala el APK si hay un dispositivo conectado
FOR /F "skip=1 tokens=1" %%D IN ('adb devices') DO (
    IF "%%D" NEQ "" (
        echo Instalando APK en el dispositivo conectado...
        adb install -r "%RUTA_APK_FIRMADO%%APK_NAME%.apk"
        GOTO :fin
    )
)
echo No hay dispositivos conectados

:fin
pause