// aggregate.js — Agrega los ledgers `_results.jsonl` de todas las corridas y emite tendencia.
// Uso:  node automation/reports/aggregate.js [--cliente <slug>] [--modulo <nombre>]
//
// Lee cada automation/reports/*/_results.jsonl (1 línea JSON por caso), y reporta:
//   - por caso:   nº de corridas, % PASS, flakiness (casos que alternan PASS/FAIL/BLOCKED), ms promedio
//   - por módulo: ms promedio por corrida, conteo de resultados, tasa de BLOCKED (salud de automatización)
// Es solo-lectura; no toca corridas. Sin dependencias externas.
//
// El objetivo: medir si las mejoras (split selectores, pre-vuelo, bundle) bajan tiempo/tokens
// y detectar regresión del propio suite (un caso que empieza a fallar/bloquearse intermitentemente).

const fs = require("fs");
const path = require("path");

const REPORTS_DIR = __dirname;
const args = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const fCliente = getArg("--cliente");
const fModulo = getArg("--modulo");

// ── Recolectar todas las líneas de ledger ──
function runDirs() {
  return fs.readdirSync(REPORTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => !fCliente || n.includes(`_${fCliente}_`));
}

const rows = [];
for (const dir of runDirs()) {
  const ledger = path.join(REPORTS_DIR, dir, "_results.jsonl");
  if (!fs.existsSync(ledger)) continue;
  const lines = fs.readFileSync(ledger, "utf8").split(/\r?\n/).filter((l) => l.trim());
  for (const l of lines) {
    try {
      const r = JSON.parse(l);
      if (fModulo && r.modulo !== fModulo) continue;
      r._run = dir;
      rows.push(r);
    } catch (e) { /* línea malformada → ignorar */ }
  }
}

if (!rows.length) {
  console.log("Sin datos: no se encontraron líneas en _results.jsonl. " +
    "(¿Las corridas ya escriben el ledger? Ver RUNTIME §6.)");
  process.exit(0);
}

// ── Por caso: flakiness ──
const porCaso = new Map();
for (const r of rows) {
  const k = r.caso;
  if (!porCaso.has(k)) porCaso.set(k, { modulo: r.modulo, resultados: [], ms: [] });
  const c = porCaso.get(k);
  c.resultados.push(r.resultado);
  if (typeof r.ms === "number") c.ms.push(r.ms);
}

const flaky = [];
for (const [caso, c] of porCaso) {
  const set = new Set(c.resultados.filter((x) => x !== "N-A" && x !== "SKIP"));
  const pass = c.resultados.filter((x) => x === "PASS").length;
  const total = c.resultados.length;
  const esFlaky = set.size > 1; // alterna entre PASS y algo no-OK
  if (esFlaky) {
    flaky.push({
      caso, modulo: c.modulo, corridas: total,
      pct_pass: Math.round((pass / total) * 100),
      patron: c.resultados.join(" "),
    });
  }
}

// ── Por módulo: salud ──
const porModulo = new Map();
for (const r of rows) {
  const k = r.modulo;
  if (!porModulo.has(k)) porModulo.set(k, { res: {}, ms: 0, n: 0 });
  const m = porModulo.get(k);
  m.res[r.resultado] = (m.res[r.resultado] || 0) + 1;
  if (typeof r.ms === "number") { m.ms += r.ms; m.n++; }
}

// ── Salida ──
console.log("=== Tendencia por módulo (todas las corridas" +
  (fCliente ? ` · cliente=${fCliente}` : "") + ") ===\n");
for (const [mod, m] of porModulo) {
  const total = Object.values(m.res).reduce((a, b) => a + b, 0);
  const blk = m.res.BLOCKED || 0;
  const fail = m.res.FAIL || 0;
  const avgMs = m.n ? Math.round(m.ms / m.n) : "—";
  console.log(`${mod.padEnd(14)} casos=${String(total).padStart(4)}  ` +
    `FAIL=${fail}  BLOCKED=${blk}  ms/caso≈${avgMs}` +
    (blk > 0 ? `  ⚠ ${Math.round((blk / total) * 100)}% bloqueado (salud automatización)` : ""));
}

console.log("\n=== Casos flaky (alternan PASS / no-OK entre corridas) ===\n");
if (!flaky.length) {
  console.log("Ninguno — el suite es estable en los casos con >1 corrida. ✅");
} else {
  flaky.sort((a, b) => a.pct_pass - b.pct_pass);
  for (const f of flaky) {
    console.log(`${f.caso.padEnd(14)} [${f.modulo}]  ${f.pct_pass}% PASS en ${f.corridas} corridas  →  ${f.patron}`);
  }
}

console.log(`\nTotal: ${rows.length} casos en ${runDirs().filter((d) => fs.existsSync(path.join(REPORTS_DIR, d, "_results.jsonl"))).length} corridas con ledger.`);
