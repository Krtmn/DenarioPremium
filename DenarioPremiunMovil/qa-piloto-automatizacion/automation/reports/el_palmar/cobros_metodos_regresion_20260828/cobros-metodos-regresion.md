# Cobros — Métodos de pago y regresión de totales · v21 · CENTRAL EL PALMAR, S.A.

| Parámetro | Valor |
|-----------|-------|
| Cliente QA | `el_palmar` — CENTRAL EL PALMAR, S.A. |
| Fecha | **2026-08-28** (corrida de tarde, sobre el APK instalado 15:07) |
| App | `com.kiberno.denarioPremiumPro` · **v6.6.21** (build con el fix de Pago Móvil) |
| Dispositivo | Infinix X6728 · `14678405BR003855` · viewport 360×744 |
| Empresa | **1002 — CENTRAL EL PALMAR, S.A.** |
| Cliente de prueba | **NESTLE VENEZUELA, S.A. — 1000001897** |
| Tasa vigente | **710,0000 VES/USD** |
| Playa (runtime) | `denariocaribe.ddns.net:8080` — descubierta en ejecución, no se guarda en el YAML |
| CDP | `:9220` · socket `webview_devtools_remote_7952` · sin cuelgues, sin crashes |
| Baseline | `max(id_collection) = 27150` |
| Creados | **27151 · 27152 · 27153 · 27154 · 27155 · 27156** (6 registros, 4 operaciones de Enviar) |

---

# 1 · VEREDICTO POR PRIORIDAD

| Prioridad | Veredicto |
|---|---|
| 🔴 **P1 — Validación de campos al Enviar, los seis métodos** | ⚠️ **4 de 5 bien · 1 HUECO CONFIRMADO.** ✅ **El fix de Pago Móvil FUNCIONA**: sin teléfono ya NO deja enviar. 🔴 **Efectivo sigue dejando enviar con «Nro. Recibo» vacío** — reproducido y cotejado en la nube (`27151`, `nu_payment_doc = ''`). **Cheque no lo ofrece la UI** ⇒ N/A. |
| 🔴 **P2 — Regresión de la tabla de totales** | **H1 ✅ PASS · H3 ✅ (2 de 3 medidos) · 🔴 H2 REPRODUCE.** 🔑 **El dato que zanja la discusión está medido: aplicar la retención BAJA el «Monto total a Pagar» exactamente en el monto retenido.** |
| **P3 — Resto de Cobros** | **G1 ✅ PASS** (con la config corregida `prepaidCurrency=USD`) · **G2 ✅ PASS** (era el que quedó sin validar) · **G3 ✅ PASS — los dos importes coinciden, no hay descuadre** · **G4 ⛔ no validado.** |

## 🔴 Los dos titulares

1. **Pago Móvil está arreglado.** Con el monto cargado y el teléfono vacío, Enviar **bloquea**
   (`Hay un método de pago incompleto…`). Confirmado por prueba de *dejar-uno-fuera*: se llenaron los
   6 campos, se comprobó que el envío procedía, y luego se **vació sólo el teléfono** → **vuelve a bloquear**.
2. **Efectivo es el hueco que queda.** Es el único de los 5 métodos que **no exige su campo de referencia**
   («Nro. Recibo:»). El cobro **27151** viajó a la nube con `collection_payment.nu_payment_doc = ''`.

---

# 2 · 🔴 PRIORIDAD 1 — LA TABLA DE LOS MÉTODOS

## 2.0 · Qué ofrece la UI de verdad (comprobado, no asumido)

`colletionPayment = true-false-true-true-true-true` (leído en `global_configuration`, BD nube).
Catálogo `ch` Cheque · `de` Depósito · `ef` Efectivo · `ot` Otros · `pm` Pago Móvil · `tr` Transferencia.

**La UI ofrece CINCO métodos, en este orden:**

```
Efectivo · Depósito · Transferencia · Otros · Pago Móvil
```

⇒ **El que falta es CHEQUE (`ch`), no Depósito.** Si se lee la VG como el catálogo alfabético
(`ch·de·ef·ot·pm·tr`), la posición en `false` sería `de` = Depósito — y **Depósito sí se ofrece**.
El comportamiento observado sólo cuadra si el `false` corresponde a **Cheque**. ⇒ **no interpretar el orden
de `colletionPayment` por el orden alfabético del catálogo**; lo que manda es la UI.

⚠️ **El modal de métodos es de selección ÚNICA** aunque los controles sean `ion-checkbox`: al marcar uno se
desmarca el anterior. Se agrega **un método por vez**.

## 2.1 · 🔑 LA TABLA — entrega principal

| Método | Campos que presenta (etiqueta exacta) | ¿Cuáles exige? | ¿Cuáles deja vacíos? | ¿Envía con sólo el monto? |
|---|---|---|---|---|
| **Efectivo** (`ef`) | `Nro. Recibo:` · `Monto` · `Fecha` | **Monto** (rotula *¡Campo Obligatorio!*) | 🔴 **`Nro. Recibo:`** — sin marca de obligatorio, `Mín. 0 - Máx. 50` | 🔴 **SÍ — pasa directo a `El Cobro será enviado`** |
| **Depósito** (`de`) | `Banco Receptor` · `Nro. Depósito` · `Monto` · `Fecha` | **Banco Receptor + Nro. Depósito + Monto** (los 3) | ninguno | ❌ NO — bloquea |
| **Transferencia** (`tr`) | `Banco Receptor` · `Nro. Referencia` · `Monto` · `Fecha` | **Banco Receptor + Nro. Referencia + Monto** (los 3) | ninguno | ❌ NO — bloquea |
| **Otros** (`ot`) | `Especifique:` · `Monto` · `Fecha` | **Especifique: + Monto** (los 2) | ninguno | ❌ NO — bloquea |
| **Pago Móvil** (`pm`) | `Nº de Teléfono` (selector de código + número, *Mín. 7 - Máx. 7*) · `Tipo de documento` (selector V/E/J + número) · `Banco Emisor` · `Banco Receptor` · `Número de referencia` · `Monto` · `Fecha` | ✅ **LOS SEIS**: Nº de Teléfono · Tipo de documento · Banco Emisor · Banco Receptor · Número de referencia · Monto | ninguno | ❌ NO — bloquea |
| **Cheque** (`ch`) | — | — | — | 🚫 **N/A — la UI no lo ofrece** |

**Texto literal del bloqueo** (idéntico en los 4 métodos que bloquean):

```
.alert-title   : Denario Cobros
.alert-message : Hay un método de pago incompleto. Complételo o elimínelo antes de enviar.
Botones        : [Aceptar]
```

⚠️ **La alerta no nombra el campo que falta** ni el método. Con varios métodos cargados, el vendedor tiene
que adivinar cuál de todos está incompleto. (Ya reportado como observación en la corrida de la mañana;
**se mantiene igual**.)

**Texto de paso** (cuando la validación aprueba): `El Cobro será enviado` `[Cancelar · Aceptar]`.

## 2.2 · Cómo se midió cada exigencia (método, no impresión)

Para los métodos que bloquean, **no basta con ir llenando campos hasta que pase**: eso sólo prueba que el
último llenado hacía falta. Se usó **dejar-uno-fuera**:

| Método | Secuencia medida | Resultado |
|---|---|---|
| **`pm`** | (1) sólo monto → **bloquea** · (2) + teléfono → **bloquea** · (3) + documento → **bloquea** · (4) + referencia → **bloquea** · (5) + Banco Emisor → **bloquea** · (6) + Banco Receptor → **PASA** · luego, **vaciando de a uno**: sin teléfono → **bloquea** · sin documento → **bloquea** · sin referencia → **bloquea** | los **6** son obligatorios |
| **`de`** | sólo monto → bloquea · + Nro. Depósito (banco vacío) → **bloquea** · + Banco Receptor → **pasa** | los **3** obligatorios |
| **`tr`** | sólo monto → bloquea · + Nro. Referencia (banco vacío) → **bloquea** · + Banco Receptor → **pasa** | los **3** obligatorios |
| **`ot`** | sólo monto → bloquea · + `Especifique:` → **pasa** | los **2** obligatorios |
| **`ef`** | sólo monto → **PASA sin más** | sólo el **Monto** |

**Pista visual coherente con lo medido:** Depósito, Transferencia y Otros rotulan **«¡Campo Obligatorio!»**
bajo su campo de referencia; **Efectivo NO lo rotula bajo «Nro. Recibo:»**. La marca de la UI y la
validación del Enviar coinciden — el hueco es **de diseño de la validación**, no un desajuste de rótulos.

Evidencia: `img/M-pm-campos-vacios.png` · `img/M-pm-alerta-bloquea.png` · `img/M-ef-nro-recibo-vacio.png`.

## 2.3 · 🔴 COTEJO EN LA NUBE del hueco — cobro **27151**

Cobro enviado a propósito con **Efectivo sin Nro. Recibo** y los otros tres métodos completos, para que la
comparación sea inmediata dentro de la misma fila de datos:

```sql
SELECT id_collection, co_payment_method, nu_amount_partial, nu_payment_doc, nu_phone_number,
       id_code_phone_number, nu_collection_payment, na_bank, nu_bank_account, nu_document
FROM collection_payment WHERE id_collection = 27151;
```

| `co_payment_method` | `nu_amount_partial` | **`nu_payment_doc`** | `na_bank` | `nu_bank_account` / `nu_collection_payment` |
|---|---|---|---|---|
| `ef` | 5307.0000 | 🔴 **`''` (VACÍO)** | `''` | `''` |
| `de` | 1000.0000 | `998877` | `Venezuela Cepsa BV454` | `01020010500000300454` |
| `tr` | 1000.0000 | `778899` | `Venezuela Cepsa BV454` | `01020010500000300454` |
| `ot` | 1000.0000 | `PAGO OTROS QA` | `''` | `''` |

🔴 **Columna afectada: `collection_payment.nu_payment_doc`.**

> **Impacto operativo.** Un cobro en efectivo que llega a la nube sin `nu_payment_doc` **no tiene número de
> recibo con el que amarrar el dinero físico a la rendición del vendedor**: si el efectivo no cuadra en caja,
> no hay documento que identifique la operación, y la diferencia no se puede imputar a un cobro concreto.

## 2.4 · El «antes» de Pago Móvil, para contraste

El cobro **27150** (creado a mano por la QA antes del fix) sigue en la nube como prueba del defecto:

| id | `co_payment_method` | `nu_phone_number` | `id_code_phone_number` | `nu_document` |
|---|---|---|---|---|
| **27150** | `pm` | 🔴 **`''`** | 1 | `8676764` |

Con el build de hoy **ese estado ya no es alcanzable**: la validación bloquea antes de enviar.
⇒ **No se pudo producir ningún `pm` con teléfono vacío**, que es exactamente el resultado buscado.

> **Impacto operativo del hueco original (ya cerrado):** un pago móvil sin teléfono **no se concilia contra
> el estado de cuenta del banco** — el teléfono emisor es la única llave de la operación en el reporte bancario.

---

# 3 · 🔴 PRIORIDAD 2 — REGRESIÓN DE LA TABLA DE TOTALES

Todo sobre **NESTLE (1000001897)**, empresa 1002, cobro en **VES**, tasa **710,0000**, cobro **Ref 27152**.

## 3.1 · 🔑 H2 — EL DATO QUE ZANJA LA DISCUSIÓN

**Prueba:** mismo cobro, mismos dos documentos seleccionados, **sin tocar nada más**; se lee el
«Monto total a Pagar» **antes** y **después** de guardar una retención de **300,00 VES**
(IVA 200,0000 + ISLR 100,0000) sobre el documento `0013000338`.

| Momento | `Monto total a Pagar VES` | `Monto total a Pagar USD` |
|---|---|---|
| **ANTES de la retención** | **9.478,3100** | 13,3497 |
| **DESPUÉS de la retención** | **9.178,3100** | 12,9272 |
| **Δ** | 🔑 **−300,0000** | −0,4225 |

`9.478,3100 − 9.178,3100 = 300,0000` = **exactamente IVA (200,00) + ISLR (100,00)**.

> 🔑 **EL «MONTO TOTAL A PAGAR» SÍ BAJA POR EL MONTO RETENIDO.**
>
> **Lectura del dato, sin opinar sobre quién tiene razón:** el importe que la app le pide cobrar al
> vendedor **ya viene neto de la retención**. Es decir, el pago que el vendedor introduce **no contiene**
> los 300,00 retenidos: la retención se descuenta *antes*, y el efectivo cubre sólo el resto.
> Es el criterio que el propio formulario aplica dentro del detalle del documento, donde
> **«Monto a pagar VES» pasó de `5.027,3800` a `4.727,3800`** al guardar la retención.

Evidencia: `img/H2-total-ANTES-retencion.png` · `img/H2-total-DESPUES-retencion.png`.
La corrida del 26/08 observó lo mismo (23.200,00 → 23.189,00 al retener 11,00): **confirmado en este build**.

## 3.2 · 🔴 H2 — el defecto: `Monto Saldo` con retención + pago parcial

Sobre el **mismo documento**, activado el toggle **«Pago parcial:»** y fijado `Monto a pagar VES = 2.000,0000`:

| Doc. | `Monto Doc.` | `Retención IVA` | `Retención ISLR` | `Monto Pago` | **`Monto Saldo`** (pantalla) | **Deuda real** | Veredicto |
|---|---|---|---|---|---|---|---|
| `0013000338` | 5.027,3800 | 200,0000 | 100,0000 | 2.000,0000 | 🔴 **3.027,3800** | **2.727,3800** | 🔴 **FAIL — inflado en +300,00** |
| `0013000339` 🔑 **CONTROL** *(sin retención, pago completo)* | 4.450,9300 | — | — | 4.450,9300 | **0,0000** | 0,0000 | ✅ PASS |

```
saldo del documento .................. 5.027,3800 VES
− pago parcial aplicado .............. 2.000,0000 VES
− retención IVA ......................   200,0000 VES
− retención ISLR .....................   100,0000 VES
──────────────────────────────────────────────────────
  DEUDA REAL REMANENTE ...............  2.727,3800 VES
  La app muestra .....................  3.027,3800 VES   ← +300,00 = exactamente lo retenido
```

⚠️ **Nota de método.** `Monto Doc. − Monto Pago = Monto Saldo` **cierra** (5.027,38 − 2.000,00 = 3.027,38).
Ésa es la fórmula del propio código: **comprobarla no prueba nada**. El contraste válido es contra la deuda
real del documento, y ahí no cuadra. **El control del mismo cobro cierra en 0,0000**, así que la causa
queda aislada en la retención, y §3.1 muestra que el pago **no** incluye lo retenido.

**Ambos documentos viven en el MISMO cobro (Ref 27152)** ⇒ control válido: mismo build, misma sesión,
mismo formulario, misma tasa.

Evidencia: `img/H2-tabla-scroll0-izq.png` · `img/H2-tabla-scroll549-MontoSaldo.png` (columna `Monto Saldo`
visible junto a `Retención ISLR`; la tabla mide `scrollWidth 909 / clientWidth 360`).

### Cotejo en la nube — cobro 27152

```sql
SELECT id_collection, co_document, nu_amount_doc, nu_balance_doc,
       nu_amount_retention, nu_amount_retention2, in_payment_partial, nu_amount_paid
FROM collection_detail WHERE id_collection = 27152;
```

| `co_document` | `nu_amount_doc` | **`nu_balance_doc`** | `nu_amount_retention` | `nu_amount_retention2` | `in_payment_partial` | `nu_amount_paid` |
|---|---|---|---|---|---|---|
| `0013000338` | 5027.3800 | 🔴 **3027.3800** | 200.0000 | 100.0000 | **true** | 2000.0000 |
| `0013000339` | 4450.9300 | **4450.9300** | 0.0000 | 0.0000 | false | 4450.9300 |

🔴 **Columna afectada: `collection_detail.nu_balance_doc`.** La nube recibe el **mismo valor inflado** que
muestra la pantalla — el defecto **no es sólo de presentación**.

🔴 **Y se reconfirma el hallazgo colateral de la mañana: la misma columna guarda DOS criterios distintos.**
En la fila sin parcial `nu_balance_doc` es el **saldo bruto** (4.450,93 = foto del saldo); en la fila con
parcial es **bruto − pago** (3.027,38). ⇒ un consumidor que calcule el remanente desde `nu_balance_doc`
acierta en una fila y falla en la otra, y **en ningún caso puede restar la retención**.

> **Impacto operativo.** El saldo que el vendedor le muestra al cliente (y el que queda en la nube) le
> **cobra dos veces** la retención: se la descontaron del pago y se la dejaron en la deuda.

## 3.3 · H1 — «Monto Doc.» en pago parcial ✅ PASS

En el escenario de §3.2, `Monto Doc.` muestra **5.027,3800** = el saldo **BRUTO** del documento, **no**
`saldo − pago`. El defecto del 24/08 (que duplicaba `Monto Saldo`) **no reproduce**. ✅

## 3.4 · H3 — los tres casos de retención

| Caso | Medición | Resultado |
|---|---|---|
| retención + **pago completo** ⇒ `Monto Saldo` = 0 | doc `0013000338`, ret. 300,00, `Monto Pago 4.727,3800` → **`Monto Saldo 0,0000`** | ✅ **PASS** |
| retención + **pago parcial** (el caso en disputa) | §3.2 | 🔴 **FAIL — H2** |
| **cobro tipo Retención** (`co_type=2`) | **no re-ejecutado** en esta corrida | ⛔ ver §6 |

## 3.5 · Round-trip §9 del detalle de retención ✅

Cerrado el modal «Detalle Del Documento» y **reabierto**, conservó `Nro. Comp Ret = 99999`,
`Monto retenido IVA = 200,0000`, `Monto retenido ISLR = 100,0000` y `Monto a pagar VES = 4.727,3800`. ✅
`sizeRetention = 5` reconfirmado por comportamiento: con 5 dígitos, IVA/ISLR pasan de ausentes a editables.

---

# 4 · PRIORIDAD 3 — RESTO DE COBROS

> ⚠️ **Configuración vigente al momento de medir** (leída en `global_configuration` de la nube **y** en el
> `collectService` del dispositivo, a las **~16:0x del 28/08**):
> `prepaidCurrency = **USD**` (`da_update 2026-08-29T00:33Z`) · `prepaidRangeCurrency = USD` ·
> `prepaidRangeAmount = 10` · `automatedPrepaid = true` · `multiCurrencyCollection = true`.
> El dispositivo devolvió **`prepaidCurrency = "USD"`** ⇒ la app ya tiene el valor nuevo.
> **Todo lo de abajo se juzga contra USD**, no contra el `VES` del encargo original.

| ID | Caso | Medición | Resultado |
|----|------|----------|-----------|
| **G1** | **Anticipo automático** — moneda | **Cobro `27153` en VES**, excedente `10.036,8900 VES = 14,1365 USD` → **anticipo `27154` en `co_currency='USD'`, total `14.1365`**. Y **cobro `27155` en USD** → **anticipo `27156` en USD, `19.6678`**. Aritmética: 10.036,89 ÷ 710 = **14,1365** ✓ | ✅ **PASS — el anticipo sale en USD venga el cobro de VES o de USD.** `prepaidCurrency` respetado |
| **G2** | **IGTF + diferencia positiva** ⛔ *(quedó sin validar en la mañana)* | Cobro **USD**, doc `0091025919` (19,7400 USD). **Sin IGTF:** `Monto total a Pagar USD 19,7400`. **Con `IGTF 3% - 3%`:** `IGTF USD 0,5922` / `IGTF VES 420,4620` → **`Monto total a Pagar USD 20,3322`**. Pago 40,00 USD → **`Diferencia 19,6678 USD`** (sin IGTF habría sido 20,2600). Nube: `27155.nu_amount_igtf = 0.5922`; anticipo `27156 = 19.6678` | ✅ **PASS.** 🔑 **El IGTF NO infla la diferencia: la REDUCE**, porque se suma al *total a pagar*. El anticipo baja exactamente en el IGTF (0,5922 USD). Aritmética exacta: 19,74 × 3 % = 0,5922 |
| **G2b** | IGTF sobre un cobro **en VES** | Con `IGTF 3%` seleccionado en un cobro VES pagado en efectivo VES, `montoIgtf = 0` y el `Monto total a Pagar` **no cambia** (1.963,1100 antes y después). No aparece línea IGTF en el Tab Total | ℹ️ **Observación, no defecto**: coherente con que el IGTF grave operaciones en divisas. **No confirmado con producto** |
| **G3** | **Los dos importes del anticipo** | Anticipo **27154** abierto desde BUSCAR: `Total Efectivo: USD 14,1365 / VES 10.036,8900` · `Monto USD: 14,1365` · `Monto VES: **10.036,8900**` · `Total General USD: 14,1365` | ✅ **PASS — los dos importes VES COINCIDEN al cuarto decimal.** **No hay descuadre**, ni en pantalla ni en datos. Evidencia con ambas cifras en una sola imagen: `img/G3-anticipo-27154-dos-importes.png` |
| **G4** | **Cobro con IVA** (`userCanCollectIva=true`) | El tile **«COBRO 25% IVA»** existe y abre un formulario con **5 tabs** y `co_type = 4`. **No se ejercitó** con documentos: se agotó el tiempo. Formulario **descartado sin guardar** | ⛔ **NO VALIDADO** |

---

# 5 · REGISTROS CREADOS Y DESCARTADOS

## Enviados a la nube — 6 registros · 4 operaciones de Enviar (tope de 8 respetado)

| Ref | Tipo | `co_type` | Moneda | Total | Para qué | Estado |
|---|---|---|---|---|---|---|
| **27151** | Cobro | 0 | VES | 8.307,0000 | 🔴 **P1** — 4 métodos: `ef` **sin Nro. Recibo** + `de`/`tr`/`ot` completos. Doc `0091013639` | `st_collection=1` · **BD-OK** |
| **27152** | Cobro | 0 | VES | 6.450,9300 | 🔴 **P2 / H1·H2·H3** — doc `0013000338` (retención 300 + parcial 2.000) + `0013000339` (control) | `st_collection=1` · **BD-OK** |
| **27153** | Cobro | 0 | VES | 12.000,0000 | **G1** — excedente 10.036,89 VES. Doc `0013000340` | `st_collection=1` · **BD-OK** |
| **27154** | **Anticipo automático** | 1 | **USD** | **14,1365** | **G1 / G3** — generado desde 27153 · `co_original_collection = 1787945813223.0` | `st_collection=1` · **BD-OK** |
| **27155** | Cobro | 0 | **USD** | 40,0000 | **G2** — IGTF 3 % (`nu_amount_igtf = 0.5922`). Doc `0091025919` | `st_collection=1` · **BD-OK** |
| **27156** | **Anticipo automático** | 1 | **USD** | **19,6678** | **G2** — generado desde 27155 · `co_original_collection = 1787946176496.0` | `st_collection=1` · **BD-OK** |

**Ningún registro quedó en «Guardado» ni «Por Enviar».** Se verificó `st_collection = 1` en los 6.

## Descartados — no quedaron en el sistema

| Qué | Cómo se cerró |
|---|---|
| Formulario de **COBRO 25% IVA** (`co_type=4`), abierto para G4 sin cargar cliente ni documentos | **Descartado** con el botón atrás; salió al menú **sin dirty-guard** (no había nada que guardar). Nada creado |
| ~20 pulsaciones de **Enviar que la validación rechazó** (barrido P1) | **No generan registro**: la alerta de método incompleto corta antes del envío. Verificado por el salto limpio de ids 27150 → 27151 |

**Documentos consumidos de la cartera de NESTLE:** `0091013639` saldado · `0013000339` saldado ·
`0013000338` con retención 300,00 + pago parcial 2.000,00 · `0013000340` saldado · `0091025919` saldado.

---

# 6 · LO QUE NO SE VALIDÓ

| Tema | Motivo |
|---|---|
| **Cheque (`ch`)** | 🚫 **N/A estructural — la UI no ofrece el método.** No es un fallo de la corrida: no hay nada que probar en el formulario |
| **H3c — cobro tipo RETENCIÓN (`co_type = 2`)** | ⛔ **No re-ejecutado hoy por la tarde.** La corrida de la mañana lo dio PASS sobre el build anterior (4 tabs sin Pagos, `Total a pagar = IVA + ISLR`). **No se puede dar por bueno en este APK sin re-medirlo** |
| **G4 — cobro con IVA** | ⛔ Se abrió el formulario (`co_type=4`, 5 tabs) pero **no se cargó cliente ni documento**: se agotó el tiempo. El caso es ejecutable |
| **H2 en la capa WEB** (columna `Saldo doc.` del detalle del cobro) | ⛔ Fuera del alcance: corrida íntegramente móvil + BD. **Sigue siendo la única capa de H2 sin medir**, y la nube ya entrega el valor inflado (3.027,38) ⇒ lo que muestre la web depende de si calcula o transcribe |
| **Qué campo exige `pm` en el *selector* de código de área y de tipo de documento** | Ambos vienen con **valor por defecto** (`0414`, `V`) y **no se probó vaciarlos** — el control es un `ion-select` sin opción nula |
| **`ef` con Nro. Recibo obligatorio en otras empresas / clientes** | Medido sólo en empresa **1002** con NESTLE. No se comprobó si alguna VG por cliente lo vuelve obligatorio |
| **Fecha de los métodos de pago** | `Efectivo` nace en **28/8/2026** (hoy) pero `Depósito`, `Transferencia`, `Otros` y `Pago Móvil` nacen en **6/8/2026**. **No se investigó** si el default desfasado es intencional — no era objeto del encargo, pero **conviene revisarlo** |
| **Empresa 1003** | Todo se corrió en 1002 |

---

# 7 · OBSERVACIONES

1. ⚠️ **La alerta previa del anticipo automático ya NO aparece — 2 de 2 envíos.** En los dos cobros que
   generaron anticipo (27153 y 27155) **no salió** el mensaje
   *«Se creará un anticipo automático por el monto excedente de …»* que sí observó la corrida de la mañana
   sobre el build anterior. Sí aparece el rótulo dentro del Tab Pagos
   («**Este pago creó el anticipo automático**») y sí llega el acuse final
   («*Anticipo nro. 27154 enviado exitosamente*»). ⇒ **el usuario ya no recibe el aviso con el importe
   antes de confirmar el envío.** Se reporta como observación a contrastar con producto: podría ser
   intencional. *(Caveat honesto: en ambos casos el primer click sobre Enviar no llegó a disparar el
   handler y hubo que repetirlo; no puede excluirse del todo que la alerta se perdiera en ese hueco.)*
2. **`Diferencia` negativa NO es tolerada al enviar**, ni siquiera dentro del rango de tolerancia:
   `Todos los documentos están marcados como pago parcial, el monto pagado debe ser igual al monto a pagar.`
   Aparece **después** de la validación de métodos ⇒ sirve como discriminador barato: si sale ésta y no la
   de «método incompleto», los campos del método están bien.
3. **La retención sigue exigiendo adjunto para enviar** aunque `requiredCollectionAttachments = false`:
   `Al menos a un documento se le agregaron retenciones, debe agregar al menos un adjunto para poder enviar el Cobro.`
   **Comportamiento conocido, no se levanta como hallazgo nuevo.** 🔑 **Novedad útil: la FIRMA del Tab
   Adjuntos satisface el requisito** — dibujar en el `canvas` de «Firma» habilitó el envío **sin usar la
   cámara** (27152 salió así). Es la vía limpia para dejar enviables los cobros con retención.
4. **El `Número de referencia` de Pago Móvil es numérico:** al teclear `REF-PM-001` conservó sólo `001`.
   El de Depósito/Transferencia/Otros sí acepta texto (`PAGO OTROS QA` viajó completo).
5. **Ordenamiento de la lista BUSCAR:** los cobros nuevos (27151-27156) **no encabezan** la lista
   (`filteredItems` los coloca tras 27145). Se localizan sin problema con el buscador por Nro. Ref.
   No se profundizó.

---

# 8 · PATRONES / SELECTORES NUEVOS (insumo de consolidación)

| Patrón / selector | Alcance | Detalle |
|---|---|---|
| 🔑 **El modal `#eventModal` de métodos es de SELECCIÓN ÚNICA aunque use `ion-checkbox`** | universal (v6.6.21) | Marcar un método desmarca el anterior ⇒ **un método por «AGREGAR»**. Intentar marcar los 5 de una deja sólo el último |
| 🔑 **Barrido de validación SIN ensuciar el sistema** | universal | La validación de métodos corre **antes** de `El Cobro será enviado`. ⇒ se puede mapear qué exige cada método con N pulsaciones de Enviar y **cero registros creados**: si bloquea, no hay envío; si pasa, se pulsa **Cancelar** |
| 🔑 **«Dejar-uno-fuera» es el único método válido para saber qué campo exige** | universal | Llenar en cascada sólo prueba que el ÚLTIMO campo hacía falta. Hay que llenar todo, verificar que pasa, y **vaciar de a uno** |
| **Borrar un método de pago: `ion-icon[name="trash"]` del acordeón, sin alerta de confirmación** | universal | Borra en silencio y deja `ion-accordion-group` vacío. Permite reutilizar un mismo formulario para todos los métodos |
| **La FIRMA (`app-adjunto canvas`) cuenta como adjunto para el requisito de retención** | universal | `pg.mouse.down()` + `move` × N + `up()` sobre el canvas ⇒ el envío procede. **Evita el mock de cámara** en cobros con retención |
| **`Monto` de un método = el `ion-input` del acordeón cuyo `value` es `"0,0000"`** | universal | Más estable que el índice: en `pm` es el índice 3, en `ef`/`de`/`tr`/`ot` es el 1 |
| **Los índices de `ion-input` del «Detalle Del Documento» se DESPLAZAN dos veces** | universal | Al llenar `Nro. Comp Ret` aparecen Fecha/IVA/ISLR (12→16 inputs) y **al activar «Pago parcial:» el «Monto a pagar» se resetea a `0,0000`** y el «Dif. Devolución/Faltante» pasa a `disabled`. Localizar por valor/etiqueta, nunca por índice cacheado |
| **`GUARDAR` del modal de detalle: sólo responde por `shadowRoot`** | universal | `pg.mouse.click` sobre sus coords **no dispara**; `b.shadowRoot.querySelector('button').click()` funcionó 2/2 |
| 🔴 **El primer `pg.mouse.click` sobre `.imagenEnviar` tras un cambio de tab/scroll NO dispara** | universal (v6.6.21) | 2 de 4 envíos: el click devuelve `elementFromPoint = ION-BUTTON.imagenEnviar` (no hay oclusión) y aun así no corre el handler. **Re-leer coords y repetir un solo click** resuelve. **NO apilar Pointer+shadow+mouse** (dispara dos veces) |
| **Selección de cliente: `#clienteSelect` → `Enter` → `ion-icon[name="chevron-forward-outline"]`** | universal | **4/4 sin reintentos**, reconfirma la corrida de la mañana |
| **`ion-select` de Moneda del cobro: asignar el `value` del `ion-select-option` (objeto) funciona y NO encola alerta de reinicio** | acota `[dm-electronica]` | VES→USD y USD→VES, ambos sin la alerta «¿Seguro desea cambiar la moneda?» estando el cobro sin documentos |
| **`collectService` expone `montoIgtf` / `montoIgtfConversion` / `igtfSelected`** | universal | Discriminador barato de si el IGTF computó, sin leer la tabla |
| **`colletionPayment` NO se lee por el orden alfabético del catálogo** | cliente (a verificar en otros) | `true-false-true-true-true-true` con Cheque ausente y Depósito presente ⇒ **medir en la UI, no deducir de la VG** |

---

*Corrida ejecutada íntegramente por CDP sobre `:9220` (socket `webview_devtools_remote_7952`).
Sin cuelgues de CDP, sin crashes de la app, sin `#eventModal.present()`.
0 ⛔ BLOCKED por automatización.*
