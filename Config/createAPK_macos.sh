# ...existing code...
#!/bin/bash
# createAPK_mcos.sh - Script para compilar, firmar y exportar APK en macOS/Linux

set -e

if [ -z "$1" ]; then
  echo "Uso: $0 <NombreAPK>"
  exit 1
fi

# Configuración de rutas (ajusta según tu entorno)
PROJECT_ROOT="/Users/kiberno/Documents/Repositorios/DenarioPremiumMovil2026"
PROJECT_DIR="$PROJECT_ROOT/DenarioPremiunMovil"
ANDROID_DIR="$PROJECT_DIR/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
SIGNED_APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release-signed-unaligned.apk"
ALIGNED_APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release-signed.apk"
KEYSTORE_PATH="$PROJECT_ROOT/my-denarioPremium-key.keystore"
ALIAS="my-key-denariopremium"
APK_NAME="$1"
OUTPUT_DIR="/Users/kiberno/Documents/APK/${APK_NAME}"

ENV_FILE="$PROJECT_DIR/claves.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  . <(tr -d '\r' < "$ENV_FILE")
  set +a
fi

if [ -n "$ANDROID_KEYSTORE_PATH" ] && [ -n "$ANDROID_KEYSTORE_PASSWORD" ] && [ -n "$ANDROID_KEY_ALIAS" ] && [ -n "$ANDROID_KEY_PASSWORD" ]; then
  KEYSTORE_PATH="$ANDROID_KEYSTORE_PATH"
  KEYSTORE_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
  ALIAS="$ANDROID_KEY_ALIAS"
  KEY_PASSWORD="$ANDROID_KEY_PASSWORD"
else
  KEYSTORE_PATH="$HOME/.android/debug.keystore"
  KEYSTORE_PASSWORD="android"
  ALIAS="androiddebugkey"
  KEY_PASSWORD="android"
fi

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
$APK_SIGNER_PATH sign --ks "$KEYSTORE_PATH" --ks-pass "pass:$KEYSTORE_PASSWORD" --key-pass "pass:$KEY_PASSWORD" --ks-key-alias "$ALIAS" --out "$OUTPUT_DIR/$APK_NAME.apk" "$APK_PATH"
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