'use strict';
/**
 * MATRIZ DE MONEDAS POR MÓDULO — el oráculo que faltaba.
 *
 * Uso:  node automation/db/currency-matrix.js <QA_CLIENTE> [--yaml]
 *
 * POR QUÉ EXISTE (escapes de la v21, 2026-08-25):
 *   Cuatro defectos llegaron a producción porque los guiones validaban PRESENCIA ("aparece un precio")
 *   y nunca CONFORMIDAD ("aparece en la moneda que este módulo tiene configurada"). La configuración
 *   que manda se ve en la web en `Empresa > Configuración > Módulos`, pero NUNCA se leía antes de correr:
 *   no estaba en el perfil del cliente ni en ningún guión. Sin ella no hay con qué comparar, y todo
 *   da PASS legítimamente. Este script la pone sobre la mesa en 2 segundos.
 *
 * QUÉ DEVUELVE
 *   1. La matriz: por cada uno de los 9 módulos → moneda por defecto (LOCAL/FUERTE), si muestra la
 *      conversión, y si el selector de monedas está habilitado.
 *   2. Las monedas local y fuerte de CADA empresa del tenant (para saber qué es "Bs" y qué es "$").
 *   3. Con `--yaml`, el bloque `currency_matrix:` listo para pegar en clientes/<slug>.yaml.
 *
 * ⚠ `currency_modules` NO tiene columna de empresa: la matriz es **única por tenant**, no por empresa.
 *   Lo que sí cambia por empresa es CUÁL moneda es la local y cuál la fuerte (`currency_enterprise`).
 *
 * ⚠ «LOCAL» NO QUIERE DECIR «BOLÍVARES». `local_currency_default` dice cuál de las dos monedas de la
 *   empresa manda, no cuál divisa es. En `run_vzla` la única moneda es **US$** y está marcada como
 *   local: un agente que asuma «LOCAL = Bs» cantaría FAIL en los 9 módulos. Traducir SIEMPRE con
 *   `_monedas_por_empresa`.
 *
 * 🔴 EL CRUCE DE MÓDULOS: la matriz se configura por módulo, pero las pantallas se MEZCLAN. El selector
 *   de clientes vive dentro de Pedidos y lee la config del módulo `cli`, no la de `ped`. Si `ped=FUERTE`
 *   y `cli=LOCAL`, el vendedor elige cliente en Bs dentro de un pedido en $. Por eso el script marca los
 *   CRUCES: probar cada módulo aislado jamás encuentra esta clase de defecto.
 */

const { execFileSync } = require('child_process');
const path = require('path');

const cliente = process.argv[2];
const wantYaml = process.argv.includes('--yaml');
if (!cliente) {
  console.log('ERR: uso: node automation/db/currency-matrix.js <QA_CLIENTE> [--yaml]');
  process.exit(1);
}

const QUERY = path.resolve(__dirname, 'query.js');
// opcional=true → devuelve null en vez de abortar (el esquema de VGs varía entre builds).
function q(sql, opcional) {
  let out;
  try {
    out = execFileSync(process.execPath, [QUERY, cliente, sql], { encoding: 'utf8' });
  } catch (e) {
    if (opcional) return null;
    console.log('ERR: ' + e.message); process.exit(1);
  }
  if (out.startsWith('ERR:')) {
    if (opcional) return null;
    console.log(out.trim()); process.exit(1);
  }
  try { return JSON.parse(out); } catch (e) {
    if (opcional) return null;
    console.log(out.trim()); process.exit(1);
  }
}

// ── 1. Matriz por módulo ────────────────────────────────────────────────────────
const matriz = q(`
  SELECT m.co_module, m.na_module,
         cm.local_currency_default, cm.show_conversion, cm.currency_selector
    FROM currency_modules cm
    JOIN modules m ON m.id_module = cm.id_module
   WHERE cm.co_operation <> 'D' AND m.co_operation <> 'D'
   ORDER BY cm.id_module`);

// ── 2. Monedas local / fuerte por empresa ───────────────────────────────────────
const monedas = q(`
  SELECT co_enterprise, co_currency, local_currency, hard_currency
    FROM currency_enterprise
   WHERE co_operation <> 'D'
   ORDER BY co_enterprise, hard_currency`);

// ── 3. Las dos VGs maestras ─────────────────────────────────────────────────────
// ⚠ El esquema en la NUBE es (clave, valor) — NO (na_variable, va_variable), como en otros builds.
//   Si cambia, estas dos salen vacías y el script sigue funcionando.
let currencyModuleVG = null, multiCurrencyVG = null;
const vgs = q(`SELECT clave, valor FROM global_configuration
                WHERE clave IN ('currencyModule','multiCurrency')`, true);
if (vgs) {
  for (const v of vgs) {
    if (v.clave === 'currencyModule') currencyModuleVG = String(v.valor);
    if (v.clave === 'multiCurrency') multiCurrencyVG = String(v.valor);
  }
}
const apagada = (v) => v !== null && /^(false|0)$/i.test(v);

// ── Agrupar monedas por empresa ─────────────────────────────────────────────────
const porEmpresa = {};
for (const m of monedas) {
  porEmpresa[m.co_enterprise] = porEmpresa[m.co_enterprise] || {};
  if (m.hard_currency) porEmpresa[m.co_enterprise].fuerte = m.co_currency;
  if (m.local_currency) porEmpresa[m.co_enterprise].local = m.co_currency;
}

const etiqueta = (r) => (r.local_currency_default ? 'LOCAL' : 'FUERTE');

// ── Salida ──────────────────────────────────────────────────────────────────────
if (!wantYaml) {
  console.log(`\n=== MATRIZ DE MONEDAS POR MÓDULO — ${cliente} ===`);
  if (multiCurrencyVG !== null) {
    console.log(`VG multiCurrency  = ${multiCurrencyVG}` +
      (apagada(multiCurrencyVG)
        ? '  🔴 MONOMONEDA → NUNCA deben verse dos montos. Si aparecen, es defecto.'
        : '  ✅ el tenant maneja 2 monedas'));
  }
  if (currencyModuleVG !== null) {
    console.log(`VG currencyModule = ${currencyModuleVG}` +
      (apagada(currencyModuleVG)
        ? '  🔴 APAGADA → la matriz NO se aplica; manda la moneda por defecto de la empresa'
        : '  ✅ encendida → la matriz de abajo es la que manda'));
  }

  console.log('\nMonedas por empresa:');
  for (const [emp, c] of Object.entries(porEmpresa)) {
    console.log(`  ${String(emp).padEnd(12)} local=${c.local || '?'}   fuerte=${c.fuerte || '?'}`);
  }

  console.log('\n| Módulo         | Moneda x defecto | Conversión | Selector |');
  console.log('|----------------|------------------|------------|----------|');
  for (const r of matriz) {
    console.log(
      `| ${r.na_module.padEnd(14)} | ${etiqueta(r).padEnd(16)} | ` +
      `${(r.show_conversion ? 'sí' : 'NO').padEnd(10)} | ${(r.currency_selector ? 'sí' : 'NO').padEnd(8)} |`
    );
  }

  // ── Cruces: pares de módulos que comparten pantalla con moneda distinta ────────
  const by = Object.fromEntries(matriz.map((r) => [r.co_module, r]));
  const PARES = [
    ['ped', 'cli', 'el selector de clientes DENTRO de Pedidos (saldo del cliente)'],
    ['ped', 'pro', 'la lista de productos DENTRO de Pedidos (precios)'],
    ['cob', 'cli', 'el selector de clientes DENTRO de Cobros (documentos por cobrar)'],
    ['dev', 'pro', 'la lista de productos DENTRO de Devoluciones'],
    ['inv', 'pro', 'la lista de productos DENTRO de Inventarios'],
    ['dep', 'cob', 'los cobros que se agrupan DENTRO de un Depósito'],
  ];
  const cruces = PARES.filter(([a, b]) => by[a] && by[b] &&
    by[a].local_currency_default !== by[b].local_currency_default);

  console.log('\n🔴 CRUCES DE MÓDULO — probar SIEMPRE, aislado no los encuentra:');
  if (!cruces.length) {
    console.log('  (ninguno: todos los pares comparten moneda por defecto)');
  } else {
    for (const [a, b, desc] of cruces) {
      console.log(`  ⚠ ${by[a].na_module} = ${etiqueta(by[a])}  pero  ${by[b].na_module} = ${etiqueta(by[b])}`);
      console.log(`     → revisar ${desc}`);
    }
  }

  const sinConversion = matriz.filter((r) => !r.show_conversion);
  if (sinConversion.length) {
    console.log('\n⚠ Módulos SIN conversión (deben mostrar UNA sola moneda; si aparecen dos, es defecto):');
    for (const r of sinConversion) console.log(`  · ${r.na_module} (${etiqueta(r)})`);
  }
  const sinSelector = matriz.filter((r) => !r.currency_selector);
  if (sinSelector.length) {
    console.log('\n⚠ Módulos SIN selector (el selector NO debe aparecer; si aparece, es defecto):');
    for (const r of sinSelector) console.log(`  · ${r.na_module}`);
  }
  console.log('');
} else {
  // Bloque listo para pegar en clientes/<slug>.yaml
  console.log('# ── Matriz de monedas por módulo (Empresa > Configuración > Módulos) ──────────');
  console.log('#   Generado con: node automation/db/currency-matrix.js ' + cliente + ' --yaml');
  console.log('#   Es el ORÁCULO de la familia K## (conformidad). Regenerar antes de cada corrida:');
  console.log('#   el cliente la cambia desde la web sin avisar.');
  console.log('currency_matrix:');
  if (multiCurrencyVG !== null) console.log(`  _multiCurrency_vg: ${multiCurrencyVG}`);
  if (currencyModuleVG !== null) console.log(`  _currencyModule_vg: ${currencyModuleVG}`);
  console.log('  _monedas_por_empresa:');
  for (const [emp, c] of Object.entries(porEmpresa)) {
    console.log(`    "${emp}": { local: "${c.local || '?'}", fuerte: ${c.fuerte ? '"' + c.fuerte + '"' : 'null'} }`);
  }
  for (const r of matriz) {
    console.log(`  ${r.co_module}:  # ${r.na_module}`);
    console.log(`    moneda_defecto: ${etiqueta(r)}`);
    console.log(`    show_conversion: ${r.show_conversion}`);
    console.log(`    currency_selector: ${r.currency_selector}`);
  }
}
