'use strict';
const fs = require('fs');
const path = require('path');
const { BUNDLE_DOM } = require('../web-helpers');

/**
 * Bloque 7 · CONFIGURACIÓN — smoke de carga únicamente.
 * Regla dura: NO abrir formularios de edición, NO tocar toggles, NO pulsar Guardar/Aplicar/Eliminar.
 * DWX-CFG-006 (log de errores) es la excepción: se lee y se reportan errores recientes.
 */
async function runCfgExtendido(pg, data) {
  const { baseUrl, runDir } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  async function verificarCarga(id, desc, ruta, opts = {}) {
    try {
      await pg.goto(`${baseUrl}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await pg.evaluate(`(${BUNDLE_DOM})()`);

      // Comprobar que no hay redirección a login o error 500
      const info = await pg.evaluate(() => ({
        pathname: location.pathname,
        tieneError:  !!(document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')),
        tieneTabla:  !!(document.querySelector('.ui-datatable, table.ui-widget-content')),
        tieneForm:   !!(document.querySelector('form')),
        titulo:      (document.querySelector('h1,h2,.titulo-pagina,.pageTitle') || {}).textContent || '',
      }));

      if (info.pathname.includes('login')) {
        v(id, desc, 'BLOCKED', 'redirigió a login — sesión expirada');
        return false;
      }
      if (info.tieneError) {
        v(id, desc, 'FAIL', `error visible en pantalla · ruta: ${ruta}`);
        return false;
      }

      const nota = [
        `ruta OK: ${info.pathname}`,
        info.tieneTabla  ? 'tabla: sí' : 'tabla: no',
        info.titulo.trim() ? `título: "${info.titulo.trim().slice(0, 60)}"` : '',
        opts.extra || '',
      ].filter(Boolean).join(' · ');

      v(id, desc, 'PASS', nota);
      return true;
    } catch (e) {
      v(id, desc, 'FAIL', e.message.slice(0, 200));
      return false;
    }
  }

  // ── DWX-CFG-001 · Datos Empresa ─────────────────────────────────────────────
  await verificarCarga(
    'DWX-CFG-001', 'Datos Empresa — carga sin error',
    '/pages/protected/empresa/datosEmpresa.xhtml'
  );

  // ── DWX-CFG-002 · Variables Globales — Empresa ───────────────────────────────
  await verificarCarga(
    'DWX-CFG-002', 'Variables Globales Empresa — carga sin error',
    '/pages/variablesConfiguracion'
  );

  // ── DWX-CFG-003 · Variables Globales — Clientes ──────────────────────────────
  await verificarCarga(
    'DWX-CFG-003', 'Variables Globales Clientes — carga sin error',
    '/pages/variablesConfiguracionClientes'
  );

  // ── DWX-CFG-004 · Usuarios / Dispositivos / Supervisores / Licencias ─────────
  const cfg4Pages = [
    ['/pages/usuarios',      'Usuarios'],
    ['/pages/dispositivos',  'Dispositivos'],
    ['/pages/supervisores',  'Supervisores'],
    ['/pages/licencias',     'Licencias'],
  ];
  const cfg4Results = [];
  for (const [ruta, nombre] of cfg4Pages) {
    try {
      await pg.goto(`${baseUrl}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const info = await pg.evaluate(() => ({
        pathname: location.pathname,
        error: !!(document.querySelector('.ui-growl-error, .ui-messages-error')),
      }));
      cfg4Results.push(info.error ? `${nombre}:❌` : `${nombre}:✅`);
    } catch (e) {
      cfg4Results.push(`${nombre}:⚠ ${e.message.slice(0,40)}`);
    }
  }
  const cfg4Fallo = cfg4Results.some((r) => r.includes('❌') || r.includes('⚠'));
  v('DWX-CFG-004', 'Usuarios · Dispositivos · Supervisores · Licencias',
    cfg4Fallo ? 'FAIL' : 'PASS', cfg4Results.join(' · '));

  // ── DWX-CFG-005 · Catálogos ──────────────────────────────────────────────────
  const catalogos = [
    ['/pages/tiposdevol',    'Tipos devol.'],
    ['/pages/motivosdevol',  'Motivos devol.'],
    ['/pages/iva',           'IVA'],
    ['/pages/igtf',          'IGTF'],
    ['/pages/actividades',   'Actividades'],
    ['/pages/tipoPedidos',   'Tipos pedido'],
    ['/pages/feriados',      'Feriados'],
  ];
  const cfg5Results = [];
  for (const [ruta, nombre] of catalogos) {
    try {
      await pg.goto(`${baseUrl}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const info = await pg.evaluate(() => ({
        pathname: location.pathname,
        error: !!(document.querySelector('.ui-growl-error, .ui-messages-error')),
        filas: document.querySelectorAll('.ui-datatable tbody tr:not(.ui-datatable-empty-message)').length,
      }));
      cfg5Results.push(`${nombre}:${info.error ? '❌' : `✅(${info.filas}f)`}`);
    } catch (e) {
      cfg5Results.push(`${nombre}:⚠`);
    }
  }
  const cfg5Fallo = cfg5Results.some((r) => r.includes('❌') || r.includes('⚠'));
  v('DWX-CFG-005', 'Catálogos (7 pantallas)',
    cfg5Fallo ? 'FAIL' : 'PASS', cfg5Results.join(' · '));

  // ── DWX-CFG-006 · Log de Errores de Aplicación ───────────────────────────────
  // Lee TODAS las filas visibles en la primera página del log.
  // Si hay errores, escribe errores-aplicacion.md en runDir con el detalle completo.
  try {
    await pg.goto(
      `${baseUrl}/pages/protected/administracion/erroresAplicacion/erroresAplicacion.xhtml`,
      { waitUntil: 'domcontentloaded', timeout: 20000 }
    );
    await pg.evaluate(`(${BUNDLE_DOM})()`);

    const info = await pg.evaluate(() => {
      const pathname = location.pathname;
      if (pathname.includes('login')) return { login: true };

      const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
      if (!tabla) return { sinTabla: true, pathname };

      const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim()).filter(Boolean);
      const rows = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')];
      // Leer hasta 200 filas de la primera página
      const filas = rows.slice(0, 200).map((tr) => {
        const cells = [...tr.querySelectorAll('td')];
        const obj = {};
        cols.forEach((c, i) => { if (cells[i]) obj[c] = cells[i].textContent.trim(); });
        return obj;
      });
      // Contador del paginador (puede existir) para saber si hay más páginas
      const paginador = tabla.closest('.ui-datatable-tablewrapper')
        && document.querySelector('.ui-paginator-current');
      const paginadorTxt = paginador ? paginador.textContent.trim() : '';
      return { pathname, total: rows.length, cols, filas, paginadorTxt };
    });

    if (info.login) {
      v('DWX-CFG-006', 'Log de errores de aplicación', 'BLOCKED', 'redirigió a login');
    } else if (info.sinTabla) {
      v('DWX-CFG-006', 'Log de errores de aplicación', 'N/A', `tabla no encontrada · ruta: ${info.pathname}`);
    } else if (info.total === 0) {
      v('DWX-CFG-006', 'Log de errores de aplicación', 'PASS', 'sin errores registrados en el log ✅');
    } else {
      // Agrupar por tipo de mensaje para el resumen en nota
      const conteo = {};
      for (const f of info.filas) {
        const msg = (f['Descripción'] || f['Descripcion'] || f['Error'] || f['Mensaje'] || Object.values(f)[1] || '').slice(0, 80);
        conteo[msg] = (conteo[msg] || 0) + 1;
      }
      const topTipos = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([msg, n]) => `"${msg.slice(0, 60)}" ×${n}`)
        .join(' | ');

      // Escribir archivo detallado si runDir disponible
      if (runDir) {
        const lineas = [
          `# Log de Errores de Aplicación — ${data.clienteSlug}`,
          `_${info.total} error(es) en primera página${info.paginadorTxt ? ' · ' + info.paginadorTxt : ''}_`,
          '',
          `| ${info.cols.join(' | ')} |`,
          `| ${info.cols.map(() => '---').join(' | ')} |`,
          ...info.filas.map((f) => `| ${info.cols.map((c) => (f[c] || '').replace(/\|/g, '/')).join(' | ')} |`),
        ];
        fs.writeFileSync(path.join(runDir, 'errores-aplicacion.md'), lineas.join('\n'), 'utf8');
      }

      v('DWX-CFG-006', 'Log de errores de aplicación', 'FAIL',
        `${info.total} error(es)${info.paginadorTxt ? ' (' + info.paginadorTxt + ')' : ''} · top tipos: ${topTipos}` +
        (runDir ? ' · detalle en errores-aplicacion.md' : ''));
    }
  } catch (e) {
    v('DWX-CFG-006', 'Log de errores de aplicación', 'FAIL', e.message.slice(0, 200));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runCfgExtendido };
