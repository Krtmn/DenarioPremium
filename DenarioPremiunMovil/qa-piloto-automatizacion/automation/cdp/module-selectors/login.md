> Parte de `module-selectors/` — leer junto con `_comunes.md` (convención global).

## Módulo LOGIN

### Identidad
- Ruta Angular: `/login` → `/home`
- Componente raíz: `app-login`
- Overlay sincronización: `app-synchronization` (contiene `ion-progress-bar`)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Input Usuario | `app-login ion-input[placeholder="Usuario"]` / idx 0 | `[gmp-2606][ins-2610][dth-2612]` | **Sin atributo `name`** — identificar por placeholder o índice global. ⚠ los dos ion-input viven en `ion-col` distintos → `nth-of-type(2)` NO funciona; usar placeholder o índice 0/1 `[dth-2612]` |
| Input Contraseña | `app-login ion-input[placeholder="Contraseña"]` / idx 1 | `[gmp-2606][ins-2610][dth-2612]` | Sin `name` |
| Botón submit | `ion-button[type="submit"]` (texto "Aceptar") | `[gmp-2606][ins-2610][gmp-2611]` | click vía `pg.mouse.click` sobre centro del `getBoundingClientRect` basta — sin Pointer+Mouse combinado en este build `[gmp-2611]` |
| Botón secundario | `ion-button` (texto "Salir") | `[gmp-2606]` | |
| Checkbox recordar | `ion-checkbox` | `[gmp-2606][ins-2610]` | toggle `checked` por `mouse.click` en centro del bounding rect; `.checked` refleja el toggle |
| Alert login | `.alert-title` (título) + `.alert-message` (mensaje) | `[ins-2610]` | el texto puede venir vacío durante la animación de apertura — pollear hasta que `.alert-message` tenga contenido |
| Overlay sync | `app-synchronization` + `ion-progress-bar` | `[gmp-2606]` | usar `h.waitSyncOverlay` |

### Flujo mínimo probado

> ⚠ `h.waitSyncOverlay` NO basta como única señal de HOME: el overlay `app-synchronization` muestra `offsetParent === null` momentáneamente **entre fases de sync** (Etiquetas → Clientes → …), por lo que `waitSyncOverlay` puede retornar con la URL aún en `/synchronization`. Confirmar HOME con `waitForFunction`: `location.href.includes('/home') && app-home.offsetParent !== null`. `[gmp-2611]`

```
1. fillIonInput Usuario + Contraseña (creds: Read de qa-credentials.env → bloque "# Cliente: {QA_CLIENTE}", NO el bloque "# USUARIO WEB" ni el primer QA_USER del archivo)
2. Click ion-button[type=submit] "Aceptar"
3. Esperar app-synchronization ("Sincronizando - Clientes...") → h.waitSyncOverlay
4. Verificar app-home con módulos visibles; app-login no visible
```

### Anti-patrones confirmados
- No asumir `name="username"`/`name="password"` — esos inputs no tienen `name`. `[gmp-2606]`

### Notas por cliente
- HOME no muestra `ion-title` con nombre de empresa/usuario en globalmp. No hay selector de empresa post-login. Confirmado también en don-theo — no se puede leer `cliente_nombre` por UI post-login. `[gmp-2606][dth-2612]`
- piercar: login y sync completos en corrida 1ª sin cambios en selectores — todos los selectores estándar (placeholder, submit, checkbox) funcionaron sin modificaciones. `[prc-2606]`
- jerez: bajo NUEVO set de datos, todos los selectores estándar (Usuario/Contraseña por placeholder sin `name`, submit "Aceptar" con `pg.mouse.click` simple, checkbox `.checked` por mouse.click) funcionaron sin cambios; overlay `app-synchronization`+`ion-progress-bar` OK. `[jerez-2026-07-06]`
- **ferrenuestro (La Tortuga v6.6.18): el `ion-alert` de credenciales incorrectas cierra con botón "OK", NO "Aceptar"** — `alertButtonCoords('Aceptar')` devolvió `null`; hubo que usar `alertButtonCoords('OK')`. ⚠ Recomendación: al cerrar un alert de login, **leer el texto real del botón** o probar ambos ("Aceptar" y "OK") antes de calcular coords (los alerts informativos de flujo usan "OK" en este build; los confirm aún usan Aceptar/Cancelar). `[ferrenuestro-20260723]`
- **ferrenuestro: alert residual intercepta clicks fuera del diálogo (reconfirma RUNTIME S5)** — un `ion-alert` activo (`offsetParent!==null`, sin `overlay-hidden`) intercepta clicks en CUALQUIER coordenada (`elementFromPoint` devuelve `.alert-button-group`). Si un click a un control (ej. checkbox "Recordar usuario") no responde tras 1 intento, **diagnosticar con `elementFromPoint` ANTES de reintentar** — la causa suele ser un alert no cerrado (por el texto de botón equivocado), no el selector del control. `[ferrenuestro-20260723]`
- ✅ **el_palmar (Isla Coche v1.0/db19, `window.ng=TRUE`, 2 empresas): 6/6 PASS con los selectores estándar, sin ningún ajuste.** Inputs por **placeholder** (`Usuario`/`Contraseña`, sin `name`) y submit `ion-button[type="submit"]` texto "Aceptar" con **`pg.mouse.click` SIMPLE** — **no** hizo falta el gesto compuesto de `[ferrenuestro-20260723]`. Ambos alerts del módulo (campos vacíos **y** credenciales incorrectas) cierran con **"OK"**, reconfirmando `[alipascua-20260804]`; el recorrido `alertButtonCoords('Aceptar') || alertButtonCoords('OK')` **por igualdad exacta** los resolvió los dos. ⚠ **No hay selector de empresa en `app-login` ni en `app-home`** aun con `enterpriseEnabled=true` y **2 empresas** — amplía la nota de globalmp/don-theo a un caso multi-empresa: el selector vive **solo dentro de los formularios de módulo** (ver la tabla de variantes por módulo en `_comunes.md`). `[el_palmar-20260805]`
- 🔑 **LOGIN es el agente que deja el WebView listo para los otros 9 — instalar ahí el bundle endurecido.** `alertButtonCoords` por **igualdad exacta** + filtro `width>0` (el canónico usa `includes`, peligroso en alerts de 3 botones) e `installPayloadCapture` **con `data`** guardado por `window.__qaDataHook`. Como el bundle es idempotente, los 9 agentes siguientes **heredan `__qaH.getPayloadData()` → `[{url, data}]` sin duplicados y CON body** — cierra el gap de `[latino_cosmetica-20260729]`. Corolario para los agentes 2-10: **no reinstalar el bundle ni tocar `__qaCaptureInstalled`.** `[el_palmar-20260805]`
- ✅ **difranca (El Yaque v1.0/db19, `window.ng=TRUE`, 3 empresas): 6/6 PASS con los selectores estándar, sin ningún ajuste** — 2.ª playa consecutiva que **no** necesita el gesto compuesto de `[ferrenuestro-20260723]`. Inputs por **placeholder**, submit `ion-button[type="submit"]` "Aceptar" con **`pg.mouse.click` simple + `{delay:130}`**, checkbox `ion-checkbox` por coords del rect. Ambos alerts del módulo (campos vacíos **y** credenciales incorrectas) cierran con **"OK"**, reconfirmando `[alipascua-20260804]`/`[el_palmar-20260805]`. Igual: **listar** los botones, no predecirlos. `[difranca-20260807]`
- 🔑 **Endurecimiento del bundle: `activeAlertInfo()` debe devolver también `buttons[]`.** El alert activo se resuelve con `:not(.overlay-hidden)` **+** `offsetParent!==null`, quedándose con **el último**, y devolviendo la **lista literal** de botones (`width>0`) junto al título/mensaje. Con eso los ~6 alerts del módulo cerraron **sin un solo reintento de etiqueta** — es la implementación concreta de la regla "la etiqueta se LEE, no se predice" de `_comunes.md`. Instalarlo en LOGIN beneficia a los 9 agentes siguientes (el bundle es idempotente). `[difranca-20260807]`
- 🔴 **1.ª corrida de un cliente: puede salir un alert "usuario diferente al previamente ingresado" ANTES del alert de credenciales.** Es un **confirm de 2 botones `[Cancelar, Aceptar]`** que avisa que se va a **borrar la BD local**; recién después aparece el alert esperado del caso. Un agente LOGIN que solo espere el alert de credenciales lo lee como **FAIL**. **Esperarlo siempre en la 1.ª corrida de cada cliente/playa** y resolverlo por igualdad exacta. `[difranca-20260807]`
- **ferrenuestro: el submit tras `fillIonInput` puede requerir gesto compuesto** — el `pg.mouse.click(x,y)` simple (que sí funciona con formulario vacío) a veces no dispara el submit tras llenar campos vía `fillIonInput`; el gesto `mouse.move → mouse.down → wait ~80ms → mouse.up` sí lo disparó. Posible timing/layout-shift tras `fillIonInput` → recalcular coords justo antes del click y, si falla, probar el gesto compuesto antes de declarar BLOCKED. `[ferrenuestro-20260723]`

---
