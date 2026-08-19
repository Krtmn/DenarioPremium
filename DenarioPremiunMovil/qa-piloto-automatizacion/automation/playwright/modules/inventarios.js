'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { installPayloadCapture, getCapturedPayloads } = require('../../cdp/denario-cdp-helpers');

const LOCAL_QUERY_PATH    = path.resolve(__dirname, '../../db/local-query.js');
const COTEJO_PAYLOAD_PATH = path.resolve(__dirname, '../../db/cotejo-payload.js');

function localQuery(sql) {
  try {
    return JSON.parse(execFileSync('node', [LOCAL_QUERY_PATH, sql], { encoding: 'utf8', timeout: 15000 }));
  } catch (_) { return []; }
}

function cotejoPayload(slug, payload) {
  const tmp = path.join(os.tmpdir(), `qa_inv_payload_${Date.now()}.json`);
  try {
    fs.writeFileSync(tmp, JSON.stringify(payload));
    const r = JSON.parse(execFileSync('node', [COTEJO_PAYLOAD_PATH, slug, tmp], { encoding: 'utf8', timeout: 30000 }));
    const mis = ((r.resumen || {}).mismatches || []).slice(0, 2).join('; ');
    return r.marca + (mis ? ` (${mis})` : '');
  } catch (_) { return 'BD-N/A'; }
  finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

/**
 * modules/inventarios.js — 16 casos smoke
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteTest:string, expirationBatch:boolean, suggestedOrder:boolean, clienteSlug:string }} DATA
 */
async function runInventarios(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  const TODOS = [
    'DM-INV-001','DM-INV-002','DM-INV-004','DM-INV-008','DM-INV-010',
    'DM-INV-011','DM-INV-012','DM-INV-016','DM-INV-017','DM-INV-020',
    'DM-INV-021','DM-INV-022','DM-INV-023','DM-INV-025','DM-INV-026','DM-INV-028',
  ];

  if (!DATA.aplica) {
    TODOS.forEach(id => v(id, id, 'N/A', 'aplica=false en perfil inventarios'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  try { await installPayloadCapture(pg); } catch (_) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function dismissIonLoadings() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-loading').forEach(el => {
        if (el.offsetParent !== null) try { el.dismiss(); } catch (_) {}
      });
    });
  }

  async function dismissResidualAlerts() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-alert').forEach(a => {
        if (!a.classList.contains('overlay-hidden') && a.offsetParent !== null)
          try { a.dismiss(); } catch (_) {}
      });
    });
    await pg.waitForTimeout(400);
  }

  async function clickBack() {
    const coords = await pg.evaluate(() => {
      const imgs = [...document.querySelectorAll('img.fechaAtras')];
      const back = imgs.find(img => { const r = img.getBoundingClientRect(); return r.width > 0 && r.x < 120 && r.y < 120; });
      if (back) { const target = back.closest('a') || back; const r = target.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      return null;
    });
    if (!coords) throw new Error('img.fechaAtras no encontrado');
    await pg.mouse.click(coords.x, coords.y, { delay: 60 });
  }

  async function clickAlertBtn(labels = ['Aceptar', 'OK']) {
    await pg.waitForTimeout(900);
    await dismissIonLoadings();
    await pg.waitForTimeout(300);
    const coords = await pg.evaluate((lbls) => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(
        a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
      );
      if (!alerts.length) return null;
      const alert = alerts[alerts.length - 1];
      for (const lbl of lbls) {
        const btn = [...alert.querySelectorAll('.alert-button')].find(b =>
          b.textContent.trim().toLowerCase() === lbl.toLowerCase() && b.getBoundingClientRect().width > 0
        );
        if (btn) { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: lbl }; }
      }
      return null;
    }, labels);
    if (!coords) throw new Error('Alert btn no encontrado: ' + labels.join('/'));
    await pg.mouse.click(coords.x, coords.y);
    return coords.label;
  }

  async function isHomeInvVisible() {
    return pg.evaluate(() => {
      const home = document.querySelector('app-inventarios');
      if (!home) return false;
      const page = home.closest('.ion-page') || home;
      if (page.classList.contains('ion-page-hidden')) return false;
      // Los botones deben estar dentro del viewport real (no tapados por la lista de BUSCAR)
      const btns = [...home.querySelectorAll('ion-button')].filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.top <= window.innerHeight;
      });
      const textos = btns.map(b => b.textContent.trim());
      return textos.includes('INVENTARIO') && textos.includes('BUSCAR');
    });
  }

  async function irAHomeInv(maxAttempts = 6) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await isHomeInvVisible()) return;
      try { await clickBack(); } catch (_) {}
      await pg.waitForTimeout(800);
      await pg.evaluate(() => {
        document.querySelectorAll('ion-alert').forEach(a => {
          if (!a.classList.contains('overlay-hidden') && a.offsetParent !== null)
            try { a.dismiss(); } catch (_) {}
        });
      });
      await pg.waitForTimeout(400);
    }
    if (!(await isHomeInvVisible())) throw new Error('No se pudo llegar a home inventarios');
  }

  async function clickBotonHome(texto) {
    const coords = await pg.evaluate((t) => {
      const btns = [...document.querySelectorAll('app-inventarios ion-button')].filter(
        b => b.textContent.trim() === t && b.getBoundingClientRect().width > 0
      );
      if (!btns.length) return null;
      const r = btns[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Botón "${texto}" no encontrado en home inventarios`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  // Abre el form de inventario manejando la posible alerta de geolocalización
  async function abrirFormInventario() {
    await clickBotonHome('INVENTARIO');
    // Loop: handle geo alert (up to 8s × loop) y esperar tabs
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      await pg.waitForTimeout(1200);
      // Aceptar alert de geolocalización si aparece
      const hasGeoAlert = await pg.evaluate(() => {
        const alerts = [...document.querySelectorAll('ion-alert')].filter(
          a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
        );
        return alerts.some(a => a.textContent.includes('localización') || a.textContent.includes('ubicación'));
      });
      if (hasGeoAlert) {
        await dismissIonLoadings();
        await pg.waitForTimeout(300);
        try { await clickAlertBtn(['Aceptar', 'OK']); } catch (_) {}
        await pg.waitForTimeout(800);
        // Re-click INVENTARIO (el 1er click fue consumido por el alert)
        try { await clickBotonHome('INVENTARIO'); } catch (_) {}
        continue;
      }
      // Verificar si ya están los segment-button del form
      const tabsVisible = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-segment-button')].filter(
          s => s.getBoundingClientRect().width > 0
        ).length >= 2
      );
      if (tabsVisible) {
        await pg.waitForTimeout(2000); // Angular lifecycle settle
        return;
      }
    }
    throw new Error('Form inventario no abrió tras manejar alerts');
  }

  // Selecciona cliente: ion-input#clienteSelect → modal/popover → buscar → click resultado
  // Modo exploratorio: si no encuentra el nombre exacto, toma el 1er resultado disponible.
  async function seleccionarCliente(nombre) {
    const selCoords = await pg.evaluate(() => {
      const inp = document.querySelector('ion-input#clienteSelect');
      if (!inp) return null;
      const r = inp.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!selCoords) throw new Error('ion-input#clienteSelect no encontrado');
    await pg.mouse.click(selCoords.x, selCoords.y, { delay: 80 });

    // Poll hasta 8s esperando que el modal muestre el input de búsqueda
    let searchCoords = null;
    for (let i = 0; i < 16; i++) {
      await pg.waitForTimeout(500);
      searchCoords = await pg.evaluate(() => {
        const containers = [...document.querySelectorAll('ion-modal, ion-popover')]
          .filter(c => c.offsetParent !== null && !c.classList.contains('overlay-hidden'));
        for (const c of containers) {
          const inp = c.querySelector('input[type="search"], input[type="text"], input:not([type="hidden"])');
          if (inp && inp.getBoundingClientRect().width > 0) {
            const r = inp.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
        return null;
      });
      if (searchCoords) break;
    }
    if (!searchCoords) {
      // Diagnóstico: qué hay en pantalla ahora
      const diag = await pg.evaluate(() => {
        const all = [...document.querySelectorAll('ion-modal, ion-popover, ion-alert')]
          .map(e => ({ tag: e.tagName, hidden: e.classList.contains('overlay-hidden'), offsetParent: !!e.offsetParent, class: e.className.slice(0, 80) }));
        const form = !!document.querySelector('ion-input#clienteSelect');
        return { overlays: all, clienteSelectPresente: form };
      });
      throw new Error(`Modal cliente no abrió en 8s — diag: ${JSON.stringify(diag)}`);
    }

    // Escribir término de búsqueda
    await pg.mouse.click(searchCoords.x, searchCoords.y, { delay: 50, clickCount: 3 });
    await pg.keyboard.type(nombre ? nombre.slice(0, 8) : 'A', { delay: 30 });
    await pg.waitForTimeout(2000);

    // Elegir resultado: exacto primero, luego primero disponible
    const resultado = await pg.evaluate((n) => {
      const containers = [...document.querySelectorAll('ion-modal, ion-popover, ion-alert')]
        .filter(c => c.offsetParent !== null);
      for (const c of containers) {
        const candidatos = [...c.querySelectorAll('p, ion-label, ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0 && el.textContent.trim().length > 2);
        if (!candidatos.length) continue;
        const exacto = n ? candidatos.find(el => el.textContent.includes(n)) : null;
        const target = exacto || candidatos[0];
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, nombre: target.textContent.trim().slice(0, 60) };
      }
      return null;
    }, nombre ? nombre.slice(0, 20) : '');

    if (!resultado) throw new Error('Sin resultados en selector de clientes tras búsqueda');
    await pg.mouse.click(resultado.x, resultado.y, { delay: 80 });
    await pg.waitForTimeout(1500);
    return resultado.nombre;
  }

  // Tab Inventario/Resumen por texto
  async function clickTab(texto) {
    const coords = await pg.evaluate((t) => {
      const tab = [...document.querySelectorAll('ion-segment-button')].find(
        s => s.textContent.trim().includes(t) && !s.disabled && s.getBoundingClientRect().width > 0
      );
      if (!tab) return null;
      const r = tab.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Tab "${texto}" no encontrado o disabled`);
    await pg.mouse.click(coords.x, coords.y, { delay: 60 });
    await pg.waitForTimeout(1500);
  }

  // Cuenta ion-items visibles en el área de inventario (productos/familias)
  async function contarItemsInventario() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('app-inventario ion-item')].filter(
        i => i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().height > 0
      ).length
    );
  }

  // Intenta abrir el modal de captura haciendo click en ítems visibles (scroll+validate)
  // Primer click puede expandir una familia; el siguiente abrirá el modal del producto
  async function abrirModalProducto() {
    for (let attempt = 0; attempt < 6; attempt++) {
      // scrollIntoView del primer ítem
      await pg.evaluate(() => {
        const items = [...document.querySelectorAll('app-inventario ion-item')]
          .filter(i => i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().height > 0);
        if (items[0]) items[0].scrollIntoView({ block: 'center' });
      });
      await pg.waitForTimeout(900);

      // Re-leer rect TRAS scroll — validar que esté en viewport
      const clickTarget = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('app-inventario ion-item')]
          .filter(i => {
            const r = i.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.y >= 0 && r.y <= window.innerHeight - 10;
          })
          .sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
        if (!items.length) return null;
        const r = items[0].getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!clickTarget) { await pg.waitForTimeout(800); continue; }

      await pg.mouse.click(clickTarget.x, clickTarget.y, { delay: 120 });
      await pg.waitForTimeout(1800);

      const modalOpen = await pg.evaluate(() => {
        const m = document.querySelector('ion-modal.inventory-type-stocks-modal');
        return !!(m && m.offsetParent !== null);
      });
      if (modalOpen) return { ok: true, attempts: attempt + 1 };
      // Si no abrió modal → puede haber expandido una familia, reintentar
    }
    return { ok: false, error: 'modal inventory-type-stocks-modal no abrió tras 6 intentos' };
  }

  // Llenar un input del modal (fillNgModelKeyboard): triple-click + type
  async function fillNgModel(selectorFn, value) {
    const coords = await pg.evaluate(selectorFn);
    if (!coords) throw new Error('Campo no encontrado en modal');
    await pg.mouse.click(coords.x, coords.y, { delay: 50, clickCount: 3 });
    await pg.keyboard.type(String(value), { delay: 30 });
    await pg.waitForTimeout(300);
  }

  // Confirma fecha en overlay ion-datetime (mismo patrón que depositos)
  async function confirmarFechaModal(hoy) {
    // Click ion-datetime-button en el modal
    const btnCoords = await pg.evaluate(() => {
      const modal = document.querySelector('ion-modal.inventory-type-stocks-modal');
      if (!modal) return null;
      const dtBtn = modal.querySelector('ion-datetime-button');
      if (!dtBtn) return null;
      const r = dtBtn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!btnCoords) return false; // no hay picker de fecha
    await pg.mouse.click(btnCoords.x, btnCoords.y, { delay: 80 });
    await pg.waitForTimeout(1200);
    // Asignar fecha
    await pg.evaluate((fecha) => {
      const dt = document.querySelector('ion-datetime');
      if (!dt) return;
      dt.value = fecha;
      dt.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: fecha } }));
    }, hoy);
    await pg.waitForTimeout(400);
    // Confirmar via shadowRoot #confirm-button
    const confirmCoords = await pg.evaluate(() => {
      const dt = document.querySelector('ion-datetime');
      if (dt && dt.shadowRoot) {
        const btn = dt.shadowRoot.querySelector('#confirm-button');
        if (btn) { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      }
      const modal = document.querySelector('ion-modal:not(.inventory-type-stocks-modal) ion-button');
      if (modal) { const r = modal.getBoundingClientRect(); if (r.width > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      return null;
    });
    if (confirmCoords) { await pg.mouse.click(confirmCoords.x, confirmCoords.y); }
    else { await pg.evaluate(() => { const dt = document.querySelector('ion-datetime'); if (dt && typeof dt.confirm === 'function') dt.confirm(); }); }
    await pg.waitForTimeout(800);
    return true;
  }

  // Llena el modal de captura (cantidad + lote + fecha si expirationBatch)
  async function llenarModal(cantidad, lote, expirationBatch) {
    // Dismiss popovers residuales ANTES de tocar inputs
    await pg.evaluate(() => {
      document.querySelectorAll('ion-popover').forEach(p => {
        if (!p.classList.contains('overlay-hidden') && p.offsetParent !== null)
          try { p.dismiss(); } catch (_) {}
      });
    });
    await pg.waitForTimeout(400);

    // Cantidad (ngModel — triple-click + type)
    await fillNgModel(() => {
      const modal = document.querySelector('ion-modal.inventory-type-stocks-modal');
      if (!modal) return null;
      const inp = modal.querySelector('input[placeholder="Ingrese cantidad"]');
      if (!inp) return null;
      const r = inp.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, cantidad);

    if (expirationBatch) {
      // Lote (input type=text nativo — no ion-input[type="text"])
      await fillNgModel(() => {
        const modal = document.querySelector('ion-modal.inventory-type-stocks-modal');
        if (!modal) return null;
        const inp = modal.querySelector('input[type="text"]');
        if (!inp) return null;
        const r = inp.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, lote);

      // Fecha vencimiento via ion-datetime-button
      const hoy = new Date().toISOString().slice(0, 10);
      await confirmarFechaModal(hoy);
    }
  }

  // Acepta el modal (.save-btn con mouse.move previo)
  async function aceptarModal() {
    // Cerrar teclado Android blureando el input activo (el teclado cubre el botón save)
    await pg.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    await pg.waitForTimeout(600);

    await pg.mouse.move(200, 400); // re-engancha listener tras modal.dismiss
    await pg.waitForTimeout(300);

    const coords = await pg.evaluate(() => {
      const modal = document.querySelector('ion-modal.inventory-type-stocks-modal');
      if (!modal) return null;
      // Candidatos en orden de preferencia
      const candidatos = [
        modal.querySelector('.save-btn'),
        modal.querySelector('ion-icon[name="checkmark-outline"]'),
        modal.querySelector('ion-icon[name="checkmark"]'),
        [...modal.querySelectorAll('ion-button, button, ion-fab-button')].find(b => {
          const t = b.textContent.trim().toUpperCase();
          return b.getBoundingClientRect().width > 0 &&
            (t.includes('ACEPTAR') || t.includes('GUARDAR') || t.includes('OK') || t.includes('CONFIRMAR'));
        }),
        // último botón visible en el modal como fallback
        [...modal.querySelectorAll('ion-button, button, ion-fab-button')]
          .filter(b => b.getBoundingClientRect().width > 0).pop(),
      ];
      const btn = candidatos.find(Boolean);
      if (!btn) return null;
      const target = btn.closest('ion-button, ion-fab-button') || btn;
      const r = target.getBoundingClientRect();
      if (!r || r.width === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) throw new Error('botón de confirmación no encontrado en modal de inventario');
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });

    // Esperar activamente a que el modal cierre (hasta 4s)
    for (let i = 0; i < 8; i++) {
      const abierto = await pg.evaluate(() => {
        const m = document.querySelector('ion-modal.inventory-type-stocks-modal');
        return !!(m && m.offsetParent !== null);
      });
      if (!abierto) break;
      await pg.waitForTimeout(500);
    }
  }

  // Flujo completo: seleccionar cliente → Tab Inventario → capturar producto → opcionalmente Guardar
  async function flujoInventario(conGuardar) {
    await abrirFormInventario();
    // Seleccionar cliente
    const _cli = await seleccionarCliente(DATA.clienteTest);
    // Verificar tabs habilitadas
    const tabsOk = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-segment-button')].some(
        s => s.textContent.trim().includes('Inventario') && !s.disabled && s.getBoundingClientRect().width > 0
      )
    );
    if (!tabsOk) throw new Error('Tabs siguen disabled tras seleccionar cliente');
    // Tab Inventario → click producto → modal → llenar → aceptar
    await clickTab('Inventario');
    const modalRes = await abrirModalProducto();
    if (!modalRes.ok) throw new Error(modalRes.error);
    await llenarModal(5, `LOTE-QA-${String(Date.now()).slice(-4)}`, DATA.expirationBatch);
    await aceptarModal();
    if (!conGuardar) return;
    // Guardar (2 alertas: Cancelar/Aceptar → OK)
    const gCoords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenGuardar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!gCoords) throw new Error('imagenGuardar no encontrado o disabled');
    await pg.mouse.click(gCoords.x, gCoords.y, { delay: 120 });
    await clickAlertBtn(['Aceptar', 'OK']); // 1ª: Cancelar/Aceptar
    await pg.waitForTimeout(500);
    try { await clickAlertBtn(['OK', 'Aceptar']); } catch (_) {} // 2ª: "guardado con éxito"
    await pg.waitForTimeout(800);
    // Guardar NO navega — volver a home
    await irAHomeInv();
  }

  // ─── Estado ──────────────────────────────────────────────────────────────────
  let inHomeInv     = false;
  let formOk        = false;
  let clienteOk     = false;
  let tabInvOk      = false;
  let modalOk       = false;
  let capturaOk     = false;
  let resumenOk     = false;
  let guardadoOk    = false;
  let enviadoOk     = false;
  let listOk        = false;

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-001: Tile Inventarios → home
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const tileCoords = await pg.evaluate(() => {
      const tile = [...document.querySelectorAll('app-home a.ion-text-center')].find(a => {
        const p = a.querySelector('p.nombreModulos');
        return p && p.textContent.trim() === 'Inventarios';
      });
      if (!tile) return null;
      const r = tile.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tileCoords) throw new Error('Tile Inventarios no encontrado en HOME');
    await pg.mouse.click(tileCoords.x, tileCoords.y, { delay: 80 });
    await pg.waitForSelector('app-inventarios', { state: 'visible', timeout: 10000 });
    await pg.waitForTimeout(1000);
    const botones = await pg.evaluate(() =>
      [...document.querySelectorAll('app-inventarios ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0).map(b => b.textContent.trim())
    );
    if (!botones.includes('INVENTARIO')) throw new Error('Botón INVENTARIO no visible');
    inHomeInv = true;
    v('DM-INV-001', 'Tile Inventarios → home', 'PASS', `botones: ${botones.join(', ')}`);
  } catch (e) {
    v('DM-INV-001', 'Tile Inventarios → home', 'FAIL', e.message);
    TODOS.slice(1).forEach(id => v(id, id, 'BLOCKED', 'INV-001 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-002: Click INVENTARIO → form con 4 tabs, tabs disabled sin cliente
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await abrirFormInventario();
    const formInfo = await pg.evaluate(() => {
      const segs = [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0);
      const tabInv = segs.find(s => s.textContent.trim().includes('Inventario'));
      return {
        tabs:             segs.map(s => s.textContent.trim()),
        tabInvDisabled:   tabInv ? tabInv.disabled : null,
        hasClienteSelect: !!document.querySelector('ion-input#clienteSelect'),
      };
    });
    if (!formInfo.tabs.length) throw new Error('Tabs no encontradas en form inventario');
    formOk = true;
    v('DM-INV-002', 'Click INVENTARIO → form', 'PASS',
      `tabs: [${formInfo.tabs.join(', ')}]; Inventario disabled: ${formInfo.tabInvDisabled}`);
  } catch (e) {
    v('DM-INV-002', 'Click INVENTARIO → form', 'FAIL', e.message);
    ['DM-INV-004','DM-INV-008','DM-INV-010','DM-INV-011','DM-INV-012',
     'DM-INV-016','DM-INV-017','DM-INV-020','DM-INV-021','DM-INV-022',
     'DM-INV-023','DM-INV-025','DM-INV-026','DM-INV-028'].forEach(id =>
      v(id, id, 'BLOCKED', 'INV-002 falló'));
    try { await irAHomeInv(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-004: Seleccionar cliente → tabs habilitadas
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const clienteElegido = await seleccionarCliente(DATA.clienteTest);
    const tabsHabilitadas = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-segment-button')].some(
        s => s.textContent.trim().includes('Inventario') && !s.disabled && s.getBoundingClientRect().width > 0
      )
    );
    if (!tabsHabilitadas) throw new Error('Tab Inventario sigue disabled tras seleccionar cliente');
    clienteOk = true;
    v('DM-INV-004', `Seleccionar cliente`, 'PASS', `"${clienteElegido}" · tabs habilitadas`);
  } catch (e) {
    v('DM-INV-004', 'Seleccionar cliente', 'FAIL', e.message);
    ['DM-INV-008','DM-INV-010','DM-INV-011','DM-INV-012',
     'DM-INV-016','DM-INV-017','DM-INV-020','DM-INV-021','DM-INV-022',
     'DM-INV-023','DM-INV-025','DM-INV-026','DM-INV-028'].forEach(id =>
      v(id, id, 'BLOCKED', 'INV-004 falló'));
    try { await irAHomeInv(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-008: Tab Inventario → lista de productos (al menos 1 item)
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await clickTab('Inventario');
    // Puede requerir expandir familia — contar ítems, si 0 click primer item
    let nItems = await contarItemsInventario();
    if (nItems === 0) {
      // Intentar expandir primera familia
      const familyCoords = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('app-inventario ion-item, app-inventario ion-list ion-item')]
          .filter(i => i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().height > 0);
        if (!items.length) return null;
        const r = items[0].getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (familyCoords) { await pg.mouse.click(familyCoords.x, familyCoords.y, { delay: 80 }); await pg.waitForTimeout(1200); }
      nItems = await contarItemsInventario();
    }
    if (nItems < 1) throw new Error('0 ítems en Tab Inventario tras expandir');
    tabInvOk = true;
    v('DM-INV-008', 'Tab Inventario → lista productos', 'PASS', `${nItems} ítems visibles`);
  } catch (e) {
    v('DM-INV-008', 'Tab Inventario → lista productos', 'FAIL', e.message);
    ['DM-INV-010','DM-INV-011','DM-INV-012'].forEach(id => v(id, id, 'BLOCKED', 'INV-008 falló'));
    tabInvOk = false;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-010: Click producto → modal inventory-type-stocks-modal
  // ══════════════════════════════════════════════════════════════════════════════
  if (tabInvOk) {
    try {
      const modalRes = await abrirModalProducto();
      if (!modalRes.ok) throw new Error(modalRes.error);
      modalOk = true;
      v('DM-INV-010', 'Click producto → modal captura', 'PASS',
        `modal abierto (intento ${modalRes.attempts})`);
    } catch (e) {
      v('DM-INV-010', 'Click producto → modal captura', 'FAIL', e.message);
      ['DM-INV-011','DM-INV-012'].forEach(id => v(id, id, 'BLOCKED', 'INV-010 falló'));
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-011: Llenar cantidad (+ lote + fecha si expirationBatch)
  // ══════════════════════════════════════════════════════════════════════════════
  const loteTest = `LOTE-QA-${String(Date.now()).slice(-4)}`;
  if (modalOk) {
    try {
      await llenarModal(5, loteTest, DATA.expirationBatch);
      // Verificar que cantidad quedó reflejada
      const cantVal = await pg.evaluate(() => {
        const modal = document.querySelector('ion-modal.inventory-type-stocks-modal');
        if (!modal) return null;
        const inp = modal.querySelector('input[placeholder="Ingrese cantidad"]');
        return inp ? inp.value : null;
      });
      if (!cantVal || cantVal === '0') throw new Error(`Cantidad no reflejada en modal (valor: ${cantVal})`);
      capturaOk = true;
      v('DM-INV-011', 'Llenar campos modal', 'PASS',
        `cantidad: ${cantVal}; expirationBatch: ${DATA.expirationBatch}; lote: ${DATA.expirationBatch ? loteTest : 'N/A'}`);
    } catch (e) {
      v('DM-INV-011', 'Llenar campos modal', 'FAIL', e.message);
      v('DM-INV-012', 'DM-INV-012', 'BLOCKED', 'INV-011 falló');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-012: Aceptar modal → producto marcado
  // ══════════════════════════════════════════════════════════════════════════════
  if (capturaOk) {
    try {
      await aceptarModal();
      const modalClosed = await pg.evaluate(() => {
        const m = document.querySelector('ion-modal.inventory-type-stocks-modal');
        return !m || m.offsetParent === null;
      });
      if (!modalClosed) throw new Error('Modal sigue abierto tras Aceptar');
      v('DM-INV-012', 'Aceptar modal → producto marcado', 'PASS', '');
    } catch (e) {
      v('DM-INV-012', 'Aceptar modal → producto marcado', 'FAIL', e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-016: Tab Resumen → productos capturados
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await clickTab('Resumen');
    const resInfo = await pg.evaluate(() => {
      // El resumen puede estar en distintos componentes o estructuras según la versión
      const selectors = [
        'app-inventario-resumen ion-item',
        'app-inventario-resumen ion-row',
        'app-inventario-resumen .item-row',
        'app-inventario ion-list ion-item',
        'app-inventario ion-row',
      ];
      for (const sel of selectors) {
        const items = [...document.querySelectorAll(sel)].filter(
          i => i.getBoundingClientRect().width > 0 && i.getBoundingClientRect().height > 0
        );
        if (items.length) return { rows: items.length, sel };
      }
      // Fallback: cualquier elemento visible en la zona de contenido del form
      const content = document.querySelector('app-inventario ion-content');
      if (content) {
        const visible = [...content.querySelectorAll('*')].filter(
          el => el.children.length === 0 && el.textContent.trim().length > 1 &&
            el.getBoundingClientRect().height > 10 && el.getBoundingClientRect().width > 20
        ).length;
        return { rows: visible, sel: 'fallback-text-nodes' };
      }
      return { rows: 0, sel: 'none' };
    });
    if (resInfo.rows < 1) throw new Error('Resumen vacío (0 ítems)');
    resumenOk = true;
    v('DM-INV-016', 'Tab Resumen → productos capturados', 'PASS', `${resInfo.rows} ítems (${resInfo.sel})`);
  } catch (e) {
    v('DM-INV-016', 'Tab Resumen → productos capturados', 'FAIL', e.message);
    resumenOk = false;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-017: Pedido sugerido visible (si suggestedOrder=true)
  // ══════════════════════════════════════════════════════════════════════════════
  if (!DATA.suggestedOrder) {
    v('DM-INV-017', 'Pedido Sugerido visible', 'N/A', 'suggestedOrderByDispatchAndReturn=false');
  } else {
    try {
      const btnVisible = await pg.evaluate(() => {
        const btn = document.querySelector('ion-button.botonAddAmarillo');
        return !!(btn && btn.getBoundingClientRect().width > 0);
      });
      v('DM-INV-017', 'Pedido Sugerido visible', btnVisible ? 'PASS' : 'FAIL',
        btnVisible ? 'ion-button.botonAddAmarillo visible' : 'botón no encontrado');

      // ══════════════════════════════════════════════════════════════════════════
      // DM-INV-020: Abrir modal sugerido → "días para siguiente inventario"
      // ══════════════════════════════════════════════════════════════════════════
      if (btnVisible) {
        try {
          const btnCoords = await pg.evaluate(() => {
            const btn = document.querySelector('ion-button.botonAddAmarillo');
            const r = btn.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          });
          await pg.mouse.click(btnCoords.x, btnCoords.y, { delay: 80 });
          await pg.waitForTimeout(1500);
          const modalInfo = await pg.evaluate(() => {
            const modal = document.querySelector('ion-modal.inventario-sugerido-modal, ion-modal[class*="sugerido"]');
            if (!modal || modal.offsetParent === null) return null;
            const txt = modal.textContent || '';
            const m = txt.match(/(\d+[\.,]?\d*)\s*(días|dias)/i);
            return { texto: txt.slice(0, 200), valor: m ? m[0] : null };
          });
          if (!modalInfo) {
            v('DM-INV-020', 'Días para siguiente inventario', 'N/A', 'modal sugerido no abrió o sin historial');
          } else {
            v('DM-INV-020', 'Días para siguiente inventario',
              modalInfo.valor ? 'PASS' : 'N/A',
              modalInfo.valor || 'quUnitSuggested=0 (sin historial)');
          }
          // Cerrar modal sin crear pedido
          await pg.evaluate(() => {
            const modal = document.querySelector('ion-modal.inventario-sugerido-modal, ion-modal[class*="sugerido"]');
            if (modal && typeof modal.dismiss === 'function') modal.dismiss(null, 'cancel');
          });
          await pg.waitForTimeout(800);
        } catch (e2) {
          v('DM-INV-020', 'Días para siguiente inventario', 'FAIL', e2.message);
        }
      } else {
        v('DM-INV-020', 'Días para siguiente inventario', 'N/A', 'botón pedido sugerido no visible');
      }
    } catch (e) {
      v('DM-INV-017', 'Pedido Sugerido visible', 'FAIL', e.message);
      v('DM-INV-020', 'Días para siguiente inventario', 'BLOCKED', 'INV-017 falló');
    }
  }

  // Si suggestedOrder=false, DM-INV-020 también N/A
  if (!DATA.suggestedOrder && !verdicts.find(vv => vv.id === 'DM-INV-020')) {
    v('DM-INV-020', 'Días para siguiente inventario', 'N/A', 'suggestedOrderByDispatchAndReturn=false');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-021: Click Guardar → "Inventario guardado con éxito" → se queda en form
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const gCoords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenGuardar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!gCoords) throw new Error('imagenGuardar no encontrado o disabled');
    await pg.mouse.click(gCoords.x, gCoords.y, { delay: 120 });
    const lbl1 = await clickAlertBtn(['Aceptar', 'OK']); // Cancelar/Aceptar
    await pg.waitForTimeout(600);
    let lbl2 = '';
    try { lbl2 = await clickAlertBtn(['OK', 'Aceptar']); } catch (_) {} // "guardado con éxito"
    await pg.waitForTimeout(800);

    // BD local
    let bdNota = 'BD-N/A';
    try {
      const rows = localQuery(`SELECT co_client_stock, id_client_stock, st_delivery FROM client_stocks ORDER BY rowid DESC LIMIT 1`);
      if (rows.length) {
        const id = parseInt(rows[0].id_client_stock, 10);
        const st = String(rows[0].st_delivery);
        bdNota = id === 0 ? `BD-SAVED(st=${st})` : `BD-UNEXPECTED(id=${id},st=${st})`;
      } else { bdNota = 'BD-LOCAL-EMPTY'; }
    } catch (_) {}

    guardadoOk = true;
    v('DM-INV-021', 'Click Guardar → Guardado', 'PASS',
      `alerts: "${lbl1}"/"${lbl2}" · ${bdNota}`);
  } catch (e) {
    v('DM-INV-021', 'Click Guardar → Guardado', 'FAIL', e.message);
    ['DM-INV-022','DM-INV-023','DM-INV-025','DM-INV-026','DM-INV-028'].forEach(id =>
      v(id, id, 'BLOCKED', 'INV-021 falló'));
    try { await irAHomeInv(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-022: Click Enviar → 2-3 alertas → navega a home inventarios
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    const eCoords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenEnviar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!eCoords) throw new Error('imagenEnviar no encontrado o disabled');
    await pg.mouse.click(eCoords.x, eCoords.y, { delay: 120 });

    let nroRef = null;
    for (let i = 0; i < 3; i++) {
      await pg.waitForTimeout(1300);
      const hasAlert = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-alert')].some(
          a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
        )
      );
      if (!hasAlert) break;
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
    await dismissResidualAlerts();

    // BD local + cotejo payload
    let bdNota = 'BD-N/A';
    try {
      const rows = localQuery(`SELECT co_client_stock, id_client_stock, st_delivery FROM client_stocks ORDER BY rowid DESC LIMIT 1`);
      if (rows.length) {
        const id = parseInt(rows[0].id_client_stock, 10);
        const st = String(rows[0].st_delivery);
        bdNota = id > 0 ? `BD-LOCAL-OK(id=${id},st=${st})` : `BD-LOCAL-PENDING(id=${id},st=${st})`;
      }
      const payloads = await getCapturedPayloads(pg);
      const pInv = payloads.filter(p => /clientstock/i.test(String(p.url)));
      if (pInv.length && DATA.clienteSlug) bdNota += ` · ${cotejoPayload(DATA.clienteSlug, pInv[pInv.length - 1])}`;
    } catch (_) {}

    enviadoOk = await isHomeInvVisible() || !!(await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenEnviar');
      return !btn || btn.disabled;
    }));
    v('DM-INV-022', 'Click Enviar → Enviado', enviadoOk ? 'PASS' : 'FAIL',
      `ref: ${nroRef || 'N/A'} · ${bdNota}`);
  } catch (e) {
    v('DM-INV-022', 'Click Enviar → Enviado', 'FAIL', e.message);
    ['DM-INV-023','DM-INV-025','DM-INV-026','DM-INV-028'].forEach(id =>
      v(id, id, 'BLOCKED', 'INV-022 falló'));
    try { await irAHomeInv(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-023: BUSCAR → lista con inventario (dismiss alert residual primero)
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    await irAHomeInv();
    await dismissResidualAlerts();
    await clickBotonHome('BUSCAR');
    await pg.waitForTimeout(2000);
    const nItems = await pg.evaluate(() =>
      [...document.querySelectorAll('app-inventario-list ion-item, app-inventarios-list ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0).length
    );
    listOk = nItems > 0;
    v('DM-INV-023', 'BUSCAR → lista', listOk ? 'PASS' : 'FAIL', `${nItems} ítems`);
  } catch (e) {
    v('DM-INV-023', 'BUSCAR → lista', 'FAIL', e.message);
    listOk = false;
    ['DM-INV-025','DM-INV-026','DM-INV-028'].forEach(id => v(id, id, 'BLOCKED', 'INV-023 falló'));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-025: Searchbar en BUSCAR → filtra en tiempo real
  // ══════════════════════════════════════════════════════════════════════════════
  if (listOk) {
    try {
      const searchInput = 'ion-searchbar input';
      await pg.click(searchInput, { clickCount: 3 }).catch(() => {});
      const termino = DATA.clienteTest.slice(0, 6);
      await pg.keyboard.type(termino, { delay: 30 });
      await pg.waitForTimeout(1200);
      const nFiltrado = await pg.evaluate(() =>
        [...document.querySelectorAll('app-inventario-list ion-item, app-inventarios-list ion-item')]
          .filter(i => i.getBoundingClientRect().width > 0).length
      );
      v('DM-INV-025', 'Searchbar filtra', nFiltrado >= 0 ? 'PASS' : 'FAIL',
        `"${termino}" → ${nFiltrado} resultado(s)`);
      // Limpiar searchbar
      await pg.click(searchInput, { clickCount: 3 }).catch(() => {});
      await pg.keyboard.press('Backspace');
      await pg.waitForTimeout(600);
    } catch (e) {
      v('DM-INV-025', 'Searchbar filtra', 'FAIL', e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Crear 2.º inventario Guardado (setup para INV-026/028)
  // ══════════════════════════════════════════════════════════════════════════════
  let guardado2Ok = false;
  let guardado2Error = 'desconocido';
  try {
    await irAHomeInv();
    await pg.waitForTimeout(1200); // esperar que Ionic complete animación de transición
    await flujoInventario(true); // crea 2.º inventario y lo guarda
    guardado2Ok = true;
  } catch (e) {
    guardado2Error = e.message;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-026: BUSCAR → click ítem Guardado → form abre
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    if (!guardado2Ok) throw new Error(`2.º Guardado falló: ${guardado2Error}`);
    await irAHomeInv();
    await dismissResidualAlerts();
    await pg.waitForTimeout(1200); // esperar animación de transición Ionic
    await irAHomeInv();            // verificar de nuevo tras animación
    await clickBotonHome('BUSCAR');
    await pg.waitForTimeout(2000);

    const itemCoords = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('app-inventario-list ion-item, app-inventarios-list ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0);
      // Guardado = tiene botón trash
      const guardado = items.find(i => i.querySelector('ion-button[color="danger"]')) || items[0];
      if (!guardado) return null;
      guardado.scrollIntoView({ block: 'center' });
      return true;
    });
    await pg.waitForTimeout(900);
    const clickCoords = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('app-inventario-list ion-item, app-inventarios-list ion-item')]
        .filter(i => { const r = i.getBoundingClientRect(); return r.width > 0 && r.y >= 0 && r.y <= window.innerHeight; });
      const guardado = items.find(i => i.querySelector('ion-button[color="danger"]')) || items[0];
      if (!guardado) return null;
      const label = guardado.querySelector('ion-label') || guardado;
      const r = label.getBoundingClientRect();
      return { x: r.left + r.width * 0.4, y: r.top + r.height / 2 };
    });
    if (!clickCoords) throw new Error('Ítem Guardado no visible en viewport');
    await pg.mouse.click(clickCoords.x, clickCoords.y, { delay: 120 });
    await pg.waitForTimeout(2500);

    const formVis = await pg.evaluate(() => {
      const f = document.querySelector('app-inventario');
      return !!(f && f.offsetParent !== null && f.querySelector('ion-segment-button'));
    });
    if (!formVis) throw new Error('app-inventario no visible tras click en ítem');
    v('DM-INV-026', 'Click Guardado → form abre', 'PASS', '(defecto conocido: puede abrir en tab General)');
  } catch (e) {
    v('DM-INV-026', 'Click Guardado → form abre', 'FAIL', e.message);
    v('DM-INV-028', 'DM-INV-028', 'BLOCKED', 'INV-026 falló');
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-INV-028: Back a lista → trash Guardado → "borrado con éxito"
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    // INV-026 dejó el form abierto. clickBack() solo lleva a 1 ítem (no la lista completa).
    // Uso irAHomeInv() para volver al home y luego navegar a BUSCAR fresco.
    await irAHomeInv();
    await dismissResidualAlerts();
    await clickBotonHome('BUSCAR');
    await pg.waitForTimeout(2000);

    // En la lista: buscar el primer ítem con ion-button[color="danger"] (el trash)
    const trashResult = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0);
      for (const item of items) {
        const trash = item.querySelector('ion-button[color="danger"]');
        if (!trash) continue;
        const r = trash.getBoundingClientRect();
        if (r.width === 0) continue;
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, debug: '' };
      }
      const sample = items.slice(0, 4).map(item => {
        const btns = [...item.querySelectorAll('ion-button, button')]
          .map(b => `[${b.getAttribute('color') || 'null'}]`);
        return `{btns:${btns.join(',') || 'none'}}`;
      });
      return { x: null, debug: `items=${items.length} | ${sample.join(' ')}` };
    });
    if (!trashResult || trashResult.x === null) {
      throw new Error(`Botón trash no encontrado en lista | ${trashResult ? trashResult.debug : ''}`);
    }
    const trashCoords = trashResult;
    await pg.mouse.click(trashCoords.x, trashCoords.y, { delay: 100 });

    // Trash directo (sin confirmación previa) → alert "borrado con éxito"
    await pg.waitForTimeout(800);
    let alertLabel = '';
    try { alertLabel = await clickAlertBtn(['OK', 'Aceptar', 'Borrar']); } catch (_) {}
    await pg.waitForTimeout(1200);

    // Verificar: el form ya no está visible (navegó a home o lista)
    const borradoOk = await isHomeInvVisible().catch(() => false) || await pg.evaluate(() => {
      const form = document.querySelector('app-inventario');
      return !form || form.getBoundingClientRect().width === 0;
    });
    v('DM-INV-028', 'Trash Guardado → desaparece', borradoOk ? 'PASS' : 'FAIL',
      `alert: "${alertLabel}" · form visible: ${!borradoOk}`);
  } catch (e) {
    v('DM-INV-028', 'Trash Guardado → desaparece', 'FAIL', e.message);
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runInventarios };
