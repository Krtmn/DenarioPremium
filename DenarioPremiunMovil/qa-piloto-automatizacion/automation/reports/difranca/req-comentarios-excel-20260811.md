# Validación de requerimiento — "Mostrar los comentarios en el reporte en Excel de las Transacciones"

**RUN_ID** `req_comentarios_excel_20260811` · **Fecha** 2026-08-11 · **Cliente** difranca · **Playa** El Yaque
**Base** `http://denarioelyaque.ddns.net:8080/DenarioPremium` · **Modo** read-only (sólo exportar y leer)
**Guarda de tenant** ✅ verificada por TEXTO: las 3 empresas ofrecidas son
`*DISTRIBUIDORA DIAZ HERNANDEZ *` (DDHP_A12, `id_enterprise=2`) · `DIFRANCA C.A` (DIF_A12) ·
`DISTRIBUIDORA DH VITAL, C.A.` (DHVITAL01_A). **Ninguna empresa ajena.**

---

## 0. Veredicto en una línea

**El requerimiento está CUMPLIDO en los 6 módulos de transacciones**, incluidos los dos que se sospechaba
que fallarían (devoluciones y visitas resuelven **su propia fuente**, no `tx_comment`).
**La regresión no encontró daño causado por el requerimiento**, pero sí **un defecto grave preexistente o
colateral en la LISTA de Cobros** (🔴 D-01) que deja la pantalla vacía y **diverge del Excel**.

---

## 1. Mapa de exportación — dónde vive el reporte en cada módulo

Es la primera vez que se mapea. **Hay un solo control y un solo formato por módulo; no hay menú de opciones,
ni PDF, ni CSV, ni selector de columnas.**

| Módulo | Ruta | Archivo que descarga | Formato real | Magic bytes | Hoja | Cabecera en fila | Columnas |
|---|---|---|---|---|---|---|---|
| Pedidos | `/pages/pedidos` | `pedidos.xlsx` | **XLSX (ZIP)** | `PK\x03\x04` ✅ | `Pedidos` | 10 | 32 (A–AF) |
| Cobros | `/pages/cobros` | `Cobros.xls` | **OLE2 / BIFF** | `D0 CF 11 E0` | `Cobros` | 10 | 47 (A–AU) |
| Devoluciones | `/pages/devoluciones` | `Devoluciones.xls` | OLE2 / BIFF | `D0 CF 11 E0` | `Devoluciones` | **9** | 19 (A–S) |
| Inventarios | `/pages/inventarios` | `Inventarios.xls` | OLE2 / BIFF | `D0 CF 11 E0` | `Inventarios` | 10 | 24 (A–X) |
| Visitas | `/pages/visitas` | `ReporteVisitas.xls` | OLE2 / BIFF | `D0 CF 11 E0` | `ReporteVisitas` | **11** | 16 (A–P) |
| Depósitos | `/pages/depositos` | `Depositos.xls` | OLE2 / BIFF | `D0 CF 11 E0` | `Depositos` | **9** | 27 (A–AA) |

⚠ **El `PK` del encargo sólo aplica a Pedidos.** Los otros 5 **no son XLSX**: son `.xls` clásico (OLE2), cuyo
magic correcto es `D0 CF 11 E0 A1 B1 1A E1`. **Todos los archivos abrieron y parsearon bien y pesan > 0.**
Un chequeo de QA que exija `PK` daría 5 falsos negativos.

Todos los archivos llevan arriba un **bloque de parámetros** (`Fecha de exportación`, `Desde`, `Hasta`,
`Empresa`, `Vendedor`, `Cliente`; Visitas agrega `Estatus`) y **después** la fila de cabecera.
Sólo **Visitas** cierra con un pie `Total de resultados: N`.

---

## 2. ¿Existe la columna de comentarios? ¿Trae el dato? — una fila por módulo

| Módulo | ¿Existe? | Columna | **Rótulo exacto** | Fuente en BD | ¿Trae el dato? | Cotejo celda‑por‑celda contra BD |
|---|---|---|---|---|---|---|
| **Pedidos** | ✅ | **AE** | `Comentarios` | `order.tx_comment` | ✅ | **35/35 pedidos.** 39805 (QA) **exacto**. 39801/39803/39804 exactos; 39804 con acento **byte a byte**. 39802 pierde el espacio final. |
| **Cobros** | ✅ | **H** | `Comentarios` | `collection.tx_comment` | ✅ | **77/77** del rango 01–11/08 · **17/17** del 04/08 · **88/88 refs** con filtro de vendedor. 21851 · 21852 · 21853 (QA) **exactos**. |
| **Devoluciones** | ✅ | **R** | `Comentarios` | 🔴 **`return.tx_description`** | ✅ | **5/5 byte a byte**, incluida la 880 (QA) exacta. |
| **Inventarios** | ✅ | **U** | `Comentarios` | `client_stock.tx_comment` | ✅ | **2/2**. Ref 18 (QA) coincide salvo el espacio final; ref 17 sale vacío = `NULL` en BD ✅. |
| **Visitas** | ✅ | **L** | 🔴 **`Descripción`** (no "Comentarios") | 🔴 **`incidence.tx_description`** (tabla hija) | ✅ | **69/69 visitas, 71/71 filas, byte a byte** — **conserva el espacio final**. 28225 (QA) exacta. |
| **Depósitos** | ✅ | **Z** | `Comentarios` | `deposit.tx_comment` | ✅ | 2/2 (recorta el espacio final). Módulo sin uso en difranca. |

### 🔴 La hipótesis del "enganche a `tx_comment`" queda REFUTADA

Se planteó que si el desarrollo había enganchado `tx_comment`, funcionaría en pedidos/cobros/inventarios y
fallaría en devoluciones y visitas. **Medido: no es así.**

- **Devoluciones** resuelve correctamente `return.tx_description` (columna distinta).
- **Visitas** resuelve `incidence.tx_description`, que vive en **otra tabla**, hija de la visita.

### Visitas con varias incidencias — qué hace el reporte

**Genera una fila por incidencia, cada una con SU propia descripción.** No concatena, no muestra sólo la
primera, no deja vacío.

| Caso | Incidencias en BD | Filas en el Excel | Resultado |
|---|---|---|---|
| Visita **28225** (QA) | 1 | 1 | descripción exacta, **con** espacio final |
| Visita **28222** | 2 | 2 | dos descripciones **distintas**, una por fila |
| Visita **28219** | 2 | 2 | dos filas, descripciones correctas |
| Visita sin incidencia | 0 | 1 | fila presente con `Descripción` vacía ✅ |

**Conteo exacto:** 69 visitas · 70 incidencias · 2 visitas con 2 ⇒ **71 filas esperadas = 71 filas exportadas**,
y el pie del archivo dice `Total de resultados: 71`.

---

## 3. Regresión — ¿el requerimiento rompió algo?

| Verificación | Resultado |
|---|---|
| **Cabeceras alineadas con los datos** | ✅ **en los 6 módulos.** Se validó columna por columna contra BD (empresa, ref, fecha, vendedor, cliente, código de cliente, montos, moneda, coordenadas, adjuntos, estatus). **Ninguna columna corrida.** |
| **Conteo de filas contra BD** | ✅ 5 de 6 exactos · ❌ 1 (Depósitos, ver D-03) |
| **Archivo válido y > 0 bytes** | ✅ los 6 abren y parsean (ver §1 sobre el magic real) |
| **Los filtros siguen funcionando** | ✅ empresa, vendedor, fechas y `# Ref` se aplican **a los datos**, no sólo al encabezado |
| **El export baja el resultado completo, no la página visible** | ✅ 88 refs exportados con 50 pintados en pantalla |
| **Los demás campos siguen bien** | ✅ montos numéricos exactos (17/17 y 35/35), fechas, cliente, vendedor, estado |

**Detalle de conteos medidos:**

| Módulo | Filtro | Contados en pantalla | Filas de datos en el Excel | Oráculo BD | ¿Cuadra? |
|---|---|---|---|---|---|
| Pedidos | 01–11/08, DDHP | 35 | 478 líneas / **35 refs** | 35 pedidos; líneas = `Σ nu_details` | ✅ |
| Cobros | 04/08, DDHP | 17 | 20 líneas / **17 refs** | 17 cobros (líneas = formas de pago) | ✅ |
| Cobros | julio, vendedor 275 | 88 | 111 líneas / **88 refs** | 88 | ✅ |
| Cobros | 01–11/08, DDHP | **0** 🔴 | 134 líneas / **77 refs** | **77** | ✅ el Excel · ❌ la lista |
| Devoluciones | 01–11/08, DDHP | 5 | 12 líneas / 5 refs | 5 devoluciones · 12 `return_detail` | ✅ |
| Inventarios | 01–11/08, DDHP | 2 | 3 líneas / 2 refs | 2 inventarios · 3 `client_stock_detail` | ✅ |
| Visitas | 01–11/08, DDHP | 2 páginas | **71** | 71 | ✅ |
| Depósitos | 2024–2025, DDHP | 5 | **2** | 5 depósitos | ❌ **D-03** |

**Contenido especial (¿respeta el texto?):**

| Caso | Resultado |
|---|---|
| **Acentos / eñes** | ✅ **respetados** en Pedidos (xlsx) y en Cobros, Devoluciones, Visitas y Depósitos (xls). ❌ **rotos en Inventarios** → D-02 |
| **Espacio al final** | ❌ **recortado** en Pedidos, Cobros, Inventarios y Depósitos · ✅ **respetado** en Visitas → D-04 |
| **Punto y coma `;`** | Presentes en BD (12 cobros, 7 pedidos). No rompieron celdas ni corrieron columnas en los archivos revisados. |
| **Comillas `"`** | Presentes en BD (2 cobros, 15 pedidos). Sin efecto observado. |
| **Saltos de línea / tabs** | **No existen** en los datos (`0` en `collection` y `order`) ⇒ **no evaluable**, no se fuerza dato en producción. |
| **Texto largo** | Máximo real 200 caracteres; se exporta completo, sin truncar. |

---

## 4. Defectos

### 🔴 D-01 — La LISTA de Cobros sale vacía y **diverge del Excel** (severidad alta, hoy sale la v21)

**Con la empresa DDHP_A12, cualquier rango cuya fecha final sea ≥ 07/08/2026 devuelve 0 filas en pantalla.**
Es decir: **el rango por defecto de hoy (01/08–11/08) muestra la lista de Cobros VACÍA** para la empresa
principal (18.222 cobros históricos).

Evidencia (reproducible, empresa DDHP_A12, resto de filtros en placeholder):

| Rango | Contados en pantalla | BD | |
|---|---|---|---|
| 01/07 – 31/07 | 765 | 765 | ✅ |
| 01/07 – 02/08 | 786 | 786 | ✅ |
| 01/07 – **06/08** | 826 | 826 | ✅ |
| 01/07 – **07/08** | **0** | 833 | ❌ |
| **07/08 – 07/08** | **0** | 7 | ❌ |
| **08/08 – 11/08** | **0** | 9 | ❌ |
| **11/08 – 11/08** | **0** | 6 | ❌ |
| 01/08 – 11/08 | **0** | 77 | ❌ |
| 01/08 – 11/08 **con empresa DH VITAL** | **6** | 6 | ✅ **no afecta a las otras empresas** |

- La respuesta del servidor es **HTTP 200 sin excepción** (9,5 KB) — el servidor devuelve 0 legítimamente.
- Los registros **existen y se abren por `# Ref`** (21824, 21851, 21852 verificados uno a uno).
- **Causa raíz: no identificada.** Se descartaron: nulos en los datos, `co_operation='D'`, `st_collection`,
  zona horaria, `co_type` (un cobro `co_type=2` de 2024 lista sin problema) y el vendedor (los cobros del
  07/08+ son del vendedor 275, que lista 88 cobros de julio sin problema).
- 🔴 **Lo más importante para esta validación:** **el Excel exportado con ese mismo filtro trae los 77 cobros
  correctos y completos**, con sus comentarios exactos. **La lista y el reporte no coinciden**, y eso es un
  defecto en sí mismo: el usuario ve la pantalla vacía y **no tiene motivo para pulsar Exportar**.

**No es atribuible al requerimiento de comentarios** — no hay línea base previa para afirmarlo — pero **es
bloqueante para la versión de hoy** y debe verse antes de liberar.

### 🟡 D-02 — `Inventarios.xls` pierde los acentos

En las **cabeceras** y en el **bloque de parámetros** los acentos salen como `?` **literal** (byte `0x3F`,
no U+FFFD): `C?digo Empresa`, `Ubicaci?n`, `Fecha Expiraci?n`, `Par?metros de B?squeda`,
`Fecha de exportaci?n`. **Los otros cinco archivos no tienen el problema** (`Devoluciones.xls` muestra
`especificación` y `extrañas` correctamente), así que es específico de este reporte, no del formato `.xls`.
No se pudo evaluar sobre datos porque la muestra de inventarios no tenía texto acentuado; **es esperable que
también afecte a nombres de producto y cliente con acento**.

### 🟡 D-03 — El Excel de Depósitos pierde depósitos enteros

La lista muestra **5** depósitos; el archivo trae **2**. Los 3 ausentes (refs 3, 4 y 5) son exactamente los que
**no tienen cobros vinculados** (`collection.id_deposit` nulo). El reporte arma una fila por cobro vinculado,
así que un depósito sin cobros **desaparece del archivo**. La columna `Comentarios` sí está presente y poblada
en las 2 filas que sí salen.

### 🟡 D-04 — El espacio final del comentario se recorta (y no en todos los módulos igual)

| Módulo | Espacio final |
|---|---|
| Pedidos · Cobros · Inventarios · Depósitos | ❌ **se recorta** |
| Visitas | ✅ **se respeta** |

Casos concretos: pedido **39802** (BD 9 caracteres → celda 8), inventario **18** (BD 24 → celda 23),
depósitos 1 y 2 (BD 32 → celda 31). En cambio la visita **28225** conserva sus 27 caracteres.
**El resto del texto es idéntico en todos los casos** — sólo se pierde el espacio del final.
Es menor, pero **la inconsistencia entre módulos** conviene unificarla.

### 🟢 D-05 — `Fecha de exportación` no es la hora de exportación

Queda congelada en el momento en que se creó la vista/sesión del módulo, no en el de la descarga.
Cuatro exportaciones de Cobros hechas a las 12:54, 13:11, 13:21 y 13:38 dicen **todas** `12:44:52`.

### 🟢 D-06 — El bloque de parámetros no refleja los filtros realmente aplicados

Sólo lista `Desde/Hasta/Empresa/Vendedor/Cliente`. **Omite `# Ref`, `Tipo Cobro`, `Moneda`, `Status`,
`Depositado` y `Tiene Adjunto`.** Se exportó filtrando por `# Ref = 21851` y el archivo igual anunciaba
`Desde: 01/8/2026 · Hasta: 11/8/2026`, que **no fue el filtro efectivo**. Induce a error al que recibe el archivo.
(El formato de fecha del bloque, `01/8/2026`, tampoco lleva relleno de ceros.)

### 🟢 D-07 — Error de tipeo en una cabecera de Cobros

Columna **X**: `Método de Pägo` (diéresis). Debería ser `Método de Pago`.

### 🟢 D-08 — `pedidos.xlsx` declara tamaños ZIP inválidos

Las entradas del ZIP traen `uncompressed size = 0` en su cabecera local. Excel y la librería `xlsx` lo abren
sin problema, pero **los parsers estrictos emiten `Bad uncompressed size`** (9 avisos). Es el único módulo que
exporta XLSX; conviene revisarlo antes de que un integrador lo rechace.

### 🟡 D-09 — La lista de Cobros omite registros en silencio (independiente de D-01)

Buscando el 09/10/2024 (empresa DDHP) la lista muestra **30** cobros y BD tiene **33**. Los 3 ausentes
(1592, 1597, 1599) **son los tres del vendedor `id_user = 283`**, y no se explican por `co_operation`,
`st_collection`, `co_type` ni zona horaria. **No se evaluó si el Excel de ese rango los incluye.**

### Observaciones que **no** son defectos (verificadas para no reportarlas mal)

- **`Nombre Cliente` "distinto" en 5 de 17 cobros:** el Excel trae el nombre **completo** del maestro
  `client`; lo que está truncado a 30 caracteres es el snapshot `collection.na_client`. **El Excel acierta.**
- **`Estatus` vacío en las devoluciones 875 y 876:** la **lista de la web muestra exactamente lo mismo**
  ⇒ comportamiento preexistente de la pantalla, **fielmente reflejado** por el Excel. No lo introdujo el reporte.
- **Inventarios "pierde" un registro de agosto:** hay 3 con `id_enterprise=2` pero uno tiene
  `co_enterprise='ALIP_BSD'`. La UI filtra por `co_enterprise` y muestra 2. **Correcto.**
- **Formato numérico:** los montos son **celdas numéricas reales** (`t:'n'`), no texto. Lo que parece
  formato en-US es sólo la representación del lector.

---

## 5. Cobertura — qué se midió y qué no

| Módulo | Exportación | Cotejo de comentario | Conteo vs BD | Filtros |
|---|---|---|---|---|
| Pedidos | ✅ | ✅ 35 registros | ✅ | ✅ |
| Cobros | ✅ (5 exportaciones) | ✅ 77 + 17 + 88 + 3 de QA | ✅ | ✅ empresa, vendedor, fechas, `# Ref` |
| Devoluciones | ✅ | ✅ 5 registros | ✅ | ✅ empresa, fechas |
| Inventarios | ✅ | ✅ 2 registros | ✅ | ✅ empresa, fechas |
| Visitas | ✅ | ✅ 69 visitas / 71 filas | ✅ | ✅ empresa, fechas |
| Depósitos | ✅ | ✅ 2 registros | ❌ **D-03** | parcial (rango 2024–2025) |

**No evaluado, dicho explícitamente:**

- **Saltos de línea y tabuladores en comentarios:** no existen en los datos de esta playa ⇒ **no evaluable**
  sin escribir en producción, cosa que este agente no hace.
- **Acentos en los DATOS de Inventarios:** la muestra disponible (2 registros) no tenía texto acentuado.
- **Si el Excel de Cobros del 09/10/2024 incluye o no los 3 registros de D-09.**
- **Causa raíz de D-01:** caracterizada y acotada, **no** diagnosticada.

---

## Patrones / selectores nuevos

### 🆕 El control de exportación — uno solo por módulo

```js
// ✅ anclar por TÍTULO. El id es j_idt* y está DENTRO del datatable  (form:cobrosDT:j_idt167,
//    form:pedidosDT:j_idt186, form:tablaVisit:j_idt164 …) ⇒ NUNCA anclarlo.
a[title="Exportar Reporte"]        // <a> con <img src=".../excelexport.png.xhtml">
```

- **No es ajax:** el `onclick` es
  `PrimeFaces.addSubmitParam('form',{...}).submit('form')` ⇒ **submit completo del formulario**.
  Se captura con `page.waitForEvent('download')` desde `browser_run_code_unsafe`.
- **Un solo formato por módulo.** No hay PDF, ni CSV, ni selector de columnas, ni menú de opciones.
- **El export NO respeta la paginación:** baja el **conjunto completo** del filtro (88 refs con 50 pintados).
- 🔴 **El export NO comparte el resultado con la lista:** puede traer 77 registros cuando la lista dice **0**
  (ver D-01). ⇒ **Nunca usar el conteo de la lista como oráculo del archivo, ni al revés.**

### 🆕 Estructura de los archivos — la cabecera NO está en una fila fija

La fila de cabecera es la **9, 10 u 11** según el módulo. Localizarla por estructura:

```js
const hi = rows.findIndex(r => r.filter(c => c != null).length > 3);   // 1ª fila con >3 celdas no nulas
```

- Arriba va el **bloque de parámetros** (`Fecha de exportación`, `Desde`, `Hasta`, `Empresa`, `Vendedor`,
  `Cliente`; Visitas suma `Estatus`).
- **Visitas** cierra con `Total de resultados: N` **y ~10 filas completamente vacías** ⇒ **filtrar filas vacías
  antes de contar**, o se cuentan 81 donde hay 71.
- **Granularidad de la fila, por módulo:** Cobros = una fila por **forma de pago** · Pedidos = una por
  **línea de producto** (`= nu_details`) · Devoluciones e Inventarios = una por **línea de detalle** ·
  Visitas = una por **incidencia** · Depósitos = una por **cobro vinculado**.
  ⇒ **Contar refs distintos, no filas**, salvo en Visitas.

### 🆕 Formatos y rótulos NO son uniformes entre módulos

- **Pedidos exporta `.xlsx` (magic `PK`); los otros cinco exportan `.xls` OLE2 (magic `D0 CF 11 E0`).**
  Un oráculo que exija `PK` falla en 5 de 6.
- El nombre del archivo tampoco sigue convención: `pedidos.xlsx` (minúscula) vs `Cobros.xls`,
  `ReporteVisitas.xls`, `Depositos.xls`.
- El rótulo del comentario es `Comentarios` en 5 módulos y **`Descripción` en Visitas**.

### 🆕 Herramienta para leer los archivos

El proyecto **no** tiene parser de Excel. Resuelto con:

```bash
npm install xlsx --no-save     # en el scratchpad, fuera del repo
```

`xlsx` lee tanto el BIFF/OLE2 como el XLSX. Para detectar recortes de espacios hay que leer con
**`raw:true`** y mirar `cell.v` / `cell.t`: con `raw:false` se compara la representación, no el valor.

### ✅ Reconfirmaciones y correcciones de `_comunes.md`

- 🔴 **Los ids `#j_idt12` / `#j_idt14` / `#j_idt16` del login VOLVIERON a ser los del formulario** en El Yaque
  (el archivo los daba por derogados el 2026-08-07). **Igual no conviene usarlos:** se entró con
  `input[placeholder="Usuario"]` / `input[placeholder="Clave"]`, que es estable y no depende del árbol a11y.
- ✅ **Los filtros persisten en sesión:** la Empresa quedó en `DH VITAL (4)` tras cambiarla y **seguía puesta**
  después de navegar a otros 4 módulos y volver a `/pages/cobros`. **Verificar y fijar la empresa siempre.**
- ✅ **El `<select>` de Empresa tiene `value` distinto por módulo**, tal como documenta el archivo:
  `2` (`id_enterprise`) en cobros/devoluciones/inventarios/visitas/depósitos · `DDHP_A12` (`co_enterprise`)
  en pedidos.
- ✅ **Visitas usa `:btnBuscar`**, el resto `:ajax`. Confirmado en los 6.
- ✅ **Las fechas se setean por widget** (`PrimeFaces.widgets[...].setDate('DD/MM/YYYY')`), localizándolo con
  `/date[BF]$/.test(v.id)`. 100 % de acierto en ~15 búsquedas.
- 🆕 **`/pages/inventarios` existe y funciona aunque NO aparece en el menú** de esta playa.
- 🆕 **`PF('pedidosDT').paginator.cfg.rowCount` sirve también en devoluciones, inventarios y depósitos**
  (las tres usan `form:pedidosDT`). En **visitas** no existe ⇒ contar links de página.

### 🆕 Fuentes del comentario en BD (para futuros oráculos)

| Módulo | Tabla.columna |
|---|---|
| Pedidos | `order.tx_comment` |
| Cobros | `collection.tx_comment` |
| Inventarios | `client_stock.tx_comment` |
| Depósitos | `deposit.tx_comment` |
| **Devoluciones** | **`return.tx_description`** — `return` **no tiene** `tx_comment` |
| **Visitas** | **`incidence.tx_description`** — tabla **hija**, N por visita |

⚠ `visit_view` **no es legible** con el usuario de sólo lectura: `permission denied for sequence visit_view_seq`.
El oráculo de visitas se arma con `visit LEFT JOIN incidence`, que sí es legible.

---

*Agente QA web · 2026-08-11 · read-only · todos los archivos exportados fueron borrados tras verificarse*
