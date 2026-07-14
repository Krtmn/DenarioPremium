> Parte de `module-selectors/` — leer junto con `_comunes.md` (convención global).

## Módulo VISITAS

### Identidad
- Ruta: `/visitas` (home) → `/visita` (form) · `/listaVisitas` (RUTA DE HOY)
- Componente raíz: `app-visitas`
- Botones home: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta · Tabs form: General / ACTIVIDADES / ADJUNTOS

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Entrada HOME Visitas | `a.ion-text-center` (texto "Visitas") dentro de `ion-col` → `pg.mouse.click` navega a `/visitas` | `[ins-2610]` | |
| RUTA DE HOY | `a`/`ion-col` texto "RUTA DE HOY" → `pg.mouse.click` real navega a `/listaVisitas` | `[ins-2610][latino_cosmetica-20260714]` | ítems "Nro Ref.: N · Cliente: COD - NOMBRE · Estatus: Guardado/Visitado · Fecha:"; trash solo en filas "Guardado". ⚠ **componente activo de `/listaVisitas` = `app-lista-visita` (singular), NO `app-listaVisitas`** en La Tortuga v6.6.18; ítems `ion-item`, trash = 2× `ion-button[color="danger"]` solo en filas Guardado |
| NUEVA VISITA | `ionBtn.shadowRoot.querySelector('button').click()` | `[gmp-2606]` | mouse.click ejecuta pero URL queda en /visitas |
| Cliente (input) | `ion-input#clienteSelect` → modal | `[rom-2606]` | |
| Modal cliente búsqueda | `.search-input` (placeholder "Clientes...") + botón `.clear-search` / `ion-icon[name="search-circle-sharp"]` | `[gmp-2606][ferrenuestro-2026-07-07]` | click en botón/ícono tras escribir. ⚠ **ferrenuestro:** escribir en `.search-input` NO filtra realtime; hay que `mouse.click` en `ion-modal.show-modal ion-icon[name="search-circle-sharp"]` (x≈325,y≈95) para aplicar el filtro. Refina la nota `.clear-search` |
| Modal cliente: seleccionar el nombre | **click al centro vertical EXACTO del `<p>` del nombre** (`y = pRect.top + pRect.height/2`, ≈190): el item ocupa top≈170 h≈142, el `<p>` nombre top≈180 h≈20. Localizar `ion-modal.show-modal p` cuyo texto `===` nombre → `getBoundingClientRect` → `mouse.click` | `[gmp-2611]` | ⚠ click por encima (y≈174) o en el centro del item (zona saldos) NO selecciona — activa `ion-button.masInfo`→BUSCAR. Refina `[gmp-2606]` |
| Selector Actividad | `ion-modal ion-select` interface popover → `h.selectIonPopover` o asignar objeto a `.value` + ionChange | `[ins-2606][rom-2606]` | valor es objeto `{idType,naType,requiredEvent,requiredSignature}` |
| Selector Motivo | aparece solo si `actividad.requiredEvent="true"` | `[ins-2606][rom-2606]` | |
| Comentario (modal) | `pg.focus('ion-modal ion-input input')` + `keyboard.type()` | `[ins-2606]` | usa ngModel; NO fillIonInput |
| Botón AGREGAR (modal) | texto "Agregar" (título); coords frescas con `getBoundingClientRect` | `[gmp-2606][ins-2606]` | posición cambia según selects visibles |
| Botón "AÑADIR ACTIVIDAD/EVENTO" | `app-visita ion-button` por textContent; `mouse.click` en coords reales abre el `ion-modal` de actividad | `[gmp-2611]` | |
| Botón "INICIAR VISITA" (visita No Visitado) | `ion-button` por textContent "INICIAR VISITA"; **un solo `mouse.click`** en coords reales inicia con GPS → habilita las 3 tabs y salta a Tab ACTIVIDADES | `[gmp-2611][dth-2612]` | con sucursal que tiene coords no pide alert de coordenadas. ⚠ **latencia GPS:** el efecto (tabs habilitadas + salto a ACTIVIDADES) aparece con retraso por procesamiento GPS; verificar estado tras ~2-3 s, no marcar FAIL en el snapshot inmediato `[dth-2612]` |
| Tab ADJUNTOS | `ion-segment.value='adjuntos'` + `ionChange`; acordeones "Imágenes / Archivo / Firma" renderizan como texto | `[dth-2612]` | navegación por value, no por coords del segment-button |
| Selector Motivo — carga diferida | tras asignar Actividad al `ion-select` idx0, el `ion-select` idx1 (Motivo) carga sus `ion-select-option` ~1 s después | `[ins-2606][rom-2606][dth-2612][prc-2606]` | leer opciones tras espera; aparece solo si `requiredEvent="true"` |
| Lista RUTA DE HOY — click ítem | escribir en `ion-searchbar` (filtra realtime) sube el ítem objetivo al viewport; click en `ion-item` Guardado por coords `top+15` (NO centro del item ni `ion-row` padre) | `[gmp-2611]` | la lista (14 ítems) excede el viewport |
| Guardar / Enviar | `.imagenGuardar` / `.imagenEnviar` | `[gmp-2606]` | |
| RUTA DE HOY — navegación confiable | `ionBtn.shadowRoot.querySelector('button').click()` en el botón RUTA DE HOY; `PointerEvent+MouseEvent` en `ion-col`/`ion-button` no garantiza navegación | `[gmp-2611][prc-2606]` | mismo patrón que NUEVA VISITA; confirmar en otras playas |
| Clientes sin sucursal bloquean tabs | la precondición para habilitar ACTIVIDADES/ADJUNTOS es cliente con ≥1 sucursal asignada — seleccionar un cliente sin sucursal deja tabs disabled | `[prc-2606]` | # candidato — confirmar en otras playas |
| Alert "coordenadas" en Guardar/Back | `ion-alert.show-modal` con msg "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" + botones `["", "Agregar"]` — el botón vacío (idx 0) = Cancelar; aparece ANTES del dirty-guard en back; dismiss → reintentar acción | `[prc-2606]` | Patrón cliente piercar — confirmar en otras playas |
| `ion-select` en `ion-modal.modalActividades` — Actividad (idx0) y Motivo (idx1) | asignar valor via `ionChange` directo más fiable que popover-click en build piercar | `[ins-2606][rom-2606][dth-2612][prc-2606]` | también en modalActividades: no esperar apertura de popover |

### Flujo mínimo probado
```
1. NUEVA VISITA (shadowBtn.click) → /visita
2. Seleccionar cliente (modal: input + clear-search) → tabs habilitan; sucursal carga
3. Tab Actividades → AÑADIR ACTIVIDAD → selectIonPopover Actividad → Motivo (si requiredEvent) → Comentario → AGREGAR
4. Guardar ("La visita se ha guardado") → Enviar ("Su Visita será enviada")
```

### VG → DOM effects
| VG | true | false |
|----|------|-------|
| `signatureVisit` | acordeón Firma en Tab ADJUNTOS | ausente |
| `userCanUploadFiles` | acordeón Archivo | ausente |
| actividad `requiredEvent` | Motivo requerido | sin Motivo |

### Anti-patrones confirmados
- `dispatchEvent(MouseEvent)` en `img.fechaAtras` no activa router — usar `getBoundingClientRect` + `pg.mouse.click()` (≈35,34). En `/listaVisitas` el primer back a veces no engancha; aplicar reintento acotado (≤2) tras render asíncrono de la lista. `[ins-2606][ins-2610][ins-2622]`
- ⚠ **Texto de ítem RUTA DE HOY sin espacio tras "Estatus:" en `textContent` crudo** — filtrar por `/Guardado/` o `/Visitado/` (NO `/Estatus: Guardado/`) sobre el textContent crudo. `[ins-2622]`
- Click en popover-item de Actividad fuera de viewport falla — asignar objeto a `.value` directamente. `[rom-2606]`
- Múltiples clicks en NUEVA VISITA dejan `ion-loading` con `backdrop-no-tappable` — llamar `loading.dismiss()`. `[gmp-2606][rom-2606]`
- Dirty-guard back: `img.fechaAtras` con `getBoundingClientRect()+mouse.click()` (coords ~31,31) SÍ dispara modal "¡Alerta!" (Guardar y salir / Salir sin guardar / Cancelar) **cuando hay cambios sin guardar**; con visita ya Guardada y sin cambios NO aparece (sale directo). `[ins-2610]`
- Al reabrir visita Guardada, las tabs ACTIVIDADES/ADJUNTOS aparecen `disabled` momentáneamente (~1.5s, render asíncrono) y luego se habilitan — esperar antes de marcar FAIL. `[ins-2610]`
- ⚠ **jerez: back = el PRIMER `img.fechaAtras` visible, con `element.click()` nativo** — en `/visita` y `/listaVisitas` hay **2** `img.fechaAtras` visibles apiladas; el back real es el de **arriba-izq** (`imgs[0]`, x≈10, `hasA=true`), NO el último (`imgs[last]`, x≈301, que es otra acción). `imgs[0].click()` nativo navega; `imgs[last]` no. Responde SOLO a `element.click()` nativo — NO a `pg.mouse.click` ni `dispatchEvent(MouseEvent)`; el handler `(click)` está sobre el **`img` mismo**, no sobre el `<a>` padre (sin href/routerLink), así que `img.closest('a').click()` falla e `img.click()` navega. Refina la nota previa `[jerez-2026-07-06]` (que decía `img.click` sin especificar cuál) y contrasta con `getBoundingClientRect+mouse.click` de `[ins-2610]` (aquí no enganchó). También `#clienteSelect.click()` nativo abre el modal más fiable que `pg.mouse.click`. `[jerez-2026-07-06]`

### Notas por cliente
- globalmp: todas las actividades tienen `requiredEvent:"true"` → Motivo siempre requerido. `[gmp-2606]`
- insumar: 11 actividades, TODAS `requiredEvent:"true"` → Motivo siempre requerido (idTypes 2,47,71,75,82-88). "VISITA SIN ACCION" tiene único Motivo "NEGOCIO CERRADO". MERCHANDISING (47) → 5 motivos (ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, VISIBILIDAD PDV, PLAN SLIP, MUESTRA NUEVO CATALOGO); EVENTOS (86) → 1 motivo (SUPERVISION DE EVENTOS). `[ins-2610][ins-2622]`
- insumar: cliente 2738 (ADRIAN ARLET BASTARDO ALONZO) **NO dispara el alert de coordenadas** al Guardar/Back (a diferencia de globalmp/piercar) — su sucursal tiene coordenadas asignadas. `[ins-2622]`
- insumar: envío = 2 alertas ("¿Desea enviar la visita?" Cancelar/Aceptar → "Su Visita será enviada" OK) → navega a `/visitas`. Tras sync, reaparece como Nro Ref real con Estatus "Visitado". `[ins-2610]`
- globalmp: seleccionar cliente sin coordenadas → alert "Esta sucursal no tiene coordenadas asignadas" → dismiss con primer botón. `[gmp-2606]`
- globalmp: dirty-guard back SÍ responde a CDP (`img.fechaAtras` + `getBoundingClientRect()+mouse.click()` dispara modal "¡Alerta!" con cambios sin guardar); visita ya Guardada SIN cambios sale directo, pero tras navegar entre tabs queda dirty y reaparece. Alinea con insumar `[ins-2610]`. `[gmp-2611]`
- globalmp: 12 actividades, TODAS `requiredEvent:"true"`; MERCHANDISING (idType 47) tiene 5 motivos: ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, VISIBILIDAD PDV, PLAN SLIP, MUESTRA NUEVO CATALOGO. `[gmp-2611]`
- globalmp `userMustActivateGPS`: INICIAR VISITA completó sin bloqueo por GPS ni alert de coordenadas (emulador con ubicación). El módulo SÍ soporta el flujo INICIAR VISITA cuando la RUTA DE HOY trae visitas "No Visitado". `[gmp-2611]`
- Post-envío globalmp: estado "Por Enviar" (no "Visitado") hasta sync servidor — offline-first normal, es PASS. `[gmp-2606]`
- DM-VIS-022: "Salir sin guardar" sobre visita YA Guardada la mantiene = correcto (no FAIL). `[hid-2605]`
- Borrado: alert "¿Desea borrar la visita? Esta acción no se puede deshacer." CANCELAR/Aceptar → "Se eliminó la visita de manera exitosa". `[gmp-2606][ins-2606][rom-2606][ins-2610]`
- don-theo (mismo servidor Isla Coche que insumar): 12 actividades, TODAS `requiredEvent:"true"` (idTypes 2,47,71,75,82-88,90,92); MERCHANDISING (idType 47) con 5 motivos (ENTREGA DE MUESTRAS, LEVANTAMIENTO DATA ISSY, VISIBILIDAD PDV, PLAN SLIP, MUESTRA NUEVO CATALOGO); COBRANZA (82) y EVENTOS (86) también con motivos. Envío = 2 alertas → `/visitas`; borrado CON confirmación previa "¿Desea borrar la visita?…" + alert éxito "Se eliminó la visita de manera exitosa". `[dth-2612]`
- Defecto abierto DM-VIS-002 (romher): "Ver mejor ruta" deja `ion-loading` indefinido sin GPS. `[rom-2606]`
- **piercar: 11 actividades, TODAS `requiredEvent:"true"`** (idTypes: 2 NO VISITO, 47 MERCHANDISING, 71 NO COMPRO, 75 VISITA FUERA DE RUTA, 82 COBRANZA, y otras). COBRANZA (82) tiene 4 motivos: COBRANZA EFECTIVA (182), COBRANZA PARCIAL (188), RETENCION (189), COBRANZA+RETENCION (190). `[prc-2606]`
- **piercar: alert "coordenadas" al Guardar o Back** en sucursales sin coordenadas (ej. LA TRINIDAD de G8): primer Back dispara este alert; dismiss → segundo Back dispara dirty-guard. `[prc-2606]`
- **piercar: `st_visit=2` = Enviado** (baseline previo también tenía st=2 y st=3). Difiere del st=1 observado en pedidos/inventarios/devoluciones de piercar — visitas tienen tabla de estados propia. `[prc-2606]`
- **piercar: envío sin firma posible** pese a `signatureVisit=TRUE` — la app acepta Enviar sin firma en Tab ADJUNTOS. Defecto conocido DM-VIS-020 confirmado. Reconfirmado dm-electronica y **latino_cosmetica** (envía sin exigir firma pese a `signatureVisit=true`; ya en 3 corridas). `[prc-2606][dm-electronica-20260713][latino_cosmetica-20260714]`
- **latino_cosmetica: ANNELI CA (13, idAddressClient 6631) CON coordenadas** → NO dispara alert "sucursal sin coordenadas" al seleccionar ni al Guardar/Enviar (contrasta dm-electronica cliente 00001 y piercar). `userMustActivateGPS=true` NO bloqueó ninguna transacción; coordenada real capturada (11.0490849,-63.8649992). 11 actividades TODAS `requiredEvent=true` (set El Yaque: MERCHANDISING 47→VISIBILIDAD PDV 184/PLAN SLIP/etc; COBRANZA 82). Visita Ref 100 Enviada BD-FIELD-OK 21/21 + incidence. Back = 1 sola `img.fechaAtras` + `mouse.click` (como ferrenuestro/dm-electronica, NO como jerez 2 apiladas). `[latino_cosmetica-20260714]`
- **dm-electronica: 11 actividades TODAS `requiredEvent="true"` / `requiredSignature="false"`** (idTypes 2 NO VISITO, 47 MERCHANDISING, 71 NO COMPRO, 75 VISITA FUERA DE RUTA, 82 COBRANZA, 83 INFO DE CLIENTES, 84 COBRANZA NO EFECTIVA, 85 VENTA EN RUTA, 86 EVENTOS, 87 REUNION CON CLIENTE, 88 VISITA SIN ACCION — mismo set que jerez/ferrenuestro; ⚠ el dump BD del YAML Reventa/Cheque Devuelto/Precio NO refleja lo sincronizado). MERCHANDISING(47) → 5 motivos (ENTREGA DE MUESTRAS 153, LEVANTAMIENTO DATA ISSY 183, VISIBILIDAD PDV 184, PLAN SLIP 191, MUESTRA NUEVO CATALOGO 192); COBRANZA(82) → 4 motivos (igual piercar). Payload `visitservice/visit` capturado por hook `nativePromise` (cabecera+incidence, BD-FIELD-OK 19/19). `[dm-electronica-20260713]`
- **dm-electronica: cliente 00001 "+ QUE MUEBLES UN SUENO, C.A" sin coordenadas** → alert "Esta sucursal no tiene coordenadas asignadas. ¿Desea agregarlas?" (botones `["", "Agregar"]`, idx0=Cancelar). Dispara al **SELECCIONAR** el cliente y ANTES del dirty-guard en el Back (patrón piercar): Back#1→coordenadas (cancelar) → Back#2→dirty-guard. No bloquea Guardar/Enviar. `[dm-electronica-20260713]`
- **jerez: 11 actividades, TODAS `requiredEvent:"true"`** (idTypes 2,47,71,75,82,83,84,85,86,87,88); EVENTOS (86) → Motivo único SUPERVISION DE EVENTOS (idMotive 213). cliente_test DANIELA HERNANDEZ F.P. (V161051485, emp 1). El alert "sucursal sin coordenadas" dispara al **SELECCIONAR** el cliente (dismiss 1er botón, no bloquea); en Guardar/Enviar de esta corrida NO reapareció. `[jerez-2026-07-06]`
- **ferrenuestro: 12 actividades, TODAS `requiredEvent="true"` / `requiredSignature="false"`** (NO VISITO 2, MERCHANDISING 47, NO COMPRO 71, VISITA FUERA DE RUTA 75, COBRANZA 82, INFO DE CLIENTES 83, COBRANZA NO EFECTIVA 84, VENTA EN RUTA 85, EVENTOS 86, REUNION CON CLIENTE 87, Cuestonario 90, Cambio X Cambio 92); MERCHANDISING (47) → 5 motivos (ENTREGA DE MUESTRAS 153, LEVANTAMIENTO DATA ISSY 183, VISIBILIDAD PDV 184, PLAN SLIP 191, MUESTRA NUEVO CATALOGO 192). cliente_test TORNICAGUA (id_client 504, idAddressClient 67213, sin coordenadas → alert dismissible al SELECCIONAR, no bloquea). `signatureVisit=false` confirmado (Tab Adjuntos sin acordeón Firma). `[ferrenuestro-2026-07-07]`
- **ferrenuestro: back = 1 sola `img.fechaAtras`, `mouse.click(≈32,31)` engancha** — a diferencia de jerez (2 apiladas, `.click()` nativo): aquí 1 sola visible, `getBoundingClientRect`+`mouse.click` dispara el dirty-guard y navega (patrón insumar `[ins-2610]`). `#clienteSelect.click()` nativo abre el modal fiablemente. Reconfirmado dm-electronica (El Yaque v6.6.18): 1 sola `img.fechaAtras`, `mouse.click(≈32,31)` engancha el dirty-guard (modal 3 botones). `[ferrenuestro-2026-07-07][dm-electronica-20260713]`
- **ferrenuestro: VISITAS envío SÍ persiste a la nube** — pese a la sync diferida de otros módulos de la playa, `visitservice/visit` POSTea y llega DE INMEDIATO (id_visit=5, poll ~8s; contrasta con devoluciones/inventarios/depósitos que aparecieron ~3min después). `st_visit=2`=Enviado (igual piercar; visitas usan tabla de estados propia). Hook `nativePromise` captura el payload (cotejo BD-FIELD-OK 21/21 + incidence). `[ferrenuestro-2026-07-07]`

---
