# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | VISITAS |
| Cliente | el_valle — EL VALLE (COVADONGA) |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A (`00001`, idEnterprise 1) |
| Servidor | **La Tortuga** — `denariolatortuga.ddns.net:8081/PremiumWS` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version=19 · **`window.ng=true`** |
| Vendedor | `001` (idUser 319) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues de CDP · 0 reconexiones · sin abort |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas` · título "Visitas" + los 3 botones (NUEVA VISITA · RUTA DE HOY · Ver mejor ruta) |
| DM-VIS-003 | ✅ PASS | `/visita` con `#clienteSelect` vacío y tabs ACTIVIDADES/ADJUNTOS `disabled=true` |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` (`app-lista-visita`) · `ion-searchbar` visible · lista vacía **sin error ni overlay colgado** |
| DM-VIS-006 | ✅ PASS | Trash → "¿Desea borrar la visita? Esta acción no se puede deshacer." (CANCELAR/Aceptar) → "Se eliminó la visita de manera exitosa" → la fila desaparece (3→2 ítems) |
| DM-VIS-010 | ✅ PASS | Cliente `ABASTOS Y CARNICERIA HERMANOS FLORES CA (J309901710)` fijado; Sucursal cargada (`idAddress 1787` "FISCAL", DIRECJ309901710); tabs ACTIVIDADES/ADJUNTOS habilitadas |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal.modalActividades` con Actividad (12 opciones), Motivo, Comentario y botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | Evento en Tab Actividades: "Actividad: COBRANZA · Evento: COBRANZA EFECTIVA · Observación: Test-VIS-015-QA-smoke-el-valle" |
| DM-VIS-019 | ✅ PASS | Alert "La visita se ha guardado" y el formulario **permanece abierto** en `/visita` |
| DM-VIS-020 | ✅ PASS | 2 alerts ("¿Desea enviar la visita?" CANCELAR/Aceptar → "Su Visita será enviada" OK) → navega a `/visitas` → **"Visita nro. 51 enviada exitosamente"**; en RUTA DE HOY queda **Ref 51 / Estatus: Visitado** (sin trash) |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal "¡Alerta!" con los 3 botones: Guardar y salir / Salir sin guardar / Cancelar |
| DM-VIS-022 | ✅ PASS | Visita **nueva nunca guardada** → "Salir sin guardar" → **no aparece** en RUTA DE HOY (conteo de Guardadas sin cambio) |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta desde la lista: `viewOnly=false`, 3 tabs habilitadas, Guardar/Enviar activos; conserva cliente y evento (**oráculo §9 OK**) |
| DM-VIS-025 | 🚫 N/A | No hay visitas "No Visitado" sincronizadas del backend para hoy: RUTA DE HOY arrancó **vacía** y la BD confirma `0` visitas con `da_visit::date = 2026-07-28 AND is_visited = false` |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (sin visita "No Visitado" no hay botón INICIAR VISITA que pulsar) |
| DM-VIS-031 | ✅ PASS | Visita con evento → Back → "Guardar y salir" → "La visita se ha guardado" → en RUTA DE HOY **Estatus: Guardado**; al reabrirla el Tab Actividades muestra "Actividad: COBRANZA · Evento: COBRANZA EFECTIVA · Observación: Test-VIS-031-guardar-y-salir" (**no se guardó sin actividades**) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos con los 3 acordeones: **Imágenes** (BUSCAR FOTO / TOMAR FOTO) · **Archivo** (Subir Archivo) · **Firma** (Borrar) — coherente con `showCamera=true`, `userCanUploadFiles=true`, `signatureVisit=true` |

### Sobre el defecto conocido DM-VIS-020 (RUNTIME §5)

Reconfirmado y **no re-marcado como FAIL**: el modal de confirmación de envío aparece antes de validar actividades, y la app permite **Enviar sin firma** pese a `signatureVisit=true` (4.ª playa consecutiva: piercar, dm-electronica, latino_cosmetica, el_valle). El payload enviado lleva `hasAttachments:"false"` / `nuAttachments:0`.

## Registros creados en sistema

| Ref | Detalle | Estado | BD |
|-----|---------|--------|-----|
| **51** | Visita `ABASTOS Y CARNICERIA HERMANOS FLORES CA` (J309901710) · COBRANZA / COBRANZA EFECTIVA · "Test-VIS-015-QA-smoke-el-valle" · coord `11.0490583,-63.8649814` | **Visitado / Enviado** | ✅ **BD-OK** |
| — (Ref 0) | Visita `ABASTOS Y CARNICERIA HERMANOS FLORES CA` · COBRANZA / COBRANZA EFECTIVA · "Test-VIS-031-guardar-y-salir" (DM-VIS-031) | Guardado (local, nunca enviada) | BD-SAVED (esperado) |
| — (Ref 0) | Visita duplicada local por artefacto de automatización (ver Hallazgos §1) | **borrada en DM-VIS-006** | — |

## Verificación BD (RUNTIME §10)

**Baseline** (antes del módulo): `visit` → `count=50`, `max(id_visit)=50`.
**Post-corrida**: `count=51`, `max(id_visit)=51` — **exactamente una fila nueva, sin duplicados en la nube**.

Fila nueva (`id_visit > 50`), cotejada campo a campo contra el payload capturado por el hook `nativePromise` (`POST .../visitservice/visit`):

| Campo | Payload (enviado) | Nube (guardado) | ✓ |
|-------|-------------------|-----------------|---|
| `id_visit` / Nro.Ref UI | — / **51** | `51` | ✅ **confirma Ref UI = `id_visit`** |
| `co_visit` | `1785277421480.0` | `1785277421480.0` | ✅ |
| `st_visit` | `1` (enviado desde el device) | `2` | ℹ Enviado — mismo mapeo que piercar/ferrenuestro. **No interpretado con el catálogo `statuses`** (corroborado por `id` + UI "Visitado") |
| `is_visited` | `true` | `true` | ✅ |
| `is_dispatched` | `false` | `false` | ✅ |
| `co_client` / `na_client` | `J309901710` / ABASTOS Y CARNICERIA HERMANOS FLORES CA | idem | ✅ |
| `coordenada` | `11.0490583,-63.8649814` | idem (`st_coordinate=4`) | ✅ |
| `da_visit` / `da_initial` / `da_real` | `18:21:04` / `18:21:05` / `18:25:11` | `22:21:04Z` / `22:21:05Z` / `22:25:11Z` | ✅ mismo instante (local UTC-4 vs nube UTC — nota, no mismatch) |
| `nu_sequence` | `1` | `1` | ✅ |
| `id_address_client` / `co_address_client` | `1787` / `DIRECJ309901710` | idem | ✅ |
| `has_attachments` / `nu_attachments` | `"false"` / `0` | `false` / `0` | ✅ |
| `co_user` / `co_enterprise` | `001` / `00001` | idem | ✅ |
| **incidencia** | `coIncid 1` · `coType 82` · `coCause 182` · `txDescription "Test-VIS-015-QA-smoke-el-valle"` | `co_incid 4` · `co_type 82` · `co_cause 182` · `tx_description` idéntico · `co_operation "I"` | ✅ 1 incidencia = 1 actividad cargada por UI (`co_incid` es PK propia del servidor, no correlativa) |

**Conclusión guardado→enviado: `BD-OK`.** Lo que se guardó se envió, íntegro y sin duplicar.

**Mitad LOCAL del oráculo: `BD-N/A`** — `sqlite3` no existe en el device (build La Tortuga v1.0), `local-query.js` falla siempre. Degradado al primer intento, sin reintentos (quirk confirmado). El cotejo fue por **nube + payload + UI**, que resultó suficiente.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Toda acción NO idempotente exige UN solo click real — `pmClick`/`clickTxt` (dispatch Pointer+Mouse **+** `mouse.click`) la ejecutan DOS veces** | universal *(hallazgo de automatización de esta corrida)* | El helper entrega click sintético y click real. Sobre navegación/tabs es inocuo (el 2.º click cae en el destino ya renderizado), pero sobre **Guardar** creó **dos visitas** de un solo "Guardar" del guión. **Regla: en Guardar / Enviar / Agregar / trash usar click real único** (`coords` + `pg.mouse.click`, sin dispatch previo). Probado: con click único, DM-VIS-031 produjo exactamente 1 registro |
| 🔴 **El `ion-modal` residual del selector de cliente mantiene las tabs `disabled` — `dismissModals` las destraba** | universal — extiende el quirk conocido a un síntoma nuevo | Tras `setClientfromSelector` el cliente y `direccionCliente` quedan bien fijados en el componente, pero los `ion-segment-button` siguen leyendo `disabled=true` mientras el `ion-modal.show-modal` residual está en el DOM. `modal.dismiss(null,'cancel')` + ~1 s → tabs habilitadas. **No marcar FAIL de DM-VIS-010 por el snapshot inmediato**: hay que descartar el modal antes de evaluar |
| ✅ **La lista de RUTA DE HOY SÍ navega por CDP con click real simple en `top+15`** | cliente (La Tortuga v1.0) — **contrasta con Inventarios** | `ion-item` de `/listaVisitas` abre el formulario con `mouse.click(centro_x, rect.top+15)`, sin dispatch. Relevante porque en el **mismo build** la lista BUSCAR de Inventarios quedó BLOCKED por no navegar: el gap es del handler de esa lista, no del patrón de click |
| **Cambio de tab por `ion-segment.value` + `ionChange`** | universal | Valores en Visitas: `default` (General) · `actividades` · `adjuntos`. Reconfirma el fallback documentado en Inventarios |
| **`img.fechaAtras`: 1 sola en `/visita`, 2 apiladas en `/listaVisitas`; el back real es siempre `imgs[0]` con `getBoundingClientRect`+`mouse.click(≈32,31)`** | cliente (La Tortuga v1.0) | Patrón ferrenuestro/insumar (no el `.click()` nativo de jerez). Enganchó el dirty-guard y la navegación en las 6 veces que se usó |
| **`window.__qaSrc` + `eval` como prelude de helpers** | universal | Prelude de ~10 KB guardado una vez en `window`; cada `browser_run_code_unsafe` arranca con 2 líneas (`connectOverCDP` + `eval(await pg.evaluate(()=>window.__qaSrc))`). Reconfirma el quirk y lo lleva a un módulo completo: **16 tool-uses de CDP para 16 casos** |
| **`installRecorder` resetea `window.__qaTrace`; para grabar a lo largo de varias llamadas hace falta un `mkRec(pg)` que NO resetee** | universal *(corrección al motor de traza)* | `replay-engine.installRecorder` hace `window.__qaTrace=[]`. Como el contexto Node muere en cada `browser_run_code_unsafe`, reinstalarlo por llamada **borra la traza acumulada**. Patrón: `installRecorder` **una sola vez** al inicio (que además cumple el requisito de resetear la traza contaminada por agentes previos) y `mkRec(pg)` en las llamadas siguientes |
| **Datos de VISITAS en el_valle** | cliente | **12 actividades, TODAS `requiredEvent="true"` / `requiredSignature="false"`** (2 NO VISITO, 47 MERCHANDISING, 71 NO COMPRO, 75 VISITA FUERA DE RUTA, 82 COBRANZA, 83 INFO DE CLIENTES, 84 COBRANZA NO EFECTIVA, 85 VENTA EN RUTA, 86 EVENTOS, 87 REUNION CON CLIENTE, 90 Cuestonario, 92 Cambio X Cambio — mismo set que ferrenuestro). `listaMotivos`=94. **COBRANZA (82) → 4 motivos**: COBRANZA EFECTIVA (182), COBRANZA PARCIAL, RETENCION, COBRANZA + RETENCION. El Motivo carga ~1,5–2 s después de fijar la Actividad |
| **Cliente `ABASTOS Y CARNICERIA HERMANOS FLORES CA` (J309901710) CON coordenadas** | cliente | `idAddress 1787` "FISCAL" → **NO dispara** el alert "Esta sucursal no tiene coordenadas asignadas" ni al seleccionar ni al Guardar/Enviar. `userMustActivateGPS=true` **no bloqueó** ninguna transacción; coordenada real capturada y persistida |
| **`signatureVisit=true` SÍ renderiza el acordeón Firma** | cliente | Contrasta con ferrenuestro/dm-electronica (`signatureVisit=false`, sin acordeón). Confirma el mapeo VG→DOM de la tabla del módulo |

## Hallazgos

**Sin FAIL.** Dos observaciones:

1. ⚠ **`guardar()` no es idempotente: dos eventos de click seguidos sobre una visita nueva crean DOS registros.** Detectado porque mi helper `pmClick` entregaba click sintético + click real sobre `.imagenGuardar` — de un solo "Guardar" del guión salieron **dos** visitas Guardadas idénticas (mismo cliente, misma fecha, ambas Ref 0). **La causa inmediata es el artefacto de automatización, no la app**, y por eso **no se marca FAIL** (RUNTIME §4). Pero el comportamiento subyacente es real y vale reportarlo a desarrollo: **la app no descarta el segundo evento de guardado de una visita aún no persistida**, así que un doble-tap del vendedor en campo produciría una visita duplicada. Ambas eran locales (`Ref 0`, nunca enviadas) y la nube quedó limpia (una sola fila, id 51); la duplicada se eliminó ejecutando DM-VIS-006 sobre ella. **Sugerencia: guard de reentrada / `disableSaveButton=true` mientras el guardado está en vuelo.**

2. ℹ **DM-VIS-025/026 N/A por dato, no por VG.** `visitRout=true` está activo, pero el backend no sincronizó visitas planificadas para 2026-07-28 (`0` filas con `is_visited=false` para hoy; las visitas no visitadas más recientes en la BD son del 2026-05-18). El flujo INICIAR VISITA queda sin cubrir en esta corrida — **para cubrirlo hace falta una corrida con ruta planificada cargada para el día**.

## Traza (QA_MODE=record)

**TRAZA: 101 ops · 14 casos grabados** → `_trace/visitas.trace.json` · `validateTrace()` = `[]` (estructuralmente válida).

Se descartaron los casos N/A (025/026). Curación aplicada y declarada en el propio `nota_cobertura` del archivo: (a) los clicks reales Node-side —no representables como op— se normalizaron al helper `clickSel` (click único); (b) el paso Guardar de DM-VIS-019, grabado en vivo como `pmClick`, se reemplazó por `clickSel` para no reproducir la duplicación; (c) el tipeo del comentario (S2v) se normalizó al helper `typeComment`; (d) los asserts de DM-VIS-022 y DM-VIS-006, grabados contra conteos absolutos contaminados por el registro duplicado, se reescribieron como **delta contra una línea base capturada dentro de la propia traza** (`window.__qaG` / `window.__qaG6`) — state-independent y equivalente a lo verificado en vivo. `data` lleva los 6 valores run-específicos (cliente, actividad, motivo y los 3 comentarios). Sin credenciales.
