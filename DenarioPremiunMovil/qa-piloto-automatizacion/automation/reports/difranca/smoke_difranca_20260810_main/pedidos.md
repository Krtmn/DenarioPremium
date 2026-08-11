# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | PEDIDOS |
| App | `com.kiberno.denarioPremiumPro` — app v1.0 / db19 · `window.ng=TRUE` · `sqlitePlugin` OK |
| Build | **main**, commit `99b138fa` |
| Playa / tenant | EL YAQUE · difranca |
| Empresas usadas | **DDHP_A12 (id 2)** · DHVITAL01_A (id 4) |
| Vendedor | VEND206 / `co_user='206'` / `id_user=275` |
| Resultado | **14 PASS · 0 FAIL · 0 BLOCKED · 0 N/A** (+ **2 hallazgos** fuera del set de casos) |

> ⚠ El encabezado de `difranca.yaml` ("GO/NO-GO AL TAG 20") **no aplica**: esta corrida es cacería de
> defectos nuevos en `main` antes del tag de la 21. El resto del YAML sí se usó.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Home de Pedidos con `PEDIDO`/`BUSCAR`/`COPIAR` (`ion-button.colorBorderBuscar`) |
| DM-PED-002 | ✅ PASS | Tabs Pedido/Total/Adjunto `disabled` + `segment-button-disabled`; `lockSegments=true`; sin cliente |
| DM-PED-006 | ✅ PASS | `setClientfromSelector(CAR755)` → alert `Pedidos / Este cliente tiene deuda vencida…` **[Cancelar, Aceptar]** → `lockSegments=false`, 4 tabs habilitadas |
| DM-PED-015 | ✅ PASS | Tab Pedido lista 7 líneas (badges suman 450); drill-down a Pasarela lista productos con precio/inventario/unidad |
| DM-PED-017 | ✅ PASS | Cantidad por `ion-input[label="Cantidad:"]`; carrito 1→2→3; inventario se reserva en vivo (64→61, 726→719, 58→56) |
| DM-PED-024 | ✅ PASS | Tab Total con **ambas monedas** (`multiCurrencyOrder=true`): US$ 340,84 / BSD 256.342,36 |
| DM-PED-026 | ✅ PASS | Trash del ítem ACPMNY300 recalcula: 340,84 → **208,12 US$** y 256.342,36 → **156.524,97 BSD** |
| DM-PED-029 | ✅ PASS | Sin ítems: `imagenGuardar` y `imagenEnviar` ambos `disabled=true` |
| DM-PED-030 | ✅ PASS | Alert `Denario / Pedido Guardado` **[OK]**; comentario `Test-PED-SMOKE-132200` |
| DM-PED-031 | ✅ PASS | 3 alerts → **"Pedido nro. 39798 enviado exitosamente"**; navega a `/pedidos` |
| DM-PED-032 | ✅ PASS | Form sucio + `img.fechaAtras` → modal `¡Alerta!` **[Guardar y salir, Salir sin guardar, Cancelar]**; Cancelar mantiene el form |
| DM-PED-034 | ✅ PASS | Searchbar de `app-pedidos-lista`: **81 → 1** ítem filtrando `39800`, y es el correcto |
| DM-PED-035 | ✅ PASS | Reabre Guardado con 4 tabs; **round-trip §9 OK**: comentario, tasa 752,09, moneda BSD, totales 10.950,4304/14,56 intactos |
| DM-PED-037 | ✅ PASS | Alert `¿Seguro que quieres eliminar este pedido?` **[Cancelar, Aceptar]** → lista **81 → 80**, Ref 0 desaparece |

---

## 🔴 LA ARITMÉTICA, PASO A PASO

**Tasa que usa el pedido (leída de `ion-input#tasa`, no supuesta): `752,09` BSD = 1,00 US$** en los
tres pedidos móviles. `readonly=true`, `disabled=false` ⇒ coherente con `enabledManualRate=false` +
`canChangeRate=false`. Tolerancia aplicada: 0,01.

### Pedido 39798 — DDHP_A12 · CAR755 · moneda **US$** · lista 6 "Precio 01"

| Línea | Precio (BD `price_list.nu_price`) | Cant. | Precio × Cant. | Conversión (× 752,09) |
|---|---|---|---|---|
| ACPDT300 | 58,08 | 3 | **174,24** | 174,24 × 752,09 = **131.044,1616** |
| ACPDT300U | 4,84 | 7 | **33,88** | 33,88 × 752,09 = **25.480,8092** |
| ~~ACPMNY300~~ | 66,36 | 2 | ~~132,72~~ | ~~99.817,3848~~ (eliminada — DM-PED-026) |

- Base = 174,24 + 33,88 = **208,12 US$**
- Descuento por producto = **0** · Descuento global = **0** · IVA = **0**
- Total = **208,12 US$**
- Conversión total = 208,12 × 752,09 = **156.524,9708 BSD** (UI muestra 156.524,97)
- **BD nube:** `nu_amount_total_base` = `nu_amount_total` = `nu_amount_final` = `208,1200`;
  `nu_amount_*_conversion` = `156524,9708`; `nu_amount_tax=0`; `nu_amount_global_discount=0`. ✅ exacto.
- Antes del trash (3 líneas): 340,84 US$ / 256.342,3556 BSD — también exacto.

### Pedido 39800 — 55 líneas · DDHP_A12 · CAR755 · **US$**

- Σ de los 55 `precio × 1` = **1.925,82 US$** (suma verificada término a término)
- Conversión = 1.925,82 × 752,09 = **1.448.389,9638 BSD**
- **BD nube:** `nu_details=55`, `order_detail`=55, `order_detail_unit`=55,
  `Σ nu_amount_total`=1.925,8200 = cabecera, `Σ nu_amount_total_conversion`=1.448.389,9638. ✅ exacto.

### Pedido Guardado en **BSD** (creado y luego borrado en DM-PED-037)

- ACBA300U: precio mostrado **2.737,6076 BSD** = 3,64 × 752,09 ✅
- 2.737,6076 × 4 = **10.950,4304 BSD**; conversión = **14,56 US$** = 3,64 × 4 ✅
- ⇒ la conversión cierra **en los dos sentidos** (pedido en US$ → BSD y pedido en BSD → US$).

### Conversión del catálogo (A/B con la misma lista, sólo cambiando la moneda)

| Producto | `nu_price` US$ | Mostrado en BSD | `nu_price` × 752,09 |
|---|---|---|---|
| ACPDT300 | 58,08 | 43.681,39 | 43.681,3872 ✅ |
| ACPDT300U | 4,84 | 3.640,12 | 3.640,1156 ✅ |
| ACPMNY300 | 66,36 | 49.908,69 | 49.908,6924 ✅ |

**Veredicto de cálculo:** precio × cantidad, totales y conversión son **exactos en los 3 pedidos y en
el catálogo**, en ambas monedas, dentro de 0,01. **La única aritmética incorrecta hallada es el factor
de unidad — ver Hallazgo 1.**

### Descuento global — dato de control pedido por QA

**Valor crudo: `0`, en todas partes.** `orderServ.dctoGlobal = 0`, `totalGlobalDc = 0`,
`totalGlobalDcConv = 0`, `totalDctoXProducto = 0`; en BD `nu_amount_global_discount = 0.0000` y
`nu_amount_total_product_discount = 0.0000` en **los 3 pedidos**. El móvil **no** inventa descuento
global. VGs efectivas leídas del componente: `userCanSelectGlobalDiscount=false`,
`userCanSelectProductDiscount=false` (el panel de línea no trae "% Descuento"),
`userCanSelectIVA=false`. Cliente CAR755 `quDiscount=0`.

### IVA

`orderIVA = 0` y `nu_amount_tax = 0.0000` en los 3 pedidos. Es **correcto por dato**: los productos
usados tienen `product.nu_tax = 0.0000` y en BD `order_detail` no tiene ninguna línea gravada. No es
observable en este cliente ⇒ los defectos `PED-IVA-*` no se pueden ejercitar acá.

---

## 🔴 LA TASA: 752,09 (móvil) vs 721,35 (web) — respondido con datos

El móvil **NO** toma la tasa corrupta.

- **Origen confirmado en BD:** `conversion_type` tiene **3 filas con `date_conversion` en el año 2056**
  y `nu_value_local = 721.3500`, una por empresa activa:
  `id 3447` DHVITAL01_A (2056-07-25), `id 3443` DIF_A12 (2056-07-25), `id 3445` DDHP_A12 (2056-07-25).
  La vigente real es `nu_value_local = 752.0900` con `date_conversion = 2026-08-04`.
- **Contraste directo, mismo cliente y misma empresa, con 20 minutos de diferencia:**

| Pedido | Origen | Tasa efectiva | Cómo se comprueba |
|---|---|---|---|
| **39797** | web / manual QA (`tx_comment: "Pedido de prueba QA main 20260810 - no despachar"`) | **721,35** | 2.625,714 / 3,64 = 721,35 · 916,1145 / 1,27 = 721,35 · 14.289,9435 / 19,81 = 721,35 |
| **39798** | **móvil, esta corrida** | **752,09** | 43.681,3872 / 58,08 = 752,09 · 156.524,9708 / 208,12 = 752,09 |

⇒ **El defecto de `max(date_conversion)` es de la capa web.** El móvil resuelve por la tasa vigente en
las 3 corridas medidas hoy. No hay que escalar la gravedad por el lado móvil.

---

## 🔴 HALLAZGO 1 — `PED-UNIDAD-PRECIO-SIN-FACTOR` (dinero · severidad ALTA · llegó a la nube)

**El factor `product_unit.qu_unit` se aplica a la CANTIDAD pero no al PRECIO.**

Producto **CHBK300** (CHAMPU BBK LLUVIA DE KERATINA 300 MLX12), empresa DHVITAL01_A, lista 16,
`price_list.nu_price = 43,68 US$`, `product_unit`: fila `CAJAS` y fila `UNID` con **`qu_unit = 12`**.

Pasos:
1. Con unidad **CAJAS**, cargar cantidad **2** → Tab Total **87,36 US$** = 43,68 × 2 ✅ correcto.
2. Cambiar el select **Unidad** de la línea a **UNIDADES** (el select llega habilitado):
   - el panel **sigue mostrando `Precio: 43,68 US$`** (no se divide por 12),
   - el **Inventario pasa de 573 a 47** (573/12 — invertido: en unidades debería haber *más*, no menos),
   - la línea del carrito queda con **`quAmount = 0`** mientras el Tab Total **sigue mostrando 87,36**.
3. Volver a cargar cantidad **2** (ahora en UNIDADES) → badge de la línea **26** (= 2 cajas × 12 + 2) y
   `totalBase` salta a **1.135,68 US$** = 26 × 43,68. **13× por agregar 2 unidades.**

**Prueba definitiva en la nube (pedido 39799, `order_detail_unit`):** la misma línea tiene dos filas de
unidad, **con el mismo `qu_order = 2` y el mismo `nu_price_base = 43,68`**, pero:

| `co_product_unit` | `qu_order` | `nu_base_total` | Esperado |
|---|---|---|---|
| `CHBK300CAJAS` | 2 | **87,36** | 87,36 ✅ |
| `CHBK300UNID` | 2 | **1.048,32** | 2 × (43,68/12) = **7,28** ❌ |

1.048,32 = 43,68 × 24 ⇒ sobreprecio **144×** (12 de cantidad × 12 de precio) en esa sub-línea.
Cabecera guardada: `nu_amount_final = 1.135,68 US$` / `nu_amount_final_conversion = 854.133,5712 BSD`.
**El dato malo se envió y persistió en la nube.**

- **Alcance en difranca:** sólo la empresa **DHVITAL01_A (id 4)** tiene `qu_unit ≠ 1`
  (5 productos ×12, 2 ×10, 17 ×0,1). En **DDHP_A12 (id 2), las 453 filas de `product_unit` tienen
  `qu_unit = 1,0000`** ⇒ la empresa recomendada para el smoke **no puede reproducirlo**. Por eso hubo
  que salir a la empresa 4 a propósito.
- ⚠ El pedido 39799 quedó **enviado con el monto inflado**: conviene anularlo desde el administrativo.

## 🔴 HALLAZGO 2 — `PED-CATALOGO-CORTO-EN-PEDIDO` (bloqueante para vender)

**El selector de productos DEL PEDIDO también corta el listado, y la hipótesis "es que no tienen stock"
NO alcanza a explicarlo.**

Medición dentro del pedido (empresa DDHP_A12, lista 6, moneda US$), paginando con `onIonInfinite` +
`ng.applyChanges` hasta `scrollDisable === true`:

| Línea | Badge UI | BD: con precio en lista 6 | Alcanzados en el pedido | Inalcanzables | Cortó en |
|---|---:|---:|---:|---:|---|
| Pasarela | 185 | 158 | **153** | 5 | `page=4` |
| BBK | 114 | 106 | **83** | 23 | `page=2` |
| HD Cosmetics | 118 | 101 | **71** | 30 | `page=2` |

Patrón: la app **apaga el scroll infinito en cuanto una página vuelve con menos de 50 ítems**, tratando
una página corta como fin de datos. En Pasarela las páginas venían llenas (50+50+50+3) y por eso llegó
casi hasta el final; en BBK y HD cortó en la 2.ª página. **El pedido llega bastante más lejos que el
módulo PRODUCTOS** (allí se reportó BBK 93, HD 84, Pasarela 90), pero **no llega a todo**.

### Respuesta concreta a la hipótesis de la QA (con código en mano)

De los **53** productos con precio inalcanzables (23 BBK + 30 HD), **43 efectivamente no tienen stock**
— ahí la hipótesis acierta. Pero **10 sí tienen inventario real**:

| Código | Nombre | Precio (lista 6) | Inventario | Filas en `stock` |
|---|---|---:|---:|---:|
| **BCBA500U** | Baño de Crema BBK Óleo de Argán 500gr | 103,44 US$ | **2.816** | 14 |
| **BCBG500U** | Baño de Crema BBK Gold 500gr | 103,44 US$ | **2.046** | 15 |
| **BCBC500U** | Baño de Crema BBK Óleo de Coco 500gr | 103,44 US$ | **133** | 18 |
| **CHHCA240U** | Champú HD Cacao 240ml | 1,12 US$ | **135** | 20 |
| **CHHS240U** | Champú HD Sábila 240ml | 1,12 US$ | **91** | 17 |
| **JHCI180U** | Loción Jabonosa HD Cítricos 180ml | 0,72 US$ | **91** | 15 |
| **CPHLL240U** | Crema para Peinar HD Lima Limón 240cm3 | 2,25 US$ | **51** | 19 |
| **BCBC1000U** | Baño de Crema BBK Óleo de Coco 1kg | 37,30 US$ | **16** | 8 |

⇒ **Tienen precio Y existencia y el vendedor no puede llegar a ellos desde el pedido: es bloqueante
para vender.** La hipótesis del stock queda **parcialmente refutada** — explica 43 de 53, no los 10 de
arriba. Caso servido para desarrollo.

**Sobre los dos códigos que traía el agente de PRODUCTOS:** **`MABBKA30` y `DPB30U` SÍ son alcanzables
desde el pedido** (aparecen en las listas de BBK y de Pasarela respectivamente) ⇒ el corte **no es el
mismo** en PRODUCTOS y en PEDIDOS; hay que tratarlos como dos síntomas del mismo mecanismo, no como
un único listado.

**Nota aparte (mismo mecanismo, otra empresa):** en **DHVITAL01_A** 7 de 12 líneas con badge > 0
devolvieron **0 productos** al entrar (BBK 27→0, HD Cosmetics 18→0, KERADIAMOND 38→0, PASARELA 40→0,
INSUMOS 22→0, ESMALTES 4→0, GASTOS DE MARKETING 1→0); sólo `PRODUCTO TERMINADO 301→220` listó. No se
profundizó (la empresa 4 no es la del smoke) — **queda anotado para verificar**.

---

## Prueba de carga: 55 líneas (seguimiento del reporte "más de 50 productos cuelgan la app")

**No se reprodujo el cuelgue. Curva plana, sin degradación, y el pedido se envió.**

| Tramo | Medición |
|---|---|
| Líneas 1-25 | 2.044 – 2.197 ms por línea (media ≈ 2.085) |
| Líneas 26-50 | 2.072 – 2.284 ms por línea |
| **Líneas 51-55 (pasado el "límite")** | **1.836 – 1.900 ms — las más rápidas de las 55** |
| Fallos al agregar | **0 de 55** |
| Render del Tab Total con 55 líneas | **2.653 ms** |
| **Guardar** (55 líneas) | **720 ms** |
| **Enviar** (click → alert "enviado exitosamente") | **7.294 ms** |

- No hubo crash, ni ANR, ni pérdida de estado. El pedido **39800** llegó íntegro (55/55 líneas).
- ⚠ **Dato contraintuitivo que corrige la nota de la corrida del 07/08:** allí se midió
  "Guardar (~4,9 s) pesa más que Enviar (773 ms)". Acá pasó **al revés y sin relación con el tamaño**:
  Guardar tardó **6.351 ms con 2 líneas** y **720 ms con 55**. El coste de Guardar **no escala con el
  número de líneas**; parece dominado por otra cosa (probablemente el primer acceso a SQLite de la
  sesión). No usar "Guardar es caro" como regla.
- ⇒ Se **confirma la refutación** del reporte de campo: el "50" no es un umbral del carrito.

---

## Verificación BD (RUNTIME §10)

**Baseline `order` = 16.560 filas.** Diff por `da_created >= 2026-08-10`: **4 pedidos nuevos**, de los
cuales **3 son míos**.

| Ref (`id_order`) | Empresa | Cliente | Moneda | Líneas | `nu_amount_final` | Conversión | Marca |
|---|---|---|---|---:|---:|---:|---|
| 39797 | DDHP_A12 | CAR755 | BSD | 2 | 14.289,9435 | 19,8100 | **AJENO** — web/manual QA, tasa 721,35 |
| **39798** | DDHP_A12 | CAR755 | US$ | 2 | 208,1200 | 156.524,9708 | **BD-OK** |
| **39799** | DHVITAL01_A | CAR003 | US$ | 1 | 1.135,6800 | 854.133,5712 | **BD-OK** (monto inflado por Hallazgo 1) |
| **39800** | DDHP_A12 | CAR755 | US$ | 55 | 1.925,8200 | 1.448.389,9638 | **BD-OK** |

- **Local (`sqlitePlugin`)**: los 3 con `id_order > 0` y `st_delivery = 1`;
  `pending_transactions (type='order') = 0`; `failed_transactions = 0`; sin duplicados.
- **Correlación confirmada otra vez:** Nro.Ref de la UI = `id_order` del servidor (39798/39799/39800).
- **Sync a nube: INMEDIATA** en pedidos (confirma la nota del 07/08; contrasta con devoluciones).
- Hook de payload: **1 solo POST** `orderservice/order` por envío, sin duplicados (se consumió
  `__qaH.getPayloadData()` heredado, sin reinstalar el bundle).
- Un 4.º pedido se creó Guardado (`Test-PED-SMOKE-134323-GUARDADO`, BSD, 10.950,4304) y se **borró** en
  DM-PED-037 ⇒ correctamente **no** aparece en la nube.

### Cliente de dos filas por moneda — verificado

CAR755 existe **dos veces** en `client`: `id_client=838` (DDHP_A12, `US$`, `id_list=6`, límite
3.008.377,20) y `id_client=2235` (DIF_A12, `USD`, `id_list=11`, límite 2.256.282,90). **La app tomó la
fila correcta**: los 3 pedidos de la empresa 2 guardaron `id_client=838` y `co_currency='US$'` (nunca
`USD`). El selector de moneda del pedido ofrece sólo `[BSD, US$]` en la empresa 2 ⇒ no hay forma de
cruzarlas desde la UI. **Sin defecto por este lado.**

### Saldos y crédito (fix de saldos venido de globalmp)

- El modal de cliente trae `saldo1 = 47.023.577,3883` (BSD) y `saldo2 = 62.523,87` (US$).
  **47.023.577,3883 / 62.523,87 = 752,09 exacto** ⇒ los dos saldos son coherentes entre sí y con la
  tasa del pedido. **El fix no rompió los saldos de este cliente.**
- **No se reproduce acá el defecto de CLIENTES (752×):** el Tab Total muestra sólo
  `Límite de Crédito: 3.008.377,20`, que es el `client.nu_credit_limit` crudo de BD, **sin restar nada**.
  No hay línea "Crédito Disponible" en el pedido ⇒ el cálculo defectuoso no se ejerce en este módulo.
- ⚠ **Observación menor (no FAIL):** ese `Límite de Crédito` se imprime **sin símbolo de moneda**, al
  lado de un total en US$, siendo un valor que en BSD equivale a ≈ 4.000 US$ (3.008.377,20 / 752,09 =
  4.000,02). Un vendedor puede leer "3 millones de límite" para un cliente de 62.523,87 US$ de deuda.
  Vale confirmarlo con QA/negocio.

---

## VGs efectivas leídas del componente (`orderServ`) — contra el YAML

Leerlas del componente resuelve de una pasada, sin provocar el comportamiento:

| VG | YAML | Medido en `main` | Nota |
|---|---|---|---|
| `userCanSelectGlobalDiscount` | false | **false** | ✅ |
| `userCanSelectProductDiscount` | false | **false** | ✅ el panel de línea no trae "% Descuento" |
| `userCanSelectIVA` | false | **false** | ✅ |
| `userCanChangePriceList` | false | **false** | ✅ select "Precio 01" `disabled` |
| `userCanChangePaymentConditions` | false | **false** | ✅ select `disabled` |
| `userCanChangeWarehouse` | false | **false** | ✅ select "Almacén" presente pero `disabled` |
| `multiCurrencyOrder` | true | **true** | ✅ Tab Total muestra US$ **y** BSD (≠ otros clientes) |
| `orderEnterpriseEnabled` | true | **true** | ✅ selector habilitado, `value` = OBJETO empresa |
| `stock0` / `hideStock0` / `validStock` | true/false/false | **true/false/false** | ✅ productos con Inventario 0 se listan y se piden |
| `quUnitDecimals` | false | **false** | ✅ cantidades enteras |
| `validateNuOrder` | false | **false** | ✅ `#nuPurchase` no `required`; tabs habilitan sólo con cliente |
| `requiredCommentOrder` | (no existe) | **false** | ✅ Guardar/Enviar habilitan con comentario vacío |
| **`validateWarehouses`** | **false** ("CONFIRMADA EN UI 2026-08-07") | 🔴 **true** | **el YAML quedó desactualizado en `main` — corregir** |
| `showCreditLimit` | true | **true** | Tab Total muestra "Límite de Crédito" |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **39798** | DDHP_A12 · CAR755 · US$ · 2 líneas · 208,12 US$ / 156.524,97 BSD · `Test-PED-SMOKE-132200` | **Enviado** (BD-OK) |
| **39799** | DHVITAL01_A · CAR003 · US$ · 1 línea · 1.135,68 US$ · **monto inflado (Hallazgo 1)** | **Enviado** (BD-OK) ⚠ anular |
| **39800** | DDHP_A12 · CAR755 · US$ · **55 líneas** · 1.925,82 US$ / 1.448.389,96 BSD · `Test-PED-SMOKE-134038-55L` | **Enviado** (BD-OK) |
| — | `Test-PED-SMOKE-134323-GUARDADO` · BSD · 10.950,4304 BSD | **Borrado** en DM-PED-037 |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **La moneda del pedido arranca en la LOCAL (BSD) aunque la empresa y el cliente sean US$** | universal candidato | Form nuevo: `monedaSeleccionada.coCurrency='BSD'` con `empresaSeleccionada.coCurrencyDefault='US$'` y cliente `coCurrency='US$'`. **Anotar siempre con qué moneda se arma el pedido**: la app convierte bien, pero el pedido queda registrado en la moneda que quedó puesta. |
| **`orderServ` es el mapa completo de VGs del módulo, sin tocar el DOM** | universal | `ng.getComponent(document.querySelector('app-pedido')).orderServ` expone ~45 flags booleanos (`userCanSelect*`, `stock0`, `validateWarehouses`, `multiCurrencyOrder`, `quUnitDecimals`…) **más** todos los totales (`totalBase`, `totalBaseConv`, `dctoGlobal`, `orderIVA`, `finalPedido*`). Serializar sólo los valores planos (los objetos traen servicios y revientan por estructura circular). **Es la forma barata de auditar VGs y aritmética en una sola llamada.** |
| **Cortar la paginación del catálogo por `scrollDisable`, y registrar en qué `page` cortó** | universal | `productos-tab-order-product-list` expone `page`/`scrollDisable`. Guardar el `page` de corte es lo que distingue "no hay más" de "cortó antes de tiempo": Pasarela cortó en `page=4` con 153, BBK y HD en `page=2` con 83 y 71. |
| **Al cambiar de EMPRESA, `monedaSeleccionada` NO se refresca** | cliente (verificar) | Tras pasar de DDHP_A12 a DHVITAL01_A, `monedaSeleccionada` seguía con `coEnterprise:"DDHP_A12", idEnterprise:2`. Se corrige recién al elegir la moneda a mano. No produjo daño (el pedido guardó la empresa correcta) pero es estado obsoleto. |
| **El selector de clientes SÍ filtra por empresa** | cliente | Con DHVITAL01_A el `selectorCliente` trajo **1** cliente (CAR003), el único asignado en esa empresa. **Matiza la nota del 07/08** ("296 clientes, no filtrado"): con la empresa 2 trae 50 en la 1.ª página de 148. |
| **Tras Guardar, el back SÍ dispara el dirty-guard** | cliente (contradice doc) | `module-selectors/pedidos.md` dice "Guardar deja el form pristine → atrás sale directo SIN modal". En `main` el modal `¡Alerta!` de 3 botones apareció igual tras Guardar. **No es FAIL** (defensivo), pero hay que manejarlo: salir con **"Salir sin guardar"** por igualdad exacta (nunca `includes('salir')`, que matchea "Guardar y salir"). |
| **1.er click del back puede caer en un `ION-BACKDROP` residual** | universal | `elementFromPoint` sobre `img.fechaAtras` devolvió `ION-BACKDROP` y el click no navegó; el 2.º intento dio `IMG` y funcionó. **Diagnosticar con `elementFromPoint` y reintentar una vez** antes de dar el back por colgado. |
| **Etiquetas de alert medidas en `main`** | cliente | deuda vencida `[Cancelar, Aceptar]` · guardado `Denario / Pedido Guardado` `[OK]` · envío paso 1 `[Cancelar, Aceptar]`, pasos 2 y 3 `[OK]` · borrado `[Cancelar, Aceptar]` · dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]`. Todas en formato normal (no MAYÚSCULAS) en esta corrida. |
| **El envío puede dar 3 alerts con el 3.º tardío** | universal | El paso 3 ("Pedido nro. X enviado exitosamente") llegó a +7,3 s del click en un pedido y **después** de una espera de 4 s en otro (se leyó como "sólo 1 alert"). **Esperar por `waitForFunction` sobre el alert visible, no por `waitForTimeout` fijo**, o se reporta un envío exitoso como incompleto. |
| **`product_unit` con `qu_unit ≠ 1` es dato raro: hay que ir a buscarlo** | cliente | En difranca sólo la empresa 4 lo tiene. Consulta previa obligatoria antes de prometer el caso: `SELECT id_enterprise, qu_unit, count(*) FROM product_unit WHERE co_operation<>'D' GROUP BY 1,2`. |
| **Discriminador de producto ausente del catálogo = no tener NINGUNA fila en `stock`** | cliente | Un producto con fila `stock` en 0 **sí** se lista (`ACPKC480`, "Inventario: 0", pedible por `stock0=true`); uno sin ninguna fila **no** aparece. En la lista 6 son 28 productos. Distinto del corte por paginación del Hallazgo 2. |

---

## Notas de disciplina

- Ningún caso consumió más de 2 intentos acotados. **0 BLOCKED, 0 cuelgues de CDP.**
- No se hizo login ni se cambió de usuario en ningún momento.
- Todas las etiquetas de alert se **leyeron** y se clickearon por **igualdad exacta en minúsculas**.
- Los dos hallazgos se contrastaron contra `automation/defectos-conocidos.yaml`: **ninguno de los dos
  está registrado** (los `PED-IVA-CONV-DIV-CANTIDAD` y `PED-IVA-LINEA-NULL` son de IVA, que en difranca
  es estructuralmente 0, y son de la 20).
- Dispositivo devuelto a **HOME**, sin alerts ni modales abiertos.
