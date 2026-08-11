# WEB EXTENDIDO — Denario Premium web · `latino_cosmetica` · playa `isla_coche`

**RUN_ID:** `20260731_090716_web-extendido`
**Base:** `http://denarioislacoche.ddns.net:8080/DenarioPremium`
**Alcance de este agente:** Bloques **1 a 4** (Reportes · Indicadores · Facturaciones · Datos Maestros).
Bloques 5–7 quedan para otro agente.
**Modo:** READ-ONLY. Solo `Consultar` / `Buscar` / `Limpiar` / `Columnas` / paginación / ordenamiento.

---

## Pre-vuelo

| Ítem | Resultado |
|---|---|
| Base responde | ✅ 200 |
| Login (`# USUARIO WEB ISLA COCHE`, usuario `***` / clave `***`) | ✅ cae en `/pages/main`, título "Inicio" |
| Guarda de playa | ✅ `host = denarioislacoche.ddns.net:8080` → `isla_coche` |
| **Empresa activa** | ✅ **LATINOCOSMETICA C.A.** — la esperada. El perfil de playa traía anotada "CAPITALINA DE ALIMENTOS 212" del 28/07; **ya no aplica**, la empresa cambió a LATINO |
| **BD** | 🔴 **NO DISPONIBLE** — base `latino` sin GRANT (0/185 tablas para `user_read`). Decisión explícita de QA: se corre igual. **No se ejecutó `query.js` ni una sola vez.** |

### 🔴 Hallazgo estructural del pre-vuelo — el selector de EMPRESA tiene UNA SOLA opción

`form:*:idEnterprise` → `["LATINOCOSMETICA C.A."]`, **una única opción**.

⇒ El **defecto de confirmación cruzada nº 2** ("`Limpiar` cambia la empresa y muestra datos de otra
compañía") es **estructuralmente inverificable en Isla Coche**: no hay una segunda empresa a la que el
selector pueda saltar. Todos los casos que lo prueban van `WEB-N/A` con este motivo. No se fuerza.

---

## Bloque 1 · REPORTES

### DWX-REP-001 · Plan VS Cuota — `/pages/reportePlanCuota`

**Carga:** ✅ la pantalla abre, título `PlanCuota`.
**Controles detectados:** `idEnterprise` (1 opción) · `clasificacion` (Visualización / Empresa / Canales de
distribución / Pais / Estado / ciudad / Marca / Categoria) · `cumplimiento` (Pedido / Facturado) ·
`unidad` (Unidad de Venta / UNIDAD / BSD / $) · `fechaDesde` / `fechaHasta` · `Buscar` (`[id$=":ajax"]`) ·
`Limpiar` (`[id$=":botonLimpiar"]`) · `Ver Gráfico`.
**Tabla:** `form:tablaComparativoPlanCuota` — columnas: Plan · Diferencia Plan Vs · Monto · Clientes en
Cartera · Clientes Activados · % Activación Clientes · Promedio activación (0 meses).

**Resultado de datos:**

| Rango consultado | Resultado |
|---|---|
| `01/07/2026 – 31/07/2026` (por defecto) | `No se encontraron registros.` |
| `01/01/2025 – 31/07/2026` (19 meses) | `No se encontraron registros.` |

⇒ **`WEB-N/A`** para el cotejo de cifras: sin GRANT no puedo afirmar que *debería* haber datos.
**Observación (no defecto):** el reporte depende de que exista Plan/Cuota de venta cargados
(`presupuestoVenta` / `presupuestoCuota`, bloque 6). La pantalla **sí dice por qué** está vacía
("No se encontraron registros"), así que **no** es una pantalla muda.

**Nota de encabezado:** la columna dice **"Promedio activación (0 meses)"** — el `0` sale del propio
cálculo del período; con el rango de 19 meses **siguió diciendo `(0 meses)`**. Es un literal sospechoso,
pero sin filas no puedo afirmar que sea defecto → queda como observación a revisar cuando haya datos.

#### DWX-REP-001-L · `Limpiar` vs. desplegables (confirmación cruzada nº 1) → **WEB-OK**

Procedimiento correcto (elegir → esperar 2,5 s → verificar `.ui-selectonemenu-label` → recién ahí actuar):

| Control | Antes de `Limpiar` | Después de `Limpiar` | Veredicto |
|---|---|---|---|
| `unidad` | **BSD** (label y `<select>` coinciden) | `Unidad de Venta` | ✅ restablecido |
| `cumplimiento` | **Facturado** | `Pedido` | ✅ restablecido |
| `clasificacion` | `Visualización` | `Visualización` | ✅ sin cambio |
| `idEnterprise` | `LATINOCOSMETICA C.A.` | `LATINOCOSMETICA C.A.` | ✅ **no saltó de empresa** |
| `fechaDesde` / `fechaHasta` | `01/01/2025` / `31/07/2026` | `` / `` (vacías) | ⚠ ver nota |

⇒ **El defecto nº 1 NO se reproduce en esta pantalla.** El label del widget y el `<select>` subyacente
quedaron sincronizados.
⚠ **Nota menor:** `Limpiar` deja las fechas **vacías** en vez de restaurar el rango por defecto del mes
(`01/07/2026 – 31/07/2026`) que la pantalla trae al cargar. Inconsistencia de UX, no defecto funcional.

#### DWX-REP-001-C · Errores de consola → 🔴 **DEFECTO CONFIRMADO EN 2 PLAYAS**

```
Uncaught TypeError: Cannot read properties of undefined (reading 'helpers')
    at https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0:6:294
TypeError: Cannot read properties of null (reading 'value')
    at .../pages/reportePlanCuota:356:32
```

1. **`chartjs-plugin-datalabels` revienta al cargar** — se carga **antes** que Chart.js. **Idéntico al
   hallazgo de La Tortuga** ⇒ **es de la versión, no de la configuración de un servidor.**
2. **Dependencia de CDN externo (`cdn.jsdelivr.net`)** — confirmada también acá. Si la red del cliente
   bloquea jsdelivr, la web se queda **sin ningún gráfico**.
3. **Error propio de la página** (`reportePlanCuota:356` — `reading 'value'` sobre `null`): **no** viene del
   CDN, es código de Denario. Se dispara en cada carga de la pantalla.

---

### DWX-REP-002 · Cumplimiento de Cuota — `/pages/reporteCumplimientoCuota`

**Carga:** ✅ abre, título `CumplimientoCuota`. Tabla `form:tablaCumplimientoCuota`.
**Datos:** `No se encontraron registros.` con el rango por defecto `01/07/2026 – 31/07/2026`.
⇒ cifras **`WEB-N/A`** (sin GRANT no puedo afirmar que debería haber filas).

#### 🔴 DWX-REP-002-H · DOS columnas SIN NOMBRE en el encabezado → **DEFECTO**

Los 11 `th` de la tabla, leídos crudos:

```
Descripción | Cuota () | () | Brecha Cuota () | () | Unidades Devueltas |
Cantidad Neta | % Cumplimiento | Cartera de clientes | % Activación Clientes | % Act clientes nuevos
```

Dos columnas (`...:j_idt160` y `...:j_idt165`) tienen por encabezado **el literal `()`** — ningún nombre,
solo un paréntesis vacío. Otras tres arrastran el paréntesis vacío (`Cuota ()`, `Brecha Cuota ()`).

**Verificado que NO es el estado inicial del filtro:** se eligió `unidad = BSD` (label y `<select>`
confirmados en `BSD` tras esperar 2,5 s) y se pulsó `Buscar`. **Los encabezados no cambiaron:**

| Momento | Encabezados |
|---|---|
| Al cargar, `unidad = "Unidad de Venta"` | `Cuota ()` · `()` · `Brecha Cuota ()` · `()` |
| `unidad = BSD`, antes de `Buscar` | idénticos |
| `unidad = BSD`, **después de `Buscar`** | idénticos |

⇒ La unidad seleccionada **nunca se inyecta** en los encabezados, y **dos columnas quedan
permanentemente sin título**. El usuario no puede saber qué contienen. Defecto de la web,
verificable sin BD, independiente de que haya o no datos.

**Selectores nuevos:** `form:*:codRdv` = filtro de **vendedor** (valor por defecto `Todos`),
presente en esta pantalla y no en Plan VS Cuota.

---

### DWX-REP-003 · Activación de Clientes — `/pages/reporteActivacionClientes` → **WEB-OK**

**Carga:** ✅ abre, título `ActivacionClientes`.
⚠ **Selector nuevo para `web-selectors/`:** esta pantalla **reutiliza el ID `form:tablaComparativoPlanCuota`**
de Plan VS Cuota, con **columnas totalmente distintas**. Igual que `form:pedidosDT`, **el ID de tabla NO
identifica el reporte** — hay que verificar el `pathname` primero.

| Consulta | Resultado |
|---|---|
| `clasificacion = Visualización`, `01/07/2026 – 31/07/2026` | vacío |
| **`clasificacion = Vendedores`, `01/01/2025 – 31/07/2026`** | ✅ **17 filas** |

#### DWX-REP-003-A · Aritmética `% Activación == Activados / Clientes × 100` → **WEB-OK (17/17)**

Recalculado fila por fila:

| Vendedor | Clientes | Activados | % web | % recalculado | dif (pp) |
|---|---:|---:|---:|---:|---:|
| FRANCISMAR BEJARANO | 719 | 0 | 0 | 0 | 0 |
| JHOSEMAR GUADAMA | 719 | 4 | 0,55 | 0,5563 | 0,0063 |
| ALEXANDRA MORALES | 719 | 6 | 0,83 | 0,8345 | 0,0045 |
| CESAR SALAS | 719 | 5 | 0,69 | 0,6954 | 0,0054 |
| JENNY MARTINEZ | 719 | 6 | 0,83 | 0,8345 | 0,0045 |
| VANESSA VILLALONGA | 719 | 5 | 0,69 | 0,6954 | 0,0054 |
| NEIMY PARRA | 719 | 6 | 0,83 | 0,8345 | 0,0045 |
| RUTHMAIRA VIVAS | 57 | 0 | 0 | 0 | 0 |
| AGNEDY CARDENAS | 25 | 1 | 4 | 4 | 0 |
| RICARDO ROMERO | 90 | 7 | 7,77 | 7,7778 | 0,0078 |
| JUAN DANIEL RAMIREZ | 196 | 32 | 16,32 | 16,3265 | 0,0065 |
| JOSE LUIS ZAMBRANO | 112 | 0 | 0 | 0 | 0 |
| NIULKA CASTILLO | 212 | 7 | 3,3 | 3,3019 | 0,0019 |
| FRANSHESCA CHACON | 26 | 5 | 19,23 | 19,2308 | 0,0008 |
| OFICINA COMERCIAL | 122 | 0 | 0 | 0 | 0 |
| transpo rtista | 0 | 0 | 0 | 0 | 0 |
| Grecia Valerio | 0 | 0 | 0 | 0 | 0 |

⇒ **Cuadra en las 17 filas.** Diferencia máxima **0,0078 pp** — la web **trunca** a 2 decimales en vez de
redondear (`0,5563 → 0,55`, `7,7778 → 7,77`). **NO es defecto** (muy por debajo de la tolerancia).
✅ **División por cero bien manejada:** los dos vendedores con 0 clientes muestran `0 %`, no `NaN` ni error.

#### 🔶 DWX-REP-003-X · Incoherencia a verificar contra el Bloque 4 — **7 vendedores con exactamente 719 clientes**

FRANCISMAR, JHOSEMAR, ALEXANDRA, CESAR, JENNY, VANESSA y NEIMY muestran **719 clientes cada uno** —
el mismo número exacto— mientras el resto tiene carteras distintas (57, 25, 90, 196, 112, 212, 26, 122).

**Σ de la columna `Clientes` = 5.873.**

Si la cartera total de la empresa fuera ≈ 719, esos 7 vendedores estarían mostrando **la cartera completa
de la empresa en vez de la suya** — exactamente el patrón "contador contra listado" que se busca.
🔗 **Se contrasta en `DWX-MAE-002` (Bloque 4 · Clientes).** Hasta entonces queda como **sospecha**, no defecto.

#### DWX-REP-003-O · Ordenamiento (confirmación cruzada nº 3) → **WEB-OK**

| Columna | Acción | `aria-sort` | ¿Las filas se movieron? | ¿Orden correcto? |
|---|---|---|---|---|
| `Clientes` | 1er clic | `ascending` | ✅ sí | ✅ `0,0,25,26,57,90,112,122,196,212,719×7` |
| `Clientes` | 2º clic | `descending` | ✅ sí | ✅ `719×7,212,196,122,112,90,57,26,25,0,0` |
| `% Activación` | 1er clic | `ascending` | ✅ sí | ✅ `0…0, 0,55 · 0,69 · 0,69 · 0,83×3 · 3,3 · 4 · 7,77 · 16,32 · 19,23` |

⇒ **El defecto nº 3 NO se reproduce acá.** Además el orden es **numérico, no lexicográfico**
(`7,77` antes de `16,32`), que es lo correcto.
📝 `Vendedor` **no es ordenable por diseño** (sin clase `ui-sortable-column`); el `_reflowDD` lista 12
opciones = las 6 columnas numéricas × 2 sentidos, y Vendedor no está. No es defecto.

---

### DWX-REP-004 · Rotación de Inventario — `/pages/reporteRotacionInventario`

**Carga:** ✅ abre, título `RotaciónInventario`. Tabla `form:TablaRotacion` — Nombre · SELL IN · SELL OUT ·
Plan VS Cumplimiento · Inventario Inicial · Inventario Final · Rotaciòn Inventario · Rotación VS SELL OUT ·
SELL POINTS.

| Consulta | Resultado |
|---|---|
| `clasificacion = Visualización`, `01/07/2026 – 31/07/2026` | vacío |
| `clasificacion = Productos`, `01/01/2025 – 31/07/2026` | `No se encontraron registros.` |

⇒ **`WEB-N/A`**: sin GRANT no puedo afirmar que debería haber datos de rotación.
📝 **Typo en el encabezado:** `Rotaciòn Inventario` — acento **grave** (`ò`) en vez de agudo. Cosmético.
📝 **Control nuevo:** `form:*:invSano` es un `input` cuyo **`value` contiene la etiqueta**:
`"Inventario Sano: 3.0"`. Es un patrón raro (etiqueta y dato en el mismo campo) — anotado para selectores.

#### 🔴 DWX-REP-004-C · Error de consola disparado por `Buscar` (no solo al cargar)

```
TypeError: Cannot read properties of null (reading 'value')
    at .../pages/reporteRotacionInventario:358:32          ← al CARGAR
TypeError: Cannot read properties of undefined (reading 'hide')
    at <anonymous>:1:19  →  jquery.globalEval  →  PrimeFaces core doEval
                                                          ← al pulsar BUSCAR
```

El segundo es **más grave que un error de carga**: la respuesta ajax del servidor devuelve un script que
llama `.hide()` sobre un widget **inexistente**, y revienta **dentro del `doEval` de PrimeFaces**. Se dispara
**por una acción del usuario**. Un fallo ahí puede cortar el resto del callback ajax (p. ej. dejar colgado
el overlay de "cargando").

📌 **Nota de patrón:** `reportePlanCuota:356` y `reporteRotacionInventario:358` lanzan **el mismo**
`reading 'value' of null` a dos líneas de distancia ⇒ es **la plantilla común de los reportes**, no una
pantalla suelta. Con arreglarla una vez se corrigen todas.

---

## 📊 Cierre del Bloque 1 · REPORTES

| Caso | Marca |
|---|---|
| DWX-REP-001 Plan VS Cuota (cifras) | `WEB-N/A` (sin datos + sin GRANT) |
| DWX-REP-001-L `Limpiar` | `WEB-OK` |
| DWX-REP-001-C consola | 🔴 defecto (jsdelivr + error propio) |
| DWX-REP-002 Cumplimiento Cuota (cifras) | `WEB-N/A` |
| DWX-REP-002-H columnas `()` sin nombre | 🔴 **defecto** |
| DWX-REP-003 Activación Clientes | `WEB-OK` — 17 filas |
| DWX-REP-003-A aritmética % | `WEB-OK` 17/17 |
| DWX-REP-003-O ordenamiento | `WEB-OK` |
| DWX-REP-004 Rotación Inventario (cifras) | `WEB-N/A` |
| DWX-REP-004-C consola al `Buscar` | 🔴 defecto |

**3 de 4 reportes salieron sin datos.** El único que produjo filas (Activación de Clientes) lo hizo
**solo al cambiar `clasificacion` a `Vendedores`** — con el valor por defecto `Visualización` también
salía vacío. 💡 **Pista operativa:** `clasificacion = "Visualización"` parece ser un placeholder neutro que
**no agrupa nada**, y la pantalla no lo dice. Conviene probar siempre una clasificación real antes de
concluir "no hay datos".

---

## Bloque 2 · INDICADORES

### DWX-IND-003 · **Morosidad** — `/pages/protected/indicadores/indicadorMorosos.xhtml`

**Carga:** ✅ abre, título `Indicadores`. **0 errores de consola** en esta pantalla.
**Sin tablas:** la pantalla es **solo 3 gráficos**. Los datos numéricos se obtuvieron del objeto
`Chart.getChart(canvas).data` — **no** se leyó el canvas. **Este es un patrón nuevo y muy rentable:
convierte un gráfico "ilegible" en un oráculo aritmético exacto.**

Controles: `idEnterprise` (1 opción) · `idCurrency` (Moneda / **BSD** / **$**) ·
`idTipoDocs` (Vencimiento / Cuentas por cobrar) · `Buscar` · `Reportes` · `Configuración`.

#### DWX-IND-003-A · Coherencia interna: Σ tramos == total del canal → **WEB-OK**

**En BSD:**

```
1-7        0,00
8-15      14.170,59
16-30     85.451,18
31-45     56.684,94
46-9999   27.866,22
          ──────────
Σ        184.172,93
Total "Top 10 Morosos Canales de Distribución (BSD)" → DETAL = 184.172,93
Diferencia = 0,00   ✅ exacta
```

**En $:** `0 + 14.170,59 + 1.205.898,4838 + 60.334,38 + 274.159,3044 = 1.554.562,7582`
== total del canal DETAL `1.554.562,7582` → **diferencia 0,00** ✅

⇒ **La agregación es correcta en las dos monedas.** El defecto de abajo **no** está en la suma.

---

#### 🔴🔴 DWX-IND-003-M · **LA CONVERSIÓN DE MONEDA ESTÁ ROTA** → `WEB-CALC-MISMATCH` — *el hallazgo principal de esta corrida*

Al cambiar `idCurrency` de **BSD** a **$** y pulsar `Buscar`, la cartera morosa **AUMENTA 8,44 veces**:

| | BSD | $ | factor |
|---|---:|---:|---:|
| **Cartera morosa total (canal DETAL)** | **184.172,93** | **1.554.562,7582** | **× 8,4408** |

**Esto es imposible.** El dólar es la moneda fuerte: expresada en `$` la misma cartera tiene que dar un
número **menor** que en bolívares, no 8 veces mayor. La dirección de la conversión está invertida
(multiplica donde debe dividir) — y encima **no** con un factor único.

**Desglose por tramo de vencimiento — cada tramo usa un factor distinto:**

| Tramo (días) | BSD | $ | factor implícito |
|---|---:|---:|---:|
| 1 – 7 | 0,00 | 0,00 | — |
| 8 – 15 | 14.170,59 | **14.170,59** | **× 1,0000 — SIN CONVERTIR** |
| 16 – 30 | 85.451,18 | 1.205.898,4838 | × 14,1121 |
| 31 – 45 | 56.684,94 | 60.334,38 | × 1,0644 |
| 46 – 9999 | 27.866,22 | 274.159,3044 | × 9,8384 |

**No existe ninguna tasa de cambio que explique 1,0000 · 14,1121 · 1,0644 · 9,8384 a la vez.**

**Lo mismo en el Top 10 de clientes — unos se convierten y otros no:**

| Cliente | BSD | $ | factor |
|---|---:|---:|---:|
| MUNDO MAYOR DOS | 4.226,70 | **4.226,70** | **× 1 — idéntico** |
| DISTRIBUIDORA LOOKS 4 CA | 4.100,89 | **4.100,89** | **× 1 — idéntico** |
| IMPORTADORA EL PUERTO DE LA TINTA CA | 3.881,85 | **3.881,85** | **× 1 — idéntico** |
| SALOSAMI MAKEUP CA | 3.053,00 | **3.053,00** | **× 1 — idéntico** |
| CABELLO COSMETICOS CA | 3.019,79 | **3.019,79** | **× 1 — idéntico** |
| GRAN MUNDO MAYOR CA | 2.585,87 | **2.585,87** | **× 1 — idéntico** |
| DISTRIBUIDORA PROFESIONAL FUNG 21 CA | 2.059,27 | **995.327,5618** | **× 483,34** |
| NOOK DE VENEZUELA CA | 2.695,46 | **248.088,1244** | **× 92,04** |
| FARMACIAS GALERIAS COMPRE CON MENOS CA | *(fuera del top 10)* | 126.357,5720 | — |

**Seis clientes conservan el número exacto** (no se convierten) y **dos saltan con factores de 483× y 92×**,
dentro del **mismo gráfico y la misma consulta**. La conversión se aplica a unos registros sí y a otros no.

**Consecuencia de negocio:** el ranking de morosos **cambia por completo** según la moneda. En BSD el
peor moroso es MUNDO MAYOR DOS (4.226,70); en $ es FUNG 21 con 995.327 — que en BSD ni siquiera estaba
entre los tres primeros (era el 9º con 2.059,27). **Un gestor de cobranza que mire el indicador en $ va a
perseguir a los clientes equivocados.**

**Revalidación (obligatoria, para descartar falso positivo):**
1. Medido en BSD → 184.172,93.
2. Cambiado a $ (label `.ui-selectonemenu-label` verificado en `$` tras esperar 2,5 s) + `Buscar` → 1.554.562,7582.
3. **`page.goto()` completo** a la pantalla → el estado JSF sobrevivió (seguía en `$`) y **repitió los
   mismos números**.
4. Vuelto a **BSD** + `Buscar` → **reprodujo 184.172,93 exacto** y el top 10 original.

⇒ **Reproducible, no es un artefacto de la automatización.** No es un desfase de céntimos por tasa
redondeada: es un **factor de 8,44 global** y factores de **483×** y **92×** por cliente.

**⚠ Lo que NO puedo afirmar sin BD:** cuál de las dos cifras es la correcta. Sin GRANT no sé si el error
está en el importe en `$`, en el de `BSD`, o en ambos. **Lo que sí queda probado es que son mutuamente
incompatibles** y que dentro de un mismo gráfico conviven importes convertidos y sin convertir.

---

### DWX-IND-001 · Pedidos — `/pages/indicadoresPedidos` → **WEB-OK** (la pantalla mejor construida de la corrida)

**Carga:** ✅ 0 errores de consola. Trae **tabla + 3 gráficos + un total de cabecera** → tres oráculos cruzables.
Controles: `idEnterprise` · `visualizacion` (Un solo año) · `anio1` (2026) · `cumplimiento` · `idCurrency` ·
`Buscar` · `Detalle de Transacciones`. Tabla `form:tablaPedidos` (Vendedor · Cantidad pedidos · monto total pedido).

#### DWX-IND-001-A · Triple coherencia interna en `$` → **WEB-OK**

**1) Σ tabla == total de cabecera**
```
47.904,41 + 4.686,75 + 4.418,61 + 3.216,59 + 1.231,70 + 986,73
+ 937,08 + 673,05 + 547,30 + 489,52 + 304,48  =  65.396,22 $
Cabecera: "Monto Total Pedido 2026: 65.396,22 $"          →  diferencia 0,00  ✅
```

**2) Σ gráfico mensual == total**
Serie por mes: todos 0 salvo **Julio = 65.396,2162** → Σ = 65.396,2162 == 65.396,22 ✅ (0,0038 de redondeo)

**3) Los dos "Top 10" excluyen exactamente al vendedor que deben excluir** — la tabla tiene **11** vendedores:
```
Top 10 CANTIDAD:  46+12+12+9+9+8+8+7+7+5 = 123
Σ cantidad tabla (11 vendedores)        = 124
Falta 1 = AGNEDY CARDENAS, que tiene exactamente 1 pedido   ✅

Top 10 MONTO $:   Σ = 65.091,736
Total             = 65.396,2162
Falta               304,4802
CESAR SALAS tiene exactamente 304,48 $ (el menor)           ✅
```
⇒ **Los tres controles cierran.** Es el mejor comportamiento observado en toda la corrida.

#### 🔑 DWX-IND-001-M · Conversión de moneda **CORRECTA** acá → **WEB-OK** *(y esto aísla el defecto de Morosidad)*

Cambiado `idCurrency` de `$` a `BSD` + `Buscar`:

| Vendedor | $ | BSD | tasa implícita |
|---|---:|---:|---:|
| JUAN DANIEL RAMIREZ | 47.904,41 | 35.316.669,75 | 737,23 |
| RICARDO ROMERO | 4.686,75 | 3.448.645,88 | 735,83 |
| NIULKA CASTILLO | 4.418,61 | 3.243.416,66 | 734,04 |
| FRANSHESCA CHACON | 3.216,59 | 2.371.284,33 | 737,20 |
| ALEXANDRA MORALES | 1.231,70 | 907.916,69 | 737,12 |
| JENNY MARTINEZ | 986,73 | 727.449,62 | 737,23 |
| VANESSA VILLALONGA | 937,08 | 690.844,01 | 737,23 |
| AGNEDY CARDENAS | 673,05 | 496.193,79 | 737,23 |
| JHOSEMAR GUADAMA | 547,30 | 403.486,83 | 737,23 |
| NEIMY PARRA | 489,52 | 360.889,65 | 737,23 |
| CESAR SALAS | 304,48 | 224.472,64 | 737,23 |
| **TOTAL** | **65.396,22** | **48.191.269,85** | **736,91** |

- **Dirección correcta:** `$ × tasa = BSD` (multiplica) — el monto en BSD es **mayor**, como debe ser.
- **Tasa uniforme:** entre **734,04 y 737,23**, un rango de 0,4 % perfectamente explicable porque cada
  documento se convierte con la tasa de **su** fecha. **No es defecto.**
- Σ tabla en BSD = **48.191.269,85** == cabecera `Monto Total Pedido 2026: 48.191.269,85 BSD` ✅

🔴 **Comparación que vale oro:**

| Pantalla | Dirección | Factores observados | Veredicto |
|---|---|---|---|
| **indicadoresPedidos** | `$ → BSD` multiplica | **734,04 – 737,23** (uniforme) | ✅ correcto |
| **indicadorMorosos** | `BSD → $` | **1,00 · 1,06 · 9,84 · 14,11 · 92,04 · 483,34** | 🔴 roto |

⇒ El servidor **sí tiene tasas de cambio bien cargadas** (indicadoresPedidos lo demuestra). Por lo tanto
**el defecto de Morosidad NO es un problema de configuración de tasas: es un bug del cálculo de esa
pantalla.** Esto descarta la explicación más cómoda y deja el defecto en el tejado de desarrollo.

📝 **Nota menor:** en los gráficos los nombres traen **doble espacio** (`NIULKA  CASTILLO`, `CESAR  SALAS`,
`FRANSHESCA  CHACON`) y en la tabla vienen con uno solo. Coincide con la nota conocida de los `data-label`.
Cosmético, pero **rompe el emparejamiento gráfico↔tabla si se compara por string exacto** — hay que
normalizar espacios. Anotado para `web-selectors/`.

---

### DWX-IND-002 · Cobranzas — `/pages/protected/indicadores/indicadorCobros.xhtml`

**Carga:** ✅ 0 errores de consola. Sin tablas: **4 tarjetas de totales + 2 gráficos**.
Controles: `idEnterprise` · `idCurrency` (BSD) · `dateF` / `dateB` · `Buscar` · `Detalle de Transacciones`.

**Tarjetas (rango `01/06/2026 – 31/07/2026`):**
```
Total Cobrado hoy        0,00 BSD
Total Cobrado Mes        501.452.907,71 BSD
Total Cobrado Año        501.452.907,71 BSD
Total Cobrado por Fecha  501.452.907,71 BSD
```

#### 🔴 DWX-IND-002-S · El desglose por método de pago NO suma el total → `WEB-CALC-MISMATCH`

Gráfico **"Cobros por métodos de pago por rango de fecha"**, mismo rango, misma moneda:

```
Transferencia (tr)   495.862.752,93
Pago Movil    (pm)     4.518.577,58
Efectivo      (ef)       732.529,03
Deposito      (de)       281.987,32
                     ───────────────
Σ métodos            501.395.846,86
Total Cobrado por Fecha  501.452.907,71
                     ───────────────
DIFERENCIA               57.060,85 BSD   (0,0114 %)
```

**57.060,85 BSD cobrados que no aparecen en ningún método de pago.** No es redondeo: son ~77 US$ a la
tasa de 737 que la propia web usa, y los importes vienen con 2 decimales exactos del objeto Chart.

**Medido dos veces con rangos distintos, resultado idéntico:**

| Rango | Σ métodos | Total por Fecha | Diferencia |
|---|---:|---:|---:|
| `01/06/2026 – 31/07/2026` | 501.395.846,86 | 501.452.907,71 | **57.060,85** |
| `01/07/2026 – 31/07/2026` | 501.395.846,86 | 501.452.907,71 | **57.060,85** |

**Control de que el filtro de fechas no está roto** (para no atribuirle la diferencia): con
`01/01/2026 – 30/06/2026` (excluyendo julio) el gráfico quedó **sin series** y `Total Cobrado por Fecha`
bajó a **0,00** ✅. El filtro **sí** funciona; la diferencia no viene de ahí.

**Salvedad honesta:** puede existir un **5º método de pago** (cheque, nota de crédito…) que el gráfico
no dibuja. Aun así sería defecto: **el desglose se presenta como completo y no lo es**, y ninguna
leyenda advierte que falte una categoría. Sin GRANT no puedo nombrar la categoría faltante.

#### 🔶 DWX-IND-002-X · Gráfico "Facturación y Cobranzas por mes" — observación

Series: `Facturado` = 100 en **Abril** (0 el resto) · `Cobrado` = 100 en **Julio** (0 el resto).
El valor **100 exacto** en ambas y la ausencia de unidad sugieren **porcentajes**, no montos (100,00 BSD
junto a 501M no tendría sentido). **El gráfico no se modificó al cambiar el rango de fechas** — ni
siquiera al poner un rango donde todo lo demás daba 0 — así que **ignora el filtro** de la pantalla.
Sin BD no puedo dictaminar si eso es correcto (podría ser un gráfico anual por diseño) ⇒ **observación**.

📝 **Selector nuevo / trampa:** en esta pantalla **`dateF_input` es la fecha de INICIO** (`01/06/2026`) y
**`dateB_input` la FINAL** (`31/07/2026`) — al revés de lo que sugiere "B = begin". Anotar en
`web-selectors/`: **no deducir el rol por el nombre, leer el `value`.**

---

### DWX-IND-004 · % de Participación (productos) — `/pages/indicadoresProductos`

**Carga:** ✅ 0 errores de consola. 4 gráficos, sin tabla. Rango `01/01/2026 – 31/07/2026`, `vendedor = Todos`
(18 opciones), `clasificacion` = **Marca / Categoria** (solo 2), `idCurrency = $`.

#### 🔴 DWX-IND-004-T · Nombres de producto **truncados a 15 caracteres** → porciones indistinguibles

Etiquetas del gráfico *"% de participación del TOP 10 de productos"*:

| Etiqueta mostrada | Veces que aparece | Largo |
|---|---:|---:|
| `TRATAMIENTO BLI` | **4** | 15 |
| `BELOTTI HENNA C` | **3** | 15 |
| `MASCARILLA CAPI` | **2** | 15 |
| `GEL FLUIDO RIZO` | 1 | 15 |

**Las 10 etiquetas miden exactamente 15 caracteres** ⇒ truncamiento fijo, no nombres cortos.
Resultado: en un gráfico de participación hay **4 porciones rotuladas igual** (`TRATAMIENTO BLI`, con
47 · 46 · 37 · 36 unidades) y **3 más** con `BELOTTI HENNA C` (469 · 449 · 306). **El usuario no puede
saber qué producto es cada porción** — el indicador queda inutilizable justo para lo que sirve.
Afecta a los dos gráficos de producto (cantidad y monto). **Defecto, verificable sin BD.**

#### 🔶 DWX-IND-004-X · Dos pantallas dan un total de pedidos distinto para el mismo período

| Pantalla | Concepto | Valor |
|---|---|---:|
| `indicadoresPedidos` | Monto Total Pedido **2026**, `$`, `Pedido` | **65.396,22 $** |
| `indicadoresProductos` | Σ *"Top 10 Total Pedido por Marca"* (`PROKPIL` 38.653,72 + `BELOTTI` 15.688,68 + `ROIAL` 2.048,10) | **56.390,50 $** |
| | **Diferencia** | **9.005,72 $ (13,8 %)** |

Mismo cliente, misma moneda, mismo `cumplimiento = Pedido`, mismo año (todos los pedidos de 2026 son de
julio, verificado en `DWX-IND-001`), `vendedor = Todos`. **Y el "Top 10" de marcas no recorta nada: solo
existen 3 marcas.**

⚠ **Salvedad explícita:** los **productos sin marca asignada** quedarían fuera del agrupamiento y
explicarían el hueco. Sin GRANT **no puedo distinguir** "bug de agregación" de "datos maestros
incompletos" ⇒ se reporta como **sospecha fuerte, no como defecto confirmado**.
🔗 **Cómo cerrarlo en 1 minuto cuando haya BD:** `SELECT count(*) FROM product WHERE co_brand IS NULL`.
Si da 0, es defecto de la web.

**Otras sumas (coherentes, sin contradicción):**
`Σ Top-10 productos cantidad = 2.039` vs `Σ marcas = 7.493` (27 %) y
`Σ Top-10 productos monto = 19.515,80 $` vs `56.390,50 $` (35 %) — normal, un top 10 sobre catálogo amplio.

---

### 🔴 DWX-IND-007 · Pedidos por Vendedor — `/pages/pedidosVendedores` → **la tabla esconde un vendedor**

**Carga:** ✅ 0 errores. Tabla `form:j_idt142` (Vendedor · Pedidos · Monto Total), rango `01/01/2026 – 31/07/2026`,
`vendedor = Todos`, `$`.

**La misma información existe en dos pantallas y no coincide:**

| | `/pages/indicadoresPedidos` | `/pages/pedidosVendedores` |
|---|---:|---:|
| Vendedores listados | **11** | **10** |
| Σ pedidos | **124** | **116** |
| Σ monto | **65.396,22 $** | **65.091,74 $** |
| Diferencia | | **8 pedidos · 304,48 $** |

**El que falta es CESAR SALAS** — 8 pedidos, 304,48 $ — presente en `indicadoresPedidos` y **ausente**
en `pedidosVendedores`. La diferencia de ambos totales es **exactamente su fila**.

**Por qué es defecto y no un "Top 10" legítimo:**
- El título de la tabla es **"Cantidad y monto Pedido por vendedor"** — **no dice "Top 10"**.
  (Los *gráficos* de al lado sí se titulan "% Participación **Top 10**…" — o sea que **cuando la pantalla
  quiere decir Top 10, lo dice**. La tabla no lo dice.)
- **No hay paginador** (`.ui-paginator-current` vacío) ni selector de filas por página.
- ⇒ Un usuario que abra "Pedidos por Vendedor" para revisar a su equipo **no ve al 11º vendedor y nada
  le indica que falta**. Silenciosamente se pierde un vendedor con ventas reales.

📝 `idCurrency` acá ofrece **BSD / $ / UNIDAD** (3 opciones) — distinto de Morosidad (`Moneda / BSD / $`).
El vocabulario de monedas **no es homogéneo entre indicadores**. Anotado para `web-selectors/`.

---

### DWX-IND-006 · Pedidos por Cliente — `/pages/pedidosClientes` → **WEB-OK** (y confirma el defecto anterior)

**Carga:** ✅ 0 errores. 4 gráficos, sin tabla. Mismo rango y filtros.

#### 🔑 DWX-IND-006-A · Tercera medición independiente del total → **desempata DWX-IND-007**

Los gráficos por **canal de distribución** (un único canal, `DETAL`, así que son totales absolutos):

```
Top 10 cantidad por canal → DETAL = 124 pedidos
Top 10 monto    por canal → DETAL = 65.396,2162 $
```

| Pantalla | Pedidos | Monto $ |
|---|---:|---:|
| `/pages/indicadoresPedidos` | **124** | **65.396,22** |
| `/pages/pedidosClientes` (canal DETAL) | **124** | **65.396,2162** |
| `/pages/pedidosVendedores` | **116** ❌ | **65.091,74** ❌ |

⇒ **Dos pantallas independientes coinciden en 124 / 65.396,22.** La tercera difiere justo en la fila de
CESAR SALAS. **`pedidosVendedores` es el que está mal** — ya no es "dos verdades incompatibles", es
**dos contra una**. Esto sube `DWX-IND-007` de sospecha a **defecto confirmado sin necesidad de BD.**

#### 🔴 DWX-IND-006-T · El truncado a 15 caracteres también afecta a **CLIENTES**

`PERFUMERIA PROF` · `MICHIS COSMETIC` · `INVERSIONES C &` · `INVERSIONES SUP` · `IMPORTADORA & D` ·
`BAZAR BEAUTY SE` · `DIADEMAS UNIDAS` · `GRAN MUNDO MAYO` · `MUNDO MAYOR CA` · `MUNDO MAYOR DOS`

Mismo corte de 15 caracteres que en productos. **Agravante:** aquí genera **ambigüedad entre clientes
distintos y reales** — `GRAN MUNDO MAYO`(R CA) vs `MUNDO MAYOR CA` vs `MUNDO MAYOR DOS` son tres
empresas diferentes cuyos nombres truncados se confunden a simple vista. Dos de ellas aparecen además
en el Top 10 de morosos.

📌 **Contraste que prueba que es un defecto de estas pantallas y no del dato:** en
`indicadorMorosos` los mismos clientes salen con el **nombre completo**
(`IMPORTADORA EL PUERTO DE LA TINTA CA`, `DISTRIBUIDORA PROFESIONAL FUNG 21 CA`). **El nombre completo
está disponible; estas pantallas lo cortan.**

**Sumas coherentes (sin contradicción):** Top-10 clientes por cantidad = 34 de 124 (27 %) ·
Top-10 clientes por monto = 29.889,58 $ de 65.396,22 (46 %).

---

### 🔴🔴 DWX-IND-005 · Ventas Diarias — `/pages/protected/indicadores/pedidosProductosVentas.xhtml`
### **La pantalla se queda SIN NINGÚN GRÁFICO — y los datos salen como texto crudo**

Ésta es la confirmación del riesgo del CDN que se pedía investigar, y es **peor** de lo esperado:
**no hace falta que la red bloquee jsdelivr — ya está roto con jsdelivr accesible.**

**Evidencia medida en la página:**

| Comprobación | Resultado |
|---|---|
| `typeof Chart` | **`"undefined"`** — la librería base **no está cargada** |
| `document.querySelectorAll('canvas').length` | **0** — no hay ni un lienzo |
| Scripts de gráficos presentes | **solo** `https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0` |
| Chart.js en la lista de `<script src>` | **ausente** (están jquery, core, components, moment, gmap… pero no Chart.js) |
| Error de consola | `Uncaught TypeError: Cannot read properties of undefined (reading 'helpers')` en el plugin |
| Iconos de la pantalla | `pi pi-chart-bar` y `pi pi-chart-line` presentes ⇒ **está diseñada para mostrar gráficos** |

**Se carga el PLUGIN de Chart.js sin cargar Chart.js.** El plugin busca `Chart.helpers`, no lo encuentra
y revienta. Resultado: **cero gráficos**.

**Lo que ve el usuario en lugar del gráfico** — la serie completa volcada como texto corrido:

```
BELOTTI HENNA C 469 Unidades BELOTTI HENNA C 449 Unidades BELOTTI HENNA C 306 Unidades
GEL FLUIDO RIZO 284 Unidades MASCARILLA CAPI 262 Unidades TRATAMIENTO 150 236 Unidades
TRATAMIENTO 150 215 Unidades TRATAMIENTO 150 215 Unidades … (29 entradas)
```

Sin ejes, sin leyenda, sin orden visual: **una tirada de texto plano**. La pantalla **no avisa de ningún
error** — parece que "así es". Los datos **sí llegan** del servidor: el fallo es puramente de presentación.

**Agravante — el truncado a 15 caracteres golpea acá también, y más fuerte:**
`TRATAMIENTO 150` aparece **10 veces** con 10 cantidades distintas (236, 215, 215, 183, 162, 156, 147,
140, 139, 116) y `BELOTTI HENNA C` **4 veces**. Sin gráfico **y** sin nombres completos, **la pantalla es
literalmente ilegible**: no se puede saber a qué producto corresponde ningún número.

⚠ **Impacto del hallazgo del CDN, reformulado:** el problema no es sólo *"si un cliente bloquea jsdelivr
se queda sin gráficos"*. Es que **Denario depende de un dominio externo para su capa de gráficos y en al
menos una pantalla la dependencia ya está mal armada**. Si además la red del cliente bloquea
`cdn.jsdelivr.net`, se caen **todas** las pantallas de indicadores, no sólo ésta.

**Filtros de la pantalla:** `idSalesmaView` (Vendedor, 18 opciones con código: `00007 - JUAN DANIEL RAMIREZ`,
`TESTPROMO - Grecia Valerio`, `trans - transpo rtista`) · `tipoVista` (Día / Semana / Mes / Año / Rango de
Fechas) · `dateF` / `dateB`. ⚠ Los IDs acá son `form:j_idt115:*` (no `j_idt114`) — **otro recordatorio de
no anclar a `j_idt*`**.

---

## 📊 Cierre del Bloque 2 · INDICADORES

| Caso | Marca |
|---|---|
| DWX-IND-001 Pedidos + aritmética + conversión | `WEB-OK` ×3 — **la pantalla mejor construida** |
| DWX-IND-002 Cobranzas (carga, filtro fechas) | `WEB-OK` |
| DWX-IND-002-S Σ métodos ≠ total | 🔴 `WEB-CALC-MISMATCH` — faltan 57.060,85 BSD |
| DWX-IND-002-X gráfico que ignora el filtro | `WEB-N/A` (observación) |
| **DWX-IND-003-M conversión de Morosidad** | 🔴🔴 `WEB-CALC-MISMATCH` — **el defecto más grave** |
| DWX-IND-003-A coherencia Σ tramos | `WEB-OK` |
| DWX-IND-004-T truncado 15 car. (productos) | 🔴 defecto |
| DWX-IND-004-X total por marca ≠ total pedidos | `WEB-N/A` (sospecha, falta BD) |
| **DWX-IND-005 Ventas Diarias sin gráficos** | 🔴🔴 defecto |
| DWX-IND-006-A tercera medición del total | `WEB-OK` (desempata IND-007) |
| DWX-IND-006-T truncado 15 car. (clientes) | 🔴 defecto |
| **DWX-IND-007 falta un vendedor** | 🔴 `WEB-FIELD-MISMATCH` |

**7/7 pantallas del bloque abrieron.** Los indicadores resultaron **mucho más productivos que los
reportes**: tienen datos reales y por eso admiten aritmética.

---

## Bloque 3 · FACTURACIONES

### DWX-FAC-001 · La lista carga y pagina — `/pages/facturaciones` → **WEB-OK**

✅ Carga con datos (a diferencia de `el_valle`, acá **sí hay facturación**). Tabla **`form:pedidosDT`**
(el ID compartido de siempre — verificado el `pathname` antes de leer).
Columnas: Detalle · Tipo · Código facturación · Fecha facturación · Vendedor · Cliente · Monto facturado ·
Saldo pendiente · Vencimiento · Monto conv. · Tasa conv. · Adjuntos.
Filtros: `n_ref` · `dateB`/`dateF` · `idSalesmaView` · `clientSOM` · `idCurrency` · `tipoDocumento`.
Paginación ✅ funciona (50/100/200 por página, `form:pedidosDT:j_id55`).

---

### DWX-FAC-002 · Partición del filtro `tipoDocumento` → **WEB-OK**
### ⚠️ *(aquí estuve a punto de reportar un FALSO POSITIVO — se deja documentado el método)*

**Primera medición, engañosa** — con el tamaño de página **por defecto (50)**:

| `tipoDocumento` | Filas | De ellas "Pendientes por cobrar" |
|---|---:|---:|
| Consolidado | 50 | **10** |
| Pendientes por cobrar | 50 (paginador: 6 páginas) | 50 |

Leído así parecía que el Consolidado **ocultaba** el 95 % de los pendientes, y con ese dato iba a
reportarse un defecto grave.

**Contraprueba antes de declararlo** — se repitió **poniendo 200 filas por página en las dos vistas**:

| `tipoDocumento` | Filas por página | Filas | Páginas | Cobradas | Pendientes |
|---|---:|---:|---:|---:|---:|
| **Consolidado** | 200 | 200 | **3** | 109 | **91** |
| Facturas cobradas | 200 | 200 | 2 | 200 | — |
| Pendientes por cobrar | 200 | 200 | 2 | — | 200 |

⇒ **El Consolidado NO oculta nada: sí trae las dos clases de documento y pagina correctamente.**
La diferencia inicial era **puramente de paginación** — 10 pendientes en la *primera página de 50*, no
en el total. **`WEB-OK`.**

📌 **Lección para la próxima corrida (proponer para `WEB-RUNTIME.md`):** *nunca comparar dos listados
con tamaños de página distintos.* **Igualar `filas por página` en ambos lados antes de comparar conteos**,
o se fabrica un defecto inexistente. Ayer se generaron 5 falsos positivos de filtros; éste habría sido el 6º.

---

### 🔴 DWX-FAC-005 · **La misma factura figura a la vez como "cobrada" y como "pendiente por cobrar"**

*(Este sí sobrevivió a la contraprueba: se volvió a medir con **200 filas por página** y **se agrandó**.)*

En la vista `Consolidado` con 200 filas por página hay **200 filas pero solo 109 códigos de facturación
distintos**. Las **91** filas "Pendientes por cobrar" duplican **exactamente 91 de las 109** que ya
aparecen como "Facturas cobradas": **solapamiento 91 de 91 = 100 %**, y en **los 91 pares el
`Monto facturado` es idéntico**.

Ejemplo — factura **2071**, las dos filas tal cual las muestra la web:

| Tipo | Fecha facturación | Monto facturado | Saldo pendiente | Vencimiento | Vendedor |
|---|---|---:|---:|---|---|
| Facturas cobradas | 23/07/2026 **15:59:28** | 909,04 $ | **-** | *(vacío)* | OFICINA COMERCIAL |
| Pendientes por cobrar | 23/07/2026 **00:00:00** | 909,04 $ | **909,04** | 23/07/2026 | *(vacío)* |

Idéntico en 2061 (106,38), 2063 (166,76), 2064 (360,00), 2065 (307,24), 2066 (279,62), 2067 (44,58)…
Siempre el **mismo patrón**: como "cobrada" el saldo es `-`; como "pendiente" el saldo es **el importe
íntegro, sin un solo abono**. **Las dos afirmaciones no pueden ser ciertas a la vez.**

**Efecto medible — doble conteo (medido sobre las 200 filas):**
```
Σ Monto facturado de las 200 filas       = 52.347,91 $
Σ solo "Facturas cobradas" (109 únicas)  = 29.181,21 $
Σ duplicado por los 91 "pendientes"      = 23.166,70 $   ← ya contados arriba
⇒ el listado infla el total facturado en 23.166,70 $  (44,3 % de lo mostrado)
```
**Casi la mitad del importe que muestra la pantalla está contado dos veces.**

**Dos anomalías de datos que acompañan al patrón:**
- **El vendedor viene vacío en las 10 filas "Pendientes por cobrar"** y lleno en las "cobradas".
- La **hora** cambia entre ambas versiones (`15:59:28` vs `00:00:00`) para la misma factura y fecha.

⚠ **Lectura alternativa que hay que descartar en desarrollo:** puede que "Facturas cobradas" signifique
en realidad *"facturas emitidas"* y el rótulo sea engañoso. **En ese caso sigue siendo defecto**, de
etiquetado y de doble conteo: la columna `Saldo pendiente` en `-` afirma que no se debe nada.

---

### DWX-FAC-004 · Conversión de moneda — **columna presente pero nunca calculada**

En **las 50 filas** (y en las 200 del modo Pendientes): `Monto conv.` = **`N/A BSD`** y
`Tasa conv.` = **`N/A`**. Cero filas con conversión (`conversionesNoNA = 0`), aunque **todos** los montos
están en `$` y la columna `Monto conv.` promete BSD.

Contrasta con **cobros**, donde la conversión sí se calcula y fue el oráculo confirmado en F0.
Sin GRANT no puedo afirmar que *debiera* haber tasa en estos documentos ⇒ **`WEB-N/A` + observación**,
no defecto. 🔗 Cerrar con: `SELECT count(*) FROM invoice WHERE nu_rate IS NOT NULL`.

📝 **Trampa de selectores confirmada:** acá **`dateB_input` = fecha INICIO** (`01/07/2026`) y
**`dateF_input` = FINAL** (`31/07/2026`) — **exactamente al revés que en `indicadorCobros`**, donde
`dateF` era el inicio. **El nombre del input NO indica su rol: hay que leer el `value`.**

---

### DWX-FAC-003 · Detalle de factura — **el botón `Consultar` está deshabilitado en TODA la vista de pendientes**

| Vista | Botones `Consultar` | Deshabilitados |
|---|---:|---:|
| `tipoDocumento = Pendientes por cobrar` | 200 | **200 (100 %)** |
| `tipoDocumento = Facturas cobradas` | 200 | 0 |

⇒ **No hay forma de abrir el detalle de un documento pendiente de cobro** — justo los que un cobrador
necesita mirar. En las facturas cobradas el botón funciona con normalidad.
Puede ser intencional (el pendiente no es un documento con detalle propio), pero **el botón se dibuja
igual, sin explicación**: o se oculta, o se explica. **Observación fuerte**, no la clasifico como defecto
duro sin confirmar la intención del diseño.

---

## Bloque 4 · DATOS MAESTROS

### DWX-MAE-002 · Clientes — `/pages/clientes` → **filtro `WEB-OK`, y cierra la sospecha del Bloque 1**

Tabla `form:tablaCli` (Detalle · Código cliente · Nombre cliente · Balance · Límite crédito ·
Fecha creación · Canal distribución). Filtros: `codProd` (Código) · `naProd` (Nombre) · `idSalesmaView` ·
`canal` · `condicion` · **`idDep` (status)**. ✅ Contador propio **"Total de Resultados"** y paginación.

#### DWX-MAE-002-P · Partición del filtro de status → **WEB-OK (exacta)**

```
idDep = "Activo"             →  Total de Resultados:  12
idDep = "Suspendido"         →  Total de Resultados: 710
idDep = "Seleccione status"  →  Total de Resultados: 722   (sin filtro)

12 + 710 = 722   ✅  partición EXACTA, sin solapes ni huecos
```
El filtro de status es **correcto**. (Dato de negocio, no defecto: **710 de 722 clientes — el 98 % —
están Suspendidos**; solo 12 activos. Vale la pena que QA lo confirme con el cliente.)

⚠ **Trampa del valor por defecto:** la pantalla abre con **`idDep = "Activo"`** ya puesto, así que
**lo primero que ve el usuario es "12 clientes"** cuando la empresa tiene 722. No es defecto —el control
muestra su valor— pero es un pie perfecto para un malentendido.

#### 🔴 DWX-MAE-002-X · **CIERRA `DWX-REP-003-X`: los 7 vendedores mostraban la cartera de TODA la empresa**

En el Bloque 1 quedó abierta la sospecha de que 7 vendedores tuvieran "719 clientes" cada uno.
**Con el contador de esta pantalla la aritmética cierra sola:**

```
Total de clientes de la empresa (sin filtro)      =  722
"Clientes Nuevos" que el reporte cuenta aparte    =    3   (idéntico en los mismos 7 vendedores)
                                                    ─────
722 − 3                                           =  719  ← EXACTAMENTE lo que muestran los 7
```

⇒ **Confirmado y sin BD:** FRANCISMAR, JHOSEMAR, ALEXANDRA, CESAR, JENNY, VANESSA y NEIMY **no muestran
su cartera, muestran la cartera completa de LATINOCOSMETICA**. Por eso los 7 comparten el mismo 719 y el
mismo 3, mientras los demás vendedores sí traen carteras propias y distintas (57, 25, 90, 196, 112, 212,
26, 122).

**Consecuencia:** su **`% Activación` está calculado sobre un denominador inflado** y por eso da valores
absurdamente bajos (0,55 % · 0,83 % · 0,69 %) frente a los vendedores con cartera real (16,32 % · 19,23 %).
**El reporte hace parecer pésimos a 7 vendedores por un error de agrupación.** Sube de sospecha a
**defecto confirmado**.

#### 🔴 DWX-MAE-002-F · **Fecha de creación corrupta: año `0030`**

Las **12 filas** de la vista "Activo" muestran `Fecha creación` = **`17/04/0030`** — año **treinta**.
`aniosFechaCreacion = {"0030": 12}`, es decir **12 de 12**, todas idénticas y todas imposibles.
Defecto de dato o de formateo, visible sin BD.

---


> ⚠ **Nota de codificación (bloque 4 · Datos Maestros, aprox. líneas 844-1056):** al escribirse esta
> sección hubo un problema de doble codificación UTF-8. Se recuperaron los **acentos y las eñes**; quedaron
> perdidos ~99 caracteres **decorativos** (guiones largos, flechas, ✅/🔴, ×) que aparecen como `�`.
> **El contenido es íntegro:** todas las palabras, cifras y veredictos se conservan. No re-ejecutar el bloque
> por este motivo.

### DWX-MAE-001 · Productos � `/pages/productos` �  **WEB-OK**

Tabla `form:tablaProd` (Detalle · Código producto · Nombre producto · Estructura producto).
**Total de Resultados: 152** · paginación **4 páginas � 50** ✅ coherente.
Filtros: `codProd` · `naProd` · `almacen` · `lista` (lista de precio) · `tps` · `ps`.

#### �x� DWX-MAE-001-T · **Cuantificación del defecto de truncado a 15 caracteres**

Aquí los nombres vienen **completos** (hasta **51 caracteres**:
`BELOTTI SHAMPOO ACIDO HIALURONICO X 20 30ML`), lo que **prueba que el dato completo existe** y que el
corte de los indicadores es una decisión de esas pantallas.

Aplicando el mismo truncado a 15 sobre el catálogo real:

```
Productos totales                                    152
Nombres distinguibles tras truncar a 15 caracteres    49
Grupos que colisionan                                 19
PRODUCTOS AFECTADOS                                  122  ->  80,3 % del catálogo
Peor caso: "BELOTTI SHAMPOO"  ->  16 productos distintos con la MISMA etiqueta
```

Ejemplos que quedan idénticos en pantalla:
`BELOTTI SHAMPOO ACIDO HIALURONICO X 20 30ML` · `⬦X 300 ML` · `⬦X 850 ML` ·
`BELOTTI SHAMPOO CEBOLLA X 20 30 ML` · `⬦CEBOLLA X 300 ML`
� **presentaciones distintas, con precios distintos, todas rotuladas `BELOTTI SHAMPOO`.**

â‡’ **8 de cada 10 productos son indistinguibles** en los indicadores. Esto convierte
`DWX-IND-004-T` de "molestia cosmética" en **defecto que inutiliza el análisis de producto**.

---

### DWX-MAE-003 · Documentos de Venta � `/pages/documentos`

Tabla `form:tablaDoc` (Detalle · Código documento · Fecha documento · Fecha vencimiento · Nombre cliente ·
Saldo documento · Límite crédito · Tipo documento).
**Total de Resultados: 283** (rango `01/07/2026 � 31/07/2026`) · **6 páginas** ✅.
Tipos vistos: `ORDEN DE ENTREGA` (48) · `TE-SER. GENERALES` (2, con código `IGTF-<epoch>`).
✅ **Los nombres de cliente vienen COMPLETOS acá** (`DISTRIBUIDORA ULTIMATE CA`,
`INVERSIONES BEAUTY SHOP CA`) � otra prueba de que el truncado es de los indicadores.

#### �x� DWX-MAE-003-L · **La columna `Límite crédito` no es un límite de crédito: repite el saldo**

**En las 50 filas leídas, `Saldo documento` == `Límite crédito`, sin una sola excepción (50/50).**

| Código documento | Saldo documento | Límite crédito |
|---|---:|---:|
| `IGTF-1785443685613.0` | 11,20 $ | **11,20 $** |
| `IGTF-1785340041060.0` | 7,20 $ | **7,20 $** |
| `2071` | 909,04 $ | **909,04 $** |
| `2070` | 414,91 $ | **414,91 $** |

Un límite de crédito es un atributo **del cliente**, no puede coincidir exactamente con el saldo de
**cada uno** de sus documentos.

�x **Y la propia web se contradice:** en **`/pages/clientes`** la columna `Límite crédito` vale
**`0 $`** para los clientes, mientras en `/pages/documentos` vale el saldo del documento. **Dos pantallas,
dos valores incompatibles para el mismo concepto.** Defecto confirmado sin BD.

---

## �x` Cierre del Bloque 4 · DATOS MAESTROS

| Caso | Marca |
|---|---|
| DWX-MAE-001 Productos (carga, 152, paginación) | `WEB-OK` |
| DWX-MAE-001-T cuantificación del truncado (80,3 %) | �x� refuerza IND-004-T |
| DWX-MAE-002 Clientes (carga, 722, contador) | `WEB-OK` |
| DWX-MAE-002-P partición status 12+710=722 | `WEB-OK` (exacta) |
| **DWX-MAE-002-X cierra la sospecha de los 719** | �x� `WEB-CALC-MISMATCH` |
| DWX-MAE-002-F fecha creación año `0030` | �x� defecto |
| DWX-MAE-003 Documentos (carga, 283, paginación) | `WEB-OK` |
| **DWX-MAE-003-L `Límite crédito` = saldo** | �x� `WEB-FIELD-MISMATCH` |

---
---

# �x}� RESUMEN FINAL � Bloques 1 a 4

## Recuento por marca

| Marca | Casos |
|---|---:|
| `WEB-OK` | **20** |
| `WEB-FIELD-MISMATCH` (defecto) | **10** |
| `WEB-CALC-MISMATCH` (defecto) | **4** |
| `WEB-N/A` | **8** |
| `â›” BLOCKED` | **0** |
| **Total** | **42** |

**Por modulo:** reportes 10 / indicadores 17 / facturaciones 5 / datos maestros 8 / pre-vuelo 2.
**Defectos totales: 14** (10 FIELD-MISMATCH + 4 CALC-MISMATCH).
*(recuento verificado contra `_web-results.jsonl`: 42 lineas, 42 casos unicos, 0 duplicados, 100% JSON valido)*

## �x� El tamaño del hueco por falta de BD

**8 casos `WEB-N/A`**, de los cuales **6 son directamente por el GRANT faltante** (los otros 2 son observaciones: DWX-IND-002-X y DWX-FAC-003):

| Caso | Qué no se pudo verificar | Cómo cerrarlo cuando haya BD |
|---|---|---|
| DWX-PRE-002 | acceso a la BD | aplicar el GRANT |
| DWX-REP-001 | Plan VS Cuota sin filas | ¿hay `presupuestoVenta`/`presupuestoCuota`? |
| DWX-REP-002 | Cumplimiento de Cuota sin filas | ídem |
| DWX-REP-004 | Rotación de Inventario sin filas | `client_stock` / `stock_history` |
| DWX-IND-004-X | total por marca 9.005,72 $ menor | `SELECT count(*) FROM product WHERE co_brand IS NULL` |
| DWX-FAC-004 | conversión siempre `N/A` | `SELECT count(*) FROM invoice WHERE nu_rate IS NOT NULL` |
| DWX-IND-002-X | gráfico que ignora el filtro | contrastar la serie mensual |

�a� **El hueco es menor de lo que se temía.** La falta de BD **no impidió encontrar defectos**: los 14
defectos se apoyan en **contradicciones internas y aritmética**, no en SQL. Lo que la BD habría añadido
es sobre todo **cerrar las 2 sospechas** (IND-004-X y FAC-004) y **decir cuál de dos cifras es la correcta**
en el defecto de Morosidad.

## �x� Los 3 defectos de confirmación cruzada � ¿se repiten en Isla Coche?

| # | Defecto reportado en La Tortuga | En Isla Coche |
|---|---|---|
| **1** | `Limpiar` no restablece los desplegables | �R **NO se reproduce.** Probado en `reportePlanCuota` con el protocolo correcto (elegir �  esperar 2,5 s �  verificar label): `unidad` BSD� "Unidad de Venta" y `cumplimiento` Facturado� "Pedido", **label y `<select>` sincronizados**. Solo nota menor: deja las fechas vacías en vez del rango por defecto |
| **2** | `Limpiar` cambia la EMPRESA | �a� **N/A estructural.** `idEnterprise` tiene **una sola opción** (`LATINOCOSMETICA C.A.`): no hay 2ª empresa a la que saltar. **No se forzó**, como se indicó |
| **3** | El ordenamiento no reordena | �R **NO se reproduce.** `reporteActivacionClientes`: `Clientes` asc **y** desc, y `% Activación` asc � las filas **sí** se movieron y el orden es **numérico**, no lexicográfico. `Vendedor` no es ordenable por diseño |

�x **Conclusión para desarrollo:** los 3 defectos de filtros/orden **NO se manifiestan en Isla Coche**.
Eso **debilita** la hipótesis "es de la versión" para ESOS tres.

�x� **PERO sí se confirmó de la versión un 4º:** **`chartjs-plugin-datalabels` cargado desde
`cdn.jsdelivr.net` revienta también acá** (`Cannot read properties of undefined (reading 'helpers')`),
en **2 playas distintas** �! **es de la versión**. Y en `pedidosProductosVentas.xhtml` es **peor**: se carga
el plugin **sin Chart.js**, `typeof Chart === "undefined"`, **0 canvas**, y la pantalla queda sin gráficos.

## �x� Cálculos que NO cuadraron � los dos números y la diferencia

| # | Dónde | Número A | Número B | Diferencia |
|---|---|---:|---:|---|
| **1** | **Morosidad**, cartera total | **184.172,93 BSD** | **1.554.562,76 $** | **� 8,44** (el `$` mayor que el BSD) |
| | Morosidad, tramo `8-15` días | 14.170,59 BSD | 14.170,59 $ | **� 1,00 � sin convertir** |
| | Morosidad, tramo `16-30` | 85.451,18 | 1.205.898,48 | � 14,11 |
| | Morosidad, tramo `31-45` | 56.684,94 | 60.334,38 | � 1,06 |
| | Morosidad, tramo `46-9999` | 27.866,22 | 274.159,30 | � 9,84 |
| | Morosidad, FUNG 21 | 2.059,27 | 995.327,56 | **� 483,34** |
| | Morosidad, NOOK | 2.695,46 | 248.088,12 | **� 92,04** |
| **2** | **Cobranzas**, Σ métodos vs total | 501.395.846,86 | 501.452.907,71 | **57.060,85 BSD** |
| **3** | **Facturaciones**, doble conteo | 52.347,91 $ mostrados | 29.181,21 $ reales | **23.166,70 $ (44,3 %)** |
| **4** | **Pedidos por Vendedor** | 116 ped. / 65.091,74 $ | 124 ped. / 65.396,22 $ | **8 ped. / 304,48 $** |
| **5** | **Activación**, cartera de 7 vendedores | 719 (mostrado) | cartera real del vendedor | **719 = 722 �� 3 = toda la empresa** |
| **6** | **Documentos**, límite de crédito | = saldo del documento (50/50) | `0 $` en `/pages/clientes` | **incompatibles** |
| **7** | **% Participación**, total por marca | 56.390,50 $ | 65.396,22 $ | 9.005,72 $ *(sospecha, falta BD)* |

## �: Qué quedó BLOCKED

**Nada.** Las 14 pantallas de los bloques 1-4 abrieron y se pudieron operar. Ningún techo de 2 intentos
se agotó. **Ninguna pantalla de configuración fue tocada.**

## �a�️ Falso positivo evitado (y cómo)

**DWX-FAC-002** iba camino de reportarse como *"el Consolidado oculta el 95 % de los pendientes"*.
La contraprueba �**igualar el tamaño de página a 200 en ambas vistas**� lo desmontó: el Consolidado
pagina bien (109 + 91 en 3 páginas). **Regla que propongo añadir a `WEB-RUNTIME.md`: nunca comparar
conteos de dos listados con tamaños de página distintos.**

## 🔴! Qué revisaría primero

1. **�x��x� La conversión de moneda de Morosidad (`DWX-IND-003-M`).** El más grave: el **ranking de morosos
   cambia por completo** según la moneda y un gestor de cobranza perseguiría a los clientes equivocados.
   Y está **aislado**: `indicadoresPedidos` convierte bien con tasa uniforme 734�737, así que
   **no es configuración de tasas, es el cálculo de esa pantalla**.
2. **�x� El doble conteo de Facturaciones (`DWX-FAC-005`).** Infla el importe mostrado un **44,3 %** y
   marca como "cobradas" facturas con el saldo íntegro pendiente. Toca dinero y decisiones de cobro.
3. **�x� La cartera inflada de 7 vendedores (`DWX-MAE-002-X`).** Aritmética cerrada (722 �� 3 = 719).
   **Hace parecer pésimos a 7 vendedores** por un error de agrupación.
4. **�x� `pedidosVendedores` pierde un vendedor (`DWX-IND-007`)**, confirmado 2 contra 1.
5. **�x� El truncado a 15 caracteres**: afecta al **80,3 %** del catálogo (122 de 152) y a los clientes.
   Arreglo barato, impacto alto.
6. **La dependencia de `cdn.jsdelivr.net`** y la pantalla que ya se quedó sin gráficos.

---

## 🔴� Patrones y selectores nuevos �  propuestos para `web-selectors/`

1. �x **Leer los gráficos SIN tocar el canvas** � el patrón más rentable de esta corrida:
   ```js
   const ch = Chart.getChart(canvasEl);
   ch.data.labels;                          // categorías
   ch.data.datasets.map(d => d.data);       // valores EXACTOS, con todos los decimales
   ```
   Convierte una pantalla "solo gráficos" (Morosidad, Cobranzas, % Participación) en un oráculo
   aritmético exacto. **Con esto salieron 4 de los 14 defectos.** �a� Comprobar antes `typeof Chart` �
   en `pedidosProductosVentas.xhtml` es `undefined` (y ése *es* el hallazgo).
2. âš  **`form:tablaComparativoPlanCuota` lo comparten `reportePlanCuota` y `reporteActivacionClientes`**
   con columnas distintas â†’ **igual que `form:pedidosDT`, el ID de tabla no identifica la pantalla.**
3. �x� **`dateB` / `dateF` NO tienen rol fijo:** en `/pages/facturaciones` y `/pages/documentos`
   `dateB` = inicio y `dateF` = fin; en `indicadorCobros` es **al revés**. **Leer el `value`, nunca deducir.**
4. **Contador `"Total de Resultados:"`** en `/pages/clientes`, `/pages/productos`, `/pages/documentos`
   �  leerlo como la hoja **siguiente** a esa etiqueta. Es el oráculo de conteo más barato de la web.
5. **Selector de filas por página** = `select.ui-paginator-rpp-options` (hay **dos**: `_paginator_top` y
   `_paginator_bottom` â†’ un selector por prefijo de id da *strict mode violation*; anclar por el id
   completo del de arriba o usar `.first()`). Valores 50/100/200.
6. **IDs de filtro por pantalla:** `[id$=":ajax"]` Buscar · `[id$=":botonLimpiar"]` Limpiar ·
   `[id$=":idEnterprise"]` empresa · `[id$=":idCurrency"]` moneda · `[id$=":clasificacion"]` ·
   `[id$=":cumplimiento"]` · `[id$=":unidad"]` · `[id$=":codRdv"]`/`[id$=":idSalesmaView"]` vendedor ·
   `[id$=":tipoDocumento"]` · `[id$=":idDep"]` status de cliente.
7. �a� **`[id$=":<campo>"] .ui-selectonemenu-trigger` puede dar *strict mode violation*** (matchea también
   el trigger de otro widget). Anclar con **`[id="<id completo>"] > .ui-selectonemenu-trigger`** (hijo directo).
8. **El prefijo del form cambia entre pantallas:** `form:j_idt114:*` en casi todas, pero
   **`form:j_idt115:*`** en `facturaciones` y `pedidosProductosVentas`. **Nunca escribir el `j_idt*`.**
9. **Nombres con doble espacio en los gráficos** (`NIULKA  CASTILLO`) y con uno solo en las tablas � 
   **normalizar espacios antes de emparejar** gráfico �  tabla.
10. **Regla anti-falso-positivo:** *igualar el tamaño de página antes de comparar dos conteos.*
11. **`addInitScript` con el `BUNDLE_DOM`** evita reinyectarlo en cada `page.goto()` � ahorró ~15 llamadas
    en esta corrida.

---

*Bloques 1-4 · 42 casos · 14 defectos · 0 BLOCKED · sin BD (sin GRANT) · READ-ONLY · 2026-07-31*


---
---

# 🔵 BLOQUES 5 · 6 · 7 — segundo agente

**Alcance:** Visitas (plan/rutero/mapa) · Estructura Comercial · Configuración.
**Pre-vuelo:** sesión viva (`/pages/main`), guarda de playa ✅ `denarioislacoche.ddns.net:8080` → `isla_coche`,
empresa **LATINOCOSMETICA C.A.** confirmada en todas las pantallas. **Sin BD** (decisión de QA).
**Modo:** READ-ONLY. En el bloque 7, **solo carga**.

---

## Bloque 5 · VISITAS

### DWX-VIS-001 · Plan de Visitas / Itinerario — `/pages/itinerario` → **WEB-OK**

**Carga:** ✅ título `Visitas`. **No es una tabla: es un calendario** (FullCalendar) con vistas
`Hoy / Mes / Semana / Día`. `tablasVisibles()` devuelve `[]` — quien busque una `.ui-datatable` acá concluye
"pantalla vacía" por error. Controles: `formVisit:idEnterprise` (1 opción) · `formVisit:idRol`.

**Contenido (julio 2026):** 42 eventos, formato `"<código vendedor> | <N> Visitas"`, en 12 días.

#### 🔑 DWX-VIS-001-X · Coherencia Itinerario ↔ lista de visitas → **WEB-OK (cuadre exacto en 3 dimensiones)**

Σ de las visitas que declara el itinerario = **209**.
Lista `/pages/visitas` (01/07–31/07, 200 filas/página, 2 páginas) = **215 filas**, pero
**209 `# Ref` únicos** (6 visitas traen 2 actividades ⇒ 2 filas, comportamiento esperado).

```
Itinerario (Σ eventos)              = 209
Lista de visitas (# Ref únicos)     = 209
Diferencia                          =   0   ✅
```

⚠ **Si se hubieran contado FILAS (215) se habría reportado un falso defecto de 6.** La regla
"agrupar por `# Ref`" evitó el 7º falso positivo de la semana.

**Y cuadra también desagregado — 9 de 9 vendedores:**

| Itinerario (código) | Lista (nombre) | Itin. | Lista |
|---|---|---:|---:|
| NCASTILLO | NIULKA CASTILLO | 64 | 64 ✅ |
| JDRAMIREZ | JUAN DANIEL RAMIREZ | 63 | 63 ✅ |
| RROMERO | RICARDO ROMERO | 24 | 24 ✅ |
| FCHACON | FRANSHESCA CHACON | 22 | 22 ✅ |
| JLZAMBRANO | JOSE LUIS ZAMBRANO | 19 | 19 ✅ |
| ACARDENAS | AGNEDY CARDENAS | 7 | 7 ✅ |
| **100** | NEIMY PARRA | 5 | 5 ✅ |
| **103** | CESAR SALAS | 4 | 4 ✅ |
| **102** | JENNY MARTINEZ | 1 | 1 ✅ |

**Y por día — 12 de 12:** 15/07:1 · 20/07:14 · 21/07:29 · 22/07:25 · 23/07:34 · 24/07:3 · 25/07:4 ·
27/07:31 · 28/07:19 · 29/07:24 · 30/07:18 · 31/07:7. **Idénticos en ambas pantallas.**

⇒ El itinerario **no inventa ni pierde visitas**. Es la agregación mejor comportada que vi hoy.

#### 🔶 DWX-VIS-001-N · Tres vendedores se identifican con un número desnudo — observación

Seis vendedores salen con código alfabético legible (`NCASTILLO`) y **tres con un número** (`100`, `102`,
`103`) que no dice nada. En la lista de visitas esos mismos tres tienen nombre completo
(NEIMY PARRA · JENNY MARTINEZ · CESAR SALAS). El itinerario **muestra el login, no el nombre**, y para
3 de 9 el login es un número. Un supervisor no puede saber de quién es la fila `100 | 3 Visitas`.
**No lo clasifico como defecto** (el dato del login es así), pero el itinerario es la única pantalla de
visitas que no muestra el nombre. Cosmético, arreglo barato.

---

### DWX-VIS-002 · Rutero — `/pages/protected/visitas/rutero.xhtml`

**Carga:** ✅ título `Rutero`. Filtros: `idEnterprise` · `idTransacion` (Visitas / Pedidos / Cobros /
**Depòsitos** / Devoluciones / Inventarios) · `idRol` · `idSalesman` (`selectOneMenu`) · **una sola fecha**
(`dateB_input`) · `btnBuscar` · `botonLimpiar`. Prefijo de form: `form:j_idt114:`.
📝 Typo: **`Depòsitos`** con acento grave — misma familia que el `Rotaciòn Inventario` del bloque 1 y que
el `Punto transacciòn` de la leyenda de esta misma pantalla. **Tres `ò` graves en la aplicación.**

#### 🔴🔴 DWX-VIS-002-M · **El mapa del Rutero NUNCA se dibuja — recuadro vacío de 741 × 571 px**

La pantalla entera existe para mostrar un mapa. **No hay mapa.**

| Comprobación | Resultado |
|---|---|
| `document.querySelectorAll('.gm-style').length` | **0** — Google Maps no renderizó nada |
| API de Google cargada (`google.maps`) | **true** — no es un problema de red ni de API key |
| Widget PrimeFaces creado (`PrimeFaces.widgets.gmapWidget`) | **sí** — el widget se instancia |
| Contenedor `form:cardMap` | **571 × 741 px**, presente y **vacío** |
| Error de consola | `InvalidValueError: setCenter: not a LatLng or LatLngLiteral with finite coordinates: in property lat: **NaN** is not an accepted value` |
| Mensaje al usuario | **ninguno** — el recuadro queda en blanco sin explicación |

**Se le pasa `NaN` como latitud al centrar el mapa** y Google aborta el render. Probado con
4 combinaciones vendedor/fecha (JUAN DANIEL RAMIREZ 31/07, NIULKA CASTILLO 31/07 y 30/07,
AGNEDY CARDENAS 28/07): **en las 4 el mapa quedó vacío.**

🔑 **Aislamiento que lo vuelve concluyente:** `/pages/mapaRutas` —**misma sesión, misma API de Google,
mismo servidor**— **sí dibuja el mapa** (`.gm-style` = 1, tiles cargadas, ~93 marcadores SVG).
⇒ **No es el entorno ni la clave de Google: es el cálculo del centro de esta pantalla.**

**Probable causa (sin BD, por observación):** las visitas consultadas tenían `Geo = "No Realizado"`
(sin coordenada). Al promediar un conjunto sin coordenadas válidas sale `NaN`. Aun así **es defecto**:
sin coordenadas debería centrar en un punto por defecto y avisar, no quedarse en blanco y mudo.

#### 🔴 DWX-VIS-002-I · Los 3 iconos de la leyenda dan 404 — context path equivocado *y* recurso inexistente

```
http://denarioislacoche.ddns.net:8080/denario/resources/images//icons/bluemarker.png    → 404
http://denarioislacoche.ddns.net:8080/denario/resources/images//icons/orangemarker.png  → 404
http://denarioislacoche.ddns.net:8080/denario/resources/images//icons/redmarker.png     → 404
```

**Dos errores en la misma URL:**
1. **Context path `/denario/`** cuando la aplicación está desplegada en **`/DenarioPremium/`**.
2. **Doble barra** `images//icons`.

Y además **el recurso no existe en ninguno de los dos contextos** — verificado con petición directa:
`/DenarioPremium/resources/images/icons/bluemarker.png` **también da 404**. Es decir, **no alcanza con
arreglar la ruta: falta el archivo en el despliegue.**

**Efecto:** las leyendas de los diálogos `form:mapaTransaccion` ("Punto transacciòn / Punto sucursal") y
`form:rutaRecorrida` ("Visita inicial / Pedido efectuado / Pedido seleccionado / Ruta…") quedan **sin
ningún icono**: 5 imágenes, **5 rotas, 0 correctas (100 %)**. El usuario ve texto sin la referencia de color
que lo hace legible.

⚠ **Trampa para el próximo agente:** esas 5 imágenes están **siempre presentes y siempre son 5**
(2 azules, 2 naranjas, 1 roja) **para cualquier vendedor y fecha** — son la **leyenda**, no marcadores.
Contarlas como "puntos de la ruta" lleva a conclusiones falsas (yo estuve a punto de reportar
"6 visitas → 5 marcadores").

---

### DWX-VIS-003 · Mapa de Rutas — `/pages/mapaRutas` → **WEB-OK**

**Carga:** ✅ mapa **renderizado** (`.gm-style` = 1, tiles `vt?pb=` de Google, controles `Mapa` / `Satélite`).
Consulta con `NIULKA CASTILLO`: **~93 marcadores SVG dibujados** y la leyenda muestra el nombre del vendedor.
**1 solo error de consola** (el de jsdelivr, ver abajo). Sin `setCenter NaN`.

📝 **Selector nuevo:** acá el vendedor es un **`p:selectCheckboxMenu`** (multi-selección:
`[id$=":idSalesman"] .ui-selectcheckboxmenu-trigger` → `li.ui-selectcheckboxmenu-item` → `.ui-chkbox-box`),
**no** el `selectOneMenu` del Rutero. Mismo nombre de campo, **widget distinto**.
📝 Esta pantalla **no tiene filtro de fecha** (solo empresa/rol/vendedor) y su `<title>` es también `Rutero`.
📝 Menor: tras marcar un vendedor el `label` del widget sigue diciendo `Seleccione...` aunque la consulta
sí aplicó (la leyenda del mapa muestra `NIULKA CASTILLO`).

---

### DWX-VIS-004 · Partición del filtro **Estatus** → **WEB-OK (exacta)**

```
Estatus = "Visitado"      →  Total de Resultados: 125
Estatus = "No visitado"   →  Total de Resultados:  90
Estatus = "Estatus" (sin) →  Total de Resultados: 215

125 + 90 = 215   ✅  partición EXACTA
```
Coincide además con el barrido completo de las 215 filas leídas a mano (125 / 90). **Filtro correcto.**

---

### 🔴🔴 DWX-VIS-005 · El filtro **Coordenadas** se contradice con la propia tabla — `WEB-FIELD-MISMATCH`

**La partición no cierra:**

```
Correcto                        92
Fuera de Rango                  28
Falta Coordenada (Sucursal)      5
Falta Coordenada (Destino)       0
No Realizado                     0      ← ❌
                              -----
Σ                              125
Total sin filtro               215
FALTAN                          90      ← justo las 90 filas "No visitado"
```

#### 🔴 DWX-VIS-005-C · `Coordenadas = "No Realizado"` devuelve **0** y la tabla muestra **90** con ese valor

**Prueba cerrada, sin BD:**

```
Estatus = "No visitado"  ->  90 filas  ->  Geo = "No Realizado" en las 90   (90/90)
Estatus = "Visitado"     -> 125 filas  ->  Correcto 92 + Fuera de Rango 28 + Falta Coord.(Sucursal) 5 = 125 ✅
Coordenadas = "No Realizado", sin filtro de estatus  ->  "No existe registro", Total = 0
```

**La misma pantalla escribe `No Realizado` en la columna `Geo` de 90 filas y su propio filtro dice que no
existe ninguna.** Dos verdades incompatibles en la misma pantalla.

**Revalidado sobre vista nueva** (`page.goto()` + **un solo** `Limpiar` + verificación de que
`Estatus = "Estatus"` y de que el `.ui-selectonemenu-label` y el `<select>` marcaban ambos `No Realizado`):
**se reprodujo, Total = 0.** No es el falso positivo de panel desincronizado.

#### 🔴 DWX-VIS-005-R · `Coordenadas = "Por Revisar"` **no filtra nada** — devuelve el 100 %

```
Coordenadas = "Por Revisar"  ->  Total de Resultados: 215   (= el total absoluto sin filtro)
Geo de la 1ª página:  Falta Coordenada (Sucursal) 4 · Correcto 7 · Fuera de Rango 1 · No Realizado 38
```

Devuelve **los cuatro valores mezclados**, incluidos **38 registros `No Realizado`** que el filtro
`No Realizado` acababa de declarar inexistentes. **El mismo desplegable da dos respuestas incompatibles
sobre las mismas filas.** Aunque "Por Revisar" pretendiera significar "todos", el valor neutro ya existe
(el placeholder `Coordenadas`), y eso no explica el `0` de `No Realizado`.

**Impacto:** el filtro de geolocalización es la herramienta para auditar si el vendedor estuvo donde dijo.
Con `No Realizado` en 0, **las 90 visitas no realizadas son invisibles para ese filtro** — justo las que
un supervisor querría revisar.

---

### DWX-VIS-006 · `Limpiar` (confirmación cruzada nº 1) → **WEB-OK — NO se reproduce**

Partiendo de `Estatus = "No visitado"` (Total 90), un `Limpiar`:

| Control | Antes | Después | label ↔ `<select>` |
|---|---|---|---|
| `idEstatus` | No visitado | **Estatus** | ✅ sincronizados |
| `idEnterprise` | LATINOCOSMETICA C.A. | LATINOCOSMETICA C.A. | ✅ **no saltó de empresa** |
| `idRol` · `idSalesman` · `idClient` · `idType` · `idMotive` · `selectAttach` · `selectCoordinadas` | valor neutro | valor neutro | ✅ |
| `dateB` / `dateF` | 01/07/2026 – 31/07/2026 | **vacías** | ⚠ nota |

**9 de 9 controles con `label` y `<select>` sincronizados**, y `Buscar` posterior devolvió 215 (coherente).
⇒ **El defecto nº 1 tampoco se reproduce en visitas.**
⚠ **Nota:** igual que en `reportePlanCuota`, `Limpiar` deja las fechas **vacías** en vez de restaurar el
rango por defecto del mes. **Mismo comportamiento en 2 pantallas distintas ⇒ es el diseño**, no un fallo suelto.

### DWX-VIS-007 · Ordenamiento (confirmación cruzada nº 3) → **WEB-OK — NO se reproduce**

| Columna | Acción | `aria-sort` | ¿Se movieron? | Orden |
|---|---|---|---|---|
| `Ref` | 1er clic | `ascending` | ✅ | `1,2,3,3,4,5,6,6,7,8,9,10,11,12,13` — **numérico** |
| `Ref` | 2º clic | `descending` | ✅ | `209,208,207,207,206,…` |
| `Vendedor` | 1er clic | `ascending` | ✅ | `AGNEDY CARDENAS ×7, CESAR SALAS ×4, FRANSHESCA CHACON…` alfabético |

⇒ Reordena de verdad y **es numérico, no lexicográfico**. (Los `Ref` repetidos son las visitas con 2
actividades, no un fallo de orden.)

### DWX-VIS-008 · Consola → refuerza el hallazgo del CDN, **con un agravante nuevo**

`chartjs-plugin-datalabels` de `cdn.jsdelivr.net` revienta con
`Cannot read properties of undefined (reading 'helpers')` **también en `/pages/itinerario`,
`rutero.xhtml` y `/pages/mapaRutas`** — pantallas que **no tienen ni un solo gráfico**
(`typeof Chart === 'undefined'`, **0 canvas**).

🔑 **Dato nuevo respecto al bloque 2:** el script del CDN externo se carga **en toda la aplicación**, no solo
en indicadores. Si la red del cliente bloquea `cdn.jsdelivr.net`, **cada página** de Denario paga la espera
del recurso externo, incluso las que nunca dibujan un gráfico.

---

## 📊 Cierre del Bloque 5 · VISITAS

| Caso | Marca |
|---|---|
| DWX-VIS-001 Itinerario carga | `WEB-OK` |
| DWX-VIS-001-X coherencia itinerario ↔ lista (209=209, 12/12 días, 9/9 vendedores) | `WEB-OK` |
| DWX-VIS-001-N vendedores identificados con número | observación |
| DWX-VIS-002 Rutero carga | `WEB-OK` |
| **DWX-VIS-002-M el mapa del Rutero no se dibuja (`setCenter` NaN)** | 🔴🔴 defecto |
| **DWX-VIS-002-I iconos de leyenda 404 (5/5 rotas)** | 🔴 defecto |
| DWX-VIS-003 Mapa de Rutas | `WEB-OK` |
| DWX-VIS-004 partición Estatus 125+90=215 | `WEB-OK` |
| **DWX-VIS-005-C filtro `No Realizado` → 0 con 90 filas** | 🔴🔴 `WEB-FIELD-MISMATCH` |
| **DWX-VIS-005-R filtro `Por Revisar` no filtra (215)** | 🔴 `WEB-FIELD-MISMATCH` |
| DWX-VIS-006 `Limpiar` (cruzada nº 1) | `WEB-OK` (no se reproduce) |
| DWX-VIS-007 ordenamiento (cruzada nº 3) | `WEB-OK` (no se reproduce) |
| DWX-VIS-008 consola jsdelivr en pantallas sin gráficos | 🔴 refuerza defecto conocido |

**0 `WEB-N/A` en este bloque:** ninguna de las 3 pantallas del guión dependía de la BD.

---

## Bloque 6 · ESTRUCTURA COMERCIAL

> 🔑 **Este bloque cierra dos `WEB-N/A` del Bloque 1 sin BD** — y obliga a **corregir** uno de sus veredictos.

### DWX-EST-001 · Estructura de Productos — `/pages/estructuraProducto` → **WEB-OK**

Tabla `form:tablaProd` (Código estructura · Nombre estructura · Estructura padre · Tipo de estructura).
**Total de Resultados: 17**, leídas 17 ✅.

```
Tipo "Marca"     →  4   (BELOTTI · BELOTTI COLOR PLUS · PROKPIL · ROIAL)
Tipo "Categoria" → 13
                   ──
                   17   == Total de Resultados   ✅
```

✅ **Coherencia con el detalle del Plan de Venta:** las 4 marcas y las 13 categorías son exactamente las
mismas que aparecen al agrupar el plan por `Marca` (4 filas) y por `Categoria` (13 filas). **Cuadra.**
📝 `BELOTTI COLOR PLUS` es la única marca **sin categorías hijas** — coherente con que salga en 0 en el plan,
en la cuota y en el reporte de cumplimiento. **Dato, no defecto.**
⚠ **Falso positivo evitado:** la columna `Estructura padre` guarda el **nombre** del padre (`ROIAL`), no su
**código** (`03`). Un chequeo de integridad referencial código↔padre marca "3 huérfanos" que **no existen**.

---

### DWX-EST-002 · Estructura de Ventas / Zonas — `/pages/estructuraEmpresa` → **carga OK, con defecto de datos**

Título `Zonas de venta`, misma tabla `form:tablaProd`. **Total: 206** · paginación 200/página ✅.
Composición de las 200 leídas: `ciudad` 176 · `Estado` 23 · `Pais` 1.

#### 🔴 DWX-EST-002-E · **Caracteres corruptos en 6 estados de Venezuela — 36 de 200 celdas (18 %)**

```
ANZO�TEGUI   ·   M�RIDA   ·   BOL�VAR   ·   FALC�N   ·   T�CHIRA   ·   GU�RICO
```

**Verificado que el carácter roto está en la página, no en la herramienta:** es el carácter de reemplazo
**U+FFFD**, y la página **declara UTF-8** (`document.characterSet = "UTF-8"`,
`Content-Type: text/html; charset=UTF-8`). Es decir, **el contenido llega con bytes mal codificados a una
página que sí está en UTF-8** — no es un problema del navegador.

**Afecta exactamente a los 6 estados cuyo nombre lleva tilde**, y **36 de las 200 celdas** de
`Estructura padre` lo muestran. El mismo defecto aparece en el detalle del plan (`LINEA U�AS`).
**Visible sin BD, en una pantalla que un usuario abre todos los días.**

---

### 🔴 DWX-EST-003 · Canales de Distribución — `/pages/segmentacion` → el contador y su propio botón no coinciden

Tabla `form:tablaProd`: **1 canal**, `01 · DETAL`, columna **`Cantidad clientes` = 722**.
La fila trae el botón **`Consultar clientes`**.

```
Contador de la pantalla         :  722 clientes
Pulsar "Consultar clientes"     →  /pages/protected/clientes/clientes.xhtml
Total de Resultados en destino  :   12          ←  1,7 % de lo anunciado
```

**Diagnóstico exacto (medido, no supuesto):** el destino **sí recibe** el contexto del canal
(`canal = DETAL` ✅) pero **añade por su cuenta `idDep = "Activo"`**, y la empresa tiene 710 de 722
clientes suspendidos. **Comprobación que lo cierra:** poniendo `idDep = "Seleccione status"` en el destino
y pulsando `Buscar`, el total sube a **722 — exactamente el contador de origen**.

⇒ **El contador 722 es correcto; el defecto está en el salto**, que aplica un filtro que nadie pidió y
**no lo anuncia**. Quien audite el canal DETAL ve 12 clientes donde el sistema acaba de decirle que hay 722.
Es el patrón "contador contra su propio listado", con **factor 60×**.

📝 `Código Lista precio` y `Nombre Lista precio` vienen **vacíos** en el único canal. Sin BD no puedo decir
si debería haber lista asignada ⇒ observación.

---

### DWX-EST-004 · Plan de Venta — `/pages/presupuestoVenta`

**Lista:** 1 plan para 2026 — Presupuesto **617.212**, Tipo de Plan **DOLARES**, fecha 19/07/2026,
`Aprobado Por: Q3`. Tabla `form:tablaPres`.
⛔ **No se tocaron** `Agregar presupuesto` ni `Eliminar`. Solo `Consultar productos` (lectura).

#### ⚠ DWX-EST-004-P · Falso positivo evitado — **el detalle NO está vacío: hay que elegir `Parámetro`**

Al abrir el detalle (`planVenta.xhtml`) con el desplegable `Parámetro` en su valor neutro:
tabla **"No existe registro"** y cabecera **`Presupuesto:` `Presupuestado:` `Diferencia:` los tres vacíos**
(confirmado con **los dos lectores de cabecera**, hermano-del-padre y `leerCabecera` — ambos vacíos).

**Iba a reportarse como "el plan existe pero no tiene detalle".** Aplicando la lección que dejó el agente de
los bloques 1-4 (*el desplegable neutro no agrupa nada*), con **`Parámetro = Marca`** aparecen **4 filas** y
la cabecera se llena. **No es defecto — es el mismo desplegable neutro.**

#### DWX-EST-004-A · Aritmética del plan → **WEB-OK (exacta)**

Con `Parámetro = Marca`. ⚠ **La tabla tiene 12 meses × 2 subcolumnas (`Inicial`, `Actual`)** —
3 filas de `thead`, 26 `td` por fila. *(Un lector que deduplique encabezados por nombre se queda con
un solo par y calcula mal: ver "patrones nuevos".)*

| Marca | Jul | Ago | Sep | resto | Σ año |
|---|---:|---:|---:|---:|---:|
| BELOTTI | 22.800 | 22.800 | 22.800 | 0 | 68.400 |
| PROKPIL | 107.000 | 107.000 | 107.000 | 0 | 321.000 |
| ROIAL | 4.604 | 4.604 | 4.604 | 0 | 13.812 |
| BELOTTI COLOR PLUS | — | — | — | — | 0 |
| | | | | **Σ** | **403.212** |

```
Σ filas                     = 403.212
Cabecera "Presupuestado"    = 403.212   →  diferencia 0,00   ✅
617.212 − 403.212           = 214.000
Cabecera "Diferencia"       = 214.000   →  diferencia 0,00   ✅
```
**Las dos igualdades cierran exactas.** El plan solo tiene distribución en **julio, agosto y septiembre**.

#### 🔴 DWX-EST-004-G · **El total `Presupuestado` cambia según cómo se agrupe** → `WEB-CALC-MISMATCH`

| `Parámetro` | Filas | `Presupuestado` | `Diferencia` |
|---|---:|---:|---:|
| **Marca** | 4 | **403.212** | 214.000 |
| **Empresa** | 1 (LATINOCOSMETICA) | **0** | 617.212 |
| **Categoria** | 13 | **0** | 617.212 |

**Agrupar redistribuye, nunca cambia el total.** Y `Empresa` es la agrupación **más gruesa de todas**:
por definición tiene que contener el 100 % del plan. Que devuelva **0** es indefendible.
La pantalla afirma dos cosas incompatibles sobre el mismo plan según qué opción se elija,
**sin ningún aviso**.

---

### DWX-EST-005 · Cuota de Venta — `/pages/presupuestoCuota`

**Lista:** 1 cuota 2026 — Presupuesto **617.212**, DOLARES, 19/07/2026, `Aprobado Por: DL`.
📝 El detalle (`planCuota.xhtml`, "Detalle de Cuota") **no usa el mismo control que el plan**: acá es
`[id$=":opciones"]` (+ `rdv` vendedor y `anio`), no `[id$=":parametros"]`. **Dos pantallas gemelas con
controles de nombre distinto.**

#### DWX-EST-005-A · Aritmética de la cuota → **WEB-OK (exacta)**

Con `opciones = Marca`: BELOTTI **65.400** · PROKPIL **311.000** · ROIAL **13.604** ·
BELOTTI COLOR PLUS 0 · SIN REFERENCIA 0.

```
65.400 + 311.000 + 13.604   = 390.004
Cabecera "Presupuestado"    = 390.004   →  diferencia 0,00   ✅
617.212 − 390.004           = 227.208
Cabecera "Diferencia"       = 227.208   →  diferencia 0,00   ✅
```

#### 🔴 DWX-EST-005-G · **Mismo defecto de agrupamiento que el plan**

| `opciones` | Filas | `Presupuestado` |
|---|---:|---:|
| **Marca** | 5 | **390.004** |
| **Productos** | 5 | **390.004** *(¡las mismas 4 marcas + SIN REFERENCIA — no lista productos!)* |
| **Empresa** | 1 | **0** |
| **Canales de distribución** | 1 (DETAL) | **0** |

⇒ **Dos defectos en una tabla:** el total depende del agrupamiento (390.004 vs 0) **y** la opción
`Productos` devuelve **exactamente lo mismo que `Marca`** — no agrupa por producto.
📝 La cuota tiene una fila extra `SIN REFERENCIA` que el plan no tiene.

---

## 🔗 DWX-EST-006 · Cruce con el Bloque 1 — **corrige un `WEB-N/A` y descubre 2 defectos**

El Bloque 1 dejó `reportePlanCuota` y `reporteCumplimientoCuota` en **`WEB-N/A`** ("No se encontraron
registros; sin GRANT no puedo afirmar que debería haber datos"). **Ahora sí se puede afirmar**: acabo de
comprobar en el Bloque 6 que **existe Plan 2026 (403.212) y Cuota 2026 (390.004) con desglose por marca.**

Repetí ambos reportes **con `clasificación = Marca`** (el Bloque 1 los probó con el valor neutro) y rango
`01/01/2026 – 31/12/2026`:

### ✅ Corrección al Bloque 1 — `reporteCumplimientoCuota` **SÍ trae datos**

| Descripción | Cuota (BSD) | Monto Pedido (BSD) | Brecha Cuota (BSD) | Cantidad | % Cumplimiento | Cartera |
|---|---:|---:|---:|---:|---:|---:|
| BELOTTI | **0** | 13.410.996,64 | 13.410.996,64 | 60 | **100%** | 719 |
| BELOTTI COLOR PLUS | 0 | 0 | 0 | | 0% | |
| PROKPIL | **0** | 33.040.625,84 | 33.040.625,84 | 84 | **100%** | 719 |
| ROIAL | **0** | 1.739.647,35 | 1.739.647,35 | 10 | **100%** | 719 |

⇒ **`DWX-REP-002` no era `WEB-N/A` por falta de datos: estaba vacío por el desplegable neutro.**
**Y el defecto `DWX-REP-002-H` (dos columnas con encabezado `()`) queda MATIZADO:** con una clasificación
real los encabezados **sí se rellenan** — `Cuota (BSD)`, `Monto Pedido (BSD)`, `Brecha Cuota (BSD)`,
`Cantidad Pedido (BSD)`. Los `()` vacíos aparecen **solo mientras no se elige clasificación**.
Sigue siendo un defecto (la pantalla arranca con columnas anónimas), pero **no** "permanentemente sin título".

### 🔴 DWX-EST-006-C · La cuota vale 0 en el reporte y 65.400 / 311.000 / 13.604 en la pantalla de cuota

| Marca | `presupuestoCuota` → detalle | `reporteCumplimientoCuota` → `Cuota (BSD)` |
|---|---:|---:|
| BELOTTI | **65.400** | **0** |
| PROKPIL | **311.000** | **0** |
| ROIAL | **13.604** | **0** |
| **Σ** | **390.004** | **0** |

**La cuota está cargada y el reporte que existe para medirla contra ella la lee como cero.**
⚠ No es un problema de unidad: la cuota está en DOLARES y el reporte en BSD, pero una conversión
**multiplicaría por ~737**, jamás anularía. **390.004 → 0 no es una conversión.**

### 🔴 DWX-EST-006-P · `% Cumplimiento = 100 %` con `Cuota = 0` — división por cero mal resuelta

`% Cumplimiento` es `Monto / Cuota`. Con `Cuota = 0` las tres marcas con ventas muestran **100 %**,
y la única con `Monto = 0` muestra 0 %. La regla implícita es *"cuota 0 y monto > 0 ⇒ 100 %"*.

**Le dice al negocio que se cumplió al 100 % una cuota que el propio reporte declara inexistente.**
Y la `Brecha Cuota` es **igual al monto vendido íntegro** (13.410.996,64), que es lo que sale de restar
contra cero.

📌 **Contraste que lo vuelve defecto y no criterio:** en `reporteActivacionClientes` (Bloque 1) la división
por cero **sí está bien resuelta** — los vendedores con 0 clientes muestran `0 %`, no `NaN` ni `100 %`.
**La misma aplicación resuelve el caso bien en una pantalla y mal en otra.**

### 🔴 DWX-EST-007 · `reportePlanCuota` sigue **vacío** con la misma clasificación y las mismas fechas

Mismo `clasificación = Marca`, mismo rango `01/01/2026 – 31/12/2026`, misma sesión:

| Reporte | Resultado |
|---|---|
| `reporteCumplimientoCuota` | **4 filas** con datos |
| `reportePlanCuota` | **"No se encontraron registros."** |

Sus encabezados **sí** se rellenaron (`Plan (BSD)` · `Pedido (BSD)` · `Diferencia Plan Vs Pedido (BSD)` ·
`Monto Pedido (BSD)`), o sea que la clasificación **se aplicó**: simplemente **no devuelve filas**.
**Con Plan 2026 cargado (403.212, distribuido en julio–septiembre) y su reporte gemelo devolviendo datos
para el mismo rango, el vacío ya no es explicable por falta de datos.**
⇒ **`DWX-REP-001` sube de `WEB-N/A` a defecto.**

📝 La columna **`Promedio activación (0 meses)`** sigue diciendo `(0 meses)` — mismo síntoma de plantilla
sin rellenar que los `()` vacíos y que los `BELOTTI ()` / `PROKPIL ()` del detalle del plan.
**Es un patrón repetido: literales de plantilla que nunca reciben su valor.**

---

## 📊 Cierre del Bloque 6 · ESTRUCTURA COMERCIAL

| Caso | Marca |
|---|---|
| DWX-EST-001 Estructura de Productos (17 = 4+13) | `WEB-OK` |
| DWX-EST-002 Estructura de Ventas (206, paginación) | `WEB-OK` |
| **DWX-EST-002-E caracteres corruptos en 6 estados (36/200)** | 🔴 defecto |
| **DWX-EST-003 Canales: contador 722 vs drill-down 12** | 🔴 `WEB-FIELD-MISMATCH` |
| DWX-EST-004 Plan de Venta carga | `WEB-OK` |
| DWX-EST-004-A aritmética 403.212 / 214.000 | `WEB-OK` (exacta) |
| **DWX-EST-004-G total según agrupamiento (403.212 vs 0)** | 🔴 `WEB-CALC-MISMATCH` |
| DWX-EST-005 Cuota de Venta carga | `WEB-OK` |
| DWX-EST-005-A aritmética 390.004 / 227.208 | `WEB-OK` (exacta) |
| **DWX-EST-005-G total según agrupamiento + `Productos`≡`Marca`** | 🔴 `WEB-CALC-MISMATCH` |
| DWX-EST-006 Cumplimiento SÍ trae datos (corrige DWX-REP-002) | `WEB-OK` |
| **DWX-EST-006-C cuota 390.004 leída como 0** | 🔴 `WEB-CALC-MISMATCH` |
| **DWX-EST-006-P % Cumplimiento 100 % con cuota 0** | 🔴 `WEB-CALC-MISMATCH` |
| **DWX-EST-007 `reportePlanCuota` vacío con datos cargados** | 🔴 `WEB-FIELD-MISMATCH` |

**0 `WEB-N/A`** en este bloque — y **2 `WEB-N/A` del Bloque 1 quedaron cerrados** (`DWX-REP-001` pasa a
defecto, `DWX-REP-002` pasa a `WEB-OK` con matiz).

🔎 **Dato de negocio que conviene que QA confirme con el cliente:** la `Cartera de clientes` vuelve a salir
**719** en este reporte, igual que en `reporteActivacionClientes`. **Es la 3ª pantalla con el mismo 719**
(= 722 − 3), lo que refuerza `DWX-MAE-002-X`: no es un error de una pantalla suelta, es el cálculo de cartera.

---

## Bloque 7 · CONFIGURACIÓN — ⚠ SOLO CARGA

> 🔒 **Protocolo aplicado en todo el bloque:** únicamente `page.goto()` + lectura del DOM.
> **CERO clics.** Ni `Buscar`, ni `Limpiar`, ni un solo control. Ningún formulario de edición se abrió,
> ningún desplegable se desplegó, ningún `Guardar` se rozó. **La configuración productiva quedó intacta.**

### DWX-CFG-001 · Datos Empresa — `/pages/protected/empresa/datosEmpresa.xhtml` → **WEB-OK (carga)**

Título `Datos Empresa`. **Es un formulario vivo**: **6 inputs de texto editables + 4 desplegables**, sin tabla.
Carga sin error y con los datos de la empresa cargados. **No se tocó nada.**

### DWX-CFG-002 · Variables Globales — Empresa — `/pages/variablesConfiguracion` → **WEB-OK**

Título `Configuración`. Tabla `formGlobal:tablaConf` con **54 variables** legibles
(descripción + valor). ⚠ **Superficie de escritura muy expuesta: 58 inputs editables, 45 desplegables y
un botón `Guardar`, todo en la misma pantalla, sin confirmación intermedia visible.** Solo lectura.

### DWX-CFG-003 · Variables Globales — Clientes — `/pages/variablesConfiguracionClientes` → **WEB-OK**

Misma tabla `formGlobal:tablaConf`, **27 variables** (`Descripción` · `Valor de variable`).
31 inputs + 27 selects + `Guardar`. Solo lectura.
📝 El `<title>` de esta pantalla es **`Productos`** — copiado de otra. Cosmético.

---

### 🔑 DWX-CFG-002-Y · Contraste de las VG contra `automation/clientes/latino_cosmetica.yaml`

Éste es el uso indirecto valioso que pedía el guión: **detectar un perfil desactualizado sin tocar nada.**
El YAML se construyó con dumps de **La Tortuga** y el cliente **migró a Isla Coche** — así que había motivo
para sospechar. **No lo está.**

| VG del perfil | YAML | Web Isla Coche | |
|---|---|---|---|
| `multiCurrency` | true | "¿Realizan transacciones con diferentes monedas?" **SI** | ✅ |
| `userMustActivateGPS` | true | "¿Deben activar la Geolocalización...?" **SI** | ✅ |
| `visitRout` / `userCanSaveGPS` | true | "¿Pueden capturar coordenadas de las sucursales?" **SI** | ✅ |
| `enterpriseEnabled` | true | "¿campo de empresa en todos los módulos?" **SI** | ✅ |
| `orderEnterpriseEnabled` | false | "¿campo de empresa en el módulo de pedido?" **NO** | ✅ |
| `esVendedor` / `infoVendedores` | true | "¿Maneja el módulo de vendedores desde el administrativo?" **SI** | ✅ |
| `tagRif` | "RIF" | "¿Qué nomenclatura usa para el RIF?" **RIF** | ✅ |
| `userCanUploadFiles` | true | "¿vendedores adjuntar documentos?" **SI** | ✅ |
| `multiInvoices` | false | "¿devolver productos de diferentes facturas?" **NO** | ✅ |
| `requeridedNroFactura` | true | "¿número de factura requerido en devoluciones?" **SI** | ✅ |
| `validateReturn` | true | "¿validar que el producto devuelto exista en factura?" **SI** | ✅ |
| `clientStock` | true | "¿toma de inventario en el cliente?" **SI** | ✅ |
| `requireClientStock` | false | "¿toma de inventario requerida antes del pedido?" **NO** | ✅ |
| `expirationBatch` | false | "¿fecha de expiración y nº de lote en la toma?" **NO** | ✅ |
| `transportRole` | true | "¿Manejan el rol Transportista?" **SI** | ✅ |
| `userCanChangePriceList` | false | "¿vendedores cambiar listas de precio?" **NO** | ✅ |
| `signatureVisit/Order/Collection/Deposit/Stock/Return/Client` | los 7 true | los 7 módulos en **SI** | ✅ ×7 |

⇒ **23 de 23 variables contrastables coinciden.** El perfil **no está desactualizado** pese a la migración
de playa. Es un resultado tranquilizador que sólo se puede afirmar habiéndolo mirado.

#### 🔶 La única discrepancia — `clientsOrderBy`

| | |
|---|---|
| **YAML** (`modules.clientes`) | comentario: *"Buscador filtra por NOMBRE (`clientsOrderBy=na_client`)"* |
| **Web Isla Coche** | "¿Qué campo desea usar para ordenar la lista de clientes?" → **`co_client`** |

La VG de la web dice **código**; el perfil anotó **nombre**. El comentario del YAML dedujo el valor
**del comportamiento del buscador**, que es *filtrado*, no *ordenamiento* — dos cosas distintas.
⇒ **Corregir el perfil a `clientsOrderBy: co_client`.** (La web es la fuente, no la inferencia.)
📝 Su equivalente de productos también está explícito: `productsOrderBy = co_product`.

#### 💡 VGs que la web declara y el perfil **no tiene** — propuestas para el YAML

| Variable (web) | Valor | Por qué importa |
|---|---|---|
| **Distancia máxima transacción↔sucursal** | **50 m** | 🔑 **Es el umbral que produce los 28 `Fuera de Rango` del Bloque 5.** Sin este dato no se puede juzgar si esas visitas son un problema real |
| Decimales a mostrar | 2 | formato de todos los importes |
| Meses de histórico de transacciones | 3 | |
| Meses de facturas validadas en devolución | 3 | |
| Peso máximo de imagen adjunta | 30 MB | |
| Máx. caracteres en comentarios | 200 | |
| Línea de producto destacado | `DESTACADOS` | |
| Nombre de columna `product_valor` | `Kg` | |
| Rol Promotor / Rol Planta | SI / SI | el perfil solo anota `transportRole` |
| **Expiración de contraseñas** | **0 = deshabilitada** | 🔒 observación de seguridad: las claves **no caducan nunca**, aunque el aviso previo está configurado en 7 días |
| IVA por producto | SI | |
| Dashboard solo para Administrador | SI | |

✅ **Coherencia interna comprobada:** las **6** VG "¿Desea recibir notificaciones por correo de…?" están en
**NO**, y `/pages/notificaciones` **no tiene ni un destinatario configurado**. Encaja.
Igual `descuento global = NO` ↔ `/pages/descGlobal` vacío.
🔶 **Salvo una:** el YAML declara `userCanSelectCollectDiscount = true` pero `/pages/descCobros` está
**vacío** — la función está habilitada y no hay ni un descuento definido. Observación.

📝 **Calidad de los textos de configuración** (visibles al usuario que configura): `¿Dsean visualizar…`,
`se habilita el campo "tipo de pedidos" mostrando el listado crearo deade la web`, `sucursalas`,
`relizar`, `¿Cúal es…`, y otra vez el acento grave — `habilitarà un mòdulo`, `expiraciòn`, `mòdulo` en
**7 descripciones**. Cosmético pero abundante.

---

### DWX-CFG-004 · Usuarios · Dispositivos · Supervisores · Licencias → **WEB-OK (las 4 cargan)**

| Pantalla | Tabla | Contenido |
|---|---|---|
| `/pages/usuarios` | `form:tablaUsuario` | **20 usuarios** (Usuario Externo · Nombre · Apellido · Rol · Estatus) |
| `/pages/dispositivos` | `form:tableDevice` | **vacía** |
| `/pages/supervisores` | `form:tablaUsuario` | **1 supervisor** |
| `/pages/licencias` | `form:licenciasDT` | **vacía** (Código · Login · Usuario · Rol · Días conectado · Pedidos · Cobros · Visitas/Despachos · Devoluciones) |

⚠ Los botones `Editar`, `Eliminar` y **`Generar Clave`** están presentes en Usuarios. **No se tocaron.**

#### 🔶 DWX-CFG-004-X · Licencias y Dispositivos vacíos con actividad móvil real → `WEB-N/A` (observación)

`Licencias` es un cuadro de **uso por usuario** (días conectado, pedidos, cobros, visitas) y está vacío,
igual que `Dispositivos` — mientras la misma web registra **209 visitas y 124 pedidos enviados desde la app
en julio**. Es una tensión llamativa.

**No lo declaro defecto y explico por qué:** ambas pantallas tienen `Buscar`/`Limpiar` y **por política de
este bloque no pulsé ningún control**, así que **no puedo descartar que un `Buscar` con otro rango las
llene**. Sin BD tampoco puedo afirmar que deberían tener filas. ⇒ **`WEB-N/A`, y queda anotado para que
QA lo mire a mano en 30 segundos.**

---

### DWX-CFG-005 · Catálogos → **WEB-OK (7 de 7 cargan)**

| Catálogo | Ruta | Contenido |
|---|---|---|
| Tipos de devolución | `/pages/tiposdevol` | **3**: `52 PostVenta` · `60 Calidad` · `59 Servicio` |
| Motivos de devolución | `/pages/motivosdevol` | **24** |
| IVA | `/pages/iva` | **2**: `16 %` (**por defecto**) · `0 %` |
| IGTF | `/pages/igtf` | **2**: `IGTF 0 %` (**por defecto**) · `3 %` |
| Actividades | `/pages/actividades` | **11**, todas `Requiere Eventos = SI` · `Requiere Firma = NO` |
| Tipos de pedido | `/pages/tipoPedidos` | **2**: `KIB-PE PEDIDO ESTANDAR` (por defecto) · `0001 Promotor` |
| Feriados | `/pages/feriados` | **vacío** (Total 0) |

✅ **Tres confirmaciones cruzadas del perfil, exactas:**
1. Los 3 tipos de devolución **coinciden código por código** con el YAML
   (`Calidad(60,default)/PostVenta(52)/Servicio(59)`).
2. Las **11 actividades** con `requiredEvent=true` / `requiredSignature=false` coinciden con la nota del
   YAML (*"11 actividades TODAS requiredEvent=true/requiredSignature=false"*).
3. `IGTF 0 %` es el valor por defecto ↔ `igtfDefault: false` del YAML.

#### 🔑 DWX-CFG-005-A · Esto **explica un defecto móvil abierto** (`DM-VIS-020`)

El YAML anota como defecto conocido: *"`signatureVisit=true`: acordeón Firma presente **PERO envío procede
SIN firma**"*. **La configuración lo explica sin ambigüedad:**

```
VG de empresa   →  "¿Desea habilitar la firma en el módulo de visitas?"  =  SI     (el acordeón aparece)
Catálogo de actividades  →  las 11 actividades tienen  "Requiere Firma" = NO       (nada la exige)
```
⇒ **La firma está habilitada a nivel de módulo y no es obligatoria en ninguna actividad.**
No es un defecto de la app: **es la configuración**, y se puede cerrar `DM-VIS-020` como *comportamiento
esperado* o pedir al cliente que marque `Requiere Firma` en las actividades que lo necesiten.
**Este es el tipo de hallazgo que sólo aparece cruzando la web de configuración con el guión móvil.**

#### 🔶 DWX-CFG-005-C · Tres huecos de datos en los catálogos → `WEB-N/A` (observación)

1. **`Cod. Motivo de Devolución` vacío** en todos los motivos inspeccionados — la columna de código existe
   y no tiene valor.
2. **`Categoria de Devolución` = `"Seleccione una categoría"`** en los 3 tipos: **el listado muestra el
   placeholder de un desplegable como si fuera el valor**. Ninguno tiene categoría asignada, y la pantalla
   lo comunica de la peor manera posible.
3. **`Feriados` vacío**: la planificación de visitas no descuenta ningún día no laborable.

Sin BD no puedo afirmar que *deberían* tener valor ⇒ observación, no defecto. La nº 2 sí es criticable
como presentación aunque el dato falte.

---

### DWX-CFG-006 · **Errores de aplicación** → **WEB-OK (carga) · 0 registros**

#### 🔴 DWX-CFG-006-R · La ruta del guión está equivocada — **corregir `smoke-web-extendido.md`**

```
Guión:  /pages/protected/administracion/erroresAplicacion/error              →  HTTP 404
Real :  /pages/protected/administracion/erroresAplicacion/erroresAplicacion.xhtml   ✅
```
Probadas 5 variantes, las 5 dieron 404; la ruta buena se obtuvo **leyendo los `href` del menú**, que resultó
ser la forma barata y fiable de resolver esto. **Un agente que no lo verifique reporta la pantalla como
caída.**

#### Resultado del log

| | |
|---|---|
| Tabla | `form:failedTxDT` — Código fallido · Transacción · Módulo · Código error · Mensaje · Usuario · Empresa · Fecha fallo · Actualización · **JSON** |
| Filtros al cargar | `Empresa = Todas` · `Módulo = Todos los módulos` · `Usuario = Todos los usuarios` — **los tres en su valor más amplio** |
| **Registros** | **0** — "No se encontraron registros." |

⇒ **No hay errores recurrentes que reportar**, que era la joya que este caso buscaba. Con los tres filtros
en "Todas/Todos" y sin filtro de fecha visible, la lectura es que **el log está genuinamente vacío**.
📝 Dato útil para el futuro: la tabla guarda el **JSON de la transacción fallida**, así que cuando tenga
filas es un oráculo de primera para cotejar contra los payloads del móvil.

---

### DWX-CFG-007 · **8 pantallas de configuración que el guión no lista** → **WEB-OK (las 8 cargan)**

Descubiertas leyendo los `href` del menú. Ninguna da error; casi todas están vacías:

| Pantalla | Ruta | Contenido |
|---|---|---|
| Estatus de Transacciones | `/pages/protected/administracion/estatusTransacciones/…` | vacía |
| Códigos de Diferencia | `…/codigosDiferencias/codigosDiferencias.xhtml` | vacía |
| Comisiones | `…/usuarios/comisiones.xhtml` | vacía |
| Notificaciones | `/pages/notificaciones` | vacía ✅ *(coherente: las 6 VG de correo en NO)* |
| Descuentos Globales | `/pages/descGlobal` | vacía ✅ *(coherente: descuento global = NO)* |
| Descuentos para Cobros | `/pages/descCobros` | vacía 🔶 *(el perfil dice `userCanSelectCollectDiscount=true`)* |
| **Módulos** | `/pages/modulos` | **9 filas con datos** — ver abajo |
| Configuración de Reportes | `/pages/configuracionReportes` | sin tabla |

⛔ **`/pages/protected/cambiarClave.xhtml` NO se abrió**, por prohibición explícita de `WEB-RUNTIME §0`.

#### 🔑 DWX-CFG-008 · `/pages/modulos` confirma la VG de moneda por módulo

| Módulo | Moneda por defecto | Mostrar conversiones | Selector de monedas |
|---|---|---|---|
| **Pedidos** | **Moneda fuerte** | **NO** | **NO** |
| **Productos** | **Moneda fuerte** | SI | SI |
| Visitas · Inventarios · Devoluciones · Cobros · Depósitos · Vendedores · Clientes | Moneda local | SI | SI |

✅ **Confirma `multiCurrencyOrder: false` del perfil** (*"Tab Total pedidos solo US$"*) y explica que
`indicadoresPedidos` (Bloque 1) traiga `$` por defecto.
🔎 **Y acota el defecto de Morosidad (`DWX-IND-003-M`):** la conversión por módulo está configurada de forma
uniforme y sensata en las 9 entradas. **No hay aquí nada que explique los factores 1,00 / 14,11 / 483× de
Morosidad** — lo que refuerza que ese defecto es del cálculo de esa pantalla, no de la configuración.

---

## 📊 Cierre del Bloque 7 · CONFIGURACIÓN

| Caso | Marca |
|---|---|
| DWX-CFG-001 Datos Empresa (carga) | `WEB-OK` |
| DWX-CFG-002 VG Empresa (54 variables) | `WEB-OK` |
| DWX-CFG-003 VG Clientes (27 variables) | `WEB-OK` |
| DWX-CFG-002-Y contraste con el YAML **23/23** | `WEB-OK` |
| DWX-CFG-002-D `clientsOrderBy`: perfil `na_client` vs web `co_client` | `WEB-OK` (corregir el YAML) |
| DWX-CFG-004 Usuarios (20) · Dispositivos · Supervisores (1) · Licencias | `WEB-OK` |
| DWX-CFG-004-X Licencias/Dispositivos vacíos con actividad real | `WEB-N/A` |
| DWX-CFG-005 catálogos 7/7 | `WEB-OK` |
| **DWX-CFG-005-A la config explica el defecto móvil `DM-VIS-020`** | `WEB-OK` (hallazgo) |
| DWX-CFG-005-C motivos sin código · categoría placeholder · feriados vacío | `WEB-N/A` |
| DWX-CFG-006 log de errores: **0 registros** | `WEB-OK` |
| **DWX-CFG-006-R ruta del guión da 404 — corregida** | `WEB-OK` (corregir el guión) |
| DWX-CFG-007 8 pantallas extra descubiertas | `WEB-OK` |
| DWX-CFG-008 `/pages/modulos` confirma `multiCurrencyOrder=false` | `WEB-OK` |

**⛔ 0 BLOCKED · 0 escrituras · 0 clics en pantallas de configuración.**

---
---

# 🎯 RESUMEN FINAL — Bloques 5, 6 y 7

## Recuento por marca (este agente)

| Marca | Casos |
|---|---:|
| `WEB-OK` | **27** |
| `WEB-FIELD-MISMATCH` (defecto) | **8** |
| `WEB-CALC-MISMATCH` (defecto) | **4** |
| `WEB-N/A` | **2** |
| `⛔ BLOCKED` | **0** |
| **Total** | **41** |

**Por bloque:** visitas 13 · estructura comercial 14 · configuración 14.
**Defectos: 12.** Ledger acumulado de la corrida: **83 líneas** (42 del agente de los bloques 1-4 + 41 míos).

## 🔴 Cuántos `WEB-N/A` por falta de BD: **2 de 41 (4,9 %)**

| Caso | Qué no pude afirmar | Cómo cerrarlo |
|---|---|---|
| DWX-CFG-004-X | si `Licencias`/`Dispositivos` **deberían** tener filas | mirarlo a mano (no pulsé `Buscar`: pantalla de configuración) |
| DWX-CFG-005-C | si los motivos de devolución **deberían** traer código | `SELECT co_motive FROM return_motive` |

⚠ **El hueco fue todavía menor que en los bloques 1-4** (allí 6 de 42). **Los 12 defectos salieron íntegros
de contradicciones internas y aritmética**, sin una sola consulta SQL. Y en dos casos la falta de BD
**no impidió cerrar** lo que estaba abierto: el Bloque 6 cerró **2 `WEB-N/A` del Bloque 1** usando otra
pantalla de la propia web como oráculo.

## 🔍 Los 3 defectos de confirmación cruzada — resultado en **mis** pantallas

| # | Defecto de La Tortuga | En mis pantallas de Isla Coche |
|---|---|---|
| **1** | `Limpiar` no restablece los desplegables | ❌ **NO se reproduce.** `/pages/visitas`: partiendo de `Estatus="No visitado"`, un `Limpiar` devolvió los **9** desplegables a su valor neutro con **label y `<select>` sincronizados en 9/9**, y el `Buscar` posterior dio 215 (coherente). **Segunda pantalla independiente que lo desmiente** |
| **2** | `Limpiar` cambia la EMPRESA | ⚪ **N/A estructural, confirmado por segunda vez.** `idEnterprise` tiene **una sola opción** (`LATINOCOSMETICA C.A.`) en **todas** mis pantallas. No hay a dónde saltar. **No se forzó** |
| **3** | El ordenamiento no reordena | ❌ **NO se reproduce.** `form:tablaVisit`: `Ref` asc (`1,2,3,3,4,5,6,6,…`) y desc (`209,208,207,…`) — **numérico, no lexicográfico** — y `Vendedor` asc alfabético. Las filas **sí** se movieron |

🔑 **Conclusión reforzada:** los 3 defectos de filtros/orden **no se manifiestan en Isla Coche**, ahora
verificado en **2 familias de pantallas distintas** (reportes por el otro agente, visitas por mí).
**Son propios de La Tortuga**, no de la versión.

🔴 **Pero encontré un defecto de filtro DISTINTO y sí reproducible acá** (`DWX-VIS-005`): el desplegable
`Coordenadas` de visitas **da dos respuestas incompatibles sobre las mismas filas**. O sea: *"los filtros
de esta versión no están rotos en general, pero este filtro concreto sí lo está"*. Es un matiz que
importa para desarrollo.

## 💥 Cálculos que NO cuadraron — con sus dos números

| # | Dónde | Número A | Número B | Diferencia |
|---|---|---:|---:|---|
| **1** | **Plan de Venta**, `Presupuestado` por agrupamiento | **403.212** (por Marca) | **0** (por Empresa y por Categoría) | **el total entero** |
| **2** | **Cuota de Venta**, `Presupuestado` por agrupamiento | **390.004** (por Marca) | **0** (por Empresa y por Canal) | **el total entero** |
| **3** | **Cumplimiento de Cuota**, cuota de BELOTTI | **65.400** (pantalla de cuota) | **0** (el reporte) | 65.400 |
| | ídem PROKPIL | **311.000** | **0** | 311.000 |
| | ídem ROIAL | **13.604** | **0** | 13.604 |
| **4** | **Cumplimiento**, `% Cumplimiento` con cuota 0 | **100 %** (mostrado) | indefinido (división por 0) | — |
| **5** | **Canales de Distribución**, clientes de DETAL | **722** (contador) | **12** (su propio `Consultar clientes`) | **× 60** |
| **6** | **Visitas**, filas con `Geo = No Realizado` | **90** (en la tabla) | **0** (su propio filtro) | **90** |
| **7** | **Visitas**, filtro `Por Revisar` | **215** (devuelve todo) | debería ser un subconjunto | **no filtra** |

**Cálculos que SÍ cuadraron exactos** (vale registrarlos): itinerario 209 == lista 209 ·
partición Estatus 125+90 == 215 · plan Σ 403.212 == `Presupuestado` y 617.212−403.212 == `Diferencia` ·
cuota Σ 390.004 == `Presupuestado` y 617.212−390.004 == `Diferencia` · estructura 4+13 == 17.

## ⛔ Qué quedó BLOCKED

**Nada.** Las **28 pantallas** que abrí cargaron y se pudieron leer. Ningún techo de 2 intentos se agotó.

## 🔒 Bloque 7 — ¿hubo alguna pantalla donde preferí no entrar?

**Sí, una, y varias acciones que deliberadamente no ejecuté:**

1. ⛔ **`/pages/protected/cambiarClave.xhtml` — NO la abrí.** Apareció en el menú y `WEB-RUNTIME §0` prohíbe
   explícitamente `Cambiar Clave`. Es la única pantalla del sitio que decidí **no visitar**.
2. ⛔ **No pulsé `Buscar` ni `Limpiar` en ninguna pantalla de configuración**, aunque son lecturas.
   Costo: `DWX-CFG-004-X` quedó en `WEB-N/A` en vez de resolverse. **Lo prefiero así**, y lo dejo anotado
   para que QA lo cierre a mano en medio minuto.
3. ⛔ **No toqué nada en `variablesConfiguracion`** — 58 inputs, 45 desplegables y un `Guardar` sin
   confirmación, en una pantalla que gobierna el comportamiento de la app de un cliente productivo.
   Leí los 54 valores del DOM, que es todo lo que hacía falta.
4. ⛔ En `presupuestoVenta` / `presupuestoCuota` **no toqué `Agregar presupuesto`, `Eliminar` ni
   `Cargar Plan Venta`**; solo `Consultar productos`, que es lectura.
5. ⛔ En `/pages/usuarios` **no toqué `Generar Clave`, `Editar` ni `Eliminar`**.

**Balance: 0 escrituras, 0 clics en pantallas de configuración, 0 cambios en producción.**

## 🥇 Qué revisaría primero (de mis 12 defectos)

1. **🔴🔴 El filtro `Coordenadas` de visitas (`DWX-VIS-005`).** `No Realizado` devuelve **0** cuando la
   propia tabla muestra **90** filas con ese valor, y `Por Revisar` devuelve el **100 %** sin filtrar.
   Es la herramienta con la que un supervisor audita si el vendedor estuvo donde dijo, y **deja invisibles
   justo las 90 visitas no realizadas**. Reproducible, revalidado en vista limpia.
2. **🔴🔴 El mapa del Rutero no se dibuja (`DWX-VIS-002-M`).** Toda la pantalla existe para un mapa y queda
   un recuadro blanco de 741×571 px, **sin ningún mensaje**, por un `setCenter` con `lat: NaN`.
   **Aislado:** `/pages/mapaRutas` sí dibuja con la misma API y sesión ⇒ es el cálculo del centro.
3. **🔴 El total presupuestado cambia según cómo se agrupe (`DWX-EST-004-G` / `005-G`).**
   403.212 vs **0**, y 390.004 vs **0**. Agrupar por **Empresa** —la agrupación más gruesa— devuelve cero.
4. **🔴 `Cumplimiento de Cuota` lee la cuota como 0 y canta 100 % (`DWX-EST-006-C` / `006-P`).**
   Toca dinero y evaluación de vendedores: **dice que se cumplió al 100 % una cuota que él mismo declara
   inexistente**. Y la misma app resuelve bien la división por cero en `reporteActivacionClientes`.
5. **🔴 `reportePlanCuota` vacío con el plan cargado (`DWX-EST-007`).** Su reporte gemelo, con la misma
   clasificación y el mismo rango, sí devuelve 4 filas.
6. **🔴 Canales: 722 en el contador, 12 al pulsar su propio botón (`DWX-EST-003`).**
7. **🔴 Los 3 iconos del Rutero dan 404 (`DWX-VIS-002-I`)** — context path `/denario/` en vez de
   `/DenarioPremium/`, doble barra **y** el archivo no existe en el despliegue.
8. **🔴 6 estados de Venezuela con el nombre corrupto (`DWX-EST-002-E`)** — 36 de 200 celdas.

## 💎 Dos hallazgos que no son defectos pero valen

- **`DM-VIS-020` queda explicado** (`DWX-CFG-005-A`): la firma de visitas está habilitada por VG pero
  **ninguna de las 11 actividades la marca como requerida**. Es configuración, no bug de la app.
- **El perfil `latino_cosmetica.yaml` sigue vigente pese a la migración de playa**: **23/23** VGs
  contrastables coinciden. Solo hay que **corregir `clientsOrderBy` a `co_client`** y **añadir la
  distancia máxima de 50 m**, que es la que genera los 28 `Fuera de Rango`.

## ⚠️ Falsos positivos evitados (y cómo)

| Casi reporto… | Qué lo desmontó |
|---|---|
| *"El itinerario pierde 6 visitas"* (209 vs 215) | **Agrupar por `# Ref`**: 6 visitas traen 2 actividades ⇒ 2 filas. La regla del prompt funcionó |
| *"El Rutero muestra 5 puntos para 6 visitas"* | Las 5 imágenes son la **leyenda** de dos diálogos ocultos: **siempre 5**, para cualquier vendedor y fecha |
| *"El Plan de Venta no tiene detalle"* | El desplegable **`Parámetro` neutro no agrupa nada** — la lección que dejó el agente de los bloques 1-4. Con `Marca` aparecen las 4 filas |
| *"El `Presupuestado` es 3× la suma de las filas"* | Mi lector **deduplicaba `th` por nombre** y la tabla repite `Inicial`/`Actual` **12 veces** (una por mes). El ×3 eran los 3 meses |
| *"La estructura de productos tiene 3 huérfanos"* | `Estructura padre` guarda el **nombre**, no el código |
| *"El filtro `No Realizado` está roto"* (1ª medición) | El **estado JSF sobrevivió** y arrastraba `Estatus=Visitado`. **Se remidió limpio y el defecto se confirmó igual** — pero por poco no se reporta con el argumento equivocado |

## 🧰 Patrones y selectores nuevos → propuestos para `web-selectors/` y `WEB-RUNTIME.md`

1. 🔴 **Un panel de `selectOneMenu` cerrado con `Escape` sigue interceptando clics** (queda con
   `ui-connected-overlay-exit-active`) y hace fallar el `Buscar` siguiente con timeout de 30 s. **Igual que
   el `.ui-columntoggler`.** Solución que usé en toda la corrida, antes de cada clic:
   ```js
   document.querySelectorAll('.ui-selectonemenu-panel,.ui-datepicker,.ui-columntoggler')
     .forEach(p => { p.style.display='none'; p.classList.add('ui-helper-hidden'); });
   ```
2. 🔴 **`leerTabla()` deduplica encabezados por nombre y eso rompe las tablas de meses.** `tablaPlan`
   tiene 3 filas de `thead` y repite `Inicial`/`Actual` **12 veces** (una por mes, `colspan=2`).
   **Regla: si `thead` tiene más de una fila, mapear por posición, no por nombre.**
3. 🔴 **Los `data-label` traen doble espacio** (`00013 - NIULKA  CASTILLO`, `00022 - CESAR  SALAS`) →
   **buscar siempre con `\s+`**, nunca con espacio literal. Me costó 2 intentos fallidos.
4. **`/pages/itinerario` NO es una tabla, es un FullCalendar** — `tablasVisibles()` devuelve `[]`.
   Leer con `td.fc-daygrid-day[data-date]` + `.fc-event`; los eventos vienen como
   `"<código vendedor> | <N> Visitas"`.
5. **Mismo campo, widget distinto según la pantalla:** el vendedor es `selectOneMenu` en
   `rutero.xhtml` y **`selectCheckboxMenu`** en `/pages/mapaRutas`
   (`.ui-selectcheckboxmenu-trigger` → `li.ui-selectcheckboxmenu-item` → `.ui-chkbox-box`).
   **Nunca asumir el tipo de widget por el nombre del id.**
6. **Los desplegables neutros no agrupan** — ya visto en `clasificacion`, confirmado en **`parametros`**
   (detalle de plan) y **`opciones`** (detalle de cuota). ⚠ Y **los dos detalles gemelos usan nombres de
   control distintos**: `[id$=":parametros"]` en el plan, `[id$=":opciones"]` en la cuota.
7. **Botón `Buscar` en visitas = `[id$=":btnBuscar"]`** (no `:ajax`) y el vacío es **`"No existe registro"`**.
   En reportes y en `/pages/clientes` sí es `[id$=":ajax"]` y `"No se encontraron registros."`.
   **Conviven las dos convenciones en el mismo sitio.**
8. **Para resolver una ruta dudosa, leer los `href` del menú** (`a[href]` en `/pages/main`, 57 enlaces):
   resolvió el 404 de `DWX-CFG-006` y descubrió **8 pantallas** que el guión no lista.
9. **`Total de Resultados:` también existe en `/pages/visitas`** — es el contador page-size-independent y
   **evita por completo** la trampa de comparar conteos con paginaciones distintas.
10. **Detectar mojibake de forma fiable:** buscar `U+FFFD` en el DOM y contrastar con
    `document.characterSet`. Distingue "la página está mal codificada" de "mi transporte rompió el texto".
11. **Marcadores rotos:** `img.naturalWidth === 0` es la prueba dura de un icono 404 —
    y verificar la URL con `page.request.get()` **en los dos context paths** antes de culpar a la ruta.

## 📝 Correcciones que propongo a los archivos del proyecto

| Archivo | Corrección |
|---|---|
| `automation/web/smoke-web/smoke-web-extendido.md` | `DWX-CFG-006`: la ruta correcta es **`/pages/protected/administracion/erroresAplicacion/erroresAplicacion.xhtml`** (la del guión da 404). Añadir al bloque 7 las **8 pantallas** descubiertas |
| `automation/clientes/latino_cosmetica.yaml` | `clientsOrderBy: co_client` (no `na_client`) · añadir **`distanciaMaximaMetros: 50`**, `decimales: 2`, `mesesHistorico: 3`, `pesoMaxImagenMB: 30`, `maxCaracteresComentario: 200`, `lineaDestacados: "DESTACADOS"`, `productValorLabel: "Kg"`, `rolPromotor: true`, `rolPlanta: true`, `expiracionClaveDias: 0` |
| `automation/web/web-helpers.js` | `leerTabla()`: mapear por posición cuando `thead` tenga más de una fila (ver patrón 2) |
| `automation/web/web-selectors/_comunes.md` | patrones 1, 3, 5, 6, 7 |

---

*Bloques 5-7 · 41 casos · 12 defectos · 0 BLOCKED · 0 escrituras · sin BD · READ-ONLY · 2026-07-31*
