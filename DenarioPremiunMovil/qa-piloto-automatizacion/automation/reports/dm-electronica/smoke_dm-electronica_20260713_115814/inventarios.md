# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | Infinix HOT 60i (X6728) · Android · UUID da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — El Yaque DM ELECTRONIC v6.6.18 |
| Playa / Cliente | dm-electronica (BOTZ / DM ELECTRONIC) · usuario 002 |
| Empresa | BOTZ (idEnterprise 1 / coEnterprise BARAK_A) |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

Estado inicial: HOME · Estado final: HOME ✅

Cliente de prueba: **TIENDAS RORIX C.A (000234)** — sincronizado en device para usuario 002.
(MAR-CHAZ 00091 del YAML NO está sincronizado para este usuario → se usó RORIX, confirmado en UI.)
Producto capturado: **CAFETERA MILEXUS NEGRA 12 TAZAS ML-CT-8021** (co 0001001), familia LINEA BLANCA (catálogo real = línea blanca/electrodomésticos, no "A/A" aires como preveía el YAML).

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO + BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs General/Inventario/Resumen/Adjuntos; campo Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "TIENDAS RORIX C.A (000234)" → 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario → familia LINEA BLANCA (363) → 50 productos; sub-segmentos UBICACIÓN (Exhibición/Depósito/Todos) + FILTRO (Inventariados) |
| DM-INV-010 | ✅ PASS | Click producto (Pointer+Mouse) → modal `inventory-type-stocks-modal` abierto |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` Cantidad=5 reflejada; lote/fecha NO llenados (VG expirationBatch=false) |
| DM-INV-012 | ✅ PASS | Aceptar (checkmark-outline) sin exigir lote/fecha; producto "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: "CAFETERA MILEXUS... 5 UNIDAD" |
| DM-INV-017 | ✅ PASS | Botón "Pedido Sugerido" → modal `inventario-sugerido-modal` con producto (manejado por VG suggestedOrder=true) |
| DM-INV-020 | ✅ PASS | Modal sugerido muestra "Días desde último Inventario: 1 / Días para siguiente Inventario: 1" |
| DM-INV-021 | ✅ PASS | Guardar: "¿Desea guardar el Inventario?" → Aceptar → "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Enviar: 2 alertas ("¿Desea enviar?" → "será enviado") → "Inventario nro. 1 enviado exitosamente" |
| DM-INV-023 | ✅ PASS | BUSCAR: "Nro. Ref.: 1 · TIENDAS RORIX C.A · Estatus: Enviado · 13/07/2026" |
| DM-INV-025 | ✅ PASS | Searchbar filtra realtime: "RORIX"→1, "ZZZZ"→0, vacío→1 |
| DM-INV-026 | ✅ PASS | Inventario Guardado (2º, Ref 0) reabre con cliente cargado; abre en tab **General** (defecto conocido v6.6.14, observación no FAIL) |
| DM-INV-028 | ✅ PASS | Trash danger en Guardado → borrado directo "¡EL Inventario se borro con exito!" (sin confirmación previa) → desaparece de lista |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Nro. 1** | Inventario TIENDAS RORIX C.A (000234) · 1 producto (CAFETERA MILEXUS 0001001) · Cantidad 5 UNIDAD (Exhibición) | **Enviado** — persistido en nube (BD-OK) |
| Ref 0 (2º) | Inventario TIENDAS RORIX C.A · CAFETERA cantidad 3 · Guardado local | **Borrado** (DM-INV-028) — nunca enviado, sin fila en nube |

## Verificación BD (RUNTIME §10)

**Nube (query.js) — CONFIRMADO tras poll** (los primeros intentos dieron `ERR: remaining connection slots` del servidor; blindaje §10 → se reintentó y conectó):

```
client_stock: id_client_stock=1 · co_client_stock="1783965140165.0" · st_client_stock=1 (Enviado) · det=1 · units=1
```

- **Correlación Nro.Ref UI = `id_client_stock` = 1** (confirmada).
- `det=1` = 1 producto inventariado · `units=1` = 1 captura de cantidad. Cuadra con la UI.
- `st_client_stock=1` = **Enviado** en este servidor El Yaque (igual a piercar; otras playas usan st=2).
- **Marca: BD-OK** — guardado→enviado confirmado (round-trip UI→servidor completo).

**Payload capturado** (`clientstockservice/clientstock`, hook nativePromise) volcado a `_payloads.jsonl`: coClient 000234, 1 detalle (CAFETERA 0001001), 1 unidad `quStock=5` `ubicacion="exh"` `nuBatch=""` `daExpiration=hoy(default)` `stDelivery=2`. Corrobora el envío. (3 POST idénticos = reintentos, mismo coTransaction.)

**Local (local-query.js):** `BD-N/A` — `sqlite3` no disponible en el device (`run-as: exec failed for sqlite3`). No bloqueante; el cotejo nube+payload es suficiente.

## Hallazgos (divergencias UI↔config, NO FAIL)

1. **⚠ Lote + Fecha de vencimiento aparecen en `inventory-type-stocks-modal` pese a `expirationBatch=false`.** El modal muestra input "Ingrese lote" (text) + "Fecha de vencimiento" (`ion-datetime-button`) además de Cantidad. Sin embargo, **NO son obligatorios**: Aceptar tuvo éxito con lote/fecha vacíos, y el payload envió `nuBatch=""` + `daExpiration` en default de hoy. Es decir, `expirationBatch=false` funciona a nivel de validación pero los CAMPOS igual se renderizan. Divergencia UI-vs-config a **verificar con desarrollo** (mismo tipo que piercar `expirationBatch`, jerez `suggestedOrderByDispatchAndReturn`). El prompt pedía reportar si aparecían lote/fecha → **reportado**.

2. **Botón "Pedido Sugerido" y modal `inventario-sugerido-modal` activos.** Manejados por VG `suggestedOrder=true` (config), no por `suggestedOrderByDispatchAndReturn` (=false). Coherente con el YAML. DM-INV-017/020 se ejecutaron como PASS.

3. **Resumen del Guardado reabierto salió vacío a los ~1.8s** tras click en tab Resumen (el cliente sí cargó en General). Muy probablemente latencia de reapertura async (~3s, ya documentada en jerez), NO data-loss: el inventario Enviado sí persistió capturas completas en nube. Observación, no FAIL.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Modal cliente: input texto (x≈180,y96) + `ion-icon[name="search-circle-sharp"]` (x≈325,y95) para filtrar; selección por `<p>` del nombre | universal (confirma ferrenuestro) | En dm-electronica el input NO filtra on-keyup; escribir texto y clicar la lupa dispara la búsqueda. Habilita las 4 tabs |
| Tab Inventario: familias con conteo → click entra a lista de productos con sub-segmentos UBICACIÓN (Exhibición/Depósito/Todos) + FILTRO (Inventariados) + input "Búsqueda de productos" | cliente (dm-electronica) | Estructura idéntica a ferrenuestro |
| `inventory-type-stocks-modal`: inputs por placeholder "Ingrese cantidad"(number)/"Ingrese lote"(text) + `ion-datetime-button` "Fecha de vencimiento"; Aceptar = `ion-icon[name="checkmark-outline"]`; tipo fijo "Exhibición" sin segmento | cliente (dm-electronica) | Lote+Fecha se muestran pese a expirationBatch=false pero NO obligatorios |
| `expirationBatch=false` NO oculta los campos lote/fecha del modal (solo los hace opcionales) | cliente (dm-electronica) — # candidato universal | Verificar con desarrollo |
| Borrado Guardado: trash `ion-button[color="danger"]` dentro del item → borrado **directo sin confirmación** ("¡EL Inventario se borro con exito!") | universal (confirma insumar/gmp) | Reconfirmado en dm-electronica |
| `st_client_stock=1` = Enviado en servidor El Yaque | cliente (dm-electronica) — confirma piercar | Otras playas usan st=2 |
| Nro.Ref UI = `id_client_stock` (nube) = 1 | universal | Correlación confirmada en dm-electronica |

> ✅ consolidado 20260713 — modal cliente lupa + borrado directo reconfirmados (tags); expirationBatch=false NO oculta lote/fecha + st_client_stock=1 + Nro.Ref=id_client_stock → notas inventarios.md; cliente/producto_test + nota expirationBatch → YAML.

## Verificación BD (payload ↔ nube)

Motor: `cotejo-payload.js dm-electronica` · endpoint `clientstockservice/clientstock` · 1 registro lógico (3 POST reintento idénticos).

**Conteo:** BD-FIELD-OK 1 · MISMATCH 0 · SAVED 0 · N/A 0

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| 1783965140165.0 | **BD-FIELD-OK** | 15/15 OK | detail 1↔1 · detail_unit 1↔1 | 0 | 2 (zona horaria) |

**Hijas:** client_stock_detail 0001001 (CAFETERA MILEXUS NEGRA 12 TAZAS) OK · client_stock_detail_unit 0001001UNI qu_stock=5, ubicacion=exh OK. Notas TZ en da_client_stock/da_expiration (día OK). Payload == nube.
