// cotejo-bd.js — Motor de cotejo campo-a-campo "lo enviado == lo guardado".
// Uso:  node automation/db/cotejo-bd.js <cliente> <modulo> <co_x>
//
// Trae el REGISTRO COMPLETO (cabecera + líneas hijas) de la BD LOCAL del teléfono
// (lo que se envió) y de la NUBE (lo que se guardó), y los compara campo por campo.
//
// REGLA DE COMPARACIÓN (validada con QA, 2026-06-17):
//  - LOCAL-DRIVEN: se comparan los campos que tienen valor en LOCAL (lo que la app mandó).
//      · lleno en local + llega igual a nube      → OK
//      · lleno en local + falta/distinto en nube  → MISMATCH (se reporta)
//      · vacío en local (no se llenó)             → se saltea (no importa)
//  - Campos del SERVIDOR (no del usuario) se excluyen siempre (lista `ignore`):
//      PK del server, timestamps, flags de sync, montos recalculados.
//  - Campos con NOMBRE distinto entre local y nube se mapean (`fieldMap`).
//
// Reusa los lectores read-only existentes (shell-out) → mantiene candados y DSN por cliente.
// Salida JSON: { marca, header:[...], children:[...], resumen }. Nunca rompe la corrida.

const { execFileSync } = require("child_process");
const path = require("path");

const DIR = __dirname;
const cliente = process.argv[2];
const modulo = process.argv[3];
const coX = process.argv[4];

// ---------------------------------------------------------------------------
// CONFIG POR MÓDULO (arranca con devoluciones; extender agregando entradas)
// ---------------------------------------------------------------------------
const MODULES = {
  devoluciones: {
    key: "co_return",                       // clave estable de cruce local↔nube
    cloudHeader: '"return"', localHeader: "returns",
    cloudChild: "return_detail", localChild: "return_details",
    childMatch: ["co_product", "co_document", "nu_lote"], // clave natural para emparejar líneas
    // local → nube (mismo dato, distinto nombre de columna)
    fieldMap: { tx_comment: "tx_description" },
    // campos del SERVIDOR / sync → excluir aunque tengan valor
    ignore: ["id_return", "da_created", "da_update", "co_operation", "st_delivery", "st_return"],
    childFieldMap: {},
    childIgnore: ["id_return", "co_return_detail", "co_detail", "da_update", "co_operation"],
  },
  // pedidos: { ... }  · cobros: { ... }  · etc. (se agregan tras validar el piloto)
};

function fail(msg) { console.log(JSON.stringify({ marca: "BD-N/A", motivo: msg }, null, 2)); process.exit(0); }

if (!cliente || !modulo || !coX) fail("uso: node cotejo-bd.js <cliente> <modulo> <co_x>");
const cfg = MODULES[modulo];
if (!cfg) fail(`módulo '${modulo}' sin config en cotejo-bd.js (módulos: ${Object.keys(MODULES).join(", ")})`);

// ---------------------------------------------------------------------------
// Lectores (shell-out a los scripts ya probados)
// ---------------------------------------------------------------------------
function readJson(out, origen) {
  const t = (out || "").trim();
  if (t.startsWith("ERR:")) throw new Error(`${origen}: ${t}`);
  try { return JSON.parse(t); } catch (e) { throw new Error(`${origen}: salida no-JSON (${t.slice(0, 80)})`); }
}
function cloud(sql) {
  const out = execFileSync("node", [path.join(DIR, "query.js"), cliente, sql], { encoding: "utf8", timeout: 40000 });
  return readJson(out, "nube");
}
function local(sql) {
  const out = execFileSync("node", [path.join(DIR, "local-query.js"), sql], { encoding: "utf8", timeout: 40000 });
  return readJson(out, "local");
}

// ---------------------------------------------------------------------------
// Normalización y comparación
// ---------------------------------------------------------------------------
const norm = (v) => (v === null || v === undefined) ? "" : String(v).trim();
const isEmpty = (v) => norm(v) === "";
const isNum = (s) => s !== "" && !isNaN(Number(s));
const looksDate = (s) => /^\d{4}-\d{2}-\d{2}/.test(s);

function equal(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb) return true;
  if (isNum(na) && isNum(nb)) return Math.abs(Number(na) - Number(nb)) < 0.01;  // "5.7300"==5.73; tolerancia 1 céntimo (evita MISMATCH falso por redondeo nube↔local)
  if (looksDate(na) && looksDate(nb)) return na.slice(0, 10) === nb.slice(0, 10); // misma fecha
  return false;
}

// Compara una fila local contra una de nube según la regla local-driven.
function compareRow(localRow, cloudRow, fieldMap, ignore, keyCol) {
  const results = [];
  for (const col of Object.keys(localRow)) {
    if (col === keyCol) continue;
    const cloudCol = fieldMap[col] || col;
    if (ignore.includes(col) || ignore.includes(cloudCol)) continue;
    const lv = localRow[col];
    if (isEmpty(lv)) continue;                          // no se llenó → no importa
    if (!cloudRow || !(cloudCol in cloudRow)) continue; // sin contraparte en nube (columna local-only)
    const cv = cloudRow[cloudCol];
    const na = norm(lv), nb = norm(cv);
    let ok, nota;
    if (looksDate(na) && looksDate(nb)) {
      ok = na.slice(0, 10) === nb.slice(0, 10);         // veredicto por FECHA (día)
      if (ok && na !== nb) nota = "hora difiere (posible zona horaria)"; // se REPORTA, no es mismatch
    } else {
      ok = equal(lv, cv);
    }
    const r = { campo: cloudCol, local: na, nube: nb, ok };
    if (nota) r.nota = nota;
    results.push(r);
  }
  return results;
}

function childKeyOf(row, keys) { return keys.map((k) => norm(row[k])).join("∙"); }

// ---------------------------------------------------------------------------
// Cotejo
// ---------------------------------------------------------------------------
(function run() {
  let lHead, cHead, lKids, cKids;
  try {
    lHead = local(`SELECT * FROM ${cfg.localHeader} WHERE ${cfg.key}='${coX}'`);
    cHead = cloud(`SELECT * FROM ${cfg.cloudHeader} WHERE ${cfg.key}='${coX}'`);
    lKids = local(`SELECT * FROM ${cfg.localChild} WHERE ${cfg.key}='${coX}'`);
    cKids = cloud(`SELECT * FROM ${cfg.cloudChild} WHERE ${cfg.key}='${coX}'`);
  } catch (e) {
    fail(e.message); // BD inaccesible → BD-N/A, no rompe
  }

  const localRow = lHead[0], cloudRow = cHead[0];
  if (!localRow) fail(`no existe ${cfg.localHeader}.${cfg.key}='${coX}' en local (¿co_x correcto?)`);

  // Sin fila en nube → no llegó (guardado sin enviar / atascado)
  if (!cloudRow) {
    console.log(JSON.stringify({
      marca: "BD-SAVED", co_x: coX, modulo,
      motivo: "registro en local pero NO en la nube (no llegó / sin enviar)",
      header: [], children: []
    }, null, 2));
    return;
  }

  // Cabecera
  const header = compareRow(localRow, cloudRow, cfg.fieldMap, cfg.ignore, cfg.key);

  // Líneas hijas: emparejar por clave natural
  const cMap = new Map();
  for (const r of cKids) cMap.set(childKeyOf(r, cfg.childMatch), r);
  const children = [];
  for (const lr of lKids) {
    const k = childKeyOf(lr, cfg.childMatch);
    const cr = cMap.get(k);
    if (!cr) { children.push({ linea: k, ok: false, motivo: "línea en local sin contraparte en nube" }); continue; }
    cMap.delete(k);
    const fields = compareRow(lr, cr, cfg.childFieldMap, cfg.childIgnore, cfg.key);
    children.push({ linea: k, ok: fields.every((f) => f.ok), campos: fields });
  }
  for (const [k] of cMap) children.push({ linea: k, ok: true, nota: "línea en nube sin contraparte en local (¿creada en otra sesión?)" });

  // Veredicto
  const headerOk = header.every((f) => f.ok);
  const childrenOk = children.every((c) => c.ok);
  const marca = (headerOk && childrenOk) ? "BD-FIELD-OK" : "BD-FIELD-MISMATCH";
  const mismatches = [
    ...header.filter((f) => !f.ok).map((f) => `${f.campo}: local='${f.local}' vs nube='${f.nube}'`),
    ...children.filter((c) => !c.ok).map((c) => `línea ${c.linea}: ${c.motivo || (c.campos || []).filter((x) => !x.ok).map((x) => x.campo).join(",")}`),
  ];
  const notas = [
    ...header.filter((f) => f.nota).map((f) => `${f.campo}: ${f.nota} (local='${f.local}' vs nube='${f.nube}')`),
    ...children.flatMap((c) => (c.campos || []).filter((f) => f.nota).map((f) => `línea ${c.linea} ${f.campo}: ${f.nota} (local='${f.local}' vs nube='${f.nube}')`)),
  ];

  console.log(JSON.stringify({
    marca, co_x: coX, modulo,
    resumen: {
      campos_cabecera_verificados: header.length,
      lineas_local: lKids.length, lineas_nube: cKids.length,
      mismatches, notas
    },
    header, children
  }, null, 2));
})();
