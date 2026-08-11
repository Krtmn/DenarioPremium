# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · **tag 20** · `window.ng=TRUE` · `sqlitePlugin` OK |
| Playa / Cliente | EL YAQUE · difranca · vendedor VEND206 (`co_user='206'` / `id_user=275`) |
| **Empresa efectiva** | **DDHP_A12 · `id_enterprise=2`** — verificada en UI, payload, BD local y BD nube |
| Tasa | 752,0900 · local BSD · fuerte US$ (no aplica: devoluciones no maneja montos) |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues de CDP · 0 `TIMEOUT:` · 0 `ABORT-MODULE` |
| Estado final | HOME |

> 🔎 **Fuera del set de casos se encontró 1 defecto nuevo, reproducido y con causa aislada**
> (`DEV-LISTA-ESTATUS-VACIO`, §Hallazgos). No tumba ningún caso del smoke, pero es material de go/no-go.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Tile Devoluciones → `/devoluciones`; botones **DEVOLUCIÓN** y **BUSCAR** visibles (2.882 ms) |
| DM-DEV-002 | ✅ PASS | Form abierto: tabs **Productos/Adjuntos `disabled=true`**, sin cliente; Guardar y Enviar `disabled` |
| DM-DEV-004 | ✅ PASS | CAR755 seleccionado exacto (`idClient=838`, `idEnterprise=2`); **las 3 tabs habilitaron**. Sin campo Factura ⇒ coherente con `validateReturn=false` |
| DM-DEV-006 | ✅ PASS | Responsable / Precinto / Comentario aceptan valor; **Tipo con 3 opciones** en el select |
| DM-DEV-011 | 🚫 N/A | `validateReturn=false` **verificado en el modelo** (`returnLogic.validateReturn===false`) y **`ion-input#invoiceSelect` no existe en el DOM** (no es que esté oculto: `querySelector` devuelve `null`). Sin selector de factura no hay caso |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familias inline (7) → BBK → **ACBA300U**; acordeón creado con Lote / Nro Factura / Fecha Venc / Cantidad / Unidad / Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad = 2 → **Enviar pasó de `disabled=true` a `false` en el mismo tick** (medición del par antes/después) |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos con **3 acordeones**: `images` (BUSCAR FOTO / TOMAR FOTO), `file` (Subir Archivo, por `userCanUploadFiles=true`), `sign` (Firma + canvas 280×220, por `signatureReturn=true`) |
| DM-DEV-016 | ✅ PASS | Alert `Denario Devolución` / **«¡Su Devolución se ha guardado!»** · botón `[OK]`. Local: `st_delivery=3`, `id_return=0` (**BD-SAVED**) |
| DM-DEV-018 | ✅ PASS | 2 alertas: `[Cancelar/**Aceptar**]` «¿Desea enviar la devolución?» → `[**OK**]` «¡Su Devolución será enviada!». Navega al home del módulo. **Nro.Ref 878 · BD-OK** |
| DM-DEV-019 | ✅ PASS | Lista con **Nro.Ref / Cliente / Estatus / Fecha**; la devolución creada aparece correctamente (primero «Por Enviar» Ref 0, luego «Enviado» Ref 878) |
| DM-DEV-021 | ✅ PASS | Searchbar «JAKE» filtra en tiempo real **5 → 1**; al limpiar vuelve a 5. Trash **solo** en el ítem Guardado |
| DM-DEV-022 | ✅ PASS *(2 intentos)* | Guardada reabierta: **editable** (`readonly=false`, `disabled=false`), 3 tabs accesibles, **todos los valores precargados** (cliente, responsable, comentario, empresa, tipo, y las 2 líneas con lote/factura/cantidad). 1.er click interceptado por `ion-backdrop` transitorio → reintento OK |
| DM-DEV-024 | ✅ PASS | Trash → alert `[Cancelar/**Eliminar**]` → **desaparece de la lista**; en BD local `returns`=0 **y** `return_details`=0 para ese `co_return` (sin detalles huérfanos). Sin alert de éxito post-borrado (consistente con insumar/globalmp) |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **878** | `co_return 1786124238721.0` · CAR755 MULTIDISTRIBUIDORA JAKE (id 838) · **DDHP_A12 / id_enterprise 2** · Tipo Calidad (60) · Responsable «QA Automatizacion» · Precinto PRE-DEV-001 · 1 línea: ACBA300U ×2 UND, **lote `LOTE-QA-2026`**, **vencimiento `2027-03-15`**, factura `5000098151`, motivo 50 | **Enviado · BD-OK** |
| — | `co_return 1786124736559.0` · CAR755 · 2 líneas (ACBA300U ×3 / ACBBKRI300U ×1) con **2 facturas distintas** | Guardado → **ELIMINADO** en DM-DEV-024 |

---

## Verificación BD

**Baseline (nube, inicio):** `return` 794 filas / `max(id_return)=877` · `return_detail` 1.787 / `max(co_detail)=1816`.
**Diff al cierre:** exactamente **+1 fila** en `return` (id 878) y **+1** en `return_detail` (co_detail 1817). Cero filas inesperadas.

### Cabecera — `return` id 878 (nube) ↔ local ↔ payload

| Campo | Nube | Local (`returns`) | Payload | Veredicto |
|---|---|---|---|---|
| `co_return` | 1786124238721.0 | 1786124238721.0 | 1786124238721.0 | ✅ |
| `st_return` | 1 → `transaction_statuses.co_status='env'` | — | 0 (pre-envío) | ✅ Enviado |
| `co_client` / `na_client` | CAR755 / MULTIDISTRIBUIDORA JAKE, C.A | — | CAR755 / idClient 838 | ✅ |
| **`co_enterprise` / `id_enterprise`** | **DDHP_A12 / 2** | DDHP_A12 | DDHP_A12 / 2 | ✅ **empresa correcta** |
| `na_responsible` | QA Automatizacion | QA Automatizacion | QA Automatizacion | ✅ |
| `nu_seal` | PRE-DEV-001 | PRE-DEV-001 | PRE-DEV-001 | ✅ |
| `id_type` | 60 (Calidad) | 60 | 60 | ✅ |
| `tx_description` ↔ `tx_comment` | Test-DEV-SMOKE difranca tag20 | idem | idem | ✅ (fieldMap conocido) |
| `nu_amount` | `null` | — | — | ✅ esperado (§ devoluciones no maneja montos) |
| vendedor | — | — | `coUser:"206"` / `idUser:275` | ✅ |

### Detalle — `return_detail` co_detail 1817

| Campo | Nube | Local | Payload |
|---|---|---|---|
| `co_product` | ACBA300U | ACBA300U | ACBA300U |
| `qu_product` | 2.0000 | 2 | 2 |
| **`nu_lote`** | **LOTE-QA-2026** | LOTE-QA-2026 | LOTE-QA-2026 |
| **`da_duedate`** | **2027-03-15**T04:00:00Z | 2027-03-15 | 2027-03-15 |
| `co_document` | 5000098151 | 5000098151 | 5000098151 |
| `id_motive` | 50 | 50 | 50 |
| `co_measure_unit` | UND | UND | UND |

⇒ **BD-FIELD-OK**: cabecera 10/10 + detalle 7/7. La hora de `da_duedate` difiere por zona (UTC-4 vs UTC) — **nota, no mismatch**, por RUNTIME §10.b.

### Estado guardado → enviado

| Momento | `st_delivery` | `id_return` | `pending_transactions` |
|---|---|---|---|
| Tras Guardar | **3** (Guardado) | 0 | 0 |
| Tras Enviar (inmediato) | **2** (en cola) | 0 | **1** |
| ~12 min después | **1** (Enviado) | **878** | **0** |

- `failed_transactions` (type='return') = **0** · duplicados: `count(*)=5 == count(DISTINCT co_return)=5` ⇒ **sin duplicados**.
- Payload `returnservice/return` capturado **1 sola vez** vía `__qaH.getPayloadData()` (hook heredado del agente LOGIN, sin reinstalar) — **sin duplicación de wrapper**.

> ⚠ **La sync NO fue inmediata en esta corrida: tardó entre 5 y 12 minutos.** La devolución quedó `st_delivery=2` / «Por Enviar» / Ref 0 durante los 3 primeros polls de nube (t≈1, 4 y 8 min, todos `[]`) y apareció recién en el 2.º baseline-diff al cierre. **Contrasta con dm-electronica y alipascua (El Yaque, sync inmediata)** y se parece al patrón diferido de ferrenuestro-Isla Coche. **No marcar BD-SAVED como no-persistencia en El Yaque sin un 2.º pase de baseline-diff al cierre.**

---

## Verificación de VGs

| VG | Valor del perfil | Lo que hizo la app | Veredicto |
|---|---|---|---|
| **`expirationBatch`** | `true` ⚠️VERIFICAR | Lote y Fecha Venc. **se renderizan siempre** pero **NO son obligatorios**: con ambos vacíos y solo la cantidad cargada, **Enviar habilitó** (`disabled` true→false medido). Llenados a mano, ambos **viajan íntegros** a payload y nube | ✅ **Confirmada — alcance por módulo.** Ratifica el_palmar: obligatorio en INVENTARIOS, **opcional en DEVOLUCIONES**. Como en difranca inventarios está apagado, **este es el único punto de lectura de la VG y queda resuelto: no bloquea nada** |
| `requeridedNroFactura` | `false` ⚠️VERIFICAR | `returnLogic.requeridedNroFactura === false` en el modelo; el `ion-input` «Nro Factura» llega **`required=false`** y **sin `ng-invalid`**; se envió con él lleno y también habilitaba vacío | ✅ **Confirmada** (≠ el_palmar) |
| `validateReturn` | `false` | `returnLogic.validateReturn === false`; **no existe** `ion-input#invoiceSelect`; las tabs habilitan con solo elegir cliente; el Nro. Factura va por producto y viaja como `coDocument` | ✅ **Confirmada** |
| `multiInvoices` | `false` | ⚠ **La app aceptó 2 facturas distintas** (`5000098151` y `5000096909`) en la misma devolución, en 2 líneas, **sin alerta**, y las persistió en local | ⚠ **Ver Observaciones** — la VG **no se hace cumplir** en este modo |
| `signatureReturn` | `true` | Acordeón `sign` presente con canvas 280×220. **Se envió SIN firma** y el POST viajó con `nuAttachments:0` / `hasAttachments:"false"` | ✅ Correcto — RUNTIME §5: habilitar la firma **no** la vuelve obligatoria. **No es defecto** |
| `userCanUploadFiles` | `true` | Acordeón `file` («Subir Archivo») presente, además del de Imágenes con **BUSCAR FOTO** y **TOMAR FOTO** | ✅ **Confirmada** — el control existe (≠ el_palmar, donde la VG decía true y no había botón) |
| `enterpriseEnabled` | `true` (3 empresas) | 1 solo `ion-select` de empresa, **preseleccionado en DDHP_A12**, `ng-valid` | ✅ (ver §Patrones) |

### Catálogos — el filtro de borrados funciona

| Catálogo | BD nube (activos) | App | Veredicto |
|---|---|---|---|
| Tipos de devolución (`return_type`) | **3**: 52 PostVenta · 59 Servicio · 60 Calidad | `returnTypes.length === 3`; select con exactamente **Calidad (60, default) / PostVenta (52) / Servicio (59)** | ✅ **Ningún `co_operation='D'` se coló** (no aparecieron «prueba», «hola», «Prueba Tovar», «problemas», «Despacho») |
| Motivos (`return_motive`) | **24** | `returnMotives.length === 24`, ids 34-59, default **49** | ✅ exacto |
| Familias de producto | 450 activos en DDHP_A12 | 7 familias cuyos badges suman **1+16+114+4+118+185+12 = 450** | ✅ exacto |
| Clientes del vendedor | 148 en DDHP_A12 | `selectorCliente.clientes.length === 148` | ✅ exacto |

---

## Hallazgos

### 🔴 `DEV-LISTA-ESTATUS-VACIO` — la lista BUSCAR muestra el **Estatus en blanco** en las devoluciones sincronizadas *(defecto NUEVO, no está en `defectos-conocidos.yaml`)*

**Síntoma.** En la lista de BUSCAR, **3 de las 6** devoluciones muestran `Estatus:` seguido de nada:

```
Nro. Ref: 878  CAR755 - MULTIDISTRIBUIDORA JAKE   Estatus: Enviado      Fecha: 07/08/2026
Nro. Ref: 877  CAR003 - DISTRIBUIDORA LOS MOROCHOS Estatus: Enviado     Fecha: 07/08/2026
Nro. Ref: 867  COJ149 - COMERCIAL DIAMANTE 2022    Estatus:  (vacío)    Fecha: 23/07/2026
Nro. Ref: 865  CAR747 - BUENOS ESTILOS             Estatus:  (vacío)    Fecha: 20/07/2026
Nro. Ref: 857  CAR285 - CORPORACION LA FORTUNA     Estatus:  (vacío)    Fecha: 16/07/2026
```

Las tres filas en blanco tienen `st_return=1` en la BD local — **sí tienen estatus**, simplemente no se pinta.

**Causa aislada (prueba directa, no inferencia).** En `returnLogic.itemReturns`, el campo `naStatus` llega con **dos formas distintas**:

- las filas que se ven bien → `naStatus` es un **objeto**: `{id_return: 877, na_status: "Enviado", tx_comment: null}`
- las filas en blanco → `naStatus` es un **string** plano: `"Enviado"`

La plantilla lee `naStatus.na_status`; sobre un string eso es `undefined` ⇒ celda vacía. **Comprobado en vivo**: al envolver el `naStatus` del ítem 867 en `{na_status:'Enviado'}` y hacer `applyChanges`, la fila pasó de vacía a **«Enviado»** en el mismo render, y al restaurar el string volvió a quedar vacía.

```
estatus antes    : ["Por Enviar", "Enviado", "",        "", ""]
estatus después  : ["Por Enviar", "Enviado", "Enviado", "", ""]   ← solo se tocó el ítem 867
```

**Impacto para difranca.** Medio. El vendedor **no ve el estado de sus devoluciones históricas** — justo las que ya no puede editar. Es cosmético (no corrompe datos, no bloquea el flujo) pero degrada la lista, y difranca **usa el módulo** (794 devoluciones en BD). Afecta a las devoluciones que bajan por sincronización, o sea a **casi todas** después de un tiempo: la de hoy se ve bien porque se creó en esta sesión.

**Reproducción:** Devoluciones → BUSCAR → observar cualquier devolución de días anteriores.

### ⚠ Observación — `multiInvoices=false` no se hace cumplir *(no se marca FAIL)*

Con `multiInvoices=false` se cargaron **dos productos con dos números de factura distintos** (`5000098151` y `5000096909`) en la misma devolución: la app **no mostró ninguna alerta**, dejó Guardar y Enviar habilitados y persistió ambos `co_document` en `return_details`.

**Por qué no se marca FAIL:** con `validateReturn=false` **no existe selector de factura de cabecera** — el Nro. Factura es un campo de texto libre por línea, sin validación de ningún tipo. Lo más probable es que `multiInvoices` solo gobierne el selector de facturas que aparece cuando `validateReturn=true`, es decir que **la VG no tenga alcance en este modo**. Queda como dato para la QA: **hoy, en difranca, nada impide mezclar facturas en una devolución.** Si la intención del negocio es que `multiInvoices=false` lo impida, entonces sí es un defecto de alcance de VG.

### ℹ Defectos conocidos de la 20 — contraste

| Defecto conocido | ¿Apareció? |
|---|---|
| `INV-WEB-SIN-LOTE-VENCIMIENTO` | **No aplica** — es de inventarios (módulo apagado por `clientStock=false`, no se corrió). ⚠ Nota lateral: **el tile «Inventarios» SÍ aparece en HOME**, dato relevante para quien evalúe esa VG |
| Resto del listado de la 20 | **Ninguno reprodujo en devoluciones.** No hubo crash de app, ni pérdida de registro, ni error de conversión (el módulo no maneja montos) |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **Selector de empresa en DEVOLUCIONES con 3 empresas: preseleccionado y correcto** | universal *(3.ª confirmación)* | 1 solo `ion-select` visible, **sin `formcontrolname`**, `disabled=false`, `ng-valid`, y `value` = **objeto empresa completo** (`{idEnterprise:2, coEnterprise:"DDHP_A12", lbEnterprise:"*DISTRIBUIDORA DIAZ", coCurrencyDefault:"US$", prioritySelection:0, enterpriseDefault:"true"}`). **La receta de CLIENTES (`s.value=<number>`+`ionChange`) NO aplica ni hace falta.** Confirma la tabla de 4 variantes de `_comunes.md` ahora también **con 3 empresas y en El Yaque** |
| 🔴 **`co_operation='D'` NO llega al dispositivo, 2.ª confirmación (ahora en catálogos, no solo empresas)** | universal | `return_types`=3 y `return_motives`=24 en el modelo Angular, exactamente los activos de BD. Los 5 tipos basura borrados no aparecen. El filtro es de **sincronización**, no de UI |
| 🔴 **`returnLogic.naStatus` tiene DOS formas (objeto vs string) y la plantilla solo sabe leer una** | universal *(defecto)* | Ver §Hallazgos. **Oráculo barato para cualquier módulo con lista de estatus: comparar `typeof item.naStatus`** antes de culpar al render |
| **`returnLogic.productList` está VACÍO aunque la lista de productos se vea en pantalla** | universal | Tras entrar a una familia, `productList.length===0` mientras el DOM ya tiene 50 `ion-item`. **Buscar el producto en el DOM (`Código: <cod>`), no en el modelo.** Refina la nota de alipascua |
| ⚠ **Regex de código de producto: anclar el final** | universal | `Código: ACBA300U` matchea también `ACBA300UX12`. Usar `Código: <cod>(?![0-9A-Z])` o el ítem correcto queda a un renglón de distancia |
| **`#clienteSelectModal` NO persistió la lista paginada entre aperturas** | **cliente** | Contradice alipascua y el_palmar (donde persistía). Acá la 2.ª apertura volvió a 50 y hubo que repaginar (`scrollDisable` como condición de corte es más fiable que comparar `length`). **Paginar siempre, no asumir que ya está cargada** |
| **`onIonInfinite` necesita ~800-900 ms por vuelta** | universal | Con 350 ms el bucle corta antes de tiempo y devuelve 50 de 148 (parece que el cliente «no existe»). Cortar por **`sc.scrollDisable===true`**, no por «el length dejó de crecer» |
| **Campos del acordeón de producto se localizan por `ion-input.label`** | universal | `Lote` / `Nro Factura` / `Cantidad Devuelta` — más estable que el índice o que `.inp-write` (que **cambia de clase** al editar). **Se pueden llenar con el acordeón colapsado**: no hace falta expandirlo |
| **Fecha de vencimiento — receta completa** | universal *(2.ª confirmación)* | `ion-button.letrasFechasButton` → `ion-modal.fechasModal` → `ion-datetime#fechaVence0` (existe siempre con `offsetParent=null`) → `dt.value='YYYY-MM-DD'` + `ionChange` → `dt.shadowRoot.querySelector('#confirm-button')` (**rotula «Aceptar»**) → `mouse.click`. El botón **rotula la fecha elegida** (`15/3/2027`) y sirve de oráculo visual |
| **Reparto de etiquetas de alert medido en este módulo** | cliente | Guardado `[OK]` · Envío `[Cancelar/**Aceptar**]` → `[**OK**]` · Borrado `[Cancelar/**Eliminar**]` · Dirty-guard `[Guardar y salir / **Salir sin guardar** / Cancelar]`. **Los 8 alerts del módulo se resolvieron sin un solo reintento** recorriendo etiquetas por **igualdad exacta case-insensitive** filtrando `width>0`. ⚠ Acá NO vinieron en mayúsculas (contrasta con lo observado en PEDIDOS de esta misma corrida) ⇒ **comparar siempre en minúsculas** |
| ⚠ **Envío = solo 2 alertas, no 3** | cliente | No apareció el 3.er alert «Devolución nro. X enviada exitosamente» de romher/insumar. Variante de cliente, **no defecto** |
| **La lista BUSCAR OCULTA los botones DEVOLUCIÓN/BUSCAR** | universal *(4.ª confirmación)* | Como piercar / alipascua / el_palmar; contrasta dm-electronica. Back al home del módulo antes de crear otra. `clickBack` (`img.fechaAtras`→`closest('a')`, filtrando `width>0`, coords ≈32,47) **funciona** en form, lista y home; no hizo falta `ionBackButton` |
| **Trash solo en «Guardado», tampoco en «Por Enviar»** | universal *(2.ª confirmación tras ferrenuestro)* | Medido con los dos estados **simultáneamente en pantalla**: `trash` por ítem = `[1,0,0,0,0,0]` con el Guardado 1.º y el «Por Enviar» 2.º |
| **`ion-backdrop` transitorio intercepta el 1.er click en la lista** | universal | `elementFromPoint` devolvió `ION-BACKDROP` con **0 loadings visibles y 0 backdrops huérfanos**. Se auto-resolvió esperando ~2,5 s (variante ya documentada en el_palmar). **Diagnosticar con `elementFromPoint`, esperar y reintentar — no remover nada** |
| **Eliminar un Guardado limpia `returns` Y `return_details`** | universal *(2.ª confirmación tras globalmp)* | `count(*)=0` en ambas tablas para ese `co_return`; sin detalles huérfanos |
| ⚠ **Sync a nube DIFERIDA en El Yaque (5-12 min)** | cliente / servidor | Contrasta con dm-electronica y alipascua (El Yaque, inmediata). **Obliga al 2.º baseline-diff al cierre** |

> ✅ consolidado 2026-08-07

---

## Notas de automatización

- Hook de payload: se **consumió** `__qaH.getPayloadData()` heredado del agente LOGIN, **sin reinstalar** el bundle → el POST `returnservice/return` quedó capturado **1 sola vez y con `data` completo**. Namespace propio `window.__qaD` para las skills del módulo (recta graduada de `[alipascua-20260804]`, 3.ª aplicación).
- `page.__qa` (prelude cacheado del lado Playwright) **persistió las 20 llamadas** de este módulo, sin necesidad de reinlinar.
- `JSON.stringify` de `returnLogic` **no se intentó** (revienta por estructura circular: `returnValid*` son `Subject` de RxJS). Se serializaron solo campos planos, como indica `_comunes.md`.

---

*Módulo DEVOLUCIONES · 13 PASS / 0 FAIL / 1 N/A · 1 devolución enviada (Ref 878, BD-OK) · 1 defecto nuevo · 0 cuelgues*
