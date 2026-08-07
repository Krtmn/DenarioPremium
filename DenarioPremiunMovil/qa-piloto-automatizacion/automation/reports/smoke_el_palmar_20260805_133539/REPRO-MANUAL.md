# Guía de reproducción manual — hallazgos de el_palmar (2026-08-05)

Para que QA confirme cada hallazgo a mano antes de reportarlo.

**Entorno:** cliente **el_palmar** · playa **Isla Coche** · empresa **CENTRAL EL PALMAR, S.A.** (`1002`)
Móvil: APK v1.0 / db_version 19, usuario **1276** (Dilcia Duarte, id_user 266)
Web: `http://denarioislacoche.ddns.net:8080/DenarioPremium` · tasa del día **652,9726 VES = 1 USD**

> 🔴 **Antes de buscar cualquier cosa en la web:** el filtro **Empresa arranca en `C.A. DESTILERIA YARACUY`**
> y **se resetea cada vez que entrás fresco a un módulo**. Si no lo cambiás a `CENTRAL EL PALMAR, S.A.`,
> los registros **no aparecen** y parece que no existen.

---

## M1 · La búsqueda de productos no normaliza tildes

**Severidad sugerida:** S2 — el usuario escribe el nombre bien y no encuentra el producto.

**Precondición:** app abierta, sesión iniciada, empresa CENTRAL EL PALMAR.

**Pasos:**
1. HOME → **Productos**.
2. En el buscador escribí **`AZUCAR`** (sin tilde). → Aparecen **8 productos**.
3. Limpiá el campo.
4. Escribí **`AZÚCAR`** (con tilde, que es **como la app misma escribe el nombre**:
   `AZÚCAR MONTALBAN REFINO PAPEL 20X1KG`). → **"No hay productos disponibles"**.

**Resultado esperado:** ambas búsquedas devuelven los mismos 8 productos.
**Resultado real:** con tilde devuelve 0.

**Qué capturar:** las dos pantallas, una al lado de la otra. El detalle que lo hace inobjetable es que el
**nombre que la app muestra lleva la tilde** — o sea, copiando el nombre de la propia pantalla, la búsqueda
falla.

**Nota técnica para el reporte:** no es el teclado. Se verificó que el `input` y el modelo interno
(`searchText`) contenían la `Ú` correcta. La app **normaliza el nombre del producto pero no el término
tecleado**, así que compara "AZUCAR…" contra "AZÚCAR" y no matchea.

---

## M2 · Pedidos ofrece Bs por defecto cuando la lista de precios no tiene precios en esa moneda

**Severidad sugerida:** S2 — el módulo parece roto ("no hay productos") sin ningún mensaje que lo explique.

**Precondición:** app abierta, empresa CENTRAL EL PALMAR.

**Pasos:**
1. HOME → **Pedidos** → nuevo pedido.
2. Cliente: **RON SANTA TERESA** (`1000000803`). Aceptá la alerta de deuda vencida.
3. Llená **Nro. de orden** (si queda vacío, las pestañas no habilitan — no confundir con el defecto).
4. **Sin tocar la moneda** (viene en **Bs/VES** por defecto), andá al **Tab Pedido** y abrí las categorías:
   - `Azucar` muestra el contador **8** → al entrar: **"No hay productos disponibles"**
   - `PVA` muestra **30** → al entrar: **"No hay productos disponibles"**
5. Volvé al **Tab General** y cambiá la **moneda a USD**. No toques nada más.
6. Volvé al **Tab Pedido** y abrí `Azucar` de nuevo → ahora **sí lista 6 productos**.

**Resultado esperado:** o bien los productos se listan igual, o bien la app avisa que en esa moneda no hay
precios cargados.
**Resultado real:** lista vacía y silenciosa, con el contador de la categoría diciendo 8.

**Qué capturar:** las dos pantallas del Tab Pedido (con Bs y con USD) y el selector de moneda mostrando el
valor por defecto.

**Dato duro para el reporte** (`price_list`, lista activa **Z12** de este cliente):

| Moneda | Filas de precio | Productos |
|---|---|---|
| **USD** | 13 | **7** |
| **VES** | **0** | **0** |

A nivel de toda la empresa 1002 hay 396 filas en USD (39 productos) y **1 sola en VES**, y esa vive en la
lista **Z01**, que este cliente no usa. Por eso con Bs lo esperado es 0.

**Dos matices que conviene incluir**, porque acotan el reporte y evitan que lo devuelvan:
- **El contador de la categoría (8, 30) es un rollup del subárbol** y no aplica el filtro de precio — por eso
  muestra 8 y lista 0. Contador y listado usan criterios distintos.
- **`PVA` sigue vacía incluso con USD**: sus 30 productos no tienen precio en Z12 en ninguna moneda. Eso **no
  es defecto**, es dato faltante.

---

## W1 · Se pierde `nu_amount_total` en el cobro con vuelto → la lista muestra "N/A"

**Severidad sugerida:** S2 — dato de dinero ausente en la pantalla de consulta.

**Dónde:** web → `/pages/cobros` (**la LISTA**, no el detalle).

**Pasos:**
1. Entrá a `/pages/cobros`. **Poné Empresa = CENTRAL EL PALMAR** y buscá.
2. Ubicá el cobro **27086** (o cualquiera de: 27076, 27077, 27082, 27085).
3. Mirá en su fila las columnas **`Monto conv.`** y **`Tasa conv.`** → dicen **`N/A`**.
4. **El contraste que lo prueba:** en la misma lista, ubicá el **27078**. Es el **mismo importe**
   (858,66 USD) sobre la **misma factura** (`0091009412`) que el 27082, y sí muestra
   `Monto conv. = 560.681,4527 VES`.
5. Abrí el **detalle** del 27086 → ahí la `Tasa de conversión` **sí sale bien** (652,9726).

**Resultado esperado:** la lista muestra el monto convertido y la tasa, como en cualquier otro cobro.
**Resultado real:** `N/A` en las dos columnas, solo en los cobros donde el pago excedió lo aplicado.

**Correlación:** 5 de 5 cobros con `nu_amount_total = 0` muestran `N/A`; los otros 20 del día, ninguno.

🔴 **El caso de control que lo vuelve difícil de discutir como "diseño":** los cobros **27086** y **27088**
son la **misma operación** —sobrepago con vuelto— hechos el **mismo minuto**, mismo cliente y mismo vendedor.
El 27088 (USD) **guarda el total 4.865,00** y el 27086 (VES) **guarda 0**. Si fuera el comportamiento
esperado, los dos guardarían 0.

**Causa raíz, para el comentario a desarrollo:** la lista mezcla dos orígenes —`Monto cobrado` sale de la suma
de pagos, pero `Monto conv.` sale de `collection.nu_amount_total_conversion` y **`Tasa conv.` se deriva**
(`Monto conv. / Monto cobrado`) en vez de leer `collection.nu_value_local`, **que está bien guardado**. El
dato correcto ya existe en la base: `collection_payment.nu_amount_partial_conversion = 869,8680`
(= 568.000 / 652,9726).

---

## W2 · Conversión huérfana: base en cero con conversión distinta de cero

**Severidad sugerida:** S2 — importe de dinero inventado en pantalla.

**Dónde:** web → detalle del cobro **27076**, tabla **Documentos Pagados**.

**Pasos:**
1. `/pages/cobros` → Empresa CENTRAL EL PALMAR → buscar **27076** → `Consultar`.
2. En la tabla de documentos, ubicá la fila del documento **`0091021104`**.
3. Compará dos columnas de esa misma fila:
   - **`Diferencia/Faltante`** = **`0,0000`**
   - **`Dif/Faltante conversión`** = **`49.234,1340 VES`**

**Resultado esperado:** si la base es 0, su conversión es 0.
**Resultado real:** conversión de 49.234,13 sobre una base de 0.

**Contraste dentro del mismo cobro:** la fila hermana (`0091025420`) sí es coherente: 10,0000 → 6.529,7260.

**El número, para el reporte:** 49.234,1340 = **75,4000 × 652,9726**. O sea, la conversión corresponde a un
valor de 75,40 que **no está en la celda base**.

⚠ **Importante para no mezclarlo con el defecto ya reportado:** **no** es el problema de dirección
(multiplicar en vez de dividir). Acá el cobro es en **USD**, donde multiplicar **es lo correcto**. El síntoma
es distinto: **base cero con conversión no cero**. Vale preguntar a desarrollo si entra en el mismo fix o es
aparte.

---

## W3 · El detalle del cobro no explica el excedente

**Severidad sugerida:** UX / presentación — los importes son correctos, pero la pantalla no cierra sola.

**Dónde:** web → detalle del cobro **27088**.

**Pasos:**
1. `/pages/cobros` → Empresa CENTRAL EL PALMAR → buscar **27088** → `Consultar`.
2. Leé el pie: **`Total Monto a pagar: 4.854,7200 USD`**.
3. Leé la tabla de pagos: **`4.865,0000 USD`**.
4. Buscá en la pantalla dónde se explica la diferencia de **10,2800** → **no está**:
   `Diferencia/Faltante` vale `0,0000` en **todas** las filas de documentos, y el pie no trae ninguna línea
   de diferencia.
5. Volvé a la **lista**: ahí sí aparece, en la columna **`Diferencia cobro`** (10,2800).

**Resultado esperado:** el detalle explica por qué se pagó más de lo aplicado.
**Resultado real:** el usuario ve dos números que no cuadran y ninguna línea que los concilie.

**Contexto que conviene explicar en el reporte** (para que no lo tomen por un error de cálculo): el excedente
**sí se registra correctamente**, como un **anticipo automático** — el cobro **27089**, con forma de pago
**`Prepago Automático`**, por exactamente **10,2800 USD**. El vínculo está en
`collection.co_original_collection`, pero **la web no lo muestra en ninguna pantalla**.

El mismo caso en Bs, con un número redondo que se explica solo:

```
Cobro 27086:  pagos 568.000,0000 - aplicado 560.681,4527 = 7.318,5473
Anticipo 27087:                                             7.318,5473
                                     560.681,4527 + 7.318,5473 = 568.000,0000  exacto
```

---

## W8 · En depósitos el banco muestra solo el código

**Severidad sugerida:** cosmético.

**Dónde:** web → detalle del depósito **Ref 3** (`/pages/depositos`).

**Pasos:**
1. `/pages/depositos` → Empresa CENTRAL EL PALMAR → buscar **3** → `Consultar`.
2. Campo **`Banco`** → muestra **`BP645`**, sin el nombre.
3. En la **misma pantalla**, mirá la tabla hija de cobros: su columna `Banco` muestra
   **`Venezuela Cepsa BV454`**, con nombre completo.

**Resultado esperado:** el mismo formato en ambos lugares (código + nombre).
**Resultado real:** la cabecera muestra solo el código; la tabla hija, código y nombre.

---

## W9 · El vendedor sale abreviado en clientes potenciales

**Severidad sugerida:** cosmético.

**Dónde:** web → `/pages/clientesPotenciales`.

**Pasos:**
1. Entrá a `/pages/clientesPotenciales`. **Empresa = CENTRAL EL PALMAR**, rango de fechas que cubra el
   **05/08/2026**.
2. Ubicá el cliente potencial **`Test-CLT-SMOKE-135439`** (# Ref **31**).
3. Columna **`Vendedor`** → muestra **`Dilcia`** (solo el nombre de pila), en la lista **y** en el detalle.
4. Contraste: abrí `/pages/devoluciones`, buscá la **Ref 73** → ahí el vendedor sale **`Dilcia Duarte`**.

**Resultado esperado:** el mismo nombre en los dos módulos.
**Resultado real:** clientes potenciales trunca al nombre de pila.

⚠ No afecta la identificación (la fila viene del filtro por vendedor), pero **puede confundir cuando hay dos
vendedores con el mismo nombre de pila**.

---

## Resumen para priorizar

| Hallazgo | Dónde | Impacto | Severidad sugerida |
|---|---|---|---|
| **W1** cobro con vuelto pierde el total | web · lista de cobros | dato de dinero ausente | **S2** |
| **W2** conversión huérfana | web · detalle de cobro | importe inventado | **S2** |
| **M1** búsqueda con tilde | móvil · productos | no encuentra escribiendo bien | **S2** |
| **M2** moneda por defecto sin precios | móvil · pedidos | módulo parece roto, sin mensaje | **S2** |
| **W3** excedente no explicado | web · detalle de cobro | confusión, importes correctos | UX |
| **W8** banco solo código | web · depósitos | cosmético | S3 |
| **W9** vendedor abreviado | web · clientes potenciales | cosmético | S3 |

---
*Generado por Claude Code · corrida `20260805_133539_smoke-completo` · 2026-08-06*
