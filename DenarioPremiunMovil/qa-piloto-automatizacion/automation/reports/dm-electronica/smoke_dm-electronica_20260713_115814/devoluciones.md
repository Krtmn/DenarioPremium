# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente | dm-electronica (usuario 002) |
| Dispositivo | Infinix X6728 (Infinix HOT 60i) · UUID da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — appVersion 1.0 · dbVersion 12 |
| Servidor | denarioelyaque.ddns.net:8081 (El Yaque) |
| Empresa | BOTZ / BARAK_A (idEnterprise 1, default) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

**Datos de prueba usados:** cliente `TIENDAS RORIX C.A` (co 000234, id 119); factura enviada `50003306` (producto CONGELADOR VIVAMAX 100LT SILVER, co 0001110); factura guardada `50003307` (producto LAVADORA D/TINA BOTZ 8KG BLANCA).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Módulo abre; botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Form abre; tabs Productos/Adjuntos `disabled`, sin cliente; empresa default BOTZ |
| DM-DEV-004 | ✅ PASS | Cliente `TIENDAS RORIX C.A (000234)` seleccionado; campo Factura (#invoiceSelect) aparece (validateReturn=true) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario editan; Tipo con opciones Calidad(60,default)/PostVenta(52)/Servicio(59) |
| DM-DEV-011 | ✅ PASS | Factura 50003306 elegida (modal `#InvoiceeSelectModal`, 6 facturas reales); tabs Productos/Adjuntos habilitadas |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → productos de la factura; acordeón expande con Cantidad/Lote/NroFactura(precargado)/Fecha Venc/Unidad/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=1 en `.inp-write` → Guardar y Enviar habilitados |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: acordeones Imágenes + Archivo (userCanUploadFiles) + Firma con canvas (signatureReturn) |
| DM-DEV-016 | ✅ PASS | Guardar → alert "¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS | Enviar → "¿Desea enviar?" → ACEPTAR → "¡será enviada!" + "Devolución nro. 3 enviada exitosamente"; navega a home módulo |
| DM-DEV-019 | ✅ PASS | BUSCAR → lista con "Nro. Ref: 3 · 000234 TIENDAS RORIX C.A · Estatus: Enviado · 13/07/2026" |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real (RORIX→1, inexistente→0); trash SOLO en Guardado (ausente en Enviado) |
| DM-DEV-022 | ✅ PASS | Devolución Guardada (Ref 0) abre editable; 3 tabs accesibles; cliente/factura(50003307)/responsable precargados (round-trip §9 OK) |
| DM-DEV-024 | ✅ PASS | Trash Guardado → "¿Desea eliminar?" → ELIMINAR → devolución desaparece (queda solo Ref 3 Enviado) |

## Registros creados en sistema
| Ref | Detalle | Estado | BD |
|-----|---------|--------|----|
| 3 | Devolución RORIX (000234) · factura 50003306 · CONGELADOR VIVAMAX 100LT ×1 · Calidad(60) | Enviado | **BD-OK** (nube id_return=3, st_return=1) |
| 0 | Devolución RORIX (000234) · factura 50003307 · LAVADORA BOTZ 8KG ×2 | Guardado → **ELIMINADO** en DM-DEV-024 | local (no sincronizado) |

## Verificación BD (nube El Yaque)
- **co_return** `1783963853979.0` → nube `return` **id_return=3** · **st_return=1** (Enviado) · co_client 000234 · na_client TIENDAS RORIX C.A · na_responsible "QA Automation" · nu_seal "PRC-001" · tx_description "Devolucion QA smoke dm-electronica".
- **return_detail** (det=1): co_product 0001110 · CONGELADOR VIVAMAX 100LT SILVER · qu_product 1.0000 · co_document 50003306. **Cuadra 1:1 con lo cargado por UI.**
- Correlación confirmada: **Nro.Ref UI (3) = id_return (3)**.
- Conclusión **guardado→enviado: BD-OK** — sync a nube **inmediata** (aparece en <10s, NO diferida como ferrenuestro/Isla Coche pese a compartir servidor El Yaque).
- `nu_amount=null` y `co_type=null` en nube — consistente con patrón piercar (devoluciones no registran monto/tipo en servidor); no es mismatch.
- Manifiesto: `_bd-manifest.jsonl` con `co_x=1783963853979.0` (action: sent). Payload volcado a `_payloads.jsonl` (returnservice/return).
- Local SQLite: **BD-N/A** (`run-as: sqlite3 No such file or directory` en el device); cotejo hecho contra nube + payload capturado.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Empresa default dm-electronica = **BOTZ / BARAK_A** (idEnterprise 1, coCurrencyDefault US$) | cliente | 1er ion-select del form; único visible antes de tipo |
| Tipos devolución dm-electronica = **Calidad(60,default) / PostVenta(52) / Servicio(59)** | cliente | Sin "Cambio X Cambio"; igual a piercar/jerez. (BD sugería PostVenta52/Despacho53 pero UI muestra estos) |
| `#clienteSelectModal` searchbar NO filtra (50 ítems capados) | universal (reconfirma jerez/ferrenuestro) | Alcanzar cliente bajo el fold con `ion-content.getScrollElement().scrollTop+=` + `scrollIntoView` + click por coords |
| Con `validateReturn=true`, AGREGAR PRODUCTO lista **directamente los productos de la factura** (no familias) | universal | Los productos varían por factura (50003306→CONGELADOR VIVAMAX; 50003307→LAVADORA BOTZ) |
| Payload `returnservice/return` capturable vía `nativePromise` en build El Yaque | universal (reconfirma ferrenuestro) | Cabecera + details completos; útil como cotejo cuando sqlite3 local no está |
| dm-electronica (El Yaque): sync devoluciones **INMEDIATA** a nube | cliente | Contrasta con ferrenuestro Isla Coche (diferida ~3min) pese a mismo dominio El Yaque; return id=3 visible en <10s con st_return=1 |
| Lista BUSCAR devoluciones **conserva** botones DEVOLUCIÓN/BUSCAR visibles | cliente | Contrasta con piercar (donde no se veían desde la lista); en dm-electronica sí |
| Firma dibujada → `nuAttachments=0`/`hasAttachments=false` en payload | universal (info) | La firma no se cuenta como adjunto en el payload; el envío procede igual con signatureReturn=true |

> ✅ consolidado 20260713 — tipos devolución + clienteSelectModal + payload nativePromise reconfirmados (tags); AGREGAR PRODUCTO directo + firma no-adjunto → filas universales; sync inmediata + empresa BOTZ + lista conserva botones → nota cliente; cliente/factura/producto_test → YAML.

## Hallazgos (FAIL)
Ninguno. 14/14 PASS.

## Verificación BD (payload ↔ nube)

Motor: `cotejo-payload.js dm-electronica` · endpoint `returnservice/return` · 1 payload cotejado.

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| `1783963853979.0` | **BD-FIELD-OK** | 14/14 OK | return_detail 1/1 OK | 0 | 1 (da_return TZ UTC-4↔UTC) |

**Conteo:** BD-FIELD-OK ×1 · MISMATCH ×0 · SAVED ×0 · N/A ×0.
**Cabecera:** co_return, id_type(60), tx_description (rename txComment→tx_description), co_client(000234), id_client(119), co_enterprise(BARAK_A) — idénticos. **Hija return_detail** (0001110∙50003306 CONGELADOR VIVAMAX 100LT): qu_product 1, co_document 50003306, id_motive 49 — 9/9 OK. Sin mismatches. Lo enviado == lo guardado.
