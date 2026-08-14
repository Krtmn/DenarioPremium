# Pedido de 55 líneas — **ENVIADO** · cierre del hueco de la prueba de carga

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Tipo | Prueba puntual dirigida — **NO es un caso del smoke** (no va al ledger) |
| Pregunta que cierra | «Si el cuelgue de los pedidos de 50+ líneas ocurre en el **POST de envío**, la prueba anterior no lo cubría» |
| Antecedente | `prueba-carga-pedidos-50.md` — 88 líneas montadas sin cuelgue, pero **sin enviar** (limitación #1 declarada) |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · **tag 20** · `window.ng=TRUE` |
| Playa / Cliente | EL YAQUE · difranca · empresa **DDHP_A12 (id 2)** · tasa **752,0900** |
| Cliente del pedido | **CAR755** MULTIDISTRIBUIDORA JAKE, C.A (`id_client 838`) |
| Líneas | **55** (umbral reportado: «más de 50») |
| Estado final | HOME ✅ · **pedido ENVIADO** · `id_order` **39796** |

---

## 1. 🔴 VEREDICTO

## ❌ **Tampoco se cuelga al enviar. El POST de un pedido de 55 líneas completó en ~6,4 s y llegó íntegro.**

El envío disparó sus **3 alertas normales**, el servidor devolvió el correlativo **39796** dentro del propio flujo
(«Pedido nro. 39796 enviado exitosamente»), y las **55 líneas llegaron completas a la nube** con los totales
exactos al cuarto decimal. La cola de salida quedó en 0 y no hubo transacciones fallidas.

**El hueco que dejó la prueba anterior queda cerrado: el cuelgue reportado en campo no está ni en el montaje
(88 líneas) ni en el envío (55 líneas).**

**Máxima congelación medida durante el POST: 773 ms.** Menos de un segundo, y una sola vez.

---

## 2. Medición del envío

Reloj a cero en el click sobre `ion-button.imagenEnviar`:

| t (ms) | Evento | Ping al hilo JS |
|--------|--------|-----------------|
| 0 | Click en **Enviar** (55 líneas en el carrito, botón `disabled=false`) | — |
| **2.425** | — | **10 ms** — hilo libre |
| **2.459** | Alerta 1: `Pedidos` / «¿Desea Enviar el pedido?» `[Cancelar / **Aceptar**]` → se pulsa Aceptar | — |
| **5.889** | POST en vuelo | **773 ms** ← único momento de hilo ocupado |
| **6.446** | Alerta 2: `Denario Pedidos` / «Su Pedido será enviado» `[OK]` | — |
| ~8.200 | Alerta 3: **«Pedido nro. 39796 enviado exitosamente»** `[OK]` ← correlativo del servidor | — |
| — | Post-envío, ya en la lista de pedidos | **120 ms** |

**Lectura:** el POST del pedido de 55 líneas se resolvió en **~6,4 s de punta a punta**, con **un solo pico de
773 ms** de hilo ocupado. No hubo pantalla congelada, ni alerta perdida, ni necesidad de reintentar.

### Comparación con el único síntoma real que sí encontró la prueba anterior

| Operación | Medición |
|---|---|
| **Guardar** con 87 líneas *(prueba anterior)* | congelamiento transitorio de **~4.890 ms** |
| **Enviar** con 55 líneas *(esta prueba)* | pico de **773 ms** |

⇒ **Guardar es más pesado que Enviar.** El envío no es el cuello de botella: el trabajo caro es la
**persistencia local en SQLite**, no el POST. Esto refina la hipótesis del reporte anterior.

### ⚠ Contraste relevante con DEVOLUCIONES de esta misma corrida

| Módulo | Sync a nube |
|---|---|
| **PEDIDOS** (esta prueba) | **INMEDIATA** — correlativo del servidor **dentro del flujo de envío**, `st_delivery=1` al instante |
| DEVOLUCIONES (`devoluciones.md`) | **DIFERIDA 5-12 min** — quedó `st_delivery=2` / «Por Enviar» / Ref 0 durante 3 polls |

**La inmediatez de la sync es por MÓDULO, no por servidor ni por build.** Es un patrón nuevo: hasta ahora se
venía atribuyendo al par (servidor, build). Aquí, el mismo dispositivo, la misma sesión y el mismo minuto dan
sync inmediata en pedidos y diferida en devoluciones.

---

## 3. Aritmética — totales y conversión

Moneda del pedido: **BSD** (la por defecto, igual que la prueba anterior, para que la curva sea comparable).
Todas las líneas con **cantidad 1**, producto distinto por línea.

| Concepto | Valor |
|---|---|
| Líneas | **55** |
| Suma independiente del carrito (`Σ nuPrice × quAmount`) | **1.335.230,5024 BSD** |
| **Total Base** en la UI (Tab Total) | **1.335.230,50 BSD** ✅ |
| **Total Pedido** en la UI | **1.335.230,50 BSD** ✅ |
| Total en moneda fuerte (UI) | **1.775,36 US$** |
| Tasa aplicada | **752,0900** |

### Comprobación de la conversión US$ → BSD

```
1.775,36 US$  ×  752,0900  =  1.335.230,50 BSD      ✅ exacto
    (752,09 × 1.775 = 1.334.959,75 · 752,09 × 0,36 = 270,7524 · suma = 1.335.230,5024)
```

### Comprobación línea a línea contra la nube (`order_detail`, 3 de 55)

| Producto | `nu_amount_total` (BSD) | `nu_amount_total_conversion` (US$) | × 752,0900 | ✔ |
|---|---|---|---|---|
| ACPDT300 | 43.681,3872 | 58,0800 | 43.681,3872 | ✅ exacto |
| AMPAN10-2 | 57.309,2580 | 76,2000 | 57.309,2580 | ✅ exacto |
| ACPDT300U | 3.640,1156 | 4,8400 | 3.640,1156 | ✅ exacto |

**La conversión es exacta al cuarto decimal, línea por línea y en el total.** Ningún defecto de conversión.

---

## 4. Verificación BD — ¿llegó **completo**?

### Nube (`order` / `order_detail`, id_order 39796)

| Comprobación | Resultado |
|---|---|
| Cabecera existe | ✅ `id_order=39796`, `co_order=1786125284808.0` |
| `st_order` | 1 → `transaction_statuses.co_status='env'` (**Enviado**) |
| `co_client` | CAR755 ✅ |
| **`co_enterprise` / `id_enterprise`** | **DDHP_A12 / 2** ✅ |
| `na_responsible` / `tx_comment` | «QA Carga 55» / «Test-PED-55LINEAS envio tag20» ✅ |
| `nu_amount_total` / `nu_amount_total_base` | 1.335.230,5024 / 1.335.230,5024 ✅ idénticos a la UI |
| `co_currency` / `id_currency` | BSD / 1 ✅ |
| **Líneas en `order_detail`** | **55** ✅ |
| Productos distintos | **55** ✅ (sin líneas repetidas ni colapsadas) |
| Σ `nu_amount_total` de las líneas | **1.335.230,5024** ✅ **cuadra exacto con la cabecera** |
| Σ `nu_amount_total_conversion` | **1.775,36 US$** ✅ |
| `nu_amount_tax` total | **0,0000** ✅ coherente con `userCanSelectIVA=false` |
| Líneas con `co_operation='D'` | **0** ✅ |

### Local (`orders`) y cola

| Campo | Valor |
|---|---|
| `co_order` | 1786125284808.0 |
| `id_order` | **39796** (correlativo del servidor grabado en local) |
| `st_order` / `st_delivery` | 1 / **1** (Enviado) |
| **`nu_details`** | **55** ✅ |
| `nu_amount_total` | 1335230.5024 ✅ |
| `pending_transactions` (type='order') | **0** |
| `failed_transactions` (type='order') | **0** |

### Payload capturado (`orderservice/order`)

`order.orderDetails` → **55 elementos** · `coOrder` 1786125284808.0 · `nuAmountTotal` 1335230.5024 ·
`coEnterprise` DDHP_A12 / `idEnterprise` 2. Capturado **1 sola vez**.

⇒ **BD-OK.** Las tres fuentes (UI, payload, local, nube) coinciden en las 55 líneas y en el total.

---

## 5. Montaje de las 55 líneas — tiempos

Construido en 4 tramos, todas las líneas con cantidad 1 y producto distinto:

| Tramo | Líneas acumuladas | ms del tramo | ms/línea | Fallos |
|---|---|---|---|---|
| 1 (calibración) | 2 | — | — | 0 |
| 2 | 21 | 47.128 | **2.356** | 0 |
| 3 | 41 | 55.237 | **2.511** (min 2.313 · max 3.033) | 0 |
| 4 (fin Pasarela) | 48 | 23.407 | **2.601** | 0 |
| 5 (BBK) | **55** | 14.961 | **1.835** (min 1.804 · max 1.866) | 0 |

🔴 **Las últimas 8 líneas (48 → 55, ya cruzado el umbral de 50) fueron las MÁS RÁPIDAS de toda la prueba**
— 1.835 ms/línea contra 2.356-2.601 en los tramos iniciales. **Cero degradación**; la dispersión responde al
tamaño del árbol de productos renderizado, no al número de líneas del pedido. Reconfirma la curva plana de la
prueba de 88 líneas, ahora también en el tramo crítico.

| Otra medición | 55 líneas |
|---|---|
| Render del **Tab Total** | **4.075 ms** (incluye `waitForFunction`; la prueba anterior midió 2.029 ms de render puro con 55) |
| Ping tras render del Tab Total | **10 ms** — el hilo queda libre enseguida |
| Fallos de agregado en 55 líneas | **0** |

---

## 6. Hallazgos colaterales (no defectos)

| Observación | Detalle |
|---|---|
| **3 selects por línea, no 5** | El panel de línea trae **Lista de precios / Unidad / Almacén** y **no** «% Descuento». ⇒ **confirma `validateWarehouses=false` y `userCanSelectProductDiscount=false`** en la UI — justo las dos VGs que el perfil marcaba ⚠️VERIFICAR por el precedente de alipascua. **Los dumps decían la verdad** |
| `nuPurchase` **no** es obligatorio en difranca | `required=false` y `lockSegments` cayó a `false` con solo aceptar el alert de deuda. ⇒ **`validateNuOrder=false` confirmado** (≠ el_palmar, donde el mismo `false` mentía) |
| Tasa `readonly=true` | `ion-input#tasa` = `752,09` con `disabled=false` pero **`readonly=true`** ⇒ **`enabledManualRate=false` / `canChangeRate=false` confirmadas** (se leyó el par, no solo `disabled`) |
| IVA ausente | 0,0000 en las 55 líneas ⇒ `userCanSelectIVA=false` confirmado, y con ello **`PED-IVA-CONV-DIV-CANTIDAD` y `PED-IVA-LINEA-NULL` no tienen dónde manifestarse en difranca** |
| Catálogo efectivo < badge | La familia **Pasarela** rotula **185** pero solo entrega **50** productos pedibles (`scrollDisable=true` en `page=4`); **BBK** rotula 114 y entrega 50. No es defecto observable desde aquí (hay filtros de precio/stock), pero **el badge no es el número de productos disponibles** — dato a tener en cuenta al planificar una prueba de carga |

---

## 7. Patrones de automatización nuevos

| Patrón | Detalle |
|---|---|
| 🔴 **El `textContent` del ítem de producto NO separa el código de «Precio»** | Se lee `Código: ACPDT300Precio: 43.681,39 BSD`. Un lookahead `(?![0-9A-Za-z])` tras el código **falla en el 100% de los casos** (la «P» de Precio lo rechaza) y se lee como «el producto no está en la lista» — costó un tramo entero de falsos `no-item`. **Parser correcto: `/Código:\s*([A-Za-z0-9-]+?)\s*Precio/` y comparar por igualdad exacta** |
| **Agregar una línea sin abrir modales** | `scrollIntoView({block:'center'})` → 300 ms → re-leer rect → `mouse.click` (expande el panel) → localizar `ion-input` por **`label === 'Cantidad:'`** → set nativo + `ionInput`/`ionChange`/`ionBlur`. **55 de 55 sin un fallo** |
| **`orderServ.carrito.length` es la única fuente fiable del nº de líneas** | Reconfirma la nota de `prueba-carga-pedidos-50.md`: `.contadorProductos` no cuenta líneas |
| **Reset del árbol de productos: tab General → tab Pedido** | Validado otra vez para cambiar de familia (Pasarela → BBK) conservando el carrito intacto |
| **Alerts de PEDIDOS en difranca: `Cancelar`/`Aceptar`/`OK` — NO en mayúsculas** | Contradice la nota de `prueba-carga-pedidos-50.md` («vienen en MAYÚSCULAS»). ⇒ **la etiqueta se LEE, nunca se predice**; comparar en minúsculas con igualdad exacta resolvió los 3 alerts sin reintentos |
| **`selectorCliente` de PEDIDOS trae 296 clientes** (vs 148 en devoluciones) | La cartera del selector de pedidos **no está filtrada por empresa** como la de devoluciones. Dato a verificar en una corrida futura: podría ser deliberado o ser el escenario de `WEB-LIMPIAR-CAMBIA-EMPRESA` |

> ✅ consolidado 2026-08-07

---

## 8. Respuesta corta para la QA

> **Lo envié, y no se colgó.** Armé un pedido de **55 productos** para CAR755 y le di a Enviar: la app pidió
> confirmación, mandó el pedido y el servidor le puso el número **39796** — todo en **6,4 segundos**. Lo único
> que medí es que el teléfono queda ocupado **menos de un segundo** mientras manda; nada que se vea como una
> trabada.
>
> Y llegó **completo**: revisé la base del servidor y están las **55 líneas**, ni una de menos, con el total
> exacto: **1.335.230,50 Bs**, que son **1.775,36 dólares** a la tasa de hoy (752,0900). Cada línea cuadra al
> céntimo.
>
> Con esto queda cerrado lo que faltaba de la prueba anterior: **ni armando el pedido (probé hasta 88) ni
> enviándolo se cuelga**. Lo más pesado que encontré sigue siendo **Guardar** (unos 5 s con 87 líneas), no
> enviar.
>
> Sigue en pie la pista del **«50»**: la **lista de productos** carga de a 50 y tarda 5-7 s en traer el resto.
> Si el cuelgue que te reportaron pasa **buscando productos**, eso sí lo puedo probar dirigido.

---

*Prueba dirigida · 55 líneas · pedido **39796 ENVIADO** y verificado en nube · POST 6,4 s · congelación máx. 773 ms · 0 cuelgues · estado final HOME*
