# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | PRODUCTOS (solo lectura) |
| Cliente | ferrenuestro |
| Dispositivo | Android real vía CDP `127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Empresa | FERRENUESTRO MAYOR, (idEnterprise 1, coEnterprise 00001) |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |
| Estado inicial → final | HOME → HOME ✅ |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | product-structures-list con 17 estructuras (AGRICOLA 319, AUTOMOTRIZ 336, CONSTRUCCION 543, ELECTRICIDAD 555…); selector empresa + selector tipo LINEA |
| DM-PRD-002 | 🚫 N/A | Estructural: 1 solo tipo de estructura (LINEA). Selector tipo tiene 1 sola opción → no hay a qué cambiar |
| DM-PRD-004 | ✅ PASS | Click HERRAMIENTAS ELECTRICAS → product-list con 18 productos, c/u con Nombre + Código + Precio $ + Inventario |
| DM-PRD-006 | ✅ PASS | Búsqueda "TALADRO" filtró 18→8 resultados, todos coincidentes |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → 0 productos + mensaje "No hay productos disponibles" |
| DM-PRD-009 | ✅ PASS | ELECTRICIDAD (555): scroll infinito 50 → 100 → 150 con cada disparo ionInfinite |
| DM-PRD-012 | ✅ PASS | Detalle TALADRO INALAMBRICO 20V (cód 080178): Nombre, Código, Estructura, Dimensión (METCO), Empaque (BULTO-1), Unidad venta (UND), Lista precio, Precio 86,40 $, Almacén, Inventario 0 |
| DM-PRD-013 | ✅ PASS | Cambio lista PRECIO 1 → PRECIO 2: precio recalcula 86,40 $ → 63,94 $ y selector refleja la lista. Defecto romher NO reproduce |
| DM-PRD-020 | ✅ PASS | Back desde detalle → product-list (nivel intermedio válido) |
| DM-PRD-021 | ✅ PASS | Back desde product-structures-list → HOME |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — ninguno | — |

## Verificación BD
BD-N/A — módulo de solo lectura (no crea/modifica datos).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Back en productos = `img[src*="flecha-blanca"]` → `closest('a')` (coords ~34,51) | universal (candidato) | El selector documentado `productos-header > a` NO matcheó en ferrenuestro (el `<a>` no es hijo directo del header). Localizar por la img `flecha-blanca.png` es robusto. Confirmar en otras playas |
| ferrenuestro: detalle producto muestra **solo precio USD ($)**; la `product-list` **también solo $** (sin BS) | cliente | A diferencia de gmp/don-theo (lista con BS+USD), aquí ni lista ni detalle muestran BS — solo $. Campos núcleo presentes → PASS |

> ✅ consolidado 2026-07-07 → back-flecha-blanca-fallback (tag en Botón atrás) y solo-precio-USD en `module-selectors/productos.md`; estructuras/listas/tipo LINEA en `ferrenuestro.yaml modules.productos`.

## Datos reales para el YAML (modules.productos)
- **empresa**: `FERRENUESTRO MAYOR,` (idEnterprise 1, coEnterprise "00001", enterpriseDefault true)
- **tipo_estructura_default**: `LINEA` (idTypeProductStructure 1, coTypeProductStructure "01", nuLevel 1) — **único tipo** → DM-PRD-002 N/A estructural
- **17 estructuras** (LINEA): AGRICOLA(319), AUTOMOTRIZ(336), BOMBILLOS(64), CERRAJERIA(161), CONSTRUCCION(543), DESCUENTOS VARIOS(1), ELECTRICIDAD(555), GALVANIZADO(184), GRIFERIA(199), HERRAMIENTAS ELECTRICAS(18), HERRAMIENTAS MANUALES(191), MISCELANEOS(347), PEGAMENTOS(110), PINTURA(183), PLOMERIA(191), PROMOCION(0), PVC(241)
- **texto_busqueda**: `TALADRO` (8 resultados en HERRAMIENTAS ELECTRICAS)
- **producto_ejemplo**: TALADRO INALAMBRICO 20V-2.0 Ah 10mm METCO · cód `080178` · PRECIO 1 = 86,40 $ · PRECIO 2 = 63,94 $ · Inventario 0 · Almacén ALMACEN
- **listas_precio** (userCanChangePriceList=TRUE → DM-PRD-013 ejecutable): `PRECIO 1` (idList 1, coList P0001) / `PRECIO 2` (idList 2, coList P0002)
- **almacen**: ALMACEN (idWarehouse 1, coWarehouse "1") — hideProductWarehouse=FALSE muestra almacén/stock ✓
- quPageProduct=50 confirmado (paginación 50→100→150)

## Hallazgos (solo si hay FAIL)
Ninguno — 0 FAIL.
