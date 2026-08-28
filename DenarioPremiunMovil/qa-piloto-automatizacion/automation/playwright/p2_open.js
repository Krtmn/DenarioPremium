const { sleep } = require('./lib');

module.exports = async (pg) => {
  const log = [];
  // 1) qué se ve en app-pedido
  const before = await pg.evaluate(() => {
    const root = document.querySelector('app-pedido');
    const items = [];
    for (const e of root.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight) continue;
      const t = (e.innerText || '').trim();
      if (!t || t.length > 60 || t.includes('\n')) continue;
      items.push({ tag: e.tagName.toLowerCase(), txt: t, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width) });
    }
    return items;
  });
  log.push({ visibles: before });

  // 2) tap sobre el campo Cliente
  const target = before.find(i => /Seleccione Cliente/i.test(i.txt));
  if (!target) { log.push('no hay campo Cliente visible'); return log; }
  const occl = await pg.evaluate(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return e ? { tag: e.tagName.toLowerCase(), txt: (e.innerText || '').trim().slice(0, 40) } : null;
  }, [target.x, target.y]);
  log.push({ tap: target, occl });
  await pg.mouse.click(target.x, target.y);
  await sleep(3500);

  // 3) estado del modal tras el tap
  log.push(await pg.evaluate(() => [...document.querySelectorAll('ion-modal')].map(m => ({
    cls: String(m.className).slice(0, 70),
    display: getComputedStyle(m).display,
    rect: (r => [Math.round(r.width), Math.round(r.height)])(m.getBoundingClientRect()),
  }))));
  return log;
};
