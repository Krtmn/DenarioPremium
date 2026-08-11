# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i / X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | ISLA COCHE (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar · empresa **CENTRAL EL PALMAR, S.A.** (id 1 / co 1002) |
| `modules.depositos.aplica` | **true — CONFIRMADO en UI** (11 cuentas bancarias VES + 1 cobro depositable con dato vivo) |
| Resultado | **11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

---

## 🔴 Veredicto central — ¿el depósito salió del dispositivo y llegó a la nube?

**SÍ. Salió, llegó y persistió. El defecto de la corrida anterior NO reproduce en este build.**

El caso de contraste era: en el cliente anterior (misma app v1.0 / db19) el depósito se Guardó y se Envió pero
**nunca salió del teléfono** — 0 POST a `depositservice/deposit`, atascado en `pending_transactions` con
`st_delivery=2` / `id_deposit=0`, y 24 h después la nube seguía sin la fila. Acá, punto por punto:

| Evidencia pedida | Resultado en el_palmar |
|---|---|
| POST a `depositservice/deposit` | ✅ **1 POST capturado**, con body completo |
| `pending_transactions` tras Enviar | ✅ **0 filas** (vacía) |
| `failed_transactions` | ✅ **0 filas** |
| `st_delivery` local | ✅ **1** (enviado) — no 2 |
| `id_deposit` local | ✅ **3** (asignado por el servidor) — no 0 |
| Fila en la nube | ✅ `deposit.id_deposit=3` presente, **sync inmediata** (<10 s) |
| `transaction_statuses` | ✅ `co_transaction_type='dep'` · `id_transaction=3` · **`co_status='env'`** |
| Poll de cierre del módulo | ✅ sigue presente y consistente |

**POST por servicio capturados en la sesión completa (218 entradas del hook):**
`syncservice` 212 · `authservice` 2 · `potentialclientservice` 1 · `returnservice` 1 · `clientstockservice` 1 ·
**`depositservice` 1**.

⇒ **El defecto de no-persistencia del depósito es ESPECÍFICO DEL CLIENTE ANTERIOR, no del build v1.0/db19.**
Misma versión de app, mismo `db_version`, y acá el depósito viajó de inmediato. Esto **descarta** que sea la 2ª
ocurrencia de un defecto de producto y acota la investigación al entorno/datos de aquella playa.

**Corolario sobre la inmovilización del cobro:** allá el cobro vinculado desapareció del pool *sin haberse
depositado*. Acá el cobro 27083 también desapareció del pool tras el depósito — pero **correctamente**, porque
sí fue depositado (`deposit_collects` lo vincula y la nube tiene la fila). Verificado explícitamente: tras el
envío, un formulario nuevo con banco válido muestra 0 depositables.

### ¿El hook capturó el payload de `deposit`?

**SÍ, con body completo.** Se despeja el dato conocido del proyecto ("en algún build el hook NO capturaba
`deposit`"): en este build **sí lo captura**. `__qaH.getPayloadData()` devolvió la entrada con `data` íntegro,
1 sola vez (sin duplicados). No se reinstaló el hook.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Tile Depósitos → `/depositos` con botones DEPÓSITO (180,107) y BUSCAR (180,176) |
| DM-DEP-002 | ✅ PASS | Form abre con Empresa/Moneda/Banco/Fecha Doc/Nro. Plantilla/Comentario; tabs Cobros/Total/Adjuntos `disabled`; **Guardar y Enviar `disabled`** sin datos |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` → Provincial Cepsa BP645 (idBankAccount 276); cuenta `0108…2645` autollenada `readonly=true`; las 3 tabs habilitan |
| DM-DEP-005 | ✅ PASS (2 int.) | `fechasModal` abre desde `.letrasFechasButton` idx 1; `dt.value='2026-08-05'` + `ionChange` + Aceptar; Fecha Doc = 5/8/2026 |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `DEP-QA-0805`; Tab Cobros marca el cobro → "Monto total depositado 6820.4436 VES"; **Guardar y Enviar habilitan** |
| DM-DEP-009 | ✅ PASS · BD-SAVED | Alert **"El Depósito se ha guardado" [Aceptar]**; local `id_deposit=0`, `st_delivery=3`, 0 en cola |
| DM-DEP-010 | ✅ PASS | BUSCAR renderiza limpio: 1 ítem "Nro Ref: 0 · BP645 · Guardado · 6820.4436 VES", 0 spinners visibles |
| DM-DEP-014 | ✅ PASS (2 int.) | Reabrir Guardado: todos los valores intactos (§9), editable, 4 tabs, trash presente en lista |
| DM-DEP-017 | ✅ PASS · **BD-OK** | 3 alertas → **"Depósito nro. 3 enviado exitosamente"**; POST `depositservice/deposit`; nube `id_deposit=3` |
| DM-DEP-018 | ✅ PASS | 2º BUSCAR tras enviar: lista limpia, "Nro Ref: 3 · Enviado", 0 papeleras. **Defecto conocido NO reprodujo** |
| DM-DEP-019 | ✅ PASS (2 int.) | Enviado = solo lectura estricta: 3 inputs + 3 selects `disabled=true`, 2 fechas disabled, **0 Guardar / 0 Enviar / 0 trash**, y el segmento **Cobros desaparece** |
| DM-DEP-020 | 🚫 N/A (dato) | No hay depósito Guardado que borrar ni forma de crear otro: **pool de depositables agotado y probado** (ver abajo) |

### DM-DEP-018/019/020 — ¿reprodujo el defecto conocido de `deposit.service.ts`?

**NO REPRODUJO.** Los **2** accesos a `app-deposito-list` (uno tras Guardar, otro tras Enviar) renderizaron
la lista completa, con 0 `ion-spinner` visibles y 0 `ion-loading` colgado. Sigue siendo intermitente; en este
build/cliente no se manifestó. **No corresponde marcar FAIL** (RUNTIME §5).

### DM-DEP-020 — por qué es N/A y no FAIL (probado, no supuesto)

RUNTIME §4 exige *probar* el "sin datos". El módulo tenía exactamente **1** cobro depositable, y el smoke solo
podía gastarlo una vez: o se borraba un Guardado (DM-DEP-020) o se enviaba (DM-DEP-017). Se priorizó el envío
por ser el caso crítico de la corrida. Prueba del agotamiento tras el envío:

1. BD local: `collection_payments` tiene **1 sola** fila con `co_payment_method='ef'` (cobro 27083).
2. Tras el depósito, `deposit_collects` contiene ese `id_collection=27083`.
3. Un formulario **nuevo** con banco válido (BP645, VES) abre el Tab Cobros con **0 `ion-checkbox`**,
   pie "Monto total depositado 0 VES" y render limpio (sin loader colgado).
4. Con 0 cobros, `ion-button.imagenGuardar` queda `disabled` ⇒ **no se puede crear un 2º Guardado**.

⚠ **Lección de secuenciación** (misma que latino_cosmetica): con un pool de 1, DM-DEP-017 y DM-DEP-020 son
mutuamente excluyentes. Para cubrir ambos hace falta ≥2 cobros en efectivo enviados y no depositados.

---

## Registros creados en sistema

| Ref (UI) | epoch `co_deposit` | Detalle | Empresa efectiva | Estado |
|---|---|---|---|---|
| **3** | `1785960278346.0` | Banco **BP645** Provincial Cepsa (idBankAccount 276) · cuenta `01080051090100002645` · Nro. Plantilla **DEP-QA-0805** · Fecha Doc 2026-08-05 · **VES 6.820,4436** (conv. USD 10,4452 · tasa 652,9726) · cobro vinculado **id_collection 27083** · comentario vacío | **CENTRAL EL PALMAR, S.A.** — `id_enterprise=1` / `co_enterprise=1002` ✅ | **Enviado** (`st_deposit=1`, `st_delivery=1`, `co_status='env'`) |

**Correlación Ref↔fila confirmada:** Nro.Ref de la UI (**3**) = `deposit.id_deposit` (**3**) en la nube.

---

## Verificación BD

**Baseline al inicio** — nube: `deposit` = 2 filas, `max(id_deposit)` = 2 (ambas de oct-2025, empresa 1002).
Local: `deposits` = 0 filas, `deposit_collects` = 0, `pending_transactions` = 0, `failed_transactions` = 0.

**Pool de depositables (medido antes de ejecutar, no supuesto):** la BD local tenía **5 cobros, todos
`st_delivery=1`**, con métodos de pago `tr`×3, `ef`×1, `de`×1 ⇒ **exactamente 1 depositable**: cobro
`id_collection=27083` (C.A. RON SANTA TERESA), **VES 6.820,4436** en efectivo, no presente en
`deposit_collects`. **La UI ofreció exactamente ese cobro** — coincidencia perfecta BD↔UI.

> ⚠ Matiz sobre los "18 cobros enviados" del prompt: en la **nube** hay 3 pagos en efectivo entre los cobros
> 27060-27090 (27083 · 27088 · 27089), pero el **device solo bajó el de 27083** (la BD local tiene 5 cobros, no
> 18). El pool de la app es correcto respecto de lo que tiene sincronizado; **no es un pool vacío ni un
> hallazgo de defecto**, pero conviene saber que el device ve un subconjunto.

**Diff de baseline (nube), tras el envío:**

| Métrica | Baseline | Cierre | Δ |
|---|---|---|---|
| `deposit` count | 2 | **3** | +1 (exactamente la esperada, sin duplicados) |
| `max(id_deposit)` | 2 | **3** | +1 |

**Cotejo campo-a-campo local ↔ payload ↔ nube (todos coinciden):**

| Campo | UI / Local | Payload | Nube |
|---|---|---|---|
| `nu_amount_doc` | 6820.4436 | `nuAmountDoc` 6820.4436 | 6820.4436 ✅ |
| `nu_amount_doc_conversion` | 10.4452 | `nuAmountDocConversion` 10.4452 | 10.4452 ✅ |
| `nu_value_local` (tasa) | 652.9726 | `nuValueLocal` 652.9726 | 652.9726 ✅ |
| `co_currency` | VES | `coCurrency` VES | VES ✅ |
| `co_enterprise` / `id_enterprise` | 1002 / 1 | `coEnterprise` "1002" / `idEnterprise` 1 | 1002 / 1 ✅ |
| `nu_document` | DEP-QA-0805 | `nuDocument` DEP-QA-0805 | DEP-QA-0805 ✅ |
| `da_document` | 2026-08-05 | `daDocument` 2026-08-05 | 2026-08-05 ✅ |
| `co_bank` / `nu_account` | BP645 / 0108…2645 | idem | idem ✅ |
| `tx_comment` | "" | `txComment` "" | "" ✅ |
| cobro vinculado | `deposit_collects.id_collection=27083` | `collectionIds:[27083]` | — (ver nota) |

**Dirección de la conversión — verificada con aritmética explícita:**
`6.820,4436 ÷ 652,9726 = 10,4452` = exactamente el `nuAmountDocConversion` enviado.
⇒ **VES→USD divide. Dirección CORRECTA.** El defecto de dirección conocido en cobros (descuentos manuales y
dev/faltantes) **NO se reproduce en depósitos**.

**Nota `deposit_collection_payment` (N:M de la nube) = 0 filas** para `id_deposit=3`. Es el comportamiento ya
documentado (`[ins-2622]`, `[latino_cosmetica-20260714]`): el vínculo cobro→depósito viaja por
`collectionIds` en el payload y `depositCollect:[]` va vacío; esa tabla nunca se puebla. Se cotejó por payload
+ `deposit_collects` local. ⇒ **BD-INFO, no BD-MISMATCH.**

**Marcas finales:** DM-DEP-009 → **BD-SAVED** (correcto: guardado, aún sin enviar) · DM-DEP-017 → **BD-OK**.

---

## Verificación de VGs

| VG | Esperado | Observado | Veredicto |
|---|---|---|---|
| `signatureDeposit` | Se puede firmar; **no obliga** (RUNTIME §5) | El depósito se **Envió sin firma** sin ningún bloqueo | ✅ Coherente — **NO es defecto** |
| `requiredComment` (alcance COBROS, `tipo=C`) | No debe aplicar a depósitos | Guardar **y** Enviar habilitaron con **Comentario vacío**; la nube guardó `tx_comment=''` | ✅ Confirmado: **no aplica a depósitos** (3ª corrida consecutiva que lo comprueba) |
| `multiCurrency=true` | 2 monedas | `ion-select` Moneda con **2 opciones** (VES / USD); VES preseleccionada como local | ✅ |
| `userMustActivateGPS=false` | Sin exigencia de GPS | Ningún alert de geolocalización en todo el módulo; **aun así el payload viajó con `coordenada:"11.0490614,-63.8649968"`** | ✅ (la VG no exige activarlo, pero la app igual adjunta coords si las tiene) |
| `enabledManualRate=false` | Tasa no editable a mano | En DEPÓSITOS **no hay campo de tasa en el formulario**: la tasa (652,9726) se aplica sola y solo se ve en el payload/BD | ✅ N/A por ausencia de campo — contrasta con PEDIDOS, donde el campo existe con `readonly=true` |
| Adjunto obligatorio | — | **No exigido**: el envío completó sin pasar por la tab Adjuntos | ✅ No hizo falta dejarlo en Guardado |
| Sin cobros ⇒ no Guardar | VG, no defecto | Con Banco + Fecha + Nro. Plantilla y **0 cobros**, `imagenGuardar` queda `disabled` | ✅ Confirmado |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| 🔴 **Aceptar/Cancelar del `ion-datetime` son `ion-button#confirm-button` / `#cancel-button` en el shadowRoot — NO `button` nativos** | universal | `dt.shadowRoot.querySelectorAll('button')` devuelve **solo el header de mes y los ~102 `.calendar-day`**: ningún Aceptar. Se concluye "el datetime no tiene botón de confirmar" y se pierde un intento. Los reales son **`ion-button` con `id`**: `sr.querySelector('#confirm-button')` (texto "Aceptar", rect ≈ y 544) y `#cancel-button`. Receta que cerró limpio: `dt.value='YYYY-MM-DD'` + `ionChange` → coords de `#confirm-button` → `pg.mouse.click`. `dt.showDefaultButtons=true` es la señal de que existen. |
| 🔴 **El rect de `.letrasFechasButton` SE DESPLAZA al elegir banco — releerlo siempre** | universal | Al seleccionar el banco aparece el `ion-input` "Banco:" (cuenta autollenada) y **Fecha Doc baja de y=477 a y=348**. Clickear con las coords leídas *antes* del banco cae al vacío **sin error** y se lee como "el modal de fecha no abre". Hermano del quirk de coords fuera de viewport: **releer el rect después de todo cambio que agregue/quite un campo.** |
| 🔴 **`pg.mouse.click` sin `delay` puede NO registrar en los botones de header (`imagenEnviar`)** | universal | El 1.er click en `ion-button.imagenEnviar` **no disparó nada**: `elementFromPoint` daba el botón correcto, `disabled=false`, y el oráculo `app-message` seguía con el mensaje viejo de otro módulo ⇒ el evento nunca llegó. Con **`pg.mouse.click(x, y, {delay:120})`** disparó a la primera. Usar `delay:120-150` en Guardar/Enviar y en ítems de lista. |
| 🔴 **El `ion-item` de `app-deposito-list` solo responde en su ZONA SUPERIOR** | cliente (a confirmar) | El ítem mide 350×131 (y 146-277). Click en el **tercio superior** (≈ y+16, sobre la línea "Nro Ref:") abre el detalle; clicks en la mitad inferior (y=240, sobre "Monto VES") **no navegan, sin error**. Combinar con `delay` y con evitar la papelera (x≈286-315, y≈199-224). |
| **Oráculo `app-message` para distinguir "no hubo click" de "la app no avisó"** | universal | `ng.getComponent(document.querySelector('app-message'))` conservaba `mensaje:"¡EL Inventario se borro con exito!"` (del módulo anterior) con `alertMessageOpen=false`. Eso prueba que **el click no llegó**, no que la app fallara — evitó un falso FAIL en DM-DEP-017. Leerlo antes de reintentar. |
| **`ion-loading` transitorio del BUSCAR intercepta clicks y luego se auto-resuelve** | universal | Tras BUSCAR, `elementFromPoint` devolvió `ION-BACKDROP.sc-ion-loading-md` en **los 3 puntos probados** del ítem, aunque `ion-loading:not(.overlay-hidden)` contaba **0**. Segundos después el loading desapareció solo y los 13 `ion-backdrop` restantes eran todos 0×0 dentro de `ion-alert` (legítimos). **Diagnosticar con `elementFromPoint` y reintentar tras esperar** en vez de remover backdrops. |
| **Etiquetas de alert de DEPÓSITOS en este build (leídas, no predichas)** | cliente | Guardado: **"El Depósito se ha guardado" [Aceptar]** · Envío 3 pasos: (1) "Denario Depósito — El Depósito será enviado" **[Cancelar, Aceptar]** → (2) "Denario Premium — El Depósito será enviado" **[OK]** → (3) "Denario Premium — **Depósito nro. 3 enviado exitosamente**" **[OK]**. ⇒ mezcla Aceptar/OK **dentro del mismo flujo**: recorrer `['Aceptar','OK']` por igualdad exacta. |
| **Selector de empresa en DEPÓSITOS: preseleccionado, sin `formcontrolname`, objeto completo como `value`** | cliente | Igual que DEVOLUCIONES e INVENTARIOS, **no** como CLIENTES. Llega con `{idEnterprise:1, coEnterprise:"1002", lbEnterprise:"CENTRAL EL PALMAR, S.A.", prioritySelection:0, enterpriseDefault:"false"}` ⇒ **la receta `s.value=1` (number) NO aplica ni hace falta**. Nota: la app eligió por **`prioritySelection:0`**, no por `enterpriseDefault` — por eso NO tomó YARACUY. |
| ✅ **El `enterprise_default` local apuntando a otra empresa NO se materializó — 2ª confirmación** | cliente | En CLIENTES ya se había visto; acá se reconfirma en un módulo con select **preseleccionado**: la empresa efectiva fue 1002 al crear, al **reabrir** el Guardado, en el **payload** y en la **fila de nube**. La "trampa" de YARACUY sigue siendo **riesgo teórico**. Contrasta con el quirk de jerez (picker Empresa que revertía al default al reabrir): **acá NO revierte.** |
| **Las cuentas bancarias se filtran por MONEDA y por EMPRESA** | cliente | Con VES/empresa 1002 → **11** cuentas, todas `coCurrency:"VES"` + `coEnterprise:"1002"` (de 57 `bank_accounts` locales). Confirma el filtro por moneda de latino_cosmetica y agrega el filtro por empresa. |
| **Dirty-guard de DEPÓSITOS SÍ dispara vía CDP** | cliente | `img.fechaAtras` con form sucio → **"Denario Depósito"** con **[Guardar y salir · Salir sin guardar · Cancelar]** y `.alert-message` **vacío** (el texto útil está en `.alert-title`). Confirma `[gmp-2611]`/`[latino_cosmetica-20260729]`, contrasta jerez/dm-electronica. ⚠ Igualdad exacta obligatoria: `/salir/i` matchea "Guardar y salir". |
| **Referencia del cobro: la tab Cobros muestra `id_collection`, la tab Total muestra `co_collection`** | cliente | Tab Cobros: "Referencia **27083**". Tab Total, misma fila: "Referencia **1785950387050.0**". Inconsistencia **cosmética** (no altera el dato enviado: el payload viaja `collectionIds:[27083]`). Observación, no defecto. |
| **Monto depositable = solo la porción EFECTIVO del cobro** | universal | El cobro 27083 totaliza 16.820,4436 (10.000 `de` + 6.820,4436 `ef`); la UI ofrece "Monto Cobro 16820.4436 / **Monto Depósito 6820.4436**" y deposita solo el efectivo. Comportamiento **correcto** y buen oráculo de que el filtro `co_payment_method='ef'` opera bien. |
| **`maxlength` del Comentario de depósitos = 255** | cliente | El form rotula "Mín. 0 - Máx. 255 caracteres 0/255", frente a los **120** medidos en el Comentario de inventarios de la APK El Yaque v1.0. El límite lo fija la constante de producto por campo, no una VG. |
| **BD local: `deposits` arranca VACÍA aunque la nube tenga histórico** | universal | La nube tenía 2 depósitos (oct-2025) y `deposits` local tenía **0 filas**. Los depósitos históricos **no se sincronizan al device**. No confundir "lista vacía" con defecto de render. |

---


> ✅ consolidado 2026-08-05
## Hallazgos

**Ninguno.** 0 FAIL. El módulo operó end-to-end (crear → guardar → reabrir → enviar → releer) con round-trip
§9 intacto, cotejo BD §10 **BD-OK** y el defecto conocido de `deposit.service.ts` sin reproducir.

Las 2 observaciones menores registradas arriba (Referencia `id_collection` vs `co_collection` entre tabs;
banco **BP342** del perfil no ofrecido en VES/1002 — las Provincial disponibles son BP645 y BP634) son
**cosméticas / de dato**, no defectos.

---

*Agente DEPÓSITOS · 0 cuelgues de CDP · 0 reinstalaciones del bundle · hook de payload heredado y usado tal cual.*
