# Smoke Test — Módulo CLIENTES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | jerez |
| Resultado | 11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Click módulo Clientes → `app-clientes` con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Lista con 3 clientes de cartera (emp 1), saldos BS/USD visibles (`multiCurrency=true`). Cartera confirmada = YAML BASE |
| DM-CLT-003 | ✅ PASS | Búsqueda "JL Motors" (focus+type+click search @317,94) filtró 3→1 (JL Motors SE,C.A) |
| DM-CLT-009 | ✅ PASS | Detalle: Empresa "INV JEREZ MOTORS VALERA", Nombre "JL Motors SE,C.A (J-506554950)", Lista "Precio 1", RIF, Email, Teléfono, Saldo BS/USD 0,00, Crédito BS |
| DM-CLT-013 | 🚫 N/A | Tab Doc. de Venta activa y renderiza (`doc-ventas-tab` presente) pero SIN documentos — cartera alcanzable en módulo CLIENTES = emp 1 (3 clientes saldo 0,00, sin docs). Los clientes con docs viven en emp 2/3 (solo vía gateway de Cobros), no en esta lista. Tab funciona; N/A por dato |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` visible |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 ion-input vacíos + ion-select idEnterprise; Guardar/Enviar `disabled=true` (`app-client-new-potential-client`) |
| DM-CLT-021 | ✅ PASS | `fillIonInput` ×8 (naClient=`Test-CLT-SMOKE-181237`) + idEnterprise=1 (value **numérico**) → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Click Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; en BUSCAR CLIENTE POTENCIAL aparece con Nro.Ref 0, Estatus Guardado (con trash) |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado (click zona izq. ~30% del ion-item) → Enviar habilitado → 3 alertas (Aceptar → OK → "Cliente potencial nro. **1** creado exitosamente"). Estatus Guardado→**Enviado**, Ref 0→1, trash desaparece. ⚠ SIN cotejo BD: estatus UI "Enviado", NO se afirma persistencia en nube |
| DM-CLT-031 | ✅ PASS | Creado 2º potencial (`Test-CLT-DEL-181449`, Guardado Ref 0) → click trash (`ion-button[color="danger"]`) → alert "Denario Clientes / ¡Cliente Potencial se borro con exito!" (directo, sin confirmación previa) → registro desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 1 | Cliente potencial `Test-CLT-SMOKE-181237` (RIF V-12345678, tel 04141234567, emp 1 INV JEREZ MOTORS VALERA) | **Enviado** (UI) — permanece en lista. Sin cotejo BD → no se confirma nube |
| 0 | Cliente potencial `Test-CLT-DEL-181449` (RIF V-87654321, emp 1) | Guardado → **BORRADO** en DM-CLT-031 (no persiste) |

## Verificación BD
BD-N/A — corrida SIN lectura de BD por indicación del orquestador. El estatus UI "Enviado" (Ref 1) NO se coteja contra la nube; queda pendiente confirmar persistencia (nota histórica: en corridas previas el potencial quedaba "Por Enviar"/BD-SAVED sin llegar a nube; esta corrida mostró Ref real 1 y Estatus Enviado en UI, pero sin cotejo no se afirma).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Empresas idEnterprise con nombres REALES distintos | cliente (jerez) | Form potencial: val 1 "INV JEREZ MOTORS VALERA", val 2 "INV JEREZ MOTORS CARACAS", val 3 "INV JEREZ MOTORS TURMEREMO". Reemplaza textos previos "INVERSIONES JEREZ 1/2/3" `[jerez-2026-07-01]` y el genérico "INVERSIONES JEREZ MO…" `[jerez-2026-06-22]`. Actualizar `modules.clientes` del YAML |
| idEnterprise exige value **numérico** | cliente (jerez) | Confirmado de nuevo: `sel.value=1` (number) + `ionChange` valida; string `'1'` deja `ng-invalid`. Refuerza `[jerez-2026-07-06]` |
| Reabrir Guardado por zona izquierda del ion-item | universal | Click ~30% del ancho del `ion-item` reabre el form con campos precargados + Enviar habilitado. Funcionó sin inestabilidad. Confirma `[ins-2622][jerez-2026-07-06]` |
| Cartera CLIENTES = emp 1 (3 clientes) sin cambios | cliente (jerez) | DANIELA HERNANDEZ F.P. (V161051485), Inversiones J.L Moto Piezas C.A (J-50163353-3), JL Motors SE,C.A (J-506554950); todos Saldo BS/USD 0,00. La lista del módulo CLIENTES NO expone emp 2/3 (donde están los clientes con docs) → DM-CLT-013 N/A por dato |
| Detalle JL Motors: Empresa "INV JEREZ MOTORS VALERA" | cliente (jerez) | Antes rótulo "INVERSIONES JEREZ MOTORS"; el detalle del cliente ahora muestra el nombre corto de la empresa VALERA. Email astrid.marquina@kiberno.com, tel 0416-4663472, Lista "Precio 1", Crédito BS 127.940.000.000,00 |
| Alertas de envío potencial (títulos mixtos) | cliente (jerez) | 1ª "Denario Clientes / ¿Desea enviar nuevo Cliente Potencial?"; 2ª "Denario Premium / El cliente potencial será enviado"; 3ª "Denario Premium / Cliente potencial nro. 1 creado exitosamente". Guardado "Denario Cliente / ¡...Guardado con exito!"; borrado "Denario Clientes / ¡...se borro con exito!". Confirma patrón piercar/globalmp/don-theo |

> ✅ consolidado 2026-07-06

## Hallazgos (solo si hay FAIL)
Ninguno — 11 PASS · 1 N/A (por dato). Estado final: HOME.
