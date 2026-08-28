module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const roots = ['app-home', 'ion-router-outlet', 'ion-app'].map(t => {
      const e = document.querySelector(t);
      if (!e) return { t, missing: true };
      const r = e.getBoundingClientRect();
      return { t, rect: [r.x, r.y, r.width, r.height], cls: String(e.className).slice(0, 80) };
    });
    // todos los elementos visibles con texto corto
    const items = [];
    for (const e of document.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) continue;
      const t = (e.innerText || '').trim();
      if (!t || t.length > 20 || t.includes('\n')) continue;
      items.push({ tag: e.tagName.toLowerCase(), txt: t, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
    }
    return { roots, vw: innerWidth, vh: innerHeight, items: items.slice(0, 60) };
  });
};
