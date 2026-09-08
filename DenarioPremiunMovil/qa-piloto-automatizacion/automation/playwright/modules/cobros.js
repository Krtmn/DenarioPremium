'use strict';

const { execFileSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { installPayloadCapture, getCapturedPayloads } = require('../../cdp/denario-cdp-helpers');
const { reqInicio, reqRechazo, reqPestanaRoja, reqIds, conReq } = require('../req-enviar');

const LOCAL_QUERY_PATH    = path.resolve(__dirname, '../../db/local-query.js');
const NUBE_QUERY_PATH     = path.resolve(__dirname, '../../db/query.js');
const COTEJO_PAYLOAD_PATH = path.resolve(__dirname, '../../db/cotejo-payload.js');

// JPEG 1x1 válido (mismo del helper CDP) para inyectar como adjunto sin cámara.
const BASE64_1PX_JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoH' +
  'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwf/wAARC' +
  'AABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAA' +
  'AAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

function localQuery(sql) {
  try {
    return JSON.parse(
      execFileSync('node', [LOCAL_QUERY_PATH, sql], { encoding: 'utf8', timeout: 15000 })
    );
  } catch (_) { return []; }
}

/**
 * Consulta la BD en la NUBE del cliente. Devuelve las filas o null si no se pudo.
 *
 * 🔑 Es el oráculo bueno para el ENVÍO. Guardar es local (SQLite del equipo);
 *    enviar es lo único que POSTea. Contar ítems «Enviado» en la lista de la UI
 *    resultó frágil: el 07/09 dio FAIL tres veces seguidas por leer la lista
 *    antes de que pintara, mientras los cobros SÍ estaban en la nube.
 */
function consultaNube(slug, sql) {
  try {
    return JSON.parse(
      execFileSync('node', [NUBE_QUERY_PATH, slug, sql], { encoding: 'utf8', timeout: 30000 })
    );
  } catch (_) { return null; }
}

/** Corre cotejo-payload.js con un payload capturado ({url,data}). Devuelve marca o 'BD-N/A'. */
function cotejoPayload(slug, payload) {
  const tmp = path.join(os.tmpdir(), `qa_cob_payload_${Date.now()}.json`);
  try {
    fs.writeFileSync(tmp, JSON.stringify(payload));
    const r = JSON.parse(
      execFileSync('node', [COTEJO_PAYLOAD_PATH, slug, tmp], { encoding: 'utf8', timeout: 30000 })
    );
    const mis = ((r.resumen || {}).mismatches || []).slice(0, 2).join('; ');
    return r.marca + (mis ? ` (${mis})` : '');
  } catch (_) { return 'BD-N/A'; }
  finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

/**
 * modules/cobros.js — FASE 1 · núcleo co_type 0 (cobro normal)
 *
 * Cobertura Fase 1: DM-COB-001/002/004/007/008/009/016/018/022/024/026/020/021 (+ 019 con adjunto).
 * Descuento de cobro: 048 (botón en el detalle) · 049 (bajo el tope) · 050 (suma que excede)
 *   · 051 (borde exacto con tasa escrita). Se ejercitan y se CANCELAN: no alteran el cobro.
 * N/A por VG: 006 (requiredComment), 036/044/045 (IGTF), 037 (25% IVA).
 * FASE 2 (marcados BLOCKED-fase2): 033/034 moneda, 012/040/043 diferencia, 014/015 Total,
 *   028 anticipo (co_type 1), 029/041/042 retención (co_type 2), 046 parcial, 047/039 fecha-tasa, 038.
 *
 * Selectores: automation/cdp/module-selectors/cobros.md (adaptados de MCP a Playwright standalone).
 * Patrón base: modules/depositos.js (banco/pagos/cotejo/dirty-guard).
 *
 * @param {import('playwright').Page} pg
 * @param {{ aplica:boolean, clienteTest:string, clientesConDocumentos:string[],
 *           requiredCollectionAttachments:boolean, requiredComment:boolean, multiCurrency:boolean,
 *           retencion:boolean, cobroRetencion:boolean, cobroPrepago:boolean, userCanSelectIGTF:boolean,
 *           userCanCollectIva:boolean, sizeRetention:number, metodoPago:string,
 *           mockCamaraFunciona:boolean, clienteSlug:string }} DATA
 */
async function runCobros(pg, DATA) {
  const t0 = Date.now();
  const verdicts = [];

  function v(id, desc, resultado, nota = '') {
    verdicts.push({ id, descripcion: desc, resultado, nota, ms: Date.now() - t0 });
  }

  // Regresión permanente del REQ «Botón Enviar y campos obligatorios» (../req-enviar.js)
  const reqV = (r) => v(r.id, r.descripcion, r.resultado, r.nota);

  // Orden de ejecución (Fase 1 primero; Fase 2 al final como BLOCKED-fase2)
  const FASE2 = ['DM-COB-033','DM-COB-034',
    'DM-COB-014','DM-COB-015','DM-COB-028','DM-COB-029','DM-COB-041','DM-COB-042',
    'DM-COB-046','DM-COB-047','DM-COB-039','DM-COB-038'];
  const TODOS = ['DM-COB-001','DM-COB-002','DM-COB-004','DM-COB-006','DM-COB-007',
    'DM-COB-008','DM-COB-009','DM-COB-016','DM-COB-018','DM-COB-019','DM-COB-022',
    'DM-COB-024','DM-COB-026','DM-COB-020','DM-COB-021','DM-COB-036','DM-COB-037',
    'DM-COB-044','DM-COB-045',
    // Descuento de cobro (tope maxCollectDiscount) — construidos el 07/09
    'DM-COB-048','DM-COB-049','DM-COB-050','DM-COB-051','DM-COB-052',
    'DM-COB-053','DM-COB-054','DM-COB-055',
    ...FASE2, ...reqIds('COB')];

  if (!DATA.aplica) {
    TODOS.forEach(id => v(id, id, 'N/A', 'aplica=false en perfil cobros'));
    return { verdicts, msTotal: Date.now() - t0 };
  }

  try { await installPayloadCapture(pg); } catch (_) {}

  const ts       = String(Date.now()).slice(-6);
  const comentTest = `Test-COB-${ts}`;

  // ─── Helpers (adaptados de depositos.js + module-selectors/cobros.md) ─────────

  async function dismissIonLoadings() {
    await pg.evaluate(() => {
      document.querySelectorAll('ion-loading').forEach(el => {
        if (el.offsetParent !== null) try { el.dismiss(); } catch (_) {}
      });
    });
  }

  async function clickBack() {
    // Back de app-cobros-header = img.fechaAtras src=flecha-blanca.png → filtrar por rect, NO por src
    const coords = await pg.evaluate(() => {
      const imgs = [...document.querySelectorAll('img.fechaAtras')];
      const back = imgs.find(img => {
        const r = img.getBoundingClientRect();
        return r.width > 0 && r.x < 100 && r.y < 120;
      });
      if (!back) return null;
      const target = back.closest('a') || back;
      const r = target.getBoundingClientRect();
      // 🔴 Segunda defensa: comprobar qué elemento recibiría el clic en ese punto.
      //    Si es el SALIR del home de la app, no se pulsa. Un script de prueba
      //    nunca debe cerrar la sesión del usuario.
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const enElPunto = document.elementFromPoint(cx, cy);
      const txt = ((enElPunto && enElPunto.innerText) || '').trim();
      if (/^\s*salir\s*$/i.test(txt)) return { peligro: txt };
      return { x: cx, y: cy };
    });
    if (!coords) throw new Error('img.fechaAtras no encontrado');
    if (coords.peligro) throw new Error(`el «atrás» caería sobre «${coords.peligro}» — no se pulsa`);
    await pg.mouse.click(coords.x, coords.y, { delay: 60 });
  }

  async function clickAlertBtn(labels = ['Aceptar', 'OK']) {
    await pg.waitForTimeout(900);
    await dismissIonLoadings();
    await pg.waitForTimeout(300);
    const coords = await pg.evaluate((lbls) => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!alerts.length) return null;
      const alert = alerts[alerts.length - 1];
      for (const lbl of lbls) {
        const btn = [...alert.querySelectorAll('.alert-button')].find(b =>
          b.textContent.trim().toLowerCase() === lbl.toLowerCase() && b.getBoundingClientRect().width > 0);
        if (btn) { const r = btn.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, label: lbl }; }
      }
      return null;
    }, labels);
    if (!coords) throw new Error('Alert btn no encontrado: ' + labels.join('/'));
    await pg.mouse.click(coords.x, coords.y);
    await pg.waitForTimeout(500);
    return coords.label;
  }

  // Lee el título/mensaje del alert activo (ion-alert.textContent devuelve "" en este build → usar .alert-title/.alert-message)
  async function readAlert() {
    return pg.evaluate(() => {
      const a = [...document.querySelectorAll('ion-alert')].find(x => {
        const isTraditional = !x.classList.contains('overlay-hidden') && x.offsetParent !== null;
        const hasVisibleBtn = [...x.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!a) return null;
      const t = a.querySelector('.alert-title, .alert-head');
      const m = a.querySelector('.alert-message');
      return [(t && t.textContent.trim()) || '', (m && m.textContent.trim()) || ''].filter(Boolean).join(' · ');
    });
  }

  // dirty-guard: título "Denario Cobros"/message vacío → detectar por BOTONES, salir con "Salir sin guardar"
  async function dismissDirtyGuard() {
    const coords = await pg.evaluate(() => {
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a => {
        const isTraditional = !a.classList.contains('overlay-hidden') && a.offsetParent !== null;
        const hasVisibleBtn = [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0);
        return isTraditional || hasVisibleBtn;
      });
      if (!alerts.length) return null;
      const btn = [...alerts[alerts.length - 1].querySelectorAll('.alert-button')].find(b =>
        b.textContent.trim().toLowerCase() === 'salir sin guardar' && b.getBoundingClientRect().width > 0);
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y);
    await pg.waitForTimeout(800);
    return true;
  }

  // Botón home de cobros con Pointer+Mouse (los tiles requieren PointerEvent + click)
  async function clickBotonHome(texto) {
    const coords = await pg.evaluate((t) => {
      const btns = [...document.querySelectorAll('app-cobros ion-button')].filter(
        b => b.textContent.trim() === t && b.getBoundingClientRect().width > 0);
      if (!btns.length) return null;
      const el = btns[0];
      const r = el.getBoundingClientRect();
      // Disparar el handler real vía Pointer+Mouse en el shadow button
      try {
        const inner = el.shadowRoot && el.shadowRoot.querySelector('button');
        (inner || el).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        (inner || el).dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      } catch (_) {}
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, texto);
    if (!coords) throw new Error(`Botón "${texto}" no encontrado en home cobros`);
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
  }

  async function isHomeCobrosVisible() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .some(b => b.textContent.trim() === 'COBRO'));
  }

  /**
   * Vuelve al home del módulo Cobros retrocediendo.
   *
   * 🔴 FRENO DE SEGURIDAD (07/09). Antes pulsaba «atrás» hasta 6 veces seguidas
   *    sin mirar dónde estaba. Cuando el flujo descarrilaba —p. ej. porque el
   *    cliente de prueba no cargó— seguía retrocediendo: salía de Cobros,
   *    llegaba al HOME DE LA APP y el siguiente «atrás» caía sobre **SALIR**,
   *    **cerrando la sesión del usuario**. Eso obliga a volver a entrar y
   *    resincronizar, y le arruina la sesión a quien esté usando el equipo.
   *
   *    Un script de prueba NUNCA debe poder cerrar la sesión. Ahora, si detecta
   *    que ya salió del módulo, se detiene y lo dice, en vez de seguir pulsando.
   */
  async function irAHomeCobros(maxAttempts = 6) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await isHomeCobrosVisible()) return;

      // ¿Seguimos dentro del módulo? Si ya estamos en el home de la app, otro
      // «atrás» pega en SALIR.
      const fuera = await pg.evaluate(() => {
        const viva = [...document.querySelectorAll('.ion-page')]
          .filter(p => !p.classList.contains('ion-page-hidden'))
          .map(p => p.tagName.toLowerCase()).pop() || '';
        const ruta = location.hash || location.pathname;
        return { viva, ruta, enHomeApp: viva === 'app-home' || /^\/?home$/.test(ruta.replace('#', '')) };
      });
      if (fuera.enHomeApp) {
        throw new Error(`salí del módulo Cobros (${fuera.viva}) — me detengo para no pulsar SALIR`);
      }

      try { await clickBack(); } catch (_) {}
      await pg.waitForTimeout(900);
      await dismissDirtyGuard();
      await pg.waitForTimeout(400);
    }
    if (!(await isHomeCobrosVisible())) throw new Error('No se pudo llegar a home cobros');
  }

  // ¿estamos en el formulario? (segment-buttons visibles; el contenedor siempre offsetParent!==null)
  async function isFormVisible() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros-container ion-segment-button, app-cobro ion-segment-button')]
        .some(s => s.getBoundingClientRect().width > 0));
  }

  // Cambiar de tab: asignar ion-segment.value + ionChange (más fiable que click en segment-button)
  // 🔴 LA PESTAÑA «GENERAL» SE LLAMA "default".
  //    `cobro.component.html:4` → <ion-segment-button value="default">. Las otras
  //    cuatro sí usan su nombre. Durante toda la corrida del 07/09 se pedía
  //    'general': `seg.value` quedaba en un valor que ningún botón tiene, NO se
  //    seleccionaba ninguna pestaña y la vista quedaba EN BLANCO. Por eso la foto
  //    de DM-COB-024 leyó 0 inputs y el cotejo nunca pudo hacerse.
  //
  //    Fallaba en silencio porque la función no devolvía nada y todas las
  //    llamadas van con `.catch(() => {})`. Ahora valida contra los valores que
  //    existen de verdad y devuelve el resultado.
  const ALIAS_TAB = { general: 'default', datos: 'default' };

  async function clickTab(value) {
    const destino = ALIAS_TAB[value] || value;
    const r = await pg.evaluate((val) => {
      const seg = document.querySelector('app-cobros-container ion-segment, app-cobro ion-segment, ion-segment');
      if (!seg) return { ok: false, motivo: 'no hay ion-segment en pantalla' };
      const botones = [...seg.querySelectorAll('ion-segment-button')];
      const valores = botones.map(b => String(b.value ?? b.getAttribute('value') ?? ''));
      if (!valores.includes(val)) {
        return { ok: false, motivo: `la pestaña "${val}" no existe`, valores };
      }
      seg.value = val;
      seg.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
      return { ok: true, valores };
    }, destino);
    await pg.waitForTimeout(1000);
    return r;
  }

  // Abrir nuevo cobro: click REAL en el tile (nuevoCobro programático NO re-renderiza tras Guardado)
  async function abrirNuevoCobro() {
    await clickBotonHome('COBRO');
    // Esperar los 5 tabs
    for (let i = 0; i < 12; i++) {
      await pg.waitForTimeout(700);
      const tabs = await pg.evaluate(() =>
        [...document.querySelectorAll('ion-segment-button')].filter(s => s.getBoundingClientRect().width > 0).length);
      if (tabs >= 4) return true;
    }
    return false;
  }

  // Qué cliente se clickeó DE VERDAD. El reporte debe decir esto, no lo que
  // pedía el perfil: son cosas distintas y confundirlas ya hizo mentir a un reporte.
  let ultimoClienteClickeado = null;

  // Modal cliente: #clienteSelectModal.present() (click en ion-input NO lo abre)
  async function seleccionarCliente(nombre) {
    await pg.evaluate(() => {
      const m = document.querySelector('#clienteSelectModal');
      if (m && typeof m.present === 'function') m.present();
    });
    await pg.waitForTimeout(2000);

    // Filtrar (algunos builds requieren Enter; otros muestran la lista directo). Teclear el nombre si hay input.
    await pg.evaluate((nom) => {
      const modal = document.querySelector('ion-modal.show-modal, #clienteSelectModal');
      if (!modal) return;
      const inp = modal.querySelector('input:not([type=hidden])');
      if (inp) { inp.focus(); }
    });
    if (nombre) {
      const first = nombre.trim().slice(0, 8);
      await pg.keyboard.type(first, { delay: 40 }).catch(() => {});
      await pg.keyboard.press('Enter').catch(() => {});
      await pg.waitForTimeout(1500);
    }

    // Click en el <p> del nombre (NO el centro del item → zona de saldos activa masInfo→BUSCAR)
    //
    // 🔴 ANTES CAÍA EN `ps[0]` SIN AVISAR. La línea era `target = target || ps[0]`:
    //    si el cliente pedido no aparecía, elegía **el primero de la lista** y
    //    seguía como si nada. El reporte imprimía el cliente del PERFIL, no el
    //    que se había clickeado, así que mentía. Se detectó en 4K (02/09): el
    //    perfil pide `C.0507` —un CÓDIGO— y el modal lista NOMBRES, así que no
    //    casaba nunca; se cobraba contra un cliente cualquiera y los casos
    //    siguientes morían con "cliente sin documentos".
    //
    // Ahora: se busca por CÓDIGO o por NOMBRE sobre el texto completo del ítem,
    // y si no está, **falla con nombre y apellido**. Un cliente equivocado en
    // silencio es peor que un FAIL.
    const hallazgo = await pg.evaluate((nom) => {
      const visible = (el) => el.getBoundingClientRect().width > 0;
      const modal = document.querySelector('#clienteSelectModal') ||
                    document.querySelector('ion-modal.show-modal');
      if (!modal) return { err: 'el modal de clientes no está abierto' };

      const items = [...modal.querySelectorAll('ion-item')].filter(visible);
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const clave = norm(nom);

      // El <p> es el punto SEGURO donde clickear; el texto del ion-item es lo
      // que se compara, porque ahí vienen código y nombre juntos.
      const candidatos = items.map(it => ({
        it,
        txt: norm(it.innerText),
        p: [...it.querySelectorAll('p')].filter(visible)[0] || null,
      })).filter(c => c.p);

      if (!candidatos.length) return { err: 'el modal no listó clientes', n: items.length };
      if (!clave) return { err: 'no se indicó cliente_test en el perfil del cliente' };

      // exacto primero, luego por substring (el código suele venir con prefijo)
      const elegido = candidatos.find(c => c.txt === clave)
                   || candidatos.find(c => c.txt.includes(clave));
      if (!elegido) {
        return { err: 'no encontrado', n: candidatos.length,
                 muestra: candidatos.slice(0, 5).map(c => c.txt.slice(0, 60)) };
      }
      elegido.p.scrollIntoView({ block: 'center' });
      const r = elegido.p.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2,
               elegido: elegido.txt.slice(0, 80), n: candidatos.length };
    }, nombre);

    if (hallazgo.err) {
      const extra = hallazgo.muestra
        ? ` · ${hallazgo.n} listados, p.ej.: ${hallazgo.muestra.join(' | ')}`
        : hallazgo.n !== undefined ? ` · ${hallazgo.n} ítems` : '';
      throw new Error(`Cliente "${nombre}" ${hallazgo.err}${extra}`);
    }
    ultimoClienteClickeado = hallazgo.elegido;
    const coords = { x: hallazgo.x, y: hallazgo.y };
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(2500);
    // Reintento (el 1er click a veces no marca)
    const stillModal = await pg.evaluate(() =>
      !!document.querySelector('ion-modal.show-modal #clienteSelectModal, #clienteSelectModal.show-modal') ||
      [...document.querySelectorAll('#clienteSelectModal')].some(m => m.getBoundingClientRect().width > 0 && m.offsetParent !== null));
    if (stillModal && coords) {
      await pg.mouse.click(coords.x, coords.y + 8, { delay: 80 });
      await pg.waitForTimeout(2000);
    }
  }

  // Llenar Comentario: 2º ion-input.inp-write (1º=Responsable id=currency; 2º=Comentario, nace ion-invalid)
  /**
   * Escribe el campo Comentario del cobro.
   *
   * 🔴 El selector `.inp-write` DEJÓ DE EXISTIR (medido el 07/09: 0 elementos lo
   *    tienen). Con él, la función no encontraba nada y devolvía false — y como
   *    nadie miraba ese false, el módulo seguía adelante con las 5 pestañas
   *    bloqueadas y el fallo aparecía después disfrazado de «tabs no habilitadas».
   *
   *    Ahora se ancla al **label «Comentario:»**, que es estable y describe el
   *    campo, en vez de a una clase de estilo. Se conserva `.inp-write` como
   *    último recurso por si algún build viejo lo usa.
   */
  async function fillComentario(texto) {
    const ok = await pg.evaluate((val) => {
      const vis = (el) => el.getBoundingClientRect().width > 0;
      const etiqueta = (el) => String(el.getAttribute('label') || el.label || '');

      const todos = [...document.querySelectorAll('ion-input, ion-textarea')].filter(vis);
      let target =
        // 1) por su label — el ancla buena
        todos.find(i => /coment/i.test(etiqueta(i)))
        // 2) compatibilidad: builds que aún usen la clase de estilo
        || [...document.querySelectorAll('ion-input.inp-write')].filter(vis)
             .find(i => i.classList.contains('ion-invalid') && !(i.value || '').trim())
        // 3) el que nace inválido y vacío (el obligatorio sin llenar)
        || todos.find(i => i.classList.contains('ng-invalid') && !(i.value || '').trim());
      if (!target) return false;
      const native = target.querySelector('input') || (target.shadowRoot && target.shadowRoot.querySelector('input'));
      if (!native) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(native, val);
      native.dispatchEvent(new Event('input', { bubbles: true }));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      target.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: val } }));
      target.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
      native.dispatchEvent(new Event('blur', { bubbles: true }));
      return true;
    }, texto);
    await pg.waitForTimeout(600);
    return ok;
  }

  async function tabsHabilitadas() {
    return pg.evaluate(() =>
      [...document.querySelectorAll('ion-segment-button')]
        .filter(s => s.getBoundingClientRect().width > 0 && !s.disabled && s.getAttribute('disabled') === null).length);
  }

  // Selecciona la moneda documento (1er ion-select del Tab Documentos) = USD por defecto para docs $
  /**
   * 📸 Foto de los campos visibles del cobro — se toma antes de guardar y otra
   *    vez al reabrir, y el cotejo de DM-COB-024 compara las dos.
   *
   * 🔴 Estaba DUPLICADA con dos indentaciones distintas, y al corregir una sola
   *    las fotos dejaron de ser comparables. Ahora hay UNA definición.
   *
   * 🔴 Y leía SOLO el atributo `label`: en la corrida del 07/09 16:02 devolvió
   *    CERO campos, así que 024 no pudo medir nada. No todos los campos del
   *    cobro rotulan así — algunos usan un <ion-label> hermano o el placeholder.
   *    Se prueban las tres vías y se guarda un diagnóstico para no quedar a
   *    ciegas si vuelve a salir vacía.
   */
  async function fotoDelCobro() {
    return pg.evaluate(() => {
      const vis = el => el.getBoundingClientRect().width > 0;
      const valor = (el) => {
        const n = el.querySelector('input, textarea') ||
                  (el.shadowRoot && el.shadowRoot.querySelector('input, textarea'));
        return n ? String(n.value).trim() : '';
      };
      const rotulo = (el) => {
        const attr = String(el.getAttribute('label') || el.label || '').trim();
        if (attr) return attr;
        const item = el.closest('ion-item, ion-col, .item');
        const lab = item && item.querySelector('ion-label');
        const t = lab ? (lab.textContent || '').replace(/\s+/g, ' ').trim() : '';
        if (t) return t;
        return String(el.getAttribute('placeholder') || el.placeholder || '').trim();
      };
      const todos = [...document.querySelectorAll('ion-input, ion-textarea')].filter(vis);
      const campos = {};
      for (const el of todos) {
        const et = rotulo(el);
        if (et) campos[et] = valor(el);
      }
      const txt = (document.body.innerText || '').replace(/\s+/g, ' ');
      const tot = txt.match(/Monto total a pagar[^:]*:\s*([\d.,]+)/i);
      const seg = document.querySelector('ion-segment-button.segment-button-checked')
               || document.querySelector('ion-segment-button[aria-selected="true"]');
      return {
        campos,
        total: tot ? tot[1] : null,
        diag: {
          inputsVisibles: todos.length,
          tabActiva: seg ? (seg.textContent || '').replace(/\s+/g, ' ').trim() : '?',
          muestra: todos.slice(0, 6).map(rotulo).filter(Boolean),
        },
      };
    });
  }

  async function seleccionarMonedaDocumento(pref = 'US') {
    const res = await pg.evaluate((p) => {
      const sel = document.querySelector('app-cobro-documents ion-select');
      if (!sel) return { ok: false, err: 'ion-select moneda no encontrado' };
      const opts = [...sel.querySelectorAll('ion-select-option')];
      const labels = opts.map(o => (o.textContent || '').trim());
      const opt = opts.find(o => (o.textContent || '').toUpperCase().includes(p.toUpperCase())) || opts[0];
      if (!opt) return { ok: false, err: 'sin opciones de moneda', labels };
      sel.value = opt.value;
      sel.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: opt.value } }));
      return { ok: true, elegida: (opt.textContent || '').trim(), labels };
    }, pref);
    await pg.waitForTimeout(1800);
    return res;
  }

  // Cuenta documentos (checkboxes) visibles en el Tab Documentos.
  async function contarDocumentos() {
    return pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs || docs.offsetParent === null) return 0;
      return [...docs.querySelectorAll('ion-checkbox')].filter(c => c.getBoundingClientRect().width > 0).length;
    });
  }

  // Carga documentos robusta: selecciona Moneda Documento (US$) y reintenta con toggle si no cargan.
  async function cargarDocumentos() {
    let moneda = null, cbs = 0;
    for (let i = 0; i < 5; i++) {
      moneda = await seleccionarMonedaDocumento('US');
      await pg.waitForTimeout(1500);
      cbs = await contarDocumentos();
      if (cbs > 0) break;
      // toggle: elegir otra moneda y volver, fuerza recarga de la lista
      await seleccionarMonedaDocumento('BS');
      await pg.waitForTimeout(1200);
    }
    return { cbs, moneda };
  }

  // Marca el primer documento (checkbox) del Tab Documentos → devuelve {ok, count}
  async function marcarPrimerDocumento() {
    const info = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs || docs.offsetParent === null) return { count: 0 };
      const cbs = [...docs.querySelectorAll('ion-checkbox')].filter(c => c.getBoundingClientRect().width > 0);
      return { count: cbs.length };
    });
    if (info.count === 0) return { ok: false, count: 0 };
    const coords = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      const cbs = [...docs.querySelectorAll('ion-checkbox')]
        .filter(c => c.getBoundingClientRect().width > 0)
        .sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
      const r = cbs[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(1200);
    return { ok: true, count: info.count };
  }

  // ── Guardar / Enviar ────────────────────────────────────────────────────────
  //
  // 🔴 ANTES DISPARABA CUATRO VECES. La versión previa hacía, sin condición:
  //       pointerdown + pointerup + inner.click()   (en el DOM)
  //       + pg.mouse.click(x, y)                    (clic real)
  //    Ionic atiende el `inner.click()` Y el clic real ⇒ **dos activaciones del
  //    mismo botón**. En Guardar deja un cobro duplicado; en Enviar, un envío
  //    duplicado. La razón de que estuvieran los dos era que «el header fijo en
  //    y≈32 no siempre recibe el mouse» — cierto, pero eso se resuelve con un
  //    fallback CONDICIONADO, no disparando ambos a ciegas.
  //
  // Ahora: **un solo disparo**, se comprueba si la pantalla reaccionó, y solo si
  // no reaccionó se intenta la vía alterna. Nunca las dos.
  //
  // Devuelve { ok, via, motivo } — ⚠ es un OBJETO: `if (await clickGuardarEnviar())`
  // siempre da verdadero. Evaluar `.ok`.

  /** Huella de la pantalla, para saber si el botón produjo algo. */
  async function huellaPantalla() {
    return pg.evaluate(() => {
      const vis = (el) => el && el.getBoundingClientRect().width > 0 && el.offsetParent !== null;
      const alerts = [...document.querySelectorAll('ion-alert')].filter(a =>
        (!a.classList.contains('overlay-hidden') && a.offsetParent !== null) ||
        [...a.querySelectorAll('.alert-button')].some(b => b.getBoundingClientRect().width > 0));
      return {
        alerts:   alerts.length,
        loadings: [...document.querySelectorAll('ion-loading')].filter(vis).length,
        enCobro:  !!document.querySelector('app-cobro:not(.ion-page-hidden)'),
        url:      location.hash || location.pathname,
      };
    });
  }

  /** ¿Cambió algo respecto de `antes`? Sondea hasta `msMax`. */
  async function esperarReaccion(antes, msMax = 2500) {
    const t0 = Date.now();
    while (Date.now() - t0 < msMax) {
      await pg.waitForTimeout(250);
      const ahora = await huellaPantalla();
      if (ahora.alerts   > antes.alerts)   return { reacciono: true, senal: 'alert' };
      if (ahora.loadings > antes.loadings) return { reacciono: true, senal: 'loading' };
      if (antes.enCobro && !ahora.enCobro) return { reacciono: true, senal: 'navego' };
      if (ahora.url !== antes.url)         return { reacciono: true, senal: 'url' };
    }
    return { reacciono: false };
  }

  async function clickGuardarEnviar(cls) {
    // 🔴 El teclado desplaza el header: si se acaba de escribir, las coordenadas
    //    medidas antes del blur apuntan a otro sitio y el clic «no hace nada».
    await pg.evaluate(() => {
      const a = document.activeElement;
      if (a && typeof a.blur === 'function') a.blur();
    });
    await pg.waitForTimeout(400);

    const btn = await pg.evaluate((sel) => {
      const b = document.querySelector(`ion-button.${sel}`);
      if (!b) return { estado: 'ausente' };
      if (b.disabled) return { estado: 'deshabilitado' };
      const r = b.getBoundingClientRect();
      if (r.width === 0) return { estado: 'invisible' };
      return { estado: 'ok', x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, cls);

    if (btn.estado !== 'ok') return { ok: false, via: null, motivo: `botón ${btn.estado}` };

    const antes = await huellaPantalla();

    // Intento 1 — clic REAL. Es el que reproduce lo que hace la QA a mano.
    await pg.mouse.click(btn.x, btn.y, { delay: 120 });
    let r = await esperarReaccion(antes);
    if (r.reacciono) return { ok: true, via: 'mouse', motivo: r.senal };

    // Intento 2 — solo porque el primero NO produjo nada: el header fijo puede
    // quedar fuera del área que recibe el mouse. Una sola activación más.
    const disparo = await pg.evaluate((sel) => {
      const b = document.querySelector(`ion-button.${sel}`);
      if (!b || b.disabled) return false;
      const inner = b.shadowRoot && b.shadowRoot.querySelector('button');
      try { (inner || b).click(); return true; } catch (_) { return false; }
    }, cls);
    if (!disparo) return { ok: false, via: 'mouse', motivo: 'sin reacción y no se pudo reintentar' };

    r = await esperarReaccion(antes);
    return r.reacciono
      ? { ok: true,  via: 'dom', motivo: r.senal }
      : { ok: false, via: 'ambas', motivo: 'el botón no produjo ninguna reacción' };
  }

  function blockFase2(motivo = 'Fase 2 — pendiente de construir/depurar en device') {
    FASE2.forEach(id => v(id, id, 'BLOCKED', motivo));
  }

  // Lee el "Monto total a pagar" y la Diferencia (texto + color) del Tab Pagos.
  async function leerPagosSticky() {
    return pg.evaluate(() => {
      const root = document.querySelector('app-cobro-pagos') || document.body;
      const txt = root.textContent.replace(/\s+/g, ' ');
      const totalM = txt.match(/Monto total a pagar[^\d-]*([\d.,-]+)/i);
      // Diferencia: span hoja con color en style
      let difColor = null, difVal = null;
      const spans = [...root.querySelectorAll('span, ion-text, p, div')].filter(n => /Diferencia/i.test(n.textContent || ''));
      for (const s of spans) {
        const leaf = [...s.querySelectorAll('*')].filter(x => x.children.length === 0 && /Diferencia/i.test(x.textContent));
        const node = leaf[0] || s;
        const st = (node.getAttribute && node.getAttribute('style')) || '';
        const cs = getComputedStyle(node).color;
        const m = (node.textContent || '').match(/Diferencia[^\d-]*([\d.,-]+)/i);
        if (m) { difVal = m[1]; difColor = (/red/i.test(st) ? 'red' : /blue/i.test(st) ? 'blue' : cs); break; }
      }
      return { total: totalM ? totalM[1] : null, difVal, difColor };
    });
  }

  // Convierte "66.852,91" → "6685291" (dígitos para el input de monto centavos-acumulativo)
  /**
   * "Bs: 1.017.900,00" → 1017900. Formato es-VE: el punto agrupa, la coma decide.
   * Devuelve null si no hay número, para no confundir «no se pudo leer» con 0.
   */
  function montoANumero(txt) {
    if (txt === null || txt === undefined) return null;
    const m = String(txt).match(/-?[\d.,]+/);
    if (!m) return null;
    const n = Number(m[0].replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Deja la LISTA de cobros a la vista y devuelve el conteo por estado.
   *
   * 🔴 Antes cada caso repetía «irAHome + BUSCAR + dormir un rato» y leía. Con un
   *    sleep fijo la lista salía VACÍA (0 ítems justo después de contar 20) y eso
   *    tumbó DM-COB-019 tres corridas seguidas. Aquí se espera a que CARGUE y, si
   *    no aparece, se reintenta la navegación entera antes de rendirse.
   */
  async function abrirListaCobros(intentos = 3) {
    for (let n = 0; n < intentos; n++) {
      await dismissIonLoadings().catch(() => {});
      await irAHomeCobros().catch(() => {});
      await clickBotonHome('BUSCAR').catch(() => {});
      for (let i = 0; i < 8; i++) {
        await pg.waitForTimeout(1000);
        const r = await pg.evaluate(() => {
          const lista = document.querySelector('app-cobros-list');
          if (!lista || lista.offsetParent === null) return { lista: false, total: 0, guardados: 0, enviados: 0 };
          const its = [...lista.querySelectorAll('ion-item')].filter(el => el.getBoundingClientRect().width > 0);
          return {
            lista: true,
            total: its.length,
            guardados: its.filter(el => /Guardado/i.test(el.textContent)).length,
            enviados: its.filter(el => /Enviado|Por aprobar/i.test(el.textContent)).length,
          };
        });
        if (r.lista && r.total > 0) return r;
      }
    }
    return { lista: false, total: 0, guardados: 0, enviados: 0 };
  }

  /** Abre el primer cobro en estado Guardado de la lista. */
  async function reabrirGuardado() {
    const coords = await pg.evaluate(() => {
      const items = [...document.querySelectorAll('app-cobros-list ion-item')]
        .filter(el => el.getBoundingClientRect().width > 0 && /Guardado/i.test(el.textContent));
      if (!items.length) return null;
      items[0].scrollIntoView({ block: 'center' });
      const r = items[0].getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y, { delay: 120 });
    await pg.waitForTimeout(2500);
    return (await tabsHabilitadas()) >= 3;
  }

  function montoADigitos(txt) {
    if (!txt) return '';
    return String(txt).replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
  }

  // Agrega método Efectivo con monto = total. Devuelve { ok, monto, error }.
  async function agregarPagoEfectivo() {
    // 1. Abrir modal (#eventSelect → setShowEventModal(true))
    const addInfo = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button#eventSelect, ion-button.pagos-add-method-btn');
      if (!btn || btn.disabled || btn.getBoundingClientRect().width === 0) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!addInfo) return { ok: false, error: 'botón Agregar método disabled/ausente' };
    await pg.mouse.click(addInfo.x, addInfo.y, { delay: 100 });
    await pg.waitForTimeout(1500);

    // 2. Check Efectivo en el modal (ionChange sobre el checkbox de la fila "Efectivo")
    const checked = await pg.evaluate(() => {
      const mod = [...document.querySelectorAll('#eventModal')].find(m => m.offsetParent !== null);
      if (!mod) return false;
      const items = [...mod.querySelectorAll('ion-item')];
      const it = items.find(i => /Efectivo/i.test(i.textContent));
      if (!it) return false;
      const cb = it.querySelector('ion-checkbox');
      if (!cb) return false;
      cb.checked = true;
      cb.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { checked: true } }));
      return true;
    });
    if (!checked) return { ok: false, error: 'checkbox Efectivo no encontrado en #eventModal' };
    await pg.waitForTimeout(600);

    // 3. Aceptar (.botonAddVerde → onAceptarTiposPago())
    await pg.evaluate(() => {
      const mod = [...document.querySelectorAll('#eventModal')].find(m => m.offsetParent !== null);
      if (!mod) return;
      const btn = [...mod.querySelectorAll('ion-button.botonAddVerde')].find(b => b.getBoundingClientRect().width > 0);
      if (btn) btn.click();
    });
    await pg.waitForTimeout(1500);

    // 4. Expandir el accordion Efectivo. Setear value en TODOS los accordion-group + click header.
    await pg.evaluate(() => {
      document.querySelectorAll('app-cobro-pagos ion-accordion-group').forEach(grp => {
        const acc = grp.querySelector('ion-accordion');
        const val = acc ? acc.getAttribute('value') : 'efectivo0';
        grp.value = val;
        grp.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: val } }));
      });
      // fallback: click en el header "Efectivo"
      const hdr = [...document.querySelectorAll('app-cobro-pagos ion-accordion ion-item[slot="header"]')]
        .find(h => /Efectivo/i.test(h.textContent));
      if (hdr) hdr.click();
    });
    await pg.waitForTimeout(1200);

    // 5. Leer total → dígitos → llenar Monto (2º ion-input del bloque efectivo; centavos-acumulativo)
    const sticky = await leerPagosSticky();
    const digitos = montoADigitos(sticky.total);
    if (!digitos) return { ok: false, error: 'no se pudo leer el total a pagar' };

    const focused = await pg.evaluate(() => {
      // El input de Monto tiene inputmode="numeric" (Nro Recibo no). Preferir ese; fallback al 2º ion-input.
      const pagos = document.querySelector('app-cobro-pagos');
      if (!pagos) return { ok: false, diag: 'no app-cobro-pagos' };
      const allInputs = [...pagos.querySelectorAll('ion-input')].filter(i => i.getBoundingClientRect().width > 0);
      let montoIon = allInputs.find(i => {
        const n = i.querySelector('input');
        return n && (n.getAttribute('inputmode') === 'numeric' || /monto/i.test(i.getAttribute('label') || ''));
      });
      if (!montoIon) montoIon = allInputs[1] || allInputs[0];
      const diag = { accs: [...pagos.querySelectorAll('ion-accordion')].map(a => a.getAttribute('value')),
        inputs: allInputs.length };
      if (!montoIon) return { ok: false, diag };
      const native = montoIon.querySelector('input') || (montoIon.shadowRoot && montoIon.shadowRoot.querySelector('input'));
      if (!native) return { ok: false, diag };
      native.focus();
      window.__qaMontoInput = native;
      return { ok: true, diag };
    });
    if (!focused.ok) return { ok: false, error: `input Monto no encontrado (accs:${JSON.stringify(focused.diag && focused.diag.accs)} inputs:${focused.diag && focused.diag.inputs})` };
    // Limpiar y teclear dígitos (onMontoKeyDown arma los centavos)
    for (let i = 0; i < 12; i++) await pg.keyboard.press('Backspace');
    await pg.keyboard.type(digitos, { delay: 40 });
    await pg.evaluate(() => {
      const n = window.__qaMontoInput;
      if (n) { n.dispatchEvent(new Event('blur', { bubbles: true })); }
    });
    await pg.waitForTimeout(1200);
    return { ok: true, monto: digitos, total: sticky.total };
  }

  // Inyecta un adjunto por el PIPELINE REAL de la app (NO fabricando el objeto Foto — eso colgaba
  // el Guardar). Este build usa @capacitor/camera (webpack) + resultType Uri → se mockea el bridge
  // Capacitor.nativePromise para que Camera.getPhoto devuelva un webPath = data URI, y se dispara
  // el tomarImg() real → addPhotoFromCamera hace fetch(dataURI) → Foto bien formada + estado correcto.
  // Requiere estar en Tab Adjuntos (app-adjunto en el DOM) y window.ng disponible.
  async function inyectarAdjunto() {
    await clickTab('adjuntos');
    await pg.waitForTimeout(1000);
    return pg.evaluate(async (b64) => {
      const C = window.Capacitor;
      if (!C || typeof C.nativePromise !== 'function') return { ok: false, err: 'Capacitor.nativePromise no disponible' };
      // Mock del bridge. addPhotoFromCamera tiene 2 ramas: photo.path → Filesystem.readFile (base64),
      // o photo.webPath → fetch(...). El fetch de un data URI lo BLOQUEA el CSP del WebView
      // ("Failed to fetch"), así que usamos la rama path: getPhoto devuelve un path y mockeamos
      // Filesystem.readFile para que devuelva el base64. Sin fetch, Foto bien formada por el pipeline.
      // Guardar el original UNA vez; reinstalar el mock SIEMPRE (la página persiste entre runs → un
      // guard `if (!__qaCamOrig)` dejaría activo un mock viejo y los cambios no tomarían efecto).
      if (!C.__qaCamOrig) C.__qaCamOrig = C.nativePromise;
      window.__qaCamHits = 0;
      window.__qaFsHits = 0;
      C.nativePromise = function (plugin, metodo, opts) {
        if (plugin === 'Camera') {
          if (metodo === 'getPhoto') {
            window.__qaCamHits++;
            const z = (typeof Zone !== 'undefined') ? Zone.current : null;
            return new Promise((resolve) => {
              const d = () => resolve({ path: 'qa_mock.jpg', webPath: 'qa_mock.jpg', format: 'jpeg', saved: false });
              if (z) z.run(d); else d();
            });
          }
          if (metodo === 'checkPermissions' || metodo === 'requestPermissions')
            return Promise.resolve({ camera: 'granted', photos: 'granted' });
          return Promise.resolve({});
        }
        if (plugin === 'Filesystem' && metodo === 'readFile') {
          window.__qaFsHits++;
          return Promise.resolve({ data: b64 });
        }
        return C.__qaCamOrig.call(this, plugin, metodo, opts);
      };
      const el = document.querySelector('app-adjunto');
      if (!el || !window.ng || !window.ng.getComponent) return { ok: false, err: 'app-adjunto/ng no disponible' };
      const comp = window.ng.getComponent(el);
      if (!comp || typeof comp.tomarImg !== 'function') return { ok: false, err: 'comp.tomarImg no disponible' };
      const svc = comp.service;
      // Guard: si quAttach viene 0/NaN (config sin 'quAttach'), checkImgLimit corta tomarImg. Forzar límite.
      const quAntes = svc ? svc.quAttach : undefined;
      if (svc && (!svc.quAttach || svc.quAttach < 1 || isNaN(svc.quAttach))) svc.quAttach = 5;
      const antes = (svc && Array.isArray(svc.fotos)) ? svc.fotos.length : -1;
      try { await comp.tomarImg(); } catch (e) {
        return { ok: false, err: 'tomarImg: ' + (e && e.message), antes, quAntes, camHits: window.__qaCamHits, fsHits: window.__qaFsHits };
      }
      const despues = (svc && Array.isArray(svc.fotos)) ? svc.fotos.length : -1;
      try { window.ng.applyChanges(comp); } catch (_) {}
      return { ok: despues > antes, antes, despues, quAntes, quAttach: svc && svc.quAttach,
        camHits: window.__qaCamHits, fsHits: window.__qaFsHits };
    }, BASE64_1PX_JPEG);
  }

  // ─── N/A por VG (resolver temprano) ───────────────────────────────────────────
  if (!DATA.requiredComment) v('DM-COB-006', 'Comentario obligatorio', 'N/A', 'requiredComment=false');
  if (!DATA.userCanSelectIGTF) {
    ['DM-COB-036','DM-COB-044','DM-COB-045'].forEach(id =>
      v(id, id, 'N/A', 'userCanSelectIGTF=false (IGTF inactivo)'));
  }
  if (!DATA.userCanCollectIva) v('DM-COB-037', 'Cobro 25% IVA', 'N/A', 'userCanCollectIva=false');

  // ─── Navegar al módulo Cobros ─────────────────────────────────────────────────
  try {
    const tileCoords = await pg.evaluate(() => {
      const tile = [...document.querySelectorAll('app-home a[href], app-home ion-card, app-home .tile, app-home a')]
        .filter(t => t.getBoundingClientRect().width > 0)
        .find(t => {
          const p = t.querySelector('p.nombreModulos, p');
          const txt = (p ? p.textContent : t.textContent).trim().toUpperCase();
          return txt.includes('COBRO');
        });
      if (!tile) return null;
      const r = tile.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!tileCoords) throw new Error('Tile Cobros no encontrado en Home');
    await pg.mouse.click(tileCoords.x, tileCoords.y, { delay: 80 });
    await pg.waitForTimeout(2000);
    await pg.waitForSelector('app-cobros', { timeout: 15000 });

    const botones = await pg.evaluate(() =>
      [...document.querySelectorAll('app-cobros ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0).map(b => b.textContent.trim()));
    const ok = botones.includes('COBRO') && botones.includes('BUSCAR');
    v('DM-COB-001', 'Módulo Cobros → home (COBRO + BUSCAR)', ok ? 'PASS' : 'FAIL', `botones: ${botones.join(', ')}`);
  } catch (e) {
    v('DM-COB-001', 'Módulo Cobros → home', 'FAIL', e.message);
    ['DM-COB-002','DM-COB-004','DM-COB-007','DM-COB-008','DM-COB-009','DM-COB-016',
     'DM-COB-018','DM-COB-019','DM-COB-022','DM-COB-024','DM-COB-026','DM-COB-020','DM-COB-021',
     'DM-COB-048','DM-COB-049','DM-COB-050','DM-COB-051','DM-COB-052']
      .forEach(id => v(id, id, 'BLOCKED', 'DM-COB-001 falló'));
    blockFase2('DM-COB-001 falló');
    return { verdicts, msTotal: Date.now() - t0 };
  }

  // ─── DM-COB-002: COBRO → form 5 tabs, Documentos/Pagos/Total/Adjuntos disabled sin cliente ─
  try {
    const abrió = await abrirNuevoCobro();
    if (!abrió) throw new Error('Form no abrió (5 tabs)');
    const info = await pg.evaluate(() => {
      const tabs = [...document.querySelectorAll('ion-segment-button')].filter(s => s.getBoundingClientRect().width > 0);
      const habil = tabs.filter(s => !s.disabled && s.getAttribute('disabled') === null).length;
      return { total: tabs.length, habil, labels: tabs.map(s => s.textContent.trim()) };
    });
    const ok = info.total >= 5 && info.habil <= 1; // solo General activo
    v('DM-COB-002', 'COBRO → form 5 tabs; resto disabled sin cliente', ok ? 'PASS' : 'FAIL',
      `tabs: ${info.total} (${info.labels.join('/')}) · habilitadas: ${info.habil}`);
  } catch (e) {
    v('DM-COB-002', 'COBRO → form 5 tabs', 'FAIL', e.message);
  }

  // ─── DM-COB-004: Seleccionar cliente → tabs habilitadas ───────────────────────
  let clienteOk = false;
  try {
    await seleccionarCliente(DATA.clienteTest);

    // 🔴 El comentario es la LLAVE del módulo cuando requiredComment=true: sin él
    //    las 5 pestañas siguen bloqueadas y nada más avanza. Antes se llamaba a
    //    fillComentario() ignorando lo que devolvía, así que si el campo no
    //    estaba donde se esperaba el fallo salía 3 pasos después disfrazado de
    //    «tabs no habilitadas». Ahora se comprueba que el texto QUEDÓ ESCRITO.
    let comentarioOk = null;
    if (DATA.requiredComment) {
      await fillComentario(comentTest);
      // Verificar sobre TODOS los inputs visibles, no sobre un selector concreto:
      // basta con que el texto esté escrito en alguno.
      comentarioOk = await pg.evaluate((val) => {
        return [...document.querySelectorAll('ion-input, ion-textarea')]
          .filter(i => i.getBoundingClientRect().width > 0)
          .some(i => {
            const n = i.querySelector('input, textarea') ||
                      (i.shadowRoot && i.shadowRoot.querySelector('input, textarea'));
            return n && String(n.value).trim() === val;
          });
      }, comentTest);
      // Un reintento: si el primer intento no escribió, vale la pena insistir
      // antes de dar por perdido el módulo entero.
      if (!comentarioOk) {
        await pg.waitForTimeout(800);
        await fillComentario(comentTest);
        comentarioOk = await pg.evaluate((val) =>
          [...document.querySelectorAll('ion-input, ion-textarea')]
            .filter(i => i.getBoundingClientRect().width > 0)
            .some(i => {
              const n = i.querySelector('input, textarea') ||
                        (i.shadowRoot && i.shadowRoot.querySelector('input, textarea'));
              return n && String(n.value).trim() === val;
            }), comentTest);
      }
    }

    let habil = 0;
    for (let i = 0; i < 8; i++) { habil = await tabsHabilitadas(); if (habil >= 4) break; await pg.waitForTimeout(700); }
    clienteOk = habil >= 4;
    // Se anota el cliente REALMENTE clickeado, no el que pedía el perfil.
    const notaCom = comentarioOk === null ? '' :
      comentarioOk ? ' · comentario escrito ✓'
                   : ' · 🔴 EL COMENTARIO NO SE ESCRIBIÓ (es lo que bloquea las pestañas)';
    v('DM-COB-004', 'Seleccionar cliente → tabs habilitadas', clienteOk ? 'PASS' : 'FAIL',
      `pedido: "${DATA.clienteTest}" · clickeado: "${ultimoClienteClickeado || '—'}" · tabs habilitadas: ${habil}${notaCom}`);
  } catch (e) {
    v('DM-COB-004', 'Seleccionar cliente → tabs habilitadas', 'FAIL', e.message);
  }

  // ─── REQ Enviar · E1 + E2 — cliente elegido, aún sin documento ni pago ────────
  // 🔴 R1 · después de DM-COB-004: la transacción empieza al elegir el cliente.
  // `naceDeshabilitado` declarado: en Cobros es COHERENTE que Enviar nazca
  // deshabilitado, porque antes hay que agregar un método de pago. Así queda
  // como PASS con motivo y no como una falsa alarma en cada corrida — pero si
  // algún día naciera habilitado, la nota del caso lo dirá.
  reqV(await reqInicio(pg, 'COB', {
    naceDeshabilitado: 'primero hay que agregar un método de pago',
  }));
  reqV(await reqRechazo(pg, 'COB'));

  // ─── DM-COB-007: Tab Documentos → lista + leyenda ─────────────────────────────
  let hayDocs = false;
  try {
    await clickTab('documentos');
    const carga = await cargarDocumentos();   // robusto: US$ + reintento con toggle
    const info = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs) return { leyenda: false };
      const txt = docs.textContent.toLowerCase();
      return { leyenda: txt.includes('vigente') || txt.includes('vencido') || txt.includes('favor') };
    });
    hayDocs = carga.cbs > 0;
    v('DM-COB-007', 'Tab Documentos → lista + leyenda', carga.cbs > 0 ? 'PASS' : 'N/A',
      carga.cbs > 0 ? `documentos: ${carga.cbs} · leyenda: ${info.leyenda}`
        : `cliente sin documentos (monedas: ${JSON.stringify((carga.moneda && carga.moneda.labels) || [])})`);
  } catch (e) {
    v('DM-COB-007', 'Tab Documentos', 'FAIL', e.message);
  }

  // ─── DM-COB-008: Marcar documento → total en sticky de Pagos actualiza ─────────
  try {
    if (!hayDocs) { v('DM-COB-008', 'Marcar documento → total actualiza', 'N/A', 'sin documentos'); }
    else {
      const mark = await marcarPrimerDocumento();
      await clickTab('pagos');
      const total = await pg.evaluate(() => {
        const el = [...document.querySelectorAll('app-cobro-pagos *')]
          .find(n => /Monto total a pagar/i.test(n.textContent || ''));
        return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null;
      });
      v('DM-COB-008', 'Marcar documento → total en Pagos', mark.ok && total ? 'PASS' : 'FAIL',
        `marcados: ${mark.count} · total: "${total || 'n/a'}"`);
    }
  } catch (e) {
    v('DM-COB-008', 'Marcar documento → total', 'FAIL', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DM-COB-048/049/050/051 — DESCUENTO DE COBRO (tope maxCollectDiscount)
  //
  // Dónde vive: DETALLE del documento (lupa 🔍) → botón «Asignar descuento».
  //   · la lupa solo existe si `retentionDocTypeCR = true`
  //   · el botón solo existe si `userCanSelectCollectDiscount = true`
  //   · la lupa está DESHABILITADA mientras el documento no esté tildado
  //     ⇒ por eso este bloque va DESPUÉS de DM-COB-008.
  //
  // 🔑 EL TOPE SE APLICA A LA SUMA, y al excederlo NO SE CLAMPEA: el descuento
  //    que provocó el exceso **se quita de la selección** y sale una alerta
  //    (`setNuCollectDiscount` / `toggleTempSelection` → `notifyCollectDiscountLimitExceeded`).
  //    Quien espere «se queda en el máximo» reporta un falso defecto.
  //
  // 🔴 Todo este bloque cierra con CANCELAR. `cancelCollectDiscounts()` restaura
  //    desde lo persistido, así que el cobro del happy path queda INTACTO: aplicar
  //    un 80 % cambiaría el total y rompería DM-COB-040/012/043 aguas abajo.
  // ═══════════════════════════════════════════════════════════════════════════

  /** Abre el detalle (lupa) del primer documento tildado. */
  async function abrirDetalleDocumento() {
    await clickTab('documentos');
    await pg.waitForTimeout(800);
    const coords = await pg.evaluate(() => {
      const docs = document.querySelector('app-cobro-documents');
      if (!docs) return null;
      const btn = [...docs.querySelectorAll('ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .filter(b => b.querySelector('ion-icon[name="search-sharp"]'))
        .find(b => !b.hasAttribute('disabled') && b.getAttribute('disabled') !== 'true');
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y, { delay: 100 });
    await pg.waitForTimeout(1800);
    // El detalle es un ion-modal (#eventModal, isOpen). Confirmar que abrió.
    return pg.evaluate(() =>
      [...document.querySelectorAll('ion-modal')].some(m =>
        m.getBoundingClientRect().width > 0 && /Asignar descuento|Descuento|Nro Comp Ret/i.test(m.textContent || '')));
  }

  /** Pulsa «Asignar descuento» dentro del detalle. */
  async function abrirModalDescuentos() {
    const coords = await pg.evaluate(() => {
      const btn = [...document.querySelectorAll('ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .find(b => /asignar\s+descuento|^descuentos$/i.test((b.textContent || '').trim()));
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y, { delay: 100 });
    await pg.waitForTimeout(1500);
    return pg.evaluate(() =>
      [...document.querySelectorAll('ion-modal.collectDiscounts')].some(m => m.getBoundingClientRect().width > 0));
  }

  /**
   * Lee el estado del modal de descuentos.
   * Las filas se rotulan «{nu}% - {na}», así que el % sale del propio rótulo.
   */
  async function leerModalDescuentos() {
    return pg.evaluate(() => {
      const modal = [...document.querySelectorAll('ion-modal.collectDiscounts')]
        .find(m => m.getBoundingClientRect().width > 0);
      if (!modal) return { abierto: false };
      const filas = [...modal.querySelectorAll('ion-item')]
        .filter(it => it.getBoundingClientRect().width > 0 && it.querySelector('ion-checkbox'))
        .map(it => {
          const cb = it.querySelector('ion-checkbox');
          const txt = (it.querySelector('ion-label')?.textContent || '').replace(/\s+/g, ' ').trim();
          const m = txt.match(/^([\d.,]+)\s*%\s*-\s*(.+)$/);
          return {
            texto: txt,
            pct: m ? Number(String(m[1]).replace(',', '.')) : null,
            nombre: m ? m[2].trim() : txt,
            marcado: cb.checked === true || cb.getAttribute('checked') === 'true',
            deshabilitado: cb.disabled === true || cb.hasAttribute('disabled'),
          };
        });
      const dispTxt = (modal.textContent || '').replace(/\s+/g, ' ');
      const disp = dispTxt.match(/Disponible\s*:?\s*([\d.,]+)\s*%/i);
      const aceptar = [...modal.querySelectorAll('ion-button')]
        .find(b => /aceptar/i.test(b.textContent || ''));
      return {
        abierto: true,
        filas,
        disponible: disp ? Number(String(disp[1]).replace(',', '.')) : null,
        aceptarDeshabilitado: aceptar ? (aceptar.disabled === true || aceptar.hasAttribute('disabled')) : null,
        // Input de tasa: solo se renderiza para los descuentos con require_input=true
        hayInputTasa: !!modal.querySelector('ion-input[type="number"]'),
      };
    });
  }

  /** Tilda/destilda la fila cuyo nombre coincide. Devuelve false si no la halla. */
  async function toggleDescuento(nombre) {
    const coords = await pg.evaluate((nom) => {
      const modal = [...document.querySelectorAll('ion-modal.collectDiscounts')]
        .find(m => m.getBoundingClientRect().width > 0);
      if (!modal) return null;
      const it = [...modal.querySelectorAll('ion-item')]
        .filter(x => x.getBoundingClientRect().width > 0 && x.querySelector('ion-checkbox'))
        .find(x => (x.textContent || '').toLowerCase().includes(String(nom).toLowerCase()));
      if (!it) return null;
      const cb = it.querySelector('ion-checkbox');
      cb.scrollIntoView({ block: 'center' });
      const r = cb.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, nombre);
    if (!coords) return false;
    await pg.mouse.click(coords.x, coords.y, { delay: 80 });
    await pg.waitForTimeout(1200);
    return true;
  }

  /**
   * Vuelve el modal de descuentos a cero: Cancelar y reabrir.
   *
   * 🔴 NO destildar casilla por casilla. Ese era el método anterior y se comía
   *    su propia cola: cuando una casilla queda tildada SIN estar aplicada
   *    (el desfase de DM-COB-052), clicarla no la quita — la AGREGA, porque el
   *    modelo no la tenía. Así, al llegar a DM-COB-051 el modelo cargaba un 80 %
   *    fantasma y el aviso decía «Máximo disponible: 5%»: el caso fallaba por
   *    culpa del guion, no de la app.
   *    `cancelCollectDiscounts()` descarta la selección temporal y al reabrir
   *    modelo y pantalla vuelven a coincidir.
   */
  async function reiniciarDescuentos() {
    const c = await pg.evaluate(() => {
      const modal = [...document.querySelectorAll('ion-modal.collectDiscounts')]
        .find(m => m.getBoundingClientRect().width > 0);
      if (!modal) return null;
      const btn = [...modal.querySelectorAll('ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0)
        .find(b => /cancelar/i.test((b.textContent || '').trim()));
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (c) { await pg.mouse.click(c.x, c.y, { delay: 80 }); await pg.waitForTimeout(1200); }
    return abrirModalDescuentos();
  }

  /**
   * Acepta el modal de descuentos (los APLICA al documento abierto).
   *
   * ⚠ Puede aparecer el aviso de «remanente»: si el descuento sobra respecto al
   *   saldo, la app ofrece llevarlo a un anticipo (`alertDiscountRemnantOpen`).
   *   Con un descuento por debajo del saldo no debería salir; se atiende igual.
   */
  async function aceptarDescuentos() {
    const c = await pg.evaluate(() => {
      const modal = [...document.querySelectorAll('ion-modal.collectDiscounts')]
        .find(m => m.getBoundingClientRect().width > 0);
      if (!modal) return null;
      const btn = [...modal.querySelectorAll('ion-button')]
        .filter(b => b.getBoundingClientRect().width > 0 && !b.hasAttribute('disabled'))
        .find(b => /aceptar/i.test((b.textContent || '').trim()));
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!c) return { ok: false, motivo: 'botón Aceptar ausente o deshabilitado' };
    await pg.mouse.click(c.x, c.y, { delay: 90 });
    await pg.waitForTimeout(1600);
    const aviso = await readAlert();
    if (aviso) { await clickAlertBtn(['Aceptar', 'OK', 'Sí']).catch(() => {}); await pg.waitForTimeout(1200); }
    const cerrado = await pg.evaluate(() =>
      ![...document.querySelectorAll('ion-modal.collectDiscounts')]
        .some(m => m.getBoundingClientRect().width > 0));
    return { ok: cerrado, aviso };
  }

  /**
   * Cierra el DETALLE del documento por GUARDAR.
   *
   * 🔴 No da igual el botón. El pie del detalle es
   *      Cancelar → saveDocumentSale(false)   ·   Guardar → saveDocumentSale(true)
   *    (cobro-documents.component.html, pie del #eventModal). Salir por Cancelar
   *    DESCARTA lo que se hizo dentro — que es justo lo que quieren los casos
   *    048-052, y justo lo que NO quiere el flujo que aplica el descuento.
   */
  async function cerrarDetalleGuardando() {
    const c = await pg.evaluate(() => {
      const modal = [...document.querySelectorAll('ion-modal')]
        .filter(m => m.getBoundingClientRect().width > 0).pop();
      if (!modal) return null;
      const btn = [...modal.querySelectorAll('ion-button.botonAddVerde')]
        .filter(b => b.getBoundingClientRect().width > 0 && !b.hasAttribute('disabled'))
        .pop();
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    if (!c) return false;
    await pg.mouse.click(c.x, c.y, { delay: 90 });
    await pg.waitForTimeout(1800);
    const al = await readAlert();
    if (al) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});
    return true;
  }

  /** Cierra el modal de descuentos con Cancelar y luego el detalle del documento. */
  async function cerrarDescuentosSinAplicar() {
    for (const rotulo of [/cancelar/i, /cerrar|cancelar/i]) {
      const c = await pg.evaluate((re) => {
        const rx = new RegExp(re.source, re.flags);
        const modal = [...document.querySelectorAll('ion-modal')]
          .filter(m => m.getBoundingClientRect().width > 0).pop();
        if (!modal) return null;
        const btn = [...modal.querySelectorAll('ion-button')]
          .filter(b => b.getBoundingClientRect().width > 0)
          .find(b => rx.test((b.textContent || '').trim()));
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, { source: rotulo.source, flags: rotulo.flags });
      if (c) { await pg.mouse.click(c.x, c.y, { delay: 80 }); await pg.waitForTimeout(1200); }
    }
    await pg.waitForTimeout(600);
  }

  /**
   * ¿El texto leído es EL aviso del tope de descuento?
   *
   * 🔴 No basta con «salió una alerta». `readAlert()` devuelve cualquier ion-alert
   *    activa, y en Cobros hay varias (guarda de salida, usuario diferente…). Si
   *    se toma cualquiera como prueba del rechazo, un aviso ajeno da un PASS
   *    falso. El mensaje real lo arma `notifyCollectDiscountLimitExceeded`:
   *      «Se superó el límite de descuento (85%). Máximo disponible: 5%.»
   *    — y puede venir del tag COB_MSJ_DISCOUNT_EXCEEDS_100 con otra redacción,
   *    por eso se acepta cualquiera que hable de límite/tope + descuento.
   */
  function esAlertaTope(txt) {
    if (!txt) return false;
    return /descuento/i.test(txt) &&
           /l[íi]mite|tope|super[óo]|excede|m[áa]ximo\s+disponible/i.test(txt);
  }

  const DESC_IDS = ['DM-COB-048', 'DM-COB-049', 'DM-COB-050', 'DM-COB-051', 'DM-COB-052'];
  // El bloque del tope descubre cuál descuento del catálogo entra por debajo del
  // límite; el segundo cobro lo reutiliza para aplicarlo de verdad. Se descubre
  // en la UI, no se codifica: los nombres los pone quien los crea en la web.
  let nombreDtoAplicable = null;
  let pctDtoAplicable = null;
  try {
    const TOPE = Number(DATA.maxCollectDiscount) || 100;

    if (!DATA.userCanSelectCollectDiscount) {
      DESC_IDS.forEach(id => v(id, id, 'N/A', 'userCanSelectCollectDiscount=false'));
    } else if (!DATA.retentionDocTypeCR) {
      DESC_IDS.forEach(id => v(id, id, 'N/A',
        'retentionDocTypeCR=false ⇒ no existe la lupa que abre el detalle del documento'));
    } else if (!hayDocs) {
      DESC_IDS.forEach(id => v(id, id, 'N/A', 'sin documentos seleccionados'));
    } else {
      const detalle = await abrirDetalleDocumento();

      // ── DM-COB-048: el botón «Asignar descuento» está en el detalle ──────────
      if (!detalle) {
        v('DM-COB-048', 'Detalle del documento → botón «Asignar descuento»', 'FAIL',
          'no se pudo abrir el detalle (lupa ausente o deshabilitada pese a documento tildado)');
        ['DM-COB-049', 'DM-COB-050', 'DM-COB-051', 'DM-COB-052'].forEach(id =>
          v(id, id, 'BLOCKED', 'DM-COB-048 no abrió el detalle'));
      } else {
        const abierto = await abrirModalDescuentos();
        v('DM-COB-048', 'Detalle del documento → botón «Asignar descuento» abre el modal',
          abierto ? 'PASS' : 'FAIL',
          `userCanSelectCollectDiscount=true · tope configurado: ${TOPE}%`);

        if (!abierto) {
          ['DM-COB-049', 'DM-COB-050', 'DM-COB-051', 'DM-COB-052'].forEach(id =>
            v(id, id, 'BLOCKED', 'el modal de descuentos no abrió'));
        } else {
          const inicial = await leerModalDescuentos();
          const cat = inicial.filas || [];
          const fijos = cat.filter(f => f.pct !== null && f.pct > 0);


          // ── DM-COB-049: un descuento por debajo del tope se acepta ────────────
          const bajoTope = fijos.find(f => f.pct <= TOPE);
          if (!bajoTope) {
            v('DM-COB-049', 'Descuento bajo el tope se acepta', 'BLOCKED',
              `el catálogo no trae ningún descuento ≤ ${TOPE}% · filas: ${cat.map(f => f.texto).join(' | ') || '(vacío)'}`);
          } else {
            nombreDtoAplicable = bajoTope.nombre;
            pctDtoAplicable = bajoTope.pct;
            await toggleDescuento(bajoTope.nombre);
            const tras = await leerModalDescuentos();
            const fila = (tras.filas || []).find(f => f.nombre === bajoTope.nombre);
            const alerta = await readAlert();
            const ok = !!(fila && fila.marcado) && !esAlertaTope(alerta);
            v('DM-COB-049', `Descuento ${bajoTope.pct}% (≤ ${TOPE}%) se acepta`,
              ok ? 'PASS' : 'FAIL',
              `«${bajoTope.nombre}» marcado: ${fila ? fila.marcado : 'fila ausente'} · ` +
              `disponible: ${tras.disponible === null ? '—' : tras.disponible + '%'} · ` +
              `alerta: ${alerta || 'ninguna'}`);
            if (alerta) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});
          }

          // ── DM-COB-050: excederse del tope se rechaza (y NO se clampea) ───────
          //
          // 🔑 DOS MANERAS de excederse, y hay que admitir las dos. La segunda
          //    es la que permite probar el tope SIN tocar la BD: basta bajar
          //    `maxCollectDiscount` en la web por debajo del descuento que ya
          //    existe (p. ej. tope 79 contra el «Probando» de 80 %) y sincronizar.
          //      a) por SUMA      — dos descuentos que juntos pasan del tope
          //      b) por SÍ SOLO   — un único descuento cuyo % ya supera el tope
          const usado  = bajoTope ? bajoTope.pct : 0;
          const porSuma = bajoTope
            ? fijos.find(f => f.nombre !== bajoTope.nombre && (usado + f.pct) > TOPE)
            : null;
          const porSiSolo = fijos.find(f => f.pct > TOPE);
          const culpable  = porSuma || porSiSolo;

          if (!culpable) {
            v('DM-COB-050', `Excederse de ${TOPE}% se rechaza`, 'BLOCKED',
              `con este catálogo no hay forma de pasarse del ${TOPE}%: ` +
              `${fijos.map(f => `${f.nombre} ${f.pct}%`).join(' · ') || '(ninguno)'}. ` +
              `Dos salidas, ambas por WEB + sincronizar: (1) bajar maxCollectDiscount ` +
              `(Variables Globales → Cobros) por debajo de ` +
              `${fijos.length ? Math.max(...fijos.map(f => f.pct)) : 0}%, o ` +
              '(2) crear otro descuento en Empresa → Configuración → Descuentos para Cobros');
            v('DM-COB-052', 'Tras el rechazo, la casilla NO queda tildada', 'BLOCKED',
              'sin rechazo que provocar, no hay nada que observar');
          } else {
            const via = porSuma
              ? `${usado}% + ${culpable.pct}% = ${usado + culpable.pct}% > ${TOPE}%`
              : `${culpable.pct}% > ${TOPE}% (un solo descuento ya se pasa)`;
            // Si se excede por sí solo, partir de cero: destildar lo que hubiera.
            if (!porSuma) {
              for (const f of (await leerModalDescuentos()).filas || []) {
                if (f.marcado) await toggleDescuento(f.nombre);
              }
            }
            await toggleDescuento(culpable.nombre);
            const alerta = await readAlert();
            const tras   = await leerModalDescuentos();
            const fila   = (tras.filas || []).find(f => f.nombre === culpable.nombre);
            const previo = porSuma
              ? (tras.filas || []).find(f => f.nombre === bajoTope.nombre)
              : null;
            // Rechazo correcto = aviso del tope + el culpable NO queda marcado
            //                    (+ si venía por suma, el anterior sobrevive)
            // 🔑 SON DOS COSAS DISTINTAS, y mezclarlas dio un FAIL confuso:
            //
            //   050 · ¿la app RECHAZA? — lo dicen el aviso del tope y que el
            //         descuento previo siga en pie. Esto funcionó bien.
            //   052 · ¿la casilla refleja el rechazo? — quedó TILDADA aunque el
            //         descuento no se aplicó. Es un hallazgo aparte.
            //
            // El aviso trae su propia prueba de que el modelo NO lo aceptó:
            // «Máximo disponible: X%» se calcula sobre lo YA seleccionado, así
            // que si dice 75 % con tope 85, el modelo tenía 10 %, no 90 %.
            const rechazo = esAlertaTope(alerta) && (!porSuma || !!(previo && previo.marcado));
            v('DM-COB-050', `${via} ⇒ se rechaza`, rechazo ? 'PASS' : 'FAIL',
              `alerta: "${alerta || 'NINGUNA'}"` +
              (porSuma ? ` · «${bajoTope.nombre}» sigue marcado: ${previo ? previo.marcado : 'n/a'}` : ''));

            const casilla = fila ? fila.marcado : null;
            v('DM-COB-052', 'Tras el rechazo, la casilla NO queda tildada',
              casilla === false ? 'PASS' : (casilla === null ? 'BLOCKED' : 'FAIL'),
              casilla === null
                ? `no se pudo releer la fila «${culpable.nombre}»`
                : `«${culpable.nombre}» quedó marcado: ${casilla}. ` +
                  (casilla
                    ? '🔴 El descuento NO se aplicó (lo confirma el propio aviso) pero la casilla ' +
                      'sigue tildada: el vendedor ve puesto un descuento que no está. ' +
                      'La rama que rechaza en toggleTempSelection hace return sin detectChanges(), ' +
                      'al revés que sus dos hermanas, y el binding [checked] no reescribe el DOM. ' +
                      'CONFIRMAR A MANO antes de reportar.'
                    : 'la casilla vuelve sola a su sitio'));
            if (alerta) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});
          }

          // ── DM-COB-051: tasa escrita — borde exacto del tope ──────────────────
          // Se arranca de cero: 050 dejó descuentos puestos y casillas desfasadas.
          // 🔴 EL EDITABLE NO SE BUSCA POR NOMBRE. Antes se buscaba /tasa libre/i
          //    —el nombre que yo inventé en un SQL que ni llegó a usarse— y este
          //    caso salió BLOCKED diciendo que no había ninguno, habiendo DOS
          //    («DESC MANUAL»). El nombre lo escribe quien crea el descuento en
          //    la web: no identifica nada. Lo que distingue al editable es su
          //    COMPORTAMIENTO: al marcarlo aparece el input de tasa
          //    (@if requireInput === true). Se prueban primero los de 0 %, que
          //    es como quedan guardados los manuales.
          await reiniciarDescuentos();
          let libre = null;
          const candidatos = [...cat].sort((a, b) => (a.pct === 0 ? 0 : 1) - (b.pct === 0 ? 0 : 1));
          for (const c of candidatos) {
            if (c.pct !== null && c.pct > TOPE) continue;   // dispararía el aviso del tope
            if (!(await toggleDescuento(c.nombre))) continue;
            const st = await leerModalDescuentos();
            const al = await readAlert();
            if (al) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});
            if (st.hayInputTasa) { libre = c; break; }
            await reiniciarDescuentos();
          }

          if (!libre) {
            v('DM-COB-051', `Tasa escrita: ${TOPE}% acepta · ${TOPE + 1}% rechaza`, 'BLOCKED',
              `ninguno de los ${cat.length} descuento(s) del catálogo abre el input de tasa ` +
              'al marcarlo (require_input=true). Crear uno con «Porcentaje Manual = SÍ» en ' +
              'Empresa → Configuración → Descuentos para Cobros y sincronizar');
          } else {
            // El bucle de detección dejó SOLO el editable marcado. No se destilda
            // nada a mano: con las casillas desfasadas, un clic agrega en vez de quitar.
            await pg.waitForTimeout(600);

            const escribirTasa = async (valor) => {
              await pg.evaluate((val) => {
                const modal = [...document.querySelectorAll('ion-modal.collectDiscounts')]
                  .find(m => m.getBoundingClientRect().width > 0);
                const inp = modal && modal.querySelector('ion-input[type="number"]');
                if (!inp) return false;
                const native = inp.querySelector('input') ||
                  (inp.shadowRoot && inp.shadowRoot.querySelector('input'));
                if (!native) return false;
                const setter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype, 'value').set;
                setter.call(native, String(val));
                native.dispatchEvent(new Event('input', { bubbles: true }));
                native.dispatchEvent(new Event('change', { bubbles: true }));
                inp.dispatchEvent(new CustomEvent('ionInput', { bubbles: true, detail: { value: String(val) } }));
                inp.dispatchEvent(new CustomEvent('ionChange', { bubbles: true, detail: { value: String(val) } }));
                return true;
              }, valor);
              await pg.waitForTimeout(1300);
            };

            await escribirTasa(TOPE);
            const enTope = await leerModalDescuentos();
            const filaTope = (enTope.filas || []).find(f => f.nombre === libre.nombre);
            const alertaTope = await readAlert();
            if (alertaTope) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});

            await escribirTasa(TOPE + 1);
            const alertaExceso = await readAlert();
            const trasExceso = await leerModalDescuentos();
            const filaExceso = (trasExceso.filas || []).find(f => f.nombre === libre.nombre);
            if (alertaExceso) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});

            // Borde: TOPE se acepta (sin alerta, sigue marcado) · TOPE+1 se rechaza
            // (alerta) y el descuento SE QUITA de la selección.
            const aceptaTope  = !esAlertaTope(alertaTope) && !!(filaTope && filaTope.marcado);
            const rechazaMas  = esAlertaTope(alertaExceso) && !!(filaExceso && !filaExceso.marcado);
            v('DM-COB-051', `Tasa escrita: ${TOPE}% se acepta · ${TOPE + 1}% se rechaza`,
              (aceptaTope && rechazaMas) ? 'PASS' : 'FAIL',
              `${TOPE}% → alerta: "${alertaTope || 'ninguna'}", marcado: ${filaTope ? filaTope.marcado : 'n/a'} · ` +
              `${TOPE + 1}% → alerta: "${alertaExceso || 'NINGUNA'}", marcado: ` +
              `${filaExceso ? filaExceso.marcado : 'n/a'} (debe quedar false: al exceder se QUITA)`);
          }

          await cerrarDescuentosSinAplicar();
        }
      }
      // Volver al formulario: el detalle se cierra con Cancelar/Cerrar.
      await cerrarDescuentosSinAplicar();
    }
  } catch (e) {
    DESC_IDS.forEach(id => {
      if (!verdicts.some(x => x.id === id)) v(id, id, 'FAIL', e.message);
    });
    await cerrarDescuentosSinAplicar().catch(() => {});
  }

  // ─── DM-COB-009: Tab Pagos → click "Agregar método de pago" → modal ───────────
  try {
    await clickTab('pagos');
    // Click REAL en #eventSelect (setShowEventModal(true)). NO usar .present() → forzaba
    // el modal size="cover" a pantalla completa saltando el binding de Angular.
    const addInfo = await pg.evaluate(() => {
      const btn = document.querySelector('ion-button#eventSelect, ion-button.pagos-add-method-btn');
      if (!btn || btn.getBoundingClientRect().width === 0) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: btn.disabled };
    });
    if (!addInfo) {
      v('DM-COB-009', 'Tab Pagos → botón "Agregar método de pago"', 'N/A',
        'botón no visible (requiere documento/monto seleccionado)');
    } else if (addInfo.disabled) {
      v('DM-COB-009', 'Tab Pagos → botón "Agregar método de pago"', 'N/A',
        'botón disabled (isAddPaymentMethodDisabled — falta documento/monto)');
    } else {
      await pg.mouse.click(addInfo.x, addInfo.y, { delay: 100 });
      await pg.waitForTimeout(1800);
      const info = await pg.evaluate(() => {
        const mods = [...document.querySelectorAll('#eventModal')]
          .filter(m => m.offsetParent !== null && /Efectivo|Transferencia|Dep/i.test(m.textContent));
        if (!mods.length) return { open: false };
        const metodos = (mods[0].textContent.match(/Efectivo|Cheque|Transferencia|Dep[oó]sito|Otros|Pago M[oó]vil/gi) || []);
        return { open: true, metodos: [...new Set(metodos)] };
      });
      v('DM-COB-009', 'Tab Pagos → modal métodos de pago', info.open ? 'PASS' : 'FAIL',
        info.open ? `métodos: ${info.metodos.join(', ')}` : 'modal no abrió tras click');
      // Cerrar por el botón Cancelar del modal (setShowEventModal(false)) — mantiene estado Angular
      await pg.evaluate(() => {
        const mod = [...document.querySelectorAll('#eventModal')].find(m => m.offsetParent !== null);
        if (!mod) return;
        const cancel = [...mod.querySelectorAll('ion-button[color="light"]')].find(b => b.getBoundingClientRect().width > 0);
        if (cancel) cancel.click();
      });
      await pg.waitForTimeout(800);
    }
  } catch (e) {
    v('DM-COB-009', 'Tab Pagos → modal métodos', 'FAIL', e.message);
  }

  // ─── DM-COB-040/012/043: Completar pago Efectivo = total → diferencia azul ─────
  let pagoOk = false;
  try {
    if (!hayDocs) {
      ['DM-COB-040', 'DM-COB-012', 'DM-COB-043'].forEach(id => v(id, id, 'N/A', 'sin documento seleccionado'));
    } else {
      await clickTab('pagos');
      const difAntes = await leerPagosSticky();     // sin pago → diferencia roja (negativa)
      const pago = await agregarPagoEfectivo();
      if (!pago.ok) throw new Error(pago.error || 'pago falló');
      const difDespues = await leerPagosSticky();   // pago = total → diferencia azul (0,00)
      const esAzul = /blue|rgb\(0,\s*0,\s*255\)|#00f/i.test(difDespues.difColor || '');
      const esCero = /^-?0([.,]0+)?$/.test((difDespues.difVal || '').trim());
      pagoOk = esAzul || esCero;
      v('DM-COB-040', 'Completar pago Efectivo = total → diferencia azul', pagoOk ? 'PASS' : 'FAIL',
        `monto: ${pago.monto} · antes: ${difAntes.difVal}(${difAntes.difColor}) · después: ${difDespues.difVal}(${difDespues.difColor})`);
      const rojoAntes = /red|rgb\(255,\s*0,\s*0\)/i.test(difAntes.difColor || '');
      v('DM-COB-012', 'Diferencia rojo (insuf.) → azul (cubre)', (rojoAntes && pagoOk) ? 'PASS' : 'FAIL',
        `antes: ${difAntes.difColor} · después: ${difDespues.difColor}`);
      v('DM-COB-043', 'Diferencia se actualiza con el monto', (difAntes.difVal !== difDespues.difVal) ? 'PASS' : 'FAIL',
        `antes: ${difAntes.difVal} · después: ${difDespues.difVal}`);
    }
  } catch (e) {
    ['DM-COB-040', 'DM-COB-012', 'DM-COB-043'].forEach(id => {
      if (!verdicts.find(x => x.id === id)) v(id, id, 'FAIL', e.message);
    });
  }

  // ─── DM-COB-016: Tab Adjuntos → acordeones visibles ───────────────────────────
  // NOTA: la inyección de adjunto (inyectarAdjunto) queda para DM-COB-019 (Fase 2), JUSTO
  // antes de Enviar. Inyectar aquí (antes de Guardar) dispara onAttachmentChanged y rompe el
  // Guardar inmediato — confirmado en corrida 20260826_162210 (018 sin alert + cascada nav).
  try {
    await clickTab('adjuntos');
    const info = await pg.evaluate(() => {
      const adj = document.querySelector('app-adjunto');
      const txt = (adj ? adj.textContent : document.body.textContent).toLowerCase();
      return {
        img: txt.includes('imagen') || txt.includes('foto'),
        arch: txt.includes('archivo') || txt.includes('file'),
        firma: txt.includes('firma'),
      };
    });
    v('DM-COB-016', 'Tab Adjuntos → acordeones visibles', info.img ? 'PASS' : 'FAIL',
      `imágenes: ${info.img} · archivo: ${info.arch} · firma: ${info.firma}`);
  } catch (e) {
    v('DM-COB-016', 'Tab Adjuntos', 'FAIL', e.message);
  }

  // ─── DM-COB-018: Guardar → alert "El Cobro se ha guardado" ─────────────────────
  let guardadoOk = false;
  let antesDeGuardar = null;   // foto del cobro antes de guardar, para cotejar al reabrirlo
  let enviadoOk = false;
  try {
    // 🔴 NO decidir con la foto vieja. `clienteOk` se calculó en DM-COB-004, al
    //    principio del módulo; si en ese instante las pestañas todavía no se
    //    habían habilitado, quedaba en false PARA SIEMPRE — y Guardar y Enviar
    //    se saltaban con «sin cliente válido» aunque el cobro estuviera completo
    //    y listo. Eso fue lo que se vio el 07/09: los casos intermedios pasaban
    //    (5 documentos marcados, diferencia en azul) y aun así no guardaba.
    //
    //    Se vuelve a mirar el estado REAL justo antes de guardar.
    const listoAhora = await pg.evaluate(() => {
      const vis = el => el.getBoundingClientRect().width > 0;
      const tabs = [...document.querySelectorAll('ion-segment-button')].filter(vis);
      const habilitadas = tabs.filter(t => !(t.disabled || t.getAttribute('disabled') !== null)).length;
      const btn = document.querySelector('ion-button.imagenGuardar');
      return {
        habilitadas,
        guardarDisponible: !!btn && vis(btn) && !btn.disabled,
      };
    });
    const puedeGuardar = listoAhora.guardarDisponible && listoAhora.habilitadas >= 4;

    if (!puedeGuardar) {
      v('DM-COB-018', 'Guardar cobro → alert', 'N/A',
        `no está listo para guardar · tabs habilitadas: ${listoAhora.habilitadas} · ` +
        `botón Guardar: ${listoAhora.guardarDisponible ? 'disponible' : 'no disponible'} · ` +
        `(al inicio del módulo: cliente ${clienteOk ? 'ok' : 'no ok'}, documentos ${hayDocs ? 'sí' : 'no'})`);
    } else {
      // ── REQ Enviar · E5 ─────────────────────────────────────────────────────
      // El cobro está completo: documento marcado y pago cuadrado con el total
      // (DM-COB-040/012/043 dejaron la diferencia en azul). Si alguna pestaña
      // sigue en rojo aquí, no corresponde a ningún campo pendiente (F1).
      // Se mide antes de Guardar, que es el punto más avanzado al que llega la
      // Fase 1 del guion: el Enviar de Cobros vive en DM-COB-019 y depende del
      // adjunto obligatorio.
      reqV(await reqPestanaRoja(pg, 'COB', { rotar: true }));

      // 📸 Foto del cobro ANTES de guardar. Es lo que se comparará al reabrirlo
      //    en DM-COB-024: sin esto no se puede afirmar que «no se perdió nada»,
      //    solo que la pantalla abre.
      //
      // 🔴 Los campos (Cliente, Responsable, Comentario) están en la pestaña
      //    GENERAL. Al llegar aquí estamos parados en Pagos o Adjuntos, así que
      //    NO son visibles y la foto salía VACÍA — y una foto vacía hace que el
      //    cotejo compare 0 campos y pase por defecto. Hay que volver a General.
      const tabGen = await clickTab('general').catch(e => ({ ok: false, motivo: e.message }));
      await pg.waitForTimeout(900);
      antesDeGuardar = await fotoDelCobro();
      if (tabGen && !tabGen.ok) {
        antesDeGuardar.diag.tabGeneral = tabGen.motivo +
          (tabGen.valores ? ` · las que hay: ${tabGen.valores.join(', ')}` : '');
      }

      const clic = await clickGuardarEnviar('imagenGuardar');
      await pg.waitForTimeout(1500);
      const alertMsg = await readAlert();
      guardadoOk = !!(alertMsg && /guardad/i.test(alertMsg));
      // La vía por la que respondió el botón se anota siempre: si empieza a
      // resolverse por 'dom' de forma sistemática, es que el clic real dejó de
      // llegar al header y hay que revisar las coordenadas, no seguir tapándolo.
      const viaTxt = clic.ok ? `clic:${clic.via}/${clic.motivo}` : `clic FALLÓ (${clic.motivo})`;
      v('DM-COB-018', 'Guardar cobro → alert confirmación', guardadoOk ? 'PASS' : 'FAIL',
        `${viaTxt} · alert: "${alertMsg || 'ninguno'}"`);
      if (alertMsg) await clickAlertBtn(['Aceptar', 'OK']);
    }
  } catch (e) {
    v('DM-COB-018', 'Guardar cobro', 'FAIL', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FLUJO DE PERSISTENCIA — el orden importa (definido con QA el 07/09)
  //
  //   guardar → salir → BUSCAR → reabrir → COTEJAR que nada se perdió → ENVIAR
  //
  // 🔴 Antes el orden era: guardar → enviar(BLOCKED) → buscar → reabrir → BORRAR.
  //    Dos errores: el envío se saltaba por un motivo que ya no aplica
  //    (`requiredCollectionAttachments` pasó a false), y el caso de eliminar
  //    borraba el cobro ANTES de que nadie lo enviara. Resultado: el script
  //    guardaba, borraba, y no enviaba nunca.
  //
  //    Eliminar un guardado es un SEGUNDO FLUJO, con su propio cobro. No puede
  //    destruir el que está por enviarse.
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── DM-COB-022: BUSCAR → lista + searchbar ───────────────────────────────────
  try {
    await irAHomeCobros();
    await clickBotonHome('BUSCAR');
    let info = { list: false, items: 0 };
    for (let i = 0; i < 10; i++) {
      await pg.waitForTimeout(1000);
      info = await pg.evaluate(() => {
        const list = document.querySelector('app-cobros-list');
        if (!list || list.offsetParent === null) return { list: false, items: 0 };
        const items = [...list.querySelectorAll('ion-item')].filter(el => el.getBoundingClientRect().width > 0).length;
        const sb = !!list.querySelector('ion-searchbar');
        return { list: true, items, sb };
      });
      if (info.list) break;
    }
    v('DM-COB-022', 'BUSCAR → lista con searchbar', info.list ? 'PASS' : 'FAIL',
      `lista: ${info.list} · ítems: ${info.items} · searchbar: ${info.sb}`);
  } catch (e) {
    v('DM-COB-022', 'BUSCAR → lista', 'FAIL', e.message);
  }

  // ─── DM-COB-024: reabrir el Guardado y COTEJAR que no se perdió nada ──────────
  let reabiertoOk = false;   // el COTEJO de campos salió bien
  // 🔴 Distinto de reabiertoOk: dice solo si el cobro ABRIÓ. Enviar depende de
  //    esto, NO del cotejo. El 07/09 16:02 el cobro abrió perfecto (5 tabs) pero
  //    la foto vino vacía ⇒ 024 BLOCKED ⇒ 019 quedó N/A y NO SE ENVIÓ NADA. El
  //    envío no puede caerse porque la comparación no tuviera insumo.
  let reabrioOk = false;
  try {
    if (!guardadoOk) {
      v('DM-COB-024', 'Reabrir Guardado → los datos persisten', 'N/A', 'no hubo cobro guardado');
    } else {
      const coords = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('app-cobros-list ion-item')]
          .filter(el => el.getBoundingClientRect().width > 0 && /Guardado/i.test(el.textContent));
        if (!items.length) return null;
        items[0].scrollIntoView({ block: 'center' });
        const r = items[0].getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!coords) {
        v('DM-COB-024', 'Reabrir Guardado → los datos persisten', 'FAIL',
          'se guardó pero NO aparece en la lista de Guardados');
      } else {
        await pg.mouse.click(coords.x, coords.y, { delay: 120 });
        await pg.waitForTimeout(2500);
        // Mismo motivo que arriba: los campos viven en General.
        await clickTab('general').catch(() => {});
        await pg.waitForTimeout(900);

        // 📸 Segunda foto, en el mismo formato que la de antes de guardar
        const despues = await fotoDelCobro();

        const habil = await tabsHabilitadas();
        // Comparar los campos que TENÍAN valor antes: si alguno se vació o cambió,
        // se perdió un dato al guardar.
        const perdidos = [];
        if (antesDeGuardar) {
          for (const [et, val] of Object.entries(antesDeGuardar.campos)) {
            if (!val) continue;
            const ahora = despues.campos[et];
            if (ahora !== val) perdidos.push(`${et}: "${val}" → "${ahora === undefined ? '(ausente)' : ahora}"`);
          }
          if (antesDeGuardar.total && antesDeGuardar.total !== despues.total) {
            perdidos.push(`Monto total: "${antesDeGuardar.total}" → "${despues.total}"`);
          }
        }

        // 🔴 Un cotejo que no comparó NADA no es un PASS: es un caso sin medir.
        //    Con la foto vacía el resultado era trivialmente cierto y pasaba
        //    por defecto, que es peor que fallar.
        const conValor = antesDeGuardar
          ? Object.values(antesDeGuardar.campos).filter(x => x).length : 0;
        const nCampos = antesDeGuardar ? Object.keys(antesDeGuardar.campos).length : 0;

        reabrioOk = habil >= 3;
        if (conValor === 0) {
          const dg = (antesDeGuardar && antesDeGuardar.diag) || {};
          v('DM-COB-024', 'Reabrir Guardado → los datos persisten', 'BLOCKED',
            `no hay nada que cotejar: la foto previa quedó vacía (${nCampos} campos leídos, ` +
            `0 con valor). El cobro se reabrió (tabs: ${habil}), pero eso NO prueba persistencia · ` +
            `diagnóstico: ${dg.inputsVisibles ?? '?'} input(s) visibles, pestaña "${dg.tabActiva || '?'}"` +
            `${dg.tabGeneral ? ' · 🔴 ' + dg.tabGeneral : ''}` +
            `${dg.muestra && dg.muestra.length ? ' · rótulos: ' + dg.muestra.join(' | ') : ' · ninguno con rótulo'}`);
        } else {
          reabiertoOk = habil >= 3 && perdidos.length === 0;
          v('DM-COB-024', 'Reabrir Guardado → los datos persisten',
            reabiertoOk ? 'PASS' : 'FAIL',
            perdidos.length
              ? `🔴 ${perdidos.length} de ${conValor} dato(s) cambiaron al guardar: ${perdidos.join(' · ')}`
              : `tabs accesibles: ${habil} · ${conValor} campo(s) con valor conservados · total: ${despues.total || '—'}`);
        }
      }
    }
  } catch (e) {
    v('DM-COB-024', 'Reabrir Guardado → los datos persisten', 'FAIL', e.message);
  }

  // ─── DM-COB-019: ENVIAR el cobro reabierto ───────────────────────────────────
  try {
    if (!guardadoOk) {
      v('DM-COB-019', 'Enviar cobro', 'N/A', 'no hubo cobro guardado');
    } else if (DATA.requiredCollectionAttachments && DATA.mockCamaraFunciona === false) {
      // Regla de QA: adjunto obligatorio sin mock ⇒ se deja GUARDADO y lo envía QA.
      v('DM-COB-019', 'Enviar cobro', 'SKIP',
        'requiredCollectionAttachments=true + mock_camara_funciona=false → queda Guardado, lo envía QA');
    } else if (!reabrioOk) {
      v('DM-COB-019', 'Enviar cobro', 'N/A', 'el cobro guardado no llegó a abrirse');
    } else {
      const clic = await clickGuardarEnviar('imagenEnviar');
      await pg.waitForTimeout(1800);

      // Confirmación «El Cobro será enviado» → ACEPTAR (aquí sí se envía)
      const dialogo = await readAlert();
      if (dialogo && /ser[áa] enviad|desea enviar/i.test(dialogo)) {
        await clickAlertBtn(['Aceptar', 'OK', 'Sí']).catch(() => {});
        await pg.waitForTimeout(3000);
      }
      const cierre = await readAlert();
      if (cierre) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});
      await pg.waitForTimeout(1500);

      // El oráculo es el ESTATUS en la lista, no la alerta.
      const estados = await abrirListaCobros();
      // 🔴 El oráculo NO puede ser solo «ya no hay guardados»: si la lista se
      //    vaciara o no cargara, eso también daría 0 y pasaría. Hace falta ver
      //    el cobro del OTRO lado: al menos un Enviado / Por aprobar.
      // 🔑 EL ORÁCULO ES LA NUBE, NO LA LISTA.
      //    Contar ítems «Enviado» en la UI dio FAIL tres corridas seguidas
      //    (07/09) porque la lista se leía antes de pintar — mientras los cobros
      //    estaban perfectamente en la nube (Test-COB-204126 y Test-COB-786509,
      //    st_collection=3). El comentario de la corrida es único, así que sirve
      //    de huella para encontrar EL cobro de ESTA corrida.
      let enNube = null;
      if (DATA.clienteSlug) {
        for (let i = 0; i < 5; i++) {
          const filas = consultaNube(DATA.clienteSlug,
            `select co_collection, nu_amount_total, co_currency, st_collection ` +
            `from collection where tx_comment = '${comentTest}' limit 1`);
          if (filas && filas.length) { enNube = filas[0]; break; }
          await pg.waitForTimeout(3000);
        }
      }

      const porUI = estados.guardados === 0 && estados.enviados > 0;
      enviadoOk = !!enNube || porUI;

      const detalle =
        `${clic.ok ? 'clic:' + clic.via : 'clic FALLÓ (' + clic.motivo + ')'} · ` +
        `diálogo: "${dialogo || 'ninguno'}"`;
      const enUI = `UI → guardados: ${estados.guardados} · enviados: ${estados.enviados} · ` +
        `total en lista: ${estados.total}`;

      v('DM-COB-019', 'Enviar cobro → llega a la nube',
        enviadoOk ? 'PASS' : 'FAIL',
        enNube
          ? `${detalle} · ☁ EN LA NUBE: ${enNube.co_collection} · ` +
            `${enNube.nu_amount_total} ${enNube.co_currency || ''} · st=${enNube.st_collection} ` +
            `(comentario ${comentTest})` +
            (porUI ? '' : ` · ⚠ la UI no lo reflejaba (${enUI}) — revisar solo si se repite`)
          : (DATA.clienteSlug
              ? `${detalle} · ✗ no aparece en la nube ningún cobro con comentario ` +
                `${comentTest} · ${enUI}`
              : `${detalle} · sin clienteSlug: no se pudo consultar la nube · ${enUI}`));
    }
  } catch (e) {
    v('DM-COB-019', 'Enviar cobro', 'FAIL', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEGUNDO COBRO — cierra DESCUENTOS de punta a punta y destraba DM-COB-026
  //
  // Por qué hace falta uno propio:
  //   · aplicar un descuento cambia el total, y el cobro del happy path ya tiene
  //     su pago cuadrado — tocarlo rompería los casos que vienen detrás;
  //   · eliminar un guardado no puede hacerse sobre el cobro que hay que enviar.
  //
  // Los casos 048-052 certifican el TOPE, pero cancelan el modal: ninguno
  // comprueba que el descuento SE APLIQUE. Eso es lo que se cierra aquí, en las
  // tres capas — pantalla, cobro reabierto y nube.
  //
  // ⚠ Se usa el cliente de RELEVO para no competir por los documentos del
  //   principal: cada cobro ENVIADO compromete el suyo y no vuelve a listarse.
  // ═══════════════════════════════════════════════════════════════════════════

  const CLI_2 = (DATA.clientesConDocumentos || [])[1] || DATA.clienteTest;
  const DESC_IDS2 = ['DM-COB-053', 'DM-COB-054', 'DM-COB-055'];

  /**
   * Monta un cobro completo y lo deja GUARDADO.
   * @param {{cliente:string, comentario:string, descuento?:string}} o
   *        descuento = nombre del descuento a aplicar (opcional)
   */
  async function montarCobro(o) {
    const r = { ok: false, motivo: '', totalAntes: null, totalDespues: null, guardado: false };
    await irAHomeCobros();
    if (!(await abrirNuevoCobro())) { r.motivo = 'no abrió el formulario de cobro'; return r; }

    await seleccionarCliente(o.cliente);
    if (DATA.requiredComment) await fillComentario(o.comentario);
    let habil = 0;
    for (let i = 0; i < 8; i++) { habil = await tabsHabilitadas(); if (habil >= 4) break; await pg.waitForTimeout(700); }
    if (habil < 4) { r.motivo = `las pestañas no se habilitaron (${habil}/5) con ${o.cliente}`; return r; }

    const carga = await cargarDocumentos();
    if (!carga.cbs) { r.motivo = `${o.cliente} no tiene documentos disponibles`; return r; }
    if (!(await marcarPrimerDocumento()).ok) { r.motivo = 'no se pudo marcar el documento'; return r; }

    await clickTab('pagos');
    await pg.waitForTimeout(1000);
    r.totalAntes = (await leerPagosSticky()).total;

    if (o.descuento) {
      if (!(await abrirDetalleDocumento())) { r.motivo = 'no abrió el detalle del documento'; return r; }
      if (!(await abrirModalDescuentos())) { r.motivo = 'no abrió el modal de descuentos'; return r; }
      if (!(await toggleDescuento(o.descuento))) { r.motivo = `no está «${o.descuento}» en el catálogo`; return r; }
      const al = await readAlert();
      if (al) { await clickAlertBtn(['Aceptar', 'OK']).catch(() => {}); r.motivo = `aviso al marcar: ${al}`; return r; }
      const ac = await aceptarDescuentos();
      if (!ac.ok) { r.motivo = `no se pudo aceptar el descuento: ${ac.motivo || 'el modal no cerró'}`; return r; }
      await cerrarDetalleGuardando();
      await clickTab('pagos');
      await pg.waitForTimeout(1200);
      r.totalDespues = (await leerPagosSticky()).total;
    }

    const pago = await agregarPagoEfectivo();
    if (!pago.ok) { r.motivo = `no se pudo pagar: ${pago.error}`; return r; }

    const clic = await clickGuardarEnviar('imagenGuardar');
    await pg.waitForTimeout(1600);
    const alertMsg = await readAlert();
    r.guardado = !!(alertMsg && /guardad/i.test(alertMsg));
    if (alertMsg) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});
    if (!r.guardado) { r.motivo = `no guardó · clic: ${clic.via || clic.motivo} · alert: "${alertMsg || 'ninguno'}"`; return r; }
    r.ok = true;
    return r;
  }

  // ─── DM-COB-053/054/055: descuento aplicado en las TRES capas ────────────────
  const comentDto = `Test-DTO-${String(Date.now()).slice(-6)}`;
  let cobroDto = null;
  try {
    if (!DATA.userCanSelectCollectDiscount || !DATA.retentionDocTypeCR) {
      DESC_IDS2.forEach(id => v(id, id, 'N/A', 'descuento de cobro no aplica en este cliente'));
    } else if (!nombreDtoAplicable) {
      DESC_IDS2.forEach(id => v(id, id, 'BLOCKED',
        'no se identificó un descuento del catálogo que se pueda aplicar bajo el tope'));
    } else {
      cobroDto = await montarCobro({ cliente: CLI_2, comentario: comentDto, descuento: nombreDtoAplicable });

      // ── Capa 1 · la pantalla: el total baja ───────────────────────────────
      if (!cobroDto.ok && cobroDto.totalDespues === null) {
        DESC_IDS2.forEach(id => v(id, id, 'BLOCKED', `no se pudo montar el 2.º cobro: ${cobroDto.motivo}`));
      } else {
        const nAntes = montoANumero(cobroDto.totalAntes);
        const nDesp  = montoANumero(cobroDto.totalDespues);
        const bajo   = (nAntes !== null && nDesp !== null) ? nAntes - nDesp : null;
        const esperado = (nAntes !== null && pctDtoAplicable !== null)
          ? nAntes * (pctDtoAplicable / 100) : null;
        // Tolerancia de redondeo: 1 unidad de la moneda del cobro.
        const cuadra = (bajo !== null && esperado !== null) && Math.abs(bajo - esperado) <= 1;
        v('DM-COB-053', `Aplicar ${pctDtoAplicable}% baja el «Monto total a pagar»`,
          cuadra ? 'PASS' : (bajo === null ? 'BLOCKED' : 'FAIL'),
          `antes: ${cobroDto.totalAntes || '—'} · después: ${cobroDto.totalDespues || '—'} · ` +
          `bajó: ${bajo === null ? '—' : bajo.toFixed(2)} · esperado (${pctDtoAplicable}%): ` +
          `${esperado === null ? '—' : esperado.toFixed(2)}`);

        // ── Capa 2 · el cobro reabierto conserva el descuento ────────────────
        if (!cobroDto.guardado) {
          v('DM-COB-054', 'El descuento persiste al reabrir', 'BLOCKED',
            `el 2.º cobro no llegó a guardarse: ${cobroDto.motivo}`);
        } else {
          const lista = await abrirListaCobros();
          const abierto = lista.lista ? await reabrirGuardado() : false;
          if (!abierto) {
            v('DM-COB-054', 'El descuento persiste al reabrir', 'BLOCKED',
              `no se pudo reabrir el cobro guardado (lista: ${lista.lista}, ítems: ${lista.total})`);
          } else {
            await clickTab('pagos');
            await pg.waitForTimeout(1200);
            const totalReabierto = (await leerPagosSticky()).total;
            const nRe = montoANumero(totalReabierto);
            const igual = (nRe !== null && nDesp !== null) && Math.abs(nRe - nDesp) <= 1;
            v('DM-COB-054', 'El descuento persiste al reabrir el Guardado',
              igual ? 'PASS' : (nRe === null ? 'BLOCKED' : 'FAIL'),
              `al guardar: ${cobroDto.totalDespues || '—'} · al reabrir: ${totalReabierto || '—'}` +
              (igual ? '' : ' · 🔴 el monto cambió: el descuento no sobrevivió al guardado'));

            // ── Capa 3 · la nube ──────────────────────────────────────────────
            const clic = await clickGuardarEnviar('imagenEnviar');
            await pg.waitForTimeout(1800);
            const dlg = await readAlert();
            if (dlg && /ser[áa] enviad|desea enviar/i.test(dlg)) {
              await clickAlertBtn(['Aceptar', 'OK', 'Sí']).catch(() => {});
              await pg.waitForTimeout(3000);
            }
            const cierre = await readAlert();
            if (cierre) await clickAlertBtn(['Aceptar', 'OK']).catch(() => {});

            let nube = null;
            if (DATA.clienteSlug) {
              for (let i = 0; i < 5; i++) {
                const f = consultaNube(DATA.clienteSlug,
                  `select c.co_collection, c.nu_amount_total, c.nu_amount_discount_total, ` +
                  `cd.has_discount, cd.nu_collect_discount, cd.nu_amount_collect_discount, ` +
                  `(select count(*) from collection_detail_discounts d ` +
                  ` where d.id_collection_detail = cd.id_collection_detail) as filas ` +
                  `from collection c join collection_detail cd on cd.id_collection = c.id_collection ` +
                  `where c.tx_comment = '${comentDto}' limit 1`);
                if (f && f.length) { nube = f[0]; break; }
                await pg.waitForTimeout(3000);
              }
            }
            const dtoEnNube = nube && Number(nube.nu_amount_discount_total) > 0;
            const conFilas  = nube && Number(nube.filas) > 0;
            v('DM-COB-055', 'El descuento llega a la nube (monto + detalle)',
              (dtoEnNube && conFilas) ? 'PASS' : (nube ? 'FAIL' : 'BLOCKED'),
              nube
                ? `☁ ${nube.co_collection} · total ${nube.nu_amount_total} · ` +
                  `descuento ${nube.nu_amount_discount_total} · has_discount=${nube.has_discount} · ` +
                  `${nube.nu_collect_discount}% = ${nube.nu_amount_collect_discount} · ` +
                  `filas en collection_detail_discounts: ${nube.filas}` +
                  ((dtoEnNube && conFilas) ? '' : ' · 🔴 el cobro llegó pero el descuento NO')
                : `no aparece en la nube ningún cobro con comentario ${comentDto} · ` +
                  `clic: ${clic.ok ? clic.via : clic.motivo} · diálogo: "${dlg || 'ninguno'}"`);
          }
        }
      }
    }
  } catch (e) {
    DESC_IDS2.forEach(id => { if (!verdicts.some(x => x.id === id)) v(id, id, 'FAIL', e.message); });
  }

  // ─── DM-COB-026: TERCER cobro — guardar y eliminar ───────────────────────────
  // 🔴 Necesita el suyo. Si reutilizara el del flujo anterior lo borraría antes
  //    de enviarlo, que es justo lo que pasaba hasta el 07/09.
  try {
    const c3 = await montarCobro({ cliente: CLI_2, comentario: `Test-DEL-${String(Date.now()).slice(-6)}` });
    if (!c3.guardado) {
      v('DM-COB-026', 'Eliminar Guardado', 'BLOCKED', `no se pudo montar el cobro a eliminar: ${c3.motivo}`);
    } else {
      const lista = await abrirListaCobros();
      const before = lista.guardados;
      const trash = await pg.evaluate(() => {
        const btns = [...document.querySelectorAll('app-cobros-list ion-button')]
          .filter(b => b.getBoundingClientRect().width > 0 &&
            (b.querySelector('ion-icon[name="trash"]') || /danger/.test(b.getAttribute('color') || '')));
        if (!btns.length) return null;
        const r = btns[0].getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!trash) {
        v('DM-COB-026', 'Eliminar Guardado', 'BLOCKED', `Guardados: ${before} · sin botón de eliminar en la lista`);
      } else {
        await pg.mouse.click(trash.x, trash.y, { delay: 80 });
        await clickAlertBtn(['Eliminar', 'Aceptar', 'Sí', 'OK']).catch(() => {});
        await pg.waitForTimeout(2000);
        const after = (await abrirListaCobros()).guardados;
        v('DM-COB-026', 'Eliminar Guardado → desaparece de la lista',
          after < before ? 'PASS' : 'FAIL', `Guardados antes: ${before} · después: ${after}`);
      }
    }
  } catch (e) {
    v('DM-COB-026', 'Eliminar Guardado', 'FAIL', e.message);
  }

  // ─── DM-COB-020/021: dirty-guard al salir de cobro nuevo con cambios ──────────
  try {
    await irAHomeCobros();
    await abrirNuevoCobro();
    await seleccionarCliente(DATA.clienteTest);
    await pg.waitForTimeout(1000);
    await clickBack();
    await pg.waitForTimeout(1500);
    const modal = await readAlert();
    const tieneModal = !!(modal && /salir|guardar/i.test(modal)) || await pg.evaluate(() =>
      [...document.querySelectorAll('ion-alert .alert-button')].some(b => /salir sin guardar/i.test(b.textContent)));
    v('DM-COB-020', 'Atrás con cambios → modal Salir/Guardar', tieneModal ? 'PASS' : 'FAIL', `modal: "${modal || (tieneModal ? 'botones detectados' : 'ninguno')}"`);
    // DM-COB-021: elegir "Salir sin guardar" → no queda Guardado
    const salió = await dismissDirtyGuard();
    const enHome = await isHomeCobrosVisible().catch(() => false);
    v('DM-COB-021', 'Salir sin guardar → no persiste', (salió || enHome) ? 'PASS' : 'FAIL', `salió por modal: ${salió} · home: ${enHome}`);
  } catch (e) {
    v('DM-COB-020', 'Atrás con cambios → modal', 'FAIL', e.message);
    v('DM-COB-021', 'Salir sin guardar', 'FAIL', e.message);
    await irAHomeCobros().catch(() => {});
  }

  // ─── Cotejo BD (si se capturó un payload collectionservice) ───────────────────
  try {
    const payloads = await getCapturedPayloads(pg);
    const pCob = payloads.filter(p => /collectionservice\/collection|collectservice\/collect/i.test(String(p.url)));
    if (pCob.length && DATA.clienteSlug) {
      const marca = cotejoPayload(DATA.clienteSlug, pCob[pCob.length - 1]);
      // 🔴 Iba colgado de DM-COB-018 (Guardar) y eso confundía: GUARDAR ES LOCAL,
      //    no hace ningún POST. El único payload que se captura es el del ENVÍO,
      //    así que la marca del cotejo pertenece a DM-COB-019. Leerla junto a
      //    «Guardar» hacía parecer que el guardado había llegado a la nube.
      const d = verdicts.find(x => x.id === 'DM-COB-019') ||
                verdicts.find(x => x.id === 'DM-COB-018');
      if (d) d.nota += ` · cotejo del payload enviado: ${marca}`;
    }
  } catch (_) {}

  // ─── Fase 2: marcar pendientes ────────────────────────────────────────────────
  FASE2.forEach(id => {
    if (!verdicts.find(x => x.id === id)) v(id, id, 'BLOCKED', 'Fase 2 — pendiente de construir/depurar en device');
  });

  // Volver a HOME de la app
  try { await irAHomeCobros(); await clickBack(); await pg.waitForTimeout(1200); } catch (_) {}

  return { verdicts, msTotal: Date.now() - t0 };
}

module.exports = { runCobros: conReq('COB', runCobros) };
