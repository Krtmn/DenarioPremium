'use strict';
// consolidar.js — Genera consolidado.md unificando los 3 runners
//
// Uso:
//   node automation/playwright/consolidar.js run-vzla
//     → busca automáticamente los últimos dirs de cada runner
//
//   node automation/playwright/consolidar.js run-vzla \
//     --movil=automation/reports/playwright_run-vzla_FECHA \
//     --web=automation/reports/web_run-vzla_FECHA \
//     --extendido=automation/reports/web-extendido_run-vzla_FECHA
//
//   Cualquiera de los 3 flags es opcional. Si no se pasa, ese runner
//   aparece como "(no ejecutado)" en el consolidado.

const path = require('path');
const fs   = require('fs');

const ROOT = path.resolve(__dirname, '..', '..');
const REPORTS_DIR = path.join(ROOT, 'automation', 'reports');

// ── Parsear args ──────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
let QA_CLIENTE = null, DIR_MOVIL = null, DIR_WEB = null, DIR_EXT = null;
for (const a of rawArgs) {
  if      (a.startsWith('--movil='))    DIR_MOVIL  = path.resolve(ROOT, a.split('=').slice(1).join('='));
  else if (a.startsWith('--web='))      DIR_WEB    = path.resolve(ROOT, a.split('=').slice(1).join('='));
  else if (a.startsWith('--extendido=')) DIR_EXT   = path.resolve(ROOT, a.split('=').slice(1).join('='));
  else if (!QA_CLIENTE && !a.startsWith('--')) QA_CLIENTE = a;
}
if (!QA_CLIENTE) {
  console.error('Uso: node automation/playwright/consolidar.js <QA_CLIENTE> [--movil=...] [--web=...] [--extendido=...]');
  process.exit(1);
}

// ── Auto-detectar último dir de cada runner si no se pasa explícito ──────────
function ultimoDir(prefix) {
  try {
    const dirs = fs.readdirSync(REPORTS_DIR)
      .filter(d => d.startsWith(prefix))
      .sort();
    return dirs.length ? path.join(REPORTS_DIR, dirs[dirs.length - 1]) : null;
  } catch (_) { return null; }
}

if (!DIR_MOVIL)  DIR_MOVIL = ultimoDir(`playwright_${QA_CLIENTE}_`);
if (!DIR_WEB)    DIR_WEB   = ultimoDir(`web_${QA_CLIENTE}_`);
if (!DIR_EXT)    DIR_EXT   = ultimoDir(`web-extendido_${QA_CLIENTE}_`);

// ── Leer jsonl ────────────────────────────────────────────────────────────────
function leerJsonl(dir, filename) {
  if (!dir) return [];
  const p = path.join(dir, filename);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(Boolean);
}

const veredictoMovil = leerJsonl(DIR_MOVIL, '_results.jsonl');
const veredictoWeb   = leerJsonl(DIR_WEB,   '_web-results.jsonl');
const veredictoExt   = leerJsonl(DIR_EXT,   '_web-results.jsonl');

// ── Conteos ───────────────────────────────────────────────────────────────────
function contar(rows) {
  return rows.reduce((a, v) => {
    a[v.resultado] = (a[v.resultado] || 0) + 1;
    return a;
  }, {});
}

function contarPorModulo(rows, keyField) {
  const map = {};
  for (const v of rows) {
    const key = v[keyField] || 'desconocido';
    if (!map[key]) map[key] = [];
    map[key].push(v);
  }
  return map;
}

const cMovil = contar(veredictoMovil);
const cWeb   = contar(veredictoWeb);
const cExt   = contar(veredictoExt);

const totalAll = [...veredictoMovil, ...veredictoWeb, ...veredictoExt];
const cTotal   = contar(totalAll);

// ── Helpers de formato ────────────────────────────────────────────────────────
const ICON = { PASS: '✅', FAIL: '❌', 'N/A': '⬜', BLOCKED: '🚫', SKIP: '⏭️' };
function icon(r) { return ICON[r] || '❓'; }

function filaResumen(label, rows, dirUsado) {
  if (!dirUsado) return `| ${label} | — | — | — | — | — | _(no ejecutado)_ |`;
  const c = contar(rows);
  const total = rows.length;
  const estado = c.FAIL ? '⚠️' : c.BLOCKED ? '🚫' : total === 0 ? '—' : '✅';
  return `| ${label} | ${total} | ${c.PASS||0} | ${c.FAIL||0} | ${c['N/A']||0} | ${c.BLOCKED||0} | ${estado} |`;
}

function dirLabel(dir) {
  return dir ? path.basename(dir) : '(no ejecutado)';
}

// ── Fecha/hora ────────────────────────────────────────────────────────────────
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const fechaStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
const horaStr  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

// ── Construir markdown ────────────────────────────────────────────────────────
const lines = [];

lines.push(`# Consolidado QA — Denario Premium · ${QA_CLIENTE.toUpperCase()}`);
lines.push(`## ${fechaStr} ${horaStr}`);
lines.push('');

// Parámetros
lines.push('| Parámetro | Valor |');
lines.push('|-----------|-------|');
lines.push(`| **Cliente** | \`${QA_CLIENTE}\` |`);
lines.push(`| **Fecha** | ${fechaStr} ${horaStr} |`);
lines.push(`| **Runner Móvil** | \`${dirLabel(DIR_MOVIL)}\` |`);
lines.push(`| **Runner Web** | \`${dirLabel(DIR_WEB)}\` |`);
lines.push(`| **Runner Web Extendido** | \`${dirLabel(DIR_EXT)}\` |`);
lines.push(`| **Resultado global** | **${cTotal.PASS||0} PASS · ${cTotal.FAIL||0} FAIL · ${cTotal['N/A']||0} N/A · ${cTotal.BLOCKED||0} BLOCKED** de ${totalAll.length} casos |`);
lines.push('');

// ── Resumen por sección ───────────────────────────────────────────────────────
lines.push('## Resumen por sección');
lines.push('');
lines.push('| Sección | Casos | PASS | FAIL | N/A | BLK | Estado |');
lines.push('|---------|-------|------|------|-----|-----|--------|');

// Móvil por módulo
const movilPorModulo = contarPorModulo(veredictoMovil, 'modulo');
if (DIR_MOVIL) {
  for (const [mod, rows] of Object.entries(movilPorModulo)) {
    lines.push(filaResumen(`📱 ${mod}`, rows, DIR_MOVIL));
  }
} else {
  lines.push(filaResumen('📱 Móvil (todos los módulos)', [], null));
}

// Web cross-ref por módulo
const webPorModulo = contarPorModulo(veredictoWeb, 'modulo');
if (DIR_WEB) {
  for (const [mod, rows] of Object.entries(webPorModulo)) {
    lines.push(filaResumen(`🌐 web:${mod}`, rows, DIR_WEB));
  }
} else {
  lines.push(filaResumen('🌐 Web cross-ref (todos los módulos)', [], null));
}

// Web extendido por bloque
const extPorBloque = contarPorModulo(veredictoExt, 'bloque');
const BLOQUE_LABEL = {
  rep: 'Reportes (B1)', ind: 'Indicadores (B2)', fac: 'Facturaciones (B3)',
  mae: 'Datos Maestros (B4)', vis: 'Visitas (B5)', est: 'Estructura Comercial (B6)', cfg: 'Configuración (B7)',
};
if (DIR_EXT) {
  for (const [bloque, rows] of Object.entries(extPorBloque)) {
    lines.push(filaResumen(`📊 ${BLOQUE_LABEL[bloque] || bloque}`, rows, DIR_EXT));
  }
} else {
  lines.push(filaResumen('📊 Web Extendido (todos los bloques)', [], null));
}

lines.push('');

// ── FAILs ─────────────────────────────────────────────────────────────────────
const todosLosFails = totalAll.filter(v => v.resultado === 'FAIL');
lines.push('## FAILs');
lines.push('');
if (todosLosFails.length === 0) {
  lines.push('_Ningún fallo detectado._');
} else {
  lines.push('| ID | Runner | Descripción | Nota |');
  lines.push('|----|--------|-------------|------|');
  for (const v of todosLosFails) {
    const runner = v.runner || '?';
    const nota   = (v.nota || '').replace(/\|/g, '·').substring(0, 120);
    lines.push(`| **${v.id}** | ${runner} | ${v.descripcion || ''} | ${nota} |`);
  }
}
lines.push('');

// ── BLOCKEDs ──────────────────────────────────────────────────────────────────
const todosLosBlocked = totalAll.filter(v => v.resultado === 'BLOCKED');
if (todosLosBlocked.length > 0) {
  lines.push('## BLOCKEDs');
  lines.push('');
  lines.push('| ID | Runner | Nota |');
  lines.push('|----|--------|------|');
  for (const v of todosLosBlocked) {
    const nota = (v.nota || '').replace(/\|/g, '·').substring(0, 120);
    lines.push(`| **${v.id}** | ${v.runner || '?'} | ${nota} |`);
  }
  lines.push('');
}

// ── Links a reportes individuales ─────────────────────────────────────────────
lines.push('## Reportes individuales');
lines.push('');

if (DIR_MOVIL) {
  lines.push(`### 📱 Móvil — \`${path.basename(DIR_MOVIL)}\``);
  const mds = fs.readdirSync(DIR_MOVIL).filter(f => f.endsWith('.md')).sort();
  for (const f of mds) lines.push(`- [${f}](./${path.basename(DIR_MOVIL)}/${f})`);
  lines.push('');
}

if (DIR_WEB) {
  lines.push(`### 🌐 Web cross-ref — \`${path.basename(DIR_WEB)}\``);
  const mds = fs.readdirSync(DIR_WEB).filter(f => f.endsWith('.md')).sort();
  for (const f of mds) lines.push(`- [${f}](./${path.basename(DIR_WEB)}/${f})`);
  lines.push('');
}

if (DIR_EXT) {
  lines.push(`### 📊 Web Extendido — \`${path.basename(DIR_EXT)}\``);
  const mds = fs.readdirSync(DIR_EXT).filter(f => f.endsWith('.md')).sort();
  for (const f of mds) lines.push(`- [${f}](./${path.basename(DIR_EXT)}/${f})`);
  lines.push('');
}

lines.push('---');
lines.push(`_Generado por consolidar.js · ${fechaStr} ${horaStr}_`);

// ── Escribir archivo ──────────────────────────────────────────────────────────
const now2 = new Date();
const ts = `${now2.getFullYear()}${pad(now2.getMonth()+1)}${pad(now2.getDate())}_${pad(now2.getHours())}${pad(now2.getMinutes())}${pad(now2.getSeconds())}`;
const OUT_DIR  = path.join(REPORTS_DIR, `consolidado_${QA_CLIENTE}_${ts}`);
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = path.join(OUT_DIR, 'consolidado.md');
fs.writeFileSync(OUT_FILE, lines.join('\n') + '\n');

// ── Consola ───────────────────────────────────────────────────────────────────
console.log(`\n╔══════════════════════════════════════════════╗`);
console.log(`║  CONSOLIDADO · ${QA_CLIENTE.padEnd(29)}║`);
console.log(`╚══════════════════════════════════════════════╝`);
console.log(`  PASS:${cTotal.PASS||0}  FAIL:${cTotal.FAIL||0}  N/A:${cTotal['N/A']||0}  BLOCKED:${cTotal.BLOCKED||0}  total:${totalAll.length}`);
console.log(`  Móvil:    ${DIR_MOVIL  ? path.basename(DIR_MOVIL)  : '(no ejecutado)'}`);
console.log(`  Web:      ${DIR_WEB    ? path.basename(DIR_WEB)    : '(no ejecutado)'}`);
console.log(`  Extendido:${DIR_EXT    ? path.basename(DIR_EXT)    : '(no ejecutado)'}`);
if (todosLosFails.length) {
  console.log(`\n  FAILs (${todosLosFails.length}):`);
  for (const v of todosLosFails) console.log(`    ❌ ${v.id} — ${v.descripcion || ''}`);
}
console.log(`\n  → ${OUT_FILE}\n`);
