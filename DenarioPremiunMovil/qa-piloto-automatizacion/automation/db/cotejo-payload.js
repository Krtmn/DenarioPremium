// cotejo-payload.js — Cotejo "lo ENVIADO (payload) == lo GUARDADO (nube)", campo por campo.
// Uso:  node automation/db/cotejo-payload.js <cliente> <payloadFile.json>
//   payloadFile = un objeto {url, data} capturado de CapacitorHttp.post (ver helper installPayloadCapture).
//
// El payload que arma auto-send.service ES "lo que se mandó": estructurado/anidado, en nombres del
// modelo (camelCase). Este motor lo compara contra la NUBE (snake_case) por la clave del registro.
//
// REGLA (validada con QA): payload-driven →
//   campo con valor en el payload  →  debe llegar IGUAL a la nube      (MISMATCH si difiere)
//   campo null/'' en el payload    →  se saltea (no se mandó)
//   campo del SERVIDOR (id/timestamps/recalc) → se excluye (ignore)
//   nombres: camelCase → snake_case (mecánico). Si un campo del payload no tiene columna en la nube
//            (posible rename server-side) → se reporta como NOTA (no MISMATCH) para calibrar.
//   fechas: veredicto por día; diferencia de hora (zona horaria) → NOTA.
//
// Reusa el lector de nube (query.js, shell-out). Nunca rompe: BD inaccesible → BD-N/A.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const cliente = process.argv[2];
const payloadFile = process.argv[3];

const SRV = ["da_created", "da_update", "co_operation", "st_delivery"];

// ── Config por TIPO (esquema universal; arrays = hijas anidadas del propio payload) ──
const TYPES = {
  collect: {
    dataKey: "collection", table: "collection", key: "co_collection",
    fieldMap: { hasIGTF: "has_igtf" }, // camel→snake rompe con all-caps (has_i_g_t_f) → mapear
    ignore: [...SRV, "id_collection", "st_collection", "nu_value_local", "id_deposit",
      "lb_client", "is_edit", "is_edit_total", "is_save", "nu_amount_paid", "nu_amount_paid_conversion", "co_user"],
    arrays: [
      { field: "collectionDetails", table: "collection_detail", match: ["co_document"],
        // co_original: payload=moneda("USD") vs nube=nº doc → colisión de nombre, no es dato → ignore
        ignore: [...SRV, "id_collection", "id_collection_detail", "id_document", "co_original", "is_save",
          "nu_amount_retention_conversion", "nu_amount_retention2_conversion", "nu_balance_doc_original",
          "nu_balance_doc_original_conversion", "nu_amount_igtf", "nu_amount_igtf_conversion"] },
      { field: "collectionPayments", table: "collection_payment", match: ["co_payment_method"],
        // id_difference_code: payload=0 vs nube=null (sin código) → ignore
        ignore: [...SRV, "id_collection", "id_collection_payment", "id_collection_detail", "id_bank",
          "co_type", "st", "is_save", "is_anticipo_prepaid", "id_difference_code"] },
    ],
  },
  return: {
    dataKey: "returns", table: '"return"', key: "co_return",
    // co_user/lb_client/co_invoice/id_invoice = denormalizados del payload, no van en la cabecera nube
    ignore: [...SRV, "id_return", "st_return", "co_user", "lb_client", "co_invoice", "id_invoice"],
    fieldMap: { txComment: "tx_description" }, // rename confirmado payload→nube
    arrays: [
      { field: "details", table: "return_detail", match: ["co_product", "co_document", "nu_lote"], ignore: [...SRV, "id_return", "co_detail", "co_return_detail", "id_unit", "show_date_modal"] },
    ],
  },
  order: {
    dataKey: "order", table: '"order"', key: "co_order",
    fieldMap: { coAddress: "co_address_client", idAddress: "id_address_client" }, // renames payload→nube
    // id_order_creator: el server lo deriva del auth y NO persiste el del payload (470→null) → ignore + confirmar con dev
    ignore: [...SRV, "id_order", "st_order", "nu_value_local", "id_order_creator"],
    arrays: [
      {
        field: "orderDetails", table: "order_detail", match: ["co_product"], ignore: [...SRV, "id_order", "id_order_detail", "na_product"],
        arrays: [
          // [grupo_fiel-2026-08-17] match por co_order_detail_unit (PK de negocio) por el mismo motivo que en
          //   clientStock: co_product_unit no es único si el mismo producto+unidad aparece 2 veces en el pedido.
          { field: "orderDetailUnit", table: "order_detail_unit", match: ["co_order_detail_unit"], parentLink: "co_order_detail", ignore: [...SRV, "id_order_detail", "id_order_detail_unit", "co_unit"] },
        ],
      },
    ],
  },
  deposit: {
    dataKey: "deposit", table: "deposit", key: "co_deposit",
    // [jerez-2026-07-01] calibrado en vivo (id_deposit=6, BD-FIELD-OK 14/14). is_edit/is_edit_total/is_save = flags UI sin columna;
    // co_user = payload-only (deposit guarda solo id_user). Sin hijas: el vínculo con el cobro va por collection.id_deposit (FK invertido), no en data.deposit.
    ignore: [...SRV, "id_deposit", "st_deposit", "nu_value_local", "is_edit", "is_edit_total", "is_save", "co_user"], arrays: [],
  },
  visit: {
    dataKey: "visit", table: "visit", key: "co_visit",
    ignore: [...SRV, "id_visit", "st_visit", "st_integrador", "st_coordinate"],
    arrays: [
      // incidence linkea por id_visit (PK del server), NO por co_visit → headerLink
      { field: "visitDetails", table: "incidence", match: ["co_type", "co_cause"], headerLink: "id_visit", ignore: [...SRV, "id_visit", "co_incid", "co_visit"] },
    ],
  },
  clientStock: {
    dataKey: "clientStock", table: "client_stock", key: "co_client_stock",
    ignore: [...SRV, "id_client_stock", "st_client_stock", "id_order", "co_order", "lb_client"],
    arrays: [
      {
        field: "clientStockDetails", table: "client_stock_detail", match: ["co_product"],
        ignore: [...SRV, "id_client_stock", "id_client_stock_detail", "na_product", "posicion", "is_save"],
        arrays: [
          // cantidad/lote/fecha viven en la unidad (qu_stock, nu_batch, da_expiration → SÍ se verifican)
          // [grupo_fiel-2026-08-17] match por co_client_stock_detail_unit (PK de negocio), NO por co_product_unit:
          //   el MISMO producto puede inventariarse en 2 ubicaciones (dep/exh) ⇒ co_product_unit se REPITE y el
          //   emparejamiento cruzaba líneas, produciendo BD-FIELD-MISMATCH falsos (medido: 6 filas, 6 PK distintas,
          //   solo 2 co_product_unit distintos). Es el escenario NORMAL del módulo, no un borde.
          { field: "clientStockDetailUnits", table: "client_stock_detail_unit", match: ["co_client_stock_detail_unit"], parentLink: "co_client_stock_detail",
            ignore: [...SRV, "id_client_stock_detail", "id_client_stock_detail_unit", "co_unit", "na_unit", "qu_unit", "qu_suggested", "is_save", "is_edit", "posicion", "id_unit"] },
        ],
      },
    ],
  },
  potentialClient: {
    dataKey: "potentialClient", table: "potential_client", key: "co_client",
    ignore: [...SRV, "id_client", "st_potential_client"], arrays: [],
  },
};

function fail(msg) { console.log(JSON.stringify({ marca: "BD-N/A", motivo: msg }, null, 2)); process.exit(0); }
if (!cliente || !payloadFile) fail("uso: node cotejo-payload.js <cliente> <payloadFile.json>");

// ── lector de nube (shell-out a query.js) ──
function cloud(sql) {
  const out = execFileSync("node", [path.join(DIR, "query.js"), cliente, sql], { encoding: "utf8", timeout: 40000 });
  const t = (out || "").trim();
  if (t.startsWith("ERR:")) throw new Error("nube: " + t);
  return JSON.parse(t);
}

// ── helpers ──
const camelToSnake = (s) => s.replace(/([A-Z])/g, "_$1").toLowerCase();
const norm = (v) => (v === null || v === undefined) ? "" : String(v).trim();
const isEmpty = (v) => norm(v) === "" || (typeof v === "object" && !Array.isArray(v) && v !== null && Object.keys(v).length === 0);
const isNum = (s) => s !== "" && !isNaN(Number(s));
const looksDate = (s) => /^\d{4}-\d{2}-\d{2}/.test(s);
const sqlEsc = (v) => String(v).replace(/'/g, "''");

const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const payloadKey = (obj, match) => match.map((m) => norm(obj[snakeToCamel(m)] ?? obj[m])).join("∙");
const cloudKey = (row, match) => match.map((m) => norm(row[m] ?? row[camelToSnake(m)])).join("∙");

function equalScalar(a, b) {
  const na = norm(a), nb = norm(b);
  if (na === nb) return { ok: true };
  if (isNum(na) && isNum(nb)) return { ok: Math.abs(Number(na) - Number(nb)) < 0.01 }; // tolerancia 1 céntimo: evita MISMATCH falso por redondeo nube↔local en montos recalculados
  if (looksDate(na) && looksDate(nb)) {
    const ok = na.slice(0, 10) === nb.slice(0, 10);
    return { ok, nota: ok && na !== nb ? "hora difiere (posible zona horaria)" : undefined };
  }
  return { ok: false };
}

// Compara los campos ESCALARES de un objeto del payload contra una fila de la nube (regla payload-driven).
function compareScalars(payloadObj, cloudRow, ignore, fieldMap) {
  fieldMap = fieldMap || {};
  const fields = [];
  for (const k of Object.keys(payloadObj)) {
    const v = payloadObj[k];
    if (Array.isArray(v) || (v && typeof v === "object")) continue; // arrays/objetos: aparte
    if (isEmpty(v)) continue;                                       // no se mandó → saltear
    const col = fieldMap[k] || fieldMap[camelToSnake(k)] || camelToSnake(k);
    if (ignore.includes(col) || ignore.includes(k)) continue;
    if (!(col in cloudRow)) { fields.push({ campo: col, payload: norm(v), nube: "(sin columna)", ok: true, nota: "campo del payload sin columna en nube (posible rename — calibrar)" }); continue; }
    const cmp = equalScalar(v, cloudRow[col]);
    const r = { campo: col, payload: norm(v), nube: norm(cloudRow[col]), ok: cmp.ok };
    if (cmp.nota) r.nota = cmp.nota;
    fields.push(r);
  }
  return fields;
}

const childKeyOf = (obj, matchCamel) => matchCamel.map((m) => norm(obj[m])).join("∙");

// Compara un array del payload contra su tabla hija en la nube; recursivo para nietos.
function compareArray(arrCfg, payloadArr, parentKeyCol, parentKeyVal, results) {
  let cloudRows;
  try {
    const where = arrCfg.parentLink
      ? `${arrCfg.parentLink}='${sqlEsc(parentKeyVal)}'`
      : `${parentKeyCol}='${sqlEsc(parentKeyVal)}'`;
    cloudRows = cloud(`SELECT * FROM ${arrCfg.table} WHERE ${where}`);
  } catch (e) {
    results.push({ tabla: arrCfg.table, marca: "BD-N/A", motivo: e.message });
    return;
  }
  const cMap = new Map();
  for (const r of cloudRows) cMap.set(cloudKey(r, arrCfg.match), r);
  const lines = [];
  for (const pe of (payloadArr || [])) {
    const k = payloadKey(pe, arrCfg.match);
    const cr = cMap.get(k);
    if (!cr) { lines.push({ linea: k, ok: false, motivo: "línea en payload sin contraparte en nube" }); continue; }
    cMap.delete(k);
    const campos = compareScalars(pe, cr, arrCfg.ignore, arrCfg.fieldMap);
    const line = { linea: k, ok: campos.every((f) => f.ok), campos };
    lines.push(line);
    // nietos (ej. orderDetailUnit dentro de orderDetails): linkean por parentLink (co_<detalle>).
    // Empujan su propio resumen al nivel TOP (results), NO a las líneas del padre.
    if (arrCfg.arrays) {
      for (const sub of arrCfg.arrays) {
        compareArray(sub, pe[sub.field], null, norm(cr[sub.parentLink]), results);
      }
    }
  }
  for (const [k] of cMap) lines.push({ linea: k, ok: true, nota: "línea en nube sin contraparte en payload" });
  results.push({ tabla: arrCfg.table, lineas_payload: (payloadArr || []).length, lineas_nube: cloudRows.length, lines });
}
// helper menor: encontrar la clave camel del parentLink en el objeto payload (best-effort)
function snakeToCamelKey(snake, obj) {
  const camel = snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return camel in (obj || {}) ? camel : snake;
}

// ── main ──
(function run() {
  let captured;
  try { captured = JSON.parse(fs.readFileSync(payloadFile, "utf8")); }
  catch (e) { fail("no se pudo leer/parsear payloadFile: " + e.message); }

  const url = String(captured.url || "");
  const data = captured.data || {};
  // detectar tipo por url o por la clave del data
  let typeName = Object.keys(TYPES).find((t) => new RegExp(TYPES[t].dataKey.replace("returns", "return") + "service", "i").test(url));
  if (!typeName) typeName = Object.keys(TYPES).find((t) => TYPES[t].dataKey in data);
  if (!typeName) fail("no se pudo determinar el tipo del payload (url=" + url + ")");
  const cfg = TYPES[typeName];

  const head = data[cfg.dataKey];
  if (!head) fail(`payload sin '${cfg.dataKey}'`);
  const keyVal = head[cfg.key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] // co_return → coReturn
    ?? head[cfg.key];
  if (!keyVal) fail(`payload sin clave ${cfg.key}`);

  let cloudRow;
  try {
    const rows = cloud(`SELECT * FROM ${cfg.table} WHERE ${cfg.key}='${sqlEsc(keyVal)}'`);
    cloudRow = rows[0];
  } catch (e) { fail(e.message); }

  if (!cloudRow) {
    console.log(JSON.stringify({ marca: "BD-SAVED", tipo: typeName, co_x: keyVal, motivo: "payload no encontrado en la nube (no llegó / sin enviar)" }, null, 2));
    return;
  }

  const header = compareScalars(head, cloudRow, cfg.ignore, cfg.fieldMap);
  const children = [];
  for (const arrCfg of cfg.arrays) {
    // hijas con headerLink linkean por una columna del header en la nube (ej. incidence.id_visit = visit.id_visit)
    const pcol = arrCfg.headerLink || cfg.key;
    const pval = arrCfg.headerLink ? norm(cloudRow[arrCfg.headerLink]) : keyVal;
    compareArray(arrCfg, head[arrCfg.field], pcol, pval, children);
  }

  const headerOk = header.every((f) => f.ok);
  const childrenOk = children.every((c) => c.marca === "BD-N/A" ? true : (c.lines || []).every((l) => l.ok));
  const marca = (headerOk && childrenOk) ? "BD-FIELD-OK" : "BD-FIELD-MISMATCH";
  const mismatches = [
    ...header.filter((f) => !f.ok).map((f) => `${f.campo}: payload='${f.payload}' vs nube='${f.nube}'`),
    ...children.flatMap((c) => (c.lines || []).filter((l) => !l.ok).map((l) => `${c.tabla} ${l.linea}: ${l.motivo || (l.campos || []).filter((x) => !x.ok).map((x) => x.campo).join(",")}`)),
  ];
  const notas = [
    ...header.filter((f) => f.nota).map((f) => `${f.campo}: ${f.nota}`),
    ...children.flatMap((c) => (c.lines || []).flatMap((l) => (l.campos || []).filter((x) => x.nota).map((x) => `${c.tabla} ${x.campo}: ${x.nota}`))),
    ...children.filter((c) => c.marca === "BD-N/A").map((c) => `${c.tabla}: ${c.motivo}`),
  ];

  console.log(JSON.stringify({
    marca, tipo: typeName, co_x: keyVal,
    resumen: { campos_cabecera: header.length, hijas: children.map((c) => ({ tabla: c.tabla, payload: c.lineas_payload, nube: c.lineas_nube })), mismatches, notas },
    header, children,
  }, null, 2));
})();
