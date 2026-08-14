/**
 * modules/vendedores.js
 * Casos determinísticos — Módulo VENDEDORES (solo lectura, 3 casos)
 *
 * Prerrequisito: app abierta en HOME, sincronización terminada.
 * Selectores documentados en module-selectors/vendedores.md
 *
 * @param {import('playwright').Page} pg
 * @param {{ aplica: boolean, esVendedor: boolean }} DATA
 * @returns {Promise<{ verdicts: Array, msTotal: number }>}
 */
async function runVendedores(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function veredicto(id, descripcion, resultado, nota = '') {
    verdicts.push({ id, descripcion, resultado, nota, ms: Date.now() - t0 });
  }

  // Si el módulo no aplica → todo N/A
  if (!DATA.aplica && !DATA.esVendedor) {
    veredicto('DM-VND-001', 'Navegar a Vendedores desde Home', 'N/A', 'aplica=false en perfil cliente');
    veredicto('DM-VND-002', 'Expandir/contraer acordeón empresa', 'N/A', 'aplica=false en perfil cliente');
    veredicto('DM-VND-007', 'Volver a Home', 'N/A', 'aplica=false en perfil cliente');
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DM-VND-001: Navegar HOME → Vendedores ──────────────────────────────────
  try {
    // Click en el tile Vendedores (PointerEvent + MouseEvent sobre el <a>)
    const clickOk = await pg.evaluate(async () => {
      const tiles = [...document.querySelectorAll('app-home a.ion-text-center')];
      const tile  = tiles.find(a => {
        const p = a.querySelector('p.nombreModulos');
        return p && p.textContent.trim() === 'Vendedores';
      });
      if (!tile) return 'NO_TILE';
      const rect = tile.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top  + rect.height / 2;
      ['pointerdown','pointerup','mousedown','mouseup','click'].forEach(type =>
        tile.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }))
      );
      return 'OK';
    });

    if (clickOk === 'NO_TILE') throw new Error('Tile Vendedores no encontrado en HOME');

    // Esperar app-vendedores
    await pg.waitForSelector('app-vendedores', { state: 'visible', timeout: 10000 });

    // Descartar ion-loading visible (bug conocido al entrar a /vendedores — el_palmar, difranca)
    await pg.evaluate(() => {
      document.querySelectorAll('ion-loading').forEach(el => {
        if (el.offsetParent !== null) {
          try { el.dismiss(); } catch (_) {}
        }
      });
    });

    // Verificar que hay al menos 1 ion-accordion
    const numAcordeons = await pg.evaluate(() =>
      document.querySelectorAll('app-vendedores ion-accordion-group ion-accordion').length
    );

    if (numAcordeons === 0) throw new Error('app-vendedores visible pero sin acordeones');

    veredicto('DM-VND-001', 'Navegar a Vendedores desde Home',
      'PASS', `${numAcordeons} acordeón(es) de empresa`);
  } catch (e) {
    veredicto('DM-VND-001', 'Navegar a Vendedores desde Home', 'FAIL', e.message);
    // Sin módulo no tiene sentido continuar
    veredicto('DM-VND-002', 'Expandir/contraer acordeón empresa', 'BLOCKED', 'VND-001 falló');
    veredicto('DM-VND-007', 'Volver a Home', 'BLOCKED', 'VND-001 falló');
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DM-VND-002: Expandir acordeones y verificar KPIs ───────────────────────
  try {
    const resultado002 = await pg.evaluate(async () => {
      const grp  = document.querySelector('app-vendedores ion-accordion-group');
      const accs = [...grp.querySelectorAll(':scope > ion-accordion')];
      if (!accs.length) return { ok: false, msg: 'sin acordeones' };

      // Expandir todos a la vez (técnica multi: grp.multiple = true)
      grp.multiple = true;
      grp.value = accs.map(a => a.value);
      grp.dispatchEvent(new CustomEvent('ionChange', { detail: { value: grp.value }, bubbles: true }));

      // Espera mínima para que Ionic anime la expansión
      await new Promise(r => setTimeout(r, 700));

      const empresas = accs.map(acc => {
        const slot    = acc.querySelector('[slot="content"]');
        const rect    = slot ? slot.getBoundingClientRect() : { height: 0 };
        const kpisHay = rect.height > 5; // >5px = hay contenido visual
        const label   = acc.querySelector('[slot="header"]')?.textContent?.trim() || acc.value;
        return { label, alturaContent: Math.round(rect.height), kpisHay };
      });

      // Colapsar
      grp.value = undefined;
      grp.dispatchEvent(new CustomEvent('ionChange', { detail: { value: undefined }, bubbles: true }));
      await new Promise(r => setTimeout(r, 300));

      const colapsado = accs.every(acc => {
        const slot = acc.querySelector('[slot="content"]');
        return !slot || slot.getBoundingClientRect().height <= 5;
      });

      return { ok: true, empresas, colapsado };
    });

    if (!resultado002.ok) throw new Error(resultado002.msg);

    const kpiNA = resultado002.empresas.every(e => !e.kpisHay);
    const resumen = resultado002.empresas
      .map(e => `${e.label} (${e.alturaContent}px)`)
      .join(', ');

    if (kpiNA) {
      veredicto('DM-VND-002', 'Expandir/contraer acordeón empresa', 'N/A',
        `API sin KPIs — acordeones expandibles pero vacíos: ${resumen}`);
    } else {
      veredicto('DM-VND-002', 'Expandir/contraer acordeón empresa',
        resultado002.colapsado ? 'PASS' : 'FAIL',
        `expandió: ${resumen}; colapsó: ${resultado002.colapsado}`);
    }
  } catch (e) {
    veredicto('DM-VND-002', 'Expandir/contraer acordeón empresa', 'FAIL', e.message);
  }

  // ─── DM-VND-007: Volver a Home ──────────────────────────────────────────────
  try {
    // Back especial: img.fechaAtras SIN <a> padre (3er sabor del quirk de back)
    // Filtrar: src contiene 'atras' Y x < 100 (excluye el SVG decorativo en x≈302)
    const backCoords = await pg.evaluate(() => {
      const imgs = [...document.querySelectorAll('app-vendedores img.fechaAtras')];
      const back = imgs.find(img => {
        const rect = img.getBoundingClientRect();
        return /atras/i.test(img.src) && rect.x < 100 && rect.width > 0;
      });
      if (!back) return null;
      const r = back.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });

    if (!backCoords) throw new Error('img.fechaAtras (back) no encontrado en app-vendedores');

    await pg.mouse.click(backCoords.x, backCoords.y);
    await pg.waitForSelector('app-home', { state: 'visible', timeout: 8000 });

    veredicto('DM-VND-007', 'Volver a Home', 'PASS', '');
  } catch (e) {
    veredicto('DM-VND-007', 'Volver a Home', 'FAIL', e.message);
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runVendedores };
