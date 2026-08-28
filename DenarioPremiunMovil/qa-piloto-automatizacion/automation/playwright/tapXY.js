const { sleep } = require('./lib');
module.exports = async (pg) => {
  const x = parseFloat(process.env.TX), y = parseFloat(process.env.TY);
  const wait = parseInt(process.env.TAP_WAIT || '3000', 10);
  const occl = await pg.evaluate(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return e ? { tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 60), txt: (e.innerText || '').trim().slice(0, 50) } : null;
  }, [x, y]);
  await pg.mouse.click(x, y);
  await sleep(wait);
  const mods = await pg.evaluate(() => [...document.querySelectorAll('ion-modal')].map(m => ({
    cls: String(m.className).slice(0, 60), display: getComputedStyle(m).display,
    wh: (r => [Math.round(r.width), Math.round(r.height)])(m.getBoundingClientRect()),
  })));
  return { tap: [x, y], occl, mods };
};
