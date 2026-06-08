# Lecciones DELTA — Denario Premium Móvil QA
## Solo novedades de la última corrida · Se resetea en cada corrida nueva

**RUN_ID última corrida:** `20260603_093706_smoke-completo`
**Fecha:** 2026-06-03
**Cliente:** insumar

---

> **Cómo usar este archivo:**
> - El orquestador lo lee en Paso 0 si existe y tiene contenido.
> - Contiene SOLO lo que no está en `RUNTIME.md` ni en `denario-cdp-helpers.js`.
> - Al iniciar una nueva corrida: borrar el contenido anterior y reescribir con los hallazgos nuevos.
> - Si un patrón se confirma en 2+ corridas consecutivas → mover a `RUNTIME.md` o al helper y eliminar de aquí.

---

## Patrones nuevos (esta corrida — insumar · primera corrida formal)

### CLIENTES
| # | Patrón | Descripción |
|---|--------|-------------|
| 1 | `clientes_busqueda_requiere_click_boton` | La lista de clientes NO filtra on-keyup. Requiere click en el botón search (`.clear-search` / search-circle icon) después de escribir. |
| 2 | `clientes_selector_activo_app-clientes` | El componente activo del módulo es `app-clientes` (no `app-client-home`/`app-client-list`); las sub-vistas son internas al mismo elemento. |
| 3 | `clientes_potencial_8_campos_obligatorios` | Formulario cliente potencial requiere 8 campos: naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone. |
| 4 | `clientes_delete_guardado_sin_confirmacion` | Borrar cliente potencial Guardado es inmediato con click en trash — sin alert de confirmación previo. |

### PEDIDOS
| # | Patrón | Descripción |
|---|--------|-------------|
| 5 | `pedidos_modal_cliente_usa_show-modal` | Detectar apertura del modal de cliente con `classList.contains('show-modal')`, no con ausencia de `overlay-hidden`. |
| 6 | `pedidos_ion-input-cantidad_usa_boundingRect` | Usar `getBoundingClientRect().top/width` para verificar visibilidad de ion-input cantidad dentro de acordeón (no `offsetParent`). |
| 7 | `pedidos_envio_dos_alertas` | Flujo envío pedido genera (1) "Su Pedido será enviado" → (2) "Pedido nro. X enviado exitosamente". Esperar ambas. |
| 8 | `pedidos_lista_delete_con_confirmacion` | Borrar desde la lista de pedidos requiere alert "¿Seguro que quieres eliminar este pedido?". A diferencia del tab Total que es inmediato. |
| 9 | `pedidos_buscar_filtra_realtime` | Searchbar en la lista de pedidos filtra con ionInput en tiempo real (distinto al módulo Clientes que requiere click). |

### COBROS
| # | Patrón | Descripción |
|---|--------|-------------|
| 10 | `cobros_clienteSelectModal_requiere_present()` | Para abrir el modal de selección de cliente en cobros: `document.querySelector('#clienteSelectModal').present()`. Click en ion-input NO lo abre. |
| GMP1 | `cobros_home_botones_requieren_pointer+mouse` (globalmp) | Botones COBRO/RETENCIÓN/BUSCAR en home globalmp requieren `PointerEvent(pointerdown/up) + MouseEvent(click)` combinados. `TouchEvent` solo funciona consistentemente en primer clic post-carga. Usar patrón PointerEvent para robustez. |
| GMP2 | `cobros_monto_campo_centavos_acumulativo` (globalmp) | Campo Monto (depósito/transferencia) en globalmp usa formato centavos acumulativo. Para BS 797.872,03 → Backspace×20 limpiar + `pg.keyboard.type('79787203')` + Tab. Native value setter formatea incorrectamente. |
| GMP3 | `cobros_back_CDP_no_activa_dirty_guard` (globalmp) | `img.fechaAtras` click via CDP NO activa el guard de cambios sin guardar (Angular). Hardware back button / swipe requerido. DM-COB-020/038 SKIP estructural. Confirmado en globalmp y romher. → Mover a RUNTIME.md si se confirma en 2+ clientes |
| GMP4 | `retencion_requiere_adjunto_independientemente` (globalmp + insumar) | Cobros de Retención siempre requieren adjunto para enviar ("debe agregar al menos un adjunto"), independientemente de `requiredCollectionAttachments`. VG dual-mode: cobros normales pueden tener `false`, Retención siempre `true`. |
| GMP5 | `cobros_imagenEnviar_requiere_pointer+mouse` (globalmp) | `imagenEnviar` en globalmp: solo `pg.mouse.click()` a veces no activa el handler Angular. Usar `PointerEvent(pointerdown/up) + MouseEvent(click)` via evaluate para consistencia. |
| 11 | `cobros_bankPickerModal_es_modal_separado` | El selector de banco para Depósito NO es ion-select/popover. Es `.bank-picker-trigger` que abre `#bankPickerModal`. Usar click en coords del trigger. |
| 12 | `cobros_checkbox_metodo_pago_requiere_coords_exactas` | Los checkboxes en `#eventModal` requieren `mouse.click` en coords exactas del checkbox (no del ion-item padre). |
| 13 | `cobros_botones_guardar_enviar_son_icon_buttons` | Guardar/Enviar son `ion-button.imagenGuardar` / `ion-button.imagenEnviar` sin textContent. Localizar por clase CSS. |
| 14 | `retencion_adjunto_propio_independiente_de_vg_general` | RETENCIÓN bloquea envío con "debe agregar al menos un adjunto" incluso con `requiredCollectionAttachments=false`. VG de adjunto para retención es independiente. → DM-COB-029 SKIP en insumar. |
| 15 | `cobros_envio_tres_alertas` | Flujo envío cobro regular: (1) "El Cobro será enviado" → (2) "Su Cobro será enviado" → (3) "Cobro nro. X enviado exitosamente". |
| 16 | `cobros_igtf_envio_dos_alertas` | Flujo IGTF: (1) "El IGTF será enviado" → (2) "Su Cobro será enviado". |
| 17 | `cobros_deposito_accordion_collapsed_por_defecto` | El acordeón del método Depósito en Pagos viene `accordion-collapsed`. Expandir con mouse.click en el header antes de llenar campos. |
| 18 | `cobros_clienteSelect_click_en_nombre_p_no_masInfo` (romher) | En romher `#clienteSelectModal` nuevo-cobro: click en `<p>` del nombre (y ≈ top del item) selecciona el cliente. Click en el centro del ion-item activa `masInfo` → abre BUSCAR en lugar de seleccionar. |
| 19 | `cobros_buscar_usa_app_cobros_list` (romher) | BUSCAR → `#clienteSelectModal` en modo cobros muestra clientes con chevron → click en cliente abre `app-cobros-list` con todos los cobros del sistema (no es componente separado ni ruta nueva). |
| 20 | `cobros_back_requiere_mouse_click_coords_romher` | Mismo patrón que pedidos/visitas/productos: `dispatchEvent(MouseEvent)` en `img.fechaAtras` NO dispara `#alertSaveOrExit`. Requiere `getBoundingClientRect() + pg.mouse.click()`. |
| 21 | `cobros_requiredComment_bloquea_tabs` (romher) | Cuando `requiredComment=true` (romher), sin Comentario los tabs Documentos/Pagos/Total/Adjuntos quedan disabled. Llenar con `fillIonInput` en `ion-input.inp-write` con `.notch-spacer` "Comentario:" desbloquea. |
| 22 | `cobros_monto_deposito_requiere_ionBlur_manual` | Campo Monto del acordeón Depósito: `fillIonInput` no recalcula la diferencia. Requiere además `inp.dispatchEvent(new FocusEvent('blur',{bubbles:true}))` + `ionBlur` CustomEvent para que Angular recalcule. |
| 23 | `cobros_deposito_acordeon_expandido_en_romher` | En romher, el acordeón del método Depósito se expande automáticamente tras seleccionar banco. No requiere click en header (diferente a insumar donde viene collapsed). |
| 24 | `cobros_delete_con_confirmacion_romher` | Trash en `app-cobros-list` → alert "¿Desea eliminar el Cobro?" con Cancelar/Eliminar (con confirmar previo). |
| 25 | `cobros_retencion_enviar_disabled_romher` | Retención en romher: `imagenEnviar` queda `button-disabled` (opacity 0.5) hasta agregar adjunto. Mock `mockCameraAdjunto` no logró inyectar foto en la build actual de El Yaque. DM-COB-029 SKIP. |

### DEVOLUCIONES
| # | Patrón | Descripción |
|---|--------|-------------|
| 18 | `devoluciones_guardar_enviar_son_icon_only` | Clases `imagenGuardar`/`imagenEnviar` sin texto — buscar por clase, no por texto. |
| 19 | `devoluciones_ion_input_sin_id_dom` | Los ion-input de devoluciones no tienen `id` como atributo. Seleccionar por clase `inp-write` o por posición. |
| 20 | `devoluciones_accordion_campos` | Campos en acordeón de producto: Lote, NroFactura, FechaVenc, CantidadDevuelta (inp-write), Unidad (select), Motivo (select). |
| 21 | `devoluciones_delete_con_confirmacion` | Borrar devolución en lista: alert "¿Desea eliminar la devolución?" CANCELAR/ELIMINAR. |

### INVENTARIOS
| # | Patrón | Descripción |
|---|--------|-------------|
| 22 | `inventarios_modal_class_en_ion_modal` | Clase del modal es `inventory-type-stocks-modal` en `ion-modal`, no un custom element. `querySelector('inventory-type-stocks-modal')` falla. |
| 23 | `inventarios_fecha_via_datetime_button` | Fecha de vencimiento usa `ion-datetime-button` → modal overlay → `Aceptar` en shadowRoot de `ion-datetime`. |
| 24 | `inventarios_delete_directo_sin_confirmacion` | Trash en BUSCAR → alert de éxito directo, sin confirm previo (diferente a Devoluciones/Pedidos). |
| 25 | `inventarios_enviado_tabs_3` | Formulario de inventario enviado muestra 3 tabs: General/Resumen/Adjuntos (sin tab Inventario). |

### DEPÓSITOS
| # | Patrón | Descripción |
|---|--------|-------------|
| 26 | `depositos_formulario_nro_plantilla` | En insumar el formulario muestra "Nro. Plantilla" (no "Nro. Depósito") y el monto se gestiona por selección de cobros en tab COBROS (no campo Monto independiente). |
| 27 | `depositos_ion_item_button_requiere_mouse_click` | Click en `ion-item[button]` vía `dispatchEvent(MouseEvent)` no navega al formulario. Requiere `pg.mouse.click()` con coords reales. |

### VISITAS
| # | Patrón | Descripción |
|---|--------|-------------|
| 28 | `visitas_back_requiere_mouse_click_coords` | `dispatchEvent(MouseEvent)` en `img.fechaAtras` no activa Angular router. Usar `getBoundingClientRect()` + `pg.mouse.click()`. |
| 29 | `visitas_ion_select_actividad_es_objeto` | El ion-select de Actividad devuelve `{idType, naType, requiredEvent, requiredSignature}`. Asignar via click en ítem del popover, no `.value=string`. |
| 30 | `visitas_motivo_condicional_requiredEvent` | Select Motivo aparece solo cuando `actividad.requiredEvent = "true"` (ej. COBRANZA, MERCHANDISING). |
| 31 | `visitas_delete_con_confirmacion` | Borrar visita Guardada: alert "¿Desea borrar la visita?" CANCELAR/ACEPTAR. |
| 32 | `visitas_agregar_btn_coords_cambian_segun_selects` | El botón AGREGAR en el modal de actividad cambia de posición según cuántos selects están visibles. Obtener coords frescos con `getBoundingClientRect` antes de cada click. |
| GMP-VIS-1 | `visitas_nueva_visita_requiere_shadowBtn` (globalmp) | `pg.mouse.click` en NUEVA VISITA ejecuta la acción pero URL queda en `/visitas`. Usar `ionBtn.shadowRoot.querySelector('button').click()` para navegar a `/visita`. |
| GMP-VIS-2 | `visitas_nueva_visita_loading_overlay` (globalmp) | Múltiples clicks en NUEVA VISITA pueden dejar `ion-loading` con `backdrop-no-tappable` bloqueando UI. Llamar `loading.dismiss()` y esperar antes de reintentar. |
| GMP-VIS-3 | `visitas_cliente_modal_search_click_boton` (globalmp) | Modal cliente en Visitas: input `.search-input` (placeholder "Clientes...") y botón `.clear-search` (x≈325,y≈96). Requiere click en botón search después de escribir. |
| GMP-VIS-4 | `visitas_sucursal_sin_coordenadas_alert` (globalmp) | Al seleccionar BIG MARKET 22 como cliente, aparece alert "Esta sucursal no tiene coordenadas asignadas". Dismiss con primer botón del alert (Cancel). |
| GMP-VIS-5 | `visitas_todas_actividades_requiredEvent_true` (globalmp) | Todas las actividades de globalmp tienen `requiredEvent:"true"` → Motivo siempre requerido. |
| GMP-VIS-6 | `visitas_agregar_btn_text_title_case` (globalmp) | Botón AGREGAR en modal de actividades es "Agregar" (título), no "AGREGAR". Buscar con `.toLowerCase() === 'agregar'`. |
| GMP-VIS-7 | `visitas_envio_estado_por_enviar_pre_sync` (globalmp) | Post-envío la visita queda como "Por Enviar" (no "Visitado") hasta que el servidor confirma. Comportamiento offline-first normal. |

### PRODUCTOS
| # | Patrón | Descripción |
|---|--------|-------------|
| 33 | `productos_busqueda_requiere_enter` | El input de búsqueda en productos no filtra on-keyup/ionChange programático. Requiere focus real + `pg.keyboard.type()` + `pg.keyboard.press('Enter')`. |
| 34 | `productos_back_requiere_mouse_click_coords` | Mismo patrón que visitas — `dispatchEvent` no activa router; usar `getBoundingClientRect` + `pg.mouse.click()`. |
| 35 | `productos_precio_iva_en_lista_insumar` | Lista de productos muestra "Precio + IVA: X US$ / Y BS" — campo no observado en hidroponias. |

### CDP
| # | Patrón | Descripción |
|---|--------|-------------|
| 36 | `cdp_adb_forward_usa_pid_socket` | El socket CDP es `webview_devtools_remote_<PID>` (no `_1`). Usar `adb shell "cat /proc/net/unix | grep webview"` para obtener el PID real antes de cada corrida. |

---

## Defectos nuevos encontrados

*(ninguno nuevo — los FAILs de Depósitos son defecto conocido v6.6.14)*

## N/As nuevos detectados en runtime

| Caso | Condición | Módulo |
|------|-----------|--------|
| DM-COB-007/008 | Sin facturas pendientes activas para cliente test (ADRIAN 2738) | COBROS |
| DM-COB-028 | ANTICIPO/PREPAGO sin clientes elegibles actualmente | COBROS |
| DM-COB-037 | COBRO 25% IVA sin clientes elegibles actualmente | COBROS |
| DM-COB-039 | `enabledManualRate=false` en insumar | COBROS |
| DM-DEV-011 | `validateReturn=false` — no hay campo Factura, tabs habilitadas sin selección | DEVOLUCIONES |
| DM-PRD-013 | Sin selector Lista de Precios en detalle de producto (insumar) | PRODUCTOS |
| DM-VIS-025 | Sin visitas sincronizadas desde backend el día de la corrida | VISITAS |
| DM-VIS-026 | Depende de DM-VIS-025 | VISITAS |

---

## Historial de graduaciones

| Patrón | Desde DELTA de | Graduó a |
|--------|---------------|----------|
| `mockCameraAdjunto` — mock de Capacitor Camera con Zone.current | RUN 20260529 | `denario-cdp-helpers.js` |
| `fetchCreds` lee archivo directo (sin servidor HTTP) | RUN 20260602 | `denario-cdp-helpers.js` |
| DM-VIS-022: visita ya Guardada se mantiene al salir sin guardar | RUN 20260529 | `RUNTIME.md` |
