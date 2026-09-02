'use strict';
// manifest.js — Extrae refs y marcas BD del _results.jsonl de una corrida móvil
// para pasarlas como manifiesto a los módulos web (casos C##).

const fs = require('fs');
const path = require('path');

/**
 * @typedef {{ref:string|null, bdMarca:string|null, epoch:string|null, nota:string}} ManifestEntry
 * @typedef {{visitas:ManifestEntry|null, clientes:ManifestEntry|null, inventarios:ManifestEntry|null,
 *            depositos:ManifestEntry|null, cobros:ManifestEntry|null, pedidos:ManifestEntry|null,
 *            devoluciones:ManifestEntry|null}} Manifest
 */

// Qué caso de cada módulo produce el registro enviado al servidor
const ENVIO_POR_MODULO = {
  visitas:     (r) => r.modulo === 'visitas'     && r.id === 'DM-VIS-020',
  clientes:    (r) => r.modulo === 'clientes'    && r.id === 'DM-CLT-026',
  inventarios: (r) => r.modulo === 'inventarios' && /DM-INV-0\d\d/.test(r.id) && /BD-(?:LOCAL-)?OK/.test(r.nota || ''),
  depositos:   (r) => r.modulo === 'depositos'   && /BD-OK/.test(r.nota || ''),
  cobros:      (r) => r.modulo === 'cobros'      && /BD-OK/.test(r.nota || ''),
  pedidos:     (r) => r.modulo === 'pedidos'     && /BD-OK/.test(r.nota || ''),
  devoluciones:(r) => r.modulo === 'devoluciones'&& /BD-OK/.test(r.nota || ''),
};

/**
 * Extrae ref del servidor de la nota (BD-OK(id=XXX,...) o ref potencial: XXX).
 * @param {string} nota
 * @returns {string|null}
 */
function extraerRef(nota) {
  const s = String(nota || '');
  // BD-OK(id=2153,...) o BD-LOCAL-OK(id=198,...)
  const m1 = s.match(/BD-(?:LOCAL-)?OK\(id=(\d+)/);
  if (m1) return m1[1];
  // ref potencial: 198
  const m2 = s.match(/ref potencial[:\s]+(\d+)/i);
  if (m2) return m2[1];
  // Nro.Ref: 526
  const m3 = s.match(/(?:Nro\.?Ref|ref)[:\s]+(\d+)/i);
  if (m3) return m3[1];
  return null;
}

function extraerMarcaBD(nota) {
  const s = String(nota || '');
  const m = s.match(/\b(BD-OK|BD-LOCAL-OK|BD-FIELD-OK|BD-SAVED|BD-QUEUED|BD-MISMATCH|BD-N\/A)\b/);
  return m ? m[1] : null;
}

function extraerEpoch(nota) {
  const m = String(nota || '').match(/\b(\d{13})\b/);
  return m ? m[1] : null;
}

/**
 * Lee un _results.jsonl y construye el manifiesto para la capa web.
 * @param {string} resultsPath  Ruta al archivo _results.jsonl
 * @returns {Manifest}
 */
function buildManifest(resultsPath) {
  const manifest = {};
  for (const key of Object.keys(ENVIO_POR_MODULO)) manifest[key] = null;

  if (!resultsPath || !fs.existsSync(resultsPath)) return manifest;

  const lines = fs.readFileSync(resultsPath, 'utf8').split('\n').filter(Boolean);
  const results = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

  for (const r of results) {
    for (const [mod, matcher] of Object.entries(ENVIO_POR_MODULO)) {
      if (manifest[mod]) continue; // ya encontrado
      if (!matcher(r)) continue;
      const nota = r.nota || '';
      manifest[mod] = {
        ref:      extraerRef(nota),
        bdMarca:  extraerMarcaBD(nota),
        epoch:    extraerEpoch(nota),
        nota,
      };
    }
  }
  return manifest;
}

/**
 * Auto-detecta el _results.jsonl más reciente para un cliente dado.
 * @param {string} repoRoot
 * @param {string} clienteSlug
 * @returns {string|null}
 */
function detectarUltimoRun(repoRoot, clienteSlug) {
  // 🔴 Las corridas de script viven en `reports/{cliente}/`, no en la raíz.
  //    Formas válidas del runner móvil: `script_{cliente}_...` (completa) y
  //    `script-{modulo}_{cliente}_...`; `script-web…` es de los runners web.
  const baseCliente = path.join(repoRoot, 'automation', 'reports', clienteSlug);
  if (!fs.existsSync(baseCliente)) return null;
  // 🔴 Ordenar por el TIMESTAMP del final, no por el nombre: en ASCII `_` > `-`,
  //    así que `script_…_20260901` quedaba después de `script-cobros_…_20260902`
  //    y "la última corrida" salía siendo la más vieja.
  const tsDe = (d) => (d.match(/(\d{8}_\d{6})$/) || ['', ''])[1];
  const dirs = fs.readdirSync(baseCliente)
    .filter((d) => (d.startsWith('script_') || d.startsWith('script-')) &&
                   !d.startsWith('script-web') &&
                   d.includes(`_${clienteSlug}_`))
    .sort((a, b) => tsDe(b).localeCompare(tsDe(a)));
  for (const d of dirs) {
    const f = path.join(baseCliente, d, '_results.jsonl');
    if (fs.existsSync(f)) return f;
  }
  return null;
}

module.exports = { buildManifest, detectarUltimoRun, extraerRef, extraerMarcaBD };
