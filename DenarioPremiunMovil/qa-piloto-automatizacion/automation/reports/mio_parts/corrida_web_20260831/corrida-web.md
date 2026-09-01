# Corrida WEB — mio_parts (MIO LUBRICANTES Y FILTROS, CA)

- **Fecha:** 31/08/2026
- **Playa (descubierta en runtime):** El Yaque — `http://denarioelyaque.ddns.net:8080/DenarioPremium` · rama main
- **Empresa:** MIO LUBRICANTES Y FILTROS, CA (`co_enterprise=MIOP_ADM` · `id_enterprise=1`) — **única en el selector**
- **Modo:** PRODUCCIÓN, **solo lectura**. Solo se usaron: selector de empresa, fechas, Buscar, paginador y descarga de Excel.
- **Usuario web:** bloque 1 de `secrets/qa-credentials.env`, inyectado por portapapeles. Portapapeles limpiado al terminar.

---

## VEREDICTO

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Indicador «Monto Total» de Pedidos (dic-2025, mezcla BS+US$) | ✅ PASS |
| 2 | Indicador «Monto Total» de Pedidos (ene-2026, mezcla BS+US$) | ✅ PASS |
| 3 | Conteo `Total de Resultados` de Pedidos vs BD | ✅ PASS |
| 4 | Fidelidad de la grilla de Pedidos (18/18 filas) | ✅ PASS |
| 5 | **Exportar Reporte de Pedidos a Excel — General** | ✅ PASS |
| 6 | Exportar Reporte de Cobros a Excel (conteo, totales, duplicación) | ✅ PASS |
| 7 | Pedidos ocultos por `salesman_view` | ✅ PASS (no aplica en este tenant) |
| 8 | Cotejo móvil → web (visita enviada por el agente móvil) | ✅ PASS |
| 9 | Reporte de Pedidos **Detallado** (cuadre vertical, defecto «fila por unidad») | ✅ PASS |

**Ningún defecto de producto en la web.** Todas las comprobaciones cuadran contra la base de datos.

> 🔴 **CORRECCIÓN — el hallazgo «D-01» quedó RETIRADO (31/08).** Se reportó que el botón de exportar
> Pedidos no descargaba nada. **Era un error de método, no un defecto:** ese botón **no descarga, abre
> un panel** con las opciones **General** y **Detalle**, y la descarga está un clic más adelante. La
> respuesta AJAX que se interpretó como «no entrega el fichero» era **el panel pintándose**.
> Verificado el 31/08: ambos ficheros se descargan (`pedidos.xlsx`) y **cuadran al cuarto decimal**
> contra BD. Detalle recomendado con espera larga: tarda bastante más que General.
>
> ⚠ La señal estaba a la vista y se leyó al revés: el propio informe anotaba *«Pedidos ofrece un solo
> botón de exportación, sin selector General/Detallado»* — eso no era una carencia del producto, era
> el aviso de que **el flujo no se había recorrido hasta el final**.

---

## 2 · Scripts de web: NO funcionaron

Ambos scripts fallan **antes de abrir el navegador**, con el mismo error:

```
$ node automation/playwright/run-web.js mio_parts
ERR: no se pudo detectar la playa desde ws_url:
Playas conocidas: la_tortuga, isla_coche, el_yaque, caribe

$ node automation/playwright/run-web-extendido.js mio_parts
ERR: no se pudo detectar la playa desde ws_url:
```

**Causa — problema del guion, no del producto.** Los dos scripts derivan la playa de `perfil.ws_url`
(`run-web.js`, bloque «Detectar playa desde ws_url») y abortan si no la encuentran. Pero la política
vigente prohíbe guardar la playa en el perfil: `mio_parts.yaml` dice explícitamente
`# ws_url / playa: NO se registran — es propiedad del SERVIDOR, rotativa, se descubre en runtime`.

⇒ **Los scripts son incompatibles con la política de perfiles.** No es específico de `mio_parts`:
fallarán con **cualquier** perfil escrito con el esquema actual. Arreglo sugerido para desarrollo/QA:
aceptar `--playa=<slug>` o `--base-url=<url>` por línea de comandos, en vez de exigirla en el YAML.

**Toda la corrida se hizo a mano con Playwright.**

---

## 3 · Comprobaciones

### 3.1 · Indicador «Monto Total» de Pedidos

Rótulos reales en este tenant: **`Monto Total BS`** y **`Monto Total US$`** (no VES/USD).
Los valores viven en `span.pedidos-total-value`, hermano de `span.pedidos-total-label`.

**Rango A — diciembre 2025** (elegido por tener mezcla real de monedas: 8 BS + 10 US$)

Oráculo BD:
```sql
SELECT co_currency, count(*), round(sum(nu_amount_total)::numeric,4) nativo,
       round(sum(nu_amount_total_conversion)::numeric,4) convertido
FROM "order" WHERE id_enterprise=1
  AND da_order >= '2025-12-01' AND da_order < '2026-01-01'
GROUP BY co_currency;
```
| moneda | pedidos | nativo (`nu_amount_total`) | convertido (`..._conversion`) |
|---|---|---|---|
| BS | 8 | 701.802,7956 | 2.920,2846 |
| US$ | 10 | 5.330,8380 | 1.281.106,9882 |

| Indicador | Oráculo BD (nativos + conversión de la otra moneda) | Web | Veredicto |
|---|---|---|---|
| Monto Total **BS** | 701.802,7956 + 1.281.106,9882 = **1.982.909,7838** | **1.982.909,78** | ✅ |
| Monto Total **US$** | 5.330,8380 + 2.920,2846 = **8.251,1226** | **8.251,12** | ✅ |
| Total de Resultados | 18 | **18** | ✅ |

**Rango B — enero 2026** (14 BS + 215 US$)

| Indicador | Oráculo BD | Web | Veredicto |
|---|---|---|---|
| Monto Total **BS** | 2.664.753,1716 + 36.105.093,7783 = **38.769.846,9499** | **38.769.846,95** | ✅ |
| Monto Total **US$** | 106.470,7392 + 8.488,9960 = **114.959,7352** | **114.959,74** | ✅ |
| Total de Resultados | 229 | **229** | ✅ |

**Se verificó que no cae en la trampa de `nu_amount_final`.** En dic-2025 `sum(nu_amount_final)` vale
605.002,41 (BS) y 4.595,55 (US$) — que es la **base sin IVA**. La web muestra ese número en la línea
`Total Base`, correctamente etiquetado, y el `Monto Total` usa `nu_amount_total`. **El indicador es correcto.**

De paso, el desglose completo también cuadra: `Total Base + Total IVA = Monto Total`
(BS: 1.709.404,99 + 273.504,80 = 1.982.909,79 · US$: 7.113,04 + 1.138,09 = 8.251,13).
La diferencia de 1 céntimo contra el indicador es redondeo independiente de cada componente —
**no es un defecto**, es el comportamiento esperado al redondear sumandos por separado.

📷 `img/01-pedidos-dic2025-indicador.png` · `img/02-pedidos-ene2026-indicador.png`

### 3.2 · Fidelidad de la grilla de Pedidos — 18/18 filas ✅

Se cotejaron **las 18 filas** de dic-2025 (no una muestra) contra `order`: `# Ref`, cliente, vendedor,
fechas, moneda, Monto Base, Monto Total, Monto conv. y Total items (`nu_details`). **Coincidencia exacta.**

| # Ref | Web (base / total / conv) | BD | ✓ |
|---|---|---|---|
| 23470 (mayor) | 295,20 / 342,43 US$ / 82.293,26 BS | 295.20 / 342.43 / 82293.26 | ✅ |
| 23469 (menor) | 173,40 / 201,14 BS / 0,84 US$ | 173.40 / 201.14 / 0.84 | ✅ |
| 23466 | 529.665,28 / 614.411,72 BS / 2.556,64 US$ | 529665.28 / 614411.72 / 2556.64 | ✅ |
| 23463 | 1.603,60 / 1.860,18 US$ / 447.037,50 BS | 1603.60 / 1860.18 / 447037.50 | ✅ |
| 23459 | 1.102,00 / 1.278,32 US$ / 307.205,86 BS | 1102.00 / 1278.32 / 307205.86 | ✅ |

Tasa de conversión uniforme y coherente: `240,32 BS = 1 US$`.

### 3.3 · Pedidos que la web NO lista — ✅ descartado

```sql
SELECT CASE WHEN sv.id_user IS NULL THEN 'sin vendedor visible' ELSE 'con vendedor' END, o.co_operation, count(*)
FROM "order" o LEFT JOIN salesman_view sv ON sv.id_user=o.id_user AND sv.id_enterprise=o.id_enterprise
WHERE o.id_enterprise=1 GROUP BY 1,2;
```
Resultado sobre **el histórico completo**: `con vendedor / co_operation='U' / 1887 pedidos`.
**Fila única.** Cero pedidos de vendedores ausentes de `salesman_view` y cero borrados lógicos.
El tenant tiene 3 vendedores, los 3 visibles. **El defecto multi-tenant conocido no aplica aquí**, y por
eso los conteos de pantalla cuadran al 100 % con la BD sin necesidad de filtros correctores.

### 3.4 · Cotejo móvil → web ✅

El agente móvil registró **1 visita** durante la corrida. Aparece en la web correctamente:

| Campo | BD (`visit`) | Web (Reporte de Visitas) | ✓ |
|---|---|---|---|
| id | 2733 | 2733 | ✅ |
| Cliente | MIO PARTS & SERVICES, C.A. (J409074560) | MIO PARTS & SERVICES, C.A. / J409074560 | ✅ |
| Vendedor | `id_user=306` / `co_user=02` | LUIS LORENZO TORRES SOSA | ✅ |
| Fecha inicio | 2026-08-31 22:38:23 UTC | 31/08/2026 18:38:23 | ✅ (UTC−4, correcto para VE) |
| Fecha real | 2026-08-31 22:39:07 UTC | 31/08/2026 18:39:07 | ✅ |
| Estatus | `st_visit=2` | visitado | ✅ |
| Coordenada sucursal | `coordenada_saved=false` | «Falta Coordenada (Sucursal)» | ✅ |

Sincronización **inmediata**: la visita ya estaba en la web al consultarla. Sin pedidos ni cobros
móviles en el día, así que el cotejo se limita a visitas.

📷 `img/03-cotejo-visita-movil.png`

---

## 4 · HALLAZGOS

### ✅ Reporte de Pedidos a Excel — General y Detalle · COTEJADOS Y CORRECTOS

> Sustituye al retirado «D-01». Verificado el 31/08 tras descubrir que el botón `btnExcelPedidos`
> **abre un panel** (`form:pedidosDT:j_idt211`) con **General** (`j_idt212`) y **Detalle**
> (`j_idt214`); la descarga se dispara desde esas dos opciones, no desde el botón.

**Filtro:** 01/08/2026 – 31/08/2026 · empresa MIO LUBRICANTES Y FILTROS, CA (`id_enterprise=1`)

| Comprobación | Oráculo BD | Excel | |
|---|---|---|:--:|
| Filas del **General** | 226 | **226** | ✅ |
| `Monto Total` (con IVA) | 153.961,6032 | **153.961,6032** | ✅ |
| `Monto Conversion` | 117.018.516,8981 | **117.018.516,8981** | ✅ |
| Filas del **Detalle** | 1.005 líneas (`order_detail`) | **1.005** | ✅ |
| Refs únicas | 226 | 226 en ambos | ✅ |
| Refs huérfanas (en Detalle y no en General) | 0 | **0** | ✅ |
| Suma de `# Detalles` del General vs filas del Detalle | 1.005 | **1.005** | ✅ |

**Coincidencia exacta al cuarto decimal.** El indicador de pantalla (`Monto Total BS 117.018.516,90`)
cuadra con la conversión.

#### El defecto «una fila por unidad de venta» NO reproduce — pero conviene matizar por qué

En otro tenant el Detallado emitía una fila por **unidad de venta** en vez de por **línea de pedido**,
repitiendo el importe e inflando el total. Aquí no ocurre:

```
order_detail       (líneas)   = 1.005
order_detail_unit  (unidades) = 1.005
Detalle exportado             = 1.005
```

⚠ **No está demostrado que esté corregido: está demostrado que aquí no se dan las condiciones.**
El defecto sólo se manifiesta cuando una línea lleva **más de una presentación**, y en estos datos
no hay ninguna. Para confirmarlo haría falta un tenant con venta mixta bulto/unidad.

#### Un contraste que no debe confundirse con un descuadre

La columna `Total Producto` del Detalle suma **132.725,52** frente a **153.961,60** del General. Es la
**base sin IVA** contra el **total con IVA** — el mismo par de columnas que induce a error al cotejar
el indicador (ver §3.1). No es una diferencia: son magnitudes distintas.

**Ficheros:** `pedidos-GENERAL.xls` · `pedidos-DETALLE.xlsx` (junto a este informe).

### ✅ Comprobado y CORRECTO — Reporte de Cobros a Excel

Al no poder validar el Excel de Pedidos, se validó el de **Cobros** (misma mecánica de export,
mismo rango dic-2025) para dejar cubierta al menos una exportación:

| Comprobación | Oráculo BD | Excel | ✓ |
|---|---|---|---|
| Conteo de filas | 25 cobros (`co_operation<>'D'`) | 25 filas de datos | ✅ |
| `Total de Resultados` de pantalla | 25 | 25 | ✅ |
| Total **BS** (20 cobros) | 1.418.083,58 | 1.418.083,58 | ✅ |
| Conversión BS→US$ | 5.887,91 | 5.887,91 | ✅ |
| Total **US$** (5 cobros) | 1.514,82 | 1.514,82 | ✅ |
| Conversión US$→BS | 364.041,54 | 364.041,54 | ✅ |
| **Duplicación de filas** | 25 refs distintas | **25 refs únicas, 0 repetidas** | ✅ |

**Cuadra al céntimo.** Y **no reproduce el patrón del defecto de duplicación**: aunque el Excel de
Cobros lleva columnas de detalle de documento (Código Documento, Monto Documento, Balance Documento),
emite **exactamente una fila por cobro**, sin repetir el importe. Cabecera correcta con los parámetros
de búsqueda (Desde/Hasta/Empresa/Vendedor/Cliente) y fecha de exportación.

*(Nota menor de traducción, cosmética: la cabecera dice «Método de Pägo» — diéresis por «a».)*

---

### ℹ️ Observación (NO es defecto de la web) — «Fecha creación» posterior a «Fecha envío»

En **8 de las 18** filas de dic-2025 la web muestra una fecha de creación **5 horas posterior** a la
de envío (ej. pedido 23466: creación `19/12/2025 17:25:03`, envío `19/12/2025 12:25:04`).

**Verificado en BD: la web muestra fielmente lo que hay almacenado.** `da_order` y `da_created`
guardan esa misma diferencia en la propia tabla `order`. La web **no** está transformando mal nada.

Es un desfase de zona horaria **en el dato de origen** (móvil/servidor al persistir el pedido), y
además **intermitente**: las otras 10 filas del mismo rango tienen ambas fechas coherentes con
segundos de diferencia. **Corresponde a la parte móvil/backend, no al reporte web** — se deja
anotado aquí para que no se reporte dos veces y para que el equipo lo enrute a quien toca.

---

### ℹ️ Notas para el guion de automatización (no son defectos)

- **El id del panel de filtros es `form:j_idt116`, no `form:j_idt115`** como dice la guía. Además
  **cambia por pantalla**: Pedidos y Visitas usan `j_idt116`, Cobros usa `j_idt117`. Anclar por id
  fijo es frágil; conviene localizar por el sufijo (`[id$=":dateB_input"]`).
- El botón Buscar **también cambia de nombre**: `...:ajax` en Pedidos y Cobros, `...:btnBuscar` en Visitas.
- Confirmado que **esperar el fin real del AJAX** (hook sobre `XMLHttpRequest` + `loadend`) funciona y
  evita leer la tabla anterior. Los 8 s fijos de la guía se quedan cortos en rangos grandes.
- Error de consola preexistente y ajeno al producto: `chartjs-plugin-datalabels` desde
  `cdn.jsdelivr.net` lanza `Cannot read properties of undefined (reading 'helpers')`. Aparece en todas
  las pantallas, no afecta a los datos.

---

## 5 · Lo que NO se validó

| Punto | Motivo |
|---|---|
| ~~Reporte de Pedidos a Excel — General~~ | ✅ **YA VALIDADO** (31/08): 226 filas y totales exactos contra BD. Ver §4. |
| ~~Reporte de Pedidos a Excel — Detallado~~ | ✅ **YA VALIDADO** (31/08): 1.005 filas, 0 huérfanas. La variante Detallado **sí existe**: está dentro del panel que abre el botón de exportar. |
| **Defecto «una fila por unidad de venta»** en el Detallado | ⚠ **No reproduce, pero NO está demostrado que esté corregido**: en estos datos ninguna línea lleva más de una presentación (1.005 líneas = 1.005 unidades), así que **no se dan las condiciones**. Haría falta un tenant con venta mixta bulto/unidad. |
| Excel de Visitas, Devoluciones, Inventarios, Depósitos, Clientes Potenciales | Fuera del encargo. Solo se inventarió su `onclick` para acotar D-01; **no se descargaron ni se validó su contenido**. |
| Cotejo móvil→web de **pedidos, cobros y devoluciones** | Falta de datos: el agente móvil no envió ninguno durante la ventana de la corrida (0 en BD para el 31/08). Solo hubo 1 visita, y esa sí se cotejó. |
| Indicadores de otras pantallas (Cobros, Visitas…) | Fuera del encargo, que pedía el «Monto Total» de Pedidos. |
| Paginación de Pedidos más allá de la 1.ª página en ene-2026 | Los 229 resultados se validaron por el indicador y el `Total de Resultados` agregados, no fila a fila. La fidelidad fila a fila se hizo íntegra sobre dic-2025 (18/18). |
| Cualquier acción de escritura | Prohibida por alcance: es producción. No se pulsó Guardar, Aprobar, Editar, Eliminar ni el selector de estatus de fila. |

---

## 6 · Anexos

- `img/01-pedidos-dic2025-indicador.png` — Pedidos dic-2025, indicador y grilla completa
- `img/02-pedidos-ene2026-indicador.png` — Pedidos ene-2026, indicador
- `img/03-cotejo-visita-movil.png` — visita 2733 del agente móvil vista en la web
- `img/04-pedidos-boton-exportar.png` — botón «Exportar Reporte» de Pedidos (D-01)
- `cobros_Cobros.xls` — Excel de Cobros descargado (control de D-01 + validación del punto 6)
