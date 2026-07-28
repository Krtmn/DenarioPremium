# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente | el_valle (EL VALLE / COVADONGA) |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A (idEnterprise 1, coEnterprise 00001) |
| Servidor | **La Tortuga** — `denariolatortuga.ddns.net:8081/PremiumWS` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Dispositivo | Infinix X6728 (HOT 60i) — uuid `da9f78b6e785fffc` |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ (0 alerts, 0 modales residuales) |

---

## ⚠ Aplicabilidad — el módulo APLICA y SÍ hubo datos

El prompt del orquestador anticipaba un posible **N/A por falta de datos** (COBROS reportado como bloqueado:
0 filas nuevas en `collection`). **Esa premisa quedó desmentida al iniciar el módulo:**

1. **VG:** `colletionPayment` tiene **Efectivo = SÍ** ⇒ el módulo está habilitado (`depositos.aplica=true`).
   Nunca fue candidato a N/A por VG.
2. **Datos:** la nube ya **no** tenía solo las 2 filas del 23/06. Aparecieron **2 cobros nuevos de hoy, ambos
   en EFECTIVO** (`co_payment_method='ef'`):

   | id_collection | co_type | Monto | Método | Fecha |
   |---|---|---|---|---|
   | 119 | 1 (anticipo) | 20,00 USD | **ef** | 2026-07-28 |
   | 120 | 0 (cobro) | 472,90 USD | **ef** | 2026-07-28 |

   (Las 2 filas viejas —id 1 y 2, del 23/06— son transferencia `tr`, no depositables.)

⇒ Los cobros **sí llegaron a la nube**, con retardo respecto de la ventana en que se observó el módulo COBROS.
**Hubo material que depositar y el flujo end-to-end se ejecutó completo.** Ningún caso quedó N/A.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Tile Depósitos desde HOME → `app-depositos` visible con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | Form con Empresa, Moneda (USD, disabled), Banco, Fecha Depósito (idx0 disabled `28/7/2026, 5:04 p. m.`), Fecha Doc (idx1 editable), Nro. Plantilla, Comentario. **Guardar y Enviar deshabilitados** sin datos; tabs Cobros/Total/Adjuntos `disabled` |
| DM-DEP-004 | ✅ PASS | Banco = `BANCO MERCANTIL COVADONGA**9555 NUEVO` (idBankAccount 2, coBank 1101003). **Cuenta autollenada** `01050046031046809555`; las 4 tabs se habilitan |
| DM-DEP-005 | ✅ PASS | Fecha Doc (`letrasFechasButton` idx 1) abre modal con `ion-datetime`; `setIonDatetime('2026-07-28')` → `confirmed:true, clicked:true`; queda `28/7/2026` y **0 modales residuales** |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `DEP-QA-0728`. Con solo la plantilla Guardar **sigue deshabilitado**; al marcar el cobro → Guardar y Enviar **habilitados**, pie "Monto total depositado **20 USD**" |
| DM-DEP-009 | ✅ PASS | Guardar → alert **"Denario Depósito · El Depósito se ha guardado"** (botón `Aceptar`) |
| DM-DEP-010 | ✅ PASS | BUSCAR renderizó: `Nro Ref: 0 · Banco: 1101003 · Estatus: Guardado · Fecha: 2026-07-28 17:04:04 · Monto USD: 20.0000`. **El defecto conocido NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabrir el Guardado: round-trip §9 **1:1** — banco, cuenta, `DEP-QA-0728`, empresa, moneda USD, Fecha Doc y **cobro 119 marcado** (`nChecked=1`, 20 USD). Editable (Guardar/Enviar activos) |
| DM-DEP-017 | ✅ PASS | Enviar → **3 alerts**: (1) "El Depósito será enviado" `Cancelar/Aceptar` → (2) "Denario Premium — El Depósito será enviado" `OK` → (3) **"Depósito nro. 1 enviado exitosamente"** `OK`. POST `depositservice/deposit` capturado |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar: `Nro Ref: 1 · Estatus: Enviado · Monto USD: 20.0000`, **sin trash**. El defecto conocido NO reprodujo |
| DM-DEP-019 | ✅ PASS | El Enviado abre en **solo lectura**: sin `.imagenGuardar`, sin `.imagenEnviar`, 0 trash, y **todos los `ion-input` con `disabled=true`** (banco incluido) |
| DM-DEP-020 | ✅ PASS | 2º depósito Guardado (cobro 120, 472,9 USD) → trash `ion-button[color=danger]` **solo en el Guardado** (Enviado tiene 0) → alert **"¿Desea eliminar el depósito seleccionado?"** `Cancelar/Aceptar` → **desaparece** de la lista |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **1** | Depósito · Banco MERCANTIL COVADONGA**9555 (coBank 1101003, cta 01050046031046809555) · Nro. Plantilla `DEP-QA-0728` · Fecha doc 2026-07-28 · **20,00 USD** · cobro vinculado `collectionIds:[119]` (ABASTOS Y CARNICERIA HERMANOS FLORES CA) | **Enviado** — BD-OK |
| — | Depósito · Nro. Plantilla `DEP-QA-0728-B` · **472,90 USD** · cobro 120 (BODEGÓN CARIBE´S 100, C.A) | **Guardado → ELIMINADO** en DM-DEP-020 (nunca se envió; no llegó a la nube, correcto) |

---

## Verificación BD (RUNTIME §10)

**Baseline:** tabla `deposit` **vacía (0 filas)** al inicio del módulo.

```sql
SELECT id_deposit, co_deposit, st_deposit, nu_amount_doc, nu_document, da_document,
       co_bank, nu_account, co_currency, id_enterprise,
       (SELECT count(*) FROM deposit_collection_payment x WHERE x.id_deposit=d.id_deposit) pagos
FROM deposit d ORDER BY id_deposit DESC;
```

| id_deposit | co_deposit | st_deposit | nu_amount_doc | nu_document | co_bank | co_currency | pagos |
|---|---|---|---|---|---|---|---|
| 1 | 1785272644323.0 | 1 | 20.0000 | DEP-QA-0728 | 1101003 | USD | 0 |

**Marca: `BD-OK`.** Baseline-diff = exactamente 1 fila nueva, la esperada. Cotejo campo a campo contra la UI:

| Campo | UI | Nube | ✓ |
|---|---|---|---|
| Nro.Ref | 1 | `id_deposit`=1 | ✅ (confirma Ref UI = PK servidor) |
| Monto | 20 USD | `nu_amount_doc`=20.0000 | ✅ |
| Nro. Plantilla | DEP-QA-0728 | `nu_document`=DEP-QA-0728 | ✅ |
| Banco | 1101003 | `co_bank`=1101003 | ✅ |
| Cuenta | 01050046031046809555 | `nu_account` idem | ✅ |
| Fecha doc | 28/7/2026 | `da_document`=2026-07-28 | ✅ (hora difiere por TZ — nota, no mismatch) |
| Empresa / Moneda | COVADONGA / USD | `id_enterprise`=1 / `co_currency`=USD | ✅ |

**Oráculo Σ(cobros hijos) == Monto depositado:** ✅ un único cobro hijo de 20,00 == 20,00 depositados.
El vínculo **no** viaja por `deposit_collection_payment` (`pagos=0`) sino por **`collectionIds:[119]`** en el
payload — reconfirma la nota `[ins-2622]`: cotejar por payload, es **BD-INFO**, no MISMATCH.

**Payload capturado** (`depositservice/deposit`, hook `nativePromise`):
```json
{"deposit":{"coDeposit":"1785272644323.0","daDeposit":"2026-07-28 17:04:04","coBank":"1101003",
"nuAccount":"01050046031046809555","nuDocument":"DEP-QA-0728","daDocument":"2026-07-28",
"nuAmountDoc":20,"nuAmountDocConversion":14515,"coCurrency":"USD","idEnterprise":1,
"txComment":"","nuValueLocal":725.75,"stDeposit":2,"stDelivery":2,
"coordenada":"11.0490621,-63.8649789","depositCollect":[]},"collectionIds":[119]}
```
GPS presente (`userMustActivateGPS=true` satisfecho). `depositCollect:[]` vacío, como estaba documentado.

**Local:** `BD-N/A` — `sqlite3` no existe en el device (degradado al primer intento, sin gastar reintentos,
según el quirk confirmado). El cotejo fue por **nube + payload + UI**.

**Conclusión guardado→enviado:** el depósito se guardó, se envió y **persistió** (`st_deposit=1`). El 2º
depósito, borrado antes de enviarse, correctamente **no** dejó rastro en la nube.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **La propagación nube→device de cobros depositables NO es automática: exige SINCRONIZAR** | universal | Tras enviar el depósito, el Tab Cobros quedó en **0 checkboxes** y el cobro 120 (efectivo, ya en la nube) **no** aparecía. Un **Sincronizar** manual desde HOME lo bajó al device y destrabó DM-DEP-020. Matiza `[latino_cosmetica-20260714]` ("el cobro de la misma corrida propagó de vuelta"): propaga, **pero tras un ciclo de sync**, no solo por esperar. Antes de declarar `aplica=false` o "sin datos" por Tab Cobros vacío, **sincronizar y reintentar**. |
| **El oráculo "popover banco con 0 opciones ⇒ sin cobros depositables" NO se sostiene en el_valle** | universal (corrige `[dth-2612]`) | El `ion-select.selectbanco` trajo **7 cuentas** aun cuando después hubo **0 cobros depositables** (post-envío). Las opciones de banco son **cuentas bancarias de la empresa**, independientes de si hay cobros. **Oráculo fiable = contar `app-deposito-cobros ion-checkbox`**, no las opciones de banco. |
| Botón del alert de **Guardar** = `Aceptar` (no `OK`) | cliente/servidor | "El Depósito se ha guardado" trae **`Aceptar`**. Los informativos del **envío** sí usan `OK`. El botón depende del alert, no del módulo: manejar ambos. |
| **Envío = 3 alerts** en La Tortuga | servidor | (1) Cancelar/Aceptar → (2) OK → (3) "Depósito nro. N enviado exitosamente" OK. Reconfirma que el nº de alertas sigue al **SERVIDOR** (`[ferrenuestro-20260723]`). |
| Borrado = alert `¿Desea eliminar el depósito seleccionado?` (Cancelar/Aceptar) | universal | Confirma "borrado CON confirmación" `[ins-2610]`. Trash presente **solo** en Guardado (Enviado → 0). |
| `st_deposit` **Enviado = 1** | universal (corrige `smoke-depositos.md`) | El extract dice Guardado(5)/Enviado(9); el valor real observado para Enviado es **`st_deposit=1`** (coincide con latino_cosmetica). Corregir el smoke. |
| Solo-lectura del Enviado = **`ion-input.disabled=true`** | universal (amplía `[ferrenuestro-20260723]`) | Ferrenuestro reportó solo-lectura "por ausencia de botones" y `readonly=false`. Acá además **`disabled=true`** en todos los inputs y en el `ion-select` banco: el bloqueo es efectivo y verificable por `disabled`. |
| Columna *Referencia* inconsistente entre Tab Cobros y Tab Total | universal | Tab **Cobros** muestra `119` (`id_collection`); Tab **Total**, para el mismo cobro, muestra `1785268429266.0` (el epoch `co_collection`). Cosmético, no bloquea — pero confunde al cotejar. Observación, no FAIL. |
| `window.__qaSrc` + `eval` para el prelude de helpers | universal | Reconfirmado: el bundle se instala 1 vez y cada `browser_run_code_unsafe` hace `eval(window.__qaSrc)` (~12k chars) en vez de reinlinar. |
| ⚠ `window.__qaTrace` **persiste entre agentes** | universal (higiene de RECORD) | `installRecorder` hace `window.__qaTrace = window.__qaTrace || []`, así que el dump traía **las ops de INVENTARIOS** del agente previo. Al volcar hay que **filtrar por el tramo del propio módulo** (o resetear el array al instalar). Riesgo real de trazas contaminadas. |

---

## Hallazgos

**Sin FAIL.** Dos observaciones menores, ninguna bloqueante:

1. **Referencia del cobro inconsistente entre tabs** (`119` en Cobros vs `1785268429266.0` en Total) — cosmético.
2. **Defecto conocido DM-DEP-010/018/019/020 (`deposit.service.ts`) NO reprodujo** en esta corrida: la lista
   BUSCAR renderizó limpia en los 3 accesos (tras Guardar, tras Enviar y tras Borrar), sin loader colgado.
   Coherente con su naturaleza de **race intermitente** — no cerrado, pero no observable hoy.

---

## Traza (modo RECORD)

`TRAZA: 43 ops · 12 casos grabados` → `_trace/depositos.trace.json` · `validateTrace` = `[]` (válida).
Todos los casos grabados son PASS. Ver `nota_cobertura` en el archivo: los helpers Playwright
(`setIonDatetime`, `clickAlertButton`, `clickBack`) no están en el vocabulario de la traza, y el paso de
**Sincronización** entre DM-DEP-019 y DM-DEP-020 es imprescindible para reproducir el caso del borrado.
