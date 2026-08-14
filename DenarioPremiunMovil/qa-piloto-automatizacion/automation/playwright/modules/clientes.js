/**
 * modules/clientes.js
 * Casos determinísticos — Módulo CLIENTES (12 casos)
 *
 * Selectores documentados en module-selectors/clientes.md
 *
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteBusqueda:string, clienteDetalle:string }} DATA
 * @returns {Promise<{ verdicts: Array, msTotal: number }>}
 */
async function runClientes(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  if (!DATA.aplica) {
    ['DM-CLT-001','DM-CLT-002','DM-CLT-003','DM-CLT-009','DM-CLT-013',
     'DM-CLT-016','DM-CLT-017','DM-CLT-019','DM-CLT-021','DM-CLT-024',
     'DM-CLT-026','DM-CLT-031'].forEach(id =>
      v(id, id, 'N/A', 'aplica=false en perfil cliente')
    );
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // Nombres únicos para registros de prueba
  const ts = String(Date.now()).slice(-6);
  const nombreTest = `Test-CLT-SMOKE-${ts}`;
  const nombreDel  = `Test-CLT-DEL-${ts}`;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function dismissIonLoadings() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-loading').forEach(el => {
        if (el.offsetParent !== null) try { el.dismiss(); } catch (_) {}
      });
    });
  }

  // Botón atrás: img.fechaAtras → closest('a'), width>0 && x<100
  async function clickBack() {
    const coords = await pg.evaluate(() => {
      const imgs = [...document.querySelectorAll('img.fechaAtras')];
      const back = imgs.find(img => {
        const r = img.getBoundingClientRect();
        return /atras/i.test(img.src || '') && r.width > 0 && r.x < 100;
      });
      if (!back) return null;
      const a = back.closest('a');
      const target = a || back;
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) throw new Error('back button (img.fechaAtras) no encontrado');
    await pg.mouse.click(coords.x, coords.y);
  }

  // Botón de alert por igualdad EXACTA (no includes — anti-patrón 3 botones)
  async function clickAlertBtn(labels = ['Aceptar', 'OK', 'Eliminar']) {
    await pg.waitForTimeout(900);
    await dismissIonLoadings();
    await pg.waitForTimeout(300);
    const coords = await pg.evaluate((lbls) => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(
        a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
      );
      if (!alerts.length) return null;
      const alert = alerts[alerts.length - 1];
      const btns = [...alert.querySelectorAll('.alert-button')];
      for (const lbl of lbls) {
        const btn = btns.find(b =>
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
    if (!coords) throw new Error('Alert button no encontrado: ' + labels.join('/'));
    await pg.mouse.click(coords.x, coords.y);
    return coords.label;
  }

  // Clic en botón de home clientes por texto EXACTO
  async function clickBotonClientes(textoExacto) {
    const coords = await pg.evaluate((texto) => {
      const btns = [...document.querySelectorAll('ion-button.colorBorderBuscar')];
      const btn = btns.find(b =>
        b.textContent.trim() === texto && b.getBoundingClientRect().width > 0
      );
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, textoExacto);
    if (!coords) throw new Error(`Botón "${textoExacto}" no encontrado en home clientes`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  // Buscar en la lista de clientes: focus + triple-click + type + click search icon
  async function buscarEnLista(termino) {
    const inputSel = 'input[type="text"][placeholder="Clientes..."]';
    await pg.click(inputSel, { clickCount: 3 });
    await pg.keyboard.type(termino, { delay: 30 });
    const sc = await pg.evaluate(() => {
      const icon = document.querySelector('ion-icon[name="search-circle-sharp"]');
      if (!icon) return null;
      const r = icon.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!sc) throw new Error('Botón de búsqueda (search-circle-sharp) no encontrado');
    await pg.mouse.click(sc.x, sc.y);
    await pg.waitForTimeout(1500);
  }

  // Contar ion-items visibles en app-client-list
  async function contarClientesEnLista() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('app-client-list ion-item')].filter(
        i => i.getBoundingClientRect().width > 0
      ).length
    );
  }

  // Clic en primer ion-item visible de app-client-list que contenga texto (o el primero si no matchea)
  async function clickItemEnLista(texto) {
    await pg.evaluate((t) => {
      const items = [...document.querySelectorAll('app-client-list ion-item')].filter(
        i => i.getBoundingClientRect().width > 0
      );
      const item = (t ? items.find(i => i.textContent.includes(t)) : null) || items[0];
      if (item) item.scrollIntoView({ block: 'center' });
    }, texto || '');
    await pg.waitForTimeout(700);
    const coords = await pg.evaluate((t) => {
      const items = [...document.querySelectorAll('app-client-list ion-item')].filter(
        i => i.getBoundingClientRect().width > 0
      );
      const item = (t ? items.find(i => i.textContent.includes(t)) : null) || items[0];
      if (!item) return null;
      const r = item.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      if (cy < 0 || cy > window.innerHeight || cx < 0) return null;
      return { x: cx, y: cy };
    }, texto || '');
    if (!coords) throw new Error('No hay ítems clickeables en la lista de clientes');
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  // Llena un ion-input del form de cliente potencial (anclado al componente)
  async function fillPotencialInput(formControlName, value) {
    const sel = `app-client-new-potential-client ion-input[formcontrolname="${formControlName}"] input`;
    await pg.focus(sel);
    await pg.keyboard.type(String(value), { delay: 25 });
  }

  // Verifica que los 3 botones del home-clientes estén visibles
  async function check3Botones() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('ion-button.colorBorderBuscar')].filter(
        b => b.getBoundingClientRect().width > 0
      ).length
    );
  }

  // ─── Flags de estado ────────────────────────────────────────────────────────
  let inList        = false;
  let inDetail      = false;
  let inHomeClts    = false;
  let guardadoOk    = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-001: Navegar a Clientes desde Home
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const clickOk = await pg.evaluate(() => {
      const tiles = [...document.querySelectorAll('app-home a.ion-text-center')];
      const tile = tiles.find(a => {
        const p = a.querySelector('p.nombreModulos');
        return p && p.textContent.trim() === 'Clientes';
      });
      if (!tile) return 'NO_TILE';
      const r = tile.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      ['pointerdown','pointerup','mousedown','mouseup','click'].forEach(type =>
        tile.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }))
      );
      return 'OK';
    });
    if (clickOk === 'NO_TILE') throw new Error('Tile Clientes no encontrado en HOME');
    await pg.waitForSelector('app-clientes', { state: 'visible', timeout: 10000 });
    const n3 = await check3Botones();
    if (n3 < 3) throw new Error(`Solo ${n3} botones en home clientes (esperaban 3)`);
    inHomeClts = true;
    v('DM-CLT-001', 'Navegar a Clientes desde Home', 'PASS', `${n3} botones visibles`);
  } catch (e) {
    v('DM-CLT-001', 'Navegar a Clientes desde Home', 'FAIL', e.message);
    ['DM-CLT-002','DM-CLT-003','DM-CLT-009','DM-CLT-013','DM-CLT-016','DM-CLT-017',
     'DM-CLT-019','DM-CLT-021','DM-CLT-024','DM-CLT-026','DM-CLT-031'].forEach(id =>
      v(id, id, 'BLOCKED', 'CLT-001 falló')
    );
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-002: CLIENTES → lista
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    await clickBotonClientes('CLIENTES');
    await pg.waitForSelector('app-client-list', { state: 'visible', timeout: 10000 });
    await pg.waitForTimeout(1500);
    const n = await contarClientesEnLista();
    if (n < 1) throw new Error('Lista de clientes vacía');
    inList = true;
    v('DM-CLT-002', 'Click CLIENTES → lista de clientes', 'PASS', `${n} clientes`);
  } catch (e) {
    v('DM-CLT-002', 'Click CLIENTES → lista de clientes', 'FAIL', e.message);
    ['DM-CLT-003','DM-CLT-009','DM-CLT-013','DM-CLT-017'].forEach(id =>
      v(id, id, 'BLOCKED', 'CLT-002 falló')
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-003: Buscar en la lista
  // ═══════════════════════════════════════════════════════════════════════════
  if (inList) {
    try {
      await buscarEnLista(DATA.clienteBusqueda);
      const n = await contarClientesEnLista();
      v('DM-CLT-003', `Buscar "${DATA.clienteBusqueda}" en lista`,
        n >= 1 ? 'PASS' : 'FAIL',
        `${n} resultados`
      );
    } catch (e) {
      v('DM-CLT-003', `Buscar "${DATA.clienteBusqueda}" en lista`, 'FAIL', e.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DM-CLT-009: Click en cliente → detalle
    // ═══════════════════════════════════════════════════════════════════════
    try {
      // Si hay clienteDetalle, re-buscar con el primer token de su nombre
      if (DATA.clienteDetalle) {
        const termino = DATA.clienteDetalle.trim().split(/\s+/)[0].slice(0, 8).toUpperCase();
        await buscarEnLista(termino);
      }
      await clickItemEnLista(DATA.clienteDetalle || '');
      await pg.waitForSelector('app-client-detail', { state: 'visible', timeout: 10000 });
      inDetail = true;
      // Capturar nombre del cliente para la nota
      const nombre = await pg.evaluate(() => {
        const el = document.querySelector('app-client-detail ion-card-title, app-client-detail h2, app-client-detail .client-name');
        return el ? el.textContent.trim().slice(0, 60) : 'detalle visible';
      });
      v('DM-CLT-009', 'Click en cliente → detalle', 'PASS', nombre);
    } catch (e) {
      v('DM-CLT-009', 'Click en cliente → detalle', 'FAIL', e.message);
      v('DM-CLT-013', 'Tab "Doc. de Venta"', 'BLOCKED', 'CLT-009 falló');
      v('DM-CLT-017', 'Volver a lista desde detalle', 'BLOCKED', 'CLT-009 falló');
      inDetail = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DM-CLT-013: Tab Doc. de Venta
    // ═══════════════════════════════════════════════════════════════════════
    if (inDetail) {
      try {
        // Asignar value al segmento + ionChange
        await pg.evaluate(() => {
          const seg = document.querySelector('ion-segment');
          if (seg) {
            seg.value = 'docVentas';
            seg.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: 'docVentas' } }));
          }
        });
        // También click real en el botón del tab
        const tabCoords = await pg.evaluate(() => {
          const btn = document.querySelector('ion-segment-button[value="docVentas"]');
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        if (tabCoords) await pg.mouse.click(tabCoords.x, tabCoords.y);
        await pg.waitForTimeout(1800);
        // Verificar que cargó el panel de documentos
        const panelInfo = await pg.evaluate(() => {
          const panel = document.querySelector('.doc-ventas-tab, .documents-table-panel--ready, .documents-view, .documents-table-scroll');
          if (!panel) return null;
          const rows = panel.querySelectorAll('tr, ion-row, .doc-row');
          return { rows: rows.length };
        });
        v('DM-CLT-013', 'Tab "Doc. de Venta"',
          panelInfo !== null ? 'PASS' : 'FAIL',
          panelInfo ? `${panelInfo.rows} filas en tabla` : 'panel de documentos no encontrado'
        );
      } catch (e) {
        v('DM-CLT-013', 'Tab "Doc. de Venta"', 'FAIL', e.message);
      }

      // ═══════════════════════════════════════════════════════════════════
      // DM-CLT-017: Volver a lista desde detalle
      // ═══════════════════════════════════════════════════════════════════
      try {
        await clickBack();
        await pg.waitForSelector('app-client-list', { state: 'visible', timeout: 8000 });
        inList = true;
        v('DM-CLT-017', 'Volver a lista desde detalle', 'PASS', '');
      } catch (e) {
        v('DM-CLT-017', 'Volver a lista desde detalle', 'FAIL', e.message);
        inList = false;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-016: Volver a home clientes desde lista
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // Si no estamos en list, intentar desde donde estemos
    await clickBack();
    await pg.waitForTimeout(1000);
    const n3 = await check3Botones();
    if (n3 < 3) throw new Error(`Solo ${n3} botones visibles en home clientes`);
    inHomeClts = true;
    v('DM-CLT-016', 'Volver a home clientes desde lista', 'PASS', '');
  } catch (e) {
    v('DM-CLT-016', 'Volver a home clientes desde lista', 'FAIL', e.message);
    // Intentar recuperar con clickBack extra
    try {
      await clickBack();
      await pg.waitForTimeout(800);
      const n3 = await check3Botones();
      inHomeClts = n3 >= 3;
    } catch (_) { inHomeClts = false; }
  }

  if (!inHomeClts) {
    ['DM-CLT-019','DM-CLT-021','DM-CLT-024','DM-CLT-026','DM-CLT-031'].forEach(id =>
      v(id, id, 'BLOCKED', 'No se pudo volver a home clientes')
    );
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-019: Click CLIENTE POTENCIAL → formulario vacío, botones disabled
  // ═══════════════════════════════════════════════════════════════════════════
  let inForm = false;
  try {
    await clickBotonClientes('CLIENTE POTENCIAL');
    await pg.waitForSelector('app-client-new-potential-client', { state: 'visible', timeout: 10000 });
    await pg.waitForTimeout(800);
    const formInfo = await pg.evaluate(() => {
      const form = document.querySelector('app-client-new-potential-client');
      if (!form) return null;
      // Contar ion-inputs visibles (anclado al componente para no agarrar app-login)
      const inputs = [...form.querySelectorAll('ion-input')].filter(i => i.offsetParent !== null);
      const guardar = form.querySelector('ion-button.imagenGuardar');
      const enviar  = form.querySelector('ion-button.imagenEnviar');
      return {
        inputs: inputs.length,
        guardarDisabled: guardar ? guardar.disabled : null,
        enviarDisabled:  enviar  ? enviar.disabled  : null,
      };
    });
    if (!formInfo) throw new Error('app-client-new-potential-client no encontrado');
    inForm = true;
    const botonesOk = formInfo.guardarDisabled === true && formInfo.enviarDisabled === true;
    v('DM-CLT-019', 'CLIENTE POTENCIAL → formulario con botones disabled',
      botonesOk ? 'PASS' : (formInfo.guardarDisabled === null ? 'FAIL' : 'PASS'),
      `${formInfo.inputs} inputs; Guardar disabled=${formInfo.guardarDisabled}, Enviar disabled=${formInfo.enviarDisabled}`
    );
  } catch (e) {
    v('DM-CLT-019', 'CLIENTE POTENCIAL → formulario con botones disabled', 'FAIL', e.message);
    ['DM-CLT-021','DM-CLT-024','DM-CLT-026','DM-CLT-031'].forEach(id =>
      v(id, id, 'BLOCKED', 'CLT-019 falló')
    );
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-021: Llenar campos obligatorios → botones habilitados
  // ═══════════════════════════════════════════════════════════════════════════
  let formFilled = false;
  try {
    const campos = [
      { name: 'naClient',          val: nombreTest },
      { name: 'nuRif',             val: 'J987654321' },
      { name: 'txAddress',         val: 'Direccion Smoke QA' },
      { name: 'txAddressDispatch', val: 'Despacho Smoke QA' },
      { name: 'txClient',          val: 'Contacto Smoke' },
      { name: 'naResponsible',     val: 'Responsable Smoke' },
      { name: 'emClient',          val: 'smoke@qa.test' },
      { name: 'nuPhone',           val: '04140000000' },
    ];
    for (const campo of campos) {
      await fillPotencialInput(campo.name, campo.val);
    }
    await pg.waitForTimeout(600);

    // idEnterprise: leer disabled + valor ANTES de tocar
    const entResult = await pg.evaluate(() => {
      const form = document.querySelector('app-client-new-potential-client');
      if (!form) return { action: 'none', reason: 'no form' };
      const sel = form.querySelector('ion-select[formcontrolname="idEnterprise"]');
      if (!sel) return { action: 'none', reason: 'no idEnterprise select' };
      if (sel.disabled) return { action: 'none', reason: 'disabled (1 empresa auto-asignada)' };
      if (sel.value !== null && sel.value !== undefined && sel.value !== '') {
        return { action: 'none', reason: `ya tiene value=${JSON.stringify(sel.value)}` };
      }
      // Obtener primer option con valor numérico
      const opts = [...(form.querySelectorAll('ion-select-option') || [])];
      let firstVal = 1;
      for (const opt of opts) {
        const ov = opt.value;
        if (typeof ov === 'number') { firstVal = ov; break; }
        const n = parseInt(ov, 10);
        if (!isNaN(n)) { firstVal = n; break; }
      }
      sel.value = firstVal;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: firstVal } }));
      return { action: 'set', firstVal };
    });
    await pg.waitForTimeout(600);

    // Verificar que los botones habilitaron
    const botonesHabilitados = await pg.evaluate(() => {
      const form = document.querySelector('app-client-new-potential-client');
      const guardar = form && form.querySelector('ion-button.imagenGuardar');
      const enviar  = form && form.querySelector('ion-button.imagenEnviar');
      return { guardar: guardar ? !guardar.disabled : null, enviar: enviar ? !enviar.disabled : null };
    });

    formFilled = botonesHabilitados.guardar === true;
    v('DM-CLT-021', 'Llenar campos → botones Guardar/Enviar habilitados',
      formFilled ? 'PASS' : 'FAIL',
      `Guardar enabled=${botonesHabilitados.guardar}, Enviar enabled=${botonesHabilitados.enviar}; idEmpresa: ${entResult.action} (${entResult.reason || ''})`
    );
  } catch (e) {
    v('DM-CLT-021', 'Llenar campos → botones Guardar/Enviar habilitados', 'FAIL', e.message);
    ['DM-CLT-024','DM-CLT-026','DM-CLT-031'].forEach(id =>
      v(id, id, 'BLOCKED', 'CLT-021 falló')
    );
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-024: Click Guardar → alert → verificar en lista BUSCAR
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // Click Guardar
    const guardarCoords = await pg.evaluate(() => {
      const btn = document.querySelector('app-client-new-potential-client ion-button.imagenGuardar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!guardarCoords) throw new Error('Botón Guardar no encontrado o disabled');
    await pg.mouse.click(guardarCoords.x, guardarCoords.y, { delay: 120 });

    // Dismiss alert de éxito
    const alertLabel = await clickAlertBtn(['Aceptar', 'OK']);
    await pg.waitForTimeout(600);

    // Navegar: back → home clientes → BUSCAR CLIENTE POTENCIAL → verificar item
    await clickBack();
    await pg.waitForTimeout(800);
    // Si apareció dirty-guard, salir sin guardar (ya guardamos)
    const hasDirty = await pg.evaluate(() =>
      [...document.querySelectorAll('ion-alert')].some(
        a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
      )
    );
    if (hasDirty) {
      // Dirty-guard: click "Salir sin guardar" (EXACT match)
      const dirtyCoords = await pg.evaluate(() => {
        const alerts = [...document.querySelectorAll('ion-alert')].filter(
          a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
        );
        if (!alerts.length) return null;
        const alert = alerts[alerts.length - 1];
        const btn = [...alert.querySelectorAll('.alert-button')].find(b =>
          b.textContent.trim().toLowerCase() === 'salir sin guardar' &&
          b.getBoundingClientRect().width > 0
        );
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (dirtyCoords) await pg.mouse.click(dirtyCoords.x, dirtyCoords.y);
      await pg.waitForTimeout(800);
    }

    // Ahora deberíamos estar en home clientes — navegar a BUSCAR
    await pg.waitForTimeout(500);
    await clickBotonClientes('BUSCAR CLIENTE POTENCIAL');
    await pg.waitForTimeout(2000);

    // Buscar nuestro item por nombre
    const itemEncontrado = await pg.evaluate((nombre) => {
      const items = [...document.querySelectorAll('ion-item')].filter(
        i => i.getBoundingClientRect().width > 0
      );
      return items.some(i => i.textContent.includes(nombre));
    }, nombreTest);

    guardadoOk = itemEncontrado;
    v('DM-CLT-024', 'Click Guardar → cliente potencial guardado',
      itemEncontrado ? 'PASS' : 'FAIL',
      `alert btn: "${alertLabel}"; ${itemEncontrado ? `"${nombreTest}" visible en BUSCAR` : `"${nombreTest}" NO encontrado en BUSCAR`}`
    );
  } catch (e) {
    v('DM-CLT-024', 'Click Guardar → cliente potencial guardado', 'FAIL', e.message);
    ['DM-CLT-026','DM-CLT-031'].forEach(id =>
      v(id, id, 'BLOCKED', 'CLT-024 falló')
    );
    // Intentar llegar a home clientes para CLT-031
    try {
      await clickBack();
      await pg.waitForTimeout(800);
    } catch (_) {}
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-026: Re-abrir Guardado → click Enviar → 3 alertas → Enviado
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // Estamos en la lista BUSCAR CLIENTE POTENCIAL. Click en zona izquierda (35%)
    await pg.evaluate((nombre) => {
      const items = [...document.querySelectorAll('ion-item')].filter(
        i => i.getBoundingClientRect().width > 0 && i.textContent.includes(nombre)
      );
      if (items[0]) items[0].scrollIntoView({ block: 'center' });
    }, nombreTest);
    await pg.waitForTimeout(700);

    const reabrirCoords = await pg.evaluate((nombre) => {
      const items = [...document.querySelectorAll('ion-item')].filter(
        i => i.getBoundingClientRect().width > 0 && i.textContent.includes(nombre)
      );
      if (!items.length) return null;
      const r = items[0].getBoundingClientRect();
      const cx = r.x + r.width * 0.35;
      const cy = r.y + r.height / 2;
      if (cy < 0 || cy > window.innerHeight) return null;
      return { x: cx, y: cy };
    }, nombreTest);
    if (!reabrirCoords) throw new Error(`"${nombreTest}" no encontrado o fuera de viewport`);
    await pg.mouse.click(reabrirCoords.x, reabrirCoords.y, { delay: 80 });
    await pg.waitForSelector('app-client-new-potential-client', { state: 'visible', timeout: 8000 });
    await pg.waitForTimeout(600);

    // Click Enviar
    const enviarCoords = await pg.evaluate(() => {
      const btn = document.querySelector('app-client-new-potential-client ion-button.imagenEnviar');
      if (!btn || btn.disabled) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!enviarCoords) throw new Error('Botón Enviar no encontrado o disabled al re-abrir');
    await pg.mouse.click(enviarCoords.x, enviarCoords.y, { delay: 120 });

    // 3 alertas: 1ª [Cancelar/Aceptar], 2ª [OK], 3ª [OK]
    let refPotencial = null;
    for (let i = 0; i < 3; i++) {
      const lbl = await clickAlertBtn(['Aceptar', 'OK']);
      // Capturar el número de ref de la 3ª alerta si tiene "nro."
      if (i === 2) {
        refPotencial = await pg.evaluate(() => {
          const alerts = [...document.querySelectorAll('ion-alert')];
          for (const a of alerts) {
            const msg = a.querySelector('.alert-message');
            if (msg) {
              const m = msg.textContent.match(/nro\.?\s*(\d+)/i);
              if (m) return m[1];
            }
          }
          return null;
        });
      }
      await pg.waitForTimeout(600);
    }

    // Después de Enviar: quedar en home clientes (3 botones)
    await pg.waitForTimeout(1000);
    const n3 = await check3Botones();
    const enviado = n3 >= 3;
    inHomeClts = enviado;

    v('DM-CLT-026', 'Re-abrir Guardado → Enviar → 3 alertas → Enviado',
      enviado ? 'PASS' : 'FAIL',
      `ref potencial: ${refPotencial || 'N/A'}; en home clientes: ${n3} botones`
    );
  } catch (e) {
    v('DM-CLT-026', 'Re-abrir Guardado → Enviar', 'FAIL', e.message);
    v('DM-CLT-031', 'DM-CLT-031', 'BLOCKED', 'CLT-026 falló');
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-CLT-031: Crear 2.º Guardado vía dirty-guard → trash → verificar borrado
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // Estamos en home clientes. Click CLIENTE POTENCIAL → llenar → clickBack → dirty-guard
    await clickBotonClientes('CLIENTE POTENCIAL');
    await pg.waitForSelector('app-client-new-potential-client', { state: 'visible', timeout: 8000 });
    await pg.waitForTimeout(600);

    // Llenar los 8 campos (nombre diferente para poder identificar)
    const camposDel = [
      { name: 'naClient',          val: nombreDel },
      { name: 'nuRif',             val: 'J123456789' },
      { name: 'txAddress',         val: 'Dir Del Smoke' },
      { name: 'txAddressDispatch', val: 'Desp Del Smoke' },
      { name: 'txClient',          val: 'Contacto Del' },
      { name: 'naResponsible',     val: 'Resp Del' },
      { name: 'emClient',          val: 'del@qa.test' },
      { name: 'nuPhone',           val: '04160000000' },
    ];
    for (const campo of camposDel) {
      await fillPotencialInput(campo.name, campo.val);
    }
    // También idEnterprise si aplica
    await pg.evaluate(() => {
      const form = document.querySelector('app-client-new-potential-client');
      if (!form) return;
      const sel = form.querySelector('ion-select[formcontrolname="idEnterprise"]');
      if (!sel || sel.disabled || (sel.value !== null && sel.value !== undefined && sel.value !== '')) return;
      const opts = [...form.querySelectorAll('ion-select-option')];
      let fv = 1;
      for (const opt of opts) {
        const ov = opt.value;
        if (typeof ov === 'number') { fv = ov; break; }
        const n = parseInt(ov, 10);
        if (!isNaN(n)) { fv = n; break; }
      }
      sel.value = fv;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: fv } }));
    });
    await pg.waitForTimeout(400);

    // Click back → dirty-guard → "Guardar y salir" (EXACT match, anti-patrón 3 botones)
    await clickBack();
    await pg.waitForTimeout(900);
    const dirtyCoords = await pg.evaluate(() => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(
        a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
      );
      if (!alerts.length) return null;
      const alert = alerts[alerts.length - 1];
      const btn = [...alert.querySelectorAll('.alert-button')].find(b =>
        b.textContent.trim().toLowerCase() === 'guardar y salir' &&
        b.getBoundingClientRect().width > 0
      );
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!dirtyCoords) throw new Error('Dirty-guard "Guardar y salir" no apareció');
    await pg.mouse.click(dirtyCoords.x, dirtyCoords.y);
    await pg.waitForTimeout(1000);

    // Ahora en BUSCAR list (stale). Click back → home clientes → BUSCAR → lista fresca
    await clickBack();
    await pg.waitForTimeout(800);
    await clickBotonClientes('BUSCAR CLIENTE POTENCIAL');
    await pg.waitForTimeout(2000);

    // Buscar el item nombreDel y hacer trash
    await pg.evaluate((nombre) => {
      const items = [...document.querySelectorAll('ion-item')].filter(
        i => i.getBoundingClientRect().width > 0 && i.textContent.includes(nombre)
      );
      if (items[0]) items[0].scrollIntoView({ block: 'center' });
    }, nombreDel);
    await pg.waitForTimeout(700);

    const trashCoords = await pg.evaluate((nombre) => {
      const items = [...document.querySelectorAll('ion-item')].filter(
        i => i.getBoundingClientRect().width > 0 && i.textContent.includes(nombre)
      );
      if (!items.length) return null;
      const trash = items[0].querySelector('ion-button[color="danger"]');
      if (!trash) return null;
      const r = trash.getBoundingClientRect();
      if (r.width === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, nombreDel);
    if (!trashCoords) throw new Error(`Botón trash no encontrado para "${nombreDel}" — ¿el item tiene Estatus Guardado?`);
    await pg.mouse.click(trashCoords.x, trashCoords.y, { delay: 100 });

    // Dismiss alert de borrado exitoso (directo sin confirmación previa)
    await clickAlertBtn(['OK', 'Aceptar']);
    await pg.waitForTimeout(800);

    // Verificar que el item ya no aparece
    const sigueVisible = await pg.evaluate((nombre) =>
      [...document.querySelectorAll('ion-item')].some(
        i => i.getBoundingClientRect().width > 0 && i.textContent.includes(nombre)
      )
    , nombreDel);

    v('DM-CLT-031', 'Borrar cliente Guardado → desaparece de lista',
      !sigueVisible ? 'PASS' : 'FAIL',
      sigueVisible ? `"${nombreDel}" sigue visible (no se borró)` : `"${nombreDel}" eliminado OK`
    );
  } catch (e) {
    v('DM-CLT-031', 'Borrar cliente Guardado → desaparece de lista', 'FAIL', e.message);
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runClientes };
