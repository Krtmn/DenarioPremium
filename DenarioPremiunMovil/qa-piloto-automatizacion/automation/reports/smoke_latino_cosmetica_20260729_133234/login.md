# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | LOGIN |
| Cliente | latino_cosmetica |
| Dispositivo | `14678405BR003855` (Infinix X6728 · Android 15) |
| App | `com.kiberno.denarioPremiumPro` — versionName **1.0** (versionCode 1) · WebView Chrome/150.0.7871.181 |
| Playa | **isla_coche** (descubierta en runtime — ver bloque de descubrimiento) |
| Empresa | **LATINOCOSMETICA C.A.** |
| Usuario | **100** — NEIMY PARRA (`coUser=00014`, `idUser=477`) |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con ambos campos vacíos → `ion-alert` "Denario Premium" / **"Usuario y/o password no pueden ser vacios"** |
| DM-LOG-003 | ✅ PASS | Usuario `100` + `QA_BAD_PASSWORD` → alert **"Usuario y/o contraseña incorrectos."**; no navega, sigue en `/login`. POST real a `authservice/auth` |
| DM-LOG-004 | ✅ PASS | `ion-checkbox` "Recordar usuario": `checked` **false → true** con `pg.mouse.click` en centro del bounding rect |
| DM-LOG-001 | ✅ PASS | Credenciales válidas → submit dispara sync: URL pasa a `/synchronization` a los **1.1 s** |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo (`value=0.0156` y creciendo). Fases observadas: Dirección de Clientes → Motivos de Incidencia → Listas → Descuento Global → Tipo de Estructura de Producto → Facturas → Pedidos → Detalles de Pedido |
| DM-LOG-012 | ✅ PASS | `app-home` visible en `/home` a los **10.3 s**; `app-login` no visible; **10 módulos** renderizados: Visitas, Inventarios, Pedidos, Devoluciones, Cobros, Depósitos, Vendedores, Productos, Clientes, Sincronizar (+ Salir) |

## Registros creados en sistema

Ninguno — módulo sin transacciones.

## Verificación BD

`BD-N/A` — LOGIN no lleva verificación BD (RUNTIME §10: login → `BD-N/A`). La BD nube `latino_cosmetica`
está además **sin GRANT** (0/185 tablas legibles para `user_read`), así que no se intentó consultarla.

⚠ **Pero** la mitad **LOCAL** del oráculo §10 quedó **RECUPERADA** por otra vía — ver patrones nuevos.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Lector de SQLite LOCAL por CDP: `window.sqlitePlugin`** | **universal** | `_comunes.md` declara la mitad local del oráculo BD §10 **inoperante** porque `sqlite3` no existe en el device y `automation/db/local-query.js` (vía `adb run-as`) falla siempre. **Es evitable:** la app expone `window.sqlitePlugin` (cordova-sqlite-storage) en el WebView. Desde `browser_run_code_unsafe`: `const db = window.sqlitePlugin.openDatabase({name:'denarioPremium', location:'default'})` + `db.transaction(tx => tx.executeSql(sql, [], ok, err))`. **Verificado leyendo tablas reales.** ⚠ `window.openDatabase` (WebSQL) NO existe y el plugin `CapacitorSQLite` **tampoco** (`unable to find plugin`) — la única vía es `window.sqlitePlugin`. |
| Tablas de la cola de salida SÍ legibles | universal | Confirmado por `sqlite_master`: **`pending_transactions`**, `pending_transactions_attachments`, **`failed_transactions`** existen y son consultables por la vía anterior ⇒ los estados `BD-QUEUED` / `BD-MISMATCH` (rechazo) vuelven a ser verificables sin `adb run-as`. La tabla de documentos NO se llama `documents` (query falló con `no such table`) — descubrir el nombre real antes de usarla. |
| Empresa legible por BD local | universal | `SELECT * FROM enterprises` da `lb_enterprise` / `na_enterprise` — resuelve el gap histórico "HOME no muestra el nombre de empresa por UI" (`[gmp-2606][dth-2612]`). |
| Descubrimiento de playa por hook de payload | universal | `installPayloadCapture` **antes** del login captura el POST `authservice/auth` — el host real sale **sin necesidad de un login exitoso** (basta el intento fallido de DM-LOG-003). Ampliar el filtro del hook a `get\|request` además de `post` para ver también `syncservice`. |
| Botón de alert = **"OK"** | cliente (isla_coche / este build) | Los 3 alerts informativos de login cerraron con `alertButtonCoords('OK')`; `'Aceptar'` no se probó como fallback porque `'OK'` matcheó primero. Coherente con la nota de ferrenuestro La Tortuga. |
| Alerts se ACUMULAN en el DOM | universal (reconfirma) | 7 nodos `ion-alert` en el DOM al arrancar. Filtrar siempre por `:not(.overlay-hidden)` **+** `offsetParent !== null`. |
| Submit con click simple bastó | cliente | El `pg.mouse.click(x,y)` simple sobre `app-login ion-button[type="submit"]` disparó el submit las 3 veces, **también después de `fillIonInput`** — no hizo falta el gesto compuesto que documentó ferrenuestro. Coords estables `(180, 473)`; checkbox `(311, 408)`. |

## Hallazgos

Sin FAIL. Dos **discrepancias de configuración** (no son defectos de la app, son datos desactualizados
en los archivos de QA — corregir antes de que los usen los otros agentes):

1. **`ws_url` del YAML obsoleto.** El YAML dice `denariolatortuga.ddns.net:8081`; el device apunta en
   realidad a **`denarioislacoche.ddns.net:8081`**. Confirmado sobre 66 llamadas capturadas, **100 % al
   mismo host** (2 × `authservice`, 64 × `syncservice`), 0 llamadas a La Tortuga.
2. **`usuario` del YAML incorrecto.** El YAML asume `001`; el usuario real del bloque
   `# Cliente: latino_cosmetica` de `qa-credentials.env` —y con el que se entró— es **`100`**.

⚠ Además, el `qa-db.env` de este cliente apunta a una BD **sin GRANT**. Combinado con el cambio de playa,
es el mismo cuadro que tumbó el cotejo BD en `[ferrenuestro-20260723]` (DSN apuntando a la playa vieja).
**Mitigación disponible:** el lector `window.sqlitePlugin` de la tabla de patrones cubre la mitad local
sin depender del DSN de nube.

## Bloque de descubrimiento (consumido por los otros 8 agentes)

```yaml
servidor_real:   http://denarioislacoche.ddns.net:8081/PremiumWS
playa_resuelta:  isla_coche          # ✅ COINCIDE con lo que esperaba QA
playa_web_base:  http://denarioislacoche.ddns.net:8080/DenarioPremium
ws_url_yaml:     denariolatortuga.ddns.net:8081   # ❌ OBSOLETO — no usar
evidencia:       66/66 llamadas capturadas al mismo host (authservice + syncservice)

build:
  app_version:     "1.0"        # versionName del APK == localStorage.versionApp
  version_code:    1
  db_version:      19
  window_ng:       true         # conducción por componentes Angular DISPONIBLE
  service_version: null
  webview:         Chrome/150.0.7871.181  (Android 15)

empresa:
  nombre:        "LATINOCOSMETICA C.A."   # ✅ el YAML estaba CORRECTO
  co_enterprise: "00001"
  rif:           "J-31232315-9"
  direccion:     "La Urbina Caracas Venezuela"
  moneda_default: USD
  unica:         true            # 1 sola fila en `enterprises`, enterprise_default=true

usuario:
  co_login: "100"               # ❌ el YAML asumía 001 — CORREGIR
  co_user:  "00014"
  id_user:  477
  nombre:   "NEIMY PARRA"

config_relevante:                # de localStorage.globalConfiguration (174 claves)
  enterpriseEnabled:              true    # habrá selector de empresa en los formularios
  requiredCollectionAttachments:  true    # 🔴 COBROS necesita adjunto → installCameraMock obligatorio
  conversionByPriceList:          true
  conversionCalculator:           true
  orderTypeByEnterprise:          false
  nameProductValor:               "UND"

moneda:
  local: BSD
  hard:  $
```

## Notas de operación

- Estado inicial: la app ya estaba en `app-login` (no hizo falta "Salir").
- Watchdog: `moduleMs=2700000`, `page` pasado. **0 `TIMEOUT:` · 0 `CDP-DOWN:` · 0 `ABORT-MODULE:`**.
- Bundle `__qaH` instalado (14 skills). Wall-clock del módulo: ~7 min. Estado final: **HOME**.
- No se grabó traza (modo RECORD no solicitado por el orquestador).
