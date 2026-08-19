# Selectores web — módulo DEVOLUCIONES (`/pages/devoluciones` · `/pages/detalleDevolucion`)

> Parte de `web-selectors/` — leer junto con `_comunes.md` (regla de oro de IDs, guarda de tenant,
> filtro Empresa, verificación de combos, reglas de lectura del detalle).
> Mantener bajo ~120 líneas. Todo patrón nuevo confirmado en 1 corrida entra acá con su tag.
>
> Origen: `[run_vzla-20260818]` / `[run_vzla-20260819]` — playa **La Tortuga**, empresa
> **CORPORACION FERRE 19, C.A.**, read-only. Recoge además lo medido en
> `[el_palmar-20260805]` y `[difranca-20260807]`.

---

## Filtros del módulo

```
:idEnterprise  :idSalesmaView  :clientSOM  :orderStatus  :attachStatus
:n_ref  :dateB_input / :dateF_input  :ajax  :botonLimpiar
```

- ✅ **Tiene filtro `# Ref`** ⇒ vía barata y exacta para el cotejo con el móvil.
- Combo de adjuntos con literales **`SI` / `NO`**.
- ⚠ El `value` de **Empresa** acá es **`1`** (`id_enterprise`) — en pedidos es `co_enterprise`
  ⇒ **anclar por TEXTO** (`_comunes.md`).
- 🔴 **`orderStatus` puede traer DOS opciones distintas con el mismo texto `Enviado`** (`8` y `23`)
  `[el_palmar-20260805]` ⇒ **filtrar por ese literal es ambiguo: filtrar por `# Ref`.**
- ✅ `Limpiar` vacía el `# Ref` y **devuelve las fechas al mes en curso**; **no toca los combos**.

## `/pages/detalleDevolucion` — anclajes y lectura

| Elemento | ID real | Cómo anclarlo |
|---|---|---|
| Lista | `form:pedidosDT` | ⚠ **id compartido por 5 módulos** ⇒ verificar `location.pathname` primero |
| **Tabla de líneas** | `form:j_idt169` → `j_idt170` `[difranca-20260807]` → **de vuelta a `j_idt169`** `[run_vzla-20260818/19]` | 🔴 **`tablaPorColumnas(['Lote','Fecha vencimiento'])`, NUNCA el id** |
| Botón de detalle de la fila | `form:pedidosDT:N:consultar` | 🔴 **anclar al `# Ref`, NUNCA a `N`** |

🔴 **El `j_idt*` de esta tabla VOLVIÓ a su valor original** (170 → **169**): **no es una deriva monótona, va y
viene entre builds.** Un lector "actualizado al último número visto" acierta por casualidad la mitad de las veces.

**Llaves del detalle:** trae **`No. de Ref.`**; ⚠ **NO trae el epoch ni el Estatus** — el estatus se lee de la
LISTA (mapa completo en `_comunes.md`).

### Columnas de la tabla de líneas

```
N° · Cod. producto · Producto · Lote · N° Factura · Fecha vencimiento · Devolución en · Motivo · Cantidad
```

🔴 **CERO columnas de dinero ⇒ no construir oráculo de importes** en este módulo (`WEB-RUNTIME §7`).
Cotejo validado contra `return_detail`: `N° Factura` = `co_document` · `Motivo` = `id_motive` → `return_motive` ·
`Cantidad` = `qu_product` · `Lote`/`Fecha vencimiento` vacíos = `nu_lote ''` / `da_duedate NULL`.

⚠ **`Devolución en` muestra el CÓDIGO de la unidad, no su nombre** (🟡 ya reportado). Contraste:
`detalleInventario` **sí** usa el nombre (`2.00 UNIDADES`) ⇒ la web sabe resolverlo.

### ⚠ `Observaciones` viene SIN `:` — es un TÍTULO DE SECCIÓN y su valor va en la LÍNEA SIGUIENTE

Es el contenedor real de `return.tx_description`. **Un lector que exija etiqueta terminada en `:` PIERDE el
campo.** (En depósitos la misma etiqueta **sí** trae `:` ⇒ hay que manejar las dos formas — `_comunes.md`.)
⚠ Y por el mismo artefacto, **`Precinto:` vacío absorbe `Observaciones`** como valor: descartarlo.

Cabecera validada campo a campo: `Fecha devolución` = `da_return` (UTC−4) · `Tipo de devolución` = `id_type` →
`return_type.na_type` · `Precinto` = `nu_seal` · Estatus (lista) = `st_return`.

## Adjuntos

- Carpeta **`devoluciones`**: imágenes en `…/denario/resources/images/devoluciones/{ref}_{n}.jpeg?pfdrid_c=true`,
  **documentos en `…/denario/resources/files/devoluciones/{ref}_{n}.{pdf|xlsx}`** (⚠ extensión leída de
  `transaction_files.na_file`), firmas en `…/images/firmas/devoluciones/{ref}_{n}.jpg`.
- Oráculo de conteo = **`transaction_image ∪ transaction_files`**, nunca `nu_attachments`
  (ref 350: `1 + 1 = 2 = nu_attachments`, la firma queda fuera).

## ⛔ Superficie de escritura — prohibida

El agente web es **read-only**. El único control que se toca es **`Consultar`**.

---
*Creado por la consolidación de `[run_vzla-20260818]`.*
