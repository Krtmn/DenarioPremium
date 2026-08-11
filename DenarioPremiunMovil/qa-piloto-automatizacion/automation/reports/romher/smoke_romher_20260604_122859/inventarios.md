# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` — El Yaque (romher) |
| Playa | El Yaque |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 1 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Click "Inventarios" → `app-inventarios` con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | Click INVENTARIO → formulario `app-inventario`; 4 tabs General/Inventario/Resumen/Adjuntos; Inventario/Resumen/Adjuntos disabled sin cliente |
| DM-INV-004 | ✅ PASS | Click `ion-input#clienteSelect` → modal cliente → click `<p>` de "SUPERMERCADO SIDON, C.A." → clientValue="SUPERMERCADO SIDON, C.A."; todos los tabs habilitados |
| DM-INV-008 | ✅ PASS | Tab Inventario → lista de proveedores con 11 grupos (COLGATE: 174, SC JOHNSON: 148, etc.); click COLGATE expande 50+ productos |
| DM-INV-010 | ✅ PASS | Click producto SUAVITEL FRESCA PRIMAVERA 1L → modal `inventory-type-stocks-modal`; campos: cantidad ("Ingrese cantidad"), lote ("Ingrese lote"), `ion-datetime-button` "Fecha de vencimiento" |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` (triple-click + keyboard.type): cantidad="25", lote="LOTE-QA-2026"; valores reflejados en DOM; confirmDatetime via shadowRoot Aceptar |
| DM-INV-012 | ✅ PASS | Click save-btn (coords reales, primer apertura de modal): modal cerrado; SUAVITEL muestra "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen → tabla: Código 100985 / SUAVITEL FRESCA PRIMAVERA 1L / 25 Unidad / Exhibición; sección "Pedido Sugerido" visible |
| DM-INV-017 | ✅ PASS | Sección "Pedido Sugerido" presente en Resumen → `suggestedOrderByDispatchAndReturn = true` confirmado |
| DM-INV-020 | 🚫 N/A | Campo "días para siguiente inventario" no visible — primera corrida, sin historial (`quUnitSuggested = 0`) |
| DM-INV-021 | ✅ PASS | Click imagenGuardar → alert "¿Desea guardar el Inventario?" → Aceptar → alert "Inventario guardado con éxito" OK |
| DM-INV-022 | ✅ PASS | Click imagenEnviar → 3 alertas: "¿Desea enviar el Inventario?" → Aceptar → "El Inventario será enviado" OK → "Inventario nro. 4 enviado exitosamente" OK; navega a home inventarios |
| DM-INV-023 | ✅ PASS | Click BUSCAR → lista con Nro.Ref.:4 / Cliente:0001000111 / Estatus:Enviado / Fecha:04/06/2026; también Nro.Ref.:3 de corrida previa |
| DM-INV-025 | ✅ PASS | Searchbar filtra en tiempo real: "ZZZNOMATCH" → 0 items; clear → 2 items |
| DM-INV-026 | ✅ PASS | Click inventario Guardado (Nro.Ref.:0) → formulario carga con General tab activo (defecto conocido DM-INV-026 confirmado); clientValue="SUPERMERCADO SIDON, C.A."; accesible |
| DM-INV-028 | ✅ PASS | Click botón basura (ion-color-danger) en Guardado → directo alert "¡EL Inventario se borro con exito!" sin confirmación; inventario desaparece de lista |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Inventario Nro. 4 | Cliente 0001000111 SUPERMERCADO SIDON C.A. · SUAVITEL FRESCA PRIMAVERA 1L · Cant:25 · Lote:LOTE-QA-2026 · Fecha:04/06/2026 | Enviado ✅ |
| Inventario Nro. 0 (TMP) | Cliente 0001000111 SUPERMERCADO SIDON C.A. · sin items | Guardado → Eliminado (DM-INV-028) |

## VGs descubiertas

| Variable | Valor | Fuente |
|----------|-------|--------|
| `expirationBatch` | `true` (lote + fecha presentes en modal) — campos opcionales, no required | Modal `inventory-type-stocks-modal`: 2 `ion-input` (cantidad + lote) + `ion-datetime-button` (fecha vencimiento); `ng-invalid` no activo sin lote/fecha |
| `suggestedOrderByDispatchAndReturn` | `true` | Sección "Pedido Sugerido" visible en Tab Resumen |

## Patrones nuevos descubiertos — romher INVENTARIOS

| ID | Descripción |
|----|-------------|
| P-ROM-INV-001 | `inventarios_cliente_modal_mismo_patron_pedidos` — click `<p>` nombre cliente en modal; mismo selector y comportamiento que pedidos/cobros |
| P-ROM-INV-002 | `inventarios_proveedor_lista_click_expande_productos` — click en ion-item proveedor (ej. COLGATE 174) navega a lista de 50+ productos |
| P-ROM-INV-003 | `inventarios_envio_tres_alertas` — mismo patrón: "¿Desea enviar?" → "será enviado" → "nro. X enviado exitosamente" (confirmado para Inventarios) |
| P-ROM-INV-004 | `inventarios_guardar_con_confirmacion` — Guardar requiere alerta "¿Desea guardar el Inventario?" Cancelar/Aceptar (no directo) |
| P-ROM-INV-005 | `inventarios_delete_directo_exito_sin_confirmacion` — trash en Guardado → alerta éxito directo "¡EL Inventario se borro con exito!" sin confirm intermedio |
| P-ROM-INV-006 | `inventarios_modal_save_btn_requiere_mouse_move_previo` — `save-btn` en `inventory-type-stocks-modal` solo responde a `pg.mouse.click()` cuando modal se abre por primera vez; tras `modal.dismiss()` se requiere `pg.mouse.move()` previo para restablecer estado del puntero |
| P-ROM-INV-007 | `inventarios_modal_dismiss_via_ion_modal_method` — `modal.dismiss(null, 'cancel')` funciona para cerrar modal cuando clicks físicos no responden (tras scrolls o dismiss previo) |
| P-ROM-INV-008 | `inventarios_buscar_muestra_nro_ref_cero_para_guardado` — inventario guardado sin número asignado muestra "Nro. Ref.: 0" en BUSCAR hasta ser enviado |

## Hallazgos

**Defecto conocido DM-INV-026 confirmado para romher:** formulario Guardado abre en tab General (no en tab Inventario). Comportamiento consistente con otras playas — no es FAIL.

**Observación modal save-btn:** Los botones físicos de `inventory-type-stocks-modal` (save-btn y close-btn) dejan de responder a `pg.mouse.click()` después de que el mouse es programáticamente controlado para `modal.dismiss()`. Workaround: `pg.mouse.move(x_neutral, y_neutral)` antes del siguiente click, o `modal.dismiss()` directamente. Esto no afecta al flujo principal si se abre el modal fresco (primer click).

**expirationBatch observación:** los campos lote y fecha están presentes pero NO son obligatorios (`ng-invalid` no activo). La VG `expirationBatch=true` indica que los campos EXISTEN, pero el campo no bloquea el guardado si están vacíos.
