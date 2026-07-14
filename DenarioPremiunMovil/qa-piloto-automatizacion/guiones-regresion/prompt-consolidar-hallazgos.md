# Prompt: Consolidar hallazgos post-corrida → `module-selectors/{modulo}.md` + YAML cliente
## Ejecutar con modelo **Opus** · Solo edición de archivos · NO corridas, NO Playwright, NO adb

---

## INSTRUCCIÓN AL USUARIO ANTES DE PEGAR ESTE PROMPT

1. Indicar el cliente y la carpeta de la corrida que acaba de terminar:
```
QA_CLIENTE=insumar
RUN_DIR=automation/reports/smoke_insumar_20260609_132051/
```

2. Cambiar a modelo Opus:
```
/model claude-opus-4-8
```
Al terminar, volver a Sonnet con `/model claude-sonnet-4-6`.

---

## CUÁNDO EJECUTAR

Inmediatamente después de cada corrida smoke completa, **antes de cerrar la sesión**.
**No ejecutar si la corrida fue interrumpida o parcial** — esperar a que el orquestador haya completado los 10 módulos.

---

## OBJETIVO

Los patrones nuevos de cada corrida ya quedaron capturados en los **reportes de módulo** de esa corrida:
cada `{RUN_DIR}{modulo}.md` tiene una sección **`## Patrones / selectores nuevos`** que el agente llenó.

Este paso los lee, los clasifica y los escribe **directo en su hogar definitivo**. **No hay archivo buffer intermedio** — la captura vive en el reporte (que de todos modos se generó) y la promoción ocurre aquí, en una sola pasada.

| Destino | Criterio |
|---------|----------|
| `automation/cdp/module-selectors/{modulo}.md` | Selector, técnica o anti-patrón del **DOM estándar** de Denario, independiente de la config del cliente |
| YAML del cliente (**inline** en `modules.{x}` o como comentario en `vgs`) | Comportamiento atado a una **VG** o **dato específico** del cliente |
| `RUNTIME.md` / `denario-cdp-helpers.js` | **Solo** patrones confirmados en **2+ corridas** distintas (graduación profunda — decisión manual, rara) |

---

## ARCHIVOS A LEER

```
{RUN_DIR}*.md                          ← los reportes de módulo de la corrida; extraer su sección "## Patrones / selectores nuevos"
automation/cdp/module-selectors/{modulo}.md     ← memoria universal actual (NO duplicar; si un patrón ya existe, solo añadir el tag de corrida)
automation/cdp/RUNTIME.md              ← reglas globales (para no duplicar)
automation/clientes/{QA_CLIENTE}.yaml  ← destino de lo cliente-específico
```

Para verificar si un patrón ya se vio en otro cliente (**solo si hay duda**), leer los otros YAML:
`globalmp.yaml`, `romher.yaml`, `insumar.yaml`, `hidroponias.yaml` (omitir el del cliente actual, ya leído).

---

## PROCESO DE CLASIFICACIÓN

### Paso 1 — Inventariar
De cada reporte de módulo en `{RUN_DIR}`, extraer las filas de su sección `## Patrones / selectores nuevos`
(patrón, sugerencia universal/cliente del agente, detalle). Ignorar los reportes que digan "ninguno".

### Paso 2 — Aplicar reglas (en orden)

**REGLA A — Coordenadas pixel exactas → descartar de memoria universal.**
Patrones con coordenadas device-specific (`x≈267,y=32`): extraer la **técnica** (ej. "header fijo, misma posición que devoluciones") y promover eso; descartar las coordenadas.

**REGLA B — Atado a VG o dato de cliente → YAML del cliente (inline).**
Si solo aplica con una VG activa o depende de un valor configurable (banco, empresa, monto, nombre): escribirlo **inline** en la sección `modules.{x}` correspondiente o como comentario en la VG. No promover a universal.

**REGLA C — Anti-patrón confirmado → siempre universal.**
Si documenta algo que NO funciona + la alternativa correcta: promover a `module-selectors/{modulo}.md` sin importar cuántos clientes lo confirmaron.

**REGLA D — Selector/técnica DOM estándar → universal con 1 confirmación.**
Selector CSS, clase, componente Angular o técnica de interacción del DOM de Denario: promover con tag `[{QA_CLIENTE}-{fecha}]`. Si ya existe en `module-selectors/{modulo}.md`, solo añadir el cliente en "Corrida confirmada".

**REGLA E — DOM dudoso de 1 cliente → universal candidato.**
Si hay duda de si aplica universalmente: promover con nota `# candidato — confirmar en próxima corrida`.

**REGLA F — Confirmado en 2+ corridas distintas → graduar a la capa profunda.**
Si un patrón universal ya está confirmado en 2+ clientes/corridas y es una regla operativa o helper reutilizable: graduarlo a `RUNTIME.md` o `denario-cdp-helpers.js` (decisión manual) y dejar en `module-selectors/{modulo}.md` una nota de que graduó.

---

## EDICIONES A REALIZAR

### 1. `automation/cdp/module-selectors/{modulo}.md`
- **Selector nuevo:** fila en `### Selectores probados` del módulo (`Elemento | Selector CSS / técnica | Corrida confirmada | Notas`).
- **Anti-patrón nuevo:** fila en `### Anti-patrones confirmados` del módulo.
- **Ya existente:** añadir `[{QA_CLIENTE}-{fecha}]` en "Corrida confirmada".
- **Diferencia entre clientes:** fila en `### Notas por cliente`.
- **Destino por módulo:** escribir en `automation/cdp/module-selectors/{modulo}.md` (el archivo del módulo del patrón). Patrones **transversales** (no atados a un módulo: CDP, socket, firma de `browser_run_code_unsafe`) → `automation/cdp/module-selectors/_comunes.md`.
- **Tamaño:** mantener cada archivo de módulo bajo ~120 líneas; consolidar filas redundantes antes de crecer.

### 2. `automation/clientes/{QA_CLIENTE}.yaml`
- Lo **cliente-específico** va **inline** en la sección que corresponda (`modules.{x}` como dato/nota, o comentario en la VG). NO crear listas-buffer.
- Actualizar `ultima_corrida.run_id` y `ultima_corrida.fecha` al de esta corrida.
- **NO tocar** `defectos_abiertos` (lo gestiona el orquestador).
- No escribir credenciales.

### 3. Reportes de módulo
- Tras consolidar, anota al final de la sección `## Patrones / selectores nuevos` de cada reporte procesado: `> ✅ consolidado {fecha}`. Así no se reprocesa.
- **No borres** el contenido del reporte — es evidencia histórica.

---

## REGLAS DE CALIDAD

1. **No duplicar RUNTIME.md.** Solo lo específico por módulo.
2. **No inventar.** Clasificar únicamente lo que aparece en los reportes de la corrida.
3. **Trazar origen.** Todo patrón en `module-selectors/{modulo}.md` lleva al menos un tag de corrida.
4. **Conservar formato** de `module-selectors/{modulo}.md` — no reestructurar secciones existentes.
5. **En duda sobre el nivel → preferir el menos profundo** (YAML/cliente antes que universal; universal antes que RUNTIME). Es más fácil promover después que retractarse.
6. **No tocar** `defectos_abiertos`. **No** `git commit`/`push`.

---

## AL TERMINAR

Tabla resumen de cada patrón procesado:

| # | Patrón (resumido) | Módulo | Decisión | Acción tomada |
|---|-------------------|--------|----------|---------------|
| 1 | `ion-item.click() no navega` | PEDIDOS | Universal — anti-patrón | Agregado a module-selectors/pedidos.md |
| 2 | banco "BANESCO RAEL" para depósito | COBROS | Cliente — dato | Inline en `modules.cobros` del YAML |
| ... | ... | ... | ... | ... |

Luego confirmar:
- Promovidos a `module-selectors/{modulo}.md`: **N**
- Escritos inline en el YAML del cliente: **N**
- Graduados a `RUNTIME.md`/`helpers.js` (2+ corridas): **N**
- Nuevo tamaño de `module-selectors/{modulo}.md`: **N líneas**
- Archivos modificados: (lista de rutas)
