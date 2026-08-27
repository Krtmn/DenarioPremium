'use strict';
const { BUNDLE_DOM, MODULOS, emparejarCabecera } = require('../web-helpers');
const { navegarConBundle, chequearContexto, limpiarFiltro, runFiltrosCriticos, filtrarPorRef, contarFilas, vd } = require('./_helpers');

const MOD = MODULOS.inventarios;

async function runInventariosWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  const ctx = await chequearContexto(pg, 'inventarios', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-INV-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  const refManif = manifest && manifest.inventarios && manifest.inventarios.ref;
  verdicts.push(...await runFiltrosCriticos(pg, { prefijo: 'DW-INV', tablaId: MOD.tabla, refConocida: refManif }));
  await limpiarFiltro(pg);

  // D01 — paginación
  try {
    const total = await contarFilas(pg, MOD.tabla);
    const paginador = await pg.evaluate(() => !!document.querySelector('.ui-paginator'));
    verdicts.push(vd('DW-INV-D01', 'Paginación', paginador || total < 50 ? 'PASS' : 'FAIL', `registros: ${total}`));
  } catch (e) {
    verdicts.push(vd('DW-INV-D01', 'Paginación', 'BLOCKED', e.message));
  }

  // C## — cotejo detalle
  if (!refManif) {
    for (const id of ['DW-INV-C01', 'DW-INV-C02', 'DW-INV-C03', 'DW-INV-C04', 'DW-INV-C05', 'DW-INV-C06']) {
      verdicts.push(vd(id, 'Cotejo (requiere manifiesto)', 'N/A', 'inventarios: módulo móvil existente, manifiesto no detectado'));
    }
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // C01 — presencia por # Ref
  try {
    const resultado = await filtrarPorRef(pg, refManif);
    const filas = resultado ? resultado.filas.length : 0;
    verdicts.push(vd('DW-INV-C01', `Presencia filtro # Ref ${refManif}`, filas === 1 ? 'PASS' : 'FAIL', `filas: ${filas}`));
  } catch (e) {
    verdicts.push(vd('DW-INV-C01', 'Presencia por # Ref', 'BLOCKED', e.message));
  }

  // C02–C06 — abrir detalle
  try {
    // Re-filtrar por si C01 falló y dejó estado inconsistente
    await filtrarPorRef(pg, refManif);
    await pg.evaluate(() => {
      const btn = document.querySelector('[id$=":consultar"]');
      if (!btn) throw new Error('botón Consultar no encontrado en la fila filtrada');
      btn.click();
    });
    await pg.waitForURL(/detalleInventario/, { timeout: 10000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    // Las líneas del inventario cargan en una segunda petición (Ajax o fetch) tras la URL.
    // Primero esperamos a que jQuery.active baje a 0, luego hacemos polling del DOM
    // hasta que haya al menos un datatable visible con filas reales (máx ~10 s en total).
    await pg.evaluate(async () => {
      const jq = (window.PrimeFaces && PrimeFaces.$) || window.jQuery;
      await new Promise((r) => setTimeout(r, 800));
      for (let i = 0; i < 30; i++) { if (!jq || jq.active === 0) break; await new Promise((r) => setTimeout(r, 250)); }
      await new Promise((r) => setTimeout(r, 300));
      // Poll hasta que haya un datatable con filas (por si carga vía fetch, no jQuery)
      for (let i = 0; i < 25; i++) {
        const hasTr = [...document.querySelectorAll('.ui-datatable')].some(
          (t) => t.offsetParent !== null &&
                 t.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)').length > 0
        );
        if (hasTr) break;
        await new Promise((r) => setTimeout(r, 400));
      }
    });

    // Cabecera: leerHojas + emparejarCabecera (regla hoja-siguiente, _comunes.md)
    const hojas = await pg.evaluate(() => window.__qaW.leerHojas(300));
    const cabecera = emparejarCabecera(hojas);

    // C02 — doble llave: No.Ref + Código inventario (epoch co_client_stock)
    const noRef = cabecera['No. de Ref.'] || cabecera['Nro. de Ref.'] || cabecera['No de Ref'] || '';
    const codigoInv = cabecera['Código inventario'] || cabecera['Código'] || '';
    verdicts.push(vd('DW-INV-C02', 'Doble llave: No.Ref + Código inventario',
      noRef.includes(String(refManif)) ? 'PASS' : 'FAIL',
      `No.Ref:"${noRef}" · Código:"${codigoInv}"`));

    // C03 — cabecera: fecha, vendedor, empresa presentes
    const hallados = Object.keys(cabecera).map((k) => k.replace(/:$/, '').trim());
    const tieneFecha = hallados.some((k) => /fecha/i.test(k));
    const tieneVendedor = hallados.some((k) => /vendedor/i.test(k));
    const tieneEmpresa = hallados.some((k) => /empresa/i.test(k));
    verdicts.push(vd('DW-INV-C03', 'Cabecera: fecha, vendedor, empresa presentes',
      (tieneFecha && tieneVendedor && tieneEmpresa) ? 'PASS' : 'FAIL',
      `fecha:${tieneFecha} vendedor:${tieneVendedor} empresa:${tieneEmpresa} · keys: ${hallados.slice(0, 12).join(', ')}`));

    // C04–C06 — tabla de líneas del inventario
    // tablaPorColumnas: busca la tabla que tenga esas columnas; fallback a leer la primera tabla visible
    const lineas = await pg.evaluate(() => {
      // tablaPorColumnas devuelve el ID (string), hay que pasarlo a leerTabla para obtener {cols, filas}
      const tId = window.__qaW.tablaPorColumnas(['Depósito', 'Exhibición'])
        || window.__qaW.tablaPorColumnas(['Deposito', 'Exhibicion'])
        || window.__qaW.tablaPorColumnas(['Cod. producto', 'Producto']);
      if (tId) return window.__qaW.leerTabla(tId, 50);
      // Fallback: todas las datatables visibles con al menos 1 fila real
      const tabs = [...document.querySelectorAll('.ui-datatable')]
        .filter((x) => x.offsetParent !== null && x.querySelectorAll('tbody tr:not(.ui-datatable-empty-message)').length > 0);
      if (tabs.length) return window.__qaW.leerTabla(tabs[tabs.length - 1].id, 50);
      return null;
    });

    if (lineas && lineas.filas && lineas.filas.length > 0) {
      // C04 — líneas presentes
      const colsLineas = (lineas.columnas || Object.keys(lineas.filas[0] || {}));
      verdicts.push(vd('DW-INV-C04', 'Líneas de inventario: al menos 1 producto',
        'PASS', `${lineas.filas.length} línea(s) · cols: ${colsLineas.slice(0, 8).join(', ')}`));

      // C05 — Depósito y Exhibición como columnas separadas
      const tieneDeposito = colsLineas.some((c) => /dep[oó]sito/i.test(c));
      const tieneExhibicion = colsLineas.some((c) => /exhibici[oó]n/i.test(c));
      verdicts.push(vd('DW-INV-C05', 'Cantidad por ubicación: Depósito y Exhibición separados',
        (tieneDeposito && tieneExhibicion) ? 'PASS' : (tieneDeposito || tieneExhibicion) ? 'FAIL' : 'N/A',
        `Depósito:${tieneDeposito} · Exhibición:${tieneExhibicion}`));

      // C06 — Lote y Fecha expiración en columnas
      const tieneLote = colsLineas.some((c) => /lote/i.test(c));
      const tieneVenc = colsLineas.some((c) => /expira|vencim/i.test(c));
      verdicts.push(vd('DW-INV-C06', 'Lote y fecha expiración presentes en columnas',
        tieneLote ? 'PASS' : 'N/A',
        `Lote:${tieneLote} · Vencimiento/Expiración:${tieneVenc}`));
    } else {
      verdicts.push(vd('DW-INV-C04', 'Líneas de inventario', 'FAIL', 'tabla de líneas vacía o no encontrada'));
      verdicts.push(vd('DW-INV-C05', 'Depósito y Exhibición separados', 'BLOCKED', 'sin líneas'));
      verdicts.push(vd('DW-INV-C06', 'Lote y fecha expiración', 'BLOCKED', 'sin líneas'));
    }

    await pg.goBack({ waitUntil: 'domcontentloaded' });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await limpiarFiltro(pg);
  } catch (e) {
    for (const id of ['DW-INV-C02', 'DW-INV-C03', 'DW-INV-C04', 'DW-INV-C05', 'DW-INV-C06']) {
      verdicts.push(vd(id, 'Cotejo detalle', 'BLOCKED', e.message));
    }
    try { await pg.goBack({ waitUntil: 'domcontentloaded' }); await pg.evaluate(`(${BUNDLE_DOM})()`); } catch {}
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runInventariosWeb };
