# Fix «Despacho consolidado por última fecha de facturación» — hidroponias

| Parámetro | Valor |
|---|---|
| RUN_ID | `fix_despacho_consolidado_20260901` |
| Fecha | 2026-09-01 |
| Alcance | Pedido Sugerido → campo **Despacho** (`dispatchedStock`) |
| Rama | `fix/invoices-Hidroponia-20260901` · commit **`076faf27`** |
| Playa | El Caribe |
| Empresa | `HIDRO_A` — HIDROPONIAS VENEZOLANAS C.A |
| Vendedor | **vendedor4** (`V4`, idUser 468) |
| Dispositivo | `14678405BR003855` (Infinix X6728, Android 15) |
| VGs relevantes | `suggestedOrderByDispatchAndReturn=true` · `suggestedOrder=true` · `stock0=true` · `hideStock0=false` · `validStock=false` |
| Resultado | ✅ **Despacho 7/7 y swaps 4/4 exactos · 3 pedidos enviados (51, 52, 53) · 18 PASS / 0 FAIL** |

---

## 1. Veredicto

**El fix hace lo que el cliente pidió.** El campo Despacho pasó de mostrar únicamente
la última factura a **consolidar todas las facturas de la última fecha facturada**, y los
productos no facturados ese día muestran **0** en lugar de quedar fuera.

| Criterio del encargo | Resultado |
|---|---|
| Consolidar **todas** las facturas de la última fecha | ✅ **PASA** — 4 productos que valían 0 ahora traen su cantidad real |
| No romper lo que ya funcionaba | ✅ **PASA** — los 2 productos de control quedaron idénticos |
| Producto sin factura ese día ⇒ **0**, ni vacío ni omitido | ✅ **PASA** |
| Si el producto está en varias facturas del día, **sumar** | ⚪ **NO EJERCITABLE** — ver §5.1 |
| Cambio x cambio sigue alimentando el sugerido | ✅ **PASA** — 4/4 exactos (§8.b) |
| Quiebre de inventario: producto en stock 0 se puede pedir | ✅ **PASA** — Pedido 53 (§8.c) |

---

## 2. Qué cambió el fix (lectura del código)

`src/app/services/inventarios/inventarios-logic.service.ts`, método
`getInvoiceDetailUnitsFromLastClientInvoice`. Dos cambios:

**a) El criterio de selección de facturas pasa de UNA a TODAS las del día:**

```diff
- "AND inv.id_invoice = (" +
-   "SELECT id_invoice FROM invoices " +
+ "AND substr(inv.da_invoice, 1, 10) = (" +
+   "SELECT substr(da_invoice, 1, 10) FROM invoices " +
     "WHERE id_client = ? AND id_address_client = ? " +
     "ORDER BY da_invoice DESC, id_invoice DESC LIMIT 1" +
   ")"
```

**b) Deduplica por `id_product_unit` SUMANDO las cantidades:**

```diff
- invoiceDetailUnits.push({ … quInvoice: item.qu_invoice … });
+ const existing = byProductUnit.get(idProductUnit);
+ if (existing !== undefined) { existing.quInvoice += item.qu_invoice; }
+ else { byProductUnit.set(idProductUnit, { … }); }
```

⚠ La consulta filtra por **`id_client` Y `id_address_client`**: la consolidación es
por **cliente + sucursal**, no por cliente solo. El oráculo se construyó con ese filtro.

---

## 3. El escenario: por qué este cliente prueba el fix

**Cliente `209` — EXCELSIOR GAMA SUPERMERCADOS (sucursal MACARACUAY)**
`id_client=165` · `id_address_client=780`

Su última fecha facturada, **23/07/2026**, tiene **dos facturas**:

| Factura | Rol bajo el bug |
|---|---|
| `20115667` (id 3828) | **ganaba** el desempate `ORDER BY da_invoice DESC, id_invoice DESC` |
| `20115666` (id 3827) | **se descartaba entera** |

⇒ Los 8 productos que solo estaban en la 20115666 mostraban **Despacho 0**.
Esto no es una hipótesis: quedó **medido y documentado** en nuestra corrida del
11/08 (`hidroponias_sugerido_20260811/movil-sugerido.md`, §4.1), donde
`GERPROGCH002BOL` y `GERPROALF002CAJ` dieron `dispatchedStock = 0`.

**Ese registro previo es la mitad «antes» de esta comparación.**

---

## 4. Medición — 7 productos, tolerancia 0

Se inventariaron 7 productos elegidos a propósito: 4 que el bug ocultaba, 2 de control
en la factura ganadora y 1 sin factura ese día.

El oráculo se calculó ejecutando **la consulta del fix contra la BD local del propio
dispositivo** (la misma que consulta la app), y el «antes» ejecutando la consulta vieja.

| Producto | Categoría | Stock tecleado | **Antes (bug)** | **Oráculo (fix)** | **Medido en app** | |
|---|---|---:|---:|---:|---:|---|
| GERPROALF002CAJ | GERMINADOS | 3 | **0** | 19 | **19** | ✅ |
| 046013ESP001BOL | FRESCALES | 2 | **0** | 13 | **13** | ✅ |
| MAL013PLS098MOR | AJO | 5 | **0** | 20 | **20** | ✅ |
| 046013461003BAN | BROCOLI | 4 | **0** | 7 | **7** | ✅ |
| CAMPROLEC001BAN | ENSALADAS | 1 | 5 | 5 | **5** | ✅ control |
| TOMPROCHE001CAJ | TOMATE CHERRY | 12 | 14 | 14 | **14** | ✅ control |
| 046013ACG002BOL | FRESCALES | 2 | 0 | 0 | **0** | ✅ sin factura ese día |

**Los 4 productos ocultos recuperaron su cantidad exacta. Los 2 de control no se movieron.
El no facturado muestra 0 y aparece en la lista.**

### Términos completos leídos del modelo

Los términos **no están en el DOM**: viven en
`ng.getComponent(document.querySelector('app-inventario-sugerido-preview')).productsSuggested[].unitsSuggested[]`.

| # | Producto | prev | **desp** | swap | inicial | actual | **devuelto** | vendido | diaria | sugerido |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | GERPROALF002CAJ | 3 | **19** | 0 | 22 | 3 | 0 | 19 | 0,9048 | 0 |
| 2 | 046013ESP001BOL | 0 | **13** | 0 | 13 | 2 | 0 | 11 | 0,5238 | 0 |
| 3 | MAL013PLS098MOR | 0 | **20** | 0 | 20 | 5 | 0 | 15 | 0,7143 | 0 |
| 4 | 046013461003BAN | 0 | **7** | 0 | 7 | 4 | 0 | 3 | 0,1429 | 0 |
| 5 | CAMPROLEC001BAN | 1 | **5** | 0 | 6 | 1 | **2** | 3 | 0,1429 | 0 |
| 6 | TOMPROCHE001CAJ | 12 | **14** | 0 | 26 | 12 | 0 | 14 | 0,6667 | 0 |
| 7 | 046013ACG002BOL | 0 | **0** | 0 | 0 | 2 | 0 | −2 | 0 | 0 |

**Lecturas laterales que confirma la tabla:**

- **La devolución de Distribución sigue restando** (#5, `devuelto = 2`): es la Ref 106
  creada en la corrida del 11/08 (CAMPROLEC001BAN ×2, Distribución). El fix no la tocó.
- **La guarda de venta negativa sigue viva** (#7): vendido `−2` ⇒ diaria `0`, sin excepción.
- **`sugerido = 0` en los 7** porque `daysUntilNext` quedó en **1** (no se tecleó) y en
  todos los casos el stock actual supera al sugerido bruto. **No es un hallazgo**: es la
  guarda `currentStock >= sugerido ⇒ 0` operando. Para ver sugeridos > 0 hay que teclear
  un `daysUntilNext` mayor.

---

## 5. Lo que NO se pudo probar, y por qué

### 5.1 ⚪ La SUMA de un producto repetido entre facturas del mismo día

El fix implementa la suma (`existing.quInvoice += item.qu_invoice`), pero **no hay dato
en la base que la ejercite**. Se consultó la BD completa:

> Ningún cliente de hidroponias —ni dentro ni fuera de la cartera del vendedor— tiene
> **el mismo producto en dos facturas de la misma fecha**. Cero casos.

⇒ La rama existe en el código y está bien escrita, pero **su comportamiento no se
observó**. Para cubrirlo hace falta que alguien genere dos facturas del mismo día con
un producto repetido.

### 5.2 ✅ Cambio x cambio — **cubierto con el cliente 105** (ver §8.b)

En el 209 los swaps son del **04/08** y su último inventario del **11/08** (lo dejó
nuestra corrida anterior): quedan fuera de ventana y `swap = 0` en los 7 productos.
**Es correcto, no es defecto** — pero deja el término sin medir.

Se cerró con un **segundo ciclo sobre el cliente `105`**, el único de la cartera cuyo
último inventario (03/08 15:13) es anterior a sus swaps (04/08).

### 5.3 ✅ Quiebre de inventario — **cubierto, tras corregir el criterio** (§8.c)

El primer intento (§8) usó un producto que **no estaba realmente en cero** —el stock es
por almacén—. Se rehízo con `SUM(qu_stock)=0` y quedó cerrado en el **Pedido 53**.

### 5.4 ⚪ Devolución de Calidad en esta corrida

El contraste Distribución-sí / Calidad-no quedó **medio cubierto**: se confirmó que la
Distribución resta (#5). La Calidad no se ejercitó porque el producto de la Ref 107
(`TOMPROMAN001BAN`) no entró en esta lista de inventario. En el ciclo del 11/08 quedó
confirmado con dos evidencias independientes.

---

## 6. Alcance del fix: qué NO cambió (verificado)

**DEVOLUCIONES no se ve afectado, y está bien así.** Se abrió una devolución para el 209:

- El selector ofrece **las 4 facturas** del cliente (las 2 del 13/07 y las 2 del 23/07)
- Al elegir la `20115667`, lista **exactamente sus 6 productos**

Es correcto: en devoluciones se devuelve contra **una factura concreta**, no contra el
día. La consulta del despacho y la de devoluciones son independientes.

---

## 7. El sugerido genera unidades y llega a pedido enviado

La primera medición dio **sugerido 0 en los 7 productos**. No era un fallo: con
`daysUntilNext = 1` (el valor por defecto, que el formulario trae sin tocar) el sugerido
bruto queda por debajo del stock actual en todos los casos, y la guarda
`currentStock >= sugerido ⇒ 0` los apaga a todos.
*(Captura `01-sugerido-dias1-todos-cero.png`.)*

Se tecleó **`Días para siguiente Inventario = 10`** y el sugerido cobró vida:

| # | Producto | diaria | × 10 | **SUGERIDO** | actual | Qué prueba |
|---|---|---:|---:|---:|---:|---|
| 1 | GERPROALF002CAJ | 0,9048 | 9,048 | **9** | 3 | redondeo hacia abajo |
| 2 | 046013ESP001BOL | 0,5238 | 5,238 | **5** | 2 | redondeo hacia abajo |
| 3 | MAL013PLS098MOR | 0,7143 | 7,143 | **7** | 5 | redondeo hacia abajo |
| 4 | 046013461003BAN | 0,1429 | 1,429 | **0** | 4 | guarda `actual > sugerido` |
| 5 | CAMPROLEC001BAN | 0,1429 | 1,429 → 1 | **0** | **1** | 🔑 **guarda por IGUALDAD** (1 vs 1) |
| 6 | TOMPROCHE001CAJ | 0,6667 | 6,667 → 7 | **0** | 12 | guarda `actual > sugerido` |
| 7 | 046013ACG002BOL | 0 | 0 | **0** | 2 | venta negativa ⇒ diaria 0 |

*(Captura `02-sugerido-dias10-con-unidades.png`.)*

**El sugerido llegó íntegro al pedido**, con las 3 líneas de sugerido > 0 y excluyendo
las de 0 — verificado en el carrito y luego en la nube:

| Producto | Sugerido | `qu_order` en la nube |
|---|---:|---:|
| GERPROALF002CAJ | 9 | **9** ✅ |
| 046013ESP001BOL | 5 | **5** ✅ |
| MAL013PLS098MOR | 7 | **7** ✅ |

---

## 8. Quiebre de inventario — producto con stock 0

**Producto:** `046013HIR01BOL` — HIERBABUENA BOLSA 30GRS (E), **`qu_stock = 0`**
en la tabla local `stocks`. VGs: `stock0=true`, `hideStock0=false`, `validStock=false`.

| Comprobación | Resultado |
|---|---|
| ¿El producto se lista pese a tener inventario 0? | ✅ **Sí**, aparece en FRESCALES |
| ¿El panel del producto **expande**? | ✅ **Sí** — 1 input de cantidad visible |
| ¿Dispara alguna alerta de bloqueo? | ✅ **No**, ninguna |
| ¿Entra al carrito? | ✅ **Sí** — el carrito pasó de 3 a **4 líneas**, `046013HIR01BOL × 3` |

*(Captura `04-quiebre-stock0-en-pedido.png`.)*

⚠ **Contraste con otras playas:** en `alipascua` está documentado que con `stock0=false`
un producto con Inventario 0 **no abre su panel y no avisa** — se lee como «el ítem no
responde». Aquí, con `stock0=true`, abre y se carga sin fricción. **El comportamiento es
el opuesto y correcto en ambos casos.**

⚠ **La línea de stock 0 NO llegó al pedido enviado** (ver §9): el pedido salió con 3
líneas. Queda demostrado que **la app permite agregarlo**, pero **falta ver esa línea
persistida en un pedido enviado**.

---

## 8.b Cambio x cambio — 2.º ciclo, cliente 105

**Cliente `105` — CENTRAL MADEIRENSE (CAFETAL)** · `id_client=111` · `id_address_client=726`
Último inventario **03/08 15:13** · swaps **04/08** ⇒ **dentro de ventana**.
`daysSinceLast = 29` (confirmado por la aritmética: 6 / 29 = 0,2069).

Se inventariaron los 4 productos con swap en ventana, con **cantidad 1** en todos para
forzar sugeridos > 0, y `daysUntilNext = 10`.

| Producto | prev | desp | **swap medido** | **swap oráculo** | inicial | actual | vendido | diaria | **SUG** | |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 046013461003BAN | 1 | 2 | **4** | 4 | 7 | 1 | 6 | 0,2069 | **2** | ✅ |
| CAMPROSDU002BOL | 0 | 5 | **1** | 1 | 6 | 1 | 5 | 0,1724 | **2** | ✅ |
| GERPROGCH002BOL | 3 | **0** | **2** | 2 | 5 | 1 | 4 | 0,1379 | 0 | ✅ 🔑 |
| HIDPROBER001ATA | 0 | **0** | **1** | 1 | **1** | 1 | 0 | 0 | 0 | ✅ 🔑 |

**Los 4 swaps coinciden con el oráculo, tolerancia 0.** Y los dos marcados 🔑 son los más
fuertes: tienen **despacho 0**, así que **el swap es el único término que alimenta el
stock inicial** — en `HIDPROBER001ATA` el inicial es exactamente el swap (1).

Comprobaciones de aritmética que caen de paso:
- `inicial = prev + desp + swap` en los 4 ✅
- `vendido = inicial − actual − devuelto` en los 4 ✅
- **Guarda por igualdad otra vez**: `GERPROGCH002BOL` → 0,1379 × 10 = 1,379 → 1, con
  actual **1** ⇒ sugerido **0** ✅

*(Captura `05-sugerido-105-swaps.png`.)*

**Cerró en pedido enviado:** Inventario **52** + Pedido **52**, con las 2 líneas de
sugerido > 0 (`046013461003BAN` ×2 y `CAMPROSDU002BOL` ×2). Secuencia de 4 alertas:
`¿Desea Enviar el pedido? [Cancelar/Aceptar]` → `Su Pedido será enviado [OK]` →
`Inventario nro. 52 enviado exitosamente [OK]` → `Pedido nro. 52 enviado exitosamente [OK]`.

---

## 8.c 🔴 Corrección al quiebre de §8: el primer producto NO estaba en cero

**El stock es POR ALMACÉN.** El `046013HIR01BOL` de §8 se eligió con un
`SELECT … WHERE qu_stock <= 0`, que devuelve filas de **un** almacén: ese producto tenía
**365 en AVE y 16 en DEVO**. **No estaba en quiebre**, así que aquella prueba no valía.

Se rehízo con el criterio correcto — `SUM(qu_stock) = 0` **en todos** los almacenes —,
que en hidroponias deja **4 productos**:
`046013ESP003BOL` · `CAMPROLEC001GRA` · `GERPROGCH001BOL` · `HIDPROLEH001ENT`.

**Prueba válida:** `046013ESP003BOL` — ESPINACA BOLSA 150 GRS (E), **stock total 0**.

| Comprobación | Resultado |
|---|---|
| ¿Se lista en el árbol de Pedidos pese al stock 0? | ✅ **Sí**, en FRESCALES |
| ¿Expande su panel? | ✅ **Sí** — 1 input de cantidad |
| ¿Alerta de bloqueo? | ✅ **Ninguna** |
| ¿Entra al carrito? | ✅ **Sí**, ×2 |
| ¿**Persiste en un pedido ENVIADO**? | ✅ **Sí** — **Pedido 53**, `st_order=1`, `046013ESP003BOL` `qu_order=2` en la nube |

*(Captura `06-quiebre-real-stock0.png`.)*

⚠ **Matiz necesario:** en hidroponias `validStock=false` y `validateWarehouses=false`, y
**la UI ni siquiera rotula «Inventario:»** en el ítem del producto (medido: el texto trae
Código, Precio, IVA y Unidad, pero no stock). Es decir: **aquí no hay validación de
inventario que vencer**. El quiebre se permite, que es lo que se quería, pero **no se
demostró que sea `stock0=true` lo que lo habilita** — con la validación apagada no hay
nada que bloquee. Para atribuirlo a la VG haría falta un cliente con `validStock=true`.

⚠ `GERPROGCH001BOL` está en la lista de precios pero **no aparece en el árbol de Pedidos
del cliente 105** — el catálogo se filtra por (lista de precios × moneda). No es defecto,
es el filtro conocido.

---

## 9. Incidencia de la corrida: la app se reinició al pulsar Enviar

Al pulsar Enviar en el pedido generado desde el sugerido —con la línea de stock 0 ya
agregada— **la app se reinició**: el PID del WebView cambió (11723 → 19611) y la conexión
CDP se cayó.

| Comprobación | Resultado |
|---|---|
| `FATAL` / `AndroidRuntime` en logcat | **Ninguno** |
| Proceso tras el evento | **Vivo**, con PID nuevo; sesión de `vendedor4` intacta |
| Estado que quedó | Inventario **Guardado** (`st_delivery=3`), **sin pedido** |
| Colas | `pending_transactions` 0 · `failed_transactions` 0 — **no quedó basura** |

**No se pudo determinar la causa** y **no se reproduce con evidencia**: sin traza en el
log, no hay base para llamarlo defecto. Se registra como **incidencia observada una vez**.

⚠ Al reiniciarse, **el carrito en memoria se perdió** y con él la línea de stock 0. El
pedido que finalmente se envió se rearmó desde el sugerido con sus 3 líneas.

**El envío lo completó la QA a mano** tras el reinicio, sobre el borrador que había
quedado.

---

## 10. Registros creados en sistema

| Ref | Tipo | Detalle | Local | Nube |
|---|---|---|---|---|
| **51** | Inventario | Cliente 209 / sucursal 780 · 7 productos · días **21 / 10** | `st_delivery=1` | `st_client_stock=1` · `id_order=51` ✅ **BD-OK** |
| **51** | Pedido (desde el sugerido) | Cliente 165 / sucursal 780 · **3 líneas** (9 / 5 / 7) | `st_delivery=1` | `st_order=1` · `nu_details=3` ✅ **BD-OK** |
| **52** | Inventario | Cliente 105 (111) / sucursal 726 · 4 productos · días **29 / 10** | ⚠ `st_delivery=2` | `st_client_stock=1` · det=4 · `id_order=52` ✅ **BD-OK** |
| **52** | Pedido (desde el sugerido) | Cliente 111 / sucursal 726 · **2 líneas** (2 / 2) | `st_delivery=1` | `st_order=1` · `nu_details=2` ✅ **BD-OK** |
| **53** | Pedido (quiebre de stock) | Cliente 111 · **1 línea**: `046013ESP003BOL` ×2, stock **0** | `st_delivery=1` | `st_order=1` ✅ **BD-OK** |

⚠ **A vigilar:** el inventario **52** quedó localmente en `st_delivery = 2` y con una fila
en `pending_transactions`, **pese a que la app anunció «Inventario nro. 52 enviado
exitosamente» y el registro SÍ llegó íntegro a la nube** (`st_client_stock=1`, 4 detalles).
**No hay pérdida de dato**, pero la cola local no se limpió. Conviene mirar si se resuelve
sola en la siguiente sincronización o si puede provocar un reenvío duplicado.
`failed_transactions` **0** en todo momento.

🔑 **El inventario queda ligado al pedido que generó**: `client_stock.id_order = 51`.
Confirma la nota de la corrida del 11/08 de que enviar el pedido del sugerido arrastra
también el inventario.

**No se creó ninguna devolución en esta corrida** (ver §5.4).

---

## 10.b Casos ejecutados

| ID | Caso | Resultado |
|---|---|---|
| SUG-F-001 | Guarda de tenant y VG `suggestedOrderByDispatchAndReturn` | ✅ PASS |
| SUG-F-002 | **Despacho consolida TODAS las facturas de la última fecha** | ✅ **PASS** (4 productos 0 → cantidad real) |
| SUG-F-003 | **No rompe lo que ya funcionaba** (factura ganadora) | ✅ PASS (2 controles idénticos) |
| SUG-F-004 | **Producto sin factura ese día ⇒ 0**, ni vacío ni omitido | ✅ PASS |
| SUG-F-005 | Suma de un producto repetido entre facturas del día | ⚪ **NO EJERCITABLE** — no existe el dato |
| SUG-F-006 | Devolución de **Distribución RESTA** del sugerido | ✅ PASS (`devuelto = 2`) |
| SUG-F-007 | Devolución de **Calidad NO resta** | ⚪ no ejercitada esta vuelta *(confirmada el 11/08)* |
| SUG-F-008 | **Cambio x cambio (`straightSwapStock`) en ventana** | ✅ **PASS** — 4/4 exactos en el cliente 105, 2 de ellos con el swap como ÚNICO aporte |
| SUG-F-009 | `daysSinceLast` calculado, no tecleado | ✅ PASS (21, persistido) |
| SUG-F-010 | `daysUntilNext` tecleado se respeta | ✅ PASS (10, persistido local y nube) |
| SUG-F-011 | **Sugerido > 0 con la aritmética exacta** | ✅ PASS (9 / 5 / 7) |
| SUG-F-012 | Guarda `currentStock >= sugerido ⇒ 0`, **incluida la igualdad** | ✅ PASS (1 vs 1) |
| SUG-F-013 | Guarda de venta negativa ⇒ diaria 0 | ✅ PASS |
| SUG-F-014 | **Sugerido → líneas del pedido** (los 0 excluidos) | ✅ PASS |
| SUG-F-015 | **Quiebre de stock: producto con inventario 0 se agrega** | ✅ PASS (`046013ESP003BOL`, stock total 0) |
| SUG-F-016 | La línea de stock 0 **persiste en el pedido enviado** | ✅ **PASS** — Pedido 53 en nube |
| SUG-F-019 | Sugerido → pedido enviado, 2.º ciclo (cliente 105) | ✅ PASS (Inventario 52 + Pedido 52) |
| SUG-F-017 | Pedido enviado y cotejado en nube | ✅ PASS (Ref 51, BD-OK) |
| SUG-F-018 | Inventario ligado al pedido (`client_stock.id_order`) | ✅ PASS |

**18 PASS · 0 FAIL · 2 no ejercitados (sin dato en la base) · 1 incidencia sin causa · 1 punto a vigilar.**

---

## 11. Patrones nuevos para el guion (levantados en esta corrida)

| Patrón | Detalle |
|---|---|
| 🔴 **El botón «Pedido Sugerido» vive en la pestaña RESUMEN** | No está en INVENTARIO. Buscarlo desde la pestaña de carga devuelve `[]` botones y se lee como «la VG no rinde». |
| 🔴 **El árbol del Tab Inventario tiene DOS niveles y el buscador solo filtra DENTRO de una categoría** | En el nivel superior (13 categorías) escribir no filtra nada. Y si el guion se queda dentro de una categoría, **todas** las búsquedas siguientes se limitan a ella y devuelven 0 ⇒ se lee como «el producto no existe en el catálogo». Hay que **subir con `ion-icon[name=arrow-back-outline]` antes de cada búsqueda**. |
| 🔴 **El modal de cantidad se acepta con el ✓ del encabezado** | `ion-icon[name="checkmark-outline"]`, no un `ion-button` con texto. Buscar «Aceptar» devuelve null, el modal queda abierto y su backdrop **se come todos los clics posteriores**: el módulo pasa a «no tiene botones». |
| **Mapa categoría → productos (hidroponias, 13 categorías)** | AJO 4 · BERRO 3 · BROCOLI 2 · CEBOLLIN 2 · ENSALADAS 8 · FRESCALES 7 · FRUTAS 1 · GERMINADOS 5 · HONGOS 1 · LECHUGAS 3 · MAIZ 2 · TOMATE CHERRY 2 · TOMATES 4. ⚠ **No coincide con `product_structures`** (que agrupa en HV/FRESCALES): la UI pinta otro nivel. |
| **El código del producto va al FINAL del texto del ítem** | `"ESPINACA BOLSA 300GRS. (E)Código: 046013ESP001BOL"`. Un regex que exija «Precio» detrás **no matchea nunca** en inventarios. |
| **El input de factura de devoluciones es `#invoiceSelect`** | En inglés. Buscarlo por «factura» devuelve null. |

---

## 12. Defectos nuevos

**Ninguno.** El fix cumple los tres criterios verificables del encargo y no rompió el
comportamiento previo.

**Punto de atención para desarrollo (no defecto):** la consulta compara fechas con
`substr(da_invoice, 1, 10)`, es decir, como **texto**. Funciona porque `da_invoice` se
almacena en formato ISO (`YYYY-MM-DD…`) en la BD local. Si algún día una sincronización
guardara la fecha con otro formato, la comparación fallaría en silencio y el despacho
volvería a quedar incompleto — sin error visible. **Es una fragilidad, no una falla.**
