# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | VISITAS |
| Dispositivo | ADB 14678405BR003855 — Infinix HOT 60i (X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar · empresa **CENTRAL EL PALMAR, S.A. (co 1002 / id 1)** |
| Usuario | coUser 1276 / idUser 266 |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |
| Estado final | HOME ✅ (sin alerts ni modales residuales) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | `/visitas`, `h1.tituloModulos`="Visitas" + 3 botones: NUEVA VISITA (y=107), RUTA DE HOY (y=176), Ver mejor ruta (y=245) |
| DM-VIS-003 | ✅ PASS | `/visita`; tabs ACTIVIDADES/ADJUNTOS `disabled=true`, GENERAL habilitada; cliente vacío; Guardar/Enviar `disabled=true` |
| DM-VIS-004 | ✅ PASS | `/listaVisitas` (`app-lista-visita`), searchbar visible, 0 ítems, "No hay resultados", sin overlay colgado ni error |
| DM-VIS-006 | ✅ PASS | Trash → "Denario - Visita / ¿Desea borrar la visita? Esta acción no se puede deshacer." `[CANCELAR, Aceptar]` → "Se eliminó la visita de manera exitosa" `[OK]`; lista 2→1; fila fuera de `visits` local |
| DM-VIS-010 | ✅ PASS | Cliente `C.A. RON SANTA TERESA, S.A.C.A (1000000803)`; **las 3 tabs habilitaron**; Sucursal DESPACHO (idAddress 51123) cargada |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal.modalActividades` con select Actividad (11 opts), select Motivo (carga diferida), Comentario (`maxlength=255`), botones `CANCELAR`/`Agregar` |
| DM-VIS-015 | ✅ PASS | Evento en Tab Actividades: "Actividad: MERCHANDISING · Evento: ENTREGA DE MUESTRAS · Observación: Test-VIS-015-162550"; `listaEventos.length` 0→1 |
| DM-VIS-019 | ✅ PASS | Alert "Denario / **La visita se ha guardado**" `[OK]`; formulario **permanece abierto** en `/visita` con el evento intacto |
| DM-VIS-020 | ✅ PASS | **3 alertas**: `¿Desea enviar la visita?` `[CANCELAR, Aceptar]` → `Su Visita será enviada` `[OK]` → **`Visita nro. 18 enviada exitosamente`** `[OK]` → navega a `/visitas`; queda "Visitado" |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → modal "¡Alerta!" con los 3 botones exactos: `Guardar y salir` / `Salir sin guardar` / `Cancelar` |
| DM-VIS-022 | ✅ PASS | Visita **nueva nunca guardada** + "Salir sin guardar" → NO persiste: `visits` local sin la fila, `incidences`=1 (solo la de Ref 18), RUTA DE HOY sin el ítem |
| DM-VIS-023 | ✅ PASS | Visita Guardada reabierta: 3 tabs `disabled=false`, Guardar/Enviar activos, cliente editable (`disabled=false`,`readonly=false`), evento conservado |
| DM-VIS-025 | 🚫 N/A | Sin visitas "No Visitado" del backend hoy — **probado**: `visits` local 0 filas, `listaVisitas=[]`, UI "No hay resultados", `pending_transactions` vacía |
| DM-VIS-026 | 🚫 N/A | Depende de 025 (no hay visita de ruta para INICIAR VISITA) |
| DM-VIS-031 | ✅ PASS | "Guardar y salir" → "La visita se ha guardado" → RUTA DE HOY: `Nro Ref.: 0 · Estatus: Guardado` **con trash**; al reabrir trae su evento (EVENTOS 86 / SUPERVISION DE EVENTOS 213) |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS: **solo acordeón `images`** (BUSCAR FOTO / TOMAR FOTO). Sin `file` ni `sign` — **correcto**: `userCanUploadFiles=false` y `signatureVisit=false` en BD |

---

## Registros creados en sistema

| Ref | epoch (`co_visit`) | Empresa efectiva | Detalle | Estado |
|-----|--------------------|------------------|---------|--------|
| **18** | `1785961638978.0` | **CENTRAL EL PALMAR, S.A.** — `co_enterprise=1002` / `id_enterprise=1` | Cliente 1000000803 C.A. RON SANTA TERESA, S.A.C.A · Sucursal DESPACHO (51123) · MERCHANDISING(47)/ENTREGA DE MUESTRAS(153) · "Test-VIS-015-162550" | **Enviado** (`st_visit=2`, `is_visited=true`) — BD-OK |
| — | `1785962289425.0` | CENTRAL EL PALMAR, S.A. (1002/1) | Visita Guardada de DM-VIS-031/023 · EVENTOS(86)/SUPERVISION DE EVENTOS(213) | **Borrada** en DM-VIS-006 (nunca llegó al servidor) |

**Visitas Guardadas pendientes de envío manual por QA: NINGUNA.** No hubo bloqueo por adjunto obligatorio (`userCanUploadFiles=false`, sin acordeón Archivo; el envío no exige adjunto ni firma).

---

## Verificación BD

**Baseline (nube, inicio):** `visit` count=17 / max(id_visit)=17 · `incidence` count=12.
**Cierre (nube):** `visit` count=**18** / max=**18** · `incidence` count=**13**. Diff = exactamente +1 visita / +1 incidencia. Sin duplicados.

### Fila nueva en nube (`visit` id_visit=18)
```
id_visit=18 · co_visit=1785961638978.0 · st_visit=2 · is_visited=true · is_dispatched=false
id_enterprise=1 · co_enterprise='1002' · id_client=85 · co_client='1000000803'
na_client='C.A. RON SANTA TERESA, S.A.C.A' · id_address_client=51123
coordenada='11.0490672,-63.8650075' · da_visit=2026-08-05T20:23:25Z · inc=1
```

### Hija `incidence` — cotejo campo a campo contra lo cargado por UI
| Campo nube | Valor | UI cargada | ✓ |
|---|---|---|---|
| `co_type` | 47 | MERCHANDISING (idType 47) | ✅ |
| `co_cause` | 153 | ENTREGA DE MUESTRAS (idMotive 153) | ✅ |
| `tx_description` | `Test-VIS-015-162550` | comentario tecleado | ✅ |
| `co_incid` | 13 | (PK servidor) | — |

### Correlación Ref ↔ fila
**Nro.Ref de la 3ª alerta = 18 = `id_visit` del servidor.** Confirma el patrón `Ref = id_<x>` (BD-INFO).

### Estado local (`sqlitePlugin`, tablas en PLURAL)
| Momento | `visits` | Marca |
|---|---|---|
| Tras Guardar (DM-VIS-019) | `id_visit=0`, `st_visit=0` | **BD-SAVED** |
| Tras Enviar (DM-VIS-020) | `id_visit=18`, `st_visit=2`, `is_visited='true'` | **BD-OK** |

`pending_transactions` **vacía** en todos los cortes · `failed_transactions` sin filas para visitas · sin duplicados (`count(*)==count(DISTINCT co_visit)`).

**Conclusión guardado→enviado: BD-OK.** Lo que se guardó se envió, llegó a la nube con su hija y con la empresa correcta.

> ⚠ **`transaction_statuses` NO cubre visitas**: `SELECT DISTINCT co_transaction_type` devuelve solo `ped/cob/dev/inv/dep` — **no existe tipo `vis`**, y no hay fila con `co_transaction='1785961638978.0'`. Para visitas la fuente fiable de estado es **`visit.st_visit=2` = Enviado** (coherente con piercar/ferrenuestro/globalmp) + `is_visited=true`.

### Payload
`__qaH.getPayloadData()` **SÍ capturó `visitservice/visit`** — **1 POST, con body completo, sin duplicados** (249 payloads totales en la sesión, 1 de visita). Volcado en `_payloads.jsonl`. Campos clave: `coVisit`, `coEnterprise:"1002"`, `idEnterprise:1`, `visitDetails[coType:47, coCause:153, txDescription]`, `isVisited:true`, `coordenadaSaved:false`.

---

## Verificación de VGs

Valores **efectivos leídos de `global_configuration` en la nube** (no del YAML):

| VG | YAML/prompt | **Valor efectivo BD** | Efecto observado en UI | Veredicto |
|----|-------------|----------------------|------------------------|-----------|
| `signatureVisit` | "se PUEDE firmar" | **`false`** | Tab ADJUNTOS **sin acordeón Firma**, 0 `<canvas>` | ✅ Coherente. **El YAML está desactualizado.** La ausencia del acordeón NO es defecto |
| `userCanUploadFiles` | true (YAML) | **`false`** | Tab ADJUNTOS **sin acordeón Archivo** (solo `images`) | ✅ Confirmado — igual que en DEVOLUCIONES. **El YAML está desactualizado** |
| `requiredComment` | alcance COBROS | `true` pero **`tipo_variable='C'`** | Comentario del evento **no obligatorio**; visita se guarda/envía con comentario vacío | ✅ No aplica a visitas, como se anticipaba |
| `longitudComentario` | — | `185` | **Medido: tecleé 300 caracteres → aceptó exactamente 255**; `maxlength=255`, `input.maxLength=255`, `comp.textCommentMaxLength=255` | ⚠ **El `maxlength` real NO viene de la VG.** Lo fija `TEXT_COMMENT_MAX_LENGTH` del producto. No es incumplimiento de VG |
| `userCanSaveGPS` | contrastar vs CLIENTES | **`false`** | La visita **sí registra** `coordenada=11.0490672,-63.8650075`, pero el payload viaja con **`coordenadaSaved:false`** | ✅ **NO es el mismo caso que CLIENTES.** La VG gobierna si la coordenada se **guarda en la sucursal**, y efectivamente no se guarda; la geolocalización *de la visita* es dato propio del registro. Sin defecto |
| `userMustActivateGPS` | false | `false` | Ningún bloqueo por GPS; no se pidió activar ubicación en ningún flujo | ✅ |
| `multiCurrency` | true | `true` | `comp.multiempresa=true`; sin impacto en visitas (no hay montos) | ✅ |
| `enterpriseEnabled` | true | `true` | `listaEmpresa` con las 2 empresas; selector presente en el form | ✅ |

### Empresa efectiva — verificación exigida
**En VISITAS el `ion-select` de empresa llega PRESELECCIONADO y correcto**, con el objeto completo como `value` y **sin `formcontrolname`** (variante de DEVOLUCIONES/INVENTARIOS/DEPÓSITOS, NO la de CLIENTES):
```
{idEnterprise:1, coEnterprise:"1002", lbEnterprise:"CENTRAL EL PALMAR, S.A.", coCurrencyDefault:"USD", ...}
disabled=false · ng-valid · shadowRoot rotula "CENTRAL EL PALMAR, S.A."
```
Verificada en los **3 puntos**: **UI** (form nuevo y form reabierto tras Guardar → sigue 1002/1), **payload** (`coEnterprise:"1002"` / `idEnterprise:1`) y **BD nube** (`co_enterprise='1002'` / `id_enterprise=1`).
⇒ **El `enterprise_default` local que apunta a C.A. DESTILERIA YARACUY (id 2 / co 1003) NO se materializó tampoco acá** — 4º módulo consecutivo en que la "trampa" no se reproduce.

---

## Catálogo real de actividades (exigido)

La app muestra **11 actividades**, todas con `requiredEvent="true"` y `requiredSignature="false"`:

| idType | Actividad | `co_operation` en BD |
|--------|-----------|----------------------|
| 2 | NO VISITO | U |
| 47 | MERCHANDISING | U |
| 71 | NO COMPRO | U |
| 75 | VISITA FUERA DE RUTA | U |
| 82 | COBRANZA | U |
| 83 | INFO DE CLIENTES | U |
| 84 | COBRANZA NO EFECTIVA | U |
| 85 | VENTA EN RUTA | **I** |
| 86 | EVENTOS | U |
| 87 | REUNION CON CLIENTE | **I** |
| 88 | VISITA SIN ACCION | **I** |

**Contraste con el perfil (que decía 8):** el conteo del perfil solo sumaba `co_operation='U'`. El catálogo real activo es **`U` + `I` = 11**. `co_operation` es un flag de sincronización (I=insert, U=update, D=delete), no un estado de vigencia.

🔴 **La app SÍ filtra la basura `co_operation='D'`:** las 10 filas basura de `incidence_type` (`No Visita`, `No Visito`, `Prueba`, `Prueba3/4/6`, `Negociaciones`, `ffrfff`, `Preba77`, `Reventa`…) **NO aparecen** en el selector. **Ningún ítem mostrado tiene `co_operation='D'` ⇒ NO es defecto.** Mismo hallazgo que en DEVOLUCIONES (21 vs 24 motivos): el conteo del perfil estaba desactualizado, no la app.

**Motivos verificados (carga diferida ~1,5-2 s tras elegir Actividad):**
- MERCHANDISING (47) → 5: ENTREGA DE MUESTRAS 153 · LEVANTAMIENTO DATA ISSY 183 · VISIBILIDAD PDV 184 · PLAN SLIP 191 · MUESTRA NUEVO CATALOGO 192
- COBRANZA (82) → 4: COBRANZA EFECTIVA 182 · COBRANZA PARCIAL 188 · RETENCION 189 · COBRANZA + RETENCION 190
- EVENTOS (86) → 1: SUPERVISION DE EVENTOS 213

---

## DM-VIS-020 (defecto conocido RUNTIME §5) — ¿reprodujo?

**NO reproduce en este build.** Prueba directa: con cliente seleccionado y **0 actividades**, se midió el par de botones →
`imagenGuardar.disabled=true` y `imagenEnviar.disabled=true`. Con 1 actividad ambos pasan a `false` en el mismo tick.
⇒ **Es imposible llegar al modal de confirmación de envío sin actividades**: la validación ocurre *antes*, deshabilitando el botón. El defecto UX registrado (modal antes de validar actividades) **no se manifiesta aquí**.

---

## Hallazgos

**0 FAIL.** Dos observaciones sin veredicto FAIL:

1. **Incidencia huérfana al borrar una visita Guardada (reproduce `[gmp-20260730]`).**
   Tras DM-VIS-006, la fila sale de `visits` (UI y tabla correctas) pero su incidencia sobrevive en `incidences`:
   `SELECT i.co_visit FROM incidences i WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit=i.co_visit)` → devuelve `1785962289425.0`.
   Sin impacto en la corrida (la visita nunca llegó al servidor, `pending_transactions` vacía), pero es **basura acumulativa en la BD local**. Ya documentado en globalmp — **2ª playa que lo reproduce**, candidato a promover a defecto formal.

2. **El YAML del cliente está desactualizado en 2 VGs de visitas**: `signatureVisit` y `userCanUploadFiles` figuran como activas y su valor efectivo en `global_configuration` es `false` en ambas. No es defecto de app — es dato de perfil a corregir.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 Botón **`Agregar` del `ion-modal#eventModal` NO responde a `pg.mouse.click`** | universal (candidato) | Su `getBoundingClientRect()` es válido, pero `document.elementFromPoint(x,y)` en ese punto devuelve **`ION-BUTTON.botonAddLila`** — el botón "AÑADIR ACTIVIDAD/EVENTO" del **form de fondo**. Un `mouse.click` ahí re-dispara el form subyacente en vez de agregar. **Fix: `b.shadowRoot.querySelector('button').click()`** (funcionó al 1er intento). Es un hermano nuevo del anti-patrón "rect válido ≠ punto clickeable": acá el punto es clickeable pero pertenece a OTRO elemento. `[el_palmar-20260805]` |
| El rect del botón `Agregar` **se desplaza y=539→400 y vuelve a 539** | universal | Al aparecer el `ion-select` de Motivo el layout del modal se recompone. **Releer coords inmediatamente antes de clickear**, nunca cachearlas. Confirma el quirk 9 del prompt. `[el_palmar-20260805]` |
| **Empresa en VISITAS: preseleccionada, sin `formcontrolname`, objeto completo como `value`** | cliente (el_palmar) | 4ª variante del selector de empresa en la corrida. `disabled=false`, `ng-valid`, no entra en la validación (Guardar/Enviar dependen solo de cliente + ≥1 evento). Contrasta con CLIENTES (editable, vacío, obligatorio). **Refuerza: leer la variante por módulo, no asumirla.** `[el_palmar-20260805]` |
| Etiquetas de alert del módulo VISITAS (reparto real) | cliente (el_palmar) | Guardado → `[OK]` · Borrado → `[CANCELAR, Aceptar]` + `[OK]` · Envío → `[CANCELAR, Aceptar]` → `[OK]` → `[OK]` · Dirty-guard → `[Guardar y salir, Salir sin guardar, Cancelar]` · Coordenadas → `["", "Agregar"]` (idx0 vacío = Cancelar). **El borrado usa `Aceptar`, NO `Eliminar`** (contrasta alipascua). Confirma: la etiqueta se LEE, no se predice. `[el_palmar-20260805]` |
| **Envío = 3 alertas con la Ref en la 3ª** | universal (3ª confirmación) | `Visita nro. <Ref> enviada exitosamente` — la Ref del servidor se lee del texto, sin ir a BD. Alinea con `[gmp-20260730]`; contrasta con las 2 alertas de insumar/don-theo. `[el_palmar-20260805]` |
| Alert "sucursal sin coordenadas" dispara **al SELECCIONAR el cliente y al REABRIR** la visita, **NO antes del dirty-guard** | cliente (el_palmar) | Cliente 1000000803 (sucursal DESPACHO 51123 sin coords). En el Back el dirty-guard sale **directo**, sin el alert de coordenadas intercalado — contrasta con piercar/dm-electronica (Back#1→coordenadas, Back#2→dirty-guard). No bloquea Guardar/Enviar. `[el_palmar-20260805]` |
| `transaction_statuses` **no cubre visitas** | universal | Sin tipo `vis` (solo `ped/cob/dev/inv/dep`). El estado fiable de una visita es **`visit.st_visit=2`=Enviado** + `is_visited=true`, no `transaction_statuses`. `[el_palmar-20260805]` |
| BD local: `visits` / `incidences` (PLURAL); `incidences` = `co_incidence, id_visit, co_visit, co_type, co_cause, tx_description` | universal | Reconfirma `[gmp-20260730]`. `st_visit` local: **`0`=Guardado**, **`2`=Enviado**. `local-query.js` inoperante (sin `sqlite3`) → todo por `window.sqlitePlugin`. `[el_palmar-20260805]` |
| `comp.textCommentMaxLength` expuesto en el componente `app-visita` | universal | Permite leer el límite real (255) **sin teclear**; el `ion-input` del modal lo refleja en `maxlength`. Verificado empíricamente: 300 tecleados → 255 aceptados. `[el_palmar-20260805]` |
| Probar "sin datos" de RUTA DE HOY con 3 señales | universal | `comp.listaVisitas.length` + tabla local `visits` + texto "No hay resultados". Las 3 coincidieron ⇒ N/A estructural **probado**, no supuesto. `[el_palmar-20260805]` |

---

*Watchdog: 0 cuelgues · 0 reconexiones · módulo dentro del techo de 45 min.*

> ✅ consolidado 2026-08-05
