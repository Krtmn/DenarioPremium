# REQ · Botón Enviar y campos obligatorios — IMPORTADORA 4K

| | |
|---|---|
| **Cliente** | `4k` — GRUPO 4K · empresa única `DIESE` (rótulo en UI: **DIESEL**) |
| **Playa** | CARIBE (servidor CONTABO) |
| **Build** | APK **6.6.21.3** · `db_version` 21 · usuario `V.0002` ANGEL BETANCOURT (idUser 300) |
| **Fecha** | 04/09/2026 · 11:30 – 12:40 |
| **Método** | Conducción **manual** de la UI por CDP (`:9220`). **No** se usaron los guiones de `playwright/modules/*.js`. |
| **Alcance** | Los 7 módulos transaccionales |
| **Referencia** | `automation/reports/mio_parts/req_boton_enviar_20260831/req-boton-enviar.md` (medición del 31/08 + 01/09) |

---

## 🔴 AVISO DE SEGURIDAD — se envió un cobro por error

**Se envió una transacción real.** Debe anularse.

| | |
|---|---|
| **Qué** | Cobro `Nro Ref 2615` · Estatus **Enviado** |
| **Cliente** | C.0010 EURO REPUESTOS FIOVAL, C.A. |
| **Monto** | **Bs 482.850,00** · método Transferencia · banco PROVINCIAL · referencia `QAREF001` |
| **Comentario** | `QA REQ ENVIAR` (así se identifica) |
| **Fecha** | 04/09/2026 12:11 |
| **En la nube** | ✅ **SÍ llegó** — `collection.co_collection = 1788538281492.0`, `st_collection = 3`, `co_currency = Bs` |
| 📷 | `img/14-cobro-2615.png` |

**Causa (mía, no de la app):** el helper que cierra alertas filtraba por `getBoundingClientRect().width > 0`
pero **no** por `overlay-hidden`. Con varias `ion-alert` en el DOM tomó una **ya descartada**, calculó las
coordenadas de *su* botón y pulsó a ciegas: el clic cayó sobre el diálogo que sí estaba vivo
(«El Cobro será enviado») en la zona de **Aceptar**. Es la trampa 5 del prompt, aplicada al cierre y no
solo a la lectura. Corregido a mitad de corrida; el resto de los diálogos se cancelaron con un helper que
**verifica antes y después** (`antes: [alerta] → click: "Cancelar" → despues: []`).

### Barrido de verificación — nada más se creó

| Módulo | Comprobación | Resultado |
|---|---|---|
| Pedidos | listado BUSCAR | último 03/09 · **nada del 04/09** ✅ |
| Devoluciones | listado BUSCAR | solo Nro. Ref 228 del 03/09 ✅ |
| Inventarios | listado BUSCAR | «No hay resultados» ✅ |
| Visitas | RUTA DE HOY | EURO REPUESTOS **no aparece**; todo «No Visitado» ✅ |
| Clientes Potenciales | BUSCAR CLIENTE POTENCIAL | solo `Test-CLT-SMOKE-239927` (corrida vieja); `QA REQ ENVIAR` **no aparece** ✅ |
| Depósitos | listado BUSCAR | solo Nro. Ref 23 (04/09 **11:22**) y 22 (03/09) — **ninguno mío** ✅ |
| Cobros | listado BUSCAR | 2613 (11:12, comentario `v`) y 2614 son **anteriores a mi sesión**; **solo 2615 es mío** |

📷 `img/15-cobro-2613.png` — el 2613 marca *Fecha Cobro 4/9/2026 11:12 A.M.*, veinte minutos antes de que
yo abriera Cobros: es de la prueba manual de la QA, no de esta corrida.

---

## 1 · Tabla módulo × E1 / E2 / E5

| Módulo | **E1** · Enviar al iniciar | **E2** · Mensaje literal al rechazar | **E2** · qué se marca | **E5** · ¿pestaña roja sin causa? |
|---|---|---|---|:--:|
| **Clientes** | ✅ **HABILITADO** | `Nombre obligatorio.` · 2.ª pulsación: `Complete todos los campos obligatorios del cliente potencial.` | **8** `ion-invalid.ion-touched` + hint en Nombre · Rif · Responsable | 🚫 **N/A** — las pestañas nunca reciben el marcador |
| **Pedidos** | ✅ **HABILITADO** (tras elegir cliente) | `Debe agregar al menos un producto al pedido.` | pestaña **PEDIDO** en `rgb(230,12,12)` ✔ correcto | ✅ **NO** |
| **Cobros** | ⚪ **DESHABILITADO** — coherente, falta el método de pago (O2 del 31/08) | `Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.` | **3 mensajes bajo el input**: `Debe seleccionar una cuenta.` · `¡Campo Obligatorio!` ×2 + pestaña PAGOS con hint | ✅ **NO** |
| **Inventarios** | ✅ **HABILITADO** | `Debe seleccionar al menos un producto para el inventario.` | pestaña **INVENTARIO** en `rgb(230,12,12)` ✔ correcto | ✅ **NO** |
| **Devoluciones** | ✅ **HABILITADO** (tras cliente **+ factura** — TIPO B) | sin productos: `Debe agregar al menos un producto a la devolución.` · con fila incompleta: `La cantidad a devolver debe estar entre 1 y` ⚠ | pestaña **PRODUCTOS** con hint + fila del producto con `return-send-error-hint` (**no pinta**) | ✅ **NO** (pero ver §3 · arrastre) |
| **Depósitos** | ✅ **HABILITADO** | `Seleccione un banco para continuar.` → `Seleccione los Cobros a depositar` → `Ingrese el número de plantilla para continuar.` | pestaña **GENERAL**/**COBROS** en `rgb(230,12,12)` ✔ correcto + selector de banco y Nro. Plantilla marcados | ✅ **NO** |
| **Visitas** | ✅ **HABILITADO** (tras elegir cliente) | `Debe agregar al menos una actividad para poder enviar la visita` | pestaña **ACTIVIDADES** recibe la clase **pero sigue `rgb(0,0,0)`: no pinta** (O6, sin arreglar) | ✅ **NO** |

**C1 y C2 se cumplen en los 7 módulos.** Ninguno dejó enviar con obligatorios vacíos, y en los 7 el
usuario se entera de qué falta (por alerta, por campo marcado, o por ambos).

En los 7, con el formulario completo el Enviar llegó al **diálogo de confirmación**, que se **CANCELÓ**
(salvo el incidente del cobro 2615 descrito arriba):

| Módulo | Diálogo final |
|---|---|
| Clientes | `¿Desea enviar nuevo Cliente Potencial?` → CANCELADO |
| Pedidos | `¿Desea Enviar el pedido?` → CANCELADO |
| Cobros | `El Cobro será enviado` → 🔴 **se pulsó Aceptar por error** |
| Inventarios | `¿Desea enviar el Inventario?` → CANCELADO |
| Devoluciones | `¿Desea enviar la devolución?` → CANCELADO |
| Depósitos | `El Depósito será enviado` → CANCELADO (verificado ×3) |
| Visitas | `¿Desea enviar la visita?` → CANCELADO |

---

## 2 · Matriz del F1 — la pestaña roja sin causa

> ⚠ **Método.** La pestaña activa siempre se ve blanca. **Todas** las lecturas de color se tomaron
> estando parado en **otra** pestaña, con `getComputedStyle(tab).color`. Rojo de error = `rgb(230,12,12)`.

| Módulo | 01/09 (versión con defecto) | **04/09 (esta medición)** | Evidencia |
|---|:--:|:--:|---|
| **Devoluciones** | 🔴 SÍ — GENERAL | ✅ **NO ocurre** | al llenar `Cantidad Devuelta` (último obligatorio): General `rgb(0,0,0)`, `hints: []`, 0 `ion-invalid`, 0 `.campoObligatorio` |
| **Depósitos** | 🔴 SÍ — GENERAL | ✅ **NO ocurre** | ver §2.1 — traza completa, dos órdenes distintos, tres pasadas |
| **Inventarios** | 🔴 SÍ — INVENTARIO | ✅ **NO ocurre** | tras guardar el producto en el modal: Inventario `rgb(0,0,0)`, `hint:false` |
| **Cobros** | 🔴 SÍ — GENERAL | ✅ **NO ocurre** | con `Diferencia Bs: 0,00`: las **5** pestañas leídas inactivas dan `rgb(0,0,0)` |
| **Pedidos** | ✅ NO | ✅ **NO** | el rojo de PEDIDO se limpia al agregar el producto |
| **Visitas** | ✅ NO | ✅ **NO** | la clase se retira al agregar la actividad (y nunca llegó a pintar, ver O6) |
| **Clientes** | 🚫 N/A | 🚫 **N/A** | ambas pestañas `rgb(0,0,0)` estando inactivas; el aviso va por campo |

### 🔑 El F1 está ARREGLADO en los 4 módulos donde ocurría — Depósitos incluido

**Esto contradice el reporte manual de la QA**, que decía que «solo Depósitos seguía mostrando la falsa
alarma». En esta APK **no pude reproducirlo en Depósitos** por ningún camino. Ver §2.1 y §5.

### 2.1 · Depósitos — traza vuelta a vuelta contra la de referencia

Reproduje el guion exacto de la tabla de referencia del prompt:

| Vuelta | Acción | Mensaje | Pestañas en rojo (01/09) | **Pestañas en rojo (04/09)** |
|---|---|---|---|---|
| 1 | **Enviar #1** (vacío) | `Seleccione un banco para continuar.` | General ✔ | **General ✔ correcto** |
| 2 | Elegir Banco (ZELLE) | — | Cobros ✔ | **Cobros `rgb(230,12,12)` ✔ correcto** |
| 3 | **Enviar #2** | `Seleccione los Cobros a depositar` | Cobros ✔ | **Cobros ✔** |
| 4 | Marcar el cobro (ref 2478 · 50 USD) | — | General ✔ | **General `rgb(230,12,12)` ✔ correcto** |
| 5 | **Enviar #3** | `Ingrese el número de plantilla para continuar.` | General ✔ | **General ✔** |
| 6 | **Llenar `Nro. Plantilla` = QA001** | — | 🔴 **General ← sin causa** | ✅ **General `rgb(0,0,0)` — SIN ROJO** |
| 7 | **Enviar #4** | `El Depósito será enviado` → CANCELADO | 🔴 General sigue roja | ✅ **0 pestañas rojas** |

**Prueba decisiva en la vuelta 6-7** (leída parado en COBROS):

```
General:  rgb(0, 0, 0)   rojo:false   hint:false
Cobros:   rgb(255,255,255) (activa)
Total:    rgb(0, 0, 0)
Adjuntos: rgb(0, 0, 0)
ion-invalid: 0 · .campoObligatorio: 0 · hints: [] · Enviar: HABIL
→ Enviar → "El Depósito será enviado" → CANCELADO (verificado: despues: [])
```

📷 `img/17-deposito-F1-ARREGLADO-general-negra.png` — GENERAL en **negro** con la plantilla llena
y el cobro marcado. Es exactamente el estado en el que la versión anterior la pintaba de rojo.

**Variante de orden** (por si la QA llegó por otro camino): llenar la Plantilla **primero**, luego banco,
y dejar el **cobro** como último obligatorio corregido. Mismo resultado: General `rgb(0,0,0)`, `hints: []`,
Enviar → confirmación → CANCELADO. **Tres pasadas completas, ningún rojo residual.**

### 2.2 · Prueba decisiva en los otros tres

| Módulo | Momento medido | `ion-invalid` | `.campoObligatorio` | Pestañas rojas | Enviar |
|---|---|:--:|:--:|:--:|---|
| **Devoluciones** | tras llenar `Cantidad Devuelta`=1 | **0** | **0** | **ninguna** | `¿Desea enviar la devolución?` → CANCELADO |
| **Inventarios** | tras guardar el producto (cant. 5, lote LOTEQA1) | **0** | **0** | **ninguna** | `¿Desea enviar el Inventario?` → CANCELADO |
| **Cobros** | con `Diferencia Bs: 0,00` | **0** | **0** | **ninguna** (5 leídas inactivas) | `El Cobro será enviado` |

**Coincide con el código.** Los 4 resolvedores llevan el arreglo `SEND-TAB-001` — el tipo de retorno pasó
a `… | null` y el último `return` incondicional se cambió por `return null`; los cuatro
`shouldShowSendErrorHintOnTab()` filtran con `focus != null && focus === tab`:

| Servicio | Antes (01/09) | Ahora |
|---|---|---|
| `services/returns/return-logic.service.ts:454` | `return 'default'` | `return null` |
| `services/deposit/deposit.service.ts:400` | `return 'default'` | `return null` |
| `services/inventarios/inventarios-logic.service.ts:356` | `return this.hideTab ? 'inventario' : 'actividades'` | `return null` |
| `services/collection/collection-logic.service.ts:3088` | `return 'default'` | `return null` |

---

## 3 · 🔴 Lo que SÍ sigue roto — Devoluciones arrastra el rojo a una transacción NUEVA

Es el **segundo síntoma** (§4 del informe del 01/09). **Sigue reproduciéndose, y sí pinta.**

```
Devolución A: pulsar Enviar (falla) → salir → «Salir sin guardar»
Devolución B (NUEVA, abierta desde el listado, SIN salir del módulo):
   · recién abierta, sin tocar nada ..... GENERAL ya lleva el marcador + hint en «Cliente:»
   · al elegir el cliente ................ el hint salta a «Factura:»  ← sin haber pulsado Enviar
   · al elegir la factura ................ 🔴 PRODUCTOS en rgb(230, 12, 12)  ← sin haber pulsado Enviar
```

📷 `img/09-dev-ARRASTRE-productos-roja-sin-enviar.png` — **PRODUCTOS en rojo** en una devolución nueva
donde el Enviar nunca se pulsó.

> ### 📌 Criterio de QA (04/09) — NO va al manual del cliente
>
> La responsable QA lo evaluó y decidió: **no es grave y no afecta al REQ ni a la
> operatividad**. Sus razones, que corrigen cómo estaba redactado antes:
>
> 1. **No ocurre al entrar al módulo.** Solo después de **salir sin guardar** una
>    devolución con campos faltantes. Es un camino mucho menos frecuente de lo que
>    sugería la redacción anterior.
> 2. En un formulario recién abierto **falta todo**, así que señalarlo **no es una
>    falsa alarma**: la información es correcta, solo llega antes de tiempo.
> 3. El aviso aparece **antes** de pulsar Enviar, no en lugar de él. C1 y C2 se
>    siguen cumpliendo.
>
> ⇒ **Queda documentado aquí para nosotros y fuera del manual del cliente.**
> Si alguna vez molesta en campo, el arreglo es reiniciar `sendValidationAttempted`
> al abrir un formulario nuevo, como ya hace `resetSendValidationUx()` en Depósitos.

> **Matiz importante, para no exagerarlo.** No es exactamente el F1: aquí **sí falta algo** (el producto).
> Lo que falla es el **momento**: `sendValidationAttempted` no se reinicia al abrir un formulario nuevo,
> así que la app regaña al usuario antes de que haga nada mal. No incumple C1 ni C2.

**No ocurre en Depósitos**: un depósito nuevo abierto desde el listado nace limpio (`hints: []`,
sin rojo) — ahí `resetSendValidationUx()` sí funciona.

---

## 4 · Comparación explícita contra la medición del 01/09

### ✅ Lo que se arregló

| # | Hallazgo del 31/08–01/09 | Estado 04/09 |
|---|---|---|
| 1 | **F1 · pestaña roja residual en Devoluciones** | ✅ **ARREGLADO** |
| 2 | **F1 · pestaña roja residual en Depósitos** | ✅ **ARREGLADO** (contradice el reporte manual de la QA) |
| 3 | **F1 · pestaña roja residual en Inventarios** | ✅ **ARREGLADO** |
| 4 | **F1 · pestaña roja residual en Cobros** | ✅ **ARREGLADO** |
| 5 | **H1 · Devoluciones no comunicaba qué falta** | ✅ **MEJORADO** — ahora el Enviar **salta solo a la pestaña PRODUCTOS** y, al expandir la fila, `Cantidad Devuelta` sale con borde rojo. La alerta también cambió: ya no es la genérica `Complete cantidad y documento en todos los productos.`, sino una que nombra el campo. 📷 `img/07-dev-fila-expandida.png` |
| 6 | Depósitos no marcaba ningún campo (solo alerta) | ✅ **MEJORADO** — ahora marca el **selector de banco** y **Nro. Plantilla** con `deposit-send-error-hint` |

### 🔴 Lo que sigue igual

| # | Hallazgo | Estado 04/09 |
|---|---|---|
| 1 | **§4 · el rojo se arrastra de una devolución descartada a la siguiente** | 🔴 **SIGUE** — ver §3, reproducido y capturado |
| 2 | **H1 residual · la fila del producto lleva la clase y no pinta** | 🔴 **SIGUE** — `ion-item.return-send-error-hint` tiene `--border-color: #c5000f` pero el computado es `borderColor: rgb(0,0,0)` y `color: rgb(0,0,0)`. Con la fila **colapsada** no se ve nada. 📷 `img/06-dev-fila-colapsada-sin-marca.png` |
| 3 | **O6 · Visitas aplica la clase pero no pinta** | 🔴 **SIGUE** — `ACTIVIDADES` con `hint:true` y `color: rgb(0,0,0)` leído estando inactiva. El SCSS sigue definiendo solo `--color`, sin el `color` plano |
| 4 | **O4 · Inventarios: el REQ no llegó al modal de captura** | 🔴 **SIGUE** — el ✓ del modal con los campos vacíos da `Complete cantidad, unidad, fecha y lote para continuar.` con **0 campos marcados**. Fuera del alcance del REQ (no es `imagenEnviar`). 📷 `img/04-inv-modal-vacio.png` |
| 5 | **O3 · Clientes degrada el aviso en la 2.ª pulsación** | 🔴 **SIGUE**, pero con matiz — no es degradación gratuita: los 7 campos del 2.º nivel comparten un mismo mensaje genérico en `getPotentialClientValidationMessage()`. La información sigue en los campos rojos |
| 6 | **O2 · Cobros nace deshabilitado** | ⚪ **IGUAL** — y sigue siendo coherente, no es un fallo |

### 🆕 Hallazgo nuevo de esta corrida

**N1 · Devoluciones: mensaje truncado.** Con la fila del producto incompleta, el Enviar muestra:

```
La cantidad a devolver debe estar entre 1 y
```

Leído del DOM (`.alert-message.innerHTML`, 43 caracteres) — **termina ahí, sin el máximo**. La plantilla
del mensaje no está interpolando el límite superior. Nombra el campo, así que **C2 se cumple**, pero el
texto queda a medias. `img/07-dev-fila-expandida.png` muestra el estado del formulario en ese momento.

---

## 5 · Sobre el reporte manual de la QA («solo Depósitos seguía fallando»)

**No lo pude reproducir.** Depósitos salió limpio en **tres pasadas completas**, con **dos órdenes**
distintos de llenado, midiendo siempre desde otra pestaña. Posibles explicaciones, en orden de
probabilidad:

1. **Confusión con el rojo CORRECTO.** En Depósitos hay dos momentos en que una pestaña se pone roja
   **con causa real** y son fáciles de leer como falsa alarma:
   - vuelta 2 → **COBROS** en rojo justo después de elegir el banco (aún no hay cobros marcados);
   - vuelta 4 → **GENERAL** en rojo justo después de marcar el cobro (aún falta la plantilla).

   En ambos el rojo desaparece en cuanto se completa lo que falta. Si se mira GENERAL en la vuelta 4 sin
   haber llenado todavía la plantilla, se ve exactamente como el defecto — pero no lo es.
2. **Build distinto.** El `versionName` es `6.6.21.3`, el **mismo** que el de la medición del 31/08, así
   que el número de versión **no distingue** el APK con defecto del APK con el arreglo. Si la QA probó
   antes de instalar este APK, vio el defecto real.
3. **Otro camino no cubierto** (ver §7).

⚠ **Recomendación:** que la QA repita su caso indicando en qué vuelta exacta vio el rojo y con qué
pestaña activa. Si el rojo lo vio en la vuelta 2 o 4, es el correcto.

---

## 6 · Cliente usado en cada módulo, y por qué

**El perfil `4k.yaml` está desactualizado.** `cliente_test: "C.0507"` (y también `C.0627`, `C.0525`)
**no existen en el equipo**: el selector trae 78 clientes, los 50 de la primera página van de `C.0010` a
`C.0827` y **ni C.0507 ni C.0627 están** (entre `C.0506` y `C.0510`, y entre `C.0624` y `C.0635`, no hay
nada). Elegí el cliente **probándolo en la UI**, no desde el perfil.

| Módulo | Cliente usado | Por qué |
|---|---|---|
| **Clientes** | — (no aplica) | Cliente Potencial es un alta: no hay paso de «elegir cliente». Datos: `QA REQ ENVIAR 4K` / `J123456789` |
| **Pedidos** | **C.0010** EURO REPUESTOS FIOVAL | primero del listado y confirmado operativo. Producto: `ANILLO CATERPILLAR 3116` (`11-11-1020-000`, línea MOTOR), cantidad 2. ⚠ el producto del perfil `4400-01202` **no dio resultados** en la búsqueda para este cliente |
| **Cobros** | **C.0010** | C.0507 y C.0627 no están en el equipo. C.0010 trae 5 documentos FAC vencidos y saldo USD 2.512,00 — suficiente. Método: Transferencia / PROVINCIAL |
| **Inventarios** | **C.0010** | mismo criterio; producto MOTOR con stock (`validStock=true` + `stock0=false`) |
| **Devoluciones** | **C.0010** + factura **CJA-00020103** | TIPO B (`validateReturn=true`): la **factura** habilita las tabs. C.0010 ofrece **10 facturas devolvibles** (la BD reporta 12; 2 no son devolvibles). Producto: `CONCHA DE BANCADA IVECO TECTOR / VERTIS 010` |
| **Depósitos** | — (no aplica) | El depósito no se hace contra un cliente: se hace contra un **banco** + cobros ya existentes. Banco **ZELLE**, cobro ref **2478** (PRODIESEL TRUCKS, 50 USD) |
| **Visitas** | **C.0010** | confirmado operativo. Actividad `VISITA FUERA DE RUTA` + motivo `VENTA EFECTIVA` |

### Variables globales confirmadas en la UI (desempatan el YAML)

| VG | Valor leído en pantalla |
|---|---|
| `colletionPayment` | métodos ofrecidos: **Efectivo · Cheque · Depósito · Transferencia · Pago Móvil** |
| **Depósitos aplica** | ✅ **SÍ** — *Efectivo* está entre los métodos de Cobros, y el módulo funciona |
| `requiredComment` | ✅ **true** — `Comentario` nace `ion-invalid` en el cobro y hay que llenarlo |
| `expirationBatch` | ✅ **true** — el modal de inventario exige Cantidad + Lote + Fecha |
| `validateReturn` | ✅ **true** — sin factura, el Enviar de la devolución nace DESHABILITADO |
| `enterpriseEnabled` | empresa única **DIESEL** en todos los formularios |
| Moneda depósito | USD (`multiCurrencyDeposit=true`, hay selector) |

---

## 7 · Lo que NO se pudo medir — BLOCKED

| # | Caso | Motivo |
|---|---|---|
| 1 | **Pestaña ADJUNTOS como pestaña marcada** | ningún módulo devolvió `'adjuntos'`. Con `requiredCollectionAttachments=false` y sin `requiredDepositAttachments`, esa rama no se ejercita en 4K |
| 2 | **Inventarios con `hideTab=false`** | la rama medida fue `hideTab=true` (se marcó INVENTARIO). Con `hideTab=false` el código marcaría ACTIVIDADES/RESUMEN — no cubierto |
| 3 | **Cobros con retención o con varios métodos a la vez** | se midió con **un** documento y **un** método (Transferencia). `cobroRetencion=false` ⇒ el submódulo Retención no aplica; el campo de retención dentro del cobro **no se ejercitó** |
| 4 | **Cobros: banda muerta de tolerancia (9,01–9,99 USD)** | fuera del alcance de este REQ; no se probó |
| 5 | **Anticipo / Prepago** | el submódulo existe (`cobroPrepago=true`) pero **no se midió**: no está entre los 7 del alcance |
| 6 | **Que el envío real limpie la marca** | no se pudo comprobar de forma controlada; el único envío real fue accidental y no se instrumentó |
| 7 | **Devoluciones TIPO A** | 4K es TIPO B. La rama sin factura no existe aquí |
| 8 | **La capa WEB** | solo móvil |
| 9 | **Multi-empresa** | 4K tiene **una sola** empresa (`DIESE`); el caso no es cubrible con este cliente |
| 10 | **El caso exacto que reportó la QA en Depósitos** | 🔴 **no reproducido** — ver §5. **No lo doy por aprobado ni por rechazado**: lo doy por *no reproducible en esta APK* |

---

## 8 · Capturas

| Archivo | Qué muestra |
|---|---|
| `img/09-dev-ARRASTRE-productos-roja-sin-enviar.png` | 🔴 **PRODUCTOS en rojo** en una devolución NUEVA sin haber pulsado Enviar (§3) |
| `img/17-deposito-F1-ARREGLADO-general-negra.png` | ✅ GENERAL en **negro** con plantilla llena y cobro marcado — el F1 arreglado |
| `img/13-cobro-E2-campos-marcados.png` | los 3 campos de Cobros con borde rojo y mensaje bajo el input |
| `img/07-dev-fila-expandida.png` | `Cantidad Devuelta` con borde rojo al expandir la fila |
| `img/06-dev-fila-colapsada-sin-marca.png` | la misma fila **colapsada**: la clase está, no se ve nada (H1 residual) |
| `img/04-inv-modal-vacio.png` | modal de captura de Inventarios: alerta sin ningún campo marcado (O4) |
| `img/16-deposito-general.png` | formulario de Depósito: Banco, Nro. Plantilla, Fecha Doc prellenada |
| `img/14-cobro-2615.png` | 🔴 el cobro enviado por error — comentario `QA REQ ENVIAR` |
| `img/15-cobro-2613.png` | el cobro de las 11:12 de la QA — **no** es de esta corrida |
| `img/03-inv-modal-captura.png` · `img/11-cobro-documentos.png` · `img/12-cobro-pagos.png` · `img/05-dev-general.png` · `img/10-cobro-general.png` · `img/00-clientes-listado.png` · `img/01-pedido-estado.png` · `img/02-pedido-cliente.png` · `img/08-dev-estado.png` | contexto de cada flujo |

---

## 9 · Veredicto

> ### ✅ El REQ **CUMPLE** en los 7 módulos: C1 y C2 se satisfacen en todos.
> ### ✅ El F1 está **ARREGLADO en los 4 módulos** donde ocurría — **Depósitos incluido**.
> ### 🔴 Queda **un** defecto vivo: Devoluciones arrastra el marcador a la transacción siguiente (§3).

**Arreglo pendiente (1):** reiniciar `sendValidationAttempted` al abrir un formulario nuevo de
Devolución. Depósitos ya lo hace bien (`resetSendValidationUx()`); es el mismo patrón.

**Mejoras que no son fallos (3):**

| | Mejora | Por qué |
|---|---|---|
| 1 | Que `return-send-error-hint` (fila de producto) y `visit-send-error-hint` (pestaña) **pinten** | ya llevan la clase; el SCSS solo define `--border-color`/`--color` sin el `color`/`border-color` plano |
| 2 | Completar el mensaje `La cantidad a devolver debe estar entre 1 y …` | le falta el límite superior (N1) |
| 3 | Llevar el `¡Campo Obligatorio!` de Cobros al resto | sigue siendo la forma más clara de las tres |

**Acción inmediata para QA/desarrollo:** anular el cobro `Nro Ref 2615` /
`collection.co_collection = 1788538281492.0` (C.0010, Bs 482.850,00, comentario `QA REQ ENVIAR`).

---

*Medido a mano sobre APK 6.6.21.3, playa CARIBE, el 04/09/2026. Salvo el cobro 2615 descrito en el aviso
de seguridad, ninguna transacción se envió: todos los formularios se descartaron sin guardar y todos los
diálogos «… será enviado» se cancelaron con verificación previa y posterior.*
