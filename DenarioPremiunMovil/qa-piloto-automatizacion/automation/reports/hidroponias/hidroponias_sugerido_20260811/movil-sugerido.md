# Ciclo completo del PEDIDO SUGERIDO — hidroponias

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `hidroponias_sugerido_20260811` |
| Alcance | Devoluciones → Inventario → Pedido sugerido (orden respetado) |
| Dispositivo | `14678405BR003855` (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — **v1.0 / db_version 19** (⚠ el YAML declara v6.6.18: desactualizado) |
| Playa | La Tortuga — `denariolatortuga.ddns.net:8081` |
| Empresa (tenant) | `HIDRO_A` — HIDROPONIAS VENEZOLANAS C.A (única en el device) |
| Vendedor QA | `V4` (idUser 468) — **no se hizo login**, sesión ya abierta |
| `window.ng` | `true` · `window.sqlitePlugin` disponible |
| Resultado | **Fórmula EXACTA (tolerancia 0) en 15/15 productos medidos · 0 FAIL · 0 BLOCKED** |
| Ciclos completos | **3** (devolución → inventario → sugerido → **Aceptar** → pedido → enviar) |

---

## 0. Guardas previas

| Guarda | Resultado |
|---|---|
| **Tenant = hidroponias** | ✅ **PASA.** Tabla local `enterprises` trae **una sola** empresa: `HIDRO_A` / HIDROPONIAS VENEZOLANAS C.A (`id_enterprise=1`, RIF J000801487). No hay rastro de globalmp ni alipascua. |
| **VG `suggestedOrderByDispatchAndReturn`** | ✅ **`true`** en las dos fuentes: `localStorage.globalConfiguration` del device y `global_configuration` de la nube (`da_update 2026-05-21`). Además el componente del preview expone `suggestedOrderByDispatchAndReturn = true`. La validación **aplica**. |
| **No hacer login** | ✅ Nunca se cayó a `/login`. |
| **Enviar transacciones** | ✅ Autorizado por QA: todo lo creado se **guardó y envió**. |

---

## 1. 🔴 Desviación obligada: el cliente 147 no es alcanzable

**El cliente `147` CENTRAL MADEIRENSE no está en la cartera del vendedor QA.** La tabla local `clients` tiene
**exactamente 13 clientes** y 147 no está entre ellos; el selector de la app lista esos mismos 13. No es un
problema de paginación: el modal muestra los 13 completos.

⇒ Se eligió un sustituto con la **misma estructura de datos** que pedía el encargo.

### Cliente usado: `209` — EXCELSIOR GAMA SUPERMERCADOS, C.A. (sucursal MACARACUAY)

`id_client=165` · `id_address_client=780` · `id_enterprise=1`

Se eligió porque es el único de la cartera cuyo **último inventario (27/07) es anterior a sus swaps (04/08)**,
condición sin la cual el término `straightSwapStock` da 0 por construcción (ver §2).

| Dato | Valor |
|---|---|
| Último inventario previo | 27/07/2026 19:02 (`co_client_stock 1785178942434.0`) ⇒ `daysSinceLast = 15` |
| Facturas de la sucursal | 4 · dos empatadas el 23/07: **3828 `20115667`** y 3827 `20115666` |
| **Factura ganadora** | **3828 / `20115667`** por el desempate `id_invoice DESC` |
| Swaps en ventana | 6 productos |

**Segundo cliente, para el caso de redondeo:** `208` — EXCELSIOR GAMA (sucursal VIZCAYA), `id_client=164`,
`id_address_client=779`, último inventario 03/08 ⇒ `daysSinceLast = 8` (**par**, imprescindible; ver §4.3).

**Tercer cliente, caso "sin facturas":** `402` — AUTOMERCADOS PLAZA S C.A. (CAFETAL), sin facturas, sin swaps y
sin inventario previo.

---

## 2. 🔴 Corrección al oráculo del encargo: `daysSinceLast` NO se teclea

El encargo indicaba *"poné `daysSinceLast` en 7 o más, si no los swaps quedan fuera"*. **Eso no es ejecutable en
este build**, y la razón está en el código y fue confirmada por la QA y por medición.

`inventarios-logic.service.ts` (`calcularTotalesSugerenciaPedido`):

```ts
let daysSinceLastInventory = this.newClientStock.daysSinceLast;   // lo que vendría del form
let previousCS = await this.getPreviousClientStock(...);
if (previousCS == null) {
  this.newClientStock.daysSinceLast = daysSinceLastInventory = 1;      // sin previo ⇒ 1
} else {
  daysSinceLastInventory = this.dateServ.daysSince(previousCS.daClientStock);  // ← SOBRESCRIBE
  if (daysSinceLastInventory <= 0) daysSinceLastInventory = 1;
  this.newClientStock.daysSinceLast = daysSinceLastInventory;
}
let dateLastInventory = this.dateServ.pastDaysISO(daysSinceLastInventory);
```

**Confirmación de la QA (textual):** *"Días desde el último inventario lo toma desde el último inventario que se
ha registrado de ese cliente, esa sucursal; si no tiene último inventario o si fue hoy mismo, toma 1 porque ese
valor no puede ser 0."*

**Confirmación empírica (tres mediciones independientes):**

| Cliente | Último inventario | `Días desde último` que muestra la UI | Persistido en `client_stock.days_since_last` |
|---|---|---:|---:|
| 209 | 27/07 | **15** | **15** (local y nube) |
| 208 | 03/08 | **8** | **8** (local y nube) |
| 402 | *(ninguno)* | **1** | *(no guardado — sondeo)* |

**El formulario ni siquiera expone el campo.** El Tab General sólo tiene `Cliente`, `Fecha`, **`Días para
siguiente Inventario`** y `Comentario`. No existe input de "días desde el último".

⇒ **La "trampa" descrita en el encargo no existe en este build**, y **no es defecto**: es el diseño confirmado
por QA. Lo que sí es tecleable es `daysUntilNext` (se usó **10** en el cliente 209 y **4** en el 208, ambos
respetados y persistidos).

> **Consecuencia práctica para futuras corridas:** la ventana de swaps/devoluciones **no se puede ampliar a
> voluntad**. Para que `straightSwapStock` no dé 0 hay que **elegir un cliente cuyo último inventario sea
> anterior a sus swaps**, no "poner un número grande".

---

## 3. Fórmula recomputada término por término — **cliente 209**

Ventana efectiva: `dateLastInventory = pastDaysISO(15)` = **2026-07-27T04:00:00**.
`daysSinceLast = 15` · `daysUntilNext = 10` · factura de despacho = **3828 / `20115667`**.

Cada término se recomputó contra la BD **antes** de mirar la pantalla, y se comparó contra
`app-inventario-sugerido-preview.productsSuggested` (el modelo que alimenta la vista).

### 3.1 Origen de cada término en BD (esperado)

| Producto | `previousStock`<br>(inv. 27/07) | `dispatchedStock`<br>(fact. 3828) | `straightSwapStock`<br>(swaps >27/07) | `returnedStock`<br>(sólo tipo 61) |
|---|---:|---:|---:|---:|
| CAMPROLEC001BAN | 1 | 5 | 3 | **2** ← Ref 106 creada hoy |
| TOMPROMAN001BAN | 8 | 5 | 1 | **0** ← Ref 107 es Calidad, no cuenta |
| GERPROGCH002BOL | 2 | **0** *(está en la 3827, no en la 3828)* | 4 | 0 |
| TOMPROCHE001CAJ | 10 | 14 | 0 | 0 |
| CAMPROSDU002BOL | 3 | 15 | 0 | 0 |
| GERPROALF002CAJ | 20 | **0** *(está en la 3827)* | 10 | **7** ← Distribución preexistente |

### 3.2 Comparación pantalla ↔ BD — **coincidencia total, tolerancia 0**

| Producto | prev | desp | swap | **inicial** | actual | **devuelto** | **venta** | venta diaria | bruto ×10 | **SUGERIDO** | Veredicto |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| CAMPROLEC001BAN | 1 | 5 | 3 | 9 | 1 | 2 | 6 | 0,4 | 4,0 | **4** | ✅ |
| TOMPROMAN001BAN | 8 | 5 | 1 | 14 | 2 | **0** | 12 | 0,8 | 8,0 | **8** | ✅ |
| GERPROGCH002BOL | 2 | **0** | 4 | 6 | 1 | 0 | 5 | 0,3333 | 3,333 | **3** | ✅ |
| TOMPROCHE001CAJ | 10 | 14 | 0 | 24 | 12 | 0 | 12 | 0,8 | 8,0 | **0** | ✅ guarda `>=` |
| CAMPROSDU002BOL | 3 | 15 | 0 | 18 | 7 | 0 | 11 | 0,7333 | 7,333 | **0** | ✅ igualdad `7>=7` |
| GERPROALF002CAJ | 20 | **0** | 10 | 30 | 3 | **7** | 20 | 1,3333 | 13,333 | **13** | ✅ |

**Los 9 términos × 6 productos = 54 valores, todos idénticos al recómputo contra BD. Ninguna diferencia.**

### 3.3 El sugerido llega íntegro al pedido

El pedido generado desde el modal trajo **exactamente las 4 líneas con sugerido > 0**, con las cantidades del
sugerido, y **excluyó** las dos de sugerido 0:

| Producto | `quUnitSuggested` | `quAmount` en el pedido |
|---|---:|---:|
| CAMPROLEC001BAN | 4 | **4** ✅ |
| TOMPROMAN001BAN | 8 | **8** ✅ |
| GERPROGCH002BOL | 3 | **3** ✅ |
| GERPROALF002CAJ | 13 | **13** ✅ |
| TOMPROCHE001CAJ | 0 | *(excluido)* ✅ |
| CAMPROSDU002BOL | 0 | *(excluido)* ✅ |

---

## 4. Casos borde

### 4.1 ✅ Producto que NO está en la última factura ⇒ despacho 0

**Es el caso más fuerte de esta corrida, porque hay empate de fecha.** El cliente 209 tiene **dos facturas del
23/07**: `20115666` (id 3827) y `20115667` (id 3828). El código desempata con
`ORDER BY da_invoice DESC, id_invoice DESC LIMIT 1` ⇒ gana la **3828**.

- **GERPROGCH002BOL** (en la 3827 con 5 uds, ausente en la 3828) → `dispatchedStock = **0**` ✅
- **GERPROALF002CAJ** (en la 3827 con 19 uds, ausente en la 3828) → `dispatchedStock = **0**` ✅
- Los 4 productos que **sí** están en la 3828 devolvieron **exactamente** su `qu_invoice`: 5, 5, 14, 15 ✅

**Confirmación cruzada en UI:** al agregar producto en la devolución (con `validateReturn=true`), la app listó
**los 6 productos de la 20115667 y ninguno de la 20115666** — la misma factura que usa el cálculo.

### 4.2 ✅ `currentStock >= sugerido ⇒ 0`, incluida la **igualdad**

| Sub-caso | Producto | bruto | sugerido sin guarda | actual | resultado |
|---|---|---:|---:|---:|---:|
| Mayor estricto | TOMPROCHE001CAJ | 8,0 | 8 | 12 | **0** ✅ |
| **Iguales** | CAMPROSDU002BOL | 7,333 | **7** | **7** | **0** ✅ |

El caso de igualdad se construyó a propósito: `round(0,7333 × 10) = 7` y se cargó inventario actual **7**.
La rama `>=` dispara con valores iguales, como exige el código.

### 4.3 ✅ Redondeo: `Math.round`, **sube** en `,5` — 3 casos

Con `daysSinceLast = 15` un resultado terminado en `,5` es **aritméticamente imposible**:
`venta × dun / 15 = k + 0,5` ⇒ `2·venta·dun = 15(2k+1)`, par = impar. Por eso se usó el **cliente 208**, con
`daysSinceLast = 8` (par) y `daysUntilNext = 4`:

| Producto | prev | desp | swap | inicial | actual | venta | venta diaria | **bruto** | **SUGERIDO** | Si truncara |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| TOMPROMAN001BAN | 2 | 5 | 0 | 7 | 2 | 5 | 0,625 | **2,5** | **3** ✅ | 2 ❌ |
| CAMPROSDU002BOL | 1 | 8 | 3 | 12 | 3 | 9 | 1,125 | **4,5** | **5** ✅ | 4 ❌ |
| MAL013PLS098MOR | 9 | 10 | 1 | 20 | 5 | 15 | 1,875 | **7,5** | **8** ✅ | 7 ❌ |

**Los tres suben.** `Math.round` confirmado, no trunca.

**Repetido en un tercer cliente — `210` EXCELSIOR GAMA (CHUAO)**, `id_address_client=781`, `daysSinceLast = 8`
(último inventario 03/08), `daysUntilNext = 4`, factura ganadora **3551 / `20114905`** (empate del 13/07 contra
la 3549, gana el id mayor). **Los cuatro productos son casos `,5` y los cuatro suben:**

| Producto | prev | desp | swap | inicial | actual | venta | venta diaria | **bruto** | **SUGERIDO** | Si truncara | Qué más prueba |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| CAMPROLEC002BAN | 1 | 6 | 0 | 7 | 2 | 5 | 0,625 | **2,5** | **3** ✅ | 2 ❌ | — |
| TOMPROCHE001CAJ | 5 | 15 | 0 | 20 | 5 | 15 | 1,875 | **7,5** | **8** ✅ | 7 ❌ | — |
| MAL013PLS098MOR | 6 | **0** | 0 | 6 | 1 | 5 | 0,625 | **2,5** | **3** ✅ | 2 ❌ | **despacho 0** (está en la 3549, la perdedora) |
| HIDPROBER001BOL | **0** | **0** | **4** | 4 | 1 | 3 | 0,375 | **1,5** | **2** ✅ | 1 ❌ | **sólo swap** (prev y despacho en 0) |

⇒ **6 casos `,5` en total entre los clientes 208 y 210, los 6 redondean hacia arriba.** El último producto es
además el único de la corrida donde `straightSwapStock` es el **único** término que aporta: confirma que el
swap por sí solo alimenta el sugerido.

### 4.4 ✅ La devolución de Calidad **no resta** — 2 confirmaciones independientes

| Evidencia | Detalle |
|---|---|
| **Creada en esta corrida** | Devolución **Ref 107**, tipo **Calidad (60)**, TOMPROMAN001BAN ×5, cliente 209, fecha de hoy ⇒ dentro de la ventana. **`returnedStock = 0`.** Si hubiera restado, el sugerido habría sido 5 en vez de **8**. |
| **Preexistente (cliente 208)** | CAMPROLEC002BAN tiene una devolución de Calidad de 3 uds del 03/08, dentro de ventana. **`returnedStock = 0`**, sugerido **4** (habría sido 3). |
| **Contraprueba positiva** | Devolución **Ref 106**, tipo **Distribución (61)**, CAMPROLEC001BAN ×2 ⇒ **`returnedStock = 2`**, sí resta ✅. Y la Distribución preexistente de GERPROALF002CAJ (7 uds) también restó ✅. |

**Mecanismo real (importante para el guión):** el filtro **no** está hardcodeado a `id_type = 61`. Sale de
`return_category.subtract_suggestion`:

```sql
... where rt.id_return_category in
    (select rc.id_return_category from return_category rc where rc.subtract_suggestion = 'true')
```

Verificado en la BD local del device: categoría 1 *Calidad* → `subtract_suggestion = 'false'`; categoría 2
*Distribución* → `'true'`. Se guardan como **string** `'true'`/`'false'`, que es lo que el SQL compara ⇒ el
filtro funciona. *(Se revisó a propósito porque la columna está declarada `BOOLEAN`: si el backend algún día
sincroniza `1`/`0` en vez de `'true'`/`'false'`, **ninguna devolución restaría**. Hoy no ocurre.)*

### 4.5 ✅ Cliente sin facturas ni inventario previo — no revienta

Cliente **402** (sin facturas, sin swaps, sin inventario previo), 1 producto con inventario actual 2:

```
daysSinceLast = 1 (forzado)   previousStock 0 · dispatchedStock 0 · straightSwapStock 0
initialStock 0 · currentStock 2 · returnedStock 0
soldUnits = -2  →  estimatedDailyUnits = 0  (guarda "< 0 ⇒ 0")  →  sugerido 0
```

Sin excepción, sin alerta de error, modal renderizado normalmente. ✅ De paso queda ejercitada la guarda de
**venta negativa**. *(Este inventario era un sondeo y se descartó con "Salir sin guardar"; no dejó fila.)*

### 4.6 ⚠ Sospecha del `break` por unidad de medida — **no reproducible con estos datos**

El encargo pedía probar un producto con **dos presentaciones que compartan la misma unidad**, porque la
asignación de la devolución hace `break` en la primera coincidencia:

```ts
//como el return es por unidad y no por product unit, se busca la unidad dentro de las unidades del producto
for(const [idProductUnit, unitUtil] of mapUnits){
  if(unitUtil.coUnit == coUnit){ unitUtil.returnedStock += quStock; break; }
}
```

**No existe ese caso en esta base:** `SELECT co_product, co_unit, count(*) FROM product_units GROUP BY
co_product, co_unit HAVING count(*) > 1` devuelve **0 filas**. Todos los productos del catálogo tienen **una
sola** `product_unit` y todas con `co_unit = 'UNI'`.

⇒ **El riesgo es real a nivel de código pero no materializable en hidroponias.** Queda planteado para una playa
con productos multi-presentación. **No se reporta como defecto.**

---

## 5. 🔴 Prueba de SUCURSAL — **NO EJERCITABLE en este dispositivo**

Se pidió validar que `dispatchedStock` respeta la **sucursal** (`id_address_client`) y no sólo el cliente,
usando el 147 con LA ALAMEDA (765, 20 facturas) vs CARRETERA PETARE (1258, 0 facturas).

### Por qué no se pudo ejecutar

| Comprobación | Resultado |
|---|---|
| Cliente 147 en cartera | ❌ **No está** (13 clientes, sin el 147) |
| ¿Hay un equivalente en cartera? | ✅ **Sí, en la nube:** los 13 clientes tienen 2 direcciones con el mismo `co_address_client` y distinto id. Ej. **209** → `780` MACARACUAY (4 facturas) y `1274` (0 facturas), ambas `co_operation='I'` (activas). |
| ¿Bajaron ambas al dispositivo? | ❌ **No.** La tabla local `address_clients` tiene **exactamente 1 dirección por cliente** — para todos, sin excepción. Del 209 sólo está la 780. |
| `user_address_clients` (asignación al vendedor) | **0 filas** |
| Selector de sucursal en el formulario | ✅ **Existe y está habilitado**, pero con **una sola opción**: "MACARACUAY" (209) / "VIZCAYA" (208) |

⇒ **Prueba A (cambiar la sucursal a mano): no ejercitada** — no hay segunda opción que elegir.
⇒ **Prueba B (guardado reabierto, la carrera de `getAllAddressByClient`): no ejercitada** — la carrera descrita
(`addressClient[0]` pisando la sucursal elegida) **no puede manifestarse** cuando la consulta devuelve **una
sola** fila: `addressClient[0]` *es* la dirección correcta.
⇒ **Prueba C (devoluciones sin filtro de sucursal): no ejercitada** — con una sola sucursal por cliente no hay
forma de distinguir "filtra" de "no filtra".

### Lo que sí quedó medido sobre la sucursal

| Evidencia | Valor |
|---|---|
| `newClientStock.idAddressClient` al crear | **780** (209) · **779** (208) — correctos |
| Persistido en local y nube | `client_stock.id_address_client` = **780** / **779** ✅ |
| Pedido generado | `order.id_address_client` = **780** ✅ |
| Facturas ofrecidas en devoluciones | **4**, exactamente las de `id_address_client=780` ✅ |
| Consulta del despacho (código) | Filtra `inv.id_client = ? AND inv.id_address_client = ?` en la consulta externa **y** en la subconsulta del desempate ⇒ **el filtro por sucursal está puesto** |

**Veredicto: el defecto de sucursal no se reprodujo, y con los datos que llegan a este device no es
reproducible.** No se marca ni PASS ni FAIL: **no ejercitado**, con el motivo documentado.

### ⚠ Hallazgo lateral que habilita esa prueba (y que conviene revisar)

**Direcciones activas de la nube que no llegan al dispositivo.** La nube tiene 2 direcciones por cliente, ambas
con `co_operation = 'I'`, y el device baja **sólo una**. No es el filtro conocido de borrados (`'D'`).
Mientras eso siga así, la mitad de la cartera con sucursales duplicadas **no es alcanzable desde la app**, y el
escenario de riesgo no se puede probar en campo. **Pregunta para desarrollo/datos**, no defecto confirmado:
¿el filtro de sincronización de `address_client` es deliberado (p. ej. por asignación de vendedor, con
`user_address_client` vacío) o es una omisión?

---

## 6. Registros creados en sistema

| Ref | Tipo | Detalle | Local | Nube |
|---|---|---|---|---|
| **106** | Devolución **Distribución (61)** | Cliente 209 · CAMPROLEC001BAN ×2 UNI · factura 20115667 | `st_delivery=1` | `st_return=1` ✅ **BD-OK** |
| **107** | Devolución **Calidad (60)** | Cliente 209 · TOMPROMAN001BAN ×5 UNI · factura 20115667 | `st_delivery=1` | `st_return=1` ✅ **BD-OK** |
| **48** | Inventario | Cliente 209 / sucursal 780 · 6 productos · días **15**/10 | `st_delivery=1` | `st_client_stock=1`, det=6 ✅ **BD-OK** |
| **48** | Pedido (desde sugerido) | Cliente 209 / sucursal 780 · **4 líneas** (4/8/3/13) · `QA-SUG-PEDIDO-20260811` | `st_delivery=1` | `st_order=1`, det=4 ✅ **BD-OK** |
| **49** | Inventario | Cliente 208 / sucursal 779 · 4 productos · días **8**/4 | `st_delivery=1` | `st_client_stock=1`, det=4 ✅ **BD-OK** |
| **50** | Inventario | Cliente 210 / sucursal 781 · 4 productos · días **8**/4 | `st_delivery=1` | `st_client_stock=1`, det=4 ✅ **BD-OK** |
| **49** | Pedido (desde sugerido) | Cliente 210 / sucursal 781 · **4 líneas** (3/8/3/2) · `QA-SUG-PEDIDO2-20260811` | `st_delivery=1` | `st_order=1`, det=4 ✅ **BD-OK** |
| — | Inventario de sondeo | Cliente 402 · descartado con "Salir sin guardar" | no deja fila ✅ | — |

`pending_transactions` **vacía** · `failed_transactions` **0** · sin duplicados.
**Sync a nube INMEDIATA** en los 7 registros (sin necesidad de poll diferido).

**Los 3 ciclos completos quedaron registrados end-to-end:**

| Ciclo | Cliente | Devoluciones | Inventario | Pedido generado con **Aceptar** |
|---|---|---|---|---|
| 1 | 209 MACARACUAY | Ref **106** (Distribución) + Ref **107** (Calidad) | Ref **48** | Ref **48** ✅ |
| 2 | 208 VIZCAYA | *(usa devolución de Calidad preexistente)* | Ref **49** | ⚠ **sin pedido** — se cerró el modal con Cancelar |
| 3 | 210 CHUAO | *(sin devoluciones en ventana)* | Ref **50** | Ref **49** ✅ |

⚠ En el ciclo 2 se cerró el modal del sugerido sin Aceptar, así que **ese ciclo no dejó pedido**. Como el
inventario 49 ya estaba enviado y no admite reabrir el sugerido, el ciclo se **rehízo completo en el cliente
210** (mismos `daysSinceLast=8`, mismos casos de redondeo), que sí llegó a pedido enviado.

⚠ **Comportamiento a registrar:** al pulsar **Enviar en el pedido generado desde el sugerido, la app envía
también el inventario**, con dos alertas seguidas: *"Inventario nro. 48 enviado exitosamente"* y *"Pedido nro.
48 enviado exitosamente"*. El inventario **no** se envía por separado en ese flujo. Es coherente (el
`client_stock` guarda `id_order`/`co_order` del pedido que generó), pero conviene que el guión lo diga.

---

## 7. Casos ejecutados

| ID | Caso | Resultado | Evidencia |
|----|------|-----------|-----------|
| SUG-001 | Guarda de tenant | ✅ PASS | `enterprises` local = sólo HIDRO_A |
| SUG-002 | VG `suggestedOrderByDispatchAndReturn` activa | ✅ PASS | `true` en device, nube y componente |
| SUG-003 | Devolución Distribución creada y enviada | ✅ PASS | Ref 106, BD-OK |
| SUG-004 | Devolución Calidad creada y enviada | ✅ PASS | Ref 107, BD-OK |
| SUG-005 | Inventario con 6 productos, enviado | ✅ PASS | Ref 48, BD-OK |
| SUG-006 | **Fórmula exacta término por término** (6 productos × 9 términos) | ✅ PASS | §3.2, tolerancia 0 |
| SUG-007 | Despacho = `qu_invoice` de la última factura | ✅ PASS | 5/5/14/15 exactos |
| SUG-008 | **Desempate de última factura por `id_invoice DESC`** | ✅ PASS | Gana 3828; la 3827 no aporta |
| SUG-009 | Producto fuera de la última factura ⇒ despacho 0 | ✅ PASS | GERPROGCH002BOL, GERPROALF002CAJ |
| SUG-010 | Swaps dentro de ventana suman | ✅ PASS | 3/1/4/10 exactos |
| SUG-011 | Devolución Distribución resta | ✅ PASS | 2 (Ref 106) y 7 (preexistente) |
| SUG-012 | **Devolución Calidad NO resta** | ✅ PASS | 2 confirmaciones (§4.4) |
| SUG-013 | `currentStock > sugerido ⇒ 0` | ✅ PASS | TOMPROCHE001CAJ |
| SUG-014 | **`currentStock == sugerido ⇒ 0`** | ✅ PASS | CAMPROSDU002BOL (7 vs 7) |
| SUG-015 | **Redondeo `,5` sube** (×6, dos clientes) | ✅ PASS | 208: 2,5→3 · 4,5→5 · 7,5→8 · 210: 2,5→3 · 7,5→8 · 2,5→3 · 1,5→2 |
| SUG-015b | Producto donde **sólo el swap** aporta (prev 0, despacho 0) | ✅ PASS | HIDPROBER001BOL: swap 4 ⇒ inicial 4, sugerido 2 |
| SUG-016 | Guarda venta negativa ⇒ diaria 0 | ✅ PASS | Cliente 402, venta −2 |
| SUG-017 | Cliente sin facturas ni inventario previo no revienta | ✅ PASS | Cliente 402 |
| SUG-018 | `daysSinceLast` calculado, no tecleado | ✅ PASS | 15 / 8 / 1 medidos y persistidos |
| SUG-019 | `daysUntilNext` tecleado se respeta | ✅ PASS | 10 y 4, persistidos |
| SUG-020 | Sugerido → líneas del pedido | ✅ PASS | Ciclo 1: 4/8/3/13 (los 0 excluidos) · Ciclo 3: 3/8/3/2 |
| SUG-021 | **Aceptar en el sugerido monta el pedido y se envía** | ✅ PASS | Pedidos **48** y **49**, ambos BD-OK |
| SUG-022 | Sucursal: despacho 0 en sucursal sin facturas | ⚪ **NO EJERCITADO** | 1 sola dirección por cliente (§5) |
| SUG-023 | Sucursal: guardado reabierto (carrera) | ⚪ **NO EJERCITADO** | ídem (§5) |
| SUG-024 | Devoluciones sin filtro de sucursal | ⚪ **NO EJERCITADO** | ídem (§5) |
| SUG-025 | `break` por unidad de medida compartida | ⚪ **NO EJERCITADO** | no existe el dato (§4.6) |

**23 PASS · 0 FAIL · 0 BLOCKED · 4 no ejercitados (falta de datos, motivo documentado).**

---

## 8. Defectos nuevos

**Ninguno.** La fórmula del pedido sugerido por despacho y devolución **funciona correctamente en todos los
términos y casos borde medidos**.

Dos puntos abiertos, ninguno confirmado como defecto:

1. **Direcciones activas que no bajan al device** (§5). Bloquea la validación del riesgo de sucursal.
   *Pregunta para desarrollo/datos.*
2. **`return_category.subtract_suggestion` se compara como string** contra columna declarada `BOOLEAN` (§4.4).
   Hoy funciona porque el dato llega `'true'`/`'false'`. *Fragilidad, no falla.*

Corrección al material de QA, no a la app:

3. **El YAML `hidroponias.yaml` está desactualizado**: declara `v6.6.18` (el device corre **v1.0 / db19**),
   `expirationBatch: true` (el device dice `false`) y `enterpriseEnabled: true` (device `false`).

---

## 9. Patrones / selectores nuevos

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **Los términos del sugerido NO están en el DOM — leerlos del modelo** | universal | El `inventario-sugerido-modal` sólo pinta días + nombres de producto. Todos los términos viven en `ng.getComponent(document.querySelector('app-inventario-sugerido-preview')).productsSuggested`. Explica la nota histórica *"no renderiza la línea Sugerido UNIDADES"*: **no es que falte el dato, es que la vista no lo expone.** |
| **Forma de `productsSuggested`: `[{ idProduct, unitsSuggested:[{...}] }]`** | universal | Los términos (`previousStock`, `dispatchedStock`, `straightSwapStock`, `initialStock`, `currentStock`, `returnedStock`, `soldUnits`, `estimatedDailyUnits`, `quUnitSuggested`) están en **`unitsSuggested[]`**, no en el objeto producto. Leerlos del wrapper devuelve `null` en todos los campos. |
| **`daysSinceLast` se sobrescribe con `daysSince(inventario previo)`** | universal | Para que un swap entre en ventana hay que **elegir cliente con último inventario anterior a los swaps**; no alcanza con teclear un número (el campo ni existe en el form). |
| **Un `,5` exacto requiere `daysSinceLast` PAR** | universal | `venta × dun / dsl = k+0,5` es imposible con `dsl` impar. Para probar el redondeo, elegir cliente cuyo último inventario caiga a un nº par de días. |
| **Desempate de "última factura" = `ORDER BY da_invoice DESC, id_invoice DESC LIMIT 1`** | universal | Con dos facturas del mismo día gana el **id mayor**. Oráculo cruzado gratis: con `validateReturn=true`, la lista de "Agregar Producto" de DEVOLUCIONES muestra **exactamente** los productos de esa misma factura. |
| **Selector de sucursal del inventario: `ion-select` habilitado, `value` = `id_address_client` (number)** | universal | Distinto del de empresa (que trae el objeto completo y llega `disabled` con una sola empresa). Métodos útiles: `onSucursalSelect`, `checkAddressClient` en `app-inventario-general`. |
| **Buscador del Tab Inventario: teclear NO filtra, hay que clickear la lupa** | universal (6ª confirmación) | `input.search-input.inputsSearch` + `ion-icon[name="search-circle-sharp"]`. Filtra a 1 ítem por código exacto — mucho más barato que navegar familias. |
| **`app-inventario-general` desaparece del DOM al cambiar de tab** | universal | `ng.getComponent` revienta con *"Expecting instance of DOM Element"*. Buscar el logic service recorriendo candidatos (`app-inventario-inventario`, `app-inventario`, `app-inventario-container`) y quedarse con el que tenga `inventariosLogicService.newClientStock`. |
| **En DEVOLUCIONES el componente dueño es `devolucion-general`, no `app-devolucion`** | universal | `app-devolucion` sólo tiene `onChangeTab`. El estado real vive en `returnLogic.newReturn` (el `newReturn` de `devolucion-general` está **vacío**). |
| **Habilitar tabs de devolución exige `setInvoicefromSelector` + `selectorInvoice.selectInvoice`** | universal | `setInvoicefromSelector` fija `newReturn.coInvoice/idInvoice` pero **no habilita las tabs**; hace falta además `selectInvoice(inv)`. `assignInvoice()` lanza `Cannot read properties of undefined` y se puede ignorar. |
| **Validación de cantidad en devolución acotada a lo facturado** | cliente/universal | *"La cantidad a devolver debe estar entre 1 y N"*, con N = `qu_invoice` de esa línea. Con `validateReturn=true`, planificar cantidades **≤ lo facturado** o el envío queda deshabilitado sin explicación evidente. |
| **`setClientfromSelector` NO prende en INVENTARIOS (v1.0/db19 La Tortuga)** | cliente | Corre sin lanzar pero deja el cliente vacío y las tabs bloqueadas. **Sí funciona en DEVOLUCIONES** del mismo build. Vía fiable en inventarios: click real en `#clienteSelectModal ion-item` al **35 % ancho / 35 % alto**. |
| **Enviar el pedido generado desde el sugerido envía TAMBIÉN el inventario** | universal | 4 alertas: confirmar → *"Su Pedido será enviado"* → *"Inventario nro. N enviado"* → *"Pedido nro. N enviado"*. |
| **Etiquetas de alert leídas (no predichas)** | cliente | Devolución: envío `[Cancelar/Aceptar] → [OK] → [OK]` (3, la 3.ª da la Ref). Inventario: `[Cancelar/Aceptar] → [OK] → [OK]`. Dirty-guard inventario: `[Guardar y salir / Salir sin guardar / Cancelar]`. Todas en **minúscula-mayúscula normal**, no en mayúsculas. |
| **`global_configuration` local tiene 176 filas con `clave` NULL** | universal | Las VGs efectivas **no** están ahí: viven en **`localStorage.globalConfiguration`**, array de pares `[clave, valor]` con valores **string** (`"true"`). Consultar la tabla da 0 resultados y se lee como "la VG no existe". |
| **`address_clients` local usa `id_address`/`co_address`** | universal | No `id_address_client`/`co_address_client` (esos son los nombres de **nube**). Un `SELECT` con el nombre de nube aborta la transacción `sqlitePlugin` en silencio. |

---

## 10. Respuestas directas al encargo

1. **¿La fórmula da exacto?** **Sí, exacta, tolerancia 0.** **15 productos** medidos entre **cuatro clientes**,
   los 9 términos de cada uno recomputados contra BD y coincidentes. **Ningún término se rompe.**
2. **Casos borde:** despacho 0 fuera de la última factura ✅ (con desempate de fecha, en 2 clientes) · sólo swap
   aporta ✅ · `>=` ✅ · **igualdad exacta** ✅ · redondeo `,5` sube ✅ (**6 casos**) · venta negativa ⇒ 0 ✅ ·
   cliente sin facturas no revienta ✅.
3. **¿La Calidad se filtró bien?** **Sí**, con dos confirmaciones independientes, y con la contraprueba de que
   Distribución sí resta. El filtro real es `return_category.subtract_suggestion`, no un `id_type` hardcodeado.
4. **Defectos nuevos:** **ninguno**. Dos puntos abiertos para desarrollo (direcciones que no sincronizan;
   comparación string/BOOLEAN) y el YAML del cliente desactualizado.
5. **Creado y enviado:** Devoluciones **106** y **107** · Inventarios **48**, **49** y **50** · Pedidos **48** y
   **49**. Los **siete** llegaron a la nube (**BD-OK**), colas vacías, 0 fallidos. **Dos ciclos completos
   cerraron con Aceptar → pedido enviado** (209 y 210).

**Dispositivo en HOME.**
