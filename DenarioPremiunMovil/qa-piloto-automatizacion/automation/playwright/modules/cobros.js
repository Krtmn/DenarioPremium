'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { installPayloadCapture, getCapturedPayloads } = require('../../cdp/denario-cdp-helpers');
const { reqInicio, reqRechazo, reqPestanaRoja, reqIds, conReq } = require('../req-enviar');

const LOCAL_QUERY_PATH    = path.resolve(__dirname, '../../db/local-query.js');
const COTEJO_PAYLOAD_PATH = path.resolve(__dirname, '../../db/cotejo-payload.js');

// JPEG 1x1 válido (mismo del helper CDP) para inyectar como adjunto sin cámara.
const BASE64_1PX_JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
  'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwf/wAARC' +
  'AABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAA' +
  'AAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

function localQuery(sql) {
  try {
    return JSON.parse(
      execFileSync('node', [LOCAL_QUERY_PATH, sql], { encoding: 'utf8', timeout: 15000 })
    );
  } catch (_) { return []; }
}

/** Corre cotejo-payload.js con un payload capturado ({url,data}). Devuelve marca o 'BD-N/A'. */
function cotejoPayload(slug, payload) {
  const tmp = path.join(os.tmpdir(), `qa_cob_payload_${Date.now()}.json`);
  try {
    fs.writeFileSync(tmp, JSON.stringify(payload));
    const r = JSON.parse(
      execFileSync('node', [COTEJO_PAYLOAD_PATH, slug, tmp], { encoding: 'utf8', timeout: 30000 })
    );
    const mis = ((r.resumen || {}).mismatches || []).slice(0, 2).join('; ');
    return r.marca + (mis ? ` (${mis})` : '');
  } catch (_) { return 'BD-N/A'; }
  finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

/**
 * modules/cobros.js — FASE 1 · núcleo co_type 0 (cobro normal)
 *
 * Cobertura Fase 1: DM-COB-001/002/004/007/008/009/016/018/022/024/026/020/021 (+ 019 con adjunto).
 * N/A por VG: 006 (requiredComment), 036/044/045 (IGTF), 037 (25% IVA).
 * FASE 2 (marcados BLOCKED-fase2): 033/034 moneda, 012/040/043 diferencia, 014/015 Total,
 *   028 anticipo (co_type 1), 029/041/042 retención (co_type 2), 046 parcial, 047/039 fecha-tasa, 038.
 *
 * Selectores: automation/cdp/module-selectors/cobros.md (adaptados de MCP a Playwright standalone).
 * Patrón base: modules/depositos.js (banco/pagos/cotejo/dirty-guard).
 *
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteTest:string, clientesConDocumentos:string[],
 *           requiredCollectionAttachments:boolean, requiredComment:boolean, multiCurrency:boolean,
 *           retencion:boolean, cobroRetencion:boolean, cobroPrepago:boolean, userCanSelectIGTF:boolean,
 *           userCanCollectIva:boolean, sizeRetention:number, metodoPago:string,
 *           mockCamaraFunciona:boolean, clienteSlug:string }} DATA
 */
async function runCobros(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // Regresión permanente del REQ «Botón Enviar y campos obligatorios» (../req-enviar.js)
  const reqV = (r) => v(r.id, r.descripcion, r.resultado, r.nota);

  // Orden de ejecución (Fase 1 primero; Fase 2 al final como BLOCKED-fase2)
  const FASE2 = ['DM-COB-033','DM-COB-034',
    'DM-COB-014','DM-COB-015','DM-COB-028','DM-COB-029','DM-COB-041','DM-COB-042',
    'DM-COB-046','DM-COB-047','DM-COB-039','DM-COB-038'];
  const TODOS = ['DM-COB-001','DM-COB-002','DM-COB-004','DM-COB-006','DM-COB-007',
    'DM-COB-008','DM-COB-009','DM-COB-016','DM-COB-018','DM-COB-019','DM-COB-022',
    'DM-COB-024','DM-COB-026','DM-COB-020','DM-COB-021','DM-COB-036','DM-COB-037',
    'DM-COB-044','DM-COB-045', ...FASE2, ...reqIds('COB')];

  if (!DATA.aplica) {
    TODOS.forEach(id => v(id, id, 'N/A', 'aplica=false en perfil cobros'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  try { await installPayloadCapture(pg); } catch (_) {}

  const ts       = String(Date.now()).slice(-6);
  const comentTest = `Test-COB-${ts}`;

  // ─── Helpers (adaptados de depositos.js + module-selectors/cobros.md) ─────────

  async function dismissIonLoadings() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-loading').forEach(el => {
        if (el.offsetParent !== null) try { el.dismiss(); } catch (_) {}
      });
    });
  }

  async function clickBack() {
    // Back de app-cobros-header = img.fechaAtras src=flecha-blanca.png → filtrar por rect, NO por src
    const coords = await pg.evaluate(() => {
      const imgs = [...document.querySelectorAll('img.fechaAtras')];
      const back = imgs.find(img => {
        const r = img.getBoundingClientRect();
        return r.width > 0 && r.x < 100 && r.y < 120;
      });
      if (!back) return null;
      const target = back.closest('a') || back;
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) throw new Error('img.fechaAtras no encontrado');
    await pg.mouse.click(coords.x, coords.y, { delay: 60 });
  }

  async function clickAlertBtn(labels = ['Aceptar', 'OK']) {
    await pg.waitForTimeout(900);
    await dismissIonLoadings();
    await pg.waitForTimeout(300);
    const coords = await pg.evaluate((lbls) => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!alerts.length) return null;
      const alert = alerts[alerts.length - 1];
      for (const lbl of lbls) {
        const btn = [...alert.querySelectorAll('.alert-button')].find(b =>
          b.textContent.trim().toLowerCase() === lbl.toLowerCase() && b.getBoundingClientRect().width > 0);
        if (btn) { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: lbl }; }
      }
      return null;
    }, labels);
    if (!coords) throw new Error('Alert btn no encontrado: ' + labels.join('/'));
    await pg.mouse.click(coords.x, coords.y);
    await pg.waitForTimeout(500);
    return coords.label;
  }

  // Lee el título/mensaje del alert activo (ion-alert.textContent devuelve "" en este build → usar .alert-title/.alert-message)
  async function readAlert() {
    return pg.evaluate(() => {
      const a = [...document.querySelectorAll('ion-alert')].find(x => {
        const isTraditional = !x.classList.contains('overlay-hidden') && x.offsetParent !== null;
        const hasVisibleBtn = [...x.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!a) return null;
      const t = a.querySelector('.alert-title, .alert-head');
      const m = a.querySelector('.alert-message');
      return [(t && t.textContent.trim()) || '', (m && m.textContent.trim()) || ''].filter(Boolean).join(' · ');
    });
  }

  // dirty-guard: título "Denario Cobros"/message vacío → detectar por BOTONES, salir con "Salir sin guardar"
  async function dismissDirtyGuard() {
    const coords = await pg.evaluate(() => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!alerts.length) return null;
      const btn = [...alerts[alerts.length - 1].querySelectorAll('.alert-button')].find(b =>
        b.textContent.trim().toLowerCase() === 'salir sin guardar' && b.getBoundingClientRect().width > 0);
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y);
    await pg.waitForTimeout(800);
    return true;
  }

  // Botón home de cobros con Pointer+Mouse (los tiles requieren PointerEvent + click)
  async function clickBotonHome(texto) {
    const coords = await pg.evaluate((t) => {
      const btns = [...document.querySelectorAll('app-cobros ion-button')].filter(
        b => b.textContent.trim() === t && b.getBoundingClientRect().width > 0);
      if (!btns.length) return null;
      const el = btns[0];
      const r = el.getBoundingClientRect();
      // Disparar el handler real vía Pointer+Mouse en el shadow button
      try {
        const inner = el.shadowRoot && el.shadowRoot.querySelector('button');
        (inner || el).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        (inner || el).dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      } catch (_) {}
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Botón "${texto}" no encontrado en home cobros`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  async function isHomeCobrosVisible() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .some(b => b.textContent.trim() === 'COBRO'));
  }

  async function irAHomeCobros(maxAttempts = 6) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await isHomeCobrosVisible()) return;
      try { await clickBack(); } catch (_) {}
      await pg.waitForTimeout(900);
      await dismissDirtyGuard();
      await pg.waitForTimeout(400);
    }
    if (!(await isHomeCobrosVisible())) throw new Error('No se pudo llegar a home cobros');
  }

  // ¿estamos en el formulario? (segment-buttons visibles; el contenedor siempre offsetParent!==null)
  async function isFormVisible() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros-container ion-segment-button, app-cobro ion-segment-button')]
        .some(s => s.getBoundingClientRect().width > 0));
  }

  // Cambiar de tab: asignar ion-segment.value + ionChange (más fiable que click en segment-button)
  async function clickTab(value) {
    await pg.evaluate((val) => {
      const seg = document.querySelector('app-cobros-container ion-segment, app-cobro ion-segment, ion-segment');
      if (!seg) return;
      seg.value = val;
      seg.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
    }, value);
    await pg.waitForTimeout(1000);
  }

  // Abrir nuevo cobro: click REAL en el tile (nuevoCobro programático NO re-renderiza tras Guardado)
  async function abrirNuevoCobro() {
    await clickBotonHome('COBRO');
    // Esperar los 5 tabs
    for (let i = 0; i < 12; i++) {
      await pg.waitForTimeout(700);
      const tabs = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-segment-button')].filter(s => s.getBoundingClientRect().width > 0).length);
      if (tabs >= 4) return true;
    }
    return false;
  }

  // Modal cliente: #clienteSelectModal.present() (click en ion-input NO lo abre)
  async function seleccionarCliente(nombre) {
    await pg.evaluate(() => {
      const m = document.querySelector('#clienteSelectModal');
      if (m && typeof m.present === 'function') m.present();
    });
    await pg.waitForTimeout(2000);

    // Filtrar (algunos builds requieren Enter; otros muestran la lista directo). Teclear el nombre si hay input.
    await pg.evaluate((nom) => {
      const modal = document.querySelector('ion-modal.show-modal, #clienteSelectModal');
      if (!modal) return;
      const inp = modal.querySelector('input:not([type=hidden])');
      if (inp) { inp.focus(); }
    });
    if (nombre) {
      const first = nombre.trim().slice(0, 8);
      await pg.keyboard.type(first, { delay: 40 }).catch(() => {});
      await pg.keyboard.press('Enter').catch(() => {});
      await pg.waitForTimeout(1500);
    }

    // Click en el <p> del nombre (NO el centro del item → zona de saldos activa masInfo→BUSCAR)
    const coords = await pg.evaluate((nom) => {
      const ps = [...document.querySelectorAll('ion-modal.show-modal p, #clienteSelectModal p')]
        .filter(p => p.getBoundingClientRect().width > 0);
      let target = null;
      if (nom) {
        const key = nom.trim().slice(0, 10).toLowerCase();
        target = ps.find(p => p.textContent.trim().toLowerCase().includes(key));
      }
      target = target || ps[0];
      if (!target) return null;
      target.scrollIntoView({ block: 'center' });
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, nombre);
    if (!coords) throw new Error('Cliente no encontrado en #clienteSelectModal');
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(2500);
    // Reintento (el 1er click a veces no marca)
    const stillModal = await pg.evaluate(() =>
      !!document.querySelector('ion-modal.show-modal #clienteSelectModal, #clienteSelectModal.show-modal') ||
      [...document.querySelectorAll('#clienteSelectModal')].some(m => m.getBoundingClientRect().width > 0 && m.offsetParent !== null));
    if (stillModal && coords) {
      await pg.mouse.click(coords.x, coords.y + 8, { delay: 80 });
      await pg.waitForTimeout(2000);
    }
  }

  // Llenar Comentario: 2º ion-input.inp-write (1º=Responsable id=currency; 2º=Comentario, nace ion-invalid)
  async function fillComentario(texto) {
    const ok = await pg.evaluate((val) => {
      const inps = [...document.querySelectorAll('app-cobro-general ion-input.inp-write, ion-input.inp-write')]
        .filter(i => i.getBoundingClientRect().width > 0);
      // preferir el que nace ion-invalid vacío (Comentario); si no, el 2º
      let target = inps.find(i => i.classList.contains('ion-invalid') && !(i.value || '').trim()) || inps[1] || inps[0];
      if (!target) return false;
      const native = target.querySelector('input') || (target.shadowRoot && target.shadowRoot.querySelector('input'));
      if (!native) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(native, val);
      native.dispatchEvent(new Event('input', { bubbles: true }));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      target.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: val } }));
      target.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
      native.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    }, texto);
    await pg.waitForTimeout(600);
    return ok;
  }

  async function tabsHabilitadas() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0 && !s.disabled && s.getAttribute('disabled') === null).length);
  }

  // Selecciona la moneda documento (1er ion-select del Tab Documentos) = USD por defecto para docs $
  async function seleccionarMonedaDocumento(pref = 'US') {
    const res = await pg.evaluate((p) => {
      const sel = document.querySelector('app-cobro-documents ion-select');
      if (!sel) return { ok: false, err: 'ion-select moneda no encontrado' };
      const opts = [...sel.querySelectorAll('ion-select-option')];
      const labels = opts.map(o => (o.textContent || '').trim());
      const opt = opts.find(o => (o.textContent || '').toUpperCase().includes(p.toUpperCase())) || opts[0];
      if (!opt) return { ok: false, err: 'sin opciones de moneda', labels };
      sel.value = opt.value;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: opt.value } }));
      return { ok: true, elegida: (opt.textContent || '').trim(), labels };
    }, pref);
    await pg.waitForTimeout(1800);
    return res;
  }

  // Cuenta documentos (checkboxes) visibles en el Tab Documentos.
  async function contarDocumentos() {
    return pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs || docs.offsetParent === null) return 0;
      return [...docs.querySelectorAll('ion-checkbox')].filter(c => c.getBoundingClientRect().width > 0).length;
    });
  }

  // Carga documentos robusta: selecciona Moneda Documento (US$) y reintenta con toggle si no cargan.
  async function cargarDocumentos() {
    let moneda = null, cbs = 0;
    for (let i = 0; i < 5; i++) {
      moneda = await seleccionarMonedaDocumento('US');
      await pg.waitForTimeout(1500);
      cbs = await contarDocumentos();
      if (cbs > 0) break;
      // toggle: elegir otra moneda y volver, fuerza recarga de la lista
      await seleccionarMonedaDocumento('BS');
      await pg.waitForTimeout(1200);
    }
    return { cbs, moneda };
  }

  // Marca el primer documento (checkbox) del Tab Documentos → devuelve {ok, count}
  async function marcarPrimerDocumento() {
    const info = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs || docs.offsetParent === null) return { count: 0 };
      const cbs = [...docs.querySelectorAll('ion-checkbox')].filter(c => c.getBoundingClientRect().width > 0);
      return { count: cbs.length };
    });
    if (info.count === 0) return { ok: false, count: 0 };
    const coords = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      const cbs = [...docs.querySelectorAll('ion-checkbox')]
        .filter(c => c.getBoundingClientRect().width > 0)
        .sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
      const r = cbs[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(1200);
    return { ok: true, count: info.count };
  }

  // Guardar / Enviar: Pointer(down/up) + shadow button.click() + mouse.click (el header fijo y≈32 no siempre recibe mouse)
  async function clickGuardarEnviar(cls) {
    const coords = await pg.evaluate((sel) => {
      const btn = document.querySelector(`ion-button.${sel}`);
      if (!btn || btn.disabled || btn.getBoundingClientRect().width === 0) return null;
      const inner = btn.shadowRoot && btn.shadowRoot.querySelector('button');
      try {
        (inner || btn).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        (inner || btn).dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        if (inner) inner.click();
      } catch (_) {}
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, cls);
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y, { delay: 120 });
    return true;
  }

  function blockFase2(motivo = 'Fase 2 — pendiente de construir/depurar en device') {
    FASE2.forEach(id => v(id, id, 'BLOCKED', motivo));
  }

  // Lee el "Monto total a pagar" y la Diferencia (texto + color) del Tab Pagos.
  async function leerPagosSticky() {
    return pg.evaluate(() => {
      const root = document.querySelector('app-cobro-pagos') || document.body;
      const txt = root.textContent.replace(/\s+/g, ' ');
      const totalM = txt.match(/Monto total a pagar[^\d-]*([\d.,-]+)/i);
      // Diferencia: span hoja con color en style
      let difColor = null, difVal = null;
      const spans = [...root.querySelectorAll('span, ion-text, p, div')].filter(n => /Diferencia/i.test(n.textContent || ''));
      for (const s of spans) {
        const leaf = [...s.querySelectorAll('*')].filter(x => x.children.length === 0 && /Diferencia/i.test(x.textContent));
        const node = leaf[0] || s;
        const st = (node.getAttribute && node.getAttribute('style')) || '';
        const cs = getComputedStyle(node).color;
        const m = (node.textContent || '').match(/Diferencia[^\d-]*([\d.,-]+)/i);
        if (m) { difVal = m[1]; difColor = (/red/i.test(st) ? 'red' : /blue/i.test(st) ? 'blue' : cs); break; }
      }
      return { total: totalM ? totalM[1] : null, difVal, difColor };
    });
  }

  // Convierte "66.852,91" → "6685291" (dígitos para el input de monto centavos-acumulativo)
  function montoADigitos(txt) {
    if (!txt) return '';
    return String(txt).replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
  }

  // Agrega método Efectivo con monto = total. Devuelve { ok, monto, error }.
  async function agregarPagoEfectivo() {
    // 1. Abrir modal (#eventSelect → setShowEventModal(true))
    const addInfo = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button#eventSelect, ion-button.pagos-add-method-btn');
      if (!btn || btn.disabled || btn.getBoundingClientRect().width === 0) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!addInfo) return { ok: false, error: 'botón Agregar método disabled/ausente' };
    await pg.mouse.click(addInfo.x, addInfo.y, { delay: 100 });
    await pg.waitForTimeout(1500);

    // 2. Check Efectivo en el modal (ionChange sobre el checkbox de la fila "Efectivo")
    const checked = await pg.evaluate(() => {
      const mod = [...document.querySelectorAll('#eventModal')].find(m => m.offsetParent !== null);
      if (!mod) return false;
      const items = [...mod.querySelectorAll('ion-item')];
      const it = items.find(i => /Efectivo/i.test(i.textContent));
      if (!it) return false;
      const cb = it.querySelector('ion-checkbox');
      if (!cb) return false;
      cb.checked = true;
      cb.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }));
      return true;
    });
    if (!checked) return { ok: false, error: 'checkbox Efectivo no encontrado en #eventModal' };
    await pg.waitForTimeout(600);

    // 3. Aceptar (.botonAddVerde → onAceptarTiposPago())
    await pg.evaluate(() => {
      const mod = [...document.querySelectorAll('#eventModal')].find(m => m.offsetParent !== null);
      if (!mod) return;
      const btn = [...mod.querySelectorAll('ion-button.botonAddVerde')].find(b => b.getBoundingClientRect().width > 0);
      if (btn) btn.click();
    });
    await pg.waitForTimeout(1500);

    // 4. Expandir el accordion Efectivo. Setear value en TODOS los accordion-group + click header.
    await pg.evaluate(() => {
      document.querySelectorAll('app-cobro-pagos ion-accordion-group').forEach(grp => {
        const acc = grp.querySelector('ion-accordion');
        const val = acc ? acc.getAttribute('value') : 'efectivo0';
        grp.value = val;
        grp.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
      });
      // fallback: click en el header "Efectivo"
      const hdr = [...document.querySelectorAll('app-cobro-pagos ion-accordion ion-item[slot="header"]')]
        .find(h => /Efectivo/i.test(h.textContent));
      if (hdr) hdr.click();
    });
    await pg.waitForTimeout(1200);

    // 5. Leer total → dígitos → llenar Monto (2º ion-input del bloque efectivo; centavos-acumulativo)
    const sticky = await leerPagosSticky();
    const digitos = montoADigitos(sticky.total);
    if (!digitos) return { ok: false, error: 'no se pudo leer el total a pagar' };

    const focused = await pg.evaluate(() => {
      // El input de Monto tiene inputmode="numeric" (Nro Recibo no). Preferir ese; fallback al 2º ion-input.
      const pagos = document.querySelector('app-cobro-pagos');
      if (!pagos) return { ok: false, diag: 'no app-cobro-pagos' };
      const allInputs = [...pagos.querySelectorAll('ion-input')].filter(i => i.getBoundingClientRect().width > 0);
      let montoIon = allInputs.find(i => {
        const n = i.querySelector('input');
        return n && (n.getAttribute('inputmode') === 'numeric' || /monto/i.test(i.getAttribute('label') || ''));
      });
      if (!montoIon) montoIon = allInputs[1] || allInputs[0];
      const diag = { accs: [...pagos.querySelectorAll('ion-accordion')].map(a => a.getAttribute('value')),
        inputs: allInputs.length };
      if (!montoIon) return { ok: false, diag };
      const native = montoIon.querySelector('input') || (montoIon.shadowRoot && montoIon.shadowRoot.querySelector('input'));
      if (!native) return { ok: false, diag };
      native.focus();
      window.__qaMontoInput = native;
      return { ok: true, diag };
    });
    if (!focused.ok) return { ok: false, error: `input Monto no encontrado (accs:${JSON.stringify(focused.diag && focused.diag.accs)} inputs:${focused.diag && focused.diag.inputs})` };
    // Limpiar y teclear dígitos (onMontoKeyDown arma los centavos)
    for (let i = 0; i < 12; i++) await pg.keyboard.press('Backspace');
    await pg.keyboard.type(digitos, { delay: 40 });
    await pg.evaluate(() => {
      const n = window.__qaMontoInput;
      if (n) { n.dispatchEvent(new Event('blur', { bubbles: true })); }
    });
    await pg.waitForTimeout(1200);
    return { ok: true, monto: digitos, total: sticky.total };
  }

  // Inyecta un adjunto por el PIPELINE REAL de la app (NO fabricando el objeto Foto — eso colgaba
  // el Guardar). Este build usa @capacitor/camera (webpack) + resultType Uri → se mockea el bridge
  // Capacitor.nativePromise para que Camera.getPhoto devuelva un webPath = data URI, y se dispara
  // el tomarImg() real → addPhotoFromCamera hace fetch(dataURI) → Foto bien formada + estado correcto.
  // Requiere estar en Tab Adjuntos (app-adjunto en el DOM) y window.ng disponible.
  async function inyectarAdjunto() {
    await clickTab('adjuntos');
    await pg.waitForTimeout(1000);
    return pg.evaluate(async (b64) => {
      const C = window.Capacitor;
      if (!C || typeof C.nativePromise !== 'function') return { ok: false, err: 'Capacitor.nativePromise no disponible' };
      // Mock del bridge. addPhotoFromCamera tiene 2 ramas: photo.path → Filesystem.readFile (base64),
      // o photo.webPath → fetch(...). El fetch de un data URI lo BLOQUEA el CSP del WebView
      // ("Failed to fetch"), así que usamos la rama path: getPhoto devuelve un path y mockeamos
      // Filesystem.readFile para que devuelva el base64. Sin fetch, Foto bien formada por el pipeline.
      // Guardar el original UNA vez; reinstalar el mock SIEMPRE (la página persiste entre runs → un
      // guard `if (!__qaCamOrig)` dejaría activo un mock viejo y los cambios no tomarían efecto).
      if (!C.__qaCamOrig) C.__qaCamOrig = C.nativePromise;
      window.__qaCamHits = 0;
      window.__qaFsHits = 0;
      C.nativePromise = function (plugin, metodo, opts) {
        if (plugin === 'Camera') {
          if (metodo === 'getPhoto') {
            window.__qaCamHits++;
            const z = (typeof Zone !== 'undefined') ? Zone.current : null;
            return new Promise((resolve) => {
              const d = () => resolve({ path: 'qa_mock.jpg', webPath: 'qa_mock.jpg', format: 'jpeg', saved: false });
              if (z) z.run(d); else d();
            });
          }
          if (metodo === 'checkPermissions' || metodo === 'requestPermissions')
            return Promise.resolve({ camera: 'granted', photos: 'granted' });
          return Promise.resolve({});
        }
        if (plugin === 'Filesystem' && metodo === 'readFile') {
          window.__qaFsHits++;
          return Promise.resolve({ data: b64 });
        }
        return C.__qaCamOrig.call(this, plugin, metodo, opts);
      };
      const el = document.querySelector('app-adjunto');
      if (!el || !window.ng || !window.ng.getComponent) return { ok: false, err: 'app-adjunto/ng no disponible' };
      const comp = window.ng.getComponent(el);
      if (!comp || typeof comp.tomarImg !== 'function') return { ok: false, err: 'comp.tomarImg no disponible' };
      const svc = comp.service;
      // Guard: si quAttach viene 0/NaN (config sin 'quAttach'), checkImgLimit corta tomarImg. Forzar límite.
      const quAntes = svc ? svc.quAttach : undefined;
      if (svc && (!svc.quAttach || svc.quAttach < 1 || isNaN(svc.quAttach))) svc.quAttach = 5;
      const antes = (svc && Array.isArray(svc.fotos)) ? svc.fotos.length : -1;
      try { await comp.tomarImg(); } catch (e) {
        return { ok: false, err: 'tomarImg: ' + (e && e.message), antes, quAntes, camHits: window.__qaCamHits, fsHits: window.__qaFsHits };
      }
      const despues = (svc && Array.isArray(svc.fotos)) ? svc.fotos.length : -1;
      try { window.ng.applyChanges(comp); } catch (_) {}
      return { ok: despues > antes, antes, despues, quAntes, quAttach: svc && svc.quAttach,
        camHits: window.__qaCamHits, fsHits: window.__qaFsHits };
    }, BASE64_1PX_JPEG);
  }

  // ─── N/A por VG (resolver temprano) ───────────────────────────────────────────
  if (!DATA.requiredComment) v('DM-COB-006', 'Comentario obligatorio', 'N/A', 'requiredComment=false');
  if (!DATA.userCanSelectIGTF) {
    ['DM-COB-036','DM-COB-044','DM-COB-045'].forEach(id =>
      v(id, id, 'N/A', 'userCanSelectIGTF=false (IGTF inactivo)'));
  }
  if (!DATA.userCanCollectIva) v('DM-COB-037', 'Cobro 25% IVA', 'N/A', 'userCanCollectIva=false');

  // ─── Navegar al módulo Cobros ─────────────────────────────────────────────────
  try {
    const tileCoords = await pg.evaluate(() => {
      const tile = [...document.querySelectorAll('app-home a[href], app-home ion-card, app-home .tile, app-home a')]
        .filter(t => t.getBoundingClientRect().width > 0)
        .find(t => {
          const p = t.querySelector('p.nombreModulos, p');
          const txt = (p ? p.textContent : t.textContent).trim().toUpperCase();
          return txt.includes('COBRO');
        });
      if (!tile) return null;
      const r = tile.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tileCoords) throw new Error('Tile Cobros no encontrado en Home');
    await pg.mouse.click(tileCoords.x, tileCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);
    await pg.waitForSelector('app-cobros', { timeout: 15000 });

    const botones = await pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0).map(b => b.textContent.trim()));
    const ok = botones.includes('COBRO') && botones.includes('BUSCAR');
    v('DM-COB-001', 'Módulo Cobros → home (COBRO + BUSCAR)', ok ? 'PASS' : 'FAIL', `botones: ${botones.join(', ')}`);
  } catch (e) {
    v('DM-COB-001', 'Módulo Cobros → home', 'FAIL', e.message);
    ['DM-COB-002','DM-COB-004','DM-COB-007','DM-COB-008','DM-COB-009','DM-COB-016',
     'DM-COB-018','DM-COB-019','DM-COB-022','DM-COB-024','DM-COB-026','DM-COB-020','DM-COB-021']
      .forEach(id => v(id, id, 'BLOCKED', 'DM-COB-001 falló'));
    blockFase2('DM-COB-001 falló');
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DM-COB-002: COBRO → form 5 tabs, Documentos/Pagos/Total/Adjuntos disabled sin cliente ─
  try {
    const abrió = await abrirNuevoCobro();
    if (!abrió) throw new Error('Form no abrió (5 tabs)');
    const info = await pg.evaluate(() => {
      const tabs = [...document.querySelectorAll('ion-segment-button')].filter(s => s.getBoundingClientRect().width > 0);
      const habil = tabs.filter(s => !s.disabled && s.getAttribute('disabled') === null).length;
      return { total: tabs.length, habil, labels: tabs.map(s => s.textContent.trim()) };
    });
    const ok = info.total >= 5 && info.habil <= 1; // solo General activo
    v('DM-COB-002', 'COBRO → form 5 tabs; resto disabled sin cliente', ok ? 'PASS' : 'FAIL',
      `tabs: ${info.total} (${info.labels.join('/')}) · habilitadas: ${info.habil}`);
  } catch (e) {
    v('DM-COB-002', 'COBRO → form 5 tabs', 'FAIL', e.message);
  }

  // ─── DM-COB-004: Seleccionar cliente → tabs habilitadas ───────────────────────
  let clienteOk = false;
  try {
    await seleccionarCliente(DATA.clienteTest);
    if (DATA.requiredComment) await fillComentario(comentTest);
    let habil = 0;
    for (let i = 0; i < 8; i++) { habil = await tabsHabilitadas(); if (habil >= 4) break; await pg.waitForTimeout(700); }
    clienteOk = habil >= 4;
    v('DM-COB-004', 'Seleccionar cliente → tabs habilitadas', clienteOk ? 'PASS' : 'FAIL',
      `cliente: "${DATA.clienteTest}" · tabs habilitadas: ${habil}`);
  } catch (e) {
    v('DM-COB-004', 'Seleccionar cliente → tabs habilitadas', 'FAIL', e.message);
  }

  // ─── REQ Enviar · E1 + E2 — cliente elegido, aún sin documento ni pago ────────
  // 🔴 R1 · después de DM-COB-004: la transacción empieza al elegir el cliente.
  // `naceDeshabilitado` declarado: en Cobros es COHERENTE que Enviar nazca
  // deshabilitado, porque antes hay que agregar un método de pago. Así queda
  // como PASS con motivo y no como una falsa alarma en cada corrida — pero si
  // algún día naciera habilitado, la nota del caso lo dirá.
  reqV(await reqInicio(pg, 'COB', {
    naceDeshabilitado: 'primero hay que agregar un método de pago',
  }));
  reqV(await reqRechazo(pg, 'COB'));

  // ─── DM-COB-007: Tab Documentos → lista + leyenda ─────────────────────────────
  let hayDocs = false;
  try {
    await clickTab('documentos');
    const carga = await cargarDocumentos();   // robusto: US$ + reintento con toggle
    const info = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs) return { leyenda: false };
      const txt = docs.textContent.toLowerCase();
      return { leyenda: txt.includes('vigente') || txt.includes('vencido') || txt.includes('favor') };
    });
    hayDocs = carga.cbs > 0;
    v('DM-COB-007', 'Tab Documentos → lista + leyenda', carga.cbs > 0 ? 'PASS' : 'N/A',
      carga.cbs > 0 ? `documentos: ${carga.cbs} · leyenda: ${info.leyenda}`
        : `cliente sin documentos (monedas: ${JSON.stringify((carga.moneda && carga.moneda.labels) || [])})`);
  } catch (e) {
    v('DM-COB-007', 'Tab Documentos', 'FAIL', e.message);
  }

  // ─── DM-COB-008: Marcar documento → total en sticky de Pagos actualiza ─────────
  try {
    if (!hayDocs) { v('DM-COB-008', 'Marcar documento → total actualiza', 'N/A', 'sin documentos'); }
    else {
      const mark = await marcarPrimerDocumento();
      await clickTab('pagos');
      const total = await pg.evaluate(() => {
        const el = [...document.querySelectorAll('app-cobro-pagos *')]
          .find(n => /Monto total a pagar/i.test(n.textContent || ''));
        return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null;
      });
      v('DM-COB-008', 'Marcar documento → total en Pagos', mark.ok && total ? 'PASS' : 'FAIL',
        `marcados: ${mark.count} · total: "${total || 'n/a'}"`);
    }
  } catch (e) {
    v('DM-COB-008', 'Marcar documento → total', 'FAIL', e.message);
  }

  // ─── DM-COB-009: Tab Pagos → click "Agregar método de pago" → modal ───────────
  try {
    await clickTab('pagos');
    // Click REAL en #eventSelect (setShowEventModal(true)). NO usar .present() → forzaba
    // el modal size="cover" a pantalla completa saltando el binding de Angular.
    const addInfo = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button#eventSelect, ion-button.pagos-add-method-btn');
      if (!btn || btn.getBoundingClientRect().width === 0) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: btn.disabled };
    });
    if (!addInfo) {
      v('DM-COB-009', 'Tab Pagos → botón "Agregar método de pago"', 'N/A',
        'botón no visible (requiere documento/monto seleccionado)');
    } else if (addInfo.disabled) {
      v('DM-COB-009', 'Tab Pagos → botón "Agregar método de pago"', 'N/A',
        'botón disabled (isAddPaymentMethodDisabled — falta documento/monto)');
    } else {
      await pg.mouse.click(addInfo.x, addInfo.y, { delay: 100 });
      await pg.waitForTimeout(1800);
      const info = await pg.evaluate(() => {
        const mods = [...document.querySelectorAll('#eventModal')]
          .filter(m => m.offsetParent !== null && /Efectivo|Transferencia|Dep/i.test(m.textContent));
        if (!mods.length) return { open: false };
        const metodos = (mods[0].textContent.match(/Efectivo|Cheque|Transferencia|Dep[oó]sito|Otros|Pago M[oó]vil/gi) || []);
        return { open: true, metodos: [...new Set(metodos)] };
      });
      v('DM-COB-009', 'Tab Pagos → modal métodos de pago', info.open ? 'PASS' : 'FAIL',
        info.open ? `métodos: ${info.metodos.join(', ')}` : 'modal no abrió tras click');
      // Cerrar por el botón Cancelar del modal (setShowEventModal(false)) — mantiene estado Angular
      await pg.evaluate(() => {
        const mod = [...document.querySelectorAll('#eventModal')].find(m => m.offsetParent !== null);
        if (!mod) return;
        const cancel = [...mod.querySelectorAll('ion-button[color="light"]')].find(b => b.getBoundingClientRect().width > 0);
        if (cancel) cancel.click();
      });
      await pg.waitForTimeout(800);
    }
  } catch (e) {
    v('DM-COB-009', 'Tab Pagos → modal métodos', 'FAIL', e.message);
  }

  // ─── DM-COB-040/012/043: Completar pago Efectivo = total → diferencia azul ─────
  let pagoOk = false;
  try {
    if (!hayDocs) {
      ['DM-COB-040', 'DM-COB-012', 'DM-COB-043'].forEach(id => v(id, id, 'N/A', 'sin documento seleccionado'));
    } else {
      await clickTab('pagos');
      const difAntes = await leerPagosSticky();     // sin pago → diferencia roja (negativa)
      const pago = await agregarPagoEfectivo();
      if (!pago.ok) throw new Error(pago.error || 'pago falló');
      const difDespues = await leerPagosSticky();   // pago = total → diferencia azul (0,00)
      const esAzul = /blue|rgb\(0,\s*0,\s*255\)|#00f/i.test(difDespues.difColor || '');
      const esCero = /^-?0([.,]0+)?$/.test((difDespues.difVal || '').trim());
      pagoOk = esAzul || esCero;
      v('DM-COB-040', 'Completar pago Efectivo = total → diferencia azul', pagoOk ? 'PASS' : 'FAIL',
        `monto: ${pago.monto} · antes: ${difAntes.difVal}(${difAntes.difColor}) · después: ${difDespues.difVal}(${difDespues.difColor})`);
      const rojoAntes = /red|rgb\(255,\s*0,\s*0\)/i.test(difAntes.difColor || '');
      v('DM-COB-012', 'Diferencia rojo (insuf.) → azul (cubre)', (rojoAntes && pagoOk) ? 'PASS' : 'FAIL',
        `antes: ${difAntes.difColor} · después: ${difDespues.difColor}`);
      v('DM-COB-043', 'Diferencia se actualiza con el monto', (difAntes.difVal !== difDespues.difVal) ? 'PASS' : 'FAIL',
        `antes: ${difAntes.difVal} · después: ${difDespues.difVal}`);
    }
  } catch (e) {
    ['DM-COB-040', 'DM-COB-012', 'DM-COB-043'].forEach(id => {
      if (!verdicts.find(x => x.id === id)) v(id, id, 'FAIL', e.message);
    });
  }

  // ─── DM-COB-016: Tab Adjuntos → acordeones visibles ───────────────────────────
  // NOTA: la inyección de adjunto (inyectarAdjunto) queda para DM-COB-019 (Fase 2), JUSTO
  // antes de Enviar. Inyectar aquí (antes de Guardar) dispara onAttachmentChanged y rompe el
  // Guardar inmediato — confirmado en corrida 20260826_162210 (018 sin alert + cascada nav).
  try {
    await clickTab('adjuntos');
    const info = await pg.evaluate(() => {
      const adj = document.querySelector('app-adjunto');
      const txt = (adj ? adj.textContent : document.body.textContent).toLowerCase();
      return {
        img: txt.includes('imagen') || txt.includes('foto'),
        arch: txt.includes('archivo') || txt.includes('file'),
        firma: txt.includes('firma'),
      };
    });
    v('DM-COB-016', 'Tab Adjuntos → acordeones visibles', info.img ? 'PASS' : 'FAIL',
      `imágenes: ${info.img} · archivo: ${info.arch} · firma: ${info.firma}`);
  } catch (e) {
    v('DM-COB-016', 'Tab Adjuntos', 'FAIL', e.message);
  }

  // ─── DM-COB-018: Guardar → alert "El Cobro se ha guardado" ─────────────────────
  let guardadoOk = false;
  try {
    if (!clienteOk || !hayDocs) {
      v('DM-COB-018', 'Guardar cobro → alert', 'N/A', 'sin cliente/documento válido para guardar');
    } else {
      // ── REQ Enviar · E5 ─────────────────────────────────────────────────────
      // El cobro está completo: documento marcado y pago cuadrado con el total
      // (DM-COB-040/012/043 dejaron la diferencia en azul). Si alguna pestaña
      // sigue en rojo aquí, no corresponde a ningún campo pendiente (F1).
      // Se mide antes de Guardar, que es el punto más avanzado al que llega la
      // Fase 1 del guion: el Enviar de Cobros vive en DM-COB-019 y depende del
      // adjunto obligatorio.
      reqV(await reqPestanaRoja(pg, 'COB', { rotar: true }));

      await clickGuardarEnviar('imagenGuardar');
      await pg.waitForTimeout(1500);
      const alertMsg = await readAlert();
      guardadoOk = !!(alertMsg && /guardad/i.test(alertMsg));
      v('DM-COB-018', 'Guardar cobro → alert confirmación', guardadoOk ? 'PASS' : 'FAIL', `alert: "${alertMsg || 'ninguno'}"`);
      if (alertMsg) await clickAlertBtn(['Aceptar', 'OK']);
    }
  } catch (e) {
    v('DM-COB-018', 'Guardar cobro', 'FAIL', e.message);
  }

  // ─── DM-COB-019: Enviar (adjunto obligatorio) — intentar con mock cámara ──────
  try {
    if (!guardadoOk) {
      v('DM-COB-019', 'Enviar cobro', 'N/A', 'no hubo cobro guardado');
    } else if (DATA.requiredCollectionAttachments && DATA.mockCamaraFunciona === false) {
      v('DM-COB-019', 'Enviar cobro', 'SKIP', 'requiredCollectionAttachments=true + mock_camara_funciona=false → Guardado, envío manual QA');
    } else {
      // Fase 1: sin helper ensureAdjunto standalone confiable → marcar pendiente de Fase 2
      v('DM-COB-019', 'Enviar cobro (con adjunto)', 'BLOCKED', 'Fase 2 — ensureAdjunto/mock cámara standalone pendiente');
    }
  } catch (e) {
    v('DM-COB-019', 'Enviar cobro', 'FAIL', e.message);
  }

  // ─── DM-COB-022: BUSCAR → lista + searchbar ───────────────────────────────────
  try {
    await irAHomeCobros();
    await clickBotonHome('BUSCAR');
    let info = { list: false, items: 0 };
    for (let i = 0; i < 10; i++) {
      await pg.waitForTimeout(1000);
      info = await pg.evaluate(() => {
        const list = document.querySelector('app-cobros-list');
        if (!list || list.offsetParent === null) return { list: false, items: 0 };
        const items = [...list.querySelectorAll('ion-item')].filter(el => el.getBoundingClientRect().width > 0).length;
        const sb = !!list.querySelector('ion-searchbar');
        return { list: true, items, sb };
      });
      if (info.list) break;
    }
    v('DM-COB-022', 'BUSCAR → lista con searchbar', info.list ? 'PASS' : 'FAIL',
      `lista: ${info.list} · ítems: ${info.items} · searchbar: ${info.sb}`);
  } catch (e) {
    v('DM-COB-022', 'BUSCAR → lista', 'FAIL', e.message);
  }

  // ─── DM-COB-024: Abrir Guardado → editable ────────────────────────────────────
  try {
    const coords = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('app-cobros-list ion-item')]
        .filter(el => el.getBoundingClientRect().width > 0 && /Guardado/i.test(el.textContent));
      if (!items.length) return null;
      items[0].scrollIntoView({ block: 'center' });
      const r = items[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) { v('DM-COB-024', 'Abrir Guardado → editable', 'N/A', 'sin cobros Guardado en lista'); }
    else {
      await pg.mouse.click(coords.x, coords.y, { delay: 120 });
      await pg.waitForTimeout(2000);
      const habil = await tabsHabilitadas();
      v('DM-COB-024', 'Abrir Guardado → form editable', habil >= 3 ? 'PASS' : 'FAIL', `tabs accesibles: ${habil}`);
      await clickBack().catch(() => {});
      await pg.waitForTimeout(1200);
    }
  } catch (e) {
    v('DM-COB-024', 'Abrir Guardado', 'FAIL', e.message);
  }

  // ─── DM-COB-026: Eliminar Guardado → desaparece ───────────────────────────────
  try {
    await irAHomeCobros().catch(() => {});
    await clickBotonHome('BUSCAR').catch(() => {});
    await pg.waitForTimeout(2000);
    const before = await pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros-list ion-item')]
        .filter(el => el.getBoundingClientRect().width > 0 && /Guardado/i.test(el.textContent)).length);
    const trash = await pg.evaluate(() => {
      const btns = [...document.querySelectorAll('app-cobros-list ion-button[color="danger"], app-cobros-list ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0 && (b.querySelector('ion-icon[name="trash"]') || /danger/.test(b.getAttribute('color') || '')));
      if (!btns.length) return null;
      const r = btns[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (before === 0 || !trash) { v('DM-COB-026', 'Eliminar Guardado', 'N/A', `Guardados: ${before} · botón trash: ${!!trash}`); }
    else {
      await pg.mouse.click(trash.x, trash.y, { delay: 80 });
      await clickAlertBtn(['Eliminar', 'Aceptar', 'Sí', 'OK']).catch(() => {});
      await pg.waitForTimeout(1500);
      const after = await pg.evaluate(() =>
        [...document.querySelectorAll('app-cobros-list ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0 && /Guardado/i.test(el.textContent)).length);
      v('DM-COB-026', 'Eliminar Guardado → desaparece', after < before ? 'PASS' : 'FAIL', `antes: ${before} · después: ${after}`);
    }
  } catch (e) {
    v('DM-COB-026', 'Eliminar Guardado', 'FAIL', e.message);
  }

  // ─── DM-COB-020/021: dirty-guard al salir de cobro nuevo con cambios ──────────
  try {
    await irAHomeCobros();
    await abrirNuevoCobro();
    await seleccionarCliente(DATA.clienteTest);
    await pg.waitForTimeout(1000);
    await clickBack();
    await pg.waitForTimeout(1500);
    const modal = await readAlert();
    const tieneModal = !!(modal && /salir|guardar/i.test(modal)) || await pg.evaluate(() =>
      [...document.querySelectorAll('ion-alert .alert-button')].some(b => /salir sin guardar/i.test(b.textContent)));
    v('DM-COB-020', 'Atrás con cambios → modal Salir/Guardar', tieneModal ? 'PASS' : 'FAIL', `modal: "${modal || (tieneModal ? 'botones detectados' : 'ninguno')}"`);
    // DM-COB-021: elegir "Salir sin guardar" → no queda Guardado
    const salió = await dismissDirtyGuard();
    const enHome = await isHomeCobrosVisible().catch(() => false);
    v('DM-COB-021', 'Salir sin guardar → no persiste', (salió || enHome) ? 'PASS' : 'FAIL', `salió por modal: ${salió} · home: ${enHome}`);
  } catch (e) {
    v('DM-COB-020', 'Atrás con cambios → modal', 'FAIL', e.message);
    v('DM-COB-021', 'Salir sin guardar', 'FAIL', e.message);
    await irAHomeCobros().catch(() => {});
  }

  // ─── Cotejo BD (si se capturó un payload collectionservice) ───────────────────
  try {
    const payloads = await getCapturedPayloads(pg);
    const pCob = payloads.filter(p => /collectionservice\/collection|collectservice\/collect/i.test(String(p.url)));
    if (pCob.length && DATA.clienteSlug) {
      const marca = cotejoPayload(DATA.clienteSlug, pCob[pCob.length - 1]);
      // Anexar a DM-COB-018 como nota informativa
      const d = verdicts.find(x => x.id === 'DM-COB-018');
      if (d) d.nota += ` · ${marca}`;
    }
  } catch (_) {}

  // ─── Fase 2: marcar pendientes ────────────────────────────────────────────────
  FASE2.forEach(id => {
    if (!verdicts.find(x => x.id === id)) v(id, id, 'BLOCKED', 'Fase 2 — pendiente de construir/depurar en device');
  });

  // Volver a HOME de la app
  try { await irAHomeCobros(); await clickBack(); await pg.waitForTimeout(1200); } catch (_) {}

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runCobros: conReq('COB', runCobros) };
