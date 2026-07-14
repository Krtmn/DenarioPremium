# Smoke Test — Módulo VENDEDORES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | Vendedores |
| Dispositivo | (CDP :9220, sin ADB_SERIAL explícito en este agente) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | La Tortuga (window.ng=TRUE, servidor LATINOCOSMETICA) |
| Resultado | 2 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED |

## ¿Aplica el módulo?
**SÍ.** El tile "Vendedores" está presente en HOME (10 tiles totales: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar) y navega a `app-vendedores` con heading `<h1>Vendedor</h1>` — confirma `esVendedor=true` para el usuario QA 001. Actualiza el YAML del cliente (`vendedores.aplica: TBD` → `true`).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click tile "Vendedores" desde HOME (`app-home a.ion-text-center` con `p.nombreModulos`="Vendedores") → overlay desaparece, `app-vendedores` visible con heading "Vendedor" y 1 `ion-accordion` (1 empresa: "LATINOCOSMETICA C.A.") |
| DM-VND-002 | 🚫 N/A | Expansión con técnica `grp.value = acc.value` + `ionChange` en `ion-accordion-group`: mecánica funciona correctamente (`contentHeight` 0→20px, clase `accordion-collapsed`→`accordion-expanded`); contracción también correcta (`grp.value = undefined`, 20→0px). Pero el `ion-grid` dentro de `[slot="content"]` renderiza **vacío** (solo `ng-container` placeholders, sin KPIs de texto) — API no devuelve métricas para este vendedor/empresa en esta sesión. Contenido vacío no es FAIL (RUNTIME §4) |
| DM-VND-007 | ✅ PASS | `img.fechaAtras` visible → `closest('a')` → click → `app-vendedores` desaparece, `app-home` visible, `url=http://localhost/home` |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — ninguno | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 1 empresa "LATINOCOSMETICA C.A.", KPIs vacíos | cliente (latino_cosmetica) | Igual patrón que globalmp/don-theo/jerez (KPIs vacíos) — contrasta con insumar/piercar/ferrenuestro/dm-electronica (KPIs poblados). Técnica de expansión `grp.value=acc.value`+ionChange (ya documentada en `module-selectors/vendedores.md`) confirmada vigente en este build La Tortuga v6.6.18, `window.ng=TRUE` |
| `esVendedor=true` confirmado (usuario 001) | cliente (latino_cosmetica) | Extiende la lista de clientes confirmados en `module-selectors/vendedores.md` (globalmp, romher, insumar, don-theo, piercar, ferrenuestro, dm-electronica, jerez) |

*(sin patrones nuevos de nivel universal — todo ya cubierto por `module-selectors/vendedores.md` existente)*

> ✅ consolidado 20260714
