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
> `[hidroponias-20260710]` hidroponias 20260710_084522 (2ª corrida COMPLETA 10/10 — servidor Isla La Tortuga v6.6.18; cobros/pedidos/inventarios/devoluciones/visitas/depósitos persistieron BD-OK; retención confirmada 14 díg; depositos.aplica=true confirmado).

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

---
