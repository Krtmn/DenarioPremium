'use strict';
const { MODULOS } = require('../web-helpers');
const { navegarConBundle, chequearContexto, limpiarFiltro, runFiltrosCriticos, vd } = require('./_helpers');

const MOD = MODULOS.cobros;

async function runCobrosWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  const ctx = await chequearContexto(pg, 'cobros', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-COB-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  const refManif = manifest && manifest.cobros && manifest.cobros.ref;
  verdicts.push(...await runFiltrosCriticos(pg, { prefijo: 'DW-COB', tablaId: MOD.tabla, refConocida: refManif }));
  await limpiarFiltro(pg);

  // C## — pendiente (cobros no implementado en móvil standalone aún)
  const mcob = manifest && manifest.cobros;
  if (!mcob || !mcob.ref) {
    verdicts.push(vd('DW-COB-C01', 'Cotejo presencia (requiere manifiesto)', 'N/A', 'cobros pendiente en modo nuevo'));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runCobrosWeb };
