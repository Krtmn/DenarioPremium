# Cobros — Alertas de método de pago + Anticipo automático

| Parámetro | Valor |
|---|---|
| Cliente QA | `globalmp` — COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. |
| **Empresa usada** | **`00002` COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P** (la de por defecto; no se tocó `00001 HC TRADING MARKET 2021`) |
| Playa | ISLA COCHE |
| Rama / APK | `Fixes-21` — `com.kiberno.denarioPremiumPro` **v6.6.21** (versionCode 22) |
| Usuario | KIMBERLIN LEON · `id_user 300` |
| Fecha | 2026-08-27 |
| BD nube | `global_mp` (operativa) · baseline `max(id_collection) = 11199` |
| Tasa vigente | 785,07 BS/USD |

---

## 1. VEREDICTO POR BLOQUE

### 🟡 BLOQUE A — Alertas de referencia / monto: **PARCIAL**

**La alerta existe y bloquea el envío, pero es GENÉRICA: no dice qué falta.**
El mismo texto sale en los tres escenarios (sin referencia, sin monto, ambos vacíos):

> *«Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.»*

Lo pedido —«que salga un mensaje de alerta cuando el usuario no coloque referencia ni monto»— se
cumple en el sentido de que **sale alerta**; **no** se cumple el criterio de PASS de A2/A3/A4, que exige
que la alerta **nombre el campo faltante**. Quien discrimina el campo es el marcado inline en rojo
(`¡Campo Obligatorio!` bajo cada campo), no el mensaje.

🔴 **Además: GUARDAR no valida nada.** El cobro 11200 se **guardó** con banco vacío, referencia vacía y
monto 0,00 y sin ninguna alerta. La validación vive **solo en ENVIAR**.

### 🔴 BLOQUE B — Anticipo automático en USD: **FALLA EL CASO B6**

- Cobro **en USD** ⇒ mensaje en USD y anticipo en USD ⇒ **cumple** (B1-B5 ✅).
- Cobro **en BS** ⇒ mensaje en **BS** y anticipo generado en **BS** ⇒ **NO cumple** (B6 ❌).

**El anticipo hereda la moneda del COBRO, no la `MonedaTolerancia` (USD).**
Y no es que la app no sepa convertir: **el umbral `prepaidRangeAmount = 5` sí se evalúa en USD**
(evidencia en §5). Es decir, la app convierte a USD para decidir *si* crea el anticipo, pero **no** para
decidir *en qué moneda* lo crea ni en qué moneda lo anuncia.

---

## 2. Texto LITERAL de cada alerta

| # | Título | Mensaje literal | Botones |
|---|---|---|---|
| Método incompleto (A1/A2/A3/A4) | `Denario Cobros` | **«Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.»** | `Aceptar` |
| Anticipo automático — cobro **USD** (B1/B2/B3) | `Denario Cobros` | **«Se creará un anticipo automático por el monto excedente de USD 6,00. Se enviará un anticipo junto al cobro.»** | `Aceptar` |
| Anticipo automático — cobro **BS** (B6) | `Denario Cobros` | **«Se creará un anticipo automático por el monto excedente de BS 4.945,56. Se enviará un anticipo junto al cobro.»** | `Aceptar` |
| Guardado | `Denario Cobros` | «El Cobro se ha guardado» | `Aceptar` |
| Confirmación de envío | `Denario Cobros` | «El Cobro será enviado» | `Cancelar` · `Aceptar` |
| Acuse cobro (servidor) | `Denario Premium` | «Cobro nro. **11201** enviado exitosamente» | `OK` |
| Acuse anticipo (servidor) | `Denario Premium` | «Anticipo nro. **11202** enviado exitosamente» | `OK` |
| Dirty-guard | `Denario Cobros` | *(mensaje vacío)* | `Guardar y salir` · `Salir sin guardar` · `Cancelar` |

**Leyenda en pantalla (no alerta):** el pago que originó el anticipo queda rotulado en el Tab Pagos como
**«Este pago creó el anticipo automático»** (azul, bajo el acordeón del método). Buen detalle: eso sí es
específico.

---

## 3. BLOQUE A — casos

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| **A1** | Método sin referencia y sin monto → **ENVIAR** | ✅ **PASS** (sale alerta) | «Hay un método de pago incompleto…» · `img/A1-A4_metodo-incompleto.png` |
| **A1b** | Mismo caso → **GUARDAR** | ❌ **FAIL** | Guarda sin alerta ninguna. Cobro 11200 quedó guardado con banco/ref/monto vacíos |
| **A1c** | Mismo caso → **AGREGAR** (modal de métodos) | ⚠ No aplica | El botón AGREGAR solo inserta el acordeón; no valida (ni puede: los campos aún no existen) |
| **A2** | **Con referencia, SIN monto** | ❌ **FAIL** al criterio | Sale la alerta, pero **no menciona el monto**. Inline: `¡Campo Obligatorio!` solo bajo *Monto*. `img/A2_con-ref-sin-monto.png` |
| **A3** | **Con monto, SIN referencia** | ❌ **FAIL** al criterio | Misma alerta genérica; **no menciona la referencia**. Inline: `¡Campo Obligatorio!` solo bajo *Nro. Depósito*. `img/A3_con-monto-sin-ref.png` |
| **A4** | **Ambos vacíos** | ❌ **FAIL** al criterio | Misma alerta; no menciona ninguno de los dos. Inline marca banco + referencia + monto |
| **A5** | **Ambos llenos** | ✅ **PASS** | No sale alerta de incompleto; pasa directo a «El Cobro será enviado» |

### Detalle por método de pago

`globalmp` (empresa 00002) ofrece **solo dos**: **Depósito** y **Transferencia** (no hay Efectivo).
Se probaron **los dos**; la referencia **aplica a ambos**, solo cambia la etiqueta:

| Método | Campo de referencia | Otros campos | Alerta al enviar vacío |
|---|---|---|---|
| Depósito | **`Nro. Depósito`** (máx. 50) | Banco Receptor, Monto, Fecha | Idéntica y genérica |
| Transferencia | **`Nro. Referencia`** (máx. 50) | Banco Receptor, Monto, Fecha | Idéntica y genérica |

### Foco
Con la alerta abierta el foco queda en su propio botón (`button.alert-button`). **No se observó que el
foco saltara al campo faltante.** La única señal por campo es el marcado inline en rojo. *(Medido con la
alerta en pantalla; no se instrumentó el foco en el instante posterior al cierre de la alerta.)*

### Observación menor
Pulsar **AGREGAR** en el modal «Seleccione método de cobro…» **sin marcar ningún método** cierra el
modal en silencio, sin alerta y sin agregar nada.

---

## 4. BLOQUE B — casos

| ID | Caso | Resultado | Evidencia |
|---|---|---|---|
| **B1** | Diferencia positiva dispara el mensaje | ✅ **PASS** | Sale al salir del campo Monto (blur), antes de Enviar |
| **B2** | Mensaje **específico** y **nombra el monto** | ✅ **PASS** | «…por el monto excedente de **USD 6,00**…» — es exactamente la forma pedida |
| **B3** | **Moneda del MENSAJE** en USD | ✅ PASS en cobro USD · ❌ **FAIL en cobro BS** | ver tabla §4.1 |
| **B4** | **Moneda del ANTICIPO generado** en USD | ✅ PASS en cobro USD · ❌ **FAIL en cobro BS** | ver tabla §4.1 |
| **B5** | **Cotejo en BD** | ✅ **PASS** (el registro existe y cuadra) | ver tabla §4.1 — la moneda que guarda es la del cobro |
| **B6** | 🔴 Cobro **en BS** con diferencia positiva | ❌ **FAIL** | mensaje y anticipo en **BS**. `img/B6_mensaje-anticipo-BS.png` |

### 4.1 Tabla B3 / B4 / B5 — moneda del mensaje · del anticipo · lo que quedó en BD

| Escenario | Moneda del **cobro** | Moneda del **MENSAJE** (B3) | Moneda del **ANTICIPO** en UI (B4) | **BD nube** (B5) |
|---|---|---|---|---|
| Cobro **11201** (USD) → anticipo **11202** | USD | **USD 6,00** ✅ | USD ✅ | `id 11202` · `co_type=1` · **`co_currency=USD`** · `nu_amount_total=6.0000` · `nu_amount_total_conversion=4710.4200` · `co_original_collection=1787867211722.0` (= cobro 11201) ✅ |
| Cobro **11203** (BS) → anticipo **11204** | BS | **BS 4.945,56** ❌ | BS ❌ | `id 11204` · `co_type=1` · **`co_currency=BS`** · `nu_amount_total=4945.5600` · `nu_amount_total_conversion=6.3000` · `co_original_collection=1787867392992.0` (= cobro 11203) ❌ |

> El monto es **el mismo valor económico** en los dos casos (6,00 USD ≈ 4.945,56 BS a 785,07). Lo que
> cambia es **la moneda en que se expresa y se persiste**, y con `MonedaTolerancia = USD` y
> `prepaidRangeCurrency = USD` lo pedido era que **siempre** saliera en USD.

### 4.2 🔴 B6 — el caso fino, en detalle

**Montaje:** cobro nacido en la moneda por defecto (**BS**), cliente COMERCIAL NEW LIFE, C.A (CL34),
documento **FF084818** (documento en USD, saldo 1,98 USD = 1.554,44 BS). Pago por Depósito de
**6.500,00 BS** ⇒ *Diferencia BS: 4.945,56* (= **6,30 USD**, por encima del umbral de 5 USD).

**Lo que pasó:**
1. Mensaje: *«Se creará un anticipo automático por el monto excedente de **BS 4.945,56**. Se enviará un anticipo junto al cobro.»*
2. Se creó el anticipo **11204** con `co_currency = **BS**` y `nu_amount_total = 4945.5600`.

**Conclusión:** con el cobro en BS, **ni el mensaje ni el anticipo salen en USD**. El fix **no** cumple lo
pedido para este escenario. El anticipo toma la moneda del cobro, no `MonedaTolerancia`.

---

## 5. Evidencia complementaria: el umbral SÍ se evalúa en USD

Esto es lo que separa "la app no sabe convertir" de "la app convierte para el umbral pero no para la
moneda del anticipo". Tres mediciones del mismo build, mismo día:

| Cobro | Moneda | Diferencia | Equivalente USD | ¿Salió el anticipo? | Lectura |
|---|---|---|---|---|---|
| 11200 | USD | 0,79 USD | 0,79 | **NO** | 0,79 < `prepaidRangeAmount=5` ✅ correcto |
| 11201 | USD | 6,00 USD | 6,00 | **SÍ** | 6,00 > 5 ✅ correcto |
| *(descartado)* | BS | 143,12 BS | **0,18** | **NO** | 143,12 **> 5 BS** pero **0,18 < 5 USD** ⇒ el umbral se evaluó en **USD** ✅ |
| 11203 | BS | 4.945,56 BS | **6,30** | **SÍ** | 6,30 > 5 USD ✅ correcto |

⇒ **`prepaidRangeCurrency = USD` funciona.** Lo que no se aplicó es la moneda de salida del anticipo.

*(La 3.ª fila salió de un cobro de prueba que **no se guardó ni se envió** — se descartó con «Salir sin
guardar»; `max(id_collection)` de la nube quedó en 11204, sin filas huérfanas.)*

---

## 6. Cobros creados en el sistema

| id_collection | Tipo (`co_type`) | Moneda | Monto total | Diferencia | Cliente | Estado |
|---|---|---|---|---|---|---|
| **11200** | 0 · Cobro | USD | 2,00 | +0,79 (sin anticipo: bajo umbral) | COMERCIAL MUNDO ECONOMICO 888, C.A. (CM59) | **Enviado** |
| **11201** | 0 · Cobro | USD | 66,55 | +6,00 | COMERCIAL MUNDO ECONOMICO 888, C.A. (CM59) | **Enviado** |
| **11202** | 1 · **Anticipo automático** | **USD** | 6,00 | 0,00 | idem | **Enviado** |
| **11203** | 0 · Cobro | **BS** | 6.500,00 | +4.945,56 | COMERCIAL NEW LIFE, C.A (CL34) | **Enviado** |
| **11204** | 1 · **Anticipo automático** | **BS** | 4.945,56 | 0,00 | idem | **Enviado** |

- **3 cobros** enviados (dentro del máximo de 3) + los **2 anticipos** que el sistema generó solo.
- Todos con `co_enterprise = 00002`, `id_user 300`, tasa `nu_value_local = 785,07`.
- Método de pago en los 5: Depósito · MERCANTIL `01050030351030355770`.
- Un 4.º cobro de prueba (COMERCIAL TOTAL PLUS CT16, doc FF084223) se **descartó sin guardar**.

---

## 7. Observaciones secundarias (fuera del alcance pedido)

1. 🔴 **GUARDAR no valida el método de pago.** Un cobro con método incompleto (banco, referencia y
   monto vacíos) se guarda sin ningún aviso. Queda un Guardado en estado inválido que solo se descubre
   al intentar enviarlo. *(Es el hallazgo colateral más relevante del Bloque A.)*
2. **`Total Depósitos:` sin formato en el Tab Total** — imprime `USD 66.55` (punto decimal, sin
   separadores) mientras la línea BS sí formatea (`BS 52.246,41`). **Reincidencia** del defecto ya
   levantado el 30/07/2026 sobre esta misma pantalla; entonces se vio en BS, hoy en USD.
3. **`prepaidPaymentMethod = ANT` no se refleja en el pago del anticipo.** La VG pide la nomenclatura
   `ANT` para el método de pago del abono automático, pero en la nube los pagos de los anticipos 11202 y
   11204 llegan con `co_payment_method = 'de'` (Depósito, heredado del cobro origen). A verificar con
   desarrollo si es lo esperado.
4. **Permiso de ubicación:** el alert *«Para poder grabar la ubicación, te recomendamos activar el
   servicio de localización…»* → `Aceptar` **saca al usuario de la app** a los Ajustes de Android, y
   después dispara el diálogo nativo de permisos. Con el permiso denegado el formulario de cobro no
   llegaba a abrir. Se resolvió otorgando ACCESS_FINE/COARSE_LOCATION al APK. *(Es setup de dispositivo,
   no defecto de producto; se anota porque bloquea cualquier corrida y no estaba documentado —
   `userMustActivateGPS=false` en el YAML no evita esta guarda.)*

---

## 8. Lo que NO se validó

| Tema | Motivo |
|---|---|
| Métodos de pago **Efectivo / Cheque / Otros / Pago Móvil** | El cliente (empresa 00002) solo ofrece **Depósito** y **Transferencia**. No hay Efectivo en el catálogo |
| Botón **ANTICIPO / PREPAGO manual** | `cobroPrepago = false` — el tile no existe en el menú de Cobros. Solo se ejerció el anticipo **automático** |
| Empresa **`00001` HC TRADING MARKET 2021** | Toda la corrida se hizo en la empresa por defecto `00002`. No se comprobó si el comportamiento del anticipo cambia en la otra empresa |
| Diferencia positiva **por encima de `RangoToleranciaPositiva = 10` USD** | No se probó qué hace la app cuando el excedente supera la tolerancia máxima (¿bloquea? ¿avisa distinto?) |
| **Anticipo con cobro en BS y documento en BS** | El tenant **no tiene documentos en BS**: los 195 documentos con saldo del device son USD. B6 se midió necesariamente con documento USD + cobro BS |
| Round-trip §9 del anticipo (reabrir el anticipo generado desde BUSCAR) | Se cotejó contra BD, no se reabrió la vista de solo lectura del anticipo |
| Retención, IGTF, pago parcial, adjuntos, descuentos | Fuera del alcance de esta validación |
| Foco tras **cerrar** la alerta | Se midió el foco con la alerta abierta (queda en su botón); no se instrumentó el instante posterior al cierre |

---

## 9. Capturas

| Archivo | Qué muestra |
|---|---|
| `img/A1-A4_metodo-incompleto.png` | Alerta genérica + los tres campos marcados `¡Campo Obligatorio!` (banco, Nro. Depósito, Monto) |
| `img/A2_con-ref-sin-monto.png` | A2 — referencia cargada, monto vacío |
| `img/A3_con-monto-sin-ref.png` | A3 — monto 2,00, referencia vacía |
| `img/B1-B3_mensaje-anticipo-USD.png` | 🎯 Mensaje del anticipo **en USD 6,00** + leyenda «Este pago creó el anticipo automático» |
| `img/B6_mensaje-anticipo-BS.png` | 🔴 El mismo mensaje **en BS 4.945,56** con el cobro nacido en BS |
| `img/B_cobro11200_enviado.png` | Acuse del servidor del primer cobro |

---

## 10. Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Alcance | Detalle |
|---|---|---|
| 🔴 **El alert de GPS de COBROS saca a Android** | universal | *«Para poder grabar la ubicación…»* `[Aceptar]` **abre los Ajustes del sistema** y luego el diálogo nativo de permisos, que CDP no alcanza ⇒ el módulo queda muerto sin traza. **Pre-vuelo obligatorio: `adb shell pm grant <pkg> android.permission.ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` antes de abrir Cobros.** Ocurre con `userMustActivateGPS=false` |
| **Selector de Moneda del cobro abre `ion-popover`** (no alert de radios) | globalmp v6.6.21 | 2.º `ion-select` de `app-cobro-general` → click real → `ion-popover ion-item` con textos `BS`/`USD` → 1 click. Con la `collection` vacía **no** dispara el alert de «el cobro será reiniciado» |
| **La moneda por defecto del cobro es BS** aunque los documentos sean USD | globalmp | Importante para cualquier caso de moneda: hay que cambiarla explícitamente para un cobro USD |
| **La alerta del anticipo automático sale en el `blur` del campo Monto**, no al Enviar | universal (`automatedPrepaid=true`) | Barrer alerts antes de leer el estado del Tab Pagos o se pierde el texto |
| **El envío con anticipo produce 3 alertas, no 2** | universal | `El Cobro será enviado` → `Cobro nro. N enviado exitosamente` `[OK]` → **`Anticipo nro. N+1 enviado exitosamente` `[OK]`** |
| **`prepaidRangeAmount` es el umbral que decide si hay anticipo** | universal | Sin él no se puede diseñar el caso: una diferencia positiva por debajo del umbral **no** crea anticipo y se lee como «el fix no funciona». Leer siempre `prepaidRangeAmount` + `prepaidRangeCurrency` antes de montar el escenario |
| **Etiqueta del campo de referencia varía por método** | globalmp | Depósito → `Nro. Depósito` · Transferencia → `Nro. Referencia`. Localizar por posición (1.er `ion-input` visible del acordeón), no por etiqueta |
| **Campo Monto: centavos acumulativo también en USD** | globalmp | `2,00`→`"200"` · `66,55`→`"6655"` · `6.500,00`→`"650000"`. Backspace×N + `keyboard.type` de dígitos, sin coma |
| **`#eventModal` de métodos: AGREGAR sin selección cierra en silencio** | globalmp | No deja el modal abierto ni avisa; hay que reabrirlo |

---

*Corrida ejecutada por CDP sobre `webview_devtools_remote_*` en `:9220`. Sin `#eventModal.present()` en
ningún punto (clicks reales). BD nube `global_mp` operativa durante toda la corrida.*
