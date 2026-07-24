# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | (CDP :9220, no ADB_SERIAL leído en esta sesión) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | Isla Coche (ferrenuestro) |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit vacío → alert "Usuario y/o password no pueden ser vacios" (1er intento) |
| DM-LOG-003 | ✅ PASS | user=leidy + bad pass → alert "Usuario y/o contraseña incorrectos." — 2º intento (1er click con `mouse.click` simple no disparó submit tras `fillIonInput`; funcionó con `mouse.move+down+up`) |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario" `checked` false→true — 2º intento; causa raíz real: alert previo NO se había cerrado (su botón dice **"OK"**, no "Aceptar") y su overlay (`ion-alert` sin `overlay-hidden`) interceptaba los clicks en las coords del checkbox (`elementFromPoint` devolvía `.alert-button-group`). Al cerrar con el texto correcto ("OK"), el 1er click sobre el checkbox ya funcionó |
| DM-LOG-001 | ✅ PASS | user=leidy + pass correcta → overlay `app-synchronization` visible (offsetParent≠null), URL `/synchronization` |
| DM-LOG-011 | ✅ PASS | `app-synchronization` con `ion-progress-bar` presente en el mismo overlay (verificado en la misma corrida que 001) |
| DM-LOG-012 | ✅ PASS | Tras poll (~20s), `app-home` visible en `/home` con los 9 módulos: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes |

## Registros creados en sistema
ninguno

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón "OK" en vez de "Aceptar" en `ion-alert` de login (ferrenuestro / Isla Coche) | cliente (a confirmar si es de build o de playa) | `module-selectors/login.md` documenta `alertButtonCoords('Aceptar')`/`.alert-message` con textos previos en "Aceptar"; en esta corrida el único botón del alert de credenciales incorrectas fue **"OK"**. `alertButtonCoords('Aceptar')` devolvió `null` — hubo que usar `alertButtonCoords('OK')`. Recomendar: al cerrar un alert de login, probar ambos textos ("Aceptar" y "OK") o leer el texto real del botón antes de calcular coords. |
| Alert residual bloqueando clicks por overlay (no por `overlay-hidden`) | universal (ya documentado en RUNTIME S5, reconfirmado) | Un `ion-alert` activo (`offsetParent!==null`, sin `overlay-hidden`) intercepta clicks en CUALQUIER coordenada de la pantalla (`elementFromPoint` devuelve `.alert-button-group`), no solo donde está visualmente el diálogo. Si un click a un control fuera del alert no responde tras 1 intento, diagnosticar primero con `elementFromPoint` antes de reintentar el mismo gesto — la causa suele ser un alert no cerrado, no el selector del control. |
| Submit de login puede requerir `mouse.move+down+wait+up` en vez de `mouse.click` simple tras `fillIonInput` (ferrenuestro) | cliente (a confirmar) | El 1er intento de DM-LOG-003 usó `pg.mouse.click(x,y)` (mismo patrón que DM-LOG-002, que sí funcionó en formulario vacío) y no disparó el submit tras llenar campos vía `fillIonInput`. El 2º intento con `mouse.move → mouse.down → wait 80ms → mouse.up` sí lo disparó. Podría ser timing/layout-shift tras `fillIonInput`, no necesariamente el gesto en sí — recomendar recalcular coords justo antes del click y, si falla, probar el gesto compuesto antes de declarar BLOCKED. |

> ✅ consolidado 20260723

## Hallazgos (solo si hay FAIL)
Sin FAIL. Hallazgo de infraestructura (no bloquea, informativo): el prompt de esta corrida advertía `window.ng = FALSE` para el build Isla Coche de ferrenuestro (basado en corrida `[ferrenuestro-2026-07-07]`), pero en esta sesión `!!window.ng` devolvió **`true`**. Coincide con el patrón ya visto en `dm-electronica`/`latino_cosmetica` (El Yaque/La Tortuga v6.6.18 con `window.ng=TRUE`) — sugiere que el build de ferrenuestro pudo actualizarse entre el 2026-07-07 y esta corrida, o que `window.ng` no es estable ni siquiera dentro del mismo cliente/playa entre despliegues. No afectó la conducción de LOGIN (se condujo 100% por clicks reales, sin depender de `window.ng`). Recomendar re-verificar `!!window.ng` al inicio de cada módulo de esta corrida antes de asumir el fallback deshabilitado.
