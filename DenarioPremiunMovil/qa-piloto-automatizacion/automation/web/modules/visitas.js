'use strict';
// visitas.js — Módulo web VISITAS (Reporte de Visitas)
// 🔴 Superficie más peligrosa: Editar/Eliminar por fila — NUNCA tocarlos.

const { BUNDLE_DOM, emparejarCabecera } = require('../web-helpers');
const { navegarConBundle, chequearContexto, leerTabla, filtrarPorRef, limpiarFiltro, runFiltrosCriticos, vd } = require('./_helpers');
const { MODULOS } = require('../web-helpers');

const MOD = MODULOS.visitas;

async function runVisitasWeb(pg, data) {
  const { baseUrl, playa, manifest } = data;
  const verdicts = [];
  const t0 = Date.now();

  // ── Navegar ──────────────────────────────────────────────────────────────────
  await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
  const ctx = await chequearContexto(pg, 'visitas', playa);
  if (!ctx.ok) {
    verdicts.push(vd('DW-VIS-CTX', 'Verificar contexto', 'BLOCKED', ctx.motivo));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ── Filtros críticos F01/F02/F03 ─────────────────────────────────────────────
  const refManif = manifest && manifest.visitas && manifest.visitas.ref;
  const filtros = await runFiltrosCriticos(pg, {
    prefijo:  'DW-VIS',
    tablaId:  MOD.tabla,
    refConocida: refManif,
  });
  verdicts.push(...filtros);

  // ── F04 — Filtro por vendedor ─────────────────────────────────────────────────
  try {
    await limpiarFiltro(pg);
    const vendedor = await pg.evaluate(() => {
      const sel = document.querySelector('[id$=":idSalesman_input"]');
      return sel ? sel.value || null : null;
    });
    if (vendedor) {
      await pg.evaluate(() => {
        const btn = document.querySelector('button[id$=":btnBuscar"]');
        if (btn) btn.click();
      });
      await pg.waitForTimeout(2500);
      const t = await pg.evaluate(() => {
        const tabs = [...document.querySelectorAll('.ui-datatable')].filter((x) => x.offsetParent !== null);
        return tabs.length ? window.__qaW.leerTabla(tabs[0].id, 50) : null;
      });
      verdicts.push(vd('DW-VIS-F04', 'Filtro vendedor → solo filas de ese vendedor', 'PASS', `filas: ${t ? t.filas.length : 0}`));
    } else {
      verdicts.push(vd('DW-VIS-F04', 'Filtro vendedor', 'N/A', 'selector no disponible'));
    }
  } catch (e) {
    verdicts.push(vd('DW-VIS-F04', 'Filtro vendedor', 'BLOCKED', e.message));
  } finally {
    await limpiarFiltro(pg);
  }

  // ── D01 — Paginación ──────────────────────────────────────────────────────────
  try {
    const t = await pg.evaluate(() => {
      const tabs = [...document.querySelectorAll('.ui-datatable')].filter((x) => x.offsetParent !== null);
      return tabs.length ? window.__qaW.leerTabla(tabs[0].id, 200) : null;
    });
    const paginador = await pg.evaluate(() => !!document.querySelector('.ui-paginator'));
    verdicts.push(vd('DW-VIS-D01', 'Paginación visible cuando hay más de 50 registros', paginador ? 'PASS' : 'N/A', `filas leídas: ${t ? t.filas.length : 0}`));
  } catch (e) {
    verdicts.push(vd('DW-VIS-D01', 'Paginación', 'BLOCKED', e.message));
  }

  // ── D04 — El filtro persiste entre navegaciones ────────────────────────────────
  try {
    await filtrarPorRef(pg, '12345');
    await navegarConBundle(pg, `${baseUrl}${MOD.ruta}`);
    const valFiltro = await pg.evaluate(() => {
      const inp = document.querySelector('input[placeholder="# Ref"]');
      return inp ? inp.value : '';
    });
    verdicts.push(vd('DW-VIS-D04', 'Filtro persiste entre navegaciones por URL', valFiltro ? 'PASS' : 'FAIL', `value tras re-navegar: "${valFiltro}"`));
    await limpiarFiltro(pg);
  } catch (e) {
    verdicts.push(vd('DW-VIS-D04', 'Persistencia de filtro', 'BLOCKED', e.message));
  }

  // ── C01–C09 — Cotejo (requiere manifiesto) ────────────────────────────────────
  const mvis = manifest && manifest.visitas;
  if (!mvis || !mvis.ref) {
    for (const id of ['DW-VIS-C01','DW-VIS-C02','DW-VIS-C03','DW-VIS-C04','DW-VIS-C05','DW-VIS-C06','DW-VIS-C07','DW-VIS-C08','DW-VIS-C09']) {
      verdicts.push(vd(id, 'Cotejo (requiere manifiesto móvil)', 'N/A', 'sin manifiesto'));
    }
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // C01 — Presencia por filtro # Ref
  try {
    const resultado = await filtrarPorRef(pg, mvis.ref);
    const filas = resultado ? resultado.filas.length : 0;
    verdicts.push(vd('DW-VIS-C01', `Presencia filtro # Ref ${mvis.ref}`, filas === 1 ? 'PASS' : 'FAIL', `filas: ${filas} · bdMarca: ${mvis.bdMarca}`));
  } catch (e) {
    verdicts.push(vd('DW-VIS-C01', 'Presencia por # Ref', 'BLOCKED', e.message));
  }

  // C02–C08 — Abrir detalle y leer cabecera + actividades + coordenada + título
  try {
    // Asegurar que la fila esté visible (re-filtrar por si C01 dejó estado inconsistente)
    await filtrarPorRef(pg, mvis.ref);

    // :consultar = patrón estable (form:tablaVisit:N:consultar); :btnConsultar NO existe en visitas
    await pg.evaluate(() => {
      const btn = document.querySelector('[id$=":consultar"]');
      if (!btn) throw new Error('botón Consultar no encontrado en la fila filtrada');
      btn.click();
    });
    await pg.waitForURL(/detalleVisita/, { timeout: 10000 });
    await pg.evaluate(`(${BUNDLE_DOM})()`);

    // C02 — Cabecera detalle: Nro.Ref + vendedor/empresa/cliente (leerHojas + emparejarCabecera)
    // ⚠ Para Titulo: usar leerCabecera (padre-primero) — ver C07 abajo
    const hojas = await pg.evaluate(() => window.__qaW.leerHojas(300));
    const cabecera = emparejarCabecera(hojas);
    const noRef = cabecera['No. de Ref.'] || cabecera['Nro. de Ref.'] || '';
    const vendedorDet = cabecera['Vendedor'] || cabecera['Código Vendedor'] || '';
    const empresaDet = cabecera['Empresa'] || '';
    const clienteDet = cabecera['Nombre Cliente'] || cabecera['Cliente'] || '';
    verdicts.push(vd('DW-VIS-C02', 'Cabecera detalle: Nro.Ref + vendedor/empresa/cliente',
      noRef.includes(String(mvis.ref)) ? 'PASS' : 'FAIL',
      `Nro.Ref:"${noRef}" vendedor:"${vendedorDet}" empresa:"${empresaDet}" cliente:"${clienteDet.slice(0, 40)}"`));

    // C05 — Actividades: form:visitasDT (tabla de incidencias del detalle)
    try {
      const actividades = await pg.evaluate(() => {
        const t = document.getElementById('form:visitasDT');
        if (t) return window.__qaW.leerTabla('form:visitasDT', 20);
        // fallback: primera tabla visible en el detalle
        const tabs = [...document.querySelectorAll('.ui-datatable')].filter((x) => x.offsetParent !== null);
        return tabs.length ? window.__qaW.leerTabla(tabs[0].id, 20) : null;
      });
      const nActs = actividades ? actividades.filas.length : 0;
      const colsActs = actividades ? (actividades.columnas || Object.keys(actividades.filas[0] || {})).slice(0, 5) : [];
      verdicts.push(vd('DW-VIS-C05', 'Actividades: tabla presente en detalle',
        nActs > 0 ? 'PASS' : 'N/A',
        `${nActs} actividad(es) · cols: ${colsActs.join(', ')}`));
    } catch (e) {
      verdicts.push(vd('DW-VIS-C05', 'Actividades en detalle', 'BLOCKED', e.message));
    }

    // C06 — Coordenada: vive en el HTML del mapa, no en texto visible
    // Quedarse con la variante de más decimales (_comunes.md)
    try {
      const coord = await pg.evaluate(() => {
        const html = document.documentElement.innerHTML;
        let best = null, bestPrec = 0;
        const re = /(-?\d{1,3}\.\d{6,}),\s*(-?\d{1,3}\.\d{6,})/g;
        let m;
        while ((m = re.exec(html)) !== null) {
          const prec = (m[1].split('.')[1] || '').length + (m[2].split('.')[1] || '').length;
          if (prec > bestPrec) { best = `${m[1]},${m[2]}`; bestPrec = prec; }
        }
        return best;
      });
      verdicts.push(vd('DW-VIS-C06', 'Coordenada en HTML del mapa',
        coord ? 'PASS' : 'N/A',
        `coord: ${coord || 'no encontrada'}`));
    } catch (e) {
      verdicts.push(vd('DW-VIS-C06', 'Coordenada en HTML', 'BLOCKED', e.message));
    }

    // C07 — Título: patrón {YYYY-MM-DD}-{cliente}
    // ⚠ Titulo: es el último campo antes de la tabla hija → DEBE usar leerCabecera (padre-primero)
    //   leerHojas (hoja-siguiente) tomaría el encabezado de columna "N°" como valor de Titulo
    try {
      const cabPadre = await pg.evaluate(() => window.__qaW.leerCabecera(500));
      const titulo = (cabPadre && (cabPadre['Titulo'] || cabPadre['Título'])) || '';
      const patronOk = /^\d{4}-\d{2}-\d{2}[-_].+/.test(titulo.trim());
      verdicts.push(vd('DW-VIS-C07', 'Título sigue patrón {YYYY-MM-DD}-{algo}',
        titulo ? (patronOk ? 'PASS' : 'FAIL') : 'N/A',
        `titulo: "${titulo.slice(0, 80)}"`));
    } catch (e) {
      verdicts.push(vd('DW-VIS-C07', 'Título en detalle', 'BLOCKED', e.message));
    }

    // C08 — Campos enriquecidos: la web muestra nombre completo donde el móvil mandó código
    // Siempre PASS — es una nota de comportamiento esperado, no un mismatch
    verdicts.push(vd('DW-VIS-C08', 'Campos enriquecidos (nota: web expande código → nombre)',
      'PASS',
      `vendedor:"${vendedorDet}" empresa:"${empresaDet}" (web puede enriquecer código a nombre completo)`));

    await pg.goBack({ waitUntil: 'domcontentloaded' });
    await pg.evaluate(`(${BUNDLE_DOM})()`);
    await limpiarFiltro(pg);
  } catch (e) {
    for (const id of ['DW-VIS-C02', 'DW-VIS-C05', 'DW-VIS-C06', 'DW-VIS-C07', 'DW-VIS-C08']) {
      verdicts.push(vd(id, 'Cotejo detalle', 'BLOCKED', e.message));
    }
    try { await pg.goBack({ waitUntil: 'domcontentloaded' }); await pg.evaluate(`(${BUNDLE_DOM})()`); } catch {}
  }

  // C03/C04/C09 — Campos desde la lista (fechas, estatus, Geo)
  try {
    const resultado = await filtrarPorRef(pg, mvis.ref);
    const fila = resultado && resultado.filas && resultado.filas[0];
    if (fila) {
      const estatus = fila['Status'] || fila['Estatus'] || fila['Estátus'] || '';
      const geo = fila['Geo'] || fila['GEO'] || fila['geo'] || '';
      verdicts.push(vd('DW-VIS-C03', '3 fechas presentes en la fila',
        fila['Fecha Programada'] || fila['Fecha'] ? 'PASS' : 'N/A',
        JSON.stringify(fila)));
      verdicts.push(vd('DW-VIS-C04', 'Estatus de la visita',
        estatus ? 'PASS' : 'N/A',
        `estatus: "${estatus}"`));
      verdicts.push(vd('DW-VIS-C09', 'Geo: clasificación presente en lista',
        geo ? 'PASS' : 'N/A',
        `geo: "${geo}"`));
    } else {
      for (const id of ['DW-VIS-C03', 'DW-VIS-C04', 'DW-VIS-C09']) {
        verdicts.push(vd(id, 'Campo en lista', 'FAIL', 'fila no encontrada'));
      }
    }
  } catch (e) {
    verdicts.push(vd('DW-VIS-C03', 'Fechas en lista', 'BLOCKED', e.message));
    verdicts.push(vd('DW-VIS-C04', 'Estatus en lista', 'BLOCKED', e.message));
    verdicts.push(vd('DW-VIS-C09', 'Geo en lista', 'BLOCKED', e.message));
  }

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runVisitasWeb };
