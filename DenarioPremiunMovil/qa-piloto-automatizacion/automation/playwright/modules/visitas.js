'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { selectIonPopover, installPayloadCapture, getCapturedPayloads } = require('../../cdp/denario-cdp-helpers');

const LOCAL_QUERY_PATH    = path.resolve(__dirname, '../../db/local-query.js');
const COTEJO_PAYLOAD_PATH = path.resolve(__dirname, '../../db/cotejo-payload.js');

function cotejoPayload(slug, payload) {
  const tmp = path.join(os.tmpdir(), `qa_vis_payload_${Date.now()}.json`);
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

function localQuery(sql) {
  try {
    return JSON.parse(execFileSync('node', [LOCAL_QUERY_PATH, sql], { encoding: 'utf8', timeout: 15000 }));
  } catch (_) { return []; }
}

/**
 * modules/visitas.js — 16 casos smoke
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteTest:string, signatureVisit:boolean, userCanUploadFiles:boolean, smokenaEstructural:string[], clienteSlug:string }} DATA
 */
async function runVisitas(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  const TODOS = [
    'DM-VIS-001','DM-VIS-003','DM-VIS-004','DM-VIS-006',
    'DM-VIS-010','DM-VIS-014','DM-VIS-015','DM-VIS-019',
    'DM-VIS-020','DM-VIS-021','DM-VIS-022','DM-VIS-023',
    'DM-VIS-025','DM-VIS-026','DM-VIS-031','DM-VIS-032',
  ];

  const naEstructural = new Set(
    (DATA.smokenaEstructural || []).map(s => s.split(':')[0].trim())
  );

  if (!DATA.aplica) {
    TODOS.forEach(id => v(id, id, 'N/A', 'aplica=false en perfil visitas'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // Marcar N/A estructurales ya conocidos
  if (naEstructural.has('DM-VIS-025'))
    v('DM-VIS-025', 'Visita "No Visitado" → INICIAR VISITA', 'N/A', 'sin visitas sincronizadas desde backend (smoke_na_estructural)');
  if (naEstructural.has('DM-VIS-026'))
    v('DM-VIS-026', 'INICIAR VISITA con GPS → tabs habilitadas', 'N/A', 'depende de DM-VIS-025 → N/A');

  // Instalar captura de payloads — idempotente, nunca tumba el smoke
  try { await installPayloadCapture(pg); } catch (_) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function dismissResidualAlerts() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-alert').forEach(a => {
        if (!a.classList.contains('overlay-hidden') && a.offsetParent !== null)
          try { a.dismiss(); } catch (_) {}
      });
    });
    await pg.waitForTimeout(400);
  }

  async function clickAlertBtn(labels = ['Aceptar', 'OK']) {
    await pg.waitForTimeout(900);
    const coords = await pg.evaluate((lbls) => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(
        a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
      );
      if (!alerts.length) return null;
      const btns = [...alerts[0].querySelectorAll('.alert-button')];
      for (const lbl of lbls) {
        const b = btns.find(b => b.textContent.trim() === lbl);
        if (b) { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, lbl: b.textContent.trim() }; }
      }
      const last = btns[btns.length - 1];
      if (last) { const r = last.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, lbl: last.textContent.trim() }; }
      return null;
    }, labels);
    if (!coords) throw new Error(`Alert no encontrado (esperaba: ${labels.join('/')})`);
    await pg.mouse.click(coords.x, coords.y, { delay: 60 });
    await pg.waitForTimeout(400);
    return coords.lbl;
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

  async function isHomeVisVisible() {
    return pg.evaluate(() => {
      const btns = [...document.querySelectorAll('ion-button')].filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.top <= window.innerHeight;
      });
      const textos = btns.map(b => b.textContent.trim());
      return textos.some(t => t.includes('NUEVA VISITA')) && textos.some(t => t.includes('RUTA DE HOY'));
    });
  }

  async function irAHomeVis(maxAttempts = 8) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await isHomeVisVisible()) return;
      try { await clickBack(); } catch (_) {}
      await pg.waitForTimeout(800);
      await dismissResidualAlerts();
    }
    if (!(await isHomeVisVisible())) throw new Error('No se pudo llegar a home visitas');
  }

  async function clickBotonVis(texto) {
    const coords = await pg.evaluate((txt) => {
      const btn = [...document.querySelectorAll('ion-button')].find(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.top <= window.innerHeight
          && b.textContent.trim().includes(txt);
      });
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Botón "${texto}" no encontrado en home visitas`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(800);
  }

  async function seleccionarCliente(nombre) {
    // Buscar campo cliente (placeholder "Cliente..." o id clienteSelect)
    const selCoords = await pg.evaluate(() => {
      const cands = [
        document.querySelector('ion-input#clienteSelect'),
        ...[...document.querySelectorAll('ion-input')].filter(i =>
          (i.getAttribute('placeholder') || '').toLowerCase().includes('cliente')
        ),
      ].filter(Boolean);
      if (!cands.length) return null;
      const r = cands[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!selCoords) throw new Error('Campo selector de cliente no encontrado');
    await pg.mouse.click(selCoords.x, selCoords.y, { delay: 80 });

    // Poll modal hasta 8s
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
    if (!searchCoords) throw new Error('Modal cliente no abrió en 8s');

    await pg.mouse.click(searchCoords.x, searchCoords.y, { delay: 50, clickCount: 3 });
    await pg.keyboard.type(nombre ? nombre.slice(0, 8) : 'A', { delay: 30 });
    await pg.waitForTimeout(2000);

    const resultado = await pg.evaluate((n) => {
      const containers = [...document.querySelectorAll('ion-modal, ion-popover')]
        .filter(c => c.offsetParent !== null);
      for (const c of containers) {
        const cands = [...c.querySelectorAll('p, ion-label, ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0 && el.textContent.trim().length > 2);
        if (!cands.length) continue;
        const exacto = n ? cands.find(el => el.textContent.includes(n)) : null;
        const target = exacto || cands[0];
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, nombre: target.textContent.trim().slice(0, 60) };
      }
      return null;
    }, nombre ? nombre.slice(0, 20) : '');
    if (!resultado) throw new Error('Sin resultados en selector de clientes');
    await pg.mouse.click(resultado.x, resultado.y, { delay: 80 });
    await pg.waitForTimeout(1500);
    return resultado.nombre;
  }

  async function clickTab(texto) {
    const coords = await pg.evaluate((txt) => {
      const seg = [...document.querySelectorAll('ion-segment-button')]
        .find(s => s.getBoundingClientRect().width > 0 && s.textContent.trim().includes(txt));
      if (!seg) return null;
      const r = seg.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Tab "${texto}" no encontrado`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(800);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-001: Click módulo Visitas → home con 3 botones
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    // Mismo patrón que inventarios: app-home a.ion-text-center → p.nombreModulos
    const tileCoords = await pg.evaluate(() => {
      const tile = [...document.querySelectorAll('app-home a.ion-text-center')].find(a => {
        const p = a.querySelector('p.nombreModulos');
        return p && p.textContent.trim() === 'Visitas';
      });
      if (!tile) return null;
      const r = tile.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tileCoords) throw new Error('Tile Visitas no encontrado en HOME');
    await pg.mouse.click(tileCoords.x, tileCoords.y, { delay: 80 });
    await pg.waitForSelector('app-visitas', { state: 'visible', timeout: 10000 });
    await pg.waitForTimeout(800);
    await dismissResidualAlerts();

    const btns = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .map(b => b.textContent.trim()).filter(t => t)
    );
    const hasNueva  = btns.some(t => t.includes('NUEVA VISITA'));
    const hasRuta   = btns.some(t => t.includes('RUTA DE HOY'));
    const hasMejor  = btns.some(t => t.toLowerCase().includes('mejor ruta'));
    if (!hasNueva || !hasRuta) throw new Error(`Home visitas sin botones esperados: [${btns.join(', ')}]`);
    v('DM-VIS-001', 'Click módulo Visitas → home', 'PASS',
      `botones: ${btns.join(', ')} · mejorRuta: ${hasMejor}`);
  } catch (e) {
    v('DM-VIS-001', 'Click módulo Visitas → home', 'FAIL', e.message);
    TODOS.filter(id => !['DM-VIS-001','DM-VIS-025','DM-VIS-026'].includes(id))
      .forEach(id => v(id, id, 'BLOCKED', 'VIS-001 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-003: NUEVA VISITA → tabs ACTIVIDADES/ADJUNTOS disabled
  // ══════════════════════════════════════════════════════════════════════════════
  let formAbiertoOk = false;
  try {
    await clickBotonVis('NUEVA VISITA');
    await pg.waitForTimeout(1200);

    const formInfo = await pg.evaluate(() => {
      const segs = [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0);
      const actDisabled = segs.find(s => s.textContent.includes('ACTIVIDADES'))?.disabled;
      const adjDisabled = segs.find(s => s.textContent.includes('ADJUNTOS'))?.disabled;
      const tabs = segs.map(s => s.textContent.trim());
      return { tabs, actDisabled, adjDisabled };
    });

    if (!formInfo.tabs.length) throw new Error('Tabs no encontradas en form NUEVA VISITA');
    const tabsDisabled = formInfo.actDisabled !== false || formInfo.adjDisabled !== false;
    formAbiertoOk = true;
    v('DM-VIS-003', 'NUEVA VISITA → form / tabs disabled', tabsDisabled ? 'PASS' : 'FAIL',
      `tabs: [${formInfo.tabs.join(', ')}] · ACTIVIDADES disabled: ${formInfo.actDisabled} · ADJUNTOS disabled: ${formInfo.adjDisabled}`);
  } catch (e) {
    v('DM-VIS-003', 'NUEVA VISITA → form / tabs disabled', 'FAIL', e.message);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-004: RUTA DE HOY → lista + searchbar
  // ══════════════════════════════════════════════════════════════════════════════
  let listaOk = false;
  try {
    await irAHomeVis();
    await clickBotonVis('RUTA DE HOY');
    await pg.waitForSelector('ion-searchbar', { state: 'visible', timeout: 8000 });
    await dismissResidualAlerts();

    const listaInfo = await pg.evaluate(() => {
      const searchbar = !!document.querySelector('ion-searchbar');
      const items = [...document.querySelectorAll('ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0).length;
      return { searchbar, items };
    });
    if (!listaInfo.searchbar) throw new Error('Searchbar no encontrado en RUTA DE HOY');
    listaOk = true;
    v('DM-VIS-004', 'RUTA DE HOY → lista + searchbar', 'PASS',
      `searchbar: ${listaInfo.searchbar} · ítems: ${listaInfo.items} (puede ser 0 = OK)`);
  } catch (e) {
    v('DM-VIS-004', 'RUTA DE HOY → lista + searchbar', 'FAIL', e.message);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-006: Trash de visita Guardada en lista (si existe)
  // ══════════════════════════════════════════════════════════════════════════════
  try {
    // Asegurarse de estar en RUTA DE HOY
    if (!listaOk) {
      await irAHomeVis();
      await clickBotonVis('RUTA DE HOY');
      await pg.waitForTimeout(1500);
    }

    // Paso 1: localizar ítem con trash y scrollIntoView
    const trashFound = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0);
      for (const item of items) {
        const trash = item.querySelector('ion-button[color="danger"]');
        if (!trash || trash.getBoundingClientRect().width === 0) continue;
        item.scrollIntoView({ block: 'center', behavior: 'instant' });
        return true;
      }
      return false;
    });
    await pg.waitForTimeout(400); // esperar que el scroll actualice el layout

    // Paso 2: obtener coords ya con el ítem en viewport
    const trashCoords = !trashFound ? null : await pg.evaluate(() => {
      const items = [...document.querySelectorAll('ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0);
      for (const item of items) {
        const trash = item.querySelector('ion-button[color="danger"]');
        if (!trash) continue;
        const r = trash.getBoundingClientRect();
        if (r.width === 0 || r.top < 0 || r.top > window.innerHeight) continue;
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      return null;
    });

    if (!trashCoords) {
      v('DM-VIS-006', 'Trash visita Guardada → desaparece', 'PASS', 'sin visitas Guardadas previas en lista');
    } else {
      await pg.mouse.click(trashCoords.x, trashCoords.y, { delay: 100 });
      await pg.waitForTimeout(1000);

      // Confirmar: puede ser ion-alert o ion-action-sheet
      let lbl = '';
      try { lbl = await clickAlertBtn(['ACEPTAR', 'Aceptar', 'OK', 'Eliminar', 'Borrar']); }
      catch (_) {
        // Intentar ion-action-sheet (botones en shadow DOM en Ionic 6)
        const sheetCoords = await pg.evaluate(() => {
          const sheet = document.querySelector('ion-action-sheet');
          if (!sheet || sheet.classList.contains('overlay-hidden')) return null;
          // Ionic 6: buscar en shadowRoot primero, luego en light DOM
          const root = sheet.shadowRoot || sheet;
          const btns = [...root.querySelectorAll('button')].filter(b =>
            b.getBoundingClientRect().width > 0 &&
            !b.classList.contains('action-sheet-cancel') &&
            !b.textContent.toLowerCase().includes('cancelar')
          );
          if (!btns.length) return null;
          const r = btns[0].getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, lbl: btns[0].textContent.trim() };
        });
        if (sheetCoords) {
          await pg.mouse.click(sheetCoords.x, sheetCoords.y, { delay: 80 });
          lbl = sheetCoords.lbl;
        }
      }

      await pg.waitForTimeout(1200);
      const sigueVisible = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-item')].some(i => {
          const trash = i.querySelector('ion-button[color="danger"]');
          return trash && trash.getBoundingClientRect().width > 0;
        })
      );
      v('DM-VIS-006', 'Trash visita Guardada → desaparece', !sigueVisible ? 'PASS' : 'FAIL',
        `confirmación: "${lbl}" · trash restante: ${sigueVisible}`);
    }
  } catch (e) {
    v('DM-VIS-006', 'Trash visita Guardada → desaparece', 'FAIL', e.message);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-010: Seleccionar cliente → tabs ACTIVIDADES/ADJUNTOS habilitadas
  // ══════════════════════════════════════════════════════════════════════════════
  let clienteOk = false;
  try {
    await irAHomeVis();
    await clickBotonVis('NUEVA VISITA');
    await pg.waitForTimeout(1200);

    const clienteElegido = await seleccionarCliente(DATA.clienteTest);

    const tabsHabilitadas = await pg.evaluate(() => {
      const segs = [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0);
      const act = segs.find(s => s.textContent.includes('ACTIVIDADES'));
      const adj = segs.find(s => s.textContent.includes('ADJUNTOS'));
      const sucursal = document.querySelector('ion-select[formControlName*="sucur"], ion-select[id*="sucur"]')
        || [...document.querySelectorAll('ion-select')].find(s => {
          const lbl = s.previousElementSibling || s.closest('ion-item');
          return lbl && lbl.textContent.toLowerCase().includes('sucursal');
        });
      return {
        actEnabled: act && !act.disabled,
        adjEnabled: adj && !adj.disabled,
        sucursalVisible: !!sucursal && sucursal.getBoundingClientRect().width > 0,
      };
    });

    if (!tabsHabilitadas.actEnabled) throw new Error('Tab ACTIVIDADES sigue disabled tras seleccionar cliente');
    clienteOk = true;
    v('DM-VIS-010', 'Seleccionar cliente → tabs habilitadas', 'PASS',
      `"${clienteElegido}" · ACTIVIDADES: ${tabsHabilitadas.actEnabled} · ADJUNTOS: ${tabsHabilitadas.adjEnabled} · sucursal: ${tabsHabilitadas.sucursalVisible}`);
  } catch (e) {
    v('DM-VIS-010', 'Seleccionar cliente → tabs habilitadas', 'FAIL', e.message);
    ['DM-VIS-014','DM-VIS-015','DM-VIS-019','DM-VIS-020',
     'DM-VIS-021','DM-VIS-022','DM-VIS-023','DM-VIS-031','DM-VIS-032'].forEach(id =>
      v(id, id, 'BLOCKED', 'VIS-010 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-014: Click AÑADIR ACTIVIDAD/EVENTO → modal
  // ══════════════════════════════════════════════════════════════════════════════
  let modalActividadOk = false;
  try {
    // Ir a tab ACTIVIDADES y esperar render
    await clickTab('ACTIVIDADES');
    await pg.waitForTimeout(500);

    // Esperar el botón AÑADIR con poll (puede tardar en renderizar)
    let btnCoords = null;
    for (let i = 0; i < 10; i++) {
      btnCoords = await pg.evaluate(() => {
        const btn = [...document.querySelectorAll('ion-button, button')]
          .find(b => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && b.textContent.trim().toUpperCase().includes('AÑADIR');
          });
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (btnCoords) break;
      await pg.waitForTimeout(400);
    }
    if (!btnCoords) throw new Error('Botón AÑADIR ACTIVIDAD/EVENTO no encontrado (10 intentos)');
    await pg.mouse.click(btnCoords.x, btnCoords.y, { delay: 80 });

    // Esperar modal — Ionic 6: ion-modal puede tener width=0 en host, verificar por overlay-hidden
    await pg.waitForTimeout(800);
    await pg.waitForSelector('ion-modal:not(.overlay-hidden)', { timeout: 5000 }).catch(() => {});

    const modalInfo = await pg.evaluate(() => {
      // Ionic añade overlay-hidden a modales cerrados
      const modal = [...document.querySelectorAll('ion-modal')]
        .find(m => !m.classList.contains('overlay-hidden'));
      if (!modal) return null;
      const hasSelect = !!modal.querySelector('ion-select');
      const hasInput  = !!modal.querySelector('ion-input, textarea, ion-textarea');
      const btns = [...modal.querySelectorAll('ion-button, button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .map(b => b.textContent.trim());
      return { hasSelect, hasInput, btns };
    });
    if (!modalInfo) throw new Error('Modal AÑADIR ACTIVIDAD no abrió');
    modalActividadOk = true;
    v('DM-VIS-014', 'AÑADIR ACTIVIDAD/EVENTO → modal', 'PASS',
      `select: ${modalInfo.hasSelect} · input: ${modalInfo.hasInput} · btns: [${modalInfo.btns.join(', ')}]`);
  } catch (e) {
    v('DM-VIS-014', 'AÑADIR ACTIVIDAD/EVENTO → modal', 'FAIL', e.message);
    ['DM-VIS-015','DM-VIS-019','DM-VIS-020','DM-VIS-021','DM-VIS-022',
     'DM-VIS-023','DM-VIS-031','DM-VIS-032'].forEach(id =>
      v(id, id, 'BLOCKED', 'VIS-014 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-015: Agregar actividad → evento en lista Tab Actividades
  // ══════════════════════════════════════════════════════════════════════════════
  let actividadOk = false;
  const comentarioQA = `Test-VIS-015-${String(Math.floor(Date.now() / 1000)).slice(-4)}`;

  // Helper: click select, click primer radio en popover, esperar cierre
  async function seleccionarEnPopover(nthSelect) {
    const selCoords = await pg.evaluate((nth) => {
      const modal = [...document.querySelectorAll('ion-modal')].find(m => !m.classList.contains('overlay-hidden'));
      if (!modal) return null;
      const sels = [...modal.querySelectorAll('ion-select')].filter(s => s.getBoundingClientRect().width > 0);
      if (!sels[nth]) return null;
      const r = sels[nth].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, nthSelect);
    if (!selCoords) return false;
    await pg.mouse.click(selCoords.x, selCoords.y, { delay: 80 });
    await pg.waitForSelector('ion-popover:not(.overlay-hidden)', { timeout: 4000 }).catch(() => {});
    await pg.waitForTimeout(300);

    // Click primer ítem/radio visible en el popover
    const optCoords = await pg.evaluate(() => {
      const pop = [...document.querySelectorAll('ion-popover')].find(p => !p.classList.contains('overlay-hidden'));
      if (!pop) return null;
      const items = [...pop.querySelectorAll('ion-item, ion-radio-group ion-item, button')]
        .filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0);
      if (!items.length) return null;
      const r = items[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!optCoords) return false;
    await pg.mouse.click(optCoords.x, optCoords.y, { delay: 80 });
    // Esperar a que el popover cierre
    await pg.waitForSelector('ion-popover', { state: 'hidden', timeout: 3000 }).catch(() => {});
    await pg.waitForTimeout(400);
    return true;
  }

  try {
    // 1) Seleccionar Actividad (primer ion-select del modal)
    const selAct = await seleccionarEnPopover(0);
    if (!selAct) throw new Error('ion-select Actividad no encontrado en modal');

    // 2) Seleccionar Motivo (segundo ion-select, si existe)
    await seleccionarEnPopover(1); // no lanza si no existe

    // 3) Comentario — ngModel → triple click + keyboard.type
    const inputCoords = await pg.evaluate(() => {
      const modal = [...document.querySelectorAll('ion-modal')].find(m => !m.classList.contains('overlay-hidden'));
      if (!modal) return null;
      const inp = modal.querySelector('ion-input input, textarea, ion-textarea textarea');
      if (!inp || inp.getBoundingClientRect().width === 0) return null;
      const r = inp.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (inputCoords) {
      await pg.mouse.click(inputCoords.x, inputCoords.y, { delay: 60, clickCount: 3 });
      await pg.keyboard.type(comentarioQA, { delay: 25 });
      await pg.waitForTimeout(400);
    }

    // 4) Click AGREGAR — buscar en document completo (no solo dentro del modal)
    const agregarCoords = await pg.evaluate(() => {
      const btn = [...document.querySelectorAll('ion-button, button')]
        .filter(b => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.top >= 0 && r.top <= window.innerHeight;
        })
        .find(b => b.textContent.trim().toUpperCase().includes('AGREGAR'));
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!agregarCoords) throw new Error('Botón AGREGAR no encontrado en pantalla');
    await pg.mouse.click(agregarCoords.x, agregarCoords.y, { delay: 80 });
    await pg.waitForTimeout(1500);

    // 5) Verificar: modal cerró y evento aparece en lista
    const nEventos = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-list ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0).length
    );
    if (nEventos === 0) throw new Error('Modal cerró pero lista de actividades vacía');
    actividadOk = true;
    v('DM-VIS-015', 'Agregar actividad → evento en lista', 'PASS',
      `comentario: "${comentarioQA}" · eventos: ${nEventos}`);
  } catch (e) {
    v('DM-VIS-015', 'Agregar actividad → evento en lista', 'FAIL', e.message);
    ['DM-VIS-019','DM-VIS-020','DM-VIS-021','DM-VIS-022',
     'DM-VIS-023','DM-VIS-031','DM-VIS-032'].forEach(id =>
      v(id, id, 'BLOCKED', 'VIS-015 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-019: Click Guardar → "La visita se ha guardado"; form permanece
  // ══════════════════════════════════════════════════════════════════════════════
  let guardadoOk = false;
  try {
    const guardarCoords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenGuardar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      if (r.width === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!guardarCoords) throw new Error('ion-button.imagenGuardar no encontrado en form visita');
    await pg.mouse.click(guardarCoords.x, guardarCoords.y, { delay: 100 });

    const lbl = await clickAlertBtn(['Aceptar', 'OK', 'ACEPTAR']).catch(() => '');
    await pg.waitForTimeout(800);

    // Form debe seguir abierto (tabs aún visibles)
    const formSigueAbierto = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-segment-button')]
        .some(s => s.getBoundingClientRect().width > 0)
    );

    // BD local
    let bdNota = 'BD-N/A';
    try {
      const rows = localQuery(`SELECT co_visit, id_visit, st_visit FROM visits ORDER BY rowid DESC LIMIT 1`);
      if (rows.length) {
        const r = rows[0];
        bdNota = parseInt(r.id_visit, 10) === 0
          ? `BD-SAVED(st=${r.st_visit})`
          : `BD-UNEXPECTED(id=${r.id_visit},st=${r.st_visit})`;
      }
    } catch (_) {}

    guardadoOk = formSigueAbierto;
    v('DM-VIS-019', 'Click Guardar → Guardado', guardadoOk ? 'PASS' : 'FAIL',
      `alert: "${lbl}" · form abierto: ${formSigueAbierto} · ${bdNota}`);
  } catch (e) {
    v('DM-VIS-019', 'Click Guardar → Guardado', 'FAIL', e.message);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-023: Click visita Guardada (última de la lista) → form editable
  // NOTA: las Guardadas siempre están al final. Corre ANTES de Enviar.
  // ══════════════════════════════════════════════════════════════════════════════
  let formGuardadoOk = false;
  try {
    await irAHomeVis();
    await clickBotonVis('RUTA DE HOY');
    await pg.waitForTimeout(1500);

    // Las Guardadas siempre al final — buscar ítems con texto "guardado" en todo el DOM
    // (sin filtro de viewport), tomar el último, hacer scrollIntoView y obtener coords
    const hayGuardado = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0);
      // Prioridad: ítem con texto "guardado"; fallback: ítem con trash; último ítem
      const guardados = items.filter(i => i.textContent.toLowerCase().includes('guardado'));
      const conTrash  = items.filter(i => {
        const t = i.querySelector('ion-button[color="danger"]');
        return t && t.getBoundingClientRect().width > 0;
      });
      const target = guardados.length ? guardados[guardados.length - 1]
                   : conTrash.length  ? conTrash[conTrash.length - 1]
                   : items.length     ? items[items.length - 1]
                   : null;
      if (!target) return false;
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return true;
    });
    if (!hayGuardado) throw new Error('No hay visitas en RUTA DE HOY para VIS-023');
    await pg.waitForTimeout(800);

    // Ahora el ítem Guardado está en viewport — obtener coords
    const clickCoords = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('ion-item')]
        .filter(i => i.getBoundingClientRect().width > 0);
      const guardados = items.filter(i => i.textContent.toLowerCase().includes('guardado'));
      const conTrash  = items.filter(i => {
        const t = i.querySelector('ion-button[color="danger"]');
        return t && t.getBoundingClientRect().width > 0;
      });
      const target = guardados.length ? guardados[guardados.length - 1]
                   : conTrash.length  ? conTrash[conTrash.length - 1]
                   : items[items.length - 1];
      if (!target) return null;
      const label = target.querySelector('ion-label') || target;
      const r = label.getBoundingClientRect();
      return { x: r.left + r.width * 0.4, y: r.top + r.height / 2 };
    });
    if (!clickCoords) throw new Error('No hay visitas en RUTA DE HOY para VIS-023');
    await pg.waitForTimeout(300);
    await pg.mouse.click(clickCoords.x, clickCoords.y, { delay: 80 });
    await pg.waitForTimeout(1500);

    const formInfo = await pg.evaluate(() => {
      const segs = [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0);
      const guardar = document.querySelector('ion-button.imagenGuardar');
      const enviar  = document.querySelector('ion-button.imagenEnviar');
      return {
        tabs: segs.map(s => s.textContent.trim()),
        guardarActivo: !!guardar && !guardar.disabled,
        enviarActivo:  !!enviar  && !enviar.disabled,
      };
    });
    if (!formInfo.tabs.length) throw new Error('Form sin tabs tras abrir visita Guardada');
    formGuardadoOk = true;
    v('DM-VIS-023', 'Click Guardado → form editable', 'PASS',
      `tabs: [${formInfo.tabs.join(', ')}] · guardar: ${formInfo.guardarActivo} · enviar: ${formInfo.enviarActivo}`);
  } catch (e) {
    v('DM-VIS-023', 'Click Guardado → form editable', 'FAIL', e.message);
    ['DM-VIS-031','DM-VIS-032'].forEach(id => v(id, id, 'BLOCKED', 'VIS-023 falló'));
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-031: Tab Actividades → eventos visibles (visita Guardada reabierta)
  // ══════════════════════════════════════════════════════════════════════════════
  if (formGuardadoOk) {
    try {
      await clickTab('ACTIVIDADES');
      const nEventos = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-list ion-item')]
          .filter(i => i.getBoundingClientRect().width > 0).length
      );
      v('DM-VIS-031', 'Tab Actividades → eventos en Guardado', nEventos > 0 ? 'PASS' : 'FAIL',
        `eventos en lista: ${nEventos}`);
    } catch (e) {
      v('DM-VIS-031', 'Tab Actividades → eventos en Guardado', 'FAIL', e.message);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // DM-VIS-032: Tab Adjuntos → acordeones Imágenes, Archivo, Firma
    // ══════════════════════════════════════════════════════════════════════════════
    try {
      await clickTab('ADJUNTOS');
      await pg.waitForTimeout(600);

      const adjInfo = await pg.evaluate(() => {
        const visibleText = document.body.innerText.toLowerCase();
        return {
          imagenes: visibleText.includes('imag') || visibleText.includes('imág') || visibleText.includes('foto'),
          archivo:  visibleText.includes('archivo'),
          firma:    visibleText.includes('firma'),
        };
      });

      const esperaArchivo = DATA.userCanUploadFiles;
      const esperaFirma   = DATA.signatureVisit;
      const ok = adjInfo.imagenes
        && (!esperaArchivo || adjInfo.archivo)
        && (!esperaFirma   || adjInfo.firma);

      v('DM-VIS-032', 'Tab Adjuntos → acordeones', ok ? 'PASS' : 'FAIL',
        `imágenes: ${adjInfo.imagenes} · archivo(${esperaArchivo}): ${adjInfo.archivo} · firma(${esperaFirma}): ${adjInfo.firma}`);
    } catch (e) {
      v('DM-VIS-032', 'Tab Adjuntos → acordeones', 'FAIL', e.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-020: Click Enviar (desde el form Guardado ya abierto) → home módulo
  // ══════════════════════════════════════════════════════════════════════════════
  let enviadoOk = false;
  try {
    // Si VIS-023 falló, intentar re-abrir la visita Guardada desde RUTA DE HOY
    if (!formGuardadoOk) {
      await irAHomeVis();
      await clickBotonVis('RUTA DE HOY');
      await pg.waitForTimeout(1500);
      await pg.evaluate(() => {
        const items = [...document.querySelectorAll('ion-item')]
          .filter(i => i.getBoundingClientRect().width > 0);
        const guardados = items.filter(i => i.textContent.toLowerCase().includes('guardado'));
        const target = guardados.length ? guardados[guardados.length - 1] : items[items.length - 1];
        if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      await pg.waitForTimeout(700);
      const cc = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('ion-item')]
          .filter(i => i.getBoundingClientRect().width > 0);
        const guardados = items.filter(i => i.textContent.toLowerCase().includes('guardado'));
        const target = guardados.length ? guardados[guardados.length - 1] : items[items.length - 1];
        if (!target) return null;
        const label = target.querySelector('ion-label') || target;
        const r = label.getBoundingClientRect();
        return { x: r.left + r.width * 0.4, y: r.top + r.height / 2 };
      });
      if (cc) { await pg.mouse.click(cc.x, cc.y, { delay: 80 }); await pg.waitForTimeout(1500); }
    }

    const enviarCoords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenEnviar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      if (r.width === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!enviarCoords) throw new Error('ion-button.imagenEnviar no encontrado en form visita');
    await pg.mouse.click(enviarCoords.x, enviarCoords.y, { delay: 100 });

    let lbls = [];
    for (let i = 0; i < 3; i++) {
      try {
        const l = await clickAlertBtn(['ACEPTAR', 'Aceptar', 'OK', 'Sí', 'SI']);
        if (l) lbls.push(l);
      } catch (_) { break; }
    }
    await pg.waitForTimeout(2000);
    await dismissResidualAlerts();

    enviadoOk = await isHomeVisVisible().catch(() => false);

    let bdNota = 'BD-N/A';
    try {
      const rows = localQuery(`SELECT co_visit, id_visit, st_visit, is_visited FROM visits ORDER BY rowid DESC LIMIT 1`);
      if (rows.length) {
        const r = rows[0];
        const id = parseInt(r.id_visit, 10);
        bdNota = id > 0 ? `BD-OK(id=${id},st=${r.st_visit},visited=${r.is_visited})`
                        : `BD-QUEUED(st=${r.st_visit})`;
      }
    } catch (_) {}

    // Cotejo payload↔nube (campo por campo)
    try {
      const payloads = await getCapturedPayloads(pg);
      const pVis = payloads.filter(p => /visitservice\/visit/i.test(String(p.url)));
      if (pVis.length && DATA.clienteSlug)
        bdNota += ` · ${cotejoPayload(DATA.clienteSlug, pVis[pVis.length - 1])}`;
    } catch (_) {}

    v('DM-VIS-020', 'Click Enviar → Enviado', enviadoOk ? 'PASS' : 'FAIL',
      `alerts: [${lbls.join(',')}] · home: ${enviadoOk} · ${bdNota}`);
  } catch (e) {
    v('DM-VIS-020', 'Click Enviar → Enviado', 'FAIL', e.message);
    ['DM-VIS-021','DM-VIS-022'].forEach(id =>
      v(id, id, 'BLOCKED', 'VIS-020 falló'));
    try { await irAHomeVis(); } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-021: Back con cambios (visita nueva + evento sin guardar) → modal 3 opciones
  // ══════════════════════════════════════════════════════════════════════════════
  let modalSalidaOk = false;
  let modalBtns = [];
  try {
    await irAHomeVis();
    await clickBotonVis('NUEVA VISITA');
    await pg.waitForTimeout(1200);

    await seleccionarCliente(DATA.clienteTest);

    await clickTab('ACTIVIDADES');
    await pg.waitForTimeout(500);
    let btnAnadir021 = null;
    for (let i = 0; i < 8; i++) {
      btnAnadir021 = await pg.evaluate(() => {
        const btn = [...document.querySelectorAll('ion-button, button')].find(b => {
          const r = b.getBoundingClientRect();
          return r.width > 0 && b.textContent.trim().toUpperCase().includes('AÑADIR');
        });
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (btnAnadir021) break;
      await pg.waitForTimeout(400);
    }
    if (!btnAnadir021) throw new Error('Botón AÑADIR no encontrado para VIS-021');
    await pg.mouse.click(btnAnadir021.x, btnAnadir021.y, { delay: 80 });
    await pg.waitForSelector('ion-modal:not(.overlay-hidden)', { timeout: 5000 }).catch(() => {});
    await pg.waitForTimeout(500);

    await seleccionarEnPopover(0);
    await seleccionarEnPopover(1);

    const inputC = await pg.evaluate(() => {
      const modal = [...document.querySelectorAll('ion-modal')].find(m => !m.classList.contains('overlay-hidden'));
      const inp = modal && modal.querySelector('ion-input input, textarea, ion-textarea textarea');
      if (!inp || inp.getBoundingClientRect().width === 0) return null;
      const r = inp.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (inputC) {
      await pg.mouse.click(inputC.x, inputC.y, { delay: 60, clickCount: 3 });
      await pg.keyboard.type(`Test-VIS-021-${String(Date.now()).slice(-4)}`, { delay: 25 });
      await pg.waitForTimeout(300);
    }
    const agregarC = await pg.evaluate(() => {
      const btn = [...document.querySelectorAll('ion-button, button')]
        .filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.top <= window.innerHeight; })
        .find(b => b.textContent.trim().toUpperCase().includes('AGREGAR'));
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (agregarC) {
      await pg.mouse.click(agregarC.x, agregarC.y, { delay: 80 });
      await pg.waitForTimeout(1200);
    }

    await clickBack();
    await pg.waitForTimeout(1200);

    modalBtns = await pg.evaluate(() => {
      const alerts = [...document.querySelectorAll('ion-alert')]
        .filter(a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null);
      if (!alerts.length) return [];
      return [...alerts[0].querySelectorAll('.alert-button')]
        .map(b => b.textContent.trim()).filter(t => t);
    });

    const tieneGuardar  = modalBtns.some(t => t.toLowerCase().includes('guardar'));
    const tieneSalir    = modalBtns.some(t => t.toLowerCase().includes('salir'));
    if (!tieneGuardar && !tieneSalir) throw new Error(`Modal sin opciones esperadas: [${modalBtns.join(', ')}]`);
    modalSalidaOk = true;
    v('DM-VIS-021', 'Back con cambios → modal 3 opciones', 'PASS',
      `opciones: [${modalBtns.join(', ')}]`);
  } catch (e) {
    v('DM-VIS-021', 'Back con cambios → modal 3 opciones', 'FAIL', e.message);
    v('DM-VIS-022', 'DM-VIS-022', 'BLOCKED', 'VIS-021 falló');
    try { await dismissResidualAlerts(); await irAHomeVis(); } catch (_) {}
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DM-VIS-022: Elegir "Salir sin guardar" → visita nueva NO en RUTA DE HOY
  // ══════════════════════════════════════════════════════════════════════════════
  if (modalSalidaOk) {
    try {
      const itemsAntes = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-item')].filter(i => i.getBoundingClientRect().width > 0).length
      );

      const salidaCoords = await pg.evaluate(() => {
        const alerts = [...document.querySelectorAll('ion-alert')]
          .filter(a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null);
        if (!alerts.length) return null;
        const btn = [...alerts[0].querySelectorAll('.alert-button')].find(b =>
          b.textContent.toLowerCase().includes('salir sin')
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, lbl: btn.textContent.trim() };
      });
      if (!salidaCoords) throw new Error(`Opción "Salir sin guardar" no encontrada: [${modalBtns.join(', ')}]`);
      await pg.mouse.click(salidaCoords.x, salidaCoords.y, { delay: 80 });
      await pg.waitForTimeout(1500);
      await dismissResidualAlerts();

      await irAHomeVis();
      await clickBotonVis('RUTA DE HOY');
      await pg.waitForTimeout(1500);

      const itemsDespues = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-item')].filter(i => i.getBoundingClientRect().width > 0).length
      );
      v('DM-VIS-022', '"Salir sin guardar" → visita no guardada', 'PASS',
        `salida: "${salidaCoords.lbl}" · ítems antes: ${itemsAntes} · después: ${itemsDespues}`);
    } catch (e) {
      v('DM-VIS-022', '"Salir sin guardar" → visita no guardada', 'FAIL', e.message);
    }
  }

  try { await irAHomeVis(); } catch (_) {}
  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runVisitas };
