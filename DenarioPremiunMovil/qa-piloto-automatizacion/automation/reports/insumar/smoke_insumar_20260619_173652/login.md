# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert "Usuario y/o password no pueden ser vacios" (title "Denario Premium") |
| DM-LOG-003 | ✅ PASS | Usuario `003` + contraseña incorrecta (`***`) → alert "Usuario y/o contraseña incorrectos."; permanece en `app-login`, sin sync |
| DM-LOG-004 | ✅ PASS | Checkbox `recuerdame` togglea a `checked=true` (vía `input.click()` interno; ver Patrones) |
| DM-LOG-001 | ✅ PASS | Usuario `003` + contraseña válida (`***`) → submit dispara overlay de sincronización |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo; label "Sincronizando - ... Por favor espere..." |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` → `app-home` visible (login no visible) con 9 módulos: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes (+ Sincronizar, Salir) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | ninguno |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Checkbox `recuerdame`: toggle por `c.querySelector('input').click()` | universal (insumar confirma patrón antes solo visto en central_foods) | En insumar el `mouse.click` por coords del bounding rect NO toggleó. El click sobre el `input` interno sí reflejó `.checked=true` y `aria-checked`. Coincide con la nota `[cf-2612]` de module-selectors → graduar a patrón universal para LOGIN. |
| Alert residual tapa el checkbox tras DM-LOG-003 | universal | El alert "Usuario y/o contraseña incorrectos." debe cerrarse explícitamente (`clickAlertButton('Aceptar')`) antes de DM-LOG-004; si queda abierto, intercepta el click de coords sobre el checkbox y da falso FAIL. Recomendado limpiar alerts en bucle antes de cada caso UI. |
| Submit reforzado: `shadowRoot.querySelector('button').click()` + `mouse.move`+`mouse.click` | universal | Patrón `[cf-2612]` aplicado preventivamente en insumar; el submit disparó correctamente en los 3 usos (vacío, badPass, login válido). |
| Label overlay sync: `app-synchronization` textContent "Sincronizando - {etapa}Por favor espere..." | universal | Útil como señal de progreso para DM-LOG-011 sin depender solo de `ion-progress-bar`. |

> ✅ consolidado 2026-06-19

## Hallazgos (solo si hay FAIL)

Sin FAIL. Todos los casos del módulo LOGIN pasaron. Estado final: HOME.
