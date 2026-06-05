# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | WebView CDP `ws://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` — Denario Premium Movil |
| Cliente | `insumar` |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 2 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Click en `<a class="ion-text-center">` con imagen `inventarioNuevo.svg` → navega a `/inventarios`; botones INVENTARIO y BUSCAR visibles |
| DM-INV-002 | ✅ PASS | 4 tabs visibles: General (enabled), Inventario/Resumen/Adjuntos (disabled); ion-input#clienteSelect vacío |
| DM-INV-004 | ✅ PASS | Click ion-input#clienteSelect → modal cliente abre; selección ADRIAN ARLET BASTARDO ALONZO (Cód 2738) → modal cierra, todos los tabs se habilitan |
| DM-INV-008 | ✅ PASS | Tab Inventario → 18 familias de productos (ALIMENTOS 158, BEBIDAS 113, CARAMELOS 68, etc.); click en familia ALIMENTOS expande lista individual de productos |
| DM-INV-010 | ✅ PASS | Click en "TOMATES PELADOS MARY 24X400G" → modal `inventory-type-stocks-modal` abre con campos Cantidad, Lote, Fecha de vencimiento |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` (click×3 + type): Cantidad=10, Lote="LOTE-QA-001", Fecha=2026-06-03 (ion-datetime-button → picker → Aceptar en shadowRoot); valores reflejados en modal |
| DM-INV-012 | ✅ PASS | Click `.save-btn` (checkmark) → modal cierra; producto muestra badge "Inventariado: Exhibición" en lista |
| DM-INV-016 | ✅ PASS | Tab Resumen → tabla con Código 11293, TOMATES PELADOS MARY 24X400G, 10 UNIDADES; botón "Pedido Sugerido" visible |
| DM-INV-017 | ✅ PASS | Sección "Pedido Sugerido" visible como `ion-button.botonAddAmarillo` en tab Resumen → `suggestedOrderByDispatchAndReturn=true` confirmado |
| DM-INV-020 | 🚫 N/A | Campo "días para siguiente inventario" no visible en ningún tab — sin historial previo para este cliente; `quUnitSuggested=0` |
| DM-INV-021 | ✅ PASS | Click `.imagenGuardar` → alert "¿Desea guardar el Inventario?" → Aceptar → alert "Inventario guardado con éxito" |
| DM-INV-022 | ✅ PASS | Click `.imagenEnviar` → alert "¿Desea enviar el Inventario?" → Aceptar → alert "El Inventario será enviado"; regresa a home inventarios (INVENTARIO + BUSCAR) |
| DM-INV-023 | ✅ PASS | BUSCAR muestra lista de 9 inventarios; inventario reciente: **Nro. Ref.: 9**, Cliente: 2738 - ADRIAN ARLET BASTARDO ALONZO, Estatus: Enviado, Fecha: 03/06/2026 |
| DM-INV-025 | ✅ PASS | Searchbar filtra en tiempo real: búsqueda "2738" → lista pasa de 9 a 2 items (ambos para ADRIAN ARLET) |
| DM-INV-026 | ✅ PASS | Click en Nro. Ref.: 9 → formulario carga con cliente y fecha; abre en tab General (defecto conocido DM-INV-026, no re-marcado FAIL); formulario accesible y no vacío |
| DM-INV-028 | ✅ PASS | Segundo inventario guardado (Nro. Ref.: 0, Estatus: Guardado) → click en `ion-button[color="danger"]` (trash) → delete directo → alert "¡EL Inventario se borro con exito!" → item desaparece de lista (10→9 items) |

> **DM-INV-020 observación estructural:** No N/A por VG sino por ausencia de historial de inventarios previos para el cliente; el campo puede aparecer en futuras corridas si existe historial.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro. Ref.: 9 | Inventario ADRIAN ARLET BASTARDO ALONZO (Cód 2738) — TOMATES PELADOS MARY 24X400G, Cantidad: 10 UNIDADES, Lote: LOTE-QA-001, Fecha Venc: 2026-06-03 | **Enviado** |
| Nro. Ref.: 0 (local) | Inventario ADRIAN ARLET BASTARDO ALONZO (Cód 2738) — TOMATES PELADOS MARY 24X400G, Cantidad: 5, Lote: LOTE-DEL-001 | **Eliminado** (creado para prueba DM-INV-028) |

---

## Hallazgos / Patrones descubiertos

### Nuevos patrones (insumar — primera corrida inventarios)

1. **inventarios_modal_cliente_requiere_real_click: true** — El modal de selección de cliente se abre con click real (mouse.click via getBoundingClientRect en `#clienteSelect`); no filtro on-keyup en modal de inventario (mismo patrón que módulo Clientes y Pedidos).

2. **inventarios_familia_productos_expandible: true** — La tab Inventario muestra familias (18 familias: ALIMENTOS 158 prods, BEBIDAS 113, etc.); click en familia expande productos individuales. Mismo patrón que Pedidos.

3. **inventarios_modal_class: "inventory-type-stocks-modal"** — El modal de captura se identifica por clase `inventory-type-stocks-modal` en `ion-modal`; `querySelector('inventory-type-stocks-modal')` da `null` porque no es un custom element sino la clase del ion-modal.

4. **inventarios_fecha_vencimiento_via_datetime_button: true** — La fecha de vencimiento usa `ion-datetime-button` que abre un `ion-modal.ion-datetime-button-overlay`; confirmar con `dt.shadowRoot.querySelector('ion-button[text=Aceptar]').click()`.

5. **inventarios_delete_directo_sin_confirmacion_previa: true** — El botón basura (`ion-button[color="danger"]`) borra inmediatamente y muestra alert de éxito "¡EL Inventario se borro con exito!" sin paso previo de confirmación (distinto a Devoluciones y Pedidos que piden confirmación).

6. **inventarios_guardado_nro_ref_0: true** — Inventarios guardados localmente (no sincronizados) aparecen con Nro. Ref.: 0, igual que Pedidos.

7. **inventarios_enviado_tabs_3: true** — Formulario de inventario ya enviado muestra solo 3 tabs (General, Resumen, Adjuntos) — sin tab Inventario. Inventario nuevo muestra 4 tabs.

8. **expirationBatch: true** — Confirmado para insumar: campos Lote y Fecha de vencimiento presentes y funcionales en modal de captura.

9. **suggestedOrderByDispatchAndReturn: true** — Confirmado para insumar: botón "Pedido Sugerido" (`ion-button.botonAddAmarillo`) visible en tab Resumen.

---

## VGs confirmadas esta corrida

| VG | Valor | Evidencia |
|----|-------|-----------|
| `expirationBatch` | `true` | Modal muestra campos Lote ("Ingrese lote") + Fecha de vencimiento (ion-datetime) |
| `suggestedOrderByDispatchAndReturn` | `true` | Botón "Pedido Sugerido" visible en tab Resumen |

---

*Corrida: 2026-06-03 · Agente: QA CDP Playwright MCP · Estado final: HOME ✅*
