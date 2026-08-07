# Smoke Test — Módulo LOGIN

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | LOGIN |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v1.0 (db_version 19) |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Cliente | el_palmar (1ª corrida) |
| Usuario QA | `***` / `***` |
| Resultado | **6 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-LOG-002 | ✅ PASS | Submit con campos vacíos → `ion-alert` "Denario Premium" / **"Usuario y/o password no pueden ser vacios"**; botón rotulado **"OK"** |
| DM-LOG-003 | ✅ PASS | Usuario válido + contraseña incorrecta → alert **"Usuario y/o contraseña incorrectos."** (botón "OK"); permanece en `app-login`, url `/login`, NO entra |
| DM-LOG-004 | ✅ PASS | `ion-checkbox` "Recordar Usuario": `checked` false → **true** (`aria-checked="true"`) tras `pg.mouse.click` en el centro del rect |
| DM-LOG-001 | ✅ PASS | Credenciales correctas → submit → navega a `/synchronization` en <2 s; overlay de sync arranca |
| DM-LOG-011 | ✅ PASS | `app-synchronization` visible con `ion-progress-bar` activo; progreso real 0.0156 → 0.4844; fases observadas: Dirección de Clientes → Bancos → **Empresas** → Productos → Inventario → IVA → Información de Usuario → Estructura de Producto |
| DM-LOG-012 | ✅ PASS | `app-home` visible, `location.href = http://localhost/home`, 10 módulos renderizados. Tiempo login→HOME ≈ **16,6 s**. Sin alert de GPS (coherente con `userMustActivateGPS=false`) |

## Registros creados en sistema

Ninguno. Módulo de solo lectura — sin Verificación BD (`BD-N/A`).

> El sondeo del selector de empresa se hizo abriendo el form de Cliente Potencial **sin guardar ni enviar**: se salió con `clickBack`, no apareció dirty-guard y no quedó ningún registro ni modal residual.

---

## Estado descubierto

### 1. Versión de la app
La UI **no rotula versión** en ningún lado: la pantalla de login solo muestra `Recordar Usuario / ACEPTAR / SALIR`, y el pie de HOME dice `Copyright © 2025. All rights reserved. POWERED BY KIBERNO`. **No hay pantalla About.**
Fuente real de la versión: `localStorage.versionApp = "1.0"` y `localStorage.db_version = "19"`. Coincide con el build El Yaque v1.0/db19 de `alipascua-20260804`.

### 2. 🔴 SELECTOR DE EMPRESA — dónde vive y cómo se comporta

**Respuesta corta: SÍ hay selector, pero NO tras el login ni en HOME. Vive DENTRO de los formularios de cada módulo, llega HABILITADO, SIN preselección y es OBLIGATORIO.**

| Pregunta | Hallazgo |
|---|---|
| ¿Aparece tras el login? | **NO.** `app-login` no tiene ni un `ion-select` (0 nodos). Tras "Aceptar" va directo a `app-synchronization` → `app-home`. |
| ¿Aparece en HOME? | **NO.** `app-home` tiene 0 `ion-select` y 0 `ion-title`; no hay banda ni cabecera con nombre de empresa. |
| ¿Dónde aparece entonces? | **Dentro de los formularios de módulo.** Confirmado en `app-client-new-potential-client` (Clientes → CLIENTE POTENCIAL): `ion-select[formcontrolname="idEnterprise"]`. |
| ¿Qué opciones lista, literalmente? | Exactamente 2 `ion-select-option`: **`value=1` → "CENTRAL EL PALMAR, S.A."** y **`value=2` → "C.A. DESTILERIA YARACUY"** |
| ¿Cuál queda preseleccionada? | **NINGUNA.** `sel.value === null` al abrir el form. |
| ¿Editable o disabled? | **EDITABLE** — `sel.disabled === false`. |
| ¿Es obligatorio? | **SÍ.** Al abrir llega con clase **`ng-invalid`** (`ion-text-center always-flip ng-touched ng-pristine ng-invalid`) ⇒ mientras no se elija empresa el form NO valida y Guardar/Enviar quedan bloqueados. Tras setearlo, `ng-invalid` desaparece. |

**🔴 Esto ROMPE la regla vigente en `_comunes.md`** («en v1.0/db19 el `idEnterprise` llega `disabled=true` con la empresa auto-asignada, fuera de la validación»). Esa regla se levantó en clientes con **una sola empresa**. Con **2 empresas + `enterpriseEnabled=true` el select llega editable, vacío y obligatorio**: los 9 agentes siguientes **deben setearlo explícitamente** o sus formularios no van a habilitar Guardar/Enviar, y se leerá como "el botón no habilita" (falso FAIL).

**Receta validada en este build (`window.ng=true`, v1.0/db19):**

```js
const s = document.querySelector('ion-select[formcontrolname="idEnterprise"]');
s.value = 1;                                   // ⚠ NUMBER, no string: 1 = CENTRAL EL PALMAR, S.A.
s.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: 1 } }));
```
Verificación posterior: `s.value === 1`, `ng-invalid` desaparece y el shadowRoot rotula `CENTRAL EL PALMAR, S.A.`. No hace falta abrir el popover.

**🔴🔴 Trampa que hay que vigilar en los 9 módulos — el DEFAULT de la BD NO es la empresa de la corrida:**
la tabla local `enterprises` marca `enterprise_default` en **`C.A. DESTILERIA YARACUY` (id 2 / co 1003)**, no en CENTRAL EL PALMAR (id 1 / co 1002, `enterprise_default="false"`, `priority_selection=0` vs `1`):

| id_enterprise | co_enterprise | lb_enterprise / na_enterprise | nu_rif | priority_selection | enterprise_default |
|---|---|---|---|---|---|
| 1 | 1002 | **CENTRAL EL PALMAR, S.A.** | J000062730 | 0 | `"false"` |
| 2 | 1003 | C.A. DESTILERIA YARACUY | J000107980 | 1 | **`"true"`** |

Si algún formulario **sí** auto-asignara empresa (p. ej. cobros/pedidos con `orderTypeByEnterprise`), lo más probable es que auto-asigne **YARACUY**, no El Palmar. **Regla para los agentes: leer `sel.value` ANTES de operar; si viene seteado y no es `1`, forzarlo a `1` y dejarlo anotado en el reporte** — de lo contrario los registros de la corrida se crearían contra la empresa equivocada.

### 3. Nombres EXACTOS de las empresas según la UI
- `CENTRAL EL PALMAR, S.A.` — con coma antes de "S.A." y punto final. (La corrida usa ésta.)
- `C.A. DESTILERIA YARACUY` — sin tilde en "DESTILERIA".

Idénticos en `ion-select-option` y en la columna `lb_enterprise`/`na_enterprise` de la tabla local `enterprises`.

### 4. Módulos / tiles del HOME (lista literal, en orden de render)
`Visitas` · `Inventarios` · `Pedidos` · `Devoluciones` · `Cobros` · `Depósitos` · `Vendedores` · `Productos` · `Clientes` · `Sincronizar`
(+ botón **SALIR** y pie `Copyright © 2025. All rights reserved. POWERED BY KIBERNO`).
Los 10 módulos del smoke están presentes y visibles: **ninguno es N/A por ausencia de tile**.
En `/clientes` los 3 botones son: `CLIENTES` · `CLIENTE POTENCIAL` · `BUSCAR CLIENTE POTENCIAL`.

### 5. WsUrl — evidencia
`window.__env.WsUrl === "http://denarioislacoche.ddns.net:8081/PremiumWS/services/"` ✅ (playa **Isla Coche** confirmada; `window.__env` expone además `API_BASE_URL` y claves de build).

### 6. ¿Aparece el alert de credenciales incorrectas?
**SÍ, aparece.** Con usuario válido + contraseña incorrecta la app muestra `ion-alert` título "Denario Premium", mensaje **"Usuario y/o contraseña incorrectos."**, botón "OK", y **no** deja entrar (sigue en `app-login`).
⇒ El "no aparecía" observado ayer en el otro cliente **no es defecto del build v1.0/db19**: acá el mismo build lo muestra correctamente. Queda como particularidad de aquel cliente/estado, no del build.

### 7. Otros datos del entorno
- `window.ng = true` ⇒ conducción por componentes Angular disponible en esta corrida.
- `window.sqlitePlugin` operativo (se leyó `enterprises` sin problema). Los booleanos vuelven como **string** (`"true"`/`"false"`) — consistente con `[gmp-20260730]`.
- 7 nodos `ion-alert` acumulados en el DOM desde el arranque, todos de `<app-message>`: filtrar SIEMPRE por `:not(.overlay-hidden)` + `offsetParent!==null`.
- `localStorage.globalConfiguration` existe con **180 claves**, pero **ninguna** cuyo nombre matchee `/enterprise|empresa|gps|igtf/i` ⇒ `enterpriseEnabled` **no** se lee desde ahí; su fuente es la tabla `global_configuration` de la BD. No perder tiempo buscándolo en localStorage.
- La app arrancó **en `/login`** (no en HOME como anticipaba el orquestador) ⇒ no hizo falta "Salir".

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 `ion-select[formcontrolname="idEnterprise"]` **editable + vacío + `ng-invalid`** cuando hay **2+ empresas** | universal (corrige regla vigente) | Con **una** empresa llega `disabled=true` autoasignada (`[latino_cosmetica-20260729][alipascua-20260804]`); con **dos** llega `disabled=false`, `value=null` y **obligatorio**. Setear con `s.value=<number>` + `ionChange`. **Leer `sel.disabled` Y `sel.value` antes de decidir.** |
| `enterprise_default` de la BD local ≠ empresa de la corrida | cliente (el_palmar) | Default = `C.A. DESTILERIA YARACUY` (id 2); la corrida usa `CENTRAL EL PALMAR, S.A.` (id 1). Verificar la empresa efectiva en cada registro creado. |
| No hay selector de empresa en `app-login` ni en `app-home` | universal | El selector vive solo en los forms de módulo. Amplía la nota de login.md «no hay selector de empresa post-login» a un caso con `enterpriseEnabled=true` + 2 empresas. |
| Alert de campos vacíos y de credenciales usan botón **"OK"** | universal (build v1.0/db19) | Reconfirma `[alipascua-20260804]`. `alertButtonCoords('Aceptar') || alertButtonCoords('OK')` por igualdad exacta resolvió ambos. |
| `alertButtonCoords` por **igualdad exacta** + filtro `width>0` | universal | Variante endurecida del helper del bundle (el canónico usa `includes`, peligroso en alerts de 3 botones). Instalada en `window.__qaH` de esta corrida. |
| `installPayloadCapture` **con `data`** y guarda `window.__qaDataHook` | universal | Instalado por LOGIN (1er agente) ⇒ los 9 agentes siguientes heredan `window.__qaH.getPayloadData()` → `[{url, data}]` **sin duplicados y con body**. Resuelve el gap `[latino_cosmetica-20260729]`. **No reinstalar el bundle ni tocar `__qaCaptureInstalled`.** |
| `p.nombreModulos` → `closest('a')` → `pg.mouse.click` | universal (reconfirmado) | Entrada a módulo desde HOME funcionó sin cambios. Back con `img.fechaAtras` filtrado por `width>0` volvió de form→lista→HOME sin dirty-guard. |
| Login: inputs por **placeholder** (`Usuario` / `Contraseña`), sin `name` | universal (reconfirmado) | Submit `ion-button[type="submit"]` texto "Aceptar" con `pg.mouse.click` simple — **no** hizo falta el gesto compuesto de `[ferrenuestro-20260723]`. |


> ✅ consolidado 2026-08-05
## Hallazgos (FAIL)

Ninguno. 0 FAIL en el módulo.

---

*Watchdog: 0 cuelgues, 0 reconexiones. Wall-clock del módulo ≈ 6 min sobre techo de 45 min.*
