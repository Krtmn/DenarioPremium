module.exports = async (pg) => {
  const out = { url: pg.url() };
  out.dom = await pg.evaluate(() => {
    const tags = [...new Set([...document.querySelectorAll('ion-app *')].map(e => e.tagName.toLowerCase()).filter(t => t.startsWith('app-') || t.includes('-')))].slice(0, 60);
    const titles = [...document.querySelectorAll('ion-title')].map(e => e.textContent.trim()).filter(Boolean);
    const visibleText = (document.querySelector('ion-content') || document.body).innerText.slice(0, 1200);
    return { titles, tags, visibleText };
  });
  return out;
};
