# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | CLIENTES |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA) |
| Dispositivo | Infinix HOT 60i (`Infinix X6728`) · UUID `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v**1.0** / db **19** · `window.ng=TRUE` · `sqlitePlugin` OK |
| **Playa / HOST** | **El Yaque** — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Web de la playa | `http://denarioelyaque.ddns.net:8080/DenarioPremium` (`playas.yaml` → `el_yaque`) |
| Usuario | johana · Johana Belandria · `id_user 463` · `co_user '003'` |
| Empresa | ÚNICA — `00001` GRUPO FIEL, S.A. (GRUFISA) · `lb_enterprise` = "GRUPO FIEL, S.A. (GR" (truncado 20 car.) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues · 0 reintentos · 12 llamadas `browser_run_code_unsafe` |

---

## 🔴 HOST / PLAYA capturado (lo necesitan los agentes web)

Capturado **en runtime** del POST real de envío del cliente potencial (hook `Capacitor.nativePromise`),
y corroborado contra el `WsUrl` activo de `claves.env`:

```
http://denarioelyaque.ddns.net:8081/PremiumWS/services/
```

⇒ Playa **`el_yaque`** — "El Yaque". Base web para los agentes de la capa web:
`http://denarioelyaque.ddns.net:8080/DenarioPremium`
(bloque de credenciales web: `# USUARIO WEB` de la playa **el_yaque**).

⚠ **`localStorage` NO tiene ninguna clave de URL/host** en este build (18 claves: `lastUpdate`,
`sincronizarHome`, `user`, `createTables`, `globalConfiguration`, `coUser`, `connected`, `db_version`,
`token`, `password`, `idUser`, `hardCurrency`, `login`, `localCurrency`, `connectionType`,
`lastLoginImage`, `versionApp`, `recuerdame` — **ninguna es `WsUrl`**). El único camino en runtime es
el **hook de payload** sobre `Capacitor.nativePromise` (`options.url`), que captura tanto los
`syncservice/getsync` como los POST transaccionales.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Tile "Clientes" (286,428) → `app-clientes` + `app-client-header`/`app-client-container`; 3 botones `ion-button.colorBorderBuscar`: CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245) |
| DM-CLT-002 | ✅ PASS | `app-client-list` con **50 ítems** (page size), **Saldo BS y Saldo USD ambos en la lista** (`multiCurrency=true` REAL). Orden **alfabético por NOMBRE** (AREPAS→ASAOS→BACALAO→BELMENY→C.A SEGURIDAD→CLUB LA ROCA) ⇒ `clientsOrderBy=na_client` **confirmado**. Oráculo de saldos: ASAOS 41.441,71 BS / 53,75 USD = tasa 770,99 · C.A SEGURIDAD 18.260,44 / 23,68 = 771,13 ⇒ **NO reproduce el defecto de etiquetas cruzadas** de `[gmp-20260730]` |
| DM-CLT-003 | ✅ PASS | `focus` en `input[type="text"][placeholder="Clientes..."]` + `keyboard.type("MP GELATO")` + click en `ion-icon[name="search-circle-sharp"]` (317,94) → lista filtrada a **1 ítem exacto**: MP GELATO C.A. · J-504863246 · 361.024,51 BS / 468,21 USD |
| DM-CLT-009 | ✅ PASS | `app-client-detail` con Empresa / Nombre / Código / RIF / Email / **Saldo BS 361.024,51** / **Saldo USD 468,21** / Condición de Pago / Lista de Precio / Dirección. **Lista y detalle coinciden 1:1**. `showCreditLimit=true` ⇒ 4 líneas de crédito visibles (Crédito BS, Crédito Disp. BS, Crédito USD, Crédito Disp. USD) |
| DM-CLT-013 | ✅ PASS | Tab `ion-segment-button[value="docVentas"]` (270,91) → `.doc-ventas-tab` con leyenda **Vigente / Vencido / A favor** y 20 columnas. **4 documentos**, tasa 771,07. Días Venc. 41 / 26 / 13 / 0 ⇒ **3 vencidos**, exactamente lo que predice el YAML |
| DM-CLT-016 | ✅ PASS | `clickBack` desde `app-client-list` → `app-clientes` con los 3 botones y 0 ítems |
| DM-CLT-017 | ✅ PASS | `clickBack` desde `app-client-detail` → `app-client-list` con los 50 ítems (**NO salta al HOME principal**; y la lista **repuebla** al re-entrar, no queda en el empty-state de `PRD-BUSCADOR-NO-REPUEBLA`) |
| DM-CLT-019 | ✅ PASS | `app-client-new-potential-client` con **exactamente 9 `ion-input` vacíos**; 8 `ng-invalid` (obligatorios) + `naWebSite` `ng-valid` (opcional). `ion-button.imagenGuardar` (267,32) y `.imagenEnviar` (326,32) ambos **`disabled=true`** |
| DM-CLT-021 | ✅ PASS | 8 campos por teclado real (`pg.focus` + `keyboard.type`, delay 22 ms) — validaron **a la primera**. **Par medido**: antes `{guardar:true, enviar:true}` → después `{guardar:false, enviar:false}`, **sin tocar el `ion-select`** (llega `disabled=true` ⇒ fuera de la validación) |
| DM-CLT-024 | ✅ PASS | Alert **"Denario Cliente / ¡Cliente Potencial Guardado con exito!"** botón **[OK]**. El form NO navega. En BUSCAR CLIENTE POTENCIAL aparece **Nro. Ref: 0 · Estatus: Guardado** con trash (318,237). **La lista SÍ refresca** sin salir y re-entrar (no reproduce el defecto de render de `[gmp-20260730]`) |
| DM-CLT-026 | ✅ PASS | Reapertura por la **zona izquierda** (129,238) → round-trip §9 perfecto. Envío = **3 alertas**: `Denario Clientes / ¿Desea enviar nuevo Cliente Potencial?` **[Cancelar, Aceptar]** → `Denario Premium / El cliente potencial será enviado` **[OK]** → `Denario Premium / Cliente potencial nro. 35 creado exitosamente` **[OK]**. Estatus → **Enviado**, **Nro. Ref: 35**, trash desaparecido. POST `potentialclientservice/potentialclient` capturado **1 sola vez y CON `data`** |
| DM-CLT-031 | ✅ PASS | Trash sobre `Test-CLT-DEL-094013` (Ref 0, Guardado) → **borrado directo sin confirmación previa**, solo alert de éxito `Denario Clientes / ¡Cliente Potencial se borro con exito!` **[OK]**. El registro **desaparece de la lista al instante** (2 ítems → 1... quedan los 2 Enviados). Verificado en nube: **no existe** ninguna fila `Test-CLT-DEL%` |

---

## Registros creados en sistema

| Ref | epoch (`co_client`) | Detalle | Estado | Marca BD |
|-----|---------------------|---------|--------|----------|
| **35** | `1786973829965.0` | `Test-CLT-SMOKE-093737` · RIF J987654321 · empresa `00001`/`idEnterprise=1` · vendedor `003` | **Enviado** | **BD-OK** |
| 0 (sin Ref) | — | `Test-CLT-DEL-094013` · RIF J123456789 — creado Guardado **solo para ejercer DM-CLT-031** | **Borrado** | BD-N/A (nunca se envió; su ausencia en nube es el resultado esperado) |

Referencia preexistente observada en la lista: **Emma W** · RIF 129210234 · **Nro. Ref: 34** · Enviado
(el registro que la QA creó a mano hoy) — confirma la correlación **Nro.Ref UI = `id_client`**.

---

## Verificación BD

**Baseline (inicio del módulo):** `SELECT count(*), max(id_client) FROM potential_client` → **2 filas · max 34**.

**Diff tras Enviar (poll ~8 s):** aparece **exactamente 1 fila nueva**, `id_client = 35`.
**Cierre:** `count = 3 · max = 35` ⇒ **+1 exacto, cero duplicados, cero filas inesperadas.**

**Cotejo campo-a-campo (nube ↔ payload ↔ UI) — 15/15 campos idénticos:**

| Campo | Tipeado en UI | Payload POST | Fila de nube |
|---|---|---|---|
| `na_client` | Test-CLT-SMOKE-093737 | ✅ igual | ✅ igual |
| `nu_rif` | J987654321 | ✅ | ✅ |
| `tx_address` | Av Principal QA 123, Maracaibo | ✅ | ✅ |
| `tx_address_dispatch` | Av Principal QA 123, Deposito | ✅ | ✅ |
| `tx_client` (comentario) | Comentario QA smoke grupo_fiel | ✅ | ✅ |
| `na_responsible` | Johana QA | ✅ | ✅ |
| `em_client` | qa.grupofiel@kiberno.com | ✅ | ✅ |
| `nu_phone` | 04141234567 | ✅ | ✅ |
| `na_web_site` | (vacío, opcional) | `null` | `null` |
| `co_enterprise` / `id_enterprise` | — (select disabled) | `"00001"` / `1` | `"00001"` / `1` ✅ |
| `co_user` / `id_user` | — | `"003"` / `463` | `"003"` ✅ |
| `co_client` (epoch) | — | `1786973829965.0` | `1786973829965.0` ✅ |
| `coordenada` | — | `11.049008,-63.8649939` | idéntica ✅ |
| `nu_attachments` / `has_attachments` | — | `0` / `false` | ✅ |
| `da_created` | — | `daClient 2026-08-17 09:39:10` | `2026-08-17T13:39:11.108Z` (UTC-4 ⇒ mismo instante, **nota, no mismatch**) |

**Estado local (`window.sqlitePlugin`, tabla PLURAL `potential_clients`):**
`id_client=35` · `co_client=1786973829965.0` · `st_potential_client=**2**` · `id_enterprise=1` ·
`co_enterprise='00001'` · `co_user='003'` · `has_attachments="false"` (string, quirk conocido).
`pending_transactions WHERE type='potentialClient'` → **0** · `failed_transactions` → **0**
⇒ **salió de la cola limpio.**

**Conclusión guardado→enviado:** ✅ lo que se guardó se envió. **`BD-OK`.**
**Sync a la nube: INMEDIATA** (la fila ya estaba a los ~8 s del Enviar).

⚠ **`st_potential_client` = `1` en NUBE vs `2` en LOCAL para el MISMO registro** — **4ª confirmación**
de que son **dominios distintos**, no un mismatch (tras `[prc-2606]`, `[el_palmar-20260805]`,
`[difranca-20260807]`). No reportarlo nunca como defecto.

---

## Observaciones de datos (NO son defectos de la app)

1. **Límite de crédito absurdo en `client.nu_credit_limit`.** El detalle de MP GELATO muestra
   `Crédito BS: 10.000.000.000.000.000,00` y `Crédito USD: 12.968.991.142.179,05`.
   Verificado en BD: `nu_credit_limit = 10000000000000000.0000` (**1e16**) — **la app lo renderiza fiel**,
   y la conversión USD = 1e16 / 771,07 es exacta. ⇒ **dato basura del maestro de clientes**, no un
   defecto de cálculo. Vale la pena que QA lo eleve al equipo de datos de GRUPO FIEL.
2. **`nu_document` viene con el literal `"NULL"`** en los documentos de venta (el modelo Angular devuelve
   `nuDocument:"NULL"` como string). La UI rotula bien la columna "Nº Doc." porque usa
   **`co_document_sale`** (B063148, B064155, B064925, B065805). Ya estaba anotado en el YAML para
   devoluciones — **se confirma también en el tab Doc. de Venta de CLIENTES**.

---

## Verificación de VGs del perfil (lo que este módulo pudo dirimir)

| VG del YAML | Veredicto medido en CLIENTES |
|---|---|
| `multiCurrency: true` | ✅ **REAL en lista Y detalle** (Saldo BS + Saldo USD en ambos) |
| `clientsOrderBy: "na_client"` | ✅ **confirmado** — la lista viene alfabética por nombre |
| `showCreditLimit: true` | ✅ **confirmado** — 4 líneas de crédito en el detalle |
| `enterpriseEnabled: false` (1 empresa) | ⚠ **matiz**: el `ion-select[formcontrolname="idEnterprise"]` **SÍ se renderiza** en el form de potencial, pero llega **`disabled=true`** con la única empresa auto-asignada ⇒ funcionalmente no hay selección de empresa. Coherente con la VG; **no es divergencia**. Mismo patrón ya visto en dm-electronica |
| `signatureClient: true` | 🚫 **N/A en CLIENTES** — **0 `canvas`** de firma en `app-client-new-potential-client`; Guardar y Enviar completaron sin firma |
| `userCanUploadFiles: true` · `showCamera: true` · `quAttach: 25` | 🚫 **N/A en CLIENTES** — **0 controles de cámara/adjunto** en el form; payload con `nuAttachments:0` / `hasAttachments:false`. **Nada puede bloquear el Enviar** ⇒ no hizo falta `installCameraMock`. Reconfirma `[el_palmar-20260805][difranca-20260807]` |
| `userMustActivateGPS: true` · `userCanSaveGPS: true` | ✅ el payload viaja con `coordenada:"11.049008,-63.8649939"` (`coordenadaClient:null`), **sin ningún alert ni exigencia de GPS** (el device tenía ubicación encendida, `location_mode=3`) |
| `requiredComment: true` — **alcance** | El campo comentario del form es `ion-input[formcontrolname="txClient"]`, y es **obligatorio** (llega `ng-invalid`, y Guardar no habilita sin él). ⚠ **Pero eso es el comportamiento base del form de potencial en TODOS los clientes** (los 8 campos son obligatorios también donde `requiredComment=false`) ⇒ **este módulo NO permite atribuirle el efecto a la VG**. El alcance real de `requiredComment` sigue siendo COBROS — dirimirlo allí. |
| `longitudComentario: 200` | ❌ **la UI NO usa ese valor**: `txClient` llega con **`maxlength="255"`** (constante de producto `TEXT_COMMENT_MAX_LENGTH`, no la VG). Coherente con la nota de `[alipascua-20260804]` de que el tope lo fija el build — pero **acá es 255, no 120**. No reportar como incumplimiento de VG |
| `tagRif: "RIF"` | ✅ el detalle rotula "RIF:" |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Un `ion-select` `disabled` con `value=null` NO significa "sin asignar" — el valor aparece al REABRIR** | **universal** | En el form **nuevo** de cliente potencial, `idEnterprise` llega `disabled=true`, **`value=null`** y su shadowRoot rotula literalmente **"Seleccione..."**. Se lee como "la empresa no está asignada" y tienta a forzar `s.value=1`. **Es falso**: al reabrir el registro Guardado, el MISMO select devuelve **`value=1`** y rotula **"GRUPO FIEL, S.A. (GR"**, y el payload viajó con `idEnterprise:1`/`coEnterprise:"00001"` correctos. ⇒ **Con `disabled=true`, no tocar nada y no juzgar por `value` ni por el rótulo del shadowRoot**: el oráculo válido es el par (botones antes/después) y el payload. Nuevo matiz sobre `[latino_cosmetica-20260729]`, que no había medido el `value` ni el rótulo |
| ✅ **En CLIENTES el discriminador de la variante de `idEnterprise` es el Nº DE EMPRESAS** (4 corridas coherentes) | **universal** | `1 empresa ⇒ disabled=true`, auto-asignada, fuera de la validación (latino_cosmetica-20260729, **grupo_fiel-20260817**). `2+ empresas ⇒ disabled=false, value=null, ng-invalid`, obligatoria (el_palmar 2, difranca 3). El corolario de difranca "la fija el formulario" sigue valiendo **entre módulos**; **dentro de CLIENTES** el predictor es el nº de empresas. Igual: **leer `sel.disabled` SIEMPRE antes de decidir** |
| **`app-client-home` NO existe** — la raíz es `app-clientes` | universal | El smoke extract nombra `app-client-home` en DM-CLT-001/016; el componente real es **`app-clientes`** (+ `app-client-header` + `app-client-container`). Ya estaba en `module-selectors/clientes.md`; **se reconfirma** y conviene corregir el texto de `smoke-clientes.md` |
| **`app-text-comment-counter`** — componente nuevo en el form de potencial | universal (build v1.0/db19) | Acompaña a `ion-input[formcontrolname="txClient"]`, que trae **`maxlength="255"`**. Es el contador de caracteres del comentario. Útil como oráculo del tope real sin tipear 200+ caracteres |
| **El HOST solo es observable por el hook de payload** en este build | universal | `localStorage` **no tiene ninguna clave de URL** (18 claves, ninguna `WsUrl`/`servidor`). El único camino en runtime: hookear `Capacitor.nativePromise` y leer `options.url` — sirven tanto los `syncservice/getsync` (aparecen solos, sin crear nada) como los POST transaccionales. **Guardar los `options.url` de TODA llamada en un buffer aparte** (`window.__qaAllUrls`), no solo los POST filtrados: así el host se tiene desde el primer segundo sin depender de crear un registro |
| **Receta de alert que resolvió los 6 alerts del módulo sin un solo reintento** | universal (ya graduada, **se reconfirma**) | Tomar el alert visible (`:not(.overlay-hidden)` + `offsetParent!==null`, quedarse con el **último**), leer `.alert-title`/`.alert-message`, listar `button.alert-button` con `width>0` y recorrer `['aceptar','ok','eliminar']` por **igualdad exacta** case-insensitive → coords → `pg.mouse.click(x,y,{delay:140})`. Reparto real de grupo_fiel: **guardado `[OK]` · envío paso 1 `[Cancelar, Aceptar]` → pasos 2-3 `[OK]` · borrado `[OK]` directo sin confirmación previa** (idéntico a el_palmar y difranca) |
| **Llenado por teclado real, sin `fillIonInput`** | universal (ya graduada, se reconfirma) | `pg.focus('ion-input[formcontrolname="X"] input')` + `pg.keyboard.type(val,{delay:22})` validó los 8 controles **a la primera** |
| **`page.__qa` persistió las 12 llamadas** | universal | El fallback de `[difranca-20260807]` no hizo falta esta vez, pero se mantuvo la guarda. Sin reinstalar `__qaH`: se registró **`window.__qaC`** propio + hook de payload con guarda `__qaDataHook` ⇒ POST capturado **1 sola vez y con `data`** (el `__qaH` heredado del agente LOGIN traía 5 skills y **ninguna** captura) |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos (FAIL)

**Ninguno.** 0 FAIL en los 12 casos.

**Defectos conocidos NO reproducidos en grupo_fiel:**
- `CLT-LISTA-SALDOS-CRUZADOS` (`[gmp-20260730]`): lista y detalle coinciden 1:1; la tasa implícita
  (~771) es consistente en los 3 clientes muestreados y Σ documentos = saldo exacto.
- `CLT-CREDITO-MULTIPLICADO`: el Crédito USD de la UI = `nu_credit_limit` / tasa, exacto (el número es
  absurdo porque el **dato** lo es, no el cálculo).
- Defecto de render de la lista de potenciales (`[gmp-20260730]`): la lista **sí refresca** tras
  guardar, enviar y borrar, sin salir y re-entrar.

⇒ Ambos defectos de saldo/crédito siguen **acotados a la familia globalmp / v6.6.18**
(3.ª playa consecutiva que no los reproduce, tras el_palmar y difranca).

---

## Oráculo de coherencia interna (recomendado, aplicado acá)

Barato y caza el cruce de etiquetas de una sola llamada:

```js
const c = ng.getComponent(document.querySelector('app-client-detail'));
c.allDocuments.reduce((a,x)=>a+Number(x.nuBalance||0), 0) === c.saldoLocal   // Σ docs = Saldo BS
c.saldoLocal / c.saldoFuerte === tasa                                        // BS = USD × tasa
```

Medido en MP GELATO: Σ 4 docs = **361.024,51** = `saldoLocal` **exacto**;
`saldoLocal / saldoFuerte` = 361.024,51 / 468,21237 = **771,07** = la tasa del tab Doc. de Venta. ✅

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| 1786973829965.0 | **BD-FIELD-OK** | 17/17 OK | 0/0 (sin hijas) | 0 | 1 (zona horaria, no bloqueante) |

**Detalle:** payload `potentialClient` (endpoint `potentialclientservice/potentialclient`) cotejado campo a campo
contra `potential_client` (llave de negocio `co_client`). Los 17 campos de cabecera
(`co_client, na_client, nu_rif, na_responsible, em_client, nu_phone, co_user, id_user, tx_address,
tx_address_dispatch, tx_client, da_client, co_enterprise, id_enterprise, coordenada, nu_attachments,
has_attachments`) coinciden exactamente payload↔nube. Sin arrays/hijas (`potential_client` es tabla plana).

**Nota (no mismatch):** `da_client` — payload `2026-08-17 09:39:10` (hora local UTC-4) vs nube
`2026-08-17T13:39:10.000Z` (UTC): mismo instante, solo difiere la representación de zona horaria.
Consistente con la regla de COTEJO-BD.md §"Fechas: veredicto por día".

No se detectaron campos del payload sin columna en nube ni renames pendientes de calibrar — el config
`potentialClient` de `cotejo-payload.js` sigue vigente sin cambios.
