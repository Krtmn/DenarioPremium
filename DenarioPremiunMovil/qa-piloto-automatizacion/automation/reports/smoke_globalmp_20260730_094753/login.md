# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | LOGIN |
| Cliente | globalmp |
| Dispositivo | 14678405BR003855 (CDP :9220 · PID WebView 18386) |
| App | `com.kiberno.denarioPremiumPro` — `versionApp=1.0` · `db_version=19` |
| Playa | **la_tortuga** (descubierta en runtime — ver §Descubrimiento) |
| Servidor móvil | `http://denariolatortuga.ddns.net:8081/PremiumWS` |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Wall-clock módulo | ~4 min · 0 cuelgues de CDP · 0 reintentos |

---

## 🔴 Bloque de descubrimiento (salida principal del módulo)

### 1. Servidor / playa efectiva

Descubierto con `installPayloadCapture` (hook `Capacitor.nativePromise`) **antes** del login exitoso.
El intento fallido DM-LOG-003 ya reveló el host; el login DM-LOG-001 lo confirmó.

| Endpoint capturado | Host |
|---|---|
| `/PremiumWS/services/authservice/auth` | `denariolatortuga.ddns.net:8081` |
| `/PremiumWS/services/syncservice/getsync` (×58) | `denariolatortuga.ddns.net:8081` |
| `/PremiumWS/services/listfilespremium` | `denariolatortuga.ddns.net:8081` |

**Resolución contra `automation/web/playas.yaml` → `la_tortuga` ("La Tortuga").**

✅ **NO hay discrepancia de playa.** QA indicó que la web de globalmp es LA TORTUGA y el móvil
resuelve a la misma playa. Coincide con el host ya visto en `[ferrenuestro-20260723]`
(`denariolatortuga.ddns.net:8081`).

> ⓘ Nota de puertos: el móvil usa **:8081** (`/PremiumWS`, servicios REST) y la web usa **:8080**
> (`/DenarioPremium`, JSF) — mismo hostname `denariolatortuga.ddns.net`. Es la misma playa;
> el agente WEB debe anclar al bloque de credenciales `# USUARIO WEB` de **la_tortuga**.

- `ws_url` del perfil: estaba en `null` → **completar con `denariolatortuga.ddns.net:8081`**.

### 2. Build

| Dato | Valor |
|---|---|
| `versionApp` (localStorage) | `1.0` |
| `db_version` | `19` |
| `serviceVersion` (respuesta auth) | `null` |
| **`window.ng`** | **`true`** ✅ (conducción por componentes Angular disponible) |
| `window.sqlitePlugin` | presente (BD local legible por CDP — 87 tablas) |
| `window.Capacitor` | presente · hook `nativePromise` enganchado OK |
| Moneda local / dura | `BS` / `USD` |
| `lastUpdate` tras sync | `2026-07-30 09:51:52.554` |

### 3. Usuario

| Dato | Valor |
|---|---|
| Login (qa-credentials.env, bloque `# Cliente: globalmp`) | `***` |
| `co_user` (código de vendedor) | **`YC01`** |
| `id_user` | `307` |
| Nombre | **YUSNEIDI CLEMENTE** |
| `errorCode` de auth | `000` (OK) |
| Perfiles especiales | ninguno — cliente/promotor/soporte/transportista/catálogo = `false` (vendedor estándar) |

### 4. Empresa por defecto

Leído de la BD **local** del device (`enterprises`, vía `window.sqlitePlugin`):

| `co_enterprise` | `na_enterprise` | `enterprise_default` | `priority_selection` | RIF | Moneda def. |
|---|---|---|---|---|---|
| `00001` | HC TRADING MARKET 2021, C.A | `false` | 1 | J500669097 | USD |
| **`00002`** | **COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.** | **`true`** | 0 | J-40180588-4 | USD |

➡ **La app toma `00002` COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A. por defecto**
(coincide con la nota del orquestador: los cobros de hoy están en esa empresa).

⚠ `enterpriseEnabled = true` **confirmado** en `globalConfiguration` (junto a
`orderTypeByEnterprise = true`) y hay **2 empresas** ⇒ el `ion-select` de Empresa **SÍ importa**
en los formularios de esta corrida. Si un formulario no preselecciona empresa, elegir `00002`
salvo que el caso pida lo contrario.

### 5. Baseline de la BD local (para los módulos transaccionales)

| Tabla | Filas al inicio de la corrida |
|---|---|
| `pending_transactions` | **0** |
| `failed_transactions` | **0** |

> Punto de partida limpio: cualquier fila que aparezca en estas tablas durante la corrida es de
> esta corrida. La BD **nube** (`global_mp`) sigue **SIN GRANT** → los transaccionales usan el
> oráculo **local** por CDP (`window.sqlitePlugin`) + captura de payload, no `query.js`.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con ambos campos vacíos → `ion-alert` "Denario Premium" / **"Usuario y/o password no pueden ser vacios"** (botón `OK`) |
| DM-LOG-003 | ✅ PASS | `***` + contraseña incorrecta (`Test-LOG-003`, 12 chars) → alert **"Usuario y/o contraseña incorrectos."**; sigue en `/login`, no entra |
| DM-LOG-004 | ✅ PASS | Click en `app-login ion-checkbox` ("Recordar Usuario") → `checked` pasa `false → true`; `elementFromPoint` confirma que el click cae en el propio `ION-CHECKBOX` |
| DM-LOG-001 | ✅ PASS | `***` + contraseña válida → navega a `/synchronization`, overlay `app-synchronization` visible; POST a `authservice/auth` capturado |
| DM-LOG-011 | ✅ PASS | `app-synchronization` con `ion-progress-bar` activo; fases observadas: Etiquetas → Dirección de Clientes → Clientes → Documento de Venta → Empresas → Tipos de Incidencia |
| DM-LOG-012 | ✅ PASS | `/home` con `app-home` visible y `app-login` oculto; 9 módulos + Sincronizar renderizados |

**Módulos visibles en HOME:** Visitas · Inventarios · Pedidos · Devoluciones · Cobros · Depósitos ·
Vendedores · Productos · Clientes · Sincronizar. (Los 10 del alcance están disponibles para esta cuenta.)

## Registros creados en sistema

Ninguno — módulo sin transacciones. `BD-N/A` por diseño (login no persiste movimientos).

## Verificación BD

`BD-N/A` — LOGIN no genera transacciones. Se dejó registrado el **baseline local** (0 pendientes /
0 fallidas) como insumo del §10 para los módulos transaccionales.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Botón de alerts de LOGIN = **"OK"**, no "Aceptar" | universal (build La Tortuga v6.6.18) | 2ª confirmación tras `[ferrenuestro-20260723]`: los 3 alerts de login (vacíos, credenciales incorrectas) traen un único botón **`OK`**. Cerrar con orden de preferencia `['OK','Aceptar']` — nunca por regex |
| `pg.mouse.click` simple **basta** para el submit tras `fillIonInput` | cliente (globalmp / La Tortuga) | No hizo falta el gesto compuesto `move→down→wait→up` que sí requirió ferrenuestro. Confirmado en 3 submits consecutivos (vacío, credencial mala, credencial buena) |
| **Descubrimiento de playa sin BD: `Capacitor.nativePromise` + `authservice/auth`** | universal | Extender `installPayloadCapture` con un array `window.__qaHosts` que registre **toda** URL de `CapacitorHttp` (no solo POST a `service/`) da el host real del servidor **en el primer intento de login, incluso si falla**. Es la vía barata de resolver la playa cuando `ws_url` del perfil está en `null`. Añadido como skill `__qaH.getHosts()` |
| **Empresa por defecto legible sin UI: `enterprises.enterprise_default`** | universal | La tabla local `enterprises` tiene `enterprise_default` (`'true'`/`'false'`, **string**) y `priority_selection`. Resuelve "qué empresa toma la app" sin abrir ningún formulario. En globalmp → `00002`. Columnas reales: `id_enterprise, lb_enterprise, co_enterprise, co_currency_default, priority_selection, enterprise_default, na_enterprise, nu_rif, tx_address` (⚠ **no** existen `st_enterprise` ni `st_default`) |
| La tabla `users` **no existe** en la BD local | universal | `SELECT … FROM users` → `no such table: users`. Los datos del vendedor viven en `localStorage.user` (`coUser`, `naUser`, `idUser`) — usar esa vía |
| Baseline `pending_transactions` / `failed_transactions` por CDP al cierre de LOGIN | universal | Barato (2 counts) y deja el punto cero del §10 para los 7 transaccionales cuando la BD nube está sin GRANT |
| App arrancó ya en `/login` (no en HOME) | cliente/run | El orquestador reportó HOME; al conectar estaba en `/login` con los 2 inputs vacíos ⇒ no hizo falta clickear "Salir". **Verificar `location.href` antes de asumir el estado inicial** |

---

## Hallazgos

Ninguno — 0 FAIL. El módulo LOGIN de globalmp se comporta como el guión especifica en los 6 casos.

## Notas de infraestructura

- Bundle `window.__qaH` **instalado por este agente** (15 skills puras-DOM, fuente
  `automation/cdp/helpers-inline.js` + `getHosts`). El WebView estaba **limpio** (`__qaH=false`,
  `__qaCaptureInstalled=false`) ⇒ no se heredó nada de la corrida anterior.
  ⚠ Los 8 agentes siguientes **heredan esta versión** (el bundle es idempotente, `_comunes.md`):
  incluye `installPayloadCapture` **con `data`** en `window.__qaPayloads`, más
  `__qaH.getHosts()`. **No reinstalar el bundle** — apila un 2º wrapper sobre `nativePromise`
  y duplica los payloads.
- Captura de payload **activa y verificada**: 61 entradas al cierre de LOGIN
  (58 `syncservice/getsync` + 2 `authservice/auth` + 1 `listfilespremium`).
- Watchdog: `moduleMs=2 700 000` · 0 `TIMEOUT:` · 0 `CDP-DOWN:` · 0 `ABORT-MODULE`.
- Estado final: app en `http://localhost/home`, sesión iniciada, "Recordar Usuario" **activado**
  (queda del DM-LOG-004 — útil para el auto-login si algún módulo hace crashear la app).
