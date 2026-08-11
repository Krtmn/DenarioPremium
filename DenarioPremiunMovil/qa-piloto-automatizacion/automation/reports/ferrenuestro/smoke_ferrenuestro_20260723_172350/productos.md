# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | Productos |
| Dispositivo | (CDP :9220, no expuesto ADB_SERIAL a este agente) |
| App | `com.kiberno.denarioPremiumPro` — La Tortuga v6.6.18 |
| Playa | Isla Coche (ferrenuestro) |
| Resultado | 8 PASS · 0 FAIL · 0 SKIP · 2 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Click "Productos" en Home → `/productos`, `product-structures-list` con 2 `ion-select` (empresa/tipo) + 17 estructuras (AGRICOLA…PVC) |
| DM-PRD-002 | 🚫 N/A | Popover del `ion-select` tipo solo devuelve 1 opción única "LINEA" (`idTypeProductStructure:1`) — sin 2º tipo al cual cambiar; estructural, confirma nota previa `[ferrenuestro-2026-07-07]` |
| DM-PRD-004 | ✅ PASS | Click "HERRAMIENTAS ELECTRICAS" → `product-list` con 17 ítems, cada uno con Código + Precio ($) + Inventario |
| DM-PRD-006 | ✅ PASS | Búsqueda "TALADRO" → filtra a 8 resultados (TALADRO INALAMBRICO 080178, TALADRO DE BANCO FE-0047, TALADRO PERCUTOR HD555-B3, etc.) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → `product-list` queda con 0 `ion-item`, texto "No hay productos disponibles" visible |
| DM-PRD-009 | ✅ PASS | Estructura CONSTRUCCION (567 productos) → `ionInfinite` ×2 con settle ~1.8s: 50 → 100 → 150 ítems cargados |
| DM-PRD-012 | ✅ PASS | Detalle "TALADRO INALAMBRICO 20V-2.0 Ah 10mm METCO" (080178): Nombre, Código, Estructura, Dimensión, Empaque, Unidad de venta, Lista de precio, Precio 86,40 $, Almacén, Inventario. ⚠ solo USD, sin Bs (patrón conocido ferrenuestro) |
| DM-PRD-013 | 🚫 N/A | El `ion-select` "Lista de precio" está `disabled=true` en 3 productos distintos (080178, ESMERIL ANGULAR 080401, WINCHE ELECTRIC); inspección vía `window.ng.getComponent()` confirma `comp.lists` y `priceListService.productlists` traen **1 sola entrada** ("PRECIO 1", idList 1) — PRECIO 2 no está cargado a nivel de servicio en esta sesión, no solo por producto. Sin 2ª opción real para un usuario → N/A estructural, no FAIL. ⚠ **Diverge de la corrida previa** `[ferrenuestro-2026-07-07]` que documentó 2 listas y PASS confirmado (86,40→63,94 $) — ver nota abajo |
| DM-PRD-020 | ✅ PASS | Back (`img[src*="flecha-blanca"]`) desde `product-detail` → regresa a `product-list` (no a estructuras) |
| DM-PRD-021 | ✅ PASS | Back desde `product-structures-list` (sin entrar a ninguna estructura) → Home principal (`app-home`) |

## Registros creados en sistema
ninguno (módulo de solo lectura)

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Home → módulo Productos | universal | `app-home p.nombreModulos` cuyo texto trim == "Productos" → `closest('a')` → `mouse.click` en `getBoundingClientRect()`. Confirma patrón de navegación desde Home reutilizable para otros módulos (no estaba documentado explícitamente en `_comunes.md`) |
| ⚠ **ferrenuestro: DM-PRD-013 regresión de datos (1 lista en vez de 2)** | cliente | Esta corrida (20260723) encontró `priceListService.productlists` con **1 sola lista** (PRECIO 1, idList 1) en 3 productos de HERRAMIENTAS ELECTRICAS, vs. la corrida `[ferrenuestro-2026-07-07]` que confirmó 2 listas (PRECIO 1/PRECIO 2) y PASS con recálculo 86,40→63,94 $ en el **mismo producto** (080178, TALADRO INALAMBRICO). El `ion-select` se ve correctamente `disabled=true` cuando solo hay 1 lista (comportamiento correcto de la UI, no bug de render) — la causa raíz es de **datos/configuración del lado servidor** (PRECIO 2 ya no está asociado a estos productos o la cuenta `leidy` perdió acceso a esa lista). Recomendado: verificar en próxima corrida si persiste — si se repite, actualizar la nota de `module-selectors/productos.md` de "userCanChangePriceList=true, 2 listas" a "N/A estructural (1 lista)" para ferrenuestro |
| `window.ng.getComponent(el)` disponible en ferrenuestro (servidor Isla Coche) | cliente/hallazgo | Confirmado `window.ng = TRUE` también en el build de ferrenuestro (Isla Coche v6.6.18) — útil para depurar estado interno (`comp.lists`, `comp.priceListService.productlists`) cuando un selector no responde a clicks reales, sin necesidad de asumir automatización rota |

> ✅ consolidado 20260723

## Hallazgos (solo si hay FAIL)
Ninguno — 0 FAIL en este módulo. DM-PRD-013 se clasificó N/A (ver tabla de casos y nota de consolidación arriba), no FAIL: la UI deshabilita correctamente el selector cuando el backend solo entrega 1 lista de precio; no hay comportamiento incorrecto de la app, solo una divergencia de datos respecto a la corrida anterior.

## Baseline
- Tool-uses aprox: ~35 (incluye 6 lecturas obligatorias + 1 grep de connectCdp/waitSyncOverlay + ~28 `browser_run_code_unsafe`)
- Duración aprox: ~9 min (mayor parte del tiempo en la investigación de DM-PRD-013: intento de click real en popover, asignación directa de `.value`, verificación cross-producto y con `window.ng`, 2 intentos acotados antes de concluir N/A)
