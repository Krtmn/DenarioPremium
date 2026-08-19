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
    const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim()).filter(Boolean);
    const filas = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')].length;
    const vacio = !!tabla.querySelector('.ui-datatable-empty-message');
    const paginadorTxt = (document.querySelector('.ui-paginator-current') || {}).textContent || '';
    const totalMatch = paginadorTxt.match(/(?:de|of)\s*(\d+)/i);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : null;
    return { cols, filas, vacio, total, tablaId: tabla.id };
  });
}

/**
 * Bloque 5 · VISITAS (planificación de rutas)
 *
 * DWX-VIS-001  Itinerario       — /pages/itinerario
 *              Carga + tabla + detección de defecto VIS-WEB-FILTRO-COORDENADAS (confirmado QA).
 *
 * DWX-VIS-002  Rutero           — /pages/protected/visitas/rutero.xhtml
 *              Carga + mapa/canvas + Buscar con defaults + oracle BD (visitas con coord).
 *              Nota: mapa en blanco (lat:NaN) es ESPERADO cuando no hay datos con coord en BD
 *              (descartado DESCARTADOS-WEBEXT-ISLACOCHE-20260731).
 *
 * DWX-VIS-003  Mapa de Rutas   — /pages/mapaRutas
 *              Carga + detección de elemento mapa + Buscar + oracle BD (route/route_plan).
 *
 * Regla: solo lectura — Buscar/filtros permitidos.
 * NUNCA: Guardar, Eliminar, Asignar ruta, Editar.
 */
async function runVisExtendido(pg, data) {
  const { baseUrl, clienteSlug } = data;
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // ── DWX-VIS-001 · Itinerario ─────────────────────────────────────────────────
  // Pantalla de planificación: muestra la ruta del día con estatus por cliente.
  // Defecto confirmado VIS-WEB-FILTRO-COORDENADAS: el filtro "Coordenadas = No Realizado"
  // devuelve 0 resultados aunque 90+ filas muestren Geo="No Realizado". Este módulo lo detecta.
  try {
    await pg.goto(`${baseUrl}/pages/itinerario`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]'))
        return { error: true, pathname: location.pathname };
      return {
        pathname: location.pathname,
        tieneBuscar: !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent)),
        tieneTabla: !!(document.querySelector('.ui-datatable')),
        numSelectMenus: document.querySelectorAll('select').length,
      };
    });

    if (pre.login) {
      v('DWX-VIS-001', 'Itinerario — carga, tabla y filtro Coordenadas', 'BLOCKED', 'redirigió a login');
    } else if (pre.error) {
      v('DWX-VIS-001', 'Itinerario — carga, tabla y filtro Coordenadas', 'FAIL',
        `error visible · ruta: ${pre.pathname}`);
    } else {
      // Buscar con valores por defecto para ver la ruta completa
      if (pre.tieneBuscar) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first()
          .click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 10000);
      }

      const tabla = await leerTablaInfo(pg);
      const totalInicial = tabla.total !== null ? tabla.total : tabla.filas;

      // Identificar columna Geo y contar filas con "No Realizado" (alimentan la prueba del filtro)
      const geoInfo = await pg.evaluate(() => {
        const tabla = [...document.querySelectorAll('.ui-datatable')].find((t) => t.offsetParent !== null);
        if (!tabla) return { tieneGeo: false, conteoNoRealizado: 0 };
        const cols = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim());
        const tieneGeo = cols.some((c) => /geo|coord/i.test(c));
        const filas = [...tabla.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)')];
        const conteoNoRealizado = filas.filter((tr) => /no\s*realizado/i.test(tr.textContent)).length;
        return { tieneGeo, conteoNoRealizado };
      });

      // Oracle BD: contar visitas registradas
      const bdVis = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM visit`);
      const bdTotal = parseInt((bdVis[0] || {}).total || 0, 10);
      const bdOk = bdVis.length > 0;

      // ── Probar filtro Coordenadas (detectar VIS-WEB-FILTRO-COORDENADAS) ────────
      // Solo si hay filas con Geo="No Realizado" para que la prueba sea significativa.
      let defectoCoord = false;
      let coordNota = '';

      if (geoInfo.conteoNoRealizado > 0 && pre.numSelectMenus > 0) {
        // Localizar el <select> cuyas opciones incluyen "No Realizado" → es el de Coordenadas
        const coordSelectIdx = await pg.evaluate(() => {
          const selects = [...document.querySelectorAll('select')];
          for (let i = 0; i < selects.length; i++) {
            if ([...selects[i].options].some((o) => /no\s*realizado/i.test(o.text))) return i;
          }
          return -1;
        });

        if (coordSelectIdx >= 0) {
          // Abrir el SelectOneMenu correspondiente y elegir "No Realizado"
          await pg.evaluate((idx) => {
            const triggers = document.querySelectorAll('.ui-selectonemenu-trigger');
            if (triggers[idx]) triggers[idx].click();
          }, coordSelectIdx);
          await pg.waitForTimeout(600);

          const clickedOpt = await pg.evaluate(() => {
            const items = [...document.querySelectorAll('.ui-selectonemenu-item')];
            const target = items.find((i) => /no\s*realizado/i.test(i.textContent));
            if (target) { target.click(); return true; }
            // Cerrar si no encontró la opción
            const trigger = document.querySelector('.ui-selectonemenu-trigger');
            if (trigger) trigger.click();
            return false;
          });

          if (clickedOpt) {
            await pg.waitForTimeout(400);
            await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first()
              .click({ timeout: 3000 }).catch(() => {});
            await esperarAjax(pg, 10000);

            const tablaFiltrada = await leerTablaInfo(pg);
            const totalFiltrado = tablaFiltrada.total !== null ? tablaFiltrada.total : tablaFiltrada.filas;

            if (tablaFiltrada.vacio || totalFiltrado === 0) {
              // El filtro devolvió 0 cuando había filas con Geo="No Realizado" → defecto confirmado
              defectoCoord = true;
              coordNota = `⚠ DEFECTO VIS-WEB-FILTRO-COORDENADAS: filtro "Coordenadas = No Realizado"` +
                ` devuelve 0 filas aunque ${geoInfo.conteoNoRealizado} filas muestran Geo="No Realizado"` +
                ` — confirmado QA, tarjeta levantada 03/08/2026`;
            } else {
              coordNota = `filtro "No Realizado": ${totalFiltrado} filas (ok)`;
            }
          } else {
            coordNota = 'opción "No Realizado" no encontrada en el menú (puede haberse cerrado)';
          }
        } else {
          coordNota = `hay ${geoInfo.conteoNoRealizado} filas Geo="No Realizado" pero no se localizó el SelectOneMenu de Coordenadas`;
        }
      } else if (totalInicial === 0) {
        coordNota = 'sin datos: prueba de filtro omitida (N/A por falta de datos)';
      } else {
        coordNota = 'sin filas con Geo="No Realizado" en la primera página: filtro no probado';
      }

      const nota = [
        `ruta OK: ${pre.pathname}`,
        tabla.sinTabla
          ? 'sin tabla'
          : `tabla: ${tabla.filas} filas${tabla.total ? ` · total: ${tabla.total}` : ''}${tabla.vacio ? ' (sin datos)' : ''}`,
        geoInfo.tieneGeo ? 'col Geo: sí' : 'col Geo: no detectada',
        bdOk ? `BD visit: ${bdTotal}` : 'BD visit: sin acceso',
        coordNota,
        tabla.cols && tabla.cols.length ? `cols: ${tabla.cols.slice(0, 6).join(', ')}` : '',
      ].filter(Boolean).join(' · ');

      const resultado = defectoCoord
        ? 'FAIL'
        : (tabla.sinTabla && totalInicial === 0 && bdTotal === 0)
          ? 'N/A'
          : 'PASS';

      v('DWX-VIS-001', 'Itinerario — carga, tabla y filtro Coordenadas', resultado, nota);
    }
  } catch (e) {
    v('DWX-VIS-001', 'Itinerario — carga, tabla y filtro Coordenadas', 'FAIL', e.message.slice(0, 200));
  }

  // ── DWX-VIS-002 · Rutero ─────────────────────────────────────────────────────
  // Muestra el mapa con la ruta del día dibujada. Puede tener selector de vendedor/fecha.
  // Nota: mapa en blanco con lat:NaN es esperado cuando el filtro no devuelve visitas con
  // coordenadas (descartado DESCARTADOS-WEBEXT-ISLACOCHE-20260731). Solo es defecto si la
  // BD tiene visitas con coordenadas y el mapa sigue en NaN.
  try {
    await pg.goto(`${baseUrl}/pages/protected/visitas/rutero.xhtml`,
      { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]'))
        return { error: true, pathname: location.pathname };
      return {
        pathname: location.pathname,
        tieneBuscar: !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent)),
        tieneSelectMenu: !!(document.querySelector('.ui-selectonemenu')),
        tieneCanvas: !!(document.querySelector('canvas')),
        tieneMapa: !!(document.querySelector('#map, [id*="map"], .gm-style, .leaflet-container')),
        filtros: document.querySelectorAll('.ui-selectonemenu, select').length,
      };
    });

    if (pre.login) {
      v('DWX-VIS-002', 'Rutero — carga y mapa', 'BLOCKED', 'redirigió a login');
    } else if (pre.error) {
      v('DWX-VIS-002', 'Rutero — carga y mapa', 'FAIL', `error visible · ruta: ${pre.pathname}`);
    } else {
      // Buscar con valores por defecto (lo que esté seleccionado)
      if (pre.tieneBuscar) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first()
          .click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 10000);
      }

      // Re-leer estado del mapa post-Buscar
      const post = await pg.evaluate(() => {
        const tieneCanvas = !!(document.querySelector('canvas'));
        const tieneMapa = !!(document.querySelector('#map, [id*="map"], .gm-style, .leaflet-container'));
        // Detectar setCenter con NaN en el HTML (mapa sin datos de coordenadas)
        const html = document.documentElement.innerHTML;
        const mapaNaN = /setCenter\s*\(.*?NaN|lat\s*:\s*NaN|center.*?NaN/i.test(html);
        const tieneError = !!(document.querySelector('.ui-growl-error, .ui-messages-error'));
        const sinDatos = !!(document.querySelector('.ui-datatable-empty-message'));
        return { tieneCanvas, tieneMapa, mapaNaN, tieneError, sinDatos };
      });

      // Oracle BD: visitas con coordenadas (alimentan el mapa del rutero)
      const bdCoord = serverQuery(clienteSlug,
        `SELECT COUNT(*) AS total FROM visit WHERE nu_latitude IS NOT NULL AND nu_latitude <> 0`);
      const bdConCoord = parseInt((bdCoord[0] || {}).total || 0, 10);
      const bdCoordOk = bdCoord.length > 0;

      // lat:NaN solo es defecto si la BD tiene visitas con coordenadas válidas
      const mapaNanEsDefecto = post.mapaNaN && bdConCoord > 0;

      const tieneAlgo = post.tieneCanvas || post.tieneMapa;

      const nota = [
        `ruta OK: ${pre.pathname}`,
        `mapa div: ${post.tieneMapa ? 'sí' : 'no'} · canvas: ${post.tieneCanvas ? 'sí' : 'no'}`,
        post.mapaNaN
          ? (mapaNanEsDefecto
            ? `⚠ setCenter con NaN: BD tiene ${bdConCoord} visitas con coord → posible defecto`
            : `setCenter con NaN: sin coord en BD → esperado (ver DESCARTADOS-WEBEXT-ISLACOCHE-20260731)`)
          : 'coordenadas del mapa: sin NaN detectado',
        post.tieneError ? '⚠ error growl post-Buscar' : '',
        bdCoordOk ? `BD visitas con coord: ${bdConCoord}` : 'BD visit (coord): sin acceso o tabla ausente',
        pre.filtros > 0 ? `filtros: ${pre.filtros}` : '',
      ].filter(Boolean).join(' · ');

      const resultado = (post.tieneError || mapaNanEsDefecto) ? 'FAIL'
        : tieneAlgo ? 'PASS'
        : (bdConCoord === 0 && bdCoordOk) ? 'N/A'
        : 'N/A';

      v('DWX-VIS-002', 'Rutero — carga y mapa', resultado, nota);
    }
  } catch (e) {
    v('DWX-VIS-002', 'Rutero — carga y mapa', 'FAIL', e.message.slice(0, 200));
  }

  // ── DWX-VIS-003 · Mapa de Rutas ──────────────────────────────────────────────
  // Vista de mapa geográfico con las rutas planificadas. Probablemente usa Google Maps
  // (div #map / .gm-style) o Leaflet (.leaflet-container), o canvas.
  // Oracle BD: tablas route y route_plan (intentar ambas; pueden no existir).
  try {
    await pg.goto(`${baseUrl}/pages/mapaRutas`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await esperarAjax(pg);

    const pre = await pg.evaluate(() => {
      if (location.pathname.includes('login')) return { login: true };
      if (document.querySelector('.ui-growl-error, .ui-messages-error, [class*="error-page"]'))
        return { error: true, pathname: location.pathname };
      return {
        pathname: location.pathname,
        tieneBuscar: !![...document.querySelectorAll('button')].find((b) => /buscar/i.test(b.textContent)),
        tieneCanvas: !!(document.querySelector('canvas')),
        tieneMapa: !!(document.querySelector('#map, [id*="map"], .gm-style, .leaflet-container')),
        tieneTabla: !!(document.querySelector('.ui-datatable')),
        filtros: document.querySelectorAll('.ui-selectonemenu, select').length,
      };
    });

    if (pre.login) {
      v('DWX-VIS-003', 'Mapa de Rutas — carga y mapa', 'BLOCKED', 'redirigió a login');
    } else if (pre.error) {
      v('DWX-VIS-003', 'Mapa de Rutas — carga y mapa', 'FAIL', `error visible · ruta: ${pre.pathname}`);
    } else {
      // Buscar con valores por defecto
      if (pre.tieneBuscar) {
        await pg.locator('button:has-text("Buscar"), button:has-text("buscar")').first()
          .click({ timeout: 3000 }).catch(() => {});
        await esperarAjax(pg, 10000);
      }

      // Re-leer estado post-Buscar
      const post = await pg.evaluate(() => {
        const tieneCanvas = !!(document.querySelector('canvas'));
        const tieneMapa = !!(document.querySelector('#map, [id*="map"], .gm-style, .leaflet-container'));
        const tieneTabla = !!(document.querySelector('.ui-datatable'));
        const html = document.documentElement.innerHTML;
        const mapaNaN = /setCenter\s*\(.*?NaN|lat\s*:\s*NaN|center.*?NaN/i.test(html);
        const tieneError = !!(document.querySelector('.ui-growl-error, .ui-messages-error'));
        return { tieneCanvas, tieneMapa, tieneTabla, mapaNaN, tieneError };
      });

      // Oracle BD: intentar tablas route y route_plan (pueden no existir en todos los clientes)
      const bdRoute = serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM route`);
      const bdRouteOk = bdRoute.length > 0;
      const bdRouteCount = parseInt((bdRoute[0] || {}).total || 0, 10);

      // Fallback a route_plan si route no existe
      const bdPlan = !bdRouteOk
        ? serverQuery(clienteSlug, `SELECT COUNT(*) AS total FROM route_plan`)
        : [];
      const bdPlanOk = bdPlan.length > 0;
      const bdPlanCount = parseInt((bdPlan[0] || {}).total || 0, 10);

      const tieneAlgo = post.tieneCanvas || post.tieneMapa || post.tieneTabla;

      let bdNota;
      if (bdRouteOk)       bdNota = `BD route: ${bdRouteCount} filas`;
      else if (bdPlanOk)   bdNota = `BD route_plan: ${bdPlanCount} filas`;
      else                 bdNota = 'BD route/route_plan: sin acceso (tablas pueden no existir)';

      const nota = [
        `ruta OK: ${pre.pathname}`,
        `mapa div: ${post.tieneMapa ? 'sí' : 'no'} · canvas: ${post.tieneCanvas ? 'sí' : 'no'} · tabla: ${post.tieneTabla ? 'sí' : 'no'}`,
        post.mapaNaN ? '⚠ setCenter con NaN (sin datos con coord)' : '',
        post.tieneError ? '⚠ error growl post-Buscar' : '',
        bdNota,
        pre.filtros > 0 ? `filtros: ${pre.filtros}` : '',
      ].filter(Boolean).join(' · ');

      const resultado = post.tieneError ? 'FAIL'
        : tieneAlgo ? 'PASS'
        : 'N/A';

      v('DWX-VIS-003', 'Mapa de Rutas — carga y mapa', resultado, nota);
    }
  } catch (e) {
    v('DWX-VIS-003', 'Mapa de Rutas — carga y mapa', 'FAIL', e.message.slice(0, 200));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runVisExtendido };
