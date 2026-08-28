module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const mods = [...document.querySelectorAll('ion-modal')].map((m, i) => {
      const r = m.getBoundingClientRect();
      const cs = getComputedStyle(m);
      return {
        i, cls: String(m.className).slice(0, 90),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex,
        firstText: (m.innerText || '').replace(/\n+/g, ' | ').slice(0, 120),
      };
    });
    const pages = [...document.querySelectorAll('.ion-page')].map(p => ({
      tag: p.tagName.toLowerCase(), cls: String(p.className).slice(0, 70),
      hidden: p.classList.contains('ion-page-hidden'),
    }));
    // qué hay realmente pintado en el centro de la pantalla
    const probe = [];
    for (const y of [150, 300, 450, 600]) {
      const e = document.elementFromPoint(180, y);
      probe.push({ y, tag: e ? e.tagName.toLowerCase() : null, txt: e ? (e.innerText || '').trim().slice(0, 50) : null });
    }
    return { mods, pages, probe };
  });
};
