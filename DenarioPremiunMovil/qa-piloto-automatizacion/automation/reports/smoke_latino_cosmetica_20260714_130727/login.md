# Smoke Test — Módulo LOGIN
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260714_130727_smoke-completo` |
| Módulo | LOGIN |
| Cliente | latino_cosmetica (1ª corrida automatizada) |
| App | `com.kiberno.denarioPremiumPro` |
| Conexión | CDP `http://127.0.0.1:9220` |
| Resultado | 6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Click "Aceptar" con campos vacíos → alert título "Denario Premium", mensaje "Usuario y/o password no pueden ser vacios" |
| DM-LOG-003 | ✅ PASS | Usuario `***` + `QA_BAD_PASSWORD` (`***`) → alert "Usuario y/o contraseña incorrectos." |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar usuario": `checked` false→true tras click en centro del bounding rect |
| DM-LOG-001 | ✅ PASS | Usuario `***` + `***` correctos → overlay `app-synchronization` visible (`url=/synchronization`) |
| DM-LOG-011 | ✅ PASS | `app-synchronization` + `ion-progress-bar` visibles simultáneamente al iniciar sync |
| DM-LOG-012 | ✅ PASS | Tras `waitSyncOverlay` + poll de `location.href`, `app-home` visible con 8 módulos (Visitas/Inventarios/Pedidos/Devoluciones/Cobros/Depósitos/Vendedores/Productos/Clientes/Sincronizar), `app-login` no visible, `url=/home` |

## Registros creados en sistema
Ninguno (login no transacciona).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| — | — | Ninguno nuevo. Todos los selectores de `module-selectors/login.md` (placeholder Usuario/Contraseña sin `name`, `ion-button[type="submit"]`, `ion-checkbox`, `.alert-title`/`.alert-message`, `app-synchronization`+`ion-progress-bar`) funcionaron sin cambios en la 1ª corrida de latino_cosmetica. |

*(sin patrones nuevos que graduar)*

> ✅ consolidado 20260714

## Hallazgos de infraestructura (1ª corrida latino_cosmetica)
- **Credenciales:** usuario `001` (mismo patrón numérico que hidroponias/insumar/central_foods/jerez/osoroma), password estándar `123456`, `QA_BAD_PASSWORD=Test-LOG-003` (bloque nuevo agregado a `secrets/qa-credentials.env`).
- **Estado inicial de la app:** arrancó directo en LOGIN (no en HOME) — no fue necesario click en "Salir".
- **Overlay de sync:** duración normal, sin cuelgues; `waitSyncOverlay` resolvió sin necesidad de reintentos ni del patrón de poll adicional documentado para builds El Yaque (`gmp-2611`) — aun así se aplicó el poll de `location.href` por precaución y confirmó `/home` limpio.
- **Empresa / playa:** no hay `ion-title` con nombre de empresa visible post-login (mismo patrón que globalmp/don-theo) — no se pudo leer el nombre exacto de la empresa ni la playa/servidor por UI. Sin acceso a `claves.env` en este agente para confirmar `WsUrl`.
- **HOME:** los 8 módulos estándar se renderizan correctamente (2 nodos por módulo — ícono+label — de ahí el conteo doble en el sampleo DOM).
- Sin anomalías ni BLOCKED. 0 reintentos técnicos (techo de 2 intentos no se activó en ningún caso).
