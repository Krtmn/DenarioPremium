# Smoke Test — Módulo CLIENTES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | Android real vía CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | Isla Coche (`http://denarioislacoche.ddns.net:8081`) |
| Cliente | ferrenuestro (usuario `leidy`) — 1ª corrida |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | Lista `app-client-list` con 41 ítems (carga inicial; scroll infinito), cada uno con Código y Saldo $ |
| DM-CLT-003 | ✅ PASS | Buscar "INSTRUELECT" (focus input + keyboard.type + click `search-circle-sharp`) → filtró a 1 coincidencia |
| DM-CLT-009 | ✅ PASS | Detalle `app-client-detail`: INSTRUELECT IMPORT,C.A (1001785618), RIF J-412635530, Saldo Bs. 165,54, Crédito $ 2.000,00, empresa "FERRENUESTRO MAYOR" |
| DM-CLT-013 | ✅ PASS | Tab Doc. de Venta: tabla `.documents-table-panel--ready` con leyenda Vigente/Vencido/A favor y 1 doc (Nº 00034302, $165,54, venc 23/07/2026) |
| DM-CLT-016 | ✅ PASS | `clickBack` desde lista → home clientes con 3 botones (no salta a HOME principal) |
| DM-CLT-017 | ✅ PASS | `clickBack` desde detalle → `app-client-list` |
| DM-CLT-019 | ✅ PASS | Form potencial: 9 ion-inputs vacíos + `idEnterprise` ion-select; Guardar/Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | `fillIonInput` ×8 + `idEnterprise=1` (numérico) → Guardar/Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!"; registro en BUSCAR con Nro. Ref: 0 · Estatus: Guardado |
| DM-CLT-026 | ✅ PASS | Reabrir Guardado (zona izq. ion-item) → Enviar → 3 alertas → "Cliente potencial nro. 94 creado exitosamente"; registro pasa a Nro. Ref: 94 · Estatus: Enviado |
| DM-CLT-031 | ✅ PASS | 2º potencial Guardado → trash (`ion-button[color=danger]`) → borrado directo sin confirmación → alert "¡Cliente Potencial se borro con exito!"; desaparece de la lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| 94 | Cliente potencial `Test-CLT-SMOKE-180306` (RIF J-987654321, empresa FERRENUESTRO MAYOR, idEnterprise=1) | Enviado (BD-OK, `id_client=94`) |
| 0 | Cliente potencial `Test-CLT-DEL-180536` (creado para DM-CLT-031) | Guardado y luego BORRADO (nunca llegó a la nube — correcto) |

## Datos reales descubiertos (insumo YAML)
| Clave | Valor descubierto |
|-------|-------------------|
| cliente_busqueda | `INSTRUELECT IMPORT` (primer cliente por co_client; código 1001785618) |
| cliente_detalle | INSTRUELECT IMPORT,C.A · código 1001785618 · RIF J-412635530 · Saldo Bs. 165,54 · Crédito $ 2.000,00 · Cond. Pago 002-CREDITO · 1 doc. de venta (Nº 00034302, venc 23/07/2026) |
| empresas (idEnterprise) | 1 opción: value=**1** (numérico), rótulo "FERRENUESTRO MAYOR," · coEnterprise="00001" |
| cliente_nombre (rótulo UI) | "FERRENUESTRO MAYOR" (empresa mostrada en detalle y selector) |

## Verificación BD
`BD-OK` — round-trip UI→servidor confirmado (RUNTIME §10).

**Nube (`potential_client`, ferrenuestro):**
```
id_client=94 · co_client=1783461759098.0 · na_client=Test-CLT-SMOKE-180306 · nu_rif=J-987654321 · st_potential_client=1 · da_created=2026-07-07T22:04:22Z
```
- Baseline pre-corrida `potential_client=87` → tras envío `max(id_client)=94`. Fila nueva presente con el marcador tipeado.
- `st_potential_client=1` (Enviado) — coincide con el patrón piercar (`=1` para Enviados).
- **Correlación Ref UI = `id_client`**: alert "nro. 94" = `id_client=94` en BD. Reconfirmado (candidato a graduar a FAIL). `BD-INFO`→ ahora 2ª+ confirmación.
- Payload capturado (`potentialclientservice/potentialclient`): `coClient=1783461759098.0`, `idEnterprise=1`, `coEnterprise="00001"`, `naClient=Test-CLT-SMOKE-180306` → 1:1 con la fila nube. Volcado a `_payloads.jsonl`.
- Registro `Test-CLT-DEL-180536` (Guardado→borrado): correctamente **ausente** de la nube (nunca se envió).

Conclusión guardado→enviado: **lo guardado se envió** (BD-OK), sin registros atascados ni duplicados.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `idEnterprise` value numérico (1 sola empresa) | universal (refuerza `[jerez-2026-07-06]`) | Con **1 sola opción** el selector NO se auto-selecciona y exige `value=1` **numérico** (`sel.value=1` + `ionChange`); string `'1'` dejaría el control `ng-invalid`. Confirma anti-patrón dth/ins con multi-empresa=1 en ferrenuestro. |
| `signatureClient=true` NO bloquea Guardar/Enviar | cliente ferrenuestro | Pese a `signatureClient=true` en config, Guardar/Enviar habilitaron con solo los 9 controles (8 inputs + idEnterprise); la firma no es requisito para persistir/enviar el potencial. |
| Reabrir Guardado zona izq. (~30% ancho) | universal (confirma `[ins-2622][jerez]`) | Click a x≈30% del ion-item reabre el form con Enviar habilitado; navegó estable en ferrenuestro. |
| Empresa rótulo con coma final | cliente | La opción de empresa llega como "FERRENUESTRO MAYOR," (coma final en el textContent del `ion-select-option`). |

> ✅ consolidado 2026-07-07 → idEnterprise-numérico y reabrir-Guardado con tag en `module-selectors/clientes.md`; signatureClient-no-bloquea y rótulo-coma-final en `clientes.yaml modules.clientes`.

## Hallazgos (solo si hay FAIL)
Sin FAIL.

## Nota de estado final
App queda en **HOME** (`/home`), lista para el siguiente agente.

## Verificación BD (payload ↔ nube) — Agente BD (cotejo campo-a-campo)

| co_x | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| 1783461759098.0 | BD-FIELD-OK | 17/17 OK | — (sin hijas) | 0 | `da_client` hora difiere (zona horaria UTC-4↔UTC), mismo día → nota |

**Cabecera cotejada (17 campos, todos OK):** co_client, na_client, nu_rif, na_responsible, em_client, nu_phone, co_user, id_user, tx_address, tx_address_dispatch, tx_client, da_client (nota TZ), co_enterprise, id_enterprise, coordenada, nu_attachments, has_attachments.

**Conclusión:** el cliente potencial `Test-CLT-SMOKE-180306` se envió y llegó a la nube de ferrenuestro con todos los campos idénticos a lo capturado por UI (BD-FIELD-OK). `naWebSite`/`coordenadaClient` viajaron null → salteados. La BD no afecta el veredicto del smoke.
