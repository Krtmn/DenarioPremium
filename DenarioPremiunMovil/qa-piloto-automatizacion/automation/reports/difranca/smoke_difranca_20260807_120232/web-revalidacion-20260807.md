# Revalidación de 2 hallazgos web — difranca / EL YAQUE

**RUN_ID:** `20260807_120232_smoke-difranca-tag20` · **Playa:** el_yaque · **Empresa:** `DDHP_A12` (id_enterprise **2**)
**Fecha:** 2026-08-07 · **Modo:** READ-ONLY (solo `Buscar`, `Limpiar`, `<select>` de filtro, `# Ref`)
**Revalida:** `web-F-filtros.md` (no se reescribe — ver §"Qué corregir")

## Veredictos

| Hallazgo | Veredicto |
|---|---|
| `COB-LISTA-RENDER-VACIO` | ✅ **CONFIRMADO** — y es **peor** de lo reportado: determinista, no intermitente, y de **servidor** |
| `PED-LISTA-SUBCONJUNTO` | ⛔ **REFUTADO** — falso positivo por filtro `Moneda=BSD` persistido en sesión |
| `PED-STATUS-CONTRADICE-COLUMNA` (venía junto) | ✅ **CONFIRMADO** — con causa raíz identificada en BD |

**Metodología aplicada en las dos revalidaciones** (la regla que salió del precedente `COB-WEB-FILTRO-STATUS`):
vista nueva por `page.goto` → **leer el `value` de TODOS los selects del panel antes de tocar nada** →
elegir opción → esperar ajax idle **+ 2,2 s** → **verificar `.ui-selectonemenu-label` Y el `value` del `<select>`
espejo** → recién ahí `Buscar`. Un solo filtro por vez. Oráculo BD en cada medición.

---

## `COB-LISTA-RENDER-VACIO` — **CONFIRMADO**

### Qué es en realidad

**Un único registro envenena la lista entera.** El cobro **`21831`** — el **único `co_type=3` (IGTF) que
existe en toda la BD** — hace que el servidor devuelva el `<tbody>` **vacío** para **cualquier** búsqueda que
lo incluya, aunque el conteo salga bien. Los demás registros de esa página se pierden con él.

### Tasa de reproducción: **10/10 (100 %)** — NO es intermitente

10 `Buscar` idénticos (Empresa `DDHP_A12` + rango `01/08–07/08`, panel limpio verificado antes de cada uno):

| Búsquedas | `rowCount` | Filas pintadas |
|---|---|---|
| 10 de 10 | 66 (siempre) | **0 (siempre)** |

El reporte anterior decía *"intermitente — 1 de 8 sí pintó"*. **No hay intermitencia.** El caso que "sí pintó"
(Moneda US$) es el único que **excluye a `21831`**, no un golpe de suerte.

### Aislamiento del registro culpable — filtrando por `# Ref` uno por uno

| `# Ref` | Moneda | `rowCount` | Filas pintadas |
|---|---|---|---|
| 21809 | BSD | 1 | ✅ 1 |
| 21819 | BSD | 1 | ✅ 1 |
| 21828 | BSD | 1 | ✅ 1 |
| 21830 | US$ | 1 | ✅ 1 |
| 21832 | US$ | 1 | ✅ 1 |
| **21831** | **BSD** | **1** | ❌ **0** |

⇒ **Se cae el mito "con `# Ref` siempre pinta"**: con `# Ref = 21831` tampoco pinta.
⇒ Tampoco es "cosa de los BSD": los otros 3 BSD pintan perfecto.

### El conjunto se rompe si y solo si contiene a `21831`

| Filtro | ¿incluye 21831? | `rowCount` | Filas pintadas |
|---|---|---|---|
| Sin ningún filtro (vista por defecto del operador) | sí | **18.086** | ❌ **0** |
| Rango `01/08–07/08` | sí | 66 | ❌ 0 |
| Rango `01/08–07/08`, **página 2** (filas 51–66) | no | 66 | ✅ **16** |
| Rango `01/08–**06**/08` (excluye el 07/08) | no | 61 | ✅ **50** |
| Moneda **US$** | no | 62 | ✅ **50** |
| Moneda **BSD** | sí | 4 | ❌ 0 |

La página 2 pinta porque `21831` cae en las primeras 50 filas (orden por `# Ref` desc).

### Es defecto de SERVIDOR, no de render del navegador

Capturé la respuesta cruda del ajax de `Buscar` con `# Ref=21831` (9.507 bytes). El servidor manda:

```html
<div class="ui-datatable-scrollable-body" tabindex="-1" style="max-height:450px">
  <table role="grid"><tbody id="form:cobrosDT_data" class="ui-datatable-data ui-widget-content"></tbody></table>
</div>
```

**El `<tbody>` viene vacío desde el backend**, con el paginador y el `Total de Resultados` correctos en la
misma respuesta. ⇒ **Descartada** la sospecha del reporte anterior ("bug de renderizado del datatable
scrollable/reflow de PrimeFaces"): no es CSS, ni reflow, ni alto colapsado, ni timing de ajax. El
`.ui-datatable-scrollable-body` queda con altura 0 **porque no recibió filas**, no al revés.

### El registro culpable

| Campo | `21831` (rompe) | `21828` (sano, mismo día, misma moneda) |
|---|---|---|
| `co_type` | **3 — IGTF** | 0 — Cobros |
| `id_original_collection` | **21830** (cobro padre) | `null` |
| `co_currency` | BSD | BSD |
| `collection_payment` / `collection_detail` | 1 / 1 | 1 / 1 |
| resto de importes | sin nulos, coherentes | sin nulos, coherentes |

`SELECT id_enterprise, co_type, count(*) FROM collection WHERE co_operation<>'D' GROUP BY 1,2` →
**`co_type=3` aparece 1 sola vez en toda la BD**: la empresa 2, este registro. Es el **primer cobro IGTF**
del tenant, creado por la corrida móvil de hoy (15:19:32).

⇒ Hipótesis de causa raíz (para desarrollo, no verificada en código): la fila `co_type=3` revienta al
renderizarse (columna *Tipo de Cobro* / resolución del cobro original) y JSF descarta el `<tbody>` completo.
**Encaja con `COB-TIPO-IGTF-DUPLICADO`** del reporte anterior (la opción `IGTF(3)` aparece duplicada en el
`<select>`): los dos apuntan a que el catálogo de tipo 3 está mal armado.

### Impacto — 🔴 **alto, y es go/no-go**

Mientras `21831` exista, **la pantalla de Cobros de `DDHP_A12` está en blanco**: sin filtros son **18.086
cobros contados y 0 mostrados**. El operador ve el total, los montos de cabecera y el paginador, y **ninguna
fila**. Y no es un caso de laboratorio: lo disparó un **cobro IGTF normal hecho desde el móvil**, o sea que
**cualquier cobro IGTF nuevo vuelve a romper la lista**. difranca **sí** usa IGTF.

---

## `PED-LISTA-SUBCONJUNTO` — ⛔ **REFUTADO**

### Por qué se equivocó el reporte anterior

**Había un filtro `Moneda = BSD` puesto, que el agente nunca seleccionó y nunca miró.** Es el precedente
`EST-CANALES-CONTADOR-VS-LISTADO` calcado: contador total contra listado filtrado.

Al entrar con `page.goto` a `/pages/pedidos` **antes de tocar nada**, el panel traía:

```
idCurrency  → label "BSD"   v=1     ← FILTRO ACTIVO, no seleccionado por nadie
n_ref       → "39794"                ← # Ref persistido de la tanda anterior
dateF_input → "07/08/2026"
orderStatus → "Status"  v=0  (placeholder, no filtra)
```

Y **`Limpiar` NO resetea `Moneda`**: tras pulsarlo el label seguía en `BSD`.

### Las 3 cifras "malas" son exactamente los pedidos en BSD

| Medición del reporte anterior | Web | BD total | BD **solo BSD** | Veredicto |
|---|---|---|---|---|
| Vendedor Jose Raad, sin fechas | 1 | 2.049 | **1** | ✅ coincide con BSD |
| Rango `01/08–07/08` | 3 | 25 | **3** | ✅ coincide con BSD |
| Sin fechas | 271 | 15.517 | **274** | ✅ coincide con BSD |

`SELECT id_currency, count(*) FROM "order" WHERE co_operation<>'D' AND co_enterprise='DDHP_A12' GROUP BY 1`
→ `US$ 15.243` · **`BSD 274`**.

### Re-medición con el panel limpio y verificado

Vista nueva, `# Ref` vaciado, fechas vaciadas, `Moneda` devuelta al placeholder (label verificado = `Moneda`,
`v=""`), un solo filtro por vez, regla de los 2 s:

| Filtro | Web `rowCount` | Filas pintadas | BD | Veredicto |
|---|---|---|---|---|
| Solo Empresa `DDHP_A12`, sin fechas | **15.439** | ✅ 50 | 15.517 | ✅ (ver nota del residuo) |
| \+ Vendedor **Jose Raad** (label y `v=275` verificados) | **2.049** | ✅ 50 | **2.049** | ✅ **exacto** |

**2.049 == 2.049.** El "1 vs 2.049" no existe. Y la lista **sí pinta las filas** en pedidos.

### La "pista" del `st_order=1` era una coincidencia, no un mecanismo

El reporte anterior razonó: *"la web devuelve 1 y la BD tiene exactamente 1 pedido de ese vendedor con
`st_order=1` ⇒ la web filtra por un estado oculto"*. **Es casualidad.** El único pedido `st_order=1` de Jose
Raad es el **`39794`**, que es *además* el único pedido suyo en **BSD** (`id_currency=1`) — lo creó la corrida
móvil de hoy. Las dos condiciones seleccionan el mismo registro por accidente. La que estaba actuando era la
moneda: quitando `Moneda` el conteo salta a 2.049 aunque `st_order` no se toque.

### Residuo menor, separado y sin severidad

Sin filtros la web da **15.439** y BD **15.517** (medido de nuevo al cierre: web **15.440** / BD **15.518** —
la corrida móvil seguía creando pedidos). Queda un hueco estable de **~78 filas (0,5 %)** que **no** se
explica por nulos (`da_order`, `co_operation`, `id_client` = 0 nulos) ni por el join a `client`
(15.518 pedidos tienen cliente existente). **No es el defecto reportado** (que afirmaba 98 % de faltantes) y
no lo investigué a fondo: queda como ítem menor a verificar aparte, no como hallazgo.

---

## `PED-STATUS-CONTRADICE-COLUMNA` — ✅ **CONFIRMADO** (venía junto al hallazgo 2)

No es el mismo caso que el descartado `COB-WEB-FILTRO-STATUS`: **aquí sí apliqué la regla de los 2 s**,
verifiqué label **y** `value`, desde vista nueva y con el panel entero limpio, **y hay mecanismo en BD que
predice el número exacto**.

Panel verificado justo antes de `Buscar` — todo en placeholder salvo Status:

```
idEnterprise "*DISTRIBUIDORA DIAZ HERNANDEZ *" v=DDHP_A12
idSalesmaView "Vendedor" v=""   ·  clientSOM "Cliente" v=""  ·  idCurrency "Moneda" v=""
orderStatus  "Enviado"   v=6    ·  n_ref ""  ·  fechas ""
```

| Status | `value` | Web | Esperado por `order.st_order` |
|---|---|---|---|
| *(placeholder)* | 0 | **15.439** — todas rotuladas "Enviado" | 15.517 |
| **Enviado** | **6** | **1** (solo `# Ref 39794`) | **15.512** |
| Por aprobar | 26 | 0 | 0 |
| Guardado | −1 | 0 | 0 |

### Causa raíz encontrada

El `value=6` **es el correcto**: `statuses` es un catálogo **por empresa y por tipo de transacción**, y
`id_status=6` = *Enviado · id_enterprise=2 · ped*. El problema es **contra qué tabla filtra**:

```sql
SELECT co_transaction_type, count(*) FROM transaction_statuses GROUP BY 1;
--  ped 1.383  ·  cob 831  ·  inv 2  ·  dev 1        (2.217 filas en total)

SELECT id_transaction, id_status FROM transaction_statuses WHERE id_status IN (6,26);
--  id_transaction 39794 | id_status 6      ← UNA sola fila
```

⇒ El filtro `Status` de pedidos consulta **`transaction_statuses`** (tabla de *historial* de estados, apenas
poblada: 1.383 filas de `ped` para 15.517 pedidos, y **una sola** con el `id_status=6` de esta empresa),
mientras que **la columna "Estatus" de la grilla se pinta desde `order.st_order`** (15.512 = 6 = "Enviado").
De ahí la contradicción exacta: **2.049 filas rotuladas "Enviado" y el filtro "Enviado" devuelve 1** — que es,
literalmente, el único pedido con historial de estado registrado.

**Impacto:** 🟠 medio-alto. El filtro `Status` de pedidos es **inservible** (devuelve ~0 en todos los casos) e
**induce a error**: el operador ve "Enviado" en pantalla y al filtrar por "Enviado" no encuentra nada.

### Hallazgo lateral: la vista cambia de tabla según el Status

Con `Status = Guardado` (−1) el DOM **sustituye** `form:pedidosDT` por **`form:pedidosSavedDT`**.
Un lector que haga `document.getElementById('form:pedidosDT')` **revienta con `null`** (me pasó).
⇒ **Anclar por `.ui-datatable`, no por el id fijo.**

---

## Qué corregir de `web-F-filtros.md` (no lo reescribí)

| Línea(s) | Dice | Debe decir |
|---|---|---|
| **94** `DW-PED-F04` | **WEB-FAIL** · rowCount **1** vs BD **2.049** | **WEB-OK** · **2.049 == 2.049**. La medición previa tenía `Moneda=BSD` y `# Ref=39794` puestos |
| **95** `DW-PED-F05` | **WEB-FAIL** · 3 vs 25 · 271 vs 15.517 | **WEB-OK** · 3 == 3 (BSD) y 15.439 vs 15.517 con `Moneda` en placeholder. Nota aparte: residuo ~78 (0,5 %) sin explicar |
| **96** `DW-PED-F06` | WEB-FAIL, "el filtro contradice la columna" | **Se mantiene WEB-FAIL**, pero la causa no es el filtro sino que consulta `transaction_statuses` en vez de `order.st_order` |
| **99** `DW-PED-F09` | Moneda "no ejecutado" | ⚠ **Sí estaba actuando** — `Moneda=BSD` venía puesto en el bean y contaminó F04, F05 y F06 |
| **93** `DW-PED-F03` | `Limpiar` → **WEB-OK** | **WEB-FAIL** — `Limpiar` **no resetea `Moneda`** (queda en BSD) ni las fechas |
| **165** | "**`# Ref`** (cualquiera de los 3) → ✅ **1 — siempre**" | **Falso.** `# Ref = 21831` da rowCount 1 y **0 filas**. El `# Ref` no inmuniza |
| **167** | "**Es intermitente** (1 de 8 sí pintó)" y "no depende del tamaño" | **No es intermitente: 10/10.** Depende **solo** de si el conjunto incluye a `21831` |
| **169-170** | "Sospecha: bug de renderizado del datatable scrollable/reflow de PrimeFaces" | **Descartado.** El `<tbody>` **llega vacío desde el servidor** (respuesta ajax capturada) |
| **175-192** | Hallazgo `PED-LISTA-SUBCONJUNTO` completo | **Eliminar — falso positivo.** Sustituir por la nota de `Moneda` persistida |
| **185-188** | "Dato que orienta: BD tiene exactamente 1 pedido con `st_order=1`…" | **Eliminar.** Coincidencia: ese pedido (`39794`) es *también* el único en BSD del vendedor |
| **210-216** | Tabla de `Limpiar` (solo `# Ref` / fechas / Empresa) | Agregar columna **"¿resetea los `<select>` de Moneda/Cliente/Status?"** → **NO** en cobros ni pedidos |
| **221-225** | `FILTROS-PERSISTEN-EN-SESION` (🟡 medio) | **Subir a 🔴 alto.** Es lo que produjo el falso `PED-LISTA-SUBCONJUNTO`. Persiste `# Ref`, `Moneda`, `Cliente`, `Status` y las fechas, **por módulo**, atravesando `page.goto` |
| **274-283** | "Leer el conteo por el paginador, no por las filas del DOM" | Sirve, **pero avisar que `paginator.cfg.rowCount` queda RANCIO**: en una carga fresca de `/pages/cobros` marcaba **30** (de la búsqueda anterior) con el `<tbody>` en 0. **No vale como prueba de que se buscó** |
| **335** | "Módulos con defecto: cobros (no pinta) y **pedidos (devuelve subconjunto)**" | "cobros (**un registro IGTF deja la lista en blanco**) y pedidos (**solo el filtro `Status`**)" |

### Aprendizajes nuevos para los selectores

- 🔴 **`Moneda` (`:idCurrency`) y `Cliente` (`:clientSOM`) sobreviven a `Limpiar` y a `page.goto`** en cobros y
  pedidos. **Leer el `value` de TODOS los selects antes de la 1ª medición de cada módulo** — no alcanza con
  `Limpiar`. El estado es **por módulo** (cobros en `US$` y pedidos en placeholder a la vez: no hay fuga cruzada).
- ⚠ El vendedor se lista como **`Jose  Raad` con DOS espacios**. Un `===  'Jose Raad'` **no matchea**:
  normalizar con `.replace(/\s+/g,' ').trim()` antes de comparar.
- ⚠ En pedidos, `Status = Guardado` **cambia la tabla** a `form:pedidosSavedDT`. Anclar por `.ui-datatable`.

---

## Resumen para el go/no-go

- 🔴 **`COB-LISTA-RENDER-VACIO` es real, determinista (10/10) y de servidor.** Un cobro IGTF deja la lista de
  Cobros en blanco (18.086 contados, 0 mostrados). **Cuenta para el go/no-go del tag 20.**
- ⛔ **`PED-LISTA-SUBCONJUNTO` no existe.** Filtro `Moneda=BSD` persistido. **No promover a memoria.**
- ✅ **`PED-STATUS-CONTRADICE-COLUMNA` es real**, con causa raíz en `transaction_statuses`. Severidad media-alta.

*Revalidación · 2026-08-07 · difranca / EL YAQUE · READ-ONLY*

> ✅ consolidado 2026-08-07
