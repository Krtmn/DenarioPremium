# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | `14678405BR003855` (Infinix X6728 / HOT 60i · Android 15) |
| App | `com.kiberno.denarioPremiumPro` — versionApp **1.0** · db_version **19** · `window.ng=true` |
| Playa | la_tortuga (`http://denariolatortuga.ddns.net:8081/PremiumWS`) |
| Usuario | **YC01** YUSNEIDI CLEMENTE (id_user 307) |
| Empresa | **00002** COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P (idEnterprise 2, default) |
| VGs | `validateReturn=false` · `requeridedNroFactura=true` · `signatureReturn=true` · `userCanUploadFiles=true` |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Tile Devoluciones → `app-devoluciones` con botones **DEVOLUCIÓN** y **BUSCAR** visibles |
| DM-DEV-002 | ✅ PASS | Form abierto: tabs **Productos/Adjuntos `disabled=true`**, `clienteSelect` vacío; Empresa preseleccionada **00002** |
| DM-DEV-004 | ✅ PASS | Cliente **AS04 ABASTO EL SITIO DSG, C.A.** fijado por click real en `#clienteSelectModal`; `comp.cliente` seteado y **las 3 tabs habilitan directo** (sin invoice-selector, coherente con `validateReturn=false`) |
| DM-DEV-006 | ✅ PASS | `responsable`=QA AUTOMATION · `precinto`=PRC-0730 · `comentario`=Devolucion smoke QA 20260730; popover **Tipo** con 4 opciones (Calidad 60 default / **Cambio X Cambio 63** / PostVenta 52 / Servicio 59) → seleccionado **63** |
| DM-DEV-011 | 🚫 N/A | `validateReturn=false` ⇒ **no existe** `ion-input#invoiceSelect` ni `#InvoiceeSelectModal` en el form; las tabs ya habilitaron con solo el cliente |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → categorías inline (ACEITE/ALBECA/**CAPRI 60**/COLGATE/HEINZ…) → **PCE03** PASTA ESP. TALLARIN CORTO 12x500gr; acordeón expande con Lote, Nro Factura, Cantidad, Fecha Venc, Unidad, Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 → **Enviar seguía `disabled`** (falta Nro Factura requerido); al llenar Nro Factura=FAC-0730-01 → **Enviar habilita**. Valida `requeridedNroFactura=true` |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos con **3 acordeones**: `images` (BUSCAR FOTO / TOMAR FOTO), `file` (Subir Archivo, por `userCanUploadFiles`), `sign` (Firma, por `signatureReturn`). Los 3 **abren** (sign expone canvas 288×223). 🔴 **No se cargó nada ni se dibujó firma** (regla permanente de QA) |
| DM-DEV-016 | ✅ PASS | Alert **"¡Su Devolución se ha guardado!"** (título `Denario Devolución`, botón **OK**) + BD local `st_delivery=3`, `id_return=0` |
| DM-DEV-018 | ✅ PASS | Cadena de **3 alerts**: `¿Desea enviar la devolución?` [Cancelar/Aceptar] → `¡Su Devolución será enviada!` [OK] → **`Devolución nro. 169 enviada exitosamente`** [OK]; navega al home del módulo |
| DM-DEV-019 | ✅ PASS | BUSCAR lista 4 devoluciones con **Nro.Ref, Cliente, Estatus, Fecha**; el Guardado sale como `Nro. Ref: 0` y tras enviar pasa a `Nro. Ref: 169 · Enviado` |
| DM-DEV-021 | ✅ PASS | Searchbar "SANTA" filtra **4 → 1** en tiempo real y restaura a 4 al limpiar; **papelera solo en el ítem Guardado** (ausente en los 4 Enviados) |
| DM-DEV-022 | ✅ PASS | Reabre el Guardado **editable** (`readonly=false`, `disabled=false`), **3 tabs accesibles**; round-trip §9 íntegro (ver abajo) |
| DM-DEV-024 | ✅ PASS | Papelera → alert **"¿Desea eliminar la devolución?"** [Cancelar/**Eliminar**] → el ítem desaparece de la lista **y de la BD local** (cabecera + `return_details` = 0). Sin alert de éxito post-borrado (consistente con `[ins-2610][gmp-2611]`) |

## Registros creados en sistema

| Ref | Cliente | Productos | Cantidad | Detalle | Estado |
|-----|---------|-----------|----------|---------|--------|
| **169** | AS04 — ABASTO EL SITIO DSG, C.A. (idClient 742) | PCE03 — PASTA ESP. TALLARIN CORTO 12x500gr (idProduct 794) | **2** CAJA (CJA, idUnit 4) | Nro Factura `FAC-0730-01` · Lote `LOTE-QA-0730` · Tipo **Cambio X Cambio (63)** · Motivo 49 · Resp. QA AUTOMATION · Precinto PRC-0730 · Empresa 00002 · Vencimiento: no cargado | **Enviado** |
| — (borrado) | CB10 — BIG BANG IMPORT, C.A | PCE03 | 1 CAJA | Nro Factura `FAC-0730-02` · Resp. QA DELETE TEST · creada solo para DM-DEV-024 | **Eliminada** (DM-DEV-024) |

**Guardados pendientes de envío manual:** ninguno. No se dejó ningún registro en Guardado (el único Guardado remanente se eliminó como parte de DM-DEV-024).

## Verificación BD

> BD **nube** (`global_mp`) sin GRANT ⇒ `query.js` no usado (decisión de QA). Oráculo por **BD local del device vía `window.sqlitePlugin`** + **payload capturado** del POST. Marca: **BD-N/A (nube)** · **local BD-OK**.

**Baseline del módulo:** `returns` = 1 fila (id_return 166) · `pending_transactions` = 0 · `failed_transactions` = 0.

| Verificación | Resultado |
|---|---|
| `returns` fila creada | `co_return=1785423900738.0` · **`id_return=169`** · `st_delivery=**1**` (enviado) · `co_client=AS04` · `na_responsible=QA AUTOMATION` · `nu_seal=PRC-0730` · `id_type=63` · `tx_comment` OK · `co_enterprise=00002` · `nu_attachments=0` · `has_attachments="false"` |
| `return_details` | 1 fila: `co_product=PCE03` · `qu_product=2` · `nu_lote=LOTE-QA-0730` · `co_document=FAC-0730-01` · `id_motive=49` · `co_measure_unit=CJA` · `qu_unit=1` |
| Colas | `pending_transactions=0` · `failed_transactions=0` **tras el envío** ⇒ salió de la cola |
| Duplicados | `count(*)=4` vs `count(DISTINCT co_return)=4` ⇒ **sin duplicados**. Guardar 2 veces el mismo form **actualiza** el mismo `co_return`, no inserta |
| Correlación Ref↔fila | **Nro.Ref UI 169 = `id_return` 169** ✔ (consistente con el patrón confirmado en piercar) |
| POST capturado | `returnservice/return` con cabecera + `details` completos → volcado a `_payloads.jsonl`. `stDelivery=2` en el payload de salida |
| Round-trip §9 (Guardar → reabrir) | **Todo conservado**: cliente, responsable, precinto, comentario, empresa 00002, **Tipo=63 (valor NO-default elegido por el usuario, "cambio conservado")**, y en la línea: Lote, Nro Factura, Cantidad 2, Unidad CAJA, **Motivo 49 (default conservado)**. Sin divergencias |

**Conclusión guardado→enviado:** lo guardado se envió íntegro. **BD-OK (local)** · **BD-N/A (nube — sin GRANT; la llegada la prueba la capa web con Ref 169).**

### Conversiones / montos
**No aplica.** Ni el esquema local (`returns` / `return_details`) ni el payload de `returnservice/return` contienen **ningún campo de monto, precio, tasa ni conversión** — devoluciones no maneja importes en este producto (consistente con `[prc-2606]` `nu_amount=null`). No se construyó oráculo de importes; **no hay superficie donde reproducir los 2 defectos de conversión abiertos hoy**.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **NUNCA remover nodos `ion-alert` del DOM — los alerts son `<ion-alert [isOpen]>` estáticos dentro de `<app-message>`** | **universal (crítico)** | Un "cleanup" tipo `document.querySelectorAll('ion-alert.overlay-hidden').forEach(a=>a.remove())` **destruye permanentemente** el sistema de alerts de toda la app: el componente sigue fijando `alertMessageOpen=true` y `mensaje`, pero **no se renderiza nada** y el `messageService` queda con `showingMessage=true` bloqueado. **No se recupera** ni con `applyChanges` ni toggleando el flag; **sólo relanzando la app**. Contradice en la práctica la vieja receta de "limpiar ion-alert residuales" de `devoluciones.md`. Usar `a.dismiss()`, nunca `.remove()` |
| **Oráculo de alert sin DOM: `ng.getComponent(document.querySelector('app-message'))`** | universal (builds `window.ng=true`) | Expone `header`, `mensaje`, `alertMessageOpen`, `isAlertOpen`, `messageService.showingMessage`. Sirve para **confirmar qué alert disparó la app** aunque el render falle, y para diagnosticar alerts "que no aparecen" |
| **`pg.reload()` NO recupera la app en este build — deja el `ion-router-outlet` VACÍO** | universal (La Tortuga v1.0) | Tras `reload()` la app bootea (`app-message` y `ion-alert` vuelven) pero **nunca rutea**: `ion-router-outlet` con 0 hijos, `location.href='http://localhost/'`, y no se recupera esperando (probado 30 s+). **Recuperación válida:** `adb shell am force-stop` + `monkey ... LAUNCHER` + re-map `adb forward tcp:9220 localabstract:webview_devtools_remote_<nuevoPID>`; el auto-login llega solo a HOME vía `app-synchronization` |
| ✅ **Click REAL en `#clienteSelectModal ion-item` SÍ selecciona el cliente correcto** | cliente (globalmp / La Tortuga v1.0) | Contradice tanto la nota de `_comunes` ("selecciona un cliente vecino") como el quirk de esta corrida ("`setClientfromSelector` no prende"): con `scrollIntoView({block:'center'})` + `pg.mouse.click` en el centro del `ion-item`, el cliente queda exacto (AS04 y CB10, 2/2), el modal cierra y `comp.cliente` + tabs quedan OK. **En DEVOLUCIONES no hizo falta la vía Angular** |
| **globalmp: tipos de devolución = Calidad(60, default) / Cambio X Cambio(63) / PostVenta(52) / Servicio(59)** | cliente | Confirmado contra la tabla local `return_types`. Ratifica que **CxC(63) es exclusivo de globalmp/don-theo/ferrenuestro** |
| **Acordeón producto con `validateReturn=false`: orden de `ion-input`** | universal | idx0 = **Lote** (text, plain, opcional) · idx1 = **Nro Factura** (`inp-write`, text, **requerido**) · idx2 = **Cantidad Devuelta** (`inp-write`, **type=number**). Selects: Unidad (**CAJA/CJA = 4** en globalmp) · Motivo (default **49**). Nro Factura viaja como `coDocument`. 2ª confirmación tras `[ferrenuestro-20260723]` |
| **Guardar es IDEMPOTENTE por `co_return`** | universal | Pulsar Guardar N veces sobre el mismo form **actualiza** la fila, no inserta duplicados (`count(*) == count(DISTINCT co_return)`). Útil como oráculo anti-duplicado |
| **Borrado de Guardado limpia también `return_details`** | universal | Tras ELIMINAR, `returns` y `return_details` del `co_return` quedan en 0 — no deja huérfanos. Sin alert de éxito post-borrado (confirma `[ins-2610][gmp-2611]`) |
| **Tabla local de catálogos de devoluciones** | universal | `return_types` (`id_type`,`na_type`) · `return_motives` (`id_motive`,`na_motive`) · `return_category`; transaccionales `returns` (PK `co_return`) + `return_details` (PK `co_return_detail`). Descubrir con `SELECT name,sql FROM sqlite_master WHERE name LIKE '%return%'` |

## Hallazgos

**Ninguno.** 0 FAIL — el módulo se comportó correctamente en los 14 casos.

### Nota de automatización (NO es defecto de la app)
A mitad del módulo se perdió el render de **todos** los `ion-alert` de la app. **Causa: propia del agente** — una limpieza preventiva de overlays removió del DOM los `<ion-alert>` estáticos que viven dentro de `<app-message>`. Se comprobó por `ng.getComponent('app-message')` que la app **sí** había disparado el alert correcto (`mensaje="¡Su Devolución se ha guardado!"`), y el guardado quedó íntegro en BD local. Se recuperó relanzando la app por adb + re-map del forward CDP; **DM-DEV-016 se re-ejecutó de punta a punta** con el alert observado directamente. Sin impacto en los veredictos. El anti-patrón quedó promovido a `module-selectors/_comunes.md`.

---
*Agente DEVOLUCIONES · globalmp · 2026-07-30 · watchdog `moduleMs` 45 min, 0 cuelgues de CDP, 0 casos BLOCKED*
