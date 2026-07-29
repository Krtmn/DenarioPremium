# Prompt — Intérprete de corrida (lee un reporte completo y te dice qué pasó)

## CÓMO USAR ESTE ARCHIVO

Para cuando **terminó una corrida** (o querés revisar una vieja) y necesitás saber, sin leer 12 archivos:
**qué falló · qué quedó sin probar · qué hacer ahora.**

Sesión nueva de Claude Code en la carpeta del repo, pegar todo lo de abajo indicando la corrida
(o nada, para la más reciente):
```
CORRIDA=smoke_el_valle_20260728_130612
```

> 💡 Si solo querés los números y no la interpretación, **no necesitás una sesión**: corré
> `node automation/reports/leer-corrida.js` y listo. Este prompt agrega el criterio encima.

═══════════════════════════════════════════════════════════

Eres **Claude Code interpretando una corrida de QA** de Denario Premium Móvil.

Working dir: `DenarioPremiunMovil/qa-piloto-automatizacion/`

## Paso 1 — Los números, del script (no los calcules a mano)

```bash
node automation/reports/leer-corrida.js {CORRIDA}
```
*(sin argumento toma la más reciente; `--json` si preferís parsearlo)*

Ese script ya resuelve, de forma **determinista**, todo lo mecánico: conteos por módulo, FAIL, BLOCKED, N/A,
**los casos del alcance que no tienen veredicto**, los registros creados sin cotejo web, el diff contra la
corrida anterior del mismo cliente y las trazas.

⚠ **No recalcules eso leyendo los `.md`.** El ledger es la fuente; los `.md` son evidencia humana y pueden
tener prosa que no refleja el veredicto final.

## Paso 2 — El contexto, de los reportes

Ahora sí, leé los `.md` de la corrida, **pero con un objetivo acotado**: entender **por qué** pasó lo que el
script ya dijo que pasó.

- `consolidado.md` — la síntesis y los defectos, si existe.
- El `.md` de cada módulo con FAIL, BLOCKED o huecos — ahí está el motivo.
- `web.md` — si hubo capa web.
- `automation/clientes/{cliente}.yaml` — las VGs explican muchos N/A: **un N/A por VG es correcto**, un N/A
  por falta de datos es una limitación de la corrida. **No son lo mismo y no hay que mezclarlos.**

## Paso 3 — Interpretá

Producí un informe **breve y accionable**. Lo que aporta valor acá es el criterio, no repetir la tabla:

1. **¿La corrida sirve como evidencia?** Una corrida con módulos sin veredicto **no prueba** que esos casos
   estén bien: prueba que no se probaron. Decilo sin rodeos.
2. **Separá tres cosas que se confunden todo el tiempo:**
   - **Defecto de producto** — la app o la web hacen algo mal.
   - **Limitación de automatización** (`BLOCKED`) — no se pudo conducir; no dice nada del producto.
   - **N/A** — y distinguí **por VG** (correcto, no aplica a este cliente) de **por falta de datos**
     (sí aplicaba, no se pudo probar hoy).
3. **Priorizá por impacto**, no por orden de aparición. Un descuadre de cálculo en cobros pesa más que un
   selector que no responde.
4. **Contrastá con la corrida anterior** si el script encontró una: una **regresión** (PASS→FAIL) es lo más
   urgente del informe.
5. **Siguientes pasos**: partí de los que el script derivó y agregá los que necesitan criterio (qué re-correr
   primero, qué reportar a desarrollo, qué falta para poder cerrar el cliente).

## Reglas para no reportar mal

- ⚠ **Un caso que no está en el ledger NO es un PASS.** Es un hueco. El script los lista aparte por eso.
- ⚠ **`BLOCKED` no es `FAIL`.** No contamina la métrica de defectos.
- ⚠ **No interpretes `st_*` de la BD con el catálogo `statuses`** (`st_collection=3` parece "Rechazado" y la web
  muestra "Por aprobar"). Si necesitás el estatus real, usá la query de `automation/db/modelo-datos-denario.md §10`.
- ⚠ **Los defectos conocidos** (`automation/cdp/RUNTIME.md §5`) no se re-reportan como nuevos.
- ⚠ Si un dato del `.md` contradice al ledger, **gana el ledger** y mencionás la discrepancia.

## Salida

Un informe en el chat, **sin escribir archivos** salvo que te lo pidan. Estructura sugerida:

```
VEREDICTO: ¿la corrida sirve como evidencia? (1-2 frases)

LO QUE FALLÓ
  · defectos de producto, ordenados por impacto

LO QUE NO SE PROBÓ
  · huecos de cobertura y por qué importan

LO QUE NO DICE NADA
  · BLOCKED y N/A, separando VG de falta de datos

COMPARADO CON LA CORRIDA ANTERIOR
  · regresiones y mejoras (si hay corrida previa)

QUÉ HARÍA AHORA
  1. …  (priorizado, concreto)
```

Si la corrida está limpia, decilo en dos líneas y no infles el informe.

═══════════════════════════════════════════════════════════
─── FIN DEL PROMPT ───
