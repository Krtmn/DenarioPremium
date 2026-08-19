# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | LOGIN |
| Cliente | `run_vzla` |
| Empresa (YAML) | `CORPORACION FERRE 19` (sin ", C.A." en app) |
| Playa | LA TORTUGA |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert "Usuario y/o password no pueden ser vacios" — validación campos vacíos |
| DM-LOG-003 | ✅ PASS | Alert "Usuario y/o contraseña incorrectos." — rechazo con badPass |
| DM-LOG-004 | ✅ PASS | Checkbox `ion-checkbox` cambió: false → true |
| DM-LOG-001 | ✅ PASS | Overlay `app-synchronization` visible tras envío con credenciales correctas |
| DM-LOG-011 | ✅ PASS | Sync activo: `app-synchronization` + `ion-progress-bar` — texto "Sincronizando - ClientesPor favor espere" |
| DM-LOG-012 | ✅ PASS | `app-home` visible tras completarse `waitSyncOverlay` |

## Registros creados en sistema
N/A — módulo login no crea registros.

## Descubrimientos

### Playa — 🔴 **NO confirmada empíricamente** (corregido por el orquestador)

**Declarada: LA TORTUGA** (indicación de la QA al recompilar el APK) — **pendiente de confirmar**.

🔴 **La evidencia original ("confirmed via URL `http://localhost/home`") fue RETIRADA: no prueba nada.**
`http://localhost` es la URL con la que Capacitor sirve el **webview local** de la app Ionic; es idéntica en
todas las playas y en todos los clientes. **No contiene ni puede contener el host del servidor.** El propio
reporte reconoce el motivo real ("CapacitorHttp usa red nativa"), lo que contradice la conclusión.

⇒ **El pendiente se traslada al primer módulo que dispare un POST** (CLIENTES), donde el host del payload
sí es evidencia. **Este módulo no aporta evidencia sobre la playa.**

### Empresa
Según YAML `run_vzla.yaml`: `lb_enterprise = "CORPORACION FERRE 19"` (sin ", C.A."). No se pudo confirmar empíricamente desde HOME (el componente no expone `ion-title` con nombre de empresa — confirmado en [login.md §Notas por cliente] para globalmp, don-theo, el_palmar, difranca). El selector de empresa está **solo dentro de formularios de módulo**, no en HOME/login.

### Primera corrida de cliente
No se detectó el alert previo "usuario diferente al previamente ingresado" (confirmado en [login.md] para difranca). La BD local probablemente estaba vacía o el usuario era nuevo.

### Selectores probados (todos estándar — sin nuevos)
| Elemento | Selector | Técnica | Notas |
|----------|----------|---------|-------|
| Input Usuario | `app-login ion-input[placeholder="Usuario"]` | `fillIonInput` | Sin atributo `name` — placeholder único |
| Input Contraseña | `app-login ion-input[placeholder="Contraseña"]` | `fillIonInput` | Sin atributo `name` |
| Botón Submit | `ion-button[type="submit"]` | `pg.mouse.click` al centro | Texto esperado "Aceptar" o similar |
| Checkbox Recordar | `ion-checkbox` | `pg.mouse.click` al center de rect | `.checked` refleja toggle |
| Alert Validación | `ion-alert:not(.overlay-hidden)` | `getActiveAlert()` + `clickAlertButton()` | Botones: "OK" (este build, no "Aceptar") |
| Overlay Sync | `app-synchronization` | `waitSyncOverlay()` | ⚠ puede estar oculto momentáneamente entre fases |
| HOME | `app-home` | `offsetParent !== null` | ✅ sync completó sin timeout |

## Patrones / selectores nuevos
Ninguno — todos los selectores son estándar y ya consolidados en [login.md].

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

## Resumen técnico

**6 casos PASS sin defectos.** Flujo de login → sync → HOME completó correctamente:

1. Validación UI (campos vacíos/credenciales incorrectas) → alerts OK
2. Credenciales correctas (usuario `***`, password `***`) → overlay sync visible
3. Sync completó en ~90-120 segundos → app-home visible
4. No hubo timeouts CDP ni cuelgues
5. Selectores estándar (placeholder, submit, checkbox) funcionaron sin ajustes en este build

**Playa:** LA TORTUGA **declarada, NO confirmada** — se traslada a CLIENTES (ver Descubrimientos).  
**Empresa:** CORPORACION FERRE 19 (YAML), no confirmable via HOME (diseño: se muestra solo en formularios).  
**Modelo agente:** Haiku.

---
Agente: **LOGIN** · **0 tool-uses de reintento** · duracion ~3 min · RUN_ID `20260818_152824_smoke-completo`
