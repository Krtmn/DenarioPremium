# Revalidación del fix — Anticipo automático en USD + Alertas al Enviar

| Parámetro | Valor |
|---|---|
| Cliente QA | `globalmp` — COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. |
| **Empresa** | **`00002`** COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P (la de por defecto) |
| Playa | ISLA COCHE |
| Rama / APK | `Fixes-21` — commit **`9e5bfdfe`** · `com.kiberno.denarioPremiumPro` **v6.6.21** |
| Usuario | KIMBERLIN LEON · `id_user 300` |
| Fecha | 2026-08-27 |
| BD nube | `global_mp` · baseline `max(id_collection) = **11212**` · cierre `11218` (6 filas nuevas) |
| Tasa vigente | **785,07 BS/USD** |

---

## 1. VEREDICTO POR BLOQUE

### 🟢 BLOQUE 1 — Anticipo automático en USD: **EL FIX CERRÓ**

> **Criterio de aceptación de la QA:** *«Los anticipos deben ser generados en USD aunque se haga con una
> cobranza en BS.»* → **SE CUMPLE.**

**Las tres capas coinciden**, y en las **dos** mediciones independientes con cobro en BS:

| Capa | Cobro BS #1 | Cobro BS #2 | Cobro USD |
|---|---|---|---|
| **Mensaje** que ve el usuario | `USD 7,57` ✅ | `USD 8,19` ✅ | `USD 6,01` ✅ |
| **Anticipo en la UI** (Tab General) | `Moneda: USD` ✅ | — | ✅ |
| **`co_currency` en la nube** | **`USD`** ✅ | **`USD`** ✅ | **`USD`** ✅ |

No hay divergencia entre pantalla, app y base de datos. **No es un fix a medias.**

### 🟢 BLOQUE 2 — Alertas al ENVIAR: **BLOQUEA EN LOS CUATRO ESCENARIOS**

La alerta aparece y **bloquea el envío tanto en un cobro NO guardado como en uno GUARDADO y reabierto**
(A4, el caso que la QA quería confirmar). **PASS.**

⚠ **Matiz**: la alerta es **genérica** — el mismo texto en los cuatro casos, sin nombrar el campo que falta.
Quien discrimina es el marcado inline `¡Campo Obligatorio!` en rojo. Es el mismo comportamiento del APK
anterior; **el fix no tocó esa ruta** y no se pidió que lo hiciera.

### 🔴 Lo que NO cerró (colateral, ya levantado el 27/08 con el APK anterior)

1. **`prepaidPaymentMethod = ANT` sigue sin aplicarse** — los tres anticipos llegan a la nube con
   `co_payment_method = 'de'` (Depósito, heredado del cobro origen). **Reincidencia idéntica.**
2. **GUARDAR sigue sin validar el método de pago** — se guardó un cobro con banco/referencia/monto
   vacíos, sin ninguna alerta. La validación vive **solo** en ENVIAR. **Reincidencia.**

---

## 2. 🔑 El oráculo: son DOS variables, no una

Medidas **en vivo** sobre `collectService` del APK nuevo:

| VG | Valor medido | Qué controla |
|---|---|---|
| `prepaidRangeCurrency` | **`USD`** | la moneda para **EVALUAR EL UMBRAL** (si se crea o no) |
| **`prepaidCurrency`** | **`USD`** | 🔑 la moneda en la que **SE GENERA EL ANTICIPO** |
| `prepaidRangeAmount` | `5` | el umbral |
| `prepaidPaymentMethod` | `ANT` | nomenclatura del método de pago del abono |
| `automatedPrepaid` | `true` | activa el anticipo automático |
| `MonedaTolerancia` | `USD` | — |
| `RangoToleranciaPositiva` | `10` | tolerancia máxima positiva (no ejercida) |

> Descripción literal de `prepaidCurrency` en la configuración:
> *«¿En qué moneda debe generarse el anticipo automático? Seleccione la moneda.»*

**Esto es lo que vuelve el diagnóstico incontestable.** El APK anterior **respetaba `prepaidRangeCurrency`**
(convertía a USD para decidir *si* crear el anticipo) pero **ignoraba `prepaidCurrency`** (lo creaba en la
moneda del cobro). Con `prepaidCurrency = USD`, un anticipo en BS **no era una interpretación discutible:
era incumplir una configuración explícita del cliente.**

⇒ **Hoy se respetan las dos.** El umbral seguía funcionando (ver B8) y ahora **también** la moneda de
generación. **Fix completo sobre lo pedido.**

---

## 3. Tabla comparativa ANTES → AHORA

| Escenario | APK anterior (27/08, corrida previa) | **APK `Fixes-21` `9e5bfdfe` (esta corrida)** | |
|---|---|---|---|
| Cobro **USD** → mensaje | `USD 6,00` | `USD 6,01` | ✅ igual de correcto |
| Cobro **USD** → `co_currency` del anticipo | `USD` | **`USD`** | ✅ se mantiene |
| 🔴 Cobro **BS** → mensaje | **`BS 4.945,56`** ❌ | **`USD 7,57`** · **`USD 8,19`** | 🟢 **CORREGIDO** |
| 🔴 Cobro **BS** → `co_currency` del anticipo | **`BS`** ❌ | **`USD`** · **`USD`** | 🟢 **CORREGIDO** |
| Cobro **BS** → `nu_amount_total` del anticipo | `4945.5600` (BS) | `7.5700` · `8.1900` (USD) | 🟢 **CORREGIDO** |
| Umbral evaluado en USD | ✅ ya funcionaba | ✅ sigue funcionando | sin cambio |
| `prepaidPaymentMethod = ANT` | llega `'de'` ❌ | llega `'de'` ❌ | 🔴 **sin corregir** |
| GUARDAR valida método de pago | no ❌ | no ❌ | 🔴 **sin corregir** |
| Alerta de método incompleto | genérica | genérica | sin cambio |

---

## 4. 🔑 B6 / B7 — el corazón de la revalidación

### Medición 1 · cobro BS 8.000,00

**Montaje:** cliente **COMERCIAL TOTAL PLUS, C.A. (CT16)**, cobro nacido en la moneda por defecto (**BS**),
documento **FF084223** (documento en USD, saldo **2,62 USD = 2.056,88 BS**). Pago por **Depósito MERCANTIL**
de **8.000,00 BS** ⇒ *Diferencia BS: **5.943,12***.

**Texto LITERAL del mensaje:**

> **«Se creará un anticipo automático por el monto excedente de USD 7,57. Se enviará un anticipo junto al cobro.»**
> — título `Denario Cobros` · botón `[Aceptar]`

**BD nube (`collection`):**

| Campo | Valor |
|---|---|
| `id_collection` | **11214** |
| `co_type` | `1` (anticipo) |
| **`co_currency`** | 🎯 **`USD`** ← *antes daba `BS`* |
| `nu_amount_total` | `7.5700` |
| `nu_amount_total_conversion` | `5943.1200` |
| `nu_value_local` (tasa) | `785.0700` |
| `co_original_collection` | `1787882902634.0` = cobro **11213** ✅ |

**UI del anticipo reabierto (Ref 11214):** Tab General rotula **`Moneda: USD`**, `Tasa BS: 785,07`,
etiqueta **"Fecha Anticipo"**. Tab Total: **`Total General USD: 7,57`**.

### Medición 2 · cobro BS 61.000,00 — *segunda medición independiente, otro monto*

**Montaje:** mismo cliente, documento **FF086118** (saldo **69,51 USD = 54.570,22 BS**). Pago **61.000,00 BS**
⇒ *Diferencia BS: **6.429,78***.

**Texto LITERAL:**

> **«Se creará un anticipo automático por el monto excedente de USD 8,19. Se enviará un anticipo junto al cobro.»**

**BD nube:** `id_collection` **11216** · `co_type=1` · **`co_currency='USD'`** · `nu_amount_total = 8.1900` ·
`nu_amount_total_conversion = 6429.7800` · `co_original_collection` = cobro **11215** ✅

> **Dos aciertos independientes, con montos distintos y documentos distintos.** No es un valor cacheado
> ni una casualidad.

---

## 5. B9 — la aritmética, explícita

Tasa usada en las tres: **`nu_value_local = 785,07 BS/USD`**.

| # | Cobro | Diferencia positiva | ÷ tasa | Resultado exacto | Anticipo creado | ¿Cuadra? |
|---|---|---|---|---|---|---|
| 1 | 11213 (BS) | **5.943,12 BS** | ÷ 785,07 | **7,570178…** | **USD 7,57** | ✅ |
| 2 | 11215 (BS) | **6.429,78 BS** | ÷ 785,07 | **8,190072…** | **USD 8,19** | ✅ |
| 3 | 11217 (USD) | **6,01 USD** | (sin conversión) | 6,01 | **USD 6,01** | ✅ |

Comprobación inversa de la conversión almacenada: `7,57 × 785,07 = 5.942,98` ≈ `5.943,12` (la nube guarda
`nu_amount_total_conversion = 5943.1200`, el valor **exacto** de la diferencia; la UI del Tab Total imprime
`BS 5.942,98`, que es el redondeo a 2 decimales re-multiplicado — **diferencia de 0,14 BS, cosmética**).

⇒ **El monto es correcto, no solo la moneda.**

---

## 6. B8 — umbral bajo (control negativo)

Sobre el **mismo cobro 11215** antes de subir el monto: pago de **56.000,00 BS** sobre un saldo de
**54.570,22 BS** ⇒ *Diferencia BS: **1.429,78***.

`1.429,78 ÷ 785,07 = **1,8212 USD**` → **por debajo** del umbral `prepaidRangeAmount = 5` **USD**.

**Resultado: NO salió ninguna alerta y NO se generó anticipo.** ✅ **PASS.**

⚠ Nótese que **1.429,78 es muy superior a 5 BS** — si el umbral se evaluara en BS habría creado el anticipo.
**Confirma que `prepaidRangeCurrency = USD` se respeta**, igual que en el APK anterior.

---

## 7. Bloque 1 — tabla de casos

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| **B1** | Cobro USD con diferencia sobre el umbral genera anticipo + mensaje | ✅ **PASS** | Cobro 11217 → anticipo 11218 |
| **B2** | Mensaje específico que **nombra el monto** | ✅ **PASS** | «…por el monto excedente de **USD 6,01**…» |
| **B3** | Moneda del **mensaje** en el cobro USD | ✅ **PASS** | `USD 6,01` |
| **B4** | Moneda del **anticipo** en el cobro USD | ✅ **PASS** | `co_currency='USD'`; UI `Moneda: USD` |
| **B5** | Cotejo BD del anticipo USD | ✅ **PASS** | `11218` · `co_type=1` · `co_currency='USD'` · `6.0100` |
| **B6** 🔑 | **Cobro BS** — mensaje y anticipo en USD | ✅ **PASS ×2** | `USD 7,57` (11214) · `USD 8,19` (11216) |
| **B7** 🔑 | `co_currency` del anticipo del cobro BS | ✅ **PASS ×2** | **`USD`** en 11214 y 11216 |
| **B8** | Cobro BS bajo el umbral (1,82 USD) | ✅ **PASS** | Sin alerta, sin anticipo |
| **B9** | Coherencia del monto convertido | ✅ **PASS** | §5, tres filas exactas |

---

## 8. Bloque 2 — alertas al ENVIAR (tabla con texto literal)

**Todas** las alertas de este bloque comparten título **`Denario Cobros`** y botón **`[Aceptar]`**.

| ID | Caso | Resultado | **Mensaje LITERAL** | Inline `¡Campo Obligatorio!` |
|---|---|---|---|---|
| **A1** | NO guardado · **con referencia, SIN monto** → Enviar | ✅ **PASS** (bloquea) | «Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.» | **1** — solo bajo *Monto* |
| **A2** | NO guardado · **con monto (5.000,00) y banco, SIN referencia** → Enviar | ✅ **PASS** (bloquea) | *(idéntico)* | **1** — solo bajo *Nro. Depósito* |
| **A3** | NO guardado · **ambos vacíos** → Enviar | ✅ **PASS** (bloquea) | *(idéntico)* | **2** — *Nro. Depósito* y *Monto* |
| **A4** 🔑 | **GUARDADO y reabierto**, método incompleto → Enviar | ✅ **PASS** (bloquea igual) | *(idéntico)* | **0** — ver nota ⚠ |
| **A5** | Todo lleno → Enviar | ✅ **PASS** (no bloquea) | pasa directo a «El Cobro será enviado» `[Cancelar · Aceptar]` | — |
| **A6** | Texto de cada alerta | ⚠ **genérico** | **el mismo texto en A1–A4**: no nombra el campo que falta | el inline sí discrimina |

⚠ **Hallazgo fino en A4:** en el cobro **reabierto desde Guardado** la alerta bloquea correctamente, pero
el marcado inline `¡Campo Obligatorio!` **no se ve** — el acordeón del método de pago abre **colapsado**, así
que los campos no están renderizados. Con la alerta genérica **y** sin marcado visible, el usuario que
reabre un Guardado **no tiene ninguna pista de qué campo completar** hasta que expande el acordeón a mano.
Es el escenario donde la falta de especificidad del mensaje más pesa.

### Otras alertas capturadas (literales)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Anticipo automático (al `blur` del Monto) | `Denario Cobros` | «Se creará un anticipo automático por el monto excedente de **USD 7,57**. Se enviará un anticipo junto al cobro.» | `Aceptar` |
| Adjunto obligatorio | `Denario Cobros` | «Para poder enviar el Cobro, debe agregar al menos un adjunto.» | `Aceptar` |
| Confirmación de envío | `Denario Cobros` | «El Cobro será enviado» | `Cancelar` · `Aceptar` |
| Acuse del servidor (cobro) | `Denario Premium` | «Cobro nro. **11213** enviado exitosamente» | `OK` |
| Acuse del servidor (anticipo) | `Denario Premium` | «Anticipo nro. **11214** enviado exitosamente» | `OK` |
| Guardado | `Denario Cobros` | «El Cobro se ha guardado» | `Aceptar` |
| Dirty-guard | `Denario Cobros` | *(mensaje vacío)* | `Guardar y salir` · `Salir sin guardar` · `Cancelar` |
| Borrado | `Denario Cobros` | «¿Desea eliminar el Cobro?» | `Cancelar` · `Eliminar` |

**Leyenda en pantalla (no alerta):** el pago que originó el anticipo queda rotulado en el Tab Pagos como
**«Este pago creó el anticipo automático»**. Eso sí es específico.

---

## 9. Registros creados en el sistema

**3 cobros enviados** (dentro del máximo de 4) + los **3 anticipos** que el sistema generó solo.

| id | Tipo (`co_type`) | Moneda | Monto | Diferencia | Cliente | Estado |
|---|---|---|---|---|---|---|
| **11213** | 0 · Cobro | **BS** | 8.000,00 | +5.943,12 BS | COMERCIAL TOTAL PLUS (CT16) | Enviado |
| **11214** | 1 · **Anticipo automático** | 🎯 **USD** | **7,57** | — | idem | Enviado |
| **11215** | 0 · Cobro | **BS** | 61.000,00 | +6.429,78 BS | COMERCIAL TOTAL PLUS (CT16) | Enviado |
| **11216** | 1 · **Anticipo automático** | 🎯 **USD** | **8,19** | — | idem | Enviado |
| **11217** | 0 · Cobro | USD | 96,00 | +6,01 USD | COMERCIAL TOTAL PLUS (CT16) | Enviado |
| **11218** | 1 · **Anticipo automático** | **USD** | **6,01** | — | idem | Enviado |

- Documentos consumidos: **FF084223** (11213) · **FF086118** (11215) · **FF086105** (11217).
- Método de pago en los 6: **Depósito · MERCANTIL `01050030351030355770`**; tasa `785,07`; `co_enterprise=00002`.
- `max(id_collection)` cerró en **11218**, exactamente 6 filas sobre el baseline **11212**. Sin huérfanas.

### Cobros descartados / eliminados (no quedan en el sistema)

| Cobro | Para qué | Destino |
|---|---|---|
| CM42 · COMERCIAL GRAN MUNDO 128 · método incompleto | montar **A4** (guardar → reabrir → Enviar) | **Guardado y luego ELIMINADO** con el trash de la lista («¿Desea eliminar el Cobro?» → `Eliminar`) |
| CM42 · con monto sin referencia | montar **A2** | **Descartado** con «Salir sin guardar» (nunca se guardó) |
| CM59 · COMERCIAL MUNDO ECONOMICO 888 | intento fallido de A4 (cliente sin documentos) | **Descartado** con «Salir sin guardar» |
| CL34 · COMERCIAL NEW LIFE | primer intento (documento ya consumido por la corrida previa) | reemplazado por CT16 en el mismo formulario |

**Verificación de limpieza:** tras cerrar, la lista de cobros muestra **0 registros en estado "Guardado"**
(`filteredItems = 222`, ninguna coincidencia con `/Guardado/`).

---

## 10. Hallazgos colaterales

### 🔴 1. `prepaidPaymentMethod = ANT` sigue sin aplicarse — **reincidencia**

La VG pide la nomenclatura `ANT` para el método de pago del abono automático. En la nube, los pagos de los
**tres** anticipos llegan con el método heredado del cobro origen:

| Anticipo | `co_currency` | `co_payment_method` | Esperado |
|---|---|---|---|
| 11214 | USD | **`de`** (Depósito) | `ANT` |
| 11216 | USD | **`de`** | `ANT` |
| 11218 | USD | **`de`** | `ANT` |

Idéntico a lo observado con el APK anterior (anticipos 11202 y 11204). **El fix de moneda no tocó esto.**
El `nu_amount_partial` sí viene coherente en USD (`7.5700` / `8.1900` / `6.0100`).

### 🔴 2. GUARDAR no valida el método de pago — **reincidencia**

Un cobro con **banco, referencia y monto vacíos** se guardó sin ninguna alerta («El Cobro se ha guardado»).
Queda un Guardado en estado inválido que **solo se descubre al intentar enviarlo**. La validación vive
únicamente en ENVIAR.

### 🟠 3. `requiredCollectionAttachments` **exige adjunto** en cobro normal — contradice el YAML

El perfil `automation/clientes/globalmp.yaml` declara `requiredCollectionAttachments: false` («false para
cobros normales; true para Retención»). **En este build la app lo exige**: `collectService.requiredCollectionAttachments = true`
y el envío se bloquea con «Para poder enviar el Cobro, debe agregar al menos un adjunto.»

⚠ **No puedo determinar si es un cambio del APK o un cambio de configuración del tenant hecho hoy** — la
corrida previa de esta misma mañana envió 3 cobros sin tropezar con esta guarda. **Queda para desarrollo /
configuración.** Se resolvió firmando en el acordeón **Firma** del Tab Adjuntos (ver §11); el YAML necesita
actualizarse en cualquier caso.

### 🟡 4. `Total Depósitos:` sin formato — defecto ya conocido

En el Tab Total del anticipo imprime `USD 7.57` (punto decimal, sin separadores) mientras la línea BS sí
formatea (`BS 5.942,98`). **Ya levantado el 30/07/2026 y de nuevo el 27/08.** No se reporta como nuevo.

---

## 11. Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Alcance | Detalle |
|---|---|---|
| 🔑 **La FIRMA del Tab Adjuntos satisface `requiredCollectionAttachments` y es 100 % conducible por CDP** | universal | Con `requiredCollectionAttachments=true` y sin mock de cámara: `grp.value='sign'` + `ionChange` → `app-adjunto canvas` (306×223 CSS / 280×220 px) → trazo con `pg.mouse.down()` + N `move` + `up()` → **cuenta como adjunto y el envío completa**. Verificar con `getImageData` que hay píxeles pintados (`alpha≠0`) **antes** de pulsar Enviar: un trazo demasiado rápido no registra y la alerta de adjunto vuelve a salir. **Evita el mock de cámara y el "dejar en Guardado"** en clientes con adjunto obligatorio |
| ⚠ **El trazo de firma debe ser LENTO** | universal | `move` cada ~45 ms con `down()`/`up()` separados por ~150 ms. Con 25 ms por paso el canvas quedó vacío en 2 de 3 intentos |
| **`prepaidCurrency` es la VG que decide la moneda del anticipo** (≠ `prepaidRangeCurrency`) | universal | `prepaidRangeCurrency` = moneda del **umbral**; **`prepaidCurrency` = moneda de GENERACIÓN**. Leer **las dos** de `collectService` antes de juzgar un anticipo: son variables distintas y un build puede respetar una e ignorar la otra |
| **Selector de Moneda Documento = `ion-alert` de radios, no popover** | globalmp v6.6.21 | `app-cobro-documents ion-select` → click real → `ion-alert` con `[Moneda, BS, USD, Cancel, OK]`; **2 clicks** (opción → `OK`). ⚠ Botones de acción en **INGLÉS**. **Contrasta con el selector de Moneda del cobro** (Tab General, 2.º `ion-select`), que en el mismo formulario abre un **`ion-popover`** de 1 click — reconfirma «la variante la fija el CONTROL, no el módulo» |
| 🔴 **"No hay documentos" NO significa que el cliente no tenga cartera** | universal | Los documentos ya cobrados por una corrida previa desaparecen del selector, aunque el **"Saldo USD" del modal de clientes siga mostrando el valor viejo** (CL34 rotulaba `Saldo USD: 1,98` con 0 documentos disponibles). ⇒ **el saldo del modal de clientes es un dato STALE: no usarlo para elegir cliente de prueba.** Verificar contando `ion-checkbox` en el Tab Documentos |
| **"AGREGAR MÉTODO DE PAGO" es inerte sin documento seleccionado** | globalmp | Con `Monto total a pagar: 0,00` el botón no abre el `#eventModal` (2 intentos, sin error ni alerta). **Seleccionar el documento ANTES** de ir a Pagos |
| **El tipo de cobro se rotula en el `ion-item` de la lista** | reconfirma `[difranca]` | `… | Estatus: Enviado | Fecha: 27/08/2026 **Anticipo**` — permite localizar un anticipo sin abrirlo. El BUSCAR **sí filtra por Nro Ref** (`11214` → 1 resultado) |
| **Un anticipo enviado abre con 3 tabs** (`default`/`total`/`adjuntos`) y etiqueta **"Fecha Anticipo"** | reconfirma `[run_vzla][kron]` | Tab General rotula `Moneda: USD` en texto plano (legible por `innerText`, a diferencia del cobro donde los valores viven en `.value`) |
| **La alerta del anticipo sale en el `blur` del campo Monto**, no al Enviar | reconfirma | Barrer alerts antes de leer el Tab Pagos o se pierde el texto |
| **El envío con anticipo produce 3 alertas** | reconfirma | `El Cobro será enviado` → `Cobro nro. N enviado exitosamente` `[OK]` → `Anticipo nro. N+1 enviado exitosamente` `[OK]` |
| **Monto: centavos acumulativo, sin coma** | reconfirma globalmp | `8.000,00`→`"800000"` · `61.000,00`→`"6100000"` · `96,00`→`"9600"` · `5.000,00`→`"500000"`. Backspace×N + `keyboard.type` de dígitos |
| **GPS: pre-vuelo obligatorio** | universal | `adb shell pm grant com.kiberno.denarioPremiumPro android.permission.ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` antes de abrir Cobros |

---

## 12. Lo que NO se validó

| Tema | Motivo |
|---|---|
| **Empresa `00001` HC TRADING MARKET 2021** | Toda la corrida se hizo en la empresa por defecto `00002`. No se comprobó si el anticipo se comporta igual en la otra empresa |
| **Anticipo con cobro en BS y documento en BS** | El tenant **no tiene documentos en BS**: los del device son todos USD. B6 se midió necesariamente con documento USD + cobro BS (igual que la corrida previa, así que la comparación ANTES→AHORA es válida) |
| **Diferencia por encima de `RangoToleranciaPositiva = 10` USD** | Las tres diferencias quedaron entre 6,01 y 8,19 USD, deliberadamente bajo la tolerancia máxima. No se probó qué hace la app cuando el excedente la supera |
| **Métodos Efectivo / Cheque / Otros / Pago Móvil** | El cliente (empresa `00002`) solo ofrece **Depósito** y **Transferencia**. Todo se midió con **Depósito**; **no se repitió el bloque 2 con Transferencia** en esta corrida (en la previa dio alerta idéntica, cambiando solo la etiqueta a `Nro. Referencia`) |
| **Botón ANTICIPO / PREPAGO manual** | `cobroPrepago = false` — el tile no existe. Solo se ejerció el anticipo **automático** |
| **`prepaidPaymentMethod = ANT`: causa raíz** | Se constató que llega `'de'`; **no se investigó el código** ni si la VG se lee en algún punto. Queda para desarrollo |
| **Si `requiredCollectionAttachments=true` es del APK o del tenant** | No se pudo discriminar (ver §10.3). Requiere comparar el dump de configuración de hoy contra el de la mañana |
| **Round-trip §9 completo del anticipo** | Se reabrió y cotejó el anticipo **11214** (moneda, tasa, total); **no** se reabrieron 11216 ni 11218 |
| **Foco tras cerrar la alerta** | No se instrumentó el instante posterior al cierre; con la alerta abierta el foco queda en su propio botón |
| **Retención, IGTF, pago parcial, descuentos** | Fuera del alcance |

---

## 13. Capturas

| Archivo | Qué muestra |
|---|---|
| `img/B6_mensaje-anticipo-USD_cobroBS.png` | 🎯 Cobro en **BS** (Diferencia BS 5.943,12) con el mensaje **«USD 7,57»** |
| `img/B6b_mensaje-anticipo-USD819_cobroBS.png` | 🎯 2.ª medición — cobro BS, mensaje **«USD 8,19»** |
| `img/B4_anticipo11214_moneda-USD.png` | Anticipo 11214 reabierto: Tab General con **`Moneda: USD`** |
| `img/B4_anticipo11214_total-USD.png` | Anticipo 11214, Tab Total: **`Total General USD: 7,57`** |
| `img/A2_con-monto-sin-referencia.png` | A2 — alerta + inline solo bajo *Nro. Depósito* |
| `img/A3_ambos-vacios.png` | A3 — alerta + los dos campos marcados `¡Campo Obligatorio!` |
| `img/A4_guardado-reabierto-bloquea.png` | 🔑 A4 — cobro **Guardado y reabierto**: la alerta bloquea igual |

---

*Corrida ejecutada por CDP sobre `webview_devtools_remote_23218` en `:9220`. Sin `#eventModal.present()` en
ningún punto (clicks reales). BD nube `global_mp` operativa toda la corrida; BD local **no disponible**
(`local-query.js` falla por módulo `sql.js` ausente) ⇒ el cotejo §10 se hizo solo contra la nube, respaldado
por el acuse del servidor («… enviado exitosamente») en los 3 envíos.*
