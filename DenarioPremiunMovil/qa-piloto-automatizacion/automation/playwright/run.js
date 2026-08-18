'use strict';
// Orquestador Playwright Standalone — Denario Premium Móvil QA
// Uso:
//   node automation/playwright/run.js run-vzla
//   node automation/playwright/run.js --cliente=run-vzla
//   node automation/playwright/run.js --cliente=run-vzla --modulo=login

const path = require('path');
const fs   = require('fs');
const yaml = require('js-yaml');
const { chromium } = require('playwright');
const { conectar, volverAHome } = require('./connect');

// ── Parsear args ──────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
let QA_CLIENTE = null, QA_MODULO = null;
for (const a of rawArgs) {
  if (a.startsWith('--cliente=')) QA_CLIENTE = a.split('=')[1];
  else if (a.startsWith('--modulo=')) QA_MODULO  = a.split('=')[1];
  else if (!QA_CLIENTE && !a.startsWith('--')) QA_CLIENTE = a;
}
if (!QA_CLIENTE) {
  console.error('Uso: node automation/playwright/run.js <QA_CLIENTE> [--modulo=<modulo>]');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..', '..');

// ── Leer perfil YAML ──────────────────────────────────────────────────────────
const yamlPath = path.join(ROOT, 'automation', 'clientes', `${QA_CLIENTE}.yaml`);
let perfil;
try {
  perfil = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
} catch (e) {
  console.error(`ERR: no se pudo leer ${yamlPath}: ${e.message}`);
  process.exit(1);
}

// ── Módulos disponibles ───────────────────────────────────────────────────────
const MODULOS = {
  login:       require('./modules/login').runLogin,
  clientes:    require('./modules/clientes').runClientes,
  pedidos:     null,       // pendiente
  cobros:      null,       // pendiente
  devoluciones:null,       // pendiente
  inventarios: require('./modules/inventarios').runInventarios,
  depositos:   require('./modules/depositos').runDepositos,
  visitas:     require('./modules/visitas').runVisitas,
  productos:   require('./modules/productos').runProductos,
  vendedores:  require('./modules/vendedores').runVendedores,
};

const ORDEN_DEFAULT = ['login','clientes','inventarios','depositos','visitas','productos','vendedores'];

// ── Construir DATA para cada módulo desde el perfil YAML ──────────────────────
function dataParaModulo(modulo) {
  const vgs     = perfil.vgs     || {};
  const modules = perfil.modules || {};
  const mod     = modules[modulo] || {};
  switch (modulo) {
    case 'login':
      return {};
    case 'clientes':
      return {
        aplica:          mod.aplica !== false,
        clienteBusqueda: mod.cliente_busqueda || 'A',
        clienteDetalle:  mod.cliente_detalle  || '',
      };
    case 'depositos':
      return { aplica: mod.aplica !== false };
    case 'inventarios':
      return {
        aplica:          true,
        clienteTest:     mod.cliente_test || '',
        expirationBatch: vgs.expirationBatch === true,
        suggestedOrder:  vgs.suggestedOrderByDispatchAndReturn === true,
      };
    case 'visitas':
      return {
        aplica:             true,
        clienteTest:        mod.cliente_test || '',
        signatureVisit:     vgs.signatureVisit === true,
        userCanUploadFiles: vgs.userCanUploadFiles === true,
        smokenaEstructural: mod.smoke_na_estructural || [],
      };
    case 'productos':
      return {
        tipoUnico:              mod.tipo_unico === true,
        textoBusqueda:          mod.texto_busqueda || 'A',
        estructuraTest:         mod.estructura_test || mod.tipo_estructura_default || '',
        userCanChangePriceList: vgs.userCanChangePriceList !== false,
      };
    case 'vendedores':
      return {
        aplica:     mod.aplica !== false,
        esVendedor: vgs.esVendedor !== false,
      };
    default:
      return {};
  }
}

// ── Crear carpeta de reporte ──────────────────────────────────────────────────
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const fecha = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
const hora  = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const RUN_DIR = path.join(ROOT, 'automation', 'reports', `playwright_${QA_CLIENTE}_${fecha}_${hora}`);
fs.mkdirSync(RUN_DIR, { recursive: true });

const RESULTS_FILE = path.join(RUN_DIR, '_results.jsonl');

function appendResult(modulo, v) {
  fs.appendFileSync(RESULTS_FILE, JSON.stringify({ modulo, ...v, runner: 'playwright-standalone' }) + '\n');
}

function buildMd(modulo, verdicts, msTotal) {
  const iconMap = { PASS: '✅', FAIL: '❌', SKIP: '⏭️', 'N/A': '⬜', BLOCKED: '🚫' };
  const lines = [`# ${modulo.toUpperCase()} — ${QA_CLIENTE}`, ''];
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

// ── Determinar módulos a correr ───────────────────────────────────────────────
const modulosFiltro = QA_MODULO
  ? [QA_MODULO]
  : ORDEN_DEFAULT.filter(m => MODULOS[m] !== null);

const invalidos = modulosFiltro.filter(m => !MODULOS[m]);
if (invalidos.length) {
  console.error(`ERR: módulo(s) no implementado(s): ${invalidos.join(', ')}`);
  console.error(`Disponibles: ${Object.keys(MODULOS).filter(m => MODULOS[m]).join(', ')}`);
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  QA Playwright Standalone · ${QA_CLIENTE.padEnd(17)}║`);
  console.log(`║  Módulos: ${modulosFiltro.join(', ').padEnd(35)}║`);
  console.log(`╚══════════════════════════════════════════════╝`);
  console.log(`RUN DIR: ${RUN_DIR}\n`);

  let pg;
  try {
    pg = await conectar();
    console.log('✓ CDP conectado\n');
  } catch (e) {
    console.error(`ERR: no se pudo conectar al CDP: ${e.message}`);
    console.error('Verificar: adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>');
    process.exit(1);
  }

  const totalStart = Date.now();
  const allVerdicts = [];

  for (let i = 0; i < modulosFiltro.length; i++) {
    const modulo = modulosFiltro[i];
    console.log(`[${i+1}/${modulosFiltro.length}] ${modulo}...`);

    // Asegurar HOME antes de cada módulo, excepto login (gestiona su propio estado)
    if (modulo !== 'login') {
      try { await volverAHome(pg); } catch (e) {
        console.warn(`    WARN volverAHome: ${e.message}`);
      }
    }

    const data = { ...dataParaModulo(modulo), clienteSlug: QA_CLIENTE };
    const t0 = Date.now();
    let verdicts, msTotal;

    try {
      const result = await MODULOS[modulo](pg, data);
      ({ verdicts, msTotal } = result);
      if (result.newPg) pg = result.newPg;
    } catch (e) {
      console.error(`    ERR no capturado en ${modulo}: ${e.message}`);
      verdicts = [{ id: modulo, descripcion: 'Error general', resultado: 'BLOCKED', nota: e.message, ms: Date.now() - t0 }];
      msTotal  = Date.now() - t0;
    }

    for (const v of verdicts) appendResult(modulo, v);
    fs.writeFileSync(path.join(RUN_DIR, `${modulo}.md`), buildMd(modulo, verdicts, msTotal));
    allVerdicts.push(...verdicts);

    const counts = verdicts.reduce((a, v) => { a[v.resultado] = (a[v.resultado]||0)+1; return a; }, {});
    console.log(`      ${verdicts.length} casos · ${(msTotal/1000).toFixed(1)}s · ${Object.entries(counts).map(([k,n])=>`${k}:${n}`).join(' ')}\n`);
  }

  // ── Resumen final ─────────────────────────────────────────────────────────
  const totalCounts = allVerdicts.reduce((a, v) => { a[v.resultado] = (a[v.resultado]||0)+1; return a; }, {});
  const totalMs = Date.now() - totalStart;
  console.log('═══════════════════════════════════════════');
  console.log(`RESUMEN · ${QA_CLIENTE} · ${(totalMs/60000).toFixed(1)} min`);
  console.log(`  PASS:${totalCounts.PASS||0}  FAIL:${totalCounts.FAIL||0}  SKIP:${totalCounts.SKIP||0}  N/A:${totalCounts['N/A']||0}  BLOCKED:${totalCounts.BLOCKED||0}  total:${allVerdicts.length}`);
  console.log(`  Reporte: ${RUN_DIR}`);
  console.log('═══════════════════════════════════════════\n');
})().catch(e => { console.error('ERR FATAL:', e.message); process.exit(1); });
