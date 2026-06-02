# Lecciones Aprendidas — Automatización CDP Denario Premium Móvil
## Primera barrida completa · 10 módulos · 2026-05-27/28

---

## 1. Infraestructura — qué verificar antes de empezar

### El port forward puede caerse entre sesiones
```powershell
# 1. Confirmar dispositivo conectado
adb devices

# 2. Encontrar el PID del WebView (cambia con cada lanzamiento de la app)
adb shell cat /proc/net/unix | grep webview_devtools_remote

# 3. Redirigir el puerto con ese PID
adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>

# 4. Verificar CDP
curl http://127.0.0.1:9220/json/version   # debe devolver JSON con "Android-Package"
```

### La app puede no estar instalada
Ante cualquier error de Activity o paquete no encontrado:
```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n "com.kiberno.denarioPremiumPro/.MainActivity"
```
El PID del WebView solo aparece ~3 segundos después del lanzamiento.

### El servidor de credenciales debe estar corriendo antes de iniciar
```powershell
# en terminal separada:
node DenarioPremiunMovil/qa-piloto-automatizacion/automation/maestro/temp-creds-server.js
# verificar: curl http://127.0.0.1:19001 → debe devolver QA_USER= y QA_PASSWORD=
```

---

## 2. Conexión CDP — patrón obligatorio

```javascript
// Ejecutar en browser_run_code_unsafe
const cdp = await page.context().browser()._browserType.connectOverCDP('http://127.0.0.1:9220');
const ctx = cdp.contexts()[0];
const pg = ctx.pages()[0];
await pg.bringToFront();
```

El viewport del WebView es **360×744 CSS px** (devicePixelRatio=2). Tenerlo en cuenta para coordenadas de `pg.mouse.click`.

---

## 3. Patrones de interacción UI

### 3.1 Llenar ion-input (Angular reactive forms) — patrón estándar
Funciona en la gran mayoría de módulos (Login, Clientes, Pedidos, Cobros, Devoluciones, etc.):

```javascript
await pg.evaluate((valor) => {
  const ionEl = document.querySelector('selector-del-ion-input');
  const inp = ionEl.querySelector('input');
  const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  s.call(inp, valor);
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  inp.dispatchEvent(new Event('change', { bubbles: true }));
  ionEl.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: valor } }));
  ionEl.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: valor } }));
}, valor);
```

### 3.2 Llenar campos ngModel simples (modales de Inventarios)
El patrón anterior actualiza el DOM pero **no el ngModel** — el resumen/reporte de la app lo ignora. Usar focus + teclado:

```javascript
await pg.focus('selector-del-input-nativo');
await pg.keyboard.type('valor');
```

Aplica a campos como `cantidad`, `lote` y `fechaVencimiento` en `inventory-type-stocks-modal`.

### 3.3 Botón atrás (img.fechaAtras)
```javascript
await pg.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img.fechaAtras'));
  const visible = imgs.filter(i => i.offsetParent !== null);
  const link = visible[0].closest('a');
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
});
```

### 3.4 Click en ion-item para navegación
```javascript
await pg.evaluate(() => {
  const item = document.querySelector('selector-del-ion-item');
  item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
});
```

### 3.5 ion-select con popover — NO usar MouseEvent
El clic sobre `ion-item` o `ion-radio` dentro de un popover **no cierra el popover** en Ionic 6 + Chrome 148. Patrón correcto:

```javascript
await pg.evaluate((valor) => {
  // 1. Abrir el popover (click en el ion-select)
  document.querySelector('ion-select').click();
}, null);

// esperar a que el popover esté en DOM
await pg.waitForSelector('ion-popover ion-radio-group', { state: 'visible' });

await pg.evaluate((valor) => {
  // 2. Asignar valor directamente y disparar evento
  const sel = document.querySelector('ion-select');
  sel.value = valor;
  sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: valor } }));

  // 3. Cerrar el popover
  const popover = document.querySelector('ion-popover');
  if (popover) popover.dismiss();
}, valor);
```

### 3.6 ion-datetime (date picker) — botón Aceptar en shadow DOM
```javascript
await pg.evaluate(() => {
  const datetime = document.querySelector('ion-datetime');
  const buttons = datetime.shadowRoot.querySelectorAll('ion-button');
  const aceptar = Array.from(buttons).find(b => b.textContent.trim() === 'Aceptar');
  if (aceptar) aceptar.click();
});
```

### 3.7 Botones de ion-alert — usar coordenadas reales
`element.click()` y `dispatchEvent(MouseEvent)` fallan frecuentemente en botones de alertas Ionic. La única técnica confiable:

```javascript
// obtener coordenadas del botón visible
const coords = await pg.evaluate((texto) => {
  const botones = Array.from(document.querySelectorAll('ion-alert button'));
  const visible = botones.find(b => !b.closest('.overlay-hidden') && b.textContent.includes(texto));
  if (!visible) return null;
  const r = visible.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, 'Aceptar');

if (coords) await pg.mouse.click(coords.x, coords.y);
```

### 3.8 Scroll infinito
```javascript
await pg.evaluate(() => {
  const sc = document.querySelector('ion-infinite-scroll');
  if (sc) sc.dispatchEvent(new CustomEvent('ionInfinite', { bubbles: true }));
});
```

### 3.9 Inyectar adjunto vía Capacitor Plugin Mock (producción y desarrollo)

**Contexto:** La VG `requiredCollectionAttachments` (default `true`) bloquea el envío con `COB_RET_MSJ_COLLECTION_NO_ATTACHMENTS` si `adjuntoService.hasItems()` = `false`. `hasItems()` solo cuenta `fotos` y `files` — **la firma no cuenta**. Los botones nativos de galería/cámara usan Capacitor plugins que abren diálogos del SO. La técnica correcta es **mockear el plugin de Capacitor antes de clickear el botón** — funciona en builds de **producción y desarrollo** porque `window.Capacitor` siempre está disponible en apps Capacitor.

---

#### Técnica principal — Mock de cámara (`ADJ_TOMAR_FOTO` / `tomarImg`)

`tomarImg()` usa `Camera.getPhoto({ resultType: CameraResultType.Base64 })` → el resultado llega directamente en base64, **sin leer el filesystem**. Solo se necesita mockear un plugin.

```javascript
// JPEG 1×1 px — base64 sintético válido
const BASE64_1PX_JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
  'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwf/wAARC' +
  'AABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAA' +
  'AAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

// Paso 1: mockear Camera.getPhoto ANTES de clickear
const mockOk = await pg.evaluate((b64) => {
  if (!window.Capacitor?.Plugins?.Camera) return 'ERROR: window.Capacitor.Plugins.Camera no disponible';
  window.Capacitor.Plugins.Camera.getPhoto = async () => ({
    base64String: b64,
    format:       'jpeg',
    saved:        false
  });
  return 'OK: mock instalado';
}, BASE64_1PX_JPEG);
// mockOk debe ser 'OK: mock instalado'

// Paso 2: obtener coordenadas del botón ADJ_TOMAR_FOTO y clickear
const coords = await pg.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('ion-button'));
  const btn   = btns.find(b => b.offsetParent !== null && b.textContent.includes('TOMAR'));
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
if (coords) await pg.mouse.click(coords.x, coords.y);

// Paso 3: esperar que el flujo Angular procese el mock (~800 ms)
await pg.waitForTimeout(800);

// Paso 4: verificar que fotos.length > 0 en el DOM (carrusel visible o badge)
// La verificación funcional es indirecta: el botón guardar/enviar debe habilitarse
// Si quieres contar fotos directamente usa: document.querySelectorAll('swiper-slide ion-img').length
```

**Por qué funciona:** `tomarImg()` recibe `p.base64String` del mock y ejecuta `this.service.fotos.push(new Foto("jpeg", p.base64String, '', false))`. Angular procesa el push y `hasItems()` retorna `true`. `savePhotos()` escribe el base64 al filesystem local → el adjunto queda persistido y se envía al backend.

---

#### Técnica alternativa — Mock de galería (`ADJ_BUSCAR_FOTO` / `buscarImg`)

Usar solo si el botón `ADJ_TOMAR_FOTO` no está visible (`service.showCamera = false`). Requiere mockear **dos** plugins porque `buscarImg()` llama `Camera.pickImages()` Y después `Filesystem.readFile()` para leer el archivo del dispositivo. La "foto" es base64 sintético en ambos casos — **no viene ni del Android ni de la laptop**.

```javascript
// Paso 1: mockear Camera.pickImages Y Filesystem.readFile
await pg.evaluate((b64) => {
  // Mock galería
  window.Capacitor.Plugins.Camera.pickImages = async () => ({
    photos: [{ path: '/sdcard/qa_fake_adj.jpg', webPath: 'qa_fake_adj.jpg', format: 'jpeg' }]
  });
  // Mock filesystem — responde cuando piden el archivo falso
  const origReadFile = window.Capacitor.Plugins.Filesystem.readFile.bind(
    window.Capacitor.Plugins.Filesystem
  );
  window.Capacitor.Plugins.Filesystem.readFile = async (opts) => {
    if (opts?.path?.includes('qa_fake_adj')) return { data: b64 };
    return origReadFile(opts);
  };
  return 'OK: mocks galería instalados';
}, BASE64_1PX_JPEG);

// Paso 2: clickear ADJ_BUSCAR_FOTO
const coordsBuscar = await pg.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('ion-button'));
  const btn   = btns.find(b => b.offsetParent !== null && b.textContent.includes('BUSCAR'));
  if (!btn) return null;
  const r = btn.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
if (coordsBuscar) await pg.mouse.click(coordsBuscar.x, coordsBuscar.y);
await pg.waitForTimeout(1000);
```

---

**Cuándo aplica §3.9:** DM-COB-016 (Tab Adjuntos de cobros), antes de DM-COB-019 (enviar). Retención (DM-COB-029) tiene la misma validación `hasItems()` — aplicar igualmente. Si en otros módulos aparece la misma VG con `app-adjunto`, usar la misma técnica.

---

## 4. Detección de estado

### La URL no cambia en Angular SPA
La URL permanece en `/clientes`, `/pedidos`, etc. sin importar la sub-vista. Detectar vista activa por componente Angular visible:

```javascript
const vista = await pg.evaluate(() => {
  const candidatos = ['app-component-a', 'app-component-b', 'app-component-c'];
  for (const sel of candidatos) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) return sel;
  }
  return null;
});
```

### Alertas residuales en el DOM
Ionic **no destruye** los `ion-alert` cerrados — quedan con clase `overlay-hidden`. Siempre filtrar por visibilidad:

```javascript
// correcto
const alerta = Array.from(document.querySelectorAll('ion-alert'))
  .find(a => !a.classList.contains('overlay-hidden'));

// incorrecto — puede atrapar alertas de sesiones anteriores
const alerta = document.querySelector('ion-alert');
```

### Estado inicial de la app puede no ser el esperado
Si la sesión anterior terminó en HOME, la app arranca en HOME (no en LOGIN). Verificar siempre la URL/componente real antes de ejecutar el primer caso y navegar al estado correcto si es necesario.

### "Salir sin guardar" en visitas — comportamiento distinto según estado previo
**Visita nueva (nunca guardada desde cabecera):** "Salir sin guardar" la descarta completamente — no aparece en RUTA DE HOY. Comportamiento esperado para DM-VIS-022.

**Visita ya en estado Guardado (stDelivery=SAVED) reabierta para editar:** "Salir sin guardar" mantiene la visita Guardada en la lista — los cambios de la sesión de edición se descartan, pero el registro base persiste. Esto **no es un FAIL** — es el comportamiento correcto del sistema.

El agente debe usar una visita **genuinamente nueva** (nunca guardada antes) para DM-VIS-022. Reutilizar la visita de DM-VIS-019 (ya guardada) para este caso produce un falso FAIL.

---

## 5. Overlay de sincronización
Después de lanzar la app o navegar a ciertos módulos aparece un overlay de "Sincronizando...". Esperar a que desaparezca antes de interactuar:

```javascript
await pg.waitForFunction(() => {
  const overlay = document.querySelector('app-synchronization');
  return !overlay || overlay.offsetParent === null;
}, { timeout: 120000 });
```

---

## 6. Screenshots en WebView CDP
`page.screenshot()` y `pg.screenshot()` presentan **timeout de fuentes** en este entorno. No usar para verificación. Documentar evidencias vía:
- `pg.evaluate()` con snapshots del DOM
- `browser_snapshot` del MCP (snapshot de accesibilidad)

---

## 7. N/A vs FAIL — distinción importante

Marcar **N/A** (no FAIL) cuando el caso no aplica por datos del entorno, no por defecto de la app:

| Situación | Resultado correcto |
|-----------|-------------------|
| Sin cobros disponibles en cuenta QA | N/A |
| Sin inventario anterior → sugerencia de pedido vacía | N/A |
| Sin visitas "No Visitado" sincronizadas desde el servidor para hoy | N/A |
| Sin segunda cuenta en `qa-credentials.env` | N/A |
| Contenido de acordeón vacío (API no devolvió datos) | N/A |
| La app sí mostró el elemento pero la API no tiene datos | N/A |

Marcar **FAIL** solo cuando el comportamiento de la app es incorrecto (botón que debería habilitarse no lo hace, lista que debería renderizar queda vacía, modal que no aparece, etc.).

---

## 8. VGs activas en la cuenta QA (Yaque — usuario 001)

| VG | Módulos afectados | Impacto en pruebas |
|----|--------------------|-------------------|
| `multiCurrency=true` | Clientes, Cobros, Depósitos, Productos | Saldos y precios en BS y USD |
| `expirationBatch=true` | Inventarios | Campos lote y fecha de vencimiento obligatorios en captura de stock |
| `suggestedOrderByDispatchAndReturn=true` | Inventarios | Campo "Días para siguiente inventario" visible en pedido sugerido |
| `validateReturn=true` | Devoluciones | Requiere seleccionar cliente Y factura para habilitar tabs |
| `signatureReturn=true` | Devoluciones | Acordeón Firma visible en Tab Adjuntos |
| `userCanUploadFiles=true` | Devoluciones, Visitas | Acordeón Archivo visible en Tab Adjuntos |
| `signatureVisit=true` | Visitas | Acordeón Firma visible en Tab Adjuntos de visita |
| `esVendedor=true` | Vendedores | Módulo visible en Home |
| `enterpriseEnabled=true` | Depósitos, Vendedores | Empresa "HIDROPONIAS VENEZOLA" activa |

---

## 9. Defectos conocidos al cierre de la primera barrida (v6.6.14)

| ID | Módulo | Descripción | Estado |
|----|--------|-------------|--------|
| DM-DEP-018/019/020 | Depósitos | Lista BUSCAR no renderiza depósitos tras guardar → bloquea envío y eliminación. Hipótesis: `saveDeposit()` en `deposit.service.ts` usa `this.database` antes de asignarlo, o `ionChange` del banco no dispara correctamente. | Abierto — confirmar manualmente con scrcpy |
| DM-VIS-020 obs. | Visitas | Modal de confirmación de envío aparece antes de validar si hay actividades — UX invertido. Revisar `sendVisit()` en `visita.component.ts:907-975` | Observación (no bloquea) |
| DM-INV-026 obs. | Inventarios | Formulario de inventario Guardado abre en tab "General" en lugar de "Inventario" | Observación — confirmar en regresión |

---

## 10. Checklist de inicio para cada agente de módulo

- [ ] `curl http://127.0.0.1:9220/json/version` devuelve JSON con `Android-Package`
- [ ] `curl http://127.0.0.1:19001` devuelve `QA_USER=` y `QA_PASSWORD=`
- [ ] Verificar en qué URL/componente está la app — no asumir el estado inicial
- [ ] Filtrar siempre alertas y elementos por visibilidad (`offsetParent !== null`)
- [ ] Esperar overlay de sincronización antes de interactuar
- [ ] Al terminar: navegar a Home principal (`/home`) antes de devolver resultado

---

*Generado por Claude Code · Post-barrida RUN_ID 20260527_113900_smoke-completo · 2026-05-28*
