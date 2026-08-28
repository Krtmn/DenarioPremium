module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const gc = JSON.parse(localStorage.getItem('globalConfiguration') || '[]');
    const map = {};
    for (const [k, v] of gc) map[k] = v;
    const wanted = Object.keys(map).filter(k => /curren|moneda|tasa|rate|conver|iva|enterprise/i.test(k));
    return { total: gc.length, relevant: Object.fromEntries(wanted.map(k => [k, map[k]])), all: Object.keys(map).sort() };
  });
};
