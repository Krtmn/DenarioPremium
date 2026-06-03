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

**6. Concede permisos de ubicación** (solo necesario una vez por sesión de dispositivo):
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

Eres **Claude Code actuando como Orquestador QA** para Denario Premium Móvil. Tu tarea es ejecutar el **smoke test completo** (~130 casos en 10 módulos) en un dispositivo Android conectado por USB, usando Playwright MCP y Chrome DevTools Protocol (CDP).

**No eres un agente de módulo. Eres el orquestador.** Tu trabajo es:
1. Verificar infraestructura (Paso 0) y leer el perfil del cliente activo.
2. Lanzar cada agente de módulo **uno a la vez** usando la herramienta `Agent`, inyectando los datos del cliente en cada prompt.
3. **Esperar el resultado completo** de cada agente antes de lanzar el siguiente.
4. Al terminar los 10 módulos, generar el **Reporte Consolidado Final**.

**App:** `com.kiberno.denarioPremiumPro`
**Carpeta raíz de trabajo:** `DenarioPremiunMovil/qa-piloto-automatizacion/`
**Reportes:** guardar en `automation/reports/`
**QA_CLIENTE:** (especificar al lanzar, ej. `QA_CLIENTE=hidroponias`)

---

## LECTURA OBLIGATORIA ANTES DE INICIAR

Lee **solo estos dos archivos** antes del Paso 0:

```
automation/cdp/RUNTIME.md                         ← reglas operativas, skills, anti-patrones, N/A vs FAIL
automation/clientes/{QA_CLIENTE}.yaml             ← VGs y datos de prueba del cliente activo
```

Los agentes leen sus propios archivos (`RUNTIME.md` + `smoke-{modulo}.md`). No incluir en los prompts de agentes ninguna referencia a guiones completos, lecciones ni SKILLS.md.

---

## RESTRICCIONES DE SEGURIDAD (NO NEGOCIABLES — APLICAN A TI Y A TODOS LOS AGENTES)

1. **NO escribir credenciales** en chat, reportes ni archivos — leer de `secrets/qa-credentials.env`; en reportes usar `***`/`***`
2. **NO modificar código de producto:** `../src/`, configs de build, `../android/`
3. **PROHIBIDO:** `run-login-*.ps1`, `adb shell input tap/text/keyevent`
4. **Solo herramientas del MCP de Playwright** para toda interacción con UI
5. **Conexión obligatoria:** `connectOverCDP('http://127.0.0.1:9220')` — NO `localhost:4200`, `localhost:8100`, ni ng serve
6. **No ejecutar** `git commit`, `git push` ni PR

---

## PASO 0: VERIFICACIÓN DE INFRAESTRUCTURA Y PERFIL CLIENTE

Verifica:
- `curl http://127.0.0.1:9220/json/version` devuelve JSON con `"Android-Package"` (CDP activo)
- `secrets/qa-credentials.env` existe y tiene `QA_USER=`

Lee y guarda en memoria:
- `automation/clientes/{QA_CLIENTE}.yaml` → leer completo; usarás `vgs` y `modules.*` en cada prompt de agente
- `automation/reports/lecciones-DELTA.md` → si tiene contenido, incorporar novedades relevantes al módulo correspondiente en su prompt

Si CDP no responde: detente y avisa — no intentes reparar infra.

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
1. Construye el prompt del agente usando la plantilla de la sección PROMPTS DE AGENTES — **inyecta** la sección `modules.{modulo}` del perfil cliente leído en Paso 0.
2. Lanza con la herramienta `Agent` (`subagent_type: "claude"`). Espera resultado completo.
3. Verifica que el agente terminó en Home.
4. FAIL en caso S1: registra en consolidado y continúa con el siguiente módulo.
5. Al terminar los 10: genera el Reporte Consolidado Final en `automation/reports/smoke-consolidado-<RUN_ID>.md`.

---

## PROMPTS DE AGENTES

Plantilla común — el orquestador inyecta RUN_ID, QA_CLIENTE y la sección `modules.{modulo}` del perfil cliente en cada prompt antes de lanzar el agente.

Ruta helpers (constante en todos los prompts):
`C:/Users/Personal/OneDrive/Documentos/kiberno/DenarioPremium/DenarioPremiunMovil/qa-piloto-automatizacion/automation/cdp/denario-cdp-helpers.js`

---

### AGENTE 1 — LOGIN

**Estado inicial:** pantalla de LOGIN | **Estado final:** HOME

```
Eres agente QA — módulo LOGIN · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA (solo estos 2 archivos):
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-login.md

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
const creds = await h.fetchCreds('{QA_CLIENTE}');
await h.waitSyncOverlay(pg);
Si la app está en HOME al iniciar → click en "Salir" primero.

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.login del YAML]

REPORTE: automation/reports/smoke-login-{RUN_ID}.md
REGISTROS CREADOS: ninguno (módulo sin transacciones).
Devolver: módulo LOGIN, counts PASS/FAIL/SKIP/N/A, ruta.
```

---

### AGENTE 2 — CLIENTES

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo CLIENTES · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-clientes.md

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.clientes del YAML]

REPORTE: automation/reports/smoke-clientes-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla (cliente potencial creado/enviado).
Devolver: módulo CLIENTES, counts, ruta, registros.
```

---

### AGENTE 3 — PEDIDOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo PEDIDOS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-pedidos.md

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.pedidos del YAML]

REPORTE: automation/reports/smoke-pedidos-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla (nro pedido enviado).
Devolver: módulo PEDIDOS, counts, ruta, registros.
```

---

### AGENTE 4 — COBROS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo COBROS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-cobros.md   ← contiene lógica adjunto y N/As por VG

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.cobros + vgs.requiredCollectionAttachments + vgs.cobroRetencion + vgs.userCanSelectIGTF + vgs.userCanCollectIva del YAML]

REPORTE: automation/reports/smoke-cobros-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla (cobros enviados Y cobros Guardados pendientes de envío manual).
Devolver: módulo COBROS, counts, ruta, registros.
```

---

### AGENTE 5 — DEVOLUCIONES

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo DEVOLUCIONES · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-devoluciones.md

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.devoluciones + vgs.validateReturn + vgs.signatureReturn + vgs.userCanUploadFiles del YAML]

REPORTE: automation/reports/smoke-devoluciones-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla (nro devolución enviada).
Devolver: módulo DEVOLUCIONES, counts, ruta, registros.
```

---

### AGENTE 6 — INVENTARIOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo INVENTARIOS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-inventarios.md   ← contiene nota crítica fillNgModelKeyboard

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.inventarios + vgs.expirationBatch + vgs.suggestedOrderByDispatchAndReturn del YAML]

REPORTE: automation/reports/smoke-inventarios-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla (nro inventario enviado).
Devolver: módulo INVENTARIOS, counts, ruta, registros.
```

---

### AGENTE 7 — DEPÓSITOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo DEPÓSITOS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-depositos.md   ← verificar modules.depositos.aplica antes de ejecutar

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.depositos completo del YAML]

REPORTE: automation/reports/smoke-depositos-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla si aplica=true; si aplica=false documentar N/A con motivo.
Devolver: módulo DEPÓSITOS, counts, ruta, registros.
```

---

### AGENTE 8 — VISITAS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo VISITAS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-visitas.md   ← contiene notas críticas DM-VIS-015, DM-VIS-022, DM-VIS-031

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.visitas + vgs.signatureVisit + vgs.userCanUploadFiles del YAML]

REPORTE: automation/reports/smoke-visitas-{RUN_ID}.md
REGISTROS CREADOS: incluir tabla (nro visita enviada + visitas Guardadas pendientes).
Devolver: módulo VISITAS, counts, ruta, registros.
```

---

### AGENTE 9 — PRODUCTOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo PRODUCTOS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}
Módulo de solo lectura — no crea ni modifica datos.

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-productos.md

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.productos del YAML]

REPORTE: automation/reports/smoke-productos-{RUN_ID}.md
REGISTROS CREADOS: ninguno (solo lectura).
Devolver: módulo PRODUCTOS, counts, ruta.
```

---

### AGENTE 10 — VENDEDORES

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo VENDEDORES · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}
Módulo de solo lectura — no crea ni modifica datos.

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-vendedores.md   ← verificar modules.vendedores.aplica antes de ejecutar

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.vendedores + vgs.esVendedor del YAML]

REPORTE: automation/reports/smoke-vendedores-{RUN_ID}.md
REGISTROS CREADOS: ninguno (solo lectura).
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
| `fetchCreds()` lanza error (archivo no encontrado) | Verificar que `secrets/qa-credentials.env` existe en la raíz de `qa-piloto-automatizacion/` |
| FAIL S1 en un módulo | Registrar en consolidado; continuar con el siguiente módulo |
| App en estado inconsistente al iniciar agente | Avisar al usuario: "Ejecutar `adb shell am force-stop com.kiberno.denarioPremiumPro` y relanzar la app" |
| Diálogo nativo de Android visible | Avisar al usuario para que lo descarte manualmente — CDP no puede controlarlo |

═══════════════════════════════════════════════════════════
─── FIN DEL PROMPT ───
═══════════════════════════════════════════════════════════

---

*Archivo generado por Claude Code · QA Piloto Denario Premium Móvil · 2026-05-27*
