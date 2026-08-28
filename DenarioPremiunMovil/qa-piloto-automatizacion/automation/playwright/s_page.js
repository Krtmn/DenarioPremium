module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const pages = [...document.querySelectorAll('.ion-page')].filter(p => !p.classList.contains('ion-page-hidden'));
    const active = pages[pages.length - 1] || document.body;
    const items = [];
    for (const e of active.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const t = (e.innerText || '').trim();
      if (!t || t.length > 60 || t.includes('\n')) continue;
      items.push({ tag: e.tagName.toLowerCase(), txt: t, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
    }
    // dedup por texto+coord
    const seen = new Set(); const uniq = [];
    for (const i of items) { const k = i.txt + '@' + i.y; if (seen.has(k)) continue; seen.add(k); uniq.push(i); }
    return {
      url: location.href,
      activeTag: active.tagName.toLowerCase(),
      activeCls: String(active.className).slice(0, 80),
      text: active.innerText.replace(/\n+/g, ' | ').slice(0, 1500),
      items: uniq.slice(0, 70),
    };
  });
};
