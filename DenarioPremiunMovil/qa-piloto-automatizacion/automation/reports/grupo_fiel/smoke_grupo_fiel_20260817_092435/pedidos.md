# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | PEDIDOS |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA) `00001` / idEnterprise 1 (empresa ÚNICA) |
| Vendedora | johana · id_user 463 · co_user `003` |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` · `sqlitePlugin` OK |
| Playa | **El Yaque** — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues · 0 `TIMEOUT:` · 0 reconexiones |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | `/pedidos` con los 3 `ion-button.colorBorderBuscar`: PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | Form abre con Pedido/Total/Adjunto `segment-button-disabled`, `lockSegments=true`, `hasClient=false`, Guardar/Enviar `disabled` |
| DM-PED-006 | ✅ PASS | `setClientfromSelector` seleccionó MP GELATO C.A. (J-504863246, idClient 401). **Alerta de deuda vencida disparó**: "Pedidos / Este cliente tiene deuda vencida, ¿Desea continuar con el pedido?" `[Cancelar, Aceptar]` → Aceptar al 1.er intento. Tras aceptar: 4 tabs habilitadas, `lockSegments=false` |
| DM-PED-015 | ✅ PASS | Tab Pedido lista categoría `Desechable 4` → drill-down → **4 productos con precio en BS e inventario** (1.5LTS 3.756,66/812 · 330ML 6.064,32/820 · 5LTS 3.559,88/800 · 600ML 6.292,41/660). ⚠ **El catálogo SÍ llega en BS** — no reprodujo el falso-FAIL de el_palmar |
| DM-PED-017 | ✅ PASS | Cantidad 2 en 1.5LTS → badge `[color=success]`, `.contadorProductos="2"`, `carrito.length=1`, **Inventario 812→810 en vivo**, Guardar/Enviar pasaron a `disabled=false` |
| DM-PED-024 | ✅ PASS | Tab Total con **BS y USD**: Base BS 22.160,58 / USD 28,74 · IVA BS 3.545,69 / USD 4,60 · **Total BS 25.706,27 / USD 33,34** · Tasa 771,07 · `Total Items: 2` · `Total CAJA: 5,00`. Aritmética exacta: 3.238,50×2 + 5.227,86×3 = 22.160,58 |
| DM-PED-026 | ✅ PASS | Trash del ítem 330ML → `Total Items` 2→1, `Total CAJA` 5,00→2,00, **Total BS 25.706,27 → 7.513,32**. Borrado directo, sin confirmación. (2 intentos: el 1.º falló por índice de acordeón — ver Patrones) |
| DM-PED-029 | ✅ PASS | Medido el par antes/después: con cliente y **sin ítems** `imagenGuardar`/`imagenEnviar` = `disabled:true`; tras la 1.ª línea ambos `false` en el mismo tick |
| DM-PED-030 | ✅ PASS | Alert `Denario / "Pedido Guardado"` `[OK]`. Pedido en lista con `Nro. Ref.: 0` · Estatus **Guardado** · comentario `Test-PED-SMOKE-140810` |
| DM-PED-031 | ✅ PASS | Secuencia de **3 alerts**: `Pedidos/"¿Desea Enviar el pedido?"` `[Cancelar, Aceptar]` → `Denario Pedidos/"Su Pedido será enviado"` `[OK]` → `Denario Premium/"Pedido nro. 1356 enviado exitosamente"` `[OK]` → navega a `/pedidos`. **BD-OK** |
| DM-PED-032 | ✅ PASS | Atrás con form dirty → modal `¡Alerta!` con las **3 opciones** `[Guardar y salir · Salir sin guardar · Cancelar]` al 1.er intento |
| DM-PED-034 | ✅ PASS | Searchbar "GELATO" → lista filtra **34 → 3** en tiempo real. ⚠ Al vaciar el buscador la lista **repuebla a 34** — este build NO reproduce `PRD-BUSCADOR-NO-REPUEBLA` en `app-pedidos-lista` |
| DM-PED-035 | ✅ PASS | Reabrir el Guardado desde BUSCAR → form **editable** con 4 tabs habilitadas. Round-trip §9 completo (abajo) |
| DM-PED-037 | ✅ PASS | Trash en lista → `Pedidos / "¿Seguro que quieres eliminar este pedido?"` `[Cancelar, Aceptar]` → el pedido desaparece (35→34, `Guardado`=0) |

---

## 🔴 Veredicto 1 — Tipo de pedido (`co_order_type`): **NO se pierde. La alarma queda ACLARADA.**

**Lo que se pidió comprobar:** los pedidos 1354 y 1355 llegaron a la nube con `co_order_type = NULL` pese a `selectOrderType=true` y 2 tipos activos.

**Lo medido, punto por punto:**

| Pregunta | Respuesta medida |
|---|---|
| (a) ¿La UI **exige** elegir tipo de pedido? | **No lo exige, pero tampoco lo deja vacío.** El `ion-select` de Tipo de pedido llega **habilitado y preseleccionado** en `B / Pedido Nota` (el `default_value=TRUE` de la BD). Nunca hay un estado "sin tipo". |
| (b) ¿Se puede cambiar? | **Sí.** Popover con las 2 opciones activas (`Pedido Nota`, `Pedido Factura`); se cambió a `A / Pedido Factura` sin alerta ni recarga del form. |
| (c) ¿El payload viaja con el tipo? | **Sí — pero solo como `idOrderType`.** El POST `orderservice/order` trae **`"idOrderType": 4`** y **NO contiene ninguna clave `coOrderType`**. |
| (d) ¿Llega a la nube? | **Sí.** `order.id_order_type = 4` en el pedido 1356. Correcto y discriminante. |

**Contraste de BD que cierra el caso:**

```
SELECT co_order_type, count(*) FROM "order" GROUP BY co_order_type;   -- NULL : 985   (985 de 985)
SELECT id_order_type, count(*) FROM "order" GROUP BY id_order_type;   -- 3 : 824 | 4 : 103 | 1 : 59
```

`co_order_type` está NULL en **985 de 985 pedidos del tenant** — no es algo que pasó en 1354/1355, **nunca se pobló para ningún pedido**. En cambio `id_order_type` sí discrimina y coincide con lo elegido: 1354 → `3` (Pedido Nota), 1355 → `4` (Pedido Factura), **1356 (este smoke, tipo A elegido explícitamente) → `4`** ✅.

> **Veredicto: NO es FAIL. No hay pérdida de información** — el tipo de pedido se conserva end-to-end vía `id_order_type` y es recuperable con `JOIN order_type ON order.id_order_type = order_type.id_order_type`.
> **Sí queda un hallazgo menor de integridad de datos (S3):** la columna denormalizada `order.co_order_type` **nunca se llena** porque la app no la incluye en el payload. Cualquier reporte o consulta que lea `co_order_type` en vez de `id_order_type` devolverá NULL para el 100 % de los pedidos. Recomendación: o la app agrega `coOrderType` al payload, o el consumo se hace siempre por el join.

---

## 🔴 Veredicto 2 — `pricelistByOrderType`: **CONFIRMADO, funciona.** ✅

Medido con A/B limpio sobre el **mismo cliente, mismo catálogo, misma moneda**, cambiando solo el tipo de pedido:

| Producto | Tipo **B** — Pedido Nota (lista `02`) | Tipo **A** — Pedido Factura (lista `03`) | Δ |
|---|---|---|---|
| 1.5LTS | 3.756,66 BS | **3.238,50 BS** | −13,8 % |
| 330ML | 6.064,32 BS | **5.227,86 BS** | −13,8 % |
| 5LTS | 3.559,88 BS | **3.068,86 BS** | −13,8 % |
| 600ML | 6.292,41 BS | **5.424,49 BS** | −13,8 % |

- Al elegir el tipo, el `ion-select` de **Lista de precios** (que está `disabled`) se reetiquetó solo: `Precio 2 - Nota de Entrega` → `Precio 3 - Factura Fiscal`, y `comp.listaAnterior` pasó de `{idList:1, coList:"02"}` a `{idList:2, coList:"03"}`.
- **2.ª confirmación independiente:** un 2.º pedido creado desde cero (tipo default B) volvió a mostrar 5LTS a **3.559,88** (lista 02), contra los 3.068,86 del tipo A.
- **End-to-end:** el payload y la fila de `order_detail` del pedido 1356 traen `co_price_list = "PREC1.5LTS-03"` / `id_price_list = 2` y `nu_price_base = 3238.50` — el precio **de la lista 03**, no el de la 02.

> ℹ️ Matiz honesto sobre la naturaleza del delta: el panel del producto expandido rotula `Precio: 3.238,50 BS` **y** `Precio + IVA: 3.756,66 BS`, y 3.238,50 × 1,16 = 3.756,66 exacto. Es decir, las listas 02 y 03 comparten el precio base y difieren en el tratamiento de IVA (`idIvaList` 5 vs 7: la 02 lo trae incluido, la 03 lo desglosa). **El efecto sobre el pedido es real y observable** (cambia el precio unitario mostrado, el `co_price_list` que viaja y la base imponible), pero no se trata de dos tarifas comercialmente distintas.

---

## Verificación de VGs (leídas, no supuestas)

**Los 6 `ion-select` del Tab General (post-cliente)** — mapa completo en una pasada:

| # | Control | Estado | VG resuelta |
|---|---|---|---|
| 0 | Empresa | `disabled`, `value` = **objeto empresa completo**, 1 opción | 1 sola empresa, auto-asignada · payload viajó `coEnterprise:"00001"/idEnterprise:1` ✅ |
| 1 | **Moneda** | **`disabled`**, `BS`, 2 opciones (BS/USD) | `multiCurrencyOrder=false` ✅ — una sola moneda operativa |
| 2 | Dirección/Sucursal | habilitado, 1 opción auto-seleccionada | — |
| 3 | **Tipo de pedido** | **habilitado**, `B/Pedido Nota` por defecto, 2 opciones | `selectOrderType=true` ✅ |
| 4 | **Lista de precios** | **`disabled`**, sigue al tipo de pedido | `userCanChangePriceList=false` ✅ · `pricelistByOrderType=true` ✅ |
| 5 | Condición de pago | habilitado, `CONTADO`, 2 opciones | `userCanChangePaymentConditions=true` ✅ |

**Los `ion-input` del Tab General:** `#clienteSelect` · `#tasa` (**`disabled=false` pero `readonly=true`**, 771,07 — no editable) · `#nuPurchase` (**`required=false`** ⇒ `validateNuOrder=false` ✅, no bloquea las tabs a diferencia de el_palmar) · `#naResponsible` · `#txComment`.

**Panel del producto expandido — llegan 3 selects, no 5:**

| Control | Estado | VG resuelta |
|---|---|---|
| Lista de Precio | `disabled`, 1 opción | `userCanChangePriceList=false` ✅ |
| Unidad | habilitado, 1 opción (CAJA) | — |
| **Almacén** | **`disabled`**, 5 opciones, preseleccionado `ALMACEN MARACAIBO` | `userCanChangeWarehouse=false` ✅ · `validateWarehouses=true` (viajó `coWarehouse:"005"/idWarehouse:5`) |
| **% Descuento** | **AUSENTE** | `userCanSelectProductDiscount=false` ✅ — la ausencia *es* la señal |

**Otras VGs verificadas:**

- `userCanSelectGlobalDiscount=true` ✅ — Tab Total trae selector "Descuento Global" habilitado con `[SIN DESCUENTO, DESC 7 TEST]`. Aplicado: **453,39 BS (7 % sobre 6.477,00)**, IVA recalculó a 963,78, Total 7.513,32 → **6.987,39 BS**. Viajó `nuDiscount:7 / nuAmountGlobalDiscount:453.39` y llegó a la nube idéntico.
- `quUnitDecimals=false` ✅ — cantidades enteras (`quOrder:2`).
- `showTotalization=true` ✅ · `totalUnit=true` ✅ (`Total CAJA: 5,00`) · `showProductImages=true` ✅ · `quPageProduct=50` (no ejercitado: el catálogo tiene 4 productos, `scrollDisable=true` en la 1.ª página).
- `featuredProducts=true` con línea "DESTACADOS" ✅ — la línea existe en el Tab Pedido, con **contador 0** (igual que `Favoritos 0`): no hay productos marcados como destacados en este tenant. Observación de datos, no defecto.
- `stock0=false` / `validStock=true` — **no ejercitados**: los 4 productos del catálogo tienen inventario > 600. Sin producto con stock 0 no hay forma de provocar la condición por UI.
- `signatureOrder=true` — tab Adjunto presente; no se ejercitó firma (ningún caso asignado la cubre y no bloqueó el envío: el pedido se envió con `nuAttachments:0 / hasAttachments:"false"`).

---

## 🚫 Pedido sugerido — N/A por datos huérfanos (confirmado, NO es defecto de la app)

El botón **"Pedido Sugerido" no aparece en ninguna tab** del formulario (`0` botones matcheando `/sugerid/i` en `app-pedido`), pese a `suggestedOrder=true`. Es la **8.ª playa consecutiva** con la misma divergencia UI-vs-config (jerez, ferrenuestro, dm-electronica, globalmp, latino_cosmetica, alipascua, el_palmar, grupo_fiel) ⇒ la VG que gobierna ese botón **no es `suggestedOrder`**; sigue pendiente de aclarar con desarrollo.

Independientemente de eso, el algoritmo tampoco tendría con qué calcular: `client_avg_product` tiene 102 filas con `average>0` apuntando a **25 códigos de cliente en formato viejo (`C000799`) que no existen en `client`** (los reales son RIF `J-…`). Cruce medido previamente: **0 de 25**. ⇒ **🚫 N/A por datos huérfanos** — no se levanta como FAIL, y el arreglo es de datos, no de código.

---

## Verificación BD

**Baseline (inicio del módulo):** `count(*)=985` · `max(id_order)=1355`.

**Nube — `order` (diff de baseline, toda fila nueva):**

| Campo | UI / payload | Nube (`id_order=1356`) | ✔ |
|---|---|---|---|
| `co_order` | `1786975326913.0` | `1786975326913.0` | ✅ |
| `st_order` | 1 | 1 | ✅ |
| `nu_amount_total_base` | 6.477,00 | `6477.0000` | ✅ |
| `nu_amount_global_discount` / `nu_discount` | 453,39 / 7 | `453.3900` / `7.0000` | ✅ |
| `nu_amount_tax` | 963,7776 | `963.7776` | ✅ |
| `nu_amount_total` | 6.987,3876 | `6987.3876` | ✅ |
| `nu_amount_final` | 6.023,61 | `6023.6100` | ✅ |
| `nu_details` | 1 | `1` | ✅ |
| `tx_comment` | `Test-PED-SMOKE-140810` | idéntico | ✅ |
| `co_user` / `co_enterprise` | `003` / `00001` | `003` / `00001` | ✅ |
| `co_currency` / `nu_value_local` | BS / 771,07 | `BS` / `771.0700` | ✅ |
| `co_payment_condition` | CodContado | `CodContado` | ✅ |
| **`id_order_type`** | 4 (Pedido Factura, elegido) | **`4`** | ✅ |
| `co_order_type` | *(no viaja en el payload)* | `NULL` | ⚠ ver Veredicto 1 |

**Nube — `order_detail` (línea a línea):** 1 fila · `co_product=1.5LTS` · `nu_price_base=3238.5000` · `id_price_list=2` · `co_price_list=PREC1.5LTS-03` · `iva=16` · `nu_amount_total=6987.3876` · `nu_amount_tax=963.7776` · `order_detail_unit`: 1 unidad con `qu_order=2.0000`. **Todo cuadra con el Tab Total y con el payload.**

**Local (`window.sqlitePlugin`, tabla PLURAL `orders`):** `id_order=1356` · `st_order=1` · **`st_delivery=1`** · `nu_amount_total=6987.3876` · `nu_details=1` · `pending_transactions (type='order') = 0` · `failed_transactions = 0` · `count(*)=34` = `count(DISTINCT co_order)=34` (**sin duplicados**).

**Conclusión guardado→enviado:** ✅ **BD-OK**. El pedido se guardó (`st_delivery=3`, Ref 0), se reabrió íntegro, se envió, y llegó a la nube completo y sin quedar en cola. Sync **INMEDIATA** (< 8 s, confirmado en el 1.er poll).

**Correlación Ref↔fila:** el `Nro. Ref. 1356` de la UI = `id_order=1356` — **reconfirmado** (BD-INFO).

**Hook de payload:** 1 solo POST `orderservice/order` capturado **con body completo y sin duplicados** (consumido del `__qaDataHook` heredado, sin reinstalar el bundle). Volcado a `_payloads.jsonl`.

---

## Round-trip §9 (Guardar → reabrir → comparar 1:1)

| Valor | Antes de Guardar | Al reabrir desde BUSCAR | ✔ |
|---|---|---|---|
| Tipo de pedido | `Pedido Factura` (`idOrderType:4, coOrderType:"A", idList:2, coList:"03"`) | idéntico | ✅ |
| Lista de precios | `Precio 3 - Factura Fiscal` | idéntico | ✅ |
| Moneda | `BS` (`localCurrency:true`) | idéntico | ✅ |
| Tasa | `771,07` | `771,07` | ✅ |
| Condición de pago | `CONTADO` | `CONTADO` | ✅ |
| Comentario | `Test-PED-SMOKE-140810` | idéntico | ✅ |
| Línea / cantidad | 1.5LTS × 2 @ 3.238,50 | idéntico (`carrito.length=1`) | ✅ |
| **Descuento global** | `DESC 7 TEST` — 453,39 BS | `DESC 7 TEST` — 453,39 BS | ✅ |
| Totales | Base 6.477,00 · IVA 963,78 · **Total 6.987,39 BS / 9,06 USD** | idénticos | ✅ |

**Sin divergencias silenciosas.** Dos diferencias observadas al reabrir, ambas esperadas/cosméticas: (a) `#clienteSelect` pasa a `disabled=true` (comportamiento defensivo ya documentado en difranca); (b) el rótulo de agrupación del Tab Total cambia de `Línea: Desechable` a `Línea: Nombre de Linea` — el nombre de la línea no rehidrata. Cosmético, no afecta ningún dato ni monto.

---

## Registros creados en sistema

| Ref | epoch (`co_order`) | Cliente | Tipo / Lista | Detalle | Total | Estado | BD |
|-----|--------------------|---------|--------------|---------|-------|--------|-----|
| **1356** | `1786975326913.0` | MP GELATO C.A. (J-504863246) | **A · Pedido Factura** / lista `03` | 1.5LTS × 2 CAJA @ 3.238,50 · desc. global 7 % (453,39) · IVA 16 % | **6.987,39 BS / 9,06 USD** | **Enviado** | **BD-OK** |
| — | *(2.º pedido, tipo B)* | MP GELATO C.A. (J-504863246) | B · Pedido Nota / lista `02` | 5LTS × 1 | — | **Eliminado** (DM-PED-037) | n/a |

> El 2.º pedido se creó exclusivamente como insumo de DM-PED-037 y se borró en el mismo caso: no dejó rastro en la nube (nunca se envió).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El selector de DESCUENTO GLOBAL abre un `ion-alert` con radios, NO un `ion-popover`** | universal (candidato) | En el Tab Total, `mouse.click` sobre el `ion-select` "Descuento Global" abre un **`ion-alert`** cuyos `button` son `[SIN DESCUENTO, DESC 7 TEST, Cancelar, Aceptar]` — las opciones y los botones de acción **conviven en la misma lista**. `querySelectorAll('ion-popover')` devuelve `[]` y se lee como "el selector no abre". **Receta: `alertInfo()` → click en la opción por igualdad exacta → click en `Aceptar`** (2 clicks). ⚠ Es un alert de 4 botones ⇒ **jamás matchear por `includes`** (`/desc/i` matchearía "SIN DESCUENTO"). |
| 🔴 **El Tab Total agrupa por LÍNEA: los acordeones de producto están ANIDADOS dentro del acordeón de línea** | universal (candidato) | Jerarquía real: `ion-accordion[Total por unidad]` · `ion-accordion[Línea: X]` → dentro, un `ion-accordion` por producto. Los de producto nacen con **rect 0×0** (invisibles) hasta que se expande la línea. Un `querySelectorAll('ion-accordion').filter(visible)` devuelve **solo 2 nodos** y el `findIndex` del producto da **−1** ⇒ `Cannot read properties of undefined`. **Hay que expandir DOS niveles: línea primero, producto después.** Único fallo de la corrida (DM-PED-026, 2.º intento OK). |
| 🔴 **El trash del Tab Total sale a `y≈1003` con viewport 744** | confirma `[alipascua-20260804]` | Tras expandir los 2 niveles, el `ion-button[color=danger]` queda muy por debajo del fold. `scrollIntoView({block:'center'})` + **re-leer el rect** + validar `0<cy<innerHeight` → bajó a `y=703` y recalculó al 1.er click. Reconfirma que **un rect válido no es un punto clickeable**. |
| **El Tab General NO muestra sus 6 selects hasta que hay cliente** | universal (candidato) | Con `hasClient=false` el form trae **1 solo `ion-select`** (Empresa) y **1 solo `ion-input`** (`#clienteSelect`). Moneda, Dirección, Tipo de pedido, Lista de precios, Condición de pago, `#tasa`, `#nuPurchase`, `#naResponsible` y `#txComment` **aparecen recién al seleccionar cliente**. Mapear las VGs de cabecera antes de elegir cliente devuelve un mapa vacío y se lee como "el form no tiene esos controles". |
| **`app-pedidos-lista` SÍ repuebla al vaciar el buscador** | cliente / build | Contra `PRD-BUSCADOR-NO-REPUEBLA` (documentado como universal en 3 playas): acá vaciar el `ion-searchbar` devolvió la lista de 3 a **34 ítems** con empty-state = 0. El anti-patrón **no aplica a `app-pedidos-lista` en este build** — verificarlo antes de asumirlo. |
| ⚠ **Guardar NO deja el form pristine: el atrás siguiente dispara igual el dirty-guard** | cliente / build | Contra la nota `[gmp-2611][ins-2622][jerez-2026-07-06]` ("Guardar deja pristine → atrás sale directo"). Acá, tras el alert "Pedido Guardado", pulsar atrás volvió a mostrar el modal `¡Alerta!` de 3 opciones. **"Salir sin guardar" es seguro: el pedido ya Guardado persiste** (apareció en BUSCAR con Ref 0). No es FAIL, pero rompe la expectativa de navegación. |
| **El modal/selector de cliente de PEDIDOS viene ALFABÉTICO, no ordenado por deuda** | cliente | `selectorCliente.clientes` trae 50 de 61 arrancando en `AREPAS LA ORIGINAL` / `ASAOS GRILL` / `BACALAO VA BIEN`. **Contradice `[el_palmar-20260805]`/`[difranca-20260807]`** (`oderByDueDateAndSaldo`, morosos arriba). El objetivo `MP GELATO` cayó en el índice **43** ⇒ **0 rondas de `onIonInfinite`**. Regla que sigue valiendo: **paginar solo si `findIndex` falla**. |
| **Estructura del catálogo = 3.ª variante (DRILL-DOWN)** | confirma `[el_palmar-20260805][difranca-20260807]` | `ion-accordion-group=0` y `ion-accordion=0` en el nivel de categorías; el click en `ion-item.listaItems` **navega dentro** (las `listaItems` pasan a 0) y allí los productos **sí** son `ion-accordion`. **3.ª confirmación** de que la variante sigue al **build v1.0/db19**, no al servidor (Isla Coche + El Yaque ×2). |
| **Los `ion-accordion` de producto NO traen atributo `value`** | universal (candidato) | La receta `ion-accordion[value="<cod>"]` de `[latino_cosmetica-20260729]` **no aplica** acá (`value=null` en los 4). Vale el sellado **por descarte** de `[gmp-20260730]`: el único `ion-input[type=number]` con `height>0` y **sin `id`** es el del producto recién expandido → `el.id='qa-cant-<COD>'`. ⚠ Y el input **tampoco trae `label`**, así que la receta de difranca (localizar por `label==='Cantidad:'`) **falla**: hay que ir por `type=number` + `height>0` + `!id`. |
| **Parser de código en el ítem de producto** | confirma `[difranca-20260807]` | `textContent` corre pegado: `Código: 1.5LTSPrecio: 3.756,66 BS`. `/Código:\s*([A-Za-z0-9.\-]+?)\s*Precio/` funcionó al 100 % — ⚠ **incluir el punto `.` en la clase de caracteres**, o `1.5LTS` se trunca a `1`. |
| **Etiquetas de alert medidas en grupo_fiel** (leer, nunca predecir) | cliente | deuda vencida `[Cancelar, **Aceptar**]` · guardado `[**OK**]` · envío paso 1 `[Cancelar, **Aceptar**]`, pasos 2-3 `[**OK**]` · borrado desde lista `[Cancelar, **Aceptar**]` · dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]` · descuento global `[SIN DESCUENTO, DESC 7 TEST, Cancelar, **Aceptar**]`. Recorrer `['Aceptar','OK','Eliminar']` por igualdad exacta resolvió los **12 alerts del módulo sin un solo reintento**. |
| **Inventario se reserva en vivo (3.ª confirmación)** | confirma `[gmp-20260730][alipascua-20260804]` | Cargar 2 uds de 1.5LTS bajó `Inventario: 812 → 810` sin recargar. |
| ⚠ **`nuAmountDiscountConversion:0` con `nuAmountDiscount:453,39`** | cliente — a verificar | El payload trae `nuAmountDiscount: 453.39` pero `nuAmountDiscountConversion: 0`, mientras el par hermano sí convierte (`nuAmountGlobalDiscount: 453.39` → `nuAmountGlobalDiscountConversion: 0.588`). Ambos campos llegan así a la nube. **No afecta ningún total** (los totales cuadran al céntimo), pero es una conversión que queda en 0 debiendo valer 0,588. Candidato a defecto menor de conversión — **verificar en otra playa antes de levantarlo**. |
| ⚠ **`client.coPaymentCondition='CodCredito'` pero el form arranca en `CONTADO`/`CodContado`** | cliente — a verificar | El objeto cliente trae `idPaymentCondition:1` + `coPaymentCondition:"CodCredito"`, y la app resuelve por `idPaymentCondition` → `CONTADO`/`CodContado`. Parece un dato inconsistente en `client` (dos condiciones compartiendo `id=1`), no un defecto de la app. **No se marcó FAIL**; anotar para el equipo de datos. |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos

**Ningún FAIL.** Dos observaciones de severidad menor, ninguna bloqueante:

1. **S3 — `order.co_order_type` nunca se pobla** (985/985 pedidos NULL). La app envía el tipo solo como `idOrderType`; la columna denormalizada queda vacía. Sin pérdida de información (el tipo se recupera por `id_order_type`), pero rompe cualquier consumo que lea `co_order_type`. Ver Veredicto 1.
2. **S4 — `nuAmountDiscountConversion` viaja en 0** debiendo valer 0,588 (su hermano `nuAmountGlobalDiscountConversion` sí convierte). No afecta totales. Ver tabla de patrones.

**Observación de datos (no defecto de app):** `client_avg_product` con 25 códigos de cliente huérfanos (formato viejo `C000799` vs RIF `J-…`) ⇒ el pedido sugerido no tendría insumo aunque el botón existiera. La línea DESTACADOS existe pero con 0 productos marcados.

---

*Agente PEDIDOS · grupo_fiel · 2026-08-17 · 14/14 PASS · 0 cuelgues de CDP · estado final HOME*

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786975326913.0` (Ref 1356) | **BD-FIELD-OK** | 39/39 OK | `order_detail` 1/1 · `order_detail_unit` 1/1 | **0** | 4 (abajo) |

**Sin mismatches reales.** Todos los campos llenos del payload (cabecera, línea de producto y línea de unidad)
llegaron idénticos a la nube. No hizo falta reintento por sync: la nube ya tenía la fila en el primer intento.

**Notas (esperadas, ninguna es hallazgo nuevo):**

1. `da_order` — payload `2026-08-17 10:10:19` (local) vs nube `2026-08-17T14:10:19.000Z` (UTC): 4 h de diferencia
   = zona horaria UTC-4 ⇒ **nota**, no mismatch (regla §10.b).
2. `da_dispatch` — payload `2026-08-19T08:00:00` vs nube `2026-08-19T04:00:00.000Z`: misma causa, nota.
3. `co_order_type` **no aparece en el diff** porque el payload nunca envía esa clave (`idOrderType:4` sí,
   `coOrderType` no existe en el objeto capturado) ⇒ confirma que es un **NULL estructural** en la nube, no un
   mismatch. Al no estar en el payload, el motor payload-driven ni siquiera lo evalúa: no requiere calibración.
4. `nu_amount_discount_conversion` — payload `0`, nube `0.0000`: **coinciden**. Reconfirma la observación de
   negocio ya registrada (debería valer ~0,588 según el descuento global convertido), pero es un cálculo previo
   al envío, **no** un defecto de sincronización.

**Calibración:** ninguna nueva. El `fieldMap`/`ignore` del config `order` ya cubre este caso
(`co_address_client`/`id_address_client` renombrados, `id_order_creator` ignorado). No se detectaron campos del
payload sin columna en nube ni columnas extra sin mapear.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.

> 🔧 **Nota de herramienta (para futuras corridas):** `cotejo-payload.js` necesita el registro **completo**
> `{url, data}` del `_payloads.jsonl`, no solo el `data` — detecta el tipo de transacción por el `url`. Pasarle
> solo `data` devuelve un falso `BD-N/A "no se pudo determinar el tipo"`.
