# Capa WEB — smoke el_valle · RUN_ID `20260728_130612_smoke-completo`

**Playa:** `la_tortuga` → `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Empresa confirmada:** `PROCESADORA DE ALIMENTOS COVADONGA,C.A` (guarda de playa OK — sin rastro de CAPITALINA)
**Modo:** READ-ONLY. Solo se tocaron `Consultar` por fila y `Buscar` de filtros. Cero escrituras.
**Tasa del día:** `725,7500 BS = 1 USD` (confirmada en los 4 cobros, `collection.nu_value_local`)
**Fecha del cotejo:** 2026-07-28

> ⚠ **Dirección de la conversión.** En esta playa la web muestra el monto en **USD** y su conversión en **BS**,
> con tasa `725,75 BS = 1 USD`. El oráculo real es **`monto × tasa == monto_conv`**, no `monto / tasa`.
> `verificarConversion()` de `web-helpers.js` implementa la división → **da falso negativo aquí**.
> Toda la aritmética de este reporte se hizo explícita para no depender de ese helper.

---

## 1. Cobros (Grupo B — cotejo BD ↔ web, sin manifiesto móvil)

Los 4 cobros del día llegaron a la nube y **los 4 aparecen en la web**. La lista inicial solo traía 119 y 120
(estaba cacheada de antes de que se crearan 121/122); un `Buscar` los trajo a los 4 sin espera adicional.

Consulta base:
`SELECT id_collection, co_type, co_client, nu_amount_total, nu_amount_igtf, st_collection, da_collection FROM collection WHERE da_collection >= '2026-07-28'`

**Estatus:** los 4 tienen `st_collection = 3` y la web los muestra como **"Por aprobar"**
(confirmado: `st_collection=3` **NO** es "Rechazado" — el catálogo `statuses` no aplica aquí).

### DW-COB-001 · Ref **119** — Anticipo/Prepago · `WEB-OK`

| Campo | BD | Web (lista / detalle) | |
|---|---|---|---|
| co_type | `1` | Tipo de Cobro: **Anticipo/Prepago** | ✅ |
| Cliente | `J309901710` / ABASTOS Y CARNICERIA HERMANOS FLORES CA | ídem | ✅ |
| Monto total | `20.0000` | Monto cobrado `20,0000 USD` | ✅ |
| Conversión | `14515.0000` | Monto conv. `14.515,0000 BS` | ✅ |
| Fecha | `2026-07-28T19:53:48Z` | `28/07/2026 15:53:48` | ✅ mismo día (UTC-4, nota) |
| Estatus | `st_collection=3` | **Por aprobar** | ✅ |
| Responsable / Comentario | `gv` / `gv` | `gv` / `gv` | ✅ |
| Documentos | **0 filas** en `collection_detail` | detalle **sin tabla de documentos** | ✅ |
| Pagos | 1 fila `ef` `20.0000` | Efectivo · `20,0000 USD` · `14.515,0000 BS` | ✅ |
| Depósito | `id_deposit = 1` | columna Depósito → **"Consultar Depósito"** | ✅ enlace cruzado |

**Cálculos verificados**
- Anticipo sin documentos: `collection_detail` = 0 filas ⇒ el detalle web **no renderiza** la tabla de documentos. Comportamiento correcto para `co_type=1`.
- `Monto pagado == Σ pagos` → `20,0000 == 20,0000` ✅
- `Diferencia cobro == Total por cobrar − Monto cobrado` → `0,0000 == 20,0000 − 20,0000` ✅
- Conversión → `20,00 × 725,75 = 14.515,00` vs web `14.515,0000 BS` ✅ (Δ = 0)

> El detalle de un anticipo usa la etiqueta **`Monto pagado:`**, no `Total Monto a pagar:` (que es la de los cobros con documentos).

### DW-COB-002 · Ref **120** — Cobro con documentos · `WEB-OK`

| Campo | BD | Web | |
|---|---|---|---|
| Cliente | `J503205776` / BODEGÓN CARIBE´S 100, C. A | ídem | ✅ |
| Monto total / final | `472.9000` / `472.9000` | Total Monto a pagar `472,9000 USD` | ✅ |
| Conversión | `343207.1750` | `343.207,1750 BS` | ✅ |
| Comentario | `Asd` | `Asd` | ✅ |
| Responsable | `""` (vacío) | `""` | ✅ (vacío en origen → se saltea) |
| Coordenada | `10.4906068,-66.8556965` | Ubicación `10.4906068,-66.8556965` | ✅ |
| Fecha | `2026-07-28T20:11:25Z` | `28/07/2026 16:11:25` | ✅ mismo día |

**Documento** (`collection_detail` id 90) — tabla `form:documentosPagadosDT`

| Campo | BD | Web | |
|---|---|---|---|
| co_document | `P00003665` | Nro Factura `P00003665` | ✅ |
| da_document | `2026-05-21` | Fecha documento `21/05/2026` | ✅ |
| co_type_doc | `A` | Tipo documento `A` | ✅ |
| in_payment_partial | `false` | Pago parcial `NO` | ✅ |
| nu_amount_doc | `472.9000` | Monto doc `472,9000` | ✅ |
| nu_balance_doc | `472.9000` | Saldo doc. `472,9000` | ✅ |
| nu_amount_paid | `472.9000` | Monto a pagar `472,9000` | ✅ |
| retenciones | `0` / `0` | Retención IVA `0,0000` · ISLR `0,0000` | ✅ |

**Pago** (`collection_payment` id 116): `ef` `472.9000` → Efectivo · `472,9000 USD` · `343.207,1750 BS` ✅

**Cálculos verificados**
- `Total Monto a pagar == Σ pagos` → `472,9000 == 472,9000` ✅
- `Diferencia cobro == Total por cobrar − Monto cobrado` → `0,0000 == 472,9000 − 472,9000` ✅
- Conversión cabecera → `472,90 × 725,75 = 343.207,175` vs `343.207,1750` ✅
- Conversión documento → `472,90 × 725,75 = 343.207,175` vs `343.207,1750` (monto y saldo) ✅
- Totales: `base 472,90 − dcto 0,00 + IGTF 0,00 = 472,90` == Total Monto a pagar ✅

### DW-COB-003 · Ref **121** — Cobro con documentos, retenciones y pago móvil · `WEB-OK`

| Campo | BD | Web | |
|---|---|---|---|
| Cliente | `J404786856` / ARMAS DEL ROSARIO, C.A | ídem | ✅ |
| Monto total / final | `50.0000` | Total Monto a pagar `50,0000 USD` | ✅ |
| Conversión | `36287.5000` | `36.287,5000 BS` | ✅ |
| Responsable / Comentario | `gv` / `gv` | `gv` / `gv` | ✅ |
| Coordenada | `11.0490638,-63.8649777` | ídem | ✅ |
| Fecha | `2026-07-28T21:54:39Z` | `28/07/2026 17:54:39` | ✅ mismo día |

**Documento** (`collection_detail` id 91)

| Campo | BD | Web | |
|---|---|---|---|
| co_document | `P00004427` | `P00004427` | ✅ |
| da_document | `2026-06-29` | `29/06/2026` | ✅ |
| in_payment_partial | `true` | Pago parcial `SI` | ✅ |
| nu_amount_doc / nu_balance_doc | `158.5600` / `158.5600` | `158,5600` / `158,5600` | ✅ |
| nu_amount_paid | `50.0000` | Monto a pagar `50,0000` | ✅ |
| nu_voucher_retention | `12345678912345` | Doc Retención `12345678912345` | ✅ |
| da_voucher | `2026-07-21` | Fecha Comprobante `21/07/2026` | ✅ |
| **nu_amount_retention_iva** | `5.000000` | **Retención IVA `5,0000`** | ✅ |
| **nu_amount_retention_islr** | `10.000000` | **Retención ISLR `10,0000`** | ✅ |

**Pago** (`collection_payment` id 117) — la tabla de pagos **cambia de columnas** según la forma de pago:

| Campo | BD | Web | |
|---|---|---|---|
| co_payment_method | `pm` | Forma de pago **Pago Movil** | ✅ |
| na_bank | `MONAGAS Y DELTA AMACURO-*CTA BANCO DE VENEZUELA **6900` | ídem (Banco receptor) | ✅ |
| nu_bank_account | `01020655340000676900` | Numero de Cuenta ídem | ✅ |
| nu_client_bank_account | `ACCIONISTAS` | Banco Emisor `ACCIONISTAS` | ✅ |
| id_type_document=1 + nu_document | `298654123` | Tipo Documento `V - 298654123` | ✅ |
| id_code_phone_number=3 + nu_phone_number | `7898625` | Nº teléfono `0412 - 7898625` | ✅ |
| nu_payment_doc | `123456` | Referencia `123456` | ✅ |
| nu_amount_partial | `50.0000` | Monto cobrado `50,0000 USD` | ✅ |

**Cálculos verificados**
- `Total Monto a pagar == Σ pagos` → `50,0000 == 50,0000` ✅
- `Diferencia cobro == 50,0000 − 50,0000 = 0,0000` ✅
- Conversión doc → `158,56 × 725,75 = 115.074,92` vs `115.074,9200` ✅
- Conversión ret. IVA → `5,00 × 725,75 = 3.628,75` vs `3.628,7500` ✅
- Conversión ret. ISLR → `10,00 × 725,75 = 7.257,50` vs `7.257,5000` ✅
- Conversión pagado → `50,00 × 725,75 = 36.287,50` vs `36.287,5000` ✅
- **Nota de negocio (no defecto):** `158,56 − 5,00 − 10,00 = 143,56 ≠ 50,00`. No aplica el neto porque el documento está marcado **pago parcial = SI**; el abono fue 50,00 y el saldo queda vivo.

### DW-COB-004 · Ref **122** — **Retención** · `WEB-CALC-MISMATCH`

Es el caso más rico y nunca antes cotejado. **Todos los campos base cuadran.** El defecto está en **un derivado de la cabecera del detalle.**

| Campo | BD | Web | |
|---|---|---|---|
| co_type | `2` | Tipo de Cobro **Retención** | ✅ |
| Cliente | `J408621282` / COMERCIALIZADORA J.R MALAVE ANUEL, C.A | ídem | ✅ |
| Responsable / Comentario | `gv` / `gv` | `gv` / `gv` | ✅ |
| Fecha | `2026-07-28T21:56:25Z` | `28/07/2026 17:56:25` | ✅ mismo día |
| Estatus | `3` | **Por aprobar** | ✅ |
| Pagos | **0 filas** en `collection_payment` | tabla de pagos: *"No se encontraron registros."* | ✅ |

**Documento** (`collection_detail` id 92)

| Campo | BD | Web | |
|---|---|---|---|
| co_document | `O00010814` | `O00010814` | ✅ |
| da_document | `2024-12-05` | `05/12/2024` | ✅ |
| nu_amount_doc | `108605.0700` | Monto doc `108.605,0700` | ✅ |
| nu_balance_doc | `504.4200` | Saldo doc. `504,4200` | ✅ |
| nu_amount_paid | `12.0000` | Monto a pagar `12,0000` | ✅ |
| nu_voucher_retention | `88888888888888` | Doc Retención `88888888888888` | ✅ |
| da_voucher | `2026-07-06` | Fecha Comprobante `06/07/2026` | ✅ |
| **nu_amount_retention_iva** | `10.000000` | **Retención IVA `10,0000`** | ✅ |
| **nu_amount_retention_islr** | `2.000000` | **Retención ISLR `2,0000`** | ✅ |

**Cálculos verificados**
- **Oráculo de retención — CUADRA:** `Retención IVA + Retención ISLR == Monto a pagar del documento`
  → `10,0000 + 2,0000 = 12,0000` == `12,0000` == `collection.nu_amount_total` (`12.0000`) ✅
- Conversión monto doc → `108.605,07 × 725,75 = 78.820.129,5525` vs `78.820.129,5525` ✅
- Conversión saldo doc → `504,42 × 725,75 = 366.082,815` vs `366.082,8150` ✅
- Conversión ret. IVA → `10,00 × 725,75 = 7.257,50` vs `7.257,5000` ✅
- Conversión ret. ISLR → `2,00 × 725,75 = 1.451,50` vs `1.451,5000` ✅
- Conversión total (lista) → `12,00 × 725,75 = 8.709,00` vs `8.709,0000 BS` ✅
- `Monto total base` de la cabecera usa el **saldo** (`504,4200`), no el monto del documento (`108.605,07`). Consistente con `nu_balance_doc`. **Nota, no defecto** — en 120 y 121 saldo == monto, así que este cobro es el que revela la regla.

#### 🔴 Discrepancia — `Total Monto a pagar` de la cabecera del detalle

| Fuente | Valor |
|---|---|
| BD `collection.nu_amount_total` | `12.0000` |
| BD `collection.nu_amount_final` | `12.0000` |
| BD `collection.nu_amount_total_conversion` | `8709.0000` |
| Web — **lista** de cobros, `Total por cobrar` | `12,0000 USD` ✅ |
| Web — **lista**, `Monto conv.` | `8.709,0000 BS` ✅ |
| Web — **detalle**, línea del documento, `Monto a pagar` | `12,0000` ✅ |
| Web — **detalle**, cabecera, **`Total Monto a pagar`** | **`0,0000 USD`** ❌ |
| Web — **detalle**, cabecera, **`Total Monto a pagar conversión`** | **`0,0000 BS`** ❌ |

**Por qué es un defecto y no comportamiento esperado.** En los otros tres cobros ese campo reproduce
exactamente `nu_amount_final`:

| Ref | `nu_amount_final` (BD) | campo de cabecera en el detalle |
|---|---|---|
| 119 | `20.0000` | `Monto pagado: 20,0000 USD` ✅ |
| 120 | `472.9000` | `Total Monto a pagar: 472,9000 USD` ✅ |
| 121 | `50.0000` | `Total Monto a pagar: 50,0000 USD` ✅ |
| **122** | **`12.0000`** | **`Total Monto a pagar: 0,0000 USD`** ❌ |

La cabecera del detalle parece calcular **`Σ pagos`** en vez de leer `nu_amount_final`. En un cobro tipo
**Retención no hay filas de pago** (la deuda se salda con las retenciones), así que la suma da 0 y el campo
queda en cero, **contradiciendo a la propia lista, a la línea del documento y a la BD**.

**Impacto:** un usuario que abra el detalle de un cobro por retención lee «Total Monto a pagar: 0,00»
y concluye que el cobro no tiene importe. El dato correcto (12,00) sí está visible en la lista y en la línea.

**Veredicto:** `WEB-CALC-MISMATCH` — campos base OK, derivado de cabecera incorrecto para `co_type = 2`.

---

## 2. Devoluciones — DW-DEV-001 · Ref **177** (móvil DM-DEV-018) · `WEB-OK`

⚠ Devoluciones **no expone montos** ni en lista ni en detalle → no se aplicó ningún oráculo de importes.

| Campo (manifiesto `datos`) | Móvil | Web | |
|---|---|---|---|
| cliente | `ARMAS DEL ROSARIO, C.A` | Nombre del cliente ídem (`J404786856`) | ✅ |
| tipo | `Calidad` | Tipo de devolución `Calidad` | ✅ |
| precinto | `PRE-20260728` | Precinto `PRE-20260728` | ✅ |
| responsable | `QA AUTOMATIZACION` | Responsable `QA AUTOMATIZACION` | ✅ |
| observaciones | `Devolucion QA smoke el_valle 20260728` | Observaciones ídem | ✅ (ver Patrones nuevos) |
| — | epoch `1785269255502` → `20:07:35Z` | Fecha devolución `28/07/2026 16:07:35` | ✅ mismo día (UTC-4) |
| — | — | Estatus **Enviado** | ✅ |
| — | — | Empresa COVADONGA | ✅ |

**Línea 1** (`form:j_idt170`)

| Campo | Móvil | Web | |
|---|---|---|---|
| cod | `C0051` | Cod. producto `C0051` (ALAS DE POLLO) | ✅ |
| cantidad | `2` | Cantidad `2` | ✅ |
| lote | `LOTE-QA-728` | Lote `LOTE-QA-728` | ✅ |
| nro_factura | `P00004560` | N° Factura `P00004560` | ✅ |
| fecha_venc | `2026-12-31` | Fecha vencimiento `31/12/2026` | ✅ |
| unidad | `PZA` | Devolución en `PZA` | ✅ |
| motivo | `Empaque Sucio (Inocuidad)` | Motivo `Empaque Sucio (Inocuidad)` | ✅ |

`cotejarCampos` → 0 diffs. **7 campos de cabecera + 7 de línea cotejados.**

---

## 3. Inventarios — DW-INV-001 · Ref **2** (móvil DM-INV-022) · `WEB-OK`

| Campo | Móvil | Web | |
|---|---|---|---|
| epoch | `1785271152995.0` | Código inventario `1785271152995.0` | ✅ |
| cliente / co_client | ABASTOS Y CARNICERIA HERMANOS FLORES CA / `J309901710` | ídem | ✅ |
| fecha | epoch → `20:39:12Z` | `28/07/2026 16:39:12` | ✅ mismo día (UTC-4) |
| coordenada | `11.049058,-63.8649836` | `11.049058,-63.8649836` (en el HTML del mapa) | ✅ (ver Patrones nuevos) |
| comentario | `null` | — | ⏭ vacío en origen, se saltea |
| — | — | Empresa COVADONGA · Estatus Enviado | ✅ |

**Línea 1** (`form:pedidosDT` del detalle) — cantidades separadas por ubicación, como pide el oráculo:

| Campo | Móvil | Web | |
|---|---|---|---|
| cod / producto | `C0051` / ALAS DE POLLO | ídem | ✅ |
| **deposito** | `0` | Depósito `-` | ✅ (cero → guion) |
| **exhibicion** | `5` | Exhibición `5.00 PIEZA` | ✅ |
| ubicacion | `exh` | cantidad cargada en la columna **Exhibición**, no en Depósito | ✅ |
| lote | `LOTE-QA-INV728` | Lote `LOTE-QA-INV728` | ✅ |
| fecha_exp | `2026-12-31T04:00:00` | Fecha expiración `31/12/2026 00:00:00` | ✅ mismo día |
| unidad | `PZA-C0051` | `PIEZA` | ℹ️ la web muestra el **nombre** de la unidad, el móvil el **código** — no comparable, nota |

`Ver Pedido Relacionado` está presente como enlace pero **vacío**: este inventario no nació de un pedido. Coherente.

---

## 4. Depósitos — DW-DEP-001 · Ref **1** (móvil DM-DEP-017) · `WEB-OK`

| Campo | Móvil / BD | Web | |
|---|---|---|---|
| co_bank | `1101003` | Banco `1101003` | ✅ |
| nu_account | `01050046031046809555` | N° cuenta `01050046031046809555` | ✅ |
| nro_planilla | `DEP-QA-0728` | N° Planilla `DEP-QA-0728` | ✅ |
| fecha planilla | `2026-07-28` | Fecha de planilla `28/07/2026 00:00:00` | ✅ |
| monto_depositado | `20` | Monto depositado `20,0000 USD` | ✅ |
| moneda | `USD` | `USD` | ✅ |
| conversión | `14515.0000` | `14.515,0000 BS` (lista) | ✅ |
| fecha depósito | `2026-07-28T21:04:04Z` | `28/07/2026 17:04:04` | ✅ mismo día (UTC-4) |
| — | — | Empresa COVADONGA · Estatus Enviado | ✅ |

> El móvil manda el banco como nombre (`BANCO MERCANTIL COVADONGA**9555 NUEVO`) y la web muestra el **código** (`1101003`),
> que es exactamente el `co_bank` del manifiesto. Coinciden por código.

**Tabla hija — cobros que componen el depósito** (`form:j_idt164`)

| N° | Fecha del cobro | N° Ref cobro | Cliente | Forma de pago | Monto cobrado | Monto conv. |
|---|---|---|---|---|---|---|
| 1 | 28/07/2026 | **119** | ABASTOS Y CARNICERIA HERMANOS FLORES CA | Efectivo | 20,0000 USD | 14.515,0000 BS |

**Cálculos verificados**
- **`Σ(cobros hijos) == Monto depositado`** → `20,0000 == 20,0000` ✅ (`verificarSuma`, 1 hijo)
- Conversión → `20,00 × 725,75 = 14.515,00` vs `14.515,0000 BS` ✅
- **Enlace cruzado íntegro en ambos sentidos:** el depósito 1 lista el cobro **119**, y la fila 119 de la lista
  de cobros muestra **"Consultar Depósito"**. Es exactamente el vínculo que declaró el móvil.

---

## 5. Pedidos — DW-PED-001 · Ref **437** (móvil DM-PED-031) · `WEB-OK` (re-confirmado)

| Campo | Móvil | Web | |
|---|---|---|---|
| epoch | `1785262080793.0` | Código pedido `1785262080793.0` | ✅ |
| cliente / co_client | ABASTOS Y CARNICERIA HERMANOS FLORES CA / `J309901710` | ídem (Rif cliente `J309901710`) | ✅ |
| empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A | ídem | ✅ |
| comentario | `Test-PED-SMOKE-141457` | Comentario ídem | ✅ |
| condicion_pago | `CodContado` | Condicion de pago **CONTADO** | ✅ |
| da_dispatch | `2026-07-30T04:00:00` | Fecha de despacho `30/07/2026` | ✅ |
| moneda | `USD` | montos en `USD` | ✅ |
| nu_details | `2` | Total items `2` · 2 filas en el detalle | ✅ |
| st_order | `1` | Estatus **Enviado** · ¿Por Aprobar? `NO` | ✅ |
| monto_base / total / final | `30` / `30` / `30` | Monto Base `30,0000` · Monto Total `30,0000` | ✅ |
| almacen | `010` | `PRODUCTO TERMINADO (EMBUTIDOS)` | ℹ️ código vs nombre — nota |
| tasa | `null` | `725,7500` | ⏭ vacío en origen, se saltea |

**Líneas**

| # | cod | producto | cantidad | precio | subtotal | precio conv. | subtotal conv. |
|---|---|---|---|---|---|---|---|
| 1 | C0051 | ALAS DE POLLO | 2 PIEZA | 4,8000 USD | 9,6000 USD | 3.483,6000 BS | 6.967,2000 BS |
| 2 | C0003 | COSTILLA CHINA DE CERDO | 3 PIEZA | 6,8000 USD | 20,4000 USD | 4.935,1000 BS | 14.805,3000 BS |

Ambas cuadran con el manifiesto (`cod`, `cantidad`, `precio`, `monto`).

**Cálculos verificados**
- Línea 1: `2 × 4,80 = 9,60` == subtotal `9,6000` ✅
- Línea 2: `3 × 6,80 = 20,40` == subtotal `20,4000` ✅
- **`Σ(líneas) == Monto Total`** → `9,60 + 20,40 = 30,00` == `30,0000 USD` ✅
- `Subtotal bruto 30,00 − Descuento bonif. 0,00 = Monto Base 30,00` ✅
- Conversión total → `30,00 × 725,75 = 21.772,50` vs `21.772,5000 BS` ✅
- Conversión línea 1 → precio `4,80 × 725,75 = 3.483,60` ✅ · subtotal `9,60 × 725,75 = 6.967,20` ✅
- Conversión línea 2 → precio `6,80 × 725,75 = 4.935,10` ✅ · subtotal `20,40 × 725,75 = 14.805,30` ✅
- **`Σ(subtotales conv.) == Conversión Monto Total`** → `6.967,20 + 14.805,30 = 21.772,50` ✅

---

## 6. Clientes potenciales — DW-CLT-001 · Ref **2** (móvil DM-CLT-026) · `WEB-OK` (re-confirmado)

| Campo (manifiesto `datos`) | Móvil | Web | |
|---|---|---|---|
| epoch | `1785260069928.0` | Código `1785260069928.0` | ✅ |
| na_client | `Test-CLT-SMOKE-133515` | Nombre ídem | ✅ |
| nu_rif | `J987654321` | Cédula `J987654321` | ✅ |
| tx_address | `AV PRINCIPAL QA SMOKE EL VALLE` | Dirección ídem | ✅ |
| tx_address_dispatch | `AV PRINCIPAL QA SMOKE DESPACHO` | Dirección Entrega ídem | ✅ |
| tx_client | `Cliente potencial QA smoke el_valle` | Comentario ídem | ✅ |
| na_responsible | `QA Automation` | Responsable ídem | ✅ |
| em_client | `qa.smoke@kiberno.com` | Correo ídem | ✅ |
| nu_phone | `04123053302` | Teléfono ídem | ✅ |
| na_web_site | `""` | — | ⏭ vacío en origen, se saltea |
| — | — | Fecha de Registro `28/07/2026 13:36:39` · Vendedor `001` | ✅ |
| — | — | Coordenada de transacción `11.0494917,-63.8649583` | ✅ |
| empresa / id_enterprise | COVADONGA / `1` | el detalle **no expone** campo Empresa | ℹ️ verificado por guarda de playa, no por campo |
| st_potential_client | `1` | el detalle no expone estatus | ℹ️ no cotejable en esta vista |

`cotejarCampos` → 0 diffs sobre los 9 campos comparables.

---

## Patrones nuevos (web)

Todo confirmado en esta corrida sobre **La Tortuga**. Tag `[f1-2807-lt]`.

### P1 · La conversión es **multiplicación**, no división
`Monto conv. (BS) = Monto (USD) × Tasa`, con la tasa expresada `725,7500 BS = 1 USD`.
`verificarConversion()` de `web-helpers.js` calcula `monto / tasa` ⇒ **no sirve en esta playa**.
Verificado 14 veces sin una sola desviación (cabeceras, líneas de documento, líneas de pedido, retenciones).

### P2 · Los TOTALES de cabecera comparten padre con su etiqueta — en **todos** los detalles, no solo pedidos
La regla «etiqueta termina en `:` → el valor es la hoja siguiente» **pierde el bloque de totales**
de `detalleCobro`, `detallePedido` y la `Coordenada de transacción`. Lector correcto:

```js
const tot = {};
document.querySelectorAll('body *').forEach(el => {
  if (el.children.length) return;
  const t = (el.textContent||'').replace(/\s+/g,' ').trim();
  if (!t.endsWith(':')) return;
  const p = (el.parentElement?.textContent||'').replace(/\s+/g,' ').trim();
  if (p.startsWith(t) && p.length > t.length && p.length < 200) tot[t.replace(/:+$/,'')] = p.slice(t.length).trim();
});
```
El tope `p.length < 200` es **necesario**: sin él, `Ubicación:` absorbe los ~400 caracteres de los controles
de accesibilidad del mapa de Google (`←Mover a la izquierda…Términos`).

### P3 · `Observaciones` **no lleva dos puntos**
En `detalleDevolucion` y `detalleDeposito` la etiqueta es `Observaciones` (sin `:`), así que el emparejador
la ignora y el valor se pierde. Hay que buscarla aparte en `document.body.innerText`.
En `detalleCobro` / `detallePedido` el campo equivalente sí es `Comentario:` (con `:`).

### P4 · En `detalleInventario` la coordenada **no es texto visible**
`detalleCobro`, `detalleDevolucion`, `detallePedido` y `detalleClientePotencial` imprimen la coordenada
como texto. `detalleInventario` **no**: solo la pasa al mapa. Se lee del HTML:
```js
document.body.innerHTML.match(/-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/g)
```
⇒ **no marcar `falta en web`** sin revisar el HTML primero.

### P5 · La tabla de pagos del detalle de cobro **cambia de columnas** según la forma de pago
Mismo ID (`form:j_idt178`, auto-generado ⇒ anclar por estructura), distinto juego de columnas:

| Forma de pago | Columnas |
|---|---|
| Efectivo (`ef`) | N° · Forma de pago · Banco receptor · Numero de Cuenta · Fecha valor · Nro Documento · Fecha documento · Monto cobrado · Monto conv. |
| Pago Movil (`pm`) | + **Banco Emisor** · **Tipo Documento** · **Nº teléfono** · **Referencia** |

⇒ Anclar siempre con `tablaPorColumnas(['Forma de pago','Monto cobrado'])`, nunca por índice de columna.

### P6 · La estructura del detalle de cobro **depende de `co_type`**

| `co_type` | Tipo | Tabla de documentos | Tabla de pagos | Etiqueta del total |
|---|---|---|---|---|
| `1` | Anticipo/Prepago | **ausente del DOM** | 1+ filas | **`Monto pagado:`** |
| `0` | Cobros | `form:documentosPagadosDT` | 1+ filas | `Total Monto a pagar:` |
| `2` | Retención | `form:documentosPagadosDT` | *"No se encontraron registros."* | `Total Monto a pagar:` (⚠ devuelve 0 — ver DW-COB-004) |

### P7 · `Monto total base` del detalle de cobro = **Σ saldo del documento**, no Σ monto del documento
Invisible cuando saldo == monto (Refs 120, 121). El Ref 122 lo revela: `Monto doc 108.605,07` /
`Saldo doc 504,42` → cabecera muestra `504,4200`. Cotejar contra `nu_balance_doc`, no `nu_amount_doc`.

### P8 · **Clientes potenciales SÍ tiene columna `# Ref`** en la lista
Contradice `_comunes.md`, que lo listaba como módulo «sin `# Ref`». Columnas reales:
`Detalle · # Ref · Fecha · Vendedor · Rif. Cliente · Cliente · Responsable`.
No hay **filtro** por Ref (el filtro `input[id$=":n_ref"]` no existe en esa página), pero la columna
permite localizar la fila barriendo sin abrir detalles. El detalle sigue sin `No. de Ref.` — la llave ahí es el epoch.

### P9 · Selectores de filtro portables (no hardcodear `j_idt*`)
El contenedor del filtro es `form:j_idt116` en cobros y `form:j_idt115` en devoluciones ⇒ **usar sufijos**:
`input[id$=":n_ref"]` · `button[id$=":ajax"]` (Buscar) · `button[id$=":botonLimpiar"]` (Limpiar) ·
`input[id$=":dateB_input"]` / `input[id$=":dateF_input"]` (rango de fechas).
Filtrar por `# Ref` deja **una sola fila** ⇒ el detalle siempre se abre con `#form\:<tabla>\:0\:consultar`,
sin tener que resolver el índice. Es la forma más barata y estable de navegar.

### P10 · La lista de cobros se sirve **cacheada**
Al entrar a `/pages/cobros` la tabla venía con los cobros que existían cuando se cargó la vista
(solo 119 y 120). Un clic en `Buscar` trajo los 4. ⇒ **Siempre disparar `Buscar` antes de concluir
`WEB-MISSING`**; el rango de fechas por defecto (`01/07/2026`–`28/07/2026`) ya era correcto.

### P11 · La sesión JSF cae en mitad de la corrida
Navegar a `/pages/inventarios` redirigió a `login.xhtml` (sin `ViewExpiredException` visible).
Re-login con `input[placeholder="Usuario"]` / `input[placeholder="Clave"]` / `button.botonLogin`
restaura la sesión y la corrida sigue sin perder nada. **Ojo:** la caída afecta a **todas** las pestañas.

### P12 · Hallazgo de modelo de datos — el vínculo depósito↔cobro **no** vive en `deposit_collection_payment`
`SELECT * FROM deposit_collection_payment WHERE id_deposit=1` → **0 filas**, aun cuando la web muestra
correctamente el cobro 119 dentro del depósito 1. El vínculo real es **`collection.id_deposit = 1`**.
`modelo-datos-denario.md` describe la N:M vía `deposit_collection_payment`; para este flujo (móvil → nube)
la relación efectiva es la FK directa en `collection`. Consultar por ahí, no por la tabla puente.

---

## Resumen

### Conteo por marca

| Marca | Registros | Cuáles |
|---|---|---|
| **WEB-OK** | **8** | CLT Ref 2 · PED Ref 437 · DEV Ref 177 · INV Ref 2 · DEP Ref 1 · COB Ref 119 · COB Ref 120 · COB Ref 121 |
| **WEB-CALC-MISMATCH** | **1** | COB Ref 122 (Retención) — `Total Monto a pagar` de cabecera = `0,0000` vs `12,0000` real |
| WEB-MISSING | 0 | — |
| WEB-FIELD-MISMATCH | 0 | — |
| WEB-N/A | 0 | — |
| **Total** | **9** | |

### ¿Llegó todo?

**Sí, los 9 registros están en la web y ninguno faltó.** No hubo que esperar por sync diferido:
los 4 cobros ya estaban en la nube y el único obstáculo fue la **lista cacheada** de `/pages/cobros`,
resuelta con un `Buscar` (patrón P10). Cero `WEB-MISSING`.

### ¿Los cálculos cuadran?

**Sí, salvo uno.** Se verificaron **29 aserciones aritméticas** y **28 dieron exacto** (Δ = 0,0000 en todas —
ni siquiera se usó la tolerancia de 0,01):

| Familia de oráculo | Aserciones | Resultado |
|---|---|---|
| Conversión `monto × 725,75` | 17 | ✅ 17/17 exactas |
| `Monto cobrado == Σ pagos` | 3 (Refs 119, 120, 121) | ✅ 3/3 |
| `Diferencia cobro == Total por cobrar − Monto cobrado` | 3 | ✅ 3/3 (todas 0,0000) |
| **Retención `IVA + ISLR == neto del documento`** | 1 (Ref 122: `10 + 2 = 12`) | ✅ |
| Anticipo sin documentos (Ref 119) | 1 | ✅ (tabla de documentos ausente, como corresponde) |
| **Depósito `Σ(cobros hijos) == Monto depositado`** | 1 (`20,00 == 20,00`) | ✅ |
| **Pedido `Σ(líneas) == Monto Total`** | 2 (USD y BS) | ✅ |
| `Total Monto a pagar == nu_amount_final` | 4 | ❌ **3/4** — falla en Ref 122 |

**La única falla es la del Ref 122**, y es acotada: afecta a **un campo derivado de la cabecera del detalle**
en cobros de tipo **Retención** (`co_type = 2`). Los datos base — retenciones, documento, saldo, comprobante,
conversiones — están todos correctos, y el importe verdadero (12,00 USD) se ve bien en la lista y en la línea
del documento. No compromete la integridad de lo que el móvil envió: **el móvil mandó bien y la nube guardó bien**;
lo que falla es cómo la web **presenta** ese total cuando no hay filas de pago.

### Notas que no son defectos

- **Zona horaria:** los 9 registros muestran hora local UTC-4 frente a la BD en UTC (ej. `19:53:48Z` → `15:53:48`).
  Consistente en todos los módulos. Veredicto por día → nota, no mismatch.
- **Código vs nombre:** el móvil manda códigos (`010` almacén, `PZA-C0051` unidad, banco por nombre) y la web
  muestra la descripción del catálogo (`PRODUCTO TERMINADO (EMBUTIDOS)`, `PIEZA`, `1101003`). No comparable campo a campo.
- **Ref 121:** `158,56 − 5,00 − 10,00 ≠ 50,00` es correcto — el documento está marcado pago parcial.
- **Ref 122, `Monto cobrado` vacío en la lista:** coherente con 0 filas en `collection_payment`. La `Diferencia cobro`
  de la lista sale `0,0000` porque refleja `nu_difference` de la BD, no una resta calculada en la web.

### Cobertura READ-ONLY

Cero escrituras. Se tocaron únicamente `Consultar` por fila, `Buscar` de filtros y el formulario de login.
**No** se tocó el `<select>` "Estatus del Cobro" de la lista de cobros, ni `Copiar` en pedidos (presente en la
fila del 437), ni `Editar`/`Eliminar`, ni ningún `Guardar`/`Aprobar`/`Procesar`. La pestaña 0 quedó abierta.

---

*Agente QA capa WEB · F1 · 2026-07-28 · playa la_tortuga · empresa PROCESADORA DE ALIMENTOS COVADONGA,C.A*
