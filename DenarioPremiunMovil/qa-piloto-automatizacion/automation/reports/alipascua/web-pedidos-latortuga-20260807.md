# Alta de PEDIDOS desde la WEB — La Tortuga

**RUN_ID:** `20260807_web-pedidos-latortuga` · **Fecha:** 2026-08-07
**Playa:** LA TORTUGA — `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Tenant real:** **ALIPASCUA, C.A.** (`ALIP_BSD`) — empresa **única** del selector · slug BD `alipascua`
**Credenciales:** `***` / `***` · login **OK**
**Modo:** 🔴 **ESCRITURA autorizada por QA** — se creó **1 (un) pedido**, el mínimo del alcance.

---

## 🟢 RESUMEN EJECUTIVO

**El alta de pedidos desde la web funciona de punta a punta.** Se creó el pedido **Nro. 4317**,
enviado y verificado contra BD, con **diff exacto de +1** y sin duplicados.

| Parte | Estado |
|---|---|
| **A — Alta de pedido** | ✅ **EJECUTADA** — pedido **4317** enviado y verificado |
| **B — Contraste web↔móvil** | ✅ **MEDIDO** contra el pedido móvil **4316** |
| **C — Los 2 en observación** | ✅ cerrado en la tanda anterior (no se repitió) |

**Lo más importante que salió:**

| # | Hallazgo | Severidad |
|---|---|---|
| **H1** | **385 pedidos (9,5 %) invisibles en el listado** por join contra `salesman_view` | 🔴 alta |
| **H4** | 🧮 **En pedidos GUARDADOS, Σ líneas ≠ Monto Base** (19,00 vs 194,40) — se corrige al enviar | 🔴 alta |
| **H5** | La web aplica **7 % de descuento global automático**; el móvil no (4.033/4.039 van en 0) | 🔴 alta |
| **H6** | **`Responsable` se pierde al guardar** — se escribe en el form y llega vacío a BD | 🟠 media |
| **H7** | `global_discount` rotulado **"10 %"** con valor real **7,0000** | 🟠 media |
| **H8** | Dos modales **apilados a la vez**, uno destructivo (`Si, Borrar`) | 🟠 media |
| **H9** | La pantalla de alta **no muestra ningún total** mientras se arma el pedido | 🟡 baja |

---

## 📌 Nota: el primer intento se detuvo por la guarda de tenant (información valiosa)

La corrida se planificó contra **globalmp** (clientes `CC02`, productos `ACG02`/`PCE40`, baseline 15.159).
**Al entrar, la guarda de tenant falló** y se paró **antes** de tocar `Nuevo Pedido`:

```js
[...document.querySelectorAll('[id$=":idEnterprise_input"] option')].map(o => o.textContent.trim())
// → ["ALIPASCUA, C.A."]   ← esperaba las 2 empresas de globalmp
```

**Evidencia de que La Tortuga fue reaprovisionada de globalmp → alipascua entre el 04 y el 07/08:**

| Comprobación | Resultado |
|---|---|
| BD `globalmp` → `enterprise` | `00001 HC TRADING…` + `00002 …GLOBAL M&P` (las 2 esperadas) |
| BD `alipascua` → `enterprise` | `ALIP_BSD | ALIPASCUA, C.A.` — **idéntico a lo que muestra la web** |
| Último pedido BD `alipascua` | **2026-08-07 16:00:20** (hoy, tenant vivo) |
| Último pedido BD `globalmp` | **2026-08-04 18:13:44** (cortó hace 3 días) |

**Barrido de las 4 playas:** El Yaque = **difranca** (3 empresas) · Isla Coche = **el_palmar** (2) ·
Caribe = `ERR_CONNECTION_RESET` (2 intentos) · La Tortuga = **alipascua**.
⇒ **globalmp no está publicado en ninguna web alcanzable.**

⚠ **`automation/clientes/globalmp.yaml` sigue diciendo** `ws_url: …denariolatortuga…:8081/PremiumWS  # Playa LA TORTUGA`
— **desactualizado**, y es lo que hizo que la corrida se planificara contra el servidor equivocado (**H3**).

La QA autorizó después montar el pedido en ALIPASCUA. **Todo lo que sigue es sobre ese tenant.**

---

## A — Alta de pedido ✅

### A.0 Los productos indicados NO eran pedibles (stock 0) — sustitución documentada

Los 2 productos del encargo tienen **stock 0** en el almacén `01` del cliente:

| Producto | Stock almacén 01 |
|---|---|
| `7590063000169` RUPLI HOJUELAS DE PAPAS ORIGINAL 90 G | **0,00** |
| `7591221120545` SALSA DE SOYA 300CC 1X12 | **0,00** |

La web **los lista** (con `Stock: 0.0`) pero **bloquea el alta** con un modal:

> **`form:msj`** → *"No se puede agregar productos sin inventario"*

⇒ **La web respeta `stock0: false`. No es defecto** — es exactamente la VG. Se sustituyeron por dos
productos con stock y precio en la misma lista:

| Producto | Stock | Precio lista 01 |
|---|---|---|
| `7591473005591` **ARROZ MARY PREMIUM 12X2KG** | 2.025 | **2,60 US$** |
| `7591473005560` **HARINA DE MAIZ BLANCO PRECOCIDA Y ENRIQUECIDA 9X2KG** | 2.171 | **2,24 US$** |

⚠ Existe además `form:msjStock` — *"Este producto no tiene inventario. ¿Desea Agregarlo de todas formas?"*
con opción *"No mostrar este mensaje de nuevo"*. **No se disparó**: ganó el bloqueo duro de `form:msj`.
Probablemente responda a otra VG (`validateWarehouses`); queda anotado, no medido.

### A.1 Paso a paso del alta (primera vez que se mapea)

| # | Paso | Control | Resultado |
|---|---|---|---|
| 1 | Entrar a pedidos | `/pages/pedidos` | guarda de tenant OK |
| 2 | Crear | **`form:pedidosDT:agregarRegistro`** rótulo **"Nuevo Pedido"** | → `/pages/protected/pedidos/nuevoPedido.xhtml` |
| 3 | Empresa | `:idEnterprise` | **fija** (1 opción, `focus` disabled) — coherente con `enterpriseEnabled=false` |
| 4 | Vendedor | `:idSalesmaView` (10 opciones) | **Wilmen Lara** (`002`, el que atiende al cliente) |
| 5 | — | *cascada* | el combo **Cliente pasó de 1 a 65 opciones** |
| 6 | Cliente | `:idClient` | **`V28556138` RENZO FERNANDO MARTINEZ MEJIAS** |
| 7 | — | *cascada* | **autocompletó** Lista=`PRECIO LISTA 1`, Sucursal, Cond.Pago=`CONTADO`, Moneda=`US$` |
| 8 | Buscar productos | `form:j_idt127:ajax` "Buscar Productos" | aparece `form:filterSearchBar` + `form:btnBuscar` |
| 9 | Línea 1 | buscar cód. → **`Agregar`** | entra al carrito con **cantidad 1** |
| 10 | Línea 2 | ídem (o desde el diálogo de detalle) | ídem |
| 11 | Cantidades | **`form:tablaOrder:<i>:qtyPedido_input`** | ARROZ **3**, HARINA **5** |
| 12 | Cabecera | `:txtNumOrden`, `:txtResponsable`, `:txtComentario` | cargados |
| 13 | **Guardar** | `form:saveOrderButton` → confirma en `form:msjConfirmSave` | → `order_saved` **id 13** |
| 14 | **Reabrir** | filtro `Status=Guardado` → tabla **`form:pedidosSavedDT`** → **`Editar`** | round-trip |
| 15 | **Enviar** | `form:sendOrderButton` → confirma en `form:msjConfirmSend` | → **`order` id 4317** |

🔑 **Descubrimientos del flujo:**
- **La cantidad NO se pide al agregar.** `Agregar` mete el producto con **cantidad 1** y *recién entonces*
  aparece el spinner `qtyPedido` **en la fila del buscador**. El `panelCarrito` es **sólo lectura**.
- **`Guardar` NO escribe en `"order"`**, escribe en **`order_saved`** (+ `order_detail_saved`,
  `order_detail_unit_saved`). Sólo `Enviar` crea la fila en `"order"`.
- **Al enviar, la fila de `order_saved` se CONSUME** (13 → 12 filas, el id 13 desaparece): sin duplicado.
- **El `co_order` (epoch) se conserva** de guardado a enviado: `1786138497469.0` en ambos.
- ⚠ **Los `# Ref` de guardados y enviados son espacios de numeración DISTINTOS**: nuestro guardado fue
  `# Ref 13` (= `id_order_saved`) y el enviado `# Ref 4317` (= `id_order`). **Un "# Ref 13" guardado y un
  "# Ref 13" enviado son registros diferentes.** Ojo al cotejar por Ref.

### A.2 🧮 Aritmética — verificada con tolerancia 0,01

**🔴 La clave: el precio es por UNIDAD y la cantidad se pide en BULTOS.** El factor sale de `product_unit.qu_unit`:

| Producto | `co_unit` | `qu_unit` |
|---|---|---|
| `7591473005591` ARROZ MARY PREMIUM **12X2KG** | BUL | **12** |
| `7591473005560` HARINA DE MAIZ **9X2KG** | BUL | **9** |

**Líneas** (lista usada: **`01 - PRECIO LISTA 1`** en ambas — la del cliente, `client.co_list='01'` ✓):

| N° | Producto | Cant. | × factor | Unidades | Precio/UNI | **Subtotal** |
|---|---|---|---|---|---|---|
| 1 | ARROZ MARY PREMIUM 12X2KG | 3 BULTO | ×12 | 36 | 2,60 | **93,60** |
| 2 | HARINA DE MAIZ BLANCO 9X2KG | 5 BULTO | ×9 | 45 | 2,24 | **100,80** |

```
Línea 1:  3 × 12 × 2,60 =  93,60 US$      ✓ UI "Subtotal: 93,6000 US$"  ✓ BD 93.6000
Línea 2:  5 ×  9 × 2,24 = 100,80 US$      ✓ UI "Subtotal: 100,8000 US$" ✓ BD 100.8000
Σ líneas                = 194,40 US$      ✓ == "Subtotal bruto" 194,4000
Descuento bonif.        =   0,00 US$
Monto Base Pedido       = 194,40 US$      ✓
Descuento global 7 %    = 194,40 × 0,07 = 13,608 US$   ✓ UI "Descuento Global: 13,6080 US$"
Monto Total Pedido      = 194,40 − 13,608 = 180,792 US$ ✓ UI "180,7920 US$"
IVA                     =   0,00  (ambas líneas con IVA 0 %; el campo IVA del detalle sale vacío)
```

**Conversión — con la tasa que usa el pedido, no una supuesta:**

```
Tasa del pedido (UI):  "746,6297 BSD = 1 US$"   ==  BD order.nu_value_local = 746.6297
Dirección: US$ → BSD  ⇒  MULTIPLICA

Precio base conv. L1:   2,60 × 746,6297 =   1.941,2372 BSD  ✓ UI
Precio base conv. L2:   2,24 × 746,6297 =   1.672,4505 BSD  ✓ UI
Subtotal conv. L1:     93,60 × 746,6297 =  69.884,5399 BSD  ✓ UI y BD
Subtotal conv. L2:    100,80 × 746,6297 =  75.260,2738 BSD  ✓ UI y BD
Σ conv. líneas                          = 145.144,8137 BSD  ✓ == "Monto Base Pedido Conversion"
Descuento conv.:       13,608 × 746,6297 = 10.160,1370 BSD  ✓ UI
Total conv.:          180,792 × 746,6297 = 134.984,6767 BSD ✓ UI y BD
```

**Todos los derivados cuadran dentro de 0,01.** ✅
⚠ La tasa **no se editó a mano** — coherente con `enabledManualRate: false`.

### A.3 Round-trip Guardar → reabrir → Enviar

Reabierto por **`Editar`** desde `form:pedidosSavedDT` (anclando al `# Ref 13`, no al índice):

| Campo | Antes de guardar | Al reabrir | ¿Sobrevive? |
|---|---|---|---|
| Cliente | RENZO F. MARTINEZ MEJIAS | idem | ✅ |
| Vendedor | Wilmen Lara | idem | ✅ |
| Empresa | ALIPASCUA, C.A. | idem | ✅ |
| Lista de precio | PRECIO LISTA 1 | idem | ✅ |
| Condición de pago | CONTADO | idem | ✅ |
| Tipo / Moneda | Nota / US$ | idem | ✅ |
| Nº Orden de compra | QA-WEB-20260807 | idem | ✅ |
| Comentario | *(texto QA)* | idem | ✅ |
| Fecha de despacho | 07/08/2026 | idem | ✅ |
| Líneas y cantidades | ARROZ 3 · HARINA 5 | idem | ✅ |
| **Responsable** | **QA AUTOMATIZACION** | **vacío** | ❌ **H6** |

⇒ **El round-trip sobrevive en todo salvo `Responsable`.**

### A.4 Verificación en BD — diff contra baseline

| Métrica | Baseline (antes) | Después | Δ |
|---|---|---|---|
| `count(*)` de `"order"` | **4.039** | **4.040** | **+1** ✅ |
| `max(id_order)` | **4316** | **4317** | **+1** ✅ |
| `count(*)` de `order_saved` | 13 (tras guardar) | **12** | **−1** (consumido) ✅ |

**Exactamente 1 pedido creado, sin duplicados.**

**Fila `"order"` id 4317 y sus hijas:**

| Campo | Valor | Cotejo |
|---|---|---|
| `co_order` | `1786138497469.0` | == `Código pedido` de la UI ✅ |
| `procedencia` | **`Denario Web`** | == `Plataforma` de la UI ✅ |
| `st_order` | 1 | UI muestra `Enviado` |
| `nu_details` | **2** | == 2 líneas en `order_detail` ✅ |
| `nu_amount_total_base` | 194,4000 | == UI ✅ |
| `nu_amount_discount` / `nu_discount` | 13,6080 / 7,0000 | == UI ✅ |
| `nu_amount_total` | 180,7920 | == UI ✅ |
| `nu_value_local` | 746,6297 | == tasa de la UI ✅ |
| `nu_amount_total_conversion` | 134.984,6767 | == UI ✅ |
| `co_client` / `co_user` | V28556138 / 002 | ✅ |
| `nu_purchase` | QA-WEB-20260807 | ✅ |
| `tx_comment` | *(texto QA)* | ✅ |
| **`na_responsible`** | **`''`** | ❌ **H6** |

```sql
SELECT (SELECT sum(nu_amount_total) FROM order_detail WHERE co_order='1786138497469.0') suma_lineas,
       (SELECT nu_amount_total_base FROM "order" WHERE id_order=4317)                    base_cabecera;
-- suma_lineas = 194.4000   base_cabecera = 194.4000   ✅ CUADRA
```

`order_detail_unit` guarda las cantidades correctas: `…5591BUL → 3` · `…5560BUL → 5`. ✅

---

## B — Contraste web vs móvil

**Pedido móvil usado:** **`id_order` 4316** — el más reciente del tenant (07/08/2026 16:00:20,
cliente `J299470155`, vendedor `006`, 1 línea). Se eligió por ser el inmediatamente anterior al nuestro,
con **la misma tasa** (746,6297), lo que aísla las diferencias de origen.

> 🔑 **`procedencia` es el campo que marca el origen**, y la UI lo expone como **`Plataforma`**.
> En todo el tenant: **`Denario` = 4.039** (móvil) · **`Denario Web` = 1** (el nuestro).
> ⇒ **el alta web nunca se había ejercido en este cliente.**

| Campo | Móvil (4316) | Web (4317) | Lectura |
|---|---|---|---|
| `procedencia` / `Plataforma` | `Denario` | **`Denario Web`** | ✅ **por diseño** — el origen SÍ queda marcado |
| `st_order` | 1 | **1** | ✅ **igual** — la web no crea un estado distinto |
| `co_operation` | `I` | `I` | ✅ igual |
| `nu_value_local` (tasa) | 746,6297 | 746,6297 | ✅ misma tasa vigente |
| `id_order_type` | 2 | 2 | ✅ igual |
| `coordenada` (GPS) | `10.9987483,-63.7965611` | **vacío** | ✅ esperable (no hay GPS en escritorio) |
| `signature` | null | vacío | ✅ esperable |
| `id_order_creator` | **`null`** | **`462`** | ⚠ **la web registra QUIÉN lo creó; el móvil no** |
| `nu_purchase` | `''` | `QA-WEB-20260807` | ⚠ campo que **sólo la web** ofrece |
| `da_dispatch` | `null` | `2026-08-07` | ⚠ la web la **fija por defecto**; en móvil es null en 3.269/4.039 |
| **`nu_discount`** | **0** | **7** | 🔴 **divergencia real — ver H5** |
| `na_responsible` | `''` | `''` | ⚠ vacío en ambos (en web **se perdió**, H6) |
| Hijas | `order_detail` + `order_detail_unit` | **mismas tablas, misma forma** | ✅ sin diferencia estructural |

**Diferencias que NO son esperables por diseño (las que importan):**

1. 🔴 **`nu_discount` 7 vs 0** → H5.
2. ⚠ **`id_order_creator`**: la web deja trazabilidad del autor (462 = usuario web) y **el móvil la deja en
   `null`**. No es defecto de la web — es una **carencia del móvil** que conviene registrar: en 4.039 pedidos
   móviles no hay forma de saber por BD quién los creó más allá de `co_user`.
3. ⚠ **`da_dispatch` por defecto = hoy** en web. Si el negocio espera "sin fecha de despacho salvo que se
   indique", la web está inventando un dato. **A confirmar con QA** si es el comportamiento deseado.

**Lo que NO difiere y era el riesgo principal:** `st_order`, la tasa, las tablas hijas y la estructura del
detalle son **idénticos**. Un pedido web es indistinguible de uno móvil para el resto del sistema, salvo por
`procedencia` — que es justamente el campo pensado para distinguirlos.

---

## C — Los 2 hallazgos en observación, medidos en main

*(Cerrado en la tanda anterior del 07/08 — se conserva íntegro, no se repitió.)*

### Huella de build

| Playa | `common.css` `Last-Modified` | Corresponde a |
|---|---|---|
| **La Tortuga** | **06/08/2026 19:27:02** | main |
| Isla Coche | 06/08/2026 19:27:02 | main (mismo build) |
| El Yaque | 16/07/2026 17:25:16 | **tag 20** — donde se vieron los 2 hallazgos |

### C1 — Filtro `Status` de pedidos → ✅ **NO REPRODUCE**

| Rango | Filtro `Status` | Filas |
|---|---|---|
| 01/08–07/08 | *(sin filtro)* | **57** |
| 01/08–07/08 | **Enviado** | **57** |
| 01/08–07/08 | **Por aprobar** | **0** — "No se encontraron registros." |
| 01/07–07/08 | *(sin filtro)* | **1.725** |
| 01/07–07/08 | **Enviado** | **1.725** |

**El control `Por aprobar` → 0 es lo que valida el resultado:** demuestra que el filtro **discrimina** y no
está siendo ignorado. En difranca (tag 20) eran **2.049 sin filtro vs 1 filtrando**; acá el conjunto
filtrado es **idéntico** al rotulado "Enviado".

**Mecanismo:** en alipascua `transaction_statuses` tiene **4.039 filas `ped`/`env`** = **el 100 %** de los
pedidos vigentes; en difranca estaba poco poblada. ⇒ **era la versión/estado de datos.**

### C2 — Estatus vacío en devoluciones → ⚠ **NO REPRODUCE, muestra insuficiente**

| | difranca (tag 20) | alipascua / main |
|---|---|---|
| Total devoluciones | 795 | **2** |
| Estatus vacío | **793 (99,7 %)** | **0** |

🔴 **N=2 no permite concluir.** Formalmente no reproduce, pero **no cierra el hallazgo**: hay que medirlo en
un tenant con volumen de devoluciones sobre este mismo build (Isla Coche lo comparte).

---

## Hallazgos

### 🔴 H1 — 385 pedidos (9,5 %) no aparecen en el listado, pero existen y se abren por `# Ref`

**Severidad alta.** Pérdida silenciosa de datos en pantalla, sin mensaje ni advertencia.

| Rango 01/07–07/08 | Pedidos |
|---|---|
| BD (`co_operation<>'D'`) | **1.831** |
| Lista web | **1.725** |
| **Diferencia** | **106** |

```sql
SELECT count(*) FROM "order" o
WHERE o.co_operation<>'D' AND o.da_order>='2026-07-01' AND o.da_order<'2026-08-08'
  AND NOT EXISTS (SELECT 1 FROM salesman_view s WHERE s.id_user = o.id_user);
-- → 106      ← 1.831 − 106 = 1.725, exactamente lo que muestra la web
```

⚠ **El join es por `id_user`.** Cruzarlo por `co_user` da 233 y **no cuadra** — es la comprobación que
confirma la causa.

El listado hace un **join contra `salesman_view`**, que excluye a los vendedores **dados de baja**:

| `id_user` | `login_user` | Nombre | `users.co_operation` | Pedidos ocultos | Monto |
|---|---|---|---|---|---|
| 471 | 006 | Barbara Marquez | **`D`** | 152 | 232.277,68 |
| 472 | 007 | Darlyn Orozco | **`D`** | 233 | 66.627,54 |
| | | | **TOTAL** | **385 / 4.039 (9,5 %)** | **≈ 298.905** |

**Prueba de que es defecto de listado y no borrado real** — el mismo pedido buscado por `# Ref`:

```
Filtro # Ref = 4168 → 1 fila
"# Ref 4168 · Estatus Enviado · Fecha creación 30/07/2026 11:43:39 · Vendedor Darlyn Orozco · ..."
```

⇒ Existe, está Enviado, se muestra completo y **nombra al vendedor dado de baja**. Solo desaparece del
listado general. **Dos caminos de la misma pantalla devuelven conjuntos distintos.**

**Impacto:** dar de baja a un vendedor **borra retroactivamente su histórico de la vista de pedidos**.
El mecanismo es del producto (join contra `salesman_view`), no de los datos ⇒ **previsiblemente aplica a
todos los tenants**.

⚠ **Nota nueva de esta tanda:** el vendedor `006` **sigue creando pedidos desde el móvil** — el pedido
móvil 4316 (07/08, el más reciente del tenant) es suyo. Es decir: **un usuario borrado lógicamente sigue
operando, y sus pedidos nacen ya invisibles en la web.** Eso agrava H1.

### 🔴 H4 — 🧮 En pedidos GUARDADOS, Σ líneas ≠ Monto Base (se corrige al enviar)

**Severidad alta.** Rompe la oráculo clásica `DW-PED-C07` (*Σ líneas == Monto Total*).

**Mismo pedido, dos estados:**

| Estado | Línea 1 | Línea 2 | **Σ líneas** | **Monto Base cabecera** | ¿Cuadra? |
|---|---|---|---|---|---|
| **Guardado** (`order_detail_saved`) | **7,80** | **11,20** | **19,00** | **194,40** | ❌ **NO** |
| **Enviado** (`order_detail`) | 93,60 | 100,80 | 194,40 | 194,40 | ✅ sí |

**Causa:** en el estado guardado, el subtotal de línea se calcula **`cantidad × precio` sin aplicar el
factor de unidad** (`product_unit.qu_unit` = 12 y 9). La cabecera **sí** lo aplica. Al enviar, las líneas se
recalculan bien.

**Se ve en la UI, no sólo en BD.** Detalle del pedido **guardado** `# Ref 13`:

```
Línea 1: Unidades pedidas 3 BULTO · Precio base: 2,6000 US$ · Subtotal:   7,8000 US$
Línea 2: Unidades pedidas 5 BULTO · Precio base: 2,2400 US$ · Subtotal:  11,2000 US$
                                                    Subtotal bruto:     194,4000 US$   ← 10,23×
```

**Impacto:** quien consulte un pedido **guardado** ve subtotales de línea ~10× menores que el total de
cabecera, sin ninguna señal de que uno de los dos está mal. Cualquier reporte construido sobre
`order_detail_saved` da importes equivocados.

**Alcance:** afecta **sólo a los guardados**. El pedido enviado quedó íntegramente correcto.
⚠ Con productos cuyo `qu_unit` sea 1 (venta por UNIDAD) la discrepancia **no se ve** — por eso pudo pasar
desapercibida. Reproducir **siempre con un producto vendido por BULTO**.

### 🔴 H5 — La web aplica 7 % de descuento global automático; el móvil no

**Severidad alta — tiene impacto en dinero.**

**Nunca se seleccionó descuento** (ambas líneas quedaron en `Descuento` = placeholder, y
`nu_amount_total_product_discount = 0`). Aun así el pedido salió con **`nu_discount = 7`** y
**`nu_amount_global_discount = 13,6080 US$`**.

**Origen — es el default configurado, así que la web hace "lo que dice la config":**

```sql
SELECT id_global_discount, global_discount, tx_description, default_global_discount FROM global_discount;
-- 1 | 5.0000 | "5%"   | false
-- 2 | 7.0000 | "10 %" | true     ← default
```

**Pero el móvil NO lo aplica:**

| `nu_discount` en pedidos `procedencia='Denario'` (móvil) | Pedidos |
|---|---|
| **0,0000** | **4.033** (99,85 %) |
| 7,0000 | 5 |
| 5,0000 | 1 |

⇒ En el móvil el descuento global es **opt-in** (6 pedidos en 4.039); en la web es **opt-out y silencioso**.
**El mismo pedido cargado en web sale 7 % más barato que cargado en el móvil.** Hay que decidir cuál es el
comportamiento correcto — pero **no pueden ser los dos**.

### 🟠 H6 — `Responsable` se pierde al guardar

El campo `form:j_idt127:txtResponsable` acepta texto (verificado con valor `"QA AUTOMATIZACION"` leído del
DOM inmediatamente antes de `Guardar`), pero:

- BD `order_saved.na_responsible` = `''`
- BD `order.na_responsible` = `''` (tras enviar)
- UI del detalle: `Responsable:` **vacío**

⇒ **El dato se captura y no se persiste.** Es el único campo del round-trip que no sobrevive.

### 🟠 H7 — `global_discount` rotulado "10 %" con valor real 7,0000

`tx_description = "10 %"` sobre `global_discount = 7.0000` (fila `default_global_discount=true`).
Es un dato de configuración, pero **el rótulo es lo que ve el usuario**: se le ofrece "10 %" y se le aplica
**7 %**. Combinado con H5 (se aplica solo), el usuario no tiene forma de notarlo.

### 🟠 H8 — Dos modales apilados a la vez, uno de ellos destructivo

Al pulsar `Guardar` aparecieron **simultáneamente**:

- `form:msjConfirmSave` — *"¿Esta seguro de guardar este pedido?"* → `Regresar` / `Guardar`
- `form:msjConfirmVarChange` — *"Se ha detectado un cambio de **lista de precio** por lo cual se reiniciara
  el pedido. ¿Esta seguro de reiniciar este pedido?"* → `No, Regresar` / **`Si, Borrar`**

**Nunca se cambió la lista de precio** (quedó en `PRECIO LISTA 1` de punta a punta). El aviso se disparó de
forma espuria — apareció también antes, al escribir en `Responsable`, y **se llevó puesto el valor tecleado**.
Con los dos modales encima, **un clic mal dirigido borra el pedido entero**.

⚠ Además el mensaje se corta: el texto que se lee en el primer render es
*"Se ha detectado un cambio de **por lo cual**…"* — **falta el nombre de la variable** hasta que el diálogo
termina de poblarse.

**No se pudo reproducir de forma determinista** (el segundo intento de cargar los mismos campos no lo
disparó). Queda como observación con evidencia.

### 🟡 H9 — La pantalla de alta no muestra ningún total

Mientras se arma el pedido **no hay ningún importe a la vista**: el `panelCarrito` lista producto y
**precio unitario**, y no existe ni subtotal ni total. El usuario **guarda o envía sin saber cuánto suma**.
El primer lugar donde aparece un total es la lista/detalle, ya con el pedido creado.
Agravado por H5 (el 7 % tampoco se anuncia en ningún momento).

### ⚠ H2 — `st_order` guarda un `id_status` de otro tipo de transacción

`statuses` está indexado por **(id_status, tipo)**. Para `ped` los válidos son **2** (`pap` Por aprobar) y
**6** (`env` Enviado). Sin embargo:

- **56 pedidos** recientes tienen `st_order = 1` → fila de **`dep`** (depósitos).
- **Nuestro guardado** tuvo `st_order = 4` → fila de **`inv`** (inventarios).
- **Nuestro enviado (4317)** tiene `st_order = 1` → otra vez la fila de **depósitos**.

La web resuelve `id_status → na_status` **ignorando el tipo**, y como esas filas también son `env`, muestra
"Enviado" **por coincidencia**. Hoy no produce error visible; si algún `id_status` compartido tuviera nombres
distintos por tipo, la columna mostraría el estatus de otro módulo.

### ⚠ H3 — `globalmp.yaml` apunta a una playa que ya no lo sirve

`ws_url: http://denariolatortuga.ddns.net:8081/PremiumWS  # Playa LA TORTUGA` — desactualizado.
Es lo que hizo que esta corrida se planificara contra el tenant equivocado.
**La guarda de tenant por TEXTO de empresa funcionó y evitó el error** — conviene mantenerla obligatoria.

---

## Patrones / selectores nuevos

### 🔑 Conteo total de filas sin paginar

`.ui-paginator-current` **no existe** en estas tablas (el paginador solo pinta `F P 1 2 N E`). El total vive
en el widget:

```js
PrimeFaces.widgets.pedidosDT.paginator.cfg.rowCount   // → 57  (total real, no las 50 visibles)
PrimeFaces.widgets.pedidosDT.paginator.cfg.rows       // → 50  (tamaño de página)
```
⚠ Buscarlo en `PrimeFaces.widgets`, **no** recorriendo `window`.
⚠ El registro trae ~100 widgets `form:pedidosDT:N:consultar`: **filtrar por `id === 'form:pedidosDT'`** o el
volcado revienta el contexto.

### 🔴🔑 Los diálogos reportan `offsetParent === null` aunque estén VISIBLES

**La trampa más cara de esta tanda.** Un lector que filtre por `offsetParent !== null` **no ve ningún modal**
y concluye "el botón no hizo nada" — cuando en realidad hay un mensaje de error en pantalla bloqueando todo.

```js
// ✗ MAL: devuelve [] aunque haya un modal abierto
[...document.querySelectorAll('.ui-dialog')].filter(d => d.offsetParent !== null)
// ✓ BIEN:
[...document.querySelectorAll('.ui-dialog')].filter(d => getComputedStyle(d).display !== 'none')
```
**Síntoma que delata un modal abierto:** Playwright falla el clic con
`<div id="form:XXX_modal" class="ui-widget-overlay ui-dialog-mask"> intercepts pointer events`.
El `id` del overlay es `<idDelDialogo>_modal` ⇒ **de ahí se deduce qué diálogo está abierto.**

### 📋 Inventario COMPLETO de diálogos de `nuevoPedido.xhtml`

Todos existen en el DOM desde el inicio (ocultos). **Anclar por id semántico, los botones internos son `j_idt*`.**

| ID | Texto | Botones (ids **volátiles**) |
|---|---|---|
| `form:msj` | *"No se puede agregar productos sin inventario"* (genérico) | solo `.ui-dialog-titlebar-close` |
| `form:msjStock` | *"Este producto no tiene inventario. ¿Desea Agregarlo de todas formas?"* + *"No mostrar este mensaje de nuevo"* | `No` / `Si` |
| `form:msjConfirmSave` | *"¿Esta seguro de guardar este pedido?"* | `Regresar` / **`Guardar`** |
| `form:msjConfirmSend` | *"¿Esta seguro de enviar este pedido?"* | `Regresar` / **`Enviar`** |
| `form:msjConfirmClear` | *"¿Esta seguro de borrar este pedido?"* | `Regresar` / `Borrar` |
| `form:msjConfirmVarChange` | *"…cambio de lista de precio… se reiniciara el pedido"* | `No, Regresar` / **`Si, Borrar`** ⚠ destructivo |
| `form:msjConfirmWHChange` | *"El almacen que ha elegido no posee este articulo…"* | `Deshacer el cambio` / `Borrar el articulo` |
| `form:dialogProdDetail` | ficha del producto **con el spinner de cantidad** | `Agregar` |
| `form:selecProd` | *"Seleccionar Producto"* | — |
| `j_idt49:timeoutDialog` | ⏰ *"La Sesión se cerrará por Inactividad en 00:20 segundos"* | `Ok` / `Cerrar Sesión` |

🔴 **`j_idt49:timeoutDialog` importa para automatización:** avisa con **20 segundos**. Una tanda con esperas
largas puede perder la sesión en medio del alta.

### Alta de pedido — mapa de controles

**Entrada:** `form:pedidosDT:agregarRegistro` ("Nuevo Pedido", **id semántico**) →
`/pages/protected/pedidos/nuevoPedido.xhtml` (⚠ forma **legacy** con `/protected/` y `.xhtml`, como visitas).

**Cabecera** — prefijo `form:j_idt127` **hoy** (⚠ `j_idt*`: anclar **por sufijo**):

| Sufijo | Control | Nota |
|---|---|---|
| `:idEnterprise_label/_input` | Empresa | 1 opción, `_focus` **disabled** (`enterpriseEnabled=false`) |
| `:idSalesmaView_label/_input` | Vendedor | 10 opciones · **tiene `_filter`** |
| `:idClient_label/_input` | Cliente | **arranca con 1 opción; se puebla al elegir vendedor** (→65) · `_filter` |
| `:idCurrency_label/_input` | Moneda | US$ preseleccionada, `_focus` **disabled** |
| `:Sucursal_label/_input` | Sucursal | se autocompleta con el cliente |
| `:listaPrecio_label/_input` | **Lista de precio** | se autocompleta con `client.co_list` |
| `:condPago_label/_input` | Condición de Pago | 7 opciones; autocompleta `CONTADO` |
| `:orderType_label/_input` | Tipo de pedido | 3 opciones, default `Nota` |
| `:txtNumOrden` | Nº Orden de compra | → `order.nu_purchase` |
| `:txtResponsable` | Responsable | ❌ **no persiste (H6)** |
| `:txtComentario` | Comentario (textarea) | → `order.tx_comment` |
| `:dateB_input` | Fecha del pedido | **disabled** |
| `:dateF_input` | **Fecha de despacho** | editable, default **hoy** |
| `:ajax` | **"Buscar Productos"** | despliega el buscador |
| `:botonLimpiar` | Limpiar | |

🔑 **Tras agregar el primer producto, los combos de cabecera se REEMPLAZAN por variantes con sufijo `2`**
(`idClient2_label`, `listaPrecio2_label`, `idSalesmaView2_label`, `idCurrency2_label`, `orderType2_label`) —
versión **bloqueada** del mismo dato. Un lector que busque `idClient_label` **no encuentra nada** después de
cargar líneas. ⚠ **Leer ambos.**

**Buscador de productos** (aparece tras "Buscar Productos"):

| ID | Control |
|---|---|
| `form:filterSearchBar` | texto libre — **acepta el código de producto** |
| `form:selectFilterType_label/_input` | tipo de filtro: `Proveedor` / `Linea` (categorías) |
| `form:btnBuscar` | ejecuta la búsqueda |
| `form:tablaOrder` | **`.ui-dataview`** con los resultados |
| `form:calcBtn` | recálculo interno — **nunca visible**, no clickear |

**Fila de producto** (`form:tablaOrder:<i>:…`) — todo `j_idt*`, **anclar por posición dentro de la fila**:

| ID | Control |
|---|---|
| `:j_idt248_label/_input` | Lista de precio de la línea (`_focus` disabled) |
| `:j_idt252_…` | Unidad — **`BULTO` / `UNIDAD`**, default `BULTO` |
| `:j_idt256_…` | **IVA — `0%` / `16%`, default `0%`** ⚠ aunque `product.nu_tax = 16` |
| `:j_idt260_…` | Descuento de línea (5/7/8/10/3 %) |
| `:j_idt264_…` | Almacén — `_focus` **disabled** ✓ (`userCanChangeWarehouse=false`) |
| `:j_idt217` | ⭐ favorito (**no** es cantidad) |
| `:infoDcto` | info de descuentos por volumen |
| `:j_idt220` | **commandlink sobre la imagen → abre `form:dialogProdDetail`** |
| `:j_idt276` | **`Agregar`** |
| **`:qtyPedido_input`** | 🔑 **CANTIDAD** — spinner, **aparece SOLO si el producto ya está en el carrito** |

🔴 **Secuencia obligatoria para cargar una línea con cantidad ≠ 1:**
```
buscar → Agregar (entra con cantidad 1) → recién ahí aparece :qtyPedido_input → fill(n) + Tab → esperar ajax
```
`browser_type` + `Tab` **funciona** en el spinner (a diferencia de las fechas, que exigen `setDate()`).

**Guardar / Enviar** (ids **semánticos**, estables):
```
form:saveOrderButton   → confirma en form:msjConfirmSave  → botón "Guardar"
form:sendOrderButton   → confirma en form:msjConfirmSend  → botón "Enviar"
```

**Carrito:** `form:panelCarrito` — **sólo lectura** (imagen + nombre + **precio unitario**). Sin controles,
sin cantidades, **sin totales**. No sirve para verificar importes.

### 🔑 Los pedidos GUARDADOS viven en otra tabla y en otra pantalla

| | Guardado | Enviado |
|---|---|---|
| Tabla BD | **`order_saved`** + `order_detail_saved` + `order_detail_unit_saved` | `"order"` + `order_detail` + `order_detail_unit` |
| Tabla UI | **`form:pedidosSavedDT`** | `form:pedidosDT` |
| Cómo llegar | filtro **`Status = Guardado`** (`orderStatus_3`) | por defecto |
| Acciones por fila | `consultar` · `copiar` · **`Editar`** | `consultar` · `copiar` |
| `# Ref` | `id_order_saved` (1, 2, 3…) | `id_order` (4317) |

🔴 **`form:pedidosSavedDT` aparece SOLO con el filtro `Status=Guardado`**; con cualquier otro filtro el DOM
trae `form:pedidosDT` y el otro **no existe**. Un lector que busque un id fijo falla con `null`.
🔴 **Los `# Ref` de las dos tablas son espacios de numeración distintos y colisionan.**
🔴 **`Editar` (`form:pedidosSavedDT:<i>:Editar`) es la única forma de reabrir un guardado para enviarlo.**

### Ciclo de vida de un pedido web (medido)

```
Nuevo Pedido → [cabecera + líneas]
   ├─ Guardar → order_saved (st_order=4, procedencia='Denario Web')   ← NO toca "order"
   │             ↑ Editar / Consultar desde form:pedidosSavedDT
   └─ Enviar  → "order" (st_order=1) + order_detail + order_detail_unit
                 y la fila de order_saved SE CONSUME (13 → 12)
   co_order (epoch) se CONSERVA de guardado a enviado
```

### 🧮 Regla de cálculo imprescindible: precio por UNIDAD, cantidad en BULTOS

```
subtotal_linea = cantidad × product_unit.qu_unit(co_unit) × precio_unitario
```
**Sin el factor `qu_unit` cualquier oráculo de líneas da mal.** Con `qu_unit = 1` (venta por UNIDAD) la
diferencia se esconde ⇒ **probar siempre con un producto vendido por BULTO**.

### Detalle del pedido — confirmada la regla DOBLE de lectura

| Qué se lee | Regla |
|---|---|
| **Cabecera** (`No. de Ref.`, `Código pedido`, `Plataforma`, `Estatus`, `Vendedor`, `Cliente`, `Comentario`…) | **hoja-siguiente** — con `leerCabecera` (mismo padre) sale **todo vacío** |
| **Pie de totales** (`Subtotal bruto`, `Monto Base Pedido`, `Descuento Global`, `Monto Total Pedido`, conversiones) | **mismo padre** — con hoja-siguiente sale vacío |

⚠ Con la regla hoja-siguiente, `Conversiòn Monto Total:` se contamina con `"N°"` y `Subtotal:` con
`"Adjuntos"` (absorben el encabezado de la sección siguiente). **Descartarlos.**

**Campos NUEVOS de la cabecera de `detallePedido`** (no estaban documentados):
```
Plataforma:  ← 🔑 el ORIGEN ('Denario' = móvil · 'Denario Web' = web)
No. Orden de compra:  ·  Canal de distribución:  ·  Rif cliente:  ·  Tipo de Pedido:
Fecha de despacho:  ·  Condicion de pago:  ·  Sucursal:  ·  Firma:  ·  ¿Por Aprobar?
```
**Columnas de la tabla de líneas** (`form:pedidosDT` dentro del detalle):
```
N° · Cod. producto · Producto · Almacen · Lista de precio · Unidades pedidas · Monto Total · Monto conv.
```
⚠ `Unidades pedidas` viene como **`"3 BULTO"`** (cantidad + unidad en el mismo texto).
⚠ `Monto Total` y `Monto conv.` traen **dos valores en una celda**: `Precio base: … / Subtotal: …`.
⚠ `Lista de precio` se muestra **`01 - PRECIO LISTA 1`** (código + nombre) — útil para verificar qué lista usó.

### Filtro `Status` de pedidos — el `value` **sí** es el `id_status`

```
0 | Status (placeholder)     2 | Por aprobar     6 | Enviado     -1 | Guardado
```
A diferencia de `idEnterprise` (posicional, no comparable contra BD), acá `value == order.st_order`
(2 y 6 son `id_status` reales de `statuses` para `ped`). `-1` es sintético y conmuta a `form:pedidosSavedDT`.

**Receta** (el `<li>` sólo existe con el combo abierto):
```
click [id$=":orderStatus_label"] → click #form\:…\:orderStatus_<i> → esperar 2,5 s
→ verificar el label → click :ajax (Buscar) → esperar
```
Los `<li>` son `:orderStatus_0..3`, **índice posicional** (Enviado = `_2`, **no** `_6`).

⚠ **Matiz sobre la trampa de filtros persistidos:** un `browser_navigate` completo a `/pedidos`
**SÍ reseteó** el `Status` a placeholder. Persisten entre acciones ajax, **no** entre navegaciones completas.

### Fechas: `el.value = …` NO funciona — usar `setDate()`

```js
PrimeFaces.widgets.widget_form_j_idt115_dateB.setDate(new Date(2026, 6, 1));  // mes 0-based
Object.keys(PrimeFaces.widgets).filter(k => /date[BF]$/.test(PrimeFaces.widgets[k].id||''))  // descubrir el nombre
```

### Modelo de datos (confirmado)

| Tabla / columna | Para qué |
|---|---|
| `"order".procedencia` | **origen**: `'Denario'` móvil · `'Denario Web'` web → UI `Plataforma` |
| `"order".id_order_creator` | **autor** — la web lo llena, el móvil lo deja `null` |
| `"order".nu_value_local` | **la tasa del pedido** (BSD por 1 US$) — multiplica US$→BSD |
| `"order".nu_discount` / `nu_amount_global_discount` | descuento **global** (%) e importe |
| `"order".nu_purchase` | Nº Orden de compra |
| `order_saved` / `order_detail_saved` / `order_detail_unit_saved` | **pedidos GUARDADOS** (⚠ H4) |
| `order_detail_unit.qu_order` | **la cantidad pedida** (no está en `order_detail`; `qu_suggested` = 0) |
| `product_unit.qu_unit` | **factor de la unidad** (BUL→12, 9…) — imprescindible para la aritmética |
| `price_list (co_list, co_product)` | precio por lista · `client.co_list` = la lista del cliente |
| `stock (co_product, co_warehouse)` | `qu_stock = 0` ⇒ la web **bloquea** el alta |
| `global_discount.default_global_discount` | el default que la web aplica sola (⚠ H5, H7) |
| `statuses (id_status, co_transaction_type)` | catálogo; `ped` usa **2** y **6** (⚠ H2) |
| `salesman_view` | **el join que oculta pedidos** (⚠ H1) — filtrar por **`id_user`** |
| `users.co_operation='D'` | vendedor dado de baja |
| ⚠ `"order"` **no** tiene `co_salesman` ni `da_send` | usa `co_user`/`id_user` y `da_order`/`da_created` |

---

## Pendientes / recomendado

1. **H1 en otros tenants** — el join contra `salesman_view` es del producto; medirlo en el_palmar y difranca.
2. **H4 con `qu_unit = 1`** — confirmar que con venta por UNIDAD la discrepancia desaparece (acotaría el fix).
3. **H5: decidir cuál es el correcto** — web aplica el descuento global default, móvil no. No pueden ser los dos.
4. **C2 en un tenant con volumen de devoluciones** — con N=2 el hallazgo de difranca no queda cerrado.
5. **Actualizar `globalmp.yaml`** (H3) y localizar dónde quedó publicado globalmp.
