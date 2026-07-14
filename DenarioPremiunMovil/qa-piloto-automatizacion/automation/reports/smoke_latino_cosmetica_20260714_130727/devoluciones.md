# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente | latino_cosmetica (usuario 001, ***) |
| Servidor | La Tortuga (`denariolatortuga.ddns.net:8081`) · `window.ng=TRUE` · sync inmediata |
| App | `com.kiberno.denarioPremiumPro` |
| Empresa | LATINOCOSMETICA C.A. (idEnterprise 1, USD, default) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N-A · 0 BLOCKED** |
| Estado final | HOME ✅ |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | /devoluciones con botones DEVOLUCIÓN y BUSCAR visibles |
| DM-DEV-002 | ✅ PASS | Form abre; tabs Productos/Adjuntos `disabled`, General habilitada; sin cliente |
| DM-DEV-004 | ✅ PASS | Cliente CABELLO COSMETICOS CA (37, idClient 300) seleccionado; campo Factura aparece (validateReturn=true) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valores; Tipo=Calidad(60,default), opciones Calidad/PostVenta/Servicio |
| DM-DEV-011 | ✅ PASS | Factura 1820 (idInvoice 2557) seleccionada → tabs Productos/Adjuntos habilitadas |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO lista productos de la factura (validateReturn); PT004 agrega acordeón que expande con Cantidad/Lote/NroFactura/Unidad/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=1, NroFactura precargado (1820) → Guardar y Enviar habilitados |
| DM-DEV-015 | ✅ PASS | Adjuntos: acordeones Imágenes(images) + Archivo(file, userCanUploadFiles) + Firma(sign, canvas, signatureReturn) visibles |
| DM-DEV-016 | ✅ PASS | Alert "¡Su Devolución se ha guardado!" (Guardar procede SIN firma) |
| DM-DEV-018 | ✅ PASS | 3 alerts: ¿Desea enviar? → ¡será enviada! → "Devolución nro. 7 enviada exitosamente"; navega a home módulo |
| DM-DEV-019 | ✅ PASS | Lista con Nro.Ref/Cliente/Estatus/Fecha: Ref 7 CABELLO Enviado, Ref 0 CABELLO Guardado, Ref 6/5 ANNELI |
| DM-DEV-021 | ✅ PASS | Filtro "ANNELI" reduce a 2 en tiempo real; trash solo en Ref 0 Guardado (Enviados sin trash) |
| DM-DEV-022 | ✅ PASS | Devolución Guardada (Ref 0) reabre editable: cliente CABELLO(37) y factura 1716 precargados, 3 tabs accesibles (round-trip §9 OK) |
| DM-DEV-024 | ✅ PASS | Trash → "¿Desea eliminar la devolución?" (Cancelar/Eliminar) → Eliminar → ítem desaparece (sin alert de éxito post-borrado) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **7** | Devolución CABELLO COSMETICOS CA (37) · factura 1820 · producto PT004 (TRATAMIENTO 300ml CENIZO) qty 1 · Tipo Calidad(60) · co_return `1784054258852.0` | **Enviado** (BD-OK) |
| 0 | Devolución CABELLO (37) · factura 1716 · PT004 qty 2 · Guardado local | **Guardado → ELIMINADO** en DM-DEV-024 |

## Verificación BD

Baseline nube (inicio): max `id_return=6`. Tras Enviar:

| Registro | Marca | Fila nube | Conclusión |
|----------|-------|-----------|------------|
| Ref 7 | **BD-OK** | `return` id_return=7, co_return=1784054258852.0, st_return=1 (Enviado), id_client=300, nu_amount=null; 1 `return_detail` (co_product PT004, qu_product 1, id_motive 49) | Guardado→enviado confirmado. Correlación Nro.Ref UI 7 = id_return 7. `nu_amount=null` normal (igual piercar/dm-electronica). |
| Ref 0 (Guardado) | BD-N/A | — | Eliminado antes de enviar; BD local N/A (sin sqlite3 run-as); no llegó a nube (esperado). |

Payload `returnservice/return` capturado vía hook `nativePromise` (volcado a `_payloads.jsonl`); manifiesto `_bd-manifest.jsonl` anexado con co_return sent.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Selección de cliente vía Angular** | universal (candidato) | Los ion-item del `#clienteSelectModal` NO responden a click sintético NI real (pg.mouse.click) — el modal cierra sin fijar `general.cliente`. Ruta fiable con `window.ng`: `general = ng.getComponent('devolucion-general')` → `general.selectorCliente.selectClient(clientObj)` (obj de `selectorCliente.clientes`). Si ya había cliente → alert "¡Alerta! Se ha detectado cambio del cliente" (Cancelar/Aceptar) → click real Aceptar. En form fresco NO hay alert. |
| **Selección de factura vía Angular** | universal (candidato) | `general.selectorInvoice.selectInvoice(invObj)` con obj de `general.returnLogic.invoices` (keys coInvoice/idInvoice/daInvoice). Habilita tabs; sin alert si no había factura previa. Abrir el modal `#InvoiceeSelectModal` primero carga `returnLogic.invoices`. |
| Componentes del form devoluciones | universal | `app-devolucion` > `devolucion-general` (tab General, dueño de cliente/factura/campos). Métodos útiles: `setClientfromSelector`, `setInvoicefromSelector`, `onEnterpriseSelect`, `reset`. `app-devoluciones.showNewReturn` es solo flag del wrapper. |
| `#clienteSelectModal` searchbar no filtra por teclado | cliente/universal | Teclear (nativo o eventos) el nombre completo filtra a 0; usar la vía Angular en vez del searchbar. Limpiar `ion-backdrop` huérfanos antes de reabrir el modal (si no, no abre). |
| AGREGAR PRODUCTO con validateReturn=true | universal (confirma dm-electronica) | Lista **inline** los productos de la factura (no familias, no modal). Acordeón por producto colapsado → click header para expandir; NroFactura precargado con la factura. |
| Tipos devolución latino_cosmetica | cliente | Calidad(60,default)/PostVenta(52)/Servicio(59) — sin Cambio X Cambio (igual piercar/jerez/dm-electronica). |
| Enviar sin firma con signatureReturn=true | universal (confirma dm-electronica) | Guardar y Enviar proceden sin dibujar firma; payload `nuAttachments=0`, `hasAttachments=false`. |
| Dirty-guard al reabrir Guardada + back | universal | Reabrir una Guardada y hacer `clickBack` (img.fechaAtras) dispara modal "Guardar y salir / Salir sin guardar / Cancelar"; "Salir sin guardar" preserva el registro. `clickBack` (dispatch MouseEvent en `closest('a')`) SÍ funciona en este build La Tortuga (contrasta don-theo). |
| Lista BUSCAR conserva DEVOLUCIÓN/BUSCAR | cliente | Igual dm-electronica; Ref 0 = Guardado local sin sincronizar. |

> ✅ consolidado 20260714

## Notas

- Servidor La Tortuga, `window.ng=TRUE` → conducción por componentes Angular fiable (openNuevoCobro-style). Fue **necesaria** para la selección de cliente/factura porque los modales no aceptan clicks.
- Cliente sincronizado con facturas devolvibles confirmado: **CABELLO COSMETICOS CA (37)** con facturas USD 1820 y 1716.
- BASELINE (Ola 0): TOOL-USES ≈ 48 (elevado por exploración inicial de la mecánica de modales no-clicables → mapeo Angular; en próximas corridas con el patrón ya documentado bajará a ~25). MS módulo ≈ 40 min.

## Verificación BD (payload ↔ nube · campo-a-campo · Agente BD)

| co_x | Marca | Cabecera | Hijas | Mismatches | Notas |
|------|-------|----------|-------|------------|-------|
| 1784054258852.0 | BD-FIELD-OK | 11 campos OK | return_detail 1/1 (8 campos) | 0 | naProduct con padding en BD (dato correcto). ⚠ cotejo-payload.js esperaba envelope 'returns' pero payload trae 'details' → ajustar fieldMap config devoluciones; verificación manual por query confirmó OK |

**Devolución #7 (CABELLO COSMETICOS 37, factura 1820, PT004 TRATAMIENTO CENIZO): enviada→íntegra en nube.** Cabecera 11 + 1 detalle (8 campos) coinciden. Cero mismatches reales.
