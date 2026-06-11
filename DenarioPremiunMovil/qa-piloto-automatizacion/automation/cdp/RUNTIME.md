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

**Sí leer:** `automation/cdp/RUNTIME.md` + `automation/smoke/smoke-{modulo}.md` + `automation/clientes/{QA_CLIENTE}.yaml` + sección del módulo en `automation/cdp/module-selectors.md` (selectores ya probados — evita exploración DOM a ciegas).

---

## 1. Inicio obligatorio (toda sesión CDP)

```javascript
// Primeras 3 líneas de cada browser_run_code_unsafe — sin excepciones
const pg = await h.connectCdp(page);   // 'h' = funciones inlineadas (ver abajo)
await h.waitSyncOverlay(pg);
// Credenciales: leer secrets/qa-credentials.env con Read y parsear el bloque "# Cliente: {QA_CLIENTE}" inline.
```

**Importante — en `browser_run_code_unsafe` NO existen `require` ni `fs`.** Por eso el arranque real es:
1. **Helper:** leer `automation/cdp/denario-cdp-helpers.js` con la herramienta **Read** (ruta **relativa** a la carpeta de trabajo — misma convención que RUNTIME.md y los smoke; **portable**, sin rutas absolutas) e **inlinear** verbatim las funciones que necesites (`connectCdp`, `fillIonInput`, `clickAlertButton`, `waitSyncOverlay`, …).
2. **Credenciales:** leer `secrets/qa-credentials.env` con **Read** y parsear el bloque `# Cliente: {QA_CLIENTE}` en línea. **No** llamar `fetchCreds()` directo: usa `fs`/`require` y revienta en este contexto.

---

## 2. Tabla de Skills

| # | Skill | Función helper | Anti-patrón PROHIBIDO |
|---|-------|----------------|-----------------------|
| S1 | Radar de vista activa | `h.getActiveView(pg, ['comp-a', 'comp-b'])` | Buscar selectores sin verificar componente visible |
| S2 | Llenar ion-input (reactive form) | `h.fillIonInput(pg, selector, value)` | `pg.fill()`, `inp.value=` sin eventos |
| S2x | Llenar ngModel en modal inventario | `h.fillNgModelKeyboard(pg, selector, value)` — **solo** en `inventory-type-stocks-modal` | `fillIonInput` en campos cantidad/lote/fecha de inventario |
| S2v | Llenar ngModel en modal visitas (comentario) | `pg.focus(sel)` + `pg.keyboard.type(val)` — en `ion-modal ion-input` con `[(ngModel)]` | `fillIonInput` para campo comentario dentro de ion-modal |
| S3 | Click en botón ion-alert | `h.clickAlertButton(pg, 'Aceptar')` | `element.click()`, `dispatchEvent`, coords JSON fijas |
| S4 | Credenciales | `h.fetchCreds()` una vez al inicio | Hardcodear usuario/contraseña |
| S5 | Alert activo (sin residuos) | `h.getActiveAlert(pg)` o `:not(.overlay-hidden)` | `querySelector('ion-alert')` sin filtrar overlay-hidden |
| — | Botón atrás | `h.clickBack(pg)` | `window.history.back()`, `pg.goBack()`, click directo en img sin `closest('a')` |
| — | ion-select + popover | `h.selectIonPopover(pg, selector, value)` | MouseEvent sobre ion-item/ion-radio dentro del popover |
| — | ion-datetime | `h.confirmDatetime(pg, selector)` | `querySelector('ion-button')` sin shadowRoot |
| — | Scroll infinito | `h.scrollInfinite(pg)` | Scroll nativo de página |
| — | Click ion-item | `h.clickIonItem(pg, selector)` | `pg.click()` directo en ion-item |
| — | Adjunto obligatorio (cobros/retención) | `h.mockCameraAdjunto(pg)` | `window.ng.getComponent` (solo dev build); ignorar el bloqueo como "VG esperada" |

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
```

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
| DM-XXX-NNN | ✅ PASS / ❌ FAIL / ⏭ SKIP / 🚫 N/A | evidencia 1 línea |

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
- **DOM estándar / anti-patrón** → `module-selectors.md` (basta 1 corrida confirmada, con tag).
- **Atado a VG o dato de cliente** → inline en el YAML del cliente.
- **Confirmado en 2+ corridas distintas** → graduar a `RUNTIME.md` o `denario-cdp-helpers.js`.

Los agentes de módulo leen `module-selectors.md` (su sección) en cada corrida — mantenerlo afilado y bajo ~800 líneas es lo que abarata las corridas (evita re-explorar el DOM a ciegas).

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

*Versión: Fase 4 · 2026-06-09 · memoria sin DELTA (captura en reportes → consolidación directa)*
*Actualizar tras cada corrida que gradúe patrones a `module-selectors.md` / `denario-cdp-helpers.js`*
