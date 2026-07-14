# Module Selectors — Denario Premium Móvil
## Memoria técnica extraída de corridas reales · NO modificar manualmente

> Selectores y patrones **probados en campo** en corridas globalmp, romher, insumar, hidroponias.
> Leer como tercer archivo obligatorio junto a `RUNTIME.md` + `smoke-{modulo}.md`.
> Actualizar solo vía `prompt-consolidar-hallazgos.md` — nunca a mano.
>
> **Tags de corrida:** `[gmp-2606]` globalmp 20260605_162806 · `[gmp-2611]` globalmp 20260611_181640 · `[rom-2606]` romher 20260604 ·
> `[ins-2606]` insumar 20260603 · `[ins-2610]` insumar 20260610_180320 · `[ins-2611]` insumar 20260611_122104 (parcial: COBROS) · `[hid-2605]` hidroponias 20260529 ·
> `[dth-2612]` don-theo 20260612_103038 (1ª corrida — servidor Isla Coche, mismo backend que insumar/globalmp) ·
> `[prc-2606]` piercar 20260616_131624 (1ª corrida — repuestos automotrices, servidor independiente) ·
> `[ins-2622]` insumar 20260622_115712 (oráculo BD operativo por 1ª vez en insumar; alias `[insumar-20260622]`) ·
> `[jerez-2026-07-06]` jerez 20260706_100801 (corrida PARCIAL 8/10: sin Productos/Vendedores, sin cotejo BD — solo UI + round-trip §9; build refactorizado El Yaque, `window.ng=false`) ·
> `[ferrenuestro-2026-07-07]` ferrenuestro 20260707_175334 (1ª corrida COMPLETA 10/10 — servidor Isla Coche, catálogo ferretería; build refactorizado El Yaque `window.ng=false`; verificación BD operativa con cotejo campo-a-campo; ⚠ sync a nube DIFERIDA ~3min — devoluciones/inventarios/depósitos aparecieron tras la ventana de poll, todos persistieron; NO es no-persistencia tipo jerez) ·
> `[hidroponias-20260710]` hidroponias 20260710_084522 (2ª corrida COMPLETA 10/10 — servidor Isla La Tortuga v6.6.18; cobros/pedidos/inventarios/devoluciones/visitas/depósitos persistieron BD-OK; retención confirmada 14 díg; depositos.aplica=true confirmado) ·
> `[dm-electronica-20260713]` dm-electronica 20260713_115814 (1ª corrida COMPLETA 10/10 — servidor El Yaque DM ELECTRONIC v6.6.18, catálogo línea blanca/electrónica; build refactorizado El Yaque pero ⚠ **`window.ng=TRUE`** (contrasta jerez/ferrenuestro El Yaque `window.ng=false`); verificación BD operativa con cotejo campo-a-campo BD-FIELD-OK en clientes/pedidos/devoluciones/inventarios/visitas; sync a nube INMEDIATA (NO diferida como ferrenuestro); ⚠ app crasheó durante el POST de envío del cobro (id_collection=5 persistió, requirió relanzar+re-map adb forward); mockCameraAdjunto SÍ funciona; 0 FAIL) ·
> `[latino_cosmetica-20260714]` latino_cosmetica 20260714_130727 (1ª corrida COMPLETA 10/10 — servidor Isla La Tortuga v6.6.18, catálogo cosmética; ⚠ **`window.ng=TRUE`** (como dm-electronica; contrasta jerez/ferrenuestro El Yaque); verificación BD campo-a-campo BD-FIELD-OK en clientes/pedidos/cobros/devoluciones/inventarios/visitas/depósitos; sync a nube INMEDIATA/persistente; ⚠ app crasheó durante el POST de envío del cobro (id 24 persistió al reintentar desde Guardado; **`collection` SÍ capturado en el reintento**); ⚠ **mock cámara webpack falla** → adjunto por fabricación de Foto en `adjuntoService`; retención = variante `dynamicRetentions` (DM-COB-041/042 BLOCKED, requiere helper); 0 FAIL).

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Ionic 6 + Angular (standalone, AOT production build + Ivy) |
| Runtime móvil | Capacitor (Android WebView) |
| Automatización | Playwright MCP + CDP vía `connectOverCDP('http://127.0.0.1:9220')` (`h.connectCdp`) |
| Package | `com.kiberno.denarioPremiumPro` |
| Router | Angular Router — `/login`, `/home`, `/cobros`, `/visitas`, `/visita`, `/pedidos`, `/inventarios`, `/productos`, `/vendedores`, `/depositos` |
| State | Servicios Angular con RxJS; state en instancia de servicio (no store) |

**Detección de vista activa:** siempre `h.getActiveView(pg, ['app-cobros', 'app-home', ...])` antes de interactuar. El componente activo se detecta por `offsetParent !== null`.

**Principio de interacción (universal):** los eventos Angular no se disparan con `element.click()` ni `dispatchEvent(MouseEvent)` simples en build AOT. Usar `pg.mouse.click(x, y)` con coords reales de `getBoundingClientRect()`. Para botones de navegación/envío en algunas vistas hace falta además `PointerEvent(pointerdown/up) + MouseEvent(click)` combinados (ver módulo COBROS).

**Convención de selectores recurrentes (todos los módulos):**
- Botones Guardar/Enviar de formulario: `ion-button.imagenGuardar` / `ion-button.imagenEnviar` — **icon-only, sin textContent**; localizar por clase CSS. Header fijo (`y≈32`), accesibles desde cualquier tab. Disabled hasta que el formulario es válido.
- Botón atrás: `img.fechaAtras` → `closest('a')` (helper `h.clickBack`). Excepción: PRODUCTOS no usa `.fechaAtras` (ver sección).
- Trash de borrado: `ion-button[color="danger"]` — solo aparece en ítems Estatus **Guardado** (nunca en Enviado).
- Modales: detectar apertura con `classList.contains('show-modal')`, no por ausencia de `overlay-hidden`.

---

## Gaps pendientes de mapear (sin selector probado aún)

Estos elementos no tienen selector confirmado porque ninguna corrida tuvo los datos/condiciones para ejecutarlos. Completar con búsqueda dirigida en el XML (Fase 5) o cuando una corrida los alcance.

| # | Módulo | Elemento sin mapear | Por qué no se capturó | Cómo desbloquear |
|---|--------|---------------------|------------------------|------------------|
| G1 | COBROS | Detalle de retención en documento (campo comprobante `sizeRetention`/`formatRetention`, fecha, monto IVA, monto ISLR) — DM-COB-041/042 | Ningún cliente tuvo documento vencido (rojo) elegible en sesión | Buscar `cobro-document-detail` en XML; o corrida con factura vencida en cartera |
| G2 | COBROS | Flujo interno de ANTICIPO/PREPAGO y COBRO 25% IVA (form, tabs) — DM-COB-028/037 | Botones visibles pero "No hay clientes disponibles" | Buscar componentes prepago/IGTF en XML; o cliente con elegibles |
| G3 | DEPÓSITOS | ✅ **CERRADO** `[ins-2610]` — Guardar→Enviar con cobro vinculado ejecutado end-to-end en insumar (Ref real Enviado); el bug de render no bloqueó | — | — |

---

## Apéndice — Notas CDP transversales

- **Socket CDP:** `webview_devtools_remote_<PID>` (NO `_1`). El PID cambia al reiniciar la app. Re-mapear: `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>`. `[gmp-2606][ins-2606]`
- **Conexiones stale:** múltiples corridas acumulan TCP ESTABLISHED en :9220 → `adb forward --remove` + re-forward. `[rom-2606]`
- **Reconexión mid-run:** el PID puede cambiar a mitad de corrida (app reinicia en HOME); la data ya enviada no se pierde. Tras re-mapear `adb forward` al nuevo PID, `connectOverCDP(:9220)` reconecta limpio y el estado (HOME) se conserva. ⚠ **Verificar `pg.url()` ≠ `chrome-error://` antes de operar; reintentar 1-2× si el target es inválido.** `[rom-2606][ins-2622]`
- **MCP→WebView (el `page` del MCP NO es el WebView):** el MCP playwright (`@playwright/mcp@0.0.75`) arranca SIN `--cdp-endpoint` → su `page` es un Chromium propio (about:blank, Chrome 149), NO el WebView. Para alcanzar el WebView desde `browser_run_code_unsafe`: `page.context().browser()._browserType.connectOverCDP('http://127.0.0.1:9220')` (patrón `h.connectCdp`) — funciona dentro del sandbox donde `require`/`process`/`module` están bloqueados. **Reconectar al inicio de CADA `browser_run_code_unsafe`** (contexto nuevo por llamada); `window.__qaH` persiste entre `evaluate` de la misma página. `[ins-2622]`
- **`browser_run_code_unsafe` requiere firma `async (page) => { ... }`:** el harness MCP envuelve el código como función y la invoca con `page`. Sentencias top-level con `const`/`return` o IIFE dan `SyntaxError` / `__fn__ is not a function`. Escribir siempre el cuerpo como arrow async que recibe `page`. `[dth-2612]`
- **Captura de payload por hook `CapacitorHttp`/`nativePromise` — cobertura por build:** en el build refactorizado El Yaque de ferrenuestro el hook SÍ capturó los POST de **order** (`orderservice/order`, cabecera+detalle+unidad), **return** (`returnservice/return`, cabecera+detalles), **visit** (`visitservice/visit`) y **potentialclient** — contradice parcialmente `reference_qa_payload_capture_gap` (que reportaba order/collection NO capturables). ⚠ **collection** SÍ siguió sin capturarse (0 POST `collectservice`, coherente con 0 cobros enviados por adjunto obligatorio) y **client_stock/deposit** no se interceptaron (registro despachado con sync diferida). Útil como cotejo BD cuando `sqlite3` local no está disponible en el device. Revisar si el gap era específico de otro build. `[ferrenuestro-2026-07-07]`
- **[dm-electronica amplía cobertura]** en el build El Yaque v6.6.18 de dm-electronica el hook `nativePromise` capturó **order**, **return**, **visit**, **potentialclient** Y **client_stock** (`clientstockservice/clientstock`, cabecera+detail+detail_unit) — client_stock SÍ se interceptó aquí (a diferencia de ferrenuestro, donde la sync diferida lo perdió; en dm-electronica la sync es inmediata). ⚠ **collection** siguió sin capturarse pero por una causa distinta: la app **crasheó durante el POST del cobro** (`collectservice`) — el POST llegó a la nube (id_collection=5 persistió) pero el hook pre-crash se perdió al recargar la app. **deposit** N/A (sin depósito creado). Confirma que la cobertura del hook depende del BUILD (ampliar `reference_qa_payload_capture_gap`). `[dm-electronica-20260713]`
- **⚠ `window.ng` disponible/indisponible NO es constante en el build refactorizado El Yaque:** jerez y ferrenuestro (El Yaque) tienen `window.ng=false` (sin debug Angular → helpers con fallback `window.ng` inoperantes), PERO **dm-electronica (El Yaque v6.6.18) tiene `window.ng=TRUE`** — `openNuevoCobro`/`openDocumentDetail`/`comp.nuevoCobro(0)` con fallback `window.ng` SÍ operan. ✅ **[2ª confirmación] latino_cosmetica (Isla La Tortuga v6.6.18) también tiene `window.ng=TRUE`** — conducción por componentes Angular fiable (fue NECESARIA en DEVOLUCIONES: los modales de cliente/factura no aceptan clicks). No asumir `window.ng=false` por servidor/build; **probar `!!window.ng` al inicio de la corrida** y elegir la ruta de conducción (fallback Angular vs solo clicks reales) según el resultado. `[dm-electronica-20260713][latino_cosmetica-20260714]`
- **⚠ Crash de app durante POST del cobro + recuperación (2 builds confirmados):** la app se cierra (proceso muerto, foco→launcher) tras aceptar "El Cobro será enviado", **después** de que el POST llegó a la nube (dato persistió). Confirmado en **dm-electronica** (El Yaque, id_collection=5) y **latino_cosmetica** (La Tortuga, el cobro quedó Guardado; el **reintento desde el Guardado completó sin crash**, id 24). Recuperación: relanzar (`monkey -p com.kiberno.denarioPremiumPro ... LAUNCHER`) + re-map `adb forward tcp:9220 localabstract:webview_devtools_remote_<nuevoPID>` + reinstalar bundle/captura; el auto-login (Recordar Usuario) recupera a HOME solo. ⚠ **Estrategia:** si el 1er Enviar crashea, reintentar el envío **desde el cobro Guardado** (no recrear). Riesgo de estabilidad a vigilar — reproducido en 2 servidores v6.6.18 distintos. `[dm-electronica-20260713][latino_cosmetica-20260714]`
- **Captura de `collection` — SÍ es posible tras el crash (latino_cosmetica):** contra la nota previa "collection nunca se captura", en latino_cosmetica el hook `nativePromise` capturó el POST `collectionservice/collection` en el **reintento exitoso** desde el Guardado (el POST pre-crash del 1er intento sí se perdió, como en dm-electronica). La cobertura del hook para collection depende de que el envío no crashee a mitad — reintentar desde Guardado da una 2ª oportunidad de captura. `[latino_cosmetica-20260714]`

---
