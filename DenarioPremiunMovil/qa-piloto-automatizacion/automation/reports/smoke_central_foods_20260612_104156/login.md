# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | CDP `http://127.0.0.1:9220` (webview Android) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | central_foods (El Yaque) |
| Cliente / Usuario | central_foods · usuario `001` |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert "Denario Premium" / "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario `001` + password incorrecta → alert "Usuario y/o contraseña incorrectos."; NO inicia sync ni navega |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar Usuario" togglea `false→true` (`checked` y `aria-checked` acompañan). ⚠ requirió `input.click()` interno — `mouse.click` por coords NO togglea en esta build (ver Patrones) |
| DM-LOG-001 | ✅ PASS | Usuario `001` + password correcta → overlay `app-synchronization` aparece |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo; texto "Sincronizando - Código de Número Telefónico... Por favor espere..." |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` → `app-home` visible (`/home`) con 9 módulos; `app-login` no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Submit login no engancha con `mouse.click` solo | cliente (central_foods, build 6.6.14 El Yaque) | El primer intento de login con `pg.mouse.click()` en el centro del `ion-button[type="submit"]` NO disparó el submit (quedó en `/login` con campos llenos, sin sync ni alert). Funcionó al combinar `mouse.move` + `shadowRoot.querySelector('button').click()` + `mouse.click`. Mismo patrón que COBROS insumar para Guardar/Enviar (header fijo). Aplicar técnica reforzada al submit de LOGIN en El Yaque |
| Checkbox "Recordar usuario" no togglea por coords | cliente (central_foods) | `ion-checkbox[formcontrolname="recuerdame"]` (20×20px, `style="float:right"`, `checkbox-label-placement-start`). `mouse.click` en el centro del bounding rect NO cambia `.checked`; `cb.querySelector('input').click()` SÍ lo togglea y refleja en `.checked`/`aria-checked`. Difiere de globalmp/insumar donde el mouse.click bastaba (`[gmp-2606][ins-2610]`) |
| `formcontrolname="recuerdame"` en el checkbox recordar | universal (candidato) | Selector estable adicional al `ion-checkbox` genérico para el checkbox de recordar usuario |
| Inputs login sin `name`, identificables por placeholder | universal (confirma existente) | `ion-input[placeholder="Usuario"]` / `ion-input[placeholder="Contraseña"]` válidos en central_foods — reconfirma anti-patrón "no asumir name" `[gmp-2606][ins-2610]` |

> ✅ consolidado 2026-06-12

## Notas de servidor / cuenta (1ª corrida central_foods)
- Servidor El Yaque, app v6.6.14, package `com.kiberno.denarioPremiumPro`.
- Login con usuario `001` / password estándar exitoso. HOME muestra 9 módulos: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes (+ Sincronizar, Salir).
- HOME sin `ion-title` con nombre de empresa/usuario (igual que globalmp).
- Texto de sync inicial observado: "Sincronizando - Código de Número Telefónico".
- `userMustActivateGPS=true` esperado, pero el login NO disparó alert de GPS/ubicación en esta corrida (permisos ya concedidos).
- Footer: "Copyright © 2025. All rights reserved. POWERED BY KIBERNO".

## Hallazgos (solo si hay FAIL)
ninguno.
