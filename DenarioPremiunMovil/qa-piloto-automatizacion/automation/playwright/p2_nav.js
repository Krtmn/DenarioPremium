const { sweepAlerts, tap, sleep } = require('./lib');

module.exports = async (pg) => {
  const log = [];
  await sweepAlerts(pg);
  const cands = await pg.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll('app-home *')) {
      const t = (e.innerText || '').trim();
      if (t !== 'Pedidos') continue;
      const r = e.getBoundingClientRect();
      if (r.width < 5 || r.height < 5) continue;
      out.push({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 60), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height });
    }
    return out;
  });
  log.push({ candidatos: cands });
  if (!cands.length) return log;
  const c = cands[cands.length - 1];
  const occl = await pg.evaluate(([x, y]) => {
    const t = document.elementFromPoint(x, y);
    return t ? { tag: t.tagName.toLowerCase(), txt: (t.innerText || '').slice(0, 40) } : null;
  }, [c.x, c.y]);
  log.push({ tapPoint: c, occl });
  await pg.mouse.click(c.x, c.y);
  await sleep(3500);
  await sweepAlerts(pg);
  await sleep(1500);
  log.push(await pg.evaluate(() => ({
    url: location.href,
    comps: [...new Set([...document.querySelectorAll('*')].map(e => e.tagName.toLowerCase()).filter(t => /^(app-|client|product|order)/.test(t)))],
    text: (document.querySelector('ion-content') || document.body).innerText.replace(/\n+/g, ' | ').slice(0, 800),
  })));
  return log;
};
