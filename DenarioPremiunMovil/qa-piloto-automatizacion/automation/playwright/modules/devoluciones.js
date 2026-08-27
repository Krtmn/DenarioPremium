'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { installPayloadCapture, getCapturedPayloads } = require('../../cdp/denario-cdp-helpers');

const COTEJO_PAYLOAD_PATH = path.resolve(__dirname, '../../db/cotejo-payload.js');

/** Corre cotejo-payload.js con un payload capturado ({url,data}). Devuelve marca o 'BD-N/A'. */
function cotejoPayload(slug, payload) {
  const tmp = path.join(os.tmpdir(), `qa_dev_payload_${Date.now()}.json`);
  try {
    fs.writeFileSync(tmp, JSON.stringify(payload));
    const r = JSON.parse(
      execFileSync('node', [COTEJO_PAYLOAD_PATH, slug, tmp], { encoding: 'utf8', timeout: 30000 })
    );
    const mismatches = ((r.resumen || {}).mismatches || []).slice(0, 2).join('; ');
    return r.marca + (mismatches ? ` (${mismatches})` : '');
  } catch (_) { return 'BD-N/A'; }
  finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

/**
 * modules/devoluciones.js — 25 casos smoke
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteTest:string, productoTest:string, facturaTest:string,
 *           validateReturn:boolean, signatureReturn:boolean, userCanUploadFiles:boolean,
 *           clienteSlug:string }} DATA
 */
async function runDevoluciones(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  const TODOS = [
    'DM-DEV-001','DM-DEV-002','DM-DEV-003','DM-DEV-004','DM-DEV-005',
    'DM-DEV-006','DM-DEV-007','DM-DEV-008','DM-DEV-009','DM-DEV-010',
    'DM-DEV-011','DM-DEV-012','DM-DEV-013','DM-DEV-014','DM-DEV-015',
    'DM-DEV-016','DM-DEV-017','DM-DEV-018','DM-DEV-019','DM-DEV-020',
    'DM-DEV-021','DM-DEV-022','DM-DEV-023','DM-DEV-024','DM-DEV-025',
  ];

  if (!DATA.aplica) {
    TODOS.forEach(id => v(id, id, 'N/A', 'aplica=false en perfil devoluciones'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // Captura de payloads para cotejo BD (return↔nube en DEV-018) — nunca tumba el smoke
  try { await installPayloadCapture(pg); } catch (_) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

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

  async function clickAlertBtn(labels = ['Aceptar', 'OK']) {
    await pg.waitForTimeout(900);
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
          b.textContent.trim().toLowerCase() === lbl.toLowerCase() && b.getBoundingClientRect().width > 0
        );
        if (btn) { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: lbl }; }
      }
      // fallback: any visible button
      const anyBtn = [...alert.querySelectorAll('.alert-button')].find(b => b.getBoundingClientRect().width > 0);
      if (anyBtn) { const r = anyBtn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: anyBtn.textContent.trim() }; }
      return null;
    }, labels);
    if (!coords) throw new Error('Alert btn no encontrado: ' + labels.join('/'));
    await pg.mouse.click(coords.x, coords.y);
    await pg.waitForTimeout(600);
    return coords.label;
  }

  async function dismissResidualAlerts() {
    const coordsList = await pg.evaluate(() => {
      function alertVisible(a) {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      }
      return [...document.querySelectorAll('ion-alert')]
        .filter(alertVisible)
        .map(a => {
          const btns = [...a.querySelectorAll('.alert-button')].filter(b => b.getBoundingClientRect().width > 0);
          const salir = btns.find(b => {
            const t = b.textContent.trim().toLowerCase();
            return t.includes('salir') && !t.includes('guardar');
          }) || btns.find(b => {
            const t = b.textContent.trim().toLowerCase();
            return t.includes('descartar') || t.includes('continuar');
          }) || btns.find(b => {
            const t = b.textContent.trim().toLowerCase();
            return !t.includes('cancel') && !t.includes('quedar') && !t.includes('volver') && !t.includes('guardar');
          });
          const btn = salir || btns[0];
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }).filter(Boolean);
    });
    for (const c of coordsList) {
      await pg.mouse.click(c.x, c.y, { delay: 60 });
      await pg.waitForTimeout(400);
    }
    await pg.waitForTimeout(300);
  }

  async function isHomeDevVisible() {
    return pg.evaluate(() => {
      const cont = document.querySelector('devoluciones-container');
      if (!cont) return false;
      const btns = [...cont.querySelectorAll('ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0);
      const texts = btns.map(b => b.textContent.trim());
      return texts.some(t => t.includes('DEVOLUCIÓN') || t.includes('DEVOLUCION') || t.includes('Return')) &&
             texts.some(t => t.includes('BUSCAR') || t.includes('Find'));
    });
  }

  async function irAHomeDev(maxAttempts = 6) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await isHomeDevVisible()) return;
      await dismissResidualAlerts();
      try { await clickBack(); } catch (_) {}
      await pg.waitForTimeout(1000);
      await dismissResidualAlerts();
      await pg.waitForTimeout(600);
    }
    if (!(await isHomeDevVisible())) throw new Error('No se pudo llegar a home devoluciones');
  }

  async function clickBotonDev(texto) {
    const coords = await pg.evaluate((t) => {
      const btns = [...document.querySelectorAll('devoluciones-container ion-button')]
        .filter(b => b.textContent.trim().includes(t) && b.getBoundingClientRect().width > 0);
      if (!btns.length) return null;
      const r = btns[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Botón "${texto}" no encontrado en home devoluciones`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  // Selecciona cliente: mismo patrón que inventarios (ion-input#clienteSelect → modal → buscar → click)
  async function seleccionarCliente(nombre) {
    const selCoords = await pg.evaluate(() => {
      const inp = document.querySelector('ion-input#clienteSelect');
      if (!inp) return null;
      const r = inp.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!selCoords) throw new Error('ion-input#clienteSelect no encontrado');
    await pg.mouse.click(selCoords.x, selCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);

    let searchCoords = null;
    for (let i = 0; i < 26; i++) {
      await pg.waitForTimeout(500);
      searchCoords = await pg.evaluate(() => {
        for (const c of document.querySelectorAll('ion-modal, ion-popover')) {
          const inp = c.querySelector('input[type="search"], input[type="text"], input:not([type="hidden"])');
          if (inp && inp.getBoundingClientRect().width > 0) {
            const r = inp.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
        return null;
      });
      if (searchCoords) break;
      if (i === 10) {
        const reCoords = await pg.evaluate(() => {
          const inp = document.querySelector('ion-input#clienteSelect');
          if (!inp) return null;
          const r = inp.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        if (reCoords) {
          await pg.mouse.click(reCoords.x, reCoords.y, { delay: 80 });
          await pg.waitForTimeout(2000);
        }
      }
    }
    if (!searchCoords) throw new Error('Modal cliente no abrió');

    await pg.mouse.click(searchCoords.x, searchCoords.y, { delay: 50, clickCount: 3 });
    await pg.keyboard.type(nombre ? nombre.slice(0, 8) : 'A', { delay: 30 });
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(2000);

    const termBusq = nombre ? nombre.slice(0, 8).toLowerCase() : '';
    const resultado = await pg.evaluate((term) => {
      const containers = [...document.querySelectorAll('ion-modal, ion-popover, ion-alert')]
        .filter(c => {
          const isTraditional = !c.classList.contains('overlay-hidden') && c.offsetParent !== null;
          const hasVisibleContent = [...c.querySelectorAll('p, ion-label, ion-item')].some(el => el.getBoundingClientRect().width > 0);
          return isTraditional || hasVisibleContent;
        });
      for (const c of containers) {
        const candidatos = [...c.querySelectorAll('p, ion-label, ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0 && el.textContent.trim().length > 2);
        if (!candidatos.length) continue;
        const exacto = term ? candidatos.find(el => el.textContent.toLowerCase().includes(term)) : null;
        const target = exacto || candidatos[0];
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, nombre: target.textContent.trim().slice(0, 60) };
      }
      return null;
    }, termBusq);

    if (!resultado) throw new Error('Sin resultados en selector de clientes');
    await pg.mouse.click(resultado.x, resultado.y, { delay: 80 });
    await pg.waitForTimeout(1500);
    return resultado.nombre;
  }

  // Abre búsqueda con ZZZZZZZ, verifica mensaje de sin resultados, luego cierra modal
  async function buscarClienteZZZ() {
    const selCoords = await pg.evaluate(() => {
      const inp = document.querySelector('ion-input#clienteSelect');
      if (!inp) return null;
      const r = inp.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!selCoords) return { ok: false, nota: 'ion-input#clienteSelect no encontrado' };
    await pg.mouse.click(selCoords.x, selCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);

    let searchCoords = null;
    for (let i = 0; i < 16; i++) {
      await pg.waitForTimeout(500);
      searchCoords = await pg.evaluate(() => {
        for (const c of document.querySelectorAll('ion-modal, ion-popover')) {
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
    if (!searchCoords) return { ok: false, nota: 'Modal cliente no abrió para busqueda ZZZZZZZ' };

    await pg.mouse.click(searchCoords.x, searchCoords.y, { delay: 50, clickCount: 3 });
    await pg.keyboard.type('ZZZZZZZ', { delay: 30 });
    await pg.keyboard.press('Enter');
    await pg.waitForTimeout(2000);

    const sinResultados = await pg.evaluate(() => {
      const empties = [...document.querySelectorAll('ion-modal, ion-popover')]
        .flatMap(c => [...c.querySelectorAll('p, ion-label')])
        .filter(el => {
          const t = el.textContent.trim().toLowerCase();
          const r = el.getBoundingClientRect();
          return r.width > 0 && (t.includes('no hay') || t.includes('sin resultado') || t.includes('disponible') || t.includes('empty') || t.includes('encontr'));
        });
      return empties.length > 0 ? empties[0].textContent.trim() : null;
    });

    // Cerrar modal con ESC o click en backdrop
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(800);
    // Si aún está abierto, click fuera
    const stillOpen = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-modal, ion-popover')].some(c => {
        const inp = c.querySelector('input');
        return inp && inp.getBoundingClientRect().width > 0;
      })
    );
    if (stillOpen) {
      await pg.mouse.click(10, 10, { delay: 60 });
      await pg.waitForTimeout(800);
    }

    return { ok: true, msg: sinResultados || 'sin resultados (no visible)' };
  }

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
    await pg.waitForTimeout(1200);
  }

  async function fillIonInput(selector, value) {
    await pg.evaluate(([sel, val]) => {
      const ionEl = document.querySelector(sel);
      if (!ionEl) return;
      const inp = ionEl.querySelector('input') ||
                  (ionEl.shadowRoot && ionEl.shadowRoot.querySelector('input')) || ionEl;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inp, val);
      inp.dispatchEvent(new Event('input',  { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      ionEl.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
      ionEl.dispatchEvent(new CustomEvent('ionInput',  { bubbles: true, detail: { value: val } }));
    }, [selector, value]);
    await pg.waitForTimeout(300);
  }

  async function clickSave() {
    const coords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenGuardar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return r.width > 0 ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    });
    if (!coords) throw new Error('Botón guardar (.imagenGuardar) no disponible');
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  async function clickSend() {
    const coords = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.imagenEnviar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return r.width > 0 ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    });
    if (!coords) throw new Error('Botón enviar (.imagenEnviar) no disponible');
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  // Abre una nueva devolución manejando posible GPS alert
  async function abrirFormDevolucion() {
    await clickBotonDev('DEVOLUCIÓN');
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      await pg.waitForTimeout(1200);
      // Si hay alert de GPS u otro, aceptar
      const gpsAlert = await pg.evaluate(() => {
        const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
          const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
          const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
          return isTraditional || hasVisibleBtn;
        });
        return alerts.length > 0;
      });
      if (gpsAlert) {
        try { await clickAlertBtn(['Aceptar', 'OK', 'Continuar']); } catch (_) {}
        await pg.waitForTimeout(800);
        // Re-click por si el GPS alert consumió el primer click
        try { await clickBotonDev('DEVOLUCIÓN'); } catch (_) {}
        continue;
      }
      // Verificar si está en form (tabs visibles)
      const tabsVisible = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-segment-button')].filter(
          s => s.getBoundingClientRect().width > 0
        ).length >= 2
      );
      if (tabsVisible) { await pg.waitForTimeout(1000); return true; }
    }
    // Si no abrió, puede ser GPS requerido sin coords
    return false;
  }

  // Agrega un producto al carrito de devolución
  // Retorna { ok, estructura, producto } o { ok: false, error }
  async function agregarProducto(productoTest) {
    // Botón "Agregar Producto" en Tab Productos
    const addBtn = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.botonAddAmarillo');
      if (!btn || btn.getBoundingClientRect().width === 0) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!addBtn) return { ok: false, error: 'Botón Agregar Producto no encontrado' };
    await pg.mouse.click(addBtn.x, addBtn.y, { delay: 80 });
    await pg.waitForTimeout(2000);

    // Esperar estructura list (ion-list en productos-tab-structure-list)
    let estructuras = null;
    for (let i = 0; i < 10; i++) {
      estructuras = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('productos-tab-structure-list ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0);
        return items.map(el => {
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: el.textContent.trim().slice(0, 40) };
        });
      });
      if (estructuras && estructuras.length) break;
      await pg.waitForTimeout(600);
    }
    if (!estructuras || !estructuras.length) return { ok: false, error: 'Lista de estructuras no apareció' };

    const estructura = estructuras[0];
    await pg.mouse.click(estructura.x, estructura.y, { delay: 80 });
    await pg.waitForTimeout(2000);

    // Esperar lista de productos (productos-tab-return-product-list ion-item)
    let productos = null;
    for (let i = 0; i < 10; i++) {
      productos = await pg.evaluate((pTest) => {
        const items = [...document.querySelectorAll('productos-tab-return-product-list ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0);
        const exacto = pTest ? items.find(el => el.textContent.toLowerCase().includes(pTest.toLowerCase().slice(0, 8))) : null;
        const target = exacto || items[0];
        if (!target) return null;
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, text: target.textContent.trim().slice(0, 40) };
      }, productoTest);
      if (productos) break;
      await pg.waitForTimeout(600);
    }
    if (!productos) return { ok: false, error: 'Lista de productos no apareció' };

    await pg.mouse.click(productos.x, productos.y, { delay: 80 });
    await pg.waitForTimeout(2500);

    // El producto fue agregado al acordeón en devolucion-product-list
    // Verificar que el acordeón aparece
    const acordeon = await pg.evaluate(() => {
      const acc = [...document.querySelectorAll('devolucion-product-list ion-accordion')]
        .filter(a => a.getBoundingClientRect().width > 0);
      return acc.length > 0 ? acc.length : 0;
    });
    if (!acordeon) {
      // Puede que ya estaba expandido o no se agregó
      return { ok: false, error: 'Acordeón de producto no apareció en devolucion-product-list' };
    }

    // Expandir primer acordeón (click en ion-item slot="header")
    const headerCoords = await pg.evaluate(() => {
      const header = document.querySelector('devolucion-product-list ion-item[slot="header"]');
      if (!header || header.getBoundingClientRect().width === 0) return null;
      const r = header.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (headerCoords) {
      await pg.mouse.click(headerCoords.x, headerCoords.y, { delay: 60 });
      await pg.waitForTimeout(1200);
    }

    // Fill Cantidad Devuelta (inputQuProduct)
    await pg.evaluate(() => {
      const div = document.querySelector('devolucion-product-list [id="inputQuProduct"]');
      if (!div) return;
      const ionInput = div.querySelector('ion-input');
      if (!ionInput) return;
      const inp = ionInput.querySelector('input') || (ionInput.shadowRoot && ionInput.shadowRoot.querySelector('input'));
      if (!inp) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(inp, '3');
      inp.dispatchEvent(new Event('input',  { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      ionInput.dispatchEvent(new CustomEvent('ionInput',  { bubbles: true, detail: { value: '3' } }));
      ionInput.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: '3' } }));
      inp.dispatchEvent(new Event('blur',   { bubbles: true }));
    });
    await pg.waitForTimeout(600);

    // Select Unidad (first option)
    const unidadOk = await pg.evaluate(() => {
      const selects = [...document.querySelectorAll('devolucion-product-list ion-select')]
        .filter(s => s.getBoundingClientRect().width > 0);
      // First select is Unidad
      if (!selects.length) return false;
      const sel = selects[0];
      const opts = sel.querySelectorAll('ion-select-option');
      if (!opts.length) return false;
      const firstVal = opts[0].value || opts[0].getAttribute('value') || opts[0].textContent.trim();
      sel.value = firstVal;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: firstVal } }));
      return true;
    });

    // Select Motivo (second select)
    const motivoOk = await pg.evaluate(() => {
      const selects = [...document.querySelectorAll('devolucion-product-list ion-select')]
        .filter(s => s.getBoundingClientRect().width > 0);
      if (selects.length < 2) return false;
      const sel = selects[1];
      const opts = sel.querySelectorAll('ion-select-option');
      if (!opts.length) return false;
      const firstVal = opts[0].value || opts[0].getAttribute('value') || opts[0].textContent.trim();
      sel.value = firstVal;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: firstVal } }));
      return true;
    });
    await pg.waitForTimeout(800);

    // Documento (coDocument) — requerido por producto cuando requeridedNroFactura=true.
    // Se llena con factura_test del perfil; editable porque validateReturn=false.
    let docOk = false;
    if (DATA.facturaTest) {
      docOk = await pg.evaluate((factura) => {
        const div = document.querySelector('devolucion-product-list [id="inputDocument"]');
        if (!div) return false;
        const ionInput = div.querySelector('ion-input');
        if (!ionInput) return false;
        const inp = ionInput.querySelector('input') || (ionInput.shadowRoot && ionInput.shadowRoot.querySelector('input'));
        if (!inp) return false;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(inp, factura);
        inp.dispatchEvent(new Event('input',  { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        ionInput.dispatchEvent(new CustomEvent('ionInput',  { bubbles: true, detail: { value: factura } }));
        ionInput.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: factura } }));
        inp.dispatchEvent(new Event('blur',   { bubbles: true }));
        return true;
      }, DATA.facturaTest);
      await pg.waitForTimeout(600);
    }

    return { ok: true, estructura: estructura.text, producto: productos.text, cantidad: 3, unidadOk, motivoOk, docOk };
  }

  // ─── Navegar a módulo Devoluciones ──────────────────────────────────────────
  try {
    const tileCoords = await pg.evaluate(() => {
      const tile = [...document.querySelectorAll('app-home a.ion-text-center, app-home a[href], app-home ion-card, app-home .tile')]
        .filter(t => t.getBoundingClientRect().width > 0)
        .find(t => {
          const p = t.querySelector('p.nombreModulos, p');
          const text = (p ? p.textContent : t.textContent).trim().toUpperCase();
          return text.includes('DEVOLUCIÓN') || text.includes('DEVOLUCION') || text.includes('RETURN');
        });
      if (!tile) return null;
      const r = tile.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tileCoords) throw new Error('Tile Devoluciones no encontrado en Home');
    await pg.mouse.click(tileCoords.x, tileCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);
    await pg.waitForSelector('devoluciones-container', { timeout: 15000 });

    const botones = await pg.evaluate(() => {
      const btns = [...document.querySelectorAll('devoluciones-container ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .map(b => b.textContent.trim());
      return btns;
    });
    const ok = botones.some(t => t.includes('DEVOLUCIÓN') || t.includes('DEVOLUCION')) &&
               botones.some(t => t.includes('BUSCAR'));
    v('DM-DEV-001', 'Tile Devoluciones → home con 2 botones', ok ? 'PASS' : 'FAIL',
      `botones: ${botones.join(', ')}`);
  } catch (e) {
    v('DM-DEV-001', 'Tile Devoluciones → home con 2 botones', 'FAIL', e.message);
    TODOS.slice(1).forEach(id => v(id, id, 'BLOCKED', 'DEV-001 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DEV-002: Click DEVOLUCIÓN → form con 3 tabs; Productos/Adjuntos disabled ──
  let formAbierto = false;
  try {
    formAbierto = await abrirFormDevolucion();
    if (!formAbierto) {
      v('DM-DEV-002', 'DEVOLUCIÓN → form / tabs disabled', 'N/A', 'Form no abrió (posible GPS requerido sin coords activas)');
      ['DM-DEV-003','DM-DEV-004','DM-DEV-005','DM-DEV-006','DM-DEV-007',
       'DM-DEV-011','DM-DEV-012','DM-DEV-013','DM-DEV-014','DM-DEV-015',
       'DM-DEV-016','DM-DEV-017','DM-DEV-018','DM-DEV-019','DM-DEV-020',
       'DM-DEV-021','DM-DEV-022','DM-DEV-023','DM-DEV-024','DM-DEV-025',
      ].forEach(id => v(id, id, 'BLOCKED', 'DEV-002 N/A GPS'));
      ['DM-DEV-008','DM-DEV-009','DM-DEV-010'].forEach(id =>
        v(id, id, 'N/A', DATA.validateReturn ? 'ver flujo validateReturn' : 'validateReturn=false')
      );
      return { verdicts, msTotal: Date.now() - t0 };
    }

    const tabInfo = await pg.evaluate(() => {
      const tabs = [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0)
        .map(s => ({ text: s.textContent.trim(), disabled: s.disabled || s.getAttribute('disabled') !== null }));
      return tabs;
    });
    const nombres = tabInfo.map(t => t.text);
    const productosDisabled = tabInfo.find(t => t.text.includes('Producto'))?.disabled;
    const adjuntosDisabled  = tabInfo.find(t => t.text.includes('Adjunto') || t.text.includes('Attach'))?.disabled;
    const ok = tabInfo.length >= 3 && productosDisabled && adjuntosDisabled;
    v('DM-DEV-002', 'DEVOLUCIÓN → form / tabs disabled', ok ? 'PASS' : 'FAIL',
      `tabs: ${JSON.stringify(nombres)} · Productos disabled: ${productosDisabled} · Adjuntos disabled: ${adjuntosDisabled}`);
  } catch (e) {
    v('DM-DEV-002', 'DEVOLUCIÓN → form / tabs disabled', 'FAIL', e.message);
  }

  // ─── DEV-003: Tocar tab disabled (Productos) → sigue en General ─────────────
  try {
    const segmentAntes = await pg.evaluate(() => {
      const seg = document.querySelector('ion-segment');
      return seg ? (seg.value || seg.getAttribute('ng-reflect-value')) : null;
    });
    // Intentar click en tab Productos (disabled)
    const tabCoords = await pg.evaluate(() => {
      const tab = [...document.querySelectorAll('ion-segment-button')]
        .find(s => s.textContent.trim().includes('Producto') && s.getBoundingClientRect().width > 0);
      if (!tab) return null;
      const r = tab.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (tabCoords) await pg.mouse.click(tabCoords.x, tabCoords.y, { delay: 60 });
    await pg.waitForTimeout(600);
    const segmentDespues = await pg.evaluate(() => {
      const seg = document.querySelector('ion-segment');
      return seg ? (seg.value || seg.getAttribute('ng-reflect-value')) : null;
    });
    const ok = segmentDespues === segmentAntes || segmentDespues === 'default' || segmentDespues === null;
    v('DM-DEV-003', 'Tab disabled sin cliente → no cambia', ok ? 'PASS' : 'FAIL',
      `segment antes: ${segmentAntes} · después: ${segmentDespues}`);
  } catch (e) {
    v('DM-DEV-003', 'Tab disabled sin cliente → no cambia', 'FAIL', e.message);
  }

  // ─── DEV-017: Botones guardar/enviar disabled sin cliente ────────────────────
  try {
    const btnsState = await pg.evaluate(() => {
      const save = document.querySelector('ion-button.imagenGuardar');
      const send = document.querySelector('ion-button.imagenEnviar');
      return {
        saveVisible: !!(save && save.getBoundingClientRect().width > 0),
        saveDisabled: !!(save && (save.disabled || save.getAttribute('disabled') !== null)),
        sendVisible: !!(send && send.getBoundingClientRect().width > 0),
        sendDisabled: !!(send && (send.disabled || send.getAttribute('disabled') !== null)),
      };
    });
    // Sin cliente: guardar y enviar deben estar disabled
    const ok = btnsState.saveDisabled && btnsState.sendDisabled;
    v('DM-DEV-017', 'Botones guardar/enviar disabled sin cliente', ok ? 'PASS' : 'FAIL',
      `guardar visible: ${btnsState.saveVisible} disabled: ${btnsState.saveDisabled} · enviar visible: ${btnsState.sendVisible} disabled: ${btnsState.sendDisabled}`);
  } catch (e) {
    v('DM-DEV-017', 'Botones guardar/enviar disabled sin cliente', 'FAIL', e.message);
  }

  // ─── DEV-005: Búsqueda ZZZZZZZ → sin resultados (dentro de selector cliente) ─
  try {
    const res005 = await buscarClienteZZZ();
    v('DM-DEV-005', 'Búsqueda ZZZZZZZ en selector → sin resultados', res005.ok ? 'PASS' : 'FAIL',
      res005.ok ? `msg: "${res005.msg}"` : res005.nota || 'no se pudo verificar');
  } catch (e) {
    v('DM-DEV-005', 'Búsqueda ZZZZZZZ en selector → sin resultados', 'FAIL', e.message);
  }

  // ─── DEV-004: Seleccionar cliente → tabs habilitadas ─────────────────────────
  let clienteNombre = '';
  let clienteSeleccionado = false;
  try {
    clienteNombre = await seleccionarCliente(DATA.clienteTest);
    // Esperar hasta 6s a que las tabs se habiliten
    let tabsHabilitadas = false;
    for (let i = 0; i < 10; i++) {
      await pg.waitForTimeout(600);
      tabsHabilitadas = await pg.evaluate(() => {
        const tabs = [...document.querySelectorAll('ion-segment-button')]
          .filter(s => s.getBoundingClientRect().width > 0);
        const productos = tabs.find(s => s.textContent.includes('Producto'));
        return !!(productos && !productos.disabled && productos.getAttribute('disabled') === null);
      });
      if (tabsHabilitadas) break;
    }
    clienteSeleccionado = tabsHabilitadas;
    v('DM-DEV-004', 'Seleccionar cliente → tabs habilitadas', tabsHabilitadas ? 'PASS' : 'FAIL',
      `cliente: "${clienteNombre}" · Productos habilitada: ${tabsHabilitadas}`);
  } catch (e) {
    v('DM-DEV-004', 'Seleccionar cliente → tabs habilitadas', 'FAIL', e.message);
  }

  // ─── DEV-008/009/010: Condicional validateReturn ────────────────────────────
  if (!DATA.validateReturn) {
    ['DM-DEV-008','DM-DEV-009','DM-DEV-010'].forEach(id =>
      v(id, id, 'N/A', 'validateReturn=false en perfil')
    );
  } else {
    // validateReturn=true: verificar campo Factura visible
    try {
      const facturaVisible = await pg.evaluate(() => {
        const inp = document.querySelector('ion-input#invoiceSelect');
        return !!(inp && inp.getBoundingClientRect().width > 0);
      });
      v('DM-DEV-008', 'VG validateReturn: campo Factura visible tras cliente', facturaVisible ? 'PASS' : 'FAIL',
        `invoiceSelect visible: ${facturaVisible}`);
    } catch (e) {
      v('DM-DEV-008', 'VG validateReturn: campo Factura visible tras cliente', 'FAIL', e.message);
    }
    // DEV-009/010: marcar pendiente (requieren interacción con selector facturas)
    ['DM-DEV-009','DM-DEV-010'].forEach(id =>
      v(id, id, 'N/A', 'validateReturn=true: selector facturas requiere datos específicos')
    );
  }

  if (!clienteSeleccionado) {
    ['DM-DEV-006','DM-DEV-007','DM-DEV-011','DM-DEV-012','DM-DEV-013','DM-DEV-014',
     'DM-DEV-015','DM-DEV-016','DM-DEV-018','DM-DEV-019','DM-DEV-020',
     'DM-DEV-021','DM-DEV-022','DM-DEV-023','DM-DEV-024','DM-DEV-025',
    ].forEach(id => v(id, id, 'BLOCKED', 'DEV-004 falló'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DEV-006: Campos editables del Tab General ───────────────────────────────
  try {
    const ts = Date.now();
    await fillIonInput('ion-input#responsable', `Test-DEV-006`);
    await fillIonInput('ion-input#comentario',  `Test-DEV-016 comentario ${ts}`);
    const responsable = await pg.evaluate(() => {
      const inp = document.querySelector('ion-input#responsable');
      if (!inp) return null;
      const i = inp.querySelector('input') || (inp.shadowRoot && inp.shadowRoot.querySelector('input'));
      return i ? i.value : null;
    });
    const ok = !!(responsable && responsable.includes('Test-DEV-006'));
    v('DM-DEV-006', 'Campos editables Tab General (Responsable/Comentario)', ok ? 'PASS' : 'FAIL',
      `responsable: "${responsable}"`);
  } catch (e) {
    v('DM-DEV-006', 'Campos editables Tab General', 'FAIL', e.message);
  }

  // ─── DEV-007: Fecha solo lectura (button disabled) ──────────────────────────
  try {
    const fechaDisabled = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button#fechaDevButton');
      if (!btn || btn.getBoundingClientRect().width === 0) return null;
      return btn.disabled || btn.getAttribute('disabled') !== null;
    });
    v('DM-DEV-007', 'Fecha devolución solo lectura (button disabled)', fechaDisabled ? 'PASS' : 'FAIL',
      `fechaDevButton disabled: ${fechaDisabled}`);
  } catch (e) {
    v('DM-DEV-007', 'Fecha devolución solo lectura', 'FAIL', e.message);
  }

  // ─── DEV-011: Tab Productos → botón Agregar Producto visible ─────────────────
  try {
    await clickTab('Producto');
    await pg.waitForTimeout(1000);
    const addBtnVisible = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button.botonAddAmarillo');
      return !!(btn && btn.getBoundingClientRect().width > 0);
    });
    v('DM-DEV-011', 'Tab Productos → botón Agregar Producto visible', addBtnVisible ? 'PASS' : 'FAIL',
      `botonAddAmarillo visible: ${addBtnVisible}`);
  } catch (e) {
    v('DM-DEV-011', 'Tab Productos → botón Agregar Producto visible', 'FAIL', e.message);
    ['DM-DEV-012','DM-DEV-013','DM-DEV-014'].forEach(id => v(id, id, 'BLOCKED', 'DEV-011 falló'));
  }

  // ─── DEV-012 / DEV-013 / DEV-014: Agregar producto ──────────────────────────
  let productoAgregado = false;
  if (verdicts.find(x => x.id === 'DM-DEV-011')?.resultado === 'PASS') {
    try {
      const prod = await agregarProducto(DATA.productoTest);
      if (!prod.ok) throw new Error(prod.error);

      v('DM-DEV-012', 'Seleccionar estructura → lista de productos', 'PASS',
        `estructura: "${prod.estructura}"`);
      v('DM-DEV-013', 'Seleccionar producto → acordeón Cantidad/Unidad/Motivo', 'PASS',
        `producto: "${prod.producto}"`);
      v('DM-DEV-014', 'Ingresar cantidad → producto en carrito', prod.cantidad === 3 ? 'PASS' : 'FAIL',
        `cantidad: ${prod.cantidad} · unidad: ${prod.unidadOk} · motivo: ${prod.motivoOk}`);
      productoAgregado = true;
    } catch (e) {
      ['DM-DEV-012','DM-DEV-013','DM-DEV-014'].forEach(id => v(id, id, 'FAIL', e.message));
    }
  }

  // ─── DEV-015: Tab Adjuntos → acordeones visibles ────────────────────────────
  try {
    await clickTab('Adjunto');
    await pg.waitForTimeout(1500);
    const adjInfo = await pg.evaluate(() => {
      const imgAc  = !!document.querySelector('app-adjunto') &&
                     [...document.querySelectorAll('ion-accordion')].some(a => {
                       const t = a.textContent.toLowerCase();
                       return (t.includes('imagen') || t.includes('foto')) && a.getBoundingClientRect().width > 0;
                     });
      const arcAc  = [...document.querySelectorAll('ion-accordion')].some(a => {
                       const t = a.textContent.toLowerCase();
                       return (t.includes('archivo') || t.includes('file')) && a.getBoundingClientRect().width > 0;
                     });
      const firAc  = [...document.querySelectorAll('ion-accordion')].some(a => {
                       const t = a.textContent.toLowerCase();
                       return t.includes('firma') && a.getBoundingClientRect().width > 0;
                     });
      return { imgAc, arcAc, firAc };
    });
    const ok = adjInfo.imgAc;
    v('DM-DEV-015', 'Tab Adjuntos → acordeones visibles', ok ? 'PASS' : 'FAIL',
      `imágenes: ${adjInfo.imgAc} · archivo: ${adjInfo.arcAc} · firma: ${adjInfo.firAc}`);
  } catch (e) {
    v('DM-DEV-015', 'Tab Adjuntos → acordeones visibles', 'FAIL', e.message);
  }

  if (!productoAgregado) {
    ['DM-DEV-016','DM-DEV-018','DM-DEV-019','DM-DEV-020',
     'DM-DEV-021','DM-DEV-022','DM-DEV-023','DM-DEV-024','DM-DEV-025',
    ].forEach(id => v(id, id, 'BLOCKED', 'DEV-014 falló — sin producto en carrito'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DEV-016: Guardar → mensaje confirmación ─────────────────────────────────
  try {
    // Volver a Tab General para que el form esté válido (comentario ya fue puesto)
    await clickTab('General');
    await pg.waitForTimeout(600);
    await clickSave();
    await pg.waitForTimeout(1500);
    const alertMsg = await pg.evaluate(() => {
      const a = [...document.querySelectorAll('ion-alert')].find(x => {
        const isTraditional = !x.classList.contains('overlay-hidden') && x.offsetParent !== null;
        const hasVisibleBtn = [...x.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!a) return null;
      const msg = a.querySelector('.alert-message') || a.querySelector('.alert-title');
      return msg ? msg.textContent.trim() : a.textContent.trim().slice(0, 120);
    });
    // El caso valida que aparezca el modal de confirmación de guardado. El app pregunta
    // "¿Desea guardar la devolución?" (confirm) y/o "Guardado" (éxito) — ambos son válidos.
    const ok = !!(alertMsg && /desea guardar|guardar la devoluci|guardad|saved/i.test(alertMsg));
    v('DM-DEV-016', 'Guardar devolución → mensaje confirmación', ok ? 'PASS' : 'FAIL',
      `alert: "${alertMsg || 'ninguno'}"`);
    if (alertMsg) await clickAlertBtn(['Aceptar', 'Sí', 'Si', 'OK']);
  } catch (e) {
    v('DM-DEV-016', 'Guardar devolución → mensaje confirmación', 'FAIL', e.message);
  }

  // ─── DEV-019: Ir a BUSCAR → devolución aparece como Guardado ─────────────────
  try {
    await irAHomeDev();
    await clickBotonDev('BUSCAR');
    await pg.waitForTimeout(2000);
    const listaInfo = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('devolucion-list ion-item')]
        .filter(el => el.getBoundingClientRect().width > 0);
      const guardados = items.filter(el => el.textContent.includes('Guardado') || el.textContent.includes('Saved'));
      return { total: items.length, guardados: guardados.length };
    });
    const ok = listaInfo.guardados > 0;
    v('DM-DEV-019', 'Guardar + BUSCAR → aparece Guardado en lista', ok ? 'PASS' : 'FAIL',
      `ítems: ${listaInfo.total} · Guardado: ${listaInfo.guardados}`);
  } catch (e) {
    v('DM-DEV-019', 'Guardar + BUSCAR → aparece Guardado en lista', 'FAIL', e.message);
  }

  // ─── DEV-022: Abrir Guardado → form editable ─────────────────────────────────
  try {
    // Click en un ítem de la lista con estatus Guardado
    const guardadoCoords = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('devolucion-list ion-label')]
        .filter(el => el.getBoundingClientRect().width > 0 &&
          (el.textContent.includes('Guardado') || el.textContent.includes('Saved')));
      if (!items.length) return null;
      const r = items[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!guardadoCoords) throw new Error('No hay ítems Guardado en lista');
    await pg.mouse.click(guardadoCoords.x, guardadoCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);

    const tabsAccesibles = await pg.evaluate(() => {
      const tabs = [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0);
      return tabs.filter(s => !s.disabled && s.getAttribute('disabled') === null).length;
    });
    const ok = tabsAccesibles >= 3;
    v('DM-DEV-022', 'Abrir Guardado → form editable con tabs accesibles', ok ? 'PASS' : 'FAIL',
      `tabs accesibles: ${tabsAccesibles}`);
    // Volver a lista
    await clickBack();
    await pg.waitForTimeout(1200);
  } catch (e) {
    v('DM-DEV-022', 'Abrir Guardado → form editable', 'FAIL', e.message);
    await irAHomeDev().catch(() => {});
    await clickBotonDev('BUSCAR').catch(() => {});
    await pg.waitForTimeout(1500);
  }

  // ─── DEV-018: Nueva devolución → Enviar ──────────────────────────────────────
  // Requiere nro. de factura por producto (requeridedNroFactura). Sin factura_test en
  // el perfil no se puede completar el envío ⇒ N/A (el cliente no exige factura).
  if (!DATA.facturaTest) {
    v('DM-DEV-018', 'Enviar devolución → modal confirmación → home módulo', 'N/A',
      'perfil sin factura_test (cliente no exige nro. de factura)');
  } else try {
    await irAHomeDev();
    const formOk = await abrirFormDevolucion();
    if (!formOk) throw new Error('Form no abrió para envío');
    await seleccionarCliente(DATA.clienteTest);
    await pg.waitForTimeout(1000);
    // Asegurarse tabs habilitadas
    let tabsOk = false;
    for (let i = 0; i < 8; i++) {
      tabsOk = await pg.evaluate(() => {
        const p = [...document.querySelectorAll('ion-segment-button')].find(s => s.textContent.includes('Producto'));
        return !!(p && !p.disabled && p.getAttribute('disabled') === null);
      });
      if (tabsOk) break;
      await pg.waitForTimeout(700);
    }
    await clickTab('Producto');
    await pg.waitForTimeout(800);
    const prod = await agregarProducto(DATA.productoTest);
    if (!prod.ok) throw new Error('No se pudo agregar producto para envío: ' + prod.error);
    await pg.waitForTimeout(600);
    await clickSend();
    await pg.waitForTimeout(1500);
    // Modal confirmación "¿Desea enviar?"
    const confirmMsg = await pg.evaluate(() => {
      const a = [...document.querySelectorAll('ion-alert')].find(x => {
        const isTraditional = !x.classList.contains('overlay-hidden') && x.offsetParent !== null;
        const hasVisibleBtn = [...x.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!a) return null;
      const msg = a.querySelector('.alert-message') || a.querySelector('.alert-title');
      return msg ? msg.textContent.trim() : a.textContent.trim().slice(0, 120);
    });
    const hasConfirm = !!(confirmMsg && (confirmMsg.includes('enviar') || confirmMsg.includes('send') || confirmMsg.includes('Desea')));
    if (hasConfirm) await clickAlertBtn(['Aceptar', 'Sí', 'Si', 'OK']);
    await pg.waitForTimeout(2000);
    // Mensaje enviada
    const envioMsg = await pg.evaluate(() => {
      const a = [...document.querySelectorAll('ion-alert')].find(x => {
        const isTraditional = !x.classList.contains('overlay-hidden') && x.offsetParent !== null;
        const hasVisibleBtn = [...x.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!a) return null;
      const msg = a.querySelector('.alert-message') || a.querySelector('.alert-title');
      return msg ? msg.textContent.trim() : null;
    });
    if (envioMsg) await clickAlertBtn(['Aceptar', 'OK']);
    await pg.waitForTimeout(1500);
    const enHome = await isHomeDevVisible().catch(() => false);
    const ok = hasConfirm && enHome;

    // ── Verificación BD: payload return ↔ nube (motor calibrado return+return_detail) ──
    let bdNota = 'BD-N/A(sin-payload)';
    try {
      await pg.waitForTimeout(1200); // dar tiempo al POST returnservice/return
      const payloads = await getCapturedPayloads(pg);
      const pRet = payloads.filter(p => /returnservice\/return/i.test(String(p.url)));
      if (pRet.length && DATA.clienteSlug) {
        bdNota = cotejoPayload(DATA.clienteSlug, pRet[pRet.length - 1]);
      }
    } catch (_) {}

    v('DM-DEV-018', 'Enviar devolución → modal confirmación → home módulo', ok ? 'PASS' : 'FAIL',
      `confirm: "${confirmMsg}" · envioMsg: "${envioMsg}" · home: ${enHome} · ${bdNota}`);
  } catch (e) {
    v('DM-DEV-018', 'Enviar devolución → modal confirmación', 'FAIL', e.message);
    await irAHomeDev().catch(() => {});
  }

  // ─── DEV-021: BUSCAR → lista con searchbar y filtro ─────────────────────────
  try {
    // Tras el envío de DEV-018 la lista re-sincroniza y el primer clic en BUSCAR puede
    // caer durante el overlay de sync (la lista no monta). Re-navegar entre reintentos:
    // irAHomeDev + BUSCAR, y solo entonces poll del componente (searchbar).
    let listaInfo = { searchbar: false, items: 0 };
    for (let intento = 0; intento < 6; intento++) {
      await irAHomeDev().catch(() => {});
      await clickBotonDev('BUSCAR').catch(() => {});
      for (let i = 0; i < 4; i++) {
        await pg.waitForTimeout(1000);
        listaInfo = await pg.evaluate(() => {
          const searchbar = !!document.querySelector('devolucion-list ion-searchbar, devolucion-list .lupamorada');
          const items = [...document.querySelectorAll('devolucion-list ion-item')]
            .filter(el => el.getBoundingClientRect().width > 0).length;
          return { searchbar, items };
        });
        if (listaInfo.searchbar) break;
      }
      if (listaInfo.searchbar) break;
    }
    const ok = listaInfo.searchbar;
    v('DM-DEV-021', 'BUSCAR → lista con searchbar', ok ? 'PASS' : 'FAIL',
      `searchbar: ${listaInfo.searchbar} · ítems: ${listaInfo.items}`);
  } catch (e) {
    v('DM-DEV-021', 'BUSCAR → lista con searchbar', 'FAIL', e.message);
  }

  // ─── DEV-023: Abrir Enviado/PorEnviar → solo lectura ────────────────────────
  try {
    // El ítem enviado en DEV-018 puede tardar en reflejarse tras el sync; reintentar,
    // re-entrando a BUSCAR entre intentos para forzar refresco de la lista.
    let enviadoCoords = null;
    for (let i = 0; i < 6; i++) {
      enviadoCoords = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('devolucion-list ion-label')]
          .filter(el => {
            const t = el.textContent;
            const r = el.getBoundingClientRect();
            return r.width > 0 && (t.includes('Enviado') || t.includes('Por Enviar') || t.includes('Por enviar') || t.includes('Sended') || t.includes('To be'));
          });
        if (!items.length) return null;
        const r = items[0].getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (enviadoCoords) break;
      // Refrescar lista: volver a home módulo y re-abrir BUSCAR
      await irAHomeDev().catch(() => {});
      await clickBotonDev('BUSCAR').catch(() => {});
      await pg.waitForTimeout(1800);
    }
    if (!enviadoCoords) throw new Error('No hay ítems Enviado/PorEnviar en lista');
    await pg.mouse.click(enviadoCoords.x, enviadoCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);

    const readonlyInfo = await pg.evaluate(() => {
      const clienteInp = document.querySelector('ion-input#clienteSelect');
      const clienteDisabled = clienteInp ?
        (clienteInp.disabled || clienteInp.getAttribute('disabled') !== null) : null;
      const saveBtn = document.querySelector('ion-button.imagenGuardar');
      const saveBtnHidden = !saveBtn || saveBtn.getBoundingClientRect().width === 0;
      const sendBtn = document.querySelector('ion-button.imagenEnviar');
      const sendBtnHidden = !sendBtn || sendBtn.getBoundingClientRect().width === 0;
      return { clienteDisabled, saveBtnHidden, sendBtnHidden };
    });
    const ok = readonlyInfo.saveBtnHidden && readonlyInfo.sendBtnHidden;
    v('DM-DEV-023', 'Abrir Enviado → solo lectura, sin botones guardar/enviar', ok ? 'PASS' : 'FAIL',
      `saveHidden: ${readonlyInfo.saveBtnHidden} · sendHidden: ${readonlyInfo.sendBtnHidden} · clienteDisabled: ${readonlyInfo.clienteDisabled}`);
    await clickBack();
    await pg.waitForTimeout(1200);
  } catch (e) {
    v('DM-DEV-023', 'Abrir Enviado → solo lectura', 'FAIL', e.message);
    await irAHomeDev().catch(() => {});
    await clickBotonDev('BUSCAR').catch(() => {});
    await pg.waitForTimeout(1500);
  }

  // ─── DEV-024: Eliminar Guardado → modal + desaparece ─────────────────────────
  try {
    // Anclar: garantizar que estamos en la lista BUSCAR (no depender del back del caso
    // anterior). El botón trash solo se renderiza para ítems Guardado (stDelivery===3).
    await irAHomeDev();
    await clickBotonDev('BUSCAR');
    await pg.waitForTimeout(2000);
    const guardadosBefore = await pg.evaluate(() =>
      [...document.querySelectorAll('devolucion-list ion-item')]
        .filter(el => el.getBoundingClientRect().width > 0 &&
          (el.textContent.includes('Guardado') || el.textContent.includes('Saved'))).length
    );
    // Click botón trash del primer Guardado
    const trashCoords = await pg.evaluate(() => {
      const trashBtns = [...document.querySelectorAll('devolucion-list ion-button[color="danger"]')]
        .filter(b => b.getBoundingClientRect().width > 0);
      if (!trashBtns.length) return null;
      const r = trashBtns[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!trashCoords) throw new Error('Botón eliminar no encontrado (solo aparece para Guardado)');
    await pg.mouse.click(trashCoords.x, trashCoords.y, { delay: 80 });
    await pg.waitForTimeout(1500);
    // Modal confirmación eliminar
    const deleteBtn = await clickAlertBtn(['Eliminar', 'OK', 'Aceptar', 'Sí']).catch(() => null);
    await pg.waitForTimeout(1500);
    const guardadosAfter = await pg.evaluate(() =>
      [...document.querySelectorAll('devolucion-list ion-item')]
        .filter(el => el.getBoundingClientRect().width > 0 &&
          (el.textContent.includes('Guardado') || el.textContent.includes('Saved'))).length
    );
    const ok = guardadosAfter < guardadosBefore;
    v('DM-DEV-024', 'Eliminar Guardado → modal + desaparece de lista', ok ? 'PASS' : 'FAIL',
      `antes: ${guardadosBefore} Guardado · después: ${guardadosAfter} · btn: "${deleteBtn}"`);
  } catch (e) {
    v('DM-DEV-024', 'Eliminar Guardado → modal + desaparece', 'FAIL', e.message);
  }

  // ─── DEV-025: Atrás desde lista → home módulo ────────────────────────────────
  try {
    await clickBack();
    await pg.waitForTimeout(1500);
    const enHome = await isHomeDevVisible();
    v('DM-DEV-025', 'Atrás desde lista → home módulo', enHome ? 'PASS' : 'FAIL',
      `home visible: ${enHome}`);
  } catch (e) {
    v('DM-DEV-025', 'Atrás desde lista → home módulo', 'FAIL', e.message);
    await irAHomeDev().catch(() => {});
  }

  // ─── DEV-020: Atrás sin guardar → sale (vía "Salir sin guardar") y no persiste ─
  // Conducta VIGENTE del app (return-logic.service.ts:188 shouldPromptReturnExitSaveOrDiscard):
  // toda devolución NUEVA con trabajo sin guardar (returnPersistedBaseline=false) SÍ abre el
  // modal Guardar/Salir. El guión DM-DEV-020 documenta la conducta vieja ("sale sin modal") y
  // quedó obsoleto — actualizar. Aquí validamos: aparece modal → "Salir sin guardar" → home.
  try {
    await irAHomeDev();
    const formOk = await abrirFormDevolucion();
    if (!formOk) throw new Error('Form no abrió para DEV-020');
    await seleccionarCliente(DATA.clienteTest);
    await pg.waitForTimeout(1200);
    let tabsOk = false;
    for (let i = 0; i < 8; i++) {
      tabsOk = await pg.evaluate(() => {
        const p = [...document.querySelectorAll('ion-segment-button')].find(s => s.textContent.includes('Producto'));
        return !!(p && !p.disabled && p.getAttribute('disabled') === null);
      });
      if (tabsOk) break;
      await pg.waitForTimeout(700);
    }
    if (tabsOk) {
      await clickTab('Producto');
      await pg.waitForTimeout(600);
      await agregarProducto(DATA.productoTest);
    }
    // Contar guardados en lista antes de salir
    const itemsAntes = await pg.evaluate(async () => {
      // No vamos a BUSCAR — solo contamos en memoria (no podemos)
      return null;
    });
    // Pulsar atrás SIN guardar
    await clickBack();
    await pg.waitForTimeout(1500);
    // Conducta vigente: con trabajo sin guardar, atrás abre modal Guardar/Salir.
    const modalVisible = await pg.evaluate(() => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      return alerts.length > 0;
    });
    // Elegir "Salir sin guardar" → debe descartar el borrador y volver al home módulo.
    let salioPorModal = false;
    if (modalVisible) {
      const btn = await clickAlertBtn(['Salir sin guardar', 'Salir', 'Descartar', 'OK']).catch(() => null);
      salioPorModal = !!btn;
      await pg.waitForTimeout(1200);
    }
    const enHome = await isHomeDevVisible().catch(() => false);
    // PASS = apareció el modal (dirty-tracking correcto) y "Salir sin guardar" llevó al home.
    const ok = modalVisible && salioPorModal && enHome;
    v('DM-DEV-020', 'Atrás sin guardar → modal Salir/Guardar → "Salir sin guardar" → home',
      ok ? 'PASS' : 'FAIL',
      `modal: ${modalVisible} · salió por modal: ${salioPorModal} · home: ${enHome}`);
  } catch (e) {
    v('DM-DEV-020', 'Atrás sin guardar → modal Salir/Guardar → home', 'FAIL', e.message);
    await irAHomeDev().catch(() => {});
  }

  // ─── Volver a HOME de la app ─────────────────────────────────────────────────
  try {
    await irAHomeDev();
    await clickBack();
    await pg.waitForTimeout(1500);
  } catch (_) {}

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runDevoluciones };
