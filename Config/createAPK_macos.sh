# ...existing code...
#!/bin/bash
# createAPK_mcos.sh - Script para compilar, firmar y exportar APK en macOS/Linux

set -e

if [ -z "$1" ]; then
  echo "Uso: $0 <NombreAPK>"
  exit 1
fi

# Configuración de rutas (ajusta según tu entorno)
ANDROID_DIR="/Users/luiscastillo/Documents/Repositorios/DenarioPremiunMovil/DenarioPremiunMovil/android"
PROJECT_DIR="/Users/luiscastillo/Documents/Repositorios/DenarioPremiunMovil/DenarioPremiunMovil"
APK_PATH="/Users/luiscastillo/Documents/Repositorios/DenarioPremiunMovil/DenarioPremiunMovil/android/app/build/outputs/apk/release/app-release.apk"
SIGNED_APK_PATH="/Users/luiscastillo/Documents/Repositorios/DenarioPremiunMovil/DenarioPremiunMovil/android/app/build/outputs/apk/release/app-release-signed-unaligned.apk"
ALIGNED_APK_PATH="/Users/luiscastillo/Documents/Repositorios/DenarioPremiunMovil/DenarioPremiunMovil/android/app/build/outputs/apk/release/app-release-signed.apk"
KEYSTORE_PATH="/Users/luiscastillo/Documents/Repositorios/DenarioPremiunMovil/DenarioPremiunMovil/android/app/my-denarioPremium-key.keystore"
ALIAS="my-key-denariopremium"
APK_NAME="$1"
OUTPUT_DIR="/Users/luiscastillo/Documents/Apks/${APK_NAME}"

# 1. Compilar la app para producción
cd "$PROJECT_DIR"
if [ ! -f package.json ]; then
  echo "ERROR: No se encontró package.json en $PROJECT_DIR."
  exit 1
fi
npm run build -- --configuration=production

# 2. Sincronizar cambios con Android
npx cap sync android

# 3. Compilar el APK de Android
cd "$ANDROID_DIR"
if [ ! -f gradlew ]; then
  echo "ERROR: No se encontró gradlew en $ANDROID_DIR."
  exit 1
fi
./gradlew assembleRelease
cd -


# 4. Firmar el APK solo con apksigner (firma v2/v3)
if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "ERROR: No se encontró el keystore en $KEYSTORE_PATH."
  exit 1
fi
if [ ! -f "$APK_PATH" ]; then
  echo "ERROR: No se encontró el APK generado en $APK_PATH."
  exit 1
fi
APK_SIGNER_PATH=$(which apksigner)
if [ -z "$APK_SIGNER_PATH" ]; then
  echo "ERROR: apksigner no está en el PATH. Instala build-tools de Android SDK."
  exit 1
fi
mkdir -p "$OUTPUT_DIR"
$APK_SIGNER_PATH sign --ks "$KEYSTORE_PATH" --ks-pass pass:Peace4us2025* --ks-key-alias "$ALIAS" --out "$OUTPUT_DIR/$APK_NAME.apk" "$APK_PATH"
if [ -f "$OUTPUT_DIR/$APK_NAME.apk.idsig" ]; then
  rm "$OUTPUT_DIR/$APK_NAME.apk.idsig"
fi

echo "Proceso completado. El APK firmado está en $OUTPUT_DIR/$APK_NAME.apk"

# 7. Instalar el APK en el dispositivo conectado (si hay alguno)
echo "Instalando APK en el dispositivo conectado (si existe)..."
adb devices > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: adb no está en el PATH o no se pudo ejecutar."
  exit 1
fi
adb install -r "$OUTPUT_DIR/$APK_NAME.apk" || echo "ERROR: No se pudo instalar el APK en el dispositivo. ¿Está conectado y con depuración USB activa?"
# ...existing code...