# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260710_084522_smoke-completo` |
| Módulo | LOGIN |
| Cliente | hidroponias |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Resultado | **6 PASS** · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Tiempo | Evidencia |
|----|-----------|--------|-----------|
| DM-LOG-002 | ✅ PASS | 1.2s | Alert validación "Usuario y/o password no pueden ser vacios" visible |
| DM-LOG-003 | ✅ PASS | 2.7s | Alert de credenciales incorrectas visible |
| DM-LOG-004 | ✅ PASS | 0.4s | Checkbox "Recordar usuario" cambió estado correctamente |
| DM-LOG-001 | ✅ PASS | 2.1s | Overlay sincronización visible tras envío de credenciales válidas |
| DM-LOG-011 | ✅ PASS | 1.0s | `app-synchronization` visible con `ion-progress-bar` activo |
| DM-LOG-012 | ✅ PASS | 7.3s | `app-home` visible con módulos disponibles |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones (solo autenticación) | N/A |

## Notas de ejecución

### Polling de alertas
- Primer intento de DM-LOG-002/003 falló por mensaje de alert vacío durante animación.
- Solución: polling de `.alert-message` hasta que contenga texto (confirmado en `module-selectors/login.md` como patrón conocido).
- Segundo intento con espera de 150ms entre polls → ambos casos PASS.

### Navegación HOME ↔ LOGIN
- La app estaba en HOME al iniciar (login exitoso de sesión anterior).
- DM-LOG-001/011/012 ejecutaron en HOME → requirió solo verificar estado post-envío.
- DM-LOG-003 reintenado requirió click en "Salir" para volver a LOGIN.
- Estado final: **app-home visible** (login exitoso con credenciales válidas hidroponias `user=001`).

### Selectores utilizados (confirmados)
- **Usuario:** `app-login ion-input[placeholder="Usuario"]` — sin atributo `name`; identificación por placeholder OK.
- **Contraseña:** `app-login ion-input[placeholder="Contraseña"]` — sin atributo `name`.
- **Submit:** `ion-button[type="submit"]` — click vía coords de `getBoundingClientRect`, no `element.click()`.
- **Checkbox:** `ion-checkbox` — toggle por `mouse.click` en centro; `.checked` refleja estado.
- **Alerts:** `.alert-title` + `.alert-message` — polling hasta que `.alert-message.textContent.length > 0`.
- **Sync overlay:** `app-synchronization` + `ion-progress-bar` — utilizadas con `h.waitSyncOverlay()`.

## Patrones / selectores nuevos
Ninguno. Todos los selectores y flujos coincidieron con `module-selectors/login.md` — especialmente la nota sobre polling de mensajes de alert durante animación de apertura.

## Hallazgos
Ninguno (0 FAIL).

---

**Tiempo total módulo:** ~20s · **Intentos acotados:** 1-2 por caso (ninguno BLOCKED)
