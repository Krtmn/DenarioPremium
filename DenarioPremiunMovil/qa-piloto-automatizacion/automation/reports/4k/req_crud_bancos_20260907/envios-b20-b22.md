# B-20 · B-21 · B-22 — Envío de cobros y cotejo en las 3 capas

**Cliente:** IMPORTADORA 4K (`4k`) · **Playa:** CARIBE (`denariocaribe.ddns.net`) · **Vendedor:** `v.0002ZONACENTRAL` (ANGEL BETANCOURT)
**Fecha:** 2026-09-07 · **Empresa:** GRUPO 4K (`DIESE`) · **Tasa del día:** 870,00 Bs = 1 USD

---

## ⚠ Lo que salió distinto de lo planificado (leer antes de la tabla)

**B-21 se hizo con OTRO cliente: `C.0028` INVERSIONES MOSTEIRO, no `C.0010`.**
Después de enviar B-20 (Ref 2619), el Tab Documentos de **C.0010 quedó en «No hay documentos»** — con
las 11 facturas con saldo presentes en la BD local del equipo.

Causa medida (no es un defecto):

```sql
-- todas las facturas de C.0010 quedaron con st_document = 2 (bloqueado)
SELECT d.nu_document, d.nu_balance, ds.st_document
FROM document_sales d LEFT JOIN document_st ds ON d.co_document = ds.co_document
WHERE d.co_client='C.0010';   -- 11 filas, las 11 con st_document = 2
```

La consulta del Tab Documentos filtra por `ds.st_document < 2`
(`collection-logic.service.ts:6131`), y `lockDocumentSales` (`:5542`) bloquea toda factura que ya
esté en un cobro **enviado y pendiente de aprobación** (`st_collection IN (1,3)`). Las 11 facturas de
C.0010 están en los cobros QA **2609, 2611, 2615, 2616, 2619** — todos en estado **«Por aprobar»**.
⇒ **Comportamiento correcto** (evita cobrar dos veces la misma factura), pero **agota el cliente de
prueba**: mientras nadie apruebe o rechace esos cobros en el ERP, C.0010 no sirve para cobros con
documentos. Se sincronizó desde HOME y **no se desbloquea** (la sync no cambia el estado).

Consecuencia práctica: B-20 y B-22 son sobre C.0010 (B-22 es anticipo, no necesita documentos);
**B-21 es sobre C.0028**. Eso no invalida el caso —lo que B-21 prueba es «Nueva Cuenta»— pero hay que
saberlo al leer la tabla. Efecto lateral útil: C.0028 **no tiene cuentas bancarias cargadas**, así que
su picker de Banco Emisor ofrece **solo «Nueva Cuenta»**, que es exactamente el caso a probar.

Todo lo demás salió limpio: **los 3 envíos llegaron con HTTP 200 al primer intento.** No hubo
HTTP 500 (el fallo que bloqueó la corrida del 04/09 no reprodujo).

---

## Tabla de evidencia

| Nro Ref | Caso | Emisor / cuenta elegido (móvil) | Nube | Web | Veredicto |
|---|---|---|---|---|---|
| **2619** | **B-20** · Transferencia · cuenta existente | Emisor **PROVINCIAL – 01080011223344556677** (`QA-CTA-002`) · Receptor PROVINCIAL – 01080087100100179088 · Ref `QAB20TRF001` · 373.230,00 Bs | `co_payment_method='tr'` · `nu_client_bank_account='01080011223344556677'` · `co_client_bank_account='108'` · `nu_bank_account='01080087100100179088'` · `na_bank='PROVINCIAL'` · `na_client_bank_account=**NULL**` · `nu_amount_partial=373230` | 11 col · Banco Emisor **PROVINCIAL** · **Cuenta = 01080011223344556677** · Banco receptor PROVINCIAL · Nro Doc `QAB20TRF001` · 373.230,00 Bs / 429,00 USD | ✅ **PASS** |
| **2620** | **B-21** · Transferencia · «Nueva Cuenta» | Emisor **Nueva Cuenta** + cuenta tecleada **01750099887766554433** · Receptor BANESCO EN BOLIVARES – 01340416084161017411 · Ref `QAB21NUEVACTA` · 61.770,00 Bs | `co_payment_method='tr'` · `nu_client_bank_account='01750099887766554433'` · `co_client_bank_account='Nueva Cuenta'` · `nu_bank_account='01340416084161017411'` · `na_bank='BANESCO EN BOLIVARES'` · `na_client_bank_account=**NULL**` · `nu_amount_partial=61770` | 11 col · Banco Emisor **«Nueva cuenta»** (en **rojo**, resaltado a propósito) · **Cuenta = 01750099887766554433** · Banco receptor BANESCO EN BOLIVARES · 61.770,00 Bs / 71,00 USD | ✅ **PASS** |
| **2621** | **B-22** · ANTICIPO (`co_type=1`) · Transferencia | Emisor **BANESCO PANAMA – 01020304050607080910** (`QA-CTA-001`) · Receptor BANCAMIGAA – 01720110711109835320 · Ref `QAB22ANTICIPO` · 1.000,00 Bs | `collection.co_type=**1**` · `co_payment_method='tr'` · `nu_client_bank_account='01020304050607080910'` · `co_client_bank_account='232'` · `nu_bank_account='01720110711109835320'` · `na_bank='BANCAMIGAA'` · `na_client_bank_account=**NULL**` · `nu_amount_partial=1000` | 11 col · Tipo de Cobro **«Anticipo/Prepago»** · Banco Emisor **BANESCO PANAMA** · **Cuenta = 01020304050607080910** · Banco receptor BANCAMIGAA · **sin bloque «Documentos Pagados»** (correcto) · 1.000,00 Bs / 1,15 USD | ✅ **PASS** |

**Acuse del servidor (capa nube, hook sobre `Capacitor.nativePromise`):** los tres devolvieron
`HTTP 200` con `errorCode "000"` desde
`…/PremiumWS/services/collectionservice/collection` y `collectionId` 2619 / 2620 / 2621.
Local: `st_delivery=1`, `id_collection>0`, `pending_transactions=0`, `failed_transactions=0` ⇒ **BD-OK**.

---

## H2 — ¿se llena «Cuenta» cuando hay cuenta real?

### 🟢 **Sí. En Transferencia la columna «Cuenta» trae el número de cuenta elegido, en los 3 cobros.**

| Ref | Método | Banco Emisor (web) | **Cuenta** (web) | Banco receptor (web) |
|---|---|---|---|---|
| 2619 | Transferencia (cuenta existente) | PROVINCIAL | `01080011223344556677` | PROVINCIAL |
| 2620 | Transferencia (Nueva Cuenta) | Nueva cuenta | `01750099887766554433` | BANESCO EN BOLIVARES |
| 2621 | Transferencia (anticipo) | BANESCO PANAMA | `01020304050607080910` | BANCAMIGAA |
| 2617 | Pago Móvil | BANCO MERCANTIL | *(vacía)* | PROVINCIAL |
| 2618 | Cheque | *(vacía)* | *(vacía)* | BANCO DE VENEZUELA |

### 🔴 Hay que **corregir el enunciado de H2** en el guión

El guión dice: *«`na_client_bank_account` está NULL en las 2.518 filas ⇒ la columna sale vacía siempre»*.
**Eso es falso.** `na_client_bank_account` sigue **NULL** en los tres cobros nuevos, y sin embargo la
columna «Cuenta» se llena ⇒ **la web NO lee `na_client_bank_account`; lee `nu_client_bank_account`.**

Lo que queda vivo de H2 es **solo la mitad cosmética**: la columna «Cuenta» **se dibuja igual en Pago
Móvil y en Cheque**, donde no hay cuenta que mostrar, y ahí sí sale vacía. Severidad **baja** — no hay
pérdida de dato, es una columna de más.

## H3 — ¿el emisor se guarda en el campo del receptor?

### 🟢 **NO reproduce en Transferencia.** 🔴 **Sigue abierto en Cheque.**

La prueba está en 2620 y 2621, donde **emisor y receptor son bancos DISTINTOS** (en 2619 los dos eran
PROVINCIAL y el caso no discriminaba):

- **2620** — emisor «Nueva Cuenta», receptor BANESCO EN BOLIVARES ⇒ `na_bank='BANESCO EN BOLIVARES'` = **el receptor**. Correcto.
- **2621** — emisor BANESCO PANAMA, receptor BANCAMIGAA ⇒ `na_bank='BANCAMIGAA'` = **el receptor**. Correcto.
- El emisor viaja en sus propios campos (`nu_collection_payment` + `nu_client_bank_account` + `co_client_bank_account`) y la web lo pinta bien.

**Cheque (2618) sí lo sufre:** `na_bank='BANCO DE VENEZUELA'` es el banco que el usuario eligió como
**Emisor**, y en la web «Banco Emisor» sale **vacío** mientras «Banco receptor» muestra ese banco.
Cheque no tiene campo de receptor en la UI, así que el emisor se cuela en el del receptor.
⇒ **H3 es un defecto acotado a Cheque**, no del módulo de bancos en general.

## H4 — «el APK dejó de escribir `nu_collection_payment` en Pago Móvil»

**NO reproduce.** En 2617 (Pago Móvil de hoy) `nu_collection_payment='BANCO MERCANTIL'` está escrito, y
la web muestra **Banco Emisor = BANCO MERCANTIL** correctamente. La inferencia del 04/09 queda **cerrada**.

---

## Columnas de la tabla «Tipos de Pago»

| Método | Columnas | Detalle |
|---|---|---|
| Pago Móvil (2617) | **13** | agrega `Tipo Documento` y `Nº teléfono` |
| Cheque (2618) | **11** | |
| **Transferencia (2619 / 2620 / 2621)** | **11** | mismas 11 que Cheque: N° · Forma de pago · Banco Emisor · Cuenta · Banco receptor · Numero de Cuenta · Fecha valor · Nro Documento · Fecha documento · Monto cobrado · Monto conv. |

## Montos — los tres cuadran

| Ref | Monto cobrado | Σ pagos | Total por cobrar | Diferencia | Monto / Tasa | Monto conv. |
|---|---|---|---|---|---|---|
| 2619 | 373.230,00 Bs | 373.230,00 | 373.230,00 Bs | **0,00** ✅ | 373.230 / 870 = 429,00 | **429,00 USD** ✅ |
| 2620 | 61.770,00 Bs | 61.770,00 | 61.770,00 Bs | **0,00** ✅ | 61.770 / 870 = 71,00 | **71,00 USD** ✅ |
| 2621 | 1.000,00 Bs | 1.000,00 | 1.000,00 Bs (anticipo) | **0,00** ✅ | 1.000 / 870 = 1,1494 | **1,15 USD** ✅ (redondeo a 2 dec.) |

`Base − descuento + IGTF = Total a pagar` también cierra: descuento 0,00 e IGTF 0,00 en los tres
(`userCanSelectIGTF=false` en 4K), y `Monto total base = Total Monto a pagar` en 2619 y 2620.
El anticipo (2621) no imprime el bloque de totales por documento — imprime `Monto pagado: 1.000,00 Bs`
y `Monto pagado conversión: 1,15 USD`. Coherente con `co_type=1`.

---

## Observaciones sueltas (no defectos)

- **«Nueva cuenta» se pinta en ROJO y negrita** en la columna Banco Emisor de la web. Distingue de un
  vistazo la cuenta tecleada a mano de la cuenta del catálogo del cliente. Está bien resuelto.
- **El filtro por moneda sigue asimétrico** (hallazgo B-16, reconfirmado hoy en la misma pantalla):
  con el cobro en **Bs**, el **Banco Receptor** listó solo las 3 cuentas de la empresa en Bs, mientras
  el **Banco Emisor** listó las 3 cuentas del cliente **mezclando USD y Bs** (BANESCO PANAMA USD,
  PROVINCIAL Bs, BANESCO CUENTA VERDE USD). El anticipo 2621 se cobró en Bs contra una cuenta emisora
  en USD sin que la app dijera nada.
- Los 3 cobros quedan en estado **«Por aprobar»** en la web. Mientras sigan así, **bloquean sus
  facturas** (ver el aviso del principio).

## Capturas · `img/`

| Archivo | Capa |
|---|---|
| `B20-movil-picker-emisor.png` | móvil — picker Banco Emisor con las 3 cuentas `QA-CTA-*` |
| `B20-movil-pagos.png` | móvil — pantalla de Pagos antes de Enviar |
| `B20-web-2619-tipos-de-pago.png` | web — tabla Tipos de Pago |
| `B21-movil-emisor-nueva-cuenta.png` | móvil — Banco Emisor «Nueva Cuenta» + campo tecleado |
| `B21-movil-pagos.png` | móvil — pantalla de Pagos antes de Enviar |
| `B21-web-2620-tipos-de-pago.png` | web — tabla Tipos de Pago («Nueva cuenta» en rojo) |
| `B22-movil-pagos.png` | móvil — cabecera «Anticipo», Pagos antes de Enviar |
| `B22-web-2621-tipos-de-pago.png` | web — tabla Tipos de Pago (sin Documentos Pagados) |

La **capa nube no tiene captura**: es salida de `automation/db/query.js`, y va transcrita literal abajo.

```
$ node automation/db/query.js 4k "SELECT id_collection, co_payment_method, id_bank, na_bank,
  nu_collection_payment, co_client_bank_account, nu_client_bank_account, na_client_bank_account,
  nu_amount_partial, nu_amount_partial_conversion, nu_bank_account, nu_payment_doc
  FROM collection_payment WHERE id_collection IN (2619,2620,2621) ORDER BY id_collection"

 id_collection | 2619                 | 2620                   | 2621
 co_payment_method            | tr     | tr                     | tr
 id_bank                      | 4      | 7                      | 8
 na_bank                      | PROVINCIAL | BANESCO EN BOLIVARES | BANCAMIGAA
 nu_collection_payment        | 01080011223344556677 | 01750099887766554433 | 01020304050607080910
 co_client_bank_account       | 108    | Nueva Cuenta           | 232
 nu_client_bank_account       | 01080011223344556677 | 01750099887766554433 | 01020304050607080910
 na_client_bank_account       | NULL   | NULL                   | NULL
 nu_amount_partial            | 373230.0000 | 61770.0000        | 1000.0000
 nu_amount_partial_conversion | 429.0000    | 71.0000           | 1.1500
 nu_bank_account              | 01080087100100179088 | 01340416084161017411 | 01720110711109835320
 nu_payment_doc               | QAB20TRF001 | QAB21NUEVACTA     | QAB22ANTICIPO
```
