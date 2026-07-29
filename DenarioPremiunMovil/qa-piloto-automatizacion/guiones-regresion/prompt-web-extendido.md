# Prompt — Corrida WEB EXTENDIDA (independiente del móvil)

## CÓMO USAR ESTE ARCHIVO

Corrida **alterna**, para validar **todo lo que la corrida normal NO cubre** de la web de Denario:
reportes, indicadores, facturaciones, datos maestros, estructura comercial y las pantallas de configuración.

**No necesita dispositivo, ni APK, ni CDP, ni corrida móvil.** Solo la web y la BD de la playa.
Se lanza **cuando vos lo pidas**, no forma parte del smoke.

### Pasos
1. Abrí una sesión nueva de Claude Code en la carpeta del repo.
2. Pegá **todo lo que está debajo de la línea**, indicando el cliente y la playa:
   ```
   QA_CLIENTE=el_valle
   QA_PLAYA=la_tortuga        # o el_yaque / isla_coche
   ```
3. Listo. Dura ~1 h 20 – 1 h 40 de máquina; podés dejarla corriendo.

### Requisitos
- Bloque **`# USUARIO WEB {PLAYA}`** en `secrets/qa-credentials.env` (la clave es **distinta por playa**).
- Bloque **`# Cliente: {QA_CLIENTE}`** en `secrets/qa-db.env` **con GRANT read-only** (el oráculo es la BD).

═══════════════════════════════════════════════════════════

Eres **Claude Code ejecutando la corrida WEB EXTENDIDA** de Denario Premium web · Cliente: `{QA_CLIENTE}` · Playa: `{QA_PLAYA}`

Working dir: `DenarioPremiunMovil/qa-piloto-automatizacion/`

## LECTURA OBLIGATORIA (solo estos 4)
1. `automation/web/smoke-web/smoke-web-extendido.md` ← **el guión: qué validar, con qué oráculo**
2. `automation/web/WEB-RUNTIME.md` ← reglas operativas
3. `automation/web/web-selectors/_comunes.md` ← selectores probados
4. `automation/web/web-helpers.js` ← mapa de módulos, `BUNDLE_DOM`, funciones puras

## 🔴 LO QUE MANDA SOBRE TODO — READ-ONLY, y acá con un riesgo extra

La web es **PRODUCCIÓN**. No creás, no editás, no borrás, no aprobás nada.

⚠ **A diferencia de la corrida normal, este guión entra a pantallas de CONFIGURACIÓN** (Variables Globales,
Usuarios, Licencias, catálogos). **Cambiar una VG desde la web altera lo que hace la app móvil para un cliente
real.** En esas pantallas: **solo verificar que cargan y muestran datos.** No abrir formularios de edición, no
tocar toggles, no pulsar Guardar/Aplicar/Eliminar — **ni siquiera para ver qué hace**.

Ante la duda en una pantalla de configuración → **⛔ BLOCKED y preguntá.**

## PASO 0 — Pre-vuelo

1. **Playa y URL:** resolver `{QA_PLAYA}` contra `automation/web/playas.yaml` → `{base}`.
2. **Alcance:** `curl -s -o /dev/null -w "%{http_code}" {base}/pages/login.xhtml` → debe dar `200`.
3. **BD (es el oráculo principal, acá NO es opcional):**
   ```bash
   node automation/db/query.js {QA_CLIENTE} "SELECT count(*) FILTER (WHERE has_table_privilege('user_read', schemaname||'.'||tablename,'SELECT')) legibles, count(*) total FROM pg_tables WHERE schemaname='public'"
   ```
   Si `legibles < total` → **avisá**: sin BD, reportes e indicadores no se pueden contrastar y casi todo
   quedaría `WEB-N/A`. Preguntá si igual seguimos con las verificaciones de carga y filtros.
4. **RUN_DIR:** crear `automation/reports/web-extendido_{QA_CLIENTE}_{YYYYMMDD}_{HHMMSS}/`.
5. **Login:** bloque **`# USUARIO WEB {PLAYA}`** de `secrets/qa-credentials.env` (⚠ **NO** un bloque
   `# Cliente:` — ése es el usuario de la app). `{base}/pages/login.xhtml` →
   `input[placeholder="Usuario"]` / `input[placeholder="Clave"]` → `button.botonLogin` → debe caer en `/pages/main`.
6. **Guarda de playa:** `verificarContexto(await __qaW.contexto(), '<modulo>', <esDetalle>, '{QA_PLAYA}')`.
   Las 3 playas comparten las MISMAS rutas: sin esta guarda podés validar el servidor equivocado.

## CÓMO EJECUTAR

Recorré los **7 bloques del guión en orden** (reportes → indicadores → facturaciones → datos maestros →
visitas → estructura → configuración). Los primeros son los de mayor rendimiento; si hay que cortar, se corta
por el final.

- **Instalá el `BUNDLE_DOM` una vez por página** → `window.__qaW`. Leé con `__qaW.leerCabecera()`,
  `__qaW.leerTabla(id, N)`, `__qaW.tablaPorColumnas([...])`, `__qaW.contexto()`.
  ✗ **Nada de `browser_snapshot` para operar** (un snapshot de lista dio 76.000 caracteres y reventó el límite).
- **El oráculo es la BD:** para cada número que muestre la web, recalculalo con `query.js` y compará.
  Un reporte que da **de más** es tan defecto como uno que da de menos.
- **Filtros:** `Limpiar` → filtrar → `Buscar` → contar → comparar contra el mismo `WHERE` en SQL → `Limpiar`.
  ⚠ El filtro JSF **persiste entre navegaciones por URL**: verificá el `value` del input antes de confiar.
- **Números:** `parseNumeroFlexible` (la web es es-VE). **Conversión:** la dirección depende de la moneda
  (BS→US$ divide · US$→BS multiplica). **Fechas:** veredicto por día.
- **Sesión JSF:** si aparece `ViewExpiredException`, volvé a loguearte y seguí.
- **Gráficos:** no leas el canvas; validá la tabla o los valores numéricos que lo acompañan.
  Si solo hay gráfico ilegible → `WEB-N/A` con el motivo.
- **Techo de 2 intentos** por pantalla/selector → `⛔ BLOCKED` y seguir. No explorar a ciegas.

## VEREDICTOS

`WEB-OK` · `WEB-FIELD-MISMATCH` · `WEB-CALC-MISMATCH` · `WEB-N/A` · `⛔ BLOCKED`
⚠ **No aplica `WEB-MISSING`** (no hay registro del móvil que pueda faltar).
Pantalla vacía → `WEB-N/A` **tras confirmar en BD que no hay datos**, nunca defecto.

## SALIDAS

1. `{RUN_DIR}extendido.md` — un apartado por bloque: pantalla · caso · marca · **la aritmética explícita**
   de cada cálculo verificado (web vs BD) · diffs.
2. `{RUN_DIR}_web-results.jsonl` — una línea por caso:
   ```json
   {"run_id":"<RUN_ID>","capa":"web-extendido","modulo":"reportes","caso":"DWX-REP-001","marca":"WEB-OK","ms":0}
   ```
   ⚠ `"capa":"web-extendido"` para que **no se mezcle** con el ledger de las corridas normales.
3. **Hallazgos** al cierre, ordenados por impacto, separando **defecto de la web** de **falta de datos**.
4. **Patrones/selectores nuevos** → proponelos para `web-selectors/`.

## AL CERRAR

Resumí: cuántos casos por marca, **qué cálculos no cuadraron** (con los dos números y la diferencia),
qué pantallas quedaron `BLOCKED` y por qué, y qué revisarías primero.
Si miraste **Errores de aplicación** (`DWX-CFG-006`), destacá los errores recurrentes: son defectos reales
que ninguna prueba provocó.

═══════════════════════════════════════════════════════════
─── FIN DEL PROMPT ───
