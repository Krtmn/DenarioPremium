# Smoke Test — Módulo INVENTARIOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-01 |
| **RUN_ID** | `20260529_145657_smoke-completo` |
| **Módulo** | INVENTARIOS |
| **Dispositivo** | Infinix X6728 / Android 15 / Chrome 148 |
| **App** | `com.kiberno.denarioPremiumPro` |
| **Credenciales** | `***`/`***` (cuenta QA Yaque usuario 001) |
| **VG activas** | `expirationBatch=true`, `suggestedOrderByDispatchAndReturn=true` |
| **Estado inicial** | HOME principal (`/home`) |
| **Estado final** | HOME principal (`/home`) |
| **Resultado global** | **15 PASS · 0 FAIL · 0 SKIP · 1 N/A** |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-INV-001 | Acceso al módulo Inventarios desde Home → pantalla con 2 botones | PASS | URL `/inventarios`. Componentes `app-inventarios` + `app-inventario-container` activos. Botones "INVENTARIO" y "BUSCAR" visibles en bodyText. |
| DM-INV-002 | Botón "INVENTARIO" → formulario con 4 tabs; Inventario/Resumen/Adjuntos deshabilitados sin cliente | PASS | 4 tabs presentes. General activa (`segment-button-checked`). Inventario, Resumen y Adjuntos con `disabled=true` (`segment-button-disabled`). Botones guardar y enviar en cabecera visibles. |
| DM-INV-004 | Seleccionar cliente con sucursal → campo relleno y pestañas habilitadas | PASS | Modal selector abrió con lista de clientes. Cliente "AUTOMERCADOS PLAZA S C.A." (cód. 401) seleccionado. Modal cerró. Los 4 tabs habilitados (`disabled=false`). Campo "Días para siguiente Inventario" visible (VG `suggestedOrderByDispatchAndReturn=true`). |
| DM-INV-008 | Tab "Inventario" → pantalla de estructuras cargada | PASS | `app-inventario-inventario` activo. Estructuras visibles con badge de cantidad: AJO(1), BERRO(1), CAMPO(11), FRUTALES(1), GERMINADOS(5), HIDROPONICO(7), HORTALIZAS(7), etc. Segmento EXHIBICIÓN/DEPÓSITO visible. |
| DM-INV-010 | Expandir producto → campos Exhibición y Depósito + lote/fecha (VG expirationBatch=true) | PASS | Click en ACELGA BOLSA 150GRS abrió modal con sección "Exhibición - 1". Campos: Cantidad (type=number), Lote (type=text), Fecha de vencimiento (ion-datetime). VG `expirationBatch=true` confirmada. |
| DM-INV-011 | Ingresar cantidades Exhibición=5 y Depósito=10 → Tab Resumen refleja valores | PASS | Exhibición: cantidad=5, lote=LOTE001 (patrón `click×3 + keyboard.type`). Depósito: cantidad=10, lote=LOTE001. Tras guardar modal con checkmark: ACELGA marcada "Inventariado: Exhibición / Depósito". Tab Resumen: Exhibición=5 UNIDAD, Depósito=10 UNIDAD. |
| DM-INV-012 | Tab Resumen → tabla con columnas correctas y producto capturado | PASS | Tabla visible. Columnas: Sel, Código, Producto, Exhibición, Depósito, Acción. Fila: `046013ACG004BOL / ACELGA BOLSA 150GRS (E) / 5 UNIDAD / 10 UNIDAD`. Botón "PEDIDO SUGERIDO" visible. |
| DM-INV-016 | Botón "Pedido Sugerido" visible solo cuando hay productos capturados | PASS | Botón "Pedido Sugerido" presente en Tab Resumen al tener productos (`clientStocksTotal.length > 0`). Aparece en bodyText junto a la tabla de productos. |
| DM-INV-017 | Pulsar "Pedido Sugerido" → modal de previsualización abierto | PASS | Modal `app-inventario-sugerido-preview` abierto. Título "Pedido Sugerido". Días desde último Inventario: 1. Días para siguiente Inventario: 1. Acordeón por producto: `046013ACG004BOL - ACELGA BOLSA 150GRS (E)`. Botón "ACEPTAR" en footer. Botón X (cerrar) en cabecera. |
| DM-INV-020 | Aceptar en modal Pedido Sugerido → navegar a pedido pre-cargado | N/A | Botón "ACEPTAR" deshabilitado (`button-disabled`). `Sugerido UNIDAD: 0` — sin inventario anterior para el cliente, `quUnitSuggested=0`. Condición documentada en instrucciones de corrida. Modal cerrado con X; regresó a Tab Resumen sin acción. |
| DM-INV-021 | Guardar inventario → confirmación + mensaje éxito + aparece en lista como "Guardado" | PASS | Alert "¿Desea guardar el Inventario?" con CANCELAR/ACEPTAR. Tras ACEPTAR: alert "Inventario guardado con éxito" → OK. En BUSCAR: "Nro. Ref.: 0 / 401 - AUTOMERCADOS PLAZA S C.A. / Estatus: Guardado / Fecha: 01/06/2026". Comentario `Test-INV-021` ingresado. |
| DM-INV-022 | Enviar inventario → modal de confirmación → "El Inventario será enviado" → estatus Enviado | PASS | Inventario Guardado (Nro. Ref. 0) reabierto y enviado. Alert "¿Desea enviar el Inventario?" → ACEPTAR. Alert "El Inventario será enviado". App regresó al home del módulo. Alerta del sistema: "Inventario nro. 41 enviado exitosamente". En BUSCAR: Nro. Ref. 41, Enviado. |
| DM-INV-023 | Salir del formulario con cambios → modal de advertencia con 3 opciones | PASS | Nuevo formulario con cliente seleccionado. Click en botón atrás (`img.fechaAtras`). Alert "Denario Inventarios" con opciones: "GUARDAR Y SALIR", "SALIR SIN GUARDAR", "CANCELAR". Opción "SALIR SIN GUARDAR" usada → regresó al home del módulo. |
| DM-INV-025 | Lista BUSCAR → campos Nro. Ref./Cliente/Estatus/Fecha; búsqueda; botón borrar solo en Guardado | PASS | Componente `app-inventario-list` activo. `ion-searchbar` presente. Lista mostró múltiples inventarios con Nro. Ref., Cliente (código-nombre), Estatus, Fecha. Botón danger (basura) solo en item "Guardado"; ítems "Enviado" sin botón de borrar. |
| DM-INV-026 | Abrir inventario "Guardado" → formulario editable; tabs habilitadas | PASS (obs.) | Click con `pg.mouse.click` en coordenadas del item Guardado. Formulario cargó con datos anteriores (AUTOMERCADOS PLAZA, Fecha 1/6/2026). Los 4 tabs habilitados. Botones guardar y enviar activos. Tab Resumen con checkbox (1) y botones trash (2) activos. **OBS. conocida DM-INV-026**: formulario abrió en tab "General" en lugar de "Inventario". No bloquea edición. |
| DM-INV-028 | Eliminar inventario "Guardado" desde lista → borrado directo, desaparece de lista | PASS | Segundo inventario guardado (ALIMENTOS GOURMET CCC, Nro. Ref. 0) creado para test. Click en botón danger con `pg.mouse.click`. Alert inmediato sin confirmación previa: "¡EL Inventario se borro con exito!" → OK. Item desapareció de la lista. Lista quedó sin items Guardado. |

---

## Detalle FAIL / Observaciones

No se registraron FAIL en esta corrida.

### DM-INV-020 — N/A por quUnitSuggested=0

El botón "ACEPTAR" en el modal `inventario-sugerido-preview` permanece deshabilitado cuando todos los productos tienen `quUnitSuggested=0`. Esto ocurre porque no existe inventario anterior para el cliente AUTOMERCADOS PLAZA S C.A. en la cuenta QA Yaque, por lo que el sistema no puede calcular cantidades sugeridas positivas. El modal se abrió correctamente (DM-INV-017 PASS) y se cerró con el botón X regresando al Tab Resumen sin acción (equivalente DM-INV-019). Condición documentada en guión como N/A, no FAIL.

### DM-INV-026 — Observación persistente (defecto conocido)

El formulario de un inventario con estatus "Guardado" abre posicionado en el tab "General" en lugar de "Inventario". El código fuente tiene `segment = 'inventario'` para `initInventario=false` + `hideTab=true`, pero el comportamiento observado contradice esto. Documentado como defecto conocido en `SKILLS.md` y `lecciones-aprendidas-cdp.md`. No marcado como FAIL ya que el formulario es completamente editable en todos los tabs.

### Patrón de llenado de campos ngModel en modal de captura

Los campos `cantidad` y `lote` en el modal de captura de stock usan ngModel (no reactive forms). Se aplicó el patrón `pg.click(selector, { clickCount: 3 })` + `pg.keyboard.type(valor)` (`fillNgModelKeyboard`). El uso de `fillIonInput` (native setter + ionChange events) actualiza el DOM pero no el ngModel — sin este patrón el modal guarda con valor null.

---

## Registros creados en sistema

| Nro. Ref. | Cliente | Estatus final | Observaciones |
|-----------|---------|---------------|---------------|
| 41 | 401 — AUTOMERCADOS PLAZA S C.A. | Enviado | Inventario de prueba DM-INV-022; ACELGA 5 Exh. / 10 Dep.; comentario `Test-INV-021` |
| (N/A — Ref. 0 temporal) | 100146 — ALIMENTOS GOURMET CCC, C.A. | **Eliminado** | Inventario creado para DM-INV-028; eliminado durante la prueba |

**Nota:** El inventario Nro. Ref. 0 de ALIMENTOS GOURMET CCC fue creado únicamente para validar DM-INV-028 y fue eliminado durante la misma prueba. El inventario Nro. Ref. 41 (AUTOMERCADOS PLAZA) permanece en el sistema con estatus "Enviado".

---

*Generado por Claude Code · Playwright MCP CDP · 2026-06-01*
*RUN_ID: 20260529_145657_smoke-completo*
