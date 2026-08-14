# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260630_181903_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | `14678405BR003855` (Infinix X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa / Servidor | jerez — El Yaque (`denarioelyaque.ddns.net:8081`) |
| Cliente de prueba | DANIELA HERNANDEZ F.P. (V161051485, empresa 1) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | Formulario con 4 tabs (General/Inventario/Resumen/Adjuntos); Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "DANIELA HERNANDEZ F.P. (V161051485)" seleccionado → 4 tabs habilitadas (ninguna disabled). Sin alerta de sucursal |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias Accesorios MJ(179)/Carbones(136)/HJ-Forza(71)/Otras marcas(102)/Plasticos(1)/Repuestos Jerez(207)/Repuestos de Motos(4041)/XCORT(31) |
| DM-INV-010 | ✅ PASS | Click PLAN-001 (Pointer+Mouse combinado) → `inventory-type-stocks-modal` abre. Tipo fijo "Exhibición - 1" (sin segmento), campos Cantidad/Lote/Fecha venc |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: Cantidad=10, Lote=LOTE-QA01, Fecha venc=2026-07-01 (default HOY). Valores reflejados en el modal |
| DM-INV-012 | ✅ PASS | Aceptar (`checkmark-outline`) → modal cierra sin error; producto marcado "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla con PLAN-001, "10 PIEZA" en columna Exhibición |
| DM-INV-017 | 🚫 N/A | VG `suggestedOrderByDispatchAndReturn=false`. Obs: la sección "PEDIDO SUGERIDO" SÍ está visible por VG `suggestedOrder=true`; modal `inventario-sugerido-modal` inspeccionado y cerrado con `dismiss(null,'cancel')` (NO se creó pedido) |
| DM-INV-020 | ✅ PASS | Modal sugerido muestra "Días desde último Inventario: 1" y "Días para siguiente Inventario: 1" (hay historial: inventario previo del 22/06) |
| DM-INV-021 | ✅ PASS | Guardar (`.imagenGuardar`) → confirm (Cancelar/Aceptar) → alert "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Enviar (`.imagenEnviar`) → "¿Desea enviar el Inventario?" (Aceptar) → "El Inventario será enviado" (OK) → navega a home inventarios |
| DM-INV-023 | ✅ PASS | BUSCAR lista 7 ítems; el creado: "Nro. Ref.: 7 · V161051485 - DANIELA HERNANDEZ F.P. · Estatus: Enviado · Fecha: 01/07/2026" |
| DM-INV-025 | ✅ PASS | Searchbar "JL Motors" filtra realtime 7→2 ítems |
| DM-INV-026 | ✅ PASS | Reabrir Ref 7 (Enviado): form carga con cliente DANIELA + fecha correctos; 3 tabs (sin Inventario); Resumen conserva PLAN-001 "10 PIEZA" (round-trip §9 OK). Abre en tab General (consistente con Enviado) |
| DM-INV-028 | 🚫 N/A | No hay inventario en Estatus **Guardado**: el creado sincronizó a **Enviado**; la papelera `ion-button[color="danger"]` solo aparece en Guardado. Sin ítem borrable |

## Registros creados en sistema

| Ref | Cliente | Producto | Cant/Lote/Venc | Estado final UI | BD nube |
|-----|---------|----------|----------------|-----------------|---------|
| **7** | DANIELA HERNANDEZ F.P. (V161051485, emp 1) | PLAN-001 Agro silotubo flex-silon extra PB 8P*50C | 10 PIEZA / LOTE-QA01 / 2026-07-01 (Exhibición) | **Enviado · Ref real 7** (SÍ persistió y sincronizó) | `id_client_stock=7`, `st_client_stock=1`, det=1, units=1 |

> ⚠ Contraste con el patrón de esta corrida: en clientes y pedidos los envíos quedaron "Por Enviar"/Ref 0 y no persistieron. **El inventario SÍ sincronizó** (Ref real 7 = `id_client_stock`, Estatus Enviado en UI y fila completa en nube).

## Verificación BD (round-trip UI→servidor · RUNTIME §10)

**Nube (`client_stock` · El Yaque) — BD-OK:**
- Baseline pre-envío: `max(id_client_stock)=6`. Post-envío aparece fila nueva `id_client_stock=7`.
- Cabecera: `co_client_stock=1782913528083.0` (= `coClientStock` del payload), `st_client_stock=1` (Enviado en jerez, igual que piercar; otras playas usan 2), `id_client=3056` (DANIELA), `da_created=2026-07-01`.
- Detalle: `det=1` (1 producto PLAN-001), `units=1` (1 captura).
- Unidad (`client_stock_detail_unit`): `nu_batch=LOTE-QA01`, `da_expiration=2026-07-01`, `qu_stock=10.0000`, `co_product_unit=PZA-PLAN-001` → **todos los campos coinciden 1:1 con lo cargado por UI** (BD-FIELD-OK).
- **Correlación confirmada:** Nro.Ref UI **7** = `id_client_stock` **7** (BD-INFO).
- **Conclusión guardado→enviado:** ✅ lo que se guardó se envió y llegó completo a la nube.

**Local (`client_stocks` / `pending_transactions`) — BD-N/A:**
- `local-query.js` falla: `run-as: exec failed for sqlite3: No such file or directory` — el binario `sqlite3` no está disponible vía `run-as` en este dispositivo (Infinix X6728). Blindaje §10: BD local N/A, no tumba el smoke. La verificación nube ya confirma el envío.

## Captura de payload (hook CapacitorHttp)

- El hook (`nativePromise`) **SÍ capturó** el payload de `clientstockservice/clientstock` — **a diferencia** del comportamiento temido (como `orderservice/order`). Se capturaron **3 POSTs idénticos** (reintentos de `AutoSendService`, mismo `coClientStock=1782913528083.0`) + 15 `syncservice/getsync`.
- Volcados a `_payloads.jsonl`: **3 líneas** de `clientstockservice/clientstock` (append, no sobrescrito).
- El payload confirma la estructura de 3 niveles: `clientStock` (cabecera) → `clientStockDetails[]` → `clientStockDetailUnits[]` con `quStock:10`, `nuBatch:"LOTE-QA01"`, `daExpiration:"2026-07-01T04:00:00"`, `ubicacion:"exh"`, `stDelivery:2`.

### Verificación BD (payload ↔ nube) — Agente BD (definitivo · cotejo campo-por-campo)

> `cotejo-payload.js` corrió el **flujo completo real** (cabecera + 2 niveles de hijas anidadas), NO fallback. Agente BD lanzado en background, completó y devolvió esta sección; anexada por el orquestador. **Primer cotejo campo-por-campo real de la corrida → motor validado end-to-end.**

| id_client_stock | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| 7 (co `1782913528083.0`) | **BD-FIELD-OK** | 15/15 OK | detail 1/1 · unit 1/1 (todas OK) | 0 | 2 notas de zona horaria (no rompen) |

- **Conteo por marca:** BD-FIELD-OK = 1 · BD-FIELD-MISMATCH = 0 · BD-SAVED = 0 · BD-N/A = 0.
- **Campos cotejados: 31/31, 0 mismatches** — cabecera `client_stock` (15), hija `client_stock_detail` (6), nieta `client_stock_detail_unit` (10).
- Verificaciones puntuales: id_client_stock=7 ✅ · qu_stock=10 ✅ · nu_batch=LOTE-QA01 ✅ · da_expiration=2026-07-01 ✅ · detalle 1/1 y unit 1/1 cuadran.
- `stClientStock=0` en payload = estado pre-envío (recalc de servidor, fuera de los 15 campos); fila presente y sincronizada en nube (st=1), coherente con Enviado.
- **Notas de calibración (solo zona horaria, NO mismatch):** `da_client_stock` payload `09:45:28` vs nube `13:45:28Z` (offset UTC-4, veredicto por día = OK); `da_expiration` mismo día. **Sin campos payload-only ni renames** → config `inventarios` no requiere ajuste; **validado en vivo**.
- **Veredicto:** BD-FIELD-OK campo por campo. El motor ejecutó el flujo end-to-end completo con hijas anidadas de 2 niveles. ✅

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Hook `installPayloadCapture` SÍ captura `clientstockservice/clientstock` | universal | El envío de inventario pasa por `CapacitorHttp.post` vía `nativePromise` → el hook lo intercepta. Confirma que inventario (a diferencia de pedidos/order) es capturable por el hook. `[jerez-20260630]` |
| jerez: `inventory-type-stocks-modal` tipo fijo "Exhibición - 1" sin segmento | cliente | Igual a don-theo/piercar, distinto a insumar (que tiene segmento Exhibición/Depósito/Todos). Header icons: close-outline/checkmark-outline/trash-outline/add-outline. Inputs: Cantidad `placeholder="Ingrese cantidad"` (number), Lote `placeholder="Ingrese lote"` (text), Fecha = `ion-datetime` hidden `input[name^="ion-dt"]` default HOY. `[jerez-20260630]` |
| jerez: `expirationBatch=true` confirmado en UI | cliente | Modal muestra Cantidad+Lote+Fecha venc (coincide con CSV dev). `[jerez-20260630]` |
| jerez: `st_client_stock=1` = Enviado | cliente | Confirma el patrón de piercar (st=1, no st=2). `[jerez-20260630]` |
| jerez: inventario Enviado SÍ sincroniza (Ref real, no queda "Por Enviar") | cliente | Contrasta con clientes/pedidos de esta misma corrida que quedaron Por Enviar/Ref 0. `[jerez-20260630]` |
| Local `sqlite3` ausente en Infinix X6728 (jerez) | cliente | `local-query.js` → `run-as: exec failed for sqlite3`. Verificación BD local N/A para este dispositivo; usar solo cotejo de nube. `[jerez-20260630]` |
| `.alert-message` para leer texto de alert (textContent del `ion-alert` completo devuelve vacío en este build) | universal (candidato) | En este WebView `alert.textContent` retornó "" — leer `.alert-message`/`.alert-title` da el texto real. `[jerez-20260630]` |

## Hallazgos (FAIL)

Ninguno. 0 FAIL.

## Notas

- DM-INV-017 y DM-INV-028 quedaron N/A por condición estructural (VG inactiva / ausencia de ítem Guardado), no por defecto de app.
- La sección "PEDIDO SUGERIDO" (VG `suggestedOrder=true`) se inspeccionó sin crear pedido (dismiss cancel) — quedó en `/inventarios`, sin navegar a `/pedido`.
- Estado final: **HOME** (`/home`, `app-home`).
