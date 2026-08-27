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

/**
 * Navega de vuelta a HOME haciendo click en el botón de retroceso de Denario (img.fechaAtras)
 * o en ion-back-button hasta que app-home sea visible.
 * Más confiable que history.back() o ADB keyevent porque Ionic lo procesa como acción real.
 * @param {import('playwright').Page} pg
 * @param {number} [ms=20000]
 */
async function volverAHome(pg, ms = 20000) {
  const getState = () => pg.evaluate(() => {
    const homeEl  = document.querySelector('app-home');
    const loginEl = document.querySelector('app-login');
    return {
      pathname: location.pathname,
      homeHidden: homeEl ? homeEl.classList.contains('ion-page-hidden') : true,
      // loginPresent solo si la página login está VISIBLE (no oculta por Ionic)
      loginPresent: !!(loginEl && !loginEl.classList.contains('ion-page-hidden')),
    };
  }).catch(() => ({ pathname: '', homeHidden: true, loginPresent: false }));

  const isHome = async () => !(await getState()).homeHidden;

  if (await isHome()) return;

  const initial = await getState();
  if (initial.loginPresent) {
    throw new Error('volverAHome: app en login — iniciar sesión manualmente antes de correr el test');
  }

  // Clic en el botón de retroceso visible de Denario
  const clickBackBtn = () => pg.evaluate(() => {
    // 1. img.fechaAtras (botón de flecha de Denario, top-left)
    const imgs = [...document.querySelectorAll('img.fechaAtras')];
    const back = imgs.find(img => {
      const r = img.getBoundingClientRect();
      return r.width > 0 && r.x < 120 && r.y < 120;
    });
    if (back) {
      const target = back.closest('a') || back;
      const r = target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    // 2. ion-back-button (estándar Ionic)
    const ionBack = document.querySelector('ion-back-button');
    if (ionBack && ionBack.getBoundingClientRect().width > 0) {
      const r = ionBack.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return null;
  }).catch(() => null);

  // Retorna coords del botón "descartar" del ion-alert visible, o null si no hay alerta.
  // Prioriza etiquetas que descartan cambios ("No", "Salir sin guardar", "Cancelar").
  const dismissBlockingAlert = () => pg.evaluate(() => {
    const alerts = [...document.querySelectorAll('ion-alert')].filter(
      a => !a.classList.contains('overlay-hidden') && a.offsetParent !== null
    );
    if (!alerts.length) return null;
    const alert = alerts[alerts.length - 1];
    const btns = [...alert.querySelectorAll('.alert-button')]
      .filter(b => b.getBoundingClientRect().width > 0);
    const DISCARD = ['salir sin guardar', 'no guardar', 'descartar', 'no', 'salir', 'cancelar'];
    for (const label of DISCARD) {
      const btn = btns.find(b => b.textContent.trim().toLowerCase() === label);
      if (btn) {
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: btn.textContent.trim() };
      }
    }
    return null;
  }).catch(() => null);

  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    // Si hay una alerta bloqueando (ej. "¿Desea guardar?"), descartarla antes de intentar back
    const preAlertCoords = await dismissBlockingAlert();
    if (preAlertCoords) {
      await pg.mouse.click(preAlertCoords.x, preAlertCoords.y);
      await pg.waitForTimeout(600);
      if (await isHome()) return;
      continue;
    }

    const coords = await clickBackBtn();
    if (coords) {
      await pg.mouse.click(coords.x, coords.y, { delay: 60 });
    }
    await pg.waitForTimeout(800);

    // Descartar alerta que pudo aparecer tras el click back
    const postAlertCoords = await dismissBlockingAlert();
    if (postAlertCoords) {
      await pg.mouse.click(postAlertCoords.x, postAlertCoords.y);
      await pg.waitForTimeout(500);
    }

    if (await isHome()) return;
    const s = await getState();
    if (s.loginPresent) throw new Error('volverAHome: llegó a login — iniciar sesión manualmente');
  }
  throw new Error('volverAHome: no se llegó a HOME en ' + ms + 'ms — verificar estado del dispositivo');
}

module.exports = { conectar, esperarHome, volverAHome, CDP_URL };
