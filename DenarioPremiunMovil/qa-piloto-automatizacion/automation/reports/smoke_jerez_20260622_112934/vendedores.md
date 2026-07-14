# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | VENDEDORES (solo lectura) |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A |
| aplica=true en UI | ✅ Confirmado — `<h1>Vendedor</h1>` presente en `app-vendedores` (esVendedor=true) |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click módulo Vendedores en Home → navega a `/vendedores`; `app-vendedores` visible, heading `<h1>Vendedor</h1>`, 3 acordeones de empresa, sin overlay permanente |
| DM-VND-002 | ✅ PASS | Acordeón empresa expande (content height 0→281px, `accordion-expanded`) con KPIs reales: Días Hábiles 22 / Transcurridos 16 / Restantes 6 · Cartera Clientes 3 / Activados 2 / Nuevos 0 / Nuevos Activados 0. Contrae de vuelta (281→0, `accordion-collapsed`) |
| DM-VND-007 | ✅ PASS | `h.clickBack(pg)` → HOME (`/home`, `app-home`, 12 módulos); `app-vendedores` ya no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura | ninguno |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Click módulo Vendedores en Home requiere `mouse.click` por coords reales | cliente (jerez) | El `dispatchEvent('click')` sobre el `ion-col` de Home NO disparó el routing (siguió en `/home`); `pg.mouse.click(x,y)` sobre el centro del `ion-col` sí navegó. Selector Home: `ion-col` cuyo `innerText` === "Vendedores". |
| jerez = 3 acordeones de empresa (multi-empresa) | cliente (jerez) | Las 3 con prefijo "INVERSIONES JEREZ MO…". Valores internos `acc.value` = `ion-accordion-3/4/5`. Hasta ahora los clientes mapeados eran mono-empresa (globalmp tenía 2). |
| Oráculo expansión por `[slot="content"]` height + `group.value = acc.value` | universal (reconfirmado) | Reconfirma `[ins-2619]`: expandir con `accordionGroup.value = acc.value`, contraer con `= undefined`; medir `getBoundingClientRect().height` del `[slot="content"]` (0 colapsado, 281 expandido). KPIs en `ion-grid`/`ion-col` dentro del content. |

> ✅ consolidado 2026-06-22

## Hallazgos (solo si hay FAIL)
Sin FAIL.

## Notas
- KPIs poblados por backend esta sesión (DM-VND-002 PASS pleno, no N/A) — contraste con corridas insumar/central_foods donde la API no devolvió datos (N/A estructural). La diferencia es dato de backend, no regresión de UI.
- Estado final: HOME ✅
