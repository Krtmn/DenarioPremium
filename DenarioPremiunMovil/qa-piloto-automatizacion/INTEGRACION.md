# Integración de cambios a TU proyecto (sin perder tus clientes)

> Para la compañera que **ya tiene su proyecto con sus clientes/YAMLs corridos**. No reemplaces todo a ciegas: hay que **traer lo nuevo + actualizar el framework, pero CONSERVAR tus clientes, tus secrets y tus reportes**.

---

## Regla de oro
| Tipo | Qué hacer |
|---|---|
| **Tus clientes** (`automation/clientes/<tus>.yaml`) | **CONSERVAR los tuyos** (no pisar). Podés además sumar los nuevos (piercar/don-theo) si querés. |
| **Tus secrets** (`secrets/qa-credentials.env`, `qa-db.env`) | **CONSERVAR** (compartimos credenciales). |
| **Tus reportes** (`automation/reports/`) | **CONSERVAR** (tu historial). |
| **Framework** (helpers, RUNTIME, smoke, selectores, orquestador) | **REEMPLAZAR** por los nuevos. |
| **Archivos nuevos** (cotejo BD, docs) | **COPIAR** (no existen en tu versión). |

---

## A) COPIAR (nuevos — no chocan con nada)
- `automation/db/` ← **carpeta completa** (el cotejo BD: `cotejo-payload.js`, `query.js`, `local-query.js`, `modelo-datos-denario.md`, `COTEJO-BD.md`, `package.json`). Después: `npm install` dentro.
- `automation/clientes/alta-cliente.md` (guía de alta de cliente).
- `automation/clientes/piercar.yaml`, `don-theo.yaml` (clientes nuevos — opcionales, sumalos si te sirven).
- `secrets/qa-db.env.example` (plantilla de conexión BD).
- Docs raíz: `LEEME-HANDOFF.md`, `COTEJO-BD.md` (en automation/db), `CAMBIOS-SYNC-20260617.md`, `INTEGRACION.md` (este).

## B) REEMPLAZAR (framework — tomá la versión nueva)
- `automation/cdp/denario-cdp-helpers.js` ← trae helpers nuevos (captura de payload, abrir detalle de documento).
- `automation/cdp/RUNTIME.md` ← §10 cotejo BD.
- `automation/cdp/module-selectors/ (carpeta por módulo)` ← selectores/patrones nuevos.
- `automation/smoke/smoke-clientes.md · -pedidos · -cobros · -devoluciones · -inventarios · -depositos · -visitas`.
- `guiones-regresion/prompt-orquestador-smoke.md` ← cableado del cotejo BD + paralelo.
- `PROPUESTAS-CAMBIOS.md`.

> ⚠ **Si vos modificaste a mano alguno de estos framework** (ej. agregaste patrones tuyos en `module-selectors/ (carpeta por módulo)` o notas en un `smoke-*.md`), **NO reemplaces ciego**: hacé **merge** (conservá tus notas + sumá los cambios nuevos). Si nunca los tocaste, reemplazá directo.

## C) CONSERVAR (NO pisar)
- `automation/clientes/<tus-clientes>.yaml`
- `secrets/` (credenciales compartidas)
- `automation/reports/` (tu historial de corridas)

---

## Forma fácil y segura: que lo haga Claude Code
Extraé el ZIP que te paso en una carpeta aparte (ej. `qa-nuevo/`), abrí **TU** proyecto en Claude Code y pegá:

```
Tengo dos carpetas: ESTE proyecto (el mío, con mis clientes/YAMLs) y la carpeta nueva en <ruta a qa-nuevo>.
Integrá los cambios de la carpeta nueva a este proyecto siguiendo INTEGRACION.md:
- COPIÁ los archivos/carpetas nuevos (automation/db/, docs, alta-cliente.md, clientes nuevos, qa-db.env.example).
- REEMPLAZÁ los de framework (denario-cdp-helpers.js, RUNTIME.md, module-selectors/ (carpeta por módulo), smoke-*.md, prompt-orquestador-smoke.md, PROPUESTAS-CAMBIOS.md).
- NO toques mis automation/clientes/*.yaml propios, mi secrets/ ni mi automation/reports/.
Antes de aplicar, mostrame la lista de qué vas a copiar/reemplazar/omitir para confirmar.
```

Claude te muestra el plan, confirmás, y lo aplica sin tocar tus clientes.

---

## Después de integrar (verificación rápida)
1. `npm install` dentro de `automation/db/`.
2. Probar que el motor carga: `node automation/db/cotejo-payload.js` (debe pedir argumentos, no error de sintaxis).
3. Tu cliente en `secrets/qa-db.env` (bloque `# Cliente: <slug>`) para que el cotejo BD funcione (si no, sale `BD-N/A`, no rompe).
4. Para correr: ver `LEEME-HANDOFF.md` §4.

---
*Integración QA · cotejo BD por payload · 2026-06*
