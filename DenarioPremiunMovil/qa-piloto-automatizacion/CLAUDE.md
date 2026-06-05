# Claude — QA piloto Denario Premium móvil

**Raíz de trabajo (cwd):** `DenarioPremiunMovil/qa-piloto-automatizacion/`  
**Rama:** `feature/qa-guiones-regresion` — no tocar `main` ni publicar sin autorización.

## Alcance de edición

- **Solo** crear o editar archivos bajo `qa-piloto-automatizacion/` con autorización explícita de la responsable QA.
- **Prohibido** modificar código de producto: `../src/`, configs de build, `../android/` salvo instrucción explícita.
- **`../../claves.env`** (raíz `DenarioPremium/`): solo si la QA pide cambio de `WsUrl` servidor.
- No ejecutar `git commit`, `git push` ni PR salvo petición explícita.

## Política de limpieza de archivos (aplicar siempre)

| Situación | Acción |
|-----------|--------|
| Archivo **completamente reemplazado** por otro | **Eliminar** — no dejar stubs |
| Archivo **parcialmente supersedido** con valor histórico | Mover a `automation/archive/` (Fase 4) |
| Archivo **en transición activa** (se refactoriza en fase futura) | Mantener hasta que la fase lo reemplace |

Nunca dejar archivos stub de solo redirección — si no tiene contenido útil, no existe.

## Referencias rápidas

| Recurso | Ruta (desde esta carpeta) |
| --- | --- |
| **RUNTIME (reglas operativas CDP)** | `automation/cdp/RUNTIME.md` |
| **Helpers CDP** | `automation/cdp/denario-cdp-helpers.js` |
| **Perfiles de cliente** | `automation/clientes/{cliente}.yaml` (hidroponias, insumar, romher) |
| **Smoke extracts** | `automation/smoke/` (Fase 2 — en construcción) |
| **Orquestador smoke** | `guiones-regresion/prompt-orquestador-smoke.md` |
| Guiones de regresión (completos) | `guiones-regresion/guion-*.md` |
| Reportes de corridas | `automation/reports/smoke_{cliente}_{YYYYMMDD}_{HHMMSS}/` (una carpeta por corrida) |
| Dump Repomix | `denario-movil-para-claude.xml` |
| Código fuente (lectura) | `../src/` |
| Config servidor (lectura) | `../../claves.env` |
| Credenciales login QA | `secrets/qa-credentials.env` (gitignored) |
| Credenciales multi-playa | `secrets/playas/{playa_id}.env` (gitignored, Fase 3) |
| APK / dispositivo | ver `README.md` |

El XML se generó desde la raíz móvil; rutas internas del dump usan `src/app/...` (relativas al proyecto `DenarioPremiunMovil`).

### Cómo usar el XML (ahorro de tokens)

- **No** pegues ni reproduzcas el XML completo en el chat (~800k tokens).
- Lee `denario-movil-para-claude.xml` por búsqueda o fragmentos según el módulo.
- Complementa con `../src/` solo si el XML no basta.
- **No** reproduzcas credenciales, `claves.env`, API keys ni tokens.

---

## Rol esperado

**Lead QA técnico** sobre **Ionic + Angular + Capacitor** (Denario Premium móvil). Foco: **Android** con **APK de desarrollo** instalado vía `adb`.

## Prueba móvil (operación habitual)

| Elemento | Detalle |
| --- | --- |
| App | APK QA (ej. Yaque) — `adb install -r` |
| Package | `com.kiberno.denarioPremiumPro` |
| Espejo laptop | scrcpy — `kiberno/tools/scrcpy` |
| Automatización UI | **Maestro** + adb (piloto login primero) |
| Playwright | **Fase posterior** — solo Denario Premium **web** (validación cruzada móvil → web) |

## Credenciales

| Uso | Archivo |
| --- | --- |
| Servidor (`WsUrl`) | `../../claves.env` |
| Login QA en app | `secrets/qa-credentials.env` |

No escribir credenciales reales en guiones ni en chat.

## Automatización CDP (estado actual)

- **Smoke completo:** 10 módulos, ~130 casos, Playwright MCP + CDP (`:9220`)
- **Clientes activos:** Hidroponias · Insumar · Romher (TBD)
- **Orquestador:** `guiones-regresion/prompt-orquestador-smoke.md` — especificar `QA_CLIENTE=<slug>`
- **Última corrida estable:** RUN_ID `20260529_145657_smoke-completo` (103 PASS / 3 FAIL)
- **Arquitectura:** 4 fases completadas ✅

## Estructura de automatización

```
automation/
  cdp/
    RUNTIME.md              ← reglas operativas (SIEMPRE leer — reemplaza todo lo anterior)
    denario-cdp-helpers.js  ← helpers canónicos + mockCameraAdjunto + fetchCreds desde archivo
  clientes/
    _schema.yaml            ← esquema de perfil
    hidroponias.yaml        ← VGs y datos reales (corridas 20260527/20260529)
    insumar.yaml            ← requiredCollectionAttachments=false confirmado
    romher.yaml             ← template TBD (activo en El Yaque)
  smoke/
    smoke-login.md          ← extract smoke por módulo (10 archivos)
    smoke-clientes.md
    smoke-pedidos.md
    smoke-cobros.md         ← incluye lógica adjunto por VG
    smoke-devoluciones.md
    smoke-inventarios.md    ← incluye nota crítica fillNgModelKeyboard
    smoke-depositos.md      ← verifica aplica=true antes de ejecutar
    smoke-visitas.md        ← incluye notas DM-VIS-015/022/031
    smoke-productos.md
    smoke-vendedores.md
  reports/
    lecciones-aprendidas-cdp.md  ← ARCHIVO HISTÓRICO (no leer en corridas)
    lecciones-DELTA.md           ← novedades última corrida (resetear cada run)
    smoke-*.md                   ← reportes de corridas anteriores
```

## Flujo de una corrida

1. Especificar `QA_CLIENTE` (ej. `hidroponias`)
2. Verificar CDP activo en `:9220` y `secrets/qa-credentials.env` existe
3. Pegar prompt del orquestador en sesión nueva de Claude Code
4. El orquestador lee `RUNTIME.md` + `clientes/{QA_CLIENTE}.yaml` + `lecciones-DELTA.md`
5. Lanza 10 agentes secuenciales — cada uno lee `RUNTIME.md` + `smoke-{modulo}.md`
6. Al finalizar: reporte consolidado + actualizar `lecciones-DELTA.md` con novedades

---

## Guiones de regresión (redacción)

### Objetivo

Guiones **manuales** amplios, **un módulo por entrega**, casos **reproducibles solo con UI** en Android.

### Reproducibilidad manual (obligatorio)

- Incluir happy path, validaciones UI, credenciales incorrectas alcanzables por UI, modales visibles.
- **No** incluir como filas: ADB, `localStorage`, modo avión, forzar HTTP/errorCode salvo login 104.
- Precondiciones en lenguaje observable, no claves internas.

### Lista de módulos (orden sugerido)

`login`, `clientes`, `productos`, `pedidos`, `cobros`, `inventarios`, `devoluciones`, `depositos`, `visitas`, `vendedores`

### Identificadores

Formato `DM-<ABREV>-NNN` (ej. `DM-LOG-001`). Ver tabla ABREV en guiones existentes.

### Entrega al crear cada guión

1. Escribir Markdown en `guiones-regresion/guion-{modulo}.md`.
2. Confirmar ruta absoluta final, por ejemplo:  
   `C:\Users\Personal\OneDrive\Documentos\kiberno\DenarioPremium\DenarioPremiunMovil\qa-piloto-automatizacion\guiones-regresion\guion-login.md`

### Mensajes cortos (misma sesión)

> Igual procedimiento `CLAUDE.md`. Módulo: **{nombre}**. IDs `DM-{ABREV}-###`. Archivo: `guiones-regresion/guion-{modulo}.md`.

---

## Dudas bloqueantes

Antes de trabajo largo, lista numerada de preguntas si el flujo no es reproducible desde XML/código. Documentar supuestos en «Supuestos y lagunas» si la QA pide avanzar igual.
