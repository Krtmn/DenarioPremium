# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente / Playa | ferrenuestro — Isla Coche |
| Usuario | `leidy` (idUser 315, coUser 15915) |
| App | `com.kiberno.denarioPremiumPro` — build refactorizado (El Yaque / servidor Isla Coche → host `denariolatortuga.ddns.net:8081`) |
| Infra sesión | **`window.ng=TRUE`** · alert botón "OK" · COTEJO BD CAÍDO → verificación por **CAPTURA DE PAYLOAD** + UI (BD-N/A payload) |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Click módulo → `app-devoluciones` `/devoluciones`; botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Click DEVOLUCIÓN → form; tabs General(habilitada) · Productos(disabled) · Adjuntos(disabled); sin cliente |
| DM-DEV-004 | ✅ PASS | Cliente TORNICAGUA fijado (hasClient=true, cliente.idClient=504) → tabs Productos/Adjuntos habilitan DIRECTO (validateReturn=false, sin campo Factura en cabecera) |
| DM-DEV-006 | ✅ PASS | Responsable="QA Responsable" · Precinto="PREC-001" · Comentario aceptados (confirmado en componente). Tipo popover con 3 opciones: Calidad(60,default)/Cambio X Cambio(63)/Servicio(59) |
| DM-DEV-011 | 🚫 N/A | `validateReturn=false` → NO hay selector/modal de factura en cabecera (`#InvoiceeSelectModal` no se alcanza). Nro Factura es campo libre por producto. Correcto por VG |
| DM-DEV-013 | ✅ PASS | Tab Productos → Agregar Producto → familias inline → CERRAJERIA → ALDABA PORTACANDADO (0019); acordeón expande con Lote/Nro Factura/Fecha Venc/Cantidad/Unidad(UND)/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 (inp-write number), Nro Factura=000123 (inp-write text), Lote=L-QA-001 → Guardar y Enviar habilitados |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: 3 acordeones — Imágenes(images) · Archivo(file, userCanUploadFiles=true) · Firma(sign, signatureReturn=true) con canvas presente |
| DM-DEV-016 | ✅ PASS | Click Guardar → alert "Denario Devolución / ¡Su Devolución se ha guardado!" |
| DM-DEV-018 | ✅ PASS | Click Enviar → 3 alerts: confirm "¿Desea enviar la devolución?" (Cancelar/Aceptar) → "¡Su Devolución será enviada!" → **"Devolución nro. 215 enviada exitosamente"**; navega a home devoluciones. POST `returnservice/return` CAPTURADO |
| DM-DEV-019 | ✅ PASS | Click BUSCAR → devolución "Nro. Ref: 215 · TORNICAGUA, C.A. · Estatus: **Enviado** · Fecha: 23/07" en lista |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real ("FERREMAX"→1 ítem; limpiar→3). Trash (`ion-button[color=danger]`) SOLO en ítem Estatus Guardado (Enviados sin trash) |
| DM-DEV-022 | ✅ PASS | Click devolución Guardada (Ref 0) → form editable, 3 tabs accesibles, cliente precargado "TORNICAGUA, C.A. (121793873)", tipo=60; producto precargado con Lote=L-QA-002 / Nro Factura=000456 / Cantidad=3 (round-trip §9 1:1 OK) |
| DM-DEV-024 | ✅ PASS | Trash en Guardado → confirm "¿Desea eliminar la devolución?" (Cancelar/Eliminar) → Eliminar → ítem desaparece (0 Guardados, sin alert de éxito post-borrado) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Nro. Ref 215** | Devolución ENVIADA · cliente TORNICAGUA, C.A. (504) · tipo Calidad(60) · producto ALDABA PORTACANDADO (0019) qty 2 · Lote L-QA-001 · Nro Factura 000123 · coReturn `1784855960494.0` | **Enviado** (server confirmó correlativo 215) |
| Ref 0 (transitorio) | 2ª devolución sólo Guardada (TORNICAGUA · ALDABA qty 3 · Lote L-QA-002 · Nro Factura 000456) — usada para DM-DEV-022 (reabrir) y DM-DEV-024 (eliminar) | **Eliminada** (borrada en DM-DEV-024; nunca enviada, sin POST) |

## Verificación BD — **BD-N/A (payload)**

Cotejo directo a BD deshabilitado esta corrida (permission-denied). Verificación por **captura de payload** (`nativePromise` hook) + estado UI:

- **POST `returnservice/return` CAPTURADO** (host `denariolatortuga.ddns.net:8081`), 4 reintentos idénticos del `AutoSendService`, `coReturn=1784855960494.0`.
- Cabecera enviada: `idClient=504`, `coClient=121793873`, `idType=60`, `naResponsible="QA Responsable"`, `nuSeal="PREC-001"`, `txComment` correcto, `coEnterprise=00001`/`idEnterprise=1`, `coInvoice=null`/`idInvoice=null` (coherente con validateReturn=false), `nuAttachments=0`/`hasAttachments=false`, `stDelivery=2`.
- Detalle: `coProduct=0019`, `quProduct=2`, `coMeasureUnit=001` (UND), `nuLote="L-QA-001"`, **`coDocument="000123"`** (= Nro Factura libre del acordeón), `idMotive=49`.
- **Sync INMEDIATA esta corrida:** el server devolvió el correlativo real (215) en el 3.er alert y la lista mostró Estatus "Enviado" al instante. ⚠ Contrasta con `[ferrenuestro-2026-07-07]` donde la sync fue DIFERIDA ~3min. No se pudo cerrar cotejo en nube (BD caída) → marca **BD-N/A (payload)**, pero el POST capturado + correlativo asignado confirman la persistencia.
- Payload volcado a `_payloads.jsonl`; `co_return` anexado a `_bd-manifest.jsonl` (`action:sent`).

## ¿Firma requerida para enviar?

**NO.** Con `signatureReturn=true` el acordeón Firma aparece (canvas), pero Enviar procedió **sin dibujar firma**: no hubo bloqueo ni validación de firma; el payload salió con `nuAttachments=0`/`hasAttachments=false`. Confirma el patrón `[dm-electronica][latino_cosmetica]`: la firma NO cuenta como adjunto y el envío no la exige.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **`window.ng=TRUE` en ferrenuestro (Isla Coche) esta sesión** | cliente (contradice corrida previa) | La 1ª corrida `[ferrenuestro-2026-07-07]` reportó `window.ng=false`; esta sesión tiene `window.ng=TRUE`. Confirma la nota `[dm-electronica][latino_cosmetica]`: **NO asumir `window.ng` por servidor/build — probar `!!window.ng` al inicio**. |
| **Selección de cliente vía `comp.setClientfromSelector(clientObj)`** | universal (builds `window.ng=true`) | En `devolucion-general`: `setClientfromSelector(obj de selectorCliente.clientes)` + `ng.applyChanges(comp)` fija `comp.cliente`, `hasClient`, `nombreCliente` y habilita tabs. ⚠ `selectorCliente.selectClient(obj)` solo marca hasClient/nombreCliente pero **deja `comp.cliente=null` y tabs disabled** — usar `setClientfromSelector` (handler real). Form fresco sin alert. Refina la nota latino (`selectClient`). |
| **Tabs disabled ligadas a `comp.cliente` (no a `hasClient`)** | universal | Productos/Adjuntos siguen `disabled` con `hasClient=true` si `comp.cliente` es null; habilitan al fijar `comp.cliente` vía `setClientfromSelector` + `applyChanges`. |
| **Acordeón producto (validateReturn=false): orden de ion-inputs** | universal | idx0=Lote (plain) · idx1=Nro Factura (`inp-write`, text, requerido) · idx2=Cantidad Devuelta (`inp-write`, **type=number**). Selects: Unidad(UND=1) · Motivo(idMotive default 49). Nro Factura viaja como `coDocument` en el payload. |
| **`clickBack` (`img.fechaAtras`→`closest('a')` + MouseEvent) FUNCIONA en este build** | cliente | Navega form→home y home→app-home vía CDP (contrasta don-theo v6.6.14 donde fallaba; alinea con latino_cosmetica). |
| **Dirty-guard al salir de form Guardado** | universal | `clickBack` con form Guardado dispara alert (title "Denario Devolución", message vacío) con "Guardar y salir / Salir sin guardar / Cancelar". "Salir sin guardar" mantiene el registro Guardado (no es FAIL). |
| **ferrenuestro Isla Coche: sync devoluciones INMEDIATA esta corrida** | cliente | Ref 215 recibió correlativo del server en el 3.er alert y apareció "Enviado" al instante; contrasta con la sync DIFERIDA ~3min de `[ferrenuestro-2026-07-07]`. |
| **Trash solo en Estatus "Guardado"** | universal (confirma) | `ion-button[color="danger"]` presente sólo en ítem Guardado; ausente en Enviado. Borrado no muestra alert de éxito (confirma `[ins-2610][gmp-2611]`). |

> ✅ consolidado 20260723

## Hallazgos (FAIL)

Ninguno. 0 FAIL · 0 BLOCKED.
