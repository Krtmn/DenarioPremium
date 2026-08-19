# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_092435_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA) `00001` (empresa única) |
| Usuario | johana · `co_user='003'` · `id_user=463` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` · `sqlitePlugin` disponible |
| Dispositivo | Infinix X6728 (HOT 60i) · UUID `da9f78b6e785fffc` |
| Playa | **El Yaque** — `denarioelyaque.ddns.net:8081` (obtenido del hook de payload) |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Cuelgues CDP | 0 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `/inventarios` con `app-inventario-container`; botones **INVENTARIO** y **BUSCAR** |
| DM-INV-002 | ✅ PASS | 4 tabs `General/Inventario/Resumen/Adjuntos`; solo General habilitada, cliente vacío. Abrió al **1.er click**, sin alerta de geolocalización |
| DM-INV-004 | ✅ PASS | `MP GELATO C.A. (J-504863246)` seleccionado → las 4 tabs habilitan; sucursal cargada (`CALLE 76 CON AVENIDA 3D…`) |
| DM-INV-008 | ✅ PASS | Familia `Desechable 4` → 4 productos (1.5LTS, 330ML, 5LTS, 600ML) + sub-segmentos UBICACIÓN/FILTRO |
| DM-INV-010 | ✅ PASS | `ion-modal.inventory-type-stocks-modal` abre con `mouse.click` **simple**; multi-fila (`ion-card.capture-row-card`), unidad CAJA preseleccionada, fecha default 17/08/2026 |
| DM-INV-011 | ✅ PASS | `h.fillNgModelKeyboard` en cantidad y lote; valores reflejados en el modal y persistidos (verificado en BD) |
| DM-INV-012 | ✅ PASS | `.save-btn` cierra el modal sin error; producto queda **"Inventariado: Exhibición"** |
| DM-INV-016 | ✅ PASS | Tab Resumen con columnas **Sel · Código · Producto · Exhibición · Depósito · Acción**: `1.5LTS 8 CAJA / 3 CAJA`, `330ML 5 CAJA / -` |
| DM-INV-017 | ✅ PASS | `botonAddAmarillo` presente; `inventario-sugerido-modal` con `Sugerido CAJA: 11` (1.5LTS) y `5` (330ML). **Ver nota** — es el fallback `sugerido=currentStock`, no un promedio |
| DM-INV-020 | ✅ PASS | `Días desde último Inventario: 1` · `Días para siguiente Inventario: 1` (viven en el modal de sugerido, no en Tab General) |
| DM-INV-021 | ✅ PASS | 2 alertas: `¿Desea guardar el Inventario?` [Cancelar/**Aceptar**] → `Inventario guardado con éxito` [**OK**]. Local `st_delivery=3`, `id=0` ⇒ BD-SAVED |
| DM-INV-022 | ✅ PASS | 3 alertas; la 3.ª: **`Inventario nro. 2 enviado exitosamente`** [OK] → navega al home de inventarios. Nube `id_client_stock=2`, `st_client_stock=1` ⇒ **BD-OK** |
| DM-INV-023 | ✅ PASS | Lista con Nro.Ref, cliente, estatus y fecha; trash solo en el Guardado |
| DM-INV-025 | ✅ PASS | Filtra **on-keyup**: `GELATO`→1, `ZZZZ`→0, **vaciar→2 (repuebla)** |
| DM-INV-026 | ✅ PASS | Reabre con cliente y comentario intactos, 4 tabs habilitadas. Abre en tab **General** — **defecto conocido** (RUNTIME §5), no FAIL. 2 intentos (ver Patrones) |
| DM-INV-028 | ✅ PASS | Trash **sin confirmación previa** → `Denario Inventarios` / `¡EL Inventario se borro con exito!` [OK]; lista 3→2, trash 0, y desaparece también de la BD local |

---

## Veredictos de VG (lo que pidió el orquestador)

### 🔴 `expirationBatch = true` → **SÍ EXIGE Lote y Fecha en INVENTARIOS**

Medido con el campo **vacío** (no por visibilidad del input), que es el método correcto:

- Con `cantidad=8` y **lote vacío** → la app **rechaza**:
  `Denario Inventario` / *"Complete cantidad, unidad, fecha y lote para continuar."* `[OK]`, y **el modal queda abierto**.
- Al llenar el lote (`QAINV1`), el mismo `.save-btn` cerró el modal a la primera.
- **El campo que bloquea es el LOTE**: la fecha nunca queda vacía porque el `ion-datetime` (`expDate0`) nace con **HOY** (`2026-08-17T04:00:00`).
- Confirmación independiente desde el modelo: `ng.getComponent(app-inventarios).inventariosLogicService.expirationBatch === true`.

⇒ **2.ª confirmación del alcance POR MÓDULO de esta VG dentro de la misma corrida**: en DEVOLUCIONES de grupo_fiel **no** volvió obligatorios Lote ni Fecha; en INVENTARIOS **sí**. Reproduce exactamente lo medido en `[el_palmar-20260805]` (misma alerta, mismo campo bloqueante). No extrapolar entre módulos.

### 🔴 `requiredComment = true` → **NO aplica a INVENTARIOS**

Medido con el par botones antes/después, no por el rótulo:

- Campo Comentario = `ion-input#responsable` (`placeholder="Comentario:"`), llega **`required=false`**, sin `ng-invalid`.
- Con el comentario **vacío** y las 3 capturas hechas, **`.imagenGuardar` y `.imagenEnviar` ya estaban ambos `disabled=false`**.
- Llenarlo no cambió ningún estado de botón.
- `maxlength = 255` en esta APK (vs 120 medido en alipascua) — reconfirma que **la constante no es fija dentro de "v1.0/db19"**.

⇒ **El mapa de `requiredComment` queda cerrado**: aplica **solo a COBROS**; en clientes no era dirimible, y en **devoluciones e inventarios NO aplica**.

### Otras VG observadas

| VG | Valor | Efecto real medido |
|---|---|---|
| `clientStock=true` | ✔ | Módulo operable end-to-end, registro persistido en nube |
| `suggestedOrderByDispatchAndReturn=false` | ✔ (leído del service) | El botón **igual aparece** — 9.ª playa con la divergencia UI-vs-config |
| `signatureStock=true` | — | **No exigió firma para Enviar** (habilita, no obliga — mismo criterio que `signatureVisit`, RUNTIME §5) |
| `userCanUploadFiles=true` / `quAttach=25` | — | Envío completado con `nuAttachments=0` / `hasAttachments="false"`: adjunto **no obligatorio** aquí |
| `userMustActivateGPS=true` | ✔ (service) | Coordenada real viajó en el payload (`11.049125,-63.8652383`); no hubo alerta de geolocalización |

### Pedido sugerido — **no dio 0, pero tampoco es un sugerido real**

El pronóstico del orquestador era "va a dar 0". Lo medido es más preciso: dio **`Sugerido CAJA: 11`** para 1.5LTS y **`5`** para 330ML, que es **exactamente el `currentStock` cargado** (8+3=11 y 5), con `Despacho 0`.

Es la rama vieja (`getClientAvgStock` sobre `client_avg_products`) comportándose como documentó `[difranca-20260813]`: con `average=0` → **`sugerido = currentStock`**. Como los 25 códigos de `client_avg_product` no existen en `client` (cruce 0/25), **ningún producto tiene promedio** ⇒ el número que se ve es el fallback, no un cálculo.

⇒ 🚫 **No es defecto de la app** y tampoco es "0": es `sugerido = currentStock` por **datos huérfanos**. El caso se marca PASS porque la sección renderiza con cantidades, con esta nota.

---

## Registros creados en sistema

| Ref | Epoch (`co_client_stock`) | Cliente | Líneas | Estado | Marca BD |
|-----|---------------------------|---------|--------|--------|----------|
| **2** | `1786980326244.0` | J-504863246 · MP GELATO C.A. | 3 (2 productos) | **Enviado** | **BD-OK** |
| — | `1786980xxxxx` (2.º, de prueba) | J-504863246 · MP GELATO C.A. | 1 (5LTS ×2 CAJA, lote `QAINVDEL`) | **Borrado** (DM-INV-028) | — |

Detalle del inventario **Ref 2** (comentario `inv2 QA smoke`, 0 adjuntos, `id_order=null`):

| Producto | Ubicación | Cantidad | Unidad | Lote | Vencimiento |
|---|---|---|---|---|---|
| 1.5LTS — Caja de Agua 1.5lts 6und | **exh** (Exhibición) | 8 | CAJA (`CJA-10000`) | `QAINV1` | 17/08/2026 |
| 1.5LTS — Caja de Agua 1.5lts 6und | **dep** (Depósito) | 3 | CAJA (`CJA-10000`) | `QAINV3` | 17/08/2026 |
| 330ML — Caja de Agua 330ml 24und | **exh** (Exhibición) | 5 | CAJA (`CJA-10001`) | `QAINV2` | 17/08/2026 |

---

## Verificación BD

**Baseline (inicio):** `client_stock` → `count=1`, `max(id_client_stock)=1`.

**Nube (tras Enviar, sync INMEDIATA):**

```
id_client_stock=2 · co_client_stock=1786980326244.0 · co_client=J-504863246
tx_comment='inv2 QA smoke' · st_client_stock=1 (Enviado) · co_enterprise='00001'
id_order=NULL · det=2 · units=3
```

Estructura idéntica al Ref 1 de referencia (2 detalles / 3 unidades). El diff de baseline devolvió **exactamente 1 fila nueva** — cero misses, cero duplicados.

**Cotejo campo-a-campo de las hijas en la nube — 3/3 líneas exactas ⇒ `BD-FIELD-OK`:**

| `co_product` | `co_product_unit` | `qu_stock` | `ubicacion` | `nu_batch` | `da_expiration` |
|---|---|---|---|---|---|
| 1.5LTS | CJA-10000 | 3.0000 | dep | QAINV3 | 2026-08-17 |
| 1.5LTS | CJA-10000 | 8.0000 | exh | QAINV1 | 2026-08-17 |
| 330ML | CJA-10001 | 5.0000 | exh | QAINV2 | 2026-08-17 |

**Local (`window.sqlitePlugin`, `sqlite3` inoperante como es esperable en este build):**

- Tras Guardar: `id_client_stock=0`, `st_delivery=3` ⇒ **BD-SAVED**.
- Tras Enviar: `id_client_stock=2`, `st_delivery=1`, `pending_transactions(clientStock)=0`, `failed_transactions(clientStock)=0` ⇒ **BD-OK**.
- Tras el borrado (DM-INV-028): la fila del 2.º inventario **desapareció** de `client_stocks` (quedan solo id 2 y id 1).

**Payload:** `clientstockservice/clientstock` capturado **1 sola vez y con body completo** (sin duplicados) → volcado a `_payloads.jsonl`. Trae las 3 unidades con `ubicacion` exh/dep, `nuBatch` y `daExpiration`. ⚠ El payload manda `stClientStock=0` + `stDelivery=2`: **corroborar por `id` + `st_delivery` local**, nunca por el `st` del payload (reconfirma latino_cosmetica/globalmp).

**Conclusión guardado→enviado:** ✅ confirmado. Lo que se guardó se envió, íntegro y sin duplicar.

**Oráculo de persistencia (RUNTIME §9) — round-trip Guardar→reabrir:** ✅ **PASS exacto**. Tras reabrir desde BUSCAR, el Resumen mostró `1.5LTS 8 CAJA / 3 CAJA` y `330ML 5 CAJA / -`, y las 3 filas de `client_stocks_details_units` conservaron producto, ubicación, cantidad, lote y fecha 1:1. **Las dos líneas del mismo producto (1.5LTS en `exh` y en `dep`) no se fusionaron ni se pisaron**: comparten `co_client_stock_detail` pero son unidades distintas, y el ítem de lista rotula `Inventariado: Exhibición / Depósito`.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **La lista BUSCAR no reabre por click real en este build; sí por `beforeOpenStock(getOriginalIndex(item))`** | universal (candidato) | El dispatch Pointer+Mouse + `mouse.click` en el `ion-label` **no navegó en 2 intentos**, sin interceptores (0 loadings, 0 modales, `elementFromPoint` cayendo dentro del `ion-item`). Contrasta con `[latino_cosmetica-20260729]`/`[el_palmar-20260805]`. Vía que sí funciona con `window.ng=true`: `c.beforeOpenStock(c.getOriginalIndex(item))` + `ng.applyChanges`. |
| 🔴 **`getOriginalIndex(item)` recibe el ITEM, NO el índice** | universal | Firma real: `getOriginalIndex(item){ return this.inventariosLogicService.itemListClientStocks.findIndex(s => s.coClientStock === item.coClientStock) }`. Pasarle un número devuelve **-1** → `beforeOpenStock(-1)` revienta con `Cannot read properties of undefined (reading 'stDelivery')`. Costó 2 llamadas y **casi se reporta como defecto de la app**: no lo es. Leer `String(comp.metodo)` antes de invocar cualquier método de componente. |
| ✅ **Oráculo DIRECTO de VGs del módulo: `inventariosLogicService`** | universal | `ng.getComponent(document.querySelector('app-inventarios')).inventariosLogicService` expone **`expirationBatch`, `suggestedOrderByDispatchAndReturn`, `userMustActivateGPS`, `disabledEnterprise`, `stockValid/ToSave/ToSend`, `cannotSendClientStock`, `disableSaveButton`** como valores planos. Cierra el gap de `[el_palmar-20260805]` ("`localStorage` no sirve para ninguna VG"): para inventarios **hay fuente barata en el componente**, sin abrir la nube. |
| ⚠ **`PRD-BUSCADOR-NO-REPUEBLA` NO aplica a la lista BUSCAR de INVENTARIOS** | cliente/build | Medido: `GELATO`→1, `ZZZZ`→0, **vaciar→2 (repuebla solo)**. Filtra **on-keyup** (sin lupa). Coincide con lo ya medido en pedidos y devoluciones de este build. |
| ⚠ **El buscador del modal de clientes SÍ tiene `placeholder="Clientes..."` en grupo_fiel** | cliente | `#clienteSelectModal input.search-input.inputsSearch` tiene placeholder, a diferencia de `[difranca-20260813]` donde era `null`. **La clase `input.search-input.inputsSearch` sirve en ambos** ⇒ usar la clase, no el placeholder. Sigue exigiendo **click en la lupa `search-circle-sharp`** (7.ª confirmación). |
| ✅ **Oráculo de build v21 confirmado en El Yaque** | universal | `ion-modal input[placeholder="Ingrese cantidad"]` con **`min="0"`** ⇒ la APK trae la v21 (`0a654f43`). Modal multi-fila con `ion-card.capture-row-card`, `.add-lot-button` y `.save-btn`. Reconfirma `[difranca-20260813]` en otro cliente de la misma playa. |
| ✅ **Tab Resumen con columnas por UBICACIÓN** | universal | Cabecera real: `Sel · Código · Producto · **Exhibición** · **Depósito** · Acción`, una fila por producto y las cantidades en su columna (`-` si no hay). Es el **oráculo visual barato** de que el mismo producto en dos ubicaciones no se fusiona — sin abrir ningún modal. |
| ✅ **Mismo producto en 2 ubicaciones: el modal abre VACÍO en la 2.ª** | universal | Al cambiar a `Depósito` y reabrir 1.5LTS (ya inventariado en `exh`), el modal llegó con cantidad y lote **vacíos**, no arrastró la captura previa; el ítem pasa a rotular `Inventariado: Exhibición / Depósito`. Comportamiento correcto. |
| ⚠ **Etiquetas de alert medidas en este módulo** | cliente | Guardar `[Cancelar, **Aceptar**]` → `[**OK**]` · Enviar `[Cancelar, **Aceptar**]` → `[**OK**]` → `[**OK**]` · Validación de captura `[**OK**]` · Borrado `[**OK**]` sin confirmación previa. Títulos inconsistentes: `Denario Inventario` (guardar/enviar/validación) · `Denario Inventarios` (borrado, **plural**) · `Denario Premium` (la 3.ª de envío). Idéntico reparto a `[el_palmar-20260805]`. |
| ✅ **Envío = 3 alertas, la 3.ª da la Ref** | universal | **6.ª confirmación** (`Inventario nro. 2 enviado exitosamente`) — evita volver a la lista para obtener la Ref. |
| ✅ **El selector de empresa de INVENTARIOS: sin `formcontrolname`, `value` OBJETO, y acá además `disabled=true`** | cliente | Con 1 sola empresa llega `disabled=true` + objeto + `ng-valid` ⇒ **no tocar nada**; el envío viajó con `idEnterprise:1`/`coEnterprise:"00001"` correctos. Amplía la fila DEVOLUCIONES·INVENTARIOS·DEPÓSITOS·VISITAS de la tabla de variantes (allí venía habilitado). |
| ⚠ **Guardar habilita con el formulario casi vacío** | cliente | Con **solo el cliente** seleccionado y **cero capturas**, `.imagenGuardar` ya está `disabled=false` (Enviar también, una vez hay líneas). Se puede guardar un inventario sin productos — anotar, no se levantó como FAIL porque ningún caso del smoke lo cubre. |
| ⚠ **`na_product` NO existe en `client_stock_detail` de la nube** | universal | Un `SELECT d.na_product` aborta el query (`column does not exist`); el nombre del producto **solo** vive en la tabla local `client_stocks_details`. Hermano del `co_unit` de `[el_palmar-20260805]`. |
| ✅ **Namespace `__qaINV` (3 letras)** | universal | Aplicada la regla de `[grupo_fiel-20260817]`: `__qaI` habría sido riesgoso. Instalado limpio, y el hook de payload heredado (con guarda `__qaDataHook`) capturó **1 POST con body y 0 duplicados** — no se reinstaló nada. |

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Hallazgos

**Ninguno.** 0 FAIL. El único comportamiento anómalo observado (formulario Guardado que abre en tab *General* en vez de *Inventario*, DM-INV-026) es **defecto conocido** ya catalogado en RUNTIME §5, cosmético.

Dos observaciones para desarrollo, ninguna bloqueante:

1. **Reapertura de la lista BUSCAR por click real** no navegó en este build (sí por método de componente). Vale confirmarlo manualmente: si con el dedo tampoco abre, es un defecto real de UX; si abre, es limitación de CDP. **No se marcó FAIL** porque el caso quedó verificado por la vía Angular y el formulario cargó íntegro.
2. **Se puede Guardar un inventario sin ninguna línea capturada** (Guardar habilita con solo el cliente).

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

**Payloads en `_payloads.jsonl`:** 4 totales, **1 de inventarios** (endpoint `clientstockservice/clientstock`).
No hay payload del inventario borrado (DM-INV-028, lote `QAINVDEL`).

| co_x | Marca (motor) | **Marca (verificada)** | Campos cabecera | Hijas (payload/nube) | Mismatches reales | Notas |
|---|---|---|---|---|---|---|
| `1786980326244.0` (Ref 2) | BD-FIELD-MISMATCH | **BD-FIELD-OK** | 16/16 OK | `client_stock_detail` 2/2 · `client_stock_detail_unit` **3/3** | **0** | 2 mismatches del motor son **falso positivo** (ver abajo) · hora UTC-4/UTC (nota) |

### 🔴 Veredicto explícito — las 3 líneas NO se fusionaron

Verificación independiente por **clave única** (`query.js` directo sobre `client_stock_detail_unit`, filtrando por
`co_client_stock_detail_unit`, que es la PK real del payload):

| `co_client_stock_detail_unit` | `co_product_unit` | `qu_stock` | ubicación | `nu_batch` | vs payload |
|---|---|---|---|---|---|
| 1786980434788.1 | CJA-10000 | 8.0000 | **exh** | QAINV1 | ✅ exacto |
| 1786980496658.1 | CJA-10000 | 3.0000 | **dep** | QAINV3 | ✅ exacto |
| 1786980461980.1 | CJA-10001 | 5.0000 | **exh** | QAINV2 | ✅ exacto |

**El mismo producto (1.5LTS) en dos ubicaciones llegó a la nube en dos filas propias, sin sumarse ni colapsarse.**
Confirmado por dos vías independientes (motor + consulta directa), y coincide con lo que el agente UI ya había
verificado en UI, BD local y payload.

**Cabecera (16/16 OK):** `co_client_stock, id_user, co_user, id_client, co_client, id_address_client,
co_address_client, coordenada, tx_comment, id_enterprise, co_enterprise, da_client_stock` (hora: nota)`,
nu_attachments, has_attachments, days_since_last, days_until_next`.

**`client_stock_detail` (2/2 OK):** 1.5LTS (`1786980434787.0`) y 330ML (`1786980461980.0`).

**Baseline:** `client_stock` 1 → 2 filas · `max(id_client_stock)` 1 → 2 ⇒ **+1 exacto**.
`count(*) = count(DISTINCT co_client_stock) = 2` ⇒ **0 duplicados**.
El `id_client_stock=1` es el inventario que la QA cargó a mano hoy — esperado, ajeno a este payload.

**Inventario borrado (DM-INV-028, `QAINVDEL`):** sin payload capturado y **sin fila** en
`client_stock_detail_unit` (confirmado por `query.js`) ⇒ consistente con que se borró antes de Enviar.
**No es mismatch.**

### 🔧 Notas de calibración — una es un BUG DE LA HERRAMIENTA, no del producto

1. ✅ **El motor SÍ llega a la tabla nieta `client_stock_detail_unit`** (no se queda en `client_stock_detail`) —
   queda descartada la duda que se había planteado.
2. 🔴 **BUG DE EMPAREJAMIENTO en `cotejo-payload.js`:** dentro de `client_stock_detail_unit`, el motor correlaciona
   las líneas payload↔nube por **`co_product_unit`, que NO es único** cuando el mismo producto aparece en 2+
   ubicaciones (mismo `coProductUnit`, distinto `ubicacion`/`nuBatch`). Resultado: emparejó la línea 1 del payload
   contra la fila de la línea 2 en la nube, y marcó la línea 2 como "sin contraparte" ⇒ **2 mismatches falsos**.
   Lo que el motor "detectó":
   | Campo | Payload | Nube (fila mal apareada) |
   |---|---|---|
   | `co_client_stock_detail_unit` | 1786980434788.1 | 1786980496658.1 |
   | `qu_stock` | 8 | 3.0000 |
   | ubicación | exh | dep |
   | `nu_batch` | QAINV1 | QAINV3 |
   **Corrección recomendada:** cambiar la clave de emparejamiento de esta tabla a **`co_client_stock_detail_unit`**
   (la PK real, ya presente en ambos lados) o, en su defecto, al compuesto
   `co_product_unit + ubicacion + nu_batch`.
   ⚠ **Importancia:** cualquier cliente que inventaríe el mismo producto en depósito y exhibición va a producir
   este falso `BD-FIELD-MISMATCH`. Es el escenario **normal** del módulo, no un borde.
3. Diferencias de hora en `da_client_stock` y `da_expiration` (local UTC-4 vs nube UTC) → **nota**, no mismatch.

**Conteo por marca:** BD-FIELD-OK 1 (verificado) · BD-FIELD-MISMATCH 0 real · BD-SAVED 0 · BD-N/A 0.
