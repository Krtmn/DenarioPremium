# Corrida WEB EXTENDIDA — parte 2b (cierre)

**RUN_ID:** `20260729_085323_web-extendido` · **Cliente:** `el_valle` — PROCESADORA DE ALIMENTOS COVADONGA,C.A
**Playa:** `la_tortuga` (`denariolatortuga.ddns.net:8080`) · **Modo:** READ-ONLY · **Fecha:** 2026-07-29

Bloques cubiertos: **3 Facturaciones (`DWX-FAC-*`)** · **5 Visitas no cubiertas (`DWX-VIS-*`)** · **6 Estructura Comercial (`DWX-EST-*`)**

Guarda de contexto verificada al inicio: `location.host = denariolatortuga.ddns.net:8080` y el combo Empresa
ofrece **una sola** opción, `PROCESADORA DE ALIMENTOS COVADONGA,C.A`. No es CAPITALINA / Isla Coche.

---

## Bloque 3 — FACTURACIONES · `/pages/facturaciones`

### 🔑 De dónde lee la pantalla — RESUELTO, y lee de LAS DOS

La pregunta del guión ("¿lee de `invoice` o de `document_sale`?") tiene respuesta **exacta y documental**,
no inferida: el filtro **"Tipo"** de la pantalla es un `selectOneMenu` cuyos **`value` son literalmente los
nombres de las dos tablas**.

| Texto que ve el usuario | `value` real del `<option>` | Tabla que consulta |
|---|---|---|
| **Consolidado** | `TODOS` | **ambas** (unión) |
| **Facturas cobradas** | `INVOICE` | `invoice` |
| **Pendientes por cobrar** | `DOCUMENT_SALE` | `document_sale` |

⇒ **Facturaciones NO es una pantalla de una sola tabla.** Es la vista unificada de `invoice` +
`document_sale`, y el usuario elige la fuente con "Tipo". Ese dato vale más que el veredicto del caso y
no se puede deducir mirando filas — se leyó de los `value` del combo.

**Corroboración por columnas** (`information_schema.columns`), que confirma la lectura anterior:

| Columna de la web | `invoice` | `document_sale` |
|---|---|---|
| Código facturación | `co_invoice` ✅ | `co_document_sale` ✅ |
| Fecha facturación | `da_invoice` ✅ | `da_document` ✅ |
| Monto facturado | `nu_amount_total` ✅ | `nu_amount_total` ✅ |
| **Saldo pendiente** | ❌ **no existe** | `nu_balance` ✅ |
| **Vencimiento** | ❌ **no existe** | `da_duedate` ✅ |
| Tasa conv. | `nu_value_local` ✅ | `nu_value_local` ✅ |

Las dos columnas que **solo** existen en `document_sale` (`nu_balance`, `da_duedate`) están en la grilla ⇒
la grilla está diseñada para el superconjunto de ambas. Coherente con el combo.

**ID de tabla:** `form:pedidosDT` — o sea **Facturaciones es el 6º módulo** que reusa ese ID (la doc de
`_comunes.md` lista 5). Ver "Patrones nuevos".

---

### DWX-FAC-001 · Carga de pantalla, grilla y filtros — **WEB-OK**

Carga limpia. Grilla `form:pedidosDT` con 12 columnas: `Detalle · Tipo · Código facturación ·
Fecha facturación · Vendedor · Cliente · Monto facturado · Saldo pendiente · Vencimiento · Monto conv. ·
Tasa conv. · Adjuntos`. Controles `Buscar` · `Limpiar` · `Columnas`.

Filtros presentes (7): Empresa, `n_ref` (# Ref), Vendedor, Cliente, Fecha desde (`dateB`), Fecha hasta
(`dateF`), Moneda, Tipo de documento. Rango por defecto al abrir: **01/07/2026 → 29/07/2026** (mes en curso).

---

### DWX-FAC-002 · Fuente `INVOICE` ("Facturas cobradas") — **WEB-N/A**

`invoice` está **vacía**: `SELECT count(*) FROM invoice` → **0**. La pantalla no puede mostrar lo que no
existe. Marca `WEB-N/A` **tras confirmarlo en BD**, no defecto.

> ⚠ **"Sin datos" NO significa "la web está bien".** Significa que la mitad `INVOICE` de esta pantalla
> **quedó sin probar**: no se pudo validar ni el mapeo de columnas, ni el detalle, ni los cálculos
> (Σ líneas == total), ni el enlace cruzado. Queda como deuda de cobertura.

---

### DWX-FAC-003 · Fuente `DOCUMENT_SALE` ("Pendientes por cobrar") — **WEB-FIELD-MISMATCH** 🔴

**Los dos números:**

| | Valor |
|---|---|
| Filas mostradas por la web | **0** |
| Filas vivas en `document_sale` | **735** |
| **Diferencia** | **735 registros invisibles** |

**Aritmética explícita:** `document_sale` total = **2.783**. Con `co_operation = 'D'` → **2.048 borrados**.
`2.783 − 2.048 = 735` vivos. La web muestra **0**. `735 − 0 = 735`.

**Qué flags descarté, uno por uno** (ninguno explica la diferencia):

| Flag candidato | Medición | ¿Explica los 735? |
|---|---|---|
| `co_operation = 'D'` (borrado lógico) | 2.048 borrados **ya excluidos** del 735 | ❌ no |
| `nu_balance` (saldo) | **735 de 735** tienen `nu_balance > 0` — son literalmente "pendientes por cobrar" | ❌ no |
| `st_document_sale` (estatus) | **un solo valor**, `6`, en las 735 | ❌ no |
| `id_enterprise` | **un solo valor**, `1` — y la web solo ofrece esa empresa | ❌ no |
| Rango de fechas | `da_document` va de **2024-10-04** a **2026-07-15**, íntegro dentro del filtro `01/01/2024 → 31/12/2026` | ❌ no |
| `da_duedate` nulo | **0** filas sin vencimiento | ❌ no |
| `id_client` huérfano | **0** filas con cliente inexistente en `client` | ❌ no |

**Causa raíz más probable — `id_user`:**

```
SELECT count(*) FILTER (WHERE id_user IS NULL) FROM document_sale
WHERE co_operation <> 'D' OR co_operation IS NULL;   →  735 de 735
```

**Las 735 filas vivas tienen `id_user` NULL.** La grilla tiene columna **Vendedor** y filtro **Vendedor**.
Si la consulta hace **INNER JOIN** contra la tabla de usuarios por `id_user`, con `id_user` NULL
**ninguna fila sobrevive al join** → 0 resultados, exactamente lo observado. Un `LEFT JOIN` las mostraría
con el vendedor en blanco.

> ⚠ Esto **no** es "un flag que justifica el filtrado". `id_user` NULL no es un marcador de negocio como
> `co_operation='D'` o `in_suspension`: son documentos **vivos y con saldo pendiente** que desaparecen por
> una decisión de implementación del join. Y el mismo dato **sí es visible en otra pantalla**
> (`/pages/documentos` lista `document_sale`, según la parte 1 de esta corrida) ⇒ el mismo registro es
> visible en un módulo e invisible en otro. Eso es incoherencia de la web, no filtrado correcto.

**Rigor del método — descarté el falso positivo por manipulación propia.** La primera prueba fijó el combo
por JavaScript, lo que podía no llegar al servidor. Se repitió **conduciendo el widget PrimeFaces por UI
real** (click en el trigger → click en la opción "Pendientes por cobrar"), verificando después del `Buscar`
que el `label` renderizado por el servidor decía **"Pendientes por cobrar"** y el `_input` valía
`DOCUMENT_SALE`. **0 filas igual.** El filtro llegó; el resultado es del servidor.

**Impacto:** la pantalla de cartera por cobrar de esta empresa está **totalmente vacía** para el usuario.

**Marca:** `WEB-FIELD-MISMATCH` (misma marca que usa esta corrida para descuadres de conteo).

---

## Bloque 5 — VISITAS no cubiertas

### DWX-VIS-001 · Plan de Visitas · `/pages/itinerario` — **WEB-OK** ✅

**No es una grilla: es un calendario** (FullCalendar embebido en PrimeFaces). No hay `.ui-datatable`, no hay
`Buscar`/`Limpiar`. Controles: `Hoy · Mes · Semana · Día` + navegación `prev`/`next`.
Filtros: **Empresa** (`formVisit:idEnterprise`) y **Rol** (`formVisit:idRol`, única opción real: `Vendedor`).
Cada día con actividad muestra un evento con el formato **`{usuario} | {N} Visitas`**.

**Contraste día por día contra `visit` — se barrieron los 4 meses con datos (mayo→agosto 2026):**

| Día | Web muestra | BD vivas | ✓ |
|---|---|---|---|
| 2026-05-18 | `001 \| 4 Visitas` | 4 | ✅ |
| 2026-05-19 | `puertolacruzvalle \| 1 Visitas` | 1 | ✅ |
| 2026-05-25 | `001 \| 3 Visitas` | 3 | ✅ |
| **2026-06-01** | **(nada)** | **0 vivas / 3 borradas** | ✅ |
| **2026-06-08** | **(nada)** | **0 vivas / 3 borradas** | ✅ |
| 2026-06-15 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-06-22 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-06-29 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-07-06 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-07-13 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-07-20 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-07-27 | `001 \| 3 Visitas` | 3 | ✅ |
| 2026-07-28 | `001 \| 1 Visitas` | 1 | ✅ |
| 2026-07-29 | `001 \| 1 Visitas` | 1 | ✅ |
| 2026-08-03 / 10 / 17 / 24 / 31 | `001 \| 3 Visitas` c/u | 3 c/u | ✅ |

**Aritmética del total:** `visit` total = **52**. Con `co_operation='D'` → **6 borradas**. `52 − 6 = 46` vivas.
Suma de los eventos del calendario: mayo **8** + junio **9** + julio **14** + agosto **15** = **46**.
**46 = 46, diferencia 0.** **17 de 17 días exactos.**

#### 🎯 El hallazgo que más vale de este bloque: el calendario SÍ excluye los borrados

Los días **2026-06-01** y **2026-06-08** tienen **3 visitas cada uno, las 6 con `co_operation='D'`**.
El calendario de junio **no las muestra** — esos dos días salen vacíos. Filtrado **correcto**.

> Esto es el **contraste directo** con el defecto de `/pages/documentos` (parte 1), que **sí lista** los
> `co_operation='D'`. Mismo flag, misma BD, dos pantallas: una lo respeta y la otra no. ⇒ refuerza que
> lo de `/pages/documentos` es un **olvido puntual de esa consulta**, no una convención del producto.
> Si hay que priorizar un arreglo, ya se sabe que el backend sabe hacerlo bien en otro lado.

#### ⚠ Corrección al dato de contexto del guión — "48 sin visitar" está inflado

El guión daba `SELECT count(*) FROM visit WHERE is_visited=false` → **48**. Ese conteo **no excluye los
borrados** (mismo tipo de trampa que la morosidad `762.465,84` → `241.573,94` de la parte 1):

```
48 sin visitar (crudo)  −  6 con co_operation='D'  =  42 sin visitar REALES
```
Verificación cruzada: 46 vivas − 4 visitadas (`is_visited=true`: 18/05, 19/05, 28/07, 29/07) = **42** ✅.
**El número operativo es 42, no 48.** El calendario es coherente con 42/46, no con 48.

#### Notas menores (no son defecto)

- La etiqueta del evento usa el **nombre de usuario**, no el código: la visita del vendedor `co_user='019'`
  (id 50, 19/05/2026) aparece como **`puertolacruzvalle | 1 Visitas`**. Los demás muestran `001` porque
  ahí el usuario y el código coinciden. No es inconsistencia de datos, es el campo elegido para el rótulo.
- Confirmado el dato del guión: **28/07 tenía 1 visita y ya visitada** (`is_visited=true`) — y aun así el
  calendario la muestra ⇒ el Plan de Visitas grafica **planificadas y cumplidas**, no solo pendientes.

---

### DWX-VIS-002 · Rutero · `/pages/protected/visitas/rutero.xhtml` — **WEB-OK** ✅

Ruta del guión **correcta** (no dio 404). Título `Rutero`. Es un **mapa**, no una grilla: no hay
`.ui-datatable`. Filtros: Empresa · **Transacción** · Rol · **Vendedor** (`idSalesman`) · **Fecha**
(`dateB`, **un solo día**, por defecto hoy). Botones `Buscar` · `Limpiar`.

**Hallazgo de alcance: el Rutero NO es solo de visitas — cubre los 6 módulos transaccionales.**
El combo "Transacción" trae `value`→texto: `vis`→Visitas · `ped`→Pedidos · `cob`→Cobros ·
`dep`→Depòsitos · `dev`→Devoluciones · `inv`→Inventarios. Por defecto viene en `vis`.

**Prueba ejecutada:** Empresa COVADONGA · Transacción `Visitas` · Vendedor `001 - 001 001` ·
Fecha **18/05/2026** (el día con más visitas del histórico) → `Buscar`.

**El mapa de Google SÍ cargó** (`.gm-style` presente) y **sí ploteó**: **6 marcadores reales**
(`<img>` de 30×44 px, posicionados en el panel del mapa — verificado que ninguno es leyenda ni adorno):

```
1v.png · 2v.png                    → serie "v", 2 marcadores
1m.png · 2m.png · 3m.png · 4m.png  → serie "m", 4 marcadores
```

**Reconciliación con BD — `SELECT ... FROM visit WHERE da_visit = '2026-05-18'` → 4 filas:**

| id_visit | nu_sequence | is_visited | `coordenada` |
|---|---|---|---|
| 1 | 1 | false | `10.490534238368452,-66.85580012308174` |
| 49 | 1 | **true** | `10.490531750718585,-66.85580197041143` |
| 2 | 2 | false | **NULL** |
| 3 | 3 | false | **NULL** |

**Aritmética:** **4 visitas planificadas → 4 marcadores `m`** · **2 visitas con `coordenada` NO nula →
2 marcadores `v`**. `4 + 2 = 6` = **6 marcadores observados. Diferencia 0.**

**Qué flag descarté — `is_visited`:** la lectura intuitiva sería `v` = "visitada". **No cuadra:** solo
**1** de las 4 tiene `is_visited=true`, lo que daría `4 + 1 = 5` marcadores, y hay **6**.
La **única** hipótesis consistente con el 6 observado es **`v` = la visita tiene `coordenada` capturada**
(2 de 4), independientemente de si se marcó como visitada. Nótese que `id_visit=1` tiene coordenada
**con `is_visited=false`** — es justamente el caso que distingue las dos hipótesis.

⚠ La semántica exacta de los sufijos `v`/`m` está **inferida por reconciliación de conteos**, no
documentada. El conteo cuadra exacto; el significado del icono conviene confirmarlo con desarrollo.

#### Nota cosmética (no es defecto de datos)

El combo Transacción muestra **"Depòsitos"** con acento grave en vez de agudo ("Depósitos").
Typo de UI en `rutero.xhtml`.

---

### DWX-VIS-003 · Mapa de Rutas · `/pages/mapaRutas` — **WEB-OK** ✅

Ruta del guión **correcta** (no dio 404). ⚠ **El `document.title` es `Rutero`, el mismo que
`rutero.xhtml`** — el título NO distingue las dos pantallas, hay que mirar el `pathname`
(ver "Patrones nuevos").

**Es una pantalla distinta del Rutero, con otro filtrado:** aquí **no hay fecha ni transacción**.
Filtros: Empresa · Rol · **Vendedor como `selectCheckboxMenu` (multi-selección, 14 vendedores)** —
no un combo simple como en el Rutero. Botón `Buscar`.

**Prueba ejecutada:** Empresa COVADONGA · Rol `Vendedor` · **vendedor `001` tildado** (verificado
`checked=true` en el checkbox índice 0 de 14) → `Buscar`.

**El mapa cargó y ploteó 5 pines** (SVG rojo `#d92626`, 28×42, embebidos como `data:` URI — distinto
mecanismo que el Rutero, que usa `resources/icons/{n}{v|m}.png`). Se descartaron del conteo los ~44
iconos propios de la UI de Google Maps (pantalla completa, reencuadre, etc.).

**Reconciliación con BD — la tabla que alimenta esta pantalla es `user_address_clients`**
(direcciones de cliente asignadas a cada vendedor = su ruta):

```
SELECT count(*) FROM user_address_clients WHERE co_user='001';
  total = 5 · vivas = 5 · vivas con coordenada = 5
```

| | Valor |
|---|---|
| Pines en el mapa | **5** |
| Filas vivas con coordenada para `001` | **5** |
| **Diferencia** | **0** ✅ |

Flags verificados: **`co_operation='D'` → 0 borradas** para `001` (5 total = 5 vivas), y
**`coordenada` NULL → 0** (las 5 tienen coordenada, así que las 5 son ploteables). Ningún flag
distorsiona el conteo: la coincidencia 5=5 es limpia, no una compensación de errores.

*Referencia para futuras corridas — reparto de la ruta por vendedor (vivas con coordenada):*
`001`→5 · `003`→26 · `004`→1 · `015`→6 · `017`→20 · `019`→11 · `031`→23 … (el vendedor `003` es el de
ruta más grande; conviene usarlo si se quiere un caso con volumen).

#### Observación menor — el rótulo del multiselect no refleja su estado

Tras el `Buscar`, el checkbox de `001` sigue **tildado** pero el `label` del widget muestra
**"Seleccione..."** en vez de la selección. La búsqueda **sí** usó el vendedor (los 5 pines son
exactamente los de `001`), así que es cosmético. ⚠ Atribución **no concluyente**: podría ser el
re-render ajax de PrimeFaces y no un defecto; se deja anotado, no se marca como falla.

---

## Bloque 6 — ESTRUCTURA COMERCIAL

### DWX-EST-001 · Estructura de Productos · `/pages/estructuraProducto` — **WEB-OK** ✅

Carga limpia. Tabla `form:tablaProd` (**ID semántico nuevo**, no es `form:pedidosDT`) con 4 columnas:
`Código estructura · Nombre estructura · Estructura padre · Tipo de estructura`. Botones `Buscar` · `Limpiar`.

**Conteo:** web **3 filas** · `product_structure` **3 total / 3 vivas** (`co_operation='I'` en las tres,
**0 borradas**). **Diferencia 0.**

**Cotejo campo a campo — 3 de 3 exactas:**

| Código (web) | Nombre (web) | Padre (web) | Tipo (web) | BD `co_` / `na_` / `sco_` / `co_type_` |
|---|---|---|---|---|
| 51 | EMBUTIDOS (PRODUCTOS TERMINADOS) | *(vacío)* | LINEA | `51` / idem / **NULL** / `P1` ✅ |
| 39091 | LACTEOS | *(vacío)* | LINEA | `39091` / idem / **NULL** / `P1` ✅ |
| 46118 | PRODUCTO FRESCO EN VENTA | *(vacío)* | LINEA | `46118` / idem / **NULL** / `P1` ✅ |

**Dos comprobaciones que valen más que el conteo:**

1. **La web resuelve el código de tipo a su nombre.** BD guarda `co_type_product_structure = 'P1'`; la
   pantalla muestra **"LINEA"**, que es el `na_type_product_structure` de `type_product_structure` para
   `P1`. El join se hace y se hace bien — **no** se está volcando el código crudo.
2. **`Estructura padre` vacío es correcto, no un campo perdido.** Las 3 filas tienen `sco_product_structure
   = NULL` en BD ⇒ la columna **debe** salir vacía. Aquí "vacío en la web" coincide con "NULL en BD".

**Nota de modelo:** en `el_valle` la jerarquía de producto es de **un solo nivel** — `type_product_structure`
define únicamente `P1 = LINEA` (`nu_level = 1`). Que no se vea un árbol multinivel **no es un defecto**:
no hay categoría / marca / familia cargadas para este cliente.

---

### DWX-EST-002 · Estructura de Empresa · `/pages/estructuraEmpresa` — **WEB-OK** ✅

⚠ **El título de la pantalla es "Zonas de venta"**, no "Estructura de Empresa" — la ruta y el rótulo no
coinciden (ver "Patrones nuevos").
🔴 **Reusa `form:tablaProd`, el mismo ID que `/pages/estructuraProducto`**, con las **mismas 4 columnas**.
Es un caso nuevo de la trampa de IDs compartidos (ver "Patrones nuevos").

**Conteo:** abre paginada de a **50**; subiendo a **100 filas/página** se ven **57**.
`enterprise_structure` = **57 total / 57 vivas** (**0** con `co_operation='D'`). **Diferencia 0.**

**Desglose por tipo — cuadra exacto:**

| Tipo (web) | Web | BD (`co_type_enterprise_structure`) | ✓ |
|---|---|---|---|
| PAIS | **1** | `S1` → **1** | ✅ |
| ESTADO | **56** | `S2` → **56** | ✅ |
| **Total** | **57** | **57** | ✅ |

**La jerarquía se resuelve bien — dos verificaciones:**

1. **56 filas con padre + 1 sin padre = 57.** En BD: las 56 de tipo `S2` tienen
   `sco_enterprise_structure = 'P1'` y la única `S1` no tiene padre. La web muestra exactamente
   **56 con `Estructura padre` = "VENEZUELA"** y **1 (la fila PAIS) con el padre vacío**. Coincide 1 a 1.
2. **La web resuelve el código del padre a su nombre.** BD guarda el padre como código **`P1`**; la pantalla
   muestra **"VENEZUELA"**, que es el `na_enterprise_structure` de esa fila. Igual que en Estructura de
   Productos, el join se hace correctamente y no se filtra el código crudo a la vista.

Muestras verificadas: `007 / ANACO / VENEZUELA / ESTADO` · `032 / ARAGUA DE BARCELONA / VENEZUELA / ESTADO` ·
`013 / ARAGUA DE MATURIN / VENEZUELA / ESTADO` · `P1 / VENEZUELA / (vacío) / PAIS` ·
`029 / ZARAZA - GUARICO / VENEZUELA / ESTADO`.

**Nota:** las tablas alternativas de estructura territorial (`sale_org`, `zone_transport`, `sector`,
`sale_route`) están **todas en 0 filas** en este cliente ⇒ que la pantalla muestre solo PAIS→ESTADO es
**correcto**, no una jerarquía truncada.

---

### DWX-EST-003 · Canales de Distribución · `/pages/segmentacion` — **WEB-CALC-MISMATCH** 🔴

⚠ **La ruta se llama `segmentacion` pero la pantalla es "Canales de Distribucion"** (así, sin tilde en el
`<title>`). **No es segmentación de clientes.** Verificado en el esquema: **no existe ninguna tabla ni
columna `segment*` de clientes** — solo los PK `id_quota_plan_segment` / `id_sales_plan_segment`, que son
de presupuestos. La tabla real de esta pantalla es **`distribution_channel`**. Reusa otra vez
`form:tablaProd` (3ª pantalla con ese ID).

**Lo que carga — 1 fila, y la fila cotejada campo a campo:**

| Columna web | Valor web | BD `distribution_channel` | ✓ |
|---|---|---|---|
| Código canal | `001` | `co_distribution_channel = '001'` | ✅ |
| Canal Distribución | `CANAL DE DISTRIBUCIÓN GENERAL` | `na_... ` idem | ✅ |
| Código / Nombre Lista precio | *(vacíos)* | **`co_list` = NULL** | ✅ |
| **Cantidad clientes** | **7.007** | ver abajo | 🔴 |

Conteo de filas: web **1** · `distribution_channel` **1 total / 1 viva**. **Diferencia 0.**
Las columnas de lista de precio vacías son **correctas**: `co_list` es NULL. (Existen 6 filas en `list`,
pero el canal no apunta a ninguna — "vacío en web" = "NULL en BD".)

#### 🔴 El defecto: el contador y su propio drill-down se contradicen

La fila anuncia **`Cantidad clientes = 7.007`**. Se pulsó su botón **`Consultar clientes`** (control de
consulta, permitido en read-only) → navega a `/pages/protected/clientes/clientes.xhtml` con la tabla
`form:tablaCli`.

**Medición del total del drill-down** (paginado de a 50, se fue a la última página):

```
última página = 108 · filas en esa página = 32
total = (108 − 1) × 50 + 32 = 5.350 + 32 = 5.382
```

**Los dos números:**

| | Valor |
|---|---|
| Lo que dice el contador de la fila | **7.007** |
| Lo que lista su propio `Consultar clientes` | **5.382** |
| **Diferencia** | **1.625** |

**Qué flag revisé — `in_suspension`, y acá NO absuelve:**

```
SELECT count(*) FROM client;                       →  7.007  (0 borrados: co_operation='D' = 0)
SELECT count(*) FROM client WHERE in_suspension;   →  1.625
7.007 − 1.625 = 5.382
```

El flag **explica de dónde sale la diferencia**, pero **no la justifica**, y esta es la distinción que
importa:

- En el falso positivo de la parte 1 (`web 5.382 vs BD 7.007`) el flag **sí** absolvía: eran **dos
  consultas distintas** — la web filtraba suspendidos y el SQL no. La web estaba bien.
- **Acá es UNA SOLA pantalla contradiciéndose.** El contador cuenta **con** suspendidos (7.007) y el botón
  que abre ese mismísimo conjunto los cuenta **sin** ellos (5.382). No hay criterio que haga verdaderas a
  las dos cifras a la vez. El usuario lee "7.007", hace clic, y recibe 5.382 filas sin explicación.

Marca **`WEB-CALC-MISMATCH`**: los campos base de la fila cuadran (código, nombre, lista de precio); lo que
no cuadra es el **derivado** `Cantidad clientes` contra el conjunto que la propia pantalla produce.

**Qué habría que decidir (para desarrollo):** si el canal debe contar toda su cartera (→ el drill-down debe
mostrar 7.007) o solo la activa (→ el contador debe decir 5.382). Cualquiera de las dos sirve; lo que no
puede quedar es que difieran. Nótese que **`/pages/clientes` también muestra 5.382**, así que el número
"raro" es el **7.007 del contador**, y alinear el contador a 5.382 es el arreglo de menor impacto.

---

### DWX-EST-004 · Presupuesto de Venta · `/pages/presupuestoVenta` — **WEB-N/A** (sin datos, confirmado en BD)

Carga limpia. Tabla `form:tablaPres` con 8 columnas: `Ver Detalle · Empresa · Año · Fecha · Presupuesto ·
Tipo de Plan · Aprobado Por · Eliminar`. Filtros: Empresa · **Año** (por defecto **2026**) · Unidad.
Botones `Buscar` · `Limpiar` · `Agregar presupuesto`.

**Resultado:** la grilla muestra el mensaje vacío **"No existe registro"**.

**Confirmado en BD antes de marcar N/A** — la cabecera y las 5 tablas de detalle están **todas en 0**:

| Tabla | Filas |
|---|---|
| `budget` (cabecera; su columna `type` discrimina venta/cuota) | **0** |
| `sales_plan_enterprise` | 0 |
| `sales_plan_enterprise_structure` | 0 |
| `sales_plan_product` | 0 |
| `sales_plan_product_structure` | 0 |
| `sales_plan_segment` | 0 |

Como `budget` tiene **0 filas en total**, el filtro de año es irrelevante: **ningún** año podría devolver
datos. Vacío ⇒ **comportamiento correcto**, no defecto.

> ⚠ **"Sin datos" no significa "la web está bien".** Quedaron **sin probar**: el detalle (`Ver Detalle`),
> los cálculos de presupuesto, el desglose mensual (`nu_month`, `initial_value`, `current_value`) y el
> circuito de aprobación (`approved_by`). Solo se validó que la pantalla carga y resuelve el estado vacío.

🔴 **Superficie de ESCRITURA detectada — no se tocó:** botón **`Agregar presupuesto`** y columna
**`Eliminar`** por fila. Van al inventario de controles prohibidos (ver "Patrones nuevos").

⚠ Ojo con `automation/db/modelo-datos-denario.md` (líneas ~140-142): documenta estas tablas **con** datos
(264/180/12/4 filas). Eso corresponde a **otro cliente**, no a `el_valle`. **No usarlo como oráculo acá.**

---

### DWX-EST-005 · Cuota de Venta · `/pages/presupuestoCuota` — **WEB-N/A** (sin datos, confirmado en BD)

Carga limpia. Título **"Cuota de Venta"**. **Reusa `form:tablaPres`**, el mismo ID que
`/pages/presupuestoVenta` — son dos pantallas gemelas sobre la misma cabecera `budget` (la columna `type`
de esa tabla es la que discrimina venta vs. cuota).

**Única diferencia observable en la grilla frente a Presupuesto de Venta:** la 4ª columna se llama
**`Fecha creación`** en vez de `Fecha`. El resto es idéntico
(`Ver Detalle · Empresa · Año · … · Presupuesto · Tipo de Plan · Aprobado Por · Eliminar`).
Filtros idénticos (Empresa · Año=2026 · Unidad). El botón de alta cambia a **`Agregar plan cuota`**.

**Resultado:** grilla vacía, **"No existe registro"**.

**Confirmado en BD antes de marcar N/A:**

| Tabla | Filas |
|---|---|
| `budget` (misma cabecera que presupuestoVenta) | **0** |
| `quota_plan_enterprise` | 0 |
| `quota_plan_product` | 0 |
| `quota_plan_product_structure` | 0 |
| `quota_plan_segment` | 0 |

Vacío ⇒ **correcto**. Igual que en DWX-EST-004, quedan **sin probar** el detalle, el desglose mensual y la
aprobación. Las `quota_plan_*` son idénticas en forma a las `sales_plan_*` **más la columna `co_user`**
(la cuota se asigna por vendedor; el presupuesto no) — dato útil para cuando haya datos que probar.

🔴 **Superficie de ESCRITURA detectada — no se tocó:** `Agregar plan cuota` y columna `Eliminar`.

---

## Patrones nuevos

### 1. ✅ Rutas: **ninguna de las 8 dio 404** — el guión estaba bien

A diferencia de Errores de aplicación en la parte 1 (la real era
`.../erroresAplicacion/erroresAplicacion.xhtml`), **las 8 rutas de esta parte respondieron tal cual**:
`/pages/facturaciones` · `/pages/itinerario` · `/pages/protected/visitas/rutero.xhtml` · `/pages/mapaRutas` ·
`/pages/estructuraProducto` · `/pages/estructuraEmpresa` · `/pages/segmentacion` ·
`/pages/presupuestoVenta` · `/pages/presupuestoCuota`. **No hay correcciones de ruta que reportar.**

### 2. 🔴 El `<title>` NO identifica la pantalla — 4 casos nuevos

La guarda de contexto usa `pathname`; conviene **no** confiar en el título:

| Ruta | `document.title` |
|---|---|
| `/pages/estructuraEmpresa` | **"Zonas de venta"** |
| `/pages/segmentacion` | **"Canales de Distribucion"** (y no es segmentación) |
| `/pages/presupuestoCuota` | **"Cuota de Venta"** |
| `/pages/mapaRutas` | **"Rutero"** — ⚠ **idéntico** al de `/pages/protected/visitas/rutero.xhtml` |

El último es el peligroso: **dos pantallas distintas con el mismo título**. Solo el `pathname` las separa.

### 3. 🔴 IDs de tabla compartidos — la trampa se extiende a 3 IDs más

`_comunes.md` documenta que `form:pedidosDT` lo comparten **5** módulos. Medido acá:

| ID de tabla | Pantallas que lo usan |
|---|---|
| `form:pedidosDT` | los 5 documentados **+ `/pages/facturaciones`** ⇒ **6** |
| **`form:tablaProd`** | `/pages/estructuraProducto` · `/pages/estructuraEmpresa` · `/pages/segmentacion` ⇒ **3** |
| **`form:tablaPres`** | `/pages/presupuestoVenta` · `/pages/presupuestoCuota` ⇒ **2** |
| `form:tablaCli` | `/pages/protected/clientes/clientes.xhtml` |

⚠ `form:tablaProd` es especialmente engañoso: en estructuraProducto y estructuraEmpresa tiene **las mismas
4 columnas**, así que ni el ID ni el encabezado distinguen la pantalla. **Verificar `pathname` siempre.**

### 4. 🔑 Los `value` de un `<option>` delatan la tabla origen

En `/pages/facturaciones` el combo "Tipo" tiene `value` = **`INVOICE`** / **`DOCUMENT_SALE`** / `TODOS`,
mientras el usuario ve "Facturas cobradas" / "Pendientes por cobrar" / "Consolidado".
**Leer los `value`, no solo los textos, es la forma barata de descubrir de dónde lee una pantalla** —
más fiable que inferirlo de las filas (que pueden venir vacías). Patrón reutilizable en toda la web.

### 5. ⚠ Conducir un `selectOneMenu` por JS puede dar un FALSO resultado

Fijar `select.value` + `dispatchEvent('change')` **puede no llegar al servidor** en PrimeFaces.
**Protocolo válido:** click en `[id$="<campo>"] .ui-selectonemenu-trigger` → click en
`li.ui-selectonemenu-item:text-is("<texto>")` → `Buscar` → **verificar tras el ajax** que
`[id$="<campo>_label"]` muestra la opción y que `[id$="<campo>_input"]` tiene el `value` esperado.
Sin esa verificación, un "0 filas" no se puede atribuir al servidor. *(Así se blindó DWX-FAC-003.)*

### 6. Widget nuevo: `selectCheckboxMenu` (multi-selección)

`/pages/mapaRutas` usa **`ui-selectcheckboxmenu`** para Vendedor (no un combo simple):
abrir con `[id$="idSalesman"] .ui-selectcheckboxmenu-trigger`, tildar con
`[id$="idSalesman_panel"] li.ui-selectcheckboxmenu-item:has-text("...") .ui-chkbox-box`.
Estado real en los inputs `{...}:idSalesman:{0..N}` (`.checked`) — **no** en el `label`, que puede quedar
desactualizado ("Seleccione...") tras el ajax.

### 7. Contar el total de una grilla sin `.ui-paginator-current`

Varias grillas **no** renderizan `.ui-paginator-current`. Para obtener el total:

```
ir a la última página (.ui-paginator-last)
total = (nºÚltimaPágina − 1) × filasPorPágina + filasEnLaÚltimaPágina
```
Así se midió el drill-down de DWX-EST-003: `(108 − 1) × 50 + 32 = 5.382`.

⚠ **`.ui-paginator-last` y `.ui-paginator-rpp-options` resuelven a 2 elementos** (paginador *top* y
*bottom*) → Playwright falla por *strict mode*. **Acotar siempre por el paginador:**
`[id="form:tablaX_paginator_top"] .ui-paginator-last`.

### 8. Leer un calendario (FullCalendar) — `/pages/itinerario`

No es `.ui-datatable`; `leerTabla` no sirve. Patrón:

```js
document.querySelectorAll('[data-date]')          // celda de día → atributo YYYY-MM-DD
  .forEach(c => c.querySelectorAll('.fc-event'))  // eventos de ese día
```
Navegar con `.fc-prev-button` / `.fc-next-button`. ⚠ La vista mensual **incluye días de los meses vecinos**
(bordes de la grilla): deduplicar por `data-date` antes de sumar, o se cuentan dos veces.

### 9. Contar marcadores de mapa — **dos mecanismos distintos**

| Pantalla | Cómo se plotean | Cómo contarlos |
|---|---|---|
| `rutero.xhtml` | `<img src=".../resources/icons/{n}{v\|m}.png">` | filtrar `src` por `/icons/` |
| `mapaRutas` | `<img src="data:image/svg+xml,...">` (pin rojo `#d92626`) | filtrar `src` por `d92626` |

🔴 **Google Maps inyecta ~44 `<img>` SVG propios** (pantalla completa, reencuadre, etc.). Contar todos los
`<img>` del `.gm-style` da un número **inflado**. Filtrar por el patrón del pin, y confirmar que son
marcadores reales chequeando tamaño (30×44 / 28×42) y `position:absolute` en el padre.
✅ En ambas pantallas el mapa de Google **sí cargó** — la advertencia del guión no se activó.

### 10. 🔴 Superficie de ESCRITURA nueva — para el inventario de prohibidos

| Pantalla | Controles que NO se tocan |
|---|---|
| `/pages/presupuestoVenta` | **`Agregar presupuesto`** · columna **`Eliminar`** por fila |
| `/pages/presupuestoCuota` | **`Agregar plan cuota`** · columna **`Eliminar`** por fila |

Ninguno se tocó. Se suman a la tabla de `_comunes.md`.

### 11. Typos de UI (cosméticos, no son defectos de datos)

- `rutero.xhtml`, combo Transacción: **"Depòsitos"** (acento grave en vez de agudo).
- `/pages/segmentacion`, `<title>`: **"Canales de Distribucion"** (sin tilde).

---

## Resumen de la parte 2b

### Conteo por marca — 11 casos

| Marca | Casos | Cuáles |
|---|---|---|
| **WEB-OK** | **6** | DWX-FAC-001 · DWX-VIS-001 · DWX-VIS-002 · DWX-VIS-003 · DWX-EST-001 · DWX-EST-002 |
| **WEB-FIELD-MISMATCH** | **1** | DWX-FAC-003 |
| **WEB-CALC-MISMATCH** | **1** | DWX-EST-003 |
| **WEB-N/A** | **3** | DWX-FAC-002 · DWX-EST-004 · DWX-EST-005 |
| **⛔ BLOCKED** | **0** | — |

Ledger `_web-results.jsonl`: **21 líneas previas + 11 = 32**. No se sobrescribió nada.

### Los dos descuadres, con sus dos números y el flag descartado

| Caso | Web | BD | Δ | Flag evaluado | Veredicto |
|---|---|---|---|---|---|
| **DWX-FAC-003** `/pages/facturaciones` (Tipo=`DOCUMENT_SALE`) | **0** filas | **735** vivas | **735** | `co_operation='D'` (ya excluido), `nu_balance>0` (735/735), `st=6` (único), empresa (única), fechas (todas en rango), `da_duedate` (0 nulos), cliente huérfano (0) → **ninguno explica** | **DEFECTO**. Causa probable: **`id_user` NULL en las 735** + join por Vendedor |
| **DWX-EST-003** `/pages/segmentacion` | contador **7.007** | su propio drill-down **5.382** | **1.625** | `in_suspension` = **1.625** → **explica el origen, NO lo justifica**: es una sola pantalla contra sí misma | **DEFECTO** |

### Contraste que conviene leer junto con la parte 1

| Pantalla | `co_operation='D'` | |
|---|---|---|
| `/pages/documentos` (parte 1) | **los muestra** | 🔴 defecto |
| `/pages/itinerario` (esta parte) | **los oculta** (6 visitas borradas, 2 días en blanco) | ✅ correcto |
| `/pages/facturaciones` (esta parte) | los excluye… **y también los 735 vivos** | 🔴 defecto por exceso |

El backend **sabe** filtrar el borrado lógico; el problema es que **no lo hace igual en todas las consultas**.

### Qué revisaría primero

1. **`/pages/facturaciones` con `DOCUMENT_SALE`** — impacto máximo: la cartera por cobrar de la empresa
   sale **completamente vacía** (735 documentos vivos con saldo). Empezar por el `id_user` NULL y por si
   el join contra usuarios es `INNER` en vez de `LEFT`.
2. **El contador de `/pages/segmentacion`** — arreglo chico, riesgo bajo: alinear `Cantidad clientes` a
   5.382 (el criterio que ya usan `/pages/clientes` y el propio drill-down).
3. **Auditar `co_operation='D'` consulta por consulta**, usando `/pages/itinerario` como referencia de
   implementación correcta y `/pages/documentos` como el caso a corregir.
4. **Cargar datos de presupuesto/cuota en un ambiente de prueba** — hoy 2 de las 5 pantallas de Estructura
   Comercial y la mitad `INVOICE` de Facturaciones están **sin cobertura real**, no aprobadas.
