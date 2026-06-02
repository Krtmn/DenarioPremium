# Guía: Correr Denario Premium Móvil con Capacitor en Android (Windows)

**Proyecto:** Denario Premium Móvil  
**Stack:** Ionic + Angular 19 + Capacitor 6  
**Plataforma de desarrollo:** Windows 11  
**Fecha de documentación:** Mayo 2026  

---

## Tabla de Contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Flujo completo de ejecución](#2-flujo-completo-de-ejecución)
3. [Error 1 — Build de Angular falla por targets de navegador](#3-error-1--build-de-angular-falla-por-targets-de-navegador)
4. [Error 2 — `npx cap run android` falla en Windows (gradlew no reconocido)](#4-error-2--npx-cap-run-android-falla-en-windows-gradlew-no-reconocido)
5. [Error 3 — `Unable to parse TLS packet header` (fallo de conexión al servidor)](#5-error-3--unable-to-parse-tls-packet-header-fallo-de-conexión-al-servidor)
6. [Error 4 — Permisos faltantes en AndroidManifest](#6-error-4--permisos-faltantes-en-androidmanifest)
7. [Cómo conectarse al Chrome Inspector para depurar la app en el dispositivo](#7-cómo-conectarse-al-chrome-inspector-para-depurar-la-app-en-el-dispositivo)
8. [Script de re-despliegue rápido (flujo habitual)](#8-script-de-re-despliegue-rápido-flujo-habitual)
9. [Archivos modificados — Resumen](#9-archivos-modificados--resumen)

---

## 1. Requisitos previos

Antes de comenzar asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Java JDK | 17 o 19 | `java -version` |
| Android SDK + ADB | API 29+ | `adb version` |

> **Nota sobre Java:** El proyecto fue probado con Java 19. Si tienes problemas con Gradle, instala Java 17 (LTS) que es la versión oficialmente recomendada por Android.

### Configurar variables de entorno necesarias

Asegúrate de que las siguientes variables de entorno estén configuradas en tu sistema Windows:

```
ANDROID_HOME = C:\Users\<tu_usuario>\AppData\Local\Android\Sdk
JAVA_HOME    = C:\Program Files\Java\jdk-19  (o tu ruta de JDK)
```

Y que las siguientes rutas estén en el `PATH`:

```
%ANDROID_HOME%\platform-tools     (para adb)
%ANDROID_HOME%\tools
%JAVA_HOME%\bin
```

### Habilitar depuración USB en el dispositivo Android

1. En el teléfono: **Ajustes → Acerca del teléfono → Número de compilación** (tocar 7 veces para activar "Opciones de desarrollador")
2. **Ajustes → Opciones de desarrollador → Depuración USB** → Activar
3. Conectar el teléfono por USB y en el popup del teléfono elegir **"Permitir depuración USB"**
4. Verificar que el dispositivo es reconocido:

```powershell
adb devices
# Debe aparecer algo como:
# 14678405BR003855    device
```

Si aparece `unauthorized`, desconecta y vuelve a conectar el cable y acepta el popup de autorización en el teléfono.

---

## 2. Flujo completo de ejecución

Este es el flujo que se debe seguir **cada vez** que se quiera desplegar la app al dispositivo. Los pasos 3 y 4 son necesarios solo la primera vez o cuando cambien las dependencias nativas; para cambios de código solo bastará con el paso 1.

```
Paso 1: npm run build          → Compila Angular → genera carpeta www/
Paso 2: npx cap sync android   → Copia www/ al proyecto Android y actualiza plugins
Paso 3: (desde /android) .\gradlew.bat assembleDebug   → Compila el APK
Paso 4: adb install -r <ruta-al-apk>                   → Instala en el dispositivo
Paso 5: adb shell monkey -p com.kiberno.denarioPremiumPro -c android.intent.category.LAUNCHER 1  → Lanza la app
```

### Comandos exactos (copiar y pegar en PowerShell desde la raíz del proyecto)

```powershell
# Desde: C:\Users\Personal\OneDrive\Documentos\kiberno\DenarioPremium\DenarioPremiunMovil

# 1. Build Angular
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Compilar APK (cambiar al directorio android)
Set-Location android
.\gradlew.bat assembleDebug

# 4. Instalar en el dispositivo
Set-Location ..
adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"

# 5. Lanzar la app
adb shell monkey -p com.kiberno.denarioPremiumPro -c android.intent.category.LAUNCHER 1
```

> **Tip de velocidad:** Una vez que ya compilaste todo al menos una vez, Gradle cachea la mayoría de las tareas. Las compilaciones subsiguientes tardan ~8 segundos en lugar de ~80 segundos.

---

## 3. Error 1 — Build de Angular falla por targets de navegador

### Síntoma

Al correr `npm run build`, el proceso falla con muchos errores de este tipo:

```
Error: Optimization error [2375.050e2cc05bf26930.js]: X [ERROR] Transforming destructuring 
to the configured target environment ("chrome79.0", "edge79.0", "firefox70.0", "ios14.0", 
"safari14.0") is not supported yet

    2375.050e2cc05bf26930.js:82:12:
      82 │       const {
         ╵             ^
```

### Causa

El archivo `.browserslistrc` apuntaba a versiones de navegadores muy antiguas (`Safari 14`, `iOS 14`). Angular 19 usa **esbuild** como optimizador, y esbuild no puede transpilar ciertas sintaxis modernas de JavaScript (como destructuring en parámetros de función) a targets tan viejos. Las dependencias `pdfmake`, `html2canvas` y `canvg` usan esa sintaxis moderna.

### Solución

Actualizar `.browserslistrc` en la raíz del proyecto para apuntar a versiones más modernas:

**Archivo:** `.browserslistrc`

```diff
- Chrome >=79
- ChromeAndroid >=79
- Firefox >=70
- Edge >=79
- Safari >=14
- iOS >=14
+ Chrome >=87
+ ChromeAndroid >=87
+ Firefox >=78
+ Edge >=87
+ Safari >=16
+ iOS >=16
```

**¿Por qué estos valores?**  
- Chrome 87 y Edge 87 (finales de 2020) soportan todas las funciones ES2020 que usan las dependencias
- Safari 16 / iOS 16 (2022) es necesario para que esbuild no intente transpilar destructuring
- No impacta en producción Android porque Capacitor usa el WebView de Chrome (ya en versiones 90+)

### Verificación

Después del cambio, `npm run build` debe completar con warnings (sobre CommonJS) pero sin errores:

```
Build at: 2026-05-25T20:45:46.571Z - Hash: 5fc120641d80d324 - Time: 112343ms
Warning: bundle initial exceeded maximum budget...
```

El warning de "bundle exceeded maximum budget" no es un error — el bundle de 5.44 MB es esperado dado el tamaño de la app.

---

## 4. Error 2 — `npx cap run android` falla en Windows (gradlew no reconocido)

### Síntoma

Al correr `npx cap run android`, el proceso falla con:

```
× Running Gradle build - failed!
[error] "gradlew" no se reconoce como un comando interno o externo,
        programa o archivo por lotes ejecutable.
```

### Causa

El CLI de Capacitor, al invocar Gradle en Windows, busca el ejecutable `gradlew` (sin extensión, al estilo Unix). En Windows, el archivo de Gradle Wrapper se llama `gradlew.bat`. El CLI de Capacitor no resuelve esto automáticamente en Windows.

### Solución

**No usar `npx cap run android` en Windows.** En su lugar, ejecutar los pasos de build e instalación manualmente:

```powershell
# En lugar de: npx cap run android
# Hacer esto:

# Primero sincronizar (equivalente a lo que hace cap run internamente)
npx cap sync android

# Luego compilar con Gradle usando la extensión .bat correcta
Set-Location android
.\gradlew.bat assembleDebug

# Luego instalar y lanzar manualmente con ADB
Set-Location ..
adb install -r "android\app\build\outputs\apk\debug\app-debug.apk"
adb shell monkey -p com.kiberno.denarioPremiumPro -c android.intent.category.LAUNCHER 1
```

> **Nota:** `npx cap sync android` SÍ funciona correctamente en Windows — solo el subcomando `run` falla. El sync copia los assets web al proyecto Android correctamente.

---

## 5. Error 3 — `Unable to parse TLS packet header` (fallo de conexión al servidor)

### Síntoma

Al abrir la app e intentar iniciar sesión, el login falla silenciosamente o muestra "Ocurrió un error de comunicación con el servidor". En la consola del Chrome Inspector aparece:

```
w: Unable to parse TLS packet header
    at returnResult (<anonymous>:956:32)
    at win.androidBridge.onmessage (<anonymous>:931:21)
```

### Diagnóstico

Este error tiene **dos causas posibles** y para identificar cuál aplica se usó el Chrome Inspector (ver sección 7). Se ejecutó una petición de prueba directamente desde el contexto del WebView via CDP:

```javascript
// Prueba 1: con HTTPS (como estaba configurado)
fetch('https://denarioelyaque.ddns.net:8081/PremiumWS/services/authservice/auth', ...)
// Resultado: { "error": "Unable to parse TLS packet header" }

// Prueba 2: con HTTP
fetch('http://denarioelyaque.ddns.net:8081/PremiumWS/services/authservice/auth', ...)
// Resultado: { "error": "Cleartext HTTP traffic to denarioelyaque.ddns.net not permitted" }
```

**Conclusión del diagnóstico:**
- La prueba con `https://` falla porque el servidor corre HTTP plano en el puerto 8081 (no tiene TLS). Al intentar un handshake TLS, el servidor responde con texto HTTP plano que no puede ser parseado como paquete TLS.
- La prueba con `http://` falla porque Android 9+ bloquea tráfico cleartext (HTTP) por defecto.

La URL en `www/claves.env` tenía `https://` pero el servidor solo acepta `http://`.

### Solución — Dos cambios necesarios

#### Cambio 1: Corregir la URL del servidor en `www/claves.env`

**Archivo:** `www/claves.env`

```diff
- WsUrl = "https://denarioelyaque.ddns.net:8081/PremiumWS/services/"
+ WsUrl = "http://denarioelyaque.ddns.net:8081/PremiumWS/services/"
```

> **Importante:** Este archivo NO está versionado en git (es correcto, contiene configuración sensible). Cada desarrollador debe tenerlo localmente. Si lo perdiste, hay una plantilla en `.gitignore` con los campos disponibles.

#### Cambio 2: Crear `network_security_config.xml` y permitir tráfico HTTP al servidor

Android 9+ bloquea HTTP (cleartext) por defecto. Hay que crear una excepción explícita para el dominio del servidor.

**Crear archivo:** `android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">denarioelyaque.ddns.net</domain>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </domain-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

**Qué hace cada sección:**
- `base-config`: Por defecto bloquea HTTP y solo confía en certificados del sistema (seguro para el resto de dominios)
- `domain-config` con `cleartextTrafficPermitted="true"`: Permite HTTP específicamente para `denarioelyaque.ddns.net` y sus subdominios
- `debug-overrides`: En builds debug, también confía en certificados instalados por el usuario (útil para probar con certificados de desarrollo)

#### Cambio 3: Referenciar el archivo en `AndroidManifest.xml`

**Archivo:** `android/app/src/main/AndroidManifest.xml`

Agregar el atributo `android:networkSecurityConfig` al tag `<application>`:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:networkSecurityConfig="@xml/network_security_config">  <!-- AGREGAR ESTO -->
```

### Verificación

Después de estos cambios, recompilar y reinstalar. Al intentar login con `001` / `123456` la respuesta del servidor debe ser exitosa (`errorCode: "000"`).

---

## 6. Error 4 — Permisos faltantes en AndroidManifest

### Síntoma

Después de loguearse exitosamente, al intentar crear cualquier transacción (pedido, visita, cobro, inventario, devolución, depósito) aparece un error similar a:

```
Missing the following permissions in AndroidManifest:
android.permission.ACCESS_FINE_LOCATION
android.permission.ACCESS_COARSE_LOCATION
```

O la acción simplemente falla silenciosamente (foto, adjunto de archivo, etc.).

### Causa

El `AndroidManifest.xml` original solo tenía declarado el permiso `INTERNET`. Todos los demás permisos que los plugins de Capacitor necesitan estaban ausentes. Android requiere que cada permiso que la app va a usar en tiempo de ejecución esté **declarado en el Manifest**.

### Plugins que requieren permisos y cuáles son

| Plugin | Permiso necesario | Uso en la app |
|---|---|---|
| `@capacitor/geolocation` | `ACCESS_FINE_LOCATION` | Captura de coordenadas en todas las transacciones |
| `@capacitor/geolocation` | `ACCESS_COARSE_LOCATION` | Requerido junto con FINE por el plugin |
| `@capacitor/camera` | `CAMERA` | Fotos adjuntas en transacciones |
| `@capacitor/filesystem` | `READ_EXTERNAL_STORAGE` (API ≤ 32) | Leer archivos adjuntos en Android 9–12 |
| `@capacitor/filesystem` | `WRITE_EXTERNAL_STORAGE` (API ≤ 29) | Guardar fotos/firmas en Android 9 |
| `@capacitor/filesystem` + `@capawesome/capacitor-file-picker` | `READ_MEDIA_IMAGES` | Leer imágenes en Android 13+ |
| `@capacitor/filesystem` + `@capawesome/capacitor-file-picker` | `READ_MEDIA_VIDEO` | Leer videos en Android 13+ |
| `@capacitor/filesystem` + `@capawesome/capacitor-file-picker` | `READ_MEDIA_AUDIO` | Leer audio en Android 13+ |
| `@capacitor/haptics` | `VIBRATE` | Feedback táctil en acciones |

### Solución

**Archivo:** `android/app/src/main/AndroidManifest.xml`

Reemplazar la sección de permisos con el bloque completo:

```xml
    <!-- Permissions -->

    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Location (geolocation service + visitas/pedidos/cobros) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Camera (adjuntos / fotos en transacciones) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <!-- Storage: Android 9 y anteriores -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />

    <!-- Storage: Android 13+ (API 33+) para leer imágenes y archivos adjuntos -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <!-- Haptics -->
    <uses-permission android:name="android.permission.VIBRATE" />
```

> **Nota sobre `android:required="false"` en la cámara:** Se agrega la `uses-feature` con `required="false"` para que la app pueda instalarse en dispositivos sin cámara. Si la marcas como `required="true"` (o simplemente no la declaras), Google Play y Android la tratarán como requerida y no mostrará la app en dispositivos sin cámara.

> **Nota sobre permisos en tiempo de ejecución:** Declarar el permiso en el Manifest es condición necesaria pero no suficiente. Para permisos "peligrosos" (ubicación, cámara, almacenamiento), Android también requiere que la app los solicite en tiempo de ejecución. El código de `GeolocationService` ya hace esto correctamente con `Geolocation.requestPermissions()`. El plugin `@capacitor/camera` también maneja su propio popup de permisos.

---

## 7. Cómo conectarse al Chrome Inspector para depurar la app en el dispositivo

Chrome expone un protocolo de depuración remota (CDP - Chrome DevTools Protocol) que permite inspeccionar el WebView de la app Capacitor directamente desde tu computadora. Esto fue clave para diagnosticar el error de TLS.

### Opción A: Usar chrome://inspect (más simple)

1. Abre Google Chrome en tu computadora
2. Navega a `chrome://inspect`
3. En la sección **"Remote Target"** deberías ver el dispositivo conectado y la app Denario
4. Haz click en **"inspect"** debajo de "Denario Premium Movil"
5. Se abre DevTools conectado al WebView — puedes usar Console, Network, Sources, etc.

### Opción B: Conectarse via ADB port-forward (para herramientas automatizadas o scripts)

Esta opción permite ejecutar JavaScript en el contexto del WebView y es más potente para diagnósticos automatizados.

```powershell
# 1. Encontrar el socket del WebView en el dispositivo
adb shell "cat /proc/net/unix | grep webview_devtools"
# Salida ejemplo:
# @webview_devtools_remote_8778

# 2. Hacer port-forward del socket al puerto local 9222
adb forward tcp:9222 localabstract:webview_devtools_remote_8778

# 3. Verificar que funciona — consultar las páginas disponibles
Invoke-RestMethod -Uri "http://localhost:9222/json"
# Debe mostrar el ID de la página y la URL actual de la app

# 4. Ejecutar JavaScript en el WebView (ejemplo: leer variables de entorno)
# (requiere Node.js y el paquete 'ws': npm install -g ws)
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:9222/devtools/page/<PAGE_ID>');
const msg = {
  id: 1,
  method: 'Runtime.evaluate',
  params: { expression: 'window.__env && window.__env.WsUrl', returnByValue: true }
};
ws.on('open', () => ws.send(JSON.stringify(msg)));
ws.on('message', (data) => { console.log(data.toString()); ws.close(); });
"
```

> **Nota:** Cada vez que reinstales la app, el socket del WebView cambia de número (ej: `_8778` → `_9336`). Hay que volver a ejecutar el `adb forward`.

### Qué puedes ver/hacer en el inspector

- **Console:** Logs de Angular, errores de JavaScript, warnings de Capacitor
- **Network:** Todas las peticiones HTTP que hace la app (ver errores de conexión, respuestas del servidor)
- **Application → Local Storage:** Ver qué tiene guardado la app (token, login, connectionType, etc.)
- **Sources:** Código fuente de la app (los sourcemaps están inlineados en el build de debug)
- **Ejecutar JS arbitrario:** Via consola o CDP, puedes llamar funciones de Angular, modificar el DOM, simular respuestas, etc.

---

## 8. Script de re-despliegue rápido (flujo habitual)

Una vez que el entorno está configurado correctamente, este es el flujo para re-desplegar tras un cambio de código:

```powershell
# Guardar como redeploy.ps1 en la raíz del proyecto

$projectRoot = "C:\Users\Personal\OneDrive\Documentos\kiberno\DenarioPremium\DenarioPremiunMovil"
$apkPath = "$projectRoot\android\app\build\outputs\apk\debug\app-debug.apk"
$appId = "com.kiberno.denarioPremiumPro"

Set-Location $projectRoot

Write-Host "▶ 1/4 Building Angular..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

Write-Host "▶ 2/4 Syncing Capacitor..." -ForegroundColor Cyan
npx cap sync android

Write-Host "▶ 3/4 Building APK..." -ForegroundColor Cyan
Set-Location "$projectRoot\android"
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { Write-Host "Gradle failed" -ForegroundColor Red; exit 1 }

Write-Host "▶ 4/4 Installing and launching..." -ForegroundColor Cyan
Set-Location $projectRoot
adb install -r $apkPath
adb shell monkey -p $appId -c android.intent.category.LAUNCHER 1

Write-Host "✔ Deploy complete!" -ForegroundColor Green
```

> **Tip:** Si solo cambiaste archivos en `src/` (código TypeScript/HTML/SCSS), el build de Gradle en el paso 3 será muy rápido (~8s) porque las dependencias nativas están cacheadas.

---

## 9. Archivos modificados — Resumen

| Archivo | Tipo de cambio | Motivo |
|---|---|---|
| `.browserslistrc` | Modificado | Actualizar targets de browser para que esbuild pueda optimizar |
| `www/claves.env` | Modificado | Cambiar `WsUrl` de `https://` a `http://` |
| `android/app/src/main/AndroidManifest.xml` | Modificado | Agregar `networkSecurityConfig` + todos los permisos necesarios |
| `android/app/src/main/res/xml/network_security_config.xml` | Creado nuevo | Permitir tráfico HTTP al servidor del proyecto |

### Estado final del `AndroidManifest.xml` completo

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Location (geolocation service + visitas/pedidos/cobros) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- Camera (adjuntos / fotos en transacciones) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <!-- Storage: Android 9 y anteriores -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />

    <!-- Storage: Android 13+ (API 33+) para leer imágenes y archivos adjuntos -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <!-- Haptics -->
    <uses-permission android:name="android.permission.VIBRATE" />

</manifest>
```

---

## Preguntas frecuentes

**¿Por qué no usar `npx cap run android` directamente?**  
En Windows no funciona porque busca `gradlew` sin la extensión `.bat`. El workaround es ejecutar los pasos manualmente como se describe en la sección 2. Hay un issue abierto en el repositorio de Capacitor para esto.

**¿Tengo que hacer `npm run build` siempre antes de desplegar?**  
Sí, siempre. `npm run build` es quien compila el código TypeScript/Angular a JavaScript estático en la carpeta `www/`. Sin este paso, el Sync de Capacitor copiará una versión desactualizada de la app al proyecto Android.

**¿Qué pasa si cambio el servidor (WsUrl)?**  
El cambio va en `www/claves.env`. Este archivo se copia al APK durante `npx cap sync android`. Si el nuevo servidor usa HTTPS con un certificado válido de una CA pública, puedes cambiar la URL a `https://` y no necesitas el `cleartextTrafficPermitted="true"`. Si usa HTTPS con certificado autofirmado, necesitas agregar el certificado como trust anchor en `network_security_config.xml`.

**¿Cómo sé si el socket del WebView cambió después de reinstalar?**  
Corre este comando:
```powershell
adb shell "cat /proc/net/unix | grep webview_devtools"
```
El número al final del nombre del socket cambia con cada instalación.

**¿Puedo usar Live Reload?**  
Capacitor soporta live reload. Para habilitarlo agrega en `capacitor.config.ts`:
```typescript
server: {
  url: 'http://<IP-DE-TU-PC>:4200',
  cleartext: true
}
```
Y corre `ng serve` en la PC. Esto evita tener que recompilar el APK con cada cambio de código. Recuerda que el teléfono y la PC deben estar en la misma red.
