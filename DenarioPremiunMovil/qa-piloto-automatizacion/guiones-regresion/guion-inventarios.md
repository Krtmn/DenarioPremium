# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Inventarios

---

### Alcance y exclusiones

Este guion cubre el módulo de toma de inventarios de Denario Premium móvil en **Android**: pantalla de inicio del módulo, formulario de nuevo inventario (pestañas General / Inventario / Resumen / Adjuntos), captura de cantidades por producto y tipo de ubicación (Exhibición / Depósito), resumen de lo capturado, flujo de "Pedido Sugerido" hacia el módulo de pedidos, guardar y enviar, salir con cambios, y lista de inventarios con búsqueda y gestión.

Constituye un **catálogo completo** de flujos observables en UI. En una corrida real se estima ejecutar ~**70 %**; el resto quedará **N/A por configuración**, no FAIL.

**31 casos Manual-UI** en la tabla (`DM-INV-001`–`031`). Si una VG o dato de catálogo no aplica, marcar **N/A** (no FAIL).

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA estándar con acceso al módulo.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración esté activa para la empresa probada; si no aplica, marcar **N/A**.

**Incluye:** acceso al módulo, formulario con 4 tabs, selector de cliente y sucursal, captura de cantidades por estructura/producto/ubicación, tabla de resumen con acciones de selección y eliminación de filas, flujo de pedido sugerido (modal de previsualización y navegación a pedido), guardar/enviar/salir con cambios, adjuntos (imagen, archivo, firma según VG), lista con búsqueda/filtro/eliminar/abrir.

**Excluye:** verificación de stock exacto calculado por el servidor; modo avión ni manipulación de red; ADB ni localStorage; flujo completo del pedido resultante (cubierto en `guion-pedidos.md`); revocar permiso GPS como única prueba de toda la corrida.

**Fuente de verdad (textos UI y tags):** `../denario-movil-para-claude.xml` (módulos `INV`, `ADJ`, `CLI`, `DEN`, `PROD`) y código en `../../src/app/inventarios/`.

**Ubicación (GPS):** si `userMustActivateGPS = true`, coordenadas del **dispositivo Android**. Sin ubicación, **INVENTARIO** puede no abrir el formulario — **N/A** por entorno, no FAIL. Activar ubicación y permiso antes de **002**, **026** y envío (**022**).

---

### Mapa rápido (código + `denario-movil-para-claude.xml`)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `inventarios` |
| Componente raíz | `src/app/inventarios/inventarios.component.ts/html` — cabecera + contenedor |
| Contenedor/home | `src/app/inventarios/inventario-container/inventario-container.component.ts/html` — 2 botones + navegación interna |
| Cabecera | `src/app/inventarios/inventario-header/inventario-header.component.ts/html` — botón atrás, guardar, enviar, alertas |
| Formulario (tabs) | `src/app/inventarios/inventario-container/inventario/inventario.component.ts/html` — 4 tabs con switch |
| Tab General | `src/app/inventarios/inventario-container/inventario-general/inventario-general.component.ts/html` |
| Tab Inventario (captura) | `src/app/inventarios/inventario-container/inventario-inventario/inventario-inventario.component.html` → usa `productos-tab` con `inventario=true` |
| Tab Resumen | `src/app/inventarios/inventario-container/inventario-actividades/inventario-actividades.component.ts/html` |
| Tab Adjuntos | componente `app-adjunto` embebido |
| Modal Pedido Sugerido | `src/app/inventarios/inventario-container/inventario-sugerido-preview/inventario-sugerido-preview.component.ts/html` |
| Lista | `src/app/inventarios/inventario-container/inventario-list/inventario-list/inventario-list.component.ts/html` |
| Servicio central | `src/app/services/inventarios/inventarios-logic.service.ts` — estado, VG, totales, sugerencia |

**Pestañas del formulario:**

| Tag | Nombre visible | Visible cuando | Habilitada cuando |
|---|---|---|---|
| `INV_GENERAL_TAB` | General | Siempre | Siempre (activa al entrar) |
| `INV_INVENTARIO_TAB` | Inventario | Visible si `hideTab = true` (nuevo y Guardado editable) | Sólo tras cliente + sucursal (`stockValid = true`) |
| `INV_ACTIVIDADES_TAB` | Resumen | Siempre | Sólo tras `stockValid = true` |
| `INV_ADJUNTOS_TAB` | Adjuntos | Siempre | Sólo tras `stockValid = true` |

**Para inventarios abiertos desde la lista** (`initInventario = false`): `stockValid` arranca en `true` y el segmento inicia en **Inventario** si `hideTab = true` (Guardado). Si **Enviado** (`hideTab = false`), la pestaña Inventario **no** aparece en el segmento — ver **DM-INV-027**.

**Estados del inventario observables:**

| Código | Texto en lista | Editable | Botón eliminar | Filas editables en Resumen |
|---|---|---|---|---|
| 0 (NEW) | Nuevo | Sí | No | Sí (checkboxes + basura) |
| 1 (SENT) | Enviado | No (solo lectura) | No | No |
| 2 (TO_SEND) | Por Enviar | No (solo lectura) | No | No |
| 3 (SAVED) | Guardado | Sí | Sí | Sí (checkboxes + basura) |

**Flujo Pedido Sugerido:**
1. Tab Resumen → botón "Pedido Sugerido" (visible solo con productos capturados).
2. Modal `InventarioSugeridoPreviewComponent`: muestra días desde/hasta el inventario anterior/siguiente y acordeones por producto con cantidades sugeridas por unidad.
3. "Aceptar" → `sugerirPedido()` → `orderServ.desdeSugerencia = true` → navega a ruta `pedido` con pedido pre-cargado.
4. "X" (cerrar) → vuelve al Tab Resumen sin acción.

**Variables globales (VG) relevantes:**

| Clave | Efecto observable |
|---|---|
| `globalConfig.get("userMustActivateGPS")` | Requiere GPS para crear nuevo inventario |
| `globalConfig.get("suggestedOrderByDispatchAndReturn")` | Muestra campo "Días para siguiente inventario" en Tab General; enriquece el modal de Pedido Sugerido con tablas de Inv. Inicial/Anterior/Despacho/Ventas |
| `globalConfig.get("expirationBatch")` | Habilita campos de lote y fecha de vencimiento en la captura de stock (Tab Inventario) |
| `globalConfig.get("signatureStock")` | Activa acordeón de firma en Tab Adjuntos |
| `globalConfig.get("userCanUploadFiles")` | Activa acordeón de archivo en Tab Adjuntos |

**Tags del módulo (selección):**

| Tag | Valor por defecto |
|---|---|
| `INV_NUEVO_INVENTARIO` | INVENTARIO |
| `INV_BUSCAR_INVENTARIO` | BUSCAR |
| `INV_GENERAL_TAB` | General |
| `INV_INVENTARIO_TAB` | Inventario |
| `INV_ACTIVIDADES_TAB` | Resumen |
| `INV_ADJUNTOS_TAB` | Adjuntos |
| `INV_PED_SUG` | Pedido Sugerido |
| `INV_ACTIVIDADES_NOSTOCKDETAIL` | No hay inventario |
| `INV_MSJ_SAVETYPESTOCK` | Inventario guardado con éxito |
| `INV_MSJ_SEND_QUESTION_TYPESTOCK` | ¿Desea enviar el Inventario? |
| `INV_SEND_STOCK_MSG` | El Inventario será enviado |
| `INV_EXH_NAME` | Exhibición |
| `INV_DEP_NAME` | Depósito |
| `CLI_SIN_RESULTADOS` (CLI) | No hay clientes disponibles |
| `INV_ERROR_LIST_ADDRESS` | Cliente sin sucursal asignada |
| `INV_MSJ_SAVE_QUESTION_TYPESTOCK` | ¿Desea guardar el Inventario? |
| `INV_DIAS_ULTIMO_INVENTARIO` / `INV_DIAS_SIGUIENTE_INVENTARIO` | Días en modal Pedido Sugerido |
| `DENARIO_BOTON_SALIR_GUARDAR` / `DENARIO_BOTON_SALIR` (DEN) | Modal salir con cambios |
| `ADJ_ACORDEON_*` (ADJ) | Imagen / archivo / firma en Tab Adjuntos |

---

### Criterio Manual-UI

Cada fila es ejecutable en Android sin ADB ni inspección de red. Textos esperados desde tags en `denario-movil-para-claude.xml`. La columna **Soporte (XML / código)** enlaza tag + fuente en el repo.

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte (XML / código) |
|---|---|---|---|---|---|---|---|---|
| DM-INV-001 | Acceso al módulo inventarios desde Home → pantalla de inicio con 2 botones | Sesión iniciada. App en Home. **Aplicación: Siempre** | 1. Acceder al módulo Inventarios desde Home. 2. Observar la pantalla. | N/A | Pantalla de inicio muestra 2 botones: "INVENTARIO" y "BUSCAR". Título del módulo visible en cabecera. | FAIL: Pantalla en blanco; botones ausentes; app colapsa. | S1 | XML: `INV_NUEVO_INVENTARIO`, `INV_BUSCAR_INVENTARIO`, `INV_NOMBRE_MODULO` · `inventario-container.component.html` |
| DM-INV-002 | Botón "INVENTARIO" → abre formulario con 4 tabs; Inventario/Resumen/Adjuntos deshabilitados sin cliente | Home del módulo activo. Ubicación activa en dispositivo si VG `userMustActivateGPS = true`. **Aplicación: Siempre** | 1. Pulsar el botón "INVENTARIO". 2. Observar las pestañas del formulario. | N/A | Formulario carga con 4 tabs: "General" (activa), "Inventario", "Resumen", "Adjuntos". Las 3 últimas están deshabilitadas. Campo "Cliente" vacío. Botones guardar y enviar visibles en cabecera (deshabilitados). *Con VG GPS y sin coords: no abre formulario — **N/A**, no FAIL.* | FAIL: Con GPS (o VG inactiva) no abre formulario; tabs accesibles sin cliente; overlay no desaparece. | S1 | XML: `INV_*_TAB` · `inventario.component.html`; VG `userMustActivateGPS` · `inventario-container.ts` (`newStockButton`) |
| DM-INV-003 | Tocar tab deshabilitada sin cliente seleccionado → las pestañas no cambian | Formulario de nuevo inventario sin cliente. **Aplicación: Siempre** | 1. Sin cliente seleccionado, intentar tocar la pestaña "Inventario" (deshabilitada). 2. Observar si cambia la pestaña activa. | N/A | Las pestañas deshabilitadas no responden al toque. El Tab General sigue activo. | FAIL: El formulario cambia a la pestaña tocada sin cliente; app colapsa. | S2 | XML: `INV_INVENTARIO_TAB` · `[disabled]="!stockValid"` · `inventario.component.html` |
| DM-INV-004 | Seleccionar cliente con sucursal → campo relleno y pestañas habilitadas | Formulario de nuevo inventario. Cliente con ≥1 dirección/sucursal sincronizada. **Aplicación: Siempre** | 1. Tocar el campo "Cliente" para abrir el modal selector. 2. Seleccionar un cliente de la lista. 3. Observar el Tab General y las pestañas. | Cualquier cliente existente en la app | El modal se cierra. El campo "Cliente" muestra el nombre del cliente. El selector "Sucursal" muestra las direcciones del cliente. Las pestañas "Inventario", "Resumen" y "Adjuntos" se habilitan. *Cliente sin sucursal: alerta `INV_ERROR_LIST_ADDRESS`; tabs no se habilitan — N/A por datos, no FAIL.* | FAIL: Con sucursal válida no se habilitan tabs; modal no cierra; app colapsa. | S1 | XML: `INV_CLIENTE`; `onClientStockValid` tras sucursal · `inventario-general.component.ts` (`setClientfromSelector`) |
| DM-INV-005 | Búsqueda de cliente en el selector modal → resultados filtrados | Selector de clientes abierto. **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre de un cliente conocido y pulsar buscar o Enter. 2. Ingresar texto sin coincidencias (ej. `"ZZZZZZZ"`). | Texto 1: nombre parcial; Texto 2: `"ZZZZZZZ"` | Búsqueda 1: lista filtrada mostrando clientes que coinciden. Búsqueda 2: mensaje «No hay clientes disponibles» (`CLI_SIN_RESULTADOS`). | FAIL: Lista no filtra; botón de búsqueda no responde; app colapsa. | S2 | XML: `CLI_SIN_RESULTADOS` · `cliente-selector.component.html` |
| DM-INV-006 | Selector de sucursal → muestra las direcciones del cliente; cambio de sucursal registrado | Cliente seleccionado en Tab General. Cliente con al menos 2 direcciones. **Aplicación: Siempre** | 1. Abrir el selector "Sucursal". 2. Observar las opciones disponibles. 3. Seleccionar una dirección diferente a la predeterminada. | N/A | El selector muestra todas las direcciones del cliente. Al cambiar, la selección queda registrada. | FAIL: Selector vacío; solo muestra una dirección cuando hay varias; cambio no persiste. | S2 | · `inventario-general.component.html` (selector sucursal) |
| DM-INV-007 | Campo "Comentario" editable en estado nuevo o guardado | Formulario con cliente y sucursal seleccionados. Estado: nuevo o guardado. **Aplicación: Siempre** | 1. Ir al Tab General. 2. Tocar el campo "Comentario". 3. Ingresar texto. | Comentario: `Test-INV-007` | El campo acepta el texto ingresado. Máx. 120 caracteres. | FAIL: Campo no acepta texto; campo visible pero bloqueado en estado editable; maxlength ignorado. | S3 | XML: `INV_COMENTARIO` · `inventario-general.component.html` |
| DM-INV-008 | Tab "Inventario" → pantalla de estructuras de producto cargada | Cliente + sucursal seleccionados. Tab Inventario habilitada. **Aplicación: Siempre** | 1. Pulsar la pestaña "Inventario". 2. Observar la pantalla. | N/A | Se muestra la pantalla de estructuras de producto: selector de empresa (si multiempresa), selector de tipo de estructura y listado de estructuras con badge de cantidad de productos. | FAIL: Pantalla en blanco; estructuras no cargan; overlay no desaparece; app colapsa. | S1 | · `inventario-inventario.component.html` → `productos-tab [inventario]` |
| DM-INV-009 | Seleccionar estructura en Tab Inventario → lista de productos con acordeones | Tab Inventario activa con estructuras visibles. **Aplicación: Siempre** | 1. Tocar una estructura del listado (badge > 0). 2. Observar la lista de productos. | N/A | Se muestra la lista de productos de esa estructura. Cada producto aparece como un acordeón cerrado con su nombre y código. | FAIL: Lista vacía aunque la estructura tiene productos; productos sin nombre/código; app colapsa. | S1 | · `productos-tab-structure-list` / `inventario-product-list` |
| DM-INV-010 | Expandir producto en acordeón → campos de entrada para Exhibición y Depósito | Lista de productos en Tab Inventario visible. **Aplicación: Siempre** | 1. Tocar un producto para expandir su acordeón. 2. Observar los campos disponibles. | N/A | El acordeón se expande mostrando secciones de "Exhibición" y "Depósito" con campos numéricos para ingresar cantidades por unidad. Si VG `expirationBatch=true`, aparecen también campos de lote y fecha de vencimiento. | FAIL: Acordeón no expande; campos de Exhibición o Depósito ausentes; no acepta entrada numérica. | S1 | XML: `INV_EXH_NAME`, `INV_DEP_NAME`; VG `expirationBatch` · `inventario-product-list` |
| DM-INV-011 | Ingresar cantidades de Exhibición y Depósito → valores se acumulan en Tab Resumen | Acordeón de producto expandido en Tab Inventario. **Aplicación: Siempre** | 1. Ingresar una cantidad en el campo de Exhibición del producto (ej. `5`). 2. Ingresar una cantidad en el campo de Depósito (ej. `10`). 3. Ir al Tab Resumen. 4. Observar la tabla. | Exhibición: `5`; Depósito: `10` | En Tab Resumen: el producto aparece en la tabla con las cantidades ingresadas en las columnas "Exhibición" y "Depósito". | FAIL: Tab Resumen no muestra el producto; los valores son 0 aunque se ingresaron cantidades; tabla vacía inesperadamente. | S1 | · `inventario-actividades.component.ts` (`rebuildTableData`) |
| DM-INV-012 | Tab Resumen → tabla visible con columnas Código, Producto, Exhibición, Depósito | Tab Resumen habilitada. Al menos un producto capturado. **Aplicación: Siempre** | 1. Pulsar la pestaña "Resumen". 2. Observar la tabla. | N/A | La tabla muestra las columnas: Código, Producto, Exhibición, Depósito. Cada producto capturado ocupa una fila. Los valores de Exhibición y Depósito corresponden a las cantidades ingresadas. | FAIL: Tabla ausente; columnas incorrectas; filas vacías con productos capturados; app colapsa. | S1 | XML: `INV_CODIGO` · `inventario-actividades.component.html` |
| DM-INV-013 | Tab Resumen sin productos capturados → mensaje "No hay inventario" visible | Tab Resumen habilitada. Ningún producto capturado aún. **Aplicación: Siempre** | 1. Ir al Tab Resumen sin haber ingresado cantidades en Tab Inventario. 2. Observar el contenido. | N/A | Se muestra el mensaje "No hay inventario" (tag `INV_ACTIVIDADES_NOSTOCKDETAIL`). No aparece tabla de productos. | FAIL: La pantalla aparece en blanco sin mensaje; la tabla muestra filas vacías; app colapsa. | S3 | XML: `INV_ACTIVIDADES_NOSTOCKDETAIL` · `inventario-actividades.component.html:70-74` |
| DM-INV-014 | Checkbox + botón "Eliminar seleccionados" en Resumen (estado editable) | Tab Resumen con al menos 2 productos capturados. Estado: nuevo o guardado. **Aplicación: Siempre** | 1. En Tab Resumen, marcar el checkbox de una o más filas. 2. Observar el contador del botón "Eliminar seleccionados". 3. Pulsar el botón. 4. Observar la tabla. | N/A | Al marcar filas, el contador del botón "Eliminar seleccionados (N)" se actualiza con el número de filas marcadas. Al pulsar, las filas seleccionadas desaparecen de la tabla y del Tab Inventario. | FAIL: Checkboxes ausentes en estado editable; contador no se actualiza; filas persisten tras eliminar; app colapsa. | S2 | · `inventario-actividades.component.html` (checkboxes, `canManageRows`) |
| DM-INV-015 | Botón basura individual en fila del Resumen → elimina esa fila (estado editable) | Tab Resumen con al menos un producto. Estado: nuevo o guardado. **Aplicación: Siempre** | 1. Localizar una fila en la tabla del Resumen. 2. Pulsar el ícono de basura de esa fila. 3. Observar la tabla. | N/A | La fila desaparece de la tabla. Si era el único producto, la tabla queda vacía y aparece el mensaje "No hay inventario". | FAIL: Fila persiste tras eliminar; la tabla queda en estado inconsistente; app colapsa. | S2 | · `deleteClientStockRow` · `inventario-actividades.component.html` |
| DM-INV-016 | Botón "Pedido Sugerido" visible solo cuando hay productos capturados | Tab Resumen accesible. **Aplicación: Siempre** | 1. Ir al Tab Resumen sin productos capturados. 2. Observar si el botón "Pedido Sugerido" aparece. 3. Ingresar al menos un producto en Tab Inventario y volver al Resumen. 4. Observar de nuevo. | N/A | Paso 2: el botón "Pedido Sugerido" NO aparece cuando no hay productos. Paso 4: el botón "Pedido Sugerido" aparece al tener productos capturados. | FAIL: Botón visible con tabla vacía; botón ausente cuando hay productos; app colapsa al pulsar. | S2 | XML: `INV_PED_SUG` · `*ngIf="clientStocksTotal.length > 0"` |
| DM-INV-017 | Pulsar "Pedido Sugerido" → abre modal de previsualización del pedido sugerido | Tab Resumen con productos capturados y botón "Pedido Sugerido" visible. **Aplicación: Siempre** | 1. Pulsar el botón "Pedido Sugerido". 2. Observar el modal que se abre. | N/A | Se abre el modal "Pedido sugerido" (título: tag `INV_PED_SUG`). El modal muestra: días desde último inventario, días hasta siguiente inventario, y una lista de productos sugeridos en acordeones. Tiene botón "Aceptar" en el footer y botón de cierre (X) en la cabecera. | FAIL: Modal no se abre; lista de productos vacía; modal sin botón Aceptar; app colapsa. | S1 | XML: `INV_PED_SUG`, `INV_DIAS_*` · `preguntarSugerirPedido` → modal |
| DM-INV-018 | Modal Pedido Sugerido → acordeones por producto con cantidad sugerida y unidad | Modal de previsualización abierto con productos sugeridos. **Aplicación: Siempre** | 1. Expandir el acordeón de un producto en el modal. 2. Observar la información mostrada. | N/A | Cada acordeón muestra el código y nombre del producto. Al expandir, se ven las unidades con la cantidad sugerida (etiqueta "Sugerido X [unidad]"). Si VG `suggestedOrderByDispatchAndReturn=true`, aparecen tablas adicionales con Inv. Inicial/Anterior/Despacho/Ventas. | FAIL: Acordeones no expanden; cantidades sugeridas en cero o ausentes; app colapsa en el modal. | S2 | XML: `INV_SUGERIDO`, tablas VG · `inventario-sugerido-preview.component.html` |
| DM-INV-019 | Cerrar el modal de Pedido Sugerido (X) → regresa al Tab Resumen sin acción | Modal de Pedido Sugerido abierto. **Aplicación: Siempre** | 1. Pulsar el botón X (cerrar) en la cabecera del modal. 2. Observar la pantalla. | N/A | El modal se cierra. La app regresa al Tab Resumen sin navegar al módulo de pedidos. El inventario permanece en su estado anterior. | FAIL: Al cerrar navega a pedidos; el inventario se modifica; app colapsa. | S2 | · `inventario-sugerido-preview` `close()` |
| DM-INV-020 | Aceptar en el modal de Pedido Sugerido → navega al formulario de pedido con datos pre-cargados | Modal de Pedido Sugerido abierto. **Aplicación: Siempre** | 1. En el modal de Pedido Sugerido, pulsar el botón "Aceptar". 2. Observar la navegación y el formulario de pedido resultante. | N/A | El modal se cierra. La app navega automáticamente al formulario de pedido (ruta `pedido`). El pedido muestra el cliente del inventario pre-cargado y los productos sugeridos con las cantidades calculadas. | FAIL: La app no navega al pedido; el formulario de pedido aparece vacío; app colapsa. | S1 | · `role === 'confirm'` → `sugerirPedido`, `orderServ.desdeSugerencia` |
| DM-INV-021 | Guardar inventario → confirmación, mensaje de éxito y aparece en lista como "Guardado" | Formulario con cliente + sucursal + ≥1 producto capturado. Botón guardar habilitado. **Aplicación: Siempre** | 1. Pulsar guardar en cabecera. 2. En modal «¿Desea guardar el Inventario?» (`INV_MSJ_SAVE_QUESTION_TYPESTOCK`), pulsar Aceptar. 3. Observar mensaje «Inventario guardado con éxito» (`INV_MSJ_SAVETYPESTOCK`). 4. Ir a home → **BUSCAR** y localizar por comentario `Test-INV-021`. | Comentario: `Test-INV-021` | Tras aceptar: mensaje de éxito. En lista: estatus **Guardado**, cliente y fecha correctos. | FAIL: Sin modal de guardar; sin mensaje de éxito; no aparece en lista; app colapsa. | S1 | XML: `INV_MSJ_SAVE_QUESTION_TYPESTOCK`, `INV_MSJ_SAVETYPESTOCK` · `sendOrSave(false)` |
| DM-INV-022 | Enviar inventario → modal de confirmación → estatus "Por Enviar" | Formulario con datos completos. Botón enviar habilitado. **Aplicación: Siempre** | 1. Pulsar el botón enviar en la cabecera. 2. Observar el modal de confirmación. 3. Pulsar "Aceptar". 4. Verificar en la lista. | N/A | Aparece modal de confirmación "¿Desea enviar el Inventario?". Al aceptar: overlay de carga, mensaje "El Inventario será enviado", app regresa al home del módulo. En la lista el inventario aparece como "Por Enviar" o "Enviado" según conectividad. | FAIL: Modal no aparece; inventario queda como "Guardado"; app no regresa al home; app colapsa. | S1 | XML: `INV_MSJ_SEND_QUESTION_TYPESTOCK`, `INV_SEND_STOCK_MSG` · `sendOrSave(true)` |
| DM-INV-023 | Salir del formulario con cambios → modal de advertencia con opciones | Formulario con cambios realizados (cliente, productos). **Aplicación: Siempre** | 1. Pulsar la flecha atrás en la cabecera del formulario. 2. Observar si aparece un modal. | N/A | Aparece modal con opciones: «Guardar y salir» (`DENARIO_BOTON_SALIR_GUARDAR`), «Salir sin guardar» (`DENARIO_BOTON_SALIR`) y Cancelar. | FAIL: La app sale directamente sin modal; el inventario se pierde sin advertencia; app colapsa. | S2 | XML: `DENARIO_BOTON_SALIR_GUARDAR`, `DENARIO_BOTON_SALIR` · `isEdit` + `alertSaveOrExit` |
| DM-INV-024 | «Salir sin guardar» desde el modal → regresa al home sin guardar | Modal de salida visible (`isEdit = true`). **Aplicación: Siempre** | 1. Pulsar «Salir sin guardar» en el modal. 2. Ir a **BUSCAR** si era inventario nuevo. | N/A | Regresa al home del módulo. Inventario nuevo **no** aparece en lista. | FAIL: Guarda igualmente; navegación incorrecta; aparece en lista sin haber guardado. | S2 | · `buttonsSalvar` role `exit` · `inventario-header.component.ts` |
| DM-INV-025 | Buscar inventario → lista con búsqueda en tiempo real | Home del módulo. Al menos un inventario guardado/enviado. **Aplicación: Siempre** | 1. Pulsar "BUSCAR". 2. Observar la lista. 3. Ingresar texto en la barra de búsqueda (nombre de cliente o código). | Texto: nombre parcial de cliente | Lista visible con: Nro. Ref., Cliente (código - nombre), Estatus, Fecha. Al escribir, la lista filtra en tiempo real. El botón eliminar aparece SOLO para inventarios "Guardado". | FAIL: Lista vacía teniendo inventarios; búsqueda no filtra; botón eliminar en enviados; app colapsa. | S1 | XML: `INV_NRO_REF`, `INV_CLIENTE`, `INV_DEV_STATUS`, `INV_FECHA` · `inventario-list.component.html` |
| DM-INV-026 | Abrir inventario "Guardado" desde lista → editable, inicia en Tab Inventario | Lista con inventario Guardado (`stDelivery=3`). Ubicación activa si VG GPS. **Aplicación: Siempre** | 1. Tocar un inventario con estatus "Guardado". 2. Observar el formulario. | N/A | El formulario carga con datos previos. Las 4 tabs están habilitadas. El formulario se posiciona en la pestaña "Inventario". Botones guardar y enviar visibles en cabecera. Las filas del Resumen tienen checkboxes y botones basura activos. | FAIL: Formulario en blanco; modo solo lectura; botones ausentes; inicia en General sin datos; app colapsa. | S2 | · `initInventario=false`, `segment=inventario`, `hideTab=true` · `inventario.component.ts` |
| DM-INV-027 | Abrir «Por Enviar» o «Enviado» → solo lectura; tab Inventario oculta | Lista con inventario enviado. **Aplicación: Siempre** | 1. Abrir registro Por Enviar o Enviado. 2. Observar pestañas y Resumen. | N/A | Tab General/Resumen/Adjuntos visibles; pestaña **Inventario no aparece** (`hideTab=false`). Campos General en solo lectura. Resumen **sin** checkboxes ni basura. Cabecera **sin** botones guardar/enviar activos. | FAIL: Tab Inventario editable; checkboxes en Resumen; permite reenviar. | S2 | · `inventarioSent`, `hideTab=false` oculta tab Inventario · `inventario-list.openClientStock` |
| DM-INV-028 | Eliminar inventario «Guardado» desde lista → borrado directo y desaparece | Lista con inventario Guardado (basura visible, `stDelivery=3`). **Aplicación: Siempre** | 1. Pulsar basura en fila Guardado. 2. Esperar overlay. 3. Observar lista y mensaje. | N/A | **No** hay modal de confirmación previo (código actual). Tras borrar: desaparece de la lista y aparece alerta de éxito. Basura solo en Guardado. | FAIL: No desaparece; basura en enviados; app colapsa. | S2 | · `deleteClientStock` sin confirmación previa; mensaje post-borrado en código |
| DM-INV-029 | Botón atrás desde formulario o lista → regresa al home del módulo | Formulario o lista de inventarios activos (sin cambios pendientes en el formulario). **Aplicación: Siempre** | 1. Desde el formulario de inventario (sin cambios) o desde la lista, pulsar la flecha atrás en la cabecera. | N/A | App navega al home del módulo inventarios (pantalla con 2 botones). | FAIL: Navega a Home principal; permanece en la pantalla actual; botón no responde. | S2 | · `backRoute` · `inventario-container.component.ts` |
| DM-INV-030 | Campo "Días para siguiente inventario" visible en Tab General [VG suggestedOrderByDispatchAndReturn] | Cliente + sucursal seleccionados. VG `suggestedOrderByDispatchAndReturn = true`. **Aplicación: Condicional (VG: `globalConfig.get("suggestedOrderByDispatchAndReturn") = true`)** | 1. Con cliente y sucursal seleccionados en Tab General, observar si aparece el campo "Días para siguiente inventario". 2. Modificar el valor numérico del campo. | Valor: `7` | Campo «Días para siguiente inventario» (`INV_DIAS_SIGUIENTE_INVENTARIO`) visible y editable. Valor visible en modal Pedido Sugerido (**017–018**). | FAIL: Campo ausente con VG activa; no editable; no refleja en modal. | S3 | VG `suggestedOrderByDispatchAndReturn` · XML: `INV_DIAS_SIGUIENTE_INVENTARIO` · `inventario-general.component.html` |
| DM-INV-031 | Tab Adjuntos → imagen, archivo y firma según configuración | Cliente + sucursal; tabs Adjuntos habilitadas. Inventario editable. **Aplicación: Siempre** (acordeón no visible → **N/A**, no FAIL) | 1. Ir a Tab Adjuntos. 2. **Imágenes**: buscar/tomar y ver en carrusel. 3. **Archivo** (si VG `userCanUploadFiles`): subir archivo ligero. 4. **Firma** (si VG `signatureStock`): dibujar y guardar. 5. Guardar (**021**) con comentario `Test-INV-031` y reabrir desde BUSCAR. | Comentario: `Test-INV-031` | Cada acordeón visible captura y persiste tras guardar/reabrir. | FAIL: Acordeón visible no adjunta o no persiste; app colapsa. | S2 | XML: `ADJ_ACORDEON_*`; VG `signatureStock`, `userCanUploadFiles` · `adjunto.component`, `inventario-general.ts:127` |

---

```gherkin
# DM-INV-004 / DM-INV-011 / DM-INV-012 — Happy path captura de inventario
Dado que estoy en el formulario de nuevo inventario
Cuando selecciono un cliente con sucursal disponible
Entonces las pestañas Inventario, Resumen y Adjuntos se habilitan
Cuando voy al Tab Inventario, selecciono una estructura y expando un producto
  Y ingreso "5" en Exhibición y "10" en Depósito
  Y voy al Tab Resumen
Entonces la tabla muestra el producto con Exhibición=5 y Depósito=10
```

```gherkin
# DM-INV-017 / DM-INV-020 — Pedido Sugerido
Dado que tengo el Tab Resumen con productos capturados
Cuando pulso el botón "Pedido Sugerido"
Entonces se abre el modal de previsualización con acordeones de productos sugeridos
Cuando pulso "Aceptar" en el modal
Entonces la app navega al formulario de pedido con el cliente y productos pre-cargados
```

```gherkin
# DM-INV-021 — Guardar inventario
Dado que el formulario tiene cliente, sucursal y al menos un producto capturado
Cuando pulso guardar y acepto «¿Desea guardar el Inventario?»
Entonces aparece «Inventario guardado con éxito»
  Y en la lista de búsqueda el inventario aparece como "Guardado"
```

---

### Regresión mínima (smoke rápido)

Lista de IDs imprescindibles para validar el módulo inventarios antes de cerrar un release (**no sustituye la ejecución de la tabla completa**; para una corrida general se recomienda ejecutar todos los casos que no sean N/A por VG):

1. **DM-INV-001** — Home del módulo, 2 botones visibles
2. **DM-INV-002** — Nuevo inventario, tabs Inventario/Resumen/Adjuntos bloqueados
3. **DM-INV-004** — Seleccionar cliente → tabs habilitados
4. **DM-INV-008** — Tab Inventario, estructuras cargadas
5. **DM-INV-010** — Expandir producto, campos Exhibición y Depósito
6. **DM-INV-011** — Ingresar cantidades → Tab Resumen refleja valores
7. **DM-INV-012** — Tab Resumen, tabla visible con columnas correctas
8. **DM-INV-016** — Botón "Pedido Sugerido" visible con productos
9. **DM-INV-017** — Abrir modal Pedido Sugerido
10. **DM-INV-020** — Aceptar → navegar a pedido pre-cargado
11. **DM-INV-021** — Guardar inventario
12. **DM-INV-022** — Enviar inventario
13. **DM-INV-023** — Salir con cambios → modal advertencia
14. **DM-INV-025** — Lista de inventarios con búsqueda
15. **DM-INV-026** — Abrir Guardado → editable en Tab Inventario
16. **DM-INV-028** — Eliminar inventario Guardado

Opcional: **DM-INV-031** (adjuntos); **DM-INV-030** si VG sugerido por despacho.

---

### Corrida general recomendada

Además del smoke, ejecutar en la misma sesión (marcando **N/A** donde no aplique):

1. Núcleo captura: **001 → 002 → 004 → 006–007 → 008–014 → 021 → 025**
2. Pedido sugerido: **016 → 017 → 019** (y **020** si se valida navegación a pedidos)
3. Envío y estados: **022 → 023–024 → 026 → 027 → 028**
4. Validaciones UI: **003**, **005**, **013**, **029**
5. Condicionales: **010** (`expirationBatch`), **018/030** (`suggestedOrderByDispatchAndReturn`), **031** (adjuntos VG)

**Precondición dispositivo:** ubicación activa si `userMustActivateGPS = true`.

---



### Supuestos y lagunas — Cobertura fuera de este guion

1. **GPS (`userMustActivateGPS`)**: sin coordenadas, **INVENTARIO** puede no abrir el formulario (silencioso). **002** y **026** documentan N/A por entorno. Con GPS normal el flujo es transparente.

2. **Expiración y lotes (`expirationBatch`)**: cuando `globalConfig.get("expirationBatch") = true`, en la captura de stock (Tab Inventario) aparecen campos adicionales de "Lote" y "Fecha de Vencimiento" por ítem. No se incluyó caso de tabla propio; verificar visibilidad de esos campos en corridas cuando la VG esté activa.

3. **Modal Pedido Sugerido — tabla extendida** (`suggestedOrderByDispatchAndReturn = true`): cuando esta VG está activa, el modal muestra tablas adicionales con Inv. Inicial, Inv. Anterior, Despacho, Cambio por Cambio, Venta, Inv. Actual, Dev. Distribución y Ventas Diarias Estimadas. La visibilidad de estas columnas no se valida en los casos de tabla por ser condicional. Verificar durante corridas con la VG activa (DM-INV-018 amplía el alcance con este dato).

4. **Tab Adjuntos**: cubierto por **DM-INV-031** (imagen, archivo con `userCanUploadFiles`, firma con `signatureStock`). Validación en web fuera de la app móvil.

5. **Inventarios con stDelivery = 0 (NEW) en lista**: un inventario "Nuevo" (stDelivery=0) no tiene botón de eliminar en la lista (el botón solo aparece para stDelivery=3 / SAVED). Si se observa un inventario en estado "Nuevo" en la lista, documentar el comportamiento al intentar abrirlo; no se incluyó caso de tabla específico.

6. **Flujo del pedido sugerido completo**: DM-INV-020 cubre la navegación al formulario de pedido. La completación, guardado y envío del pedido resultante se cubren en `guion-pedidos.md` bajo el flujo de `desdeSugerencia = true`. No duplicar esos pasos aquí.

7. **Límite de 30 días en campos de días**: el campo "Días para siguiente inventario" es un input numérico libre. No se validan límites de rango en este guion; el tester puede verificar si existen restricciones de valor mínimo/máximo en corridas.

8. **Eliminación en lista**: **DM-INV-028** refleja el código actual — borrado directo al pulsar basura, sin diálogo previo; mensaje de éxito posterior (texto hardcodeado en TS, no tag XML).
