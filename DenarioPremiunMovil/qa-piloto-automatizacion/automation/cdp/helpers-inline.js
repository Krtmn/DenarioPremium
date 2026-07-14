/**
 * helpers-inline.js — Bundle auto-instalable de skills PURAS-DOM para browser_run_code_unsafe.
 *
 * PROBLEMA QUE RESUELVE: en browser_run_code_unsafe no existen require/fs, así que hasta ahora
 * cada agente leía denario-cdp-helpers.js (692 L) e INLINABA verbatim el cuerpo de cada función
 * en CADA `pg.evaluate`. Esto se paga en tokens por uso y por agente (×10 módulos).
 *
 * SOLUCIÓN: el agente lee ESTE archivo UNA vez y lo pasa a `pg.evaluate(<contenido>)`. El IIFE
 * registra `window.__qaH` con las skills puras-DOM. Luego cada uso es:
 *     await pg.evaluate(() => window.__qaH.fillIonInput('app-login ion-input', 'foo'));
 * en vez de re-pegar el cuerpo de fillIonInput. `window` sobrevive entre evaluate en la misma página.
 *
 * QUÉ VIVE AQUÍ (puras-DOM, no necesitan Playwright):
 *     getActiveView · fillIonInput · clickIonItem · clickBack · scrollInfinite · isVisible
 *     activeAlertInfo · confirmDatetime · coordsOf · alertButtonCoords · popoverOpen · popoverSet
 *     installPayloadCapture · getCapturedPayloads
 *
 * QUÉ NO VIVE AQUÍ (mezclan pg.mouse/keyboard/waitForFunction → siguen como helpers de agente,
 * inlinados desde denario-cdp-helpers.js): mockCameraAdjunto · ensureAdjunto · openNuevoCobro ·
 * openDocumentDetail · waitDocDetailOpen · fillNgModelKeyboard · waitSyncOverlay · selectIonPopover
 * (el agente compone popoverOpen/popoverSet + sus propias esperas).
 *
 * PATRÓN coords: para botones/alerts el bundle DEVUELVE coords (getBoundingClientRect) y el AGENTE
 * hace `await pg.mouse.click(x, y)` — porque window no puede invocar pg.mouse.
 *
 * ⚠ Mantener en sync con denario-cdp-helpers.js (fuente de autoría). Si cambia una skill pura-DOM
 *    allí, reflejarla aquí (mismo cuerpo).
 *
 * Instalación (en el agente, tras connectCdp):
 *     // leer este archivo con Read → guardar su texto en `bundle`
 *     const status = await pg.evaluate(bundle);   // → 'OK: __qaH instalado (14 skills)'
 */
(function () {
  if (window.__qaH) return 'OK: __qaH ya instalado';

  const H = {};

  // ── Detección de vista (Skill 1) ──
  H.getActiveView = function (candidates) {
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return sel;
    }
    return null;
  };

  // ── ion-input reactive form (Skill 2) ──
  H.fillIonInput = function (selector, value) {
    const ionEl = document.querySelector(selector);
    if (!ionEl) return 'ERROR: fillIonInput selector no encontrado → ' + selector;
    const inp = ionEl.querySelector('input') || ionEl;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, value);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    ionEl.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value } }));
    ionEl.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value } }));
    return 'OK';
  };

  // ── Click DOM en ion-item (navegación/selección) ──
  H.clickIonItem = function (selector) {
    const el = document.querySelector(selector);
    if (!el) return 'ERROR: clickIonItem selector no encontrado → ' + selector;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return 'OK';
  };

  // ── Botón atrás (img.fechaAtras → closest('a')) ──
  H.clickBack = function () {
    const imgs = Array.from(document.querySelectorAll('img.fechaAtras'));
    const vis = imgs.filter((i) => i.offsetParent !== null);
    if (!vis.length) return 'ERROR: clickBack img.fechaAtras visible no encontrado';
    const target = vis[0].closest('a') || vis[0];
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    return 'OK';
  };

  // ── Scroll infinito ──
  H.scrollInfinite = function () {
    const sc = document.querySelector('ion-infinite-scroll');
    if (sc) sc.dispatchEvent(new CustomEvent('ionInfinite', { bubbles: true }));
    return 'OK';
  };

  // ── Visibilidad real (excluye overlays ocultos) ──
  H.isVisible = function (selector) {
    const el = document.querySelector(selector);
    return !!el && el.offsetParent !== null && !el.closest('.overlay-hidden');
  };

  // ── Alert activo: info serializable (el elemento no cruza CDP) ──
  H.activeAlertInfo = function () {
    const alerts = Array.from(document.querySelectorAll('ion-alert'));
    const a = alerts.find((x) => !x.classList.contains('overlay-hidden') && x.offsetParent !== null);
    if (!a) return { present: false };
    const title = a.querySelector('.alert-title');
    const msg = a.querySelector('.alert-message');
    return { present: true, title: title ? title.textContent.trim() : '', message: msg ? msg.textContent.trim() : '' };
  };

  // ── ion-datetime: confirmar (shadow DOM) ──
  H.confirmDatetime = function (selector) {
    const dt = document.querySelector(selector || 'ion-datetime');
    if (!dt || !dt.shadowRoot) return 'ERROR: ion-datetime/shadowRoot no encontrado';
    const btns = Array.from(dt.shadowRoot.querySelectorAll('ion-button'));
    const ok = btns.find((b) => b.textContent.trim().toLowerCase().includes('aceptar'));
    if (ok) ok.click();
    return ok ? 'OK' : 'ERROR: botón Aceptar no encontrado en shadow';
  };

  // ── Coords de un selector (para que el agente haga pg.mouse.click) ──
  H.coordsOf = function (selector) {
    const el = document.querySelector(selector);
    if (!el || el.offsetParent === null) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // ── Coords del botón de un ion-alert por texto (Skill 3 · click lo hace el agente) ──
  H.alertButtonCoords = function (texto) {
    const btns = Array.from(document.querySelectorAll('ion-alert:not(.overlay-hidden) button'));
    const btn = btns.find((b) => b.textContent.trim().toLowerCase().includes(String(texto).toLowerCase()));
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  // ── ion-select + popover (parte DOM; el agente intercala sus esperas) ──
  H.popoverOpen = function (ionSelectSelector) {
    const el = document.querySelector(ionSelectSelector);
    if (!el) return 'ERROR: ion-select no encontrado → ' + ionSelectSelector;
    el.click();
    return 'OK';
  };
  H.popoverSet = function (ionSelectSelector, value) {
    const ionSel = document.querySelector(ionSelectSelector);
    if (!ionSel) return 'ERROR: ion-select no encontrado → ' + ionSelectSelector;
    ionSel.value = value;
    ionSel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value } }));
    ionSel.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value } }));
    const pop = document.querySelector('ion-popover');
    if (pop && typeof pop.dismiss === 'function') pop.dismiss();
    return 'OK';
  };

  // ── Captura de payload (cotejo §10.c) ──
  H.installPayloadCapture = function () {
    try {
      const Cap = window.Capacitor;
      if (!Cap) return 'ERROR: window.Capacitor no disponible';
      if (window.__qaCaptureInstalled) return 'OK: ya instalado (' + (window.__qaPayloads || []).length + ' capturados)';
      window.__qaPayloads = [];
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
      if (!hooked.length) return 'ERROR: ni nativePromise ni toNative disponibles';
      window.__qaCaptureInstalled = true;
      return 'OK: captura instalada (' + hooked.join('+') + ')';
    } catch (e) { return 'ERROR: ' + e.message; }
  };
  H.getCapturedPayloads = function () { return window.__qaPayloads || []; };

  window.__qaH = H;
  return 'OK: __qaH instalado (' + Object.keys(H).length + ' skills puras-DOM)';
})();
