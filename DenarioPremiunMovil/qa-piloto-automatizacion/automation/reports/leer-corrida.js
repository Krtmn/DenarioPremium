#!/usr/bin/env node
/**
 * leer-corrida.js — Lector de reportes de corrida (propuesta #12).
 *
 * Lee la carpeta de UNA corrida y responde, sin ambigüedad y sin modelo:
 *   · qué falló
 *   · qué quedó SIN PROBAR  ← el hueco más peligroso: un caso que nunca se ejecutó
 *                              no figura como FAIL, simplemente NO ESTÁ
 *   · qué registros no se verificaron en la web
 *   · qué cambió respecto de la corrida anterior del mismo cliente
 *
 * Uso:
 *   node automation/reports/leer-corrida.js                 # la corrida más reciente
 *   node automation/reports/leer-corrida.js smoke_el_valle_20260728_130612
 *   node automation/reports/leer-corrida.js <carpeta> --json # salida machine-readable
 *   node automation/reports/leer-corrida.js --self-test
 *
 * Es SOLO-LECTURA y determinista: nunca escribe ni interpreta. La narrativa y los "siguientes
 * pasos" con criterio los pone encima un agente que lee esta salida ya digerida.
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = __dirname;
const ORQUESTADOR = path.join(__dirname, '..', '..', 'guiones-regresion', 'prompt-orquestador-smoke.md');

// ── utilidades puras (testeables) ────────────────────────────────────────────

/** 'Depósitos' → 'depositos' · 'Clientes Potenciales' → 'clientes potenciales' */
function normalizarModulo(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Extrae el ALCANCE (casos esperados por módulo) de la tabla "ORDEN DE EJECUCIÓN"
 * del prompt del orquestador. Es la única fuente de qué se DEBÍA ejecutar.
 * Corta cada celda en el primer '(' para no tragarse la prosa de notas.
 */
function parsearAlcance(md) {
  const alcance = {};
  for (const linea of String(md || '').split(/\r?\n/)) {
    const m = linea.match(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*(DM-[A-Z]{3}-.+?)\s*\|\s*$/);
    if (!m) continue;
    const modulo = normalizarModulo(m[1]);
    const celda = m[2].split('(')[0];                       // corta la prosa
    const pref = celda.match(/DM-([A-Z]{3})-/);
    if (!pref) continue;
    const casos = (celda.match(/\b\d{3}\b/g) || []).map((n) => `DM-${pref[1]}-${n}`);
    if (casos.length) alcance[modulo] = [...new Set(casos)];
  }
  return alcance;
}

/** Lee un .jsonl y devuelve las líneas parseadas + cuántas fallaron. */
function leerJsonl(ruta) {
  if (!fs.existsSync(ruta)) return { filas: [], invalidas: 0, existe: false };
  let invalidas = 0;
  const filas = [];
  for (const l of fs.readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    if (!l.trim()) continue;
    try { filas.push(JSON.parse(l)); } catch (e) { invalidas++; }
  }
  return { filas, invalidas, existe: true };
}

/** Normaliza el veredicto: 'N-A' y 'N/A' son lo mismo. */
function normalizarResultado(r) {
  const s = String(r || '').toUpperCase().replace(/[\s]/g, '');
  if (s === 'N-A' || s === 'N/A' || s === 'NA') return 'N/A';
  return s || '?';
}

/**
 * El corazón del lector: compara el ALCANCE contra el LEDGER.
 * Devuelve, por módulo, los casos que NO tienen veredicto — el hueco invisible.
 */
function detectarHuecos(alcance, filas) {
  const ejecutados = {};
  for (const f of filas) {
    const m = normalizarModulo(f.modulo);
    (ejecutados[m] = ejecutados[m] || new Set()).add(String(f.caso || '').trim());
  }
  const huecos = [];
  for (const [modulo, casos] of Object.entries(alcance)) {
    const hechos = ejecutados[modulo] || new Set();
    const faltan = casos.filter((c) => !hechos.has(c));
    if (faltan.length) {
      huecos.push({
        modulo,
        esperados: casos.length,
        ejecutados: casos.length - faltan.length,
        faltan,
        moduloAusente: hechos.size === 0,          // ⚠ ni una línea: el módulo no corrió
      });
    }
  }
  return huecos.sort((a, b) => b.faltan.length - a.faltan.length);
}

/** Registros creados (manifiesto) que NO tienen veredicto en la capa web. */
function detectarSinCotejoWeb(manifiesto, web) {
  const verificados = new Set(web.map((w) => `${normalizarModulo(w.modulo)}|${String(w.ref)}`));
  const alias = { clientes: 'clientes_potenciales' };       // el móvil rotula distinto que la web
  return manifiesto.filter((r) => {
    const m = normalizarModulo(r.modulo);
    const claves = [`${m}|${String(r.ref)}`];
    if (alias[m]) claves.push(`${alias[m]}|${String(r.ref)}`);
    return !claves.some((k) => verificados.has(k));
  });
}

/** Diff de veredictos contra otra corrida: qué empeoró, qué mejoró. */
function compararCorridas(actual, anterior) {
  const idx = (filas) => {
    const m = {};
    for (const f of filas) m[`${normalizarModulo(f.modulo)}|${f.caso}`] = normalizarResultado(f.resultado);
    return m;
  };
  const A = idx(actual), B = idx(anterior);
  const peor = [], mejor = [], nuevos = [], desaparecidos = [];
  const rank = { PASS: 3, 'N/A': 2, SKIP: 2, BLOCKED: 1, FAIL: 0 };
  for (const k of Object.keys(A)) {
    if (!(k in B)) { nuevos.push({ caso: k, ahora: A[k] }); continue; }
    if (A[k] === B[k]) continue;
    const item = { caso: k, antes: B[k], ahora: A[k] };
    ((rank[A[k]] ?? 9) < (rank[B[k]] ?? 9) ? peor : mejor).push(item);
  }
  for (const k of Object.keys(B)) if (!(k in A)) desaparecidos.push({ caso: k, antes: B[k] });
  return { peor, mejor, nuevos, desaparecidos };
}

// ── ANOMALÍAS: "cosas raras" que merecen ojo humano ─────────────────────────

/** Señales de DIVERGENCIA: una línea marcada que además dice que algo no cuadra. */
const SENIALES = [
  'pero', 'sin embargo', 'no aparece', 'no coincide', 'no cuadra', 'no reprodujo', 'no repuebla',
  'en vez de', 'en lugar de', 'diverge', 'divergencia', 'anómal', 'anomal', 'inesperad',
  'contradice', 'contradicci', 'discrepan', 'difiere', 'falso', 'deberia', 'debería',
  'llamativ', 'sospech', 'raro', 'extraño', 'no deberia', 'no debería', 'sigue en 0',
  'duplicad', 'se pierde', 'se perdio', 'se perdió', 'no persiste', 'no fiable', 'poco fiable',
  // valores que no cuadran (el patrón "muestra X cuando el valor real es Y")
  'valor real', 'cuando el valor', 'en 0,00', 'en cero', 'incorrect', 'mal calculad', 'no suma',
];
// ⚠ Esta lista es una HEURÍSTICA tunable, no una verdad: si una corrida deja pasar una anomalía
//    real, agregar acá la expresión que la describía. Prefiere falsos positivos (ruido revisable)
//    antes que falsos negativos (una rareza que nadie mira).
/** Ruido: encabezados de tabla, reglas e instrucciones — no son hallazgos. */
const RUIDO_ANOM = [
  'no re-marcar', 'no reportar', 'prohibid', 'usar h.', 'anti-patrón:', 'anti-patron:',
  '| patrón', '| universal', 'obligatori', 'recordá', 'recorda ',
];

const MARCADOR = /[⚠🐞🔴🔎]/u;

/** Extrae de un .md las líneas que parecen un hallazgo (no una regla). */
function extraerAnomaliasDeMd(texto, archivo) {
  const out = [];
  let seccion = '';
  for (const cruda of String(texto || '').split(/\r?\n/)) {
    const l = cruda.trim();
    if (/^#{1,4}\s/.test(l)) { seccion = l.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim(); continue; }
    if (!l || l.length < 25) continue;
    const bajo = l.toLowerCase();
    if (RUIDO_ANOM.some((r) => bajo.includes(r))) continue;
    if (/^\|\s*-+/.test(l)) continue;                                  // separador de tabla

    const enSeccionHallazgos = /hallazgo|observaci|divergenc|defect/i.test(seccion);
    const tieneMarcador = MARCADOR.test(l);
    const tieneSenial = SENIALES.some((s) => bajo.includes(s));

    // Un hallazgo es: (marcador Y señal de divergencia) o (está en una sección de hallazgos Y tiene señal)
    if (!((tieneMarcador && tieneSenial) || (enSeccionHallazgos && tieneSenial))) continue;

    out.push({
      archivo,
      seccion: seccion || '(sin sección)',
      texto: l.replace(/\s+/g, ' ').replace(/^[|>\-*\s]+/, '').slice(0, 300),
    });
  }
  return out;
}

/** Cruza cada anomalía contra el registro de defectos conocidos. */
function clasificarAnomalias(anomalias, defectos) {
  const conocidas = [], nuevas = [];
  for (const a of anomalias) {
    const hit = (defectos || []).find((d) => {
      if (!d.patron) return false;
      try { return new RegExp(d.patron, 'i').test(a.texto); } catch (e) { return false; }
    });
    if (hit) conocidas.push({ ...a, defecto: hit });
    else nuevas.push(a);
  }
  return { conocidas, nuevas };
}

/** Anomalías que salen del propio ledger, sin leer prosa. */
function anomaliasDelLedger(filas, manifiesto, web) {
  const out = [];
  // reintentos
  const reintentos = filas.filter((f) => Number(f.intentos) >= 2);
  if (reintentos.length) out.push({ tipo: 'reintentos', detalle: `${reintentos.length} caso(s) necesitaron 2 intentos (flakiness): ` + reintentos.map((f) => f.caso).join(', ') });
  // outliers de duración: > 3× la mediana global
  const ms = filas.map((f) => Number(f.ms)).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (ms.length > 5) {
    const mediana = ms[Math.floor(ms.length / 2)];
    const lentos = filas.filter((f) => Number(f.ms) > mediana * 3);
    if (lentos.length) out.push({ tipo: 'lentitud', detalle: `${lentos.length} caso(s) tardaron >3× la mediana (${mediana} ms): ` + lentos.map((f) => `${f.caso} (${f.ms}ms)`).slice(0, 6).join(', ') });
  }
  // registros sin Ref del servidor
  const sinRef = (manifiesto || []).filter((r) => r.ref == null || String(r.ref).trim() === '');
  if (sinRef.length) out.push({ tipo: 'sin-ref', detalle: `${sinRef.length} registro(s) creados SIN Nro.Ref del servidor: ` + sinRef.map((r) => `${r.modulo}/${r.caso}`).join(', ') });
  // marcas BD distintas de OK
  const bdMal = (manifiesto || []).filter((r) => r.marca_bd && !/^BD-(OK|FIELD-OK)$/i.test(r.marca_bd));
  if (bdMal.length) out.push({ tipo: 'bd', detalle: `${bdMal.length} registro(s) con marca BD distinta de OK: ` + bdMal.map((r) => `${r.modulo}/${r.ref}=${r.marca_bd}`).join(', ') });
  // marcas web distintas de OK
  const webMal = (web || []).filter((w) => w.marca && w.marca !== 'WEB-OK');
  if (webMal.length) out.push({ tipo: 'web', detalle: `${webMal.length} veredicto(s) web distinto(s) de WEB-OK: ` + webMal.map((w) => `${w.modulo}/${w.ref}=${w.marca}`).join(', ') });
  return out;
}

function cargarDefectos() {
  const ruta = path.join(__dirname, '..', 'defectos-conocidos.yaml');
  if (!fs.existsSync(ruta)) return { meta: {}, defectos: [] };
  try {
    const yaml = require('js-yaml');
    return yaml.load(fs.readFileSync(ruta, 'utf8')) || { meta: {}, defectos: [] };
  } catch (e) {
    return { meta: {}, defectos: [], _error: e.message };
  }
}

// ── recolección ─────────────────────────────────────────────────────────────

// Los reportes están agrupados por cliente: reports/<cliente>/<corrida>/
// Se recorren AMBOS niveles para seguir soportando corridas sueltas en la raíz.
// 🔴 El orden se calcula sobre el NOMBRE DE LA CORRIDA, no sobre la ruta: si se
// ordenara por ruta, "la más reciente" sería la del último cliente alfabético.
// Los nombres llevan YYYYMMDD, así que el orden lexicográfico es cronológico.
// Fecha embebida en el nombre de la corrida (YYYYMMDD[_HHMMSS]).
// Devuelve 0 si el nombre no la trae, para que esas queden al final del orden.
function fechaDe(carpeta) {
  const m = path.basename(carpeta).match(/_(\d{8})(?:_(\d{6}))?/);
  return m ? Number(m[1] + (m[2] || '000000')) : 0;
}

function corridasDisponibles() {
  const esCorrida = (n) => /^smoke_/.test(n);
  const out = [];
  for (const d of fs.readdirSync(REPORTS_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    if (esCorrida(d.name)) out.push(d.name);
    for (const h of fs.readdirSync(path.join(REPORTS_DIR, d.name), { withFileTypes: true })) {
      if (h.isDirectory() && esCorrida(h.name)) out.push(`${d.name}/${h.name}`);
    }
  }
  return out.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function analizar(carpeta, carpetaAnterior) {
  const dir = path.join(REPORTS_DIR, carpeta);
  if (!fs.existsSync(dir)) throw new Error(`no existe la corrida: ${carpeta}`);

  const ledger = leerJsonl(path.join(dir, '_results.jsonl'));
  const manif = leerJsonl(path.join(dir, '_bd-manifest.jsonl'));
  const web = leerJsonl(path.join(dir, '_web-results.jsonl'));
  const alcance = fs.existsSync(ORQUESTADOR) ? parsearAlcance(fs.readFileSync(ORQUESTADOR, 'utf8')) : {};

  // resumen por módulo
  const porModulo = {};
  for (const f of ledger.filas) {
    const m = normalizarModulo(f.modulo);
    const r = normalizarResultado(f.resultado);
    porModulo[m] = porModulo[m] || { PASS: 0, FAIL: 0, 'N/A': 0, BLOCKED: 0, SKIP: 0, total: 0 };
    porModulo[m][r] = (porModulo[m][r] || 0) + 1;
    porModulo[m].total++;
  }

  const fails = ledger.filas.filter((f) => normalizarResultado(f.resultado) === 'FAIL');
  const blocked = ledger.filas.filter((f) => normalizarResultado(f.resultado) === 'BLOCKED');
  const nas = ledger.filas.filter((f) => normalizarResultado(f.resultado) === 'N/A');
  const huecos = detectarHuecos(alcance, ledger.filas);
  const sinWeb = detectarSinCotejoWeb(manif.filas, web.filas);

  // marcas de la capa web
  const marcasWeb = {};
  for (const w of web.filas) marcasWeb[w.marca] = (marcasWeb[w.marca] || 0) + 1;

  const trazas = fs.existsSync(path.join(dir, '_trace'))
    ? fs.readdirSync(path.join(dir, '_trace')).filter((f) => f.endsWith('.trace.json')) : [];

  const reportes = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));

  // anomalías: de la prosa de los reportes + del propio ledger
  const registro = cargarDefectos();
  let crudas = [];
  for (const f of reportes) {
    crudas = crudas.concat(extraerAnomaliasDeMd(fs.readFileSync(path.join(dir, f), 'utf8'), f));
  }
  // dedup por texto
  const vistas = new Set();
  crudas = crudas.filter((a) => { const k = a.texto.slice(0, 120); if (vistas.has(k)) return false; vistas.add(k); return true; });
  const { conocidas, nuevas } = clasificarAnomalias(crudas, registro.defectos);
  const delLedger = anomaliasDelLedger(ledger.filas, manif.filas, web.filas);

  let diff = null;
  if (carpetaAnterior) {
    const l2 = leerJsonl(path.join(REPORTS_DIR, carpetaAnterior, '_results.jsonl'));
    if (l2.existe) diff = { contra: carpetaAnterior, ...compararCorridas(ledger.filas, l2.filas) };
  }

  return {
    corrida: carpeta,
    run_id: (ledger.filas[0] || {}).run_id || null,
    ledger: { lineas: ledger.filas.length, invalidas: ledger.invalidas, existe: ledger.existe },
    porModulo, fails, blocked, nas, huecos,
    manifiesto: manif.filas.length,
    web: { lineas: web.filas.length, marcas: marcasWeb, existe: web.existe },
    sinCotejoWeb: sinWeb,
    trazas, reportes, diff,
    anomalias: { nuevas, conocidas, delLedger, versionEnPrueba: (registro.meta || {}).tag_en_prueba || null },
  };
}

// ── salida legible ──────────────────────────────────────────────────────────

const b = (s) => `\x1b[1m${s}\x1b[0m`;
const rojo = (s) => `\x1b[31m${s}\x1b[0m`;
const amar = (s) => `\x1b[33m${s}\x1b[0m`;
const verde = (s) => `\x1b[32m${s}\x1b[0m`;

function imprimir(a) {
  const L = [];
  L.push('', b(`═══ CORRIDA: ${a.corrida} ═══`));
  if (a.run_id) L.push(`RUN_ID: ${a.run_id}`);
  if (!a.ledger.existe) L.push(rojo('⚠ No hay _results.jsonl — la corrida no dejó ledger.'));
  if (a.ledger.invalidas) L.push(amar(`⚠ ${a.ledger.invalidas} línea(s) del ledger no son JSON válido`));

  // resumen
  L.push('', b('── Resultado por módulo ──'));
  L.push('MÓDULO'.padEnd(22) + 'PASS  FAIL   N/A  BLOCK  SKIP   TOTAL');
  const tot = { PASS: 0, FAIL: 0, 'N/A': 0, BLOCKED: 0, SKIP: 0, total: 0 };
  for (const [m, c] of Object.entries(a.porModulo)) {
    for (const k of Object.keys(tot)) tot[k] += c[k] || 0;
    L.push(m.padEnd(22) + String(c.PASS).padStart(4) + String(c.FAIL).padStart(6) +
      String(c['N/A']).padStart(6) + String(c.BLOCKED).padStart(7) + String(c.SKIP).padStart(6) +
      String(c.total).padStart(8));
  }
  L.push('─'.repeat(58));
  L.push('TOTAL'.padEnd(22) + String(tot.PASS).padStart(4) + String(tot.FAIL).padStart(6) +
    String(tot['N/A']).padStart(6) + String(tot.BLOCKED).padStart(7) + String(tot.SKIP).padStart(6) +
    String(tot.total).padStart(8));

  // EL HUECO — lo primero que hay que ver
  L.push('', b('── 🔴 COBERTURA: lo que NO se probó ──'));
  if (!a.huecos.length) {
    L.push(verde('✅ Todos los casos del alcance tienen veredicto.'));
  } else {
    for (const h of a.huecos) {
      const cab = `${h.modulo}: ${h.faltan.length} de ${h.esperados} casos SIN VEREDICTO`;
      L.push(h.moduloAusente ? rojo(`🔴 ${cab}  ← el módulo NO dejó NI UNA línea en el ledger`) : amar(`⚠  ${cab}`));
      L.push('     ' + h.faltan.join(', '));
    }
    L.push('');
    L.push(amar('   Un caso que nunca se ejecutó NO aparece como FAIL: simplemente no está.'));
    L.push(amar('   Es el hueco más peligroso de una corrida y por eso va primero.'));
  }

  // fallos
  L.push('', b('── Fallos y bloqueos ──'));
  if (!a.fails.length) L.push(verde('✅ 0 FAIL'));
  else { L.push(rojo(`❌ ${a.fails.length} FAIL:`)); for (const f of a.fails) L.push(`   ${f.modulo} · ${f.caso}`); }
  if (a.blocked.length) { L.push(amar(`⛔ ${a.blocked.length} BLOCKED:`)); for (const f of a.blocked) L.push(`   ${f.modulo} · ${f.caso}`); }
  if (a.nas.length) L.push(`🚫 ${a.nas.length} N/A: ` + a.nas.map((f) => f.caso).join(', '));

  // capa web
  L.push('', b('── Capa WEB ──'));
  if (!a.web.existe) {
    L.push('(sin _web-results.jsonl — la corrida no incluyó capa web)');
  } else {
    L.push(`${a.web.lineas} registro(s) verificado(s): ` +
      Object.entries(a.web.marcas).map(([k, v]) => `${k}=${v}`).join(' · '));
  }
  L.push(`Registros creados (manifiesto): ${a.manifiesto}`);
  if (a.sinCotejoWeb.length) {
    L.push(rojo(`🔴 ${a.sinCotejoWeb.length} registro(s) creado(s) SIN verificar en la web:`));
    for (const r of a.sinCotejoWeb) L.push(`   ${r.modulo} · Ref ${r.ref} (${r.caso || 's/caso'})`);
    L.push(amar('   Son transacciones que llegaron a la nube pero nadie confirmó cómo se ven en la web.'));
  } else if (a.manifiesto) {
    L.push(verde('✅ Todos los registros creados tienen veredicto web.'));
  }

  // diff
  if (a.diff) {
    L.push('', b(`── Comparación contra ${a.diff.contra} ──`));
    if (a.diff.peor.length) {
      L.push(rojo(`📉 ${a.diff.peor.length} caso(s) EMPEORARON:`));
      for (const d of a.diff.peor) L.push(`   ${d.caso}: ${d.antes} → ${d.ahora}`);
    } else L.push(verde('✅ Ningún caso empeoró.'));
    if (a.diff.mejor.length) L.push(verde(`📈 ${a.diff.mejor.length} mejoraron`));
    if (a.diff.desaparecidos.length) L.push(amar(`⚠ ${a.diff.desaparecidos.length} caso(s) que antes se probaban y ahora NO están: ` +
      a.diff.desaparecidos.slice(0, 8).map((d) => d.caso).join(', ')));
  }

  // ── COSAS RARAS — lo que hay que mirar con ojo humano ──
  const A = a.anomalias || { nuevas: [], conocidas: [], delLedger: [] };
  L.push('', b('── 🔎 COSAS RARAS — para revisar a ojo ──'));
  if (A.versionEnPrueba) L.push(`(cruzado contra defectos conocidos del tag ${A.versionEnPrueba})`);

  if (A.delLedger.length) {
    L.push('', amar('  Señales del ledger:'));
    for (const x of A.delLedger) L.push(`   · [${x.tipo}] ${x.detalle}`);
  }

  if (A.nuevas.length) {
    L.push('', rojo(`  🔎 ${A.nuevas.length} observación(es) SIN clasificar — revisá si hay que reportarlas:`));
    for (const x of A.nuevas) L.push(`   · (${x.archivo} › ${x.seccion})\n     ${x.texto}`);
  } else {
    L.push('', verde('  Ninguna observación nueva sin clasificar.'));
  }

  if (A.conocidas.length) {
    const porId = {};
    for (const x of A.conocidas) (porId[x.defecto.id] = porId[x.defecto.id] || []).push(x);
    L.push('', `  ✔ ${A.conocidas.length} coincidencia(s) con DEFECTOS YA CONOCIDOS (no requieren acción nueva):`);
    for (const [id, xs] of Object.entries(porId)) {
      const d = xs[0].defecto;
      const est = d.estado === 'resuelto-sin-liberar' ? `resuelto en ${d.resuelto_en} (sin liberar)`
        : d.estado === 'corregido' ? 'corregido' : d.estado;
      L.push(`   · ${id} — ${d.titulo}`);
      L.push(`     estado: ${est}${d.detectado_en ? ` · detectado en ${d.detectado_en}` : ''} · ${xs.length} mención(es)`);
      if (d.accion) L.push(`     acción: ${d.accion}`);
    }
  }

  // material
  L.push('', b('── Material de la corrida ──'));
  L.push(`Reportes .md: ${a.reportes.length} (${a.reportes.join(', ')})`);
  L.push(`Trazas: ${a.trazas.length}${a.trazas.length ? ' (' + a.trazas.join(', ') + ')' : ''}`);

  // siguientes pasos MECÁNICOS
  L.push('', b('── Siguientes pasos (derivados, sin interpretación) ──'));
  const pasos = [];
  for (const h of a.huecos) {
    pasos.push(h.moduloAusente
      ? `RE-CORRER el módulo ${h.modulo.toUpperCase()} completo — no dejó ningún veredicto (${h.esperados} casos).`
      : `Completar ${h.faltan.length} caso(s) de ${h.modulo}: ${h.faltan.slice(0, 6).join(', ')}${h.faltan.length > 6 ? '…' : ''}`);
  }
  if (a.fails.length) pasos.push(`Investigar ${a.fails.length} FAIL: ${a.fails.map((f) => f.caso).join(', ')}`);
  if (a.blocked.length) pasos.push(`Revisar ${a.blocked.length} BLOCKED (¿limitación de automatización o defecto?).`);
  if (a.sinCotejoWeb.length) pasos.push(`Verificar en la web ${a.sinCotejoWeb.length} registro(s) creado(s) sin cotejo.`);
  if (a.diff && a.diff.peor.length) pasos.push(`Atender ${a.diff.peor.length} regresión(es) respecto de la corrida anterior.`);
  if (a.web.marcas['WEB-CALC-MISMATCH']) pasos.push(`Revisar ${a.web.marcas['WEB-CALC-MISMATCH']} descuadre(s) de cálculo en la web.`);
  if (a.web.marcas['WEB-MISSING']) pasos.push(`${a.web.marcas['WEB-MISSING']} registro(s) no aparecieron en la web tras el barrido.`);
  if (!pasos.length) pasos.push(verde('Nada mecánico pendiente: alcance completo, sin FAIL y sin registros sin cotejar.'));
  pasos.forEach((p, i) => L.push(`${i + 1}. ${p}`));
  L.push('');
  return L.join('\n');
}

// ── self-test ───────────────────────────────────────────────────────────────

function selfTest() {
  let ok = 0, fail = 0;
  const t = (d, c) => { if (c) ok++; else { fail++; console.error('  FAIL: ' + d); } };
  const eq = (d, a, e) => t(`${d} (esperaba ${JSON.stringify(e)}, dio ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(e));

  eq('normalizarModulo quita acentos', normalizarModulo('Depósitos'), 'depositos');
  eq('normalizarResultado unifica N-A y N/A', [normalizarResultado('N-A'), normalizarResultado('N/A')], ['N/A', 'N/A']);

  // alcance: corta la prosa entre paréntesis (el caso real de cobros)
  const md = [
    '| # | Módulo | Casos Smoke |',
    '| 1 | Login | DM-LOG-002, 003, 004 |',
    '| 4 | Cobros | DM-COB-001, 002, 004 (**seleccionar un cliente** — usar **040** si aplica) |',
  ].join('\n');
  const alc = parsearAlcance(md);
  eq('alcance de login', alc.login, ['DM-LOG-002', 'DM-LOG-003', 'DM-LOG-004']);
  eq('alcance de cobros IGNORA los números de la prosa', alc.cobros, ['DM-COB-001', 'DM-COB-002', 'DM-COB-004']);

  // huecos
  const filas = [{ modulo: 'login', caso: 'DM-LOG-002', resultado: 'PASS' }];
  const h = detectarHuecos(alc, filas);
  const login = h.find((x) => x.modulo === 'login');
  const cobros = h.find((x) => x.modulo === 'cobros');
  eq('detecta los 2 casos de login que faltan', login.faltan, ['DM-LOG-003', 'DM-LOG-004']);
  t('marca cobros como MÓDULO AUSENTE (ni una línea)', cobros.moduloAusente === true);
  t('login NO se marca como ausente (tiene 1 línea)', login.moduloAusente === false);
  t('ordena por gravedad: cobros (3 faltan) antes que login (2)', h[0].modulo === 'cobros');

  // sin cotejo web + alias clientes → clientes_potenciales
  const manif = [{ modulo: 'clientes', ref: '2' }, { modulo: 'pedidos', ref: '437' }, { modulo: 'cobros', ref: '122' }];
  const web = [{ modulo: 'clientes_potenciales', ref: '2', marca: 'WEB-OK' }, { modulo: 'pedidos', ref: '437', marca: 'WEB-OK' }];
  const sin = detectarSinCotejoWeb(manif, web);
  eq('detecta el registro sin cotejo web', sin.map((r) => r.ref), ['122']);
  t('el alias clientes→clientes_potenciales NO da falso positivo', !sin.some((r) => r.modulo === 'clientes'));

  // diff
  const d = compararCorridas(
    [{ modulo: 'cobros', caso: 'A', resultado: 'FAIL' }, { modulo: 'cobros', caso: 'B', resultado: 'PASS' }, { modulo: 'cobros', caso: 'C', resultado: 'PASS' }],
    [{ modulo: 'cobros', caso: 'A', resultado: 'PASS' }, { modulo: 'cobros', caso: 'B', resultado: 'FAIL' }, { modulo: 'cobros', caso: 'D', resultado: 'PASS' }]
  );
  eq('detecta la regresión PASS→FAIL', d.peor.map((x) => x.caso), ['cobros|A']);
  eq('detecta la mejora FAIL→PASS', d.mejor.map((x) => x.caso), ['cobros|B']);
  eq('detecta el caso nuevo', d.nuevos.map((x) => x.caso), ['cobros|C']);
  eq('detecta el caso que DESAPARECIÓ del alcance', d.desaparecidos.map((x) => x.caso), ['cobros|D']);

  eq('jsonl inexistente no revienta', leerJsonl('/no/existe.jsonl').existe, false);

  // ── anomalías ──
  const mdAnom = [
    '## Hallazgos',
    '⚠ El botón "Pedido Sugerido" aparece PERO la VG está en false, cuarta corrida consecutiva.',
    '## Casos ejecutados',
    '⚠ Recordá usar h.clickAlertButton para los alerts — es obligatorio en todos los módulos.',
    'DM-PED-001 PASS sin novedad y con evidencia suficiente para el reporte.',
    '⚠ El detalle muestra Total Monto a pagar en 0,00 cuando el valor real es 12,00 en la retención.',
  ].join('\n');
  const an = extraerAnomaliasDeMd(mdAnom, 'x.md');
  t('detecta el hallazgo con marcador + señal de divergencia', an.some((x) => /Pedido Sugerido/.test(x.texto)));
  t('detecta el del Total en 0,00', an.some((x) => /Total Monto a pagar/.test(x.texto)));
  t('IGNORA la línea de regla/instrucción (⚠ pero es "obligatorio")', !an.some((x) => /clickAlertButton/.test(x.texto)));
  t('IGNORA la línea sin marcador ni señal', !an.some((x) => /sin novedad/.test(x.texto)));

  const defs = [{ id: 'COB-RET-TOTAL-CERO', titulo: 'Total en 0', patron: 'total monto a pagar', estado: 'resuelto-sin-liberar', resuelto_en: 'v21' }];
  const cl = clasificarAnomalias(an, defs);
  t('clasifica como CONOCIDO lo que matchea el registro', cl.conocidas.some((x) => x.defecto.id === 'COB-RET-TOTAL-CERO'));
  t('deja como NUEVO lo que no matchea', cl.nuevas.some((x) => /Pedido Sugerido/.test(x.texto)));
  t('un patrón inválido no rompe la clasificación', clasificarAnomalias(an, [{ id: 'X', patron: '([' }]).nuevas.length === an.length);

  const led = anomaliasDelLedger(
    [{ caso: 'A', intentos: 2, ms: 100 }, { caso: 'B', intentos: 1, ms: 100 }],
    [{ modulo: 'cobros', ref: null, caso: 'C1' }, { modulo: 'pedidos', ref: '9', marca_bd: 'BD-SAVED' }],
    [{ modulo: 'cobros', ref: '122', marca: 'WEB-CALC-MISMATCH' }]
  );
  t('ledger: detecta reintentos', led.some((x) => x.tipo === 'reintentos'));
  t('ledger: detecta registro sin Ref del servidor', led.some((x) => x.tipo === 'sin-ref'));
  t('ledger: detecta marca BD distinta de OK', led.some((x) => x.tipo === 'bd'));
  t('ledger: detecta veredicto web distinto de WEB-OK', led.some((x) => x.tipo === 'web'));

  console.log(`\n=== leer-corrida self-test: ${ok} OK, ${fail} FAIL ===`);
  process.exit(fail ? 1 : 0);
}

// ── main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.includes('--self-test')) selfTest();

const json = args.includes('--json');
const libres = args.filter((a) => !a.startsWith('--'));
const disponibles = corridasDisponibles();
if (!disponibles.length) { console.error('No hay corridas en automation/reports/'); process.exit(1); }

// Sin argumento se toma la corrida MÁS RECIENTE POR FECHA.
// 🔴 Antes se tomaba `disponibles[length-1]` tras ordenar por nombre, y como el
// nombre empieza por el cliente (smoke_<cliente>_<fecha>) eso devolvía "el último
// cliente alfabético", no la corrida más nueva. Se ordena por la fecha del nombre.
const carpeta = libres[0] || [...disponibles].sort((a, b) => fechaDe(a) - fechaDe(b)).pop();
// El cliente es la carpeta contenedora; si la corrida está suelta en la raíz
// (estructura vieja), se cae al nombre.
const cliente = carpeta.includes('/')
  ? carpeta.split('/')[0]
  : (path.basename(carpeta).match(/^smoke_(.+?)_\d{8}/) || [])[1];
// corrida anterior DEL MISMO CLIENTE (comparar contra otro cliente no dice nada)
const anterior = !cliente ? undefined : disponibles
  .filter((c) => (c.includes('/') ? c.split('/')[0] === cliente
                                  : path.basename(c).startsWith(`smoke_${cliente}_`))
               && c !== carpeta && fechaDe(c) < fechaDe(carpeta))
  .sort((a, b) => fechaDe(a) - fechaDe(b))
  .pop();

try {
  const a = analizar(carpeta, anterior);
  console.log(json ? JSON.stringify(a, null, 2) : imprimir(a));
} catch (e) {
  console.error('ERR: ' + e.message);
  process.exit(1);
}
