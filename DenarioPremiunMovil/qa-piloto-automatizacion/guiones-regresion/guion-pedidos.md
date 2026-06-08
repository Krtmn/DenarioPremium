# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Pedidos

---

### Alcance y exclusiones

Este guion cubre el módulo de pedidos en **Android** con casos **reproducibles por un operador solo con la app** (toques, credenciales QA, datos ficticios en comentarios `Test-PED-###`, selección de clientes/productos existentes).

Incluye: creación de pedido (General, productos, totales, adjuntos), guardar/enviar, salir con cambios, lista de pedidos, copia. Ramas no ejecutables sin UI (HTTP forzado, localStorage, GPS revocado, etc.) van a **«Cobertura fuera de este guion»**.

En corrida con un cliente/empresa concreto, casos **Condicional (VG)** no visibles se marcan **N/A**, no FAIL.

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA estándar con acceso al módulo.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración está activa; si no aplica en la empresa probada, marcar **N/A**.

**Incluye:** pantalla de inicio del módulo, formulario de pedido con pestañas (General / Pedido / Total / Adjuntos), selector de clientes embebido, información de cliente, selección de productos vía `productos-tab` (estructuras → productos con acordeón, cantidad, lista de precios, unidad, descuento, almacén), totales, guardar/enviar, salir con cambios, lista de pedidos guardados/enviados con búsqueda y eliminación, y flujo de copia de pedidos.

**Excluye:** escenarios que requieran cortar la red o modo avión; manipulación de localStorage o ADB; respuestas de error HTTP del servidor forzadas; GPS obligatorio cuando el permiso está revocado; descuento manual por producto (`setProductDiscount`); selector de IVA por producto (`userCanSelectIVA`); firma digital en adjuntos (`signatureOrder`, parcial en DM-PED-028); pedido sugerido desde visitas (`desdeSugerencia`); validación de contenido del PDF en Adjuntos.

---

### Mapa rápido (inferido desde código / XML)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `pedidos` (home), `pedido` (formulario), `pedidosLista` (lista) |
| Home pedidos | `src/app/pedidos/pedidos.component.ts/html` — 3 botones: Nuevo, Buscar, Copiar |
| Formulario pedido | `src/app/pedidos/pedido/pedido.component.ts/html` — 4 pestañas, cabecera con guardar/enviar/copiar |
| Lista de pedidos | `src/app/pedidos/pedidos-lista/pedidos-lista.component.ts/html` — searchbar, lista, eliminar |
| Cabecera módulo home | `src/app/pedidos/pedidos-header/pedidos-header.component.html` — botón atrás → Home |
| Selector de clientes | `src/app/cliente-selector/cliente-selector.component.ts/html` — modal con búsqueda y lista |
| Tab Pedido (productos) | `src/app/productos-tab/productos-tab.component.ts` — embebido con `pedido=true` |
| Lista de productos pedido | `src/app/productos-tab/productos-tab-order-product-list/productos-tab-order-product-list.component.ts/html` — acordeón por producto |
| Servicio central | `src/app/pedidos/pedidos.service.ts` — estado, VG, carrito, totales |

**Pantallas y flujos:**

1. **Home pedidos** → 3 botones: "Nuevo Pedido" / "Buscar Pedido" / "Copiar Pedido".
2. **Formulario de pedido** → 4 pestañas:
   - **General**: empresa, cliente (abre selector modal), moneda (multimoneda), dirección (requerida), tipo pedido (VG), canal distribución (VG), lista de precios, N° orden, fecha pedido, fecha despacho (date picker), responsable, comentario, condición de pago, "Por aprobar".
   - **Pedido** (solo si `!viewOnly`; bloqueada hasta completar General mínimo): pantalla de estructuras → lista de productos en acordeón con cantidad, lista, unidad, almacén (VG), descuento (VG), IVA (VG).
   - **Total**: totales por moneda, descuento global (VG), límite de crédito (VG), acordeones por producto, botón eliminar ítem.
   - **Adjuntos**: componente de adjuntos, botón PDF (en nuevos pedidos).
3. **Lista de pedidos** → searchbar en tiempo real, ítems con ref/cliente/estatus/fecha, botón eliminar (solo "Guardados"), toque → abre pedido.
4. **Copia de pedido** → lista de pedidos → pedido en solo lectura con botón "Copiar" en cabecera → genera nuevo pedido editable.

**Estados del pedido:**

| Estado | Descripción | Editable | Botón eliminar en lista |
|---|---|---|---|
| Guardado (3) | Guardado localmente | Sí | Sí |
| Por Enviar (4) | Pendiente de sincronizar | No (viewOnly) | No |
| Enviado | Enviado al backend | No (viewOnly) | No |

**Condición de habilitación de pestañas Pedido y Total:**
Las pestañas están bloqueadas (`lockSegments = true`) mientras: (a) no hay cliente seleccionado, o (b) no hay dirección seleccionada, o (c) VG `validateNuOrder=true` y el campo N° orden está vacío.

**Botones guardar y enviar habilitados cuando:**
`changesMade = true` AND `cliente.idClient != null` AND `carrito.length > 0` AND sin exceso de peso en adjuntos.

**Variables globales (VG) relevantes:**

| Clave | Efecto observable |
|---|---|
| `globalConfig.get("enterpriseEnabled")` + `esMultiempresa()` | Selector empresa habilitado/deshabilitado |
| `globalConfig.get("selectOrderType")` | Muestra selector de Tipo de Pedido en General |
| `globalConfig.get("userCanSelectChannel")` | Muestra selector de Canal de Distribución |
| `globalConfig.get("userCanChangePriceList")` | Habilita selector de Lista de Precios en General |
| `globalConfig.get("validateNuOrder")` | Hace N° Orden obligatorio para habilitar tabs |
| `globalConfig.get("multiCurrency")` + `currencyModule.showConversion` | Muestra selector de moneda y tasa de cambio |
| `globalConfig.get("validateWarehouses")` | Muestra selector de almacén por producto en Tab Pedido |
| `globalConfig.get("userCanChangeWarehouse")` | Habilita selector de almacén |
| `globalConfig.get("showStock")` | Muestra stock por producto en lista de Tab Pedido |
| `globalConfig.get("showProductImages")` | Muestra imagen de producto; habilita modal de detalle |
| `globalConfig.get("userCanSelectGlobalDiscount")` | Muestra selector de descuento global en Tab Total |
| `globalConfig.get("showCreditLimit")` | Muestra límite de crédito en Tab Total con semáforo verde/rojo |
| `globalConfig.get("totalUnit")` | Muestra acordeón de total por unidad en Tab Total |
| `globalConfig.get("userCanChangePaymentConditions")` | Habilita selector de condición de pago |
| `globalConfig.get("productMinMul")` | Muestra mínimo y múltiplo por producto |
| `globalConfig.get("displayProductPoints")` | Muestra puntos por producto |
| `globalConfig.get("unitByPriceList")` | Precio desglosado por lista/unidad en lugar de precio único |

---

### Casos de prueba

**40 casos Manual-UI** — IDs consecutivos `DM-PED-001` … `DM-PED-040`. Casos **Condicional (VG)** no visibles en la empresa probada → **N/A**, no FAIL.

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte en código |
|---|---|---|---|---|---|---|---|---|
| DM-PED-001 | Acceso al módulo pedidos desde Home → pantalla de inicio con 3 botones | Sesión iniciada. App en Home. **Aplicación: Siempre** | 1. Desde Home, pulsar el botón del módulo Pedidos. | N/A | Pantalla de inicio muestra 3 botones: "Nuevo Pedido", "Buscar Pedido" y "Copiar Pedido". Título del módulo visible en cabecera. | FAIL: Pantalla en blanco; menos de 3 botones; overlay de carga no desaparece. | S1 | `src/app/pedidos/pedidos.component.html:3-23` |
| DM-PED-002 | Nuevo pedido → formulario con 4 tabs; Pedido y Total deshabilitadas sin cliente | Pantalla inicio de pedidos. **Aplicación: Siempre** | 1. Pulsar "Nuevo Pedido". 2. Observar las pestañas del formulario. | N/A | Formulario carga con 4 pestañas: General (activa), Pedido, Total, Adjuntos. Las pestañas Pedido y Total están deshabilitadas. Campo "Cliente" muestra el placeholder. Botones guardar y enviar visibles en la cabecera pero deshabilitados para acciones. | FAIL: Formulario en blanco; pestañas Pedido/Total accesibles sin cliente; app colapsa. | S1 | `src/app/pedidos/pedido/pedido.component.html:55-63`, `pedido.component.ts:180-290` |
| DM-PED-003 | Tocar pestaña Pedido o Total sin cliente seleccionado → etiquetas rojas en campos obligatorios | Formulario de pedido nuevo sin cliente. **Aplicación: Siempre** | 1. En el formulario sin cliente, tocar la pestaña "Pedido" (o "Total"). 2. Observar el Tab General. | N/A | Las pestañas no cambian (siguen bloqueadas). En el Tab General, el campo "Cliente" aparece marcado en rojo con una etiqueta de error. Si tampoco hay dirección seleccionada, la dirección también aparece en rojo. | FAIL: La pestaña cambia sin cliente; no aparecen etiquetas de error; app colapsa. | S2 | `src/app/pedidos/pedido/pedido.component.ts:471-508` (`onTouchSegment`, `segmentLock`) |
| DM-PED-004 | Abrir selector de clientes → modal con lista y búsqueda visible | Formulario de pedido nuevo. Campo "Cliente" visible. **Aplicación: Siempre** | 1. Tocar el campo "Cliente" en el Tab General. 2. Observar el modal que aparece. | N/A | Se abre un modal con: cabecera del módulo, campo de búsqueda de texto, lista de clientes con nombre, código y saldo (si no es transportista). Botón "Más detalles" visible por ítem. | FAIL: Modal no se abre; lista de clientes vacía; app colapsa al tocar el campo. | S1 | `src/app/cliente-selector/cliente-selector.component.html:1-113` |
| DM-PED-005 | Búsqueda de cliente en selector modal → resultados filtrados; sin resultados muestra mensaje | Selector de clientes abierto. **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre de un cliente conocido y pulsar el botón de búsqueda (lupa) o Enter. 2. Ingresar texto sin coincidencias (ej. `"ZZZZZZZ"`) y repetir. | Texto 1: nombre parcial de cliente existente; Texto 2: `"ZZZZZZZ"` | Búsqueda 1: la lista muestra solo los clientes que coinciden con el texto. Búsqueda 2: la lista muestra el mensaje de "sin resultados" en rojo. | FAIL: Lista no se filtra; lista vacía sin mensaje en caso de no-resultados; botón de búsqueda deshabilitado con texto. | S2 | `src/app/cliente-selector/cliente-selector.component.html:33-69` |
| DM-PED-006 | Seleccionar cliente en selector → campo relleno, dirección cargada, tabs se habilitan | Selector de clientes abierto con al menos un resultado visible. **Aplicación: Siempre** | 1. Tocar cualquier cliente de la lista del selector modal. 2. Observar el Tab General y las pestañas del formulario. | Cualquier cliente existente en la app | El modal se cierra. El campo "Cliente" muestra el nombre del cliente seleccionado. El selector "Dirección (Sucursal)" se rellena con la dirección principal del cliente. La condición de pago se carga. Si hay cliente y dirección, las pestañas Pedido y Total se habilitan. | FAIL: Modal no se cierra; campo "Cliente" no se rellena; tabs siguen deshabilitadas con cliente y dirección seleccionados; app colapsa. | S1 | `src/app/pedidos/pedido/pedido.component.ts:148-158` (ClientChanged subscription), `pedido.component.ts:490-508` (`segmentLock`) |
| DM-PED-007 | Link "Info cliente" en formulario → modal con datos del cliente | Cliente seleccionado en formulario. **Aplicación: Siempre** | 1. Con cliente seleccionado, pulsar el enlace "Info cliente" (visible debajo del campo). 2. Observar el modal. 3. Pulsar el botón de cerrar. | N/A | Se abre un modal con: empresa, nombre del cliente, código, lista de precio, RIF/NIF, contacto, email, teléfono, saldo, crédito, condición de pago, dirección. Al cerrar, se regresa al formulario. | FAIL: Modal no se abre; campos vacíos o incorrectos; botón de cerrar no responde. | S3 | `src/app/pedidos/pedido/pedido.component.html:706-808` (modal info cliente) |
| DM-PED-008 | Cambio de cliente con ítems en carrito → modal de advertencia | Formulario con **cliente A** seleccionado y al menos un producto en el carrito. **Aplicación: Siempre** | 1. Abrir selector de clientes. 2. Tocar **cliente B** (distinto de A). 3. Observar el modal. | Cliente A y B existentes en la app | Aparece modal de alerta advirtiendo que el cambio limpiará el carrito. Botones **Aceptar** y **Cancelar** visibles. | FAIL: No aparece modal; carrito se borra sin confirmación. | S2 | `cliente-selector.component.ts:276-366` (`alertClientChange`) |
| DM-PED-009 | Confirmar cambio de cliente → nuevo cliente y carrito reiniciado | Continuación de DM-PED-008 (modal visible). **Aplicación: Siempre** | 1. Pulsar **Aceptar** en el modal. 2. Observar Tab General y Tab Pedido. | Cliente B válido | Modal se cierra. Campo "Cliente" muestra **cliente B**. El carrito queda vacío (sin ítems del cliente A). Pestañas siguen habilitadas si hay dirección. | FAIL: Sigue cliente A; ítems del carrito anterior persisten; app colapsa. | S1 | `cliente-selector.component.ts:350-357` (`sendClient`) |
| DM-PED-010 | Cancelar cambio de cliente → se mantiene cliente y carrito | Continuación de DM-PED-008 (modal visible). **Aplicación: Siempre** | 1. Pulsar **Cancelar** en el modal. 2. Observar formulario. | — | Modal se cierra. Campo "Cliente" sigue mostrando **cliente A**. Los ítems del carrito permanecen. | FAIL: Cambia a cliente B; carrito se vacía; modal no se cierra. | S2 | `cliente-selector.component.ts:340-347` (role cancel) |
| DM-PED-011 | Selector de dirección del cliente → cambio actualiza la dirección; obligatorio para pestañas | Cliente seleccionado con múltiples direcciones. **Aplicación: Siempre** | 1. Abrir selector "Dirección (Sucursal)". 2. Elegir otra dirección si hay más de una. 3. Intentar cambiar a Tab Pedido sin dirección (si se puede vaciar). | Cliente con ≥2 direcciones | Dirección se actualiza al elegir. Sin dirección, tabs Pedido/Total bloqueadas y campo en rojo al intentar cambiar pestaña. | FAIL: Direcciones no listadas; tabs habilitadas sin dirección. | S2 | `pedido.component.html:134-149`, `pedido.component.ts:495-497` |
| DM-PED-012 | Fecha de despacho → calendario y fecha reflejada en el formulario | Cliente y dirección seleccionados. **Aplicación: Siempre** | 1. En Tab General, pulsar botón de fecha de despacho. 2. Elegir fecha futura en el calendario. 3. Pulsar "Aceptar". | Fecha futura cualquiera | El botón de despacho muestra la fecha elegida. | FAIL: Modal no abre; fecha no se actualiza. | S3 | `pedido.component.html:228-268` |
| DM-PED-013 | Número de orden vacío bloquea pestañas Pedido y Total | Cliente y dirección. VG `validateNuOrder = true`. **Aplicación: Condicional (VG: `globalConfig.get("validateNuOrder") = true`)** | 1. Vaciar "Número de Orden". 2. Intentar abrir Tab Pedido. | N/A | Tabs bloqueadas; campo N° orden en rojo. | FAIL: Tabs habilitadas sin N° orden. | S2 | `pedido.component.ts:499-507` |
| DM-PED-014 | Tab Pedido → pantalla de estructuras cargada | Cliente + dirección (+ N° orden si aplica VG). **Aplicación: Siempre** | 1. Pulsar Tab "Pedido". 2. Observar pantalla. | N/A | Estructuras con selectores y badges visibles. | FAIL: Pantalla en blanco. | S1 | `pedido.component.html:321-326`, `productos-tab.component.ts` |
| DM-PED-015 | Seleccionar estructura → lista de productos en acordeón | Tab Pedido, estructuras visibles. **Aplicación: Siempre** | 1. Tocar estructura con badge > 0. 2. Observar lista. | N/A | Lista de productos en acordeón cerrado con nombre, código y precio. | FAIL: Lista vacía sin mensaje. | S1 | `productos-tab-order-product-list.component.html` |
| DM-PED-016 | Expandir acordeón → cantidad, lista y unidad visibles | Lista de productos visible. **Aplicación: Siempre** | 1. Tocar un producto para expandir. 2. Observar campos. | N/A | Campos cantidad, lista de precios y unidad visibles. | FAIL: No expande. | S1 | `productos-tab-order-product-list.component.html:96-243` |
| DM-PED-017 | Ingresar cantidad → badge verde y Tab Total actualizado | Acordeón expandido. **Aplicación: Siempre** | 1. Ingresar cantidad `2`. 2. Ir a Tab Total. | Cantidad: `2` | Badge verde con `2`; totales distintos de cero en Tab Total. | FAIL: Sin badge; totales en cero. | S1 | `productos-tab-order-product-list.component.html:36-38` |
| DM-PED-018 | Cantidad bajo mínimo o no múltiplo → aviso y ajuste automático | VG `productMinMul = true`. Producto con mínimo > 1 o múltiplo > 1 en catálogo. **Aplicación: Condicional (VG: `globalConfig.get("productMinMul") = true`)** | 1. Expandir producto con mínimo/múltiplo configurado (líneas visibles en lista si VG activa). 2. Ingresar cantidad menor al mínimo o no múltipla (ej. `1` si mínimo es `5`). 3. Confirmar cantidad (salir del campo o acción que dispare validación). | Producto QA con mínimo conocido (ej. mín. `5`) | Aparece modal/aviso de mínimo y múltiplo; la cantidad en pantalla se ajusta al valor válido (mínimo o múltiplo inferior). | FAIL: Acepta cantidad inválida sin aviso; totales incorrectos. | S2 | `pedidos.service.ts:884-916` (`PED_AVISO_PMM1/PMM2`) |
| DM-PED-019 | Selector de almacén por producto en Tab Pedido | Acordeón expandido. VG almacenes activa. **Aplicación: Condicional (VG: `validateWarehouses = true` y `hideProductWarehouse` ≠ true)** | 1. Verificar selector de almacén. 2. Elegir otro almacén. | N/A | Selector visible; almacén queda reflejado en Tab Total del ítem. | FAIL: Selector ausente con VG activa. | S2 | `productos-tab-order-product-list.component.html:222-239` |
| DM-PED-020 | Búsqueda de producto por texto en Tab Pedido | Lista de productos activa (típico tras entrar a una estructura en **DM-PED-015**). **Aplicación: Siempre** | 1. Ingresar texto parcial del nombre o código (ej. palabra clave de esa sublínea). 2. Pulsar lupa o presionar Enter. 3. Observar la lista. | Ej.: estructura «Germinados» → buscar `"grano chino"` | La lista muestra productos que **coinciden con el texto** según la **lista de precios del pedido**. Pueden aparecer ítems de **otras estructuras** con el mismo texto; **no es FAIL** solo por eso (ver Supuesto #14). | FAIL: No filtra con texto válido; lista vacía sin mensaje «sin resultados»; overlay no desaparece; app colapsa. **No es FAIL** que un resultado pertenezca a otra sublínea. | S2 | `productos-tab-search.component.ts:142-151`, `productos-tab-order-product-list.component.ts:251-257` |
| DM-PED-021 | Cambiar lista de precios con ítems en carrito → modal de advertencia | Cliente + ítems en carrito. Selector **Lista de precios** habilitado en Tab General. **Aplicación: Condicional (VG: `globalConfig.get("userCanChangePriceList") = true`)** | 1. Tab General. 2. Cambiar lista de precios. 3. Observar modal. | N/A | Modal advierte que se limpiará el carrito; botones Aceptar y Cancelar. | FAIL: Sin modal; carrito se borra sin aviso. | S2 | `pedido.component.ts:790-822` |
| DM-PED-022 | Confirmar cambio de lista de precios → carrito vacío y nueva lista | Modal de **DM-PED-021** visible. VG `userCanChangePriceList` activa. **Aplicación: Condicional (VG: `globalConfig.get("userCanChangePriceList") = true`)** | 1. Pulsar Aceptar en el modal. 2. Observar carrito y lista activa. | N/A | Carrito vacío. Lista de precios queda en el valor elegido. | FAIL: Ítems anteriores persisten; lista no cambia. | S2 | `pedido.component.ts:805-814` |
| DM-PED-023 | Cancelar cambio de lista de precios → carrito y lista anteriores | Modal de **DM-PED-021** visible. VG `userCanChangePriceList` activa. **Aplicación: Condicional (VG: `globalConfig.get("userCanChangePriceList") = true`)** | 1. Pulsar Cancelar en el modal. 2. Observar. | N/A | Lista de precios vuelve al valor anterior; ítems del carrito intactos. | FAIL: Carrito se vacía; lista cambia igualmente. | S2 | `pedido.component.ts:796-802` |
| DM-PED-024 | Tab Total → totales: ítems, total base, total pedido | Al menos un producto con cantidad > 0. **Aplicación: Siempre** | 1. Ir a Tab Total. 2. Observar líneas de totales. | N/A | Visible: total ítems, total base y total pedido en moneda; líneas extra si hay descuento o IVA. | FAIL: Totales en cero con ítems en carrito. | S1 | `pedido.component.html:361-476` |
| DM-PED-025 | Acordeón por producto en Tab Total → precio, descuento, subtotal | Tab Total con al menos un producto. **Aplicación: Siempre** | 1. Expandir acordeón de un producto. 2. Observar campos. | N/A | Precio, descuento (si > 0), IVA (si > 0) y subtotal visibles. | FAIL: No expande; valores incorrectos. | S2 | `pedido.component.html:481-573` |
| DM-PED-026 | Eliminar producto desde Tab Total → totales actualizados | Tab Total con ≥2 productos. **Aplicación: Siempre** | 1. Expandir acordeón de un producto. 2. Pulsar eliminar (basura). 3. Observar totales. | N/A | Producto desaparece; totales e ítems recalculados. | FAIL: Producto permanece; totales sin cambio. | S2 | `pedido.component.html:563-568` |
| DM-PED-027 | Descuento global en Tab Total | VG `userCanSelectGlobalDiscount = true`. Ítems en carrito. **Aplicación: Condicional (VG: `globalConfig.get("userCanSelectGlobalDiscount") = true`)** | 1. Localizar selector Descuento Global. 2. Elegir un valor. 3. Observar total. | N/A | Línea de descuento global y total pedido recalculado. | FAIL: Selector ausente; total no cambia. | S2 | `pedido.component.html:335-349` |
| DM-PED-028 | Tab Adjuntos → componente visible y operable | Pedido nuevo con cliente y dirección; pestaña Adjuntos habilitada. **Aplicación: Siempre** | 1. Pulsar pestaña "Adjuntos". 2. Observar el componente de adjuntos. 3. Si la UI lo permite (sin firma obligatoria VG), añadir un adjunto de prueba y verificar que aparece en la lista del componente. | N/A | Pestaña Adjuntos muestra `app-adjunto` operable (botones/añadir según configuración). No se valida generación de PDF en este caso. | FAIL: Pestaña no visible sin motivo; componente en blanco; no responde al intentar adjuntar. | S3 | `pedido.component.html:686-690`, `adjunto.component` |
| DM-PED-029 | Botones guardar/enviar deshabilitados sin datos completos | Formulario nuevo pedido. **Aplicación: Siempre** | 1. Sin cliente ni productos: observar botones guardar/enviar en cabecera. 2. Tras seleccionar cliente y dirección pero **sin** agregar productos al carrito: observar botones otra vez. | N/A | En ambos pasos los botones permanecen **deshabilitados**. Solo se habilitan con cliente + dirección (y N° orden si VG) + ≥1 ítem en carrito + cambios realizados. *Nota: no es posible llenar el carrito sin cliente porque las pestañas Pedido/Total están bloqueadas.* | FAIL: Botones habilitados con pedido vacío o solo con cliente sin ítems; guarda pedido incompleto. | S2 | `pedidos.service.ts:476-487` |
| DM-PED-030 | Guardar pedido → confirmación y estatus "Guardado" en lista | Cliente + dirección + ≥1 ítem. Botones habilitados. **Aplicación: Siempre** | 1. Pulsar guardar en cabecera. 2. Ir a "Buscar Pedido". | Comentario: `Test-PED-030` | Mensaje de guardado; guardar deshabilitado, enviar habilitado; pedido en lista como "Guardado". | FAIL: No aparece en lista; sin mensaje. | S1 | `pedido.component.ts:519-527`, `585-592` |
| DM-PED-031 | Enviar pedido → confirmación y regreso al home | Pedido con ítems; botón enviar habilitado. **Aplicación: Siempre** | 1. Pulsar enviar. 2. Aceptar confirmación. | Comentario: `Test-PED-031` | Modal de confirmación; aviso de envío; navega a home pedidos; estatus "Por Enviar" o "Enviado" en lista. | FAIL: No envía; no navega; queda "Guardado". | S1 | `pedido.component.ts:613-643`, `529-583` |
| DM-PED-032 | Salir con **formulario dirty** → modal con opciones | Pedido con **ítems agregados o editados en esta sesión** (botones habilitados). El formulario tiene cambios desde la apertura o desde el último guardado. **Aplicación: Siempre** | 1. Pulsar atrás en cabecera del formulario con cambios sin guardar. | N/A | Modal con "Salir y guardar", "Salir sin guardar" y "Cancelar". **Nota:** reabrir un pedido Guardado sin modificar nada → pulsar atrás → salida directa sin modal → **no es FAIL** (formulario pristine, sin `changesMade`). | FAIL: Sale sin modal cuando hay cambios reales pendientes. | S2 | `pedido.component.ts:510-517` |
| DM-PED-033 | "Salir sin guardar" → no persiste pedido nuevo | Modal de **DM-PED-032** visible. Pedido **nuevo** no guardado antes. **Aplicación: Siempre** | 1. Elegir **"Salir sin guardar"** (no confundir con «Salir y guardar» de **DM-PED-040**). 2. Abrir "Buscar Pedido". | N/A | Vuelve al home/lista; el pedido nuevo **no** aparece en la lista. | FAIL: Pedido aparece guardado igualmente. | S2 | `pedido.component.ts:1567-1572` (`buttonsSalvar`, role `exit`) |
| DM-PED-034 | Buscar pedido → lista con filtro en tiempo real | Home pedidos; al menos un pedido guardado (ej. tras DM-PED-030). **Aplicación: Siempre** | 1. "Buscar Pedido". 2. Escribir en searchbar nombre de cliente o código. | Texto parcial conocido | Lista filtra en tiempo real por cliente o código. | FAIL: No filtra; lista vacía con pedidos existentes. | S2 | `pedidos-lista.component.html:24-53` |
| DM-PED-035 | Abrir pedido "Guardado" → editable | Lista con pedido "Guardado". **Aplicación: Siempre** | 1. Tocar pedido "Guardado". | N/A | Formulario editable; tabs Pedido/Total; guardar y enviar visibles. | FAIL: Solo lectura; datos vacíos. | S2 | `pedidos-lista.component.ts:68-90` |
| DM-PED-036 | Abrir pedido "Por Enviar" o "Enviado" → solo lectura | Lista con pedido enviado (típico tras DM-PED-031). **Aplicación: Siempre** | 1. Tocar pedido "Por Enviar" o "Enviado". | N/A | Solo lectura; sin Tab Pedido; sin guardar/enviar. | FAIL: Editable cuando no debe. | S2 | `pedido.component.ts:324-325` |
| DM-PED-037 | Eliminar pedido "Guardado" desde lista | Lista con pedido "Guardado". **Aplicación: Siempre** | 1. Pulsar eliminar (basura). 2. Confirmar en modal. | Pedido de prueba `Test-PED-030` | Modal de confirmación; pedido desaparece de la lista. | FAIL: Persiste; eliminar en enviados. | S2 | `pedidos-lista.component.ts:137-153` |
| DM-PED-038 | Copiar pedido → vista solo lectura con botón Copiar | Home pedidos; pedido existente. **Aplicación: Siempre** | 1. "Copiar Pedido". 2. Tocar un pedido. | N/A | Solo lectura; botón Copiar en cabecera (no guardar/enviar). | FAIL: Editable directo; sin botón Copiar. | S2 | `pedidos.component.ts:117-124` |
| DM-PED-039 | Pulsar Copiar → nuevo pedido editable con datos del original | Modo copiar (DM-PED-038). **Aplicación: Siempre** | 1. Pulsar Copiar en cabecera. | N/A | Nuevo pedido editable; mismo cliente, productos y cantidades; mensaje "Pedido copiado". | FAIL: Formulario vacío; botones deshabilitados. | S2 | `pedido.component.ts:594-611` |
| DM-PED-040 | "Salir y guardar" desde modal de salida → pedido Guardado en lista | Continuación de **DM-PED-032** (modal visible). Pedido con cliente, dirección y ≥1 ítem; **no** guardado antes desde cabecera. **Aplicación: Siempre** | 1. Elegir **"Salir y guardar"** en el modal. 2. Observar navegación. 3. Ir a "Buscar Pedido" y localizar el pedido. | Comentario: `Test-PED-040` | Navega al home de pedidos; el pedido aparece en lista con estatus **"Guardado"** y conserva cliente e ítems. Distinto de **DM-PED-033** (descartar) y de **DM-PED-030** (guardar sin salir). | FAIL: No aparece en lista; datos vacíos; sale sin guardar; app colapsa. | S2 | `pedido.component.ts:1555-1564` (`buttonsSalvar`, role `save`), `saveOrder` |

---

```gherkin
# DM-PED-006 / DM-PED-017 — Happy path: crear pedido con un producto
Dado que estoy en el formulario de nuevo pedido
  Y he seleccionado un cliente con dirección disponible
Cuando selecciono el cliente en el modal y las pestañas se habilitan
  Y entro al Tab Pedido, selecciono una estructura y expando un producto
  Y ingreso cantidad "2"
Entonces el badge verde con "2" aparece en el producto
  Y en Tab Total el pedido muestra total base distinto de cero
```

```gherkin
# DM-PED-008 / DM-PED-009 — Cambio de cliente con confirmación
Dado que tengo cliente A con ítems en el carrito
Cuando selecciono cliente B en el modal y aparece la alerta
  Y pulso Aceptar
Entonces el cliente mostrado es B y el carrito queda vacío
```

```gherkin
# DM-PED-030 / DM-PED-031 — Guardar y luego enviar
Dado que el formulario tiene cliente, dirección y al menos un ítem
  Y los botones guardar y enviar están habilitados
Cuando pulso guardar
Entonces aparece mensaje de confirmación
Cuando pulso enviar y acepto la confirmación
Entonces la app navega al home de pedidos
  Y el pedido aparece como "Por Enviar" o "Enviado" en la lista
```

```gherkin
# DM-PED-035 / DM-PED-036 — Abrir pedido según estatus
Dado que busco pedidos en la lista
Cuando abro un pedido "Guardado"
Entonces el formulario es editable
Cuando abro un pedido "Enviado"
Entonces es solo lectura sin Tab Pedido ni botones guardar/enviar
```

---

### Smoke mínimo (release rápido)

Subconjunto **corto** para validar que el módulo Pedidos funciona antes de un release o cuando hay poco tiempo. **No sustituye** la tabla completa **DM-PED-001 … DM-PED-040** ni la corrida general recomendada.

1. **DM-PED-001** — Home con 3 botones
2. **DM-PED-002** — Nuevo pedido, tabs bloqueadas sin cliente
3. **DM-PED-006** — Seleccionar cliente → tabs habilitadas
4. **DM-PED-015** — Estructura → lista de productos
5. **DM-PED-017** — Cantidad → badge y Tab Total
6. **DM-PED-024** — Tab Total con totales
7. **DM-PED-026** — Eliminar ítem desde Tab Total
8. **DM-PED-029** — Botones deshabilitados sin datos completos
9. **DM-PED-030** — Guardar pedido
10. **DM-PED-031** — Enviar pedido
11. **DM-PED-032** — Salir con cambios → modal
12. **DM-PED-034** — Buscar pedido en lista
13. **DM-PED-035** — Abrir pedido Guardado
14. **DM-PED-037** — Eliminar pedido Guardado

---

### Corrida general recomendada

Para **máxima cobertura Manual-UI** en una regresión del módulo: ejecutar **todos los casos de la tabla** (001–040), marcando **N/A** los condicionales por VG que no apliquen.

Si el tiempo es limitado pero se quiere más que el smoke mínimo, usar esta lista (incluye el smoke anterior **más** flujos frecuentes en campo):

1. Todos los ítems del **Smoke mínimo** (001, 002, 006, 015, 017, 024, 026, 029, 030, 031, 032, 034, 035, 037).
2. **DM-PED-008** — Cambio de cliente con carrito → modal (encadenar **009** o **010** en la misma sesión).
3. **DM-PED-020** — Búsqueda de producto en Tab Pedido (ej. sublínea + palabra clave).
4. **DM-PED-021** — Cambio de lista de precios (**N/A** si VG `userCanChangePriceList` inactiva; si aplica, encadenar **022** o **023**).
5. **DM-PED-028** — Tab Adjuntos.
6. **DM-PED-033** — Salir sin guardar (pedido nuevo).
7. **DM-PED-040** — Salir y guardar (pedido nuevo; usar comentario distinto a 030).
8. **DM-PED-038** — Copiar pedido (encadenar **039** en la misma sesión).

Opcionales según VG/datos QA en la misma corrida: **013**, **018**, **019**, **027**, y el resto de la tabla no listada arriba.

---

### Supuestos y lagunas — Cobertura fuera de este guion

1. **Descuento manual por producto (`setProductDiscount`)**: cuando `globalConfig.get("setProductDiscount") = true`, aparece un campo de entrada numérico para descuento manual (en lugar del selector de tabla de descuentos). No se incluyó caso de tabla al ser un VG muy específico de empresa. Verificar con equipo si aplica en el cliente probado.

2. **Selector de IVA por producto (`userCanSelectIVA`)**: cuando activo, aparece un selector de tasa de IVA por ítem en el acordeón del producto. No incluido en tabla; verificar si la empresa QA lo tiene activo.

3. **Firma en adjuntos (`signatureOrder`)**: DM-PED-028 cubre la pestaña Adjuntos sin validar firma digital. Si `signatureOrder = true`, probar firma en corrida aparte.

4. **GPS obligatorio para crear/modificar pedido (`userMustActivateGPS`)**: cuando activo, la app intenta obtener coordenadas GPS antes de permitir crear o editar un pedido. Si GPS no devuelve coordenadas, el botón "Nuevo Pedido" no navega. Excluido del guion por depender del permiso de ubicación del SO. En corridas normales (GPS disponible), el flujo es transparente.

5. **Pedido sugerido desde visitas (`desdeSugerencia`)**: cuando se accede al formulario de pedido desde el módulo de visitas con una sugerencia precargada, el componente ejecuta `sugerirPedido()`. Este flujo no es accesible directamente desde el home de pedidos y se cubre en el guion de visitas.

6. **PDF de resumen (Tab Adjuntos)**: botón "Generar PDF" en pedidos nuevos; fuera de tabla (validación de contenido PDF no es Manual-UI simple).

7. **DM-PED-029**: no incluye escenario «carrito sin cliente» porque las pestañas Pedido/Total están bloqueadas sin cliente seleccionado (comportamiento esperado de la app).

8. **Total por unidad (`totalUnit`)** y **Total por producto-unidad (`showTotalProductUnit`)**: cuando activos, añaden acordeones adicionales en Tab Total. No incluidos en tabla; observables en corridas cuando la VG esté activa.

9. **Multimoneda**: cuando `multiCurrency = true` y `currencyModule.showConversion = true`, aparece selector de moneda en Tab General y todos los totales muestran columna adicional en moneda dura. No incluido como caso explícito; el tester debe verificar estas líneas adicionales si la cuenta QA tiene multimoneda. El comportamiento de los totales es el mismo; solo se duplican en moneda opuesta.

10. **Canal de distribución (`userCanSelectChannel`)** y **Tipo de pedido (`selectOrderType`)**: selectores adicionales en Tab General cuando VG activo. Operan igual que otros selectores del formulario (observar/cambiar → campo actualizado). No incluidos en tabla para no generar duplicados con los demás selectores.

11. **Límite de crédito (`showCreditLimit`)**: cuando activo, Tab Total muestra el límite de crédito del cliente en verde (si el total del pedido no lo supera) o rojo (si lo supera). Observable como indicador visual; no incluido en tabla al ser informativo.

12. **Descuento por tabla en producto (lista de descuentos `discountList.length > 1`)**: cuando el producto tiene más de un descuento configurado, el acordeón muestra un selector de descuento y un botón de información (modal de descuentos). Este comportamiento depende de los datos del producto sincronizado. Verificar en corridas si el producto QA tiene descuentos configurados.

13. **`checkAddressClient`**: la VG `globalConfig.get("checkAddressClient")` no se vio usada directamente en el flujo UI de este análisis. Si produce validación adicional, se recomienda investigar con el equipo de desarrollo.

14. **Búsqueda en Tab Pedido no limitada a la sublínea abierta (DM-PED-020)**: aunque el tester entre a una estructura (ej. «Germinados») y busque una palabra clave de esa sublínea, la app ejecuta `getProductsSearchedByCoProductAndNaProductAndIdList` (empresa + **lista de precios del pedido**, sin filtro por estructura). Al buscar puede resetearse la estructura seleccionada. Los resultados pueden mezclar productos de otras sublíneas; es comportamiento observable, no defecto de filtrado por sublínea.
