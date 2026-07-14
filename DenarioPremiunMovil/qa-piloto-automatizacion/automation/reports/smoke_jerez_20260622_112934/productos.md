# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Cliente | jerez |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Click Productos → `product-structures-list` visible; sel[0]=empresa "INVERSIONES JEREZ MO", sel[1]=tipo "LINEA"; 8 categorías (Accesorios MJ 179, Carbones 136, HJ-Forza 71, Otras marcas 102, Plasticos 1, Repuestos Jerez 207, Repuestos de Motos 4041, XCORT 31) |
| DM-PRD-002 | 🚫 N/A | Selector tipo tiene 1 sola opción (LINEA, idTypeProductStructure=1). Sin tipo alterno para conmutar → N/A estructural (igual que globalmp/romher) |
| DM-PRD-004 | ✅ PASS | Click "Carbones" → `product-list` con 50 productos; cada ítem muestra Nombre, Código (CB…), Precio USD, Precio BS e Inventario (stock) |
| DM-PRD-006 | ✅ PASS | Búsqueda "esmeril" en searchbar → 50→8 productos, todos contienen "esmeril" |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → "No hay productos disponibles", 0 productos reales |
| DM-PRD-009 | ✅ PASS | Scroll infinito en Carbones (136 prods): 50→100 ítems; `ion-infinite-scroll` enabled, sin spinner colgado |
| DM-PRD-012 | ✅ PASS | Click producto → `product-detail`: Nombre "carbon: esma-4.1/2 B & D. y varios 1-R", Código CB157AD1-R, Estructura Carbones, Unidad de venta PAR, Lista de precio (selector), Precio 1,35 USD, Inventario 3654 |
| DM-PRD-013 | ✅ PASS | Selector Lista de precio Precio 1 → Precio 3 → precio mostrado actualiza 1,35 USD → 1,96 USD (UI refleja el cambio; sin defecto romher). `userCanChangePriceList=true` confirmado |
| DM-PRD-020 | ✅ PASS | Back desde detalle → vuelve a `product-list` de Carbones (50 ítems), no a estructuras |
| DM-PRD-021 | ✅ PASS | Back desde `product-list` → HOME (`/home`, app-home visible) |

## Registros creados en sistema

Ninguno — módulo de solo lectura.

## Datos descubiertos (consolidar en jerez.yaml → modules.productos)

| Clave | Valor descubierto |
|-------|-------------------|
| `tipo_estructura_default` | `LINEA` (idTypeProductStructure=1; único tipo disponible) |
| `texto_busqueda` | `esmeril` (filtra dentro de la estructura "Carbones": 50→8) |
| empresa (sel[0]) | "INVERSIONES JEREZ MO" (idEnterprise=1, co 00001) |
| listas de precio (detalle) | "Precio 1" (idList 1) y "Precio 3" — DM-PRD-013 ejecutable y PASS |
| almacén/empresa (detalle) | "Ferreteria VALERA 2 Valera" |

## VGs verificadas vs UI

| VG (CSV dev) | Confirmado en UI |
|--------------|------------------|
| `showStock=true` | ✅ lista y detalle muestran "Inventario: N" |
| `userCanChangePriceList=true` | ✅ detalle tiene selector Lista de precio activo (2 opciones) y recalcula precio |
| `showProductImages=true` | ✅ (no bloqueó render; no evaluado pixel a pixel) |
| `hideProductWarehouse=false` | ✅ detalle muestra Almacén/empresa |
| `productsOrderBy="co_product"` | ✅ orden por código observado (CB157, CB3009, CB3014…) |
| `vatExemptProducts=false` | sin discrepancia observable |

Sin discrepancias CSV-dev vs app.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Detalle = `product-detail` (tag) | universal | El detalle de producto es `product-detail` (no `product-list`); confirmado en jerez. Texto plano accesible vía `.innerText` con etiquetas Nombre/Código/Estructura/Unidad de venta/Lista de precio/Almacén/Inventario |
| Lista de precio en jerez = sel[0] del detalle | cliente | El selector Lista de precio es el 1er `ion-select` visible del detalle (value es objeto `{idList,coList,naList…}`); 2 listas: "Precio 1"/"Precio 3". Cambio recalcula precio (PASS, no defecto romher). Almacén = 2º select |
| DM-PRD-002 N/A en jerez (1 solo tipo LINEA) | cliente | Como globalmp/romher: único `idTypeProductStructure` → sin conmutación de tipo |
| Back `product-list`→HOME directo | cliente | Igual que insumar 2619: back desde lista va directo a HOME (no a estructuras); el back lista→estructuras correcto solo aplica desde detalle (DM-PRD-020). No es FAIL |
| Scroll infinito requiere scroll físico previo | universal | `ionInfinite` solo (sin scroll) no cargó la página siguiente; combinar `ion-content.scrollToBottom()` + dispatch `ionInfinite` sí cargó (50→100) |

> ✅ consolidado 2026-06-22

## Hallazgos (solo si hay FAIL)

Ninguno.
