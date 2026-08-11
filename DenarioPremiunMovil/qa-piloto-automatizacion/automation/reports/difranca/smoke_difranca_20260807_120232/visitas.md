# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | VISITAS |
| Dispositivo | 14678405BR003855 (Infinix HOT 60i · X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db 19 · `window.ng=true` · `sqlitePlugin` OK |
| Playa | EL YAQUE (`denarioelyaque.ddns.net:8081`) |
| Cliente QA | difranca · empresa **DDHP_A12 / id_enterprise 2** |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`, título "Visitas" + los 3 botones (NUEVA VISITA · RUTA DE HOY · Ver mejor ruta); 0 loadings colgados |
| DM-VIS-003 | ✅ PASS | `/visita` con ACTIVIDADES/ADJUNTOS `disabled=true`, GENERAL habilitada, cliente vacío, Guardar/Enviar `disabled=true` |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` (`app-lista-visita`), searchbar visible, lista vacía **sin error** ("No hay resultados"). 3 señales concordantes (ver BD) |
| DM-VIS-006 | ✅ PASS | Trash en fila Guardado → `[CANCELAR, Aceptar]` → "Se eliminó la visita de manera exitosa" `[OK]`; desaparece de lista (2→1) y de `visits` local (2→1) |
| DM-VIS-010 | ✅ PASS | CAR755 seleccionado → ACTIVIDADES y ADJUNTOS `disabled=false`; sucursal FISCAL cargada (`idAddress 54331`) |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal` con selector Actividad (4 opts), selector Motivo, Comentario y `[CANCELAR, Agregar]` |
| DM-VIS-015 | ✅ PASS | Evento en lista Tab Actividades: "Actividad: VENTA - REVENTA · Evento: EFECTIVA · Observación: Test-VIS-015…"; Guardar/Enviar habilitan en el mismo tick |
| DM-VIS-019 | ✅ PASS | Alert `Denario` / "La visita se ha guardado" `[OK]`; **el formulario permanece abierto** |
| DM-VIS-020 | ✅ PASS | 3 alertas → **"Visita nro. 28223 enviada exitosamente"**; navega a `/visitas`; queda "Visitado". Exigió ≥1 actividad (no permitió enviar vacía) |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal `[Guardar y salir · Salir sin guardar · Cancelar]` |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita **nueva nunca guardada** → no aparece en RUTA DE HOY y `visits` local queda en 1 (no persistió) |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta: formulario **editable**, 3 tabs habilitadas, Guardar/Enviar activos, cliente conservado |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" sincronizadas desde backend (`visitRout=false`). **Probado, no supuesto** — 3 señales (ver BD) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 — no hay visita de ruta que iniciar |
| DM-VIS-031 | ✅ PASS | Tras reabrir desde RUTA DE HOY: Estatus **Guardado** **con** su evento en Tab Actividades (nunca se guardó sin actividades) |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones **Imágenes** (`images`) + **Archivo** (`file`). Sin acordeón Firma y `canvas=0` — coherente con `signatureVisit=false` |

---

## Registros creados en sistema

| Ref | Detalle | Empresa efectiva | Estado |
|-----|---------|------------------|--------|
| **28223** | CAR755 MULTIDISTRIBUIDORA JAKE, C.A · VENTA - REVENTA / EFECTIVA · epoch `1786126557073.0` | **DDHP_A12 / id 2** | **Enviado** (`st_visit=2`, `is_visited=true`) · BD-OK |
| — (borrada) | CAR755 · PROSPECTOS / PROCESO DE DOCUMENTACION · epoch `1786126909113.0` | DDHP_A12 / id 2 | Creada Guardada y **eliminada** en DM-VIS-006 (nunca llegó al servidor) |
| — (descartada) | CAR755 · GESTION PUNTO DE VENTA / CHEQUEO DE INVENTARIO | DDHP_A12 / id 2 | Descartada con "Salir sin guardar" (DM-VIS-022) — **no persistió**, correcto |

**Guardadas pendientes al cierre: ninguna.** Se envió la única transacción que correspondía enviar (regla de la QA cumplida; `notificationsVisit=false` ⇒ no dispara correo).

---

## Catálogo REAL de actividades que muestra la app

La app expone **exactamente 4** actividades, **idénticas** a las activas en BD (`incidence_type WHERE co_operation<>'D'`):

| idType | naType | `requiredEvent` | `requiredSignature` | BD `co_operation` |
|---|---|---|---|---|
| 2 | VENTA - REVENTA | true | false | U |
| 71 | COBRANZA - VENTA | true | false | U |
| 75 | GESTION PUNTO DE VENTA | true | false | U |
| 83 | PROSPECTOS | true | false | U |

✅ **Ninguna actividad con `co_operation='D'` aparece en la app** — el filtro de borradas funciona (las 24+ filas `D` de `incidence_type`, incl. "No Visita", "Prueba", "Negociaciones", quedaron fuera). **No es hallazgo.**

**Motivos descubiertos** (todas las actividades traen `requiredEvent=true` ⇒ Motivo siempre obligatorio):
- **VENTA - REVENTA (2)** → EFECTIVA (262) · NO REALIZO LA VISITA (269) · NO EFECTIVO (272)
- **GESTION PUNTO DE VENTA (75)** → CHEQUEO DE INVENTARIO (…)
- **PROSPECTOS (83)** → PROCESO DE DOCUMENTACION (227) · PRESENTACION DE PROPUESTA (266) · SEGUIMIENTO DE LA PROPUESTA (273)

⚠ Las etiquetas son **propias de esta playa** — no coinciden con las de el_palmar/insumar pese a compartir ids.

---

## Verificación BD

**Baseline (nube, antes del módulo):** `visit` count **26073** · max(`id_visit`) **28222** · `incidence` count 26392 · max(`co_incid`) 28716.

**Diff de baseline (toda fila nueva, no solo la esperada):**

| Fuente | Resultado |
|---|---|
| Nube `visit` | **1 fila nueva** → `id_visit=28223`, `co_visit=1786126557073.0`, `st_visit=2`, `is_visited=true`, `is_dispatched=false`, `coordenada="11.049043,-63.8649961"`, `id_client=838`, **`co_enterprise='DDHP_A12'` / `id_enterprise=2`** ✅ |
| Nube `incidence` | **1 fila** → `co_incid=28717`, `id_visit=28223`, `co_type=2`, `co_cause=262`, `tx_description` = el comentario (120 chars) ✅ = nº de actividades cargadas por UI |
| Totales | 26073 → **26074** (exactamente +1) · max id 28222 → **28223** |
| Duplicados | `count(*)=1` vs `count(DISTINCT co_visit)=1` → **sin duplicados** |
| Local `visits` | `id_visit=28223`, `st_visit=2`, `is_visited='true'` |
| `pending_transactions` | **0** · `failed_transactions` **0** |
| Payload | `visitservice/visit` capturado **1 sola vez y CON body** (hook heredado `__qaH.getPayloadData()`, sin reinstalar) |

**Conclusión guardado→enviado: `BD-OK`.** La sync fue **INMEDIATA** (la fila estaba en la nube al primer poll, sin necesidad de reintento — a diferencia de devoluciones, que tardó 5-12 min en esta misma corrida).

**Correlación Ref↔fila confirmada:** Nro.Ref de la UI **28223** = `id_visit` (PK del servidor), leída del texto de la 3.ª alerta sin ir a BD.

**`st_*` — cómo se resolvió:** `transaction_statuses` **NO tiene filas para `vis`** (los únicos `co_transaction_type` son `cob`, `dev`, `ped`, `inv`) — confirmado el aviso del perfil. Se usó **`st_visit` crudo + `is_visited`**, documentado: `st_visit=0` = Guardado local · `st_visit=2` = Enviado. Coherente con `[gmp-20260730]`/`[el_palmar-20260805]`.

**Señales de "sin datos" de RUTA DE HOY (3, concordantes):** `comp.listaVisitas.length=0` + tabla local `visits` con 0 filas + texto "No hay resultados". ⇒ **N/A estructural PROBADO**, y además `noVisitado=0` en la lista tras crear registros.

---

## Verificación de VGs

| VG | Valor esperado | Qué se observó | Veredicto |
|---|---|---|---|
| `signatureVisit` | false | Tab Adjuntos **sin** acordeón Firma, `canvas=0` | ✅ Coherente. (Recordatorio RUNTIME §5: aunque estuviera en true, enviar sin firma **no** sería defecto) |
| `visitRout` | false | RUTA DE HOY vacía por diseño; **sí se probó** y no dio error — solo muestra lo creado localmente | ✅ Coherente · DM-VIS-025/026 N/A |
| `userCanSaveGPS` | false ("las visitas no llevan coordenadas") | 🔴 **La coordenada VIAJA igual**: `coordenada:"11.049043,-63.8649961"` en el payload **y** en la fila de nube. El flag `coordenadaSaved:false` sí viaja en false | ⚠ **La VG NO impide la coordenada** — gobierna `coordenadaSaved`, no el campo. Mismo comportamiento que en CLIENTES de esta corrida ⇒ **2.º módulo que lo confirma**. No es defecto, pero el perfil está mal redactado |
| `userMustActivateGPS` | false | Ningún bloqueo ni exigencia de GPS en ningún paso | ✅ Coherente |
| `requiredComment` | alcance COBROS (`tipo_variable='C'`) | Comentario **no obligatorio** en visitas (Guardar/Enviar habilitan sin él) | ✅ Coherente |
| `longitudComentario` | no aplica | 🔴 El tope real es **`maxlength=120`**, **no 255**. Medido empíricamente: **328 caracteres tecleados → 120 aceptados** (modelo y DOM coinciden) | ⚠ **Corrige el supuesto del prompt.** Es la constante de producto `TEXT_COMMENT_MAX_LENGTH` de la APK **El Yaque v1.0 = 120** (el fuente actual trae 255). Reconfirma `[alipascua-20260804]`. **No es incumplimiento de VG** |
| `enterpriseEnabled` | true (3 empresas) | Selector **preseleccionado**, sin `formcontrolname`, `value` = **objeto empresa completo**, `ng-valid`, fuera de la validación | ✅ DDHP_A12 / id 2 correcto en UI, payload y nube |
| `notificationsVisit` | false | No aplica correo | ✅ |

---

## Defectos conocidos del tag 20 — ¿reproducen? ¿le pegan a difranca?

| Defecto | ¿Reproduce? | ¿Le afecta a difranca? |
|---|---|---|
| 🔴 **`VIS-GUARDAR-NO-IDEMPOTENTE`** | ❌ **NO REPRODUCE** | **No.** Probado en los **dos** sabores: (a) Guardar 2× seguidas en el form recién guardado → el botón `.imagenGuardar` queda **`disabled=true`**, el 2.º click no dispara nada; (b) reabrir la visita Guardada desde la lista y **Guardar de nuevo** → alert "La visita se ha guardado", y `visits` 1→**1**, `incidences` 1→**1**. Evidencia dura: **`sqlite_sequence` de `incidences` se mantuvo en 1** ⇒ es un **UPDATE real**, no un delete+reinsert. **0 duplicados** en ambas tablas y en la nube. **No pega en operación en este cliente.** |
| ⚠ **`VIS-FECHA-MAS-4H`** | ✅ **REPRODUCE** | Sí, **cosmético**. Guardada `da_visit=2026-08-07 14:12:43`; al reabrir la UI muestra **"7/8/2026, 6:12 p. m."** y el modelo `fechaVisita="2026-08-07T18:12:43"` — exactamente **+4 h** (device GMT-0400: se pinta el reloj **UTC** como si fuera local). **Mismos segundos (43) ⇒ no es "ahora"**. El dato **no se corrompe**: el payload salió con la hora local correcta y la nube guardó `18:12:43Z` = 14:12:43 local ✅. Idéntico a `[gmp-20260730]`. **No es FAIL de round-trip** (RUNTIME §10.b: diferencia de hora por TZ = nota) |
| **`VIS-VISITADO-SIN-FECHA-INICIO`** / **`VIS-SIN-FECHA-INICIADA`** | ✅ **REPRODUCE** | Sí. La visita Enviada queda **`is_visited=true` con `da_initial=NULL`** en la nube (y `daInitial:""` en el payload y en local). **Mecánica capturada:** al **Guardar**, `daInitial` **sí** se puebla (`2026-08-07 14:21:20` en la visita Guardada); al **Enviar**, `daInitial` se **vacía** y solo queda `daReal=2026-08-07 14:18:30`. Se ve lado a lado en la lista: la Enviada con `daInitial:""` y la Guardada con `daInitial` lleno. **Afecta a difranca** — cualquier reporte que mida "hora de inicio de visita" queda sin dato en las visitas enviadas |
| **`DM-VIS-020`** (modal de confirmación antes de validar actividades) | — | **No re-marcado FAIL** (UX conocido). En esta corrida no llegó a molestar: la visita siempre llevó ≥1 actividad y la app **sí exigió** actividad para enviar |
| **`VIS-WEB-LISTA-DUPLICA`** · **`VIS-WEB-DETALLE-INCOMPLETO`** | 🚫 fuera de alcance | Son defectos de la **capa web**. En el móvil la lista mostró **1 fila por visita, sin duplicar** (2 registros → 2 ítems; tras borrar → 1 ítem). Le corresponde al agente web confirmarlos |
| **`VIS-WEB-SIN-ICONO-ADJUNTO`** | 🚫 **N/A confirmado** | El perfil decía que no aplica por `visitRout=false`: **confirmado** — sin ruta de visitas no hay fila de ruta a la que pintarle el ícono. Además la visita viajó con `hasAttachments:"false"`/`nuAttachments:0` |

### Hallazgo adicional (no estaba en la lista) — basura local, sin impacto en nube

**Borrar una visita Guardada deja la incidencia HUÉRFANA en `incidences` (BD local).** Tras DM-VIS-006: `visits` 2→**1** ✅ pero `incidences` se quedó en **2**, y `SELECT count(*) FROM incidences i WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit=i.co_visit)` devuelve **1**. Reproduce `[gmp-20260730]` en difranca. **Sin impacto en la corrida ni en la nube** (esa visita nunca se envió, colas en 0), pero es **basura acumulativa en la BD del dispositivo**. No se marcó FAIL: es un defecto local ya registrado.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selector de EMPRESA en VISITAS = **objeto completo, preselecto, fuera de validación** | universal (por formulario) | `ion-select` **sin** `formcontrolname`, `disabled=false`, `ng-valid`, `value` = `{idEnterprise:2, coEnterprise:"DDHP_A12", lbEnterprise:"*DISTRIBUIDORA DIAZ", coCurrencyDefault:"US$", prioritySelection:0, enterpriseDefault:"true"}`. **4.ª confirmación** de la variante de el_palmar: NO aplicar la receta `s.value=<number>` de CLIENTES. Con 3 empresas se comporta igual que con 2 |
| 🔴 Botón `Agregar` del `ion-modal#eventModal` **no responde a `pg.mouse.click`** | universal | `elementFromPoint` en su rect devuelve **`ION-BUTTON.botonAddLila`** (el "AÑADIR ACTIVIDAD/EVENTO" del form de fondo) ⇒ el click re-dispara el form subyacente. **Fix: `b.shadowRoot.querySelector('button').click()`** — funcionó al 1.er intento. **2.ª confirmación** (el_palmar → difranca, otro servidor) ⇒ candidato a graduar a `RUNTIME`/helpers |
| Tope de comentario = **`maxlength=120`** en APK El Yaque v1.0 | cliente/build | 328 tecleados → 120 aceptados. ⚠ `comp.textCommentMaxLength` **NO está expuesto** en `app-visita` de este build (a diferencia de el_palmar) — hay que leer el atributo `maxlength` del `ion-input` del modal |
| Back en `/visita` = **2 `img.fechaAtras`**, el real es `imgs[0]` con `mouse.click(≈32,31)` | cliente | Patrón ferrenuestro (2 apiladas pero `mouse.click` engancha), **NO** el `.click()` nativo de jerez. En `/listaVisitas` hay 1 sola |
| Alert "sucursal sin coordenadas" dispara al **SELECCIONAR** cliente y al **REABRIR** la visita, **no** antes del dirty-guard | cliente | Botones `["", "Agregar"]`, **idx 0 con textContent VACÍO** = Cancelar ⇒ resolver **por índice**, nunca por texto. En el Back el dirty-guard salió **directo** (patrón el_palmar, no piercar). No bloquea Guardar/Enviar |
| Reparto de etiquetas de alert medido en VISITAS/difranca | cliente | Guardado `[OK]` · Envío `[CANCELAR, Aceptar]` → `[OK]` → `[OK]` · Borrado `[CANCELAR, Aceptar]` + `[OK]` · Dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]` · Coordenadas `["", "Agregar"]`. Resueltos los **~12 alerts del módulo sin un solo reintento** recorriendo `['Aceptar','OK','Eliminar']` por igualdad exacta + `width>0` |
| Envío = **3 alertas, la Ref en la 3.ª** | universal | "¿Desea enviar la visita?" → "Su Visita será enviada" → **"Visita nro. 28223 enviada exitosamente"**. 4.ª confirmación (gmp, el_palmar, difranca) |
| `.imagenGuardar` pasa a **`disabled=true`** tras guardar | universal | Es la **protección anti-doble-guardado** del form; explica por qué `VIS-GUARDAR-NO-IDEMPOTENTE` no reproduce por esa vía. Vuelve a habilitarse al reabrir el registro |
| Modal de cliente: filtro **no realtime** | cliente | Escribir en `input.search-input` no filtra; hay que `mouse.click` en `ion-icon[name="search-circle-sharp"]` (≈325,95). De 50 ítems bajó a 1. Luego click al **centro del `<p>` del nombre** (y≈182) |
| `sqlite_sequence` como oráculo de idempotencia | universal | Comparar `seq` antes/después de un 2.º Guardar distingue **UPDATE** (seq estable) de **delete+reinsert** (seq crece). Fue lo que cerró el veredicto de `VIS-GUARDAR-NO-IDEMPOTENTE` sin ambigüedad |
| `transaction_statuses` sin filas `vis` | cliente | Solo `cob`/`dev`/`ped`/`inv`. Estado fiable de visita = `st_visit` (0=Guardado, 2=Enviado) + `is_visited` |

> ✅ consolidado 2026-08-07

---

## Hallazgos (FAIL)

**Ninguno.** 0 FAIL en el módulo.

Lo que sí queda anotado para el go/no-go, en orden de importancia:

1. **`VIS-VISITADO-SIN-FECHA-INICIO` reproduce y sí afecta a difranca** — `da_initial` se **vacía al enviar**; toda visita Enviada queda sin hora de inicio en la nube. Es el único de los conocidos con impacto real de negocio acá.
2. **`VIS-GUARDAR-NO-IDEMPOTENTE` NO reproduce** — el riesgo que más pesaba en el go/no-go **no se materializa en este cliente** (evidencia por conteos + `sqlite_sequence` + nube).
3. **`VIS-FECHA-MAS-4H` reproduce pero es cosmético** — el dato viaja y se guarda correcto; solo la UI de reapertura pinta UTC como local.
4. **`userCanSaveGPS=false` no impide la coordenada** — 2.º módulo de la corrida que lo confirma; hay que corregir la redacción del perfil, no el producto.
5. **Tope de comentario = 120, no 255** — corrige el supuesto del prompt; es constante de la APK, no VG.

---

*Agente VISITAS · difranca · EL YAQUE · 2026-08-07 · 0 cuelgues de CDP · 0 BLOCKED · estado final HOME*
