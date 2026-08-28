// Lista los elementos VISIBLES cuyo texto contiene FIND (o todos los cortos si no se da)
module.exports = async (pg) => {
  const find = process.env.FIND || '';
  return await pg.evaluate((find) => {
    const out = [];
    for (const e of document.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      if (getComputedStyle(e).visibility === 'hidden') continue;
      const t = (e.innerText || '').trim();
      if (!t || t.includes('\n')) continue;
      if (find ? !t.toLowerCase().includes(find.toLowerCase()) : t.length > 40) continue;
      const cx = Math.round(r.x + r.width / 2), cy = Math.round(r.y + r.height / 2);
      const top = document.elementFromPoint(cx, cy);
      out.push({ tag: e.tagName.toLowerCase(), txt: t.slice(0, 50), x: cx, y: cy,
                 hit: top ? top.tagName.toLowerCase() : null, self: top === e || (top && e.contains(top)) });
    }
    const seen = new Set(); const uniq = [];
    for (const i of out) { const k = i.txt + '@' + i.x + ',' + i.y; if (seen.has(k)) continue; seen.add(k); uniq.push(i); }
    return uniq.slice(0, 50);
  }, find);
};
