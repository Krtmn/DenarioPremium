# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Devoluciones

---

### Alcance y exclusiones

Este guion cubre el módulo de devoluciones de Denario Premium móvil en **Android**: pantalla de inicio con 2 botones, formulario de nueva devolución (pestañas General / Productos / Adjuntos), captura de productos devueltos con cantidad, unidad y motivo, guardar y enviar, y lista de devoluciones con búsqueda, apertura y eliminación. Se cubren también los flujos condicionales por VG: factura obligatoria (`validateReturn`), adjuntos (imagen, archivo, firma) y `signatureReturn`.

Constituye un **catálogo completo** de flujos observables en UI. En una corrida real se estima ejecutar ~**70 %**; el resto quedará **N/A por configuración**, no FAIL.

**25 casos Manual-UI** en la tabla (`DM-DEV-001`–`025`). Si una VG o dato de catálogo no aplica, marcar **N/A** (no FAIL).

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA estándar con acceso al módulo.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración esté activa para la empresa probada; si no aplica, marcar **N/A**.

**Incluye:** acceso al módulo, formulario con 3 tabs, selector de cliente, selector de factura (cuando `validateReturn=true`), campos editables de cabecera, selección de productos con cantidad/unidad/motivo, **guardar y verificar en BUSCAR**, enviar, adjuntos (imagen, archivo, firma), lista con búsqueda/abrir/eliminar.

**Excluye:** modal «Guardar y salir» / «Salir sin guardar» en devolución **nueva** sin guardar (ver supuesto 1 y **DM-DEV-020**); escenarios con red cortada ni modo avión; manipulación de localStorage/ADB; verificación de stock del servidor; revocar permiso GPS como única prueba de toda la corrida. Validación de adjuntos en **web** fuera de la app móvil (supuesto 9).

**Fuente de verdad (textos UI y tags):** `../denario-movil-para-claude.xml` (módulo `DEV`, `PROD`, `ADJ`, `CLI`, `DEN`) y código en `../../src/app/devoluciones/`.

**Ubicación (GPS):** si `userMustActivateGPS = true`, la app lee coordenadas del **dispositivo Android**. Sin ubicación, **DEVOLUCIÓN** puede no abrir el formulario (comportamiento silencioso — **N/A** por entorno, no FAIL). Activar ubicación y permiso a Denario antes de **002**, **022** y envío (**018**).

---

### Mapa rápido (código + `denario-movil-para-claude.xml`)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `devoluciones` |
| Componente raíz | `src/app/devoluciones/devoluciones.component.ts/html` — carga tags y VG |
| Contenedor/home | `src/app/devoluciones/devoluciones-container/devoluciones-container.component.ts/html` — 2 botones + navegación interna |
| Cabecera | `src/app/devoluciones/devoluciones-header/devoluciones-header.component.ts/html` — botón atrás, guardar, enviar, alertas |
| Formulario (tabs) | `src/app/devoluciones/devoluciones-container/devolucion/devolucion.component.ts/html` — 3 tabs |
| Tab General | `src/app/devoluciones/devoluciones-container/devolucion/devolucion-general/devolucion-general.component.ts/html` |
| Selector de factura | `src/app/devoluciones/devoluciones-container/devolucion/devolucion-general/invoice-selector/invoice-selector.component.ts/html` — modal con searchbar |
| Tab Productos | `productos-tab` con `devolucion=true` + `devolucion-product-list` embebido |
| Tab Adjuntos | `app-adjunto` embebido |
| Lista | `src/app/devoluciones/devoluciones-container/devolucion-list/devolucion-list.component.ts/html` |
| Servicio lógica | `src/app/services/returns/return-logic.service.ts` — estado, VG, carrito de productos devueltos |

**Pestañas del formulario:**

| Tag | Nombre visible | Habilitada cuando |
|---|---|---|
| `DEV_GENERAL_TAB` | General | Siempre (activa por defecto) |
| `DEV_PRODUCTOS_TAB` | Productos | Sólo tras `returnValid = true` |
| `DEV_ADJUNTOS_TAB` | Adjuntos | Sólo tras `returnValid = true` |

**`returnValid = true` se alcanza cuando:**
- `validateReturn = false` (por defecto): al seleccionar un cliente.
- `validateReturn = true` (VG): al seleccionar cliente **y** luego seleccionar una factura en el modal.

**Estados del devolución observables en lista:**

| Código | Texto | Editable | Botón eliminar en lista |
|---|---|---|---|
| 0 (NEW) | — | Sí (igual que Guardado) | No |
| 1 (SENT) | Enviado | No (`returnSent = true`) | No |
| 2 (TO_SEND) | Por Enviar | No | No |
| 3 (SAVED) | Guardado | Sí | Sí |

**`returnSent = true`** cuando `stDelivery = null` o `1` (SENT): campos del Tab General se vuelven readonly, el selector de clientes no aparece, y los botones guardar/enviar se ocultan.

**Variables globales (VG) relevantes:**

| Clave | Efecto observable |
|---|---|
| `globalConfig.get("validateReturn")` | Muestra campo "Factura" y modal `invoice-selector` en Tab General; hace obligatoria la selección de factura para habilitar tabs |
| `globalConfig.get("userMustActivateGPS")` | Requiere GPS activo para crear nueva devolución o abrir guardadas desde la lista |
| `globalConfig.get("signatureReturn")` | Activa opción de firma en el componente de adjuntos (Tab Adjuntos) |
| `globalConfig.get("userCanUploadFiles")` | Activa acordeón de archivo (PDF/imagen) en Tab Adjuntos |
| `globalConfig.get("requeridedNroFactura")` | Obliga «Nro Factura» (`DEV_DOC`) por línea en Tab Productos; filtra productos al buscar (ver supuesto 3) |

**Tags clave del módulo:**

| Tag | Valor por defecto |
|---|---|
| `DEV_NUEVA_DEVOLUCION` | DEVOLUCIÓN |
| `DEV_BUSCAR_DEVOLUCION` | BUSCAR |
| `DEV_RESPONSABLE_DEV` | Responsable |
| `DEV_PRECINTO_DEV` | No. Precinto |
| `DEV_COMENTARIO_DEV` | Comentario |
| `DEV_TIPO_DEV` | Tipo |
| `DEV_INVOICE` | Código Factura |
| `DEV_QU_PRODUCT` | Cantidad Devuelta |
| `DEV_UNIT` | Unidad |
| `DEV_MOTIVE` | Motivo |
| `ADD_PRODUCT` (PROD) | Agregar Producto (botón Tab Productos) |
| `CLI_SIN_RESULTADOS` (CLI) | No hay clientes disponibles (selector) |
| `ADJ_ACORDEON_IMAGENES` / `ADJ_ACORDEON_ARCHIVO` / `ADJ_ACORDEON_FIRMA` (ADJ) | Acordeones Tab Adjuntos |
| `DENARIO_DEV_NU_REF` / `DENARIO_DEV_CLIENT` / `DENARIO_DEV_STATUS` / `DENARIO_DEV_DATE` | Columnas lista BUSCAR |
| `DENARIO_DEV_SAVED` / `DENARIO_DEV_TO_BE_SENDED` / `DENARIO_DEV_SENDED` | Estatus en lista |
| `DEV_HEADER_ALERTA` / `DEV_RESET_CONFIRMA` | Alerta cambio de factura |
| `DEV_FECHA_DEV` | Fecha (General y lista facturas) |
| `DENARIO_BOTON_SALIR_GUARDAR` / `DENARIO_BOTON_SALIR` (DEN) | Modal salir (solo si aplica supuesto 1) |
| `DENARIO_DEV_TO_SAVE` | ¡Su Devolución se ha guardado! |
| `DENARIO_DEV_TO_SEND` | ¡Su Devolución será enviada! |
| `DENARIO_DEV_CONFIRM_SEND` | ¿Desea enviar la devolución? |
| `DENARIO_DEV_CONFIRM_DELETE` | ¿Desea eliminar la devolución? |

---

### Criterio Manual-UI

Cada fila de la tabla es ejecutable por un tester en dispositivo Android sin ADB ni inspección de red. Los textos esperados provienen de tags en `denario-movil-para-claude.xml` (sincronizados a SQLite en runtime). La columna **Soporte (XML / código)** enlaza tag + archivo fuente en `../../src/app/`.

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte (XML / código) |
|---|---|---|---|---|---|---|---|---|
| DM-DEV-001 | Acceso al módulo devoluciones desde Home → pantalla de inicio con 2 botones | Sesión iniciada. App en Home. **Aplicación: Siempre** | 1. Acceder al módulo Devoluciones desde Home. 2. Observar la pantalla. | N/A | Pantalla de inicio muestra 2 botones: "DEVOLUCIÓN" y "BUSCAR". Título del módulo visible en cabecera. | FAIL: Pantalla en blanco; botones ausentes; app colapsa. | S1 | XML: `DEV_NUEVA_DEVOLUCION`, `DEV_BUSCAR_DEVOLUCION`, `DEV_NOMBRE_MODULO` · `devoluciones-container.component.html` |
| DM-DEV-002 | Botón "DEVOLUCIÓN" → formulario con 3 tabs; Productos y Adjuntos deshabilitados | Home del módulo activo. Ubicación activa en dispositivo si VG `userMustActivateGPS = true`. **Aplicación: Siempre** | 1. Pulsar el botón "DEVOLUCIÓN". 2. Observar el formulario. | N/A | Formulario carga con 3 tabs: "General" (activa), "Productos", "Adjuntos". Las pestañas Productos y Adjuntos están deshabilitadas. El campo "Cliente" está vacío. Botones guardar y enviar visibles en cabecera. *Con VG GPS y sin coords: el botón no abre el formulario — **N/A** por entorno, no FAIL.* | FAIL: Con GPS disponible (o VG inactiva) no abre formulario; tabs accesibles sin cliente; app colapsa. | S1 | XML: `DEV_*_TAB` · `devolucion.component.html`; VG `userMustActivateGPS` · `devoluciones-container.component.ts` (`newReturnButton`) |
| DM-DEV-003 | Tocar tab deshabilitada sin cliente → pestañas no cambian | Formulario de nueva devolución sin cliente. **Aplicación: Siempre** | 1. Sin cliente, intentar tocar la pestaña "Productos". 2. Observar. | N/A | Las pestañas deshabilitadas no responden al toque. El Tab General sigue activo. | FAIL: La pestaña cambia sin cliente; app colapsa. | S2 | XML: `DEV_PRODUCTOS_TAB` · `[disabled]="!returnValid"` en `devolucion.component.html` |
| DM-DEV-004 | Seleccionar cliente (sin `validateReturn`) → campo relleno y pestañas habilitadas | Formulario de nueva devolución. VG `validateReturn = false`. **Aplicación: Siempre** | 1. Tocar el campo "Cliente" para abrir el modal selector. 2. Seleccionar un cliente. 3. Observar las pestañas. | Cualquier cliente existente | El modal se cierra. El campo "Cliente" muestra el nombre del cliente. Las pestañas "Productos" y "Adjuntos" se habilitan. Los campos editables (Responsable, Precinto, Comentario, Tipo) son visibles. | FAIL: Campo cliente no se rellena; tabs siguen deshabilitadas; modal no se cierra; app colapsa. | S1 | VG `validateReturn=false` · `devolucion-general.component.ts` (`setClientfromSelector`, `onReturnValid`) |
| DM-DEV-005 | Búsqueda de cliente en el selector modal → lista filtrada y mensaje sin resultados | Selector de clientes abierto. **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre de un cliente y pulsar buscar. 2. Ingresar texto sin coincidencias (ej. `"ZZZZZZZ"`). | Texto 1: nombre parcial; Texto 2: `"ZZZZZZZ"` | Búsqueda 1: lista filtrada con clientes que coinciden. Búsqueda 2: mensaje «No hay clientes disponibles» (`CLI_SIN_RESULTADOS`). | FAIL: Lista no filtra; app colapsa; botón de búsqueda no responde. | S2 | XML: `CLI_SIN_RESULTADOS` · `cliente-selector.component.html` |
| DM-DEV-006 | Campos editables del Tab General → Responsable, Precinto, Comentario y Tipo aceptan entrada | Cliente seleccionado. Devolución en modo editable (nueva o guardada). **Aplicación: Siempre** | 1. Ingresar texto en los campos: Responsable (máx. 80 char), Precinto (máx. 30 char), Comentario (máx. 500 char). 2. Cambiar el selector "Tipo" a un valor distinto. | Responsable: `Test-DEV-006`; Comentario: `Test-DEV-006 comentario` | Todos los campos aceptan el texto ingresado. El selector "Tipo" muestra las opciones disponibles y registra la selección. | FAIL: Campos no editables en estado nuevo; tipos sin opciones; maxlength no respetado; app colapsa. | S3 | XML: `DEV_RESPONSABLE_DEV`, `DEV_PRECINTO_DEV`, `DEV_COMENTARIO_DEV`, `DEV_TIPO_DEV` · `devolucion-general.component.html` |
| DM-DEV-007 | Fecha de devolución visible como sólo lectura (no editable) | Formulario con cliente seleccionado. **Aplicación: Siempre** | 1. En Tab General, observar el campo "Fecha". 2. Intentar tocar el botón de fecha. | N/A | El botón de fecha muestra la fecha y hora actuales. El botón aparece deshabilitado (no abre ningún selector). | FAIL: El botón de fecha abre un picker editable; la fecha no se muestra; app colapsa. | S3 | XML: `DEV_FECHA_DEV` · `disabled="true"` en `devolucion-general.component.html` |
| DM-DEV-008 | Con VG `validateReturn = true`: campo Factura visible y modal de selector disponible tras seleccionar cliente | VG `validateReturn = true`. Formulario con cliente seleccionado. **Aplicación: Condicional (VG: `globalConfig.get("validateReturn") = true`)** | 1. Seleccionar un cliente. 2. Observar el Tab General. 3. Tocar el campo "Factura" o el componente `invoice-selector`. | N/A | Tras seleccionar cliente, aparece el campo "Factura" (vacío) y el botón/componente del selector de facturas. Las pestañas Productos y Adjuntos permanecen deshabilitadas hasta que se seleccione una factura. | FAIL: Campo Factura ausente con VG activa; selector de facturas no disponible; tabs habilitadas sin factura. | S2 | VG `validateReturn` · XML: `DEV_INVOICE` · `devolucion-general.component.html` |
| DM-DEV-009 | Modal selector de facturas → lista filtrada, seleccionar factura → campo relleno y tabs habilitadas [VG validateReturn] | VG `validateReturn = true`. Campo Factura visible. **Aplicación: Condicional (VG: `globalConfig.get("validateReturn") = true`)** | 1. Abrir el selector de facturas. 2. Observar la lista. 3. Buscar por texto parcial del número de factura. 4. Seleccionar una factura. 5. Observar el formulario. | N/A | Modal con barra de búsqueda y lista de facturas (Nro. Factura, Fecha). Al filtrar, la lista se acota. Al seleccionar: el campo "Factura" muestra el código, y las pestañas Productos y Adjuntos se habilitan. | FAIL: Modal no abre; lista vacía; búsqueda no filtra; tabs no se habilitan tras seleccionar factura; app colapsa. | S1 | VG `validateReturn` · XML: `DEV_DOC`, `DEV_FECHA_DEV` · `invoice-selector.component.html` |
| DM-DEV-010 | Cambio de factura con productos ya en carrito → modal de advertencia sobre pérdida de datos [VG validateReturn] | VG `validateReturn = true`. Factura seleccionada y al menos un producto en Tab Productos. **Aplicación: Condicional (VG: `globalConfig.get("validateReturn") = true`)** | 1. Abrir el selector de facturas. 2. Seleccionar una factura diferente a la actual. 3. Observar si aparece un modal. | N/A | Aparece un modal de alerta advirtiendo que cambiar la factura borrará los productos del carrito. El modal ofrece confirmar o cancelar. | FAIL: No aparece alerta; los productos del carrito se borran directamente sin confirmación; app colapsa. | S2 | VG `validateReturn` · XML: `DEV_HEADER_ALERTA`, `DEV_RESET_CONFIRMA` · `alertInvoiceChange` |
| DM-DEV-011 | Tab Productos → botón «Agregar Producto» (`ADD_PRODUCT`) visible; muestra selector de estructuras al pulsarlo | Tab Productos habilitada. Devolución en modo editable. **Aplicación: Siempre** | 1. Pulsar la pestaña "Productos". 2. Observar el contenido. 3. Pulsar el botón "Agregar Producto". | N/A | El botón "Agregar Producto" es visible en la parte superior. Al pulsarlo, aparece el selector de estructuras de productos (tipos y lista de estructuras). | FAIL: Botón "Agregar Producto" ausente; al pulsarlo no aparece el selector de estructuras; app colapsa. | S1 | XML: `ADD_PRODUCT` (PROD) · `productos-tab.component.html` (`addProduct`) |
| DM-DEV-012 | Seleccionar estructura en Tab Productos → lista de productos para devolver | Tab Productos con selector de estructuras visible. **Aplicación: Siempre** | 1. Tocar una estructura del listado. 2. Observar la lista de productos. | N/A | Se muestra la lista de productos de esa estructura. Cada producto puede ser seleccionado para la devolución. | FAIL: Lista vacía con estructura no vacía; app colapsa; productos de estructura incorrecta. | S1 | · `productos-tab-structure-list` / `productos-tab-return-product-list` |
| DM-DEV-013 | Seleccionar producto → acordeón con campos Cantidad Devuelta, Unidad y Motivo | Lista de productos de devolución visible. **Aplicación: Siempre** | 1. Tocar un producto de la lista para expandir su acordeón. 2. Observar los campos disponibles. | N/A | El acordeón del producto se expande mostrando: campo "Cantidad Devuelta" (numérico), selector "Unidad", selector "Motivo". | FAIL: Acordeón no expande; campos Cantidad/Unidad/Motivo ausentes; selectores sin opciones; app colapsa. | S1 | XML: `DEV_QU_PRODUCT`, `DEV_UNIT`, `DEV_MOTIVE` · `devolucion-product-list.component.html` |
| DM-DEV-014 | Ingresar cantidad devuelta en producto → producto registrado en carrito de devolución | Acordeón de producto expandido en Tab Productos. **Aplicación: Siempre** | 1. Ingresar una cantidad en el campo "Cantidad Devuelta" (ej. `3`). 2. Seleccionar unidad y motivo. 3. Observar que el producto queda registrado. | Cantidad: `3` | El producto queda registrado con la cantidad, unidad y motivo seleccionados. El botón guardar en la cabecera se habilita (si estaba deshabilitado). | FAIL: La cantidad no se acepta; el producto no se registra; botón guardar no se activa; app colapsa. | S1 | · `devolucion-product-list.component.ts` (`updateSendButtonState`) |
| DM-DEV-015 | Tab Adjuntos → imagen, archivo y firma según configuración | Formulario con cliente (y factura si `validateReturn`); tabs Adjuntos habilitadas. Devolución editable. **Aplicación: Siempre** (acordeón no visible → **N/A** para ese ítem, no FAIL) | 1. Ir a Tab Adjuntos. 2. **Imágenes**: buscar/tomar foto y verificar en carrusel. 3. **Archivo** (si VG `userCanUploadFiles`): subir PDF o imagen ligera (`test-devolucion.pdf`). 4. **Firma** (si VG `signatureReturn`): dibujar y guardar firma en el panel. 5. Continuar con guardar (**DM-DEV-016** / **019**) usando comentario `Test-DEV-015`. | Imagen de galería; archivo de prueba; Comentario: `Test-DEV-015` | Cada acordeón visible captura y muestra el adjunto. Tras guardar y reabrir desde BUSCAR, los adjuntos persisten en móvil. *Web post-envío (**018**): supuesto 9.* | FAIL: Acordeón visible no adjunta; no persiste al reabrir; app colapsa. | S1 | XML: `ADJ_ACORDEON_*`; VG `userCanUploadFiles`, `signatureReturn` · `adjunto.component`, `devoluciones-header.ts:81` |
| DM-DEV-016 | Guardar devolución → mensaje confirmación | Formulario con cliente + ≥1 producto. Botón guardar habilitado. **Aplicación: Siempre** | 1. Pulsar guardar en cabecera. 2. Observar mensaje. | Comentario: `Test-DEV-016` | Mensaje «¡Su Devolución se ha guardado!» (`DENARIO_DEV_TO_SAVE`). El formulario permanece abierto hasta navegar (atrás o home del módulo). Verificación en lista: **DM-DEV-019**. | FAIL: Sin mensaje; app colapsa. | S1 | XML: `DENARIO_DEV_TO_SAVE` · `devoluciones-header.ts` (`saveSendNewReturn(false)`, `stDelivery=3`) |
| DM-DEV-017 | Botones guardar/enviar deshabilitados con formulario sin cliente ni productos | Formulario de nueva devolución vacío o sin productos. **Aplicación: Siempre** | 1. Sin cliente seleccionado, observar los botones de guardar y enviar en la cabecera. 2. Seleccionar cliente pero sin añadir productos. | N/A | Sin cliente: ambos botones deshabilitados. Con cliente pero sin productos: botón guardar puede habilitarse (los cambios de cabecera cuentan), botón enviar deshabilitado hasta tener productos. | FAIL: Botones habilitados con formulario vacío; se guarda/envía devolución sin cliente o sin productos. | S2 | · `returnValidToSave` / `returnValidToSend` · `devoluciones-header.component.ts:84-89` |
| DM-DEV-018 | Enviar devolución → modal de confirmación → "Por Enviar" | Formulario con cliente + producto registrado. Botón enviar habilitado. **Aplicación: Siempre** | 1. Pulsar el botón enviar en la cabecera. 2. Observar el modal de confirmación. 3. Pulsar "Aceptar". 4. Verificar en la lista. | N/A | Aparece modal "¿Desea enviar la devolución?". Al aceptar: mensaje "¡Su Devolución será enviada!", la app regresa al home del módulo. En la lista, la devolución aparece como "Por Enviar" o "Enviado". | FAIL: Modal no aparece; devolución queda como "Guardado"; app no regresa al home; app colapsa. | S1 | XML: `DENARIO_DEV_CONFIRM_SEND`, `DENARIO_DEV_TO_SEND` · `saveSendNewReturn(true)` |
| DM-DEV-019 | Guardar + ir a BUSCAR → devolución aparece como "Guardado" en lista | Continuación de **DM-DEV-016** (mensaje de guardado visto). Cliente + ≥1 producto; opcionalmente adjuntos (**DM-DEV-015**). **Aplicación: Siempre** | 1. Tras guardar, navegar al home del módulo (atrás en cabecera o flujo equivalente). 2. Pulsar **"BUSCAR"**. 3. Localizar la devolución por cliente o comentario `Test-DEV-016` / `Test-DEV-015`. 4. (Opcional) Abrirla y confirmar datos y adjuntos. | Comentario: `Test-DEV-016` o `Test-DEV-015` | En lista: estatus **"Guardado"**, cliente correcto, fecha actual. Al abrir: datos de cabecera, productos y adjuntos capturados siguen visibles. | FAIL: No aparece en lista tras guardar; estatus incorrecto; datos vacíos al reabrir; app colapsa. | S1 | XML: `DENARIO_DEV_SAVED`, columnas lista · `saveSendNewReturn`, `devolucion-list.component` |
| DM-DEV-020 | Atrás sin guardar previo → sale sin modal; borrador no en BUSCAR | Devolución **nueva** con cliente y productos **sin** pulsar guardar. **Aplicación: Siempre** | 1. Completar cliente + al menos un producto. 2. **No** pulsar guardar. 3. Pulsar atrás en cabecera. 4. Ir a **"BUSCAR"**. | Comentario distinto de una guardada: p. ej. `Test-DEV-020-borrador` solo en memoria | La app sale al home del módulo **sin** modal de «Guardar y salir» / «Salir sin guardar». En BUSCAR la devolución **no** aparece (o no con los datos del borrador). *No es FAIL que no exista modal — es el comportamiento actual.* | FAIL: Aparece en lista como Guardada sin haber guardado; app colapsa al salir. | S2 | · `onBackClicked` sin `saveOrExitOpen` en devolución nueva · `devoluciones-header.component.ts:151-157` |
| DM-DEV-021 | Buscar devolución → lista con filtro en tiempo real por cliente | Home del módulo. Al menos una devolución guardada/enviada. **Aplicación: Siempre** | 1. Pulsar "BUSCAR". 2. Observar la lista. 3. Ingresar texto en la barra de búsqueda (nombre de cliente). | Texto: nombre parcial de cliente | Lista visible con: Nro. Ref., Cliente (código - nombre), Estatus, Fecha. Al escribir, la lista filtra en tiempo real. El botón eliminar aparece SOLO para devoluciones con estatus "Guardado". | FAIL: Lista vacía teniendo devoluciones; búsqueda no filtra; botón eliminar en enviadas; app colapsa. | S1 | XML: `DEV_BUSCAR_DEVOLUCION`, `DENARIO_DEV_*` · `devolucion-list.component.html` (`handleInput`, delete `stDelivery===3`) |
| DM-DEV-022 | Abrir devolución "Guardado" desde lista → formulario editable con botones activos | Lista con al menos una devolución "Guardado". Ubicación activa si VG `userMustActivateGPS`. **Aplicación: Siempre** | 1. Tocar una devolución con estatus "Guardado". 2. Observar el formulario. | N/A | El formulario carga con datos previos (cliente, productos, campos de cabecera). Las 3 tabs están accesibles. Botones guardar y enviar visibles en cabecera. Campos del Tab General editables. | FAIL: Formulario en blanco; modo solo lectura; botones ausentes; app colapsa. | S2 | · `devolucion-list.component.ts` (`onReturnSelected`, `stDelivery===3`) |
| DM-DEV-023 | Abrir devolución "Por Enviar" o "Enviado" → solo lectura sin botones guardar/enviar | Lista con devolución "Por Enviar" o "Enviado". **Aplicación: Siempre** | 1. Tocar una devolución con estatus "Por Enviar" o "Enviado". 2. Observar el formulario. | N/A | El formulario muestra los datos en modo solo lectura (`returnSent = true`). Los campos del Tab General están deshabilitados. No aparece el selector modal de clientes. Los botones guardar/enviar están ocultos en la cabecera. | FAIL: Campos editables para devolución enviada; botones guardar/enviar visibles; app permite reenviar. | S2 | `src/app/services/returns/return-logic.service.ts:293` (`returnSent = stDelivery === null || · `return-logic.service.ts:293` (`returnSent`, oculta botones cabecera) |
| DM-DEV-024 | Eliminar devolución "Guardado" desde la lista → modal de confirmación y desaparece | Lista con al menos una devolución "Guardado". **Aplicación: Siempre** | 1. Localizar devolución "Guardado" (botón basura visible). 2. Pulsar el botón de eliminar. 3. Pulsar "Eliminar" en el modal de confirmación. | N/A | Aparece modal "¿Desea eliminar la devolución?". Al confirmar, la devolución desaparece de la lista. El botón eliminar solo aparece para estatus "Guardado". | FAIL: No aparece modal; devolución persiste; botón eliminar visible para enviadas; app colapsa. | S2 | XML: `DENARIO_DEV_CONFIRM_DELETE` · `devolucion-list.component.ts` (`deleteReturn`) |
| DM-DEV-025 | Botón atrás desde formulario o lista → regresa al home del módulo | Formulario o lista de devoluciones activos (sin cambios pendientes). **Aplicación: Siempre** | 1. Desde el formulario sin cambios o desde la lista, pulsar la flecha atrás en la cabecera. | N/A | App navega al home del módulo devoluciones (pantalla con 2 botones). | FAIL: Navega a Home principal; permanece en la pantalla actual; botón no responde. | S2 | · `devoluciones-container.component.ts` (`backRoute` → home módulo) |

---

```gherkin
# DM-DEV-004 / DM-DEV-013 / DM-DEV-014 — Happy path nueva devolución (sin validateReturn)
Dado que estoy en el formulario de nueva devolución
Cuando selecciono un cliente
Entonces las pestañas Productos y Adjuntos se habilitan
Cuando voy al Tab Productos y pulso "Agregar Producto"
  Y selecciono una estructura y un producto
  Y ingreso cantidad "3", selecciono unidad y motivo
Entonces el producto queda registrado en el carrito de devolución
```

```gherkin
# DM-DEV-015 / DM-DEV-016 / DM-DEV-019 — Adjuntos, guardar y verificar en lista
Dado que tengo una devolución con cliente, producto y tabs Adjuntos habilitadas
Cuando en Tab Adjuntos agrego imagen y, si la UI lo muestra, archivo y firma
Entonces cada adjunto capturado aparece en el componente
Cuando pulso guardar y aparece el mensaje de guardado
  Y voy a BUSCAR
Entonces la devolución aparece como "Guardado" con los datos y adjuntos ingresados
```

```gherkin
# DM-DEV-016 / DM-DEV-018 — Guardar y enviar devolución
Dado que el formulario tiene cliente y al menos un producto registrado
Cuando pulso el botón guardar
Entonces aparece mensaje "¡Su Devolución se ha guardado!"
Cuando pulso el botón enviar y acepto la confirmación
Entonces aparece mensaje "¡Su Devolución será enviada!" y la app regresa al home del módulo
```

```gherkin
# DM-DEV-008 / DM-DEV-009 — validateReturn activo: factura obligatoria
Dado que la VG validateReturn está activa y tengo un cliente seleccionado
Entonces el campo "Factura" y el selector de facturas son visibles
  Y las pestañas Productos/Adjuntos permanecen deshabilitadas
Cuando abro el selector de facturas y selecciono una factura
Entonces el campo "Factura" muestra el código seleccionado
  Y las pestañas Productos y Adjuntos se habilitan
```

---

### Regresión mínima (smoke rápido)

Lista de IDs imprescindibles para validar el módulo devoluciones antes de cerrar un release (**no sustituye la ejecución de la tabla completa**; para una corrida general se recomienda ejecutar todos los casos que no sean N/A por VG):

1. **DM-DEV-001** — Home con 2 botones
2. **DM-DEV-002** — Nueva devolución, tabs bloqueadas sin cliente
3. **DM-DEV-004** — Seleccionar cliente → tabs habilitadas
4. **DM-DEV-006** — Campos editables (responsable, precinto, comentario, tipo)
5. **DM-DEV-011** — Tab Productos, botón "Agregar Producto"
6. **DM-DEV-013** — Seleccionar producto, acordeón con cantidad/unidad/motivo
7. **DM-DEV-014** — Ingresar cantidad → producto en carrito
8. **DM-DEV-015** — Adjuntos (imagen; archivo/firma si VG)
9. **DM-DEV-016** — Guardar devolución (mensaje)
10. **DM-DEV-019** — Guardar + BUSCAR → aparece Guardado
11. **DM-DEV-018** — Enviar devolución
12. **DM-DEV-021** — Lista con búsqueda
13. **DM-DEV-022** — Abrir Guardado → editable
14. **DM-DEV-024** — Eliminar Guardado


Opcional (documentar comportamiento sin modal en borrador):
- **DM-DEV-020** — Atrás sin guardar → no aparece en BUSCAR

---

### Corrida general recomendada

Además del smoke, ejecutar en la misma sesión (marcando **N/A** donde no aplique):

1. Núcleo nueva devolución: **001 → 002 → 004 → 006 → 011–014 → 015 → 016 → 019**
2. Envío y lista: **018 → 021 → 022 → 023 → 024**
3. Salida sin persistir: **020** (devolución distinta a la guardada en 019)
4. Validaciones UI: **003**, **007**, **017**, **025**
5. Condicional `validateReturn`: **008 → 009** (y **010** si hay productos en carrito)
6. Selector cliente: **005**
7. Post-envío (fuera de app): supuesto 9 — adjuntos en web

**Precondición dispositivo:** ubicación activa y permiso a Denario si `userMustActivateGPS = true`.

---

Si la VG `validateReturn` está activa, agregar al smoke:
- **DM-DEV-008** (campo Factura visible)
- **DM-DEV-009** (selector de facturas → tabs habilitadas)

---

### Supuestos y lagunas — Cobertura fuera de este guion

1. **Modal al salir (`DENARIO_BOTON_SALIR_GUARDAR` / `DENARIO_BOTON_SALIR`)**: el código solo abre `alertSaveOrExit` si `returnChanged && stDelivery === 3` (devolución ya guardada con cambios). En devolución **nueva** sin guardar, **atrás** sale sin modal (**DM-DEV-020**). Si el equipo no ve el modal ni en Guardado editado, no marcar FAIL; la persistencia se valida con **016** + **019**.

2. **GPS requerido (`userMustActivateGPS`)**: cuando activo, al pulsar "DEVOLUCIÓN" y al abrir devoluciones guardadas desde la lista, la app verifica coordenadas GPS antes de navegar. Sin GPS disponible, la acción no navega. Por depender del permiso del SO se excluye del guion; en corridas normales el GPS está disponible.

3. **`requeridedNroFactura`** (VG distinta de `validateReturn`): en Tab Productos exige el campo «Nro Factura» (`DEV_DOC`) por línea de producto y filtra productos al buscar (`productos-tab-search`). No hay caso de tabla dedicado; si la VG está activa, validar durante **013–014** que `DEV_DOC` es obligatorio. Si no aplica → **N/A**.

4. **Productos filtrados por factura** (cuando `validateReturn=true`): en este modo, el Tab Productos puede mostrar únicamente los productos que pertenecen a la factura seleccionada (función `findProductsByInvoice`). No se incluyó un caso de tabla específico para este filtro por ser un comportamiento de datos; verificar en corrida que la lista de productos corresponda a la factura elegida.

5. **Selector de unidades y motivos en producto**: los selectores de "Unidad" y "Motivo" en el acordeón del producto obtienen sus opciones de las tablas sincronizadas (`return_types`, `return_motives`). Si la lista de opciones está vacía, los campos no tienen valores seleccionables. Esto no es un fallo de UI sino de datos; documentar si ocurre y reportar al backend.

6. **Lista sin infinite scroll**: la lista de devoluciones carga todas las devoluciones de una vez (sin paginación visible en el código analizado). Para empresas con muchas devoluciones, el tiempo de carga puede ser perceptible. Observar si el overlay de carga desaparece en tiempo razonable.

7. **Devolución en estado `stDelivery = null`**: algunas devoluciones antiguas pueden tener `stDelivery = null`, que el código trata como `returnSent = true` (readonly). Si se observa en la lista como un estatus vacío o con comportamiento inesperado, reportar al equipo de desarrollo.

8. **Cambio de empresa con multiempresa**: el selector de empresa en Tab General recarga la lista de clientes del selector de clientes. No se incluyó caso de tabla por ser el mismo patrón observado en otros módulos (pedidos, cobros). Verificar en corridas con cuentas multiempresa.

9. **Adjuntos y validación en web**: **DM-DEV-015** valida captura y persistencia en móvil. Tras **DM-DEV-018** (envío), verificar en web que la misma devolución (`Test-DEV-015` / `Test-DEV-016`) muestra imagen, archivo y firma correctamente.
