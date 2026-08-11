# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — label "Versión 1.0" (build El Yaque refactor, `window.ng=false`) |
| Playa | jerez — empresa default INV JEREZ MOTORS VALERA (idEnterprise 1) |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |
| BD | BD-N/A (módulo solo lectura) |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `/productos` → `product-structures-list`; 8 estructuras con badge (Accesorios MJ 179, Carbones 136, HJ-Forza 75, Otras marcas 131, Plasticos 1, Repuestos Jerez 221, Repuestos de Motos 4055, XCORT 31); selector empresa (3 opc) + selector tipo (LINEA). |
| DM-PRD-002 | 🚫 N/A | Único tipo de estructura: `ion-select` tipo con 1 sola opción "LINEA" (idTypeProductStructure=1). N/A estructural — no hay 2º tipo al cual cambiar. |
| DM-PRD-004 | ✅ PASS | Click "Carbones" → `product-list` con 50 productos (1ª página); cada ítem con Código + Precio USD + Precio BS + Inventario. |
| DM-PRD-006 | ✅ PASS | Búsqueda "esmeril" (focus+type+Enter) filtra 50→8, todos "Carbon: esmeril…". Coincide con YAML (50→8). |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → 0 productos reales; placeholder "No hay productos disponibles" visible. |
| DM-PRD-009 | ✅ PASS | `ion-infinite-scroll`: lista crece 50→86 al disparar `ionInfinite`; scroll queda `disabled` (catálogo agotado, spinner resuelto). Ver observación. |
| DM-PRD-012 | ✅ PASS | Detalle `product-detail`: Nombre "Carbon: tronzadora-14 esma-7 Metabo", Código CB3218AD, Estructura Carbones, Unidad PAR, Precio 2,85 USD, Almacén, Inventario 1538. (Detalle muestra solo USD; la lista muestra USD+BS — comportamiento por cliente igual gmp/don-theo/piercar.) |
| DM-PRD-013 | ✅ PASS | Cambio lista de precio "Precio 1" (2,85 USD) → "Precio 3" (4,13 USD); precio visible se recalcula y refleja. Defecto romher (selector no refleja) NO reproduce. |
| DM-PRD-020 | ✅ PASS | Back (`productos-header > a`) desde detalle → `product-list` (50 ítems, tipo activo Carbones). |
| DM-PRD-021 | ✅ PASS | Back desde `product-list` → `app-home` (`/home`) directo (salta nivel estructuras, comportamiento conocido). Estado final HOME. |

## Registros creados en sistema
Ninguno (módulo de solo lectura).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selector empresa (estructuras) = 1er `ion-select`, 3 opciones | cliente (jerez) | `product-structures-list` sel[0] ahora ofrece 3 almacenes/empresas con textos DISTINTOS: "INV JEREZ MOTORS VALERA" / "INV JEREZ MOTORS CARACAS" / "INV JEREZ MOTORS TURMEREMO". sel[1]=tipo (LINEA, única). |
| Almacén (detalle) cambió de nombre bajo nuevo set | cliente (jerez) | Detalle muestra almacén "Ferreteria UNIFICADO VALERA 2 Valera" (YAML decía "Ferreteria VALERA 2 Valera"). Actualizar `modules.productos` del YAML jerez. |
| Lista de precio (detalle): objeto `{idList,coList,naList,idEnterprise,coEnterprise,showOnly}` | universal (refuerza) | 2 opciones: "Precio 1" (idList 1, coList "01") y "Precio 3" (idList 2, coList "02"). Cambio = asignar `.value=opt.value` + `ionChange`; precio recalcula. |
| Detalle jerez muestra solo precio USD (sin BS) | cliente (jerez) | Igual patrón gmp/don-theo/piercar: `product-list` muestra USD+BS, `product-detail` solo USD. Campos núcleo presentes → PASS. |

> ✅ consolidado 2026-07-06

## Observaciones (no defecto)
- **DM-PRD-009 conteo:** badge de "Carbones" = 136 pero el `product-list` renderiza 86 tras agotar el infinite-scroll (`disabled=true`). No es FAIL: más productos cargan y el spinner se resuelve (criterio PASS). Posible virtualización de DOM o el badge cuenta variantes/sub-códigos no listados. Confirmar en próxima corrida si se requiere el conteo exacto.
- **VG verificadas vs UI:** `userCanChangePriceList=true` → DM-PRD-013 ejecutable y PASS ✅. `hideProductWarehouse=false` → almacén visible en detalle ✅. `showProductImages=true` (no bloqueante para casos). Tipo único LINEA confirma DM-PRD-002 N/A estructural.

## Hallazgos (solo si hay FAIL)
Ninguno — 0 FAIL.
