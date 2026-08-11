# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260805_133539_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente / Playa | `el_palmar` — Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Dispositivo | ADB `14678405BR003855` — Infinix HOT 60i (X6728) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Empresa efectiva | **CENTRAL EL PALMAR, S.A. — `co_enterprise 1002` / `id_enterprise 1`** ✅ |
| Usuario | coUser 1276 / idUser 266 |
| Resultado | **15 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Wall-clock | ~13 min · 0 cuelgues de CDP · 0 abortos de watchdog |
| Estado inicial / final | HOME → HOME ✅ |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Tile Inventarios → `/inventarios`, `app-inventarios` visible con botones **INVENTARIO** y **BUSCAR** |
| DM-INV-002 | ✅ PASS | 4 tabs `General/Inventario/Resumen/Adjuntos`; solo General habilitada (las otras 3 `disabled=true`), `ion-input#clienteSelect` vacío, Guardar/Enviar `disabled` |
| DM-INV-004 | ✅ PASS | Cliente `1000000803 — C.A. RON SANTA TERESA, S.A.C.A` seleccionado → **las 4 tabs habilitan**; sucursal cargada (`CTRA PANAMERICANA … EL CONSEJO ARAGUA`, `coAddressClient 0500002916`); Guardar pasa a habilitado |
| DM-INV-008 | ✅ PASS | Tab Inventario renderiza el árbol **`Alcohol 1 · Azucar 8 · PVA 30`**; familia Azucar → 8 productos con código; sub-segmentos UBICACIÓN (Exhibición/Depósito) + FILTRO (Todos/Inventariados) |
| DM-INV-010 | ✅ PASS | Click en `160000019` → `ion-modal.inventory-type-stocks-modal` con Cantidad (number), Lote (text), Fecha de vencimiento (`ion-datetime#expDate0`), unidad **FARDO**, tipo fijo "Exhibición - 1" |
| DM-INV-011 | ✅ PASS | `h.fillNgModelKeyboard` → cantidad **7**, lote **LOTEQA0805**; fecha cambiada a **28/08/2026** por calendario. Los 3 valores reflejados en el modal y en `#expDate0` |
| DM-INV-012 | ✅ PASS | Aceptar (`checkmark-outline`) cerró el modal sin error; producto queda **"Inventariado: Exhibición"**; Guardar **y** Enviar habilitan. (1.er intento con lote vacío fue rechazado — ver Hallazgo A: es validación correcta, no defecto) |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla `Sel/Código/Producto/Exhibición/Depósito/Acción` → `160000019 · AZÚCAR MONTALBAN REFINO PAPEL 20X1KG · 7 FARDO · -` |
| DM-INV-017 | 🚫 N/A | `suggestedOrderByDispatchAndReturn=false`. El modal `inventario-sugerido-modal` **no renderiza la línea "Sugerido UNIDADES: N"** (solo Moneda + días + producto) ⇒ no hay sección de pedido sugerido con cantidades. ⚠ El botón `botonAddAmarillo` **sí aparece** — divergencia UI-vs-config ya documentada en 6 playas, no es hallazgo nuevo |
| DM-INV-020 | ✅ PASS | **"Días desde último Inventario: 1" / "Días para siguiente Inventario: 1"** visibles en `inventario-sugerido-modal` (no en Tab General). Confirmado en payload: `daysSinceLast:1`, `daysUntilNext:1` |
| DM-INV-021 | ✅ PASS | Guardar → `¿Desea guardar el Inventario?` **[Cancelar/Aceptar]** → `Inventario guardado con éxito` **[OK]**. Aparece en BUSCAR con Estatus **Guardado** |
| DM-INV-022 | ✅ PASS | Enviar → **3 alertas**: `¿Desea enviar el Inventario?` [Cancelar/**Aceptar**] → `El Inventario será enviado` [**OK**] → **`Inventario nro. 17 enviado exitosamente`** [**OK**] → navega al home de inventarios. **Ref 17** |
| DM-INV-023 | ✅ PASS | BUSCAR lista `Nro. Ref.: 17 · Cliente: 1000000803 - C.A. RON SANTA TERESA, S.A.C.A · Estatus: Enviado · Fecha: 05/08/2026`. El Enviado **no** trae trash; el Guardado sí |
| DM-INV-025 | ✅ PASS | Searchbar `Inventarios...` filtra **on-keyup** (sin lupa): `SANTA`→1 · `ZZZZ`→0 · `1000000803`→1 · vacío→1 |
| DM-INV-026 | ✅ PASS (con defecto conocido) | El Guardado reabre completo (cliente, empresa, capturas) **pero en el tab General en vez de Inventario** ⇒ **el defecto conocido REPRODUCE**. Cosmético, ya registrado — no se marca FAIL |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` **directo, sin confirmación previa** → `¡EL Inventario se borro con exito!` [OK]; desaparece de la lista y de la BD local |

---

## Registros creados en sistema

| Ref | Epoch (`co_client_stock`) | Detalle | Empresa efectiva | Estado |
|-----|---------------------------|---------|------------------|--------|
| **17** | `1785958714079.0` | `1000000803 — C.A. RON SANTA TERESA, S.A.C.A` · `160000019` AZÚCAR MONTALBAN REFINO PAPEL 20X1KG · **7 FARDO** · ubicación `exh` · lote **LOTEQA0805** · venc **28/08/2026** | **1002 / id 1 — CENTRAL EL PALMAR, S.A.** | **Enviado** (`st_client_stock=1`) |
| 0 (temporal) | — | 2.º inventario · `160000020` AZÚCAR MONTALBAN REFINO PL 20X1KG · 3 FARDO · lote LOTEQA0805B | 1002 / id 1 | **Borrado** en DM-INV-028 (no persiste) |

---

## Verificación BD

**Baseline al inicio:** `client_stock` → 16 filas, `max(id_client_stock)=16`.

**Nube (`node automation/db/query.js "el palmar"`), baseline-diff `id>16`:**

| id_client_stock | co_client_stock | st | co_enterprise / id_enterprise | co_client | det | units |
|---|---|---|---|---|---|---|
| **17** | `1785958714079.0` | **1** | **`1002` / `1`** ✅ | `1000000803` | 1 | 1 |

Cotejo campo-a-campo de la hija (`client_stock_detail` + `client_stock_detail_unit`):

| Campo nube | Valor | Cargado por UI | ¿Cuadra? |
|---|---|---|---|
| `co_product` | `160000019` | 160000019 | ✅ |
| `qu_stock` | `7.0000` | 7 | ✅ |
| `co_product_unit` | `160000019-FAR` | FARDO | ✅ |
| `nu_batch` | `LOTEQA0805` | LOTEQA0805 | ✅ |
| `da_expiration` | `2026-08-28T04:00:00.000Z` | 28/08/2026 | ✅ |
| `ubicacion` | `exh` | Exhibición | ✅ |
| `co_enterprise` / `id_enterprise` | `1002` / `1` | CENTRAL EL PALMAR, S.A. | ✅ |

**Local (`window.sqlitePlugin`, tabla plural `client_stocks`):**
`co_client_stock=1785958714079.0` · `id_client_stock=17` (>0) · **`st_delivery=1`** · `pending_transactions` **vacío** · `failed_transactions` **0**.
Tras DM-INV-028 la fila del 2.º inventario Guardado **también desapareció de la BD local** (queda solo la del 17).

**Correlación:** Nro.Ref UI **17** = `id_client_stock` **17** (nube y local) → confirma el patrón `Ref = id_<x>`.

**Payload capturado** (`__qaH.getPayloadData()`, hook heredado, **1 sola vez, sin duplicados y con `data` completo**):
`clientstockservice/clientstock` con `quStock:7`, `nuBatch:"LOTEQA0805"`, `daExpiration:"2026-08-28T04:00:00"`, `ubicacion:"exh"`, `coEnterprise:"1002"/idEnterprise:1`, `coordenada:"11.0490607,-63.8649952"`, `daysSinceLast:1`, `daysUntilNext:1`.
⚠ El payload manda `stClientStock:0` + `stDelivery:2` — **corroborar por `id` + `st_delivery` local, NO por el `st` del payload** (reconfirma latino_cosmetica/globalmp).

**Marca final: `BD-OK`** — guardado → enviado confirmado en nube **y** en local, con 0 en cola y 0 rechazos.

**Nota sobre `st_*`:** la traducción por catálogo no se pudo hacer — `transaction_statuses` **no tiene columna `tx_status`** en esta BD (el query falla). El veredicto se sostiene en `id_client_stock>0` + `st_delivery=1` local + presencia de la fila y sus hijas en la nube, como manda RUNTIME §10.

---

## Verificación de VGs

| VG | Esperado | Observado | Veredicto |
|----|----------|-----------|-----------|
| `clientStock = true` | Módulo aplica | Módulo visible y **operable end-to-end** (Ref 17 en la nube) | ✅ Confirmada |
| **`expirationBatch = true`** | Lote y fecha de vencimiento | Campos presentes **Y OBLIGATORIOS** — ver Hallazgo A | ✅ Confirmada **a nivel de validación** |
| `requireClientStock` (⚠️VERIFICAR) | — | No se observó ningún gate adicional: el módulo abre y opera sin exigencia extra | ⓘ Sin efecto observable en UI |
| `signatureStock` | Se puede firmar, no obligatorio | **No se ofreció firma en ningún paso** del flujo (Guardar ni Enviar); el envío completó sin firma | ✅ Sin defecto (RUNTIME §5) |
| `requiredComment` (alcance COBROS) | No aplica acá | Campo Comentario presente, **no obligatorio** (Guardar/Enviar habilitaron con `txComment:null`) | ✅ Como se esperaba |
| `suggestedOrderByDispatchAndReturn = false` | DM-INV-017 N/A | Botón `botonAddAmarillo` **sí aparece** pero el modal **no trae la línea "Sugerido UNIDADES"** | ⚠ Divergencia UI-vs-config (7.ª playa) — no es hallazgo nuevo |
| `showStock=true` · `stock0` (divergencia a confirmar) | — | El árbol y las familias muestran conteos (`Azucar 8`) y los productos aparecen con o sin captura previa. **No se pudo aislar `productStock0` desde INVENTARIOS**: la lista de familia no expone el stock disponible del producto | ⓘ **Divergencia NO resuelta acá** — sigue siendo cuestión de PRODUCTOS |
| `multiCurrency = true` | — | El modal de pedido sugerido rotula `Moneda:` (vacío). Sin efecto medible en el flujo de inventario | ⓘ N/A para este módulo |
| Adjunto obligatorio | Dejar en Guardado si exige | **No exige adjunto**: el Enviar completó con `nuAttachments:0` / `hasAttachments:"false"` | ✅ No aplica |

---

## Hallazgos

### 🔴 Hallazgo A (dato solicitado) — `expirationBatch=true` **SÍ** vuelve el LOTE obligatorio en INVENTARIOS: la asimetría con DEVOLUCIONES **queda confirmada**

Prueba directa con dato vivo, en el mismo cliente, mismo build y misma corrida:

- **INVENTARIOS** (este módulo): en `inventory-type-stocks-modal` con **cantidad=7 y lote VACÍO** (fecha en su default de hoy), al pulsar Aceptar la app **rechaza** con
  `Denario Inventario / "Complete cantidad, unidad, fecha y lote para continuar."` **[OK]**, el modal **no cierra** y el producto **no queda inventariado**.
  Al llenar el lote, el mismo Aceptar cerró sin error.
- **DEVOLUCIONES** (reportado hoy, misma corrida, misma VG): con lote **y** fecha vacíos, Guardar/Enviar habilitaron igual.

⇒ **`expirationBatch` es una VG de alcance por módulo, no global**: gobierna la validación en INVENTARIOS y **no** la gobierna en DEVOLUCIONES. Es exactamente la asimetría que QA pidió confirmar, y queda confirmada con evidencia de ambos lados en la misma corrida.

Contexto histórico: esto hace de el_palmar la **2.ª playa** (tras `el_valle-20260728`) donde `expirationBatch=true` sí bloquea, con el **mismo texto de alerta**. Refuta la generalización de `[gmp-20260730]` ("en el resto los campos son opcionales con la VG en cualquier valor"): globalmp tenía la VG en true y aceptó con lote vacío. La regla de `_comunes.md` ("gobierna la VALIDACIÓN, no la VISIBILIDAD") **se sostiene acá**.

⚠ Matiz medido: **el que bloquea es el LOTE**. La **fecha** llega con default de hoy y por sí sola nunca queda vacía (`ion-datetime#expDate0` se inicializa), así que la alerta que menciona "fecha" no es alcanzable dejando la fecha en blanco desde la UI. En el 2.º inventario se aceptó con la **fecha en su default** y lote lleno, sin error.

### ⓘ Hallazgo B — `maxlength` del Comentario = **255** acá (no 120 como alipascua)

El campo Comentario del Tab General rotula `Mín. 0 - Máx. 255 caracteres` / contador `0/255`. En `alipascua-20260804` (El Yaque v1.0) se midió **120**. Mismo `app_version 1.0`/`db19`, distinto servidor ⇒ **la constante `TEXT_COMMENT_MAX_LENGTH` difiere por APK**, no es estable por versión declarada. No es defecto (el campo no es obligatorio); es un dato a no dar por fijo.

### ⓘ Hallazgo C — DM-INV-026 reproduce

El formulario Guardado reabre en tab **General** en vez de Inventario. Defecto conocido (RUNTIME §5), cosmético, **no re-marcado FAIL**. Reproduce en el_palmar ⇒ 4.ª playa consecutiva.

### ✅ Refutación confirmada — el árbol de productos NO está vacío

PEDIDOS reportó "No hay productos disponibles" culpando a `unit_pricelist`. En INVENTARIOS el árbol de nivel 1 rinde **`Alcohol 1 · Azucar 8 · PVA 30`** y la familia Azucar abre 8 productos, todos capturables. **El defecto de "estructura de nivel 1 vacía" es específico de PEDIDOS**, no un problema de datos del cliente.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **El `ion-select` de EMPRESA de INVENTARIOS: preseleccionado, SIN `formcontrolname`, con el OBJETO empresa completo como `value`** | cliente (el_palmar) — 3.ª variante del mismo build | Igual que DEVOLUCIONES y distinto de CLIENTES (`formcontrolname="idEnterprise"`, `value=null`, `ng-invalid`, obligatorio) y de PEDIDOS (preseleccionado 1002). En INVENTARIOS llega `disabled=false`, `ng-valid`, `value = {idEnterprise:1, coEnterprise:"1002", lbEnterprise:"CENTRAL EL PALMAR, S.A.", coCurrencyDefault:"USD", …}` y el shadowRoot rotula el nombre ⇒ **no requiere receta ninguna**. Confirma que **el selector de empresa varía por MÓDULO dentro del mismo build**: hay que leerlo, no predecirlo. La empresa efectiva llegó correcta (1002/id 1) en UI, payload y nube — el `enterprise_default` local apuntando a YARACUY **no se materializó** |
| **`expirationBatch=true` bloquea en INVENTARIOS y NO en DEVOLUCIONES (misma VG, misma corrida)** | universal (alcance de VG) | Ver Hallazgo A. Alerta exacta: `Denario Inventario / "Complete cantidad, unidad, fecha y lote para continuar." [OK]`. El campo que efectivamente bloquea es el **LOTE**; la fecha nunca queda vacía por su default |
| **Etiquetas de alert del módulo (leídas, no predichas)** | cliente (el_palmar) | Guardar: `[Cancelar, **Aceptar**]` → `[**OK**]` · Enviar: `[Cancelar, **Aceptar**]` → `[**OK**]` → `[**OK**]` · Validación de captura: `[**OK**]` · Borrado: `[**OK**]` (sin confirmación previa). Títulos **inconsistentes** dentro del mismo módulo: `Denario Inventario` (guardar/enviar/validación), `Denario Inventarios` (borrado, en plural), `Denario Premium` (la 3.ª de envío con la Ref) |
| **Envío = 3 alertas y la 3.ª da la Ref del servidor** | universal (5.ª confirmación) | `Inventario nro. **17** enviado exitosamente` — evita volver a la lista para obtener la Ref |
| **`ion-datetime` del modal: existe SIEMPRE con `offsetParent=null`; se abre por el `ion-datetime-button` y el Aceptar está en el shadowRoot del `ion-datetime`** | universal | El `ion-datetime-button` tiene `textContent` **vacío**: la etiqueta legible (`"5 ago 2026"`) vive en `shadowRoot > button#date-button`. Al abrirlo, el `ion-datetime` pasa a visible dentro de un `ion-modal.md` y sus botones `Cancelar`/`Aceptar` están en `dt.shadowRoot.querySelectorAll('ion-button')` (no en el DOM claro). Los `.calendar-day` exponen `data-day`/`data-month`/`data-year` — **`data-month` viene sin cero a la izquierda (`"8"`, no `"08"`)** y hay que filtrar por viewport (carrusel de 3 meses) |
| **La lista BUSCAR navega con dispatch Pointer+Mouse sobre el `ion-item` + `mouse.click` en el `ion-label`** | universal (2.ª confirmación, tras latino_cosmetica) | Reabre el Guardado en ~5 s. Desbloquea DM-INV-026 |
| **El modal de captura abre con `pg.mouse.click` SIMPLE** (sin Pointer+Mouse combinado) | universal (3.ª confirmación) | **Pero requiere `scrollIntoView({block:'center'})` + esperar ~1 s + RE-LEER el rect**: el producto objetivo llegó a `y=761` con viewport 744. Es la causa nº1 de falso BLOCKED en este módulo |
| **Searchbar de la lista BUSCAR filtra on-keyup; el modal de CLIENTES exige click en la lupa `search-circle-sharp`** | universal (5.ª confirmación) | Dos comportamientos distintos en el mismo módulo — no unificarlos |
| **`maxlength` del Comentario = 255 en esta APK** (vs 120 en alipascua) | cliente | Ver Hallazgo B — no dar la constante por fija dentro de "v1.0/db19" |
| **`transaction_statuses` de el_palmar NO tiene columna `tx_status`** | cliente (BD) | `SELECT … tx_status` → `ERR: column "tx_status" does not exist`. Descubrir el esquema antes de traducir estados; el veredicto se sostiene con `id_<x>` + `st_delivery` local |
| **`client_stock_detail_unit` (nube) NO tiene `co_unit`** | universal (BD) | La unidad viaja en **`co_product_unit`** (`160000019-FAR`). `SELECT u.co_unit` aborta el query. Columnas reales: `id/co_client_stock_detail_unit`, `co/id_client_stock_detail`, `co_product_unit`, `id_product_unit`, `ubicacion`, `qu_stock`, `da_expiration`, `nu_batch`, `co/id_enterprise`, `co_operation`, `da_update` |
| **1.er click en INVENTARIO abrió el formulario y NO hubo alerta de geolocalización** | cliente | Consistente con globalmp/alipascua y opuesto a latino_cosmetica ⇒ depende del **permiso de ubicación del device**, no del build. `userMustActivateGPS=false` y la coordenada real igual viajó en el payload (`11.0490607,-63.8649952`) |
| **Namespace propio `window.__qaI` en vez de reinstalar `__qaH`** | universal (receta) | Se registraron `alertInfo`/`alertBtn` (igualdad exacta + `width>0`), `dismissLoadings`, `rect` (con validación de viewport), `tile`, `btnByText`, `tabs`. Resolvió los 8 alerts del módulo sin un solo reintento y **sin tocar el hook de payload heredado** (que capturó el POST 1 sola vez y con `data` completo) |

---


> ✅ consolidado 2026-08-05
## Notas de automatización

- **0 cuelgues de CDP · 0 abortos de watchdog.** Módulo completo en ~13 min (techo 45 min).
- 1 solo reintento en todo el módulo, y **no fue de automatización**: el 1.er Aceptar del modal fue rechazado por la validación de lote — es el Hallazgo A, no un fallo de selector.
- `page.__qa` (conexión + watchdog + `fillNgModelKeyboard` + `confirmDatetime`) cacheado del lado Playwright; `window.__qaI` del lado página. Ninguna recarga de app en toda la corrida.
- **No se reinstaló el bundle `__qaH`** ni se tocó `__qaCaptureInstalled` ⇒ 1 POST capturado, sin duplicados.
