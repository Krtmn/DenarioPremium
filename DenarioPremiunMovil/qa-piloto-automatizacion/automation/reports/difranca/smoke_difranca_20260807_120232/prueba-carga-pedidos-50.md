# Prueba dirigida de CARGA — PEDIDOS con más de 50 productos

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Tipo | Prueba puntual dirigida (**NO** es un caso del smoke; no toca `pedidos.md` ni el ledger) |
| Pregunta de campo | «Los pedidos montados con más de 50 productos hacen que la app se quede colgada» |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · **tag 20** · `window.ng=TRUE` |
| Playa / Cliente | EL YAQUE · difranca · empresa **DDHP_A12** (id 2) · tasa 752,0900 |
| Cliente del pedido | **CAR755** MULTIDISTRIBUIDORA JAKE, C.A (id_client 838) |
| Máximo alcanzado | **88 líneas** (limitado por catálogo, **no** por la app) |
| Estado final | HOME ✅ · **0 pedidos enviados** · pedido de prueba guardado y **borrado** |
| Watchdog | **0 cuelgues de app · 0 cuelgues de CDP · 0 `TIMEOUT:` atribuibles a la aplicación** |

---

## 1. 🔴 VEREDICTO

## ❌ **NO se confirma. La app NO se cuelga con más de 50 productos.**

Se montó un pedido real de **88 líneas** subiendo en tramos (10 → 20 → 30 → 40 → 45 → 50 → 55 → 60 → 70 → 80 → 88).
**En ningún tramo se colgó**: ni la aplicación, ni el canal de automatización. Cruzando el umbral declarado
(50 → 55 → 60) **no hubo ningún cambio de comportamiento**: los tiempos por línea en 55 y en 88 son los mismos
que en 10, los totales siguieron siendo exactos al céntimo, y la UI siguió respondiendo en cada punto.

El límite de 88 líneas **es de material**: se agotaron los productos con inventario del catálogo alcanzable
(BBK y HD Cosmetics), no la capacidad de la app. No se encontró ningún techo de la aplicación.

**Único síntoma real encontrado:** un **congelamiento transitorio de ~5 s al pulsar Guardar** con 87 líneas
(§4.1) y un **render del Tab Total que crece hasta ~3 s** (§4.2). Ambos se recuperan solos. Es lentitud, no cuelgue.

> ⚠ **Alcance de lo que NO se probó:** por instrucción explícita **no se envió el pedido**. Si el cuelgue que
> reporta la QA ocurre en el **POST de envío** de un pedido grande, esta prueba **no lo cubre** (ver §6).

---

## 2. Tabla de tramos

Todas las líneas con **cantidad 1**, moneda del pedido **BSD** (la por defecto), producto distinto por línea.

| Líneas | ms del tramo (agregar) | ms/línea | ¿UI responde? | Tab→Total (ms) | Tab→Pedido (ms) | ping (ms) | Total Base BSD | ¿Total correcto? | Mem (MB) |
|--------|------------------------|----------|---------------|----------------|-----------------|-----------|----------------|------------------|----------|
| 0 (baseline) | — | — | ✅ | — | 562 | 9 | — | — | 117 |
| **10** | 11.447 | 1.272 | ✅ | 894 | 638 | 9 | 204.846,75 | ✅ exacto | 117 |
| **20** | 13.996 | 1.400 | ✅ | 1.110 | 510 | 28 | 401.382,91 | ✅ exacto | 117 |
| **30** | 12.041 | 1.204 | ✅ | 1.391 | 457 | 81 | 536.217,61 | ✅ exacto | 117 |
| **40** | 10.585 | 1.059 | ✅ | 2.063 | 492 | 65 | 741.959,35 | ✅ exacto | 117 |
| **45** | 5.454 | 1.091 | ✅ | 1.806 | 713 | 65 | 836.278,95 | ✅ exacto | 117 |
| **50** | 5.369 | 1.074 | ✅ | 2.415 | 510 | 68 | 865.813,53 | ✅ exacto | 117 |
| **55** 🔴 | 3.614 | 1.205 | ✅ | 2.029 | 528 | 69 | 978.439,01 | ✅ exacto | 117 |
| **60** | 6.691 | 1.338 | ✅ | 2.164 | 521 | 77 | 1.031.032,66 | ✅ exacto | 117 |
| **70** | 12.367 | 1.237 | ✅ | 2.428 | 581 | 79 | 1.187.046,21 | ✅ exacto | 117 |
| **80** | 12.869 | 1.287 | ✅ | 2.695 | 541 | 85 | 1.340.066,44 | ✅ exacto | 117 |
| **88** | 11.897 | 1.487 | ✅ | 2.495 → 3.138 | 578 | 71 | 1.395.209,68 | ✅ exacto | 117 |

🔴 = cruce del umbral declarado por el reporte de campo.

**«Total correcto»** se verificó en cada tramo contra la suma independiente del carrito del componente
(`orderServ.carrito`, Σ `nuPrice × quAmount`). Ejemplo del último tramo: UI `1.395.209,68` vs suma calculada
`1.395.209,6799` → Δ = 0,0001 (redondeo de presentación). **El recálculo nunca se degradó ni se desincronizó.**

### 2.1 Tiempos puros de la app (sin el overhead del arnés)

El «ms/línea» de arriba incluye el ida y vuelta de la automatización. Estas dos medidas son de la app sola:

| Operación | 10 líneas | 30 | 50 | 60 | 80 | 88 | Tendencia |
|---|---|---|---|---|---|---|---|
| Expandir el producto (click → input de cantidad visible) | ~510 | ~505 | ~450 | ~475 | ~480 | ~430 | **plana** |
| Recalcular tras cargar la cantidad (fill → línea en el carrito) | ~700 | ~675 | ~565 | ~670 | ~700 | ~610 | **plana** |

**No hay coste cuadrático.** El tiempo de agregar la línea número 88 es indistinguible del de la línea número 3.

---

## 3. Curva de tiempos — lectura

El **único** tiempo que crece con el número de líneas es el **render del Tab Total**:

```
líneas :  10    20    30    40    45    50    55    60    70    80    88
ms     : 894  1110  1391  2063  1806  2415  2029  2164  2428  2695  3138
```

- De 10 → 88 líneas: **×8,8 en líneas** produce **×3,5 en tiempo**.
- El crecimiento es **sub-lineal** (~25 ms por línea marginal), con ruido de ±400 ms.
- **No es cuadrático**: si lo fuera, con 88 líneas el Tab Total tardaría ~70 s, no 3.

⇒ **No se cumple el escenario «cada línea nueva tarda más que la anterior»** que el prompt señalaba como
hallazgo aunque no hubiera cuelgue. Aquí no lo hay.

---

## 4. Síntomas intermedios encontrados

### 4.1 🟡 Congelamiento transitorio de ~5 s al **Guardar** (el único parecido a un «cuelgue»)

Con **87 líneas** se pulsó Guardar (nunca Enviar):

| Medida | Valor |
|---|---|
| Click Guardar → alerta «Denario / Pedido Guardado» | **784 ms** |
| **Ping al hilo inmediatamente después de la alerta** | **4.890 ms** ← el hilo quedó ocupado |
| Pings siguientes (a partir de ~1 s después) | 88 · 7 · 8 · 10 · 9 · 13 ms → **normalizado** |
| Aceptar el OK | 349 ms |
| Salir del formulario | 572 ms |

La alerta aparece rápido, pero **la app sigue trabajando ~5 s por detrás** (persistencia de las 87 líneas en
SQLite). Para el usuario eso se ve como *«toqué Guardar, salió el mensaje y el teléfono se quedó tildado unos
segundos»*. **Se recupera solo, sin pérdida de datos.** Es el candidato más plausible a lo que la QA
percibió como «colgada» — pero es **lentitud transitoria**, no un cuelgue.

### 4.2 🟡 Tab Total: hasta ~3,1 s de render con 88 líneas

Es el peor tiempo medido de toda la prueba. Sigue siendo lentitud tolerable y **el contenido sale correcto**.

### 4.3 ✅ Lo que **no** se degradó

| Comprobación con 88 líneas | Resultado |
|---|---|
| **Scroll** del Tab Total (8.977 px de contenido) | **50 ms** — fluido, sin trabas |
| Expandir un ítem del Tab Total | 268 ms |
| **Borrar una línea** (trash) → recálculo | **390 ms**; Items 88→87, total `1.395.209,68 → 1.392.472,07` (= exactamente −2.737,61, el precio del ítem borrado) ✅ |
| Totales que dejan de actualizarse | **No ocurrió en ningún tramo** |
| Botones Guardar/Enviar | Habilitados y correctos en todo momento |
| Salir del form / navegar / lista BUSCAR (97 ítems) | 572 ms / 2.361 ms / 2.557 ms — normales |
| **Memoria JS** | **117 MB usados / 125 MB reservados / 1.020 MB de límite — CONSTANTE en los 11 tramos.** Sin fuga apreciable ⚠ `performance.memory` reporta con granularidad reducida: léase «sin crecimiento apreciable», no «cero bytes» |

### 4.4 Round-trip de persistencia (§9 RUNTIME) con 87 líneas

BD local tras Guardar: `co_order=1786122405014.0` · `id_order=0` · **`st_delivery=3` (Guardado, NO enviado)** ·
**`nu_details=87`** · `nu_amount_total=1392472.0722999983` (idéntico al total de la UI) ·
`pending_transactions=0`. **Se guardaron las 87 líneas, íntegras y sin pendientes.**

---

## 5. 🔎 Hipótesis alternativa sobre el origen del reporte — «50» es el tamaño de página del catálogo

El número **50** del reporte de campo **no corresponde a ningún umbral del carrito**, pero **sí coincide
exactamente con el tamaño de página del listado de productos**: el Tab Pedido renderiza **50 productos** y el
resto llega por scroll infinito (`productos-tab-order-product-list.onIonInfinite`, `page` / `scrollDisable`).

Medición del paginado en esta corrida:

| Categoría | Productos que muestra de entrada | Tras paginar | ms en paginar |
|---|---|---|---|
| BBK (badge 114) | **50** | 83 | 4.851 – 6.765 |
| HD Cosmetics (badge 118) | **50** | 71 | 5.356 – 6.041 |

⇒ Al pasar del producto **50** hacia abajo, la lista tarda **~5-7 s** en traer el resto, y durante ese tiempo
**la pantalla no cambia**. A eso se suma el defecto ya documentado de esta corrida (`pedidos.md`): *`onIonInfinite`
pagina el modelo pero **no re-renderiza el DOM** sin `applyChanges`*, que hace que la lista pueda quedarse
visiblemente congelada aunque los datos ya estén cargados.

**Eso encaja mucho mejor con «pasando de 50 se queda colgada» que el número de líneas del pedido**, y es
verificable con la QA en una pregunta: *¿la app se traba al **buscar y desplazar productos** en la lista, o al
**tener muchas líneas ya cargadas** en el pedido?* Lo segundo quedó **refutado**; lo primero es un candidato
concreto y medido.

---

## 6. Limitaciones de esta prueba (declaradas)

| # | Limitación | Por qué importa |
|---|---|---|
| 1 | **No se envió el pedido** (instrucción explícita: `notificationsOrder=true`) | Si el cuelgue ocurre en el **POST de envío** de 50+ líneas, esta prueba **no lo descarta**. Es el hueco principal |
| 2 | Máximo 88 líneas | Se agotó el catálogo con inventario alcanzable, no la app. No hay evidencia de qué pasa a 150+ |
| 3 | **Cantidad 1 por línea** | No se probó el combinado «muchas líneas × cantidades grandes» |
| 4 | Moneda **BSD** (la por defecto), `userCanSelectIVA=false`, sin descuentos | El recálculo del pedido en difranca es simple; en un cliente con IVA y descuentos por línea el coste por recálculo podría ser mayor |
| 5 | Interacción por CDP, no con el dedo | Los tiempos puros (expandir, recalcular, borrar, scroll) sí son de la app y del **mismo teléfono físico**; el gesto humano no se simuló |
| 6 | Un solo dispositivo / una sola playa | El teléfono de campo puede ser más lento o tener más datos sincronizados |

---

## 7. Notas de automatización (insumo de consolidación, no defectos)

| Patrón | Detalle |
|---|---|
| **Fuente fiable del nº de líneas = `orderServ.carrito`** | ⚠ **`.contadorProductos` NO cuenta líneas**: con 10 líneas cargadas seguía marcando `"1"`. Es el badge del producto, no del pedido. Usar `ng.getComponent(document.querySelector('app-pedido')).orderServ.carrito.length` |
| **Componente de la lista de productos: `productos-tab-order-product-list`** | Expone `page`, `scrollDisable`, `productList`, `onIonInfinite`, `onProductQuantityChange`, `refreshRemainingStock`. Es el que hay que paginar (+`ng.applyChanges`) — confirma la nota de `pedidos.md` |
| 🔴 **Los botones de alert de difranca vienen en MAYÚSCULAS (`ACEPTAR`, `CANCELAR`, `OK`)** | La receta canónica de **igualdad exacta** contra `'Aceptar'` **devuelve `null`** y se lee como «el alert no tiene botones». Comparar en **minúsculas** manteniendo la igualdad exacta |
| 🔴 **Hay 4 `img.fechaAtras` en el DOM y 3 tienen rect 0×0** | Tomar «el primero» da coords `(0,0)` y el back no navega (se lee como cuelgue). **Filtrar por `getBoundingClientRect().width>0`** — el visible está en ≈(32,31) |
| **Reset del árbol de productos: General → Pedido** | Más fiable que el `arrow-back-outline` para volver al nivel de categorías; validado 3 veces. Cambiar de tab colapsa el árbol siempre |
| **`setClientfromSelector` SÍ opera en difranca** | `ng.getComponent(app-pedido).setClientfromSelector(cli)` + `applyChanges` seleccionó CAR755 sin abrir el modal; dispara el alert de deuda vencida. Confirma `[latino_cosmetica-20260729]`, contradice `[gmp-20260730]` |
| **El modal de cliente carga los 148 clientes en el modelo aunque el DOM muestre 50** | `selectorCliente.clientes` ya traía los 148 con `scrollDisable=true`; CAR755 en el índice **52** |
| **Tabla local de detalle NO es `order_detail`** | `no such table: order_detail` en la BD local (nombres locales en plural). `orders.nu_details` sirve como contador de líneas |

> ✅ consolidado 2026-08-07

---

## 8. Respuesta corta para la QA

> **No, no se cuelga.** Monté un pedido de **88 productos** en este mismo teléfono, subiendo de a poco y
> midiendo en cada paso: a 50, a 55, a 60 y a 88 líneas la app siguió respondiendo, los totales siguieron
> saliendo exactos y agregar la línea 88 tardó lo mismo que agregar la línea 3 (~0,6 s).
>
> Lo que **sí** medí es que **al pulsar Guardar con 87 líneas el teléfono queda tildado unos 5 segundos**
> mientras graba, y que la pestaña **Total tarda ~3 s** en dibujarse cuando el pedido es grande. Se destraba
> solo y no se pierde nada.
>
> Y una pista sobre el «50»: la **lista de productos** carga de a **50** y tarda **5-7 s** en traer el resto
> cuando uno sigue bajando. ¿El cuelgue que te reportaron pasa **buscando productos en la lista**, o con el
> pedido **ya cargado**? Lo segundo queda descartado; lo primero encaja con el número y lo puedo probar dirigido.
>
> ⚠ Una cosa **no** la probé porque no debía: **enviar** el pedido. Si el cuelgue les pasa **al enviar**, hace
> falta una segunda prueba con autorización (dispara correo al cliente).

---

*Prueba dirigida de carga · 88 líneas alcanzadas · 0 cuelgues · 0 pedidos enviados · estado final HOME*
