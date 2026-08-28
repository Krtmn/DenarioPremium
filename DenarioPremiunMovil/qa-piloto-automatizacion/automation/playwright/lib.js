// Helpers compartidos para los guiones CDP.
async function sweepAlerts(pg, labels = ['Cancelar', 'Aceptar', 'OK']) {
  return await pg.evaluate((labs) => {
    let n = 0;
    for (const a of document.querySelectorAll('ion-alert')) {
      if (a.classList.contains('overlay-hidden')) continue;
      for (const b of a.querySelectorAll('button')) {
        if (labs.includes(b.textContent.trim())) { b.click(); n++; break; }
      }
    }
    return n;
  }, labels);
}

// Tap real: comprueba que el punto NO está ocluido y usa mouse.click.
async function tap(pg, selectorOrHandle, opts = {}) {
  const el = typeof selectorOrHandle === 'string'
    ? await pg.$(selectorOrHandle) : selectorOrHandle;
  if (!el) throw new Error('tap: no existe ' + selectorOrHandle);
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error('tap: sin boundingBox');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const occl = await pg.evaluate(([x, y]) => {
    const t = document.elementFromPoint(x, y);
    return t ? { tag: t.tagName.toLowerCase(), cls: String(t.className).slice(0, 80), txt: (t.innerText || '').slice(0, 40) } : null;
  }, [x, y]);
  await pg.mouse.click(x, y);
  return { x, y, occl };
}

// Busca un elemento por texto exacto/contenido entre varios selectores.
async function findByText(pg, sel, text) {
  const hs = await pg.$$(sel);
  for (const h of hs) {
    const t = (await h.innerText().catch(() => '')).trim();
    if (t === text || t.includes(text)) return h;
  }
  return null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = { sweepAlerts, tap, findByText, sleep };
