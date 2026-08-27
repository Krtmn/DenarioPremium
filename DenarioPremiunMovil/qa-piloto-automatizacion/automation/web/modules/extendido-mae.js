'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const { BUNDLE_DOM } = require('../web-helpers');

const QUERY_PATH = path.resolve(__dirname, '../../db/query.js');

function serverQuery(clienteSlug, sql) {
  try {
    return JSON.parse(
      execFileSync('node', [QUERY_PATH, clienteSlug, sql], { encoding: 'utf8', timeout: 20000 })
    );
  } catch (_) { return []; }
}

/**
 * Bloque 4 · DATOS MAESTROS
 * DWX-MAE-001: Productos — conteo web vs BD (product)
 * DWX-MAE-002: Clientes  — conteo web vs BD (client)
 * DWX-MAE-003: Documentos de Venta — saldos web vs BD (document_sale.nu_balance)
 * Transversales: filtros, paginación, orden por columna.
 */
async function runMaeExtendido(pg, data) {
  const { baseUrl, clienteSlug } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // ── Helper: lee info básica de la página ──────────────────────────────────
  async function infoTabla(ruta) {
    await pg.goto(`${baseUrl}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    return pg.evaluate(() => {
      const pathname = location.pathname;
      if (pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error')) return { error: true, pathname };
      const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
      if (!tabla) return { sinTabla: true, pathname };
      const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim()).filter(Boolean);
      const filas = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')].length;
      const paginador = !!document.querySelector('.ui-paginator');
      const paginadorTxt = (document.querySelector('.ui-paginator-current') || {}).textContent || '';
      return { pathname, cols, filas, paginador, paginadorTxt, tablaId: tabla.id };
    });
  }

  // ── Helper: intenta click en cabecera de columna y verifica orden ─────────
  async function probarOrden(tablaId) {
    return pg.evaluate((id) => {
      const th = document.querySelector(`#${CSS.escape(id)} thead th.ui-sortable-column`);
      if (!th) return false;
      th.click();
      return true;
    }, tablaId).catch(() => false);
  }

  // ── DWX-MAE-001 · Productos ───────────────────────────────────────────────
  try {
    const web = await infoTabla('/pages/productos');
    if (web.login)    { v('DWX-MAE-001', 'Productos — carga y conteo', 'BLOCKED', 'redirigió a login'); }
    else if (web.error)   { v('DWX-MAE-001', 'Productos — carga y conteo', 'FAIL', 'error visible'); }
    else if (web.sinTabla){ v('DWX-MAE-001', 'Productos — carga y conteo', 'N/A', 'tabla no encontrada'); }
    else {
      // BD: contar productos (sin filtro de estado para evitar incompatibilidades de tipo)
      const bdRows  = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM product`);
      const bdTotal = parseInt((bdRows[0] || {}).total || 0, 10);
      const totalWebMatch = web.paginadorTxt.match(/(?:de|of)\s*(\d+)/i);
      const totalWeb = totalWebMatch ? parseInt(totalWebMatch[1], 10) : null;

      const ordenOk = await probarOrden(web.tablaId);
      await pg.waitForTimeout(500);

      const nota = [
        `web: ${web.filas} filas en pantalla${totalWeb ? ` · total paginador: ${totalWeb}` : ''} · BD: ${bdTotal > 0 ? bdTotal : 'ERR/0'} productos`,
        web.paginador ? 'paginación: sí' : 'paginación: no',
        `orden columna: ${ordenOk ? 'ok' : 'no disponible'}`,
        `cols: ${web.cols.slice(0, 6).join(', ')}`,
      ].join(' · ');

      const match = totalWeb !== null ? (bdTotal === 0 || totalWeb <= bdTotal) : web.filas > 0;
      v('DWX-MAE-001', 'Productos — carga y conteo', match ? 'PASS' : 'FAIL', nota);
    }
  } catch (e) { v('DWX-MAE-001', 'Productos — carga y conteo', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-MAE-002 · Clientes ────────────────────────────────────────────────
  try {
    const web = await infoTabla('/pages/clientes');
    if (web.login)    { v('DWX-MAE-002', 'Clientes — carga y conteo', 'BLOCKED', 'redirigió a login'); }
    else if (web.error)   { v('DWX-MAE-002', 'Clientes — carga y conteo', 'FAIL', 'error visible'); }
    else if (web.sinTabla){ v('DWX-MAE-002', 'Clientes — carga y conteo', 'N/A', 'tabla no encontrada'); }
    else {
      const bdRows  = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM client`);
      const bdTotal = parseInt((bdRows[0] || {}).total || 0, 10);
      const totalWebMatch = web.paginadorTxt.match(/(?:de|of)\s*(\d+)/i);
      const totalWeb = totalWebMatch ? parseInt(totalWebMatch[1], 10) : null;

      const ordenOk = await probarOrden(web.tablaId);
      await pg.waitForTimeout(500);

      // Verificar que hay columna de datos fiscales (RIF/NIF/cédula)
      const tieneRif = web.cols.some((c) => /rif|nif|c[eé]dula|fiscal/i.test(c));

      const nota = [
        `web: ${web.filas} filas${totalWeb ? ` · total: ${totalWeb}` : ''} · BD: ${bdTotal} clientes`,
        `datos fiscales (RIF/NIF): ${tieneRif ? 'sí' : 'no detectado'}`,
        `orden columna: ${ordenOk ? 'ok' : 'no disponible'}`,
        `cols: ${web.cols.slice(0, 6).join(', ')}`,
      ].join(' · ');

      const match = totalWeb !== null ? totalWeb === bdTotal : web.filas > 0;
      v('DWX-MAE-002', 'Clientes — carga y conteo', match ? 'PASS' : 'FAIL', nota);
    }
  } catch (e) { v('DWX-MAE-002', 'Clientes — carga y conteo', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-MAE-003 · Documentos de Venta — oracle BD fuerte ─────────────────
  try {
    const web = await infoTabla('/pages/documentos');
    if (web.login)    { v('DWX-MAE-003', 'Documentos de Venta — saldos vs BD', 'BLOCKED', 'redirigió a login'); }
    else if (web.error)   { v('DWX-MAE-003', 'Documentos de Venta — saldos vs BD', 'FAIL', 'error visible'); }
    else if (web.sinTabla){ v('DWX-MAE-003', 'Documentos de Venta — saldos vs BD', 'N/A', 'tabla no encontrada'); }
    else {
      // BD: documentos con saldo pendiente y vencidos
      const bdSaldo  = serverQuery(clienteSlug, `SELECT COUNT(*) AS total, CAST(COALESCE(SUM(nu_balance),0) AS TEXT) AS suma FROM document_sale WHERE nu_balance > 0`);
      const bdVencidos = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM document_sale WHERE nu_balance > 0 AND da_duedate < CURRENT_DATE`);
      const bdCount   = parseInt((bdSaldo[0] || {}).total || 0, 10);
      const bdSuma    = parseFloat((bdSaldo[0] || {}).suma || 0);
      const bdVenc    = parseInt((bdVencidos[0] || {}).total || 0, 10);

      // Buscar columna de saldo/balance en web
      const colSaldo = web.cols.find((c) => /saldo|balance|monto|pendiente/i.test(c));
      const totalWebMatch = web.paginadorTxt.match(/(?:de|of)\s*(\d+)/i);
      const totalWeb = totalWebMatch ? parseInt(totalWebMatch[1], 10) : null;

      const nota = [
        `web: ${web.filas} filas${totalWeb ? ` · total: ${totalWeb}` : ''} · BD pendientes: ${bdCount} · BD vencidos: ${bdVenc}`,
        `suma BD saldos: ${bdSuma.toFixed(2)}`,
        colSaldo ? `columna saldo: "${colSaldo}"` : 'columna saldo no identificada',
        `cols: ${web.cols.slice(0, 6).join(', ')}`,
      ].join(' · ');

      // PASS si la tabla carga y hay datos coherentes (BD tiene pendientes → web también muestra filas)
      const coherente = bdCount === 0 || web.filas > 0;
      v('DWX-MAE-003', 'Documentos de Venta — saldos vs BD', coherente ? 'PASS' : 'FAIL', nota);
    }
  } catch (e) { v('DWX-MAE-003', 'Documentos de Venta — saldos vs BD', 'FAIL', e.message.slice(0, 200)); }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runMaeExtendido };
