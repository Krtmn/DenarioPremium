# REGRESIÓN WEB — verificación de fixes · globalmp · LA TORTUGA

**RUN_ID:** `20260803_115125_regresion`
**Fecha de la verificación:** 03/08/2026
**Base:** `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Empresa de referencia:** **00002 COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.**
**Reporte de origen de los defectos:** `automation/reports/smoke_globalmp_20260730_094753/web.md` (30/07/2026)
**Alcance:** verificación de 2 defectos reportados el 30/07 + grupo de control. **READ-ONLY, producción.**

---

## 0 · Versión / build que reporta la web

🔴 **La web NO expone versión ni build de la aplicación.** Verificado en el login y en `/pages/main`:
no hay pie de página con versión, no hay "Acerca de", no hay comentario HTML ni cabecera HTTP con la build.
Lo único que rotula el pie es `Powered by kiberno ©2026 www.denario.net`.

Como sustituto se tomó la **huella de despliegue** (`Last-Modified` de los recursos estáticos servidos por
Tomcat, que conservan la fecha de las entradas del WAR):

| Recurso | Propiedad | `Last-Modified` |
|---|---|---|
| `common.css` (`ln=css`) | **de la aplicación** | **Thu, 16 Jul 2026 17:25:16 GMT** |
| `iconosinternos/style.css` | de la aplicación | Tue, 23 Sep 2025 14:53:52 GMT |
| `iconosinternosmap/style.css` | de la aplicación | Tue, 23 Sep 2025 14:53:52 GMT |
| `icono-negro.png` (`ln=imagenes`) | de la aplicación | Tue, 23 Sep 2025 14:53:52 GMT |
| `core.js`, `theme.css` | PrimeFaces **11.0.0** (librería) | 23 Sep 2025 |

- Stack: **JSF + PrimeFaces 11.0.0**, tema `primefaces-rain-cyan-light`.
- El recurso propio más nuevo del despliegue data del **16/07/2026**; el resto, del **23/09/2025**.
- ⚠ **Ningún artefacto del despliegue es posterior al 30/07/2026**, fecha en que se reportaron los defectos.
  Es un indicio fuerte —no una prueba— de que **este servidor no recibió un redespliegue después del reporte**.
  El veredicto real se da abajo, sobre el comportamiento observado.

**Recomendación para desarrollo:** exponer versión/build en el pie o en un "Acerca de". Hoy es imposible
saber, desde la web, contra qué compilación se está probando.

---

## 1 · DEVOLUCIONES

**Contexto verificado:** host `denariolatortuga.ddns.net:8080` · `/pages/devoluciones` · empresa
**00002 GLOBAL M&P** (`idEnterprise_input value=2`). Formulario de filtros **`form:j_idt114`**
(⚠ cambió respecto del 30/07, que era `form:j_idt116`).

**Baseline:** el rango de fechas por defecto es **01/08/2026 – 03/08/2026** y en esa ventana **no hay
devoluciones**. Se amplió a **01/01/2026** → **5 filas**: Refs `169 · 168 · 167 · 166 · 165`, las 5 "Enviado".
Ése es el universo completo de devoluciones 2026 de la empresa 00002.

### FIX 1a — `Limpiar` restablece los desplegables · ✅ **ARREGLADO**

| Paso | `Status` (`orderStatus`) | `Tiene Adjunto` (`attachStatus`) |
|---|---|---|
| Valor puesto | `Por aprobar` → `value=13`, label "Por aprobar" | `NO` → `value=2`, label "NO" |
| `Buscar` con el filtro | **0 filas** ("No se encontraron registros.") | **1 fila** (Ref 169) |
| **`Limpiar`** → label visible | **"Status"** ✅ | **"Tiene Adjunto"** ✅ |
| **`Limpiar`** → `value` del `<select>` oculto | **`0`** ✅ | **`0`** ✅ |
| `Buscar` revalidando sobre vista nueva | **5 filas** `169·168·167·166·165` ✅ | **5 filas** `169·168·167·166·165` ✅ |

🔑 **Se verificó el widget Y el bean, no solo el conteo.** El riesgo real era que el control se viera
reseteado y el backend siguiera filtrando; por eso tras cada `Limpiar` se reamplió la fecha y se volvió a
`Buscar`: **vuelven las 5 filas**, o sea el filtro se soltó de verdad en el servidor.
⚠ Detalle operativo: `Limpiar` **también resetea el rango de fechas** al de por defecto (01/08–03/08), que en
este módulo devuelve 0 filas. Sin reampliar la fecha, un verificador vería "0 filas" y concluiría, falsamente,
que `Limpiar` no funciona. **Ese es exactamente el falso positivo que había que evitar.**

### FIX 1b — `Limpiar` NO toca la empresa · ✅ **SIGUE OK** (grupo de control)

Tras **ambos** `Limpiar`, `idEnterprise_input` siguió en **`value=2` / "COMERCIALIZADORA DE ALIMENTOS
GLOBAL M&P, C.A."**. No hubo salto a 00001. Confirmado que en devoluciones el `<select>` de Empresa
**no tiene opción neutra** (solo `1` y `2`), igual que el 30/07.

### FIX 2 — Ordenamiento · ✅ **ARREGLADO**

Probadas **las 5 columnas ordenables, en ambos sentidos**, con espera de 3 s y lectura de las filas reales
(no solo del `aria-sort`):

| Columna | Ascendente | Descendente | Veredicto |
|---|---|---|---|
| **`# Ref`** | `165·166·167·168·169` | `169·168·167·166·165` | ✅ **reordena** (fallaba el 30/07) |
| **`Cliente`** | ABASTO EL SITIO ×2 · ABASTOS Y FRUTERIA · AUTOMERCADO · EMPRENDIMIENTO (refs `166·169·167·168·165`) | orden inverso (`165·168·167·166·169`) | ✅ **reordena** (fallaba el 30/07) |
| **`Fecha Devoluciòn`** | 15/07 · 27/07 · 30/07 10:30 · 10:32 · 11:05 | inverso | ✅ **reordena** (fallaba el 30/07) |
| `Vendedor` | DARLING ARAUJO primero, luego YUSNEIDI ×4 | inverso | ✅ reordena |
| `Estatus` | sin cambio | sin cambio | ⓘ **no concluyente**: las 5 filas tienen el mismo valor ("Enviado"), no hay nada que reordenar. No es defecto |

ⓘ El typo del encabezado **`Fecha Devoluciòn`** (acento grave) **sigue presente**. No estaba entre los 2
defectos a verificar; se deja anotado.

**Casos:** `REG-LIMP-SEL-DEV-001` ✅ · `REG-LIMP-EMP-DEV-002` ✅ · `REG-ORD-DEV-003` ✅

---

## 2 · INVENTARIOS

**Contexto verificado:** host `denariolatortuga.ddns.net:8080` · `/pages/inventarios` · empresa
**00002 GLOBAL M&P** (`idEnterprise_input value=2`). Formulario de filtros **`form:j_idt114`**
(mismo sufijo que devoluciones hoy). Tabla de datos: **`form:pedidosDT`** ⚠ (se llama `pedidosDT`
aunque el módulo sea inventarios — no confundir con el datatable de `/pages/pedidos`).

**Baseline:** rango por defecto **01/08/2026 – 03/08/2026** → **0 filas**. Ampliado a **01/01/2026** →
**5 filas**: Refs `105 · 104 · 103 · 101 · 100`. Ése es el universo completo de inventarios 2026 de la 00002.

| Ref | Fecha creación | Vendedor | Cliente | Estatus |
|---|---|---|---|---|
| 105 | 30/07/2026 13:00:33 | YUSNEIDI CLEMENTE | ABASTO, FRUTERIA Y CHARCUTERIA YOSELIN | Enviado |
| 104 | 30/07/2026 11:30:11 | YUSNEIDI CLEMENTE | ABASTO EL SITIO DSG | Enviado |
| 103 | 30/07/2026 10:38:54 | YUSNEIDI CLEMENTE | ABASTO EL SITIO DSG | Enviado |
| 101 | 27/07/2026 16:44:53 | YUSNEIDI CLEMENTE | ABASTO EL SITIO DSG | Enviado |
| 100 | 12/02/2026 09:15:38 | TADDYS TORRES | PROCESADORA DE CARNE BURGER HOUSE | Enviado |

🔑 **Composición del dato (importante para leer el ordenamiento):** `Estatus` tiene **el mismo valor en las
5 filas** ("Enviado") y `Vendedor` tiene **un solo valor repetido 4 veces** + 1 distinto.

### FIX 1a — `Limpiar` restablece los desplegables · ✅ **ARREGLADO**

| Paso | `Status` (`orderStatus`) | `Tiene Adjunto` (`attachStatus`) |
|---|---|---|
| Valor puesto | `Por aprobar` → `value=14`, label "Por aprobar" | `NO` → `value=2`, label "NO" |
| `Buscar` con ambos filtros | **0 filas** ("No se encontraron registros.") — correcto: las 5 son "Enviado" | |
| **`Limpiar`** → label visible | **"Status"** ✅ | **"Tiene Adjunto"** ✅ |
| **`Limpiar`** → `value` del `<select>` oculto | **`0`** ✅ | **`0`** ✅ |
| `Buscar` revalidando sobre vista nueva | **5 filas** `105·104·103·101·100` ✅ | idem ✅ |

🔑 **Widget Y bean verificados**, y revalidado con un `Buscar` nuevo: el filtro se soltó **en el servidor**,
no solo en pantalla.
⚠ Igual que en devoluciones, `Limpiar` **también resetea el rango de fechas** a 01/08–03/08, que acá devuelve
**0 filas**. Sin reampliar la fecha se vería "0 filas" y se concluiría falsamente que `Limpiar` no funciona.

### Control — `Limpiar` NO toca la empresa · ✅ **SIGUE OK**

Tras `Limpiar`, `idEnterprise_input` siguió en **`value=2` / GLOBAL M&P**. No hubo salto a 00001.
El `<select>` de Empresa en inventarios **no tiene opción neutra** (solo `1` y `2`), igual que el 30/07.

### FIX 2 — Ordenamiento · ✅ **ARREGLADO**

Probadas **las 5 columnas ordenables** (según `form:pedidosDT_reflowDD`: `Vendedor`, `Cliente`, `# Ref`,
`Estatus`, `Fecha creación`), **en ambos sentidos**, con espera de 3 s y lectura de las **filas reales**.

| Columna | Ascendente | Descendente | Veredicto |
|---|---|---|---|
| **`# Ref`** | `100·101·103·104·105` | `105·104·103·101·100` | ✅ **reordena** (fallaba el 30/07) |
| `Fecha creación` | 12/02 · 27/07 · 30/07 10:38 · 11:30 · 13:00 | inverso exacto | ✅ reordena (ya funcionaba) |
| `Cliente` | ABASTO,FRUTERIA(105) · EL SITIO ×3 · PROCESADORA(100) | inverso exacto (`100·104·103·101·105`) | ✅ **reordena** |
| `Vendedor` | TADDYS(100) primero, YUSNEIDI ×4 | TADDYS(100) último | ✅ reordena |
| `Estatus` | sin cambio de filas | — | ⓘ **no concluyente**: las 5 filas dicen "Enviado" |

🔑 **Evidencia directa de que `# Ref` NO está atada al id del pedido relacionado.** Hoy no puede estarlo:
**el inventario 104 no tiene pedido relacionado** (el propio reporte del 30/07 lo verificó: el 104 no generó
pedido; el 105 sí, el 15168). Si la columna estuviera atada a ese id, el 104 —sin valor— caería en un
**extremo** del orden. En el ascendente el 104 aparece **en su posición numérica exacta, entre el 103 y el
105**. Ordena por el Nro. de Ref real.

⚠ **CORRECCIÓN DE ATRIBUCIÓN — importante.** La tesis del «`# Ref` atada al id del pedido relacionado»
**no es un hallazgo de la_tortuga del 30/07**: es de **latino_cosmetica / Isla Coche, del 29/07**
(`smoke_latino_cosmetica_20260729_133234/web.md`, DEFECTO 3), donde está **muy bien demostrada** sobre
**18 filas de las cuales 17 tenían el pedido relacionado nulo** (patrón NULLS-LAST/FIRST: solo se movía la
Ref 15, la única con pedido). **En el reporte de la_tortuga del 30/07 lo único que consta sobre esta columna
son 2 líneas sin evidencia** («ordenamiento mixto: `Fecha creación` ✅ · `# Ref` ❌», líneas 173 y 260) —
sin columnas probadas, sin conteo de filas y sin las secuencias de Refs. Ver el apartado **5.0**.

⚠ **Detalle a registrar sobre `Cliente`:** el ascendente puso `ABASTO, FRUTERIA…` **antes** de
`ABASTO EL SITIO…`. En ASCII puro el espacio (32) precede a la coma (44), así que sería al revés; es una
**collation lingüística del motor de BD**, no un fallo de ordenamiento. El descendente es el inverso exacto
del ascendente, que es la prueba que importa.

**Casos:** `REG-LIMP-SEL-INV-004` ✅ · `REG-LIMP-EMP-INV-005` ✅ · `REG-ORD-INV-006` ✅

---

## 3 · CLIENTES POTENCIALES

**Contexto verificado:** host `denariolatortuga.ddns.net:8080` · `/pages/clientesPotenciales` · empresa
**00002 GLOBAL M&P**. Formulario de filtros **`form:j_idt114`** · tabla **`form:pedidosDT`** ·
toggler `form:pedidosDT:togglerPotentialClients`.

**Baseline:** rango por defecto **01/08/2026 – 03/08/2026** → **0 filas**. Ampliado a **01/01/2026** →
**50 filas / 2 páginas** (Refs `184 · 183 · 180 · 179 · 178 · 177 · 176 · 174 …` hasta `128`).
Universo de Refs observado: **83 … 184**. Es el módulo más cargado de los verificados.

⚠ **Este módulo NO tiene filtro `Status`** — sus desplegables son `Empresa`, `Vendedor` y `Tiene Adjunto`.
🔑 El `<select>` de Empresa acá usa **`value="00001"` / `"00002"`** (cadena con ceros a la izquierda), **no**
`1` / `2` como devoluciones e inventarios. **Tampoco tiene opción neutra.**

### FIX 1a — `Limpiar` restablece `Tiene Adjunto` · ✅ **ARREGLADO** (2/2)

### FIX 1b — `Limpiar` NO cambia la empresa · ✅ **ARREGLADO** (2/2)

Ambos se verificaron en la misma maniobra, dos veces, con juegos de filtros distintos:

| | Pasada 1 | Pasada 2 |
|---|---|---|
| Filtros puestos | `Tiene Adjunto = NO` (`value=2`) | `Vendedor = LOURDES ALFONZO` (`336`) + `Tiene Adjunto = SI` (`value=1`) |
| `Buscar` con filtro | **12 filas** (de 50+) | **33 filas**, todas de `LOURDES` |
| **`Limpiar`** → `Tiene Adjunto` | label **"Tiene Adjunto"** · `value=0` ✅ | label **"Tiene Adjunto"** · `value=0` ✅ |
| **`Limpiar`** → `Vendedor` | label **"Vendedor"** · `value=""` ✅ | label **"Vendedor"** · `value=""` ✅ |
| **`Limpiar`** → **Empresa** | **`00002` GLOBAL M&P** ✅ *(no saltó a 00001)* | **`00002` GLOBAL M&P** ✅ |
| Listado tras `Limpiar` | **50 filas de GLOBAL M&P** (Refs 183·184·134·135…, cliente `Test-CLT-SMOKE-103002`) | **50 filas**, **6 vendedores distintos** (YUSNEIDI · YERZON · USMAR A · TADDYS · PITTER · LOURDES) |
| `Buscar` revalidando | **50 filas / 2 páginas**, empresa `00002` ✅ | — |

🔑 **La prueba de que el filtro se soltó en el SERVIDOR, no solo en pantalla:** en la pasada 2, antes de
`Limpiar` el listado tenía **un solo vendedor** (LOURDES); después vuelven **seis**. Y el listado **sigue
siendo de GLOBAL M&P** en las dos pasadas: no hay salto de empresa ni sustitución silenciosa del conjunto.

⚠ **CORRECCIÓN — la línea base del 30/07 para este módulo NO EXISTE.** El encargo describía que el 30/07
`Limpiar` cambiaba la empresa y el listado pasaba de «50 filas de GLOBAL M&P a 8 de la otra empresa».
**Esa cifra no aparece en ningún reporte.** En `smoke_globalmp_20260730_094753/web.md` la cadena
«clientes potenciales» aparece **una sola vez, en la fila 263 de la tabla-síntesis** (`❌ no | 🔴 sí | ❌ roto`):
**no hay sección del módulo, ni conteos, ni Refs, ni columnas probadas.** El único «50 filas de la otra
empresa» documentado ese día es el de **VISITAS** (`DW-VIS-H01`, y es 50 → 50, no 50 → 8).
⇒ Lo verificado hoy **es la primera medición real de esta página en la_tortuga**. Ver el apartado **5.0**.

⚠ **Diferencia de comportamiento entre módulos que conviene registrar:** acá `Limpiar` deja el rango de fechas
**vacío** (`dateB` y `dateF` = `""`), mientras que en devoluciones e inventarios lo deja en el **rango por
defecto de 3 días**. Con las fechas vacías el listado igual se repuebla con las 50 filas. No es defecto, pero
significa que **la trampa del "0 filas tras Limpiar" no se manifiesta en este módulo**.

### FIX 2 — Ordenamiento · ✅ **ARREGLADO** (3/3 columnas)

Este módulo tiene **solo 3 columnas ordenables** (`form:pedidosDT_reflowDD`: `Vendedor`, `# Ref`, `Fecha`);
`Rif. Cliente`, `Cliente` y `Responsable` **no son ordenables** (no llevan `ui-sortable-column`).
Probadas las 3 en ambos sentidos, esperando 4 s y leyendo las **filas reales**:

| Columna | Ascendente (pág. 1) | Descendente (pág. 1) | Veredicto |
|---|---|---|---|
| **`# Ref`** | `83·84·91·95·98·103·107·108…` → termina en `152` | `184·183·180·179·178·177…` → termina en `128` | ✅ **reordena** |
| **`Fecha`** | 19/02 15:43:10 · 19/02 15:43:19 · 11/03 · 30/03 · 14/04 … | 30/07 · 27/07 · 23/07 10:14 · 23/07 09:06 · 21/07 … | ✅ **reordena** |
| **`Vendedor`** | ALEXANDER · KIMBERLIN ×4 · LOURDES … · PITTER · TADDYS · USMAR A | YUSNEIDI · YERZON · USMAR A · TADDYS · PITTER · LOURDES | ✅ **reordena** |

🔑 **El cambio es masivo y no puede confundirse con un empate:** en `# Ref` ascendente **la página 1 entera se
reemplaza** (entra el bloque `83…152`, sale el bloque `128…184`). El 30/07 se reportó que «el indicador
cambiaba pero las filas no». Hoy las filas cambian, en las 3 columnas y en los dos sentidos.

ⓘ En `Fecha` descendente, las Refs `177` y `176` **comparten timestamp exacto** (`16/07/2026 12:11:26`, mismo
cliente `INVERSIONES DAYMAYOR C.A`) y su orden relativo entre sí varía. Es un **empate legítimo**, no un fallo.

**Casos:** `REG-LIMP-SEL-CPO-007` ✅ · `REG-LIMP-EMP-CPO-008` ✅ · `REG-ORD-CPO-009` ✅

---

## 4 · GRUPO DE CONTROL — lo que ya funcionaba el 30/07

### 4.1 · PEDIDOS · ✅ **SIGUE OK** (los dos controles)

**Contexto:** `/pages/pedidos` · empresa **00002** (`value="00002"`) · filtros **`form:j_idt115`** ⚠ (otro
sufijo que devoluciones/inventarios/clientes potenciales, que usan `j_idt114`) · tabla `form:pedidosDT`.
**Baseline:** rango 01/07–03/08/2026 → **50 filas / 10 páginas**, Refs `15168 · 15167 · 15165 …`.

| Control | Evidencia | Veredicto |
|---|---|---|
| `Limpiar` resetea los desplegables | `Status`=`Por aprobar`(11) + `Tiene Adjunto`=`NO`(2) → **0 filas**. Tras `Limpiar`: ambos en placeholder con **`value=0`**; reampliando fecha y buscando vuelven **50 filas / 10 páginas** | ✅ |
| `Limpiar` no toca la empresa | Antes y después: **`00002` GLOBAL M&P** | ✅ |
| El ordenamiento reordena | `# Ref` asc → **`12597·12598·12599·12600…`** (baseline `15168…`) · `Monto Total` asc → **`2,97 · 2,97 · 2,97 · 2,97 · 3,13 · 3,13 · 3,13 · 3,50`** | ✅ |

🔑 `Monto Total` ordena **numéricamente**, no como texto — se verificó a propósito por ser columna de importes.
ⓘ En pedidos solo son ordenables `# Ref`, `Fecha creación`, `Fecha envío`, `Monto Base` y `Monto Total`;
`Estatus`, `Vendedor` y `Cliente` **no** llevan `ui-sortable-column`.
ⓘ El filtro `Status` **sí filtra** en pedidos (dio 0 filas) — a diferencia de cobros (`DW-COB-H03`).

### 4.2 · VISITAS · ✅ **SIGUE OK** en los controles pedidos · 🔴 **1 defecto nuevo** (ver 4.3)

**Contexto:** `/pages/visitas` · filtros **`form:j_idt115`** · tabla **`form:tablaVisit`** ·
Buscar **`[id$=":btnBuscar"]`**. Baseline 01/07–03/08 → **50 filas / 10 páginas**, Refs `574865 · 574864 …`.

| Control | Evidencia | Veredicto |
|---|---|---|
| `Limpiar` resetea los desplegables | `Estatus`=`No visitado`(3) + `Adjuntos`=`No Tiene Adjuntos`(2) → 50 filas **todas "No visitado"**. Tras `Limpiar`: ambos en placeholder `value=0`, y el listado pasa a **"visitado"** ⇒ soltado en el servidor | ✅ |
| El ordenamiento reordena | `Ref` asc → **`66191·66192·66193·66194…`** (baseline `574865…`) · `Vendedor` asc → **página 1 entera = ALEXANDER GONZALEZ** (Refs `573766…`) | ✅ |

### 🎉 DW-VIS-H01 (`Limpiar` saltaba la empresa a 00001) · ✅ **ARREGLADO** — 2/2

Este defecto **S1** del 30/07 no era parte del encargo, pero es el mismo fallo que en clientes potenciales,
así que se verificó. **No se reproduce en ninguna de las dos pasadas:**

| | Pasada 1 | Pasada 2 |
|---|---|---|
| Filtros | `Estatus`=No visitado + `Adjuntos`=No Tiene | `Actividad`=MERCHANDISING(47) + `Coordenadas`=Fuera de Rango(4) → **2 filas** (una es la `574864` de QA) |
| Empresa tras `Limpiar` | **`2` GLOBAL M&P** ✅ | **`2` GLOBAL M&P** ✅ |

🔑 El `<select>` de Empresa de visitas **sigue teniendo opción neutra** (`""=Seleccione Empresa`, `1`, `2`),
igual que el 30/07 — o sea **la estructura no cambió; cambió el comportamiento del reset**. El 30/07 el reset
«apuntaba al índice equivocado» y elegía 00001; hoy conserva la empresa seleccionada.

### 4.3 · 🔴 DEFECTO NUEVO — `Limpiar` NO restablece el desplegable `Coordenadas` de visitas · S2

**No es una regresión demostrable:** el reporte del 30/07 dice que en visitas «`Limpiar` SÍ resetea los selects»
pero solo deja constancia de haber probado `# Ref`, `Estatus`, `Actividad` y `Adjuntos`. **`Coordenadas` y
`Despachado` no figuran.** Es un defecto **no cubierto entonces**, detectado ahora.

**Prueba aislada (con `Coordenadas` como único filtro puesto), confirmada 2/2:**

| Paso | Observado |
|---|---|
| `Coordenadas` = `Fuera de Rango` (`value=4`) + `Buscar` | **50 filas, `Geo` = "Fuera de Rango" en todas** |
| **`Limpiar`** → `Coordenadas` | 🔴 **sigue en "Fuera de Rango" / `value=4`** — ni el widget ni el bean |
| **`Limpiar`** → los demás | `Estatus` → `0` ✅ · `Despachado` → `0` ✅ · `Actividad` → `""` ✅ · Empresa → `2` ✅ · fechas → vacías ✅ |
| Listado tras `Limpiar` | 🔴 **50 filas, `Geo` = "Fuera de Rango" en TODAS** ⇒ el filtro **sigue aplicado en el servidor** |

🔑 **Que los otros desplegables y las fechas SÍ se resetearan en la misma maniobra prueba que `Limpiar` se
ejecutó.** El problema es específico de `Coordenadas`.
🔑 **Pista sobre la causa:** `Coordenadas` es **el único desplegable del panel cuyo valor neutro es `-1`**
(`-1=Coordenadas`); los demás usan `0` (`Estatus`, `Adjuntos`, `Despachado`) o `""` (`Actividad`, `Motivo`,
`Vendedor`, `Cliente`, `Roles`). El reset simplemente **no lo alcanza**: queda en `4`, ni siquiera en `0`.
🔑 **Confirmación de que vive en el servidor y no en la pantalla:** el valor `4` **sobrevivió a un
`page.goto()`** completo de la página.

**Impacto:** el usuario pulsa `Limpiar`, ve el resto del panel en blanco y **cree estar viendo todas las
visitas, cuando sigue viendo solo las de una categoría de coordenada**. Es el mismo patrón de engaño
silencioso que el defecto de empresa que se acaba de arreglar.

**Pasos para reproducir:** VISITAS → `Coordenadas` = `Fuera de Rango` → `Buscar` → `Limpiar` → mirar el
desplegable `Coordenadas` y la columna `Geo` del listado.


### 4.4 · COBROS · ✅ **SIGUE OK**

**Contexto:** `/pages/cobros` · filtros **`form:j_idt116`** · tabla **`form:cobrosDT`** · empresa **00002**.
Baseline 01/07–03/08/2026 → **50 filas / 10 páginas**, Refs `8362 · 8361 · 8360 · 8359 · 8357 · 8356 …`.

| Paso | Observado |
|---|---|
| `Tipo Cobro` = `Retención` (`value=2`) + `Tiene Adjunto` = `NO` (`value=2`) + `Buscar` | **0 filas** |
| **`Limpiar`** | `Tipo Cobro` → `""` ✅ · `Tiene Adjunto` → `0` ✅ · `Status` → `0` ✅ · `Depositado` → `""` ✅ · `Moneda` → `""` ✅ · Empresa → **`2`** ✅ |
| `Buscar` revalidando | **50 filas / 10 páginas** con **3 tipos distintos** (`Cobros`, `Anticipo/Prepago`, `Retención`) ⇒ el filtro se soltó en el servidor ✅ |

🔴 **Cumplida la restricción de solo-lectura:** el `<select>` prohibido **"Estatus del Cobro"** está **dentro de
cada fila** del datatable (`form:cobrosDT:{N}:statusMenu`), no en el panel de filtros. **No se tocó.** Los
filtros usados fueron `idTipo` y `attachStatus` del panel.

---

## 5 · 🔑 LA TENSIÓN: «hoy funciona» vs «no hubo redespliegue»

El apartado 0 concluyó que ningún artefacto del despliegue es posterior al 30/07. Sin embargo el ordenamiento
y `Limpiar` hoy funcionan. Se buscó evidencia en las dos direcciones. **Aparece de las dos, y conviene separarlas.**
Pero antes hay que revisar algo que resulta ser la mitad de la explicación.

### 5.0 · 🔴 LO PRIMERO: parte de la «línea base del 30/07 en la_tortuga» NUNCA SE MIDIÓ EN LA_TORTUGA

Al buscar la evidencia original para contrastarla, **no apareció**. Verificado leyendo los reportes:

| Afirmación que se dio por línea base del 30/07 | Qué dice realmente el reporte del 30/07 | Origen real de la afirmación |
|---|---|---|
| Clientes potenciales: `Limpiar` cambia la empresa; **50 filas → 8 de HC TRADING** | **Nada.** «clientes potenciales» aparece **1 sola vez** en `web.md` (línea 263), como fila de la tabla-síntesis: `❌ no ǀ 🔴 sí ǀ ❌ roto`. **Sin sección, sin cifras, sin Refs** | La cifra **50 → 8 no existe en ningún reporte**. El único «50 filas de otra empresa» del 30/07 es de **VISITAS** (`DW-VIS-H01`), y es **50 → 50** |
| Clientes potenciales: el ordenamiento no reordena (**3 pruebas**) | Nada más que la misma fila 263 | **latino_cosmetica / Isla Coche, 29/07** — y fueron **3 clics en `# Ref` + 1 en `Fecha`** sobre un universo de **4 registros** (orden natural `4,3,2,1`) |
| Clientes potenciales: `Limpiar` no restablece `Tiene Adjunto` (2/2) | Nada más que la misma fila 263 | **latino_cosmetica, 29/07** (`DW-CLT-F03`), sobre **1 de 4** registros |
| Inventarios: `# Ref` atada al **id del pedido relacionado** | Solo «ordenamiento mixto: `Fecha creación` ✅ · `# Ref` ❌» (líneas 173 y 260), **sin evidencia** | **latino_cosmetica, 29/07** (DEFECTO 3), demostrado sobre **18 filas con 17 nulos** (patrón NULLS-LAST) |

🔑 **Esto no invalida los hallazgos de latino_cosmetica —que están bien documentados y son sólidos— sino su
traslado a la_tortuga como si aquí se hubieran medido.** En `defectos-conocidos.yaml` la fusión ya está hecha
(«Reproducido 2/2 en visitas y **confirmado en clientes potenciales**», sin cifras), y de ahí pasó al encargo.

🔴 **Consecuencia directa para la tensión:** para **clientes potenciales de la_tortuga no hay nada que
contradecir.** No hace falta postular ni un arreglo ni un falso positivo del harness: **no existía medición
previa de esa página en esta playa.** Lo de hoy (50 filas, 2 páginas, Refs 83–184) es la **primera línea base
real** del módulo aquí. Eso **elimina de la tensión el módulo que el encargo describía como «el más cargado,
fallaban las TRES cosas»**.

⚠ **Y una advertencia de método, que es lo que hay que llevarse:** los datasets de latino_cosmetica eran de
**4 filas** (clientes potenciales) y **18 filas con 17 nulos** (inventarios). Son universos **demasiado chicos
y demasiado homogéneos** para sostener un «no reordena» genérico — que es justo lo que 5.1 desarrolla. Un
defecto medido en un cliente con 4 registros **no debe re-reportarse como defecto de otro cliente sin volver
a medirlo allí**.

### 5.1 · Evidencia de que el 30/07 hubo AL MENOS UN falso positivo — hay que corregir el reporte

**(i) Columnas con un solo valor: el ordenamiento no es verificable.**

| Módulo | Columna | Composición del dato | Consecuencia |
|---|---|---|---|
| devoluciones | `Estatus` | **"Enviado" en las 5 filas** | no hay nada que reordenar |
| **inventarios** | `Estatus` | **"Enviado" en las 5 filas** | **idem** |
| inventarios | `Vendedor` | 1 valor ×4 + 1 valor ×1 | reordena, pero apenas discriminante |

En inventarios se comprobó en vivo: al pulsar `Estatus`, **el `aria-sort` pasó a `ascending` y las filas no se
movieron** — que es **literalmente el síntoma descrito el 30/07** («el indicador cambiaba, las filas no»).
⇒ **Si el 30/07 se probó una columna así y se concluyó "no ordena", eso fue un falso positivo.**

**(ii) 🔑 Se reprodujo EN VIVO un falso negativo del propio harness — el hallazgo más importante de este punto.**

En **visitas**, el primer `Limpiar` se disparó con un **clic sintético de JavaScript** (`element.click()`) y
**no pasó absolutamente nada**: ni los desplegables, ni las fechas, ni el listado. La lectura inmediata habría
sido «🔴 REGRESIÓN: `Limpiar` dejó de resetear los selects en visitas». **Habría sido falso.**
Repetida la misma maniobra con un **clic real de Playwright** sobre el mismo botón, `Limpiar` funcionó a la
perfección. El botón lleva `onclick="PrimeFaces.ab({...})"`: **el clic sintético no siempre dispara el ajax de
PrimeFaces.**

⇒ **Un harness que pulse `Limpiar` u ordene columnas con clics sintéticos puede reportar "no funciona" sobre
una función que sí funciona.** Es el mecanismo concreto por el que el 30/07 pudo generarse un falso positivo.
🔑 **Cómo se distingue:** un `Limpiar` que **de verdad** no funciona deja las **fechas puestas Y los selects
puestos Y el listado igual** — o sea, no pasa *nada*. Un `Limpiar` que funciona parcialmente resetea unas cosas
y otras no (**así se detectó el defecto real de `Coordenadas`**, ver 4.3). **"No pasó nada" = sospechar del
harness; "pasó algo a medias" = defecto real.**

### 5.2 · Evidencia de que SÍ hubo cambios en la aplicación

**(i) 🔑 Los ids autogenerados de JSF cambiaron — y solo en las páginas que tenían defectos.**

Los ids `j_idt###` los asigna JSF **por la posición del componente en el árbol de la vista**: mientras el XHTML
no cambie, el id no cambia. Comparando el id del **formulario de filtros** del 30/07 con el de hoy:

| Página | Formulario el 30/07 | Formulario hoy | ¿Cambió? | ¿Tenía defectos el 30/07? |
|---|---|---|---|---|
| **cobros** | `form:j_idt116` | **`form:j_idt116`** | **no** | **no** (`Limpiar` ✅) |
| **visitas** | `form:j_idt116` | **`form:j_idt115`** | **sí** | **sí** (empresa saltaba a 00001) |
| **devoluciones** | `form:j_idt116` | **`form:j_idt114`** | **sí** | **sí** (`Limpiar` y ordenamiento) |

⇒ **El XHTML de visitas y devoluciones fue modificado; el de cobros no.** La correlación con qué páginas tenían
defectos es exacta. Esto es un **indicio fuerte de un redespliegue de la aplicación**, no una prueba
(los ids también pueden moverse por componentes condicionales).

**(ii) 🔑 La huella de `Last-Modified` NO puede refutar un redespliegue.** Esos `Last-Modified` son los de las
entradas **CSS / imágenes** del WAR, que conservan su fecha de empaquetado. **Si desarrollo recompiló solo
clases Java y XHTML sin tocar los recursos estáticos, el WAR nuevo traería esos archivos con las mismas fechas
y la huella no se movería.** ⇒ La premisa «no hubo redespliegue» es **más débil de lo que parece**: no hay
evidencia de redespliegue porque **ese método no puede detectarlo**, no porque no lo haya habido.

**(iii) Cambios de comportamiento que ninguna condición de dato explica.**

- **Inventarios / `# Ref`:** el 30/07 se determinó que ordenaba por el **id del pedido relacionado**. Hoy no:
  el inventario **104 no tiene pedido relacionado** y aun así cae **en su posición numérica exacta, entre el
  103 y el 105**. Si siguiera atada a ese id, caería en un extremo.
- **Clientes potenciales / ordenamiento:** el conjunto tiene **50 filas en 2 páginas** y Refs de **83 a 184**;
  al ordenar por `# Ref` **la página 1 se reemplaza entera**. Aquí **no hay homogeneidad de datos que pueda
  explicar un "no reordena"**: si el 30/07 no reordenaba, o era un defecto real o era el harness (5.1-ii).
- **Visitas / empresa:** el `<select>` **sigue teniendo la misma estructura** (con opción neutra `""`), así que
  no cambió el dato ni el marcado; **cambió a dónde apunta el reset**. 2/2 sin reproducirse.

### 5.3 · Conclusión, sin forzar ninguna de las dos

**La tensión se disuelve en tres pedazos, y ninguno exige elegir entre (a) y (b) para todo el reporte.**

1. 🔴 **Un pedazo nunca fue una contradicción: no había medición previa.** Para **clientes potenciales de
   la_tortuga** —el módulo que el encargo presentaba como el más grave— **no existe línea base del 30/07**
   (5.0). Lo atribuido venía de **otro cliente** (latino_cosmetica, 29/07, 4 registros). Aquí no hay nada
   que contradecir. **Esto es lo primero que hay que corregir del reporte a desarrollo.**
2. **Un pedazo sí fue un falso positivo:** el ordenamiento de la columna **`Estatus`** (devoluciones e
   inventarios) **nunca fue verificable** — todas las filas tienen el mismo valor. Debe retirarse de la lista
   de columnas rotas o reetiquetarse **"no concluyente"**. A esto se suma el riesgo, demostrado en vivo, de
   que el harness reporte "no funciona" por un clic sintético que no dispara el ajax (5.1-ii).
3. **Un pedazo sí parece un arreglo real:** los ids JSF cambiaron **solo en las páginas que tenían defectos**
   (5.2-i) y hay cambios de comportamiento que ninguna condición de dato explica (5.2-iii). Y **la huella de
   despliegue no puede refutarlo** (5.2-ii): no hay evidencia de redespliegue porque ese método no lo detecta.
   ⇒ **La huella no contradice los arreglos de devoluciones e inventarios.**

**Lo que queda abierto y cómo cerrarlo:** una pregunta de una línea a desarrollo — *¿hubo despliegue entre el
30/07 y el 03/08?* — zanja el punto 3. Los puntos 1 y 2 **no dependen de esa respuesta**: hay que corregirlos
en el reporte de cualquier manera.

**Recomendación reiterada:** exponer versión/build en el pie de la web. Todo este apartado existe únicamente
porque no hay forma de saber contra qué compilación se prueba.

---

## 6 · RESUMEN DE VEREDICTOS

| Módulo | `Limpiar` resetea desplegables | `Limpiar` no toca la empresa | Ordenamiento |
|---|---|---|---|
| **devoluciones** | ✅ **ARREGLADO** | ✅ sigue OK | ✅ **ARREGLADO** (`# Ref`, `Cliente`, `Fecha`) |
| **inventarios** | ✅ **ARREGLADO** | ✅ sigue OK | ✅ **ARREGLADO** (`# Ref`; `Fecha creación` sigue OK) |
| **clientes potenciales** | ✅ funciona (2/2) ⚠ | ✅ funciona (2/2) ⚠ | ✅ funciona (3/3 columnas) ⚠ |
| **pedidos** *(control)* | ✅ sigue OK | ✅ sigue OK | ✅ sigue OK |
| **visitas** *(control)* | ⚠ **OK salvo `Coordenadas`** (ver 4.3) | ✅ **ARREGLADO** (DW-VIS-H01, 2/2) | ✅ sigue OK |
| **cobros** *(control)* | ✅ sigue OK | ✅ sigue OK | no aplica al encargo |

⚠ **Sobre las tres celdas de clientes potenciales:** hoy **funcionan**, pero **no puede decirse "ARREGLADO"**
porque **no hay línea base del 30/07 en esta playa** contra la cual comparar (apartado **5.0**). El veredicto
honesto es **"funciona; primera medición real del módulo en la_tortuga"**.

- ✅ **Los 2 defectos del encargo están ARREGLADOS** en los módulos donde **sí había medición previa**:
  **devoluciones** e **inventarios**.
- ✅ En **clientes potenciales** las tres cosas **funcionan hoy** — sin línea base previa comparable (5.0).
- 🎉 **Bonus:** `DW-VIS-H01` (visitas saltaba a la empresa 00001) también quedó arreglado — este **sí** tenía
  evidencia del 30/07 (2/2, con Refs y conteos).
- 🔴 **NINGUNA REGRESIÓN** en el grupo de control.
- 🔴 **1 defecto NUEVO:** `Limpiar` no restablece `Coordenadas` en visitas (**S2**) — no cubierto el 30/07.
- 🔴 **3 afirmaciones del reporte del 30/07 que hay que corregir antes de mandarlo a desarrollo** (ver 5.0 y 5.3):
  la línea base inexistente de clientes potenciales · la atribución del `# Ref`/id-de-pedido a la_tortuga ·
  el ordenamiento de `Estatus` marcado como roto siendo **no verificable**.
- ⓘ El typo de encabezado **`Fecha Devoluciòn`** sigue presente (ya anotado en el apartado 1).

## 7 · Patrones / selectores nuevos (insumo de consolidación)

| Patrón | Detalle |
|---|---|
| 🔑 **Coexisten TRES sufijos de formulario de filtros** | `form:j_idt114` (devoluciones · inventarios · clientes potenciales) · `form:j_idt115` (pedidos · **visitas**) · `form:j_idt116` (cobros). **Anclar siempre por sufijo de campo**, jamás por el id del formulario |
| 🔑 **El clic sintético `element.click()` NO siempre dispara el ajax de PrimeFaces** | Falló en `Limpiar` de visitas y habría producido un falso "regresión". **Usar el clic real del driver** para `Buscar`/`Limpiar`, o verificar que algo cambió antes de concluir |
| **La tabla de inventarios y la de clientes potenciales se llaman `form:pedidosDT`** | No es un error de lectura: los tres módulos reutilizan ese id. Cobros usa `form:cobrosDT`, visitas `form:tablaVisit` |
| **El `reflowDD` es el catálogo fiable de columnas ordenables** | `form:{tabla}_reflowDD` lista exactamente las columnas ordenables y sus dos sentidos. Más barato y seguro que inspeccionar los `th` |
| **`Limpiar` deja las fechas de dos maneras distintas** | Devoluciones · inventarios · pedidos · cobros → **rango por defecto de 3 días** (que suele dar 0 filas: la trampa). Clientes potenciales · visitas → **fechas vacías** |
| **El valor neutro de los desplegables no es uniforme** | `0` (`orderStatus`, `attachStatus`, `idEstatus`, `selectDispatch`) · `""` (`idTipo`, `idSalesmaView`, `clientSOM`, `idType`, `idMotive`) · **`-1`** (`selectCoordinadas`, el único, y el único que `Limpiar` no resetea) |
| **El `value` de Empresa no es uniforme entre módulos** | `1`/`2` en devoluciones, inventarios, visitas y cobros · **`00001`/`00002`** en clientes potenciales y pedidos. Comparar como cadena y no asumir formato |
| **El panel de un `p:selectOneMenu` se llena en modo lazy** | `#{wrapId}_panel` está **vacío** hasta el primer clic en el trigger. Hay que abrirlo y **después** buscar el `li[data-label]` |
| **El ordenamiento sobrevive a `Limpiar`, a `Buscar` y a `page.goto()`** | Reconfirmado en visitas: el sort por `Vendedor` seguía activo tras las tres cosas. **También sobreviven los filtros** (`Coordenadas=4` sobrevivió a un `goto`) |
