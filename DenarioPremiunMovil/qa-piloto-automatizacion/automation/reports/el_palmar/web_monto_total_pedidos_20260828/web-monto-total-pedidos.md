# Web · Pedidos · Indicador «Monto Total» — validación del fix

**Cliente:** el_palmar · **Playa:** Caribe · **Fecha:** 2026-08-28
**Empresas medidas:** CENTRAL EL PALMAR, S.A. (`1002` / `id_enterprise=1`) y
C.A. DESTILERIA YARACUY (`1003` / `id_enterprise=2`)
**Alcance:** SOLO LECTURA — únicamente `Buscar` y los filtros de empresa y fecha.

---

## VEREDICTO

### ✅ PASA — el indicador «Monto Total» de Pedidos es fiel a la base de datos

Tres escenarios medidos, **tres coincidencias exactas al cuarto decimal**, incluido el caso de
**mezcla de monedas** que es el que originó el escape de la v21.

---

## Qué se corrigió

La cabecera de Pedidos mostraba `Monto total en USD: 0,00`. El caso `DW-X21` lo dejó anotado como
**pendiente de dictaminar con BD**, con la reserva de que *«puede ser fiel si todos son en BS»*.

**Esa reserva queda descartada con datos:** en El Palmar prácticamente todo se factura en USD.

| Moneda | Pedidos (histórico, empresa 1) | Suma |
|---|---|---|
| **USD** | **11.730** | 48.200.994,51 |
| VES | 2 | 7.037,88 |

Un `0,00` en USD con ese universo de datos **no podía ser fiel**. El defecto era real y hoy no reproduce.

---

## Las tres mediciones

Cada oráculo se calculó **en BD antes de mirar la pantalla**.

### W1 · 🔑 Mezcla de monedas — El Palmar, noviembre 2025

**El escenario que importa:** 6 pedidos nativos en USD + 2 nativos en VES en el mismo listado.

| Indicador | Oráculo BD | Web | |
|---|---|---|---|
| Monto Total **USD** | 163.983,5733 | **163.983,5733** | ✅ |
| Monto Total **VES** | 29.730.828,5754 | **29.730.828,5754** | ✅ |
| Total de Resultados | 8 | **8** | ✅ |

**Desglose del oráculo — así se compone cada indicador:**

| | Nativos | + Conversión de los de la otra moneda | = Total |
|---|---|---|---|
| USD | 163.938,5442 (6 ped.) | 45,0291 (los 2 en VES) | **163.983,5733** |
| VES | 8.163,9408 (2 ped.) | 29.722.664,6346 (los 6 en USD) | **29.730.828,5754** |

⇒ El indicador **suma los nativos más la conversión de los ajenos**, que es el comportamiento correcto.
Se comprueba fila a fila: el pedido `13797` es nativo VES (`7.006,32 VES`) y su conversión se muestra
en `44,8272 USD`.

📷 `img/W1-mezcla-monedas-nov2025.png`

### W2 · Mes corriente — El Palmar, 01–28/08/2026

| Indicador | Oráculo BD | Web | |
|---|---|---|---|
| Monto Total **USD** | 3.370,7357 | **3.370,7357** | ✅ |
| Monto Total **VES** | 2.299.238,7491 | **2.299.238,7491** | ✅ |
| Total de Resultados | 11 | **11** | ✅ |

📷 `img/W2-agosto2026-elpalmar.png`

### W3 · Otra empresa — Yaracuy, 01–28/08/2026

| Indicador | Oráculo BD | Web | |
|---|---|---|---|
| Monto Total **USD** | 809,2744 | **809,2744** | ✅ |
| Monto Total **VES** | 574.584,8240 | **574.584,8240** | ✅ |
| Total de Resultados | 7 | **7** | ✅ |

---

## 🔑 Qué columna suma el indicador — dato para futuras validaciones

Durante la medición apareció una discrepancia aparente que **no era defecto**, y conviene dejarla
anotada para que nadie la reporte de nuevo:

| Columna BD | Suma (Yaracuy, agosto) | Qué es |
|---|---|---|
| `nu_amount_total_base` | 703,9400 | base **sin IVA** — es la 1ª columna numérica de la fila |
| `nu_amount_tax` | 105,3344 | el IVA |
| **`nu_amount_total`** | **809,2744** | **con IVA — es lo que suma el indicador** ✅ |
| `nu_amount_total_conversion` | 574.584,8240 | el equivalente en la otra moneda ✅ |
| `nu_amount_final` | 703,9400 | coincide con la base sólo porque aquí no hay descuento |

⚠ **Cotejar el indicador contra `nu_amount_final` da un falso positivo.** El par correcto es
**`nu_amount_total` / `nu_amount_total_conversion`**.

Y ojo con la lectura de la fila: muestra **dos importes en la moneda nativa** (base y total-con-IVA)
antes del convertido. La etiqueta «Monto Total» de la tabla corresponde al **segundo**.

---

## Notas de entorno

- 🔴 **La playa de El Palmar es CARIBE** (`denariocaribe.ddns.net:8080`), no Isla Coche. El mapa de
  playas del 25/08 estaba desactualizado — **las playas rotan, hay que confirmarlas antes de cada corrida.**
- ⚠ **La empresa que trae por defecto la pantalla es DESTILERÍA YARACUY (1003), no El Palmar.** Hay que
  cambiarla explícitamente, y **leer el valor seleccionado del selector**, nunca la primera opción de
  la lista.
- El filtro de fecha por defecto es el mes corriente (01/08/2026 – 28/08/2026).

---

## Lo que NO se validó

- **El Excel descargado**: no se comprobó que sus totales coincidan con los de la cabecera.
- **La paginación**: los tres casos caben en una página (7, 8 y 11 filas). **No se midió si el indicador
  suma el listado completo o sólo la página visible** — con 2.000+ resultados podría diferir.
  ⚠ Es el riesgo que queda vivo: el escape original se observó justamente con **2.284 resultados**, y
  El Palmar no tiene volumen suficiente para reproducir esa condición.
- **Otros indicadores de la cabecera** distintos de Monto Total VES/USD.
- **Facturaciones**: sólo se midió Pedidos.
- El comportamiento con **descuento global** (`nu_amount_global_discount`), que en estos datos es 0.
