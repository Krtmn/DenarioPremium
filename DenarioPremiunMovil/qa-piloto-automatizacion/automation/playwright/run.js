#!/usr/bin/env node
/**
 * run.js — Orquestador de scripts determinísticos Denario Premium Móvil
 *
 * Uso:
 *   node automation/playwright/run.js --cliente=hidroponias
 *   node automation/playwright/run.js --cliente=globalmp --modulo=vendedores
 *
 * Prerrequisitos:
 *   1. npm install  (dentro de automation/playwright/)
 *   2. .\automation\cdp\setup-cdp.ps1  (dispositivo conectado, CDP en :9220)
 *   3. App abierta en HOME, sincronización terminada
 */

const path  = require('path');
const yaml  = require('js-yaml');
const fs    = require('fs');

const { conectar, esperarHome, volverAHome } = require('./connect');
const { crearCarpetaRun, escribirReporte } = require('./report');
const { fetchCreds }               = require('../cdp/denario-cdp-helpers');

// Módulos disponibles (añadir aquí al ir implementando los demás)
const MODULOS = {
  vendedores: require('./modules/vendedores').runVendedores,
  productos:  require('./modules/productos').runProductos,
  clientes:   require('./modules/clientes').runClientes,
};

// ─── Parsear args ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    if (k && v !== undefined) args[k] = v;
  });
  return args;
}

// ─── Leer perfil cliente ──────────────────────────────────────────────────────

function leerPerfil(clienteSlug) {
  const yamlPath = path.resolve(__dirname, '../clientes', `${clienteSlug}.yaml`);
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`Perfil no encontrado: ${yamlPath}`);
  }
  return yaml.load(fs.readFileSync(yamlPath, 'utf8'));
}

// ─── Extraer DATA relevante para cada módulo ──────────────────────────────────

function dataParaModulo(perfil, modulo) {
  const vgs     = perfil.vgs     || {};
  const modules = perfil.modules || {};
  const mod     = modules[modulo] || {};

  switch (modulo) {
    case 'vendedores':
      return {
        aplica:     mod.aplica !== false && vgs.esVendedor !== false,
        esVendedor: vgs.esVendedor !== false,
      };
    case 'productos':
      return {
        tipoUnico:             mod.tipo_unico === true,
        textoBusqueda:         mod.texto_busqueda || 'A',
        estructuraTest:        mod.estructura_test || '',
        userCanChangePriceList: vgs.userCanChangePriceList !== false,
      };
    case 'clientes':
      return {
        aplica:          mod.aplica !== false,
        clienteBusqueda: mod.cliente_busqueda || 'A',
        clienteDetalle:  mod.cliente_detalle  || '',
      };
    default:
      return { aplica: mod.aplica !== false };
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if (!args.cliente) {
    console.error('❌  Uso: node run.js --cliente=<slug> [--modulo=<modulo>]');
    console.error('   Módulos disponibles: ' + Object.keys(MODULOS).join(', '));
    process.exit(1);
  }

  const clienteSlug  = args.cliente;
  const modulosFiltro = args.modulo ? [args.modulo] : Object.keys(MODULOS);

  // Validar módulos pedidos
  const invalidos = modulosFiltro.filter(m => !MODULOS[m]);
  if (invalidos.length) {
    console.error(`❌  Módulo(s) no implementado(s): ${invalidos.join(', ')}`);
    console.error('   Disponibles: ' + Object.keys(MODULOS).join(', '));
    process.exit(1);
  }

  console.log(`\n🚀  QA Playwright — cliente: ${clienteSlug} | módulos: ${modulosFiltro.join(', ')}`);

  // Leer perfil y credenciales
  let perfil, creds;
  try {
    perfil = leerPerfil(clienteSlug);
    console.log(`✔   Perfil cargado: ${perfil.cliente_nombre || clienteSlug}`);
  } catch (e) {
    console.error('❌  ' + e.message); process.exit(1);
  }
  try {
    creds = await fetchCreds(clienteSlug);
    console.log(`✔   Credenciales OK (usuario: ${creds.user})`);
  } catch (e) {
    console.error('❌  ' + e.message); process.exit(1);
  }

  // Crear carpeta de reporte
  const { dir: runDir, nombre: runNombre } = crearCarpetaRun(clienteSlug);
  console.log(`📁  Reporte en: automation/reports/${runNombre}/`);

  // Conectar CDP
  let pg;
  try {
    console.log('\n🔌  Conectando CDP (:9220)...');
    pg = await conectar();
    console.log('✔   CDP conectado');
    await volverAHome(pg);
    console.log('✔   App en HOME\n');
  } catch (e) {
    console.error('❌  ' + e.message);
    process.exit(1);
  }

  // Ejecutar módulos
  const resumenGlobal = [];

  for (const modulo of modulosFiltro) {
    // Asegurar HOME antes de cada módulo (el módulo anterior puede haber terminado dentro de su vista)
    try { await volverAHome(pg); } catch (_) {}
    console.log(`▶   [${modulo.toUpperCase()}] iniciando...`);
    const data = dataParaModulo(perfil, modulo);
    data.clienteSlug = clienteSlug;
    const t0   = Date.now();

    let verdicts, msTotal;
    try {
      ({ verdicts, msTotal } = await MODULOS[modulo](pg, data));
    } catch (e) {
      console.error(`    ⛔  Error no capturado en ${modulo}: ${e.message}`);
      verdicts = [{ id: modulo, descripcion: 'Error general', resultado: 'BLOCKED', nota: e.message, ms: Date.now() - t0 }];
      msTotal  = Date.now() - t0;
    }

    const { pass, fail, na, blocked } = escribirReporte(runDir, modulo, verdicts, msTotal);
    const linea = `    ✔  ${modulo}: ${pass}P ${fail}F ${na}NA ${blocked}BLK — ${msTotal}ms`;
    console.log(linea);
    resumenGlobal.push({ modulo, pass, fail, na, blocked });
  }

  // Resumen final
  const totalFail = resumenGlobal.reduce((s, m) => s + m.fail, 0);
  const totalPass = resumenGlobal.reduce((s, m) => s + m.pass, 0);
  const totalNA   = resumenGlobal.reduce((s, m) => s + m.na, 0);

  console.log('\n' + '─'.repeat(50));
  console.log(`RESULTADO: ${totalPass} PASS · ${totalFail} FAIL · ${totalNA} N/A`);
  console.log(`Reportes en: automation/reports/${runNombre}/`);
  console.log('─'.repeat(50) + '\n');

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
