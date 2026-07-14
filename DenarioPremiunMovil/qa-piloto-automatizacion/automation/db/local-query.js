// Lector READ-ONLY del SQLite LOCAL del dispositivo (la BD del teléfono).
// Uso:  node automation/db/local-query.js "SELECT ..."
//       ADB_SERIAL=emulator-5554 node automation/db/local-query.js "SELECT ..."  (si hay varios dispositivos)
//
// - Lee `databases/denarioPremium` DENTRO de la app vía `adb shell run-as` + sqlite3 (en el dispositivo).
// - SOLO lectura: candado que exige SELECT/WITH/PRAGMA/.tables/.schema. La app es dueña del archivo,
//   así que el candado evita escrituras accidentales (run-as podría escribir).
// - Devuelve filas como JSON (sqlite3 -json). Sin filas → "[]". Errores → "ERR: ...".
//
// Para qué: cotejo "lo guardado se envía" (§10). Estados locales:
//   collections.st_delivery=1 & id_collection>0  → ENVIADO (llegó a la nube)
//   collections.st_delivery=3 & id_collection=0  → GUARDADO sin enviar (ej. sin adjunto)
//   pending_transactions                          → en cola (esperando sync/confirmación)
//   failed_transactions                           → rechazado por el servidor (400)
// (Las demás transaccionales comparten el patrón: orders/returns/visits/... tienen su st_delivery.)
const { execFileSync } = require("child_process");

const PKG = "com.kiberno.denarioPremiumPro";
const DB = "databases/denarioPremium";
const SERIAL = process.env.ADB_SERIAL || ""; // opcional: serial si hay varios dispositivos

const sql = process.argv[2];
if (!sql) {
  console.log('ERR: uso: node automation/db/local-query.js "SELECT ..."');
  process.exit(1);
}

// Candado read-only (la app es dueña del archivo → run-as podría escribir; lo bloqueamos).
const head = sql.trim().replace(/^[(\s]+/, "").toLowerCase();
const allowed =
  head.startsWith("select") ||
  head.startsWith("with") ||
  head.startsWith("pragma") ||
  head.startsWith(".tables") ||
  head.startsWith(".schema");
if (!allowed) {
  console.log("ERR: solo se permiten SELECT/WITH/PRAGMA/.tables/.schema (read-only).");
  process.exit(1);
}

// El sqlite3 del dispositivo (3.32.2) NO soporta -json → usamos -csv -header y
// convertimos a JSON aquí, para devolver el mismo formato que el lector de nube (query.js).
// Quoting sh-seguro para el shell del dispositivo (toybox/mksh).
const quoted = "'" + sql.replace(/'/g, "'\\''") + "'";
const isDot = head.startsWith(".");
const flags = isDot ? "" : "-csv -header ";
const deviceCmd = `run-as ${PKG} sqlite3 ${flags}${DB} ${quoted}`;
const adbArgs = SERIAL ? ["-s", SERIAL, "shell", deviceCmd] : ["shell", deviceCmd];

// Parser CSV RFC4180 (campos con comas/comillas/saltos van entre comillas dobles; "" = comilla).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

try {
  const out = execFileSync("adb", adbArgs, { encoding: "utf8", timeout: 30000 }).trim();
  if (isDot) { console.log(out); process.exit(0); } // .tables/.schema → salida cruda
  if (!out) { console.log("[]"); process.exit(0); }
  const rows = parseCsv(out);
  if (rows.length < 2) { console.log("[]"); process.exit(0); } // solo header o vacío
  const headers = rows[0];
  const data = rows.slice(1)
    .filter((r) => r.length === headers.length)
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  const msg = (e.stderr || e.stdout || e.message || "").toString().trim();
  console.log("ERR: " + (msg || "fallo al ejecutar adb/sqlite3"));
  process.exit(1);
}
