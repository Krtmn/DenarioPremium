'use strict';
const { BUNDLE_DOM } = require('../web-helpers');

/**
 * Bloque 6 · ESTRUCTURA COMERCIAL
 * Solo smoke de carga: que la página abra, muestre datos y no lance error.
 * NO se edita nada — estas pantallas configuran lo que ve el vendedor en el móvil.
 */
async function runEstExtendido(pg, data) {
  const { baseUrl } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  const PAGINAS = [
    { id: 'DWX-EST-001', desc: 'Estructura de Productos — carga y tabla',  ruta: '/pages/estructuraProducto' },
    { id: 'DWX-EST-002', desc: 'Estructura de Ventas — carga y tabla',      ruta: '/pages/estructuraEmpresa'  },
    { id: 'DWX-EST-003', desc: 'Canales de Distribución — carga y tabla',   ruta: '/pages/segmentacion'       },
    { id: 'DWX-EST-004', desc: 'Plan de Venta — carga y tabla',             ruta: '/pages/presupuestoVenta'   },
    { id: 'DWX-EST-005', desc: 'Cuota de Venta — carga y tabla',            ruta: '/pages/presupuestoCuota'   },
  ];

  for (const pag of PAGINAS) {
    try {
      await pg.goto(`${baseUrl}${pag.ruta}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await pg.evaluate(`(${BUNDLE_DOM})()`);

      const info = await pg.evaluate(() => ({
        pathname:    location.pathname,
        error:       !!(document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')),
        tieneTabla:  !!(document.querySelector('.ui-datatable, .ui-treetable')),
        tieneTree:   !!(document.querySelector('.ui-tree, .ui-treetable')),
        filas:       document.querySelectorAll('.ui-datatable tbody tr:not(.ui-datatable-empty-message), .ui-treetable-row').length,
        cols:        [...document.querySelectorAll('.ui-datatable thead th, .ui-treetable thead th')]
                       .map((th) => th.textContent.trim()).filter(Boolean).slice(0, 8),
      }));

      if (info.pathname.includes('login')) {
        v(pag.id, pag.desc, 'BLOCKED', 'redirigió a login'); continue;
      }
      if (info.error) {
        v(pag.id, pag.desc, 'FAIL', `error visible · ruta: ${info.pathname}`); continue;
      }

      const tiene = info.tieneTabla || info.tieneTree;
      const nota = [
        `ruta OK: ${info.pathname}`,
        tiene ? `${info.tieneTree ? 'árbol' : 'tabla'}: sí (${info.filas}f)` : 'sin tabla ni árbol',
        info.cols.length ? `cols: ${info.cols.join(', ')}` : '',
      ].filter(Boolean).join(' · ');

      v(pag.id, pag.desc, tiene || info.filas === 0 ? 'PASS' : 'N/A', nota);
    } catch (e) {
      v(pag.id, pag.desc, 'FAIL', e.message.slice(0, 200));
    }
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runEstExtendido };
