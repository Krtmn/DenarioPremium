# Guion de regresión — Denario Premium móvil (Android)

## Módulo: Depósitos

---

### Alcance y exclusiones

Este guion cubre el módulo de depósitos de Denario Premium móvil en **Android**: pantalla de inicio del módulo, formulario de nuevo depósito (pestañas General / Cobros / Total / Adjuntos), selección de cobros a depositar, totales, guardar y enviar, salir con cambios, y lista de depósitos con búsqueda, apertura y eliminación.

El módulo vincula cobros previamente realizados con depósitos bancarios: el tester selecciona los cobros sincronizados que conforman un depósito y los asocia a una cuenta bancaria.

Constituye un **catálogo completo** de flujos observables en UI. En una corrida real se estima ejecutar ~**70 %**; el resto quedará **N/A por configuración**, no FAIL.

**Criterio de aplicabilidad:**
- **`Aplicación: Siempre`** — ejecutable con cualquier cuenta QA estándar con acceso al módulo.
- **`Aplicación: Condicional (VG: <clave>)`** — solo cuando esa configuración esté activa para la empresa probada.

**Incluye:** acceso al módulo, formulario con 4 tabs (nuevo) o 3 tabs (depósito enviado), selección de banco y carga de cobros disponibles, selección de cobros a depositar vía checkboxes, totales por moneda, guardar/enviar/salir con cambios, lista con búsqueda/filtro/abrir/eliminar.

**Excluye:** modo avión ni manipulación de red; ADB ni localStorage; validación contable exacta en el backend; flujo GPS obligatorio cuando el permiso está revocado.

---

### Mapa rápido (inferido desde código / XML)

| Elemento | Detalle |
|---|---|
| Ruta Angular | `depositos` |
| Componente raíz | `src/app/depositos/depositos.component.ts/html` — carga tags y VG |
| Contenedor/home | `src/app/depositos/depositos-container/depositos-container/depositos-container.component.ts/html` — 2 botones + navegación interna |
| Cabecera | `src/app/depositos/depositos-header/depositos-header.component.ts/html` — botón atrás, guardar, enviar, alertas |
| Formulario (tabs) | `src/app/depositos/depositos-container/deposito/deposito.component.html` — 4 tabs con switch |
| Tab General | `src/app/depositos/depositos-container/deposito-general/deposito-general.component.html` |
| Tab Cobros | `src/app/depositos/depositos-container/deposito-cobros/deposito-cobros.component.html` |
| Tab Total | `src/app/depositos/depositos-container/deposito-total/deposito-total.component.html` |
| Tab Adjuntos | `app-adjunto` embebido |
| Lista | `src/app/depositos/depositos-container/deposito-list/deposito-list.component.ts/html` |
| Servicio central | `src/app/services/deposit/deposit.service.ts` — estado, VG, cobros, totales |

**Pestañas del formulario:**

| Tag | Nombre visible | Mostrada cuando | Habilitada cuando |
|---|---|---|---|
| `DEP_PESTANA_GENERAL` | General | Siempre | Siempre (activa por defecto) |
| `DEP_PESTANA_COBROS` | Cobros | Solo cuando `!hideDeposit` (nuevo o guardado editable) | Solo tras `depositValid = true` (banco seleccionado) |
| `DEP_PESTANA_TOTAL` | Total | Siempre | Solo tras `depositValid = true` |
| `DEP_PESTANA_ADJUNTOS` | Adjuntos | Siempre | Solo tras `depositValid = true` |

**`depositValid = true`** se logra al seleccionar un banco en el Tab General. El servicio carga los cobros disponibles para ese banco y habilita las pestañas.

**`hideDeposit = true`** cuando se abre un depósito ya enviado/procesado desde la lista: los campos del Tab General quedan deshabilitados y la pestaña Cobros se oculta. El Tab Total muestra los cobros ya asociados en modo solo lectura.

**Estados del depósito observables en lista:**

| Código | Texto | Editable | Tab Cobros | Botón eliminar |
|---|---|---|---|---|
| 0 (NEW) | Nuevo | Sí | Visible | No |
| 1 (SENT) | Enviado | No (`hideDeposit=true`) | Oculta | No |
| 2 (TO_SEND) | Por Enviar | No | Oculta | No |
| 3 (SAVED) | Guardado | Sí | Visible | Sí |

**Columnas del Tab Cobros (tabla de selección):**

| Columna | Contenido |
|---|---|
| Selec | Checkbox de selección |
| Cliente | Nombre del cliente del cobro |
| Fecha Cob | Fecha del cobro |
| Referencia | ID/código del cobro |
| Monto Depósito | Monto a depositar de ese cobro |
| Monto Cobro | Monto total del cobro original |

**Variables globales (VG) relevantes:**

| Clave | Efecto observable |
|---|---|
| `globalConfig.get("multiCurrency")` | Habilita el selector de "Moneda" en Tab General; muestra fila de conversión en Tab Cobros y Tab Total |
| `globalConfig.get("enterpriseEnabled")` | Habilita el selector de empresa en Tab General |
| `globalConfig.get("userMustActivateGPS")` | Requiere GPS activo para crear/abrir depósitos editables |

**Tags clave del módulo:**

| Tag | Valor por defecto |
|---|---|
| `DEP_MODULE_NUEVO_DEPOSITO` | DEPÓSITO |
| `DEP_MODULE_BUSCAR` | BUSCAR |
| `DEP_BANCO` | Banco |
| `DEP_NRO_PLANTILLA` | Nro. Plantilla |
| `DEP_FECHA_DOC` | Fecha Doc |
| `DEP_COMENTARIO` | Comentario |
| `DEP_SELECT_COB_DEP` | Seleccione los Cobros a depositar |
| `DEP_COB_DEP` | Cobros a depositar |
| `DEP_MONTO_TOTAL_DEP` | Monto total depositado |
| `DEP_SAVE_MSG` | El Depósito se ha guardado |
| `DEP_SEND_MSG` | El Depósito será enviado |

---

### Casos de prueba

| ID | Escenario | Precondiciones | Pasos | Datos / ejemplo | Resultado esperado | Fallo observable (PASS/FAIL) | Severidad | Soporte en código |
|---|---|---|---|---|---|---|---|---|
| DM-DEP-001 | Acceso al módulo depósitos desde Home → pantalla de inicio con 2 botones | Sesión iniciada. App en Home. **Aplicación: Siempre** | 1. Acceder al módulo Depósitos desde Home. 2. Observar la pantalla. | N/A | Pantalla de inicio muestra 2 botones: "DEPÓSITO" y "BUSCAR". Título del módulo visible en cabecera. | FAIL: Pantalla en blanco; botones ausentes; app colapsa. | S1 | `src/app/depositos/depositos-container/depositos-container/depositos-container.component.html:1-30` |
| DM-DEP-002 | Botón "DEPÓSITO" → formulario con 4 tabs; Cobros/Total/Adjuntos deshabilitados | Home del módulo activo. **Aplicación: Siempre** | 1. Pulsar el botón "DEPÓSITO". 2. Observar el formulario. | N/A | Formulario carga con 4 tabs: "General" (activa), "Cobros", "Total", "Adjuntos". Las pestañas Cobros, Total y Adjuntos están deshabilitadas. El selector de Banco aparece vacío. Botones guardar y enviar visibles en cabecera (deshabilitados). | FAIL: Tabs accesibles sin banco; formulario en blanco; app colapsa. | S1 | `src/app/depositos/depositos-container/deposito/deposito.component.html:1-24` |
| DM-DEP-003 | Tocar tab deshabilitada sin banco seleccionado → pestañas no cambian | Formulario de nuevo depósito sin banco. **Aplicación: Siempre** | 1. Sin banco seleccionado, intentar tocar la pestaña "Total". 2. Observar. | N/A | Las pestañas deshabilitadas no responden al toque. El Tab General sigue activo. | FAIL: La pestaña cambia sin banco seleccionado; app colapsa. | S2 | `src/app/depositos/depositos-container/deposito/deposito.component.html:13` (`[disabled]="!depositService.depositValid"`) |
| DM-DEP-004 | Selector de Banco → muestra lista de cuentas bancarias; selección visible | Formulario con Tab General activo. **Aplicación: Siempre** | 1. Tocar el selector "Banco" en Tab General. 2. Observar las opciones disponibles. 3. Seleccionar un banco de la lista. | N/A | El selector muestra las cuentas bancarias disponibles con nombre del banco y últimos dígitos del número de cuenta (`*** XXXX`). Al seleccionar, el campo queda relleno con el banco elegido. | FAIL: Selector vacío sin opciones; al seleccionar el campo no se actualiza; app colapsa. | S1 | `src/app/depositos/depositos-container/deposito-general/deposito-general.component.html:53-61` |
| DM-DEP-005 | Seleccionar banco → número de cuenta completo visible y pestañas Cobros/Total/Adjuntos se habilitan | Selector de banco con al menos una opción. **Aplicación: Siempre** | 1. Seleccionar un banco en el Tab General. 2. Observar el campo de número de cuenta y el estado de las pestañas. | N/A | Tras seleccionar banco: aparece el campo de número de cuenta completo (solo lectura). Las pestañas Cobros, Total y Adjuntos se habilitan. Los cobros disponibles para ese banco se cargan automáticamente. | FAIL: Número de cuenta no aparece; tabs siguen deshabilitadas tras seleccionar banco; cobros no se cargan. | S1 | `src/app/depositos/depositos-container/deposito-general/deposito-general.component.html:64-69` (`*ngIf="isSelectedBank"`), `deposito.component.html:8` (`depositValid`) |
| DM-DEP-006 | Campos editables en Tab General: Nro. Plantilla, Fecha Doc (picker), Comentario | Banco seleccionado en Tab General. Nuevo depósito. **Aplicación: Siempre** | 1. Ingresar texto en el campo "Nro. Plantilla". 2. Pulsar el botón de "Fecha Doc" y seleccionar una fecha en el calendar. 3. Ingresar texto en el campo "Comentario". | Nro. Plantilla: `Test-DEP-006`; Comentario: `Test-DEP-006 comentario` | Los campos aceptan el texto ingresado. El selector de fecha abre un calendario con botones "Aceptar"/"Cancelar"; al aceptar, la fecha seleccionada se muestra en el botón. | FAIL: Campos no editables en nuevo depósito; picker de fecha no abre; fecha no se actualiza; app colapsa. | S3 | `src/app/depositos/depositos-container/deposito-general/deposito-general.component.html:72-103, 110-117` |
| DM-DEP-007 | Fecha Depósito visible como solo lectura (no editable) | Formulario activo. **Aplicación: Siempre** | 1. En Tab General, observar el campo "Fecha Depósito". 2. Intentar tocar el botón de fecha. | N/A | El botón de "Fecha Depósito" muestra la fecha y hora actuales formateadas. El botón aparece deshabilitado (`disabled="true"`) y no abre ningún selector. | FAIL: El botón abre un picker de fecha editable; la fecha depósito no se muestra. | S3 | `src/app/depositos/depositos-container/deposito-general/deposito-general.component.html:22-26` (`disabled="true"`) |
| DM-DEP-008 | Selector de Moneda habilitado (multimoneda activa) [VG multiCurrency] | Tab General activo. VG `multiCurrency = true`. **Aplicación: Condicional (VG: `globalConfig.get("multiCurrency") = true`)** | 1. Observar el selector de "Moneda" en Tab General. 2. Verificar que es operable. 3. Cambiar la moneda seleccionada. | N/A | El selector de moneda está habilitado y muestra las monedas disponibles. Al cambiar la moneda, el campo se actualiza y puede afectar la carga de cobros. | FAIL: Selector de moneda deshabilitado cuando VG lo exige; sin opciones; app colapsa al cambiar moneda. | S2 | `src/app/depositos/depositos-container/deposito-general/deposito-general.component.html:36-43`, `deposit.service.ts:188` (`disabledCurrency`) |
| DM-DEP-009 | Tab Cobros → tabla con cobros disponibles para depositar (checkboxes) | Banco seleccionado. Tab Cobros habilitada. Existen cobros enviados y no depositados para ese banco. **Aplicación: Siempre** | 1. Pulsar la pestaña "Cobros". 2. Observar la tabla. | N/A | Título "Seleccione los Cobros a depositar". Tabla con columnas: Selec (checkbox), Cliente, Fecha Cob, Referencia, Monto Depósito, Monto Cobro. Cada fila tiene un checkbox sin marcar. Al final aparece la fila "Monto total depositado" (en cero si no hay selección). | FAIL: Tabla vacía sin cobros disponibles (si se sabe que existen); checkboxes ausentes; columnas incorrectas; app colapsa. | S1 | `src/app/depositos/depositos-container/deposito-cobros/deposito-cobros.component.html:1-61` |
| DM-DEP-010 | Marcar checkbox de cobro → monto total depositado se actualiza | Tab Cobros con al menos un cobro disponible. **Aplicación: Siempre** | 1. Marcar el checkbox de un cobro de la tabla. 2. Observar el monto total al pie de la tabla. | N/A | Al marcar el checkbox, la fila queda seleccionada visualmente. El campo "Monto total depositado" al pie se actualiza mostrando el monto acumulado del cobro seleccionado. | FAIL: El checkbox no responde; el total no cambia tras marcar; app colapsa. | S1 | `src/app/depositos/depositos-container/deposito-cobros/deposito-cobros.component.html:28` (`ion-checkbox`), `(ionChange)="selectCobro()"` |
| DM-DEP-011 | Seleccionar múltiples cobros → monto total acumula cada selección | Tab Cobros con al menos 2 cobros disponibles. **Aplicación: Siempre** | 1. Marcar los checkboxes de 2 o más cobros. 2. Observar el monto total al pie. | N/A | El monto total depositado es la suma de los montos de todos los cobros marcados. | FAIL: El total no suma los cobros adicionales; total incorrecto; app colapsa. | S2 | `src/app/depositos/depositos-container/deposito-cobros/deposito-cobros.component.html:42-55` |
| DM-DEP-012 | Desmarcar cobro previamente seleccionado → monto total se reduce | Tab Cobros con al menos un cobro marcado. **Aplicación: Siempre** | 1. Con al menos un cobro marcado, desmarcar su checkbox. 2. Observar el total. | N/A | El monto total depositado disminuye (o vuelve a cero si era el único). La fila ya no queda seleccionada. | FAIL: El total no disminuye al desmarcar; el cobro permanece visualmente seleccionado; app colapsa. | S2 | `src/app/depositos/depositos-container/deposito-cobros/deposito-cobros.component.html:28` |
| DM-DEP-013 | Tab Cobros sin cobros disponibles → tabla sin filas de datos | Tab Cobros habilitada. No existen cobros enviados disponibles para el banco seleccionado. **Aplicación: Siempre** | 1. Seleccionar un banco que no tenga cobros asociados disponibles. 2. Ir al Tab Cobros. | N/A | La tabla muestra las cabeceras de columna pero sin filas de cobros. El monto total depositado aparece en cero o vacío. No hay error ni colapso. | FAIL: La app muestra un error o colapsa sin cobros; el Tab Cobros no carga. | S3 | `src/app/depositos/depositos-container/deposito-cobros/deposito-cobros.component.html:25-36` (bucle `*ngFor` sin elementos) |
| DM-DEP-014 | Tab Total → muestra solo cobros seleccionados (sin checkbox) y monto total | Al menos un cobro seleccionado en Tab Cobros. **Aplicación: Siempre** | 1. Marcar uno o más cobros en Tab Cobros. 2. Pulsar la pestaña "Total". 3. Observar la tabla. | N/A | Título "Cobros a depositar". Tabla con columnas (sin columna Selec): Cliente, Fecha Cob, Referencia, Monto Depósito, Monto Cobro. Solo aparecen las filas cuyo checkbox estaba marcado. Al final: "Monto total depositado: X [moneda]". | FAIL: Tab Total muestra todos los cobros (no solo los seleccionados); monto total incorrecto; tabla vacía aunque hay cobros marcados; app colapsa. | S1 | `src/app/depositos/depositos-container/deposito-total/deposito-total.component.html:1-54` |
| DM-DEP-015 | Tab Total con conversión de moneda visible (multimoneda activa) [VG multiCurrency] | Al menos un cobro seleccionado. VG `multiCurrency = true`. **Aplicación: Condicional (VG: `globalConfig.get("multiCurrency") = true`)** | 1. Ir al Tab Total con cobros seleccionados. 2. Observar si aparece la línea de conversión de moneda. | N/A | Debajo del monto total en la moneda principal, aparece una línea adicional con el monto convertido en la moneda de conversión (`currencyConversion.coCurrency`). | FAIL: Línea de conversión ausente con VG activa; moneda de conversión incorrecta; app colapsa. | S3 | `src/app/depositos/depositos-container/deposito-total/deposito-total.component.html:46-51` (`*ngIf="multiCurrency == 'true'"`) |
| DM-DEP-016 | Tab Adjuntos → componente de adjuntos visible | Tab Adjuntos habilitada (banco seleccionado). **Aplicación: Siempre** | 1. Pulsar la pestaña "Adjuntos". 2. Observar el contenido. | N/A | El componente de adjuntos es visible y permite añadir fotos. | FAIL: Pestaña Adjuntos vacía; componente no carga; app colapsa. | S3 | `src/app/depositos/depositos-container/deposito/deposito.component.html:43-48` |
| DM-DEP-017 | Botones guardar/enviar deshabilitados sin banco seleccionado o sin cobros marcados | Formulario de nuevo depósito en varios estados. **Aplicación: Siempre** | 1. Sin banco seleccionado, observar los botones guardar/enviar. 2. Seleccionar banco pero sin marcar ningún cobro. | N/A | Sin banco: ambos botones deshabilitados. Con banco pero sin cobros marcados: botones deshabilitados o con comportamiento limitado hasta que se marque al menos un cobro y se ingresen datos mínimos. | FAIL: Botones habilitados sin banco ni cobros; se guarda/envía un depósito sin datos; app colapsa. | S2 | `src/app/depositos/depositos-header/depositos-header.component.html:22-30` (`disabledSaveButton`, `disabledSendButton`) |
| DM-DEP-018 | Guardar depósito → mensaje de confirmación + aparece en lista como "Guardado" | Formulario con banco seleccionado + al menos un cobro marcado. Botón guardar habilitado. **Aplicación: Siempre** | 1. Pulsar el botón guardar en la cabecera. 2. Observar el mensaje. 3. Volver al home, pulsar "BUSCAR" y verificar la lista. | Nro. Plantilla: `Test-DEP-018`; Comentario: `Test-DEP-018` | Aparece mensaje de confirmación "El Depósito se ha guardado". En la lista: el registro aparece con estatus "Guardado", banco correcto, fecha y monto. | FAIL: No aparece mensaje; depósito no aparece en lista; estatus incorrecto; app colapsa. | S1 | `src/app/depositos/depositos-header/depositos-header.component.ts` (`buttonSave`), `DEP_SAVE_MSG` tag |
| DM-DEP-019 | Enviar depósito → modal de confirmación → "Por Enviar" | Formulario con datos completos y cobros seleccionados. Botón enviar habilitado. **Aplicación: Siempre** | 1. Pulsar el botón enviar en la cabecera. 2. Observar el modal de confirmación. 3. Pulsar "Aceptar". 4. Verificar en la lista. | N/A | Aparece modal de confirmación de envío. Al aceptar: mensaje "El Depósito será enviado", app regresa al home del módulo. En la lista el depósito aparece como "Por Enviar" o "Enviado". | FAIL: Modal no aparece; depósito queda como "Guardado"; app no regresa al home; app colapsa. | S1 | `src/app/depositos/depositos-header/depositos-header.component.ts` (`buttonSend`), `DEP_SEND_MSG` tag |
| DM-DEP-020 | Salir de depósito **Guardado** con cambios → modal guardar/salir/cancelar | Depósito con estatus **Guardado** abierto desde lista (ej. tras **DM-DEP-023** o **DM-DEP-018**). Banco y cobros cargados (`depositValid = true`). **Aplicación: Siempre** | 1. Modificar un campo (ej. comentario) o marcar/desmarcar un cobro. 2. Pulsar atrás en cabecera. 3. Observar modal. | Comentario: `Test-DEP-020` | Aparece modal: "Guardar y salir", "Salir sin guardar" y "Cancelar". *En depósito **nuevo** sin guardar (`stDelivery` ≠ Guardado) la app sale al home **sin** modal — ver Supuesto #8; no es FAIL.* | FAIL: Depósito ya Guardado en lista, con cambios, y atrás sale sin modal; modal sin las tres opciones; app colapsa. | S2 | `depositos-header.component.ts:152-160` (`goBack`, condición `stDelivery == SAVED`) |
| DM-DEP-021 | "Salir sin guardar" desde modal (depósito Guardado) → cambios no persisten | Continuación de **DM-DEP-020** (modal visible). **Aplicación: Siempre** | 1. Pulsar **"Salir sin guardar"** (no confundir con "Guardar y salir"). 2. Ir a BUSCAR y abrir el mismo depósito. | — | Vuelve al home del módulo. El depósito sigue en lista como Guardado **sin** los cambios del paso 1 (comentario/cobros como antes de editar). | FAIL: Persisten cambios no guardados; navega a pantalla incorrecta; guarda solo al salir. | S2 | `depositos-header.component.ts:66-72` (handler `exit`, role `exit`) |
| DM-DEP-022 | Buscar depósito → lista con filtro en tiempo real por banco/fecha | Home del módulo. Al menos un depósito guardado/enviado. **Aplicación: Siempre** | 1. Pulsar "BUSCAR". 2. Observar la lista. 3. Ingresar texto en la barra de búsqueda (nombre del banco o fecha). | Texto: nombre parcial del banco | Lista visible con: Nro Ref, Banco, Estatus, Fecha, Monto [moneda]. Al escribir, la lista filtra en tiempo real. El botón eliminar aparece SOLO para depósitos con estatus "Guardado" (stDelivery=3). | FAIL: Lista vacía teniendo depósitos; búsqueda no filtra; botón eliminar en enviados; app colapsa. | S1 | `src/app/depositos/depositos-container/deposito-list/deposito-list.component.html:1-53` |
| DM-DEP-023 | Abrir depósito "Guardado" → formulario editable con Tab Cobros visible | Lista con al menos un depósito "Guardado". **Aplicación: Siempre** | 1. Tocar un depósito con estatus "Guardado". 2. Observar el formulario. | N/A | El formulario carga con los datos previos (banco, cobros seleccionados). Las 4 tabs están disponibles: General, Cobros, Total, Adjuntos. Los campos del Tab General son editables. Tab Cobros muestra los cobros con los checkboxes en el estado guardado. | FAIL: Formulario en blanco; Tab Cobros ausente; campos no editables; app colapsa. | S2 | `src/app/depositos/depositos-container/deposito-list/deposito-list.component.ts:64-86` (`toOpenDeposit`) |
| DM-DEP-024 | Abrir depósito "Por Enviar" o "Enviado" → 3 tabs, Tab Cobros oculta, campos solo lectura | Lista con depósito "Por Enviar" o "Enviado". **Aplicación: Siempre** | 1. Tocar un depósito con estatus "Por Enviar" o "Enviado". 2. Observar el formulario. | N/A | El formulario carga en modo solo lectura (`hideDeposit=true`). Las tabs disponibles son: General, Total, Adjuntos (Tab Cobros está oculta). Los campos de Tab General (banco, Nro. Plantilla, Fecha Doc, Comentario) están deshabilitados. Botones guardar/enviar ausentes en cabecera. | FAIL: Tab Cobros visible para depósito enviado; campos editables; botones guardar/enviar presentes; app colapsa. | S2 | `src/app/depositos/depositos-container/deposito/deposito.component.html:8` (`*ngIf="!hideDeposit"`), `deposito-general.component.html:55` (`[disabled]="hideDeposit"`) |
| DM-DEP-025 | Eliminar depósito "Guardado" → modal de confirmación y desaparece | Lista con al menos un depósito "Guardado" (botón basura visible). **Aplicación: Siempre** | 1. Localizar depósito "Guardado". 2. Pulsar el botón de eliminar (ícono basura rojo). 3. Pulsar "Aceptar" en el modal de confirmación. | N/A | Aparece modal "¿Desea eliminar el depósito seleccionado?". Al confirmar, el depósito desaparece de la lista. El botón eliminar solo aparece para estatus "Guardado". | FAIL: No aparece modal; depósito persiste; botón eliminar visible para enviados; app colapsa. | S2 | `src/app/depositos/depositos-container/deposito-list/deposito-list.component.html:35-37` (`*ngIf="stDelivery === 3"`), `deposito-list.component.ts:98-107` |

---

```gherkin
# DM-DEP-005 / DM-DEP-010 / DM-DEP-014 — Happy path nuevo depósito
Dado que estoy en el formulario de nuevo depósito
Cuando selecciono un banco en el selector
Entonces el número de cuenta aparece en modo solo lectura
  Y las pestañas Cobros, Total y Adjuntos se habilitan
Cuando voy al Tab Cobros y marco los checkboxes de uno o más cobros
Entonces el "Monto total depositado" se actualiza con la suma de los montos
Cuando voy al Tab Total
Entonces veo solo los cobros marcados con sus datos y el monto total acumulado
```

```gherkin
# DM-DEP-018 / DM-DEP-019 — Guardar y enviar depósito
Dado que el formulario tiene banco seleccionado y al menos un cobro marcado
Cuando pulso el botón guardar
Entonces aparece el mensaje "El Depósito se ha guardado"
  Y el formulario permanece abierto hasta que el tester navega atrás o a BUSCAR
Cuando verifico en la lista
Entonces el depósito aparece como "Guardado"
Cuando lo abro, envío y acepto el modal de confirmación
Entonces la app regresa al home del módulo y el estatus pasa a "Por Enviar" o "Enviado"
```

```gherkin
# DM-DEP-023 / DM-DEP-024 — Abrir depósito según estatus
Dado que busco depósitos en la lista
Cuando abro un depósito "Guardado"
Entonces el formulario es editable con las 4 tabs visibles incluyendo Cobros
Cuando abro un depósito "Enviado"
Entonces el formulario es solo lectura, la pestaña Cobros está oculta y no hay botones guardar/enviar
```

---

### Regresión mínima (smoke rápido)

Lista de IDs imprescindibles para validar el módulo depósitos antes de cerrar un release (**no sustituye la ejecución de la tabla completa**; para una corrida general se recomienda ejecutar todos los casos que no sean N/A por VG):

1. **DM-DEP-001** — Home con 2 botones
2. **DM-DEP-002** — Nuevo depósito, tabs bloqueadas
3. **DM-DEP-004** — Selector de banco con opciones
4. **DM-DEP-005** — Seleccionar banco → tabs habilitadas
5. **DM-DEP-006** — Campos editables (Nro. Plantilla, Fecha Doc, Comentario)
6. **DM-DEP-009** — Tab Cobros con tabla de cobros disponibles
7. **DM-DEP-010** — Marcar cobro → monto total actualizado
8. **DM-DEP-014** — Tab Total con cobros seleccionados
9. **DM-DEP-017** — Botones deshabilitados sin datos suficientes
10. **DM-DEP-018** — Guardar depósito
11. **DM-DEP-019** — Enviar depósito
12. **DM-DEP-020** — Salir con cambios (depósito Guardado abierto desde lista) → modal
13. **DM-DEP-022** — Lista con búsqueda
14. **DM-DEP-023** — Abrir Guardado → editable con Tab Cobros
15. **DM-DEP-025** — Eliminar Guardado

---

### Supuestos y lagunas — Cobertura fuera de este guion

1. **GPS requerido (`userMustActivateGPS`)**: cuando activo, al pulsar "DEPÓSITO" y al abrir depósitos editables desde la lista, la app verifica coordenadas GPS. Sin GPS disponible, la acción no navega. Se excluye del guion por depender del permiso del SO; en corridas normales el GPS está disponible.

2. **Carga de cobros disponibles tras seleccionar banco**: los cobros que aparecen en Tab Cobros son los cobros enviados (sincronizados con el servidor) y no depositados aún para la empresa y moneda del banco seleccionado. Si el tester no ve cobros en la tabla, puede deberse a: (a) todos los cobros ya fueron depositados, o (b) no hay cobros en el rango de fechas. Verificar el estado de los cobros en el módulo de cobros antes de ejecutar DM-DEP-009.

3. **Cambio de moneda con cobros seleccionados**: si el selector de moneda es operable (multiCurrency activo) y el usuario cambia la moneda después de seleccionar cobros, existe una alerta en `deposito-general.component.html` (`changeCurrencyMsj`) que advierte del posible impacto. No se incluyó caso de tabla específico; observar el comportamiento en corridas con multiCurrency activo.

4. **Cambio de empresa con cobros seleccionados**: análogamente, `onEnterpriseSelect()` puede resetear la selección de cobros. No se incluyó caso propio; verificar en corridas multiempresa.

5. **Tab Adjuntos — firma**: si `signatureDeposit` (no confirmado en el código analizado) o alguna VG similar activa la opción de firma en adjuntos, verificar manualmente. No se encontró configuración de firma para depósitos en el código revisado.

6. **Infinite scroll en la lista**: la lista incluye `ion-infinite-scroll` pero los depósitos suelen ser un número limitado. Si el volumen es alto, la paginación carga más elementos al hacer scroll. Verificar en corridas con muchos registros.

7. **Depósito en estado `stDeposit` vs `stDelivery`**: en el código existen dos campos de estatus (`stDeposit` y `stDelivery`). El botón eliminar usa `stDelivery === 3`, mientras que el GPS check usa `stDeposit < 2`. Esta asimetría puede causar comportamiento inesperado en depósitos con valores inconsistentes entre ambos campos. Si se observa un depósito con comportamiento anómalo, documentar los valores de ambos campos y reportar al equipo de desarrollo.

8. **Modal al salir solo en depósito Guardado (`DM-DEP-020` / `DM-DEP-021`)**: `goBack()` muestra el modal de salida solo si `depositValid = true` **y** `deposit.stDelivery == Guardado (3)`. En un **depósito nuevo** (aún no guardado), pulsar atrás navega al home **sin** modal y el borrador no queda en lista. Eso es comportamiento actual de la app, no FAIL. Para probar 020–021: abrir un depósito **Guardado** desde BUSCAR, editar y luego pulsar atrás.
