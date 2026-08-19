# WEB · Familias M## (muestreo histórico) + D## (comportamiento) — run_vzla

**RUN_ID:** `20260818_152824_smoke-completo`
**Cliente:** `run_vzla` · Empresa **CORPORACION FERRE 19, C.A.** (`co_enterprise=FERRE_N`, `id_enterprise=1`)
**Playa:** **La Tortuga** — `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Usuario web:** `***` / `***` (bloque `# USUARIO WEB` de `secrets/qa-credentials.env`)
**Oráculo:** BD nube `run_vzla` vía `automation/db/query.js` · tolerancia 0,01
**Modo:** 🔴 READ-ONLY estricto — `Buscar`, `Limpiar`, cambiar un combo de filtro, fechas, paginar,
rows-per-page, ordenar por cabecera y `Consultar`. **No se pulsó** `Nuevo Pedido`, `Copiar`, `Editar`,
`Eliminar`, el `<select>` de Estatus del Cobro, `Descargar adjuntos`, ni ningún `submit`.
**🔴 Cero descargas a disco.**
**Fecha:** 2026-08-18 · ventana ≈ 21:00–21:20 UTC

> Continúa `web-filtros.md` (F##, 71 casos) y `web-cotejo-hoy-adjuntos.md` (C-HOY + A##, 33 casos).
> **Nada de lo ya medido allí se repite.** Esta tanda ataca lo que faltaba: **cobros** (el módulo con
> más volumen y más cálculo, del que el usuario QA no tiene ni un registro), los **detalles**
> históricos de los 7 módulos y el **comportamiento** de las listas.

---

## Resumen

| Marca | Casos |
|---|---|
| ✅ PASS (`WEB-OK`) | **26** |
| ❌ FAIL (`WEB-CALC-MISMATCH`) | **2** |
| 🚫 N/A | **1** |
| ⏭ SKIP | **1** |
| **Total** | **30** (16 `M##` + 14 `D##`) |

**Veredicto: los datos que la web muestra son fieles a la BD, campo por campo, en los 12 registros
muestreados de los 7 módulos, y los agregados de cabecera cuadran al céntimo.**
Los 2 FAIL **no son errores de dato**: son dos casos donde la web **imprime un total almacenado que
contradice lo que ella misma está pintando al lado**, porque el móvil guardó ese total en `0`.

**Cobertura del muestreo (todo con volumen real, tenant productivo):**

| Módulo | Registros abiertos | Cobertura de forma |
|---|---|---|
| **cobros** | 5 (`32992`, `32689`, `32974`, `32969`, `32455`) | cobro normal con pago parcial · **retención IVA+ISLR** · **anticipo con 2 pagos** · cobro con nota de crédito · cobro con pago en otra moneda |
| **pedidos** | 2 (`2812`, `2808`) | 22 líneas y **53 líneas** |
| **devoluciones** | 1 (`331`) | 11 líneas / **4 facturas** (`multiInvoices`) |
| **inventarios** | 1 (`53`) | **mismo producto en 2 ubicaciones** + lote |
| **visitas** | 1 (`2050`) | **2 actividades ⇒ 2 filas** |
| **clientes potenciales** | 1 (`192`) | 13 campos |
| **depósitos** | 1 (`2`) | cabecera + **tabla hija de cobros** |

---

## 🔴 El gate §5.a, aplicado de verdad

Este muestreo **empezó por lo reciente**, no por lo viejo: **8 de los 12 registros son del 17 o el
18 de agosto** y 3 fueron creados **hoy** (`32992`, `2812`, `inventario 53`). Eso permitió decidir
cada anomalía con un contraejemplo del día en la mano, en vez de discutirla en abstracto.

**Resultado del gate: de 8 anomalías observadas, 5 se descartaron y 3 pasaron** (ver las dos tablas
de hallazgos y de descartes más abajo).

---

## Hallazgos que SUPERAN el gate §5.a

### 🟠 Hallazgo 1 — El indicador `Monto total en US$` de cobros **contradice la propia lista** en 25 cobros de agosto

**El caso testigo se ve de un vistazo.** Filtrando `# Ref = 32969` (cobro del **17/08**, o sea del mes
en curso y dentro del rango por defecto), la pantalla queda así:

```
Cabecera:  Monto total en US$: 0,00        Total de Resultados: 1
Fila:      # Ref 32969 … Monto cobrado 1.233,36 US$ … Total por cobrar 1.233,36 US$
```

**El indicador dice 0,00 sobre una lista de una sola fila que muestra 1.233,36 US$.**

**Por qué pasa — medido, no supuesto:**

| Qué pinta la web | De dónde sale | Valor en 32969 |
|---|---|---|
| Indicador `Monto total en US$` | `Σ collection.nu_amount_total` | **0,00** |
| Columna `Monto cobrado` | los **pagos** (`collection_payment`) | 1.233,36 |
| Columna `Total por cobrar` | `collection.nu_amount_final` | 1.233,36 |

Los tres orígenes se confirmaron con el anticipo `32974`, que tiene 2 pagos: la columna `Monto cobrado`
trae **el desglose `54,13 US$ 203,87 US$`** (por diseño) y suma 258,00 = `nu_amount_total` = indicador.
⇒ **La columna sale de los pagos; el indicador, del campo de cabecera.** Cuando ambos coinciden, nadie
lo nota. Cuando no, el indicador miente respecto de lo que hay debajo.

**Alcance en el rango por defecto (01/08–18/08, sin usuarios de baja):**

| | |
|---|---|
| Cobros del rango | **1.026** |
| Indicador de la web | **5.412.913,36** |
| `Σ nu_amount_total` en BD | **5.412.913,36** ✅ cuadre al céntimo |
| Cobros con `nu_amount_total = 0` | **25** |
| `Σ nu_amount_final` de esos 25 | **13.472,88 US$** que el indicador no cuenta |
| Último cobro afectado | **17/08/2026** |

**Gate §5.a:** ✅ pasa. El síntoma **se ve hoy**, al abrir `/pages/cobros` con el filtro por defecto:
25 de las 1.026 filas del mes en curso aportan 0 al total de cabecera mostrando importe en su fila.
Que ninguno de los 13 cobros de hoy tenga `nu_amount_total = 0` no lo salva: el rango vigente los
incluye. ⚠ **La condición no aparece en registros de hoy** ⇒ no es una regresión de esta release.

**Causa raíz: es del móvil/servicio, no de la web.** La web suma fielmente lo que hay guardado. Lo que
hay que arreglar es que la app grabe `nu_amount_total = 0` en un cobro con pagos. **Lo que sí le toca a
la web** es no ofrecer como "Monto total" un número que contradice la columna que está pintando.

### 🟠 Hallazgo 2 — El detalle del depósito se contradice a sí mismo: `Monto depositado 0,00` sobre una tabla hija de `266,59`

Mismo patrón, otra pantalla, y aquí **ni siquiera hace falta comparar contra BD**: los dos números
están en la misma página.

```
Cabecera del detalle:   Monto depositado: 0,00 US$
Tabla hija (los cobros del depósito):
   1  16/07/2026  N° Ref cobro 30800  NR INDUSTRIAL, C.A  Otros  …  Monto cobrado 266,59 US$
```

- El **oráculo `WEB-RUNTIME §7`** (`Σ Monto cobrado de los hijos == Monto depositado`) **falla en
  pantalla**: 266,59 ≠ 0,00.
- Campo a campo la web **es fiel**: `deposit.nu_amount_doc = 0.0000` en BD. La causa raíz es la misma
  que la del Hallazgo 1 y coincide con el **Hallazgo 3 de `web-filtros.md`** — pero aquel se quedó en
  el indicador de la lista; **este muestra que el propio detalle es incoherente**, que es mucho más
  visible para el usuario.
- **Severidad 🟠 acotada por volumen:** el tenant tiene **2 depósitos**, ambos de julio, ninguno del
  vendedor QA. ⚠ **No se pudo reproducir sobre un registro de hoy porque no hay depósitos nuevos**: el
  módulo quedó fuera de la corrida móvil (`depositos.aplica: false` en el perfil). Va como hallazgo
  porque la incoherencia es estructural (la web **no recalcula** el total desde los hijos que dibuja),
  no porque el dato sea viejo.

### 🟡 Hallazgo 3 — La columna `N°` que vale `1` en todas las filas **también afecta a `detalleVisita`**

`web-cotejo-hoy-adjuntos.md` lo reportó para `detalleInventario`. **Es la misma tabla rota en otra
pantalla:**

```
detalleVisita (form:visitasDT) — visita 2050, 2 actividades
N°  Actividad   Motivo  Descripción
1   NO COMPRO   OTROS   crédito
1   NO COMPRO   OTROS   va a cabcelar la nota pendiente para realizar pedido
```

- **Contraste que lo prueba:** en la misma tanda, `detallePedido` numeró **1..53** sin un fallo
  (pedido 2808) y `detalleDevolucion` numeró **1..11** (devolución 331). ⇒ La web sabe numerar; son
  `detalleInventario` y `detalleVisita` los que no.
- **Reconfirmado hoy:** el inventario **53**, creado por el QA a las 16:56 de hoy, vuelve a salir
  `1, 1`.
- ⚠ **La visita más reciente con 2 actividades es del 17/08**: ninguna visita de hoy tiene más de una
  incidencia, así que en visitas el síntoma solo se puede exhibir con el registro de ayer. La causa es
  compartida con inventarios, que **sí** reproduce hoy.
- **Severidad 🟡 baja:** cosmético. No altera ni actividades ni cantidades. Se reporta para que el
  arreglo cubra **las dos** pantallas, no solo la que se levantó ayer.

### 🟡 Hallazgo 4 — Códigos crudos donde existe el nombre: `Banco: 006` y forma de pago `ot:`

Misma familia que el `Devolución en: 1` ya reportado. **Dos instancias nuevas:**

| Dónde | Muestra | Lo que hay disponible | Prueba de que la web sabe resolverlo |
|---|---|---|---|
| `/pages/depositos` — columna **`Banco`** *y* el campo `Banco:` del detalle | `006` | `bank.na_bank = 'BANCARIBE'` (misma empresa, `co_operation='I'`) | — |
| `/pages/cobros` — columna **`Pagos`** | `ot: …` | `payment_method.na_method = 'Otros'` | 🔑 **el detalle del mismo cobro rotula `Forma de pago: Otros`** |

El segundo es el más claro: **la misma transacción se rotula con el código en la lista y con el nombre
en el detalle**. No hay ambigüedad de diseño posible entre dos pantallas del mismo registro.

- **Severidad 🟡 baja** (legibilidad), pero barato de arreglar y molesto: `006` no le dice nada a quien
  concilia depósitos.
- ⚠ **Reserva sobre depósitos:** solo hay 2 depósitos, de julio; no hay registro de hoy con el que
  exhibirlo. El caso de **cobros sí reproduce hoy** (cobro 32992, 18/08).

### 🟡 Hallazgo 5 — El **lote** capturado por la app no se muestra en ninguna parte del detalle de inventario

- `detalleInventario` renderiza **6 columnas**: `N° · Cod. producto · Producto · Estructura · Depósito ·
  Exhibición`. **No existen `Lote` ni `Fecha expiración`** — verificado en el DOM: no están ocultas por
  CSS, **no se generan** (`toggler` ausente, 6 `th` en total).
- `web-selectors/_comunes.md` documenta esas dos columnas para esta pantalla ⇒ **este build no las
  pinta**.
- **El dato existe y es de hoy:** el inventario **53** (QA, 18/08 16:56) trae
  `client_stock_detail_unit.nu_batch = 'QA-INV-0818'` para el producto `TM01`. Es **el único lote de
  todo el tenant** (1 de 426 unidades) y **es invisible en la web**.
- ⚠ **Reserva honesta:** con `expirationBatch = false` en las VG, ocultar esas columnas puede ser
  intencional. Lo que no encaja es que **la app permita capturar un lote que después no se puede
  consultar en ningún lado**. Va como observación para que Desarrollo confirme la intención.
- **Severidad 🟡 baja** en este tenant (1 solo lote), **pero sería alta en un tenant con lotes reales.**

---

## 🟢 Observaciones DESCARTADAS por el gate §5.a — **no son hallazgos**

Cinco anomalías que a primera vista parecían defectos de la web y **se cayeron al remedirlas**. Se
dejan escritas para que nadie las vuelva a levantar.

| Observación | Por qué NO es defecto de la web |
|---|---|
| «La columna `Pagos` de cobros muestra basura: `Tasa: Bs Referencia: AC: Días de crédito: **XX** \| Descuento: **XX%** en $`» | **Es texto que tecleó el vendedor.** `collection_payment.nu_payment_doc` del cobro 32992 contiene esa cadena **literal, plantilla sin rellenar incluida**. La web la imprime tal cual. Verificado contra BD carácter a carácter |
| «El cobro **32455** muestra `Monto cobrado 675.556,52 US$` sobre un documento de 1.114,72 US$, y una `Diferencia cobro` de 674.441,80» | **Los tres números están así en BD** (`nu_difference = 674441.80`). El vendedor cargó el pago **en bolívares dentro de un cobro en US$** (tenant mono-moneda, sin conversión). Defecto **de captura móvil**, no de render. Son 5 cobros del usuario 488 |
| «`Total Monto a pagar conversión: 349,76` con `Tasa de conversión: 0,00`» (cobro 32689) | `collection.nu_amount_final_conversion = 349.76` **en BD**, con `nu_value_local = 0`. La web es fiel. Es el móvil el que escribe un importe de conversión en un tenant sin conversión |
| «`Firma:` vacía en los detalles de cobros y pedidos» | **No hay firmas que mostrar:** `transaction_signatures` tiene **5 filas en todo el tenant** y son las 5 de la QA de hoy (clientes, visitas, devoluciones, pedidos, inventarios). **Cero de cobros.** Además el `<img id="form:graImaPro">` ni siquiera existe en `detalleCobro` cuando no hay firma |
| «`/pages/clientesPotenciales` devuelve **0** para el 17/08 habiendo 6 en BD» | **Artefacto de automatización, ya avisado por F##:** el combo **Vendedor** seguía en `470` del lado del servidor, arrastrado de una tanda anterior, y **sobrevivió a un `browser_navigate` fresco**. Con el combo en su placeholder: **6 = 6** ✅ |
| «El defecto conocido `Monto total en USD` = `0,00` de pedidos» | **Ese indicador NO EXISTE en este build.** `/pages/pedidos` expone `Total Base · Total Descuentos · Total IVA · Monto Total`, y **los cuatro cuadran exacto** contra BD (M13). ⇒ `WEB-N/A`, no se confirma ni se desmiente |
| «`Total IVA: 0,00` y `Descuento:` vacío en pedidos» | Ya dictaminado: `order_detail.iva = 0` en todo el tenant y descuentos apagados por VG |
| «`Devolución en: 1`» · «`N°` = 1 en inventarios» · «Vendedor con solo el primer nombre» · «`Geo`» | Ya reportados o **por diseño** (`§5.b`) — no se repiten |

---

## FAMILIA M## — muestreo, registro por registro

### `/pages/cobros` — 5 registros · el módulo que faltaba cotejar

El usuario QA **no tiene ni un cobro** en el tenant, así que la familia C-HOY no pudo tocar este
módulo. Se muestrearon 5 cobros de vendedores reales, eligiendo **una forma distinta cada vez**.

#### M01 · Cobro `32992` — 18/08, **HOY** — pago parcial sobre 2 documentos — `WEB-OK`

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `No. de Ref.` / `Estatus` | `32992` / `Por aprobar` | `id_collection 32992` / `st_collection 3` | ✅ |
| `Fecha del cobro` | `18/08/2026 07:34:56` | `da_collection 11:34:56Z` (UTC−4) | ✅ |
| Cliente / `Responsable` | `009965 · FAMILY DOLLAR, C.A.` / `Yanelys León` | idem | ✅ |
| `Comentario` | `crédito 30 Días 45%` | `tx_comment` idéntico | ✅ |
| `Monto total base` | `576,77 US$` | `Σ nu_amount_doc = 509,17 + 67,60` | ✅ |
| `Total Monto a pagar` | `317,27 US$` | `nu_amount_final` = `Σ nu_amount_paid` | ✅ |
| `Diferencia de cobro` | `92,92` | `nu_difference` | ✅ |

**Oráculos de cálculo — cuadran los tres:**

```
Monto total base   = 509,17 + 67,60                    = 576,77 ✅
Total Monto a pagar = 280,04 + 37,23                   = 317,27 ✅
Diferencia          = 410,19 (Σ pagos) − 317,27        =  92,92 ✅
```

`Pago parcial = SI` en las 2 filas ↔ `in_payment_partial = true`. ✅

#### M02 · Cobro `32689` — 13/08 — **RETENCIÓN con IVA + ISLR** — `WEB-OK`

El caso que más faltaba: `co_type = 2` con **las dos retenciones a la vez** (solo 2 cobros del tenant
las tienen).

| Campo | Web | BD | ✓ |
|---|---|---|---|
| `Retención IVA` | `149,90 US$` | `nu_amount_retention_iva 149.90` | ✅ |
| `Retención ISLR` | `199,86 US$` | `nu_amount_retention_islr 199.86` | ✅ |
| `Total Monto a pagar` | `349,76 US$` | `149,90 + 199,86` = `nu_amount_total` | ✅ |
| `Doc Retención` | `20260800006286` | `nu_voucher_retention` | ✅ |
| `Fecha Comprobante` | `11/08/2026` | `da_voucher` | ✅ |
| `Monto total base` | `1.482,12 US$` | `nu_amount_doc` de `FACT9296` | ✅ |
| `Motivo` | `COMPROBANTE DE RETENCION ADJUNTO` | — | ✅ |

⚠ Las columnas `Pagos` y `Monto cobrado` de la lista salen **vacías** y la tabla de pagos del detalle
dice `No se encontraron registros.` — **por diseño** (`§5.b`), en retenciones no hay método de pago.

#### M03 · Cobro `32974` — 17/08 — **ANTICIPO con 2 pagos** — `WEB-OK`

- Desglose de la lista: `54,13 US$` `203,87 US$` ⇒ **Σ = 258,00** = `Total por cobrar` = indicador. ✅
- 🔑 **El detalle de un anticipo usa un pie DISTINTO**: solo `Monto pagado: 258,00 US$`, **sin**
  `Monto total base`, **sin** IGTF y **sin** tabla `Documentos Pagados` (`co_type=1` no lleva
  documentos). Los 2 pagos aparecen con su `Nro Documento` completo. ✅

#### M04 · Cobro `32969` — 17/08 — 4 documentos **con una nota de crédito** — `WEB-OK` (+ Hallazgo 1)

| Línea | Nro Factura | Monto doc | Monto a pagar |
|---|---|---|---|
| 1 | `FACT50045893` | 95,88 | 95,88 |
| 2 | `FACT50045894` | 34,00 | 34,00 |
| 3 | `FACT50045895` | 1.103,48 | 1.103,48 |
| 4 | **`NCR1392`** | **−2,24** | **−2,24** |
| | | **Σ = 1.231,12** = `Monto total base` ✅ | |

✅ **La nota de crédito se pinta en negativo y entra en el subtotal** — correcto.
`Total Monto a pagar 1.233,36` = `nu_amount_final` = el pago. Este es el registro que dispara el
Hallazgo 1 (indicador `0,00`).

#### M05 · Cobro `32455` — 10/08 — pago cargado en otra moneda — `WEB-OK`

Web: `Monto cobrado 675.556,52 US$` · `Total por cobrar 1.114,72 US$` · `Diferencia 674.441,80 US$`.
**Los tres coinciden con BD.** El vendedor cargó bolívares en un cobro US$ ⇒ **defecto de captura
móvil**, la web es fiel (ver descartes).

### `/pages/pedidos` — 2 registros

#### M06 · Pedido `2812` — 18/08, **HOY** — 22 líneas — `WEB-OK`

- **Σ de los 22 subtotales = 1.149,61** = `Subtotal bruto` = `Monto Base Pedido` = `Monto Total Pedido`
  = `Monto Base`/`Monto Total` de la fila = indicador de cabecera. **Cinco lugares, el mismo número.**
- **`Precio base × Unidades pedidas == Subtotal` en las 22 líneas, 0 desvíos** (verificado línea a
  línea, no por muestreo).
- Numeración `N°` **1..22 correcta**.
- `Tipo de Pedido: PEDIDO ESTANDAR` — el detalle **sí** trae tipo aunque `selectOrderType=false` y el
  combo de filtro venga vacío (F##). No es contradicción: la VG gobierna si el vendedor **elige**.

#### M07 · Pedido `2808` — 17/08 — **53 líneas** — `WEB-OK`

- Las **53 líneas se pintan de una vez, sin paginador**. Numeración **1..53**.
- **Σ = 26.640,83** = pie = fila = indicador. 0 líneas con `precio × cantidad ≠ subtotal`.

### `/pages/devoluciones` — M08 · Devolución `331` — 13/08 — **4 facturas** — `WEB-OK`

Ejerce `multiInvoices = true`, la VG nueva de este cliente. **11 líneas, 11/11 exactas** contra
`return_detail` en producto, **lote**, `N° Factura`, motivo y cantidad.

| | |
|---|---|
| Facturas distintas | **4** (`001`, `002`, `003`, `0001`) ✅ se cargan varias en una devolución |
| `Precinto` | `0001` = `nu_seal` ✅ |
| `Tipo de devolución` | `Calidad` = `id_type 60` ✅ |
| `Observaciones` | = `tx_description` ✅ |
| Numeración `N°` | **1..11 correcta** |

⚠ Los `N° Factura` son `001`/`002`/`003` — texto libre. **Confirma que `requeridedNroFactura=true` NO
valida contra facturas reales** (era una duda abierta del perfil, punto 7 de pendientes). Es del móvil.
⚠ `Devolución en = 1` en las 11 filas — 🟡 ya reportado, no se repite.

### `/pages/inventarios` — M09 · Inventario `53` — 18/08 **16:56, HOY** — `WEB-OK`

Registro **posterior al manifiesto** (`_hoy-manifest.jsonl` cierra en el 52): lo creó la corrida móvil
con el comentario `inv-smoke-2ubicaciones`, justo para el caso que el perfil marca como delicado.

| Producto | BD | Web `Depósito` | Web `Exhibición` | ✓ |
|---|---|---|---|---|
| **LLA-01** | `dep = 3` **y** `exh = 7` | `3.00 UNIDADES` | `7.00 UNIDADES` | ✅ **una sola fila, las dos cantidades separadas** |
| TM01 | `exh = 5` | `-` | `5.00 UNIDADES` | ✅ |

✅ **El mismo producto en dos ubicaciones NO se fusiona ni pierde una de las dos cantidades** — era el
riesgo declarado en `modules.inventarios` del perfil. Queda cerrado.
`Ver Pedido Relacionado` vacío = `id_order NULL` ✅.
⚠ `N°` = `1` en las 2 filas (Hallazgo 3) · ⚠ el lote `QA-INV-0818` no se muestra (Hallazgo 5).

### `/pages/visitas` — M10 · Visita `2050` — 17/08 — **2 actividades** — `WEB-OK`

| Comprobación | Resultado |
|---|---|
| Filas en la lista | **2**, misma `Ref 2050`, `Total de Resultados: 2` ⇒ **es el modelo `Σ greatest(count(incidence),1)`, no un duplicado** ✅ |
| Descripciones | `crédito` y `va a cabcelar la nota pendiente para realizar pedido` = las 2 filas de `incidence` ✅ |
| Actividad / Motivo | `NO COMPRO` / `OTROS` = `co_type 71` / `id_motive 160` ✅ |
| `Geo` | `Correcto` para `st_coordinate = 5` ✅ (valor nuevo: F## solo vio 4 = Fuera de Rango) |
| `Fecha Enviada` | `17/08/2026 14:08:30` = `da_real 18:08:30Z` (UTC−4) ✅ |
| `Fecha Iniciada` | vacía = `da_initial NULL` ✅ local-driven |

### `/pages/clientesPotenciales` — M11 · Cliente `192` — 17/08 — `WEB-OK`

**13/13 campos exactos** contra `potential_client`: epoch `1787001682760.0`, nombre, `Cédula`
`J-401303145`, comentario, responsable, correo, teléfono, dirección, **dirección de entrega**
(distinta de la dirección y correcta) y coordenada. `Web:` vacío = `na_web_site NULL` ✅.

### `/pages/depositos` — M12 · Depósito `2` — 16/07 — `WEB-CALC-MISMATCH`

Cabecera fiel campo a campo (`N° Planilla 1201838918`, `N° cuenta`, `Fecha de planilla`,
`Observaciones`), **pero** `Monto depositado: 0,00 US$` contra una tabla hija que muestra `266,59 US$`
⇒ **Hallazgo 2**. `Banco: 006` ⇒ Hallazgo 4.

### Agregados de cabecera contra el conjunto filtrado

| Caso | Módulo | Web | BD (mismo `WHERE`, sin usuarios de baja) | ✓ |
|---|---|---|---|---|
| **M13** | pedidos, rango por defecto | 958 · Base `5.211.024,91` · Desc. `0,00` · IVA `0,00` · Total `5.211.024,91` | 958 · `5.211.024,91` · 0 · 0 | ✅ **los 4** |
| **M14** | cobros, rango por defecto | 1.026 · `5.412.913,36` | 1.026 · `5.412.913,36` | ✅ al céntimo |
| **M15** | clientes potenciales, 17/08 | 6 | 6 | ✅ |
| **M16** | cobros — indicador vs. lista | ver Hallazgo 1 | — | ❌ |

⚠ **Tenant vivo, comprobado:** F## midió `1025 / 5.412.686,36` a las 20:35 y esta tanda `1026 /
5.412.913,36` a las 21:17. La diferencia es **el cobro `32993`, creado a las 17:15 hora local** entre
ambas mediciones — no un descuadre. **Todo agregado hay que medirlo contra una BD leída en el mismo
minuto.**

---

## FAMILIA D## — comportamiento

### Orden, paginación y rows-per-page — `/pages/pedidos`, 958 registros

| Caso | Prueba | Resultado |
|---|---|---|
| **D02** | 1.er click en `Monto Total` | las **200 filas** de la ventana quedan **monótonas crecientes** (4,40 → 166,79); `rowCount` e indicadores intactos ✅ |
| **D03** | 2.º click (desc) | top-5 web = `1970/4.185.682,20 · 2598/297.721,40 · 2302/26.999,40 · 2808/26.640,83 · 2298/22.150,72` — **idéntico al top-5 de BD, en valor y en orden** ✅ |
| **D04** | última página (`page=4`, `rows=200`) | **158 filas** = 958 − 800 exacto; orden desc conservado ✅ |
| **D05** | rows-per-page `200 → 50` estando en `page=4` | recalcula a **`page=16`** (16×50 = 800 = 4×200): **mantiene el registro de inicio de la ventana** ✅ comportamiento fino, no trivial |
| **D06** | indicadores tras ordenar y paginar | **no se recalculan sobre la página visible**: siguen en `5.211.024,91` sobre el conjunto filtrado completo ✅ correcto |

**Columnas ordenables** (`ui-sortable-column`): `# Ref`, `Fecha creación`, `Fecha envío`, `Monto Base`,
`Monto Total`. **No ordenables:** `Estatus`, `Vendedor`, `Cliente`, `Total items`. Orden por defecto:
`# Ref` descendente.

### Navegación y estructura

| Caso | Prueba | Resultado |
|---|---|---|
| **D01** | 12 saltos de módulo por URL directa, pasando siempre por `/pages/main` | **0 páginas en blanco, 0 `IndexOutOfBoundsException`**, `document.title` nunca vacío; 8 `Consultar` sin fallo ✅ |
| **D09** | ¿pagina la tabla de líneas del detalle? | **No.** El pedido 2808 pinta sus **53** líneas de una vez, sin `.ui-paginator` ni widget `PF` ✅ |
| **D10** | coherencia listado ↔ detalle | verificada en **12 registros de 7 módulos**: `Ref`, fecha, cliente, vendedor y estatus coinciden en todos ✅ |
| **D13** | variantes de `detalleCobro` | **tres**, según `co_type` — ver tabla abajo ✅ |
| **D12** | conjunto vacío | `Total de Resultados: 0` + mensaje, sin excepción ni página en blanco; paginador y cabecera coherentes ✅ |

### D07 · Exportaciones — `WEB-N/A`

Barrido de **los 34 botones/enlaces visibles** de `/pages/pedidos` y de los del detalle de depósito:
**cero controles de exportación** (`Excel`, `PDF`, `CSV`, `Imprimir`). Los únicos `Descargar` del sitio
son los de adjuntos del detalle. **La funcionalidad no existe en este build** ⇒ no evaluable, no es
defecto.

### D08 · Toggler `Columnas` — `WEB-OK`

`form:pedidosDT:togglerPedidos` presente; su panel `.ui-columntoggler` lista **las 11 columnas** de la
tabla. **No se tocó ningún check** (queda fuera del set de controles autorizados).

### D14 · Control nuevo no documentado — `SKIP`

**`Mapa de Activación`** — `form:j_idt115:botonMapa`, en la barra de filtros de `/pages/pedidos`.
**No se pulsó** por prudencia read-only: no está en el set autorizado y no se sabe qué dispara.
📋 Queda propuesto para el **guión web extendido**.

---

## Patrones / selectores nuevos

### 🔑 NUEVO — `detalleCobro` tiene **TRES** variantes de pie según `co_type`

Un lector que espere siempre los mismos campos falla en 2 de cada 3 cobros. Medido en esta tanda:

| `co_type` | Pie | Tabla de pagos | Tabla `Documentos Pagados` |
|---|---|---|---|
| **0 · Cobro** | `Monto total base` · `Monto total descuento` · `Monto total IGTF` · `Total Monto a pagar` (+ las 4 `… conversión`) · `Tasa de conversión` | sí | **`form:documentosPagadosDT`** |
| **2 · Retención** | idéntico **+ `Retención IVA` + `Retención ISLR`** | **vacía** (`No se encontraron registros.`) | sí, con `Doc Retención` y `Fecha Comprobante` |
| **1 · Anticipo** | 🔴 **solo `Monto pagado` + `Monto pagado conversión` + `Tasa de conversión`** | sí | 🔴 **NO EXISTE** |

### 🔑 NUEVO — la tabla de documentos del cobro **sí tiene id semántico**

```
form:documentosPagadosDT     ← NO es j_idt*, se puede anclar por id
```
15 columnas: `N° · Fecha documento · Tipo documento · Nro Factura · Pago parcial · Monto doc ·
Saldo doc. · Total descuento · Monto a pagar · Doc Retención · Fecha Comprobante · Retención IVA ·
Retención ISLR · Diferencia/Faltante · Moneda`.
⚠ La **tabla de pagos** sigue siendo `j_idt*` (**hoy `form:j_idt177`**) ⇒ anclarla por columnas
`['Forma de pago','Monto cobrado']`, como manda `_comunes.md`.

### 🔴 CORRECCIÓN medida — de dónde sale cada importe de la lista de cobros

Tres orígenes distintos que **no siempre coinciden**. Confundirlos produce falsos mismatch:

```
Monto cobrado      → collection_payment  (DESGLOSE, una cifra por pago)
Total por cobrar   → collection.nu_amount_final
Diferencia cobro   → collection.nu_difference        (viene de BD, NO la calcula la web)
Monto total en US$ → Σ collection.nu_amount_total    (indicador de cabecera)
```

`nu_difference` se confirmó **leída, no calculada**: en el cobro 32455 la web muestra `674.441,80` y BD
guarda exactamente `674441.80`.

### 🔴 Los `j_idt*` de detalle **volvieron a correrse**

| Tabla | `_comunes.md` | **Hoy, La Tortuga 18/08** |
|---|---|---|
| `detalleDevolucion` (líneas) | `j_idt169` → `j_idt170` | **`j_idt169`** |
| `detalleCobro` (pagos) | `j_idt177` → `j_idt178` | **`j_idt177`** |
| `detalleDeposito` (cobros hijos) | `j_idt163` | **`j_idt163`** |

⇒ **No es una deriva monótona: van y vienen entre builds.** Refuerza por 8.ª vez la regla de anclar por
columnas. `detalleVisita` usa **`form:visitasDT`** (semántico) y `detalleInventario`/`detallePedido`
usan **`form:pedidosDT`** (el mismo id que la lista).

### 🔴 NUEVO — los **combos** de filtro sobreviven a `browser_navigate`; el `# Ref` **no**

Medido de forma tajante en `/pages/clientesPotenciales`: entrada fresca al módulo, y el `<select>`
Vendedor seguía en **`470`** de una tanda anterior mientras `[id$=":n_ref"]` llegaba **vacío**.
Costó un falso «la web pierde 6 clientes potenciales».

```js
// SIEMPRE antes de medir: leer el estado real de los filtros, no suponerlo
document.querySelectorAll('input,select').forEach(el => { /* …_input de cada combo… */ });
```
⇒ **Ampliar la nota de `_comunes.md`:** no basta con que `Limpiar` no toque los combos — **tampoco los
limpia una navegación completa**. Hay que ponerlos en su placeholder a mano, uno por `evaluate`.

### ✅ Receta de limpieza de combo — reconfirmada 2/2

`[id$=":<suf>_label"].click()` → esperar 700 ms → click en el `<li>` cuyo texto es el **placeholder**
dentro de `[id$=":<suf>_panel"]` → esperar 2,2 s → **verificar `_input.value === ''` Y la etiqueta**.
Funcionó en `idSalesmaView` y en `attachStatus`.

### ✅ El placeholder de adjuntos de clientes potenciales es **`Tiene Adjunto`** con `value = 0`

Opciones reales: `Tiene Adjunto` (placeholder, `0`) · `SI` · `NO`. ⚠ El **placeholder se llama igual
que un filtro real** — un `setCombo(..., 'Tiene Adjunto')` deja el filtro **sin aplicar** creyendo que
lo aplicó. Es un tercer literal distinto, además de los `SI`/`NO` y los `Tiene Adjuntos`/`No Tiene
Adjuntos` de visitas que documentó F##.

### ✅ Paginar y ordenar por API de PrimeFaces, sin tocar `j_idt*`

```js
PF('pedidosDT').paginator.setPage(4);                       // 0-based
document.querySelector('.ui-paginator-rpp-options').value = '50';   // + Event('change')
th.click();                                                  // th.ui-sortable-column: 1º asc, 2º desc
```
Las tres conservan filtro, `rowCount` e indicadores. **`rows-per-page` persiste entre módulos y entre
sesiones de agente**: esta tanda arrancó en `rows = 200` porque lo dejó así el agente F##.

### ✅ Lector de detalle `#form.innerText` — 8/8, con dos guardas nuevas

Resolvió los 8 detalles (7 módulos) sin reintentos. **Dos artefactos propios a filtrar** — ninguno es
defecto:

1. **La hora se cuela como clave:** `Fecha del cobro: 18/08/2026 07:34:56` genera además la entrada
   basura `"18/08/2026 07" → "34:56"`. ⇒ **descartar toda clave con patrón de fecha.**
2. En `detallePedido`, `IVA:` absorbe `Monto Total Pedido: …` (ya conocido) — el valor correcto se
   recupera leyendo la clave siguiente.

### ✅ `Σ subtotales == pie == fila == indicador`: verificar las 4, no 2

En pedidos el mismo importe aparece en **cinco** lugares (líneas, `Subtotal bruto`, `Monto Base`,
`Monto Total` de la fila, indicador de cabecera). Comprobar los cinco cuesta una `evaluate` y es lo
que convierte un `WEB-OK` en una afirmación fuerte. Receta usada:

```js
// dentro de la fila: "Precio base: 4,79 US$ Subtotal: 47,90 US$"
const mp = txt.match(/Precio base:\s*([\d.,]+)/), ms = txt.match(/Subtotal:\s*([\d.,]+)/);
// y comparar precio × unidades contra subtotal, línea por línea
```

> ✅ consolidado 2026-08-19 → `web-selectors/cobros.md` (3 variantes de pie, `documentosPagadosDT`,
> orígenes de los 4 importes) · `pedidos.md` (5 lugares, orden/paginación, `N°`) · `_comunes.md`
> (combos que sobreviven a `navigate`, `j_idt*` que van y vienen, artefactos del lector) ·
> `depositos.md` (nuevo).

---

## Qué revisaría primero

1. **`collection.nu_amount_total = 0` con pagos cargados** (Hallazgo 1) — **25 cobros del mes en
   curso**, el último de ayer. Rompe el indicador que se lee todos los días. **El arreglo es del móvil
   o del servicio**, y de paso conviene que la web no titule "Monto total" a algo que contradice su
   propia columna.
2. **`deposit.nu_amount_doc = 0`** (Hallazgo 2) — el detalle del depósito se desmiente a sí mismo en
   pantalla. Mismo origen que el punto 1.
3. **Pagos cargados en bolívares dentro de cobros en US$** (descarte 2) — 5 cobros del usuario 488, uno
   con una `Diferencia cobro` de **674.441,80 US$**. No es defecto de la web, pero **contamina toda la
   conciliación** y merece una validación en la app.
4. **`N°` = 1** en `detalleInventario` **y `detalleVisita`** (Hallazgo 3) — cosmético, arreglo barato,
   **dos pantallas**.
5. **Códigos crudos** `Banco: 006` y `ot:` (Hallazgo 4) — el propio detalle demuestra que el nombre
   está disponible.
6. **El lote no se muestra en inventarios** (Hallazgo 5) — inocuo en este tenant (1 lote), **serio en
   uno que use lotes de verdad**. Confirmar con Desarrollo si es intencional.

---

*Agente WEB · familias `M##` + `D##` · 2026-08-18 · read-only · 30 casos · 0 descargas · oráculo BD `run_vzla`*
