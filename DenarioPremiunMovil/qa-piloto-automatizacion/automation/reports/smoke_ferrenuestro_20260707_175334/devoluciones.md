# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | Infinix HOT 60i (X6728) — Android real vía CDP :9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | ferrenuestro (Isla Coche) |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Módulo abre con botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Form: tab GENERAL habilitada, PRODUCTOS/ADJUNTOS `disabled`, sin cliente. Empresa "FERRENUESTRO MAYOR," (única, enterpriseEnabled=true) |
| DM-DEV-004 | ✅ PASS | Cliente TORNICAGUA, C.A. (121793873) seleccionado → tabs PRODUCTOS/ADJUNTOS habilitan. **Sin selector de factura en cabecera** (validateReturn=false) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valores y releen OK; Tipo popover con opciones Calidad(60,default)/Cambio X Cambio(63)/Servicio(59) |
| DM-DEV-011 | 🚫 N/A | validateReturn=false → no existe selector de factura en cabecera; tabs ya habilitan con solo el cliente. Nro Factura vive dentro del acordeón del producto (requeridedNroFactura=true) |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familias inline (CERRAJERIA) → producto ALDABA PORTACANDADO → acordeón expande con Lote, Nro Factura, Fecha Venc, Cantidad Devuelta, Unidad(UND), Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 + Nro Factura=000123 → botones Guardar/Enviar habilitados y visibles |
| DM-DEV-015 | ✅ PASS | Tab ADJUNTOS: acordeones Imágenes(images) + Archivo(file, userCanUploadFiles=true) + Firma(sign, signatureReturn=true) + canvas de firma presente |
| DM-DEV-016 | ✅ PASS | Guardar → alert "¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS (UI) | Enviar → 2 alerts: "¿Desea enviar la devolución?" (Aceptar) + "¡Su Devolución será enviada!"; navega a home módulo. ⚠ Ver Verificación BD: no persistió en nube |
| DM-DEV-019 | ✅ PASS | BUSCAR → lista con "Nro. Ref: 0 · TORNICAGUA, C.A. · Estatus: Por Enviar · Fecha: 07/07/2026" |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real: "TORNICAGUA"→1, "ZZZNOMATCH"→0, limpio→1 |
| DM-DEV-022 | ✅ PASS | Abrir devolución Guardada → editable, cliente y Responsable(QA Grecia) precargados, 3 tabs accesibles, Guardar/Enviar visibles (round-trip §9 OK) |
| DM-DEV-024 | ✅ PASS | Trash (ion-button[color=danger] + icono `trash`) presente **solo** en ítem Estatus "Guardado" → alert "¿Desea eliminar la devolución?" → ELIMINAR → ítem desaparece. Sin alert de éxito post-borrado (consistente insumar/globalmp) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro.Ref 0 (co_return `1783476275479.0`) | Devolución TORNICAGUA · ALDABA PORTACANDADO (cod 0019) x2 · Nro Factura 000123 · Tipo Calidad(60) · Motivo 49 | **Por Enviar** (enviada por UI, NO sincronizada en nube — ver BD) |
| Nro.Ref 0 (2ª, solo Guardada) | Devolución TORNICAGUA · ALDABA x1 · Nro Factura 000999 | **ELIMINADA** en DM-DEV-024 |

## Verificación BD
- **Baseline nube (pre-envío):** `return` count=18, max id_return=190, nu_amount=null en todas (consistente con piercar: devoluciones enviadas no registran monto).
- **Payload capturado (§10.c):** el hook `nativePromise` SÍ capturó el POST a `returnservice/return` (4 POSTs idénticos = reintentos). co_return `1783476275479.0`, idClient 504 (TORNICAGUA), coDocument "000123", producto coProduct 0019 qu=2, idType 60, idMotive 49, coInvoice/idInvoice=null, stDelivery=2. Anexado a `_payloads.jsonl` + manifiesto `_bd-manifest.jsonl` (action:sent).
- **Cotejo nube post-envío:** poll a ~10s, ~25s, ~50s y ~3min → la devolución **NO llegó a la nube**: count sigue en 18, max id_return sigue en 190, `co_return LIKE '1783476275479%'` → 0 filas.
- **Estado en UI:** el ítem quedó "**Por Enviar**" con Nro.Ref 0 (no "Enviado"/correlativo). Marca: **BD-INFO / BD-SAVED (no-persistencia)**.
- **Conclusión guardado→enviado:** ⚠ el flujo de Enviar completa por UI (alerts + navegación) pero el registro **no persiste en la nube** y queda en cola local "Por Enviar". Coincide con el patrón documentado en jerez (memoria `project_jerez_no_persistencia_endpoints`): cliente potencial/pedido quedan "Por Enviar" y no llegan a nube. Aquí aplica a DEVOLUCIONES en el backend Isla Coche/ferrenuestro. **No es FAIL de UI** — es no-persistencia de endpoint (backend/sync), reportado como BD-INFO para consolidación.
- **Lectura local (sqlite3):** BD-N/A — `local-query.js` falla con `run-as: exec failed for sqlite3: No such file or directory` (binario sqlite3 ausente en el dispositivo). No bloquea el smoke (blindaje §10).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `#clienteSelectModal` searchbar NO filtra (ferrenuestro) | cliente | Igual a jerez: teclear en el buscador del modal no reduce los 41 ítems; usar `it.scrollIntoView({block:'center'})` + click por coords cuando `top` esté en viewport. Confirmado en ferrenuestro |
| Trash de borrado SOLO en Estatus "Guardado", NO en "Por Enviar" | universal (candidato) | ferrenuestro: `ion-button[color="danger"]` + `ion-icon[name="trash"]` aparecen únicamente en ítems "Guardado" (nunca enviado). Un ítem "Por Enviar" (send intentado, en cola) tampoco expone trash — ni en lista ni en detalle. Refina la nota previa "solo Guardado, nunca Enviado" añadiendo el estado intermedio "Por Enviar" |
| Payload capture SÍ engancha `returnservice/return` | universal | Contrario al gap conocido de order/collection: el POST de devoluciones SÍ se captura vía `nativePromise` (co_return + details completos). Útil para cotejo cuando local sqlite3 no está disponible |
| Tipo devolución ferrenuestro = Calidad(60,def)/Cambio X Cambio(63)/Servicio(59) | cliente | ferrenuestro incluye "Cambio X Cambio"(63) como globalmp/don-theo; sin PostVenta(52) |
| No-persistencia endpoint `returnservice/return` (Isla Coche/ferrenuestro) | cliente | Devolución enviada por UI queda "Por Enviar" Nro.Ref 0 y no llega a nube (4 reintentos de POST). Mismo patrón que jerez pedido/cliente-potencial. ⚠ **CORREGIDO al cierre: SÍ persistió (sync diferida), NO no-persistencia** — ver corrección post-corrida abajo |

> ✅ consolidado 2026-07-07 → clienteSelectModal-no-filtra (tag jerez), trash-solo-Guardado, payload-return-capture, sync-diferida (NO no-persistencia) en `module-selectors/devoluciones.md` Notas por cliente; tipos CxC(63) con tag en el selector; datos en `ferrenuestro.yaml modules.devoluciones` + nota_sync_diferida global del cliente.

## Datos de prueba descubiertos (para el YAML ferrenuestro)
- `cliente_test`: **"TORNICAGUA, C.A."** (id_client 504, código 121793873) — con cartera activa, tabs habilitan OK.
- `factura_test`: **N/A por VG** — validateReturn=false → no hay selector/modal de factura (`#InvoiceeSelectModal` NO se alcanza). El Nro Factura es campo libre dentro del acordeón del producto (se usó "000123"/"000999").
- `producto_test`: **"ALDABA PORTACANDADO 2 LAT CAL.18 C/TOR"** (coProduct 0019, idProduct 2, familia CERRAJERIA, unidad UND).
- **Modal de facturas:** N/A por VG (sin selector de factura en cabecera). No se evaluó vacío/lleno del `#InvoiceeSelectModal` porque validateReturn=false lo suprime.

## Verificación BD (payload ↔ nube) — Agente BD

| co_return | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|-----------|-------|-----------------|-------|------------|-------|
| `1783476275479.0` | **BD-SAVED** | no cotejables (fila ausente en nube) | no cotejables | — | Enviado (POST a `returnservice/return` capturado, 4 reintentos idénticos) pero ausente en nube tras poll (~10s/25s/50s/3min). Baseline `return` count=18 / max id_return=190 sin cambios; `co_return LIKE '1783476275479%'` → 0 filas. No-persistencia endpoint `returnservice/return` (mismo patrón jerez). Cliente TORNICAGUA (id 504), coDocument 000123, coProduct 0019 x2, idType 60, idMotive 49. |

**Confirmación formal:** BD-SAVED = enviado pero no llegó a la nube. No es FAIL de UI; es no-persistencia de endpoint backend/sync.

## ⚠ Corrección post-corrida — SÍ persistió (sync diferida)

El diff final de baseline (cierre de corrida) confirma que el registro marcado "Por Enviar"/BD-SAVED **SÍ llegó a la nube**: `return` id=191 (verificado como nuestro, id_client 504 TORNICAGUA / co_* coincidente con el payload). La marca BD-SAVED durante la corrida se debió a que la **sync es asíncrona/diferida** y la fila apareció DESPUÉS de la ventana de poll (~10s–3min). No es no-persistencia de endpoint. Ver `consolidado.md` §"Verificación BD".
