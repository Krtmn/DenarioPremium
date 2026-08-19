# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente | `run_vzla` |
| Empresa | `FERRE_N` / `id_enterprise=1` · rótulo UI **`CORPORACION FERRE 19`** (`lb_enterprise`) |
| App | `com.kiberno.denarioPremiumPro` · v**1.0** / db**19** · `window.ng=true` · `sqlitePlugin` disponible |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` · 360 × 744 |
| Playa | **LA TORTUGA** — `http://denariolatortuga.ddns.net:8081/PremiumWS/services/returnservice/return` (host del POST capturado por el hook) |
| Usuario QA | `***` / `***` · `id_user 470` · `co_user '000208'` |
| Cliente de prueba | `006831` FERRETERIA EPA, C.A (`id_client=4163`) |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=45 min`, `page` pasado · **0 cuelgues**, 0 `TIMEOUT:`, 0 `CDP-DOWN:` |
| Hook de payload | heredado y **vivo** (`__qaDataHook=true`, 62 payloads al arrancar) · **NO se reinstaló** |
| Namespace propio | `window.__qaDEV` (11 skills) — sin tocar `__qaH` / `__qaCLI` / `__qaPED` |

### VGs del módulo — leídas EN VIVO de `returnLogic`, no del dump

| VG | Perfil | Medido en el dispositivo | Efecto observado |
|---|---|---|---|
| `validateReturn` | `false` | **`false`** ✅ | sin `ion-input#invoiceSelect` en cabecera; `invoices=[]`; el Nro. Factura va **por producto** |
| `requeridedNroFactura` | `true` | **`true`** ✅ | `ion-input` "Nro Factura" llega `required=true` + `ng-invalid` |
| `multiInvoices` | `true` | **no existe como propiedad** de `returnLogic` (45 claves) ni de `globalConfig.variables` (vacío) | se midió **por comportamiento** — ver sección dedicada |
| `bloquearFactura` | — | **`false`** | ninguna línea queda atada a la factura de otra |
| `userMustActivateGPS` | `true` | **`true`** | guarda de navegación — ver H-1 |
| `validateClient` | — | `false` | |
| `expirationBatch` | `false` | Lote llega `required=**false**` | 4.ª confirmación de que el LOTE es el campo discriminador |
| `signatureReturn` | `true` | acordeón `sign` + 1 `<canvas>` presentes | **habilita, no obliga**: se envió sin firma |
| `userCanUploadFiles` | `true` | acordeón `file` presente | |
| `requiredComment` | `true` (global) | **NO aplica en devoluciones** | ver *Pendientes del YAML resueltos* |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `app-devoluciones` con los 2 `ion-button.colorBorderBuscar`: **DEVOLUCIÓN (180,107)** · **BUSCAR (180,176)** |
| DM-DEV-002 | ✅ PASS | Form `app-devolucion`: `General:ok` · `Productos`/`Adjuntos` con `segment-button-disabled`; sin cliente; `imagenGuardar`+`imagenEnviar` **`disabled=true`**. Empresa = 1 `ion-select` **sin `formcontrolname`**, `disabled=true`, `.select-disabled`, `ng-pristine`, `value` = **OBJETO completo** |
| DM-DEV-004 | ✅ PASS | **Click REAL** en `#clienteSelectModal ion-item` — `006831` era el **ítem 0 de 50** (sin paginar): `#clienteSelect="FERRETERIA EPA, C.A (006831)"`, modal cierra solo, las **3 tabs habilitan**. En form fresco **no hay alert** de cambio de cliente ni de deuda vencida (saldo neto −22,50) |
| DM-DEV-006 | ✅ PASS | `#responsable`, `#precinto`, `#comentario` aceptan valores (`maxlength` real **255**). **Tipo** = 2.º `ion-select` visible, `value` **number**, abre **`ion-popover`** con 3 opciones → 1 click fija `52` |
| DM-DEV-011 | 🚫 N/A | **N/A ESTRUCTURAL por `validateReturn=false`** (VG leída en vivo). La pantalla se abrió y se midió: **no existe** `ion-input#invoiceSelect` ni `#InvoiceeSelectModal` en cabecera, `returnLogic.invoices=[]`, y las tabs habilitan **solo con el cliente** |
| DM-DEV-013 | ✅ PASS | `ion-button.botonAddAmarillo` "Agregar Producto" (180,138) → **36 familias inline** → buscador `input.search-input.inputsSearch` + `Enter` con `LLA-01` → **1 solo ítem**, código **exacto** → acordeón `LLAVE EN BLANCO DERECHA. TIPO CISA` |
| DM-DEV-014 | ✅ PASS | Con `Nro Factura=FACT6855` y `Cantidad=2` llenados **con el acordeón COLAPSADO** vía `ion-input.label`: `imagenEnviar` pasa `disabled` **true → false** |
| DM-DEV-015 | ✅ PASS | Tab ADJUNTOS: **3 `ion-accordion`** visibles — `images` (Imágenes) · `file` (Archivo, `userCanUploadFiles=true`) · `sign` (Firma, `signatureReturn=true`) + **1 `<canvas>`** real. 0 `input[type=file]` |
| DM-DEV-016 | ✅ PASS · **BD-SAVED** | Alert `Denario Devolución / "¡Su Devolución se ha guardado!"` `[OK]`. Local `returns`: `co_return=1787085038888.0`, `id_return=0`, **`st_delivery=3`**, y **2** `return_details` con **`co_document` DISTINTO** |
| DM-DEV-018 | ✅ PASS · **BD-OK** | **3 alertas** y la 3.ª trae el correlativo: `¿Desea enviar la devolución?` `[Cancelar/**Aceptar**]` → `¡Su Devolución será enviada!` `[OK]` → `Devolución nro. **351** enviada exitosamente` `[OK]` → navega a `/devoluciones` |
| DM-DEV-019 | ✅ PASS | Lista con 3 ítems: `Nro. Ref: 0 · Guardado` (con trash) · `Nro. Ref: 351 · Enviado` · `Nro. Ref: 350 · Enviado`, todos `Cliente: 006831 - FERRETERIA EPA, C.A` y `Fecha: 18/08/2026` |
| DM-DEV-021 | ✅ PASS | `ion-searchbar` (180,104): 3 → **0** (`ZZZZQQ`, empty-state `No hay resultados`) → **3**. Filtra realtime y **repuebla solo**. Trash `ion-button[color="danger"]` **solo en el Guardado** |
| DM-DEV-022 | ✅ PASS · round-trip §9 OK | Reapertura del Guardado Ref 0 (click al 35 % ancho / 40 % alto) en **1,9 s**: form editable, 3 tabs accesibles y **todos los valores intactos** — cliente, tipo `60` (default conservado), comentario/responsable/precinto vacíos, acordeón `LLA-01` con `NDB395` y cantidad `1` |
| DM-DEV-024 | ✅ PASS | Trash (305,195) → alert `Denario Devolución / "¿Desea eliminar la devolución?"` `[Cancelar/**Eliminar**]` (**sin** alert de éxito posterior) → lista **3 → 2**. Borrado **en cascada** verificado: `returns=0` **y** `return_details=0` |

---

## Registros creados en sistema

| Ref (UI) | Documento / Registro | Detalle | Estado | Marca BD |
|----------|----------------------|---------|--------|----------|
| **351** | Devolución `return` · `id_return=351` · `co_return=1787085038888.0` | Cliente `006831` FERRETERIA EPA (`id_client=4163`) · tipo **PostVenta (52)** · responsable `QA Automatizacion` · precinto `PRE-DEV-8899` · comentario `Test-DEV-SMOKE-multiInvoices` · **2 líneas con DOS facturas distintas**: `LLA-01` ×2 → **FACT6855** · `TM01` ×3 → **FACT6561** (motivo 38 en ambas) · coord `11.0490223,-63.8649901` · 0 adjuntos, sin firma | **Enviado** (`st_return=1` nube · `st_delivery=1` local) | **BD-OK** / **BD-FIELD-OK** |
| 0 | Devolución local `returns` · `co_return=1787085398232.0` | `LLA-01` ×1 → `NDB395` · tipo Calidad (60, default) · **sin** comentario / responsable / precinto — creada para medir el alcance de `requiredComment` y ejercer DM-DEV-022 y DM-DEV-024 | **Guardado → BORRADO** | BD-SAVED *(no llegó a nube, correcto)* |
| 0 | Devolución local `returns` · `co_return=1787085893472.0` | **Sin ninguna línea de producto** — sonda del hallazgo **H-2** | **Guardado → BORRADO** | BD-SAVED |

### Diff de baseline — filtrado por `id_user = 470` (tenant vivo, 7 vendedores transaccionando)

Baseline tomado **inmediatamente antes** de pulsar Enviar, con `count(*)`, nunca con `max(id)`:

| Momento | `count(*)` | `count(DISTINCT co_return)` | `max(id_return)` |
|---|---|---|---|
| Antes de Enviar | 1 | 1 | 350 |
| Después | **2** | **2** | **351** |

`count(*) = count(DISTINCT co_return)` ⇒ **sin duplicados**. Local: `pending_transactions = 0` · `failed_transactions = 0` · `returns` 2 filas / 2 `co_return` distintos ⇒ **sync INMEDIATA** (el correlativo llegó en la 3.ª alerta, sin espera).
2.º pase de baseline al cierre: sigue en **2**, y las dos devoluciones borradas (`1787085398232.0` y `1787085893472.0`) dan `count=0` en la nube ⇒ **nunca llegaron**, que es lo correcto para un Guardado.

### Verificación BD — cotejo campo a campo (payload ↔ nube)

Hook `Capacitor.nativePromise`: **1 solo POST** `returnservice/return`, con `data` completo, sin duplicados.

**Cabecera `return` (id 351)**

| Campo payload | Payload | Nube `return` | ✓ |
|---|---|---|---|
| coReturn | `1787085038888.0` | `1787085038888.0` | ✅ |
| coClient / idClient | `006831` / `4163` | idem | ✅ |
| lbClient → `na_client` | `FERRETERIA EPA, C.A` | idem | ✅ |
| naResponsible | `QA Automatizacion` | idem | ✅ |
| nuSeal | `PRE-DEV-8899` | idem | ✅ |
| idType | `52` | `52` | ✅ |
| txComment → **`tx_description`** | `Test-DEV-SMOKE-multiInvoices` | idem | ✅ *(fieldMap local↔nube)* |
| coUser / idUser | `000208` / `470` | idem | ✅ |
| coEnterprise / idEnterprise | `FERRE_N` / `1` | idem | ✅ |
| coordenada | `11.0490223,-63.8649901` | idem | ✅ |
| nuAttachments / hasAttachments | `0` / `"false"` | `0` / `false` | ✅ |
| stReturn | `0` (local) | **`1`** (nube) | ✅ *(dominios distintos — el discriminador fiable es `st_delivery`, §10)* |
| daReturn | `2026-08-18 16:30:38` (local UTC-4) | `2026-08-18T20:30:38Z` | ✅ *(nota de zona horaria, no mismatch — §10.b)* |
| coInvoice / idInvoice | `null` / `null` | *(la cabecera no los almacena)* | ✅ *(la factura vive por línea)* |

**Líneas `return_detail`** — FK **texto** `co_return='1787085038888.0'`

| co_detail | co_product | qu_product | **co_document** | id_motive | nu_lote | da_duedate | co_measure_unit |
|---|---|---|---|---|---|---|---|
| 607 | **LLA-01** | 2,0000 | **FACT6855** | 38 | `""` | `null` | `1` |
| 608 | **TM01** | 3,0000 | **FACT6561** | 38 | `""` | `null` | `1` |

`det = 2` = nº de productos cargados por UI ✅ · `id_return = 351` en ambas ✅
⚠ `nu_amount`, `nu_price`, `co_currency`, `co_type` y `co_motive` llegan **`null`** — **NO es mismatch**: devoluciones no maneja montos (confirmado a nivel de esquema, payload y BD; 6.ª corrida coherente con piercar/dm-electronica/latino/alipascua).

⇒ **`BD-OK` / `BD-FIELD-OK`**. Correlación **Nro. Ref UI = `id_return` = 351** reconfirmada en la lista, en la 3.ª alerta y en las dos bases.

---

## 🟢 `multiInvoices = true` — **EJERCIDO Y CONFIRMADO DE PUNTA A PUNTA**

Es lo que este tenant aporta y que ni `grupo_fiel` ni `kron` pudieron probar. **Funciona.**

**Dónde vive la VG:** ⚠ `multiInvoices` **NO aparece** en `returnLogic` (45 claves serializadas) ni en `globalConfig.variables` (objeto vacío). ⇒ **no se puede verificar leyendo el modelo**; hay que medirla por comportamiento. Lo que sí se lee es su consecuencia: **`returnLogic.bloquearFactura = false`**.

**Mecanismo medido:** con `validateReturn=false` **no hay factura de cabecera** (`coInvoice`/`idInvoice` viajan `null`). La factura es un campo **por línea de producto** (`ion-input` label `Nro Factura` dentro de cada `ion-accordion`), y viaja como **`coDocument` del detalle**. `multiInvoices` se manifiesta en que **cada línea conserva su propia factura**.

| Medición | Resultado |
|---|---|
| Al agregar la 2.ª línea, ¿se precarga la factura de la 1.ª? | **No** — el campo llega vacío y `ng-invalid` |
| ¿La 2.ª línea queda `readonly`/`disabled` atada a la 1.ª? | **No** — `readonly=false`, `disabled=false` |
| ¿Alerta al poner una factura distinta? | **Ninguna** |
| ¿Persiste en local? | `return_details`: `FACT6855` y `FACT6561` en el mismo `co_return` |
| ¿Persiste en el payload? | 2 `details` con `coDocument` distinto, `coInvoice` de cabecera `null` |
| ¿Persiste en la **nube**? | `return_detail` `co_detail 607` → **FACT6855** · `608` → **FACT6561**, ambos `id_return=351` ✅ |

📌 **Contraste con los tenants anteriores:** allí (`multiInvoices=false`) la devolución era mono-factura. Acá **una sola devolución cerró dos facturas reales del mismo cliente** (`FACT6855` 426,90 US$ y `FACT6561` 20,38 US$, ambas verificadas en `document_sale`) sin ninguna fricción de UI.

⚠ **Corolario de método:** el oráculo de `multiInvoices` es **`bloquearFactura` + el comportamiento del 2.º acordeón**, no una propiedad homónima. Buscarla por nombre en `returnLogic` devuelve "no existe" y se lee como "la VG no bajó al dispositivo".

---

## 🔴 `requeridedNroFactura=true` obliga a llenarlo pero **NO lo valida** — 2.ª confirmación (tras kron), ahora **con `multiInvoices` activo**

Se cargó `NOEXISTE-ZZZ999` en el campo Nro. Factura de una línea:

| Señal | Valor |
|---|---|
| Alert de rechazo | **ninguno** |
| `ng-invalid` del input | **`false`** (queda válido) |
| `imagenGuardar` / `imagenEnviar` | siguen habilitables |

⇒ El campo es **texto libre**: obligatorio en presencia, **no cotejado** contra `document_sale`. (Se corrigió a `FACT6855` antes de guardar, así que **ninguna factura inventada llegó a la nube**.)

**Por qué importa más acá:** con `multiInvoices=true` el riesgo se multiplica por línea — una devolución puede cerrar N facturas y **ninguna** de las N está verificada. Se mantiene el criterio de kron: **no se reporta como defecto** (es el diseño con `validateReturn=false`), pero queda como **riesgo de calidad de dato a confirmar con desarrollo**, ahora con evidencia de que escala con la VG nueva.

---

## Descubrimientos

### ✅ Pendientes del YAML resueltos por este módulo

| # | Pendiente | Resolución medida |
|---|---|---|
| 4 | Alcance real de `requiredComment` | 🔴 **En DEVOLUCIONES el comentario NO es obligatorio.** El `ion-input#comentario` llega `required=false`, y la devolución `co_return=1787085398232.0` se **guardó** con el comentario **vacío**, con `imagenEnviar` ya en `disabled=false`. ⇒ 3.er módulo de la serie en que `requiredComment=true` **no aplica** (grupo_fiel: solo cobros; pedidos de esta corrida: no aplica). ⚠ El `maxlength` real del input es **255**, no el `longitudComentario=250` del perfil — **mismo patrón que PEDIDOS y kron**: la VG no gobierna el tope real |
| 7 | `multiInvoices=true`: probar una devolución con VARIAS facturas | **Ejercida y validada hasta la nube** — ver la sección dedicada |

### 🟢 Catálogos del tenant — `co_operation='D'` no baja al dispositivo (4.ª confirmación)

| Catálogo | BD nube (activos) | Modelo Angular | UI |
|---|---|---|---|
| `return_type` | **3** → `52` PostVenta · `59` Servicio · `60` Calidad | `returnLogic.returnTypes` = **3** | popover con 3 opciones |
| `return_motive` | **7** de 33 (26 con `co_operation='D'`) | `returnLogic.returnMotives` = **7** | `ion-select` de 7 opciones |

Motivos activos: `37` Dev.-Por Inconformidad · **`38` Dev.-Por Imposibilidad de Pago (default)** · `39` Error de la Empresa · `40` Error del Asesor · `41` Error del Cliente · `43` Exposición · `60` Garantía Por Desperfecto.
📌 **Sin "Cambio X Cambio" (63)** — alinea piercar/jerez/alipascua/latino, contrasta globalmp/don-theo/ferrenuestro. **Y con solo 7 motivos** (vs 24 en grupo_fiel/alipascua): el `ion-select` de Motivo **no llegó a necesitar el fallback al `ion-alert` de radios**.

### 🟢 Selector de EMPRESA — 5.ª confirmación de la variante "objeto completo"

Con **1 empresa**: 1 solo `ion-select` visible, **sin `formcontrolname`**, `disabled=**true**`, `.select-disabled`, `ng-pristine`, y `value` = **objeto empresa entero**
(`{idEnterprise:1, coEnterprise:"FERRE_N", lbEnterprise:"CORPORACION FERRE 19", coCurrencyDefault:"US$", prioritySelection:0, enterpriseDefault:"true", naEnterprise:"CORPORACION FERRE 19, C.A.", nuRif:"J412581660", txAddress:"…"}`).

Coincide exactamente con `[grupo_fiel-20260817]` (1 empresa, `enterpriseEnabled=false`) y `[kron-20260817]` (1 empresa, `enterpriseEnabled=**true**`). **No se tocó nada** y el `idEnterprise`/`coEnterprise` viajaron correctos.
📌 **La opción del select trae `naEnterprise` con el `, C.A.`, pero lo que se PINTA es `lbEnterprise` (sin sufijo)** — coherente con lo medido por CLIENTES.

### ⚠ Etiquetas de alert medidas en este módulo (leídas, nunca predichas)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Guardar | `Denario Devolución` | `¡Su Devolución se ha guardado!` | `[**OK**]` |
| Enviar · paso 1 | `Denario Devolución` | `¿Desea enviar la devolución?` | `[Cancelar, **Aceptar**]` |
| Enviar · paso 2 | `Denario Devolución` | `¡Su Devolución será enviada!` | `[**OK**]` |
| Enviar · paso 3 | `Denario Premium` | `Devolución nro. 351 enviada exitosamente` | `[**OK**]` |
| Borrado | `Denario Devolución` | `¿Desea eliminar la devolución?` | `[Cancelar, **Eliminar**]` — **sin alert de éxito posterior** |
| Dirty-guard | `Denario Devolución` | *(sin cuerpo)* | `[Guardar y salir, **Salir sin guardar**, Cancelar]` |

**En minúsculas/capitalizado, NO en mayúsculas** — al contrario de PEDIDOS de **esta misma corrida**, donde todas venían en MAYÚSCULAS. ⇒ **el case de los botones varía por MÓDULO dentro del mismo build**; comparar siempre en minúsculas por **igualdad exacta**. Los **13 alerts** del módulo se resolvieron **sin un solo reintento**.

### ⚠ Dirty-guard: aparece al salir de un form REABIERTO, **no** de uno recién Guardado

| Situación | ¿Alert? |
|---|---|
| Back desde el form **recién Guardado** (`co_return=1787085398232.0`) | **No** — va directo al home del módulo |
| Back desde el **mismo** form **reabierto** desde BUSCAR | **Sí**, 3 botones |

📌 **Contrasta con PEDIDOS de esta misma corrida**, donde Guardar **sí** dejaba el form sucio y el back disparaba el dirty-guard. Reproduce exactamente lo medido en `[kron-20260817]` para devoluciones. ⇒ **el patrón "Guardar no deja el formulario pristine" es POR MÓDULO, no del build**; en DEVOLUCIONES de este build **sí** queda pristine.

### Otras confirmaciones

- **`PRD-BUSCADOR-NO-REPUEBLA` NO reproduce en DEVOLUCIONES** (3.ª confirmación de la acotación a PRODUCTOS): 3 → 0 → **3** al vaciar, sin empty-state residual.
- **La lista BUSCAR OCULTA los botones DEVOLUCIÓN/BUSCAR — 6.ª confirmación** (como piercar/alipascua/el_palmar/difranca/kron; contrasta dm-electronica) ⇒ back al home del módulo antes de crear otra.
- **`#clienteSelectModal` NO necesitó paginar:** `006831` era el **ítem 0 de 50** pese a los **1.569 clientes** de la cartera — la lista viene ordenada por saldo/actividad y el cliente de la corrida encabeza. `waitForFunction` sobre `.show-modal` + `ion-item.length>0` resolvió el modal **a la 1.ª en las 3 aperturas**, sin un solo rect 0×0.
- **Click REAL en `#clienteSelectModal ion-item` acertó el cliente exacto 3 de 3** (`scrollIntoView({block:'center'})` → ~700-900 ms → **re-leer el rect** → `mouse.click`). **No hizo falta `setClientfromSelector`.**
- **Campos del acordeón llenados COLAPSADOS por `ion-input.label` — 4.ª confirmación** (`Nro Factura`, `Cantidad Devuelta`): nunca hizo falta expandir.
- **`returnLogic.itemReturns` llega `[]` aunque las líneas existan en el DOM y en la BD local** — mismo comportamiento que `productList` en difranca. **Leer las líneas del DOM (o de `returns`/`return_details` local), no del modelo.**
- **`st_return` local ≠ nube tras enviar:** local `st_return=0` con `st_delivery=1`, nube `st_return=1`. Ratifica `RUNTIME §10`.
- **`clickBack`** (`img.fechaAtras` → `closest('a')` + `mouse.click`, coords **(32,31)** en el form y **(32,47)** en la lista, filtrando `width>0`) **funciona** en form, lista y home. **No hizo falta `ionBackButton`.**
- **Borrado en cascada verificado (3.ª confirmación):** `returns=0` **y** `return_details=0` para el `co_return` eliminado, sin detalles huérfanos.

---

## Hallazgos

### 🟠 H-1 · La guarda de GPS también bloquea la navegación de DEVOLUCIONES — **43,1 s sin ningún indicador** (supera el techo sugerido por PEDIDOS)

**Supera el gate de §4.b:** reproduce **hoy**, en la build bajo prueba, con registros nuevos, y se midió 4 veces en este módulo.

Es **el mismo mecanismo** de H-1 de PEDIDOS (`userMustActivateGPS=true` + la navegación dentro del `.then()` del fix de GPS, con caché de posición que expira a los 60 s), pero **ahora medido en un segundo módulo** ⇒ el defecto **no es de PEDIDOS**, es de la guarda de GPS.

| Acción | Espera hasta que aparece `app-devolucion` |
|---|---|
| 1.er `DEVOLUCIÓN` (caché caliente, justo tras entrar al módulo) | **1,5 s** |
| Reabrir un Guardado desde la lista (DM-DEV-022) | **1,9 s** |
| `DEVOLUCIÓN` tras ~5 min de inactividad (caché **fría**) | **> 40 s (1.er intento agotó los 40 s y no navegó)** |
| Reintento inmediato del mismo click | **43,1 s** |

**Impacto:** durante esos 40+ s **no hay `ion-loading`, ni spinner, ni alert**. Para el vendedor es indistinguible de "la app se colgó". No pierde datos y termina navegando ⇒ no es FAIL funcional, es **feedback / rendimiento percibido**.

**Corrección al costo de automatización:** PEDIDOS recomendó un techo de **≥ 35 s**; acá **no alcanzó** (un intento con techo de 40 s falló y el siguiente tardó 43,1 s). ⇒ **el techo debe ser ≥ 60 s** en cualquier navegación que atraviese la guarda de GPS, o el caso se marca BLOCKED por infra sin serlo.

**Sugerencia para desarrollo:** `ion-loading` («Obteniendo ubicación…») mientras se resuelve el fix, y/o techo con fallback a `getLatestPosition()`.

### 🟡 H-2 · Se puede **Guardar una devolución sin ninguna línea de producto**

**Supera el gate de §4.b:** se creó **hoy** un registro nuevo que lo demuestra (y se borró al terminar).

Con el cliente seleccionado y **cero** productos cargados:

| Señal | Valor |
|---|---|
| `imagenGuardar.disabled` | **`false`** (habilita al seleccionar el cliente, antes de cualquier producto) |
| `imagenEnviar.disabled` | `true` ✅ |
| `ion-accordion` en Tab Productos | **0** |
| Al pulsar Guardar | alert de éxito `¡Su Devolución se ha guardado!` `[OK]` |
| Resultado en BD local | fila nueva en `returns` (`co_return=1787085893472.0`, `st_delivery=3`) con **0 filas** en `return_details` |
| En la lista BUSCAR | aparece como `Nro. Ref: 0 · Guardado` |

**Contraste dentro de la misma corrida:** en **PEDIDOS** (DM-PED-029) `imagenGuardar` **sí** queda `disabled=true` hasta que hay ≥ 1 línea en el carrito. ⇒ la validación existe en el producto y **falta en devoluciones**.

**Severidad 🟡 (baja-media, contenida):** el registro vacío **no puede llegar a la nube** (`imagenEnviar` sí valida y queda deshabilitado) y el vendedor puede borrarlo con el trash. El daño es **ruido en la lista de Guardados** y un flujo que "acepta" algo sin contenido. **No se marca FAIL de ningún caso del smoke** porque ningún caso cubre esta condición; se levanta como hallazgo para desarrollo: **`imagenGuardar` debería exigir ≥ 1 línea, igual que `imagenEnviar`**.

### 🟡 H-3 · El buscador de la lista **no encuentra por Nro. Ref ni por Estatus**, que es justo lo que la lista muestra

| Término tecleado | Resultado |
|---|---|
| `FERRETERIA` / `EPA` / `006831` | **3** de 3 ✅ |
| `351` (un Nro. Ref que está en pantalla) | **0** — `No hay resultados` |
| `Guardado` (un Estatus que está en pantalla) | **0** |

Cada ítem rotula `Nro. Ref: 351 · Cliente: … · Estatus: Enviado · Fecha: …`, pero el filtro solo mira el cliente. Con las 3 devoluciones del mismo cliente, filtrar por cliente **no discrimina nada**.

**No se marca FAIL:** DM-DEV-021 solo exige "filtra en tiempo real" y eso se cumple; **falta el oráculo** de por qué campos debe buscar (leer `../src/` está fuera de alcance sin un FAIL S1). Reproduce **hoy con registros de hoy**, así que pasa §4.b como cosa a mirar. Impacto práctico bajo hoy (3 registros), creciente en un vendedor con historial. 📌 **Verificar con desarrollo.**

*(No se levantan, con evidencia: el Nro. Factura como texto libre — es el diseño con `validateReturn=false`, ya acordado en kron; el envío sin firma con `signatureReturn=true` — la VG habilita, no obliga (QA 2026-07-29); `nu_amount`/`co_currency` en `null` — devoluciones no maneja montos; `maxlength` 255 vs `longitudComentario` 250 — mismo patrón que PEDIDOS/kron y sin oráculo.)*

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`multiInvoices` NO existe como propiedad de `returnLogic` — su oráculo es `bloquearFactura` + el 2.º acordeón** | universal | Buscar `multiInvoices` en el modelo devuelve "no existe" (45 claves serializadas) y `globalConfig.variables` llega **vacío** ⇒ se lee como "la VG no bajó". **Medirla por comportamiento:** agregar una 2.ª línea y comprobar (a) que su `Nro Factura` llega **vacío** (no precargado), (b) `readonly=false`/`disabled=false`, (c) `returnLogic.bloquearFactura===false`. Con `validateReturn=false` la factura viaja **por detalle** (`coDocument`), y `coInvoice`/`idInvoice` de la cabecera van `null`. |
| 🔴 **La guarda de GPS bloquea también la navegación de DEVOLUCIONES — techo ≥ 60 s** | universal | Mismo mecanismo que `[run_vzla-20260818 PEDIDOS]`, ahora en un 2.º módulo ⇒ es de la **guarda de GPS**, no de PEDIDOS. Con caché fría el click parece muerto **> 40 s sin loading**; un techo de 40 s **falló** y el reintento tardó **43,1 s**. **Corrige la recomendación de ≥ 35 s a ≥ 60 s.** Con caché caliente: 1,5-1,9 s. |
| 🔴 **El buscador de productos del selector PERSISTE su texto dentro del MISMO formulario** | universal | Al reabrir "Agregar Producto" para la 2.ª línea, el `input.search-input.inputsSearch` conserva `"LLA-01"`; teclear encima produce `"LLA-01TM01"` → **0 resultados** y se lee como "el producto no existe". **Vaciar con `Backspace` (leyendo `input.value.length`) antes de teclear.** ⚠ Entre **formularios distintos** sí llega vacío ⇒ el residuo es por instancia del form, no global. |
| **El buscador de productos resuelve el SKU a la 1.ª y devuelve match ÚNICO** | universal | `input.search-input.inputsSearch` + `Enter` con el código completo (`LLA-01` → 1 ítem; `TM01` → 1 ítem), evitando las 36 familias. Igual que en PEDIDOS **matchea por substring** ⇒ capturar `/Código:\s*([A-Za-z0-9.\-]+?)\s*(?:Precio|Existencia|Inventario|Stock|$)/` y comparar por **igualdad exacta** antes de clicar. |
| ⚠ **El case de los botones de alert varía POR MÓDULO dentro del mismo build** | universal | En esta corrida PEDIDOS entregó `[CANCELAR, ACEPTAR]` en mayúsculas y DEVOLUCIONES `[Cancelar, Aceptar]` capitalizado. **Comparar siempre en minúsculas por igualdad exacta**; no derivar el case de otro módulo de la misma corrida. |
| ⚠ **"Guardar no deja el form pristine" es POR MÓDULO** | universal | En esta corrida PEDIDOS **sí** disparó dirty-guard tras Guardar; DEVOLUCIONES **no** (solo al salir del form **reabierto**). Reproduce `[kron-20260817]`. ⇒ no extrapolar el patrón de un módulo a otro dentro de la misma corrida. |
| **`returnLogic.itemReturns` llega vacío aunque las líneas existan** | universal | `itemReturns=[]` con 2 acordeones en el DOM y 2 filas en `return_details` local. Refina la nota de `productList` de `[difranca-20260807]`: **el modelo de líneas de devoluciones no es fuente confiable — leer el DOM o la BD local.** |
| **Selector de empresa: 5.ª confirmación "sin `formcontrolname` + objeto completo"; con 1 empresa `disabled=true`** | universal | La opción del `ion-select` trae **ambos** nombres (`lbEnterprise` sin sufijo, `naEnterprise` con `, C.A.`) — lo que se **pinta** es `lbEnterprise`. **No tocar nada.** |
| **7 motivos ⇒ el Motivo abre popover, no `ion-alert` de radios** | cliente | Con 24 motivos (grupo_fiel/alipascua) el control caía en el `ion-alert` de 26 botones. Acá, con **7**, no hizo falta tocarlo y el default (`38`) viajó correcto. Refuerza que **la variante de overlay la fija el control/su nº de opciones**, no el módulo. |
| **`#clienteSelectModal` sin paginar pese a 1.569 clientes** | cliente | `006831` llegó como **ítem 0 de 50** en las 3 aperturas ⇒ **no** hizo falta `onIonInfinite`. Igualmente conviene mantener el bucle de paginación como fallback: es barato y corta de inmediato. |
| Coords estables (Infinix X6728, 360×744) | cliente | Home devoluciones: **DEVOLUCIÓN (180,107)** · **BUSCAR (180,176)**. Header: `imagenGuardar` **(267,32)** · `imagenEnviar` **(326,32)** · back **(32,31)** en form / **(32,47)** en lista. Tab Productos: "Agregar Producto" **(180,138)** · buscador **(180,146)** · 1.er ítem del resultado **(180,212)**. Lista: searchbar **(180,104)** · trash del 1.er ítem **(305,195)** · reapertura del 1.er ítem **(126,185)**. |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Resumen técnico

**13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED · 0 cuelgues de CDP.** Wall-clock ≈ 20 min, **17 `browser_run_code_unsafe`**, 0 reintentos de alert (13/13 a la primera).

1. **`multiInvoices=true` EJERCIDO Y CONFIRMADO hasta la nube** — la devolución **Ref 351** cerró **dos facturas reales distintas** del mismo cliente en un solo registro (`FACT6855` en `LLA-01`×2 y `FACT6561` en `TM01`×3), con `co_document` distinto por `return_detail` y `coInvoice` de cabecera en `null`. Es la primera corrida de la serie que ejerce esta VG. ⚠ **La VG no es legible desde el modelo**: su oráculo es `bloquearFactura=false` + el comportamiento del 2.º acordeón.
2. **Devolución Ref 351 Enviada, `BD-OK` + `BD-FIELD-OK`**: cabecera 14/14 campos y las 2 líneas cuadran payload ↔ nube; diff de baseline filtrado por `id_user=470` exactamente **+1** (1 → 2, `count(*) = count(DISTINCT co_return)`), colas vacías, **sync inmediata**, sin duplicados, y 2.º pase de baseline al cierre sin cambios.
3. **`requeridedNroFactura` obliga pero NO valida** — `NOEXISTE-ZZZ999` pasó la validación con `ng-invalid=false` y sin alert. 2.ª confirmación tras kron, ahora **con `multiInvoices` activo**, donde el riesgo escala por línea. Se mantiene como riesgo de dato a confirmar, no como defecto.
4. **`requiredComment=true` NO aplica a DEVOLUCIONES** (pendiente #4 del YAML cerrado): campo `required=false` y devolución guardada con comentario vacío. `maxlength` real **255** vs `longitudComentario=250`.
5. **Round-trip §9 perfecto** al reabrir el Guardado: cliente, tipo (default conservado), factura, cantidad y los campos vacíos, todos intactos.
6. **Tres hallazgos abiertos**: H-1 la guarda de GPS bloquea también la navegación de devoluciones **43,1 s sin feedback** (y **corrige el techo de espera de ≥35 s a ≥60 s**); H-2 se puede **Guardar una devolución sin líneas** (PEDIDOS sí lo valida — el envío no, así que está contenido); H-3 el buscador de la lista **no filtra por Nro. Ref ni Estatus**, que es lo que la lista muestra.
7. **Catálogos coherentes con BD**: 3 tipos activos (52/59/60, **sin CxC**) y **7 motivos** de 33 (26 con `co_operation='D'` que no bajan) — 4.ª confirmación del filtro en la sincronización.
8. App devuelta a **HOME** (`app-home` visible, 0 alerts, 0 modals) para el módulo siguiente (INVENTARIOS). Las dos devoluciones creadas solo para probar borrado quedaron **eliminadas** y no dejaron rastro en la nube.

---
Agente: **DEVOLUCIONES** · modelo Opus · RUN_ID `20260818_152824_smoke-completo`
