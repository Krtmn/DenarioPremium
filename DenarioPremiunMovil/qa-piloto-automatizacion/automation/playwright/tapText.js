// node drv.js tapText.js  — usa TAP_TEXT y TAP_WAIT del entorno
const { sweepAlerts, sleep } = require('./lib');

module.exports = async (pg) => {
  const want = process.env.TAP_TEXT;
  const wait = parseInt(process.env.TAP_WAIT || '3000', 10);
  const log = [];
  await sweepAlerts(pg);
  const cands = await pg.evaluate((want) => {
    const out = [];
    for (const e of document.querySelectorAll('*')) {
      const t = (e.innerText || '').trim();
      if (t !== want) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.y < 0 || r.y > innerHeight) continue;
      out.push({ tag: e.tagName.toLowerCase(), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height });
    }
    return out;
  }, want);
  if (!cands.length) { log.push('NO ENCONTRADO: ' + want); return log; }
  // el más profundo (menor área) suele ser el label; el más externo el botón. Usamos el de área mediana.
  cands.sort((a, b) => a.w * a.h - b.w * b.h);
  const c = cands[Math.floor(cands.length / 2)];
  const occl = await pg.evaluate(([x, y]) => {
    const t = document.elementFromPoint(x, y);
    return t ? { tag: t.tagName.toLowerCase(), txt: (t.innerText || '').trim().slice(0, 40) } : null;
  }, [c.x, c.y]);
  log.push({ want, elegido: c, occl, total: cands.length });
  await pg.mouse.click(c.x, c.y);
  await sleep(wait);
  await sweepAlerts(pg);
  await sleep(800);
  log.push(await pg.evaluate(() => ({
    url: location.href,
    text: (document.querySelector('ion-content') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 900),
  })));
  return log;
};
