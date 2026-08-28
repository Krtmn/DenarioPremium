module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const out = {};
    const tags = [...new Set([...document.querySelectorAll('*')].map(e => e.tagName.toLowerCase())
      .filter(t => /product|producto/.test(t)))];
    out.tags = tags;
    for (const t of tags) {
      const el = document.querySelector(t);
      if (!el) continue;
      let c; try { c = ng.getComponent(el); } catch (e) { continue; }
      if (!c) continue;
      const proto = Object.getPrototypeOf(c);
      const props = {};
      for (const k of Object.keys(c)) {
        const v = c[k], ty = typeof v;
        if (v === null || ty === 'string' || ty === 'number' || ty === 'boolean') props[k] = v;
        else if (Array.isArray(v)) props[k] = `[array ${v.length}]`;
      }
      out[t] = { ctor: proto.constructor.name, metodos: Object.getOwnPropertyNames(proto).filter(n => n !== 'constructor'), props };
    }
    return out;
  });
};
