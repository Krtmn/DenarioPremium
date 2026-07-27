// Self-test node del motor record→replay (lógica pura + runReplay con pg mockeado).
// Corre SIN dispositivo:  node automation/replay/replay-engine.test.js
const { substitute, validateTrace, runReplay } = require("./replay-engine");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log("  FAIL:", msg); } };

// ── 1. validateTrace ──
ok(validateTrace({ ops: [{ case: "A" }, { op: "helper", name: "x", args: [1] }, { op: "assert", desc: "d", code: "() => true" }] }).length === 0, "traza válida → 0 errores");
ok(validateTrace({ ops: [{ op: "helper" }, { op: "weird" }] }).length === 2, "detecta helper-sin-name + tipo-desconocido");
ok(validateTrace({}).length >= 1, "detecta falta de ops[]");

// ── 2. substitute ──
const ops = [
  { op: "helper", name: "fill", args: ["sel", "TORNICAGUA, C.A."] },
  { op: "eval", code: "() => document.querySelector('[data=\"00037192\"]')" },
  { op: "assert", desc: "x", code: "() => true" },
];
const recData = { cliente_test: "TORNICAGUA, C.A.", documento_retencion: "00037192" };
ok(JSON.stringify(substitute(ops, recData, recData)) === JSON.stringify(ops), "verbatim (mismo cliente) → sin cambios");
const sub = substitute(ops, recData, { cliente_test: "GRUPO GRAVEN, C.A", documento_retencion: "00099999" });
ok(sub[0].args[1] === "GRUPO GRAVEN, C.A", "sustituye cliente en args de helper");
ok(sub[1].code.includes("00099999") && !sub[1].code.includes("00037192"), "sustituye documento en code de eval");
ok(ops[0].args[1] === "TORNICAGUA, C.A.", "no muta la traza original");

// ── 3. runReplay con pg mockeado ──
(async () => {
  const calls = [];
  const mockPg = { evaluate: async (arg) => (typeof arg === "string" ? !/FALSO/.test(arg) : undefined) };
  const helpers = {
    openNuevoCobro: async (pg, tipo) => calls.push("openNuevoCobro:" + tipo),
    fill: async (pg, sel, val) => calls.push("fill:" + val),
  };

  const traceOK = { data: {}, ops: [
    { case: "C1" }, { op: "helper", name: "openNuevoCobro", args: [0] }, { op: "assert", desc: "ok", code: "() => true" },
    { case: "C2" }, { op: "helper", name: "fill", args: ["s", "v"] },
  ] };
  const r1 = await runReplay(mockPg, traceOK, {}, helpers);
  ok(r1.divergedAt === -1, "replay feliz → divergedAt=-1");
  ok(r1.verdicts.length === 2 && r1.verdicts.every((v) => v.resultado === "PASS"), "replay feliz → 2 casos PASS");
  ok(calls.join(",") === "openNuevoCobro:0,fill:v", "replay feliz → helpers ejecutados en orden");

  const r2 = await runReplay(mockPg, { data: {}, ops: [{ case: "C1" }, { op: "assert", desc: "FALSO", code: "() => FALSO" }] }, {}, helpers);
  ok(r2.divergedAt === 1 && /assert/.test(r2.reason), "divergencia por assert fallido → detectada + posición");

  const r3 = await runReplay(mockPg, { data: {}, ops: [{ case: "C1" }, { op: "helper", name: "noExiste", args: [] }] }, {}, helpers);
  ok(r3.divergedAt === 1 && /ausente/.test(r3.reason), "divergencia por helper ausente → detectada");

  // sustitución integrada en replay: verbatim distinto de parametrizado
  const r4calls = [];
  const h2 = { fill: async (pg, sel, val) => r4calls.push(val) };
  const traceData = { data: { cli: "VIEJO" }, ops: [{ case: "C1" }, { op: "helper", name: "fill", args: ["s", "VIEJO"] }] };
  await runReplay(mockPg, traceData, { cli: "NUEVO" }, h2);
  ok(r4calls[0] === "NUEVO", "runReplay aplica parametrización (VIEJO→NUEVO) al ejecutar el helper");

  console.log(`\n=== replay-engine self-test: ${pass} OK, ${fail} FAIL ===`);
  process.exit(fail ? 1 : 0);
})();
