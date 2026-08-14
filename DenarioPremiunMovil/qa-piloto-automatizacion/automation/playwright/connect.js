/**
 * connect.js
 * Conexión CDP standalone — sin depender de un page previo de Playwright MCP.
 *
 * Prerrequisito: setup-cdp.ps1 ya corrió y el puerto :9220 está activo.
 *   node automation/cdp/setup-cdp.ps1  (o .\automation\cdp\setup-cdp.ps1 desde PowerShell)
 */

const { chromium } = require('playwright');

const CDP_URL = 'http://127.0.0.1:9220';

/**
 * Conecta al WebView Android vía CDP y devuelve la página activa.
 * @param {{timeoutMs?:number, retries?:number}} [opts]
 * @returns {Promise<import('playwright').Page>}
 */
async function conectar(opts = {}) {
  const { timeoutMs = 20000, retries = 2 } = opts;
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const browser = await chromium.connectOverCDP(CDP_URL, { timeout: timeoutMs });
      const ctx = browser.contexts()[0];
      const pg  = ctx && ctx.pages()[0];
      if (!pg) throw new Error('CDP conectó pero no hay páginas en el contexto');
      await pg.bringToFront();
      return pg;
    } catch (e) {
      last = e;
      if (i < retries) await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw new Error('CDP-DOWN: ' + (last && last.message));
}

/**
 * Espera a que `app-home` sea visible (la app debe estar en HOME antes de correr módulos).
 * Si no llega en `ms` milisegundos, lanza.
 * @param {import('playwright').Page} pg
 * @param {number} [ms=15000]
 */
async function esperarHome(pg, ms = 15000) {
  await pg.waitForSelector('app-home', { state: 'visible', timeout: ms });
}

module.exports = { conectar, esperarHome, CDP_URL };
