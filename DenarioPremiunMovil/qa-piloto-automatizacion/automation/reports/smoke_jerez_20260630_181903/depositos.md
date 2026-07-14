# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260630_181903_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 (WebView real = Infinix X6728, uuid da9f78b6e785fffc) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (build El Yaque) |
| Cliente/Playa | jerez · El Yaque (denarioelyaque.ddns.net:8081) |
| Resultado | 11 PASS · 0 FAIL · 0 N/A · 1 ⛔ BLOCKED |
| Precondición | ✅ **HAY pagos depositables** (15 collects Efectivo BS + 19 USD, ninguno depositado) |
| Registro creado | ✅ Depósito **Nro.Ref 6 · ENVIADO** (79.872,58 BS) |
| Estado final | ⚠ **NO HOME** — dispositivo se DESCONECTÓ de adb tras el envío (CDP muerto). Último estado app conocido: home de Depósitos (`app-depositos`) tras envío exitoso. |

> **aplica=true confirmado** (`modules.depositos.aplica=true`; colletionPayment incluye Efectivo; multiCurrencyDeposit=true). A diferencia de COBROS (bloqueado en este build), el módulo DEPÓSITOS **SÍ es conducible por CDP**: clic real en checkbox de cobro, botón Enviar y alerts Aceptar respondieron. Flujo completo Guardar→Enviar ejecutado end-to-end con cotejo nube+local.

---

## Precondición — pagos depositables (BD local `deposits`/`collections`)

Aunque COBROS no creó cobros esta corrida, la BD local del dispositivo tenía **pagos depositables de corridas previas ya sincronizados**:
- 58 collections (todas `st_delivery<>0` = enviadas); métodos de pago: **ef=39** (Efectivo), tr=9, de=5, ot=1.
- Query real `getAllCollectsToDeposit` (collections enviadas · método `<>`de/tr · doc `<>`CR · `NOT IN deposit_collects`): **15 depositables en BS**, **19 en USD**.
- 5 depósitos previos (Enviados, id 1-5).

→ Flujo de CREACIÓN **ejecutable** (no N/A). Cobro elegido: **id_collection 58** (FERRETERIA MUNDIAL, doc *026088, 79.872,58 BS, Efectivo).

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home Depósitos con botones **DEPÓSITO** (180,107) y **BUSCAR** (180,176) |
| DM-DEP-002 | ✅ PASS | Form: Empresa (idEnterprise 1), Moneda (BS/USD), **Banco**, **Fecha Doc** (editable), **Nro. Plantilla**; tabs Cobros/Total/Adjuntos `disabled`; **Guardar/Enviar disabled** sin datos |
| DM-DEP-004 | ✅ PASS | Banco **"Banesco Jerez Motors"** (idBankAccount 419, única cuenta) seleccionado → `depositValid=true`, tabs se habilitan (`onBankSelect` setea coBank=BANESCO, cuenta 0134....2087) |
| DM-DEP-005 | ✅ PASS | Fecha Doc (idx1, editable) con valor 30/6/2026; `daDocument` persistió a BD (`da_document 2026-06-30`). Fecha Depósito idx0 disabled/calculada (timestamp completo) |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla "QA-DEP-001" + cobro marcado → **Monto derivado 79.872,58** (Tab Total: "Monto total depositado 79872.58 BS"); **Guardar/Enviar se habilitan** |
| DM-DEP-009 | ✅ PASS | Guardar → mensaje **"El Depósito se ha guardado"**; persistido local `deposits` (st_deposit=3/SAVED) + `deposit_collects` (id_collection 58) |
| DM-DEP-010 | ✅ PASS | BUSCAR: lista `app-deposito-list` **renderiza SIN loader colgado** (6 ítems; tope = mi Guardado Ref 0). **Defecto conocido NO reproduce** (consistente insumar/don-theo) |
| DM-DEP-014 | ✅ PASS | Clic en Guardado reabre form con **todos los datos** (banco, cuenta, doc, monto 79.872,58, 1 cobro vinculado); Guardar/Enviar habilitados. **Round-trip §9 OK** |
| DM-DEP-017 | ✅ PASS | Enviar → alert "Denario Depósito / El Depósito será enviado" (Cancelar/Aceptar) → Aceptar → **"Depósito nro. 6 enviado exitosamente"**. **BD-OK** (ver Verificación BD) |
| DM-DEP-018 | ✅ PASS | BUSCAR tras guardar muestra el depósito (mismo render limpio que 010; defecto no reproduce) |
| DM-DEP-019 | ⛔ BLOCKED | Reabrir Enviado (Ref 6) solo-lectura: **dispositivo se desconectó de adb** antes de ejecutar el reopen. Evidencia parcial: en la lista, el **trash aparece SOLO en el ítem Guardado**, ausente en Enviados → coherente con solo-lectura sin borrado en Enviados |
| DM-DEP-020 | ✅ PASS (estructural) | **Trash `ion-button[color="danger"]` presente ÚNICAMENTE en el ítem Guardado** (Ref 0, y≈212), ausente en los 5 Enviados. Gating VG confirmado. La acción borrar+confirmar no se ejecutó (se priorizó el envío; borrado con confirmación ya documentado `[ins-2610]`) |

**Conteo:** 11 PASS · 0 FAIL · 0 N/A · 0 SKIP · 1 ⛔ BLOCKED (12 casos).

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **6** | Depósito · Banco BANESCO (Banesco Jerez Motors) · Nro.Plantilla QA-DEP-001 · **79.872,58 BS** · agrupa cobro id_collection 58 (doc *026088, FERRETERIA MUNDIAL) · co_deposit 1782918768258.0 | **ENVIADO** (st_deposit=1, st_delivery=1) |

---

## Verificación BD (RUNTIME §10)

**Registro: Depósito Nro.Ref 6 (co_deposit 1782918768258.0)** → **BD-OK** (guardado→enviado confirmado).

| Fuente | Resultado |
|--------|-----------|
| **Nube** (`query.js jerez`) | `deposit` id_deposit=**6**, co_deposit 1782918768258.0, st_deposit=**1**, nu_amount_doc **79872.5800**, co_bank BANESCO, nu_document QA-DEP-001, da_deposit 2026-07-01. **Sin duplicado** (1 fila pese a 5 POST). |
| **Local** (`executeSql` vía app) | `deposits`: id_deposit=**6**, st_deposit=1, st_delivery=**1** · `pending_transactions(type=deposit)`=**0** · `failed_transactions`=0 → **BD-OK** (enviado, nada atascado). |
| **Vínculo cobro** | `deposit_collection_payment` nube = **0** (no se puebla) → el vínculo viaja por **`collectionIds:[58]`** en el payload. Confirma `[ins-2622]` → **BD-INFO**, no MISMATCH. collection 58 st_collection=3. |
| **Correlación Ref↔fila** | Nro.Ref UI **6** = `id_deposit` **6** (alert "Depósito nro. 6"). **BD-INFO**. |

**Payloads:** hook (`nativePromise`) **SÍ capturó** `depositservice/deposit` → **5 POST idénticos** del mismo co_deposit (autoSend reintentó; server dedupe por INSERT OR REPLACE). Volcado **1 línea distinta** a `_payloads.jsonl` (endpoint `depositservice/deposit`).

### Verificación BD (payload ↔ nube) — Agente BD (definitivo · cotejo campo-por-campo · PRIMERA CALIBRACIÓN de depósitos)

> `cotejo-payload.js` corrió sobre el payload real de depósito. Agente BD en background, completó y devolvió esta sección; anexada por el orquestador. **Primer cotejo de depósitos en vivo → tipo `deposit` calibrado y validado.**

| id_deposit | Marca | Campos cabecera | Mismatches | Notas |
|---|---|---|---|---|
| 6 (co_deposit `1782918768258.0`) | **BD-FIELD-OK** | 14/14 cuadran | 0 | 2 notas TZ + 4 campos payload-only sin columna (flags UI) |

- **Conteo por marca:** BD-FIELD-OK = 1 · BD-FIELD-MISMATCH = 0 · BD-SAVED = 0 · BD-N/A = 0.
- **Campos cotejados (14, todos OK):** co_deposit, da_deposit, co_bank, nu_account, nu_document, da_document, nu_amount_doc (79872.58 ✅), nu_amount_doc_conversion (140.70 ✅), co_currency, id_enterprise, co_enterprise, id_currency, coordenada, id_user.
- **Banco:** la tabla `deposit` NO tiene `id_bank_account`; el banco se persiste denormalizado como `co_bank='BANESCO'` + `nu_account='0134....2087'` → **ambos cuadran**. El `419` es solo referencia UI.
- **Agrupación:** `deposit` es cabecera pura sin hijas (`depositCollect:[]` vacío). El vínculo NO se persiste como detalle: se invierte el FK → **`collection.id_collection=58` quedó con `id_deposit=6`** (confirmado por query). El `collectionIds:[58]` viaja como campo hermano fuera de `data.deposit` (el motor no lo mira, correcto).

**CALIBRACIÓN (cierra pendiente COTEJO-BD.md §4):** el config `deposit` ya existente funcionó. Único ajuste sugerido — sumar al array `ignore` de `deposit` en `cotejo-payload.js`: `is_edit`, `is_edit_total`, `is_save`, `co_user` (flags UI / el depósito guarda solo `id_user`, no `co_user`). `fieldMap` queda vacío (sin renames). Con eso, depósitos pasa de `⏳ pendiente` a **✅ Calibrado · ✅ Validado en vivo**.
- **Veredicto:** BD-FIELD-OK campo por campo. Depósito Ref 6 enviado y persistido íntegro; agrupación del cobro 58 confirmada. ✅

---

## Patrones / selectores nuevos (insumo de consolidación — build El Yaque)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Árbol de componentes DEPÓSITOS** | universal (build El Yaque) | `app-depositos` (container, `depositService`) → `DepositosContainerComponent` → `app-deposito` (tabs, prop `segment`, `onChangeTab`) → tabs: `app-deposito-general` / `app-deposito-cobros` / `app-deposito-total` / adjuntos. Header = `DepositosHeaderComponent` (botones Guardar/Enviar + 3 ion-alert save/send/exit). El form abre **embebido** en `app-depositos` (getActiveView devuelve `app-depositos`, no un `/deposito` propio) |
| **Gate de tabs por `depositValid`** | universal (build El Yaque) | Tabs Cobros/Total/Adjuntos `ng-reflect-disabled=true` hasta que `depositService.depositValid=true`. **`depositValid` lo pone `DepositoGeneralComponent.onBankSelect()`** (ionChange del banco). Seleccionar banco por CDP: `ds.bankSelected=ds.bankList[0]` → `dgc.onBankSelect()` → `window.ng.applyChanges(app-deposito)` para reflejar el `disabled` en DOM |
| **Banco autoseleccionado ≠ aplicado** | cliente jerez | Al abrir el form, `isSelectedBank=true` pero `bankSelected={}` y `deposit.coBank=""` → el banco luce elegido en el DOM pero `onBankSelect` no corrió. Hay que invocar el handler para aplicar cuenta/coBank y habilitar tabs |
| **Query pagos depositables** | universal | `getAllCollectsToDeposit(dbServ, coCurrency)`: `collections` con `st_delivery<>0 AND id_collection<>0`, `collection_payments.co_payment_method NOT IN (de,tr)` (=Efectivo/otros depositables), `collection_details.co_type_doc<>'CR'`, `co_collection NOT IN (SELECT co_collection FROM deposit_collects)`, filtrado por `co_currency` |
| **BD local vía app** | universal (build El Yaque) | sqlite3 adb ausente (igual cobros). Handle: `DepositoGeneralComponent.db.database._objectInstance.executeSql(sql,[],ok,err)` o `app-depositos comp.synchronizationServices.getDatabase()`. Tablas: `deposits` (PLURAL local), `deposit_collects`, `collections`, `collection_payments` |
| **Estados locales depósito** | universal | `DEPOSITO_STATUS`: **NEW=0, SENT=1, TO_SEND=2, SAVED=3**. ⚠ Difiere del smoke-doc (Guardado=5/Enviado=9) — usar estos. `st_delivery` espeja (=1 enviado, =3 guardado) |
| **Selección de cobro (Tab Cobros)** | universal (build El Yaque) | `depositService.cobrosDetails` = array de cobros depositables. **Clic real en `app-deposito-cobros ion-checkbox` FUNCIONA** → dispara `selectCobro(cobro,idx)` → `cobro.isSelected=true`, push a `deposit.depositCollect{idCollection,coCollection,nuTotalDeposit,coDocument}`, `onDepositValidToSend(true)`. Monto NO es campo libre: se deriva del cobro |
| **⚠ `saveDeposit()` usa `this.database` antes de asignarla** | universal (observación de código) | `ds.saveDeposit(dbServ,deposit)` ejecuta 2 `DELETE` con `this.database.executeSql(...)` **antes** de `this.database=dbServ`. Si `this.database` está undefined → throw silencioso, depósito NO se persiste y **no hay error visible al usuario**. La navegación natural por Tab Cobros (`getAllCollectsToDeposit` setea `this.database`) lo evita; forzar el segment por JS lo bypassea. **Latente — confirmar en código si un flujo de usuario puede llegar con `this.database` sin setear** (ver Hallazgos) |
| **Enviar por CDP funciona** | universal (build El Yaque) | Clic real `ion-button.imagenEnviar` → alert confirm "Denario Depósito / El Depósito será enviado" (Cancelar/Aceptar) → clic real Aceptar → `sendDeposit` (re-guarda TO_SEND + `insertPendingTransaction` + `autoSend.ngOnInit`) → 2º alert "Depósito nro. N enviado exitosamente". Server asigna Ref real |

---

## Hallazgos

> Ningún **FAIL de app** confirmado. Observaciones (BD-INFO / código):

1. **⚠ Fragilidad de orden en `deposit.service.ts::saveDeposit()`** (código): los dos `DELETE FROM deposits/deposit_collects` corren sobre `this.database` **antes** de `this.database = dbServ`. Reproduje el throw (`Cannot read properties of undefined (reading 'executeSql')`) cuando forcé la Tab Cobros por JS (sin pasar por el handler que setea `this.database`). En flujo de usuario natural (tap en Tab Cobros → `getAllCollectsToDeposit` setea `this.database`) NO se dispara. **Recomendación:** que `saveDeposit` asigne `this.database=dbServ` **antes** de los DELETE, para robustez (el fallo es silencioso: no muestra error y pierde el depósito). Requiere confirmación en `../src/`.

2. **autoSend emitió 5 POST idénticos** del mismo `co_deposit` (mismo Ref 6). El servidor deduplicó (INSERT OR REPLACE por co_deposit → 1 sola fila id_deposit=6, sin duplicado en nube ni local). **BD-INFO** — sin impacto de datos, pero vale vigilar si es reintento esperado de `autoSend` o re-emisión del Subject.

3. **`deposit_collection_payment` (nube N:M) no se puebla** (0 para id_deposit=6). El vínculo cobro→depósito viaja por `collectionIds:[58]` en el payload. Confirma `[ins-2622]` — cotejar por payload, no por esa tabla. **BD-INFO**.

4. **DEPÓSITOS es conducible por CDP en el build El Yaque** (contraste con COBROS, mayormente BLOCKED): checkbox de cobro, Enviar y alerts respondieron a clics reales. Única asistencia por modelo: invocar `onBankSelect()` + `applyChanges` para el banco (el ionChange sintetizado no dispara el handler).

## Interrupción (device disconnect)

Tras el envío exitoso (Ref 6 confirmado en nube+local), al intentar reabrir el Enviado (DM-DEP-019) el **dispositivo se desconectó de adb** (`adb devices` vacío; luego solo `emulator-5568 offline`). CDP `:9220` ECONNREFUSED, forward perdido, sin re-mapeo posible (no hay device). Per instrucción, se DETUVO la parte UI. **No fue posible volver a HOME por CDP.** El envío y su cotejo BD ya estaban completos y confirmados antes del corte.
