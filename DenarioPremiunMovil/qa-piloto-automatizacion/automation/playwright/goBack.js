const { sleep } = require('./lib');
module.exports = async (pg) => {
  const pt = await pg.evaluate(() => {
    const img = [...document.querySelectorAll('img')].find(i => /flecha-blanca|back|atras/i.test(i.src || ''));
    const el = img ? (img.closest('a') || img) : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, src: (img.src || '').split('/').pop() };
  });
  if (!pt) return 'no se encontró la flecha de volver';
  await pg.mouse.click(pt.x, pt.y);
  await sleep(2500);
  const url = await pg.evaluate(() => location.href);
  return { pt, url };
};
