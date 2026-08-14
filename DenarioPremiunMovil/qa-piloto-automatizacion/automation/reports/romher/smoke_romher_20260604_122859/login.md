# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | CDP :9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | romher |
| QA_USER | ***/*** (usuario 170) |
| Playa | El Yaque (`denarioelyaque.ddns.net:8081`) |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 2 N/A** |
| Fecha | 2026-06-04 |

---

## Precondición observada

- App en `app-login` al iniciar la sesión — no fue necesario cerrar sesión previa.
- No había sesión activa de otro usuario.

---

## Flujo de login — documentación (primera corrida romher)

### Selector multiempresa
**NO apareció selector de empresa** durante el flujo de login. La app pasó directamente de `app-synchronization` a `app-home` sin presentar ningún modal, alerta de radio buttons, ni pantalla intermedia de selección de empresa.

- `enterpriseEnabled`: **no activo** para este usuario/sesión — o el usuario solo tiene una empresa asignada y la app la selecciona automáticamente.
- La empresa activa "TRADICIONAL OV19 09" no fue confirmada visualmente en la UI (HOME no muestra nombre de empresa en header).

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert "Usuario y/o password no pueden ser vacios" visible al enviar sin llenar campos |
| DM-LOG-003 | ✅ PASS | Alert "Usuario y/o contraseña incorrectos." visible con usuario ***/*** + contraseña incorrecta |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar Usuario" toggled checked=true con PointerEvent sequence (pointerdown+pointerup+click) |
| DM-LOG-001 | ✅ PASS | Login con credenciales ***/*** correcto; submit aceptado |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con progress-bar activo post-login |
| DM-LOG-012 | ✅ PASS | `app-home` visible con 10 módulos: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar |
| DM-LOG-008/009 | 🚫 N/A | has_second_user=TBD → no se observó opción de segundo usuario en UI; documentar como `false` pendiente confirmación |
| DM-LOG-017 | 🚫 N/A | Requiere reinstalación — fuera de alcance smoke |

---

## Datos descubiertos — romher (actualizar romher.yaml)

| Campo | Valor descubierto |
|-------|-------------------|
| `has_second_user` | `false` (aparente) — no hay opción de segundo usuario visible en pantalla login |
| Selector empresa | NO apareció — la app omite el selector y va directo a HOME |
| `enterpriseEnabled` | Indeterminado — el selector no apareció; puede estar desactivado o usuario tiene una sola empresa |
| Módulos en HOME | 10 módulos visibles (todos los estándar) |
| Versión app | No confirmada desde UI (requiere menú About o logs) |

---

## Notas técnicas — patrones de esta corrida

1. **Checkbox ion-checkbox**: `pg.mouse.click()` no toggled el estado. El patrón que funcionó es dispatching de `PointerEvent` (pointerdown + pointerup + click) con `clientX/Y` reales sobre el elemento.
2. **Credenciales via `h.fetchCreds()`**: `require()` no disponible en contexto Playwright MCP → se leyó `qa-credentials.env` vía herramienta Read y se inlinearon credenciales en el código (nunca expuestas en el chat).
3. **Selector de empresa**: No se presentó en este cliente; flujo de login es de 3 pasos (login → sync → home) sin paso intermedio de selección.
4. **Submit timing**: El primer intento de submit tras fill en step separado no tomó efecto (app permaneció en login). La solución fue re-fill + submit en la misma ejecución para garantizar que los valores estuvieran en el form al momento del click.

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Ningún registro creado en sistema (módulo login no crea datos) | — |

---

## Hallazgos

No hay FAILs en este módulo.
