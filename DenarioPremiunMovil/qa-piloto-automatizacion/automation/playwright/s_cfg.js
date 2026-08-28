module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      let v = localStorage.getItem(k);
      if (v && v.length > 300) v = v.slice(0, 300) + `...[${v.length}]`;
      ls[k] = v;
    }
    return { keys: Object.keys(ls), ls };
  });
};
