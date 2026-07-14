# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | CLIENTES |
| Cliente | jerez (INVERSIONES JEREZ) |
| App | `com.kiberno.denarioPremiumPro` |
| Estado inicial / final | HOME / HOME ✅ |
| Cotejo BD | OMITIDO en esta corrida (por prompt) |
| Resultado | 11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Lista con 3 clientes reales (cartera emp1) — todos con Saldo BS y USD (multiCurrency); coincide con datos de prueba |
| DM-CLT-003 | ✅ PASS | Búsqueda "JL Motors" filtró 3→1 → solo "JL Motors SE,C.A" |
| DM-CLT-009 | ✅ PASS | Detalle: Nombre "JL Motors SE,C.A", RIF/Código J-506554950, Saldo BS 0,00 / USD 0,00, Empresa INVERSIONES JEREZ 1 |
| DM-CLT-013 | 🚫 N/A | Tab Doc. de Venta renderiza (panel presente) pero 0 documentos — ningún cliente emp1 tiene docs de venta (ausencia de datos, RUNTIME §4) |
| DM-CLT-016 | ✅ PASS | clickBack desde listado → home clientes con 3 botones (no salta a HOME principal) |
| DM-CLT-017 | ✅ PASS | clickBack desde detalle → `app-client-list` visible (no salta a HOME) |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 ion-input + idEnterprise select; Guardar y Enviar `disabled=true` sin datos |
| DM-CLT-021 | ✅ PASS | Llenados 8 campos + idEnterprise → Guardar/Enviar `disabled=false`. ⚠ idEnterprise requiere value **numérico** (2 intentos) |
| DM-CLT-024 | ✅ PASS | Alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; registro A en BUSCAR con Nro.Ref: 0, Estatus Guardado (con trash) |
| DM-CLT-026 | ✅ PASS | Reabierto A (click zona izq del item) → Enviar → 3 alertas → "nro. 6 creado exitosamente"; registro pasa a Nro.Ref: 6, Estatus **Enviado** (sin trash) |
| DM-CLT-031 | ✅ PASS | Creado registro B (Guardado), trash directo → "¡Cliente Potencial se borro con exito!" → B desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 6 | Cliente potencial `Test-CLT-SMOKE-101828` (RIF V-98765432, emp INVERSIONES JEREZ 1) | **Enviado** (Nro.Ref: 6 asignado en UI) |
| 0 | Cliente potencial `Test-CLT-DEL-102146` (RIF V-11223344) — creado Guardado para DM-CLT-031 | **Borrado** (eliminado en el mismo caso) |

> Nota H1 (no-persistencia): esta corrida OMITE cotejo BD. La UI asignó correlativo real (nro. 6) y mostró Estatus Enviado tras el envío. La persistencia en nube (endpoint potentialclient) no se verificó — queda en cola de salida El Yaque según el pendiente conocido.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| idEnterprise ion-select requiere value **numérico** (`sel.value = 1`, no `'1'`) para validar y habilitar Guardar/Enviar | universal (probable) — confirmado jerez | Las `ion-select-option` de idEnterprise tienen `value` numérico (1/2/3). Asignar string `'1'` deja el control `ng-invalid`/`selVal=undefined` y los botones disabled. Con `sel.value=1` (number) + `ionChange{value:1}` → `ng-valid`, botones habilitados. Refina la nota `[dth-2612][ins-2622]` (auto-selección) — aquí sí selecciona pero exige el tipo correcto. |
| Reapertura de potencial Guardado para Enviar: click zona izquierda (~30% ancho) del `ion-item` en BUSCAR | universal | Confirmado en jerez (coincide con `[ins-2622]`): reabre el form precargado con Enviar habilitado; navegó estable. |
| jerez emp1: 3 opciones de empresa "INVERSIONES JEREZ 1/2/3" (val 1/2/3), sin preselección | cliente | Guardar exige seleccionar empresa explícitamente. |

> ✅ consolidado 2026-07-06

## Hallazgos (solo si hay FAIL)
Ninguno. Sin FAIL en el módulo.
