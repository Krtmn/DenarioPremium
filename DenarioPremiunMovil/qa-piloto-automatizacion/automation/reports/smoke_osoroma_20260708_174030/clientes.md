# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260708_174030_smoke-completo` |
| Módulo | CLIENTES |
| Cliente | osoroma |
| Dispositivo | WebView CDP :9220 (Infinix X6728 / HOT 60i, android) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Build | El Yaque (servidor `denarioelyaque.ddns.net:8081`) — ⚠ `window.ng=true` (ver Patrones) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` visible con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | Lista `app-client-list` con 50 clientes, orden alfabético por `na_client`; cada ítem con Saldo VED y Saldo USD (multiCurrency) |
| DM-CLT-003 | ✅ PASS | Búsqueda "ACUMULADORES" filtró 50→1 (ACUMULADORES DUNCAN, C.A.); requiere click en botón `search-circle-sharp` (~317,94), no filtra on-keyup |
| DM-CLT-009 | ✅ PASS | Detalle `app-client-detail`: Empresa (CALZADOS SICURA C.A.), Nombre+Código (20105), Lista de Precio, RIF, Contacto, Teléfono, Saldo VED/USD, Crédito |
| DM-CLT-013 | ✅ PASS | Tab Doc. de Venta (cliente ALIMENTOS TU VERDURA con saldo) renderiza tabla `.documents-table-panel--ready` con 2 documentos (FA 31156147) + leyenda Vigente/Vencido/A favor |
| DM-CLT-016 | ✅ PASS | `clickBack` desde lista → `app-clientes` con 3 botones |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` visible (no salta a HOME) |
| DM-CLT-019 | ✅ PASS | Formulario CLIENTE POTENCIAL: 9 ion-inputs vacíos + idEnterprise (ion-select) null; Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | Lleno 8 campos + idEnterprise=3 (numérico) → Guardar/Enviar `disabled=false`; naWebSite vacío (opcional confirmado) |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; en BUSCAR aparece Estatus Guardado (Nro. Ref: 0, con trash) |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado (click zona izq. del item) + Enviar → 3 alertas → "Cliente potencial nro. **2** creado exitosamente"; pasa a Enviado (sin trash). **BD-OK** |
| DM-CLT-031 | ✅ PASS | Trash en registro Guardado (Test-CLT-DEL) → alert "Denario Clientes / ¡Cliente Potencial se borro con exito!" (directo, sin confirmación previa) → desaparece de la lista |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| 2 | `Test-CLT-SMOKE-175054` · RIF J1750540 · idEnterprise=3 (DISTRIBUIDORA OSOROMA C.A.) · GPS 11.0490806,-63.8649942 | **Enviado** — persistido en nube (`potential_client.id_client=2`, `st_potential_client=1`) |
| 0 | `Test-CLT-DEL-175346` · RIF J1753461 · idEnterprise=3 | Guardado → **borrado** (limpieza DM-CLT-031); no persiste |

---

## Verificación BD

**Nube (`potential_client`)** — `node automation/db/query.js osoroma "SELECT ... FROM potential_client ORDER BY da_created DESC"`:

| Campo | UI enviado | Nube | Veredicto |
|-------|-----------|------|-----------|
| id_client | Nro. Ref = 2 | `2` | ✅ correlación Ref UI = `id_client` (reconfirma prc-2606) |
| co_client | `1783547411378.0` (payload) | `1783547411378.0` | ✅ |
| na_client | `Test-CLT-SMOKE-175054` | `Test-CLT-SMOKE-175054` | ✅ match directo por marcador |
| nu_rif | `J1750540` | `J1750540` | ✅ |
| st_potential_client | — | `1` (Enviado) | ✅ Guardado(0)→Enviado(1) tras DM-CLT-026 |
| id_enterprise | `3` (explícito) | `3` | ✅ asignación explícita persistió |

**Marca: BD-OK** — el cliente potencial guardado se envió y llegó íntegro a la nube. Payload interceptado por hook (`potentialclientservice/potentialclient`) confirma "lo enviado" (volcado en `_payloads.jsonl`).

**Local (`potential_clients`):** `BD-N/A` — `local-query.js` da `ERR: run-as: exec failed for sqlite3: No such file or directory` (binario sqlite3 ausente en el device, igual que ferrenuestro). No bloquea; la nube es autoritativa.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ⚠ `window.ng` **presente (=true)** en build osoroma | cliente (osoroma) | Contradice el supuesto del prompt (`window.ng=false`) y el header del reporte de login de esta misma corrida. Los helpers con fallback `window.ng` SÍ serían operativos en osoroma; aun así se condujo todo con clicks reales de coordenadas (robusto en ambos builds). Revisar si el "El Yaque = window.ng=false" es específico de jerez/ferrenuestro y no de osoroma |
| Etiqueta de saldo **"VED"** (no "BS") | universal (nuevo servidor El Yaque) | Lista y detalle muestran "Saldo VED" / "Crédito VED" en vez de "Saldo BS". El smoke-clientes.md dice "saldo BS"; ajustar el criterio a VED/USD |
| idEnterprise opciones numéricas `1/2/3` | cliente (osoroma) | 3 empresas: 1=CALZADOS SICURA C.A., 2=CALZADOS AYALA C.A., 3=DISTRIBUIDORA OSOROMA C.A. Reconfirma que exige `value` NUMÉRICO + `ionChange` (reafirma jerez/ferrenuestro) |
| GPS capturado en payload potencial | universal | `userMustActivateGPS=true` → el POST incluye `coordenada:"11.0490806,-63.8649942"` (El Yaque). El envío no requirió activar GPS por UI (ya disponible) |
| Reabrir Guardado por click zona izq. (~35%) del `ion-item` | universal | Confirmado también en osoroma: reabre el form con campos + idEnterprise precargados y Enviar habilitado (reafirma ins-2622/jerez/ferrenuestro) |
| Hook `potentialclientservice/potentialclient` capturable en El Yaque | universal | El hook `nativePromise` capturó el POST del cliente potencial (coherente con ferrenuestro; contrasta con `reference_qa_payload_capture_gap`) |

**Selectores reutilizados sin cambios:** `input[type="text"][placeholder="Clientes..."]`, `ion-icon[name="search-circle-sharp"]`, `ion-button.imagenGuardar/.imagenEnviar`, `ion-select[formcontrolname="idEnterprise"]`, `ion-segment-button[value="docVentas"]`, `.documents-table-panel--ready`, `ion-button[color="danger"]` (trash), `img.fechaAtras`.

---

## Hallazgos (FAIL)

Ninguno. 12/12 PASS.

---

**Duración aprox. módulo:** ~4 min (17:50–17:54 UTC-4)
**Agente:** Denario QA · Módulo CLIENTES · osoroma
