// Driver CDP mínimo para la app móvil Denario Premium.
// Uso:  node drv.js <archivo-con-codigo.js>
// El archivo recibe (pg, ctx) y debe exportar una función async.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const scriptPath = path.resolve(process.argv[2]);
  const fn = require(scriptPath);
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9220');
  const ctx = browser.contexts()[0];
  const pg = ctx.pages().find(p => p.url().includes('localhost')) || ctx.pages()[0];
  try {
    const out = await fn(pg, ctx);
    if (out !== undefined) console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
  } catch (e) {
    console.log('ERROR:', e.message);
    process.exitCode = 1;
  }
  // NO llamar browser.close(): sobre CDP cierra/replega la WebView y la app vuelve al home.
  // Se corta el proceso a pelo dejando la app tal cual está.
  process.stdout.write('', () => process.exit(process.exitCode || 0));
})();
