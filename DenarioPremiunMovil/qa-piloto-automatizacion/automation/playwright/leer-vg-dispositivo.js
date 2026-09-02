'use strict';
// leer-vg-dispositivo.js — Lee las VARIABLES GLOBALES EFECTIVAS del equipo.
//
// Uso:
//   node automation/playwright/leer-vg-dispositivo.js                 → las 182 claves
//   node automation/playwright/leer-vg-dispositivo.js cobros          → solo el grupo cobros
//   node automation/playwright/leer-vg-dispositivo.js igtf tolerancia → filtro libre por substring
//   node automation/playwright/leer-vg-dispositivo.js --yaml cobros   → pegable en clientes/{slug}.yaml
//
// 🔴 POR QUÉ ESTE SCRIPT EXISTE
// `global_configuration` de la NUBE **no trae los valores**: es un catálogo de
// variables disponibles, donde `valor='true'` significa "esta variable existe",
// no "vale true". Se comprobó en 4K el 02/09/2026:
//     prepaidRangeAmount → valor 'true', tipo_valor 'integer', items '1,10000'
// El valor real (10) solo aparece en el equipo. `global_configuration_client`
// tampoco alcanza: trae un subconjunto viejo (2023) y le faltan las claves de
// tolerancia y anticipo.
//
// ⇒ Para armar el perfil de un cliente, **esta es la fuente**; los dumps .md
//   sirven de contraste, pero quien manda es el dispositivo.
//
// Solo LEE `localStorage.globalConfiguration` (un Map serializado: array de
// pares [clave, valor]). No navega, no toca la UI, no escribe nada.
const { chromium } = require('playwright');

// Grupos de conveniencia: `... cobros` expande a todos estos substrings.
const GRUPOS = {
  cobros: ['prepaid', 'tolerancia', 'Tolerancia', 'igtf', 'IGTF', 'retention', 'Retention',
           'retencion', 'cobro', 'collection', 'Collection', 'payment', 'Payment',
           'difference', 'Difference', 'bank', 'Bank', 'comment', 'Comment', 'iva', 'Iva'],
  moneda:  ['currency', 'Currency', 'multiCurrency', 'tasa', 'Tasa', 'conversion', 'Conversion'],
  pedidos: ['order', 'Order', 'discount', 'Discount', 'price', 'Price', 'product', 'Product'],
  stock:   ['stock', 'Stock', 'warehouse', 'Warehouse', 'batch', 'Batch', 'expiration'],
};

const args = process.argv.slice(2);
const COMO_YAML = args.includes('--yaml');
const filtros = args.filter(a => !a.startsWith('--'))
  .flatMap(a => GRUPOS[a.toLowerCase()] || [a]);

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9220', { timeout: 20000 });
  const pg = b.contexts()[0].pages()[0];

  const todas = await pg.evaluate(() => {
    const raw = localStorage.getItem('globalConfiguration');
    if (!raw) return null;
    let v; try { v = JSON.parse(raw); } catch (_) { return null; }
    if (!Array.isArray(v)) return null;
    // Map serializado: [[clave, valor], ...]
    return Object.fromEntries(v.filter(p => Array.isArray(p) && p.length === 2));
  });

  await b.close();

  if (!todas) {
    console.error('ERR: no se pudo leer localStorage.globalConfiguration.');
    console.error('     ¿La app terminó de sincronizar la configuración? ¿El CDP apunta al WebView correcto?');
    process.exit(1);
  }

  const claves = Object.keys(todas)
    .filter(k => !filtros.length || filtros.some(f => k.toLowerCase().includes(f.toLowerCase())))
    .sort((a, b) => a.localeCompare(b));

  if (!claves.length) {
    console.log(`Sin coincidencias para: ${filtros.join(', ')}  (${Object.keys(todas).length} claves en total)`);
    return;
  }

  if (COMO_YAML) {
    for (const k of claves) {
      const v = todas[k];
      const val = /^(true|false)$/.test(v) ? v
                : /^-?\d+(\.\d+)?$/.test(v) ? v
                : `"${v}"`;
      console.log(`  ${k}: ${val}`);
    }
  } else {
    const ancho = Math.max(...claves.map(k => k.length));
    for (const k of claves) console.log(`${k.padEnd(ancho)}  ${todas[k]}`);
    console.log(`\n${claves.length} de ${Object.keys(todas).length} claves.`);
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
