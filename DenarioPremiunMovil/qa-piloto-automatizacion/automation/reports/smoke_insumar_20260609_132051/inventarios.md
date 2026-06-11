# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente / Playa | insumar |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Cliente de prueba | ADRIAN ARLET BASTARDO ALONZO (código 2738) |
| VGs activas | `expirationBatch=true` (Lote + Fecha venc) · `suggestedOrderByDispatchAndReturn=true` (Pedido Sugerido) |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 1 N/A** (DM-INV-026 PASS con defecto conocido observado) |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `/inventarios` con botones INVENTARIO y BUSCAR visibles |
| DM-INV-002 | ✅ PASS | 4 tabs (General/Inventario/Resumen/Adjuntos); solo General activo; Inventario/Resumen/Adjuntos disabled sin cliente; Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO" seleccionado → 4 tabs habilitadas |
| DM-INV-008 | ✅ PASS | Tab Inventario muestra familias con conteo (ALIMENTOS 158, BEBIDAS 113, CEREALES 24…) |
| DM-INV-010 | ✅ PASS | Click botón add de producto → modal `inventory-type-stocks-modal` con Cantidad, Lote, Fecha de vencimiento (ion-datetime-button) |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` Cantidad=12, Lote="LOTE-QA-001", Fecha venc="9 jun 2026" reflejados en modal |
| DM-INV-012 | ✅ PASS | Checkmark-outline → modal cierra sin validación; producto marcado "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla Sel/Código/Producto/Exhibición/Depósito/Acción con fila "09015 CEREAL MEGA AROS DE FRUTAS — 12 BULTO" |
| DM-INV-017 | ✅ PASS | Botón "Pedido Sugerido" (`botonAddAmarillo`) visible en Resumen (VG `suggestedOrderByDispatchAndReturn=true`) |
| DM-INV-020 | 🚫 N/A | Campo "días para siguiente inventario" no se renderiza — sin historial previo (`quUnitSuggested=0`). N/A estructural, no FAIL |
| DM-INV-021 | ✅ PASS | Guardar → confirm (Cancelar/Aceptar) → alert "Inventario guardado con éxito" (Denario Inventario) |
| DM-INV-022 | ✅ PASS | Enviar → 3 alerts: "¿Desea enviar el Inventario?" → "El Inventario será enviado" → **"Inventario nro. 16 enviado exitosamente"**; navega a home inventarios |
| DM-INV-023 | ✅ PASS | BUSCAR: lista con Nro.Ref/Cliente/Estatus/Fecha; el enviado aparece "Nro. Ref.: 16 · 2738 - ADRIAN… · Enviado · 09/06/2026" |
| DM-INV-025 | ✅ PASS | Searchbar filtra realtime: "ADRIAN" → 15 items reducidos a 3 (todos del cliente) |
| DM-INV-026 | ✅ PASS | Inventario Guardado carga formulario con cliente y captura "09015 CEREAL MEGA AROS — 7 BULTO". **Defecto conocido confirmado:** abre en tab General en vez de Inventario (observación, no FAIL) |
| DM-INV-028 | ✅ PASS | Trash en Guardado → borrado directo sin confirmación → "¡EL Inventario se borro con exito!" → desaparece de lista (1→0) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Inventario Nro. **16** | Cliente 2738 - ADRIAN ARLET BASTARDO ALONZO · CEREAL MEGA AROS DE FRUTAS FAMILIAR 8X240G, cant 12 BULTO, Lote LOTE-QA-001, venc 09/06/2026 | **Enviado** |
| Inventario Nro.Ref **0** | Cliente 2738 - ADRIAN ARLET BASTARDO ALONZO · CEREAL MEGA AROS DE FRUTAS FAMILIAR 8X240G, cant 7 BULTO, Lote LOTE-QA-GUARDADO | **Guardado → borrado** (DM-INV-028) |

## Notas

- VG `expirationBatch=true` confirmada: el modal de captura presenta Lote + Fecha de vencimiento además de Cantidad.
- VG `suggestedOrderByDispatchAndReturn=true` confirmada: botón "Pedido Sugerido" presente en tab Resumen.
- Patrón de borrado de INVENTARIOS confirmado: directo sin confirmación previa (distinto a Devoluciones/Pedidos que piden confirmación).
- Defecto conocido DM-INV-026 (v6.6.14) reproducido: formulario Guardado abre en tab General. No re-marcado FAIL.
- Inventario guardado local sin sincronizar mantiene Nro.Ref:0 hasta envío.

## Hallazgos (FAIL)

Ninguno. Sin defectos nuevos en esta corrida.
