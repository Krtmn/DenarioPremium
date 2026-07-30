# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | CLIENTES |
| Cliente / Playa | latino_cosmetica · **isla_coche** (`http://denarioislacoche.ddns.net:8081/PremiumWS`) |
| App | `com.kiberno.denarioPremiumPro` — app_version `1.0` · db_version `19` · `window.ng=true` |
| Empresa | LATINOCOSMETICA C.A. · `co_enterprise` 00001 · RIF J-31232315-9 (ÚNICA) |
| Usuario | co_login `100` · NEIMY PARRA · `id_user` 477 · ⚠ `co_user` en BD local = **"00014"** |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado inicial / final | HOME → HOME ✅ |
| Watchdog | 0 cuelgues · 0 reconexiones · sin abortos |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con los 3 botones: CLIENTES / CLIENTE POTENCIAL / BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Lista con **50 ítems**; cada uno con **`Saldo BSD:` Y `Saldo $:`** (multiCurrency real). Ej. "1.000 Y UNA BELLEZA, C.A. · Código: 4 · Saldo BSD 192.277,50 · Saldo $ 260,81" |
| DM-CLT-003 | ✅ PASS | `"ANNELI"` en searchbar + click `search-circle-sharp` → **1 resultado**: ANNELI CA (Código 13). Filtra por nombre |
| DM-CLT-009 | ✅ PASS | `app-client-detail`: Nombre "ANNELI CA (13)", RIF J412661841, Saldo BSD 275.179,25, Saldo $ 373,26, Crédito BSD/$ , Cond. Pago "1 - CREDITO", Lista Precio DETAL, Empresa LATINOCOSMETICA C.A. |
| DM-CLT-013 | ✅ PASS | Tab `docVentas` → `.documents-table-panel--ready` con leyenda **Vigente / Vencido / A favor** y 1 documento: tipo 03, Nº 1757, moneda $, 29 días venc., Saldo 275.179,25 BSD / 373,26 $, Fecha 30/06/2026 |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` con los 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (50 ítems, filtro reseteado) |
| DM-CLT-019 | ✅ PASS | Form con **9 `ion-input` vacíos** (naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone, naWebSite) + `ion-select[formcontrolname=idEnterprise]`; **Guardar y Enviar `disabled=true`** |
| DM-CLT-021 | ✅ PASS | `fillIonInput` × 8 → Guardar/Enviar `disabled=false`. `naWebSite` quedó vacío (opcional, reconfirmado) |
| DM-CLT-024 | ✅ PASS | Alert **"Denario Cliente / ¡Cliente Potencial Guardado con exito!"** (botón OK) → en BUSCAR CLIENTE POTENCIAL: "Test-CLT-SMOKE-134438 · Nro. Ref: 0 · Estatus: **Guardado**" con trash |
| DM-CLT-026 | ✅ PASS | Reabierto (zona izq. 35% del ion-item) con los 9 campos intactos → Enviar → **3 alertas** → **"Cliente potencial nro. 4 creado exitosamente"**. Lista: Nro. Ref **4** · Estatus **Enviado** · trash ausente. POST `potentialclientservice/potentialclient` capturado |
| DM-CLT-031 | ✅ PASS | 2º potencial `Test-CLT-DEL-134719` Guardado → click trash → **borrado directo sin confirmación previa**, solo alert "Denario Clientes / ¡Cliente Potencial se borro con exito!" → desaparece de la lista (3 ítems → 2) |

## Registros creados en sistema

| Nro. Ref | Detalle | Estado |
|-----|---------|--------|
| **4** | Cliente potencial `Test-CLT-SMOKE-134438` · RIF J987654321 · Tel 04149161796 · AV PRINCIPAL QA CIUDAD GUAYANA · Empresa LATINOCOSMETICA C.A. (id 1) · `co_client` **1785347054572.0** | **Enviado** ✅ |
| 0 (local) | Cliente potencial `Test-CLT-DEL-134719` · RIF J112233445 — creado para DM-CLT-031 | **Borrado** (nunca enviado) |

Manifiesto: `_bd-manifest.jsonl` (1 línea, `ref:"4"`, `epoch:"1785347054572.0"`, `marca_bd:"BD-N/A"`).

## Verificación BD

**Nube — `BD-N/A`**: la BD de latino_cosmetica está **sin GRANT** (0/185 tablas para `user_read`). No se ejecutó `query.js` (indicación explícita del orquestador). La llegada a la nube la verifica la **capa web** por **Nro. Ref = 4**.

**Local (device, vía `window.sqlitePlugin`) — evidencia de que salió de la cola:**

```
potential_clients (última fila)
  id_client = 4            ← coincide con el Nro. Ref de la UI
  co_client = 1785347054572.0
  na_client = Test-CLT-SMOKE-134438      nu_rif = J987654321
  tx_address = AV PRINCIPAL QA CIUDAD GUAYANA
  tx_address_dispatch = AV PRINCIPAL QA DESPACHO
  tx_client = CLIENTE QA SMOKE           na_responsible = NEIMY PARRA
  em_client = qa.smoke@kiberno.com       nu_phone = 04149161796
  na_web_site = NULL
  id_enterprise = 1        co_enterprise = 00001
  id_user = 477            co_user = 00014
  da_potential_client = 2026-07-29 13:46:13
  st_potential_client = 2                coordenada = 11.0490573,-63.864981
pending_transactions  → 0 filas
failed_transactions   → 0 filas
```

**Conclusión guardado→enviado:** el registro tiene `id_client=4` (>0), **no** está en `pending_transactions` ni en `failed_transactions` ⇒ la transacción **salió de la cola local con id de servidor**. Equivalente local de `BD-OK`; la confirmación en nube queda para la capa web (`marca_bd` = **BD-N/A** por falta de GRANT).

⚠ **`st_potential_client = 2`** para el registro Enviado (y también para el preexistente "Elinor D" Ref 3). Contrasta con la nota `[prc-2606]` que registraba **`=1`** en el servidor para Enviados. Puede ser que local y nube usen dominios distintos — **no se marca defecto**, se deja como `BD-INFO` para que la capa web lo dirima.

**Correlación Ref UI = `id_client`**: reconfirmada (UI "nro. 4" = `id_client=4`). Ya van ≥3 corridas (piercar, ferrenuestro, latino_cosmetica ×2) → candidata a graduar de `BD-INFO` a regla firme.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 `idEnterprise` **auto-asignado y `disabled`** en el build Isla Coche v1.0/db19 | build (contrasta con La Tortuga) | Con empresa ÚNICA, el `ion-select[formcontrolname="idEnterprise"]` viene con clase `select-disabled` y `sel.disabled=true`; el control queda **fuera de la validación** y **Guardar/Enviar habilitan con solo los 8 `ion-input`**, sin tocar el select. Invierte la regla vigente en `clientes.md` ("NO auto-selecciona, exige value numérico + ionChange", `[jerez][ferrenuestro][hidroponias][dm-electronica][latino_cosmetica-20260714]`). El envío igual viaja con `id_enterprise=1` / `co_enterprise=00001` (confirmado en BD local). **Probar `sel.disabled` antes de pelear con el value.** |
| 🔴 Bundle `__qaH` **idempotente** ⇒ el agente hereda las skills del agente ANTERIOR | universal / CDP | `helpers-inline.js` abre con `if (window.__qaH) return 'OK: __qaH ya instalado'`. El 2º agente en adelante **no instala su versión**: usa la del primero. Consecuencia real acá: `installPayloadCapture` heredado del agente LOGIN registra `{plugin,method,url}` **sin `options.data`** ⇒ `_payloads.jsonl` quedó sin body. Además forzar `__qaCaptureInstalled=false` + reinstalar **apila un 2º wrapper sobre `nativePromise`** ⇒ **cada POST aparece DUPLICADO**. Mitigación dejada instalada: `window.__qaH.getPayloadData()` → `[{url,data}]` (array `window.__qaPayloadsData`, hook único con guarda `window.__qaDataHook`). |
| Alert de guardado/borrado cierra con **"OK"**; el 1er paso del confirm de envío usa **"Aceptar"** | cliente/build | Reconfirma el patrón La Tortuga/Isla Coche v6+. Títulos mixtos: "Denario Cliente" (guardado, singular) / "Denario Clientes" (envío 1ª alerta y borrado, plural) / "Denario Premium" (2ª y 3ª de envío) |
| Lista de clientes muestra **ambas** monedas | cliente | `Saldo BSD:` **y** `Saldo $:` en el `ion-item` de la lista Y en el detalle. Contrasta con `[ferrenuestro-20260723]` (solo `Saldo $` en lista). No es FAIL |
| `signatureClient=true` **no materializa firma** | cliente | Ni Guardar ni Enviar solicitaron firma — reconfirma `[latino_cosmetica-20260714]` |
| Tras Guardar el form **no navega** y queda **pristine** | universal | No dispara el dirty-guard al hacer `clickBack` (a diferencia del form con cambios sin guardar) |

## Hallazgos (FAIL)

Ninguno. 0 FAIL.

## Notas

- La búsqueda por searchbar exige **click en el botón `search-circle-sharp`** — no filtra on-keyup (reconfirmado).
- `co_user` en la BD local es **"00014"**, no "100" (`co_login`). Son campos distintos; relevante para cotejos en la capa web.
- El cliente preexistente "Elinor D" (Ref 3, Enviado, 4 adjuntos) es de una sesión previa, no de esta corrida.
