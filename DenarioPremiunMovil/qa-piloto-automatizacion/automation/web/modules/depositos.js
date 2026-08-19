'use strict';
const { MODULOS } = require('../web-helpers');
const { navegarConBundle, chequearContexto, limpiarFiltro, runFiltrosCriticos, contarFilas, leerTabla, vd } = require('./_helpers');

const MOD = MODULOS.depositos;

async function runDepositosWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  const ctx = await chequearContexto(pg, 'depositos', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-DEP-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  const refManif = manifest && manifest.depositos && manifest.depositos.ref;
  verdicts.push(...await runFiltrosCriticos(pg, { prefijo: 'DW-DEP', tablaId: MOD.tabla, refConocida: refManif }));
  await limpiarFiltro(pg);

  // D01 — paginación
  try {
    const total = await contarFilas(pg, MOD.tabla);
    const paginador = await pg.evaluate(() => !!document.querySelector('.ui-paginator'));
    verdicts.push(vd('DW-DEP-D01', 'Paginación', paginador || total < 50 ? 'PASS' : 'FAIL', `registros: ${total}`));
  } catch (e) {
    verdicts.push(vd('DW-DEP-D01', 'Paginación', 'BLOCKED', e.message));
  }

  if (!refManif) {
    verdicts.push(vd('DW-DEP-C01', 'Cotejo presencia + Σ cobros hijos (requiere manifiesto)', 'N/A', 'depositos: módulo móvil existente, manifiesto no detectado'));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runDepositosWeb };
