/**
 * report.js
 * Crea carpeta de reporte y escribe .md + .jsonl por módulo.
 * Formato compatible con el ledger que usa el orquestador Claude.
 */

const fs   = require('fs');
const path = require('path');

const REPORTS_DIR = path.resolve(__dirname, '../reports');

const ICONOS = { PASS: '✅', FAIL: '❌', 'N/A': '⬜', BLOCKED: '⛔' };

/**
 * Crea la carpeta de la corrida y devuelve su ruta.
 * Nombre: playwright_{cliente}_{YYYYMMDD_HHMMSS}
 */
function crearCarpetaRun(clienteSlug) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`
           + `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const nombre = `playwright_${clienteSlug}_${ts}`;
  const dir = path.join(REPORTS_DIR, nombre);
  fs.mkdirSync(dir, { recursive: true });
  return { dir, nombre };
}

/**
 * Escribe {modulo}.md + líneas en _results.jsonl.
 * @param {string} dir - carpeta del run
 * @param {string} modulo
 * @param {Array<{id,descripcion,resultado,nota?,ms?}>} verdicts
 * @param {number} msTotal
 */
function escribirReporte(dir, modulo, verdicts, msTotal) {
  const filas = verdicts.map(v => {
    const ico = ICONOS[v.resultado] || '❓';
    return `| ${ico} \`${v.id}\` | ${v.descripcion} | **${v.resultado}** | ${v.nota || ''} |`;
  }).join('\n');

  const pass    = verdicts.filter(v => v.resultado === 'PASS').length;
  const fail    = verdicts.filter(v => v.resultado === 'FAIL').length;
  const na      = verdicts.filter(v => v.resultado === 'N/A').length;
  const blocked = verdicts.filter(v => v.resultado === 'BLOCKED').length;

  const md = [
    `# Reporte — ${modulo.toUpperCase()}`,
    '',
    `**Resultado:** ${pass} PASS · ${fail} FAIL · ${na} N/A · ${blocked} BLOCKED`,
    `**Duración:** ${msTotal}ms`,
    '',
    '| ID | Descripción | Resultado | Nota |',
    '|----|-------------|-----------|------|',
    filas,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(dir, `${modulo}.md`), md, 'utf8');

  const jsonlPath = path.join(dir, '_results.jsonl');
  for (const v of verdicts) {
    const linea = {
      modulo,
      id:          v.id,
      descripcion: v.descripcion,
      resultado:   v.resultado,
      nota:        v.nota || '',
      ms:          v.ms || 0,
      ts:          new Date().toISOString(),
      runner:      'playwright-standalone',
    };
    fs.appendFileSync(jsonlPath, JSON.stringify(linea) + '\n', 'utf8');
  }

  return { pass, fail, na, blocked };
}

module.exports = { crearCarpetaRun, escribirReporte };
