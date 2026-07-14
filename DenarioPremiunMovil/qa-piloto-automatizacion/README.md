# QA piloto — Automatización Denario Premium Móvil

Carpeta única de la iniciativa **regresión + automatización smoke** (rama `feature/qa-guiones-regresion`).
No modifica código de producto (`../src/`, Gradle, `../android/`).

> **Reglas operativas y de edición:** ver `CLAUDE.md` (autoridad del proyecto).
> Este README es solo el mapa de la carpeta.

## App bajo prueba

| Dato | Valor |
|------|-------|
| Package | `com.kiberno.denarioPremiumPro` |
| Stack | Ionic + Angular 19 + Capacitor 6 |
| Plataforma | Android (APK de desarrollo vía `adb install -r`) |
| Espejo laptop | scrcpy (`kiberno/tools/scrcpy`) |

## Cómo se prueban (arquitectura actual)

Automatización UI por **Playwright MCP + Chrome DevTools Protocol (CDP)** sobre la WebView de la app en el dispositivo (`:9220`). Un **orquestador** lanza 10 agentes de módulo en secuencia.

```
Pre-vuelo:  automation/cdp/setup-cdp.ps1            → app + CDP en :9220
Orquestar:  pegar guiones-regresion/prompt-orquestador-smoke.md   (QA_CLIENTE=<slug>)
            lee RUNTIME.md + clientes/<cliente>.yaml
Ejecutar:   10 agentes; cada uno lee RUNTIME.md + smoke/smoke-<modulo>.md + module-selectors/
            usa denario-cdp-helpers.js + secrets/qa-credentials.env
Salida:     automation/reports/smoke_<cliente>_<fecha>/   (+ consolidado.md)
Cierre:     Agente 11 automático (prompt-consolidar-hallazgos)  → promueve patrones de los reportes a module-selectors/YAML
```

## Mapa de la carpeta

| Ruta | Función |
|------|---------|
| `CLAUDE.md` | Reglas del proyecto (autoridad) |
| `guiones-regresion/guion-*.md` | Catálogo manual completo por módulo |
| `guiones-regresion/prompt-orquestador-smoke.md` | Prompt que dispara la corrida de 10 módulos |
| `guiones-regresion/prompt-consolidar-hallazgos.md` | Mantenimiento post-corrida (memoria) |
| `automation/cdp/RUNTIME.md` | Reglas operativas CDP (lectura obligatoria de cada agente) |
| `automation/cdp/denario-cdp-helpers.js` | Helpers canónicos (connectCdp, fillIonInput, fetchCreds, …) |
| `automation/cdp/module-selectors/` | Selectores probados por módulo |
| `automation/cdp/setup-cdp.ps1` | Preflight ADB/CDP |
| `automation/smoke/smoke-*.md` | Subset smoke que ejecuta cada agente |
| `automation/clientes/*.yaml` | VGs y datos por cliente (`_schema.yaml` = esquema) |
| `automation/reports/` | Evidencia por corrida (índice y convención en `reports/README.md`) |
| `secrets/qa-credentials.env` | Login QA (gitignored) |
| `denario-movil-para-claude.xml` | Dump Repomix del código (referencia, ~800k tokens — no leer completo) |

## Credenciales

| Uso | Archivo |
|-----|---------|
| Servidor (`WsUrl`) | `../../claves.env` (raíz repo) |
| Login QA en app | `secrets/qa-credentials.env` (gitignored; leído directo por `fetchCreds()`) |

No escribir credenciales reales en guiones, reportes ni chat.

## Regla de edición

Solo se modifican archivos **dentro de `qa-piloto-automatizacion/`** con autorización explícita de la responsable QA. Excepción: `../../claves.env` (config servidor). Detalle en `CLAUDE.md`.
