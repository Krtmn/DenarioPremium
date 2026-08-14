# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | VISITAS |
| Cliente | globalmp — COMERCIALIZADORA GLOBAL M&P (00002) |
| Dispositivo | Infinix X6728 (Infinix HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — appVersion **1.0** · db_version **19** |
| Playa | la_tortuga (`denariolatortuga.ddns.net:8081/PremiumWS`) |
| Usuario | **YC01** YUSNEIDI CLEMENTE (id_user 307) |
| `window.ng` | **true** |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=2.700.000` · 0 TIMEOUT · 0 CDP-DOWN · 0 ABORT |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas` (`app-visitas`) con los 3 botones: NUEVA VISITA · RUTA DE HOY · Ver mejor ruta |
| DM-VIS-003 | ✅ PASS | `/visita`: tabs ACTIVIDADES y ADJUNTOS `disabled`, `#clienteSelect` vacío, empresa **00002** ya preseleccionada |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` (`app-lista-visita`) con `ion-searchbar`; 19 ítems, sin overlay colgado, sin error |
| DM-VIS-006 | ✅ PASS | Trash → "¿Desea borrar la visita? Esta acción no se puede deshacer." (CANCELAR/Aceptar) → "Se eliminó la visita de manera exitosa"; desaparece de la lista y de `visits` (21→20). ⚠ ver Hallazgo H2 |
| DM-VIS-010 | ✅ PASS | Cliente `ABASTO EL SITIO DSG, C.A. (AS04)`; sucursal cargada (CTRA PETARE SANTA LUCIA KM 9…); las 3 tabs pasan a habilitadas; **sin** alert de coordenadas (sucursal 58400 con coords) |
| DM-VIS-014 | ✅ PASS | `ion-modal.modalActividades`: select Actividad (12 opciones), select Motivo, input Comentario, botones CANCELAR/Agregar |
| DM-VIS-015 | ✅ PASS | MERCHANDISING (idType 47) → Motivo VISIBILIDAD PDV (idMotive 184) → comentario → Agregar ⇒ `Actividad: MERCHANDISING Evento: VISIBILIDAD PDV Observación: Test-VIS-015-115200` en Tab Actividades |
| DM-VIS-019 | ✅ PASS | Alert `Denario` / "La visita se ha guardado" (botón **OK**); el formulario permanece abierto en `/visita` |
| DM-VIS-020 | ✅ PASS | 3 alertas: "¿Desea enviar la visita?" (CANCELAR/Aceptar) → "Su Visita será enviada" (OK) → **"Visita nro. 574864 enviada exitosamente"**; navega a `/visitas`; la visita figura **Visitado** en RUTA DE HOY |
| DM-VIS-021 | ✅ PASS | Atrás con cambios sin guardar ⇒ modal `¡Alerta!` con **[Guardar y salir · Salir sin guardar · Cancelar]** |
| DM-VIS-022 | ✅ PASS | Visita **nueva nunca guardada** (AS04 + evento ENTREGA DE MUESTRAS) → "Salir sin guardar" ⇒ NO aparece en RUTA DE HOY y NO se escribió en `visits` (20 filas antes y después) |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta desde la lista: formulario **editable** (`readonly=false`), 3 tabs habilitadas, `.imagenGuardar`/`.imagenEnviar` activos, evento presente. ⚠ ver Hallazgo H1 |
| DM-VIS-025 | ✅ PASS | **NO es N/A** — la ruta de hoy trajo **19 visitas "No Visitado"**. Abierta Nro Ref 66283 (AUTOMERCADO SAN LORENZO C. A. / ALS01): botón **INICIAR VISITA** visible y las 3 tabs `disabled` |
| DM-VIS-026 | ✅ PASS | Un solo click en INICIAR VISITA ⇒ las 3 tabs se habilitan y el segment salta a **`actividades`**; sin bloqueo por GPS (`userMustActivateGPS` no interfiere) |
| DM-VIS-031 | ✅ PASS | Con ≥1 evento → atrás → "Guardar y salir" ⇒ "La visita se ha guardado" + sale a `/visitas`; en RUTA DE HOY aparece `Estatus: Guardado` **con** su evento (BD local: `incidences` co_type 47 / co_cause 191 / comentario) |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS con los 3 acordeones y los 3 **abren**: `images` (BUSCAR FOTO / TOMAR FOTO) · `file` "Subir Archivo" (`userCanUploadFiles=true`) · `sign` "Firma" con `<canvas>` + Borrar (`signatureVisit=true`) |

---

## Registros creados en sistema

| Ref (servidor) | Módulo | Detalle | Estado final |
|-----|---------|---------|--------|
| **574864** | Visitas | Cliente **AS04** ABASTO EL SITIO DSG, C.A. · empresa 00002 · 1 actividad (MERCHANDISING 47 / VISIBILIDAD PDV 184 / `Test-VIS-015-115200`) · coordenada `11.0490586,-63.8649815` · sin adjuntos | **Enviado / Visitado** (`st_visit=2`, `is_visited=true`) |
| — (Ref 0) | Visitas | Cliente **CB10** BIG BANG IMPORT, C.A · 1 actividad (MERCHANDISING 47 / PLAN SLIP 191 / `Test-VIS-031-115800`) | Guardada en DM-VIS-031 → **BORRADA** en DM-VIS-006 (caso de borrado) |
| — | Visitas | Cliente **AS04** · 1 actividad (ENTREGA DE MUESTRAS 153) | **Descartada** a propósito en DM-VIS-022 ("Salir sin guardar") — nunca persistió |

**Visitas Guardadas pendientes al cierre del módulo: NINGUNA.** El módulo cierra con 1 visita enviada (574864) y la ruta del día intacta (19 "No Visitado", incluida la 66283 que se abrió/inició pero se abandonó con "Salir sin guardar" — quedó `st_visit=3`, `is_visited=null`, `da_initial=null`).

⚠ **No se adjuntó nada y no se tocó la cámara ni la firma** (regla de adjuntos de la corrida). El envío de la visita 574864 **procedió sin firma** pese a `signatureVisit=true` — esto **NO es defecto** (la VG habilita, no obliga; ya descartado como falso positivo).

---

## Verificación BD

**Oráculo:** BD **nube** (`global_mp`) sin GRANT ⇒ `query.js` no se usó ⇒ marca **BD-N/A** para la nube. Se usó la **BD LOCAL del device por CDP** (`window.sqlitePlugin`, base `denarioPremium`) + el **payload real** capturado del POST. La llegada a la nube la debe confirmar la capa web con la Ref **574864**.

**Baseline del módulo:** `visits`=19 (todas de ruta, `st_visit=3`) · `incidences`=0 · `pending_transactions`=0 · `failed_transactions`=0.

| Registro | Marca | Local (`visits`) | Cola | Conclusión guardado→enviado |
|---|---|---|---|---|
| Visita **574864** (`co_visit 1785426795128.0`) | **BD-OK (local)** · BD-N/A (nube) | `id_visit=574864` · `st_visit=2` · `is_visited='true'` · `nu_attachments=0` · 1 fila en `incidences` (co_type 47, co_cause 184, `Test-VIS-015-115200`) | `pending_transactions=0` · `failed_transactions=0` | ✅ Lo guardado se envió: el POST `visitservice/visit` salió con `stVisit:1`/`isVisited:true` y el servidor devolvió el id **574864**, que quedó escrito en local. Sin duplicados (**20 filas / 20 `co_visit` distintos**) |
| Visita CB10 (`co_visit 1785427043328.0`) | **BD-SAVED** → borrada | `id_visit=0` · `st_visit=0` · `is_visited='false'` + 1 incidencia | 0 / 0 | ✅ Esperado: se guardó sin intentar enviar y luego se borró por DM-VIS-006 |
| Visita descartada (DM-VIS-022) | — | **No existe fila** | 0 / 0 | ✅ Correcto: "Salir sin guardar" sobre visita nueva no persiste nada |

**Payload capturado** (`visitservice/visit`, 1 POST, volcado a `_payloads.jsonl`): cabecera con `idClient:742`, `coClient:"AS04"`, `coEnterprise:"00002"`, `idEnterprise:2`, `idUser:307`, `coUser:"YC01"`, `idAddressClient:58400`, `coordenada:"11.0490586,-63.8649815"`, `isVisited:true`, `hasAttachments:"false"`, `nuAttachments:0`; `visitDetails[0]` = `{coIncid:1, coType:47, coCause:184, txDescription:"Test-VIS-015-115200"}`. **Cotejo payload ↔ UI: 100% coincidente** con lo cargado (cliente, empresa, actividad, motivo, comentario, sucursal).

**Montos:** VISITAS **no maneja importes** — no se inventa oráculo de conversión. Los únicos números vistos son los saldos informativos del selector de clientes, y **cuadran con la tasa 737,88**: AS04 `2.096,23 USD × 737,88 = 1.546.766,19 BS` ✅ · CB10 `458,55 USD × 737,88 = 338.354,87 BS` ✅ (sin defecto de conversión en este módulo).

**Re-guardado (oráculo §9):** reabrir la visita Guardada y volver a Guardar **no corrompe** el dato — `da_visit` siguió `2026-07-30 11:56:04` y no se duplicó la fila (21/21 `co_visit` distintos).

---

## Hallazgos

### H1 — "Fecha de la Visita" se muestra +4 h al REABRIR (se pinta la hora UTC como si fuera local) · severidad **baja (cosmético)** · NO tumba el caso

- **Qué pasa:** al crear la visita, el formulario muestra la hora local correcta (`30/7/2026, 11:51 a. m.`). Al **reabrir** esa misma visita desde RUTA DE HOY, muestra **`30/7/2026, 3:56 p. m.`** para un registro cuyo `da_visit` en BD local es **`2026-07-30 11:56:04`**. El modelo Angular tras la reapertura trae `fecha = "2026-07-30T15:56:04"`. El device está en **GMT-0400 (hora de Venezuela)** ⇒ desfase exacto de **+4 h**, con los segundos idénticos (`:04`) — no es "la hora actual", es el mismo timestamp reinterpretado.
- **Segunda evidencia independiente:** las visitas de ruta bajadas del backend guardan `da_visit = "2026-07-30T16:00:00.000+00:00"` (= 12:00 p. m. local) y la UI las muestra como **`4:00 p. m.`**. Mismo patrón: se renderiza el reloj UTC.
- **Alcance acotado (importante):** el dato **NO se corrompe**. `da_visit` en BD local se mantiene en 11:56:04 incluso después de volver a Guardar desde el formulario reabierto, y el payload enviado al servidor lleva la hora local correcta (`daVisit:"2026-07-30 11:51:05"`). Es un defecto **de presentación**.
- **Por qué se reporta como hallazgo y no como FAIL:** RUNTIME §10.b fija que las diferencias de **hora** por zona horaria (local UTC-4 vs UTC) se reportan como **nota, no como mismatch**. Los criterios propios de DM-VIS-023 (editable · 3 tabs · guardar/enviar activos) se cumplen. **Queda a criterio de QA reclasificarlo** — es visible al usuario final: una visita de mediodía se le muestra como de las 4 de la tarde.
- **Reproducción manual (~2 min):** Visitas → NUEVA VISITA → elegir cliente → anotar la hora que muestra "Fecha de la Visita" → agregar actividad → Guardar → atrás → RUTA DE HOY → abrir esa visita → comparar la hora mostrada (aparece +4 h).

### H2 — Borrar una visita Guardada deja su incidencia HUÉRFANA en la BD local · severidad **baja** · fuga de datos local

- **Qué pasa:** DM-VIS-006 borra la visita de `visits` correctamente (desaparece de la UI y de la tabla), **pero su fila en `incidences` sobrevive**. Verificado con: `SELECT i.co_visit FROM incidences i WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit=i.co_visit)` ⇒ devuelve `1785427043328.0` (la visita borrada). Al cierre del módulo: `visits`=20 pero `incidences`=2, de las cuales **1 no tiene visita dueña**.
- **Impacto:** en esta corrida no hubo consecuencia visible — la visita nunca llegó al servidor (`id_visit=0`), las colas quedaron en 0 y no se re-envió nada. El riesgo es acumulativo: basura que crece en la BD local del vendedor y que podría contarse o re-enviarse en un flujo futuro.
- **Reproducción manual (~3 min):** crear visita → agregar 1 actividad → Guardar → RUTA DE HOY → borrar con el trash → Aceptar. La visita desaparece; su incidencia queda en `incidences`.

> Nota: **DM-VIS-020 no se re-marca** — el defecto conocido "modal de confirmación de envío aparece antes de validar actividades" (RUNTIME §5) se observó igual y sigue siendo UX, no bloqueante.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Envío de visita = **3 alertas** en La Tortuga v1.0, y la 3ª **trae la Ref** | universal (build) | "¿Desea enviar la visita?" (CANCELAR/Aceptar) → "Su Visita será enviada" (OK) → **"Visita nro. `<Ref>` enviada exitosamente"** (OK). Contrasta con las **2** alertas documentadas en insumar/don-theo. **La Ref del servidor se lee del texto de la 3ª alerta** — no hace falta ir a la BD para obtenerla |
| Tab ADJUNTOS: navegación y apertura de acordeones **por `value`** | universal | Tab: `ion-segment.value='adjuntos'` + `ionChange`. Acordeones: `ion-accordion` con `value` = **`images` · `file` · `sign`**; abrir con `ion-accordion-group.value=<v>` + `ionChange` (NO por coords). El de Firma contiene un `<canvas>` — verificable sin dibujar |
| Selector Actividad/Motivo: asignar `.value` = **objeto de la opción** + `ionChange` | universal | Reconfirma `[ferrenuestro-20260723]`. Actividad = `{idType,naType,requiredEvent,requiredSignature}`; Motivo = `{idType,idMotive,naMotive}`. El Motivo carga sus `ion-select-option` **~2-2,5 s después** de asignar la Actividad — leerlas antes devuelve `nOpts:0` |
| Modal cliente: el filtro **NO** es realtime — hay que pulsar el ícono de lupa | globalmp (refina `[gmp-2606]`) | Escribir en `input.search-input` no filtra; `mouse.click` en `ion-modal.show-modal ion-icon[name="search-circle-sharp"]` sí. Luego seleccionar con click al **centro vertical del `<p>` del nombre** (reconfirma `[gmp-2611]`) |
| Lista `/listaVisitas`: filtrar con `ion-searchbar` antes de clickear un ítem | universal | Con 19-21 ítems el objetivo cae **bajo el fold**; escribir en el searchbar lo sube al viewport. Click en `rect.left+60, rect.top+15` (NO el centro del ítem). Aplica el quirk global "un rect válido no implica un punto clickeable" |
| Alert de coordenadas: botón **idx 0 con texto VACÍO** = Cancelar | universal | `["", "Agregar"]` — resolver por **índice**, no por texto (no hay etiqueta que matchear). Dispara al abrir una visita de ruta cuya sucursal no tiene coords; no bloquea INICIAR VISITA |
| `img.fechaAtras`: **1 sola** instancia visible en `/visita` y `/listaVisitas` | globalmp | `getBoundingClientRect()+mouse.click(≈32,31)` engancha (patrón ferrenuestro/insumar, NO el `.click()` nativo de jerez). El filtro por `width>0` sigue siendo obligatorio |
| BD local: la tabla de incidencias es **`incidences`** (plural) y su PK es **`co_incidence`** | universal (build v1.0) | Corrige el smoke, que documenta `incidence` / `incidence.co_incid`. FK real: `incidences.co_visit → visits.co_visit` (y `id_visit`, que vale **0** mientras no se envía) |
| `st_visit` en La Tortuga v1.0: **0**=Guardado · **2**=Enviado · **3**=de ruta/no visitada | globalmp | Amplía `[prc-2606]` (que solo documentaba `st_visit=2`=Enviado). ⚠ el `st_visit=3` de las filas bajadas del backend **no** significa "guardado local"; el discriminador de guardado-local es `id_visit=0` |

---

## Notas de datos (globalmp)

- 🔴 **Corrección de perfil confirmada en campo:** el `cliente_test` del YAML (**BIG MARKET 22, C.A / BM17**) ya no está sincronizado. Se usaron **AS04** (ABASTO EL SITIO DSG, C.A., idClient 742, sucursal DIRECAS04/58400 **con** coordenadas) y **CB10** (BIG BANG IMPORT, C.A). Ambos operan sin fricción.
- **12 actividades, todas `requiredEvent="true"`** (reconfirma `[gmp-2611]`). MERCHANDISING (47) → 5 motivos: ENTREGA DE MUESTRAS · LEVANTAMIENTO DATA ISSY · **VISIBILIDAD PDV (184)** · **PLAN SLIP (191)** · MUESTRA NUEVO CATALOGO.
- **`smoke_na_estructural` para DM-VIS-025/026: vacío y CONFIRMADO con dato vivo** — la RUTA DE HOY del 2026-07-30 trajo **19 visitas "No Visitado"**. Se verificó el **rango completo** de la lista (no solo la primera fila) antes de decidir.
- `userMustActivateGPS` no bloqueó ninguna operación; la coordenada real se capturó (`11.0490586,-63.8649815`).
- Empresa **00002** viene **preseleccionada** en el formulario de visita — no hubo que elegirla.
