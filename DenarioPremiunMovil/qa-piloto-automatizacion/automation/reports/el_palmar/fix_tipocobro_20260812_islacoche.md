# Fix filtro `Tipo Cobro` + indicadores de Monto total — ISLA COCHE / `el_palmar`

**RUN_ID** `fix_tipocobro_20260812` · **Fecha** 2026-08-12 · **Capa** web, read-only
**Playa** `http://denarioislacoche.ddns.net:8080/DenarioPremium` — host afirmado en **cada** lectura
**Tenant** `el_palmar` — empresas descubiertas por texto: `CENTRAL EL PALMAR, S.A.` (1002) ·
`C.A. DESTILERIA YARACUY` (1003). **Ninguna empresa ajena.** Guarda de tenant: ✅

## Parámetros de la medición

| | |
|---|---|
| Empresa medida | **CENTRAL EL PALMAR, S.A.** (`co_enterprise=1002`, `id_enterprise=1`) — verificada en las 9 lecturas |
| Rango | **01/10/2025 – 31/07/2026** (por `da_collection`, según la consigna) |
| Oráculo BD | `co_operation<>'D' AND co_enterprise='1002' AND da_collection >= '2025-10-01' AND da_collection < '2026-08-01'` |
| Evidencia de ajax | hook a `XMLHttpRequest`: contador `0→9`, **una petición al servidor por cada `Buscar`** |
| Conteo web | `paginator.cfg.rowCount` + `Total de Resultados` + filas pintadas — los tres coincidieron siempre |

⚠ **El rango se cerró en 31/07/2026 a propósito.** Con el rango abierto hasta hoy los conteos se mueven
durante la corrida: el tenant es productivo y hoy 12/08 entraron **6 cobros nuevos** (uno de ellos IGTF)
mientras se medía. Primera medición con rango a hoy: web 325 / BD 329 — misma diferencia de 4, ya explicada abajo.

---

## A · Filtro `Tipo Cobro` — **ARREGLADO** ✅ (5/5 opciones + total)

| Opción | `co_type` | Web | BD | Veredicto |
|---|---|---|---|---|
| Cobros | 0 | **130** | **134** | ⚠ **−4** — *no es el filtro*, ver §A.2 |
| Anticipo/Prepago | 1 | **48** | **48** | ✅ OK |
| Retención | 2 | **63** | **63** | ✅ OK |
| **IGTF** | 3 | **7** | **7** | ✅ **OK** — uso real, ver §A.3 |
| Cobro 25% | 4 | **18** | **18** | ✅ OK |
| **(sin filtro)** | — | **266** | **270** | ⚠ mismo −4 |

**Ningún tipo quedó `N/A — sin datos`: en `el_palmar` las cinco opciones tienen datos reales**, incluida
`Cobro 25%` (18 documentos), que en difranca no existía y quedó sin probar.

### A.1 · El total sin filtro **es** la suma de las cinco — ✅

```
Web: 130 + 48 + 63 + 7 + 18 = 266  =  total sin filtro (266)   ✅
BD : 134 + 48 + 63 + 7 + 18 = 270  =  total sin filtro (270)   ✅
```

La partición es exacta y sin solapes: **el filtro no duplica ni pierde documentos entre opciones.**
El fix del filtro `Tipo Cobro` queda **CONFIRMADO en la 2ª playa** (El Yaque ya lo había confirmado con
5.049/6/2/3/0 = 5.060).

### A.2 · La diferencia de 4 **no es del filtro** — es un defecto nuevo de la lista

La diferencia de 4 está **íntegramente en `co_type=0`** y aparece **igual con y sin filtro**, o sea que la web
pierde esos 4 documentos en la **lista base**, no al filtrar. Acotado hasta la fila:

- `co_type=0` + `Moneda=USD`: web **13** = BD **13** ✅ → la diferencia está en VES
- `co_type=0` + `Moneda=VES`: web **117** vs BD **121** → se leyeron las **117 refs** (3 páginas) y se
  cruzaron contra las 121 de BD

**Refs omitidas: `26769`, `26774`, `26777`, `26780`.** Los cuatro son del **mismo vendedor**.
Detalle en §C (defecto nuevo).

### A.3 · IGTF con uso real — el mejor resultado de la corrida ✅

Los 7 IGTF del rango salieron **exactos** y son **producción real, no laboratorio**:

| # Ref | Fecha | Monto | Vendedor |
|---|---|---|---|
| 26902 | 27/11/2025 | 22.000,0000 VES | Guarique Guarique |
| 26897 | 12/11/2025 | 22.200,0000 VES | Guarique Guarique |
| 26889 | 11/11/2025 | 212.200,0000 VES | Luis Diaz |
| 26870 | 10/11/2025 | **55,8000 USD** | Luis Diaz |
| 26862 | 07/11/2025 | 8.700,0000 VES | Guarique Guarique |
| 26845 | 10/10/2025 | 23.900,0000 VES | Dilcia Duarte |
| 26838 | 08/10/2025 | **115,2000 USD** | Luis Diaz |

**3 vendedores distintos · las 2 monedas del tenant · 5 VES + 2 USD.** `rowCount = filas pintadas = 7 = BD`.
(El tenant tiene 11 IGTF en total; los 4 restantes son de agosto-2026 y quedaron fuera del rango cerrado —
uno se creó **hoy** durante la corrida.)

Y los indicadores de esta misma vista cuadran **al céntimo** contra BD (ver §B.2).

---

## B · Indicadores `Monto total` — **NO omiten ninguna moneda en `el_palmar`** ✅

### B.1 · Acá los rótulos son **`VES` / `USD`**, no `BSD` / `US$`

```
Monto total en VES:   Monto total en USD:   Total de Resultados: N
```

Los rótulos se toman del `co_currency` del tenant. `el_palmar` tiene **dos monedas, pero una sola moneda
dólar**: `VES` (`id_currency=2`, 26.176 cobros) y `USD` (`id_currency=1`, 133 cobros). **No hay el par
duplicado `US$`+`USD` que rompe difranca**, y el indicador dólar está rotulado con el literal que este
tenant realmente usa.

⇒ **El defecto de El Yaque (indicador que solo reconoce `US$` y evapora los `USD`) NO se manifiesta acá.**
Es un resultado válido y **acota el alcance del defecto a los clientes con monedas dólar duplicadas.**

### B.2 · Los totales cuadran con BD **al céntimo** y **respetan el filtro**

Fórmula deducida y verificada (cada indicador es **el mismo dinero expresado en su moneda**):

```
Monto total en VES = Σ nu_amount_total (id_currency=2) + Σ nu_amount_total_conversion (id_currency=1)
Monto total en USD = Σ nu_amount_total (id_currency=1) + Σ nu_amount_total_conversion (id_currency=2)
```

| Vista | Indicador VES | BD VES | Indicador USD | BD USD |
|---|---|---|---|---|
| **sin filtro** (266) | `252.930.056,8149` | `252.930.056,8149` ✅ | `6.382.469,3773` | `6.382.469,3773` ✅ |
| **IGTF** (7) | `320.002,9327` | `289.000,0000 + 31.002,9327` = `320.002,9327` ✅ | `1.765,0106` | `171,0000 + 1.594,0106` = `1.765,0106` ✅ |

*(el oráculo BD del total sin filtro se calcula sobre los 266 documentos visibles, o sea excluyendo los 4 de §C —
con esa exclusión la coincidencia es exacta, lo que confirma que el defecto de §C es de visibilidad, no de suma)*

- **¿Respetan el filtro?** ✅ **Sí.** Cambian en las 9 mediciones y siguen a la opción elegida.
  Prueba independiente: con `co_type=0 + Moneda=USD`, el indicador USD dio `70.042,8000` y la **suma a mano
  de las 13 filas pintadas** da exactamente `70.042,8000`.
- **¿Doble conteo?** ❌ No. Los dos indicadores son el mismo dinero en dos monedas y **los rótulos lo dicen bien**.
- **Ambas monedas entran en ambos indicadores.** Ningún cobro se evapora por su moneda.

---

## C · 🔴 DEFECTO NUEVO — la web oculta los cobros de los vendedores con `co_role = 6`

**Severidad: alta.** No lo causa el filtro `Tipo Cobro`; se manifiesta **también sin ningún filtro**.

### Síntoma

Los 4 documentos omitidos (`26769`, `26774`, `26777`, `26780`) son todos de **`id_user = 273` — Leonardo
Alberto Bohorquez Parra**, que tiene exactamente **4 cobros** en el rango medido. Ese vendedor **tampoco
aparece en el combo `Vendedor`** (lista 32 nombres, sin él), pese a existir en `users` con `co_operation='I'`.

### Causa raíz — aislada

Descartados: `st_collection` (todos 6) · `co_operation` (I/U, ningún D) · cliente o usuario huérfano (0) ·
`id_original_collection` · `users_enterprise` (273 y 276 idénticos) · `salesman_view` (ambos presentes,
`st_user=1`) · `license_user` (ambos con licencia).

**El discriminante es `salesman_view.co_role`:**

| `co_role` | Vendedores | Cobros | En la web |
|---|---|---|---|
| **6** | **5** | **1.340** | ❌ **invisibles** — ni en la lista, ni en el combo, ni en los indicadores |
| 7 | 30 | 24.969 | ✅ visibles |

`1.340 + 24.969 = 26.309` = total de cobros del tenant ✅

### Alcance del daño (tenant completo, ambas empresas)

| `id_user` | Vendedor | Cobros ocultos | Período |
|---|---|---|---|
| 273 | Leonardo Alberto Bohorquez Parra | **369** (311 + 58) | abr-2025 → oct-2025 |
| 264 | Yoiselin Verónica Saavedra Silva | **294** (260 + 34) | jun-2025 → sep-2025 |
| 253 | Alejandro Marchena | **315** (229 + 86) | nov-2024 → ago-2025 |
| 280 | Roberto José Aguilera Zamora | **188** (172 + 16) | jun-2025 → sep-2025 |
| 242 | Victor Mejias | **174** (148 + 26) | nov-2024 → sep-2025 |

**1.340 cobros = 5,1 % de todos los cobros del tenant** quedan fuera de la lista **y de los dos indicadores**.
Solo el vendedor 273 acumula **513.908.377,28 VES**.

⚠ **Queda por decidir con producto si el filtro por rol es intencional.** Aunque lo fuera, el efecto observable
es que documentos de cobro reales y aprobados (`st_collection=6`) **no son consultables ni sumables** desde la
web para esta empresa — y la vista no da ninguna señal de que esté ocultando registros. Se recomienda
verificar en el código qué hace el `JOIN` con `salesman_view` y si `co_role=6` debería excluir **al vendedor
del combo** pero **no a sus documentos históricos**.

---

## D · Otros resultados

- **`Status`**: opciones reales en Isla Coche = `2 Enviado` · `12 Por aprobar` (placeholder `0`).
  ⚠ **Distintas de El Yaque** (`7 Enviado` / `27 Por aprobar`) ⇒ **no cablear estos values**.
- **`Moneda`**: `2 VES` · `1 USD` — el `value` **es** `id_currency` (a diferencia de Empresa, que en cobros
  es posicional: `1 | CENTRAL EL PALMAR, S.A.`).
- **`Tipo Cobro`** (`:idTipo`): `0 Cobros` · `1 Anticipo/Prepago` · `2 Retención` · `3 IGTF` · `4 Cobro 25%`,
  placeholder `""`. Las cinco con datos.
- Columna `Monto cobrado` puede traer **varios importes en una celda** (una línea por forma de pago) — la
  ref `26833` mostró `1.000,0000 USD / 900,0000 USD / 15,8000 USD`. Un parser que tome el primer número
  subestima la fila; el indicador **sí** los suma bien.
- Ningún filtro persistido causó ruido: se verificó el `value` **y** el `.ui-selectonemenu-label` de los 9
  `<select>` antes de cada `Buscar`, y las fechas se fijaron **después** del último combo, en todas las tandas.

## Veredicto

| Pregunta | Respuesta |
|---|---|
| ¿El filtro `Tipo Cobro` quedó arreglado? | ✅ **SÍ** — 5/5 opciones y el total coherentes |
| ¿El total sin filtro es la suma de las cinco? | ✅ **SÍ** — 266 = 130+48+63+7+18 |
| ¿IGTF con uso real? | ✅ **7/7 exacto**, 3 vendedores, 2 monedas, indicadores al céntimo |
| ¿Los indicadores omiten alguna moneda? | ✅ **NO** en `el_palmar` (una sola moneda dólar, `USD`) |
| ¿Defectos nuevos? | 🔴 **1** — `co_role=6` oculta 1.340 cobros (5,1 % del tenant) |
| ¿Se vio otro tenant? | ❌ **No** — solo las 2 empresas de `el_palmar`, host afirmado en cada lectura |
