# Smoke Test — Módulo VENDEDORES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | VENDEDORES |
| Cliente | hidroponias |
| App | `com.kiberno.denarioPremiumPro` — v6.6.18 |
| Isla | La Tortuga |
| Resultado | 3 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-VND-001 | ✅ PASS | Click módulo Vendedores desde Home; app-vendedores visible; overlay desaparecido (1.8s) |
| DM-VND-002 | ✅ PASS | Acordeón empresa expandido; técnica `grp.value = acc.value` + ionChange vigente; contenido accesible (0.7s) |
| DM-VND-007 | ✅ PASS | Click back con `img.fechaAtras`; HOME visible tras navegación (1.4s) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo solo-lectura — sin creaciones | — |

## Patrones / selectores nuevos

ninguno

> ✅ consolidado 20260710

## Notas ejecutivas

- **Módulo aplicable:** `modules.vendedores.aplica: true` confirmado en perfil hidroponias
- **VG activa:** `esVendedor: true` confirmado (heading `<h1>Vendedor</h1>` visible)
- **Acordeones:** hidroponias tiene 1 empresa única; expandión con técnica `grp.value = acc.value` + ionChange funciona (sin mouse.click en header)
- **KPIs:** contenedor `ion-grid` presente; contenido puede estar vacío (API no puebla en esta sesión — N/A estructural en algunos clientes, pero en hidroponias depende del servidor)
- **Estado final:** HOME confirmado tras back; navegación íntegra

### Referencia de corrida anterior

- Última corrida VENDEDORES (hidroponias): RUN_ID `20260529_145657_smoke-completo` — 2 PASS en DM-VND-001/002; DM-VND-007 ejecutado en modelos de corrida posteriores
- Tags de validación: `[hid-2605]` (corrida baseline hidroponias 20260529)
- Build: v6.6.18 La Tortuga (migración confirmada 2026-07-10 vs v6.6.14 en corrida anterior)

---

*Generado 2026-07-10 · Agente QA VENDEDORES · Fase 4 (automatización CDP completa)*
