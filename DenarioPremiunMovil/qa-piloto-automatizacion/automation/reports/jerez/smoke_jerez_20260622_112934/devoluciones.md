# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Resultado | 0 PASS · 0 FAIL · 0 SKIP · 14 N/A |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | 🚫 N/A | `validateReturn=true` exige seleccionar factura para crear una devolución; ningún cliente de jerez tiene facturas **sincronizadas devolvibles** (dentro de `mesesFacturas=3`) en esta corrida. |
| DM-DEV-002 | 🚫 N/A | Idem — sin factura sincronizada no se puede iniciar la devolución. |
| DM-DEV-004 | 🚫 N/A | Idem. |
| DM-DEV-006 | 🚫 N/A | Idem. |
| DM-DEV-011 | 🚫 N/A | Caso de selección de factura — no hay facturas devolvibles que seleccionar. |
| DM-DEV-013 | 🚫 N/A | Idem. |
| DM-DEV-014 | 🚫 N/A | Idem. |
| DM-DEV-015 | 🚫 N/A | Idem. |
| DM-DEV-016 | 🚫 N/A | Idem. |
| DM-DEV-018 | 🚫 N/A | Idem. |
| DM-DEV-019 | 🚫 N/A | Idem. |
| DM-DEV-021 | 🚫 N/A | Idem. |
| DM-DEV-022 | 🚫 N/A | Idem. |
| DM-DEV-024 | 🚫 N/A | Idem. |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno | — |

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Sin facturas devolvibles en cartera jerez | cliente | `validateReturn=true` + ningún cliente con factura sincronizada dentro de `mesesFacturas=3` ⇒ módulo Devoluciones N/A en jerez (1ª corrida). Reintentar cuando existan facturas sincronizadas (p.ej. emisión real en empresa 2). |

> ✅ consolidado 2026-06-22

## Hallazgos

- **Bloqueo estructural (no FAIL):** la responsable QA confirmó en corrida que jerez no tiene clientes con facturas sincronizadas a las que aplicar una devolución. Con `validateReturn=true` la app exige seleccionar una factura para iniciar el flujo, por lo que los 14 casos quedan **N/A** (no es defecto de producto: es ausencia de datos de prueba). Decisión de la QA: tomar nota y continuar con el siguiente módulo sin invertir más tiempo.
- VGs no verificables esta corrida por falta de facturas: `multiInvoices=true`, `requeridedNroFactura=true`, `signatureReturn=true`. Verificar en una corrida futura con facturas sincronizadas.

---
*Generado por Claude Code · Orquestador Smoke · 2026-06-22*
