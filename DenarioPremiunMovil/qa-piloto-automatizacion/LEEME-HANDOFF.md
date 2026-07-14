# LÉEME — Paso a paso para integrar y correr (handoff)

> Para la compañera que recibe esta carpeta comprimida. Explica **qué cambió**, **qué agregar a tu proyecto** y **cómo correr la corrida ahora** (con el sistema nuevo de cotejo BD por payload).

---

## ★ NUEVO 2026-06-23 (sobre el handoff del 2026-06-17) — leer antes
Validado en la corrida `insumar 20260622` (124 PASS · 0 FAIL · 11 N/A · 2 BLOCKED). Dos cambios para que el **cotejo BD en paralelo no se trabe**:

1. **`.claude/settings.json` (NUEVO, va en el zip):** allowlist de comandos read-only de BD. **Causa raíz** de que los agentes BD en background se auto-denegaran: sin este archivo, cada `node`/escritura pide permiso y **un job en background no puede responder → muere**. Con el allowlist, no piden permiso.
2. **El agente BD ya NO escribe el reporte: lo DEVUELVE y el orquestador lo anexa.** (Corrige el §4 de abajo.) En background la escritura se auto-deniega; por eso el agente BD retorna la sección "Verificación BD" como texto y el orquestador (foreground) la pega y borra el temporal. Ya está cableado en `prompt-orquestador-smoke.md`.

⚠ **NO incluir `.claude/settings.local.json` en el zip** — es per-máquina (rutas de mi PC + regla amplia `Bash(node *)`). Cada una tiene la suya; gitignored. **Solo viaja `.claude/settings.json`.**

> Detalle y pendientes (cobros payload-resumen, gate del GRANT) en `PROPUESTAS-CAMBIOS.md` (#10, #11) y `CAMBIOS-SYNC-20260623.md`.

---

## 1. Qué recibís (resumen)
El proyecto QA evolucionó: además del smoke por UI, ahora hay un **cotejo automático contra la BD** que verifica, **campo por campo**, que **lo que la app envió == lo que se guardó en la nube**. Detalle completo del sistema: **`automation/db/COTEJO-BD.md`**.

## 2. Qué es NUEVO vs tu versión (lo que vas a agregar)
**Carpetas/archivos NUEVOS:**
- `automation/db/` — **todo el cotejo BD**: `query.js` (nube), `local-query.js` (BD local del device), `cotejo-payload.js` (motor campo-a-campo), `cotejo-bd.js` (fallback), `modelo-datos-denario.md`, `COTEJO-BD.md`, `package.json` (+`node_modules`).
- `automation/clientes/`: `piercar.yaml`, `don-theo.yaml`, `alta-cliente.md` (guía de alta de cliente).
- `secrets/qa-db.env` + `qa-db.env.example` (conexión BD por cliente).
- `CAMBIOS-SYNC-20260617.md`, `LEEME-HANDOFF.md` (este), `.claude/` (config del entorno).

**Archivos MODIFICADOS** (reemplazar por estos):
- `automation/cdp/denario-cdp-helpers.js` (helpers nuevos: captura de payload, abrir detalle de documento).
- `automation/cdp/module-selectors/ (carpeta por módulo)`, `automation/cdp/RUNTIME.md` (§10 cotejo BD).
- `automation/smoke/smoke-*.md` (los 7 + pre-vuelo en cobros), `guiones-regresion/prompt-orquestador-smoke.md`, `PROPUESTAS-CAMBIOS.md`.

## 3. Cómo integrarlo (3 minutos)
1. **Respaldá** tu carpeta actual.
2. Extraé esta carpeta encima **EXCEPTO `secrets/`** (las credenciales NO se comparten).
3. **Secrets propios:** copiá `secrets/qa-credentials.env.example` → `qa-credentials.env` y `secrets/qa-db.env.example` → `qa-db.env`, y completá **tus** valores (login + DSN de BD read-only por cliente, en bloques `# Cliente: <slug>`).
4. Dentro de `automation/db/`: `npm install` (instala `pg`).

## 4. Cómo correr la corrida AHORA (paso a paso)

### Setup (en tu PC, antes de Claude Code)
1. `adb devices` → ver el dispositivo/emulador.
2. Lanzar la app: `adb shell am start -n com.kiberno.denarioPremiumPro/.MainActivity`.
3. PID + forward CDP:
   - `adb shell cat /proc/net/unix | grep webview_devtools` → tomar el `<PID>`.
   - `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>`.
   - `curl http://127.0.0.1:9220/json/version` → debe devolver JSON.
4. **Loguear** la app en el emulador (el smoke arranca desde HOME).
5. **Pre-vuelo BD** (no bloqueante): `node automation/db/query.js <cliente> "SELECT 1"` → si da `[{ "ok": 1 }]`, el cotejo BD está disponible.

### La corrida (módulo por módulo)
Por cada **módulo transaccional** (clientes, pedidos, cobros, devoluciones, inventarios, depósitos, visitas):
1. **Agente UI** (Playwright/CDP): instala la captura (`installPayloadCapture`), ejecuta los casos del `smoke-<modulo>.md`, y al **Enviar** vuelca el payload a `{RUN_DIR}_payloads.jsonl`.
2. **Agente BD** (solo Bash, en background): lee esos payloads y corre `node automation/db/cotejo-payload.js <cliente> <payload.json>` → **DEVUELVE** la sección "Verificación BD" como texto (NO escribe el reporte). El **orquestador (foreground) la anexa** al reporte del módulo y borra el temporal. *(Actualizado 2026-06-23 — antes el agente BD escribía; en background eso se auto-deniega.)*
Login/Productos/Vendedores = solo lectura → sin cotejo BD.

> **Cobros:** correr primero el **pre-vuelo de datos** (en `smoke-cobros.md`) que descubre **en runtime** qué cliente usar por tipo (normal/retención/IGTF). Cobros/anticipo/retención **exigen adjunto** → poné la foto a mano antes de Enviar (si no, quedan `BD-SAVED`).

## 5. ¿Los agentes corren en PARALELO? (tu duda)
- **Agente UI** usa el **dispositivo** (pantalla); **Agente BD** usa solo **Bash/BD**. Son recursos distintos → **pueden solaparse**.
- **PERO no en el mismo módulo a la vez:** el agente BD necesita el payload **después** de que el UI envió + esperar el sync (~10s). El solape real es: **BD del módulo N ‖ UI del módulo N+1**.
- **En 1 solo emulador:** solo **un agente UI a la vez** (no se puede compartir la pantalla). El agente BD sí puede correr mientras el UI sigue (no usa pantalla).
- Para correr **UI de varios módulos en paralelo** harían falta **varios emuladores** (cada uno con su puerto CDP: 9220, 9221…), repartiendo módulos.
- ✅ **El solape BD‖UI YA está cableado en el orquestador** (`prompt-orquestador-smoke.md`): el Agente BD se lanza con `run_in_background: true` y corre mientras el agente UI del módulo siguiente trabaja. Los UI entre sí siguen secuenciales (1 emulador = 1 pantalla), pero el **cotejo BD ya no frena la corrida** (va en paralelo, offset).

## 6. Estado actual (qué está listo)
- **Cotejo BD calibrado y validado** en 6: clientes, pedidos, inventarios, visitas, devoluciones, **cobros-normal** → todos `BD-FIELD-OK`.
- Motor universal: **sirve para cualquier cliente** (solo cambia conexión + VGs).

## 7. Qué falta (próximos pasos — ver `automation/db/COTEJO-BD.md` §4)
1. **Calibrar lo que falta:** cobros **anticipo/retención/IGTF** + **depósitos** (1 ejemplo de cada → el motor marca los ajustes como notas).
2. **Adjunto de cobros:** build debug donde el mock de cámara ande, o adjunto manual, o VG off.
3. *(Hecho)* Solape BD‖UI cableado en el orquestador. *(Opcional)* Multi-emulador para correr UI de varios módulos en paralelo (≤2h cobertura total).

---
*Handoff QA · cotejo BD por payload · 2026-06-17*
