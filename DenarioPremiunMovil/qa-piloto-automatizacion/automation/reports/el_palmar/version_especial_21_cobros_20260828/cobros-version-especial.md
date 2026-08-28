# Cobros — Versión especial v21 · CENTRAL EL PALMAR, S.A.

| Parámetro | Valor |
|-----------|-------|
| Cliente QA | `el_palmar` — CENTRAL EL PALMAR, S.A. |
| Fecha | 2026-08-28 |
| App | `com.kiberno.denarioPremiumPro` — **Versión 6.6.21** |
| Dispositivo | Infinix X6728 · `14678405BR003855` · viewport 360×744 |
| Empresa usada | **1002 — CENTRAL EL PALMAR, S.A.** (ver nota abajo) |
| Cliente de prueba | **NESTLE VENEZUELA, S.A. — 1000001897** (tiene documentos en VES y en USD) |
| Vendedor | login 1276 / id_user 266 |
| Tasa vigente | **710,0000 VES/USD** |
| Baseline | `max(id_collection) = 27144` |
| Creados | 27145 · 27146 · 27147 · 27148 · 27149 (5 registros, 3 operaciones de Enviar) |

> **Por qué empresa 1002 y no 1003.** La matriz de monedas del encargo se dio para la empresa 1003, pero
> **`currency_modules` NO es por empresa** (es global, `id_module` 1..9) y `currency_enterprise` da
> **local = VES · fuerte = USD para AMBAS** (1002 y 1003). ⇒ la matriz aplica idéntica en las dos, y se
> eligió 1002 por volumen de cartera. Verificado en UI: el cobro **nace en VES** y el selector de moneda
> ofrece **[USD, VES]**.

---

# 1 · VEREDICTO POR PRIORIDAD

| Prioridad | Veredicto |
|---|---|
| 🔴 **P1 — Anticipo automático (P1–P7)** | ✅ **PASA COMPLETO. 7/7.** El anticipo se genera en **VES** venga el cobro de VES o de USD, y el umbral se evalúa en **USD**. `prepaidCurrency` y `prepaidRangeCurrency` **no se confunden**. |
| 🔴 **P1 — Regresión histórica del Tab Total (H1/H2/H3)** | ⚠️ **H1 PASS · H3 PASS (3/3) · 🔴 H2 FAIL — REPRODUCE.** |
| 🔴 **P2 — Alertas al enviar incompleto** | ✅ 4 de 5. **A2 no bloquea** con método Efectivo (ver matiz). |
| **P3 — Riesgos de la versión** | R1 ✅ · R2 ⛔ no validado · R3 ✅ · R4 ✅ (con el matiz de H2) · R5 ✅ |

## 🔴 EL TITULAR: H2 sigue roto

**Con `retención` + `pago parcial` sobre el mismo documento, `Monto Saldo` NO descuenta lo retenido:
queda inflado exactamente en el monto de la retención — en pantalla y en la nube.**

El caso de control del mismo cobro (documento sin retención) cierra correctamente en 0,0000, así que
**la causa queda aislada en la retención**, y un segundo escenario prueba que **el disparador es el
pago parcial**: con retención y pago completo el saldo sí cierra en 0.

> El titular del anticipo (P4) **también es una buena noticia y va abajo**, pero H2 manda:
> es una regresión sobre un defecto ya corregido dos veces en este mismo cliente.

---

# 2 · REGRESIÓN: HISTORIA DE ESTE CLIENTE (H1 · H2 · H3)

## 2.1 · Los tres escenarios medidos

Todos sobre el cliente NESTLE (1000001897), empresa 1002, cobro en VES, tasa 710,0000.

| # | Escenario | Documento | Monto Doc. | Ret. IVA | Ret. ISLR | Monto Pago | **Monto Saldo** (pantalla) | **Deuda real** | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| **A** | retención + **pago parcial** | `0013000340` | 1.963,1100 | 100,0000 | 50,0000 | 800,0000 | **1.163,1100** | **1.013,1100** | 🔴 **FAIL** — inflado en 150,00 |
| **B** | 🔑 **CONTROL**: sin retención, pago completo | `0013000339` | 4.450,9300 | — | — | 4.450,9300 | **0,0000** | 0,0000 | ✅ PASS |
| **C** | retención + **pago completo** | `0013000338` | 5.027,3800 | 200,0000 | 100,0000 | 4.727,3800 | **0,0000** | 0,0000 | ✅ PASS |

A y B viven en el **mismo cobro (Ref 27149)** ⇒ el control es válido: mismo build, misma sesión, mismo
formulario, misma tasa. C es un formulario aparte, descartado sin enviar.

### La aritmética que NO cierra (escenario A)

```
saldo bruto del documento ............ 1.963,1100 VES
− pago aplicado ......................    800,0000 VES
− retención IVA ......................    100,0000 VES
− retención ISLR .....................     50,0000 VES
─────────────────────────────────────────────────────
  DEUDA REAL REMANENTE ...............  1.013,1100 VES   ← lo que el cliente sigue debiendo
  La app muestra .....................  1.163,1100 VES   ← DIFERENCIA: +150,00 = exactamente lo retenido
```

⚠️ **Nota de método (la que dejó pasar el defecto la primera vez):** `Monto Doc. − Monto Pago = Monto Saldo`
**sí cierra** (1.963,11 − 800,00 = 1.163,11). Ésa es literalmente la fórmula del código, así que **comprobarla
no prueba nada**. El contraste válido es contra la deuda real del documento, que es la que aquí no cuadra.

### H1 — «Monto Doc.» muestra el saldo bruto ✅ PASS

En el escenario A (pago parcial) `Monto Doc.` muestra **1.963,1100** = el saldo **bruto**, no el restante.
El defecto original del 24/08 (mostrar `saldo − pago`, duplicando `Monto Saldo`) **no reproduce**.

### H3 — Los tres casos de retención ✅ 3/3

| Caso | Resultado |
|---|---|
| retención + **pago completo** ⇒ `Monto Saldo` = 0 | ✅ PASS (escenario C: 0,0000) |
| **pago parcial + retención** (el que dio PASS incorrecto la 1.ª vez) | 🔴 el flujo funciona pero **destapa H2** (escenario A) |
| **cobro tipo Retención** (`co_type=2`) | ✅ PASS — ver §2.3 |

## 2.2 · 🔴 H2 en las CUATRO capas — documento `0013000340`, cobro Ref **27149**

| Capa | Campo | Valor medido | Qué debería ser | Veredicto |
|---|---|---|---|---|
| **Pantalla** | `Monto Saldo` (Tab Total) | **1.163,1100** | 1.013,1100 (bruto − pago − retención) | 🔴 **FAIL** — no resta la retención |
| **Modelo** | `collectionDetails[].nuBalanceDoc` | **1.963,1100** | 1.963,11 si el criterio es "foto del saldo" | ✅ es la **foto del saldo bruto** — coherente con la decisión de producto |
| **Nube** | `collection_detail.nu_balance_doc` | **1.163,1100** | 1.963,11 (foto) **o** 1.013,11 (neto) | 🔴 **FAIL** — no es ninguna de las dos |
| **Web** | columna `Saldo doc.` | ⛔ **NO VALIDADO** | — | ⛔ BLOCKED (fuera del alcance de esta corrida móvil) |

### 🔴 Hallazgo adicional: la nube usa DOS criterios distintos en la misma columna

En el **mismo cobro 27149**, `collection_detail.nu_balance_doc` guarda:

| Documento | `in_payment_partial` | `nu_amount_doc` | `nu_balance_doc` | Criterio efectivo |
|---|---|---|---|---|
| `0013000339` (control) | `false` | 4.450,9300 | **4.450,9300** | saldo **BRUTO** (foto) |
| `0013000340` (retención + parcial) | `true` | 1.963,1100 | **1.163,1100** | **BRUTO − PAGO** |

El **modelo del móvil manda 1.963,11 en los dos casos**; la transformación a `bruto − pago` ocurre
**en el envío**, y **sólo cuando `in_payment_partial = true`**.

⇒ **Consecuencia para la decisión de producto** («el campo vuelve a ser una foto del saldo y la web calcula
el remanente»): **esa decisión NO está implementada de forma consistente.** Un consumidor que calcule el
remanente a partir de `nu_balance_doc` acertará en la fila sin parcial y se equivocará en la del parcial —
y en ningún caso podrá restar la retención, porque el dato que le llega ya está mezclado.

**Evidencia:** `img/H2-tabtotal-scroll600-MontoSaldo.png` (columna `Monto Saldo` visible junto a
`Retención ISLR`), `img/H2-tabtotal-scroll0-izq.png`, `img/H2-tabtotal-scroll300-medio.png`,
`img/H2-detalle-doc-retencion-parcial.png`.

## 2.3 · Cobro tipo RETENCIÓN (`co_type=2`) — H3c / R3 ✅ PASS

Formulario abierto, configurado y **descartado sin enviar** (documento `0013000337`, saldo 5.551,8400 VES).

- **4 tabs**: General / Documentos / Total / Adjuntos — **sin tab Pagos** ✓
- Tab Total = **un acordeón por documento, SIN columna `Monto Saldo`** ✓ (flujo distinto, como se esperaba)
- `Monto IVA 300,0000 + Monto ISLR 150,0000` → **`Monto total retenido 450,0000`** ✓
- **`Monto total a Pagar VES = 450,0000` = IVA + ISLR** ✓ — el saldo del documento **no participa**,
  que es el oráculo correcto para `co_type=2`
- `Monto total a Pagar USD = 0,6338` = 450,0000 ÷ 710,0000 ✓
- **No genera anticipo** (sin tab Pagos no hay excedente posible)
- ⚠️ **Cosmético:** el acordeón rotula **«Fecha del documento: 2026-08-28»**, que es la *Fecha Comp Ret*
  que se cargó, **no** la fecha de emisión de la factura (2025-05-12). Rótulo engañoso, no afecta montos.

---

# 3 · 🔴 PRIORIDAD 1 — EL ANTICIPO AUTOMÁTICO · 7/7 PASS

## Config leída **del propio dispositivo** (`collectService`), no del YAML

```
prepaidCurrency ........ "VES"    ← moneda en que se GENERA el anticipo
prepaidRangeCurrency ... "USD"    ← moneda en que se EVALÚA el umbral
prepaidRangeAmount ..... 10
automatedPrepaid ....... true
```

**Relación con la tolerancia** (apuntada por la QA, confirmada en el device):

```
tolerancia0 ................. true
TipoTolerancia .............. 0
RangoToleranciaNegativa ..... 10        ← mismo número que prepaidRangeAmount
RangoToleranciaPositiva ..... 100000
MonedaTolerancia ............ "USD"     ← misma moneda que prepaidRangeCurrency
```

El par (10 · USD) del anticipo coincide con el par (RangoToleranciaNegativa · MonedaTolerancia). Todo lo
medido abajo es consistente con **un único umbral de 10 USD**; esta corrida **no pudo separar** cuál de las
dos VG lo gobierna (habría que moverlas de forma independiente en la web). Se anota como pendiente.

## Resultados

| ID | Caso | Medido | Resultado |
|----|------|--------|-----------|
| **P1** | Cobro **VES**, diferencia > 10 USD equivalentes | dif. **11.693,0000 VES = 16,4690 USD** → genera anticipo | ✅ PASS |
| **P2** | Moneda del **MENSAJE** | texto literal abajo — **VES** | ✅ PASS |
| **P3** | Moneda del **ANTICIPO** (app + BD) | app: `Moneda: VES` · BD: `co_currency='VES'` | ✅ PASS |
| **P4** 🔑 | **Cobro en USD**, diferencia 18,4500 USD | **anticipo generado en VES** (13.099,5000) | ✅ **PASS — el caso clave** |
| **P5** | Cotejo BD de P4 | `co_type=1` · `co_currency='VES'` · total 13.099,5000 | ✅ PASS |
| **P6** | Diferencia **< 10 USD** | dif. 5.000,0000 VES = **7,0423 USD** → **NO** genera anticipo | ✅ PASS |
| **P7** | Aritmética con la tasa | exacta en los 4 escenarios | ✅ PASS |

## 🔑 P4 — EL TITULAR DEL ANTICIPO

> **Cobro Ref 27147 · moneda del cobro = USD · pago 40,00 USD · documento `0091020007` (saldo 21,55 USD)**
> **Diferencia = 18,4500 USD**
>
> **El anticipo salió en VES.**

**Alerta literal que muestra la app** (`.alert-title` + `.alert-message`):

```
Título:  Denario Cobros
Mensaje: Se creará un anticipo automático por el monto excedente de VES 13.099,5000.
         Se enviará un anticipo junto al cobro.
Botones: [Aceptar]
```

**Moneda del mensaje: VES** — aunque el cobro es en USD y aunque el umbral se evaluó en USD.
Evidencia: `img/P4-alerta-anticipo-VES-13099-desde-cobro-USD.png`.

### P5 — Cotejo en la nube

```sql
id_collection | co_type | co_currency | total       | co_original_collection
27147         |    0    |    USD      |    40.0000  | NULL                  ← el cobro
27148         |    1    |    VES      | 13099.5000  | 1787939499797.0       ← el anticipo
```

`27148.co_original_collection` = `27147.co_collection` ⇒ el vínculo cobro↔anticipo está bien grabado.

⇒ **`prepaidCurrency` NO se confunde con la moneda del cobro.** Éste era el escenario que en los clientes
anteriores (con ambas variables en USD) habría pasado desapercibido.

## P2 — El mensaje, en sus dos apariciones

| Dónde | Texto literal | Moneda |
|---|---|---|
| **Tab Pagos**, al perder el foco del monto | «**Este pago creó el anticipo automático**» (`ion-label` azul `rgb(0,84,233)`) | *sin monto ni moneda* |
| **Alerta al pulsar Enviar** | «**Se creará un anticipo automático por el monto excedente de VES 11.693,0000. Se enviará un anticipo junto al cobro.**» | **VES** ✓ |

Idéntico patrón desde un cobro en VES (P1) y desde uno en USD (P4): sólo cambia el importe, la moneda es
**siempre VES**. Evidencia: `img/P2-mensaje-anticipo-tab-pagos.png`, `img/P2-alerta-anticipo-VES-11693.png`.

## P7 — La aritmética, explícita · tasa 710,0000 VES/USD

| Caso | Diferencia mostrada | Conversión | ¿Supera 10 USD? | Anticipo |
|---|---|---|---|---|
| **P1** cobro VES | `11.693,0000 VES` / `16,4690 USD` | 11.693,0000 ÷ 710,0000 = **16,4690** ✓ | Sí | **VES 11.693,0000** (Ref 27146) |
| **P4** cobro USD | `18,4500 USD` / `13.099,5000 VES` | 18,4500 × 710,0000 = **13.099,50** ✓ | Sí | **VES 13.099,5000** (Ref 27148) |
| **P6** cobro VES | `5.000,0000 VES` / `7,0423 USD` | 5.000,0000 ÷ 710,0000 = **7,0423** ✓ | **No** | **ninguno** ✓ |
| **R1** cobro VES + retención | `10.000,0000 VES` / `14,0845 USD` | 10.000,0000 ÷ 710,0000 = **14,0845** ✓ | Sí | se dispara ✓ |

Los cuatro cálculos que muestra la app coinciden al cuarto decimal con la conversión manual.
**El umbral queda acotado entre 7,0423 USD (no dispara) y 14,0845 USD (dispara)**, consistente con 10 USD.

---

# 4 · 🔴 PRIORIDAD 2 — ALERTAS AL ENVIAR COBRO INCOMPLETO

| ID | Caso | ¿Bloquea? | Texto literal | ¿Nombra el campo? |
|----|------|-----------|---------------|-------------------|
| **A1** | Sin monto (`0,0000`), con Nro. Recibo | ✅ **SÍ** | **Título:** `Denario Cobros`<br>**Mensaje:** `Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.` · `[Aceptar]` | ❌ **No.** Dice «método de pago incompleto», no dice *qué* falta |
| **A2** | Sin referencia (Nro. Recibo vacío), con monto | ❌ **NO** | *(sin alerta de validación: pasó directo al flujo de envío)* | — |
| **A3** | Ambos vacíos | ✅ **SÍ** | idéntico a A1 | ❌ No |
| **A4** | **Guardado y reabierto**, incompleto | ✅ **SÍ — bloquea igual** | idéntico a A1 | ❌ No |
| **A5** | Todo lleno | ✅ no bloquea, envía | `El Cobro será enviado` `[Cancelar·Aceptar]` → `Cobro nro. 27147 enviado exitosamente` `[OK]` | — |

**Detalle de A2 — leerlo con cuidado antes de tratarlo como defecto.** El campo de referencia del método
**Efectivo** se rotula **«Nro. Recibo:»** y admite `0/50` caracteres (mínimo 0). Con el monto cargado y el
Nro. Recibo vacío, el Enviar **procedió sin ninguna validación**. Puede ser diseño (un cobro en efectivo no
siempre tiene recibo). **No se midió con Transferencia ni con Depósito**, que es donde la referencia sí es
semánticamente obligatoria. ⇒ se reporta como **observación a confirmar con producto**, no como FAIL cerrado.

⚠ A1–A4 **nunca llegaron a enviarse**: no ensuciaron el sistema.

### Alerta adicional detectada — cobro con retención

Al enviar un cobro que lleva retención por documento, aparece antes de todo:

```
Título:  Denario Cobros
Mensaje: Al menos a un documento se le agregaron retenciones, debe agregar al menos un
         adjunto para poder enviar el Cobro.
Botones: [Aceptar]
```

Aparece **aunque `requiredCollectionAttachments = false` y `requiredRetentionAttachments = false`**.
Es **comportamiento conocido y ya documentado** en insumar/romher/globalmp (el adjunto en retención es
obligatorio con independencia de esas VG) ⇒ **no se levanta como hallazgo nuevo**.

---

# 5 · PRIORIDAD 3 — LOS RIESGOS DE ESTA VERSIÓN

| ID | Caso | Observado | Resultado |
|----|------|-----------|-----------|
| **R1** | **Retención + diferencia positiva** — ¿el anticipo se calcula sobre el neto tras retención, o antes? | Documento `0013000338`: saldo bruto **5.027,3800**, retención IVA 200 + ISLR 100 = **300,0000**. La app fija **`Monto total a pagar = 4.727,3800`**, es decir **NETO tras retención**. Con un pago de 14.727,3800 la **Diferencia = 10.000,0000 VES** (= pago − neto). Si se calculara sobre el bruto sería 9.700,00. | ✅ **PASS — sobre el NETO** |
| **R2** | **IGTF + diferencia positiva** | El selector IGTF existe en el Tab Documentos (`IGTF 0% - 0%`, 2 opciones), pero **no se ejecutó el caso**: se agotó el presupuesto de escritura y el tiempo. | ⛔ **NO VALIDADO** |
| **R3** | **Cobro tipo RETENCIÓN** (`co_type=2`) | 4 tabs sin Pagos · Tab Total en acordeones sin columna de saldo · `Total a pagar = IVA + ISLR = 450,0000` · conversión 450 ÷ 710 = 0,6338 ✓ · no genera anticipo. Detalle en §2.3 | ✅ **PASS** |
| **R4** | **Pago parcial + retención** — ¿`Monto Doc. − Monto Pago = Monto Saldo` cierra? | **La igualdad SÍ cierra** (1.963,11 − 800,00 = 1.163,11) — **pero eso no es el oráculo válido**: es la fórmula del propio código. Contra la deuda real (1.013,11) **no cierra**. Ver H2. | ⚠️ **cierra la fórmula, falla el negocio** → remite a 🔴 H2 |
| **R5** | **Los dos importes en VES de la pantalla del anticipo** | Anticipo **Ref 27146** abierto desde BUSCAR:<br>`Total Efectivo: **VES 11.693,0000**` / `USD 16,4690`<br>`**Monto VES: 11.693,0000**` / `Monto USD: 16,4690`<br>`Total General VES: 11.693,0000` | ✅ **PASS — los tres coinciden.** El desfase de 1,66 **no reproduce** |

**Configuración confirmada en el device:** `retencion=true` · `cobroRetencion=true` · **`sizeRetention=5`** ·
`formatRetention="number"` · `userCanSelectIGTF=true` · `userCanCollectIva=true` · `cobroPrepago=true` ·
`dynamicRetentions=false` (⇒ variante FIJA del modal de retención) · `userCanSelectCollectDiscount` no
expuesto en el form ⇒ descuento **N/A**.

**`sizeRetention = 5` validado por comportamiento, no sólo por rótulo:** el campo rotula
*«Debe tener 5 caracteres.»*, y con un comprobante de **7** dígitos los campos *Monto retenido IVA/ISLR*
permanecieron **`disabled`**; al dejarlo en **5** (`99999`) se habilitaron en el mismo tick. ✅

---

# 6 · REGISTROS CREADOS Y DESCARTADOS

## Enviados a la nube (5 registros · 3 operaciones de Enviar · tope 6 respetado)

| Ref (`id_collection`) | Tipo | `co_type` | Moneda | Monto | Empresa | Detalle |
|---|---|---|---|---|---|---|
| **27145** | Cobro | 0 | **VES** | 20.000,0000 | 1002 | doc `0091013639` (USD 11,70 = VES 8.307,00), efectivo · **P1** |
| **27146** | **Anticipo automático** | 1 | **VES** | **11.693,0000** | 1002 | generado desde 27145 · `co_original_collection=1787938943829.0` |
| **27147** | Cobro | 0 | **USD** | 40,0000 | 1002 | doc `0091020007` (USD 21,55), efectivo · **P4** |
| **27148** | **Anticipo automático** | 1 | **VES** | **13.099,5000** | 1002 | 🔑 generado desde un cobro **en USD** · `co_original_collection=1787939499797.0` |
| **27149** | Cobro | 0 | **VES** | 5.250,9300 | 1002 | 2 docs: `0013000340` (retención + parcial) y `0013000339` (control) · **H1/H2/H3** |

Los 5 con `st_collection = 1` y presentes en `collection` + `collection_detail` + `collection_payment`
de la nube ⇒ **BD-OK**.

## Descartados / eliminados (no quedaron en el sistema)

| Qué | Cómo se cerró |
|---|---|
| Cobro **Guardado** de apoyo (cliente NESTLE, doc `0013000338`, retención 300,00, monto 0,0000, ref `REF-P6-001`) — usado para **P6 · R1 · A4** | **ELIMINADO** desde la lista BUSCAR: alerta `¿Desea eliminar el Cobro?` `[Cancelar·Eliminar]` → Eliminar. Verificado: la lista vuelve a arrancar en Ref 27149 |
| Formulario de **cobro tipo RETENCIÓN** (doc `0013000337`, IVA 300 + ISLR 150) — usado para **R3 / H3c** | **DESCARTADO** con el dirty-guard → `Salir sin guardar`. Nunca se guardó ni se envió |

**Documentos consumidos de la cartera de NESTLE:** `0091013639` y `0091020007` quedaron saldados;
`0013000339` saldado; `0013000340` con pago parcial de 800,00 + retención 150,00.

---

# 7 · LO QUE NO SE VALIDÓ

| Tema | Motivo |
|---|---|
| **H2 · capa WEB** (columna `Saldo doc.` del detalle del cobro en la web) | ⛔ **BLOCKED** — fuera del alcance de esta corrida, que fue íntegramente sobre el móvil + BD. **Es la única capa de H2 sin medir y hay que cerrarla**: la nube ya entrega `1.163,1100`, así que lo que quede en la web depende de si calcula o transcribe |
| **R2 — IGTF + diferencia positiva** | ⛔ No ejecutado. Se agotó el presupuesto de escritura (6 cobros) y el tiempo. El selector IGTF **existe** en el Tab Documentos (`IGTF 0% - 0%`, 2 opciones) ⇒ el caso es ejecutable, sólo faltó correrlo |
| **Cuál VG gobierna el umbral: `prepaidRangeAmount` o `RangoToleranciaNegativa`** | Ambas valen **10** y ambas en **USD**. Todo lo medido es consistente con las dos. Separarlas exige cambiar una en la web y re-medir |
| **A2 con Transferencia / Depósito** | Sólo se midió con **Efectivo**, cuyo campo de referencia es «Nro. Recibo» y admite mínimo 0 caracteres. Falta comprobar si con Transferencia/Depósito la referencia sí es obligatoria |
| **Empresa 1003** | Se corrió todo en **1002**. Justificado: `currency_modules` es global y `currency_enterprise` da local=VES/fuerte=USD en las dos ⇒ la matriz de monedas es idéntica. No se ejercitó el **cambio** de empresa dentro del cobro |
| **Método de pago del anticipo** | El anticipo hereda el método del cobro padre (`ef`), **no** el `prepaidPaymentMethod="pa"` de la VG. Se contrastó contra el histórico: los 9.121 anticipos automáticos previos usan `tr`/`de`/`ef`, nunca `pa` ⇒ **comportamiento preexistente, no una regresión de esta versión**. No se investigó más |
| **Round-trip §9 completo** | Sólo se verificó sobre el Guardado de apoyo (conservó retención, referencia y monto al reabrir ✓). No se hizo el ciclo Guardar→reabrir sobre cada campo de cada cobro |
| **Oclusión de la paginación por el botón de calculadora** (defecto conocido de run_vzla) | No se ejercitó: la cartera de NESTLE cabía en la primera página de 30 documentos |

---

# 8 · OBSERVACIONES MENORES

1. **Alerta de anticipo con importe obsoleto — 1 sola ocurrencia, no reproducida.** Tras bajar el monto del
   pago de 14.727,3800 a 0,0000, el primer Enviar disparó la alerta del anticipo **con el importe anterior**
   (`VES 10.000,0000`) pese a que la Diferencia ya mostraba −4.727,3800. **Al reintentar, la alerta correcta
   («método de pago incompleto») sí apareció**, y el modelo ya tenía `createAutomatedPrepaid=false`.
   ⇒ Se reporta como **observación**, no como defecto: no reprodujo al segundo intento y pudo ser un overlay
   residual de la automatización. Si a alguien le aparece en uso real, ya está anotado.
2. **`Fecha del documento` en el acordeón del cobro tipo Retención** muestra la *Fecha Comp Ret* cargada
   (2026-08-28), no la fecha de emisión de la factura (2025-05-12). Cosmético.
3. **Métodos de pago ofrecidos por la UI: Efectivo · Depósito · Transferencia · Otros · Pago Móvil (5).**
   La VG `colletionPayment` del perfil dice `true-false-true-true-false-false`, es decir sólo
   Efectivo/Transferencia/Depósito. **La UI ofrece 3 más de los que la VG habilita.** No se profundizó
   (no era el objeto de la corrida) pero conviene revisarlo.
4. **El comentario del cobro** rotula «Mín. 0 - Máx. **255** caracteres», confirmando que el tope lo fija la
   constante de producto y no `longitudComentario=185`.

---

# 9 · PATRONES / SELECTORES NUEVOS (insumo de consolidación)

| Patrón / selector | Alcance | Detalle |
|---|---|---|
| **Selección de cliente = click en `#clienteSelect` → Enter en el buscador → click en el `ion-icon[name="chevron-forward-outline"]` de la fila** | universal (v6.6.21) | 4/4 sin un solo reintento. El click en el `<p>` del nombre **no** hizo falta |
| **`ion-select` de Moneda del cobro: la vía programática SÍ funciona si se asigna el `value` del `ion-select-option` (objeto), no un string** | universal | `s.value = opt.value` + `ionChange`. El click real **no abre el popover** en este build |
| **Modal «Detalle Del Documento»: los índices de `ion-input` SE DESPLAZAN al llenar `Nro. Comp Ret`** | universal | Aparecen *Fecha Comp Ret* + *IVA* + *ISLR* y todo lo posterior corre. **Localizar por la etiqueta del `ion-col`, nunca por índice fijo** — un índice cacheado escribe en el campo equivocado |
| **`sizeRetention` se valida por LONGITUD y bloquea con `disabled`, no con alerta** | universal | Con 7 dígitos IVA/ISLR siguen `disabled`; con 5 se habilitan. Discriminador barato de la VG sin provocar rechazo |
| **En el cobro tipo RETENCIÓN, `Fecha Comp Ret` SÍ bloquea el GUARDAR del detalle** | acota `[run_vzla-20260818]` | En el cobro **normal** no bloquea (con IVA+ISLR el botón ya habilita); en `co_type=2` sí. El `ion-datetime` se revela clickeando `ion-input#inputCalendar` y se fija con `d.value=ISO` + `ionChange` + `d.confirm()` |
| 🔴 **NO apilar `PointerEvent` + `shadowRoot.click()` + `mouse.click` sobre `imagenEnviar`** | universal | Dispara el handler **dos veces** y encola dos alertas idénticas, dejando el flujo de envío a medias. **Un solo `pg.mouse.click`** completó el envío a la 1.ª en 3/3 |
| **Tabla del Tab Total: `ion-grid.tablaInfo` con `scrollWidth 909 / clientWidth 360`** | universal | Sólo el `ion-grid` scrollea (las `ion-row` no responden a `scrollLeft`). Para capturar `Monto Saldo`: `scrollLeft = 600` |
| **`collectService` expone toda la config de anticipo/retención/tolerancia en una línea** | universal | `ng.getComponent(<cualquier componente del form>).collectService` → `prepaidCurrency`, `prepaidRangeCurrency`, `prepaidRangeAmount`, `sizeRetention`, `dynamicRetentions`, `MonedaTolerancia`, `RangoTolerancia*`. **Más barato y más fiable que los dumps de VG** |
| **`currency_modules` es GLOBAL, no por empresa** | universal (esquema) | `currency_modules` (9 filas, `id_module` 1..9) + `currency_enterprise` (local/hard por empresa). Permite resolver la matriz de monedas **sin abrir la app** |

---

*Corrida ejecutada por CDP sobre `:9220` (socket `webview_devtools_remote_31101`). Sin cuelgues de CDP,
sin crashes de la app, sin `#eventModal.present()`.*
