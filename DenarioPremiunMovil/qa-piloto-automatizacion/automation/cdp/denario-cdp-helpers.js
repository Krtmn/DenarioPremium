/**
 * denario-cdp-helpers.js
 * Helpers CDP reutilizables — Denario Premium Móvil QA
 *
 * USO en browser_run_code_unsafe:
 *   Opción A (require): const h = require('/ruta/absoluta/a/denario-cdp-helpers.js');
 *   Opción B (eval):    eval(require('fs').readFileSync('/ruta/absoluta/a/denario-cdp-helpers.js','utf8'));
 *   Opción C (manual):  leer el archivo y copiar las funciones que necesites verbatim.
 *
 * Ruta absoluta (Windows):
 *   C:/Users/Personal/OneDrive/Documentos/kiberno/DenarioPremium/DenarioPremiunMovil/
 *   qa-piloto-automatizacion/automation/cdp/denario-cdp-helpers.js
 */

const CDP_URL   = 'http://127.0.0.1:9220';
const CREDS_URL = 'http://127.0.0.1:19001';

// ---------------------------------------------------------------------------
// CONEXIÓN
// ---------------------------------------------------------------------------

/**
 * Conectar al WebView de la app vía CDP y devolver la página activa.
 * Siempre usar este helper en vez de escribir connectOverCDP inline.
 */
async function connectCdp(page) {
  const cdp = await page.context().browser()._browserType.connectOverCDP(CDP_URL);
  const ctx  = cdp.contexts()[0];
  const pg   = ctx.pages()[0];
  await pg.bringToFront();
  return pg;
}

// ---------------------------------------------------------------------------
// CREDENCIALES
// ---------------------------------------------------------------------------

/**
 * Obtener credenciales QA del servidor local (:19001).
 * Devuelve { user, pass }.
 * Llama una sola vez al inicio del agente y guarda en variable local.
 * NO cachear entre llamadas MCP — cada browser_run_code_unsafe es un contexto nuevo.
 */
async function fetchCreds() {
  const text = await new Promise((resolve, reject) => {
    require('http').get(CREDS_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
  const lines = text.split('\n');
  const get = (key) => {
    const line = lines.find(l => l.trim().startsWith(key + '='));
    if (!line) return '';
    return line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '');
  };
  return { user: get('QA_USER'), pass: get('QA_PASSWORD') };
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
async function mockCameraAdjunto(pg) {
  // Instalar mock de Camera.getPhoto capturando Zone.current en el momento de la llamada.
  // tomarImg() llama Camera.getPhoto() desde dentro de Angular's zone — al capturar
  // Zone.current allí y resolver dentro de esa zona, el .then() también corre en la zona
  // de Angular y la vista se actualiza aunque sea un build de producción (AOT + Ivy).
  const mockInstalled = await pg.evaluate((b64) => {
    if (!window.Capacitor?.Plugins?.Camera) return 'ERROR: window.Capacitor.Plugins.Camera no disponible';
    window.Capacitor.Plugins.Camera.getPhoto = function(options) {
      // Capturamos Zone.current en el momento en que Angular llama al mock
      const callerZone = (typeof Zone !== 'undefined') ? Zone.current : null;
      return new Promise((resolve) => {
        const doResolve = () => resolve({ base64String: b64, format: 'jpeg', saved: false });
        if (callerZone) {
          callerZone.run(doResolve);
        } else {
          doResolve();
        }
      });
    };
    return 'OK: mock-zone instalado';
  }, BASE64_1PX_JPEG);

  if (!mockInstalled.startsWith('OK')) throw new Error('mockCameraAdjunto: ' + mockInstalled);

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

// ---------------------------------------------------------------------------
// EXPORTAR (CommonJS — funciona si require() está disponible)
// ---------------------------------------------------------------------------

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CDP_URL,
    CREDS_URL,
    BASE64_1PX_JPEG,
    connectCdp,
    fetchCreds,
    getActiveView,
    fillIonInput,
    fillNgModelKeyboard,
    selectIonPopover,
    clickAlertButton,
    clickBack,
    clickIonItem,
    scrollInfinite,
    waitSyncOverlay,
    isVisible,
    getActiveAlert,
    confirmDatetime,
    mockCameraAdjunto,
  };
}
