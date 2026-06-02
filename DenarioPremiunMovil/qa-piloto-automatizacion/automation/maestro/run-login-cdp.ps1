# run-login-cdp.ps1
# Piloto login (DM-LOG-002, DM-LOG-003, DM-LOG-001) via CDP + ADB.
# Usa Chrome DevTools Protocol para leer el DOM del WebView Ionic/Capacitor
# y ADB para interactuar con la pantalla.
# Genera reporte .md + screenshots en automation/reports/

$ErrorActionPreference = 'Continue'
$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$pilotRoot   = Resolve-Path (Join-Path $scriptDir '..\..')
$secretsFile = Join-Path $pilotRoot 'secrets\qa-credentials.env'
$reportsDir  = Join-Path $scriptDir '..\reports'
$ssDir       = Join-Path $reportsDir 'screenshots'
$PKG         = 'com.kiberno.denarioPremiumPro'
$WV_OFFSET_Y = 80   # El WebView empieza en y=80 segun uiautomator

# ── Credenciales ─────────────────────────────────────────────────────────────
if (-not (Test-Path $secretsFile)) { throw "Falta $secretsFile" }
$creds = @{}
Get-Content $secretsFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    $creds[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
  }
}
foreach ($k in @('QA_USER','QA_PASSWORD','QA_BAD_PASSWORD')) {
  if ([string]::IsNullOrWhiteSpace($creds[$k])) { throw "Falta $k en qa-credentials.env" }
}

New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $ssDir       -Force | Out-Null

$ts          = Get-Date -Format 'yyyyMMdd_HHmmss'
$reportFile  = Join-Path $reportsDir "login-cdp_$ts.md"
$sw          = [System.Diagnostics.Stopwatch]::StartNew()
$results     = @()

# ── Helpers ──────────────────────────────────────────────────────────────────

function Add-Result {
  param([string]$Id, [string]$Status, [string]$Detail, [string]$Ss = '')
  $script:results += [pscustomobject]@{Id=$Id; Status=$Status; Detail=$Detail; Ss=$Ss}
}

function Take-Screenshot {
  param([string]$Name)
  $dest = Join-Path $ssDir "$Name.png"
  adb shell screencap -p /sdcard/_qa_ss.png | Out-Null
  adb pull /sdcard/_qa_ss.png $dest | Out-Null
  adb shell rm /sdcard/_qa_ss.png | Out-Null
  return "screenshots/$Name.png"
}

function Invoke-CDPEval {
  # Ejecuta 'expression' en el WebView via WebSocket CDP.
  # Pasa la expresion por variable de entorno para evitar escapes en PS.
  param([string]$PageId, [string]$Expression, [switch]$Await, [int]$ToutSec = 12)
  $env:_CDP_PG = $PageId
  $env:_CDP_EX = $Expression
  $env:_CDP_AW = if ($Await) { '1' } else { '0' }
  $env:_CDP_TO = ($ToutSec * 1000).ToString()
  $js = @'
const ws = new (require('ws'))(
  `ws://localhost:9222/devtools/page/${process.env._CDP_PG}`
);
const msg = {
  id: 1,
  method: 'Runtime.evaluate',
  params: {
    expression:    process.env._CDP_EX,
    returnByValue: true,
    awaitPromise:  process.env._CDP_AW === '1'
  }
};
ws.on('open',    () => ws.send(JSON.stringify(msg)));
ws.on('message', d  => {
  try {
    const r = JSON.parse(d.toString());
    const v = r.result && r.result.result ? r.result.result.value : undefined;
    process.stdout.write(v == null ? '' : String(v));
  } catch(e) {}
  ws.close();
});
ws.on('error',   e  => { process.stderr.write('ERR:'+e.message); process.exit(1); });
setTimeout(() => { ws.close(); process.exit(0); }, Number(process.env._CDP_TO) || 12000);
'@
  return ($js | node --input-type=commonjs)
}

function Get-PageState {
  param([string]$PageId)
  $expr = @'
(function(){
  const body  = document.body ? document.body.innerText : '';
  const alert = document.querySelector('ion-alert');
  if (alert) {
    // body.innerText includes shadow DOM text; alert.innerText does NOT (returns tag name)
    if (body.includes('incorrectos') || body.includes('incorrectas')) return 'modal_incorrect';
    if (body.includes('Recordar') || body.includes('acuerdo'))        return 'modal_cambio_usuario';
    return 'modal_vacios';
  }
  if (body.includes('Visitas'))         return 'home';
  if (body.includes('sincroniz') || body.includes('Por favor espere') || body.includes('Cargando'))
                                        return 'sync';
  if (document.querySelector('ion-input')) return 'login';
  return 'unknown';
})()
'@
  return (Invoke-CDPEval -PageId $PageId -Expression $expr.Trim())
}

function Get-ElemCenter {
  # Devuelve {x, y} en coordenadas del WebView (sin offset)
  param([string]$PageId, [int]$InputIndex = 0, [string]$Selector = '')
  if ($Selector -ne '') {
    $expr = "(function(){const e=document.querySelector('$Selector');if(!e)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)});})()"
  } else {
    $expr = "(function(){const e=document.querySelectorAll('ion-input')[$InputIndex];if(!e)return null;const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)});})()"
  }
  $raw = Invoke-CDPEval -PageId $PageId -Expression $expr
  if ($raw -and $raw -ne '' -and $raw -ne 'null') { return ($raw | ConvertFrom-Json) }
  return $null
}

function Tap-At {
  param([int]$X, [int]$Y)    # Y es coordenada del WebView (sin offset)
  adb shell input tap $X ($Y + $WV_OFFSET_Y) | Out-Null
  Start-Sleep -Milliseconds 500
}

function Type-Text {
  param([string]$Text)
  foreach ($c in $Text.ToCharArray()) {
    if ($c -match '[A-Za-z0-9]') { adb shell input text $c | Out-Null }
    elseif ($c -eq '-')          { adb shell input keyevent 69 | Out-Null }
    elseif ($c -eq ' ')          { adb shell input keyevent 62 | Out-Null }
    Start-Sleep -Milliseconds 60
  }
}

function Clear-Field {
  # Selecciona todo y borra (CTRL+A + DEL x25)
  adb shell input keyevent 277 | Out-Null   # KEYCODE_CTRL_A seleccion
  Start-Sleep -Milliseconds 200
  1..25 | ForEach-Object { adb shell input keyevent 67 | Out-Null }
  Start-Sleep -Milliseconds 200
}

function Dismiss-Modal {
  param([string]$PageId)
  # Intenta click via shadow DOM del ion-alert; coordenadas de fallback
  $expr = "(function(){const a=document.querySelector('ion-alert');if(!a)return 'no_alert';const sr=a.shadowRoot;if(sr){const b=sr.querySelector('button');if(b){b.click();return 'shadow_click';}}const r=a.getBoundingClientRect();return JSON.stringify({x:Math.round(r.left+r.width/2),y:Math.round(r.bottom-40)});})()"
  $raw = Invoke-CDPEval -PageId $PageId -Expression $expr
  if ($raw -eq 'shadow_click' -or $raw -eq 'no_alert') {
    # shadow DOM click ok, o no habia alerta
  } elseif ($raw -and $raw.StartsWith('{')) {
    $c = $raw | ConvertFrom-Json
    adb shell input tap $c.x ($c.y + $WV_OFFSET_Y) | Out-Null
  } else {
    adb shell input tap 360 920 | Out-Null
  }
  Start-Sleep -Milliseconds 800
}

function Wait-State {
  param([string]$PageId, [string[]]$Expected, [int]$ToutSec = 25)
  $deadline = (Get-Date).AddSeconds($ToutSec)
  while ((Get-Date) -lt $deadline) {
    $s = Get-PageState -PageId $PageId
    if ($Expected -contains $s) { return $s }
    Start-Sleep -Milliseconds 900
  }
  return 'timeout'
}

# ── Reset de app ──────────────────────────────────────────────────────────────
Write-Host ''
Write-Host '===  LOGIN SMOKE CDP — DM-LOG-002 · DM-LOG-003 · DM-LOG-001  ==='
Write-Host ''
Write-Host '▶ Despertando dispositivo...'
adb shell input keyevent 224 | Out-Null
adb shell input keyevent 82  | Out-Null
Start-Sleep -Seconds 1

Write-Host '▶ Desactivando animaciones...'
adb shell settings put global window_animation_scale   0 | Out-Null
adb shell settings put global transition_animation_scale 0 | Out-Null
adb shell settings put global animator_duration_scale  0 | Out-Null

Write-Host '▶ pm clear + lanzar app...'
adb shell am force-stop $PKG | Out-Null
adb shell pm clear       $PKG | Out-Null
Start-Sleep -Seconds 2
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 | Out-Null
Start-Sleep -Seconds 14

# ── WebView socket ────────────────────────────────────────────────────────────
Write-Host '▶ Buscando socket WebView...'
$socket  = ''
$dlSock  = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $dlSock -and $socket -eq '') {
  # Buscar linea a linea para evitar que \d+ absorba la siguiente linea hex
  $lines = adb shell "cat /proc/net/unix"
  foreach ($line in $lines) {
    if ($line -match 'webview_devtools_remote_(\d+)') {
      $socket = "webview_devtools_remote_$($Matches[1])"
      break
    }
  }
  if ($socket -eq '') { Start-Sleep -Seconds 2 }
}
if ($socket -eq '') { throw 'No se encontro socket WebView — app no inicio?' }
Write-Host "  Socket: $socket"
adb forward tcp:9222 "localabstract:$socket" | Out-Null

# Esperar a que el servidor DevTools HTTP este listo
$pageInfo = $null
$dlDevTools = (Get-Date).AddSeconds(15)
while ((Get-Date) -lt $dlDevTools -and $null -eq $pageInfo) {
  try {
    $pageInfo = Invoke-RestMethod -Uri 'http://localhost:9222/json' -ErrorAction Stop
  } catch {
    Start-Sleep -Seconds 2
  }
}
if ($null -eq $pageInfo) { throw 'DevTools HTTP no respondio en 15s tras adb forward.' }

$pageId   = ($pageInfo | Where-Object { $_.type -eq 'page' })[0].id
Write-Host "  Page ID inicial: $pageId"
Write-Host ''

# ── Esperar pantalla de login (refrescando pageId si Angular recarga) ─────────
Write-Host '▶ Esperando pantalla de login...'
$loginState = 'timeout'
$dlLogin    = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $dlLogin) {
  # Refrescar page ID: Angular puede recargar el WebView en el arranque inicial
  try {
    $freshInfo = Invoke-RestMethod -Uri 'http://localhost:9222/json' -ErrorAction Stop
    $freshPage = ($freshInfo | Where-Object { $_.type -eq 'page' }) | Select-Object -First 1
    if ($freshPage -and $freshPage.id -ne $pageId) {
      $pageId = $freshPage.id
      Write-Host "  Page ID actualizado: $pageId"
    }
  } catch {}

  $s = Get-PageState -PageId $pageId
  if ($s -eq 'login') { $loginState = 'login'; break }
  Start-Sleep -Milliseconds 1500
}

do {
if ($loginState -ne 'login') {
  Add-Result 'DM-LOG-002' 'FAIL' "Login no visible tras 90s. Estado: $loginState"
  Add-Result 'DM-LOG-003' 'SKIP' 'No ejecutado (pantalla login no aparecio).'
  Add-Result 'DM-LOG-001' 'SKIP' 'No ejecutado (pantalla login no aparecio).'
  break
}
Write-Host '  Login visible.'

# ─────────────────────────────────────────────────────────────────────────────
# DM-LOG-002 — Campos vacíos
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ''
Write-Host '── DM-LOG-002: pulsar ACEPTAR sin credenciales ──'
$ss002_a = Take-Screenshot "DM-LOG-002_antes_$ts"

$btnCoords = Get-ElemCenter -PageId $pageId -Selector 'ion-button'
if ($btnCoords) { Tap-At -X $btnCoords.x -Y $btnCoords.y }
else            { adb shell input tap 360 875 | Out-Null; Start-Sleep -Milliseconds 500 }

$st002 = Wait-State -PageId $pageId -Expected @('modal_vacios') -ToutSec 12

if ($st002 -eq 'modal_vacios') {
  $ss002_b = Take-Screenshot "DM-LOG-002_modal_$ts"
  Dismiss-Modal -PageId $pageId
  Add-Result 'DM-LOG-002' 'PASS' 'Modal "no pueden ser vacios" visible.' $ss002_b
  Write-Host 'DM-LOG-002: PASS'
} else {
  $ss002_f = Take-Screenshot "DM-LOG-002_fail_$ts"
  Add-Result 'DM-LOG-002' 'FAIL' "Modal vacios no apareció. Estado: $st002" $ss002_f
  Write-Host "DM-LOG-002: FAIL ($st002)"
}

# Descartar cualquier alerta residual y volver a pantalla login
$cur002 = Get-PageState -PageId $pageId
if ($cur002 -match '^modal_') { Dismiss-Modal -PageId $pageId; Start-Sleep -Seconds 1 }
$_ = Wait-State -PageId $pageId -Expected @('login') -ToutSec 15

# ─────────────────────────────────────────────────────────────────────────────
# DM-LOG-003 — Credenciales incorrectas
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ''
Write-Host '── DM-LOG-003: credenciales incorrectas ──'

$uCoords = Get-ElemCenter -PageId $pageId -InputIndex 0
$pCoords = Get-ElemCenter -PageId $pageId -InputIndex 1
$bCoords = Get-ElemCenter -PageId $pageId -Selector 'ion-button'
if (-not $uCoords) { $uCoords = [pscustomobject]@{x=360;y=510} }
if (-not $pCoords) { $pCoords = [pscustomobject]@{x=360;y=650} }
if (-not $bCoords) { $bCoords = [pscustomobject]@{x=360;y=795} }

Tap-At -X $uCoords.x -Y $uCoords.y; Clear-Field; Type-Text $creds.QA_USER
Tap-At -X $pCoords.x -Y $pCoords.y; Clear-Field; Type-Text $creds.QA_BAD_PASSWORD
adb shell input keyevent 111 | Out-Null   # ocultar teclado
Start-Sleep -Milliseconds 600
Tap-At -X $bCoords.x -Y $bCoords.y

$st003 = Wait-State -PageId $pageId -Expected @('modal_incorrect') -ToutSec 30

if ($st003 -eq 'modal_incorrect') {
  $ss003 = Take-Screenshot "DM-LOG-003_modal_$ts"
  Dismiss-Modal -PageId $pageId
  Add-Result 'DM-LOG-003' 'PASS' 'Modal "Usuario y/o contraseña incorrectos" visible.' $ss003
  Write-Host 'DM-LOG-003: PASS'
} else {
  $ss003f = Take-Screenshot "DM-LOG-003_fail_$ts"
  Add-Result 'DM-LOG-003' 'FAIL' "Modal incorrect no apareció. Estado: $st003" $ss003f
  Write-Host "DM-LOG-003: FAIL ($st003)"
}

$_ = Wait-State -PageId $pageId -Expected @('login') -ToutSec 10

# ─────────────────────────────────────────────────────────────────────────────
# DM-LOG-001 — Login exitoso → Home
# ─────────────────────────────────────────────────────────────────────────────
Write-Host ''
Write-Host '── DM-LOG-001: login exitoso ──'

$uC2 = Get-ElemCenter -PageId $pageId -InputIndex 0
$pC2 = Get-ElemCenter -PageId $pageId -InputIndex 1
$bC2 = Get-ElemCenter -PageId $pageId -Selector 'ion-button'
if (-not $uC2) { $uC2 = [pscustomobject]@{x=360;y=510} }
if (-not $pC2) { $pC2 = [pscustomobject]@{x=360;y=650} }
if (-not $bC2) { $bC2 = [pscustomobject]@{x=360;y=795} }

Tap-At -X $uC2.x -Y $uC2.y; Clear-Field; Type-Text $creds.QA_USER
Tap-At -X $pC2.x -Y $pC2.y; Clear-Field; Type-Text $creds.QA_PASSWORD
adb shell input keyevent 111 | Out-Null
Start-Sleep -Milliseconds 600
Tap-At -X $bC2.x -Y $bC2.y

$ss001s = Take-Screenshot "DM-LOG-001_sync_$ts"
Write-Host '  Esperando sincronización y Home (hasta 3 min, descartando modales intermedios)...'

$st001   = 'timeout'
$dl001   = (Get-Date).AddSeconds(180)
while ((Get-Date) -lt $dl001) {
  $s = Get-PageState -PageId $pageId
  if ($s -eq 'home') { $st001 = 'home'; break }
  if ($s -eq 'modal_cambio_usuario') {
    Write-Host '  Descartando modal Recordar Usuario...'
    Dismiss-Modal -PageId $pageId
  }
  Start-Sleep -Milliseconds 900
}

if ($st001 -eq 'home') {
  $ss001h = Take-Screenshot "DM-LOG-001_home_$ts"
  Add-Result 'DM-LOG-001' 'PASS' 'Sincronización completa. Home con módulo Visitas visible.' $ss001h
  Write-Host 'DM-LOG-001: PASS'
} else {
  $ss001f = Take-Screenshot "DM-LOG-001_fail_$ts"
  Add-Result 'DM-LOG-001' 'FAIL' "No llegó a Home en 3 min. Estado final: $st001" $ss001f
  Write-Host "DM-LOG-001: FAIL ($st001)"
}

} while ($false)

# ── Reporte ───────────────────────────────────────────────────────────────────
$sw.Stop()
$elapsed   = [math]::Round($sw.Elapsed.TotalSeconds, 1)
$passCount = @($results | Where-Object Status -eq 'PASS').Count
$failCount = @($results | Where-Object Status -eq 'FAIL').Count
$skipCount = @($results | Where-Object Status -eq 'SKIP').Count
$overall   = if ($failCount -eq 0 -and $skipCount -eq 0 -and $passCount -ge 3) { 'PASS' } else { 'FAIL' }
$device    = (adb devices | Select-String 'device$' | Select-Object -First 1).ToString().Split("`t")[0]

$lines = @(
  '# Login smoke (CDP+ADB)',
  '',
  "- **Fecha:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "- **Dispositivo:** $device",
  "- **Modo:** CDP + ADB (WebView Ionic/Capacitor)",
  "- **Duracion:** ${elapsed}s",
  "- **Resultado global:** **$overall** ($passCount PASS · $failCount FAIL · $skipCount SKIP)",
  '',
  '## Detalle por caso',
  '',
  '| Caso | Estado | Detalle | Evidencia |',
  '|------|--------|---------|-----------|'
)
foreach ($r in $results) {
  $link = if ($r.Ss) { "[$($r.Ss)]($($r.Ss))" } else { '—' }
  $lines += "| $($r.Id) | **$($r.Status)** | $($r.Detail) | $link |"
}
$lines += @(
  '',
  '## Cobertura del guion',
  '',
  '| ID | Descripcion | Automatizado |',
  '|----|-------------|--------------|',
  '| DM-LOG-001 | Login exitoso -> Home | Si |',
  '| DM-LOG-002 | Campos vacios -> modal | Si |',
  '| DM-LOG-003 | Contrasena incorrecta -> modal | Si |',
  '| DM-LOG-004..017 | Recordar usuario, toggle, cambio usuario, UI, etc. | No (manual) |',
  '',
  '> Los casos 004-017 requieren interaccion manual (cerrar/reabrir app, dos usuarios QA, rotar dispositivo).'
)

$lines | Set-Content -Path $reportFile -Encoding UTF8

Write-Host ''
Write-Host '══════════════════════════════════════════'
Write-Host "RESULTADO GLOBAL : $overall"
Write-Host "  PASS: $passCount   FAIL: $failCount   SKIP: $skipCount"
Write-Host "  Duración: ${elapsed}s"
Write-Host "  Reporte : $reportFile"
Write-Host "  Screenshots: $ssDir"
Write-Host '══════════════════════════════════════════'

if ($overall -eq 'FAIL') { exit 1 }
exit 0
