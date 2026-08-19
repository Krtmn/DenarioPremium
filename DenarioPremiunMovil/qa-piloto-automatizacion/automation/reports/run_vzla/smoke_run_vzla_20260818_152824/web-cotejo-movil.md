# WEB · Familia C## (cotejo móvil → web) — run_vzla

**RUN_ID:** `20260818_152824_smoke-completo`
**Cliente:** `run_vzla` · Empresa **CORPORACION FERRE 19, C.A.** (`co_enterprise=FERRE_N`, `id_enterprise=1`)
**Playa:** **La Tortuga** — `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Usuario web:** `***` / `***` (bloque `# USUARIO WEB` de `secrets/qa-credentials.env`)
**Oráculo:** BD nube `run_vzla` vía `automation/db/query.js` · tolerancia 0,01 · insumo `_bd-manifest.jsonl`
**Modo:** 🔴 READ-ONLY estricto — solo `Buscar`, fechas de filtro y `Consultar`.
**No se pulsó** `Editar`, `Eliminar`, `Copiar`, `Nuevo Pedido`, el `<select>` de Estatus del Cobro, `Descargar adjuntos`, `Ver adjuntos` ni ningún `submit`. **Cero descargas a disco** (los 6 registros del alcance tienen `nu_attachments = 0`; no había nada que descargar).
**Fecha:** 2026-08-19 · ventana ≈ 12:58–13:06 UTC

> Cuarto y último tramo web de la corrida. Continúa `web-filtros.md` (F##, 71 casos),
> `web-cotejo-hoy-adjuntos.md` (C-HOY + A##, 33) y `web-muestreo-comportamiento.md` (M## + D##, 30).
> **Nada de lo ya medido allí se repite ni se contradice.**

---

## Resumen

| Marca | Casos |
|---|---|
| ✅ PASS (`WEB-OK`) | **12** |
| ❌ FAIL | **0** |
| 🚫 N/A | **1** (el control negativo — ver §Control negativo) |
| **Total** | **13** |

### Marca por registro — los 6 del alcance

| # | Módulo | Ref | Epoch | Marca | Nota |
|---|---|---|---|---|---|
| 1 | clientesPotenciales | **194** | `1787081927022.0` | ✅ **`WEB-OK`** | 13/13 campos · localizado sin filtro `# Ref` |
| 2 | pedidos | **2820** | `1787083096656.0` | ✅ **`WEB-OK`** | cálculo cuadra en 5 lugares · IVA 0 legítimo |
| 3 | devoluciones | **351** | `1787085038888.0` | ✅ **`WEB-OK`** | 🟢 **las 2 facturas se muestran** |
| 4 | inventarios | **53** | `1787086589372.0` | ✅ **`WEB-OK`** | 🟢 **las 2 ubicaciones NO se fusionan** |
| 5 | visitas | **2084** | `1787088554798.0` | ✅ **`WEB-OK`** | 1 actividad ⇒ 1 fila |
| 6 | visitas | **2086** | `1787088727281.0` | ✅ **`WEB-OK`** | 2 actividades ⇒ 2 filas, no es duplicado |
| — | visitas (control negativo) | `co_visit 1787088154545.0` | — | 🚫 **`WEB-N/A`** | **dejó de ser un ausente durante esta tanda** |

**Veredicto: 6/6 `WEB-OK`. Ningún `WEB-MISSING`, ningún `WEB-FIELD-MISMATCH`, ningún `WEB-CALC-MISMATCH`.**
Los seis registros que el móvil creó y que llegaron a la nube están en la web, completos y con los
cálculos cuadrados, contrastados contra una BD leída en el mismo minuto.

---

## 🔴🔴 Los dos veredictos que pedía el encargo

### 🟢 `multiInvoices` — **la web muestra LAS DOS facturas del mismo registro**

Es la VG nueva de este cliente (`multiInvoices = true`) y el caso que ningún tenant anterior podía ejercer.
El detalle de la devolución **351** (`form:j_idt169`) pinta **dos líneas con `N° Factura` distinto dentro
de la misma devolución**:

| N° | Cod. producto | Producto | N° Factura | Motivo | Cantidad |
|---|---|---|---|---|---|
| 1 | **TM01** | TOMA CORRIENTE (TIPO 270) POLARIZADO 125V- 15AMP | **`FACT6561`** | Dev. -Por Imposibilidad de Pago | **3** |
| 2 | **LLA-01** | LLAVE EN BLANCO DERECHA. TIPO CISA | **`FACT6855`** | Dev. -Por Imposibilidad de Pago | **2** |

**2/2 exactas contra `return_detail`** en producto, factura, motivo (`id_motive 38`) y cantidad.
**No se fusionan, no se pierde ninguna factura, no se colapsa a una sola.** La cabecera acompaña:
`Tipo de devolución PostVenta` (`id_type 52`), `Precinto PRE-DEV-8899`, `Responsable QA Automatizacion`,
`Observaciones Test-DEV-SMOKE-multiInvoices`.

⚠ **Única nota, sin veredicto:** el **orden** de las líneas se invierte respecto del capturado en el móvil
(el móvil grabó LLA-01/`FACT6855` como línea 0 y TM01/`FACT6561` como línea 1; la web las pinta al revés).
La numeración `N°` es coherente con lo que dibuja (1, 2). **No hay oráculo escrito de qué orden debe tener
esa tabla**, así que se deja como observación, no como hallazgo.

### 🟢 Inventario con el mismo producto en 2 ubicaciones — **NO se fusionan y NO se pierde cantidad**

Segunda medición independiente (confirma `M09` de `web-muestreo-comportamiento.md`, medido por otro agente).
Detalle del inventario **53**:

| Cod. producto | Estructura | Web `Depósito` | Web `Exhibición` | BD (`client_stock_detail_unit`) |
|---|---|---|---|---|
| **LLA-01** | CERRADURAS DE POMO | **`3.00 UNIDADES`** | **`7.00 UNIDADES`** | **una sola** `client_stock_detail` (421) con **dos** units: `424 exh=7` y `425 dep=3` ✅ |
| TM01 | ENCHUFE Y TOMA CORRIENTE | `-` | `5.00 UNIDADES` | unit `426 exh=5` ✅ |

**Las dos cantidades del mismo producto sobreviven y quedan separadas en la misma fila.** 3/3 unidades
exactas. Se reconfirma el patrón: *la ubicación no es una columna* — `exh` se expresa poniendo la cantidad
en **Exhibición** y dejando **Depósito = `-`**.

⚠ El lote `QA-INV-0818` de TM01 **sigue invisible** porque `detalleInventario` no genera las columnas
`Lote` / `Fecha expiración` — **🟡 ya reportado** (`M##` Hallazgo 5). No se levanta de nuevo.
⚠ La columna `N°` vale `1` en las dos filas — **🟡 ya reportado**. No se levanta de nuevo.

---

## 🔴🔴 CONTROL NEGATIVO — el ausente **dejó de estar ausente a mitad de esta tanda**

El encargo pedía verificar que la visita `co_visit = 1787088154545.0` (defecto **H-1**: comentario de
**255** caracteres contra `incidence.tx_description varchar(120)`) **no** aparece en la web, y registrar
esa ausencia como la contraprueba de que la web refleja fielmente la nube.

**No se pudo ejecutar como control negativo, porque el registro llegó a la nube durante la tanda.**
Los tiempos son inequívocos y están medidos, no supuestos:

| Momento (UTC) | Evidencia |
|---|---|
| **12:58:53** | arranca esta tanda (login web) |
| **12:59:2x** | 🔴 BD: `SELECT count(*) FROM visit WHERE co_visit='1787088154545.0'` ⇒ **0** — y `visit` del `id_user 470` devuelve **3** filas (2080, 2084, 2086) |
| **13:01:42** | 🔴 `visit.da_created = 2026-08-19T13:01:42.410Z` — el registro **entra a la nube** como **`id_visit = 2152`** |
| **13:05:xx** | BD: la misma consulta devuelve **1** fila · la web muestra `Ref 2152`, con `Fecha Enviada 19/08/2026 09:01:41` (= 13:01:41Z) |

⇒ **`WEB-N/A` con motivo, no `WEB-MISSING`, no PASS por defecto.** No se puede afirmar *"la web no lo
muestra"* de algo que la nube **sí tiene**: la web lo muestra, que es lo correcto.

### La contraprueba de fidelidad se sostiene igual, por dos vías

1. **Histórica:** F## midió el 18/08 a las 20:35 UTC `Vendedor 470` ⇒ **1 sola visita** (la 2080), y el
   agente BD del móvil midió `count = 0` en la nube para ese epoch. Web y nube coincidían **en la ausencia**.
2. **Medida hoy por mí (caso `C11-NEG`), que es el cierre fuerte:** `/pages/visitas`, fechas `18/08–18/08`,
   **todos los combos verificados en su placeholder uno por uno antes de `Buscar`**:

   | | |
   |---|---|
   | Web `Total de Resultados` | **6** — `2152`×2, `2086`×2, `2084`, `2080` |
   | BD leída en el mismo minuto (`Σ greatest(count(incidence),1)`, sin usuarios de baja) | **4 visitas ⇒ 6 filas**, las mismas 4 refs |
   | Diferencia | **0** |

   ⇒ **La web muestra exactamente lo que hay en la nube: ni un registro de más, ni uno de menos, ni antes
   ni después de que el rezagado llegara.** Ese es el enunciado que el control negativo quería probar, y
   queda probado con un cierre exacto en vez de con una ausencia.

### 🟠 Hallazgo C-H1 — El registro-evidencia de H-1 **se envió con otro contenido**: se perdió la evidencia viva, y de paso **refuerza** H-1

El manifiesto pedía explícitamente no tocarlo: *"Registro DEJADO A PROPÓSITO en la cola del device como
evidencia viva: avisar a la QA antes de limpiarlo"*. **Se envió, y no con los datos originales.**
Comparación campo a campo entre lo que registró el móvil (`_bd-manifest.jsonl`, caso `DM-VIS-020`) y lo
que hay hoy en la nube (`id_visit 2152`):

| Campo | Móvil (18/08, `BD-QUEUED`) | Nube hoy (`id_visit 2152`) | |
|---|---|---|---|
| `co_visit` (epoch) | `1787088154545.0` | `1787088154545.0` | ✅ **es el mismo registro** |
| Incidencia 1 | `co_type 47` · `co_cause 184` · `len = 0` | `co_type 47` · `co_cause 184` · `len = 0` | ✅ igual |
| Incidencia 2 | `co_type 82` · `co_cause 189` · **`len = 255`** | `co_type 82` · `co_cause 189` · **`"QA VISITA"` (`len = 9`)** | 🔴 **el comentario largo YA NO ESTÁ** |
| `nu_attachments` | `0` | **`2`** (`has_attachments = true`) | 🔴 se agregaron adjuntos |
| `coordenada` | `11.0493217,-63.8659433` | `11.0487196,-63.8647799` | 🔴 fix de GPS distinto |
| `da_real` (fecha de envío) | — (nunca se envió) | `2026-08-19T13:01:41Z` | — |

**Lectura honesta de lo que esto prueba y de lo que no:**

- **No es un reintento automático de la cola.** Un reintento habría mandado el mismo cuerpo: no cambia el
  comentario por otro texto distinto, no agrega 2 adjuntos y no toma una coordenada nueva. Tampoco es una
  truncación del servidor: truncar 255 a 120 daría los **primeros 120 caracteres** de
  `QA-VIS-…`, no la cadena `QA VISITA`. ⇒ **el registro se volvió a editar en el dispositivo y se reenvió.**
- 🟢 **Refuerza H-1 en vez de desmentirlo.** La misma visita, con las mismas 2 actividades y los mismos
  `co_type`/`co_cause`, **entró sin problemas en cuanto el comentario dejó de superar los 120 caracteres**.
  El largo del comentario queda como **la única variable que cambió el resultado del envío** — que era
  justamente lo que el contrafactual `DM-VIS-020`/`2086` intentaba aislar.
- 🔴 **Lo que se perdió es la evidencia reproducible.** Ya no hay en la cola del dispositivo un registro
  atascado con el que Desarrollo pueda ver el fallo en vivo. Si hace falta, **hay que recrearlo**: visita
  con comentario > 120 caracteres en `incidence.tx_description`.
- 📋 **Para la QA:** confirmar quién reenvió el registro y por qué, y **no volver a marcar un registro como
  "evidencia viva" sin dejarlo fuera del alcance del siguiente agente móvil** — este se envió durante la
  ventana en que dos agentes tocaban el mismo dispositivo.

**Gate §5.a:** el hallazgo **no es de la web** (la web es fiel en los dos estados: sin el registro cuando
no estaba, con él cuando llegó). Es una nota de **proceso de QA** + evidencia adicional para el defecto
móvil H-1, que sigue vigente.

---

## FAMILIA C## — cotejo registro por registro

### `clientesPotenciales` ref **194** — `WEB-OK` (13/13 campos)

Confirmado por tercera vez: **este módulo no tiene filtro `# Ref`** — `[id$=":n_ref"]` **no existe en el
DOM**. Localizado por **fechas `18/08–18/08`** (todos los combos verificados en placeholder) y desambiguado
por la **columna `# Ref` de la lista**, que sí está.

**Cierre de conteo del día (caso `C13`):** web `Total de Resultados: 5` (refs `197, 196, 195, 194, 193`)
contra BD leída en el mismo minuto: **5**, los mismos ids, todos `co_user 000208`. **5 = 5.**

| Campo del detalle | Web | BD (`potential_client`) | ✓ |
|---|---|---|---|
| `Código:` (epoch) | `1787081927022.0` | `co_client` idéntico | ✅ |
| `Fecha de Registro:` | `18/08/2026 15:40:48` | `da_client = 2026-08-18T19:40:48Z` (UTC−4) | ✅ |
| `Nombre:` | `Test-CLT-SMOKE-153911` | `na_client` | ✅ |
| `Cédula:` | `J987654321` | `nu_rif` | ✅ |
| `Responsable:` | `QA Automatizacion` | `na_responsible` | ✅ |
| `Correo:` | `qa.smoke@kiberno.com` | `em_client` | ✅ |
| `Teléfono:` | `04121234567` | `nu_phone` | ✅ |
| `Dirección:` | `Av Principal QA 123, Turmero, Aragua` | `tx_address` | ✅ |
| `Dirección Entrega:` | `Galpon 7 Zona Industrial QA` | `tx_address_dispatch` | ✅ |
| `Comentario:` | `Cliente potencial generado por smoke QA run_vzla` | `tx_client` | ✅ |
| `Coordenada de transacción:` | `11.0492583,-63.8649233` | `coordenada` idéntica | ✅ |
| `Web:` | *(vacío)* | `na_web_site = NULL` | ✅ local-driven |
| `Vendedor:` | `000208` | `co_user = 000208` | ✅ |

⚠ El detalle **no muestra `No. de Ref.`** (la única llave es el epoch) y `Vendedor` trae solo el primer
token — **ambos por diseño/limitación conocida** (`§5.b`). No se juzgan.

### `pedidos` ref **2820** — `WEB-OK` (campos + cálculo)

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` | `2820` | `id_order 2820` | ✅ |
| `Código pedido` | `1787083096656.0` | `co_order` | ✅ |
| `Fecha del pedido` | `18/08/2026 16:10:12` | `da_order 20:10:12Z` (UTC−4) | ✅ |
| `Estatus` | `Enviado` | `st_order = 1` · `id_status = 4` (por `id_transaction_statuses DESC`) | ✅ |
| Cliente | `006831 · FERRETERIA EPA, C.A` | idem | ✅ |
| `Condicion de pago` | `CONTADO` | `co_payment_condition '005' → na_payment_condition 'CONTADO'` | ✅ |
| `Fecha de despacho` | `20/08/2026` | `da_dispatch 2026-08-20` | ✅ |
| `Tipo de Pedido` | `PEDIDO ESTANDAR` | `id_order_type = 1` | ✅ |
| `Comentario` | `Test-PED-SMOKE-160554` | `tx_comment` | ✅ |
| `Coordenada de transacción` | `11.04899,-63.8651167` | `coordenada` idéntica | ✅ |
| `Empresa` | `CORPORACION FERRE 19, C.A.` | `na_enterprise` | ✅ |
| `Total items` (lista) | `2` | `nu_details = 2` | ✅ |

**Oráculo de cálculo — el mismo `70,60` en CINCO lugares:**

| N° | Cod. | Producto | Precio base | Unidades pedidas | Subtotal | `order_detail` / `order_detail_unit` |
|---|---|---|---|---|---|---|
| 1 | **LLA-01** | LLAVE EN BLANCO DERECHA. TIPO CISA | `0,51 US$` | `60 UNIDADES` | **`30,60 US$`** | `nu_price_base 0.5100` · `qu_order 60` · `nu_amount_total 30.60` · **`iva 0.0000`** |
| 2 | **TM01** | TOMA CORRIENTE (TIPO 270) POLARIZADO 125V- 15AMP | `0,80 US$` | `50 UNIDADES` | **`40,00 US$`** | `nu_price_base 0.8000` · `qu_order 50` · `nu_amount_total 40.00` · **`iva 0.0000`** |

```
Σ subtotales de línea      30,60 + 40,00 = 70,60
Subtotal bruto                             70,60   (pie)
Monto Base Pedido                          70,60   (pie)
Monto Total Pedido                         70,60   (pie)
Monto Base / Monto Total de la fila        70,60   (lista)
Total Base / Monto Total de cabecera       70,60   (indicadores)
```

`precio × unidades == subtotal` en **las 2 líneas, 0 desvíos**. Numeración `N°` **1, 2 correcta**
(`detallePedido` sí numera bien). `Descuento bonif. 0,00 US$`.

⚠ **`IVA :` del pie sale VACÍO y `Monto Base == Monto Total`. NO es defecto y NO se reporta:**
`order_detail.iva = 0.0000` y `nu_amount_tax = 0.0000` en **las dos** líneas; `userCanSelectIVA=false`.
El oráculo `Base × (1+IVA) == Total` **se cumple con IVA = 0**. (Dictaminado ya en C-HOY y M##; se
reverifica acá sobre un pedido nuevo y vuelve a dar lo mismo.)

⚠ `Firma:` vacía y `form:graImaPro` **inexistente en el DOM** ⇒ coherente con `signature = null` y
`nu_attachments = 0` del manifiesto. **No hay firma que mostrar**, no es una firma que no se pinta.

### `devoluciones` ref **351** — `WEB-OK`

Cabecera 8/8 exacta (tabla completa en §multiInvoices). El literal `Observaciones` viene **sin `:`** como
título de sección y su valor está en la línea siguiente — patrón ya documentado, resuelto.
`Lote` y `Fecha vencimiento` **vacíos** = `nu_lote ''` / `da_duedate NULL` ✅.
Estatus de la lista `Enviado` = `st_return 1` / `id_status 8` ✅.
✅ **Devoluciones no maneja montos** ⇒ no se construyó oráculo de importes (`§7`).

### `inventarios` ref **53** — `WEB-OK`

Cabecera: `No. de Ref. 53` · `Código inventario 1787086589372.0` · `Fecha de inventario 18/08/2026 16:56:29`
(= `da_client_stock 20:56:29Z`) · `Comentario inv-smoke-2ubicaciones` · `006831 FERRETERIA EPA, C.A` ·
`CORPORACION FERRE 19, C.A.` · Estatus de la lista `Enviado` (`st_client_stock 1` / `id_status 2`).
`Ver Pedido Relacionado` vacío = `id_order NULL` ✅. Líneas: ver §2 ubicaciones.

### `visitas` ref **2084** — `WEB-OK` · 1 actividad ⇒ **1 fila**

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` | `2084` | `id_visit 2084` | ✅ |
| `Fecha planeada de visita` | `18/08/2026 17:28:12` | `da_visit 21:28:12Z` (UTC−4) | ✅ |
| `Fecha Iniciada` (lista) | `18/08/2026 17:28:13` | `da_initial 21:28:13Z` | ✅ |
| `Fecha Enviada` (lista) | `18/08/2026 17:30:03` | `da_real 21:30:03Z` | ✅ |
| `Status` (lista) | `visitado` | `st_visit = 2` | ✅ |
| `Orden de visita` | `1` | `nu_sequence = 1` | ✅ |
| `Titulo` | `2026-08-18-FERRETERIA EPA, C.A` | — | ✅ |
| Actividad / Motivo / Descripción | `MERCHANDISING` / `ENTREGA DE MUESTRAS` / `QA-VIS-031-comentario-corto-60c-ABC…12` | `co_type 47 → na_type MERCHANDISING` · `id_motive 153 → ENTREGA DE MUESTRAS` · `tx_description` de **60** caracteres, idéntica | ✅ |

⚠ `Geo = Fuera de Rango` (`st_coordinate = 4`) — **por diseño** (`§5.b`).

### `visitas` ref **2086** — `WEB-OK` · 2 actividades ⇒ **2 filas, no es duplicado**

`Total de Resultados: 2`, ambas con `Ref 2086`. Es el modelo `Σ greatest(count(incidence),1)` que ya
estableció F## — **la lista de visitas es por actividad**, no por visita.

| Fila | Actividad | Motivo | Descripción | BD (`incidence`) |
|---|---|---|---|---|
| 1 | `MERCHANDISING` | `PLAN SLIP` | `QA-VIS-2ev-corto-A` | `co_incid 2164` · `co_type 47` · `id_motive 191` · len 18 ✅ |
| 2 | `COBRANZA` | `COBRANZA EFECTIVA` | `QA-VIS-2ev-corto-B` | `co_incid 2165` · `co_type 82` · `id_motive 182` · len 18 ✅ |

`Fecha Iniciada 17:31:15` = `da_initial 21:31:15Z` · `Fecha Enviada 17:32:07` = `da_real 21:32:07Z` ·
`Status visitado` · `Orden de visita 1`.
🔑 **Coordenada verificada por el HTML del mapa** (no es texto visible en `detalleVisita`):
`11.048725,-63.864771` contra BD `11.0487251,-63.8647711` — **el mapa redondea a 6 decimales**, dentro de
tolerancia. ✅
⚠ `N° = 1` en las dos filas — **🟡 ya reportado** (`M##` Hallazgo 3). No se repite.

---

## 🟢 Observaciones DESCARTADAS — **no son hallazgos**

| Observación | Por qué NO es defecto |
|---|---|
| «El `IVA :` de `detallePedido` sale vacío y `Base == Total` en el pedido 2820» | `order_detail.iva = 0` en las 2 líneas. **Declarado en el perfil, ya dictaminado dos veces.** Se re-verificó sobre un pedido nuevo y volvió a dar lo mismo |
| «La `Firma:` sale vacía en los 4 detalles con firma esperada» | `form:graImaPro` **no existe en el DOM** de ninguno de los 4 ⇒ no hay firma que pintar (`nu_attachments = 0` y `signature = null` en el manifiesto). Artefacto del lector descartado por DOM, no por `innerText` |
| «`Devolución en = 1` en las 2 líneas de la devolución 351» | 🟡 **ya reportado** (C-HOY Hallazgo 2). No se repite |
| «`N° = 1` en las 2 filas de `detalleInventario` y en las 2 de `detalleVisita`» | 🟡 **ya reportado** (C-HOY H1 · M## H3). No se repite |
| «El lote `QA-INV-0818` no aparece en ninguna parte de `detalleInventario`» | 🟡 **ya reportado** (M## H5): la pantalla no genera las columnas `Lote`/`Fecha expiración`. No se repite |
| «Las líneas de la devolución 351 salen en orden inverso al capturado en el móvil» | **Sin oráculo de orden.** La numeración `N°` es coherente con lo dibujado y los datos son exactos. Observación, no hallazgo |
| «`Vendedor` de clientes potenciales muestra solo `000208`» · «`Geo = Fuera de Rango`» · «clientes potenciales sin `No. de Ref.` en el detalle» | **Por diseño / limitación conocida** (`§5.b`, `_comunes.md`) |
| «`/pages/cobros` HTTP 500 (`StackOverflowError`)» | **No reprodujo en esta tanda** — pero el módulo **no se tocó** (el vendedor QA no tiene cobros y no había registro en alcance) ⇒ ni se confirma ni se desmiente. El hallazgo de F## sigue en pie |

---

## Patrones / selectores nuevos

### 🔑 NUEVO — La cantidad del pedido **NO está en `order_detail`**: vive en `order_detail_unit`

Trampa de BD que costó dos consultas fallidas y que **no está en `modelo-datos-denario.md`**:

```sql
-- ❌ order_detail NO tiene qu_order  (ERR: column od.qu_order does not exist)
-- ✅ la cantidad y el subtotal por unidad viven en la tabla nieta:
SELECT u.co_product_unit, u.qu_order, u.nu_base_total
FROM   order_detail d
JOIN   order_detail_unit u ON u.co_order_detail = d.co_order_detail
WHERE  d.co_order = '<epoch>';
```

`order_detail` sí trae `nu_price_base`, `iva`, `nu_amount_total` y `nu_amount_tax`.
⇒ **El oráculo `precio × cantidad == subtotal` necesita las DOS tablas.** Mismo patrón, ya conocido, que
`client_stock_detail` → `client_stock_detail_unit` (donde vive `ubicacion` / `qu_stock` / `nu_batch`).

### 🔑 NUEVO — Catálogos de visitas: la FK **no se llama como uno espera**

```sql
incidence         (co_incid, id_visit, co_type, co_cause, tx_description, …)
incidence_type    (id_type,  na_type,  …)      -- ⚠ se une por  it.id_type = i.co_type
incidence_motive  (id_type,  id_motive, na_motive, …)  -- ⚠ el "motivo" es co_cause, y la tabla NO
                                                        --   se llama incidence_cause (no existe)
```

Un `JOIN incidence_cause ON co_cause` **revienta** (`relation does not exist`) y un
`JOIN incidence_type ON it.co_type` también (`column it.co_type does not exist`).
⚠ Además `incidence` **no tiene `co_visit`**: la FK a la visita es **`id_visit`** (el `# Ref`), no el epoch
— excepción a la regla general *"en las tablas hijas la FK es el epoch en texto"*, que sí se cumple en
`order_detail`, `return_detail` y `client_stock_detail`.

### 🔑 NUEVO — `potential_client` **no tiene `id_potential_client`**: su PK se llama `id_client`

```sql
-- ❌ ERR: column "id_potential_client" does not exist
SELECT * FROM potential_client WHERE co_client = '<epoch>';   -- ✅ y el # Ref es id_client
```

`id_client = 194` **es el `# Ref` de la lista web**, no un FK al cliente real. Coherente con que la carpeta
de adjuntos del módulo se llame `clientes` y la URL use el `# Ref`.

### ✅ La coordenada de `detalleVisita` **no es texto visible** — leerla del HTML del mapa

Igual que en `detalleInventario`. El lector `#form.innerText` devuelve `Ubicación: Mapa` y nada más.
Receta barata, sin esperar a que Google cargue:

```js
(document.getElementById('form').innerHTML
  .match(/-?\d{1,2}\.\d{4,},\s*-?\d{1,3}\.\d{4,}/) || [null])[0]
```

⚠ **El mapa redondea a 6 decimales** (`11.048725` vs `11.0487251` en BD) ⇒ comparar con tolerancia,
nunca con `===`.

### ✅ Estado de los filtros en este build — **todos los combos llegaron limpios**

Contra lo que advertía la corrida anterior, en **los 4 módulos** de esta tanda los `<select>` vinieron en
su placeholder tras `browser_navigate` (verificado uno por uno **antes** de cada `Buscar`, nunca asumido).
⇒ **La verificación sigue siendo obligatoria** — es lo que permite afirmarlo —, pero el reseteo explícito
no hizo falta esta vez. El `# Ref` sí llegó vacío siempre.

### ✅ Ciclo de 4 llamadas por registro — 6/6 sin reintentos, 0 páginas en blanco

`navigate(/pages/main)` → `navigate(/pages/{modulo})` → `evaluate(leer estado + fijar filtro + Buscar)` →
`evaluate(leer lista)` → `evaluate(mapa # Ref → botón + hit(consultar))` → `evaluate(leer detalle)`.
El paso por `/pages/main` entre módulos evitó el `IndexOutOfBoundsException` en **los 5 saltos**.
El helper `hit()` (ejecutar el `onclick`, no `.click()`) funcionó en **13/13** `Buscar`/`Consultar`.

### ✅ Sufijos reconfirmados en este build (La Tortuga, 19/08)

```
pedidos              form:j_idt115:{idEnterprise,idSalesmaView,clientSOM,idOrderType,orderStatus,attachStatus,n_ref,dateB,dateF,ajax}
devoluciones/invent. form:j_idt114:{idEnterprise,idSalesmaView,clientSOM,attachStatus,orderStatus,n_ref,dateB,dateF,ajax}
clientesPotenciales  form:j_idt114:{idEnterprise,idSalesmaView,attachStatus,dateB,dateF,ajax}   🔴 SIN n_ref
visitas              form:j_idt115:{idRol,idSalesman,idClient,idEstatus,idType,idMotive,selectAttach,selectDispatch,selectCoordinadas,n_ref,dateB,dateF,btnBuscar}
```

- El prefijo `j_idt*` **volvió a diferir entre módulos de la misma sesión** (`j_idt114` vs `j_idt115`) —
  9.ª confirmación de que **nunca** se ancla por él.
- `detalleDevolucion` sigue en **`form:j_idt169`** (igual que ayer) — pero se ancló por columnas
  (`['Lote','Fecha vencimiento']`), no por id.
- Tablas con id **semántico** y estables: `form:pedidosDT` (lista y `detallePedido`/`detalleInventario`),
  `form:tablaVisit` (lista de visitas), `form:visitasDT` (`detalleVisita`).
- El `value` de Empresa vuelve a cambiar por módulo: **`FERRE_N`** en pedidos y clientes potenciales,
  **`1`** en devoluciones, inventarios y visitas. **Anclar por TEXTO.**

> ✅ consolidado 2026-08-19 → `web-selectors/_comunes.md` (`order_detail_unit`, catálogos de visitas,
> PK `potential_client.id_client`, coordenada del mapa con tolerancia, matiz de los combos limpios,
> 9.ª confirmación de no anclar por `j_idt*`) + `visitas.md` · `clientesPotenciales.md`.

---

## Qué revisaría primero

1. **🟠 La evidencia viva de H-1 se envió y se perdió** (Hallazgo C-H1). El registro atascado ya no existe:
   se reenvió el 19/08 a las 13:01 UTC con el comentario cambiado a 9 caracteres, 2 adjuntos nuevos y otra
   coordenada. **Confirmar con la QA quién lo reenvió** y, si Desarrollo necesita verlo en vivo, **recrear
   el caso** (visita con `incidence.tx_description` > 120 caracteres). De paso, el reenvío **refuerza H-1**:
   la misma visita entró sin problema en cuanto el comentario dejó de pasarse de largo.
2. **Nada bloqueante en la web.** Los 6 registros del alcance están completos y correctos, los cálculos
   cuadran y los dos casos delicados de este cliente (`multiInvoices` y el producto en 2 ubicaciones)
   **funcionan**.
3. Los 🟡 pendientes siguen siendo los ya levantados: `N°` siempre `1` en `detalleInventario` y
   `detalleVisita`, `Devolución en` con el código de unidad, y el **lote invisible** en inventarios —
   este último inocuo acá (1 solo lote) pero serio en un tenant que use lotes de verdad.

---

*Agente WEB · familia `C##` · 2026-08-19 · read-only · 13 casos · 0 descargas · oráculo BD `run_vzla`*
