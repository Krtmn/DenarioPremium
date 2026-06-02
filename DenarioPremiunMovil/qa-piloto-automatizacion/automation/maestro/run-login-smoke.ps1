# Ejecuta piloto login (DM-LOG-003, DM-LOG-001)
# Por defecto usa adb (estable en WebView Ionic). Maestro puro: -Mode Maestro
# Uso: .\run-login-smoke.ps1

param(
  [ValidateSet('Adb', 'Maestro')]
  [string]$Mode = 'Adb'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($Mode -eq 'Adb') {
  & (Join-Path $scriptDir 'run-login-smoke-adb.ps1')
  exit $LASTEXITCODE
}

$ErrorActionPreference = 'Stop'
$pilotRoot = Resolve-Path (Join-Path $scriptDir '..\..')
$secretsFile = Join-Path $pilotRoot 'secrets\qa-credentials.env'
$flowFile = Join-Path $scriptDir 'flows\login-smoke-lite.yaml'
$reportsDir = Join-Path $scriptDir '..\reports'

if (-not (Test-Path $secretsFile)) {
  Write-Error "No existe $secretsFile. Copia qa-credentials.env.example y completa valores."
}

if (-not (Test-Path $flowFile)) {
  Write-Error "No existe $flowFile"
}

$deviceId = (adb devices | Select-String 'device$' | Select-Object -First 1).ToString().Split("`t")[0]
if ([string]::IsNullOrWhiteSpace($deviceId)) {
  Write-Error 'No hay dispositivo Android conectado (adb devices).'
}

New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null

$maestroArgs = @('test', $flowFile)
Get-Content $secretsFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
    $key = $matches[1]
    $value = $matches[2].Trim().Trim('"').Trim("'")
    if ($value -ne '') {
      $maestroArgs += '-e'
      $maestroArgs += "${key}=${value}"
    }
  }
}

Write-Host "Dispositivo: $deviceId"
Write-Host 'Modo: Maestro (experimental en WebView — puede colgarse en inputText)'
Write-Host ''
Write-Host 'Preflight: reiniciando adb y cerrando sesiones Maestro previas...'
Get-Process -Name maestro -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
adb kill-server | Out-Null
Start-Sleep -Seconds 1
adb start-server | Out-Null
Start-Sleep -Seconds 1
Write-Host ''
Write-Host 'Limpiando datos de la app...'
adb shell am force-stop com.kiberno.denarioPremiumPro | Out-Null
adb shell pm clear com.kiberno.denarioPremiumPro | Out-Null
Start-Sleep -Seconds 4
adb shell settings put global window_animation_scale 0 | Out-Null
adb shell settings put global transition_animation_scale 0 | Out-Null
adb shell settings put global animator_duration_scale 0 | Out-Null
Write-Host ''
Write-Host 'Ejecutando Maestro: login-smoke-lite.yaml'
Write-Host 'Nota: cada paso puede tardar hasta ~2 min. Ctrl+C para cancelar.'
Write-Host "Reportes: $reportsDir"
Write-Host ''

Push-Location $scriptDir
try {
  & maestro --device $deviceId @maestroArgs
  $exitCode = $LASTEXITCODE
}
finally {
  Pop-Location
}

if ($exitCode -eq 0) {
  Write-Host ''
  Write-Host 'RESULTADO: PASS (003 y 001 completaron)'
}
else {
  Write-Host ''
  Write-Host "RESULTADO: FAIL (exit code $exitCode). Prueba: .\\run-login-smoke.ps1 -Mode Adb"
}

exit $exitCode
