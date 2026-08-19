# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | CLIENTES |
| Cliente | `run_vzla` |
| Empresa | `FERRE_N` · rótulo UI **`CORPORACION FERRE 19`** (= `lb_enterprise`, sin ", C.A.") |
| App | `com.kiberno.denarioPremiumPro` · `window.ng=true` · `sqlitePlugin` disponible |
| Playa | 🟢 **LA TORTUGA — CONFIRMADA EMPÍRICAMENTE** (`http://denariolatortuga.ddns.net:8081`, host del POST) |
| Usuario QA | `id_user 470` · `co_user '000208'` · 1.569 clientes en cartera |
| Viewport | 360 × 744 |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=45 min`, `page` pasado · **0 cuelgues**, 0 `TIMEOUT:` |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` con los 3 `ion-button.colorBorderBuscar`: CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245) |
| DM-CLT-002 | ✅ PASS | `app-client-list` con 50 ítems. **Solo "Saldo US$"** (no hay línea BS): `multiCurrency=false`, `localCurrency="US$"`, `hardCurrency=""` ⇒ tenant mono-moneda. 1.º = `007554` CORPORACION FERRE 19 · 10.784,04 |
| DM-CLT-003 | ✅ PASS | `searchText='FERRETERIA'` → los 50 ítems contienen el término. Filtra por `na_client`. Requiere click en `ion-icon[name="search-circle-sharp"]` (317,94): **no filtra on-keyup** (50 ítems tras teclear, sin cambio) |
| DM-CLT-009 | ✅ PASS | `app-client-detail` de `006831` FERRETERIA EPA, C.A: Empresa **CORPORACION FERRE 19** · RIF J-00271144-2 · Saldo US$ **-22,50** · Crédito US$ 0,00 · Crédito Disp. US$ 22,50 · Condición 005-CONTADO · Coordenada. `Σ allDocuments.nuBalance` (129 docs) = `saldoLocal` = **-22,50** = neto BD **exacto** |
| DM-CLT-013 | ✅ PASS | Tab `docVentas`: `.documents-table-panel--ready`, leyenda **"Vigente / Vencido / A favor"**, `documentSalesTotalRows=129`, page size 30. Header: Tipo · Nº Doc. · Moneda Doc. · Días Venc. · Monto Base · Monto IVA · Monto Descuento · Monto Total · Saldo · Fecha Doc. · Fecha Venc. · Comentario. `colorRow:"Red"` marca los vencidos |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (50 ítems). **No salta a HOME** |
| DM-CLT-019 | ✅ PASS | Form vacío: 9 `ion-input` (8 `ng-invalid` + `naWebSite` válido) y `imagenGuardar`/`imagenEnviar` **`disabled=true`**. `idEnterprise`: `disabled=true`, `value=null`, `ng-invalid=false`, shadowRoot `"Seleccione..."`, 1 opción `{value:1 (number), "CORPORACION FERRE 19"}` |
| DM-CLT-021 | ✅ PASS | **Par medido:** con los 8 `ion-input` llenos por teclado real y **sin tocar el select**, ambos botones pasan `disabled` `true → false` en el mismo tick |
| DM-CLT-024 | ✅ PASS | Alert `Denario Cliente` / `¡Cliente Potencial Guardado con exito!` `[OK]`. El form **no navega**. Local: `co_client=1787081927022.0`, `id_client=0`, `st_potential_client=0`. En BUSCAR aparece con **Nro. Ref: 0 · Estatus: Guardado** y trash |
| DM-CLT-026 | ✅ PASS | 3 alertas → `"Cliente potencial nro. **194** creado exitosamente"`. Estatus pasa a **Enviado** (sin trash). Nube `id_client=194`, `st_potential_client=1`, `co_operation='I'`. Cotejo payload↔nube **16/16** |
| DM-CLT-031 | ✅ PASS | Trash (318,227) sobre `Test-CLT-DEL-154139`: **borrado directo sin confirmación previa**, alert `Denario Clientes` / `¡Cliente Potencial se borro con exito!` `[OK]`. Lista 3 → 2 y desaparece de `potential_clients` local |

---

## Registros creados en sistema

| Ref (UI) | Documento / Registro | Detalle | Estado | Marca BD |
|----------|----------------------|---------|--------|----------|
| **194** | Cliente potencial `potential_client` · `id_client=194` · `co_client=1787081927022.0` | `Test-CLT-SMOKE-153911` · RIF J987654321 · empresa `FERRE_N`/`id_enterprise=1` · `co_user='000208'` / `id_user=470` · coord `11.0492583,-63.8649233` · 0 adjuntos | **Enviado** (`st_potential_client=1` nube · `=2` local) | **BD-OK** |
| 0 | Cliente potencial local `potential_clients` (nunca enviado) | `Test-CLT-DEL-154139` · RIF J111222333 — creado exclusivamente para ejercer DM-CLT-031 | **Guardado → BORRADO** | BD-SAVED (no llegó a nube, correcto) |

**Diff de baseline filtrado por `id_user = 470`** (tomado inmediatamente antes de Enviar, tenant vivo con 7 vendedores transaccionando):

| Momento | `count(*)` id_user=470 | `max(id_client)` |
|---|---|---|
| Antes de Enviar | 1 | 193 (`Emma`, de la QA) |
| Después | **2** | **194** |

`count(*) = count(DISTINCT co_client) = 2` ⇒ **sin duplicados**. `pending_transactions` = 0 · `failed_transactions` = 0 ⇒ **sync INMEDIATA**.

### Verificación BD — cotejo campo a campo (payload ↔ nube)

| Campo | Payload (`potentialclientservice/potentialclient`) | Nube `potential_client` | ✓ |
|---|---|---|---|
| coClient | `1787081927022.0` | `1787081927022.0` | ✅ |
| naClient | `Test-CLT-SMOKE-153911` | idem | ✅ |
| nuRif | `J987654321` | idem | ✅ |
| naResponsible | `QA Automatizacion` | idem | ✅ |
| emClient | `qa.smoke@kiberno.com` | idem | ✅ |
| nuPhone | `04121234567` | idem | ✅ |
| txAddress | `Av Principal QA 123, Turmero, Aragua` | idem | ✅ |
| txAddressDispatch | `Galpon 7 Zona Industrial QA` | idem | ✅ |
| txClient | `Cliente potencial generado por smoke QA run_vzla` | idem | ✅ |
| naWebSite | `null` | `null` | ✅ |
| coUser / idUser | `000208` / `470` | idem | ✅ |
| coEnterprise / idEnterprise | `FERRE_N` / `1` | idem | ✅ |
| coordenada | `11.0492583,-63.8649233` | idem | ✅ |
| coordenadaClient | `null` | `null` | ✅ |
| nuAttachments / hasAttachments | `0` / `false` | `0` / `false` | ✅ |
| daClient | `2026-08-18 15:40:48` (local UTC-4) | `2026-08-18T19:40:48Z` | ✅ *(nota de zona horaria, no mismatch — §10.b)* |

⇒ **`BD-OK` / `BD-FIELD-OK`**. POST capturado **1 sola vez y con `data`**. Correlación **Nro. Ref UI = `id_client`** reconfirmada (194).

---

## 🔴 Los dos pendientes que este módulo debía resolver

### 1. Playa efectiva — **RESUELTA: LA TORTUGA**

El hook de payload sobre `Capacitor.nativePromise` capturó **6 POST** durante el módulo y **todos** salen del mismo host:

```
http://denariolatortuga.ddns.net:8081/PremiumWS/services/syncservice/getsync
http://denariolatortuga.ddns.net:8081/PremiumWS/services/potentialclientservice/potentialclient
```

`Array.from(new Set(payloads.map(host)))` → **`["http://denariolatortuga.ddns.net:8081"]`**, un único elemento.
⇒ **LA TORTUGA confirmada empíricamente**, no declarada. (El `http://localhost/home` del reporte de LOGIN, como allí se anotó, no aportaba evidencia: es el webview local de Capacitor.)

### 2. Selector de empresa — **RESUELTO: sí aparece, variante `disabled=true` auto-asignada**

| Qué | Medición |
|---|---|
| ¿Existe en CLIENTES? | **Sí**, en el formulario de **cliente potencial**: `ion-select[formcontrolname="idEnterprise"]` |
| Estado al abrir el form NUEVO | `disabled=true` · clase `select-disabled` · `value=null` (typeof `object`) · **`ng-invalid=false`** · shadowRoot `"Seleccione..."` |
| Opciones | **1** → `{value: 1 (number), label: "CORPORACION FERRE 19"}` |
| ¿Entra en la validación? | **No** — con los 8 `ion-input` llenos y el select intacto, Guardar/Enviar habilitan |
| Al **reabrir** el Guardado | el MISMO select devuelve **`value = 1` (number)** y rotula **`"CORPORACION FERRE 19"`** |
| Lo que viajó | payload `idEnterprise:1` / `coEnterprise:"FERRE_N"` → nube `id_enterprise=1` / `co_enterprise='FERRE_N'` |
| ¿En HOME / login? | **No** — el selector vive únicamente dentro del formulario |

⇒ **Coherente con la regla graduada**: con **1 empresa** el control llega resuelto y fuera de la validación, y `enterpriseEnabled` (aquí `false`) es irrelevante. Es la **6.ª corrida** coherente con ese predictor y la **4.ª** con `value=null` + `"Seleccione..."` en el form nuevo pese a estar auto-asignado.

**Rótulo literal de la empresa en la UI:** **`CORPORACION FERRE 19`** — sin el `, C.A.`. Aparece idéntico en tres sitios: el `ion-select` del form, la cabecera del detalle de cliente (`Empresa: CORPORACION FERRE 19`) y `lblEnterprise` del modelo. Corresponde a `lb_enterprise`; `na_enterprise` (`CORPORACION FERRE 19, C.A.`) **no se muestra en ningún lado de la app**.

### 3. Crédito Disponible (defecto conocido H-1) — **NO REPRODUCE · N/A estructural, con evidencia**

Se abrió el detalle y se midió (no se dio por N/A sin mirar):

- El tenant es **mono-moneda**: `localCurrency="US$"`, **`hardCurrency=""`**, `multiCurrency=false`, `showConversion=false`, `currencyModule.currencySelector=false`.
- El detalle renderiza **exactamente dos líneas de crédito**, ambas en la misma moneda: `Crédito US$:` y `Crédito Disp. US$:`. **No existe el par BS/USD** que el defecto necesita para cruzarse.
- `availableCreditConversion = ""` y `nuCreditLimitConversion = ""` (cadenas vacías ⇒ no se pintan). En kron el defecto vivía justo en `availableCreditConversion`.
- La aritmética de la única línea es **correcta**: `nu_credit_limit` = 0,00 en BD ⇒ `Crédito US$ 0,00`; saldo −22,50 ⇒ `Crédito Disp. US$ 22,50` = `0 − (−22,50)`.

⇒ H-1 **no puede reproducir en este tenant** por ausencia de conversión de moneda, no por estar corregido. No se levanta nada. *(No se citó `client.nu_balance` como evidencia: es 0,0000 y está sin mantener; el saldo se verificó contra `Σ document_sale.nu_balance`.)*

---

## Descubrimientos

### 🟡 `clientsOrderBy="due_date"` — la lista **NO** viene ordenada por fecha de vencimiento

Medido en el modelo (`clientLogic.clients`), lista completa **y** filtrada:

| # | Cliente | `saldo1` | `daDueDate` |
|---|---|---|---|
| 1 | 007554 CORPORACION FERRE 19 | 10.784,04 | 2024-11-04 |
| 2 | 006682 FERRE-PLASTIC | 1.451,88 | 2023-03-03 |
| 3 | 007260 MULTI IMPORT J 2 M | 1.090,11 | 2023-05-03 |
| 4 | 002916 PROCESADORA AGROIND. | 1.042,27 | 2023-06-08 |
| 5 | 007908 FERREINVERSIONES CHEMARI | 1.000,28 | 2024-10-01 |
| 6 | 002247 SERGAMA | 676,63 | 2026-01-24 |
| … | … | … | … |

**`saldo1` es estrictamente decreciente; `daDueDate` va sin orden alguno.** En la lista filtrada por "FERRETERIA" el patrón se confirma incluso con saldos negativos: `409,64 → 292,69 → 75,71 → −1,99 → −22,50 → −25,69 → −141,02`, y **después** los 43 clientes con saldo `0,00` ordenados por **código ascendente**.

⇒ La regla observada es **"clientes con saldo ≠ 0 por saldo DESC, luego los de saldo 0 por código ASC"**, no `due_date`.

**No se marca FAIL** porque ningún caso del smoke cubre el orden y no tengo el oráculo de qué debe producir el valor `due_date` (leer `../src/` está fuera de alcance sin un FAIL S1). Queda como **observación para confirmar con desarrollo**: o la VG no se está aplicando, o el valor `due_date` significa otra cosa. Reproduce **hoy, en la versión bajo prueba, con datos vivos** (no es una anomalía de registros históricos), así que supera el filtro de §4.b como cosa a mirar; lo que falta es la especificación, no la evidencia. Impacto práctico bajo: el orden efectivo prioriza a los mayores deudores, que es útil para el vendedor.

### ✅ El saldo del perfil era **bruto**, el de la app es **neto** — y la app tiene razón

El perfil declaraba para `006831`: *13 documentos, 12 vencidos, 1.258,92 US$*. La app muestra **−22,50** con **129 documentos** / `countDueDate=128`. Cotejo en nube (`co_enterprise='FERRE_N'`, `co_operation IS DISTINCT FROM 'D'`):

| | 006831 | 007554 |
|---|---|---|
| `count(*)` | **129** | 63 |
| `Σ nu_balance` (neto) | **−22,50** | **10.784,04** |
| `Σ nu_balance` solo positivos | 1.258,92 | 22.787,73 |
| `Σ nu_balance` solo negativos | −1.281,42 | −12.003,69 |

La app coincide **al céntimo con el neto** en los dos clientes. El `1.258,92` del perfil salía de filtrar `nu_balance > 0`, es decir ignoraba las notas de crédito / documentos "A favor" — que la propia UI reconoce con la leyenda **"A favor"**. **No es defecto: el perfil estaba midiendo otra cosa.** 📌 Conviene corregir `run_vzla.yaml` (`cliente_detalle: 006831` → 129 docs, saldo neto −22,50) para que PEDIDOS/COBROS/DEVOLUCIONES no arranquen con la cifra equivocada.

### ✅ Sync de documentos **COMPLETA**, no parcial

`documentSalesTotalRows = 129` en UI **=** `count(*) = 129` en nube para la empresa `FERRE_N`. A diferencia de el_palmar / dm-electronica / latino_cosmetica, acá **no** hay subconjunto: el device tiene todos los documentos del cliente. (La cartera sí es parcial por vendedor: 1.569 de 7.966 clientes, que es lo esperado.)

### ✅ `st_potential_client` — dominios distintos, ahora con los **tres** valores medidos

| Estado | Local `potential_clients` | Nube `potential_client` |
|---|---|---|
| Guardado (no enviado) | **`0`** ← *valor nuevo, no registrado antes* | *(no existe la fila)* |
| Enviado | **`2`** | **`1`** |

**6.ª confirmación** de que local y nube usan dominios distintos (no es mismatch), y **1.ª medición del `0` de "Guardado"**.

### ✅ Form de potencial: sin adjuntos, sin firma, con GPS

0 controles de cámara / `input[type=file]`, 0 `<canvas>` y 0 `ion-textarea` en `app-client-new-potential-client`, pese a `userCanUploadFiles=true`, `showCamera=true` y `signatureClient=true` ⇒ esas 3 VGs son **N/A en CLIENTES** y **nada puede bloquear el Enviar** (reconfirma el_palmar / difranca / kron; 4.ª corrida). El payload **sí** lleva `coordenada` (`userCanSaveGPS=true`, `userMustActivateGPS=true` — el GPS del device está activo y no hubo alert de geolocalización). `requiredComment=true` **no tiene efecto** acá: no hay campo comentario en el form.

### ✅ La lista de potenciales **SÍ refresca** (no reproduce el defecto de render de globalmp)

Guardar → 1 ítem nuevo visible sin salir/entrar · Enviar → el Ref pasa de `0` a `194` y el estatus a `Enviado` (desaparece el trash) · Borrar → 3 → 2 ítems. Los tres, inmediatos.

### ✅ `PRD-BUSCADOR-NO-REPUEBLA` **no** aplica a CLIENTES

Al volver del detalle al listado, `searchText` se resetea a `""` y la lista **repuebla sola** a los 50 ítems del baseline. Coherente con la acotación de `[grupo_fiel-20260817]`: el defecto es de **PRODUCTOS**, no universal.

### ⚠ Etiquetas de alert medidas en este módulo (leídas, no predichas)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Guardar | `Denario Cliente` (singular) | `¡Cliente Potencial Guardado con exito!` | `[OK]` |
| Enviar · paso 1 | `Denario Clientes` (plural) | `¿Desea enviar nuevo Cliente Potencial?` | `[Cancelar, **Aceptar**]` |
| Enviar · paso 2 | `Denario Premium` | `El cliente potencial será enviado` | `[OK]` |
| Enviar · paso 3 | `Denario Premium` | `Cliente potencial nro. 194 creado exitosamente` | `[OK]` |
| Borrar | `Denario Clientes` | `¡Cliente Potencial se borro con exito!` | `[OK]` — **sin confirmación previa** |

Idéntico al reparto de el_palmar / difranca / kron. Los ~7 alerts del módulo se resolvieron **sin un solo reintento** recorriendo `['Aceptar','OK','Eliminar']` por igualdad exacta case-insensitive con filtro `width>0`.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El hook de payload es el ÚNICO medio de confirmar la playa — y hay que instalarlo** | universal | El agente LOGIN dejó `window.__qaH` **vacío** (`Object.keys → []`) y `__qaDataHook=false`, igual que en kron. La receta "consumir `__qaH.getPayloadData()`" **no aplicaba**. Diagnóstico de 1 línea al arrancar y, si falta, instalar con **guarda propia** (`window.__qaDataHook`) sobre `Capacitor.nativePromise`. Resultado: 6 POST capturados, `potentialclient` **1 sola vez con `data`**, 0 duplicados. **2.ª corrida seguida en que el hook heredado NO existe** ⇒ la regla estable es *comprobar, nunca heredar ni reinstalar*. |
| Namespace `window.__qaCLI` (3 letras) | universal | 8 skills propias (`views`, `rectOf`, `alertInfo`, `alertBtn`, `homeTile`, `killLoadings`, `fill`, `back`) instaladas sin tocar `__qaH`. Cero colisiones. |
| `.documents-table-scroll` → leyenda **"Vigente / Vencido / A favor"** | universal | El texto literal es de **3** leyendas, **no** "Documento vigente/Documento vencido" como decía el smoke extract. Un match por `/Documento vigente/` devuelve `false` y se lee como "la tab no cargó". Los vencidos se marcan en el modelo con `colorRow:"Red"`. |
| Oráculo barato de saldos vía componente (mejora de `[kron-20260817]`) | universal | `ng.getComponent(document.querySelector('app-client-detail'))` expone `allDocuments`, `saldoLocal`, `saldoFuerte`, `availableCreditConversion`, `nuCreditLimitConversion`, `documentSalesTotalRows`. **En tenants mono-moneda el saldo vive en `saldoLocal` y `saldoFuerte` queda en `0`** — leer solo `saldoFuerte` (como en kron, que era multi-moneda) devuelve 0 y se lee como "el saldo no cargó". **Elegir el campo según `hardCurrency`: vacío ⇒ `saldoLocal`.** |
| El listado de clientes viene ordenado por **saldo DESC**, no por `clientsOrderBy` | por confirmar | Ver *Descubrimientos*. 1.ª medición de `clientsOrderBy="due_date"` en toda la serie de corridas. |
| `st_potential_client = 0` para Guardado local | universal | Completa la tabla de dominios: local `0`=Guardado / `2`=Enviado · nube `1`=Enviado. |
| Reapertura del Guardado por la zona izquierda: `x = rect.x + 0.35·w` | universal | Real (129, 238) sobre un ítem de `x=10, w=340`. 6.ª corrida en que funciona a la primera y devuelve los 9 campos **y** la empresa. |
| Coords estables (device Infinix, 360×744) | cliente | Home clientes: CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245). Header: `imagenGuardar` (267,32) · `imagenEnviar` (326,32). Back: (32,47). Buscador: input (180,95) · lupa (317,94). Trash del 1.er ítem de potenciales: (318,227). |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Hallazgos

**Ninguno que supere el gate de §4.b.** 0 FAIL.

- **H-1 (`Crédito Disp.` con monedas cruzadas)** — 🚫 **no reproduce**: el tenant es mono-moneda (`hardCurrency=""`), no existe el par de líneas BS/USD y la aritmética de la única línea cuadra contra BD. Justificado con la medición, no asumido.
- **Saldo −22,50 vs 1.258,92 del perfil** — ✅ **no es defecto**: la app muestra el neto y coincide al céntimo con `Σ document_sale.nu_balance` en nube; la cifra del perfil era la suma solo de los positivos.
- **Orden de la lista** — 🟡 observación abierta (ver *Descubrimientos*), sin caso de smoke que la cubra y sin oráculo de especificación.

---

## Resumen técnico

**12/12 PASS, 0 FAIL, 0 BLOCKED, 0 cuelgues de CDP.** Wall-clock del módulo ≈ 11 min, **16 `browser_run_code_unsafe`**, 0 reintentos por selector.

1. **Playa confirmada** por el host del POST: **La Tortuga** (`denariolatortuga.ddns.net:8081`) — pendiente heredado de LOGIN, cerrado con evidencia.
2. **Selector de empresa** presente solo en el form de cliente potencial, variante `disabled=true` auto-asignada (1 empresa), rótulo **`CORPORACION FERRE 19`** — pendiente cerrado.
3. **Cliente potencial Ref 194 Enviado, BD-OK**, cotejo campo a campo **16/16**, sync inmediata, colas vacías, sin duplicados, diff de baseline `id_user=470` exactamente **+1**.
4. **Round-trip §9 perfecto**: los 9 campos y la empresa vuelven intactos al reabrir el Guardado.
5. **H-1 no reproduce** por ausencia estructural de conversión de moneda; el saldo y el crédito cuadran contra BD.
6. App devuelta a **HOME** (`app-home` visible, sin alerts activos) para el módulo siguiente (PEDIDOS).

---
Agente: **CLIENTES** · modelo Opus · RUN_ID `20260818_152824_smoke-completo`
