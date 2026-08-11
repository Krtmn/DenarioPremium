# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | `14678405BR003855` (Infinix X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (build 1) · `db_version=19` |
| Playa / Servidor | **La Tortuga** — `http://denariolatortuga.ddns.net:8081/PremiumWS` (descubierto en runtime) |
| Cliente | el_valle (usuario `001`) |
| `window.ng` | **true** |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

**Servidor efectivo — cómo se descubrió:** hook read-only sobre `Capacitor.nativePromise` registrando la `url` de cada
`CapacitorHttp`. Los POST observados fueron `…/PremiumWS/services/authservice/auth` (login) y
`…/PremiumWS/services/syncservice/getsync` (sincronización), ambos contra `denariolatortuga.ddns.net:8081`.
Confirma **La Tortuga** para esta corrida — verificado, no asumido. (Va al reporte, no al perfil del cliente.)

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → `ion-alert` "Denario Premium" / **"Usuario y/o password no pueden ser vacios"**, botón `OK` |
| DM-LOG-003 | ✅ PASS | Usuario `001` + contraseña incorrecta → alert **"Usuario y/o contraseña incorrectos."**; sigue en `/login` (no permite acceso). POST real a `authservice/auth` |
| DM-LOG-004 | ✅ PASS | `ion-checkbox` "Recordar Usuario": `checked false → true` tras `mouse.click` en el centro del bounding rect |
| DM-LOG-001 | ✅ PASS | Login válido → navega a `/synchronization` y aparece `app-synchronization` (~1 s) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` (`value=0`, indeterminado) y texto **"Sincronizando - Etiquetas / Por favor espere..."** |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` (~9.3 s): `/home` con `app-home` visible y `app-login` oculto. 9 módulos: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes (+ Sincronizar, SALIR) |

**Estado final:** HOME principal (`http://localhost/home`), listo para el módulo siguiente.

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | ninguno (módulo sin transacciones) | — |

## Verificación BD

`BD-N/A` — módulo de solo-lectura/autenticación, sin transacciones que cotejar (RUNTIME §10).

## Traza (QA_MODE=record)

**TRAZA: 21 ops · 6 casos grabados** → `automation/reports/smoke_el_valle_20260728_130612/_trace/login.trace.json`

- Los 6 casos terminaron PASS → se conservan todos los bloques de ops.
- **Sin credenciales en la traza:** los `fillIonInput` se grabaron con los placeholders `{{QA_USER}}` /
  `{{QA_PASSWORD}}` / `{{QA_BAD_PASSWORD}}`, declarados en `data`. Al reproducir, `substitute()` los cambia por los
  valores reales leídos de `secrets/qa-credentials.env` (RUNTIME §12: nunca grabar secrets).
- Un assert grabado con el patrón `ion-alert.textContent` devolvió `false` (ver hallazgo de selector abajo);
  se **purgó de la traza** y se regrabó el oráculo equivalente sobre `.alert-message`, que evalúa `true`.
- La traza usa un helper `clickSel(pg, selector)` que **no existe** en `denario-cdp-helpers.js`; el runner de
  replay debe proveerlo (documentado dentro del `.trace.json`).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| ⚠ `ion-alert.textContent` está **VACÍO** en este build — el texto solo se lee por `.alert-title` / `.alert-message` | universal (build v1.0 La Tortuga) | Todo oráculo de alert del tipo `alert.textContent.includes(...)` da falso negativo. Usar `document.querySelector('ion-alert:not(.overlay-hidden) .alert-message').textContent`. Es lo que hizo fallar un assert de traza con la app comportándose bien |
| Los `ion-alert` se **acumulan** en el DOM (7 nodos tras 3 alerts) | universal | Todos menos el activo quedan con `.overlay-hidden` + `offsetParent===null`. Reconfirma RUNTIME S5: filtrar SIEMPRE por `:not(.overlay-hidden)` + `offsetParent!==null` |
| Botón de alerts informativos de login = **"OK"** (no "Aceptar") | universal (La Tortuga v6.6.18+) | Reconfirma la nota `[ferrenuestro-20260723]` para el par (servidor La Tortuga, build actual) |
| `window.ng = **true**` en el_valle / La Tortuga | cliente + build | 3.ª confirmación del patrón: la conducción por componentes Angular está disponible para los módulos siguientes |
| Descubrimiento de servidor por hook `Capacitor.nativePromise` → `options.url` | universal | Recetas: registra la URL de cada `CapacitorHttp` sin alterar el envío. Da el host efectivo en el 1.er POST del login (`authservice/auth`) — no hace falta leer `claves.env` ni asumir el YAML |
| `setTimeout` **no existe** en el sandbox de `browser_run_code_unsafe` | universal (infra CDP) | `h.withTimeout` / `h.makeWatchdog` inlinados **verbatim revientan** con `ReferenceError: setTimeout is not defined`. Fix aplicado: construir el temporizador con `page.waitForTimeout(ms)` (la `page` del MCP). **Bloquea el watchdog de RUNTIME §11 en todos los agentes** hasta que se ajuste el helper |
| Login: selectores estándar sin cambios | cliente | `ion-input[placeholder="Usuario"]` / `[placeholder="Contraseña"]` (sin `name`), `ion-button[type="submit"]` ("Aceptar"), `ion-checkbox`; `mouse.click` simple bastó — no hizo falta el gesto compuesto de ferrenuestro |
| Versión de app reportada = **1.0 (build 1)** | cliente / build | `Capacitor.Plugins.App.getInfo()` y el pie del login coinciden en "Versión 1.0"; el APK no expone 6.6.18 por esta vía. `db_version=19` |

## Hallazgos (FAIL)

Ninguno. La app se comportó correctamente en los 6 casos: validó campos vacíos, rechazó credenciales inválidas
sin permitir acceso, persistió el toggle de "Recordar Usuario" y completó login + sincronización hasta HOME.

**Nota de infraestructura (no es defecto de app):** el `setTimeout` ausente en el sandbox MCP hizo fallar el primer
intento de arranque; se resolvió reimplementando el temporizador del watchdog sobre `page.waitForTimeout`. Sin
cuelgues de CDP (`0 hangs`), sin reconexiones y sin casos BLOCKED.
