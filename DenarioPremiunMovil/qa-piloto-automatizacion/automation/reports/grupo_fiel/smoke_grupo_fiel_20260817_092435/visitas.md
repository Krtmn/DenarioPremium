# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | VISITAS |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA), empresa única `00001` / id 1 |
| Dispositivo | Infinix HOT 60i (`Infinix X6728`) · UUID `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v**1.0** / db_version **19** |
| Playa | **El Yaque** — `denarioelyaque.ddns.net:8081` (leído del hook de payload, no de `localStorage`) |
| Vendedor | johana · `id_user` **463** · `co_user` **'003'** |
| `window.ng` | `true` · `window.sqlitePlugin` disponible |
| Cliente de prueba | MP GELATO C.A. — `J-504863246` (idClient 401, sucursal FISCAL `id_address_client` 67785) |
| Adjuntos | 🚫 **NINGUNO** — por instrucción expresa de QA (no se usó mock de cámara) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`, título "Visitas" + los 3 botones: NUEVA VISITA · RUTA DE HOY · Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | Form `/visita` con tabs ACTIVIDADES y ADJUNTOS `disabled=true`, `#clienteSelect` vacío, Guardar/Enviar `disabled=true` |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` (`app-lista-visita`) con `ion-searchbar` visible y 2 ítems del día (Refs 105 y 107); sin error ni overlay colgado |
| DM-VIS-006 | ✅ PASS | Trash de la fila Guardado → `[CANCELAR, Aceptar]` "¿Desea borrar la visita?…" → `[OK]` "Se eliminó la visita de manera exitosa". Lista 4→3 y la fila sale de `visits` local |
| DM-VIS-010 | ✅ PASS | Cliente `MP GELATO C.A. (J-504863246)` seteado; **las 3 tabs habilitan**; sucursal cargada (`listaDirecciones=1`, "CALLE 76 CON AVENIDA 3D…") |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal` abre con selector Actividad (11 opciones), selector Motivo, `ion-input` Comentario (`maxlength=255`) y botones CANCELAR / Agregar |
| DM-VIS-015 | ✅ PASS | Evento agregado al **1.er intento** (`b.shadowRoot.querySelector('button').click()`); lista Tab Actividades: `Actividad: MERCHANDISING Evento: VISIBILIDAD PDV` |
| DM-VIS-019 | ✅ PASS | Alert `Denario` / **"La visita se ha guardado"** `[OK]`; el formulario **permanece abierto** en `/visita`. `.imagenGuardar` pasa a `disabled=true` (anti-doble-guardado) |
| DM-VIS-020 | ✅ PASS | 3 alertas: `¿Desea enviar la visita?` `[CANCELAR, Aceptar]` → `Su Visita será enviada` `[OK]` → **`Visita nro. 111 enviada exitosamente`** `[OK]` → navega a `/visitas`; la visita figura **"Visitado"** en RUTA DE HOY |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal `¡Alerta!` con `[Guardar y salir, Salir sin guardar, Cancelar]` |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita **nueva nunca guardada** → **no persiste**. Triple evidencia: `visits`=2, `incidences`=2 y `sqlite_sequence(incidences).seq` **sin moverse (2→2)**; RUTA DE HOY sigue con 2 ítems |
| DM-VIS-023 | ✅ PASS | Fila "Nro Ref.: 0 · Estatus: Guardado" abre form **editable**, 3 tabs habilitadas, Guardar/Enviar activos. Oráculo §9 sin divergencias (ver abajo) |
| DM-VIS-025 | 🚫 N/A | **No hay visitas "No Visitado" para el vendedor 463.** Probado con 3 señales + nube (ver "Verificación BD") — es condición de dato, no defecto |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (no hay visita de ruta que iniciar) |
| DM-VIS-031 | ✅ PASS | Back con evento → `Guardar y salir` → `[OK]` "La visita se ha guardado" → sale a `/visitas`. En RUTA DE HOY: `Estatus: Guardado` **con** actividad; al reabrir, Tab Actividades muestra `MERCHANDISING / VISIBILIDAD PDV / Test-VIS-031-122000` |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS con los **3 acordeones**: `images` (Imágenes), `file` (Archivo ⇒ `userCanUploadFiles=true`), `sign` (Firma ⇒ `signatureVisit=true`) + `<canvas>` presente. **No se adjuntó nada** (instrucción QA) |

> ⚠ **DM-VIS-020 — defecto conocido no re-marcado FAIL** (RUNTIME §5): el modal de confirmación de envío aparece antes de validar actividades. No aplicó en esta corrida (la visita ya tenía 1 evento) y no se levantó como hallazgo.
>
> ⚠ **Sin firma no es defecto:** la visita se envió sin firmar con `signatureVisit=true`. Por aclaración de QA (2026-07-29) la VG *habilita* la firma, no la vuelve obligatoria — **no se levanta**.
>
> 🚫 **Adjuntos:** por instrucción expresa de QA no se adjuntó nada. Ningún caso del set exigía adjuntar (DM-VIS-032 solo verifica la presencia de los acordeones), así que **no hubo casos N/A por esta causa**. El payload confirma `hasAttachments:false` / `nuAttachments:0`.

---

## Registros creados en sistema

| Ref | epoch (`co_visit`) | Cliente | Actividad / Motivo | Descripción | Estado | Marca BD |
|-----|--------------------|---------|--------------------|-------------|--------|----------|
| **111** | `1786983196380.0` | MP GELATO C.A. (J-504863246) | MERCHANDISING (47) / VISIBILIDAD PDV (184) | `Test-VIS-019-121500` | **Enviado / Visitado** | **BD-OK** |
| — (0) | `1786983415322.0` | MP GELATO C.A. (J-504863246) | MERCHANDISING (47) / VISIBILIDAD PDV (184) | `Test-VIS-031-122000` | Guardada → **BORRADA** en DM-VIS-006 | BD-N/A (nunca se envió) |
| — | (sin `co_visit`) | MP GELATO C.A. | MERCHANDISING / VISIBILIDAD PDV | (comentario vacío) | Descartada con "Salir sin guardar" (DM-VIS-022) — **no persistió** | BD-N/A |

**Visitas Guardadas pendientes al cierre: NINGUNA.** Estado final local: 3 filas en `visits`, las 3 con `st_visit=2` (Enviado), `pending_transactions` vacía, `failed_transactions` = 0.

---

## Verificación BD

**Baselines (nube, filtrados por `id_user=463`):** inicio `count=2 / max(id_visit)=107`; re-tomado **inmediatamente antes de Enviar**: idéntico. Cierre: `count=3 / max=111`.

**Diff de cierre — toda fila nueva `id_visit>107`** (no solo la esperada):

| id_visit | id_user | co_user | Cliente | st_visit | is_visited | ¿Mía? |
|---|---|---|---|---|---|---|
| 108 | 474 | 005 | SPENCER EDUARDO ARGOTE ARBELAEZ | 3 | false | ❌ jgomez |
| 109 | 474 | 005 | JUAN YESI SHOP C.A | 3 | false | ❌ jgomez |
| 110 | 474 | 005 | MAPKET, C.A. | 2 | false | ❌ jgomez |
| **111** | **463** | **003** | **MP GELATO C.A.** | **2** | **true** | ✅ **mía** |

⇒ El otro usuario del tenant consumió los ids 108-110 mientras corría este módulo; **ninguno se atribuye a esta corrida**. Sin duplicados: `count(*)=3 = count(DISTINCT co_visit)=3`.

**Cotejo campo-a-campo de la Ref 111 (payload ↔ local ↔ nube) — 15/15 OK ⇒ `BD-OK`:**

| Campo | Local (`visits`) | Payload `visitservice/visit` | Nube (`visit`) |
|---|---|---|---|
| `co_visit` | `1786983196380.0` | `coVisit` idem | idem |
| `id_visit` | 111 | (null al enviar) | **111 = Nro.Ref de la UI** |
| `st_visit` | 2 | `stVisit:1` (en tránsito) | 2 |
| `is_visited` | true | `isVisited:true` | true |
| `id_user` / `co_user` | 463 / '003' | 463 / '003' | 463 / '003' |
| `na_client` / `co_client` | MP GELATO C.A. / J-504863246 | idem (`idClient:401`) | idem |
| `nu_sequence` | 1 | 1 | 1 |
| `da_visit` | `2026-08-17 12:12:22` | idem | `16:12:22Z` (= local UTC-4) ✅ |
| `coordenada` | `11.0490123,-63.8649878` | idem | idem |
| `id_address_client` | 67785 | 67785 (`DIRECJ-504863246`) | 67785 |
| `nu_attachments` / `has_attachments` | 0 / false | 0 / false | 0 / false |
| `id_enterprise` / `co_enterprise` | — | 1 / `00001` | 1 / `00001` |
| incidencia | `incidences` co_incidence 3 | `visitDetails[0]` coType 47, coCause 184 | `incidence` co_incid 109, co_type 47, co_cause 184 |
| `tx_description` | `Test-VIS-019-121500` | idem | idem |

**Guardado → enviado:** ✅ confirmado. Tras Guardar (DM-VIS-019) la fila quedó `id_visit=0 / st_visit=0` y **fuera** de `pending_transactions` ⇒ `BD-SAVED` esperado. Tras Enviar pasó a `id_visit=111 / st_visit=2 / is_visited=true`, cola vacía, `failed_transactions=0` y la fila apareció en la nube en la **primera ventana de poll (~10 s)** ⇒ **sync INMEDIATA** en VISITAS de El Yaque/grupo_fiel.

**N/A estructural de DM-VIS-025/026 — probado, no supuesto (4 señales):**
1. `comp.listaVisitas.length` = 2 (solo Visitado).
2. Tabla local `visits`: 2 filas, ambas `st_visit=2`; **ninguna `st_visit=3`** (fila de ruta bajada del backend).
3. UI: ningún ítem en rojo / "No Visitado"; 0 botones INICIAR VISITA.
4. **Nube:** las visitas de ruta de hoy (`st_visit=3`, `is_visited=false`, ids 108/109) existen pero están asignadas a **`id_user=474` (jgomez)**, no a 463.

⇒ **`visitRout=true` SÍ trae datos** (la lista no vino vacía), pero el vendedor 463 no tiene ruta planificada hoy: es reparto de datos entre vendedores, **no un defecto**.

**Veredicto `requiredComment` en VISITAS: NO APLICA.** Probado empíricamente: se pulsó `Agregar` con el campo Comentario **vacío** y el evento se agregó sin alert ni bloqueo (`listaEventos` 0→1, `comentario:""`), y la visita quedó Guardable/Enviable. ⇒ Se cierra el mapa de la corrida: **`requiredComment` aplica SOLO a COBROS** (no a devoluciones, inventarios, depósitos **ni visitas**).

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **3.ª confirmación: `Agregar` de `ion-modal#eventModal` sólo con `shadowRoot`** | universal | `b.shadowRoot.querySelector('button').click()` funcionó al **1.er intento** en las 3 visitas creadas. Ya son 3 servidores (Isla Coche / El Yaque el_palmar-difranca-grupo_fiel) ⇒ **listo para graduar a helper**. |
| **VISITAS es el módulo donde TODOS los `ion-select` abren `ion-popover` (1 click)** | universal (5.ª evidencia de "la variante la fija el control") | Actividad (11 opciones) y Motivo (5 opciones) abrieron `ion-popover` con `ion-item`+`ion-radio`, **1 click**, sin un solo `ion-alert` de radios — en la misma corrida en que pedidos/cobros/devoluciones sí abrían alert con `Cancel`/`OK`. Refuerza: probar popover primero, y si da `[]`, leer el alert activo. |
| **`textCommentMaxLength` SÍ está expuesto en `app-visita` de El Yaque v1.0 y vale 255** | cliente/build | Contradice `[difranca-20260807]` (mismo servidor El Yaque, misma v1.0/db19, donde **no** estaba expuesto y el `maxlength` era **120**). El `ion-input` del modal rotula `maxlength="255"`, coherente con el componente. ⇒ **el tope NO es estable ni dentro del mismo servidor y build: leer AMBOS (`comp.textCommentMaxLength` y el atributo `maxlength`) y no memorizar el valor.** |
| **`sqlite_sequence` NO tiene fila para `visits`** (sí para `incidences`) | universal | Acota el oráculo: la prueba negativa / idempotencia por `seq` en VISITAS hay que hacerla sobre **`incidences`**, no sobre `visits`. Funcionó perfecto para DM-VIS-022 (`seq` 2→2 = ningún insert). |
| **El `ion-select` de EMPRESA de VISITAS llega `disabled=true` con 1 sola empresa** | cliente (nº de empresas) | Sin `formcontrolname`, `value` = **objeto** completo, shadowRoot rotula `GRUPO FIEL, S.A. (GR`. Contrasta con el_palmar/difranca (2-3 empresas), donde llegaba `disabled=false`. ⇒ el predictor del `disabled` es el **nº de empresas**, igual que ya se cerró en CLIENTES; la variante "sin `formcontrolname` + objeto + fuera de la validación" se mantiene (**5.ª confirmación**). |
| **Alert de coordenadas: dispara al SELECCIONAR y al REABRIR, NO antes del dirty-guard** | universal (3.ª confirmación) | `["", "Agregar"]` con idx0 de `textContent` **vacío** = Cancelar ⇒ resolver **por índice**. En el Back el dirty-guard salió **directo**. No bloquea Guardar/Enviar. Alinea el_palmar/difranca; contrasta piercar/dm-electronica. |
| **Reparto de etiquetas de alert (grupo_fiel/VISITAS)** | cliente | Guardado `[OK]` (título `Denario`) · Envío `[CANCELAR, Aceptar]` → `[OK]` → `[OK]` (títulos `¡Alerta!` / `Denario Visitas` / `Denario Premium`) · Borrado `[CANCELAR, Aceptar]` (título `Denario - Visita`) + `[OK]` · Dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]` · Coordenadas `["", "Agregar"]`. **Los ~14 alerts del módulo se resolvieron sin un solo reintento** recorriendo `['Aceptar','OK','Eliminar']` por igualdad exacta + `width>0`. |
| **Envío = 3 alertas con la Ref en la 3.ª — 5.ª confirmación** | universal | `Visita nro. 111 enviada exitosamente` ⇒ la Ref del servidor se lee del texto, sin ir a BD. |
| **`.imagenGuardar` → `disabled=true` tras guardar** | universal (2.ª confirmación) | Protección anti-doble-guardado; vuelve a habilitarse al reabrir el registro. Reconfirma `[difranca-20260807]`. |
| **Dirty-guard reaparece en visita YA Guardada tras navegar entre tabs** | universal | Reabrir la visita Guardada y cambiar de tab la deja `dirty`: el Back vuelve a mostrar `[Guardar y salir, Salir sin guardar, Cancelar]`. Elegir "Salir sin guardar" **mantiene** la visita Guardada (comportamiento correcto, NO FAIL). Alinea `[gmp-2611]`. |
| **Namespace `__qaVIS`** | universal | Se registró namespace propio de 3 letras y se **consumió el hook de payload heredado** (`window.__qaPayloadsData`, 181 entradas al inicio) sin reinstalarlo ⇒ payload capturado **1 sola vez y CON body**, 0 duplicados. ⚠ El `__qaH` heredado de esta corrida **no expone `getPayloadData()`**: hay que leer `window.__qaPayloadsData` directo. |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos

Sin FAIL. Dos observaciones informativas:

1. **⚠ Incidencia HUÉRFANA tras borrar una visita Guardada — 2.ª confirmación** (antes solo `[gmp-20260730]`, La Tortuga; ahora El Yaque). Al borrar la visita `co_visit=1786983415322.0` (DM-VIS-006) la fila salió de `visits` (UI y tabla OK) pero **su incidencia sobrevivió** en `incidences` (`co_incidence=4`). Chequeo:
   `SELECT i.co_visit FROM incidences i WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit=i.co_visit)` → devuelve la huérfana.
   Sin impacto en esta corrida (la visita nunca llegó al servidor, colas en 0), pero es **basura acumulativa en la BD local** y ya está reproducido en 2 servidores ⇒ candidato a defecto formal.

2. **ⓘ Catálogo de actividades: la UI trae 11 activas, no 5.** El contexto de la corrida anticipaba 5 (`COBRANZA · MERCHANDISING · VENTA EN RUTA · NO COMPRO · NO VISITO`); el `ion-select` del modal lista **11**: NO VISITO, MERCHANDISING, NO COMPRO, VISITA FUERA DE RUTA, COBRANZA, INFO DE CLIENTES, COBRANZA NO EFECTIVA, VENTA EN RUTA, EVENTOS, REUNION CON CLIENTE, VISITA SIN ACCION. Es el mismo set de 11 de jerez/ferrenuestro/dm-electronica/latino_cosmetica en El Yaque. MERCHANDISING (47) trae 5 motivos (ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, VISIBILIDAD PDV 184, PLAN SLIP, MUESTRA NUEVO CATALOGO). No es defecto — solo corrige el dato del perfil.

3. **ⓘ Fecha de la visita se muestra +4 h al reabrir** (guardada `12:12:22`, el modelo devuelve `2026-08-17T16:12:22`). Defecto cosmético de TZ ya documentado `[gmp-20260730]`; el dato **no se corrompe** (el payload salió con la hora local correcta y la nube guardó `16:12:22Z` = 12:12:22 local). **No se marca FAIL de round-trip** (RUNTIME §10.b).

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786983196380.0` (Ref 111) | **BD-FIELD-OK** | **21/21 OK** | `incidence` 1/1 (3/3 campos) | **0** | 3 (zona horaria en `da_visit`, `da_initial`, `da_real`) |

**Cabecera — 21/21:**

| Campo | Payload | Nube | |
|---|---|---|---|
| `co_visit` | 1786983196380.0 | 1786983196380.0 | ✅ |
| `da_visit` | 2026-08-17 12:12:22 | 2026-08-17T16:12:22.000Z | ✅ *(nota TZ)* |
| `coordenada` | 11.0490123,-63.8649878 | 11.0490123,-63.8649878 | ✅ |
| `id_client` / `co_client` | 401 / J-504863246 | 401 / J-504863246 | ✅ |
| `na_client` | MP GELATO C.A. | MP GELATO C.A. | ✅ |
| `nu_sequence` | 1 | 1 | ✅ |
| `id_user` / `co_user` | 463 / 003 | 463 / 003 | ✅ |
| `co_enterprise` / `id_enterprise` | 00001 / 1 | 00001 / 1 | ✅ |
| `da_initial` | 2026-08-17 12:12:22 | 2026-08-17T16:12:22.000Z | ✅ *(nota TZ)* |
| `da_real` | 2026-08-17 12:14:50 | 2026-08-17T16:14:50.000Z | ✅ *(nota TZ)* |
| `id_address_client` / `co_address_client` | 67785 / DIRECJ-504863246 | idem | ✅ |
| `coordenada_saved` · `has_attachments` · `nu_attachments` | false · false · 0 | idem | ✅ |
| `is_reassigned` · `is_dispatched` · `is_visited` | false · false · **true** | idem | ✅ |

**Hija `incidence` (unida por `id_visit`, headerLink) — 3/3:**
`co_type` 47 · `co_cause` 184 · `tx_description` `Test-VIS-019-121500` — todos coinciden.

### Notas de calibración

- Campos payload-only correctamente ignorados por el motor (server-generated / UI-only): `idVisit` (null en el
  payload), `stVisit`, `isReassigned`/`txReassignedMotive`/`daReassign`/`noDispatchedMotive` (null, no aplicó
  reasignación), `transactionDeviceAuth.*` (metadata del dispositivo, no persiste en `visit`).
- ⚠ **La clave de unión de `incidence` es `["co_type","co_cause"]`, que NO es una PK real.** Acá funcionó sin
  ambigüedad porque la visita tuvo una sola incidencia. **Riesgo latente:** si una visita registrara **dos
  incidencias con el mismo par tipo+motivo** (mismo `co_type`+`co_cause`, distinto texto), el emparejamiento
  sería ambiguo y produciría un mismatch falso — **exactamente el mismo patrón que se corrigió hoy en
  `client_stock_detail_unit` / `order_detail_unit`**. Sugerencia: desempatar por `id_incidence`/timestamp si
  existe, o por índice de línea. **No bloqueante hoy**; queda anotado para cuando aparezca el caso.
- Las otras 2 visitas de la corrida (la Guardada-y-borrada `1786983415322.0` y la descartada con "Salir sin
  guardar") **no generaron POST** ⇒ su ausencia en `_payloads.jsonl` y en la nube es **esperada**, no se cotejan.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.

> Coincide 1:1 con el cotejo manual 15/15 del agente UI: dos métodos independientes, mismo veredicto.
