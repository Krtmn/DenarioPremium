# Smoke Test — Módulo PRODUCTOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | PRODUCTOS |
| Dispositivo | CDP `127.0.0.1:9220` (WebView Capacitor) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa | insumar |
| Resultado | 9 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | `/productos` → `product-structures-list` activo; 2 ion-select (empresa "INSUMAR DISTRIBUIDOR" + tipo "Linea/Sub-Linea") + lista poblada (ALIMENTOS 158, BEBIDAS 113, CARAMELOS 68…) |
| DM-PRD-002 | ✅ PASS | Selector tipo Linea→Sub-Linea: lista cambia completa (ALIMENTOS/BEBIDAS → BARQUILLA 2/BOTELLA 13/COBERTURA 1…). insumar tiene 2 tipos → ejecutable |
| DM-PRD-004 | ✅ PASS | Click estructura "ALIMENTOS 158" → `product-list` con productos: nombre + "Código: 11293" + "1,85 US$" |
| DM-PRD-006 | ✅ PASS | Búsqueda "TOMATES" (focus+keyboard.type+Enter): 50 → 1 producto (TOMATES PELADOS MARY 24X400G) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" → mensaje "No hay productos disponibles" |
| DM-PRD-009 | ✅ PASS | `ionInfinite`: lista crece 51 → 101 ítems en disparos sucesivos; sin spinner infinito (ALIMENTOS=158 productos) |
| DM-PRD-012 | ✅ PASS | Detalle TOMATES: Nombre, Código 11293, Precio Unidad UNIDADES **1,85 US$** y **958,23 BS**, unidad UNIDADES, Almacén ALMACEN 01, Inventario 0,00 |
| DM-PRD-013 | 🚫 N/A | Detalle insumar expone un único ion-select = "ALMACEN 01"; **no hay selector de Lista de Precios**. Confirmado en 2 productos (PEPITONA, TOMATES) → N/A estructural (re-confirma nota previa) |
| DM-PRD-020 | ✅ PASS | Back desde detalle (header `a`, sin `.fechaAtras`, mouse.click) → `product-list` del tipo activo (no salta a estructuras) |
| DM-PRD-021 | ✅ PASS | Back desde estructuras → HOME (`/home`, app-home visible, estructuras ya no visible) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — ninguno | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Estructuras: `product-structures-list .product-structure-title` / `ion-item.listaItems` | universal | Cada ítem muestra "NOMBRE {conteo}" (ej. "ALIMENTOS 158"). Click navega a `product-list` con `mouse.click` en coords reales |
| 2 ion-select en estructuras | cliente (insumar) | sel[0]=empresa ("INSUMAR DISTRIBUIDOR", `select-disabled`); sel[1]=tipo estructura (Linea/Sub-Linea). El selector de **tipo** es el 2º ion-select visible, no el 1º |
| insumar tiene 2 tipos de estructura (Linea + Sub-Linea) | cliente (insumar) | DM-PRD-002 **ejecutable y PASS** — difiere de globalmp/romher (1 solo tipo). Actualizar nota "DM-PRD-002 N/A estructural" para que excluya a insumar |
| Cambio de tipo: asignar `optionEl.value` (objeto) al ion-select + `ionChange` | universal | Las opciones son objetos; tomar `value` de `ion-select-option` por texto y asignarlo a `.value`. selectIonPopover por texto no aplica (valor es objeto, no string) |
| Detalle: único ion-select = "ALMACEN 01" (sin Lista de Precios) | cliente (insumar) | Confirma DM-PRD-013 N/A estructural en insumar. Precio USD+BS se muestran como texto fijo ("Precio Unidad - UNIDADES 1,85 US$ / 958,23 BS"), no recalculables por selector |
| Placeholder residual "No hay productos disponibles" | universal | Permanece como 1er `ion-item` en `product-list` aun con productos cargados; al iterar productos filtrar `!/No hay/i.test(text)` para no clickearlo |
| Back productos: `a img` con `getBoundingClientRect().top<90` → `closest('a')` + mouse.click | universal | Confirma nota: PRODUCTOS no usa `.fechaAtras`; `h.clickBack` no sirve. Cadena: detalle→list→estructuras→home, un back por nivel |

> ✅ consolidado 2026-06-10

## Hallazgos (solo si hay FAIL)
Ninguno — sin FAIL.
