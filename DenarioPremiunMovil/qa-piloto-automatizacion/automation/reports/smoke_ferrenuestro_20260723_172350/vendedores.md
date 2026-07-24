# Smoke Test — Módulo VENDEDORES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260723_172350_smoke-completo` |
| Módulo | Vendedores |
| Dispositivo | (CDP :9220, no expuesto ADB_SERIAL a este agente) |
| App | `com.kiberno.denarioPremiumPro` — La Tortuga v6.6.18 |
| Playa | Isla Coche (ferrenuestro) |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click tile "Vendedores" en Home (`app-home a.ion-text-center` con `p.nombreModulos`) → overlay desaparece, `app-vendedores` visible con heading `<h1>Vendedor</h1>` y acordeón "FERRENUESTRO MAYOR," (coma final, 1 sola empresa) |
| DM-VND-002 | ✅ PASS | Expandir vía `grp.value = acc.value` + `ionChange` en `ion-accordion-group`: altura de `[slot="content"]` 0 → 393.4px. KPIs POBLADOS: Días Hábiles 23 / Transcurridos 18 / Restantes 5 · Cartera Clientes 186 · Activados 50 · Nuevos 4 · Nuevos Activados 2 · Venta Real Mes 35.253,86 $ (Cuota Mes 0 $). Contraer (`grp.value = undefined`) → altura vuelve a 0. PASS pleno, no N/A (confirma nota `[ferrenuestro-2026-07-07]`) |
| DM-VND-007 | ✅ PASS | `h.clickBack` (`img.fechaAtras` visible → `closest('a')` → click) → `app-home` con 12 tiles de módulo visibles, `url()=http://localhost/home` |

## Registros creados en sistema
ninguno (módulo de solo lectura)

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ferrenuestro: KPIs de vendedor evolucionan entre corridas (dato, no bug) | cliente | Esta corrida (20260723): Cartera Clientes 186 / Activados 50 / Nuevos 4 / Nuevos Activados 2 / Venta Real Mes 35.253,86 $ / Días Transcurridos 18/Restantes 5, vs. `[ferrenuestro-2026-07-07]`: Cartera 178 / Activados 13 / Nuevos 1 / Venta Real Mes 7.610,09 $ / Días Transcurridos 6/Restantes 17. Confirma que "KPIs poblados → DM-VND-002 PASS pleno" es estable pese a que los valores cambian (mismo patrón ya documentado en insumar entre `[ins-2610]`/`[ins-2622]`). No requiere cambio de selector. |
| `window.ng=TRUE` en ferrenuestro (Isla Coche v6.6.18) esta corrida | cliente | Confirmado en el mismo módulo/sesión: `!!window.ng === true`. Coincide con el hallazgo ya reportado en `productos.md` de esta misma corrida (diverge de la nota histórica `window.ng=false` de `[ferrenuestro-2026-07-07]` — no fue necesario para vendedores porque la técnica `grp.value=acc.value` es pura-DOM, pero deja constancia para consolidación). |

> ✅ consolidado 20260723

## Hallazgos (solo si hay FAIL)
Ninguno — 0 FAIL en este módulo.

## Baseline
- Tool-uses aprox: ~22 (5 Read obligatorias + 1 ToolSearch + 1 Bash + 1 Read credenciales + 2 Grep + 1 Read helper + 4 `browser_run_code_unsafe` + lecturas de contexto de carpeta de reporte)
- Duración aprox: ~6 min (módulo de solo lectura, 3 casos, sin BLOCKED, sin reintentos — techo de 2 intentos no se activó)
