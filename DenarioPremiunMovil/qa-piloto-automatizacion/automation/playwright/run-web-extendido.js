'use strict';
// run-web-extendido.js — Orquestador web extendido (DWX-*) Denario Premium
//
// Uso:
//   node automation/playwright/run-web-extendido.js run-vzla
//   node automation/playwright/run-web-extendido.js run-vzla --bloque=cfg
//
// Bloques disponibles: cfg
// (más bloques se agregan a medida que se implementan)

const path = require('path');
const fs   = require('fs');
const yaml = require('js-yaml');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');

// ── Parsear args ──────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
let QA_CLIENTE = null, QA_BLOQUE = null;
for (const a of rawArgs) {
  if      (a.startsWith('--bloque='))   QA_BLOQUE  = a.split('=')[1];
  else if (!QA_CLIENTE && !a.startsWith('--')) QA_CLIENTE = a;
}
if (!QA_CLIENTE) {
  console.error('Uso: node automation/playwright/run-web-extendido.js <QA_CLIENTE> [--bloque=<bloque>]');
  process.exit(1);
}

// ── Leer perfil YAML ──────────────────────────────────────────────────────────
const yamlPath = path.join(ROOT, 'automation', 'clientes', `${QA_CLIENTE}.yaml`);
let perfil;
try {
  perfil = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
} catch (e) {
  console.error(`ERR: no se pudo leer ${yamlPath}: ${e.message}`);
  process.exit(1);
}

// ── Detectar playa desde ws_url ───────────────────────────────────────────────
const WS_URL = perfil.ws_url || '';
const PLAYAS_MAP = {
  'denariolatortuga': 'la_tortuga',
  'denarioislacoche': 'isla_coche',
  'denarioelyaque':   'el_yaque',
  'denariocaribe':    'caribe',
};
let playa = null;
for (const [k, v] of Object.entries(PLAYAS_MAP)) {
  if (WS_URL.toLowerCase().includes(k)) { playa = v; break; }
}
if (!playa) {
  console.error(`ERR: no se pudo detectar la playa desde ws_url: ${WS_URL}`);
  process.exit(1);
}

// ── Leer URL base ─────────────────────────────────────────────────────────────
const playasYamlPath = path.join(ROOT, 'automation', 'web', 'playas.yaml');
let playasConfig;
try {
  playasConfig = yaml.load(fs.readFileSync(playasYamlPath, 'utf8'));
} catch (e) {
  console.error(`ERR: no se pudo leer playas.yaml: ${e.message}`);
  process.exit(1);
}
const baseUrl = playasConfig.playas[playa] && playasConfig.playas[playa].base;
if (!baseUrl) {
  console.error(`ERR: playa "${playa}" no tiene URL en playas.yaml`);
  process.exit(1);
}

// ── Leer credenciales web ─────────────────────────────────────────────────────
function fetchWebCreds(playaSlug) {
  const credsPath = path.join(ROOT, 'secrets', 'qa-credentials.env');
  if (!fs.existsSync(credsPath)) return null;
  const content = fs.readFileSync(credsPath, 'utf8');
  const HEADERS = {
    la_tortuga: ['# USUARIO WEB LA TORTUGA', '# USUARIO WEB ISLA COCHE Y LA TORTUGA'],
    isla_coche: ['# USUARIO WEB ISLA COCHE', '# USUARIO WEB ISLA COCHE Y LA TORTUGA'],
    el_yaque:   ['# USUARIO WEB EL YAQUE'],
    caribe:     ['# USUARIO WEB ISLA COCHE Y LA TORTUGA', '# USUARIO WEB CARIBE'],
  };
  const lines = content.split('\n');
  for (const header of (HEADERS[playaSlug] || [])) {
    const idx = lines.findIndex((l) => l.trim().toLowerCase() === header.toLowerCase());
    if (idx === -1) continue;
    let user = null, pass = null;
    for (let i = idx + 1; i < Math.min(idx + 10, lines.length); i++) {
      const l = lines[i].trim();
      if (l.startsWith('#') && l.includes('USUARIO WEB')) break;
      if (l.startsWith('QA_USER='))     user = l.split('=').slice(1).join('=');
      if (l.startsWith('QA_PASSWORD=')) pass = l.split('=').slice(1).join('=');
      if (user && pass) return { user, pass };
    }
  }
  return null;
}

const creds = fetchWebCreds(playa);
if (!creds) {
  console.error(`ERR: no se encontraron credenciales web para playa "${playa}" en secrets/qa-credentials.env`);
  process.exit(1);
}

// ── Bloques disponibles ───────────────────────────────────────────────────────
const BLOQUES = {
  rep: { label: 'Reportes (Bloque 1)',            fn: require('../web/modules/extendido-rep').runRepExtendido },
  ind: { label: 'Indicadores (Bloque 2)',          fn: require('../web/modules/extendido-ind').runIndExtendido },
  fac: { label: 'Facturaciones (Bloque 3)',        fn: require('../web/modules/extendido-fac').runFacExtendido },
  mae: { label: 'Datos Maestros (Bloque 4)',       fn: require('../web/modules/extendido-mae').runMaeExtendido },
  vis: { label: 'Visitas planificación (Bloque 5)', fn: require('../web/modules/extendido-vis').runVisExtendido },
  est: { label: 'Estructura Comercial (Bloque 6)', fn: require('../web/modules/extendido-est').runEstExtendido },
  cfg: { label: 'Configuración (Bloque 7)',        fn: require('../web/modules/extendido-cfg').runCfgExtendido },
};

const bloquesOrden = ['rep', 'ind', 'fac', 'mae', 'vis', 'est', 'cfg'];
const bloquesFiltro = QA_BLOQUE ? [QA_BLOQUE] : bloquesOrden;
const invalidos = bloquesFiltro.filter((b) => !BLOQUES[b]);
if (invalidos.length) {
  console.error(`ERR: bloque(s) no implementado(s): ${invalidos.join(', ')}`);
  console.error(`Disponibles: ${Object.keys(BLOQUES).join(', ')}`);
  process.exit(1);
}

// ── Carpeta de reporte ────────────────────────────────────────────────────────
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const fecha = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
const hora  = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const RUN_DIR = path.join(ROOT, 'automation', 'reports', `web-extendido_${QA_CLIENTE}_${fecha}_${hora}`);
fs.mkdirSync(RUN_DIR, { recursive: true });

const RESULTS_FILE = path.join(RUN_DIR, '_web-results.jsonl');

function appendResult(bloque, v) {
  fs.appendFileSync(RESULTS_FILE, JSON.stringify({ bloque, ...v, runner: 'playwright-web-extendido', capa: 'web-extendido' }) + '\n');
}

function buildMd(bloque, verdicts, msTotal) {
  const iconMap = { PASS: '✅', FAIL: '❌', SKIP: '⏭️', 'N/A': '⬜', BLOCKED: '🚫' };
  const lines = [`# WEB EXTENDIDO · ${BLOQUES[bloque].label} — ${QA_CLIENTE}`, ''];
  for (const v of verdicts) {
    const icon = iconMap[v.resultado] || '❓';
    const nota = v.nota ? ` _(${v.nota})_` : '';
    lines.push(`- ${icon} **${v.id}** ${v.descripcion || ''}${nota}`);
  }
  const counts = verdicts.reduce((a, v) => { a[v.resultado] = (a[v.resultado]||0)+1; return a; }, {});
  lines.push('', `**Resumen:** ${Object.entries(counts).map(([k,n])=>`${k}:${n}`).join(' · ')}`);
  lines.push(`_Tiempo: ${(msTotal/1000).toFixed(1)}s_`);
  return lines.join('\n');
}

// ── Login web ─────────────────────────────────────────────────────────────────
async function loginWeb(pg) {
  await pg.goto(`${baseUrl}/pages/login.xhtml`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const loginPage = await pg.evaluate(() => location.pathname.includes('login'));
  if (!loginPage) return;
  await pg.fill('input[id*="usuario"], input[name*="usuario"], input[type="text"]:first-of-type', creds.user);
  await pg.fill('input[id*="clave"], input[name*="clave"], input[type="password"]', creds.pass);
  await pg.click('button[id*="ingresar"], button[type="submit"], input[type="submit"]');
  await pg.waitForURL((url) => !url.pathname.includes('login'), { timeout: 15000 });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  QA Web EXTENDIDO · ${QA_CLIENTE.padEnd(23)}║`);
  console.log(`║  Playa: ${playa.padEnd(37)}║`);
  console.log(`║  Bloques: ${bloquesFiltro.join(', ').padEnd(35)}║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`  URL: ${baseUrl}`);
  console.log(`  RUN DIR: ${RUN_DIR}\n`);

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const pg      = await context.newPage();

  try {
    console.log('  Iniciando sesión web...');
    await loginWeb(pg);
    const pathname = await pg.evaluate(() => location.pathname);
    if (pathname.includes('login')) {
      console.error('  ERR: Login fallido');
      await browser.close();
      process.exit(1);
    }
    console.log(`  ✓ Login OK (${pathname})\n`);

    const totalStart  = Date.now();
    const allVerdicts = [];

    for (let i = 0; i < bloquesFiltro.length; i++) {
      const bloque = bloquesFiltro[i];
      const info   = BLOQUES[bloque];
      console.log(`[${i+1}/${bloquesFiltro.length}] ${info.label}...`);

      let verdicts, msTotal;
      try {
        ({ verdicts, msTotal } = await info.fn(pg, { baseUrl, playa, perfil, clienteSlug: QA_CLIENTE, runDir: RUN_DIR }));
      } catch (e) {
        console.error(`    ERR no capturado en ${bloque}: ${e.message}`);
        verdicts = [{ id: `DWX-${bloque.toUpperCase()}-ERR`, descripcion: 'Error general', resultado: 'BLOCKED', nota: e.message }];
        msTotal  = 0;
      }

      for (const v of verdicts) appendResult(bloque, v);
      fs.writeFileSync(path.join(RUN_DIR, `extendido-${bloque}.md`), buildMd(bloque, verdicts, msTotal || 0));
      allVerdicts.push(...verdicts);

      const counts = verdicts.reduce((a, v) => { a[v.resultado] = (a[v.resultado]||0)+1; return a; }, {});
      console.log(`      ${verdicts.length} casos · ${((msTotal||0)/1000).toFixed(1)}s · ${Object.entries(counts).map(([k,n])=>`${k}:${n}`).join(' ')}\n`);
    }

    const totalCounts = allVerdicts.reduce((a, v) => { a[v.resultado] = (a[v.resultado]||0)+1; return a; }, {});
    const totalMs     = Date.now() - totalStart;
    console.log('═══════════════════════════════════════════');
    console.log(`RESUMEN WEB EXTENDIDO · ${QA_CLIENTE} · ${(totalMs/60000).toFixed(1)} min`);
    console.log(`  PASS:${totalCounts.PASS||0}  FAIL:${totalCounts.FAIL||0}  N/A:${totalCounts['N/A']||0}  BLOCKED:${totalCounts.BLOCKED||0}  total:${allVerdicts.length}`);
    console.log(`  Reporte: ${RUN_DIR}`);
    console.log('═══════════════════════════════════════════\n');

  } finally {
    await browser.close();
  }
})().catch(e => { console.error('ERR FATAL:', e.message); process.exit(1); });
