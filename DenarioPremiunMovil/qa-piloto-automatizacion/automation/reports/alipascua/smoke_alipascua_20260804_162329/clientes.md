# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | `14678405BR003855` (Infinix X6728 / HOT 60i · viewport 360×744) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | EL YAQUE — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Empresa | ALIPASCUA, C.A. (`co_enterprise=ALIP_BSD` · `id_enterprise=2`) · `enterpriseEnabled=false` |
| Usuario | `coUser=002` · `idUser=468` |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues de CDP · ~7 min de wall-clock (techo 45 min) |
| Estado final | HOME ✅ |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con los 3 botones: CLIENTES (180,107) · CLIENTE POTENCIAL (180,176) · BUSCAR CLIENTE POTENCIAL (180,245) |
| DM-CLT-002 | ✅ PASS | Lista con 50 ítems, cada uno con **Saldo BSD** y **Saldo US$** (multiCurrency real). Saldos verificados contra el detalle: coinciden (ver H-0) |
| DM-CLT-003 | ✅ PASS | "RENZO" filtra 50 → **1**: RENZO FERNANDO MARTINEZ MEJIAS (V28556138). Requiere click en el botón search (no filtra on-keyup) |
| DM-CLT-009 | ✅ PASS | `app-client-detail`: Nombre + (V28556138), RIF V285561384, Saldo BSD 1.804.820,5075 / Saldo US$ 2.417,2900, Crédito, Condición de Pago, Dirección |
| DM-CLT-013 | ✅ PASS | Tab Doc. de Venta con leyenda **Vigente / Vencido / A favor** y 8 documentos (7 FACT + 1 NCR), tasa 746,6297 |
| DM-CLT-016 | ✅ PASS | `clickBack` desde el listado → `app-clientes` con los 3 botones |
| DM-CLT-017 | ✅ PASS | `clickBack` desde el detalle → `app-client-list` (50 ítems, no salta a HOME); el filtro de búsqueda se limpia al volver |
| DM-CLT-019 | ✅ PASS | Formulario con 9 `ion-input` vacíos (8 `ng-invalid` + `naWebSite` opcional `ng-valid`); Guardar (267,32) y Enviar (326,32) ambos `disabled=true` |
| DM-CLT-021 | ✅ PASS | Los 9 campos llenados → todos `ng-valid` → Guardar/Enviar `disabled=false`, **sin tocar `idEnterprise`** (llega `disabled`) |
| DM-CLT-024 | ✅ PASS | Alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!" [OK]. En BUSCAR CLIENTE POTENCIAL: **Nro. Ref: 0 · Estatus: Guardado** con trash visible |
| DM-CLT-026 | ✅ PASS | 3 alertas → "Cliente potencial **nro. 1** creado exitosamente". Estatus **Enviado**, Nro. Ref: 1, trash desaparece. `BD-OK` |
| DM-CLT-031 | ✅ PASS | Trash en el Guardado `Test-CLT-DEL-164222` → borrado **directo sin confirmación previa** → lista 2 → 1, el registro desaparece |

## Registros creados en sistema

| Ref (`id_client`) | epoch (`co_client`) | Detalle | Estado | Marca BD |
|-----|------|---------|--------|----------|
| **1** | `1785875941285.0` | `Test-CLT-SMOKE-163935` · RIF J987654321 · Tel 04141234567 · AV PRINCIPAL EL YAQUE QA · empresa ALIPASCUA, C.A. (`id_enterprise=2`) | **Enviado** | `BD-OK` |
| 0 | — | `Test-CLT-DEL-164222` · RIF J123456789 · creado solo para DM-CLT-031 | **Borrado** (nunca salió del device) | `BD-N/A` (esperado) |

## Verificación BD

**Baseline al inicio:** `potential_client` **vacía** — `count=0`, `max(id_client)=0`. Cualquier fila nueva es de esta corrida.

**Tras DM-CLT-024 (Guardar):** el registro figura en la app con `Nro. Ref: 0` y no existe en la nube → `BD-SAVED` (correcto: Guardar escribe solo la BD local del dispositivo).

**Tras DM-CLT-026 (Enviar):** fila presente en la nube dentro de la ventana de poll (~10 s). Cotejo campo-a-campo contra lo tipeado y contra el payload capturado:

| Campo | UI / payload | Nube (`potential_client`) | Veredicto |
|---|---|---|---|
| `id_client` | Nro. Ref UI = 1 | 1 | ✅ correlación Ref↔PK |
| `co_client` | `1785875941285.0` | `1785875941285.0` | ✅ |
| `na_client` | Test-CLT-SMOKE-163935 | Test-CLT-SMOKE-163935 | ✅ |
| `nu_rif` | J987654321 | J987654321 | ✅ |
| `tx_address` | AV PRINCIPAL EL YAQUE QA | idem | ✅ |
| `tx_address_dispatch` | AV PRINCIPAL EL YAQUE QA DESPACHO | idem | ✅ |
| `tx_client` | Cliente potencial de prueba QA smoke | idem | ✅ |
| `na_responsible` | RESPONSABLE QA | idem | ✅ |
| `em_client` | qa.smoke@kiberno.com | idem | ✅ |
| `nu_phone` | 04141234567 | idem | ✅ |
| `na_web_site` | www.qasmoke.test | idem | ✅ |
| `co_user` / `id_user` | 002 / 468 | 002 / 468 | ✅ |
| `id_enterprise` | 2 | 2 | ✅ |
| `coordenada` | `11.0490433,-63.8649957` | idem | ✅ |
| `st_potential_client` | (Enviado en UI) | **1** | ✅ |
| fecha | `daClient` 2026-08-04 16:41:12 (local) | `da_created` 2026-08-04T20:41:13.173Z | ⓘ nota: UTC-4 vs UTC, mismo instante — no es mismatch |

**Duplicados:** `count(*)=1` y `count(DISTINCT co_client)=1` → sin duplicados.
**Conclusión guardado→enviado:** lo que se guardó se envió íntegro. **`BD-OK`**.
**Registro borrado (DM-CLT-031):** nunca alcanzó la nube (`Test-CLT-DEL-%` no existe en `potential_client`) — comportamiento correcto: los Guardados no salen del device.

**Payload capturado:** `POST potentialclientservice/potentialclient` con `data` completo, **una sola vez** (sin apilado de wrappers). Volcado en `_payloads.jsonl`.

## GPS

`userMustActivateGPS=true` — **sin incidencias**. El envío viajó con `coordenada=11.0490433,-63.8649957` (El Yaque, Isla de Margarita) y la nube la almacenó idéntica. Ningún caso quedó BLOCKED por GPS.

## VGs verificadas en este módulo

| VG | Esperado | Observado |
|---|---|---|
| `multiCurrency: true` | saldos en 2 monedas | ✅ **Saldo BSD** y **Saldo US$** en lista Y detalle |
| `tagRif: "RIF"` | etiqueta RIF | ✅ "RIF:" en detalle y en la lista de potenciales |
| `enterpriseEnabled: false` | sin selector de empresa | ✅ `idEnterprise` llega `disabled` con la única empresa ya asignada |
| `requiredComment: true` / `longitudComentario: 200` | comentario obligatorio donde exista | 🚫 **no aplica a CLIENTES** — el formulario de cliente potencial no tiene campo comentario (0 `ion-textarea`; los 9 controles son los documentados). El tope de 200 no es probable acá |
| `userMustActivateGPS: true` | GPS activo | ✅ coordenada capturada y persistida |
| `userCanUploadFiles` / `showCamera` / `quAttach: 25` | adjuntos disponibles | ⓘ el envío viajó con `nuAttachments:0`, `hasAttachments:false`; **el adjunto NO es obligatorio** en cliente potencial — no hizo falta mock de cámara ni dejar nada en Guardado |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `idEnterprise` llega **`disabled=true` + `.select-disabled`** con la empresa auto-asignada ("ALIPASCUA, C.A.") ⇒ Guardar/Enviar habilitan con **solo los 8 `ion-input`** obligatorios; el envío igual viaja con `idEnterprise=2` / `coEnterprise="ALIP_BSD"` | build (El Yaque **v1.0 / db19**) | **Confirma y extiende `[latino_cosmetica-20260729]`** (Isla Coche v1.0/db19), que ya lo había visto. Ahora son **2 servidores distintos** con app **v1.0/db19** ⇒ la variante sigue a la **versión de build**, no a la playa. Regla operativa: **probar `sel.disabled` PRIMERO**; si es `true`, no pelear con el value numérico (esa receta es de v6.6.18) |
| Botones de `ion-alert` = **"OK"**, salvo el 1.er paso del confirm de envío que es **"Cancelar"/"Aceptar"** | build (El Yaque v1.0) | Reconfirma `[alipascua-20260804]`. Secuencia de envío: `Aceptar` → `OK` → `OK`. Estrategia robusta: recorrer `['Aceptar','OK']` por **igualdad exacta** |
| `st_potential_client` = **1** en la NUBE para un Enviado | universal (candidato) | **Dirime la contradicción abierta**: `[prc-2606]` reportó `=1` en servidor y `[latino_cosmetica-20260729]`/`[gmp-20260730]` `=2` en la tabla LOCAL. Esta corrida confirma que son **dominios distintos** (local ≠ nube), no una discrepancia entre playas |
| Correlación **Nro. Ref UI = `id_client`** | universal | Reconfirmada (Ref 1 = `id_client` 1). Suma otra corrida hacia la graduación de `BD-MISMATCH`→FAIL |
| Saldos de la LISTA **correctos** (coinciden con el detalle) | cliente / build | El defecto `[gmp-20260730]` (H-1: lista con etiquetas cruzadas y doble conversión) **NO reproduce** acá. Verificado por 2 vías: lista == detalle, y la suma de los 8 documentos del tab Doc. de Venta (71,04 − 179,00 + 505,55 + 155,33 + 1.231,20 + 64,28 + 35,38 + 533,51) = **2.417,29** = Saldo US$ exacto; y 2.417,29 × 746,6297 = 1.804.820,51 = Saldo BSD exacto |
| Hook de payload propio bajo nombre distinto (`window.__qaC`) en vez de reinstalar `__qaH` | universal (operativo) | El `__qaH` heredado del agente LOGIN traía solo 5 skills y **sin** captura de payload. Registrar las skills propias con otro nombre + un wrapper de `nativePromise` protegido por `window.__qaDataHook` evitó el apilado de wrappers descrito en `[latino_cosmetica-20260729]`: el POST se capturó **una sola vez y con `data`** |
| Tras **Guardar**, el form NO navega; tras **Enviar**, queda en el **home de clientes** | universal | Reconfirma `[dth-2612][hidroponias-20260710][ferrenuestro-20260723]` y `[ins-2610][gmp-2611]` |
| Reabrir un Guardado por la **zona izquierda** del `ion-item` (~35% del ancho) | universal | Funcionó al primer intento (coords 129,228); campos precargados 9/9 y Enviar habilitado |
| Borrado de potencial Guardado: **directo, sin confirmación previa** | universal | Solo alert de éxito "Denario Clientes / ¡Cliente Potencial se borro con exito!" [OK]. El trash existe **solo** en Estatus Guardado |

## Oráculo de persistencia (RUNTIME §9)

Round-trip Guardar → reabrir ejecutado en DM-CLT-026: los **9 campos** se releyeron idénticos a lo guardado (`naClient`, `nuRif`, `txAddress`, `txAddressDispatch`, `txClient`, `naResponsible`, `emClient`, `nuPhone`, `naWebSite`), y la empresa siguió mostrando "ALIPASCUA, C.A.". Sin divergencias silenciosas.

## Hallazgos

Ninguno. 0 FAIL — la app se comportó correctamente en los 12 casos.

*Nota positiva de contraste:* el defecto de saldos de la lista abierto en globalmp (`[gmp-20260730]`) **no reproduce** en este build, y quedó descartado con verificación aritmética, no solo por inspección visual.
