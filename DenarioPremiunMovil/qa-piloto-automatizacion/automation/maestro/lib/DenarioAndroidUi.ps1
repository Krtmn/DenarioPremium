# Helpers adb + uiautomator para Denario Premium movil (piloto QA).

$script:DenarioPackage = 'com.kiberno.denarioPremiumPro'
$script:DenarioMainActivity = 'com.kiberno.denarioPremiumPro/.MainActivity'
$script:DenarioPollMs = 800

function Invoke-DenarioAdb {
  param([string[]]$Args)

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & adb @Args 2>&1 | Out-Null
    return $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Get-DenarioUiDumpPath {
  Invoke-DenarioAdb -Args @('shell', 'uiautomator', 'dump', '/sdcard/window_dump.xml') | Out-Null
  $localPath = Join-Path $env:TEMP 'denario-ui-dump.xml'
  Invoke-DenarioAdb -Args @('pull', '/sdcard/window_dump.xml', $localPath) | Out-Null
  return $localPath
}

function Wait-DenarioUiNode {
  param(
    [string]$XPath,
    [int]$TimeoutSec = 30
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $path = Get-DenarioUiDumpPath
    if (Test-Path $path) {
      $raw = Get-Content $path -Raw -ErrorAction SilentlyContinue
      if ($raw -and $raw.Length -gt 3000) {
        [xml]$xml = $raw
        $node = $xml.SelectSingleNode($XPath)
        if ($node) { return $node }
      }
    }
    Start-Sleep -Milliseconds $script:DenarioPollMs
  }

  return $null
}

function Invoke-DenarioTapBounds {
  param([string]$Bounds)

  if ($Bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    throw "Bounds invalidos: $Bounds"
  }

  $x = [int](([int]$matches[1] + [int]$matches[3]) / 2)
  $y = [int](([int]$matches[2] + [int]$matches[4]) / 2)
  adb shell input tap $x $y 2>$null | Out-Null
}

function Send-DenarioAdbText {
  param([string]$Text)

  if ([string]::IsNullOrEmpty($Text)) { return }

  if ($Text -match '^[A-Za-z0-9]+$') {
    adb shell input text $Text | Out-Null
    return
  }

  foreach ($char in $Text.ToCharArray()) {
    if ($char -match '[A-Za-z0-9]') {
      adb shell input text $char | Out-Null
    }
    elseif ($char -eq '-') {
      adb shell input keyevent 69 | Out-Null
    }
    elseif ($char -eq ' ') {
      adb shell input keyevent 62 | Out-Null
    }
    else {
      adb shell input text "\$char" | Out-Null
    }
    Start-Sleep -Milliseconds 60
  }
}

function Clear-DenarioInputField {
  param([string]$ResourceId)

  $field = Wait-DenarioUiNode -XPath "//node[@resource-id='$ResourceId']" -TimeoutSec 5
  if (-not $field) { return }

  Invoke-DenarioTapBounds -Bounds $field.bounds
  Start-Sleep -Milliseconds 400
  for ($i = 0; $i -lt 24; $i++) {
    adb shell input keyevent 67 | Out-Null
  }
  Start-Sleep -Milliseconds 300
}

function Hide-DenarioKeyboard {
  adb shell input keyevent 111 | Out-Null
}

function Start-DenarioApp {
  Invoke-DenarioAdb -Args @(
    'shell', 'monkey', '-p', $script:DenarioPackage,
    '-c', 'android.intent.category.LAUNCHER', '1'
  ) | Out-Null
}

function Wake-DenarioDevice {
  Invoke-DenarioAdb -Args @('shell', 'input', 'keyevent', '224') | Out-Null
  Invoke-DenarioAdb -Args @('shell', 'input', 'keyevent', '82') | Out-Null
  Start-Sleep -Milliseconds 500
}

function Reset-DenarioAppSession {
  Wake-DenarioDevice
  Invoke-DenarioAdb -Args @('shell', 'am', 'force-stop', $script:DenarioPackage) | Out-Null
  Invoke-DenarioAdb -Args @('shell', 'pm', 'clear', $script:DenarioPackage) | Out-Null
  Start-Sleep -Seconds 3
  Start-DenarioApp
  Start-Sleep -Seconds 10
}

function Wait-DenarioLoginScreen {
  $node = Wait-DenarioUiNode -XPath "//node[@resource-id='ion-input-0']" -TimeoutSec 60
  if (-not $node) {
    throw 'No aparecio la pantalla de login (ion-input-0).'
  }
}

function Get-DenarioVisibleTexts {
  $path = Get-DenarioUiDumpPath
  [xml]$xml = Get-Content $path
  return @($xml.SelectNodes("//node[@text!='']") | ForEach-Object { $_.text })
}

function Get-DenarioUserFieldText {
  $path = Get-DenarioUiDumpPath
  [xml]$xml = Get-Content $path
  $node = $xml.SelectSingleNode("//node[@resource-id='ion-input-0']")
  if ($node) { return $node.text }
  return ''
}

function Test-DenarioPasswordAutomationSafe {
  param([string]$Password)

  return $Password -match '^[A-Za-z0-9]+$'
}

function Invoke-DenarioLoginAttempt {
  param(
    [string]$User,
    [string]$Password,
    [switch]$ClearFieldsFirst
  )

  if ($ClearFieldsFirst) {
    Clear-DenarioInputField -ResourceId 'ion-input-0'
    Clear-DenarioInputField -ResourceId 'ion-input-1'
  }

  $userField = Wait-DenarioUiNode -XPath "//node[@resource-id='ion-input-0']" -TimeoutSec 8
  $passField = Wait-DenarioUiNode -XPath "//node[@resource-id='ion-input-1']" -TimeoutSec 5
  if (-not $userField -or -not $passField) {
    throw 'No se encontraron campos ion-input-0 / ion-input-1.'
  }

  Invoke-DenarioTapBounds -Bounds $userField.bounds
  Start-Sleep -Milliseconds 500
  Send-DenarioAdbText -Text $User
  Start-Sleep -Milliseconds 400

  $typedUser = Get-DenarioUserFieldText
  if ($typedUser -ne $User) {
    throw "El usuario no se escribio en el campo (esperado '$User', actual '$typedUser')."
  }

  Invoke-DenarioTapBounds -Bounds $passField.bounds
  Start-Sleep -Milliseconds 700
  Send-DenarioAdbText -Text $Password
  Start-Sleep -Milliseconds 400

  Hide-DenarioKeyboard
  Start-Sleep -Milliseconds 400

  $acceptButton = Wait-DenarioUiNode -XPath "//node[@text='ACEPTAR']" -TimeoutSec 5
  Invoke-DenarioTapBounds -Bounds $acceptButton.bounds
}

function Wait-DenarioLoginOutcome {
  param([int]$TimeoutSec = 20)

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $joined = ((Get-DenarioVisibleTexts) -join ' ')
    if ($joined -match 'vacios') { return 'vacios' }
    if ($joined -match 'incorrect') { return 'incorrect' }
    if ($joined -match 'Visitas') { return 'home' }
    if ($joined -match 'Cargando|Por favor espere|sincroniz') { return 'loading' }
    Start-Sleep -Milliseconds $script:DenarioPollMs
  }

  return 'timeout'
}

function Wait-DenarioHome {
  param([int]$TimeoutSec = 120)

  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $joined = ((Get-DenarioVisibleTexts) -join ' ')
    if ($joined -match 'Visitas') { return $true }
    Start-Sleep -Milliseconds $script:DenarioPollMs
  }

  return $false
}

function Invoke-DenarioModalOk {
  $okButton = Wait-DenarioUiNode -XPath "//node[@text='OK']" -TimeoutSec 8
  if ($okButton) {
    Invoke-DenarioTapBounds -Bounds $okButton.bounds
    Start-Sleep -Milliseconds 600
  }
}

function Read-DenarioEnvFile {
  param([string]$Path)

  $values = @{}
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq '' -or $line.StartsWith('#')) { return }
    if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $values[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $values
}
