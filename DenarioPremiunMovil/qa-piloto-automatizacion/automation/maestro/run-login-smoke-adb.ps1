# Piloto login con adb (estable en WebView Ionic/Capacitor).
# Casos: DM-LOG-003, DM-LOG-001 — una sola sesion, fail-fast.
# Uso: .\run-login-smoke-adb.ps1

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pilotRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$secretsFile = Join-Path $pilotRoot 'secrets\qa-credentials.env'
$reportsDir = Join-Path $scriptDir '..\reports'
$uiLib = Join-Path $scriptDir 'lib\DenarioAndroidUi.ps1'

if (-not (Test-Path $secretsFile)) {
  Write-Error "No existe $secretsFile"
}

. $uiLib

$creds = Read-DenarioEnvFile -Path $secretsFile
foreach ($key in @('QA_USER', 'QA_PASSWORD', 'QA_BAD_PASSWORD')) {
  if ([string]::IsNullOrWhiteSpace($creds[$key])) {
    Write-Error "Falta $key en qa-credentials.env"
  }
}

if (-not (Test-DenarioPasswordAutomationSafe -Password $creds.QA_BAD_PASSWORD)) {
  Write-Warning "QA_BAD_PASSWORD tiene caracteres especiales; adb puede no escribirla. Usa alfanumerico (ej. WrongPass003)."
}

$deviceId = (adb devices | Select-String 'device$' | Select-Object -First 1).ToString().Split("`t")[0]
if ([string]::IsNullOrWhiteSpace($deviceId)) {
  Write-Error 'No hay dispositivo Android conectado.'
}

New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
$reportFile = Join-Path $reportsDir ("login-smoke-adb_{0:yyyyMMdd_HHmmss}.md" -f (Get-Date))
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

$results = @()

function Add-CaseResult {
  param(
    [string]$CaseId,
    [string]$Status,
    [string]$Detail
  )

  $script:results += [pscustomobject]@{
    CaseId = $CaseId
    Status = $Status
    Detail = $Detail
  }
}

Write-Host "Dispositivo: $deviceId"
Write-Host 'Modo: adb rapido (WebView Ionic)'
Write-Host ''

adb shell settings put global window_animation_scale 0 | Out-Null
adb shell settings put global transition_animation_scale 0 | Out-Null
adb shell settings put global animator_duration_scale 0 | Out-Null

try {
  Reset-DenarioAppSession
  Wait-DenarioLoginScreen

  # DM-LOG-002 — campos vacios
  Write-Host 'DM-LOG-002: campos vacios...'
  $acceptButton002 = Wait-DenarioUiNode -XPath "//node[@text='ACEPTAR']" -TimeoutSec 10
  if ($acceptButton002) { Invoke-DenarioTapBounds -Bounds $acceptButton002.bounds }
  $outcome002 = Wait-DenarioLoginOutcome -TimeoutSec 15

  if ($outcome002 -eq 'vacios') {
    Invoke-DenarioModalOk
    Add-CaseResult -CaseId 'DM-LOG-002' -Status 'PASS' -Detail 'Modal "no pueden ser vacios" visible y descartado.'
    Write-Host 'DM-LOG-002: PASS'
    Wait-DenarioLoginScreen
  } else {
    $visible = (Get-DenarioVisibleTexts) -join ' | '
    Add-CaseResult -CaseId 'DM-LOG-002' -Status 'FAIL' -Detail "Sin modal vacios en 15s. UI: $visible"
    Write-Host "DM-LOG-002: FAIL ($visible)"
    throw 'Abortando: DM-LOG-002 no completo.'
  }

  # DM-LOG-003
  Write-Host 'DM-LOG-003: credenciales incorrectas...'
  Invoke-DenarioLoginAttempt -User $creds.QA_USER -Password $creds.QA_BAD_PASSWORD
  $outcome003 = Wait-DenarioLoginOutcome -TimeoutSec 25

  if ($outcome003 -eq 'incorrect') {
    Invoke-DenarioModalOk
    Add-CaseResult -CaseId 'DM-LOG-003' -Status 'PASS' -Detail 'Modal credenciales incorrectas.'
    Write-Host 'DM-LOG-003: PASS'
  }
  elseif ($outcome003 -eq 'vacios') {
    Invoke-DenarioModalOk
    Add-CaseResult -CaseId 'DM-LOG-003' -Status 'FAIL' -Detail 'Campos vacios: la automatizacion no escribio usuario/contrasena.'
    Write-Host 'DM-LOG-003: FAIL (campos vacios — no se escribio en los campos)'
    throw 'Abortando: login no escribio credenciales.'
  }
  else {
    $visible = (Get-DenarioVisibleTexts) -join ' | '
    Add-CaseResult -CaseId 'DM-LOG-003' -Status 'FAIL' -Detail "Sin modal esperado en 25s. UI: $visible"
    Write-Host "DM-LOG-003: FAIL ($visible)"
    throw 'Abortando: DM-LOG-003 no completo.'
  }

  # DM-LOG-001 — misma sesion, sin pm clear
  Write-Host 'DM-LOG-001: login exitoso...'
  Invoke-DenarioLoginAttempt -User $creds.QA_USER -Password $creds.QA_PASSWORD -ClearFieldsFirst
  $outcome001 = Wait-DenarioLoginOutcome -TimeoutSec 15

  if ($outcome001 -eq 'vacios') {
    Invoke-DenarioModalOk
    Add-CaseResult -CaseId 'DM-LOG-001' -Status 'FAIL' -Detail 'Campos vacios tras reintento de login.'
    Write-Host 'DM-LOG-001: FAIL (campos vacios)'
  }
  elseif ($outcome001 -in @('loading', 'timeout', 'incorrect')) {
    $reachedHome = Wait-DenarioHome -TimeoutSec 120
    if ($reachedHome) {
      Add-CaseResult -CaseId 'DM-LOG-001' -Status 'PASS' -Detail 'Home con modulo Visitas.'
      Write-Host 'DM-LOG-001: PASS'
    }
    else {
      $visible = (Get-DenarioVisibleTexts) -join ' | '
      Add-CaseResult -CaseId 'DM-LOG-001' -Status 'FAIL' -Detail "No llego a Home. UI: $visible"
      Write-Host "DM-LOG-001: FAIL ($visible)"
    }
  }
  elseif ($outcome001 -eq 'home') {
    Add-CaseResult -CaseId 'DM-LOG-001' -Status 'PASS' -Detail 'Home con modulo Visitas.'
    Write-Host 'DM-LOG-001: PASS'
  }
}
catch {
  if (@($results | Where-Object CaseId -eq 'DM-LOG-002').Count -eq 0) {
    Add-CaseResult -CaseId 'DM-LOG-002' -Status 'FAIL' -Detail $_.Exception.Message
    Write-Host "DM-LOG-002: FAIL ($($_.Exception.Message))"
  }
  if (@($results | Where-Object CaseId -eq 'DM-LOG-003').Count -eq 0) {
    Add-CaseResult -CaseId 'DM-LOG-003' -Status 'SKIP' -Detail 'No ejecutado por fallo previo.'
  }
  if (@($results | Where-Object CaseId -eq 'DM-LOG-001').Count -eq 0) {
    Add-CaseResult -CaseId 'DM-LOG-001' -Status 'SKIP' -Detail 'No ejecutado por fallo previo.'
  }
}

$stopwatch.Stop()
$passCount = @($results | Where-Object Status -eq 'PASS').Count
$failCount = @($results | Where-Object Status -eq 'FAIL').Count
$overall = if ($failCount -eq 0 -and $passCount -eq 3) { 'PASS' } else { 'FAIL' }
$elapsedSec = [math]::Round($stopwatch.Elapsed.TotalSeconds, 1)

$report = @(
  '# Login smoke (adb)',
  '',
  "- Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "- Dispositivo: $deviceId",
  "- Duracion: ${elapsedSec}s",
  "- Resultado global: **$overall**",
  '',
  '| Caso | Estado | Detalle |',
  '|------|--------|---------|'
)

foreach ($row in $results) {
  $report += "| $($row.CaseId) | $($row.Status) | $($row.Detail) |"
}

$report | Set-Content -Path $reportFile -Encoding UTF8

Write-Host ''
Write-Host "RESULTADO GLOBAL: $overall ($passCount PASS, $failCount FAIL) en ${elapsedSec}s"
Write-Host "Reporte: $reportFile"

if ($overall -eq 'FAIL') { exit 1 }
exit 0
