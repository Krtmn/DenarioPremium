#!/bin/bash
# filepath: createAPK.sh

set -e

if [ -z "$1" ]; then
  echo "Uso: $0 <NombreAPK>"
  exit 1
fi

#!!!!!!!!OJO!!!!!!!!!!!!!!


#ACTUALIZAR LAS RUTAS SEGUN SU SISTEMA OPERATIVO Y AMBIENTES


#!!!!!!!!!!!!!!!!!!!!!!!!!

APK_NAME="$1"
RUTA_ANDROID="/Users/luiscastillo/Documents/Repositorios/denarioPremiunAngular/DenarioPremiunMovil/android/"
RUTA_KEYSTORE="/Users/luiscastillo/Documents/Repositorios/denarioPremiunAngular/DenarioPremiunMovil/android/app/my-denarioPremium-key.keystore"
KEYSTORE_PASS="Peace4us2025*" # Cambia aquí tu contraseña real
RUTA_APK_RELEASE="/Users/luiscastillo/Documents/Repositorios/denarioPremiunAngular/DenarioPremiunMovil/android/app/build/outputs/apk/release/app-release.apk"
RUTA_APK_FIRMADO="/Users/luiscastillo/Documents/Apks/${APK_NAME}/"

# Crea la carpeta con el nombre del APK si no existe
mkdir -p "$RUTA_APK_FIRMADO"

cd "$RUTA_ANDROID"
./gradlew assembleRelease
cd ..

# Firma el APK
apksigner sign --ks "$RUTA_KEYSTORE" \
  --ks-pass pass:"$KEYSTORE_PASS" \
  --out "${RUTA_APK_FIRMADO}${APK_NAME}.apk" "$RUTA_APK_RELEASE"

# Elimina el archivo .apk.idsig si existe
if [ -f "${RUTA_APK_FIRMADO}${APK_NAME}.apk.idsig" ]; then
  rm "${RUTA_APK_FIRMADO}${APK_NAME}.apk.idsig"
fi

# Verifica la firma
apksigner verify "${RUTA_APK_FIRMADO}${APK_NAME}.apk"

# Instala el APK si hay un dispositivo conectado
if adb devices | grep -w "device" | grep -v "List"; then
  echo "Instalando APK en el dispositivo conectado..."
  adb install -r "${RUTA_APK_FIRMADO}${APK_NAME}.apk"
else
  echo "No hay dispositivos conectados"
fi