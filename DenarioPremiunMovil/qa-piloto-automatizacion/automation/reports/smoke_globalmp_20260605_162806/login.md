# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 (Infinix X6728, Android 15) |
| App | `com.kiberno.denarioPremiumPro` — Chrome/148 WebView |
| Cliente | globalmp |
| QA_USER | kleon (alfanumérico) |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Alert "Usuario y/o password no pueden ser vacios" visible tras click en "Aceptar" con campos vacíos |
| DM-LOG-003 | ✅ PASS | Alert "Usuario y/o contraseña incorrectos." visible tras ingresar ***/*** (bad_password) |
| DM-LOG-004 | ✅ PASS | `ion-checkbox` cambió de `checked=false` a `checked=true` al hacer click |
| DM-LOG-001 | ✅ PASS | `app-synchronization` visible con texto "Sincronizando - Clientes · Por favor espere..." tras login con ***/*** |
| DM-LOG-011 | ✅ PASS | `ion-progress-bar` activo dentro de `app-synchronization` confirmado |
| DM-LOG-012 | ✅ PASS | `app-home` visible con 9 módulos; `app-synchronization` desapareció; `app-login` no visible |

---

## Descubrimientos — perfil globalmp

| Campo | Valor observado |
|-------|----------------|
| Selector de empresa (multiempresa) | **NO** — no apareció ningún `app-empresa-selector` ni `ion-select` de empresa durante ni después del login |
| Nombre visible en HOME / header | No hay `ion-title` ni label de empresa en el header. HOME no muestra nombre de empresa ni usuario. |
| Módulos visibles en HOME | Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar |
| Botón submit en formulario login | `ion-button[type="submit"]` con texto "Aceptar" |
| Botón secundario en login | `ion-button` con texto "Salir" |
| Selectores ion-input | Sin atributo `name`; identificados por `placeholder`: "Usuario" (idx 0), "Contraseña" (idx 1) |
| Nota CDP | ADB forward requirió re-mapeo al inicio: PID del WebView había cambiado a 8880 (forward anterior apuntaba a PID 4595 ya inexistente). Re-ejecutar `adb forward tcp:9220 localabstract:webview_devtools_remote_8880` antes de cada sesión. |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | No se crearon registros en base de datos en este módulo | — |

---

## Hallazgos

Sin FAIL. No hay defectos a registrar en este módulo para la corrida exploratoria de globalmp.

### Nota operativa — selector de credenciales
Los `ion-input` del formulario de login de globalmp **no tienen atributo `name`** (a diferencia de otros clientes donde se esperaba `name="username"` / `name="password"`). La identificación debe hacerse por índice o por `placeholder`. Esto es consistente con el HTML observado y no representa un defecto — el formulario funciona correctamente.

### Nota operativa — CDP
La primera conexión falló con "socket hang up" porque el `adb forward` estaba mapeado a un PID de WebView obsoleto (4595). Se corrigió re-ejecutando el forward al PID activo (8880). Patrón a considerar para sesiones tras reinicios de app.
