# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA), empresa única `00001` |
| Dispositivo | Infinix HOT 60i (X6728) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` · `sqlitePlugin` OK |
| Playa | **El Yaque** — `denarioelyaque.ddns.net:8081` |
| Usuario | johana · `co_user '003'` · `idUser 463` |
| `modules.depositos.aplica` | **true** (efectivo habilitado en `colletionPayment`) |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |

> Corrida de COBROS fue solo-lectura ⇒ se depositó contra un **cobro existente** (Ref 32) por decisión de QA.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | `app-depositos` visible con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | Form abre con Empresa/Moneda/Banco/Fecha Depósito/Fecha Doc/Nro. Plantilla/Comentario; `imagenGuardar` e `imagenEnviar` **`disabled=true`**; tabs Cobros/Total/Adjuntos `disabled` |
| DM-DEP-004 | ✅ PASS | Banco por **popover** (4 cuentas) → BANESCO `idBankAccount 387` / `coBank 7738`; cuenta `01340009180093087738` **autollenada**; las 3 tabs habilitaron |
| DM-DEP-005 | ✅ PASS | `fechasModal` con `ion-datetime presentation=date`; `dt.value='2026-08-17'` + `ionChange` → `#confirm-button` ("Aceptar") cerró limpio; Fecha Doc = 17/8/2026 |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `PL-QA-0817` + Comentario `QA smoke depositos 20260817`; Guardar/Enviar habilitados |
| DM-DEP-009 | ✅ PASS | Alert **"Denario Depósito · El Depósito se ha guardado"** `[Aceptar]`; local `deposits` fila `co_deposit 1786981585334.0`, `st_deposit=3`/`st_delivery=3` → `BD-SAVED` |
| DM-DEP-010 | ✅ PASS | Lista `app-deposito-list` renderizó **limpia**: 2 ítems, 0 `ion-spinner`, 0 `ion-loading`. Defecto conocido **NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabrir el Guardado: round-trip **1:1 exacto** (ver Oráculo §9 abajo); editable, con Guardar/Enviar |
| DM-DEP-017 | ✅ PASS | **3 alertas** → *"Depósito nro. 3 enviado exitosamente"*; local `id_deposit=3`, `st_deposit=1`, `st_delivery=1`, cola 0 → `BD-OK` |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar: lista limpia (Ref 3 Enviado 8000 · Ref 1 Enviado 95000), 0 spinner. Defecto conocido **NO reprodujo (2.ª vez)** |
| DM-DEP-019 | ✅ PASS | Enviado = **solo lectura**: 3 `ion-select` y 3 `ion-input` `disabled=true`, ambas fechas `disabled`, **sin** `.imagenGuardar`/`.imagenEnviar`, **sin** `ion-button[color=danger]`, y **la tab Cobros desaparece** (quedan General/Total/Adjuntos) |
| DM-DEP-020 | 🚫 **N/A por datos** | No quedó ningún depósito en **Guardado** que borrar: el único depositable BS (cobro 32) se consumió en DM-DEP-017, y en USD **no hay cuenta bancaria** (0 opciones). Ver "N/A razonado" |

---

## Registros creados en sistema

| Ref (`id_deposit`) | epoch (`co_deposit`) | Banco / cuenta | Nro. Plantilla | Monto | Moneda | Tasa | Cobro vinculado | Estado |
|---|---|---|---|---|---|---|---|---|
| **3** | `1786981585334.0` | **7738 BANESCO** · `01340009180093087738` | `PL-QA-0817` | **8.000,00** | BS | 771,07 | **Ref 32** — GRUPPO SAPORI DI CALABRIA, CA | ✅ **Enviado** (`st_deposit=1`) · `BD-OK` |

Comentario: `QA smoke depositos 20260817` · Fecha Doc `2026-08-17` · Empresa `00001` / `id_enterprise=1` · coordenada `11.0490132,-63.8649857`.

---

## Verificación BD

**Baseline (nube, al abrir el módulo):** `count(*)=2`, `max(id_deposit)=2`.
⚠ **El brief decía 1 y 1** — a las 15:40 ya existía un `id_deposit=2` (13.000,00 BS, `nu_document='pl00'`, cobro 34) creado fuera de este módulo. Se rehizo el baseline antes de tocar la app; **el depósito de esta corrida es el `id_deposit=3`**, no el 2.

**Diff de baseline tras Enviar — fila nueva única (`id_deposit=3`), cotejo campo a campo:**

| Campo | UI / payload | Nube | ✓ |
|---|---|---|---|
| `co_deposit` | `1786981585334.0` | `1786981585334.0` | ✓ |
| `nu_amount_doc` | 8000 | `8000.0000` | ✓ |
| `nu_document` | `PL-QA-0817` | `PL-QA-0817` | ✓ |
| `da_document` | 2026-08-17 | `2026-08-17T04:00:00Z` (= 17/08 00:00 local UTC-4) | ✓ mismo día |
| `co_bank` / `nu_account` | 7738 / `01340009180093087738` | idem | ✓ |
| `tx_comment` | `QA smoke depositos 20260817` | idem | ✓ |
| `nu_value_local` (tasa) | 771,07 | `771.0700` | ✓ |
| `co_currency` | BS | BS | ✓ |
| `co_enterprise` / `id_enterprise` | `00001` / 1 | idem | ✓ |
| `st_deposit` | Enviado | `1` | ✓ |

**Vínculo con el cobro — 3 evidencias coherentes:**
- Payload: `collectionIds:[32]` · `depositCollect:[]` (vacío).
- Nube: `collection.id_deposit = 3` en el `id_collection=32`.
- Local: `deposit_collects` → `co_deposit 1786981585334.0` / `id_collection 32` / `nu_total_deposit 8000` sobre `nu_amount_total 10000`.

🔴 **`deposit_collection_payment` tiene 0 filas para los 3 depósitos del cliente** (no solo el mío). Confirma `[ins-2622]`: **esa tabla N:M no se puebla nunca** — la instrucción del smoke de "cotejar la hija `deposit_collection_payment`" **no es aplicable**; el oráculo correcto es `collection.id_deposit` + `collectionIds` del payload + `deposit_collects` local.

**Local (`window.sqlitePlugin`, `local-query.js` inoperante por falta de `sqlite3` en el device):**
`deposits` → `id_deposit=3`, `st_deposit=1`, `st_delivery=1` · `pending_transactions`=0 · `failed_transactions`=0.

**Conclusión guardado→enviado:** ✅ lo guardado se envió. Sync a la nube **INMEDIATA** (la fila estaba en nube en el primer poll). Marca **`BD-OK`**.

### ✅ Oráculo del efectivo — 3.ª confirmación, no es defecto
El cobro **Ref 32** totaliza **10.000,00 BS** (8.000 efectivo + 2.000 pago móvil) y la UI ofreció literalmente *"Monto Cobro 10000 / **Monto Depósito 8000**"*, depositando **8.000,00** = exactamente la porción en **EFECTIVO**. Coherente con Ref 1 (295.639,02 → 95.000) y Ref 2 (13.548,56 → 13.000). **Se deposita el efectivo, no el total.**

### Oráculo de persistencia §9 — round-trip Guardar → reabrir
| Campo | Guardado | Al reabrir desde BUSCAR |
|---|---|---|
| Empresa | GRUPO FIEL, S.A. (GR | GRUPO FIEL, S.A. (GR ✓ (**no revirtió** — contrasta el quirk de jerez) |
| Moneda | BS | BS ✓ |
| Banco | BANESCO - *** 3087738 | idem ✓ |
| Cuenta | `01340009180093087738` | idem ✓ |
| Nro. Plantilla | `PL-QA-0817` | idem ✓ |
| Fecha Doc | 17/8/2026 | idem ✓ |
| Comentario | `QA smoke depositos 20260817` | idem ✓ |
| Monto / cobro | 8000 BS / Ref 32 | idem ✓ |

**0 divergencias silenciosas.**

---

## Preguntas cerradas en esta corrida

### 🔑 ¿La app exige el Nº de planilla? → **NO**
Medición del par antes/después: con **Banco + Fecha Doc + cobro marcado** y **Nro. Plantilla VACÍO + Comentario VACÍO**, `imagenGuardar` e `imagenEnviar` pasaron de `disabled=true` a **`disabled=false` en el mismo tick**. Ninguno de los dos `ion-input` trae `required=true`.
⇒ El `nu_document` **vacío** del depósito Ref 1 que QA cargó a mano **no es un dato perdido: la app lo permite**. Es **observación de validación**, no FAIL (el guión no exige que sea obligatorio). Recomendación a producto: si el Nº de comprobante es requisito de negocio para conciliar con el banco, hoy no hay nada que lo impida quedar vacío.

### 🔑 `requiredComment` → **NO aplica a DEPÓSITOS** (último casillero cerrado)
El `ion-input` "Comentario:" llega `required=false` y Guardar/Enviar habilitan con él vacío.
⇒ **Mapa cerrado en grupo_fiel: `requiredComment` aplica SOLO a COBROS** — no a devoluciones, no a inventarios, **no a depósitos**.

### 🔑 ¿El hook capturó el payload de `deposit`? → **SÍ**
`POST http://denarioelyaque.ddns.net:8081/PremiumWS/services/depositservice/deposit`, **1 sola vez y con body completo**, volcado a `_payloads.jsonl`.
⇒ **Cierra el gap de La Tortuga v6.6.18** (donde `deposit` no se capturaba): en El Yaque v1.0/db19 el hook `Capacitor.nativePromise` **sí** intercepta `deposit`. Amplía `reference_qa_payload_capture_gap`.

### 🔑 Defecto conocido DM-DEP-018/019/020 (`deposit.service.ts`) → **NO REPRODUJO**
Dos accesos a BUSCAR (uno tras Guardar, otro tras Enviar), ambos con lista completa, **0 `ion-spinner` visibles y 0 `ion-loading`**, sin "Por favor espere…" colgado. Sigue siendo intermitente (como en `el_valle-20260728` y `latino_cosmetica-20260729`).

### N/A razonado de DM-DEP-020
El borrado sólo se ejercita sobre un ítem **Guardado**, y tras DM-DEP-017 no quedó ninguno. Se intentó fabricar un segundo depósito:
- **BS**: Tab Cobros quedó **vacío** (0 `ion-checkbox`, pie *"Monto total depositado 0 BS"*, render limpio sin loader) — el cobro 32 ya fue consumido.
- **USD**: al elegir la moneda USD el `selectbanco` se resetea a `{}` y ofrece **0 cuentas** (las 4 cuentas del cliente son `coCurrency:"BS"`, **incluida la rotulada "VENEZUELA USD$"**), y las 3 tabs vuelven a `disabled` ⇒ el cobro 31 (100 USD) es **estructuralmente no depositable** en este cliente.

⇒ **N/A por datos, no FAIL.** Lección de secuenciación (repite la de `latino_cosmetica-20260729`): **con un solo depositable en el pool, DM-DEP-020 y DM-DEP-017 compiten por el mismo dato**. Para cubrir ambos hay que llegar al módulo con ≥2 cobros en efectivo, o ejecutar el borrado **antes** del envío sobre un depósito descartable.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`deposit_collection_payment` NO se puebla — corregir el guión del smoke** | universal | 0 filas para los 3 depósitos de grupo_fiel, incluidos los cargados por QA fuera de la app. `smoke-depositos.md` instruye cotejar `pagos` en esa hija y **siempre dará 0** ⇒ falso `BD-MISMATCH`. **Oráculos válidos: `collection.id_deposit` (nube), `collectionIds` del payload, y `deposit_collects` (local)**. 2.ª confirmación de `[ins-2622]`. |
| 🔴 **DEPÓSITOS NO tiene `<modulo>LogicService`** | universal | `ng.getComponent(document.querySelector('app-depositos'))` expone `depositService, autoSend, services, synchronizationServices, messageService, subs` — **ninguna clave termina en `LogicService`**. La receta graduada en inventarios (`[grupo_fiel-20260817]`) **no es universal**: buscarla por `Object.keys` y, si no está, caer a los `disabled` de los botones y al DOM. |
| ✅ **La moneda del depósito filtra bancos; con 0 cuentas la moneda es un callejón sin salida** | universal | `currencyBank=false`: BS → 4 cuentas; **USD → 0**. Al cambiar la moneda `selectbanco.value` vuelve a `{}` y **las 3 tabs vuelven a `disabled`** (confirma `[latino_cosmetica-20260729]`, ahora en El Yaque v1.0). ⇒ **elegir moneda ANTES que banco, siempre.** |
| ⚠ **`coCurrency` de una cuenta puede contradecir su NOMBRE** | cliente (grupo_fiel) | La cuenta rotulada **"VENEZUELA USD$ - *** 0499213"** (`coBank 9213-USD`, `idBankAccount 388`) tiene `coCurrency:"BS"` y aparece **en la lista de BS**. Juzgar la moneda de una cuenta por su etiqueta lleva a un falso "el filtro de moneda está roto". **Leer `coCurrency`, no el `naBank`.** |
| ✅ **Ambos `ion-select` de DEPÓSITOS abren `ion-popover` (1 click)** | cliente/build | Moneda (2 opciones) y Banco (4 opciones) → `ion-popover` con `ion-item`, resueltos con **1 click** cada uno. **Ningún `ion-alert` con radios en este módulo**, a diferencia de pedidos/cobros/devoluciones en la misma corrida — 4.ª evidencia de que **la variante la fija el CONTROL**, y de que hay que probar popover primero. |
| ⚠ **Los 3 `ion-select` de DEPÓSITOS llegan con `value` OBJETO** | universal | Empresa (`disabled=true`, objeto de 9 claves), Moneda (objeto `{idCurrencyEnterprise,…}`), Banco (objeto `{idBankAccount, coBank, nuAccount, coCurrency, naBank}`). ⇒ **la asignación programática por string está descartada de entrada** en este form; ninguno tiene `formcontrolname`. |
| ✅ **Empresa `disabled=true` que SÍ rotula el nombre — matiza el quirk de CLIENTES** | universal | En DEPÓSITOS el select de empresa llega `disabled=true` **pero con el objeto completo como `value` y el shadowRoot rotulando "GRUPO FIEL, S.A. (GR"**. En CLIENTES del mismo cliente/build llegaba `disabled=true` con **`value=null` y "Seleccione..."**. ⇒ el rótulo "Seleccione…" **no es** consecuencia del `disabled`: es de **ese** formulario. En ambos casos la regla operativa es la misma: **`disabled=true` ⇒ no tocar nada.** |
| ✅ **El rect de Fecha Doc NO siempre se desplaza al elegir banco** | acota `[el_palmar-20260805]` | En el_palmar Fecha Doc bajaba de `y=477` a `y=348` al aparecer el input "Banco:". En grupo_fiel **se mantuvo en `y=543`**. ⇒ la regla sigue siendo **releer el rect**, pero el desplazamiento no es un invariante que se pueda predecir. |
| ✅ **Ítem de `app-deposito-list`: el tercio superior funciona; 3/3 aperturas al 1.er intento** | confirma `[el_palmar-20260805]` | Ítem 350×131. Click en `x=120, y=rect.y+16` con `{delay:150}` → `elementFromPoint` devuelve el `<p>` del texto y el detalle abre. Evita la papelera (`x≈300, y≈211`). |
| ✅ **Envío = 3 alertas con etiquetas MIXTAS** | cliente/servidor | (1) `Denario Depósito — El Depósito será enviado` **[Cancelar, Aceptar]** → (2) `Denario Premium — El Depósito será enviado` **[OK]** → (3) `Denario Premium — Depósito nro. 3 enviado exitosamente` **[OK]**. Guardado = `Denario Depósito — El Depósito se ha guardado` **[Aceptar]**. Recorrer `['Aceptar','OK']` por igualdad exacta resolvió los 4 alerts **sin un reintento**. |
| ✅ **Dirty-guard SÍ dispara vía CDP en El Yaque v1.0** | cliente | `img.fechaAtras` con form sucio → **"Denario Depósito"** `[Guardar y salir · Salir sin guardar · Cancelar]` con `.alert-message` **vacío** (el texto útil está en `.alert-title`). Confirma globalmp/el_palmar/latino_cosmetica y **contrasta jerez/dm-electronica** (que no disparaba). ⚠ igualdad exacta obligatoria: `/salir/i` matchea "Guardar y salir". |
| ⚠ **Inconsistencia cosmética de la Referencia del cobro — 2.ª confirmación** | universal | Tab **Cobros** muestra `id_collection` (**"32"**) y Tab **Total**, misma fila, `co_collection` (**"1786972513208.0"**). No altera el dato enviado (`collectionIds:[32]`). **Observación, no defecto.** Confirma `[el_palmar-20260805]`. |
| ⚠ **`app-message` conserva el mensaje del módulo ANTERIOR** | universal | Durante todo el módulo devolvió `Denario Inventarios / "¡EL Inventario se borro con exito!"` con `alertMessageOpen=false`, mientras los `ion-alert` reales de depósitos funcionaban perfecto. ⇒ **`appMsg()` sirve para probar que un click NO llegó, pero NO es oráculo de que la app no avisó** cuando el alert sí se renderiza. Leer siempre además el `ion-alert` visible. |
| ⚠ **La cabecera manda sobre `deposit_collects` local** | universal | En el depósito Ref 1 (bajado de la nube) `deposit_collects.nu_total_deposit` = **295.639,02** (el TOTAL del cobro) mientras la cabecera `deposits.nu_amount_doc` = **95.000** (el efectivo). En el creado en el device ambos coinciden (8000/8000). ⇒ **cotejar el monto por la cabecera**, no por la hija local, o se levanta un falso mismatch del oráculo del efectivo. |
| ⚠ **Los depósitos históricos de la nube no bajan completos al device** | confirma `[el_palmar-20260805]` | La nube tiene 3 depósitos (1, 2, 3); la lista BUSCAR y la tabla local `deposits` muestran **solo 1 y 3** — el `id_deposit=2` (creado hoy fuera del device) **no está**. **No confundir con defecto de render.** |
| ⚠ **`sqlite_sequence` no tiene fila para `deposits`/`deposit_collects`** | universal | `SELECT seq FROM sqlite_sequence WHERE name IN ('deposits','deposit_collects')` devolvió **`[]`** aun con filas en ambas tablas ⇒ **no usan AUTOINCREMENT**. El oráculo de `sqlite_sequence` (`[el_palmar]`/`[difranca]`/`[grupo_fiel]`) **no aplica a depósitos**: caer a `count(*)` + los `co_deposit` supervivientes. |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos

**0 FAIL.** Dos observaciones (ninguna bloqueante):

1. **Nº de planilla (`nu_document`) no es obligatorio.** Un depósito se puede guardar y enviar con el campo vacío (evidenciado por el Ref 1 en nube con `nu_document=''`). Si la conciliación bancaria lo requiere, hoy nada lo impide. **Observación de validación** — el guión no lo declara obligatorio, por lo que no es FAIL.
2. **Referencia del cobro inconsistente entre tabs** (Cobros = `id_collection`, Total = `co_collection`). Cosmético, no altera el dato enviado. 2.ª corrida que lo reporta.

**Corrección al guión (`smoke-depositos.md`):** el bloque "Verificación BD" pide contar `deposit_collection_payment` como nº de pagos agrupados. Esa tabla **está vacía en todo el histórico** — la instrucción produce un `BD-MISMATCH` falso. Reemplazar por `collection.id_deposit` + `collectionIds` del payload.

---

## Captura de payload

`_payloads.jsonl` +1 línea. **`deposit` SÍ capturado**, 1 sola vez y con body (`collectionIds:[32]`, `depositCollect:[]`).
Namespace propio `window.__qaDEP` (sufijo de 3 letras, sin colisión); se **consumió** el buffer `window.__qaPayloadsData` heredado sin reinstalar el hook ⇒ **0 duplicados**.
⚠ En este WebView `window.__qaH.getPayloadData` **no existe** (el bundle instalado por LOGIN no lo expone); el buffer sí (`window.__qaPayloadsData`, 144 entradas al abrir el módulo). Leerlo directo.

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

🎉 **El hook SÍ capturó el payload de `depositservice/deposit`** — cierra el gap conocido de La Tortuga v6.6.18,
donde depósitos era el único transaccional sin captura.

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786981585334.0` (Ref 3, `id_deposit=3`) | **BD-FIELD-OK** | **15/15 OK** | 0 / 0 (config `deposit`: `arrays: []`, correcto) | **0** | 2 (hora `da_deposit` / `da_document` — huso horario) |

**Detalle campo a campo — 15/15, sin discrepancias:**

| Campo | Payload | Nube |
|---|---|---|
| `co_deposit` | 1786981585334.0 | 1786981585334.0 |
| `da_deposit` | 2026-08-17 11:46:25 | 2026-08-17T15:46:25.000Z *(nota: UTC-4→UTC)* |
| `co_bank` | 7738 | 7738 |
| `nu_account` | 01340009180093087738 | 01340009180093087738 |
| `nu_document` | PL-QA-0817 | PL-QA-0817 |
| `da_document` | 2026-08-17 | 2026-08-17T04:00:00.000Z *(nota: hora)* |
| `nu_amount_doc` | 8000 | 8000.0000 |
| `nu_amount_doc_conversion` | 10.38 | 10.3800 |
| `co_currency` | BS | BS |
| `id_enterprise` / `co_enterprise` | 1 / 00001 | 1 / 00001 |
| `tx_comment` | QA smoke depositos 20260817 | QA smoke depositos 20260817 |
| `id_currency` | 1 | 1 |
| `coordenada` | 11.0490132,-63.8649857 | 11.0490132,-63.8649857 |
| `id_user` | 463 | 463 |

### 🔗 Veredicto del vínculo depósito ↔ cobro: **CORRECTO**

`collectionIds: [32]` del payload es un array **hermano**, fuera de `data.deposit`, que el motor no mira.
Cotejado a mano: `SELECT id_collection, id_deposit FROM collection WHERE id_deposit=3` → **`id_collection=32`**,
coincidiendo 1:1 con el payload. El `nu_amount_final=10000` del cobro es consistente con el oráculo del efectivo
(8.000 depositados + 2.000 en pago móvil).

✅ **Confirmada la corrección al guión:** `deposit_collection_payment` tiene **0 filas para los 3 depósitos** del
cliente ⇒ cotejar esa hija, como pide `smoke-depositos.md`, produciría un `BD-MISMATCH` **falso**. El vínculo real
es el **FK invertido `collection.id_deposit`**. El config vigente (`arrays: []`) ya es el correcto.

### Notas de calibración

- Campos payload-only ya cubiertos por el `ignore` calibrado en jerez 2026-07-01: `nuValueLocal` (la tasa),
  `stDeposit`/`stDelivery`, `isEdit`/`isEditTotal`/`isSave`, `coUser`, `depositCollect: []`, `idDeposit: null`.
- `idBankAccount` no tiene columna dedicada: se persiste denormalizado como `co_bank` + `nu_account`, ambos ya cotejados.
- **Ninguna calibración nueva.** El config vigente cubre el caso.

### Contexto de terceros (verificado, para que no se atribuya mal)

| `id_deposit` | Monto | `id_user` | Origen |
|---|---|---|---|
| 1 | 95.000,00 BS | 463 johana | carga manual de la QA, 13:14 |
| 2 | 13.000,00 BS | **474 jgomez** | **otro usuario**, 15:40 — ajeno a esta corrida |
| **3** | **8.000,00 BS** | 463 johana | **esta corrida** |

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.
