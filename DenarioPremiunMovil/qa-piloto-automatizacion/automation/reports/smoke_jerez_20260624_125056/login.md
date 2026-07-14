# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260624_125056_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | CDP `127.0.0.1:9220` (WebView) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | jerez (INVERSIONES JEREZ MOTORS — multi-empresa idEnterprise 1/2/3) |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert "Denario Premium" / "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario `001` + password incorrecta (badPass) → alert "Usuario y/o contraseña incorrectos."; permanece en /login |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario" (`ion-checkbox[formcontrolname="recuerdame"]`) pasa de aria-checked false→true |
| DM-LOG-001 | ✅ PASS | Usuario `001` + password válida → submit dispara sincronización (sin alert, sale de /login) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar`; texto "Sincronizando - Etiquetas... Por favor espere..." |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` → `app-home` visible (url /home), `app-login` no visible, 9 módulos: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | ninguno |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Inputs login con `formcontrolname` | universal | Usuario = `ion-input[formcontrolname="login"]`, Contraseña = `ion-input[formcontrolname="password"]`. Más estable que índice/placeholder. (En module-selectors solo figuraban placeholder/idx; los `formcontrolname` son `login`/`password`, no `username`/`password`.) jerez confirma `[jerez-2624]` |
| Checkbox recordar toggle | universal | `cb.querySelector('input').click()` togglea aria-checked en jerez (mismo patrón que central_foods). El click por coords no fue necesario. `[jerez-2624]` |
| Submit reforzado | universal | `mouse.move` + `shadowRoot.querySelector('button').click()` + `mouse.click` funciona de forma fiable en jerez (mismo patrón que central_foods). `[jerez-2624]` |
| HOME sin rótulo de empresa | cliente | jerez es multi-empresa (3 idEnterprise) pero HOME no muestra `ion-title` con empresa ni selector de empresa post-login (coincide con globalmp/central_foods). `[jerez-2624]` |

## Hallazgos (solo si hay FAIL)
Sin hallazgos — los 6 casos pasaron.
