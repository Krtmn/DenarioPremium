// Lector READ-ONLY del SQLite LOCAL del dispositivo (la BD del teléfono).
// Uso:  node automation/db/local-query.js "SELECT ..."
//       ADB_SERIAL=RFGL52M3JJY node automation/db/local-query.js "SELECT ..."  (si hay varios dispositivos)
//
// Estrategia: pull binario de la BD vía "adb exec-out run-as <pkg> cat <db>",
// luego consulta local con sql.js (puro WASM — sin sqlite3 en el device).
//
// - SOLO lectura: candado que exige SELECT/WITH/PRAGMA.
// - Devuelve filas como JSON (mismo formato que query.js). Sin filas → "[]". Error → "ERR: ...".
const { spawnSync } = require('child_process');
const initSqlJs     = require('sql.js');

const PKG    = 'com.kiberno.denarioPremiumPro';
const DB     = 'databases/denarioPremium';
const SERIAL = process.env.ADB_SERIAL || '';

const sql = process.argv[2];
if (!sql) {
  console.log('ERR: uso: node automation/db/local-query.js "SELECT ..."');
  process.exit(1);
}

// Candado read-only
const head = sql.trim().replace(/^[(\s]+/, '').toLowerCase();
const allowed =
  head.startsWith('select') ||
  head.startsWith('with')   ||
  head.startsWith('pragma');
if (!allowed) {
  console.log('ERR: solo se permiten SELECT/WITH/PRAGMA (read-only).');
  process.exit(1);
}

(async () => {
  // 1. Pull DB binary desde el device
  const adbArgs = SERIAL
    ? ['-s', SERIAL, 'exec-out', `run-as ${PKG} cat ${DB}`]
    : ['exec-out', `run-as ${PKG} cat ${DB}`];

  const pull = spawnSync('adb', adbArgs, {
    encoding: 'buffer',
    timeout: 30000,
    maxBuffer: 32 * 1024 * 1024, // 32 MB — DB actual ~2.2 MB; margen para WAL
  });

  if (pull.error || !pull.stdout || pull.stdout.length < 100) {
    const errMsg = pull.error
      ? pull.error.message
      : (pull.stderr || Buffer.alloc(0)).toString().trim();
    console.log('ERR: no se pudo jalar la BD del device — ' + (errMsg || 'sin output'));
    process.exit(1);
  }

  // 2. Cargar con sql.js y ejecutar la consulta
  const SQL = await initSqlJs();
  const db  = new SQL.Database(pull.stdout);

  try {
    const stmt = db.prepare(sql);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.log('ERR: ' + e.message);
    process.exit(1);
  } finally {
    db.close();
  }
})().catch(e => {
  console.log('ERR: ' + (e.message || e));
  process.exit(1);
});
