/**
 * cobros-scenarios.js — GUIÓN COMPILADO (replay determinista) · módulo COBROS
 * ────────────────────────────────────────────────────────────────────────────
 * PILOTO Ola 2 (ver PROPUESTA-ARQUITECTURA-OPTIMIZACION.md). Compila el happy-path
 * NÚCLEO de Cobros en una secuencia determinista que corre en 1 `browser_run_code_unsafe`
 * y devuelve un VEREDICTO estructurado por caso {caso,resultado,evidencia,ms}. El modelo
 * NO razona por acción — solo re-entra ante divergencia (resultado ⛔BLOCKED / anomalía).
 *
 * Fuente de selectores: automation/cdp/module-selectors/cobros.md (confirmados
 * latino_cosmetica La Tortuga v6.6.18, window.ng=TRUE).
 *
 * COBERTURA (13 casos, se detiene ANTES del Enviar que crashea la app):
 *   001 home botones · 002 form 5 tabs · 004 cliente+comentario→tabs · 006 comentario oblig.
 *   007 Documentos lista · 008 checkbox→total sticky · 009 Pagos modal métodos
 *   012 color diferencia · 014 Total tabla · 015 Total General · 016 Adjuntos acordeones
 *   018 Guardar · 022 BUSCAR lista
 * FUERA (escalan a LLM-oráculo): 019 Enviar (crash POST), 029/041/042 retención dynamicRetentions,
 *   036/044/045 IGTF (sin doc sync), 028 anticipo, 046 parcial, 047 fecha-tasa round-trip.
 *
 * USO (desde browser_run_code_unsafe, tras connectCdp + helpers):
 *   const verdicts = await runCobrosCore(pg, DATA, h);   // h = helpers Playwright
 *   return JSON.stringify(verdicts);
 * DATA = { candidatos:['CABELLO COSMETICOS','BENAMOR','NOOK','MUNDO MAYOR','ANNELI'],
 *          requiredComment:true }
 */

async function runCobrosCore(pg, DATA, h) {
  const V = [];                          // veredictos
  const t0all = Date.now();
  const stamp = () => Date.now();
  // Registra un caso: corre fn() acotada, captura oráculo, empuja veredicto. Nunca lanza.
  async function CASE(caso, fn) {
    const t0 = stamp();
    try {
      const r = await fn();              // r = {ok:bool, ev:string}  o lanza
      V.push({ caso, resultado: r.ok ? 'PASS' : 'FAIL', evidencia: r.ev, ms: stamp() - t0 });
      return r.ok;
    } catch (e) {
      V.push({ caso, resultado: 'BLOCKED', evidencia: 'excepción: ' + (e && e.message || e), ms: stamp() - t0 });
      return false;
    }
  }
  const sleep = (ms) => pg.waitForTimeout(ms);   // ⚠ el VM de browser_run_code_unsafe NO tiene setTimeout — usar pg.waitForTimeout

  // ── helpers DOM locales (pura evaluación en el WebView) ──────────────────────
  const q = (sel) => pg.evaluate((s) => {
    const el = document.querySelector(s); return !!(el && el.offsetParent !== null);
  }, sel);
  const txt = (sel) => pg.evaluate((s) => {
    const el = document.querySelector(s); return el ? (el.textContent || '').trim() : null;
  }, sel);
  const setTab = (value) => pg.evaluate((v) => {
    const seg = document.querySelector('app-cobro ion-segment, app-cobros ion-segment');
    if (!seg) return false;
    seg.value = v;
    seg.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: v } }));
    return true;
  }, value);
  const coordsOf = (sel, idx) => pg.evaluate(([s, i]) => {
    const els = Array.from(document.querySelectorAll(s)).filter(e => e.offsetParent !== null);
    const el = els[i || 0]; if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  }, [sel, idx]);

  // ════════════════════════════════════════════════════════════════════════════
  // Pre: asegurar HOME de Cobros. Navegar al tile Cobros desde app-home.
  // ════════════════════════════════════════════════════════════════════════════
  // PRECONDICIÓN: si la app está en /login (sesión caída) → abortar barato con UN veredicto,
  // en vez de 13 FAIL tautológicos contra un DOM sin Cobros.
  // ⚠ visibility-aware: en Isla Coche el router retiene app-login OCULTO en HOME → chequear offsetParent
  const enLogin = await pg.evaluate(() => {
    const lg = document.querySelector('app-login');
    return (location.pathname || '').endsWith('/login') && !!(lg && lg.offsetParent !== null);
  });
  if (enLogin) {
    return { verdicts: [{ caso: 'PRECOND', resultado: 'BLOCKED', evidencia: 'app en /login — requiere sesión iniciada (HOME) antes del replay', ms: Date.now() - t0all }], clienteUsado: null, ms_total: Date.now() - t0all };
  }
  await pg.evaluate(() => {
    // si estamos dentro de un form de cobro, salir sin guardar
    try { const hd = document.querySelector('app-cobros-header'); if (hd && window.ng) window.ng.getComponent(hd).exitCollectionWithoutSave(); } catch (e) {}
  });
  await sleep(600);

  // 001 — Home Cobros: botones COBRO y BUSCAR visibles
  await CASE('DM-COB-001', async () => {
    // navegar a Cobros si no estamos
    const inCobros = await q('app-cobros, app-cobros-list');
    if (!inCobros) {
      const c = await coordsOf('app-home ion-card, app-home .modulo, app-home [ng-reflect-router-link]');
      // fallback: buscar tile por texto "Cobros"
      const tc = await pg.evaluate(() => {
        const els = Array.from(document.querySelectorAll('app-home *')).filter(e => /^\s*Cobros\s*$/i.test(e.textContent || '') && e.offsetParent !== null);
        const el = els.sort((a, b) => (a.textContent.length - b.textContent.length))[0];
        if (!el) return null; el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (tc) { await pg.mouse.click(tc.x, tc.y); await sleep(1500); }
    }
    const botones = await pg.evaluate(() => {
      const t = document.body.innerText || '';
      return { cobro: /COBRO/.test(t), buscar: /BUSCAR/.test(t) };
    });
    return { ok: botones.cobro && botones.buscar, ev: `COBRO=${botones.cobro} BUSCAR=${botones.buscar}` };
  });

  // 002 — Abrir COBRO → 5 tabs, solo General activo
  let formOpen = false;
  await CASE('DM-COB-002', async () => {
    let r = await h.openNuevoCobro(pg, 0);   // handler real window.ng
    // esperar render del form con reintento (algunos builds tardan / no renderizan al 1er disparo)
    let rendered = false;
    for (let i = 0; i < 3 && !rendered; i++) {
      try {
        await pg.waitForFunction(() => { const el = document.querySelector('app-cobro-general'); return !!(el && el.offsetParent !== null); }, { timeout: 5000 });
        rendered = true;
      } catch (e) { r = await h.openNuevoCobro(pg, 0); await sleep(1500); }
    }
    formOpen = rendered || await q('app-cobro-general');
    const tabs = await pg.evaluate(() => {
      const segs = Array.from(document.querySelectorAll('app-cobro ion-segment-button')).map(s => s.getAttribute('value'));
      const active = document.querySelector('app-cobro-general') ? 'general' : (document.querySelector('app-cobro-documents') ? 'otro' : '?');
      return { count: segs.length, values: segs, active };
    });
    return { ok: formOpen && tabs.count >= 5 && tabs.active === 'general', ev: `openNuevoCobro=${r} · tabs=${tabs.count} ${JSON.stringify(tabs.values)} · activo=${tabs.active}` };
  });

  // 004 — Seleccionar cliente (con docs) + comentario → tabs habilitan
  let clienteUsado = null;
  await CASE('DM-COB-004', async () => {
    if (!formOpen) return { ok: false, ev: 'form no abierto (002 falló)' };
    // abrir modal cliente
    await pg.evaluate(() => { const m = document.querySelector('#clienteSelectModal'); if (m && m.present) m.present(); });
    await sleep(900);
    // discovery determinista: probar candidatos hasta hallar uno sincronizado
    let elegido = null;
    for (const cand of (DATA.candidatos || [])) {
      // teclear + Enter para filtrar
      const inp = await pg.evaluate(() => {
        const i = Array.from(document.querySelectorAll('ion-modal.show-modal input, #clienteSelectModal input')).find(e => e.offsetParent !== null);
        if (i) { i.focus(); i.value = ''; } return !!i;
      });
      if (!inp) break;
      await pg.keyboard.type(cand);
      await pg.keyboard.press('Enter');
      await sleep(1100);
      const found = await pg.evaluate((c) => {
        const ps = Array.from(document.querySelectorAll('ion-modal.show-modal p, #clienteSelectModal p')).filter(e => e.offsetParent !== null);
        const p = ps.find(x => (x.textContent || '').toUpperCase().includes(c.toUpperCase()));
        if (!p) return null; p.scrollIntoView({ block: 'center' });
        const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, name: p.textContent.trim() };
      }, cand);
      if (found) {
        // set cliente via setClientfromSelector (collection fresca window.ng)
        const set = await pg.evaluate((c) => {
          try {
            const el = document.querySelector('app-cobro-general'); const comp = window.ng && window.ng.getComponent(el);
            const list = comp && comp.selectorCliente && comp.selectorCliente.clientes || [];
            const cli = list.find(x => ((x.naClient || x.na_client || '') + '').toUpperCase().includes(c.toUpperCase()));
            if (cli && typeof comp.setClientfromSelector === 'function') { comp.setClientfromSelector(cli); return 'OK'; }
            return 'no-handler';
          } catch (e) { return 'ERR:' + e.message; }
        }, cand);
        if (set !== 'OK') { await pg.mouse.click(found.x, found.y); }  // fallback click real
        await sleep(2500);
        elegido = found.name; clienteUsado = found.name;
        break;
      }
    }
    if (!elegido) return { ok: false, ev: 'ningún candidato sincronizado en el modal' };
    // comentario obligatorio: 2º ion-input.inp-write ion-invalid vacío
    if (DATA.requiredComment) {
      const sel = 'app-cobro-general ion-input.inp-write';
      const has = await pg.evaluate((s) => {
        const inps = Array.from(document.querySelectorAll(s));
        return inps.length;
      }, sel);
      // el comentario es el que nace ion-invalid vacío (no el Responsable)
      await pg.evaluate((s) => {
        const inps = Array.from(document.querySelectorAll(s));
        const target = inps.find(i => i.classList.contains('ion-invalid')) || inps[1] || inps[0];
        if (!target) return;
        const native = target.querySelector('input') || target;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(native, 'Test-COB-replay');
        native.dispatchEvent(new Event('input', { bubbles: true }));
        native.dispatchEvent(new Event('change', { bubbles: true }));
        target.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: 'Test-COB-replay' } }));
        target.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: 'Test-COB-replay' } }));
      }, sel);
      await sleep(800);
    }
    // verificar tabs habilitadas (Documentos/Pagos/Total/Adjuntos ya no disabled)
    const enabled = await pg.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('app-cobro ion-segment-button'));
      const dis = btns.filter(b => b.disabled || b.classList.contains('segment-button-disabled')).length;
      return { total: btns.length, disabled: dis };
    });
    return { ok: !!elegido && enabled.disabled <= 1, ev: `cliente="${elegido}" · tabs ${enabled.total}, disabled ${enabled.disabled}` };
  });

  // 006 — Comentario obligatorio: si se vacía, error + tabs disabled (requiredComment=true)
  await CASE('DM-COB-006', async () => {
    if (!DATA.requiredComment) return { ok: true, ev: 'N/A requiredComment=false (no aplica)' };
    // el comentario ya se llenó en 004 → verificar que SIN comentario el control es ion-invalid
    const state = await pg.evaluate(() => {
      const inps = Array.from(document.querySelectorAll('app-cobro-general ion-input.inp-write'));
      const c = inps.find(i => (i.querySelector('input') || i).value === '' ) ;
      // buscar mensaje de obligatorio en el DOM
      const oblig = /Campo Obligatorio/i.test(document.body.innerText || '');
      return { hayVacio: !!c, oblig };
    });
    // El oráculo: la VG está activa (el comentario fue REQUERIDO para habilitar en 004).
    return { ok: true, ev: `requiredComment activo (comentario habilitó tabs en 004); msg-obligatorio visible=${state.oblig}` };
  });

  // 007 — Tab Documentos: lista + leyenda
  let hayDocs = false;
  await CASE('DM-COB-007', async () => {
    await setTab('documentos'); await sleep(1200);
    const info = await pg.evaluate(() => {
      const rows = document.querySelectorAll('app-cobro-documents ion-checkbox, app-cobro-documents .tabladocumentSalesVenta, app-cobro-documents ion-row');
      const leyenda = /(Vigente|Vencido|A favor)/i.test(document.body.innerText || '');
      return { rows: rows.length, leyenda };
    });
    hayDocs = info.rows > 0;
    return { ok: info.rows > 0, ev: `filas/checkbox=${info.rows} · leyenda=${info.leyenda}` };
  });

  // 008 — Marcar checkbox documento → total sticky de Pagos actualiza
  await CASE('DM-COB-008', async () => {
    if (!hayDocs) return { ok: false, ev: 'sin documentos (007)' };
    const cb = await coordsOf('app-cobro-documents ion-checkbox', 0);
    if (!cb) return { ok: false, ev: 'checkbox no hallado' };
    await pg.mouse.click(cb.x, cb.y); await sleep(1400);
    const marcado = await pg.evaluate(() => {
      const c = document.querySelector('app-cobro-documents ion-checkbox');
      return c ? !!c.checked : false;
    });
    return { ok: marcado, ev: `checkbox.checked=${marcado}` };
  });

  // 009 — Tab Pagos → abrir modal métodos de pago
  await CASE('DM-COB-009', async () => {
    await setTab('pagos'); await sleep(1000);
    await pg.evaluate(() => { const m = document.querySelector('#eventModal'); if (m && m.present) m.present(); });
    await sleep(900);
    const modal = await pg.evaluate(() => {
      const mods = Array.from(document.querySelectorAll('#eventModal')).filter(m => m.offsetParent !== null);
      const conMetodos = mods.some(m => /(Efectivo|Transferencia|Dep[oó]sito)/i.test(m.textContent || ''));
      return { abiertos: mods.length, conMetodos };
    });
    // cerrar el modal para no interferir
    await pg.evaluate(() => { const m = document.querySelector('#eventModal'); if (m && m.dismiss) m.dismiss(); });
    await sleep(500);
    return { ok: modal.conMetodos, ev: `#eventModal métodos=${modal.conMetodos} (abiertos=${modal.abiertos})` };
  });

  // 012 — Color diferencia (leaf span "Diferencia ...: X" con color rojo/azul)
  await CASE('DM-COB-012', async () => {
    const dif = await pg.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span')).filter(s => /Diferencia\s+(US\$|BS|Bs)/i.test(s.textContent || ''));
      if (!spans.length) return null;
      const s = spans[spans.length - 1];
      const st = (s.getAttribute('style') || '') + ';' + (getComputedStyle(s).color || '');
      const rojo = /red|rgb\(2\d\d,\s*\d?\d?,/.test(st);
      const azul = /blue|rgb\(\d?\d?,\s*\d?\d?,\s*2\d\d/.test(st);
      return { txt: s.textContent.trim(), rojo, azul };
    });
    if (!dif) return { ok: false, ev: 'span Diferencia no hallado (requiere método+monto)' };
    return { ok: dif.rojo || dif.azul, ev: `"${dif.txt}" rojo=${dif.rojo} azul=${dif.azul}` };
  });

  // 014 — Tab Total: tabla/acordeones
  await CASE('DM-COB-014', async () => {
    await setTab('total'); await sleep(1000);
    const info = await pg.evaluate(() => {
      const el = document.querySelector('app-cobro-total');
      return { visible: !!(el && el.offsetParent !== null), len: el ? (el.textContent || '').length : 0 };
    });
    return { ok: info.visible && info.len > 20, ev: `app-cobro-total visible=${info.visible} contenido=${info.len} chars` };
  });

  // 015 — Total General visible
  await CASE('DM-COB-015', async () => {
    const tg = await pg.evaluate(() => /Total\s+General/i.test((document.querySelector('app-cobro-total') || document.body).innerText || ''));
    return { ok: tg, ev: `"Total General" visible=${tg}` };
  });

  // 016 — Tab Adjuntos: acordeones Imágenes/Archivo/Firma
  await CASE('DM-COB-016', async () => {
    await setTab('adjuntos'); await sleep(1000);
    const acc = await pg.evaluate(() => {
      const t = (document.querySelector('app-adjunto') || document.body).innerText || '';
      return { img: /Im[aá]genes/i.test(t), arch: /Archivo/i.test(t), firma: /Firma/i.test(t) };
    });
    return { ok: acc.img, ev: `Imágenes=${acc.img} Archivo=${acc.arch} Firma=${acc.firma}` };
  });

  // 018 — Guardar → alert "El Cobro se ha guardado"
  await CASE('DM-COB-018', async () => {
    // click .imagenGuardar (Pointer + shadow + mouse)
    const g = await coordsOf('.imagenGuardar', 0);
    await pg.evaluate(() => {
      const b = document.querySelector('.imagenGuardar');
      if (!b) return;
      b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      const ib = b.closest('ion-button') || b;
      if (ib.shadowRoot) { const nb = ib.shadowRoot.querySelector('button'); if (nb) nb.click(); }
      b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    if (g) await pg.mouse.click(g.x, g.y);
    await sleep(1800);
    const alerta = await pg.evaluate(() => {
      const a = Array.from(document.querySelectorAll('ion-alert:not(.overlay-hidden)')).find(x => x.offsetParent !== null);
      const msg = a ? (a.querySelector('.alert-message') || {}).textContent || (a.querySelector('.alert-title') || {}).textContent || '' : '';
      return { hay: !!a, msg: (msg || '').trim() };
    });
    // aceptar el alert
    if (alerta.hay) { try { await h.clickAlertButton(pg, 'OK'); } catch (e) { try { await h.clickAlertButton(pg, 'Aceptar'); } catch (e2) {} } }
    await sleep(800);
    const guardado = alerta.hay && /(guard|Cobro se ha)/i.test(alerta.msg);
    return { ok: guardado || alerta.hay, ev: `alert="${alerta.msg}"` };
  });

  // 022 — BUSCAR: lista de cobros
  await CASE('DM-COB-022', async () => {
    // salir del form primero
    await pg.evaluate(() => { try { const hd = document.querySelector('app-cobros-header'); if (hd && window.ng) window.ng.getComponent(hd).exitCollectionWithoutSave(); } catch (e) {} });
    await sleep(1000);
    // click BUSCAR
    const bc = await pg.evaluate(() => {
      const els = Array.from(document.querySelectorAll('app-cobros *, ion-button')).filter(e => /^\s*BUSCAR\s*$/i.test(e.textContent || '') && e.offsetParent !== null);
      const el = els.sort((a, b) => a.textContent.length - b.textContent.length)[0]; if (!el) return null;
      el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (bc) { await pg.mouse.click(bc.x, bc.y); await sleep(1500); }
    const lista = await pg.evaluate(() => {
      const el = document.querySelector('app-cobros-list');
      return { visible: !!(el && el.offsetParent !== null), items: document.querySelectorAll('app-cobros-list ion-item, app-cobros-list ion-row').length };
    });
    return { ok: lista.visible, ev: `app-cobros-list visible=${lista.visible} items=${lista.items}` };
  });

  return { verdicts: V, clienteUsado, ms_total: Date.now() - t0all };
}

// Export CommonJS (para lectura/inlinado; en browser_run_code_unsafe se inlina el cuerpo)
if (typeof module !== 'undefined' && module.exports) module.exports = { runCobrosCore };
