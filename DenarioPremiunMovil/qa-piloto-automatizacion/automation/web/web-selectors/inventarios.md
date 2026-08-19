# Selectores web — módulo INVENTARIOS (`/pages/inventarios` · `/pages/detalleInventario`)

> Parte de `web-selectors/` — leer junto con `_comunes.md` (regla de oro de IDs, guarda de tenant,
> filtro Empresa, verificación de combos, reglas de lectura del detalle).
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.
>
> Origen: `[run_vzla-20260818]` / `[run_vzla-20260819]` — playa **La Tortuga**, empresa
> **CORPORACION FERRE 19, C.A.** (`FERRE_N` / `id_enterprise = 1`), read-only.

---

## Filtros del módulo

Sufijos **idénticos a devoluciones**:

```
:idEnterprise  :idSalesmaView  :clientSOM  :orderStatus  :attachStatus
:n_ref  :dateB_input / :dateF_input  :ajax  :botonLimpiar
```

- ✅ **Tiene filtro `# Ref`** ⇒ es la vía barata y exacta para cotejar un registro contra el móvil.
- El combo de adjuntos usa los literales **`SI` / `NO`** (no los de visitas — ver `_comunes.md`).
- ⚠ El `value` del `<select>` **Empresa** acá es **`1`** (`id_enterprise`), pero en pedidos y clientes
  potenciales es `FERRE_N` (`co_enterprise`) ⇒ **anclar por TEXTO, nunca por `value`.**
- ✅ `Limpiar` vacía el `# Ref` y **devuelve las fechas al mes en curso**; **no toca los combos**.

## `/pages/detalleInventario` — anclajes y lectura

| Elemento | ID real | Cómo anclarlo |
|---|---|---|
| Lista | `form:pedidosDT` | ⚠ **id compartido por 5 módulos** ⇒ verificar `location.pathname` primero (`_comunes.md`) |
| **Tabla de líneas del detalle** | **`form:pedidosDT`** — el **mismo id que la lista** | por id (semántico) tras verificar el `pathname`, o por columnas |
| Botón de detalle de la fila | `form:pedidosDT:N:consultar` | 🔴 **anclar al `# Ref`, NUNCA a `N`** |

**Llaves del detalle:** trae **`No. de Ref.`** *y* el epoch **`Código inventario`**; ⚠ **NO trae el Estatus**
— hay que leerlo de la LISTA (mapa completo en `_comunes.md`).

### 🔴 Columnas: en este build son SEIS — `Lote` y `Fecha expiración` NO SE GENERAN

```
N° · Cod. producto · Producto · Estructura · Depósito · Exhibición
```

**`_comunes.md` documentaba ocho.** Verificado en el DOM: las dos que faltan **no están ocultas por CSS —
no se generan** (`toggler` ausente, **6 `th`** en total). ⇒ **un lector que las espere devuelve `null`.**

⚠ **Consecuencia de dato, ya reportada como 🟡 observación:** el lote capturado por la app **es invisible en la
web**. Medido: `client_stock_detail_unit.nu_batch = 'QA-INV-0818'` (producto `TM01`, inventario 53) es **el único
lote del tenant** y no aparece en ninguna pantalla. Con `expirationBatch = false` en las VG **puede ser
intencional** — lo que no encaja es que la app permita capturar un dato que después no se puede consultar.

### 🔑 La UBICACIÓN no es una columna — se expresa por CUÁL columna trae la cantidad

| BD `client_stock_detail_unit.ubicacion` | Web `Depósito` | Web `Exhibición` |
|---|---|---|
| `dep` | `2.00 UNIDADES` | `-` |
| `exh` | `-` | `7.00 UNIDADES` |

Validado 4/4 líneas contra BD. ⇒ **el oráculo de ubicación se construye mirando en qué columna cae la
cantidad**, no buscando un campo `ubicacion` en la web. ⚠ La cantidad y el lote viven en la tabla **nieta**
`client_stock_detail_unit`, no en `client_stock_detail` (mismo patrón que `order_detail_unit`, ver `_comunes.md`).

### ⚠ La columna `N°` vale `1` en TODAS las filas — 🟡 ya reportado, no volver a levantarlo

Cosmético y sistemático. **`detallePedido` sí numera bien (1..53)** ⇒ es esta pantalla la que no numera, no un
límite de la plantilla. Consecuencia para el lector: **`N°` no sirve para correlacionar líneas** — usar
`Cod. producto`.

### ✅ La coordenada no es texto visible

`#form.innerText` devuelve solo `Ubicación: Mapa`. Leerla del `innerHTML` con regex y **comparar con
tolerancia — el mapa redondea a 6 decimales** (receta en `_comunes.md §Mapas de Google`).

⚠ **Guarda del lector:** las filas de la tabla entran como **claves** de `#form.innerText` ⇒ descartar claves de
más de ~60 caracteres (`_comunes.md`).

## Adjuntos

- Carpeta: **`inventarios`**. Imágenes en `…/denario/resources/images/inventarios/{ref}_{n}.jpeg?pfdrid_c=true`;
  **documentos en `…/denario/resources/files/inventarios/{ref}_{n}.{pdf|xlsx}`** (⚠ la extensión se lee de
  `transaction_files.na_file`); firmas en `…/images/firmas/inventarios/{ref}_{n}.jpg`.
- Oráculo de conteo = **`transaction_image ∪ transaction_files`**, nunca `nu_attachments`
  (ref 52: `2 + 1 = 3 = nu_attachments`, la firma queda fuera). Ver `_comunes.md`.

## Enlace cruzado (oráculo gratis)

La cabecera trae **`Ver Pedido Relacionado`** ⇒ salto directo al módulo de pedidos sin discovery.

## ⛔ Superficie de escritura — prohibida

El agente web es **read-only**. El único control que se toca es **`Consultar`**.

---
*Creado por la consolidación de `[run_vzla-20260818]`.*
