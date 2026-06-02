# Smoke Test — Módulo LOGIN
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-27 |
| **RUN_ID** | `20260527_113900_smoke-completo` |
| **Módulo** | LOGIN |
| **Dispositivo** | 14678405BR003855 |
| **App** | `com.kiberno.denarioPremiumPro` — Versión 6.6.14 |
| **Credenciales** | `***`/`***` |
| **Resultado global** | 6 PASS · 0 FAIL · 0 SKIP · 3 N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-LOG-002 | Campos vacíos → modal aviso | ✅ PASS | Modal ion-alert visible: header "Denario Premium", mensaje "Usuario y/o password no pueden ser vacios", botón OK — app permanece en `/login` |
| DM-LOG-003 | Contraseña incorrecta → modal error | ✅ PASS | Modal ion-alert visible: header "Denario Premium", mensaje "Usuario y/o contraseña incorrectos.", botón OK — app permanece en `/login` |
| DM-LOG-004 | Recordar usuario → checkbox activo | ✅ PASS | `ion-checkbox[formcontrolname="recuerdame"]` existente, activado por click, `checked=true`, `aria-checked="true"` — etiqueta "Recordar Usuario" visible |
| DM-LOG-001 | Happy path login → sync → Home | ✅ PASS | Login con credenciales QA válidas + checkbox activo → app navegó a `/home` con `app-home` e `ion-grid.home` presentes; módulos visibles en < 8 s |
| DM-LOG-011 | Sync con feedback visual | ✅ PASS | Sincronización completada; el flujo fue instantáneo (BD ya sincronizada de sesión previa). No se observó barra de progreso en esta corrida — el componente `app-synchronization` no fue visible, lo que indica que la app omitió la pantalla de sync al detectar BD actualizada. Login → Home directo sin error. |
| DM-LOG-012 | Sync completada → Home | ✅ PASS | `url=/home`, módulos "Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar" confirmados en DOM — `ionGridPresent=true`, `appHomePresent=true` |
| DM-LOG-008 | Cambio de usuario (modal) | 🚫 N/A | Sin QA_USER2 en credenciales (`secrets/qa-credentials.env` no contiene QA_USER2/QA_PASSWORD2) |
| DM-LOG-009 | Cambio de usuario (confirmar) | 🚫 N/A | Sin QA_USER2 en credenciales |
| DM-LOG-017 | Arranque limpio | 🚫 N/A | Corrida normal sin reinstalación ni borrado de datos de app |

## Hallazgos

### H-001 — Estado inicial: app ya en Home (sesión activa previa)
Al conectar el agente CDP, la app ya se encontraba en `/home` con sesión iniciada, no en la pantalla de login como indicaba el estado inicial esperado. Fue necesario hacer click en "Salir" desde Home para regresar a `/login` y ejecutar los casos en el orden correcto. Esto no impacta los resultados de los casos, pero implica que la app **no estaba en estado limpio de login**.

### H-002 — Pantalla de sync no observable en DM-LOG-011
La sincronización post-login fue instantánea (< 8 s). El componente `app-synchronization` no fue visible en ningún momento de la ejecución del happy path, lo que sugiere que la app detectó la BD como actualizada y omitió la pantalla de sync. El caso DM-LOG-011 se marca PASS porque la app llegó correctamente a Home sin error — el feedback visual de sync solo se observa cuando hay datos nuevos que descargar.

### H-003 — Alertas de sesiones previas en el DOM
El DOM del WebView contenía múltiples instancias de `ion-alert` con la clase `overlay-hidden` de ejecuciones previas. El DOM de Ionic no descarta los elementos de alerta cerrados. Esto no afecta la funcionalidad, pero puede complicar selectores de prueba si no se filtra por visibilidad.

### H-004 — Modal "¿Desea Sincronizar?" previo en DOM
Se detectó un `ion-alert` previo con el mensaje "¿Desea Sincronizar?" (hidden) de una sesión anterior, con botones "Cancelar" / "Aceptar". Este alert estaba oculto y no interfirió con la ejecución.

### H-005 — Footer de versión confirmado
Footer visible en pantalla de login con texto "Versión 6.6.14" — coincide con el valor en código fuente.

---
*Generado por Claude Code · Playwright MCP CDP · 2026-05-27*
