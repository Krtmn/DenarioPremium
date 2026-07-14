// Helper de consulta read-only a la BD QA de Denario (Postgres en RDS).
// Uso:  node automation/db/query.js <QA_CLIENTE> "SELECT ..."
// - Lee el bloque "# Cliente: <slug>" de secrets/qa-db.env (multi-cliente).
// - Fuerza sslmode=no-verify (cert RDS self-signed; ver memoria qa-db-oracle).
// - Solo SELECT/WITH: el rol es read-only y además se valida aquí (doble candado).
// - Imprime las filas como JSON. Cualquier error sale como "ERR: ..." (no rompe la corrida).
const fs = require("fs");
const path = require("path");

// pg: instalado aquí (npm install) o, si no, se reusa el del tool temporal.
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

// Ruta al secret relativa a este archivo (portable, sin rutas absolutas de máquina).
const ENV_PATH = path.resolve(__dirname, "../../secrets/qa-db.env");
let lines;
try {
  lines = fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/);
} catch (e) {
  console.log("ERR: no se pudo leer secrets/qa-db.env (" + e.message + ")");
  process.exit(1);
}

// Buscar el bloque "# Cliente: <slug>" y la primera línea QA_DB_URL= debajo de él.
let dsn = "";
let inBlock = false;
for (const l of lines) {
  const m = l.match(/^#\s*Cliente:\s*(.+?)\s*$/i);
  if (m) {
    inBlock = m[1].toLowerCase() === cliente.toLowerCase();
    continue;
  }
  if (inBlock && l.startsWith("QA_DB_URL=")) {
    dsn = l.slice("QA_DB_URL=".length).trim();
    break;
  }
}
if (!dsn) {
  console.log(`ERR: no hay bloque "# Cliente: ${cliente}" con QA_DB_URL= en qa-db.env. ` +
    "Agregar el DSN del cliente antes de la corrida.");
  process.exit(1);
}
dsn = dsn.replace(/sslmode=require/, "sslmode=no-verify");
if (!/sslmode=/.test(dsn)) dsn += (dsn.includes("?") ? "&" : "?") + "sslmode=no-verify";

// Candado read-only adicional: solo SELECT/WITH (defensa en profundidad sobre el rol).
const head = sql.trim().replace(/^[(\s]+/, "").slice(0, 12).toLowerCase();
if (!head.startsWith("select") && !head.startsWith("with")) {
  console.log("ERR: solo se permiten consultas SELECT/WITH (rol read-only).");
  process.exit(1);
}

(async () => {
  const c = new Client({ connectionString: dsn, statement_timeout: 30000 });
  try {
    await c.connect();
    const r = await c.query(sql);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.log("ERR:", e.message);
  } finally {
    await c.end().catch(() => {});
  }
})();
