'use strict';
// clientes-potenciales.js
// ⚠ No tiene filtro # Ref — C01 barre filas de la lista comparando la columna.
// ⚠ El detalle NO expone No. de Ref. — la única llave es el epoch (Código).

const { BUNDLE_DOM, MODULOS, emparejarCabecera } = require('../web-helpers');
const { navegarConBundle, chequearContexto, buscar, limpiarFiltro, contarFilas, vd } = require('./_helpers');

const MOD = MODULOS.clientes_potenciales;

async function runClientesPotencialesWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  const ctx = await chequearContexto(pg, 'clientes_potenciales', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-CLT-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  const totalInicial = await contarFilas(pg, MOD.tabla);

  // F01 — Verificar que la lista carga
  try {
    verdicts.push(vd('DW-CLT-F01', 'Lista carga', totalInicial > 0 ? 'PASS' : 'FAIL', `registros: ${totalInicial}`));
  } catch (e) {
    verdicts.push(vd('DW-CLT-F01', 'Lista carga', 'BLOCKED', e.message));
  }

  // F02 — Limpiar vuelve al total
  try {
    await limpiarFiltro(pg);
    const totalTras = await contarFilas(pg, MOD.tabla);
    verdicts.push(vd('DW-CLT-F02', 'Limpiar vuelve al total', totalTras >= totalInicial ? 'PASS' : 'FAIL', `antes: ${totalInicial} · tras: ${totalTras}`));
  } catch (e) {
    verdicts.push(vd('DW-CLT-F02', 'Limpiar', 'BLOCKED', e.message));
  }

  // D01 — Paginación
  try {
    const paginador = await pg.evaluate(() => !!document.querySelector('.ui-paginator'));
    verdicts.push(vd('DW-CLT-D01', 'Paginación', paginador || totalInicial < 50 ? 'PASS' : 'FAIL', `registros: ${totalInicial}`));
  } catch (e) {
    verdicts.push(vd('DW-CLT-D01', 'Paginación', 'BLOCKED', e.message));
  }

  // C01 / C02 — Cotejo: barrido por # Ref + epoch en detalle
  // ⚠ El módulo NO tiene filtro por # Ref: hay que leer la lista completa y buscar la fila
  const mclt = manifest && manifest.clientes;
  const refClt = mclt && mclt.ref;
  const epochClt = mclt && mclt.epoch;

  if (!refClt) {
    verdicts.push(vd('DW-CLT-C01', 'Presencia en lista (barrido)', 'N/A', 'sin ref en manifiesto'));
    verdicts.push(vd('DW-CLT-C02', 'Código epoch en detalle', 'N/A', 'sin ref en manifiesto'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  try {
    await limpiarFiltro(pg);
    // Leer hasta 200 filas de la página actual (módulo más caro de localizar)
    const tabla = await pg.evaluate((tabId) => {
      const t = document.querySelector(`[id="${tabId}"]`) || [...document.querySelectorAll('.ui-datatable')].find(x => x.offsetParent !== null);
      return t ? window.__qaW.leerTabla(t.id, 200) : null;
    }, MOD.tabla);

    if (!tabla) {
      verdicts.push(vd('DW-CLT-C01', 'Presencia en lista (barrido)', 'BLOCKED', 'tabla no encontrada'));
      verdicts.push(vd('DW-CLT-C02', 'Código epoch en detalle', 'BLOCKED', 'tabla no encontrada'));
      return { verdicts, msTotal: Date.now() - t0 };
    }

    // Buscar la fila por # Ref
    const idxFila = tabla.filas.findIndex((f) => {
      const ref = String(f['# Ref'] || f['Ref'] || f['Nro.Ref'] || f['Nro. Ref'] || '').trim();
      return ref === String(refClt);
    });

    if (idxFila === -1) {
      verdicts.push(vd('DW-CLT-C01', `Presencia # Ref ${refClt} (barrido ${tabla.filas.length} filas)`, 'FAIL',
        'no encontrado en la página visible; puede requerir paginación'));
      verdicts.push(vd('DW-CLT-C02', 'Código epoch en detalle', 'N/A', 'C01 no encontró la fila'));
      return { verdicts, msTotal: Date.now() - t0 };
    }

    verdicts.push(vd('DW-CLT-C01', `Presencia # Ref ${refClt}`, 'PASS',
      `encontrado en fila ${idxFila + 1} de ${tabla.filas.length}`));

    // C02 — Abrir detalle y verificar que Código == epoch
    if (!epochClt) {
      verdicts.push(vd('DW-CLT-C02', 'Código epoch en detalle', 'N/A', 'epoch no disponible en manifiesto'));
      return { verdicts, msTotal: Date.now() - t0 };
    }

    const clickOk = await pg.evaluate((refBuscada) => {
      const tabs = [...document.querySelectorAll('.ui-datatable')].filter((t) => t.offsetParent !== null);
      if (!tabs.length) return false;
      const rows = [...tabs[0].querySelectorAll('tbody tr')]
        .filter((tr) => !tr.classList.contains('ui-datatable-empty-message'));
      for (const row of rows) {
        // Buscar una celda cuyo texto sea exactamente la ref
        const match = [...row.querySelectorAll('td')].some((td) => td.textContent.trim() === String(refBuscada));
        if (match) {
          const btn = row.querySelector('[id$=":consultar"]');
          if (btn) { btn.click(); return true; }
        }
      }
      return false;
    }, String(refClt));

    if (!clickOk) {
      verdicts.push(vd('DW-CLT-C02', 'Código epoch en detalle', 'BLOCKED',
        'se encontró la fila en leerTabla pero no se pudo hacer click en Consultar'));
      return { verdicts, msTotal: Date.now() - t0 };
    }

    await pg.waitForURL(/detalleClientePotencial|clientesPotencial/, { timeout: 10000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);

    const hojas = await pg.evaluate(() => window.__qaW.leerHojas(300));
    const cabDet = emparejarCabecera(hojas);
    const codigoDet = cabDet['Código'] || cabDet['Código:'] || '';
    const coincide = String(codigoDet).includes(String(epochClt));
    verdicts.push(vd('DW-CLT-C02', 'Código en detalle == epoch',
      coincide ? 'PASS' : 'FAIL',
      `web:"${codigoDet}" · esperado:"${epochClt}"`));

    await pg.goBack({ waitUntil: 'domcontentloaded' });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
  } catch (e) {
    verdicts.push(vd('DW-CLT-C01', 'Presencia en lista (barrido)', 'BLOCKED', e.message));
    verdicts.push(vd('DW-CLT-C02', 'Código epoch en detalle', 'BLOCKED', e.message));
    try { await pg.goBack({ waitUntil: 'domcontentloaded' }); await pg.evaluate(`(${BUNDLE_DOM})()`); } catch {}
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runClientesPotencialesWeb };
