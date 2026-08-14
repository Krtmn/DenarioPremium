# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | LOGIN |
| Dispositivo | `14678405BR003855` |
| App | `com.kiberno.denarioPremiumPro` — versionName **1.0** (versionCode 1) |
| Playa | **EL YAQUE** — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Cliente / vendedor | difranca · `coUser=206` / `idUser=275` (Jose Raad) |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Hallazgos fuera de la lista de casos | **2 defectos nuevos** (1 crítico, 1 medio) — ver §Hallazgos |

---

## TAREA 0 — Guarda de tenant y de build

### 1. Playa ✅

`window.__env.WsUrl` = `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` → **EL YAQUE confirmado**.
La clave se descubre en runtime: `ServicesService.getWsUrl()` lee `window.__env["WsUrl"]` (no está en los bundles ni en `localStorage`).

### 2. Tenant difranca ✅ — la empresa borrada NO aparece

Tabla local `enterprises` (leída con `window.sqlitePlugin`, sin abrir ningún formulario):

| id | `co_enterprise` | `lb_enterprise` | `co_currency_default` | `enterprise_default` |
|----|-----------------|-----------------|------------------------|----------------------|
| 2 | `DDHP_A12` | `*DISTRIBUIDORA DIAZ` | `US$` | true |
| 3 | `DIF_A12` | `DIFRANCA C.A` | `USD` | false |
| 4 | `DHVITAL01_A` | `DISTRIBUIDORA DH VI` | `US$` | false |

**Exactamente 3 filas. `DDH_A12` (id 1, `co_operation='D'`) NO baja al dispositivo ⇒ sin defecto.**

🔑 **Verificado DOS veces y la segunda es la fuerte:** durante la corrida la BD local se borró y se reconstruyó con un **resync completo contra el servidor de hoy**, y la empresa borrada **siguió sin bajar**. No es un residuo de una sync vieja: el filtro se aplica en la sincronización actual.

### 3. Build — ¿es difranca compilado desde main? **SÍ, y está trazado**

| Marcador | 07/08 | **HOY 10/08** | ¿cambió? |
|---|---|---|---|
| `versionApp` (app) | 1.0 | **1.0** | no |
| `db_version` | 19 | **19** | no |
| `coUser` / `idUser` | 206 | **206 / 275** | no |
| `window.ng` | true | **true** | no |
| `window.sqlitePlugin` | disponible | **disponible** | no |

⚠ **Los marcadores de versión NO discriminan builds** (`versionName` está fijo en 1.0 / `versionCode` 1 desde hace corridas). La trazabilidad real se obtuvo por **procedencia del binario**:

| Evidencia | Valor |
|---|---|
| APK instalado en device (md5) | `9F0C348088D8F8B3A03F3FE064CD74AF` · instalado 2026-08-10 **12:16:19** |
| Coincide con | `DenarioPremiunMovil/android/app/build/outputs/apk/debug/app-debug.apk` (27.170.860 bytes, compilado **12:15:44**) |
| HEAD del árbol al compilar | `99b138fa` — *"Merge origin/main into feature/qa-guiones-regresion"*, **12:14:12** |
| Tip de `origin/main` | `524930fa` — *"fix(cobros,inventarios): permitir Espacio en Comentario al primer toque (COB-INV-COMMENT-001)"*, **12:04:18** |
| Divergencia de código de producto HEAD vs `origin/main` | **CERO** (`src/`, `android/`, `package.json`, `angular.json`, `capacitor.config.ts` → diff vacío) |
| `window.__env.API_KEY_GOOGLE_MAPS` | **presente y poblada** (no se repite el arrastre de APK sin key de Maps) |

⇒ **Este APK es main al 2026-08-10 12:04 (`524930fa`), compilado 10 minutos antes de instalarse.** Huella de bundles para futuras comparaciones: `main.js` 4.987.544 B / hash `542f9827` · `vendor.js` 11.275.559 B / `ace192fb` · `runtime.js` 14.560 B / `e4ae7d14` · `polyfills.js` 124.948 B / `785d7b53`.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → alert `Denario Premium` / **"Usuario y/o password no pueden ser vacios"**, botón real leído: **`OK`**. 1 intento. |
| DM-LOG-003 | ✅ PASS | Usuario `***` + password incorrecta → alert **"Usuario y/o contraseña incorrectos."**, botón **`OK`**. 2 intentos (el 1.er click simple no registró — ver Patrones). ⚠ Antes de este alert se interpone el confirm de resync — ver Hallazgos. |
| DM-LOG-004 | ✅ PASS | `ion-checkbox` "Recordar Usuario": `checked` **false → true** por `mouse.click` en el centro del rect (20×20 en x≈311,y≈408). 1 intento. |
| DM-LOG-001 | ✅ PASS | Usuario `***` + password `***` → arranca sync, URL pasa a `/synchronization`. 2 intentos (submit por **Enter**, ver Patrones). |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` **`type=determinate`, `value=0.84`**, texto *"Sincronizando - Bonificaciones de Producto / Por favor espere..."*. |
| DM-LOG-012 | ✅ PASS | `app-home` visible con **12 tiles**: `Visitas · Inventarios · Pedidos · Devoluciones · Cobros · Depósitos · Vendedores · Productos · Clientes · Sincronizar` (+2 vacíos) y botón `Salir`. BD local reconstruida: **87 tablas · 3 empresas · 170 clientes · 1.056 productos · 105 cobros**; `db_version` restaurado a `19`. HOME alcanzado en **~57 s** desde el submit. |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| — | LOGIN no crea transacciones | `BD-N/A` |

---

## Hallazgos

> Ninguno de los dos está en `automation/defectos-conocidos.yaml` (no tiene **ninguna** entrada `LOG-*`) ni en la tabla de defectos conocidos de `RUNTIME.md` §5.
> ⚠ El **texto** del alert ya se había visto (`insumar-20260603`, `difranca-20260807`), pero en esos casos el device **sí** traía datos de otro cliente y la contraseña era correcta ⇒ se juzgó *"comportamiento correcto"* y **el modo de falla de abajo era invisible**. Lo nuevo es (a) que dispara **sin cambio de usuario** y (b) **qué pasa cuando la autenticación falla**.

### 🔴 S1 · `LOG-WIPE-ANTES-DE-AUTENTICAR` — la BD local se destruye ANTES de validar credenciales

**Qué pasa:** al aceptar el aviso de resync, la app **borra la base de datos local completa** y recién **después** consulta al servidor. Si las credenciales resultan inválidas, el usuario queda **sin datos y sin sesión**: perdió todo lo local y ni siquiera entró.

**Cronología medida (sondeo cada 0,9 s sobre `sqlite_master` + `localStorage`):**

| t | Alert visible | BD local | `db_version` |
|---|---|---|---|
| `t=0` (antes de pulsar Aceptar) | *"…todos los datos anteriores serán borrados. ¿Está de acuerdo?"* `[Cancelar, Aceptar]` | **87 tablas · 170 clientes** | `19` |
| `t+1,2 s` | *(ninguno)* | 🔴 **destruida** — `no such table: clients` | `null` |
| `t+2,1 s` | **"Usuario y/o contraseña incorrectos."** `[OK]` | destruida | `null` |

**El borrado ocurre ~0,9 s ANTES de que el servidor responda que la contraseña es incorrecta.**

**Estado en que queda el dispositivo:** de 87 tablas sobreviven **3** (`code_phone_number`, `sqlite_sequence`, `type_document`); `db_version` borrado, `lastUpdate` reseteado a `2000-01-01 00:00:00.000`, `createTables=false`, y la app **de vuelta en `/login`**.

**Impacto operacional:** se lleva por delante `pending_transactions` — **cobros, pedidos y devoluciones guardados y aún no enviados se pierden sin recuperación**. No hay confirmación posterior ni aviso de que el borrado ya se ejecutó pese al fallo de login.

**Reproducido 2 de 2 veces** (una con baseline `3/170/1056/105`, otra con `87 tablas/170 clientes`), ambas con contraseña incorrecta.

**Reproducción manual (sin herramientas):**
1. Vendedor logueado con datos sincronizados (idealmente con algún movimiento guardado sin enviar).
2. Salir al login.
3. Escribir el **mismo** usuario **cambiando su caja** (el usuario QA tal cual figura en `secrets/qa-credentials.env` va en MAYÚSCULAS; escribirlo todo en minúsculas) y una **contraseña equivocada**.
4. Aceptar el aviso de borrado.
5. → Aparece *"Usuario y/o contraseña incorrectos."* y **la base local ya está vacía**.

**Corrección esperada:** autenticar primero y borrar la BD local **solo** después de que el servidor confirme un usuario válido y distinto.

### 🟠 S3 · `LOG-RESYNC-CASE-SENSITIVE` — el aviso de borrado dispara con el MISMO usuario por mayúsculas/minúsculas

**Qué pasa:** la app compara el usuario tecleado contra `localStorage.login` de forma **sensible a mayúsculas**, y guarda **literalmente lo que el usuario tecleó**. Como el `login_user` canónico de la tabla `users` va en MAYÚSCULAS, cualquier vendedor que un día escriba su usuario en minúsculas queda con esa caja guardada y **a partir de ahí, cada vez que lo escriba en mayúsculas, la app le anuncia que va a borrar todos sus datos** — y viceversa. Es un **ping-pong permanente**, no un caso de borde.

**Evidencia (3 disparos en esta corrida, mismo usuario, mismo cliente, mismo dispositivo):**

| # | `localStorage.login` guardado | Tecleado | ¿Coincide case-insensitive? | Resultado |
|---|---|---|---|---|
| 1 | `***` en **minúsculas** | `***` en **MAYÚSCULAS** | **sí** | 🔴 aviso de borrado |
| 2 | `***` en **MAYÚSCULAS** | `***` en **minúsculas** | **sí** | 🔴 aviso de borrado |
| 3 | `***` en **minúsculas** | `***` en **MAYÚSCULAS** | **sí** | 🔴 aviso de borrado |

*(`***` = el mismo y único usuario QA del bloque `# Cliente: difranca`; lo que cambia entre filas es solo la caja de las letras.)*

**Por qué importa más de lo que parece:** este defecto es el **disparador cotidiano** del S1. Solo hace falta que el vendedor escriba su usuario con otra caja (el teclado Android autocapitaliza la primera letra) y se equivoque de contraseña, para perder todo lo pendiente. **Los dos defectos se componen.**

**Corrección esperada:** comparar (y guardar) el login normalizado —`trim()` + `toLowerCase()`—, igual que lo hace el backend, que autentica sin problema con ambas cajas.

---

## Verificación BD

`BD-N/A` para los casos de LOGIN (no crean transacciones). Sí se usó la BD **local** como oráculo del estado del dispositivo:

| Momento | tablas | empresas | clientes | productos | cobros |
|---|---|---|---|---|---|
| Inicio de corrida | 87 | 3 | 170 | 1.056 | 105 |
| Tras aceptar el aviso con password incorrecta (×2) | **3** | — | — | — | — |
| **Estado final entregado a los agentes 2-10** | **87** | **3** | **170** | **1.056** | **105** |

✅ **El entorno queda restaurado y sano**: app en HOME (`/home`), `db_version=19`, `localStorage.login` = usuario QA en MAYÚSCULAS (la caja de `secrets/qa-credentials.env`), `coUser=206`, `idUser=275`.

---

## Entorno técnico (para los agentes 2-10)

| Dato | Valor |
|---|---|
| `window.ng` | **`true`** — conducción por componentes Angular disponible |
| `window.sqlitePlugin` | **disponible** — BD local consultable |
| Bundle `window.__qaH` | **instalado por este agente — 15 skills**: `getActiveView`, `isVisible`, `fillIonInput`, `clickIonItem`, `clickBack` (filtro `width>0`), `scrollInfinite`, `coordsOf` (con `inViewport`), `activeAlertInfo` (**con `buttons[]`**), `alertButtonCoords` (**igualdad exacta** + `width>0`), `confirmDatetime` (`#confirm-button`), `popoverOpen`, `popoverSet`, `installPayloadCapture`, `getCapturedPayloads`, `getPayloadData` |
| Captura de payload | **activa con `data`**, hook único protegido por `window.__qaDataHook`. **131 entradas** capturadas durante las syncs. Usar `__qaH.getPayloadData()` → `[{url, data}]`. 🔴 **NO reinstalar el bundle ni tocar `__qaCaptureInstalled`** |
| Viewport | **360×744** |
| Tile **Inventarios** | 🔴 **PRESENTE en HOME** pese a `clientStock=false` en el YAML (que predice *"el módulo NO debería existir"*). La entrada existe ⇒ **N/A por ausencia de UI NO aplica**; el agente de inventarios debe entrar y leer el estado real |
| Botón de logout | `app-home ion-button` con texto `Salir` → va a `/login` **sin confirmación** y **sin limpiar** `localStorage.login` |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **El submit de LOGIN NO responde a `mouse.click` después de tipear — usar `Enter`** | universal (candidato: 2.ª corrida difranca, contradice la nota del 07/08) | Con el formulario **vacío** el `pg.mouse.click(x,y,{delay:130})` **sí** dispara (DM-LOG-002 al 1.er intento). Tras llenar los campos con `pg.keyboard.type`, el mismo click **no registra**: `disabled=false`, `elementFromPoint` devuelve el propio `ION-BUTTON.btnEnter`, form `VALID`, 0 loadings, 0 alerts — y `app-message` **conserva el mensaje anterior** (prueba de que el evento nunca llegó). El **gesto compuesto** (`move → down → 90-120 ms → up`) funcionó 1 de 2 veces; **`pg.keyboard.press('Enter')` sobre el campo Contraseña funcionó 1 de 1**. ⚠ **Deroga la nota `[difranca-20260807]`** que decía *"`pg.mouse.click` simple + `{delay:130}`, sin necesidad del gesto compuesto"* — vale solo para el form vacío. |
| 🔑 **`app-message` distingue "el click no llegó" de "la app no avisó" — también en LOGIN** | universal (3.er uso) | `ng.getComponent(document.querySelector('app-message'))` con `mensaje` **viejo** + `alertMessageOpen=false` ⇒ el evento no se registró. Evitó marcar FAIL dos veces en este módulo. **Leerlo ANTES de reintentar.** |
| **`window.__env` es la fuente del `WsUrl`** | universal | `ServicesService.getWsUrl()` → `window.__env["WsUrl"]`. **No está en los bundles JS ni en `localStorage`**: buscar `ddns.net` en `main.js`/`vendor.js` devuelve **0 coincidencias**. Una sola lectura de `window.__env` resuelve la guarda de playa (y trae además `API_KEY_GOOGLE_MAPS`). |
| **Verificar la guarda de tenant sin abrir un formulario** | universal | `SELECT * FROM enterprises` por `sqlitePlugin` da id/co/lb/moneda/default de todas las empresas. Confirmado que **sobrevive a un resync completo**: la empresa con `co_operation='D'` no vuelve a bajar. |
| **Trazar el build por procedencia del binario, no por `versionName`** | universal | `versionName=1.0`/`versionCode=1` son constantes entre builds y **no discriminan**. Receta: `adb shell pm path` + `md5sum` del `base.apk` → cotejar contra el APK del árbol → `git log -1` del HEAD al compilar → `git diff --stat origin/main HEAD -- src android` para probar cero divergencia. Complemento barato: huella `{bytes, hash}` de `main.js`/`vendor.js` leídos por `fetch('http://localhost/main.js')`. |
| **Ambos alerts de LOGIN cierran con `OK`** | cliente (build El Yaque v1.0) | Campos vacíos **y** credenciales incorrectas → botón único `OK`. El confirm de resync es `[Cancelar, Aceptar]`. **NO vinieron en mayúsculas** en esta corrida. Reconfirma: **listar** los botones, nunca predecirlos. |
| **`localStorage.login` guarda lo tecleado tal cual** | universal | Es lo que habilita `LOG-RESYNC-CASE-SENSITIVE`. Útil como oráculo: leer `localStorage.login` antes de teclear predice si va a saltar el aviso de borrado. |
| **HOME rinde 12 `p.nombreModulos`, 2 de ellos vacíos con rect 0×0** | cliente | Los tiles reales son 10 (9 módulos + `Sincronizar`); hay 2 anchors vacíos (`w=0,h=0`). Filtrar por `width>0` al contar módulos o el conteo da 12. |

---

*Agente LOGIN · corrida `smoke_difranca_20260810_main` · 2026-08-10*
