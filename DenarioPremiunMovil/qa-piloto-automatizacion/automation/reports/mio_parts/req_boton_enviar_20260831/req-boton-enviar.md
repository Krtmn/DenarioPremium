# REQ · Mejora del botón Enviar y campos obligatorios — mio_parts

| | |
|---|---|
| **Cliente** | `mio_parts` — MIO LUBRICANTES Y FILTROS, CA · empresa única `MIOP_ADM` |
| **Build** | APK **6.6.21.3** · rama **main** · playa El Yaque |
| **Fecha** | 31/08/2026 |
| **Alcance** | Los **7 módulos transaccionales**: Pedidos · Inventarios · Cobros · Clientes · Devoluciones · Depósitos · Visitas |
| **Cliente de prueba** | MIO PARTS & SERVICES, C.A. (`J409074560`) |

---

## El REQ que se validó

> 1. **Dejar el botón Enviar HABILITADO al iniciar la transacción.**
> 2. **Validar al pulsar Enviar**: si hay campos con error, **deshabilitar Enviar** y **poner en ROJO
>    los campos obligatorios**, con **un mensaje DEBAJO del input** indicando que está vacío y es obligatorio.
> 3. **Tras llenar los obligatorios, volver a validar**: si es correcta, **habilitar** el botón;
>    en caso contrario, **dejar los campos con error**.

🔑 **La intención de fondo:** que no se pueda enviar con obligatorios vacíos **y que la app diga QUÉ
campo falta**, no un aviso genérico.

⚠ **Nota de método:** la transacción **empieza al seleccionar el cliente**. Medir el formulario en
blanco no vale — antes de eso el botón está deshabilitado por otro motivo.

---

## LOS DOS CRITERIOS DE ACEPTACIÓN

Acordados con QA. **Sólo estas dos cosas cuentan como fallo**:

| # | Criterio |
|---|---|
| **C1** | **No debe dejar enviar** con campos obligatorios vacíos |
| **C2** | Si no deja enviar, **debe comunicar al usuario QUÉ le falta** |

🔑 **La FORMA de comunicarlo no es un fallo.** Que un módulo lo resalte en rojo y otro lo diga con un
mensaje bajo el input es **información de cada módulo**, no un defecto — mientras el usuario se entere
de qué le falta.

---

## MATRIZ DE RESULTADOS

| Módulo | C1 · No deja enviar con vacíos | C2 · Comunica qué falta | Cómo lo comunica |
|---|:--:|:--:|---|
| **Cobros** | ✅ | ✅ | «¡Campo Obligatorio!» **bajo el input** + borde rojo |
| **Clientes** | ✅ | ✅ | **8 campos en rojo** + alerta nombrando el primero |
| **Depósitos** | ✅ | ✅ | alerta **nombrando el campo**: *«Seleccione un banco…»* |
| **Pedidos** | ✅ | ✅ | alerta específica + **pestaña PEDIDO en rojo** |
| **Inventarios** | ✅ | ✅ | alerta específica |
| **Visitas** | ✅ | ✅ | alerta específica |
| **Devoluciones** | ✅ | 🔴 **NO** | con la fila **colapsada** no se ve nada |

---

## VEREDICTO

### ✅ El REQ está implementado y CUMPLE en 6 de los 7 módulos

Ninguno deja enviar con obligatorios vacíos, y todos salvo uno comunican qué falta.

**Cobros es la implementación más completa:** campo con borde rojo y **«¡Campo Obligatorio!» justo
debajo del input**. 📷 `img/cobros-E2b-campo-marcado-bajo-input.png`

**Pedidos aporta una solución elegante** cuando no hay un input concreto que señalar: marca la
**pestaña PEDIDO en rojo**. 📷 `img/pedidos-E2-tras-enviar.png`

### 🔴 Un único fallo: Devoluciones no comunica con la fila colapsada

Es el único módulo donde el usuario **no tiene forma de saber qué le falta** sin expandir la fila del
producto a mano. Detalle en H1.

### La validación SÍ se rehace al pulsar — comprobado

Se verificó en Depósitos con la secuencia decisiva:

```
vaciar el obligatorio ......................... Enviar habilitado
pulsar Enviar ................................. BLOQUEA + deshabilita ✅
cerrar la alerta .............................. sigue DESHABILITADO ✅
teclear en un campo NO obligatorio ............ SIGUE DESHABILITADO ✅
```

⇒ **El botón no se enciende por teclear en cualquier sitio**, y la validación se rehace en cada
pulsación. C1 se cumple de forma robusta.

---

## El fallo · y las observaciones que NO lo son

### 🔴 H1 · Devoluciones no comunica qué falta si la fila está colapsada

**Único incumplimiento de C2.** Con el producto agregado pero incompleto, al pulsar Enviar:

- sale la alerta `Complete cantidad y documento en todos los productos.` — pero **no dice cuál producto
  ni cuál campo**, y con varios productos en la devolución es inservible;
- el botón se deshabilita ✅;
- **la fila del producto no cambia de aspecto**: sigue gris. La app le añade la clase
  `return-send-error-hint` con `--border-color:#c5000f`, **pero no produce ningún efecto visible**;
- `.ion-invalid` = 0 porque **los inputs no están renderizados** mientras la fila está colapsada.

**Sólo al expandir la fila a mano** aparecen `Nro Factura` y `Cantidad Devuelta` en rojo.

> **Por qué es un fallo:** el usuario que no expanda la fila se queda sin saber qué corregir. La
> intención del REQ —que la app diga qué falta— no se cumple.

**Arreglo sugerido:** que la clase `return-send-error-hint` produzca un efecto visible (ya está puesta,
sólo no pinta), o que la fila se expanda sola al fallar la validación.

📷 `img/devoluciones-E2c-fila-producto-marcada.png` (colapsada, sin señal) ·
`img/devoluciones-E2d-fila-expandida-tras-enviar.png` (expandida, en rojo)

---

### ℹ️ O1 · Cada módulo comunica a su manera — **no es un fallo**

Se documenta como información, porque conviene saberlo al escribir casos de prueba:

| Mecanismo | Módulos |
|---|---|
| `.campoObligatorio` — mensaje bajo el input | **Cobros** (único) |
| `.ion-invalid` — campo en rojo, sin mensaje | Clientes · Devoluciones |
| Sólo alerta, nombrando el campo | Depósitos · Pedidos · Inventarios · Visitas |

Los tres cumplen C2. **La diferencia es de estilo, no de comportamiento.**

⚠ Para automatizar: **no basta con buscar `.ion-invalid`**. Cobros no la usa (0 en la medición) y
comunica igualmente con `.campoObligatorio`. Un guion que sólo mire una de las dos dará falsos negativos.

### ℹ️ O2 · Cobros nace deshabilitado — **no es un fallo**

Con el cliente elegido, `imagenEnviar` llega `disabled: true`. **Es coherente**: un cobro no se puede
enviar sin haber agregado un método de pago, así que no hay nada que validar todavía. Se habilita en
cuanto se carga documento y método.

### ℹ️ O3 · Clientes no deshabilita el botón — **no impide el cumplimiento**

`imagenEnviar` **sigue habilitado** tras el rechazo. Pero **no deja enviar**: sale
`Nombre obligatorio.` y marca los 8 campos en rojo. C1 y C2 se cumplen.

⚠ Sí hay un matiz de UX: en la **segunda** pulsación el aviso **degrada** de `Nombre obligatorio.`
—que nombra el campo— a `Complete todos los campos obligatorios del cliente potencial.`, más genérico.
La información sigue estando en los campos rojos, así que no incumple, pero va en dirección contraria
a la intención del REQ.

### ℹ️ O4 · Inventarios: el REQ no llegó al modal de captura

El formulario principal cumple. Pero el **modal de captura del producto** valida como antes del REQ:
alerta `Complete cantidad, unidad, fecha y lote para continuar.` con **0 campos marcados**. Es un botón
del modal, no `imagenEnviar` — **fuera del alcance del REQ**, pero conviene saber que quedó sin tocar.

## Detalle por módulo

### Cobros — la implementación de referencia
- **E1:** `disabled: true` — coherente, falta el método de pago (ver O2)
- **E2:** con Monto en 0,00 → alerta `Hay un método de pago incompleto. Complételo o elimínelo antes
  de enviar.` · botón → `disabled: true` ✅ · **`¡Campo Obligatorio!` bajo el input Monto** ✅
- **Con dos métodos** (Efectivo + Transferencia) marca **4 campos a la vez**, cada uno bajo su input:
  `¡Campo Obligatorio!` (Monto, ×2) · `Debe seleccionar una cuenta.` (Banco Receptor) ·
  `¡Campo Obligatorio!` (Nro. Referencia)
- **E4:** al llenar sólo Nro. Referencia, su marca desaparece y **las otras dos siguen** ✅
- ⚠ Las marcas de un método con el **acordeón colapsado** existen en el DOM pero con
  `offsetParent = null`: no se ven hasta expandir.
- Métodos que ofrece la UI: **Efectivo · Depósito · Transferencia · Pago Móvil**

### Clientes (Cliente Potencial)
- No hay paso de «elegir cliente»: la transacción arranca al abrir el formulario.
- **E1** ✅ · **E2** marca 8 campos ✅ · no deshabilita el botón, pero **tampoco deja enviar** (ver O3)
- **E4** ✅ (las marcas se limpian una a una) · **E3** ✅ (8 → 0)

### Devoluciones
- **E1** ✅ · **E2 sin productos:** `Debe agregar al menos un producto a la devolución.` → deshabilita ✅
- **E2 con producto incompleto:** `Complete cantidad y documento en todos los productos.` → **H1**
- **E3** ✅ · **E4** conserva las marcas de lo que sigue vacío ✅
- ℹ Fuera del REQ: el `ion-select` **Unidad** muestra `PAILA ����…` (mojibake).

### Depósitos
- **E1** ✅ · **E2** deshabilita ✅ · sin marcas de campo, pero **la alerta nombra el campo** ⇒ cumple C2
- Obligatorios detectados: **Banco** (`ion-select`) y **Nro. Plantilla** (`ion-input`), más al menos
  un cobro seleccionado en el tab COBROS.
- **E4 · Banco lleno / Plantilla vacía:** el botón **sigue deshabilitado** ✅ — pero **no hay ninguna
  marca que conservar** (`.ion-invalid` = 0, `.campoObligatorio` = 0), así que el punto 4 no se puede
  cumplir: no hay nada que «dejar con error». 🚫
- **E3 · los dos llenos:** al teclear la Plantilla el botón **se rehabilita solo** (H1) y al pulsar
  Enviar la validación pasa: `El Depósito será enviado` ✅
- ⚠ **El envío se CANCELÓ** para no crear el registro. Verificado en la nube: `deposit` sigue en
  `id_deposit = 9` (el de la corrida anterior). Nada creado por esta medición.

### Pedidos · Inventarios · Visitas — los tres de «ítem de lista»
Los tres se comportan igual y **correctamente para su caso**:

| Módulo | Aviso al pulsar Enviar | Botón |
|---|---|---|
| Pedidos | `Debe agregar al menos un producto al pedido.` | deshabilita ✅ |
| Inventarios | `Debe seleccionar al menos un producto para el inventario.` | deshabilita ✅ |
| Visitas | `Debe agregar al menos una actividad para poder enviar la visita` | deshabilita ✅ |

**No hay campo que pintar de rojo**: lo que falta es un ítem. Los tres **rehabilitan** al agregarlo ✅.

🔑 **Pedidos añade algo que los demás no hacen: marca la pestaña `PEDIDO` en ROJO.** Es una forma
razonable de señalar «el problema está aquí» cuando no hay un input concreto.
📷 `img/pedidos-E2-tras-enviar.png`

⚠ **Inventarios — matiz:** el modal de captura del producto valida **igual que antes del REQ**:
alerta `Complete cantidad, unidad, fecha y lote para continuar.` con **0 campos marcados**. Es un
botón del modal, no `imagenEnviar` — **el REQ no llegó ahí**.

---

# Pestaña marcada en rojo sin causa

> **Medición del 01/09/2026** · misma APK 6.6.21.3 (main) · mismo cliente de prueba.
> Ninguna transacción se envió: todas se descartaron sin guardar; los diálogos «… será enviado» se
> **CANCELARON**.

## Qué se buscaba

Una pestaña marcada en **ROJO** (`rgb(230, 12, 12)`) **sin que falte nada obligatorio en ella**, con
el botón **Enviar habilitado**. Lo detectó la QA a mano en Devoluciones y describió la ruta:

> «Le doy enviar, me dice FALTA X. Lleno X. Le doy enviar, me dice FALTA Y. Lleno Y. Luego la pestaña
> General sale en rojo pero no hay nada que falte ahí por llenar. Le doy enviar y sí me deja enviar.»

⚠ **Método:** la pestaña activa siempre se ve blanca. Todas las lecturas de color se tomaron
**estando situado en otra pestaña**, con `getComputedStyle(tab).color`, nunca a ojo.

---

## 1 · Matriz: módulo × ¿ocurre?

| Módulo | ¿Ocurre? | Pestaña que se queda roja | En qué momento aparece |
|---|:--:|---|---|
| **Devoluciones** | 🔴 **SÍ** | **GENERAL** | al llenar el **último** obligatorio de Productos (Cantidad) |
| **Depósitos** | 🔴 **SÍ** | **GENERAL** | al llenar el **último** obligatorio (Nro. Plantilla) |
| **Inventarios** | 🔴 **SÍ** | **INVENTARIO** | al guardar el producto en el modal de captura |
| **Cobros** | 🔴 **SÍ** | **GENERAL** | al cuadrar el Monto con el total a pagar |
| **Pedidos** | ✅ NO | — | el rojo de PEDIDO **se limpia** al agregar el producto |
| **Visitas** | ✅ NO | — | la marca se retira al agregar la actividad (pero **nunca llegó a pintarse**, ver O6) |
| **Clientes** | 🚫 **N/A** | — | tiene pestañas (GENERAL/ADJUNTOS) pero **nunca reciben el marcador** |

🔑 **Es siempre UNA sola pestaña, y no se acumulan.** Y —dato importante— **no es la pestaña del
último error corregido**: en Devoluciones los tres rechazos fueron de **Productos** y la que queda
roja es **General**. El rojo final no señala nada.

---

## 2 · La prueba de que no falta nada

En los cuatro módulos se aplicó la misma prueba decisiva: con la pestaña en rojo, **pulsar Enviar**.
En los cuatro **la app llegó al diálogo de confirmación** ⇒ da el formulario por válido.

| Módulo | Pestaña roja | `ion-invalid` | `.campoObligatorio` | Campos vacíos en esa pestaña (ninguno obligatorio) | Enviar | Resultado del Enviar final |
|---|---|:--:|:--:|---|---|---|
| **Devoluciones** | General | **0** | **0** | `Responsable`, `No. Precinto`, `Comentario` · (`Tipo`=60, `Empresa`, `Cliente` y `Fecha` con valor) | **HABILITADO** | `¿Desea enviar la devolución?` → **CANCELADO** |
| **Depósitos** | General | **0** | **0** | `Comentario` · (Empresa, Moneda, Banco, Nro. Plantilla=`QA001` con valor) | **HABILITADO** | `El Depósito será enviado` → **CANCELADO** |
| **Inventarios** | Inventario | **0** | **0** | *la pestaña no tiene campos de formulario*: es el selector de categorías, con contador `Inventario 1` | **HABILITADO** | `¿Desea enviar el Inventario?` → **CANCELADO** |
| **Cobros** | General | **0** | **0** | `Responsable`, `Comentario` · (Empresa, Cliente, Moneda, Tasa=777.42 con valor) | **HABILITADO** | `El Cobro será enviado` → **CANCELADO** |

⇒ **Hipótesis confirmada en los 4: el rojo es un RESIDUO, no un aviso vigente.**
No hay ningún obligatorio vacío. **No es el caso grave** de «deja enviar con un obligatorio sin
llenar»: el criterio **C1 sigue cumpliéndose**. Lo que falla es el **indicador**.

📌 En Cobros la evidencia es literal: una misma lectura devuelve a la vez
`alerta: "El Cobro será enviado"` y `rojas: ["General"]`.

---

## 3 · La traza vuelta a vuelta — Devoluciones

Es la que muestra el momento exacto en que el rojo deja de corresponderse con un problema real:

| Vuelta | Acción | Mensaje de la alerta | Pestañas en rojo | Enviar |
|---|---|---|---|---|
| 0 | Formulario nuevo | — | ninguna | DESHABILITADO |
| 1 | Elegir cliente | — | ninguna | HABILITADO |
| 2 | **Enviar #1** | `Debe agregar al menos un producto a la devolución.` | **Productos** ✅ correcto | DESHABILITADO |
| 3 | Agregar producto | — | ninguna | HABILITADO |
| 4 | **Enviar #2** | `Complete cantidad y documento en todos los productos.` | ninguna | DESHABILITADO |
| 5 | Llenar `Nro Factura` = 3446 | — | ninguna | HABILITADO |
| 6 | **Enviar #3** | `Complete cantidad y documento en todos los productos.` | ninguna | DESHABILITADO |
| 7 | Llenar `Cantidad Devuelta` = 1 | — | 🔴 **General** | **HABILITADO** |
| 8 | **Enviar #4** | `¿Desea enviar la devolución?` → **CANCELADO** | 🔴 **General sigue roja** | **HABILITADO** |

🔑 **El rojo aparece en la vuelta 7 — al CORREGIR, no al fallar.** Y sobrevive al Enviar que la propia
app acepta.

**Depósitos**, vuelta a vuelta, se comporta igual pero **con el indicador funcionando bien hasta el
final**:

| Vuelta | Acción | Mensaje | Pestañas en rojo | Enviar |
|---|---|---|---|---|
| 1 | **Enviar #1** | `Seleccione un banco para continuar.` | **General** ✅ correcto | DESHABILITADO |
| 2 | Elegir Banco | — | **Cobros** ✅ correcto | HABILITADO |
| 3 | **Enviar #2** | `Seleccione los Cobros a depositar` | Cobros ✅ | DESHABILITADO |
| 4 | Marcar el cobro | — | **General** ✅ correcto (falta Plantilla) | HABILITADO |
| 5 | **Enviar #3** | `Ingrese el número de plantilla para continuar.` | General ✅ | DESHABILITADO |
| 6 | Llenar `Nro. Plantilla` | — | 🔴 **General** ← ya sin causa | **HABILITADO** |
| 7 | **Enviar #4** | `El Depósito será enviado` → **CANCELADO** | 🔴 **General sigue roja** | **HABILITADO** |

---

## 4 · Segundo síntoma: el rojo se arrastra de una transacción DESCARTADA a la siguiente

Reproducido a propósito en Devoluciones y **repetible**:

```
Devolución A: pulsar Enviar una vez (falla) → salir → «Salir sin guardar»
Devolución B (NUEVA, desde el listado):
   · recién abierta, sin tocar nada ...... GENERAL ya lleva el marcador
   · al elegir el cliente ................. PRODUCTOS en ROJO  ← sin haber pulsado Enviar
```

⚠ En una **devolución B abierta desde HOME** (saliendo del módulo) el formulario **nace limpio**.
El arrastre se da al **encadenar dos formularios sin salir del módulo**.

Es el mismo defecto visto desde otro ángulo: el estado «ya se intentó enviar» no se reinicia.
📷 `img/devoluciones-tabroja-arrastrada-de-transaccion-descartada.png`

---

## 5 · Dónde está la causa (lectura de código, solo consulta)

El marcador es la clase `*-send-error-hint` sobre el `ion-segment-button`. **Hay dos formas de
decidir cuándo ponerla, y sólo una es correcta:**

| Patrón | Módulos | ¿Falla? |
|---|---|---|
| `sendValidationAttempted && resolveSendValidationFocusTab() === tab` | Devoluciones · Depósitos · Inventarios · Cobros | 🔴 **SÍ** |
| Un predicado de condición (`shouldShowProductsSendError()` / `shouldShowActivitiesSendError()`) que devuelve `false` cuando no hay problema | Pedidos · Visitas | ✅ NO |

`resolveSendValidationFocusTab()` es un resolvedor de «primer error» que **siempre devuelve una
pestaña — nunca “ninguna”**. Su última línea es un `return` incondicional:

`src/app/services/returns/return-logic.service.ts:438-455`
```ts
public resolveSendValidationFocusTab(): 'default' | 'productos' | 'adjuntos' {
  if (!this.generalTabValidForSave || !this.hasClientSelected() … ) return 'default';
  if (!this.productList || this.productList.length === 0)          return 'productos';
  for (…) if (!this.isReturnProductLineComplete(…))                return 'productos';
  if (this.hasMissingGpsCoordinate())                              return 'default';
  return 'default';          // ← sin errores… y aun así devuelve una pestaña
}
```

Como `sendValidationAttempted` **queda en `true`** tras el primer Enviar fallido, en cuanto se corrige
todo la condición se vuelve `true && 'default'==='default'` ⇒ **General se pinta y ya no se apaga**.

Los otros tres tienen exactamente la misma última línea:

| Servicio | Línea | `return` final |
|---|---|---|
| `services/returns/return-logic.service.ts` | 454 | `return 'default'` → **General** |
| `services/deposit/deposit.service.ts` | 400 | `return 'default'` → **General** |
| `services/inventarios/inventarios-logic.service.ts` | 356 | `return this.hideTab ? 'inventario' : 'actividades'` → **Inventario** |
| `services/collection/collection-logic.service.ts` | 3080 | `return 'default'` → **General** |

Coincide **campo a campo** con lo medido en la UI: los tres primeros marcan General y el de
inventarios marca Inventario.

> **Arreglo sugerido (para desarrollo):** que el resolvedor pueda devolver «ninguna» cuando no hay
> error — o que `shouldShowSendErrorHintOnTab()` consulte antes si el formulario es válido —, y que
> `sendValidationAttempted` se reinicie al abrir un formulario nuevo.

---

## 6 · Los módulos donde el indicador SÍ funciona (contraste)

### ✅ Pedidos
`Enviar` sin productos → alerta `Debe agregar al menos un producto al pedido.` + pestaña **PEDIDO en
ROJO** (correcto). **Al agregar el producto el rojo se limpia solo**, y el Enviar final llega a
`¿Desea Enviar el pedido?` con **0 pestañas rojas**.

### ✅ Visitas — el rojo se retira, pero nunca se vio
`Enviar` sin actividades → alerta `Debe agregar al menos una actividad…` y la clase
`visit-send-error-hint` **se aplica a la pestaña correcta (ACTIVIDADES)** … pero el color medido
sigue siendo `rgb(0, 0, 0)`: **no pinta**. Al agregar la actividad la clase desaparece y el Enviar
final llega a `¿Desea enviar la visita?` limpio.

ℹ️ **O6 · Por qué Visitas no pinta** — el SCSS sólo define la variable, sin el `color` plano:

| Módulo | `.*-send-error-hint` | Resultado |
|---|---|---|
| Devoluciones (`devolucion.component.scss:1`) | `--color: #e60c0c;` **+ `color: #e60c0c;`** | pinta ✅ |
| Visitas (`visita.component.scss:34`) | sólo `--color: var(--ion-color-danger…)` | **no pinta** 🔴 |

Es el mismo síntoma que el **H1** ya reportado (la fila de producto de Devoluciones lleva la clase y
no se ve). **Son la cara opuesta del mismo problema:** unos marcan de más y no se apagan, otros
marcan bien y no se ven.

### 🚫 Clientes (Cliente Potencial) — N/A
**Corrección al supuesto de partida: sí tiene pestañas** (GENERAL / ADJUNTOS). Pero se midió tras
pulsar Enviar y **ninguna de las dos recibe el marcador** (`send-error-hint` = 0 en ambas; colores
`rgb(255,255,255)` / `rgb(0,0,0)`). El aviso va por **campo** (8 `ion-invalid`) + alerta
`Nombre obligatorio.` ⇒ **el defecto no puede darse aquí.**

---

## 7 · Capturas

| Archivo | Qué muestra |
|---|---|
| `img/devoluciones-tabroja-general-sin-causa.png` | GENERAL en rojo con PRODUCTOS activa y la fila completa (Nro Factura 3446, Cantidad 1) |
| `img/depositos-tabroja-general-sin-causa.png` | GENERAL en rojo con Banco y Nro. Plantilla llenos y el cobro marcado |
| `img/inventarios-tabroja-inventario-sin-causa.png` | INVENTARIO en rojo con el producto ya inventariado |
| `img/cobros-tabroja-general-sin-causa.png` | GENERAL en rojo con `Diferencia BS: 0,00` |
| `img/devoluciones-tabroja-arrastrada-de-transaccion-descartada.png` | PRODUCTOS en rojo en una devolución **nueva**, sin haber pulsado Enviar |

---

## 8 · Lo que NO se validó (de esta sección)

| # | Pendiente | Por qué importa |
|---|---|---|
| 1 | **Si el rojo desaparece al GUARDAR y reabrir** | Sólo se midió sobre el formulario en curso; una reapertura podría reiniciar el estado |
| 2 | **Adjuntos como pestaña marcada** | Ningún módulo llegó a devolver `'adjuntos'`; con `requiredCollectionAttachments=false` en este cliente esa rama no se ejercita |
| 3 | **Cobros con varios métodos de pago o con retención** | Se midió con **un** método (Efectivo) y **un** documento; `lastSendIssues` podría dar otro resultado con varios |
| 4 | **Inventarios con `hideTab=false`** | El código marcaría **ACTIVIDADES** en vez de INVENTARIO; en este cliente la rama medida fue `hideTab=true` |
| 5 | **Devoluciones TIPO B** (`validateReturn=true`) | `mio_parts` es TIPO A; con paso de factura el resolvedor tiene una rama más |
| 6 | **Otros clientes y la capa WEB** | Todo en `mio_parts`, sólo móvil |
| 7 | **Que el envío real limpie la marca** | No se envió nada: todos los diálogos se cancelaron |

---

## Recomendación

> ⚠ **Esta sección es del 31/08 y quedó corta.** La medición del 01/09 añadió un segundo arreglo
> pendiente: el residuo de pestaña roja en **Devoluciones · Depósitos · Inventarios · Cobros**
> (ver «Pestaña marcada en rojo sin causa», §5).

**Arreglo pendiente del 31/08: que Devoluciones señale la fila incompleta.** La clase
`return-send-error-hint` ya se aplica — sólo hay que hacer que pinte. Es el único punto donde el
usuario se queda sin saber qué le falta.

Dos mejoras opcionales, que **no son fallos**:

| | Mejora | Por qué |
|---|---|---|
| 1 | Llevar el `¡Campo Obligatorio!` de **Cobros** al resto | Es la forma más clara de las tres y ya está implementada: hay una referencia interna que copiar |
| 2 | Que **Clientes** no degrade el aviso en la 2.ª pulsación | Pasa de nombrar el campo a un genérico; va en contra de la intención del REQ |

## Lo que NO se validó

| # | Pendiente | Por qué importa |
|---|---|---|
| 1 | **Pedidos E4** | No aplica (ítem de lista), pero no se comprobó si al quitar el producto vuelve a marcar |
| 2 | **El REQ en la capa WEB** | Sólo se midió móvil |
| 3 | **Otros clientes** | Todo en `mio_parts`. Las validaciones dependen de VG (`requeridedNroFactura`, `expirationBatch`…), así que **otro cliente puede exigir campos distintos** |
| 4 | **Comparación con RUN y EL EDEN** | El REQ se probó allí en su momento; ese material no está en el repo y no se pudo contrastar |
| 5 | **Que el mensaje sea legible para el usuario** | Se verificó que existe y dónde aparece, no si el texto es comprensible |

---

*Medido sobre APK 6.6.21.3 (main). Ninguna transacción se envió: todos los formularios se
descartaron sin guardar. 30 capturas en `img/`.*
