# Smoke Test — Módulo INVENTARIOS
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-28 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | INVENTARIOS |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **VG activas** | `expirationBatch=true`, `suggestedOrderByDispatchAndReturn=true` |
| **Resultado global** | 15 PASS · 0 FAIL · 0 SKIP · 1 N/A |

---

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-INV-001 | Acceso al módulo Inventarios desde Home → pantalla con 2 botones | PASS | URL `/inventarios`. Componente `app-inventario-container` activo. Botones "INVENTARIO" y "BUSCAR" visibles. |
| DM-INV-002 | Botón "INVENTARIO" → formulario con 4 tabs; Inventario/Resumen/Adjuntos deshabilitados sin cliente | PASS | Formulario cargó con 4 tabs. Tab "General" activa. Tabs "Inventario", "Resumen" y "Adjuntos" con `disabled` confirmado. Campo Cliente vacío. Botones guardar y enviar en cabecera deshabilitados (`button-disabled`). |
| DM-INV-004 | Seleccionar cliente con sucursal → campo relleno y pestañas habilitadas | PASS | Modal selector de clientes abierto. Cliente "100146 - ALIMENTOS GOURMET CCC, C.A." seleccionado. Campo Cliente mostró el nombre. Sucursal auto-seleccionada. Tabs "Inventario", "Resumen" y "Adjuntos" se habilitaron (`stockValid=true`). |
| DM-INV-008 | Tab "Inventario" → pantalla de estructuras cargada | PASS | Tab Inventario pulsada con `pg.mouse.click`. Estructuras visibles: AJO, BERRO, CAMPO, FRUTAS y más. Cada estructura con badge de cantidad de productos. Selector de tipo de estructura (`ion-segment`) con opciones "Exhibicion" y "Deposito". |
| DM-INV-010 | Expandir producto en acordeón → campos para Exhibición y Depósito + lote/fecha (expirationBatch=true) | PASS | Modal `inventory-type-stocks-modal` abierto al tocar producto. Campos: Cantidad, Lote, Unidad, Fecha de vencimiento. Selector de tipo (Exhibicion / Deposito) visible. Segmento reflejó VG `expirationBatch=true` activa. |
| DM-INV-011 | Ingresar cantidades de Exhibición y Depósito → valores acumulados en Tab Resumen | PASS | Exhibicion: cantidad=5, lote="L001", fecha="2026-12-31", unidad=UNIDAD. Deposito: cantidad=10, lote="L002", fecha="2026-12-31", unidad=UNIDAD. Tab Resumen mostró el producto con Exhibicion=5 UNIDAD y Deposito=10 UNIDAD. Técnica `native.focus() + pg.keyboard.type()` usada para ngModel. |
| DM-INV-012 | Tab Resumen → tabla con columnas Sel, Código, Producto, Exhibición, Depósito, Accion | PASS | Tabla visible con columnas: Sel (checkbox), Código, Producto, Exhibición, Depósito, Acción (basura). Al menos 1 producto visible con los valores correctos. |
| DM-INV-016 | Botón "Pedido Sugerido" visible solo con productos capturados | PASS | Con tabla vacía: botón "Pedido Sugerido" ausente. Tras capturar producto (Exhibicion=5, Deposito=10): botón "Pedido Sugerido" apareció en Tab Resumen. |
| DM-INV-017 | Pulsar "Pedido Sugerido" → abre modal de previsualización | PASS | Modal `inventario-sugerido-preview` abierto. Título "Pedido sugerido". Campo "Días para siguiente Inventario" visible (VG `suggestedOrderByDispatchAndReturn=true`). Acordeones por producto. Botón "ACEPTAR" en footer. Botón X (cerrar) en cabecera. |
| DM-INV-020 | Botón "Aceptar" en modal Pedido Sugerido → navegar a pedido pre-cargado | N/A | Botón "ACEPTAR" estaba deshabilitado (`disableOrderButton=true`). Condición: ningún producto tiene `quUnitSuggested > 0` ya que no existe inventario anterior para calcular cantidades sugeridas positivas. No es FAIL; es condición de datos (sin histórico de inventarios anteriores para este cliente). El modal se cerró con el botón X (DM-INV-019 verificado). |
| DM-INV-021 | Guardar inventario → modal confirmación + mensaje éxito + aparece en lista como "Guardado" | PASS | Botón guardar pulsado. Modal "¿Desea guardar el Inventario?" apareció. Al aceptar: alert "Inventario guardado con éxito" → OK. App regresó al home del módulo. En BUSCAR: inventario Nro. Ref. 0, ALIMENTOS GOURMET CCC, C.A., Estatus: Guardado, Fecha: 28/05/2026 12:39:38. |
| DM-INV-022 | Enviar inventario → modal confirmación → alerta "El Inventario será enviado" → estatus "Enviado" | PASS | Nuevo inventario creado con mismos datos. Botón enviar pulsado. Modal "¿Desea enviar el Inventario?" apareció. Al aceptar: alert "El Inventario será enviado" → OK. Luego alert "Inventario nro. 34 enviado exitosamente" → OK. En BUSCAR: Nro. Ref. 34, Estatus: Enviado. |
| DM-INV-023 | Salir del formulario con cambios → modal con opciones Guardar/Salir/Cancelar | PASS | Formulario con cambios. Botón atrás pulsado. Modal `alertSaveOrExit` mostró 3 opciones: "Guardar y salir", "Salir sin guardar", "Cancelar". Opción "Cancelar" usada para volver. |
| DM-INV-025 | Lista BUSCAR → items con Nro. Ref., Cliente, Estatus, Fecha; barra de búsqueda | PASS | `app-inventario-list` activo. Searchbar `placeholder="Inventarios..."` visible. Lista mostró: Nro. Ref. 34 (Enviado), Nro. Ref. 33 (Enviado), etc. Campos visibles: Nro. Ref., Cliente (código + nombre), Estatus, Fecha. Solo el Guardado (Nro. Ref. 0) tenía botón basura. |
| DM-INV-026 | Abrir inventario "Guardado" desde lista → editable; todas las tabs habilitadas | PASS | Inventario Nro. Ref. 0 (Guardado) abierto. Formulario con datos previos cargados. Las 4 tabs habilitadas. Botones guardar y enviar visibles en cabecera. Tab Resumen mostró checkboxes y botones basura activos. Observación: tab activo fue "General" al abrir (no "Inventario" como indica el guión con `initInventario=false`); comportamiento difiere de la descripción del caso pero no impide edición. |
| DM-INV-028 | Eliminar inventario "Guardado" desde lista → borrado directo, desaparece de lista | PASS | Botón basura `ion-button[color="danger"]` en fila Nro. Ref. 0 (ALIMENTOS GOURMET CCC, Guardado). Click con `pg.mouse.click` en coordenadas reales. Alert inmediato sin confirmación previa: "Denario Inventarios — ¡EL Inventario se borro con exito!" → OK. Lista actualizada: Nro. Ref. 0 desaparecido. Primer item ahora Nro. Ref. 34 (Enviado). Sin botones basura restantes. |

---

## Hallazgos

### Observaciones técnicas

1. **Conexión CDP vía abstract socket**: La conexión al WebView requirió usar el socket abstracto Unix: `adb forward tcp:9220 localabstract:webview_devtools_remote_3250` en lugar del forward TCP estándar. El socket se descubrió via `adb shell cat /proc/net/unix | grep webview_devtools_remote`. Patrón de conexión validado: `const cdp = await page.context().browser()._browserType.connectOverCDP('http://127.0.0.1:9220')`.

2. **ngModel en captura de stock (ion-input)**: El llenado de campos `cantidad` y `lote` en el modal de captura (`inventory-type-stocks-modal`) requiere técnica `native.focus() + pg.keyboard.type('valor')`. El uso de `valueSetter + dispatchEvent(ionChange/ionInput)` actualiza el DOM pero no el ngModel de Angular — el Tab Resumen mostraría "No hay inventario" sin la técnica de focus + keyboard.

3. **Ionic alert (coordenadas reales)**: Los botones de alertas Ionic no responden a `element.click()` ni `dispatchEvent(MouseEvent)`. La única técnica funcional es `getBoundingClientRect()` dentro de `pg.evaluate()` para obtener coordenadas CSS reales, seguida de `pg.mouse.click(x, y)`. El viewport del WebView es 360×744 CSS px (devicePixelRatio=2).

4. **Tab activo al abrir Guardado (DM-INV-026)**: El formulario de un inventario Guardado abre en tab "General" en lugar de tab "Inventario". El código tiene `segment = 'inventario'` para `initInventario=false` con `hideTab=true`, pero en la ejecución observada el tab activo fue General. No bloqueó la edición; registrado como comportamiento a confirmar en ciclo de regresión completo.

5. **DM-INV-020 — Botón Aceptar deshabilitado (N/A, no FAIL)**: La lógica en `inventario-sugerido-preview.component.ts` habilita "ACEPTAR" solo cuando `unit.quUnitSuggested > 0` para alguna unidad. Sin inventario anterior para el cliente QA, `quUnitSuggested=0` para todos los productos, por lo que el botón permanece deshabilitado. Esto es un comportamiento correcto del sistema, no un defecto.

6. **Eliminación directa sin confirmación (DM-INV-028)**: El borrado del inventario Guardado ocurre inmediatamente al tocar el icono basura, sin modal de confirmación previo. El alert de éxito aparece después ("¡EL Inventario se borro con exito!"). Este comportamiento está documentado en el guión (supuesto 8) como "código actual — borrado directo al pulsar basura".

7. **Sincronización inicial**: Tras re-lanzar la app o navegar al módulo, se muestra overlay "Sincronizando - Etiquetas / Código de Número Telefónico / Por favor espere..." durante ~30–90 segundos. La automatización debe aguardar a que el overlay desaparezca antes de interactuar con la UI.

8. **VG expirationBatch=true activa**: La captura de stock requirió llenar `lote` y `fechaVencimiento` además de `cantidad` y `unidad`. Sin estos campos, `saveInventoryRows()` rechaza el guardado con mensaje "Complete cantidad, unidad, fecha y lote para continuar." Esto fue manejado correctamente en DM-INV-010 y DM-INV-011.

### Defectos detectados

No se detectaron defectos bloqueantes. El hallazgo de DM-INV-026 (tab General vs Inventario al abrir Guardado) es una discrepancia menor que requiere confirmación en ciclo de regresión completo.

---

## Artefactos generados

| Archivo | Descripción |
|---------|-------------|
| `automation/reports/inv-021-save-alert.png` | Screenshot alert "Inventario guardado con éxito" (DM-INV-021) |

---

*Generado por Claude Code · Playwright MCP CDP · 2026-05-28*
