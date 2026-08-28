# Validación del indicador «Monto Total» — Pedidos (web) · playas Isla Coche y La Tortuga

- **Fecha de corrida:** 28/08/2026
- **Alcance:** SOLO LECTURA sobre producción (empresa, fechas, Buscar, paginador). No se tocó ningún botón de escritura.
- **Defecto que se valida:** cabecera de Pedidos mostrando `Monto total en USD: 0,00` con miles de resultados (escape v21).
- **Oráculo:** `sum(nu_amount_total)` (nativo) + `sum(nu_amount_total_conversion)` (de la otra moneda), tabla `"order"`, filtrado por `id_enterprise` (BD) — no por `co_enterprise`.
- **Playas ya validadas en corridas previas (no se repitieron):** Caribe (el_palmar) ✅ y El Yaque (insumar) ✅.

---

## 1. VEREDICTO

| Playa | Cliente / tenant | Empresa validada | C1 · Mezcla monedas | C2 · Mes corriente | C3 · Paginación | Veredicto |
|---|---|---|---|---|---|---|
| **Isla Coche** (`denarioislacoche.ddns.net:8080`) | COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. (BD `global_mp`) | `00002` / `id_enterprise=2` | ✅ **PASS** (mezcla real BS+USD) | ✅ **PASS** | ✅ **PASS** | ✅ **PASS** |
| **Isla Coche** — 2ª empresa (cobertura extra) | mismo tenant | `00001` / `id_enterprise=1` — HC TRADING MARKET 2021, C.A | ⛔ no medible (solo USD) | ✅ **PASS** (\*) | ✅ **PASS** | ✅ **PASS** |
| **La Tortuga** (`denariolatortuga.ddns.net:8080`) | PIERCAR REPUESTOS C.A. (BD `piercar`) | `INVLDJ_AA` / `id_enterprise=1` (única) | ⛔ **no medible** — no hay mezcla en los datos | ✅ **PASS** | ✅ **PASS** | ✅ **PASS con salvedad** (C1 no medible) |

(\*) Cuadra al céntimo contra el subconjunto de pedidos con vendedor visible en `salesman_view`; ver **Hallazgo H1**.

**Conclusión:** en las dos playas pendientes el indicador «Monto Total» es **fiel al listado y a la BD**. El escape de la v21 (`0,00` con miles de resultados) **no reproduce** en ninguna de las dos. Con esto quedan cubiertas las 4 playas (Caribe, El Yaque, Isla Coche, La Tortuga).

---

## 2. Isla Coche — GLOBAL M&P

**Identificación:** al entrar, el selector de empresa venía posicionado en `COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.` (se leyó el valor **seleccionado**, `.ui-selectonemenu-label`, no la primera opción de la lista). Rótulos del indicador en este tenant: **`Monto Total BS`** y **`Monto Total USD`**.

Correspondencia UI ↔ BD verificada con `SELECT id_enterprise, co_enterprise, na_enterprise FROM enterprise`:

| `co_enterprise` (UI) | `id_enterprise` (BD) | Nombre |
|---|---|---|
| `00001` | 1 | HC TRADING MARKET 2021, C.A |
| `00002` | 2 | COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. |

### C1 · Mezcla de monedas — empresa `00002`, 27/08/2026 – 27/08/2026 🔑

Rango elegido porque contiene el **único pedido nativo en BS** del tenant (`co_order 1787868573394.0`, 27/08/2026 18:10) junto a 8 pedidos nativos en USD → mezcla real.

Oráculo BD:

| `co_currency` | pedidos | `sum(nu_amount_total)` | `sum(nu_amount_total_conversion)` |
|---|---|---|---|
| BS | 1 | 126.357,0165 | 160,9500 |
| USD | 8 | 1.435,9200 | 1.127.297,7144 |

| Indicador | Oráculo BD (nativos + conversión de la otra moneda) | Web | Resultado |
|---|---|---|---|
| Monto Total **USD** | 1.435,9200 + 160,9500 = **1.596,87** | **1.596,87** | ✅ |
| Monto Total **BS** | 126.357,0165 + 1.127.297,7144 = **1.253.654,7309** | **1.253.654,73** | ✅ |
| Nº de filas | 9 | 9 | ✅ |

Comprobación adicional: la suma manual de las 9 filas del listado (columna *Monto Total* + columna *Monto conv.*, según la moneda de cada fila) da exactamente 1.596,87 USD y 1.253.654,73 BS. La fila en BS (ref. 18576) aparece como `126.357,02 BS | 160,95 USD`, con su conversión correctamente incorporada al indicador en USD.

Captura: `img/coche_C1_mezcla_monedas.png`

### C2 · Mes corriente — empresa `00002`, 01/08/2026 – 28/08/2026

Es el rango que la pantalla trae por defecto; se validó tal cual.

| Indicador | Oráculo BD | Web | Resultado |
|---|---|---|---|
| Monto Total **USD** | 698.945,6494 + 160,9500 = **699.106,5994** | **699.106,60** | ✅ |
| Monto Total **BS** | 126.357,0165 + 531.879.108,1613 = **532.005.465,1778** | **532.005.465,18** | ✅ |
| Total Base **USD** | 638.806,35 + 160,95 = **638.967,30** | **638.967,30** | ✅ |
| Total Base **BS** | 126.357,02 + 486.169.620,86 = **486.295.977,88** | **486.295.977,88** | ✅ |
| Nº de pedidos | 2.293 | 2.293 (46 páginas × 50) | ✅ |

`salesman_view`: los 2.293 pedidos del rango tienen vendedor visible → no hay pérdida de filas.

Captura: `img/coche_C2_mes_corriente.png`

### C3 · Paginación — empresa `00002` (2.293 resultados, página de 50)

| Comprobación | Valor | Resultado |
|---|---|---|
| Suma de las 50 filas de la página 1 | 18.962,77 USD — **muy inferior** al indicador 699.106,60 | ✅ el indicador no es la página |
| Indicador en página 1 (1ª ref. 18578) | USD 699.106,60 / BS 532.005.465,18 | — |
| Indicador en página 2 (1ª ref. 18524) | USD 699.106,60 / BS 532.005.465,18 | ✅ idéntico |
| Indicador en página 3 (1ª ref. 18474) | USD 699.106,60 / BS 532.005.465,18 | ✅ idéntico |

Captura: `img/coche_C3_pagina3.png`

### Cobertura extra · empresa `00001` (HC TRADING MARKET 2021) — 01/08 – 28/08/2026

Se cambió el selector de empresa para comprobar que el indicador responde al filtro. **Sí responde**, y su valor coincide al céntimo con el subconjunto de pedidos efectivamente listados:

| Indicador | Oráculo BD **total del rango** | Oráculo BD **solo con vendedor en `salesman_view`** | Web | Resultado |
|---|---|---|---|---|
| Monto Total USD | 232.001,5374 | **231.374,17** | **231.374,17** | ✅ vs. listado |
| Monto Total BS | 176.717.534,2234 | **176.243.123,10** | **176.243.123,10** | ✅ vs. listado |
| Nº de pedidos | 340 | **336** | **336** (6×50 + 36) | ✅ vs. listado |

→ La diferencia frente al total bruto (627,36 USD / 474.411,12 BS, 4 pedidos) se explica **íntegramente** por el filtro de `salesman_view`; **no es un fallo del indicador**, que suma exactamente lo que se lista. Ver **Hallazgo H1**.

Captura: `img/coche_emp00001_hctrading_salesmanview.png`

---

## 3. La Tortuga — PIERCAR REPUESTOS C.A.

**Identificación:** el selector de empresa trae una **única** opción, ya seleccionada: `PIERCAR REPUESTOS C.A.`, `co_enterprise = INVLDJ_AA` → `id_enterprise = 1` en la BD `piercar`. Rótulos del indicador: **`Monto Total BS`** / **`Monto Total USD`**.

### C1 · Mezcla de monedas — ⛔ NO MEDIBLE

`SELECT co_currency, to_char(da_order,'YYYY-MM'), count(*) FROM "order" GROUP BY 1,2` devuelve **únicamente `USD`** en todo el histórico del tenant (2026-06: 28, 2026-07: 196, 2026-08: 178). No existe ningún pedido nativo en BS.

> **C1 no medible en La Tortuga: no hay mezcla de monedas en los datos.** Con una sola moneda nativa el indicador no puede fallar por composición, así que un PASS aquí no significaría nada y **no se da por bueno**. La cobertura de C1 queda aportada por Isla Coche (arriba) y por Caribe/el_palmar (corrida previa).

### C2 · Mes corriente — 01/08/2026 – 28/08/2026

Rango por defecto de la pantalla.

| Indicador | Oráculo BD | Web | Resultado |
|---|---|---|---|
| Monto Total **USD** | `sum(nu_amount_total)` = **136.133,0328** | **136.133,03** | ✅ |
| Monto Total **BS** | `sum(nu_amount_total_conversion)` = **104.001.926,0702** | **104.001.926,07** | ✅ |
| Total Base **USD** | `sum(nu_amount_total_base)` = **211.207,83** | **211.207,83** | ✅ |
| Total IVA **USD** | `sum(nu_amount_tax)` = **0,00** | **0,00** | ✅ |
| Nº de pedidos | 178 | 178 (3×50 + 28) | ✅ |

`salesman_view`: los 178 pedidos tienen vendedor visible → el listado no pierde filas.

> Nota de método: se cotejó contra `nu_amount_total`, **no** contra `nu_amount_final` (que aquí vale también 136.133,0328 y por tanto no delataría el error, pero en otros tenants sí produce falso positivo).

Captura: `img/tortuga_C2_mes_corriente.png`

### C3 · Paginación — 178 resultados, página de 50

| Página | 1ª ref. | Filas | Suma de la página (USD) | Indicador USD | Indicador BS |
|---|---|---|---|---|---|
| 1 | 402 | 50 | 26.041,50 | 136.133,03 | 104.001.926,07 |
| 2 | 352 | 50 | 41.546,16 | 136.133,03 | 104.001.926,07 |
| 3 | 302 | 50 | 43.724,72 | 136.133,03 | 104.001.926,07 |
| 4 | 252 | 28 | 24.820,64 | 136.133,03 | 104.001.926,07 |

- ✅ La suma de la página 1 (26.041,50) es **muy inferior** al indicador → el indicador no se limita a la página visible.
- ✅ El indicador es **idéntico** en las 4 páginas mientras el contenido de las filas cambia.
- ✅ **Comprobación fuerte adicional:** la suma de las **4 páginas** = 136.133,02 USD ≈ indicador 136.133,03 (diferencia de 0,01 por redondeo a 2 decimales fila a fila) y 104.001.926,10 BS ≈ 104.001.926,07. El indicador es efectivamente **la suma del listado completo**.

Captura: `img/tortuga_C3_pagina4.png`

---

## 4. Hallazgos aparte (fuera del defecto validado)

### H1 · Pedidos ocultos por `salesman_view` — Isla Coche, empresa `00001` · 🟡 conocido, confirmado otra vez

4 pedidos del rango 01/08–28/08 (627,36 USD / 474.411,12 BS) **no aparecen en el listado** porque su `id_user` no está en `salesman_view` para esa empresa. El indicador es coherente con lo listado (suma 336 de 340), así que **no es un fallo del indicador**, pero sí implica que la pantalla de Pedidos **no muestra la totalidad de los pedidos del período**.

```sql
SELECT CASE WHEN sv.id_user IS NULL THEN 'sin vendedor visible' ELSE 'con vendedor' END AS situacion,
       count(*), round(sum(o.nu_amount_total)::numeric,2)
FROM "order" o LEFT JOIN salesman_view sv
  ON sv.id_user=o.id_user AND sv.id_enterprise=o.id_enterprise
WHERE o.id_enterprise=1 AND o.da_order >= '2026-08-01' AND o.da_order < '2026-08-29'
GROUP BY 1;
-- sin vendedor visible | 4   | 627.36
-- con vendedor         | 336 | 231374.17
```

Coincide con lo ya documentado en corridas anteriores (5º tenant, grupo_fiel 17/08). Se anota como **confirmación**, no como defecto nuevo.

### H2 · «Total Descuentos» muestra 0,00 con descuentos reales en BD — La Tortuga · 🟠 a confirmar con desarrollo

La cabecera de Piercar no cuadra consigo misma: `Total Base 211.207,83 − Descuentos 0,00 + IVA 0,00 = 211.207,83`, pero `Monto Total = 136.133,03`. En BD la diferencia está perfectamente explicada:

| Concepto (BD, 01/08–28/08, `id_enterprise=1`) | Valor |
|---|---|
| `sum(nu_amount_total_base)` | 211.207,83 |
| `sum(nu_amount_total_base - nu_amount_total)` | **75.074,80** |
| `sum(nu_amount_discount)` | **75.074,80** ← coincide exactamente |
| `sum(nu_amount_global_discount)` | 7.952,11 |
| `sum(nu_amount_total_product_discount)` | 0,00 |
| `sum(nu_amount_total)` | 136.133,03 |

102 de los 178 pedidos tienen `nu_amount_discount > 0`. El rótulo **«Total Descuentos USD/BS» muestra 0,00**, lo que hace que la cabecera no reconcilie a la vista del usuario.

⚠ **No se marca como defecto confirmado** porque no se pudo determinar qué columna alimenta ese rótulo: si es `nu_amount_total_product_discount` (0,00) el valor sería correcto por diseño; si es `nu_amount_discount` (75.074,80) es un fallo. **Requiere confirmación de desarrollo.** El indicador bajo validación («Monto Total») es correcto en cualquiera de los dos casos.

### H3 · `nu_amount_tax` es NULL en la mayoría de pedidos (Global M&P) · ℹ informativo — no es defecto

En `global_mp` empresa 2, `nu_amount_tax` está en NULL en 1.909 de 2.292 pedidos USD del mes. Cotejar el IVA con `sum(nu_amount_tax)` da 8.661,92 y parece un descuadre frente al 60.139,30 de la web; el IVA real (`sum(nu_amount_total - nu_amount_total_base)` = **60.139,30**) coincide **exactamente** con la web. **La web está bien; el oráculo ingenuo estaba mal.** Se deja anotado para que futuras corridas no reporten un falso positivo por esta vía.

---

## 5. Lo que NO se validó

| Punto | Motivo |
|---|---|
| **C1 en La Tortuga (Piercar)** | ⛔ No medible: el tenant no tiene ningún pedido nativo en BS en todo su histórico. Un PASS con una sola moneda no aporta evidencia. |
| **C1 en Isla Coche empresa `00001`** | ⛔ No medible por la misma razón (solo USD en esa empresa). Cubierto por la empresa `00002`. |
| **Playas Caribe y El Yaque** | Validadas y aprobadas en corrida previa; no se repitieron por instrucción explícita. |
| Filtros Vendedor, Cliente, Tipo Pedido, Moneda, Status, Tiene Adjunto | Fuera del alcance acordado (solo empresa, fechas, Buscar y paginador). |
| Cualquier acción de escritura (Guardar, Aprobar, Editar, Eliminar, Consultar-y-modificar, selector de estatus de fila) | Prohibido: la web es producción y la corrida es de solo lectura. |
| Rangos históricos anteriores a 08/2026 | No necesarios: C1 y C2 quedaron cubiertos con datos del mes corriente. |
| Origen exacto del rótulo «Total Descuentos» | Requiere revisión de código/consulta a desarrollo (H2). |

---

## 6. Capturas

| Archivo | Contenido |
|---|---|
| `img/coche_C1_mezcla_monedas.png` | Isla Coche · emp. 00002 · 27/08/2026 · 9 pedidos, mezcla BS+USD |
| `img/coche_C2_mes_corriente.png` | Isla Coche · emp. 00002 · 01/08–28/08 · 2.293 pedidos |
| `img/coche_C3_pagina3.png` | Isla Coche · emp. 00002 · página 3, indicador invariable |
| `img/coche_emp00001_hctrading_salesmanview.png` | Isla Coche · emp. 00001 · última página (336 filas) |
| `img/tortuga_C2_mes_corriente.png` | La Tortuga · Piercar · 01/08–28/08 · 178 pedidos |
| `img/tortuga_C3_pagina4.png` | La Tortuga · Piercar · página 4 (28 filas), indicador invariable |

---

## 7. Notas de ejecución

- Login con el usuario web compartido, inyectado vía portapapeles; el portapapeles se limpió tras cada login. **Ninguna credencial aparece en este informe ni en las capturas.**
- Tras cada `Buscar` se esperaron ~8–9 s por el repintado AJAX de JSF/PrimeFaces.
- Los indicadores se leyeron del contenedor `.pedidos-total-row` completo (el número vive en un `<span>` aparte; un regex sobre `innerText` lo cortaría y lo haría parecer vacío).
- Playas: `denarioislacoche.ddns.net:8080` → tenant **Global M&P**; `denariolatortuga.ddns.net:8080` → tenant **Piercar**. Asignación **rotativa**, válida solo para el 28/08/2026; no se guarda en ningún perfil de cliente.
