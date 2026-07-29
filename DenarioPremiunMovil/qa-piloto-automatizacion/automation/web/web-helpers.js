/**
 * web-helpers.js — Helpers de la web de Denario Premium (JSF/PrimeFaces). **READ-ONLY.**
 *
 * Reglas operativas: `automation/web/WEB-RUNTIME.md` · Selectores: `web-selectors/_comunes.md`
 * Origen de los datos duros: `automation/web/RECONOCIMIENTO-WEB.md` (F0, 2026-07-28).
 *
 * ── Cómo se usa ──────────────────────────────────────────────────────────────
 * El agente web conduce con las herramientas ESTÁNDAR del MCP de Playwright
 * (browser_navigate / browser_click / browser_evaluate) — NO con CDP.
 *
 *   1. Instalar el bundle DOM una sola vez por página:  browser_evaluate(BUNDLE_DOM)
 *      → registra `window.__qaW` con los lectores (leerHojas, leerTabla, contexto).
 *   2. Leer:  browser_evaluate("() => window.__qaW.leerTabla('form:cobrosDT')")
 *   3. Procesar el JSON devuelto con las funciones PURAS de este archivo (node).
 *
 * ── Por qué esta división ────────────────────────────────────────────────────
 * Todo lo que puede fallar por lógica (parseo es-VE, limpieza de celdas, comparación con
 * tolerancia, oráculos de cálculo) vive en funciones **puras y testeables sin navegador**
 * (`web-helpers.test.js`). El DOM se limita a "dame los textos". Así un bug de parseo se
 * caza en un self-test de 1 segundo y no en una corrida de 40 minutos.
 */

// ═════════════════════════════════════════════════════════════════════════════
// MAPA DE MÓDULOS (medido en F0 — no inventar rutas ni IDs)
// ═════════════════════════════════════════════════════════════════════════════

const MODULOS = {
  cobros:               { ruta: '/pages/cobros',              tabla: 'form:cobrosDT',  detalle: '/pages/detalleCobro',              filtroRef: true  },
  pedidos:              { ruta: '/pages/pedidos',             tabla: 'form:pedidosDT', detalle: '/pages/detallePedido',             filtroRef: true  },
  devoluciones:         { ruta: '/pages/devoluciones',        tabla: 'form:pedidosDT', detalle: '/pages/detalleDevolucion',         filtroRef: true  },
  depositos:            { ruta: '/pages/depositos',           tabla: 'form:pedidosDT', detalle: '/pages/detalleDeposito',           filtroRef: true  },
  clientes_potenciales: { ruta: '/pages/clientesPotenciales', tabla: 'form:pedidosDT', detalle: '/pages/detalleClientePotencial',   filtroRef: false },
  inventarios:          { ruta: '/pages/inventarios',         tabla: 'form:pedidosDT', detalle: '/pages/detalleInventario',         filtroRef: true  },
  // ✅ visitas SÍ tiene filtro # Ref (`input[placeholder="# Ref"]`) — corregido 2026-07-28 contra la doc previa
  visitas:              { ruta: '/pages/visitas',             tabla: 'form:tablaVisit', detalle: '/pages/protected/visitas/detalleVisita.xhtml', filtroRef: true },
};

/** ⚠ `form:pedidosDT` lo comparten 5 módulos → el ID NUNCA identifica el contexto. */
function moduloDe(pathname) {
  const p = String(pathname || '');
  for (const [k, v] of Object.entries(MODULOS)) if (p.endsWith(v.ruta)) return k;
  for (const [k, v] of Object.entries(MODULOS)) if (p.endsWith(v.detalle)) return k;
  return null;
}

/** Host de cada playa (la parte que identifica el SERVIDOR). Ver `playas.yaml`. */
const PLAYAS = {
  el_yaque:   'denarioelyaque.ddns.net:8080',
  isla_coche: 'denarioislacoche.ddns.net:8080',
  la_tortuga: 'denariolatortuga.ddns.net:8080',
};
function playaDe(host) {
  const h = String(host || '').toLowerCase();
  for (const [k, v] of Object.entries(PLAYAS)) if (h === v || h.startsWith(v.split(':')[0])) return k;
  return null;
}

/**
 * Guarda obligatoria: ¿estoy donde creo que estoy? (ver WEB-RUNTIME §3)
 *
 * 🔴 **Verifica HOST *y* pathname.** Las 3 playas exponen **exactamente las mismas rutas**
 * (`/pages/cobros` existe en las tres), así que mirar solo el pathname deja al agente ciego
 * al servidor: leería los datos de otra playa creyendo que son los suyos. Pasó de verdad
 * (2026-07-28: se leyó Isla Coche creyendo que era La Tortuga porque la comprobación
 * devolvía solo `location.pathname`).
 *
 * @param {{host?:string, pathname?:string}|string} ctx  `__qaW.contexto()` (o un pathname suelto — modo legado)
 * @param {string} moduloEsperado
 * @param {boolean} [esDetalle]
 * @param {string} [playaEsperada]  slug de playa; si se omite, NO se valida el servidor (inseguro)
 */
function verificarContexto(ctx, moduloEsperado, esDetalle, playaEsperada) {
  const pathname = typeof ctx === 'string' ? ctx : (ctx && ctx.pathname);
  const host     = typeof ctx === 'string' ? null : (ctx && ctx.host);
  const m = MODULOS[moduloEsperado];
  if (!m) return { ok: false, motivo: `módulo desconocido: ${moduloEsperado}` };

  if (playaEsperada) {
    if (!host) return { ok: false, motivo: 'no se puede validar la playa: pasá __qaW.contexto() (con host), no un pathname suelto' };
    const actual = playaDe(host);
    if (actual !== playaEsperada) {
      return { ok: false, motivo: `PLAYA EQUIVOCADA: esperaba ${playaEsperada}, estoy en ${actual || host}`, playaActual: actual };
    }
  }

  const esperado = esDetalle ? m.detalle : m.ruta;
  if (!String(pathname || '').endsWith(esperado)) {
    return { ok: false, motivo: `contexto equivocado: esperaba ${esperado}, estoy en ${pathname}` };
  }
  return { ok: true, playa: host ? playaDe(host) : null };
}

// ═════════════════════════════════════════════════════════════════════════════
// LIMPIEZA DE TEXTO (puro)
// ═════════════════════════════════════════════════════════════════════════════

/** Ruido de plantilla presente en TODAS las páginas (menú + dashboard demo). */
const RUIDO = new Set([
  'Transacciones', 'Empresa', 'Estructura Comercial', 'Datos Maestros', 'Visitas', 'Facturaciones',
  'Cobros', 'Devoluciones', 'Depósitos', 'Clientes Potenciales', 'Inventarios', 'Reportes',
  'Indicadores', 'Pedidos', 'Rain Clothing', 'Chicago, USA', 'Products', 'Orders', 'Sales',
  '12K', '26K', '$200K', 'Tamas Bunce', 'Olivia Arribas', 'ui-button', 'Pedido', 'Clásico', 'Oscuro',
  'Denario Premium Configuración', 'Cumplimiento', 'Temas', 'Mapa', 'Satélite', 'Términos',
  'Combinaciones de teclas', 'Notificar un problema de Maps', 'www.denario.net',
]);
const RUIDO_RE = /^(\d+\s+mins?\s+ago|Datos del mapa|Powered by|Visualizar el Dashboard|Denario ofrece)/i;

function esRuido(t) {
  const s = String(t || '').trim();
  return !s || RUIDO.has(s) || RUIDO_RE.test(s);
}

/**
 * Empareja la cabecera de un detalle: la etiqueta termina en `:` y el valor es la hoja siguiente.
 * Si la hoja siguiente es otra etiqueta (o no hay), el campo queda `''` (campo vacío en la web).
 * Normaliza la clave: sin `:` final, sin espacios sobrantes. (`"Cédula::"` → `"Cédula"`.)
 */
function emparejarCabecera(hojas) {
  const limpias = (hojas || []).map((h) => String(h).replace(/\s+/g, ' ').trim()).filter((h) => !esRuido(h));
  const out = {};
  for (let i = 0; i < limpias.length; i++) {
    const t = limpias[i];
    if (!t.endsWith(':')) continue;
    const clave = t.replace(/:+$/, '').trim();
    if (!clave) continue;
    const sig = limpias[i + 1];
    out[clave] = (sig && !sig.endsWith(':')) ? sig : '';
  }
  return out;
}

/**
 * Quita el encabezado que PrimeFaces pega dentro de la celda.
 *   limpiarCelda('# Ref', '# Ref526')                    → '526'
 *   limpiarCelda('Monto cobrado', 'Monto cobrado 50,00 BS') → '50,00 BS'
 */
function limpiarCelda(encabezado, crudo) {
  let s = String(crudo == null ? '' : crudo).replace(/\s+/g, ' ').trim();
  const h = String(encabezado || '').replace(/\s+/g, ' ').trim();
  if (h && s.startsWith(h)) s = s.slice(h.length).trim();
  return s;
}

/**
 * Celdas con `<select>`: el textContent concatena TODAS las opciones y repite la seleccionada al final.
 *   'AprobadoPendientePor aprobarRechazadoPor aprobar' → 'Por aprobar'
 * Heurística: el sufijo MÁS LARGO que además aparece antes en la cadena.
 * (El lector DOM prefiere leer la opción seleccionada; esto es el respaldo.)
 */
function valorDeSelect(resto) {
  const s = String(resto || '').trim();
  if (!s) return '';
  for (let len = Math.floor(s.length / 2); len >= 1; len--) {
    const suf = s.slice(s.length - len);
    if (s.indexOf(suf) < s.length - len) return suf.trim();
  }
  return s;
}

// ═════════════════════════════════════════════════════════════════════════════
// PARSEO es-VE (puro) — `.` miles · `,` decimales
// ═════════════════════════════════════════════════════════════════════════════

/** '2.000.000,00' → 2000000 · '50.687,24 BS' → 50687.24 · '' → null */
function parseNumeroVE(s) {
  if (s == null) return null;
  const m = String(s).match(/-?[\d.]*\d(?:,\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** '50.687,24 BS' → {valor:50687.24, moneda:'BS'} · '70,01 US$' → {valor:70.01, moneda:'US$'} */
function parseMoneda(s) {
  const valor = parseNumeroVE(s);
  const m = String(s == null ? '' : s).match(/(US\$|BS|Bs\.?|\$)\s*$/i);
  return { valor, moneda: m ? m[1].toUpperCase().replace('BS.', 'BS') : null };
}

/** '724,00 BS = 1 US$' → 724 (cuántos BS por 1 US$) */
function parseTasa(s) {
  return parseNumeroVE(s);
}

/** '28/07/2026 09:06:36' → {dia:'2026-07-28', hora:'09:06:36'} · inválida → null */
function parseFechaVE(s) {
  const m = String(s == null ? '' : s).match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/);
  if (!m) return null;
  return { dia: `${m[3]}-${m[2]}-${m[1]}`, hora: m[4] || null };
}

/**
 * Parser TOLERANTE AL ORIGEN — imprescindible para cotejar móvil ↔ web.
 * El **móvil** manda números crudos (JSON: `2000000.00`, coma NO decimal) y la **web** los muestra
 * en **es-VE** (`2.000.000,00`). Usar un solo parser para ambos lados produce **falsos mismatch**
 * (`'2000000.00'` leído como es-VE daría 200.000.000). Detectado por el self-test, 2026-07-28.
 */
function parseNumeroFlexible(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/(US\$|BS|Bs\.?|\$)\s*$/i, '').trim();
  if (!s) return null;
  if (/,\d+$/.test(s)) return parseNumeroVE(s);                    // es-VE: coma decimal
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return parseNumeroVE(s);    // es-VE: miles sin decimales
  const m = s.match(/-?\d+(?:\.\d+)?/);                            // crudo/en-US (payload del móvil)
  return m ? Number(m[0]) : null;
}

/** El epoch `co_<x>`: 'Código pedido: 1785243271076.0' / '1785243271076.0' → 1785243271076 */
function parseEpoch(s) {
  const m = String(s == null ? '' : s).match(/(\d{13})(?:\.\d+)?/);
  return m ? Number(m[1]) : null;
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPARACIÓN Y ORÁCULOS (puro)
// ═════════════════════════════════════════════════════════════════════════════

/** Misma tolerancia que el cotejo BD (`cotejo-payload.js`): redondeo nube↔local no es mismatch. */
const TOL = 0.01;
function igual(a, b, tol) {
  if (a == null || b == null) return false;
  return Math.abs(Number(a) - Number(b)) < (tol == null ? TOL : tol);
}

/** Fechas: veredicto POR DÍA (móvil UTC-4 vs servidor UTC). La hora distinta es NOTA, no mismatch. */
function mismoDia(a, b) {
  const fa = typeof a === 'string' ? parseFechaVE(a) : a;
  const fb = typeof b === 'string' ? parseFechaVE(b) : b;
  return !!(fa && fb && fa.dia === fb.dia);
}

/**
 * Oráculo de conversión — **la dirección depende de la moneda de la transacción**.
 *
 * 🔴 No siempre se divide. Confirmado con datos reales:
 *   · capitalina / Isla Coche: monto en **BS**, conv. en **US$** → `50.687,24 / 724 = 70,01`   → **DIVIDIR**
 *   · el_valle / La Tortuga:   monto en **US$**, conv. en **BS**  → `30,00 × 725,75 = 21.772,50` → **MULTIPLICAR**
 * Asumir siempre división produce **falsos WEB-CALC-MISMATCH** en las playas que operan en US$.
 *
 * Por defecto deduce la dirección de las monedas (`parseMoneda`). Si no puede deducirla, no juzga
 * (`ok: null`) en vez de adivinar. `opts.direccion` fuerza `'dividir'` | `'multiplicar'`.
 */
function verificarConversion(monto, tasa, montoConv, opts) {
  const o = (typeof opts === 'number') ? { tol: opts } : (opts || {});   // compat: 4º arg numérico = tol
  const tol = o.tol == null ? TOL : o.tol;
  const pm = parseMoneda(monto), pc = parseMoneda(montoConv);
  const m = pm.valor, c = pc.valor, t = parseTasa(tasa);
  if (m == null || t == null || c == null || t === 0) return { ok: null, motivo: 'datos incompletos' };

  let dir = o.direccion;
  if (!dir) {
    if (pm.moneda === 'BS' && pc.moneda === 'US$') dir = 'dividir';
    else if (pm.moneda === 'US$' && pc.moneda === 'BS') dir = 'multiplicar';
  }
  if (!dir) {
    return { ok: null, motivo: `no se pudo deducir la dirección (monto=${pm.moneda || '?'}, conv=${pc.moneda || '?'}): pasá opts.direccion` };
  }
  const esperado = dir === 'dividir' ? m / t : m * t;
  return { ok: igual(esperado, c, tol), esperado, obtenido: c, direccion: dir };
}

/** Oráculo de depósito: Σ(cobros hijos) == monto depositado (F0: el detalle lista sus cobros). */
function verificarSuma(partes, total, tol) {
  const nums = (partes || []).map(parseNumeroVE).filter((n) => n != null);
  const t = parseNumeroVE(total);
  if (!nums.length || t == null) return { ok: null, motivo: 'datos incompletos' };
  const suma = nums.reduce((a, b) => a + b, 0);
  return { ok: igual(suma, t, tol == null ? TOL : tol), esperado: suma, obtenido: t };
}

/**
 * Cotejo campo-a-campo **local-driven** (misma regla validada con QA en `cotejo-bd.js`):
 * campo lleno en el móvil + igual en la web → OK · lleno + difiere/falta → MISMATCH ·
 * **vacío en el móvil → se saltea** (no se llenó, no se juzga).
 * @param {object} movil  valores enviados por la app
 * @param {object} web    valores leídos de la web
 * @param {{fechas?:string[], numeros?:string[], ignore?:string[]}} [opts]
 */
function cotejarCampos(movil, web, opts) {
  const o = opts || {};
  const fechas = new Set(o.fechas || []);
  const numeros = new Set(o.numeros || []);
  const ignore = new Set(o.ignore || []);
  const diffs = [], notas = [], okey = [];
  for (const k of Object.keys(movil || {})) {
    if (ignore.has(k)) continue;
    const vm = movil[k];
    if (vm == null || String(vm).trim() === '') continue;            // vacío en móvil → saltear
    const vw = web ? web[k] : undefined;
    if (vw == null || String(vw).trim() === '') { diffs.push({ campo: k, movil: vm, web: null, motivo: 'falta en web' }); continue; }
    let coincide;
    if (fechas.has(k)) {
      coincide = mismoDia(vm, vw);
      const hm = parseFechaVE(vm), hw = parseFechaVE(vw);
      if (coincide && hm && hw && hm.hora && hw.hora && hm.hora !== hw.hora) {
        notas.push({ campo: k, movil: hm.hora, web: hw.hora, motivo: 'misma fecha, distinta hora (zona horaria)' });
      }
    } else if (numeros.has(k)) {
      // cada lado con su convención: móvil = crudo · web = es-VE (ver parseNumeroFlexible)
      coincide = igual(parseNumeroFlexible(vm), parseNumeroFlexible(vw));
    } else {
      coincide = String(vm).replace(/\s+/g, ' ').trim().toUpperCase() === String(vw).replace(/\s+/g, ' ').trim().toUpperCase();
    }
    (coincide ? okey : diffs).push(coincide ? { campo: k } : { campo: k, movil: vm, web: vw, motivo: 'difiere' });
  }
  return { marca: diffs.length ? 'WEB-FIELD-MISMATCH' : 'WEB-OK', comparados: okey.length, diffs, notas };
}

/** Vocabulario de veredictos (espejo del vocabulario BD). Ver PROPUESTA-QA-WEB.md §4. */
const MARCAS = ['WEB-OK', 'WEB-MISSING', 'WEB-FIELD-MISMATCH', 'WEB-CALC-MISMATCH', 'WEB-N/A'];

/**
 * Gate de precondición: solo se juzga en la web lo que el móvil logró mandar a la nube.
 *
 * Hay que distinguir **dos cosas muy distintas**:
 *   - `BD-SAVED` / `BD-QUEUED` → **sabemos** que NO llegó ⇒ `WEB-N/A`, jamás FAIL.
 *   - `BD-N/A`                 → **no sabemos** (BD inaccesible / sin GRANT). No es lo mismo.
 *
 * ⚠ Si `BD-N/A` bloqueara la evaluación, un cliente sin GRANT dejaría **toda** la capa web en
 * `WEB-N/A` y el trabajo no serviría de nada (caso real: `el_valle`, 0/185 tablas legibles).
 * Por eso, con `BD-N/A` se acepta el **respaldo del propio móvil**: si la app obtuvo un
 * **Nro.Ref asignado por el servidor**, el registro llegó a la nube — y eso alcanza para exigirle
 * a la web que lo muestre.
 *
 * @param {string} marcaBD  marca del cotejo BD (RUNTIME §10)
 * @param {{refServidor?: string|number}} [evidenciaMovil] Ref que devolvió el servidor al enviar
 */
function gatePorBD(marcaBD, evidenciaMovil) {
  const m = String(marcaBD || '').toUpperCase();
  if (m === 'BD-OK' || m === 'BD-FIELD-OK') return { evaluar: true, via: 'cotejo-bd' };
  if (m === 'BD-SAVED' || m === 'BD-QUEUED' || m === 'BD-MISMATCH') {
    return { evaluar: false, marca: 'WEB-N/A', motivo: `el móvil no lo envió a la nube (${marcaBD})` };
  }
  const ref = evidenciaMovil && evidenciaMovil.refServidor;
  if (ref != null && String(ref).trim() !== '') {
    return { evaluar: true, via: 'ref-servidor', nota: `sin cotejo BD (${marcaBD || 'sin marca'}); se evalúa por Nro.Ref ${ref} del servidor` };
  }
  return { evaluar: false, marca: 'WEB-N/A', motivo: `sin evidencia de envío (${marcaBD || 'sin marca'}) y sin Nro.Ref del servidor` };
}

// ═════════════════════════════════════════════════════════════════════════════
// BUNDLE DOM — se inyecta con browser_evaluate; registra window.__qaW
// ═════════════════════════════════════════════════════════════════════════════

const BUNDLE_DOM = `() => {
  const txt = (el) => (el && el.textContent || '').replace(/\\s+/g, ' ').trim();
  window.__qaW = {
    // ⚠ Devuelve HOST además de pathname: las 3 playas comparten las mismas rutas (ver verificarContexto)
    contexto: () => ({ host: location.host, pathname: location.pathname, url: location.href, titulo: document.title }),
    /**
     * Cabecera de un detalle → { campo: valor }. **Preferir SIEMPRE ésta sobre leerHojas+emparejarCabecera.**
     * Lee el valor del MISMO PADRE (el valor es un textNode hermano de la etiqueta), que es el patrón real
     * en todos los detalles. Así no puede tomar como valor la etiqueta/encabezado siguiente.
     * Tope de longitud para que 'Ubicación:' no absorba los controles del mapa.
     */
    leerCabecera: (topeValor) => {
      const tope = topeValor || 120;
      const out = {};
      document.querySelectorAll('body *').forEach((el) => {
        if (el.children.length || el.offsetParent === null) return;
        const t = txt(el);
        if (!t.endsWith(':')) return;
        const clave = t.replace(/:+$/, '').trim();
        if (!clave) return;
        let v = '';
        const padre = el.parentElement;
        if (padre) { const pt = txt(padre); if (pt.startsWith(t)) v = pt.slice(t.length).trim(); }
        if (v.length > tope) v = '';
        out[clave] = v;
      });
      return out;
    },
    /** Textos de nodos hoja visibles, en orden — insumo de emparejarCabecera() (modo legado/respaldo). */
    leerHojas: (max) => {
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.children.length || el.offsetParent === null) return;
        const t = txt(el);
        if (t && t.length <= 80) out.push(t);
      });
      return out.slice(0, max || 200);
    },
    /** Tabla → {cols, filas:[{col: valor}]}. Resuelve selects por opción SELECCIONADA. */
    leerTabla: (id, maxFilas) => {
      const t = document.getElementById(id);
      if (!t) return null;
      const cols = [...t.querySelectorAll('thead th')].map(txt);
      const vistos = new Set(), idx = [];
      cols.forEach((c, i) => { if (c && !vistos.has(c)) { vistos.add(c); idx.push(i); } });
      const filas = [...t.querySelectorAll('tbody tr')].slice(0, maxFilas || 50).map((tr) => {
        const tds = [...tr.querySelectorAll('td')];
        const o = {};
        idx.forEach((i) => {
          const td = tds[i]; if (!td) return;
          const sel = td.querySelector('select');
          const lbl = td.querySelector('.ui-selectonemenu-label');
          let v;
          if (sel && sel.selectedIndex >= 0) v = txt(sel.options[sel.selectedIndex]);
          else if (lbl) v = txt(lbl);
          else { v = txt(td); const h = cols[i]; if (h && v.startsWith(h)) v = v.slice(h.length).trim(); }
          o[cols[i]] = v;
        });
        return o;
      });
      return { id, cols: idx.map((i) => cols[i]), filas };
    },
    /** IDs de las .ui-datatable visibles — para anclar por estructura cuando el ID es j_idt*. */
    tablasVisibles: () => [...document.querySelectorAll('.ui-datatable')]
      .filter((t) => t.offsetParent !== null)
      .map((t) => ({ id: t.id, cols: [...new Set([...t.querySelectorAll('thead th')].map(txt).filter(Boolean))] })),
    /** Tabla cuyos encabezados incluyen TODOS los dados (para las j_idt*). */
    tablaPorColumnas: (req) => {
      const t = [...document.querySelectorAll('.ui-datatable')].filter((x) => x.offsetParent !== null)
        .find((x) => { const c = [...x.querySelectorAll('thead th')].map(txt); return req.every((r) => c.includes(r)); });
      return t ? t.id : null;
    },
  };
  return Object.keys(window.__qaW);
}`;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MODULOS, MARCAS, TOL, BUNDLE_DOM, PLAYAS,
    moduloDe, playaDe, verificarContexto,
    esRuido, emparejarCabecera, limpiarCelda, valorDeSelect,
    parseNumeroVE, parseNumeroFlexible, parseMoneda, parseTasa, parseFechaVE, parseEpoch,
    igual, mismoDia, verificarConversion, verificarSuma, cotejarCampos, gatePorBD,
  };
}
