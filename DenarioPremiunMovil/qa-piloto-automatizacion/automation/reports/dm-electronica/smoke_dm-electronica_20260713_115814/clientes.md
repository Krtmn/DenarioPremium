# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | Infinix X6728 (HOT 60i) · deviceUUID da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (El Yaque DM ELECTRONIC) |
| Playa / Cliente | El Yaque · dm-electronica (BOTZ) · usuario QA `002` |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Módulo Clientes abre `app-clientes` con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Botón CLIENTES → `app-client-list` con 50 ítems; cada uno con Saldo BS y Saldo US$ (multiCurrency=true confirmado) |
| DM-CLT-003 | ✅ PASS | Searchbar filtra con coincidencias: "ABEDCO"→ABEDCO,C.A; "IMPORT"→EL TIO IMPORT,C.A; "MUEBLES"→2 resultados. (Requiere click botón `search-circle-sharp`, no filtra on-keyup) |
| DM-CLT-009 | ✅ PASS | Detalle `app-client-detail` de "+ QUE MUEBLES UN SUENO, C.A (00001)": Nombre, Código, RIF J400165814, Saldo BS 1.253.212,38 / US$ 1.827,00, Condición de Pago, Dirección |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" renderiza `.documents-table-panel--ready`: FACT50003189 US$, montos base/IVA/total, Saldo, Fecha Doc 29/04/2026 / Venc 14/05/2026; leyenda Vigente/Vencido presente |
| DM-CLT-016 | ✅ PASS | clickBack desde listado → `app-clientes` con los 3 botones |
| DM-CLT-017 | ✅ PASS | clickBack desde detalle → `app-client-list` (no salta a HOME) |
| DM-CLT-019 | ✅ PASS | CLIENTE POTENCIAL: 9 controles vacíos (8 ion-input + idEnterprise ion-select); Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | fillIonInput ×8 + idEnterprise=1 (number) → Guardar/Enviar `disabled=false` (selVal=1). Marker `Test-CLT-SMOKE-120937` |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; en BUSCAR aparece con Nro.Ref 0, Estatus Guardado |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado (zona izq. ~30%) → Enviar → 3 alertas → "Cliente potencial nro. 2 creado exitosamente"; Estatus pasa a Enviado (Nro.Ref 2) |
| DM-CLT-031 | ✅ PASS | Trash en registro Guardado (`Test-CLT-DEL-121228`) → "¡Cliente Potencial se borro con exito!" (borrado directo, sin confirmación previa); desaparece de la lista; el Enviado permanece |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| id_client **2** | Cliente potencial `Test-CLT-SMOKE-120937` (RIF J123456789, tel 04141234567, Empresa BOTZ) | **Enviado** · BD-OK (nube `potential_client` id_client=2, st_potential_client=1) |
| — (Ref 0) | Cliente potencial `Test-CLT-DEL-121228` (creado solo para DM-CLT-031) | Guardado → **Borrado** (no persiste) |

## Verificación BD (round-trip §10)

- **Nube** `potential_client`: `id_client=2`, `co_client=1783958938499.0`, `na_client=Test-CLT-SMOKE-120937`, `nu_rif=J123456789`, `st_potential_client=1`, `da_created=2026-07-13T16:11:16Z`. → **BD-OK** (guardado→enviado confirmado).
- **Correlación Nro.Ref UI = `id_client`**: UI "nro. 2" = `id_client=2` en BD → reconfirma la correlación (`prc-2606`/piercar). `BD-INFO`.
- **Payload capturado** (`potentialclientservice/potentialclient`) volcado a `_payloads.jsonl`: incluye `idEnterprise:1`, `coEnterprise:"BARAK_A"`, `coordenada:"11.0490788,-63.8649976"` (GPS activo — userMustActivateGPS=true), `hasAttachments:false`.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Empresa (idEnterprise) SÍ activo en dm-electronica | cliente | ⚠️ Punto abierto RESUELTO: el YAML marca `enterpriseEnabled=false`, pero la UI SÍ expone Empresa: (a) form CLIENTE POTENCIAL trae `ion-select[formcontrolname="idEnterprise"]` REQUERIDO (1 opción `BOTZ` value=**1 numérico**); (b) el detalle de cliente muestra fila "Empresa: BOTZ"; (c) el payload envía `idEnterprise:1` + `coEnterprise:"BARAK_A"`. → tratar `enterpriseEnabled=true` para clientes (consolidar en YAML). |
| idEnterprise single-empresa exige value numérico | universal (refuerza) | Reconfirma `[jerez/ferrenuestro/hidroponias]`: 1 sola opción NO se auto-selecciona; `sel.value=1` (number)+ionChange habilita Guardar/Enviar; string `'1'` deja `ng-invalid`. |
| Búsqueda solo por nombre (no por código) | cliente/universal | El searchbar filtra por `na_client` (substring, case-insensitive) pero NO por código: "00091" → "No hay clientes disponibles". Buscar por nombre. |
| Segment Doc. Venta value | universal (reconfirma) | `ion-segment.value='docVentas'` + ionChange + click en `ion-segment-button[value="docVentas"]` renderiza `.documents-table-panel--ready`. |

> ✅ consolidado 20260713 — idEnterprise numérico y segment Doc.Venta reconfirmados (tag en clientes.md); búsqueda solo por nombre + sync parcial por usuario → notas universales; enterpriseEnabled=true ya en YAML.

## Notas / hallazgos (no-FAIL)

- **Dato de prueba ausente en dispositivo:** el cliente designado `IMPORTADORA MAR-CHAZ C.A` (co 00091, en BD nube) NO aparece en la lista sincronizada de la app para el usuario 002 ("IMPORTADORA"/"MAR-CHAZ"/"CHAZ" → "No hay clientes disponibles"). No es FAIL del buscador (probado OK con ABEDCO/IMPORT/MUEBLES) — es dato no sincronizado en el device. Para los casos de detalle/Doc.Venta se usó cliente real presente con saldo: **"+ QUE MUEBLES UN SUENO, C.A" (00001)**. Actualizar `modules.clientes.cliente_busqueda` del YAML a un cliente presente (ej. "MUEBLES" / "QUE MUEBLES UN SUENO").
- Mensajes exactos dm-electronica (coinciden con globalmp/don-theo): guardado título "Denario Cliente" / "¡Cliente Potencial Guardado con exito!"; envío 3 alertas ("Denario Clientes / ¿Desea enviar nuevo Cliente Potencial?" → "Denario Premium / El cliente potencial será enviado" → "Denario Premium / Cliente potencial nro. N creado exitosamente"); borrado "Denario Clientes / ¡Cliente Potencial se borro con exito!" (directo, sin confirmación).
- Tras Guardar el form NO navega a la lista (queda en formulario); el Guardado solo se ve en BUSCAR CLIENTE POTENCIAL. Confirma `[dth-2612][hidroponias-20260710]`.
- Estado inicial HOME · estado final **HOME** ✅.

## Verificación BD (payload ↔ nube)

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| 1783958938499.0 | BD-FIELD-OK | 17/17 OK | — (sin hijas) | 0 | da_client: hora difiere (zona horaria UTC-4 ↔ UTC) |

**Detalle:** payload de `potentialclientservice/potentialclient` cotejado con `cotejo-payload.js`. Todos los campos llenos llegaron idénticos a la nube: co_client, na_client (Test-CLT-SMOKE-120937), nu_rif, na_responsible, em_client, nu_phone, co_user, id_user, tx_address, tx_address_dispatch, tx_client, co_enterprise (BARAK_A), id_enterprise, coordenada, nu_attachments, has_attachments, da_client.

**Nota de calibración:** `da_client` payload `2026-07-13 12:11:15` (local UTC-4) vs nube `...16:11:15Z` (UTC) → mismo día, +4h por zona horaria; tratado como nota, no mismatch.
