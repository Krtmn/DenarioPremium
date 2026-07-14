# Sincronización QA — delta 2026-06-23 (sobre el zip del 2026-06-17)

**Para:** la compañera que ya integró el handoff del 2026-06-17.
**Qué es:** los cambios **nuevos** desde ese zip. Si recibís el zip nuevo y reemplazás encima (excepto `secrets/`), ya los tenés todos — este doc explica el porqué.

> Si NO integraste todavía el zip del 2026-06-17, leé primero `LEEME-HANDOFF.md` (cubre TODO: aquel batch + este). Este delta asume que ya tenés el cotejo BD por payload.

---

## Contexto
Se corrió el smoke completo de **insumar** (`RUN 20260622_115712`): **124 PASS · 0 FAIL · 11 N/A · 2 BLOCKED** de 137 casos, con el oráculo BD operativo por primera vez en ese cliente. El post-mortem dejó 2 cambios aplicados + 2 propuestas.

## Lo nuevo en el zip (2 archivos)

| Archivo | Cambio | Por qué |
|---|---|---|
| **`.claude/settings.json`** (NUEVO) | Allowlist de comandos read-only de BD (`query.js`, `cotejo-payload.js`, `resolve-run-context.js`, `local-query.js`, `aggregate.js`) + lectura `automation/**` + temporal `automation/db/_tmp_*.json` | **Causa raíz** de que los agentes BD en background se auto-denegaran: sin allowlist, cada comando pide permiso y un job background no puede responder → muere. Es read-only sobre BD (candado SELECT-only + `user_read`). |
| **`guiones-regresion/prompt-orquestador-smoke.md`** (MODIFICADO) | El **Agente BD** ahora **DEVUELVE** la sección "Verificación BD" y el **orquestador la anexa** (foreground) + borra el temporal. Antes el agente BD escribía el reporte. | En background la escritura se auto-deniega (igual que los comandos). Devolver + anexar conserva el paralelismo sin intervención manual. |

También se actualizaron `LEEME-HANDOFF.md` (callout ★ NUEVO 2026-06-23) y `PROPUESTAS-CAMBIOS.md` (registro + propuestas #10/#11).

## ⚠ Importante para el zip
- **NO incluir `.claude/settings.local.json`** — es per-máquina (rutas locales + regla amplia `Bash(node *)`). Solo viaja `.claude/settings.json`.
- **NO incluir `secrets/`** — credenciales propias de cada una (usar los `.example`).

## A validar en TU corrida (lo que estamos probando)
1. **El cotejo BD en paralelo ya no se traba:** lanzá un smoke con un cliente que tenga GRANT BD y verificá que los **Agentes BD en background completan** (devuelven su sección) y el orquestador la anexa, **sin intervención manual**.
   - *Nota honesta:* en la corrida 20260622 algunos agentes BD background fallaron por permisos y otros funcionaron (inconsistente). El allowlist debería estabilizarlo, pero **la validación definitiva es esta corrida tuya**. Si alguno todavía se auto-deniega, avisá: hay plan B (cotejo BD inline dentro del agente UI, que funcionó al 100%).
2. **GRANT BD antes de arrancar:** confirmá que tu cliente tiene lectura (`node automation/db/query.js <cliente> "SELECT count(*) FROM \"order\""` debe devolver un número, no `permission denied`). Si da permission denied → falta el GRANT read-only en esa base (lo aplica el DBA, es por-base).

## Pendientes (NO bloquean tu prueba — ver `PROPUESTAS-CAMBIOS.md`)
- **#10** — captura de payload de Cobros viene en formato resumen; se coteja con `query.js` directo (equivalente). Pendiente volcar la estructura anidada completa.
- **#11** — gate del GRANT en el Paso 0 (`182/182 legibles` en vez de `SELECT 1`).

---
*Delta de sincronización QA · post-mortem insumar 20260622 · 2026-06-23*
