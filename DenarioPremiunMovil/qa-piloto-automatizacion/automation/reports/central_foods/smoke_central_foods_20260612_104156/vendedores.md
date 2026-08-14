# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | VENDEDORES |
| Cliente | central_foods |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | El Yaque (`denarioelyaque.ddns.net`) |
| Resultado | 2 PASS · 0 FAIL · 0 SKIP · 1 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click tile Vendedores → `/vendedores`, `app-vendedores` visible, `<h1>Vendedor</h1>`, 1 acordeón empresa "CENTRAL FOODS C.A.", sin overlay permanente |
| DM-VND-002 | 🚫 N/A | Acordeón expande/contrae OK (`accordion-collapsed`→`accordion-expanded`→`collapsed`), pero `[slot=content]` trae `ion-grid>ion-row>ion-col` vacío (placeholders Angular `<!--->`); API sin KPIs esta sesión → N/A estructural (contenido vacío no es FAIL) |
| DM-VND-007 | ✅ PASS | `h.clickBack` → `/home`, `app-home` visible con módulos (Visitas/Inventarios/Pedidos/Devoluciones/Cobros/Depósitos…), `app-vendedores` no visible |

## Registros creados en sistema
ninguno (módulo de solo lectura).

## Datos descubiertos
- **esVendedor = true** (era `null`/TBD en YAML): encabezado `<h1>Vendedor</h1>` presente en `app-vendedores` → confirma rol vendedor. Misma señal que globalmp/romher/insumar.
- **1 sola empresa** en el módulo: acordeón "CENTRAL FOODS C.A." (única). Similar a insumar (1 empresa); ≠ globalmp (2 empresas).
- KPIs del acordeón **vacíos** esta sesión (API no devolvió datos) — no se pudieron observar métricas (Cartera Clientes/Activados/etc.).

## Discrepancias VG
- `enterpriseEnabled=false` (CSV): consistente con la UI. El módulo VENDEDORES muestra **un acordeón con el nombre de la empresa** ("CENTRAL FOODS C.A.") como agrupador de KPIs, pero **no** hay selector de empresa interactivo — el nombre es solo encabezado del acordeón. No constituye discrepancia (el agrupador por empresa existe en todos los clientes, con o sin `enterpriseEnabled`).
- `infoVendedores=true` (CSV): consistente — módulo presente y gestionado desde admin (solo lectura, sin edición).
- `esVendedor`: el YAML lo tenía `null`/TBD → **se resuelve a true** (ver Datos descubiertos). Actualizar perfil si procede.
- `transportRole=true` / `promoterRole=true` / `rolPlanta=false`: no observables en el módulo VENDEDORES (no exponen UI aquí) — sin discrepancia detectable en esta playa.

## Patrones / selectores nuevos
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Acordeón content vacío = `ion-grid>ion-row>ion-col[size=12]` con comentarios Angular `<!--->` | universal | Confirma el oráculo "vacío = N/A": estructura presente, col sin KPIs. Mismo comportamiento que globalmp. Header del acordeón en coords ~(180,101); expansión por `getBoundingClientRect().height` (0 colapsado, >0 expandido) — confirmado en central_foods |
| `<h1>Vendedor</h1>` en `app-vendedores` | universal | esVendedor=true sin `ng.getComponent`; confirmado ahora en central_foods (4º cliente) |

*(Tag sugerido para consolidación: `[cf-2612]` central_foods 20260612_104156.)*

> ✅ consolidado 2026-06-12
