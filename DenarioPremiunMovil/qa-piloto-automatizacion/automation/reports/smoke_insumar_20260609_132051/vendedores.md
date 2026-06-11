# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | VENDEDORES |
| Cliente | insumar |
| Conexión | CDP `http://127.0.0.1:9220` |
| App | `com.kiberno.denarioPremiumPro` |
| Tipo | Solo lectura (no crea/modifica datos) |
| Perfil | `aplica=true` · `esVendedor=true` · `enterpriseEnabled=true` |
| Resultado | **3 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click tile Vendedores desde Home → `/vendedores`; `app-vendedores` visible; heading `<h1>Vendedor</h1>` (singular → esVendedor=true); 1 acordeón empresa `INSUMAR DISTRIBUIDOR` (enterpriseEnabled=true); sin overlay residual |
| DM-VND-002 | ✅ PASS | Acordeón expande (contentVisible=true, group.value=`ion-accordion-43`) mostrando KPIs reales; click nuevamente → contraído (contentVisible=false, value limpio). API devolvió datos → PASS, no N/A |
| DM-VND-007 | ✅ PASS | `clickBack` → `/home` con grid de 11 módulos (incl. Vendedores); `app-vendedores` ya no visible; app queda en HOME |

## KPIs observados (DM-VND-002 · INSUMAR DISTRIBUIDOR)

| KPI | Valor |
|-----|-------|
| Días Hábiles | 22 |
| Días Transcurridos | 7 |
| Días Restantes | 15 |
| Cartera Clientes | 163 |
| Clientes Activados | 4 |
| Clientes Nuevos | 0 |
| Clientes Nuevos Activados | 0 |

## Registros creados en sistema

Ninguno — módulo de solo lectura.

## Hallazgos

Ninguno. Módulo VENDEDORES sin defectos en esta corrida. Comportamiento coherente con perfil insumar:
heading singular "Vendedor", acordeón propio "INSUMAR DISTRIBUIDOR" con KPIs poblados desde API,
toggle expand/contrae correcto y back navega a HOME.

## Notas técnicas

- `require()` no disponible en `browser_run_code_unsafe` → helpers (`connectCdp`, `waitSyncOverlay`, `clickBack`) inlineados verbatim per RUNTIME §1 Opción C.
- Estado final: HOME (`/home`).
