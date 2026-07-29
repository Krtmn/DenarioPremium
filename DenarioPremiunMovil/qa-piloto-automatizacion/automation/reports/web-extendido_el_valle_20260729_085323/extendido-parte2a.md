# Corrida WEB EXTENDIDA — parte 2a · BLOQUE 4 · DATOS MAESTROS

- **RUN_ID:** `20260729_085323_web-extendido`
- **Cliente:** `el_valle` · empresa **PROCESADORA DE ALIMENTOS COVADONGA,C.A** (`id_enterprise=1`)
- **Playa:** `la_tortuga` · host `denariolatortuga.ddns.net:8080` ✅ (verificado, **no** CAPITALINA)
- **Modo:** READ-ONLY (solo `Buscar` / `Limpiar` / paginar / ordenar / `Consultar`)
- **Oráculo:** BD vía `node automation/db/query.js el_valle "..."` (accesible ✅)

> Escrito **incrementalmente**: cada pantalla se anexa apenas termina.

---

## `DWX-MAE-001` · Productos → `/pages/productos`

**Tabla:** `form:tablaProd` — ⚠ **selector nuevo**, no estaba en `web-selectors/_comunes.md`
(la doc solo listaba `form:pedidosDT` / `form:cobrosDT` / `form:tablaVisit`).
**Columnas:** `Detalle` · `Código producto` · `Nombre producto` · `Estructura producto`.
**Filtros:** `Código producto` (`form:j_idt115:codProd`) · `Nombre producto` (`form:j_idt115:naProd`) ·
selects `Almacen` · `Lista de precio` · `Tipo Estructura` · `Estructura` · empresa.
**Botones:** `Buscar` = `form:j_idt115:ajax` · `Limpiar` = `form:j_idt115:botonLimpiar`.

### 1. Conteo web vs BD — ✅ `WEB-OK`

Con `Filas por página = 200` (1 sola página, sin filtros):

| Fuente | Conteo |
|---|---|
| Web `/pages/productos` (200 f/pág, sin filtro) | **80** |
| BD `SELECT count(*) FROM product` | **80** |
| **Diferencia** | **0** |

Además se cotejó el **conjunto exacto de códigos**, no solo el total:

```
en web y NO en BD : []   (0)
en BD y NO en web : []   (0)
```

- 80 códigos únicos de cada lado, **diff vacío en ambas direcciones** → no trae de más ni de menos.
- `SELECT co_operation, count(*) FROM product GROUP BY 1` → **`I` = 80** (no hay `D`/borrados en `product`),
  así que acá **no aplica** la trampa de `co_operation='D'` que sí pesa en documentos.
- Paginación coherente: 50 f/pág → **2 páginas** (50 + 30); 200 f/pág → **1 página** de 80.
- Orden por defecto: `Nombre producto Ascendente` (select `form:tablaProd_reflowDD`).

**Veredicto conteo/paginación: `WEB-OK`.**

### 2. 🔴 DEFECTO — los filtros de texto no devuelven nada (`WEB-FIELD-MISMATCH`)

Los filtros **`Código producto`** y **`Nombre producto`** devuelven **`No existe registro`**
para valores que **sí existen** en la lista y en la BD.

| # | Filtro aplicado | Web devuelve | BD (`product`) | Veredicto |
|---|---|---|---|---|
| control | *(todos vacíos)* + `Buscar` | **50 filas** (pág 1 de 80) | 80 | ✅ el botón `Buscar` **funciona** |
| 1 | `Código producto = C0051` | **0** — `No existe registro` | **1** (ALAS DE POLLO) | ❌ |
| 2 | `Código producto = C0010` | **0** — `No existe registro` | **1** (PERNIL DE CERDO CON PIEL) | ❌ |
| 3 | `Nombre producto = PERNIL` | **0** — `No existe registro` | **1** (`na_product LIKE 'PERNIL%'`) | ❌ |

**Por qué NO es un artefacto de la automatización** (se descartó explícitamente):

1. **Control con filtros vacíos** → el mismo botón, el mismo click, devuelve las 50 filas correctas.
   Si el click no submitiera, el control también fallaría.
2. Hay **un solo** botón `Buscar` en el DOM (`form:j_idt115:ajax`, `type=submit`, visible) — no se está
   clickeando un botón de otro diálogo.
3. Reproducido con **dos métodos de entrada**: `fill()` (set directo) y `pressSequentially()`
   (**keystrokes reales**, dispara todos los eventos de teclado). Mismo resultado en ambos.
4. `C0051` es literalmente **la primera fila** del listado sin filtrar, y `PERNIL` es prefijo exacto
   de `PERNIL DE CERDO CON PIEL`. No es un problema de comodines ni de mayúsculas.

**Impacto:** en un maestro de 80 productos se puede navegar a mano, pero el filtro es la única
vía práctica de búsqueda y está **inutilizable**. Afecta a los 2 filtros de texto de la pantalla.

**Veredicto filtros: `WEB-FIELD-MISMATCH`** (la web muestra 0 donde la BD tiene 1).

### 3. ⚠ DEFECTO menor — `Limpiar` no limpia lo que se ve

`Limpiar` **sí** resetea la consulta del lado servidor (vuelven las 50/80 filas) y **sí** resetea
`Filas por página` a 50, pero **deja el texto anterior visible en el input** de filtro.

- Observado: tras `Limpiar`, la tabla muestra las 80 filas **pero** `Código producto` sigue
  mostrando `C0010` en pantalla.
- **Consecuencia real y peligrosa:** el valor visible **no representa** el filtro aplicado, y como el
  input igual se serializa en el próximo submit, **cualquier acción posterior que envíe el formulario
  (incluido `Consultar` de una fila) re-aplica el filtro fantasma**.
- Esto es exactamente la advertencia de la guía ("verificá el `value` del input antes de confiar"),
  pero acá el `value` tampoco es confiable: **hay que vaciarlo explícitamente**, no alcanza con `Limpiar`.

> 🔎 Esto además **explica una lectura engañosa del arranque**: al entrar a `/pages/productos` la
> primera vez, el input mostraba `C0010` y la tabla mostraba la fila del PERNIL, lo que sugería que el
> filtro funcionaba. En realidad el texto visible era residuo de la sesión anterior. Al ejercitar el
> filtro de verdad, no devuelve nada.

### 4. Filtros de tipo SELECT — mismo defecto (`WEB-FIELD-MISMATCH`)

El fallo **no se limita a los filtros de texto**. El filtro `Lista de precio` (selectOneMenu) también
devuelve vacío, y encima es el que **agrega la columna `Precio`** al listado:

| Filtro | Columnas del listado | `Total de Resultados` web | BD (`price_list`) | Veredicto |
|---|---|---|---|---|
| *(ninguno)* | 4: `Detalle`·`Código`·`Nombre`·`Estructura` | **80** | 80 (`product`) | ✅ **cuadra exacto** |
| `Lista de precio = Precio 1` | 7: +`Almacen`·`Lista de precio`·**`Precio`** | **0** | **80** (`co_list='01'`) | ❌ |

> 🔎 **Hallazgo de UI:** al filtrar por lista de precio la tabla **suma 3 columnas**, incluida `Precio`.
> Es la **única** vista de Datos Maestros donde el precio saldría en un listado — y es justamente la que
> no devuelve filas. Con el filtro roto, **el precio nunca llega a verse en un listado**.

**Contador `Total de Resultados`:** existe y **sin filtros es correcto (80 = BD)**. Sirve como oráculo barato.

### 5. 🔎 PERNIL DE CERDO CON PIEL (`C0010`) — el dato corrupto

**Detalle:** `/pages/detalleProducto` (⚠ ruta nueva, no documentada) — se llega por
`form:tablaProd:56:consultar` (patrón `{tabla}:{fila}:consultar` confirmado también acá).
El detalle muestra **un precio por vez**, gobernado por el select `form:lista` (`Precio 1..6`).

**Cotejo de las 6 listas — web vs BD (`price_list` de `co_product='C0010'`):**

| Lista | Web (`Precio:`) | BD `nu_price` | ¿Coincide? |
|---|---|---|---|
| Precio 1 | `73.576.411,0100 USD` | 73576411.0100 | ✅ |
| Precio 2 | `73.576.411,0100 USD` | 73576411.0100 | ✅ |
| Precio 3 | `16.534.024,9500 USD` | 16534024.9500 | ✅ |
| Precio 4 | `1,0000 USD` | 1.0000 | ✅ |
| Precio 5 | `1,0000 USD` | 1.0000 | ✅ |
| Precio 6 | `1,0000 USD` | 1.0000 | ✅ |

**6/6 exactas**, con los 4 decimales, formato es-VE correcto, moneda `USD` correcta.
La web **no trunca, no redondea, no desborda ni rompe el layout** con el número de 8 cifras.
Otros campos del detalle también cuadran: `Nombre` = PERNIL DE CERDO CON PIEL · `Código` = C0010 ·
`Estructura` = PRODUCTO FRESCO EN VENTA · `Inventario: 0`.

#### ¿Contamina algún total o promedio **en pantalla**? → **NO**

Barrido de agregados en las vistas de Datos Maestros:

- **Detalle de producto:** no hay ningún total/promedio/suma. Solo el precio de **una** lista y `Inventario`.
- **Listado de productos:** el único agregado es **`Total de Resultados`**, que es un **conteo de filas**,
  no una suma monetaria → el precio de PERNIL **no puede** contaminarlo. Verificado: 80 = 80.
- **Columna `Precio` del listado** (la que aparece al filtrar por lista): es **por fila**, sin fila de
  totales — y además hoy es inalcanzable por el defecto de filtros.

⇒ **El PERNIL no contamina ninguna vista de este bloque.** El dato corrupto está *contenido*: se
muestra fiel donde corresponde y no se propaga a ningún agregado visible.

#### Pero el riesgo latente es grande — cuantificado

Si **cualquier** reporte o indicador llegara a sumar o promediar `price_list`, PERNIL lo domina:

| Lista | Σ lista completa | Σ solo PERNIL | **% que aporta PERNIL** | Promedio **con** | Promedio **sin** | Factor de inflación |
|---|---|---|---|---|---|---|
| 01 | 73.646.982,09 | 73.576.411,01 | **99,90 %** | 920.587,28 | **893,30** | **×1.030** |
| 02 | 73.677.549,13 | 73.576.411,01 | **99,86 %** | 920.969,36 | **1.280,23** | **×719** |
| 03 | 16.632.474,81 | 16.534.024,95 | **99,41 %** | 207.905,94 | **1.246,20** | **×167** |
| 04 | 42.369,73 | 1,00 | 0,00 % | 529,62 | 536,31 | — |
| 05 | 100.750,32 | 1,00 | 0,00 % | 1.259,38 | 1.275,31 | — |
| 06 | 97.999,72 | 1,00 | 0,00 % | 1.225,00 | 1.240,49 | — |

**Lectura:** en las listas 1-3 **un solo producto de 80 es ~99,9 % del valor**. El promedio de la lista 01
pasa de **893,30** a **920.587,28** por ese único registro. Hoy no hay pantalla que lo exponga, pero
cualquier indicador/reporte futuro sobre precios saldrá inservible mientras el dato no se corrija.

### Veredictos `DWX-MAE-001`

| Sub-caso | Marca |
|---|---|
| Conteo + set de códigos + paginación + `Total de Resultados` | `WEB-OK` |
| Precios del PERNIL (6 listas) y render del número grande | `WEB-OK` |
| Contaminación de totales/promedios en pantalla | `WEB-OK` (no contamina) |
| **Filtros (texto y select) devuelven 0 sobre datos existentes** | **`WEB-FIELD-MISMATCH`** |
| `Limpiar` deja valor fantasma visible en inputs y selects | **`WEB-FIELD-MISMATCH`** (menor) |

**Marca del caso: `WEB-FIELD-MISMATCH`** (los datos son correctos; la **búsqueda** está rota).

---

## `DWX-MAE-002` · Clientes → `/pages/clientes`

**Tabla:** `form:tablaCli` — ⚠ **selector nuevo**. **Detalle:** `/pages/detalleCliente` (ruta nueva).
**Columnas lista:** `Detalle`·`Código cliente`·`Nombre cliente`·`Balance`·`Límite crédito`·`Fecha creación`·`Canal distribución`.
**Filtros:** `Código cliente`·`Nombre cliente` (texto) · `Vendedor`·`Canal de distribución`·`Condición de pago`·**`status`** (selects).

### 1. Conteo y la fórmula de suspendidos — ✅ `WEB-OK` (verificada, no es defecto)

La fórmula **se confirma de los dos lados y en las tres posiciones del filtro**. El mecanismo es un
filtro visible: **`status`** (`form:j_idt115:idDep`) con opciones `Activo|false` / `Suspendido|true`,
que mapea 1:1 contra la columna **`in_suspension`**.

| Estado del filtro `status` | Web `Total de Resultados` | BD (`client`) | ¿Cuadra? |
|---|---|---|---|
| **`Activo`** (valor por defecto al entrar) | **5.382** | `count(*) WHERE NOT in_suspension` = **5.382** | ✅ |
| **`Suspendido`** | **1.625** | `count(*) WHERE in_suspension` = **1.625** | ✅ |
| **`Seleccione status`** (sin filtro, tras `Limpiar`) | **7.007** | `count(*)` = **7.007** | ✅ |

```
Aritmética:  5.382 (Activo) + 1.625 (Suspendido) = 7.007 (total)   ✅ exacto
BD:          co_operation='D' → 0 borrados  (acá no hay trampa de borrados)
```

> **Matiz que conviene registrar:** no es que "la web oculte" los suspendidos de forma rígida — los
> **expone** vía el filtro `status`, y **tras `Limpiar` muestra los 7.007** (el filtro queda en
> "Seleccione status"). El 5.382 es el **valor por defecto de entrada**, no un techo.
> Comprobado empíricamente: en el listado post-`Limpiar` aparecen clientes con `in_suspension=true`.

### 2. 🎯 Muestreo BD↔web de 30 clientes — ✅ `WEB-OK`

30 clientes leídos del listado y cotejados **campo a campo** contra `client` (match por `co_client`):

```
clientes comparados: 30 | filas 100% OK: 30 | diffs: 0
```

Campos cotejados por cliente: **código** (`co_client`), **nombre** (`na_client`),
**balance** (`nu_balance`), **límite crédito** (`nu_credit_limit`), **fecha creación** (`da_created`).
Números parseados con la convención es-VE (`parseNumeroFlexible`), tolerancia 0,01. **0 descuadres.**

Incluye valores no triviales que igual cuadraron:
`ABASTO EL TURCO M1` balance **-2.569.600** (negativo) · `ABASTO SANTA MARIA PIAR` balance **1.847.200** ·
`ABASTO DORIS 2023` límite crédito **10.886.250.000** (cifra enorme, se muestra completa y correcta).

### 3. Datos fiscales (RIF) — ✅ `WEB-OK`

**La columna `Código cliente` del listado NO es el RIF**: es `co_client`. El **RIF real (`nu_rif`)
sólo aparece en el detalle**, y ahí se muestra **fiel, con guion incluido**:

| Campo | Web (detalle `J296916900`) | BD | ✔ |
|---|---|---|---|
| `Código cliente` | `J296916900` | `co_client` = J296916900 | ✅ |
| **`RIF`** | **`J-296916900`** | `nu_rif` = **J-296916900** | ✅ |
| `Nombre cliente` | `1-2-88 MATURIN- LI, C.A` | idem | ✅ |
| `Correo electrónico` | `astrid.marquina@kiberno.com` | `na_email` | ✅ |
| `Balance` / `Límite crédito` | `0` / `500` | 0.0000 / 500.0000 | ✅ |
| `Fecha creación` | `09/07/2009` | `da_created` | ✅ |
| **`Estatus`** | **`Suspendido`** | `in_suspension = true` | ✅ |
| `Condición pago` | `CONTADO` | `co_payment_condition`=CodContado | ✅ |

Sobre los 30 del muestreo: normalizando el guion, **`nu_rif` == `co_client` en 30/30**.
⚠ **Dato de calidad (BD, no web):** el formato de `nu_rif` es **inconsistente en origen** —
de los 30, **9 con guion** (`J-296916900`) y **21 sin guion** (`J501670048`). La web replica lo
que hay; el problema está en los datos.

### 4. Sucursales (`address_client`) — ✅ `WEB-OK`

```
address_client: 7.001 filas · 7.001 co_client distintos → relación 1:1 (una dirección por cliente)
co_operation='D' → 0 borradas
7.007 clientes − 7.001 con dirección = 6 clientes SIN dirección
```

Las sucursales se ven en la tabla `form:tabladir` del detalle. Cotejo de la del cliente `J296916900`:

| Columna web | Valor web | BD (`address_client`) | ✔ |
|---|---|---|---|
| `Código` | `DIRECJ296916900` | `co_address_client` | ✅ |
| `Tipo dirección` | `001` | `co_address_type` = 001 | ✅ |
| `Dirección` | `AV. BICENTENARIA Nº269 MATURIN - EDO. MONAGAS` | `tx_address` idem | ✅ |
| `Teléfono` | *(vacío)* | `nu_phone` = NULL | ✅ |
| `Responsable` | *(vacío)* | `na_responsible` = NULL | ✅ |
| `Mapa` | `Sin coordenadas` | `coordenada` = NULL | ✅ |

**6/6.** La web maneja bien los NULL reales (los deja vacíos y dice "Sin coordenadas").

### 5. Filtros de clientes — ✅ `WEB-OK` · **y es la prueba que aísla el defecto de productos**

| Filtro | Web `Total de Resultados` | SQL equivalente | BD | ✔ |
|---|---|---|---|---|
| `Código cliente = J501670048` | **1** | `WHERE co_client='J501670048'` | 1 | ✅ |
| `Nombre cliente = ABASTO` | **129** | `WHERE na_client ILIKE '%ABASTO%'` | **129** | ✅ |
| `status = Activo` / `Suspendido` / *(vacío)* | 5.382 / 1.625 / 7.007 | ver §1 | idem | ✅ |

El filtro de nombre hace **"contiene", case-insensitive** (129 = `%ABASTO%`, **no** 66 = `ABASTO%`).

> 🔴 **Esto cierra la duda sobre `DWX-MAE-001`.** Clientes usa **exactamente la misma maquinaria** que
> productos — mismos IDs de input (`form:j_idt115:codProd` / `naProd`), el **mismo** botón
> `form:j_idt115:ajax`, el mismo método de tipeo desde la automatización — y **acá funciona perfecto**.
> Por lo tanto el fallo de los filtros de productos **no es un artefacto de la herramienta**:
> es un defecto **específico de `/pages/productos`**.

### 6. ⚠ Calidad de datos (BD, **no** defecto web)

El detalle muestra `Descripción 1: NULL` y `Descripción 2: NULL`. **No es un bug de render:**

```sql
SELECT count(*) FILTER (WHERE tx_description_1='NULL')  -- 7007  ← cadena LITERAL "NULL"
     , count(*) FILTER (WHERE tx_description_1 IS NULL)  --    0  ← NULL real
FROM client;                                             -- total 7007
```

**Los 7.007 clientes tienen la cadena literal `'NULL'`** en `tx_description_1/2` (probable carga ETL).
La web muestra fielmente lo que hay almacenado → **`WEB-OK`**, defecto de **datos** en origen.
(Idem `nu_zip_zone='NULL'` en `address_client`.)

### Veredicto `DWX-MAE-002`: **`WEB-OK`**

Conteos, fórmula de suspensión, muestreo de 30, RIF, sucursales y filtros: **todo cuadra con la BD**.
Los dos hallazgos (formato de RIF, cadena `'NULL'`) son **de datos**, no de la web.

---

## `DWX-MAE-003` · Documentos de Venta → `/pages/documentos`

**Tabla:** `form:tablaDoc` — ⚠ **selector nuevo**.
**Columnas:** `Detalle`·`Código documento`·`Fecha documento`·`Fecha vencimiento`·`Nombre cliente`·`Saldo documento`·`Límite crédito`·`Tipo documento`.
**Filtros:** `Código documento` (texto) · `Vendedor`·`Cliente`·`tipo de documento` (selects) ·
**rango de fechas** `dateB_input`/`dateF_input`, que al entrar viene **precargado con el mes en curso**
(01/07/2026 – 29/07/2026). ⚠ El listado **nunca** se ve "completo" por defecto.

**Verificado:** el rango de fechas filtra por **`da_document`**, no por `da_duedate`
(rango 01–29/07 → 233 = conteo por `da_document`; por `da_duedate` habrían sido 490).

### 1. 🔴🔴 DEFECTO PRINCIPAL — la web **incluye los documentos borrados** (`co_operation='D'`)

Éste es el hallazgo de mayor impacto de la corrida. **No hay que "excluir `co_operation='D'`" sólo en
el SQL del cotejo: la web tampoco los excluye**, así que el usuario ve la morosidad inflada en pantalla.

**Prueba a escala completa** (rango ensanchado a 01/01/2000 – 31/12/2026):

| Fuente | Documentos |
|---|---|
| Web `Total de Resultados` | **2.783** |
| BD `count(*) FROM document_sale` (todos) | **2.783** |
| BD **sólo activos** `WHERE co_operation='I'` | **735** |
| BD **borrados** `WHERE co_operation='D'` | **2.048** |

```
La web muestra 2.783 cuando los documentos vivos son 735.
Sobreconteo: 2.783 / 735 = 3,79×   (2.048 documentos borrados listados como si existieran)
```

**Prueba fila por fila** (rango por defecto 01–29/07/2026, las 233 filas leídas de las 2 páginas):

```
BD en rango: 233 | web: 233
filas web clasificadas por co_operation en BD:  { "I": 189, "D": 44, "noEnBD": 0 }
en BD y NO en web: 0        (no falta nada)
saldos que NO cuadran: 0    (los 233 saldos coinciden exactamente con nu_balance)
SUMA saldos web: 99.682,51  =  BD I 79.554,69  +  BD D 20.127,82
```

⇒ **44 de las 233 filas en pantalla son documentos borrados**, y aportan **20.127,82 USD** de saldo
falso (**+25,3 %** sobre los 79.554,69 reales de ese mes).

**Confirmación nominal** — se ubicaron en el listado web 4 documentos con `co_operation='D'`:

| Documento (`co_operation='D'`) | ¿Aparece en la web? | Saldo mostrado |
|---|---|---|
| `00026235` | **PRESENTE** | 3.114,26 USD |
| `P00004562` | **PRESENTE** | 2.564,45 USD |
| `P00004583` | **PRESENTE** | 2.142,51 USD |
| `P00004595` | **PRESENTE** | 1.394,34 USD |

⚠ **No hay forma de distinguirlos en pantalla:** el listado **no tiene ninguna columna de estatus**
(`Detalle`·`Código`·`Fecha doc`·`Fecha vto`·`Cliente`·`Saldo`·`Límite crédito`·`Tipo`).
Un documento borrado es **visualmente idéntico** a uno vigente.

#### Impacto sobre la morosidad — los dos números y la diferencia

| Escenario | Documentos | Clientes | **Saldo vencido** |
|---|---|---|---|
| **Correcto** (`co_operation='I'`) | **732** | **448** | **241.573,94 USD** |
| **Lo que refleja la web** (I+D) | **2.780** | **812** | **762.465,84 USD** |
| **Diferencia (falso)** | **+2.048** | **+364** | **+520.891,90 USD** |

```
Factor de inflación: 762.465,84 / 241.573,94 = 3,16×
```

> 🔎 **Matiz importante para la parte 1.** La morosidad inflada 3× que reportó el agente anterior
> **no fue sólo un error de su SQL**: la web **muestra efectivamente** ese universo inflado. El SQL
> del cotejo debe excluir `co_operation='D'` para medir la realidad, **pero la web debería excluirlos
> también y no lo hace** — y eso sí es un defecto de producto, no del agente.

**Veredicto: `WEB-FIELD-MISMATCH`** (el listado **trae de más**: 2.048 registros borrados).

### 2. 🔴 DEFECTO — la columna **`Límite crédito` muestra el saldo del documento**

La columna rotulada `Límite crédito` **no muestra el límite de crédito**: repite `nu_balance`.

Se descartaron las dos explicaciones alternativas usando documentos **parcialmente pagados**, donde
saldo, total del documento y límite del cliente son **tres valores distintos**:

| Documento | Web `Saldo documento` | Web **`Límite crédito`** | BD `nu_balance` | BD `nu_amount_total` | BD cliente `nu_credit_limit` |
|---|---|---|---|---|---|
| `P00004614` | 803,26 | **803,26** | **803,26** ✔ | 818,55 ✗ | **600,00** ✗ |
| `P00004579` | 237,09 | **237,09** | **237,09** ✔ | 765,64 ✗ | **70.000,00** ✗ |
| `P00004605` | 0,01 | **0,01** | **0,01** ✔ | 194,48 ✗ | 0,00 ✗ |
| `P00004637` | 41,60 | **41,60** | **41,60** ✔ | 82,42 ✗ | 0,00 ✗ |

En las 40 filas revisadas, **40/40** tienen `Límite crédito == Saldo documento`.
El valor **nunca** coincide con `nu_amount_total` ni con el `nu_credit_limit` del cliente.

⇒ La columna es un **duplicado del saldo con rótulo equivocado**. Para un cobrador es engañoso:
sugiere que el cliente tiene un cupo igual a lo que debe. **`WEB-FIELD-MISMATCH`.**

### 3. Saldos (`nu_balance`) — ✅ `WEB-OK`

Con el universo acotado a lo que la web muestra, **los importes en sí son fieles**:

```
233 documentos cotejados uno a uno → 0 diferencias de saldo (tolerancia 0,01)
```

Formato es-VE correcto (`1.097,4 USD`, `43,67 USD`), moneda `USD` correcta.
**El problema no son los montos: es QUÉ FILAS se listan.**

### 4. Filtros de documentos

| Filtro | Web | SQL equivalente | BD | ✔ |
|---|---|---|---|---|
| Rango fechas 01–29/07/2026 | **233** | `da_document BETWEEN …` (I+D) | 233 | ✅ *(pero incluye 44 borrados)* |
| Rango fechas 08–10/07/2026 | **124** | `da_document BETWEEN …` (I+D) | 124 (95 I + 29 D) | ✅ *(idem, 29 borrados)* |
| Rango 01/01/2000–31/12/2026 | **2.783** | todos | 2.783 | ✅ *(idem, 2.048 borrados)* |
| **`Código documento = 00026237`** (activo, existe) | **0** | `co_document_sale='00026237'` | **1** | ❌ |
| **`Código documento = 00026235`** (borrado, listado) | **0** | idem | 1 | ❌ |

- **El filtro de fechas funciona correctamente** (3/3 rangos cuadran con el SQL).
- **El filtro `Código documento` está roto**: devuelve 0 para códigos que **la propia web está
  mostrando** en esa misma pantalla. Mismo cuadro de fallo que los filtros de `/pages/productos`.

### Veredictos `DWX-MAE-003`

| Sub-caso | Marca |
|---|---|
| Saldos `nu_balance` fila a fila (233) | `WEB-OK` |
| Filtro de rango de fechas (3 rangos) | `WEB-OK` |
| **Incluye documentos borrados `co_operation='D'`** | **`WEB-FIELD-MISMATCH`** |
| **Columna `Límite crédito` muestra el saldo** | **`WEB-FIELD-MISMATCH`** |
| Filtro `Código documento` devuelve 0 sobre datos listados | **`WEB-FIELD-MISMATCH`** |

**Marca del caso: `WEB-FIELD-MISMATCH`.**

---

# Patrones nuevos

## Selectores y rutas nuevas (candidatos a `web-selectors/_comunes.md`)

`_comunes.md` sólo documentaba `form:pedidosDT` / `form:cobrosDT` / `form:tablaVisit`.
**Datos Maestros usa una familia de IDs distinta**, y ninguno estaba registrado:

| Módulo | Ruta lista | **ID de tabla** | Ruta detalle |
|---|---|---|---|
| Productos | `/pages/productos` | **`form:tablaProd`** | **`/pages/detalleProducto`** |
| Clientes | `/pages/clientes` | **`form:tablaCli`** | **`/pages/detalleCliente`** |
| Documentos de venta | `/pages/documentos` | **`form:tablaDoc`** | *(no explorado)* |
| *(hija)* Sucursales | dentro de `detalleCliente` | **`form:tabladir`** | — |

- El patrón de fila **`{idTabla}:{índice}:consultar`** se confirma en los 3 (`form:tablaProd:56:consultar`,
  `form:tablaCli:0:consultar`). Sigue siendo predecible.
- ⚠ **El bloque de filtros es `form:j_idt115:*` en las 3 pantallas** — es `j_idt*`, **auto-generado**:
  no anclar ahí. **Anclar por `placeholder`** (`input[placeholder="Código cliente"]`), que sí es estable.
  Los botones `Buscar`/`Limpiar` conviene tomarlos **por texto**, no por id.

## `Total de Resultados` — el oráculo barato de toda la web

Todas las listas de Datos Maestros imprimen **`Total de Resultados: N`** encima de la tabla. Es un
**conteo del lado servidor, no de las filas pintadas**: da el total real aunque el paginador muestre 50.

```js
(document.querySelector('.layout-content').innerText.match(/Total de Resultados:\s*([\d.,]*)/)||[])[1]
```

⇒ **Evita paginar para contar.** Fue el que permitió medir 5.382 / 1.625 / 7.007 y 2.783 en un solo paso.
Validado contra la BD en 8 mediciones independientes, siempre exacto.

## 🔴 Los `<select>` de PrimeFaces NO se manejan con `browser_select_option`

El `<select>` nativo está **oculto** (`aria-hidden`, `offsetParent===null`) y `selectOption()` **falla
por timeout**. El patrón que funciona son **dos clicks** sobre el widget visible:

```js
browser_click('#form\:lista')                                  // abre el panel
browser_click('#form\:lista_panel li[data-label="Precio 3"]')  // elige la opción
```

⚠ **Excepción:** el `<select>` de **`Filas por página` del paginador SÍ es nativo** y con ése
`browser_select_option` funciona — pero hay **dos** (top y bottom) y hay que desambiguar:
`[id="form:tablaProd_paginator_top"] select`, si no da *strict mode violation*.

## 🔴 `Limpiar` deja valores fantasma → hay que vaciar los inputs a mano

`Limpiar` resetea la consulta del servidor pero **NO el texto/label visible** de inputs ni selects
(observado en productos y clientes). Como el input igual se serializa en el próximo submit,
**cualquier acción posterior (incluido `Consultar` de una fila) re-aplica el filtro fantasma**.

⇒ Regla operativa: **`fill('')` explícito en cada filtro** antes de medir. No confiar en `Limpiar`,
y tampoco confiar en el `value` como reflejo del filtro activo.

## 🔴 El rango de fechas de `/pages/documentos` viene precargado con el mes en curso

`dateB_input`/`dateF_input` arrancan en `01/{mes}/{año}`–`hoy`. **El listado nunca se ve completo por
defecto** (233 de 2.783). Cualquier conteo global exige ensanchar el rango primero. Filtra por
**`da_document`**, no por `da_duedate` — confirmado contrastando ambos conteos contra la BD.

## Metodología: cómo distinguir "filtro roto" de "artefacto de automatización"

El caso de productos parecía un error de la herramienta. El protocolo que lo resolvió, reutilizable:

1. **Control negativo:** ejecutar la misma acción **sin filtro**. Si devuelve datos, el click/submit sirve.
2. **Unicidad del control:** verificar que hay **un solo** botón con ese texto en el DOM.
3. **Dos métodos de entrada:** `fill()` y `pressSequentially()` (keystrokes reales).
4. **Control positivo en otra pantalla:** ejercitar **la misma maquinaria** (mismos ids `form:j_idt115:*`,
   mismo botón) en **otro módulo**. Que clientes funcione y productos no es la prueba definitiva.

## ⚠ Cadena literal `'NULL'` en la BD — no reportarla como defecto de render

`client.tx_description_1/2` = **cadena `'NULL'` en los 7.007 registros** (0 NULL reales); idem
`address_client.nu_zip_zone`. La web los muestra tal cual y **eso es correcto**.
**Antes de cantar un defecto de visualización de NULL, mirar si el dato es la cadena literal.**

## ⚠ Incidente de infraestructura — OneDrive deshidrató el RUN_DIR a mitad de corrida

A las 10:39 `extendido-parte1.md`, `.runid` y `_web-results.jsonl` **desaparecieron del disco**
(el árbol `reports/` completo quedó tocado; una carpeta hermana también se vació). No fue una
escritura de este agente: sólo se usaron *appends*. A las 10:41 **OneDrive rehidrató `parte1.md`**.

- `_web-results.jsonl` quedó **íntegro (21 líneas)**. Durante la ventana de deshidratación el árbol
  `reports/` aparecía como no rastreado y un `append` recreó el archivo con una sola línea. Al volver
  a estabilizarse se comprobó que **los archivos SÍ están versionados en git**, así que las 18 líneas
  de la parte 1 se **restauraron literalmente** con `git checkout --` (no reconstruidas a mano) y sobre
  ellas se anexaron las 3 de esta parte. `.runid` idem.
- Verificación de la restauración: 21 líneas, **JSON válido en todas**, y el conteo por marca cuadra con
  el resumen de la parte 1 (11 `WEB-OK` + 4 `WEB-N/A` + 3 `WEB-CALC-MISMATCH` = 18) más las 3 nuevas.
  ⚠ Detalle detectado gracias a la copia de git: el módulo de `DWX-CFG-006` es **`errores-aplicacion`**,
  no `configuracion` — motivo por el cual **se prefirió la copia versionada** a cualquier reconstrucción.
- **Recomendación:** el `RUN_DIR` vive bajo OneDrive; para corridas largas conviene escribir fuera de
  la carpeta sincronizada (o `git add` temprano) para no depender de la rehidratación.
