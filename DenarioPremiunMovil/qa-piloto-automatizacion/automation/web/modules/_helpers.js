'use strict';
// _helpers.js — Helpers compartidos para módulos web standalone

const { BUNDLE_DOM, MODULOS, verificarContexto } = require('../web-helpers');

/**
 * Navega a una URL e instala window.__qaW.
 * Re-instala el bundle en cada navegación (no persiste entre páginas).
 */
async function navegarConBundle(pg, url) {
  await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // BUNDLE_DOM es un string con una función — hay que invocarla con ()
  await pg.evaluate(`(${BUNDLE_DOM})()`);
}

/**
 * Verifica que la página actual corresponde al módulo y playa esperados.
 * @returns {{ok:boolean, motivo?:string}}
 */
async function chequearContexto(pg, modulo, playa) {
  const ctx = await pg.evaluate(() => window.__qaW.contexto());
  return verificarContexto(ctx, modulo, false, playa);
}

/**
 * Lee la tabla principal del módulo y devuelve sus filas.
 * @param {string} tablaId  ID de la tabla (de MODULOS[mod].tabla)
 * @param {number} [max=50]
 */
async function leerTabla(pg, tablaId, max = 50) {
  return pg.evaluate(
    ({ id, maxF }) => window.__qaW.leerTabla(id, maxF),
    { id: tablaId, maxF: max }
  );
}

/**
 * Filtra por # Ref, hace Buscar, devuelve las filas resultantes.
 * Limpia el filtro al terminar si cleanAfter=true.
 */
async function filtrarPorRef(pg, ref, { cleanAfter = false } = {}) {
  // Limpiar primero (el filtro persiste entre navegaciones)
  await limpiarFiltro(pg);

  // :n_ref = sufijo estable en cobros/pedidos/depósitos/devoluciones/inventarios
  // input[placeholder="# Ref"] = ancla confirmada solo en visitas
  await pg.evaluate((val) => {
    const inp = document.querySelector('[id$=":n_ref"]') || document.querySelector('input[placeholder="# Ref"]');
    if (!inp) throw new Error('input # Ref no encontrado (ni :n_ref ni placeholder="# Ref")');
    inp.value = val;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, String(ref));

  await buscar(pg);
  const resultado = await pg.evaluate(() => {
    // Leer todas las datatables visibles
    const tablas = [...document.querySelectorAll('.ui-datatable')]
      .filter((t) => t.offsetParent !== null);
    if (!tablas.length) return null;
    return window.__qaW.leerTabla(tablas[0].id, 10);
  });

  if (cleanAfter) await limpiarFiltro(pg);
  return resultado;
}

async function buscar(pg) {
  await pg.evaluate(() => {
    // :ajax = sufijo del botón Buscar en cobros/pedidos/depósitos/devoluciones/inventarios
    // :btnBuscar = sufijo en visitas
    const btn = document.querySelector('button[id$=":ajax"]') || document.querySelector('button[id$=":btnBuscar"]');
    if (!btn) throw new Error('botón Buscar no encontrado (ni :ajax ni :btnBuscar)');
    btn.click();
  });
  // esperar jquery.active (patrón _comunes.md) en lugar de timeout fijo
  await pg.evaluate(async () => {
    const jq = (window.PrimeFaces && PrimeFaces.$) || window.jQuery;
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < 80; i++) { if (!jq || jq.active === 0) break; await new Promise((r) => setTimeout(r, 250)); }
    await new Promise((r) => setTimeout(r, 1000));
  });
}

async function limpiarFiltro(pg) {
  await pg.evaluate(() => {
    const btn = document.querySelector('button[id$=":botonLimpiar"]');
    if (btn) btn.click();
  });
  await pg.waitForTimeout(1500);
}

/**
 * Obtiene el primer # Ref disponible en la tabla (para F01 sin manifiesto).
 */
async function primerRefDeTabla(pg, tablaId) {
  const tabla = await leerTabla(pg, tablaId, 5);
  if (!tabla || !tabla.filas || !tabla.filas.length) return null;
  const fila = tabla.filas[0];
  const refCol = Object.keys(fila).find((k) => k.includes('Ref') || k.includes('ref'));
  return refCol ? (fila[refCol] || '').replace(/\D/g, '').trim() || null : null;
}

/**
 * Cuenta las filas visibles en la tabla.
 */
async function contarFilas(pg, tablaId) {
  const t = await leerTabla(pg, tablaId, 200);
  return t ? t.filas.length : 0;
}

/**
 * Construye un veredicto estándar.
 */
function vd(id, descripcion, resultado, nota = '') {
  return { id, descripcion, resultado, nota, ms: Date.now() };
}

/**
 * Ejecuta los 3 casos de filtro críticos (F01/F02/F03) comunes a todos los módulos con filtro # Ref.
 * @param {string} prefijo   ej. 'DW-VIS'
 * @param {string} tablaId   ID de la tabla principal
 * @param {string|null} refConocida  ref del manifiesto (si no hay, se obtiene de la tabla)
 */
async function runFiltrosCriticos(pg, { prefijo, tablaId, refConocida }) {
  const verdicts = [];

  // Cargar tabla inicial y obtener ref si no viene del manifiesto
  const totalInicial = await contarFilas(pg, tablaId);
  const ref = refConocida || (await primerRefDeTabla(pg, tablaId));

  // F01 — filtro por ref existente → 1 fila
  if (ref) {
    const resultado = await filtrarPorRef(pg, ref);
    const filas = resultado ? resultado.filas.length : 0;
    verdicts.push(vd(
      `${prefijo}-F01`,
      `Filtro # Ref existente (${ref}) → 1 fila`,
      filas === 1 ? 'PASS' : 'FAIL',
      `filas: ${filas}`
    ));
  } else {
    verdicts.push(vd(`${prefijo}-F01`, 'Filtro # Ref existente', 'N/A', 'tabla vacía, sin refs'));
  }

  // F02 — filtro por ref inexistente → 0 filas
  {
    const resultado = await filtrarPorRef(pg, '999999');
    const filas = resultado ? resultado.filas.length : 0;
    verdicts.push(vd(
      `${prefijo}-F02`,
      'Filtro # Ref inexistente (999999) → 0 filas',
      filas === 0 ? 'PASS' : 'FAIL',
      `filas: ${filas}`
    ));
  }

  // F03 — Limpiar → vuelve al total
  await limpiarFiltro(pg);
  const totalTras = await contarFilas(pg, tablaId);
  verdicts.push(vd(
    `${prefijo}-F03`,
    'Limpiar → vuelve al total',
    totalTras >= totalInicial ? 'PASS' : 'FAIL',
    `antes: ${totalInicial} · tras limpiar: ${totalTras}`
  ));

  return verdicts;
}

module.exports = {
  navegarConBundle,
  chequearContexto,
  leerTabla,
  filtrarPorRef,
  buscar,
  limpiarFiltro,
  primerRefDeTabla,
  contarFilas,
  runFiltrosCriticos,
  vd,
};
