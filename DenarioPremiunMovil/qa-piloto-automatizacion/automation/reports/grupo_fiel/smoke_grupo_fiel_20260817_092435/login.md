# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | LOGIN |
| Cliente | grupo_fiel |
| Dispositivo | CDP :9220 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (db19) |
| Playa | Pendiente (módulo Clientes capturará desde 1.ª request HTTP) |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert "no pueden ser vacios" aparece al enviar sin llenar |
| DM-LOG-003 | ✅ PASS | Alert "incorrectos" aparece con credenciales malas |
| DM-LOG-004 | ✅ PASS | Checkbox `checked=true` tras click |
| DM-LOG-001 | ✅ PASS | `app-synchronization` visible tras enviar credenciales correctas |
| DM-LOG-011 | ✅ PASS | Overlay sync + progress-bar activos |
| DM-LOG-012 | ✅ PASS | `app-home` visible tras completar sincronización |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones (solo lectura de login) | N/A |

## Patrones / selectores nuevos
ninguno

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

## Descubrimientos obligatorios (insumo Agentes 2-10)

### 1. PLAYA / SERVIDOR efectivo
**Estado:** PENDIENTE — No se almacena en localStorage (es propiedad del servidor, rotativa, descubierta en runtime)

**Captura en siguiente módulo:** El módulo Clientes (módulo 2) capturará la playa desde la 1.ª request HTTP a través del hook de payload Capacitor.

### 2. BUILD
**app_version:** `1.0`
**db_version:** `19`
**window.ng:** `true` (Angular disponible en ventana global — build con `window.ng` presente; idéntico a ferrenuestro La Tortuga post-migración 20260723)

### 3. Nombre EXACTO de la empresa
**UI:** No se mostró nombre de empresa en HOME (pantalla principal con módulos)
**Esperado por BD:** GRUPO FIEL, S.A. (GRUFISA)
**Esperado truncado (20 chars):** `GRUPO FIEL, S.A. (GR` (marcar ⚠ al cotejar contra `lb_enterprise`)

⚠ **Verificar:** La empresa no aparece en la cabecera de HOME — consistente con `enterpriseEnabled=false` y una sola empresa. Sin selector de empresa post-login en ningún módulo (confirmación a anotar en módulos posteriores).

### 4. Usuario logueado en pantalla
**Mostrado en HOME:** No hay rótulo de usuario visible en la pantalla
**Usuario operativo (del login):** `johana` → Johana Belandria (idUser=463, co_user='003' en BD, email grecia.valerio@kiberno.com)
**Roles/Permisos:** cliente=false, promotor=false, soporte=false, transportista=false, catalogo=false (usuario vendedor puro)

---

## Watchdog CDP
**Cuelgues:** 0 (techo de módulo: 2.700 s / 45 min)
**Estado:** ✅ Conexión estable, sin timeouts.

## Verificación BD
**Tipo:** N/A (módulo LOGIN = solo-lectura)
**Notas:** ninguna

---

*Generado: 2026-08-17 · Agente QA LOGIN · RUN_ID 20260817_092435_smoke-completo*
