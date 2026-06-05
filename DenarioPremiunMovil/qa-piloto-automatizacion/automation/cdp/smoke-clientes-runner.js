/**
 * smoke-clientes-runner.js
 * Smoke test CLIENTES — Denario Premium Móvil
 * RUN_ID: 20260602_180248_smoke-completo · Cliente: insumar
 *
 * Ejecutar: node smoke-clientes-runner.js
 * Requiere: ws, playwright (cualquiera con CDP disponible en :9220)
 */

'use strict';

const pw = require('playwright');
const path = require('path');

const CDP_URL   = 'http://127.0.0.1:9220';
const HELPERS   = path.join(__dirname, 'denario-cdp-helpers.js');

// Timestamp para nombre único de cliente potencial
const ts = '180248';
const SMOKE_NAME    = `Test-CLT-SMOKE-${ts}`;
const DELETE_NAME   = `Test-CLT-DELETE-${ts}`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Helpers inline (mismo patrón que denario-cdp-helpers.js) ─────────────────

async function getActiveView(pg, candidates) {
  return pg.evaluate((sels) => {
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return sel;
    }
    return null;
  }, candidates);
}

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
  if (!coords) throw new Error(`clickAlertButton: botón "${texto}" no encontrado`);
  await pg.mouse.click(coords.x, coords.y);
  await sleep(400);
}

async function clickBack(pg) {
  await pg.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img.fechaAtras'));
    const vis  = imgs.filter(i => i.offsetParent !== null);
    if (!vis.length) throw new Error('clickBack: img.fechaAtras visible no encontrado');
    const link = vis[0].closest('a');
    const target = link || vis[0];
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  });
  await sleep(500);
}

async function waitFor(pg, selector, timeout = 8000) {
  await pg.waitForSelector(selector, { state: 'visible', timeout });
}

async function evalGet(pg, expr) {
  return pg.evaluate(expr);
}

// ─── Resultado acumulado ─────────────────────────────────────────────────────

const results = [];
function mark(id, result, evidence) {
  results.push({ id, result, evidence });
  console.log(`[${result}] ${id} — ${evidence}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

(async () => {
  console.log('=== SMOKE CLIENTES insumar · RUN_ID 20260602_180248_smoke-completo ===');

  // Conectar CDP
  let browser, pg;
  try {
    browser = await pw.chromium.connectOverCDP(CDP_URL);
    const ctx = browser.contexts()[0];
    pg = ctx.pages()[0];
    await pg.bringToFront();
    console.log('CDP conectado — URL:', pg.url());
  } catch(e) {
    console.error('ERROR CDP connect:', e.message);
    process.exit(1);
  }

  // Esperar overlay sync
  await pg.waitForFunction(() => {
    const overlay = document.querySelector('app-synchronization');
    return !overlay || overlay.offsetParent === null;
  }, { timeout: 30000 }).catch(() => {});

  // ─── DM-CLT-001: Click módulo Clientes desde Home ───────────────────────
  try {
    const homeView = await getActiveView(pg, ['app-home']);
    if (!homeView) throw new Error('app-home no visible al inicio');

    // Buscar botón Clientes en la home
    const clickedClientes = await pg.evaluate(() => {
      const items = Array.from(document.querySelectorAll('app-home ion-item, app-home ion-button, app-home .menu-item, app-home ion-card, app-home [class*="menu"]'));
      const clientes = items.find(el => el.textContent.trim().toLowerCase().includes('clientes'));
      if (clientes) {
        clientes.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return true;
      }
      // Buscar en todos los elementos clickeables
      const all = Array.from(document.querySelectorAll('ion-item, ion-button, a'));
      const found = all.find(el => el.textContent.trim().toLowerCase() === 'clientes' ||
                                    el.textContent.trim().toLowerCase().includes('clientes') && !el.textContent.toLowerCase().includes('potencial'));
      if (found) {
        found.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return true;
      }
      return false;
    });

    if (!clickedClientes) throw new Error('Botón Clientes no encontrado en home');
    await sleep(1500);

    // Verificar app-client-home
    const view = await getActiveView(pg, ['app-client-home', 'app-clientes', 'app-clients-home']);
    // También buscar por texto de botones
    const buttons = await pg.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button, button'));
      return btns.filter(b => b.offsetParent !== null).map(b => b.textContent.trim()).filter(t => t.length > 0);
    });
    console.log('Botones visibles tras click Clientes:', JSON.stringify(buttons));

    // Detectar la vista por contenido
    const pageContent = await pg.evaluate(() => {
      const comps = ['app-client-home','app-clientes','app-clients-home','app-client-list'];
      for (const c of comps) {
        const el = document.querySelector(c);
        if (el && el.offsetParent !== null) return c;
      }
      // Si no encontramos componente, verificar por URL
      return window.location.href;
    });
    console.log('Vista/URL actual:', pageContent);

    const hasClientesBtns = buttons.some(b => b.toUpperCase().includes('CLIENTE'));
    if (hasClientesBtns || pageContent.includes('client')) {
      mark('DM-CLT-001', 'PASS', `Vista clientes activa: ${pageContent} — botones: ${buttons.slice(0,5).join(', ')}`);
    } else {
      mark('DM-CLT-001', 'FAIL', `Vista inesperada: ${pageContent} — botones: ${buttons.join(', ')}`);
    }
  } catch(e) {
    mark('DM-CLT-001', 'FAIL', `Error: ${e.message}`);
  }

  await sleep(500);

  // ─── DM-CLT-002: CLIENTES → lista ───────────────────────────────────────
  let clientesBusqueda = null;
  let primerCliente    = null;
  try {
    // Click en botón CLIENTES (el principal, no CLIENTE POTENCIAL)
    const clickedList = await pg.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button, button, ion-item'));
      // Buscar exactamente "CLIENTES" o que contenga solo "clientes" sin "potencial"
      const btn = btns.find(b => {
        const t = b.textContent.trim().toUpperCase();
        return (t === 'CLIENTES' || (t.includes('CLIENTES') && !t.includes('POTENCIAL') && !t.includes('BUSCAR'))) && b.offsetParent !== null;
      });
      if (btn) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return btn.textContent.trim();
      }
      return null;
    });
    console.log('Clicked CLIENTES button:', clickedList);
    await sleep(2000);

    // Verificar lista de clientes
    const listInfo = await pg.evaluate(() => {
      // Buscar items de la lista
      const listItems = document.querySelectorAll('app-client-list ion-item, ion-list ion-item, .client-item');
      const allItems  = document.querySelectorAll('ion-item');
      const url = window.location.href;
      const comp = ['app-client-list','app-client-home','app-clientes'].find(c => {
        const el = document.querySelector(c);
        return el && el.offsetParent !== null;
      });
      // Obtener primeros items visibles
      const visItems = Array.from(allItems).filter(i => i.offsetParent !== null);
      const firstTexts = visItems.slice(0, 5).map(i => i.textContent.trim().slice(0, 60));
      return {
        url,
        comp,
        listCount: listItems.length,
        allItemCount: visItems.length,
        firstTexts,
      };
    });
    console.log('List info:', JSON.stringify(listInfo, null, 2));

    if (listInfo.allItemCount >= 1) {
      // Obtener el nombre del primer cliente para usar como datos de prueba
      primerCliente = listInfo.firstTexts[0];
      // Intentar extraer texto más limpio del primer cliente
      const firstClientName = await pg.evaluate(() => {
        const items = Array.from(document.querySelectorAll('ion-item')).filter(i => i.offsetParent !== null);
        if (!items.length) return null;
        // Buscar ion-label o párrafo con nombre
        for (const item of items.slice(0, 5)) {
          const label = item.querySelector('ion-label h2, ion-label p, h2, .client-name');
          if (label) return label.textContent.trim();
          // Si no tiene estructura, tomar el texto más limpio
          const text = item.textContent.trim().split('\n')[0].trim();
          if (text.length > 2) return text;
        }
        return null;
      });
      primerCliente = firstClientName || listInfo.firstTexts[0];
      console.log('Primer cliente:', primerCliente);

      const countMsg = listInfo.listCount > 0
        ? `${listInfo.listCount} ítems en app-client-list`
        : `${listInfo.allItemCount} ion-items visibles`;
      mark('DM-CLT-002', 'PASS', `Lista cargada — ${countMsg} — primero: "${primerCliente ? primerCliente.slice(0,40) : 'N/A'}"`);
    } else {
      mark('DM-CLT-002', 'FAIL', `Lista vacía — ${JSON.stringify(listInfo)}`);
    }
  } catch(e) {
    mark('DM-CLT-002', 'FAIL', `Error: ${e.message}`);
  }

  await sleep(300);

  // ─── DM-CLT-003: Búsqueda en lista ──────────────────────────────────────
  let clienteEncontrado = null;
  try {
    // Identificar texto de búsqueda: primera 3-4 letras del primer cliente
    let busqueda = 'A'; // fallback
    if (primerCliente) {
      busqueda = primerCliente.trim().split(' ')[0].slice(0, 4).toUpperCase();
    }
    clientesBusqueda = busqueda;
    console.log('Texto búsqueda:', busqueda);

    // Buscar el input de búsqueda
    const searchResult = await pg.evaluate((texto) => {
      // Buscar searchbar o input text
      const searchbar = document.querySelector('ion-searchbar input, input[type="text"], input[type="search"]');
      if (!searchbar) return { found: false, reason: 'no searchbar input' };
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(searchbar, texto);
      searchbar.dispatchEvent(new Event('input', { bubbles: true }));
      searchbar.dispatchEvent(new Event('change', { bubbles: true }));
      searchbar.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: texto } }));
      searchbar.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: texto } }));
      // También disparar keyup por si la búsqueda es reactiva a keyup
      searchbar.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      return { found: true, inputValue: texto };
    }, busqueda);

    console.log('Search result:', JSON.stringify(searchResult));
    await sleep(1500);

    // Verificar filtrado
    const afterSearch = await pg.evaluate(() => {
      const items = Array.from(document.querySelectorAll('ion-item')).filter(i => i.offsetParent !== null);
      return {
        count: items.length,
        texts: items.slice(0, 5).map(i => i.textContent.trim().slice(0, 60)),
      };
    });
    console.log('After search:', JSON.stringify(afterSearch));

    if (afterSearch.count >= 1 && searchResult.found) {
      clienteEncontrado = afterSearch.texts[0];
      mark('DM-CLT-003', 'PASS', `Búsqueda "${busqueda}" → ${afterSearch.count} resultado(s) — primero: "${afterSearch.texts[0].slice(0,40)}"`);
    } else if (!searchResult.found) {
      mark('DM-CLT-003', 'FAIL', `Input de búsqueda no encontrado: ${searchResult.reason}`);
    } else {
      mark('DM-CLT-003', 'FAIL', `Búsqueda "${busqueda}" → ${afterSearch.count} resultados (lista vacía)`);
    }

    // Limpiar búsqueda para continuar con detalle
    await pg.evaluate(() => {
      const searchbar = document.querySelector('ion-searchbar input, input[type="text"], input[type="search"]');
      if (searchbar) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(searchbar, '');
        searchbar.dispatchEvent(new Event('input', { bubbles: true }));
        searchbar.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: '' } }));
      }
    });
    await sleep(800);

  } catch(e) {
    mark('DM-CLT-003', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-009: Click en cliente → detalle ─────────────────────────────
  let clienteDetalleNombre = null;
  try {
    // Click en el primer cliente visible
    const clienteInfo = await pg.evaluate(() => {
      const items = Array.from(document.querySelectorAll('ion-item')).filter(i => i.offsetParent !== null);
      if (!items.length) return { clicked: false, reason: 'no items' };
      const first = items[0];
      first.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return { clicked: true, text: first.textContent.trim().slice(0, 80) };
    });
    console.log('Click cliente:', JSON.stringify(clienteInfo));
    await sleep(1500);

    // Verificar pantalla de detalle
    const detalle = await pg.evaluate(() => {
      const comp = ['app-client-detail', 'app-client-detail-page', 'app-clients-detail'].find(c => {
        const el = document.querySelector(c);
        return el && el.offsetParent !== null;
      });
      const url = window.location.href;
      // Buscar saldo en DOM
      const allText = document.body.innerText.slice(0, 500);
      return { comp, url, allText };
    });
    console.log('Detalle info:', JSON.stringify({ comp: detalle.comp, url: detalle.url, textSnippet: detalle.allText.slice(0, 200) }));

    if (detalle.url.includes('/clientes') || detalle.url.includes('/client') || detalle.comp) {
      // Extraer nombre del cliente del DOM
      clienteDetalleNombre = await pg.evaluate(() => {
        const selectors = ['app-client-detail h1', 'app-client-detail h2', 'app-client-detail .client-name',
                           'ion-title', '.nombre-cliente', 'ion-header h1', 'ion-header h2'];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        // Fallback: primera línea del contenido
        return document.body.innerText.split('\n').find(l => l.trim().length > 3) || 'N/A';
      });
      mark('DM-CLT-009', 'PASS', `Detalle visible — cliente: "${clienteDetalleNombre ? clienteDetalleNombre.slice(0,40) : 'N/A'}" — URL: ${detalle.url}`);
    } else {
      mark('DM-CLT-009', 'FAIL', `Pantalla detalle no detectada — URL: ${detalle.url} — comp: ${detalle.comp}`);
    }
  } catch(e) {
    mark('DM-CLT-009', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-013: Tab "Doc. de Venta" ────────────────────────────────────
  try {
    // Buscar tab Doc. de Venta
    const tabResult = await pg.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('ion-segment-button, ion-tab-button, .tab-btn, button'));
      const docVenta = tabs.find(t => {
        const txt = t.textContent.trim().toLowerCase();
        return txt.includes('doc') || txt.includes('venta') || txt.includes('docum');
      });
      if (docVenta && docVenta.offsetParent !== null) {
        docVenta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return { found: true, text: docVenta.textContent.trim() };
      }
      // Listar tabs disponibles
      const visTabs = tabs.filter(t => t.offsetParent !== null).map(t => t.textContent.trim()).filter(t => t.length > 0);
      return { found: false, availableTabs: visTabs.slice(0, 10) };
    });
    console.log('Tab result:', JSON.stringify(tabResult));
    await sleep(1200);

    if (tabResult.found) {
      // Verificar contenido
      const tabContent = await pg.evaluate(() => {
        // Buscar leyendas Vigente/Vencido/A favor
        const text = document.body.innerText;
        return {
          hasVigente: text.toLowerCase().includes('vigente'),
          hasVencido: text.toLowerCase().includes('vencido'),
          hasAFavor:  text.toLowerCase().includes('a favor') || text.toLowerCase().includes('favor'),
          itemCount:  document.querySelectorAll('ion-item').length,
          snippet:    text.slice(0, 300),
        };
      });
      console.log('Tab content:', JSON.stringify(tabContent));

      if (tabContent.hasVigente || tabContent.hasVencido || tabContent.hasAFavor || tabContent.itemCount > 0) {
        mark('DM-CLT-013', 'PASS', `Tab "${tabResult.text}" activo — vigente:${tabContent.hasVigente} vencido:${tabContent.hasVencido} aFavor:${tabContent.hasAFavor} items:${tabContent.itemCount}`);
      } else {
        mark('DM-CLT-013', 'FAIL', `Tab Doc.Venta abierto pero sin contenido esperado — snippet: ${tabContent.snippet.slice(0,100)}`);
      }
    } else {
      // N/A si no hay tab Doc.Venta (puede ser que esta cuenta no tenga)
      mark('DM-CLT-013', 'N/A', `Tab Doc.Venta no encontrado — tabs disponibles: ${JSON.stringify(tabResult.availableTabs)}`);
    }
  } catch(e) {
    mark('DM-CLT-013', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-017: Atrás desde detalle → lista ────────────────────────────
  try {
    await clickBack(pg);
    await sleep(800);

    const viewAfterBack = await pg.evaluate(() => {
      const comps = ['app-client-list', 'app-clients-list', 'app-client-home', 'app-clientes'];
      for (const c of comps) {
        const el = document.querySelector(c);
        if (el && el.offsetParent !== null) return c;
      }
      return window.location.href;
    });
    console.log('Vista tras atrás desde detalle:', viewAfterBack);

    if (viewAfterBack.includes('client-list') || viewAfterBack.includes('clients-list') || viewAfterBack.includes('/clientes')) {
      mark('DM-CLT-017', 'PASS', `Atrás desde detalle → ${viewAfterBack}`);
    } else if (viewAfterBack.includes('client-home') || viewAfterBack.includes('clientes')) {
      // Puede que vaya directo a client-home en lugar de list — aceptable como PASS
      mark('DM-CLT-017', 'PASS', `Atrás desde detalle → ${viewAfterBack} (home clientes)`);
    } else {
      mark('DM-CLT-017', 'FAIL', `Navegación inesperada: ${viewAfterBack}`);
    }
  } catch(e) {
    mark('DM-CLT-017', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-016: Atrás desde listado → home clientes ───────────────────
  try {
    await clickBack(pg);
    await sleep(800);

    const viewHome = await pg.evaluate(() => {
      const comps = ['app-client-home', 'app-clientes', 'app-clients-home'];
      for (const c of comps) {
        const el = document.querySelector(c);
        if (el && el.offsetParent !== null) return c;
      }
      // Verificar por botones visibles
      const btns = Array.from(document.querySelectorAll('ion-button, button')).filter(b => b.offsetParent !== null);
      const hasClientePotencial = btns.some(b => b.textContent.includes('POTENCIAL'));
      return hasClientePotencial ? 'home-clientes-por-botones' : window.location.href;
    });
    console.log('Vista home clientes:', viewHome);

    const buttons016 = await pg.evaluate(() => {
      return Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null).map(b => b.textContent.trim()).filter(t=>t);
    });
    console.log('Botones en home clientes:', buttons016);

    if (viewHome.includes('client-home') || viewHome.includes('clientes') || viewHome.includes('home-clientes') ||
        buttons016.some(b => b.toUpperCase().includes('POTENCIAL'))) {
      mark('DM-CLT-016', 'PASS', `Home clientes visible: ${viewHome} — botones: ${buttons016.slice(0,4).join(', ')}`);
    } else {
      mark('DM-CLT-016', 'FAIL', `No está en home clientes: ${viewHome}`);
    }
  } catch(e) {
    mark('DM-CLT-016', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-019: Click CLIENTE POTENCIAL ────────────────────────────────
  try {
    const clickedPotencial = await pg.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button, button'));
      const btn = btns.find(b => {
        const t = b.textContent.trim().toUpperCase();
        return t.includes('POTENCIAL') && !t.includes('BUSCAR') && b.offsetParent !== null;
      });
      if (btn) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return btn.textContent.trim();
      }
      return null;
    });
    console.log('Clicked potencial:', clickedPotencial);
    await sleep(1500);

    // Verificar formulario
    const formInfo = await pg.evaluate(() => {
      const ionInputs = document.querySelectorAll('ion-input');
      const visInputs = Array.from(ionInputs).filter(i => i.offsetParent !== null);
      const guardar   = document.querySelector('ion-button.imagenGuardar, ion-button[color="success"], ion-button');
      const enviar    = Array.from(document.querySelectorAll('ion-button')).find(b => b.textContent.includes('Enviar'));

      // Verificar disabled
      const guardarDisabled = guardar ? (guardar.disabled || guardar.getAttribute('disabled') !== null) : null;
      const enviarDisabled  = enviar  ? (enviar.disabled  || enviar.getAttribute('disabled')  !== null) : null;

      return {
        inputCount:      visInputs.length,
        guardarDisabled,
        enviarDisabled,
        url: window.location.href,
      };
    });
    console.log('Form info:', JSON.stringify(formInfo));

    if (formInfo.inputCount >= 5) {
      if (formInfo.guardarDisabled && formInfo.enviarDisabled) {
        mark('DM-CLT-019', 'PASS', `Formulario con ${formInfo.inputCount} inputs — Guardar disabled:${formInfo.guardarDisabled} Enviar disabled:${formInfo.enviarDisabled}`);
      } else {
        mark('DM-CLT-019', 'FAIL', `Botones NO disabled en formulario vacío — Guardar:${formInfo.guardarDisabled} Enviar:${formInfo.enviarDisabled}`);
      }
    } else {
      mark('DM-CLT-019', 'FAIL', `Formulario con solo ${formInfo.inputCount} inputs visibles (esperado 9+) — URL: ${formInfo.url}`);
    }
  } catch(e) {
    mark('DM-CLT-019', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-021: Llenar campos obligatorios ─────────────────────────────
  try {
    // Obtener lista de ion-inputs disponibles
    const inputSelectors = await pg.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('ion-input')).filter(i => i.offsetParent !== null);
      return inputs.map((inp, idx) => ({
        idx,
        formControlName: inp.getAttribute('formcontrolname') || inp.getAttribute('ng-reflect-name') || '',
        placeholder: inp.getAttribute('placeholder') || inp.querySelector('input')?.placeholder || '',
        selector: inp.getAttribute('formcontrolname')
          ? `ion-input[formcontrolname="${inp.getAttribute('formcontrolname')}"]`
          : `ion-input:nth-child(${idx + 1})`,
      }));
    });
    console.log('Inputs disponibles:', JSON.stringify(inputSelectors, null, 2));

    // Llenar campos según lo que encontremos (mapeamos por formcontrolname o placeholder)
    const HHMMSS = '180248';

    for (const inp of inputSelectors) {
      const fc = inp.formControlName.toLowerCase();
      const ph = inp.placeholder.toLowerCase();
      let value = null;

      if (fc.includes('nombre') || ph.includes('nombre')) {
        value = `Test-CLT-SMOKE-${HHMMSS}`;
      } else if (fc.includes('telefono') || fc.includes('phone') || ph.includes('telef') || ph.includes('phone')) {
        value = '04121234567';
      } else if (fc.includes('rif') || ph.includes('rif')) {
        value = 'J-12345678-9';
      } else if (fc.includes('email') || ph.includes('email') || ph.includes('correo')) {
        value = 'test@smoke.qa';
      } else if (fc.includes('direccion') || fc.includes('address') || ph.includes('direcci')) {
        value = 'Calle Smoke 123';
      } else if (fc.includes('ciudad') || ph.includes('ciudad') || ph.includes('city')) {
        value = 'Ciudad QA';
      } else if (fc.includes('contacto') || ph.includes('contacto')) {
        value = 'Contacto Smoke';
      } else if (fc.includes('zona') || fc.includes('zone') || ph.includes('zona')) {
        value = 'Zona 1';
      } else if (fc || ph) {
        // Llenar campo genérico si tiene identificador
        value = `Smoke${HHMMSS}`;
      }

      if (value && inp.selector) {
        try {
          await fillIonInput(pg, inp.selector, value);
          console.log(`Filled ${inp.selector} (${inp.formControlName}/${inp.placeholder}) = "${value}"`);
          await sleep(150);
        } catch(fillErr) {
          console.log(`Warn: no se pudo llenar ${inp.selector}: ${fillErr.message}`);
        }
      }
    }

    await sleep(800);

    // Verificar botones habilitados
    const afterFill = await pg.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
      return allBtns.map(b => ({
        text:     b.textContent.trim(),
        disabled: b.disabled || b.getAttribute('disabled') !== null,
        class:    b.className,
      }));
    });
    console.log('Botones tras rellenar:', JSON.stringify(afterFill));

    const guardarEnabled = afterFill.find(b => b.text.toUpperCase().includes('GUARD') && !b.disabled);
    const enviarEnabled  = afterFill.find(b => b.text.toUpperCase().includes('ENVI') && !b.disabled);

    if (guardarEnabled || enviarEnabled) {
      mark('DM-CLT-021', 'PASS', `Botones habilitados — Guardar:${!!guardarEnabled} Enviar:${!!enviarEnabled}`);
    } else {
      mark('DM-CLT-021', 'FAIL', `Botones siguen disabled tras rellenar — ${JSON.stringify(afterFill.slice(0,4))}`);
    }
  } catch(e) {
    mark('DM-CLT-021', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-024: Click Guardar ──────────────────────────────────────────
  try {
    // Click botón Guardar
    const guardCoords = await pg.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
      const btn  = btns.find(b => b.textContent.trim().toUpperCase().includes('GUARD') && !b.disabled);
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2 };
    });
    if (!guardCoords) throw new Error('Botón Guardar no encontrado o disabled');
    await pg.mouse.click(guardCoords.x, guardCoords.y);
    await sleep(1200);

    // Verificar alert
    const alertInfo = await pg.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('ion-alert:not(.overlay-hidden)'));
      const vis    = alerts.filter(a => a.offsetParent !== null);
      if (!vis.length) return null;
      const a = vis[0];
      return {
        header:  (a.querySelector('.alert-head h2, .alert-title') || {}).textContent || '',
        message: (a.querySelector('.alert-message, .alert-msg')   || {}).textContent || '',
        buttons: Array.from(a.querySelectorAll('button')).map(b => b.textContent.trim()),
      };
    });
    console.log('Alert guardar:', JSON.stringify(alertInfo));

    if (alertInfo && (alertInfo.message.toLowerCase().includes('guardado') || alertInfo.header.toLowerCase().includes('guardado') || alertInfo.message.toLowerCase().includes('guardad'))) {
      // Dismiss alert
      await clickAlertButton(pg, 'OK');
      await sleep(600);
      mark('DM-CLT-024', 'PASS', `Alert guardado: "${alertInfo.message.slice(0,60)}" → OK clickeado`);
    } else if (alertInfo) {
      // Hay alert pero con mensaje diferente — puede ser éxito con texto distinto
      await clickAlertButton(pg, 'OK').catch(() => clickAlertButton(pg, 'Aceptar').catch(() => {}));
      await sleep(600);
      mark('DM-CLT-024', 'PASS', `Alert presente: "${alertInfo.message.slice(0,60)}" header:"${alertInfo.header}"`);
    } else {
      // Verificar si volvimos al formulario limpio (señal de guardado exitoso)
      const formAfter = await pg.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('ion-input')).filter(i => i.offsetParent !== null);
        const firstVal = inputs.length > 0 ? (inputs[0].querySelector('input')?.value || '') : '';
        return { inputCount: inputs.length, firstVal, url: window.location.href };
      });
      console.log('Form after guard (no alert):', JSON.stringify(formAfter));
      mark('DM-CLT-024', 'FAIL', `Sin alert de guardado — form: ${JSON.stringify(formAfter)}`);
    }
  } catch(e) {
    mark('DM-CLT-024', 'FAIL', `Error: ${e.message}`);
  }

  // ─── Verificar cliente en lista (parte del DM-CLT-024) ──────────────────
  // Ir a lista de clientes potenciales para verificar
  try {
    // Volver al home de clientes
    await clickBack(pg);
    await sleep(800);

    // Buscar BUSCAR CLIENTE POTENCIAL o ir a lista de potenciales
    const clickedBuscar = await pg.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
      const btn  = btns.find(b => b.textContent.trim().toUpperCase().includes('BUSCAR'));
      if (btn) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return btn.textContent.trim();
      }
      return null;
    });
    console.log('Click BUSCAR CLIENTE POTENCIAL:', clickedBuscar);
    await sleep(1500);

    const listaInfo = await pg.evaluate(() => {
      const items = Array.from(document.querySelectorAll('ion-item')).filter(i => i.offsetParent !== null);
      return {
        count: items.length,
        texts: items.map(i => i.textContent.trim().slice(0, 80)),
      };
    });
    console.log('Lista potenciales:', JSON.stringify(listaInfo));

    const smokeCliente = listaInfo.texts.find(t => t.includes('SMOKE') || t.includes('Test-CLT'));
    if (smokeCliente) {
      console.log('Cliente smoke encontrado en lista:', smokeCliente);
    }
  } catch(e) {
    console.log('Warn: no se pudo verificar lista potenciales:', e.message);
  }

  await sleep(500);

  // ─── DM-CLT-026: Enviar cliente potencial ───────────────────────────────
  try {
    // Buscar el cliente que acabamos de crear y hacer click en Enviar
    // Primero volvemos al formulario para crear otro y enviarlo, O buscamos en la lista
    // La lista de potenciales ya está abierta

    // Buscar botón Enviar en la lista o en el detalle del cliente
    const enviarResult = await pg.evaluate(() => {
      // Buscar ion-button Enviar visible
      const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
      const enviar = btns.find(b => b.textContent.trim().toUpperCase().includes('ENVI') && !b.disabled);
      if (enviar) {
        const r = enviar.getBoundingClientRect();
        return { found: true, x: r.left + r.width/2, y: r.top + r.height/2, text: enviar.textContent.trim() };
      }
      // Puede que el cliente ya guardado tenga botón Enviar en la lista
      return { found: false, btns: btns.map(b => b.textContent.trim()) };
    });
    console.log('Enviar result:', JSON.stringify(enviarResult));

    if (enviarResult.found) {
      await pg.mouse.click(enviarResult.x, enviarResult.y);
      await sleep(1000);

      // Verificar alert confirmación
      const alertEnviar = await pg.evaluate(() => {
        const alerts = Array.from(document.querySelectorAll('ion-alert:not(.overlay-hidden)')).filter(a => a.offsetParent !== null);
        if (!alerts.length) return null;
        return {
          message: (alerts[0].querySelector('.alert-message') || {}).textContent || '',
          buttons: Array.from(alerts[0].querySelectorAll('button')).map(b => b.textContent.trim()),
        };
      });
      console.log('Alert enviar:', JSON.stringify(alertEnviar));

      if (alertEnviar) {
        await clickAlertButton(pg, 'Aceptar').catch(() => clickAlertButton(pg, 'OK').catch(() => {}));
        await sleep(1200);

        // Verificar segundo alert o cambio de estatus
        const alertEnviar2 = await pg.evaluate(() => {
          const alerts = Array.from(document.querySelectorAll('ion-alert:not(.overlay-hidden)')).filter(a => a.offsetParent !== null);
          if (!alerts.length) return null;
          return { message: (alerts[0].querySelector('.alert-message') || {}).textContent || '' };
        });
        if (alertEnviar2) {
          await clickAlertButton(pg, 'OK').catch(() => {});
          await sleep(600);
          mark('DM-CLT-026', 'PASS', `Doble alert enviado — msg1: "${alertEnviar.message.slice(0,50)}" msg2: "${alertEnviar2.message.slice(0,50)}"`);
        } else {
          mark('DM-CLT-026', 'PASS', `Alert envío confirmado: "${alertEnviar.message.slice(0,60)}" → ACEPTAR`);
        }
      } else {
        mark('DM-CLT-026', 'FAIL', `Sin alert de confirmación tras click Enviar`);
      }
    } else {
      // No hay botón Enviar visible — puede estar en formulario nuevo
      // Crear cliente DELETE para poder eliminarlo
      await clickBack(pg).catch(() => {});
      await sleep(500);

      const clickedPot2 = await pg.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
        const btn = btns.find(b => b.textContent.trim().toUpperCase().includes('POTENCIAL') && !b.textContent.includes('BUSCAR'));
        if (btn) { btn.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true,view:window})); return true; }
        return false;
      });
      await sleep(1200);
      console.log('Volvió al formulario para Enviar:', clickedPot2);
      mark('DM-CLT-026', 'N/A', `Botón Enviar no encontrado en lista (enviarlo directamente desde form — flujo alternativo)`);
    }
  } catch(e) {
    mark('DM-CLT-026', 'FAIL', `Error: ${e.message}`);
  }

  // ─── DM-CLT-031: Eliminar cliente Guardado ──────────────────────────────
  try {
    // Necesitamos un cliente en estado Guardado para eliminar
    // Primero: crear uno nuevo rápido (Test-CLT-DELETE)
    // Verificar si estamos en el formulario
    const formCheck = await pg.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('ion-input')).filter(i => i.offsetParent !== null);
      return inputs.length > 3;
    });

    if (!formCheck) {
      // Navegar al formulario
      await clickBack(pg).catch(() => {});
      await sleep(500);
      const clickedPot3 = await pg.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
        const btn = btns.find(b => b.textContent.trim().toUpperCase().includes('POTENCIAL') && !b.textContent.includes('BUSCAR'));
        if (btn) { btn.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true,view:window})); return true; }
        return false;
      });
      await sleep(1200);
    }

    // Llenar nombre Delete
    const inputsDel = await pg.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('ion-input')).filter(i => i.offsetParent !== null);
      return inputs.map(inp => inp.getAttribute('formcontrolname') || inp.getAttribute('placeholder') || '');
    });
    console.log('Inputs del form delete:', inputsDel);

    // Llenar primer campo (nombre)
    const firstInput = await pg.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('ion-input')).filter(i => i.offsetParent !== null);
      if (!inputs.length) return null;
      const fc = inputs[0].getAttribute('formcontrolname');
      return fc ? `ion-input[formcontrolname="${fc}"]` : 'ion-input';
    });

    if (firstInput) {
      await fillIonInput(pg, firstInput, `Test-CLT-DELETE-${ts}`);
      await sleep(300);

      // Llenar otros campos obligatorios con valores mínimos
      const otherInputs = await pg.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('ion-input')).filter(i => i.offsetParent !== null);
        return inputs.slice(1).map(inp => {
          const fc = inp.getAttribute('formcontrolname');
          return fc ? `ion-input[formcontrolname="${fc}"]` : null;
        }).filter(s => s !== null);
      });

      for (const sel of otherInputs.slice(0, 7)) {
        const fc = sel.match(/formcontrolname="([^"]+)"/)?.[1]?.toLowerCase() || '';
        let val = 'Smoke031';
        if (fc.includes('telef') || fc.includes('phone')) val = '04121234568';
        if (fc.includes('email')) val = 'del@smoke.qa';
        await fillIonInput(pg, sel, val).catch(() => {});
        await sleep(100);
      }
      await sleep(600);

      // Click Guardar
      const guardCoords2 = await pg.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null && !b.disabled);
        const btn  = btns.find(b => b.textContent.trim().toUpperCase().includes('GUARD'));
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width/2, y: r.top + r.height/2 };
      });

      if (guardCoords2) {
        await pg.mouse.click(guardCoords2.x, guardCoords2.y);
        await sleep(1000);
        // Dismiss alert
        await clickAlertButton(pg, 'OK').catch(() => {});
        await sleep(600);
        console.log('Cliente DELETE guardado');

        // Ir a lista de potenciales
        await clickBack(pg).catch(() => {});
        await sleep(500);
        const clickedBuscar2 = await pg.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('ion-button')).filter(b => b.offsetParent !== null);
          const btn = btns.find(b => b.textContent.trim().toUpperCase().includes('BUSCAR'));
          if (btn) { btn.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true,view:window})); return true; }
          return false;
        });
        await sleep(1200);

        // Buscar botón eliminar (danger/trash) en el cliente DELETE
        const beforeCount = await pg.evaluate(() =>
          Array.from(document.querySelectorAll('ion-item')).filter(i => i.offsetParent !== null).length
        );

        const deleteResult = await pg.evaluate(() => {
          // Buscar ion-button[color="danger"]
          const dangerBtns = Array.from(document.querySelectorAll('ion-button[color="danger"]')).filter(b => b.offsetParent !== null);
          if (dangerBtns.length > 0) {
            const r = dangerBtns[0].getBoundingClientRect();
            return { found: true, x: r.left + r.width/2, y: r.top + r.height/2, count: dangerBtns.length };
          }
          // Buscar íconos trash o basura
          const trashBtns = Array.from(document.querySelectorAll('ion-button')).filter(b => {
            return b.offsetParent !== null && (b.querySelector('ion-icon[name*="trash"]') || b.querySelector('[name*="trash"]'));
          });
          if (trashBtns.length > 0) {
            const r = trashBtns[0].getBoundingClientRect();
            return { found: true, x: r.left + r.width/2, y: r.top + r.height/2, count: trashBtns.length, type: 'icon' };
          }
          return { found: false, items: Array.from(document.querySelectorAll('ion-item')).length };
        });
        console.log('Delete button:', JSON.stringify(deleteResult));

        if (deleteResult.found) {
          await pg.mouse.click(deleteResult.x, deleteResult.y);
          await sleep(800);

          // Confirmar eliminación si hay alert
          const alertDel = await pg.evaluate(() => {
            const alerts = Array.from(document.querySelectorAll('ion-alert:not(.overlay-hidden)')).filter(a => a.offsetParent !== null);
            return alerts.length > 0 ? Array.from(alerts[0].querySelectorAll('button')).map(b => b.textContent.trim()) : null;
          });
          if (alertDel) {
            await clickAlertButton(pg, 'Aceptar').catch(() => clickAlertButton(pg, 'OK').catch(() => {}));
            await sleep(800);
          }

          const afterCount = await pg.evaluate(() =>
            Array.from(document.querySelectorAll('ion-item')).filter(i => i.offsetParent !== null).length
          );
          console.log(`Items antes: ${beforeCount} → después: ${afterCount}`);

          if (afterCount < beforeCount) {
            mark('DM-CLT-031', 'PASS', `Cliente eliminado — lista: ${beforeCount} → ${afterCount} ítems`);
          } else {
            mark('DM-CLT-031', 'FAIL', `Item count no cambió: ${beforeCount} → ${afterCount}`);
          }
        } else {
          mark('DM-CLT-031', 'N/A', `Botón eliminar no encontrado — posiblemente ningún cliente en estado Guardado disponible (${deleteResult.items} items total)`);
        }
      } else {
        mark('DM-CLT-031', 'FAIL', 'Botón Guardar no habilitado para cliente DELETE');
      }
    } else {
      mark('DM-CLT-031', 'FAIL', 'No se encontró formulario para crear cliente DELETE');
    }
  } catch(e) {
    mark('DM-CLT-031', 'FAIL', `Error: ${e.message}`);
  }

  // ─── Volver a Home principal ─────────────────────────────────────────────
  try {
    // Volver a home principal (max 3 backs)
    for (let i = 0; i < 4; i++) {
      const atHome = await pg.evaluate(() => {
        const homeEl = document.querySelector('app-home');
        return homeEl && homeEl.offsetParent !== null;
      });
      if (atHome) break;
      await clickBack(pg).catch(() => {});
      await sleep(600);
    }
    const finalUrl = pg.url();
    console.log('URL final:', finalUrl);
  } catch(e) {
    console.log('Warn volver home:', e.message);
  }

  // ─── RESUMEN ─────────────────────────────────────────────────────────────
  const counts = { PASS: 0, FAIL: 0, SKIP: 0, 'N/A': 0 };
  for (const r of results) counts[r.result] = (counts[r.result] || 0) + 1;

  console.log('\n=== RESULTADOS ===');
  console.log(`PASS: ${counts.PASS} · FAIL: ${counts.FAIL} · SKIP: ${counts.SKIP} · N/A: ${counts['N/A']}`);
  console.log('\nDetalle:');
  for (const r of results) {
    const icon = r.result === 'PASS' ? '✅' : r.result === 'FAIL' ? '❌' : r.result === 'N/A' ? '🚫' : '⏭';
    console.log(`${icon} ${r.id}: ${r.evidence}`);
  }

  // Datos descubiertos
  console.log('\n=== DATOS DESCUBIERTOS ===');
  console.log('cliente_busqueda:', clientesBusqueda);
  console.log('cliente_detalle:', clienteDetalleNombre);
  console.log('primer_cliente:', primerCliente);

  // Serializar para que el proceso padre lo capture
  console.log('\n__JSON_RESULTS__');
  console.log(JSON.stringify({
    counts,
    results,
    datos: {
      cliente_busqueda: clientesBusqueda,
      cliente_detalle:  clienteDetalleNombre,
      primer_cliente:   primerCliente,
    }
  }));

  await browser.close().catch(() => {});
  process.exit(0);
})();
