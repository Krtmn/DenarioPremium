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
 * Bloque 2 · INDICADORES
 * DWX-IND-003 Morosidad: oracle BD fuerte (saldos vencidos vs document_sale).
 * DWX-IND-001/002/004-007: smoke de carga + tabla/datos visibles.
 */
async function runIndExtendido(pg, data) {
  const { baseUrl, clienteSlug } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // ── Helper: navega y verifica carga básica ────────────────────────────────
  async function smokeCarga(id, desc, ruta) {
    try {
      await pg.goto(`${baseUrl}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await pg.evaluate(`(${BUNDLE_DOM})()`);
      const info = await pg.evaluate(() => ({
        pathname: location.pathname,
        error:    !!(document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')),
        tieneTabla: !!(document.querySelector('.ui-datatable, table.ui-widget-content')),
        tieneCanvas: !!(document.querySelector('canvas')),
        filas:    document.querySelectorAll('.ui-datatable tbody tr:not(.ui-datatable-empty-message)').length,
      }));
      if (info.pathname.includes('login')) { v(id, desc, 'BLOCKED', 'redirigió a login'); return false; }
      if (info.error)                      { v(id, desc, 'FAIL',    `error visible · ruta: ${ruta}`); return false; }
      const nota = [
        `ruta OK: ${info.pathname}`,
        info.tieneTabla  ? `tabla: sí (${info.filas}f)` : '',
        info.tieneCanvas ? 'gráfico: sí' : '',
        (!info.tieneTabla && !info.tieneCanvas) ? 'sin tabla ni gráfico — N/A' : '',
      ].filter(Boolean).join(' · ');
      const resultado = (!info.tieneTabla && !info.tieneCanvas) ? 'N/A' : 'PASS';
      v(id, desc, resultado, nota);
      return true;
    } catch (e) {
      v(id, desc, 'FAIL', e.message.slice(0, 200));
      return false;
    }
  }

  // ── DWX-IND-001 · Pedidos ─────────────────────────────────────────────────
  await smokeCarga('DWX-IND-001', 'Indicador Pedidos — carga y tabla/gráfico visible', '/pages/indicadoresPedidos');

  // ── DWX-IND-002 · Cobranzas ──────────────────────────────────────────────
  await smokeCarga('DWX-IND-002', 'Indicador Cobranzas — carga y tabla/gráfico visible',
    '/pages/protected/indicadores/indicadorCobros.xhtml');

  // ── DWX-IND-003 · Morosidad — oracle BD fuerte ───────────────────────────
  try {
    await pg.goto(
      `${baseUrl}/pages/protected/indicadores/indicadorMorosos.xhtml`,
      { waitUntil: 'domcontentloaded', timeout: 20000 }
    );
    await pg.evaluate(`(${BUNDLE_DOM})()`);

    const webInfo = await pg.evaluate(() => {
      const pathname = location.pathname;
      if (pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error')) return { error: true, pathname };

      // Buscar la tabla de morosos
      const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
      if (!tabla) return { sinTabla: true, pathname };

      const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim()).filter(Boolean);
      const rows = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')];
      const filas = rows.slice(0, 100).map((tr) => {
        const cells = [...tr.querySelectorAll('td')];
        const obj = {};
        cols.forEach((c, i) => { if (cells[i]) obj[c] = cells[i].textContent.trim(); });
        return obj;
      });

      // Buscar el total general si aparece en un resumen/footer
      const totalEl = tabla.querySelector('tfoot td, .ui-datatable-footer td');
      const totalTexto = totalEl ? totalEl.textContent.trim() : '';

      return { pathname, cols, filas, totalFilasWeb: rows.length, totalTexto };
    });

    if (webInfo.login)    { v('DWX-IND-003', 'Morosidad — oracle BD', 'BLOCKED', 'redirigió a login'); }
    else if (webInfo.error)   { v('DWX-IND-003', 'Morosidad — oracle BD', 'FAIL', 'error visible en pantalla'); }
    else if (webInfo.sinTabla){ v('DWX-IND-003', 'Morosidad — oracle BD', 'N/A', 'tabla no encontrada — puede ser solo gráfico'); }
    else {
      // Oracle BD: clientes con saldo vencido
      const bdRows = serverQuery(clienteSlug,
        `SELECT co_client, CAST(SUM(nu_balance) AS TEXT) as saldo_total
         FROM document_sale
         WHERE nu_balance > 0 AND da_duedate < CURRENT_DATE
         GROUP BY co_client
         ORDER BY SUM(nu_balance) DESC`
      );

      const bdCount   = bdRows.length;
      const webCount  = webInfo.totalFilasWeb;

      // Calcular total BD
      const totalBd = bdRows.reduce((acc, r) => acc + parseFloat(r.saldo_total || 0), 0);

      // Intentar extraer total de la web (buscar columna de saldo/monto en filas)
      const colSaldo = webInfo.cols.find((c) => /saldo|monto|balance|deuda|total/i.test(c));
      let totalWeb = 0;
      if (colSaldo) {
        for (const f of webInfo.filas) {
          const val = parseFloat((f[colSaldo] || '').replace(/[^0-9.-]/g, '')) || 0;
          totalWeb += val;
        }
      }

      // Tolerancia: ±5% en totales (diferencias por redondeo/moneda)
      const pctDiff = totalBd > 0 ? Math.abs(totalWeb - totalBd) / totalBd * 100 : 0;
      const totalOk = totalBd === 0 || colSaldo === undefined || pctDiff <= 5;

      // Conteo: la web puede paginar (mostrar menos filas que la BD)
      const conteoOk = webCount > 0 && (webCount <= bdCount + 2); // tolerancia +2 por diferencias de corte

      const nota = [
        `web: ${webCount} clientes · BD: ${bdCount} clientes`,
        colSaldo ? `total web: ${totalWeb.toFixed(2)} · total BD: ${totalBd.toFixed(2)} · diff: ${pctDiff.toFixed(1)}%` : 'columna saldo no identificada',
        `cols: ${webInfo.cols.slice(0, 6).join(', ')}`,
      ].join(' · ');

      if (bdCount === 0 && webCount === 0) {
        v('DWX-IND-003', 'Morosidad — oracle BD', 'N/A', 'sin morosos en BD ni en web · ' + nota);
      } else if (!conteoOk) {
        v('DWX-IND-003', 'Morosidad — oracle BD', 'FAIL',
          `conteo web (${webCount}) no cuadra con BD (${bdCount}) · ${nota}`);
      } else if (!totalOk) {
        v('DWX-IND-003', 'Morosidad — oracle BD', 'FAIL',
          `total diverge >5% · ${nota}`);
      } else {
        v('DWX-IND-003', 'Morosidad — oracle BD', 'PASS', nota);
      }
    }
  } catch (e) {
    v('DWX-IND-003', 'Morosidad — oracle BD', 'FAIL', e.message.slice(0, 200));
  }

  // ── DWX-IND-004 · % Participación ────────────────────────────────────────
  await smokeCarga('DWX-IND-004', 'Indicador % Participación productos — carga y tabla/gráfico', '/pages/indicadoresProductos');

  // ── DWX-IND-005 · Ventas Diarias ─────────────────────────────────────────
  await smokeCarga('DWX-IND-005', 'Indicador Ventas Diarias — carga y tabla/gráfico',
    '/pages/protected/indicadores/pedidosProductosVentas.xhtml');

  // ── DWX-IND-006 · Pedidos por Cliente ────────────────────────────────────
  await smokeCarga('DWX-IND-006', 'Indicador Pedidos por Cliente — carga y tabla/gráfico', '/pages/pedidosClientes');

  // ── DWX-IND-007 · Pedidos por Vendedor ───────────────────────────────────
  await smokeCarga('DWX-IND-007', 'Indicador Pedidos por Vendedor — carga y tabla/gráfico', '/pages/pedidosVendedores');

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runIndExtendido };
