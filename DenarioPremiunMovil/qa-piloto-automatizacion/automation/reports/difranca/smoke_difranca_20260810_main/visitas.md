# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | VISITAS |
| Build | **main** · commit `99b138fa` · app v1.0 / db19 · `window.ng=TRUE` · `sqlitePlugin` OK |
| App | `com.kiberno.denarioPremiumPro` |
| Playa / tenant | EL YAQUE · difranca · empresa **DDHP_A12 (id 2)** |
| Cliente de prueba | CAR755 — MULTIDISTRIBUIDORA JAKE, C.A (id_client 838) |
| Vendedor | VEND206 / co_user 206 / id_user 275 |
| Resultado | **14 PASS · 0 FAIL · 0 BLOCKED · 2 N/A** (+2 verificaciones extra, ver Hallazgos) |
| Baseline `visit` (nube) | 26.072 → **26.073** (+1 exacto, doble pase) |

> ⚠ El encabezado del YAML dice "GO/NO-GO AL TAG 20": **no aplica**. Esta corrida busca bugs nuevos en `main`.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`, `h1` "Visitas" + 3 botones: NUEVA VISITA · RUTA DE HOY · VER MEJOR RUTA |
| DM-VIS-003 | ✅ PASS | Form sin cliente: tabs ACTIVIDADES/ADJUNTOS `disabled=true`, Guardar/Enviar `disabled=true` |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` con `ion-searchbar` visible, lista vacía **sin error** ni overlay colgado |
| DM-VIS-006 | ✅ PASS | Trash en visita Guardado → `[CANCELAR, Aceptar]` → "Se eliminó la visita de manera exitosa" `[OK]`; desaparece de UI y de `visits` |
| DM-VIS-010 | ✅ PASS | CAR755 seleccionado → 3 tabs habilitan en el mismo tick; `listaDirecciones=1` (sucursal cargada) |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal` con select Actividad (4 opciones), select Motivo, Comentario y `[CANCELAR, AGREGAR]` |
| DM-VIS-015 | ✅ PASS | Evento agregado al 1.er intento: "Actividad: COBRANZA - VENTA · Evento: EFECTIVA · Observación: Test-VIS-015-main-201404" |
| DM-VIS-019 | ✅ PASS | Alert "La visita se ha guardado" `[OK]`; el form **permanece abierto**; 1 fila en `visits` + 1 en `incidences`; cola 0 |
| DM-VIS-020 | ✅ PASS | 3 alertas → **Ref 28224**; navega a `/visitas`; local `id_visit=28224`, `st_visit=2`, `is_visited=true`; nube +1 |
| DM-VIS-021 | ✅ PASS | Back con cambios → modal `[Guardar y salir, Salir sin guardar, Cancelar]` |
| DM-VIS-022 | ✅ PASS | Visita nueva **nunca guardada** + evento → "Salir sin guardar" → **no persiste**: `visits` 2→2, `incidences` 2→2 y **`sqlite_sequence` estable en 2** (ni siquiera se insertó) |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta: editable, 3 tabs, Guardar/Enviar activos, evento y comentario íntegros |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" — **probado con 3 señales**: `comp.listaVisitas.length=0`, tabla local `visits`=0, texto "No hay resultados". Coherente con `visitRout=false` (vacío por diseño) |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" con 1 evento → alert guardado `[OK]` → `/visitas`; en RUTA DE HOY **Estatus: Guardado** y al reabrir la actividad está |
| DM-VIS-032 | ✅ PASS | Tab Adjuntos: acordeones **`images` + `file`** (`userCanUploadFiles=true`) y **sin acordeón Firma** (`signatureVisit=false`), 0 `<canvas>` |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **28224** | Visita CAR755 · COBRANZA - VENTA (co_type 71) / EFECTIVA (co_cause 264) · comentario `Test-VIS-015-main-201404` | **Enviada — BD-OK en nube** |
| — (Ref 0) | Visita CAR755 · GESTION PUNTO DE VENTA / CHEQUEO DE INVENTARIO (`Test-VIS-031-main`) | Guardada y luego **borrada** (DM-VIS-006) |
| — (Ref 0) | Visita CAR755 · PROSPECTOS / PROCESO DE DOCUMENTACION (`Test-VIS-022-main`) | **Nunca persistió** (DM-VIS-022, correcto) |
| — (Ref 0) ×2 | Visitas VENTA - REVENTA (`Test-doble-guardar-main`) del test de idempotencia | Guardadas y **borradas ambas** al cerrar |

Estado final del dispositivo: **HOME**, sin alerts ni modales, `pending_transactions(visit)=0`, `failed_transactions(visit)=0`.

## Verificación BD

**Nube (`visit`)** — doble pase, baseline 26.072 → **26.073 (+1)**. Fila 28224:

| Campo | Valor |
|---|---|
| `co_visit` | `1786392875067.0` (idéntico al local) |
| `st_visit` / `is_visited` / `is_dispatched` | `2` / `true` / `false` |
| `coordenada` | `11.0490614,-63.8649968` — **poblada** |
| `id_enterprise` / `co_client` | `2` (DDHP_A12) / `CAR755` |
| `inc` | **1** = 1 actividad cargada por UI ✅ |
| `incidence` | `co_incid 28718` · `co_type 71` · `co_cause 264` · `tx_description "Test-VIS-015-main-201404"` — **cotejo campo a campo OK** |

**Local (`visits`/`incidences`)**: `id_visit=28224 > 0`, `st_visit=2`, fuera de cola, 0 rechazos, sin duplicados ⇒ **`BD-OK`**.
**Sync: INMEDIATA** (la fila estaba en la nube al primer poll; `da_created` 20:15:09 UTC vs `da_real` 20:15:06). Confirma que la nota de "diferida 5-12 min" del perfil **no aplica a visitas en main**.
**Guardado→enviado: sí.** Todo lo que se guardó y se envió llegó; lo que se guardó sin enviar quedó local (`id_visit=0`) y lo borrado desapareció; **nada quedó atascado**.

---

## Hallazgos

### 1. 🔴 `VIS-GUARDAR-NO-IDEMPOTENTE` **REPRODUCE EN MAIN** — y con un agravante no documentado

Defecto **ya confirmado por QA** (`defectos-conocidos.yaml`, estado `confirmado`, tag 20). **No es nuevo, pero no está arreglado en `main`** y aparece un efecto adicional que la ficha no recoge.

Reproducción (1/1, medida con BD local):

| Señal | Antes | Después |
|---|---:|---:|
| `visits` | 1 | **3** (+2 por un solo gesto) |
| `incidences` | 2 | **3** (+1) |
| `sqlite_sequence(incidences)` | 2 | 3 |

- Dos `mouse.click` seguidos **sin delay** sobre `ion-button.imagenGuardar` crean **DOS** filas: `co_visit 1786393329966.0` y `1786393329988.0`, ambas `id_visit=0`, `st_visit=0`, **mismo `da_visit 16:21:42`**.
- La UI de RUTA DE HOY las muestra como **dos ítems "Nro Ref.: 0 · Estatus: Guardado"** del mismo cliente.
- 🔴 **Agravante nuevo:** la copia `…988.0` queda con **`inc=0` — visita Guardada SIN NINGUNA actividad**. El propio guion (DM-VIS-031) define eso como condición de FAIL. La ficha del defecto solo describe "dos visitas idénticas".
- Solo se muestra **una** alerta "La visita se ha guardado"; `.imagenGuardar` pasa a `disabled=true` **después** de que el 2.º click ya entró ⇒ la protección anti-doble-guardado existe pero **llega tarde** (no hay guard de reentrada).
- **Contención confirmada:** las duplicadas quedan **locales** (`id_visit=0`, cola 0, rechazos 0). **La nube no se ensucia** — el diff de `visit` fue +1 exacto.
- ⚠ Matiza la nota de la corrida del 07/08 ("no reproduce por esa vía, `.imagenGuardar` se deshabilita"): **sí reproduce**, con dos clicks reales sin espera entre ellos.

### 2. 🟡 Incidencia **huérfana** al borrar una visita Guardada — reproduce en main y **no tiene ficha** en `defectos-conocidos.yaml`

Descrito en `module-selectors/visitas.md` como observación de `[gmp-20260730]`, pero **no está registrado como defecto**. Reproducido 3/3 en esta corrida:

```
SELECT i.co_incidence, i.co_visit FROM incidences i
WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit = i.co_visit)
→ co_incidence 2 (co_visit 1786393051515.0) · co_incidence 3 (co_visit 1786393329966.0)
```

Al borrar la visita, la fila sale de `visits` (UI y tabla correctas) pero **su incidencia sobrevive**. Sin impacto en la nube (esas visitas nunca se enviaron), pero es **basura acumulativa en la BD local** del dispositivo. Severidad baja; candidato a ficha propia.

### 3. ⓘ `VIS-SIN-FECHA-INICIADA` — ahora **hay oráculo del móvil** (estaba `en_observacion` por falta de él)

La ficha decía: *"El manifiesto del móvil no reporta campo de inicio ⇒ sin oráculo"*. Ya lo hay, del payload capturado:

- Payload `visitservice/visit` → **`daInitial: ""`** (cadena vacía) y `daReal: "2026-08-10 16:15:06"`.
- Nube, fila 28224 → **`da_initial = NULL`**, `da_real` poblado.

⇒ Una visita creada desde **NUEVA VISITA** (sin pasar por INICIAR VISITA) **nunca setea `daInitial`**: el móvil lo manda vacío y la nube lo guarda NULL. **No es corrupción ni pérdida de dato en el envío** — es que ese flujo no genera fecha de inicio. Queda por decidir con QA si la web debería mostrarlo vacío o derivarlo de `da_real`. **No lo levanto como defecto**; aporto el oráculo que faltaba.

### 4. ✅ `VIS-FECHA-MAS-4H` **NO reproduce en main** (fix vigente)

Guardado `da_visit = 2026-08-10 16:16:40` (local, GMT-4) → al reabrir la visita, la UI muestra **"10/8/2026, 4:16 P. M."**. Coincide exactamente; **no hay desfase de +4 h**. (En el tag 20 el mismo escenario pintaba el reloj UTC como local.) El modelo trae el ISO en UTC (`2026-08-10T20:16:40`) y el formateo ahora lo convierte bien.

### 5. ⓘ `userCanSaveGPS=false` **no impide que la coordenada viaje** — 3.ª confirmación, ahora en VISITAS

Payload: `coordenada:"11.0490614,-63.8649968"` con **`coordenadaSaved:false`**, y la nube guardó la coordenada. La VG gobierna el flag, **no** la captura ni el envío. Ya confirmado en clientes; ahora también en visitas. **No es defecto.**

### 6. ⓘ Tope del comentario: **120 → 255** entre tag 20 y main

Medido: **300 tecleados → 255 aceptados**, `maxlength="255"`, contador "255/255" y rótulo "Mín. 0 - Máx. 255 caracteres". Además **`comp.textCommentMaxLength` vuelve a estar expuesto en `app-visita`** (valor 255), cosa que en el build del 07/08 **no** ocurría (allí el tope real era 120). Es un **cambio de build**, no un incumplimiento de VG (`longitudComentario=200` sigue sin gobernar este campo). ⇒ **Corregir la nota del perfil**, que hoy afirma "el tope real de esta APK es 120".

### 7. ⓘ El defecto conocido `DM-VIS-020` (enviar sin actividades) **no es alcanzable en este build**

Con cliente puesto y **cero** eventos, `imagenGuardar` e `imagenEnviar` llegan ambos `disabled=true`; solo habilitan al agregar el 1.er evento. No hay forma por UI de disparar el confirm de envío sin actividades.

### 8. ⓘ Estatus de la visita nueva — **sale rotulado**

`transaction_statuses` **no tiene filas `vis`** en difranca, y aun así el ítem de RUTA DE HOY muestra **`Estatus: Visitado`** para la Ref 28224 y **`Estatus: Guardado`** para las locales. El rótulo lo resuelve el componente por constante sobre `stVisit`/`isVisited`, **no** por JOIN contra esa tabla ⇒ en visitas el estatus **no depende** del arreglo que se cerró en devoluciones, y **lo nuevo sale correcto**.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `Agregar` de `ion-modal#eventModal` vía `b.shadowRoot.querySelector('button').click()` | universal | **3.ª confirmación** (el_palmar · difranca tag20 · difranca main), 3.er servidor-build. `elementFromPoint` volvió a devolver `ION-BUTTON.botonAddLila` del form de fondo. Ya graduado en RUNTIME §3 — confirmar y no revisar más |
| `maxlength` del comentario = **255** en main (era 120 en tag 20) y `comp.textCommentMaxLength` **expuesto** otra vez | cliente/build | Leer **ambos**: el atributo del input y el componente. Corregir `difranca.yaml` (dice 120) |
| Nº de `img.fechaAtras` en `/visita` **no es estable dentro de la misma corrida** | universal | Primera entrada al form: **2** apiladas; entradas siguientes: **1**. Recorrer siempre `filter(width>0)` y usar `imgs[0]`; nunca cachear la cantidad |
| `sqlite_sequence` como oráculo de "nunca se insertó" | universal | En DM-VIS-022 la `seq` de `incidences` quedó **estable en 2** ⇒ prueba de que "Salir sin guardar" **no insertó y borró**, sino que nunca insertó. Complementa el uso ya documentado para idempotencia |
| Doble `pg.mouse.click` **sin `delay`** como reproductor de no-idempotencia | universal | Con `delay:120-130` el 2.º click no entra; sin delay, sí. Es la vía que faltaba para reproducir `VIS-GUARDAR-NO-IDEMPOTENTE` |
| Chequeo de incidencias huérfanas | universal | `SELECT i.co_incidence FROM incidences i WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit=i.co_visit)` — correr tras cada borrado |
| Selector de EMPRESA en VISITAS: sin `formcontrolname`, preselecto, `ng-valid`, `value` = objeto completo, fuera de la validación | cliente | **5.ª confirmación**; con 3 empresas igual que con 2 |
| Etiquetas de alert medidas en main (visitas) | cliente | Guardado `[OK]` · Envío `[CANCELAR, Aceptar]`→`[OK]`→`[OK]` · Borrado `[CANCELAR, Aceptar]`+`[OK]` · Dirty-guard `[Guardar y salir, Salir sin guardar, Cancelar]` · Coordenadas `["", "Agregar"]` (idx0 vacío = Cancelar). **Idénticas al tag 20**; ~20 alerts resueltos **sin un reintento** |
| Catálogo de actividades difranca = **4**, todas `requiredEvent="true"` / `requiredSignature="false"` | cliente | VENTA - REVENTA (2) · COBRANZA - VENTA (71) · GESTION PUNTO DE VENTA (75) · PROSPECTOS (83). Motivos: COBRANZA-VENTA → EFECTIVA (264) / NO EFECTIVO / NO REALIZO LA VISITA; GESTION PUNTO DE VENTA → CHEQUEO DE INVENTARIO (225); PROSPECTOS → PROCESO DE DOCUMENTACION. **Ninguna borrada se coló** |
| Envío = **3 alertas con la Ref en la 3.ª** | cliente | 5.ª confirmación: "Visita nro. **28224** enviada exitosamente" ⇒ Ref sin ir a BD |
