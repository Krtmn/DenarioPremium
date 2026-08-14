# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260707_175334_smoke-completo` |
| Módulo | VENDEDORES (solo lectura) |
| Dispositivo | Android real vía CDP `:9220` |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 (versión no expuesta en HOME) |
| Cliente | ferrenuestro |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## VGs confirmadas en runtime
- `aplica=TRUE` — tile "Vendedores" presente en HOME; `app-vendedores` renderiza.
- `esVendedor=true` — heading `<h1>Vendedor</h1>` confirmado.
- `enterpriseEnabled=true` — 1 sola empresa → 1 acordeón: **"FERRENUESTRO MAYOR,"**.
- `infoVendedores=FALSE` (autogenerado por Denario) — **KPIs SÍ poblados** (alinea con insumar/piercar; contrasta con globalmp/don-theo/jerez que vienen vacíos).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click tile Vendedores → `/vendedores`, `app-vendedores` visible, overlay se limpia, `<h1>Vendedor</h1>`, 1 acordeón "FERRENUESTRO MAYOR," (collapsed). |
| DM-VND-002 | ✅ PASS (pleno) | Expandir vía `grp.value=acc.value`+ionChange → `accordion-expanded`, content height 393px. **KPIs poblados**: Cartera Clientes 178 · Clientes Activados 13 · Clientes Nuevos 1 · Clientes Nuevos Activados 1 · Días Hábiles 23 / Transcurridos 6 / Restantes 17 · Plan por Dólares: Cuota Mes 0 $, Venta Real Mes 7610.09 $. Contraer (`grp.value=undefined`) → `accordion-collapsed`, height 0. |
| DM-VND-007 | ✅ PASS | `clickBack` (img.fechaAtras → closest('a')) → `/home`, `app-home` visible, 10 tiles. Estado final = HOME. |

## Registros creados en sistema
Ninguno (módulo de solo lectura).

## Verificación BD
BD-N/A — módulo de solo lectura, sin transacciones (RUNTIME §10).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ferrenuestro: 1 empresa "FERRENUESTRO MAYOR," con KPIs POBLADOS | cliente | `infoVendedores=false` autogenerado; DM-VND-002 PASS pleno (no N/A). Cartera 178 · Activados 13 · Nuevos 1 · Nuevos Activados 1 · Días 23/6/17 · Venta Real Mes 7610.09 $. Alinea con insumar/piercar. |

> ✅ consolidado 2026-07-07 → KPIs-poblados en `module-selectors/vendedores.md` Notas por cliente; `vendedores.kpis_poblados=true` en `ferrenuestro.yaml modules.vendedores`.

Notas técnicas confirmadas (ya en `module-selectors/vendedores.md`, sin cambio):
- Expansión por `grp.value=acc.value`+ionChange sigue vigente; oráculo por `getBoundingClientRect().height` (0 colapsado / >0 expandido).
- Acordeón sin `value` propio: Ionic asignó `ion-accordion-74` en runtime → leído dinámico.
