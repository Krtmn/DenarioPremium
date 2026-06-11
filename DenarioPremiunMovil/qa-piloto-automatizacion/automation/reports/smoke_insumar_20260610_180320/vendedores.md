# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | CDP `127.0.0.1:9220` (WebView) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa / Cliente | insumar |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A |

Módulo de solo lectura — no crea ni modifica datos.
VGs confirmadas: `esVendedor=true` (heading "Vendedor" singular) · `enterpriseEnabled=true` (acordeón "INSUMAR DISTRIBUIDOR" visible).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click módulo Vendedores (Home, coords 74,428) → `app-vendedores` en `/vendedores`; overlay sync desaparecido; `<h1>Vendedor</h1>`; 1 acordeón "INSUMAR DISTRIBUIDOR" con KPIs visibles |
| DM-VND-002 | ✅ PASS | Acordeón inicia `accordion-collapsed` (content height=0). Click header (180,101) → `accordion-expanded`, height=281, KPIs reales: Cartera Clientes 163, Clientes Activados 4, Clientes Nuevos 0, Días Hábiles 22 / Transcurridos 8 / Restantes 14. Segundo click → `accordion-collapsed`, height=0. Toggle bidireccional OK |
| DM-VND-007 | ✅ PASS | `clickBack` (img.fechaAtras → closest('a')) → `app-home` en `/home` con módulos visibles (Vendedores + Cobros/Clientes/Pedidos) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ninguno (módulo de solo lectura) | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Acordeón empresa estado: `ion-accordion.accordion-collapsed` ↔ `.accordion-expanded`; content en `[slot="content"]`, oráculo de expansión por `getBoundingClientRect().height` (0 colapsado, >0 expandido) | universal | Confirma toggle sin depender de `offsetParent`; click en header coords (~180,101). `[ins-2606]` |
| KPIs insumar VENDEDORES (sí pobla, no vacío): Cartera Clientes 163, Clientes Activados 4, Clientes Nuevos 0, Días Hábiles 22 / Transcurridos 8 / Restantes 14 | cliente | A diferencia de globalmp (KPIs vacíos → N/A), insumar SÍ devuelve datos de KPIs → DM-VND-002 PASS pleno, no N/A estructural. `[ins-2606]` |
| 1 sola empresa en acordeón ("INSUMAR DISTRIBUIDOR") | cliente | globalmp tenía 2 empresas; insumar 1 → `enterpriseEnabled=true` con acordeón único. `[ins-2606]` |

> ✅ consolidado 2026-06-10

## Hallazgos (solo si hay FAIL)
Ninguno.
