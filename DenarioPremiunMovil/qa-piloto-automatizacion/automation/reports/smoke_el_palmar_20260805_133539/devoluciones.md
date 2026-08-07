# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente QA | el_palmar · empresa **CENTRAL EL PALMAR, S.A. (id 1 / co 1002)** |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Tile Devoluciones → `/devoluciones`, botones **DEVOLUCIÓN** y **BUSCAR** visibles |
| DM-DEV-002 | ✅ PASS | Form abre con tabs **Productos y Adjuntos `disabled`** y sin cliente; Guardar/Enviar `disabled=true` |
| DM-DEV-004 | ✅ PASS | Cliente `1000000803 — C.A. RON SANTA TERESA, S.A.C.A` seleccionado por click real (1er intento, exacto); modal cerró solo; **las 3 tabs habilitaron**. `validateReturn=false` ⇒ NO aparece campo Factura en cabecera (correcto) |
| DM-DEV-006 | ✅ PASS | `responsable`, `precinto`, `comentario` aceptan valores; **Tipo** con popover de 3 opciones, cambiado de Calidad(60, default) a **PostVenta(52)** por click real |
| DM-DEV-011 | 🚫 N/A | VG `validateReturn=false` **probada en el modelo** (`returnLogic.validateReturn`) **y en el DOM** (`ion-input#invoiceSelect` inexistente, `#InvoiceeSelectModal` ausente) ⇒ el selector de factura de cabecera no existe. La factura va **por producto** (`requeridedNroFactura=true`) |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → árbol con **Alcohol 1 · Azucar 8 · PVA 30** → familia Azucar lista sus 8 productos → `160000019` agregado; acordeón expande con **Lote · Nro Factura · Fecha Venc · Cantidad Devuelta · Unidad · Motivo** |
| DM-DEV-014 | ✅ PASS | Con Nro Factura + Cantidad llenos, **Guardar y Enviar habilitaron** (`disabled: true→false`) |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: acordeones **Imágenes** (`value="images"`) y **Firma** (`value="sign"`, canvas 280×220). Sin acordeón Archivo — correcto: `userCanUploadFiles` **efectivo = false** (ver Verificación de VGs) |
| DM-DEV-016 | ✅ PASS | Alert `Denario Devolución` / **"¡Su Devolución se ha guardado!"** — botón **OK** |
| DM-DEV-018 | ✅ PASS | Enviar → **3 alertas**: `¿Desea enviar la devolución?` [Cancelar/**Aceptar**] → `¡Su Devolución será enviada!` [**OK**] → `Devolución nro. **73** enviada exitosamente` [**OK**] → navega al home del módulo |
| DM-DEV-019 | ✅ PASS | BUSCAR lista la devolución con `Nro. Ref`, `Cliente`, `Estatus`, `Fecha: 05/08/2026` |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real: 1 → **0** (`ZZZZNOEXISTE`) → **1** (`SANTA TERESA`) → 1 (limpio). **Trash `ion-button[color="danger"]` solo en Guardado**: el ítem Ref 73 Enviado NO lo expone |
| DM-DEV-022 | ✅ PASS | Reabrir el Guardado: **editable** (`readonly=false`/`disabled=false` en los 4 inputs), 3 tabs accesibles, todos los valores intactos (round-trip §9 abajo) |
| DM-DEV-024 | ✅ PASS | Trash → alert `¿Desea eliminar la devolución?` [Cancelar/**Eliminar**] → la devolución desaparece de la lista, de `returns` **y** `return_details` queda en **0** (sin detalles huérfanos). **Sin alert de éxito post-borrado** (consistente con insumar/globalmp) |

---

## Registros creados en sistema

| Ref | epoch (`co_return`) | Detalle | Empresa efectiva | Estado |
|-----|--------------------|---------|------------------|--------|
| **73** | `1785955947680.0` | Cliente `1000000803 — C.A. RON SANTA TERESA, S.A.C.A` · producto `160000019` AZÚCAR MONTALBAN REFINO PAPEL 20X1KG ×2 FARDO · factura `0092002924` · tipo **52 PostVenta** · motivo **49** · lote `LOTE-QA-0805` · venc. **28/08/2026** · responsable QA AUTOMATION · precinto PREC-8051 | **1002 / id_enterprise 1 — CENTRAL EL PALMAR, S.A.** | **Enviado** (`st_return=1`, `st_delivery=1`) |
| — | `1785957196311.0` | 2ª devolución creada **solo para DM-DEV-024** (producto `160000010`, factura `0092002923` ×1) | 1002 | **ELIMINADA** (borrada en DM-DEV-024, no llegó a la nube) |

> Un 3.er borrador (2 productos con facturas distintas) se usó para probar `multiInvoices` y se descartó sin guardar — **no dejó fila** en `returns` (verificado).

---

## Verificación BD

**Baseline (nube, inicio del módulo):** `return` → `count=3`, `max(id_return)=72`.

### Diff de baseline — toda fila nueva
| id_return | co_return | st_return | co_enterprise | id_enterprise | det |
|---|---|---|---|---|---|
| **73** | `1785955947680.0` | **1** (Enviado) | **1002** ✅ | **1** ✅ | 1 |

Una sola fila nueva, la esperada. **Correlación confirmada: Nro.Ref UI 73 = `id_return` 73.**

### Cotejo campo-a-campo — cabecera `return` (nube)
| Campo | UI / local | Nube | ✔ |
|---|---|---|---|
| `na_responsible` | QA AUTOMATION | QA AUTOMATION | ✅ |
| `nu_seal` | PREC-8051 | PREC-8051 | ✅ |
| `tx_description` (local `tx_comment`) | Devolucion QA smoke 20260805 | idem | ✅ |
| `id_type` | 52 (PostVenta) | 52 | ✅ |
| `co_client` / `na_client` | 1000000803 / C.A. RON SANTA TERESA, S.A.C.A | idem | ✅ |
| `co_enterprise` / `id_enterprise` | 1002 / 1 | **1002 / 1** | ✅ |
| `nu_amount` | — | `null` | ✅ no-mismatch (devoluciones no maneja montos) |
| `has_attachments` / `nu_attachments` | false / 0 | false / 0 | ✅ |

### Cotejo campo-a-campo — `return_detail` (nube)
| Campo | Cargado por UI | Nube | ✔ |
|---|---|---|---|
| `co_product` | 160000019 | 160000019 | ✅ |
| `na_product` | AZÚCAR MONTALBAN REFINO PAPEL 20X1KG | idem | ✅ |
| `qu_product` | 2 | 2.0000 | ✅ |
| `co_measure_unit` / `na_measure_unit` | FAR / FARDO | FAR / FARDO | ✅ |
| **`nu_lote`** | LOTE-QA-0805 | **LOTE-QA-0805** | ✅ |
| **`da_duedate`** | 2026-08-28T14:55 (local) | **2026-08-28T04:00:00.000Z** | ✅ mismo día — desfase horario UTC-4, nota no mismatch (§10.b) |
| `co_document` | 0092002924 | 0092002924 | ✅ |
| `id_motive` | 49 | 49 | ✅ |

### Estado local (`window.sqlitePlugin`)
- `returns`: `co_return 1785955947680.0` → **`id_return=73`, `st_delivery=1`** ⇒ enviado.
- `pending_transactions` (type='return') = **0** · `failed_transactions` (type='return') = **0** ⇒ nada en cola ni rechazado.
- Tras DM-DEV-024: la fila `1785957196311.0` y sus `return_details` desaparecen ⇒ borrado limpio.

### Payload
`returnservice/return` capturado **1 sola vez y con body completo** vía `__qaH.getPayloadData()` (hook heredado del agente LOGIN, no reinstalado). Viaja `coEnterprise:"1002"`, `idEnterprise:1`, `nuLote`, `daDueDate`, `coDocument`, `idMotive:49`, `coInvoice:null`/`idInvoice:null` (coherente con `validateReturn=false`). Volcado a `_payloads.jsonl`.

**Marca final: `BD-OK`** — sync a nube **INMEDIATA** en Isla Coche con este build (contrasta con la sync diferida ~3 min de `[ferrenuestro-2026-07-07]` en el mismo servidor con build anterior).

### Oráculo de persistencia §9 (Guardar → salir → reabrir)
Reabierto el Guardado desde BUSCAR, **cero divergencias**:

| Campo | Guardado | Reabierto |
|---|---|---|
| Cliente | C.A. RON SANTA TERESA, S.A.C.A (1000000803) | idem ✅ |
| Empresa | CENTRAL EL PALMAR, S.A. | idem ✅ (**no revirtió** al `enterprise_default` YARACUY) |
| Tipo | PostVenta (52) — cambiado del default Calidad(60) | **PostVenta (52)** ✅ (cambio conservado) |
| Responsable / Precinto / Comentario | QA AUTOMATION / PREC-8051 / Devolucion QA smoke 20260805 | idem ✅ |
| Lote | LOTE-QA-0805 | idem ✅ |
| Nro Factura | 0092002924 | idem ✅ |
| Cantidad | 2 | 2 ✅ |
| Fecha Venc. | 28/8/2026 | **28/8/2026** ✅ |
| Unidad / Motivo | FARDO(3) / 49 | idem ✅ |

---

## Verificación de VGs

Valores **efectivos leídos de la tabla `global_configuration` de la nube** (autoridad) y contrastados contra la UI:

| VG | Valor efectivo | Comportamiento observado | Veredicto |
|----|---------------|--------------------------|-----------|
| `validateReturn` | **false** (`tipo_variable=G`) | Sin `ion-input#invoiceSelect` en cabecera; tabs habilitan solo con cliente; Nro Factura por producto y obligatorio | ✅ coherente |
| `requeridedNroFactura` | **true** | `Nro Factura` llega `required=true` en cada acordeón de producto; viaja como `coDocument` | ✅ coherente |
| **`expirationBatch`** | **true** | **Lote y Fecha Venc. se renderizan** y funcionan end-to-end (persisten en local, nube y payload). ⚠ **PERO no son obligatorios**: con ambos **vacíos**, Guardar y Enviar habilitaron igual | ⚠ **ver observación 1** |
| `signatureReturn` | **true** | Acordeón **Firma** presente en Tab Adjuntos (canvas 280×220). Se envió **sin firma** y el envío procedió (`nuAttachments=0`) | ✅ **no es defecto** (RUNTIME §5: habilita, no obliga) |
| `userCanUploadFiles` | **false** ⚠ | **No hay acordeón Archivo** en Tab Adjuntos | ✅ coherente — **corrige el YAML** (ver observación 2) |
| `multiInvoices` | **false** | Sin selector de factura en cabecera; el Nro Factura es **por línea**. Se cargaron 2 productos con facturas **distintas** (0092002926 / 0092002927) y **Guardar/Enviar habilitaron sin advertencia** | ⚠ **ver observación 3** |
| `requiredComment` | true, **alcance `tipo_variable=C` (COBROS)** | El comentario **no** es obligatorio aquí (se guardó con él lleno, pero el form validaba antes de tocarlo); tope de campo **255** caracteres (contador `28/255`) | ✅ coherente con el alcance |
| `userMustActivateGPS` | false | Sin prompt de GPS; el payload igual lleva `coordenada: "11.0490664,-63.8650062"` | ✅ coherente |
| `enterpriseEnabled` | true (2 empresas) | Selector de empresa **dentro del form**, preseleccionado en CENTRAL EL PALMAR y editable | ✅ coherente |

### Catálogos — la app SÍ filtra la basura `co_operation='D'`
Verificado **id por id**, no solo por conteo:

| Catálogo | En nube | La app muestra | Veredicto |
|---|---|---|---|
| `return_type` | 1 `I` + 2 `U` + **6 `D`** | **3**: Calidad(60, default) · PostVenta(52) · Servicio(59) | ✅ excluye los 6 `D`; no existe "Despacho" |
| `return_motive` | 23 `I` + 1 `U` + **8 `D`** | **24**, ids 34,36-41,43-59 | ✅ **ninguno** de los 8 `D` (28,29,30,31,32,33,35,42) aparece |

⇒ **No es defecto.** El perfil YAML estimaba "21 motivos legítimos"; el número correcto es **24**.

---

## Observaciones (no FAIL — insumo para QA)

**1. `expirationBatch=true` no vuelve obligatorios Lote/Fecha de vencimiento en DEVOLUCIONES.**
Medido con el par antes/después: con `Nro Factura` + `Cantidad` llenos y **Lote vacío + Fecha Venc. vacía**, `imagenGuardar` e `imagenEnviar` pasaron a `disabled=false`. En INVENTARIOS la misma VG **sí** bloquea (`[el_valle-20260728]`: *"Complete cantidad, unidad, fecha y lote para continuar"*). No lo marco FAIL porque no hay especificación que exija la obligatoriedad en este módulo, pero es una **asimetría de alcance de la VG entre módulos** que conviene confirmar con producto. Los campos, cuando se llenan, **funcionan perfecto** de punta a punta.

**2. El YAML de el_palmar tiene `userCanUploadFiles: true`; el valor efectivo es `false`.**
`global_configuration` (nube) → `userCanUploadFiles = "false"`, `tipo_variable=G`, `da_update 2024-05-22`. El YAML lo tenía marcado ⚠️VERIFICAR asumiendo que ganaba el CLIENT 2026-02-17=true. **Gana el global**: la ausencia del acordeón Archivo es correcta. Corregir el perfil.

**3. `multiInvoices=false` no restringe nada por la vía por-producto.**
Con `validateReturn=false` no hay selector de factura en cabecera —que es donde esta VG tendría efecto—, y el `Nro Factura` es **por línea de producto**. Se cargaron dos productos con **facturas distintas** en una misma devolución y la app habilitó Guardar/Enviar **sin advertencia ni bloqueo**. En la práctica **sí admite más de una factura por devolución**. Si la intención de negocio es "una sola factura por devolución", esto es un hueco de validación; si la VG solo gobierna el selector de cabecera, es correcto. **Requiere confirmación de producto.**

**4. El buscador de productos no filtra en el nivel de familias.**
En el Tab Productos → AGREGAR PRODUCTO, el `input[placeholder="Búsqueda de productos"]` **acepta el texto** (el valor queda en el input) pero la lista `Alcohol 1 / Azucar 8 / PVA 30` **no cambia**, ni con `AZUCAR` ni con `AZÚCAR`, ni por input programático ni por teclado real (2 intentos). No se pudo por tanto reproducir aquí el bug de tildes que reportó PRODUCTOS. Posiblemente el buscador solo filtra **dentro** de una familia ya abierta. No bloquea nada: la vía del árbol funciona.

---

## Selector de producto — cuál de las 3 vías funcionó

**Funcionó la vía (a): entrar por una estructura de nivel 2 (hoja) desde el árbol.** Y con un matiz importante:

> **DEVOLUCIONES no sufre el defecto de PEDIDOS.** El árbol de AGREGAR PRODUCTO muestra directamente las estructuras **con sus contadores reales** — `Alcohol 1 · Azucar 8 · PVA 30` — que son **exactamente los mismos conteos que reportó PRODUCTOS** (8 en Azucar, 30 en PVA). No hubo que expandir nada a mano ni pasar por un nivel 1 vacío: el componente **ya presenta el nivel con productos asignados**. Al entrar a `Azucar` listó sus 8 productos, con `160000019` presente y seleccionable.

⇒ **El defecto "estructura de nivel 1 sin productos" es específico de PEDIDOS, no transversal.** DEVOLUCIONES y PRODUCTOS resuelven bien el subárbol; PEDIDOS es el único que filtra por la estructura sola y devuelve 0.

- Vía (b) **buscador por texto**: no filtra en el nivel de familias (observación 4).
- Vía (c) no hizo falta.

---

## Factura utilizada

Se usó la del perfil: **`0092002924`**. Como `validateReturn=false`, el Nro. Factura es **texto libre por producto** (no hay lista de facturas que validar), así que se cargó tal cual y viajó como `coDocument` a la nube sin objeción.

---

## Lote y vencimiento (`expirationBatch=true`) — primera vez en la serie

Ambos campos **existen, se editan y persisten end-to-end**:

| Punto de control | Lote | Fecha de vencimiento |
|---|---|---|
| Acordeón de producto | `ion-input` con `label="Lote"`, idx **0**, sin `id`, tipo text, `required=false` | `ion-button.letrasFechasButton` (rotula "Fecha") que abre `ion-modal.fechasModal` con `ion-datetime#fechaVence0` |
| Tras cargar | `LOTE-QA-0805` | botón rotula **28/8/2026**, `dt.value = 2026-08-28T14:55:00` |
| Round-trip (reabrir Guardado) | ✅ intacto | ✅ intacto |
| BD local `return_details` | `nu_lote = LOTE-QA-0805` | `da_duedate = 2026-08-28T14:55:00` |
| Payload | `nuLote: "LOTE-QA-0805"` | `daDueDate: "2026-08-28T14:55:00"` |
| BD nube `return_detail` | `nu_lote = LOTE-QA-0805` | `da_duedate = 2026-08-28T04:00:00.000Z` (mismo día, UTC-4) |

⚠ Con la VG en `true` **no son obligatorios** (observación 1).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Selector de empresa de DEVOLUCIONES llega PRESELECCIONADO y sin `formcontrolname`** | universal (candidato) | Con 2 empresas y `enterpriseEnabled=true`, el **1.er `ion-select` visible** de `app-devoluciones` llega con `disabled=false`, `ng-valid` y **`value` = el OBJETO empresa completo** (`{idEnterprise:1, coEnterprise:"1002", lbEnterprise:"CENTRAL EL PALMAR, S.A.", ...}`), **no** un number ni un `formcontrolname="idEnterprise"`. ⇒ **la receta de CLIENTES (`s.value = 1` number + `ionChange`) NO aplica acá** y no hace falta: ya viene resuelto y correcto. **Refuerza la regla "leelo, no lo asumas": el mismo build entrega el select vacío+obligatorio en CLIENTES, preseleccionado en PEDIDOS y preseleccionado-como-objeto en DEVOLUCIONES.** |
| **Campo Fecha de vencimiento: `ion-button.letrasFechasButton` → `ion-modal.fechasModal` → `ion-datetime#fechaVence0`** | universal (candidato) | El `ion-datetime` **existe siempre en el DOM pero con `offsetParent=null`** (vive dentro de un `ion-modal` cerrado) ⇒ leerlo sin abrir el modal da un falso "no hay campo fecha". Abrir con click real en `.letrasFechasButton`; el botón **rotula la fecha elegida** (`28/8/2026`), lo que sirve de oráculo visual. Confirmación de `[gmp-20260730]`: `dt.value` solo cambia **después** de pulsar Aceptar en el `shadowRoot`. |
| **`rectOf` debe validar el CENTRO, no el borde izquierdo** | universal · anti-patrón CDP | Un `ion-item` de lista ocupa el ancho completo ⇒ `getBoundingClientRect().x === 0`. Un chequeo `r.x > 0 && r.x < innerWidth` lo descarta como "fuera del viewport" siendo perfectamente clickeable (falso negativo real en este módulo, costó 1 intento). **Validar `cx = r.x + r.width/2` y `cy = r.y + r.height/2`**, no las esquinas. Complementa las notas de `width>0` y `0<y<innerHeight`. |
| **Alerts de DEVOLUCIONES: el reparto de etiquetas** | cliente el_palmar | Guardado → **OK** · Envío → **[Cancelar/`Aceptar`]** luego **OK** y **OK** · Borrado → **[Cancelar/`Eliminar`]**. Ratifica que la etiqueta se **lee**, no se predice: el orden de preferencia `['Aceptar','OK','Eliminar']` por **igualdad exacta case-insensitive** filtrando `width>0` resolvió los 7 alerts del módulo **sin un solo reintento**. |
| **Namespace propio `window.__qaD` en vez de reinstalar `__qaH`** | universal | Confirma la receta de `[alipascua-20260804]`: se registraron skills propias (`alertInfo`, `alertBtn`, `rectOf`, `homeTile`, `views`, `killLoadings`) bajo `__qaD` sin tocar `__qaH`, y se consumió `__qaH.getPayloadData()` heredado del agente LOGIN. Resultado: **payload capturado 1 sola vez y CON body**. |
| **`window.ng.getComponent(...).returnLogic` tiene campos RxJS que revientan `JSON.stringify`** | universal | `returnValid` / `returnValidToSave` / `returnValidToSend` son **`Subject`**, no booleanos: serializarlos da `Converting circular structure to JSON` y tumba el `evaluate`. Usar los `disabled` de `.imagenGuardar`/`.imagenEnviar` como oráculo de validez, o serializar solo `constructor.name`. |
| **`global_configuration` LOCAL no contiene las VGs de módulo** | universal | La tabla local tiene el esquema `(id_config, clave, valor, descripcion)` y **no trae** `userCanUploadFiles`/`expirationBatch`/etc.; `localStorage.globalConfiguration` tiene ~180 claves y **ninguna** matchea `/upload|file|signature|expiration|batch|invoice|return/i`. **La autoridad es la nube**, donde la columna se llama **`clave`/`valor`** (no `na_variable`/`va_variable`) — ese nombre sí es el de `return_motive`/`return_type`. |
| **Esquema nube de devoluciones difiere del local en nombres** | universal | Nube `return`: **`tx_description`** (local `tx_comment`), `co_client`/`na_client`, sin `id_client` usable como oráculo; nube `return_detail`: PK **`co_detail`** (no `id_return_detail`), y **sí** trae `nu_lote`, `da_duedate`, `co_document`, `id_motive`. |
| **La lista BUSCAR oculta los botones DEVOLUCIÓN/BUSCAR** | cliente el_palmar | Como piercar/alipascua (contrasta dm-electronica): hacer back al home del módulo antes de crear otra devolución. `clickBack` vía `img.fechaAtras`→`closest('a')`+`mouse.click` (filtrando `width>0`) **funciona** en form, lista y home; no hizo falta `ionBackButton`. |
| **La lista paginada de `#clienteSelectModal` PERSISTE entre aperturas** | universal | 2.ª confirmación tras alipascua: los 144 clientes se cargaron con 3 vueltas de `onIonInfinite` en la 1.ª apertura y en la 2.ª y 3.ª ya vinieron completos. **Click real** en el `ion-item` (scrollIntoView → 900 ms → re-leer rect → `mouse.click`) acertó el cliente exacto **3 de 3**; no hizo falta `setClientfromSelector`. En form fresco **no hay alert** de cambio de cliente. |
| **Back desde form nuevo NO guardado no dispara dirty-guard y NO persiste** | cliente el_palmar | El borrador de 2 productos se descartó con el back sin ningún alert y **no dejó fila** en `returns`. Correcto por §4 (lo que sería FAIL es que persistiera). |

---


> ✅ consolidado 2026-08-05
## Hallazgos (FAIL)

Ninguno. 0 FAIL.

---

*Watchdog: 0 cuelgues de CDP · 0 reconexiones · módulo dentro del techo de 45 min.*
