# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260619_173652_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | `14678405BR003855` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 |
| Playa | insumar (INSUMAR DISTRIBUIDOR) |
| Resultado | 8 PASS · 0 FAIL · 0 SKIP · 1 N/A |

> Casos del prompt: DM-PRD-001, 002, 004, 006, 007, 009, 012, 013, 020, 021 (10).
> DM-PRD-020 y DM-PRD-021 son ambos sobre navegación back y se reportan por separado.
> Total ejecutados: 9 con veredicto + DM-PRD-013 N/A estructural.

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Módulo abre en `/productos`; `product-structures-list` visible con selector empresa ("INSUMAR DISTRIBUIDOR") + selector tipo + 18 estructuras (ALIMENTOS 158, BEBIDAS 115, CARAMELOS 71…) |
| DM-PRD-002 | ✅ PASS | Cambio tipo Linea→Sub-Linea recalcula la lista: 18 estructuras (ALIMENTOS/BEBIDAS…) → 42 (BARQUILLA 2/BOTELLA 14…). `value` del option es objeto (idTypeProductStructure 1↔2) |
| DM-PRD-004 | ✅ PASS | Click ALIMENTOS → `product-list` con 50 productos; cada ítem con nombre, Código, Precio US$ + BS, Inventario (TOMATES PELADOS MARY 24X400G, Cód 11293, 2,15 US$ / 1.262,93 BS) |
| DM-PRD-006 | ✅ PASS | Búsqueda "TOMATES" (focus+type+Enter) filtra a 1 resultado (TOMATES PELADOS MARY 24X400G) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → "No hay productos disponibles", 0 productos reales |
| DM-PRD-009 | ✅ PASS | Lista ALIMENTOS inicia en 50 ítems; `ionInfinite` + scrollToBottom carga progresivamente hasta 158; `ion-infinite-scroll` se auto-deshabilita (disabled=true), sin spinner colgado |
| DM-PRD-012 | ✅ PASS | Detalle con Nombre, Código (11293), Estructura Producto, Precio Unidad 2,15 US$ / 1.262,93 BS, Almacén, Inventario |
| DM-PRD-013 | 🚫 N/A | Detalle tiene único `ion-select` = "ALMACEN 01" (sin Lista de Precios); precio USD+BS es texto fijo no recalculable. Confirma N/A estructural insumar `[ins-2610]` |
| DM-PRD-020 | ✅ PASS | Back desde **detalle** → `product-list` (24 productos del tipo activo), no a estructuras |
| DM-PRD-021 | ✅ PASS | Back desde **estructuras** (18 ítems) → HOME (`app-home`, `/home`) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno (módulo de solo lectura) | — |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Back del header de PRODUCTOS cierra el módulo directo a HOME desde `product-list` (no pasa por `product-structures-list`) | universal (confirmado insumar) | El back de `flecha-blanca.png` (class fechaAtras, x≈10,y≈10, dentro de `<a>`) navega `product-list`→HOME y `product-structures-list`→HOME. NO hay paso intermedio lista→estructuras. No es FAIL: estructuras y lista conviven bajo `app-productos`; ningún caso smoke exige back lista→estructuras. El back lista→estructuras correcto solo aplica desde el **detalle** (DM-PRD-020) `[ins-2619]` |
| `productosNuevoBlanco.svg` también tiene class `fechaAtras` pero NO es back (icono de módulo, sin `<a>`, x≈302) | universal | Filtrar por `src` `flecha-blanca.png` Y `closest('a')` para no clickear el icono de módulo. Confirma nota previa `[cf-2612]` |
| Búsqueda residual persiste tras volver al módulo | cliente/universal | Al hacer back con un filtro activo y re-entrar, la lista puede quedar filtrada/vacía. Para repoblar: re-tipear término válido + Enter, o re-entrar la estructura desde HOME (recarga lista completa). Vaciar el campo NO repuebla (concuerda `[cf-2612]`) `[ins-2619]` |

> ✅ consolidado 2026-06-19

## Notas

- Selector tipo: `value` del `ion-select-option` es objeto (`{idTypeProductStructure,…}`); cambiar tipo = asignar ese objeto a `.value` + `ionChange`. `selectIonPopover` por texto NO aplica. Confirma `[ins-2610]`.
- Lista muestra "Precio Unidad - UND" en US$ y BS más Inventario. Detalle rotula "Precio Unidad - UNIDADES" y "Estructura Producto: NO APLICA".
- Estado inicial HOME → estado final HOME ✅.
