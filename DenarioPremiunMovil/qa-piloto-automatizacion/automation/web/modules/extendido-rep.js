'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const { BUNDLE_DOM } = require('../web-helpers');

const QUERY_PATH = path.resolve(__dirname, '../../db/query.js');

function serverQuery(clienteSlug, sql) {
  try {
    return JSON.parse(execFileSync('node', [QUERY_PATH, clienteSlug, sql], { encoding: 'utf8', timeout: 20000 }));
  } catch (_) { return []; }
}

async function esperarAjax(pg, ms = 6000) {
  await pg.waitForFunction(() => {
    const jq = (window.PrimeFaces && PrimeFaces.$) || window.jQuery;
    return !jq || jq.active === 0;
  }, { timeout: ms }).catch(() => {});
}

async function leerTablaInfo(pg) {
  return pg.evaluate(() => {
    const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
    if (!tabla) return { sinTabla: true };
    const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    const filas = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')];
    const vacio = !!tabla.querySelector('.ui-datatable-empty-message');
    const rows = filas.slice(0, 60).map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())
    );
    return { cols, filas: filas.length, vacio, rows, tablaId: tabla.id };
  });
}

/**
 * Bloque 1 · REPORTES
 *
 * DWX-REP-001  Plan vs Cuota              — carga + estructura tabla
 * DWX-REP-002  Cumplimiento de Cuota      — carga + detección defecto encabezados vacíos
 * DWX-REP-003  Activación de Clientes     — carga + filtro Vendedores + oracle BD (cartera)
 * DWX-REP-004  Rotación de Inventario     — carga + BD client_stock
 *
 * Regla: solo lectura — Buscar/Limpiar/filtros están permitidos; Guardar/Eliminar/Editar NO.
 */
async function runRepExtendido(pg, data) {
  const { baseUrl, clienteSlug } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // ── DWX-REP-001 · Plan vs Cuota ──────────────────────────────────────────────
  try {
    await pg.goto(`${baseUrl}/pages/reportePlanCuota`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')) return { error: true };
      return {
        tieneTabla: !!(document.querySelector('.ui-datatable')),
        tieneBuscar: !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent)),
        filtros: [...document.querySelectorAll('.ui-selectonemenu, select')].length,
      };
    });

    if (pre.login)  { v('DWX-REP-001', 'Plan vs Cuota — carga y estructura', 'BLOCKED', 'redirigió a login'); }
    else if (pre.error) { v('DWX-REP-001', 'Plan vs Cuota — carga y estructura', 'FAIL', 'error visible al cargar'); }
    else {
      if (pre.tieneBuscar) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first().click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 8000);
      }
      const tabla = await leerTablaInfo(pg);
      const nota = [
        `carga OK · tabla: ${tabla.sinTabla ? 'no' : `sí (${tabla.filas}f${tabla.vacio ? ', sin datos' : ''})`}`,
        tabla.cols && tabla.cols.length ? `cols: ${tabla.cols.slice(0, 6).join(', ')}` : '',
        `filtros: ${pre.filtros}`,
      ].filter(Boolean).join(' · ');
      v('DWX-REP-001', 'Plan vs Cuota — carga y estructura', !tabla.sinTabla ? 'PASS' : 'N/A', nota);
    }
  } catch (e) { v('DWX-REP-001', 'Plan vs Cuota — carga y estructura', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-REP-002 · Cumplimiento de Cuota ──────────────────────────────────────
  try {
    await pg.goto(`${baseUrl}/pages/reporteCumplimientoCuota`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')) return { error: true };
      const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
      const cols = tabla ? [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim()) : [];
      const colsVacias = cols.filter((c) => c === '()' || c.trim() === '');
      return { tieneTabla: !!tabla, cols, colsVacias };
    });

    if (pre.login)  { v('DWX-REP-002', 'Cumplimiento de Cuota — encabezados', 'BLOCKED', 'redirigió a login'); }
    else if (pre.error) { v('DWX-REP-002', 'Cumplimiento de Cuota — encabezados', 'FAIL', 'error visible al cargar'); }
    else {
      const defecto = pre.colsVacias && pre.colsVacias.length > 0;
      const nota = [
        `carga OK · tabla: ${pre.tieneTabla ? 'sí' : 'no'}`,
        pre.cols.length ? `cols: ${pre.cols.join(' | ')}` : '',
        defecto ? `⚠ ${pre.colsVacias.length} col(s) sin nombre "()" — defecto confirmado` : 'encabezados: ok',
      ].filter(Boolean).join(' · ');
      v('DWX-REP-002', 'Cumplimiento de Cuota — encabezados', defecto ? 'FAIL' : (pre.tieneTabla ? 'PASS' : 'N/A'), nota);
    }
  } catch (e) { v('DWX-REP-002', 'Cumplimiento de Cuota — encabezados', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-REP-003 · Activación de Clientes ─────────────────────────────────────
  try {
    await pg.goto(`${baseUrl}/pages/reporteActivacionClientes`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const loginCheck = await pg.evaluate(() => location.pathname.includes('login'));
    if (loginCheck) {
      v('DWX-REP-003', 'Activación Clientes — oracle BD', 'BLOCKED', 'redirigió a login');
    } else {
      // Seleccionar "Vendedores" en el primer SelectOneMenu (clasificacion)
      const seleccionado = await pg.evaluate(() => {
        const triggers = document.querySelectorAll('.ui-selectonemenu-trigger');
        if (triggers.length > 0) { triggers[0].click(); return true; }
        return false;
      });
      if (seleccionado) {
        await pg.waitForTimeout(600);
        const clickedOpt = await pg.evaluate(() => {
          const items = [...document.querySelectorAll('.ui-selectonemenu-item')];
          const target = items.find((i) => /vendedores?/i.test(i.textContent));
          if (target) { target.click(); return true; }
          // Cerrar si no encontró
          const trigger = document.querySelector('.ui-selectonemenu-trigger');
          if (trigger) trigger.click();
          return false;
        });
        await pg.waitForTimeout(400);

        if (clickedOpt) {
          await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first().click({ timeout: 3000 }).catch(() => {});
          await esperarAjax(pg, 10000);
        }
      }

      const tabla = await leerTablaInfo(pg);

      if (tabla.sinTabla || tabla.vacio || tabla.filas === 0) {
        v('DWX-REP-003', 'Activación Clientes — oracle BD', 'N/A',
          `sin filas con filtro Vendedores · ${tabla.sinTabla ? 'tabla no encontrada' : 'tabla vacía'}`);
      } else {
        // Columnas esperadas: Descripción, Clientes en Cartera, Clientes Activados, % Activación
        const idxCli  = tabla.cols.findIndex((c) => /clientes?\s*(en)?\s*(cartera)?$/i.test(c) && !/activ/i.test(c));
        const idxAct  = tabla.cols.findIndex((c) => /activ/i.test(c) && !/[%\/]/.test(c));
        const idxPct  = tabla.cols.findIndex((c) => /%.*activ|activ.*%/i.test(c));

        // Oracle BD: cartera total
        const bdClientes = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM client`);
        const totalCartera = parseInt((bdClientes[0] || {}).total || 0, 10);

        // Detectar defecto conocido: ≥3 vendedores con mismo conteo ≈ cartera total
        let defectoCartera = false;
        let defectoMsg = '';
        if (idxCli >= 0 && totalCartera > 0) {
          const counts = tabla.rows
            .map((r) => parseInt((r[idxCli] || '').replace(/\D/g, '')) || 0)
            .filter((n) => n > 0);
          const freq = {};
          for (const n of counts) freq[n] = (freq[n] || 0) + 1;
          const [val, cnt] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] || [0, 0];
          if (cnt >= 3 && Math.abs(parseInt(val) - totalCartera) / totalCartera < 0.10) {
            defectoCartera = true;
            defectoMsg = `${cnt} vendedores muestran ${val} clientes ≈ cartera total (${totalCartera}) — defecto conocido REP-ACTIVACION-CLIENTES-CIFRAS-MALAS`;
          }
        }

        // Verificar aritmética % = Activados/Clientes×100
        let erroresArit = 0;
        if (idxCli >= 0 && idxAct >= 0 && idxPct >= 0) {
          for (const row of tabla.rows) {
            const cli = parseFloat((row[idxCli] || '').replace(',', '.')) || 0;
            const act = parseFloat((row[idxAct] || '').replace(',', '.')) || 0;
            const pctWeb = parseFloat((row[idxPct] || '').replace(',', '.')) || 0;
            if (cli > 0 && Math.abs(pctWeb - (act / cli) * 100) > 0.1) erroresArit++;
          }
        }

        const nota = [
          `${tabla.filas} vendedores · BD cartera: ${totalCartera || 'ERR/0'}`,
          defectoCartera ? `⚠ DEFECTO: ${defectoMsg}` : 'cartera por vendedor: coherente',
          (idxCli >= 0 && idxAct >= 0 && idxPct >= 0)
            ? `aritmética %: ${erroresArit === 0 ? 'ok' : `${erroresArit} filas con error`}`
            : 'aritmética: no verificable (cols no identificadas)',
          `cols: ${tabla.cols.slice(0, 5).join(', ')}`,
        ].filter(Boolean).join(' · ');

        v('DWX-REP-003', 'Activación Clientes — oracle BD',
          (defectoCartera || erroresArit > 0) ? 'FAIL' : 'PASS', nota);
      }
    }
  } catch (e) { v('DWX-REP-003', 'Activación Clientes — oracle BD', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-REP-004 · Rotación de Inventario ─────────────────────────────────────
  try {
    await pg.goto(`${baseUrl}/pages/reporteRotacionInventario`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')) return { error: true };
      return {
        tieneTabla:  !!(document.querySelector('.ui-datatable')),
        tieneGrafico: !!(document.querySelector('canvas')),
        tieneBuscar: !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent)),
      };
    });

    if (pre.login)  { v('DWX-REP-004', 'Rotación Inventario — carga', 'BLOCKED', 'redirigió a login'); }
    else if (pre.error) { v('DWX-REP-004', 'Rotación Inventario — carga', 'FAIL', 'error visible al cargar'); }
    else {
      if (pre.tieneBuscar) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first().click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 8000);
      }
      const tabla = await leerTablaInfo(pg);

      // Oracle BD: verificar tabla client_stock
      const bdStock  = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM client_stock`);
      const bdCount  = parseInt((bdStock[0] || {}).total || 0, 10);
      const bdOk     = bdStock.length > 0 && bdCount >= 0;

      const nota = [
        `carga OK`,
        tabla.sinTabla ? 'sin tabla' : `tabla: ${tabla.filas}f${tabla.vacio ? ' (sin datos)' : ''}`,
        pre.tieneGrafico ? 'gráfico: sí' : '',
        bdOk ? `BD client_stock: ${bdCount} filas` : 'BD client_stock: ERR (tabla no existe o sin acceso)',
        tabla.cols && tabla.cols.length ? `cols: ${tabla.cols.slice(0, 5).join(', ')}` : '',
      ].filter(Boolean).join(' · ');

      v('DWX-REP-004', 'Rotación Inventario — carga',
        (!tabla.sinTabla || pre.tieneGrafico) ? 'PASS' : 'N/A', nota);
    }
  } catch (e) { v('DWX-REP-004', 'Rotación Inventario — carga', 'FAIL', e.message.slice(0, 200)); }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runRepExtendido };
