# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | Android real vía CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | Isla Coche (`http://denarioislacoche.ddns.net:8081`) |
| Cliente | ferrenuestro (usuario `leidy`) |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert "Usuario y/o password no pueden ser vacios" visible |
| DM-LOG-003 | ✅ PASS | Usuario válido + password incorrecta (`***`) → alert "Usuario y/o contraseña incorrectos."; no permite login |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario": `checked` false → true tras click |
| DM-LOG-001 | ✅ PASS | Usuario `leidy` + password (`***`) → submit inicia overlay `app-synchronization` |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo (fase "Sincronizando - ...") |
| DM-LOG-012 | ✅ PASS | `app-home` visible en `/home` con 16 módulos; `app-login` no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ninguno | — | Todos los selectores estándar funcionaron sin cambios en ferrenuestro: Usuario/Contraseña por `placeholder` (sin `name`), submit `ion-button[type="submit"]` con `pg.mouse.click` simple, checkbox `.checked` por mouse.click en centro del bounding rect, overlay `app-synchronization`+`ion-progress-bar`. Mismo backend Isla Coche que insumar/globalmp/don-theo. |

> ✅ consolidado 2026-07-07 (sin patrones nuevos que promover)

## Hallazgos (solo si hay FAIL)
Sin FAIL.

## Verificación BD
`BD-N/A` — módulo login sin transacciones (RUNTIME §10).

## Nota de estado final
App queda logueada en **HOME** (`/home`), lista para el siguiente agente.
