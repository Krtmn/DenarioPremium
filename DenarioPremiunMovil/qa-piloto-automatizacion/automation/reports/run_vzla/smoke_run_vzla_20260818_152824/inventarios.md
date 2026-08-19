# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente | `run_vzla` |
| Empresa | `FERRE_N` / `id_enterprise=1` · rótulo UI **`CORPORACION FERRE 19`** (`lb_enterprise`) |
| App | `com.kiberno.denarioPremiumPro` · v**1.0** / db**19** · `window.ng=true` · `sqlitePlugin` disponible · **build v21** (`min="0"` en cantidad) |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` · 360 × 744 |
| Playa | **LA TORTUGA** — `http://denariolatortuga.ddns.net:8081/PremiumWS/services/clientstockservice/clientstock` (host del POST capturado por el hook) |
| Usuario QA | `***` / `***` · `id_user 470` · `co_user '000208'` |
| Cliente de prueba | `006831` FERRETERIA EPA, C.A (`id_client=4163`, `id_address_client=17676`) |
| Resultado | **15 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=50 min`, `page` pasado · **0 cuelgues**, 0 `CDP-DOWN:` |
| Hook de payload | heredado y **vivo** (`__qaDataHook=true`, 83 payloads al arrancar → 104 al cerrar) · **NO se reinstaló** |
| Namespace propio | `window.__qaINV` (10 skills) — sin tocar `__qaH` / `__qaCLI` / `__qaPED` / `__qaDEV` |

### VGs del módulo — leídas EN VIVO de `inventariosLogicService`, no del dump

| VG | Perfil | Medido en el dispositivo | Efecto observado |
|---|---|---|---|
| `clientStock` | `true` | módulo presente y operable end-to-end | **APLICA** ✅ |
| 🟢 `expirationBatch` | `false` | **`false`** en `inventariosLogicService` | `input[placeholder="Ingrese lote"]` llega `required=false` **y el modal ACEPTA con el lote vacío** — ver sección dedicada |
| `suggestedOrderByDispatchAndReturn` | `false` | **`false`** | el botón `botonAddAmarillo` aparece igual (10.ª playa); el modal **no** rotula "Sugerido" |
| `requireClientStock` | `false` | — | sin exigencia de inventario previo |
| `signatureStock` | `true` | acordeón/tab Adjuntos presente | **habilita, no obliga**: se envió sin firma, `nuAttachments=0` / `hasAttachments="false"` |
| `requiredComment` | `true` (global) | **NO aplica en inventarios** | `ion-input#responsable` llega `required=false`, la UI rotula literalmente **"Mín. 0 - Máx. 255 caracteres"** y `.imagenGuardar` ya está `disabled=false` con el comentario vacío |
| `longitudComentario` | `250` | `maxlength` real = **255** | la VG no gobierna el tope real (3.er módulo de la corrida con el mismo desfase) |
| `userMustActivateGPS` | `true` | `true` | guarda de navegación — ver **H-1** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `app-inventarios` en **1,10 s** desde HOME, con los 2 `ion-button.colorBorderBuscar`: **INVENTARIO (180,112)** · **BUSCAR (180,181)** |
| DM-INV-002 | ✅ PASS | Form `app-inventario` con **4 tabs** `General/Inventario/Resumen/Adjuntos`; solo `General` habilitada, las otras 3 `segment-button-disabled`; `#clienteSelect` **vacío**; `imagenGuardar`+`imagenEnviar` `disabled=true`. Empresa = 1 `ion-select` **sin `formcontrolname`**, `disabled=true`, `value` = **OBJETO** de 9 claves, `ng-valid`, shadowRoot `CORPORACION FERRE 19`. ⚠ La navegación tardó **~87 s** (guarda GPS — H-1) |
| DM-INV-004 | ✅ PASS | Click REAL en `#clienteSelectModal ion-item` — `006831` era el **ítem 0 de 50** (sin paginar, pese a 1.569 clientes): `#clienteSelect="FERRETERIA EPA, C.A (006831)"`, el modal cierra solo y **las 4 tabs habilitan**. Sin alerta de deuda vencida (saldo neto −22,50) ni de cambio de cliente |
| DM-INV-008 | ✅ PASS | Tab Inventario nivel familias: **36 familias** con contador (ABRAZADERAS 2 … HERRAMIENTAS MANUALES 348), cabecera `Favoritos 0 / Destacados 791 / Inventario 0` y `input[placeholder="Búsqueda de productos"]` |
| DM-INV-010 | ✅ PASS | `pg.mouse.click` **simple** (tras `scrollIntoView` + re-leer rect) abre `ion-modal.inventory-type-stocks-modal`: **1** `ion-card.capture-row-card`, Cantidad (`number`, **`min="0"` ⇒ build v21**), Lote (`text`), unidad **preseleccionada UNIDADES**, `ion-datetime-button` = **18 ago 2026 (HOY)**, header `close-btn/save-btn/delete-row-btn/add-lot-button`. Ubicación fija `Exhibición - 1`. **0 `ion-popover` residuales** |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` (`pg.click{clickCount:3}` + `keyboard.type`) fijó Cantidad `7`; **Lote se dejó VACÍO a propósito** para medir `expirationBatch=false` con el campo vacío (regla graduada §3) |
| DM-INV-012 | ✅ PASS | `.save-btn` (321,64) tras `mouse.move` → el modal **cierra sin ninguna alerta de validación** con el lote vacío y el ítem pasa a `Inventariado: Exhibición` |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla `Sel · Código · Producto · **Exhibición** · **Depósito** · Acción` — `LLA-01` **7 UNIDADES │ 3 UNIDADES**, `TM01` **5 UNIDADES │ -**. Oráculo visual de **no-fusión** |
| DM-INV-017 | 🚫 N/A | **N/A ESTRUCTURAL por `suggestedOrderByDispatchAndReturn=false`** (VG leída en vivo en `inventariosLogicService`). La pantalla **sí se abrió y se midió**: el botón `ion-button.botonAddAmarillo` "Pedido Sugerido" (180,366) existe y el `inventario-sugerido-modal` abre, pero **no renderiza ninguna línea de cantidad sugerida** (solo `Moneda:` vacía, los días y los 2 productos). Insumo verificado en BD: `client_avg_product` tiene **24 filas de solo 2 clientes** y **0 para `006831`** ⇒ sin promedio no hay sugerido. Cerrado con `dismiss(null,'cancel')` — su ACEPTAR **crea un PEDIDO** |
| DM-INV-020 | ✅ PASS | `Días desde último Inventario: **1**` / `Días para siguiente Inventario: **1**` en el `inventario-sugerido-modal` (no en Tab General) — y viajan a la nube como `days_since_last=1` / `days_until_next=1` ✅ |
| DM-INV-021 | ✅ PASS · **BD-SAVED** | 2 alertas: `Denario Inventario / "¿Desea guardar el Inventario?"` `[Cancelar/**Aceptar**]` → `Denario Inventario / "Inventario guardado con éxito"` `[**OK**]`. Local `client_stocks`: `co_client_stock=1787086589372.0`, `id_client_stock=0`, **`st_delivery=3`**, `tx_comment='inv-smoke-2ubicaciones'`. **Guardar NO navega fuera del formulario** |
| DM-INV-022 | ✅ PASS · **BD-OK** | **3 alertas** y la 3.ª trae el correlativo: `¿Desea enviar el Inventario?` `[Cancelar/**Aceptar**]` → `El Inventario será enviado` `[**OK**]` → `Denario Premium / "Inventario nro. **53** enviado exitosamente"` `[**OK**]` → navega al home del módulo. **5,7 s** de punta a punta |
| DM-INV-023 | ✅ PASS | Lista BUSCAR con 3 ítems `Nro. Ref.: N · Cliente: 006831 - FERRETERIA EPA, C.A · Estatus: X · Fecha: 18/08/2026`; trash `ion-button[color="danger"]` **solo** en el Guardado. La lista **oculta** los botones INVENTARIO/BUSCAR |
| DM-INV-025 | ✅ PASS | `ion-searchbar` (180,109) filtra **on-keyup**: `FERRETERIA`→3 · `ZZZZQQ`→**0** (empty-state) · **`52`→1** · `Guardado`→0 · vacío→**3**. **Repuebla solo** |
| DM-INV-026 | ✅ PASS · round-trip §9 OK | Reapertura del Guardado Ref 0 en **2,97 s** (dispatch Pointer+Mouse sobre el `ion-item` + `mouse.click` en el `ion-label`). Abre en tab **General** — **defecto conocido cosmético**, no FAIL. Todo intacto: cliente, comentario (`22/255`), Resumen `7│3` y `5│-`, y el modal de `LLA-01` reabre con `cantidad=7`, lote vacío y fecha 18 ago 2026 |
| DM-INV-028 | ✅ PASS | Trash (300,205) → **sin confirmación previa** → `Denario Inventarios` (⚠ **en plural**) / `"¡EL Inventario se borro con exito!"` `[**OK**]` → lista **3 → 2**. Borrado **en cascada en la BD local** (`client_stocks` y `client_stocks_details` = 0 filas) y **jamás llegó a la nube** (`count=0`) |

---

## Registros creados en sistema

| Ref (UI) | Documento / Registro | Detalle | Estado | Marca BD |
|----------|----------------------|---------|--------|----------|
| **53** | Inventario `client_stock` · `id_client_stock=53` · `co_client_stock=1787086589372.0` | Cliente `006831` FERRETERIA EPA (`id_client=4163`) · empresa `FERRE_N`/1 · comentario `inv-smoke-2ubicaciones` · coord `11.0490224,-63.8649923` · **2 productos / 3 capturas**: `LLA-01` **exh 7** + **dep 3** (mismo producto, 2 ubicaciones) y `TM01` **exh 5** lote `QA-INV-0818` · `days_since_last=1` / `days_until_next=1` · 0 adjuntos, sin firma | **Enviado** (`st_client_stock=1` nube · `st_delivery=1` local) | **BD-OK** / **BD-FIELD-OK** |
| 0 | Inventario local `client_stocks` · `co_client_stock=1787087221372.0` | Solo cliente `006831`, **cero capturas** — creado para ejercer DM-INV-028 | **Guardado → BORRADO** | BD-SAVED *(nunca llegó a la nube, correcto)* |

### Diff de baseline — filtrado por `id_user = 470` (tenant vivo, 7 vendedores transaccionando)

Baseline tomado **inmediatamente antes** de pulsar Enviar, con `count(*)`, nunca con `max(id)`:

| Momento | `count(*)` | `count(DISTINCT co_client_stock)` | `max(id_client_stock)` |
|---|---|---|---|
| Antes de Enviar | 1 | 1 | 52 |
| Después | **2** | **2** | **53** |
| 2.º pase al cierre del módulo | **2** | **2** | **53** |

`count(*) = count(DISTINCT co_client_stock)` ⇒ **sin duplicados**. Local: `pending_transactions` **vacía** · `failed_transactions` **0** · **1 solo POST** `clientstockservice/clientstock` capturado por el hook ⇒ **sync INMEDIATA** (el correlativo llegó en la 3.ª alerta, sin espera ni poll).
El inventario Guardado que se borró (`1787087221372.0`) da `count=0` en la nube ⇒ **nunca llegó**, que es lo correcto.

### Verificación BD — cotejo campo a campo (payload ↔ nube)

`node automation/db/cotejo-payload.js run_vzla <payload.json>` → **`BD-FIELD-OK`**

```
marca: BD-FIELD-OK · tipo: clientStock · co_x: 1787086589372.0
campos_cabecera: 16 · client_stock_detail: payload 2 = nube 2
client_stock_detail_unit: payload 2 = nube 2 (LLA-01) · payload 1 = nube 1 (TM01)
mismatches: []   notas: 4 (todas "hora difiere, posible zona horaria")
```

**Cabecera `client_stock` (id 53)** — 16/16 campos llenos cuadran: `co_client_stock` · `id_user`/`co_user` (470/000208) · `id_client`/`co_client` (4163/006831) · `id_address_client`/`co_address_client` (17676/006831) · `coordenada` · `tx_comment` · `id_enterprise`/`co_enterprise` (1/FERRE_N) · `nu_attachments`/`has_attachments` (0/false) · `days_since_last`/`days_until_next` (1/1).
⚠ `stClientStock` viaja `0` en el payload y la nube guarda `1` — **dominios distintos, no mismatch** (§10: el discriminador fiable es `st_delivery` local). `daClientStock` `2026-08-18 16:56:29` local (UTC-4) ↔ `2026-08-18T20:56:29Z` nube — **nota de zona horaria**, no mismatch (§10.b).

**Detalle y unidades en la nube** — FK **texto** `co_client_stock='1787086589372.0'`

| `id_client_stock_detail` | `co_product` | `id_client_stock_detail_unit` | `co_client_stock_detail_unit` | `co_product_unit` | `ubicacion` | `qu_stock` | `nu_batch` |
|---|---|---|---|---|---|---|---|
| 421 | **LLA-01** | 424 | `1787086673044.1` | **`LLA-011`** | **exh** | 7,0000 | `""` |
| 421 | **LLA-01** | 425 | `1787086708748.1` | **`LLA-011`** | **dep** | 3,0000 | `""` |
| 422 | TM01 | 426 | `1787086753755.1` | `TM011` | exh | 5,0000 | `QA-INV-0818` |

⇒ **`BD-OK` / `BD-FIELD-OK`.** Correlación **Nro. Ref UI = `id_client_stock` = 53** reconfirmada en la 3.ª alerta, en la lista y en las dos bases.

---

## 🟢 `expirationBatch = false` — MEDIDO CON EL CAMPO VACÍO, **NO bloquea** (y es la diferencia real con kron / grupo_fiel)

Es lo que este tenant aporta frente a las 3 corridas que graduaron la regla a `RUNTIME §3`.

| Medición | Resultado |
|---|---|
| Valor en vivo (`inventariosLogicService.expirationBatch`) | **`false`** |
| ¿Se renderizan los campos Lote y Fecha de vencimiento? | **Sí** — el modal siempre los pinta (la VG gobierna la validación, no la visibilidad) |
| `required` del `input[placeholder="Ingrese lote"]` | **`false`** |
| Aceptar (`.save-btn`) con **Cantidad=7 y Lote VACÍO** | ✅ **aceptado** — el modal cierra, **0 alertas**, el ítem queda `Inventariado: Exhibición` |
| ¿Apareció `"Complete cantidad, unidad, fecha y lote para continuar."`? | **Nunca** — ni en la 1.ª ni en la 2.ª captura sin lote |
| ¿Qué llegó a la nube con el lote vacío? | `nu_batch = ''` y `da_expiration = 2026-08-18T04:00:00` (default de HOY) |
| ¿Y cuando SÍ se llena el lote? | `TM01` viajó con `nu_batch='QA-INV-0818'` y cuadró en la nube ✅ |

📌 **Contraste directo con la regla graduada:** en `el_palmar` / `grupo_fiel` / `kron`, con la VG en `true`, INVENTARIOS rechazaba con el lote vacío. Acá, con la VG en `false`, **no rechaza**. ⇒ **la regla "el campo bloqueante es el LOTE y el alcance es por módulo" se sostiene, y esta corrida aporta su primer contrafactual medido con el campo vacío**: la VG discrimina de verdad, no es cosmética. La receta barata (leer `required` del `ion-input` "Lote" o el valor plano en `<modulo>LogicService`) predijo el resultado sin provocar el rechazo.

---

## ⚠ EL CASO QUE ROMPIÓ EL MOTOR DE COTEJO — **EJERCIDO Y VALIDADO DE PUNTA A PUNTA**

**Mismo producto (`LLA-01`) en DOS ubicaciones dentro del mismo inventario: exh 7 y dep 3.**

| Capa | Evidencia de que **NO se fusionan** |
|---|---|
| UI · modal | Al reabrir `LLA-01` desde el segmento **Depósito**, el modal abre **VACÍO** (`cantidad=""`, `lote=""`) con cabecera `Depósito - 1` — no arrastra la captura de Exhibición |
| UI · ítem de lista | Pasa a rotular **`Inventariado: Exhibición / Depósito`** |
| UI · Tab Resumen | **Una sola fila** para `LLA-01` con **dos columnas**: `Exhibición 7 UNIDADES` │ `Depósito 3 UNIDADES` — oráculo visual barato, sin abrir nada |
| BD local | 1 `client_stocks_details` (`co_client_stock_detail=1787086673043.0`) + **2** `client_stocks_details_units` (`...673044.1` exh / `...708748.1` dep) |
| Nube | 1 `client_stock_detail` (id 421) + **2** `client_stock_detail_unit` (id 424 exh / 425 dep) |
| 🔴 **Clave de negocio** | Las dos unidades comparten **`co_product_unit='LLA-011'`** y solo se distinguen por su PK **`co_client_stock_detail_unit`** — exactamente la colisión que rompía el motor |
| Motor `cotejo-payload.js` | **`BD-FIELD-OK`, 0 mismatches**, con `payload 2 = nube 2` en la tabla de unidades de `LLA-01` |

⇒ **El arreglo del motor queda validado en su 2.º caso real** (tras `kron-20260817`), ahora con **3 unidades y 2 detalles** en el mismo registro. Sin la corrección, las dos filas `LLA-011` habrían colisionado por clave y el cotejo habría reportado un falso mismatch.

---

## Descubrimientos

### ✅ Pendiente del YAML resuelto por este módulo

| # | Pendiente | Resolución medida |
|---|---|---|
| 4 | Alcance real de `requiredComment` | 🔴 **En INVENTARIOS el comentario NO es obligatorio.** `ion-input#responsable` llega `required=false`, la propia UI rotula **"Mín. 0 - Máx. 255 caracteres"**, y el 2.º inventario se **guardó** con el comentario vacío. ⇒ **4.º módulo de la serie donde `requiredComment=true` no aplica** (pedidos, devoluciones e inventarios de esta corrida; en grupo_fiel aplicaba solo a cobros). **`maxlength` real = 255**, no el `longitudComentario=250` del perfil — 3.er módulo con el mismo desfase |

### 🔴 El buscador del Tab Inventario **NO filtra on-keyup en este build** — exige la lupa

Contradice `[kron-20260817]`, donde `input[placeholder="Búsqueda de productos"]` sí filtraba al teclear.

| Acción | Resultado |
|---|---|
| Teclear `LLA-01` y esperar 1,5 s | **36 familias** — sin filtrar |
| Click en `ion-icon[name="search-circle-sharp"]` | **1 solo ítem**, código exacto `LLA-01` |

⇒ En este módulo conviven **tres buscadores con dos comportamientos**: el de **productos** y el de **clientes** exigen la lupa; el `ion-searchbar` de la **lista BUSCAR** filtra on-keyup. **No unificarlos.**

### ⚠ El buscador de productos **conserva el texto entre búsquedas del mismo formulario** (reconfirma PEDIDOS/DEVOLUCIONES)

Al pasar de `LLA-01` a `TM01` el `input.search-input.inputsSearch` conserva el texto anterior. Se vació con **Backspace** leyendo `input.value.length` antes de teclear, y ambos SKU resolvieron a **match único con código exacto** (`LLA-01` → 1 · `TM01` → 1), sin caer en la trampa del substring.

### ✅ `client_avg_product` explica el "Pedido Sugerido" sin cantidades — es DATO, no defecto

| Medición | Valor |
|---|---|
| Filas en `client_avg_product` | **24** (todas con `average > 0`) |
| Clientes distintos cubiertos | **2** de 7.966 |
| Filas para `006831` | **0** |
| Filas para `LLA-01` / `TM01` | **0** |

⇒ La rama vieja (`getClientAvgStock`) no encuentra promedio para este cliente y el modal no puede rotular una cantidad. **Coherente con `[difranca-20260813]` / `[grupo_fiel-20260817]`; no es defecto.** Los días (1/1) sí se calculan y llegan a la nube.

### ⚠ El searchbar de la lista **SÍ encuentra por Nro. Ref acá** — contrasta con DEVOLUCIONES

| Término | INVENTARIOS | DEVOLUCIONES (mismo build, misma corrida) |
|---|---|---|
| Cliente / código | filtra ✅ | filtra ✅ |
| **Nro. Ref** (`52` / `351`) | **1 resultado ✅** | **0 resultados** (H-3 de devoluciones) |
| Estatus (`Guardado`) | 0 | 0 |

⇒ **Refuerza H-3 de DEVOLUCIONES**: no es una limitación del componente ni del build, porque el mismo `ion-searchbar` de INVENTARIOS **sí** cubre la Ref. Es una diferencia de implementación entre módulos. *(No se levanta como hallazgo de INVENTARIOS: acá el comportamiento es el correcto.)*

### ⚠ Etiquetas de alert medidas en este módulo (leídas, nunca predichas)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Guardar · paso 1 | `Denario Inventario` | `¿Desea guardar el Inventario?` | `[Cancelar, **Aceptar**]` |
| Guardar · paso 2 | `Denario Inventario` | `Inventario guardado con éxito` | `[**OK**]` |
| Enviar · paso 1 | `Denario Inventario` | `¿Desea enviar el Inventario?` | `[Cancelar, **Aceptar**]` |
| Enviar · paso 2 | `Denario Inventario` | `El Inventario será enviado` | `[**OK**]` |
| Enviar · paso 3 | `Denario Premium` | `Inventario nro. 53 enviado exitosamente` | `[**OK**]` |
| Borrado | `Denario Inventarios` (**plural**) | `¡EL Inventario se borro con exito!` | `[**OK**]` — **sin confirmación previa** |

**Capitalizados, no en mayúsculas** — como DEVOLUCIONES y al contrario de PEDIDOS de esta misma corrida. **Los 11 alerts del módulo se resolvieron sin un solo reintento** recorriendo `['Aceptar','OK','Eliminar']` por igualdad exacta case-insensitive con filtro `width>0`. Los títulos vuelven a ser inconsistentes dentro del módulo (`Denario Inventario` / `Denario Inventarios` / `Denario Premium`) — **leer el `.alert-message`, nunca matchear el título**.

### Otras confirmaciones

- **Selector de EMPRESA — 6.ª confirmación de la variante "objeto completo"**: 1 solo `ion-select`, **sin `formcontrolname`**, `disabled=**true**`, `value` = objeto de 9 claves, `ng-valid`, shadowRoot `CORPORACION FERRE 19` ⇒ **no se tocó nada** y el envío viajó con `idEnterprise:1` / `coEnterprise:"FERRE_N"`. *(⚠ Difiere de `[kron-20260817]`, donde INVENTARIOS llegaba `disabled=false`: reconfirma que la variante la fija el formulario y hay que **leerla siempre**.)*
- **Oráculo de build v21 confirmado en La Tortuga** (`min="0"` en cantidad) — 4.ª playa. Modal multi-fila `ion-card.capture-row-card` + `.add-lot-button` + `.save-btn`; unidad preseleccionada `UNIDADES` y fecha = HOY; solo cantidad y lote nacen vacíos.
- **`.save-btn` con `pg.mouse.move()` previo abrió/cerró el modal 3 de 3** — no hizo falta el shadowRoot ni el Pointer+Mouse combinado.
- **El modal de captura abre con `pg.mouse.click` SIMPLE** (4.ª confirmación) tras `scrollIntoView({block:'center'})` + ~900 ms + **re-leer el rect**. 0 `ion-popover` residuales en las 4 aperturas.
- **`#clienteSelectModal` sin paginar pese a 1.569 clientes**: `006831` fue el **ítem 0 de 50** en las 2 aperturas; `waitForFunction` sobre `show-modal` + `ion-item.length>0` resolvió a la 1.ª. Su `input` sí trae `placeholder="Clientes..."` acá, pero **anclar por `input.search-input.inputsSearch`**.
- **Guardar deja el form pristine en INVENTARIOS**: el back desde un form recién Guardado **no** dispara dirty-guard (igual que DEVOLUCIONES, al contrario de PEDIDOS de esta corrida). Tampoco lo disparó al salir del form **reabierto** sin cambios.
- **Guardar habilita con el formulario casi vacío — 3.ª confirmación**: con solo el cliente y **cero capturas**, `.imagenGuardar` está `disabled=false` y el guardado completa; **`.imagenEnviar` sigue `disabled=true`** hasta que hay ≥1 captura. Reproduce `[grupo_fiel-20260817]` + el matiz de `[kron-20260817]`. *(No se levanta como hallazgo: en INVENTARIOS el envío sí valida y el registro vacío no puede llegar a la nube.)*
- **`st_delivery=NULL` en las cabeceras bajadas del servidor — reconfirmado**: el Ref 52 (cargado por la QA) llega a `client_stocks` local con `st_delivery=NULL`; solo los creados en el device traen `3` (guardado) o `1` (enviado).
- **La lista BUSCAR OCULTA los botones INVENTARIO/BUSCAR** (`colorBorderBuscar` = 0 visibles) ⇒ back al home del módulo antes de crear otro inventario.
- **Trash sin confirmación previa y con borrado en cascada local** (`client_stocks` y `client_stocks_details` a 0) — reconfirma 6 corridas.
- **`clickBack`** (`img.fechaAtras` filtrando `width>0` → `closest('a')` → `mouse.click`) funcionó en form, lista y home del módulo, y devolvió la app a **HOME** limpia.

---

## Hallazgos

### 🟠 H-1 · La guarda de GPS también bloquea la navegación de INVENTARIOS — **~87 s sin indicación útil** (3.ª confirmación, y la peor medición de la corrida)

**Supera el gate de §4.b:** reproduce **hoy**, en la build bajo prueba, y se midió **dos veces** en este módulo con registros nuevos.

Es **el mismo mecanismo** ya establecido en PEDIDOS (30,3 s) y DEVOLUCIONES (43,1 s): con `userMustActivateGPS=true`, la navegación vive dentro del `.then()` del fix de GPS y la caché de posición expira a los 60 s. **Este es el tercer módulo afectado ⇒ el defecto es de la guarda de GPS, no de un módulo concreto** — no se levanta como defecto nuevo, se aporta como confirmación y como **corrección del techo de espera**.

| Acción | Espera hasta que aparece `app-inventario` |
|---|---|
| Entrar al módulo desde HOME (no pasa por la guarda) | **1,10 s** |
| 1.er `INVENTARIO` (caché fría) | **> 61 s** (dos tramos de sondeo; el click se dio por consumido y se repitió) |
| 2.º `INVENTARIO` medido en una sola llamada, caché fría | **~87 s** (85,6 s sin form + el tramo siguiente) |
| Reabrir un Guardado desde la lista (DM-INV-026) | **2,97 s** — **esta navegación NO atraviesa la guarda** |

**Matiz nuevo respecto de DEVOLUCIONES:** acá **sí hay un `ion-loading` visible durante toda la espera** (`ld=1` en los 8 sondeos, de 237 ms a 73,4 s), pero **con el mensaje vacío** — es un backdrop sin texto ni explicación. No es "la app se ve congelada" como en devoluciones, pero **tampoco le dice al vendedor qué está esperando ni cuánto falta**, y a los 87 s es indistinguible de un cuelgue.

**Impacto:** no se pierden datos y termina navegando ⇒ no es FAIL funcional, es **feedback / rendimiento percibido**. El costo real es de campo: un vendedor que entra a tomar inventario espera **minuto y medio** sin saber por qué.

🔴 **Corrección al costo de automatización — el techo sube otra vez:** DEVOLUCIONES elevó la recomendación de ≥35 s a **≥60 s**; acá **60 s tampoco alcanzan** (~87 s medidos). ⇒ **el techo debe ser ≥ 120 s** en cualquier navegación que atraviese la guarda de GPS, o el caso se marca BLOCKED por infra sin serlo.

⚠ **Efecto secundario que costó una llamada:** `pg.waitForFunction` sobre el `pg` de CDP **ignoró el `timeout` que se le pasó y cortó a los 30.000 ms** (`page.waitForFunction: Timeout 30000ms exceeded` con `{timeout:70000}`). Para esperas largas hay que **sondear a mano** con `page.waitForTimeout` en bucle.

**Sugerencia para desarrollo (sin cambios):** `ion-loading` **con mensaje** («Obteniendo ubicación…») mientras se resuelve el fix, y/o techo con fallback a `getLatestPosition()`.

*(No se levantan, con evidencia: el botón "Pedido Sugerido" con la VG en `false` — divergencia ya documentada en 10 playas y explicada por datos; el envío sin firma con `signatureStock=true` — la VG habilita, no obliga (QA 2026-07-29); Guardar con cero capturas — el envío sí valida y ya está documentado en 2 corridas; `maxlength` 255 vs `longitudComentario` 250 — mismo patrón que PEDIDOS/DEVOLUCIONES y sin oráculo; la reapertura en tab General — defecto conocido DM-INV-026, cosmético.)*

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🟢 **`expirationBatch=false`: 1.er contrafactual medido con el campo VACÍO en INVENTARIOS** | universal | Con la VG en `false`, el `.save-btn` **acepta con el lote vacío**, sin la alerta `"Complete cantidad, unidad, fecha y lote para continuar."`, y la nube guarda `nu_batch=''` + `da_expiration` = HOY. Cierra la regla graduada en `RUNTIME §3` por el otro lado: la VG **sí discrimina**. **Oráculo barato y no destructivo: `input[placeholder="Ingrese lote"].required` (false) + `inventariosLogicService.expirationBatch`.** |
| ✅ **Mismo producto en 2 ubicaciones: validado hasta el motor de cotejo** | universal | 3 unidades / 2 detalles en un registro; las dos de `LLA-01` comparten `co_product_unit='LLA-011'` y solo difieren en `co_client_stock_detail_unit`. `cotejo-payload.js` devolvió **`BD-FIELD-OK`, 0 mismatches** ⇒ **2.º caso real que valida el arreglo del emparejamiento por PK de negocio** (tras `[kron-20260817]`), ahora con 2 productos en el mismo inventario. **Oráculo visual sin abrir nada: la tabla del Tab Resumen con columnas Exhibición │ Depósito.** |
| 🔴 **El buscador de productos del Tab Inventario NO filtra on-keyup en este build — exige la lupa** | universal | `LLA-01` tecleado deja las **36 familias**; el click en `ion-icon[name="search-circle-sharp"]` las baja a **1**. **Contradice `[kron-20260817]`** (allá sí filtraba al teclear) ⇒ **medir por corrida, no extrapolar**. En el mismo módulo: clientes y productos exigen lupa, el `ion-searchbar` de la lista BUSCAR filtra on-keyup. |
| 🔴 **La guarda de GPS bloquea también la navegación de INVENTARIOS — techo ≥ 120 s** | universal | 3.er módulo afectado ⇒ el defecto es **de la guarda**, no del módulo. **~87 s medidos con caché fría**, contra 30,3 s (pedidos) y 43,1 s (devoluciones). **Corrige la recomendación de ≥60 s a ≥120 s.** Matiz: en INVENTARIOS **sí hay un `ion-loading` visible durante toda la espera, pero con mensaje vacío**. La reapertura de un Guardado desde la lista (2,97 s) **no** atraviesa la guarda. |
| 🔴 **`pg.waitForFunction` ignora el `timeout` y corta a 30 s sobre el `pg` de CDP** | universal | `{timeout:70000}` devolvió `page.waitForFunction: Timeout 30000ms exceeded` a los 30,2 s. Para cualquier espera > 30 s (guarda de GPS, sync) **sondear a mano en bucle con `page.waitForTimeout`**, no confiar en el `timeout` de `waitForFunction`. Se lee como "la navegación falló" cuando en realidad seguía en curso. |
| **Selector de empresa: 6.ª confirmación "sin `formcontrolname` + objeto completo", `disabled=true` con 1 empresa** | universal | ⚠ **Difiere de `[kron-20260817]`**, donde INVENTARIOS llegaba `disabled=false`. Reconfirma el corolario: **leer `formcontrolname` + `disabled` + `value` + `ng-invalid` en CADA form**; con `value` objeto y `ng-valid`, no tocar nada. |
| **`requiredComment=true` NO aplica a INVENTARIOS — la UI lo rotula sola** | universal | Además de `required=false`, el propio campo muestra **"Mín. 0 - Máx. 255 caracteres"** bajo el input ⇒ **oráculo de 0 costo**: leer ese texto en vez de provocar el rechazo. `maxlength` real 255 vs `longitudComentario=250`. |
| **`client_avg_product` como pre-chequeo del Pedido Sugerido** | universal | Antes de juzgar el `inventario-sugerido-modal`, correr `SELECT count(DISTINCT co_client), count(*) FILTER (WHERE co_client='<cliente>') FROM client_avg_product`. Acá: **24 filas / 2 clientes / 0 para el cliente de la corrida** ⇒ sin insumo, el modal no puede rotular cantidad y **no es defecto**. Evita levantar el mismo falso hallazgo por 11.ª vez. |
| **La lista BUSCAR de INVENTARIOS SÍ filtra por Nro. Ref** | universal | `52` → 1 resultado. **Refuerza H-3 de DEVOLUCIONES** (allí `351` → 0): el mismo componente cubre la Ref en un módulo y no en el otro ⇒ es implementación por módulo, no limitación del build. |
| Coords estables (Infinix X6728, 360×744) | cliente | Home inventarios: **INVENTARIO (180,112)** · **BUSCAR (180,181)**. Header: `imagenGuardar` **(267,32)** · `imagenEnviar` **(326,32)** · back **(32,~31)**. Tab Inventario: buscador **(180,151)** · lupa **(325,~150)**. Modal de captura: cantidad **(180,241)** · lote **(180,303)** · `.save-btn` **(321,64)**. Tab Resumen: `botonAddAmarillo` **(180,366)**. Lista: searchbar **(180,109)** · 1.er ítem **(152,205)** · trash **(300,205)**. Modal de clientes: input **(180,97)** · lupa **(325,96)** · ítem 0 **(180,222)**. |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Resumen técnico

**15 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED · 0 cuelgues de CDP.** Wall-clock ≈ 38 min (de los cuales **~2,5 min fueron pura espera de la guarda de GPS**), **34 `browser_run_code_unsafe`**, 0 reintentos de alert (11/11 a la primera).

1. **`expirationBatch=false` NO exige lote ni fecha — verificado, no asumido.** Se leyó la VG en vivo (`inventariosLogicService.expirationBatch=false`), se leyó `required=false` en el `ion-input` "Lote" y, sobre todo, **se midió con el campo VACÍO**: el `.save-btn` aceptó **dos** capturas sin lote, sin ninguna alerta de validación, y la nube guardó `nu_batch=''`. Es el **contrafactual** de la regla graduada en `RUNTIME §3` con `el_palmar`/`grupo_fiel`/`kron`: la VG discrimina de verdad. Cuando el lote **sí** se llena (`TM01` → `QA-INV-0818`), también cuadra.
2. **El caso que rompió el motor de cotejo quedó EJERCIDO Y VALIDADO.** `LLA-01` en **exh 7 + dep 3** dentro del mismo inventario: la app las trata separadas en las 5 capas (modal vacío al reabrir desde la otra ubicación, rótulo `Inventariado: Exhibición / Depósito`, tabla del Resumen con 2 columnas, 2 filas en la local, 2 filas en la nube) y **`cotejo-payload.js` devolvió `BD-FIELD-OK` con 0 mismatches** pese a que ambas unidades comparten `co_product_unit='LLA-011'`. 2.º caso real que valida el emparejamiento por PK de negocio.
3. **Inventario Ref 53 Enviado, `BD-OK` + `BD-FIELD-OK`**: cabecera 16/16 campos, 2 detalles y 3 unidades cuadran payload ↔ nube; diff de baseline filtrado por `id_user=470` exactamente **+1** (1 → 2, `count(*) = count(DISTINCT co_client_stock)`), colas vacías, **1 solo POST**, **sync inmediata**, y 2.º pase de baseline al cierre sin cambios.
4. **`requiredComment=true` NO aplica a INVENTARIOS** (pendiente #4 del YAML cerrado para el 4.º módulo): `required=false`, la UI rotula "Mín. 0 - Máx. 255 caracteres" y el 2.º inventario se guardó sin comentario. `maxlength` real **255** vs `longitudComentario=250`.
5. **Round-trip §9 perfecto**: al reabrir el Guardado (2,97 s), cliente, comentario, las 3 capturas y el modal de `LLA-01` (cantidad 7, lote vacío, fecha HOY) llegaron intactos. DM-INV-026 reconfirmado: abre en tab **General**, cosmético.
6. **Un solo hallazgo abierto — H-1**, y es **confirmación de un defecto ya establecido**: la guarda de GPS bloquea también la navegación de INVENTARIOS, **~87 s** medidos con caché fría (vs 30,3 s en pedidos y 43,1 s en devoluciones). **Corrige el techo de espera de ≥60 s a ≥120 s.** Matiz nuevo: acá sí hay un `ion-loading` durante la espera, pero **sin mensaje**.
7. **El Pedido Sugerido sin cantidades está explicado por datos, no por un defecto**: `client_avg_product` tiene 24 filas de solo 2 clientes y **cero** para `006831`. Se cerró el modal con `dismiss(null,'cancel')` para no crear un pedido.
8. App devuelta a **HOME** (`app-home`, 0 alerts, 0 modals, 0 loadings) para el módulo siguiente (VISITAS). El inventario creado solo para probar el borrado quedó **eliminado** y **nunca llegó a la nube**.

---
Agente: **INVENTARIOS** · modelo Opus · RUN_ID `20260818_152824_smoke-completo`
