# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i · X6728 · 360×744) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · `window.ng=true` · `sqlitePlugin` OK |
| Playa | EL YAQUE (`denarioelyaque.ddns.net:8081`) |
| Cliente / Empresa | difranca · **DDHP_A12 `*DISTRIBUIDORA DIAZ` (idEnterprise 2)** |
| Vendedor | `VEND206` · `co_user=206` · `id_user=275` |
| Tasa | 752,0900 BSD/US$ |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Contexto | GO/NO-GO al tag 20 — no cacería de defectos |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` + `app-client-container`; 3 botones CLIENTES (180,107) / CLIENTE POTENCIAL (180,176) / BUSCAR CLIENTE POTENCIAL (180,245) |
| DM-CLT-002 | ✅ PASS | `app-client-list` con 50 ítems, cada uno con **Saldo BSD y Saldo US$** (multiCurrency real). Oráculo: BSD = US$ × 752,09 exacto en los 3 primeros (CAR064 4.044,66 → 3.041.948,34) |
| DM-CLT-003 | ✅ PASS | "JAKE" + botón `search-circle-sharp` (317,94) → filtra 50→**1** (MULTIDISTRIBUIDORA JAKE, C.A / CAR755). Búsqueda por nombre, no por código |
| DM-CLT-009 | ✅ PASS | `app-client-detail`: Empresa `*DISTRIBUIDORA DIAZ`, Nombre+Código, Saldo BSD 47.023.577,39 / US$ 62.523,87, Crédito y Crédito Disp. en ambas monedas, RIF, Condición de Pago, Dirección |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` renderiza `.documents-table-panel--ready` con **149 documentos** (paginada 1-30 de 149, 5 páginas), 18 columnas. Leyendas *Documento vigente · Documento vencido · A favor* presentes |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (no salta al home principal) |
| DM-CLT-019 | ✅ PASS | `app-client-new-potential-client`: **9 `ion-input` vacíos** (8 `ng-invalid` + `naWebSite` `ng-valid`/opcional) y `imagenGuardar`/`imagenEnviar` ambos **`disabled=true`** |
| DM-CLT-021 | ✅ PASS | 8 campos + empresa → ambos botones `disabled=false`. **Medición del par antes/después** en la sección de VGs |
| DM-CLT-024 | ✅ PASS | Alert `Denario Cliente` / "¡Cliente Potencial Guardado con exito!" `[OK]`; el registro aparece en BUSCAR CLIENTE POTENCIAL con **Nro. Ref: 0 · Estatus: Guardado** y trash visible |
| DM-CLT-026 | ✅ PASS | 3 alertas → **"Cliente potencial nro. 60 creado exitosamente"**; el ítem pasa a **Estatus: Enviado**, Nro. Ref 60, trash desaparece. `BD-OK` |
| DM-CLT-031 | ✅ PASS | Trash (318,227) → borrado **directo sin confirmación previa**, alert `Denario Clientes` / "¡Cliente Potencial se borro con exito!" `[OK]`; desaparece de la lista **y** de `potential_clients` local |

## Registros creados en sistema

| Ref | epoch (`co_client`) | Detalle | Empresa efectiva | Estado |
|-----|--------------------|---------|------------------|--------|
| **60** | `1786120036250.0` | `Test-CLT-SMOKE-122750` · RIF J987654321 · qa.difranca@test.com · 04121234567 | **DDHP_A12 / idEnterprise 2 / `*DISTRIBUIDORA DIAZ`** | **Enviado** — BD-OK (nube + local) |
| 0 (sin Ref) | — | `Test-CLT-DEL-123045` · RIF J987654322 | DDHP_A12 / idEnterprise 2 | Guardado → **BORRADO** en DM-CLT-031 (no llegó a la nube) |

> Se crearon exactamente los 2 registros que pide el smoke (uno enviado + uno para borrar). El envío disparó
> **1 correo real** (`notificationsPotentialClient=true`), autorizado explícitamente por QA.

## Verificación BD

**Baseline (nube, inicio de módulo):** `potential_client` → `count=59`, `max(id_client)=59`.

**Diff de baseline:** exactamente **1 fila nueva** (`id_client=60`). Sin duplicados, sin filas inesperadas.

| Comprobación | Resultado |
|---|---|
| Nube `potential_client` id 60 | `co_client='1786120036250.0'` · `na_client='Test-CLT-SMOKE-122750'` · `nu_rif='J987654321'` · `co_enterprise='DDHP_A12'` · **`id_enterprise=2`** ✅ · `co_user='206'` · `st_potential_client=1` |
| Campo a campo (los 8 llenados) | `tx_address`, `tx_client`, `na_responsible`, `em_client`, `nu_phone`, `na_client`, `nu_rif` — **todos cuadran 1:1** con lo tipeado |
| Local `potential_clients` | `id_client=60` (>0 ⇒ enviado) · `st_potential_client=**2**` |
| `pending_transactions` (`type='potentialClient'`) | **0** ⇒ salió de la cola |
| `failed_transactions` | **0** ⇒ no hubo rechazo |
| Correlación **Nro. Ref UI = `id_client`** | ✅ reconfirmada (UI "nro. 60" = `id_client=60`) |
| Payload `potentialclientservice/potentialclient` | capturado **1 sola vez y con `data` completo** (85→86 entradas) vía `__qaH.getPayloadData()` heredado |
| Registro borrado (DM-CLT-031) | ausente de `potential_clients` local y **nunca llegó a la nube** (correcto: era Guardado, `id_client=0`) |

**Conclusión guardado→enviado: `BD-OK`.** Lo que se guardó se envió, llegó íntegro y con la empresa correcta.

⚠ **Dominio doble de `st_potential_client` — reconfirmado:** nube `=1`, local `=2` para el MISMO registro
Enviado. Coincide con el_palmar (`=1` servidor) y con latino_cosmetica/globalmp (`=2` local). Son dominios
distintos, no un mismatch.

⚠ **`client.nu_balance` de la nube NO es el saldo que muestra la app.** Para CAR755/DDHP_A12 la nube trae
`nu_balance=7.410.782,79` y la app muestra `62.523,87`. La app **no lee ese campo**: suma sus propios
documentos sincronizados. No es defecto — ver el oráculo de coherencia más abajo.

## Verificación de VGs

| VG | Valor del perfil | Lo que pasó de verdad | Veredicto |
|---|---|---|---|
| `enterpriseEnabled` | true | Selector presente **solo dentro del formulario** (0 `ion-select` en HOME). En CLIENTES llega `disabled=false`, `value=null`, `ng-invalid`, shadowRoot "Seleccione..." | ✅ confirmada |
| `multiCurrency` | true | Lista **y** detalle muestran Saldo BSD + Saldo US$ | ✅ confirmada |
| `showCreditLimit` | true | Detalle muestra Crédito BSD / Crédito Disp. BSD / Crédito US$ / Crédito Disp. US$ | ✅ confirmada |
| `clientsOrderBy` | `co_client` | La lista viene ordenada por código (CAR064, CAR082, CAR090, CAR095…) ✅. ⚠ Pero el **searchbar filtra por nombre**: "JAKE" devolvió 1, el código no es el criterio de filtrado | ✅ confirmada (matiz) |
| `userCanUploadFiles` / `showCamera` | true / true | **0 controles de cámara/adjunto** en `app-client-new-potential-client`; payload con `nuAttachments:0`, `hasAttachments:false` | 🚫 **N/A en CLIENTES** (igual que el_palmar) |
| `signatureClient` | true | **0 canvas / control de firma**; el registro Guardó y Envió sin firma | 🚫 N/A en CLIENTES — la VG *habilita*, no obliga |
| `requiredComment` | true (`tipo_variable='C'`) | No existe campo comentario en el form; nada lo exigió | 🚫 N/A — alcance COBROS, confirmado |
| `userCanSaveGPS` | **false** | 🔴 El payload **SÍ viaja con `coordenada:"11.0490573,-63.8649905"`** (`coordenadaClient:null`), sin alert ni exigencia de GPS | ⚠ **el alcance de la VG NO cubre CLIENTES** — ver nota abajo |
| `userMustActivateGPS` | false | No exigió activar GPS en ningún momento | ✅ confirmada |
| `notificationsPotentialClient` | true | Envío completado ⇒ correo real disparado (autorizado) | ✅ confirmada |

### 🔴 Selector de empresa — cómo se comportó (medición cuantitativa)

Es el punto que más falsos FAIL genera, así que se midió el **par antes/después**:

| Momento | `idEnterprise` | `imagenGuardar` | `imagenEnviar` |
|---|---|---|---|
| Form recién abierto, 0 campos | `null`, `ng-invalid` | `disabled=true` | `disabled=true` |
| **Los 8 `ion-input` obligatorios YA llenos**, empresa sin elegir | `null`, `ng-invalid` | **`disabled=true`** | **`disabled=true`** |
| Tras `s.value = 2` (**number**) + `ionChange` | `2` (number), `ng-valid`, shadowRoot `*DISTRIBUIDORA DIAZ` | **`disabled=false`** | **`disabled=false`** |

⇒ El select **entra en la validación**: "el botón no habilita" con la empresa vacía **no es FAIL ni BLOCKED,
es el campo faltante**. Receta validada: `s.value = 2` (number, no string) + `ionChange`; **no hace falta
abrir el popover**. Round-trip §9: al reabrir el Guardado la empresa vuelve como `2` (number) con su label
intacto, y viaja a la nube como `co_enterprise='DDHP_A12'` / `id_enterprise=2`.

**Opciones ofrecidas — exactamente 3, todas con `value` numérico:**

| value | Etiqueta en UI | Empresa |
|---|---|---|
| `2` | `*DISTRIBUIDORA DIAZ` | DDHP_A12 (la de la corrida) |
| `3` | `DIFRANCA C.A` | DIF_A12 |
| `4` | `DISTRIBUIDORA DH VI` | DHVITAL01_A |

✅ **La 4ª empresa borrada en BD (`DDH_A12`, `co_operation='D'`) NO aparece en el selector** — el perfil decía
"si aparece ⇒ defecto". No aparece. Los nombres se ven truncados a 19 caracteres porque la UI rotula
`lb_enterprise`, no `na_enterprise` (viene así del servidor, no es defecto).

## Defectos conocidos del tag 20 — ¿le afectan a difranca?

| Defecto | ¿Reproduce en difranca? | Evidencia |
|---|---|---|
| **CLT-LISTA-SALDOS-CRUZADOS** (la lista cruza las etiquetas de saldo y divide de más) | ❌ **NO reproduce** | Lista y detalle muestran **los mismos** valores (BSD 47.023.577,39 / US$ 62.523,87). Σ de los 149 documentos = **62.523,87** = exactamente el Saldo US$; `saldoLocal` = 47.023.577,3883 = 62.523,87 × 752,09. Etiquetas correctas, sin doble división. Verificado también en 3 clientes de la lista (CAR064/CAR082/CAR090), todos ×752,09 exacto |
| **CLT-CREDITO-MULTIPLICADO** (líneas de crédito multiplicadas por la tasa) | ❌ **NO reproduce** | UI Crédito US$ = **3.008.377,20** = `client.nu_credit_limit` de BD **exacto**, sin multiplicación extra. El Crédito BSD (2.262.570.408,35) es esa cifra × 752,09, la conversión correcta. Escenario exacto del defecto (showCreditLimit=true + tasa ≈750 + el cliente de mayor deuda) y aun así no aparece |
| **CLT-FILTRO-ADJUNTO-FALSOS-POSITIVOS** (filtro web "Tiene Adjunto=SI") | 🚫 **Sin material desde la app** | El form de cliente potencial **no ofrece adjuntos** (0 controles, payload `nuAttachments:0` / `hasAttachments:false`) ⇒ la app nunca genera un potencial con adjunto. El defecto es de la capa web y difranca no puede alimentarlo desde el móvil |
| **WEB-LIMPIAR-CAMBIA-EMPRESA** (parte app: empresas ajenas/borradas) | ❌ **No reproduce del lado app** | El selector ofrece solo las 3 empresas activas; la borrada no baja al device. La empresa elegida no se pisó en ningún punto (crear → guardar → reabrir → enviar → nube) |

**Ningún defecto conocido de la 20 se manifestó en el módulo CLIENTES para este cliente, y no apareció ningún
hallazgo nuevo.** Desde CLIENTES, el veredicto es **GO**.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| `userCanSaveGPS=false` **no impide** que el cliente potencial envíe coordenada | universal | El payload de `potentialclient` viaja con `coordenada:"lat,lng"` pese a la VG en false. El alcance de la VG es VISITAS. **No reportarlo como incumplimiento** ni como defecto; y al cotejar visitas, no extrapolar desde clientes. `[difranca-20260807]` |
| `client.nu_balance` (nube) ≠ saldo que muestra la app | universal | CAR755: nube `7.410.782,79`, app `62.523,87`. La app **suma sus propios documentos sincronizados**, no lee ese campo. Cotejar contra Σ documentos, nunca contra `client.nu_balance` |
| Oráculo barato de coherencia de saldos vía componente Angular | universal | `ng.getComponent(document.querySelector('app-client-detail'))` expone `allDocuments` (array completo, **no paginado**), `saldoFuerte` y `saldoLocal`. Σ`nuBalance` debe dar `saldoFuerte`, y `saldoLocal = saldoFuerte × tasa`. Caza el cruce de etiquetas **sin recorrer las 5 páginas** de la tabla |
| Tabla local `potential_clients`: **no existe `da_created`** | universal | La columna de fecha es **`da_potential_client`**. Un `SELECT` con `da_created` aborta la transacción `sqlitePlugin` con `no such column`. Esquema real (22 cols): `id, id_client, co_client, id_user, co_user, na_client, nu_rif, tx_address, tx_address_dispatch, tx_client, na_responsible, em_client, nu_phone, na_web_site, da_potential_client, st_potential_client, id_enterprise, co_enterprise, coordenada, coordenada_client, nu_attachments, has_attachments` |
| Llenado de los `ion-input` del form potencial por teclado real | universal | `pg.focus('ion-input[formcontrolname="X"] input')` + `pg.keyboard.type(val,{delay:25})` validó los 8 campos a la primera, sin `fillIonInput`. ⚠ El `querySelectorAll('ion-input')` global **arrastra los inputs de `app-login`** (que siguen montados): filtrar por `offsetParent!==null` o anclar al componente |
| Etiquetas de alert medidas en CLIENTES/difranca | cliente | guardado `[OK]` · envío paso 1 `[Cancelar, **Aceptar**]` → pasos 2-3 `[OK]` · borrado `[OK]` **directo sin confirmación previa**. Idéntico reparto al de el_palmar. Recorrer `['Aceptar','OK','Eliminar']` por igualdad exacta resolvió los 6 alerts del módulo **sin un solo reintento** |
| La lista de potenciales **SÍ refresca** tras guardar/enviar/borrar | cliente | No reproduce el defecto de render de `[gmp-20260730]`: los 2 registros aparecieron y desaparecieron sin salir y re-entrar |
| Coords estables (Infinix HOT 60i, 360×744) | cliente | CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245) · `imagenGuardar` (267,32) · `imagenEnviar` (326,32) · search (317,94) · back (32,47) · reabrir potencial zona izquierda (129,228) · trash (318,227) |

> ✅ consolidado 2026-08-07

## Hallazgos

**Ninguno.** 12/12 PASS, sin FAIL ni BLOCKED, sin reintentos y sin cuelgues de CDP.

---
*Agente CLIENTES · difranca · EL YAQUE · 2026-08-07 · estado final: HOME*
