# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260708_174030_smoke-completo` |
| Módulo | LOGIN |
| Cliente | osoroma |
| Dispositivo | WebView CDP :9220 (El Yaque, window.ng=false) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Resultado | **5 PASS · 1 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert visible con mensaje: "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ❌ FAIL | No aparece alert de contraseña incorrecta (usuario: 001, password: Test-LOG-003) |
| DM-LOG-004 | ✅ PASS | Checkbox cambió de false a true |
| DM-LOG-001 | ✅ PASS | Overlay app-synchronization visible tras enviar formulario |
| DM-LOG-011 | ✅ PASS | app-synchronization con progress-bar activo |
| DM-LOG-012 | ✅ PASS | app-home visible con módulos tras completar sync |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| (ninguno) | Módulo LOGIN sin transacciones — solo autenticación | N/A |

---

## Hallazgos (FAIL detectado)

### DM-LOG-003: Falta validación de contraseña incorrecta

**Defecto:** Cuando se intenta login con usuario correcto (001) pero contraseña incorrecta (Test-LOG-003), no aparece alert de error. El botón INICIAR no dispara validación en servidor o la respuesta de error no se renderiza en UI.

**Precondición:**
- App en pantalla LOGIN
- Usuario: 001
- Contraseña: Test-LOG-003 (inválida)

**Paso:**
- Llenar campos → Click INICIAR

**Resultado esperado:** Alert "Usuario y/o contraseña incorrectos."  
**Resultado actual:** Sin alert (login no rechazado, sin feedback de error)

**Clasificación:** ❌ FAIL (defecto de validación en login)

---

## Patrones / selectores nuevos

**Selectores de LOGIN validados en corrida:**
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `app-login ion-input[placeholder="Usuario"]` | Universal | Input usuario sin atributo `name` — índice 0 entre ion-inputs de login |
| `app-login ion-input[placeholder="Contraseña"]` | Universal | Input contraseña sin `name` — índice 1 |
| `ion-button[type="submit"]` | Universal | Botón submit (texto "Aceptar") — click vía `pg.mouse.click()` con coords |
| `app-login ion-checkbox` | Universal | Checkbox "Recordar usuario" — toggle por click real en coords |
| `app-synchronization ion-progress-bar` | Universal | Overlay de sync con barra de progreso — usar `waitForFunction()` para esperar desaparición |
| `.alert-title` + `.alert-message` | Universal | Textos de ion-alert — filtrar por `:not(.overlay-hidden)` |

**Confirmado:** Todos los selectores funcionan en build El Yaque (window.ng=false) con click real de Playwright, sin dependencia de window.ng.

*(Comparar con tags: [gmp-2606][ins-2610][dth-2612] — selectores consistentes sin regresiones)*

---

**Duración total:** 14.6 segundos  
**Agente:** Denario QA · Módulo LOGIN · osoroma  
**Timestamp:** 2026-07-08 17:40:30 UTC
