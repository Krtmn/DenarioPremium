# `COB-LISTA-RENDER-VACIO` — ¿el TIPO IGTF o el registro puntual?

**RUN_ID:** `20260807_120232_smoke-difranca-tag20` · **Playa:** el_yaque · **Cliente:** difranca
**Fecha:** 2026-08-07 · **Modo:** READ-ONLY (solo `Buscar`, `<select>` de FILTRO, `# Ref`, rango de fechas)
**Antecedente:** `web-revalidacion-20260807.md` (confirmó el defecto con el cobro `21831`)

---

## 🔴 VEREDICTO: **ES EL TIPO**

**No es un registro envenenado: es `co_type = 3` (IGTF).** Los **3** cobros IGTF que existen en toda la BD
—creados a propósito por la QA en **2 empresas distintas**, **2 monedas distintas** y por **2 flujos de
creación distintos**— dejan el `<tbody>` **vacío**. **3 de 3, sin una sola excepción.**

Y la prueba directa que lo cierra sin margen de interpretación: el propio filtro **`Tipo Cobro = IGTF`**
devuelve **2 contados / 0 pintados**, mientras que **los otros 3 tipos de cobro del catálogo pintan
perfecto** (`Cobros` 17.871/50 · `Retención` 1/1 · `Anticipo/Prepago` 214/50).

⇒ **Cualquier cobro IGTF que difranca emita, desde cualquier empresa y en cualquier moneda, deja en blanco
la lista de Cobros de esa empresa.** `userCanSelectIGTF = true`.

---

## 1 · Aislamiento por `# Ref` — los 3 IGTF contra sus controles

Vista nueva por `page.goto`, `value` de **todos** los selects verificado antes de cada `Buscar`, fechas y
`# Ref` limpiados **después** de los ajax de los selects (ver §Método).

| `# Ref` | Empresa (por TEXTO) | `co_type` | Moneda | **Contados** | **Pintados** | |
|---|---|---|---|---|---|---|
| **21832** | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | 0 Cobros | US$ | 1 | **1** | ✅ control negativo |
| **21834** | `DIFRANCA C.A` | 0 Cobros | US$ | 1 | **1** | ✅ control negativo |
| **21831** | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | **3 IGTF** | BSD | 1 | **0** | ❌ control positivo (reproducido) |
| **21835** | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | **3 IGTF** | BSD | 1 | **0** | ❌ **rompe** |
| **21836** | **`DIFRANCA C.A`** | **3 IGTF** | **USD** | 1 | **0** | ❌ **rompe** |

**3 IGTF probados, 3 rotos. 2 controles normales, 2 sanos.**

## 2 · Efecto sobre listados completos

| Búsqueda | ¿incluye IGTF? | **Contados** | **Pintados** | Daño colateral |
|---|---|---|---|---|
| `DDHP_A12` · rango **hoy** `07/08–07/08` | sí (21831 + 21835) | **7** | **0** ❌ | se pierden **5 cobros sanos** |
| `DDHP_A12` · **Moneda BSD** (sin fechas) | sí (los 2 BSD) | **6.017** | **0** ❌ | se pierde la moneda entera |
| `DDHP_A12` · **Moneda US$** (sin fechas) | no | **12.071** | **50** ✅ | — |
| `DIFRANCA C.A` · rango **hoy** | sí (21836) | **5** | **0** ❌ | se pierden **4 cobros sanos** |
| **`DIFRANCA C.A` · SIN NINGÚN FILTRO** | sí (21836 cae en las 1as 50) | **1.166** | **0** ❌ | **la 2ª empresa también quedó en blanco** |

🔴 **Ahora son DOS de las tres empresas del tenant con la pantalla de Cobros en blanco**: `DDHP_A12`
(18.086 contados / 0) por el 21831 y 21835, y `DIFRANCA C.A` (1.166 contados / 0) por el 21836.
Antes de esta prueba era una sola. **Cada IGTF nuevo suma una empresa caída.**

## 3 · La prueba decisiva — el filtro `Tipo Cobro`

El propio panel de filtros tiene un `<select>` **`Tipo Cobro`** (`:idTipo`) que segmenta por `co_type`.
Filtrando **solo por tipo**, empresa `DDHP_A12`, sin fechas y con todo lo demás en placeholder:

| `Tipo Cobro` | `co_type` | **Contados** | **Pintados** | |
|---|---|---|---|---|
| **IGTF** | **3** | **2** | **0** | ❌ **los 2 IGTF de la empresa, ninguno pintado** |
| Cobros | 0 | 17.871 | **50** | ✅ |
| Retención | 2 | 1 | **1** | ✅ |
| Anticipo/Prepago | 1 | 214 | **50** | ✅ |

**El corte es exactamente por tipo.** No hay un registro raro: hay un tipo roto. `Retención` (`co_type=2`,
también un tipo "especial" con cobro original) **pinta sin problema** ⇒ tampoco es "los tipos derivados".

## 4 · Confirmación de que viene del SERVIDOR (respuesta ajax cruda)

Capturado con un hook de `XMLHttpRequest` sobre el `Buscar` de `DDHP_A12` + rango de hoy
(**7 contados / 0 pintados**), respuesta de **9.503 bytes**:

```html
<tbody id="form:cobrosDT_data" class="ui-datatable-data ui-widget-content"></tbody>
```

`tbodyVacioEnAjax: true`, con el bloque `Total de Resultados` y el paginador **correctos en la misma
respuesta**. Idéntico a lo capturado para el `21831`. **El backend cuenta bien y manda cero filas.**
No es render, ni CSS, ni reflow, ni timing.

---

## 5 · Lo que NO influye

### La **moneda** no cambia nada
`21831` y `21835` son **BSD** (`id_currency=1`); `21836` es **USD** (`id_currency=3`, literal `USD`, no `US$`).
Los tres rompen igual. El caso `Moneda US$` que "sí pintaba" en la revalidación anterior no era una moneda
inmune: era **el único conjunto que excluía al IGTF**.

### La **empresa** no cambia nada
`21831`/`21835` → empresa **2** (`DDHP_A12`). `21836` → empresa **3** (`DIF_A12` / `DIFRANCA C.A`).
Rompen las dos. La 3ª empresa (`DH VITAL`) todavía pinta **solo porque aún no tiene ningún IGTF**.

### El **flujo de creación** no cambia nada
| `# Ref` | Cómo se creó | Resultado |
|---|---|---|
| `21831` | enviado | ❌ rompe |
| `21835` | **enviado directo** | ❌ rompe |
| `21836` | **guardado → reabierto → enviado** | ❌ rompe |

Da lo mismo el camino. Lo que importa es que el registro quede con `co_type=3`.

### Tampoco es el dato
Comparación campo a campo en BD (cabecera completa de `collection` + conteo de `collection_detail` y
`collection_payment`) de los 3 IGTF contra 3 cobros normales: **estructura idéntica** (1 detalle + 1 pago
cada uno), `st_collection=1`, `id_user=275`, `co_operation='I'`, `has_igtf=false`, `nu_amount_igtf=0`,
`nu_difference=0`, sin nulos anómalos, sin caracteres raros en `tx_comment`/`na_responsible`/`na_client`,
`coordenada` bien formada, `id_deposit=null` en todos. **Clientes distintos** (CAR090 · CAR064 · CAR473),
**montos de 3 órdenes de magnitud distintos** (9.167,98 · 21.231,50 · 5,88).

**El único campo que los separa de los que sí pintan es `co_type = 3`** (más su corolario
`id_original_collection` no nulo — pero `Retención`, que también apunta a un cobro original, pinta bien).

Distribución en BD (`co_operation<>'D'`): `co_type=3` existe **3 veces en todo el tenant** — 2 en la empresa 2
(21831, 21835) y 1 en la empresa 3 (21836). Son **las 3 que probé, y las 3 rompen**.

---

## 6 · Pista de causa raíz (para desarrollo, no verificada en código)

El `<select>` **`Tipo Cobro`** trae la opción **`IGTF` DUPLICADA**, las dos con `value=3`:

```
Tipo Cobro | v=    ·  Cobros | v=0  ·  Anticipo/Prepago | v=1  ·  Retención | v=2
IGTF | v=3         ·  IGTF | v=3    ←  DUPLICADA          ·  Cobro 25% | v=4
```

Reconfirma `COB-TIPO-IGTF-DUPLICADO`. **Los dos síntomas apuntan al mismo lugar: el catálogo del tipo 3
está mal armado.** Hipótesis: al resolver la etiqueta del tipo 3 para pintar la columna *Tipo de Cobro*, la
resolución es ambigua o falla, revienta el render de la fila y JSF descarta el `<tbody>` **entero** — de ahí
que el conteo (que sale del `count`, no del render) siga siendo correcto. Encaja con que `Retención` (tipo
único en el catálogo) pinte bien.

---

## 7 · Severidad final — 🔴 **BLOQUEANTE · NO-GO**

Sube de "alto" a **bloqueante**, y la razón es que **ya no se acota**:

| Antes de esta prueba | Ahora |
|---|---|
| 1 registro puntual (`21831`) | **el tipo entero** — cualquier IGTF, actual o futuro |
| 1 empresa en blanco | **2 de 3 empresas en blanco**, y la 3ª solo porque aún no emitió IGTF |
| "se borra el dato y se sigue" | **no hay workaround**: borrar el dato no evita el próximo cobro IGTF |

- **Módulo afectado:** Cobros, el más usado del cliente (**19.771** cobros, **18.086** solo en `DDHP_A12`).
- **Alcance funcional:** el operador ve el total, los montos de cabecera y el paginador, y **ninguna fila**.
  No puede consultar, ni depositar, ni auditar ningún cobro de esa empresa.
- **Disparador:** un cobro IGTF **normal hecho desde el móvil**. difranca **usa IGTF**
  (`userCanSelectIGTF=true`). No hace falta ningún dato de laboratorio.
- **Único paliativo mientras tanto:** filtrar por `Moneda`/rango/página que **excluya** todos los IGTF —
  inviable como operación diaria, y cada IGTF nuevo achica el conjunto usable.

**Cuenta para el go/no-go del tag 20 y, por sí solo, lo bloquea.**

---

## Método (replicado del que confirmó el defecto)

- **Vista nueva por `page.goto`** al cambiar de empresa o de tipo de filtro.
- **`value` de TODOS los selects leído y registrado antes de cada `Buscar`** — está en cada medición.
- Empresa anclada al **TEXTO** de la `<option>`, nunca al `value`. Guarda de tenant verificada: el selector
  trae las 3 empresas de difranca (`*DISTRIBUIDORA DIAZ HERNANDEZ *` v=2 · `DIFRANCA C.A` v=3 ·
  `DISTRIBUIDORA DH VITAL, C.A.` v=4).
- Selects cambiados por **`label.click()` → `<li>` del `_panel` por texto → espera 2,2 s → verificación del
  `.ui-selectonemenu-label` **y** del `value` del `<select>` espejo**.
- Doble medición siempre: **`Total de Resultados`** (contados) **y `<tr>` reales del `tbody`** (pintados).
- Credenciales tipeadas por `browser_type`; **nunca escritas en salida ni en archivo**.

### 🔴 Trampa nueva encontrada (para los selectores)

**El ajax de cambio de Empresa REPOBLA las fechas.** Al limpiar `dateB_input`/`dateF_input` *antes* de
cambiar Empresa, el re-render del panel las devolvió a `01/07/2026–31/07/2026`. Con esas fechas puestas,
un `# Ref` de hoy da **0 contados** y se lee como "el registro no existe" — **falso `WEB-MISSING` servido en
bandeja**. ⇒ **Limpiar las fechas SIEMPRE DESPUÉS del último cambio de `<select>`, y releer su `value`
justo antes de `Buscar`.** Se suma a `FILTROS-PERSISTEN-EN-SESION`.

Confirmado además que el panel llegó con **`Empresa = DH VITAL` (la 3ª) y fechas de julio persistidas** en
la primera carga fresca de la tanda, sin que nadie las tocara.

*Prueba decisiva · 2026-08-07 · difranca / EL YAQUE · READ-ONLY*

> ✅ consolidado 2026-08-07
> ⚠ **Nota de la consolidación:** el veredicto «BLOQUEANTE · NO-GO» de §7 **no se promovió a
> `web-selectors/`**. QA dejó `COB-LISTA-RENDER-VACIO` **EN OBSERVACIÓN** (contraejemplo: `el_palmar` /
> Isla Coche tiene 10 cobros `co_type=3` y su lista web funciona ⇒ apunta a la **versión desplegada**, no al
> tipo de cobro). La evidencia sí quedó escrita en `web-selectors/cobros.md` para que la próxima corrida la
> re-verifique.
