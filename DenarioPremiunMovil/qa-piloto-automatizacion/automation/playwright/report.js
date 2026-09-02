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
 * Nombre de carpeta de una corrida de script.
 *
 * 🔴 Va DENTRO de la carpeta del cliente, igual que las corridas manuales
 *    (`automation/reports/README.md`). Antes caía suelta en la raíz de
 *    `reports/` y se acumularon 82 carpetas mezcladas con los informes reales.
 *
 *    reports/{cliente}/script_{cliente}_{YYYYMMDD}_{HHMMSS}/          ← corrida completa
 *    reports/{cliente}/script-cobros_{cliente}_{YYYYMMDD}_{HHMMSS}/   ← un solo módulo
 *
 * El prefijo `script` es el identificador que distingue estas corridas de los
 * informes que se redactan a mano.
 */
function nombreRun(clienteSlug, modulo) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`
           + `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const tipo = modulo ? `script-${modulo}` : 'script';
  return `${tipo}_${clienteSlug}_${ts}`;
}

/** Prefijo con el que empiezan TODAS las corridas de script de un cliente. */
const PREFIJO_RUN = 'script';

/**
 * Crea la carpeta de la corrida —dentro de la del cliente— y devuelve su ruta.
 * @param {string} clienteSlug  el mismo QA_CLIENTE del perfil `clientes/{slug}.yaml`
 * @param {string} [modulo]     si se corrió un solo módulo, para poder distinguirlo
 */
function crearCarpetaRun(clienteSlug, modulo) {
  const nombre = nombreRun(clienteSlug, modulo);
  const dir = path.join(REPORTS_DIR, clienteSlug, nombre);
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

module.exports = { crearCarpetaRun, escribirReporte, nombreRun, PREFIJO_RUN };
