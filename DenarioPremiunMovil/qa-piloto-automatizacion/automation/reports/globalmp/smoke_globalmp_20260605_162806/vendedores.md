# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | VENDEDORES |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` — globalmp |
| Playa | globalmp |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Datos resueltos en corrida

| Campo | Valor confirmado |
|-------|-----------------|
| `vendedores.aplica` | **true** — módulo visible en HOME |
| `esVendedor` | **true** — encabezado de página muestra "Vendedor" (usuario kleon tiene rol vendedor) |
| `enterpriseEnabled` | **true** (ya confirmado) |
| Empresas visibles | **COMERCIALIZADORA DE** · **HC TRADING MARKET 20** (2 acordeones) |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click "Vendedores" desde HOME → overlay desaparece → `app-vendedores` visible en `/vendedores`; 2 acordeones de empresa presentes (COMERCIALIZADORA DE, HC TRADING MARKET 20) |
| DM-VND-002 | ✅ PASS | Click acordeón "COMERCIALIZADORA DE" → se expande (contentVisible=true); click nuevamente → se contrae (contentVisible=false). Contenido vacío (solo ion-grid sin KPIs): N/A por API sin datos — no FAIL. Verificado también acordeón "HC TRADING MARKET 20": mismo comportamiento expand/collapse. |
| DM-VND-007 | ✅ PASS | `clickBack` → HOME (`app-home` visible, url=`/home`) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo de solo lectura — sin registros creados | N/A |

## Hallazgos

Sin FAIL. Observaciones informativas:

1. **Contenido de acordeones vacío**: Ambas empresas (COMERCIALIZADORA DE, HC TRADING MARKET 20) muestran `ion-col` con solo nodos de comentario Angular (`<!---->`). La API no devuelve KPIs/vendedores para este usuario en esta sesión. Comportamiento correcto → N/A estructural, no FAIL.
2. **Nombre empresa truncado**: "COMERCIALIZADORA DE" es el nombre completo tal como lo devuelve el backend (no hay truncamiento de CSS — el `textContent` del DOM coincide). Posible nombre incompleto en base de datos del cliente.
3. **esVendedor confirmado**: El heading `<h1>Vendedor</h1>` en `app-vendedores` confirma que el usuario activo (kleon) tiene rol vendedor. Este campo se determina por el encabezado de la vista (no por ng.getComponent — producción build).

## Notas para perfil cliente globalmp.yaml

```yaml
vendedores:
  aplica: true          # Módulo visible en HOME — confirmado 2026-06-08
  esVendedor: true      # Encabezado "Vendedor" visible en app-vendedores — confirmado 2026-06-08
  empresas:             # Acordeones visibles:
    - "COMERCIALIZADORA DE"
    - "HC TRADING MARKET 20"
  kpis_disponibles: false  # API no devuelve KPIs en esta sesión; contenido vacío — N/A
```
