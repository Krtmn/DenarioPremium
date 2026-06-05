# Smoke Test — Módulo VENDEDORES
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | romher |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Perfil cliente (valores resueltos en esta corrida)

| Variable | Valor | Fuente |
|----------|-------|--------|
| `aplica` | **true** | `vendedoresNuevo.svg` visible en HOME + label "Vendedores" |
| `esVendedor` | **true** | ion-title muestra "Vendedor" (singular) en `app-vendedores` |
| `enterpriseEnabled` | **true** | Acordeón empresa "Tradicional OV19 09" visible; multiempresa confirmado |
| Empresa(s) visibles | **Tradicional OV19 09** | Único acordeón en `ion-accordion-group` |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click `vendedoresNuevo.svg` → `app-vendedores` activo; title "Vendedor"; 1 acordeón "Tradicional OV19 09" visible; overlay no permaneció |
| DM-VND-002 | ✅ PASS | Click header ion-accordion → clase `accordion-expanded`; KPIs visibles: Días Hábiles: 22, Días Transcurridos: 4, Días Restantes: 18, Cartera Clientes: 142, Clientes Activados: 2, Clientes Nuevos: 0, Clientes Nuevos Activados: 0; segundo click → `accordion-collapsed` |
| DM-VND-007 | ✅ PASS | `clickBack` → `app-home` activo; 9 módulos visibles en HOME (Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — sin registros | N/A |

## Patrones nuevos registrados

| ID | Descripción |
|----|-------------|
| P-ROM-VND-001 | `vendedores_esvendedor_titulo_singular` — cuando usuario tiene rol vendedor, ion-title muestra "Vendedor" (no "Vendedores"); acordeón empresa con KPIs de gestión de cartera |
| P-ROM-VND-002 | `vendedores_kpi_dias_cartera` — acordeón expone: Días Hábiles, Días Transcurridos, Días Restantes, Cartera Clientes, Clientes Activados, Clientes Nuevos, Clientes Nuevos Activados |

## Actualización pendiente — romher.yaml

```yaml
vgs:
  esVendedor: true          # confirmado 20260604 — ion-title "Vendedor" en app-vendedores
  enterpriseEnabled: true   # confirmado 20260604 — acordeón "Tradicional OV19 09" visible

modules:
  vendedores:
    aplica: true            # confirmado 20260604 — vendedoresNuevo.svg + label visible en HOME
```
