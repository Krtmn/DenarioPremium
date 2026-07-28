# RUNTIME — Denario Premium Móvil QA
## Referencia operativa universal · todas las playas

Leer una sola vez al inicio de cada sesión de agente.
Implementación de helpers en `denario-cdp-helpers.js` (misma carpeta).

---

## LECTURA PROHIBIDA EN CORRIDAS SMOKE

No leer los siguientes archivos durante una corrida smoke (gastan tokens sin aportar):

| Prohibido leer | Por qué |
|----------------|---------|
| `denario-movil-para-claude.xml` | ~800k tokens — solo para análisis de código |
| `guiones-regresion/guion-*.md` completos | Los smoke extracts (`automation/smoke/`) son suficientes |
| `../src/` | Solo si hay FAIL S1 que requiera confirmar bug en código |

**Sí leer:** `automation/cdp/RUNTIME.md` + `automation/smoke/smoke-{modulo}.md` + `automation/clientes/{QA_CLIENTE}.yaml` + `automation/cdp/module-selectors/_comunes.md` + `automation/cdp/module-selectors/{modulo}.md` (selectores ya probados — evita exploración DOM a ciegas). **NO** leer el resto de archivos de `module-selectors/` (solo el común + tu módulo).

---

## 1. Inicio obligatorio (toda sesión CDP)

```javascript
// Primeras 3 líneas de cada browser_run_code_unsafe — sin excepciones
const pg = await h.connectCdp(page);   // 'h' = funciones inlineadas (ver abajo)
const wd = h.makeWatchdog({ moduleMs: {TECHO_MODULO_MS} });   // techo del módulo — §11
await wd.run('waitSyncOverlay', () => h.waitSyncOverlay(pg));
// Credenciales: leer secrets/qa-credentials.env con Read y parsear el bloque "# Cliente: {QA_CLIENTE}" inline.
```

**Importante — en `browser_run_code_unsafe` NO existen `require` ni `fs`.** Por eso el arranque real es:
1. **Helper:** dos vías —
   - **(preferente · menos tokens) bundle auto-instalable:** leer `automation/cdp/helpers-inline.js` con **Read** y pasarlo **una sola vez** a `pg.evaluate(<contenido>)` tras `connectCdp`. Registra `window.__qaH` con las skills **puras-DOM** (`fillIonInput`, `getActiveView`, `clickIonItem`, `clickBack`, `coordsOf`, `alertButtonCoords`, `installPayloadCapture`, …). Luego usar `await pg.evaluate(() => window.__qaH.fillIonInput(...))` — **sin reinlinar** el cuerpo por uso. `window` persiste entre `evaluate` en la misma página.
   - **acciones que mezclan Playwright** (`mockCameraAdjunto`, `ensureAdjunto`, `openNuevoCobro`, `openDocumentDetail`, `fillNgModelKeyboard`, `waitSyncOverlay`): NO viven en el bundle (necesitan `pg.mouse`/`keyboard`/`waitForFunction`). Inlinarlas verbatim desde `denario-cdp-helpers.js` como hasta ahora. Para clicks de botón/alert: pedir coords a `window.__qaH.coordsOf(sel)` / `alertButtonCoords(txt)` y hacer `await pg.mouse.click(x, y)`.
   - **(fallback)** si el bundle no instala, inlinar todo desde `denario-cdp-helpers.js` como antes — sigue siendo válido.
2. **Credenciales:** leer `secrets/qa-credentials.env` con **Read** y parsear el bloque `# Cliente: {QA_CLIENTE}` en línea. **No** llamar `fetchCreds()` directo: usa `fs`/`require` y revienta en este contexto.
   > ⚠ **El archivo abre con un bloque `# USUARIO WEB`** (credenciales de la web de Denario, no de la app).
   > **Nunca** tomar "el primer `QA_USER=` del archivo": hay que anclar al marcador `# Cliente: {QA_CLIENTE}`
   > exacto. Si se usa el usuario web, el login falla en **todos** los clientes.

---

## 2. Tabla de Skills

| # | Skill | Función helper | Anti-patrón PROHIBIDO |
|---|-------|----------------|-----------------------|
| S1 | Radar de vista activa | `h.getActiveView(pg, ['comp-a', 'comp-b'])` | Buscar selectores sin verificar componente visible |
| S2 | Llenar ion-input (reactive form) | `h.fillIonInput(pg, selector, value)` | `pg.fill()`, `inp.value=` sin eventos |
| S2x | Llenar ngModel en modal inventario | `h.fillNgModelKeyboard(pg, selector, value)` — **solo** en `inventory-type-stocks-modal` | `fillIonInput` en campos cantidad/lote/fecha de inventario |
| S2v | Llenar ngModel en modal visitas (comentario) | `pg.focus(sel)` + `pg.keyboard.type(val)` — en `ion-modal ion-input` con `[(ngModel)]` | `fillIonInput` para campo comentario dentro de ion-modal |
| S3 | Click en botón ion-alert | `h.clickAlertButton(pg, 'Aceptar')` | `element.click()`, `dispatchEvent`, coords JSON fijas |
| S4 | Credenciales | Read de `secrets/qa-credentials.env` + parseo inline del bloque `# Cliente: {QA_CLIENTE}` (ver §1) | `h.fetchCreds()`/`require`/`fs` en contexto unsafe; hardcodear usuario/contraseña; **tomar el primer `QA_USER=` del archivo** (es el bloque `# USUARIO WEB`) |
| S5 | Alert activo (sin residuos) | `h.getActiveAlert(pg)` o `:not(.overlay-hidden)` | `querySelector('ion-alert')` sin filtrar overlay-hidden |
| — | Botón atrás | `h.clickBack(pg)` | `window.history.back()`, `pg.goBack()`, click directo en img sin `closest('a')` |
| — | ion-select + popover | `h.selectIonPopover(pg, selector, value)` | MouseEvent sobre ion-item/ion-radio dentro del popover |
| — | ion-datetime | `h.confirmDatetime(pg, selector)` | `querySelector('ion-button')` sin shadowRoot |
| — | Scroll infinito | `h.scrollInfinite(pg)` | Scroll nativo de página |
| — | Click ion-item | `h.clickIonItem(pg, selector)` | `pg.click()` directo en ion-item |
| — | Adjunto obligatorio (cobros/retención) | `h.installCameraMock(pg)` **primero**, luego `h.mockCameraAdjunto(pg)` | 🔴 **Clickear "TOMAR FOTO" sin el mock del bridge** (abre la cámara NATIVA y cuelga la app, sin salida automática); parchear `Capacitor.Plugins.Camera.getPhoto` (es un **Proxy**: la asignación no se pega y da un **falso OK**); ignorar el bloqueo como "VG esperada" |
| S6 | Techo de tiempo por operación | `h.withTimeout(promesa, ms, 'label')` | Esperar indefinidamente a un `pg.*` que no responde |
| S7 | Watchdog del módulo (cuelgues + wall-clock) | `h.makeWatchdog({moduleMs})` + `wd.run('label', () => …)` | Correr un módulo sin techo de wall-clock (ver §11) |

---

## 3. Anti-patrones globales

```
✗  adb shell input tap / text / keyevent     → solo Playwright MCP
✗  style.display='none' para ocultar alerts  → siempre click en dismiss/OK
✗  querySelector('ion-alert') sin :not(.overlay-hidden) → usar h.getActiveAlert()
✗  pg.keyboard.type() fuera de inventory-modal o ion-modal ngModel → usar h.fillIonInput()
✗  Coordenadas JSON hardcodeadas en alerts   → usar h.clickAlertButton()
✗  connectOverCDP inline en cada agente      → usar h.connectCdp(page)
✗  page.screenshot() / pg.screenshot()      → timeout de fuentes; usar browser_snapshot o DOM eval
✗  pg.goto() en WebApp Capacitor            → reinicia estado Angular; navegar siempre con clicks DOM
✗  Insistir >2 intentos con un selector/flujo que no responde → marcar el caso ⛔ BLOCKED y SEGUIR (no explorar a ciegas)
```

**Techo de intentos (universal):** ningún caso debe consumir más de **2 intentos acotados** peleando con un selector/flujo que no responde por CDP. Tras el 2º intento fallido → `⛔ BLOCKED` con el motivo (no es FAIL ni N/A), registrar y continuar con el siguiente caso. El fail-fast ya implementado en `h.ensureAdjunto` es el patrón a generalizar. Esto evita el atascamiento histórico (cobros llegó a 277 tool-uses por insistir en atajos).

---

## 4. N/A vs FAIL

| Situación | Resultado correcto |
|-----------|-------------------|
| API no devuelve datos (sin cobros, sin inventario anterior, sin visitas del día) | N/A |
| VG inactiva en esta cuenta → botón/flujo no existe en UI | N/A |
| Módulo no visible para la cuenta QA | N/A |
| App hace algo incorrecto (lista vacía debiendo tener datos, botón que no habilita debiendo hacerlo) | FAIL |
| Adjunto obligatorio bloquea envío → alerta `COB_RET_MSJ_COLLECTION_NO_ATTACHMENTS` | FAIL — no "VG esperada" |
| "Salir sin guardar" mantiene visita ya Guardada | NO es FAIL — comportamiento correcto |
| "Salir sin guardar" en visita nueva que nunca fue guardada → visita persiste | FAIL |
| Selector/flujo no responde por CDP tras 2 intentos acotados | ⛔ BLOCKED (limitación de automatización, NO defecto de app — no contamina FAIL ni N/A) |
| CDP cuelga (`TIMEOUT:`) o se corta la conexión (`CDP-DOWN:`) | ⛔ BLOCKED con motivo `cuelgue CDP` — infra, NO defecto de app (ver §11) |
| Módulo abortado por watchdog (`ABORT-MODULE:`) | Casos restantes ⛔ BLOCKED `techo de módulo`; devolver al orquestador y seguir con el módulo siguiente |

---

## 5. Defectos conocidos (v6.6.14 — no re-marcar FAIL sin cambio de código)

| Módulo | Caso | Comportamiento |
|--------|------|----------------|
| Depósitos | DM-DEP-018/019/020 | Lista BUSCAR no renderiza tras guardar — bug en `deposit.service.ts` |
| Visitas | DM-VIS-020 | Modal confirmación envío aparece antes de validar actividades — UX, no bloquea |
| Inventarios | DM-INV-026 | Formulario Guardado abre en tab General en lugar de Inventario |

---

## 6. Formato de reporte compacto

```markdown
# Smoke Test — Módulo <NOMBRE>
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `<RUN_ID>` |
| Módulo | <NOMBRE> |
| Dispositivo | <ADB_SERIAL> |
| App | `com.kiberno.denarioPremiumPro` — v<VERSION> |
| Playa | <PLAYA_ID> |
| Resultado | <N> PASS · <N> FAIL · <N> SKIP · <N> N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-XXX-NNN | ✅ PASS / ❌ FAIL / ⏭ SKIP / 🚫 N/A / ⛔ BLOCKED | evidencia 1 línea |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ... | universal / cliente | ... |

*(si no hubo ninguno, escribir "ninguno". Lo lee `prompt-consolidar-hallazgos.md` al cierre.)*

## Hallazgos (solo si hay FAIL)
...
```

### Ledger machine-readable (además del `.md`)

Cada agente, **además** de su reporte `.md`, anexa al ledger de la corrida `{RUN_DIR}_results.jsonl` **una línea JSON por caso ejecutado** (formato append, una transacción por línea):

```json
{"run_id":"<RUN_ID>","modulo":"cobros","caso":"DM-COB-019","resultado":"PASS","ms":4200,"intentos":1,"bd":"BD-OK"}
```

Campos: `run_id` · `modulo` · `caso` · `resultado` (PASS/FAIL/SKIP/N-A/BLOCKED) · `ms` (duración aprox. del caso) · `intentos` (1-2, ver techo §3) · `bd` (marca BD si aplica, o `null`). Lo agrega `automation/reports/aggregate.js` para medir tendencia (flakiness por caso, ms/módulo) entre corridas — es el instrumento de mejora progresiva. El `.md` sigue siendo la evidencia humana; el `.jsonl` es la fuente agregable.

---

## 7. Convención RUN_ID y rutas

- **Formato RUN_ID:** `YYYYMMDD_HHMMSS_smoke-completo`
- **Carpeta de corrida:** `automation/reports/{tipo}_{cliente}_{YYYYMMDD}_{HHMMSS}/`
  - Ejemplo: `automation/reports/smoke_insumar_20260603_093706/`
  - El orquestador crea esta carpeta en Paso 0 (`RUN_DIR`).
- **Reporte de módulo:** `{RUN_DIR}{modulo}.md` → ej. `smoke_insumar_20260603_093706/cobros.md`
- **Consolidado:** `{RUN_DIR}consolidado.md`
- **Reportes:** cada corrida en su carpeta `{RUN_DIR}`; índice en `automation/reports/README.md`
- **Credenciales:** `secrets/qa-credentials.env` (playa activa) o `secrets/playas/{playa_id}.env` (multi-playa)
- **Cliente activo:** leer de `automation/clientes/{QA_CLIENTE}.yaml` donde `QA_CLIENTE` viene en el prompt del orquestador

---

## 8. Consolidación de memoria post-corrida

Los patrones nuevos de cada corrida se capturan en la sección `## Patrones / selectores nuevos` del reporte de cada módulo (`{RUN_DIR}{modulo}.md`). **No hay archivo DELTA intermedio.**

Al cierre de la corrida se ejecuta `guiones-regresion/prompt-consolidar-hallazgos.md`, que lee esos reportes y promueve cada patrón a su hogar definitivo:
- **DOM estándar / anti-patrón** → `module-selectors/{modulo}.md` (transversal CDP → `_comunes.md`); basta 1 corrida confirmada, con tag.
- **Atado a VG o dato de cliente** → inline en el YAML del cliente.
- **Confirmado en 2+ corridas distintas** → graduar a `RUNTIME.md` o `denario-cdp-helpers.js`.

Los agentes de módulo leen `module-selectors/_comunes.md` + `module-selectors/{modulo}.md` (solo su archivo, no el monolito) en cada corrida — mantener cada archivo afilado y bajo ~120 líneas es lo que abarata las corridas (evita re-explorar el DOM a ciegas).

---

## 9. Oráculo de persistencia (round-trip Guardar → reabrir)

Muchos bugs no se ven al **crear** un registro, sino al **reabrirlo**: un valor se guarda mal, o no se relee, y la UI muestra algo distinto a lo guardado. El smoke debe cazar estas regresiones **por sí solo**, no solo donde un caso lo pida explícitamente.

**Regla general (aplica a TODO campo editable con valor por defecto):**
Tras Guardar un registro (cobro, pedido, inventario, visita…), **reabrirlo desde BUSCAR y comparar cada valor relevante contra lo que se guardó**. Cualquier divergencia silenciosa —el valor cambió solo, o revirtió al default ignorando el cambio del usuario— es **FAIL**, no "comportamiento esperado".

**Cómo aplicarlo:**
1. **Antes de guardar**, anotar los valores clave del formulario (tasa, IGTF, moneda, método de pago, montos, retenciones, lote/fecha…).
2. Guardar → salir → BUSCAR → reabrir el registro Guardado.
3. Releer los mismos valores y **comparar 1:1**.
4. Si un valor se muestra en 2 lugares (ej. selector IGTF **y** línea IGTF en Tab Total), **verificar ambos** — el bug puede dejar uno correcto y el otro no.

**Dos sabores del bug — probar ambos cuando hay un default:**
- **Default conservado:** dejar el valor por defecto → guardar → reabrir debe mostrar **ese mismo default** (FAIL si muta solo).
- **Cambio conservado:** cambiar el default a otro valor → guardar → reabrir debe mostrar **el valor elegido** (FAIL si revierte al default).

Casos que ya aplican este oráculo: DM-COB-042 (retención), DM-COB-039 (tasa), **DM-COB-044/045 (IGTF)**, DM-COB-016 (adjunto), DM-COB-024 (montos). Extender el patrón a cualquier campo nuevo con default.

---

## 10. Oráculo BD v2 — cotejo "lo guardado se envía" (extiende §9)

El §9 verifica round-trip **UI→UI** (Guardar→reabrir). El §10 verifica **UI→servidor**: que **todo movimiento que se guarda efectivamente se envía** a la nube, y caza lo que queda atascado. Aplica a los 7 transaccionales; login/productos/vendedores → `BD-N/A`.

**Cómo viaja una transacción (confirmado en `auto-send.service.ts` + por desarrollo):**
- **Guardar** → escribe la **BD LOCAL** del dispositivo (`st_delivery=3`, `id=0`). No sale del teléfono.
- **Enviar** → `INSERT INTO pending_transactions` (cola de salida) → `AutoSendService` hace POST a la nube **si hay conexión**; sin señal queda en la cola y **reintenta** en la próxima sync.
- **Server OK** → borra el pendiente, marca local `st_delivery=1` + `id_<x>` del servidor, sube fotos.
- El envío a la nube es **asíncrono/eventual** (no instantáneo) → por eso el cotejo de nube **espera/reintenta**.

**Dos lectores read-only (vía Bash, no CDP):**
| Lector | Lee | Para qué |
|---|---|---|
| `node automation/db/query.js {QA_CLIENTE} "SELECT…"` | **nube** (Postgres servidor; DSN del bloque `# Cliente:` de `qa-db.env`) | lo que llegó (durable) |
| `node automation/db/local-query.js "SELECT…"` | **SQLite local** del dispositivo (`adb run-as`, base `databases/denarioPremium`) | en-vuelo / atascado / rechazado / duplicado |

**Los 5 estados de un movimiento (mapa de cotejo):**
| Estado | Dónde se ve | Marca |
|---|---|---|
| **Enviado** | nube: existe + items + montos · local: `id>0`, `st_delivery=1`, fuera de `pending_transactions` | `BD-OK` |
| **Guardado sin enviar** | local: `st_delivery=3`/`id=0`, NO en cola | `BD-SAVED` — esperado si no se intentó enviar (ej. sin adjunto); **FAIL si se envió con adjunto y quedó así** |
| **En cola** | local: en `pending_transactions` tras la ventana de sync | `BD-QUEUED` — si persiste → flag (no sincronizó) |
| **Rechazado** | local: en `failed_transactions` (error 400) | `BD-MISMATCH` |
| **Duplicado** | `count(*) > count(DISTINCT co_*)` | `BD-MISMATCH` (no debe guardarse 2 veces) |

**Procedimiento por registro creado:**
1. **Baseline** al inicio del módulo: `count`/`max(id)` de la(s) tabla(s) (nube) → para el diff.
2. Tras Enviar, **esperar/reintentar** la nube (sync asíncrono): poll ~10s antes de concluir (no una sola consulta inmediata — así no se pierde un envío tardío como el id=14).
3. **Diff de baseline:** traer **toda** fila nueva (`id>baseline`), no solo la esperada → cero misses.
4. **Por items (co_type-aware en cobros):** verificar cada línea contra lo cargado por UI; totales como cruce. Cobros ramifica por `co_type`: `0`=docs+pagos · `1`=anticipo (solo pagos) · `2`=retención (solo docs + montos retención) · IGTF=`nu_amount_igtf` sobre el cobro.
5. **Reconciliar nube ↔ local:** dar la marca según el estado. La pregunta clave: **¿lo que se guardó, se envió?**

**Correlación Ref↔fila (CONFIRMADO piercar 2026-06-16, 5 módulos):** el **Nro.Ref de la UI = `id_<x>` (PK del servidor)**, NO el epoch `co_<x>`. Match directo `WHERE id_<x>=<Ref>`. Falta **1 corrida limpia** para graduar `BD-MISMATCH`→FAIL; hasta entonces va `BD-INFO`.

**Estados `st_*`:** localmente `st_delivery=1`=enviado / `=3`=guardado es el discriminador **fiable**. El `st_collection`/`st_order` del servidor varía por tipo y playa (caveat §5/§9) — corroborar por `id` + `st_delivery`, no por `st_*` global.

**Vocabulario:** `BD-OK` · `BD-SAVED` · `BD-QUEUED` · `BD-MISMATCH` · `BD-N/A` (solo-lectura / BD inaccesible) · `BD-INFO` (descubrimiento, no juzga).

**Blindaje (no negociable):** la BD **nunca** tumba el smoke. Si un lector da `ERR:` (red, grant, run-as) → `BD-N/A` con motivo y la parte UI corre y se reporta igual. Aditivo, no bloqueante.

**Reporte:** sub-sección `## Verificación BD` por agente transaccional: registro (Nro.Ref), marca, fila nube (id/estado/items), estado local (`st_delivery`/cola/rechazo), y la conclusión **guardado→enviado**.

### §10.b — Cotejo campo-a-campo (Nivel 2 · 2 agentes · piloto devoluciones)

El §10 base verifica campos clave (totales, conteos, estado). El **Nivel 2** verifica **TODO dato que se llenó**, registro completo (cabecera + líneas), con **dos agentes**:

- **Agente UI** (Playwright): ejecuta los casos y **emite un manifiesto** `{RUN_DIR}_bd-manifest.jsonl` con los `co_x` que crea (1 línea JSON por registro). No hace el cotejo.
- **Agente BD** (solo Bash, sin Playwright): lee el manifiesto y por cada `co_x` corre `node automation/db/cotejo-bd.js {cliente} {modulo} <co_x>`. Como usa otro recurso (BD, no el dispositivo), corre **en paralelo** con el agente UI del módulo siguiente.

**Motor `cotejo-bd.js`** — trae el registro completo de **local** (lo enviado) y **nube** (lo guardado) y compara campo por campo. **Regla local-driven (validada con QA):**
- campo **lleno en local** + llega igual → OK · lleno + falta/difiere en nube → **MISMATCH (se reporta)** · **vacío en local** (no se llenó) → se saltea.
- Campos del **servidor** (PK `id_*`, timestamps, flags de sync, montos recalculados) → excluidos siempre (lista `ignore` por módulo).
- Columnas con **nombre distinto** local↔nube → `fieldMap` (ej. `tx_comment`→`tx_description`).
- **Fechas:** veredicto por día; si la **hora** difiere (zona horaria local UTC-4 vs nube UTC) → se reporta como **nota**, no como mismatch.

**Esquema = universal · config = por cliente.** El mapeo (tablas/columnas/fieldMap/ignore) es del **modelo de datos del producto** → uno por módulo, igual para todos los clientes. Lo que cambia por cliente: la **conexión** (`qa-db.env`) y las **VGs/datos** (`{cliente}.yaml`). El arg `{cliente}` del motor solo elige la conexión.

**Marcas Nivel 2:** `BD-FIELD-OK` (todo lo lleno cuadra) · `BD-FIELD-MISMATCH` (≥1 campo lleno difiere) · `BD-SAVED` (registro en local, no llegó a la nube) · `BD-N/A` (BD inaccesible → la corrida sigue). Mismo blindaje: la BD nunca tumba el smoke.

> Estado: **piloto activado solo en devoluciones**. Extender a los otros 6 = agregar su config de módulo en `cotejo-bd.js` (cabecera/hijas/clave/fieldMap/ignore).

> Modelo de datos: `automation/db/modelo-datos-denario.md` (§8 mapa por módulo). Helpers de cobros: `denario-cdp-helpers.js` (`openNuevoCobro`, `ensureAdjunto`).

---

## 11. Watchdog de CDP — ningún módulo se cuelga en silencio

**Por qué existe:** en la corrida `ferrenuestro-20260723` el wall-clock fue **~15.7 h**, y no por volumen de casos: **2 cuelgues de CDP** (cobros ~2.7 h, productos ~9.9 h). Un `browser_run_code_unsafe` que no responde **no se detecta ni se corta solo** — el módulo queda colgado hasta el techo de sesión. Un solo hang puede multiplicar ×30 la duración de un módulo.

**Regla (obligatoria en todo agente de módulo):**

```javascript
const pg = await h.connectCdp(page);                      // ya trae techo 20s + 2 reintentos
const wd = h.makeWatchdog({ moduleMs: {TECHO_MODULO_MS}, page });  // ⚠ `page` OBLIGATORIO
await wd.run('waitSyncOverlay', () => h.waitSyncOverlay(pg));
await wd.run('openNuevoCobro',  () => h.openNuevoCobro(pg, 0));
```

> 🔴 **`setTimeout` NO existe en `browser_run_code_unsafe`.** Sin pasar `page`, el watchdog revienta con
> `ReferenceError: setTimeout is not defined` (regresión real, corrida el_valle-20260728). Con `page`,
> los helpers usan `page.waitForTimeout`. En contexto Node (scripts/self-tests) `page` se omite.

| Señal | Qué significa | Qué hace el agente |
|---|---|---|
| `TIMEOUT:<label>` | esa operación superó el techo (default **90 s**) | cuenta 1 cuelgue · marca el caso ⛔ BLOCKED `cuelgue CDP` · **sigue** con el caso siguiente |
| `CDP-DOWN: …` | `connectCdp` agotó sus reintentos | ⛔ BLOCKED e **intentar reconectar una vez** al inicio del caso siguiente; si vuelve a fallar → abortar módulo |
| `ABORT-MODULE:<n> cuelgues` | 2º cuelgue del módulo (default `maxHangs=2`) | **cortar el módulo ya**; casos restantes ⛔ BLOCKED |
| `ABORT-MODULE:techo-wall-clock` | el módulo superó su `moduleMs` | **cortar el módulo ya**; casos restantes ⛔ BLOCKED |

**Al abortar:** escribir igual el reporte `.md` + las líneas del ledger de lo ya ejecutado, **volver a HOME si se puede**, y devolver al orquestador `MODULO ABORTADO: <motivo> · <n> casos ejecutados · <n> BLOCKED`. El orquestador **continúa con el módulo siguiente** — un módulo abortado no tumba la corrida.

**Techos por defecto** (el orquestador puede ajustarlos por módulo): operación **90 s** · cuelgues tolerados **2** · wall-clock de módulo **45 min** (cobros y pedidos: **60 min**).

> `ABORT-MODULE` y `BLOCKED` por cuelgue son **infra**, no defectos de la app: no cuentan como FAIL ni como N/A (§4). `aggregate.js` los ve como salud de automatización.

---

## 12. Modo RECORD — grabar la traza para replay determinista (Ola 2)

**Para qué:** el costo real de una corrida no es la app, es **el modelo razonando entre cada acción** (~550 tool-uses/corrida). El modo RECORD graba, durante una corrida agéntica normal, la secuencia de operaciones deterministas que **de verdad funcionaron en ESE build**. Las corridas siguientes del mismo build/cliente la **reproducen** (REPLAY) en pocas `browser_run_code_unsafe`, y el modelo solo entra **ante divergencia**. Diseño completo: `automation/replay/README.md`.

**Cuándo aplica:** solo si el orquestador inyecta `QA_MODE=record` en el prompt del agente. **Sin ese flag el agente NO graba nada** y la corrida es idéntica a hoy.

**Cómo (grabar es aditivo — nunca puede tumbar la corrida):**

1. Leer `automation/replay/replay-engine.js` con **Read** e inlinar **solo** `installRecorder` y `dumpTrace` (≈12 líneas) — en `browser_run_code_unsafe` no hay `require` (§1). Es la **única** fuente de esas funciones: no reescribirlas de memoria.
2. Tras `connectCdp`: `const eng = await installRecorder(pg);`
3. Envolver cada operación determinista con el vocabulario de la traza:
   - `await eng.recCase('DM-COB-002')` → marca el inicio de un caso
   - `await eng.W('openNuevoCobro', h.openNuevoCobro, pg, 0)` → **ejecuta Y graba** el helper con sus args
   - `await eng.recEval("() => { … }", 'select-client')` → acción DOM a medida
   - `await eng.recAssert('5 tabs', "() => …")` → oráculo booleano del caso
4. **Al cierre del módulo**, volcar a `{RUN_DIR}_trace/{modulo}.trace.json` con este sobre:

```jsonc
{
  "run_id": "<RUN_ID>", "modulo": "cobros", "cliente": "<QA_CLIENTE>", "servidor": "<playa>",
  "build": { "app_version": "6.6.18", "window_ng": true },
  "data": { "cliente_test": "TORNICAGUA, C.A.", "documento": "00037192" },  // valores run-específicos usados
  "ops": [ /* lo que devolvió dumpTrace(pg) */ ]
}
```

**Reglas de higiene de la traza (si no se cumplen, la traza no sirve para replay):**

- **`data` es obligatorio** y debe listar **todo** valor run-específico que aparezca en args o en código (cliente, documento, montos, refs). Es lo que `substitute()` reemplaza al reproducir con otros datos. Si un valor no está en `data`, el replay lo repetirá literal y fallará.
- **Solo casos PASS.** Al volcar, **descartar los bloques de ops de casos que terminaron FAIL / BLOCKED / N/A** — reproducir un camino roto no aporta.
- **Nunca** grabar credenciales ni valores de `secrets/` en `data` ni en `code`.
- **Grabar no bloquea:** si `installRecorder` o el volcado fallan, registrar la nota en el reporte y **continuar la corrida normal**. La traza es un subproducto, no un entregable de la corrida.
- Reportar en el `.md` del módulo: `TRAZA: {n} ops · {n} casos grabados` (o el motivo si no se grabó).

**Validar la traza antes de confiar en ella** (fuera de la corrida, sin dispositivo):

```bash
node -e "const{validateTrace}=require('./automation/replay/replay-engine.js');const t=require('./<ruta>.trace.json');console.log(validateTrace(t))"
```
`[]` = estructuralmente válida.

> Modo REPLAY: aún **no** cableado — requiere primero una traza real grabada con este modo. Ver "Estado" en `automation/replay/README.md`.

---

*Versión: Fase 4 · 2026-06-09 · memoria sin DELTA (captura en reportes → consolidación directa)*
*§10 Oráculo BD v2 2026-06-17 (cotejo "lo guardado se envía": nube + local, 5 estados, baseline-diff, por items co_type-aware)*
*§11 Watchdog CDP + §12 modo RECORD 2026-07-28 (techo por operación/módulo tras el hang de 15.7h en ferrenuestro-20260723; grabación de traza para replay determinista — Ola 2)*
*Actualizar tras cada corrida que gradúe patrones a `module-selectors/` / `denario-cdp-helpers.js`*
