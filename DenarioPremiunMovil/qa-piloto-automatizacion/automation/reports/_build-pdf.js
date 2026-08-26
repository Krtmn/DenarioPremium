'use strict';
/**
 * GENERADOR DE INFORME PDF — evidencia de corrida QA.
 *
 * Uso:  node automation/reports/_build-pdf.js <ruta-al-informe.html>
 *
 * Qué hace:
 *   1. Lee el HTML del informe.
 *   2. Sustituye cada <img src="ruta-relativa"> por un data: URI en base64
 *      ⇒ el PDF queda AUTOCONTENIDO: se envía por correo sin carpeta de imágenes al lado.
 *   3. Lanza Chrome headless con --print-to-pdf y deja el .pdf junto al .html.
 *
 * 💡 EFECTO SECUNDARIO QUE SALVÓ EL DÍA (2026-08-26): como el HTML intermedio lleva las imágenes
 *    empotradas, es una COPIA COMPLETA Y AUTOSUFICIENTE del informe. Cuando un `git clean` borró
 *    la carpeta de reportes, los informes se reconstruyeron extrayendo los base64 de esos HTML.
 *    ⇒ Si alguna vez hay que recuperar evidencia, buscar los `_tmp-embed-*.html` o los renders
 *      del scratchpad ANTES de dar nada por perdido.
 *
 * Por qué Chrome y no wkhtmltopdf/pandoc: son los únicos disponibles en las máquinas de QA
 * (verificado 2026-08-26). Chrome respeta @page, los acentos y los emoji de estado (✅ ❌ 🔴).
 *
 * ⚠ Las capturas de la app son verticales y grandes; el CSS del informe debe acotarlas
 *   (`max-height`) o cada una se come una página entera.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const CHROME_CANDIDATOS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

// ⚠ El SVG va con charset: sin él, Chrome lo interpreta como latin-1 y rompe los acentos internos.
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml;charset=utf-8',
};

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.log('ERR: uso: node automation/reports/_build-pdf.js <informe.html>');
  process.exit(1);
}
const abs = path.resolve(htmlPath);
if (!fs.existsSync(abs)) { console.log('ERR: no existe ' + abs); process.exit(1); }

const base = path.dirname(abs);
let html = fs.readFileSync(abs, 'utf8');

// ── 1. Empotrar imágenes ────────────────────────────────────────────────────────
let ok = 0; const fallidas = [];
html = html.replace(/<img([^>]*?)src=["']([^"']+)["']/gi, (m, pre, src) => {
  if (/^(data:|https?:)/i.test(src)) return m;              // ya empotrada o remota
  const img = path.resolve(base, decodeURIComponent(src));
  if (!fs.existsSync(img)) { fallidas.push(src); return m; }
  const mime = MIME[path.extname(img).toLowerCase()];
  if (!mime) { fallidas.push(src + ' (extensión no soportada)'); return m; }
  ok++;
  return `<img${pre}src="data:${mime};base64,${fs.readFileSync(img).toString('base64')}"`;
});

console.log(`Imágenes empotradas: ${ok}`);
if (fallidas.length) {
  // 🔴 No es cosmético: una captura que falta es EVIDENCIA que falta en el informe.
  console.log('⚠ NO se pudieron empotrar (el PDF saldrá SIN esta evidencia):');
  for (const f of fallidas) console.log('   · ' + f);
}

const tmpHtml = path.join(base, '_tmp-embed-' + path.basename(abs));
fs.writeFileSync(tmpHtml, html, 'utf8');

// ── 2. Imprimir a PDF ───────────────────────────────────────────────────────────
const chrome = CHROME_CANDIDATOS.find((c) => fs.existsSync(c));
if (!chrome) { console.log('ERR: no se encontró Chrome ni Edge.'); process.exit(1); }

const pdf = abs.replace(/\.html?$/i, '.pdf');
if (fs.existsSync(pdf)) fs.unlinkSync(pdf);   // que un PDF viejo no se confunda con uno nuevo

let chromeErr = '';
try {
  execFileSync(chrome, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--no-pdf-header-footer',                       // sin URL ni fecha del navegador en el pie
    '--print-to-pdf-no-header',
    '--print-to-pdf=' + pdf,
    'file:///' + tmpHtml.replace(/\\/g, '/'),
  ], { stdio: 'pipe', timeout: 180000 });
} catch (e) {
  // Chrome devuelve exit≠0 con warnings aunque el PDF salga bien: se valida por el archivo.
  chromeErr = String((e && (e.stderr || e.message)) || '').slice(0, 400);
}

// 🔴 Chrome escribe el PDF de forma ASÍNCRONA: el proceso puede retornar antes de que el archivo
//    esté completo. Comprobarlo de inmediato da un falso "no se generó" (mordido el 2026-08-26).
//    Se espera a que aparezca Y a que deje de crecer.
function esperarArchivo(p, ms) {
  const hasta = Date.now() + ms;
  let ultimo = -1, estable = 0;
  while (Date.now() < hasta) {
    if (fs.existsSync(p)) {
      const t = fs.statSync(p).size;
      if (t > 0 && t === ultimo) { if (++estable >= 2) return true; } else { estable = 0; }
      ultimo = t;
    }
    execFileSync(process.execPath, ['-e', 'setTimeout(()=>{},400)'], { stdio: 'ignore' });
  }
  return fs.existsSync(p) && fs.statSync(p).size > 0;
}

if (!esperarArchivo(pdf, 90000)) {
  console.log('ERR: Chrome no generó el PDF.' + (chromeErr ? '\n  stderr: ' + chromeErr : ''));
  console.log('  HTML empotrado conservado para diagnóstico: ' + tmpHtml);
  process.exit(1);
}

const magic = fs.readFileSync(pdf).subarray(0, 5).toString('latin1');
if (magic !== '%PDF-') { console.log('ERR: el archivo generado no es un PDF (magic=' + magic + ')'); process.exit(1); }

fs.unlinkSync(tmpHtml);
console.log('PDF OK  ' + pdf + '  (' + Math.round(fs.statSync(pdf).size / 1024) + ' KB)');
