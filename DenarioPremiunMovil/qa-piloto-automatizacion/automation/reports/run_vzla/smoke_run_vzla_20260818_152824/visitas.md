# Smoke Test — Módulo VISITAS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260818_152824_smoke-completo` |
| Módulo | VISITAS |
| Cliente | `run_vzla` |
| Empresa | `FERRE_N` / `id_enterprise=1` · rótulo UI **`CORPORACION FERRE 19`** (`lb_enterprise`) |
| App | `com.kiberno.denarioPremiumPro` · v**1.0** / db**19** · `window.ng=true` · `sqlitePlugin` disponible |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` · 360 × 744 |
| Playa | **LA TORTUGA** — `http://denariolatortuga.ddns.net:8081/PremiumWS/services/visitservice/visit` (host de los 7 POST capturados por el hook; `Set` de hosts con 1 solo elemento) |
| Usuario QA | `***` / `***` · `id_user 470` · `co_user '000208'` |
| Cliente de prueba | `006831` FERRETERIA EPA, C.A (`id_client=4163`, `id_address_client=17676`) |
| Resultado | **13 PASS · 1 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED** |
| Watchdog | `moduleMs=50 min`, `page` pasado · **0 cuelgues**, 0 `CDP-DOWN:` |
| Hook de payload | heredado y **vivo** (`__qaDataHook=true`, 114 payloads al arrancar → 141 al cerrar) · **NO se reinstaló** |
| Namespace propio | `window.__qaVIS` (14 skills) — `window.__qaH` llegó **vacío** (`Object.keys()` = `[]`), así que no había nada que heredar salvo el hook |

### VGs del módulo — leídas EN VIVO, no del dump

> ⚠ `app-visita` **NO expone ninguna clave `*LogicService`** (`Object.keys(comp)` no trae ninguna que
> termine así). Se cayó a los oráculos del DOM + BD local, como en DEPÓSITOS de `[grupo_fiel-20260817]`.

| VG | Perfil | Medido en el dispositivo | Efecto observado |
|---|---|---|---|
| 🟢 `visitRout` | `true` | RUTA DE HOY trae datos | **1 ítem al abrir** (la visita que la QA cargó a mano hoy) y 4 al cerrar. **NO trae ruta planificada** — ver DM-VIS-025/026 |
| 🔴 `userMustActivateGPS` | `true` | `true` | **NO produjo la guarda de segundos de los otros 3 módulos** — ver H-2. Coordenada capturada en las 5 visitas |
| `userCanSaveGPS` | `true` | — | `coordenada` no vacía en local, payload y nube (`11.0487251,-63.8647711`) |
| `signatureVisit` | `true` | acordeón **Firma** presente (`<canvas>` 280×220) | **habilita, no obliga**: las 3 visitas se enviaron sin firma (`nuAttachments=0`) |
| `userCanUploadFiles` | `true` | acordeón **Archivo** ("Subir Archivo") presente | ✅ |
| `showCamera` | `true` | acordeón **Imágenes** con BUSCAR FOTO / TOMAR FOTO | ✅ (no se tocó: política de adjuntos) |
| `requiredComment` | `true` (global) | **NO aplica en VISITAS** | `ion-input` Comentario del `#eventModal` llega `required=false`; se agregó un evento con el campo **vacío** (`comentario:""`) y la visita quedó Guardable **y** Enviable |
| `longitudComentario` | `250` | `maxlength` real = **255** · `comp.textCommentMaxLength` = **255** | la VG **no** gobierna el tope real — y esos 5 caracteres de más son justamente lo que rompe el envío (**H-1**) |
| `transactionCoordinateRadius` | `false` (booleano) | sin efecto observable | la sucursal tiene coordenadas ⇒ nunca se ejerció el alert de radio |
| `rolPlanta` | `true` / `transportRole` `false` | `comp.rolTransportista` presente, `estadoDespacho`/`observacionDespacho`/`showReagendarModal` en el componente | ⇒ explica el recorte del catálogo de actividades (ver Descubrimientos) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VIS-001 | ✅ PASS | Entrada desde HOME en **1,16 s**. Título `Visitas` + 3 `ion-button`: **NUEVA VISITA (180,107) · RUTA DE HOY (180,176) · Ver mejor ruta (180,245)**, los 3 `disabled=false` |
| DM-VIS-003 | ✅ PASS | NUEVA VISITA → `/visita` en 6,85 s. `ACTIVIDADES` y `ADJUNTOS` **`disabled=true`**, `GENERAL` habilitada; `#clienteSelect` vacío; `imagenGuardar`/`imagenEnviar` ambos `disabled=true` |
| DM-VIS-004 | ✅ PASS | RUTA DE HOY → `/listaVisitas` en **1,06 s** (`app-lista-visita`, singular). `ion-searchbar` visible, 1 ítem, sin error ni overlay pegado. `visitRout=true` cumplido |
| DM-VIS-006 | ✅ PASS | Trash de la Guardada `1787088843788.0` → `Denario - Visita`/"¿Desea borrar la visita? Esta acción no se puede deshacer." `[CANCELAR, **Aceptar**]` → `Denario`/"Se eliminó la visita de manera exitosa" `[OK]`. Lista 5→4, fila fuera de `visits`, `count=0` en la nube. ⚠ **su incidencia sobrevive huérfana** (ver Descubrimientos) |
| DM-VIS-010 | ✅ PASS | `006831` = **ítem 0 de 50** en `#clienteSelectModal` (1.569 clientes, **sin paginar**). Tras el click: `hasClient=true`, `ACTIVIDADES`/`ADJUNTOS` `disabled=false`, **Sucursal cargada** (AV USLAR C/C MICHELENA…, `10.4187553,-66.867879`). **Sin alert de coordenadas** — la sucursal las tiene |
| DM-VIS-014 | ✅ PASS | `ion-modal#eventModal` abrió al **1.er click** (3 de 3 veces en el módulo, sin el reintento de `[kron-20260817]`). Selector Actividad (11 opciones), Motivo (0 hasta elegir actividad), Comentario `maxlength=255` `required=false`, botones `CANCELAR (107,539)` / `Agregar (253,539)` |
| DM-VIS-015 | ✅ PASS | Actividad y Motivo por **`ion-popover` (1 click)**; `Agregar` por `b.shadowRoot.querySelector('button').click()` al **1.er intento en las 5 aperturas**. `listaEventos` 0→1; ítem "Actividad: MERCHANDISING Evento: VISIBILIDAD PDV Observación:" |
| DM-VIS-019 | ✅ PASS | Guardar → `Denario`/"**La visita se ha guardado**" `[OK]`; **el formulario permanece abierto** (`/visita`). `.imagenGuardar` pasa a `disabled=true` (anti-doble-guardado) y `.imagenEnviar` a `false`; `changesMade=false`. Local: `co_visit=1787088154545.0`, `id_visit=0`, `st_visit=0`, 2 `incidences` (`seq` 1→3) |
| **DM-VIS-020** | ❌ **FAIL** | 🔴 **La visita con comentario de 255 caracteres NUNCA llegó al servidor y no hay forma de saberlo desde la app.** Salieron solo **2** de las 3 alertas (faltó la que trae la Ref), el ítem quedó en **"Por Enviar"** —no "Visitado"—, `id_visit=0` y `pending_transactions` con 1 fila **13 min después**. Ver **H-1**. ✅ El mismo flujo con comentario ≤120 caracteres **sí** completa: **3 alertas, Ref 2084 y Ref 2086**, `st_visit=2`, `is_visited=true`, `BD-OK` + `BD-FIELD-OK` |
| DM-VIS-021 | ✅ PASS | Back con cambios sin guardar → `¡Alerta!` (mensaje **vacío**) `[Guardar y salir, Salir sin guardar, Cancelar]` |
| DM-VIS-022 | ✅ PASS | "Salir sin guardar" sobre visita **nueva nunca guardada** (cliente + 1 evento EVENTOS/SUPERVISION DE EVENTOS): **`sqlite_sequence.incidences` 6 → 6**, `visits` 4→4, `incidences` 6→6 ⇒ **no insertó nada** (prueba negativa, más fuerte que "la lista sigue igual"). No aparece en RUTA DE HOY |
| DM-VIS-023 | ✅ PASS | Reapertura de la Guardada desde la lista en **2,26 s**: 3 tabs habilitadas, `#clienteSelect` editable, Guardar y Enviar `disabled=false`. **Round-trip §9 intacto**: cliente, los 2 eventos, actividad/motivo y el comentario de **255** caracteres |
| DM-VIS-025 | 🚫 N/A | **N/A estructural PROBADO con 3 señales**, no supuesto: (a) `comp.listaVisitas` = 1 ítem, `isVisited=true`; (b) tabla local `visits` = 1 fila (`st_visit=2`); (c) nube `visit WHERE id_user=470` = 1 fila con `is_visited=true`. **Ninguna visita "No Visitado" bajada del backend** ⇒ el botón INICIAR VISITA no existe en pantalla |
| DM-VIS-026 | 🚫 N/A | Depende de DM-VIS-025 (sin visita "No Visitado" no hay INICIAR VISITA) |
| DM-VIS-031 | ✅ PASS | Con 1 evento cargado (MERCHANDISING/ENTREGA DE MUESTRAS, comentario de 60 car.), Back → dirty-guard → **"Guardar y salir"** → `Denario`/"La visita se ha guardado" `[OK]` → `/visitas`. En RUTA DE HOY: **Estatus Guardado con su evento**; al reabrirla, `listaEventos=1` con actividad, motivo y comentario correctos |
| DM-VIS-032 | ✅ PASS | Tab ADJUNTOS con los **3 acordeones**: `images` (BUSCAR FOTO / TOMAR FOTO), `file` (Subir Archivo, `userCanUploadFiles=true`), `sign` (Firma con `<canvas>` 280×220, `signatureVisit=true`). Verificado **sin dibujar** ni tocar la cámara |

---

## Registros creados en sistema

| Ref | `co_visit` (epoch) | Detalle | Estado |
|-----|--------------------|---------|--------|
| **—** (Nro. Ref. 0) | `1787088154545.0` | 2 eventos: MERCHANDISING/VISIBILIDAD PDV (comentario vacío) + COBRANZA/RETENCION (**comentario de 255 car.**) | 🔴 **"Por Enviar" — atascada. Enviada a las 17:24, NO llegó a la nube. `pending_transactions` con 1 fila y 5 reintentos de POST** |
| **2084** | `1787088554798.0` | 1 evento MERCHANDISING/ENTREGA DE MUESTRAS (comentario de 60 car.). Creada con "Guardar y salir" | ✅ **Enviada** · `st_visit=2` · `is_visited=true` · `BD-OK` + `BD-FIELD-OK` |
| **2086** | `1787088727281.0` | 2 eventos: MERCHANDISING/PLAN SLIP + COBRANZA/COBRANZA EFECTIVA (comentarios de 18 car.) | ✅ **Enviada** · `st_visit=2` · `is_visited=true` · `BD-OK` + `BD-FIELD-OK` |
| — (Nro. Ref. 0) | `1787088843788.0` | 1 evento NO VISITO/MOTIVOS PERSONALES — creada **solo** para ejercer el trash | 🗑 **Borrada** (DM-VIS-006). Nunca llegó a la nube ✅. ⚠ dejó su `incidences` huérfana |
| — (sin `co_visit`) | — | Visita nueva de DM-VIS-022 (cliente + 1 evento) | ✅ **Descartada sin persistir** — `sqlite_sequence.incidences` 6→6 |

### Diff de baseline — filtrado por `id_user = 470` (tenant vivo, 7 vendedores transaccionando)

| Momento | `count(*)` de `visit` (id_user=470) | `count(DISTINCT co_visit)` | `max(id_visit)` global |
|---|---|---|---|
| Baseline (inmediatamente antes del 1.er Enviar) | **1** | 1 | 2080 |
| Cierre del módulo (2.º pase) | **3** | 3 | **2086** |

**+2, sin duplicados** (`count = count(DISTINCT)`), y **falta 1 de los 3 enviados**. El `max(id_visit)` global saltó
de 2080 a 2086 mientras el usuario QA solo consumió **2084** y **2086**: los ids 2081-2083 y 2085 son de otros
vendedores ⇒ **6.ª confirmación de que `max(id)+1` NO predice la Ref propia**; la Ref se lee de la 3.ª alerta.
`failed_transactions` = **0** durante todo el módulo (la cola de rechazos **no** capta este caso).

### Verificación BD — cotejo campo a campo (payload ↔ nube)

| Registro | Cabecera | Hijas (`incidence`) | Marca |
|---|---|---|---|
| **Ref 2084** | 20/20 campos (`coVisit`, `coordenada`, `idClient`, `coClient`, `naClient`, `nuSequence`, `idUser`, `coUser`, `coEnterprise`, `idEnterprise`, `idAddressClient`, `coAddressClient`, `coordenadaSaved`, `hasAttachments`, `nuAttachments`, `isReassigned`, `isDispatched`, `isVisited`, `daVisit`, `daReal`) | 1/1 — `co_incid 2161`, `co_type 47`, `co_cause 153`, `tx_description` de 60 car. **idéntico** | **BD-FIELD-OK** |
| **Ref 2086** | 20/20 | 2/2 — `co_incid 2164` (47/191) y `2165` (82/182), ambos `tx_description` de 18 car. **idénticos** | **BD-FIELD-OK** |
| `1787088154545.0` | — | — | **BD-QUEUED** (no existe fila en la nube: `SELECT count(*) FROM visit WHERE co_visit='1787088154545.0'` → **0**) |

**Excluidos del veredicto** (campos del servidor): `id_visit` (llega `null`), `st_visit` (payload `1` → nube `2`),
`da_created`, `da_update`, `st_integrador`, `st_coordinate`.
📌 **Nota de zona horaria, no mismatch (§10.b):** `daVisit` local `2026-08-18 17:28:12` ↔ nube
`2026-08-18T21:28:12Z` — mismos minutos y segundos, device en UTC-4.

---

## 🔴 EL HALLAZGO CENTRAL — ejercido con un experimento controlado de 3 visitas

No se dedujo del código: se aisló variando **una sola cosa por vez**.

| # | Visita | Nº de eventos | Largo del comentario | Alertas | Resultado |
|---|---|---|---|---|---|
| 1 | `1787088154545.0` | **2** | **255** | **2** (falta la de la Ref) | 🔴 **nunca llegó**, atascada en cola |
| 2 | `1787088554798.0` | **1** | 60 | **3** (`Visita nro. 2084 enviada exitosamente`) | ✅ llegó en ~14 s |
| 3 | `1787088727281.0` | **2** | 18 y 18 | **3** (`Visita nro. 2086 enviada exitosamente`) | ✅ llegó en ~7 s |

La visita 3 **descarta el confusor**: con **dos** incidencias y comentarios cortos, el envío completa perfecto
⇒ la multiplicidad de eventos no tiene nada que ver. **La única variable que queda es el largo del comentario.**

Y el mecanismo está medido en el esquema, no supuesto:

```sql
SELECT column_name, data_type, character_maximum_length
  FROM information_schema.columns WHERE table_name='incidence';
-- tx_description | character varying | 120
```

⇒ **`incidence.tx_description` es `varchar(120)` en la nube, pero la app deja escribir 255.**

---

## Descubrimientos

### ✅ Pendientes del YAML resueltos por este módulo

| # | Pendiente | Resolución medida |
|---|---|---|
| 4 | Alcance real de `requiredComment` | 🔴 **En VISITAS NO aplica.** El `ion-input` del `#eventModal` llega `required=false` y el evento se agregó con el campo **vacío** (`comentario:""`, `listaEventos` 0→1), sin alert ni bloqueo, dejando la visita Guardable y Enviable. ⇒ **5.º módulo de la corrida donde `requiredComment=true` no aplica** (pedidos, devoluciones, inventarios, visitas; en `[grupo_fiel-20260817]` aplicaba solo a cobros). El `maxlength` real es **255** contra `longitudComentario=250` — 4.º módulo con el mismo desfase |
| 8 | `rolPlanta=true`: ¿habilita algo observable? | **Sí, pero solo en el modelo**: `app-visita` expone `rolTransportista`, `estadoDespacho`, `observacionDespacho`, `showReagendarModal`, `reagendarData`, `motivoReagendo`, `fechaReagendo`. **Ninguno se renderiza** con este usuario (`transportRole=false`), y explica el recorte del catálogo de actividades (abajo) |

### 🔴 El catálogo de actividades NO se filtra solo por `co_operation='D'` — el ROL recorta 3 más

El perfil anticipaba 14 activas de 46. **En el dispositivo bajan 11.**

| Fuente | Nº | Detalle |
|---|---|---|
| Nube `incidence_type` (total) | 46 | — |
| Nube `incidence_type` activas (`co_operation <> 'D'`) | **14** | +89 DEPACHADO, 90 NO DESPACHADO, 91 DESPACHO PARCIAL |
| BD local `incidence_types` | **11** | 2 · 47 · 71 · 75 · 82 · 83 · 84 · 85 · 86 · 87 · 88 |
| `comp.listaActividades` y `ion-select-option` del modal | **11** | idénticos |

Las **3 que no bajan (89, 90, 91) son exactamente las 3 con `required_signature=true`** y las tres son de
despacho — coherente con **`transportRole=false`**. ⇒ **`co_operation='D'` explica 32 de las 35 ausencias, no las 35.**
**Regla operativa:** contar el catálogo en la BD **local** (`incidence_types`), no en la nube, antes de decidir
si "faltan actividades" es un defecto. Las 11 traen `required_event="true"` / `required_signature="false"` —
el set estándar de El Yaque/La Tortuga, idéntico a jerez/ferrenuestro/dm-electronica.

### 🔑 `comp.listaMotivos` trae el catálogo MAESTRO — 2.ª confirmación (tras kron)

`comp.listaMotivos.length = **92**` de forma constante, mientras el `ion-select` de Motivo renderiza el set
filtrado correcto. Leer el modelo hace parecer que **el filtro por actividad está roto** (falso FAIL).
**El oráculo es `s.querySelectorAll('ion-select-option')`.** Motivos medidos en el DOM:

| Actividad | Motivos renderizados |
|---|---|
| MERCHANDISING (47) | **5** — ENTREGA DE MUESTRAS (153) · LEVANTAMIENTO DATA ISSY · VISIBILIDAD PDV (184) · PLAN SLIP (191) · MUESTRA NUEVO CATALOGO |
| COBRANZA (82) | **4** — COBRANZA EFECTIVA (182) · COBRANZA PARCIAL · RETENCION (189) · COBRANZA + RETENCION |
| NO VISITO (2) | **4** — MOTIVOS PERSONALES · REUNION OTRO CLIENTE · REUNION OFICINA · VACACIONES |
| EVENTOS (86) | **1** — SUPERVISION DE EVENTOS |

### 🔴 `VIS-INCIDENCIA-HUERFANA` — 4.ª confirmación, 3 playas, 4 clientes

Al borrar la visita Guardada `1787088843788.0`, la fila sale de `visits` (UI y tabla ✅) pero
**su incidencia sobrevive**:

```sql
SELECT i.co_incidence, i.co_visit FROM incidences i
 WHERE NOT EXISTS (SELECT 1 FROM visits v WHERE v.co_visit = i.co_visit);
-- co_incidence 7 | co_visit 1787088843788.0
```

Acumulado: La Tortuga `[gmp-20260730]` · El Yaque `[grupo_fiel-20260817]` · Isla Coche `[kron-20260817]` ·
**La Tortuga `[run_vzla-20260818]`**. Impacto: **basura acumulativa en la BD LOCAL; la nube no se ve afectada**
(la visita nunca llegó al servidor). 📋 Sigue **pendiente de tipificación formal** — no se abre acá.

### 🟢 Selector de EMPRESA — 7.ª confirmación de la variante "objeto completo"

1 solo `ion-select` visible en el Tab General, **sin `formcontrolname`**, `disabled=**true**`, `ng-valid`,
`value` = **objeto de 9 claves** (`idEnterprise:1, coEnterprise:"FERRE_N", lbEnterprise:"CORPORACION FERRE 19",
coCurrencyDefault:"US$", prioritySelection:0, enterpriseDefault, naEnterprise:"CORPORACION FERRE 19, C.A.",
nuRif, txAddress`), shadowRoot rotulando **`CORPORACION FERRE 19`**. **No se tocó nada** y los 3 envíos
viajaron con `idEnterprise:1` / `coEnterprise:"FERRE_N"` correctos.
📌 Al seleccionar cliente aparece un **2.º `ion-select` (Sucursal)**, también sin `formcontrolname`, pero
`disabled=**false**` ⇒ **dos variantes distintas en el MISMO formulario**: leer cada control, siempre.

### ⚠ Etiquetas de alert medidas en este módulo (leídas, nunca predichas)

| Momento | Título | Mensaje | Botones |
|---|---|---|---|
| Guardado | `Denario` | `La visita se ha guardado` | `[**OK**]` |
| Envío · paso 1 | `¡Alerta!` | `¿Desea enviar la visita?` | `[CANCELAR, **Aceptar**]` |
| Envío · paso 2 | `Denario Visitas` | `Su Visita será enviada` | `[**OK**]` |
| Envío · paso 3 | `Denario Premium` | `Visita nro. <Ref> enviada exitosamente` | `[**OK**]` — 🔴 **solo si el servidor aceptó** |
| Borrado · paso 1 | `Denario - Visita` | `¿Desea borrar la visita? Esta acción no se puede deshacer.` | `[CANCELAR, **Aceptar**]` |
| Borrado · paso 2 | `Denario` | `Se eliminó la visita de manera exitosa` | `[**OK**]` |
| Dirty-guard | `¡Alerta!` | *(vacío)* | `[Guardar y salir, **Salir sin guardar**, Cancelar]` |

**Los ~20 alerts del módulo se resolvieron sin un solo reintento** recorriendo `['Aceptar','OK','Eliminar']`
por igualdad exacta case-insensitive con filtro `width>0`. Case **mixto** (CANCELAR en mayúsculas, Aceptar
capitalizado) dentro de la misma alerta — comparar siempre en minúsculas.

### ⚠ La 3.ª alerta es el ÚNICO acuse de recibo del servidor — y su ausencia es el síntoma

Es la 7.ª corrida con el patrón "envío = 3 alertas y la Ref viene en la 3.ª", pero acá se descubre **para qué
sirve realmente**: las alertas 1 y 2 son **locales** (confirmación y "será enviada"), y **solo la 3.ª prueba que
el servidor aceptó**. Cuando el POST falla, salen las 2 primeras, la app **navega igual** a `/visitas` y el
vendedor se lleva la impresión de haber enviado.
🔑 **Oráculo operativo:** `.imagenEnviar` en `disabled` es "enviando"; **la 3.ª alerta es "enviado"**.
Un agente que corte tras la 2.ª alerta marca PASS sobre un registro perdido.

### ⚠ Dirty-guard: **NO** aparece al salir de un form recién Guardado, **sí** al salir de uno reabierto

| Situación | ¿Alert? |
|---|---|
| Back desde el form **recién Guardado** (`changesMade=false`) | **No** — sale directo a `/visitas` |
| Back desde el form **reabierto** desde RUTA DE HOY | **Sí** — al reabrir, `changesMade` vuelve a `true` sin que el usuario toque nada |
| Back con cambios sin guardar | **Sí** (DM-VIS-021) |

⇒ En VISITAS **Guardar SÍ deja el formulario pristine** — igual que DEVOLUCIONES e INVENTARIOS de esta corrida,
al contrario de PEDIDOS. **3.ª confirmación de que el patrón es POR MÓDULO, no del build.**

### ⚠ El buscador de RUTA DE HOY no encuentra por Nro. Ref ni por Estatus — refuerza H-3 de DEVOLUCIONES

Filtra **on-keyup** (sin lupa) y repuebla solo al vaciar (⇒ `PRD-BUSCADOR-NO-REPUEBLA` **no** reproduce acá, 4.ª acotación a PRODUCTOS):

| Texto | Ítems |
|---|---|
| *(vacío)* | 4 |
| `FERRETERIA` | 4 |
| `2084` | **0** + empty-state |
| `Visitado` | **0** + empty-state |
| `ZZZQQ` | 0 + empty-state |
| *(vaciar)* | **4** ✅ |

Busca solo por **nombre/código de cliente**, que es una de las tres cosas que el ítem muestra. **Refuerza H-3 de
DEVOLUCIONES** (`351` → 0) y contrasta con **INVENTARIOS** (`52` → 1) ⇒ es implementación **por módulo**.
No se levanta como hallazgo nuevo: es el mismo H-3 ya reportado.

### ⚠ El defecto cosmético de "+4 h al reabrir" de `[gmp-20260730]` **NO reproduce en este build**

Guardada con `da_visit = 2026-08-18 17:18:05`; al reabrirla la UI rotula **"18/8/2026, 5:18 p. m."** = 17:18 ✅.
El modelo sí trae `2026-08-18T21:18:05` (UTC), pero **el render corrige**. Va como observación: la nota de
globalmp no se aplica a La Tortuga v1.0/db19.

### Otras confirmaciones

- **`sqlite_sequence`: `visits` NO tiene fila, `incidences` SÍ — 3.ª confirmación** (`seq` 1→3→4→6→7). Es la tabla sobre la que hay que hacer la prueba negativa en VISITAS.
- **La tabla local `visits` NO tiene columna `st_delivery`** (25 columnas, ninguna). El discriminador fiable de guardado-local es **`id_visit=0`**, y el de estado **`st_visit`**.
- **`st_visit` local en La Tortuga v1.0 — valor NUEVO documentado: `1` = "Por Enviar"** (en cola). Mapa completo medido: `0`=Guardado · **`1`=Por Enviar/en cola** · `2`=Enviado · `3`=fila de RUTA bajada del backend. Amplía `[gmp-20260730]`, que solo tenía 0/2/3.
- **`transaction_statuses` no se usó**: el estado fiable es `st_visit` + `is_visited` (3.ª confirmación tras el_palmar/difranca).
- **Los DOS `ion-select` del `#eventModal` abren `ion-popover` (1 click) — 6.ª evidencia** de "la variante de overlay la fija el CONTROL". `value` = objetos (`{idType,naType,requiredEvent,requiredSignature}` y `{idType,idMotive,naMotive}`) ⇒ la vía programática por string está descartada, pero el click real resuelve. **0 `ion-alert` de radios en todo el módulo.**
- **Motivo con carga diferida ~2-2,5 s** tras elegir Actividad (reconfirma 6 corridas).
- **`#clienteSelectModal` no paginó** pese a **1.569 clientes**: `006831` fue el **ítem 0 de 50** en las 5 aperturas. `waitForFunction` sobre `show-modal` + `ion-item.length>0` resolvió a la 1.ª siempre; click al **centro del `<p>` del nombre** (y≈182) acertó **5 de 5**. No hizo falta `setClientfromSelector` ni la lupa.
- **Back — inventario real de `img.fechaAtras`:** en `/visita` hay **4** nodos, de los cuales **2 con rect 0×0** (vistas anteriores montadas) y de los visibles el bueno es el de **(32,31)** con `hasA=true`; el de (323,32) es otra acción. En `/visitas` hay **2** visibles y el bueno vuelve a ser (32,31); en `/listaVisitas` el back opera en **(32,47)**. `mouse.click` engancha en los tres (patrón ferrenuestro/insumar, **no** el `.click()` nativo de jerez). Filtrar por `width>0` es obligatorio.
- **La app quedó en HOME** (`app-home`, 0 alerts, 0 modals, 0 loadings) para PRODUCTOS y VENDEDORES.

---

## Hallazgos

### 🔴 H-1 · Un comentario de más de 120 caracteres hace que la visita **nunca llegue al servidor**, sin ningún aviso y sin recuperación

**Severidad: ALTA — pérdida silenciosa de datos de campo.**
**Supera el gate de §4.b:** se reprodujo **hoy**, en la build bajo prueba, con un registro **creado en esta corrida**,
y se aisló con un experimento controlado de 3 visitas (tabla de arriba).

**Qué pasa.** El campo Comentario del modal de actividad acepta **255 caracteres** (`maxlength="255"` y
`comp.textCommentMaxLength=255`), pero la columna destino en la nube es **`incidence.tx_description varchar(120)`**.
Al enviar, el POST `visitservice/visit` sale con el texto completo, el servidor no lo puede insertar y **la
transacción nunca se confirma**.

**Por qué es grave: el vendedor no tiene forma de enterarse.**

| Señal | Visita sana | Visita con comentario >120 |
|---|---|---|
| Alertas de envío | 3 (la 3.ª trae la Ref) | **2** — falta justo la del acuse |
| Navegación tras Enviar | vuelve a `/visitas` | **vuelve a `/visitas` igual** |
| Estatus en RUTA DE HOY | `Visitado` | `Por Enviar` |
| `id_visit` local | `2084` / `2086` | **`0`** |
| `pending_transactions` | vacía | **1 fila, 13 min después** |
| `failed_transactions` | 0 | **0** — 🔴 **la cola de rechazos NO lo capta** |
| Fila en la nube | sí | **no** (`count(*)` = 0) |

**Y reintenta para siempre.** El hook capturó **7 POST** a `visitservice/visit` en el módulo: 1 por la Ref 2084,
1 por la Ref 2086 y **5 de la misma visita atascada**, todos con payload idéntico y correcto. Es un bucle de
reintento que no converge y que se llevará ancho de banda del vendedor indefinidamente.

**Pasos de reproducción (2 min):**
1. VISITAS → NUEVA VISITA → cliente `006831`.
2. Tab ACTIVIDADES → AÑADIR ACTIVIDAD/EVENTO → cualquier actividad y motivo.
3. Comentario: pegar **más de 120 caracteres** (el campo admite hasta 255).
4. Agregar → Enviar → Aceptar → OK.
5. Observar: solo salen 2 alertas, la visita queda "Por Enviar" y no aparece en `visit` de la nube.

**Contrafactual, en la misma sesión y el mismo cliente:** la misma secuencia con **60** caracteres produjo
`Visita nro. 2084 enviada exitosamente` en ~14 s, y con **2 eventos** de 18 caracteres, `Ref 2086` en ~7 s
(⇒ el número de eventos no interviene).

**Sugerencia para desarrollo (elegir una, no las tres):**
- **(a) La barata y correcta:** alinear el tope del cliente con el de la BD — `TEXT_COMMENT_MAX_LENGTH = 120`
  para VISITAS, o ampliar `incidence.tx_description` a 255. **Ojo:** la VG `longitudComentario` vale **250**,
  o sea que las tres fuentes (VG, constante de la APK y columna) están en tres valores distintos.
- **(b) La imprescindible pase lo que pase:** que un POST rechazado caiga en `failed_transactions` y **avise al
  usuario**. Hoy un error de servidor es indistinguible de "sin señal", y la app reintenta en silencio para siempre.
- **(c) Deseable:** techo de reintentos con backoff.

📌 **Riesgo transversal a verificar fuera de VISITAS:** el mismo desfase 255-vs-columna puede existir en los
comentarios de PEDIDOS, DEVOLUCIONES e INVENTARIOS. En esta corrida no reprodujo **porque los comentarios que
se cargaron eran cortos**, no porque esté descartado. Vale un chequeo de `character_maximum_length` de los
`tx_comment` de esas tablas antes de cerrar la release.

### 🟢 H-2 · La guarda de GPS **NO se manifiesta en VISITAS** — 4.ª medición, y corrige la hipótesis de escalada

**Este es el módulo más ligado al GPS de la corrida** (`userMustActivateGPS=true`, coordenada obligatoria en
cada visita) y, contra lo esperado, **es el más rápido de los cuatro**. Se midió **7 veces**:

| Acción | Espera hasta que aparece la vista |
|---|---|
| Entrar al módulo desde HOME | **1,16 s** |
| RUTA DE HOY (×2) | **1,06 s** / 1,26 s |
| 1.er NUEVA VISITA (caché fría, ~4 h desde el módulo anterior) | **6,85 s** |
| NUEVA VISITA (×3 siguientes) | **2,05 s** · 1,56 s · ~1,5 s |
| Reabrir un Guardado desde la lista (×2) | **2,26 s** / 1,59 s |

**Ninguna medición pasó de 7 s**, contra los 30,3 s de PEDIDOS, 43,1 s de DEVOLUCIONES y ~87 s de INVENTARIOS
**del mismo dispositivo y la misma corrida**. Y la variante de indicador es la **tercera** distinta: acá hay
`ion-loading` **con mensaje legible "Cargando..."** (devoluciones: sin ningún indicador; inventarios: loading con
el mensaje **vacío**).

⇒ **Consecuencia para el triaje del defecto de la guarda de GPS:** el patrón **no** es "escala con lo ligado que
esté el módulo al GPS" — VISITAS lo desmiente por completo. La correlación que queda en pie es con el **volumen
de datos que el formulario carga al abrir** (INVENTARIOS trae stocks y sugerido; VISITAS abre casi vacío).
**El techo de ≥120 s recomendado por INVENTARIOS se mantiene** como regla de automatización (hay que cubrir el
peor caso), pero **no** hay que atribuirle a VISITAS un problema que no tiene.

*(No se levantan, con evidencia: el envío sin firma con `signatureVisit=true` — la VG habilita, no obliga
(QA 2026-07-29), y ya está en RUNTIME §5; `maxlength` 255 vs `longitudComentario=250` — se subsume en H-1;
el buscador que no halla por Nro. Ref — es el H-3 de DEVOLUCIONES, mismo componente; la incidencia huérfana —
4.ª confirmación de un candidato ya abierto que gestiona el orquestador; DM-VIS-020 "modal de confirmación
antes de validar actividades" — defecto conocido, RUNTIME §5.)*

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **La 3.ª alerta de envío es el ÚNICO acuse del servidor — sin ella, el registro NO llegó** | universal | Alertas 1 y 2 (`¿Desea enviar la visita?` → `Su Visita será enviada`) son **locales** y salen igual cuando el POST falla; la app **navega a `/visitas` lo mismo**. **Oráculo obligatorio antes de marcar PASS de cualquier Enviar: esperar la 3.ª alerta (`… nro. <Ref> enviada exitosamente`) o `id_<x> > 0` en la BD local.** Un agente que corte tras la 2.ª marca PASS sobre un registro perdido. |
| 🔴 **`failed_transactions` NO capta los rechazos del servidor — no usarla como prueba de "no hubo error"** | universal | Con la visita atascada, `failed_transactions` estuvo en **0** todo el módulo mientras `pending_transactions` tenía la fila. **El mapa de RUNTIME §10 necesita el matiz: `BD-QUEUED` persistente es indistinguible de `BD-MISMATCH` desde el device.** La prueba real es `count(*)` en la nube por `co_<x>`. |
| 🔴 **El hook de payload cuenta los REINTENTOS: N POST del mismo `co_x` = transacción atascada** | universal | 7 POST a `visitservice/visit` para 3 visitas ⇒ 5 eran la misma. **Diagnóstico de 1 línea, sin BD:** agrupar `__qaPayloadsData` por `data.<entidad>.co<Entidad>` y buscar duplicados. Distingue "sync lenta" (1 POST pendiente) de "rechazo en bucle" (N POST idénticos). |
| 🔴 **Cotejar `character_maximum_length` de la nube contra el `maxlength` del input ANTES de teclear al tope** | universal | `incidence.tx_description` es `varchar(120)` y el input admite **255**. Consulta barata: `SELECT column_name, character_maximum_length FROM information_schema.columns WHERE table_name='<tabla>'`. **Y las tres fuentes pueden discrepar entre sí:** VG `longitudComentario`=250, constante de la APK=255, columna=120. |
| 🔴 **El catálogo del dispositivo se recorta también por ROL, no solo por `co_operation='D'`** | universal | Nube 14 activas → device **11**. Las 3 ausentes (89/90/91) son las de `required_signature=true`, todas de despacho, coherente con `transportRole=false`. **Contar el catálogo en la tabla LOCAL (`incidence_types`), nunca en la nube**, antes de llamar defecto a una actividad faltante. |
| 🟢 **La guarda de GPS NO escala con el acoplamiento al GPS — VISITAS es el más rápido** | universal | 7 mediciones, **máximo 6,85 s**, con `userMustActivateGPS=true`. Contra 30,3 s (pedidos) · 43,1 s (devoluciones) · ~87 s (inventarios) del mismo device y corrida. **3.ª variante de indicador: `ion-loading` con mensaje "Cargando..." legible.** Corrige la hipótesis de escalada; la correlación que sobrevive es con el volumen de datos que el form carga al abrir. |
| **`st_visit=1` = "Por Enviar" (en cola) — valor nuevo del mapa local** | universal | Mapa completo La Tortuga v1.0: `0`=Guardado · **`1`=Por Enviar** · `2`=Enviado · `3`=fila de RUTA del backend. Amplía `[gmp-20260730]`. ⚠ **La tabla local `visits` NO tiene `st_delivery`**: el discriminador de guardado-local es `id_visit=0`. |
| **`app-visita` NO expone `*LogicService`** | universal | 3.ª acotación (tras DEPÓSITOS de grupo_fiel y kron): `Object.keys(comp).find(k=>/LogicService$/.test(k))` → `undefined`. Sí expone `textCommentMaxLength`, `listaActividades`, `listaMotivos`, `listaEventos`, `changesMade`, `disableSaveButton`, `disableSendButton`, `rolTransportista`, `estadoDespacho`, `showReagendarModal`. |
| **Dos variantes de `ion-select` en el MISMO formulario** | universal | Tab General de VISITAS: **Empresa** sin `formcontrolname`, `disabled=true`, objeto de 9 claves (7.ª confirmación) **y** **Sucursal** sin `formcontrolname` pero `disabled=false`. ⇒ el corolario "leer cada control" vale **dentro** de un form, no solo entre forms. |
| **`b.shadowRoot.querySelector('button').click()` para `Agregar`: 5 de 5 al 1.er intento** | universal | 4.ª corrida confirmando `h.clickModalButton`. Y el `#eventModal` **abrió al 1.er click las 5 veces** — el quirk "el 1.er click no abre" de `[kron-20260817]` **no reprodujo** acá. |
| **`sqlite_sequence` sobre `incidences` certifica DM-VIS-022 — 3.ª confirmación** | universal | `seq` **6 → 6** tras "Salir sin guardar" con cliente + 1 evento cargados. `visits` sigue sin fila en `sqlite_sequence`. |
| **`incidence` de la nube es legible con GRANT completo** | cliente | 185/185 tablas con GRANT en `run_vzla` ⇒ ni `visit` ni `incidence` dieron permission-denied (contrasta con el gap de `visit_view` de kron). El cotejo campo-a-campo salió completo. |
| Coords estables (Infinix X6728, 360×744) | cliente | Home módulo: **NUEVA VISITA (180,107)** · **RUTA DE HOY (180,176)** · Ver mejor ruta (180,245). Form: tabs **GENERAL (60,90) · ACTIVIDADES (180,90) · ADJUNTOS (300,90)**; `#clienteSelect` **(180,196)**; `botonAddLila` **(180,147)**; header `imagenGuardar` **(267,32)** · `imagenEnviar` **(326,32)** · back **(32,31)**. `#eventModal`: Actividad **(180,298)** · Motivo **(180,379)** · Comentario **(180,467)** · CANCELAR **(107,539)** · Agregar **(253,539)**. Modal de clientes: input **(180,96)** · lupa **(325,95)** · `<p>` del ítem 0 **(167,182)**. Lista: searchbar **(180,104)** · ítems cada 97 px desde top 141 · trash **x=311** · back **(32,47)**. |

> OK consolidado 2026-08-19 -> module-selectors/ + RUNTIME.md  [run_vzla-20260818]

---

## Resumen técnico

**13 PASS · 1 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED · 0 cuelgues de CDP.** Wall-clock ≈ 32 min,
**20 `browser_run_code_unsafe`**, 0 reintentos de alert (~20/20 a la primera), 0 reintentos de selector.

1. 🔴 **El hallazgo del módulo es H-1 y es de severidad alta: un comentario de más de 120 caracteres hace
   que la visita nunca llegue al servidor, sin un solo aviso.** No se dedujo del código: se aisló con un
   experimento de 3 visitas que varía una sola cosa por vez (255 car./2 eventos → se pierde; 60 car./1 evento →
   Ref 2084; 18 car./**2 eventos** → Ref 2086, que descarta el confusor de la multiplicidad). El mecanismo está
   medido en el esquema: **`incidence.tx_description varchar(120)` contra un input que admite 255.** La visita
   quedó en `pending_transactions` **13 minutos**, con **5 POST reintentados**, `failed_transactions` en **0**
   y nada en la nube.
2. **El daño real no es el rechazo, es el silencio.** La app muestra 2 de las 3 alertas, **navega igual** a la
   lista y solo deja el rastro "Por Enviar". De ahí salen dos reglas nuevas para todos los agentes: la **3.ª
   alerta es el único acuse del servidor**, y **`failed_transactions` no capta estos rechazos** — la única
   prueba es `count(*)` en la nube.
3. **2 visitas Enviadas con cotejo campo a campo perfecto**: Ref **2084** (20/20 cabecera + 1 incidencia) y
   Ref **2086** (20/20 + 2 incidencias), ambas `BD-OK` + `BD-FIELD-OK`, sync inmediata (~7-14 s), sin duplicados
   (`count = count(DISTINCT)`), con el desfase de hora local↔UTC anotado como nota de TZ y no como mismatch.
4. 🟢 **H-2 corrige la hipótesis de la corrida sobre la guarda de GPS.** VISITAS es el módulo más atado al GPS
   y resultó **el más rápido de los cuatro**: 7 mediciones, máximo **6,85 s**, con `ion-loading` **con mensaje
   legible**. El defecto de la guarda no escala con el acoplamiento al GPS; el techo de ≥120 s se conserva como
   regla de automatización, pero **VISITAS no aporta una 4.ª confirmación del defecto — aporta un contraejemplo.**
5. **`requiredComment=true` NO aplica a VISITAS** (pendiente #4 del YAML cerrado para el 5.º módulo): evento
   agregado con el comentario vacío, y la visita quedó Guardable y Enviable.
6. **El catálogo de actividades se recorta también por ROL:** 46 en la nube → 14 activas → **11 en el device**.
   Las 3 que faltan son las de despacho (`required_signature=true`), coherente con `transportRole=false`.
   Pendiente #8 del YAML (`rolPlanta`) resuelto por esta vía.
7. **DM-VIS-025/026 N/A estructural PROBADO con 3 señales coincidentes** (componente + BD local + nube):
   no hay ninguna visita "No Visitado" bajada del backend, así que INICIAR VISITA no existe en pantalla.
   `visitRout=true` sí se cumple: RUTA DE HOY trae las visitas del día.
8. **4.ª confirmación de `VIS-INCIDENCIA-HUERFANA`** (3 playas, 4 clientes) al borrar una Guardada: la fila sale
   de `visits` y su `incidences` sobrevive. Impacto local, la nube no se afecta.
9. App devuelta a **HOME** limpia (0 alerts, 0 modals, 0 loadings) para PRODUCTOS y VENDEDORES.
   🔴 **Queda 1 registro atascado en la cola del dispositivo** (`co_visit 1787088154545.0`): se deja a propósito
   como evidencia viva de H-1 — **avisar a la QA antes de limpiarlo**.

---
Agente: **VISITAS** · modelo Opus · RUN_ID `20260818_152824_smoke-completo`
