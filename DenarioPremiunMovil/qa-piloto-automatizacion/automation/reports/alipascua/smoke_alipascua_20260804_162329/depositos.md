# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | EL YAQUE (`denarioelyaque.ddns.net:8081`) |
| Empresa / usuario | ALIPASCUA, C.A. (`ALIP_BSD`, id_enterprise=2) · coUser 002 / idUser 468 |
| `modules.depositos.aplica` | **true — CONFIRMADO EN UI** (16 cobros depositables con dato vivo) |
| Resultado | **11 PASS · 1 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Tile Depósitos → `/depositos` con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | Form abre con Empresa (disabled, ALIPASCUA), Moneda BSD, Banco, Nro. Plantilla, Comentario, Fecha Depósito (idx 0, disabled) y Fecha Doc (idx 1). Tabs Cobros/Total/Adjuntos **disabled** y Guardar/Enviar **disabled** sin datos ✅ |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` → 7 cuentas BSD. Elegido **BANCO PROVINCIAL 0108** (idBankAccount 5) → cuenta autollenada `01080074950100315495`; tabs pasan a habilitadas |
| DM-DEP-005 | ✅ PASS | Fecha Doc (`letrasFechasButton` idx 1) → modal `ion-datetime presentation=date` ya cargado con hoy → `dt.value='2026-08-04'` + `ionChange` + click **Aceptar** (shadowRoot) → cierra y muestra `4/8/2026` |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `DEP-QA-0804` + 1 cobro marcado en Tab Cobros → **Guardar y Enviar habilitan**. (No hay campo Monto libre: el monto lo deriva el cobro seleccionado) |
| DM-DEP-009 | ✅ PASS | Guardar → alert **"Denario Depósito — El Depósito se ha guardado"** [Aceptar]; aparece en BUSCAR como *Nro Ref: 0 · Estatus: Guardado · 5000.0000 BSD* |
| DM-DEP-010 | ✅ PASS | BUSCAR renderizó la lista **limpia** (2 ítems, 0 `ion-spinner`, 0 `ion-loading`) → **el defecto conocido NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Click en el Guardado reabre el form con **todos** los datos (banco 0108 + cuenta, Nro. Plantilla `DEP-QA-0804`, moneda BSD, empresa, Fecha Doc 4/8/2026), editable, con Guardar/Enviar activos — round-trip §9 OK |
| DM-DEP-017 | ❌ **FAIL** | Enviar → 2 alertas correctas, pero el depósito **queda "Por Enviar" (Ref 0) indefinidamente**: 0 POST a `depositservice/deposit` en ~12 min, `pending_transactions` con `type='deposit'`, nube sin fila nueva. Ver **H1** |
| DM-DEP-018 | ✅ PASS | BUSCAR tras guardar/enviar renderizó bien en **3 accesos consecutivos** → **defecto conocido NO reprodujo** |
| DM-DEP-019 | ✅ PASS | El Enviado (Ref 1) abre **solo lectura**: los 3 `ion-input` y los 3 `ion-select` `disabled=true`, ambas fechas `disabled`, **sin** Guardar/Enviar, **sin** trash, y **la tab Cobros desaparece** (quedan General/Total/Adjuntos) |
| DM-DEP-020 | ✅ PASS | Trash del Guardado → alert **"¿Desea eliminar el depósito seleccionado?"** [Cancelar/Aceptar] → confirmado → **el ítem desaparece** de la lista (3 → 2 ítems) |

---

## Registros creados en sistema

| Ref (UI) | `co_deposit` (epoch) | Detalle | Estado | Marca BD |
|----------|----------------------|---------|--------|----------|
| **0** (sin Ref de servidor) | `1785891222034.0` | Banco **0108 BANCO PROVINCIAL** · cuenta `01080074950100315495` · Nro. Plantilla `DEP-QA-0804` · Fecha Doc 04/08/2026 · **5.000,0000 BSD** · cobro vinculado **id_collection 39236** (MICROEMPRESA ORINOCO, porción efectivo de un cobro de 185.000) | **Por Enviar** (no llegó a la nube) | **BD-QUEUED** |
| — | `1785891571xxx` (borrado) | Banco **0191 BCO NACIONAL DE CREDITO** · Nro. Plantilla `DEP-QA-0804-B` · **75.404,37 BSD** · cobro id_collection 34021 | **Eliminado** (consumido por DM-DEP-020) | n/a |

> El `deposit` **id=1** que ya estaba en la nube (banco 0134 BANESCO, 600.000 BSD, 20:02) **no lo creó este módulo** — es previo (QA a mano). Se usó como baseline y como ítem "Enviado" para DM-DEP-019.

---

## Verificación BD

**Baseline (nube, inicio del módulo):** `deposit` count=1 · max(`id_deposit`)=1.
**Cierre (nube, tras Enviar + 12 min + Sincronizar manual):** count=**1** · max=**1** → **sin fila nueva**.

**Local (vía `window.sqlitePlugin`; `local-query.js`/`sqlite3` no existe en este device):**

| Tabla | Fila | Lectura |
|-------|------|---------|
| `deposits` | `co_deposit=1785891222034.0` | `id_deposit=0` · **`st_delivery=2`** · `nu_amount_doc=5000` · `co_bank='0108'` · `nu_document='DEP-QA-0804'` · `da_document='2026-08-04'` ✅ todo cuadra con la UI |
| `deposit_collects` | `co_deposit=1785891222034.0` | ↔ `co_collection=1785872536618.0` / **`id_collection=39236`** · `nu_total_deposit=5000` ✅ vínculo correcto |
| `pending_transactions` | `co_transaction=1785891222034.0` | **`type='deposit'` — sigue en cola** |
| `failed_transactions` | — | **0** (no fue rechazado: nunca se intentó) |

**Conclusión guardado→enviado: NO.** El depósito se guardó bien y se encoló bien, pero **nunca se despachó**. Marca **BD-QUEUED**.

**Conversión / aritmética (multiCurrency, tasa 746,6297):** el depósito es BSD (moneda local) y su monto (5.000) es la **porción en efectivo** del cobro 39236, no una conversión — no hubo operación de conversión que verificar en este registro. Como control se revisó la fila nube preexistente id=1: `nu_amount_doc` 600.000 BSD → `nu_amount_doc_conversion` 803,6112, y 600.000 / 746,6297 = **803,6110** (Δ 0,0002 por redondeo a 4 decimales) ⇒ **dirección correcta (BSD→US$ divide)**. **No** se reproduce acá el defecto de dirección detectado en cobros.

**Captura de payload:** ⚠ **el hook NO capturó ningún POST a `depositservice/deposit` — porque nunca hubo POST.** No es un gap del hook: el mismo hook capturó 305 POST en la sesión (`syncservice` 246, `clientstockservice` 56, `orderservice` 1, `returnservice` 1, `potentialclientservice` 1). **No se anexó ninguna línea a `_payloads.jsonl`** por este módulo, y el `_bd-manifest.jsonl` lleva la línea con `"ref":null`.

**GPS:** sin problemas. `userMustActivateGPS=true` y no hubo ninguna alerta ni bloqueo por GPS; el depósito local no expone campo de coordenada, pero la fila nube preexistente sí trae `coordenada` poblada.

---

## Hallazgos

### H1 · 🔴 S2 — El depósito Enviado nunca sale del dispositivo: queda "Por Enviar" y no se postea (`BD-QUEUED`)

**Qué pasa.** Con el flujo de envío completo y correcto (2 alertas: *"Denario Depósito — El Depósito será enviado"* [Cancelar/**Aceptar**] → *"Denario Premium — El Depósito será enviado"* [**OK**]), el depósito **no pasa a Enviado**: la lista lo muestra **"Por Enviar" con Nro Ref 0**, y así sigue tras ~12 minutos y tras un **Sincronizar manual** desde HOME.

**Evidencia (inequívoca, no es lentitud de sync).**
- **0** POST a `depositservice/deposit` capturados por el hook en toda la sesión (305 POST capturados de otros servicios en el mismo período) ⇒ el POST **no se intentó nunca**, no es que fallara.
- Local: `deposits.id_deposit=0`, **`st_delivery=2`**, presente en `pending_transactions` con `type='deposit'`, y **ausente** de `failed_transactions` (no fue rechazado por el servidor).
- Nube: `deposit` sigue en count=1 / max(id)=1 (baseline sin cambios).
- **No es sync diferida global de este build**: en esta misma corrida y con el mismo dispositivo, cobros (`id_collection` 39236-39239), pedido, devolución e inventario (`id_client_stock=5`) **sí llegaron a la nube de inmediato**.

**Contexto — relación con el pendiente atascado que reportó INVENTARIOS.** La cola arrastra desde antes de la corrida un pendiente `clientStock` (`co_transaction=1785872185773.0`) que **ya está en la nube** (`id_client_stock=4`) pero quedó en `st_delivery=2` y se re-postea sin fin (**56 POST** idénticos capturados). Mi depósito quedó **exactamente en el mismo estado `st_delivery=2`**. Sin embargo, ese pendiente **no bloquea la cola entera** (los envíos de los demás módulos pasaron por encima de él), así que la falta de despacho del `deposit` **no se explica solo por bloqueo de cabecera**: el tipo `deposit` no se dispatchea.

**Impacto.** Un depósito que el usuario dio por enviado **no llega al administrativo** y **no tiene remedio desde la UI** (reenviar no es posible: el ítem "Por Enviar" ya no ofrece botones ni trash). Además **consume el cobro del pool de depositables** (el cobro 39236 desapareció de la Tab Cobros del siguiente depósito) ⇒ ese cobro queda **inmovilizado**: ni depositado en la nube, ni disponible para volver a depositarse.

**Para desarrollo.** Revisar el dispatch de `AutoSendService` para `type='deposit'` y el ACK que debería cerrar el pendiente cuando la transacción queda en `st_delivery=2` (mismo síntoma que el `clientStock` huérfano). Reproducción: crear depósito → Guardar → Enviar → observar `pending_transactions` y la ausencia de POST a `depositservice/deposit`.

> ⚠ El **formulario** de depósitos no tiene defecto: guarda, relee, valida, borra y liga el cobro correctamente (11 de 12 casos PASS). El fallo es del **transporte de salida**.

---

## Defecto conocido DM-DEP-018/019/020 (`deposit.service.ts`) — **NO REPRODUJO**

La lista `app-deposito-list` renderizó **limpia en los 3 accesos** de este módulo (tras guardar el 1.º, tras enviar, y tras guardar el 2.º): 2-3 ítems visibles, **0 `ion-spinner`**, **0 `ion-loading`**, sin *"Por favor espere…"* colgado. Confirma que el bug sigue siendo **intermitente** (como en `el_valle-20260728` y `latino_cosmetica-20260729`); en El Yaque v1.0 / alipascua **no se manifestó**.

---

## Verificación de VGs

| VG | Esperado | Observado en UI |
|----|----------|-----------------|
| `signatureDeposit: true` | se **puede** firmar, no obligatorio | El depósito se envió **sin firma** sin ninguna alerta ⇒ correcto (RUNTIME §5), no es hallazgo |
| `requiredComment: true` / `longitudComentario: 200` | comentario obligatorio donde exista el campo | ⚠ **NO aplica a depósitos**: el `ion-input` "Comentario:" existe y quedó **vacío**, y aun así Guardar y Enviar habilitaron y el depósito se guardó. Mismo resultado que en inventarios ⇒ estas VGs gobiernan **cobros/pedidos**, no depósitos. **No es incumplimiento** |
| `multiCurrency: true` · `enabledManualRate: false` | selector de moneda, tasa no editable | Selector Moneda presente (BSD por defecto, `coCurrency` BSD/id 1); sin campo de tasa editable ✅ |
| `userCanUploadFiles` / `showCamera` / `quAttach: 25` | tab Adjuntos disponible | Tab **Adjuntos** presente y habilitada tras Banco+Fecha. **No** se exigió adjunto para Enviar (el envío avanzó sin adjunto) ⇒ no hizo falta dejar nada en Guardado por adjunto obligatorio |
| `userMustActivateGPS: true` | exige GPS | Sin alertas ni bloqueos de GPS en todo el módulo ✅ |
| `enterpriseEnabled: false` | 1 sola empresa | `ion-select` de Empresa **disabled** con ALIPASCUA (`ALIP_BSD`) preasignada ✅ |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **El Yaque v1.0 (alipascua): envío de depósito = 2 alertas** | cliente/servidor | (1) *"Denario Depósito — El Depósito será enviado"* [Cancelar/**Aceptar**] → (2) *"Denario Premium — El Depósito será enviado"* [**OK**]. **No** hay 3.ª alerta *"Depósito nro. N enviado exitosamente"* — coherente con que el envío nunca se despachó (H1). Contrasta con jerez/latino/ferrenuestro-La Tortuga (3 alertas) |
| **`deposits` (local) se queda en `st_delivery=2`** | universal | Estado intermedio (ni 1=enviado ni 3=guardado) que acompaña al pendiente que nunca cierra. **`st_delivery=2` ⇒ leer siempre `pending_transactions` antes de dar un envío por bueno** (mismo síntoma en `client_stocks`) |
| **La Tab Cobros consume el pool aunque el depósito NO se envíe** | universal | Basta con **Guardar** el depósito para que su cobro desaparezca de la Tab Cobros del depósito siguiente (16 → 15 depositables, y el 39236 dejó de figurar). Planificar: cada depósito guardado **inmoviliza** su cobro |
| **Depósito Enviado: la tab Cobros DESAPARECE** | universal | Confirma `[latino_cosmetica-20260729]` en El Yaque v1.0: quedan General/Total/Adjuntos, todos los `ion-input`/`ion-select` `disabled=true` (no solo readonly), fechas `disabled`, sin `.imagenGuardar`/`.imagenEnviar` ni `ion-button[color=danger]` |
| **El alert de borrado de depósito es [Cancelar/`Aceptar`], NO "Eliminar"** | cliente | *"¿Desea eliminar el depósito seleccionado?"*. Amplía la nota de etiquetas mixtas: en este build el orden de preferencia que funciona es **`aceptar` → `ok` → `eliminar`**, siempre por igualdad exacta |
| **El alert de guardado usa "Aceptar" (no "OK")** | cliente | *"Denario Depósito — El Depósito se ha guardado"* [**Aceptar**] — refuerza que las etiquetas son **mixtas dentro del mismo build**: informativos de envío "OK", pero guardado/borrado "Aceptar" |
| **Sin campo Monto libre (confirmado en El Yaque v1.0)** | universal | El monto lo deriva la Tab Cobros; Tab Total muestra *"Monto total depositado N BSD"*. `DM-DEP-006` se satisface con **Nro. Plantilla + selección de cobro** |
| **Checkbox de cobro: ordenar por `y` y clickear el centro del `ion-checkbox`** | universal | Confirma `[rom-2606]`: `elementFromPoint` cae en `ION-CHECKBOX` con coords ≈(34, primera fila). Filtrar por `width>0` |
| **7 cuentas bancarias BSD (alipascua)** | cliente | idBankAccount **5** = 0108 BANCO PROVINCIAL (`01080074950100315495`) · **7** = 0134 BANESCO · **10** = 0191 BCO NACIONAL DE CREDITO · **1-4** = "PROVEEDOR *" (0021-0024, no son bancos reales). Asignar `sel.value = <option.value>` + `ionChange` funciona sin popover |
| **`page.__qa` heredado entre agentes** | universal | El módulo entero corrió reusando `page.__qa` (connectCdp/makeWatchdog/waitSyncOverlay) que dejó el agente anterior, y un namespace propio `window.__qaD` para las skills DOM. ~40 líneas menos por llamada, 0 conflictos |

---

## Watchdog

0 `TIMEOUT:` · 0 `CDP-DOWN:` · 0 `ABORT-MODULE:`. Módulo completo dentro del techo de 45 min.
