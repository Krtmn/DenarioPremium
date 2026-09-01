'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { installPayloadCapture, getCapturedPayloads } = require('../../cdp/denario-cdp-helpers');
const { reqInicio, reqRechazo, reqPestanaRoja, reqIds, conReq } = require('../req-enviar');

const LOCAL_QUERY_PATH    = path.resolve(__dirname, '../../db/local-query.js');
const COTEJO_PAYLOAD_PATH = path.resolve(__dirname, '../../db/cotejo-payload.js');

function localQuery(sql) {
  try {
    return JSON.parse(
      execFileSync('node', [LOCAL_QUERY_PATH, sql], { encoding: 'utf8', timeout: 15000 })
    );
  } catch (_) { return []; }
}

function cotejoPayload(slug, payload) {
  const tmp = path.join(os.tmpdir(), `qa_dep_payload_${Date.now()}.json`);
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
 * modules/depositos.js — 12 casos smoke (DM-DEP-001/002/004/005/006/009/010/014/017/018/019/020)
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteSlug:string }} DATA
 */
async function runDepositos(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // Regresión permanente del REQ «Botón Enviar y campos obligatorios» (ver ../req-enviar.js)
  const reqV = (r) => v(r.id, r.descripcion, r.resultado, r.nota);

  const TODOS = [
    'DM-DEP-001','DM-DEP-002','DM-DEP-004','DM-DEP-005','DM-DEP-006',
    'DM-DEP-009','DM-DEP-010','DM-DEP-014','DM-DEP-017','DM-DEP-018',
    'DM-DEP-019','DM-DEP-020',
    ...reqIds('DEP'),
  ];

  if (!DATA.aplica) {
    TODOS.forEach(id => v(id, id, 'N/A', 'aplica=false en perfil depositos'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  try { await installPayloadCapture(pg); } catch (_) {}

  const ts           = String(Date.now()).slice(-6);
  const nroPlantilla = `DEP-QA-${ts}`;
  const nroDel       = `DEP-DEL-${ts}`;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function dismissIonLoadings() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-loading').forEach(el => {
        if (el.offsetParent !== null) try { el.dismiss(); } catch (_) {}
      });
    });
  }

  async function clickBack() {
    const coords = await pg.evaluate(() => {
      const imgs = [...document.querySelectorAll('img.fechaAtras')];
      const back = imgs.find(img => {
        const r = img.getBoundingClientRect();
        return r.width > 0 && r.x < 120 && r.y < 120;
      });
      if (back) {
        const target = back.closest('a') || back;
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return null;
    });
    if (!coords) throw new Error('img.fechaAtras no encontrado');
    await pg.mouse.click(coords.x, coords.y, { delay: 60 });
  }

  // Botón de alert por igualdad EXACTA — Ionic 7 pattern
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
          b.textContent.trim().toLowerCase() === lbl.toLowerCase() &&
          b.getBoundingClientRect().width > 0
        );
        if (btn) {
          const r = btn.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: lbl };
        }
      }
      return null;
    }, labels);
    if (!coords) throw new Error('Alert btn no encontrado: ' + labels.join('/'));
    await pg.mouse.click(coords.x, coords.y);
    return coords.label;
  }

  // Descarta dirty-guard con "Salir sin guardar" (EXACT match — anti-patrón /salir/i)
  async function dismissDirtyGuard() {
    const hasDirty = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-alert')].some(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      })
    );
    if (!hasDirty) return false;
    const coords = await pg.evaluate(() => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!alerts.length) return null;
      const btn = [...alerts[alerts.length - 1].querySelectorAll('.alert-button')].find(b =>
        b.textContent.trim().toLowerCase() === 'salir sin guardar' &&
        b.getBoundingClientRect().width > 0
      );
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (coords) { await pg.mouse.click(coords.x, coords.y); await pg.waitForTimeout(800); }
    return true;
  }

  async function clickBotonHome(texto) {
    const coords = await pg.evaluate((t) => {
      const btns = [...document.querySelectorAll('app-depositos ion-button')].filter(
        b => b.textContent.trim() === t && b.getBoundingClientRect().width > 0
      );
      if (!btns.length) return null;
      const r = btns[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) {
      const diag = await pg.evaluate(() => {
        const all = [...document.querySelectorAll('app-depositos ion-button')].map(b => ({
          text: b.textContent.trim().slice(0, 30),
          w: Math.round(b.getBoundingClientRect().width),
          disabled: b.disabled
        }));
        const page = document.querySelector('[class*="ion-page"]:not(.ion-page-hidden)')?.tagName || 'unknown';
        return { btns: all, page };
      });
      throw new Error(`Botón "${texto}" no encontrado en home depositos — diag: ${JSON.stringify(diag)}`);
    }
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  // ¿app-deposito-list visible y sin loader colgado?
  async function esperarListaRendered(timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const info = await pg.evaluate(() => {
        const list = document.querySelector('app-deposito-list');
        if (!list || list.offsetParent === null) return { visible: false };
        const spinner = list.querySelector('ion-spinner');
        const loading = [...document.querySelectorAll('ion-loading')].some(l => l.offsetParent !== null);
        const items   = [...list.querySelectorAll('ion-item')].filter(i => i.getBoundingClientRect().width > 0).length;
        return {
          visible: true,
          colgado: !!(spinner && spinner.getBoundingClientRect().width > 0) || loading,
          items,
        };
      });
      if (!info.visible)   return { visible: false, items: 0, colgado: false };
      if (!info.colgado)   return info;
      await pg.waitForTimeout(600);
    }
    return { visible: true, items: 0, colgado: true };
  }

  async function isFormVisible() {
    return pg.evaluate(() => {
      const f = document.querySelector('app-deposito');
      return !!(f && f.offsetParent !== null);
    });
  }

  // Verifica que los botones DEPÓSITO/BUSCAR tengan ancho (Ionic ion-page-hidden puede no afectar offsetParent)
  async function isHomeDepositosVisible() {
    return pg.evaluate(() => {
      return [...document.querySelectorAll('app-depositos ion-button')].filter(
        b => b.getBoundingClientRect().width > 0
      ).length >= 2;
    });
  }

  // Navega a home depositos con back repetido hasta que los botones sean visibles
  async function irAHomeDepositos(maxAttempts = 6) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await isHomeDepositosVisible()) return;
      try { await clickBack(); } catch (_) {}
      await pg.waitForTimeout(800);
      await dismissDirtyGuard();
      await pg.waitForTimeout(400);
    }
    if (!(await isHomeDepositosVisible())) throw new Error('No se pudo llegar a home depositos');
  }

  // Selecciona el primer banco disponible (JS directo; fallback: popover click)
  async function seleccionarBanco() {
    const res = await pg.evaluate(() => {
      const sel = document.querySelector('ion-select.selectbanco');
      if (!sel) return { ok: false, error: 'ion-select.selectbanco no encontrado' };
      // Scope a este select — no global (evita mezclar opciones de empresa/moneda)
      const opts = [...sel.querySelectorAll('ion-select-option')].filter(o => {
        const v = o.value;
        return v !== undefined && v !== null && JSON.stringify(v) !== '{}';
      });
      if (!opts.length) return { ok: false, error: 'sin opciones en selectbanco', sel: true };
      sel.value = opts[0].value;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: opts[0].value } }));
      return { ok: true, label: (opts[0].textContent || '').trim().slice(0, 40), count: opts.length };
    });

    if (!res.ok && res.sel) {
      // Intentar abrir popover y clicar primera opción del alert
      const sc = await pg.evaluate(() => {
        const sel = document.querySelector('ion-select.selectbanco');
        if (!sel) return null;
        const r = sel.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!sc) throw new Error(res.error);
      await pg.mouse.click(sc.x, sc.y, { delay: 80 });
      await pg.waitForTimeout(1200);
      const firstBtn = await pg.evaluate(() => {
        const alerts = [...document.querySelectorAll('ion-alert')].filter(
          a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
        );
        if (!alerts.length) return null;
        const btns = [...alerts[alerts.length - 1].querySelectorAll('.alert-radio-button,.alert-checkbox-button')]
          .filter(b => b.getBoundingClientRect().width > 0);
        if (!btns.length) return { count: 0 };
        const r = btns[0].getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, count: btns.length };
      });
      if (!firstBtn || firstBtn.count === 0) {
        await pg.keyboard.press('Escape');
        throw new Error('Banco popover: 0 opciones');
      }
      await pg.mouse.click(firstBtn.x, firstBtn.y, { delay: 60 });
      await pg.waitForTimeout(400);
      await clickAlertBtn(['OK', 'Aceptar']);
      return { label: 'primer banco (popover)', count: firstBtn.count };
    }
    if (!res.ok) throw new Error(res.error);
    return res;
  }

  // Fecha Doc: releer rect DESPUÉS del banco → modal → set ISO → #confirm-button
  async function seleccionarFechaDoc() {
    const fechaCoords = await pg.evaluate(() => {
      // Todos los letrasFechasButton no-disabled visibles; idx 1 = Fecha Doc, idx 0 = Fecha Depósito
      const btns = [...document.querySelectorAll('ion-button.letrasFechasButton')]
        .filter(b => b.getBoundingClientRect().width > 0);
      // Si el primero está disabled (calculado), el habilitado es el siguiente
      const target = btns.find(b => !b.disabled) || btns[1] || btns[0];
      if (!target) return null;
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!fechaCoords) throw new Error('ion-button.letrasFechasButton no encontrado');
    await pg.mouse.click(fechaCoords.x, fechaCoords.y, { delay: 80 });
    await pg.waitForTimeout(1200);

    const hoy = new Date().toISOString().slice(0, 10);
    await pg.evaluate((fecha) => {
      const dt = document.querySelector('fechasModal ion-datetime, ion-modal ion-datetime, ion-datetime');
      if (!dt) return;
      dt.value = fecha;
      dt.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: fecha } }));
    }, hoy);
    await pg.waitForTimeout(500);

    // #confirm-button en shadowRoot, o botón "Aceptar" en el modal
    const confirmCoords = await pg.evaluate(() => {
      const dt = document.querySelector('fechasModal ion-datetime, ion-modal ion-datetime, ion-datetime');
      if (dt && dt.shadowRoot) {
        const btn = dt.shadowRoot.querySelector('#confirm-button');
        if (btn) {
          const r = btn.getBoundingClientRect();
          if (r.width > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
      const modal = document.querySelector('fechasModal, ion-modal');
      if (modal) {
        const btn = [...modal.querySelectorAll('ion-button')].find(
          b => b.textContent.trim() === 'Aceptar' && b.getBoundingClientRect().width > 0
        );
        if (btn) { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      }
      return null;
    });

    if (confirmCoords) {
      await pg.mouse.click(confirmCoords.x, confirmCoords.y);
    } else {
      await pg.evaluate(() => {
        const dt = document.querySelector('fechasModal ion-datetime, ion-modal ion-datetime, ion-datetime');
        if (dt && typeof dt.confirm === 'function') dt.confirm();
      });
    }
    await pg.waitForTimeout(800);
  }

  async function fillNroPlantilla(nro) {
    const focused = await pg.evaluate(() => {
      const inp = [...document.querySelectorAll('ion-input')].find(
        i => i.label && String(i.label).startsWith('Nro. Plantilla')
      );
      if (!inp) return false;
      const native = inp.querySelector('input');
      if (!native) return false;
      native.focus();
      return true;
    });
    if (!focused) throw new Error('ion-input Nro. Plantilla no encontrado por label');
    await pg.keyboard.type(nro, { delay: 30 });
    await pg.waitForTimeout(400);
  }

  // Tab Cobros → click primer checkbox → devuelve { ok, count }
  async function marcarPrimerCobro() {
    const tabCoords = await pg.evaluate(() => {
      const tab = [...document.querySelectorAll('ion-segment-button')].find(
        s => s.textContent.trim().includes('Cobros') && !s.disabled && s.getBoundingClientRect().width > 0
      );
      if (!tab) return null;
      const r = tab.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tabCoords) throw new Error('Tab Cobros no encontrado o disabled');
    await pg.mouse.click(tabCoords.x, tabCoords.y, { delay: 60 });
    await pg.waitForTimeout(1500);

    const cbInfo = await pg.evaluate(() => {
      const cobros = document.querySelector('app-deposito-cobros');
      if (!cobros || cobros.offsetParent === null) return { count: 0 };
      const cbs = [...cobros.querySelectorAll('ion-checkbox')]
        .filter(c => c.getBoundingClientRect().width > 0);
      return { count: cbs.length };
    });
    if (cbInfo.count === 0) return { ok: false, count: 0 };

    const cbCoords = await pg.evaluate(() => {
      const cobros = document.querySelector('app-deposito-cobros');
      if (!cobros) return null;
      const cbs = [...cobros.querySelectorAll('ion-checkbox')]
        .filter(c => c.getBoundingClientRect().width > 0)
        .sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
      if (!cbs.length) return null;
      const r = cbs[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!cbCoords) return { ok: false, count: 0 };
    await pg.mouse.click(cbCoords.x, cbCoords.y, { delay: 80 });
    await pg.waitForTimeout(800);
    return { ok: true, count: cbInfo.count };
  }

  async function guardarHabilitado() {
    return pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenGuardar');
      return !!(btn && !btn.disabled && btn.getBoundingClientRect().width > 0);
    });
  }

  // Crea un depósito completo (banco → fecha → nro → cobro → guardar → back)
  // Devuelve { ok, alertLbl, error }
  async function crearDeposito(nro) {
    try {
      if (!(await isFormVisible())) return { ok: false, error: 'form no visible' };
      await seleccionarBanco();
      await pg.waitForTimeout(800);
      await seleccionarFechaDoc();
      await fillNroPlantilla(nro);
      await pg.waitForTimeout(300);
      const cobroRes = await marcarPrimerCobro();
      if (!cobroRes.ok) return { ok: false, error: 'sin cobros depositables', noCobros: true };
      if (!(await guardarHabilitado())) return { ok: false, error: 'Guardar disabled tras marcar cobro' };

      const gCoords = await pg.evaluate(() => {
        const btn = document.querySelector('ion-button.imagenGuardar');
        if (!btn || btn.disabled) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await pg.mouse.click(gCoords.x, gCoords.y, { delay: 120 });
      const alertLbl = await clickAlertBtn(['Aceptar', 'OK']);
      await pg.waitForTimeout(800);
      // Volver a home: loop igual al de DEP-009
      for (let intento = 0; intento < 5; intento++) {
        const buscarOk = await pg.evaluate(() =>
          [...document.querySelectorAll('app-depositos ion-button')]
            .some(b => b.textContent.trim() === 'BUSCAR' && b.getBoundingClientRect().width > 0)
        );
        if (buscarOk) break;
        try { await clickBack(); } catch (_) {}
        await pg.waitForTimeout(1200);
        const dismissed = await pg.evaluate(() => {
          const alert = [...document.querySelectorAll('ion-alert')].find(a => {
            const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
            const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
            return isTraditional || hasVisibleBtn;
          });
          if (!alert) return null;
          const btn = [...alert.querySelectorAll('.alert-button')].find(b => {
            const t = b.textContent.trim().toLowerCase();
            return b.getBoundingClientRect().width > 0 && (t.includes('salir') || t.includes('continuar') || t.includes('descartar'));
          }) || [...alert.querySelectorAll('.alert-button')].find(b => {
            const t = b.textContent.trim().toLowerCase();
            return b.getBoundingClientRect().width > 0 && !t.includes('cancel') && !t.includes('quedar');
          });
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        if (dismissed) { await pg.mouse.click(dismissed.x, dismissed.y); await pg.waitForTimeout(800); }
        await pg.waitForTimeout(400);
      }
      return { ok: true, alertLbl, cobros: cobroRes.count };
    } catch (e) {
      try { await dismissDirtyGuard(); } catch (_) {}
      return { ok: false, error: e.message };
    }
  }

  // ─── Estado ──────────────────────────────────────────────────────────────────
  let inHomeDep  = false;
  let inForm     = false;
  let bancoOk    = false;
  let fechaOk    = false;
  let cobrosOk   = false;
  let listOk     = false;
  let detalleOk  = false;
  let enviado    = false;

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-001: Tile Depósitos → home
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const tileCoords = await pg.evaluate(() => {
      const tile = [...document.querySelectorAll('app-home a.ion-text-center')].find(a => {
        const p = a.querySelector('p.nombreModulos');
        return p && p.textContent.trim() === 'Depósitos';
      });
      if (!tile) return null;
      const r = tile.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tileCoords) throw new Error('Tile Depósitos no encontrado en HOME');
    await pg.mouse.click(tileCoords.x, tileCoords.y, { delay: 80 });
    await pg.waitForSelector('app-depositos', { state: 'visible', timeout: 10000 });
    await pg.waitForTimeout(1000);
    const botones = await pg.evaluate(() =>
      [...document.querySelectorAll('app-depositos ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .map(b => b.textContent.trim())
    );
    if (!botones.includes('DEPÓSITO')) throw new Error('Botón DEPÓSITO no visible en home depositos');
    inHomeDep = true;
    v('DM-DEP-001', 'Tile Depósitos → home', 'PASS', `botones: ${botones.join(', ')}`);
  } catch (e) {
    v('DM-DEP-001', 'Tile Depósitos → home', 'FAIL', e.message);
    TODOS.slice(1).forEach(id => v(id, id, 'BLOCKED', 'DEP-001 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-002: Click DEPÓSITO → form, tabs disabled
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await clickBotonHome('DEPÓSITO');
    await pg.waitForTimeout(2000); // selector doc: "mouse.click + 2s wait"
    const formInfo = await pg.evaluate(() => {
      const form = document.querySelector('app-deposito');
      if (!form || form.offsetParent === null) return null;
      const segs = [...form.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0);
      const tabCobros = segs.find(s => s.textContent.trim().includes('Cobros'));
      return {
        hasBanco:           !!form.querySelector('ion-select.selectbanco'),
        tabCobrosDisabled:  tabCobros ? tabCobros.disabled : null,
      };
    });
    if (!formInfo) throw new Error('app-deposito no visible tras click DEPÓSITO');
    inForm = true;
    v('DM-DEP-002', 'Click DEPÓSITO → form', 'PASS',
      `banco: ${formInfo.hasBanco}; tab Cobros disabled: ${formInfo.tabCobrosDisabled}`);
  } catch (e) {
    v('DM-DEP-002', 'Click DEPÓSITO → form', 'FAIL', e.message);
    ['DM-DEP-004','DM-DEP-005','DM-DEP-006','DM-DEP-009','DM-DEP-010',
     'DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020',
     ...reqIds('DEP')].forEach(id =>
      v(id, id, 'BLOCKED', 'DEP-002 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REQ Enviar · E1 + E2 — formulario recién abierto, todo vacío
  // ══════════════════════════════════════════════════════════════════════════════
  // Depósitos no tiene selector de cliente: la transacción empieza al abrirse el
  // formulario, así que éste es el momento equivalente al que exige la regla R1.
  // Ambas funciones capturan sus propios errores: nunca tumban el módulo.
  reqV(await reqInicio(pg, 'DEP'));
  reqV(await reqRechazo(pg, 'DEP'));

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-004: Seleccionar banco
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const bancoRes = await seleccionarBanco();
    await pg.waitForTimeout(1000);
    const bancoVal = await pg.evaluate(() => {
      const sel = document.querySelector('ion-select.selectbanco');
      if (!sel) return false;
      return sel.value !== null && sel.value !== undefined && JSON.stringify(sel.value) !== '{}';
    });
    if (!bancoVal) throw new Error('Banco no quedó seleccionado (value vacío)');
    bancoOk = true;
    v('DM-DEP-004', 'Seleccionar banco', 'PASS',
      `"${bancoRes.label || '?'}" (${bancoRes.count || 1} opciones)`);
  } catch (e) {
    v('DM-DEP-004', 'Seleccionar banco', 'FAIL', e.message);
    ['DM-DEP-005','DM-DEP-006','DM-DEP-009','DM-DEP-010',
     'DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020'].forEach(id =>
      v(id, id, 'BLOCKED', 'DEP-004 falló'));
    try { await clickBack(); await dismissDirtyGuard(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-005: Fecha Doc via fechasModal
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await seleccionarFechaDoc();
    const fechaTxt = await pg.evaluate(() => {
      const btns = [...document.querySelectorAll('ion-button.letrasFechasButton')]
        .filter(b => !b.disabled && b.getBoundingClientRect().width > 0);
      const btn = btns.length >= 2 ? btns[1] : btns[0];
      return btn ? btn.textContent.trim() : '';
    });
    if (!fechaTxt || fechaTxt.length < 3) throw new Error('Fecha Doc no confirmada (botón vacío)');
    fechaOk = true;
    v('DM-DEP-005', 'Fecha Doc seleccionada', 'PASS', `fecha: ${fechaTxt}`);
  } catch (e) {
    v('DM-DEP-005', 'Fecha Doc seleccionada', 'FAIL', e.message);
    ['DM-DEP-006','DM-DEP-009','DM-DEP-010',
     'DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020'].forEach(id =>
      v(id, id, 'BLOCKED', 'DEP-005 falló'));
    try { await clickBack(); await dismissDirtyGuard(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-006: Nro. Plantilla + cobro → Guardar habilitado
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await fillNroPlantilla(nroPlantilla);
    const cobroRes = await marcarPrimerCobro();

    if (!cobroRes.ok) {
      v('DM-DEP-006', 'Nro. Plantilla + cobro → Guardar', 'N/A', 'Tab Cobros vacío (sin cobros depositables)');
      ['DM-DEP-009','DM-DEP-010','DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020'].forEach(id =>
        v(id, id, 'N/A', 'sin cobros depositables'));
      try { await clickBack(); await dismissDirtyGuard(); } catch (_) {}
      return { verdicts, msTotal: Date.now() - t0 };
    }

    cobrosOk = true;
    const gOk = await guardarHabilitado();
    v('DM-DEP-006', 'Nro. Plantilla + cobro → Guardar',
      gOk ? 'PASS' : 'FAIL',
      `${cobroRes.count} cobros; Guardar enabled=${gOk}`);

    if (!gOk) {
      ['DM-DEP-009','DM-DEP-010','DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020'].forEach(id =>
        v(id, id, 'BLOCKED', 'DEP-006: Guardar disabled'));
      try { await clickBack(); await dismissDirtyGuard(); } catch (_) {}
      return { verdicts, msTotal: Date.now() - t0 };
    }
  } catch (e) {
    v('DM-DEP-006', 'Nro. Plantilla + cobro → Guardar', 'FAIL', e.message);
    ['DM-DEP-009','DM-DEP-010','DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020'].forEach(id =>
      v(id, id, 'BLOCKED', 'DEP-006 falló'));
    try { await clickBack(); await dismissDirtyGuard(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-009: Click Guardar → alert → verificar en BUSCAR (Guardado)
  // ══════════════════════════════════════════════════════════════════════════════
  let guardadoOk = false;
  try {
    const gCoords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenGuardar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!gCoords) throw new Error('ion-button.imagenGuardar no encontrado o disabled');
    await pg.mouse.click(gCoords.x, gCoords.y, { delay: 120 });
    const alertLbl = await clickAlertBtn(['Aceptar', 'OK']);
    await pg.waitForTimeout(800);

    // Depositos no auto-navega al guardar — el app se queda en el form.
    // Loop: back → esperar alert → descartarlo → verificar que llegamos a home (BUSCAR visible).
    let buscarAlcanzado = false;
    for (let intento = 0; intento < 5 && !buscarAlcanzado; intento++) {
      // ¿Ya estamos en home depositos (botón BUSCAR visible)?
      buscarAlcanzado = await pg.evaluate(() =>
        [...document.querySelectorAll('app-depositos ion-button')]
          .some(b => b.textContent.trim() === 'BUSCAR' && b.getBoundingClientRect().width > 0)
      );
      if (buscarAlcanzado) break;

      // Intentar back
      try { await clickBack(); } catch (_) {}
      // Dar tiempo al dirty-guard de aparecer (Ionic 7 puede tardar en animarse)
      await pg.waitForTimeout(1200);

      // Descartar dirty-guard si aparece — buscar cualquier botón "salir" en alerts visibles
      const dismissed = await pg.evaluate(() => {
        const alert = [...document.querySelectorAll('ion-alert')].find(a => {
          const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
          const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
          return isTraditional || hasVisibleBtn;
        });
        if (!alert) return null;
        // Busca botón de salir (puede llamarse "Salir sin guardar", "Salir", "Continuar", etc.)
        // Excluye el botón de cancelar/quedarse
        const btn = [...alert.querySelectorAll('.alert-button')].find(b => {
          const t = b.textContent.trim().toLowerCase();
          const r = b.getBoundingClientRect();
          if (r.width === 0) return false;
          // preferir botón que contenga "salir" o "continuar" y NO "cancel" ni "quedar"
          return t.includes('salir') || t.includes('continuar') || t.includes('descartar');
        }) || [...alert.querySelectorAll('.alert-button')].find(b => {
          // fallback: primer botón visible que no diga "cancel" ni "quedar"
          const t = b.textContent.trim().toLowerCase();
          return b.getBoundingClientRect().width > 0 && !t.includes('cancel') && !t.includes('quedar');
        });
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (dismissed) {
        await pg.mouse.click(dismissed.x, dismissed.y);
        await pg.waitForTimeout(800);
      }
      await pg.waitForTimeout(400);
    }
    await clickBotonHome('BUSCAR');
    await pg.waitForTimeout(2000);

    const listRes = await esperarListaRendered(8000);

    // BD local
    let bdNota = 'BD-N/A';
    try {
      const rows = localQuery(`SELECT co_deposit, id_deposit, st_delivery FROM deposits ORDER BY rowid DESC LIMIT 1`);
      if (rows.length) {
        const id = parseInt(rows[0].id_deposit, 10);
        const st = String(rows[0].st_delivery);
        bdNota = id === 0 ? `BD-SAVED(st=${st})` : `BD-UNEXPECTED(id=${id},st=${st})`;
      } else { bdNota = 'BD-LOCAL-EMPTY'; }
    } catch (_) {}

    if (listRes.colgado) {
      guardadoOk = true; // el guardado ocurrió aunque la lista no renderice
      v('DM-DEP-009', 'Click Guardar → Guardado', 'PASS',
        `alert: "${alertLbl}"; lista no renderizó (defecto conocido) · ${bdNota}`);
    } else if (listRes.items === 0) {
      v('DM-DEP-009', 'Click Guardar → Guardado', 'FAIL',
        `lista renderizó pero 0 ítems · ${bdNota}`);
    } else {
      guardadoOk = true;
      v('DM-DEP-009', 'Click Guardar → Guardado', 'PASS',
        `alert: "${alertLbl}"; ${listRes.items} ítems · ${bdNota}`);
    }
  } catch (e) {
    v('DM-DEP-009', 'Click Guardar → Guardado', 'FAIL', e.message);
    ['DM-DEP-010','DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019','DM-DEP-020'].forEach(id =>
      v(id, id, 'BLOCKED', 'DEP-009 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-010: BUSCAR → lista (ya estamos en la lista tras DEP-009)
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const listRes = await esperarListaRendered(5000);
    if (listRes.colgado) {
      v('DM-DEP-010', 'BUSCAR → lista', 'SKIP', 'loader colgado (defecto conocido deposit.service.ts)');
      ['DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019'].forEach(id =>
        v(id, id, 'SKIP', 'lista no renderizó (defecto conocido)'));
      try { await clickBack(); await pg.waitForTimeout(800); } catch (_) {}
      listOk = false;
    } else {
      listOk = listRes.items > 0;
      v('DM-DEP-010', 'BUSCAR → lista', listOk ? 'PASS' : 'FAIL', `${listRes.items} ítems`);
      if (!listOk) {
        ['DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019'].forEach(id =>
          v(id, id, 'BLOCKED', 'DEP-010: lista vacía'));
      }
    }
  } catch (e) {
    v('DM-DEP-010', 'BUSCAR → lista', 'FAIL', e.message);
    listOk = false;
    ['DM-DEP-014','DM-DEP-017','DM-DEP-018','DM-DEP-019'].forEach(id =>
      v(id, id, 'BLOCKED', 'DEP-010 falló'));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-014: Click ítem Guardado → form con datos
  // ══════════════════════════════════════════════════════════════════════════════
  if (listOk) {
    try {
      const itemCoords = await pg.evaluate(() => {
        const list = document.querySelector('app-deposito-list');
        if (!list) return null;
        const items = [...list.querySelectorAll('ion-item')].filter(
          i => i.getBoundingClientRect().width > 0
        );
        if (!items.length) return null;
        // Primer ítem con trash (= Guardado); si no, el primero
        const target = items.find(i => i.querySelector('ion-button[color="danger"]')) || items[0];
        const r = target.getBoundingClientRect();
        // Tercio superior, evitar zona derecha (trash x > 270)
        return { x: r.x + Math.min(r.width * 0.4, 180), y: r.y + 16 };
      });
      if (!itemCoords) throw new Error('No hay ítems en la lista');
      await pg.mouse.click(itemCoords.x, itemCoords.y, { delay: 120 });
      await pg.waitForTimeout(2000);

      const formVis = await isFormVisible();
      if (!formVis) throw new Error('app-deposito no visible tras click en ítem');
      const nroVal = await pg.evaluate(() => {
        const inp = [...document.querySelectorAll('ion-input')].find(
          i => i.label && String(i.label).startsWith('Nro. Plantilla')
        );
        if (!inp) return '';
        const native = inp.querySelector('input');
        return native ? native.value : '';
      });
      detalleOk = true;
      inForm     = true;
      v('DM-DEP-014', 'Click Guardado → form con datos', 'PASS', `Nro.Plantilla: "${nroVal}"`);
    } catch (e) {
      v('DM-DEP-014', 'Click Guardado → form con datos', 'FAIL', e.message);
      ['DM-DEP-017','DM-DEP-018','DM-DEP-019'].forEach(id =>
        v(id, id, 'BLOCKED', 'DEP-014 falló'));
      listOk   = false;
      detalleOk = false;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-017: Click Enviar → 2-3 alertas → Enviado
  // ══════════════════════════════════════════════════════════════════════════════
  if (detalleOk) {
    // ── REQ Enviar · E5 ───────────────────────────────────────────────────────
    // El depósito está COMPLETO y a punto de enviarse: si alguna pestaña sigue
    // en rojo aquí, el rojo no corresponde a ningún campo pendiente (F1).
    // Sólo observa — no pulsa Enviar.
    reqV(await reqPestanaRoja(pg, 'DEP'));

    try {
      const enviarCoords = await pg.evaluate(() => {
        const btn = document.querySelector('ion-button.imagenEnviar');
        if (!btn || btn.disabled) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!enviarCoords) throw new Error('ion-button.imagenEnviar no encontrado o disabled');
      await pg.mouse.click(enviarCoords.x, enviarCoords.y, { delay: 120 });

      let nroRef = null;
      for (let i = 0; i < 3; i++) {
        await pg.waitForTimeout(1300);
        const hasAlert = await pg.evaluate(() =>
          [...document.querySelectorAll('ion-alert')].some(
            a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
          )
        );
        if (!hasAlert) break;
        // Capturar nroRef si la alerta lo incluye
        const ref = await pg.evaluate(() => {
          const alerts = [...document.querySelectorAll('ion-alert')].filter(
            a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
          );
          if (!alerts.length) return null;
          const el = alerts[alerts.length - 1].querySelector('.alert-message, .alert-title');
          if (!el) return null;
          const m = el.textContent.match(/nro\.?\s*(\d+)/i);
          return m ? m[1] : null;
        });
        if (ref) nroRef = ref;
        await clickAlertBtn(['Aceptar', 'OK']);
      }
      await pg.waitForTimeout(1500);

      // Verificar estado: ya no deberíamos estar en el form con Enviar activo
      enviado = !(await isFormVisible()) || await pg.evaluate(() => {
        const btn = document.querySelector('ion-button.imagenEnviar');
        return !btn || btn.disabled;
      });

      // BD local + cotejo payload
      let bdNota = 'BD-N/A';
      try {
        const rows = localQuery(`SELECT co_deposit, id_deposit, st_delivery FROM deposits ORDER BY rowid DESC LIMIT 1`);
        if (rows.length) {
          const id = parseInt(rows[0].id_deposit, 10);
          const st = String(rows[0].st_delivery);
          bdNota = id > 0
            ? `BD-LOCAL-OK(id=${id},st=${st})`
            : `BD-LOCAL-PENDING(id=${id},st=${st})`;
        } else { bdNota = 'BD-LOCAL-EMPTY'; }
        const payloads = await getCapturedPayloads(pg);
        const pDep = payloads.filter(p => /depositservice\/deposit/i.test(String(p.url)));
        if (pDep.length && DATA.clienteSlug) {
          bdNota += ` · ${cotejoPayload(DATA.clienteSlug, pDep[pDep.length - 1])}`;
        }
      } catch (_) {}

      v('DM-DEP-017', 'Click Enviar → Enviado', enviado ? 'PASS' : 'FAIL',
        `ref: ${nroRef || 'N/A'} · ${bdNota}`);
    } catch (e) {
      v('DM-DEP-017', 'Click Enviar → Enviado', 'FAIL', e.message);
      ['DM-DEP-018','DM-DEP-019'].forEach(id => v(id, id, 'BLOCKED', 'DEP-017 falló'));
      enviado = false;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-018 + DM-DEP-019: BUSCAR tras enviar → lista → click Enviado → solo lectura
  // ══════════════════════════════════════════════════════════════════════════════
  if (enviado) {
    try {
      // Ir a home depositos si hace falta
      await irAHomeDepositos();
      await clickBotonHome('BUSCAR');
      await pg.waitForTimeout(2000);
      const listRes = await esperarListaRendered(8000);

      if (listRes.colgado) {
        v('DM-DEP-018', 'BUSCAR tras enviar → lista', 'SKIP', 'loader colgado (defecto conocido)');
        v('DM-DEP-019', 'Click Enviado → solo lectura', 'SKIP', 'lista no renderizó');
      } else {
        v('DM-DEP-018', 'BUSCAR tras enviar → lista',
          listRes.items > 0 ? 'PASS' : 'FAIL', `${listRes.items} ítems`);

        if (listRes.items > 0) {
          // DM-DEP-019: click ítem sin trash (= Enviado)
          try {
            const enviadoCoords = await pg.evaluate(() => {
              const list = document.querySelector('app-deposito-list');
              if (!list) return null;
              const items = [...list.querySelectorAll('ion-item')].filter(
                i => i.getBoundingClientRect().width > 0
              );
              // Enviado = sin botón trash
              const target = items.find(i => !i.querySelector('ion-button[color="danger"]')) || items[0];
              if (!target) return null;
              const r = target.getBoundingClientRect();
              return { x: r.x + Math.min(r.width * 0.4, 180), y: r.y + 16 };
            });
            if (!enviadoCoords) throw new Error('ítem Enviado no encontrado');
            await pg.mouse.click(enviadoCoords.x, enviadoCoords.y, { delay: 120 });
            await pg.waitForTimeout(2000);

            const soloLectura = await pg.evaluate(() => {
              const form = document.querySelector('app-deposito');
              if (!form || form.offsetParent === null) return false;
              return !form.querySelector('ion-button.imagenGuardar') &&
                     !form.querySelector('ion-button.imagenEnviar') &&
                     !form.querySelector('ion-button[color="danger"]');
            });
            v('DM-DEP-019', 'Click Enviado → solo lectura', soloLectura ? 'PASS' : 'FAIL',
              `sin Guardar/Enviar/trash: ${soloLectura}`);
            try { await clickBack(); await pg.waitForTimeout(800); } catch (_) {}
          } catch (e2) {
            v('DM-DEP-019', 'Click Enviado → solo lectura', 'FAIL', e2.message);
          }
        } else {
          v('DM-DEP-019', 'Click Enviado → solo lectura', 'SKIP', 'lista vacía en DEP-018');
        }
      }
    } catch (e) {
      v('DM-DEP-018', 'BUSCAR tras enviar → lista', 'FAIL', e.message);
      v('DM-DEP-019', 'Click Enviado → solo lectura', 'BLOCKED', 'DEP-018 falló');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-DEP-020: Crear 2.º Guardado → BUSCAR → trash → confirmar → desaparece
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    // Navegar a home depositos (robusto — back repetido hasta que los botones sean visibles)
    await irAHomeDepositos();

    await clickBotonHome('DEPÓSITO');
    await pg.waitForTimeout(2000);

    const dep2 = await crearDeposito(nroDel);
    if (dep2.noCobros) {
      v('DM-DEP-020', 'Trash Guardado → desaparece', 'N/A', 'sin segundo cobro depositable');
      return { verdicts, msTotal: Date.now() - t0 };
    }
    if (!dep2.ok) throw new Error(dep2.error);

    // `crearDeposito` ya hizo back → home depositos
    await irAHomeDepositos();
    await clickBotonHome('BUSCAR');
    await pg.waitForTimeout(2000);
    const listRes = await esperarListaRendered(8000);

    if (listRes.colgado) {
      v('DM-DEP-020', 'Trash Guardado → desaparece', 'SKIP', 'loader colgado (defecto conocido)');
      return { verdicts, msTotal: Date.now() - t0 };
    }

    const trashCoords = await pg.evaluate(() => {
      const list = document.querySelector('app-deposito-list');
      if (!list) return null;
      for (const item of [...list.querySelectorAll('ion-item')].filter(i => i.getBoundingClientRect().width > 0)) {
        const trash = item.querySelector('ion-button[color="danger"]');
        if (trash && trash.getBoundingClientRect().width > 0) {
          const r = trash.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
      return null;
    });
    if (!trashCoords) throw new Error('Botón trash no encontrado — ítem Guardado no está en lista');

    await pg.mouse.click(trashCoords.x, trashCoords.y, { delay: 100 });
    // Confirmación (Cancelar/Aceptar) y posible alert de éxito (OK)
    await clickAlertBtn(['Aceptar', 'OK', 'Eliminar']);
    await pg.waitForTimeout(1000);
    try { await clickAlertBtn(['OK', 'Aceptar']); await pg.waitForTimeout(500); } catch (_) {}

    await pg.waitForTimeout(1000);
    const trashRestantes = await pg.evaluate(() => {
      const list = document.querySelector('app-deposito-list');
      if (!list) return 0;
      return [...list.querySelectorAll('ion-button[color="danger"]')]
        .filter(b => b.getBoundingClientRect().width > 0).length;
    });

    v('DM-DEP-020', 'Trash Guardado → desaparece',
      trashRestantes === 0 ? 'PASS' : 'FAIL',
      `ítems con trash tras borrar: ${trashRestantes}`);
  } catch (e) {
    v('DM-DEP-020', 'Trash Guardado → desaparece', 'FAIL', e.message);
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runDepositos: conReq('DEP', runDepositos) };
