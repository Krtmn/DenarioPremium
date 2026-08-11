# Selectores web — módulo PEDIDOS (`/pages/pedidos` · `/pages/detallePedido`)

> Parte de `web-selectors/` — leer junto con `_comunes.md` (regla de oro de IDs, guarda de tenant,
> filtro Empresa, persistencia de filtros, reglas de lectura del detalle).
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.
>
> Origen: `[difranca-20260807]` — playa **El Yaque**, cliente **difranca**, empresa `DDHP_A12`
> (15.517 pedidos · 2.049 del vendedor QA), read-only.

---

## 🔴 La tabla de la lista CAMBIA DE ID según el filtro `Status`

| `Status` | Tabla que renderiza el DOM |
|---|---|
| placeholder · `6 Enviado` · `26 Por aprobar` | `form:pedidosDT` |
| **`-1 Guardado`** | **`form:pedidosSavedDT`** ← **sustituye** a la anterior |

⇒ `document.getElementById('form:pedidosDT')` devuelve **`null` y revienta el lector** cuando el filtro quedó
en `Guardado` (que **persiste en sesión**, ver `_comunes.md`). 🔴 **Anclar por `.ui-datatable`, nunca por el id
fijo.** Recordar además que `form:pedidosDT` **lo comparten 5 módulos** (`_comunes.md`). `[difranca-20260807]`

## Filtros del módulo

| Sufijo | Filtro | Notas |
|---|---|---|
| `:idEnterprise_*` | Empresa | 🔴 su `value` acá es el **`co_enterprise`** (`DDHP_A12`), **no** `id_enterprise` ⇒ anclar al TEXTO |
| `:idSalesmaView_*` | Vendedor | `value` = `id_user` (`275`), label `Jose Raad` (⚠ puede venir con **dos espacios**) |
| `:idCurrency_*` | Moneda | 🔴 **carga en `1` = `BSD` en SESIÓN NUEVA** — no es residuo, es el valor inicial del bean. **Contaminó 3 mediciones** (F04, F05, F06) hasta que se puso en placeholder |
| `:orderStatus_*` | Status | placeholder `value="0"` (no `""`) pero **no filtra**; opciones `6 Enviado` · `26 Por aprobar` · `-1 Guardado` |
| `:idOrderType_*` | Tipo Pedido | ⚠ **trae ÚNICAMENTE el placeholder, sin ninguna opción** — filtro inutilizable en esta playa (`PED-TIPO-PEDIDO-SIN-OPCIONES`) |
| `:n_ref` · `:dateB_input` · `:dateF_input` · `:ajax` · `:botonLimpiar` | — | `Limpiar` **sí** borra el `# Ref`, **no** las fechas ni Moneda/Cliente/Status |

🔴 **Antes de la 1ª medición del módulo, leer el `value` de TODOS los `select[id$="_input"]`** — no alcanza con
`Limpiar` ni con mirar el `.ui-selectonemenu-label`. Fue la causa del falso positivo descrito abajo.

## 🟠 EN OBSERVACIÓN — el filtro `Status` no concuerda con la columna «Estatus» de la grilla

> **Estado: OBSERVACIÓN, NO defecto confirmado.** QA lo probó en **La Tortuga (main) y NO ocurre**.
> La próxima corrida debe re-verificarlo. `[difranca-20260807]`

- **Síntoma:** sin filtro salen 8 filas, **todas** con la columna `Estatus = "Enviado"`; al filtrar
  `Status = Enviado` (`6`) sale **1**. Las otras 7 desaparecen.
- 🔑 **Dato técnico que hay que conservar** (es lo valioso del hallazgo): el filtro `Status` consulta la tabla
  **`transaction_statuses`** —tabla de **historial**, apenas poblada: **2 filas para 795 devoluciones** y
  **1.383 para 15.517 pedidos**— mientras la columna «Estatus» de la grilla se pinta desde **`order.st_order`**.
  ⇒ puede ser **maduración de datos**, no (solo) versión desplegada.
- ⇒ **No usar el filtro `Status` como oráculo de conteo.** Para cotejar, `# Ref` o Empresa + fechas.

## ⛔ `PED-LISTA-SUBCONJUNTO` **no existe** — fue un falso positivo

La medición que decía «la web devuelve 271 de 15.517» tenía **`Moneda = BSD` persistida** (y un `# Ref` puesto).
Con `Moneda` en placeholder: **2.049 == 2.049** por vendedor y **15.439 vs 15.517** por empresa.
**No promover a memoria como defecto.** Lo que sí se promueve es la causa: *"LOS FILTROS PERSISTEN EN LA
SESIÓN"* en `_comunes.md`. `[difranca-20260807]`

## `/pages/detallePedido` — anclajes y lectura

| Elemento | ID real | Cómo anclarlo |
|---|---|---|
| **Tabla de líneas del pedido** | **`form:pedidosDT`** — ⚠ **el MISMO id que la lista** | por columnas o por `.ui-datatable` dentro del detalle; verificar `location.pathname` primero |
| Botón de detalle de la fila (lista) | `form:pedidosDT:N:consultar` | 🔴 **anclar al `# Ref`, NUNCA a `N`** |

Columnas de la tabla de líneas:
`N° · Cod. producto · Producto · Almacen · Lista de precio · Unidades pedidas · Monto Total · Monto conv.`

🔴 **`Monto Total` y `Monto conv.` traen DOS valores en una sola celda:**
```
"Precio base: 3,64 US$ Subtotal: 7,28 US$"
```
⇒ **partirlas** para cotejar precio unitario y subtotal por separado. De esa única lectura salen `C08` y `C09`.

### Las DOS reglas de lectura del detalle **conviven en esta página**

- **padre-primero** → **pie de totales**: `Subtotal bruto`, `Descuento bonif.`, `Monto Base Pedido`,
  `Monto Base Pedido Conversion`, `Monto Total Pedido`, `Conversiòn Monto Total`.
- **hoja-siguiente** → **cabecera**: `No. de Ref.`, `Código pedido`, `Vendedor`, `Estatus`, …
- ⚠ Con hoja-siguiente, **`Conversiòn Monto Total` absorbe el `N°`** del encabezado de la tabla de líneas y
  **`Sucursal:` (vacía) absorbe el botón `Descargar adjuntos`** ⇒ descartar como valor toda hoja que sea
  **encabezado de tabla** o **texto de botón**. (Detalle completo en `_comunes.md`.)

## ⛔ Superficie de escritura — prohibida

`Nuevo Pedido` y `Copiar` (por fila). El único control que se toca es **`Consultar`**.

---
*Creado por la consolidación de `[difranca-20260807]`.*
