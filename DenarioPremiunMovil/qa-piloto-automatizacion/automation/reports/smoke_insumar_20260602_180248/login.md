# Smoke Test — Módulo LOGIN
## Android USB · Playwright MCP + CDP

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-06-02 |
| **RUN_ID** | `20260602_180248_smoke-completo` |
| **Módulo** | LOGIN |
| **Cliente** | insumar |
| **App** | `com.kiberno.denarioPremiumPro` |
| **Chrome WebView** | 148.0.7778.179 |
| **URL inicial** | `http://localhost/login` |
| **Resultado global** | 6 PASS · 0 FAIL · 0 SKIP · 2 N/A |

## Casos ejecutados

| ID | Descripción breve | Resultado | Evidencia / Señal detectada |
|----|-------------------|-----------|------------------------------|
| DM-LOG-002 | Campos vacíos → alert aviso | ✅ PASS | ion-alert header="Denario Premium", msg="Usuario y/o password no pueden ser vacios", botón OK — app permanece en `/login` |
| DM-LOG-003 | Contraseña incorrecta → alert error | ✅ PASS | ion-alert header="Denario Premium", msg="Usuario y/o contraseña incorrectos.", botón OK — login rechazado, sync no iniciada |
| DM-LOG-004 | Checkbox "Recordar Usuario" funcional | ✅ PASS | ion-checkbox respondió al click y cambió estado (toggle confirmado); etiqueta "Recordar Usuario" visible |
| DM-LOG-001 | Happy path login → sync iniciada | ✅ PASS | Credenciales QA válidas (user=003) → app-synchronization visible, overlay sync activo |
| DM-LOG-011 | Sincronización — feedback visual | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` + `ion-spinner`, texto: "Sincronizando - Visitas · Por favor espere..." |
| DM-LOG-012 | Sincronización completada → Home | ✅ PASS | `url=http://localhost/home`, `app-home` visible — módulos confirmados: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, Salir |
| DM-LOG-008/009 | Segunda cuenta QA_USER2 | 🚫 N/A | `has_second_user=false` para cliente insumar — sin segunda cuenta QA |
| DM-LOG-017 | Arranque limpio | 🚫 N/A | Corrida normal sin reinstalación ni borrado de datos de app |

## Notas de ejecución

- Selector correcto para campos de login en insumar: `ion-input[formcontrolname="login"]` y `ion-input[formcontrolname="password"]` (no `name="username"`/`name="password"`). Documentar en smoke-login.md.
- DM-LOG-004: checkbox estaba en estado `checked` al iniciar (sesión previa lo dejó marcado). El click lo devolvió a `unchecked` — toggle funciona correctamente. PASS confirmado.
- Sync completó en ~6s (2 polling cycles de 2s). Estado final: `/home` con 11 módulos visibles.

## Estado final

App en Home principal (`http://localhost/home`). Módulos visibles: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, Salir.

## Registros creados en sistema

Ninguno.

---
*Generado por Claude Code · CDP WebSocket directo · 2026-06-02 · RUN_ID 20260602_180248_smoke-completo*
