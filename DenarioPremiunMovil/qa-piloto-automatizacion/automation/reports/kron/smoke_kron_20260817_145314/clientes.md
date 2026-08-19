# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | CLIENTES |
| Cliente | kron — CHOCOLATES KRON, C.A. (`KRON_ADM`) |
| Dispositivo | Infinix X6728 / Infinix HOT 60i · `da9f78b6e785fffc` · viewport 360×744 |
| App | `com.kiberno.denarioPremiumPro` — appVersion **1.0** / dbVersion **19** · `window.ng=TRUE` · `sqlitePlugin` disponible |
| Playa | **ISLA COCHE** — `denarioislacoche.ddns.net:8081` ✅ **confirmada empíricamente desde el host del POST** |
| Usuario | `scarlet` · id_user 309 · co_user `VE0002` · 30 clientes en cartera |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues · 0 reconexiones · 0 reintentos de alert |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con los 3 botones (CLIENTES · CLIENTE POTENCIAL · BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | **30 ítems** con `Saldo BS` **y** `Saldo USD` (multiCurrency real). 30 = cartera exacta de VE0002 en BD ⇒ no es lista corta. Orden **por código** (`J000469199 → J075129342 → J298866713 …`) ⇒ confirma `clientsOrderBy: co_client` |
| DM-CLT-003 | ✅ PASS | `BICENTENARIA` → **30 → 3** tras pulsar el botón search. No filtra on-keyup (30 ítems tras tipear) |
| DM-CLT-009 | ✅ PASS | Detalle de `J504480975`: Empresa **CHOCOLATES KRON, C.A** · Nombre · RIF · Saldo BS 87.234.295,07 · Saldo USD 113.134,08 · líneas de Crédito (`showCreditLimit=true`) · Condición de Pago · Dirección |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` → `.documents-table-panel--ready` con **20 documentos** (= perfil), tasa 771,07 BS, moneda USD, leyenda Vigente/Vencido |
| DM-CLT-016 | ✅ PASS | `clickBack` desde el listado → `app-clientes` con los 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde el detalle → `app-client-list` con los 30 ítems repoblados |
| DM-CLT-019 | ✅ PASS | Form `app-client-new-potential-client`: **9 `ion-input`** (8 `ng-invalid` + `naWebSite` ya válido ⇒ opcional) · Guardar/Enviar **ambos `disabled=true`** |
| DM-CLT-021 | ✅ PASS | Llenados los 8 obligatorios por teclado real → Guardar/Enviar `disabled=false` **sin tocar el `ion-select` de empresa** |
| DM-CLT-024 | ✅ PASS | Alert `[OK]` "Denario Cliente / ¡Cliente Potencial Guardado con exito!" → aparece en BUSCAR CLIENTE POTENCIAL con **Estatus: Guardado**, Nro. Ref 0 y trash presente |
| DM-CLT-026 | ✅ PASS | 3 alertas → **"Cliente potencial nro. 78 creado exitosamente"** · lista muestra **Ref 78 / Estatus Enviado / sin trash** |
| DM-CLT-031 | ✅ PASS | Trash en el Guardado → borrado **directo sin confirmación previa**, 1 alerta `[OK]` "¡Cliente Potencial se borro con exito!" · lista 2→1 y BD local también |

### Casos que pedían adjuntar
🚫 **Ninguno aplicó.** El form de cliente potencial **no ofrece adjuntos ni firma** (0 controles de cámara, 0 `input[type=file]`, 0 `canvas`), así que no hubo nada que saltear. Instrucción de la QA respetada: **no se adjuntó nada** y no se usó el mock de cámara.

## Registros creados en sistema

| Ref | Detalle | epoch (`co_client`) | Estado |
|-----|---------|---------------------|--------|
| **78** | `Test-CLT-SMOKE-150841` · RIF J987654321 · empresa `KRON_ADM` (id 1) · vendedor VE0002 | `1786993684489.0` | ✅ **Enviado — BD-OK** (nube `id_client=78`) |
| 0 | `Test-CLT-DEL-151142` · RIF J987654322 — creado solo para DM-CLT-031 | — | 🗑 **Borrado** (nunca salió del device) |

> El potencial **78 es el único registro de este tenant sin adjuntos** — queda disponible para la capa web.

## Verificación BD

**Baseline** (nube, antes del módulo): `potential_client` → 72 filas · `max(id_client)` = **77**.
**Diff post-envío:** exactamente **1 fila nueva**, `id_client = 78`. Sync **INMEDIATA** (visible en el primer poll).

Cotejo campo-a-campo **payload ↔ nube: 16/16 cuadran** ⇒ **BD-OK**.

| Campo | Payload (device) | Nube (`potential_client`) |
|---|---|---|
| `coClient` / `co_client` | `1786993684489.0` | `1786993684489.0` ✅ |
| `naClient` | `Test-CLT-SMOKE-150841` | idem ✅ |
| `nuRif` | `J987654321` | idem ✅ |
| `txAddress` / `txAddressDispatch` | `AV PRINCIPAL QA KRON, CARACAS` | idem ✅ |
| `txClient` | `Cliente potencial de prueba QA smoke` | idem ✅ |
| `naResponsible` | `RESPONSABLE QA` | idem ✅ |
| `emClient` | `qa.kron@kiberno.com` | idem ✅ |
| `nuPhone` | `04141234567` | idem ✅ |
| `naWebSite` | `null` (no se llenó) | `null` ✅ |
| `idEnterprise` / `coEnterprise` | `1` / `KRON_ADM` | `1` / `KRON_ADM` ✅ |
| `coUser` / `idUser` | `VE0002` / `309` | `VE0002` ✅ |
| `coordenada` | `11.0490271,-63.8650027` | idem ✅ |
| `nuAttachments` / `hasAttachments` | `0` / `false` | `0` / `false` ✅ |
| `daClient` | `2026-08-17 15:10:37` | `da_created 2026-08-17T19:10:38Z` — mismo día, **UTC-4** ⇒ nota, no mismatch |

**Estado local** (`potential_clients` vía `sqlitePlugin`): `id_client=78` (>0 ⇒ enviado), `st_potential_client=2`, `co_enterprise='KRON_ADM'`, `nu_attachments=0`, `has_attachments="false"` (string). `pending_transactions` y `failed_transactions` **vacías** ⇒ salió de la cola.

**Conclusión guardado→enviado:** ✅ lo que se guardó se envió, íntegro y una sola vez. POST `potentialclientservice/potentialclient` capturado **1 sola vez con `data` completo** (0 duplicados).

- `st_potential_client`: nube **1** vs local **2** para el mismo registro ⇒ **dominios distintos, NO es mismatch** (5.ª confirmación).
- **Correlación Ref UI = `id_client`** reconfirmada (UI "nro. 78" = `id_client` 78).

## Hallazgos

### H-1 · "Crédito Disp." muestra las etiquetas de moneda CRUZADAS y aplica la conversión al revés — S3
**Reproduce en la versión en prueba** (cálculo en vivo sobre el detalle, con datos actuales; **no** es una anomalía de registros históricos). Confirmado en **2 clientes distintos**.

Con `nu_credit_limit = 0,0000` (verificado en BD para ambos), el Crédito Disponible debería ser el negativo del saldo en cada moneda. Lo que muestra la app:

| Cliente | Saldo BS | Saldo USD | Crédito Disp. **BS** (mostrado) | Crédito Disp. **USD** (mostrado) | Esperado BS | Esperado USD |
|---|---|---|---|---|---|---|
| `J504480975` MINIMARKET BICENTENARIA CCS | 87.234.295,07 | 113.134,08 | **-113.134,08** | **-146,72** | -87.234.295,07 | -113.134,08 |
| `J075129342` ONCE ONCE, C.A | 29.713.891,83 | 38.535,92 | **-38.535,92** | **-49,98** | -29.713.891,83 | -38.535,92 |

El valor rotulado **BS** es en realidad el importe en **USD**, y el rotulado **USD** es ese mismo importe **dividido** otra vez por la tasa (771,07) en vez de multiplicado. Modelo Angular: `availableCreditConversion = "-146,72"` / `"-49,98"`.

Es el **mismo patrón** del defecto `CLT-LISTA-SALDOS-CRUZADOS` de `[gmp-20260730]` (etiqueta cruzada + conversión invertida), pero manifestado en las **líneas de Crédito Disponible del DETALLE**, no en los saldos de la lista.

⚠ **Los saldos propiamente dichos están CORRECTOS acá** — ver oráculos abajo. El defecto está acotado a las 2 líneas de Crédito Disp.
**Impacto:** informativo, no bloquea ninguna transacción; en esta cartera el límite de crédito es 0 en los 30 clientes. Por eso S3 y no mayor.

### Lo que NO reproduce (verificado con oráculos, no asumido)
- ❌ **`CLT-LISTA-SALDOS-CRUZADOS`**: lista y detalle muestran **los mismos** saldos, y `Σ allDocuments.nuBalance` (20 docs) = **113.134,08** = `saldoFuerte` **exacto**; `saldoLocal` = ese × 771,07. Coherencia interna perfecta.
- ❌ **Defecto de render de la lista de potenciales** (`[gmp-20260730]`): la lista **SÍ refresca** tras guardar, enviar y borrar, sin salir y re-entrar.
- ❌ **`PRD-BUSCADOR-NO-REPUEBLA`**: al volver del detalle la lista repuebla sola a 30 (coherente con el acotamiento a PRODUCTOS).

## Los 3 descubrimientos encargados

### (1) PENDIENTE #2 del perfil — el selector de empresa · **RESUELTO**
**Sí existe** el `ion-select[formcontrolname="idEnterprise"]`, y vive **dentro del formulario de cliente potencial** (0 `ion-select` en `app-login` y en `app-home`).

Estado al abrir el form **nuevo**:

| Propiedad | Valor medido |
|---|---|
| `disabled` | **`true`** (+ clase `select-disabled`) |
| `value` | **`null`** |
| `ng-invalid` | **`false`** ⇒ **FUERA de la validación** |
| shadowRoot | rotula literalmente **"Seleccione…"** |
| opciones | **1** — `{value: 1 (number), texto: "CHOCOLATES KRON, C.A"}` |

**Par de botones (el oráculo válido):** con el form vacío, Guardar/Enviar `disabled=true`; tras llenar **solo los 8 `ion-input`** y **sin tocar el select**, ambos pasaron a `disabled=false` en el mismo tick.
**Payload:** viajó `idEnterprise: 1` / `coEnterprise: "KRON_ADM"`, y la nube guardó `id_enterprise=1` / `co_enterprise='KRON_ADM'`.
**Round-trip:** al reabrir el Guardado, el MISMO select devuelve **`value = 1` (number)** y rotula **"CHOCOLATES KRON, C.A"**.

⇒ El `value=null` + "Seleccione…" del form nuevo es un **falso negativo**; la empresa está auto-asignada. **Forzar el `value` habría sido el error.** Se respetó el anti-patrón y no se tocó.

🔴 **El dato nuevo que aporta esta corrida:** aquí `enterpriseEnabled = **TRUE**` con 1 empresa, y en `grupo_fiel-20260817` era `enterpriseEnabled = **FALSE**` con 1 empresa — **y el comportamiento es idéntico** (`disabled=true`, auto-asignada, fuera de validación). ⇒ **`enterpriseEnabled` NO gobierna la variante de `idEnterprise` en CLIENTES.** El discriminador sigue siendo el **nº de empresas** (1 ⇒ `disabled`; 2+ ⇒ editable/obligatorio), ahora con **5 corridas coherentes** y **desacoplado de la VG**.
📋 **Para el perfil:** la incoherencia "⚠️VERIFICAR `enterpriseEnabled=true` con 1 sola empresa" queda **resuelta y sin consecuencia práctica**: todo caso de *cambio* de empresa es N/A, tal como anticipaba el YAML.

### (2) Nombre EXACTO de la empresa en la UI · **CAPTURADO**
> ## `CHOCOLATES KRON, C.A`   ← **sin punto final**

Aparece idéntico en **dos** puntos de la UI: la línea `Empresa:` del detalle de cliente y la única opción del `ion-select` de cliente potencial.
Corresponde a **`lb_enterprise`**, no a `na_enterprise` (que en BD sí trae el punto: `CHOCOLATES KRON, C.A.`).
⇒ **Los 8 agentes siguientes y la capa web deben cotejar contra `lb_enterprise`**; un mismatch contra `na_enterprise` es falso positivo.
❌ **"Denario Premium" NO es el tenant** — es el rótulo de la app (y el título de 2 de las 3 alertas de envío).

### (3) La PLAYA, empíricamente · **CONFIRMADA**
Host del POST de cliente potencial:
```
http://denarioislacoche.ddns.net:8081/PremiumWS/services/potentialclientservice/potentialclient
```
⇒ **ISLA COCHE**. Resuelto contra `automation/web/playas.yaml` → `playas.isla_coche` → web base **`http://denarioislacoche.ddns.net:8080/DenarioPremium`**.
Los 5 POST de `syncservice/getsync` apuntan al mismo host, así que la señal es consistente y no depende de una sola muestra.
✅ Confirma la asunción de la QA (recompiló el APK apuntando ahí). ⚠ Reconfirmado que el host **NO** está en `localStorage`: solo se obtiene del hook de payload.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`enterpriseEnabled` NO gobierna la variante de `idEnterprise` en CLIENTES** | universal | kron tiene `enterpriseEnabled=**true**` + 1 empresa y entrega el select `disabled=true`/`value=null`/`ng-invalid=false`/"Seleccione…" — **idéntico** a grupo_fiel, que tenía `enterpriseEnabled=**false**` + 1 empresa. ⇒ el discriminador es el **nº de empresas**, y la VG es irrelevante para esta variante. **5.ª corrida coherente** (latino_cosmetica 1 · grupo_fiel 1 · kron 1 ⇒ disabled; el_palmar 2 · difranca 3 ⇒ editable). Regla operativa sin cambios: **leer `sel.disabled` SIEMPRE antes de decidir** |
| ✅ **3.ª confirmación del anti-patrón `value=null` + "Seleccione…" con `disabled=true`** | universal | Medido el par completo: botones `disabled` antes → `habilitados` tras los 8 inputs **sin tocar el select**; payload con `idEnterprise:1`; y al reabrir el Guardado el select devuelve `value=1` (number) rotulando `"CHOCOLATES KRON, C.A"`. **El oráculo válido es el par de botones + el payload, nunca el `value` ni el rótulo del form nuevo** |
| ⚠ **El `ion-select` de empresa rotula `lb_enterprise`, y acá difiere de `na_enterprise` solo por el punto final** | universal | `lb_enterprise="CHOCOLATES KRON, C.A"` vs `na_enterprise="CHOCOLATES KRON, C.A."`. Con 1 empresa no hay truncado a 19 chars (difranca), pero la regla "cotejar contra `lb_enterprise`" se sostiene: un diff por un punto se lee como mismatch |
| 🔴 **`Crédito Disp.` con etiquetas cruzadas + conversión invertida (H-1)** | a confirmar | Ver hallazgo H-1. Patrón hermano de `CLT-LISTA-SALDOS-CRUZADOS` pero en el DETALLE, y **conviviendo con saldos correctos**. ⇒ **al validar DM-CLT-009 no basta con comparar los saldos lista↔detalle: hay que revisar también las 4 líneas de Crédito** |
| ✅ **Oráculo barato de coherencia de saldos: `Σ allDocuments.nuBalance` vs `saldoFuerte`** | universal | Se lee del componente sin paginar la tabla: `ng.getComponent(app-client-detail)` expone `allDocuments`, `saldoLocal`, `saldoFuerte`, `availableCreditConversion`, `nuCreditLimitConversion`. Dio 113.134,08 = 113.134,08 exacto. Reconfirma la receta de `[el_palmar-20260805]` y **la abarata** (no hace falta sumar la columna de la UI) |
| ⚠ **El hook de payload del agente LOGIN puede NO existir — verificarlo, no asumirlo** | universal | En esta corrida `window.__qaH` traía **solo 2 skills** (`fillIonInput`, `activeAlertInfo`) y **`window.__qaDataHook` era `false`** ⇒ la receta "consumir `__qaH.getPayloadData()` heredado" **no aplicaba**. Diagnóstico de 1 línea al arrancar: leer `Object.keys(window.__qaH)` + `!!window.__qaDataHook`; si el hook falta, instalarlo con la guarda propia (0 duplicados: 1 POST capturado 1 vez) |
| ✅ **Búsqueda de clientes: NO filtra on-keyup, exige el botón search** | universal (reconfirma) | Tras tipear `BICENTENARIA` la lista seguía en 30; tras `ion-icon[name="search-circle-sharp"]` (317,94) bajó a 3. Reconfirma `[ins-2606]` en un 3.er servidor |
| ⚠ **kron: hay TRES "MINIMARKET BICENTENARIA", no dos** | cliente | El YAML advierte de CCS (`J504480975`) y VALENCIA (`J505383973`), pero la búsqueda devuelve además **`J409215121` MINIMARKET BICENTENARIA, C.A.** (saldo 165.823,96 USD — el mayor de los tres). **Anclar por `co_client` es aún más obligatorio de lo anotado** |
| ✅ **Coords estables reconfirmadas en este device** | cliente | Infinix HOT 60i (360×744): CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245) · `.imagenGuardar` (267,32) · `.imagenEnviar` (326,32) · back (32,47) · reapertura zona izq. (129,238) |

### Etiquetas de alert medidas en este módulo (leídas, no predichas)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Guardar | `Denario Cliente` (singular) | ¡Cliente Potencial Guardado con exito! | `[OK]` |
| Enviar · paso 1 | `Denario Clientes` (plural) | ¿Desea enviar nuevo Cliente Potencial? | `[Cancelar, **Aceptar**]` |
| Enviar · paso 2 | `Denario Premium` | El cliente potencial será enviado | `[OK]` |
| Enviar · paso 3 | `Denario Premium` | Cliente potencial nro. 78 creado exitosamente | `[OK]` |
| Borrar | `Denario Clientes` | ¡Cliente Potencial se borro con exito! | `[OK]` — **directo, sin confirmación previa** |

Idéntico al reparto de `el_palmar-20260805` / `difranca-20260807`. El bucle `['Aceptar','OK','Eliminar']` por **igualdad exacta case-insensitive** resolvió los **5 alerts sin un solo reintento**.


> ✅ consolidado 2026-08-17
## VGs verificadas en este módulo

| VG | Valor perfil | Veredicto medido |
|---|---|---|
| `enterpriseEnabled` | `true` ⚠️VERIFICAR | ✅ **Resuelto** — select presente con 1 opción, `disabled`, auto-asignado. Sin consecuencia práctica; cambio de empresa = N/A |
| `multiCurrency` | `true` | ✅ **REAL** en lista **y** detalle (`Saldo BS` + `Saldo USD`) |
| `clientsOrderBy` | `co_client` | ✅ confirmado — la lista viene ordenada por **código** |
| `showCreditLimit` | `true` | ✅ el detalle muestra las 4 líneas de crédito ⚠ con el defecto H-1 |
| `userCanUploadFiles` / `showCamera` / `quAttach` | `true`/`true`/25 | 🚫 **N/A en CLIENTES** — 0 controles de adjunto en el form (payload `nuAttachments:0`) |
| `signatureClient` | `true` | 🚫 **N/A en CLIENTES** — 0 `canvas`; Guardar y Enviar funcionan sin firma |
| `userCanSaveGPS` / `userMustActivateGPS` | `true` / `false` | ✅ coherente: el payload lleva `coordenada:"11.0490271,-63.8650027"` sin alert ni exigencia de GPS |
| `requiredComment` | `false` | 🚫 sin efecto acá — el form de potencial no tiene campo comentario (su alcance es COBROS) |

---
*Agente CLIENTES · 12/12 PASS · 0 FAIL · 0 BLOCKED · 0 cuelgues de CDP · estado final: HOME*

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

> 🆕 **Primera vez que el motor `cotejo-payload.js` corre contra el esquema de `kron`.** El config
> `potentialClient` funcionó **al primer intento, sin ajustes**.

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786993684489.0` (Test-CLT-SMOKE-150841, Ref 78) | **BD-FIELD-OK** | **17/17 OK** | 0/0 (sin hijas) | **0** | 1 (zona horaria en `da_client`) |
| `Test-CLT-DEL-151142` (DM-CLT-031, borrado) | — | — | — | — | Payload **no capturado** ⇒ no cotejable; su ausencia en la nube es **esperada** |

**Detalle campo a campo — 17/17:**

| Campo | Payload | Nube | |
|---|---|---|---|
| `co_client` | 1786993684489.0 | 1786993684489.0 | ✅ |
| `na_client` | Test-CLT-SMOKE-150841 | idem | ✅ |
| `nu_rif` | J987654321 | idem | ✅ |
| `na_responsible` | RESPONSABLE QA | idem | ✅ |
| `em_client` | qa.kron@kiberno.com | idem | ✅ |
| `nu_phone` | 04141234567 | idem | ✅ |
| `co_user` / `id_user` | VE0002 / 309 | idem | ✅ |
| `tx_address` / `tx_address_dispatch` | AV PRINCIPAL QA KRON, CARACAS | idem | ✅ |
| `tx_client` | Cliente potencial de prueba QA smoke | idem | ✅ |
| `da_client` | 2026-08-17 15:10:37 | 2026-08-17T19:10:37.000Z | ✅ *(nota: TZ, mismo día)* |
| `co_enterprise` / `id_enterprise` | KRON_ADM / 1 | idem | ✅ |
| `coordenada` | 11.0490271,-63.8650027 | idem | ✅ |
| `nu_attachments` / `has_attachments` | 0 / false | idem | ✅ |

**Excluidos del cotejo (config `ignore` o no aplicables):** `id_client` (PK del servidor — ⚠ en esta tabla la PK
**no** se llama `id_potential_client`), `st_potential_client` (difiere por diseño, **5.ª confirmación**, no es
mismatch), y los campos `SRV` genéricos (timestamps y flags de sync).

**Payload-only sin columna en nube, correctamente salteados por la regla payload-driven** (llegaron `null`):
`naWebSite`, `coordenadaClient`. El bloque `transactionDeviceAuth` (deviceUUID, appVersion, coTransaction…) es
**metadata de transporte**, no pertenece a `potential_client` ⇒ bien excluido.

**Sin adjuntos:** coherente con la instrucción de QA — `nu_attachments=0` / `has_attachments=false` cuadran en
ambos lados.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.

> Coincide 1:1 con el cotejo manual 16/16 del agente UI (el motor cotejó 17 al incluir `co_client`):
> dos métodos independientes, mismo veredicto.
