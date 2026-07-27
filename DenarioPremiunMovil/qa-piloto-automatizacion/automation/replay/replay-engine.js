/**
 * replay-engine.js — Motor RECORD → REPLAY determinista (Ola 2). Ver README.md.
 *
 * Se INLINA en `browser_run_code_unsafe` (contexto Node-MCP con `pg` = página WebView por CDP).
 * Las funciones PURAS (substitute, validateTrace) también se require-an desde node para self-test.
 *
 * MODO RECORD (1ª corrida en un build/cliente): el agente instala el grabador y envuelve sus ops:
 *   const eng = await installRecorder(pg);
 *   await eng.recCase('DM-COB-002');
 *   await eng.W('openNuevoCobro', h.openNuevoCobro, pg, 0);          // llama Y graba {name:'openNuevoCobro', args:[0]}
 *   await eng.recAssert('5 tabs', "() => document.querySelectorAll('app-cobro ion-segment-button').length>=5");
 *   await eng.recEval("() => { ...accion DOM a medida... }", 'select-client');
 *   ... al cierre del módulo:  const trace = await dumpTrace(pg);   // volcar a {RUN_DIR}/_trace/{modulo}.trace.json
 *
 * MODO REPLAY (corridas siguientes): un runner liviano reproduce la traza op-por-op:
 *   const { verdicts, divergedAt, op } = await runReplay(pg, trace, newData, helpers);
 *   // divergedAt === -1 → todo reprodujo OK. Si >=0 → escalá ESE paso (op) al modelo y re-grabá el tramo.
 */

// ── Parametrización (PURA · node-testable): sustituye los valores run-específicos de la traza ──
// Reemplaza cada valor de trace.data por el de newData (mismo campo), en args de helpers y en código.
// Ordena por longitud desc para no romper con sub-cadenas. Verbatim (mismo cliente) → newData = trace.data → no-op.
function substitute(ops, recordedData, newData) {
  if (!recordedData || !newData) return ops.map((o) => JSON.parse(JSON.stringify(o)));
  const pairs = [];
  for (const k of Object.keys(recordedData)) {
    const oldV = recordedData[k], newV = newData[k];
    if (newV != null && oldV != null && String(oldV).length && String(oldV) !== String(newV)) pairs.push([String(oldV), String(newV)]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);
  const sub = (s) => { let r = s; for (const [o, n] of pairs) r = r.split(o).join(n); return r; };
  return ops.map((op) => {
    const c = JSON.parse(JSON.stringify(op));
    if (Array.isArray(c.args)) c.args = c.args.map((a) => (typeof a === 'string' ? sub(a) : a));
    if (typeof c.code === 'string') c.code = sub(c.code);
    return c;
  });
}

// ── Validación estructural de una traza (PURA · node-testable) ──
function validateTrace(trace) {
  const errs = [];
  if (!trace || typeof trace !== 'object') return ['la traza no es un objeto'];
  if (!Array.isArray(trace.ops)) { errs.push('falta ops[]'); return errs; }
  trace.ops.forEach((op, i) => {
    if (op.case != null) return;
    if (op.op === 'helper') { if (!op.name) errs.push(`op[${i}] helper sin name`); if (op.args && !Array.isArray(op.args)) errs.push(`op[${i}] args no es array`); }
    else if (op.op === 'eval') { if (typeof op.code !== 'string') errs.push(`op[${i}] eval sin code`); }
    else if (op.op === 'assert') { if (typeof op.code !== 'string') errs.push(`op[${i}] assert sin code`); }
    else errs.push(`op[${i}] tipo desconocido: ${op.op}`);
  });
  return errs;
}

// ── RECORD (requiere pg) ──────────────────────────────────────────────────────
async function installRecorder(pg) {
  await pg.evaluate(() => { window.__qaTrace = []; });
  const push = async (o) => { try { await pg.evaluate((x) => { (window.__qaTrace = window.__qaTrace || []).push(x); }, o); } catch (e) { /* nunca romper la corrida por grabar */ } };
  const runCode = (code) => pg.evaluate('(' + String(code) + ')()');   // corre el arrow en el WebView
  return {
    recCase: (id) => push({ case: id }),
    // W('nombre', helperFn, pg, ...args) → graba {name, args} (los args DESPUÉS de pg) y ejecuta helperFn(pg, ...args)
    W: async (name, fn, pgArg, ...args) => { await push({ op: 'helper', name, args }); return fn(pgArg, ...args); },
    recEval: async (code, tag) => { const r = await runCode(code); await push({ op: 'eval', code: String(code), tag }); return r; },
    recAssert: async (desc, code) => { const ok = await runCode(code); await push({ op: 'assert', desc, code: String(code) }); return ok; },
  };
}
async function dumpTrace(pg) { return pg.evaluate(() => window.__qaTrace || []); }

// ── REPLAY (requiere pg + helpers = objeto {nombre: fn(pg,...args)}) ───────────
async function runReplay(pg, trace, newData, helpers) {
  const ops = substitute(trace.ops || [], trace.data, newData);
  const runCode = (code) => pg.evaluate('(' + String(code) + ')()');
  const verdicts = [];
  let curCase = null, caseOk = true, caseEv = [];
  const flush = () => { if (curCase) verdicts.push({ caso: curCase, resultado: caseOk ? 'PASS' : 'DIVERGE', evidencia: caseEv.join(' · ') }); };
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.case != null) { flush(); curCase = op.case; caseOk = true; caseEv = []; continue; }
    try {
      if (op.op === 'helper') {
        const fn = helpers[op.name];
        if (typeof fn !== 'function') { caseOk = false; caseEv.push(`helper '${op.name}' ausente`); flush(); return { verdicts, divergedAt: i, op, reason: 'helper-ausente:' + op.name, caso: curCase }; }
        await fn(pg, ...(op.args || []));
      } else if (op.op === 'eval') {
        await runCode(op.code);
      } else if (op.op === 'assert') {
        const ok = await runCode(op.code);
        if (!ok) { caseOk = false; caseEv.push(`assert falló: ${op.desc}`); flush(); return { verdicts, divergedAt: i, op, reason: 'assert:' + op.desc, caso: curCase }; }
        caseEv.push(`✓ ${op.desc}`);
      }
    } catch (e) {
      caseOk = false; caseEv.push('excepción: ' + (e && e.message)); flush();
      return { verdicts, divergedAt: i, op, reason: 'exception:' + (e && e.message), caso: curCase };
    }
  }
  flush();
  return { verdicts, divergedAt: -1 };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { substitute, validateTrace, installRecorder, dumpTrace, runReplay };
}
