# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | PRODUCTOS |
| Cliente | central_foods (CENTRAL FOODS) |
| App | `com.kiberno.denarioPremiumPro` |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `/productos` → `product-structures-list` visible con sel[0]=empresa "CENTRAL FOODS C.A." + sel[1]=tipo "Linea" y 47 estructuras (ej. "ARROZ 7") |
| DM-PRD-002 | ✅ PASS | Cambio tipo Linea→Sub-Linea (assign value+ionChange): lista actualizó 47→128 estructuras. 2 tipos disponibles (Linea idType1 / Sub-Linea idType2) |
| DM-PRD-004 | ✅ PASS | Click estructura ARROZ → `product-list` con 7 productos; cada uno con Código, Precio US$, Precio BS, Inventario e imagen |
| DM-PRD-006 | ✅ PASS | searchbar `input.search-input.inputsSearch` (placeholder "Búsqueda de productos", en `app-productos`, NO dentro de `product-list`) + "PREMIUM" + Enter → filtró 7→2 productos |
| DM-PRD-007 | ✅ PASS | "ZZZZZZZ" + Enter → 0 productos reales + mensaje "No hay productos disponibles" |
| DM-PRD-009 | ✅ PASS | Estructura ADOBOS Y ADEREZOS (16 prod, `ion-infinite-scroll` enabled) → disparar `ionInfinite`: no quedan más páginas, scroll se auto-`disabled`, sin spinner colgado (comportamiento correcto) |
| DM-PRD-012 | ✅ PASS (nota) | `product-detail`: Nombre, Código (0611), Estructura, Unidad de venta (UNIDAD), Lista de precio, Precio **1,5300 US$**, Almacén (PRINCIPAL), Inventario (27). ⚠ Detalle muestra precio **solo en US$** (sin BS); BS sí aparece en la lista. Todos los campos requeridos presentes |
| DM-PRD-013 | 🚫 N/A | Selector "Lista de precio" presente pero **`disabled=true`** con única opción "Precio 02" → no hay lista alterna a la cual cambiar. Confirma VG `userCanChangePriceList=false` |
| DM-PRD-020 | ✅ PASS | clickBack desde `product-detail` (flecha-blanca) → `product-list` del tipo activo (ADOBOS, 16 prod). NO saltó a estructuras |
| DM-PRD-021 | ✅ PASS | clickBack desde `product-structures-list` → `app-home`. App queda en HOME |

## Datos descubiertos
- **tipo_estructura_default:** `Linea` (idTypeProductStructure 1, coTypeProductStructure "001"). Segundo tipo disponible: `Sub-Linea` (idType 2). → **2 tipos** (como insumar; DM-PRD-002 ejecutable).
  - Linea → 47 estructuras · Sub-Linea → 128 estructuras.
- **texto_busqueda:** `PREMIUM` filtra 7→2 dentro de estructura ARROZ. `ARROZ` y `ADOBOS Y ADEREZOS` son estructuras útiles (7 y 16 productos respectivamente).
- **Empresa (sel[0] en estructuras):** "CENTRAL FOODS C.A." (idEnterprise 1, coEnterprise "CF_A25").
- **Detalle de producto:** muestra Lista de precio = "Precio 02" (idList 2) — única lista; Almacén = "PRINCIPAL" (idWarehouse 1).
- Lista de productos muestra precio **US$ y BS** + "Inventario: N" (showStock/hideProductWarehouse confirmados).

## Discrepancias VG
| VG (CSV dev) | Esperado | Observado en UI | Veredicto |
|--------------|----------|-----------------|-----------|
| `userCanChangePriceList=false` | DM-PRD-013 N/A (sin/selector bloqueado) | Selector "Lista de precio" presente pero **`disabled=true`** con única opción "Precio 02" | ✅ Coincide — N/A confirmado |
| `showProductImages=true` | imágenes en lista/detalle | Lista: 1 `ion-img` por producto. Detalle: imagen (placeholder "nodisponible.png" cuando el producto no tiene foto) | ✅ Coincide |
| `hideProductWarehouse=false` | muestra almacén/stock en productos | Lista muestra "Inventario: N"; detalle muestra Almacén "PRINCIPAL" + Inventario | ✅ Coincide |
| `showStock=true` | stock visible | "Inventario: N" en lista y detalle | ✅ Coincide |
| `validateWarehouses=true` | — | Selector Almacén presente en detalle | ✅ Coincide |
| `unitByPriceList=false` | sin precios desglosados por lista/unidad | Detalle muestra "Unidad de venta: UNIDAD" + 1 precio (no desglose por unidad) | ✅ Coincide |
| `vatExemptProducts=false` | IVA no por producto | Detalle no muestra campo IVA/exento por producto | ✅ Coincide |
| `enterpriseEnabled=false` | sin selector de empresa | ⚠ En vista **estructuras** sí aparece sel[0] empresa "CENTRAL FOODS C.A." (preseleccionada/no editable). No bloquea — el módulo PRODUCTOS siempre muestra la empresa como contexto. Nota menor, no afecta casos | ⚠ Observación (no FAIL) |

**Sin discrepancias bloqueantes.** Todas las VG de PRODUCTOS coinciden con la UI.

## Patrones / selectores nuevos
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Searchbar productos `input.search-input.inputsSearch` placeholder **"Búsqueda de productos"** vive en `app-productos` (header), NO dentro de `product-list` | universal | central_foods: `querySelector('product-list input.search-input')` = null; buscar en `app-productos` o `document`. focus + click×3 + `keyboard.type` + **Enter** (no filtra on-keyup). Confirma patrón de globalmp con placeholder concreto |
| Limpiar búsqueda (Backspace+Enter) NO re-puebla la lista | cliente (central_foods) | Tras vaciar el searchbar, `product-list` queda en "No hay productos disponibles" en vez de restaurar todos los productos de la estructura. Para recuperar, re-tipear un término. No es FAIL de los casos asignados pero conviene re-tipear en vez de limpiar |
| Botón atrás PRODUCTOS = `<a>` envolviendo `img[src*="flecha-blanca.png"]` (x≈10,y≈10, w48×h47) | universal | ⚠ El `img.fechaAtras` que existe en el header de PRODUCTOS apunta a `productosNuevoBlanco.svg` (icono de módulo, NO back) → `h.clickBack` falla aquí. Usar `flecha-blanca.png` + `mouse.click`. Confirma/precisa nota globalmp "back NO usa .fechaAtras" |
| Detalle: selector "Lista de precio" `ion-select[disabled]` con 1 opción cuando `userCanChangePriceList=false` | cliente (atado a VG) | central_foods: disabled + única opción "Precio 02" → DM-PRD-013 N/A. Selector Almacén ("PRINCIPAL") como 2º ion-select del detalle |
| Detalle muestra precio **solo US$** (sin BS), aunque la lista muestra US$+BS | cliente (central_foods) | Diverge de insumar (que sí muestra US$+BS en detalle). No es FAIL: todos los campos requeridos renderizan; el precio USD es correcto |
| Tipo estructura: cambio por `sel.value = optObjeto` + `ionChange` (sel[1] en estructuras) | universal | Confirma patrón insumar: el value es objeto, `selectIonPopover` por texto no aplica. Linea↔Sub-Linea recalcula la lista (47↔128) |

> ✅ consolidado 2026-06-12

## Registros creados en sistema
ninguno (módulo de solo lectura)
