# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | CDP `:9220` (WebView) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez (idEnterprise:1 "INVERSIONES JEREZ MOTORS", USD) |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit sin datos → alert "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario 001 + pass incorrecta (Test-LOG-003) → alert "Usuario y/o contraseña incorrectos."; sigue en /login |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario" `checked` false→true tras click |
| DM-LOG-001 | ✅ PASS | Usuario 001 + pass válida → navega a /synchronization, overlay sync inicia |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo |
| DM-LOG-012 | ✅ PASS | Llega a /home; `app-home` visible (15 elementos de módulo); `app-login` no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones (solo-lectura) | — |

## Verificación BD
`BD-N/A` — corrida omite cotejo BD; login es solo-lectura, no crea registros.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| jerez: login + sync estándar sin cambios | cliente | Selectores estándar (placeholder Usuario/Contraseña, `ion-button[type="submit"]` "Aceptar", `ion-checkbox`) funcionaron sin modificación en 1ª corrida jerez. HOME sin rótulo de empresa/usuario (consistente con gmp/don-theo). |

> ✅ consolidado 2026-07-06

## Hallazgos (solo si hay FAIL)
Ninguno.
