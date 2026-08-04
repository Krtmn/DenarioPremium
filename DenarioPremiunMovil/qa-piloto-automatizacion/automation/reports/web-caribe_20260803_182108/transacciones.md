# Verificación de despliegue — Playa **caribe** · Cliente COVADONGA · Módulo TRANSACCIONES

- **RUN_ID:** `20260803_182108_web-caribe`
- **Base:** `http://denariocaribe.ddns.net:8080/DenarioPremium`
- **Usuario:** `***` (bloque *USUARIO WEB ISLA COCHE Y LA TORTUGA*)
- **Empresa:** PROCESADORA DE ALIMENTOS COVADONGA,C.A — **única** (SQL: `COUNT(DISTINCT co_enterprise)=1`)
- **Oráculo BD:** `el_valle` — verificado al inicio: `order`=440 · `collection`=17 · `visit`=53 · `document_sale`=2.783
- **Guard de playa:** `verificarContexto(...,'caribe')` → `{ok:true, playa:'caribe'}`
- **Modo:** READ-ONLY (solo Consultar/Buscar/Limpiar/Columnas/paginación/orden)

> ⚠ Nota de navegación: las rutas de esta playa son **sin extensión** (`/pages/pedidos`).
> `/pages/pedidos.xhtml` devuelve **HTTP 404**. El login sí es `/pages/login.xhtml`.

---

## 1 · `/pages/pedidos`

### 1.1 Carga

| Aspecto | Valor |
|---|---|
| Abre | ✅ sin error de servidor |
| Rango por defecto | **01/08/2026 – 04/08/2026** |
| Registros por defecto | **2** (`PrimeFaces.widgets['form:pedidosDT'].cfg.paginator.rowCount`) |
| Empresa preseleccionada | PROCESADORA DE ALIMENTOS COVADONGA,C.A (código `00001`) |
| Prefijo de filtros | `form:j_idt115:` |

**Contraste SQL (rango por defecto):**

```sql
SELECT COUNT(*) FROM "order" WHERE da_order >= '2026-08-01' AND da_order < '2026-08-05';  -- 2
```

→ **web 2 == SQL 2** ✅ (idéntico por `da_created`).
Rango real de datos en BD: `da_order` de **2026-05-18** a **2026-08-03**.

### 1.2 Aritmética de las 2 filas visibles (conversión USD → BS ⇒ *multiplica*)

| # Ref | Monto Total | Tasa | Monto conv. web | Cálculo | Δ |
|---|---|---|---|---|---|
| 440 | 32.034,6200 USD | 725,7500 | 23.249.125,4650 BS | 32.034,62 × 725,75 = **23.249.125,465** | **0,0000** ✅ |
| 439 | 147.287.333,0100 USD | 725,7500 | 106.893.781.932,0070 BS | 147.287.333,01 × 725,75 = **106.893.781.932,0075** | 0,0005 (redondeo) ✅ |

Dirección de conversión correcta (US$→BS multiplica). **Monto Base == Monto Total** en ambas (sin descuento).

### 1.3 🔴 El "`Buscar` ATRASADO" **no existe en esta playa**: es una consulta de ~25 s leída antes de tiempo

Éste es el hallazgo más importante de la pantalla, y **corrige el supuesto con el que entré a la corrida.**

**Primera medición (con esperas fijas de 3,5–4 s, que es como se midió en corridas anteriores):**

| Paso | Cómo se cambió la fecha | Rango en pantalla | `Buscar` nº | `rowCount` leído | SQL |
|---|---|---|---|---|---|
| A | escribiendo el input | 01/01–31/12/2026 | 1º | 2 | 440 |
| B | idem | 01/01–31/12/2026 | 2º | 440 | 440 |
| C | **clic en el calendario** (vía humana) | 01/06–31/12/2026 | 1º | 440 | 419 |
| D | idem | 01/06–31/12/2026 | 2º | 419 | 419 |

Esto reproduce exactamente el patrón "va un `Buscar` atrás"… **y es falso.**

**Segunda medición — instrumentando el fin real del ajax** (hook sobre `XMLHttpRequest.send` →
`loadend`, en vez de dormir un tiempo fijo), y fijando la fecha con la API del propio widget
(`widget.setDate()`, que sí respeta el estado interno del calendario):

| Rango | `Buscar` nº | **Duración real del ajax** | `rowCount` | SQL | ¿Coincide? |
|---|---|---|---|---|---|
| 01/07–31/12/2026 | **1º** | **25.118 ms** | **205** | 205 | ✅ **al primer intento** |
| 01/07–31/12/2026 | 2º | 24.419 ms | 205 | 205 | ✅ |
| 01/07–31/12/2026 | 3º | 24.438 ms | 205 | 205 | ✅ |
| 01/08–31/12/2026 | 1º | **4.040 ms** | 2 | 2 | ✅ |
| 01/01–31/12/2026 | 1º | **24.470 ms** | 440 | 440 | ✅ |

```sql
SELECT COUNT(*) FROM "order" WHERE da_order >= '2026-07-01';                             -- 205
SELECT COUNT(*) FROM "order" WHERE da_order >= '2026-06-01';                             -- 419
SELECT COUNT(*) FROM "order" WHERE da_order >= '2026-01-01' AND da_order < '2027-01-01'; -- 440
```

**Conclusión: el filtro de fechas es CORRECTO y acierta al primer `Buscar`.** Lo que ocurre es que la
consulta tarda **~25 segundos**; con una espera de 4 s se lee la tabla **antes** de que llegue la respuesta,
y lo que se ve es todavía el resultado anterior. De ahí la ilusión de "listado atrasado" — y de ahí también
que el resultado "atrasado" pareciera siempre coherente: **era** un resultado real, el de la consulta previa.

⚠ **Dos artefactos de automatización identificados de paso** (no son defectos del producto):
1. Escribir el input de fecha con `el.value = ...` **no funciona**: el widget PrimeFaces conserva su fecha
   interna y **revierte el input** en el siguiente ciclo. Hay que usar `widget.setDate()` o el calendario.
   Esta es la causa del paso A (el rango nunca llegó a cambiar).
2. `jQuery(document).ajaxComplete` **no dispara** en esta página; hay que enganchar `XMLHttpRequest`.

**Respuesta directa a la pregunta de QA:** ni al humano ni a la automatización les llega un resultado
equivocado. Al humano le llega **tarde** (~25 s mirando la tabla anterior sin indicador de carga visible).
El riesgo real no es leer un dato incorrecto de forma permanente, sino **actuar sobre la tabla durante esos
25 s creyendo que ya respondió**.

### 1.4 ⚠ Rendimiento — `Buscar` tarda ~25 s (CAR-PED-PERF)

| Filas devueltas | Duración del ajax |
|---|---|
| 2 | 4,0 s |
| 205 | 25,1 s |
| 440 | 24,5 s |

Escala con el volumen y ya en **440 registros** —un transaccional minúsculo— roza los 25 s. No hay overlay
ni spinner perceptible durante la espera. **Se reporta como observación de despliegue, no como defecto
funcional.** Todos los conteos de este informe se tomaron esperando el fin real del ajax.

### 1.5 Filtros — contraste contra SQL

Universo de prueba: rango **01/01/2026–31/12/2026** = **440** pedidos (todo el histórico de la playa).

| Filtro | Valor | Web | SQL | ¿? |
|---|---|---|---|---|
| Fechas | 01/08–04/08/2026 (defecto) | 2 | 2 | ✅ |
| Fechas | 01/07–31/12/2026 | 205 | 205 | ✅ |
| Fechas | 01/06–31/12/2026 | 419 | 419 | ✅ |
| Fechas | 01/01–31/12/2026 | 440 | 440 | ✅ |
| **# Ref** | `438` | 1 (ref 438) | 1 | ✅ |
| **# Ref** | `999999` (inexistente) | 0 + *"No se encontraron registros."* | 0 | ✅ |
| **Status** | Enviado | 440 | — | ✅ |
| **Status** | Por aprobar | 0 | — | ✅ |
| **Status** | Guardado | 0 | — | ✅ |
| **Tiene Adjunto** | SI | 7 | 7 | ✅ |
| **Tiene Adjunto** | NO | 433 | 433 | ✅ |
| **Tipo Pedido** | Nota de Entrega | 369 | 369 | ✅ |
| **Tipo Pedido** | Factura | 37 | 37 | ✅ |
| **Tipo Pedido** | PEDIDO ESTANDAR (opción 1 de 2) | 0 | — | ⚠ ver 1.6 |
| **Tipo Pedido** | PEDIDO ESTANDAR (opción 2 de 2) | 0 | — | ⚠ ver 1.6 |
| **Vendedor** | LEONARDO URPIN | 92 | 92 | ✅ |
| **Vendedor + Tipo** | LEONARDO URPIN + Nota de Entrega | **50** | 50 | ✅ **intersección** (la unión daría 411) |

```sql
SELECT COUNT(*) FILTER (WHERE has_attachments) si, COUNT(*) FILTER (WHERE has_attachments IS NOT TRUE) no
  FROM "order" WHERE da_order>='2026-01-01' AND da_order<'2027-01-01';      -- 7 / 433
SELECT id_order_type, COUNT(*) FROM "order" GROUP BY 1;                     -- 1→34 · 2→369 · 3→37
SELECT COUNT(*) FROM "order" WHERE id_user=322;                             -- 92
SELECT COUNT(*) FROM "order" WHERE id_user=322 AND id_order_type=2;         -- 50
```

**Particiones:**
- `Tiene Adjunto`: 7 + 433 = **440** ✅ cierra.
- `Status`: 440 + 0 + 0 = **440** ✅ cierra. *(No concluyente como discriminador: los 440 registros tienen
  el mismo estatus. Sí queda probado que el filtro se aplica — los otros dos valores devuelven 0, no el total.)*
- `Tipo Pedido`: 369 + 37 + 0 + 0 = **406 ≠ 440** ❌ **no cierra** → 1.6

**`Limpiar`:** deja **todos** los controles en neutro (Vendedor, Cliente, Tipo, Moneda, Status, Adjunto,
`# Ref`) y **repone el rango de fechas al defecto 01/08–04/08**, relanzando la búsqueda → 2 filas, que es el
resultado correcto para ese rango. **No** deja la pantalla sin resultados.
**`Limpiar` dos veces seguidas: NO desincroniza** (2 → 2, controles neutros, y un `Buscar` posterior sigue
dando 2 correcto). La trampa nº 4 documentada **no se reproduce** en esta pantalla.

**Estado JSF tras `page.goto()`:** en esta pantalla el panel **SÍ se resetea** al defecto (fechas 01/08–04/08,
selects en placeholder). La trampa nº 5 **no se reproduce** acá — pero se verificó el estado antes de cada
lectura igualmente.

### 1.6 ❌ CAR-PED-006 · `Tipo Pedido`: 34 pedidos (7,7 %) son inalcanzables por el filtro

El combo `Tipo Pedido` ofrece 4 opciones: `Nota de Entrega` (id 2), `Factura` (id 3) y **`PEDIDO ESTANDAR`
repetido dos veces** (ids 4 y 5). Ambos "PEDIDO ESTANDAR" devuelven **0** registros.

Sin embargo hay **34 pedidos cuyo tipo se muestra como "PEDIDO ESTANDAR"** en la columna *Tipo* de la lista.
Verificado abriendo el pedido **# Ref 3**: la lista lo rotula `PEDIDO ESTANDAR`, y ninguna opción del filtro
lo devuelve.

**Causa, con el oráculo de BD:**

```sql
SELECT id_order_type, na_order_type, id_enterprise FROM order_type ORDER BY 1;
--  1 | PEDIDO ESTANDAR | NULL   ← 34 pedidos apuntan aquí, pero NO aparece en el combo
--  2 | Nota de Entrega |    1
--  3 | Factura         |    1
--  4 | PEDIDO ESTANDAR |    1   ← en el combo, 0 pedidos (creado 28/07/2026)
--  5 | PEDIDO ESTANDAR |    1   ← en el combo, 0 pedidos (creado 28/07/2026)
```

La fila `id_order_type=1` tiene **`id_enterprise = NULL`**; el combo lista por empresa y por eso la omite.
Las filas 4 y 5 son duplicados creados el **28/07/2026** (fecha del despliegue) que ningún pedido usa.

**Efecto para el usuario:** el filtro `Tipo Pedido` no puede aislar 34 de 440 pedidos, y muestra dos opciones
idénticas e indistinguibles que siempre dan vacío. Es un **defecto de datos del despliegue**, no de la lógica
del filtro (que para los tipos bien formados acierta exacto). **Veredicto: `WEB-FIELD-MISMATCH`.**

### 1.7 ❌ CAR-PED-007 · Adjuntos: 5 de 7 pedidos marcados "con adjunto" no tienen el archivo en el servidor

El filtro `Tiene Adjunto` es **correcto**: devuelve exactamente los 7 pedidos con `has_attachments = true`
(refs **1, 2, 39, 196, 438, 439, 440**) — calce perfecto con la BD. *(El defecto conocido de
"Tiene Adjunto = SI sin adjuntos" **no** se reproduce como fallo del filtro.)*

Pero los **archivos** sí faltan. Sondeo HTTP directo sobre `/denario/resources/images/pedidos/`:

| Pedido | `nu_attachments` (BD) | Archivo en servidor | Galería "Ver adjuntos" |
|---|---|---|---|
| 440 | 1 | `440_0.jpeg` → **HTTP 200**, 1080×2340 | imagen real ✅ |
| 439 | 1 | `439_0.jpeg` → **HTTP 200** | imagen real ✅ |
| 438 | 3 | `438_0.jpeg` / `.jpg` / `.png` / `438_1` / `438_2` → **todos 404** | 2 `<img>` con `naturalWidth = 0` → **rotas** ❌ |
| 196 | 2 | 404 | ❌ |
| 39 | 2 | 404 | ❌ |
| 2 | 1 | 404 | ❌ |
| 1 | 1 | 404 | ❌ |

Los **únicos dos** que sí tienen archivo (439 y 440) son los creados **hoy 03/08/2026** desde el móvil.
Los 5 anteriores vienen en la copia de datos y **sus imágenes no se migraron a la playa nueva**.

**Efecto:** el usuario abre "Ver adjuntos" y ve una galería con marcos vacíos, sin mensaje de error.
**Veredicto: `WEB-FIELD-MISMATCH`** (dato de despliegue: falta el contenido de
`/denario/resources/images/pedidos/`).

### 1.8 Registros y detalle — aritmética explícita

**Detalle # Ref 440** (2 líneas) — cabecera completa por la unión de los dos lectores:

| Línea | Producto | Uds | Precio base | Subtotal | Cálculo |
|---|---|---|---|---|---|
| 1 | L0001 MOZZARELA ZEDEÑO | 2 PIEZA | 6.328,5400 | 12.657,0800 | 6.328,54 × 2 = **12.657,08** ✅ |
| 2 | L0008 QUESO MADURADO MI QUESO | 3 PIEZA | 6.459,1800 | 19.377,5400 | 6.459,18 × 3 = **19.377,54** ✅ |

- Σ líneas = 12.657,08 + 19.377,54 = **32.034,62** == `Monto Total Pedido` 32.034,6200 USD ✅
- Conversión (US$→BS ⇒ **multiplica**): 32.034,62 × 725,75 = **23.249.125,465** == 23.249.125,4650 BS ✅
- Σ conversión de líneas = 9.185.875,81 + 14.063.249,655 = **23.249.125,465** ✅ cuadra con la cabecera
- `Subtotal bruto` 32.034,62 − `Descuento bonif.` 0,00 = `Monto Base` 32.034,62 = `Monto Total` ✅

**Detalle # Ref 439** (51 líneas — prueba de suma larga):

- Σ de los 51 subtotales = **147.287.333,0100** == `Monto Total Pedido` 147.287.333,0100 USD ✅ (0 líneas ilegibles)
- Σ de las 51 conversiones = **106.893.781.932,0075** == `Monto Base Pedido Conversion` ✅
- ⚠ `Conversiòn Monto Total` muestra **106.893.781.932,0070** contra **…,0075** del campo de base:
  discrepancia de **0,0005 BS** entre dos campos que deberían ser iguales. Es **sub-céntimo** → redondeo de
  presentación, **no se reporta como defecto** (la regla del céntimo).

**Detalle # Ref 438**: usado para el chequeo de adjuntos (1.7). Cabecera y líneas legibles.

**Cabecera:** los dos lectores son efectivamente complementarios; unidos dan 24 campos poblados
(`No. de Ref.`, `Código pedido`, `Fecha del pedido`, `Vendedor`, `Empresa`, `Plataforma`, `Estatus`,
`Codigo/Nombre/Rif del cliente`, `Canal de distribución`, `Tipo de Pedido`, `Fecha de despacho`,
`Condicion de pago`, `Sucursal`, montos y `Coordenada de transacción`). **Ningún campo vacío inexplicado.**

### 1.9 Ordenamiento · paginación · columnas

**Ordenamiento** (leyendo las **filas reales**, no `aria-sort`). Columnas ordenables: `# Ref`,
`Fecha creación`, `Fecha envío`, `Monto Base`, `Monto Total`.

| Columna | Sentido | Primeras filas leídas | SQL | ¿? |
|---|---|---|---|---|
| `# Ref` | asc | 1, 2, 3 | — | ✅ |
| `# Ref` | desc | 440, 439, 438 | — | ✅ |
| `Monto Total` | asc | 25 (2,92) · 45 (4,00) · 270 (4,68) | 25 · 45 · 270 | ✅ |
| `Monto Total` | desc | 439 (147.287.333,01) · 1 (147.237.847,26) · 440 (32.034,62) | 439 · 1 · 440 | ✅ |

**Paginación:** 50 filas/página sobre `rowCount = 440`. Página 1 → 439, 1, … ; página 2 → 344, 339, … —
filas distintas, sin repetición ni pérdida, el total se mantiene en 440.

**Columnas:** el toggler abre con las **14** columnas listadas y todas marcadas; **cierra correctamente
volviendo a pulsar el toggler** (confirmado el patrón documentado: no se cierra con `Escape`).

### 1.10 Observaciones menores ("se ve raro")

1. **Datepicker en inglés:** rotula "January 2026", "June 2026" sobre UI en español. Cosmético.
2. **Etiqueta con tilde invertida:** el detalle dice **`Conversiòn Monto Total`** (acento grave) en vez de
   *Conversión*. Cosmético.
3. **Nombre de producto duplicado:** el pedido 440 muestra
   `MOZZARELA ZEDEÑO 1 X 3.5 KGMOZZARELA ZEDEÑO 1 X 3.5 KG`. **No es un defecto de la web:** el valor ya
   viene duplicado en la BD (`product.na_product`, 54 caracteres). Corresponde a **Datos Maestros**.
4. **Caracteres corruptos: NO se observan.** "ZEDEÑO", "Canal de distribución", "Condicion de pago" se
   renderizan bien. El defecto conocido de `?` en tildes/Ñ **no está presente** en esta playa.
5. **Montos inverosímiles en los datos:** los pedidos 1 y 439 rondan **147 millones de USD** (147.237.847,26
   y 147.287.333,01). La aritmética cuadra perfecto, así que **la web está bien**; es el dato de origen el que
   se ve raro. Se señala para que QA decida si es data de prueba.
6. **Doble clic en `Consultar`** abrió una vez un detalle con la cabecera **toda vacía** (labels presentes,
   valores en blanco). Al repetir con un solo clic el detalle cargó completo. Se anota como observación
   —interacción no estándar—, **no como defecto**.
7. **`Consultar` tarda:** abrir el detalle de 51 líneas tomó ~14 s sin indicador de progreso.

### 1.11 Veredicto `/pages/pedidos`

**`WEB-FIELD-MISMATCH`** — la pantalla **carga, filtra, consulta, ordena y pagina correctamente**, y toda la
aritmética verificada cuadra al céntimo. Dos hallazgos, ambos de **datos del despliegue**, no de lógica:
- **CAR-PED-006** — `Tipo Pedido` no alcanza 34 de 440 pedidos (catálogo `order_type` con `id_enterprise` nulo
  + dos duplicados vacíos creados el 28/07).
- **CAR-PED-007** — 5 de 7 adjuntos marcados en BD no tienen archivo en el servidor (galería rota).

Más una observación de rendimiento (**CAR-PED-PERF**, ~25 s por consulta) y la **corrección del supuesto del
`Buscar` atrasado**, que en esta playa no existe.

---

## 2 · `/pages/facturaciones`

### 2.1 Carga

| Aspecto | Valor |
|---|---|
| Abre | ✅ sin error |
| Rango por defecto | 01/08/2026 – 04/08/2026 |
| Registros por defecto | **0** — *"No se encontraron registros."* |
| ¿Es defecto? | **No.** SQL confirma **0** documentos en ese rango (el último es del **15/07/2026**) |
| Rendimiento | **rápido**: 1,7–2,8 s por consulta (contraste con los ~25 s de pedidos) |

`Tipo de documento` ofrece: `Consolidado` (TODOS) · `Facturas cobradas` (INVOICE) · `Pendientes por cobrar`
(DOCUMENT_SALE).

### 2.2 🔑 Corrección del baseline: `document_sale` = 2.783 incluye **2.048 borrados**

Al ampliar a 2020–2027 la web devuelve **735**, no los 2.783 del baseline. **No es que falten registros.**
Rastreando los ausentes de un día concreto (03/07/2026: web 4, BD 6) los dos faltantes fueron
`P00004522` y `P00004524`, y lo único que los distingue es **`co_operation = 'D'`** (borrado lógico).

Con ese `WHERE` la correspondencia es **exacta en las cinco mediciones**:

```sql
SELECT COUNT(*) FROM document_sale WHERE co_operation <> 'D' ...
```

| Rango | Web | SQL (`co_operation <> 'D'`) | SQL crudo (con borrados) |
|---|---|---|---|
| 2020–2027 (todo) | **735** | **735** ✅ | 2.783 |
| año 2026 | **609** | **609** ✅ | 2.615 |
| julio 2026 | **189** | **189** ✅ | 233 |
| 15/07/2026 | **28** | **28** ✅ | 28 |
| 08/07/2026 | **43** | **43** ✅ | 57 |

Además, para el 15/07/2026 se comparó el **conjunto completo** de los 28 códigos: **idéntico**, uno a uno.

⇒ **La web hace lo correcto: oculta los documentos borrados.** *(El defecto conocido de otra playa —"la WEB
muestra documentos borrados"— **no se reproduce** en este build.)*
⚠ **Para futuras corridas:** el baseline de `document_sale` debe medirse con `co_operation <> 'D'`.
**2.048 de 2.783 documentos (73,6 %) están borrados** — dato llamativo del contenido de esta playa.

### 2.3 Filtros — contraste contra SQL

| Filtro | Valor | Web | SQL | ¿? |
|---|---|---|---|---|
| Fechas | 4 rangos distintos | 735 / 609 / 189 / 28 | idem | ✅ |
| **Tipo doc.** | Pendientes por cobrar | 735 | 735 | ✅ |
| **Tipo doc.** | Facturas cobradas | 0 + mensaje limpio | tabla `invoice` **vacía** | ✅ |
| **Tipo doc.** | Consolidado (TODOS) | 735 | 735 + 0 | ✅ suma coherente |
| **# Ref** | `P00004707` | 1 (exacto) | 1 | ✅ |
| **Moneda** | USD | 735 | 735 | ✅ |
| **Moneda** | BS | 0 + mensaje limpio | 0 | ✅ |
| **Cliente** | ADRIAN EDUARDO CEDEÑO BLANCA (6319) | **10** | **10** | ✅ |
| **Vendedor** | LEONARDO URPIN | **0** | 0 (`id_user` NULL en los 2.783) | ⚠ ver 2.5 |

**Particiones:** `Moneda` USD 735 + BS 0 = **735** ✅ cierra · `Tipo doc.` 735 + 0 = **735** ✅ cierra.

**Verificación de contenido del filtro Cliente:** los 10 códigos y los 10 montos devueltos
(P00004689 640,81 · P00004387 154,07 · P00004316 703,74 · P00003736 453,47 · P00003601 509,30 ·
P00003295 107,85 · P00002867 638,74 · P00002456 2.417,64 · …) **coinciden uno a uno con la BD**, y todas las
filas pertenecen al cliente pedido. No es sólo que el conteo calce: el conjunto es el correcto.

**`Limpiar`:** deja todos los controles en neutro y repone el rango por defecto → la lista queda **vacía**.
Es exactamente la trampa nº 3 documentada, y acá **es comportamiento correcto**: SQL confirma 0 documentos
entre el 01 y el 04/08/2026. Se anota como **observación de usabilidad**: tras `Limpiar` el usuario ve una
pantalla vacía y debe ampliar la fecha; no hay ningún aviso que lo explique.

### 2.4 Registros y consultas — `WEB-N/A`

**No hay ningún detalle abrible en esta pantalla.** Los 50 botones `Consultar` de la primera página (y los 10
del filtro por cliente) están **`disabled`**, en las 735 filas, todas de tipo *Pendientes por cobrar*.

Contrastado con BD: la tabla **`invoice` tiene 0 filas**, así que no existe ningún documento de tipo
*Facturas cobradas*, que es el único que tendría detalle. **No es un defecto: es ausencia de datos.**
⇒ El punto "abrir 3–5 detalles" queda **`WEB-N/A`** para esta pantalla, confirmado contra la BD.

*(Nota: acá el `disabled` no se usó como prueba de ausencia de adjuntos —eso está prohibido—, sino como
observación de que el detalle no es alcanzable; la afirmación de fondo se sostiene en `invoice = 0 filas`.)*

### 2.5 ⚠ CAR-FAC-005 · La columna y el filtro `Vendedor` están inutilizables (dato)

La columna **Vendedor** aparece **vacía en las 735 filas**, y el combo `Vendedor` ofrece **14 vendedores** de
los cuales **cualquiera devuelve 0**. Causa en BD: `document_sale.id_user` es **NULL en los 2.783 registros**.

No es un fallo de la lógica del filtro (es coherente con el dato), pero **para el usuario es un control que
sólo puede producir resultados vacíos**, y una columna que nunca muestra nada. Se reporta como hallazgo de
datos del despliegue. **Veredicto parcial: `WEB-FIELD-MISMATCH`.**

### 2.6 Ordenamiento · paginación · columnas

Columnas ordenables (7): `Código facturación`, `Fecha facturación`, `Vendedor`, `Cliente`,
`Monto facturado`, `Saldo pendiente`, `Vencimiento`.

| Columna | Sentido | Filas reales leídas | SQL | ¿? |
|---|---|---|---|---|
| `Monto facturado` | asc | 3,62 · 6,52 · 7,68 | 3,62 · 6,52 · 7,68 | ✅ |
| `Monto facturado` | desc | O00018070 754.726,20 · O00018866 469.007,23 · O00018871 455.427,35 | idénticos | ✅ |

*(En el asc, el tercer registro difiere de código con el de SQL pero **con el mismo monto 7,68** — es un
empate, ambos órdenes son válidos. No es hallazgo.)*

**Paginación:** 50/página sobre 735. Página 1 → P00004707, P00004706; página 2 → P00004665, P00004664.
Filas distintas, sin solapamiento, total estable.

### 2.7 Observaciones ("se ve raro")

1. **`Monto conv.` = "N/A BS" y `Tasa conv.` = "N/A" en las 735 filas.** Ninguna fila muestra conversión.
   En BD `nu_value_local` trae valores como `0,0400` / `0,1500`, que no son una tasa plausible
   (la tasa real en pedidos es 725,75). La web al menos **no inventa una conversión**: muestra N/A.
   Se señala para revisión de datos, no se marca como defecto de cálculo.
2. **`nu_document` tiene un único valor distinto** en los 2.783 documentos (literal `"NULL"` como texto).
   Igual que `tx_comment` y `co_bank`, que traen la **cadena `"NULL"`** en vez de nulo real. Dato sucio de la
   carga; no afecta lo que se ve en pantalla.
3. **Ñ y tildes correctos:** "ADRIAN EDUARDO CEDEÑO BLANCA", "Código facturación" se renderizan bien.
4. **Rendimiento muy bueno** acá (≈2 s) frente a pedidos (≈25 s) — con más registros en juego. Refuerza que
   lo de pedidos es un problema puntual de esa consulta, no del servidor.

### 2.8 Veredicto `/pages/facturaciones`

**`WEB-OK` con una salvedad de datos.** Carga, filtra y ordena **correctamente**, con calce **exacto** contra
SQL en las cinco mediciones de fecha (una vez descontados los borrados) e incluso a nivel de **conjunto de
registros**, no sólo de conteo. Excluye bien los documentos borrados.

- **CAR-FAC-005** (`WEB-FIELD-MISMATCH`): columna y filtro `Vendedor` inutilizables por `id_user` NULL.
- **`WEB-N/A`** para el detalle: ningún registro consultable porque `invoice` está vacía.

---

## 3. `/pages/cobros` — ⏸ SUSPENDIDO (04/08/2026)

> **Motivo de la interrupción:** QA informó que **van a cambiar el cliente montado en la playa Caribe**.
> Todo hallazgo de *datos* sobre los 17 cobros actuales quedaría invalidado, así que se corta acá y se
> retoma cuando haya un cliente estable. **Ningún caso `CAR-COB-###` se da por cerrado** y no se escribió
> ninguna línea en `_web-results.jsonl`.

### 3.1 Lo que SÍ se conserva (independiente del cliente)

**Contexto verificado:** host `denariocaribe.ddns.net:8080` · `/DenarioPremium/pages/cobros` ·
tabla **`form:cobrosDT`** (única, no compartida con los otros 5 módulos).

**Prefijo de los filtros: `form:j_idt116:`** — ⚠ es un `j_idt*`, cambia entre despliegues; anclar por
sufijo (`[id$=":n_ref"]`), nunca escribir el prefijo literal en un guión.

| Control | Sufijo del id | Notas |
|---|---|---|
| Empresa | `idEnterprise_input` | value **`1`** acá (en `/pages/pedidos` es `00001`) · sin placeholder |
| # Ref | `n_ref` | input de texto |
| Vendedor | `idSalesmaView_input` | 15 opciones (14 + placeholder), con `_filter` |
| Cliente | `clientSOM_input` | con `_filter` |
| Tipo Cobro | `idTipo_input` | `0` Cobros · `1` Anticipo/Prepago · `2` Retención · **`3` IGTF · `4` Cobro 25 %** |
| Fecha Inicio / Final | `dateB_input` / `dateF_input` | widgets `widget_form_j_idt116_dateB` / `_dateF` |
| Depositado | `idDep_input` | `1` SI · `2` NO |
| Moneda | `idCurrency_input` | `1` BS · `2` USD |
| Tiene Adjunto | `attachStatus_input` | `1` SI · `2` NO |
| Status | `orderStatus_input` | `7` Enviado · `1` Aprobado · `2` Pendiente · `3` Rechazado · `13` Por aprobar |
| Buscar / Limpiar | `ajax` / `botonLimpiar` | |

**18 columnas** en la lista: `Detalle`, `# Ref`, `Estatus del Cobro`, `Fecha Cobro`, `Pagos`,
`Monto cobrado`, `Vendedor`, `Cliente`, `Tipo de Cobro`, `Nro Retención`, `Banco receptor`, `Depósito`,
`Total por cobrar`, `Diferencia cobro`, `Monto conv.`, `Por cobrar conv.`, `Diferencia cambiaria`, `Tasa conv.`

🔑 **Dos tipos de cobro que el guión `smoke-web-cobros.md` no contempla:** el combo ofrece **IGTF (3)** y
**Cobro 25 % (4)** además de las 3 ramas conocidas de `co_type`. El guión sólo documenta 0/1/2 ⇒ hay que
ampliarlo, con cliente nuevo o con el actual.

**Driver de búsqueda (reutilizable):** vale la misma regla de la playa —`widget.setDate()` para las fechas
y enganche a `XMLHttpRequest → loadend`, nunca espera fija. Para los `p:selectOneMenu` alcanzó con setear
el `<select>` nativo y disparar `change`: el backend toma el valor sin necesidad de abrir el panel perezoso.

### 3.2 ⚠ Rendimiento — observación firme, no depende del cliente

**33,5 s** tardó `Buscar` con el rango completo (2020–2027) devolviendo **sólo 17 filas**, sin spinner.
Es **peor que pedidos** (25 s con 440 filas) y muy lejos de facturaciones (≈2 s con 735).

⇒ Refuerza y **amplía** `CAR-PED-PERF`: el problema no es el volumen de datos ni el servidor, porque acá
hay 17 registros. Son consultas puntuales mal resueltas. **Vale la pena levantarlo aunque cambie el cliente.**

### 3.3 Pistas a retomar (⚠ PROVISIONALES — dependen de los datos actuales)

Se anotan para no volver a descubrirlas, **no como hallazgos**:

1. **Origen del estatus inconsistente.** Los refs 1 y 2 muestran **"Aprobado"** en la web, pero
   `transaction_statuses` dice **"Enviado"** (el catálogo `st_collection` sí dice "Aprobado").
   En los refs 119 y 133 pasa al revés: la web dice **"Por aprobar"** = `transaction_statuses`, mientras
   `st_collection` dice "Rechazado". ⇒ La web **no sigue una sola fuente**. Es la pista más prometedora;
   hay que rehacerla con datos estables antes de afirmar nada.
2. **`Monto cobrado` de la lista NO es un total: es la lista de pagos.** El ref 127 muestra
   `"200,3000 USD 200,0000 USD"` (dos pagos) y las retenciones (122, 126) lo muestran **vacío** porque
   `co_type=2` no tiene pagos. `Total por cobrar` es el que trae `nu_amount_final`.
   ⇒ Al leer esta tabla, **no parsear `Monto cobrado` como un número suelto.**
3. **Sobrepagos con factor ×1000 y su anticipo espejo.** Refs 129/130 y 131/132 son pares: un cobro cuyo
   pago (132.890,00 / 333.460,00) es exactamente **1.000×** el monto aplicado (132,89 / 333,46), y el
   excedente aparece como un **Anticipo/Prepago** por la diferencia exacta (132.757,11 / 333.126,54).
   La aritmética de la web **cierra**; huele a carga de datos, no a defecto de la web. El ref 128
   (427,00 pagado contra 42,72) tiene la misma forma pero **sin** anticipo espejo — esa asimetría sí
   habría que perseguirla.
4. **Convención de signo de `Diferencia cobro`.** `WEB-RUNTIME §7` la define como
   `Total por cobrar − Monto cobrado`, pero lo que se ve es `Monto cobrado − Total por cobrar`
   (siempre positivo, incluso cuando hay sobrepago). Con estos datos no se puede distinguir "resta
   invertida" de "valor absoluto": hace falta un cobro **parcial** (pagado < adeudado) para decidirlo.
   Un sobrepago mostrado como saldo positivo pendiente **induce a error**; queda pendiente de confirmar.

### 3.4 Qué falta cuando se retome

Ningún **detalle** de cobro llegó a abrirse. Queda sin tocar el bloque que más rinde según el guión:
`M05` (consistencia lista ↔ detalle, el que destapó `COB-RET-TOTAL-CERO`), los cálculos de retención
IVA/ISLR de los `co_type=2`, el enlace `Consultar Depósito` (3 cobros lo ofrecen: 119, 121, 123) y toda
la batería de filtros `F##`. También quedan pendientes Devoluciones, Depósitos, Clientes Potenciales,
Inventarios y los 3 módulos de Datos Maestros.

