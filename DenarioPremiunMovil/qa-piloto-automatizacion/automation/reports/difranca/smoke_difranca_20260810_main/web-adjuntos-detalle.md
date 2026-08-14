# Capa WEB — ADJUNTOS (`A##`) y DETALLE (`D##`) — difranca / EL YAQUE sobre `main`

**RUN_ID:** `smoke_difranca_20260810_main` · **Fecha:** 2026-08-10 · **Modo:** 🔒 **READ-ONLY**
**Playa:** EL YAQUE — `http://denarioelyaque.ddns.net:8080/DenarioPremium`
**Credenciales:** `***` / `***` (bloque `# USUARIO WEB`, tipeadas con `browser_type`) · login **OK**
**Alcance:** exactamente lo que pidió la QA — *"que los botones del detalle de los registros funcionen, que
puedas descargar los adjuntos"*. 5 módulos: cobros · pedidos · devoluciones · visitas · inventarios.

**Guarda de tenant ✅** — el `<select>` de Empresa devolvió por TEXTO las 3 empresas esperadas y **sólo** esas:
`*DISTRIBUIDORA DIAZ HERNANDEZ *` (`DDHP_A12`) · `DIFRANCA C.A` (`DIF_A12`) · `DISTRIBUIDORA DH VITAL, C.A.`
(`DHVITAL01_A`). `DDH_A12` no aparece. **Ninguna empresa ajena en ningún módulo.**

**Escritura: cero.** Sólo se tocó `Consultar`, los `<select>` de filtro, `# Ref`, el rango de fechas y los dos
botones de adjuntos. `Copiar Pedido`, `Editar` y `Eliminar` se **detectaron y no se tocaron**.

---

# 🔴 LO PRIMERO: la respuesta directa a la pregunta de la QA

| Módulo | ¿Se descargan los adjuntos? | ¿Abren / no están corruptos? | ¿Los botones del detalle funcionan? |
|---|---|---|---|
| **Cobros** | ✅ **SÍ** | ✅ sí (2 JPEG + 1 PDF, magic bytes OK) | ✅ sí |
| **Pedidos** | ✅ **SÍ** | ✅ sí | ✅ sí *(+1 botón de escritura, ver D-PED)* |
| **Visitas** | ✅ **SÍ** | ✅ sí | ✅ sí |
| **Inventarios** | ✅ **SÍ** | ✅ sí | ✅ sí |
| **Devoluciones** | 🔴 **NO — NUNCA** | 🔴 no hay archivo que abrir | 🔴 `Descargar adjuntos` **no hace nada y no avisa** |

> 🔴 **Hallazgo bloqueante nuevo (`DEV-ADJUNTOS-404`):** la web dice que **555 devoluciones tienen adjunto**
> y **ninguno existe en el servidor**. 20 refs muestreadas ⇒ **20/20 dan HTTP 404**. Detalle en H-A1.

**Y un defecto transversal a los 4 módulos que sí funcionan (`VISOR-OMITE-DOCUMENTOS`):** el botón
`Ver adjuntos` **muestra sólo las imágenes y nunca el PDF**. Donde BD dice 3 adjuntos, el visor enseña 2.
El documento sólo se obtiene descargando el ZIP. Detalle en H-A2.

---

# `A##` — ADJUNTOS

## Matriz de casos

Oráculo doble en cada caso: **`nu_attachments` / `has_attachments` de la tabla del módulo** + la **unión de
`transaction_image` + `transaction_files` + `transaction_signatures`** (que es lo que arma el ZIP).

| Caso | Módulo | `# Ref` | BD `nu_attachments` | BD archivos reales | ZIP entradas | Tipos verificados | Visor `Ver adjuntos` | Marca |
|---|---|---:|---:|---|---:|---|---|---|
| `DW-COB-A01` | cobros | 21838 | **3** | 2 img + 1 file | **3** | 2 JPEG + 1 PDF, todos > 0 B | **2 de 3** ⚠ | **WEB-OK** *(descarga)* |
| `DW-COB-A02` | cobros | 21813 | 0 | 0 | — | — | botones `disabled` | **WEB-OK** |
| `DW-PED-A01` | pedidos | 39794 | **3** | 2 img + 1 file **+ 1 firma** | **3** | 2 JPEG + 1 PDF | **2 de 3** ⚠ | **WEB-OK** *(ver H-A3)* |
| `DW-PED-A02` | pedidos | 39797 | 0 | 0 | — | — | botones `disabled` | **WEB-OK** |
| `DW-DEV-A01` | devoluciones | 873 | **3** | 3 img | 🔴 **sin descarga** | — | **3 rotas (0 visibles)** | 🔴 **WEB-MISSING** |
| `DW-DEV-A02` | devoluciones | 878 | 0 | 0 | — | — | botones `disabled` | **WEB-OK** |
| `DW-VIS-A01` | visitas | 28219 | **3** | 2 img + 1 file | **3** | 2 JPEG + 1 PDF | **2 de 3** ⚠ | **WEB-OK** |
| `DW-VIS-A02` | visitas | 28223 | 0 | 0 | — | — | botones `disabled` | **WEB-OK** |
| `DW-INV-A01` | inventarios | 16 *(`DIFRANCA C.A`)* | **3** | 2 img + 1 file | **3** | 2 JPEG + 1 PDF | *(no probado)* | **WEB-OK** |
| `DW-DEV-A03` | devoluciones | 20 refs | — | — | — | 🔴 **20/20 → HTTP 404** | — | 🔴 **WEB-MISSING** |
| `DW-ADJ-F01` | devoluciones | filtro `Tiene Adjunto = SI` | — | — | **555 contados** = **555** BD | — | — | **WEB-OK** *(el filtro)* |

**Verificación de integridad aplicada a cada ZIP** (fuera del navegador, PowerShell):
magic bytes `50 4B 03 04` del contenedor · magic bytes por entrada (`FFD8FF…` JPEG · `25504446` PDF) ·
tamaño > 0 · nombre de entrada = `{ref}_{n}.{ext}` coincidente con `transaction_image` / `transaction_files`.
**Ninguna entrada corrupta ni de tamaño 0 en los 4 módulos que descargan.**

**El ZIP es por registro, no un blob fijo:** el PDF de cobros/pedidos pesa 9.120 B y el de visitas/inventarios
5.013 B. (Las dos JPEG sí se repiten entre módulos — 108.052 y 93.205 B — porque la corrida móvil QA adjunta
la misma foto en todos los módulos. Es dato de origen, no un defecto de la web.)

## 🔴 H-A1 · `DEV-ADJUNTOS-404` — devoluciones promete 555 adjuntos y no entrega ninguno · **NUEVO, alto**

**Síntoma de usuario (lo que ve la QA):** entra al detalle de una devolución, el botón `Descargar adjuntos`
está **habilitado**, lo pulsa y **no pasa absolutamente nada**: no baja ningún archivo, no aparece ningún
mensaje de error, no se abre ningún diálogo. La pantalla queda igual. Si en cambio pulsa `Ver adjuntos`, el
visor **sí abre** y muestra **3 recuadros de imagen rota**.

**Medición:**

| Comprobación | Resultado |
|---|---|
| `Descargar adjuntos` en devolución 873 | 🔴 **2 de 2 intentos sin descarga** (40 s y 25 s de espera) |
| Mensaje de error / diálogo / growl tras el click | **ninguno** — silencio total |
| Visor `Ver adjuntos` en 873 | abre con **3 `<img>`, las 3 con `naturalWidth = 0`** (rotas) |
| Consola del navegador | **3 × HTTP 404** sobre `/denario/resources/images/devoluciones/873_{0,1,2}.jpg` |
| Muestreo de **20 refs** con imagen registrada (876…845) × 3 extensiones (`jpg`/`jpeg`/`png`) | 🔴 **20/20 → 404** |
| ¿Es la extensión? | ❌ no — `.jpg`, `.jpeg` y `.JPG` dan 404 por igual |
| ¿Es la carpeta? | ❌ no — probadas `devoluciones/`, `devolucion/`, `returns/`, `return/`, `files/devoluciones/`, `firmas/devoluciones/`: **404 en todas** |
| **Control: los otros módulos** | ✅ `cobros/21838_0.jpeg`, `pedidos/39794_0.jpeg`, `visitas/28219_0.jpeg`, `inventarios/16_0.jpeg` → **HTTP 200 con bytes reales** |

**La metadata está perfecta y por eso el daño es invisible hasta que se intenta abrir:**

```
filtro "Tiene Adjunto = SI" en devoluciones, DDHP_A12  →  555 contados
BD: SELECT count(*) FROM "return" WHERE id_enterprise=2 AND has_attachments  →  555   ✅ exacto
BD: transaction_image WHERE na_transaction='devoluciones'  →  1.223 filas sobre 645 refs
Archivos realmente servidos                                →  0 de 20 muestreadas
```

⇒ **La web afirma con precisión perfecta que 555 devoluciones tienen adjunto, y no puede entregar ni uno.**

**Dos defectos, no uno:**
1. **Los archivos no están** donde el servidor los busca (dato/despliegue del tenant).
2. 🔴 **El producto falla en silencio.** Un `Descargar adjuntos` habilitado que no descarga nada y **no informa
   ningún error** es indistinguible de "la web se colgó". El botón debería deshabilitarse o avisar.
   El punto 2 **es del código y viaja a la 21**; el punto 1 puede ser de este tenant.

⚠ El fallo del ZIP es **del lado servidor** (no depende de la URL que arma la página), lo que refuerza que el
origen es la ausencia del archivo, no un enlace mal construido en el `.xhtml`.

## 🟠 H-A2 · `VISOR-OMITE-DOCUMENTOS` — `Ver adjuntos` nunca muestra el PDF · **NUEVO, medio**

Reproducido en **3 módulos independientes**, siempre igual:

| Módulo | Ref | BD dice | Visor muestra | Falta |
|---|---:|---:|---:|---|
| cobros | 21838 | 3 | **2** (las 2 JPEG, 720×1600, cargan bien) | el PDF |
| pedidos | 39794 | 3 | **2** | el PDF |
| visitas | 28219 | 3 | **2** | el PDF |

El diálogo (`Adjuntos`) **no tiene pestañas, ni lista de archivos, ni enlace** al documento: sólo `<img>`.
No hay ningún indicador de que exista un tercer adjunto.

**Impacto operativo:** el usuario que revisa un cobro con `Ver adjuntos` **concluye que no hay comprobante en
PDF**. La única forma de acceder al documento es descargar el ZIP completo — que es justamente lo que el visor
pretende evitar. Es el defecto que más probablemente pegue en el uso diario, porque no falla: **miente por
omisión**.

## 🟡 H-A3 · La firma no viaja en el ZIP (pero no se pierde) · **NUEVO, bajo**

El pedido 39794 tiene **4** archivos en BD: 2 en `transaction_image`, 1 en `transaction_files` y
**1 en `transaction_signatures`** (`39794_0.jpg`). El ZIP trae **3** — la firma queda fuera.

**No es pérdida de dato:** la firma **sí se muestra** en el detalle, como imagen embebida bajo la etiqueta
`Firma:` (`/denario/resources/images/firmas/pedidos/39794_0.jpg`, carga OK, 280 px de ancho).
Y `nu_attachments = 3` **es coherente con el ZIP**, no con el total de archivos.

⇒ **Consistente, pero hay que saberlo:** quien audite adjuntos por el ZIP **no obtiene la firma**.
⚠ Para automatización: `nu_attachments` **excluye las firmas** ⇒ es el oráculo correcto para el ZIP y el
**incorrecto** para "cuántos archivos tiene el registro".

## ✅ El caso «sin adjunto» se comporta limpio en los 5 módulos

En **4/4** módulos probados con un registro `has_attachments = false`, **los dos botones vienen `disabled`**:
cobros 21813 · pedidos 39797 · devoluciones 878 · visitas 28223. Sin errores, sin diálogos, sin imágenes rotas.

🔄 **Corrige lo documentado en `_comunes.md`:** la nota `[difranca-20260807]` decía que *"los botones aparecen
AUNQUE NO HAYA ADJUNTOS"* (observado en `detalleClientePotencial`). En los 4 módulos transaccionales de main
**aparecen pero deshabilitados**, que es el comportamiento correcto. El esperado de la familia `A##` no es
"el botón no está": es **`disabled` cuando `nu_attachments = 0`**.

---

# `D##` — DETALLE Y BOTONES

## Inventario completo de controles por detalle

Enumerado con un lector que recorre `button`, `a[onclick]`, `input[type=submit|button]`, `.ui-button` y
`[role=button]`, descartando los controles del mapa de Google.

| Detalle | Controles de acción reales | ¿Destructivos? | Marca |
|---|---|---|---|
| `/pages/detalleCobro` | `Descargar adjuntos` · `Ver adjuntos` | **ninguno** | **WEB-OK** |
| `/pages/detallePedido` | `Descargar adjuntos` · `Ver adjuntos` · 🟠 **`Copiar Pedido`** (`form:copiarRegistro`) | **`Copiar Pedido` es ESCRITURA** — detectado, **NO tocado** | **WEB-OK** |
| `/pages/detalleDevolucion` | `Descargar adjuntos` · `Ver adjuntos` | ninguno | 🔴 ver H-A1 |
| `/pages/protected/visitas/detalleVisita.xhtml` | `Descargar adjuntos` · `Ver adjuntos` | ninguno **en el detalle** (`Editar`/`Eliminar` están en la **lista**, no acá) | **WEB-OK** |
| `/pages/detalleInventario` | `Descargar adjuntos` · `Ver adjuntos` | ninguno | **WEB-OK** |

**Los 5 detalles funcionan y todos sus botones hacen lo que dicen**, con las dos excepciones ya reportadas
(H-A1 en devoluciones, H-A2 en el visor).

### 🔑 Lo que NO existe en ningún detalle — dato para la QA

**Ninguno de los 5 detalles ofrece `Volver`, `Imprimir`, `Exportar`, `PDF` ni `Excel`.** Verificado por
búsqueda de texto sobre todo el DOM (`/volver|regresar|atrás|imprimir|exportar|pdf|excel/i`): **0 coincidencias**
en `detalleCobro`. El único camino de regreso es el menú o el botón «atrás» del navegador.
⇒ **No es un defecto detectado, es una ausencia de función.** Si la QA esperaba un «imprimir comprobante» en
el detalle, **no está en este build**.

### 🟡 D-COMUN-01 · 6 botones icónicos sin rótulo, sin tooltip y sin acción

Presentes en la cabecera de **todos** los detalles: `j_idt65:j_idt78/79/80` y `j_idt65:j_idt96/97/98`, con
iconos `pi-heart`, `pi-paperclip` y `pi-reply`. **`title` vacío, `aria-label` ausente, `onclick` ausente.**
Son restos de la plantilla demo (misma familia que el dashboard *Rain Clothing / Tamas Bunce* ya documentado).
No se pulsaron. **Severidad baja, pero ensucian una pantalla de producción** y un lector de accesibilidad los
anuncia como "botón" sin decir de qué.

## Cotejo del detalle contra BD — campo por campo

### `DW-COB-D01` · cobro 21838 → **WEB-OK**

| Campo del detalle | Web | BD (`collection`) | ✓ |
|---|---|---|---|
| `No. de Ref.` | 21838 | `id_collection` 21838 | ✅ |
| `Estatus` | Enviado | `st_collection` 1 | ✅ |
| `Fecha del cobro` | 10/08/2026 11:04:55 | `da_collection` 2026-08-10T15:04:55Z | ✅ *(mismo día, UTC-4)* |
| `Código del cliente` | CAR082 | `co_client` CAR082 | ✅ |
| `Responsable` | GV | `na_responsible` GV | ✅ |
| `Comentario` | GVDOLARES | `tx_comment` GVDOLARES | ✅ |
| `Monto total IGTF` | 11,10 US$ | `nu_amount_igtf` 11.1000 | ✅ |
| `Total Monto a pagar` | 381,10 US$ | `nu_amount_total` 381.1000 | ✅ |
| `Diferencia de cobro` | 0,00 | `nu_difference` 0.0000 | ✅ |
| `Tasa de conversión` | 752,09 | `nu_value_local` 752.0900 | ✅ |

**Conversiones, las 3 exactas** (US$ → BSD, multiplica):
`370,48 × 752,09 = 278.634,30` ✅ · `11,10 × 752,09 = 8.348,20` ✅ · `381,10 × 752,09 = 286.621,50` ✅.

⚠ **Observación de rotulado (no es error de dinero):** en el pie,
`Monto total base (370,48) + Monto total IGTF (11,10) = 381,58`, pero `Total Monto a pagar = 381,10`.
La diferencia de **0,48** es exactamente el `Diferencia/Faltante` de la tabla de documentos pagados
(y su conversión, `0,48 × 752,09 = 361,00`, también coincide). ⇒ la etiqueta `Monto total base` muestra el
**monto del documento**, no la base efectivamente cobrada (370,00). **El total es correcto y BD lo respalda**;
lo que no cierra es la lectura del trío en pantalla. Severidad baja.

### `DW-PED-D01` · pedido 39794 → **WEB-OK**

| Campo | Web | BD (`"order"`) | ✓ |
|---|---|---|---|
| `No. de Ref.` / `Código pedido` | 39794 / 1786111234375.0 | `id_order` / `co_order` | ✅ |
| `Plataforma` | Denario | `procedencia` Denario | ✅ |
| `Responsable` | gv | `na_responsible` gv | ✅ |
| `Comentario` | ped1 | `tx_comment` ped1 | ✅ |
| líneas en la tabla | **3** | `nu_details` 3 | ✅ |
| `Monto Base Pedido` | 658.921,09 BSD | `nu_amount_total_base` 658921.0908 | ✅ |
| `Monto Total Pedido` | 658.921,09 BSD | `nu_amount_total` 658921.0908 | ✅ |
| tasa | 752,09 | `nu_value_local` 752.0900 | ✅ |

**Σ líneas == cabecera, exacto:** `131.405,16 + 499.267,43 + 28.248,50 = 658.921,09` ✅
🔑 **Y esta vez con unidades ≠ 1** (`4 Caja`, `12 Caja`, `12 Unidad`): el defecto #1 de La Tortuga
(*Σ líneas ≠ Monto Base por `qu_unit`*) **NO reproduce acá**, y ya no por el escape de "todo vale 1" —
este pedido tiene cajas y **cuadra igual**. Es evidencia positiva que el reporte de alta no pudo dar.

### `DW-DEV-D01` / `DW-DEV-D02` · devoluciones 873 y 878 → **WEB-OK** *(los datos)*

Cabecera correcta (`Responsable` Susana / QA Automatizacion, `Tipo de devolución` PostVenta / Calidad,
cliente y vendedor coincidentes). Tabla de líneas anclada por columnas `['Lote','Fecha vencimiento']`,
1 fila con lote, N° factura, vencimiento, motivo y cantidad. **Sin columnas de dinero**, como está documentado.

### `DW-INV-D01` · inventario 16 → **WEB-OK** *(con 1 defecto de numeración)*

`Código inventario` 1786110963747.0 == `co_client_stock` ✅ · `Comentario` inv1 ✅ · Empresa `DIFRANCA C.A` ✅.
Tabla de líneas con 4 productos; el patrón `Depósito` / `Exhibición` con `-` en la contraria está correcto.

### 🟡 D-INV-01 · la columna `N°` vale **1** en las 4 líneas del inventario · **NUEVO, bajo**

```html
<span class="ui-column-title">N°</span>1     ← idéntico en las 4 filas
```
No es artefacto del lector: el `1` está literal en el HTML de las 4 celdas. En `detallePedido` la misma
columna numera **1, 2, 3** correctamente ⇒ es específico de `detalleInventario`.

### ✅ Comprobado y descartado — NO son defectos

Tres cosas que parecían defectos y **no lo son**. Se documentan para que nadie las vuelva a levantar:

| Sospecha | Verificación | Veredicto |
|---|---|---|
| `Estructura: Actualizar` en 2 de 4 líneas del inventario parecía un botón filtrado en la celda | `product_structure` de `DIF_A12` tiene una estructura **llamada literalmente `Actualizar`** (2 productos), y son exactamente `ACPDT300U` y `ACPMNY300U` | **la web muestra el dato fiel** |
| `Ver Pedido Relacionado:` aparece **sin enlace** en el detalle de inventario | `client_stock.co_order = NULL` para la ref 16 ⇒ **no hay pedido relacionado** | **correcto** *(aunque la etiqueta queda huérfana, ver más abajo)* |
| El campo `Firma:` del detalle de pedido salía **vacío** al leer texto | la firma es una **imagen**, no texto: `/images/firmas/pedidos/39794_0.jpg`, `naturalWidth = 280` | **se muestra bien** |

---

# Las 4 preguntas que había que confirmar o acotar

## 1 · Los importes en 0 que se muestran en blanco → **ACOTADO: es de `detallePedido`, y NO es del alta web**

| Detalle | Campo en 0 | Cómo se ve |
|---|---|---|
| **`detallePedido`** | `Descuento :` · `Conversión Descuento:` · `Descuento Global:` · `Conversión Descuento Global:` · `IVA :` · `Conversión IVA:` | 🔴 **en blanco** |
| **`detallePedido`** | `Descuento bonif.:` | ✅ `0,00 BSD` |
| **`detalleCobro`** | `Monto total descuento` / `…conversión` (BD = 0.0000) | ✅ **`0,00 US$` / `0,00 BSD`** |
| **`detalleCobro`** | `Monto total IGTF` en un cobro sin IGTF (21813) | ✅ **`0,00 US$`** |
| **`detalleCobro`** | `Diferencia de cobro` (BD = 0.0000) | ✅ **`0,00`** |

**Dos conclusiones nuevas:**

1. 🔑 **NO pasa en todos los módulos: `detalleCobro` renderiza los ceros correctamente.** El defecto es
   **específico de `detallePedido`** — 6 etiquetas afectadas, y la de al lado (`Descuento bonif.`) funciona,
   lo que descarta "es la plantilla" y apunta a esos 6 campos en particular.
2. 🔑 **NO es un efecto del alta web.** Se reprodujo en el pedido **39794, creado desde el MÓVIL** el 07/08
   (`procedencia = 'Denario'`), no sólo en el 39797 que creó la QA desde la web. BD confirma que los 6 valen
   `0.0000`, no `null`. ⇒ **cualquier pedido, de cualquier origen, esconde su descuento global e IVA cuando
   valen 0.** Sube el alcance respecto de lo reportado en `web-alta-pedidos.md`.

⚠ El mismo patrón "etiqueta sin valor" aparece en `Ver Pedido Relacionado:` (inventarios) y `Sucursal:`
(pedidos) cuando no hay dato. Es coherente: **este build no distingue «vacío» de «cero» en ninguna parte.**

## 2 · El modal espurio `Si, Borrar` → **NO SE DISPARÓ NUNCA en lectura**

En **13 aperturas de detalle** sobre los 5 módulos, más 9 búsquedas con cambio de filtros, **no apareció
`form:msjConfirmVarChange` ni ningún otro modal no solicitado**. `Q.dialogos()` (que detecta por
`getComputedStyle(d).display === 'block'`, no por `offsetParent`) devolvió **0 diálogos abiertos** en cada
control.

⇒ **El modal espurio está confinado al formulario de ALTA de pedido** y al gesto de escribir en `Responsable`.
**Las pantallas de consulta no lo disparan.** Es una acotación útil: el defecto no contamina la operación de
lectura, que es la mayoritaria.

## 3 · El precio crudo `2625.7140000000004` → **ACOTADO al carrito del alta; el detalle formatea bien**

En la tabla de líneas de `detallePedido`, los mismos importes salen **formateados es-VE y con moneda**:

```
Precio base: 32.851,29 BSD    Subtotal: 131.405,16 BSD
Precio base: 43,68 US$        Subtotal: 174,72 US$
```

**Cero decimales de basura IEEE-754, separador de miles correcto, símbolo de moneda presente.**
⇒ **N3 es exclusivo de `form:panelCarrito` (la pantalla de alta).** El detalle no lo hereda.

## 4 · Devoluciones, columna Estatus vacía → **NUEVO DATO: el detalle NO TIENE campo Estatus**

No se repitió la medición de la lista (ya cerrada en `web.md`). Se respondió lo que sí faltaba:

| Ref | Estatus en la **lista** | Estatus en el **detalle** |
|---:|---|---|
| 873 | *(vacío)* | ❌ **el campo no existe** |
| **878** | **`Enviado`** ← la única poblada del tenant | ❌ **el campo no existe** |

Las 11 claves de la cabecera de `detalleDevolucion` son: `No. de Ref.`, `Fecha devolución`, `Vendedor`,
`Empresa`, `Código del cliente`, `Nombre del cliente`, `Responsable`, `Tipo de devolución`, `Precinto`,
`Firma`, `Ubicación`. **No hay `Estatus` ni ningún sinónimo.**

⇒ **El defecto NO se acota a la lista.** Se probó con la 878 —la única devolución del tenant que **sí** tiene
estatus— y su detalle tampoco lo muestra, porque **la pantalla no tiene dónde mostrarlo**. Para una devolución
concreta, **el operador no puede conocer su estatus por ninguna vía de la web.**

---

# Hallazgos — resumen

| # | Hallazgo | Módulo | Severidad | Estado |
|---|---|---|---|---|
| **H-A1** | `DEV-ADJUNTOS-404` — 555 devoluciones con adjunto declarado, **0 recuperables**; el botón falla **en silencio** | devoluciones | 🔴 **alta** | **NUEVO** |
| **H-A2** | `VISOR-OMITE-DOCUMENTOS` — `Ver adjuntos` nunca muestra el PDF (3 de 3 módulos) | cobros · pedidos · visitas | 🟠 media | **NUEVO** |
| **H-A3** | La firma no viaja en el ZIP (sí se ve en pantalla); `nu_attachments` la excluye | pedidos | 🟡 baja | **NUEVO** |
| **D-INV-01** | Columna `N°` vale `1` en todas las líneas del detalle de inventario | inventarios | 🟡 baja | **NUEVO** |
| **D-COB-01** | `Monto total base + IGTF ≠ Total a pagar` en pantalla (Δ = el faltante del documento); `Diferencia de cobro` **sin símbolo de moneda** en el detalle, aunque la lista sí lo trae | cobros | 🟡 baja | **NUEVO** |
| **D-COMUN-01** | 6 botones icónicos de plantilla, sin rótulo, sin tooltip y sin acción, en todos los detalles | todos | 🟡 baja | **NUEVO** |
| **D-COMUN-02** | Ningún detalle ofrece `Volver` / `Imprimir` / `Exportar` / `PDF` | todos | ℹ️ ausencia | **dato** |
| **N4 (acotado)** | Los 0 en blanco son de **`detallePedido`**, **no** de `detalleCobro`, y afectan **también a pedidos móviles** | pedidos | 🟠 media | **ampliado** |
| **H6 (acotado)** | El detalle de devolución **no tiene campo Estatus**, ni siquiera para la ref que sí lo tiene | devoluciones | 🟠 media | **ampliado** |
| **H5 (acotado)** | Inventarios **sí funciona**: bajo `DIFRANCA C.A` muestra su registro (1/1, con Estatus). El "0 de 2" es de `DDHP_A12` | inventarios | — | **acotado** |
| **N3 / modal (acotados)** | Precio crudo y modal espurio **no** existen en las pantallas de consulta | pedidos | — | **acotado** |

---

# Patrones / selectores nuevos

## 📎 Adjuntos — el mapa real de este build

| Cosa | Dónde vive | Nota |
|---|---|---|
| Fotos | `transaction_image` → `/denario/resources/images/{modulo}/{ref}_{n}.jpeg` | ⚠ el context path es **`/denario/`**, **no** `/DenarioPremium/` |
| Documentos | `transaction_files` → mismo directorio, `.pdf` | **entran al ZIP, NO al visor** |
| Firmas | `transaction_signatures` → `/denario/resources/images/firmas/{modulo}/{ref}_{n}.jpg` | **se muestran en el detalle, NO entran al ZIP** |
| Contador | `{tabla}.nu_attachments` | 🔑 **cuenta imágenes + documentos, EXCLUYE firmas** ⇒ es el oráculo exacto del **ZIP** |
| Filtro de lista | `[id$=":attachStatus_input"]` → `0` placeholder · **`1` = SI** · **`2` = NO** | ✅ **exacto contra `has_attachments`** (555 == 555). Existe en cobros y pedidos también |

**Nombre del ZIP:** `{modulo_singular}_{ref}.zip` → `cobro_21838.zip`, `pedido_39794.zip`,
`visita_28219.zip`, `inventario_16.zip`.

**Botones del detalle (ids `j_idt*` — anclar por TEXTO):** los sufijos cambian por página
(`form:j_idt161/163` cobros · `202/204` pedidos · `154/156` devoluciones · `142/144` visitas ·
`155/157` inventarios). ⇒ **`page.getByRole('button', {name:/Descargar adjuntos/i})` es la única vía estable.**

**Icono semántico útil:** las clases **sí** son semánticas aunque el id no lo sea —
`ui-icon-descargarAdjunto` y `ui-icon-verAdjunto`. Sirven de ancla alternativa al texto.

## 🔑 Estado `disabled` como oráculo barato de la familia `A##`

```js
document.querySelector('[class*="ui-icon-descargarAdjunto"]').closest('button').disabled
// true  ⇔  nu_attachments == 0     (4/4 módulos)
```
Permite decidir el caso «con/sin adjunto» **sin descargar nada** — útil para barrer muchos registros sin
traer datos productivos a disco.

## ⚠ Comprobar la CONSOLA antes de culpar al botón

El fallo de devoluciones se habría reportado como *"el botón `Descargar adjuntos` no funciona"* (cierto pero
superficial). **Lo que dio la causa fueron los 3 × HTTP 404 de la consola**, que el DOM no delata.
⇒ **Regla nueva: ante un control que "no hace nada", leer `browser_console_messages` ANTES de concluir.**
Y para confirmar, **probar la URL del recurso con `fetch` desde la propia página** (mismo origen, 1 llamada,
sin descargar nada a disco):

```js
const r = await fetch('http://…:8080/denario/resources/images/devoluciones/873_0.jpg');
r.status  // 404
```

## 🧯 El visor de adjuntos: cómo se mide bien

```js
// ✗ offsetParent !== null  → PrimeFaces lo deja null aunque esté abierto (anti-patrón ya documentado)
// ✓ display === 'block'
const d = [...document.querySelectorAll('.ui-dialog')].filter(x => getComputedStyle(x).display==='block');
// y la prueba de que la imagen REALMENTE cargó:
[...d[0].querySelectorAll('img')].map(i => i.naturalWidth)   // 0 ⇒ rota
```
🔑 **`naturalWidth === 0` es lo que distingue "el visor abre" de "el visor sirve".** En devoluciones el visor
**abre perfecto** — y las 3 imágenes están rotas. Sin esa medición el caso se marca `WEB-OK` por error.

## 🧹 Selectores reconfirmados y corregidos

| Qué decía la doc | Medido hoy |
|---|---|
| `detalleDevolucion`: tabla de líneas `j_idt169` → `170` en 07/08 | 🔄 **hoy volvió a `form:j_idt169`**. Tercera lectura distinta ⇒ **anclar SIEMPRE por columnas** `['Lote','Fecha vencimiento']` |
| `detalleCobro`: tabla de pagos `j_idt177` → `178` en 07/08 | 🔄 **hoy es `form:j_idt177`** otra vez. Ídem: `['Forma de pago','Monto cobrado']` |
| «los botones de adjuntos aparecen aunque no haya adjuntos» | 🔄 **en los 5 transaccionales aparecen `disabled`** — el esperado correcto es el estado, no la presencia |
| visitas usa `:btnBuscar`, no `:ajax` | ✅ reconfirmado |
| El ajax de Empresa repuebla las fechas | ✅ reconfirmado (inventarios: limpiar fechas **después** del `pick` funcionó) |
| `PF(...).paginator.cfg.rowCount` como conteo | ✅ útil, leído **siempre después** de un `Buscar` esperado |
| Detalle de visitas: tabla hija | **`form:visitasDT`** — columnas `N° · Actividad · Motivo · Descripción` *(no estaba documentada)* |
| Detalle de inventario: `Ver Pedido Relacionado` | ⚠ es un **`<span>` de etiqueta suelto**, no un enlace, cuando `co_order IS NULL`. **No es el "enlace cruzado"** que promete `WEB-RUNTIME §7` salvo que el inventario tenga pedido |

## 🗃 Modelo de datos — entradas nuevas

| Tabla / columna | Para qué |
|---|---|
| `{collection,order,return,visit,client_stock}.has_attachments` / `.nu_attachments` | oráculo directo de la familia `A##`; **también en `order_saved`, `potential_client`, `visit_view`** |
| `transaction_signatures` | firmas; **fuera del ZIP y fuera de `nu_attachments`** |
| `client_stock.co_order` | `NULL` ⇒ el inventario no tiene pedido relacionado (explica la etiqueta huérfana) |
| `client_stock_detail` | ⚠ **no tiene cantidad ni estructura**: sólo `co_product` / `id_client_stock`. La estructura sale de `product` → `product_structure` |
| `product_structure.na_product_structure` | ⚠ en `DIF_A12` existe una estructura llamada literalmente **`Actualizar`** — no es un placeholder de la UI |

---

## Cierre

**Se probaron 5 módulos, 11 casos de adjuntos y 13 aperturas de detalle.** Los botones del detalle funcionan
en 4 de 5 módulos; **devoluciones es el que hay que mirar antes del tag**, y el visor que oculta los PDF es
el defecto con más probabilidad de morder en el uso diario.

🔴 **TODOS los adjuntos descargados fueron BORRADOS** apenas verificado cada caso (4 ZIP: cobro 21838,
pedido 39794, visita 28219, inventario 16), tanto la copia de trabajo como la que deja el MCP en
`.playwright-mcp/`. Barrido final ejecutado y verificado en 0. **Ningún contenido de adjunto aparece en este
reporte** — sólo nombre de entrada, tamaño en bytes y magic bytes.

---

*Capa web · familias `A##` + `D##` · difranca / EL YAQUE · `main` · 2026-08-10 · READ-ONLY
(sólo `Consultar`, `<select>` de filtro, `# Ref`, fechas y los 2 botones de adjuntos —
`Copiar Pedido`, `Editar` y `Eliminar` detectados y NO tocados)*
