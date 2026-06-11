# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | CDP `http://127.0.0.1:9220` (WebView `com.kiberno.denarioPremiumPro`) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa / Cliente | insumar (usuario `003`) |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Enviar con campos vacíos → alert "Denario Premium / Usuario y/o password no pueden ser vacios"; descartado con Aceptar |
| DM-LOG-003 | ✅ PASS | Usuario `003` + contraseña incorrecta `Test-LOG-003` → alert "Denario Premium / Usuario y/o contraseña incorrectos."; no permite login, sigue en `/login` |
| DM-LOG-004 | ✅ PASS | Click en checkbox "Recordar usuario": `checked` false→true (reset a false tras verificar) |
| DM-LOG-001 | ✅ PASS | Login `003`/`123456` → overlay `app-synchronization` aparece (sync arranca) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo — label "Sincronizando - Etiquetas... Por favor espere..." |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` → `app-home` visible en `/home`, `app-login` no visible, 11 módulos (Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar, Salir) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Módulo sin transacciones | — |

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `require()` / `fs` NO disponible en `browser_run_code_unsafe` | universal | Ni `require('...helpers.js')` ni `require('fs')` funcionan en este entorno. Inlinear helpers verbatim como literales JS y obtener credenciales por lectura previa del archivo (Read tool), no con `fetchCreds`/`fs` dentro del snippet. `[ins-2606]` |
| Selectores LOGIN confirmados en insumar | cliente (confirma universal) | `ion-input[placeholder="Usuario"]` idx 0, `ion-input[placeholder="Contraseña"]` idx 1 (sin `name`); `ion-button[type="submit"]` texto "Aceptar"; `ion-checkbox` único toggle por `mouse.click` en coords reales. Coincide con `[gmp-2606]`. |
| Alert login: estructura DOM | universal | Título en `.alert-title` ("Denario Premium"), mensaje en `.alert-message`. El texto puede venir vacío si se lee durante la animación de apertura — pollear hasta que `.alert-message` tenga contenido. `[ins-2606]` |
| Checkbox "Recordar usuario" | universal | Propiedad `ion-checkbox.checked` refleja el toggle correctamente vía `mouse.click` en centro del bounding rect. `[ins-2606]` |

> ✅ consolidado 2026-06-10

## Hallazgos (solo si hay FAIL)
Sin FAIL. Todos los casos del módulo LOGIN pasaron.
