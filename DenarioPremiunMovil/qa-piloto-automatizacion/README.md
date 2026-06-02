# QA piloto — Automatización Denario Premium móvil

Carpeta única de la iniciativa **regresión + automatización** (rama `feature/qa-guiones-regresion`).
No modifica código de producto (`src/`, Gradle, Capacitor de producción, etc.).

## Inventario de artefactos de la iniciativa

| Artefacto | Ubicación | ¿En git? |
|-----------|-----------|----------|
| Guiones de regresión | `guiones-regresion/` | Pendiente commit |
| Contexto Claude | `CLAUDE.md` | Pendiente commit |
| Dump Repomix | `denario-movil-para-claude.xml` | Pendiente commit |
| Esta carpeta piloto | `qa-piloto-automatizacion/` | Pendiente commit |
| Credenciales servidor | `../../claves.env` (raíz repo) | Ignorado — no mover |
| Credenciales QA login | `secrets/qa-credentials.env` | Ignorado — solo local |
| scrcpy | `../../tools/scrcpy/` (kiberno) | Fuera del repo |
| APK Yaque (ej.) | `Hidroponias_ElYaque_20260525.apk` | Fuera del repo |

## App bajo prueba (Android)

- **APK ejemplo:** `Hidroponias_ElYaque_20260525.apk`
- **Package id (Maestro / adb):** `com.kiberno.denarioPremiumPro`
- **Instalación:** `adb install -r "ruta\al\apk"`
- **Espejo laptop:** `scrcpy` (PATH: `kiberno\tools\scrcpy`)

## Herramientas por fase

| Fase | Herramienta | Alcance |
|------|-------------|---------|
| **Ahora** | Maestro + adb | UI en dispositivo (APK) |
| **Después** | Playwright (+ MCP) | Denario Premium **web** (validación cruzada móvil → web) |

## Estructura

```
qa-piloto-automatizacion/
  README.md                 ← este archivo
  CLAUDE.md                 ← reglas (tras migración)
  denario-movil-para-claude.xml
  guiones-regresion/
  automation/
    maestro/
      flows/                ← flujos YAML
      config.yaml           ← appId, env
    reports/                ← salida PASS/FAIL
  secrets/
    qa-credentials.env      ← local, no commitear
    qa-credentials.env.example
```

## Regla de edición

Solo se modifican archivos **dentro de `qa-piloto-automatizacion/`** con autorización explícita de la responsable QA.
Excepción: `claves.env` en la raíz del repo (config servidor), fuera de esta carpeta.

## Piloto login (primer entregable)

Casos objetivo: `DM-LOG-002`, `DM-LOG-003`, `DM-LOG-001` (ver `guiones-regresion/guion-login.md`).

```powershell
adb devices
maestro test automation/maestro/flows/login-smoke.yaml
```
