# WEB · Familias C-HOY (cotejo BD→web) + A## (adjuntos) — run_vzla

**RUN_ID:** `20260818_152824_smoke-completo`
**Cliente:** `run_vzla` · Empresa **CORPORACION FERRE 19, C.A.** (`co_enterprise=FERRE_N`, `id_enterprise=1`)
**Playa:** **La Tortuga** — `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Usuario web:** `***` / `***` (bloque `# USUARIO WEB` de `secrets/qa-credentials.env`)
**Oráculo:** BD nube `run_vzla` vía `automation/db/query.js` · tolerancia 0,01 · insumo `_hoy-manifest.jsonl`
**Modo:** 🔴 READ-ONLY estricto — solo `Buscar`, fechas de filtro, `Consultar` y `Ver adjuntos`.
**No se pulsó** `Descargar adjuntos`, `Editar`, `Eliminar`, `Copiar`, `Nuevo Pedido` ni ningún `submit`.
**🔴 CERO descargas a disco** (ver §Seguridad de datos).
**Fecha:** 2026-08-18 · ventana ≈ 20:31–20:52 UTC

---

## Resumen

| Marca | Casos |
|---|---|
| ✅ PASS | **33** |
| ❌ FAIL | **0** |
| ⏭ SKIP | **0** |
| 🚫 N/A | **0** |
| **Total** | **33** |

| Familia | Casos | Veredicto |
|---|---|---|
| **C-HOY** — cotejo BD→web de los 5 registros de la QA | 10 | **5/5 `WEB-OK`** — ningún `WEB-MISSING`, ningún `WEB-FIELD-MISMATCH`, ningún `WEB-CALC-MISMATCH` |
| **A##** — adjuntos | 23 | **19/19 recursos responden `200`** con el `content-type` correcto |

---

## 🔴🔴 VEREDICTO SOBRE `clientesPotenciales` 193 — **EL PENDIENTE DEL RUTERO QUEDA CERRADO**

`clientesPotenciales` era el **último módulo sin muestra posterior al fix del rutero**. El registro
**193 "Emma"** (creado hoy 18/08 15:01:49, `nu_attachments=4`, `has_attachments=true`) lo cierra:

| Comprobación | Resultado |
|---|---|
| Botones `Descargar Adjunto` / `Ver adjuntos` | **presentes y `disabled=false`** (por el camino honesto, sin forzar `onclick` sobre un control inerte) |
| El visor abre | ✅ `.ui-dialog` "Adjuntos" con `getComputedStyle(d).display === 'block'` |
| Imágenes en el visor | **2**, ambas `complete=true` con `naturalWidth=720 × naturalHeight=1600` ⇒ **pintan de verdad**, no son placeholders rotos |
| URL de las imágenes | `http://denariolatortuga.ddns.net:8080/**denario**/resources/images/**clientes**/193_{0,1}.jpeg?pfdrid_c=true` |
| 🔴 `localhost:8282` | **NO aparece en ninguna parte** |
| HTTP de los 2 `.jpeg` | **`200` · `image/jpeg` · 108.052 B y 93.205 B** |
| HTTP del documento `193_0.pdf` | **`200` · `application/pdf` · 5.013 B** (en `/denario/resources/**files**/clientes/`) |
| HTTP de la firma `193_0.jpg` | **`200` · `image/jpeg` · 5.731 B** |
| La firma se pinta en el detalle | ✅ `<img id="form:graImaPro" src=".../firmas/clientes/193_0.jpg">`, cargada y visible |
| Control negativo de contexto | `/**DenarioPremium**/resources/images/clientes/193_0.jpeg` → **`404`** ⇒ confirma que el contexto correcto es `/denario` |
| Control negativo de archivo | `clientes/999999_9.jpeg` → **`404` `text/html`** ⇒ el servidor **404 de verdad**, no devuelve HTML con `200` |

⇒ **`clientesPotenciales` responde igual que los otros 5 módulos. El defecto del rutero
(visor apuntando a `localhost:8282` y descarga devolviendo HTML) NO reproduce en este módulo
con un registro posterior al fix.** El último módulo pendiente queda cubierto.

---

## FAMILIA A## — adjuntos · **19/19 recursos en `200`**

Medido con `page.request.get()` (diagnóstico definitivo del rutero, `_comunes.md [kron-20260817]`):
devuelve `status` + `content-type` + `content-length` **sin disparar ninguna descarga**.

| Caso | Módulo · Ref | Recurso | Status | Content-Type | Bytes |
|---|---|---|---|---|---|
| DW-CPO-ADJ-02 | clientes 193 | `images/clientes/193_0.jpeg` | **200** | `image/jpeg` | 108.052 |
| DW-CPO-ADJ-02 | clientes 193 | `images/clientes/193_1.jpeg` | **200** | `image/jpeg` | 93.205 |
| DW-CPO-ADJ-03 | clientes 193 | `files/clientes/193_0.pdf` | **200** | `application/pdf` | 5.013 |
| DW-CPO-ADJ-04 | clientes 193 | `images/firmas/clientes/193_0.jpg` | **200** | `image/jpeg` | 5.731 |
| DW-VIS-ADJ-02 | visitas 2080 | `images/visitas/2080_{0,1}.jpeg` | **200** ×2 | `image/jpeg` | 93.205 · 108.052 |
| DW-VIS-ADJ-03 | visitas 2080 | `files/visitas/2080_0.**xlsx**` | **200** | `…spreadsheetml.sheet` | 570.468 |
| DW-VIS-ADJ-04 | visitas 2080 | `images/firmas/visitas/2080_0.jpg` | **200** | `image/jpeg` | 4.877 |
| DW-INV-ADJ-02 | inventarios 52 | `images/inventarios/52_{0,1}.jpeg` | **200** ×2 | `image/jpeg` | 108.052 · 93.205 |
| DW-INV-ADJ-03 | inventarios 52 | `files/inventarios/52_0.pdf` | **200** | `application/pdf` | 5.013 |
| DW-INV-ADJ-04 | inventarios 52 | `images/firmas/inventarios/52_0.jpg` | **200** | `image/jpeg` | 5.331 |
| DW-PED-ADJ-02 | pedidos 2819 | `images/pedidos/2819_{0,1}.jpeg` | **200** ×2 | `image/jpeg` | 108.052 · 93.205 |
| DW-PED-ADJ-03 | pedidos 2819 | `files/pedidos/2819_0.pdf` | **200** | `application/pdf` | 5.013 |
| DW-PED-ADJ-04 | pedidos 2819 | `images/firmas/pedidos/2819_0.jpg` | **200** | `image/jpeg` | 8.918 |
| DW-DEV-ADJ-02 | devoluciones 350 | `images/devoluciones/350_0.jpeg` | **200** | `image/jpeg` | 93.205 |
| DW-DEV-ADJ-03 | devoluciones 350 | `files/devoluciones/350_0.pdf` | **200** | `application/pdf` | 9.120 |
| DW-DEV-ADJ-04 | devoluciones 350 | `images/firmas/devoluciones/350_0.jpg` | **200** | `image/jpeg` | 7.858 |
| DW-ADJ-NEG-01 | — | `/DenarioPremium/resources/images/clientes/193_0.jpeg` | **404** | `text/html` | 818 |
| DW-ADJ-NEG-02 | — | `images/clientes/999999_9.jpeg` | **404** | `text/html` | 814 |

**Total: 9 imágenes + 4 PDF + 1 XLSX + 5 firmas = 19 recursos, 19 en `200`.**

### El visor abre en los 5 módulos y las imágenes pintan

| Módulo · Ref | Botones | Visor `display` | Imágenes cargadas |
|---|---|---|---|
| clientes 193 | ambos `disabled=false` | `block` | **2/2** (720×1600) |
| pedidos 2819 | ambos `disabled=false` | `block` | **2/2** |
| inventarios 52 | ambos `disabled=false` | `block` | **2/2** |
| devoluciones 350 | ambos `disabled=false` | `block` | **1/1** |
| visitas 2080 | ambos `disabled=false` | `block` | **2/2** |

El visor se **cerró siempre** tras leerlo (`.ui-dialog-titlebar-close`, verificado `display:none`),
para no dejarlo robando clicks (`_comunes.md [grupo_fiel-20260817]`).

### Oráculo de conteo — se cumple la regla de kron, con **una excepción**

El oráculo es `transaction_image ∪ transaction_files`, **nunca `nu_attachments`**:

| Módulo | Ref | `transaction_image` | `transaction_files` | `transaction_signatures` | Σ img+files | `nu_attachments` |
|---|---|---|---|---|---|---|
| pedidos | 2819 | 2 | 1 | 1 | **3** | **3** ✅ |
| inventarios | 52 | 2 | 1 | 1 | **3** | **3** ✅ |
| visitas | 2080 | 2 | 1 | 1 | **3** | **3** ✅ |
| devoluciones | 350 | 1 | 1 | 1 | **2** | **2** ✅ |
| **clientes** | **193** | 2 | 1 | 1 | **3** | **4** ⚠ |

⚠ **Observación (móvil/servicio, no web):** en 4 de los 5 módulos `nu_attachments` **excluye la firma**
—coherente con `[kron-20260817]`— pero en **clientes potenciales la incluye** (`4 = 2+1+1`).
El criterio de conteo **no es homogéneo entre módulos**. No afecta a la web (que no muestra el contador)
pero sí invalida cualquier oráculo que use `nu_attachments` de forma uniforme.

---

## FAMILIA C-HOY — cotejo BD → web, registro por registro

### `clientesPotenciales` ref **193** — `WEB-OK` (10/10 campos)

Localizado por **vendedor `470` + rango `18/08–18/08`** (este módulo **no tiene filtro `# Ref`**,
confirmado por F##), y verificado por la columna `# Ref` de la lista.

| Campo del detalle | Web | BD (`potential_client`) | ✓ |
|---|---|---|---|
| `Código:` (epoch) | `1787079674558.0` | `co_client = 1787079674558.0` | ✅ |
| `Fecha de Registro:` | `18/08/2026 15:01:49` | `da_client = 2026-08-18T19:01:49Z` (UTC−4) | ✅ |
| `Nombre:` | `Emma` | `na_client = Emma` | ✅ |
| `Vendedor:` | `000208` | `co_user = 000208` | ✅ |
| `Cédula::` | `27372717` | `nu_rif = 27372717` | ✅ |
| `Comentario:` | `tq` | `tx_client = tq` | ✅ |
| `Web:` | `f` | `na_web_site = f` | ✅ |
| `Responsable:` | `gv` | `na_responsible = gv` | ✅ |
| `Correo:` | `g@gmail.com` | `em_client = g@gmail.com` | ✅ |
| `Teléfono:` | `27372727` | `nu_phone = 27372727` | ✅ |
| `Dirección:` | `Valle` | `tx_address = Valle` | ✅ |
| `Dirección Entrega:` | `Valle` | `tx_address_dispatch = Valle` | ✅ |
| `Coordenada de transacción:` | `11.0490221,-63.864987` | `coordenada` idéntica | ✅ |

⚠ El detalle **no muestra `No. de Ref.`** — limitación conocida del módulo (`_comunes.md`): la única
llave del detalle es el **epoch**, y coincide. **No es defecto.**
⚠ `Vendedor` muestra solo `000208` — **por diseño** (`WEB-RUNTIME §5.b`).

### `pedidos` ref **2819** — `WEB-OK` (campos + cálculo)

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` | `2819` | `id_order 2819` | ✅ |
| `Código pedido` | `1787079549853.0` | `co_order` | ✅ |
| `Fecha del pedido` | `18/08/2026 15:00:05` | `da_order 19:00:05Z` | ✅ |
| `Estatus` | `Enviado` | `st_order = 1` | ✅ |
| Cliente | `006831 · FERRETERIA EPA, C.A` | idem | ✅ |
| `Condicion de pago` | `CONTADO` | `co_payment_condition '005' → CONTADO` | ✅ |
| `Comentario` | `ped1` | — | ✅ |
| `Total items` (lista) | `2` | `nu_details = 2` | ✅ |
| `Monto Base Pedido` | `409,07 US$` | `nu_amount_total_base 409.07` | ✅ |
| `Monto Total Pedido` | `409,07 US$` | `nu_amount_total = nu_amount_final = 409.07` | ✅ |

**Oráculo de cálculo — cuadra al céntimo:**

| Línea | Precio base | Cant. | Subtotal web | `order_detail` |
|---|---|---|---|---|
| AB04 · ABRAZADERA 12mm | `3,55 US$` | 5 UNIDADES | `17,75 US$` | `nu_price_base 3.55` · `nu_amount_total 17.75` · **`iva 0.0000`** |
| CDR001 · CILINDRO 60MM 100% BRONCE | `10,87 US$` | 36 UNIDADES | `391,32 US$` | `nu_price_base 10.87` · `nu_amount_total 391.32` · **`iva 0.0000`** |
| | | | **Σ = 409,07** | `= Monto Base = Monto Total` |

⇒ **`Base == Total` es CORRECTO**: `order_detail.iva = 0` y `nu_amount_tax = 0` en las **dos** líneas.
🚫 **NO se reporta "el IVA no se calcula".**

### `inventarios` ref **52** — `WEB-OK`

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` | `52` | `id_client_stock 52` | ✅ |
| `Código inventario` | `1787079487278.0` | `co_client_stock` | ✅ |
| `Fecha de inventario` | `18/08/2026 14:58:07` | `da_client_stock 18:58:07Z` | ✅ |
| `Comentario` | `inv1` | `tx_comment = inv1` | ✅ |
| Estatus (lista) | `Enviado` | `st_client_stock = 1` | ✅ |
| Cliente / Empresa | `006831 FERRETERIA EPA` / `CORPORACION FERRE 19, C.A.` | idem | ✅ |

**Líneas — 4/4 exactas contra `client_stock_detail_unit`, incluida la ubicación:**

| Producto | Web `Depósito` | Web `Exhibición` | BD `ubicacion` / `qu_stock` | ✓ |
|---|---|---|---|---|
| CDR002 | `2.00 UNIDADES` | `-` | `dep` / `2.0000` | ✅ |
| CDR001 | `-` | `7.00 UNIDADES` | `exh` / `7.0000` | ✅ |
| ABS02 | `-` | `8.00 UNIDADES` | `exh` / `8.0000` | ✅ |
| ABS01 | `-` | `10.00 UNIDADES` | `exh` / `10.0000` | ✅ |

✅ Se reconfirma el patrón de `_comunes.md`: **la ubicación no es una columna**; `exh` se expresa
poniendo la cantidad en **Exhibición** y dejando **Depósito = `-`**.
✅ `Lote` y `Fecha expiración` no se muestran — coherente con `expirationBatch=false` y `nu_batch=''`.

### `devoluciones` ref **350** — `WEB-OK`

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` | `350` | `id_return 350` | ✅ |
| `Fecha devolución` | `18/08/2026 15:00:10` | `da_return 19:00:10Z` | ✅ |
| Cliente | `006831 · FERRETERIA EPA, C.A` | idem | ✅ |
| `Responsable` | `gv` | — | ✅ |
| `Tipo de devolución` | `Calidad` | `id_type = 60 → return_type.na_type 'Calidad'` | ✅ |
| `Precinto` | *(vacío)* | `nu_seal = ''` | ✅ |
| `Observaciones` | `dev1` | `tx_description = dev1` | ✅ |
| Estatus (lista) | `Enviado` | `st_return = 1` | ✅ |

**Línea única — cuadra contra `return_detail`:**
`BALP02 · BALANCIN METALICO PARA POCETA` · `N° Factura 7274727` (= `co_document`) ·
`Motivo Error del Cliente` (= `id_motive 41 → return_motive`) · `Cantidad 7` (= `qu_product 7.0000`) ·
`Lote` y `Fecha vencimiento` **vacíos** (= `nu_lote ''`, `da_duedate NULL`). ✅

✅ **Devoluciones no maneja montos** — no se construyó oráculo de importes (`WEB-RUNTIME §7`).

### `visitas` ref **2080** — `WEB-OK`

⚠ La lista puede traer **varias filas por visita** (una por actividad). Esta visita tiene **1**
`incidence` ⇒ **1 fila**, que es lo que devolvió (`Total de Resultados: 1`). **No hay duplicado.**

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` | `2080` | `id_visit 2080` | ✅ |
| `Fecha planeada de visita` | `18/08/2026 14:57:32` | `da_visit 18:57:32Z` (UTC−4) | ✅ |
| `Vendedor` | `000208 000208` | `co_user 000208` / `id_user 470` | ✅ |
| `Orden de visita` | `1` | `nu_sequence = 1` | ✅ |
| Cliente / Empresa | `006831 FERRETERIA EPA` / `CORPORACION FERRE 19, C.A.` | idem | ✅ |
| `Status` (lista) | `visitado` | `st_visit = 2` | ✅ |
| `Titulo` | `2026-08-18-FERRETERIA EPA, C.A` | — | ✅ |
| Actividad / Motivo / Descripción | `VISITA FUERA DE RUTA` / `VENTA EFECTIVA` / `t1` | 1 fila de `incidence` | ✅ |

⚠ `Geo = Fuera de Rango` — clasificación que calcula la web contra la coordenada de la sucursal.
**Por diseño, no se juzga** (`WEB-RUNTIME §5.b`).
⚠ `Fecha Iniciada` vacía — **local-driven**: campo no informado por el móvil ⇒ se saltea.

---

## Hallazgos

Los dos superan el gate **§5.a** (reproducen **hoy**, sobre registros creados **hoy**, en la versión
bajo prueba), pero **ninguno es una regresión**: se reproducen también en registros viejos, así que
son **defectos vigentes de baja severidad**, no algo que haya introducido esta release.

### 🟡 Hallazgo 1 — `detalleInventario`: la columna **`N°` vale `1` en TODAS las filas**

```
N°  Cod. producto  Producto                              Estructura  Depósito         Exhibición
1   CDR002         CILINDRO 60MM SIST INTER DE BRONCE CJ CILINDROS   2.00 UNIDADES    -
1   CDR001         CILINDRO 60MM 100% BRONCE CJ          CILINDROS   -                7.00 UNIDADES
1   ABS02          INTERRUPTOR SENCILLO ABS              INTERRUPTOR -                8.00 UNIDADES
1   ABS01          TAPA CIEGA ABS                        INTERRUPTOR -                10.00 UNIDADES
```

- **Contraste que lo prueba:** en `detallePedido` la misma columna numera bien (`1`, `2`).
- **Sistemático, no puntual:** se remidió en el inventario **22** (registro viejo, 3 líneas) y también
  sale `1, 1, 1`.
- **Causa probable:** el `N°` se está tomando del índice de la **unidad** dentro del detalle
  (`client_stock_detail_unit`, siempre 1 por producto en este tenant) en vez del índice del producto.
- **Severidad 🟡 baja:** cosmético, no altera cantidades ni ubicaciones. Molesta al leer inventarios
  largos y al citar una línea en un reporte.
- **Gate §5.a:** ✅ reproduce en el inventario **52**, creado hoy. **No reproduce como novedad**:
  ya pasaba en registros anteriores.

### 🟡 Hallazgo 2 — `detalleDevolucion`: la columna **`Devolución en` muestra el CÓDIGO de la unidad, no su nombre**

- Web: `Devolución en = 1`. BD: `return_detail.co_measure_unit = '1'` con
  **`na_measure_unit = 'UNIDADES'`** disponible en la misma fila.
- **Contraste:** `detalleInventario` **sí** usa el nombre (`2.00 UNIDADES`), así que la web sabe
  resolverlo en otras pantallas.
- Los **485** registros de `return_detail` del tenant tienen la misma unidad ⇒ el usuario siempre ve `1`.
- **Severidad 🟡 baja:** cosmético/legibilidad. ⚠ **Con la reserva de que no hay oráculo escrito de qué
  debe mostrar esa columna**: si el diseño pretendía mostrar el código, no es defecto. Se deja como
  observación para que Desarrollo confirme la intención.
- **Gate §5.a:** ✅ reproduce en la devolución **350**, creada hoy.

### 🟢 Observaciones DESCARTADAS por el gate §5.a / §5.b — **no son hallazgos**

| Observación | Por qué NO es defecto |
|---|---|
| «El `IVA :` del pie de `detallePedido` sale **vacío** en vez de `0,00 US$`» | **Es coherente y está declarado en el perfil.** `order_detail.iva = 0` y `nu_amount_tax = 0` en las 2 líneas; `userCanSelectIVA=false`. Los otros campos apagados por VG (`Descuento :`, `Descuento Global:`) también salen vacíos ⇒ patrón uniforme "sin valor ⇒ celda vacía", el mismo criterio ya aceptado para las retenciones sin método de pago |
| «El visor de adjuntos **no muestra el PDF/XLSX**» | El visor es una **galería de imágenes**; el documento existe y responde **`200`** en `/denario/resources/**files**/…`. La vía de usuario para el documento es `Descargar adjuntos` (ZIP), que **no se ejerció por política de no descargar productivos** |
| «`clientesPotenciales` no muestra `No. de Ref.` en el detalle» | Limitación **conocida y documentada** del módulo; la llave del detalle es el epoch, y coincide |
| «La `Firma:` sale vacía en los 5 detalles» | **Artefacto del lector**: `innerText` no ve imágenes. Verificado en el DOM: `<img id="form:graImaPro" src=".../images/firmas/{modulo}/{ref}_0.jpg">` está presente, **cargada y visible** en los 5 |
| «`Fecha Iniciada` vacía en visitas» | **Local-driven**: el móvil no informó el campo ⇒ se saltea (`WEB-RUNTIME §6`) |
| «`Vendedor = 000208` (solo el primer token) en clientes potenciales» | **Por diseño** (`WEB-RUNTIME §5.b`) |
| «`Geo = Fuera de Rango`» | **Por diseño** (`WEB-RUNTIME §5.b`) |

---

## 🔴 Seguridad de datos — **cero descargas, disco limpio**

- **No se pulsó `Descargar adjuntos` en ningún registro.** Toda la verificación se hizo por
  **status HTTP + `content-type`** con `page.request.get()`, que **no genera un `download`** y por
  tanto **no deja cuerpo crudo en `%TEMP%\playwright-artifacts-*\`**.
- **Barrido de cierre POR FIRMA BINARIA** (no por extensión — la trampa de `[kron-20260817]`) en las
  **tres** ubicaciones documentadas, buscando `PK\x03\x04` (ZIP), `\xFF\xD8\xFF` (JPEG) y `%PDF`:

| Ubicación | Archivos inspeccionados | Binarios de adjunto |
|---|---|---|
| `qa-piloto-automatizacion/` (recursivo) | 613 | **0** |
| `DenarioPremiunMovil/.playwright-mcp/` | 1.655 | **0** |
| `qa-piloto-automatizacion/.playwright-mcp/` | 2 | **0** |
| `%TEMP%\playwright-artifacts-*\` | 0 (ninguna carpeta con contenido) | **0** |

⇒ **Ningún adjunto productivo tocó el disco.** No hubo nada que borrar.

---

## Patrones / selectores nuevos

### 🔑 NUEVO — Los **documentos** viven en `/resources/**files**/`, no en `/resources/images/`

`_comunes.md` documentaba solo dos rutas (adjuntos-imagen y firmas). **Falta la tercera**, y su
ausencia produce un falso `404` que se lee como *"el rutero sigue roto para los documentos"*:

```
imágenes  {origin}/denario/resources/images/{carpeta}/{ref}_{n}.jpeg?pfdrid_c=true
firmas    {origin}/denario/resources/images/firmas/{carpeta}/{ref}_{n}.jpg
documentos {origin}/denario/resources/files/{carpeta}/{ref}_{n}.{pdf|xlsx}   ← 🆕
```

**Probado por contraste en la misma tanda:** `images/clientes/193_0.pdf` → **404** ·
`files/clientes/193_0.pdf` → **200 `application/pdf`**. Idem en pedidos, inventarios y devoluciones.
⚠ **La extensión hay que leerla de `transaction_files.na_file`, no asumirla:** visitas 2080 trae
**`.xlsx`** (570 KB, `content-type` de spreadsheet), no un `.pdf`. Asumir `.pdf` da un 404 falso.

### 🆕 Carpeta de `clientesPotenciales` = **`clientes`**, y el `id` de la URL es el **`# Ref`**

`{origin}/denario/resources/images/**clientes**/**193**_0.jpeg` — la carpeta es `clientes`
(igual que `na_transaction` en BD, **no** `clientes_potenciales`), y el número de la URL es el
**`id_potential_client`** (el `# Ref` de la lista), **no** el epoch `co_client`.
Esto reconfirma `[grupo_fiel-20260817]` en el módulo que faltaba.

### 🔑 `page.request.get()` es el único diagnóstico de adjuntos compatible con "no descargar"

Devuelve `status` + `content-type` + `content-length` de los **19** recursos en **una sola llamada**,
sin `waitForEvent('download')`, sin `.playwright-mcp/` y **sin `%TEMP%\playwright-artifacts-*\`**.
⇒ **Es la vía obligatoria cuando el tenant es productivo.** `download.delete()` no hace falta porque
no hay download.
**Siempre con los dos controles negativos en la misma llamada** (contexto `/DenarioPremium` y archivo
inexistente): sin ellos, un `200` no prueba que el rutero funcione — podría estar sirviendo HTML.

### ⚠ La `Firma:` **NO se lee con `#form.innerText`** — es un `<img>`

`innerText` no incluye imágenes ⇒ la regla preferente de `_comunes.md` deja `Firma:` aparentemente
**vacía en los 5 detalles**, lo que se lee como *"la firma no se muestra"*. **Falso.**
El nodo real es estable y **semántico**:

```js
document.getElementById('form:graImaPro')   // <img> de la firma, 150×120
```

⇒ **Verificar la firma por el `<img id="form:graImaPro">` y su `naturalWidth > 0`**, nunca por texto.
(Es además el único `id` no-`j_idt*` del bloque, así que se puede anclar.)

### ✅ El visor de adjuntos: `.ui-dialog` con título `Adjuntos`, anclado por TÍTULO

Los `j_idt*` del diálogo cambian entre módulos (`form:j_idt179` en clientes potenciales). Receta que
funcionó **5/5**:

```js
const d = [...document.querySelectorAll('.ui-dialog')]
  .find(x => /adjunto/i.test((x.querySelector('.ui-dialog-title')||{}).textContent||''));
getComputedStyle(d).display === 'block'      // ⚠ NO offsetParent
```
⚠ Hay **otro `.ui-dialog` siempre presente**: `j_idt49:timeoutDialog` — *"¿Estas Aquí?"* (inactividad).
Filtrar por título evita confundirlos. En esta tanda estuvo siempre en `display:none` y **no robó
ningún click**.

### ✅ `boton.disabled` como oráculo honesto — reconfirmado

Se comprobó `disabled === false` **antes** de invocar `hit()` en los 5 módulos (`[kron-20260817]`).
Los 10 botones (`Descargar adjuntos` + `Ver adjuntos` × 5) vinieron habilitados, coherente con que los
5 registros tienen contenido. **No se forzó ningún `onclick` sobre un control inerte.**

### ✅ Ciclo de 3 llamadas por registro — 5/5 sin reintentos

`navigate(/pages/main)` → `navigate(/pages/{modulo})` → `evaluate(fijar filtro + Buscar)` →
`evaluate(mapa # Ref → botón + hit(consultar))` → `evaluate(leer detalle)`.
El paso por `/pages/main` entre módulos evitó el `IndexOutOfBoundsException` en **los 7 saltos**.
`window.__qaW` (instalado por F## con `addInitScript`) **sobrevivió a las ~14 navegaciones y a los
7 `Consultar`** sin reinstalarse — reconfirma `[kron-20260817]`.

### ⚠ En `clientesPotenciales` hay que **poner fechas a mano** para llegar a un registro de hoy

Sin filtro `# Ref` (confirmado por F##) y con `Limpiar` que **borra** las fechas en vez de resetearlas,
el camino barato al registro del día es:

```js
for (const [,w] of Object.entries(PrimeFaces.widgets)) {
  if (/dateB$/.test(w.id||'')) w.setDate('18/08/2026');
  if (/dateF$/.test(w.id||'')) w.setDate('18/08/2026');
}
```
…y **después** `Buscar`, nunca en la misma `evaluate` que la lectura. Con vendedor `470` + el día,
la lista devuelve exactamente los **2** registros del QA y la columna `# Ref` desambigua.

### ⚠ El detalle de cada módulo expone llaves DISTINTAS — mapa medido en este build

| Detalle | `No. de Ref.` | Epoch (`Código …`) | Estatus en el detalle |
|---|---|---|---|
| `detallePedido` | ✅ | ✅ `Código pedido` | ✅ |
| `detalleInventario` | ✅ | ✅ `Código inventario` | ❌ (solo en la lista) |
| `detalleDevolucion` | ✅ | ❌ | ❌ (solo en la lista) |
| `detalleVisita` | ✅ | ❌ | ❌ (solo en la lista) |
| `detalleClientePotencial` | ❌ | ✅ `Código` | ❌ |

⇒ **Un cotejo que exija ambas llaves en el detalle falla en 3 de 5 módulos.** Cotejar el epoch solo
donde existe, y el estatus **desde la lista** cuando el detalle no lo trae.

> ✅ consolidado 2026-08-19 → `web-selectors/_comunes.md` (3.ª ruta de adjuntos `files/`, `page.request.get()`
> + controles negativos, firma `form:graImaPro`, visor por título, `nu_attachments` no homogéneo, tabla de
> llaves por detalle) + `clientesPotenciales.md` · `inventarios.md` · `devoluciones.md` (nuevos).

---

## Qué revisaría primero

1. **Nada bloqueante en esta tanda.** Los 5 registros del día están completos y correctos en la web,
   y los 19 recursos de adjunto responden.
2. **El criterio de `nu_attachments` no es homogéneo** (clientes potenciales suma la firma, los otros
   4 módulos no) — conviene unificarlo del lado del servicio antes de que alguien lo use de oráculo.
3. **`N°` siempre `1` en `detalleInventario`** (Hallazgo 1) — cosmético pero sistemático y de arreglo barato.
4. **`Devolución en` mostrando el código de unidad** (Hallazgo 2) — confirmar con Desarrollo si es intencional.

---

*Agente WEB · familias `C-HOY` + `A##` · 2026-08-18 · read-only · 33 casos · 0 descargas · oráculo BD `run_vzla`*
