# Orquestador Smoke Test — Denario Premium Móvil
## 10 Módulos Secuenciales · Android USB · Playwright MCP + CDP

---

## CÓMO USAR ESTE ARCHIVO

### ¿Qué es esto?

Este archivo contiene el **prompt completo** que debes entregarle a Claude Code para que ejecute automáticamente el smoke test de los 10 módulos de Denario Premium Móvil, un módulo tras otro, sin intervención manual entre corridas.

Claude Code actuará como **orquestador**: lanza un agente por módulo, espera que termine, lanza el siguiente, y al final produce un reporte consolidado.

---

### ¿Se envía todo de una sola vez o por partes?

**Todo de una sola vez.** Copia el bloque completo marcado como `PROMPT ORQUESTADOR` (desde la línea `─── INICIO DEL PROMPT ───` hasta `─── FIN DEL PROMPT ───`) y pégalo como **un único mensaje** en una sesión nueva de Claude Code.

No lo cortes ni lo envíes por partes. El orquestador necesita leer la totalidad de las instrucciones antes de empezar para conocer el orden, los agentes y los formatos de reporte.

---

### Pasos antes de pegar el prompt

Antes de abrir la sesión de Claude Code, completa estas acciones **manualmente** en tu terminal:

**1. Conectar el dispositivo y verificar:**
```powershell
adb devices
```
Debe aparecer el serial del dispositivo (ej. `14678405BR003855   device`).

**2. Lanzar la app:**
```powershell
adb shell am start -n com.kiberno.denarioPremiumPro/.MainActivity
```

**3. Espera ~3 segundos y encuentra el socket WebView:**
```powershell
adb shell cat /proc/net/unix | Select-String "webview_devtools"
```
Anota el número que aparece después de `webview_devtools_remote_` (es el PID del proceso).

**4. Configura el port forward con ese PID:**
```powershell
adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>
```

**5. Verifica que CDP responde:**
```powershell
curl http://127.0.0.1:9220/json/version
```
Debe devolver un JSON con `browserVersion`. Si no responde, repite el paso 3-4.

**6. Inicia el servidor de credenciales** (en una terminal aparte que dejes abierta):
```powershell
node DenarioPremiunMovil/qa-piloto-automatizacion/automation/maestro/temp-creds-server.js
```

**7. Concede permisos de ubicación** (solo necesario una vez por sesión de dispositivo):
```powershell
adb shell pm grant com.kiberno.denarioPremiumPro android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.kiberno.denarioPremiumPro android.permission.ACCESS_COARSE_LOCATION
```

Una vez que el `curl` del paso 5 responde correctamente y el servidor de credenciales está corriendo, ya puedes abrir Claude Code y pegar el prompt.

---

### ¿Qué esperar durante la ejecución?

- Claude Code confirmará el setup del Paso 0 y generará un `RUN_ID`.
- Luego lanzará 10 agentes en secuencia. Cada agente puede tardar entre 10 y 30 minutos según el módulo.
- Al terminar cada agente, verás en el chat un resumen del módulo (PASS/FAIL/SKIP/N/A).
- Al terminar el módulo 10 (Vendedores), se generará el reporte consolidado.
- **No es necesario que estés frente a la pantalla** entre módulos; Claude Code gestiona toda la secuencia.

### Intervención manual que puede ser necesaria

| Situación | Qué hacer |
|-----------|-----------|
| Diálogo nativo de Android aparece en pantalla | Acéptalo o descártalo manualmente en el dispositivo |
| El `adb forward` se cae a mitad de la corrida | Ejecutar `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>` de nuevo |
| La app se cierra sola | Relanzarla con `adb shell am start -n com.kiberno.denarioPremiumPro/.MainActivity` |

---

═══════════════════════════════════════════════════════════
─── INICIO DEL PROMPT — COPIAR DESDE AQUÍ ───
═══════════════════════════════════════════════════════════

# Prompt Orquestador — Smoke Test Completo Denario Premium Móvil
## 10 Módulos Secuenciales · Android USB · Playwright MCP + CDP

## IDENTIDAD Y ALCANCE

Eres **Claude Code actuando como Orquestador QA** para Denario Premium Móvil. Tu tarea es ejecutar el **smoke test completo** (127 casos en 10 módulos) en un dispositivo Android conectado por USB, usando Playwright MCP y Chrome DevTools Protocol (CDP).

**No eres un agente de módulo. Eres el orquestador.** Tu trabajo es:
1. Verificar que la infraestructura del Paso 0 está activa (CDP responde, servidor de credenciales activo).
2. Lanzar cada agente de módulo **uno a la vez** usando la herramienta `Agent`.
3. **Esperar el resultado completo** de cada agente antes de lanzar el siguiente.
4. Al terminar los 10 módulos, generar el **Reporte Consolidado Final**.

**App:** `com.kiberno.denarioPremiumPro`
**Carpeta raíz de trabajo:** `DenarioPremiunMovil/qa-piloto-automatizacion/`
**Reportes:** guardar en `automation/reports/`

---

## LECTURA OBLIGATORIA ANTES DE INICIAR

Lee estos tres archivos **antes del Paso 0** y aplica su contenido durante toda la corrida:

```
automation/cdp/SKILLS.md                          ← reglas operativas, tabla de Skills, anti-patrones
automation/cdp/denario-cdp-helpers.js             ← implementación de helpers (funciones canónicas)
automation/reports/lecciones-aprendidas-cdp.md   ← contexto de la primera barrida, VGs, defectos
```

Incluye en el prompt de **cada agente** la instrucción de leer `SKILLS.md` y `denario-cdp-helpers.js` antes de ejecutar sus casos. Los helpers sustituyen todos los bloques de código repetidos; los agentes no deben derivar patrones por su cuenta.

---

## RESTRICCIONES DE SEGURIDAD (NO NEGOCIABLES — APLICAN A TI Y A TODOS LOS AGENTES)

1. **NO escribir credenciales** en chat, reportes ni archivos — leer de `secrets/qa-credentials.env`; en reportes usar `***`/`***`
2. **NO modificar código de producto:** `../src/`, configs de build, `../android/`
3. **PROHIBIDO:** Maestro, YAML en `automation/maestro/`, `run-login-*.ps1`, `adb shell input tap/text/keyevent`
4. **Solo herramientas del MCP de Playwright** para toda interacción con UI
5. **Conexión obligatoria:** `connectOverCDP('http://127.0.0.1:9220')` — NO `localhost:4200`, `localhost:8100`, ni ng serve
6. **No ejecutar** `git commit`, `git push` ni PR

---

## PASO 0: VERIFICACIÓN DE INFRAESTRUCTURA

El usuario debe haber ejecutado `automation/cdp/setup-cdp.ps1` antes de iniciar esta sesión. Si no lo hizo, pídele que lo ejecute ahora.

Verifica tú mismo:
- `curl http://127.0.0.1:9220/json/version` devuelve JSON con `"Android-Package"` (CDP activo)
- `curl http://127.0.0.1:19001` devuelve contenido con `QA_USER=` (servidor de credenciales activo)

Si alguno falla, detente y avisa con los pasos de corrección del script — no intentes reparar infra con comandos destructivos.

**RUN_ID:** Generar con formato `YYYYMMDD_HHMMSS_smoke-completo`. Usar este mismo ID en todos los reportes.

---

## ORDEN DE EJECUCIÓN

| # | Módulo | Casos Smoke |
|---|--------|-------------|
| 1 | Login | DM-LOG-001, 002, 003, 004, 008, 009, 011, 012, 017 |
| 2 | Clientes | DM-CLT-001, 002, 003, 009, 013, 016, 017, 019, 021, 024, 026, 031 |
| 3 | Pedidos | DM-PED-001, 002, 006, 015, 017, 024, 026, 029, 030, 031, 032, 034, 035, 037 |
| 4 | Cobros | DM-COB-001, 002, 004, 007, 008, 009, 040, 012, 014, 016, 018, 019, 029, 036, 037, 020, 021, 022, 024, 026, 038, 039 (usar **040** Depósito, no 010 Efectivo, si el cliente solo tiene Depósito; **029** Retención requiere inyección adjunto igual que 016; **036** IGTF y **037** Cobro 25% IVA no requieren adjunto) |
| 5 | Devoluciones | DM-DEV-001, 002, 004, 006, 011, 013, 014, 015, 016, 018, 019, 021, 022, 024 |
| 6 | Inventarios | DM-INV-001, 002, 004, 008, 010, 011, 012, 016, 017, 020, 021, 022, 023, 025, 026, 028 |
| 7 | Depósitos | DM-DEP-001, 002, 004, 005, 006, 009, 010, 014, 017, 018, 019, 020 |
| 8 | Visitas | DM-VIS-001, 002, 003, 004, 006, 010, 014, 015, 019, 020, 021, 022, 023, 025, 026, 031, 032 |
| 9 | Productos | DM-PRD-001, 002, 004, 006, 007, 009, 012, 013, 019, 020, 021 |
| 10 | Vendedores | DM-VND-001, 002, 007 |
| **TOTAL** | | **130 casos** |

---

## INSTRUCCIONES DEL ORQUESTADOR

Para cada módulo en el orden anterior:
1. Usa la herramienta `Agent` con `subagent_type: "claude"` y el prompt del módulo (ver sección PROMPTS DE AGENTES).
2. Espera el resultado completo. No lances el siguiente hasta tener la respuesta.
3. Verifica que el agente terminó en Home (todos los módulos, incluido Login).
4. Si hay FAIL en caso S1: registra el bloqueo en el consolidado y continúa con el siguiente módulo.
5. Al terminar los 10: genera el Reporte Consolidado Final en `automation/reports/smoke-consolidado-<RUN_ID>.md`.

---

## PROMPTS DE AGENTES

---

### AGENTE 1 — LOGIN

**Estado inicial:** pantalla de LOGIN | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo LOGIN de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: pantalla de LOGIN (si la app está en HOME, hacer click en "Salir" primero)
- Estado final: HOME principal con módulos visibles

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — funciones canónicas: connectCdp, fetchCreds, fillIonInput, clickAlertButton, waitSyncOverlay
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → creds = h.fetchCreds() → h.waitSyncOverlay(pg)
Usar h.fillIonInput() para usuario y contraseña. Usar h.clickAlertButton() para todos los modales.

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-login.md para pasos exactos y resultados esperados.

CASOS SMOKE:
DM-LOG-002 — Campos vacíos → modal "Usuario y/o password no pueden ser vacios"
DM-LOG-003 — Contraseña incorrecta (Test-LOG-003) → modal "Usuario y/o contraseña incorrectos."
DM-LOG-004 — Activar "Recordar usuario" → checkbox marcado
DM-LOG-001/011/012 — Happy path: credenciales QA → sync → Home
DM-LOG-008/009 — Segunda cuenta QA_USER2: si no existe en qa-credentials.env → N/A
DM-LOG-017 — Arranque limpio → N/A (no aplica sin reinstalación)

AL TERMINAR: App en Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-login-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo LOGIN, counts PASS/FAIL/SKIP/N/A, ruta.
```

---

### AGENTE 2 — CLIENTES

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo CLIENTES de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, clickAlertButton, clickBack, clickIonItem, getActiveView
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
Vistas Angular a detectar: app-client-home, app-client-list, app-client-detail, app-client-new-potential-client, app-client-potential-client, app-client-document-sale
NOTA: El alert de guardado usa #alertMessage — aplicar h.clickAlertButton(pg, 'OK') o 'Aceptar'.

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-clientes.md para pasos y selectores exactos.

CASOS SMOKE:
DM-CLT-001 — Acceso módulo Clientes → app-client-home con 3 botones
DM-CLT-002 — Listado de clientes con saldo BS y USD (50+ ítems)
DM-CLT-003 — Búsqueda parcial → resultados filtrados
DM-CLT-009 — Detalle de cliente → Nombre, Código, Saldo BS/USD visibles
DM-CLT-013 — Tab DocVentas → documentos con leyenda Vigente/Vencido/A favor
DM-CLT-016 — Atrás: listado → home clientes
DM-CLT-017 — Atrás: detalle → listado
DM-CLT-019 — Nuevo potencial → 9 ion-input vacíos, botones disabled
DM-CLT-021 — Rellenar obligatorios → botones habilitados (nombre: Test-CLT-SMOKE-<HHMMSS>)
DM-CLT-024 — Guardar → alert "¡Cliente Potencial Guardado!" → estatus "Guardado"
DM-CLT-026 — Enviar → confirmación → ACEPTAR → estatus "Enviado"
DM-CLT-031 — Eliminar Guardado → desaparece del listado

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-clientes-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo CLIENTES, counts, ruta.
```

---

### AGENTE 3 — PEDIDOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo PEDIDOS de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, clickAlertButton, clickBack, clickIonItem, getActiveView
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-pedidos.md para pasos exactos y selectores.

CASOS SMOKE:
DM-PED-001 — Home pedidos → 3 botones: Nuevo Pedido, Buscar Pedido, Copiar Pedido
DM-PED-002 — Nuevo pedido sin cliente → tabs Pedido/Total bloqueadas
DM-PED-006 — Seleccionar cliente desde modal → tabs habilitadas
DM-PED-015 — Tab Pedido → lista de productos visible
DM-PED-017 — Ingresar cantidad 2 → badge verde + Tab Total con totales
DM-PED-024 — Tab Total → totales distintos de cero
DM-PED-026 — Eliminar ítem desde Tab Total → totales recalculados
DM-PED-029 — Sin datos completos → guardar/enviar deshabilitados
DM-PED-030 — Guardar → confirmación → "Guardado" en lista (comentario: Test-PED-SMOKE-<HHMMSS>)
DM-PED-031 — Enviar → modal ACEPTAR → "Por Enviar"/"Enviado"
DM-PED-032 — Salir con ítems → modal 3 opciones
DM-PED-034 — Buscar pedido en lista → filtrado en tiempo real
DM-PED-035 — Abrir pedido "Guardado" → formulario editable
DM-PED-037 — Eliminar pedido "Guardado" → desaparece

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-pedidos-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo PEDIDOS, counts, ruta.
```

---

### AGENTE 4 — COBROS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo COBROS de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, clickAlertButton, clickBack, clickIonItem, selectIonPopover
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
NOTA DM-COB-040: usar h.selectIonPopover() para seleccionar banco en método Depósito.

MANEJO DE ADJUNTOS Y ENVÍO — LEER PERFIL PLAYA:
Antes de ejecutar DM-COB-018/019, verificar el campo cobros_envio_manual del perfil playa
(automation/playas/{QA_PLAYA}.yaml).

Leer perfil del cliente: automation/clientes/{QA_CLIENTE}.yaml
Revisar vgs.requiredCollectionAttachments del perfil antes de ejecutar DM-COB-016/018/019.

SI vgs.requiredCollectionAttachments=true (+ APK producción):
  * DM-COB-016: verificar que acordeones Imágenes/Archivo/Firma son visibles → PASS.
    NO intentar agregar foto programáticamente.
  * DM-COB-018: guardar cobro → PASS.
  * DM-COB-019: ⏭ SKIP. Documentar cobro en "Guardado", nota "Pendiente envío manual por QA".
  * DM-COB-029 (Retención): guardar OK, envío SKIP por misma razón.
  * Incluir cobros Guardados en "## Registros creados en sistema" con nota "Pendiente envío manual".

SI vgs.requiredCollectionAttachments=false (o null/TBD):
  * DM-COB-016: verificar acordeones visibles → PASS (sin adjunto requerido).
  * DM-COB-018 y DM-COB-019: ejecutar normalmente.
  * DM-COB-019 es PASS si cobro queda "Por Enviar"/"Enviado" sin alerta de adjunto faltante.

ORDEN OBLIGATORIO happy path: 004→007→008→040→012→014→016(inyección)→018→019

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-cobros.md para pasos exactos, selectores y resultados esperados.

CASOS SMOKE (22 casos):
DM-COB-001, DM-COB-002, DM-COB-004, DM-COB-007, DM-COB-008, DM-COB-009, DM-COB-040,
DM-COB-012, DM-COB-014, DM-COB-016, DM-COB-018, DM-COB-019,
DM-COB-029, DM-COB-036, DM-COB-037,
DM-COB-020, DM-COB-021, DM-COB-022, DM-COB-024, DM-COB-026, DM-COB-038, DM-COB-039

NOTAS TIPOS CONDICIONALES (VGs confirmadas activas en cuenta Yaque):
DM-COB-029 (Retención, coType="2"): sin Tab Pagos. El código verifica hasItems() de forma incondicional para este tipo — inyectar adjunto (técnica § 3.9) antes de enviar, igual que en DM-COB-016. Datos: Test-COB-029-<HHMMSS>.
DM-COB-036 (IGTF, coType="3"): selector de tasa IGTF en Tab Documentos + flujo guardar/enviar. Sin check de adjunto en código para este tipo — puede enviarse sin inyección.
DM-COB-037 (Cobro 25% IVA, coType="4"): mismo flujo que cobro normal. Sin check de adjunto en código para este tipo — puede enviarse sin inyección. Datos: Test-COB-037-<HHMMSS>.
DM-COB-028 (Anticipo): N/A — botón ausente en cuenta Yaque (cobroPrepago inactiva).

OBLIGATORIO DM-COB-040 (Depósito): agregar método Depósito → banco → nº depósito (TEST-DEP-040) → monto = total sticky.
No usar DM-COB-010 (Efectivo) si el cliente solo tiene Depósito.

Datos de prueba: Test-COB-SMOKE-<HHMMSS>

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-cobros-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo COBROS, counts, ruta.
```

---

### AGENTE 5 — DEVOLUCIONES

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo DEVOLUCIONES de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, clickAlertButton, clickBack, clickIonItem
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
VG activa en cuenta QA: validateReturn=true → el flujo requiere seleccionar cliente Y factura para habilitar tabs.

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-devoluciones.md para pasos exactos y resultados esperados.

CASOS SMOKE:
DM-DEV-001, DM-DEV-002, DM-DEV-004, DM-DEV-006, DM-DEV-011, DM-DEV-013, DM-DEV-014,
DM-DEV-015, DM-DEV-016, DM-DEV-018, DM-DEV-019, DM-DEV-021, DM-DEV-022, DM-DEV-024

Datos de prueba: Test-DEV-SMOKE-<HHMMSS>

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-devoluciones-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo DEVOLUCIONES, counts, ruta.
```

---

### AGENTE 6 — INVENTARIOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo INVENTARIOS de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, fillNgModelKeyboard, clickAlertButton, clickBack, clickIonItem, scrollInfinite
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
CRÍTICO: campos cantidad/lote/fecha en inventory-type-stocks-modal → usar h.fillNgModelKeyboard() (NO fillIonInput).
VGs activas: expirationBatch=true (lote+fecha obligatorios), suggestedOrderByDispatchAndReturn=true.
DM-INV-020 → N/A si quUnitSuggested=0 (sin inventario anterior para el cliente).

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-inventarios.md para pasos exactos y resultados esperados.

CASOS SMOKE:
DM-INV-001, DM-INV-002, DM-INV-004, DM-INV-008, DM-INV-010, DM-INV-011, DM-INV-012,
DM-INV-016, DM-INV-017, DM-INV-020, DM-INV-021, DM-INV-022, DM-INV-023, DM-INV-025,
DM-INV-026, DM-INV-028

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-inventarios-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo INVENTARIOS, counts, ruta.
```

---

### AGENTE 7 — DEPÓSITOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo DEPÓSITOS de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, clickAlertButton, clickBack, selectIonPopover, confirmDatetime
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
CRÍTICO: selección de banco en popover → usar h.selectIonPopover() (NO MouseEvent en ion-radio).
Fecha Doc (ion-datetime): usar h.confirmDatetime() para pulsar Aceptar en shadow DOM.
DEFECTO CONOCIDO: DM-DEP-018 → lista BUSCAR puede no renderizar tras guardar (bug v6.6.14 en deposit.service.ts). Si persiste, documentar como FAIL con la misma descripción de la barrida anterior.

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-depositos.md para pasos exactos y resultados esperados.

CASOS SMOKE:
DM-DEP-001, DM-DEP-002, DM-DEP-004, DM-DEP-005, DM-DEP-006, DM-DEP-009, DM-DEP-010,
DM-DEP-014, DM-DEP-017, DM-DEP-018, DM-DEP-019, DM-DEP-020

Datos de prueba: Test-DEP-SMOKE-<HHMMSS>

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-depositos-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo DEPÓSITOS, counts, ruta.
```

---

### AGENTE 8 — VISITAS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo VISITAS de Denario Premium Móvil.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, fillIonInput, clickAlertButton, clickBack, clickIonItem, selectIonPopover
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
ion-select en Actividad/Tipo: usar h.selectIonPopover() (popover no cierra con MouseEvent en esta versión Ionic).

CRÍTICO — ACTIVIDADES OBLIGATORIAS EN TODA VISITA:
Toda visita guardada o enviada en esta corrida DEBE tener al menos una actividad en listaEventos.
La ausencia de actividades al reabrir una visita Guardada es FAIL (no se persistió el evento).

TÉCNICA PARA AGREGAR ACTIVIDAD EN MODAL (DM-VIS-015, también requerida antes de DM-VIS-021/031):
1. browser_click en botón "AÑADIR ACTIVIDAD/EVENTO"
2. Actividad (ion-select interface="popover"): usar h.selectIonPopover()
3. Comentario (campo usa [(ngModel)], NO reactive form): pg.focus('ion-modal ion-input input') + pg.keyboard.type('Test-VIS-XXX-<HHMMSS>') — NO usar fillIonInput (no actualiza ngModel)
4. Botón Agregar (ion-button.botonAddLila dentro de ion-modal): usar browser_click o pg.mouse.click(coords) — NO element.click() ni dispatchEvent(MouseEvent)
5. Verificar: modal cerrado + ion-item visible en lista de actividades

PARA DM-VIS-021/031: agregar evento (pasos 1-5 anteriores) ANTES de pulsar atrás. NO usar solo selección de cliente como "cambio" — el smoke exige que la visita guardada tenga actividad.

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-visitas.md para pasos exactos y resultados esperados.

CASOS SMOKE:
DM-VIS-001, DM-VIS-002, DM-VIS-003, DM-VIS-004, DM-VIS-006, DM-VIS-010, DM-VIS-014,
DM-VIS-015, DM-VIS-019, DM-VIS-020, DM-VIS-021, DM-VIS-022, DM-VIS-023, DM-VIS-025,
DM-VIS-026, DM-VIS-031, DM-VIS-032

NOTAS:
- DM-VIS-025/026: N/A si no hay visitas "No Visitado" sincronizadas del día de hoy desde backend.
- DM-VIS-026: N/A si GPS no disponible.
- DM-VIS-032: verificar acordeones según VGs activas (signatureVisit, userCanUploadFiles).
- DM-VIS-022 CRÍTICO: usar una visita NUEVA (nunca guardada antes desde cabecera). NO reutilizar la visita de DM-VIS-019 (ya está en estado Guardado). Si se reabre una visita Guardada y se elige "Salir sin guardar", la visita se mantiene — eso es comportamiento CORRECTO, no FAIL.

Datos de prueba: Test-VIS-SMOKE-<HHMMSS>

AL TERMINAR: Navegar a Home principal.
REPORTE COMPACTO: Crear automation/reports/smoke-visitas-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo VISITAS, counts, ruta.
```

---

### AGENTE 9 — PRODUCTOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo PRODUCTOS de Denario Premium Móvil.
Este módulo es de CONSULTA (solo lectura) — no crea ni modifica datos.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, clickBack, clickIonItem, scrollInfinite, selectIonPopover
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
Botón "Volver" (estructuras → home módulo): buscar ion-button o button con texto "Volver" y hacer click con clickIonItem o evaluación directa.
Selector lista de precios en detalle (DM-PRD-013): usar h.selectIonPopover() si abre popover de radio.

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-productos.md para pasos exactos.

CASOS SMOKE:
DM-PRD-001 — Acceso al módulo, estructuras visibles (selector tipo + lista)
DM-PRD-002 — Cambiar tipo de estructura → listado actualiza
DM-PRD-004 — Tocar estructura → lista de productos visible
DM-PRD-006 — Búsqueda por texto → resultados filtrados
DM-PRD-007 — Búsqueda sin resultados → mensaje vacío visible
DM-PRD-009 — Scroll infinito → carga más productos
DM-PRD-012 — Detalle de producto → precio, descripción, etc.
DM-PRD-013 — Selector lista de precios → precio actualizado
DM-PRD-019 — Botón "Volver" → regresa a estructuras
DM-PRD-020 — Atrás desde detalle → lista de productos
DM-PRD-021 — Atrás desde estructuras → Home principal

REPORTE COMPACTO: Crear automation/reports/smoke-productos-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo PRODUCTOS, counts, ruta.
```

---

### AGENTE 10 — VENDEDORES

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres un agente QA ejecutando el smoke test del módulo VENDEDORES de Denario Premium Móvil.
Este módulo es de CONSULTA (solo lectura) — no crea ni modifica datos.

CONTEXTO:
- App: com.kiberno.denarioPremiumPro (Android WebView · Ionic 6 + Angular 19 + Capacitor 6)
- Carpeta de trabajo: DenarioPremiunMovil/qa-piloto-automatizacion/
- Estado inicial: HOME principal | Estado final: HOME principal

HELPERS Y SKILLS (leer antes de ejecutar — obligatorio):
- automation/cdp/denario-cdp-helpers.js — connectCdp, clickBack, waitSyncOverlay
- automation/cdp/SKILLS.md — tabla de skills y anti-patrones prohibidos

Iniciar con: h.connectCdp(page) → h.waitSyncOverlay(pg)
NOTA: Si acordeón expande pero contenido vacío (sin datos de API) → N/A, no FAIL.
NOTA: Si módulo Vendedores no aparece en Home → N/A (esVendedor=false para la cuenta).

GUIÓN DE REFERENCIA: leer guiones-regresion/guion-vendedores.md para pasos exactos.

CASOS SMOKE:
DM-VND-001 — Acceso desde Home → overlay desaparece, acordeones de empresa visibles
DM-VND-002 — Expandir acordeón → datos/KPIs visibles; contraer → ocultos
DM-VND-007 — Atrás → Home principal

REPORTE COMPACTO: Crear automation/reports/smoke-vendedores-<RUN_ID>.md
Formato: tabla | ID | P/F/S/N | evidencia 1 línea | — párrafos detallados solo en FAIL.
Devolver: módulo VENDEDORES, counts, ruta.
```

---

## FORMATO DE REPORTE POR AGENTE

```markdown
# Smoke Test — Módulo <NOMBRE>
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | <FECHA> |
| **RUN_ID** | `<RUN_ID>` |
| **Módulo** | <NOMBRE> |
| **Dispositivo** | <ADB_SERIAL> |
| **App** | `com.kiberno.denarioPremiumPro` — Versión <VERSION> |
| **Credenciales** | `***`/`***` |
| **Resultado global** | <N> PASS · <N> FAIL · <N> SKIP · <N> N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-XXX-NNN | ... | ✅ PASS / ❌ FAIL / ⏭ SKIP / 🚫 N/A | ... |

## Hallazgos (solo si hay FAIL u observaciones)

...

---
*Generado por Claude Code · Playwright MCP CDP · <FECHA>*
```

---

## FORMATO DE REPORTE CONSOLIDADO

```markdown
# Smoke Test Consolidado — Denario Premium Móvil
## 10 Módulos · Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | <FECHA> |
| **RUN_ID** | `<RUN_ID>` |
| **Dispositivo** | <ADB_SERIAL> |
| **App** | `com.kiberno.denarioPremiumPro` — Versión <VERSION> |
| **Resultado global** | <N> PASS · <N> FAIL · <N> SKIP · <N> N/A de 127 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | Estado |
|--------|-------|------|------|------|-----|--------|
| Login | 9 | | | | | ✅/❌ |
| Clientes | 12 | | | | | ✅/❌ |
| Pedidos | 14 | | | | | ✅/❌ |
| Cobros | 22 | | | | | ✅/❌ |
| Devoluciones | 14 | | | | | ✅/❌ |
| Inventarios | 16 | | | | | ✅/❌ |
| Depósitos | 12 | | | | | ✅/❌ |
| Visitas | 17 | | | | | ✅/❌ |
| Productos | 11 | | | | | ✅/❌ |
| Vendedores | 3 | | | | | ✅/❌ |
| **TOTAL** | **130** | | | | | |

## FAIL críticos (S1/S2)

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|

## Observaciones generales

...

## Reportes individuales

- [Login](smoke-login-<RUN_ID>.md) · [Clientes](smoke-clientes-<RUN_ID>.md) · [Pedidos](smoke-pedidos-<RUN_ID>.md)
- [Cobros](smoke-cobros-<RUN_ID>.md) · [Devoluciones](smoke-devoluciones-<RUN_ID>.md) · [Inventarios](smoke-inventarios-<RUN_ID>.md)
- [Depósitos](smoke-depositos-<RUN_ID>.md) · [Visitas](smoke-visitas-<RUN_ID>.md) · [Productos](smoke-productos-<RUN_ID>.md)
- [Vendedores](smoke-vendedores-<RUN_ID>.md)

---
*Generado por Claude Code · Orquestador Smoke · <FECHA>*
```

---

## CONTINGENCIAS

| Situación | Acción del orquestador |
|-----------|------------------------|
| CDP no responde en :9220 | Detener y avisar al usuario: "Ejecutar `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>`" |
| Servidor de credenciales no responde en :19001 | Detener y avisar: "Ejecutar `node automation/maestro/temp-creds-server.js`" |
| FAIL S1 en un módulo | Registrar en consolidado; continuar con el siguiente módulo |
| App en estado inconsistente al iniciar agente | Avisar al usuario: "Ejecutar `adb shell am force-stop com.kiberno.denarioPremiumPro` y relanzar la app" |
| Diálogo nativo de Android visible | Avisar al usuario para que lo descarte manualmente — CDP no puede controlarlo |

═══════════════════════════════════════════════════════════
─── FIN DEL PROMPT ───
═══════════════════════════════════════════════════════════

---

*Archivo generado por Claude Code · QA Piloto Denario Premium Móvil · 2026-05-27*
