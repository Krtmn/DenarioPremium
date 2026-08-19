# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | COBROS — **modo SOLO LECTURA** (decisión explícita de la responsable QA, motivo: tiempo) |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, `id_enterprise` 1) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng`=true · `sqlitePlugin` OK |
| Playa | **ISLA COCHE** (`denarioislacoche.ddns.net:8081/PremiumWS/services/`) |
| Usuario | `scarlet` · `id_user` 309 · `co_user` `VE0002` |
| Resultado | **5 PASS · 0 FAIL · 0 SKIP · 29 N/A · 0 BLOCKED** |
| Registros creados | **NINGUNO** — ver sección dedicada |

> 🔴 **Alcance declarado.** Por decisión de la responsable QA este módulo se corrió **sin crear ni un
> solo cobro** (ni normal, ni anticipo, ni retención) y **sin abrir el formulario de Nuevo Cobro**.
> Lo que sí se ejerció a fondo: entrada al módulo · lista · BUSCAR con 4 criterios · apertura y lectura
> completa del detalle de los **4 cobros existentes de los 3 sabores** · cotejo campo a campo contra la nube.
>
> **SIN MANIFIESTO NI CAPTURA DE PAYLOAD**: no se envió nada, así que no hay `_bd-manifest.jsonl` ni POST
> de `collectionservice` para este módulo. **Esto NO es cobertura faltante** — es la consecuencia directa
> del alcance de solo lectura. El consolidado no debe leerlo como un hueco.

---

## Casos ejecutados

**Leyenda de los N/A** — se distinguen dos motivos, deliberadamente:
- 🚫 **SL** = *"cobros solo lectura (decisión QA)"* — el caso exige crear/guardar/enviar o abrir el form de creación.
- 🚫 **VG** = *"N/A por variable global"* — el caso no aplica a esta cuenta por configuración, **con independencia**
  del alcance de solo lectura. Varios de estos quedaron **confirmados por observación** en la UI (no solo por el YAML).

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Menú COBROS con **COBRO · ANTICIPO/PREPAGO · RETENCIÓN · BUSCAR**. Sin IGTF ni 25%IVA (coherente con `userCanSelectIGTF=false` y `userCanCollectIva=false`) |
| DM-COB-002 | 🚫 N/A **SL** | Exige abrir el form de Nuevo Cobro — prohibido explícitamente en este alcance |
| DM-COB-004 | 🚫 N/A **SL** | Selección de cliente dentro del form de creación |
| DM-COB-006 | 🚫 N/A **VG** | `requiredComment=false`. **Confirmado por observación**: el cobro Ref 348 está enviado con el campo Comentario **vacío** (contador `0/255`) |
| DM-COB-007 | 🚫 N/A **SL** | Tab Documentos solo existe en el form de creación (el detalle abre con 3 tabs) |
| DM-COB-008 | 🚫 N/A **SL** | Marcar checkbox de documento → form de creación |
| DM-COB-015 | ✅ PASS | Línea **"Total General"** presente y correcta en los 4 cobros: `BS 900.031,16` (348) · `USD 12.870,00` (349) · `BS 2.500,00` (350) · el 351 cierra en `1.500,00` |
| DM-COB-033 | 🚫 N/A **SL** | Cambiar el selector de moneda exige el form. **Dato obtenido igual**: `multiCurrencyCollection` está **activo** — el tenant tiene cobros en BS (348/350/351) y en USD (349) |
| DM-COB-034 | 🚫 N/A **SL** | Selector Moneda Documento vive en el Tab Documentos, ausente en solo lectura |
| DM-COB-041 | 🚫 N/A **VG** | `retencion=false` ⇒ la retención **no va dentro del cobro normal**. **Confirmado**: el detalle del cobro 348/349 no expone campos de retención; la retención va por +RETENCIÓN (patrón insumar), y el Ref **351** es el ejemplo real |
| DM-COB-042 | 🚫 N/A **VG** | Encadena 041 — mismo motivo |
| DM-COB-009 | 🚫 N/A **SL** | Modal "Agregar método de pago" → form de creación |
| DM-COB-040 | 🚫 N/A **SL** | Cargar método + banco + monto |
| DM-COB-012 | 🚫 N/A **SL** | Diferencia rojo/azul exige editar montos |
| DM-COB-043 | 🚫 N/A **SL** | Extiende 012 — mismo motivo |
| DM-COB-014 | ✅ PASS | Tab Total con tabla de documentos + **acordeón por método de pago**, todos los totales no nulos. Verificado en los 4 cobros. **Columnas dinámicas confirmadas**: 5 col. en el 348 (con `Desc.`) vs 4 col. en el 349 (sin descuento) |
| DM-COB-016 | ✅ PASS | Tab Adjuntos con los 3 acordeones **Imágenes / Archivo / Firma**. Al expandir, el 348 muestra el archivo `downloadfile (2).pdf` |
| DM-COB-018 | 🚫 N/A **SL** | Guardar |
| DM-COB-019 | 🚫 N/A **SL** | Enviar |
| DM-COB-022 | ✅ PASS | BUSCAR abre `app-cobros-list` con **los 4 cobros** + searchbar. Trash ausente — correcto: ningún cobro está en Guardado local (`st_delivery=1` en los 4) |
| DM-COB-024 | 🚫 N/A **SL** | No existe ningún cobro en estado Guardado editable; obtener uno exigiría guardar |
| DM-COB-026 | 🚫 N/A **SL** | Eliminar exige un Guardado propio; borrar un cobro de la QA está fuera de alcance |
| DM-COB-020 | 🚫 N/A **SL** | Dirty-guard requiere abrir el form y ensuciarlo |
| DM-COB-021 | 🚫 N/A **SL** | "Salir sin guardar" — ídem |
| DM-COB-038 | 🚫 N/A **SL** | "Guardar y salir" — **guardaría un cobro**, expresamente excluido |
| DM-COB-029 | 🚫 N/A **SL** | Crear cobro de Retención. La VG **sí está activa** (`cobroRetencion=true`, botón RETENCIÓN presente) y el Ref 351 prueba que el flujo funciona en esta cuenta |
| DM-COB-028 | 🚫 N/A **SL** | Crear Anticipo. VG activa (`cobroPrepago=true`, botón presente); el Ref 350 es el ejemplo real |
| DM-COB-036 | 🚫 N/A **VG** | `userCanSelectIGTF=false` **e** `igtfDefault=false` (coherentes). **Confirmado por observación**: 0 menciones de "IGTF" en el Tab General y en el Tab Total de los 4 cobros; `nu_amount_igtf=0` en los 4 |
| DM-COB-044 | 🚫 N/A **VG** | Persistencia tasa IGTF — sin IGTF en la cuenta |
| DM-COB-045 | 🚫 N/A **VG** | Ídem 044 |
| DM-COB-046 | 🚫 N/A **SL** | Pago parcial exige el detalle de documento dentro del form. **Dato de nube**: `in_payment_partial=false` en los 3 detalles existentes |
| DM-COB-047 | 🚫 N/A **VG** | Cambiar Fecha tasa. **Confirmado en UI**: el `ion-button.letrasFechasButton` de Fecha Tasa llega **`button-disabled`** ⇒ `canChangeRate=false` es efectivo, no solo declarado |
| DM-COB-037 | 🚫 N/A **VG** | `userCanCollectIva=false`. **Confirmado**: no hay botón "25% IVA" en el menú de COBROS |
| DM-COB-039 | 🚫 N/A **VG** | Ninguna rama aplica: `#manualRateInput` **ausente** (rama A) y botón Fecha Tasa **disabled** (rama B). `enabledManualRate=false` + `canChangeRate=false`, ambos confirmados en UI |

**Totales:** 5 PASS · 0 FAIL · 0 SKIP · 0 BLOCKED · 29 N/A (**20 por solo lectura · 9 por VG**).

---

## Registros creados en sistema

**NINGUNO.** No se creó, guardó ni envió ningún cobro — el módulo se corrió en modo solo lectura por
decisión explícita de la responsable QA (motivo: tiempo).

**Prueba negativa (no es "la lista sigue igual", es evidencia de la BD local):**

| Tabla local | `sqlite_sequence` al abrir | al cerrar | Veredicto |
|---|---|---|---|
| `collections` | 10 | **10** | 0 inserts |
| `collection_details` | 7 | **7** | 0 inserts |
| `collection_payments` | 8 | **8** | 0 inserts |

Además al cierre: `pending_transactions` = **0** · `failed_transactions` = **0** ·
`count(*)`=4 / `count(DISTINCT co_collection)`=4 ⇒ **0 duplicados**.

---

## Verificación BD

Sin baseline-diff (no se creó nada). El cotejo fue **UI ↔ nube**, cobro por cobro, sobre los 4 que la QA
cargó hoy. Lector: `node automation/db/query.js kron "…"` sobre `collection` / `collection_detail` /
`collection_payment`. Sin un solo timeout de red.

### Ref 348 — cobro normal BS, el más grande · **BD-OK**

| Campo | UI (Tab Total) | Nube | ✓ |
|---|---|---|---|
| Monto total a Pagar BS | 900.031,16 | `nu_amount_total` 900031.1600 | ✅ |
| Monto total a Pagar USD | 1.167,25 | 900.031,16 ÷ 771,07 = 1.167,25 | ✅ |
| Tasa | 771,07 | `nu_value_local` 771.0700 | ✅ |
| Monto Doc. | 8.854.967,88 | `nu_amount_doc` 8854967.8800 | ✅ |
| **Desc.** | **16.000,00** | `nu_amount_collect_discount` 16000.0000 | ✅ |
| Monto Pago | 900.031,16 | `nu_amount_paid` 900031.1600 | ✅ |
| Nro. Doc. | FACT00090890 | `co_document` FACT00090890 | ✅ |
| Método | **Efectivo** — `Nro. Recibo: efect1` | `co_payment_method` **`ef`**, `nu_amount_partial` 900031.16 | ✅ |
| Diferencia | 0,00 | `nu_difference` 0.0000 | ✅ |

**Oráculo del total (`co_type 0`)** — cierra por las dos vías porque no hay pago parcial:
Σ(Monto a pagar) = 900.031,16 ✅ · Σ(Saldo) − dcto = 916.031,16 − 16.000 = 900.031,16 ✅

### Ref 349 — cobro normal **USD** (la conversión) · **BD-OK**

| Campo | UI | Nube | ✓ |
|---|---|---|---|
| Moneda | USD | `co_currency` USD | ✅ |
| Monto total a Pagar USD | 12.870,00 | `nu_amount_total` 12870.0000 | ✅ |
| **Monto total a Pagar BS** | **9.923.670,90** | 12.870,00 × 771,07 = **9.923.670,90** | ✅ |
| Monto Doc. | 14.355,00 | `nu_amount_doc` 14355.0000 | ✅ |
| Monto Pago | 12.870,00 | `nu_amount_paid` 12870.0000 | ✅ |
| Método | **Transferencia** — Banco Receptor `BANCO DEL TESORO, C.A. BANCO UNIVERSAL`, Nro. Referencia 754757, Fecha 2026-08-01 | `co_payment_method` **`tr`**, `na_bank` idem, `da_value` 2026-08-01 | ✅ |

🔑 **La conversión está bien en ambos sentidos:** con cobro en BS la app **divide** por la tasa para dar USD
(348), y con cobro en USD **multiplica** para dar BS (349). No se observó el defecto latente
`nu_amount_paid_conversion` — ningún documento de estos cobros fue editado con pago parcial.

### Ref 350 — **anticipo** (`co_type 1`) · **BD-OK**

| Campo | UI | Nube | ✓ |
|---|---|---|---|
| Etiqueta de fecha | **"Fecha Anticipo"** | `co_type` 1 | ✅ |
| Tabla de documentos | **ausente** | `docs` = 0 | ✅ |
| Total General BS | 2.500,00 | `nu_amount_total` 2500.0000 | ✅ |
| `nu_amount_final` | 2.500,00 | 2500.0000 (**poblado, no 0**) | ✅ |
| Conversión USD | 3,24 | 2.500 ÷ 771,07 = 3,2422 → 3,24 | ✅ |
| Método | **Depósito** — Banco `BANCO BICENTENARIO BANCO UNIVERSAL, C.A.`, `Nro. Depósito: dep2` | `co_payment_method` **`de`**, `na_bank` idem, `nu_amount_partial` 2500.00 | ✅ |

✅ **No reproduce** el "Monto pagado 0,00" de anticipos visto en grupo_fiel: `nu_amount_final` viene poblado
y la UI lo muestra.
❌ Pero sí aparece un defecto de formato en la línea `Total Depósitos:` — ver Hallazgos.

### Ref 351 — **retención** (`co_type 2`) · **BD-OK**

| Campo | UI (acordeón del Tab Total) | Nube | ✓ |
|---|---|---|---|
| Etiqueta de fecha | **"Fecha Retención"** | `co_type` 2 | ✅ |
| Nro. Doc. | FACT00091142 | `co_document` idem | ✅ |
| **Monto Doc. BS** | 9.923.670,90 | = `nu_balance_doc` (el **saldo**), **no** `nu_amount_doc` (11.068.709,85) | ⚠ ver nota |
| Monto IVA BS | 1.000,00 | `nu_amount_retention_iva` 1000.000000 | ✅ |
| Monto ISLR BS | 500,00 | `nu_amount_retention_islr` 500.000000 | ✅ |
| Monto total retenido BS | 1.500,00 | 1.000 + 500 | ✅ |
| Monto total a Pagar BS | 1.500,00 | `nu_amount_total` 1500.0000 | ✅ |
| Conversión USD | 1,95 | 1.500 ÷ 771,07 = 1,9453 → 1,95 | ✅ |
| Pagos | **sin tab Pagos, sin métodos** | `pagos` = 0 | ✅ (por diseño) |
| Comprobante retención | *(no se muestra en el acordeón)* | `nu_voucher_retention` **`55555555558882`** = **14 dígitos** | ⚠ ver nota |

**Oráculo del total (`co_type 2`) CIERRA:** Total a pagar = Ret.IVA + Ret.ISLR = 1.500,00 — **el saldo no
participa**. Reconfirma la regla de el_palmar por 3ª playa.

⚠ **"Monto Doc." del acordeón de retención muestra el SALDO, no el monto de la factura** — 3ª playa
confirmando `[el_palmar-20260805]` / `[grupo_fiel-20260817]`. Al cotejar hay que ir contra `nu_balance_doc`.

⚠ `sizeRetention=14` y `formatRetention="0"` (Números) quedan **confirmados por dato real**: el comprobante
grabado tiene exactamente 14 caracteres, todos dígitos. La UI del detalle, sin embargo, **no expone el
número de comprobante** en el acordeón (sí IVA / ISLR / total retenido) — observación menor.

### Marcas

| Ref | `co_type` | Marca |
|---|---|---|
| 348 | 0 normal BS | **BD-OK** |
| 349 | 0 normal USD | **BD-OK** |
| 350 | 1 anticipo | **BD-OK** |
| 351 | 2 retención | **BD-OK** |

Local: los 4 con `id_collection` **del servidor** (348-351) y `st_delivery=1`, fuera de `pending_transactions`
y de `failed_transactions`. **4/4 BD-OK, 0 MISMATCH.**

---

## Veredicto — origen del historial de COBROS

🔑 **En kron el historial SE DESCARGA DEL SERVIDOR.** No es local.

**Prueba limpia** (la misma forma de la de grupo_fiel, y acá es aún más nítida):

1. El device **nunca creó un cobro**: `sqlite_sequence.collections` se mantuvo en **10** de punta a punta, y
   esta corrida no guardó nada.
2. Aun así, la tabla local `collections` contiene **exactamente los 4 cobros que la QA cargó hoy en la nube**,
   con el `id_collection` **del servidor** (348, 349, 350, 351) y `st_delivery=1`.
3. Un `co_collection` epoch generado localmente jamás produciría esos ids.

**El recorte tiene DOS filtros, no uno** — este es el dato nuevo de esta corrida:

| Nivel | Cantidad | Filtro |
|---|---|---|
| Nube, tenant completo | **72** cobros (10 vendedores) | — |
| Nube, vendedor `id_user=309` (`scarlet`) | **5** | filtro por **vendedor** |
| Móvil | **4** | + filtro por **ventana de fecha** |

El 5.º cobro del vendedor (Ref **106**, KITCHEN BOSS FOODS, BS 305.017,50) es del **19/03/2026** — cinco meses
atrás, fuera de la ventana de historial de la cuenta (`historyMonths=1`, `mesesFacturas=3`). Los 4 que sí
bajan son todos del **17/08/2026**.

⇒ **No es defecto de cobertura.** Y confirma que basta el filtro por vendedor **no** explica el recorte:
hay además una ventana temporal. La receta de verificación de difranca ("contrastar local contra
`count(*) WHERE id_user=<vendedor>` en la nube") **necesita el matiz de la fecha**, o produce un falso
"falta 1 cobro".

**Serie acumulada del comportamiento del BUSCAR de COBROS** — sigue **sin ser universal**:

| Corrida | Playa | Origen del historial |
|---|---|---|
| `el_palmar-20260805` | Isla Coche | 100 % **local** |
| `difranca-20260807` | El Yaque | **descarga** (100 más recientes del vendedor) |
| `grupo_fiel-20260817` | El Yaque | **descarga** (filtro por vendedor) |
| **`kron-20260817`** | **Isla Coche** | **descarga** (vendedor **+ ventana de fecha**) |

🔴 **Dato que rompe la hipótesis "es por playa":** el_palmar y kron corren en **la misma playa (Isla Coche)**
y se comportan **al revés**. ⇒ el discriminador **no es la playa**; hay que seguir verificándolo por cuenta.

---

## VGs resueltas por observación (sin abrir el formulario)

Todas dirimidas leyendo el detalle de cobros existentes, la BD local y la nube.

| VG | Valor declarado | Cómo se dirimió | Veredicto |
|---|---|---|---|
| `colletionPayment` `"true-false-true-true-true-false"` | Ef SÍ · Cheque NO · Transf SÍ · Dep SÍ · Otros SÍ · **Pago Móvil NO** | `SELECT co_payment_method FROM collection_payments` (BD local) + los 3 acordeones de la UI | ✅ **Coherente.** Métodos realmente usados: **`ef` (Efectivo), `tr` (Transferencia), `de` (Depósito)**. **Ni `ch` (Cheque) ni `pm` (Pago Móvil)** aparecen en un solo pago. `ot` (Otros) habilitado pero sin uso |
| `userCanSelectIGTF=false` + `igtfDefault=false` | IGTF N/A | **0 menciones** de "IGTF" en Tab General y Tab Total de los 4 cobros; `nu_amount_igtf=0` y `has_igtf` sin marcar en los 4; sin botón IGTF en el menú | ✅ **Sin contradicción** (a diferencia de grupo_fiel). IGTF confirmado N/A |
| `canChangeRate=false` + `enabledManualRate=false` | Tasa fija | `#manualRateInput` **ausente**; el `ion-button.letrasFechasButton` de Fecha Tasa llega con clase **`button-disabled`**; la Tasa se pinta como **texto plano** `771,07`, ni input ni select | ✅ **Coherente y efectivo.** Ninguna de las 2 ramas de DM-COB-039 aplica |
| 🟢 `userCanSelectCollectDiscount=true` | El descuento en cobro SÍ aplica | El Ref **348** tiene descuento real de **16.000,00**; la tabla del Tab Total renderiza la columna **`Desc.`** con ese valor; `collection_detail_discounts` local tiene 1 fila; `has_discount=true` en la nube | ✅ **CONFIRMADO OPERATIVO** — es la diferencia real con grupo_fiel (donde era N/A). La columna `Desc.` **aparece solo cuando hay descuento** (5 col. en el 348, 4 col. en el 349) |
| 🔴 `retencion=false` | La retención NO va dentro del cobro normal | El detalle de 348/349 no expone campo alguno de retención; el Ref **351** (`co_type 2`) llega por el botón **+RETENCIÓN** del menú; `collection_detail_retentions` local = **0 filas** aunque el 351 SÍ tiene retención (los montos viven en `collection_detail`) | ✅ **Confirmado.** DM-COB-041/042 son N/A **por VG**, no por el alcance de solo lectura |
| `sizeRetention=14` · `formatRetention="0"` | 14 caracteres numéricos | `nu_voucher_retention` del Ref 351 = `55555555558882` → **14 dígitos exactos** | ✅ Confirmado por dato real |
| `retentionDocTypeCR=true` | Maneja documentos de retención | El Ref 351 retiene sobre un documento real (`FACT00091142`, `co_type_doc` FACT) con IVA + ISLR | ✅ Confirmado |
| `userCanCollectIva=false` | 25% IVA N/A | Sin botón "25% IVA" en el menú de COBROS | ✅ Confirmado |
| `requiredComment=false` | Comentario opcional | El Ref 348 está **enviado con el Comentario vacío** (`0/255`); el hint dice **"Mín. 0"** | ✅ **Confirmado** — a diferencia de grupo_fiel, donde en cobros sí era obligatorio |
| `multiCurrencyCollection=true` | 2 monedas de cobro | Cobros reales en **BS** (348/350/351) y en **USD** (349), ambos con conversión correcta | ✅ Confirmado |
| `positiveDifference=false` | No se paga más que el documento | `nu_difference=0` en los 4; ningún `nu_amount_paid > nu_balance_doc` | ✅ Coherente (sin caso que lo fuerce) |
| `enablePartialPayment=true` | Pago parcial habilitado | `in_payment_partial=false` en los 3 detalles → habilitado pero **sin uso** en la muestra | ⚪ No dirimible por lectura |
| `tolerancia0=true` + rangos 100000 | Tolerancia libre | Los 4 cierran en `Diferencia 0,00` → no se ejerció la tolerancia | ⚪ No dirimible por lectura |
| `currencyBank=true` | Todos los bancos, sin filtrar por moneda | El Ref **349** es un cobro en **USD** pagado con transferencia a **BANCO DEL TESORO** (banco local, en BS) | 🟢 **Indicio fuerte a favor**: un banco en moneda local aceptado en un cobro USD. No es prueba concluyente sin abrir el picker |
| `clientBankAccount=false` | Sin cuenta bancaria del cliente | `co_client_bank_account` / `nu_client_bank_account` / `na_client_bank_account` **vacíos** en los 3 pagos | ✅ Confirmado |
| `validateCollectionDate=false` | No valida fecha del cobro | El Ref 349 tiene `da_value` **2026-08-01** (16 días antes del cobro, 17/08) y fue aceptado | ✅ Confirmado por dato real |
| `requiredCollectionAttachments=false` | Adjunto no obligatorio para enviar | `has_attachments=true` en los 4 (la QA adjuntó), pero el Ref **345** del histórico está enviado con `has_attachments=false` | ✅ Confirmado |
| `enterpriseEnabled=true` con 1 empresa | Selector con 1 opción | El `ion-select` de Empresa del Tab General: **`disabled=true`**, **1 opción**, `value` **objeto**, rotula **`CHOCOLATES KRON, C.A`** (sin punto = `lb_enterprise`) | ✅ Confirmado — resuelve el pendiente nº 2 del YAML |
| `longitudComentario: 200` | (valor de config) | El hint real de la UI dice **"Mín. 0 - Máx. 255 caracteres"** con contador `n/255` | 🔴 **El YAML declara 200, la UI aplica 255.** El tope lo fija una **constante de producto por campo**, no la VG — reconfirma `[el_palmar-20260805]` |

---

## Hallazgos

> Ninguno tumba un caso del smoke (no hay FAIL). Son **dos defectos cosméticos de la vista de detalle**,
> ambos ya documentados en `globalmp 30/07/2026` y ahora **reconfirmados en 2.ª playa / 2.º build**.
> **Prueba de fuego §4.b superada:** los dos reproducen sobre registros **creados hoy (17/08/2026)**, no
> sobre datos históricos ⇒ **son defectos vigentes de la release en prueba**, no observaciones.

### H1 · `Total Depósitos:` imprime el monto en moneda local **sin formato** — Severidad **S4 (cosmético)**

En el Tab Total del cobro Ref **350** (anticipo con Depósito), el encabezado del acordeón rotula:

```
Total Depósitos:
BS 2500          ← sin separador de miles ni decimales
USD 3,24         ← correcto
...
Monto: BS 2.500,00   ← el detalle interno SÍ formatea
```

**Lo que hace fuerte al hallazgo es la comparación dentro de la misma corrida**, con las tres líneas de
método una al lado de la otra:

| Cobro | Línea | Render | ✓ |
|---|---|---|---|
| 348 | `Total Efectivo:` | `BS 900.031,16` | ✅ formateado |
| 349 | `Total Transferencias:` | `USD 12.870,00` / `BS 9.923.670,90` | ✅ formateado |
| **350** | **`Total Depósitos:`** | **`BS 2500`** | ❌ **sin formato** |

⇒ El defecto **no es de la moneda ni del monto**: es **específico de la línea `Total Depósitos`**, que se
salta el pipe de formato para la moneda local (la línea USD del mismo bloque sí formatea). Coincide
exactamente con lo reportado en globalmp (`BS 1500`, `BS 175622.82`).

**Impacto:** solo lectura, el monto correcto se ve en el renglón `Monto:` de abajo. No afecta cálculos ni datos.

### H2 · Timestamp ISO crudo en el acordeón de retención — Severidad **S4 (cosmético)**

En el Tab Total del cobro Ref **351** (`co_type 2`):

```
Fecha del documento: 2026-08-01T04:00:00.000+00:00
```

Se muestra el ISO completo con zona horaria en vez de una fecha formateada (el resto de la vista sí
formatea: `Fecha: 2026-08-17`, `17/8/2026, 2:34 P. M.`). Reproduce lo visto en globalmp 30/07.

**Impacto:** cosmético, dato correcto pero ilegible para el usuario final.

### Observaciones (NO defectos)

- **El buscador de la lista no indexa el nº de documento.** Buscar `FACT00090890` (documento real del Ref 348)
  devuelve **0 con empty-state "No hay resultados"**, mientras que nombre de cliente, código de cliente y
  Nro. Ref sí filtran. **2.ª playa confirmando `[grupo_fiel-20260817]`** — no es defecto, pero conviene saberlo
  para no perder intentos buscando un cobro por su factura.
- **Los adjuntos de imagen no bajan al device.** El Ref 348 tiene `nu_attachments=4` y `has_attachments=true`,
  pero al expandir el Tab Adjuntos solo aparece **el archivo** (`downloadfile (2).pdf`); Imágenes y Firma
  vienen vacías. Coherente con `cloudAttachments=false` (las imágenes viven en la nube). Además los cargó la
  QA **desde la web**, no desde el móvil ⇒ no reproducible desde una creación móvil en este alcance.
- **El acordeón de retención no muestra el Nro. de comprobante.** El Ref 351 tiene
  `nu_voucher_retention=55555555558882` en la nube, pero el detalle solo expone IVA / ISLR / total retenido.
- **El histórico del tenant son 72 cobros, no 351.** El valor 351 es el `max(id_collection)`, no el conteo:
  la secuencia tiene huecos. Corrige el dato de partida del prompt.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔑 **El origen del historial de COBROS NO se explica por la playa** | universal (regla) | el_palmar y kron corren **ambos en Isla Coche** y se comportan **al revés** (local vs descarga). La serie queda 3 descarga / 1 local en 3 playas ⇒ **la playa no es el discriminador**; verificar por cuenta. Acota `[el_palmar-20260805]` vs `[difranca-20260807]` |
| 🔑 **El recorte del historial tiene DOS filtros: vendedor Y ventana de fecha** | universal | nube 72 → vendedor 309: 5 → móvil: **4**. El que falta es de hace 5 meses. ⇒ la receta de difranca (contrastar contra `count(*) WHERE id_user=<vendedor>`) **produce un falso "falta 1 cobro"** si no se acota por fecha. Añadir el filtro temporal al oráculo |
| **Etiqueta de fecha del Tab General: TERCERA variante** | universal | "Fecha Cobro" (`co_type 0`) · **"Fecha Anticipo" (`co_type 1`)** · "Fecha Retención" (`co_type 2`). **Amplía** `[el_palmar-20260805]`, que solo listaba dos. Reconfirma: **no usar la etiqueta como selector estable** |
| **La columna `Desc.` del Tab Total aparece SOLO si el cobro tiene descuento** | universal | 348 (con dcto) → **5 columnas**; 349 (sin dcto) → **4 columnas**, en el mismo build y la misma sesión. Refuerza "mapear celdas contra la fila de encabezado, nunca por índice fijo" `[gmp-20260730]` |
| **En la Tasa, la app rotula la moneda CONTRARIA a la del cobro** | universal | cobro BS → `Tasa USD 771,07` · cobro USD → `Tasa BS 771,07`. Es el mismo número; **buscar la línea por `/Tasa/`, nunca por `Tasa BS`** o no se encuentra en cobros $ |
| **Estado "Por aprobar" con `editable=false` ⇒ detalle de SOLO LECTURA legítimo** | cliente (kron) — patrón universal | los 4 cobros rotulan **"Por aprobar"** y abren con **3 tabs sin Guardar/Enviar/trash**. El catálogo `statuses` del tenant tiene `co_status='pap'` → `na_status='Por aprobar'` con **`editable=false`** para `co_transaction_type='cob'` ⇒ **la vista de solo lectura es correcta por diseño, NO un FAIL de "formulario no editable"** (DM-COB-024). Verificar `statuses.editable` antes de marcar FAIL |
| ⚠ **`st_collection` sigue sin ser traducible por `id_status` — 3.ª playa** | universal | `st_collection=3` en los 4, y el catálogo `cob` de kron tiene `id_status` **2, 7, 11, 12, 13** — **no existe el 3**. Reconfirma `[el_palmar-20260805]`/`[difranca-20260807]`. ⚠ Además el valor 3 coincide con la constante `COLLECT_STATUS_SAVED=3` del componente pero la UI **no** rotula "Guardado" ni muestra trash: **no diagnosticar por la constante tampoco** |
| ⚠ **`transaction_statuses` puede venir VACÍA para `cob`** | universal | en kron `WHERE co_transaction='cob'` devuelve `[]`, mientras `statuses` **sí** está poblada — es al revés que en el_palmar. ⇒ **probar las dos tablas**, no asumir cuál es la fuente |
| **`nu_value_local` es la TASA del cobro en la nube** | universal | no existe `nu_rate` en `collection` (la consulta obvia falla con `column does not exist`). Ahorra un ciclo de descubrimiento de esquema |
| **Columnas locales ≠ nube en `collections`** | universal | local usa **`lb_client`**; la nube usa `na_client`. Consultar `na_client` contra la BD local **aborta la transacción** `sqlitePlugin`. Suma a la lista de divergencias local/nube de `_comunes.md` |
| **`collection_detail_retentions` local queda VACÍA aunque haya retención** | universal | el Ref 351 (`co_type 2`) tiene IVA+ISLR y comprobante, pero la tabla local `collection_detail_retentions` tiene **0 filas**: los montos viven en `collection_details`. **No usar esa tabla como oráculo de "hay retención"** |
| **BUSCAR de COBROS: 4 criterios medidos** | universal | filtra por **nombre de cliente** (`ONCE`→3), **código de cliente** (`J401243401`→1) y **Nro. Ref** (`350`→1); **NO** por nº de documento (`FACT00090890`→0). Empty-state = **"No hay resultados"** |
| **`PRD-BUSCADOR-NO-REPUEBLA` NO reproduce en COBROS — 2.ª playa** | universal (acotación) | vaciar el searchbar repobló `filteredItems` 0 → **4**. Reconfirma la acotación de `[grupo_fiel-20260817]`: el defecto es **de PRODUCTOS**, no de todas las listas |
| **Reconfirmados sin un solo fallo** | universal | `ion-segment.value` + `ionChange` para cambiar de tab (~14 cambios, 0 clicks en `ion-segment-button`) · `grp.value=[todos los .value]`+`ionChange` para expandir acordeones del Tab Total · back = `img.fechaAtras` filtrando **`width>0 && x<100`** · **1 back desde el detalle devuelve al MENÚ COBROS, hay que volver a pulsar BUSCAR** (**4.ª playa**, 4 ciclos limpios) · abrir un cobro exige **click REAL** con `scrollIntoView({block:'center'})` + re-medir rect + validar viewport 360×744 |
| 🔑 **`sqlite_sequence` como prueba negativa en corrida de solo lectura — 2.ª corrida** | universal | `collections` 10→10, `collection_details` 7→7, `collection_payments` 8→8 tras abrir 4 detalles y ejercer el buscador. Evidencia mucho más fuerte que "la lista sigue igual". Reconfirma `[grupo_fiel-20260817]` |
| **Namespace `__qaCOB` instaló limpio** | universal | `__qaH` traía solo 2 skills (`fillIonInput`, `activeAlertInfo`) pero **`__qaDataHook` YA estaba en `true`** con 47 payloads ⇒ **no se reinstaló** el hook (habría apilado un 2.º wrapper). Reconfirma la regla de `[kron-20260817]`: **comprobar `__qaDataHook` al arrancar y actuar en consecuencia**, ni heredar a ciegas ni reinstalar |

> ✅ consolidado 2026-08-17

---

## Notas de ejecución

- **Watchdog:** techo de módulo 60 min. **0 cuelgues de CDP · 0 reconexiones · 0 BLOCKED.** Wall-clock del
  módulo muy por debajo del techo (el alcance de solo lectura lo abarató drásticamente).
- **Techo de intentos:** ningún caso consumió más de 1 intento. Sin exploración a ciegas.
- **BD:** sin un solo timeout de red contra la nube; no hizo falta reintentar ninguna consulta.
- **Estado final:** HOME ✅
