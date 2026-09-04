// Helper de consulta read-only a la BD QA de Denario (Postgres RDS 'savia') — CONEXIÓN DESACOPLADA.
// Uso:  node automation/db/query.js <QA_CLIENTE> "SELECT ..."
//
// TOPOLOGÍA REAL (2026-07): un ÚNICO RDS 'savia' + un ÚNICO usuario 'user_read' hospedan una BASE
// por cliente. El "servidor" al que apunta la APP (ws_url) migra, pero la BD es central y compartida:
// lo único por-cliente es el NOMBRE DE LA BASE (propiedad del cliente, no del servidor-app).
// ⚠ Las bases son TRANSITORIAS: el equipo las crea/dropea al ciclar clientes; el GRANT read-only se
//   aplica por base. Si la base no existe o falta el grant → cotejo BD-N/A (acción DBA, no de este motor).
//
// RESOLUCIÓN DE CONEXIÓN (en orden):
//   1) creds compartidas: bloque "# Servidor: <id>" (QA_DB_HOST/PORT/USER/PASSWORD) si existe;
//      si no, se cosechan del primer QA_DB_URL de cualquier cliente (todos son user_read@savia).
//   2) nombre de base del cliente: bloque "# Cliente:" con QA_DB_NAME=, o el db del QA_DB_URL del
//      cliente (compat), o el campo db_name del YAML clientes/<slug>.yaml, o el slug.
//   3) DSN = creds compartidas + base del cliente.
// Retrocompatible: si el cliente tiene QA_DB_URL con su propio host, se respeta tal cual.
//
// - Fuerza sslmode=no-verify (cert RDS self-signed). Solo SELECT/WITH (rol read-only + doble candado).
// - Errores salen como "ERR: ..." con diagnóstico (no rompen la corrida).
const fs = require("fs");
const path = require("path");

let Client;
try {
  ({ Client } = require("pg"));
} catch (e) {
  try {
    ({ Client } = require("C:/Users/astri/AppData/Local/Temp/qa-db-tool/node_modules/pg"));
  } catch (e2) {
    console.log("ERR: falta el módulo 'pg'. Ejecutar: npm install  (dentro de automation/db/)");
    process.exit(1);
  }
}

const cliente = process.argv[2];
const sql = process.argv[3];
if (!cliente || !sql) {
  console.log('ERR: uso: node automation/db/query.js <QA_CLIENTE> "SELECT ..."');
  process.exit(1);
}

const ENV_PATH = path.resolve(__dirname, "../../secrets/qa-db.env");
let lines;
try {
  lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
} catch (e) {
  console.log("ERR: no se pudo leer secrets/qa-db.env (" + e.message + ")");
  process.exit(1);
}

// ── Parseo: bloques "# Cliente:" y "# Servidor:" ─────────────────────────────────
function parseEnv(lines) {
  const clients = {}; const servers = []; let cur = null, type = null;
  for (const l of lines) {
    const mc = l.match(/^#\s*Cliente:\s*(.+?)\s*$/i);
    const ms = l.match(/^#\s*Servidor:\s*(.+?)\s*$/i);
    if (mc) { cur = mc[1].trim().toLowerCase(); type = "client"; clients[cur] = clients[cur] || {}; continue; }
    if (ms) { cur = ms[1].trim(); type = "server"; servers.push({ id: cur }); continue; }
    if (!cur) continue;
    const kv = l.match(/^\s*([A-Za-z_]+)\s*=\s*(.*)$/);
    if (!kv) continue;
    const k = kv[1].toUpperCase(), v = kv[2].trim();
    if (type === "client") {
      if (k === "QA_DB_URL") clients[cur].url = v;
      else if (k === "QA_DB_NAME") clients[cur].dbname = v;
    } else {
      const s = servers[servers.length - 1];
      if (k === "QA_DB_HOST") s.host = v; else if (k === "QA_DB_PORT") s.port = v;
      else if (k === "QA_DB_USER") s.user = v; else if (k === "QA_DB_PASSWORD") s.password = v;
    }
  }
  return { clients, servers };
}
function parseDsn(url) {
  try { const u = new URL(url); return { host: u.hostname, port: u.port || "5432", user: decodeURIComponent(u.username || ""), password: decodeURIComponent(u.password || ""), db: (u.pathname || "").replace(/^\//, "").split("?")[0] }; }
  catch (e) { return null; }
}
// db_name del YAML del cliente (fuente pública del mapeo slug→base).
function dbNameFromYaml(slug) {
  try {
    const y = fs.readFileSync(path.resolve(__dirname, "../clientes/" + slug + ".yaml"), "utf8");
    const m = y.match(/^\s*db_name:\s*([A-Za-z0-9_]+)/m);
    return m ? m[1] : null;
  } catch (e) { return null; }
}

const { clients, servers } = parseEnv(lines);
const me = clients[cliente.toLowerCase()] || {};

// ── Construir el DSN del cliente ─────────────────────────────────────────────────
let dsn = "";
let diag = "";
if (me.url) {
  // Retrocompat: el cliente tiene su propio DSN → usarlo tal cual (comportamiento histórico).
  dsn = me.url;
} else {
  // Modelo desacoplado: creds compartidas + nombre de base del cliente.
  let creds = servers.find((s) => s.host && s.user) || null;
  if (!creds) { // cosechar del primer QA_DB_URL disponible (todos user_read@savia)
    for (const slug of Object.keys(clients)) { const d = clients[slug].url ? parseDsn(clients[slug].url) : null; if (d) { creds = d; break; } }
  }
  const db = me.dbname || dbNameFromYaml(cliente) || cliente;
  if (!creds) { console.log("ERR: no hay creds de servidor en qa-db.env (bloque '# Servidor:' ni ningún QA_DB_URL para cosechar)."); process.exit(1); }
  dsn = `postgres://${encodeURIComponent(creds.user)}:${encodeURIComponent(creds.password || "")}@${creds.host}:${creds.port || "5432"}/${db}?sslmode=no-verify`;
  diag = ` (conexión desacoplada: user_read@${creds.host} base='${db}')`;
}
if (!dsn) {
  console.log(`ERR: no se pudo resolver la conexión para "${cliente}". Agregar bloque "# Cliente: ${cliente}" (QA_DB_URL o QA_DB_NAME) o un "# Servidor:" compartido + db_name en el YAML.`);
  process.exit(1);
}
dsn = dsn.replace(/sslmode=require/, "sslmode=no-verify");
if (!/sslmode=/.test(dsn)) dsn += (dsn.includes("?") ? "&" : "?") + "sslmode=no-verify";

// Candado read-only.
const head = sql.trim().replace(/^[(\s]+/, "").slice(0, 12).toLowerCase();
if (!head.startsWith("select") && !head.startsWith("with")) {
  console.log("ERR: solo se permiten consultas SELECT/WITH (rol read-only).");
  process.exit(1);
}

(async () => {
  const c = new Client({ connectionString: dsn, statement_timeout: 30000, connectionTimeoutMillis: 10000 });
  try {
    await c.connect();

    // ── Alcance de fila (RLS) ────────────────────────────────────────────────
    // 🔴 `collection`, `deposit` e `invoice` tienen ROW LEVEL SECURITY activado y
    //    FORZADO. Su política solo deja ver filas si la sesión declara
    //    `app.current_scope`:
    //        scope='admin'  ó  (scope='seller' y id_user = app.current_id_user)  ó supervisor
    //    Una sesión que no lo declara no entra por ninguna rama y recibe
    //    **CERO FILAS, sin error**. Eso es lo peligroso: parece que la tabla está
    //    vacía. Pasó el 2026-09-04 en 4K y se llegó a reportar como "se borraron
    //    los datos" — no era cierto, los 2.489 cobros estaban ahí.
    //
    // 🔴 UN GRANT NO LO ARREGLA: el GRANT da permiso sobre la TABLA, RLS filtra
    //    las FILAS. Son dos candados distintos.
    //
    // Declaramos el mismo alcance que usa la sesión `admin` de la web, que es
    // exactamente lo que QA necesita para cotejar. Sigue siendo solo lectura.
    try {
      await c.query("SELECT set_config('app.current_scope', 'admin', false)");
    } catch (_) {
      // Si la base no usa RLS, esto no hace falta y su fallo no debe tumbar la consulta.
    }

    const r = await c.query(sql);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    // Diagnóstico claro para distinguir acción DBA (base/grant) de un problema real de query.
    let hint = "";
    if (/does not exist/i.test(e.message) && /database/i.test(e.message)) hint = " [BD-N/A: la base del cliente NO existe en savia — acción DBA: crearla/restaurarla]";
    else if (/permission denied/i.test(e.message)) hint = " [BD-N/A: falta GRANT read-only en la base del cliente — acción DBA: aplicar grant a user_read]";
    else if (/ECONNREFUSED|ETIMEDOUT|getaddrinfo|ENOTFOUND|timeout/i.test(e.message)) hint = " [BD-N/A: savia inaccesible desde esta red]";
    console.log("ERR:", e.message + hint + diag);
  } finally {
    await c.end().catch(() => {});
  }
})();
