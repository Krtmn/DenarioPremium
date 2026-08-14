# Web · COTEJO (`C##`) y MUESTREO BD↔WEB (`M##`) — difranca / El Yaque

`RUN_ID`: `smoke_difranca_20260810_main` · capa **WEB** · **2026-08-10** · read-only
Playa `http://denarioelyaque.ddns.net:8080/DenarioPremium` · build `main`
Empresas verificadas por TEXTO al entrar: `*DISTRIBUIDORA DIAZ HERNANDEZ *` (DDHP_A12) ·
`DIFRANCA C.A` (DIF_A12) · `DISTRIBUIDORA DH VITAL, C.A.` (DHVITAL01_A). **Guarda de tenant OK.**

> Archivo **nuevo**. No modifica `web.md`, `web-alta-pedidos.md` ni `web-adjuntos-detalle.md`.
> Ningún registro fue creado, editado ni borrado. Cero descargas de adjuntos ⇒ nada que barrer.

---

## Veredicto rápido

| Caso | Qué | Ref | Marca |
|---|---|---|---|
| `DW-COT-C01` | Pedido 2 líneas, US$, DDHP_A12 | **39798** | **WEB-OK** |
| `DW-COT-C02` | Pedido 1 línea, DHVITAL01_A — **defecto de unidades** | **39799** | **WEB-CALC-MISMATCH** 🔴 |
| `DW-COT-C03` | Pedido **55 líneas**, US$, DDHP_A12 | **39800** | **WEB-OK** (55/55) |
| `DW-COT-C04` | Inventario, lote QA0810 | **17** | **WEB-OK** |
| `DW-COT-C05` | Resto de pedidos de hoy (39797/39801/39802) | 3 refs | **WEB-OK** |
| `DW-COT-C06` | Devolución creada hoy | — | **WEB-N/A** (BD: 0 devoluciones hoy) |
| `DW-MUE-M01` | ¿La web invierte la conversión en `USD` (DIF_A12)? | 50 filas + 2 detalles | **WEB-OK — NO la invierte** |
| `DW-MUE-M02` | ¿La web usa la tasa corrupta de 2056 al MOSTRAR? | 64 filas | **WEB-OK — NO la usa** |
| `DW-MUE-M03` | **Pagos en BS sobre documentos en USD** | 21 de 33 filas | **WEB-CALC-MISMATCH** 🔴 **NUEVO** |
| `DW-MUE-M04` | Muestreo pedidos históricos (24–25/07) | 28 filas | **WEB-OK** (14/14 cotejadas) |
| `DW-MUE-M05` | Muestreo devoluciones (20–31/07) | 8 filas | **WEB-OK** (8/8) |
| `DW-MUE-M06` | Lista de cobros DIF_A12 por rango | 63 contados / **0 pintados** | **WEB-MISSING** (reproduce **H1**) |

---

## (1) ¿Llegaron completas y correctas las transacciones de hoy?

**Sí, las 6 llegaron y sus cifras de lista coinciden con BD 6/6.** Una de ellas llega **con el defecto de
dinero adentro** (39799).

BD dice que hoy se crearon **6 pedidos** (no 3) y **1 inventario**, y **0 devoluciones / 0 visitas**:

| Ref | Empresa | Moneda | Total BD | Total web | Conv. BD | Conv. web | Tasa | ¿Coincide? |
|---|---|---|---:|---:|---:|---:|---:|---|
| 39797 | DDHP_A12 | BSD | 14.289,9435 | 14.289,94 | 19,81 | 19,81 | **721,35** | ✅ (creado desde la **web**, ver nota) |
| **39798** | DDHP_A12 | US$ | 208,1200 | 208,12 | 156.524,9708 | 156.524,97 | 752,09 | ✅ |
| **39799** | DHVITAL01_A | US$ | 1.135,6800 | 1.135,68 | 854.133,5712 | 854.133,57 | 752,09 | ✅ *fiel a BD, pero BD está mal* |
| **39800** | DDHP_A12 | US$ | 1.925,8200 | 1.925,82 | 1.448.389,9638 | 1.448.389,96 | 752,09 | ✅ |
| 39801 | DDHP_A12 | BSD | 3.086.833,0706 | 3.086.833,07 | 4.104,34 | 4.104,34 | 752,09 | ✅ |
| 39802 | DDHP_A12 | US$ | 6.302,4000 | 6.302,40 | 4.739.972,0160 | 4.739.972,02 | 752,09 | ✅ |
| **inv 17** | DDHP_A12 | — | CHHCA240U ×12 exh | ídem | — | — | — | ✅ |

- **39797 pinta tasa `721,35`** — es la fila corrupta de `conversion_type` con `date_conversion = 2056`.
  Ya reportado como **N1** en `web-alta-pedidos.md`; acá solo se **confirma que el registro quedó grabado
  con esa tasa y la web la muestra tal cual**. Los otros 5 pedidos (todos de origen móvil) usan **752,09**.
- **Devoluciones: `WEB-N/A`.** No es sync diferida: en BD **no existe ninguna `return` creada hoy**
  (`da_created >= 2026-08-10` ⇒ 0 filas). No hay nada que esperar ni que buscar.

### Detalle campo a campo (los tres que se abrieron)

**39798** — cabecera y las **2 líneas** exactas contra `order_detail`:

| Línea | Producto | Unidades | Precio base | Subtotal | BD |
|---|---|---|---:|---:|---|
| 1 | ACPDT300 | `3 Caja` | 58,08 US$ | 174,24 US$ | `nu_price_base` 58,08 · `nu_amount_total` 174,24 ✅ |
| 2 | ACPDT300U | `7 Unidad` | 4,84 US$ | 33,88 US$ | 4,84 · 33,88 ✅ |

Σ líneas = 208,12 = `Monto Base Pedido` = `Monto Total Pedido` ✅ · conversión 156.524,97 BSD ✅ ·
`Código pedido` = `1786381893278.0` = `co_order` ✅ · comentario `Test-PED-SMOKE-132200` ✅.

**39800** — **las 55 líneas se renderizan**, numeradas 1…55, **sin paginación**.
Σ subtotales pintados = **1.925,82** = cabecera ✅ · Σ conversiones = 1.448.389,97 vs 1.448.389,96
(**0,01** de redondeo acumulado en 55 filas, dentro de tolerancia).

**inv 17** — `Código inventario` `1786389679982.0` ✅ · CHHCA240U · `Depósito = -` y
`Exhibición = 12.00 Unidad` (así se expresa `ubicacion='exh'`) ✅ · **Lote `QA0810`** ✅ ·
**Fecha expiración `31/12/2026`** ✅ · fecha 15:21:19 = `da_client_stock` 19:21:19 UTC −4 ✅.

> 🔑 **Corolario sobre H5** (`inventarios DDHP_A12 = 0 de 2`): el inventario **17 SÍ aparece** (1 contado /
> 1 pintado) y se abre sin problema. Su vendedor es `Jose Raad` (`co_user` 206), que **sí está en
> `salesman_view`**. ⇒ **H5 no es "el módulo está vacío": es exactamente el síntoma de H3**
> (`salesman_view` oculta los registros de vendedores dados de baja). Conviene **acotar la redacción de H5**
> para que no se lea como un módulo roto — se arregla arreglando H3.

---

## (2) 🔴 Cómo se ve el 39799 del lado administrativo — **peor que en el móvil**

**La web repite el error Y ADEMÁS lo vuelve indiagnosticable.**

### Lo que hay en BD

`order_detail` 181965 · CHBK300 · `nu_price_base` **43,68** · `nu_amount_total` **1.135,68**
y **dos** filas en `order_detail_unit`, ambas con `qu_order = 2`:

| `co_product_unit` | `qu_unit` | `qu_order` | `nu_base_total` | Debería ser |
|---|---:|---:|---:|---:|
| `CHBK300CAJAS` | 1 | 2 | **87,36** ✅ | 2 × 43,68 = 87,36 |
| `CHBK300UNID` | **12** | 2 | **1.048,32** ❌ | 2 × (43,68/12) = **7,28** |

El factor `qu_unit = 12` se aplicó **multiplicando el precio** en vez de dividirlo.

### Lo que muestra la web

**Una sola línea**, con **un solo precio**:

```
N° 1 · CHBK300 · CHAMPU BBK LLUVIA DE KERATINA 300 MLX12
Unidades pedidas:  2 CAJAS 2 UNIDADES
Monto Total:       Precio base: 43,68 US$   Subtotal: 1.135,68 US$
Monto conv.:       Precio base: 32.851,29 BSD   Subtotal: 854.133,57 BSD
```

🔴 **Ese renglón no cierra con ninguna aritmética que un administrativo pueda hacer en pantalla.**
Con los números visibles (2 + 2 unidades × 43,68) el máximo defendible es **174,72 US$**. La web muestra
**1.135,68**. El `×12` que produce la diferencia **no aparece por ningún lado**: la web **colapsa las dos
filas de `order_detail_unit` en un renglón** y muestra **únicamente el precio de la CAJA**.

⇒ En el móvil el defecto al menos era **visible** (dos renglones, 87,36 vs 1.048,32). **Del lado
administrativo el defecto es invisible como causa y solo se manifiesta como un total inflado**, sin
ninguna pista de por qué. Es el peor de los dos mundos para quien tiene que aprobar el pedido.

### Cuánto dinero

| | US$ | BSD @ 752,09 |
|---|---:|---:|
| Correcto (87,36 + 7,28) | **94,64** | 71.177,80 |
| Facturado (web y BD) | **1.135,68** | 854.133,57 |
| **Exceso** | **+1.041,04** | **+782.955,77** |

**12,0× el pedido correcto.** Visto por unidad, la UNID se cobró a **524,16 US$** en vez de **3,64** ⇒
error de **144×** (= 12²), porque el precio de lista **ya es** el de la caja (43,68 = 3,64 × 12) y encima
se lo volvió a multiplicar por 12.

### 💎 El control limpio está en el mismo lote de hoy

En **DDHP_A12** la misma familia de 300 ml se modela como **dos SKU separados**, y ahí el precio unitario
es **exacto**. Del pedido **39800**, líneas 1 y 2:

```
ACBA300   1 Caja     43,68 US$        ← idéntico precio de caja que CHBK300
ACBA300U  1 Unidad    3,64 US$        ← 43,68 / 12  ✅ EXACTO
```

⇒ **El negocio espera 3,64.** El defecto no es de datos maestros ni de criterio comercial: es el
mecanismo **multi-unidad** (`product_unit.qu_unit > 1`) el que rompe, y **`DHVITAL01_A` es la única empresa
del tenant que lo usa** (7 productos, `qu_unit` 10 y 12).

> ✅ **Esto cierra el pendiente #3 de `web-alta-pedidos.md`** ("repetir el defecto #1 de La Tortuga en
> `DHVITAL01_A`, única empresa con `qu_unit > 1`; en `DDHP_A12` la prueba no es concluyente porque todo
> vale 1"). **Ya está repetido y FALLA.** La evidencia positiva parcial del 39794 no alcanzaba: ese pedido
> era de `DDHP_A12`, donde `qu_unit` siempre es 1.

**Marca `WEB-CALC-MISMATCH`.** Defecto de dinero, severidad **alta**, con impacto directo en facturación.

---

## (3) ¿La web invierte la conversión en `USD` como el móvil? — **NO**

**Respuesta corta: no. El defecto de la conversión invertida es exclusivo del móvil.**

Medido en **DIF_A12**, la empresa que opera en `USD` (la del cobro 21839):

| Nivel | Qué se midió | Resultado |
|---|---|---|
| **Lista** | 50 filas pintadas, rango 01/07–06/08 | **50/50 correctas** |
| **Detalle 21839** | pie + 3 pagos + documentos pagados | **todo correcto** |
| **Detalle 21786** | pie + pago + documento | conversión correcta |

Cobro **21839** (el del reporte móvil), lado web:

```
Monto total base            196,04 USD   →  147.439,72 BSD      (196,04 × 752,09 ✅)
Total Monto a pagar         196,04 USD   →  147.439,72 BSD      ✅
Tasa de conversión          752,09
Pagos:  100,00 USD → 75.209,00 BSD  ·  90,00 USD → 67.688,10 BSD  ·  6,04 USD → 4.542,62 BSD
        Σ = 147.439,72 BSD  ✅
```

**El móvil mostraba `0,26`** (dividía) para este mismo cobro. **La web muestra `147.439,72`**, que es además
exactamente lo que guarda BD (`nu_amount_total_conversion = 147439.7200`).

Y la dirección se elige bien **en ambos sentidos**, en la misma lista y con el mismo rótulo de moneda:

| Ref | Moneda doc | Monto | Tasa | Conv. web | Operación |
|---|---|---:|---:|---:|---|
| 21786 | USD | 968,60 | 737,88 | 714.710,57 BSD | **×** ✅ |
| 21772 | BSD | 79.783,17 | 745,64 | 107,00 US$ | **÷** ✅ |
| 21715 | BSD | 48.436,77 | 745,64 | 64,96 US$ | **÷** ✅ |
| 20884 | BSD | 1.207.632,79 | 621,53 | 1.943,00 US$ | **÷** ✅ |

⇒ **`USD` vs `US$` no cambia el comportamiento de la web.** El rótulo distinto de `DIF_A12` es cosmético
del lado administrativo. **La corrección hay que hacerla en el móvil, no acá** — y conviene decirlo así en
el informe a difranca, porque la web es la que usa administración para conciliar.

---

## (4) Divergencias sistemáticas del muestreo

### 🔴 `M03` — **NUEVO** · Pagos en bolívares sobre documentos en dólares se rotulan y calculan como dólares

**El hallazgo de mayor impacto del muestreo.** Cobro **21786** (DIF_A12, USD, tasa 737,88):

```
Documento pagado:   FACT5000003328   Monto doc 968,60 USD   Saldo 968,60   Monto a pagar 968,60 USD
Total Monto a pagar:                 968,60 USD  →  714.710,57 BSD        ✅ correcto
Pago (1, Transferencia, BANCAMIGA):  601.161,08 USD  →  443.584.737,71 BSD    🔴
Diferencia cobro (lista):            -600.192,48 USD
Diferencia cambiaria (lista):        -442.870.027,14 BSD
```

- El pago real fueron **601.161,08 bolívares** (≈ **814,71 USD** a 737,88 — un abono parcial perfectamente
  plausible contra una factura de 968,60 USD). La web lo rotula **`601.161,08 USD`**.
- La aritmética es **internamente consistente**: `968,60 − 601.161,08 = −600.192,48`. El problema no es el
  cálculo: es que **se restan dos monedas distintas**.
- Después **vuelve a convertir** ese número ya bolivarizado: `601.161,08 × 737,88 = 443.584.737,71 BSD`.
  **Doble conversión.**

**Causa raíz confirmada en BD:** la tabla **`collection_payment` no tiene ninguna columna de moneda.**
Guarda `nu_amount_partial = 601161.0800` y `nu_amount_partial_conversion = 443584737.7100` a secas ⇒
**el modelo no puede representar "pago en BS contra un cobro en USD"** y asume que el pago está en la
moneda del cobro. La web es un **espejo fiel** de ese dato: el defecto es del modelo/cálculo, no del render.

**Incidencia en el muestreo (50 filas pintadas, DIF_A12, 01/07–06/08):**

| Documentos | Con diferencia absurda (\|dif\| > 100× el total) | % |
|---|---:|---:|
| En **USD** (33 filas) | **21** | **64 %** |
| En **BSD** (17 filas) | **0** | 0 % |

**Cero falsos en BSD** ⇒ la divergencia está **sistemáticamente atada a los documentos en USD**, no
dispersa. Ejemplos, con la magnitud del disparate:

| Ref | Total por cobrar | Diferencia cobro (web) | Diferencia cambiaria (web) | Factor |
|---|---:|---:|---:|---:|
| 21216 | 7.947,62 USD | **−5.085.642,25 USD** | **−3.682.004.989,00 BSD** | 640× |
| 20913 | 961,18 USD | −533.652,82 USD | −341.377.708,95 BSD | 555× |
| 21497 | 786,48 USD | −278.132,16 USD | −206.438.033,12 BSD | 354× |
| 21786 | 968,60 USD | −600.192,48 USD | −442.870.027,14 BSD | 620× |
| 21723 | 107,88 USD | −69.327,78 USD | −51.762.200,38 BSD | 642× |

**Impacto administrativo:** cualquier reporte de cuentas por cobrar sobre DIF_A12 queda inservible —
estos cobros se leen como si el cliente hubiera **sobrepagado cientos de miles de dólares**. Y la
"Diferencia cambiaria" llega a **miles de millones de bolívares** en un solo renglón.

### ✅ `M02` — La tasa corrupta de 2056 **NO contamina la visualización de registros viejos**

Pregunta abierta de la pista 2: *la web agarra la fila `date_conversion = 2056` (721,35) al **crear**;
¿también al **mostrar** registros históricos?* → **No.**

- **Cobros (50 filas, 01/07–06/08):** cada fila pinta **su propia** `nu_value_local`. Se observaron
  **22 tasas distintas** — 737,88 · 745,64 · 746,63 · 744,23 · 742,81 · 742,23 · 737,23 · 736,93 · 727,45 ·
  732,48 · 725,75 · 724,00 · 709,69 · 700,22 · 685,94 · 674,93 · 667,05 · 652,97 · 639,70 · 623,02 ·
  621,53 · 560,38. **`721,35` no aparece ni una vez.**
- **Pedidos (14 filas cotejadas del 24–25/07):** todas pintan **742,23**, exactamente su `nu_value_local`.
- Contraste: el pedido **39797**, *creado desde la web hoy*, **sí** quedó con **721,35** y la web lo muestra.

⇒ **N1 está bien acotado: es un defecto de ALTA, no de consulta.** El daño histórico se limita a los
registros creados desde la web mientras la fila corrupta exista; **lo ya grabado se muestra bien**. Vale la
pena decirlo explícitamente en el informe, porque acota mucho el trabajo de remediación.

### ✅ `M04` / `M05` — Pedidos y devoluciones históricos: sin divergencias

- **Pedidos 24–25/07, DDHP_A12:** 28 contados / 28 pintados. Cotejadas **14/14** contra BD
  (`# Ref`, `Total items`, `Monto Base`, `Monto Total`, `Monto conv.`, `Tasa`): **coincidencia exacta**.
- **Devoluciones 20–31/07, DDHP_A12:** 8 contados / 8 pintados. Los **8 refs**, fechas y clientes coinciden
  con BD **8/8** (874, 873, 872, 870, 869, 868, 867, 865).
  La columna `Estatus` sale **vacía en las 8** — es **H6**, ya reportado, no se re-levanta.

### 🔁 `M06` — Reproducción de **H1** a nivel de rango (no solo por `# Ref`)

Con Empresa `DIFRANCA C.A` y rango **01/07–10/08**: **63 contados / 0 pintados**. Al recortar el rango a
**01/07–06/08** (que deja fuera los cobros IGTF 21836 y 21843): **56 contados / 50 pintados**.

⇒ Confirma **H1** con un mecanismo más amplio del que se había medido: **no hace falta filtrar el cobro
IGTF por `# Ref` — basta con que uno caiga dentro del rango para que se vacíe la lista entera.** Es una
agravante de H1 que conviene sumarle: **la lista de cobros de una empresa entera se apaga por un solo
registro IGTF en el período**, que es el caso normal de uso (abrir el mes en curso).

**Workaround para futuras corridas:** acotar el rango para excluir IGTF, o cotejar cobro por cobro con
`# Ref`. Ambos verificados hoy.

---

## (5) Defectos nuevos con evidencia

| id | Severidad | Descripción | Evidencia |
|---|---|---|---|
| **`PED-UNIDAD-FACTOR-INVERTIDO`** | 🔴 **alta — dinero** | En productos multi-unidad (`product_unit.qu_unit > 1`) el factor de unidad **multiplica** el precio en vez de dividirlo: la UNID se cobra a `precio_caja × qu_unit` (**144×** el correcto). Único tenant afectado: `DHVITAL01_A` | Pedido **39799**: 2 UNID `CHBK300` = 1.048,32 US$ en vez de 7,28; total 1.135,68 vs **94,64** correcto (**+1.041,04 US$ / +782.955,77 BSD**). Control en el mismo día: `ACBA300U` de `DDHP_A12` = 3,64 = 43,68/12 ✅ |
| **`PED-LINEA-MULTIUNIDAD-NO-AUDITABLE`** | 🟠 media | La web **colapsa las N filas de `order_detail_unit` en un solo renglón** y muestra **un único precio base** (el de la CAJA). El subtotal resultante **no es derivable de nada visible en pantalla** | 39799: `2 CAJAS 2 UNIDADES` @ `43,68 US$` con `Subtotal 1.135,68 US$`; con los datos en pantalla el máximo derivable es 174,72 |
| **`COB-PAGO-MONEDA-MIXTA`** | 🔴 **alta — dinero** | Los pagos **no tienen moneda propia** (`collection_payment` sin columna de moneda): un abono en BS contra un cobro en USD se rotula **USD** y se **vuelve a convertir**, arruinando `Diferencia cobro` y `Diferencia cambiaria` | **21 de 33** documentos USD de DIF_A12 en el muestreo (0 de 17 en BSD). Peor caso 21216: `−5.085.642,25 USD` / `−3.682.004.989,00 BSD`. Trazado end-to-end en 21786 |
| **`COB-LISTA-RENDER-VACIO` (agravante de H1)** | 🔴 bloqueante | La lista se vacía **por rango**, no solo al filtrar el IGTF por `# Ref`: un único cobro IGTF dentro del período apaga toda la grilla | DIF_A12 01/07–10/08 → **63 / 0**; 01/07–06/08 (sin IGTF) → **56 / 50** |

### Correcciones sugeridas a hallazgos existentes (no son defectos nuevos)

- **H5** (`inventarios DDHP_A12 = 0 de 2`) — **acotar**: el inventario **17** (vendedor en `salesman_view`)
  **sí se ve y se abre**. H5 es una manifestación de **H3**, no un módulo roto.
- **N1** (tasa 2056) — **acotar a la ALTA**: verificado que **no** afecta la visualización de históricos
  (64 filas, 22 tasas distintas, `721,35` ausente).

---

## Notas de método y de selectores (para la memoria web)

- 🟡 **El `.ui-selectonemenu-label` de Empresa puede quedar DESINCRONIZADO del `<select>` espejo cuando el
  `<li>` se clickea por JS.** Medido en `/pages/cobros`: `value = "3"` (DIF_A12) con la etiqueta visible en
  `*DISTRIBUIDORA DIAZ HERNANDEZ *`, **estable** (no era un transitorio: se releyó en llamada aparte).
  Con **click real de Playwright** sobre `[id$=":idEnterprise_label"]` y luego sobre el `<li>`, **los dos
  quedaron de acuerdo**. ⚠ **No se reporta como defecto de producto** — el disparador es el click sintético.
  ⇒ **Regla:** para cambiar Empresa usar **click real**, y verificar **label Y value** antes de `Buscar`.
- 🔴 **`\b39798\b` NO matchea la celda `# Ref`.** El texto viene con el encabezado pegado (`"# Ref39798"`)
  y **no hay frontera de palabra entre `f` y `3`**. Anclar con
  `td[i].textContent.replace(/\s+/g,'').includes(ref)` sobre la **columna** de `# Ref`, no con `\b`.
- **Login:** los ids **`j_idt12` / `j_idt14` / `j_idt16` volvieron a existir** en este build. Se usó igual
  `input[placeholder="Usuario"]` / `input[placeholder="Clave"]` / `button:has-text("Ingresar")`, que
  resolvieron 100 %. Confirma que esos ids son **volátiles**: no anclarlos nunca.
- **`detalleCobro`**: la tabla de pagos volvió a **`form:j_idt177`** (había sido 178 el 07/08). Tercera
  oscilación registrada ⇒ anclar por columnas `['Forma de pago','Monto cobrado']`, como ya manda la doc.
- **Columnas de la lista de cobros (17, no 14)** — las tres últimas no estaban documentadas:
  `… Total por cobrar · Diferencia cobro · Monto conv. · **Por cobrar conv.** · **Diferencia cambiaria** ·
  **Tasa conv.**`. `Diferencia cambiaria` es la que amplifica `M03`.
- **El ajax de Empresa NO siempre repuebla las fechas:** seteadas **antes** del click real, sobrevivieron
  (`01/07/2026`–`10/08/2026` intactas). La regla de releerlas justo antes de `Buscar` sigue siendo la
  correcta, pero el repoblado **no es determinista**.
- **`detallePedido` de un pedido de 55 líneas no pagina**: las 55 salen en el `tbody`, sin paginador.
- Reconfirmado: **`Conversiòn Monto Total` absorbe el `N°`** y **`Comentario` vacío absorbe
  `Descargar adjuntos`** (en `detalleInventario`) con la regla hoja-siguiente ⇒ usar padre-primero para el
  pie y descartar textos de botón/encabezado.
- **N4 reconfirmado** en 39798/39799/39800 (los 6 importes en cero salen **en blanco** en `detallePedido`).
  Ya reportado; no se re-levanta.

## Higiene

**Cero descargas.** No se pulsó `Descargar adjuntos` en ningún caso ⇒ no hubo ZIP ni adjuntos de producción
en disco. Verificado al cierre: sin `*.zip` / `*.pdf` / `*.jpg` en el cwd y sin artefactos descargados en
`.playwright-mcp/` (solo `.yml`/`.log` de la propia herramienta) ni en `DenarioPremiunMovil\.playwright-mcp`
(inexistente). **Ninguna escritura en producción**: el único control tocado en una fila fue `Consultar`.

---

*Agente web `C##`/`M##` · 2026-08-10 · read-only · complementa `web.md`, `web-alta-pedidos.md` y
`web-adjuntos-detalle.md` sin modificarlos.*
