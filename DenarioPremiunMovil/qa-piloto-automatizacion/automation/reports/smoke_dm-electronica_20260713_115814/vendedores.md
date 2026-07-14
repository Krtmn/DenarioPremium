# Smoke Test — Módulo VENDEDORES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260713_115814_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | CDP `127.0.0.1:9220` (`com.kiberno.denarioPremiumPro`) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 (El Yaque DM ELECTRONIC) |
| Playa | dm-electronica (BOTZ / DM ELECTRONIC) — usuario 002 |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

Módulo de solo lectura — sin registros creados · SIN Verificación BD (`BD-N/A`).
`vgs.esVendedor=true` confirmado en UI (heading `<h1>Vendedor</h1>`).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Tile "Vendedores" visible en Home (12 módulos); click → `/vendedores`, `app-vendedores` visible, heading "Vendedor", 1 acordeón empresa "BOTZ"; overlay de sync se disipó |
| DM-VND-002 | ✅ PASS | Expandir "BOTZ" vía `grp.value=acc.value`+ionChange: altura 48→441 (`accordion-expanded`), **KPIs POBLADOS**: Cartera Clientes 80 · Clientes Activados 1 · Nuevos 0 · Nuevos Activados 0 · Días Hábiles 23/Transcurridos 9/Restantes 14 · Cuota Mes 0 UNI · Venta Real Mes 2 UNI. Contraer → 48 (`accordion-collapsed`) |
| DM-VND-007 | ✅ PASS | `clickBack` (`img.fechaAtras`→`closest('a')`) → `/home`, `app-home` visible con 12 módulos |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | módulo solo lectura | ninguno |

## Verificación BD
`BD-N/A` — módulo de solo lectura (login/productos/vendedores → BD-N/A por RUNTIME §10).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| dm-electronica: 1 empresa "BOTZ", KPIs POBLADOS | cliente | DM-VND-002 PASS pleno (no N/A): Cartera 80 · Activados 1 · Nuevos 0 · Días 23/9/14 · Venta Real Mes 2 UNI · Cuota Mes 0 UNI. Alinea con insumar/piercar/ferrenuestro (KPIs sí poblan); contrasta con globalmp/don-theo/jerez (vacíos). Acordeón único, `enterpriseEnabled=true`. |
| Técnica de expansión `grp.value=acc.value`+ionChange vigente en build El Yaque v6.6.18 | universal (reconfirma) | Oráculo por `getBoundingClientRect().height` (48 colapsado ↔ 441 expandido); `mouse.click` en header NO expande. `esVendedor=true` (heading "Vendedor"). Tile Home `p.nombreModulos` dentro de `a` clickeable por MouseEvent. |

> ✅ consolidado 20260713 — técnica de expansión reconfirmada (tag); 1 empresa BOTZ con KPIs poblados → nota vendedores.md. aplica=true ya en YAML.

## Hallazgos (solo si hay FAIL)
Ninguno.
