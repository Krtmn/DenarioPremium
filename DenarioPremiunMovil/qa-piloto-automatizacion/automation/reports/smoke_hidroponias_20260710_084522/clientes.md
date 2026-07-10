# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | Infinix X6728 (HOT 60i) · uuid da9f78b6e785fffc |
| App | `com.kiberno.denarioPremiumPro` — appVersion 1.0 · dbVersion 12 |
| Cliente / Playa | hidroponias · denariolatortuga.ddns.net:8081 (HIDROPONIAS VENEZOLANA) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado inicial → final | HOME → HOME ✅ |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | Home → `app-clientes` con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | CLIENTES (`ion-button.colorBorderBuscar`) → `app-client-list` 50 ítems con Saldo BS y Saldo USD (multiCurrency) |
| DM-CLT-003 | ✅ PASS | Buscar "MACO" (focus+type+click search-circle) → filtró a 1 ítem: ALIMENTOS MACO 2020 (2602) |
| DM-CLT-009 | ✅ PASS | Click ítem → `app-client-detail`: Nombre ALIMENTOS MACO 2020 (2602), RIF J411965871, Saldo BS 6.465.087,39 / USD 9.425,15 |
| DM-CLT-013 | ✅ PASS | Tab "Doc. de Venta" (`ion-segment.value=docVentas`) → panel `.documents-table-panel--ready`, leyenda Vigente/Vencido/A favor + headers |
| DM-CLT-016 | ✅ PASS | `clickBack` desde lista → `app-clientes` con 3 botones (no salta a HOME) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` |
| DM-CLT-019 | ✅ PASS | CLIENTE POTENCIAL → 9 ion-inputs vacíos + idEnterprise (ion-select null); Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | fillIonInput ×8 + idEnterprise=1 (value **numérico**, opción única HIDROPONIAS VENEZOLA) → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; en BUSCAR aparece Guardado (Ref 0, con trash) |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado (zona izq. ~30%) → Enviar → 3 alertas → "Cliente potencial nro. **10** creado exitosamente"; item pasa a Ref 10 sin trash (Enviado). **BD-OK** |
| DM-CLT-031 | ✅ PASS | Trash en Guardado (Test-CLT-DEL-090030, Ref 0) → borrado **directo** "¡Cliente Potencial se borro con exito!" → desaparece de la lista |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **10** | Cliente potencial `Test-CLT-SMOKE-085633` (RIF 123456789, empresa HIDRO_A) | **Enviado** (id_client=10, BD-OK) |
| 0 | Cliente potencial `Test-CLT-DEL-090030` (RIF 987654321) | Guardado → **Borrado** (limpiado en DM-CLT-031) |

## Verificación BD (§10)

Registro Enviado `Test-CLT-SMOKE-085633` (UI Ref 10):

```
node automation/db/query.js hidroponias "SELECT id_client, co_client, na_client, nu_rif, st_potential_client, da_created FROM potential_client ORDER BY da_created DESC LIMIT 5"
```

| Campo | Valor nube |
|-------|-----------|
| id_client | **10** (= UI Ref 10) |
| co_client | 1783688160032.0 |
| na_client | Test-CLT-SMOKE-085633 (match marcador) |
| nu_rif | 123456789 |
| st_potential_client | **1** (Enviado) |
| da_created | 2026-07-10T12:58:59Z |

**Marca: `BD-OK`** — guardado→enviado confirmado. `na_client` coincide con el marcador tipeado; `st_potential_client=1`; **correlación UI Ref = `id_client=10` reconfirmada** (candidato a graduar `BD-INFO`→FAIL). POST capturado: `potentialclientservice/potentialclient` → `_payloads.jsonl`.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tras **Guardar**, el form NO navega a la lista — queda en el formulario (9 inputs siguen visibles); el Guardado solo es visible vía BUSCAR CLIENTE POTENCIAL | universal | Reconfirma nota don-theo `[dth-2612]` ahora también en **hidroponias**. Requiere `clickBack` para volver al home clientes antes de BUSCAR |
| Reabrir Guardado con click en zona izq. (~30% ancho, coords ~112,y) precarga form con Enviar habilitado | universal | Reconfirma `[ins-2622][jerez][ferrenuestro]` en hidroponias; el clic izquierdo evita el trash a la derecha |
| idEnterprise 1 sola opción (HIDROPONIAS VENEZOLA, value=1) NO auto-selecciona; exige `value=1` **numérico** + ionChange | cliente (hidroponias) / patrón universal | Igual que ferrenuestro con 1 empresa: opción única no se auto-selecciona; string '1' deja ng-invalid |
| Borrado de Guardado es **directo sin confirmación previa** (solo alert éxito "¡Cliente Potencial se borro con exito!", título "Denario Clientes" plural) | universal | Reconfirma globalmp/don-theo en hidroponias |
| Captura payload `potentialclientservice/potentialclient` vía hook nativePromise SÍ funciona en hidroponias | universal | Coherente con `[ferrenuestro]` (potentialclient capturable); útil para cotejo BD |

> ✅ consolidado 20260710

## Hallazgos (FAIL)

Ninguno. Los 12 casos PASS.

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|------|-------|-----------------|-------|-----------|-------|
| 1783688160032.0 | BD-FIELD-OK | 17/17 OK | 0 (potentialClient = cabecera pura) | 0 | `da_client` difiere solo en hora (payload UTC-4 → nube UTC), esperado |

**Conclusión:** el payload enviado se persiste íntegro en la nube, 17/17 campos cabecera OK, 0 mismatches. Nota de zona horaria = calibración estándar, no mismatch.
