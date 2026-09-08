'use strict';
/**
 * pre-vuelo-cobros.js — Ficha de prueba de COBROS antes de correr nada.
 *
 * Lee las variables globales de **Cobros** de las TRES fuentes y las cruza:
 *
 *   1. WEB      — Empresa → Datos Empresa → Variables Globales → selector «Cobros»
 *                 lo que el administrador configuró
 *   2. EQUIPO   — `localStorage.globalConfiguration`
 *                 lo que la app está usando de verdad
 *   3. (BD)     — solo dice qué variables EXISTEN; `global_configuration` es un
 *                 catálogo, no los valores. Por eso no se usa como fuente aquí.
 *
 * 🔴 POR QUÉ ESTE SCRIPT EXISTE
 * El 07/09 se iban a construir los casos de tolerancia y anticipo con los valores
 * que teníamos anotados (tolerancia +9/−15, anticipo desde 10). Al leer el equipo
 * resultaron **±10 y 50**: el umbral del anticipo pasaba de 19 a 60. Los casos
 * habrían fallado sin que nada estuviera roto.
 *
 * 🔑 Y el cruce es lo que más valor tiene: si la WEB dice 85 y el EQUIPO dice 100,
 *    el cambio no bajó al dispositivo — y eso es un hallazgo, no un detalle.
 *
 * Uso:
 *   node automation/web/pre-vuelo-cobros.js 4k
 *   node automation/web/pre-vuelo-cobros.js 4k --solo-equipo    (sin abrir la web)
 *
 * Solo LEE. No cambia ninguna configuración.
 */

const fs = require('fs');
const path = require('path');
// playwright y js-yaml viven en automation/playwright/node_modules
const PW = path.join(__dirname, '..', 'playwright', 'node_modules');
const { chromium } = require(path.join(PW, 'playwright'));

const ROOT = path.resolve(__dirname, '..', '..');
const CLIENTE = process.argv[2];
const SOLO_EQUIPO = process.argv.includes('--solo-equipo');

if (!CLIENTE) {
  console.error('uso: node automation/web/pre-vuelo-cobros.js <cliente> [--solo-equipo]');
  process.exit(1);
}

// ── Las que gobiernan los casos que estamos construyendo ─────────────────────
// El orden es el del informe, agrupado por tema.
const FICHA = [
  ['— Tolerancia —', null],
  ['tolerancia0',              'permite enviar cobros que no cierran en 0'],
  ['TipoTolerancia',           '0 = Importe · 1 = Porcentaje'],
  ['RangoToleranciaPositiva',  'tope de diferencia a favor'],
  ['RangoToleranciaNegativa',  'tope de diferencia en contra'],
  ['MonedaTolerancia',         'moneda en la que se evalúa la tolerancia'],

  ['— Anticipo automático —', null],
  ['automatedPrepaid',         'genera abono automático por excedente'],
  ['prepaidRangeAmount',       'excedente mínimo para generar el abono'],
  ['prepaidRangeCurrency',     'moneda del excedente'],
  ['prepaidCurrency',          'moneda del anticipo'],
  ['prepaidPaymentMethod',     'nomenclatura del método (ej. "pa")'],
  ['cobroPrepago',             'submódulo Anticipo en el menú'],

  ['— Descuento —', null],
  ['userCanSelectCollectDiscount', 'el vendedor puede asignar descuento'],
  ['maxCollectDiscount',       '🔑 tope % de descuento (mejora nueva)'],

  ['— Detalle del documento (la lupa) —', null],
  // Sin esta VG no hay lupa, y sin lupa no hay detalle: ni descuento, ni
  // Nro Comp Ret, ni Dif. Devolución/Faltante. Condiciona 3 bloques de casos.
  ['retentionDocTypeCR',       '🔑 lupa que abre el DETALLE del documento'],

  ['— Retención —', null],
  ['retencion',                'campo de retención dentro del cobro'],
  ['cobroRetencion',           'submódulo Retención en el menú'],
  ['sizeRetention',            '🔑 dígitos EXACTOS del nro. de comprobante'],
  ['formatRetention',          'formato: números / letras / alfanumérico'],
  ['userCanAddRetention',      'retenciones libres, sin factura'],

  ['— Diferencias y pagos —', null],
  ['enableDifferenceCodes',    'selector de origen de diferencia en el método OTROS'],
  ['enablePartialPayment',     'pago parcial'],
  ['historicPartialPayment',   'histórico de pagos parciales'],
  ['colletionPayment',         'métodos de pago habilitados'],

  ['— Otros que condicionan casos —', null],
  ['requiredComment',          '🔑 comentario obligatorio: sin él no se habilitan las pestañas'],
  ['requiredCollectionAttachments', 'adjunto obligatorio para enviar'],
  ['userCanSelectIGTF',        'IGTF visible en el cobro'],
  ['userCanCollectIva',        'cobro de IVA'],
  ['multiCurrencyCollection',  'el vendedor elige moneda'],
  ['clientBankAccount',        'Banco Emisor en Transferencia'],
  ['currencyBank',             'ver todos los bancos sin importar la moneda'],
];

// ── Fuente 1 · el EQUIPO ─────────────────────────────────────────────────────
async function leerEquipo() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9220', { timeout: 15000 });
  try {
    const pg = b.contexts()[0].pages()[0];
    const todas = await pg.evaluate(() => {
      const raw = localStorage.getItem('globalConfiguration');
      if (!raw) return null;
      let v; try { v = JSON.parse(raw); } catch (_) { return null; }
      if (!Array.isArray(v)) return null;
      return Object.fromEntries(v.filter(p => Array.isArray(p) && p.length === 2));
    });
    return todas;
  } finally {
    await b.close().catch(() => {});
  }
}

// ── Fuente 2 · la WEB ────────────────────────────────────────────────────────
function credsWeb() {
  const t = fs.readFileSync(path.join(ROOT, 'secrets', 'qa-credentials.env'), 'utf8').split('\n');
  const i = t.findIndex(l => l.trim().toUpperCase().startsWith('# USUARIO WEB'));
  if (i === -1) throw new Error('no está el bloque "# USUARIO WEB" en qa-credentials.env');
  let u = null, p = null;
  for (let j = i + 1; j < Math.min(i + 12, t.length); j++) {
    const l = t[j].trim();
    if (l.startsWith('#') && /USUARIO/i.test(l)) break;
    if (l.startsWith('QA_USER=')) u = l.slice(8);
    if (l.startsWith('QA_PASSWORD=')) p = l.slice(12);
  }
  if (!u || !p) throw new Error('faltan QA_USER / QA_PASSWORD en el bloque de web');
  return { u, p };
}

function baseUrl() {
  const yaml = require(path.join(PW, 'js-yaml'));
  const py = yaml.load(fs.readFileSync(path.join(ROOT, 'automation', 'web', 'playas.yaml'), 'utf8'));
  const perfil = yaml.load(fs.readFileSync(path.join(ROOT, 'automation', 'clientes', `${CLIENTE}.yaml`), 'utf8'));
  // 🔴 La playa NO se guarda en el perfil (es rotativa). Se pasa por env o se prueban todas.
  const playa = process.env.QA_PLAYA;
  if (playa && py.playas[playa]) return { base: py.playas[playa].base, playa };
  return { base: null, playa: null, playas: py.playas };
}

async function leerWeb() {
  const { u, p } = credsWeb();
  const { base, playa, playas } = baseUrl();
  if (!base) {
    return { err: 'sin playa: exportá QA_PLAYA=<' + Object.keys(playas).join('|') + '>' };
  }

  // 🔴 No se lanza un navegador propio: no hay Chromium descargado en esta máquina
  //    (`npx playwright install` nunca se corrió) y además obligaría a un 2.º login.
  //    Se REUTILIZA el navegador que ya está abierto — el mismo del MCP de
  //    Playwright, que la QA usa para la web y suele tener la sesión viva.
  let b;
  try {
    b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 6000 });
  } catch (_) {
    return { err: 'no hay navegador web disponible. Abrí la web con el MCP de Playwright ' +
                  '(o lanzá Chrome con --remote-debugging-port=9222) y volvé a correr' };
  }
  try {
    const ctx = b.contexts()[0];
    const pg = ctx.pages().find(p => /DenarioPremium/.test(p.url())) || await ctx.newPage();
    if (!/DenarioPremium/.test(pg.url())) {
      await pg.goto(`${base}/pages/login.xhtml`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    // Si la sesión caducó, entrar. Si ya está dentro, seguir de largo.
    if (/login/.test(pg.url())) {
      await pg.fill('#j_idt12', u);
      await pg.fill('#j_idt14', p);
      await pg.click('#j_idt16');
      await pg.waitForTimeout(3500);
    }
    if (/login/.test(pg.url())) return { err: 'no entró a la web (¿credenciales de otra playa?)' };

    await pg.goto(`${base}/pages/variablesConfiguracion`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pg.waitForTimeout(2500);

    // Selector de tipo de variable → «Cobros» (valor 'C')
    await pg.evaluate(() => {
      const s = document.querySelector('#formGlobal\\:tipoVariable_input');
      if (s) { s.value = 'C'; s.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await pg.waitForTimeout(3000);

    // La tabla no tiene la clave: solo la DESCRIPCIÓN y el valor. Se devuelven
    // ambos y el cruce se hace por descripción → clave con el mapa de abajo.
    const filas = await pg.evaluate(() => {
      const t = document.querySelector('#formGlobal\\:tablaConf');
      if (!t) return [];
      return [...t.querySelectorAll('tbody tr')].map(r => {
        const desc = (r.querySelector('td') || {}).innerText || '';
        const sel = r.querySelector('select');
        const inp = r.querySelector('input[type=text]');
        return {
          desc: desc.replace(/\s+/g, ' ').trim(),
          valor: sel ? sel.value : (inp ? inp.value : null),
        };
      }).filter(f => f.desc && f.valor !== null);
    });
    return { playa, filas };
  } finally {
    // Con connectOverCDP, close() solo suelta la conexión: no cierra el
    // navegador de la QA ni su sesión. La pestaña queda como estaba.
    await b.close().catch(() => {});
  }
}

// Puentes descripción→clave, para las que más importan
const PUENTE = [
  [/monto máximo de tolerancia negativa/i, 'RangoToleranciaNegativa'],
  [/monto máximo de tolerancia positiva/i, 'RangoToleranciaPositiva'],
  [/moneda para evaluar el monto máximo de tolerancia/i, 'MonedaTolerancia'],
  [/cómo desea manejar el rango de tolerancia/i, 'TipoTolerancia'],
  [/cobros con diferencia\?/i, 'tolerancia0'],
  [/monto mínimo excedido .*abono automático/i, 'prepaidRangeAmount'],
  [/moneda para evaluar el monto mínimo excedido/i, 'prepaidRangeCurrency'],
  [/documento nuevo de abono automático/i, 'automatedPrepaid'],
  [/nomenclatura .*método de pago del abono/i, 'prepaidPaymentMethod'],
  [/cantidad de dígitos de su número de comprobante/i, 'sizeRetention'],
  [/formato posee su número de comprobante/i, 'formatRetention'],
  [/retenciones libres sin factura/i, 'userCanAddRetention'],
  [/prepagos\/anticipos/i, 'cobroPrepago'],
  [/opciòn de retención en el modulo/i, 'cobroRetencion'],
  [/retenciones de impuestos/i, 'retencion'],
  [/origen de diferencia/i, 'enableDifferenceCodes'],
  [/campo comentario sea obligatorio/i, 'requiredComment'],
  [/IGTF en el cobro/i, 'userCanSelectIGTF'],
  [/cuenta del banco del cliente/i, 'clientBankAccount'],
  [/todos los bancos sin importar la moneda/i, 'currencyBank'],
  [/moneda de la transacción en Cobros/i, 'multiCurrencyCollection'],
];

(async () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  PRE-VUELO · COBROS · ${CLIENTE.padEnd(38)}║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

  let equipo = null;
  try {
    equipo = await leerEquipo();
    console.log(`equipo: ${equipo ? Object.keys(equipo).length + ' variables leídas' : 'NO SE PUDO LEER'}`);
  } catch (e) {
    console.log('equipo: ERR ' + e.message);
  }

  let web = null;
  if (!SOLO_EQUIPO) {
    try {
      web = await leerWeb();
      console.log(`web:    ${web.err ? 'ERR ' + web.err : web.filas.length + ' variables leídas (playa ' + web.playa + ')'}`);
    } catch (e) {
      console.log('web:    ERR ' + e.message);
    }
  }

  // Cruce web→clave
  const webPorClave = {};
  if (web && web.filas) {
    for (const f of web.filas) {
      const m = PUENTE.find(([re]) => re.test(f.desc));
      if (m) webPorClave[m[1]] = f.valor;
    }
  }

  console.log('\n' + '─'.repeat(78));
  console.log('CLAVE'.padEnd(32) + 'EQUIPO'.padEnd(14) + 'WEB'.padEnd(14) + 'QUÉ ES');
  console.log('─'.repeat(78));

  const discrepancias = [];
  for (const [clave, desc] of FICHA) {
    if (desc === null) { console.log('\n' + clave); continue; }
    const eq = equipo ? (equipo[clave] ?? '—') : '?';
    const wb = webPorClave[clave] ?? '—';
    // normalizar para comparar: "10,00" vs "10", "true" vs "true"
    const norm = (x) => String(x).replace(',', '.').replace(/\.0+$/, '').trim().toLowerCase();
    const chocan = eq !== '—' && wb !== '—' && norm(eq) !== norm(wb);
    if (chocan) discrepancias.push({ clave, eq, wb });
    console.log(
      (chocan ? '⚠ ' : '  ') + clave.padEnd(30) +
      String(eq).padEnd(14) + String(wb).padEnd(14) + desc
    );
  }
  console.log('─'.repeat(78));

  if (discrepancias.length) {
    console.log(`\n🔴 ${discrepancias.length} DISCREPANCIA(S) entre la web y el equipo:`);
    for (const d of discrepancias) {
      console.log(`   ${d.clave}: web="${d.wb}" · equipo="${d.eq}"`);
    }
    console.log('   ⇒ el cambio de la web NO bajó al dispositivo. Sincronizar y volver a medir;');
    console.log('     si persiste, ES UN HALLAZGO.');
  } else if (web && !web.err) {
    console.log('\n✅ web y equipo coinciden en todas las variables cotejables.');
  }

  // ── La ficha que de verdad se usa para construir los casos ────────────────
  if (equipo) {
    const n = (k) => Number(String(equipo[k] ?? '').replace(',', '.'));
    const tolPos = n('RangoToleranciaPositiva');
    const prepaid = n('prepaidRangeAmount');
    console.log('\n' + '═'.repeat(78));
    console.log('FICHA DE PRUEBA — los números con los que hay que construir los casos');
    console.log('═'.repeat(78));

    if (Number.isFinite(tolPos) && Number.isFinite(prepaid)) {
      const umbral = tolPos + prepaid;
      console.log(`
  TOLERANCIA / ANTICIPO   (moneda: ${equipo.MonedaTolerancia || '?'})

    diferencia ≤ ${tolPos}            → dentro de tolerancia, Enviar directo
    ${(tolPos + 0.01).toFixed(2)} … ${(umbral - 0.01).toFixed(2)}        → excede tolerancia y NO alcanza el anticipo ⇒ debe BLOQUEAR
    ≥ ${umbral}                   → genera ANTICIPO AUTOMÁTICO

  🔑 El umbral del anticipo es la SUMA: tolerancia positiva (${tolPos}) + mínimo (${prepaid}) = ${umbral}
     (\`getAutomatedPrepaidActivationThreshold\`: positiveCeiling + prepaidMin)
     Confirma el punto 3 de desarrollo: el anticipo se valida DESPUÉS de la tolerancia.`);
    }

    const maxDto = equipo.maxCollectDiscount;
    if (maxDto) {
      const tope = Number(maxDto);
      console.log(`
  DESCUENTO

    tope: ${maxDto}%   → hasta ${maxDto}% debe ACEPTARSE
                  → ${tope + 1}% debe RECHAZARSE
    gated por userCanSelectCollectDiscount = ${equipo.userCanSelectCollectDiscount || '?'}

    ⚠ El tope NO se aplica a cada descuento por separado: se aplica a la SUMA de
      los seleccionados. Y al excederlo NO se clampea — el descuento que provocó
      el exceso SE QUITA de la selección y sale el aviso. Esperar «se queda en el
      máximo» lleva a reportar un falso defecto.

    ⚠ El botón «Asignar descuento» vive en el DETALLE del documento (la lupa 🔍),
      que solo existe si retentionDocTypeCR = ${equipo.retentionDocTypeCR || '?'} y solo se habilita
      con el documento TILDADO.`);

      // ── ¿El tope es alcanzable con el catálogo que hay? ─────────────────────
      //
      // 🔴 Esta es la comprobación que faltaba el 07/09: 4K tenía UN solo
      //    descuento (80 % fijo) y con eso el tope de 85 % NO SE PUEDE CRUZAR
      //    por UI. Sin este aviso, el caso del borde se "prueba" sin poder
      //    fallar nunca — el peor tipo de PASS.
      try {
        const { execFileSync } = require('child_process');
        const qp = path.join(ROOT, 'automation', 'db', 'query.js');
        const filas = JSON.parse(execFileSync('node', [qp, CLIENTE,
          'select na_collect_discount, nu_collect_discount, require_input from collect_discounts order by 1'],
          { encoding: 'utf8', timeout: 20000 }));

        const pcts     = filas.map(f => Number(f.nu_collect_discount) || 0);
        const editable = filas.some(f => f.require_input === true);
        const mayor    = pcts.length ? Math.max(...pcts) : 0;
        const dos      = pcts.slice().sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0);

        console.log(`
    catálogo (collect_discounts): ${filas.length} descuento(s)`);
        filas.forEach(f => console.log(
          `      · ${f.na_collect_discount} — ${f.nu_collect_discount}%` +
          (f.require_input ? '  (tasa EDITABLE)' : '  (tasa fija)')));

        const puedeExcederPorSuma = dos > tope;
        if (editable) {
          console.log(`
    ✅ el borde ${tope}/${tope + 1}% ES PROBABLE: hay un descuento con tasa editable.`);
        } else if (puedeExcederPorSuma) {
          console.log(`
    ✅ el rechazo ES PROBABLE por SUMA (los dos mayores suman ${dos}% > ${tope}%),
       pero NO el borde exacto ${tope}/${tope + 1}%: ninguna tasa es editable.`);
        } else {
          console.log(`
    🔴 EL TOPE ES INALCANZABLE CON ESTE CATÁLOGO.
       El mayor descuento es ${mayor}% y la suma de los dos mayores da ${dos}%, ambos ≤ ${tope}%,
       y ninguna tasa es editable (require_input=false ⇒ el % no se puede escribir).
       ⇒ Cualquier prueba del tope pasaría sin poder fallar.

       SALIDA 1 · desde la WEB, sin tocar la BD  ← la barata
         Empresa → Datos Empresa → Variables Globales → COBROS → maxCollectDiscount
           · ponerlo en ${mayor}   → el descuento de ${mayor}% debe ACEPTARSE (borde exacto)
           · ponerlo en ${mayor - 1}   → el mismo ${mayor}% debe RECHAZARSE y QUITARSE
         Devolverlo a ${tope} al terminar. ⚠ SINCRONIZAR el equipo tras cada cambio:
         el móvil lee su copia local de globalConfiguration, no la web.
         (no cubre: suma de dos descuentos, ni tasa escrita a mano)

       SALIDA 2 · ampliar el catálogo desde la WEB — si hacen falta esos dos casos
         Empresa → Configuración → Descuentos para Cobros  (CRUD propio)
           · uno FIJO chico (p. ej. 10%)  → ${mayor} + 10 = ${mayor + 10}% > ${tope}% ⇒ prueba el rechazo por SUMA
           · uno de TASA EDITABLE          → permite escribir ${tope} (acepta) y ${tope + 1} (rechaza)
         ⚠ SINCRONIZAR después: el catálogo baja en la tabla de sync 76.`);
        }
      } catch (e) {
        console.log(`
    ⚠ no se pudo leer el catálogo collect_discounts (${String(e.message).split('\n')[0]}).
      Comprobar a mano que haya con qué cruzar el ${maxDto}% antes de dar por probado el tope.`);
      }
    }

    console.log(`
  DIF. DEVOLUCIÓN / FALTANTE   —  ⚠ NO lo apaga enableDifferenceCodes

    El campo «Dif. Devolución/Faltante» vive en el DETALLE DEL DOCUMENTO
    (cobro-documents.component.html:735) y **no está condicionado por ninguna
    variable**: aparece siempre. HAY QUE PROBARLO.

    \`enableDifferenceCodes\` (= ${equipo.enableDifferenceCodes}) apaga OTRA cosa: el selector
    de «origen de diferencia» del método de pago OTROS (cobro-pagos:689).
    Confundirlos llevó a marcar el campo como no aplicable el 07/09 — lo
    detectó QA al ver que sí aparecía en el cobro.`);

    const sr = equipo.sizeRetention;
    if (sr) {
      console.log(`
  RETENCIÓN

    Nro Comp Ret: ${sr} dígitos EXACTOS (no "hasta ${sr}")
    formato: ${equipo.formatRetention === '0' ? 'solo números' : equipo.formatRetention}
    ⚠ el campo está en el DETALLE DEL DOCUMENTO, no en un submódulo`);
    }

    const casos = [];
    if (equipo.enableDifferenceCodes !== 'true') {
      casos.push('selector de origen de diferencia en el método OTROS (enableDifferenceCodes=false)');
    }
    if (equipo.userCanSelectIGTF !== 'true') casos.push('IGTF (userCanSelectIGTF=false)');
    if (equipo.userCanCollectIva !== 'true') casos.push('IVA (userCanCollectIva=false)');
    if (equipo.cobroRetencion !== 'true') casos.push('submódulo Retención del menú (cobroRetencion=false)');
    if (casos.length) {
      console.log('\n  NO APLICAN EN ESTE CLIENTE — deben salir N/A, no FAIL:');
      for (const c of casos) console.log('    · ' + c);
    }
    console.log('\n' + '═'.repeat(78) + '\n');
  }
})().catch(e => { console.error('ERR FATAL:', e.message); process.exit(1); });
