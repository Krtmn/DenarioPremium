'use strict';
const { MODULOS } = require('../web-helpers');
const { navegarConBundle, chequearContexto, limpiarFiltro, runFiltrosCriticos, vd } = require('./_helpers');

const MOD = MODULOS.devoluciones;

async function runDevolucionesWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  const ctx = await chequearContexto(pg, 'devoluciones', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-DEV-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  const refManif = manifest && manifest.devoluciones && manifest.devoluciones.ref;
  verdicts.push(...await runFiltrosCriticos(pg, { prefijo: 'DW-DEV', tablaId: MOD.tabla, refConocida: refManif }));
  await limpiarFiltro(pg);

  // ⚠ Devoluciones NO tiene montos — cotejo: cantidad, lote, factura, motivo
  if (!refManif) {
    verdicts.push(vd('DW-DEV-C01', 'Cotejo cantidad/lote/factura (requiere manifiesto)', 'N/A', 'devoluciones pendiente en modo nuevo'));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runDevolucionesWeb };
