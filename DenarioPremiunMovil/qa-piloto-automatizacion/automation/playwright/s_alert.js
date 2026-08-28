module.exports = async (pg) => {
  const info = await pg.evaluate(() => {
    const alerts = [...document.querySelectorAll('ion-alert')].map(a => ({
      cls: a.className,
      text: a.innerText.replace(/\n+/g, ' | ').slice(0, 400),
      btns: [...a.querySelectorAll('button')].map(b => b.textContent.trim()),
    }));
    const comps = ['app-login', 'app-home', 'app-synchronization'].map(t => {
      const el = document.querySelector(t);
      return { tag: t, present: !!el, visible: el ? !!(el.offsetParent || el.getClientRects().length) : false };
    });
    return { alerts, comps, bodyText: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 600) };
  });
  return info;
};
