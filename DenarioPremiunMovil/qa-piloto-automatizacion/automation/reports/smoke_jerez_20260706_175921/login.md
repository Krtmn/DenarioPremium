# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | jerez |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Enviar con campos vacíos → alert "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario 001 + pass incorrecta → alert "Usuario y/o contraseña incorrectos."; permanece en app-login |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario" toggle checked false→true |
| DM-LOG-001 | ✅ PASS | Usuario 001 + pass correcta (***) → overlay sync aparece (url `/synchronization`) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo |
| DM-LOG-012 | ✅ PASS | `app-home` visible, url `/home`, módulos renderizados (15 nodos) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | — |

## Verificación BD
BD-N/A — corrida sin lectura de BD (login es solo-lectura).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `app-login ion-input[placeholder="Usuario"]` / `[placeholder="Contraseña"]` | universal | Confirmados en jerez (nuevo set de datos); sin atributo `name`, igual que gmp/ins/dth |
| `ion-button[type="submit"]` texto "Aceptar" | universal | Confirmado en jerez: `pg.mouse.click` sobre centro del bounding rect basta (sin Pointer+Mouse combinado) |
| `app-login ion-checkbox` | universal | Confirmado en jerez: `.checked` refleja el toggle vía mouse.click |

*Sin selectores nuevos ni obsoletos bajo el nuevo set de datos — todos los estándar de `module-selectors/login.md` funcionaron sin cambios.*

> ✅ consolidado 2026-07-06

## Hallazgos (solo si hay FAIL)
Ninguno — 6/6 PASS.
