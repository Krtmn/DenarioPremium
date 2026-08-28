module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const out = {};
    // todos los custom elements no-ion presentes en el documento
    const tags = [...new Set([...document.querySelectorAll('*')]
      .map(e => e.tagName.toLowerCase())
      .filter(t => t.includes('-') && !t.startsWith('ion-')))];
    out.tags = tags;
    const probe = (el) => {
      try {
        const c = ng.getComponent(el);
        if (!c) return null;
        const proto = Object.getPrototypeOf(c);
        return {
          ctor: proto.constructor.name,
          metodos: Object.getOwnPropertyNames(proto).filter(n => n !== 'constructor'),
        };
      } catch (e) { return { err: e.message }; }
    };
    out.comps = {};
    for (const t of tags) {
      for (const el of document.querySelectorAll(t)) {
        const p = probe(el);
        if (p && p.ctor) { out.comps[t] = p; break; }
      }
    }
    return out;
  });
};
