# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | insumar |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Enviar con campos vacíos → alert "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario `***` + password `***` incorrecta → alert "Usuario y/o contraseña incorrectos."; sigue en `/login`, sin sync |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario" toggle `false`→`true` al click |
| DM-LOG-001 | ✅ PASS | Usuario `***` + password `***` válidos → arranca overlay de sync |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo ("Sincronizando - Dirección de Clientes") |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` → `app-home` visible en `/home` con 9 módulos; `app-login` no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | — |

## Notas
- Post-login aparece prompt "¿Desea Sincronizar?" (Cancelar/Aceptar) — comportamiento normal de Home, no afecta el caso.
- Selectores de module-selectors.md sección LOGIN confirmados sin cambios: inputs por `[placeholder="Usuario"]`/`[placeholder="Contraseña"]` (sin atributo `name`), submit `ion-button[type="submit"]` texto "Aceptar", `ion-checkbox` recordar.
- Nota operativa: el sandbox de Playwright MCP **no expone `require`/`fs`** — los helpers (`connectCdp`, `fillIonInput`, `clickAlertButton`, `waitSyncOverlay`) se inlinearon verbatim y `badPass` se pasó como literal leído del .env por el agente.
