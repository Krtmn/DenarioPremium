# Propuesta de arquitectura — Optimización de corridas smoke (tiempo → tokens)

> **Estado:** propuesta para revisión del equipo QA. NO aplicada. Alineada con la gobernanza de `MANUAL-CORRIDAS.md §6` (cambios de estructura se proponen, el equipo integra).
> **Autor:** análisis técnico Claude Code · **Fecha:** 2026-07-14 · **Alcance:** `qa-piloto-automatizacion/`
> **Objetivo priorizado (según QA):** (1) reducir **tiempo** por corrida · (2) reducir **tokens**. En ese orden.
> **Decisiones de contexto ya tomadas por QA:** capa de **replay determinista completa** · plataforma **a evaluar (requisito duro: el equipo QA debe poder lanzar una corrida por cliente sin fricción)** · **model tiering** vigente (Opus en transaccionales, Haiku/Sonnet en el resto) a validar con métricas · paralelismo por 2º dispositivo **a probar** (limitado por disco, ver §7).

---

## 0. TL;DR

Una corrida smoke (10 módulos + cotejo BD) tarda **~3 h/cliente**. El 80–90 % de ese tiempo **no** es la app respondiendo: es el **modelo razonando entre cada acción del DOM**. El propio `RUNTIME.md §3` lo documenta: *"cobros llegó a 277 tool-uses por insistir en atajos"*. Cada `tool-use` es un viaje de ida y vuelta al modelo (pensar → generar → ejecutar → observar), del orden de **5–10 s**. Cientos de tool-uses por módulo × 10 módulos = las 3 horas.

**La palanca #1 (tiempo y tokens a la vez)** es la que QA ya eligió: **compilar los flujos estables a scripts deterministas** que ejecutan un caso completo en **1–3 `browser_run_code_unsafe`** y devuelven un veredicto estructurado (PASS/FAIL + valores-oráculo). El modelo solo re-entra **ante divergencia**. Esto baja los tool-uses por módulo de ~50–277 a **~5–15**, sin depender de más hardware.

El sistema **ya va en esa dirección** (helpers `openNuevoCobro`, `installPayloadCapture`, `resolve-run-context.js`, ledger `.jsonl`, cotejo BD en paralelo). Esta propuesta la lleva a su forma final y añade 7 palancas complementarias, ordenadas por impacto/esfuerzo.

**Meta cuantitativa propuesta:** corrida completa de **~3 h → ~45–70 min** en un solo dispositivo (sin comprar hardware), y **~50–70 % menos tokens**. Con un 2º dispositivo (Fase 3, si se libera disco): **~30–45 min**.

---

## 1. Cómo funciona hoy (línea base)

```
PRE-VUELO (setup-cdp.ps1)  →  app + CDP :9220 en 1 dispositivo
         │  pegar prompt-orquestador-smoke.md (QA_CLIENTE=<slug>)  · sesión Opus
         ▼
ORQUESTADOR (1 sesión)  ── lanza 10 agentes de módulo EN SECUENCIA ──►
   cada agente:
     • re-lee RUNTIME.md + smoke-{mod}.md + _comunes.md + {mod}.md + YAML + helpers
     • conduce el WebView caso por caso vía Playwright MCP (bucle agéntico por acción)
     • escribe reporte .md + ledger .jsonl
   7 transaccionales: lanzan además Agente BD (Bash/DB) en background, en paralelo
                      con el agente UI del módulo siguiente
   Agente 11: consolida memoria (module-selectors/ + YAML)
```

**Restricción física dura:** hay **un solo dispositivo**. Los 10 agentes UI son forzosamente seriales (no se paraleliza tocar la misma pantalla). Lo único hoy paralelizado es el **cotejo BD** (recurso distinto: Postgres/Bash), y está bien resuelto.

---

## 2. Diagnóstico cuantificado — dónde se va el tiempo y los tokens

### 2.1 Tiempo (orden de magnitud)

| Fuente de latencia | Peso estimado | Evidencia en el repo |
|---|---|---|
| **Modelo en el loop por acción** (observar→razonar→`run_code`→observar) | **★★★★★ dominante** | `RUNTIME §3`: techo de 2 intentos existe *porque* "cobros llegó a 277 tool-uses". Cada tool-use ≈ 5–10 s de ida/vuelta |
| Exploración/descubrimiento DOM en runtime | ★★★ | `smoke-cobros.md`: descubrimiento dinámico de cliente, "el agente piensa" a qué cliente ir |
| Esperas fijas `waitForTimeout(300–1200)` + `waitSyncOverlay` (hasta 120 s) | ★★ | `denario-cdp-helpers.js`: decenas de `waitForTimeout` fijos |
| Poll de sync BD (~10 s por registro) | ★ | `RUNTIME §10`: "poll ~10s antes de concluir" |
| App real respondiendo (render Ionic) | ★ (irreducible) | — |

**Lectura clave:** el tiempo **no** está en la app ni en la red — está en el **número de turnos del modelo**. Reducir turnos = reducir tiempo casi 1:1. Ese es todo el juego.

### 2.2 Tokens (intake estático medido, aprox. 3.3 car/token)

Lo que cada agente **re-lee** antes de tocar el dispositivo (medido con `wc` sobre los archivos reales):

| Archivo | Bytes | ≈ tokens |
|---|---:|---:|
| `RUNTIME.md` | 19 735 | ~5 900 |
| `module-selectors/_comunes.md` | 10 061 | ~3 000 |
| `smoke-cobros.md` (el más pesado) | 23 109 | ~7 000 |
| `module-selectors/cobros.md` | 25 805 | ~7 800 |
| `helpers-inline.js` (bundle) | 9 236 | ~2 900 |
| sección YAML del cliente | ~11 731 | ~3 500 |
| **Intake estático de UN agente pesado (cobros)** | — | **≈ 28 000** |

- **RUNTIME.md se re-lee 10×** por corrida (~59k tokens) y `_comunes.md` 10× (~30k). Gran parte es **byte-idéntica** entre agentes → **candidata directa a prompt caching** (hoy no se garantiza; ver §4-P4).
- Pero el intake estático es la **parte pequeña**. El grueso son las **observaciones del DOM** (cada `browser_snapshot`/eval devuelve árboles grandes) y las **trazas de razonamiento**, que escalan con el número de tool-uses. Una corrida completa se estima en el orden de **1–3 M tokens** — y ese volumen es proporcional a los turnos del modelo. **Menos turnos ⇒ menos tokens.** Por eso la palanca #1 sirve para las dos metas.

---

## 3. Arquitectura objetivo — "replay determinista + LLM como oráculo de excepción"

### 3.1 El principio

Un caso smoke estable no necesita un agente que "piense" cada click. Necesita **ejecutar una secuencia probada** y **verificar un invariante**. El modelo solo aporta valor cuando algo **se desvía** de lo esperado (selector que no responde, monto que no cuadra, modal inesperado).

Esto es exactamente el patrón que la documentación de Claude llama **programmatic tool calling / code execution**: en vez de N viajes de ida/vuelta (uno por acción), el modelo **compone las acciones en un script** que corre entero en el contenedor (aquí: `browser_run_code_unsafe` sobre el WebView), y **solo el resultado final vuelve al contexto**. El repo ya lo hace en fragmentos (`openNuevoCobro` dispara todo el flujo real y espera `paymentMethodList`); la propuesta es **generalizarlo a nivel de caso**.

### 3.2 El "guión compilado" (unidad nueva)

Cada caso `DM-XXX-NNN` estable se representa como un **escenario JS parametrizado** que:

1. Recibe los datos ya resueltos (cliente, documento, montos) — sin descubrir en runtime.
2. Ejecuta el happy-path completo **dentro de 1–3 `browser_run_code_unsafe`** usando los helpers.
3. Aplica el **oráculo** (`RUNTIME §9/§10`: round-trip Guardar→reabrir, cotejo campo-a-campo) **dentro del mismo script**.
4. Devuelve un **objeto estructurado**: `{ caso, resultado: PASS|FAIL|BLOCKED, evidencia, oraculo:{esperado,obtenido}, ms, intentos }`.

```
              ┌──────────────── REPLAY (sin modelo en el loop) ─────────────────┐
DATOS         │  escenario-cobros.js(caso, datos)                                │
RESUELTOS ───►│    → browser_run_code_unsafe (macro determinista)               │──► {PASS, oráculo, ms}
(run-context) │    → verifica invariante inline                                  │      │
              └──────────────────────────────────────────────────────────────────┘      │
                                                                              divergencia │  (FAIL/BLOCKED/anomalía)
                                                                                          ▼
                                              ┌──── ESCALA A LLM (oráculo de excepción) ────┐
                                              │  agente re-entra SOLO en este caso:          │
                                              │  diagnostica, reintenta acotado, reclasifica │
                                              │  FAIL real vs BLOCKED vs selector a promover │
                                              └──────────────────────────────────────────────┘
```

**Consecuencia:** un módulo de 30 casos que hoy consume ~150–277 tool-uses pasa a **~1 tool-use por caso estable + N tool-uses solo en los casos que fallan**. Si 26/34 cobros pasan limpio (como en `smoke_dm-electronica`), son ~26 macros + trabajo del modelo solo en 8. Reducción de turnos ≈ **10–20×** en los módulos verdes.

### 3.3 Qué cambia y qué NO

- **NO** cambia: la app, el CDP, el modelo de memoria (`module-selectors/` + YAML), el cotejo BD, la gobernanza.
- **SÍ** cambia: los `smoke-{mod}.md` dejan de ser "instrucciones para que el agente improvise" y pasan a ser **specs + escenarios compilados**. El agente pasa de *conductor* a *supervisor de excepciones + consolidador*.
- **Compatibilidad:** el fallback siempre existe — si un escenario compilado devuelve anomalía, se cae al flujo agéntico actual para ese caso. Cero pérdida de cobertura.

---

## 4. Palancas priorizadas

Ordenadas por **impacto en tiempo** (meta #1), con impacto en tokens, esfuerzo y riesgo. `↓↓↓` = alto.

| # | Palanca | Tiempo | Tokens | Esfuerzo | Riesgo | Depende de |
|---|---|:---:|:---:|:---:|:---:|---|
| **P1** | **Compilación a escenarios deterministas** (§3) — el corazón | ↓↓↓ | ↓↓↓ | Alto (por olas) | Medio | — |
| **P2** | **`resolve-run-context.js` universal** (hoy solo cobros) — datos resueltos antes de lanzar | ↓↓ | ↓↓ | Medio | Bajo | queries BD por módulo |
| **P3** | **Observación mínima estructurada** — prohibir `browser_snapshot`; devolver solo el JSON-oráculo que cada caso necesita | ↓ | ↓↓↓ | Bajo | Bajo | P1 |
| **P4** | **Prompt caching estructurado** — bloque estático (RUNTIME+_comunes+helpers) como prefijo byte-idéntico cacheable (TTL 1 h) | ↓ (TTFT) | ↓↓ | Bajo | Bajo | orden de lectura estable |
| **P5** | **Model tiering medido por rol** — Haiku en replay/lectura, Sonnet en agéntico, Opus en excepción/consolidación | ↓ | ↓↓ (costo) | Bajo | Bajo | instrumentación |
| **P6** | **Reportes generados por código** — `aggregate.js` arma el `.md` desde el `.jsonl`; el LLM no redacta prosa por módulo | — | ↓↓ | Bajo | Bajo | ledger completo |
| **P7** | **Esperas por evento** — sustituir `waitForTimeout` fijos por `waitForFunction`/señal DOM | ↓ | — | Medio | Bajo | — |
| **P8** | **Paralelismo por 2º dispositivo** (§7) — repartir módulos entre físico + emulador | ↓↓ | — | Alto | Alto | **liberar disco** |

### Detalle de las palancas no obvias

**P2 — Datos resueltos (extiende lo ya iniciado).** `resolve-run-context.js` ya resuelve cobros. Extenderlo a los 7 transaccionales elimina el "pensar en runtime a qué cliente/documento ir" (hoy `smoke-cobros.md` dedica ~3 secciones a descubrimiento dinámico). El agente/escenario **llega sabiendo**. Cada módulo que se resuelve por adelantado es un módulo que no explora.

**P3 — Observación mínima.** `RUNTIME §3` ya prohíbe `page.screenshot()`. Falta el paso siguiente: prohibir `browser_snapshot` (árbol de accesibilidad enorme) como observación por defecto y **estandarizar que cada `browser_run_code_unsafe` devuelva solo el JSON que el oráculo necesita** (ej. `{montoTotal, colorDiferencia, estatus}`), no el DOM. Esta sola disciplina recorta el mayor consumidor de tokens de observación.

**P4 — Caching (fundamentado en docs de Claude).** El bloque estático compartido (RUNTIME + `_comunes.md` + helpers) es **idéntico** entre los 10 agentes de una corrida. Si se **lee siempre primero, en el mismo orden y byte-idéntico**, se convierte en un **prefijo cacheable**: lectura de caché ≈ **0.1×** del costo de entrada, escritura ≈ 1.25× (TTL 5 min) / 2× (TTL 1 h). Con TTL 1 h cubre toda la corrida de 3 h. *Nota honesta:* el harness de Claude Code ya aplica caching automático; el objetivo de P4 es **garantizar** que el prefijo estático no se invalide (nada de fechas/IDs/orden variable delante del bloque) para que el hit sea real. Ganancia sobre todo en **tokens** y algo de TTFT; no mueve la aguja del tiempo tanto como P1.

**P5 — Tiering (validar la estructura que QA ya usa).** QA ya corre Opus en transaccionales y Haiku/Sonnet en el resto. Con P1, la mayoría de los casos son **replay determinista** (casi no razonan) → ahí **Haiku 4.5** basta y es ~5× más barato/rápido que Opus. Reservar **Opus 4.8** para: (a) el **oráculo de excepción** (diagnóstico de FAIL sutil), y (b) el **Agente 11** (clasificación de memoria, donde el juicio importa). **Sonnet 5** (near-Opus en agéntico) como término medio para módulos aún no compilados. La recomendación es **medir antes de fijar** (ver §6/§8): instrumentar tokens+ms por rol y decidir con datos, no por intuición.

**P6 — Reportes por código.** El ledger `{RUN_DIR}_results.jsonl` ya es la fuente máquina-legible. Hoy el LLM **además** redacta prosa por módulo (tokens de salida). Propuesta: `aggregate.js` genera el `.md` humano desde el `.jsonl` + los oráculos; el LLM solo escribe la **narrativa de hallazgos** cuando hay FAIL. Menos tokens de salida, reportes más consistentes.

---

## 5. La cuestión de la plataforma (CLI vs. runner headless)

**Restricción física que acota las opciones:** el dispositivo está **físicamente conectado por adb/CDP a la laptop**. Todo lo que **conduce la UI** debe correr **en la máquina con el dispositivo** — un runner "en la nube" no puede tocar el WebView. Por lo tanto:

| Componente | Dónde puede vivir |
|---|---|
| Conducción UI (Playwright MCP + CDP) | **Solo local** (donde está el dispositivo) |
| Cotejo BD (Postgres/Bash) | Local o nube |
| Consolidación de memoria (Agente 11) | Local o nube |

**Recomendación por fases (cumpliendo el requisito duro "QA lanza fácil"):**

1. **Hoy → sigue en Claude Code CLI.** Pegar el orquestador funciona y es el camino de menor fricción. Las palancas P1–P7 caben **dentro del CLI** (subagentes, `model` por agente, settings, `browser_run_code_unsafe`). **No hace falta cambiar de plataforma para lograr la mayor parte del ahorro.**
2. **Evolución → runner headless LOCAL con el Agent SDK de Claude** (`claude-agent-sdk`), corriendo en la laptop del QA. Ventaja: control determinista explícito del bucle, caching explícito, disparo con **un solo comando** (`npm run corrida -- --cliente=<slug>`) o incluso un **cron/routine local**. El QA no "pega prompts": ejecuta un comando. Esto **mejora** el requisito de "lanzar fácil", no lo empeora.
3. El **cotejo BD y la consolidación** sí podrían migrar a un **agente en nube/Managed Agent** (no tocan el dispositivo), desacoplando esa carga de la laptop.

> **Nota de plataforma (docs Claude):** un runner headless con el Agent SDK sigue necesitando el **Playwright MCP local** y el **CDP local**. No es "moверlo a la nube"; es "envolverlo en un programa disparable con un comando en la misma máquina". Se evalúa a fondo en Fase 4; **no bloquea** P1–P7.

---

## 6. La cuestión del model tiering — medir antes de fijar

QA pidió "evaluar y medir primero". Plan concreto, apoyado en instrumentación que **ya casi existe** (`aggregate.js` + ledger `.jsonl`):

1. Añadir al ledger por caso: `modelo`, `tokens_in`, `tokens_out`, `cache_read` (además de `ms`, `intentos` que ya están).
2. Correr **1 corrida A/B controlada** en 2–3 módulos: variante Opus-en-todo vs. variante tiered (Haiku replay / Opus excepción).
3. Comparar: **ms/módulo**, **tokens/módulo**, **%FAIL detectados** (la métrica que no puede bajar). Si el tiered mantiene detección y baja tiempo/costo → se gradúa a default.
4. Con P1 ya en marcha, la hipótesis fuerte es: **Haiku basta para el replay** (no razona, ejecuta) y **Opus solo se justifica en la excepción y el Agente 11**. Pero se decide **con el número**, no antes.

---

## 7. La cuestión del paralelismo (2º dispositivo) — la cuenta honesta

**Idea de QA:** correr el dispositivo físico + un emulador → 2 apps Denario en paralelo → repartir módulos.

**Realidad de recursos de la laptop (20 GB RAM · 4 GB disco libre):**

| Recurso | Necesidad de un AVD Android 15 | ¿Alcanza? |
|---|---|---|
| **Disco** | System image + userdata + quickboot ≈ **8–13 GB** | ❌ **No** con 4 GB libres — el emulador ni se crea |
| **RAM** | Emulador (~3–5 GB) + WebView/CDP host + físico + Chrome host | ⚠️ Ajustado en 20 GB, factible si se cierra todo lo demás |

**Conclusión:** el paralelismo por 2º dispositivo **es válido en teoría y daría ↓↓ en tiempo** (repartir 10 módulos en 2 pantallas ≈ mitad de wall-clock), **pero hoy está bloqueado por disco**. Opciones, de menor a mayor costo:

1. **Liberar ~15 GB de disco** en la laptop → crear un AVD ligero (system image *sin* Google Play, x86_64, resolución baja) → **prueba controlada** de 2 módulos en paralelo para medir el solape real.
2. **2º dispositivo físico barato** (otro Android debuggable por USB) → evita el costo de disco/RAM del emulador; cada uno con su `adb forward` a un puerto CDP distinto (`:9220` / `:9221`).
3. **Diferir a Fase 3** y capturar primero el ahorro de P1 (que **no cuesta hardware** y da la mayor parte del tiempo de vuelta).

> **Recomendación:** **no** hacer del 2º dispositivo la apuesta principal. P1 (determinismo) recupera la mayor parte de las 3 h **en un solo dispositivo**. El 2º dispositivo es un multiplicador **encima** de P1, para cuando se libere disco o se consiga un físico extra. Igual dejamos lista la **prueba controlada** para medir el solape antes de comprometer nada.

**Arquitectura preparada para paralelo (sin implementarla aún):** el orquestador ya trata cada módulo como unidad independiente (empieza y termina en HOME). Con 2 puertos CDP, un orquestador podría asignar módulos a `device_pool = [:9220, :9221]` y correr 2 en vuelo. El cotejo BD ya es paralelo. El único cuidado: **contención de datos en la nube compartida** (registros únicos por corrida ya lo evitan) y **no** correr 2 módulos que compitan por el mismo cliente/documento.

---

## 8. Métricas y KPIs (cómo sabremos que funcionó)

Instrumentar sobre el ledger `.jsonl` existente y `aggregate.js`:

| KPI | Línea base (hoy) | Meta Fase 2 | Meta Fase 3 (2º disp.) |
|---|---|---|---|
| **Wall-clock corrida completa** | ~180 min | **45–70 min** | **30–45 min** |
| **Tool-uses / módulo (verde)** | 50–277 | **5–15** | igual |
| **Tokens / corrida** | ~1–3 M (est.) | **−50–70 %** | igual |
| **% casos por replay determinista** | ~0 % | **≥70 %** | ≥70 % |
| **% FAIL reales detectados** (no puede bajar) | referencia | **=** | **=** |
| **Costo USD / corrida** | referencia | **−60–80 %** | igual |

`aggregate.js` ya mide "tendencia entre corridas (flakiness por caso, ms/módulo)" — se extiende con tokens y % determinista para cerrar el lazo de mejora continua.

---

## 9. Roadmap por olas

Cada ola entrega ahorro medible y es reversible (fallback al flujo actual siempre disponible).

- **Ola 0 — Instrumentar (1–2 días).** Añadir tokens/modelo al ledger. Correr 1 corrida base para fijar la línea base real (hoy es estimada). *Sin esto, no se mide nada.*
- **Ola 1 — Quick wins sin riesgo (P3, P4, P6).** Observación mínima estructurada + prefijo cacheable + reportes por código. Bajan tokens ya, no tocan la lógica de casos. Bajo riesgo.
- **Ola 2 — Compilar 1 módulo piloto (P1) + datos resueltos (P2).** Elegir **cobros** (el más pesado y ya mejor instrumentado) o **clientes** (el más simple, para validar el patrón rápido). Medir tool-uses antes/después. Este es el experimento que valida toda la propuesta.
- **Ola 3 — Extender P1 a los 10 módulos por olas.** Cada módulo compilado se mide contra su línea base. Fallback intacto.
- **Ola 4 — Tiering medido (P5) + evaluación de runner headless (§5).** Con casos ya deterministas, el A/B de modelos es informativo. Diseñar el runner headless local si el ahorro lo justifica.
- **Ola 5 — Paralelismo (P8), contingente a disco/2º físico (§7).** Prueba controlada primero; adopción solo si el solape medido compensa.

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Un escenario compilado "pasa" un caso que en realidad falla (falso verde) | El oráculo (`§9/§10` round-trip + cotejo BD) corre **dentro** del escenario; el cotejo BD independiente sigue siendo el segundo par de ojos. Ola 2 compara detección de FAIL 1:1 contra la línea base antes de graduar |
| Rigidez: la UI cambia y el escenario se rompe en masa | Fallback automático al flujo agéntico por caso; los selectores siguen viniendo de `module-selectors/` (memoria viva). Un escenario roto degrada a "agente improvisa", no a "corrida caída" |
| Tiering baja la detección de bugs sutiles | P5 se decide **con datos** (A/B), y la métrica "% FAIL reales" tiene veto: si baja, no se gradúa |
| Menos "modelo en el loop" ⇒ menos hallazgos serendípicos | El oráculo de excepción **sí** usa el modelo full donde importa (los casos que divergen, que son justo donde viven los bugs). El determinismo se aplica al happy-path, no al diagnóstico |
| Paralelismo corrompe datos en nube compartida | Registros únicos por corrida (ya vigente) + no asignar 2 módulos al mismo cliente/documento en vuelo |

---

## 11. Resumen de la recomendación

1. **Empezar por P1** (compilación determinista) — es lo que QA eligió y es la única palanca que ataca **tiempo y tokens a la vez**, **sin comprar hardware**. Piloto en 1 módulo (Ola 2) para validar el patrón con números.
2. **Quick wins en paralelo** (P3/P4/P6) — bajan tokens desde la primera semana, riesgo casi nulo.
3. **Instrumentar primero** (Ola 0) — hoy la línea base es estimada; sin medir no se puede demostrar el ahorro ni decidir el tiering.
4. **Plataforma:** quedarse en el CLI por ahora; el runner headless **local** con Agent SDK es la evolución natural (disparo por comando, mejor "lanzar fácil"), a evaluar en Fase 4 — **no bloquea** el ahorro principal.
5. **2º dispositivo:** tratarlo como multiplicador de Fase 3, **contingente a liberar ~15 GB de disco o conseguir un 2º físico**. Prueba controlada antes de comprometer.

> Nada de esto altera la app, la memoria (`module-selectors/`+YAML), el cotejo BD ni la gobernanza. Todo es aditivo y reversible: cada caso conserva su fallback al flujo agéntico actual.

---
*Propuesta para revisión QA · registrar en `PROPUESTAS-CAMBIOS.md` si se aprueba avanzar · no aplicar estructura sin visto bueno del equipo.*
