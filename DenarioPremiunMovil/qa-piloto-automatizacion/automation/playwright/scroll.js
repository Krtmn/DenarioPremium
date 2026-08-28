const { sleep } = require('./lib');
module.exports = async (pg) => {
  const dy = parseInt(process.env.DY || '250', 10);
  await pg.mouse.move(180, 400);
  await pg.mouse.wheel(0, dy);
  await sleep(1200);
  return await pg.evaluate(() => {
    const pages = [...document.querySelectorAll('.ion-page')].filter(p => !p.classList.contains('ion-page-hidden'));
    const a = pages[pages.length - 1] || document.body;
    return { text: a.innerText.replace(/\n+/g, ' | ').slice(0, 700) };
  });
};
