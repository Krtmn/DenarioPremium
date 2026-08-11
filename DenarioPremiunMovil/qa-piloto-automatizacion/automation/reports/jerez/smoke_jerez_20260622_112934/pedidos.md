# Smoke Test — Módulo PEDIDOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | PEDIDOS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Cliente test | JL Motors SE,C.A (J-506554950) |
| Resultado | 14 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PED-001 | ✅ PASS | Módulo abierto (`app-pedidos`, /pedidos); home con botones PEDIDO · BUSCAR · COPIAR |
| DM-PED-002 | ✅ PASS | Form `app-pedido` 4 tabs; General `checked`, Pedido/Total/Adjunto `segment-button-disabled` sin cliente |
| DM-PED-006 | ✅ PASS | Cliente JL Motors seleccionado vía `#clienteSelectModal.present()` → click texto nombre; 4 tabs habilitan. Sin alerta de deuda vencida (saldo 0,00) |
| DM-PED-015 | ✅ PASS | Tab Pedido → catálogo `productos-tab` con 8 categorías visibles (acordeón de productos por categoría) |
| DM-PED-017 | ✅ PASS | `cantidad=2` en "Agro silotubo flex-silon..." (PLAN-001) → badge "2" en categoría; inventario 450→448; línea "PIEZA: 2" |
| DM-PED-024 | ✅ PASS | Tab Total: Total Items 1, Total Base USD 468,00, Total Pedido USD 468,00 (2×234,00). Solo USD (`multiCurrencyOrder=false`) — esperado |
| DM-PED-026 | ✅ PASS | Trash en Tab Total (acordeón ítem, 2º `ion-accordion-group`): Items 1→0, Total 468,00→0,00 recalculado |
| DM-PED-029 | ✅ PASS | Sin ítems: Guardar/Enviar `opacity:0.5`; click en Guardar no produjo alert ni navegó (no guarda sin datos) |
| DM-PED-030 | ✅ PASS | Re-agregado ítem + comentario `Test-PED-SMOKE-114817` → Guardar → alert "Denario / Pedido Guardado / OK" |
| DM-PED-031 | ✅ PASS | Enviar → 3 alertas ("¿Desea Enviar el pedido?" → "Su Pedido será enviado" → "Pedido nro. 9 enviado exitosamente") → /pedidos home |
| DM-PED-032 | ✅ PASS | Form dirty (cliente+ítem) + atrás (`<a>` padre, secuencia pointer/mouse) → modal "¡Alerta!" 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-PED-034 | ✅ PASS | BUSCAR searchbar "JL Motors": lista filtra realtime 6→2; limpiar → 6 |
| DM-PED-035 | ✅ PASS | Click pedido Guardado (Nro Ref 0) → `app-pedido` editable; tabs disabled ~2.5s (render async) y luego habilitan las 4 |
| DM-PED-037 | ✅ PASS | Trash en pedido Guardado → alert "¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar) → Aceptar → fila desaparece (Guardado 1→0) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Pedido nro. **9** | JL Motors SE,C.A · 1 ítem (PLAN-001 ×2 · USD 468,00) · comentario `Test-PED-SMOKE-114817` | **Enviado** (DM-PED-031) |
| Pedido nro. **0** | JL Motors SE,C.A · 1 ítem (PLAN-001 ×3) · creado vía "Guardar y salir" | **Guardado → Eliminado** (DM-PED-037) — no persiste |

## Datos descubiertos (cartera jerez)

| Dato | Valor |
|------|-------|
| cliente_test | JL Motors SE,C.A (J-506554950) — saldo 0,00 |
| estructura_producto | Build `productos-tab`. Categorías: Accesorios MJ (179), Carbones (136), HJ-Forza (71), Otras marcas (102), **Plasticos (1)**, Repuestos Jerez (207), Repuestos de Motos (4041), XCORT (31). Sub-tabs internos: Favoritos / Destacados / Carrito |
| producto usable | **Agro silotubo flex-silon extra PB 8P*50C** · Código PLAN-001 · Precio 234,00 USD · Unidad PIEZA · Inventario 450 (categoría Plasticos) |
| alerta_deuda_vencida | **false** — no aparece (los 3 clientes de cartera tienen saldo 0,00) |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Catálogo Tab Pedido = `productos-tab` (sin `ion-accordion`) | universal (build) | jerez usa la MISMA build que central_foods `[cf-2612]`: categorías y productos por `productos-tab ion-label`; cantidad por `<input[placeholder="Ingrese Cantidad:"]>` filtrando `top>0 && top<700 && width>0`. Confirma `[cf-2612]` en 2º cliente → graduar |
| Tab Total solo US$ con `multiCurrencyOrder=false` | cliente (VG) | Total Pedido USD únicamente pese a `multiCurrency=true`; comportamiento del módulo, no FAIL. Reconfirma `[ins-2610][cf-2612]` |
| Dirty-guard atrás vía CDP | universal (build) | Form dirty + `<a>` padre de `img.fechaAtras` con secuencia `pointerdown/pointerup` + `MouseEvent('mousedown/mouseup/click')` + `mouse.click(~31,46)` → modal "¡Alerta!" (Guardar y salir / Salir sin guardar / Cancelar). Reconfirma `[ins-2610][cf-2612]` |
| Guard también al reabrir Guardado sin editar (jerez) | cliente | A diferencia de la nota del smoke ("reabrir Guardado sin editar → salida directa sin modal"), en jerez v6.6.17 el modal "¡Alerta!" SÍ aparece igual. NO es FAIL (protección válida); divergencia de build |
| Borrado desde lista | universal | Trash en fila Guardado → alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" (Cancelar/Aceptar) → fila desaparece sin alert de éxito. Reconfirma `[ins-2606][cf-2612]` |
| Guardar/Enviar deshabilitado por `opacity:0.5` | universal | Sin ítems los botones del header fijo quedan `opacity:0.5` y el click no dispara acción (no por clase `disabled`) |

> ✅ consolidado 2026-06-22

## Hallazgos (solo si hay FAIL)

Ninguno — los 14 casos PASS.
