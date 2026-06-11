# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | CDP `http://127.0.0.1:9220` (WebView Capacitor) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa / Cliente | insumar — INSUMAR DISTRIBUIDOR |
| Estado inicial / final | HOME → HOME |
| Resultado | 9 PASS · 1 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `/productos` → `product-structures-list` visible; selector tipo presente; 18 líneas (ALIMENTOS 158, BEBIDAS 113, CARAMELOS 68…) |
| DM-PRD-002 | ✅ PASS | Selector tipo Linea → Sub-Linea: lista pasa de 18 ítems (ALIMENTOS…) a 42 ítems distintos (BARQUILLA, BOTELLA, COBERTURA…). **insumar SÍ tiene 2 tipos** (corrige nota previa de N/A estructural) |
| DM-PRD-004 | ✅ PASS | Click estructura ALIMENTOS → `product-list` con productos reales: "TOMATES PELADOS MARY 24X400G · Código: 11293 · Precio Unidad - UND: 1,85 US$" |
| DM-PRD-006 | ✅ PASS | Búsqueda "TOMATES" (focus+type+Enter en `input.search-input.inputsSearch`) → filtra a 1 resultado coincidente |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → 0 productos + mensaje "No hay productos disponibles" visible |
| DM-PRD-009 | ✅ PASS | `ionInfinite` en `ion-infinite-scroll` → lista crece a 100 productos (de 158 de ALIMENTOS); sin spinner infinito bloqueante |
| DM-PRD-012 | ✅ PASS | Detalle TOMATES PELADOS: Nombre, Código 11293, Estructura, Precio Unidad **1,85 US$ / 958,23 BS**, Almacén ALMACEN 01, Inventario. multiCurrency confirmado |
| DM-PRD-013 | 🚫 N/A | El detalle de producto en insumar **no expone selector de lista de precios** — único `ion-select` es Almacén (ALMACEN 01). Sin control ni mención de lista de precios/tarifa → flujo no existe en UI (RUNTIME §4) |
| DM-PRD-019 | ❌ FAIL | Back desde `product-list` navega a **/home** en vez de a `product-structures-list`. Reproduce defecto abierto DM-PRD-019 (handler back no distingue nivel) — antes en globalmp+romher, ahora confirmado en insumar |
| DM-PRD-020 | ✅ PASS | `Back` desde detalle (`productos-header > a` + mouse.click) → regresa a `product-list` del tipo activo (no a estructuras, no a Home) |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → /home (app-home visible, app-productos oculto). Correcto |

## Registros creados en sistema

Ninguno — módulo de solo lectura.

## Hallazgos

### FAIL — DM-PRD-019 (defecto conocido, ahora confirmado en insumar)
- **Comportamiento:** el botón atrás (`productos-header > a`) desde la **lista de productos** navega directamente a `/home` en lugar de regresar a la **lista de estructuras**.
- **Esperado:** lista de productos → lista de estructuras (un nivel arriba).
- **Reproducción cruzada:** ya documentado en globalmp y romher (`[gmp-2606][rom-2606]`). Esta corrida lo confirma en insumar → defecto consistente entre clientes, no específico de datos.
- **Causa probable (per módulo-selectors):** el handler de back no distingue el nivel de navegación dentro del módulo.

### Notas para `module-selectors.md` (módulo PRODUCTOS · `[ins-2606b]`)
1. **insumar tiene 2 tipos de estructura** (Linea + Sub-Linea), contrario a la nota previa que marcaba DM-PRD-002 como N/A estructural para insumar. El selector tipo es `ion-select` idx 1 (idx 0 = empresa). Cambiar tipo actualiza la lista de estructuras (18 → 42). DM-PRD-002 es ejecutable y PASS en insumar.
2. **Detalle de producto NO tiene selector de lista de precios** en insumar — solo `ion-select` de Almacén. DM-PRD-013 = N/A estructural (no FAIL).
3. **Precio en detalle** se muestra en doble moneda: `1,85 US$` y `958,23 BS` (multiCurrency=true). Confirma además la nota "Precio + IVA" de insumar en la lista.
4. **Campo búsqueda** confirmado: `input.search-input.inputsSearch` (placeholder "Búsqueda de productos"), focus + click×3 + keyboard.type + **Enter** (no filtra on-keyup).
5. **Botón atrás** confirmado: `productos-header > a` (sin `.fechaAtras`) + `pg.mouse.click(coords)`; `h.clickBack` no aplica aquí.
