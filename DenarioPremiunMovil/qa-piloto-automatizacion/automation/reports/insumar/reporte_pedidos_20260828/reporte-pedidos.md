# Certificación · Reporte de Pedidos (Excel) — INSUMAR · El Yaque

- **Corrida:** 28/08/2026 · sello del propio Excel: 28/8/2026 16:03:21
- **URL:** `http://denarioelyaque.ddns.net:8080/DenarioPremium/pages/pedidos`
- **Empresa (valor SELECCIONADO):** `INSUMAR DISTRIBUIDORA 715, C.A.` · `id_enterprise=1`
- **Filtro:** 01/08/2026 – 28/08/2026 · Vendedor: Todos · Cliente: Todos
- **Playa recién actualizada**, sesión iniciada de cero. Las cifras de pantalla son **idénticas** a las de
  antes de la actualización (143 / 16.111.597,57 BS / 20.834,74 US$) ⇒ la actualización no tocó el listado
  ni los indicadores.

---

## 1 · CERTIFICACIÓN

| Reporte | Veredicto | Motivo |
|---|---|---|
| **R1 · GENERAL** | 🔴 **NO CONFORME** | Reproduce con exactitud lo que muestra la pantalla, pero **hereda el hueco del listado**: quedan fuera **128 pedidos vivos** (US$ 17.854,25 / BS 13.830.875,36) que sí existen en BD |
| **R2 · DETALLADO** | 🔴 **NO CONFORME** | Mismo hueco **+ defecto propio**: emite **una fila por unidad de venta y no por línea de pedido**, repitiendo el importe ⇒ **infla el reporte en 61,5728 US$ / 47.217,72 BS** |
| **R3 · Coherencia** | ✅ **CONFORME** | Los 143 `# Ref` coinciden exactamente entre ambos ficheros. 0 huérfanos, 0 pedidos sin líneas |
| **R4 · Indicador** | ✅ **CONFORME** | Constante en las 3 páginas; suma el listado completo, no la página visible |

> R1 es **fiel a su fuente** (la pantalla). Se marca NO CONFORME porque como documento de negocio
> **omite ventas reales**. El defecto de origen está en el listado; el de R2 sí es del exportador.

---

## 2 · LA RESPUESTA A LA PREGUNTA CRÍTICA

> **¿El Excel exporta las del listado, las 295 de la BD, u otra cosa?**

### ➜ Exporta **EXACTAMENTE lo listado: las 143. Ni una más.**

| Medición | Pantalla | Excel General | BD (esos 143 `id_order`) |
|---|---|---|---|
| Nº de pedidos | **143** | **143** | **143** |
| Monto Total US$ | **20.834,74** | **20.834,74** | **20.834,74** |
| Monto Total BS | **16.111.597,57** | **16.111.597,57** | **16.111.597,57** |

Se extrajeron los 143 `# Ref` de pantalla (paginador a 200) y los 143 del Excel: **misma lista, mismo
orden, elemento por elemento**.

⇒ **El reporte hereda el hueco.** Hay ventas que no salen en ningún lado: ni en pantalla, ni en el
General, ni en el Detallado.

### Desglose del universo (295 pedidos del rango)

| Grupo | Pedidos | US$ | BS | ¿Sale en el Excel? |
|---|---:|---:|---:|---|
| Vendedor en `salesman_view` y no borrado | **143** | 20.834,74 | 16.111.597,57 | ✅ Sí |
| **Vendedor NO en `salesman_view`, pedido VIVO** | **128** | **17.854,25** | **13.830.875,36** | 🔴 **NO — ventas reales perdidas** |
| Borrados lógicamente (`co_operation='D'`) | 24 | 5.064,59 | 3.854.312,12 | ✅ No (correcto) |
| **Total BD** | **295** | **43.753,57** | **33.796.785,04** | |

### Criterio real del listado — DETERMINADO

```sql
sv.id_user IS NOT NULL        -- el id_user del pedido está en salesman_view de esa empresa
  AND o.co_operation <> 'D'   -- el pedido no está borrado lógicamente
```

Verificado por agrupación cruzada sobre los 295: los tres grupos son limpios y mutuamente excluyentes.

⚠ **Por qué la hipótesis previa parecía cuadrar y era coincidencia:** el conteo «sin vendedor visible»
daba también 143 — pero es **otro** conjunto de 143 (US$ 19.286,24, no 20.834,74). **Dos 143 distintos
que se cruzaron por casualidad.** De ahí que el conteo cuadrara y la suma no.

### 🔴 Causa raíz: vendedora **borrada y recreada**

| `id_user` | Nombre | login | `co_operation` | Creado | ¿En `salesman_view`? | Pedidos vivos 01–28/08 |
|---:|---|---|---|---|---|---:|
| **13** | EVA MEDINA | `R003` | **`D`** (baja) | 15/07/2026 | 🔴 **NO** | **128** (12/08 – 24/08) |
| 22 | EVA MEDINA | `r003` | `I` | **25/08/2026** | ✅ Sí | 8 |

EVA MEDINA fue **borrada y recreada el 25/08/2026 con un `id_user` nuevo**. Sus **128 pedidos del 12 al
24 de agosto** siguen colgados del `id_user` antiguo (13), ausente de `salesman_view` ⇒ **desaparecen del
listado y de los dos reportes**. Los 8 posteriores sí salen. Afecta a **1.247 líneas de producto**.

> Coincide con el patrón ya documentado: el join va por `id_user`, no por `co_user`.
> **Sexta confirmación, y en producción.**

---

## 3 · Oráculo BD | Excel | Veredicto

### R1 · GENERAL — `descargas/pedidos-GENERAL.xlsx`

| # | Comprobación | Oráculo BD | Excel | |
|---|---|---|---|:--:|
| R1.2a | Filas vs pantalla | 143 | **143** | ✅ |
| R1.2b | Filas vs universo BD del rango | **295** | **143** | 🔴 |
| R1.3a | Suma `Monto Total` US$ | 20.834,74 / **43.753,57 (BD)** | **20.834,74** | ✅ vs listado · 🔴 vs BD |
| R1.3b | Suma `Monto Conversion` BS | 16.111.597,57 / **33.796.785,04 (BD)** | **16.111.597,57** | ✅ vs listado · 🔴 vs BD |
| R1.3c | Suma `Monto Base` US$ | 20.834,74 | 20.834,74 | ✅ |
| R1.4 | Fidelidad fila a fila (5 pedidos) | §4 | 5/5 | ✅ |
| R1.5 | Cabeceras y alineación | — | fila 10, 16 cab. / 16 col. | ✅ |
| R1.x | Duplicados de `# Ref` | 143 únicos | 143 únicos, 0 duplicados | ✅ |

### R2 · DETALLADO — `descargas/pedidos-DETALLE.xlsx`

| # | Comprobación | Oráculo BD | Excel | |
|---|---|---|---|:--:|
| R2.2a | Filas vs líneas del rango completo | **2.512** (`order_detail`, 295 ped.) | **1.085** | 🔴 |
| R2.2b | Filas vs líneas de **los 143 listados** | **1.084** | **1.085** | 🔴 (+1) |
| R2.2c | Filas vs **unidades** de los 143 | **1.085** (`order_detail_unit`) | **1.085** | ⚠ cuadra aquí |
| R2.3 | Cuadre vertical | — | **4 de 5 al céntimo**; falla el pedido 71 | 🔴 |
| R2.3b | Suma global `Total Producto` US$ | 20.834,7412 | **20.896,31** (+61,5728) | 🔴 |
| R2.3c | Suma global `Total Conversión` BS | 16.111.597,5709 | **16.158.815,29** (+47.217,72) | 🔴 |
| R2.4 | Fidelidad de línea (5 líneas) | §4 | 5/5 | ✅ |
| R2.y | `# Detalles` (General) vs filas del Detalle | — | discrepa en **1 de 143** (ref 71) | 🔴 |

**El Detallado no cuadra con ninguno de los dos oráculos esperados.** Ni con 2.512 (rango completo) ni
con **1.084** (líneas de esos 143): trae **1.085**. Cuadra con un tercer oráculo que no debería ser el
suyo: **1.085 = filas de `order_detail_unit`** ⇒ el reporte está granulado por **unidad de venta**, no
por **línea de pedido**.

### R4 · Indicador (reconfirmación tras la actualización)

| Página | Filas | Monto Total BS | Monto Total US$ | |
|---|---:|---:|---:|:--:|
| 1 de 3 | 50 | 16.111.597,57 | 20.834,74 | ✅ |
| 2 de 3 | 50 | 16.111.597,57 | 20.834,74 | ✅ |
| 3 de 3 | 43 | 16.111.597,57 | 20.834,74 | ✅ |
| Todas (200/pág.) | 143 | 16.111.597,57 | 20.834,74 | ✅ |

50 + 50 + 43 = 143 ✔. **No cambia al paginar.**

---

## 4 · El descuadre del Detallado, disecado — pedido 71

En BD el pedido 71 tiene **3 líneas** (`order_detail` 595, 596, 597). La línea 597 (producto `0307291`,
OREO VAINILLA TUBO) se pidió en **dos unidades de venta a la vez**: 1 BTO (60,4128) + 1 UND (1,1600) =
**61,5728**, que es el `nu_amount_total` de esa **única** línea.

En el Excel Detallado aparecen **4 filas**: el producto `0307291` sale **repetido**, una vez como `BTO` y
otra como `UND`, y **en ambas se escribe el importe completo de la línea (61,5728)** en vez del importe de
cada unidad.

| Origen | Filas | Suma US$ | Suma BS |
|---|---:|---:|---:|
| BD (`order_detail`) | 3 | **182,3984** | **139.874,0370** |
| Excel General | (1 pedido) | **182,3984** | **139.874,0370** |
| **Excel Detallado** | **4** | **243,9712** | **187.091,7544** |
| Diferencia | +1 | **+61,5728** | **+47.217,7174** |

**El error global del Detallado es exactamente ése y sólo ése:** 20.834,74 + 61,5728 = **20.896,31**;
16.111.597,57 + 47.217,72 = **16.158.815,29**. Cuadra al céntimo.

**Diagnóstico:** el exportador recorre `order_detail_unit` (1.085 filas) en lugar de `order_detail`
(1.084), arrastrando el importe de la línea padre. En una línea con N unidades de venta, el importe se
cuenta N veces.

**Alcance:** ocurre 1 vez en esta ventana y 1 sola vez en el rango BD completo (2.513 vs 2.512). Impacto
económico pequeño hoy, pero **el reporte deja de ser sumable con garantías**; en un cliente con venta
mixta bulto/unidad frecuente, el error escala solo.

---

## 5 · Hallazgos por gravedad

| # | Severidad | Hallazgo |
|---|---|---|
| **H1** | 🔴 **Crítica** | **128 pedidos vivos (US$ 17.854,25 / BS 13.830.875,36 · 1.247 líneas) no aparecen ni en el listado ni en ninguno de los dos reportes.** EVA MEDINA fue borrada y recreada el 25/08 con `id_user` nuevo; sus pedidos del 12–24/08 siguen en el `id_user` viejo (13), ausente de `salesman_view` |
| **H2** | 🔴 **Alta** | **El Detallado duplica las líneas con varias unidades de venta y repite el importe en cada fila.** Granularidad equivocada (`order_detail_unit` en vez de `order_detail`). Descuadra contra el General: +61,5728 US$ |
| **H3** | ⚠ Baja | La columna `# Detalles` del General (correcta) **no coincide con el nº de filas del Detallado** (ref 71: 3 vs 4). Síntoma de H2, útil como **control automático de regresión** |
| **H4** | ⚠ Cosmética | **Rótulos de fecha inconsistentes.** La pantalla titula `Fecha creación` / `Fecha envío`; el Excel titula `Fecha Pedido` / `Fecha Creacion` para **los mismos campos**. En pantalla la «Fecha envío» sale 1 s **anterior** a la «Fecha creación» ⇒ etiquetas cruzadas en la web. Datos correctos |
| **H5** | ℹ Observación | En el Detallado, `Cantidad × Precio Base ≠ Total Producto` en líneas por bulto (5 BULTO × 7,83 → 391,50). **No es error**: el precio es por unidad base y falta el factor de empaque, pero el reporte no lo expone, así que el usuario no puede recalcular la línea |

---

## 6 · Evidencias

| Archivo | Tamaño | Filas de datos |
|---|---:|---:|
| `descargas/pedidos-GENERAL.xlsx` | 18.807 B | 143 (cabecera en fila 10) |
| `descargas/pedidos-DETALLE.xlsx` | 192.604 B | 1.085 (cabecera en fila 10) |

⚠ **Los dos reportes se descargan con el mismo nombre `pedidos.xlsx`**, sin distintivo ni fecha.
Renombrados a mano. Sugerencia de mejora, no defecto.

Ruta en la UI: **Exportar Reporte** (`form:pedidosDT:btnExcelPedidos`) → panel con **General** y **Detalle**.

Capturas en `img/`: `01-listado-filtro-indicadores.png` · `02-pagina2-indicadores.png` ·
`03-pagina3-indicadores.png` · `04-listado-143-completo.png`.

---

## 7 · Lo que NO se validó

- **Otros rangos de fechas.** Sólo 01/08–28/08/2026. Rangos que crucen meses, inicio > fin, o vacíos: no probados.
- **Los demás filtros** (Vendedor, Cliente, Tipo Pedido, Moneda, Status, Adjunto, # Ref) quedaron en «Todos».
  **No se comprobó que el Excel respete un filtro distinto de la fecha**; dado H1, conviene verificarlo aparte.
- **Multiempresa.** INSUMAR tiene una sola; no se pudo probar el aislamiento entre empresas.
- **Multimoneda real.** Los 295 pedidos son **todos** `US$`. No se validó un Excel con mezcla de monedas.
- **Descuentos e IVA.** Todo 0,00 en el rango: `Descuento Global`, `Descuento Producto` y totales de IVA
  quedan **sin ejercitar**.
- **Columnas del Detallado no cotejadas contra BD:** `Coordenadas`, `Sucursal`, `Dirección`, `Comentarios`,
  `Adjuntos`, `Código/Estructura Producto`, `Precio Base Conversión` — verificada presencia, no contenido.
- **Estatus distintos de «Enviado».**
- **Formato/estilo del Excel:** fórmulas, formatos de celda, anchos. Se leyeron **valores**, no presentación.
- **Apertura en Excel de escritorio.** Parseo con la librería `xlsx` de Node; el fichero produce avisos
  `Bad uncompressed size` (cabeceras ZIP a 0, típico de escritor en streaming). Se leyó sin pérdida, pero
  **no se comprobó que Excel real no proteste**.
- **Reproducibilidad de H2 en otras ventanas.** Confirmado el desfase 2.513 vs 2.512 en BD, pero no se
  descargó Excel de otro periodo.

**Nada se modificó.** Sólo fechas, Buscar, paginador y descarga. La web quedó intacta.
