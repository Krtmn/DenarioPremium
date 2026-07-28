# Record → Replay determinista (Ola 2 de la propuesta de optimización)

**Objetivo:** bajar las ~3 h ACTIVAS de una corrida agéntica. Esas horas NO son la app ni el
discovery — son **el modelo razonando entre cada acción** (~550 tool-uses/corrida). El único
lever que rompe ese piso es **sacar el modelo del loop por acción**: ejecutar de forma
determinista las operaciones que YA se sabe que funcionan, y llamar al modelo **solo ante divergencia**.

## Por qué RECORD→REPLAY (y no autor-a-ciegas)

El primer piloto (`automation/cdp/scenarios/cobros-scenarios.js`) fue **autorado a mano desde la
documentación** → salió **frágil**: `window.ng` varía por build, los selectores drifean, la
apertura de form falló en insumar. Autor-a-ciegas ≠ lo que corre de verdad en ESE build.

**Record→replay** es robusto porque el guión **sale de una corrida VERDE real** en ese build:
- **RECORD:** la 1ª corrida en un build/cliente corre agéntica (como hoy) PERO **graba** cada
  operación determinista (llamada a helper + args) a `{RUN_DIR}/_trace/{modulo}.trace.json`.
- **REPLAY:** las corridas siguientes del MISMO build/cliente **reproducen** la traza op-por-op
  en pocas `browser_run_code_unsafe`, con oráculo por caso. Ante divergencia (op falla / oráculo
  no cuadra) → **escala ese paso al modelo** (LLM-oráculo de excepción), que lo resuelve y
  **re-graba** ese tramo.

**Economía:** RECORD 1×/build (~el costo actual, ~3 h). REPLAY N× (~minutos + modelo solo en
divergencias). Como QA re-corre los MISMOS clientes, se amortiza rápido. Cuando el build cambia
(ej. ferrenuestro migró Isla Coche→La Tortuga y `window.ng` pasó a true), la traza rompe por
divergencia → se re-graba (una corrida agéntica) y listo.

> ⚠ La traza de ferrenuestro 20260723 NO se pudo retro-extraer: el harness purga los transcripts
> de los subagentes al completar (quedaron en 0 bytes). Por eso record→replay se **instrumenta
> hacia adelante**: la próxima corrida graba; no hay atajo retroactivo.

## Vocabulario de la traza (parametrizable)

La traza es una secuencia de **operaciones tipadas** — de alto nivel (el vocabulario de helpers),
NO coordenadas crudas, para que sea replay-able y parametrizable:

```jsonc
{
  "modulo": "cobros", "cliente": "ferrenuestro", "servidor": "la_tortuga",
  "build": { "window_ng": true },
  "data": { "cliente_test": "TORNICAGUA, C.A.", "documento_retencion": "00037192" },  // valores run-específicos usados
  "ops": [
    { "case": "DM-COB-002" },
    { "op": "helper", "name": "openNuevoCobro", "args": [0] },
    { "op": "assert", "desc": "5 tabs", "code": "() => document.querySelectorAll('app-cobro ion-segment-button').length>=5" },
    { "op": "eval", "code": "() => { /* selección cliente window.ng */ }", "tag": "select-client" },
    { "op": "helper", "name": "fillIonInput", "args": ["app-cobro-general ion-input.inp-write", "Test-COB"] }
  ]
}
```

- **`case`**: marca el inicio de un caso smoke (granularidad de veredicto y de escalación).
- **`helper`**: llamada a `denario-cdp-helpers.js` (`openNuevoCobro`, `fillIonInput`, `clickAlertButton`,
  `openDocumentDetail`, `selectIonPopover`, `clickBack`, `setIonDatetime`…). Es la parte más estable.
- **`eval`**: cuerpo `pg.evaluate` crudo (acciones DOM a medida). Más riesgoso; se graba tal cual + `tag`.
- **`assert`**: oráculo (expr booleana en el WebView) → PASS/FAIL/divergencia.

**Parametrización:** los valores de `data` (cliente/doc/montos) se **sustituyen** en los args/código al
reproducir con los datos de la nueva corrida (ver `substitute()` en `replay-engine.js`). Verbatim
(mismo cliente) no requiere sustitución — es el caso de uso primario de QA (re-correr el mismo cliente).

## Archivos

| Archivo | Rol |
|---|---|
| `replay-engine.js` | Motor: `installRecorder`/`dumpTrace` (modo RECORD) · `runReplay` (modo REPLAY) · `substitute` (parametrización). Se **inlina** en `browser_run_code_unsafe` (como los helpers). |
| `replay-engine.test.js` | Self-test node de la lógica pura (parseo/sustitución/round-trip) — corre sin dispositivo. |
| `traces/{cliente}-{modulo}.trace.json` | Trazas grabadas (se generan en RECORD; gitignoreadas hasta validarlas). |

## Integración con el orquestador (2 modos)

- **RECORD** (flag `QA_MODE=record`) — **cableado** (2026-07-28):
  - `prompt-orquestador-smoke.md` → **Paso 0** crea `{RUN_DIR}_trace/` e inyecta el **BLOQUE RECORD**
    en cada prompt de agente; sin el flag, nadie graba y la corrida es idéntica a hoy.
  - `RUNTIME.md §12` → procedimiento del agente: instalar el grabador, envolver las ops con el
    vocabulario, y al cierre volcar a `{RUN_DIR}_trace/{modulo}.trace.json` con el sobre completo.
  - Los agentes **inlinan `installRecorder`/`dumpTrace` desde este archivo** (en
    `browser_run_code_unsafe` no hay `require`) — este archivo es la **única fuente** de esas funciones;
    no reescribirlas en el prompt ni duplicarlas en `denario-cdp-helpers.js`.
- **REPLAY** (flag `QA_MODE=replay`): un runner liviano por módulo lee su traza + los datos del YAML,
  corre `runReplay`, y solo lanza un agente-modelo para los pasos que divergen. **Aún no cableado** —
  no tiene sentido hasta tener la 1ª traza real.

## 🔴 Limitación conocida — la traza se PARTE en el paso que persiste

Detectado en la 1ª corrida de grabación real (`el_valle-20260728`, módulo clientes):

> Los clicks de **Guardar / Enviar / botón de alert** se hacen con `pg.mouse.click(x, y)` sobre
> **coordenadas frescas** (`coordsOf`/`alertButtonCoords`), no con un helper con nombre. Como el grabador
> solo captura `eng.W(helper)` / `recEval` / `recAssert`, **esas acciones no quedan en la traza**.

**Consecuencia:** ningún módulo transaccional puede reproducir su **envío** por replay — la traza cubre
el llenado del formulario pero se corta justo antes de persistir. El replay serviría para navegar y
llenar, no para completar el caso.

**Arreglo pendiente (antes de que REPLAY sirva de verdad):** promover esos clicks a **helpers canónicos
envolvibles** (ej. `clickHeaderButton(pg, 'Guardar')`, `clickAlertButton` ya existe) y grabarlos con
`eng.W(...)`. Mientras tanto, las trazas se graban igual y son útiles como documentación del flujo, pero
**no son reproducibles end-to-end**. Los agentes lo declaran en `nota_cobertura` dentro de la traza.

## Estado

- ✅ Motor + self-test de lógica pura — validado sin dispositivo (`node automation/replay/replay-engine.test.js` → 13/13).
- ✅ **Modo RECORD cableado** al orquestador y a `RUNTIME.md §12` (2026-07-28). La próxima corrida
  lanzada con `QA_MODE=record` graba; sin el flag no cambia nada.
- ⏳ Pendiente de una **corrida de grabación** (device + cliente) para producir la 1ª traza real y
  validar el loop end-to-end + medir el ahorro vs baseline (ferrenuestro cobros: 87 tool-uses / módulo pesado).
- ⏳ Pendiente el **runner de REPLAY** (bloqueado por lo anterior).

> **Compañero necesario:** el watchdog de CDP (`RUNTIME §11`, `denario-cdp-helpers.js`
> `makeWatchdog`/`withTimeout`, self-test `automation/cdp/watchdog.test.js`). Sin él, un solo cuelgue
> de CDP (ferrenuestro-20260723: ~15.7 h por 2 hangs) se come todo el ahorro que produzca el replay.
