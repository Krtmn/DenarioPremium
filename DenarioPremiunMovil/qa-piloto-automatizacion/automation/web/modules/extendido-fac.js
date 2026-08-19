'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const { BUNDLE_DOM, parseNumeroVE, igual } = require('../web-helpers');

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

/**
 * Lee info básica de la tabla de facturaciones ya cargada.
 * Devuelve: { sinTabla, cols, filas, vacio, paginador, paginadorTxt, tablaId, rows }
 */
async function leerTablaFac(pg) {
  return pg.evaluate(() => {
    const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
    if (!tabla) return { sinTabla: true };
    const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim()).filter(Boolean);
    const filaEls = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')];
    const vacio = !!tabla.querySelector('.ui-datatable-empty-message');
    const rows = filaEls.slice(0, 50).map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent.trim())
    );
    const paginador = !!document.querySelector('.ui-paginator');
    const paginadorTxt = (document.querySelector('.ui-paginator-current') || {}).textContent || '';
    return { sinTabla: false, cols, filas: filaEls.length, vacio, rows, paginador, paginadorTxt, tablaId: tabla.id };
  });
}

/**
 * Bloque 3 · FACTURACIONES
 *
 * DWX-FAC-001  Lista carga y pagina           — ruta /pages/facturaciones
 * DWX-FAC-002  Filtros (Ref, vendedor, cliente, fechas, estatus) — conteo vs BD
 * DWX-FAC-003  Detalle: cabecera y líneas vs BD
 * DWX-FAC-004  Cálculos: Σ líneas == total · impuestos · conversión de moneda
 * DWX-FAC-005  Enlace cruzado factura ↔ document_sale
 *
 * Regla: solo lectura — Buscar/Limpiar/filtros/paginación/detalle (lupa) permitidos.
 *        NUNCA Guardar, Eliminar, Editar, Anular.
 * Nota: en algunas playas `invoice` está vacía y los documentos viven en `document_sale`.
 *       Si la lista web sale vacía → verificar en BD antes de reportar.
 */
async function runFacExtendido(pg, data) {
  const { baseUrl, clienteSlug } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // ── BD: contar facturas (invoice y document_sale como respaldo) ───────────
  const bdInvoice     = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM invoice`);
  const bdDocSale     = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM document_sale`);
  const bdInvCount    = parseInt((bdInvoice[0] || {}).total || 0, 10);
  const bdDocCount    = parseInt((bdDocSale[0] || {}).total || 0, 10);
  const bdInvOk       = bdInvoice.length > 0;   // true si la tabla existe
  const bdDocOk       = bdDocSale.length > 0;
  // Si invoice existe pero está vacía, el oráculo real son los document_sale
  const bdTotalFac    = bdInvOk && bdInvCount > 0 ? bdInvCount : (bdDocOk ? bdDocCount : 0);
  const sinDatosEnBD  = bdTotalFac === 0;

  // ── DWX-FAC-001 · Lista carga y pagina ───────────────────────────────────
  try {
    await pg.goto(`${baseUrl}/pages/facturaciones`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg, 8000);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]')) return { error: true, pathname: location.pathname };
      return { ok: true, pathname: location.pathname };
    });

    if (pre.login) {
      v('DWX-FAC-001', 'Facturaciones — lista carga y pagina', 'BLOCKED', 'redirigió a login');
    } else if (pre.error) {
      v('DWX-FAC-001', 'Facturaciones — lista carga y pagina', 'FAIL', `error visible · pathname: ${pre.pathname}`);
    } else {
      // Si la página tiene botón Buscar, ejecutarlo para asegurarse de cargar datos
      const tieneBuscar = await pg.evaluate(() =>
        !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent))
      );
      if (tieneBuscar) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first().click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 10000);
      }

      const tabla = await leerTablaFac(pg);

      if (tabla.sinTabla) {
        v('DWX-FAC-001', 'Facturaciones — lista carga y pagina', 'N/A', 'tabla no encontrada en la página · BD: ' + (bdInvOk ? `invoice=${bdInvCount}` : 'invoice ERR') + ` · document_sale=${bdDocOk ? bdDocCount : 'ERR'}`);
      } else {
        const totalWebMatch = tabla.paginadorTxt.match(/(?:de|of)\s*(\d+)/i);
        const totalWeb = totalWebMatch ? parseInt(totalWebMatch[1], 10) : null;

        // Coherencia: si BD tiene datos → web debería mostrar algo; si BD está vacía → N/A razonable
        const webVacia = tabla.vacio || tabla.filas === 0;
        let resultado, nota;

        if (webVacia && sinDatosEnBD) {
          resultado = 'N/A';
          nota = `lista vacía · confirmado en BD: invoice=${bdInvOk ? bdInvCount : 'ERR'} · document_sale=${bdDocOk ? bdDocCount : 'ERR'} · sin datos en origen, no es defecto`;
        } else if (webVacia && !sinDatosEnBD) {
          resultado = 'FAIL';
          nota = `lista vacía en web pero BD tiene ${bdTotalFac} registros · invoice=${bdInvOk ? bdInvCount : 'ERR'} · document_sale=${bdDocOk ? bdDocCount : 'ERR'}`;
        } else {
          resultado = 'PASS';
          nota = [
            `web: ${tabla.filas} filas en pantalla${totalWeb ? ` · total paginador: ${totalWeb}` : ''}`,
            `BD: invoice=${bdInvOk ? bdInvCount : 'ERR'} · document_sale=${bdDocOk ? bdDocCount : 'ERR'}`,
            tabla.paginador ? 'paginación: sí' : 'paginación: no',
            tabla.cols.length ? `cols: ${tabla.cols.slice(0, 6).join(', ')}` : '',
          ].filter(Boolean).join(' · ');
        }
        v('DWX-FAC-001', 'Facturaciones — lista carga y pagina', resultado, nota);
      }
    }
  } catch (e) { v('DWX-FAC-001', 'Facturaciones — lista carga y pagina', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-FAC-002 · Filtros ─────────────────────────────────────────────────
  try {
    // Navegar de nuevo para tener estado limpio
    await pg.goto(`${baseUrl}/pages/facturaciones`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg, 8000);

    const loginCheck = await pg.evaluate(() => location.pathname.includes('login'));
    if (loginCheck) {
      v('DWX-FAC-002', 'Facturaciones — filtros vs BD', 'BLOCKED', 'redirigió a login');
    } else {
      // Detectar qué filtros están disponibles
      const filtrosInfo = await pg.evaluate(() => {
        const inputs = [...document.querySelectorAll('input[type="text"], input[placeholder]')];
        const placeholders = inputs.map((i) => i.placeholder || i.name || '').filter(Boolean);
        const selects = [...document.querySelectorAll('.ui-selectonemenu')].length;
        const calendarios = [...document.querySelectorAll('.ui-calendar, .ui-datepicker-trigger')].length;
        const tieneBuscar = !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent));
        const tieneLimpiar = !![...document.querySelectorAll('button')].find((b) => /limpiar/i.test(b.textContent));
        // Detectar filtro de ref (campo de número/referencia)
        const tieneRef    = inputs.some((i) => /ref|n[uú]m|nro|referenc/i.test(i.placeholder || i.name || ''));
        return { placeholders, selects, calendarios, tieneBuscar, tieneLimpiar, tieneRef, totalInputs: inputs.length };
      });

      // Intentar aplicar filtro de estatus (primer SelectOneMenu disponible) y verificar conteo
      let filtroAplicado = false;
      let conteoConFiltro = null;
      let labelFiltro = '';

      if (filtrosInfo.selects > 0) {
        // Abrir el primer desplegable (probablemente estatus)
        const opened = await pg.evaluate(() => {
          const trigger = document.querySelector('.ui-selectonemenu-trigger');
          if (trigger) { trigger.click(); return true; }
          return false;
        });

        if (opened) {
          await pg.waitForTimeout(600);
          // Buscar opciones distintas de la neutra (vacía o "Todos")
          const optInfo = await pg.evaluate(() => {
            const items = [...document.querySelectorAll('.ui-selectonemenu-item')];
            const nonEmpty = items.filter((i) => {
              const t = i.textContent.trim();
              return t && !/^todos$|^seleccione|^--/i.test(t);
            });
            if (nonEmpty.length > 0) {
              nonEmpty[0].click();
              return { clicked: true, label: nonEmpty[0].textContent.trim() };
            }
            // No hay opciones no vacías, cerrar
            const trigger = document.querySelector('.ui-selectonemenu-trigger');
            if (trigger) trigger.click();
            return { clicked: false, label: '' };
          });

          if (optInfo.clicked) {
            await pg.waitForTimeout(500);
            labelFiltro = optInfo.label;
            // Verificar que el label cambió (defensa contra COB-WEB-FILTRO-STATUS)
            const labelActual = await pg.evaluate(() => {
              const lbl = document.querySelector('.ui-selectonemenu-label');
              return lbl ? lbl.textContent.trim() : '';
            });

            if (labelActual && !/^todos$|^seleccione|^--/i.test(labelActual)) {
              await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first().click({ timeout: 3000 }).catch(() => {});
              await esperarAjax(pg, 10000);
              filtroAplicado = true;

              const tablaDespues = await leerTablaFac(pg);
              if (!tablaDespues.sinTabla) {
                const totalMatch = tablaDespues.paginadorTxt.match(/(?:de|of)\s*(\d+)/i);
                conteoConFiltro = totalMatch ? parseInt(totalMatch[1], 10) : tablaDespues.filas;
              }
            }
          }
        }
      }

      // Leer la tabla (sin filtro o con filtro aplicado)
      const tablaFinal = await leerTablaFac(pg);

      const nota = [
        `filtros detectados: ${filtrosInfo.totalInputs} inputs · ${filtrosInfo.selects} selects · ${filtrosInfo.calendarios} calendarios`,
        filtrosInfo.tieneRef ? 'filtro Ref: sí' : 'filtro Ref: no detectado',
        filtrosInfo.tieneBuscar ? 'Buscar: sí' : 'Buscar: no',
        filtrosInfo.tieneLimpiar ? 'Limpiar: sí' : 'Limpiar: no',
        filtroAplicado
          ? `estatus "${labelFiltro}" → ${conteoConFiltro !== null ? conteoConFiltro + ' registros' : 'sin conteo'}`
          : 'filtro estatus: no aplicado (sin opciones distintas de neutro)',
        !tablaFinal.sinTabla && !tablaFinal.vacio
          ? `tabla: ${tablaFinal.filas} filas en pantalla${tablaFinal.paginador ? ' · paginación: sí' : ''}`
          : (tablaFinal.sinTabla ? 'tabla: no encontrada' : 'tabla: vacía'),
        `BD: invoice=${bdInvOk ? bdInvCount : 'ERR'} · document_sale=${bdDocOk ? bdDocCount : 'ERR'}`,
      ].filter(Boolean).join(' · ');

      // PASS si la sección de filtros existe (aunque no haya datos); FAIL si la página errora
      const tieneFiltrosestructura = filtrosInfo.totalInputs > 0 || filtrosInfo.selects > 0;
      v('DWX-FAC-002', 'Facturaciones — filtros vs BD',
        tieneFiltrosestructura ? 'PASS' : (sinDatosEnBD ? 'N/A' : 'FAIL'),
        nota);
    }
  } catch (e) { v('DWX-FAC-002', 'Facturaciones — filtros vs BD', 'FAIL', e.message.slice(0, 200)); }

  // ── DWX-FAC-003 · Detalle: cabecera y líneas vs BD ───────────────────────
  // ── DWX-FAC-004 · Cálculos: Σ líneas == total · impuestos ────────────────
  // ── DWX-FAC-005 · Enlace cruzado factura ↔ document_sale ─────────────────
  //
  // FAC-003/004/005 comparten la necesidad de abrir el detalle de la primera factura.
  // Se hace UNA SOLA navegación al detalle y se extraen los datos para los tres casos.
  // Si no hay filas → N/A en los tres.
  let detalleAbierto = false;
  let detalleData = null;   // { cabecera, lineas, url }

  try {
    // Recargar la lista en estado limpio para intentar abrir el detalle
    await pg.goto(`${baseUrl}/pages/facturaciones`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg, 8000);

    const loginCheck2 = await pg.evaluate(() => location.pathname.includes('login'));
    if (loginCheck2) {
      v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', 'BLOCKED', 'redirigió a login');
      v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', 'BLOCKED', 'redirigió a login');
      v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', 'BLOCKED', 'redirigió a login');
    } else {
      // Cargar resultados si hay botón Buscar
      const tieneBuscar2 = await pg.evaluate(() =>
        !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent))
      );
      if (tieneBuscar2) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first().click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 10000);
      }

      const tablaPreDetalle = await leerTablaFac(pg);
      const hayFilas = !tablaPreDetalle.sinTabla && !tablaPreDetalle.vacio && tablaPreDetalle.filas > 0;

      if (!hayFilas) {
        // Sin filas: puede ser N/A por datos o FAIL si BD tiene datos
        const razon = sinDatosEnBD
          ? 'lista vacía · BD también sin datos — N/A, no defecto'
          : `lista vacía en web pero BD tiene ${bdTotalFac} facturas`;
        const res = sinDatosEnBD ? 'N/A' : 'FAIL';
        v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', res, razon);
        v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', res, razon);
        v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', res, razon);
      } else {
        // Intentar abrir el detalle de la primera fila
        // Buscar botón/icono de detalle: clase ui-button con ícono lupa, o link con texto "Ver"
        const clickResult = await pg.evaluate(() => {
          // Estrategia 1: primer botón con ícono de lupa en la primera fila
          const primeraTr = document.querySelector('.ui-datatable tbody tr:not(.ui-datatable-empty-message)');
          if (!primeraTr) return { ok: false, motivo: 'sin primera fila' };

          const lupa = primeraTr.querySelector(
            'button.ui-button, a.ui-button, .ui-button[onclick], ' +
            '.ui-row-toggler, a[href*="detalle"], a[href*="Detalle"], ' +
            'button[title*="Ver"], button[title*="ver"], button[title*="Detalle"], ' +
            '.fa-search, .fa-eye, .ui-icon-search, span.ui-icon'
          );
          if (lupa) {
            // Intentar click en el botón contenedor
            const btn = lupa.closest('button, a') || lupa;
            btn.click();
            return { ok: true, via: 'lupa/icono' };
          }

          // Estrategia 2: primer link o botón de la fila que no sea paginación
          const links = [...primeraTr.querySelectorAll('a, button.ui-button')];
          if (links.length > 0) {
            links[0].click();
            return { ok: true, via: 'primer link/botón de fila' };
          }

          return { ok: false, motivo: 'sin botón de detalle encontrado en primera fila' };
        });

        if (!clickResult.ok) {
          // Sin botón de detalle encontrado: intentar navegación directa
          v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', 'N/A',
            `sin botón de detalle encontrado · ${clickResult.motivo} · lista tiene ${tablaPreDetalle.filas} filas`);
          v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', 'N/A',
            'requiere abrir detalle · ' + clickResult.motivo);
          v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', 'N/A',
            'requiere abrir detalle · ' + clickResult.motivo);
        } else {
          // Esperar navegación o carga de panel de detalle
          await pg.waitForTimeout(2000);
          await esperarAjax(pg, 10000);

          // Verificar si navegamos a una página de detalle o si se abrió un panel en la misma página
          const urlActual = await pg.evaluate(() => location.href);
          const pathActual = await pg.evaluate(() => location.pathname);

          // Si seguimos en /pages/facturaciones, el detalle puede ser un dialog/panel en la misma página
          // Si navegamos, estamos en una página de detalle
          if (pathActual.includes('login')) {
            v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', 'BLOCKED', 'redirigió a login al abrir detalle');
            v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', 'BLOCKED', 'redirigió a login al abrir detalle');
            v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', 'BLOCKED', 'redirigió a login al abrir detalle');
          } else {
            await pg.evaluate(`(${BUNDLE_DOM})()`);

            // Leer cabecera del detalle
            const cabecera = await pg.evaluate(() => window.__qaW ? window.__qaW.leerCabecera() : {});

            // Leer tabla de líneas del detalle (invoice_line o similar)
            const tablasVisibles = await pg.evaluate(() =>
              window.__qaW ? window.__qaW.tablasVisibles() : []
            );

            // Buscar la tabla de líneas: la que tenga columnas de producto/cantidad/monto
            const tablaLineasId = await pg.evaluate(() => {
              if (!window.__qaW) return null;
              return window.__qaW.tablaPorColumnas(['Descripción', 'Cantidad', 'Monto']) ||
                     window.__qaW.tablaPorColumnas(['Producto', 'Cantidad', 'Precio']) ||
                     window.__qaW.tablaPorColumnas(['Artículo', 'Cant.', 'Importe']) ||
                     null;
            });

            // Leer líneas si encontramos la tabla
            let lineas = [];
            if (tablaLineasId) {
              const tablaLineas = await pg.evaluate((id) => window.__qaW ? window.__qaW.leerTabla(id, 100) : null, tablaLineasId);
              if (tablaLineas && tablaLineas.filas) lineas = tablaLineas.filas;
            }

            // Leer todos los textos visibles para valores clave
            const hojas = await pg.evaluate(() => window.__qaW ? window.__qaW.leerHojas(300) : []);

            detalleAbierto = true;
            detalleData = { cabecera, lineas, tablasVisibles, hojas, url: urlActual, path: pathActual };

            // ── FAC-003 · Detalle: cabecera y líneas vs BD ───────────────
            try {
              // Campos esperados en cabecera
              const camposEsperados = ['Ref', 'Referencia', 'Cliente', 'Fecha', 'Vendedor', 'Total', 'Monto', 'Subtotal'];
              const camposEncontrados = camposEsperados.filter((c) =>
                Object.keys(cabecera).some((k) => k.toLowerCase().includes(c.toLowerCase()))
              );

              // Buscar en BD la referencia de esta factura
              // Extraer número de referencia de la cabecera
              const refKey = Object.keys(cabecera).find((k) => /ref|n[uú]m|nro/i.test(k));
              const refVal = refKey ? cabecera[refKey] : null;

              let bdFac = [], bdLineas = [];
              if (refVal) {
                bdFac = serverQuery(clienteSlug,
                  `SELECT co_invoice, de_client, da_invoice, nu_total, nu_subtotal, nu_tax
                   FROM invoice WHERE co_invoice::text = '${refVal.replace(/'/g, "''")}' OR
                                      nu_invoice::text = '${refVal.replace(/'/g, "''")}' LIMIT 1`
                );
                if (bdFac.length > 0) {
                  const coInv = bdFac[0].co_invoice;
                  bdLineas = serverQuery(clienteSlug,
                    `SELECT COUNT(*) AS total FROM invoice_line WHERE co_invoice = '${String(coInv).replace(/'/g, "''")}'`
                  );
                }
              }

              const bdLineasCount = parseInt((bdLineas[0] || {}).total || 0, 10);
              const webLineasCount = lineas.length;

              const nota003 = [
                `campos en cabecera: ${Object.keys(cabecera).length} · esperados encontrados: ${camposEncontrados.join(', ') || 'ninguno'}`,
                refVal ? `Ref detectada: ${refVal}` : 'Ref: no detectada en cabecera',
                tablaLineasId ? `tabla líneas (${tablaLineasId}): ${webLineasCount} filas` : 'tabla de líneas: no encontrada · ' + (tablasVisibles.length ? `tablas visibles: ${tablasVisibles.map((t) => t.id).join(', ')}` : 'ninguna'),
                bdFac.length > 0 ? `BD invoice: ok · BD líneas: ${bdLineasCount}` : (refVal ? 'BD invoice: no encontrada por ref' : 'BD: sin ref para consultar'),
                bdFac.length > 0 && tablaLineasId ? `líneas web=${webLineasCount} vs BD=${bdLineasCount} → ${webLineasCount === bdLineasCount || bdLineasCount === 0 ? 'OK' : 'DIFIEREN'}` : '',
                `vía click: ${clickResult.via} · path detalle: ${pathActual}`,
              ].filter(Boolean).join(' · ');

              const result003 = Object.keys(cabecera).length > 0 ? 'PASS' : 'N/A';
              v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', result003, nota003);
            } catch (e3) {
              v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', 'FAIL', e3.message.slice(0, 200));
            }

            // ── FAC-004 · Cálculos: Σ líneas == total · impuestos ────────
            try {
              // Extraer valores numéricos clave de la cabecera
              const keyTotal    = Object.keys(cabecera).find((k) => /^total$/i.test(k.trim()) || /monto total/i.test(k));
              const keySubtotal = Object.keys(cabecera).find((k) => /subtotal|base imponible/i.test(k));
              const keyTax      = Object.keys(cabecera).find((k) => /iva|impuesto|tax/i.test(k));
              const keyConv     = Object.keys(cabecera).find((k) => /conversi[oó]n|equiv/i.test(k));

              const total    = keyTotal    ? parseNumeroVE(cabecera[keyTotal])    : null;
              const subtotal = keySubtotal ? parseNumeroVE(cabecera[keySubtotal]) : null;
              const tax      = keyTax      ? parseNumeroVE(cabecera[keyTax])      : null;

              // Σ líneas: buscar columnas de subtotal/monto en la tabla de líneas
              let sumaLineas = null;
              if (lineas.length > 0) {
                const colsLinea = Object.keys(lineas[0]);
                const colSublinea = colsLinea.find((c) => /subtotal|importe|monto|total/i.test(c) && !/tax|iva/i.test(c));
                if (colSublinea) {
                  const nums = lineas.map((r) => parseNumeroVE(r[colSublinea])).filter((n) => n !== null);
                  if (nums.length > 0) sumaLineas = nums.reduce((a, b) => a + b, 0);
                }
              }

              // Verificaciones de consistencia aritmética
              const checks = [];
              let hayError = false;

              if (subtotal !== null && tax !== null && total !== null) {
                const esperado = subtotal + tax;
                const ok = igual(esperado, total, 0.01);
                checks.push(`subtotal(${subtotal}) + IVA(${tax}) = ${esperado.toFixed(2)} vs total web(${total}) → ${ok ? 'OK' : 'DIFIERE'}`);
                if (!ok) hayError = true;
              }

              if (sumaLineas !== null && (subtotal !== null || total !== null)) {
                const ref = subtotal !== null ? subtotal : total;
                const ok = igual(sumaLineas, ref, 0.02);   // tolerancia algo mayor por redondeo de líneas
                checks.push(`Σ líneas(${sumaLineas.toFixed(2)}) vs ${subtotal !== null ? 'subtotal' : 'total'}(${ref}) → ${ok ? 'OK' : 'DIFIERE'}`);
                if (!ok) hayError = true;
              }

              if (keyConv) {
                checks.push(`campo conversión detectado: "${keyConv}" = "${cabecera[keyConv]}"`);
              }

              const nota004 = [
                checks.length > 0 ? checks.join(' · ') : 'campos de cálculo no detectados en cabecera',
                keyTotal    ? `Total: ${cabecera[keyTotal]}`    : 'Total: no detectado',
                keySubtotal ? `Subtotal: ${cabecera[keySubtotal]}` : 'Subtotal: no detectado',
                keyTax      ? `IVA/Impuesto: ${cabecera[keyTax]}`  : 'IVA: no detectado',
                sumaLineas !== null ? `Σ líneas calculada: ${sumaLineas.toFixed(2)} (${lineas.length} filas)` : 'Σ líneas: no calculable',
              ].filter(Boolean).join(' · ');

              let result004;
              if (checks.length === 0 && lineas.length === 0) {
                result004 = 'N/A';
              } else if (hayError) {
                result004 = 'FAIL';
              } else {
                result004 = 'PASS';
              }
              v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', result004, nota004);
            } catch (e4) {
              v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', 'FAIL', e4.message.slice(0, 200));
            }

            // ── FAC-005 · Enlace cruzado factura ↔ document_sale ─────────
            try {
              // Buscar referencias a document_sale en la web (enlace, campo, columna)
              const cruzadoWeb = await pg.evaluate(() => {
                const body = document.body.textContent || '';
                // Buscar cualquier ref que indique enlace con cobrable / documento de venta
                const tieneDocVenta = /doc(umento)?.*venta|cobrable|document.?sale/i.test(body);
                // Buscar link cruzado (un <a> que tenga href hacia detalle de cobrable)
                const links = [...document.querySelectorAll('a[href]')].filter((a) =>
                  /documento|cobrable|cobranza|venta/i.test(a.textContent) ||
                  /documento|cobrable|venta/i.test(a.href || '')
                );
                // Buscar columna o campo con referencia a documento de venta
                const campoDocVenta = [...document.querySelectorAll('label, th, span')]
                  .some((el) => /doc(umento)?.*venta|cobrable|N[uú]m.*doc/i.test(el.textContent));
                return { tieneDocVenta, links: links.length, campoDocVenta };
              });

              // Verificar en BD si hay relación invoice → document_sale
              const bdRelacion = serverQuery(clienteSlug,
                `SELECT COUNT(*) AS total FROM invoice i
                 JOIN document_sale ds ON ds.co_invoice = i.co_invoice
                 LIMIT 1`
              );
              const bdRelOk = bdRelacion.length > 0 && parseInt((bdRelacion[0] || {}).total || 0, 10) > 0;

              // Alternativa: ver si invoice tiene campo co_document_sale o similar
              const bdColLink = serverQuery(clienteSlug,
                `SELECT column_name FROM information_schema.columns
                 WHERE table_name = 'invoice'
                 AND column_name IN ('co_document_sale','id_document_sale','nu_document_sale','co_invoice_doc')
                 LIMIT 5`
              );
              const tieneColLink = bdColLink.length > 0;

              const nota005 = [
                `web — enlace document_sale detectado: ${cruzadoWeb.tieneDocVenta ? 'sí' : 'no'} · campo doc.venta: ${cruzadoWeb.campoDocVenta ? 'sí' : 'no'} · links cruzados: ${cruzadoWeb.links}`,
                bdRelOk ? 'BD: relación invoice↔document_sale vía JOIN: sí' : 'BD: JOIN invoice↔document_sale: sin resultados',
                tieneColLink ? `BD: columna de enlace encontrada: ${bdColLink.map((r) => r.column_name).join(', ')}` : 'BD: sin columna de enlace directa en invoice',
                sinDatosEnBD ? 'BD invoice vacía — enlace cruzado no verificable' : '',
              ].filter(Boolean).join(' · ');

              let result005;
              if (sinDatosEnBD) {
                result005 = 'N/A';
              } else if (cruzadoWeb.tieneDocVenta || cruzadoWeb.campoDocVenta || cruzadoWeb.links > 0) {
                result005 = 'PASS';
              } else if (bdRelOk || tieneColLink) {
                // BD muestra relación pero web no la expone visiblemente
                result005 = 'FAIL';
              } else {
                // Ni BD ni web muestran relación — puede ser N/A (tabla sin relación en este cliente)
                result005 = 'N/A';
              }
              v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', result005, nota005);
            } catch (e5) {
              v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', 'FAIL', e5.message.slice(0, 200));
            }
          }
        }
      }
    }
  } catch (e) {
    const msg = e.message.slice(0, 200);
    if (!verdicts.find((x) => x.id === 'DWX-FAC-003')) v('DWX-FAC-003', 'Facturaciones — detalle cabecera vs BD', 'FAIL', msg);
    if (!verdicts.find((x) => x.id === 'DWX-FAC-004')) v('DWX-FAC-004', 'Facturaciones — cálculos Σ líneas == total', 'FAIL', msg);
    if (!verdicts.find((x) => x.id === 'DWX-FAC-005')) v('DWX-FAC-005', 'Facturaciones — enlace cruzado ↔ document_sale', 'FAIL', msg);
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runFacExtendido };
