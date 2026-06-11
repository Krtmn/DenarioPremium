# Module Selectors — Denario Premium Móvil
## Memoria técnica extraída de corridas reales · NO modificar manualmente

> Selectores y patrones **probados en campo** en corridas globalmp, romher, insumar, hidroponias.
> Leer como tercer archivo obligatorio junto a `RUNTIME.md` + `smoke-{modulo}.md`.
> Actualizar solo vía `prompt-consolidar-hallazgos.md` — nunca a mano.
>
> **Tags de corrida:** `[gmp-2606]` globalmp 20260605_162806 · `[rom-2606]` romher 20260604 ·
> `[ins-2606]` insumar 20260603 · `[ins-2610]` insumar 20260610_180320 · `[ins-2611]` insumar 20260611_122104 (parcial: COBROS) · `[hid-2605]` hidroponias 20260529.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Ionic 6 + Angular (standalone, AOT production build + Ivy) |
| Runtime móvil | Capacitor (Android WebView) |
| Automatización | Playwright MCP + CDP vía `connectOverCDP('http://127.0.0.1:9220')` (`h.connectCdp`) |
| Package | `com.kiberno.denarioPremiumPro` |
| Router | Angular Router — `/login`, `/home`, `/cobros`, `/visitas`, `/visita`, `/pedidos`, `/inventarios`, `/productos`, `/vendedores`, `/depositos` |
| State | Servicios Angular con RxJS; state en instancia de servicio (no store) |

**Detección de vista activa:** siempre `h.getActiveView(pg, ['app-cobros', 'app-home', ...])` antes de interactuar. El componente activo se detecta por `offsetParent !== null`.

**Principio de interacción (universal):** los eventos Angular no se disparan con `element.click()` ni `dispatchEvent(MouseEvent)` simples en build AOT. Usar `pg.mouse.click(x, y)` con coords reales de `getBoundingClientRect()`. Para botones de navegación/envío en algunas vistas hace falta además `PointerEvent(pointerdown/up) + MouseEvent(click)` combinados (ver módulo COBROS).

**Convención de selectores recurrentes (todos los módulos):**
- Botones Guardar/Enviar de formulario: `ion-button.imagenGuardar` / `ion-button.imagenEnviar` — **icon-only, sin textContent**; localizar por clase CSS. Header fijo (`y≈32`), accesibles desde cualquier tab. Disabled hasta que el formulario es válido.
- Botón atrás: `img.fechaAtras` → `closest('a')` (helper `h.clickBack`). Excepción: PRODUCTOS no usa `.fechaAtras` (ver sección).
- Trash de borrado: `ion-button[color="danger"]` — solo aparece en ítems Estatus **Guardado** (nunca en Enviado).
- Modales: detectar apertura con `classList.contains('show-modal')`, no por ausencia de `overlay-hidden`.

---

## Módulo LOGIN

### Identidad
- Ruta Angular: `/login` → `/home`
- Componente raíz: `app-login`
- Overlay sincronización: `app-synchronization` (contiene `ion-progress-bar`)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Input Usuario | `ion-input` idx 0 / `[placeholder="Usuario"]` | `[gmp-2606][ins-2610]` | **Sin atributo `name`** — identificar por placeholder o índice |
| Input Contraseña | `ion-input` idx 1 / `[placeholder="Contraseña"]` | `[gmp-2606][ins-2610]` | Sin `name` |
| Botón submit | `ion-button[type="submit"]` (texto "Aceptar") | `[gmp-2606][ins-2610]` | |
| Botón secundario | `ion-button` (texto "Salir") | `[gmp-2606]` | |
| Checkbox recordar | `ion-checkbox` | `[gmp-2606][ins-2610]` | toggle `checked` por `mouse.click` en centro del bounding rect; `.checked` refleja el toggle |
| Alert login | `.alert-title` (título) + `.alert-message` (mensaje) | `[ins-2610]` | el texto puede venir vacío durante la animación de apertura — pollear hasta que `.alert-message` tenga contenido |
| Overlay sync | `app-synchronization` + `ion-progress-bar` | `[gmp-2606]` | usar `h.waitSyncOverlay` |

### Flujo mínimo probado
```
1. fillIonInput Usuario + Contraseña (creds via h.fetchCreds)
2. Click ion-button[type=submit] "Aceptar"
3. Esperar app-synchronization ("Sincronizando - Clientes...") → h.waitSyncOverlay
4. Verificar app-home con módulos visibles; app-login no visible
```

### Anti-patrones confirmados
- No asumir `name="username"`/`name="password"` — esos inputs no tienen `name`. `[gmp-2606]`

### Notas por cliente
- HOME no muestra `ion-title` con nombre de empresa/usuario en globalmp. No hay selector de empresa post-login. `[gmp-2606]`

---

## Módulo CLIENTES

### Identidad
- Ruta: `/clientes` · Componente raíz: **`app-clientes`** (las sub-vistas son internas — NO existe `app-client-home`)
- Sub-vistas: `app-client-list` (lista), `app-client-detail` (detalle)
- Botones home: CLIENTES, CLIENTE POTENCIAL, BUSCAR CLIENTE POTENCIAL

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Campo búsqueda | `input[type="text"][placeholder="Clientes..."]` (plain input, NO ion-input) | `[gmp-2606][ins-2606]` | focus + `keyboard.type()` + click botón search |
| Botón búsqueda | `ion-icon[name="search-circle-sharp"]` / `.clear-search` (coords ~317,95) | `[gmp-2606][ins-2606][rom-2606]` | requerido — la lista NO filtra on-keyup |
| Botón home CLIENTES | `ion-button.colorBorderBuscar` interno (por textContent) — **NO** el `ion-col` contenedor | `[ins-2610]` | el ion-col padre (y≈107, w≈350) absorbe el click sin navegar; clicar coords del ion-button exacto |
| Detalle: tab Doc. Venta | `ion-segment-button[value="docVentas"]` | `[gmp-2606]` | leyenda Vigente/Vencido/A favor |
| Detalle: tabla Doc. Venta | `.doc-ventas-tab` → `.documents-view` → `.documents-table-panel--ready` / `.documents-table-scroll` / `.documents-table-stack` | `[ins-2610]` | documentos NO son `ion-item`; tabla con header Tipo/Nº Doc/Moneda/Días Venc/Tasa/Monto/Saldo/Fecha Doc/Fecha Venc/Comentario |
| Alert guardado/borrado | `.alert-title` (título) + `.alert-message` (mensaje) | `[ins-2610]` | textContent llega vacío justo tras el click; esperar ~800ms de render antes de leer |
| Form potencial: empresa | `ion-select[formcontrolname="idEnterprise"]` | `[gmp-2606]` | requerido (`ng-invalid` vacío); usar `h.selectIonPopover` |
| Form potencial: campos | 8 ion-inputs: naClient, nuRif, txAddress, txAddressDispatch, txClient, naResponsible, emClient, nuPhone | `[gmp-2606][ins-2606]` | + idEnterprise = 9 controles requeridos |
| Guardar / Enviar | `ion-button.imagenGuardar` / `.imagenEnviar` | `[gmp-2606]` | disabled hasta los 9 controles válidos |

### Flujo mínimo probado
```
1. Click módulo → app-clientes (3 botones)
2. app-client-list → buscar: focus input + keyboard.type + click search
3. Click ítem → app-client-detail (saldos, tab Doc. Venta)
4. clickBack: detail→list→clientes (no salta a HOME)
5. Potencial: fillIonInput ×8 + selectIonPopover idEnterprise → Guardar/Enviar habilitan
```

### Anti-patrones confirmados
- `fillIonInput` solo NO basta para la búsqueda: hace falta click en botón search. `[ins-2606]`
- No esperar que idEnterprise sea un ion-input — es ion-select, invisible en la lista de inputs. `[gmp-2606]`

### Notas por cliente
- Enviar potencial: globalmp/romher confirman doble alerta + navegación a HOME con "creado exitosamente nro. {ref}". `[gmp-2606][rom-2606]`
- **insumar diverge:** envío potencial = 3 alertas (confirm Cancelar/Aceptar → "será enviado" OK → "nro. {ref} creado exitosamente" OK) y queda en el home de clientes, **NO** navega a HOME principal. `[ins-2610]`
- Borrado de potencial Guardado: **directo sin confirmación previa** (solo alert de éxito). `[gmp-2606][ins-2606][ins-2610]`

---

## Módulo PEDIDOS

### Identidad
- Ruta: `/pedidos` (home) → `/pedido` (form) · `/pedidosLista` (lista BUSCAR)
- Componente home: `app-pedidos` (PEDIDO/BUSCAR/COPIAR) · Form: **`app-pedido`** (singular) · Lista: **`app-pedidos-lista`**
- Leer totales/tabs/comentario desde `app-pedido`, NO `app-pedidos` (evita "innerText vacío"). `[ins-2610]`
- Tabs formulario: General / Pedido / Total / Adjunto

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Modal cliente | detectar con `classList.contains('show-modal')` | `[ins-2606]` | NO usar ausencia de overlay-hidden |
| Empresa | `ion-select` idEnterprise preseleccionado | `[gmp-2606]` | |
| Categorías producto | lista de grupos por marca/familia → click expande acordeón | `[gmp-2606][ins-2606]` | |
| Cantidad producto | `ion-input` en acordeón; visibilidad por `getBoundingClientRect().top/width` | `[ins-2606]` | NO `offsetParent` |
| Comentario (Tab General) | `ion-input#txComment` | `[ins-2610]` | orden inputs General: `#clienteSelect`(0), Nº Orden(1), Responsable(2), `#txComment`(3); bajo el fold (scroll). `fillIonInput` (reactive form, NO ngModel) |
| Trash ítem (Tab Total) | dentro del acordeón del ítem (`ion-item` "Código: NNN", colapsado) → `ion-button[color="danger"]` + `ion-icon[name="trash"]` | `[ins-2610]` | expandir acordeón primero; borrado directo sin confirmación |
| Searchbar lista | `ion-searchbar` "Pedidos..." | `[gmp-2606][ins-2606]` | filtra realtime (ionInput) |
| Guardar / Enviar | `.imagenGuardar` / `.imagenEnviar` | `[gmp-2606]` | disabled sin ítems |

### Flujo mínimo probado
```
1. Click PEDIDO → tabs disabled salvo General
2. Seleccionar cliente (mouse.click real, no dispatchEvent) → alerta deuda vencida (si aplica) → ACEPTAR
3. Tab Pedido → click categoría → click producto → fillIonInput cantidad → badge contadorProductos
4. Tab Total: totales; trash dentro de acordeón = borrado directo
5. Guardar (Nro.Ref:0) → reabrir desde lista → Enviar
```

### VG → DOM effects
| VG | true | false |
|----|------|-------|
| `multiCurrency` | Tab Total muestra Bs. + USD | Tab Total solo USD `[gmp-2606]` |
| `enterpriseEnabled` | ion-select Empresa obligatorio | sin selector |

### Anti-patrones confirmados
- `ion-item.click()` / dispatchEvent NO navega en `pedidosLista` — usar `pg.mouse.click(coords)`. `[gmp-2606]`

### Notas por cliente
- Texto envío: globalmp dice "Su Pedido será enviado"; insumar/romher confirman secuencia de 2-3 alertas hasta "Pedido nro. X enviado exitosamente". `[gmp-2606][ins-2606][rom-2606][ins-2610]`
- Borrado: en **Tab Total** directo sin confirmación; desde **lista** con alert "Pedidos / ¿Seguro que quieres eliminar este pedido?" Cancelar/Aceptar. `[gmp-2606][ins-2606][ins-2610]`
- Dirty-guard atrás SÍ funciona vía CDP en insumar: form sucio + `img.fechaAtras`+`mouse.click` dispara alert "¡Alerta!" (Guardar y salir / Salir sin guardar / Cancelar). Contrasta con globalmp COBROS (requiere hardware back) — divergencia por build/cliente. `[ins-2610]`
- Tab Total insumar muestra **solo US$ pese a `multiCurrency=true`** (sin Bs.) — comportamiento del módulo, no FAIL. `[ins-2610]`
- Defecto abierto DM-PED-032 (romher): modal "salir con ítems" no aparece si form pristine. `[rom-2606]`

---

## Módulo COBROS

### Identidad
- Ruta: `/cobros` · Componente raíz: `app-cobros` · Lista: `app-cobros-list`
- Botones home: COBRO, BUSCAR (siempre); RETENCIÓN/IGTF/25%IVA/ANTICIPO según VGs
- Tabs cobro normal: General / Documentos / Pagos / Total / Adjuntos (5)
- Tabs Retención: General / Documentos / Total / Adjuntos (4, **sin Pagos**)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Botones home | requieren `PointerEvent(pointerdown/up) + MouseEvent(click)` | `[gmp-2606]` | TouchEvent solo fiable en 1er click post-carga |
| Modal cliente (nuevo cobro) | `document.querySelector('#clienteSelectModal').present()` | `[ins-2606][gmp-2606]` | click en ion-input NO lo abre |
| Selección cliente en modal | click en `<p>` del nombre (y≈top del item) | `[rom-2606]` | click al centro activa `masInfo`→BUSCAR |
| Comentario | `ion-input.inp-write` (notch "Comentario:") + `fillIonInput` | `[rom-2606][gmp-2606]` | desbloquea tabs si `requiredComment=true` |
| Navegación de tabs | asignar `ion-segment.value` (el value buscado) + disparar `ionChange` | `[ins-2611]` | más fiable que click en coords del segment-button cuando el click no marca la tab activa |
| Tab "General" | `ion-segment-button[value="default"]` (**NO** `"general"`) | `[ins-2611]` | otros values: `documentos`/`pagos`/`total`/`adjuntos`. Click por textContent en el segment-button "General" no marca `checked` correctamente |
| Tab Documentos | checkbox por factura; leyenda Vigente/Vencido/A favor | `[gmp-2606][rom-2606]` | checkbox → `mouse.click` en coords exactas del checkbox |
| Modal métodos pago | `#eventModal` (checkboxes Efectivo/Depósito/Transferencia/...) | `[ins-2606][gmp-2606][ins-2610]` | abrir con `document.querySelector('#eventModal').present()` (mouse.click en "Agregar método" a veces no dispara); checkbox requiere coords exactas (no ion-item padre) |
| ⚠ `#eventModal` reutilizado | el mismo id lo usa el modal "Detalle Del Documento" Y el picker de métodos | `[ins-2610]` | pueden coexistir 2 `#eventModal`; filtrar por contenido (`/Efectivo/` vs `/Detalle Del Documento/`) y `dismiss()` el sobrante |
| **Pago parcial (detalle documento)** | `ion-toggle` en el mismo `ion-row` que el `ion-label` "Pago parcial:" (al final del detalle) → click activa (false→true); el `ion-input` justo **debajo** (muestra el saldo, ej "1,50") pasa editable → escribir el monto parcial | `[ins-2611]` | ⚠ **NO** confundir con la columna "Pago Parcial" de la tabla (íconos `search-sharp`/`receipt-outline` = historial **solo lectura**). El toggle vive en grid `ion-row/ion-col`, **no** en `ion-item`. Localizar: `ion-label` con texto "Pago parcial:" → `.closest('ion-row').querySelector('ion-toggle')` |
| Banco (Depósito) — insumar | `.bank-picker-trigger` → `#bankPickerModal` (modal separado) | `[ins-2606]` | NO ion-select/popover |
| Banco (Depósito) — globalmp/romher | `ion-select.selectbanco` + `h.selectIonPopover` | `[gmp-2606][rom-2606]` | ⚠ difiere de insumar |
| Expandir acordeón Depósito/Efectivo | asignar `grp.value = acc.value` al `ion-accordion-group` (ej. `"deposito0"`/`"efectivo0"`) + disparar `ionChange` | `[ins-2611]` | revela inputs Nro/Monto; el click en el header `ion-item` no siempre expande |
| Monto Depósito | tras `fillIonInput`: `FocusEvent('blur')` + `ionBlur` CustomEvent | `[rom-2606]` | sin blur no recalcula diferencia |
| Fecha Tasa (Tab General) | `ion-button.letrasFechasButton` → modal con `ion-datetime`: asignar `dt.value` ISO + `ionChange` + Aceptar en `dt.shadowRoot` | `[ins-2611]` | dispara alert "Está cambiando la fecha de la tasa, esto recalculará los montos. ¿Desea continuar?" (Cancelar/Aceptar) → recalcula Monto total a pagar. Mismo `.letrasFechasButton` que DEPÓSITOS Fecha Doc, pero aquí con alert de recálculo |
| Diferencia | leaf `span` con texto `^Diferencia US$: X` y `style="color:red\|blue"` | `[ins-2606][gmp-2606][rom-2606][ins-2610]` | azul cuando cubre (0,00); rojo cuando insuficiente. Leer `style`/`getComputedStyle` |
| Lista BUSCAR (click) | reintentar Pointer+Mouse si `app-cobros-list` no visible; lo más fiable: `ionBtn.shadowRoot.querySelector('button').click()` + `mouse.click` juntos | `[ins-2610][ins-2611]` | click intermitente, a veces requiere 2º intento |
| Tasa BS | display read-only; `#manualRateInput` ausente si `enabledManualRate=false` | `[gmp-2606][ins-2606][rom-2606]` | |
| Guardar / Enviar | `.imagenGuardar` / `.imagenEnviar` (icon-only) | todas | Enviar puede requerir Pointer+Mouse `[gmp-2606]`. insumar: lo más fiable es `PointerEvent(down/up)` + `ionBtn.shadowRoot.querySelector('button').click()` + `mouse.click` combinados; el `mouse.click` solo a veces no dispara el listener del header fijo (y≈32) — **aplica también a Guardar, no solo a Enviar** `[ins-2611]` |
| Lista BUSCAR | `app-cobros-list` (no ruta nueva); searchbar; trash solo en Guardado | `[rom-2606][gmp-2606]` | |

### Flujo mínimo probado
```
1. Click COBRO (Pointer+Mouse) → 5 tabs, solo General activo
2. #clienteSelectModal.present() → click <p> nombre cliente
3. fillIonInput Comentario (si requiredComment) → 4 tabs habilitan
4. Tab Documentos → checkbox factura (coords exactas)
5. Tab Pagos → #eventModal → método → banco → monto + blur → diferencia azul 0,00
6. Guardar ("El Cobro se ha guardado") → Enviar (3 alertas) → "Cobro nro. X enviado exitosamente"
```

### VG → DOM effects
| VG | true | false |
|----|------|-------|
| `requiredComment` | "¡Campo Obligatorio!" + tabs disabled sin comentario | tabs libres |
| `requiredCollectionAttachments` | cobro normal exige adjunto | envío sin adjunto OK |
| `cobroRetencion` | botón RETENCIÓN visible (form sin tab Pagos) | ausente |
| `retencion` | columnas Retención IVA/ISLR en Tab Total | ausentes |
| `userCanSelectIGTF` | botón IGTF visible | ausente |
| `userCanCollectIva` | botón 25%IVA visible | ausente |
| `cobroPrepago` | botón ANTICIPO/PREPAGO visible | ausente |
| `multiCurrency` | selector moneda cobro activo | DM-COB-033/034 N/A |

### Anti-patrones confirmados
- `img.fechaAtras` vía CDP **NO** activa el dirty-guard de Angular (modal "Salir sin guardar" no aparece). Requiere hardware back / swipe. → DM-COB-020/038 SKIP estructural. `[gmp-2606]` ⚠ Contradice a romher (ver notas).
- `pg.mouse.click()` solo a veces no activa `imagenEnviar` — usar Pointer+Mouse. `[gmp-2606]`
- `#bankPickerModal` carga la lista de bancos **vacía** ("No hay resultados") si hay un `#eventModal` residual abierto. → hacer `dismiss()` del `#eventModal` residual **ANTES** de abrir el bank-picker. `[ins-2611]`

### Notas por cliente
- **Adjunto en Retención:** SIEMPRE requiere adjunto para enviar ("debe agregar al menos un adjunto"), **independiente** de `requiredCollectionAttachments`. Confirmado insumar + romher + globalmp → DM-COB-029 envío SKIP. `[ins-2606][rom-2606][gmp-2606]`
- **`mockCameraAdjunto` falla** en build prod de El Yaque (romher) — foto no entra al carrusel. `[rom-2606]`
- **Dirty-guard back:** romher/insumar SÍ muestran `#alertSaveOrExit` ("GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR") con `getBoundingClientRect()+mouse.click()`; globalmp NO (requiere hardware back). DM-COB-020/021/038 NO son SKIP en insumar (≠ globalmp). Divergencia por build. `[rom-2606][ins-2606][ins-2610]` vs `[gmp-2606]`
- **Acordeón Depósito/Efectivo:** romher se expande automáticamente tras seleccionar banco; insumar viene `accordion-collapsed` (el click en header `ion-item` no siempre expande — usar la técnica `grp.value = acc.value` + ionChange de la tabla de selectores; revela Nro. Recibo/Plantilla + Monto + Fecha). `[rom-2606][ins-2606][ins-2610][ins-2611]`
- **IGTF insumar:** tasa fijada **por documento** automáticamente, **sin selector de tasa** en la UI (IGTF US$ 0,09 / BS 46,62 ≈ 3%). DM-COB-045 = N/A (sin alterna); persiste round-trip → DM-COB-044 PASS. `[ins-2610]`
- **Documentos por moneda (insumar 2738):** la lista de documentos solo aparece con Moneda Documento = US$; en BS está vacía (los docs del cliente son US$). `[ins-2610]`
- **Sin retención por documento (insumar):** el detalle de documento NO tiene campos Retención IVA/ISLR/Comprobante → `retencion=false`, `sizeRetention` N/A. `[ins-2610]`
- **Monto globalmp:** campo centavos acumulativo — para BS 797.872,03: Backspace×~20 limpiar + `keyboard.type('79787203')` + Tab (native setter formatea mal). `[gmp-2606]`
- **Métodos pago disponibles:** varían por cliente (insumar: Efectivo/Depósito/Transferencia/Pago Móvil; globalmp: Depósito/Transferencia; romher: Depósito/Transferencia/Otros).
- **Flujo IGTF (insumar):** 2 alertas "El IGTF será enviado" → "Su Cobro será enviado". `[ins-2606]`

---

## Módulo DEVOLUCIONES

### Identidad
- Ruta: `/devoluciones` · Componente raíz: `app-devoluciones` · contenedor: `devoluciones-container`
- Botones home: DEVOLUCIÓN, BUSCAR · Tabs: PRODUCTOS / ADJUNTOS

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Botón DEVOLUCIÓN | secuencia acumulada: `mouse.click` → `keyboard.Enter` → CDP `Input.dispatchMouseEvent` → `shadowBtn.click()` | `[gmp-2606]` | activa zone listener; CDP solo no navega |
| Botón BUSCAR | CDP `Input.dispatchMouseEvent` solo basta | `[gmp-2606]` | |
| Cliente | `ion-input#clienteSelect` → modal con searchbar (click real) | `[ins-2610]` | mismo patrón Pedidos/Inventarios |
| Campos cabecera | `ion-input#responsable`, `#precinto`, `#comentario` (CON `id` explícito) | `[ins-2610]` | corrige nota previa "sin id"; `fillIonInput` por id funciona |
| Nro Factura | campo `inp-write` (ng-invalid vacío) **dentro del acordeón de cada producto** | `[gmp-2606][rom-2606]` | no en cabecera; `requeridedNroFactura=true` |
| Campos acordeón producto | Lote, NroFactura, FechaVenc, CantidadDevuelta (inp-write), Unidad (select), Motivo (select) | `[ins-2606]` | acordeón viene **colapsado** al agregar producto → click header (`ion-accordion ion-item`) para expandir `[ins-2610]` |
| ⚠ `.inp-write` cambia de clase tras edición | al escribir cantidad, el ion-input pierde `.inp-write` (queda `sc-ion-...`) | `[ins-2610]` | para releer el valor usar `ion-accordion ion-input` genérico, no `.inp-write` |
| Tipo devolución | 2º `ion-select` visible del form (y≈551); popover sin botones (`popover.dismiss()`) | `[ins-2606][rom-2606][ins-2610]` | opciones value numérico: Calidad=60, PostVenta=52, Servicio=59 |
| Familia/producto | lista **inline** dentro de `app-devoluciones` (NO modal): AGREGAR PRODUCTO → familias ("ALIMENTOS 158"…) → click familia → productos inline | `[ins-2610]` | |
| Guardar / Enviar | `.imagenGuardar` / `.imagenEnviar` (icon-only, header fijo) | `[gmp-2606]` | |

### Flujo mínimo probado
```
1. Botón DEVOLUCIÓN (secuencia acumulada) → form, tabs disabled
2. Seleccionar cliente → tabs habilitan (sin invoice-selector si validateReturn=false)
3. Tab PRODUCTOS → AGREGAR PRODUCTO → categoría → producto → acordeón
4. fillIonInput CantidadDevuelta + NroFactura → Guardar/Enviar habilitan
5. Guardar ("¡Su Devolución se ha guardado!") → Enviar → "¡Su Devolución será enviada!"
```

### VG → DOM effects
| VG | true | false |
|----|------|-------|
| `validateReturn` | requiere seleccionar factura para habilitar tabs | tabs habilitan directo; Nro Factura libre por producto `[gmp-2606][ins-2606][rom-2606]` |
| `signatureReturn` | acordeón Firma en Tab ADJUNTOS | ausente |
| `userCanUploadFiles` | acordeón Archivo en ADJUNTOS | ausente |

### Anti-patrones confirmados
- Botones Guardar/Enviar sin texto — buscar por clase, no por textContent. `[ins-2606]`
- Devolución Enviada: imagenGuardar/imagenEnviar ocultos (correcto). `[gmp-2606]`

### Notas por cliente
- Borrado desde lista: alert "¿Desea eliminar la devolución?" CANCELAR/ELIMINAR (con confirmación). `[gmp-2606][ins-2606][rom-2606]`
- **insumar: eliminar Guardado NO muestra alert de éxito post-borrado** — el ítem simplemente desaparece de la lista. `[ins-2610]`
- Envío: 3 alertas (confirm "¿Desea enviar?" + "¡será enviada!" + "Devolución nro. X enviada exitosamente"). Confirmado romher + insumar. `[rom-2606][ins-2610]`
- Nro.Ref:0 = Guardado local sin sincronizar; al enviar recibe el correlativo real. `[ins-2610]`

---

## Módulo INVENTARIOS

### Identidad
- Ruta: `/inventarios` · Componente raíz: `app-inventarios`
- Botones home: INVENTARIO, BUSCAR
- Tabs nuevo: General / Inventario / Resumen / Adjuntos (4) · Enviado: General / Resumen / Adjuntos (3, sin Inventario)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Cliente | `ion-input#clienteSelect` → modal (click real); buscar `input[placeholder="Clientes..."]` + type + click `.clear-search` + click `<p>` del nombre | `[ins-2606][ins-2610]` | mismo patrón Pedidos; selección por `<p>` del nombre (no centro del item) habilita las 4 tabs |
| Familias/categorías | Tab Inventario muestra grupos → click expande productos | `[gmp-2606][ins-2606]` | |
| Modal captura | clase `inventory-type-stocks-modal` en `ion-modal` | `[ins-2606][gmp-2606]` | `querySelector('inventory-type-stocks-modal')` = null (es clase, no custom element) |
| Inputs modal captura | Cantidad `placeholder="Ingrese cantidad"` (type=number) + Lote `placeholder="Ingrese lote"` (type=text); ids `ion-input-NNN` **dinámicos** | `[ins-2610]` | localizar por placeholder, NO por id fijo |
| Cantidad/Lote/Fecha | **`h.fillNgModelKeyboard`** (`pg.click(sel,{clickCount:3})` + `keyboard.type`) | `[ins-2606][gmp-2606][ins-2610]` | usan `[(ngModel)]`, NO reactive forms |
| Fecha vencimiento | `ion-datetime-button` → overlay → `h.confirmDatetime` (Aceptar en shadowRoot) | `[ins-2606][gmp-2606]` | |
| Aceptar modal | `ion-icon[name="checkmark-outline"]` en header del modal | `[gmp-2606]` | |
| Pedido Sugerido | `ion-button.botonAddAmarillo` en Tab Resumen | `[ins-2606]` | si `suggestedOrderByDispatchAndReturn=true` |
| Guardar / Enviar | `.imagenGuardar` / `.imagenEnviar` (header fijo) | `[gmp-2606][ins-2606][ins-2610]` | Guardar: confirm (Cancelar/Aceptar) → éxito "Inventario guardado con éxito". Enviar: "¿Desea enviar el Inventario?" → "El Inventario será enviado" (2 alertas) `[ins-2610]` |
| Item lista BUSCAR | `pg.mouse.click` sobre coords (dispatchEvent no navega) | `[gmp-2606][ins-2610]` | ítems `ion-item` "Nro. Ref.: N Cliente: COD - NOMBRE Estatus: X Fecha:"; searchbar `ion-searchbar` "Inventarios..." filtra realtime. Botón BUSCAR del home = coords del `ion-button` (no del `ion-col`); navega in-place (URL sigue `/inventarios`) |

### Flujo mínimo probado
```
1. Click INVENTARIO → seleccionar cliente → tabs habilitan
2. Tab Inventario → click familia → click producto → modal inventory-type-stocks-modal
3. fillNgModelKeyboard Cantidad (+ Lote/Fecha si expirationBatch) → checkmark-outline
4. Tab Resumen verifica captura → Guardar (alert confirm) → Enviar (alert confirm)
```

### VG → DOM effects
| VG | true | false |
|----|------|-------|
| `expirationBatch` | campos Lote + Fecha venc en modal | solo Cantidad |
| `suggestedOrderByDispatchAndReturn` | botón Pedido Sugerido en Resumen | DM-INV-017 N/A |

### Anti-patrones confirmados
- `h.fillIonInput` en campos del modal inventario → ngModel no se actualiza, guarda vacío. Usar `fillNgModelKeyboard`. `[ins-2606]`
- Borrado Guardado: trash `ion-button[color="danger"]` dentro del item → **directo sin confirmación previa** ("¡EL Inventario se borro con exito!") — distinto a Devoluciones/Pedidos. `[ins-2606][gmp-2606][ins-2610]`
- Tras `modal.dismiss()`, el `save-btn` del formulario responde solo si se hace `pg.mouse.move()` antes del click (el listener no re-engancha sin movimiento de puntero previo). `[rom-2606]`
- Si los clicks físicos no responden en el modal de captura, cerrar con el método del componente: `ionModal.dismiss(null,'cancel')`. `[rom-2606]`

### Notas por cliente
- Defecto conocido DM-INV-026 (v6.6.14): formulario Guardado abre en tab General en vez de Inventario — no re-marcar FAIL. `[gmp-2606][ins-2606]`
- Inventario guardado local sin sincronizar: Nro.Ref:0. `[ins-2606]`
- insumar: el modal de captura tiene segmento interno **Exhibición / Depósito / Todos** (tipo de stock); el producto capturado queda etiquetado "Inventariado: Exhibición". `[ins-2610]`
- ⚠ insumar (VG `suggestedOrderByDispatchAndReturn`): el botón "Pedido Sugerido" abre `inventario-sugerido-modal` cuyo **Aceptar genera un PEDIDO** y navega a `/pedido` (no solo cierra). Para inspeccionar sin crear pedido, evitar Aceptar o salir con clickBack sin guardar. `[ins-2610]`

---

## Módulo DEPÓSITOS

### Identidad
- Ruta: `/depositos` · Componente raíz: `app-depositos` · form: `app-deposito` + `app-deposito-general` · lista: `app-deposito-list`
- Botones home: DEPÓSITO, BUSCAR · Tabs: General / Cobros / Total / Adjuntos
- **Verificar `modules.depositos.aplica` antes de ejecutar** — si false → todo N/A.

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Botón DEPÓSITO | `pg.mouse.click` + 2s wait antes de confirmar navegación | `[gmp-2606]` | dispatchEvent no navega |
| Banco | `ion-select.selectbanco` + `h.selectIonPopover` (o asignar `option.value` objeto idBankAccount/coBank) | `[gmp-2606][rom-2606][ins-2610]` | sin formControlName/id explícito. En DEPÓSITOS insumar SÍ usa `ion-select.selectbanco` con `ion-select-option` reales (≠ COBROS insumar que usa `#bankPickerModal`) |
| Cuenta banco | ion-input read-only (se llena al elegir banco) | `[gmp-2606]` | |
| Nro documento | ion-input label **"Nro. Plantilla:"** (NO "Nro. Depósito") | `[gmp-2606][rom-2606][ins-2606]` | editable |
| Fecha Doc | `ion-button` (`.letrasFechasButton`) → modal `fechasModal` → asignar `dt.value` ISO + `ionChange` **ANTES** de `h.confirmDatetime` | `[gmp-2606][rom-2606][ins-2610]` | `querySelector('button.letrasFechasButton')` falla; usar ion-button. ⚠ el datetime abre **sin valor inicial** (mes "mayo de 2021"): solo Aceptar deja Fecha Doc **vacía** — asignar el valor antes de pulsar Aceptar `[ins-2610]` |
| Fecha Depósito | `ion-button` disabled (calculada, no editable) | `[gmp-2606]` | |
| Checkbox cobro (Tab Cobros) | `getBoundingClientRect` + `pg.mouse.click()` real | `[rom-2606]` | |
| Lista `app-deposito-list` | calcular coords sobre el **`ion-item`** individual, NO el `ion-row` padre | `[ins-2610]` | el `ion-row` contenedor abarca toda la lista (top..bottom); su centro cae fuera de viewport y selecciona el item equivocado |
| Alerta salida | "Denario Depósito": GUARDAR Y SALIR / SALIR SIN GUARDAR / CANCELAR (roles save/exit/cancel) | `[gmp-2606]` | |

### Flujo mínimo probado
```
1. Verificar aplica=true → Click DEPÓSITO (mouse.click + 2s)
2. Tab General: selectIonPopover banco + Fecha Doc (fechasModal) + Nro. Plantilla
3. Tab Cobros: marcar cobros (mouse.click) — monto = suma de cobros (no campo libre)
4. Guardar → alert "El Depósito se ha guardado"
```

### VG → DOM effects
| Condición | Efecto |
|-----------|--------|
| Sin cobros seleccionados | Guardar no habilita; intento → "Seleccione los Cobros a depositar" `[gmp-2606][rom-2606]` |
| Tab Cobros vacío | solo muestra cobros en estado "pendiente depósito"; cobros ya enviados no aparecen `[gmp-2606]` |

### Anti-patrones confirmados
- No hay campo Monto libre: el monto se deriva de los cobros seleccionados en Tab Cobros. `[rom-2606][gmp-2606]`

### Notas por cliente
- **hidroponias: `aplica=false`** — módulo requiere cobro con Efectivo; solo Depósito bancario habilitado → todos los casos N/A. `[hid-2605]`
- Borrado de depósito Guardado: **CON confirmación** (alert Cancelar/Aceptar) — distinto a Inventarios (directo). Trash `ion-button[color="danger"]` dentro del `ion-item`. `[ins-2610]`
- Flujo envío = 2 alertas (confirmación Cancelar/Aceptar → resultado OK); servidor asigna Nro.Ref real al enviar (Ref 0 → Ref real). `[ins-2610]`
- Defecto conocido DM-DEP-010/018/019/020 (v6.6.14 `deposit.service.ts`): lista BUSCAR no renderiza tras guardar. ⚠ **DM-DEP-010/018 NO reprodujo en insumar en 0609 ni 0610 (2 corridas) — candidato a cerrar defecto.** Guardar→Enviar con cobro vinculado ejecutado end-to-end (cierra gap G3). `[rom-2606][ins-2606][ins-2610]`

---

## Módulo VISITAS

### Identidad
- Ruta: `/visitas` (home) → `/visita` (form) · `/listaVisitas` (RUTA DE HOY)
- Componente raíz: `app-visitas`
- Botones home: NUEVA VISITA, RUTA DE HOY, Ver mejor ruta · Tabs form: General / ACTIVIDADES / ADJUNTOS

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Entrada HOME Visitas | `a.ion-text-center` (texto "Visitas") dentro de `ion-col` → `pg.mouse.click` navega a `/visitas` | `[ins-2610]` | |
| RUTA DE HOY | `a`/`ion-col` texto "RUTA DE HOY" → `pg.mouse.click` real navega a `/listaVisitas` | `[ins-2610]` | ítems "Nro Ref.: N · Cliente: COD - NOMBRE · Estatus: Guardado/Visitado · Fecha:"; trash solo en filas "Guardado" |
| NUEVA VISITA | `ionBtn.shadowRoot.querySelector('button').click()` | `[gmp-2606]` | mouse.click ejecuta pero URL queda en /visitas |
| Cliente (input) | `ion-input#clienteSelect` → modal | `[rom-2606]` | |
| Modal cliente búsqueda | `.search-input` (placeholder "Clientes...") + botón `.clear-search` | `[gmp-2606]` | click en botón tras escribir |
| Selector Actividad | `ion-modal ion-select` interface popover → `h.selectIonPopover` o asignar objeto a `.value` + ionChange | `[ins-2606][rom-2606]` | valor es objeto `{idType,naType,requiredEvent,requiredSignature}` |
| Selector Motivo | aparece solo si `actividad.requiredEvent="true"` | `[ins-2606][rom-2606]` | |
| Comentario (modal) | `pg.focus('ion-modal ion-input input')` + `keyboard.type()` | `[ins-2606]` | usa ngModel; NO fillIonInput |
| Botón AGREGAR (modal) | texto "Agregar" (título); coords frescas con `getBoundingClientRect` | `[gmp-2606][ins-2606]` | posición cambia según selects visibles |
| Guardar / Enviar | `.imagenGuardar` / `.imagenEnviar` | `[gmp-2606]` | |

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
- `dispatchEvent(MouseEvent)` en `img.fechaAtras` no activa router — usar `getBoundingClientRect` + `pg.mouse.click()`. `[ins-2606][ins-2610]`
- Click en popover-item de Actividad fuera de viewport falla — asignar objeto a `.value` directamente. `[rom-2606]`
- Múltiples clicks en NUEVA VISITA dejan `ion-loading` con `backdrop-no-tappable` — llamar `loading.dismiss()`. `[gmp-2606][rom-2606]`
- Dirty-guard back: `img.fechaAtras` con `getBoundingClientRect()+mouse.click()` (coords ~31,31) SÍ dispara modal "¡Alerta!" (Guardar y salir / Salir sin guardar / Cancelar) **cuando hay cambios sin guardar**; con visita ya Guardada y sin cambios NO aparece (sale directo). `[ins-2610]`
- Al reabrir visita Guardada, las tabs ACTIVIDADES/ADJUNTOS aparecen `disabled` momentáneamente (~1.5s, render asíncrono) y luego se habilitan — esperar antes de marcar FAIL. `[ins-2610]`

### Notas por cliente
- globalmp: todas las actividades tienen `requiredEvent:"true"` → Motivo siempre requerido. `[gmp-2606]`
- insumar: TODAS las actividades `requiredEvent:"true"` → Motivo siempre requerido (idTypes 2,47,71,75,82-88). "VISITA SIN ACCION" tiene único Motivo "NEGOCIO CERRADO". `[ins-2610]`
- insumar: envío = 2 alertas ("¿Desea enviar la visita?" Cancelar/Aceptar → "Su Visita será enviada" OK) → navega a `/visitas`. Tras sync, reaparece como Nro Ref real con Estatus "Visitado". `[ins-2610]`
- globalmp: seleccionar cliente sin coordenadas → alert "Esta sucursal no tiene coordenadas asignadas" → dismiss con primer botón. `[gmp-2606]`
- Post-envío globalmp: estado "Por Enviar" (no "Visitado") hasta sync servidor — offline-first normal, es PASS. `[gmp-2606]`
- DM-VIS-022: "Salir sin guardar" sobre visita YA Guardada la mantiene = correcto (no FAIL). `[hid-2605]`
- Borrado: alert "¿Desea borrar la visita? Esta acción no se puede deshacer." CANCELAR/Aceptar → "Se eliminó la visita de manera exitosa". `[gmp-2606][ins-2606][rom-2606][ins-2610]`
- Defecto abierto DM-VIS-002 (romher): "Ver mejor ruta" deja `ion-loading` indefinido sin GPS. `[rom-2606]`

---

## Módulo PRODUCTOS

### Identidad
- Ruta: `/productos` · Sub-vistas: `product-structures-list` (estructuras) → `product-list` (productos) → detalle
- Solo lectura — sin registros creados
- Selector tipo estructura: `ion-select` (valores: LINEA = idTypeProductStructure 2)

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Selector tipo | `ion-select` en estructuras — es el **2º** ion-select visible (sel[0]=empresa, sel[1]=tipo) | `[gmp-2606][ins-2606][rom-2606][ins-2610]` | cambio de tipo: tomar `value` (objeto) del `ion-select-option` por texto y asignarlo a `.value` + `ionChange`. `selectIonPopover` por texto NO aplica (valor es objeto) `[ins-2610]` |
| Estructuras (lista) | `product-structures-list .product-structure-title` / `ion-item.listaItems` | `[ins-2610]` | cada ítem muestra "NOMBRE {conteo}" (ej. "ALIMENTOS 158"); click → `product-list` con `mouse.click` en coords reales |
| Campo búsqueda | `input.search-input.inputsSearch` (NO ion-input) | `[gmp-2606]` | focus + click×3 + keyboard.type + **Enter** |
| Estructura → productos | click en ítem estructura → `product-list` | `[gmp-2606]` | |
| ⚠ Placeholder residual | "No hay productos disponibles" permanece como 1er `ion-item` en `product-list` aun con productos | `[ins-2610]` | al iterar, filtrar `!/No hay/i.test(text)` para no clickearlo |
| Detalle producto | nombre, código, precio BS, unidad, estructura | `[gmp-2606]` | |
| Lista de precios | selector cambia precio mostrado | `[gmp-2606]` | ⚠ ver defecto romher |
| Botón atrás | `productos-header > a` (`<img>` SIN clase `.fechaAtras`) → `pg.mouse.click(coords)` | `[gmp-2606]` | h.clickBack NO sirve aquí |
| Scroll infinito | `ion-infinite-scroll` (disabled si todo cabe en 1ª página) | `[gmp-2606]` | |

### Flujo mínimo probado
```
1. /productos → product-structures-list (ion-select tipo)
2. Click estructura → product-list → buscar (focus+type+Enter)
3. Click producto → detalle (precio, lista de precios)
4. Back: detalle→lista OK; lista→estructuras = FAIL conocido (ver abajo)
```

### Anti-patrones confirmados
- Búsqueda NO filtra on-keyup/ionChange programático — requiere `keyboard.type()` + `press('Enter')`. `[gmp-2606]`
- Back de productos NO usa `.fechaAtras` — usar `header.querySelector('a')` + mouse.click. `[gmp-2606]`

### Notas por cliente
- globalmp/romher: solo 1 tipo de estructura (LINEA) → DM-PRD-002 N/A estructural. `[gmp-2606][rom-2606]`
- **insumar: 2 tipos de estructura (Línea + Sub-Línea)** → DM-PRD-002 **ejecutable y PASS** (sel[1]=tipo). Excluye a insumar de la nota N/A anterior. `[ins-2610]`
- **Defecto abierto DM-PRD-013** (romher): selector Lista de precio cambia valor interno pero precio en pantalla no se actualiza. En globalmp SÍ cambia (PASS). Divergencia por cliente/datos. `[rom-2606]` vs `[gmp-2606]`
- insumar: detalle de producto tiene un único `ion-select` = "ALMACEN 01" (**sin Lista de Precios**) → DM-PRD-013 N/A estructural en insumar. Precio USD+BS como texto fijo ("Precio Unidad - UNIDADES 1,85 US$ / 958,23 BS"), no recalculable por selector. `[ins-2610]`
- insumar: lista muestra "Precio + IVA" (no observado en hidroponias). `[ins-2606]`

---

## Módulo VENDEDORES

### Identidad
- Ruta: `/vendedores` · Componente raíz: `app-vendedores`
- Solo lectura · contenido: acordeones por empresa
- **Verificar `modules.vendedores.aplica` / `vgs.esVendedor`**

### Selectores probados
| Elemento | Selector CSS / técnica | Corrida | Notas |
|----------|------------------------|---------|-------|
| Heading rol | `<h1>Vendedor</h1>` en `app-vendedores` | `[gmp-2606]` | confirma `esVendedor=true` (no usar ng.getComponent en prod) |
| Acordeones empresa | `ion-accordion.accordion-collapsed` ↔ `.accordion-expanded`; content en `[slot="content"]` | `[gmp-2606][ins-2610]` | oráculo de expansión por `getBoundingClientRect().height` (0 colapsado, >0 expandido) — no depender de `offsetParent`; click header coords (~180,101) |
| Contenido KPIs | `ion-grid`/`ion-col` (puede venir vacío si API no devuelve) | `[gmp-2606]` | vacío = N/A, no FAIL |

### Flujo mínimo probado
```
1. Click Vendedores → app-vendedores (acordeones empresa)
2. Click acordeón → expande/contrae; KPIs si API devuelve
3. clickBack → HOME
```

### Notas por cliente
- globalmp: 2 empresas (COMERCIALIZADORA DE, HC TRADING MARKET 20); KPIs vacíos esta sesión → N/A estructural. `[gmp-2606]`
- **insumar: 1 sola empresa ("INSUMAR DISTRIBUIDOR") y KPIs SÍ poblan** (Cartera Clientes 163, Activados 4, Nuevos 0, Días Hábiles 22 / Transcurridos 8 / Restantes 14) → DM-VND-002 **PASS pleno, no N/A**. `[ins-2610]`
- `esVendedor=true` confirmado en globalmp, romher, insumar. `[gmp-2606][rom-2606][ins-2606][ins-2610]`

---

## Gaps pendientes de mapear (sin selector probado aún)

Estos elementos no tienen selector confirmado porque ninguna corrida tuvo los datos/condiciones para ejecutarlos. Completar con búsqueda dirigida en el XML (Fase 5) o cuando una corrida los alcance.

| # | Módulo | Elemento sin mapear | Por qué no se capturó | Cómo desbloquear |
|---|--------|---------------------|------------------------|------------------|
| G1 | COBROS | Detalle de retención en documento (campo comprobante `sizeRetention`/`formatRetention`, fecha, monto IVA, monto ISLR) — DM-COB-041/042 | Ningún cliente tuvo documento vencido (rojo) elegible en sesión | Buscar `cobro-document-detail` en XML; o corrida con factura vencida en cartera |
| G2 | COBROS | Flujo interno de ANTICIPO/PREPAGO y COBRO 25% IVA (form, tabs) — DM-COB-028/037 | Botones visibles pero "No hay clientes disponibles" | Buscar componentes prepago/IGTF en XML; o cliente con elegibles |
| G3 | DEPÓSITOS | ✅ **CERRADO** `[ins-2610]` — Guardar→Enviar con cobro vinculado ejecutado end-to-end en insumar (Ref real Enviado); el bug de render no bloqueó | — | — |

---

## Apéndice — Notas CDP transversales

- **Socket CDP:** `webview_devtools_remote_<PID>` (NO `_1`). El PID cambia al reiniciar la app. Re-mapear: `adb forward tcp:9220 localabstract:webview_devtools_remote_<PID>`. `[gmp-2606][ins-2606]`
- **Conexiones stale:** múltiples corridas acumulan TCP ESTABLISHED en :9220 → `adb forward --remove` + re-forward. `[rom-2606]`
- **Reconexión mid-run:** el PID puede cambiar a mitad de corrida (app reinicia en HOME); la data ya enviada no se pierde. `[rom-2606]`
