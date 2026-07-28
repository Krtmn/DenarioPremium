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

Antes de abrir la sesión de Claude Code, conecta el dispositivo por USB y ejecuta **un solo comando** de pre-vuelo desde tu terminal:

```powershell
.\automation\cdp\setup-cdp.ps1
```

El script hace todo el Paso 0 solo y de forma idempotente: verifica el dispositivo ADB, instala/lanza la app si hace falta, **detecta automáticamente el PID vivo del WebView**, configura el `adb forward tcp:9220`, verifica que CDP responde (con reintento) y concede permisos de ubicación. Termina con `CDP listo en http://127.0.0.1:9220` (exit 0) o con un mensaje claro de qué falló (exit 1).

Cuando veas ese mensaje de "CDP listo", ya puedes abrir Claude Code y pegar el prompt.

> **Si CDP se cae a mitad de corrida** (la app se reinició o cambió de PID y `curl :9220/json/version` sale vacío), NO reapuntes el forward a mano — corre la **auto-reparación en 1 comando**:
> ```powershell
> .\automation\cdp\setup-cdp.ps1 -Reforward
> ```
> Re-detecta el PID vivo y re-apunta el forward **sin relanzar la app** (no pierde estado). Se puede correr las veces que haga falta.

*(Fallback manual, solo si el script no está disponible: `adb devices` → `adb shell am start -n com.kiberno.denarioPremiumPro/.MainActivity` → `adb shell cat /proc/net/unix | Select-String webview_devtools` para el PID → `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>` → `curl http://127.0.0.1:9220/json/version`.)*

---

### ¿Qué esperar durante la ejecución?

- Claude Code confirmará el setup del Paso 0 y generará un `RUN_ID`.
- Luego lanzará 10 agentes en secuencia. Cada agente puede tardar entre 10 y 30 minutos según el módulo.
- Al terminar cada agente, verás en el chat un resumen del módulo (PASS/FAIL/SKIP/N/A).
- Al terminar el módulo 10 (Vendedores), se generará el reporte consolidado y, automáticamente, se consolidará la memoria (Agente 11) — la corrida cierra con `module-selectors/`/YAML ya actualizados, sin pasos manuales.
- **No es necesario que estés frente a la pantalla** entre módulos; Claude Code gestiona toda la secuencia.

### Intervención manual que puede ser necesaria

| Situación | Qué hacer |
|-----------|-----------|
| Diálogo nativo de Android aparece en pantalla | Acéptalo o descártalo manualmente en el dispositivo |
| El `adb forward` se cae a mitad de la corrida (CDP responde vacío) | Ejecutar `.\automation\cdp\setup-cdp.ps1 -Reforward` (re-detecta el PID vivo y re-apunta el forward, sin relanzar la app) |
| La app se cierra sola | Ejecutar `.\automation\cdp\setup-cdp.ps1` (relanza la app y reconfigura CDP) |

---

═══════════════════════════════════════════════════════════
─── INICIO DEL PROMPT — COPIAR DESDE AQUÍ ───
═══════════════════════════════════════════════════════════

# Prompt Orquestador — Smoke Test Completo Denario Premium Móvil
## 10 Módulos Secuenciales · Android USB · Playwright MCP + CDP

## IDENTIDAD Y ALCANCE

Eres **Claude Code actuando como Orquestador QA** para Denario Premium Móvil. Tu tarea es ejecutar el **smoke test completo** (~137 casos en 10 módulos) en un dispositivo Android conectado por USB, usando Playwright MCP y Chrome DevTools Protocol (CDP).

**No eres un agente de módulo. Eres el orquestador.** Tu trabajo es:
1. Verificar infraestructura (Paso 0) y leer el perfil del cliente activo.
2. Lanzar cada agente de módulo **uno a la vez** usando la herramienta `Agent`, inyectando los datos del cliente en cada prompt.
3. **Esperar el resultado completo** de cada agente antes de lanzar el siguiente.
4. Al terminar los 10 módulos, generar el **Reporte Consolidado Final**.
5. **Cierre de memoria automático:** lanzar un agente final de consolidación (Agente 11) que promueve los patrones nuevos de los reportes a `module-selectors/` / YAML del cliente. La corrida termina con la memoria ya actualizada — **sin pasos manuales**.

**App:** `com.kiberno.denarioPremiumPro`
**Carpeta raíz de trabajo:** `DenarioPremiunMovil/qa-piloto-automatizacion/`
**Reportes:** guardar en `automation/reports/smoke_{QA_CLIENTE}_{YYYYMMDD}_{HHMMSS}/` (una carpeta por corrida — ver Paso 0)
**QA_CLIENTE:** (especificar al lanzar, ej. `QA_CLIENTE=hidroponias`)
**QA_MODE:** opcional — `QA_MODE=record` para que los agentes **graben la traza** de replay determinista (RUNTIME §12). Si no se especifica, la corrida es la normal de hoy y **nadie graba**.

---

## LECTURA OBLIGATORIA ANTES DE INICIAR

Lee **solo estos dos archivos** antes del Paso 0:

```
automation/cdp/RUNTIME.md                         ← reglas operativas, skills, anti-patrones, N/A vs FAIL
automation/clientes/{QA_CLIENTE}.yaml             ← VGs y datos de prueba del cliente activo
```

Los agentes leen sus propios archivos (`RUNTIME.md` + `smoke-{modulo}.md` + su sección de `module-selectors/`). No incluir en los prompts de agentes ninguna referencia a guiones completos, lecciones ni SKILLS.md.

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

Si CDP no responde: detente y avisa — no intentes reparar infra.

**Pre-vuelo BD (Oráculo §10 — NO bloqueante):** probar conectividad a la BD del cliente:
```bash
node automation/db/query.js {QA_CLIENTE} "SELECT 1 AS ok"
```
- Si devuelve `[{ "ok": 1 }]` → la verificación BD inline está disponible para los 7 agentes transaccionales.
- Si devuelve `ERR:` (sin bloque del cliente en `secrets/qa-db.env`, BD inaccesible, o playa distinta) → **la corrida sigue igual**; informar al usuario "BD no disponible → módulos transaccionales reportarán `BD-N/A`". **NUNCA** detener la corrida por la BD (la verificación BD es aditiva, no infra crítica).
- La **playa/servidor activa la confirma la QA antes de la corrida**; su DSN va en el bloque `# Cliente: {QA_CLIENTE}` de `qa-db.env`.

**RUN_ID:** Generar con formato `YYYYMMDD_HHMMSS_smoke-completo`. Usar este mismo ID en todos los reportes.

**RUN_DIR:** Construir como `automation/reports/smoke_{QA_CLIENTE}_{YYYYMMDD}_{HHMMSS}/` (extraer fecha y hora del RUN_ID). Crear esta carpeta antes de lanzar el primer agente. Ejemplo: RUN_ID `20260603_093706_smoke-completo` + cliente `insumar` → `automation/reports/smoke_insumar_20260603_093706/`.

**Pre-vuelo de DATOS (NO bloqueante) — tras crear RUN_DIR, si la BD respondió:**
```bash
node automation/db/resolve-run-context.js {QA_CLIENTE} {RUN_DIR}
```
Genera `{RUN_DIR}run-context.json` con el cliente/documento ya resuelto por módulo (hoy: cobros completo; otros módulos → `null` hasta validar su query → el agente usa su discovery actual). En cada prompt de agente, **inyectar la sección `modules.{modulo}` de ese JSON** (si no es `null`) como "DATOS RESUELTOS" para que el agente vaya directo sin explorar. Si el script da `ERR:` o el módulo viene `null` → el agente cae a su discovery habitual (igual que hoy). **Nunca** detener la corrida por esto.

**Techo de wall-clock por módulo (watchdog — RUNTIME §11):** fijar `TECHO_MODULO_MS` por módulo e inyectarlo en cada prompt de agente. Defaults:

| Módulo | Techo |
|---|---|
| Cobros · Pedidos | **60 min** (`3600000`) |
| Los otros 8 | **45 min** (`2700000`) |

Existe porque en `ferrenuestro-20260723` dos cuelgues de CDP (cobros ~2.7 h, productos ~9.9 h) llevaron la corrida a ~15.7 h. Con techo, un módulo colgado se corta y la corrida sigue.

**Si `QA_MODE=record` (RUNTIME §12):** crear también `{RUN_DIR}_trace/` e inyectar el **BLOQUE RECORD** en cada prompt de agente (ver PROMPTS DE AGENTES). Sin el flag, no crear la carpeta ni inyectar el bloque.

---

## ORDEN DE EJECUCIÓN

| # | Módulo | Casos Smoke |
|---|--------|-------------|
| 1 | Login | DM-LOG-002, 003, 004, 001, 011, 012 |
| 2 | Clientes | DM-CLT-001, 002, 003, 009, 013, 016, 017, 019, 021, 024, 026, 031 |
| 3 | Pedidos | DM-PED-001, 002, 006, 015, 017, 024, 026, 029, 030, 031, 032, 034, 035, 037 |
| 4 | Cobros | DM-COB-001, 002, 004, 006, 007, 008, 015, 033, 034, 041, 042, 009, 040, 012, 043, 014, 016, 018, 019, 022, 024, 026, 020, 021, 038, 029, 028, 036, 044, 045, 046, 047, 037, 039 (**seleccionar un cliente CON documentos pendientes** — ver `modules.cobros.clientes_con_documentos`; si ninguno hoy, recorrer la lista hasta hallar uno; usar **040** Depósito si el cliente solo tiene Depósito; **006** si `requiredComment=true`; **033/034** si `multiCurrency=true`; **041/042** retención por detalle de documento si `vgs.retencion=true` (insumar N/A → va por **029** +RETENCIÓN); **029** SKIP envío si `requiredCollectionAttachments=true`; **044/045** persistencia tasa IGTF round-trip si `userCanSelectIGTF=true` (045 N/A si 1 sola tasa); **046** persistencia pago parcial; **047** recálculo y persistencia por **Fecha tasa** si `fecha_tasa_editable`; **037** usa `modules.cobros.cliente_25iva` (único habilitado; N/A solo si vacío); **028/036/039** N/A según VG del perfil) |
| 5 | Devoluciones | DM-DEV-001, 002, 004, 006, 011, 013, 014, 015, 016, 018, 019, 021, 022, 024 |
| 6 | Inventarios | DM-INV-001, 002, 004, 008, 010, 011, 012, 016, 017, 020, 021, 022, 023, 025, 026, 028 |
| 7 | Depósitos | DM-DEP-001, 002, 004, 005, 006, 009, 010, 014, 017, 018, 019, 020 |
| 8 | Visitas | DM-VIS-001, 003, 004, 006, 010, 014, 015, 019, 020, 021, 022, 023, 025, 026, 031, 032 |
| 9 | Productos | DM-PRD-001, 002, 004, 006, 007, 009, 012, 013, 020, 021 |
| 10 | Vendedores | DM-VND-001, 002, 007 |
| **TOTAL** | | **~137 casos** |

---

## INSTRUCCIONES DEL ORQUESTADOR

Para cada módulo en el orden anterior:
1. Construye el prompt del agente usando la plantilla de la sección PROMPTS DE AGENTES — **inyecta** la sección `modules.{modulo}` del perfil cliente leído en Paso 0.
2. Lanza con la herramienta `Agent` (`subagent_type: "claude"`). Espera resultado completo del **agente UI**.
3. Verifica que el agente terminó en Home.
3b. **Si el módulo es transaccional:** lanzá su **Agente BD en BACKGROUND** (`Agent` con `run_in_background: true`) — coteja los payloads de ese módulo (`cotejo-payload.js`) mientras vos seguís con el agente UI del módulo siguiente. Cuando notifique, **anexá vos (orquestador, foreground) el markdown que devolvió** a `{RUN_DIR}{modulo}.md` y borrá su temporal — el agente BD NO escribe (en background se auto-deniega). Ver nota "Cotejo BD en paralelo" abajo.
4. FAIL en caso S1: registra en consolidado y continúa con el siguiente módulo.
4b. **Si el agente devuelve `MODULO ABORTADO: …`** (watchdog — RUNTIME §11): **no relanzarlo**. Anotar en el consolidado (módulo · motivo · casos ejecutados · BLOCKED) y **seguir con el módulo siguiente**. Antes de lanzarlo, verificar que el CDP revivió: `curl http://127.0.0.1:9220/json/version`. Si el CDP está caído → detener la corrida y avisar (contingencia de infra), **no** encadenar módulos contra un CDP muerto. Una corrida con ≥1 módulo abortado es **parcial** → aplica la guarda de completitud (sin Agente 11).
5. Al terminar los 10: genera el Reporte Consolidado Final en `{RUN_DIR}consolidado.md`.
6. **Consolidación de memoria (automática — Paso 7):** **solo si los 10 módulos completaron** (no corrida parcial), lanza el **Agente 11 — Consolidación** con la herramienta `Agent` (ver plantilla abajo). No es un paso manual: lo dispara el orquestador como su último agente.
7. Cuando el Agente 11 termine, **añade al `consolidado.md` la sección "Memoria: patrones promovidos"** con el resumen que devolvió. La corrida queda cerrada con la memoria al día; el control de calidad es revisar el `git diff` antes de commitear.

> **Cotejo BD campo-a-campo, en PARALELO (modelo de 2 agentes):** para cada **módulo transaccional**, el flujo es:
> 1. Lanzá el **agente UI** (instala `installPayloadCapture` y vuelca los payloads a `{RUN_DIR}_payloads.jsonl`). **Esperá que termine** (usa el dispositivo).
> 2. Lanzá el **Agente BD** de ESE módulo **en background** → en la herramienta `Agent` pasá **`run_in_background: true`**. Corre **solo Bash** (`cotejo-payload.js`), no toca el dispositivo.
> 3. **Sin esperarlo, seguí inmediatamente con el agente UI del módulo siguiente.** Así el **Agente BD del módulo N corre EN PARALELO con el agente UI del módulo N+1** (recursos distintos: BD/Bash vs dispositivo/CDP → no chocan).
> 4. Cuando el Agente BD termina (la herramienta te **notifica**), **devuelve** el bloque markdown de su cotejo. El orquestador (foreground) lo **anexa** a `{RUN_DIR}{modulo}.md` (sección "## Verificación BD (payload ↔ nube)") y **borra** el/los temporal/es `automation/db/_tmp_{modulo}*.json`. El agente BD NO escribe el reporte porque en background la escritura se auto-deniega (sin prompt). Recogé la notificación, anexá y seguí.
>
> ⚠ El solape es **offset** (BD de N ‖ UI de N+1) — **nunca** UI+BD del mismo módulo a la vez (el BD necesita el payload ya enviado + la ventana de sync ~10s). Aplica a los **7 transaccionales**; login/productos/vendedores no llevan cotejo BD. En **1 emulador** los UI siguen siendo secuenciales entre sí (un solo dispositivo); lo que se paraleliza es **el BD contra el UI siguiente**.

> **Guarda de completitud:** si la corrida fue parcial o se abortó a mitad, **no** lances el Agente 11 — los "Patrones nuevos" quedan en los reportes y se consolidan en la próxima corrida completa (o manualmente con `prompt-consolidar-hallazgos.md`).

---

## PROMPTS DE AGENTES

Plantilla común — el orquestador inyecta RUN_ID, QA_CLIENTE y la sección `modules.{modulo}` del perfil cliente en cada prompt antes de lanzar el agente. Además inyecta el **BLOQUE WATCHDOG** (siempre, con el techo del módulo) y el **BLOQUE RECORD** (solo si `QA_MODE=record`) — ambos definidos justo abajo.

Ruta helpers (constante en todos los prompts) — **relativa a la raíz `qa-piloto-automatizacion/`** (portable, funciona en cualquier máquina):
`automation/cdp/denario-cdp-helpers.js`

### BLOQUE WATCHDOG (obligatorio · inyectar en los 10 prompts, justo después del INICIO)

```
WATCHDOG (RUNTIME §11 — obligatorio):
const wd = h.makeWatchdog({ moduleMs: {TECHO_MODULO_MS} });
Envolvé toda operación de CDP: await wd.run('<label>', () => <op>);
- TIMEOUT:<label>  → ese caso ⛔ BLOCKED "cuelgue CDP" y SEGUÍ con el siguiente.
- CDP-DOWN:        → ⛔ BLOCKED; reconectá UNA vez con h.connectCdp(page); si vuelve a fallar, abortá.
- ABORT-MODULE:*   → CORTÁ el módulo YA. Casos restantes ⛔ BLOCKED "techo de módulo".
Al abortar: escribí igual el reporte .md + el ledger de lo ejecutado, volvé a HOME si podés, y
devolvé al orquestador: "MODULO ABORTADO: <motivo> · <n> ejecutados · <n> BLOCKED".
Nunca reintentes un módulo abortado por tu cuenta.
```

> El orquestador sustituye `{TECHO_MODULO_MS}` por el techo del módulo (Paso 0: cobros/pedidos `3600000`, resto `2700000`).

### BLOQUE RECORD (condicional · **solo** si `QA_MODE=record` — RUNTIME §12)

```
QA_MODE=record — GRABÁ LA TRAZA (aditivo: si falla, seguí la corrida normal):
1. Leé automation/replay/replay-engine.js con Read e inliná SOLO installRecorder y dumpTrace
   (no hay require en browser_run_code_unsafe; no las reescribas de memoria).
2. Tras connectCdp:  const eng = await installRecorder(pg);
3. Envolvé las ops deterministas:
     await eng.recCase('DM-XXX-NNN');
     await eng.W('<helper>', h.<helper>, pg, ...args);      // ejecuta Y graba
     await eng.recEval("() => { ... }", '<tag>');           // acción DOM a medida
     await eng.recAssert('<desc>', "() => <booleano>");     // oráculo del caso
4. Al cierre, escribí {RUN_DIR}_trace/{modulo}.trace.json con el sobre de RUNTIME §12:
   { run_id, modulo, cliente, servidor, build:{app_version, window_ng}, data:{...}, ops:[dumpTrace] }
   - data DEBE listar TODO valor run-específico usado (cliente, documento, montos, refs).
   - Descartá los bloques de ops de casos que NO terminaron PASS.
   - NUNCA grabes credenciales ni nada de secrets/.
5. En el reporte .md: "TRAZA: {n} ops · {n} casos grabados" (o el motivo si no se grabó).
```

**Verificación BD inline (los 7 agentes transaccionales — clientes, pedidos, cobros, devoluciones, inventarios, depósitos, visitas):** tras cada Enviar/Guardar que persiste, el agente ejecuta la "Verificación BD" de su `smoke-{modulo}.md` (consulta read-only vía Bash: `node automation/db/query.js {QA_CLIENTE} "SELECT ..."`) y agrega la sub-sección `## Verificación BD` a su reporte con la marca `BD-OK/MISMATCH/N-A/INFO`. Mecánica y blindaje: **RUNTIME §10**. El `{QA_CLIENTE}` ya se inyecta en cada prompt. **Si la BD no responde (`ERR:`) → `BD-N/A`, el caso UI corre y se reporta igual** — la BD nunca tumba el smoke. Login/Productos/Vendedores (solo-lectura) **no** llevan Verificación BD.

---

### AGENTE 1 — LOGIN

**Estado inicial:** pantalla de LOGIN | **Estado final:** HOME

```
Eres agente QA — módulo LOGIN · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA (solo estos 3 archivos):
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-login.md
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/login.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
// Credenciales: leer secrets/qa-credentials.env con Read y parsear el bloque "# Cliente: {QA_CLIENTE}" inline.
// NO usar h.fetchCreds() en browser_run_code_unsafe — usa fs/require y revienta (ver RUNTIME §1).
await h.waitSyncOverlay(pg);
Si la app está en HOME al iniciar → click en "Salir" primero.

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.login del YAML]

REPORTE: {RUN_DIR}login.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/clientes.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.clientes del YAML]

REPORTE: {RUN_DIR}clientes.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/pedidos.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.pedidos del YAML]

REPORTE: {RUN_DIR}pedidos.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/cobros.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.cobros (incluye `clientes_con_documentos`) + vgs.requiredCollectionAttachments + vgs.cobroRetencion + vgs.userCanSelectIGTF + vgs.userCanCollectIva del YAML.
RECORDAR AL AGENTE: para los casos que requieren factura (007/008/012/040/041/042/043/044/046) seleccionar un cliente CON documentos pendientes (probar `clientes_con_documentos` en orden; si ninguno tiene hoy, recorrer la lista del modal hasta hallar uno con documentos). `cliente_test` solo para casos sin documentos.]

REPORTE: {RUN_DIR}cobros.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/devoluciones.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.devoluciones + vgs.validateReturn + vgs.signatureReturn + vgs.userCanUploadFiles del YAML]

REPORTE: {RUN_DIR}devoluciones.md
REGISTROS CREADOS: incluir tabla (nro devolución enviada).
CAPTURA DE PAYLOAD (cotejo BD): al inicio, reset+`await h.installPayloadCapture(pg)`. Tras los Enviar, `await h.getCapturedPayloads(pg)` y volcar cada payload de servicio a `{RUN_DIR}_payloads.jsonl` (1 línea JSON `{url,data}` por envío). Lo consume el Agente BD.
Devolver: módulo DEVOLUCIONES, counts, ruta, registros.
```

> **Captura de payload (TODOS los 7 agentes UI transaccionales — clientes, pedidos, cobros, devoluciones, inventarios, depósitos, visitas):** al inicio del agente UI, `await pg.evaluate(()=>{window.__qaCaptureInstalled=false;})` + `await h.installPayloadCapture(pg)`; tras los Enviar, volcar `getCapturedPayloads` a `{RUN_DIR}_payloads.jsonl`. Es **universal** (un solo hook en `nativePromise` cubre los 7 tipos). El **Agente BD** (lanzado en background, ver su plantilla) consume ese archivo. Login/Productos/Vendedores NO capturan (solo lectura).

---

### AGENTE BD — COTEJO CAMPO-A-CAMPO POR PAYLOAD (sin Playwright · se lanza en BACKGROUND)

**Estado inicial:** el agente UI del módulo ya envió y volcó los payloads a `{RUN_DIR}_payloads.jsonl` | **No interactúa con la app** (solo Bash: BD read-only · NO Playwright, NO adb tap)

**Cómo lanzarlo:** con la herramienta `Agent` y **`run_in_background: true`**, justo después del agente UI de su módulo. Corre **en paralelo** con el agente UI del módulo siguiente (usa otro recurso: BD/Bash, no el dispositivo).

> ⚠ **PERMISOS (crítico para que el background NO se auto-deniegue):** los jobs en background **no pueden responder prompts de permiso**, así que cualquier comando no allowlisteado se auto-deniega y el agente muere. Por eso `.claude/settings.json` ya allowlistea `node automation/db/query.js`, `node automation/db/cotejo-payload.js`, lectura de `automation/**` y escritura de temporales `automation/db/_tmp_*.json`. **El agente BD NO escribe el reporte** (esa escritura sí se auto-deniega en background): produce la sección y la **DEVUELVE** como texto; el **orquestador la anexa** al recoger la notificación (foreground, 1 paso). NO uses Write/Edit sobre el reporte ni `rm` desde el agente BD.

```
Eres agente BD — cotejo campo-a-campo por PAYLOAD · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE} · Módulo: {MODULO}
Trabajo de SOLO Bash (BD read-only): NO Playwright, NO adb tap, NO tocar la app.
PERMISOS: comandos allowlisteados disponibles (query.js, cotejo-payload.js, lectura automation/**, temporal automation/db/_tmp_*.json). NO escribas el reporte del módulo ni borres archivos — DEVOLVÉ el markdown y el orquestador lo anexa.

OBJETIVO: confirmar que **lo que se envió (payload) == lo que se guardó (nube)**, campo por campo,
registro completo (cabecera + líneas), para cada payload que el agente UI capturó.

LECTURA OBLIGATORIA: automation/cdp/RUNTIME.md §10 + automation/db/COTEJO-BD.md (regla payload-driven + marcas BD-FIELD-*).

PASOS:
1. Leer {RUN_DIR}_payloads.jsonl y filtrar los payloads de ESTE módulo por el endpoint en `url`
   ({MODULO}: returnservice/return, orderservice/order, collectionservice/collection, depositservice/deposit,
    visitservice/visit, clientstockservice/clientstock, potentialclientservice/potentialclient).
   Si no hay → reportar "sin payloads a cotejar" y terminar (no es error).
2. Por cada payload, escribirlo a un archivo temporal `automation/db/_tmp_{MODULO}_{i}.json` (ruta allowlisteada) y correr:
     node automation/db/cotejo-payload.js {QA_CLIENTE} automation/db/_tmp_{MODULO}_{i}.json
   Esperar/reintentar ~10s si la nube aún no tiene la fila (sync asíncrono) → reintentar 1 vez.
   Si el payload viene en formato resumen (no la estructura anidada que espera el motor) o cotejo-payload.js no aplica → caer a verificación equivalente con `node automation/db/query.js {QA_CLIENTE} "SELECT ..."` (cabecera + hijas) y reportarlo como nota.
3. Interpretar la salida JSON (marca + header + children + resumen.mismatches + resumen.notas).

SALIDA (DEVOLVER como texto — NO escribir el reporte; el orquestador anexa): bloque markdown con la sección "## Verificación BD (payload ↔ nube)":
| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
y, para los MISMATCH, el detalle campo a campo (campo · payload · nube).
Marcas: BD-FIELD-OK · BD-FIELD-MISMATCH (≥1 campo lleno difiere) · BD-SAVED (no llegó a la nube) · BD-N/A (BD inaccesible — la corrida sigue igual).
CALIBRACIÓN: si hay notas "campo del payload sin columna en nube (posible rename)" o campos extra → incluirlas en la salida para que el orquestador las sume al fieldMap/ignore de cotejo-payload.js (no son mismatch).

BLINDAJE: si cotejo-payload.js devuelve BD-N/A → reportarlo y seguir; la BD NUNCA tumba el smoke.
DEVOLVER: módulo {MODULO}, conteo por marca (OK/MISMATCH/SAVED/N-A), mismatches reales, notas de calibración, y el **bloque markdown completo listo para pegar** (el orquestador lo anexa a {RUN_DIR}{MODULO}.md y borra el/los temporal/es).
```

> **Estado:** config de `cotejo-payload.js` calibrada para clientes/pedidos/inventarios/visitas/devoluciones/cobros-normal. Pendiente calibrar: cobros anticipo/retención/IGTF + depósitos (1 ejemplo de cada → las notas indican qué agregar al config). Ver `automation/db/COTEJO-BD.md`.

---

### AGENTE 6 — INVENTARIOS

**Estado inicial:** HOME | **Estado final:** HOME

```
Eres agente QA — módulo INVENTARIOS · Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}

LECTURA OBLIGATORIA:
1. automation/cdp/RUNTIME.md
2. automation/smoke/smoke-inventarios.md   ← contiene nota crítica fillNgModelKeyboard
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/inventarios.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.inventarios + vgs.expirationBatch + vgs.suggestedOrderByDispatchAndReturn del YAML]

REPORTE: {RUN_DIR}inventarios.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/depositos.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.depositos completo del YAML]

REPORTE: {RUN_DIR}depositos.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/visitas.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.visitas + vgs.signatureVisit + vgs.userCanUploadFiles del YAML]

REPORTE: {RUN_DIR}visitas.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/productos.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.productos del YAML]

REPORTE: {RUN_DIR}productos.md
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
3. automation/cdp/module-selectors/_comunes.md + automation/cdp/module-selectors/vendedores.md  ← solo estos dos

INICIO:
const h  = require('{RUTA_HELPERS}');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);

DATOS DE PRUEBA — {QA_CLIENTE}:
[ORQUESTADOR: inyectar modules.vendedores + vgs.esVendedor del YAML]

REPORTE: {RUN_DIR}vendedores.md
REGISTROS CREADOS: ninguno (solo lectura).
Devolver: módulo VENDEDORES, counts, ruta.
```

---

### AGENTE 11 — CONSOLIDACIÓN DE MEMORIA (automático · solo si 10/10 completaron)

**Estado inicial:** 10 reportes + `consolidado.md` escritos | **No interactúa con la app** (solo edición de archivos · NO Playwright, NO adb)

```
Eres agente de consolidación de memoria QA — Denario Premium Móvil · RUN_ID: {RUN_ID} · Cliente: {QA_CLIENTE}
Trabajo de SOLO edición de archivos: NO Playwright, NO adb, NO tocar la app.

Sigue al pie de la letra: guiones-regresion/prompt-consolidar-hallazgos.md
- QA_CLIENTE: {QA_CLIENTE}
- RUN_DIR: {RUN_DIR}

Lee la sección "## Patrones / selectores nuevos" de cada reporte en {RUN_DIR} y promuévelos:
- DOM estándar / anti-patrón → automation/cdp/module-selectors/{modulo}.md (transversal CDP → _comunes.md) con tag [{QA_CLIENTE}-{fecha}]
- Atado a VG o dato de cliente → inline en automation/clientes/{QA_CLIENTE}.yaml
- Confirmado en 2+ corridas → RUNTIME.md / denario-cdp-helpers.js
Marca cada sección procesada con "> ✅ consolidado {fecha}". NO toques defectos_abiertos. NO git commit/push.
Actualiza ultima_corrida.run_id y .fecha del YAML al de esta corrida.

Devuelve: tabla resumen (Patrón | Módulo | Decisión | Acción) + conteos + lista de archivos modificados.
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
| **Resultado global** | <N> PASS · <N> FAIL · <N> SKIP · <N> N/A · <N> BLOCKED |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-XXX-NNN | ... | ✅ PASS / ❌ FAIL / ⏭ SKIP / 🚫 N/A / ⛔ BLOCKED | ... |

> **Ledger:** además de este `.md`, anexar a `{RUN_DIR}_results.jsonl` una línea JSON por caso — `{"run_id","modulo","caso","resultado","ms","intentos","bd"}` (ver RUNTIME §6).

## Verificación BD (solo agentes transaccionales · ver RUNTIME §10)

*(Omitir esta sección en Login/Productos/Vendedores — solo-lectura.)*

| Registro (Nro.Ref UI) | Marca BD | Fila observada (id / co / st) | Cuadra (cabecera/detalle/montos) | Correlación Ref↔fila |
|-----------------------|----------|-------------------------------|----------------------------------|----------------------|
| ... | BD-OK / BD-MISMATCH / BD-N/A / BD-INFO | id_x=.. · co_x=.. · st_x=.. | sí / detalle≠UI / monto≠UI | Ref==co_x? / pendiente |

*(Si la BD no respondió: una fila `BD-N/A` con el motivo. En corridas de descubrimiento todo va `BD-INFO`.)*

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ... | universal / cliente | ... |

*(si no hubo ninguno, escribir "ninguno". Lo lee `prompt-consolidar-hallazgos.md` al cierre de la corrida.)*

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
| **Resultado global** | <N> PASS · <N> FAIL · <N> SKIP · <N> N/A · <N> BLOCKED de 137 casos |

## Resumen por módulo

| Módulo | Casos | PASS | FAIL | SKIP | N/A | BLK | Estado |
|--------|-------|------|------|------|-----|-----|--------|
| Login | 6 | | | | | | ✅/❌ |
| Clientes | 12 | | | | | | ✅/❌ |
| Pedidos | 14 | | | | | | ✅/❌ |
| Cobros | 34 | | | | | | ✅/❌ |
| Devoluciones | 14 | | | | | | ✅/❌ |
| Inventarios | 16 | | | | | | ✅/❌ |
| Depósitos | 12 | | | | | | ✅/❌ |
| Visitas | 16 | | | | | | ✅/❌ |
| Productos | 10 | | | | | | ✅/❌ |
| Vendedores | 3 | | | | | | ✅/❌ |
| **TOTAL** | **137** | | | | | | |

## FAIL críticos (S1/S2)

| ID | Módulo | Descripción | Severidad |
|----|--------|-------------|-----------|

## Registros enviados al sistema (persisten)

Agregar aquí los registros **enviados / persistentes** que reportó cada agente en su tabla "Registros creados". NO listar los temporales (Ref 0 creados y eliminados dentro de su propio caso).

| Módulo | Ref / Nro | Detalle | Estado |
|--------|-----------|---------|--------|
| Clientes | | | Enviado |
| Pedidos | | | Enviado |
| Cobros | | | Enviado |
| Devoluciones | | | Enviada |
| Inventarios | | | Enviado |
| Depósitos | | | Enviado |
| Visitas | | | Enviada |

*(Omitir las filas de módulos que no crean registros: Login, Productos, Vendedores. Quitar filas sin registro real en esta corrida.)*

**Pendientes de envío manual:** listar cobros/visitas en estado Guardado que requieren adjunto o acción manual (con su motivo), o "ninguno".

## Observaciones generales

...

## Memoria: patrones promovidos (Agente 11 — consolidación)

| Patrón | Módulo | Destino |
|--------|--------|---------|
| ... | ... | module-selectors/ / YAML cliente / RUNTIME |

*(Resumen que devolvió el Agente 11. Revisar el `git diff` de `module-selectors/` y del YAML antes de commitear.)*

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
| CDP no responde en :9220 | Detener y avisar al usuario: "Ejecutar `.\automation\cdp\setup-cdp.ps1 -Reforward` (auto-repara el forward al PID vivo)". Si tampoco así, `.\automation\cdp\setup-cdp.ps1` (pre-vuelo completo). |
| `fetchCreds()` lanza error (archivo no encontrado) | Verificar que `secrets/qa-credentials.env` existe en la raíz de `qa-piloto-automatizacion/` |
| FAIL S1 en un módulo | Registrar en consolidado; continuar con el siguiente módulo |
| App en estado inconsistente al iniciar agente | Avisar al usuario: "Ejecutar `adb shell am force-stop com.kiberno.denarioPremiumPro` y relanzar la app" |
| Diálogo nativo de Android visible | Avisar al usuario para que lo descarte manualmente — CDP no puede controlarlo |
| Agente devuelve `MODULO ABORTADO:` (cuelgue CDP o techo de wall-clock) | No relanzarlo. Anotar en el consolidado, verificar CDP con `curl :9220/json/version` y seguir con el módulo siguiente. Corrida queda **parcial** → sin Agente 11 |
| CDP caído tras un `MODULO ABORTADO` | Detener la corrida y avisar (`setup-cdp.ps1 -Reforward`) — no encadenar módulos contra un CDP muerto |
| `QA_MODE=record` y la grabación falla | **No** detener nada: anotar el motivo en el reporte del módulo y seguir la corrida normal (la traza es subproducto, RUNTIME §12) |

═══════════════════════════════════════════════════════════
─── FIN DEL PROMPT ───
═══════════════════════════════════════════════════════════

---

*Archivo generado por Claude Code · QA Piloto Denario Premium Móvil · 2026-05-27*
