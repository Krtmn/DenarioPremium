# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Visitas

---

### Alcance y exclusiones

Este guion cubre el módulo de visitas de Denario Premium móvil en **Android**: pantalla de inicio del módulo, lista de visitas del día, formulario de nueva visita / edición (tabs General, Actividades, Adjuntos), guardar y enviar, salir con cambios, apertura de visitas por estatus, y flujo de visitas recibidas desde el backend (estatus «No Visitado»). Se documenta también el modo **transportista (Despachos)** como flujo condicional.

Constituye un **catálogo completo** de los flujos observables. En una corrida real se estima ejecutar ~**70 %** del guion; el resto quedará **N/A por configuración**, no FAIL.

**34 casos Manual-UI** en la tabla (`DM-VIS-001`–`034`). Si una VG, dato de catálogo o visita de backend no aplica en la cuenta QA, marcar **N/A** (no FAIL).

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA estándar que tenga acceso al módulo.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración esté activa en la empresa probada.

**Incluye:** acceso al módulo, "Ver mejor ruta" y botón "Ver ruta" en formulario, lista del día, búsqueda, eliminación, formulario (General / Actividades / Adjuntos), modal de eventos, guardar/enviar, salir con cambios (**Guardar y salir** / Salir / Cancelar), visitas Guardado / Visitado / No Visitado, flujo **Iniciar Visita**, adjuntos (imagen, archivo, firma según VG), y casos condicionales (transportista, firma, checkAddressClient, GPS obligatorio al iniciar).

**Excluye:** modo avión o revocar permiso GPS como **único** disparador de toda la corrida (ver supuestos); validación de la ruta exacta en Google Maps; pedido sugerido (`desdeSugerencia`); edición de visitas "Por Enviar" (supuesto 6). La **visualización de adjuntos en la web** se verifica en corrida integral post-envío (supuesto 11).

**Ubicación (GPS) en corridas:** la app lee la posición del **dispositivo Android** donde corre Denario (teléfono físico o emulador). Antes del módulo: ubicación activa y permiso concedido a la app. En emulador: fijar lat/lon en Android Studio (Extended controls → Location) o `adb emu geo fix`.

---

### Mapa rápido (inferido desde código / XML)

| Elemento | Detalle |
|---|---|
| Rutas Angular | `visitas` (home módulo), `visita` (formulario), `listaVisitas` (lista del día) |
| Home módulo | `src/app/visitas/visitas.component.ts / .html` |
| Formulario visita | `src/app/visitas/visita/visita.component.ts / .html` |
| Lista del día | `src/app/visitas/lista-visita/lista-visita.component.ts / .html` |
| Servicio central | `src/app/visitas/visitas.service.ts` — tags, listas de actividades/motivos, VG, coordenadas |
| PDF modal (transportista) | `src/app/visitas/vista-pdfComponent/visitaPdfModal.component` |
| Selector clientes embebido | `src/app/cliente-selector/cliente-selector.component.ts / .html` |
| Adjuntos | `src/app/adjuntos/adjunto/adjunto.component` |

**Pantallas y flujos:**

1. **Home módulo** → 3 botones: "NUEVA VISITA" / "RUTA DE HOY" / "Ver mejor ruta" (titles varía con rol).
2. **Lista del día** (`listaVisitas`) → visitas de hoy, searchbar, eliminar "Guardado", toque → formulario.
3. **Formulario** (`visita`) → 3 tabs: General / Actividades / Adjuntos; cabecera con guardar + enviar (solo si !viewOnly).
4. **Tab General** → empresa, cliente (selector modal), dirección (obligatoria), fecha visita, botón "Ver ruta".
5. **Tab Actividades** → modal "Añadir Actividad/Evento" (actividad + motivo si requiredEvent + comentario), lista de eventos, editar/eliminar.
6. **Tab Adjuntos** → componente adjuntos (fotos + firma si `signatureVisit`).

**Estados de visita observables:**

| Código | Texto en lista | Color | Editable | Formulario |
|---|---|---|---|---|
| 0 (SAVED) | Guardado | Negro | Sí | Normal; guardar + enviar activos tras cambios |
| 1 (TO_SEND) | Por Enviar | Negro | Sí* | Normal (ver supuesto 6) |
| 2 (VISITED) | Visitado | Negro | No | `viewOnly=true`; sin botones guardar/enviar |
| 3 (NOT_VISITED) | No Visitado / Reagendado | **Rojo** | Sí | `fromWeb=true`; tabs bloqueadas hasta "Iniciar Visita" |

*Ver supuesto 6 sobre TO_SEND editable.

**Variables globales (VG) relevantes:**

| Clave | Efecto observable |
|---|---|
| `globalConfig.get("userMustActivateGPS")` | Si `true`: "Nueva Visita" / apertura desde lista pueden no navegar sin coords (sin mensaje en home). **INICIAR VISITA** en visita No Visitado muestra etiqueta roja (`DENARIO_ERR_GPS`) si no hay ubicación — ver **DM-VIS-033**. |
| `globalConfig.get("transportRole")` + `user.transportista` | Cambia título (Despachos), label de botones, FAB de guías PDF en lista y formulario, comportamiento de evento único por despacho y botón "Reagendar Despacho". |
| `globalConfig.get("signatureVisit")` | Activa acordeón de firma en Tab Adjuntos. Con actividad `requiredSignature = true`, enviar deshabilitado hasta firmar (**DM-VIS-028**). |
| `globalConfig.get("userCanUploadFiles")` | Activa acordeón de archivo en Tab Adjuntos (`app-adjunto`). |
| `globalConfig.get("checkAddressClient")` | Al cambiar de dirección en el formulario, muestra un modal de confirmación antes de aplicar el cambio. |
| `globalConfig.get("enterpriseEnabled")` + `esMultiempresa()` | Habilita el selector de empresa en Tab General del formulario. |

**Tags del módulo (valores por defecto):**

| Tag | Valor |
|---|---|
| `VIS_NOMBRE_MODULO` | Visitas |
| `VIS_NOMBRE_MODULO_DESPACHOS` | Despachos |
| `VIS_BOTON_NUEVA` | NUEVA VISITA |
| `VIS_BOTON_NUEVA_DESPACHO` | Nuevo Despacho |
| `VIS_BOTON_LISTA` | RUTA DE HOY |
| `VIS_BOTON_INICIAR` | INICIAR VISITA |
| `VIS_BOTON_INICIAR_DESPACHO` | INICIAR DESPACHO |
| `VIS_BOTON_EVENTOS` | AÑADIR ACTIVIDAD/EVENTO |
| `VIS_MENSAJE_ENVIAR` | ¿Desea enviar la visita? |
| `VIS_MENSAJE_VISITA_GUARDA` | La visita se ha guardado |
| `VIS_BORRAR_CONFIRMA` | ¿Desea borrar la visita? Esta acción no se puede deshacer. |
| `VIS_MENSAJE_AGREGUE_ACT` | Debe agregar al menos una actividad para poder enviar la visita |

---

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte en código |
|---|---|---|---|---|---|---|---|---|
| DM-VIS-001 | Acceso al módulo desde Home → pantalla de inicio con 3 botones y título correcto | Sesión iniciada. App en Home. **Aplicación: Siempre** | 1. Pulsar el botón/icono del módulo Visitas en Home. 2. Observar la pantalla. | N/A | Pantalla muestra título "Visitas" (o "Despachos" si rol transportista). Los 3 botones son visibles: "NUEVA VISITA", "RUTA DE HOY" y "Ver mejor ruta". Cabecera con botón atrás. | FAIL: Pantalla en blanco; menos de 3 botones; título incorrecto o vacío. | S1 | `src/app/visitas/visitas.component.html:1-57`, `visitas.component.ts:28-49` |
| DM-VIS-002 | Botón "Ver mejor ruta" → mensajes UI según condición; abre Google Maps cuando hay visitas pendientes válidas | Pantalla home de visitas. GPS disponible en el dispositivo. **Aplicación: Siempre** — **Smoke:** no incluido — `ion-loading` no se dismiss en CDP cuando GPS no resuelve; comportamiento depende del entorno. Ejecutar en corrida manual con dispositivo real. | 1. Pulsar "Ver mejor ruta" sin ninguna visita pendiente (No Visitado) para hoy. 2. Observar el mensaje. 3. (Si hay visitas pendientes con coordenadas registradas) Pulsar nuevamente y observar si se abre Google Maps. | N/A | Escenario sin visitas pendientes: aparece mensaje de aviso "No hay visitas pendientes para trazar ruta". Escenario con visitas pero sin coordenadas de destino: mensaje "No hay coordenadas de destino validas para calcular la ruta". Escenario con visitas pendientes y coordenadas: se abre Google Maps (navegador externo) con la ruta calculada. No se valida la ruta calculada, solo que Maps se abra. | FAIL: Al pulsar, la app colapsa; no aparece ningún mensaje ni abre Maps; overlay de carga no desaparece. | S2 | `src/app/visitas/visitas.component.ts:112-189` (`verMejorRuta`) |
| DM-VIS-003 | Botón "Nueva Visita" → navega al formulario de visita vacío | Pantalla home de visitas. Ubicación activa en el dispositivo si VG `userMustActivateGPS = true`. **Aplicación: Siempre** | 1. Pulsar "NUEVA VISITA". 2. Observar el formulario cargado. | N/A | Overlay de carga breve. Formulario con 3 tabs: GENERAL (activa), ACTIVIDADES y ADJUNTOS deshabilitadas. Cliente vacío. Botones guardar/enviar en cabecera. *Con VG GPS obligatoria y sin coords: el botón no abre el formulario (solo oculta loading) — **N/A** por entorno, no FAIL.* | FAIL: Con GPS disponible (o VG inactiva) no abre formulario; tabs habilitadas sin cliente; app colapsa. | S1 | `visitas.component.ts:76-105` (`nuevaVisita`) |
| DM-VIS-004 | "RUTA DE HOY" → lista de visitas del día con ref, cliente, estatus y color | Pantalla home de visitas. Al menos una visita registrada para hoy. **Aplicación: Siempre** | 1. Pulsar "RUTA DE HOY". 2. Observar la lista. | N/A | Se muestra la lista de visitas del día de hoy (fecha actual). Cada ítem muestra: Nro Ref., nombre del cliente, estatus (texto + color: rojo para "No Visitado", negro para el resto) y fecha. La barra de búsqueda es visible en la parte superior. Si no hay visitas para hoy, la lista aparece vacía sin error. | FAIL: La lista muestra visitas de otros días; el color de estatus no corresponde; app colapsa; overlay de carga no desaparece. | S1 | `src/app/visitas/lista-visita/lista-visita.component.ts:75-91`, `lista-visita.component.html:51-70` |
| DM-VIS-005 | Búsqueda en lista de visitas → filtra en tiempo real por cliente o código | Lista de visitas del día con al menos 2 registros. **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre de un cliente conocido en la barra de búsqueda. 2. Observar mientras escribe. | Texto: nombre parcial de cliente existente | La lista se filtra mostrando solo las visitas cuyo nombre de cliente o código de visita contenga el texto ingresado. El filtro es en tiempo real (debounce ~1s). | FAIL: La lista no se filtra; app colapsa al escribir; filtro no funciona por cliente. | S3 | `src/app/visitas/lista-visita/lista-visita.component.ts:93-95` (`handleInput`), `lista-visita.component.html:53-54` |
| DM-VIS-006 | Eliminar visita "Guardado" desde la lista → modal de confirmación y desaparece | Lista con al menos una visita en estatus "Guardado". **Aplicación: Siempre** | 1. Localizar una visita con estatus "Guardado" (tiene botón basura rojo). 2. Pulsar el botón de eliminar. 3. Pulsar "Aceptar" en el modal de confirmación. | N/A | Aparece modal de confirmación con pregunta de borrado. Al aceptar: la visita desaparece de la lista y aparece un mensaje de éxito. El botón de eliminar solo es visible para visitas "Guardado". | FAIL: No aparece modal; la visita persiste tras confirmar; el botón de eliminar aparece para visitas "Visitado" o "Por Enviar"; app colapsa. | S2 | `src/app/visitas/lista-visita/lista-visita.component.ts:171-198` (`deleteVisit`, `showAlertDelete`) |
| DM-VIS-007 | Botón atrás en lista de visitas → navega al home del módulo | Lista de visitas activa. **Aplicación: Siempre** | 1. Pulsar la flecha atrás en la cabecera de la lista. | N/A | App navega al home del módulo Visitas (pantalla de los 3 botones). | FAIL: Navega a Home principal; permanece en la lista; botón no responde. | S2 | `src/app/visitas/lista-visita/lista-visita.component.html:8` (`routerLink="/visitas"`) |
| DM-VIS-008 | Formulario nuevo → tabs "Actividades" y "Adjuntos" deshabilitadas sin cliente ni dirección | Formulario de nueva visita abierto. **Aplicación: Siempre** | 1. Observar el estado de las pestañas sin haber seleccionado cliente. | N/A | Las pestañas "ACTIVIDADES" y "ADJUNTOS" están deshabilitadas (no pulsables). El campo "Cliente" está vacío. | FAIL: Las pestañas Actividades/Adjuntos son accesibles sin cliente; app colapsa. | S2 | `src/app/visitas/visita/visita.component.html:39-46` (condición `[disabled]`) |
| DM-VIS-009 | Tocar pestaña deshabilitada sin cliente → etiqueta roja en campo cliente | Formulario de nueva visita sin cliente seleccionado. **Aplicación: Siempre** | 1. Intentar tocar la pestaña "ACTIVIDADES" (deshabilitada). 2. Observar el Tab General. | N/A | El campo "Cliente" aparece marcado con un borde de error y una etiqueta roja de campo obligatorio. Si tampoco hay dirección, la sucursal también aparece marcada en rojo. Las pestañas no cambian. | FAIL: Las pestañas cambian sin cliente; no aparecen etiquetas de error; app colapsa. | S2 | `src/app/visitas/visita/visita.component.ts:658-672` (`checkSegment`) |
| DM-VIS-010 | Seleccionar cliente en el modal → campo relleno, dirección cargada, pestañas habilitadas | Formulario de nueva visita abierto. **Aplicación: Siempre** | 1. Tocar el campo "Cliente" para abrir el modal selector. 2. Seleccionar un cliente de la lista. 3. Observar el Tab General y el estado de las pestañas. | Cualquier cliente existente en la app | El modal se cierra. El campo "Cliente" muestra el nombre del cliente. El selector "Sucursal" muestra la dirección principal del cliente. Las pestañas "ACTIVIDADES" y "ADJUNTOS" se habilitan. | FAIL: Campo "Cliente" no se rellena; pestañas siguen deshabilitadas con cliente y dirección seleccionados; modal no se cierra; app colapsa. | S1 | `src/app/visitas/visita/visita.component.ts:410-489` (`setClientfromSelector`) |
| DM-VIS-011 | Búsqueda de cliente en el selector modal → lista filtrada | Selector de clientes abierto. **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre de un cliente conocido y pulsar el botón de búsqueda o Enter. 2. Ingresar texto sin coincidencias. | Texto 1: nombre parcial; Texto 2: `"ZZZZZZZ"` | Búsqueda 1: lista filtrada con clientes que coinciden. Búsqueda 2: mensaje "sin resultados". | FAIL: Lista no se filtra; app colapsa; botón de búsqueda no responde. | S2 | `src/app/cliente-selector/cliente-selector.component.html:33-37` |
| DM-VIS-012 | Selector de dirección (Sucursal) del cliente → cambio actualiza la dirección mostrada | Cliente seleccionado en formulario. Cliente con múltiples direcciones. **Aplicación: Siempre** | 1. Abrir el selector "Sucursal". 2. Elegir una dirección diferente a la predeterminada. | Cliente con al menos 2 direcciones | El selector muestra las direcciones del cliente. Al cambiar, el campo se actualiza. Si `checkAddressClient=true`, aparece un modal de confirmación antes de aplicar el cambio (ver DM-VIS-029). | FAIL: Selector vacío o no muestra las direcciones; cambio no se registra; app colapsa. | S2 | `src/app/visitas/visita/visita.component.html:84-95`, `visita.component.ts:498-560` (`onAddressSelect`) |
| DM-VIS-013 | Alerta "coordenadas faltantes" al seleccionar dirección editable sin coordenadas → ofrece agregar | Cliente seleccionado. La dirección elegida tiene `editable = true` y no tiene coordenadas asignadas. Formulario no en modo solo lectura. **Aplicación: Siempre** (cuando los datos lo permiten) | 1. Seleccionar un cliente cuya dirección tenga `editable = true` y sin coordenadas. 2. Abrir el selector Sucursal y elegir esa dirección. | N/A | Aparece un modal de alerta: "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" con opciones de aceptar y cancelar. Al aceptar, se abre la pantalla de edición de coordenadas del cliente. Al cancelar, no hay acción. | FAIL: No aparece alerta; al aceptar no abre editor de coordenadas; app colapsa. | S3 | `src/app/visitas/visita/visita.component.ts:530-558` (`onAddressSelect`) |
| DM-VIS-014 | Modal "Añadir Actividad/Evento" → campos visibles: actividad, motivo (si aplica), comentario | Formulario de visita con cliente + dirección. Tab Actividades habilitada. **Aplicación: Siempre** | 1. Ir al Tab "ACTIVIDADES". 2. Pulsar el botón "AÑADIR ACTIVIDAD/EVENTO". 3. Observar el modal. | N/A | Se abre un modal con: selector de "Actividad" (lista de tipos), campo "Comentario" (máx 120 caracteres), y botones "Cancelar" y "Agregar". Si la actividad seleccionada tiene `requiredEvent = true`, aparece además un selector de "Motivo" filtrado por la actividad. | FAIL: Modal no se abre; selector de actividades vacío; campo comentario ausente; app colapsa. | S1 | `src/app/visitas/visita/visita.component.html:181-252` |
| DM-VIS-015 | Agregar evento con actividad que NO requiere motivo → aparece en lista de eventos | Modal de eventos abierto. Actividad sin `requiredEvent`. **Aplicación: Siempre** | 1. Seleccionar una actividad en el `ion-select` (usa técnica `selectIonPopover`: clic en `ion-select` → asignar `ion-select.value` + `ionChange` → `popover.dismiss()`). 2. Ingresar comentario: el campo usa `[(ngModel)]` — **usar `focus + keyboard.type`** (NO `fillIonInput`, que no actualiza ngModel). 3. Pulsar el botón "Agregar" (`ion-button.botonAddLila`) con `browser_click` o `pg.mouse.click(coords)` — **NO usar `element.click()` o `dispatchEvent(MouseEvent)`** dentro del `ion-modal`. 4. Verificar que el modal se cerró. 5. Verificar estado del componente Angular: `ng.getComponent(document.querySelector('app-visitas-content') ?? document.querySelector('[class*=visita]'))` o evaluar `document.querySelectorAll('ion-list ion-item.eventoItem').length > 0`. | Actividad sin requiredEvent (ej. `VISITA SIN ACCION`); Comentario: `Test-VIS-015-<HHMMSS>` | El modal se cierra. En Tab Actividades aparece un ítem con: Actividad (nombre), Observación (comentario). Botón basura y flecha (editar) visibles. `listaEventos.length >= 1` en el componente (no solo visible en DOM). | FAIL: El modal no cierra; no aparece el evento en la lista; `saveEvent()` no fue llamado (modal se "cierra" visualmente pero `listaEventos` sigue en 0); app colapsa. | S1 | `src/app/visitas/visita/visita.component.ts:755-796` (`saveEvent`), `visita.component.html:199-204` (`ion-select` actividad), `visita.component.html:226-228` (`ion-input [(ngModel)]`), `visita.component.html:237-238` (botón Agregar) |
| DM-VIS-016 | Agregar evento con actividad que requiere motivo → sin motivo muestra error; con motivo agrega OK | Modal de eventos abierto. Actividad con `requiredEvent = true` disponible. **Aplicación: Siempre** | 1. Seleccionar una actividad con motivo requerido. 2. Sin seleccionar motivo, pulsar "Agregar". 3. Observar el mensaje. 4. Seleccionar un motivo de la lista. 5. Pulsar "Agregar". | N/A | Paso 3: aparece mensaje de aviso "Debe agregar al menos una actividad para poder enviar la visita" (o similar) y el evento no se guarda. Paso 5: el evento se agrega con la actividad, el motivo y el comentario visibles en la lista. | FAIL: Sin motivo permite agregar evento; con motivo no se agrega; mensaje de error ausente; app colapsa. | S2 | `src/app/visitas/visita/visita.component.ts:755-795` (`saveEvent`) |
| DM-VIS-017 | Editar evento existente desde la lista → modal con datos precargados y actualización | Tab Actividades con al menos un evento en la lista. **Aplicación: Siempre** | 1. Tocar el ítem de un evento en la lista de actividades. 2. Observar el modal que se abre. 3. Modificar el comentario. 4. Pulsar "Agregar" (que actúa como guardar cambios). 5. Observar la lista. | Comentario actualizado: `Test-VIS-017-edit` | El modal se abre con la actividad, motivo y comentario del evento ya precargados. Al guardar, el ítem de la lista se actualiza con el nuevo comentario. | FAIL: Modal abre vacío; cambios no se reflejan en la lista; app colapsa al tocar el evento. | S3 | `src/app/visitas/visita/visita.component.ts:694-710` (`editEvent`) |
| DM-VIS-018 | Eliminar evento de la lista de actividades → el ítem desaparece | Tab Actividades con al menos un evento. **Aplicación: Siempre** | 1. Pulsar el botón basura rojo del evento en la lista. 2. Observar la lista. | N/A | El evento desaparece de la lista de actividades. Si era el único evento, la lista queda vacía. | FAIL: El evento persiste; la posición de otros eventos queda desordenada; app colapsa. | S2 | `src/app/visitas/visita/visita.component.ts:674-692` (`deleteEvent`) |
| DM-VIS-019 | Guardar visita → mensaje de confirmación + aparece como "Guardado" en lista del día | Formulario con cliente + dirección + al menos un evento. Botón guardar activo. **Aplicación: Siempre** | 1. Pulsar guardar en cabecera. 2. Observar mensaje. 3. Ir a "RUTA DE HOY" y verificar. 4. (Opcional) Reabrir la visita Guardada. | Comentario en evento o nota: `Test-VIS-019` | Mensaje "La visita se ha guardado". El formulario **permanece abierto** hasta que el tester navega atrás o a RUTA DE HOY. En lista: estatus "Guardado". | FAIL: Sin mensaje; no en lista; datos perdidos al reabrir; app colapsa. | S1 | `visita.component.ts:798-802` (`saveButton`), `saveVisit` |
| DM-VIS-020 | Enviar visita → sin actividades: mensaje de error; con actividades: modal confirmación → "Por Enviar" | Formulario con cliente + dirección. **Aplicación: Siempre** | 1. Sin ningún evento en Tab Actividades, pulsar el botón enviar. 2. Observar el mensaje. 3. Agregar al menos un evento (ver DM-VIS-015). 4. Pulsar el botón enviar nuevamente. 5. En el modal de confirmación, pulsar "Aceptar". | N/A | Paso 2: aparece mensaje "Debe agregar al menos una actividad para poder enviar la visita". Paso 5: se muestra mensaje "Su Visita será enviada" (o versión offline), la app navega al home del módulo. En la lista del día, la visita aparece como "Por Enviar". | FAIL: Sin actividades permite enviar; modal de confirmación no aparece; app no navega al home; estatus queda como "Guardado". | S1 | `src/app/visitas/visita/visita.component.ts:907-975` (`sendVisit`, `confirmSend`, `enviarVisita`) |
| DM-VIS-021 | Salir con cambios → modal con "Guardar y salir" / "Salir" / "Cancelar" | Formulario editable con `changesMade = true`. **Para el smoke, la visita usada en DM-VIS-021/031 debe tener cliente + dirección + ≥1 evento agregado** (aplicar técnica DM-VIS-015 antes de pulsar atrás, para que DM-VIS-031 quede guardada con actividad). **Aplicación: Siempre** | 1. Asegurarse de haber agregado al menos un evento (DM-VIS-015) a esta visita **antes** de pulsar atrás. 2. Sin guardar desde cabecera, pulsar atrás. 3. Observar modal. | N/A | Modal con **"Guardar y salir"**, **"Salir"** (sin guardar) y **"Cancelar"** (tag `DENARIO_BOTON_SALIR_GUARDAR` en código). | FAIL: Navega sin modal con cambios pendientes; falta "Guardar y salir"; app colapsa. | S2 | `visita.component.ts:983-993` (`goBack`), `visita.component.html` (alert `saveOrExitOpen`) |
| DM-VIS-022 | "Salir sin guardar" desde modal → no persiste visita **verdaderamente nueva** | Continuación de **DM-VIS-021** (modal visible). Visita **nueva que NUNCA fue guardada antes desde cabecera** (stDelivery≠SAVED). **Aplicación: Siempre** | 1. Pulsar **"Salir sin guardar"**, **no** "Guardar y salir" (**DM-VIS-031**). 2. Ir a "RUTA DE HOY". | — | Navega al home del módulo. La visita nueva **no** aparece en la lista del día. **⚠ COMPORTAMIENTO CRÍTICO A NO CONFUNDIR:** si la visita ya fue guardada antes (stDelivery=SAVED) y luego se reabre para editar, elegir "Salir sin guardar" **mantiene la visita Guardada** — eso es comportamiento correcto, NO es FAIL. Solo una visita que nunca tocó el botón guardar desde cabecera debe desaparecer al elegir esta opción. El agente NO debe reutilizar la visita de DM-VIS-019 para este caso — debe crear una visita nueva. | FAIL: La visita nueva (nunca guardada antes) aparece como Guardada en la lista. **NO es FAIL:** si la visita ya existía en estado Guardado y se mantiene tras "Salir sin guardar". | S2 | `visita.component.ts:1105-1111` (`buttonsSalvar`, role `exit`) |
| DM-VIS-023 | Abrir visita "Guardado" desde la lista → formulario editable con botones activos | Lista del día con al menos una visita "Guardado". **Aplicación: Siempre** | 1. Tocar una visita con estatus "Guardado" en la lista del día. 2. Observar el formulario. | N/A | El formulario carga con datos previos (cliente, fecha, eventos). Botones guardar y enviar visibles en cabecera. Las 3 pestañas son accesibles. El formulario es editable. | FAIL: Formulario carga vacío; en solo lectura; botones ausentes; app colapsa. | S2 | `src/app/visitas/lista-visita/lista-visita.component.ts:105-135` (`selectVisit`, `goToVisita`), `visita.component.ts:215-287` |
| DM-VIS-024 | Abrir visita "Visitado" desde la lista → solo lectura, sin botones guardar/enviar | Lista del día con una visita "Visitado". **Aplicación: Siempre** | 1. Tocar una visita con estatus "Visitado" en la lista del día. 2. Observar el formulario. | N/A | El formulario muestra los datos originales sin posibilidad de edición. Los botones guardar y enviar **no** aparecen en la cabecera. Las pestañas Actividades y Adjuntos son accesibles para consulta pero sin botones de edición. | FAIL: El formulario abre editable; botones guardar/enviar visibles para "Visitado"; app colapsa. | S2 | `src/app/visitas/visita/visita.component.ts:252-256` (`viewOnly = stVisit == VISIT_STATUS_VISITED`) |
| DM-VIS-025 | Abrir visita "No Visitado" (sincronizada desde backend) → Tab General con botón "INICIAR VISITA"; Actividades/Adjuntos bloqueados | Lista del día con una visita "No Visitado" (rojo). **Aplicación: Siempre** | 1. Tocar una visita con estatus "No Visitado" (texto rojo) en la lista del día. 2. Observar el formulario. | N/A | El formulario muestra Tab General con cliente y dirección precargados (no editables, `fromWeb=true`). El botón "INICIAR VISITA" es visible en Tab General. Las pestañas "ACTIVIDADES" y "ADJUNTOS" están deshabilitadas. Los botones guardar/enviar en cabecera están deshabilitados. | FAIL: Tabs Actividades/Adjuntos accesibles sin iniciar; botón "INICIAR VISITA" ausente; cliente editable; app colapsa. | S2 | `src/app/visitas/visita/visita.component.ts:253-285` (`fromWeb = stVisit == VISIT_STATUS_NOT_VISITED`) |
| DM-VIS-026 | Pulsar "INICIAR VISITA" con GPS disponible → tabs Actividades/Adjuntos habilitadas | Continuación de **DM-VIS-025**. Ubicación activa en el dispositivo. **Aplicación: Siempre** (*si VG `userMustActivateGPS` y sin ubicación, usar **DM-VIS-033** en lugar de este caso*) | 1. Pulsar "INICIAR VISITA" (o "INICIAR DESPACHO" si transportista). 2. Observar pestañas y tab activo. | N/A | ACTIVIDADES y ADJUNTOS se habilitan; el formulario cambia a Tab ACTIVIDADES; el botón INICIAR desaparece; no hay etiqueta roja de error GPS. | FAIL: Tabs siguen bloqueadas con GPS OK; no cambia a Actividades; botón INICIAR persiste; app colapsa. | S1 | `visita.component.ts:372-408` (`iniciarVisita`, `setCoordinates`) |
| DM-VIS-027 | Rol transportista: título y botones muestran texto "Despachos" [VG Condicional] | Sesión con cuenta QA transportista (`transportRole=true`, `user.transportista=true`). **Aplicación: Condicional (VG: `globalConfig.get("transportRole") = true` y `user.transportista = true`)** | 1. Acceder al módulo Visitas. 2. Observar el título en home, lista y formulario. 3. Observar el botón "Nueva Visita". | Cuenta QA transportista | Título muestra "Despachos" en todas las pantallas. El botón 1 muestra "Nuevo Despacho". Los tags de fecha y botón iniciar muestran el texto de despacho. FAB (botón flotante) visible en lista y formulario para acceder a guías PDF. | FAIL: Título sigue mostrando "Visitas" con cuenta transportista; FAB ausente; botones muestran texto de visitas. | S2 | `src/app/visitas/visitas.component.ts:28-49` (rolTransportista), `visitas.component.html:13-14` |
| DM-VIS-028 | Actividad con firma requerida deshabilita el botón enviar hasta registrar firma [VG signatureVisit] | Formulario de visita con cliente + dirección. VG `signatureVisit = true`. Actividad disponible con `requiredSignature = true`. **Aplicación: Condicional (VG: `globalConfig.get("signatureVisit") = true`)** | 1. En Tab Actividades, seleccionar una actividad que tenga firma requerida en el modal de eventos. 2. Agregar el evento. 3. Observar el estado del botón enviar. 4. Ir a Tab Adjuntos y registrar una firma. 5. Volver a observar el botón enviar. | N/A | Paso 3: aparece mensaje "Esta actividad requiere Firma del cliente" y el botón enviar queda deshabilitado. Paso 5: después de registrar la firma, el botón enviar se habilita. | FAIL: El botón enviar no se deshabilita con actividad de firma requerida; el botón no se habilita tras firmar; mensaje de firma ausente. | S2 | `src/app/visitas/visita/visita.component.ts:636-648` (`checkFirmaAndDisableSend`) |
| DM-VIS-029 | Modal confirmación al cambiar dirección (checkAddressClient activo) [VG Condicional] | Formulario con cliente ya seleccionado y una dirección activa. VG `checkAddressClient = true`. Cliente con al menos 2 direcciones. **Aplicación: Condicional (VG: `globalConfig.get("checkAddressClient") = true`)** | 1. En el selector Sucursal, elegir una dirección diferente a la actual. 2. Observar si aparece un modal de confirmación. 3. Pulsar "Cancelar". 4. Observar la dirección. | N/A | Paso 2: aparece modal de confirmación indicando el cambio de dirección. Paso 4: al cancelar, la dirección vuelve a la anterior. Al aceptar, la dirección se actualiza. | FAIL: No aparece modal; la dirección cambia directamente sin confirmación con VG activa; al cancelar la dirección cambia igualmente. | S3 | `src/app/visitas/visita/visita.component.ts:499-529` (`onAddressSelect`) |
| DM-VIS-030 | Reagendar Despacho (transportista, visita No Visitado) → modal con fecha y motivo [VG Condicional] | Formulario de visita "No Visitado" abierto con cuenta transportista. **Aplicación: Condicional (VG: `transportRole = true`, `user.transportista = true`, y visita con `fromWeb = true`)** | 1. En el formulario de una visita "No Visitado" con cuenta transportista, observar el botón "REAGENDAR DESPACHO". 2. Pulsarlo. 3. En el modal: seleccionar una fecha futura y escribir un motivo. 4. Pulsar "Confirmar". | Motivo: `Test-VIS-030-reagenda` | El modal de reagendación se abre con un selector de fecha (mínimo: mañana) y un campo de motivo. Sin motivo, el botón "Confirmar" está deshabilitado. Con fecha y motivo, el botón se habilita. Al confirmar, el modal se cierra. | FAIL: Botón "REAGENDAR DESPACHO" ausente para transportista; modal no se abre; "Confirmar" activo sin motivo; app colapsa. | S3 | `src/app/visitas/visita/visita.component.html:139-144`, `visita.component.html:332-381` |
| DM-VIS-031 | "Guardar y salir" desde modal de salida → visita Guardada en lista **con al menos una actividad** | Continuación de **DM-VIS-021** (modal visible). Visita **nueva** con cliente, dirección y **≥1 evento ya agregado** (ejecutar técnica DM-VIS-015 antes de pulsar atrás); **no** guardada antes desde cabecera. **Aplicación: Siempre** | 1. Confirmar que la visita tiene al menos un evento en `listaEventos` (pre-requisito — aplicar técnica DM-VIS-015 si no se hizo antes de llegar aquí). 2. Pulsar atrás (**DM-VIS-021**). 3. Elegir **"Guardar y salir"**. 4. Observar navegación. 5. Ir a "RUTA DE HOY" y abrir la visita. 6. Verificar Tab Actividades → lista no vacía. | Evento con comentario: `Test-VIS-031-<HHMMSS>`; actividad sin `requiredEvent` | Regresa al **home del módulo Visitas**. En lista del día: estatus **"Guardado"** con cliente, dirección y al menos un evento. Al reabrir, Tab Actividades muestra el evento con actividad y comentario. Distinto de **DM-VIS-022** (descartar) y de **DM-VIS-019** (guardar sin salir). | FAIL: No en lista; Tab Actividades vacía al reabrir (agente guardó sin evento — actividades no persistidas); datos vacíos; sale sin guardar; no navega al home; app colapsa. | S1 | `visita.component.ts:1095-1103` (`role: save`), `saveVisit` → `saveIncidences` (`listaEventos → incidences`) |
| DM-VIS-032 | Tab Adjuntos → imagen, archivo y firma según configuración | Formulario con cliente y dirección; tabs Adjuntos habilitadas. **Aplicación: Siempre** (acordeones por VG; ítem no visible → **N/A**, no FAIL) | 1. Ir a Tab ADJUNTOS. 2. **Imágenes**: buscar/tomar foto y verificar en carrusel. 3. **Archivo** (si `userCanUploadFiles`): subir PDF o imagen ligera. 4. **Firma** (si `signatureVisit`): dibujar y guardar firma. 5. Guardar visita (**DM-VIS-019**) y reabrir desde lista. | Imagen de galería; archivo `test-visita.pdf`; comentario evento: `Test-VIS-032` | Cada acordeón visible captura y muestra el adjunto. Tras guardar y reabrir, persisten en móvil. *Web post-envío: supuesto 11.* | FAIL: Acordeón visible no adjunta; no persiste al reabrir; app colapsa. | S1 | `visita.component.html:256-258`, `adjunto.component`, `visita.component.ts:255` (`signatureVisit`) |
| DM-VIS-033 | INICIAR VISITA sin ubicación y VG GPS obligatoria → mensaje de error visible [VG userMustActivateGPS] | **DM-VIS-025** abierto. VG `userMustActivateGPS = true`. Ubicación del dispositivo **desactivada** o sin permiso (reproducible en emulador). **Aplicación: Condicional (VG: `globalConfig.get("userMustActivateGPS") = true`)** | 1. Abrir visita "No Visitado". 2. Pulsar "INICIAR VISITA". 3. Observar Tab General bajo el botón. | N/A | Aparece etiqueta **roja** con mensaje de error GPS (`DENARIO_ERR_GPS` o equivalente). ACTIVIDADES/ADJUNTOS **siguen deshabilitados**. El botón INICIAR puede permanecer visible. *Con GPS activo y coords OK → ejecutar **DM-VIS-026**, no este caso.* | FAIL: Con VG activa y sin GPS, habilita tabs igualmente; no muestra aviso; app colapsa. | S2 | `visita.component.ts:375-386` (`iniciarVisita`, `initVisitRedLabel`) |
| DM-VIS-034 | Botón "Ver ruta" en Tab General → abre ruta cuando la sucursal tiene coordenadas | Formulario con cliente y sucursal con **coordenadas válidas** en catálogo. **Aplicación: Siempre** | 1. En Tab General, localizar el botón de mapa/ruta (`VIS_BOTON_MAPA` o "Ver ruta"). 2. Verificar que no está deshabilitado. 3. Pulsarlo. | Cliente con dirección georreferenciada | El botón está habilitado. Al pulsar, abre Google Maps (o app de mapas) hacia la coordenada de la sucursal. *Sin coordenadas en sucursal: botón deshabilitado — **N/A** por datos, no FAIL.* | FAIL: Con coords válidas el botón sigue deshabilitado; no abre mapas; app colapsa. | S3 | `visita.component.html:98-103`, `openRouteInGoogleMaps`, `disabledButtonViewRoute` |

---

```gherkin
# DM-VIS-003 / DM-VIS-010 / DM-VIS-015 — Happy path nueva visita
Dado que estoy en el home del módulo Visitas
Cuando pulso "NUEVA VISITA"
Entonces se abre el formulario con pestañas Actividades/Adjuntos deshabilitadas
Cuando selecciono un cliente en el modal y las pestañas se habilitan
  Y en Tab Actividades agrego un evento con actividad y comentario
Entonces el evento aparece en la lista de actividades
```

```gherkin
# DM-VIS-019 / DM-VIS-020 — Guardar y enviar
Dado que el formulario tiene cliente, dirección y al menos un evento
Cuando pulso guardar
Entonces aparece mensaje "La visita se ha guardado" y la visita queda como "Guardado" en la lista
Cuando pulso enviar y acepto la confirmación
Entonces aparece mensaje "Su Visita será enviada" y la app regresa al home del módulo
```

```gherkin
# DM-VIS-025 / DM-VIS-026 — Iniciar visita No Visitado
Dado que abro una visita con estatus "No Visitado" desde la lista del día
Entonces el Tab General muestra el botón "INICIAR VISITA" y los demás tabs están deshabilitados
Cuando pulso "INICIAR VISITA" con ubicación disponible en el dispositivo
Entonces los tabs Actividades y Adjuntos se habilitan y el formulario cambia a Tab Actividades
```

```gherkin
# DM-VIS-021 / DM-VIS-022 / DM-VIS-031 — Salir del formulario
Dado que tengo una visita nueva con cliente, dirección y al menos un evento sin guardar desde cabecera
Cuando pulso atrás en la cabecera
Entonces aparece un modal con "Guardar y salir", "Salir" y "Cancelar"
Cuando elijo "Salir" sin guardar
Entonces la visita no aparece en la lista del día
# Caso aparte DM-VIS-031:
Cuando en otra visita nueva elijo "Guardar y salir"
Entonces vuelvo al home del módulo Visitas
  Y en RUTA DE HOY la visita aparece como "Guardado"
```

```gherkin
# DM-VIS-032 — Adjuntos en visita
Dado que tengo una visita editable con tabs Adjuntos habilitadas
Cuando agrego imagen y, si la UI lo muestra, archivo y firma
Entonces cada adjunto aparece en el componente
Cuando guardo y reabro la visita desde la lista
Entonces los adjuntos siguen visibles en la app móvil
```

---

### Regresión mínima (smoke rápido)

Lista de IDs imprescindibles para validar el módulo visitas antes de cerrar un release (**no sustituye la ejecución de la tabla completa**; para una corrida general se recomienda ejecutar todos los casos que no sean N/A por VG):

1. **DM-VIS-001** — Acceso al módulo, 3 botones visibles
2. **DM-VIS-003** — Nueva Visita → formulario vacío
3. **DM-VIS-004** — "RUTA DE HOY" → lista del día
4. **DM-VIS-010** — Seleccionar cliente → pestañas habilitadas
5. **DM-VIS-014** — Modal Añadir Actividad/Evento
6. **DM-VIS-015** — Agregar evento → aparece en lista (**ion-select** actividad: técnica `selectIonPopover`; comentario `[(ngModel)]`: `focus + keyboard.type`; botón Agregar: `browser_click` o `pg.mouse.click(coords)`)
7. **DM-VIS-019** — Guardar visita (con el evento de DM-VIS-015 ya en `listaEventos`)
8. **DM-VIS-020** — Enviar visita (con y sin actividades)
9. **DM-VIS-021** — Salir con cambios → modal (**agregar evento con técnica DM-VIS-015 ANTES de pulsar atrás**, para que DM-VIS-031 quede con actividad)
10. **DM-VIS-022** — Salir sin guardar (visita nueva)
11. **DM-VIS-031** — Guardar y salir → Guardado en lista (**verificar Tab Actividades al reabrir → lista no vacía**)
12. **DM-VIS-023** — Abrir visita Guardado → editable
13. **DM-VIS-025** — No Visitado → INICIAR bloqueado
14. **DM-VIS-026** — Iniciar Visita → tabs habilitadas (GPS OK)
15. **DM-VIS-006** — Eliminar visita Guardado
16. **DM-VIS-002** — Ver mejor ruta: mensajes UI
17. **DM-VIS-032** — Adjuntos (imagen; archivo/firma si VG)

**Regla de oro del smoke — actividades obligatorias:** toda visita que se guarde o envíe durante esta corrida debe tener al menos una actividad en `listaEventos`. Si al reabrir una visita Guardada la Tab Actividades aparece vacía → **FAIL** (el evento no se persistió correctamente).

**Técnica para agregar actividad vía CDP (resumen):**
1. Abrir modal: `browser_click` en botón "AÑADIR ACTIVIDAD/EVENTO"
2. Seleccionar actividad: técnica `selectIonPopover` en `ion-select` dentro del modal
3. Ingresar comentario: `pg.focus('ion-modal ion-input input')` + `pg.keyboard.type('Test-VIS-...')`
4. Pulsar Agregar: `browser_click` en `ion-button.botonAddLila` o `pg.mouse.click(coords)` — **NO `element.click()` ni `dispatchEvent(MouseEvent)` dentro del `ion-modal`**

Si la corrida incluye cuenta transportista, agregar al smoke:
- **DM-VIS-027** (título Despachos / FAB PDF)
- **DM-VIS-030** (reagendar despacho)

Si `userMustActivateGPS = true` y se puede desactivar ubicación en el dispositivo de prueba:
- **DM-VIS-033** (error GPS al INICIAR sin ubicación)

### Corrida general recomendada

Además del smoke, ejecutar en la misma sesión (marcando N/A donde no aplique):

1. Núcleo visita nueva: **001 → 003 → 008–010 → 014–016 → 019 → 020 → 022**
2. Salida con cambios: **021 → 022** (descartar) y **021 → 031** (guardar y salir; visitas distintas)
3. Lista: **004–007**, **023–024**
4. Backend No Visitado: **025 → 026** (con GPS) o **025 → 033** (sin GPS + VG)
5. Ubicación/ruta: **002**, **013**, **034** (sucursal con coords)
6. Adjuntos: **032**; firma obligatoria: **028** si VG
7. Condicionales: **027**, **029**, **030** según cuenta

**Precondición dispositivo:** ubicación activa y permiso a Denario antes de **002**, **003**, **026** y envío (**020**).

---

### Supuestos y lagunas — Cobertura fuera de este guion

1. **GPS (`userMustActivateGPS`)**: la ubicación la provee el **dispositivo Android** (no la laptop). Con VG activa: **Nueva Visita** puede no abrir el formulario sin coords (**003** → N/A, no FAIL). **INICIAR VISITA** sí muestra error rojo sin ubicación (**DM-VIS-033**). Con GPS normal: **002**, **003**, **026**, **034**. Al enviar, la app intenta capturar coords si faltan (`enviarVisita`) — no hay caso de tabla dedicado. Revocar permiso como única prueba de toda la corrida sigue excluido; **033** cubre el fallo visible al INICIAR cuando se puede reproducir.

2. **"Ver mejor ruta" con >24 destinos**: si hay más de 24 visitas pendientes con coordenadas válidas, aparece el mensaje "Se mostraran los primeros 24 destinos por limite de Google Maps" antes de abrir Maps. Este escenario es difícil de reproducir controladamente en QA; documentar como N/A si no hay volumen suficiente.

3. **Lista del día muestra solo visitas de hoy**: `getVisitList` filtra por la fecha actual. Si el tester no tiene visitas creadas para hoy, la lista aparece vacía. Para ejecutar los casos de lista (DM-VIS-004 a DM-VIS-007), debe haber al menos una visita registrada en el día de la corrida.

4. **Visitas "No Visitado" requieren sincronización previa con el backend**: estas visitas (estatus 3) son creadas en el servidor y sincronizadas al dispositivo. Para ejecutar DM-VIS-025 y DM-VIS-026, el entorno QA debe tener visitas precargadas desde el backend para el día de la corrida. Si no hay visitas de backend, marcar como N/A.

5. **`checkAddressClient` y doble alerta**: el código de `onAddressSelect()` tiene dos ramas mutuamente excluyentes: (a) si `checkAddressClient=true` y la dirección cambia → modal de confirmación; (b) si `!viewOnly && editable && sin coordenadas` → modal de coordenadas. No ambas se muestran simultáneamente. DM-VIS-013 y DM-VIS-029 cubren cada rama por separado.

6. **Visita "Por Enviar" (TO_SEND, stVisit=1) en modo edición**: según el código, `viewOnly = (stVisit == VISIT_STATUS_VISITED)` — solo VISITED activa viewOnly. Una visita "Por Enviar" se abriría técnicamente como editable. Sin embargo, al estar ya encolada para sincronización, modificarla antes de sincronizar puede generar inconsistencias. No se incluyó en la tabla como caso explícito. Si se observa durante una corrida, documentar el comportamiento real y reportar al equipo de desarrollo.

7. **FAB (botón flotante) transportista — guías de despacho PDF**: el FAB aparece en formulario y lista para cuentas transportista. Al pulsarlo, abre una lista de PDFs disponibles desde `imageServices.mapPdfFiles`. La disponibilidad de PDFs depende de que el servidor haya sincronizado guías de despacho para el usuario. No se incluye caso de tabla específico para el flujo de apertura de PDF individual; verificar en corrida si aplica.

8. **Pedido sugerido desde visitas (`desdeSugerencia`)**: el campo `desdeSugerencia` existe en `PedidosService` y permite generar un pedido pre-cargado desde una visita. No se encontró enlace UI directo en el código del módulo de visitas (`visita.component.ts / .html`) que navegue al formulario de pedido desde la visita. Este flujo se cubre en el guion de pedidos si aplica.

9. **Modal de mapa para editar coordenada del cliente (desde visita)**: la función `AddClientAddress()` abre el componente `app-client-location` en un modal para editar la coordenada de la dirección del cliente. Este flujo se activa solo al aceptar la alerta de "coordenadas faltantes" (DM-VIS-013). El flujo completo del editor de coordenadas se cubre en el guion de clientes.

10. **Actividad con `requiredSignature` sin VG `signatureVisit`**: si `signatureVisit=false`, el componente adjuntos no muestra la opción de firma. Aunque la actividad tenga `requiredSignature=true`, el check `tieneFirma()` podría bloquear el envío igualmente. Confirmar con el equipo si es comportamiento esperado cuando la VG está inactiva.

11. **Adjuntos y validación en web**: **DM-VIS-032** valida captura y persistencia en móvil. Tras **DM-VIS-020** (envío), verificar en web que la visita (referencia/comentario `Test-VIS-032`) muestra imagen, archivo y firma correctamente.
