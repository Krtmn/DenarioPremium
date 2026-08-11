# Alta de PEDIDOS desde la WEB — difranca / El Yaque (main)

**RUN_ID:** `smoke_difranca_20260810_main` · **Fecha:** 2026-08-10
**Playa:** EL YAQUE — `http://denarioelyaque.ddns.net:8080/DenarioPremium`
**Tenant:** difranca · **Empresa de la prueba:** `DDHP_A12` (*DISTRIBUIDORA DIAZ HERNANDEZ *)
**Credenciales:** `***` / `***` · login **OK**
**Modo:** 🔴 **ESCRITURA autorizada por QA** — se creó **1 (un) pedido**: **# Ref 39797**.

**Guarda de tenant ✅** — el `<select>` de Empresa devolvió exactamente las 3 empresas de difranca por TEXTO
(`*DISTRIBUIDORA DIAZ HERNANDEZ *`, `DIFRANCA C.A`, `DISTRIBUIDORA DH VITAL, C.A.`). `DDH_A12` **no aparece**,
como estaba previsto. Ninguna empresa ajena.

---

## 🟢 RESUMEN EJECUTIVO

| Parte | Estado |
|---|---|
| **P1 — Veredicto del descuento global** | ✅ **RESUELTO: NO.** La web **no** preselecciona descuento |
| **P2 — Alta completa** | ⚠️ **PARCIAL** — `Nuevo → Enviar` funciona; **`Guardar → reabrir → Enviar` está ROTO** |
| **P3 — Los 5 de La Tortuga** | 1 confirmado · 2 refutados · 1 confirmado con matiz · 1 no evaluable acá |

**Lo más importante que salió — y no estaba en la lista:**

| # | Hallazgo | Severidad |
|---|---|---|
| **N1** | 🔴 **La web factura con una tasa de cambio de una fila corrupta con `date_conversion` año 2056** ⇒ **−4,09 % en cada pedido web**. El móvil no la usa nunca | 🔴 **alta — dinero** |
| **N2** | 🔴 **Reabrir un pedido guardado con `Editar` pierde TODAS las líneas** ⇒ `Enviar` queda bloqueado: *"No hay productos en el pedido"*. **Un pedido guardado no se puede enviar jamás** | 🔴 **alta — bloqueante** |
| **N3** | 🟠 El carrito muestra el precio **crudo, sin formatear y con ruido de coma flotante**: `2625.7140000000004` | 🟠 media |
| **N4** | 🟠 En el detalle, los importes en 0 se muestran **en blanco** (`Descuento Global:`, `IVA :`) mientras `Descuento bonif.:` sí muestra `0,00 BSD` | 🟠 media |

---

## Veredicto del descuento global

# 🔵 **NO.** La web **NO** preselecciona ningún descuento global por su cuenta.

**Valores crudos del pedido web 39797 (`"order"`), sin haber tocado ningún control de descuento:**

```
nu_discount                = 0.0000
nu_amount_global_discount  = 0.0000
nu_amount_total_base       = 14289.9435
nu_amount_total            = 14289.9435      ← idéntico a la base: no se restó nada
```

### Por qué el resultado es concluyente (y no un accidente)

difranca es el banco de pruebas limpio que se buscaba, y lo es por **tres** razones independientes:

| Control | Medición |
|---|---|
| Descuento en ficha de cliente | **0 de 4.558** clientes con `client.qu_discount <> 0` |
| **Catálogo `global_discount`** | 🔑 **TABLA VACÍA — `count(*) = 0`.** No existe ninguna fila, y por tanto **ninguna** con `default_global_discount = true` |
| Histórico | **16.560 de 16.560** pedidos previos con `nu_discount = 0.0000` |

### Lectura de los controles **antes de tocar nada** (paso 1 del protocolo)

Se leyó el DOM del alta recién abierta, **antes** de elegir vendedor o cliente:

| Control | Label visible | `value` del `<select>` espejo | Opciones reales |
|---|---|---|---|
| Descuento de línea (`form:j_idt375_input`) | `Descuento` | `""` (placeholder) | **1 — solo el placeholder** |
| Descuento de línea, fila 0 (`…:j_idt260_input`) | `Descuento` | `""` | **1 — solo el placeholder** |
| Descuento de línea, fila 1 (`…:j_idt260_input`) | `Descuento` | `""` | **1 — solo el placeholder** |
| **Descuento GLOBAL** | — | — | 🔑 **NO EXISTE NINGÚN CONTROL** en la pantalla de alta |

> El literal *"Descuento Global"* aparece en la página **únicamente como link del menú `Configuración`**
> (`menuform:m_sm112`), no como campo del formulario. **El usuario no puede elegirlo ni verlo desde el alta.**

### Registro del descuento en los 4 momentos que pidió el protocolo

| Momento | `nu_discount` | `nu_amount_global_discount` | Fuente |
|---|---|---|---|
| **Antes de Guardar** | *(sin control en pantalla; los 3 `<select>` de Descuento en placeholder)* | — | DOM |
| **Después de Guardar** | **0.0000** | **0.0000** | `order_saved` id 51 |
| **Al reabrir** (`Editar`) | *(placeholder, sin cambios)* | — | DOM |
| **Después de Enviar** | **0.0000** | **0.0000** | `"order"` id 39797 |

### 🔴 El contraste que pidió la QA — mismo cliente, web vs móvil

Cliente **`CAR755` MULTIDISTRIBUIDORA JAKE, C.A**:

| `id_order` | `procedencia` | Fecha | **`nu_discount`** | `nu_amount_global_discount` |
|---|---|---|---:|---:|
| **39797** | **`Denario Web`** ← el nuestro | 10/08/2026 | **0.0000** | **0.0000** |
| 39796 | `Denario` (móvil) | 07/08/2026 | 0.0000 | 0.0000 |
| 39795 | `Denario` (móvil) | 07/08/2026 | 0.0000 | 0.0000 |
| 39380 | `Denario` (móvil) | 17/07/2026 | 0.0000 | `null` |
| 39321 | `Denario` (móvil) | 15/07/2026 | 0.0000 | `null` |
| 39119 | `Denario` (móvil) | 09/07/2026 | 0.0000 | `null` |

> *"Malo sería probar el mismo cliente y que en la web agarre un descuento y en la móvil otro."*
> **No ocurre.** Web y móvil coinciden en **0,0000** para el mismo cliente. **Cero divergencia de descuento.**

### 🔁 Qué se retracta y qué se conserva del hallazgo H5 de La Tortuga

- ❌ **Se RETRACTA la formulación fuerte:** *"la web aplica un 7 % de descuento global automático"* — **no** es
  cierto como comportamiento del producto. La web **no inventa** un descuento.
- ✅ **Se CONSERVA la formulación correcta:** *la web aplica el `global_discount` marcado
  `default_global_discount = true`, si existe*. En alipascua esa fila existía (7,0000 rotulada "10 %") y se
  aplicó; en difranca **la tabla está vacía** y se aplicó **0**. **El comportamiento es config-driven y
  consistente en las dos playas.**
- 🟠 **Queda vivo el punto de fondo, reformulado:** el default se aplica **sin control en pantalla y sin
  anuncio**. Donde el catálogo esté poblado, el usuario no tiene forma de verlo ni de desactivarlo — y el
  móvil no lo aplica. Esa asimetría web↔móvil sigue siendo un problema **allí donde `global_discount` tenga
  filas**; simplemente **no es reproducible en difranca** porque no las tiene.

---

## Alta (paso a paso, aritmética, BD)

### Datos elegidos y por qué

| Elemento | Valor | Motivo |
|---|---|---|
| Vendedor | **Jose Raad** (`id_user` 275, `co_user` 206) | el más activo de DDHP_A12 (100 pedidos desde julio) |
| Cliente | **`CAR755` MULTIDISTRIBUIDORA JAKE, C.A** | 10 pedidos **móviles** desde julio ⇒ material de contraste directo |
| Lista de precio | `01 - Precio 01` (`id_list` 6) | autocompletada por el cliente (`client.co_list='01'`) ✓ |
| Almacén | `Principal` → `co_warehouse` **`001`** | el que tiene stock |
| Moneda | **BSD** | **valor inicial del bean, no se tocó** |

| Producto | Precio lista | Stock alm. 001 | `co_unit` | `qu_unit` | IVA |
|---|---:|---:|---|---:|---:|
| `CHBA300U` Champu BBK de Argan Therapy 300ml | 3,64 US$ | 3.052 | UND | **1** | 0 % |
| `AOP20120U` Agua Oxigenada Pasarela Vol 20 120cm3 | 1,27 US$ | 5.275 | UND | **1** | 0 % |

> 🔴 **No fue posible cumplir el pedido de "al menos un producto con `qu_unit > 1`".**
> **En DDHP_A12 los 453 registros de `product_unit` tienen `qu_unit = 1.0000`** — sin excepción.
> ```sql
> SELECT qu_unit, count(*) FROM product_unit WHERE co_enterprise='DDHP_A12' GROUP BY 1;
> -- 1.0000 | 453      ← una sola fila de resultado
> ```
> El defecto #1 de La Tortuga **no puede manifestarse acá por construcción** (el factor vale 1). El único
> candidato del tenant para probarlo es **`DHVITAL01_A`**, que sí tiene productos con `qu_unit` 10 y 12
> (7 productos). Queda como recomendación, no se tocó por estar fuera de la empresa autorizada.

### Paso a paso

| # | Paso | Control | Resultado |
|---|---|---|---|
| 1 | Entrar | `/pages/pedidos` | guarda de tenant OK, Empresa ya en `DDHP_A12` |
| 2 | Crear | `form:pedidosDT:agregarRegistro` "Nuevo Pedido" | → `/pages/protected/pedidos/nuevoPedido.xhtml` |
| 3 | Vendedor | `:idSalesmaView` (18 opc.) | Jose Raad |
| 4 | *cascada* | — | Cliente pasó de **1 → 136** opciones |
| 5 | Cliente | `:idClient` | `CAR755` |
| 6 | *cascada* | — | autocompletó Sucursal, `Precio 01`, `Credito a 30`, `PEDIDO ESTANDAR` |
| 7 | Buscar prod. | `form:filterSearchBar` + `form:btnBuscar` | acepta el **código** de producto |
| 8 | Línea 1 | `form:tablaOrder:0:j_idt276` **Agregar** | entra con **cantidad 1** |
| 9 | Cantidad | `form:tablaOrder:0:qtyPedido_input` + `Tab` | CHBA300U = **3** |
| 10 | Línea 2 | ídem | AOP20120U = **7** |
| 11 | Cabecera | `:txtNumOrden`, `:txtResponsable`, `:txtComentario` | ⚠ el 1er intento de `Responsable` se perdió (ver #4) |
| 12 | **Guardar** | `form:saveOrderButton` → `form:msjConfirmSave` | → `order_saved` **id 51** |
| 13 | **Reabrir** | `Status=Guardado` → `form:pedidosSavedDT:0:Editar` | 🔴 **carrito VACÍO — ver N2** |
| 14 | Enviar (1º) | `form:sendOrderButton` | 🔴 **BLOQUEADO**: *"No hay productos en el pedido"* |
| 15 | Recargar líneas | mismas 2 líneas, mismas cantidades | sobre el mismo formulario reabierto |
| 16 | **Enviar** | `form:sendOrderButton` → `form:msjConfirmSend` | → `"order"` **id 39797** ✅ |

### 🧮 Aritmética explícita — tolerancia 0,01

**Factor de unidad:** `qu_unit = 1` en ambos productos ⇒ `subtotal = cantidad × 1 × precio`.
El detalle lo confirma en pantalla: `Unidades pedidas: 3 Unidad` / `7 Unidad` (no BULTO).

**En BSD (moneda del pedido) — precio unitario ya convertido:**

```
Línea 1  CHBA300U : 3 × 1 × 2.625,7140 =  7.877,1420 BSD   ✓ UI "Subtotal: 7.877,14 BSD"  ✓ BD 7877.1420
Línea 2  AOP20120U: 7 × 1 ×   916,1145 =  6.412,8015 BSD   ✓ UI "Subtotal: 6.412,80 BSD"  ✓ BD 6412.8015
Σ líneas                              = 14.289,9435 BSD
   == "Subtotal bruto"      14.289,94 BSD  ✓
   == "Monto Base Pedido"   14.289,94 BSD  ✓
   == BD nu_amount_total_base  14289.9435  ✓
Descuento bonif.  =      0,00 BSD   ✓ (UI y BD)
Descuento global  =      0,00 BSD   ✓ (BD nu_amount_global_discount = 0.0000)
IVA               =      0,00 BSD   ✓ (ambas líneas 0 %; product.nu_tax = 0 en las dos ⇒ coherente)
Monto Total Pedido = 14.289,9435 BSD ✓ UI y BD nu_amount_total
```

**En US$ (conversión) — con la tasa que usa el pedido, no una supuesta:**

```
Tasa del pedido (UI lista): "721,35 BSD = 1 US$"  ==  BD order.nu_value_local = 721.3500
Dirección: US$ → BSD ⇒ MULTIPLICA (US$ es la moneda de price_list; BSD la del pedido)

Precio base L1:  3,64 × 721,35 = 2.625,714  BSD  ✓ UI "Precio base: 2.625,71 BSD"
Precio base L2:  1,27 × 721,35 =   916,1145 BSD  ✓ UI "Precio base: 916,11 BSD"
Subtotal conv. L1: 3 × 3,64 = 10,92 US$          ✓ UI y BD nu_amount_total_conversion 10.9200
Subtotal conv. L2: 7 × 1,27 =  8,89 US$          ✓ UI y BD 8.8900
Σ conv.                     = 19,81 US$
   == "Monto Base Pedido Conversion" 19,81 US$   ✓
   == "Conversiòn Monto Total :"     19,81 US$   ✓
   == BD nu_amount_total_base_conversion 19.8100 ✓
Comprobación cruzada: 19,81 × 721,35 = 14.289,9435 BSD  ✓ exacto
```

**Todos los derivados cuadran dentro de 0,01.** ✅
🔴 **Pero la tasa en sí está mal** — ver hallazgo **N1**.

### Verificación en BD — diff contra el baseline

| Métrica | Baseline (`_bd-baseline.md`) | Después | Δ |
|---|---:|---:|---|
| `count(*)` de `"order"` | **16.560** | **16.561** | **+1** ✅ |
| `max(id_order)` | 39.796 | **39.797** | +1 ✅ |
| `"order"` con `procedencia='Denario Web'` | **0** | **1** | +1 ✅ |
| `count(*)` de `order_saved` | 28 (tras guardar) | **27** | **−1** (el id 51 se consumió) ✅ |

**Exactamente 1 pedido creado, sin duplicados.**

**Fila `"order"` 39797 vs UI:**

| Campo | BD | UI | ✓ |
|---|---|---|---|
| `co_order` | `1786380879181.0` | `Código pedido` | ✅ **el mismo epoch que el guardado 51** |
| `procedencia` | `Denario Web` | `Plataforma: Denario Web` | ✅ |
| `st_order` | 1 | `Estatus: Enviado` | ✅ (`statuses` 1/`ped` = "Enviado" — válido en difranca) |
| `nu_details` | **2** | 2 filas en la tabla de líneas | ✅ |
| `nu_amount_total_base` | 14289.9435 | 14.289,94 BSD | ✅ |
| `nu_discount` / `nu_amount_global_discount` | **0.0000 / 0.0000** | sin descuento | ✅ |
| `nu_amount_tax` | 0.0000 | — | ✅ |
| `nu_value_local` | **721.3500** | `Tasa conv. 721,35 BSD = 1 US$` | ✅ (coherente, pero 🔴 N1) |
| `nu_amount_total_conversion` | 19.8100 | 19,81 US$ | ✅ |
| `co_client` / `co_user` | CAR755 / 206 | MULTIDISTRIBUIDORA JAKE / Jose Raad | ✅ |
| `nu_purchase` | QA-WEB-20260810 | `No. Orden de compra` | ✅ |
| `tx_comment` | *(texto QA)* | `Comentario` | ✅ |
| **`na_responsible`** | **`QA AUTOMATIZACION`** | **`Responsable: QA AUTOMATIZACION`** | ✅ **persiste — refuta #2** |
| `id_order_creator` | **263** | — | ⚠ la web deja autor; el móvil lo deja `null` |
| `coordenada` | `''` | — | ✅ esperable (escritorio sin GPS) |
| `da_dispatch` | 2026-08-10 | `Fecha de despacho 10/08/2026` | ⚠ la web la fija en **hoy** por defecto |

```sql
SELECT (SELECT sum(nu_amount_total) FROM order_detail WHERE co_order='1786380879181.0') suma_lineas,
       (SELECT nu_amount_total_base FROM "order" WHERE id_order=39797)                  base_cabecera;
-- suma_lineas = 14289.9435    base_cabecera = 14289.9435    ✅ CUADRA
```

`order_detail_unit`: `CHBA300UUND → qu_order 3` · `AOP20120UUND → qu_order 7` ✅

---

## Los 5 de La Tortuga: confirmado/refutado

### 1. 🔴 Σ líneas ≠ Monto Base en pedidos GUARDADOS → ⛔ **NO EVALUABLE en DDHP_A12**

**No es "no reproduce": es que el defecto no puede existir acá.** La causa raíz en La Tortuga era que la
línea no aplicaba `product_unit.qu_unit` y la cabecera sí. **En DDHP_A12 `qu_unit = 1` en los 453 productos**,
así que ambos caminos dan el mismo número por construcción y el defecto queda invisible — exactamente el
escenario que el propio reporte de La Tortuga advertía que lo escondía.

Lo que sí se midió, y cuadra:

| Estado | Línea 1 | Línea 2 | Σ líneas | Monto Base | ¿Cuadra? |
|---|---:|---:|---:|---:|---|
| **Guardado** (`order_detail_saved`) | 7.877,1420 | 6.412,8015 | **14.289,9435** | **14.289,9435** | ✅ sí |
| **Enviado** (`order_detail`) | 7.877,1420 | 6.412,8015 | **14.289,9435** | **14.289,9435** | ✅ sí |

⇒ **Veredicto: sin evidencia en contra, pero la prueba NO se hizo.** Para cerrarlo hace falta repetir en
**`DHVITAL01_A`**, la única empresa de difranca con `qu_unit > 1` (7 productos: `qu_unit` 10 y 12).

### 2. 🟠 `Responsable` se captura y no persiste → ✅ **REFUTADO**

Persiste en **los tres** puntos de control:

```
DOM justo antes de confirmar Guardar  : "QA AUTOMATIZACION"
BD order_saved.na_responsible (id 51) : "QA AUTOMATIZACION"
BD "order".na_responsible (id 39797)  : "QA AUTOMATIZACION"
UI detallePedido → Responsable:        "QA AUTOMATIZACION"
```

**En main / difranca el campo se guarda correctamente.** (⚠ Ver #4: sí se puede *perder antes de guardar*,
pero por el modal espurio, que es un mecanismo distinto.)

### 3. 🟠 Descuento rotulado "10 %" con valor real 7 → ✅ **REFUTADO — no aplica**

`SELECT * FROM global_discount` → **0 filas**. **No hay ningún descuento definido**, por lo tanto no hay
rótulo ni valor que puedan discrepar. El defecto es **específico del dato de alipascua**, no del producto.

### 4. 🟠 Dos modales apilados / `Si, Borrar` espurio → ✅ **CONFIRMADO** (con matiz)

**Se reprodujo el modal espurio, y esta vez con el disparador identificado.** Al escribir en
**`Responsable`** apareció `form:msjConfirmVarChange`:

> *"Se ha detectado un cambio de lista de precio por lo cual se reiniciara el pedido.
> ¿Esta seguro de reiniciar este pedido?"* → `No, Regresar` / **`Si, Borrar`**

**La lista de precio nunca se cambió** — quedó en `Precio 01` de punta a punta (verificado en el `<select>`
espejo antes y después). Y **se llevó puesto el valor tecleado**: `txtResponsable` quedó en `""`.

**Matices respecto de La Tortuga:**

- ✅ **Confirmado:** el modal es espurio, es destructivo (`Si, Borrar` reinicia el pedido) y borra lo tecleado.
- ⚠ **NO se reprodujo el apilamiento de dos modales a la vez.** Al pulsar `Guardar` apareció **solo**
  `form:msjConfirmSave`. Acá el modal espurio salió **antes**, aislado.
- ⚠ **Sigue sin ser determinista:** el **segundo** intento de escribir `Responsable`, idéntico, **no** lo
  disparó y el valor sobrevivió. 1 de 2 intentos.
- 🔑 **Dato nuevo y operativo:** `boton.click()` desde JS **no lo cierra** (el modal y su máscara siguen en
  `display:block`). Hace falta un **click real de Playwright**. Un guión que lo cierre por JS se queda
  colgado creyendo que siguió.

### 5. 🟡 El alta no muestra ningún total → ✅ **CONFIRMADO**

Medición directa sobre el DOM del alta con las 2 líneas ya cargadas:

```js
[...document.querySelectorAll('*')].filter(e => !e.children.length &&
  /total|subtotal|monto/i.test(e.textContent||'')).length
// → 0
```

**Cero elementos.** No hay subtotal, ni total, ni IVA, ni base en ninguna parte de la pantalla de alta.
El `form:panelCarrito` solo lista nombre de producto + precio unitario. **El usuario guarda y envía sin
saber cuánto suma el pedido.** El primer importe aparece recién en la lista/detalle, con el pedido ya creado.

---

## Hallazgos

### 🔴 N1 — La web factura con una tasa corrupta fechada en el año 2056 (−4,09 % por pedido)

**Severidad alta — impacto directo en dinero, en todos los pedidos web del tenant.**

El pedido salió con `nu_value_local = 721,3500`. La tasa vigente el 10/08/2026 es **752,0900**.
El origen es una fila de `conversion_type` con la **fecha corrompida**:

```sql
SELECT id_conversion_type, co_conversion_type, nu_value_local, date_conversion, da_update, co_enterprise
FROM conversion_type WHERE date_conversion > '2027-01-01';
```

| `id` | `co_conversion_type` | `nu_value_local` | **`date_conversion`** | `da_update` | empresa |
|---:|---|---:|---|---|---|
| 3445 | `US$13720262626` | **721,3500** | **2056-07-25** | 2026-07-14 | **`DDHP_A12`** |
| 3443 | `USD137202677` | 721,3500 | **2056-07-25** | 2026-07-14 | `DIF_A12` |
| 3447 | `US$137202666` | 721,3500 | **2056-07-25** | 2026-07-14 | `DHVITAL01_A` |

🔑 **El propio código de la fila delata el error:** `US$` + `13` + `7` + `2026` ⇒ la fecha pretendida era
**13/07/2026**, pero `date_conversion` quedó en **25/07/2056**, **30 años en el futuro**.

**Mecanismo:** la web resuelve "la tasa vigente" como `max(date_conversion)`. Esa fila gana siempre y
**seguirá ganando durante 30 años**, congelando la conversión en 721,35 pase lo que pase con la tasa real.

**Las 3 empresas de difranca están afectadas** (hay una fila corrupta para cada una).

**Prueba de que es específico de la web:**

```sql
SELECT count(*) FROM "order" WHERE nu_value_local = 721.35 AND procedencia = 'Denario';
-- → 0
```

**En 16.560 pedidos móviles, la tasa 721,35 no aparece ni una sola vez.** La serie móvil es continua y sana:
`744,23 → 745,64 → 746,63 → 748,79 → 752,09`. El móvil ignora la fila corrupta; la web la adopta.

**Impacto cuantificado sobre el pedido 39797:**

```
Con la tasa de la web  721,35 :  19,81 US$ × 721,35 = 14.289,94 BSD   ← lo que se facturó
Con la tasa vigente    752,09 :  19,81 US$ × 752,09 = 14.898,90 BSD   ← lo que correspondía
Diferencia                    :                          608,96 BSD
Subfacturación                :  (752,09 − 721,35) / 752,09 = 4,087 %
```

⇒ **Todo pedido cargado desde la web factura ~4,1 % por debajo del móvil para el mismo cliente y producto**,
y la brecha **crece** cada vez que sube la tasa real. Es la divergencia web↔móvil que se estaba buscando —
solo que está en la **tasa**, no en el descuento.

**Es defecto de producto, no solo de dato:** el dato malo existe (la fecha 2056), pero un selector de tasa
que acepta una fecha 30 años en el futuro sin validación es el que lo convierte en pérdida silenciosa.

### 🔴 N2 — Reabrir un pedido guardado con `Editar` pierde todas las líneas ⇒ no se puede enviar nunca

**Severidad alta — bloqueante. Rompe el ciclo `Guardar → reabrir → Enviar` por completo.**

Secuencia medida:

1. Pedido guardado `order_saved` **id 51** con **2 líneas correctamente persistidas en BD**:
   ```
   order_saved.nu_details = 2
   order_detail_saved: AOP20120U (6412.8015) + CHBA300U (7877.1420)   ← ambas presentes
   ```
2. `Status=Guardado` → `form:pedidosSavedDT:0:Editar` → vuelve al formulario de alta.
3. **La cabecera se restaura ENTERA** (cliente, vendedor, empresa, lista, cond. pago, moneda, tipo,
   Nº orden, comentario, fechas y **Responsable**). ✅
4. 🔴 **El carrito vuelve VACÍO:**
   ```
   form:panelCarrito  → "No existe registro"
   form:tablaOrder    → "No se encontraron registros."
   [id$=":qtyPedido_input"] → 0 elementos
   ```
5. `form:sendOrderButton` → modal `form:msj`:
   > **"No hay productos en el pedido. Por favor agregue productos antes de enviar el pedido"**

**No es un problema de datos faltantes:** las líneas **estaban** en `order_detail_saved` cuando se pulsó
`Editar`. Es el formulario/bean el que **no las rehidrata**. El usuario ve su pedido "completo" en la
cabecera y descubre que está vacío recién al intentar enviarlo.

**Corroboración histórica devastadora:**

| Medición | Valor |
|---|---|
| `order_saved` en el tenant | **27** (algunos de 2024) |
| de ellos con `nu_details > 0` en la cabecera | **24** |
| filas totales en `order_detail_saved` | **0** |
| `"order"` con `procedencia='Denario Web'` **antes** de esta corrida | **0** |

⇒ **En toda la historia de difranca nunca se envió un solo pedido desde la web.** Se acumularon 27 pedidos
guardados —cabeceras sin líneas— y ninguno llegó nunca a `"order"`. El pedido 39797 es **el primero**, y solo
se logró **recargando las líneas a mano** después de reabrir.

**Único camino que funciona hoy:** `Nuevo Pedido → cargar líneas → Enviar` **sin pasar por Guardar**.

### 🟠 N3 — El carrito muestra el precio crudo, sin formatear y con ruido de coma flotante

`form:panelCarrito` renderiza el precio unitario tal cual sale del cálculo:

```
Champu BBK de Argan Therapy 300ml        2625.7140000000004     ← 13 decimales de basura IEEE-754
Agua Oxigenada Pasarela Vol 20 120cm3    916.1145
```

Sin separador de miles, sin coma decimal es-VE, **sin símbolo de moneda** y con el artefacto de coma
flotante a la vista. En el resto de la aplicación el mismo importe se muestra `2.625,71 BSD`.
Es el **único** importe visible durante el alta (ver #5), así que es también la única cifra que el usuario
puede leer mientras arma el pedido.

### 🟠 N4 — En el detalle, los importes en 0 quedan en blanco, de forma inconsistente

En `/pages/detallePedido` del pedido 39797, estas etiquetas se renderizan **sin ningún valor detrás**
(el `textContent` del padre es exactamente la etiqueta):

```
Descuento :                     →  (vacío)
Conversión Descuento:           →  (vacío)
Descuento Global:               →  (vacío)
Conversión Descuento Global:    →  (vacío)
IVA :                           →  (vacío)
Conversión IVA:                 →  (vacío)
```

mientras que, **en el mismo bloque y con el mismo valor 0**, sí se muestran:

```
Descuento bonif.:               →  0,00 BSD
Monto Base Pedido Conversion:   →  19,81 US$
```

BD confirma que los campos vacíos valen **0.0000**, no `null` (`nu_amount_global_discount = 0.0000`,
`nu_amount_tax = 0.0000`). ⇒ **Un 0 y un "no calculado" se ven exactamente igual.** Para el caso del
descuento global esto es especialmente malo: es justo el campo que hay que auditar, y no muestra nada.

⚠ **Consecuencia para automatización:** un lector que exija valor para `Descuento Global:` concluye
"el campo no existe" cuando en realidad vale 0.

### ⚠ N5 — `st_order` de los guardados usa un `id_status` de otro tipo de transacción

Variante local de la H2 de La Tortuga, **con distinto reparto**:

| Registro | `st_order` | Fila de `statuses` que resuelve |
|---|---:|---|
| Nuestro **enviado** 39797 | **1** | `(1, ped)` = "Enviado" → ✅ **correcto en difranca** |
| Nuestro **guardado** 51 | **4** | `(4, **inv**)` = "Enviado" → ⚠ tipo ajeno |
| Los otros 12 guardados de DDHP_A12 | **2** | `(2, **cob**)` = "Enviado" → ⚠ tipo ajeno |

En `"order"` el valor es correcto (a diferencia de alipascua, donde el 1 era `dep`). El desvío está en
`order_saved`, y además **no es consistente consigo mismo**: el nuestro grabó 4 y los históricos 2.
Hoy no produce error visible porque las tres filas se llaman "Enviado".

### ✅ Comprobado y descartado — no es defecto

- **Listado de guardados "incompleto":** la vista con `Status=Guardado` mostró **1 fila** frente a **13**
  `order_saved` de DDHP_A12 en BD. **No es un defecto:** los otros 12 son de 2024/2025 y de julio, fuera
  del rango de fechas por defecto (`01/08–10/08`). Verificado uno por uno antes de reportarlo.
- **`salesman_view` (H1 de La Tortuga):** no se midió en pedidos enviados; queda pendiente.

---

## Patrones / selectores nuevos

### Alta de pedido — mapa de controles confirmado en El Yaque `[difranca-20260810]`

Coincide con el mapa de La Tortuga salvo donde se indica. Prefijo de cabecera **`form:j_idt127`** (⚠ `j_idt*`,
**anclar por sufijo**):

| Sufijo | Control | Nota de esta playa |
|---|---|---|
| `:idEnterprise_*` | Empresa | **3 opciones y EDITABLE** (en La Tortuga era fija con 1) ⇒ `enterpriseEnabled=true` |
| `:idSalesmaView_*` → **`:idSalesmaView2_*`** | Vendedor | 18 opciones; muta al sufijo `2` tras la 1ª línea |
| `:idClient_*` → **`:idClient2_*`** | Cliente | **1 opción hasta elegir vendedor; luego 136** |
| `:idCurrency_*` → `:idCurrency2_*` | Moneda | 🔴 **arranca en `1` = BSD**, igual que el filtro de la lista |
| `:listaPrecio_*` → `:listaPrecio2_*` | Lista de precio | autocompleta `Precio 01` (`value` = **`6`** = `id_list`) |
| `:condPago_*` | Condición de pago | 10 opciones; autocompletó `Credito a 30` (**no** `Contado`) |
| `:orderType_*` → `:orderType2_*` | Tipo de pedido | ⚠ **una sola opción real: `PEDIDO ESTANDAR`** (`2`) |
| `:Sucursal_*` | Sucursal | autocompleta con la dirección del cliente |
| `:txtNumOrden` · `:txtResponsable` · `:txtComentario` | — | `txtComentario` es **`<textarea>`** |
| `:dateB_input` | Fecha del pedido | **`disabled`** |
| `:dateF_input` | Fecha de despacho | editable, default **hoy** |

✅ **Reconfirmado:** tras agregar la 1ª línea, los combos de cabecera **mutan al sufijo `2`**. Un lector que
busque solo `idClient_label` no encuentra nada. **Leer ambos** (`suf` y `suf+'2'`).

**Fila de resultado de búsqueda** — `form:tablaOrder:<i>:…`, ids `j_idt*` **corridos** respecto de La Tortuga:

| ID | Control | Estado en El Yaque |
|---|---|---|
| `:j_idt248_*` | Lista de precio de la línea | `Precio 01` |
| `:j_idt252_*` | **Unidad** | ⚠ **`Unidad` (`22`)**, no `BULTO`/`UNIDAD` |
| `:j_idt256_*` | IVA | `0%` / `16%`, default **`0%`** |
| `:j_idt260_*` | **Descuento de línea** | 🔑 **SOLO el placeholder — sin ninguna opción** |
| `:j_idt264_*` | Almacén | 85 opciones, default **`Principal`** → `co_warehouse` `001` |
| `:j_idt276` | **`Agregar`** | |
| **`:qtyPedido_input`** | **CANTIDAD** | aparece **solo después** de `Agregar` |
| `:quProdUnit` | (contenedor de unidad) | presente desde el inicio, **no** es la cantidad |

🔴 **`form:tablaOrder` es el resultado de la BÚSQUEDA, no el carrito, y se reindexa en cada `Buscar`.**
El producto recién buscado queda siempre en **`:0:`** — pero **tras agregarlo, la tabla pasa a listar los
productos ya cargados** y los índices se mueven. **Verificar el código de producto dentro de la fila antes de
escribir la cantidad**, nunca confiar en el índice:

```js
let h = document.querySelector('#form\\:tablaOrder\\:'+i+'\\:qtyPedido_input');
for (let k=0; k<8 && h.parentElement; k++) { h = h.parentElement; if (/CODPROD/.test(h.textContent)) break; }
```

### 🔴 El modal `msjConfirmVarChange` NO se cierra con `.click()` desde JS

```js
// ✗ NO funciona: el diálogo y su máscara siguen en display:block
dialog.querySelector('button').click();
// ✓ SÍ funciona: click real de Playwright
browser_click('#form\\:msjConfirmVarChange button:has-text("No, Regresar")')
```

Se verificó con `getComputedStyle(d).display === 'block'` y con la máscara
`form:msjConfirmVarChange_modal` todavía presente tras el `.click()` JS. **Un guión que lo cierre por JS se
queda bloqueado sin darse cuenta.** Reconfirma además el anti-patrón de `offsetParent`.

### 🔑 Guardar / Enviar y el ciclo de vida (medido en El Yaque)

```
Nuevo Pedido → [cabecera + líneas]
   ├─ Guardar → order_saved (st_order=4, procedencia='Denario Web')   ← NO toca "order"
   │             ↑ Editar desde form:pedidosSavedDT
   │             🔴 pero Editar NO devuelve las líneas ⇒ Enviar bloqueado (N2)
   └─ Enviar  → "order" (st_order=1) + order_detail + order_detail_unit
                 y la fila de order_saved SE CONSUME (28 → 27)
   co_order (epoch) se CONSERVA de guardado a enviado: 1786380879181.0 en ambos
```

✅ **Reconfirmado:** `form:pedidosSavedDT` **sustituye** a `form:pedidosDT` con `Status=Guardado`; los `# Ref`
de ambas tablas son espacios de numeración distintos (guardado **51**, enviado **39797**).

### Diálogos: ids semánticos confirmados en este build

`form:msj` · `form:msjConfirmSave` · `form:msjConfirmSend` · `form:msjConfirmVarChange`
(botones internos `j_idt*` ⇒ **anclar por TEXTO**: `Guardar`, `Enviar`, `No, Regresar`, `Si, Borrar`).
`form:msj` solo se cierra por `.ui-dialog-titlebar-close`.

### ⚠ Los IDs `j_idt12/14/16` del login VUELVEN a estar en este build

`_comunes.md` los da por **derogados** desde `[difranca-20260807]`. **Hoy están otra vez:**
`j_idt12` (Usuario) · `j_idt14` (Clave) · `j_idt16` (Ingresar). **No los uses igual** — es la mejor prueba
de que son volátiles. Alternativa estable y usada acá: **`input[placeholder="Usuario"]` /
`input[placeholder="Clave"]`**, que resolvió limpio y no depende del árbol de accesibilidad.

### Filtros — reconfirmaciones

- ✅ **Un `browser_navigate` completo a `/pages/pedidos` SÍ resetea `Status`** a placeholder (`0`).
  Reconfirma el matiz de La Tortuga: los filtros persisten entre acciones ajax, **no** entre navegaciones.
- ✅ **Empresa vino correcta (`DDHP_A12`, la 1ª) en sesión nueva** y no se reseteó. Igual: verificar siempre.
- ⚠ **`idCurrency` vino en placeholder (`""`) en la LISTA** en sesión nueva — a diferencia del 07/08 que vino
  en `1` (BSD). ⇒ **no es determinista: leerlo siempre, nunca asumirlo.**
- ✅ El filtro `# Ref` = 39797 devolvió 1 fila exacta con la Empresa puesta.
- Rango de fechas por defecto: `01/08/2026 – 10/08/2026` (mes en curso hasta hoy). **Sí filtra** cuando no hay
  `# Ref`.

### Detalle: la regla DOBLE de lectura, reconfirmada

| Qué | Regla que funciona |
|---|---|
| Cabecera (`No. de Ref.`, `Código pedido`, `Plataforma`, `Estatus`, `Responsable`, `Comentario`…) | **hoja-siguiente** |
| Pie de totales (`Subtotal bruto`, `Descuento bonif.`, `Monto Base Pedido`, `…Conversion`, `Monto Total Pedido`, `Conversiòn Monto Total`) | **mismo padre** |

⚠ **Etiquetas del pie con espacio antes de los dos puntos:** `Descuento :`, `IVA :`,
`Conversiòn Monto Total :`. Un matcher `/^Descuento:$/` **no las encuentra** ⇒ normalizar con `/\s*:+$/`.
⚠ Confirmado: `Subtotal:` absorbe `Monto conv.` (encabezado de la columna siguiente) con hoja-siguiente.

Columnas de la tabla de líneas del detalle (`form:pedidosDT`, mismo id que la lista):
`N° · Cod. producto · Producto · Almacen · Lista de precio · Unidades pedidas · Monto Total · Monto conv.`
`Unidades pedidas` viene como **`"3 Unidad"`**; `Monto Total`/`Monto conv.` traen **dos valores por celda**
(`Precio base: … Subtotal: …`) ⇒ partirlas.

### Modelo de datos — entradas nuevas

| Tabla / columna | Para qué |
|---|---|
| **`conversion_type.date_conversion`** | 🔴 **de acá sale la tasa de la web (`max(date_conversion)`)** — ver N1 |
| `conversion_type.co_conversion_type` | codifica la fecha pretendida (`US$`+`DD`+`M`+`YYYY`+…) ⇒ **sirve para detectar fechas corruptas** |
| `currency_relation.nu_exchange_rate` | ⚠ vale `1.0000` en las 4 empresas (**stale, no es la tasa real**) — no usarlo como oráculo |
| `global_discount` | catálogo de descuento global — **VACÍO en difranca** (0 filas) |
| `product_unit.qu_unit` | **1.0000 en los 453 productos de DDHP_A12**; `DHVITAL01_A` sí tiene 10 y 12 |
| `order_detail_saved` | **0 filas en todo el tenant** — corrobora N2 |
| `price_list.id_list` | `6` = lista `01` (es el `value` del combo de lista de precio) |

---

## Pendientes / recomendado

1. 🔴 **N1 — corregir la fila de `conversion_type` con `date_conversion` = 2056** en las 3 empresas
   (ids 3443, 3445, 3447) **y validar en el producto** que no se acepte una fecha futura como tasa vigente.
   Mientras no se corrija, **todo pedido web de difranca sale ~4,1 % barato**.
2. 🔴 **N2 — arreglar la rehidratación de líneas en `Editar`.** Hasta entonces, avisar a la QA de que
   `Guardar` deja el pedido inservible y que el único camino es `Nuevo → líneas → Enviar`.
3. **Defecto #1 de La Tortuga: repetir en `DHVITAL01_A`** — es la única empresa de difranca con `qu_unit > 1`
   y por tanto la única donde el defecto puede manifestarse. En DDHP_A12 la prueba no es concluyente.
4. **H1 de La Tortuga (`salesman_view` oculta pedidos) — no se midió acá.** Vale la pena, es del producto.
5. **Revisar si el móvil también lee `max(date_conversion)`**: hoy no adopta la fila corrupta, pero conviene
   saber si es por diseño o por casualidad.

---

*Agente web · alta de pedidos · difranca / El Yaque · 2026-08-10 · escritura autorizada por QA · 1 pedido creado (39797)*
