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
| `automation/reports/lecciones-aprendidas-cdp.md` completo | Los patrones ya están en este archivo y en helpers.js |
| `../src/` | Solo si hay FAIL S1 que requiera confirmar bug en código |

**Sí leer:** `automation/cdp/RUNTIME.md` + `automation/smoke/smoke-{modulo}.md` + `automation/clientes/{QA_CLIENTE}.yaml`.

---

## 1. Inicio obligatorio (toda sesión CDP)

```javascript
// Primeras 3 líneas de cada browser_run_code_unsafe — sin excepciones
const h  = require('C:/Users/Personal/OneDrive/Documentos/kiberno/DenarioPremium/DenarioPremiunMovil/qa-piloto-automatizacion/automation/cdp/denario-cdp-helpers.js');
const pg = await h.connectCdp(page);
await h.waitSyncOverlay(pg);
// Credenciales cuando se necesiten: const creds = await h.fetchCreds();
// fetchCreds() lee secrets/qa-credentials.env directamente — no requiere servidor externo
```

Si `require()` no está disponible: leer el archivo y copiar las funciones verbatim.

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
- **Archivos globales (raíz `reports/`):** `lecciones-DELTA.md`, `lecciones-aprendidas-cdp.md`
- **Credenciales:** `secrets/qa-credentials.env` (playa activa) o `secrets/playas/{playa_id}.env` (multi-playa)
- **Cliente activo:** leer de `automation/clientes/{QA_CLIENTE}.yaml` donde `QA_CLIENTE` viene en el prompt del orquestador

---

## 8. Lecciones DELTA

Si existe `automation/reports/lecciones-DELTA.md` con contenido, el orquestador lo lee en Paso 0 y lo incluye como contexto adicional en los prompts de agentes afectados.

Los agentes individuales **no** leen este archivo por defecto — el orquestador inyecta solo lo relevante al módulo.

Cuando un patrón del DELTA se confirma en 2+ corridas → mover a RUNTIME.md o helpers.js y registrar en la tabla de graduaciones del DELTA.

---

*Versión: Fase 4 · 2026-06-02 · post-RUN_ID 20260529_145657*
*Actualizar tras cada corrida que descubra patrones nuevos graduados desde lecciones-DELTA.md*
