# Smoke Test — Módulo INVENTARIOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | globalmp |
| Fecha ejecución | 2026-06-06 |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Click Inventarios en HOME → pantalla con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | Click INVENTARIO → 4 tabs (General/Inventario/Resumen/Adjuntos); campo Cliente vacío; tabs Inventario/Resumen/Adjuntos disabled sin cliente |
| DM-INV-004 | ✅ PASS | Seleccionado "BIG MARKET 22, C.A" (BM17) via modal de clientes; todos los tabs habilitados |
| DM-INV-008 | ✅ PASS | Tab Inventario → categorías de productos (CAPRI, COLGATE, NESTLE, etc.); click en CAPRI → productos con campos de captura visibles |
| DM-INV-010 | ✅ PASS | Click en producto "PASTA CON ESPINACA PLUMA 12x500gr (E)" → modal `inventory-type-stocks-modal` con campos Cantidad, Lote, Fecha de vencimiento |
| DM-INV-011 | ✅ PASS | h.fillNgModelKeyboard (click+type): Cantidad=5, Lote=LOT001, Fecha=2026-06-06 (via ion-datetime shadowRoot Aceptar) — valores reflejados |
| DM-INV-012 | ✅ PASS | Click checkmark-outline → modal cerrado; producto marcado "Inventariado: Exhibición"; sin errores de validación |
| DM-INV-016 | ✅ PASS | Tab Resumen → tabla con CP09 / PASTA CON ESPINACA / Exhibición: 5 CAJA |
| DM-INV-017 | ✅ PASS | Botón "Pedido Sugerido" visible en Tab Resumen → `suggestedOrderByDispatchAndReturn=true` confirmado |
| DM-INV-020 | 🚫 N/A | No hay campo "días para siguiente inventario" → `quUnitSuggested=0` (sin historial previo) |
| DM-INV-021 | ✅ PASS | Click Guardar (x≈267,y=32) → Alert "¿Desea guardar?" → Aceptar → "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Click Enviar (x≈326,y=32) → Alert "¿Desea enviar?" → Aceptar → "El Inventario será enviado"; navega a home inventarios |
| DM-INV-023 | ✅ PASS | BUSCAR → lista con Nro.Ref.109, Cliente BM17-BIG MARKET 22, Estatus: Enviado, Fecha: 06/06/2026 |
| DM-INV-025 | ✅ PASS | Searchbar "BM17" → filtra en tiempo real; solo inventarios BM17 visibles (excluye CM51, BS03) |
| DM-INV-026 | ✅ PASS | Click en inventario Guardado → formulario carga con datos. **Defecto conocido DM-INV-026 observado:** abre en tab General (checked=true) en vez de Inventario — no se marca FAIL |
| DM-INV-028 | ✅ PASS | Click trash en inventario Guardado → alert "¡EL Inventario se borro con exito!" directo sin confirmación previa; inventario desaparece de lista |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Inv Nro.Ref 109 | BM17 - BIG MARKET 22, C.A — 1 producto capturado (CP09, Cant:5, Lote:LOT001, FV:2026-06-06) | Enviado |
| Inv Nro.Ref 108 | BM17 - BIG MARKET 22, C.A — de sesión anterior interrumpida | Enviado |

## VGs confirmadas en esta corrida
| VG | Valor | Fuente |
|----|-------|--------|
| `expirationBatch` | `true` | Modal muestra campos Lote y Fecha de vencimiento como requeridos |
| `suggestedOrderByDispatchAndReturn` | `true` | Botón "Pedido Sugerido" visible en Tab Resumen |

## Patrones observados / confirmados
- **inventarios_guardar_btn**: imagen en header fijo x≈267, y=32 (confirma patrón devoluciones)
- **inventarios_enviar_btn**: imagen en header fijo x≈326, y=32
- **inventarios_categoria_click**: Tab Inventario muestra grupos de categorías → click en categoría navega a lista de productos
- **inventarios_modal_checkmark**: botón Aceptar en modal es `checkmark-outline` (ion-icon) en header del modal (x≈321, y≈86)
- **inventarios_datetime_coords**: ion-datetime-button en modal en coords aprox x=273, y=414
- **inventarios_delete_directo_sin_confirmacion**: confirmado — trash en BUSCAR lista → éxito directo sin confirm previo; alert de éxito "¡EL Inventario se borro con exito!"
- **inventarios_buscar_btn_navegacion**: requiere pg.mouse.click sobre coords reales (no dispatchEvent); primera vez puede no responder — segundo intento con wait funciona
- **inventarios_guardado_click**: click en ion-item de la lista BUSCAR — dispatchEvent no funciona; pg.mouse.click sobre coords SÍ funciona; abre formulario directamente

## Hallazgos
Sin FAIL. Defecto conocido DM-INV-026 observado (formulario Guardado abre en tab General).
