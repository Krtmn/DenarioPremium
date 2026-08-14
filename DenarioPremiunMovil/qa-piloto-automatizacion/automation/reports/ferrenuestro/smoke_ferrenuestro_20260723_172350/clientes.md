# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | CLIENTES |
| Cliente / Playa | ferrenuestro (Isla Coche) — servidor `denariolatortuga.ddns.net:8081` |
| Usuario | leidy |
| App | `com.kiberno.denarioPremiumPro` |
| window.ng | **TRUE** (confirmado esta sesión — contradice el YAML que lo daba false desde 2026-07-07; el build cambió) |
| Estado inicial → final | HOME → HOME ✅ |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | app-clientes con 3 botones (CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL) |
| DM-CLT-002 | ✅ PASS | app-client-list con 50 ítems y saldos (⚠ la lista muestra solo "Saldo $"; el BS aparece en el detalle) |
| DM-CLT-003 | ✅ PASS | búsqueda "INSTRUELECT IMPORT" filtró 50→1 (INSTRUELECT IMPORT,C.A) |
| DM-CLT-009 | ✅ PASS | detalle: Nombre INSTRUELECT IMPORT,C.A (1001785618), RIF J-412635530, Saldo Bs. 136,57, Crédito $ 2.000,00 |
| DM-CLT-013 | ✅ PASS | tab Doc. de Venta con leyenda Vigente/Vencido/A favor + tabla (docs 00034989, 00035009) |
| DM-CLT-016 | ✅ PASS | clickBack desde listado → app-clientes (3 botones) |
| DM-CLT-017 | ✅ PASS | clickBack desde detalle → app-client-list |
| DM-CLT-019 | ✅ PASS | form CLIENTE POTENCIAL: 9 ion-inputs + idEnterprise; Guardar/Enviar disabled |
| DM-CLT-021 | ✅ PASS | 8 campos + idEnterprise=1 (numérico) → Guardar/Enviar habilitados |
| DM-CLT-024 | ✅ PASS | alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!" |
| DM-CLT-026 | ✅ PASS | 3 alertas → "Cliente potencial nro. 93 creado exitosamente"; queda Enviado, Ref 93 |
| DM-CLT-031 | ✅ PASS | trash en Guardado (Ref 0) → borrado directo "¡Cliente Potencial se borro con exito!" → desaparece de lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| **93** | Test-CLT-SMOKE-173928 (RIF J123456789, idEnterprise=1 FERRENUESTRO MAYOR, tel 04140000000) | **Enviado** (persiste en BUSCAR CLIENTE POTENCIAL, sin papelera) |
| 0 | Test-CLT-DEL-174104 (RIF J987654321, idEnterprise=1) | Guardado → **borrado** en DM-CLT-031 |

## Verificación BD
- **Nube** (`query.js ferrenuestro potential_client`): `ERR: permission denied for table potential_client` → **BD-N/A** (blindaje §10; no tumba el smoke).
- **Local** (`local-query.js potential_clients`): `ERR: run-as: exec failed for sqlite3: No such file or directory` (binario sqlite3 ausente en el device) → **BD-N/A**.
- **Sustituto — captura de payload (PAYLOAD-OK):** el hook `nativePromise` interceptó el POST `potentialclientservice/potentialclient` con `naClient=Test-CLT-SMOKE-173928`, `idEnterprise=1`, `coEnterprise=00001`, `coClient=1784842751935.0`, `coTransaction`/`typeTransaction=potentialClient`. Volcado en `_payloads.jsonl`.
- **UI:** alert "Cliente potencial nro. **93** creado exitosamente" + Ref 93 mostrado en la lista → **Correlación Ref UI = `id_client` = 93** (BD-INFO, coherente con corridas previas).
- **Conclusión guardado→enviado:** el cobro… (potencial) se envió al servidor (POST capturado + Ref real asignado). Marca efectiva: **BD-N/A por lectores inaccesibles, con PAYLOAD-OK como evidencia de envío.**

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Módulo Clientes en Home = `app-home ion-col` con textContent "Clientes" (≈286,428) | universal | click real por coords del ion-col navega a app-clientes |
| Prompt "salir sin guardar" al hacer clickBack desde form potencial con cambios sin guardar | universal | 3 botones: **"Guardar y salir" / "Salir sin guardar" / "Cancelar"** (título "Denario Clientes", message vacío). "Guardar y salir" persiste el registro como Guardado y sale del form — útil para dejar un Guardado deletable sin re-tipear |
| Form potencial es sub-vista de `app-clientes` (no navega a HOME al Guardar) | universal (reconfirma) | tras Guardar el form queda abierto; los 3 botones home NO están visibles hasta clickBack; la lista de Guardados solo se ve entrando por BUSCAR CLIENTE POTENCIAL |
| ⚠ **window.ng=TRUE en ferrenuestro esta corrida** | cliente/build | contradice `[ferrenuestro-2026-07-07]` (window.ng=false). El build de Isla Coche cambió; no asumir false. Igual se condujo 100% con clicks reales |
| Lista de clientes muestra solo "Saldo $" (BS solo en detalle) | cliente | multiCurrency confirmado en detalle (Saldo Bs. + Crédito $); en la lista solo aparece "Saldo $" — no es FAIL |
| Botón alert de guardado/borrado = **"OK"** | cliente/build | confirmado el hallazgo de infra: cerrar alerts con 'OK' (no 'Aceptar'); la alerta de confirmación de envío sí usa 'Aceptar' en el 1er paso |

*Los demás patrones (idEnterprise value numérico, reapertura Guardado, 3 alertas de envío) se reconfirman sin novedad.*

> ✅ consolidado 20260723

## Baseline
- Tool-uses (aprox.): **~30** browser_run_code_unsafe (incl. ~6 de navegación extra por el prompt "salir sin guardar" al montar DM-CLT-031; ningún caso consumió reintento por selector).
- Duración módulo (aprox.): ~10-12 min wall.
