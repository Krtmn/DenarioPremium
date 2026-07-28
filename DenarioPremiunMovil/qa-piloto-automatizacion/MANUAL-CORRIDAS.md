# Manual de corridas automatizadas — QA Denario Premium Móvil
## Guía de onboarding para el equipo QA (leída por Claude Code y por la persona)

> **Para tu Claude:** este archivo describe cómo operar el sistema de corridas automatizadas **sin alterar su estructura**. Léelo completo antes de tu primera corrida. La autoridad de reglas operativas sigue siendo `CLAUDE.md` + `automation/cdp/RUNTIME.md`.

---

## 1. ¿Qué es esto?

Un sistema para ejecutar el **smoke test** de Denario Premium Móvil (10 módulos, ~137 casos) en un dispositivo Android, de forma **automatizada de principio a fin**, usando **Claude Code + Playwright MCP + Chrome DevTools Protocol (CDP)**.

Tú pegas **un solo prompt** (el orquestador) y Claude:
1. Verifica la infraestructura.
2. Lanza 10 agentes de módulo, uno por uno.
3. Genera un reporte consolidado.
4. Consolida automáticamente los hallazgos nuevos en la memoria (Agente 11).

No se programa nada por fuera: todo ocurre dentro de la sesión de Claude Code.

---

## 2. Requisitos en tu máquina (verificar antes de la primera corrida)

| Requisito | Detalle |
|-----------|---------|
| **Claude Code CLI** | Instalado y autenticado (**misma cuenta del equipo** — resuelve el login, pero NO instala el MCP por ti, ver abajo) |
| **Carpeta del proyecto** | `qa-piloto-automatizacion/` completa (te la pasa el equipo comprimida, **con `secrets/` incluido**). Ver §6 sobre cómo mantenerla sincronizada |
| **Dispositivo Android** | Físico (USB + depuración) **o emulador** (Android Studio). adb lo trata igual; `adb devices` debe listarlo |
| **APK de desarrollo (debug)** | Denario instalado en el dispositivo/emulador, package `com.kiberno.denarioPremiumPro`. Debe ser build **debug/debuggable** (el WebView solo expone devtools/CDP en builds debuggables) |
| **adb** | Android platform-tools en el PATH |
| **Playwright MCP** | **Agregado en tu máquina** (provee las herramientas `browser_*`). Usar la misma cuenta **no** lo instala: la config del MCP es local. Agrégalo igual que el equipo y confirma que aparezcan las herramientas `mcp__playwright__*` |
| **Credenciales QA** | `secrets/qa-credentials.env` — **viene incluido en la carpeta** que te pasan. Sin él, el login falla |
| **(opcional) permisos** | El `.claude/settings.local.json` del equipo (allowlist) reduce los prompts de permiso; pídelo si quieres, pero tiene rutas de la máquina del equipo |
| **(opcional) scrcpy** | Espejar la pantalla del dispositivo en la laptop |

> **Misma cuenta de Claude:** comparten autenticación y facturación, pero **no** sincroniza MCP servers ni permisos entre máquinas (esos son locales). Por eso el Playwright MCP hay que agregarlo en cada máquina.
> **Emulador:** funciona **igual** que un dispositivo físico — adb ve el emulador como un device y el `adb forward` al socket del WebView es idéntico. Único requisito: que la APK sea **debuggable**.
> **Rutas:** las referencias al helper son **relativas** (`automation/cdp/denario-cdp-helpers.js`) → **portables**: funcionan en cualquier máquina/ubicación sin editar nada. *(Algunos docs de dev/build —`README_CAPACITOR_ANDROID.md`, `guia-sync-git-rama-qa.md`— traen rutas de ejemplo de la máquina del equipo; son ilustrativas y no afectan las corridas.)*

### Configurar el Playwright MCP (una vez, en tu máquina)
La definición del MCP **no** viaja con la carpeta ni con la cuenta — vive en tu config global. Agrégalo así:
```
claude mcp add playwright npx @playwright/mcp@latest
```
Verifica con `claude mcp list` y que en Claude Code existan las herramientas `mcp__playwright__*`.

**Sobre carpetas del equipo que NO necesitas pedir:**
- `.playwright-mcp/` → **no** (son solo logs de runtime, se regeneran solos).
- `.claude/` del proyecto (`settings.local.json`) → **opcional** (allowlist de permisos; ahorra prompts pero trae rutas del equipo). Puedes empezar limpio y aprobar permisos sobre la marcha.

---

## 3. Cómo hacer una corrida (paso a paso)

### ⭐ Tu primera corrida (checklist guiado)

Sigue esto en orden la primera vez:

**Antes de abrir Claude Code**
1. [ ] Arranca tu **emulador** (Android Studio) con la app Denario (APK **debug** instalada).
2. [ ] `adb devices` → debe aparecer tu emulador (ej. `emulator-5554   device`).
3. [ ] `adb shell pm list packages | findstr denario` → debe salir `com.kiberno.denarioPremiumPro`.
4. [ ] Confirma el **Playwright MCP**: en Claude Code deben existir las herramientas `mcp__playwright__*`.
5. [ ] Verifica que la carpeta tiene `secrets/qa-credentials.env`.

**Pre-vuelo CDP**
6. [ ] Corre `.\automation\cdp\setup-cdp.ps1` → debe terminar con "CDP listo en :9220". (Si falla el forward, el script te dice el comando a repetir.)

**Lanzar**
7. [ ] Abre una sesión **nueva** de Claude Code en la carpeta del repo, en **Opus**.
8. [ ] Pega **completo** `guiones-regresion/prompt-orquestador-smoke.md` indicando `QA_CLIENTE=insumar`.
9. [ ] Déjalo correr: 10 módulos en secuencia → consolidado → Agente 11. No necesitas estar presente entre módulos.

**Al terminar**
10. [ ] Lee `reports/smoke_insumar_<fecha>/consolidado.md`.
11. [ ] Revisa lo que el Agente 11 tocó en `module-selectors/` y el YAML del cliente. **No lo compartas de vuelta sin avisar al equipo** (ver §6).

> Si un módulo se traba, no pasa nada: su reporte lo registra y la corrida continúa. Si ves un FAIL que no entiendes, avísale al equipo.

---

### Detalle de cada paso

### Paso A — Pre-vuelo (infraestructura)
Conecta el dispositivo y ejecuta el pre-flight:
```powershell
.\automation\cdp\setup-cdp.ps1
```
Esto verifica dispositivo, instala/lanza la app, encuentra el socket WebView, configura el port-forward `:9220` y comprueba que CDP responde. Si algo falla, el script te dice qué.

> Si el `adb forward` se cae a mitad de corrida (pasa a veces), vuelve a correr el script o el comando de forward que indica.

### Paso B — Lanzar la corrida
1. Abre una sesión nueva de Claude Code en la carpeta del repo.
2. Pega **completo** el contenido de `guiones-regresion/prompt-orquestador-smoke.md`, indicando el cliente:
   ```
   QA_CLIENTE=insumar
   ```
3. Recomendado: corre la sesión en **Opus** (el Agente 11 de consolidación hereda ese modelo y la clasificación de memoria mejora).

Claude hará el resto: 10 módulos en secuencia + consolidado + consolidación de memoria. No necesitas estar frente a la pantalla entre módulos.

**Corrida de GRABACIÓN (opcional — para acelerar las corridas futuras del mismo cliente/build):** añade una segunda línea al lanzar:
```
QA_CLIENTE=insumar
QA_MODE=record
```
La corrida es **igual de larga que siempre**, pero además **graba** en `{RUN_DIR}_trace/` la secuencia de operaciones que funcionaron en ese build. Esa traza es la que después permitirá re-correr al mismo cliente en minutos en vez de horas (modo replay). Grabar es aditivo: **si la grabación falla, la corrida sigue normal**. Sin la línea `QA_MODE`, nadie graba y todo funciona como hoy. Detalle: `automation/replay/README.md`.

**Si un módulo se cuelga:** ya no se come la corrida. Desde 2026-07-28 cada módulo tiene un **techo de tiempo** (60 min cobros/pedidos, 45 min el resto) y corta a los 2 cuelgues de CDP. Verás en el consolidado `MODULO ABORTADO: <motivo>` y la corrida **sigue con el módulo siguiente**. Una corrida con módulos abortados es **parcial** → no corre el Agente 11 (la memoria se consolida en la próxima corrida completa).

### Paso C — Cierre (único checkpoint manual)
Al terminar, **revisa el `git diff`** de `automation/cdp/module-selectors/` y del YAML del cliente — ahí está lo que el Agente 11 escribió en la memoria. Si todo se ve bien, coordina el commit con el equipo (ver §6). **No hagas push de cambios de memoria/estructura sin avisar.**

---

## 4. Arquitectura

### Flujo end-to-end
```
PRE-VUELO (manual)    setup-cdp.ps1  →  app + CDP en :9220
        │  pegar prompt-orquestador-smoke.md (QA_CLIENTE=<slug>)
        ▼
ORQUESTADOR (Claude Code, 1 sesión, Opus)
  Paso 0   verifica CDP + credenciales · lee RUNTIME.md + clientes/<cliente>.yaml
  Paso 1-5 lanza 10 agentes de módulo, uno a uno:
             ┌─────────────────────────────────────────────┐
             │ Agente de módulo                            │
             │  lee: RUNTIME.md + smoke/smoke-<mod>.md +    │
             │       su sección de module-selectors/     │
             │  usa: denario-cdp-helpers.js + credenciales  │
             │  escribe: reports/<RUN_DIR>/<mod>.md         │
             │     · casos PASS/FAIL/SKIP/N/A               │
             │     · registros creados                      │
             │     · "## Patrones / selectores nuevos"      │
             └─────────────────────────────────────────────┘
  Paso 6   genera reports/<RUN_DIR>/consolidado.md
  Paso 7   si 10/10 completaron → Agente 11 (consolidación automática):
             lee los "Patrones nuevos" de los reportes y los promueve:
               · DOM/anti-patrón  → module-selectors/ (con tag de corrida)
               · VG/dato cliente   → inline en clientes/<cliente>.yaml
               · 2+ corridas       → RUNTIME.md / helpers.js
        ▼
CIERRE (manual)   git diff → revisar lo promovido → commit coordinado
```

### Capas de archivos
| Capa | Archivos | Rol |
|------|----------|-----|
| Orquestación | `guiones-regresion/prompt-orquestador-smoke.md` | El prompt que dispara la corrida |
| Reglas operativas | `automation/cdp/RUNTIME.md` · `denario-cdp-helpers.js` · `module-selectors/` | Reglas CDP, helpers, selectores probados |
| Definición de pruebas | `automation/smoke/smoke-*.md` | Lo que ejecuta el agente |
| ↳ fuente | `guiones-regresion/guion-*.md` | Catálogo manual completo por módulo |
| Datos por cliente | `automation/clientes/*.yaml` (+ `_schema.yaml`) | VGs y datos de prueba |
| Memoria/mantenimiento | `guiones-regresion/prompt-consolidar-hallazgos.md` | Promueve patrones (lo corre el Agente 11) |
| Salida | `automation/reports/smoke_<cliente>_<fecha>/` | Evidencia por corrida |
| Credenciales | `secrets/qa-credentials.env` | Login QA (gitignored) |

### Modelo de memoria (sin buffers intermedios)
```
Captura  →  reporte de cada módulo ("## Patrones nuevos")   [evidencia]
Promoción → Agente 11 clasifica y escribe directo:
              module-selectors/   ← DOM universal (1 confirmación + tag)
              clientes/<x>.yaml      ← VG/dato de cliente
              RUNTIME.md / helpers.js ← regla profunda (2+ corridas)
```
Que `module-selectors/` se mantenga afilado es lo que abarata las corridas: el agente lee selectores probados y **no re-explora el DOM a ciegas**.

---

## 5. Qué hace el agente / qué NO debe hacer

**Sí (esperado):**
- Ejecutar los casos del smoke leyendo RUNTIME + smoke + module-selectors.
- Escribir el reporte de la corrida (incluida la sección "Patrones nuevos").
- Dejar que el Agente 11 consolide al cierre.

**No (sin proponer antes — ver §6):**
- Editar a mano la **estructura**: `RUNTIME.md`, `denario-cdp-helpers.js`, `smoke/*`, `guiones/*`, `prompt-orquestador-smoke.md`, `prompt-consolidar-hallazgos.md`, `_schema.yaml`, `CLAUDE.md`.
- Borrar o renombrar archivos/carpetas.
- Cambiar la convención de nombres de reportes o la estructura de carpetas.
- Inventar selectores nuevos en module-selectors fuera del flujo del Agente 11.

> Regla para tu Claude: **si detectas una mejora a la estructura, NO la apliques — descríbela como propuesta** (ver §6) y espera aprobación del equipo.

---

## 6. Gobernanza — cómo evitar el desorden entre equipos

El sistema lo mantienen **dos personas en máquinas distintas**. Para que no diverja:

### Principio
**Una sola fuente de verdad: la copia maestra del equipo.** Tu carpeta es una **copia de trabajo**. Todo cambio a estructura/memoria se **propone** y lo **integra el equipo** en la maestra (da igual si se sincroniza por git o por carpeta comprimida).

### Tres categorías de archivos
| Categoría | Archivos | Regla |
|-----------|----------|-------|
| **Salida (libre)** | `automation/reports/smoke_*/` | Carpetas únicas por corrida → no chocan. Commitea/comparte libremente. |
| **Memoria (revisar antes de pushear)** | `module-selectors/`, `clientes/*.yaml` | El Agente 11 las edita automáticamente. Revisar el `git diff` y **coordinar el push** (no pushear sin avisar). |
| **Estructura (proponer primero)** | `RUNTIME.md`, `helpers.js`, `smoke/*`, `guiones/*`, prompts, `_schema.yaml`, `CLAUDE.md` | **No editar a mano sin proponer.** |

### Flujo de cambios (durante el onboarding)
1. **Trabaja sobre la última copia** que te pasó el equipo. No edites a mano la estructura.
2. **Corres normal.** El Agente 11 consolida tu memoria **local** (en tu copia).
3. **Al terminar:** mira lo que el Agente 11 tocó (`module-selectors/`, YAML del cliente) y el `consolidado.md`. Si hay hallazgos útiles (memoria) o ideas de mejora (estructura):
   - **No los apliques a la maestra.** Anótalos en `PROPUESTAS-CAMBIOS.md` y avísale al equipo (mensaje/llamada), adjuntando los archivos que cambiaron o el resumen del Agente 11.
4. **El equipo integra** las propuestas aprobadas en la copia maestra y te **re-comparte** la carpeta actualizada. Trabajas desde esa nueva versión en adelante.

> En resumen: **reportes = libres** (carpetas únicas, no chocan). **Memoria y estructura = se proponen y el equipo integra.**
> Cuando ambas estén cómodas, lo ideal es migrar a **git compartido** (rama `feature/qa-guiones-regresion`): el flujo pasa a `git pull` antes / `git diff` después / push coordinado, y se acaba el pasar carpetas a mano.

### Registro de propuestas
Toda mejora propuesta se anota en `PROPUESTAS-CAMBIOS.md` (qué, por qué, quién, fecha) **antes** de aplicarse a la estructura. Es el lugar donde el equipo ve y aprueba los cambios.

---

## 7. Contingencias rápidas
| Situación | Acción |
|-----------|--------|
| CDP no responde en `:9220` | Re-correr `setup-cdp.ps1` o el `adb forward` con el PID actual del WebView |
| La app se cerró | Relanzar: `adb shell am start -n com.kiberno.denarioPremiumPro/.MainActivity` |
| Diálogo nativo de Android en pantalla | Descártalo manualmente en el dispositivo (CDP no lo controla) |
| Corrida parcial/interrumpida | No se dispara el Agente 11 (guarda de completitud). Los patrones quedan en los reportes para la próxima corrida completa |
| Credenciales no encontradas | Verifica que `secrets/qa-credentials.env` existe en la raíz de `qa-piloto-automatizacion/` |

---

*Manual de onboarding · QA Denario Premium Móvil · mantener junto a `CLAUDE.md` y `README.md`.*
