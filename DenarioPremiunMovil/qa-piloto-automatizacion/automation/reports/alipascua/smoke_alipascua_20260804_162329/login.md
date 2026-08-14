# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | EL YAQUE |
| Resultado | 5 PASS · 1 FAIL · 0 BLOCKED · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert "Usuario y/o password no pueden ser vacios" aparece · botón "OK" (quirk build) · dismiss OK |
| DM-LOG-003 | ❌ FAIL | Alert NO aparece tras credenciales incorrectas · app queda en LOGIN indefinido (error S1) |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario" toggle funciona |
| DM-LOG-001 | ✅ PASS | Login con credenciales correctas (`***`/`***`) dispara sync |
| DM-LOG-011 | ✅ PASS | app-synchronization visible con ion-progress-bar activo |
| DM-LOG-012 | ✅ PASS | Sync completa, app-home visible tras waitSyncOverlay, app-login no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones (solo login/navegación) | N/A |

## Estado descubierto
- **App version:** 1.0
- **Empresa (UI post-login):** ALIPASCUA, C.A. (1 empresa, `enterpriseEnabled=false` ✓)
- **GPS status:** `userMustActivateGPS=true` — **verificación manual requerida en el dispositivo**
- **WsUrl servidor:** ✓ `denarioelyaque.ddns.net:8081/PremiumWS/services/` (EL YAQUE confirmado)
- **localStorage:** `coUser=002`, `idUser=468`, `db_version=19` ✓

## Verificación BD
N/A — módulo sin transacciones (solo navegación).

## Hallazgos

### ❌ FAIL S1 — DM-LOG-003: Validación de credenciales incorrectas NO funciona
**Problema:** La app NO dispara alert ni da retroalimentación al enviar credenciales incorrectas. El usuario queda en LOGIN indefinido sin saber que la autenticación falló.

**Evidencia:** Tras llenar usuario correcto + contraseña incorrecta y clickear submit:
- ❌ No aparece alert "Usuario y/o contraseña incorrectos"
- ❌ App no entra a HOME (correcto)
- ❌ App tampoco muestra mensaje de error
- ⚠️ Estado indefinido (botones no responden hasta reload)

**Impacto:** Pérdida completa de feedback para login fallido. Usuario experimenta cuelgue.

### 🔴 Quirk de build (no-bloqueante) — DM-LOG-002: Alert buttons usan "OK", no "Aceptar"
En EL YAQUE v1.0, los botones de `ion-alert` usan etiqueta **"OK"** en lugar de "Aceptar" (presente en DM-LOG-002 y globales según `[ferrenuestro-20260723]`). DM-LOG-002 fue corregido a PASS porque el alert SÍ aparece; el botón es un detalle de UX del build.

**Contexto:** Confirmado previamente en La Tortuga v6.6.18 (ferrenuestro). El patrón se extiende a EL YAQUE v1.0. **Recomendación:** Promover a `module-selectors/_comunes.md` como quirk transversal `[alipascua-20260804]`.

### Flujo de login exitoso (DM-LOG-001 → 012)
- Credenciales `***`/`***` (bloque `# Cliente: alipascua`) funcionan sin demoras
- Overlay `app-synchronization` aparece al enviar
- Sync completa en ~8.2 segundos (DM-LOG-012)
- App home renderiza con módulos visibles

## Patrones / selectores nuevos
- `[alipascua-20260804]` **Alert button text "OK" vs "Aceptar":** en EL YAQUE v1.0 los alertas de login/validación usan botón "OK", no "Aceptar". Considerar helper alternativo o ambos patrones. Precedente: `[ferrenuestro-20260723]`.
