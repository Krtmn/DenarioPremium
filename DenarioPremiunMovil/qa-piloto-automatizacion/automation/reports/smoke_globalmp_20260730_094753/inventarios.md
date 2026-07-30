# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260730_094753_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente / Playa | globalmp · **la_tortuga** (`denariolatortuga.ddns.net:8081/PremiumWS`) |
| App | `com.kiberno.denarioPremiumPro` — appVersion **1.0** · dbVersion **19** · `window.ng=true` |
| Dispositivo | Infinix X6728 (HOT 60i) · UUID `da9f78b6e785fffc` |
| Usuario | **YC01** YUSNEIDI CLEMENTE (id_user 307) |
| Empresa | **00002 COMERCIALIZADORA GLOBAL M&P** (preseleccionada por defecto — no hizo falta elegirla) |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 29 min de 45 · **0 cuelgues de CDP** · 0 reconexiones |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Tile Inventarios → `/inventarios`, `app-inventarios` con botones **INVENTARIO** y **BUSCAR** |
| DM-INV-002 | ✅ PASS | Formulario con **4 tabs** General/Inventario/Resumen/Adjuntos; Cliente vacío; 3 tabs **bloqueadas** sin cliente. ⓘ Aquí **NO** apareció la alerta de geolocalización y el **1.er click SÍ abrió** el form (contrasta latino_cosmetica) |
| DM-INV-004 | ✅ PASS | Cliente **ABASTO EL SITIO DSG, C.A. (AS04)** → las 4 tabs se habilitan; sin alerta de deuda; sin modal residual |
| DM-INV-008 | ✅ PASS | Tab Inventario lista **34 categorías por marca** (ACEITE 8, CAPRI 60, COLGATE 208, NESTLE 102…) + input "Búsqueda de productos" |
| DM-INV-010 | ✅ PASS | CAPRI → **PCE03** abre `ion-modal.inventory-type-stocks-modal` con Cantidad + Lote + Fecha de vencimiento (`ion-datetime#expDate0`, default HOY) |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: Cantidad **15**, Lote **LOTEQA30**, Venc. **31/07/2026** — los 3 reflejados en el modal |
| DM-INV-012 | ✅ PASS | Checkmark (`.save-btn`) acepta sin error; producto queda **"Inventariado: Exhibición"**; botón Enviar se habilita |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla Sel/Código/Producto/Exhibición/Depósito/Acción → **PCE03 · 15 CAJA · Depósito "-"** |
| DM-INV-017 | ✅ PASS ⚠ | Botón **"Pedido Sugerido"** (`ion-button.botonAddAmarillo`) **SÍ presente** en Tab Resumen → `inventario-sugerido-modal`. ⚠ **No renderiza la línea "Sugerido UNIDADES: N"** (ver Hallazgo H2) |
| DM-INV-020 | ✅ PASS | En el modal sugerido: **"Días desde último Inventario: 1"** y **"Días para siguiente Inventario: 1"** (viven acá, no en Tab General) |
| DM-INV-021 | ✅ PASS | "¿Desea guardar el Inventario?" [Cancelar/**Aceptar**] → **"Inventario guardado con éxito"** [OK]. BD local: `st_delivery=3`, `id=0` ⇒ **BD-SAVED** correcto |
| DM-INV-022 | ✅ PASS | **3 alertas** → la 3.ª: **"Inventario nro. 104 enviado exitosamente"**. Navega al home de inventarios. **Sin crash** |
| DM-INV-023 | ✅ PASS | BUSCAR lista 5 ítems: `Nro. Ref.: 104 · AS04 - ABASTO EL SITIO DSG, C.A. · Estatus: Enviado · 30/07/2026` en el tope |
| DM-INV-025 | ✅ PASS | Searchbar filtra en tiempo real: `SF02`→1 · `FERVI`→1 · `104`→1 · `ZZZZ`→0 · vacío→4 (código, nombre y Nro.Ref) |
| DM-INV-026 | ✅ PASS ⚠ | El Guardado abre con cliente CB10 cargado, **pero en tab General** — defecto conocido cosmético, **no FAIL** (§5 RUNTIME). Round-trip §9 completo (ver abajo) |
| DM-INV-028 | ✅ PASS | Papelera `ion-button[color="danger"]` borra **directo sin confirmación previa**: "¡EL Inventario se borro con exito!" → desaparece de lista y de BD local |

---

## Registros creados en sistema

| Nro. Ref | Cliente | Empresa | Producto | Cant. | Unidad | Lote | Vencimiento | Ubic. | Estado |
|----------|---------|---------|----------|-------|--------|------|-------------|-------|--------|
| **104** | AS04 — ABASTO EL SITIO DSG, C.A. | 00002 GLOBAL M&P | **PCE03** PASTA ESP. TALLARIN CORTO 12x500gr | **15** | CAJA (CJA) | **LOTEQA30** | **31/07/2026** | exh | ✅ **Enviado** |
| — (Ref 0) | CB10 — BIG BANG IMPORT, C.A | 00002 GLOBAL M&P | **PCE04** PASTA ESP. TALLARIN LARGO 12x500gr | **8** | CAJA (CJA) | **LOTEQA31** | 30/07/2026 | exh | 🗑 Guardado → **borrado** en DM-INV-028 |

> El 2.º inventario se creó deliberadamente para poder ejecutar DM-INV-026 y DM-INV-028 (requieren un registro en estado Guardado) y se eliminó al cerrar el caso 028. **No quedó residuo** en el sistema.

---

## Verificación BD

**Oráculo: BD local del device por CDP** (`window.sqlitePlugin`) + **payload capturado**. La BD **nube** (`global_mp`) está **sin GRANT** en esta corrida ⇒ `query.js` NO se usó; la llegada a la nube la prueba la capa web.

| Registro | Marca | Local (`client_stocks`) | Cola | Conclusión |
|----------|-------|--------------------------|------|------------|
| Ref **104** (AS04) | **BD-OK** | `co_client_stock=1785425411479.0` → **`id_client_stock=104`**, **`st_delivery=1`** | `pending_transactions=0` · `failed_transactions=0` | **guardado → enviado CONFIRMADO** |
| Ref 0 (CB10) | BD-SAVED → borrado | `id_client_stock=0`, `st_delivery=3` → **0 filas** tras la papelera | 0 / 0 | El trash borra también en BD local |

- **Correlación confirmada: Nro.Ref de la UI (104) = `id_client_stock` local (104).**
- Baseline de la corrida respetado: `pending_transactions=0`, `failed_transactions=0` **al abrir y al cerrar** el módulo.
- Payload `clientstockservice/clientstock` **capturado** (volcado a `_payloads.jsonl`): `quStock:15` · `coUnit:"CJA"`/`naUnit:"CAJA"` · `nuBatch:"LOTEQA30"` · `daExpiration:"2026-07-31T04:00:00"` · `ubicacion:"exh"` · `coClient:"AS04"` · `idEnterprise:2`/`coEnterprise:"00002"` · `coUser:"YC01"` · `daysSinceLast:1` · `daysUntilNext:1`.
- ⚠ El payload manda `stClientStock=0` y `stDelivery=2` — **corroborar por `id_client_stock` + `st_delivery` local, NO por el `st` del payload** (reconfirma latino_cosmetica).
- ⚠ **Los inventarios bajados del servidor (101/102/103) tienen `st_delivery = NULL`**, no 1. El discriminador `st_delivery=1` solo aplica a los creados localmente y enviados. No confundir NULL con "no enviado".

### Round-trip §9 (Guardar → reabrir)

Ejecutado sobre el inventario Guardado de CB10 (DM-INV-026). **PASS completo** — los 3 campos sobreviven:

| Campo | Guardado | Al reabrir |
|-------|----------|-----------|
| Cliente | BIG BANG IMPORT, C.A (CB10) | ✅ igual |
| Cantidad | 8 | ✅ 8 (Resumen: "8 CAJA") |
| Lote | LOTEQA31 | ✅ LOTEQA31 |
| Fecha venc. | 2026-07-30 | ✅ 2026-07-30 |

---

## Verificación de conversiones

Inventarios **NO maneja montos** — solo cantidades y unidades. **No se inventó oráculo de importes.**

Lo único con conversión que apareció fue el **saldo del cliente en el picker**, y ahí la conversión es **CORRECTA** con la tasa 737,88:

| Cliente | Saldo BS | Saldo USD | BS ÷ 737,88 | Veredicto |
|---------|----------|-----------|-------------|-----------|
| AS04 ABASTO EL SITIO DSG | 1.546.766,19 | 2.096,23 | 2.096,24 | ✅ correcto (dif. 0,01 = redondeo) |
| CB10 BIG BANG IMPORT | 338.354,87 | 458,55 | 458,54 | ✅ correcto (dif. 0,01 = redondeo) |

> ⓘ **Contraste útil:** el defecto de *listado de clientes* (etiquetas cruzadas + división de más, deuda ~738× más chica) **NO reproduce** en el picker de clientes de Inventarios. Acota el defecto al componente del listado, no al servicio de saldos.

---

## Hallazgos

> Ninguno es FAIL. Los dos son **divergencias VG-vs-UI** del patrón ya documentado en 5+ playas, que QA decidió verificar con desarrollo antes de tocar la VG.

### H1 — `expirationBatch=true` NO se valida: acepta captura con **Lote vacío**

- **Probado con dato vivo** (como pidió el encargo): se cargó **solo Cantidad=15**, se dejó **Lote vacío** y se pulsó el checkmark del `inventory-type-stocks-modal`.
- **Resultado:** el modal **cerró sin error** y el producto quedó **"Inventariado: Exhibición"**. No apareció el rechazo *"Complete cantidad, unidad, fecha y lote para continuar."*.
- **Esperado según `el_valle-20260728`:** con `expirationBatch=true` la app **debe** rechazar la captura incompleta.
- **Lectura:** en globalmp/La Tortuga la VG `expirationBatch` **renderiza** los campos Lote+Fecha pero **no los vuelve obligatorios** — se comporta igual que las playas con la VG en `false` (dm-electronica, latino_cosmetica). Es la 3.ª playa donde `expirationBatch` no gobierna la validación como se documentó.
- **Acción sugerida:** confirmar con desarrollo cuál es el comportamiento correcto de la VG antes de cambiarla en el YAML. **No marcado FAIL** por ser el patrón de divergencia ya abierto.

### H2 — "Pedido Sugerido" aparece pero el modal no trae la cantidad sugerida

- El botón `ion-button.botonAddAmarillo` **SÍ está** en Tab Resumen y abre `inventario-sugerido-modal`.
- El modal muestra: `Moneda:` (vacío) · `Días desde último Inventario: 1` · `Días para siguiente Inventario: 1` · `PCE03 - PASTA ESP. TALLARIN CORTO 12x500gr` · [ACEPTAR].
- **Falta la línea "Sugerido UNIDADES: N,NN"** que sí documentó insumar `[ins-2622]`. Idéntico a latino_cosmetica.
- Cerrado con `dismiss(null,'cancel')` para **no** crear un pedido.

### ⓘ Contraste pedido por el orquestador — Pedido Sugerido / tab Resumen

El agente de PEDIDOS reportó que en este build **no aparece el botón "Pedido Sugerido" en ninguna tab** y que **no existe tab "Resumen"**. En **INVENTARIOS ocurre lo contrario**:

- La tab **"Resumen" SÍ existe** (es una de las 4 del formulario de inventario).
- El botón **"Pedido Sugerido" SÍ aparece** ahí, y es funcional.

⇒ La VG `suggestedOrderByDispatchAndReturn` gobierna el **botón dentro del formulario de INVENTARIO**, no una sección del módulo Pedidos. Lo que falta en Pedidos no es la misma superficie, así que **la ausencia en Pedidos no es evidencia de que la VG esté inactiva**. Acota el reporte de la 4.ª playa con esa divergencia.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Coords fuera del viewport en listas largas → click al vacío sin error** | universal | El viewport es **360×744**. `getBoundingClientRect()` de un `ion-item` de la lista de productos devolvió `y=795` (bajo el fold): `pg.mouse.click(180,795)` **no hizo nada, sin excepción** — se leyó como "el modal no abre". **Fix: `scrollIntoView({block:'center'})` → esperar ~900 ms → RE-LEER las coords → validar `0<y<744`.** Misma clase de bug que el `img.fechaAtras` con rect 0×0: **el rect existe pero no es clickeable**. Costó 1 intento en DM-INV-010 |
| 🔴 **`ion-datetime` solo confirma el valor al pulsar Aceptar** | universal | Tras clickear el día, `dt.value` **sigue mostrando la fecha vieja**; recién cambia al pulsar **Aceptar** en el `shadowRoot`. Leer `dt.value` justo después del click y concluir "no tomó" es un falso negativo |
| 🔴 **El calendario de `ion-datetime` es un carrusel de 3 meses; 2 están FUERA de pantalla** | universal | `shadowRoot.querySelectorAll('.calendar-day')` devuelve **102 días** (mes previo, actual y siguiente). Los del mes previo dan `x` **negativo** (ej. `-226`). **Filtrar los candidatos por `x>0 && x<vw && y>0 && y<vh`** antes de clickear, o se clickea al vacío |
| **Selección de cliente: click real en el `<p>` del nombre — funcionó a la primera** | cliente (globalmp) | Zanja la contradicción del día: en INVENTARIOS el **click real SÍ prendió** (como en devoluciones), sin necesidad de `setClientfromSelector`. Filtrar los `<p>` por `getBoundingClientRect().width>0` y clickear el centro. Sin alerta de deuda, sin modal residual |
| **El modal de cliente NO filtra al teclear — hace falta la lupa** | universal (3.ª confirmación) | Escribir en el `input` del modal no filtra nada; hay que clickear `ion-icon[name="search-circle-sharp"]`. Reconfirma ferrenuestro + dm-electronica, ahora también en **La Tortuga / globalmp** ⇒ es del build, no de la playa |
| **Envío = 3 alertas, la 3.ª trae el Nro.Ref** | cliente (2.ª confirmación) | `¿Desea enviar el Inventario?` [Cancelar/Aceptar] → `El Inventario será enviado` [OK] → **`Inventario nro. 104 enviado exitosamente`** [OK]. Reconfirma latino_cosmetica: no hace falta volver a la lista para obtener la Ref |
| **`st_delivery = NULL` en inventarios bajados del servidor** | universal | Las cabeceras sincronizadas desde la nube (101/102/103) traen `st_delivery=NULL` + `st_client_stock=1`; solo las creadas en el device traen `1` (enviado) / `3` (guardado). **Un `WHERE st_delivery=1` NO devuelve los sincronizados** — no leerlo como "no enviados" |
| **NO hubo alerta de geolocalización y el 1.er click SÍ abrió el formulario** | cliente (globalmp) | Contrasta `[latino_cosmetica-20260729]` (alerta tapada por `ion-loading` + 1.er click consumido). El bucle defensivo se mantuvo y no costó nada, pero **acá no era necesario** ⇒ la alerta depende del estado del permiso de ubicación del device, no del build |
| **Tab Inventario: los sub-segmentos aparecen AL ENTRAR a una familia** | cliente (globalmp) | En el nivel de familias solo hay contadores (Favoritos/Destacados/Inventario) + buscador. **UBICACIÓN (EXHIBICIÓN/DEPÓSITO) + FILTRO (TODOS/INVENTARIADOS)** se renderizan recién dentro de la familia |
| **`inventory-type-stocks-modal`: tipo fijo "Exhibición - 1", sin segmento** | cliente (globalmp) | Como piercar/don-theo/jerez. Inputs **por placeholder** ("Ingrese cantidad" number / "Ingrese lote" text), `ion-datetime#expDate0` default HOY, header icons close/checkmark/trash/add, botón aceptar = **`.save-btn`** |
| **Trash del Guardado: borrado DIRECTO sin confirmación** | cliente (reconfirmado) | "¡EL Inventario se borro con exito!" — distinto de Devoluciones/Pedidos. Back desde un Guardado sin cambios **no** dispara dirty-guard |

---

## Notas de operación

- **`window.__qaH` heredado:** no se reinstaló (según instrucción). El hook heredado **sí** emite `{url, data}` con body completo — `getCapturedPayloads()` sirvió tal cual, sin necesidad de `getPayloadData()` (que no existe en esta instalación).
- **`page.__qa` persistió del agente anterior** (pedidos): la conexión CDP + watchdog se reusaron sin re-inlinar helpers.
- **Regla de adjuntos respetada:** no se tocó la cámara, no se instalaron mocks, no se adjuntó nada. Inventarios **no exigió adjunto** para Enviar (`hasAttachments:"false"`, `nuAttachments:0` en el payload y el envío completó).
- **`.remove()` sobre overlays: NUNCA usado.** Todos los descartes fueron `dismiss()` / `dismiss(null,'cancel')`.
- Módulos ajenos no tocados: no se abrió Cobros ni Depósitos; el cobro en Guardado quedó intacto.
