'use strict';
const { MODULOS } = require('../web-helpers');
const { navegarConBundle, chequearContexto, limpiarFiltro, runFiltrosCriticos, vd } = require('./_helpers');

const MOD = MODULOS.pedidos;

async function runPedidosWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  // ⚠ /pages/pedidos puede tardar ~25s — waitUntil: 'domcontentloaded' ya lo maneja
  const ctx = await chequearContexto(pg, 'pedidos', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-PED-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // Esperar carga real (ajax puede tardar hasta 25s según RECONOCIMIENTO-WEB.md)
  await pg.waitForTimeout(3000);

  const refManif = manifest && manifest.pedidos && manifest.pedidos.ref;
  verdicts.push(...await runFiltrosCriticos(pg, { prefijo: 'DW-PED', tablaId: MOD.tabla, refConocida: refManif }));
  await limpiarFiltro(pg);

  if (!refManif) {
    verdicts.push(vd('DW-PED-C01', 'Cotejo presencia (requiere manifiesto)', 'N/A', 'pedidos pendiente en modo nuevo'));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runPedidosWeb };
