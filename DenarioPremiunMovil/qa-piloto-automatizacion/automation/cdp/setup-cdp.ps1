# setup-cdp.ps1
# Pre-flight check para corridas smoke CDP — Denario Premium Movil
# Ejecutar ANTES de iniciar el orquestador Claude Code.
#
# Uso: .\setup-cdp.ps1
# Desde la raiz del repo: .\DenarioPremiunMovil\qa-piloto-automatizacion\automation\cdp\setup-cdp.ps1

$ErrorActionPreference = 'Stop'
$APK_PATH = "android\app\build\outputs\apk\debug\app-debug.apk"
$PACKAGE   = "com.kiberno.denarioPremiumPro"
$PORT      = 9220

Write-Host ""
Write-Host "===  Pre-flight CDP Denario Premium Movil  ===" -ForegroundColor Cyan
Write-Host ""

# 1. Dispositivo ADB
Write-Host "[1/7] Dispositivo ADB..." -NoNewline
$devicesRaw = adb devices 2>&1
$devices = $devicesRaw | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' }
if (-not $devices) {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Error "No hay dispositivo ADB. Conectar USB y habilitar depuracion USB en el telefono."
}
$serial = ($devices | Select-Object -First 1) -replace '\s.*', ''
Write-Host " OK  ($serial)" -ForegroundColor Green

# 2. Verificar / instalar app
Write-Host "[2/7] Paquete $PACKAGE..." -NoNewline
$pkg = adb shell pm list packages 2>&1 | Select-String $PACKAGE
if ($pkg) {
    Write-Host " instalado" -ForegroundColor Green
} else {
    Write-Host " no instalado. Instalando APK..." -ForegroundColor Yellow
    if (-not (Test-Path $APK_PATH)) {
        Write-Error "APK no encontrado en $APK_PATH. Compilar primero con 'npx cap sync && cd android && gradlew assembleDebug'."
    }
    $result = adb install -r $APK_PATH 2>&1
    if ($result -notmatch "Success") { Write-Error "Instalacion fallida: $result" }
    Write-Host "     APK instalado OK" -ForegroundColor Green
}

# 3. Lanzar app
Write-Host "[3/7] Lanzando app..." -NoNewline
adb shell am start -n "$PACKAGE/.MainActivity" 2>$null | Out-Null
Start-Sleep -Seconds 4
Write-Host " OK" -ForegroundColor Green

# 4. Encontrar socket WebView
Write-Host "[4/7] Socket WebView..." -NoNewline
$maxRetries = 3
$socket = $null
for ($i = 0; $i -lt $maxRetries; $i++) {
    $socket = adb shell cat /proc/net/unix 2>$null | Select-String "webview_devtools_remote_"
    if ($socket) { break }
    Start-Sleep -Seconds 2
}
if (-not $socket) {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Error "WebView socket no encontrado. Verificar que la app haya arrancado correctamente."
}
$pid = ($socket.ToString() -split "webview_devtools_remote_")[1].Trim().Split()[0]
Write-Host " OK  (PID $pid)" -ForegroundColor Green

# 5. Port forward
Write-Host "[5/7] Port forward tcp:$PORT -> webview_devtools_remote_$pid..." -NoNewline
adb forward "tcp:$PORT" "localabstract:webview_devtools_remote_$pid" | Out-Null
Write-Host " OK" -ForegroundColor Green

# 6. Verificar CDP
Write-Host "[6/7] CDP en :$PORT..." -NoNewline
try {
    $cdpResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$PORT/json/version" -UseBasicParsing -TimeoutSec 5
    if ($cdpResponse.Content -match "Android-Package") {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " respuesta inesperada" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Error "CDP no responde en :$PORT. Revisa el port forward (paso 5)."
}

# 7. Permisos de ubicacion
Write-Host "[7/7] Permisos ubicacion..." -NoNewline
adb shell pm grant $PACKAGE android.permission.ACCESS_FINE_LOCATION   2>$null | Out-Null
adb shell pm grant $PACKAGE android.permission.ACCESS_COARSE_LOCATION 2>$null | Out-Null
Write-Host " OK" -ForegroundColor Green

Write-Host ""
Write-Host "--- Credenciales ---" -ForegroundColor Cyan
Write-Host "Login QA se lee directo de secrets\qa-credentials.env (fetchCreds). No requiere servidor." -ForegroundColor Green

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Pre-flight completado. CDP listo en http://127.0.0.1:$PORT" -ForegroundColor Cyan
Write-Host "  Ya puedes iniciar el orquestador en Claude Code." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
