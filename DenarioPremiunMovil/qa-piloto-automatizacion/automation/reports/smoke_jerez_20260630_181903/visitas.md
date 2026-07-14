# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260630_181903_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa / Servidor | jerez — El Yaque (denarioelyaque.ddns.net:8081) |
| Cliente de prueba | DANIELA HERNANDEZ F.P. (V161051485, empresa 1 / 00001) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED |

Estado inicial: WebView en `/devoluciones` (dejado por agente previo) → navegué a HOME sin cerrar sesión. Estado final: **HOME** (`app-home`).

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`, título "Visitas" + 3 botones: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita`, GENERAL habilitada, ACTIVIDADES+ADJUNTOS `disabled`, sin cliente |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas`, searchbar visible, lista vacía sin error (0 visitas sincronizadas hoy al inicio) |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardada (B) → alert "¿Desea borrar la visita?…" (CANCELAR/Aceptar) → Aceptar → "Se eliminó la visita de manera exitosa" → B desaparece de la lista |
| DM-VIS-010 | ✅ PASS | Cliente "DANIELA HERNANDEZ F.P. (V161051485)"; alert coordenadas descartado con 1er botón → tabs ACTIVIDADES+ADJUNTOS habilitadas, sucursal cargada |
| DM-VIS-014 | ✅ PASS | AÑADIR ACTIVIDAD/EVENTO → `ion-modal.modalActividades` con selector Actividad, selector Motivo, campo Comentario, botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | EVENTOS (idType 86) + Motivo SUPERVISION DE EVENTOS (idMotive 213) + comentario → evento en Tab Actividades: "Actividad: EVENTOS / Evento: SUPERVISION DE EVENTOS / Observación: Test-VIS-015-105405" |
| DM-VIS-019 | ✅ PASS | Guardar → alert "Denario / La visita se ha guardado", formulario permanece abierto (`/visita`). **BD-OK** |
| DM-VIS-020 | ✅ PASS | Enviar → 2 alertas ("¿Desea enviar la visita?" → Aceptar → "Denario Visitas / Su Visita será enviada" → OK) → navega a `/visitas`; visita reaparece en RUTA DE HOY como **Nro Ref. 18 · Estatus: Visitado**. **BD-OK** |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar (cliente + evento) → modal "¡Alerta!" con 3 botones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita **nueva nunca guardada** (C) → tras salir, RUTA DE HOY NO contiene C (solo Ref 18). Correcto |
| DM-VIS-023 | ✅ PASS | Click en visita Guardada (B) en lista → `/visita` editable, 3 tabs habilitadas, cliente cargado, botones Guardar/Enviar activos |
| DM-VIS-025 | 🚫 N/A | Sin visitas sincronizadas "No Visitado" en la RUTA DE HOY hoy (lista arrancó vacía) → no hay visita roja que iniciar. N/A estructural (ver YAML `smoke_na_estructural`) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (INICIAR VISITA sobre visita No Visitado) → N/A por dependencia |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" (desde modal 021) con ≥1 evento → visita B en RUTA DE HOY con **Estatus Guardado**; al reabrir, Tab Actividades conserva el evento "EVENTOS / SUPERVISION DE EVENTOS / Test-VIS-031-110016" (no se guardó sin actividades). **BD round-trip = BD-OK vía visita A** |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS renderiza los 3 acordeones: **Imágenes**, **Archivo** ("Subir Archivo", `userCanUploadFiles=true`), **Firma** ("Borrar", `signatureVisit=true`) |

## Registros creados en sistema

| Visita | Cliente | Evento | Estado final | Ref |
|--------|---------|--------|--------------|-----|
| A (enviada) | DANIELA HERNANDEZ F.P. | EVENTOS / SUPERVISION DE EVENTOS / "Test-VIS-015-105405" | **Enviado — Visitado (sincronizó)** | **Nro Ref. 18** (id_visit=18) |
| B (guardada→borrada) | DANIELA HERNANDEZ F.P. | EVENTOS / SUPERVISION DE EVENTOS / "Test-VIS-031-110016" | Guardado → **BORRADA** (DM-VIS-006) | Ref 0 (local, no enviada) |
| C (descartada) | DANIELA HERNANDEZ F.P. | EVENTOS / SUPERVISION DE EVENTOS / "Test-VIS-022-descartar" | **Descartada** ("Salir sin guardar"); nunca persistió | — |

**Visitas Guardadas pendientes al cierre: ninguna.** La única visita persistida es la A (Ref 18, Visitado/Enviado). B fue borrada, C descartada.

## Verificación BD (round-trip guardado→enviado · RUNTIME §10)

Visita A enviada (co_visit `1782917691911.0`, Nro Ref UI = 18):

**Nube (Postgres El Yaque):** — `BD-OK`
- `visit`: `id_visit=18`, `co_visit="1782917691911.0"`, `st_visit=2` (=Enviado, consistente con patrón piercar), `is_visited=true`, `is_dispatched=false`, `inc=1`.
- `incidence` de id_visit 18: `co_incid=18`, `co_type=86` (EVENTOS), `co_cause=213` (SUPERVISION DE EVENTOS), `tx_description="Test-VIS-015-105405"` → **coincide 1:1 con lo cargado por UI** (cabecera + detalle del evento). Nivel campo-a-campo = `BD-FIELD-OK`.
- **Correlación confirmada:** Nro.Ref UI 18 = `id_visit` 18; `co_visit` = `coTransaction` del payload capturado.

**Local (SQLite dispositivo):** — `BD-N/A`
- `local-query.js` devolvió `ERR: run-as: exec failed for sqlite3: No such file or directory` (el dispositivo Infinix no expone el binario `sqlite3` en el sandbox `run-as`). Blindaje §10: la parte local se marca `BD-N/A`, no tumba el smoke. La confirmación de nube es concluyente (visita llegó completa).

**Conclusión guardado→enviado:** lo que se guardó **se envió** correctamente. A diferencia de clientes/pedidos de esta corrida (quedaron "Por Enviar"), **visitas SÍ sincronizó** end-to-end (Ref real 18, Estatus Visitado, incidencia en nube).

## Payloads de servicio volcados

- Hook `installPayloadCapture` (nativePromise) **SÍ capturó** el endpoint `visitservice/visit` (además de 20× `syncservice/getsync`).
- Se capturaron **4 POST idénticos** a `visitservice/visit` (reintentos del mismo envío, mismo `coTransaction 1782917691911.0`). Se volcó **1 línea** representativa (deduplicada) a `automation/reports/smoke_jerez_20260630_181903/_payloads.jsonl` (append; total del archivo = 5 líneas).
- Payload clave: `visit.visitDetails=[{coIncid:1, coType:86, coCause:213, txDescription:"Test-VIS-015-105405"}]`, `isVisited:true`, `idClient:3056`, `coEnterprise:"00001"`, `coordenada:"11.0487404,-63.8647803"`.

### Verificación BD (payload ↔ nube) — Agente BD (definitivo · cotejo campo-por-campo)

> `cotejo-payload.js` corrió el **flujo completo real** (cabecera `visit` + hija `incidence` vía headerLink por `id_visit`), NO fallback. Agente BD en background, completó y devolvió esta sección; anexada por el orquestador.

| id_visit | Marca | Campos cabecera | Hijas (incidence payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| 18 (co_visit 1782917691911.0) | **BD-FIELD-OK** | 21/21 OK | incidence 1/1 OK (linkeó por id_visit=18) | 0 | 3 diffs de hora por zona horaria — no son mismatch |

- **Conteo por marca:** BD-FIELD-OK = 1 · BD-FIELD-MISMATCH = 0 · BD-SAVED = 0 · BD-N/A = 0.
- **Campos cotejados: 24/24, 0 mismatches** — cabecera `visit` (21) + hija `incidence` (3).
- Verificaciones puntuales: id_visit=18 ✅ · co_type=86 ✅ · co_cause=213 ✅ · tx_description="Test-VIS-015-105405" ✅ · cliente V161051485 ✅.
- **headerLink correcto:** el payload trae `idVisit=null`; el servidor asignó id_visit=18 y la fila `incidence` referencia `id_visit=18` (linkeó por id_visit, NO por co_visit). Confirmado por query directa.
- **Notas (solo zona horaria):** 3 fechas (da_visit/da_initial/da_real) con offset UTC-4 local vs UTC nube → veredicto por día = OK. Sin campos payload-only ni renames → config `visitas` **validado en vivo**, sin ajuste de fieldMap/ignore.
- **Veredicto:** BD-FIELD-OK campo por campo, flujo completo (cabecera + incidencia headerLink). ✅

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| NUEVA VISITA se atasca tras Enviar (queda en `/visitas`, `shadowBtn.click`/`mouse.click`/PointerEvent no navegan) | universal (probable) | Tras volver de un Enviar a `/visitas`, el botón NUEVA VISITA deja de navegar. **Fix confiable: salir a HOME y reentrar a Visitas** (reset del componente `app-visitas`) → NUEVA VISITA vuelve a navegar. La navegación además puede tener **efecto diferido** (aparece en la llamada CDP siguiente). |
| Back `img.fechaAtras` en `/visita` y `/listaVisitas` — 1er click no engancha | universal (ya documentado, reconfirmado jerez) | El 1er `mouse.click` en coords reales (~31,46) a veces no dispara router; **reintento acotado (≤2)** engancha. Aplica igual al dirty-guard (el modal aparece en el 2º intento). |
| jerez: alert "coordenadas" al **seleccionar** DANIELA, NO al Guardar | cliente jerez | El alert "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" (`["","Agregar"]`, idx0=Cancelar) aparece al elegir el cliente en el modal; el Guardar posterior **no** volvió a pedirlo. Difiere de piercar (que lo pide en Guardar/Back). |
| jerez: 11 actividades, TODAS `requiredEvent=true` | cliente jerez (confirma YAML) | idTypes 2,47,71,75,82,83,84,85,86,87,88. EVENTOS (86) → Motivo único SUPERVISION DE EVENTOS (idMotive 213). Confirmado vs UI. |
| jerez: `st_visit=2` = Enviado en nube | cliente jerez | Igual que piercar; visitas usa tabla de estados propia (st=2 enviado), distinto del st=1 de otros transaccionales. |
| RUTA DE HOY: click en `ion-item` por texto puede referenciar botón stale de otra vista tras varias navegaciones | universal (cuidado) | Un `RUTA DE HOY`/`ion-item` query ejecutado cuando la vista activa no es `app-visitas` navegó accidentalmente a `/inventarios`. Verificar `getActiveView('app-visitas')` antes de disparar los botones home. |

## Hallazgos (FAIL)

Ninguno. 0 FAIL. El único defecto conocido relevante (DM-VIS-020: modal de confirmación de envío aparece antes de validar actividades — RUNTIME §5) no se re-marca; además la visita enviada **sí** llevó ≥1 actividad, por lo que no hubo envío sin actividades.

## Notas de cobertura

- DM-VIS-025/026 quedaron N/A por ausencia de datos (RUTA DE HOY sin visitas sincronizadas "No Visitado" hoy) — no es defecto, es ausencia estructural de dato de prueba, alineado con `jerez.yaml modules.visitas.smoke_na_estructural`.
- El resto de casos del set (001,003,004,006,010,014,015,019,020,021,022,023,031,032) → todos PASS.
