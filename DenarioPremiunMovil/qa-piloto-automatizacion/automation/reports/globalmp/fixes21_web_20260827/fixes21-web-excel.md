# FIXES-21 · WEB · Punto 1 — Excel de pedidos con selector General / Detalle

**Cliente:** `globalmp` — COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.
**Playa:** ISLA COCHE · `http://denarioislacoche.ddns.net:8080/DenarioPremium`
**Módulo:** Transacciones → Pedidos · **Usuario:** `admin` (bloque `# USUARIO WEB`)
**Fecha:** 2026-08-27 · **Ejecutó:** QA web (Playwright MCP, solo lectura)

**Empresa usada:** `00002 = COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.` (la que trae por
defecto). **No se probó** con `00001 = HC TRADING MARKET 2021, C.A`.

---

## 🟢 VEREDICTO

> **El selector FUNCIONA.** `General` y `Detalle` producen **dos archivos distintos y ambos
> correctos**: `General` emite **una fila por pedido** y `Detalle` **una fila por producto**, sobre
> **exactamente el mismo conjunto de pedidos**. La aritmética cierra **al 100 %** en los dos
> escenarios probados, sin una sola discrepancia en 139 pedidos / 700 líneas.

**Los dos riesgos que había que descartar quedan descartados:**

| Riesgo | Resultado |
|---|---|
| Que las dos opciones bajen **el mismo archivo** | ❌ Descartado — MD5 y tamaño distintos, y estructura interna distinta (16 vs 32 columnas) |
| Que `Detalle` traiga **cabeceras repetidas sin líneas de producto** | ❌ Descartado — trae código, nombre, cantidad, unidad y precio de cada producto; 0 códigos repetidos dentro de un mismo pedido; 172 productos distintos |

**Reserva:** un caso menor (`E10`, exportar con 0 resultados) **no cumple** el criterio: no descarga
nada y **no muestra ningún aviso**. No es un error de servidor y no bloquea el tag, pero es un
silencio que conviene corregir. Ver más abajo.

**`E09` (conteo contra BD) queda BLOCKED** — sin oráculo de base. Se sustituyó por oráculo de UI.

---

## 1 · Tabla comparativa de los archivos descargados

Se corrieron **dos escenarios** para que el contraste no dependiera de un solo pedido.

### Escenario A — filtro `# Ref = 18568` (1 pedido)

| | **General** | **Detalle** |
|---|---|---|
| Archivo guardado | `A-general-ref18568.xlsx` | `B-detalle-ref18568.xlsx` |
| Tamaño | 4.343 B | 6.048 B |
| MD5 | `f89fdd28fca790946654edded74df287` | `a2e89c79c684dc07ebff3a6885e0013e` |
| Magic bytes | `PK` ✅ (ZIP real) | `PK` ✅ (ZIP real) |
| `xl/worksheets/sheet1.xml` | 3.924 B | 18.436 B |
| Nº de columnas | **16** | **32** |
| **Filas de datos** | **1** | **7** |
| Pedidos distintos | 1 (`18568`) | 1 (`18568`) |

### Escenario B — filtro `Vendedor = KIMBERLIN LEON` (139 pedidos)

| | **General** | **Detalle** |
|---|---|---|
| Archivo guardado | `C-general-vendedor-kimberlin.xlsx` | `D-detalle-vendedor-kimberlin.xlsx` |
| Tamaño | 18.003 B | 124.088 B |
| MD5 | `595296da9f29ae2e31786435e2e0a4c6` | `3a07de29492a544d3a0d7e276ec3f571` |
| Magic bytes | `PK` ✅ | `PK` ✅ |
| Nº de columnas | **16** | **32** |
| **Filas de datos** | **139** | **700** |
| Pedidos distintos | **139** | **139** |
| Rango de `# Ref` | 15996 – 18546 | 15996 – 18546 |
| Vendedores presentes | solo `KIMBERLIN LEON` | solo `KIMBERLIN LEON` |

### Columnas de cada formato (`E08`)

**General (16):**
`Ref | Estatus | Fecha Pedido | Fecha Creacion | Vendedor | Cliente | # Detalles | Monto Base |
Moneda | Monto Total | Monto Conversion | Moneda Conversion | Tasa Conversion | Tipo Pedido |
Comentarios | Adjuntos`

**Detalle (32):**
`Código Empresa | Nombre Empresa | Código Vendedor | Nombre Vendedor | # Ref. Pedido | Código
Pedido | Fecha Pedido | Código Cliente | Nombre Cliente | Monto pedido | Moneda pedido | Tasa de
cambio | Monto conversión | Moneda conversión | Descuento Global | Código Estructura Producto |
Estructura Producto | **Código Producto** | **Nombre Producto** | **Cantidad Pedida** | Código
Unidad | Nombre Unidad | **Precio Base Producto** | Precio Base Conversión | **Descuento
Producto** | **Total Producto** | Total Conversión | Coordenadas | Sucursal | Dirección |
Comentarios | Adjuntos`

⇒ `Detalle` **añade** las cuatro columnas de producto que pedía el caso (código, descripción,
cantidad, precio) y además unidad, descuento de línea, total de línea, estructura de producto y
datos de la sucursal/dirección del cliente. **No son los mismos encabezados repetidos.**

---

## 2 · El mismo pedido en los dos formatos

Pedido **`18546`** — `COMERCIAL MEIEN 2011, C.A` · vendedor `KIMBERLIN LEON`.

**En `General` → 1 sola fila:**

| Ref | Estatus | Fecha Pedido | Vendedor | Cliente | # Detalles | Monto Base | Monto Total | Tipo |
|---|---|---|---|---|---|---|---|---|
| 18546 | Enviado | 25/8/2026 14:08:28 | KIMBERLIN LEON | COMERCIAL MEIEN 2011, C.A | **4** | 35,15 USD | 40,774 USD | FACTURA |

**En `Detalle` → 4 filas, una por producto:**

| Código | Producto | Cant. | Unidad | Precio Base | Total Producto |
|---|---|---|---|---|---|
| HS64 | SALSA INGLESA HEINZ 24/300cc | 0,25 | CAJA | 53,48 | 15,5092 |
| HS72 | SALSA HEINZ MIX INGL/SOY/AJO 24/150cc | 0,25 | CAJA | 31,06 | 9,0074 |
| HS31 | SALSA EXTRA PICANTE HEINZ 24/150cc | 0,25 | CAJA | 37,68 | 10,9272 |
| HS59 | SALSA DE SOYA HEINZ 24/150cc | 0,125 | CAJA | 36,76 | 5,3302 |

Σ Total Producto = **40,774** = `Monto Total` de la fila de `General`. ✅

*(El pedido `18568` del escenario A da el mismo resultado: 1 fila en General con `# Detalles = 7`,
7 filas de producto en Detalle, Σ = 980,6282 = su `Monto Total`. Extractos completos en
`extracto-A-general-ref18568.txt` y `extracto-B-detalle-ref18568.txt`.)*

---

## 3 · La aritmética

### `filas(General)` vs nº de pedidos

| Escenario | `Total de Resultados` (UI) | Filas de datos en `General` | ¿Cuadra? |
|---|---|---|---|
| A · `# Ref = 18568` | **1** | **1** | ✅ |
| B · `Vendedor = KIMBERLIN LEON` | **139** | **139** | ✅ |

### `filas(Detalle)` vs Σ líneas de los pedidos

| Escenario | Σ `Total items` de la UI | Σ `# Detalles` del Excel General | Filas de datos en `Detalle` | ¿Cuadra? |
|---|---|---|---|---|
| A | **7** | **7** | **7** | ✅ |
| B | **700** | **700** | **700** | ✅ |

*(La Σ de la UI se obtuvo poniendo el paginador en 200 filas para tener los 139 pedidos en pantalla
y sumando la columna `Total items`.)*

### Cruce pedido a pedido (escenario B, 139 pedidos)

| Comprobación | Resultado |
|---|---|
| Conjunto de `# Ref` de `General` == conjunto de `# Ref. Pedido` de `Detalle` | ✅ **idénticos** (139 = 139, diferencia simétrica vacía en ambos sentidos) |
| Pedidos donde `# Detalles` (General) ≠ nº de filas en `Detalle` | **0 de 139** ✅ |
| Códigos de producto repetidos dentro de un mismo pedido | **0 pedidos** ✅ (descarta el "cabeceras repetidas") |
| Productos distintos en todo el `Detalle` | 172 |
| Σ `Total Producto` cuadra con la cabecera del pedido | **139 de 139** ✅ (118 contra `Monto Base`, 21 contra `Monto Total`; **0 descuadres**) |

`filas(Detalle) = 700 > filas(General) = 139` ✅ — y no por repetición: por líneas de producto
reales, con nombre y precio propios, que suman el importe de su pedido.

Salidas crudas en `extracto-comparativa-4-archivos.txt`, `extracto-cruce-general-vs-detalle.txt` y
`extracto-aritmetica-importes.txt`.

---

## 4 · Resultado caso por caso

| ID | Caso | Resultado | Evidencia |
|----|------|-----------|-----------|
| **E01** | Menú del botón Excel | ✅ **PASS** | Exactamente **dos** opciones: `General` (`form:pedidosDT:j_idt188`) y `Detalle` (`form:pedidosDT:j_idt190`), dentro del overlay `form:pedidosDT:j_idt187`. Coinciden con los ids medidos. `img/E01-menu-excel-general-detalle.png` |
| **E02** | Elegir `General` | ✅ **PASS** | Descarga `pedidos.xlsx`. Magic bytes `PK` → ZIP real, **no** una página de error. Se abrió y se leyó su contenido |
| **E03** | Elegir `Detalle` | ✅ **PASS** | Descarga un archivo **distinto**: MD5, tamaño y estructura interna diferentes en los dos escenarios |
| **E04** | Abrir `General` | ✅ **PASS** | 1 fila por pedido. 1 fila / `Total de Resultados = 1`; 139 filas / `Total de Resultados = 139` |
| **E05** | Abrir `Detalle` | ✅ **PASS** | 1 fila por producto. 7 filas / Σ items 7; 700 filas / Σ items 700 |
| **E06** | 🔑 **Contraste entre los dos** | ✅ **PASS** | `filas(Detalle) 700 > filas(General) 139`; **los dos archivos cubren exactamente los mismos 139 pedidos**; `# Detalles` de cada pedido == sus filas en `Detalle` en los 139 |
| **E07** | Exportar con filtro (vendedor) | ✅ **PASS** | Con `Vendedor = KIMBERLIN LEON`: ambos archivos traen **solo** ese vendedor, ningún pedido de fuera, y el bloque `Parámetros de Búsqueda` declara `Vendedor: KIMBERLIN LEON`. `img/E07-filtro-vendedor-139-resultados.png` |
| **E08** | Cabeceras de cada formato | ✅ **PASS** | General 16 columnas de cabecera; Detalle 32 = cabecera + producto (código, descripción, cantidad, unidad, precio, descuento, total de línea) |
| **E09** 🔵 | Conteo contra BD | ⛔ **BLOCKED** | Sin oráculo de BD — ver §6 |
| **E10** | Exportar con 0 resultados | ⚠️ **FAIL menor (🟡)** | Con `# Ref = 99999999` → `Total de Resultados: 0`. Ni `General` ni `Detalle` descargan archivo, **y tampoco aparece ningún mensaje**. La pantalla queda intacta y **no hay error de servidor** (sin `Exception`, sin HTTP 500, sin growl de error). Pero el criterio pedía "archivo vacío con cabeceras **o** aviso claro" y no se cumple ninguno de los dos: el botón queda mudo. `img/E10-cero-resultados-sin-descarga.png` |

**Marcador:** 8 PASS · 1 FAIL menor · 1 BLOCKED.

---

## 5 · Observaciones menores (no bloquean el tag, no son parte de los casos)

1. **El bloque `Parámetros de Búsqueda` no refleja el filtro `# Ref`.** Con `# Ref = 18568`
   aplicado, la cabecera del Excel sigue diciendo `Vendedor: Todos` / `Cliente: Todos` y el rango
   de fechas, pero **no menciona la referencia**. El dato exportado sí respeta el filtro (solo baja
   ese pedido); lo que falta es dejar constancia del filtro en la cabecera del archivo. Sí aparecen
   correctamente `Empresa` y `Vendedor` cuando se usan.
2. **`Fecha de exportación` no se refresca.** Los cuatro archivos, descargados entre las 14:40 y
   las 14:47 (hora local), traen todos `Fecha de exportación: 27/8/2026 14:11:39` — que corresponde
   al momento en que se cargó la pantalla, no al de la exportación.
3. **`Total Producto` mezcla dos criterios de IVA.** En los 139 pedidos la suma de líneas **siempre
   cuadra**, pero en 118 cuadra contra `Monto Base` (línea neta) y en 21 contra `Monto Total`
   (línea con impuesto). Puede ser legítimo — productos o clientes con precio impuesto incluido —
   pero **no se pudo dictaminar sin BD**. Queda anotado como *por verificar*, **no** como defecto, y
   es ajeno al selector General/Detalle.

---

## 6 · Oráculos usados

| Oráculo | Estado | Detalle |
|---|---|---|
| **BD `global_mp`** | ⛔ **No disponible** | Dos bloqueos, no uno: (a) el script `automation/db/query.js` **no existe** en este workspace (`MODULE_NOT_FOUND`), y no hay `psql` ni driver de Postgres en Python (`psycopg2`/`pg8000` ausentes); (b) según lo medido hoy en el guión, `user_read` sigue sin `GRANT SELECT` sobre `global_mp` (`permission denied` en las 6 tablas probadas). **Acción DBA pendiente + herramienta de consulta pendiente.** |
| **UI — `Total de Resultados`** | ✅ **Usado** | Oráculo de `filas(General)`: 1 y 139 |
| **UI — columna `Total items`** | ✅ **Usado** | Oráculo de `filas(Detalle)`: Σ = 7 y Σ = 700, leídos con el paginador en 200 filas |
| **Consistencia interna de los archivos** | ✅ **Usado** | El más fuerte de los tres, y el único independiente del backend de la lista: Σ `Total Producto` de las líneas == importe de cabecera del pedido, en **139 de 139**; y el conjunto de `# Ref` de un archivo == el del otro |

⚠ Nota de rigor: `Total items` (UI) y `# Detalles` (Excel General) los produce el mismo backend, así
que no son oráculos independientes entre sí. Lo que **sí** es independiente es que el `Detalle`
emita 700 filas de producto con nombre, cantidad y precio propios cuyos importes suman el total de
su pedido — eso no se puede fabricar repitiendo cabeceras.

---

## 7 · Lo que NO se validó

- **La empresa `HC TRADING MARKET 2021, C.A` (`00001`).** Todo se corrió sobre `00002`. Como casi
  todo en esta BD es por empresa, **el Excel de la otra empresa queda sin probar**.
- **`E09` — conteo contra BD.** No se cotejó ni una sola cifra contra `order` / `order_detail`. Lo
  que hay es oráculo de UI y consistencia interna de los archivos.
- **Volumen grande.** El export más pesado fue de 139 pedidos / 700 líneas. **No se probó exportar
  los 2.284 pedidos** del rango completo: ni tiempo de respuesta, ni límite de filas, ni timeout.
- **El formato interno del Excel** más allá del conteo de filas, las cabeceras y los importes: no se
  validaron fórmulas, formatos de celda, estilos, anchos ni tipos de dato. Se observa que `Ref` y
  `# Detalles` viajan como número flotante en `General` (`18568.0`, `7.0`) y como texto en
  `Detalle` (`18568`) — no se dictamina si es correcto.
- **Otros filtros.** Solo se probaron `# Ref` y `Vendedor`. **No** se probó el respeto del filtro
  con `Cliente`, `Tipo Pedido`, `Moneda`, `Status`, `Tiene Adjunto` ni con rangos de fecha
  distintos del que trae por defecto (01/08/2026 – 27/08/2026).
- **El punto 4 del tag** (filtros que se pierden al volver atrás): **no entra en esta corrida**.
  Según el guión sigue **sin desplegar** y reproduce. Casos `DW-X21-F01`–`F07` pendientes.
- **Los otros dos puntos del tag** (saldo en $ del selector de clientes y conversión en el detalle
  de productos): son de la **móvil**, no de la web.
- **Nada de escritura.** Solo se usaron `Buscar`, el selector de vendedor, el paginador y el botón
  de Excel. No se tocó Guardar, Aprobar, Editar, Eliminar, `Nuevo Pedido`, `Copiar` ni el selector
  de estatus.

---

## 8 · Archivos de esta corrida

```
automation/reports/globalmp/fixes21_web_20260827/
├── fixes21-web-excel.md                     ← este informe
├── A-general-ref18568.xlsx                  ← General,  1 pedido
├── B-detalle-ref18568.xlsx                  ← Detalle,  1 pedido / 7 líneas
├── C-general-vendedor-kimberlin.xlsx        ← General,  139 pedidos
├── D-detalle-vendedor-kimberlin.xlsx        ← Detalle,  139 pedidos / 700 líneas
├── extracto-A-general-ref18568.txt          ← volcado legible del General
├── extracto-B-detalle-ref18568.txt          ← volcado legible del Detalle (7 productos)
├── extracto-comparativa-4-archivos.txt      ← columnas, filas y refs de los 4
├── extracto-cruce-general-vs-detalle.txt    ← igualdad de conjuntos + ejemplo 18546
├── extracto-aritmetica-importes.txt         ← Σ líneas vs cabecera, 139/139
└── img/
    ├── E01-menu-excel-general-detalle.png
    ├── E07-filtro-vendedor-139-resultados.png
    └── E10-cero-resultados-sin-descarga.png
```
