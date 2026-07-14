# setup-cdp.ps1
# Pre-flight / auto-reparacion CDP para corridas smoke — Denario Premium Movil
#
# DOS MODOS:
#   .\setup-cdp.ps1              Pre-vuelo completo (device -> app -> forward -> verify -> permisos).
#                                Ejecutar ANTES de iniciar el orquestador Claude Code.
#   .\setup-cdp.ps1 -Reforward   Auto-reparacion en 1 comando: re-detecta el PID VIVO del WebView y
#                                re-apunta el forward. NO reinstala ni relanza la app (no pierde estado).
#                                Usar cuando CDP deja de responder a mitad de corrida (el forward quedo
#                                apuntando a un PID viejo por reinicio de la app / limpieza de cache).
#
# Ruta: .\DenarioPremiunMovil\qa-piloto-automatizacion\automation\cdp\setup-cdp.ps1
# Salida: 0 = CDP listo · 1 = fallo (mensaje explica que hacer).

param(
    [switch]$Reforward,       # modo auto-reparacion: solo re-detecta PID y re-apunta el forward
    [int]$Port = 9220
)

$ErrorActionPreference = 'Stop'
$APK_PATH = "android\app\build\outputs\apk\debug\app-debug.apk"
$PACKAGE  = "com.kiberno.denarioPremiumPro"

function Fail($msg) { Write-Host " ERROR" -ForegroundColor Red; Write-Host $msg -ForegroundColor Red; exit 1 }

# --- Detecta el PID VIVO del proceso WebView (reintenta ~3x por si la app aun arranca) ---
function Get-WebviewPid {
    for ($i = 0; $i -lt 3; $i++) {
        $sock = adb shell cat /proc/net/unix 2>$null | Select-String "webview_devtools_remote_"
        if ($sock) {
            return ($sock[0].ToString() -split "webview_devtools_remote_")[1].Trim().Split()[0]
        }
        Start-Sleep -Seconds 2
    }
    return $null
}

# --- (re)apunta el forward: SIEMPRE remueve el viejo primero para no dejar un mapeo stale ---
function Set-Forward($webviewPid) {
    adb forward --remove "tcp:$Port" 2>$null | Out-Null   # limpia mapeo anterior (ignora si no existia)
    adb forward "tcp:$Port" "localabstract:webview_devtools_remote_$webviewPid" | Out-Null
}

# --- Verifica CDP con reintento (la 1a respuesta a veces sale vacia aunque el forward este ok) ---
function Test-Cdp {
    for ($i = 0; $i -lt 4; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/json/version" -UseBasicParsing -TimeoutSec 5
            if ($r.Content -match "Android-Package") { return $true }
        } catch { }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

Write-Host ""
if ($Reforward) {
    Write-Host "===  Auto-reparacion CDP (-Reforward)  ===" -ForegroundColor Cyan
} else {
    Write-Host "===  Pre-flight CDP Denario Premium Movil  ===" -ForegroundColor Cyan
}
Write-Host ""

# 1. Dispositivo ADB (ambos modos)
Write-Host "[dispositivo] ADB..." -NoNewline
$devicesRaw = adb devices 2>&1
$devices = $devicesRaw | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' }
if (-not $devices) { Fail "No hay dispositivo ADB. Conectar USB y habilitar depuracion USB en el telefono." }
$serial = ($devices | Select-Object -First 1) -replace '\s.*', ''
Write-Host " OK  ($serial)" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────────
# MODO AUTO-REPARACION: solo re-detecta PID + re-apunta forward + verifica
# ─────────────────────────────────────────────────────────────────────
if ($Reforward) {
    Write-Host "[app] PID vivo..." -NoNewline
    $webviewPid = Get-WebviewPid
    if (-not $webviewPid) { Fail "No hay socket WebView. La app no esta corriendo -> relanza sin -Reforward, o abre la app manualmente." }
    Write-Host " OK  (PID $webviewPid)" -ForegroundColor Green

    Write-Host "[forward] tcp:$Port -> webview_devtools_remote_$webviewPid..." -NoNewline
    Set-Forward $webviewPid
    Write-Host " OK" -ForegroundColor Green

    Write-Host "[cdp] :$Port responde..." -NoNewline
    if (Test-Cdp) { Write-Host " OK" -ForegroundColor Green }
    else { Fail "CDP no responde tras re-apuntar. Manual: adb forward tcp:$Port localabstract:webview_devtools_remote_$webviewPid" }

    Write-Host ""
    Write-Host "CDP reparado y listo en http://127.0.0.1:$Port  (PID $webviewPid)" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# ─────────────────────────────────────────────────────────────────────
# MODO PRE-VUELO COMPLETO
# ─────────────────────────────────────────────────────────────────────

# 2. Verificar / instalar app
Write-Host "[paquete] $PACKAGE..." -NoNewline
$pkg = adb shell pm list packages 2>&1 | Select-String $PACKAGE
if ($pkg) {
    Write-Host " instalado" -ForegroundColor Green
} else {
    Write-Host " no instalado. Instalando APK..." -ForegroundColor Yellow
    if (-not (Test-Path $APK_PATH)) { Fail "APK no encontrado en $APK_PATH. Compilar primero: npx cap sync ; cd android ; .\gradlew assembleDebug" }
    $result = adb install -r $APK_PATH 2>&1
    if ($result -notmatch "Success") { Fail "Instalacion fallida: $result" }
    Write-Host "     APK instalado OK" -ForegroundColor Green
}

# 3. Lanzar app
Write-Host "[app] Lanzando..." -NoNewline
adb shell am start -n "$PACKAGE/.MainActivity" 2>$null | Out-Null
Start-Sleep -Seconds 4
Write-Host " OK" -ForegroundColor Green

# 4. Detectar PID del WebView
Write-Host "[app] Socket WebView (PID)..." -NoNewline
$webviewPid = Get-WebviewPid
if (-not $webviewPid) { Fail "WebView socket no encontrado. Verificar que la app haya arrancado correctamente." }
Write-Host " OK  (PID $webviewPid)" -ForegroundColor Green

# 5. Port forward (remueve el viejo + apunta al PID actual)
Write-Host "[forward] tcp:$Port -> webview_devtools_remote_$webviewPid..." -NoNewline
Set-Forward $webviewPid
Write-Host " OK" -ForegroundColor Green

# 6. Verificar CDP (con reintento)
Write-Host "[cdp] :$Port responde..." -NoNewline
if (Test-Cdp) { Write-Host " OK" -ForegroundColor Green }
else { Fail "CDP no responde en :$Port. Reintenta: .\setup-cdp.ps1 -Reforward" }

# 7. Permisos de ubicacion (userMustActivateGPS)
Write-Host "[permisos] Ubicacion..." -NoNewline
adb shell pm grant $PACKAGE android.permission.ACCESS_FINE_LOCATION   2>$null | Out-Null
adb shell pm grant $PACKAGE android.permission.ACCESS_COARSE_LOCATION 2>$null | Out-Null
Write-Host " OK" -ForegroundColor Green

Write-Host ""
Write-Host "--- Credenciales ---" -ForegroundColor Cyan
Write-Host "Login QA se lee directo de secrets\qa-credentials.env (bloque # Cliente: <slug>). No requiere servidor." -ForegroundColor Green

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Pre-flight completado. CDP listo en http://127.0.0.1:$Port  (PID $webviewPid)" -ForegroundColor Cyan
Write-Host "  Ya puedes iniciar el orquestador en Claude Code." -ForegroundColor Cyan
Write-Host "  Si CDP se cae a mitad de corrida: .\setup-cdp.ps1 -Reforward" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
exit 0
