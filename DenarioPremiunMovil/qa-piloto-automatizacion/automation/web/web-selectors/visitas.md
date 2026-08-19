# Selectores web — módulo VISITAS (`/pages/visitas` · `/pages/detalleVisita`)

> Leer junto a `_comunes.md`. Esta página es la **más atípica de las 7**: rompe tres patrones que el resto
> respeta (la clase del detalle, el widget del paginador y el calentamiento de la búsqueda).

---

## 🔴🔴 `detalleVisita.xhtml` usa `class="font.-bold"` — CON UN PUNTO

Typo del build. **`span.font-bold` no matchea NADA** en esta página; es la única de las 7 que rompe el patrón
(probado contra las otras 6). ⇒ **nunca anclar por esa clase.**

**Vía correcta:** la regla preferente de `_comunes.md` — `document.getElementById('form').innerText` — que no
ancla por clase y resuelve cabecera y pie de una sola pasada. Como fallback, `span` genérico +
`textContent.endsWith(':')`. `[grupo_fiel-20260817]`

---

## ⛔ ~~La PRIMERA búsqueda devuelve resultado RANCIO~~ — **DEROGADO `[kron-20260817]`**

> ~~`/pages/visitas` devuelve el resultado de la búsqueda anterior en el primer `Buscar` tras entrar al módulo.
> ⇒ hacer un `Buscar` de calentamiento y medir en el siguiente.~~ `[grupo_fiel-20260817]`

🔴 **NO REPRODUCE.** Con entrada fresca, `Buscar` #1 y #2 dieron **idéntico** resultado. Lo que existe es otra
cosa, y el workaround documentado **no la arregla**:

**Lo real:** al entrar a `/pages/visitas` **la tabla ya viene PRE-POBLADA con el resultado anterior del bean**,
*antes* de tocar `Buscar` (medido: 24 filas de junio ya presentes al cargar; en sesión virgen, el listado
**sin filtrar** — 142 registros). ⇒ si el `Buscar` **no llega a ejecutar su ajax** (ver el anti-patrón de
`boton.click()` → `chrome-error://` en `_comunes.md`), se lee un listado **poblado y coherente** que *parece*
una respuesta al filtro. **Ese, y no un defecto, es el síntoma que se venía reportando.**

⇒ **El `Buscar` de calentamiento NO sirve. Lo que sirve es enganchar el `loadend` del XHR** (receta de
instrumentación en `_comunes.md` → "Sesión y transporte del bundle"). *(Esto convirtió un ⛔ BLOCKED en descarte:
el filtro de rango de fechas de `/pages/visitas` **funciona correctamente** — 6/6 ventanas exactas contra BD.)*

⚠ **Y los filtros de visitas PERSISTEN ENTRE SESIONES DE AGENTE:** se encontró un `n_ref = 77` puesto por el
agente anterior, sobreviviendo a `browser_navigate`. **Limpiar `n_ref` explícitamente antes de medir cualquier
conteo.**

---

## Anclajes y filtros

| Elemento | Selector | Notas |
|---|---|---|
| Tabla de la lista | **`form:tablaVisit`** ⚠ | 🔴 **CORRIGE la doc `[kron-20260817]`:** la de la **LISTA** es `form:tablaVisit`; **`form:visitasDT` es la tabla de ACTIVIDADES del DETALLE**. Son ids distintos |
| Botón `Buscar` | **`[id$=":btnBuscar"]`** | ⚠ distinto del resto: pedidos/devoluciones/inventarios/depositos/clientesPotenciales usan `[id$=":ajax"]` ⇒ **anclar por TEXTO** |
| Filtro `# Ref` | `[id$=":n_ref"]` | ✅ **visitas SÍ lo tiene** (y el rango de fechas **no** lo tapa) |
| Filtro **Vendedor** | **`[id$=":idSalesman_input"]`** | ⚠ **CORRIGE la doc**: visitas **SÍ** tiene filtro de vendedor. En kron el sufijo es `:idSalesman`, **no** `:idSalesmaView` |
| Filtro **Adjuntos** | **`[id$=":selectAttach_input"]`** | 3 opciones — permite listar los registros CON adjunto sin barrer la lista |
| Botón detalle de fila | `form:tablaVisit:N:consultar` | 🔴 anclar al `# Ref`, **nunca** a `N` |

`[grupo_fiel-20260817][kron-20260817]`

### 🔴 La columna se llama `Ref`, NO `# Ref` — y los índices de columna engañan `[kron-20260817]`

Encabezados reales: `Detalle · Editar · Eliminar · **Ref** · Título · Fecha Programada · Fecha Iniciada ·
Fecha Enviada · Status · Geo`. **Un extractor que busque `/^#\s*Ref/` devuelve `null` en TODA la tabla.**
(El *input* del filtro sí es `[id$=":n_ref"]`.)

⚠ **Índices de `form:tablaVisit`:** `td[0]`=Consultar · `td[1]`=Editar · `td[2]`=Eliminar · **`td[3]`=Ref** ·
`td[5]`=Fecha. Anclar a `td[0]`/`td[1]` devuelve `"DetalleConsultar"`/`"Editar"` — **falso vacío**.

### Filtros completos de visitas en este build `[kron-20260817]`

`:idRol` · `:idSalesman` · `:idClient` · `:idEstatus` · `:idType` · `:idMotive` (95 opciones) · `:selectAttach` ·
`:selectDispatch` · **`:selectCoordinadas`**.
⚠ **`:selectCoordinadas_input` tiene placeholder `value="-1"`** — no `""` ni `0`: un lector que asuma `""` lo
leerá como **filtro activo**.

⚠ **En este build `el.value = …` sobre `dateB_input`/`dateF_input` NO revierte** (probado con `input`/`change`/
`blur`); la nota contraria de `playas.yaml` es **específica de Caribe**. `PF(widget).setDate()` sigue siendo
preferente por ser inmune al build.

**Lista vacía:** en visitas el literal es **`"No existe registro"`**; en el resto de los módulos,
`"No se encontraron registros."`

---

## 🔴 La lista es POR ACTIVIDAD, no por visita — **una visita con 2 actividades da 2 filas** `[run_vzla-20260818]`

**No es un duplicado y no se reporta.** Las filas repiten el mismo `Ref` porque cada `incidence` de la visita
ocupa una fila. Consecuencia directa para todo conteo:

```sql
-- ❌ count(visit) da de MENOS      ✅ el conteo de la lista es Σ greatest(count(incidence),1)
WITH w AS (SELECT id_visit FROM visit WHERE co_operation IS DISTINCT FROM 'D' AND da_visit::date BETWEEN … ),
     i AS (SELECT id_visit, count(*) n FROM incidence WHERE co_operation IS DISTINCT FROM 'D' GROUP BY 1)
SELECT sum(greatest(coalesce(i.n,0),1)) FROM w LEFT JOIN i USING (id_visit);
```

Medido: **916 visitas ⇒ 929 filas**. El `greatest(...,1)` importa — **una visita sin `incidence` sigue ocupando
una fila**. (Verificado también en el caso simple: visita 2080 con 1 `incidence` ⇒ `Total de Resultados: 1`.)

⚠ **Catálogos de la BD de visitas — los nombres engañan** (detalle en `_comunes.md §query.js`):
`incidence_type` se une por **`it.id_type = i.co_type`**; el *motivo* es **`co_cause`** y la tabla es
**`incidence_motive`** (**`incidence_cause` NO EXISTE**); y **`incidence` no tiene `co_visit`: la FK es
`id_visit`** — excepción a la regla "la FK de la hija es el epoch en texto".

## ⚠ Paginación — `PF('tablaVisit')` NO expone paginator

`PF('tablaVisit').paginator` **lanza** (a diferencia de `PF('cobrosDT')`/`PF('pedidosDT')`, que exponen
`cfg.rowCount`, `cfg.rows` y `cfg.page`). ⇒ en visitas **contar los `.ui-paginator-page`**.

⚠ **Visitas tiene DOS paginadores** (arriba y abajo): `.ui-paginator-rpp-options` devuelve
`["50","100","200","50","100","200"]` ⇒ usar **`querySelector`** (el primero), nunca `querySelectorAll` sin
deduplicar. `[grupo_fiel-20260817]`

---

## Datos y correlación

- 🔑 **`Geo` == `visit.st_coordinate` — catálogo COMPLETO `[kron-20260817]`** (validado 24/24):

  | `st_coordinate` | Etiqueta en la columna `Geo` |
  |---|---|
  | `0` | Por Revisar |
  | `1` | No Realizado |
  | `2` | Falta Coordenada (Sucursal) |
  | `3` | Falta Coordenada (Destino) |
  | `4` | Fuera de Rango |
  | `5` | Correcto |

  ✅ **`4` y `5` reconfirmados en otra playa `[run_vzla-20260818]`** — `5 = Correcto` es el valor que la corrida
  anterior no había visto. `Fuera de Rango` lo **calcula la web** contra la coordenada de la sucursal:
  **por diseño, no se juzga** (`WEB-RUNTIME §5.b`).

  ⚠ **`Falta Coordenada (Sucursal)` NO significa que la visita no tenga coordenada** — la tiene; la etiqueta
  compara contra la **sucursal**. Es comportamiento **por diseño** (`WEB-RUNTIME §5.b`): **no reportarlo.**
- **Cotejo 24/24 validado en:** `Fecha Programada`=`da_visit` · `Fecha Iniciada`=`da_initial` ·
  `Fecha Enviada`=`da_real` · `Cod. Cliente` · `Status` · `Vendedor` · `Geo`, y **patrón de título
  `{fecha}-{cliente}`** 24/24. `[kron-20260817]`
- ⚠ **El nombre del vendedor puede llegar con DOBLE espacio** en el `.ui-selectonemenu-label`
  (`"SCARLET  FLOREZ"`; la `<option>` trae uno solo), y en visitas el label es **`"VE0002 - SCARLET  FLOREZ"`**
  (`co_user` + nombre). **Un `===` literal falla en ambos casos** ⇒ normalizar espacios y comparar por
  inclusión del apellido. `[kron-20260817]`
- ⚠ **`PF('tablaVisit')` sigue sin exponer paginator, pero el `.ui-datatable-header` SÍ trae
  `"Total de Resultados: N"`** en este build ⇒ **el conteo sale de ahí**, sin contar `.ui-paginator-page`. `[kron-20260817]`
- ✅ **`#form.innerText` funciona en `detalleVisita`** pese al typo `class="font.-bold"` — reconfirmado. `[kron-20260817]`
- **`Fecha Iniciada` viene en hora local UTC−4**, útil para fechar el registro contra `da_update` (UTC).
  Veredicto **por día**, igual que `RUNTIME §10.b`. `[grupo_fiel-20260817]`
- **Tabla hija de actividades del detalle:** **`form:visitasDT`** — id **semántico y estable**, reconfirmado
  `[run_vzla-20260819]`. ⚠ **No confundirlo con `form:tablaVisit`, que es la LISTA** ⇒ verificar
  `location.pathname` antes de leer, como en `detallePedido`.
- ✅ **La coordenada de `detalleVisita` NO es texto visible** — `#form.innerText` devuelve solo `Ubicación: Mapa`.
  Leerla del `innerHTML` con regex y **comparar con tolerancia: el mapa redondea a 6 decimales**
  (receta en `_comunes.md §Mapas de Google`). `[run_vzla-20260819]`
- ⚠ **La `Firma:` es un `<img id="form:graImaPro">`, no texto** — verificar `naturalWidth > 0`; si el `<img>` no
  existe en el DOM es que **no hay firma**, no que no se pinte. `[run_vzla-20260818]`
- **Adjuntos:** las firmas viven aparte del resto —
  `{origin}/denario/resources/images/firmas/visitas/{ref}_{n}.jpg`; las fotos, en
  `{origin}/denario/resources/images/visitas/{ref}_{n}.jpeg?pfdrid_c=true`. Botones de adjunto
  `j_idt142`/`j_idt144` (**no anclar**: usar `/descargar\s+adjunto/i` y `/ver\s+adjunto/i`). Ver la sección de
  adjuntos de `_comunes.md`, incluido el 🔴 **visor que roba el click**. `[grupo_fiel-20260817]`

---

## ⛔ Superficie de escritura — prohibida

El agente web es **read-only**. El único control que se toca es **`Consultar`**.

---
*Creado por la consolidación de `[grupo_fiel-20260817]`.*
