# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente / Playa | `el_valle` — EL VALLE (COVADONGA) |
| Servidor | La Tortuga — `denariolatortuga.ddns.net:8081/PremiumWS` |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · `db_version=19` · `window.ng=true` |
| Estado inicial → final | HOME → HOME ✅ |
| Resultado | **15 PASS · 0 FAIL · 0 SKIP · 0 N/A · 1 BLOCKED** |
| Crashes | ninguno |
| Watchdog | 0 cuelgues de CDP · 0 `ABORT-MODULE` |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `/inventarios` con botones INVENTARIO y BUSCAR |
| DM-INV-002 | ✅ PASS | 4 tabs (General/Inventario/Resumen/Adjuntos); Inventario/Resumen/Adjuntos `disabled` y Cliente vacío; Guardar/Enviar `disabled` |
| DM-INV-004 | ✅ PASS | Cliente "ABASTOS Y CARNICERIA HERMANOS FLORES CA (J309901710)" → las 4 tabs habilitan |
| DM-INV-008 | ✅ PASS | Tab Inventario: 3 líneas (EMBUTIDOS 66 · LACTEOS 9 · PRODUCTO FRESCO EN VENTA 5) → 5 productos con código |
| DM-INV-010 | ✅ PASS | `ion-modal.inventory-type-stocks-modal` abierto: "ALAS DE POLLO / Exhibición - 1", Cantidad + Lote + Fecha de vencimiento + unidad PIEZA |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard` cantidad=5, lote=LOTE-QA-INV728, fecha=2026-12-31 (`#expDate0`) |
| DM-INV-012 | ✅ PASS | Checkmark acepta sin error; producto queda "Inventariado: Exhibición" |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla Sel/Código/Producto/**Exhibición**/**Depósito**/Acción → `C0051 ALAS DE POLLO · 5 PIEZA · Depósito -` |
| DM-INV-017 | ✅ PASS ⚠ | `inventario-sugerido-modal`: "Sugerido PIEZA: 5", Inv. Actual 5 / Despacho 0, Moneda BS/USD. ⚠ divergencia VG (ver Hallazgos) |
| DM-INV-020 | ✅ PASS | "Días desde último inventario: 1" · "Días hasta siguiente inventario: 1" (viven en el modal sugerido, no en Tab General) |
| DM-INV-021 | ✅ PASS | 2 alerts: "¿Desea guardar el Inventario?" (Cancelar/Aceptar) → "Inventario guardado con éxito" (OK) |
| DM-INV-022 | ✅ PASS | 3 alerts: "¿Desea enviar el Inventario?" → "El Inventario será enviado" → **"Inventario nro. 2 enviado exitosamente"**; navega al home de inventarios |
| DM-INV-023 | ✅ PASS | "Nro. Ref.: 2 · Cliente: J309901710 - ABASTOS… · Estatus: Enviado · Fecha: 28/07/2026" |
| DM-INV-025 | ✅ PASS | Searchbar "Inventarios…": `ZZZZNOEXISTE`→0 · `ABASTOS`→1 · vacío→1 (filtra en tiempo real) |
| DM-INV-026 | ⛔ BLOCKED | El ítem de la lista BUSCAR **no navega al formulario por CDP** tras 4 intentos con 2 estrategias (mouse.click por coords y dispatch Pointer+Mouse), en 2 registros distintos. Falla igual con **Enviado** ⇒ limitación de automatización, no comportamiento del estado Guardado. El defecto conocido (abrir en tab General) **no pudo observarse** esta corrida |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` → "¡EL Inventario se borro con exito!" (sin confirmación previa) y el Guardado desaparece de la lista |

## Registros creados en sistema

| Ref | Detalle | Estado | BD |
|-----|---------|--------|-----|
| **2** | ABASTOS Y CARNICERIA HERMANOS FLORES CA (J309901710) · C0051 ALAS DE POLLO · 5 PIEZA · Exhibición · lote LOTE-QA-INV728 · venc. 31/12/2026 | Enviado | **BD-OK** |
| 0 | 2º inventario (C0003 COSTILLA CHINA DE CERDO · 3 PIEZA · lote LOTE-QA-INV728B) — creado para DM-INV-028 | Guardado → **eliminado** (DM-INV-028) | BD-SAVED (local, nunca enviado) |
| 0 | 3er inventario (C0100 MUSLO DE POLLO · 7 PIEZA · lote LOTE-QA-INV728C) — creado para reintentar DM-INV-026 | Guardado → **eliminado** (limpieza) | BD-SAVED (local, nunca enviado) |

> Los inventarios Guardados sin sincronizar muestran **Nro. Ref.: 0** (consistente con `[ins-2606]`). Estado final del módulo: 1 solo registro (Ref 2, Enviado).

## Verificación BD

**Baseline** (antes del módulo): `client_stock` con 1 fila (`id_client_stock=1`, de 2026-05-18). Baseline-diff `id>1`.

**Cabecera** — `client_stock`:
| id | co_client_stock | st | co_client | da_client_stock | det | units |
|----|-----------------|----|-----------|-----------------|-----|-------|
| **2** | `1785271152995.0` | **1** (Enviado) | J309901710 | 2026-07-28T20:39:12Z | 1 | 1 |

**Detalle/unidad** — `client_stock_detail` + `client_stock_detail_unit`:
| co_product | co_product_unit | qu_stock | nu_batch | da_expiration | ubicacion |
|------------|-----------------|----------|----------|---------------|-----------|
| C0051 | PZA-C0051 | 5.0000 | **LOTE-QA-INV728** | **2026-12-31T04:00:00Z** | exh |

**Payload capturado** (hook `Capacitor.nativePromise`) — `POST .../clientstockservice/clientstock`:
`coClientStock=1785271152995.0` · `idClient=1787` · `coClient=J309901710` · `coordenada=11.049058,-63.8649836` (GPS OK, `userMustActivateGPS=true`) · `stClientStock=0` · `stDelivery=2` · `daysSinceLast=1` · `daysUntilNext=1` · detalle `C0051/idProduct=5` · unidad `PZA-C0051, quStock=5, ubicacion="exh", nuBatch="LOTE-QA-INV728", daExpiration="2026-12-31T04:00:00"`.

**Conclusión guardado→enviado: `BD-OK`.** El `co_client_stock` del payload coincide 1:1 con la nube y **Nro.Ref UI (2) = `id_client_stock` (2)** — reconfirma la correlación Ref↔PK del servidor. Sync **INMEDIATA** (la fila estaba en la nube en el primer poll, sin espera diferida). `st_client_stock=1` = Enviado, consistente con dm-electronica / latino_cosmetica / ferrenuestro-La Tortuga (⚠ el payload trae `stClientStock=0`: corroborar por `id` + presencia en nube, **no** por `st` global).

**Mitad LOCAL del oráculo §10: `BD-N/A`** — `sqlite3` no existe en el device (build La Tortuga v1.0); degradado al primer intento según lo indicado, sin gastar reintentos. El cotejo fue por **nube + payload + UI**.

## ⭐ Veredicto `expirationBatch` (VG en conflicto del perfil)

**`expirationBatch = true` — CONFIRMADO, y con obligatoriedad real.** El dump viejo por-cliente (2023) que decía `false` queda **descartado**; gana el `global_configuration` 2025-04-14.

1. **¿Aparecen los campos?** **SÍ.** El `inventory-type-stocks-modal` renderiza `input[placeholder="Ingrese lote"]` (text) + `ion-datetime-button` "Fecha de vencimiento" (`ion-datetime#expDate0`, default HOY) además de Cantidad y unidad PIEZA.
2. **¿Son obligatorios?** **SÍ — y esto es lo que distingue a este cliente.** Prueba dirigida: se cargó **solo cantidad=5** (lote y fecha vacíos) y se pulsó el checkmark → la app **rechazó** con el alert:
   > **"Complete cantidad, unidad, fecha y lote para continuar."**
   
   El modal permaneció abierto y el producto **no** quedó inventariado. Al completar los tres campos, el mismo checkmark aceptó sin error.
3. **Contraste con corridas previas:** en `[dm-electronica-20260713]` y `[latino_cosmetica-20260714]` (ambas `expirationBatch=false`) los campos **se renderizaban igual pero eran OPCIONALES** (Aceptar tuvo éxito con `nuBatch=""`). ⇒ Queda establecido que **`expirationBatch` gobierna la VALIDACIÓN, no la visibilidad**: los campos se pintan siempre; con `true` son obligatorios, con `false` opcionales. Esto **resuelve** la divergencia "UI-vs-config" que se venía anotando desde `[prc-2606]` — no era una divergencia, era que se estaba mirando la visibilidad en vez de la validación.
4. **End-to-end:** el lote y la fecha viajaron al servidor (`nuBatch`/`daExpiration` en el payload) y persistieron en `client_stock_detail_unit` (`nu_batch`/`da_expiration`).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`ion-modal.show-modal` residual del selector de cliente intercepta TODOS los clicks por coordenadas** | universal | Tras `setClientfromSelector` el modal de cliente puede quedar en el DOM con `show-modal` y `offsetParent!==null`. `document.elementFromPoint()` sobre cualquier botón devuelve un elemento **fuera del target** ⇒ `pg.mouse.click` no engancha (falló Guardar, el trash y la navegación de lista). **Fix:** `dismiss(null,'cancel')` de todos los `ion-modal` visibles antes de seguir. Diagnóstico reproducible con `elementFromPoint` + `b.contains(top)` |
| **`expirationBatch` gobierna la VALIDACIÓN, no la visibilidad** | universal | Lote y Fecha se renderizan siempre en `inventory-type-stocks-modal`. Con `true` → obligatorios (alert "Complete cantidad, unidad, fecha y lote para continuar."); con `false` → opcionales (`nuBatch=""`). Cierra el falso hallazgo "UI-vs-config" de `[prc-2606]`/`[dm-electronica]`/`[latino_cosmetica]` |
| **Cambio de tab: fallback por `ion-segment.value`** | universal | El click real sobre `ion-segment-button` **no siempre** cambia de tab (el `segment-button-checked` no se mueve). Fallback: `sg.value = b.value` + `ionChange`. Valores en Inventarios: `default` (General) · `inventario` · `actividades` (Resumen) · `adjuntos` |
| **`ion-datetime-button` no refleja texto aunque el valor quede fijado** | cliente (La Tortuga v1.0) | Tras fijar `#expDate0` el label del botón queda vacío, pero el ngModel **sí** tomó el valor (lo prueba la aceptación del modal y el `daExpiration` del payload). **Verificar la fecha por `#expDate0.value`, no por el textContent del botón** — un assert sobre el label da falso negativo |
| **Click en línea/producto/botón: `pmClick` (Pointer+Mouse dispatch + mouse.click)** | universal | El `mouse.click` solo falla de forma intermitente en `ion-item` de familias y en `.imagenGuardar`. El dispatch `pointerdown/pointerup` + `MouseEvent('click')` **antes** del click real lo estabiliza. Reconfirma `[gmp-2611]` y lo extiende a los botones de header |
| **Lista BUSCAR de Inventarios NO navega por CDP en este build** | cliente (La Tortuga v1.0) | `ion-item[button][detail]` con hijos `ION-LABEL(,ION-BUTTON)`. Ni `mouse.click` por coords ni dispatch Pointer+Mouse abren el formulario — **falla igual en Guardado y en Enviado**. El trash del mismo ítem SÍ responde al dispatch ⇒ el gap es el handler de navegación de la lista, no el ítem. Bloquea DM-INV-026 |
| `window.__qaInv.setCliente(nombre)` (helper de módulo) | universal | Ver código abajo. Localiza el cliente en `app-cliente-selector` → `comp.clientes` (`naClient`/`coClient`) y lo fija en el padre que expone `setClientfromSelector`, sin click real en el modal |
| Botón "Pedido Sugerido" presente con `suggestedOrderByDispatchAndReturn=false` | cliente | 5ª playa con la misma divergencia (jerez/piercar/ferrenuestro/insumar). ⚠ VERIFICAR con desarrollo — ver Hallazgos |
| Línea "DESTACADOS" vacía (0) en Tab Inventario | cliente | Coherente con lo hallado en PEDIDOS (`featuredProducts=true` pero línea vacía en esta playa) |

### Helper de módulo `window.__qaInv` (requerido para el replay)

```js
window.__qaInv = {
  _sel:  () => document.querySelector('app-cliente-selector'),
  _padre: () => { let h = window.__qaInv._sel();
    while (h) { try { const c = window.ng.getComponent(h);
      if (c && typeof c.setClientfromSelector === 'function') return c; } catch(e){} h = h.parentElement; }
    return null; },
  lista: () => { const s = window.__qaInv._sel();
    const c = s && window.ng ? window.ng.getComponent(s) : null; return (c && c.clientes) || []; },
  setCliente: function (nombre) {
    const cli = window.__qaInv.lista().find(c =>
      String(c.naClient || c.na_client || '').toUpperCase().indexOf(String(nombre).toUpperCase()) >= 0);
    if (!cli) return 'ERR: cliente no hallado';
    const comp = window.__qaInv._padre();
    if (!comp) return 'ERR: sin setClientfromSelector';
    comp.setClientfromSelector(cli);
    try { window.ng.applyChanges(comp); } catch (e) {}
    try { const m = document.querySelector('app-cliente-selector ion-modal'); if (m && m.dismiss) m.dismiss(); } catch (e) {}
    return 'OK: ' + cli.naClient + ' | ' + cli.coClient;
  }
};
```

> ⚠ **Requiere abrir el picker primero** (`clickSel('ion-input#clienteSelect')`): `comp.clientes` está vacío hasta que el modal se abre (aquí cargó 50 clientes). Y **no** encadenar un `dismiss()` genérico de overlays inmediatamente después — eso resetea el formulario (cliente vuelve a vacío y las tabs se re-deshabilitan); observado y reproducido en esta corrida.

## Hallazgos

**Sin FAIL.** Dos observaciones para desarrollo y una limitación de automatización:

1. ⚠ **`suggestedOrderByDispatchAndReturn=false` pero el botón "Pedido Sugerido" (`ion-button.botonAddAmarillo`) aparece y es funcional.** Abre `inventario-sugerido-modal` con "Sugerido PIEZA: 5", Inv. Actual/Despacho y los días de inventario. Es la **5ª playa** con la misma divergencia (jerez, piercar, ferrenuestro, insumar, el_valle) — el patrón es lo bastante consistente como para sospechar que la VG que gobierna ese botón es **`suggestedOrder`** (=`true` en este perfil) y no `suggestedOrderByDispatchAndReturn`. **VERIFICAR con desarrollo antes de tocar la VG en los YAML.**
2. ℹ **`quUnitSuggested` / días de inventario viven en el modal sugerido, no en Tab General** (reconfirma `[ins-2622]`). Con historial de 1 día: "Días desde último inventario: 1 / Días hasta siguiente inventario: 1".
3. ⛔ **DM-INV-026 no evaluable esta corrida.** El defecto conocido (formulario Guardado reabre en tab General) **no se re-marcó ni se descartó**: el formulario nunca llegó a abrirse por CDP. Queda pendiente de verificación manual o de una vía de navegación nueva para la lista BUSCAR. **No es un FAIL** (RUNTIME §4: selector que no responde por CDP ⇒ BLOCKED).

## Traza (QA_MODE=record)

**TRAZA: 52 ops · 15 casos grabados** → `_trace/inventarios.trace.json` · `validateTrace()` = `[]` (estructuralmente válida).

Descartado el bloque de **DM-INV-026** (BLOCKED). Los asserts de DM-INV-011 y DM-INV-028 se reescribieron respecto de lo grabado en vivo: el de 011 verificaba la fecha por el label del `ion-datetime-button` (falso negativo, ver patrones) y el de 028 se había grabado durante el intento previo al dismiss del modal residual. `data` lleva los 8 valores run-específicos (cliente, línea, producto, cantidad, lote, fecha, ambos términos de búsqueda). Sin credenciales.
