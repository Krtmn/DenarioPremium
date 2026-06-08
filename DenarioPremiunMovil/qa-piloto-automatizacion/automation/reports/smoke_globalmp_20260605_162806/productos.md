# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | PRODUCTOS |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` — globalmp |
| Cliente | globalmp · Primera corrida exploratoria |
| Resultado | **9 PASS · 1 FAIL · 0 SKIP · 1 N/A** |

## Datos de prueba (confirmados en corrida)

| Campo | Valor |
|-------|-------|
| tipo_estructura_default | `LINEA` (idTypeProductStructure=2, coTypeProductStructure="P1") |
| texto_busqueda | `CAPRI` — 27 resultados en estructura LINEA CAPRI |
| estructura_test | `CAPRI 60` (primera de la lista, confirma 60 productos) |
| producto_test | `PASTA CAPRI 3 VEGETALES RUEDA 12x500gr` — Código PCE07 |
| listas_precio | Precio 3 (default) · USD/VENTA BCV (idx 1) · USD/VENTA BCV (idx 2) |
| tipo_unico | Solo un tipo de estructura disponible — DM-PRD-002 N/A |
| back_pattern | `productos-header > a` — `pg.mouse.click(coords)` (sin clase .fechaAtras en flecha) |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | URL /productos · `product-structures-list` visible · 34 estructuras (ACEITE, ALBECA, BAHIA, CAFE, CAPRI…) · ion-select tipo=LINEA |
| DM-PRD-002 | 🚫 N/A | Solo 1 opción disponible en selector tipo (`LINEA`) — no hay segundo tipo al que cambiar |
| DM-PRD-004 | ✅ PASS | Click en CAPRI 60 → `product-list` visible · 50 ion-items · código + precios BS y USD en cada item |
| DM-PRD-006 | ✅ PASS | Búsqueda "CAPRI": 50 → 27 items filtrados · patrón: `focus + keyboard.type('CAPRI') + Enter` |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → mensaje "No hay productos disponibles" · 1 ion-item (wrapper vacío) |
| DM-PRD-009 | ✅ PASS | `scrollInfinite` con CAPRI (27 items): `ion-infinite-scroll` `disabled=true` — todos cargados, sin spinner infinito |
| DM-PRD-012 | ✅ PASS | Detalle PCE07: Nombre "PASTA CAPRI 3 VEGETALES RUEDA 12x500gr" · Código PCE07 · Precio 13.338,70 BS · Unidad CAJA · Estructura CAPRI |
| DM-PRD-013 | ✅ PASS | Lista precio cambia Precio 3 → USD/VENTA BCV: 13.338,70 BS → 13.827,64 BS (precio diferente entre listas, PASS pleno) |
| DM-PRD-019 | ❌ FAIL | Back desde lista de productos (CAPRI) → navega a HOME en lugar de a estructuras |
| DM-PRD-020 | ✅ PASS | Back desde detalle PCE07 → lista de productos CAPRI (27 items, search input visible) |
| DM-PRD-021 | ✅ PASS | Back desde estructuras → HOME (url /home, app-home visible) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — sin registros creados | — |

## Hallazgos (FAIL)

### DM-PRD-019 — Back desde lista de productos salta HOME en lugar de estructuras

**Severidad:** Media  
**Comportamiento observado:** Estando en `/productos` con `product-list` activo (lista de productos de CAPRI), al pulsar el back button (`productos-header > a`, coords ≈34,51) la app navega directamente a HOME (`/home`) en lugar de regresar a la vista de estructuras (`product-structures-list`).  
**Comportamiento esperado:** El back desde la lista de productos de una estructura debe retornar a la lista de estructuras del tipo activo.  
**Contraste con DM-PRD-021:** El back desde estructuras → HOME funciona correctamente.  
**Posible causa:** El back button de `productos-header` usa el mismo handler en todas las sub-vistas del módulo (lista de estructuras Y lista de productos), navegando siempre a HOME sin distinguir el nivel de profundidad actual.

---

## Notas de patrón — para RUNTIME / lecciones

| Patrón | Detalle |
|--------|---------|
| `productos_back_no_usa_fechaAtras` | La flecha de retroceso en `productos-header` es `<a><img src="flecha-blanca.png"></a>`, sin clase `.fechaAtras`. Usar `header.querySelector('a')` + `pg.mouse.click(getBoundingClientRect coords)` |
| `productos_search_input_nativo` | El campo de búsqueda es `input.search-input.inputsSearch` (no `ion-input`). Patrón: `pg.focus(sel)` + `pg.mouse.click(coords, {clickCount:3})` + `pg.keyboard.type(val)` + `pg.keyboard.press('Enter')` |
| `productos_tipo_globalmp_unico` | globalmp tiene un solo tipo de estructura: `LINEA`. DM-PRD-002 es estructuralmente N/A para esta cuenta |
| `productos_scroll_infinito_disabled` | Con búsqueda activa (27 resultados CAPRI), `ion-infinite-scroll` inicia en `disabled=true` — todos los resultados caben en la primera página; el scroll infinito no dispara carga adicional |
