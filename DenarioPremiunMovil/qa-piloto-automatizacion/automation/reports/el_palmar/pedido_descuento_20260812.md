# Pedido con DESCUENTO — verificación de cálculos

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `pedido_descuento_elpalmar_20260812` |
| Cliente QA | el_palmar · playa **ISLA COCHE** |
| Empresa | **1002 · CENTRAL EL PALMAR, S.A.** (guarda de tenant verificada: solo 1002 y 1003 en BD) |
| Dispositivo | 14678405BR003855 · PID WebView 21768 · `window.ng=TRUE` |
| Vendedor logueado | **2045 / id_user 244 — Yessica Molina** (⚠ no es el 1276 del YAML, ver §Hallazgos) |
| Cliente del pedido | **1000001162 — MAYOR RKL, C.A** |
| **Lista de precio usada** | 🔴 **Z02 · "Distrib. Aliados" (id_list 2)** — heredada de `client.co_list` |
| Moneda / tasa | **USD** · tasa **710,0000 VES = 1,0000 USD** (`nu_value_local`) |
| **Nº de pedido** | **13819** · `st_order=1` · `st_delivery=1` · **BD-OK (llegó a la nube)** |
| Resultado | ✅ **Los cálculos CIERRAN — 0 descuadres, tolerancia 0,01 respetada en todos los términos** |

---

## 1. Veredicto

**SÍ, los cálculos cierran.** Los 3 niveles (precio unitario → línea → cabecera → conversión) coinciden
**al cuarto decimal** entre modelo Angular, pantalla, payload y BD de nube. No hay ningún término que falle.

---

## 2. La aritmética, escrita

### Fórmula real (verificada, no asumida)

El descuento se aplica **sobre el PRECIO UNITARIO**, y el IVA **sobre el precio ya descontado**:

```
discountedNuPrice = nuPrice × (1 − desc%)
ivaProducto       = discountedNuPrice × iva%
taxedNuPrice      = discountedNuPrice × (1 + iva%)
subtotal (línea)  = taxedNuPrice × cantidad
```

Es **algebraicamente equivalente** a aplicarlo sobre el subtotal (`bruto × (1 − d) × (1 + iva)`), y se
comprobó que ambos caminos dan el mismo número. Lo que **no** es equivalente es el orden IVA→descuento:
la app descuenta **primero** y grava **después**, que es lo correcto.

> 🔴 **`nuPrice` NO viene descontado.** La pantalla rotula `Precio: 53,7500 USD` = `nuPrice` (bruto).
> El precio descontado (`discountedNuPrice`) **no se muestra en ninguna parte de la pantalla**;
> solo se ve indirectamente dentro de `Precio + IVA`.

### Línea 1 — `160000000` 0 CALORÍAS MONTALBAN 12X112X1GR · **4 Cajas** · desc. **7 %** (`id_discount 417`, prioridad 1)

```
precio de lista (Z02)      53,7500
precio descontado          53,7500 × (1 − 0,07)      = 49,9875
subtotal bruto             53,7500 × 4              = 215,0000
descuento de línea         215,0000 × 0,07          =  15,0500   ✔ nuAmountDiscount
subtotal neto              215,0000 − 15,0500       = 199,9500   (= 49,9875 × 4 ✔)
IVA 16 %                   199,9500 × 0,16          =  31,9920   ✔ nu_amount_tax
TOTAL LÍNEA                199,9500 + 31,9920       = 231,9420   ✔ (= 57,9855 × 4)
conversión VES             231,9420 × 710           = 164.678,8200 ✔
```

### Línea 2 — `160000001` 0 CALORÍAS MONTALBAN 12X48X1GR · **3 Cajas** · desc. **15 %** (`id_discount 394`, prioridad 1)

```
precio de lista (Z02)      26,8300
precio descontado          26,8300 × 0,85           =  22,8055
subtotal bruto             26,8300 × 3              =  80,4900
descuento de línea         80,4900 × 0,15           =  12,0735   ✔
subtotal neto              80,4900 − 12,0735        =  68,4165
IVA 16 %                   68,4165 × 0,16           =  10,94664  ✔ (UI/BD 10,9466)
TOTAL LÍNEA                68,4165 + 10,94664       =  79,36314  ✔ (UI/BD 79,3631)
conversión VES             79,36314 × 710           =  56.347,8294 ✔
```

### Línea 3 — CONTROL `160000026` GELLA NARANJA MONTALBAN · **2 Cajas** · **SIN descuento**

```
precio de lista (Z02)      68,5400
subtotal bruto = neto      68,5400 × 2              = 137,0800
descuento                                              0,0000   ✔ id_discount = 0
IVA 16 %                   137,0800 × 0,16          =  21,9328  ✔
TOTAL LÍNEA                137,0800 + 21,9328       = 159,0128  ✔
conversión VES             159,0128 × 710           = 112.899,0880 ✔
```

### Cabecera del pedido (Tab Total, textual de pantalla)

```
Total Base USD          215,0000 + 80,4900 + 137,0800   = 432,5700   ← BRUTO, antes de descuento
Descuento productos     15,0500 + 12,0735 + 0,0000      =  27,1235
Base neta               432,5700 − 27,1235             = 405,4465   ← nu_amount_final
Total IVA               31,9920 + 10,94664 + 21,9328   =  64,87144  (UI 64,8714)
TOTAL PEDIDO            405,4465 + 64,87144            = 470,31794  (UI 470,3179)

IDENTIDAD DE CIERRE:    432,5700 − 27,1235 + 64,8714   = 470,3179   ✔ EXACTO
CONVERSIÓN:             470,31794 × 710                = 333.925,7374 ✔ (UI idéntico)
```

Conversiones de cabecera, todas verificadas contra **la tasa del pedido (710), multiplicando USD→VES**
(dirección correcta, no reproduce el bug de cobros):
Base `432,57 × 710 = 307.124,70` ✔ · Descuento `27,1235 × 710 = 19.257,685` ✔ · IVA `64,87144 × 710 = 46.058,7224` ✔

---

## 3. A/B del descuento sobre el MISMO producto (los dos descuentos de `160000000`)

El desplegable ofreció exactamente lo predicho por QA — **sin descuento · 7 · 15**, en ese orden
(prioridad ascendente, "sin descuento" primero). Valores reales del `ion-select`: `0` / `417` / `393`
(son **`id_discount`**, no el porcentaje).

| Descuento | precio desc. | desc. total (q=4) | IVA unit. | Precio+IVA | Total línea |
|---|---|---|---|---|---|
| **7 %** (id 417) | 49,9875 | 15,0500 | 7,9980 | 57,9855 | **231,9420** |
| **15 %** (id 393) | 45,6875 | 32,2500 | 7,3100 | 52,9975 | **211,9900** |

Ambos recalcularon **al instante y correctamente** al cambiar el selector. Se dejó la línea en **7 %**
para que el pedido enviado persistiera **dos descuentos distintos** (7 % y 15 %) más el control.

---

## 4. Cotejo BD (nube) — **BD-OK**

`order` (id_order **13819**, `st_order=1`, `co_enterprise='1002'`, `co_currency='USD'`, `nu_value_local=710.0000`, `nu_details=3`):

| Campo BD | Valor | Pantalla | ¿Cuadra? |
|---|---|---|---|
| `nu_amount_total_base` | 432,5700 | Total Base USD 432,5700 | ✔ |
| `nu_amount_total_product_discount` | **27,1235** | Descuento productos 27,1235 | ✔ |
| `nu_amount_tax` | 64,8714 | Total IVA 64,8714 | ✔ |
| `nu_amount_total` | 470,3179 | Total Pedido 470,3179 | ✔ |
| `nu_amount_final` | 405,4465 | (base neta) | ✔ |

`order_detail` — **el descuento quedó persistido en las dos líneas que lo llevaban**:

| co_product | nu_price_base | **id_discount** | **nu_discount_total** | iva | nu_amount_tax | nu_amount_total | co_price_list |
|---|---|---|---|---|---|---|---|
| 160000000 | 53,7500 | **417** (7 %) | **15,0500** | 16 | 31,9920 | 231,9420 | CFR_Z02_160000000 |
| 160000001 | 26,8300 | **394** (15 %) | **12,0735** | 16 | 10,9466 | 79,3631 | CFR_Z02_160000001 |
| 160000026 | 68,5400 | 0 | 0,0000 | 16 | 21,9328 | 159,0128 | CFR_Z02_160000026 |

Σ líneas: `231,9420 + 79,3631 + 159,0128 = 470,3179` = cabecera ✔ · Σ descuentos `= 27,1235` ✔ · Σ IVA `= 64,8714` ✔

Conversiones de detalle (× 710): `38.162,50` / `19.049,30` / `48.663,40` (precios) y `10.685,50` / `8.572,185` / `0` (descuentos) — todas ✔.
⚠ Como en alipascua, `nu_amount_total_conversion` se calcula sobre el valor **sin redondear**
(`79,36314 × 710 = 56.347,8294`, no `79,3631 × 710`): **no es descuadre**.

**Estado de envío:** POST único a `orderservice/order` capturado por el hook · local `st_delivery=1`,
`pending_transactions=0`, `failed_transactions=0` ⇒ **el pedido llegó a la nube, sin cola ni rechazo.**

---

## 5. Hallazgos / defectos

| # | Severidad | Hallazgo |
|---|---|---|
| 1 | 🔴 **Corrige el YAML** | **`userCanSelectProductDiscount` EFECTIVO = `true`.** El perfil lo fija en `false` con nota "✅ CONFIRMADO EN UI: el panel trae 3 selects, "% Descuento" NO aparece". **Es incorrecto:** el select SÍ existe y es operable. La corrida 20260805 lo evaluó sobre un producto **que no tenía descuentos en su lista** y leyó la ausencia como VG. |
| 2 | ⓘ Regla nueva | **La AUSENCIA del select "% Descuento" significa "este producto no tiene descuentos en la lista activa", NO que la VG esté en false.** Medido en la misma pantalla: `160000000`/`160000001` traen 4 selects (con Descuento) y `160000026` trae 3 (sin). Mismo cliente, misma lista, mismo instante. |
| 3 | ⚠ Cosmético | **Rótulo "Precio + IVA" engañoso.** Con 15 %, la línea muestra `Precio: 53,7500 USD` y `Precio + IVA: 52,9975 USD` — el "precio + IVA" queda **menor** que el precio. El número es correcto (`45,6875 × 1,16`), pero mezcla dos bases distintas sin decirlo: nunca se muestra el precio descontado ni el monto del descuento a nivel de línea. |
| 4 | ⚠ Cosmético | **Float crudo sin formatear en el Tab Total:** el IVA por línea en VES sale `15572.288000000002 VES` (15 decimales, punto decimal en vez de coma). Los totales de cabecera **sí** están formateados. Afecta a las 3 líneas (`22714.32`, `7772.1144`, `15572.288000000002`). |
| 5 | ⓘ Dato | `order_detail.co_discount` viaja **vacío (`""`)** aunque `id_discount` es correcto. No afecta cálculos ni el cotejo (el `id` alcanza), pero un cotejo por código fallaría. |
| 6 | ⓘ Comportamiento | **El descuento se auto-aplica al crear la línea**, tomando el de `nu_priority = 1`. Mientras el producto no está en el carrito el select se ve en "% Descuento" (`0`); al cargar la cantidad la app salta sola al descuento de prioridad 1 (7 % en `160000000`, 15 % en `160000001`). No es defecto — pero **el estado inicial del select no refleja lo que se va a aplicar**. |

**Ningún hallazgo es un error de cálculo.** Los 4 primeros son de presentación/config; los 2 últimos, informativos.

---

## Patrones / selectores nuevos

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **Select de descuento por línea: sus `value` son `id_discount`, no el %** | universal | `ion-select-option` → `{"% Descuento":0, "7":417, "15":393}` (number). Elegir **por `textContent` exacto** y leer el `value` resultante; nunca construir el value desde el porcentaje. El orden es "sin descuento" + prioridad ascendente. |
| **Ausencia del select "% Descuento" = producto sin descuentos en la lista, NO VG en false** | universal | Contradice y **acota** la nota de `[el_palmar-20260805]` ("3 selects = `userCanSelectProductDiscount=false`"). Verificar sobre un producto que **sí** tenga fila en `discount` para la lista activa antes de emitir veredicto de VG. |
| **Cambiar el descuento por `s.value = <id> + ionChange` recalcula el carrito completo** | universal | Sin abrir el `ion-popover`. Tras el set, `ng.applyChanges(app-pedido)` + ~1,5 s y el modelo ya trae `quDiscount`/`discountedNuPrice`/`subtotal` nuevos. Evita la receta cara de popover+`ion-radio-group` de `[alipascua-20260804]`. |
| **`nuAmountDiscount` es TOTAL de línea; `ivaProducto`/`taxedNuPrice` son UNITARIOS** | universal | Escalas mezcladas dentro del mismo objeto de línea. Comparar `nuAmountDiscount` contra un unitario da un falso descuadre ×cantidad. |
| 🔴 **Baseline-diff por `id_order > max(id_order)` NO detecta pedidos nuevos en esta playa** | cliente (el_palmar) | `max(id_order)` histórico = **23147** (fila outlier única), pero los pedidos nuevos se emiten en el rango **13.8xx** (13817, 13818, **13819**). Un baseline por `max(id)` devuelve `[]` y se lee como no-persistencia. **Usar `da_created >= hoy`.** |
| **La lista de precios del pedido la fija `client.co_list`** | universal | `comp.listaAnterior` = `{idList:2, coList:'Z02', naList:'Distrib. Aliados'}` = `client.co_list` del cliente elegido. ⇒ **para probar descuentos hay que elegir el CLIENTE cuya lista los tenga**; el select de lista de cabecera llega `disabled` con 1 sola opción. |
| **Los descuentos de el_palmar/1002 viven solo en Z01 y Z02** | cliente (el_palmar) | `discount` empresa 1002: Z01 (27 filas/26 prods) y Z02 (21/20). **Ninguna** de las listas de la cartera del vendedor 1276 (Z09, Z12, Z07, Z13, Z10, Z15, Z11) tiene descuentos ⇒ con ese vendedor **no se puede armar un pedido con descuento**. El vendedor **2045** sí (6 clientes en Z02). |
| **Envío de PEDIDOS = 3 alerts** | cliente | `[Cancelar, Aceptar]` "¿Desea Enviar el pedido?" → `[OK]` "Su Pedido será enviado" → `[OK]` "Pedido nro. **13819** enviado exitosamente". La 3.ª da la Ref. Resuelto sin reintentos comparando en minúsculas con igualdad exacta. |

---

## Nota para el perfil del cliente (`el_palmar.yaml`)

1. `vgs.userCanSelectProductDiscount: false` → **corregir a `true`** y retirar la nota "✅ CONFIRMADO EN UI"
   (el razonamiento de la ausencia del select quedó refutado).
2. Agregar a `modules.pedidos` los datos de escenario de descuento:
   vendedor **2045**, cliente **1000001162 MAYOR RKL** (lista **Z02**), productos
   `160000000` (7 % y 15 %), `160000001` (15 %), `160000026` (control sin descuento).
3. Anotar el caveat de baseline BD por `da_created` (no por `max(id_order)`).
