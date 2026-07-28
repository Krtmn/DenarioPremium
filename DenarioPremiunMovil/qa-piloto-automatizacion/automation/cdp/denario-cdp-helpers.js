/**
 * denario-cdp-helpers.js
 * Helpers CDP reutilizables — Denario Premium Móvil QA
 *
 * USO en browser_run_code_unsafe:
 *   ⚠ En ese contexto NO existen `require` ni `fs`. La única vía es:
 *   leer este archivo con la herramienta Read (ruta relativa) y copiar las funciones
 *   que necesites VERBATIM. Para credenciales: leer secrets/qa-credentials.env con Read y
 *   parsear el bloque "# Cliente: <slug>" inline — fetchCreds() usa fs y NO corre aquí.
 *
 * Ruta (relativa a la raíz qa-piloto-automatizacion/, portable):
 *   automation/cdp/denario-cdp-helpers.js
 */

const CDP_URL = 'http://127.0.0.1:9220';

// ---------------------------------------------------------------------------
// CONEXIÓN
// ---------------------------------------------------------------------------

/**
 * Corta cualquier promesa que se cuelgue. Base del watchdog (RUNTIME §11).
 * Lanza Error('TIMEOUT:<label> tras <ms>ms') — el prefijo TIMEOUT: es lo que cuenta makeWatchdog.
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} [label]
 */
/**
 * ⚠ En `browser_run_code_unsafe` **NO existe `setTimeout`** (confirmado en la corrida
 * el_valle-20260728: inlinar esto sin `timer` lanzaba `ReferenceError: setTimeout is not defined`).
 * Por eso se acepta un `timer` = objeto Playwright con `waitForTimeout` (`page` o `pg`).
 * En contexto Node (self-tests, scripts) `timer` se omite y usa `setTimeout`.
 */
function _espera(ms, timer) {
  if (timer && typeof timer.waitForTimeout === 'function') return timer.waitForTimeout(ms);
  if (typeof setTimeout === 'function') return new Promise((r) => setTimeout(r, ms));
  throw new Error('sin temporizador: pasá `page`/`pg` como `timer` — setTimeout no existe en browser_run_code_unsafe');
}

function withTimeout(promise, ms, label, timer) {
  const guard = _espera(ms, timer).then(() => {
    throw new Error('TIMEOUT:' + (label || 'op') + ' tras ' + ms + 'ms');
  });
  return Promise.race([promise, guard]);
}

/**
 * Conectar al WebView de la app vía CDP y devolver la página activa.
 * Siempre usar este helper en vez de escribir connectOverCDP inline.
 * Con techo de tiempo + reintento acotado: un `connectOverCDP` que no responde
 * ya no cuelga el módulo — falla con 'CDP-DOWN:' y el agente marca ⛔ BLOCKED (RUNTIME §11).
 * @param {object} page - la `page` que expone browser_run_code_unsafe
 * @param {{timeoutMs?:number, retries?:number}} [opts]
 */
async function connectCdp(page, opts) {
  const o = opts || {};
  const timeoutMs = o.timeoutMs || 20000;
  const retries   = o.retries == null ? 2 : o.retries;
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const cdp = await withTimeout(
        page.context().browser()._browserType.connectOverCDP(CDP_URL), timeoutMs, 'connectOverCDP', page);
      const ctx = cdp.contexts()[0];
      const pg  = ctx && ctx.pages()[0];
      if (!pg) throw new Error('CDP conectó pero no hay páginas');
      await withTimeout(pg.bringToFront(), 5000, 'bringToFront', page);
      return pg;
    } catch (e) {
      last = e;
      if (i < retries) await _espera(1500 * (i + 1), page);
    }
  }
  throw new Error('CDP-DOWN: ' + (last && last.message));
}

/** Ping barato al WebView: ¿el CDP sigue vivo? No lanza — devuelve boolean. */
async function cdpAlive(pg, ms) {
  try { await withTimeout(pg.evaluate(() => 1), ms || 5000, 'ping', pg); return true; }
  catch (e) { return false; }
}

/**
 * Watchdog de módulo (RUNTIME §11). Envuelve cada operación con techo de tiempo,
 * cuenta cuelgues y aborta el módulo antes de que un hang de CDP se coma horas de wall-clock.
 *
 *   const wd = h.makeWatchdog({ moduleMs: 45*60*1000, page });   // ⚠ `page` OBLIGATORIO en
 *   await wd.run('openNuevoCobro', () => h.openNuevoCobro(pg, 0));  //   browser_run_code_unsafe
 *
 * ⚠ Sin `page`, en `browser_run_code_unsafe` revienta con `ReferenceError: setTimeout is not defined`
 *   (no existe en ese sandbox). En Node (self-tests) `page` se omite.
 *
 * - `TIMEOUT:` → cuenta un cuelgue. Al llegar a `maxHangs` lanza 'ABORT-MODULE:...'.
 * - Superado `moduleMs` → lanza 'ABORT-MODULE:techo-wall-clock' antes de arrancar la op.
 * - Cualquier otro error se propaga tal cual (es un FAIL/BLOCKED normal, no un cuelgue).
 *
 * @param {{opMs?:number, maxHangs?:number, moduleMs?:number}} [opts]
 */
function makeWatchdog(opts) {
  const o = opts || {};
  const opMs     = o.opMs     || 90000;              // techo por operación
  const maxHangs = o.maxHangs || 2;                  // cuelgues tolerados por módulo
  const moduleMs = o.moduleMs || 45 * 60 * 1000;     // techo de wall-clock del módulo
  const timer    = o.page || o.timer || null;        // ⚠ OBLIGATORIO en browser_run_code_unsafe
  const t0 = Date.now();
  let hangs = 0;
  return {
    hangs: () => hangs,
    elapsedMs: () => Date.now() - t0,
    budgetLeftMs: () => moduleMs - (Date.now() - t0),
    run: async (label, fn, ms) => {
      if (Date.now() - t0 > moduleMs) {
        throw new Error('ABORT-MODULE:techo-wall-clock (' + Math.round((Date.now() - t0) / 60000) + ' min)');
      }
      try {
        return await withTimeout(Promise.resolve().then(fn), ms || opMs, label, timer);
      } catch (e) {
        if (String(e && e.message).indexOf('TIMEOUT:') === 0) {
          hangs++;
          if (hangs >= maxHangs) {
            throw new Error('ABORT-MODULE:' + hangs + ' cuelgues de CDP (último: ' + label + ')');
          }
        }
        throw e;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// CREDENCIALES
// ---------------------------------------------------------------------------

/**
 * Obtener credenciales QA leyendo secrets/qa-credentials.env directamente.
 * Devuelve { user, pass, badPass }.
 * @deprecated NO usar en browser_run_code_unsafe — usa fs/require y revienta en ese contexto.
 *   Allí: leer el archivo con la herramienta Read y parsear el bloque "# Cliente:" inline (RUNTIME §1).
 *   Esta función solo es válida en contexto Node (scripts de automation/db/).
 * @param {string} clienteId - slug del cliente (ej. 'insumar', 'hidroponias'). **OBLIGATORIO.**
 *   El archivo usa secciones "# Cliente: <slug>" como marcadores, y **abre con un bloque
 *   `# USUARIO WEB`** (credenciales de la web, no de la app). Por eso ya NO hay fallback al
 *   primer bloque: sin clienteId, o con uno inexistente, lanza en vez de devolver el usuario
 *   equivocado (2026-07-28).
 * @throws si falta clienteId o el bloque no existe.
 */
async function fetchCreds(clienteId) {
  const path = require('path');
  const fs   = require('fs');
  const credsPath = path.join(__dirname, '..', '..', 'secrets', 'qa-credentials.env');
  const text  = fs.readFileSync(credsPath, 'utf8');

  // ⚠ El archivo abre con un bloque `# USUARIO WEB` (credenciales de la WEB, no de la app).
  //   Por eso NO se puede caer al texto completo: el primer QA_USER= del archivo es el de la web.
  //   Sin clienteId, o con un clienteId inexistente, se falla explícito en vez de devolver el usuario equivocado.
  if (!clienteId) throw new Error('fetchCreds: falta el clienteId (el 1.er bloque del archivo es # USUARIO WEB, no un cliente)');
  const marker = `# Cliente: ${clienteId}`;
  const idx    = text.toLowerCase().indexOf(marker.toLowerCase());
  if (idx === -1) throw new Error(`fetchCreds: no existe el bloque "${marker}" en qa-credentials.env`);
  let searchText = text.slice(idx);
  const nextSection = searchText.indexOf('\n# Cliente:', 1);
  if (nextSection !== -1) searchText = searchText.slice(0, nextSection);

  const lines = searchText.split('\n');
  const get   = (key) => {
    const line = lines.find(l => l.trim().startsWith(key + '='));
    if (!line) return '';
    return line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
  };
  return { user: get('QA_USER'), pass: get('QA_PASSWORD'), badPass: get('QA_BAD_PASSWORD') };
}

// ---------------------------------------------------------------------------
// DETECCIÓN DE ESTADO (Skill 1)
// ---------------------------------------------------------------------------

/**
 * Devuelve el primer selector Angular visible (offsetParent !== null) de la lista.
 * Usar ANTES de cada bloque del guión para verificar precondición.
 *
 * Ejemplo:
 *   const vista = await getActiveView(pg, ['app-client-home','app-client-list','app-client-detail']);
 */
async function getActiveView(pg, candidates) {
  return await pg.evaluate((sels) => {
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return sel;
    }
    return null;
  }, candidates);
}

// ---------------------------------------------------------------------------
// INTERACCIÓN CON ion-input (Skill 2)
// ---------------------------------------------------------------------------

/**
 * Llenar un ion-input en formularios Angular reactive.
 * Patrón: native value setter + Event input/change + CustomEvent ionChange/ionInput.
 * Usar en TODOS los módulos EXCEPTO inventory-type-stocks-modal (usar fillNgModelKeyboard).
 */
async function fillIonInput(pg, selector, value) {
  await pg.evaluate(([sel, val]) => {
    const ionEl = document.querySelector(sel);
    if (!ionEl) throw new Error(`fillIonInput: selector no encontrado → ${sel}`);
    const inp = ionEl.querySelector('input') || ionEl;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, val);
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    ionEl.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
    ionEl.dispatchEvent(new CustomEvent('ionInput',  { bubbles: true, detail: { value: val } }));
  }, [selector, value]);
}

/**
 * Llenar campos ngModel en inventory-type-stocks-modal (cantidad, lote, fecha).
 * El patrón fillIonInput actualiza el DOM pero no el ngModel — usar focus + keyboard aquí.
 * PROHIBIDO fuera de inventory-type-stocks-modal.
 */
async function fillNgModelKeyboard(pg, selector, value) {
  await pg.click(selector, { clickCount: 3 });
  await pg.keyboard.type(String(value));
}

/**
 * Llenar un input ngModel "resistente" en modales reactivos donde `fillIonInput`
 * NO actualiza el FormControl y `pg.click(selector)` NO fija el foco (el selector
 * apunta al wrapper `ion-input`, o el modal intercepta el click).
 * Estrategia: foco por CLICK REAL en las coordenadas del `<input>` interno →
 * Ctrl+A + Delete + teclear → emitir input/change/ionInput/ionChange + blur para
 * que ngModel/(ionChange) reciban el valor.
 *
 * Generaliza `fillNgModelKeyboard` (que solo sirve en inventory-type-stocks-modal)
 * a cualquier modal reactivo. Caso probado objetivo: detalle de retención jerez
 * (Monto retenido IVA / ISLR) — DM-COB-041/042. `[jerez-2026-07-06]`
 */
async function fillNgModelField(pg, selector, value) {
  const coords = await pg.evaluate((sel) => {
    const host = document.querySelector(sel);
    if (!host) return null;
    const inp = host.matches('input,textarea') ? host : host.querySelector('input,textarea');
    if (!inp) return null;
    inp.scrollIntoView({ block: 'center' });
    const r = inp.getBoundingClientRect();
    if (!r || r.width === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, selector);
  if (!coords) throw new Error(`fillNgModelField: input no encontrado o no visible → ${selector}`);

  await pg.mouse.click(coords.x, coords.y);                 // foco real (no pg.click al wrapper)
  await pg.keyboard.down('Control');
  await pg.keyboard.press('KeyA');
  await pg.keyboard.up('Control');
  await pg.keyboard.press('Delete');
  await pg.keyboard.type(String(value));

  await pg.evaluate((sel) => {
    const host = document.querySelector(sel);
    const inp  = host && (host.matches('input,textarea') ? host : host.querySelector('input,textarea'));
    if (!inp) return;
    inp.dispatchEvent(new Event('input',  { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    const ion = inp.closest('ion-input') || host;
    if (ion && ion.dispatchEvent) {
      ion.dispatchEvent(new CustomEvent('ionInput',  { bubbles: true, detail: { value: inp.value } }));
      ion.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: inp.value } }));
    }
    inp.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  }, selector);
  await pg.waitForTimeout(200);
}

// ---------------------------------------------------------------------------
// ion-select con POPOVER (Skill — §3.5)
// ---------------------------------------------------------------------------

/**
 * Seleccionar un valor en ion-select que abre popover de radio buttons.
 * NUNCA usar MouseEvent sobre ion-item/ion-radio dentro del popover — no lo cierra.
 * Asigna el valor directamente al ion-select y llama dismiss() en el popover.
 */
async function selectIonPopover(pg, ionSelectSelector, value) {
  // Abrir el popover
  await pg.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.click();
  }, ionSelectSelector);

  await pg.waitForSelector('ion-popover', { state: 'visible', timeout: 5000 }).catch(() => {});

  // Asignar valor y cerrar popover
  await pg.evaluate(([sel, val]) => {
    const ionSel = document.querySelector(sel);
    if (!ionSel) return;
    ionSel.value = val;
    ionSel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
    ionSel.dispatchEvent(new CustomEvent('ionInput',  { bubbles: true, detail: { value: val } }));
    const popover = document.querySelector('ion-popover');
    if (popover && typeof popover.dismiss === 'function') popover.dismiss();
  }, [ionSelectSelector, value]);

  await pg.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// ALERTS (Skill 3)
// ---------------------------------------------------------------------------

/**
 * Hacer click en un botón de ion-alert por su texto.
 * Filtra alertas ocultas (overlay-hidden). Usa coordenadas reales (getBoundingClientRect).
 * NUNCA usar element.click() ni dispatchEvent en botones de alerts Ionic.
 * NUNCA usar coordenadas JSON hardcodeadas.
 */
async function clickAlertButton(pg, texto) {
  const coords = await pg.evaluate((txt) => {
    const btns = Array.from(
      document.querySelectorAll('ion-alert:not(.overlay-hidden) button')
    );
    const btn = btns.find(b => b.textContent.trim().toLowerCase().includes(txt.toLowerCase()));
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, texto);

  if (!coords) throw new Error(`clickAlertButton: botón "${texto}" no encontrado en alerts visibles`);
  await pg.mouse.click(coords.x, coords.y);
  await pg.waitForTimeout(350);
}

// ---------------------------------------------------------------------------
// NAVEGACIÓN
// ---------------------------------------------------------------------------

/**
 * Pulsar el botón atrás (img.fechaAtras → parent <a>).
 */
async function clickBack(pg) {
  await pg.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img.fechaAtras'));
    const vis  = imgs.filter(i => i.offsetParent !== null);
    if (!vis.length) throw new Error('clickBack: img.fechaAtras visible no encontrado');
    const link = vis[0].closest('a');
    const target = link || vis[0];
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  });
  await pg.waitForTimeout(400);
}

/**
 * Click en ion-item para navegación o selección.
 */
async function clickIonItem(pg, selector) {
  await pg.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`clickIonItem: selector no encontrado → ${sel}`);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }, selector);
  await pg.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// SCROLL INFINITO
// ---------------------------------------------------------------------------

async function scrollInfinite(pg) {
  await pg.evaluate(() => {
    const sc = document.querySelector('ion-infinite-scroll');
    if (sc) sc.dispatchEvent(new CustomEvent('ionInfinite', { bubbles: true }));
  });
  await pg.waitForTimeout(800);
}

// ---------------------------------------------------------------------------
// OVERLAY DE SINCRONIZACIÓN (§5)
// ---------------------------------------------------------------------------

/**
 * Esperar a que el overlay de sync desaparezca antes de interactuar con la UI.
 */
async function waitSyncOverlay(pg, timeout = 120000) {
  await pg.waitForFunction(() => {
    const overlay = document.querySelector('app-synchronization');
    return !overlay || overlay.offsetParent === null;
  }, { timeout }).catch(() => {});
}

// ---------------------------------------------------------------------------
// FILTRO DE ALERTAS RESIDUALES (Skill 5)
// ---------------------------------------------------------------------------

/**
 * Comprobar si un selector existe Y es visible (offsetParent !== null),
 * excluyendo elementos dentro de overlays ocultos.
 * Usar en lugar de querySelector directo cuando puede haber residuos de sesiones previas.
 */
async function isVisible(pg, selector) {
  return await pg.evaluate((sel) => {
    const el = document.querySelector(sel);
    return !!el && el.offsetParent !== null && !el.closest('.overlay-hidden');
  }, selector);
}

/**
 * Obtener el ion-alert activo (visible) actual, excluyendo overlays ocultos.
 * Devuelve el elemento o null.
 */
async function getActiveAlert(pg) {
  return await pg.evaluate(() => {
    const alerts = Array.from(document.querySelectorAll('ion-alert'));
    return alerts.find(a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null) || null;
  });
}

// ---------------------------------------------------------------------------
// ion-datetime (date picker — shadow DOM)
// ---------------------------------------------------------------------------

/**
 * Confirmar selección en ion-datetime pulsando el botón "Aceptar" en su shadow DOM.
 */
async function confirmDatetime(pg, datetimeSelector = 'ion-datetime') {
  await pg.evaluate((sel) => {
    const dt = document.querySelector(sel);
    if (!dt || !dt.shadowRoot) throw new Error('confirmDatetime: ion-datetime o shadowRoot no encontrado');
    const btns   = Array.from(dt.shadowRoot.querySelectorAll('ion-button'));
    const aceptar = btns.find(b => b.textContent.trim().toLowerCase().includes('aceptar'));
    if (aceptar) aceptar.click();
  }, datetimeSelector);
  await pg.waitForTimeout(300);
}

/**
 * Fijar la fecha de un `ion-datetime` y CONFIRMARLA de forma robusta.
 * Supera el caso jerez Fecha Tasa (`.letrasFechasButton`) donde `confirmDatetime`
 * fallaba: (a) el botón Aceptar NO estaba en el shadowRoot; (b) fijar `dt.value`
 * por DOM no disparaba el recálculo (el (ionChange) de Angular no se emitía).
 *
 * Estrategia en 2 fases:
 *  1) Fija `value` en el ion-datetime VISIBLE, emite `ionChange`/`ionValueChange`
 *     (para que el binding (ionChange) de Angular dispare el recálculo/alert) e
 *     invoca `dt.confirm()` (API pública Ionic — emite el ionChange confirmado).
 *  2) Si aún hay un botón Aceptar/OK/Listo visible (shadowRoot, slot="buttons",
 *     o en el ion-modal/ion-popover contenedor), hace CLICK REAL por coordenadas.
 *
 * @param valueISO 'YYYY-MM-DD' o ISO completo (ej. '2026-06-01').
 * @param opts.datetimeSelector  selector del ion-datetime (default 'ion-datetime').
 * Devuelve { confirmed: bool, clicked: bool }. Caso objetivo: DM-COB-047/039(B). `[jerez-2026-07-06]`
 */
async function setIonDatetime(pg, valueISO, opts = {}) {
  const sel = opts.datetimeSelector || 'ion-datetime';

  const confirmed = await pg.evaluate(([sel, val]) => {
    const dts = Array.from(document.querySelectorAll(sel)).filter(d => d.offsetParent !== null);
    const dt  = dts[dts.length - 1] || document.querySelector(sel);
    if (!dt) throw new Error('setIonDatetime: ion-datetime no encontrado');
    dt.value = val;
    dt.dispatchEvent(new CustomEvent('ionChange',      { bubbles: true, detail: { value: val } }));
    dt.dispatchEvent(new CustomEvent('ionValueChange', { bubbles: true, detail: { value: val } }));
    if (typeof dt.confirm === 'function') { try { dt.confirm(val); return true; } catch (e) { return false; } }
    return false;
  }, [sel, valueISO]);
  await pg.waitForTimeout(300);

  const coords = await pg.evaluate((sel) => {
    const dts = Array.from(document.querySelectorAll(sel)).filter(d => d.offsetParent !== null);
    const dt  = dts[dts.length - 1];
    if (!dt) return null;
    const cands = [];
    if (dt.shadowRoot) cands.push(...dt.shadowRoot.querySelectorAll('ion-button, button'));
    cands.push(...dt.querySelectorAll('[slot="buttons"] ion-button, ion-button'));
    const ov = dt.closest('ion-modal, ion-popover');
    if (ov) cands.push(...ov.querySelectorAll('ion-button, button'));
    const btn = cands.find(b => {
      const t = (b.textContent || '').trim().toLowerCase();
      return b.offsetParent !== null && /aceptar|ok|confirm|listo|done/.test(t);
    });
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    if (!r || r.width === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, sel);

  let clicked = false;
  if (coords) { await pg.mouse.click(coords.x, coords.y); await pg.waitForTimeout(300); clicked = true; }
  return { confirmed, clicked };
}

// ---------------------------------------------------------------------------
// ADJUNTOS — Mock de Capacitor Camera (§3.9)
// Funciona en builds de PRODUCCIÓN y desarrollo (window.Capacitor siempre disponible).
// ---------------------------------------------------------------------------

const BASE64_1PX_JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
  'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwf/wAARC' +
  'AABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAA' +
  'AAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

/**
 * Inyectar adjunto en AdjuntoService vía mock del plugin Capacitor Camera.
 * Intenta primero con el botón de cámara (ADJ_TOMAR_FOTO, un solo mock).
 * Si la cámara no está visible, cae al fallback de galería (ADJ_BUSCAR_FOTO, doble mock).
 *
 * Usar antes de DM-COB-019 (enviar cobro) y DM-COB-029 (Retención) para satisfacer
 * la VG requiredCollectionAttachments. Retorna string 'OK: ...' o lanza Error.
 */
/**
 * 🔴 GUARDA DE CÁMARA — instalar SIEMPRE antes de tocar cualquier botón de foto.
 *
 * La cámara nativa es una **actividad de Android fuera del WebView**: CDP no la alcanza, la promesa de
 * `Camera.getPhoto()` NUNCA resuelve y la app queda esperando para siempre. Y no hay salida automática:
 * `adb shell input keyevent` está PROHIBIDO por las reglas de la corrida ⇒ **solo se sale a mano**.
 * Incidente real: corrida el_valle-20260728, cobros — se clickeó "TOMAR FOTO" sin mock, la app quedó en
 * la cámara, hubo que reiniciarla (PID 20475→28660) y **el cobro se perdió**.
 *
 * Devuelve 'OK: ...' o lanza. Marca `window.__qaCameraMock = true` para poder verificarlo después.
 */
async function installCameraMock(pg) {
  const r = await pg.evaluate((b64) => {
    const C = window.Capacitor;
    if (!C || typeof C.nativePromise !== 'function') return 'ERROR: Capacitor.nativePromise no disponible';
    if (!C.__qaNativeOrig) {
      C.__qaNativeOrig = C.nativePromise;
      // Firma confirmada en device: nativePromise(pluginName, methodName, options)
      C.nativePromise = function (plugin, metodo, opciones) {
        if (plugin === 'Camera') {
          // FALLA CERRADO: NINGÚN método de Camera llega al nativo. Abrir la cámara real
          // cuelga la app sin salida automática (adb input está prohibido).
          if (metodo === 'getPhoto' || metodo === 'pickImages') {
            const z = (typeof Zone !== 'undefined') ? Zone.current : null;   // resolver DENTRO de la zona de Angular
            return new Promise((resolve) => {
              const d = () => resolve({ base64String: b64, format: 'jpeg', saved: false });
              if (z) z.run(d); else d();
            });
          }
          if (metodo === 'checkPermissions' || metodo === 'requestPermissions') {
            return Promise.resolve({ camera: 'granted', photos: 'granted' });
          }
          return Promise.resolve({});
        }
        return C.__qaNativeOrig.call(this, plugin, metodo, opciones);
      };
    }
    window.__qaCameraMock = true;
    return 'OK: mock de cámara instalado en el bridge (Capacitor.nativePromise)';
  }, BASE64_1PX_JPEG);
  if (!String(r).startsWith('OK')) throw new Error('installCameraMock: ' + r);
  return r;
}

/** ¿El mock sigue vivo? El contexto JS se pierde al recargar/reiniciar la app → hay que reinstalarlo. */
async function cameraMockActivo(pg) {
  try { return await pg.evaluate(() => window.__qaCameraMock === true); } catch (e) { return false; }
}

/**
 * Click seguro sobre un botón de foto: **se niega a clickear si el mock no está instalado.**
 * Usar esto en vez de `pg.mouse.click` sobre el botón de cámara, siempre.
 */
async function clickCamaraSeguro(pg, coords) {
  if (!(await cameraMockActivo(pg))) {
    throw new Error('CAMARA-SIN-MOCK: clickear la cámara sin mock abre la cámara NATIVA y cuelga la app ' +
                    'sin salida automática. Llamá installCameraMock(pg) primero (ver RUNTIME §2).');
  }
  await pg.mouse.click(coords.x, coords.y);
}

async function mockCameraAdjunto(pg) {
  // 🔴 CORREGIDO 2026-07-28 (incidente el_valle): antes parcheaba
  //    `window.Capacitor.Plugins.Camera.getPhoto`, pero **`Plugins.Camera` es un Proxy** y la asignación
  //    NO se pega (verificado en device: tras asignar, sigue leyendo `getPhoto() { [capacitor code] }`).
  //    Resultado: devolvía "OK: mock-zone instalado" siendo un **falso OK**, el click abría la cámara
  //    NATIVA y la app quedaba colgada sin salida (se perdió un cobro y hubo que reiniciar la app).
  //    Ahora delega en installCameraMock(), que intercepta el BRIDGE (`Capacitor.nativePromise`).
  const mockInstalled = await installCameraMock(pg);

  // Buscar botón ADJ_TOMAR_FOTO (visible solo si service.showCamera=true)
  const coordsCamara = await pg.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('ion-button'));
    const btn  = btns.find(b =>
      b.offsetParent !== null &&
      (b.textContent.includes('TOMAR') || b.querySelector('ion-icon[name="camera"]'))
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (coordsCamara) {
    await pg.mouse.click(coordsCamara.x, coordsCamara.y);
    await pg.waitForTimeout(1200); // más tiempo para que Angular procese el callback de zona
    // Verificar que la foto quedó en el carrusel DOM
    const fotoEnDOM = await pg.evaluate(() =>
      document.querySelectorAll('swiper-slide ion-img, swiper-container ion-img').length > 0
    );
    return fotoEnDOM
      ? 'OK: adjunto inyectado via camara (foto en carrusel)'
      : 'OK-WARN: mock ejecutado pero foto no visible en carrusel — hasItems() puede seguir false';
  }

  // Fallback: mock galería (Camera.pickImages + Filesystem.readFile)
  await pg.evaluate((b64) => {
    window.Capacitor.Plugins.Camera.pickImages = function() {
      const callerZone = (typeof Zone !== 'undefined') ? Zone.current : null;
      return new Promise((resolve) => {
        const doResolve = () => resolve({
          photos: [{ path: '/sdcard/qa_fake_adj.jpg', webPath: 'qa_fake_adj.jpg', format: 'jpeg' }]
        });
        if (callerZone) callerZone.run(doResolve); else doResolve();
      });
    };
    const origRead = window.Capacitor.Plugins.Filesystem?.readFile?.bind(
      window.Capacitor.Plugins.Filesystem
    );
    if (origRead) {
      window.Capacitor.Plugins.Filesystem.readFile = function(opts) {
        if (opts?.path?.includes('qa_fake_adj')) return Promise.resolve({ data: b64 });
        return origRead(opts);
      };
    }
  }, BASE64_1PX_JPEG);

  const coordsGaleria = await pg.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('ion-button'));
    const btn  = btns.find(b =>
      b.offsetParent !== null &&
      (b.textContent.includes('BUSCAR') || b.querySelector('ion-icon[name="search"]'))
    );
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (!coordsGaleria) throw new Error('mockCameraAdjunto: ni ADJ_TOMAR_FOTO ni ADJ_BUSCAR_FOTO visibles');
  await pg.mouse.click(coordsGaleria.x, coordsGaleria.y);
  await pg.waitForTimeout(1000);
  return 'OK: adjunto inyectado via galeria (fallback)';
}

/**
 * Garantiza un adjunto con reintento acotado + fail-fast (política §10 cobros).
 * Envuelve mockCameraAdjunto: intenta inyectar la foto mock para poder ENVIAR el
 * cobro (en vez de SKIP). Verifica el carrusel como fuente de verdad.
 *
 * Si tras `maxIntentos` la foto NO entra al carrusel → devuelve false (fail-fast):
 * el agente marca SKIP del envío y verifica el registro en BD LOCAL (queda SAVED).
 * NUNCA lanza ni cuelga — la idea es no gastar tiempo peleando con el adjunto.
 *
 * @returns {Promise<boolean>} true si hay foto en el carrusel (se puede Enviar), false si no.
 */
async function ensureAdjunto(pg, maxIntentos = 2) {
  const carruselTieneFoto = () => pg.evaluate(() =>
    document.querySelectorAll('swiper-slide ion-img, swiper-container ion-img').length > 0
  );
  if (await carruselTieneFoto()) return true; // ya hay foto
  for (let i = 0; i < maxIntentos; i++) {
    try {
      await mockCameraAdjunto(pg);
    } catch (e) {
      // botón de foto no visible / otro problema → no insistir a ciegas
    }
    await pg.waitForTimeout(500);
    if (await carruselTieneFoto()) return true;
  }
  return false; // sin foto → el envío queda bloqueado → SKIP + verificar BD local
}

// ---------------------------------------------------------------------------
// COBROS — Abrir nuevo cobro por el flujo REAL (fix init paymentMethodList, §10)
// ---------------------------------------------------------------------------

/**
 * Abre un nuevo cobro disparando el handler REAL `nuevoCobro(tipo)` — el mismo que
 * invoca el botón `(click)="nuevoCobro(N)"`. NO usar `goToNuevoCobro()`: ese salta el
 * `showLoading()` y la vista inspecciona `paymentMethodList` ANTES de que termine el
 * `await loadPaymentMethods()` async del hijo `cobro-general` → lista vacía
 * (bug confirmado en `cobros-container.component.ts`).
 *
 * tipo: 0=cobro · 1=anticipo · 2=retención. (Llamar solo el tipo cuya VG está activa.)
 * Espera a que `paymentMethodList` se pueble (poll 8s), EXCEPTO retención
 * (hidePayments=true → no tiene tab Pagos).
 *
 * @returns {Promise<string>} 'OK: ...' | 'OK-WARN: ...' | 'ERROR: ...' (no lanza).
 */
async function openNuevoCobro(pg, tipo) {
  const fired = await pg.evaluate((t) => {
    const el = document.querySelector('app-cobros-container');
    if (!el || !window.ng) return 'ERROR: app-cobros-container / window.ng no disponible';
    const comp = window.ng.getComponent(el);
    if (!comp || typeof comp.nuevoCobro !== 'function') return 'ERROR: comp.nuevoCobro no disponible';
    comp.nuevoCobro(t); // flujo real: showLoading() → goToNuevoCobro() → render cobro-general → async loadPaymentMethods()
    return 'OK';
  }, tipo);
  if (!fired.startsWith('OK')) return fired;

  if (tipo === 2) { // retención: sin tab Pagos → no esperar paymentMethodList
    await pg.waitForTimeout(800);
    return 'OK: retención abierta (sin esperar paymentMethodList)';
  }

  try {
    await pg.waitForFunction(() => {
      const find = (sel) => { const e = document.querySelector(sel); return e && window.ng ? window.ng.getComponent(e) : null; };
      const c = find('app-cobro-general') || find('app-cobros-container');
      const list = c && c.collectService ? c.collectService.paymentMethodList : null;
      return Array.isArray(list) && list.length > 0;
    }, { timeout: 8000 });
    return 'OK: paymentMethodList poblada';
  } catch (e) {
    return 'OK-WARN: paymentMethodList no se pobló en 8s (cliente sin métodos, o revisar init)';
  }
}

// ---------------------------------------------------------------------------
// COBROS — Abrir el modal "Detalle Del Documento" (fix DM-COB-041/042/046)
// ---------------------------------------------------------------------------

/**
 * Espera a que el modal de detalle de documento esté abierto.
 * Detecta por (a) `collectService.isOpen=true` vía window.ng, o (b) un ion-modal
 * visible cuyo contenido menciona "Detalle".
 * @returns {Promise<boolean>}
 */
async function waitDocDetailOpen(pg, timeout = 3000) {
  try {
    await pg.waitForFunction(() => {
      let flag = false;
      if (window.ng) {
        const el = document.querySelector('app-cobro-documents');
        const comp = el ? window.ng.getComponent(el) : null;
        flag = !!(comp && comp.collectService && comp.collectService.isOpen);
      }
      const modals = Array.from(document.querySelectorAll('ion-modal.show-modal, #eventModal'));
      const domOpen = modals.some(md => md.offsetParent !== null && /Detalle/i.test(md.textContent || ''));
      return flag || domOpen;
    }, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Abre el modal "Detalle Del Documento" de una factura en el Tab Documentos de un cobro.
 *
 * ⚠ El botón de la lupa (`ion-icon[name="search-sharp"]`) está DESHABILITADO hasta que el
 * documento esté seleccionado: la plantilla usa `disabled="{{!documentSale.isSelected}}"`
 * y el handler `openDocumentSale()` hace `if (isSelected) { ...abre... }`. Por eso hay que
 * marcar PRIMERO el checkbox de la fila y recién entonces clickear la lupa.
 * (Causa del SKIP de DM-COB-041/042/046 en piercar [prc-2617]: se clickeaba la lupa sin
 * seleccionar el documento → botón disabled → no abría. Confirmado en
 * `cobro-documents.component.html` + `.ts`.)
 *
 * Flujo: (1) localizar fila → asegurar checkbox seleccionado (click real + espera) →
 *        (2) click real en el `ion-button` de la lupa (scrollIntoView + coords frescas) →
 *        (3) esperar modal; fallback: disparar `openDocumentSale(idx)` vía window.ng.
 *
 * @param {object} opts  { match?: string } texto a buscar en la fila (ej. nro de factura).
 *                        Si se omite, usa la primera fila de documentos.
 * @returns {Promise<string>} 'OK: ...' | 'OK-WARN: ...' | 'ERROR: ...' (no lanza).
 */
async function openDocumentDetail(pg, opts = {}) {
  const match = opts.match || null;

  // helper de localización de fila (reusado en cada paso con coords frescas)
  const findRow = (m) => {
    const rows = Array.from(document.querySelectorAll('ion-row.tabladocumentSalesVenta'));
    const visible = rows.filter(r => r.offsetParent !== null);
    return m ? visible.find(r => (r.textContent || '').includes(m)) : visible[0];
  };

  // 1) Asegurar checkbox seleccionado
  const rowInfo = await pg.evaluate(({ m, findRowSrc }) => {
    const findRow = eval('(' + findRowSrc + ')');
    const row = findRow(m);
    if (!row) return { ok: false, msg: 'fila de documento no encontrada' + (m ? ' (match=' + m + ')' : '') };
    const cb = row.querySelector('ion-checkbox');
    if (!cb) return { ok: false, msg: 'checkbox de la fila no encontrado' };
    const r = cb.getBoundingClientRect();
    return { ok: true, selected: !!cb.checked, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, { m: match, findRowSrc: findRow.toString() });
  if (!rowInfo.ok) return 'ERROR: ' + rowInfo.msg;

  if (!rowInfo.selected) {
    await pg.mouse.click(rowInfo.x, rowInfo.y);
    try {
      await pg.waitForFunction(({ m, findRowSrc }) => {
        const findRow = eval('(' + findRowSrc + ')');
        const row = findRow(m);
        const cb = row && row.querySelector('ion-checkbox');
        return !!(cb && cb.checked);
      }, { m: match, findRowSrc: findRow.toString() }, { timeout: 4000 });
    } catch (e) {
      return 'ERROR: el documento no quedó seleccionado tras click en checkbox';
    }
    await pg.waitForTimeout(300); // selectDocumentSale puebla collectionDetails
  }

  // 2) Click real en la lupa (ion-button, no el ion-icon)
  const prep = await pg.evaluate(({ m, findRowSrc }) => {
    const findRow = eval('(' + findRowSrc + ')');
    const row = findRow(m);
    if (!row) return { ok: false, msg: 'fila no encontrada (paso 2)' };
    const icon = row.querySelector('ion-icon[name="search-sharp"]');
    const btn = icon ? icon.closest('ion-button') : null;
    if (!btn) return { ok: false, msg: 'botón lupa no encontrado en la fila' };
    if (btn.disabled) return { ok: false, msg: 'botón lupa sigue disabled (documento no seleccionado)' };
    btn.scrollIntoView({ block: 'center' });
    return { ok: true };
  }, { m: match, findRowSrc: findRow.toString() });
  if (!prep.ok) return 'ERROR: ' + prep.msg;

  await pg.waitForTimeout(150); // dejar asentar el scroll antes de leer coords
  const coords = await pg.evaluate(({ m, findRowSrc }) => {
    const findRow = eval('(' + findRowSrc + ')');
    const row = findRow(m);
    const icon = row && row.querySelector('ion-icon[name="search-sharp"]');
    const btn = icon ? icon.closest('ion-button') : null;
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, { m: match, findRowSrc: findRow.toString() });
  if (coords) await pg.mouse.click(coords.x, coords.y);

  if (await waitDocDetailOpen(pg, 3000)) return 'OK: detalle de documento abierto (click real en lupa)';

  // 3) Fallback: disparar el handler real vía window.ng
  const viaHandler = await pg.evaluate((m) => {
    if (!window.ng) return 'ERROR: window.ng no disponible para fallback';
    const el = document.querySelector('app-cobro-documents');
    if (!el) return 'ERROR: app-cobro-documents no encontrado';
    const comp = window.ng.getComponent(el);
    if (!comp || typeof comp.openDocumentSale !== 'function') return 'ERROR: openDocumentSale no disponible';
    const list = (comp.collectService && comp.collectService.documentSales) || [];
    let idx = -1;
    if (m) idx = list.findIndex(d => d && d.isSelected && JSON.stringify(d).includes(m));
    if (idx < 0) idx = list.findIndex(d => d && d.isSelected);
    if (idx < 0) return 'ERROR: no hay documento seleccionado para abrir detalle';
    comp.openDocumentSale(idx, new Event('click'));
    return 'OK';
  }, match);
  if (!viaHandler.startsWith('OK')) return viaHandler;

  return (await waitDocDetailOpen(pg, 3000))
    ? 'OK: detalle de documento abierto (handler real fallback)'
    : 'OK-WARN: openDocumentSale disparado pero el modal no se detectó visible';
}

// ---------------------------------------------------------------------------
// CAPTURA DE PAYLOAD (cotejo "lo enviado == lo guardado" · §10.c)
// ---------------------------------------------------------------------------

/**
 * Envuelve `CapacitorHttp.post` para CAPTURAR el payload que `auto-send.service`
 * postea al servidor (= "lo que se mandó", ya estructurado/anidado, en nombres del modelo).
 * Captura solo las URLs de servicios transaccionales (`.../<x>service/<x>`).
 * Idempotente: si ya está instalado, no re-envuelve.
 *
 * Llamar UNA vez al inicio de la sesión, ANTES de Enviar cualquier transacción.
 * Luego leer con `getCapturedPayloads(pg)`.
 *
 * ⚠ `CapacitorHttp` usa red nativa (no la del WebView) → NO se ve por interceptación CDP;
 * por eso se envuelve la función JS antes de que llame a nativo.
 *
 * @returns {Promise<string>} 'OK: ...' | 'ERROR: ...'
 */
async function installPayloadCapture(pg) {
  return await pg.evaluate(() => {
    try {
      const Cap = window.Capacitor;
      if (!Cap) return 'ERROR: window.Capacitor no disponible';
      if (window.__qaCaptureInstalled) return 'OK: ya instalado (' + (window.__qaPayloads || []).length + ' capturados)';
      window.__qaPayloads = [];
      // ⚠ Plugins.CapacitorHttp.post es un proxy de solo-lectura (no se puede sobre-escribir).
      // El punto correcto es el bridge `nativePromise(plugin, method, options)`: ahí pasan los
      // métodos async como CapacitorHttp.post antes de ir a nativo.
      const record = (plugin, method, options) => {
        try {
          if (plugin === 'CapacitorHttp' && /post/i.test(String(method)) &&
              options && /service\//i.test(String(options.url || ''))) {
            window.__qaPayloads.push({ url: options.url, data: options.data });
          }
        } catch (e) { /* nunca romper el envío real */ }
      };
      const hooked = [];
      if (typeof Cap.nativePromise === 'function') {
        const orig = Cap.nativePromise.bind(Cap);
        Cap.nativePromise = function (plugin, method, options) { record(plugin, method, options); return orig(plugin, method, options); };
        hooked.push('nativePromise');
      }
      if (!hooked.length && typeof Cap.toNative === 'function') {
        const orig = Cap.toNative.bind(Cap);
        Cap.toNative = function (a, b, c) {
          try { if (typeof a === 'string') record(a, b, c); else if (a && a.pluginId) record(a.pluginId, a.methodName, a.options); } catch (e) {}
          return orig.apply(this, arguments);
        };
        hooked.push('toNative');
      }
      if (!hooked.length) return 'ERROR: ni nativePromise ni toNative disponibles para enganchar';
      window.__qaCaptureInstalled = true;
      return 'OK: captura instalada (' + hooked.join('+') + ')';
    } catch (e) { return 'ERROR: ' + e.message; }
  });
}

/** Devuelve los payloads capturados hasta el momento (array de {url, data}). */
async function getCapturedPayloads(pg) {
  return await pg.evaluate(() => (window.__qaPayloads || []));
}

// ---------------------------------------------------------------------------
// EXPORTAR (CommonJS — funciona si require() está disponible)
// ---------------------------------------------------------------------------

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CDP_URL,
    BASE64_1PX_JPEG,
    connectCdp,
    withTimeout,
    cdpAlive,
    makeWatchdog,
    fetchCreds,
    getActiveView,
    fillIonInput,
    fillNgModelKeyboard,
    fillNgModelField,
    selectIonPopover,
    clickAlertButton,
    clickBack,
    clickIonItem,
    scrollInfinite,
    waitSyncOverlay,
    isVisible,
    getActiveAlert,
    confirmDatetime,
    setIonDatetime,
    installCameraMock,
    cameraMockActivo,
    clickCamaraSeguro,
    mockCameraAdjunto,
    ensureAdjunto,
    openNuevoCobro,
    waitDocDetailOpen,
    openDocumentDetail,
    installPayloadCapture,
    getCapturedPayloads,
  };
}
