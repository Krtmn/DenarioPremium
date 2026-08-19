# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | COBROS (9.º y último módulo móvil) |
| Cliente / tenant | `run_vzla` — **CORPORACION FERRE 19** (`FERRE_N`, `id_enterprise=1`) |
| Dispositivo | Infinix X6728 · serial `14678405BR003855` · viewport **360×744** |
| App | `com.kiberno.denarioPremiumPro` — **v1.0 / db19** · `window.ng=TRUE` · `sqlitePlugin` OK |
| Playa | **LA TORTUGA** — `http://denariolatortuga.ddns.net:8081/PremiumWS/services/` (host de 641 POST del hook, `Set` de hosts = 1 elemento) |
| Usuario QA | `id_user=470` · `co_user='000208'` · 1.569 clientes |
| Fecha de ejecución | 2026-08-19 (09:05 – 09:30 VET) |
| CDP | `:9220` → PID **29842**. ⚠ El forward estaba **caído al arrancar** (ECONNREFUSED); se re-mapeó (ver "Patrones"). 0 cuelgues, 0 `TIMEOUT:`, 0 crashes |
| Watchdog | `moduleMs = 60 min` con `page` — nunca disparó |
| Resultado | **25 PASS · 0 FAIL · 1 SKIP · 8 N/A · 0 BLOCKED** (34 casos) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Menú COBROS con 4 botones: **COBRO** (180,107) · **ANTICIPO/PREPAGO** (180,176) · **RETENCIÓN** (180,245) · **BUSCAR** (180,314). Sin IGTF ni 25 % IVA. Entrada al módulo **2,3 s** |
| DM-COB-002 | ✅ PASS | 5 tabs; `default` habilitada y `documentos/pagos/total/adjuntos` **`disabled=true`**; `#clienteSelect` vacío; Guardar/Enviar `disabled`. Form abre en **2,3 s** |
| DM-COB-004 | ✅ PASS | Cliente `006540` seleccionado → tras llenar Comentario las **4 tabs habilitan en el mismo tick**; Guardar pasa a habilitado |
| DM-COB-006 | ✅ PASS | 🔑 **`requiredComment` SÍ APLICA EN COBROS.** Con cliente elegido y comentario vacío: `ion-input` `required=true` + `ion-invalid` + literal **"¡Campo Obligatorio!"**, 4 tabs `disabled`, Guardar/Enviar `disabled`. Modelo: `collectService.requiredComment=true`, `validComment=false→true` |
| DM-COB-007 | ✅ PASS | Tab Documentos: **11 filas** (= 11 FACT de `006540` en nube) + leyenda **Vigente / Vencido / A favor**. Columnas: Seleccione, Pago Parcial, Tipo, Nro. documento, Moneda del documento, Días de vencimiento, Monto base, Monto IVA, Monto Total, Saldo, Fecha del documento, Fecha de vencimiento, Comentario |
| DM-COB-008 | ✅ PASS | Checkbox de `FACT50039415` → `montoTotalPagar` **0 → 131,17** (= saldo exacto del documento) |
| DM-COB-009 | ✅ PASS | `#eventModal` "Seleccione método de cobro…" con **Efectivo · Depósito · Transferencia · Otros · Pago Móvil** — **SIN Cheque** ✅ coherente con `colletionPayment="true-false-true-true-true-true"` |
| DM-COB-012 | ✅ PASS | Monto 100,00 < 123,17 → `Diferencia US$: -23,17` **`style="color: red"`**; monto 123,17 → `Diferencia US$: 0,00` **`style="color: blue"`** |
| DM-COB-014 | ✅ PASS | Tab Total: tabla `Tipo \| Nro. Doc. \| Monto Doc. \| Retención IVA \| Retención ISLR \| Monto Pago` → `FACT \| FACT50039415 \| 131,17 \| 5,00 \| 3,00 \| 123,17`; `Total Efectivo: US$ 123,17`; `Nro. Recibo: REC-COB-001` |
| DM-COB-015 | ✅ PASS | `Total General US$: 123,17` visible al final del Tab Total |
| DM-COB-016 | ✅ PASS | Tab Adjuntos con **3 acordeones**: `images` (BUSCAR FOTO / TOMAR FOTO) · `file` (Subir Archivo) · `sign` (Firma / Borrar). **No se tocó ningún botón de cámara** (instrucción QA) |
| DM-COB-018 | ✅ PASS | Botón **Guardar del header** (267,32) → alert `Denario Cobros` / **"El Cobro se ha guardado"** `[Aceptar]`. Ejercido en el cobro desechable (cliente + comentario, sin documentos) |
| DM-COB-019 | ⏭ **SKIP** | **Motivo explícito: `requiredCollectionAttachments/Anticipo/Retention = true` ⇒ el envío exige adjunto. Instrucción directa de la QA: NO usar mock de cámara, dejar los registros en Guardado para envío manual.** No se pulsó Enviar en ningún registro. Los 4 registros quedan **`st_delivery=3` / `id_collection=0`** ⇒ **BD-SAVED** |
| DM-COB-020 | ✅ PASS | Back (`img.fechaAtras`, 32,47) → modal `Denario Cobros`, **message vacío**, botones **`[Guardar y salir · Salir sin guardar · Cancelar]`** |
| DM-COB-021 | ✅ PASS | Cobro nuevo (cliente `005354` + comentario) → back → "Salir sin guardar": **`sqlite_sequence.collections` 4 → 4** (0 inserts) y la lista sigue en 3. Prueba negativa dura |
| DM-COB-022 | ✅ PASS | `app-cobros-list` con searchbar; **trash (`ion-button[color="danger"]`) solo en los Guardado**; el cobro `Por aprobar` (Ref 32993) no lo tiene. `filteredItems=5`, `pageSize=20` |
| DM-COB-024 | ✅ PASS | Reabrir el Guardado (click al 35 % del ancho / 40 % del alto): 5 tabs habilitadas, cliente y comentario íntegros, **Guardar Y Enviar habilitados** |
| DM-COB-026 | ✅ PASS | Trash (305,184) → alert **"¿Desea eliminar el Cobro?" `[Cancelar · Eliminar]`** → desaparece de la lista y de `collections`; **`seq` sigue en 4** ⇒ fue borrado, no reinsertado |
| DM-COB-028 | ✅ PASS | **ANTICIPO creado y Guardado.** Form de **4 tabs (sin Documentos)**, etiqueta **"Fecha Anticipo"**. Efectivo `REC-ANT-001` · 5,00 US$ → `co_type=1`, `docs=0`, `pagos=1` ✅ |
| DM-COB-029 | ✅ PASS | **RETENCIÓN creada y Guardada.** Form de **4 tabs (sin Pagos)**, etiqueta **"Fecha Retención"**. `FACT50030222` · comp. `98765432109876` · IVA 2,00 + ISLR 1,00 → `Monto total retenido US$ 3,00` → `co_type=2`, `docs=1`, **`pagos=0`** ✅. Envío ⏭ SKIP por adjunto |
| DM-COB-033 | 🚫 N/A | Selector Moneda del cobro (2.º `ion-select` de `app-cobro-general`) existe y llega `disabled=false`, pero **tiene 1 sola opción (`US$`)**. Tenant mono-moneda (`multiCurrency=false`, `hardCurrency=""`, `currencyLocal=true`/`currencyHard=false`). Pantalla abierta y medida |
| DM-COB-034 | 🚫 N/A | **No existe selector "Moneda documento"** en Tab Documentos (`app-cobro-documents ion-select` → `[]`) y los documentos cargan solos. Mono-moneda. Pantalla abierta y medida |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` **medido en el modelo vivo** y **sin botón IGTF en el menú**; 0 menciones de IGTF en Tab Documentos y Tab Total; `montoIgtf=0`. Ver dictamen abajo |
| DM-COB-037 | 🚫 N/A | `userCanCollectIva=false` en el modelo y **sin botón "25 % IVA"** en el menú de cobros. Pantalla abierta y medida |
| DM-COB-038 | ✅ PASS | Back → **"Guardar y salir"** → alert **"El Cobro se ha guardado"** → el cobro aparece en BUSCAR con `Estatus: Guardado`. Ruta usada para persistir 3 de los 4 registros |
| DM-COB-039 | 🚫 N/A | **No existe ningún control de tasa**: no hay `#manualRateInput`, no hay 3.er `ion-select`, y el único `ion-button` del Tab General es **"Fecha Cobro"** (no "Fecha tasa"). Ver dictamen abajo |
| DM-COB-040 | ✅ PASS | Método **Depósito** → `ion-item.bank-picker-trigger` → **`#bankPickerModal` con 15 cuentas** → `DEL SUR - 01570042473742206372` → Nro. Depósito `9988776655` + Monto 10,00 → **`Diferencia US$: 0,00` en AZUL** |
| DM-COB-041 | ✅ PASS | Retención por documento (variante **FIJA**, `dynamicRetentions=false`): comp. 14 díg. → habilita Fecha Comp Ret + IVA + ISLR → IVA 5,00 + ISLR 3,00 → **Tab Pagos "Monto total a pagar US$: 123,17"** = 131,17 − 8,00 ✅ |
| DM-COB-042 | ✅ PASS | 🟢 **NO reproduce el FAIL conocido de "vuelve al bruto".** Guardar → BUSCAR → reabrir: Tab Pagos sigue en **123,17** (no 131,17) y el Tab Total conserva `Retención IVA 5,00 / ISLR 3,00 / Monto Pago 123,17` + `Nro. Recibo REC-COB-001` |
| DM-COB-043 | ✅ PASS | Extiende 012: el color cambia en ambos sentidos con documento seleccionado y método activo (rojo −23,17 → azul 0,00) |
| DM-COB-044 | 🚫 N/A | IGTF inexistente en este tenant (ver 036) |
| DM-COB-045 | 🚫 N/A | IGTF inexistente en este tenant (ver 036) |
| DM-COB-046 | ✅ PASS | Toggle **"Pago parcial"** del detalle → "Monto a pagar" pasa a editable (y se resetea a 0,00) → 10,00 sobre una factura de 14,97 → Tab Pagos **10,00** → Guardar y salir → reabrir: **sigue 10,00** (round-trip §9 OK). Local: `in_payment_partial='true'`, `nu_amount_paid=10`, `nu_amount_doc=14.97` |
| DM-COB-047 | 🚫 N/A | No hay control de **Fecha tasa** en el Tab General (solo "Fecha Cobro", que es la fecha del cobro). Mismo motivo estructural que 039 |

---

## Registros creados en sistema

> 🔴 **LOS 4 REGISTROS QUEDAN EN ESTADO "GUARDADO" EN EL DISPOSITIVO — LA QA DEBE ENVIARLOS A MANO
> ADJUNTANDO LA FOTO.** Ninguno se envió (`requiredCollectionAttachments/Anticipo/Retention = true` y la
> instrucción de la QA fue no usar mock de cámara). Verificado en nube: `collection WHERE id_user=470`
> sigue en **1 fila** (la pre-existente Ref 32993 del 18/08) ⇒ **nada viajó**.
>
> Para enviarlos: HOME → **Cobros** → **BUSCAR** → abrir el ítem → Tab **Adjuntos** → acordeón **Imágenes** →
> TOMAR FOTO / BUSCAR FOTO → **Enviar** (326,32).

| # | Ref | `co_collection` (epoch) | Tipo | Cliente | Documento | Monto | Detalle exacto de lo cargado | Estado |
|---|-----|--------------------------|------|---------|-----------|-------|------------------------------|--------|
| 1 | — (`id_collection=0`) | `1787144733832.0` | **Cobro normal** (`co_type=0`) | `006540` MARIBEL HAMMANI BESERENI | `FACT50039415` (saldo 131,17 US$) | **123,17 US$** | Comentario `Test-COB-004 smoke` · **Retención por documento**: Nro. Comp Ret `12345678901234`, Fecha Comp Ret `2026-08-19`, **Ret. IVA 5,00** + **Ret. ISLR 3,00** · Pago **Efectivo**, Nro. Recibo `REC-COB-001`, monto `123,17`, fecha `2026-08-19` · Diferencia **0,00 (azul)** | 🟡 **GUARDADO — falta adjunto + Enviar** |
| 2 | — (`id_collection=0`) | `1787145447779.0` | **Cobro normal** (`co_type=0`) | `006540` MARIBEL HAMMANI BESERENI | `FACT50009688` (saldo 14,97 US$) | **10,00 US$** | Comentario `Test-COB-046 parcial` · **Pago parcial ACTIVADO** (`in_payment_partial=true`), monto a pagar `10,00` sobre 14,97 · Pago **Depósito**, banco `DEL SUR - 01570042473742206372`, Nro. Depósito `9988776655`, monto `10,00` · Diferencia **0,00 (azul)** | 🟡 **GUARDADO — falta adjunto + Enviar** |
| 3 | — (`id_collection=0`) | `1787145827101.0` | **Anticipo / Prepago** (`co_type=1`) | `005354` GENESIS CASTILLO | — (sin documentos) | **5,00 US$** | Comentario `Test-COB-028 anticipo` · Pago **Efectivo**, Nro. Recibo `REC-ANT-001`, monto `5,00`, fecha `2026-08-19` · `docs=0`, `pagos=1` | 🟡 **GUARDADO — falta adjunto + Enviar** |
| 4 | — (`id_collection=0`) | `1787145921638.0` | **Retención** (`co_type=2`) | `006540` MARIBEL HAMMANI BESERENI | `FACT50030222` (saldo 41,27 US$) | **3,00 US$** | Comentario `Test-COB-029 retencion` · Nro. Comp Ret `98765432109876`, Fecha Comp Ret `2026-08-19`, **Ret. IVA 2,00** + **Ret. ISLR 1,00**, `Monto total retenido 3,00` · `docs=1`, **`pagos=0`** (por diseño: la retención no lleva método de pago) | 🟡 **GUARDADO — falta adjunto + Enviar** |
| — | — | `1787145695775.0` | Cobro normal | `005354` GENESIS CASTILLO | — | 0,00 | **Registro desechable de DM-COB-018/026 — ya ELIMINADO** desde la app (trash → "Eliminar"). No queda nada que enviar | 🗑 Eliminado |

**Estado local al cierre** (`window.sqlitePlugin`):
`collections` 5 filas (4 mías `st_delivery=3` + la pre-existente `st_delivery=1`) · `count(*) = count(DISTINCT co_collection)` = **5 = 5** (sin duplicados) · `pending_transactions` = **0** · `failed_transactions` = **0** · `sqlite_sequence`: `collections` 1→6, `collection_details` 1→4, `collection_payments` 1→4 (5 cobros creados, 1 borrado).

---

## Verificación BD (RUNTIME §10)

| Registro | Marca | Nube (`collection`, `id_user=470`) | Local | Conclusión guardado→enviado |
|----------|-------|-------------------------------------|-------|------------------------------|
| `1787144733832.0` | **BD-SAVED** | ausente (esperado) | `st_delivery=3`, `id_collection=0`, 1 detalle, 1 pago, fuera de cola | Guardado, **no se intentó enviar** (adjunto obligatorio · SKIP) |
| `1787145447779.0` | **BD-SAVED** | ausente | `st_delivery=3`, `id=0`, 1 detalle (`in_payment_partial='true'`), 1 pago `de` | idem |
| `1787145827101.0` | **BD-SAVED** | ausente | `st_delivery=3`, `id=0`, 0 detalles, 1 pago `ef` | idem |
| `1787145921638.0` | **BD-SAVED** | ausente | `st_delivery=3`, `id=0`, 1 detalle con retención, 0 pagos | idem |

**Baseline y diff (filtrados por `id_user=470`, `count(*)`, nunca `max(id)`):**
`collection WHERE id_user=470` → **1 antes / 1 después**. `max(id_collection)=32993` sin cambio.
⇒ **Cero envíos**, coherente con la política de adjuntos. `BD-N/A` para el cotejo campo-a-campo de nube (no hay filas nuevas que cotejar); el cotejo se hizo **contra la BD local**, campo a campo, y cuadra 1:1 con lo cargado por UI.

---

## Dictámenes solicitados

### 1. 🔴 IGTF — `userCanSelectIGTF=false` **MANDA**. IGTF = 🚫 **N/A ESTRUCTURAL**
Contradicción del perfil: `userCanSelectIGTF=false` vs `igtfDefault=true` + `disableCheckIGTF=false`.
**Medición en pantalla y en el modelo vivo (`collectService`):**
- `userCanSelectIGTF=false` · `igtfDefault=true` · `disableCheckIGTF=false` · `separateIgtf=false` · `montoIgtf=0`.
- **No hay botón IGTF** en el menú de cobros (solo COBRO / ANTICIPO / RETENCIÓN / BUSCAR).
- **0 menciones de "IGTF"** en `app-cobro-documents` ni en `app-cobro-total` de un cobro completo.
⇒ **`igtfDefault=true` es inerte cuando `userCanSelectIGTF=false`.** Mismo veredicto que `grupo_fiel-20260817`.
**2.ª confirmación de la regla ⇒ el par `igtfDefault`/`disableCheckIGTF` no debe marcarse ⚠️VERIFICAR en los YAML mientras `userCanSelectIGTF=false`.**
📌 Dato para el futuro: el tenant **sí tiene 1 documento tipo `IGTF`** (cliente `006831`, 28,45 US$). Si algún día se enciende `userCanSelectIGTF`, ese es el documento elegible.

### 2. 🔴 TASA — 🚫 **N/A ESTRUCTURAL por tenant mono-moneda.** El control **no existe**, ni `ion-input` ni `ion-select`
Contradicción del perfil: `historicoTasa=false` vs `mesesTasa=3`, y `canChangeRate=true` vs `enabledManualRate=false`.
**Medición directa del DOM del Tab General de un cobro con cliente cargado:**
- `app-cobro-general` tiene **exactamente 2 `ion-select`**: `[0]` Empresa (`disabled=true`, `value` = objeto, 1 opción) y `[1]` **Moneda** (`disabled=false`, `value` = objeto, **1 sola opción `US$`**). **No hay un 3.er select de tasa** (en `kron` sí lo había).
- **No existe `#manualRateInput`** ni ningún `ion-input` de tasa: los 3 `ion-input` del tab son `#clienteSelect`, `#currency` (**es "Responsable"**, no la moneda — el `id` engaña) y Comentario.
- El **único `ion-button`** del tab es **"Fecha Cobro"** (`19/8/2026, 9:05 a. m.`) — **no** es "Fecha tasa".
- Modelo: `changeRate=false`, `multiCurrency=false`, `haveRate=false`, `dateRate=""`, `disabledCurrency=true`, `currencySelector=false`, `enabledManualRate=false`, `canChangeRate=true`.
⇒ **`canChangeRate=true` y `mesesTasa=3` son inoperantes**: sin moneda alterna (`hardCurrency=""`) no hay conversión que tasar, así que la app no renderiza ningún control de tasa. Coherente con PEDIDOS, donde tampoco existe `#tasa`.
⇒ **DM-COB-039 y DM-COB-047 = N/A estructural probado en pantalla**, no N/A por dato.

### 3. 🔑 `requiredComment` — **SÍ APLICA, y COBROS es el ÚNICO módulo donde aplica** (pendiente CERRADO)
Serie completa de la corrida (6 módulos medidos): CLIENTES **N/A estructural** (no hay campo) · PEDIDOS **NO** (`requiredCommentOrder=false` manda) · DEVOLUCIONES **NO** · INVENTARIOS **NO** · VISITAS **NO** (`required=false`) · **COBROS SÍ**.
Evidencia dura en cobros: el `ion-input` de Comentario llega **`required=true`**, `ng-invalid`+`ion-invalid`, con el literal **"¡Campo Obligatorio!"** en pantalla; con el campo vacío las **4 tabs quedan `disabled`** y Guardar/Enviar también; al llenarlo, **todo habilita en el mismo tick**. Modelo: `collectService.requiredComment=true`, `validComment` `false→true`.
⇒ **2.ª confirmación del patrón de `grupo_fiel-20260817` ("aplica solo a cobros"), ahora en otro tenant y otra playa.**
📌 `textCommentMaxLength=255` y el input rotula `Mín. 0 - Máx. 255 caracteres` **contra `longitudComentario=250`** del dump — el tope lo fija la constante de producto, no la VG (patrón ya conocido, no es incumplimiento).

### 4. 🔴 `nu_amount_total = 0` — **NO REPRODUCE** en registros nuevos
Baseline de nube: **30 de 2.703** cobros con `nu_amount_total=0` y `nu_amount_final>0`; el último es del **2026-08-17 23:55**. Sin cambio al cierre del módulo (30/2.703).
**Los 4 registros creados hoy traen `nu_amount_total` POBLADO y coincidente con `nu_amount_final`:**
`123.17 / 123.17` · `10 / 10` · `5 / 5` · `3 / 3`. El desechable trajo `0 / 0`, que es **correcto** (no tenía documentos ni pagos).
Además, el único cobro pre-existente del usuario QA en nube (Ref **32993**, 18/08) trae `nu_amount_total=227.00` con `nu_amount_final=227.48` ⇒ **poblado**.
⇒ Por el **gate §4.b**: **no es defecto de la release en prueba**; queda como **observación sobre datos históricos, sin reproducciones desde el 17/08/2026**. ⚠ Acotación honesta: los 4 registros quedaron **Guardados**, no enviados, así que la comprobación es sobre el valor que la app **calcula y persiste localmente** — que es exactamente el que viaja en el payload. Una confirmación definitiva requiere que la QA envíe uno y se relea `collection.nu_amount_total` en nube.

---

## Hallazgos

### H-1 · 🟠 S3 — En un cobro **NUEVO**, el botón **Guardar** del header se deshabilita al seleccionar el primer documento y **no vuelve a habilitarse nunca**

**Reproduce en la versión en prueba** (registro creado hoy, 3 veces: cobros A, B y el anticipo). Gate §4.b superado.

| Paso | `imagenGuardar.disabled` | `imagenEnviar.disabled` |
|---|---|---|
| Form recién abierto | `true` | `true` |
| Cliente seleccionado | `true` | `true` |
| **Comentario llenado** | **`false`** ✅ | `true` |
| **Documento marcado (checkbox)** | **`true`** 🔴 | `true` |
| Retención cargada | `true` 🔴 | `true` |
| Pago completo, `Diferencia 0,00` | `true` 🔴 | **`false`** |
| Nro. Recibo llenado | `true` 🔴 | `false` |
| Monto puesto a 120,00 (diferencia ≠ 0) | `true` 🔴 | `false` |
| **Reabierto desde BUSCAR (Guardado)** | **`false`** ✅ | `false` |

- Origen en el modelo: `collectService.disableSavedButton` queda en `true` y no vuelve a `false`; `disableSendButton` sí baja a `false`. El binding es `[disabled]="collectService.disableSavedButton"` (`cobros-header.component.html:25`), alimentado por el `Subject` `collectValidToSave` (`cobros-header.component.ts:171`). El único emisor que lo pondría en `true` es `onCollectionValidToSave(true)` (`collection-logic.service.ts:3023`), que no vuelve a emitirse tras seleccionar documento.
- **No es un bloqueo total**: el registro **sí se puede guardar** por el dirty-guard (back → **"Guardar y salir"**), que llama `saveCollection(...)` con `stDelivery=3` (`cobros-header.component.ts:100`). Por eso DM-COB-018 y DM-COB-038 salen PASS.
- **Impacto real**: un vendedor que quiera dejar un cobro con documentos como borrador ve el botón Guardar apagado y solo puede salir por atrás. Con `requiredCollectionAttachments=true` —como en este tenant— **guardar borradores es el flujo normal**, así que el impacto no es marginal.
- **No confundir con** el `disableSavedButton=true` legítimo tras Guardar (anti-doble-guardado).

### H-2 · 🔵 S4 (cosmético) — El acordeón de **Retención** del Tab Total rotula `Fecha del documento` con la **fecha del comprobante de retención**, no la de emisión de la factura
En el cobro `co_type=2` sobre `FACT50030222` (emitida el **22/10/2025**), el acordeón imprime `Fecha del documento: 2026-08-19`, que es el valor de `da_voucher` (Fecha Comp Ret). La fecha de emisión real sí se muestra correcta en el modal de detalle (`Fecha emisión factura: 2025-10-22`). Es un rótulo equivocado, no un dato mal guardado (`collection_details` guarda ambas correctamente). Hermano del hallazgo de `globalmp-20260730` (timestamp ISO crudo en ese mismo acordeón).

---

## Observaciones (no defectos)

1. **Sin guarda de GPS perceptible en COBROS.** El módulo abre en **2,3 s** y el formulario de cobro en **2,3 s** más — contra pedidos >20-30 s, devoluciones 43 s, inventarios ~87 s, visitas 6,8 s. `userMustActivateGPS=true` está activo (`collectService.userMustActivateGPS=true`) y la coordenada se cachea 60 s, pero **cobros no paga el fix**. Refuerza la hipótesis H-2 de VISITAS: **el tiempo escala con el volumen de datos que carga el form al abrir, no con el GPS** — el form de cobro nace vacío (los documentos se cargan al elegir cliente, ya con la coordenada caliente).
2. **Los 4 documentos tipo `AJPM` de `006540` (635,20 US$ cobrables en nube) NO se listan en Tab Documentos** — solo los 11 `FACT`. No hay oráculo en el smoke sobre qué tipos de documento son cobrables desde el móvil, así que queda como **observación abierta**, no como defecto. Verificable con desarrollo: ¿`AJPM` es un tipo excluido por diseño?
3. **`userCanAddRetention=false` no impidió cargar retención.** La retención por documento (`retencion=true`, variante FIJA) funcionó completa, y el Tab Total del cobro tipo Retención muestra un botón **"AGREGAR RETENCIÓN"**. La VG parece gobernar otra cosa (probablemente la variante `dynamicRetentions`). **No se marcó N/A por esa VG**: la pantalla se abrió y la funcionalidad está presente.
4. **`clientBankAccount=false` + `currencyBank=true` confirmados en pantalla**: el `#bankPickerModal` lista **15 cuentas de la EMPRESA** (DEL SUR, VENEZUELA, PROVINCIAL, BANCARIBE ×2, BANESCO ×2, BANCA AMIGA ×2, BANCO NACIONAL DE CREDITO ×2, …), ninguna del cliente, y **sin filtrar por moneda**.
5. **Datos del tenant en movimiento entre el 18 y el 19/08.** Los documentos cobrables cambiaron mucho respecto de la tabla del perfil: `007554` 44→**60** docs (22.787,73 → **31.832,98**), `006831` 13→**45** FACT (+1 `IGTF` +3 `NDB`), `006510` 7→**20** (3.085,67 → **4.124,41**), `006540` 11 FACT (404,64) **+ 4 AJPM (635,20)**, `005354` 10 (348,30, sin cambio). **No fijar estas cifras en el YAML: descubrirlas en runtime.**
6. **El usuario QA ya NO tiene cero cobros.** Existe **Ref 32993** (`co_collection 1787087754197.0`, `co_type=0`, cliente `006715`, 227,48 US$, creado el 18/08 21:16 UTC), rotulado **"Por aprobar"** en la app y **sin trash**. Corrige la premisa del perfil (`modules.depositos.motivo_na`). Aun así **DEPÓSITOS sigue sin insumo**: ese cobro no es del vendedor en efectivo disponible y los 4 míos quedan en Guardado.
7. **`PRD-BUSCADOR-NO-REPUEBLA` no aplica en COBROS** (3.ª playa): el buscador del `#clienteSelectModal` filtra **con Enter** y repuebla al vaciar; el de `app-cobros-list` no se ejerció con filtro.
8. **Rotulado de tipo en la lista**: el `innerText` del `ion-item` termina en `Cobros` / `Anticipo` / `Retención` — permite identificar el `co_type` sin abrir. Reconfirma `[difranca-20260807]`.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El forward de CDP puede estar CAÍDO al arrancar un módulo aunque el PID siga vivo** | universal | `connectOverCDP` dio `ECONNREFUSED :9220` con la app corriendo y el socket `webview_devtools_remote_29842` presente. **Receta de 3 comandos que lo resolvió a la 1.ª:** `adb shell cat /proc/net/unix \| grep -o "webview_devtools_remote_[0-9]*"` → `adb forward --remove tcp:9220; adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>` → `curl -s http://127.0.0.1:9220/json/version`. **Verificar el forward ANTES del primer `connectCdp`** ahorra un `CDP-DOWN:` y un BLOCKED falso |
| 🔴 **En un cobro NUEVO, `imagenGuardar` se apaga al marcar el 1.er documento — la ruta de guardado es el dirty-guard** | universal (código de producto) | Ver H-1. **Receta operativa para cualquier agente de cobros que deba dejar registros en Guardado: back (`img.fechaAtras`, filtro `width>0 && x<100`) → alert `[Guardar y salir · Salir sin guardar · Cancelar]` → click EXACTO en `Guardar y salir` → alert `"El Cobro se ha guardado" [Aceptar]`.** Funcionó 3/3 (cobro normal, cobro con parcial, anticipo, retención) |
| **`#clienteSelectModal` de COBROS filtra SOLO con Enter** | cliente (build v1.0/db19 La Tortuga) | Teclear el código deja los 50 ítems; **`Enter` reduce a 1**. Luego `scrollIntoView` del `<p>` del nombre → re-leer rect → `mouse.click` (167,182). 5/5 sin reintentos, con 1.569 clientes y **sin paginar** |
| **El `ion-input` de Comentario de COBROS se localiza por `input.required===true`, no por posición** | universal | El Tab General trae `#clienteSelect`, `#currency` (**que es "Responsable"**, el `id` engaña) y el Comentario **sin `id`**. `Array.from(gen.querySelectorAll('ion-input')).filter(e => e.querySelector('input').required)[0]` lo aísla siempre |
| **Retención por documento — variante FIJA: el discriminador es `dynamicRetentions`** | universal | `dynamicRetentions=false` ⇒ campos fijos (Nro. Comp Ret → habilita Fecha Comp Ret + IVA + ISLR). Con `true` es el selector "Seleccione Retención" de `[latino_cosmetica-20260714]`. **Leer `collectService.dynamicRetentions` antes de mapear el modal** evita el BLOCKED de aquella corrida |
| **En el modal de detalle, el `Nro. Comp Ret` = único `ion-input` editable con `value===''`** | universal | El `closest('ion-row')` envuelve TODO el modal ⇒ buscar por texto de la fila **falla**. Filtrar `!readOnly && !disabled && value===''` lo aísla a la primera. Tras llenarlo, los nuevos campos quedan en los índices `[10]=#inputCalendar` (Fecha), `[11]=IVA`, `[12]=ISLR` |
| **`Fecha Comp Ret` NO bloquea el Guardar del detalle** | cliente | Con IVA+ISLR cargados y la fecha **vacía**, el `.botonAddVerde` ya habilita. Se llenó igual (calidad del dato). Rango del `ion-datetime`: `min 2000-01-01` → `max` = hoy |
| **Campos de monto: técnica de centavos acumulativos confirmada (4.ª playa)** | universal | `input.focus()` por coords → **Backspace ×14** → `keyboard.type('<solo dígitos>')` → `blur`+`ionBlur`. `5,00`→`"500"`, `123,17`→`"12317"`, `10,00`→`"1000"`. **La coma rompe la acumulación.** Aplica a Monto pago, IVA/ISLR, pago parcial y Monto depósito |
| **Toggle "Pago parcial": al activarlo, `Monto a pagar` se RESETEA a `0,00`** | universal | Además `Dif. Devolución/Faltante` pasa a `disabled=true`. El input parcial = **último `ion-input` editable** del modal. Confirma y precisa `[ins-2611][gmp-2611][ins-2622]` |
| **`#bankPickerModal` en COBROS (5.ª confirmación)** | universal | `ion-item.bank-picker-trigger` (Pointer down/up + `mouse.click`) abre el modal con 15 cuentas de la empresa. **No** es `ion-select`. Sin `#eventModal` residual, cargó la lista completa a la 1.ª |
| **Acordeón de método de pago: `grp.value = '<efectivo0\|deposito0>'` + `ionChange`** | universal | El click en el header no siempre expande. Tras expandir, los inputs visibles son `[0] Nro. Recibo / Nro. Depósito` y `[1] Monto` |
| **`sqlite_sequence` como prueba negativa de "Salir sin guardar" en COBROS** | universal | `collections` **4 → 4** tras llenar cliente + comentario y descartar. 3.er módulo donde el oráculo cierra el caso sin ambigüedad. Y `seq` **estable tras el borrado** (4→4) prueba delete real, no delete+reinsert |
| **Etiqueta de fecha del Tab General — las 3 variantes medidas en un solo tenant** | universal | `co_type=0` → **"Fecha Cobro"** · `co_type=1` → **"Fecha Anticipo"** · `co_type=2` → **"Fecha Retención"**. Confirma `[el_palmar-20260805]`+`[kron-20260817]`: **no usar la etiqueta como selector estable** |
| **Selector de empresa en COBROS: variante "objeto completo" (8.ª confirmación)** | universal | Sin `formcontrolname`, `disabled=true`, `value` = objeto de 9 claves, `ng-invalid=false`, 1 opción, shadowRoot rotulando `CORPORACION FERRE 19` (`lb_enterprise`). **Nada que setear** |
| **Alerts de COBROS — reparto exacto medido** | cliente | Dirty-guard `[Guardar y salir · Salir sin guardar · Cancelar]` (message **vacío**, title `Denario Cobros`) · Guardado `[Aceptar]` · Borrado `[Cancelar · Eliminar]`. **Todos en español, capitalizados.** El recorrido `['Aceptar','OK','Eliminar']` por igualdad exacta case-insensitive + `width>0` resolvió **los ~12 alerts del módulo sin un solo reintento** |
| **Namespace `window.__qaCOB` (3 letras)** | universal | Ya estaban tomados `__qaCLI`, `__qaPED`, `__qaDEV`, `__qaINV`, `__qaVIS`, `__qaPRO`. `window.__qaH` llegó **inexistente** (no vacío: ni siquiera figura en `Object.keys(window)`), y `__qaDataHook=true` con 616 payloads ⇒ **hook heredado consumido sin reinstalar** (641 al cierre, 0 duplicados) |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Resumen técnico

- **34 casos · 25 PASS · 0 FAIL · 1 SKIP · 8 N/A · 0 BLOCKED.** 0 cuelgues de CDP, 0 crashes de la app, 0 reintentos de selector más allá del techo. Wall-clock del módulo ≈ **26 min**; **28 llamadas** a `browser_run_code_unsafe`.
- **4 registros creados y dejados en Guardado** (cobro normal con retención, cobro con pago parcial + depósito, anticipo, retención) + 1 desechable creado y eliminado. **Ninguno enviado** — instrucción explícita de la QA por adjunto obligatorio.
- **Los 3 pendientes del perfil quedan cerrados:** IGTF → **N/A estructural, `userCanSelectIGTF` manda**; TASA → **N/A estructural, el control no se renderiza en tenant mono-moneda**; `requiredComment` → **aplica SOLO a cobros** (6.º y último módulo medido).
- **El defecto `nu_amount_total=0` no reproduce** en ninguno de los 4 registros nuevos ⇒ baja a observación histórica (último caso 17/08/2026).
- **1 defecto nuevo (S3):** el botón Guardar del header se apaga al seleccionar el primer documento de un cobro nuevo y no vuelve; el guardado solo es posible por el dirty-guard. **1 cosmético (S4):** rótulo `Fecha del documento` en el acordeón de retención.
- **Depósitos sigue sin insumo:** los 4 cobros quedan en Guardado y el único cobro en nube del usuario QA está "Por aprobar". No se encadenó.
- App devuelta a **HOME**, 0 alerts, 0 modals, 0 loadings.
