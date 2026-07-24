# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente | ferrenuestro (Isla Coche) — usuario `leidy` / `***` |
| App | `com.kiberno.denarioPremiumPro` (WsUrl activo: denariolatortuga.ddns.net:8081) |
| window.ng | TRUE |
| Resultado | 16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |
| Estado inicial → final | HOME → HOME ✅ |
| Sync | INMEDIATA (POST clientstock capturado; Ref servidor 101 Enviado en la misma corrida) |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO y BUSCAR (`/inventarios`) |
| DM-INV-002 | ✅ PASS | 4 tabs General/Inventario/Resumen/Adjuntos; `ion-input#clienteSelect` vacío |
| DM-INV-004 | ✅ PASS | Cliente TORNICAGUA, C.A. (121793873) seleccionado por `<p>`; las 4 tabs habilitan |
| DM-INV-008 | ✅ PASS | Tab Inventario → familias con conteo; HERRAMIENTAS ELECTRICAS = 17 productos; sub-segmentos UBICACIÓN (Exhibición/Depósito/Todos) + FILTRO (Inventariados) + input "Búsqueda de productos" |
| DM-INV-010 | ✅ PASS | Producto TALADRO INALAMBRICO (080178) abre `ion-modal.inventory-type-stocks-modal` (Pointer+Mouse); tipo fijo "Exhibición - 1" sin segmento; campos Cantidad(number)/Lote(text)/Fecha; icons close/checkmark/trash/add |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` Cantidad=5, Lote=QA0723; Fecha `ion-datetime#expDate0`=2026-07-23 (HOY, default); expirationBatch=TRUE confirmado |
| DM-INV-012 | ✅ PASS | checkmark-outline → modal cierra sin error; producto "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla Sel/Código/Producto/Exhibición/Depósito/Acción con "080178 TALADRO ... 5 UND" |
| DM-INV-017 | ✅ PASS | Botón PEDIDO SUGERIDO (`botonAddAmarillo`) presente pese a `suggestedOrderByDispatchAndReturn=false` (divergencia UI↔config, documentada); modal `inventario-sugerido-modal` "Sugerido UND: 5"; cerrado con `dismiss('cancel')` sin crear pedido |
| DM-INV-020 | ✅ PASS | "Días para siguiente Inventario: 1" (+ "Días desde último Inventario: 1") visible en el modal sugerido — hay historial |
| DM-INV-021 | ✅ PASS | Guardar (`.imagenGuardar`) → confirm "¿Desea guardar el Inventario?" → "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Enviar (`.imagenEnviar`) → "¿Desea enviar el Inventario?" → "El Inventario será enviado" → navega a home inventarios; **POST clientstockservice/clientstock CAPTURADO** |
| DM-INV-023 | ✅ PASS | BUSCAR → "Nro. Ref.: 101 · TORNICAGUA · Estatus: Enviado · 23/07/2026" |
| DM-INV-025 | ✅ PASS | `ion-searchbar` filtra realtime: "TORNICAGUA"→1, "ZZZZ"→0, vacío→1 |
| DM-INV-026 | ✅ PASS | Reapertura del Guardado (Ref 0): cliente carga, abre en tab **General** (defecto conocido DM-INV-026, no FAIL); round-trip OK — Resumen conserva "040164 LED BOMBILLO ... 3 UND" |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` en item Guardado → borra directo (sin confirm previa) "¡EL Inventario se borró con éxito!"; item desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 101 | Inventario TORNICAGUA, C.A. (504) — TALADRO INALAMBRICO 20V (080178) ×5 UND, lote QA0723, venc 23/07/2026, ubicación Exhibición | **Enviado** (POST clientstock capturado, sync inmediata) |
| 0 | Inventario TORNICAGUA, C.A. (504) — LED BOMBILLO NEVERA T26 (040164) ×3 UND, lote QA0723B — creado para DM-INV-026/028 | Guardado → **eliminado** (DM-INV-028) |

## Verificación BD (COTEJO BD CAÍDO → BD-N/A por captura de payload · RUNTIME §10)
`node query.js/local-query.js` no disponibles esta corrida (COTEJO BD CAÍDO). Cotejo por **captura de payload + UI** → marca **BD-N/A (payload)**.

- POST `clientstockservice/clientstock` **CAPTURADO** por hook `nativePromise` (5 reintentos idénticos, `coClientStock=1784857729163.0`). Volcado a `_payloads.jsonl`.
- Round-trip UI→payload **OK** 1:1: `coProduct=080178` (idProduct 196), `quStock=5`, `ubicacion="exh"`, `nuBatch="QA0723"`, `daExpiration=2026-07-23T04:00:00`, `idClient=504` / `coClient=121793873` (TORNICAGUA), `stDelivery=2` (enviado). Cabecera + `clientStockDetails[1]` + `clientStockDetailUnits[1]` (3 niveles) coherentes.
- `expirationBatch=true` confirmado a nivel de payload (nuBatch + daExpiration presentes en detail_unit).
- Correlación: **Nro.Ref UI 101 = `id_client_stock`** (nube), Estatus Enviado. `BD-INFO` (correlación) + `BD-N/A (payload)` para el cotejo servidor.
- Round-trip UI→UI (§9) del 2º inventario Guardado (DM-INV-026): captura LED BOMBILLO ×3 persistió al reabrir. **OK**.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `window.ng=TRUE` en ferrenuestro esta corrida | cliente (ferrenuestro) | ⚠ Contrasta con `[ferrenuestro-2026-07-07]` que reportó `window.ng=false` en build El Yaque. Esta corrida el WsUrl activo es **denariolatortuga.ddns.net** (La Tortuga v6.6.18, `window.ng=TRUE`), no Isla Coche — el device apunta a otro servidor. Anotar: el `window.ng` sigue el BUILD/servidor cargado, no el slug de cliente. |
| Sync clientstock INMEDIATA + POST capturado | cliente/build | En este build (La Tortuga) el hook `nativePromise` SÍ captura `clientstockservice/clientstock` y el Ref servidor (101) llega en la misma corrida — a diferencia de `[ferrenuestro-2026-07-07]` (Isla Coche, sync diferida ~3min, client_stock no interceptado). Coincide con `[dm-electronica-20260713]` (captura clientstock, sync inmediata). |
| `st_client_stock` Enviado → Nro.Ref 101 | cliente | Inventario enviado quedó Ref 101 = Enviado (vía UI BUSCAR; sin acceso BD para leer `st_client_stock` numérico esta corrida). |
| Picker cliente: filtrar `<p>` por `getBoundingClientRect().width>0` antes de click en 2º inventario | universal (confirma `[latino_cosmetica-20260714]`) | Reconfirmado: al reabrir el picker para el 2º inventario, filtrar por width>0 evita clicks al vacío. Funcionó con TORNICAGUA. |

> ✅ consolidado 20260723

## Hallazgos (FAIL)
Ninguno. 0 FAIL. Divergencias UI↔config (PEDIDO SUGERIDO con VG false; módulo Inventarios operable con `clientStock=false`) ya conocidas y documentadas — verificar con desarrollo, no re-marcar FAIL. Defecto conocido DM-INV-026 (reapertura en tab General) observado, no FAIL.

## Baseline (instrumentación)
- Tool-uses (aprox): ~40 (mayoría `browser_run_code_unsafe` vía CDP).
- Duración total (aprox): ~11 min de conducción CDP.
- Reconexión CDP: estable, sin cambios de PID mid-run.
