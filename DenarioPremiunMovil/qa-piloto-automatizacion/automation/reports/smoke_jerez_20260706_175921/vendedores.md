# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_175921_smoke-completo` |
| Módulo | VENDEDORES (solo lectura — BD-N/A) |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — label "Versión 1.0" (build El Yaque refactor, `window.ng=false`) |
| Playa | jerez — empresa default INV JEREZ MOTORS VALERA (idEnterprise 1) |
| Resultado | 2 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click tile Vendedores → `app-vendedores` visible, `<h1>Vendedor</h1>`, 3 acordeones empresa (INV JEREZ MOTORS VALERA / CARACAS / TURMEREMO), overlay ausente. |
| DM-VND-002 | 🚫 N/A | Expandir/contraer OK en los 3 acordeones (`grp.value=acc.value`+ionChange → `accordion-expanded` h=20 → `accordion-collapsed` h=0), pero **KPIs vacíos** en las 3 empresas (ion-grid presente, sin texto/métricas). API sin métricas → N/A estructural (contenido vacío no es FAIL; coincide con globalmp/don-theo). |
| DM-VND-007 | ✅ PASS | `clickBack` (img.fechaAtras→`<a>`) → HOME principal (`app-home`, /home, 12 módulos). |

## Registros creados en sistema
Ninguno — módulo de solo lectura.

## Verificación BD
BD-N/A — módulo de solo lectura (vendedores autogenerado en la app, `infoVendedores=false`).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Encabezados de acordeón empresa jerez ahora DISTINTOS por ciudad | cliente | Antes `[jerez-2026-06-22]` los 3 mostraban idéntico "INVERSIONES JEREZ MO..."; ahora rótulos distintos "INV JEREZ MOTORS **VALERA** / **CARACAS** / **TURMEREMO**" (idEnterprise 1/2/3). Misma evolución que el select idEnterprise en Clientes `[jerez-2026-07-01]`. |
| jerez: 3 empresas, KPIs vacíos → DM-VND-002 N/A estructural | cliente | Los 3 acordeones expanden pero API no puebla KPIs (content height 20, sin texto). Alinea con globalmp/don-theo (KPIs vacíos); contrasta con insumar/piercar (poblados). |
| `esVendedor=true` reconfirmado en jerez | cliente | Heading `<h1>Vendedor</h1>` presente; VG del YAML verificada 1:1 contra UI. |
| Técnica expand `grp.value=acc.value`+ionChange sigue vigente en build refactorizado El Yaque | universal | `mouse.click` en header NO expande (build actual); asignar value al `ion-accordion-group` + ionChange SÍ. `window.ng=false` no afecta (skill pura-DOM). Oráculo de expansión por `getBoundingClientRect().height`. |

> ✅ consolidado 2026-07-06

## Hallazgos (solo si hay FAIL)
Ninguno — sin FAIL.
