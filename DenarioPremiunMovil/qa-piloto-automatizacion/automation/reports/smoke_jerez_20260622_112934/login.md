# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Cliente | jerez (`QA_USER=***`) |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert "Usuario y/o password no pueden ser vacios" (título "Denario Premium"), sigue en `/login` |
| DM-LOG-003 | ✅ PASS | Usuario `***` + pass incorrecta → alert "Usuario y/o contraseña incorrectos.", no permite login, sigue en `/login` |
| DM-LOG-004 | ✅ PASS | Checkbox `recuerdame` pasa de `checked=false`/`aria-checked=false` a `checked=true`/`aria-checked=true` |
| DM-LOG-001 | ✅ PASS | Usuario `***` + pass `***` → overlay `app-synchronization` aparece (inicia sync) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo ("Sincronizando - Código de Número Telefónico... Por favor espere...") |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` → `app-home` visible en `/home` con 9 módulos; `app-login` no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | ninguno |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón de alerts de login = **"OK"** (no "Aceptar") | cliente jerez | El alert de validación de login en jerez usa botón "OK". `clickAlertButton('Aceptar')` falla; usar `clickAlertButton('OK')`. Confirmado en DM-LOG-002 y DM-LOG-003. |
| Toggle checkbox `recuerdame` via `cb.querySelector('input').click()` | universal (reconfirma cf-2612/ins-2619) | jerez reconfirma: el click sobre el `input` interno togglea `.checked`/`aria-checked`; selector estable `ion-checkbox[formcontrolname="recuerdame"]`. |
| Submit reforzado `shadowRoot.querySelector('button').click()` + `mouse.move`+`mouse.click` | universal (reconfirma cf-2612) | jerez: el submit disparó correctamente en los 3 usos (vacío, badPass, login válido). |
| HOME sin nombre de cliente en encabezado | cliente jerez (alineado con gmp/cf) | HOME no muestra `ion-title`/header con nombre de empresa; no hay selector de empresa post-login. Único texto de header: "Copyright © 2025 ... POWERED BY KIBERNO". |

> ✅ consolidado 2026-06-22

## Notas de cliente descubiertas
- **Nombre de cliente "JEREZ" en encabezado (TBD):** **no se muestra**. HOME (`app-home`) no expone rótulo de empresa/cliente ni selector de empresa post-login (mismo comportamiento que globalmp `[gmp-2606]` y central_foods `[cf-2612]`).
- **HOME muestra 9 módulos:** Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes (+ Sincronizar).
- Login limpio: el login válido NO disparó alert de GPS/permisos.
- Inputs sin atributo `name` (Usuario/Contraseña) — identificados por `placeholder`, como en gmp/ins/cf.
