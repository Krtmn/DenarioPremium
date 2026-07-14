// resolve-run-context.js — Pre-vuelo de DATOS: resuelve en BD qué cliente/documento usar por módulo,
// ANTES de lanzar los agentes, para que no exploren en runtime (mayor ahorro de TIEMPO).
//
// Uso:  node automation/db/resolve-run-context.js <QA_CLIENTE> <RUN_DIR>
//   Escribe <RUN_DIR>run-context.json con secciones por módulo. El orquestador inyecta
//   la sección {modulo} en cada prompt de agente; el agente va directo, sin discovery en UI.
//
// BLINDAJE (igual que el oráculo BD): si la BD no responde, escribe lo que pudo + secciones null,
// NUNCA bloquea la corrida. El agente cae a su discovery actual cuando la sección viene null.
//
// EXTENSIÓN: cada módulo es una entrada en RESOLVERS. Hoy 'cobros' está completo (query confirmada
// en smoke-cobros.md). Para los demás transaccionales: agregar su query + parser cuando se valide
// el esquema (pedidos/devoluciones/inventarios/visitas/depositos/clientes). Una entrada `null` se
// salta limpio (el agente usa su discovery). Así el resolver crece sin reescribirse.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const cliente = process.argv[2];
const runDir = process.argv[3];

if (!cliente || !runDir) {
  console.log('ERR: uso: node resolve-run-context.js <QA_CLIENTE> <RUN_DIR>');
  process.exit(1);
}

function cloud(sql) {
  const out = execFileSync("node", [path.join(DIR, "query.js"), cliente, sql], { encoding: "utf8", timeout: 40000 });
  const t = (out || "").trim();
  if (t.startsWith("ERR:")) throw new Error(t);
  return JSON.parse(t);
}

// ── RESOLVERS por módulo ──────────────────────────────────────────────────────
// Cada uno: { sql, parse(rows) } → devuelve el objeto que se inyecta en el prompt del agente.
const RESOLVERS = {
  // COBROS: top-2 clientes con saldo, por tipo de documento (FACT / IGTF). Confirmado smoke-cobros.md.
  cobros: {
    sql:
      "SELECT * FROM (SELECT d.co_document_sale_type tipo, c.na_client, c.co_client, count(*) docs, " +
      "round(sum(d.nu_balance),2) saldo, row_number() OVER (PARTITION BY d.co_document_sale_type " +
      "ORDER BY count(*) DESC) rn FROM document_sale d JOIN client c ON c.id_client=d.id_client " +
      "WHERE d.nu_balance>0 GROUP BY d.co_document_sale_type, c.na_client, c.co_client) t " +
      "WHERE rn<=2 ORDER BY tipo, docs DESC",
    parse(rows) {
      const top = (tipo) => {
        const r = rows.filter((x) => String(x.tipo).toUpperCase().includes(tipo))
          .sort((a, b) => b.docs - a.docs)[0];
        return r ? { na_client: r.na_client, co_client: r.co_client, docs: r.docs, saldo: r.saldo } : null;
      };
      return {
        cliente_normal: top("FACT"),   // 008/040/043/041/042/046
        cliente_igtf: top("IGTF"),     // 036/044/045 — si null → IGTF = N/A (no forzar)
        _nota: "Descubierto en pre-vuelo BD. Para el documento exacto en UI, confirmar con local-query sobre document_sales + co_currency.",
      };
    },
  },

  // ── Pendientes de validar esquema antes de activar (el agente usa su discovery mientras tanto): ──
  // pedidos:       { sql: "...", parse(rows){...} },   // cliente activo con catálogo
  // devoluciones:  { sql: "...", parse(rows){...} },   // cliente + producto elegible
  // inventarios:   { sql: "...", parse(rows){...} },
  // visitas:       { sql: "...", parse(rows){...} },
  // depositos:     { sql: "...", parse(rows){...} },
  // clientes:      { sql: "...", parse(rows){...} },
  pedidos: null,
  devoluciones: null,
  inventarios: null,
  visitas: null,
  depositos: null,
  clientes: null,
};

// ── Ejecutar cada resolver con blindaje individual ────────────────────────────
const context = { _generated_for: cliente, _run_dir: runDir, modules: {} };
let okCount = 0, errCount = 0, skipCount = 0;

for (const [modulo, cfg] of Object.entries(RESOLVERS)) {
  if (!cfg) { context.modules[modulo] = null; skipCount++; continue; } // sin definir → agente usa discovery
  try {
    const rows = cloud(cfg.sql);
    context.modules[modulo] = cfg.parse(rows);
    okCount++;
  } catch (e) {
    context.modules[modulo] = null;          // BD/consulta falló → null, el agente cae a discovery
    context.modules["_err_" + modulo] = String(e.message).slice(0, 120);
    errCount++;
  }
}

// ── Escribir run-context.json ─────────────────────────────────────────────────
const outPath = runDir.endsWith("/") || runDir.endsWith("\\")
  ? path.join(runDir, "run-context.json")
  : runDir + "/run-context.json";
try {
  fs.writeFileSync(outPath, JSON.stringify(context, null, 2), "utf8");
  console.log(`OK: run-context.json escrito (${okCount} resueltos, ${errCount} con error, ${skipCount} sin definir → discovery). Ruta: ${outPath}`);
} catch (e) {
  console.log("ERR: no se pudo escribir run-context.json: " + e.message + " (la corrida sigue; los agentes usan discovery)");
}
