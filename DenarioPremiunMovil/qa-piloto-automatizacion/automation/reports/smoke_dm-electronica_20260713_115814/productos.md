# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Dispositivo | CDP `127.0.0.1:9220` (WebView) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (El Yaque) |
| Playa / Cliente | dm-electronica (BOTZ / DM ELECTRONICA) |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |
| Estado inicial | HOME | Estado final | HOME ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Módulo abre `/productos`; `product-structures-list` visible; sel[0]=empresa "BOTZ", sel[1]=tipo; estructura "LINEA BLANCA" |
| DM-PRD-002 | ✅ PASS | 2 tipos: Linea (id 1) / Sub-Linea (id 2). Cambio a Sub-Linea → lista actualiza de "LINEA BLANCA" a 3 sub-líneas MAYOR/MENOR/UNICO |
| DM-PRD-004 | ✅ PASS | Click en "LINEA BLANCA 363" → `product-list` con 50 items (código + precio + inventario) |
| DM-PRD-006 | ✅ PASS | Búsqueda "A/A" → 28 productos (aires acondicionados MILEXUS/GPLUS) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → 0 productos + mensaje "No hay productos disponibles" |
| DM-PRD-009 | ✅ PASS | `ionInfinite` pagina de 50 en 50: 50→100→150 (`quPageProduct=50`); spinner no queda infinito |
| DM-PRD-012 | ✅ PASS | Detalle: Nombre, Código (0001052), Estructura (MENOR), Unidad (UNIDAD), Lista de precio, Precio (17,00 US$), Almacén, Inventario |
| DM-PRD-013 | 🚫 N/A | Selector "Lista de precio" con **una sola opción** (PRECIO LISTA 1, idList 1) → no hay lista distinta a la cual cambiar → N/A estructural |
| DM-PRD-020 | ✅ PASS | Back desde detalle → `product-list` (50 items del tipo activo) |
| DM-PRD-021 | ✅ PASS | Back desde `product-list` → HOME directo (patrón conocido: list→home sin nivel intermedio de estructuras) |

## Registros creados en sistema
Ninguno — módulo de solo lectura. **SIN Verificación BD** (módulo solo-lectura → BD-N/A).

## Observaciones multiCurrency (VG multiCurrency=true)
- **Confirmado:** la `product-list` muestra precios en **2 monedas** para productos con precio USD (ej. "COCINA ELeCTRICA 2 HORNILLAS ... Precio: 10,00 US$ Precio: 6.859,40 BS"); productos con precio 0 muestran solo "0,00 BS".
- **El detalle de producto muestra solo US$** (ej. "17,00 US$"), sin BS — mismo comportamiento que gmp/don-theo/piercar/ferrenuestro/jerez (lista con ambas monedas, detalle con una sola). Campos núcleo presentes → PASS.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| dm-electronica: 2 tipos de estructura (Linea id 1 / Sub-Linea id 2) → DM-PRD-002 EJECUTABLE y PASS | cliente | sel[1]=tipo con 2 opciones (objeto `{idTypeProductStructure,coTypeProductStructure,naTypeProductStructure,nuLevel,coEnterprise:"BARAK_A",idEnterprise:1}`). Linea→1 estructura "LINEA BLANCA 363"; Sub-Linea→3: MAYOR/MENOR/UNICO. Excluye a dm-electronica de la nota N/A por tipo único (como insumar) |
| dm-electronica: sel[0]=empresa "BOTZ" (enterpriseEnabled=true) | cliente | `product-structures-list` con selector empresa poblado; coincide con VG enterpriseEnabled confirmada en clientes |
| dm-electronica: DM-PRD-013 N/A estructural — 1 sola lista de precio | cliente | `product-detail` ion-select "Lista de precio" con única opción "PRECIO LISTA 1" (idList 1, coList "01", coEnterprise "BARAK_A"). No hay 2ª lista → no reproduce ni descarta defecto romher DM-PRD-013 |
| dm-electronica: detalle muestra solo US$; lista muestra US$+BS | cliente | multiCurrency=true confirmado en la lista; detalle unimoneda (patrón backend El Yaque) |
| Back `product-list`→HOME directo (sin nivel estructuras) | universal (reconfirma) | reconfirmado en dm-electronica; coincide con gmp/don-theo/ins-2622. Botón atrás vía `productos-header > a` / fallback img flecha → `closest('a')` + `mouse.click` |

> ✅ consolidado 20260713 — back product-list→HOME reconfirmado (tag); 2 tipos estructura + 1 lista precio + detalle solo US$ → nota productos.md; tipo_estructura/lista_precio_unica → YAML.

## Hallazgos (solo si hay FAIL)
Ninguno — sin FAIL.
