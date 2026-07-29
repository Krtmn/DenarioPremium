/**
 * web-helpers.test.js — Self-test de la lógica pura de los helpers web.
 * Corre SIN navegador:  node automation/web/web-helpers.test.js
 *
 * Los casos usan DATOS REALES capturados en el reconocimiento F0
 * (Isla Coche · CAPITALINA DE ALIMENTOS 212, C.A. · 2026-07-28).
 */

const H = require('./web-helpers.js');

let ok = 0, fail = 0;
const t = (desc, cond) => { if (cond) ok++; else { fail++; console.error('  FAIL: ' + desc); } };
const eq = (desc, a, b) => t(`${desc} (esperaba ${JSON.stringify(b)}, dio ${JSON.stringify(a)})`, JSON.stringify(a) === JSON.stringify(b));

// ── Mapa de módulos y guarda de contexto ────────────────────────────────────
eq('7 módulos mapeados', Object.keys(H.MODULOS).length, 7);
eq('moduloDe reconoce la lista de cobros', H.moduloDe('/DenarioPremium/pages/cobros'), 'cobros');
eq('moduloDe reconoce el detalle legacy de visitas', H.moduloDe('/DenarioPremium/pages/protected/visitas/detalleVisita.xhtml'), 'visitas');
t('verificarContexto acepta el pathname correcto', H.verificarContexto('/DenarioPremium/pages/depositos', 'depositos', false).ok);
t('verificarContexto RECHAZA otro módulo con la misma tabla (form:pedidosDT)', !H.verificarContexto('/DenarioPremium/pages/depositos', 'pedidos', false).ok);
t('verificarContexto distingue lista de detalle', !H.verificarContexto('/DenarioPremium/pages/cobros', 'cobros', true).ok);

// ── GUARDA DE PLAYA — regresión real 2026-07-28 ──────────────────────────────
// Las 3 playas exponen las MISMAS rutas: mirar solo el pathname deja al agente ciego al
// servidor. Paso de verdad: se leyo Isla Coche creyendo que era La Tortuga.
eq('playaDe reconoce La Tortuga', H.playaDe('denariolatortuga.ddns.net:8080'), 'la_tortuga');
eq('playaDe reconoce Isla Coche', H.playaDe('denarioislacoche.ddns.net:8080'), 'isla_coche');
eq('playaDe reconoce El Yaque', H.playaDe('denarioelyaque.ddns.net:8080'), 'el_yaque');
const ctxCoche   = { host: 'denarioislacoche.ddns.net:8080', pathname: '/DenarioPremium/pages/cobros' };
const ctxTortuga = { host: 'denariolatortuga.ddns.net:8080', pathname: '/DenarioPremium/pages/cobros' };
t('MISMA ruta en playa equivocada → RECHAZA', !H.verificarContexto(ctxCoche, 'cobros', false, 'la_tortuga').ok);
eq('…y dice exactamente cuál es el problema',
  H.verificarContexto(ctxCoche, 'cobros', false, 'la_tortuga').playaActual, 'isla_coche');
t('playa correcta + ruta correcta → acepta', H.verificarContexto(ctxTortuga, 'cobros', false, 'la_tortuga').ok);
t('pathname suelto NO permite validar la playa (obliga a pasar el contexto completo)',
  !H.verificarContexto('/DenarioPremium/pages/cobros', 'cobros', false, 'la_tortuga').ok);
t('el bundle DOM expone el host en contexto()', /host:\s*location\.host/.test(H.BUNDLE_DOM));
// ✅ corregido 2026-07-28: visitas SÍ tiene filtro # Ref (input[placeholder="# Ref"]); el único sin filtro
// es clientes potenciales (aunque su LISTA sí trae la columna # Ref).
eq('solo clientes potenciales carece de filtro # Ref',
  [H.MODULOS.clientes_potenciales.filtroRef, H.MODULOS.visitas.filtroRef, H.MODULOS.cobros.filtroRef], [false, true, true]);
// El lector de cabecera DOM-aware evita el bug de "la hoja siguiente": en detalleVisita, `Titulo:` es el
// último campo antes de la tabla hija y la regla vieja lo llenaba con el encabezado "N°" (valor FALSO).
t('BUNDLE_DOM expone leerCabecera (lector padre-primero)', /leerCabecera:/.test(H.BUNDLE_DOM));
t('leerCabecera lee del PADRE, no de la hoja siguiente', /pt\.startsWith\(t\)/.test(H.BUNDLE_DOM));
t('leerCabecera acota el valor (evita que "Ubicación:" absorba el mapa)', /v\.length > tope/.test(H.BUNDLE_DOM));

// ── Ruido de plantilla ──────────────────────────────────────────────────────
t('descarta el dashboard demo', H.esRuido('Rain Clothing') && H.esRuido('12K') && H.esRuido('Tamas Bunce'));
t('descarta el menú', H.esRuido('Transacciones') && H.esRuido('Indicadores'));
t('descarta "N mins ago"', H.esRuido('23 mins ago'));
t('NO descarta un dato real', !H.esRuido('No. de Ref.:') && !H.esRuido('1801'));

// ── Cabecera del detalle (hojas reales de /pages/detallePedido) ──────────────
const hojasPedido = ['Transacciones', 'Detalle Pedido', 'Rain Clothing', '12K', '3 mins ago',
  'No. de Ref.:', '1801', 'Código pedido:', '1785243271076.0', 'Fecha del pedido:', '28/07/2026 09:06:36',
  'Vendedor:', '01 01', 'Empresa:', 'CAPITALINA DE ALIMENTOS 212, C.A.',
  'No. Orden de compra:', 'Plataforma:', '¿Por Aprobar?:', 'NO'];
const cab = H.emparejarCabecera(hojasPedido);
eq('cabecera: No. de Ref.', cab['No. de Ref.'], '1801');
eq('cabecera: fecha', cab['Fecha del pedido'], '28/07/2026 09:06:36');
eq('cabecera: empresa', cab['Empresa'], 'CAPITALINA DE ALIMENTOS 212, C.A.');
eq('cabecera: campo VACÍO en la web queda vacío, no toma la etiqueta siguiente', cab['No. Orden de compra'], '');
eq('cabecera: campo tras uno vacío se lee bien', cab['¿Por Aprobar?'], 'NO');
t('cabecera: el ruido no entra', !('Rain Clothing' in cab) && !('12K' in cab));
eq('cabecera: normaliza "Cédula::"', H.emparejarCabecera(['Cédula::', '12920139'])['Cédula'], '12920139');

// ── Celdas con el encabezado pegado ─────────────────────────────────────────
eq('limpiarCelda # Ref', H.limpiarCelda('# Ref', '# Ref526'), '526');
eq('limpiarCelda monto', H.limpiarCelda('Monto cobrado', 'Monto cobrado 50.687,24 BS'), '50.687,24 BS');
eq('limpiarCelda tasa', H.limpiarCelda('Tasa conv.', 'Tasa conv.724,00 BS = 1 US$'), '724,00 BS = 1 US$');
eq('limpiarCelda con celda vacía', H.limpiarCelda('Nro Retención', 'Nro Retención'), '');
eq('limpiarCelda no rompe si no hay prefijo', H.limpiarCelda('# Ref', '526'), '526');

// ── Celdas <select> (respaldo textual) ──────────────────────────────────────
eq('valorDeSelect: estatus real de cobros',
  H.valorDeSelect(H.limpiarCelda('Estatus del Cobro', 'Estatus del CobroAprobadoPendientePor aprobarRechazadoPor aprobar')),
  'Por aprobar');
eq('valorDeSelect: otra opción seleccionada',
  H.valorDeSelect('AprobadoPendientePor aprobarRechazadoAprobado'), 'Aprobado');

// ── Parseo es-VE ────────────────────────────────────────────────────────────
eq('parseNumeroVE millones', H.parseNumeroVE('2.000.000,00'), 2000000);
eq('parseNumeroVE con moneda', H.parseNumeroVE('50.687,24 BS'), 50687.24);
eq('parseNumeroVE sin decimales', H.parseNumeroVE('16,85 US$'), 16.85);
eq('parseNumeroVE vacío → null', H.parseNumeroVE(''), null);
eq('parseMoneda BS', H.parseMoneda('50.687,24 BS'), { valor: 50687.24, moneda: 'BS' });
eq('parseMoneda US$', H.parseMoneda('70,01 US$'), { valor: 70.01, moneda: 'US$' });
eq('parseTasa', H.parseTasa('724,00 BS = 1 US$'), 724);
eq('parseFechaVE', H.parseFechaVE('28/07/2026 09:06:36'), { dia: '2026-07-28', hora: '09:06:36' });
eq('parseFechaVE sin hora', H.parseFechaVE('27/07/2026'), { dia: '2026-07-27', hora: null });
eq('parseFechaVE inválida', H.parseFechaVE('no es fecha'), null);
eq('parseEpoch (co_x del móvil)', H.parseEpoch('Código pedido: 1785243271076.0'), 1785243271076);
eq('parseEpoch en clientes potenciales', H.parseEpoch('1785244841833.0'), 1785244841833);

// ── parseNumeroFlexible: móvil (crudo) vs web (es-VE) — el falso mismatch que cazó el self-test ──
eq('flexible: payload del móvil (punto decimal)', H.parseNumeroFlexible('2000000.00'), 2000000);
eq('flexible: número JSON tal cual', H.parseNumeroFlexible(2000000), 2000000);
eq('flexible: web es-VE con moneda', H.parseNumeroFlexible('2.000.000,00 BS'), 2000000);
eq('flexible: es-VE de miles SIN decimales', H.parseNumeroFlexible('2.000.000'), 2000000);
eq('flexible: decimal es-VE', H.parseNumeroFlexible('16,85 US$'), 16.85);
eq('flexible: entero simple', H.parseNumeroFlexible('526'), 526);
t('⚠ el parser es-VE solo NO sirve para el payload del móvil (por eso existe el flexible)',
  H.parseNumeroVE('2000000.00') !== 2000000);
t('móvil crudo y web es-VE se comparan iguales',
  H.igual(H.parseNumeroFlexible('2000000.00'), H.parseNumeroFlexible('2.000.000,00 BS')));

// ── Oráculo de conversión — los 3 cobros REALES de capitalina ───────────────
const casos = [
  ['526', '50.687,24 BS', '724,00 BS = 1 US$', '70,01 US$'],
  ['525', '2.000.000,00 BS', '724,00 BS = 1 US$', '2.762,43 US$'],
  ['519', '47.950,52 BS', '724,00 BS = 1 US$', '66,23 US$'],
];
for (const [ref, monto, tasa, conv] of casos) {
  t(`conversión OK en el cobro real #${ref} (BS→US$, divide)`, H.verificarConversion(monto, tasa, conv).ok === true);
}
t('conversión detecta un valor mal calculado', H.verificarConversion('50.687,24 BS', '724,00 BS = 1 US$', '99,99 US$').ok === false);
eq('conversión con datos incompletos no juzga', H.verificarConversion('50,00', null, '1,00').ok, null);

// ── DIRECCIÓN DE LA CONVERSIÓN — regresión real el_valle-20260728 ──────────────
// No siempre se divide: en La Tortuga la transacción es en US$ y la conversión va a BS.
// Asumir división daba un falso WEB-CALC-MISMATCH.
eq('deduce DIVIDIR cuando BS→US$', H.verificarConversion('50.687,24 BS', '724,00 BS = 1 US$', '70,01 US$').direccion, 'dividir');
eq('deduce MULTIPLICAR cuando US$→BS', H.verificarConversion('30,00 US$', '725,75 BS = 1 US$', '21.772,50 BS').direccion, 'multiplicar');
t('caso real el_valle: 30,00 US$ × 725,75 = 21.772,50 BS', H.verificarConversion('30,00 US$', '725,75 BS = 1 US$', '21.772,50 BS').ok === true);
t('caso real el_valle línea 1: 9,60 × 725,75 = 6.967,20', H.verificarConversion('9,60 US$', '725,75 BS = 1 US$', '6.967,20 BS').ok === true);
t('US$→BS con valor mal calculado se detecta', H.verificarConversion('30,00 US$', '725,75 BS = 1 US$', '9.999,00 BS').ok === false);
eq('sin monedas legibles NO adivina: no juzga', H.verificarConversion('30,00', '725,75', '21.772,50').ok, null);
t('opts.direccion fuerza el sentido', H.verificarConversion('30,00', '725,75', '21.772,50', { direccion: 'multiplicar' }).ok === true);
t('compat: 4º arg numérico se sigue tomando como tolerancia', H.verificarConversion('50.687,24 BS', '724,00 BS = 1 US$', '70,02 US$', 0.05).ok === true);

// ── Oráculo de depósito: Σ(cobros hijos) == monto depositado ────────────────
t('suma de cobros cuadra con el depósito', H.verificarSuma(['10,00 US$', '6,85 US$'], '16,85 US$').ok === true);
t('suma detecta faltante', H.verificarSuma(['10,00 US$'], '16,85 US$').ok === false);
t('tolerancia de redondeo (< 0,01) no es mismatch', H.igual(2762.4309, 2762.43));
t('diferencia real sí es mismatch', !H.igual(2762.43, 2763.00));

// ── Fechas: veredicto por día ───────────────────────────────────────────────
t('misma fecha distinta hora = mismo día (UTC-4 vs UTC)', H.mismoDia('28/07/2026 09:06:36', '28/07/2026 13:06:36'));
t('días distintos NO son el mismo día', !H.mismoDia('28/07/2026 09:06', '27/07/2026 09:06'));

// ── Cotejo campo-a-campo (regla local-driven) ───────────────────────────────
const r1 = H.cotejarCampos(
  { cliente: 'CHOCOLATES KRON C.A', monto: '2000000.00', fecha: '27/07/2026 10:44:05', obs: '' },
  { cliente: 'CHOCOLATES KRON C.A', monto: '2.000.000,00 BS', fecha: '27/07/2026 14:44:05', obs: 'algo que la web agregó' },
  { fechas: ['fecha'], numeros: ['monto'] });
eq('cotejo: todo lo lleno cuadra → WEB-OK', r1.marca, 'WEB-OK');
eq('cotejo: campo vacío en el móvil se saltea (no se juzga)', r1.comparados, 3);
eq('cotejo: hora distinta genera NOTA, no mismatch', r1.notas.length, 1);

const r2 = H.cotejarCampos({ monto: '100.00' }, { monto: '105,00 BS' }, { numeros: ['monto'] });
eq('cotejo: monto distinto → WEB-FIELD-MISMATCH', r2.marca, 'WEB-FIELD-MISMATCH');

const r3 = H.cotejarCampos({ cliente: 'ACME' }, {});
eq('cotejo: campo lleno que falta en la web → mismatch', r3.diffs[0].motivo, 'falta en web');

// ── Gate de precondición (no juzgar lo que nunca llegó a la nube) ───────────
t('BD-OK habilita la evaluación web', H.gatePorBD('BD-OK').evaluar === true);
eq('BD-SAVED → WEB-N/A, nunca FAIL', H.gatePorBD('BD-SAVED').marca, 'WEB-N/A');
eq('BD-QUEUED → WEB-N/A', H.gatePorBD('BD-QUEUED').marca, 'WEB-N/A');
eq('sin marca BD ni Ref → WEB-N/A', H.gatePorBD(null).marca, 'WEB-N/A');
// "no llegó" ≠ "no sabemos": con BD-N/A (sin GRANT, caso el_valle 0/185 tablas) el respaldo
// es el Nro.Ref que asignó el servidor — si no, un cliente sin GRANT dejaría TODA la capa web muerta.
t('BD-N/A + Ref del servidor → SÍ se evalúa', H.gatePorBD('BD-N/A', { refServidor: 526 }).evaluar === true);
eq('…y deja constancia de por qué vía', H.gatePorBD('BD-N/A', { refServidor: 526 }).via, 'ref-servidor');
eq('BD-N/A SIN Ref → WEB-N/A', H.gatePorBD('BD-N/A', {}).marca, 'WEB-N/A');
t('BD-SAVED con Ref igual NO se evalúa (sabemos que no llegó)', H.gatePorBD('BD-SAVED', { refServidor: 9 }).evaluar === false);

// ── El bundle DOM es sintácticamente válido ─────────────────────────────────
t('BUNDLE_DOM parsea como función', typeof eval('(' + H.BUNDLE_DOM + ')') === 'function');
t('BUNDLE_DOM no contiene acciones de escritura', !/\.click\(|\.value\s*=|submit\(|removeChild|\.remove\(/.test(H.BUNDLE_DOM));

console.log(`\n=== web-helpers self-test: ${ok} OK, ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);
