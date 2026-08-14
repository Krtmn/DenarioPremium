# Smoke Test — Módulo LOGIN
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-05-29 |
| **RUN_ID** | `20260529_145657_smoke-completo` |
| **Módulo** | LOGIN |
| **App** | `com.kiberno.denarioPremiumPro` |
| **Chrome WebView** | 148.0.7778.178 |
| **Credenciales** | `***`/`***` (QA_USER=001) |
| **Resultado global** | 6 PASS · 0 FAIL · 0 SKIP · 3 N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-LOG-002 | Campos vacíos → modal aviso | ✅ PASS | ion-alert visible: header "Denario Premium", mensaje "Usuario y/o password no pueden ser vacios", botón OK — app permanece en `/login` |
| DM-LOG-003 | Contraseña incorrecta → modal error | ✅ PASS | ion-alert visible: header "Denario Premium", mensaje "Usuario y/o contraseña incorrectos.", botón OK — app permanece en `/login`, sync no iniciada |
| DM-LOG-004 | Activar "Recordar usuario" → checkbox marcado | ✅ PASS | `ion-checkbox[formcontrolname="recuerdame"]` checked=false→true tras click; etiqueta "Recordar Usuario" visible |
| DM-LOG-001 | Happy path login → sync iniciada | ✅ PASS | Credenciales QA válidas + Aceptar → app navegó a pantalla de sincronización (url permanece `/login` durante sync, luego `/home`) |
| DM-LOG-011 | Sincronización — feedback visual | ✅ PASS | `app-synchronization` visible con `ion-progress-bar`, `ion-spinner` y texto de tabla activa "Sincronizando - Documento de Venta / Por favor espere..." |
| DM-LOG-012 | Sincronización completada → Home | ✅ PASS | `url=http://localhost/home`, `app-home` visible, módulos Visitas / Inventarios / Pedidos / Devoluciones / Cobros / Depósitos / Vendedores / Productos / Clientes confirmados en DOM |
| DM-LOG-008 | Cambio de usuario (modal advertencia) | 🚫 N/A | `QA_USER2` no definido en `secrets/qa-credentials.env` (servidor :19001 no devuelve QA_USER2) |
| DM-LOG-009 | Cambio de usuario (confirmar) | 🚫 N/A | Depende de DM-LOG-008 — sin segunda cuenta QA |
| DM-LOG-017 | Arranque limpio | 🚫 N/A | Corrida normal sin reinstalación ni borrado de datos de app |

## Estado final

App en Home principal (`http://localhost/home`). Módulos visibles: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, Salir.

---
*Generado por Claude Code · Playwright MCP CDP · 2026-05-29 · RUN_ID 20260529_145657_smoke-completo*
