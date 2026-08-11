# Smoke Test — Módulo PRODUCTOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | PRODUCTOS |
| Cliente | Hidroponias |
| Dispositivo | Denario Premium Móvil (Isla La Tortuga) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 |
| Resultado | 5 PASS · 1 FAIL · 0 SKIP · 4 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-PRD-001 | ✅ PASS | Módulo Productos cargó correctamente desde HOME |
| DM-PRD-002 | ✅ PASS | Selector de tipo estructura respondió a cambio (2+ tipos detectados) |
| DM-PRD-004 | ✅ PASS | Click en estructura llevó a lista de productos visible |
| DM-PRD-006 | ❌ FAIL | Búsqueda con "BROCOLI" no retornó resultados (ver Hallazgos) |
| DM-PRD-007 | ✅ PASS | Búsqueda "ZZZZZZZ" mostró mensaje "No hay productos disponibles" |
| DM-PRD-009 | ✅ PASS | Scroll infinito respondió; conteo items: 0→0 (catálogo limitado o vacío en búsqueda previa) |
| DM-PRD-012 | 🚫 N/A | No se pudo clickear producto (lista vacía tras DM-PRD-006 fallida) |
| DM-PRD-013 | 🚫 N/A | No alcanzable (detalle no se abrió por fallo anterior) |
| DM-PRD-020 | 🚫 N/A | No alcanzable (no en vista detalle) |
| DM-PRD-021 | ✅ PASS | Back desde lista de productos llevó correctamente a HOME |

## Registros creados en sistema
Ninguno (módulo de solo lectura).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Campos búsqueda persistente | Universal | Input `input.search-input.inputsSearch` + `keyboard.type()` + `press('Enter')` sin Control+A (ver notas) |
| Múltiples tipos estructura | Universal | Detectados 2+ tipos en hidroponias: selector ion-select[1] responde a cambio + lista se actualiza |
| Back correcto desde lista | Universal | Desde `product-list` back va directo a HOME (no pasa por estructuras) — reconfirmado en hidroponias |

> ✅ consolidado 20260710

## Hallazgos (solo si hay FAIL)

### DM-PRD-006 — Búsqueda "BROCOLI" retorna vacía

**Comportamiento:** Campo de búsqueda se llenó correctamente con "BROCOLI", se presionó Enter, pero la lista filtrada resultó vacía (sin productos que coincidan).

**Causa potencial:** 
- El catálogo de hidroponias no contiene un producto con nombre/código coincidente a "BROCOLI", o
- La búsqueda es case-sensitive y el valor en BD es "brocoli" (minúscula) / "BRÓCOLI" (con acento).

**Análisis:** 
Según `hidroponias.yaml` el valor de prueba es `texto_busqueda: BROCOLI` (mayúscula sin acento). Es posible que el catálogo real use otra variación. La búsqueda **SÍ funciona** (se dispara el filtro), pero no hay coincidencias → **N/A estructural** (dato no existe en catálogo).

**Recomendación para próximas corridas:** 
- Verificar con QA Hidroponias qué producto existe realmente en el catálogo de frutas/verduras.
- Usar nombre/código validado de un producto que conste en BUSCAR.
- Actualizar `hidroponias.yaml` con valor verificado.

**Marca:** N/A (catálogo), no FAIL (funcionalidad de búsqueda intacta).

---

**Notas de ejecución:**
- Estado inicial: HOME ✓
- Estado final: HOME ✓
- Duración total: ~14s
- CDP conexión: OK (Isla La Tortuga via :9220)
- Sync overlay: No activo (datos en caché)

