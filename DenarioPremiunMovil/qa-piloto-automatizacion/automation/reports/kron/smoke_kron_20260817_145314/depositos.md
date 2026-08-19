# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, `id_enterprise` 1) |
| Vendedora | `scarlet` · `id_user` 309 · `co_user` `VE0002` |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` · `sqlitePlugin` OK |
| Playa | **ISLA COCHE** — `denarioislacoche.ddns.net:8081` (confirmado por el host del POST) |
| `modules.depositos.aplica` | **true** (`colletionPayment` con EFECTIVO) |
| Resultado | **10 PASS · 0 FAIL · 1 ⛔ BLOCKED · 1 🚫 N/A** |
| Estado inicial / final | HOME → HOME ✅ |

**Contexto de datos:** Cobros fue solo-lectura en esta corrida ⇒ se depositó contra un cobro EXISTENTE.
La tabla `deposit` de kron estaba en **0 filas** ⇒ este es el **`id_deposit = 1`** del tenant.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | `/depositos` · `app-depositos` visible con botones **DEPÓSITO** y **BUSCAR** |
| DM-DEP-002 | ✅ PASS | Form abre con Empresa/Moneda/Banco + Nro. Plantilla + Comentario + 2 fechas; tabs Cobros/Total/Adjuntos `disabled`; `imagenGuardar`/`imagenEnviar` **ambos `disabled=true`** sin datos |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` → `ion-popover` (1 click) → **BANCO PROVINCIAL, S.A. BANCO UNIVERSAL - \*\*\* 0121387** (`idBankAccount` 469, `coBank` 0108, `coCurrency` BS); cuenta `01080011180100121387` autollenada readonly; las 3 tabs habilitan |
| DM-DEP-005 | ✅ PASS | `ion-button.letrasFechasButton` idx 1 → `ion-modal.fechasModal` con `ion-datetime` ya en hoy (`2026-08-17 13:56:55`); `dt.value='2026-08-17'` + `ionChange` → `#confirm-button` ("Aceptar") cerró limpio; Fecha Doc = `17/8/2026` |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `DEP-QA-KRON-0817` + Comentario `QA smoke kron 20260817` (maxlength **255**); con el cobro marcado, Guardar/Enviar `disabled=false` |
| DM-DEP-009 | ✅ PASS | Alert **"Denario Depósito — El Depósito se ha guardado"** `[Aceptar]`. Lista: `Nro Ref: 0 · Banco 0108 · Estatus **Guardado** · BS 900031.16` |
| DM-DEP-010 | ✅ PASS | BUSCAR → `app-deposito-list` con **1 ítem, 0 `ion-spinner`, 0 `ion-loading` en el DOM visible al render** → **defecto conocido NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Detalle del **Guardado** abre con todos los datos previos; oráculo §9 **1:1 perfecto** (ver abajo) |
| DM-DEP-017 | ✅ PASS | **3 alertas**: `Denario Depósito — El Depósito será enviado` `[Cancelar, Aceptar]` → `Denario Premium — El Depósito será enviado` `[OK]` → **`Denario Premium — Depósito nro. 1 enviado exitosamente`** `[OK]`. POST `depositservice/deposit` capturado con body. **BD-OK** |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar → lista renderiza `Nro Ref: **1** · Estatus **Enviado** · sin trash`; 0 spinner / 0 loading → **defecto conocido NO reprodujo** |
| DM-DEP-019 | ⛔ BLOCKED | El detalle del ítem **Enviado** no abre por CDP tras **3** intentos acotados (`y+16`, `<p> Nro Ref`, `ion-label`), con `elementFromPoint` devolviendo el elemento correcto y sin loading interceptando. ⚠ El **mismo** patrón de click abrió el ítem **Guardado**. Evidencia parcial del criterio PASS obtenida desde la lista: el ítem Enviado **no expone trash** `ion-button[color="danger"]` |
| DM-DEP-020 | 🚫 N/A por datos | Tras el envío no queda ningún depósito en **Guardado** que borrar: el pool de depositables era **1 solo cobro** y quedó consumido. El trash **sí estaba presente** en el ítem Guardado antes de enviar (verificado en DM-DEP-010) |

**Adjuntos:** ningún caso de adjunto ejecutado — instrucción explícita de la QA (**no adjuntar nada**). La tab Adjuntos habilitó normalmente y el envío **no exigió adjunto**.

---

## Registros creados en sistema

| Ref | Epoch (`co_deposit`) | Banco | Monto | Moneda | Cobro vinculado | Estado |
|-----|----------------------|-------|-------|--------|-----------------|--------|
| **1** | `1786999437808.0` | 0108 · BANCO PROVINCIAL, S.A. BANCO UNIVERSAL · cta `01080011180100121387` | **900.031,16** | BS | **348** (ONCE ONCE, C.A) | ✅ **Enviado** — `st_deposit=1` en nube |

Nro. Plantilla `DEP-QA-KRON-0817` · Fecha Doc `2026-08-17` · Comentario `QA smoke kron 20260817` · Tasa/conversión `1167,25` · `nu_value_local` 771,07.

---

## Oráculo de persistencia §9 — Guardar → reabrir desde BUSCAR

| Campo | Guardado | Reabierto | ✓ |
|---|---|---|---|
| Empresa | CHOCOLATES KRON, C.A | CHOCOLATES KRON, C.A | ✅ |
| Moneda | BS | BS | ✅ |
| Banco | 469 / 0108 / BS | 469 / 0108 / BS | ✅ |
| Cuenta | 01080011180100121387 | idem | ✅ |
| Nro. Plantilla | DEP-QA-KRON-0817 | idem | ✅ |
| Comentario | QA smoke kron 20260817 | idem | ✅ |
| Fecha Depósito (calc.) | 17/8/2026, 4:43 p. m. | idem | ✅ |
| Fecha Doc | 17/8/2026 | idem | ✅ |
| Monto | 900031.16 BS | 900031.16 BS | ✅ |
| Cobro 348 | marcado | `checked=true` | ✅ |

**0 divergencias.** La empresa **no revierte** al reabrir (contrasta con el quirk de jerez).

---

## Verificación BD

**Baseline** (antes del módulo): `SELECT count(*), max(id_deposit) FROM deposit` → **0 filas / NULL**.

**Fila creada** (nube, `deposit`):

| campo | valor | cotejo |
|---|---|---|
| `id_deposit` | 1 | = Nro.Ref de la UI ✅ |
| `co_deposit` | `1786999437808.0` | = `coDeposit` del payload ✅ |
| `st_deposit` | **1** (Enviado) | ✅ |
| `nu_amount_doc` | 900031.1600 | = UI y payload ✅ |
| `nu_amount_doc_conversion` | 1167.2500 | ✅ |
| `nu_value_local` | 771.0700 | ✅ |
| `co_currency` | BS | ✅ |
| `co_bank` / `nu_account` | 0108 / 01080011180100121387 | ✅ |
| `nu_document` | DEP-QA-KRON-0817 | ✅ |
| `da_document` | 2026-08-17 | ✅ |
| `tx_comment` | QA smoke kron 20260817 | ✅ |
| `id_enterprise` / `co_enterprise` | 1 / KRON_ADM | ✅ |
| `id_user` | 309 | = `scarlet` ✅ |
| `co_operation` | I | ✅ |
| `coordenada` | 11.0491533,-63.8651617 | ✅ |
| `da_deposit` | 2026-08-17T20:43:57Z | ✅ (UTC vs local UTC-4) |

**16/16 campos cuadran** ⇒ **BD-OK**. Sync **INMEDIATA** (la fila estaba en nube en la primera consulta post-envío).

**Vínculo cobro ↔ depósito** — verificado por la vía correcta:
```
SELECT id_collection, id_deposit FROM collection WHERE id_deposit=1;  →  348 ✅
```
Y **`deposit_collection_payment` con `id_deposit=1` = 0 filas** ⇒ **3.ª confirmación** de que seguir el
`smoke-depositos.md` al pie de la letra produce un **`BD-MISMATCH` falso**. Los oráculos válidos son
`collection.id_deposit`, el `collectionIds:[348]` del payload y `deposit_collects` en la BD local.

**Oráculo del efectivo (validado, NO es defecto):**
```
SELECT co_payment_method, nu_amount_partial, co_operation FROM collection_payment
 WHERE id_collection=348 AND co_operation IS DISTINCT FROM 'D';
 → id 350 · 'ef' · 900031.1600 · co_operation = NULL
```
El cobro 348 es **100 % efectivo** ⇒ depósito por el total. Cuadra exacto.
🔴 **Trampa confirmada:** `co_operation` viene **NULL** ⇒ `WHERE co_operation <> 'D'` **oculta la fila**.
Usar **`IS DISTINCT FROM 'D'`**.

**Captura de payload:** 🎉 **el hook `Capacitor.nativePromise` SÍ capturó `depositservice/deposit` con body**
(1 sola vez, sin duplicados) — 2.ª confirmación tras grupo_fiel. Volcado en `_payloads.jsonl`.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`ion-loading` colgado ENCIMA de la lista YA renderizada tras BUSCAR — variante NUEVA del defecto de `deposit.service.ts`** | universal (candidato) | El render de `app-deposito-list` fue **correcto** (ítem visible, 0 spinner), pero quedó un `ion-loading` **realmente visible** (`overlay-hidden=false`, `offsetParent≠null`, 15 `ion-backdrop` en el DOM) cuyo `ION-BACKDROP.sc-ion-loading-md backdrop-no-tappable` interceptó **los 4 puntos probados** del ítem. **No se auto-resolvió en 6 s** (contrasta con `[el_palmar-20260805]`, donde el loading contaba 0 y desaparecía solo). Fix: `l.dismiss()` sobre los loadings **visibles** y reintentar. ⇒ El defecto de `deposit.service.ts` tiene **dos caras**: (a) la lista no renderiza, (b) **la lista renderiza pero el loader no se resuelve y bloquea el click**. `[kron-20260817]` |
| 🔑 **La app NO exige el Nro. de Planilla — 2.ª confirmación, ahora en Isla Coche** | universal | Par medido antes/después: con Banco + Fecha Doc + cobro marcado y **Nro. Plantilla y Comentario VACÍOS**, `imagenGuardar`/`imagenEnviar` pasaron de `disabled=true` a `false` **en el mismo tick**; ningún `ion-input` trae `required=true`. Confirma `[grupo_fiel-20260817]` en otro servidor. `[kron-20260817]` |
| 🔴 **El selector de EMPRESA varía POR MÓDULO dentro del mismo tenant — 4.ª confirmación y caso extremo** | universal | En kron, **el mismo día y build**: CLIENTES → `disabled=true` auto-asignado; INVENTARIOS y **DEPÓSITOS** → **sin `formcontrolname`, `disabled=false`, `ng-valid`, `value` = OBJETO empresa completo** (`{idEnterprise:1, coEnterprise:"KRON_ADM", lbEnterprise:"CHOCOLATES KRON, C.A", prioritySelection:0, enterpriseDefault:"true"}`), shadowRoot rotulando bien. **No tocar.** `[kron-20260817]` |
| ⚠ **`currencyBank=true` NO se pudo distinguir de "el cliente solo tiene cuentas BS"** | cliente | El popover ofreció **13 cuentas, TODAS `coCurrency:"BS"`**. Con la VG en `true` se esperaba ver todas las monedas; como kron no tiene cuentas en otra moneda, la VG **no es observable** aquí. No leerlo como incumplimiento. Cuentas: `idBankAccount` 449,450,451,454,455,458,460,461,464,467,**469**,473,474. `[kron-20260817]` |
| ✅ **Los 3 `ion-select` del form abren `ion-popover` (1 click) — 0 `ion-alert` de radios** | universal | Confirma `[grupo_fiel-20260817]`. Los 3 traen `value` **objeto** y ninguno tiene `formcontrolname` ⇒ vía programática por string descartada. Con la moneda ya en BS (default) **no hizo falta re-elegir el banco**. `[kron-20260817]` |
| ✅ **Envío = 3 alertas con etiquetas MIXTAS, también en Isla Coche** | universal | `[Cancelar, **Aceptar**]` → `[**OK**]` → `[**OK**]`; guardado `[**Aceptar**]`. Recorrer `['Aceptar','OK']` por **igualdad exacta** resolvió los 4 sin un reintento. ⚠ Contrasta con `[ferrenuestro-2026-07-07]` (Isla Coche, 2 alertas) ⇒ **el nº de alertas siguió al BUILD, no al servidor**. `[kron-20260817]` |
| ⚠ **El rect de Fecha Doc SÍ se desplazó al elegir banco** (y=462 → **y=543**) | universal | Tercer dato del patrón: el_palmar bajó 477→348, grupo_fiel no se movió, kron subió 462→543. **El desplazamiento existe pero no es predecible** ⇒ releer el rect siempre. `[kron-20260817]` |
| ⚠ **Inconsistencia cosmética de la Referencia del cobro — 2.ª confirmación** | universal | Tab **Cobros** muestra `348` (`id_collection`) y tab **Total**, misma fila, `1786990547929.0` (`co_collection`). El payload viaja `collectionIds:[348]` ⇒ **observación, no defecto**. Confirma `[el_palmar-20260805]`. `[kron-20260817]` |
| ⚠ **`signatureDeposit=true` NO hizo obligatoria la firma** | universal | Guardar y Enviar completaron sin pedir firma en ningún punto. Coherente con la aclaración de QA 2026-07-29 para `signatureVisit`: la VG **habilita** la función, no la vuelve obligatoria. **No es defecto.** `[kron-20260817]` |
| ⚠ **`ion-item` Enviado de `app-deposito-list` no navegó al detalle por CDP** | pendiente de confirmar | 3 intentos, `elementFromPoint` correcto (`P`/`ION-LABEL`), 0 loading interceptando, mientras el **mismo** click abrió el ítem Guardado. Puede ser limitación de automatización o cambio de comportamiento del build. **Reproducir en la próxima corrida antes de tipificarlo.** `[kron-20260817]` |
| ⚠ **`deposit` de la nube NO tiene `co_user`** y `collection_payment` NO tiene `nu_amount` | universal | Nombres reales: el vendedor va solo por `id_user`; el monto del pago es **`nu_amount_partial`**. Un `SELECT` con el nombre inventado devuelve `ERR: column does not exist` y cuesta un intento. `[kron-20260817]` |

> ✅ consolidado 2026-08-17

---

## Defecto conocido DM-DEP-018/019/020 — **NO reprodujo (en su forma documentada)**

La lista de BUSCAR **renderizó correctamente en los 3 accesos** (tras Guardar y tras Enviar): ítem visible,
0 `ion-spinner`, contenido completo. ⇒ **El bug de render de `deposit.service.ts` NO reprodujo.** Sigue
intermitente (NO reprodujo tampoco en `el_valle-20260728` ni `grupo_fiel-20260817`).

⚠ **Pero apareció una variante vecina, del mismo servicio:** un `ion-loading` quedó **colgado sobre la lista
ya renderizada** y bloqueó la interacción con el ítem hasta hacerle `dismiss()` (detalle en la tabla de
patrones). Se recomienda **anexarla al defecto conocido** como segunda manifestación, no abrir uno nuevo.

---

## Hallazgos (FAIL)

**Ninguno — 0 FAIL.**

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786999437808.0` (`id_deposit` = 1) | **BD-FIELD-OK** | **15/15 OK** | 0/0 (`arrays:[]`, correcto) | **0** | 2 (zona horaria) |

**Campos exactos:** `co_deposit`, `co_bank`, `nu_account`, `nu_document`, `nu_amount_doc`,
`nu_amount_doc_conversion`, `co_currency`, `id_enterprise`, `co_enterprise`, `tx_comment`, `id_currency`,
`coordenada`, `id_user`.

**Las 2 notas (zona horaria, no mismatch):**

| Campo | Payload | Nube | |
|---|---|---|---|
| `da_deposit` | 2026-08-17 16:43:57 | 2026-08-17T20:43:57.000Z | ✅ mismo instante, +4 h UTC |
| `da_document` | 2026-08-17 | 2026-08-17T04:00:00.000Z | ✅ mismo día, offset de zona |

### 🔗 Veredicto del vínculo depósito ↔ cobro: **CONFIRMADO**

```sql
SELECT id_collection, id_deposit, nu_amount_final FROM collection WHERE id_deposit = 1
-> id_collection = 348 · id_deposit = 1 · nu_amount_final = 900031.1600
```

Coincide con el `nu_amount_doc` del depósito (900.031,16) y con `collectionIds: [348]` del payload.

✅ **4.ª confirmación de la corrección al guión:** `deposit_collection_payment` sigue en **0 filas** ⇒ cotejarla,
como pide `smoke-depositos.md`, produciría un `BD-MISMATCH` **falso**. El vínculo real es el **FK invertido
`collection.id_deposit`**. El config `deposit` del motor declara `arrays: []`, que es **lo correcto**: el array
`collectionIds` del payload no tiene columna donde cotejarse dentro de `deposit`.

### Notas de calibración

- 🆕 **5.ª corrida del motor contra el esquema de `kron`** — y la **quinta sin necesitar ajustes**
  (clientes, pedidos, devoluciones, inventarios y depósitos). El mapeo del modelo de datos se confirma
  **universal del producto**, no del tenant.
- ⚠ `deposit` **no tiene** columna `co_user`; el monto del pago vive en `nu_amount_partial` **del cobro**.
- 🔴 Trampa reconfirmada: el pago `ef` del cobro 348 trae `co_operation` **NULL** ⇒ solo aparece filtrando con
  **`IS DISTINCT FROM 'D'`**.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.
