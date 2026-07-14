# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | Productos |
| Dispositivo | (CDP :9220, sin ADB_SERIAL explícito en este agente) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | La Tortuga (window.ng=TRUE, servidor LATINOCOSMETICA) |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Click tile "Productos" desde HOME → `product-structures-list` con 2 `ion-select` (sel[0]=empresa LATINOCOSMETICA C.A., sel[1]=tipo estructura) + lista de 3 estructuras (BELOTTI 74, PROKPIL 70, ROIAL 8) |
| DM-PRD-002 | ✅ PASS | Cambio sel[1] tipo Marca→Categoria (asignar objeto `.value`+ionChange+dismiss popover): lista pasó de 3 estructuras (Marca) a 13 (Categoria: CERA, CRESPOS, CUIDADO FACIAL, DEPILACION, LINEA CAPILAR, etc.) |
| DM-PRD-004 | ✅ PASS | Click estructura "BELOTTI 74" (tras revertir a tipo Marca) → `product-list` con productos código+precio (ej. "BELOTTI TOALLITAS DESMAQ AGUA MICELAR X 30 UND · Código: 3055 · Precio: 2,90 $ · IVA: 16,00% · Inventario: 29") |
| DM-PRD-006 | ✅ PASS | `input.search-input.inputsSearch` + type "BELOTTI" + Enter → 47 resultados filtrados (todos con marca BELOTTI, dentro de la estructura ya filtrada) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → 0 `ion-item`, mensaje "No hay productos disponibles" renderizado como `<p class="search-empty-state">` (NO como 1er ion-item placeholder, patrón distinto a otros clientes) |
| DM-PRD-009 | ✅ PASS | Tras re-filtrar "BELOTTI" (baseline 47 items) → 2× `ionInfinite` con settle 1.8s → 56 items cargados; spinner de infinite-scroll sin quedar atascado |
| DM-PRD-012 | ✅ PASS | Click producto → `product-detail`: Nombre, Código, Estructura Producto (CUIDADO FACIAL), Unidad de venta (UNIDAD), Lista de precio (DETAL), Precio (2,90 $ — solo USD, sin Bs, consistente con la lista), IVA, Almacén, Inventario |
| DM-PRD-013 | 🚫 N/A | `ion-select` "Lista de precio" en detalle tiene **1 única opción** ("DETAL") → confirma `userCanChangePriceList=false` de la VG; no hay 2ª lista a la cual cambiar. Estructural, no defecto |
| DM-PRD-020 | ✅ PASS | `h.clickBack` equivalente (click en `<a>` de `productos-header` / fallback img `flecha-blanca`) desde detalle → vuelve a `product-list` (lista de productos del tipo/estructura activo), NO a estructuras |
| DM-PRD-021 | ✅ PASS | Re-entrada a Productos → back inmediato desde `product-structures-list` (sin pasar por lista) → `app-home` directo (`url=http://localhost/home`) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — ninguno | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `tipo_estructura` real = Marca/Categoria (NO Línea) | cliente (latino_cosmetica) | El YAML del cliente asumía `listProductsBy=lineas`/"Linea" por defecto; en UI real el 2º `ion-select` de `product-structures-list` ofrece **Marca** (default, idTypeProductStructure=1) y **Categoria** (idTypeProductStructure=2). DM-PRD-002 SÍ es ejecutable (no N/A estructural) — corregir yaml `tipo_estructura_default` |
| Mensaje "No hay productos disponibles" como `<p class="search-empty-state">` | universal (candidato) | En corridas previas (gmp/ins) el placeholder aparecía como 1er `ion-item` dentro de `product-list`. En latino_cosmetica (servidor La Tortuga) aparece como párrafo `<p class="search-empty-state ion-text-center">` **fuera** de `ion-list`, con `ion-list` completamente vacío. Ambos patrones deben tolerarse al verificar DM-PRD-007 (buscar el texto en `product-list`, no asumir que es un ion-item) |
| Detalle de producto solo precio USD, sin Bs | cliente (latino_cosmetica) | Igual patrón que globalmp/don-theo/piercar/ferrenuestro/jerez: `product-detail` muestra 1 sola moneda (USD aquí), mientras `product-list` también muestra solo USD (a diferencia de otros clientes donde la lista sí trae Bs+USD). Campos núcleo presentes → no FAIL |
| Lista de precio única "DETAL" | cliente (latino_cosmetica) | `userCanChangePriceList=false` confirmado en UI: único `ion-select` de lista de precio con 1 sola `ion-select-option` ("DETAL") → DM-PRD-013 N/A estructural, patrón igual a insumar/dm-electronica |

*(patrones confirmados en esta corrida — pendiente 2ª corrida de latino_cosmetica para graduar a `module-selectors/productos.md`)*

> ✅ consolidado 20260714
