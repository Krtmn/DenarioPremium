module.exports = async (pg) => {
  return await pg.evaluate(() => {
    const el = document.querySelector('app-cliente-selector');
    if (!el) return { err: 'no existe app-cliente-selector' };
    const c = ng.getComponent(el);
    const proto = Object.getPrototypeOf(c);
    const metodos = Object.getOwnPropertyNames(proto).filter(n => n !== 'constructor');
    // props escalares
    const props = {};
    for (const k of Object.keys(c)) {
      const v = c[k];
      const t = typeof v;
      if (v === null || t === 'string' || t === 'number' || t === 'boolean') props[k] = v;
      else if (Array.isArray(v)) props[k] = `[array ${v.length}]`;
      else if (t === 'object') props[k] = `{${v.constructor ? v.constructor.name : 'obj'}}`;
      else props[k] = `<${t}>`;
    }
    // ejecutar los métodos del fix sobre los primeros clientes
    const lista = c.clientesFiltrados || c.clientes || c.clientesList || null;
    const muestras = [];
    if (Array.isArray(lista)) {
      for (const cli of lista.slice(0, 5)) {
        const row = { co: cli.coClient || cli.co_client, na: (cli.naClient || cli.na_client || '').slice(0, 32) };
        for (const m of ['getPrimarySaldo', 'getSecondarySaldo', 'getPrimaryCurrencyLabel', 'getSecondaryCurrencyLabel']) {
          if (typeof c[m] === 'function') { try { row[m] = c[m](cli); } catch (e) { row[m] = 'ERR:' + e.message; } }
        }
        row.nuBalance = cli.nuBalance !== undefined ? cli.nuBalance : cli.nu_balance;
        row.coCurrency = cli.coCurrency || cli.co_currency;
        muestras.push(row);
      }
    }
    return { metodos, props, listaKey: Array.isArray(lista) ? 'ok' : 'no encontrada', muestras };
  });
};
