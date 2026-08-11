# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar |
| Cliente prueba | ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| VGs | `expirationBatch=true` · `suggestedOrderByDispatchAndReturn=true` |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A** |
| Estado inicial / final | HOME / HOME ✅ |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Home Inventarios con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs (GENERAL `default`/INVENTARIO `inventario`/RESUMEN `actividades`/ADJUNTOS `adjuntos`); solo GENERAL habilitada, otras 3 disabled; Cliente vacío |
| DM-INV-004 | ✅ PASS | Cliente "ADRIAN ARLET BASTARDO ALONZO (2738)" seleccionado → las 4 tabs habilitan (disabled=false) |
| DM-INV-008 | ✅ PASS | Tab Inventario lista familias (ALIMENTOS, BEBIDAS, CARAMELOS, CEREALES…) + productos reales (TOMATES PELADOS MARY, HARINA DE TRIGO MARY…) |
| DM-INV-010 | ✅ PASS | Click producto TOMATES PELADOS MARY 24X400G → modal `inventory-type-stocks-modal` con Cantidad (number), Lote (text) y Fecha de vencimiento (datetime-button) |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: cantidad=15, lote=LOTE-QA-619, fecha=31 dic 2026 reflejados en el modal |
| DM-INV-012 | ✅ PASS | Aceptar (checkmark-outline) → modal cierra sin error; producto "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla Sel/Código/Producto/Exhibición/Depósito/Acción con 11293 TOMATES = 15 UNIDADES |
| DM-INV-017 | ✅ PASS | Botón PEDIDO SUGERIDO visible (`botonAddAmarillo`); abre `inventario-sugerido-modal` con el producto y cantidades (cerrado con dismiss sin Aceptar para NO generar pedido) |
| DM-INV-020 | ✅ PASS | Modal sugerido muestra "Días desde último Inventario: 1" y "Días para siguiente Inventario: 1" (hay historial previo) |
| DM-INV-021 | ✅ PASS | Guardar → confirm "¿Desea guardar el Inventario?" ACEPTAR → "Inventario guardado con éxito" OK |
| DM-INV-022 | ✅ PASS | Enviar → 2 alertas (confirm "¿Desea enviar el Inventario?" → "El Inventario será enviado") → home inventarios |
| DM-INV-023 | ✅ PASS | BUSCAR: lista con Nro.Ref/Cliente/Estatus/Fecha; enviado aparece (Ref 18 Enviado 19/06 + Ref 0 "Por enviar" pendiente sync) |
| DM-INV-025 | ✅ PASS | Searchbar "ABASTOS" filtra realtime: 19 → 6 ítems, todos ABASTOS BRISAS DEL VALLE 95 |
| DM-INV-026 | ✅ PASS | 2º inventario Guardado reabierto: cliente y producto (8 UNIDADES) persisten. Abre en tab GENERAL (`default`) — defecto conocido v6.6.14, observación no FAIL |
| DM-INV-028 | ✅ PASS | Trash en Guardado → borrado **directo sin confirmación** → "¡EL Inventario se borro con exito!" OK; Guardados 1 → 0 |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| 18 | Inventario cliente 2738 — TOMATES PELADOS MARY 24X400G ×15 (lote LOTE-QA-619, venc 31 dic 2026) | **Enviado** (19/06/2026) |
| 0 (local) | Mismo inventario pendiente de sincronización | Por enviar |
| — | 2º inventario cliente 2738 — TOMATES PELADOS MARY ×8 (lote LOTE-QA-DEL, venc 30 nov 2026) | Guardado → **Borrado** (DM-INV-028) |

> Nro inventario enviado en esta corrida: **Ref 18** (servidor asignó al enviar; Ref 0 → 18). El YAML registraba `nro_ref_enviado: 9` de la corrida previa.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Filtros internos Tab Inventario | universal | Junto al segmento de tabs aparece un segmento de filtro de productos con values `exh`/`dep`/`all`/`inventoried` (UBICACIÓN: Exhibición/Depósito; FILTRO: Todos/Inventariados). Reconfirma segmento interno Exhibición/Depósito/Todos de [ins-2610] |
| Lista BUSCAR — click reabrir Guardado | universal | `pg.mouse.click` sobre el `ion-item` individual a `x = left + min(120, w/2)` (no el centro): abre el form. El cliente carga async (~1.5s) tras abrir — releer antes de marcar vacío. Reconfirma DM-INV-026 abre en tab `default` |
| Modal cliente — reintento necesario | cliente insumar | El 1er `#clienteSelectModal.present()` + type + search a veces cierra sin selección; un 2º intento (present → click x3 input → type → search-circle-sharp → click `<p>`) sí selecciona. No es defecto de app (timing CDP) |
| Round-trip cantidad por Tab Resumen | universal | Forma fiable de verificar persistencia del inventario Guardado: leer la línea "N UNIDADES" del producto en Resumen (el modal del producto en filtro "Inventariados" no siempre re-localiza como elemento hoja) |
| Borrado Guardado directo | cliente insumar | Confirma anti-patrón: trash `ion-button[color="danger"]` → sin confirmación previa, alert directo "¡EL Inventario se borro con exito!" (≠ Devoluciones/Depósitos que confirman). Reconfirma [ins-2606][ins-2610] |

> ✅ consolidado 2026-06-19

## Hallazgos (FAIL)

Ninguno. Corrida limpia (16/16 PASS).

**Observaciones (no FAIL):**
- DM-INV-026: el form Guardado reabre en tab GENERAL en lugar de Inventario — defecto conocido v6.6.14 (`module-selectors.md`, RUNTIME §5). No re-marcado FAIL.
- El inventario enviado figura simultáneamente como Ref 18 "Enviado" y Ref 0 "Por enviar" (copia local pendiente de sync) — patrón esperado Nro.Ref:0 = local sin sincronizar.
- Pedido Sugerido (insumar): el `inventario-sugerido-modal` se cerró con `dismiss()` sin pulsar ACEPTAR para evitar generar un pedido y navegar a `/pedido` (nota crítica [ins-2610]).
