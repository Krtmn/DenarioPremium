# WEB · Pedido sugerido con fórmula propia — hidroponias

**RUN_ID** `hidroponias_sugerido_20260811` · **capa** WEB · **playa** LA TORTUGA
`http://denariolatortuga.ddns.net:8080/DenarioPremium` · **read-only** · 2026-08-11

---

## 0. Guarda de tenant — ✅ PASADA

| Comprobación | Resultado |
|---|---|
| Selector Empresa (`[id$=":idEnterprise_input"]`), anclado al **TEXTO** | **`HIDROPONIAS VENEZOLANAS C.A`** (seleccionada) |
| Otra opción del combo | `Empresa de Pruebas de INtegracion Denario` |
| Vendedor único del tenant | `468 | Kevin Wilches` (= `co_user` `V4` en BD) |
| BD | `client_stock` / `order` con `co_enterprise = 'HIDRO_A'` |

⚠ El `value` de Empresa **no es uniforme entre módulos** (reconfirma `_comunes.md`):
`/pages/inventarios` → **`1`** (`id_enterprise`) · `/pages/pedidos` → **`HIDRO_A`** (`co_enterprise`).
**Nunca compararlo contra BD; anclar al texto.**

Se operó sobre hidroponias, no sobre globalmp ni alipascua.

---

## 1. Identidad del cliente de prueba — 🔴 TRAMPA, leer antes de cotejar

El enunciado dice «cliente **147**». En BD eso es ambiguo:

| Interpretación | Registro | ¿Es el de prueba? |
|---|---|---|
| `co_client = '147'` | `id_client` **150** · CENTRAL MADEIRENSE C.A. · última factura **06/08/2026** | ✅ **SÍ** |
| `id_client = 147` | `co_client` `1302` · **PLANSUAREZ C.A** | ❌ otro cliente |
| `co_client = '147'` (2º homónimo) | `id_client` **646** · CENTRAL MADEIRENSE C.A. | ⚠ duplicado |

Hay **31 clientes** llamados `CENTRAL MADEIRENSE C.A.` en el tenant, con `co_client` `103`, `105`, `119`,
`125`, `147`, `151`, `153`, `154`… **El nombre no identifica al cliente.** Cotejar siempre por `co_client`.

La query de detección del enunciado (`WHERE co_client='147'`) es **correcta**; lo que no sirve es filtrar por
`id_client=147`.

---

## 2. ¿Qué expone la web del pedido sugerido? → **SOLO EL TOTAL. CERO DESGLOSE.** `WEB-MISSING`

**Es la primera vez que se mapea este flujo.** Barrido completo del menú (54 entradas) + 3 pantallas medidas.

### 2.a No existe pantalla de «pedido sugerido»
No hay entrada de menú, ni ruta, ni pestaña. El sugerido **no tiene superficie propia en la web**.

### 2.b `/pages/detalleInventario` — no muestra ningún término de la fórmula

Cabecera (11 campos): `No. de Ref.` · `Código inventario` · `Fecha de inventario` · `Vendedor` ·
`Codigo del cliente` · `Nombre del cliente` · `Sucursal del cliente` · `Empresa` · `Comentario` · `Ubicación`.

Tabla de líneas `form:pedidosDT`:
`N° · Cod. producto · Producto · Estructura · Depósito · Exhibición`

| Término de la fórmula | ¿Lo muestra la web? |
|---|---|
| `currentStock` | ✅ sí — columnas `Depósito` / `Exhibición` |
| `previousStock` | ❌ **no** |
| `dispatchedStock` (Despacho) | ❌ **no** |
| `straightSwapStock` (Cambio x Cambio) | ❌ **no** |
| `initialStock` (Inventario Inicial) | ❌ **no** |
| `soldUnits` (Venta) | ❌ **no** |
| `estimatedDailyUnits` | ❌ **no** |
| `quUnitSuggested` (Cantidad sugerida) | ❌ **no** |
| `days_since_last` / `days_until_next` | ❌ **no** — están en BD (`client_stock`) y la web **no los pinta** |

🔴 **`days_since_last` y `days_until_next` son el divisor y el multiplicador de la fórmula, viven en BD y la
web no los expone en ninguna pantalla.** Sin ellos el administrativo no puede auditar ni reproducir el cálculo.

### 2.c `/pages/detallePedido` — tampoco

Tabla de líneas: `N° · Cod. producto · Producto · Lista de precio · Unidades pedidas · Monto Total · Monto conv.`
⇒ **solo `Unidades pedidas` (la cantidad final, ya editada por el vendedor). No hay columna «sugerido».**

⚠ Diferencia contra `web-selectors/pedidos.md` (escrito en El Yaque): acá **NO aparece la columna `Almacen`**.
El juego de columnas del detalle de pedido **cambia por tenant** ⇒ anclar por texto de encabezado.

✅ **Sí existe el enlace cruzado inventario↔pedido:** la cabecera trae **`Inventario relacionado: Ref.: 35`**
(cotejado: `order.id_client_stock = 35` para el pedido 34). Es el único puente entre ambos módulos.

### 2.d Reporte relacionado: `/pages/reporteRotacionInventario` — existe y **está roto** (ver §5, D-01)

Columnas: `Nombre · SELL IN · SELL OUT · Plan VS Cumplimiento · **Inventario Inicial** · **Inventario Final** ·
Rotaciòn Inventario · Rotación VS SELL OUT · SELL POINTS`.
Es la **única** pantalla de toda la web que nombra «Inventario Inicial» — el término central de la fórmula.

**Veredicto §2: `WEB-MISSING`** — la web muestra únicamente la cantidad final pedida; ninguno de los 7 términos
intermedios de la fórmula es visible en ninguna pantalla.

---

## 3. Cotejo de lo HISTÓRICO contra BD → **cuadra** `WEB-OK`

### 3.a Lista de inventarios (`/pages/inventarios`, rango por defecto 01/08–11/08)

| Medición | Web | BD | |
|---|---|---|---|
| Conteo (`PF('pedidosDT').paginator.cfg.rowCount`) | **14** | **14** | ✅ |
| `# Ref` presentes | 34…47 (14 correlativos) | 34…47 | ✅ |
| Nombre de cliente (6 filas verificadas) | MADEIRENSE / EXCELSIOR GAMA / INSIDE MARKET / MERCATO / PLANSUAREZ / FRESCO MARKET | idéntico vía `client.na_client` | ✅ 6/6 |
| Vendedor | `Kevin Wilches` en las 14 | `co_user='V4'` en las 14 | ✅ |

### 3.b Fechas — ⚠ nota de método que evita un falso mismatch

| Ref | Web («Fecha creación») | BD `da_client_stock` crudo |
|---|---|---|
| 47 | `06/08/2026 11:18:40` | `06/08/2026 11:18:40` ✅ |
| 46 | `03/08/2026 14:16:37` | `03/08/2026 14:16:37` ✅ |
| 45 | `06/08/2026 09:46:38` | `06/08/2026 09:46:38` ✅ |

🔴 **`query.js` serializa los `timestamp without time zone` con sufijo `Z` y desplazados +4 h** (ej. muestra
`2026-08-06T15:18:40.000Z` para un valor almacenado `11:18:40`). **Es artefacto del driver, no del producto.**
Aplicar un `-4 h` «para corregir la zona» produce un **falso `WEB-FIELD-MISMATCH`**. Cotejar siempre con
`to_char(campo,'DD/MM/YYYY HH24:MI:SS')`.
⚠ Además, «Fecha creación» de la lista mapea a **`da_client_stock`**, no a `da_created` (difieren hasta 35 min).

### 3.c Detalle de inventario **Ref 47** (cliente `103`, CENTRAL MADEIRENSE, sucursal SANTA MARTA)

**9/9 líneas coinciden** con `client_stock_detail_view`:

| Producto | Web (Exhibición) | BD `qu_stock` | |
|---|---|---|---|
| AJO PELADO 150 GRS (E) `POT013PLS004031` | 24.00 UNIDAD | 24 | ✅ |
| AJO EN MALLA `MAL013PLS098MOR` | 16.00 | 16 | ✅ |
| ALFALFA CAJA 100 GRS `GERPROALF002CAJ` | 18.00 | 18 | ✅ |
| CEBOLLIN ATADO `CAMPROCEB002ATA` | 15.00 | 15 | ✅ |
| TOMATE CHERRY `TOMPROCHE001CAJ` | 14.00 | 14 | ✅ |
| ESPINACA `046013ESP001BOL` | 6.00 | 6 | ✅ |
| GRANO CHINO `GERPROGCH002BOL` | 2.00 | 2 | ✅ |
| MAIZ SUPER DULCE `CAMPROSDU002BOL` | 1.00 | 1 | ✅ |
| ALBAHACA `046PRO003003025` | 1.00 | 1 | ✅ |

`Depósito = "-"` en las 9 ⇔ `ubicacion='exh'` en las 9 ✅ · Estructura HV/FRESCALES ✅ · Sucursal SANTA MARTA ✅.
Cabecera: `Código inventario 1786029520622.0` = `co_client_stock` ✅.

### 3.d Detalle de pedido **Ref 34** (nacido del inventario 35)

**12/12 líneas coinciden** con `order_detail` (código, unidades, precio base y subtotal).
Muestra: `046013461003BAN` 5 uds · 3,00 USD · 15,00 USD ⇔ BD `nu_price_base 3.0000` / `nu_amount_total 15.0000`.
Cabecera: `Total items 12` ✅ · `Monto Base 356,65 USD` ⇔ suma de subtotales ✅ · `Inventario relacionado Ref.: 35`
⇔ `order.id_client_stock=35` ✅.

> ⚠ Dato de arquitectura: **`order_detail` no tiene columna de cantidad**. Las «Unidades pedidas» que pinta la
> web son **derivadas** (`nu_amount_total / nu_price_base`). El único campo de cantidad es `qu_suggested` — ver §5.

**Veredicto §3: `WEB-OK`** — todo lo histórico que la web muestra coincide con BD (conteos, refs, clientes,
vendedor, fechas, productos, cantidades, importes y el enlace cruzado). **0 mismatches en 27 campos cotejados.**

---

## 4. Fix «facturas de cualquier cliente» → **NO VERIFICABLE DESDE LA WEB** `WEB-N/A`

El fix reportado por desarrollo es: *«se estaba trayendo las facturas de cualquier cliente, no solo las del
cliente seleccionado»*. Alimenta `dispatchedStock` ← última factura del **cliente + sucursal**.

**La web no expone la columna Despacho ni el detalle del sugerido** (§2) ⇒ **no hay superficie administrativa
donde confirmar ni refutar el fix.** Tampoco queda rastro persistido: `order_detail.qu_suggested` vale 0 en el
100 % de las líneas (§5, D-02). ⇒ `WEB-N/A` **por ausencia de superficie, no por fallo de infraestructura.**

**Esto es en sí un hallazgo:** un fix declarado corregido **no tiene forma de auditarse desde el lado
administrativo**. La única verificación posible es la del agente móvil, contra los números que pinta la app.

### 4.a Insumo de BD para que el móvil pueda juzgar el fix

Cliente de prueba `co_client='147'` (`id_client` 150), sucursal `co_address_client='147'`:

| Factura | `da_invoice` | ¿Del cliente 147? |
|---|---|---|
| `id_invoice` **4064** (`co_invoice` 20116439) | 06/08/2026 | ✅ sí |
| `id_invoice` **4063** (`co_invoice` 20116438) | 06/08/2026 | ✅ sí |
| 3988 / 3987 | 03/08/2026 | ✅ sí |

**Despacho esperado** si la última factura es la **4063** (derivado, `nu_amount_total / nu_price_base`):

| Producto | Unidades facturadas 06/08 |
|---|---|
| `046013ESP001BOL` ESPINACA | **48** |
| `GERPROALF002CAJ` ALFALFA | **50** |
| `GERPROGCH002BOL` GRANO CHINO | **20** |

🟠 **RIESGO ABIERTO — empate de «última factura».** El cliente 147 tiene **DOS facturas con la misma
`da_invoice` (06/08)**: 4063 y 4064. Además **`da_invoice` no tiene componente horario** (todas a `00:00:00`)
⇒ «la última factura» es **ambigua por diseño** cuando hay 2 el mismo día, y **los 3 productos de prueba solo
están en la 4063**. Si el desempate toma la 4064, el despacho de esos 3 productos sale **0**.
El patrón de 2 facturas por día es **sistemático** en este tenant (se repite el 30/07, 03/08, 23/07, 20/07).
⇒ **Pedirle a desarrollo el criterio de desempate**; y si el móvil reporta despacho 0 en estos 3 productos,
**es esta la causa, no el fix del cliente.**

---

## 5. Defectos nuevos con evidencia

### 🔴 D-01 · `ROT-INV-CERO` — «Inventario Inicial» e «Inventario Final» son **siempre 0** en el reporte de Rotación

**Pantalla:** `/pages/reporteRotacionInventario` · **Severidad: alta** (es el único reporte del flujo).

| Filtros | Filas | `Inventario Inicial` | `Inventario Final` | `Rotaciòn Inventario` |
|---|---|---|---|---|
| Empresa HIDROPONIAS · Productos · UNIDAD · 01/07–11/08 · **Pedido** | 22 | **0 en las 22** | **0 en las 22** | **0 en las 22** |
| ídem · **Facturado** | 50 | **0 en las 50** | **0 en las 50** | **0 en las 50** |

`SELL OUT` sí trae valores reales en modo Pedido (ESPINACA 1.044, MAIZ 1.013, CEBOLLIN 595…), o sea que el
reporte **consulta bien las ventas y solo falla el inventario**.

**Contraprueba en BD (misma ventana 01/07–11/08):**

| Producto | Web `Inventario Final` | BD (`client_stock_detail_view` ⋈ `client_stock`) |
|---|---|---|
| `046013ESP001BOL` ESPINACA | **0** | **703** unidades en 37 líneas |
| `GERPROALF002CAJ` ALFALFA | **0** | **570** en 36 líneas |
| `TOMPROCHE001CAJ` TOMATE CHERRY | **0** | **557** en 43 líneas |
| `POT013PLS004031` AJO PELADO | **0** | **547** en 38 líneas |

⇒ hay **14 inventarios cargados y visibles en `/pages/inventarios`** en esa ventana, y el reporte los ignora.
Descartado que sea filtro: se probó con los 45 checkboxes de `checkboxValor` activos y con ambos modos del
combo `cumplimiento`. Medido **dos veces** (regla de render rezagado).

🟠 **D-01.b · el reporte sale vacío sin aviso si no se elige `Unidad de Venta`.** Con el filtro en su
placeholder devuelve *«No se encontraron registros.»* y **ningún mensaje de validación**; al poner `UNIDAD`
aparecen 22 filas. Es un filtro obligatorio no señalizado ⇒ **se lee como «no hay datos»**.
⚠ Para automatización: **no cantar `WEB-MISSING` en este reporte sin haber fijado `Unidad de Venta`.**

### 🔴 D-02 · `SUG-QU-CERO` — la cantidad sugerida **nunca se persiste**: `qu_suggested = 0` en el 100 % del tenant

```sql
SELECT count(*) lineas, count(*) FILTER (WHERE qu_suggested=0) ceros,
       count(*) FILTER (WHERE qu_suggested>0) positivos, max(qu_suggested) maxi
FROM order_detail WHERE co_operation<>'D';
-- lineas 559 · ceros 559 · positivos 0 · maxi 0.0000
```

- **559 de 559 líneas** de pedido del tenant, **ningún valor positivo jamás**, incluidos los **9 pedidos nacidos
  de un inventario** (`order.id_client_stock IS NOT NULL`), que son exactamente los que deberían traerla.
- La tabla **`suggested`** (`id_suggested, co_client, co_product, qu_suggested…`) está **vacía: 0 filas**.
- ⇒ **no queda ningún rastro de lo que la fórmula calculó.** El sugerido es efímero: vive en la pantalla del
  móvil y se pierde. Ni la web ni BD pueden auditarlo. Esto **bloquea la validación administrativa del
  requerimiento completo**, y explica por qué §4 no es verificable.

> Matiz honesto: la regla `si currentStock >= quUnitSuggested ⇒ 0` puede producir ceros legítimos. Pero
> **559/559 en 5 meses, con 2.508 swaps y ventas reales**, no es explicable por esa regla.

### 🔴 D-03 · `INV-QU-NULL` — `invoice_detail.qu_total` es **NULL en las 4.416 líneas** del tenant

```sql
SELECT count(*) lineas, count(qu_total) no_nulos FROM invoice_detail WHERE co_operation<>'D';
-- lineas 4416 · no_nulos 0
```

`qu_total` es la **única columna de cantidad** de `invoice_detail`, y es la fuente natural de
`dispatchedStock`. Está **vacía en el 100 % de las facturas**; la cantidad solo se recupera derivándola
(`nu_amount_total / nu_price_base` → ESPINACA 48, ALFALFA 50, GRANO CHINO 20 en la factura 4063).

**Hipótesis de causa raíz de D-02, para desarrollo:** si el cálculo del sugerido lee `qu_total`, obtiene NULL →
`dispatchedStock = 0` → `initialStock` subestimado → `soldUnits ≤ 0` → `estimatedDailyUnits = 0` →
**`quUnitSuggested = 0` siempre**. La cadena de evidencia (D-02 + D-03) es consistente al 100 %.
**No verificado contra el código** — es una hipótesis con evidencia de datos, no una conclusión.

### 🟠 D-04 · Cliente 147 sin inventario previo ⇒ división por `daysSinceLastInventory` sin cubrir

`SELECT … FROM client_stock WHERE co_client='147' AND co_operation<>'D'` → **0 filas**.
El inventario que cree el móvil hoy será **el primero** de ese cliente ⇒ no hay `previousStock` (=0) y
`daysSinceLastInventory` no tiene valor natural. `estimatedDailyUnits = soldUnits / daysSinceLastInventory`
**divide por ese número**: si llega 0 ⇒ `Infinity`/`NaN`; si llega null ⇒ el sugerido queda indefinido.
**Caso borde no cubierto por el enunciado. Vigilar `days_since_last` del registro nuevo.**

---

## 6. Selectores nuevos — primer mapeo del flujo (promover a `web-selectors/`)

### `/pages/inventarios`
```
tabla lista        form:pedidosDT   (compartido; verificar pathname antes de leer)
columnas lista     Detalle · # Ref · Estatus · Fecha creación · Vendedor · Cliente
filtros (sufijos)  :idEnterprise_* · :idSalesmaView_* · :clientSOM_* · :attachStatus_*
                   :orderStatus_* · :dateB_input · :dateF_input · :ajax · :botonLimpiar
Status opciones    0 placeholder · 2 Enviado · 6 Por aprobar   ⚠ distintas de pedidos (6/26/-1)
⚠ SIN filtro :n_ref  ← inventarios NO tiene filtro por # Ref en esta playa
⚠ Empresa value = 1 (id_enterprise)
```

### `/pages/detalleInventario`
```
tabla líneas   form:pedidosDT
columnas       N° · Cod. producto · Producto · Estructura · Depósito · Exhibición
cabecera       regla hoja-siguiente (11 campos, resolvió 100 %)
⚠ "Comentario:" vacío absorbe el botón «Descargar adjuntos» ⇒ descartarlo como valor
⚠ "Ubicación:" absorbe «Mapa» / controles del mapa
⚠ NO aparece «Ver Pedido Relacionado» cuando order.id_client_stock es NULL (ej. Ref 47)
```

### `/pages/detallePedido` (hidroponias)
```
columnas   N° · Cod. producto · Producto · Lista de precio · Unidades pedidas · Monto Total · Monto conv.
           ⚠ SIN columna «Almacen» (difiere de lo documentado en El Yaque) ⇒ anclar por texto
cabecera   + «Inventario relacionado: Ref.: N»  ← enlace cruzado pedido→inventario (nuevo)
           + «Plataforma», «¿Por Aprobar?», «Canal de distribución», «Rif cliente», «Sucursal»
padre-primero resuelve el pie; hoja-siguiente la cabecera (conviven, confirmado)
⚠ «Conversiòn Monto Total» absorbe el «N°» del encabezado de la tabla (reconfirmado)
```

### `/pages/reporteRotacionInventario` (NUEVO — no estaba mapeado)
```
tabla        form:TablaRotacion       (⚠ NO expone paginator.cfg.rowCount → contar <tr>)
columnas     Nombre · SELL IN · SELL OUT · Plan VS Cumplimiento · Inventario Inicial ·
             Inventario Final · Rotaciòn Inventario · Rotación VS SELL OUT · SELL POINTS
filtros      :idEnterprise_* · :clasificacion_* (Productos|Linea|Sub-Linea) ·
             :cumplimiento_* (Pedido|Facturado) · :unidad_* (27 opciones) ·
             :checkboxValor (selectcheckboxmenu, 45 ítems) · :invSano (texto «Inventario Sano: 3.0») ·
             :fechaDesde_input / :fechaHasta_input   ← ⚠ NO son :dateB/:dateF
botones      :ajax (Buscar) · :botonLimpiar · TablaRotacion:verGrafico
🔴 :unidad es OBLIGATORIO de facto y no avisa (ver D-01.b)
🔴 las fechas se setean con el widget: PrimeFaces.widgets[...].setDate('DD/MM/YYYY')
```

### Login La Tortuga (build 2026-08-11)
```
input[placeholder="Usuario"] · input[placeholder="Clave"] · button#j_idt16 («Ingresar»)
🔴 los j_idt* VOLVIERON a coincidir con los históricos (j_idt12/14/16) en ESTA playa,
   pero se ancló por placeholder/rol — no promover los j_idt*.
```

### Trampas reconfirmadas / nuevas
- ✅ Los filtros llegaron **limpios** en sesión nueva en los 3 módulos (Moneda en placeholder, no en BSD).
  Reconfirma que **no se puede asumir cuál viene puesta**: hay que leerla siempre.
- ✅ En `/pages/pedidos` el `# Ref` es la **3ª** celda (hay columna `Copiar` antes de `# Ref`); en
  `/pages/inventarios` es la **2ª**. 🔴 **Un mapa ref→botón que use índice fijo de celda falla entre módulos**
  ⇒ localizar el `td` cuyo texto **empieza por `# Ref`**, nunca por posición.
- 🆕 **El sufijo `Z` de `query.js` es artefacto del driver** (ver §3.b) — no aplicar corrimiento horario.

---

## 7. Veredictos

| # | Caso | Marca |
|---|---|---|
| DW-SUG-001 | La web expone el desglose del sugerido (Despacho / Cambio x Cambio / Inv. Inicial / Venta) | **WEB-MISSING** |
| DW-SUG-002 | La web expone `days_since_last` / `days_until_next` | **WEB-MISSING** |
| DW-SUG-003 | Lista de inventarios vs BD (14 refs, clientes, vendedor, fechas) | **WEB-OK** |
| DW-SUG-004 | Detalle inventario Ref 47 vs BD (9 líneas) | **WEB-OK** |
| DW-SUG-005 | Detalle pedido Ref 34 vs BD (12 líneas + enlace cruzado) | **WEB-OK** |
| DW-SUG-006 | Fix «factura del cliente correcto» verificable desde la web | **WEB-N/A** (sin superficie) |
| DW-SUG-007 | Reporte Rotación: Inventario Inicial/Final vs BD | **WEB-CALC-MISMATCH** (D-01) |
| DW-SUG-008 | Persistencia de la cantidad sugerida (`qu_suggested`) | **WEB-MISSING** (D-02) |
| DW-SUG-009 | Cotejo de los registros creados por el móvil | **WEB-N/A** — no llegaron dentro de la ventana |

---

## 8. Qué quedó SIN medir

- **Todo el punto 4 del encargo.** A la hora de cierre no existía en la nube ningún registro nuevo del
  cliente 147: `client_stock WHERE co_client='147'` → **0 filas**; la última devolución del tenant es la
  **105 (06/08)** y el último inventario el **47 (06/08)**. No se pudo cotejar campo a campo la corrida del móvil
  (2 devoluciones — una `id_type=61` Distribución y una `60` Calidad —, 1 inventario y 1 pedido).
- **Verificación del fix de facturas** (§4): imposible desde la web mientras no exista superficie del desglose.
- **Adjuntos:** no se descargó ninguno ⇒ nada que borrar. `.playwright-mcp` solo contiene snapshots/consola
  autogenerados por el MCP, sin datos de cliente.

**Cómo retomar el punto 4** (el registro sí puede llegar tarde; el sync diferido está documentado):
```
node automation/db/query.js hidroponias "SELECT id_client_stock, da_created, days_since_last, days_until_next FROM client_stock WHERE co_client='147' AND co_operation<>'D' ORDER BY id_client_stock DESC LIMIT 3"
```
Con el `id_client_stock` en mano: `/pages/inventarios` **no tiene filtro `# Ref`** ⇒ barrer la lista por
vendedor + fecha, y para el pedido usar `/pages/pedidos` con `:n_ref`.
🔴 Al cotejarlo, **mirar primero `days_since_last`** (ver D-04): es el primer inventario de ese cliente.

---
*Agente WEB · read-only · no se tocó el dispositivo ni el CDP :9220.*
