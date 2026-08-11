# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260807_120232_smoke-difranca-tag20` |
| Módulo | LOGIN |
| Cliente | difranca |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — `versionApp=1.0` · `db_version=19` · APK `versionName=1.0` / `versionCode=1` |
| Playa | EL YAQUE — `http://denarioelyaque.ddns.net:8081/PremiumWS/services/` |
| Empresa de la corrida | id 2 · `DDHP_A12` · *DISTRIBUIDORA DIAZ HERNANDEZ * |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Estado final | HOME, logueado (`/home`, `app-home` visible, sin alerts activos) |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → `ion-alert` "Denario Premium / **Usuario y/o password no pueden ser vacios**". Botón único: **"OK"** (no "Aceptar") — artefacto de etiqueta, no defecto. |
| DM-LOG-003 | ✅ PASS | Usuario válido + `QA_BAD_PASSWORD` → alert **"Usuario y/o contraseña incorrectos."** (botón "OK"), URL sigue en `/login`, `app-login` visible ⇒ no permitió login. Precedido de un confirm de sync (ver Estado descubierto §7). |
| DM-LOG-004 | ✅ PASS | Checkbox "Recordar Usuario" `checked: false → true`. **2 intentos**: el 1.º cayó en `DIV.alert-button-group` (alert de 003 sin cerrar) — diagnosticado con `elementFromPoint`, no es defecto. |
| DM-LOG-001 | ✅ PASS | Credenciales válidas → submit → ruta pasa a `/synchronization` en ~5 s. |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` **`type=determinate`, `value=0.031`** y rótulo "Sincronizando - Bancos / Por favor espere...". |
| DM-LOG-012 | ✅ PASS | Fases observadas: Bancos → Inventario → Promedio de Cliente → Detalles de Pedido → Bonificaciones de Producto → **`/home` con `app-home` visible y 10 tiles**; `app-login` no visible. Sync completa en **~35 s**. |

## Registros creados en sistema

Ninguno. Módulo de solo lectura — sin Verificación BD de escritura (`BD-N/A`).

---

## Estado descubierto
*(lo heredan los 7 agentes siguientes — no re-descubrir)*

### 1. Versión de la app — 🔴 EL TAG NO ES VERIFICABLE DESDE LA APP

| Fuente | Valor |
|---|---|
| Pantalla de login (pie) | `Versión 1.0` |
| `localStorage.versionApp` | `1.0` |
| `localStorage.db_version` | `19` |
| APK instalado (`dumpsys package`) | `versionName=1.0` · `versionCode=1` |
| `firstInstallTime` / `lastUpdateTime` del APK | **2026-08-07 09:32:23** (mismo día de la corrida, ~2,5 h antes) |

🔴 **NO se puede confirmar "tag 20" desde el dispositivo.** El proyecto **no versiona el APK**: `versionName=1.0` / `versionCode=1` son los mismos valores que ya reportaron `alipascua-20260804` (El Yaque) y `el_palmar-20260805` (Isla Coche) — dos builds distintos con idéntica huella. `db_version=19` tampoco discrimina.
**La única evidencia disponible es circunstancial:** el APK fue **reinstalado hoy 07/08 a las 09:32**, es decir, se instaló un build fresco para esta corrida. Si QA necesita certeza de que ese build es el tag 20, debe cotejarlo contra el artefacto que se instaló (hash/nombre del .apk o el commit del CI), **no contra la app**.

### 2. 🔴 Selector de empresa — dónde vive, cómo llega

**NO existe en `/login` ni en `/home`** (0 `ion-select` en `app-login` y en `app-home`; `document.querySelectorAll('ion-select').length === 0` estando en HOME). Tampoco hay cabecera de empresa. Confirma y amplía la nota de `el_palmar-20260805` a un caso de **3 empresas**.

**Vive dentro de los formularios de módulo.** Medido en **CLIENTES → CLIENTE POTENCIAL** (único form abierto en esta corrida, sin guardar nada):

```
ion-select[formcontrolname="idEnterprise"]
  disabled : false          ← EDITABLE
  value    : null           ← VACÍO
  ng-invalid: true          ← ENTRA EN LA VALIDACIÓN (obligatorio)
  shadowRoot rotula: "Seleccione..."
  ion-button.imagenGuardar.disabled = true
  ion-button.imagenEnviar.disabled  = true
```

⇒ **Variante "editable + vacío + obligatorio"**, idéntica a la de `el_palmar-20260805` (2+ empresas). Mientras no se elija empresa, **Guardar/Enviar no habilitan** — leerlo como "el botón no responde" sería un FAIL falso.

**Receta para setearlo** (validada en el_palmar, aplicable aquí):
```js
const s = document.querySelector('ion-select[formcontrolname="idEnterprise"]');
s.value = 2;                                    // ⚠ NUMBER, no string
s.dispatchEvent(new CustomEvent('ionChange', { bubbles:true, detail:{ value: 2 } }));
// no hace falta abrir el popover
```

⚠ **No asumir esta variante en los otros módulos.** En el_palmar el mismo build entregaba 4 variantes distintas por formulario (PEDIDOS preseleccionado; DEVOLUCIONES/INVENTARIOS/DEPÓSITOS/VISITAS sin `formcontrolname` y con el **objeto empresa completo** como `value`). **Leer `formcontrolname` + `disabled` + `value` + `ng-invalid` antes de decidir**, y actuar solo si `value === null`.

### 3. 🔴 Empresas: opciones LITERALES de la UI — la borrada NO aparece

Opciones del `ion-select` (texto exacto y `value`):

| `value` | Texto en la UI | `co_enterprise` | Rol |
|---|---|---|---|
| `2` | `*DISTRIBUIDORA DIAZ` | `DDHP_A12` | **la de esta corrida** |
| `3` | `DIFRANCA C.A` | `DIF_A12` | |
| `4` | `DISTRIBUIDORA DH VI` | `DHVITAL01_A` | |

✅ **`DDH_A12` (id 1, `co_operation='D'` en BD) NO aparece en el selector — y ni siquiera bajó al dispositivo:** la tabla local `enterprises` tiene exactamente **3 filas (id 2, 3, 4)**. El filtro de borrados se respeta en la sincronización. **No es hallazgo.**

⚠ **La UI rotula `lb_enterprise`, que viene TRUNCADO a 19 caracteres en el servidor** — por eso se lee `*DISTRIBUIDORA DIAZ` y `DISTRIBUIDORA DH VI`. El nombre completo vive en `na_enterprise` y **no se muestra**:

| id | `lb_enterprise` (lo que muestra la UI) | `na_enterprise` (completo) | RIF |
|---|---|---|---|
| 2 | `*DISTRIBUIDORA DIAZ` | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | J305033900 |
| 3 | `DIFRANCA C.A` | `DIFRANCA C.A` | J311488766 |
| 4 | `DISTRIBUIDORA DH VI` | `DISTRIBUIDORA DH VITAL, C.A.` | J294607691 |

Es **dato del cliente** (nombres cargados con asteriscos y truncados), no defecto de la 20.

✅ **A favor del cliente:** la empresa de la corrida (id 2) es a la vez `enterprise_default="true"` **y** `priority_selection=0` ⇒ cuando un form auto-seleccione empresa, tomará la correcta. **No se repite la trampa de el_palmar** (donde el `enterprise_default` apuntaba a la empresa equivocada). Verificar igual en cada registro creado.

⚠ **`co_currency_default` es inconsistente entre empresas:** id 2 y 4 = `US$`, id 3 (DIFRANCA) = `USD`. Si algún módulo compara el código de moneda por string, el par difranca/DIFRANCA puede divergir. **Dato a vigilar en cobros/pedidos.**

### 4. Tiles del HOME (lista literal, en orden)

`Visitas` · `Inventarios` · `Pedidos` · `Devoluciones` · `Cobros` · `Depósitos` · `Vendedores` · `Productos` · `Clientes` · `Sincronizar`

- **Están los 9 módulos + Sincronizar.** ✅ **Inventarios y Depósitos SÍ tienen tile** (no se corren en esta corrida por decisión de QA / `clientStock=false`, pero la entrada existe: no es N/A por ausencia de UI).
- `app-clientes` ofrece 3 botones: `CLIENTES` · `CLIENTE POTENCIAL` · `BUSCAR CLIENTE POTENCIAL`.

### 5. `window.__env.WsUrl`

`http://denarioelyaque.ddns.net:8081/PremiumWS/services/` — **EL YAQUE confirmado** (leído en el WebView, 1 sola lectura).

### 6. Alert de credenciales incorrectas

**Sí aparece.** Título `Denario Premium`, mensaje `Usuario y/o contraseña incorrectos.`, **1 botón: `OK`**.

### 7. ⚠ Alert de confirmación de sync al cambiar de usuario (nuevo, afecta a la 1.ª corrida de cada cliente)

En **DM-LOG-003** (primer submit con usuario), antes del alert de credenciales, la app mostró:

> **"Está intentando sincronizar con un usuario que es diferente al previamente ingresado, de aceptar la sincronización todos los datos anteriores serán borrados. ¿Está de acuerdo?"** — botones `[Cancelar, Aceptar]`

El device traía los datos del cliente anterior (`alipascua`). Se aceptó ⇒ **la BD local se borró y se resincronizó desde cero para difranca**. Es comportamiento correcto, pero implica dos cosas para la cadena:
1. **No queda dato residual de la corrida anterior** en la BD local — los baselines locales arrancan limpios.
2. Este alert **no volvió a aparecer** en DM-LOG-001 (mismo usuario ya registrado). Solo dispara en el 1.er login tras cambiar de cliente.

### 8. Entorno técnico (para los agentes 2-10)

| Dato | Valor |
|---|---|
| `window.ng` | **`true`** — conducción por componentes Angular disponible |
| `window.sqlitePlugin` | **disponible** — BD local consultable (`enterprises` leída OK) |
| Bundle `window.__qaH` | **instalado por este agente (13 skills)** — `getActiveView`, `fillIonInput`, `clickIonItem`, `clickBack` (con filtro `width>0`), `isVisible`, `activeAlertInfo` (con `buttons`), `coordsOf`, `alertButtonCoords` (**igualdad exacta**), `killLoadings`, `homeTiles`, `installPayloadCapture`, `getPayloadData`, `getCapturedPayloads` |
| Captura de payload | **activa con `data`**, hook único protegido por `window.__qaDataHook`. **65 entradas** capturadas durante la sync. Usar `__qaH.getPayloadData()` → `[{url, data}]`. 🔴 **NO reinstalar el bundle ni tocar `__qaCaptureInstalled`** (apila wrappers y duplica). |
| Viewport | 360×744 |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selectores estándar de LOGIN sin ajuste | universal | Inputs por **placeholder** (`Usuario`/`Contraseña`, sin `name`), submit `ion-button[type="submit"]` texto "Aceptar" con **`pg.mouse.click` simple + `delay:130`**, checkbox `ion-checkbox` por coords. 6/6 PASS. No hizo falta el gesto compuesto de `[ferrenuestro-20260723]`. |
| Ambos alerts de LOGIN cierran con **"OK"** | cliente (build El Yaque v1.0) | Campos vacíos **y** credenciales incorrectas → botón único `OK`. Reconfirma `[alipascua-20260804]`/`[el_palmar-20260805]`. Igual: **listar** los botones, no predecirlos. |
| `activeAlertInfo()` devolviendo también `buttons[]` | universal | Endurecimiento del bundle: el alert activo se lee con `:not(.overlay-hidden)` + `offsetParent!==null`, se toma **el último**, y se devuelve la lista literal de botones (`width>0`). Cerró los ~6 alerts del módulo sin un solo reintento de etiqueta. |
| Alert residual come el click del checkbox | universal (reconfirma) | 1.er click en `ion-checkbox` → `elementFromPoint` = `DIV.alert-button-group`. Diagnosticar con `elementFromPoint` **antes** de reintentar; no es defecto ni BLOCKED. |
| 🔴 `page.__qa` NO siempre persiste entre llamadas | universal — **corrige `[gmp-20260730]`** | El truco de cachear el prelude en `page.__qa` funcionó 5 llamadas y a la 6.ª dio `TypeError: Cannot read properties of undefined (reading 'connectCdp')`: el harness MCP entregó **otra instancia de `page`**. **Envolver siempre el uso en un fallback** (`const q = page.__qa || (page.__qa = <prelude inline>)`) en vez de asumir persistencia. Costó 1 llamada perdida. |
| Alert de "usuario diferente al previamente ingresado" | universal (1.ª corrida de cada cliente) | Ver §7. Confirm `[Cancelar, Aceptar]` **antes** del alert de credenciales; borra la BD local. Un agente LOGIN que solo espere el alert de credenciales lo lee como FAIL. |
| Empresa borrada (`co_operation='D'`) no llega al device | universal | La tabla local `enterprises` trae solo las activas ⇒ el filtro de borrados se aplica en la sync, no en la UI. Verificable barato con `sqlitePlugin` sin abrir ningún form. |
| La UI del selector de empresa rotula `lb_enterprise` (19 chars) | universal | El nombre legible completo (`na_enterprise`) **no se muestra**. Al cotejar "el nombre de la empresa" contra BD, comparar contra `lb_enterprise`, no contra `na_enterprise`. |

> ✅ consolidado 2026-08-07

## Hallazgos (FAIL)

Ninguno. 0 FAIL en el módulo.

**Defectos conocidos de la 20 cruzados en LOGIN:** ninguno — la tabla de RUNTIME §5 no lista casos de login. Los alerts con etiqueta "OK" y el truncado de `lb_enterprise` **no son defectos**.
