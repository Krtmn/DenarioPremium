# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | Infinix X6728 (Android 15) · CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (Isla La Tortuga) |
| Cliente | hidroponias — HIDROPONIAS VENEZOLA |
| Cliente test | AUTOMERCADOS PLAZA S C.A. (401) — sucursal TERRAZAS DEL AVILA |
| VGs | expirationBatch=true · suggestedOrderByDispatchAndReturn=true |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs (General habilitada; Inventario/Resumen/Adjuntos disabled); Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "AUTOMERCADOS PLAZA S C.A. (401)" → las 4 tabs se habilitan |
| DM-INV-008 | ✅ PASS | Tab Inventario lista familias con conteo (AJO, BERRO, GERMINADOS 5, HIDROPONICO 7…); productos con captura |
| DM-INV-010 | ✅ PASS | Click producto (Pointer+Mouse combinado) abre `inventory-type-stocks-modal`; sin popover residual |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: Cantidad=5, Lote=LOTEQA10, Fecha=10-jul-2026 (default `expDate0`) reflejados |
| DM-INV-012 | ✅ PASS | Aceptar (checkmark) → producto "Inventariado: Exhibición"; sin error de validación |
| DM-INV-016 | ✅ PASS | Tab Resumen: GERPROALF001BOL ALFALFA BOLSA DE 500 GRS. → 5 UNIDAD |
| DM-INV-017 | ✅ PASS | Botón Pedido Sugerido (`botonAddAmarillo`) → modal `inventario-sugerido-modal` "Sugerido UNIDAD: 0", moneda BS/USD |
| DM-INV-020 | ✅ PASS | Modal sugerido muestra "Días para siguiente Inventario: 1" y "Días desde último Inventario: 1" |
| DM-INV-021 | ✅ PASS | Guardar → confirm "¿Desea guardar el Inventario?" → "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Enviar → 2 alertas ("¿Desea enviar el Inventario?" → "El Inventario será enviado"); navega a home; POST `clientstockservice/clientstock` capturado (stDelivery=2) |
| DM-INV-023 | ✅ PASS | BUSCAR lista 20 items con Nro.Ref, cliente, estatus, fecha; top = Ref 43 (recién enviado) |
| DM-INV-025 | ✅ PASS | Searchbar "AUTOMERCADOS" filtra realtime → 2 items; limpiar → 20 |
| DM-INV-026 | ✅ PASS | Inventario Guardado (Ref 0) reabre con cliente 401 cargado — **defecto conocido v6.6.14 confirmado: abre en tab General en vez de Inventario** (observación, no FAIL) |
| DM-INV-028 | ✅ PASS | Basura (`ion-button[color="danger"]`) en Guardado → borrado directo sin confirmación previa "¡EL Inventario se borro con exito!"; item desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 43 | ALFALFA BOLSA DE 500 GRS (GERPROALF001BOL) · 5 UNIDAD · lote LOTEQA10 · venc 2026-07-10 · cliente 401 | **Enviado** → nube `client_stock` id=43 (BD-OK) |
| 0 | ALFALFA CAJA DE 125 GRS (GERPROALF001CAJ) · 3 UNIDAD · lote LOTEQA20 · cliente 401 | Guardado (DM-021/026) → **BORRADO** en DM-INV-028 (no persiste) |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal cliente inventarios: filtrar con lupa `ion-icon[name="search-circle-sharp"]` | universal (confirma ferrenuestro) | El `input[placeholder="Clientes..."]` no filtra on-keyup; escribir + click lupa (325,95) dispara la búsqueda. Confirmado en hidroponias (Isla La Tortuga) |
| hidroponias: `inventory-type-stocks-modal` tipo fijo "Exhibición" SIN segmento, inputs por placeholder "Ingrese cantidad"(number)/"Ingrese lote"(text), Fecha `ion-datetime id=expDate0` default HOY | cliente (hidroponias) | Igual a jerez; header icons close/checkmark/trash/add. `expirationBatch=TRUE` confirmado en UI |
| hidroponias: searchbar BUSCAR filtra por cliente/nombre/ref realtime | cliente (hidroponias) | "AUTOMERCADOS" → 2 items; limpiar → 20 |
| Captura de payload `clientstockservice/clientstock` SÍ interceptada (nativePromise/CapacitorHttp) en Isla La Tortuga | universal | Contradice `reference_qa_payload_capture_gap`; POST completo con cabecera+detalle+unidad (lote/venc/cantidad). Útil como cotejo BD |
| BD hidroponias: `client_stock_detail_unit` NO tiene columna `co_unit` | cliente/esquema | Query de unidad debe omitir `u.co_unit`; usar `nu_batch`, `da_expiration`, `qu_stock` |
| hidroponias: `st_client_stock=1` = Enviado en nube | cliente (hidroponias) | Igual a piercar (st=1), distinto a insumar/globalmp (st=2) |

> ✅ consolidado 20260710

## Verificación BD (RUNTIME §10)
Baseline nube al inicio: `max(id_client_stock)=42`, `count=40`.

**Inventario Enviado (Ref 43) — BD-OK:**
- Nube `client_stock`: id_client_stock=**43**, co_client_stock=1783694924647.0 (=coTransaction del payload), st_client_stock=**1 (Enviado)**, co_client=401, det=1, units=1.
- Detalle unidad (cotejo campo-a-campo vs UI/payload):
  - co_product=**GERPROALF001BOL** ✓ · nu_batch=**LOTEQA10** ✓ · da_expiration=**2026-07-10** ✓ · qu_stock=**5** ✓
- Correlación **Nro.Ref UI 43 = id_client_stock 43** (BD-INFO, consistente con §10).
- Conclusión guardado→enviado: **lo guardado se envió** (BD-OK). Payload en `_payloads.jsonl`.

**Inventario Guardado (Ref 0):** creado solo con Guardar (no Enviar) para DM-INV-026/028 y luego **borrado** en DM-INV-028 → no se coteja en nube (comportamiento esperado; nunca salió del dispositivo).

## Hallazgos (FAIL)
Ninguno. Único punto de atención: **DM-INV-026 defecto conocido v6.6.14** (formulario Guardado abre en tab General) — reproducido, no re-marcado FAIL.

**Estado final: HOME.**

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|------|-------|-----------------|-------|------------|-------|
| 1783694924647.0 | BD-FIELD-OK | 15/15 OK | client_stock_detail 1/1 · detail_unit 1/1 (30 campos totales) | 0 | Fechas `da_client_stock`/`da_expiration` difieren solo en hora (UTC-4→UTC); 5 POST reintentos AutoSend deduplicados por PK en nube (esperado) |

**Conclusión:** inventario Ref 43 enviado íntegro — cabecera (15 campos, cliente 401), detalle (GERPROALF001BOL) y unidad (5 UNI, lote LOTEQA10, venc 2026-07-10), 0 mismatches. Reintentos AutoSend deduplicados correctamente (sin duplicados en nube).
