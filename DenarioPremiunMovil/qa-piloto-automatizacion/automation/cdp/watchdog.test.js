/**
 * watchdog.test.js — Self-test del watchdog de CDP (RUNTIME §11).
 * Corre SIN dispositivo:  node automation/cdp/watchdog.test.js
 *
 * Verifica que un cuelgue de CDP se corta solo, se cuenta, y aborta el módulo
 * antes de comerse horas de wall-clock (caso ferrenuestro-20260723: ~15.7 h por 2 hangs).
 */

const { withTimeout, cdpAlive, makeWatchdog, connectCdp } = require('./denario-cdp-helpers.js');

let ok = 0, fail = 0;
const t = (desc, cond) => { if (cond) { ok++; } else { fail++; console.error('  FAIL: ' + desc); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nunca = () => new Promise(() => {});                 // promesa que jamás resuelve = cuelgue
const grab = async (p) => { try { await p; return null; } catch (e) { return e.message; } };

(async () => {
  // ── withTimeout ──
  t('withTimeout deja pasar lo que resuelve a tiempo', (await withTimeout(sleep(5).then(() => 42), 500, 'x')) === 42);
  t('withTimeout corta un cuelgue con prefijo TIMEOUT:', /^TIMEOUT:conectar tras 40ms$/.test(await grab(withTimeout(nunca(), 40, 'conectar'))));
  t('withTimeout propaga el error original, no lo enmascara', (await grab(withTimeout(Promise.reject(new Error('boom')), 500, 'x'))) === 'boom');

  const t0 = Date.now();
  await grab(withTimeout(nunca(), 60, 'x'));
  t('withTimeout corta cerca del techo (no espera de más)', Date.now() - t0 < 500);

  // ── cdpAlive ──
  t('cdpAlive=false si el WebView no responde', (await cdpAlive({ evaluate: nunca }, 40)) === false);
  t('cdpAlive=true si responde', (await cdpAlive({ evaluate: async () => 1 }, 200)) === true);

  // ── makeWatchdog: operación sana ──
  const wd1 = makeWatchdog({ opMs: 200, maxHangs: 2, moduleMs: 60000 });
  t('wd.run devuelve el valor de la op', (await wd1.run('op', async () => 'v')) === 'v');
  t('op sana no cuenta cuelgue', wd1.hangs() === 0);
  t('un error normal NO cuenta como cuelgue', (await grab(wd1.run('op', async () => { throw new Error('selector ausente'); }))) === 'selector ausente' && wd1.hangs() === 0);

  // ── makeWatchdog: cuelgues ──
  const wd2 = makeWatchdog({ opMs: 40, maxHangs: 2, moduleMs: 60000 });
  const e1 = await grab(wd2.run('op1', nunca));
  t('1er cuelgue → TIMEOUT (aún no aborta: el agente marca BLOCKED y sigue)', e1.indexOf('TIMEOUT:op1') === 0);
  t('1er cuelgue contado', wd2.hangs() === 1);
  const e2 = await grab(wd2.run('op2', nunca));
  t('2º cuelgue → ABORT-MODULE con el label del último', e2.indexOf('ABORT-MODULE:2 cuelgues') === 0 && e2.indexOf('op2') > 0);

  // ── makeWatchdog: techo de wall-clock ──
  const wd3 = makeWatchdog({ opMs: 500, maxHangs: 9, moduleMs: 30 });
  await sleep(60);
  const e3 = await grab(wd3.run('tarde', async () => 'v'));
  t('superado moduleMs → ABORT-MODULE:techo-wall-clock antes de arrancar la op', e3.indexOf('ABORT-MODULE:techo-wall-clock') === 0);
  t('budgetLeftMs negativo tras pasarse del techo', wd3.budgetLeftMs() < 0);

  // ── connectCdp endurecido: no se cuelga y agota reintentos ──
  const pageColgada = { context: () => ({ browser: () => ({ _browserType: { connectOverCDP: nunca } }) }) };
  const c0 = Date.now();
  const e4 = await grab(connectCdp(pageColgada, { timeoutMs: 30, retries: 1 }));
  t('connectCdp con CDP colgado → CDP-DOWN (no cuelga el módulo)', e4.indexOf('CDP-DOWN:') === 0);
  t('connectCdp respeta techo+reintentos (rápido, no indefinido)', Date.now() - c0 < 3000);

  let intentos = 0;
  const pageFlaky = { context: () => ({ browser: () => ({ _browserType: { connectOverCDP: async () => {
    if (++intentos < 2) throw new Error('ECONNREFUSED');
    return { contexts: () => [{ pages: () => [{ bringToFront: async () => {} , _id: 'pg' }] }] };
  } } }) }) };
  const pg = await connectCdp(pageFlaky, { timeoutMs: 200, retries: 2 });
  t('connectCdp reintenta y devuelve la página cuando el CDP revive', pg && pg._id === 'pg' && intentos === 2);

  console.log('\n=== watchdog self-test: ' + ok + ' OK, ' + fail + ' FAIL ===');
  process.exit(fail ? 1 : 0);
})();
