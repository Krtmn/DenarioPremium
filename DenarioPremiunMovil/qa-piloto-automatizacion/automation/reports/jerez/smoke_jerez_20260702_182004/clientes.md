# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260702_182004_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 (Infinix X6728) |
| App | `com.kiberno.denarioPremiumPro` — APK debug feature branch |
| Playa | jerez (servidor El Yaque · denarioelyaque.ddns.net:8081) |
| Resultado | 11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Módulo Clientes (Home 286,428) → `app-clientes` con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Click CLIENTES → `app-client-list` con 3 clientes (cartera empresa 1 azul de jerez), cada uno con Saldo BS y Saldo USD (multiCurrency OK). La lista no está vacía y coincide con el dato de prueba |
| DM-CLT-003 | ✅ PASS | Búsqueda "JL Motors" (focus input + keyboard.type + click `search-circle-sharp`) → filtró a 1 resultado: JL Motors SE,C.A (J-506554950) |
| DM-CLT-009 | ✅ PASS | Click cliente → `app-client-detail`: Nombre JL Motors SE,C.A (J-506554950), RIF, Saldo BS 0,00, Saldo USD 0,00, Empresa INVERSIONES JEREZ 1, Contacto/Email/Teléfono/Crédito visibles |
| DM-CLT-013 | 🚫 N/A | Tab Doc. de Venta renderiza pero vacío (0 filas, panel sin `--ready`). JL Motors (saldo 0,00, empresa 1 azul) no tiene documentos de venta sincronizados — condición documentada; los docs están en emp 2/3. No es FAIL |
| DM-CLT-016 | ✅ PASS | `clickBack` desde listado → `app-clientes` (home clientes, 3 botones), no salta a HOME principal |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` (3 ítems), no salta al home |
| DM-CLT-019 | ✅ PASS | Click CLIENTE POTENCIAL → 9 ion-input (`naClient,nuRif,txAddress,txAddressDispatch,txClient,naResponsible,emClient,nuPhone,naWebSite`) + ion-select `idEnterprise`; Guardar y Enviar `disabled=true` con form vacío |
| DM-CLT-021 | ✅ PASS | `fillIonInput` 8 campos + `idEnterprise=1` (INVERSIONES JEREZ 1) → Guardar y Enviar `disabled=false`. Marker `Test-CLT-SMOKE-182448`, RIF J-991824481 |
| DM-CLT-024 | ✅ PASS | Click Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!". En BUSCAR CLIENTE POTENCIAL aparece con Nro. Ref: 0 + trash (Estatus Guardado) |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado (click zona izquierda 30% del ion-item, campos precargados, Enviar habilitado) → Enviar → 3 alertas: "¿Desea enviar nuevo Cliente Potencial?" → "El cliente potencial será enviado" → "Cliente potencial nro. **5** creado exitosamente". En BUSCAR pasa a Nro. Ref: 5 · Estatus: Enviado (sin trash). **BD-OK** |
| DM-CLT-031 | ✅ PASS | Nuevo potencial `Test-CLT-DEL-182745` (Ref 0, Guardado) → click trash → borrado **directo sin confirmación previa**, solo alert éxito "Denario Clientes / ¡Cliente Potencial se borro con exito!" → desaparece de la lista (solo queda el Enviado Ref 5) |

## Registros creados en sistema
| Ref | Detalle | Estado final |
|-----|---------|--------------|
| 5 | Cliente potencial `Test-CLT-SMOKE-182448` · RIF J-991824481 · idEnterprise 1 (INVERSIONES JEREZ 1) | **Enviado** (persiste en nube, id_client=5) |
| — (Ref 0) | Cliente potencial `Test-CLT-DEL-182745` · RIF J-881827452 · idEnterprise 2 | Guardado → **Borrado** (nunca enviado; usado para DM-CLT-031) |

## Verificación BD (round-trip al servidor · RUNTIME §10)
- **Baseline nube:** `max(id_client)=4` en `potential_client` (Test-CLT-SMOKE-204858).
- **Payload capturado** (POST `potentialclientservice/potentialclient`): `naClient=Test-CLT-SMOKE-182448`, `nuRif=J-991824481`, `idEnterprise=1`, `coEnterprise=00001`, `typeTransaction=potentialClient`, `hasAttachments=false`. Volcado a `_payloads.jsonl` (1 línea).
- **Nube tras Enviar:** fila nueva `id_client=5`, `na_client=Test-CLT-SMOKE-182448`, `nu_rif=J-991824481`, `st_potential_client=1`, `id_enterprise=1`, `da_created=2026-07-02T22:26:23Z`. → **BD-OK** (guardado→enviado confirmado end-to-end).
- **Correlación Ref UI = `id_client`:** UI "nro. 5" = `id_client=5` en `potential_client`. Confirmado nuevamente (jerez) — refuerza el candidato `[prc-2606]`.
- **`st_potential_client=1` para Enviado:** confirmado (los Guardados Ref:0 nunca llegan a la nube — el DEL borrado no dejó fila).

### Verificación BD (payload ↔ nube) — Agente BD (definitivo · cotejo campo-por-campo)

> `cotejo-payload.js` corrió sobre el payload real. Agente BD en background, completó y devolvió esta sección; anexada por el orquestador. **PRIMER cotejo campo-por-campo real de clientes** en toda la validación (en corridas previas el potencial no persistía → siempre BD-SAVED).

| id_client | Marca | Campos cabecera | Mismatches | Notas |
|---|---|---|---|---|
| 5 | **BD-FIELD-OK** | 17/17 OK | 0 | `da_client`: hora UTC-4 vs nube UTC → nota TZ, no mismatch |

- **Conteo por marca:** BD-FIELD-OK = 1 · BD-FIELD-MISMATCH = 0 · BD-SAVED = 0 · BD-N/A = 0.
- **17/17 campos cuadran:** co_client, na_client, nu_rif, na_responsible, em_client, nu_phone, co_user, id_user, tx_address, tx_address_dispatch, tx_client, da_client (TZ), co_enterprise, id_enterprise, coordenada, nu_attachments, has_attachments. `potential_client` = cabecera pura (sin hijas).
- **Veredicto:** lo que se mandó == lo que se guardó. Config `potential_client` **validado en vivo** (sin renames faltantes ni campos payload-only sin clasificar). ✅
- **Comparativa con corrida previa (`20260630_181903`):** allí el mismo módulo cerró **BD-SAVED** (el potencial quedó "Por Enviar" y no llegó a la nube). En este build el registro **persistió** → la no-persistencia (H1) **no se reprodujo** para clientes.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `ion-select[formcontrolname="idEnterprise"]` opciones con `value` numérico (1/2/3), NO atributo | universal | El atributo `value` de `ion-select-option` es null; el valor real está en la propiedad `.value` (number). Setear `sel.value=<n>` + `ionChange` habilita el form |
| Reapertura Guardado: click zona izquierda 30% del `ion-item` (x≈l+w*0.30) | universal | Confirmado en jerez: reabre form con campos precargados + Enviar habilitado, sin tocar el trash (derecha). Coincide con nota `[ins-2622]` |
| Títulos de alertas potencial en jerez | cliente | Guardar/Borrar = "Denario Cliente"/"Denario Clientes"; envío alertas 1 "Denario Clientes", 2 y 3 "Denario Premium". Coincide con patrón piercar `[prc-2606]` |
| jerez cartera empresa 1: 3 clientes, todos saldo 0,00, sin docs de venta | cliente | DM-CLT-013 N/A esperado con JL Motors; docs vencidos en empresas 2/3 (rojo) |

## Hallazgos (solo si hay FAIL)
Ninguno. 0 FAIL. La no-persistencia observada en corridas previas **no se reprodujo**: el envío persistió correctamente (id_client=5, st=1) con el APK debug del feature branch.
