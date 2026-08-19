# Quiebre de inventario (cantidad 0) — validación v21

**Cliente:** difranca (DIFRANCA C.A) · **Playa:** El Yaque · **Empresa:** DDHP_A12 (*DISTRIBUIDORA DIAZ HERNANDEZ*)
**Fecha:** 2026-08-13 · **Vendedor QA:** VEND206 / Jose Raad (id_user 275)
**Device:** Infinix X6728 · Android 15 · APK del 12-08 15:31 · `window.ng=true`
**Alcance:** móvil (CDP) + web (lectura) + BD nube + BD local del device

---

## Qué se probó

REQ solicitado por **EL EDEN**, pero la funcionalidad **queda disponible para todos los clientes**
— no es una regla propia de difranca; acá solo se usó su configuración y sus datos para validarla.

Pedido: **poder registrar el quiebre de inventario** cargando un producto con cantidad **CERO**,
para dejar constancia de que el cliente no tiene ese producto. Para eso se bajó el mínimo de 1 a 0.

### El cambio real en el código

Commit **`0a654f43`** (2026-07-30, luis.castillo) — *"feat(inventario): update inventory quantity
validation and input constraints"*. **No está en el tag 20**, confirmando que es de la 21.

| Qué cambió | Dónde |
|---|---|
| `min="1"` → `min="0"` | `inventario-product-list.component.html:128` |
| Nuevo `isValidInventoryQuantity()` — finito y `>= 0` | `.component.ts:289` |
| Reemplazó **5** chequeos `> 0` / `<= 0` | validación de guardado, `validateCantidad` y **3 filtros de rehidratación** |

> 🔴 **Lo importante no es el `min`.** Los 3 filtros de rehidratación (`.ts:444`, `:493`, `:588`)
> antes **descartaban del render** toda unidad con `quStock <= 0`. Sin ese arreglo, el quiebre se
> habría podido teclear pero **habría desaparecido al reabrir el inventario**. Por eso el eje de
> esta corrida fue el round-trip, no el tecleo.

El componente vive en `productos-tab/` pero lo consume **INVENTARIOS**
(`inventario-inventario.component.html` → `<productos-tab [inventario]>`). **No afecta a pedidos
ni devoluciones**, que usan otros hijos del mismo tab. Alcance acotado.

---

## Resultado: ✅ la funcionalidad opera correctamente end-to-end

Inventario **Ref 20** — CAR755 MULTIDISTRIBUIDORA JAKE · 3 líneas · `co_client_stock 1786635291850.0`

| Producto | Cantidad | Lote | Rol en la prueba |
|---|---|---|---|
| ACBA300U | **0** | QAQ0813 | quiebre sin historial de venta |
| ACBBKRI300U | 7 | QAN0813 | línea normal (control) |
| MABBKRI240U | **0** | QAQ0813B | quiebre **con** promedio de venta (12) |

### Casos

| # | Caso | Resultado |
|---|---|---|
| Q-01 | El input de cantidad admite `min="0"` en la APK del device | ✅ PASS — atributo leído en runtime |
| Q-02 | Cantidad **0** + lote + fecha → Aceptar | ✅ PASS — `quStock:0`, `validateCantidad:true`, sin alerta |
| Q-03 | Cantidad **−1** → Aceptar | ✅ PASS — **rechazado**, modal queda abierto, `rangeUnderflow=true` |
| Q-04 | Tab Resumen muestra la línea en 0 | ✅ PASS — `ACBA300U … 0 Unidad` |
| Q-05 | Producto en 0 cuenta como inventariado | ✅ PASS — contador **"Inventario 2"** (con el fix viejo habría dicho 1) |
| Q-06 | Guardar → BD local del device | ✅ PASS — `qu_stock=0` persistido |
| Q-07 | **Reabrir el Guardado: el 0 sobrevive** | ✅ PASS — rehidrata cantidad, lote y fecha |
| Q-08 | Reabrir el modal de captura del producto en 0 | ✅ PASS — `value="0"` + lote; ítem marcado "Inventariado: Exhibición" |
| Q-09 | Enviar → payload | ✅ PASS — `quStock:0` viaja íntegro en `clientstockservice/clientstock` |
| Q-10 | Cotejo BD nube | ✅ PASS — Ref 20, `st_client_stock=1`, `qu_stock` = 0.0000 / 7.0000 / 0.0000 |
| Q-11 | **Web: la línea en 0 se muestra** | ✅ PASS — `0.00 Unidad` en Exhibición, con lote y vencimiento |
| Q-12 | Web: cotejo de cabecera | ✅ PASS — Ref, código inventario, fecha, vendedor, cliente, sucursal, empresa |
| Q-13 | Pedido sugerido con quiebre **y** promedio | ✅ PASS — actual 0, promedio 12 → **sugiere 12** |

**Móvil 10/10 · Web 3/3 · 0 FAIL · 0 BLOCKED.**

El riesgo principal del lado web —que el detalle filtrara las cantidades en 0 igual que lo hacía
el móvil— **no se materializó**: la web renderiza `0.00 Unidad` sin problema.

---

## Observaciones (ninguna bloquea la 21)

### O-1 · 🔴 `clientStock=false` y el módulo funciona igual — para consultar con el cliente

Leído en runtime del device: `clientStock = "false"`. Y sin embargo el módulo INVENTARIOS aparece
en el HOME y es operable de punta a punta: esta misma corrida creó y envió la Ref 20.

**Es la 2ª confirmación**: ferrenuestro ya lo había documentado. Ya no es rareza de un cliente,
es cómo se comporta el build. **No es algo que QA pueda cerrar** — es decisión de producto si la
VG debe ocultar el módulo. Queda para consultar con el cliente y con desarrollo.

> Corrección al perfil: el dump **no mentía** en el valor. Lo que estaba mal era la inferencia
> "VG en false ⇒ el módulo no existe", que dejó inventarios marcado como N/A estructural el 07-ago.
> Tampoco vale derivarlo del conteo bajo de `client_stock` (16 filas): eso prueba poco uso, no ausencia.

### O-2 · ⚠️ Sin historial de venta, el sugerido no ayuda al quiebre

En la rama que aplica a difranca (`suggestedOrderByDispatchAndReturn=false`), líneas 573-584 de
`inventarios-logic.service.ts`:

```js
if (unitUtil.dispatchedStock > 0) {
  quUnitSuggested = dispatchedStock - currentStock;   // razonable
} else {
  quUnitSuggested = unitUtil.currentStock;            // ⚠ sugiere lo que YA tiene
}
```

Medido:

| Producto | Inventario | Promedio | Sugerido | Lectura |
|---|---|---|---|---|
| MABBKRI240U | **0** | 12 | **12** | ✅ correcto, repone todo |
| ACBA300U | **0** | 0 | **0** | sin historial |
| ACBBKRI300U | 7 | 0 | **7** | ⚠️ sugiere exactamente lo que ya tiene |

**No es una regresión de la 21** — ese `else` es código previo que el commit no tocó. Pero antes
era **inalcanzable con un quiebre**, porque no se podía registrar 0. La funcionalidad nueva expone
esa rama a un valor que nunca había recibido.

Confirmado que aquí es **condición de dato, no defecto**: ni ACBA300U ni ACBBKRI300U fueron
facturados nunca a CAR755 (0 filas en `invoice_detail`), tal como anticipó QA. El caso de negocio
—producto con rotación que se acaba— **funciona bien**.

Vale la pena preguntarle a desarrollo si `else → currentStock` es intencional, sobre todo por la
línea del producto con stock 7 que se sugiere a sí mismo.

### O-3 · Cosmético, preexistente: columna `N°` repetida en la web

En el detalle web todas las líneas muestran `N° = 1` en vez de 1/2/3. **Verificado que es previo**
a esta funcionalidad: la Ref 18 (creada el 11-08, sin ceros) lo hace igual. Independiente del quiebre.

### O-4 · `expirationBatch=true` sí bloquea en INVENTARIOS

Alerta `Inventario` / *"Complete cantidad, unidad, fecha y lote para continuar."* El campo que
bloquea es el **lote** (la fecha trae default HOY y la unidad llega preseleccionada). Alinea con
el_palmar y contradice globalmp ⇒ **el alcance de esta VG es por módulo**. En difranca, en
DEVOLUCIONES la misma VG es inocua.

---

## Cotejo web (Ref 20)

| Campo | Móvil / BD | Web | |
|---|---|---|---|
| No. de Ref. | 20 | 20 | ✅ |
| Código inventario | 1786635291850.0 | 1786635291850.0 | ✅ |
| Fecha | 13/08/2026 11:34:51 | 13/08/2026 11:34:51 | ✅ |
| Vendedor | Jose Raad | Jose Raad | ✅ |
| Cliente | CAR755 · MULTIDISTRIBUIDORA JAKE, C.A | idem | ✅ |
| Empresa | DDHP_A12 | *DISTRIBUIDORA DIAZ HERNANDEZ* | ✅ |
| Línea 1 | MABBKRI240U · 0 · QAQ0813B | `0.00 Unidad` Exhibición · QAQ0813B | ✅ |
| Línea 2 | ACBBKRI300U · 7 · QAN0813 | `7.00 Unidad` Exhibición · QAN0813 | ✅ |
| Línea 3 | ACBA300U · 0 · QAQ0813 | `0.00 Unidad` Exhibición · QAQ0813 | ✅ |

Web en modo lectura: solo se usó `Consultar`, según `WEB-RUNTIME.md §0`.

---

## Patrones / selectores nuevos

Promovidos a `automation/cdp/module-selectors/inventarios.md` con la marca `[difranca-20260813]`:

1. **Oráculo de build:** `min` del `input[placeholder="Ingrese cantidad"]` — `0` ⇒ APK v21.
2. **El buscador del modal de clientes no tiene placeholder en este build.**
   `input[placeholder="Clientes..."]` da null y se lee como "el modal no abrió".
   Real: `#clienteSelectModal input.search-input.inputsSearch`.
3. **Modal de captura multi-fila** (multi-lote): `ion-card.capture-row-card`, `.add-lot-button`,
   `.delete-row-btn`, `expDate{i}` por fila. Unidad y fecha nacen prellenadas.
4. **`local-query.js` no sirve en este device** (sin `sqlite3` para `run-as`). Fallback: obtener el
   `SQLiteObject` por CDP desde el componente y correr `executeSql`.
5. **Contador "Inventario N"** del nivel de familias como oráculo del filtro de inventariados.
6. **Pedido sugerido:** elegir el producto por `client_avg_products.average > 0`, no al azar.

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `automation/clientes/difranca.yaml` | `inventarios.aplica` false → **true**; `clientStock` redocumentada (valor intacto, inferencia corregida); datos de prueba y hallazgos de la corrida |
| `automation/cdp/module-selectors/inventarios.md` | Bloque `[difranca-20260813]` con los 6 patrones |

## Datos creados

| Sistema | Registro |
|---|---|
| Móvil / nube | Inventario **Ref 20**, `st_client_stock=1` (Enviado), 3 líneas |
| Pedidos | **Ninguno** — el modal de sugerido se cerró con `dismiss('cancel')`, su ACEPTAR crea pedido |
| Correos | `notificationsClientStock=true` ⇒ 1 correo disparado, a las cuentas QA (playa de pruebas) |
