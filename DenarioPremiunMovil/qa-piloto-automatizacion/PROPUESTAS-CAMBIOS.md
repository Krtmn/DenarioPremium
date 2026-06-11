# Propuestas de cambios — QA Denario (estructura y memoria)

> **Para qué sirve:** registrar **antes** de aplicarlos los cambios a la *estructura* (RUNTIME, helpers, smoke, guiones, prompts, schema, CLAUDE) o a la *memoria* (module-selectors, YAMLs de cliente). Así ambos equipos ven, discuten y aprueban los cambios, y la rama compartida no diverge. Ver gobernanza en `MANUAL-CORRIDAS.md` §6.
>
> **Reportes de corrida NO van aquí** — esos son libres (carpetas únicas).

## Cómo usarlo
1. Antes de aplicar un cambio a estructura/memoria, agrega una fila en "Pendientes" con: fecha · quién · archivo(s) · qué · por qué.
2. Avísale al otro equipo (mensaje/llamada).
3. Cuando se aprueba e integra en la rama canónica, muévelo a "Aplicados" con la fecha de integración.

---

## Pendientes (propuestos, sin aprobar)

| Fecha | Quién | Archivo(s) | Cambio propuesto | Por qué |
|-------|-------|-----------|------------------|---------|
| | | | | |

---

## Aplicados (aprobados e integrados)

| Fecha integración | Quién propuso | Archivo(s) | Cambio | Notas |
|-------------------|---------------|-----------|--------|-------|
| 2026-06-11 | equipo | RUNTIME.md, prompt-orquestador-smoke.md, denario-cdp-helpers.js | Ruta del helper ahora **relativa** (`automation/cdp/denario-cdp-helpers.js`) en vez de absoluta → portable | Misma convención que RUNTIME/smoke (ya funcionaba). Sin impacto en tokens/tiempo. Docs de dev/build conservan rutas de ejemplo (ilustrativas) |
