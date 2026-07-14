# Smoke Test — Módulo CLIENTES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260630_181903_smoke-completo` |
| Módulo | CLIENTES |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | jerez (2ª corrida) |
| Servidor | `denarioelyaque.ddns.net:8081/PremiumWS` (jerez corre en El Yaque) |
| Resultado | 11 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-CLT-001 | ✅ PASS | `app-clientes` con 3 botones: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL |
| DM-CLT-002 | ✅ PASS | `app-client-list` con 3 ítems; cada uno con Saldo BS y Saldo USD (multiCurrency=true). Cartera pequeña esperada (jerez emp.1) |
| DM-CLT-003 | ✅ PASS | Búsqueda "JL Motors" filtró 3→1 (JL Motors SE,C.A). Search icon coords ~317,94 |
| DM-CLT-009 | ✅ PASS | `app-client-detail`: Nombre "JL Motors SE,C.A (J-506554950)", RIF J-506554950, Saldo BS 0,00 / Saldo USD 0,00, Lista Precio 1, Cond. Pago CodCredito |
| DM-CLT-013 | 🚫 N/A | Tab "Doc. de Venta" renderiza (panel presente) pero 0 filas — JL Motors sin documentos de venta (saldo 0,00). Ausencia de datos, no defecto (consistente con YAML jerez) |
| DM-CLT-016 | ✅ PASS | clickBack desde listado → `app-clientes` (3 botones), NO salta a HOME |
| DM-CLT-017 | ✅ PASS | clickBack desde detalle → `app-client-list` |
| DM-CLT-019 | ✅ PASS | Form con 9 ion-inputs (naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone, naWebSite) + ion-select idEnterprise (3 opciones). Guardar y Enviar `disabled=true` |
| DM-CLT-021 | ✅ PASS | Llenar 8 inputs + idEnterprise=1 → Guardar y Enviar `disabled=false` |
| DM-CLT-024 | ✅ PASS | Click Guardar → alert "Denario Cliente / ¡Cliente Potencial Guardado con exito!". Form permanece (no navega) — consistente con `[dth-2612]` |
| DM-CLT-026 | ✅ PASS* | Click Enviar → 2 alertas ("¿Desea enviar nuevo Cliente Potencial?" Aceptar → "El cliente potencial será enviado" OK) + POST `potentialclientservice/potentialclient` capturado. ⚠ Estatus quedó "Por Enviar" / Ref:0 en sesión (ver Hallazgo H1) → BD-QUEUED |
| DM-CLT-031 | ✅ PASS | Borrado directo (sin confirmación previa) del registro Guardado Test-CLT-DEL: alert único "Denario Clientes / ¡Cliente Potencial se borro con exito!" → registro desapareció de la lista |

\* PASS sobre la acción de Enviar (flujo + POST OK); la confirmación round-trip (Estatus→Enviado + Ref real) no ocurrió en sesión — ver Hallazgo H1 y Verificación BD.

## Registros creados en sistema

| Ref | Cliente | Empresa | Estado | Detalle |
|-----|---------|---------|--------|---------|
| 0 (pendiente) | Test-CLT-SMOKE-204858 | 00001 / idEnterprise 1 | ENVIADO (POST capturado) · Estatus UI "Por Enviar" | coClient epoch `1782866922893.0`; RIF J-998877665; **PERSISTE** en BUSCAR CLIENTE POTENCIAL (Ref:0 en sesión). Confirmar id_client server-side (Agente BD) |
| — | Test-CLT-DEL-204858 | 00001 / idEnterprise 1 | GUARDADO → BORRADO (DM-CLT-031) | RIF J-111222333; eliminado, NO persiste |

## Verificación BD (round-trip · RUNTIME §10)

- **Payload volcado:** 1 línea a `automation/reports/smoke_jerez_20260630_181903/_payloads.jsonl` — endpoint `potentialclientservice/potentialclient`, `naClient=Test-CLT-SMOKE-204858`, `coEnterprise=00001`, `idEnterprise=1`, `coClient=1782866922893.0`, `hasAttachments=false`.
- **Estado en sesión:** el registro Test-CLT-SMOKE-204858 quedó **Estatus "Por Enviar" / Nro. Ref: 0** tras ~20s de sondeo (6 lecturas cada 3s). El POST salió (capturado en capa CapacitorHttp) pero el ACK del servidor (que asigna `id_client` y flipea a Enviado) no volvió en la ventana. Marca: **BD-QUEUED** (cola de salida / sync eventual — RUNTIME §10).
- **Para el Agente BD:** consultar `potential_client` en la nube (`na_client='Test-CLT-SMOKE-204858'`) para confirmar si llegó (→ BD-OK, Ref=id_client) o quedó atascado. Correlación Ref UI = `id_client`.

### Verificación BD (payload ↔ nube) — Agente BD (definitivo)

> Cotejo campo-a-campo del payload real contra la nube (`cotejo-payload.js` + query directo). Agente BD lanzado en background, completó y devolvió esta sección; anexada por el orquestador.

| co_client | Marca | Campos cabecera | Hijas | Mismatches | Notas |
|---|---|---|---|---|---|
| 1782866922893.0 | **BD-SAVED** | n/a (no persistió en nube) | — (potential_client sin hijas) | — | POST capturado hacia El Yaque, pero la fila NO llegó a `potential_client` en la ventana (2 intentos + reintento ~10s). Confirma H1. |

- **Conteo por marca:** BD-SAVED = 1 · BD-FIELD-OK = 0 · BD-FIELD-MISMATCH = 0 · BD-N/A = 0.
- **¿Llegó a la nube?** **NO.** `SELECT ... FROM potential_client WHERE na_client='Test-CLT-SMOKE-204858'` (y por `co_client`) devolvió vacío en ambos intentos. `max(id_client)=3` (Test-CLT-SMOKE-130318, 24-jun); el registro de hoy nunca se insertó. No es error de conexión → marca **BD-SAVED**, no BD-N/A.
- **¿El DSN de jerez lee la base de El Yaque?** **SÍ.** El SELECT devolvió clientes potenciales reales de smokes previos (id 2 = 22-jun, id 3 = 24-jun) → el oráculo apunta a la misma base a la que se POSTeó (`denarioelyaque.ddns.net:8081`). La ausencia de la fila de hoy es real.
- **Nota de calibración (motor):** `cotejo-payload.js` necesita el objeto completo `{url, data}` capturado (no solo `data`) para detectar el tipo por URL. Sin cambios de fieldMap/ignore para `potential_client` (no hubo campos a comparar).

**Conclusión H1 (actualizada por Agente BD):** el envío NO fue solo un ACK que no volvió a tiempo — **la fila no persistió en la nube**. Elevar como observación: revisar cola de salida / conectividad de envío del servidor de El Yaque para jerez. La UI (flujo + POST) funcionó; el smoke no se marca FAIL (§10), pero el round-trip de persistencia **falló** para este registro.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **connectOverCDP requiere ws directo + Host: localhost** | **universal (crítico)** | En este dispositivo (WebView Chrome 149) el patrón `connectCdp` estándar (`connectOverCDP('http://127.0.0.1:9220')`) **falla**: el WebView rechaza el header `Host: 127.0.0.1` en `/json/version` (cuelga) y luego reescribe el ws a `localhost:80` (ECONNREFUSED). Solución: `connectOverCDP('ws://127.0.0.1:9220/devtools/browser', { headers: { Host: 'localhost' } })`. Idem para `curl` de diagnóstico: `curl -H "Host: localhost"`. Candidato a actualizar `h.connectCdp`. |
| `installPayloadCapture` engancha por `nativePromise` | universal | Confirmado en jerez: hook `nativePromise` capturó el POST de potencial. Bundle `__qaH` OK (13 skills). |
| ion-select idEnterprise: textos DISTINTOS por empresa | cliente (jerez) | Las 3 opciones muestran **"INVERSIONES JEREZ 1 / 2 / 3"** (val 1/2/3), NO el "INVERSIONES JEREZ MO" idéntico reportado en la corrida `[jerez-2026-06-22]`. Actualizar nota del YAML. |
| `popoverSet` sin abrir popover habilita Guardar | universal | Asignar value+ionChange al ion-select vía `__qaH.popoverSet` (sin abrir el popover) basta para validar idEnterprise y habilitar Guardar/Enviar. |
| Estatus "Por Enviar" con trash presente | cliente/universal | El registro enviado pero no confirmado muestra Estatus "Por Enviar" + Ref:0 + trash `ion-button[color="danger"]` (se comporta como Guardado/cola). El trash desaparece solo cuando queda Enviado con Ref real. |

## Hallazgos

**H1 — DM-CLT-026: envío de cliente potencial no confirma a "Enviado" en sesión (BD-QUEUED).**
El flujo de Enviar ejecutó correctamente (2 alertas de confirmación + POST a `potentialclientservice/potentialclient` capturado), pero:
- Solo aparecieron **2 alertas**, NO las 3 de corridas previas (faltó la 3ª "Cliente potencial nro. {ref} creado exitosamente").
- El registro quedó **Estatus "Por Enviar" / Nro. Ref: 0** tras ~20s de sondeo, sin flipear a Enviado.

Divergencia respecto de corridas previas (globalmp/insumar/piercar) donde el envío flipeaba a Enviado en sesión con la 3ª alerta y Ref real. Consistente con **sync eventual / cola de salida** (RUNTIME §10): el POST salió pero el ACK del servidor no volvió en la ventana. **No se marca FAIL** (la BD nunca tumba el smoke; queued→flag, no defecto de UI). Requiere que el **Agente BD** confirme si la fila llegó a `potential_client` en la nube. Si tras la próxima sync el registro sigue "Por Enviar" en el dispositivo → escalar como posible fallo de conectividad/envío del servidor de El Yaque.
