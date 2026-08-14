# Barrido de COBROS pre-tag 21 — difranca (móvil)

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `barrido_cobros_difranca_20260811` |
| Cliente / playa | **difranca** · **EL YAQUE** (`denarioelyaque.ddns.net`) |
| Empresas usadas | **DDHP_A12** (id 2) y **DIF_A12** (id 3) |
| Vendedor | `vend206` · coUser 206 · id_user 275 |
| App | `com.kiberno.denarioPremiumPro` v1.0 · db19 · `window.ng=true` · `sqlitePlugin` OK |
| Baseline nube | `max(id_collection) = 21859` · local `sqlite_sequence(collections) = 129` |
| Modo | **ESCRITURA** (autorizado por QA) |
| Estado | ⚠ **CORRIDA INTERRUMPIDA** durante la verificación del drenado de la cola |

**Guarda de tenant verificada antes de tocar la UI**: nube y BD local coinciden — empresas
`DDHP_A12` · `DIF_A12` · `DHVITAL01_A`, vendedor `vend206`. No hubo login ni cambio de usuario.

---

## 1. Veredicto de los tres defectos abiertos

| Defecto | Veredicto | Evidencia |
|---|---|---|
| **`COB-USD-CONV-INVERTIDA`** | ✅ **ARREGLADO** | Cobro **nuevo** en DIF_A12 / moneda `USD`: Tab Total muestra `Monto total a Pagar USD 76,56` → `BSD 57.580,01` = 76,56 **×** 752,09. Si el bug viviera mostraría `0,10` (dividido). Cabecera y acordeón **coinciden** (`Total Transferencias BSD 57.580,01`), que es justo lo que divergía. |
| **`COB-IGTF-DIFERENCIA-FANTASMA`** | ✅ **ARREGLADO** (3 aspectos) | Cobro nuevo con IGTF 3% embebido: `Monto total a Pagar US$ 103,00` **ya incluye** el IGTF (100 + 3); `Pago US$ 103,00`; **`Diferencia 0,00`** — no aparece la diferencia fantasma. Además la tabla de documentos del Tab Total **ahora trae columna `IGTF` (3,00)**, que antes faltaba. |
| **Fecha del pago al GUARDAR** | ✅ **ARREGLADO** | Cobro con `Fecha` del pago puesta en **01/08/2026** → Guardar → salir al menú → BUSCAR → reabrir: la fecha sigue en **1/8/2026**. También persisten monto, referencia y banco. BD local `collection_payments.da_value = 2026-08-01 00:00:00`; tras enviar, la nube guarda `da_value = 2026-08-01`. |

---

## 2. La aritmética, cobro por cobro

Tasa vigente en los 5 cobros: **752,09 BSD** (Fecha Tasa 04/08/2026).

### C-A · Nro. Ref **21860** — cobro normal, BSD, 2 documentos + pago parcial
Cliente **CAR755 – MULTIDISTRIBUIDORA JAKE** (DDHP_A12).

```
FACT5000085387  saldo 118.882,87 BSD  → pagado COMPLETO   118.882,87
FACT5000084890  saldo 1.158.865,40    → pago PARCIAL           1.000,00
                                        ─────────────────────────────
Monto total a pagar BSD                              119.882,87  ✔
```
- Antes del parcial la pantalla mostraba **1.277.748,27** = 118.882,87 + 1.158.865,40 ✔
- Conversión: `119.882,87 ÷ 752,09 = 159,40 US$` ✔ (**divide**, correcto en cobro de moneda local)
- Pago 119.882,87 · **Diferencia BSD 0,00** · Total General 119.882,87 ✔
- Por documento en BD: `nu_amount_paid_conversion` = **158,07** y **1,33** = saldo ÷ 752,09 ✔

> 🟢 **Dato relevante para el go/no-go:** el documento con **pago parcial** guardó
> `nu_amount_paid_conversion = 1,33` (dividido). Ése es exactamente el campo que
> `COB-WEB-DCTO-CONV-MULTIPLICA` corrompía multiplicándolo, y el camino que lo disparaba
> (documento editado). **El fix de raíz de `convertirMonto()` está aplicado.**

### C-B · Nro. Ref **21861** — cobro con IGTF embebido, US$
Cliente CAR755 (DDHP_A12), `FACT5000084888` con parcial 100,00 US$, IGTF 3%.

```
Parcial documento                 100,00 US$
IGTF 3% sobre el total a pagar      3,00 US$   (base = TOTAL, correcto)
                                  ───────────
Monto total a Pagar               103,00 US$
Conversión: 103,00 × 752,09 =  77.465,27 BSD   ✔ (multiplica, cobro en moneda dura)
IGTF BSD:     3,00 × 752,09 =   2.256,27 BSD   ✔
Diferencia                          0,00       ✔
```
BD nube: `nu_amount_total 103,00` · `nu_amount_total_conversion 77.465,27` ·
`nu_igtf 3` · `nu_amount_igtf 3` · `nu_amount_igtf_conversion 2.256,27` · `has_igtf true` ·
`nu_difference 0`. Todo cuadra.

### C-C · local_id 133 — cobro en **USD**, empresa **DIF_A12**
Cliente **COJ157 – DARA S STORE SC**, `FACT5000002784` saldo 76,56 USD, pagado completo.

```
Monto total a Pagar USD   76,56
Monto total a Pagar BSD   57.580,01 = 76,56 × 752,09   ✔
Diferencia                 0,00                        ✔
```

### C-D · local_id 134 — **anticipo** (`co_type=1`), BSD
Sin documentos (4 tabs, sin Documentos). Total a pagar pasa de `0,00` a **500,00** al cargar el pago,
`Diferencia 0,00`. Conversión `500 ÷ 752,09 = 0,66 US$` ✔.

### C-E · local_id 135 — **retención** (`co_type=2`), BSD ❌
`FACT5000084889`, comprobante `20260811000001`, IVA 10,00 + ISLR 1,00.

```
Monto IVA BSD               10,00
Monto ISLR BSD               1,00
Monto total retenido BSD    11,00   ✔
Monto total a Pagar BSD     11,00   ✔  (oráculo co_type=2: total = IVA + ISLR, el saldo no participa)
Monto total a Pagar US$      1,01   ❌  debería ser 0,01  (11,00 ÷ 752,09)
```
**Ver defecto D-1.**

---

## 3. 🔴 ¿El cobro baja el saldo del documento?

**NO baja — ni en la nube ni en la BD local del dispositivo, en la ventana de la corrida.**

Medido con tres fuentes independientes:

1. **Mi propio cobro 21860.** `FACT5000085387` se pagó a **saldo completo** (158,07 US$ =
   118.882,87 BSD, `in_payment_partial=false`). Después de enviado:
   `document_sale.nu_balance = 158,07` · `da_update = 2024-12-11` (sin tocar) · `id_collection = null`.
   Idéntico en la tabla local `document_sales`.
2. **Los 6 cobros de hoy previos a esta corrida** (21854–21859): los 6 documentos siguen con
   `nu_balance` igual al que tenían al cobrarse y `da_update` de 2024/2025.
3. **Cobros de hace 3 semanas** (21390–21400, del 21/07): la mayoría de los documentos
   **siguen con el mismo saldo que al cobrarse**, aunque la fila del documento se re-sincronizó
   el 22/07. Dos sí bajaron (21390, 21391).

**Lectura honesta:** `document_sale` la alimenta el ERP, no el móvil, así que la bajada de saldo
no es responsabilidad directa de la app. Pero el efecto observable para el vendedor sí importa:
**una factura recién cobrada al 100 % sigue apareciendo con su saldo íntegro y se puede volver a
cobrar.** Que algunos documentos de julio sí bajaran y otros no indica que la aplicación en el ERP
es **parcial o irregular**, no simplemente diferida.

⚠ **No concluyente**: la corrida se interrumpió antes de completar la sincronización que habría
cerrado si el saldo se actualiza tras un ciclo de sync. `id_collection`/`co_collection` de
`document_sale` están en **null en 45.226 de 45.230 filas** de DDHP_A12 — el mecanismo de marcado
existe pero prácticamente no se usa.

---

## 4. Defectos nuevos

### D-1 · 🔴 La retención NO convierte el monto de ISLR (plata, persiste en BD)

En un cobro de **retención** (`co_type=2`) en moneda local, el **IVA se convierte** y el
**ISLR se copia sin convertir**, en la misma fila. Fila real de `collection_details` (local):

| Campo | Guardado | Correcto |
|---|---|---|
| `nu_amount_retention` (IVA BSD) | 10,00 | 10,00 ✔ |
| `nu_amount_retention_iva_conversion` | **0,01** | 0,01 ✔ (10 ÷ 752,09) |
| `nu_amount_retention2` (ISLR BSD) | 1,00 | 1,00 ✔ |
| `nu_amount_retention_islr_conversion` | **1,00** ❌ | 0,00 (1 ÷ 752,09) |
| `nu_amount_paid_conversion` | **1,01** ❌ | 0,01 |
| `collections.nu_amount_total_conversion` | **1,01** ❌ | 0,01 |

- **No es redondeo:** dos campos hermanos de la misma fila reciben tratamiento distinto.
- El error **sube a la cabecera** del cobro y **se muestra en pantalla** (`Monto total a Pagar US$ 1,01`).
- **Magnitud del error = la tasa** (×752,09) aplicada al componente ISLR.
- Afecta a toda retención con ISLR ≠ 0 en cobro de moneda local.
- Reproducido 1 vez, confirmado en BD local. **Falta confirmarlo en la nube** (el registro quedó en cola).

### D-2 · ⚠ Etiqueta de moneda incorrecta en la columna de conversión (DIF_A12)

En Tab Documentos de un cobro de **DIF_A12**, la columna de conversión trae importes **en bolívares
rotulados `US$`**: `300,44 USD / 225.957,92 US$`, donde 225.957,92 = 300,44 × 752,09 (o sea BSD).
En DDHP_A12 la misma columna rotula `BSD` correctamente. **El número está bien, la etiqueta no.**
Agravante: en difranca `US$` y `USD` son dos monedas distintas, así que el rótulo equivocado es
justo el que más confunde.

Relacionado: el selector de cliente de DIF_A12 muestra `Saldo BSD: 0,00 / Saldo US$: 0,00` para
COJ157, que tiene 9 facturas por 2.498,41 **USD** — el selector no rotula ni suma la moneda `USD`.

### D-3 · ⚠ Retención, Tab Total: "Fecha del documento" muestra la fecha del comprobante

El acordeón dice `Fecha del documento: 2026-08-11`, que es la **Fecha Comp Ret** cargada.
La fecha real del documento es **2024-10-09** (`collection_details.da_document = 2024-10-09`).
Cosmético, pero induce a error al cotejar.

### D-4 · ⚠ NO CONCLUYENTE — 3 cobros quedaron en la cola sin drenar

Los dos primeros cobros (21860, 21861) salieron **inmediatos**. A partir del tercero, los **3
restantes** quedaron `st_delivery=2` (Por Enviar), `id_collection=0` y en `pending_transactions`,
con `failed_transactions = 0`:

| local_id | Tipo | Empresa | Monto | Estado |
|---|---|---|---|---|
| 133 | cobro `co_type=0` USD | DIF_A12 | 76,56 USD | **BD-QUEUED** |
| 134 | anticipo `co_type=1` | DDHP_A12 | 500,00 BSD | **BD-QUEUED** |
| 135 | retención `co_type=2` | DDHP_A12 | 11,00 BSD | **BD-QUEUED** |

El dispositivo tiene **WiFi validado con internet** y el DNS del host resuelve, así que no es una
caída de red evidente. La app **no avisa** de que quedaron sin enviar: el flujo de envío mostró sus
alertas normales ("El Cobro será enviado" / "El Anticipo será enviado" / "Su Cobro será enviado").

⚠ **La corrida se interrumpió durante el `Sincronizar` que iba a determinar si la cola drena.**
No se puede afirmar que sea un defecto: puede ser reintento normal pendiente. **Requiere
verificación antes del tag** — si la cola no drena, es bloqueante; si drena, es solo latencia.

---

## 5. Registros creados

| Ref / local_id | Tipo | Empresa | Cliente | Monto | Estado |
|---|---|---|---|---|---|
| **21860** | Cobro (2 docs + parcial) | DDHP_A12 | CAR755 | 119.882,87 BSD | ✅ Enviado · BD-OK nube |
| **21861** | Cobro + IGTF 3% | DDHP_A12 | CAR755 | 103,00 US$ | ✅ Enviado · BD-OK nube |
| local_id 133 | Cobro USD | DIF_A12 | COJ157 | 76,56 USD | ⚠ BD-QUEUED |
| local_id 134 | Anticipo | DDHP_A12 | CAR755 | 500,00 BSD | ⚠ BD-QUEUED |
| local_id 135 | Retención | DDHP_A12 | CAR755 | 11,00 BSD | ⚠ BD-QUEUED |

Comentario de todos: `Barrido Cobros PreTag21 …`. Referencias de transferencia `777000000 0X`.
Banco: BANESCO `01340466684661046990` (y BANCO MERCANTIL en el de DIF_A12).
Ninguno llevó adjunto (`requiredCollectionAttachments=false`), no se usó mock de cámara.

---

## 6. Otras verificaciones

- **Menú de Cobros**: COBRO · ANTICIPO/PREPAGO · RETENCIÓN · IGTF · BUSCAR. **Sin 25%IVA**,
  coherente con `userCanCollectIva=false`.
- **Métodos de pago**: el `#eventModal` ofrece **solo Depósito y Transferencia** — confirma
  `colletionPayment=false-false-true-true-false-false` (sin Efectivo, Cheque, Otros ni Pago Móvil).
- **Formulario nuevo**: 5 tabs con 4 `disabled` hasta poner cliente + comentario; con
  `requiredComment=true` el hint dice **"Mín. 0 - Máx. 255 caracteres"**.
- **`sizeRetention` (⚠️VERIFICAR del perfil) — CERRADO**: con `sizeRetention=0` la UI **no valida
  longitud**; se aceptó un comprobante de 14 dígitos sin mensaje "Debe tener N caracteres".
- **Descuento por pronto pago / dif-faltante**: 🚫 **N/A** — `userCanSelectCollectDiscount=false`;
  el detalle del documento solo ofrece `Dif. Devolución/Faltante`, que llega **`disabled`**.
- **Guardar → reabrir → Enviar**: ejecutado con 21860, envío completo y fila de guardados consumida.
- **Alertas leídas (no predichas)**: guardado `[Aceptar]` "El Cobro se ha guardado" ·
  envío `[Cancelar, Aceptar]` "El Cobro será enviado" → `[OK]` "Su Cobro será enviado" → `[OK]`
  "Cobro nro. X enviado exitosamente" · anticipo `[Cancelar, Aceptar]` "El **Anticipo** será enviado" ·
  cambio de empresa `[Cancelar, Aceptar]` · sincronizar `[Cancelar, Aceptar]` "¿Desea Sincronizar?".
- **Sin crash de la app** en ningún envío (contrasta con dm-electronica / latino_cosmetica).
  Hubo una caída de CDP por **reinicio del daemon de adb**, no de la app (mismo PID 12300).

## No ejecutado por la interrupción

- Drenado de la cola / segundo baseline-diff de saldos tras `Sincronizar`.
- Doble toque en Enviar/Guardar (¿duplica?).
- Buscador de cobros contra la ventana `historyMonths`.
- Anulación/borrado de un guardado.
- Retención **dentro** del cobro normal (`retencion=true`) completada — el campo `Nro. Comp Ret`
  **existe y es editable** en el detalle del documento de un cobro normal (verificado), pero no se
  llegó a cargar y cotejar el neto.

---

## Patrones / selectores nuevos

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔴 **El `ion-datetime` de un pago NO se abre con click en `.letrasFechasButton`** | cliente difranca | El click no revela nada y el pago se guarda **con la fecha de hoy en silencio** (mismo modo de falla que la corrida de conciliación). **Receta que sí funciona:** el datetime vive en un `ion-modal.fechasModal` cerrado → `document.querySelector('ion-datetime#fechaTransferencia0').closest('ion-modal').present()` → `d.value = ISO` + `ionChange` + `await d.confirm(ISO)`. Rango `min=2026-02-12` / `max=hoy`. **Verificar el rótulo `d/m/yyyy` antes de Guardar.** |
| 🔴 **`Fecha Comp Ret` SÍ necesita click real en su display** | cliente difranca | Al revés que el anterior: `present()` sobre el `ion-datetime#datetime` genérico **toma el valor pero no llena el campo**. Hay que clickear el display `ion-input#inputCalendar` (`type="date_event"`), esperar el datetime visible y recién ahí `value`+`ionChange`+`confirm()`. Sin la fecha, **Guardar del detalle queda `disabled`** (contradice ferrenuestro, donde tenía default). |
| 🔴 **`ion-input.inp-write` PIERDE la clase al llenarse** | universal | El Comentario del Tab General se localiza con `.inp-write` **solo cuando está vacío**; una vez cargado la clase desaparece y el selector devuelve `undefined`. **Localizar por ausencia de `id`** (`querySelectorAll('ion-input')` filtrando `!e.id && offsetParent!==null`), no por la clase. |
| 🔴 **Los `ion-input` del modal de detalle SE RE-INDEXAN al escribir** | universal | Tras teclear el `Nro. Comp Ret`, el índice del campo cambia (aparece/desaparece un input) ⇒ un `commit()` por índice cacheado **escribe en el campo equivocado** y IVA/ISLR nunca habilitan. **Targetear siempre por el texto de su `ion-col`** (`/Comp Ret/i` excluyendo `/Fecha/i`), nunca por índice entre dos acciones. |
| **Habilitar IVA/ISLR de retención: `.value` + eventos, no solo teclado** | reconfirma jerez/ferrenuestro | Teclear el comprobante no basta: hay que fijar `ionInput.value = input.value` y emitir `input`/`keyup`/`ionInput`/`ionChange`/`blur`/`ionBlur`. Recién ahí `Fecha Comp Ret`, `Monto retenido IVA` e `ISLR` pasan a `disabled=false`. |
| **El control de IGTF vive en el Tab DOCUMENTOS** | cliente difranca | 2.º `ion-select` de `app-cobro-documents` (el 1.º es Moneda Documento): opciones `IGTF 0% - 0%` (default, coherente con `igtfDefault=false`) e `IGTF%3 - 3%`; su `value` es `{idIgtf, naIgtf, price, descripcion, defaultIgtf}`. Al lado, toggle **`Pago separado IGTF`** (default `false` = IGTF embebido). |
| **Cambio de empresa (gateway) sin limpiar caché** | reconfirma jerez | Asignar el **objeto opción completo** al 1.er `ion-select` de `app-cobro-general` + `ionChange` → alert `[Cancelar, Aceptar]` "Se ha detectado cambio del empresa…" → Aceptar recarga la cartera. El `value` es el objeto empresa entero: la receta `s.value=<number>` **rompería el form**. |
| **La moneda del cobro depende de la EMPRESA** | cliente difranca | DDHP_A12 ofrece `BSD / US$`; DIF_A12 ofrece `BSD / USD`. Para ejercitar `USD` (id 3) **hay que pasar por DIF_A12**; no está disponible desde DDHP_A12. Anotar siempre el `co_currency`, nunca el rótulo. |
| **Los alerts de éxito llegan DIFERIDOS** | cliente difranca | "Cobro nro. X enviado exitosamente" puede aparecer **varios minutos después**, apilado sobre el alert de la acción siguiente. Un envío que muestra 1 alerta en vez de 3 **no significa que falló** — cotejar en BD, y drenar alerts al inicio de cada cobro. |
| **Tabla local `document_sales` usa `co_document`** | universal | No `co_document_sale` (ése es el nombre de la **nube**). Igual `collection_detail` (nube) vs `collection_details` (local), y en nube la columna es `co_document`. Un nombre errado aborta la transacción `sqlitePlugin` en silencio. |
| **Oráculo de lista barato** | reconfirma difranca-20260807 | `ng.getComponent(document.querySelector('app-cobros-list'))` → `filteredItems 118` / `displayedItems 20` / `pageSize 20`. |
