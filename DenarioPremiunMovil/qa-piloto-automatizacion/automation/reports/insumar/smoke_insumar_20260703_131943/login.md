# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260703_131943_smoke-completo` |
| Módulo | LOGIN |
| Cliente / Playa | insumar |
| Dispositivo | `14678405BR003855` |
| App | `com.kiberno.denarioPremiumPro` — Versión **1.0** (build 1) |
| Versión Denario (HOME) | `Versión 1.0` (label `<p>` en HOME; `Capacitor.App.getInfo` → version 1.0 / build 1) |
| CDP | `127.0.0.1:9220` |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert título "Denario Premium", mensaje "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario `003` + pass incorrecta `Test-LOG-003` → alert "Usuario y/o contraseña incorrectos."; permanece en `app-login` |
| DM-LOG-004 | ✅ PASS | Click checkbox "Recordar usuario" → `.checked` pasa de `false` a `true` |
| DM-LOG-001 | ✅ PASS | Usuario `003` + pass `123456` → overlay `app-synchronization` visible tras submit |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo durante la sync |
| DM-LOG-012 | ✅ PASS | Sync completa → `app-home` visible, URL `/home`; login no visible |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | N/A |

## Verificación BD
`BD-N/A` — módulo login no genera transacciones (RUNTIME §10).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón de dismiss del alert de login = **"OK"** (no "Aceptar") | universal (a confirmar) | Los alerts de validación de login (`Denario Premium`) se cierran con botón texto **"OK"**. `alertButtonCoords('Aceptar')` devuelve null; usar `alertButtonCoords('OK')`. El alert residual bloquea clicks (p.ej. el checkbox) hasta cerrarlo. `[ins-2703]` |
| Versión en HOME = `<p>Versión 1.0</p>` | universal | El HOME muestra la versión en un `<p>` de texto "Versión X.Y". Coincide con `Capacitor.App.getInfo()` (version/build). En este APK: version 1.0 / build 1 (dev build; NO refleja el marketing 6.6.x). `[ins-2703]` |
| `Capacitor.App.getInfo()` accesible por CDP | universal | `window.Capacitor.Plugins.App.getInfo()` → `{name, id, build, version}` — fuente confiable de versión/paquete post-login. `[ins-2703]` |

## Hallazgos (solo si hay FAIL)
Ninguno — 6/6 PASS.
