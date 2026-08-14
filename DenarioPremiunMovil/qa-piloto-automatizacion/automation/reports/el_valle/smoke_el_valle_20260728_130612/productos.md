# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | WebView por CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (`window.ng=true`, db_version=19) |
| Playa | el_valle · servidor **La Tortuga** |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A |
| Resultado | **9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Verificación BD | **BD-N/A** — módulo de solo lectura (RUNTIME §10: productos no lleva cotejo BD) |
| Estado final | HOME ✅ · 0 modales residuales |

## Catálogo observado

| Estructura (LINEA) | Productos |
|--------------------|-----------|
| EMBUTIDOS (PRODUCTOS TERMINADOS) | 66 |
| LACTEOS | 9 |
| PRODUCTO FRESCO EN VENTA | 5 |
| **Total** | **80** ✅ coincide con el YAML |

⚠ La línea **DESTACADOS** (`featuredProducts=true`, `nameProductLine="DESTACADOS"`) **no aparece** en el
selector de estructuras — consistente con lo confirmado en pedidos: está vacía en esta playa.

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Tile Productos → `product-structures-list` con 2 `ion-select` (empresa, tipo) + 3 `ion-item.listaItems` con badge de conteo |
| DM-PRD-002 | 🚫 N/A | **Tipo único**: el `ion-select` de tipo trae **1 sola opción ("LINEA")** → no hay otro tipo al cual cambiar. N/A estructural (como globalmp/romher/don-theo/piercar/ferrenuestro/jerez). El sel[0]=empresa también trae 1 opción y viene `disabled` |
| DM-PRD-004 | ✅ PASS | Click EMBUTIDOS → `product-list` con 50 ítems (página 1), cada uno "Nombre + Código: X + Precio: N USD" + imagen (50 `<img>`, `showProductImages=true`) |
| DM-PRD-006 | ✅ PASS | "COSTILLA" + Enter → filtra a 1 resultado: COSTILLA CHINA ESPECIAL (E0027 · 1,0000 USD) |
| DM-PRD-007 | ✅ PASS | "ZZZZZZZ" → 0 `ion-item` + `<p class="search-empty-state">No hay productos disponibles</p>` (patrón La Tortuga, `ion-list` vacío) |
| DM-PRD-009 | ✅ PASS | `ionInfinite` 1× → **50 → 66** productos (agota EMBUTIDOS); `ion-infinite-scroll` queda `disabled=true` e invisible (sin spinner infinito). `quPageProduct=50` confirmado |
| DM-PRD-012 | ✅ PASS | Detalle E0024: Nombre "MORTADELA DE POLLO ESPECIAL 2 KG" · Código E0024 · Estructura EMBUTIDOS (PRODUCTOS TERMINADOS) · Unidad de venta PIEZA · Lista de precio · Precio 10,3200 USD · Almacén PRODUCTO TERMINADO (EMBUTIDOS). ⚠ sin precio BS y sin línea "Inventario" (ver hallazgos no bloqueantes) |
| DM-PRD-013 | ✅ PASS | **6 listas de precio** (Precio 1…6, `idList` 1-6 / `coList` 01-06), selector **NO** disabled. El precio recalcula al cambiar: P1 **10,3200** → P2 10,3200 → P3 **2,3200** → P4/P5/P6 **1,0000** → vuelta a P1 **10,3200**. Nota: P2 numéricamente **igual** a P1 en este producto. El defecto romher (selector cambia pero pantalla no) **NO reproduce** |
| DM-PRD-020 | ✅ PASS | Back desde detalle → `product-list` (12 ítems, filtro "POLLO" preservado); `product-detail` desmontado |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` → `app-home` visible, módulo desmontado |

## Registros creados en sistema

Ninguno — módulo de **solo lectura**. Nada anexado al manifiesto web ni al `_bd-manifest.jsonl`.

## Hallazgos no bloqueantes (ningún caso del smoke los cubre)

1. **⚠ Vaciar el buscador NO repuebla la lista** (candidato a defecto). Tras una búsqueda, al borrar
   todo el texto (Backspace×N + Enter) `product-list` queda en **0 ítems** con
   `<p class="search-empty-state">No hay productos disponibles</p>` **+ el texto "Por favor espere…"**,
   y así permanece: se sondeó **8 veces a 1 s** (8 s) y el conteo siguió en 0. Con texto no vacío sí
   filtra correctamente. Reproducido 2 veces (tras "ZZZZZZZ" y tras "ALAS"). Workaround usado: buscar
   otro término, o salir a estructuras y reentrar. Difiere de la nota `[ins-2622]` ("la lista pasa
   **transitoriamente** por 0"): aquí no se recupera. No se marcó FAIL porque ningún caso del smoke
   (006/007) cubre el retorno al estado sin filtro.
2. **Detalle sin precio en Bs** — `product-detail` y `product-list` muestran **solo USD**, sin Bs.
   Mismo patrón que piercar / ferrenuestro / latino_cosmetica (backend La Tortuga). El caso DM-PRD-012
   pide "precio USD y BS": se resuelve **PASS** por precedente, con los campos núcleo presentes.
3. **Sin línea "Inventario"/stock en el detalle** pese a `hideProductWarehouse=false`. El detalle sí
   muestra **Almacén** ("PRODUCTO TERMINADO (EMBUTIDOS)", `ion-select` con 1 opción y `disabled=true`,
   coherente con `userCanChangeWarehouse=false`), pero no una línea de existencia; la `product-list`
   tampoco muestra "Inventario: N" (sí lo hacía en globalmp). `productStock0=false` no aplica: no hay
   productos ocultos por stock, se listan los 80.
4. **La búsqueda está acotada a la estructura activa** — "ALAS" dentro de EMBUTIDOS devuelve 0 aunque
   el YAML lista "ALAS DE POLLO" (C0051) como `producto_test`; el catálogo de EMBUTIDOS es de códigos
   E00xx/C00xx y ALAS DE POLLO vive en otra línea. Se usó E0024 como producto de detalle.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `productos-header > a` **NO existe** en este build; el back es `img[src*="flecha-blanca"]` → `closest('a')` en **(34, 51)** | universal (3.ª confirmación) | Reconfirma el fallback de `[ferrenuestro-2026-07-07]`. `h.clickBack` (`img.fechaAtras`) sigue sin servir en PRODUCTOS |
| Back **product-list → HOME** directo (no pasa por estructuras) | universal (n-ésima confirmación) | Reconfirmado en La Tortuga v1.0. Solo `detalle → product-list` es un nivel real de back; para ejecutar DM-PRD-021 hay que **reentrar** al módulo desde HOME |
| Empty-state de búsqueda = `<p class="search-empty-state">` fuera de `ion-list` | universal (2.ª confirmación) | Confirma `[latino_cosmetica-20260714]`; el placeholder-`ion-item` de gmp/ins **no** aparece en este build |
| Limpiar búsqueda deja la lista en 0 de forma **persistente** (con "Por favor espere…") | cliente / build a confirmar | Ver hallazgo 1. Contradice la nota `[ins-2622]` de estado transitorio |
| Sin `ion-item` placeholder "No hay productos disponibles" cuando SÍ hay productos | build La Tortuga v1.0 | `nItems` == productos reales; el filtro `!/No hay/i` sigue siendo inocuo pero ya no es imprescindible |
| `window.ng.getComponent(product-detail)` expone `lists` (6), `warehouses`, `listPrices`, `listSeleccionada`, `warehouseSeleccionado` | universal (con `window.ng=true`) | Vía barata para contar listas de precio sin abrir el popover — decide PASS vs N/A de DM-PRD-013 en 1 llamada |
| Selector de lista de precio: `.value = opt.value` (objeto `{idList,coList,naList,idEnterprise,coEnterprise,showOnly}`) + `ionChange` | universal | Reconfirma el patrón; `selectIonPopover` por texto sigue sin aplicar |

## Modo RECORD

**TRAZA: 31 ops · 9 casos grabados** → `_trace/productos.trace.json` (`validateTrace` = `[]`, válida).
Solo casos PASS; DM-PRD-002 (N/A) excluido. Gaps del replay documentados en `nota_cobertura`:
DM-PRD-006 quedó sin su op de acción (el tecleo se hizo fuera de `eng.W`), hubo 2 búsquedas y un
back+reingreso intermedios no grabados, y el assert de DM-PRD-013 hardcodea `length===6`.
Helpers que el runner debe proveer (no canónicos): `clickHomeModule`, `clickEstructura`,
`clickProducto`, `buscarProducto`, `backProductos`.

## Hallazgos (FAIL)

Ninguno.
