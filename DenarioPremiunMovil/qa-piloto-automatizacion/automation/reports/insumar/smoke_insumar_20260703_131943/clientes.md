# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260703_131943_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728) |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente / Playa | insumar (servidor: denariolatortuga.ddns.net:8081) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Lista `app-client-list` con 50 ítems; cada uno con Saldo BS y Saldo US$ (multiCurrency=true) |
| DM-CLT-003 | ✅ PASS | Búsqueda "ABASTOS" (focus input + type + click botón search) → filtró a 2 coincidencias |
| DM-CLT-009 | ✅ PASS | Detalle `app-client-detail`: Nombre ADRIAN ARLET BASTARDO ALONZO (2738), RIF V-223846498, Saldo BS 59.257,92 |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" → `.documents-table-panel--ready` con headers Tipo/Nº Doc/Moneda/Tasa/Saldo/Fecha; leyenda Vigente/Vencido/A favor |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` |
| DM-CLT-019 | ✅ PASS | Form CLIENTE POTENCIAL: 9 ion-inputs vacíos + idEnterprise; Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | Llenados 8 campos (marcador `Test-CLT-SMOKE-135048`) + idEnterprise=1 → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Click Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; aparece en BUSCAR con Nro.Ref:0, Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Reapertura ítem Guardado (click zona izq ~30%) → Enviar habilitado; 3 alertas → "Cliente potencial nro. **13** creado exitosamente"; Estatus pasó a **Enviado** (Nro.Ref:13, sin trash) |
| DM-CLT-031 | ✅ PASS | Trash en registro Guardado (`Test-CLT-DEL-135357`) → alert "Denario Clientes / ¡Cliente Potencial se borro con exito!"; desapareció de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **13** | Cliente potencial `Test-CLT-SMOKE-135048` · RIF J-407654321 · Tel 04241234567 · empresa INSUMAR DISTRIBUIDOR (coEnterprise INSUM_A, idEnterprise 1) | **Enviado** (id_client=13) |
| 0 | Cliente potencial `Test-CLT-DEL-135357` · RIF J-409999888 (creado para prueba de borrado DM-CLT-031) | **Borrado** (eliminado, ya no existe) |

## Verificación BD (round-trip · RUNTIME §10)
- **Nube (`potential_client`):** `BD-N/A` — el lector `query.js insumar` devolvió `ERR: remaining connection slots are reserved…` en 3 reintentos (pool Postgres saturado, condición del entorno, no defecto de app). Blindaje §10: la BD no tumba el smoke; cotejo queda pendiente para el Agente BD.
- **Local (`potential_clients` SQLite):** `BD-N/A` — `run-as: exec failed for sqlite3: No such file or directory` (binario sqlite3 no disponible en el dispositivo).
- **Evidencia UI/payload del envío (fuerte):** alert "Cliente potencial nro. 13 creado exitosamente" + Estatus **Enviado** en BUSCAR (Nro.Ref:13) + POST `potentialclientservice/potentialclient` capturado con todos los campos del formulario (volcado a `_payloads.jsonl`). **Correlación Ref UI = `id_client` = 13** (consistente con [prc-2606]/[ins-2622]).
- **Payloads volcados:** 1 línea en `_payloads.jsonl` (POST potentialclient). Los 5 `syncservice/getsync` capturados son polls de sync, no persistencia → no volcados.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| idEnterprise: value en **propiedad** del `ion-select-option`, atributo `value` = null | universal (clientes) | Para seleccionar la empresa por CDP: leer `opt.value` (property, no attr) y hacer `sel.value = opt.value` + `ionChange`. La ruta popover no expuso ítems (`ion-popover` vacío). Confirma nota [dth-2612][ins-2622] de auto-selección que no ocurre. |
| Reapertura ítem Guardado Ref:0 vía CDP **estable esta corrida** | cliente/universal | Click en zona izquierda (~30% ancho, y centro) del `ion-item` reabrió el form con Enviar habilitado sin inestabilidad. La caveat `reapertura_ref0_cdp_inestable` NO aplicó (navegó al 1er intento). |
| Títulos mixtos alertas envío: 1ª "Denario Clientes", 2ª/3ª "Denario Premium"; borrado "Denario Clientes" | cliente | Reproduce patrón piercar [prc-2606] y globalmp/don-theo en insumar → corroborado 2ª cuenta. |
| Servidor efectivo insumar = `denariolatortuga.ddns.net:8081` | cliente | El payload y sync apuntan a La Tortuga, NO a `denarioislacoche` del yaml. Revisar/actualizar `ws_url` en `insumar.yaml`. |

## Hallazgos (solo si hay FAIL)
Ninguno — 0 FAIL.
