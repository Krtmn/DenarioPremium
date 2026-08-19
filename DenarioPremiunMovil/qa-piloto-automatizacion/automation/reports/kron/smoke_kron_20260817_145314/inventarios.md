# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | INVENTARIOS |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, `id_enterprise` 1) |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — appVersion **1.0** / dbVersion **19** · `window.ng=true` |
| Playa | **ISLA COCHE** — `denarioislacoche.ddns.net:8081` (confirmado por el host del POST) |
| Vendedora | `scarlet` · `id_user` 309 · `co_user` `VE0002` |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Cuelgues CDP | 0 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | `/inventarios` → `app-inventarios` con botones **INVENTARIO** y **BUSCAR** |
| DM-INV-002 | ✅ PASS | 4 tabs `General/Inventario/Resumen/Adjuntos`; Inventario/Resumen/Adjuntos **disabled**, cliente vacío, Guardar y Enviar `disabled=true`. **1.er click abrió el form, sin alerta de geolocalización** |
| DM-INV-004 | ✅ PASS | Cliente `MINIMARKET BICENTENARIA CCS, C.A. (J504480975)` → las 4 tabs habilitan; sucursal `idAddressClient=68305` cargada |
| DM-INV-008 | ✅ PASS | Tab Inventario: 9 familias con contador (GRAGEADOS 32); dentro de la familia, 32 productos + sub-segmentos UBICACIÓN/FILTRO |
| DM-INV-010 | ✅ PASS | `ion-modal.inventory-type-stocks-modal` abre con `pg.mouse.click` **simple** (tras `scrollIntoView`+re-leer rect). 1 `ion-card.capture-row-card`, `.save-btn`, `.add-lot-button` |
| DM-INV-011 | ✅ PASS | `h.fillNgModelKeyboard` en cantidad, lote y fecha. Valores reflejados en el modal (7 / QAK1 / 17 ago 2026) |
| DM-INV-012 | ✅ PASS | `.save-btn` cierra el modal sin error con datos válidos; el ítem rotula `Inventariado: Exhibición` |
| DM-INV-016 | ✅ PASS | Tab Resumen: cabecera `Sel · Código · Producto · Exhibición · Depósito · Acción`; 2 filas con 7 BULTO / 3 BULTO y 5 BULTO / − |
| DM-INV-017 | ✅ PASS | `ion-button.botonAddAmarillo` presente; `inventario-sugerido-modal` rotula `Sugerido BULTO: 10` y `Sugerido BULTO: 5`. Cerrado con `dismiss(null,'cancel')` — **no se creó pedido** |
| DM-INV-020 | ✅ PASS | `Dias desde último inventario: 1` / `Dias hasta siguiente inventario: 1` — viven en el modal de sugerido, no en Tab General |
| DM-INV-021 | ✅ PASS | `Denario Inventario` / `¿Desea guardar el Inventario?` [Cancelar/**Aceptar**] → `Inventario guardado con éxito` [**OK**]. Guardar **no** navega fuera del form |
| DM-INV-022 | ✅ PASS | **3 alertas**; la 3.ª (`Denario Premium`) da la Ref: `Inventario nro. **3** enviado exitosamente`. Navega al home de inventarios |
| DM-INV-023 | ✅ PASS | Lista con `Nro. Ref.` / Cliente / Estatus / Fecha; 3 ítems (Ref 0 Guardado, Ref 3 Enviado, Ref 2 Enviado) |
| DM-INV-025 | ✅ PASS | Filtra **on-keyup** y **repuebla solo**: `MINIMARKET`→1 · `ZZZZ`→0 · vacío→2 |
| DM-INV-026 | ✅ PASS | Reabre el Guardado en ~5 s. **Defecto conocido reconfirmado: abre en tab General** (cosmético, no FAIL) |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` **sin confirmación previa** → `Denario Inventarios` / `¡EL Inventario se borro con exito!` [OK]; la lista pasa de 3 a 2 ítems |

---

## Registros creados en sistema

| Ref | Epoch (`co_client_stock`) | Cliente | Líneas | Estado |
|-----|--------------------------|---------|--------|--------|
| **3** | `1786998592656.0` | `J504480975` MINIMARKET BICENTENARIA CCS, C.A. | 3 líneas / 2 productos | **Enviado** · `st_client_stock=1` · **BD-OK** |
| (0) | — | `J504480975` MINIMARKET BICENTENARIA CCS, C.A. | 0 (cabecera sin capturas) | Guardado → **borrado** en DM-INV-028 (no llegó a la nube) |

**Detalle del inventario Ref 3** (comentario `invQA kron`):

| Lote | Producto | `co_product_unit` | Ubicación | Cantidad |
|---|---|---|---|---|
| QAK1 | 51104106 BALLS BLANCO 10X1KG | 51104106BUL | **exh** | 7 BULTO |
| QAK2 | 51104106 BALLS BLANCO 10X1KG | 51104106BUL | **dep** | 3 BULTO |
| QAK3 | 51104107 BALLS FRESA 10X1KG | 51104107BUL | **exh** | 5 BULTO |

Vencimiento de las 3 líneas: **2026-08-17** (default del `ion-datetime`, HOY).

---

## Oráculo de persistencia (RUNTIME §9)

Round-trip **Guardar → BUSCAR → reabrir**, comparación 1:1 de cada línea:

| Campo | Guardado | Reabierto | Veredicto |
|---|---|---|---|
| Cliente | MINIMARKET BICENTENARIA CCS, (J504480975) | idem | ✅ |
| Comentario | `invQA kron` | `invQA kron` | ✅ |
| 51104106 · exh | 7 BULTO · QAK1 · 17/08/2026 | 7 · QAK1 · 17 ago 2026 | ✅ |
| 51104106 · dep | 3 BULTO · QAK2 · 17/08/2026 | 3 BULTO en columna Depósito del Resumen | ✅ |
| 51104107 · exh | 5 BULTO · QAK3 · 17/08/2026 | 5 BULTO en columna Exhibición | ✅ |

🟢 **No-fusión verificada en las tres capas.** El ítem rotula `Inventariado: Exhibición / Depósito`; el Tab Resumen mantiene las dos ubicaciones en **columnas separadas**; y al reabrir el modal de 51104106 desde el segmento *Exhibición* muestra **1 sola fila** (`rows:1`) con la captura de `exh` — **no arrastra ni pisa** la de `dep`.

---

## Verificación BD

**Baseline** (inicio del módulo): `client_stock` = **2 filas**, `max(id_client_stock)` = **2**.

### Nube (Postgres Isla Coche)

```
id_client_stock=3 · co_client_stock=1786998592656.0 · co_client=J504480975
st_client_stock=1 (Enviado) · tx_comment='invQA kron' · id_order=NULL
co_enterprise=KRON_ADM · co_user=VE0002 · det=2 · units=3
```

Cotejo **línea a línea** de `client_stock_detail` × `client_stock_detail_unit` — **3/3 exacto**:

| `id_client_stock_detail` | `co_product` | `co_product_unit` | `ubicacion` | `qu_stock` | `nu_batch` | `da_expiration` | `co_operation` |
|---|---|---|---|---|---|---|---|
| 4 | 51104106 | 51104106BUL | `exh` | 7.0000 | QAK1 | 2026-08-17 | `I` |
| 4 | 51104106 | 51104106BUL | `dep` | 3.0000 | QAK2 | 2026-08-17 | `I` |
| 5 | 51104107 | 51104107BUL | `exh` | 5.0000 | QAK3 | 2026-08-17 | `I` |

🔑 **Las dos líneas del mismo producto comparten `id_client_stock_detail=4` pero son dos filas distintas de `client_stock_detail_unit`.** Es exactamente el grano de la referencia de la QA (Ref 2): el detalle agrupa por producto, la unidad discrimina lote+ubicación. **No hubo fusión ni pisado.**

### Local (SQLite del device, vía `window.sqlitePlugin`)

```
client_stocks: co_client_stock=1786998592656.0 · id_client_stock=3 · st_delivery=1 · tx_comment='invQA kron'
pending_transactions  WHERE type='clientStock' → 0
failed_transactions   WHERE type='clientStock' → 0
```

### Payload capturado

POST `http://denarioislacoche.ddns.net:8081/PremiumWS/services/clientstockservice/clientstock` — **1 sola vez, con `data` completo** (0 duplicados). `clientStockDetails` = 2 productos, con 2 y 1 `clientStockDetailUnits` respectivamente; `nuBatch`/`daExpiration`/`ubicacion` presentes en las 3.

### Conclusión guardado→enviado

**`BD-OK`** — lo que se guardó se envió: cabecera + 2 detalles + 3 unidades en la nube, `st_delivery=1` en local, ambas colas en 0, POST único. El inventario Guardado sin capturas (Ref 0) fue borrado en DM-INV-028 y **nunca llegó a la nube** (`max(id_client_stock)` sigue en 3), que es lo correcto.

---

## Veredictos solicitados

### 🔴 `expirationBatch=true` — **SÍ EXIGE LOTE en kron (INVENTARIOS)**

Medido con el campo **vacío**, no por visibilidad. Con `cantidad=7` y **lote vacío**, `.save-btn` rechaza:

> **`Inventario`** — *"Complete cantidad, unidad, fecha y lote para continuar."* `[OK]`

y el modal **queda abierto**. Al completar el lote (`QAK1`), el mismo `.save-btn` cerró el modal sin error.

- **El bloqueante es el LOTE**: la fecha nunca falta — el `ion-datetime` nace poblado en **HOY** (`17 ago 2026`) y la unidad viene preseleccionada (`BULTO` / `51104106BUL`).
- Esto **cierra el pendiente del perfil de kron** y es la **3.ª confirmación consecutiva** del alcance **por módulo** de esta VG (`el_palmar-20260805`, `grupo_fiel-20260817`, `kron-20260817`): en **DEVOLUCIONES** de esta misma corrida **no** exigió lote ni vencimiento, en **INVENTARIOS sí**.
- ⚠ **Matiz de etiqueta:** el título de la alerta acá es **`Inventario`** a secas, mientras en el_palmar/grupo_fiel era `Denario Inventario`. Los títulos de guardar/enviar/borrado sí traen el prefijo `Denario`. La inconsistencia de títulos dentro del módulo se amplía.

### 🟢 Pedido sugerido — **funciona, cae al fallback `sugerido = currentStock`, NO es defecto**

El botón `botonAddAmarillo` aparece y el `inventario-sugerido-modal` **sí rotula la línea Sugerido**:

| Producto | Sugerido | Inv. Actual | Despacho |
|---|---|---|---|
| 51104106 BALLS BLANCO 10X1KG | **BULTO: 10** | 10 | 0 |
| 51104107 BALLS FRESA 10X1KG | **BULTO: 5** | 5 | 0 |

- `client_avg_product` en kron tiene **0 filas** (reverificado en BD durante este módulo) ⇒ `average=0` ⇒ la rama vieja (`suggestedOrderByDispatchAndReturn=false`) aplica el fallback **`sugerido = currentStock`**. El resultado **no es 0** y **no es FAIL**: es el fallback documentado en `[difranca-20260813]`/`[grupo_fiel-20260817]`, ahora con el agravante de que kron **no tiene ni datos huérfanos**.
- 🔑 **Hallazgo nuevo:** el `Inv. Actual` del sugerido para 51104106 es **10 = 7 (exh) + 3 (dep)** ⇒ **el sugerido SUMA las ubicaciones**, aunque el inventario las mantenga separadas. Coherente, pero conviene dejarlo asentado.
- El modal se cerró con `dismiss(null,'cancel')`; **su ACEPTAR crea un PEDIDO** — no se creó ninguno (`id_order` del inventario quedó `NULL`).

---

## Otras VGs medidas

| VG | Valor esperado | Medido en UI/payload |
|---|---|---|
| `clientStock=true` | módulo aplica | ✅ operable end-to-end |
| `requiredComment=false` | comentario opcional | ✅ `ion-input#responsable` `required=false`; Guardar/Enviar habilitan con el campo vacío. **`maxlength=255`** |
| `signatureStock=true` | pide firma | ⚠ **NO exigió firma para Enviar** — el envío completó con `nuAttachments=0` / `hasAttachments="false"`. Reconfirma `[grupo_fiel-20260817]`: la VG *habilita*, no *obliga* |
| `userCanUploadFiles=true` / `quAttach=25` | adjuntos | 🚫 no probado — **instrucción de QA: no adjuntar nada** |
| `suggestedOrder=true` + `suggestedOrderByDispatchAndReturn=false` | algoritmo viejo | ✅ ver veredicto arriba |

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`expirationBatch=true` exige LOTE en INVENTARIOS — 3.ª confirmación del alcance POR MÓDULO** | universal | Alerta `Inventario` / *"Complete cantidad, unidad, fecha y lote para continuar."* `[OK]` con el lote vacío; la fecha nace en HOY. En DEVOLUCIONES de la misma corrida no exige nada. Con `el_palmar`+`grupo_fiel` son 3 clientes / 2 servidores ⇒ **listo para graduar a `RUNTIME.md`**: la VG se mide **por módulo y con el campo vacío**, nunca por la existencia del input |
| ⚠ **El título de la alerta de validación pierde el prefijo `Denario` en este tenant** | cliente (kron) | Acá es `Inventario`; en el_palmar/grupo_fiel era `Denario Inventario`. Guardar/Enviar sí usan `Denario Inventario`, el borrado `Denario Inventarios` (plural) y la 3.ª de envío `Denario Premium`. **No matchear títulos de alert por igualdad** — leer el `.alert-message` |
| 🔑 **La variante del selector de EMPRESA cambia POR MÓDULO dentro del mismo tenant** | universal | En **CLIENTES** de kron llega `disabled=true` auto-asignado; en **INVENTARIOS** llega **`disabled=false`**, con el **objeto empresa completo** como `value` (`{coEnterprise:'KRON_ADM',…}`), **sin `formcontrolname`** y `ng-valid` ⇒ **no requiere receta**. Amplía la tabla de 4 variantes: el discriminador no es solo (build, nº de empresas) sino también **el módulo** |
| 🔑 **El "Inv. Actual" del pedido sugerido SUMA las ubicaciones** | universal | 51104106 con 7 en `exh` + 3 en `dep` → el `inventario-sugerido-modal` reporta `Inv. Actual 10`. El inventario las mantiene separadas; el sugerido las consolida |
| ✅ **Anclar el cliente por `co_client` resuelve los homónimos** | cliente (kron) | Tres clientes se llaman *MINIMARKET BICENTENARIA CCS*; tecleando `J504480975` en `#clienteSelectModal input.search-input.inputsSearch` + lupa el modal devuelve **1 solo ítem**. Nunca filtrar por nombre en este tenant |
| ⚠ **El modal de clientes exige la lupa; los otros dos buscadores del módulo filtran on-keyup** | universal (8.ª confirmación) | `#clienteSelectModal` NO filtra al teclear (30 ítems antes y después del keyup) — requiere `ion-icon[name="search-circle-sharp"]`. En cambio **`input[placeholder="Búsqueda de productos"]`** (Tab Inventario) **y** el `ion-searchbar` de la lista BUSCAR **sí filtran on-keyup**. Son **tres** comportamientos en el mismo módulo: no unificarlos |
| ✅ **La lista BUSCAR SÍ reabre por click real en este tenant** | universal | Dispatch Pointer+Mouse sobre el `ion-item` + `pg.mouse.click` en el centro del `ion-label` abrió el Guardado en ~5 s, a la primera. **Contradice `[grupo_fiel-20260817]`** (que necesitó `beforeOpenStock` por componente) y reconfirma `[latino_cosmetica-20260729]`/`[el_palmar-20260805]`. ⚠ **`app-inventarios` de kron NO expone `beforeOpenStock` ni `getOriginalIndex`** ⇒ esa vía **no** es un fallback disponible acá: probar el click real primero |
| ✅ **Oráculo de build v21 (`min="0"` en cantidad) confirmado en Isla Coche** | universal | Modal multi-fila `ion-card.capture-row-card` + `.add-lot-button` + `.save-btn`; unidad preseleccionada y fecha=HOY; solo cantidad y lote nacen vacíos. 3.ª playa (difranca El Yaque, grupo_fiel El Yaque, kron Isla Coche) |
| ⚠ **`coordenada` viajó VACÍA** | cliente (kron) | El payload envió `"coordenada":""`, a diferencia de `[el_palmar-20260805]`/`[alipascua-20260804]` donde llegó el GPS real. No apareció alerta de geolocalización y el 1.er click abrió el form ⇒ consistente con "depende del permiso de ubicación del device". **Observación, no defecto** |
| ⚠ **Guardar habilita con el formulario casi vacío** | universal (2.ª confirmación) | Con solo el cliente y **cero capturas**, `.imagenGuardar` está `disabled=false` y el guardado se completa (se usó para fabricar el Guardado de DM-INV-028). `.imagenEnviar` en cambio permanece `disabled=true` hasta que hay al menos una captura. Reconfirma `[grupo_fiel-20260817]` |
| ⚠ **`st_delivery=NULL` en las cabeceras bajadas del servidor** | universal | El Ref 2 (cargado por la QA en la web) llega a `client_stocks` local con `st_delivery=NULL`; solo el creado en el device trae `1`. Reconfirma `[gmp-20260730]` |

> ✅ consolidado 2026-08-17

---

## Hallazgos

**Ninguno.** 0 FAIL. El único defecto observado es el conocido **DM-INV-026** (el formulario Guardado abre en tab *General* en lugar de *Inventario*), cosmético y ya registrado — no se re-marca FAIL.

Observaciones sin severidad, todas anotadas arriba: `coordenada` vacía en el payload, `signatureStock=true` que no obliga a firmar, y la inconsistencia de títulos de alerta dentro del módulo.

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786998592656.0` (Ref 3) | **BD-FIELD-OK** | **15/15 OK** | `client_stock_detail` 2/2 · `client_stock_detail_unit` **3/3** | **0** | 4 (zona horaria) |

**Las 3 líneas de unidad — todas OK, sin fusión:**

| `co_client_stock_detail_unit` | Producto | Ubicación | Cantidad | Lote | Vencimiento |
|---|---|---|---|---|---|
| `1786998700691.1` | 51104106 | **exh** | 7 / `7.0000` | QAK1 | 2026-08-17 |
| `1786998754416.1` | 51104106 | **dep** | 3 / `3.0000` | QAK2 | 2026-08-17 |
| `1786998767188.1` | 51104107 | **exh** | 5 / `5.0000` | QAK3 | 2026-08-17 |

### 🔑 Veredictos explícitos

1. **¿Las 3 líneas llegaron sin fusionarse? SÍ.** Las dos del producto 51104106 comparten
   `co_client_stock_detail` pero son **filas independientes** con `co_client_stock_detail_unit` distintos, y
   **las cantidades se preservan por separado**: no hay suma a 10 ni colapso a una fila.
2. 🔧 **¿Funcionó la corrección del emparejamiento? SÍ — y este es su PRIMER CASO REAL.**
   El producto 51104106 en dos ubicaciones comparte `co_product_unit = 51104106BUL` (**no único**), que es
   exactamente el escenario que antes rompía. Con la clave corregida (`co_client_stock_detail_unit`, la PK de
   negocio) el motor emparejó cada línea contra su fila correcta ⇒ **0 mismatches falsos**.
   *(Antes de la corrección de hoy, este inventario habría producido 2 diferencias inexistentes.)*
3. **Calibración del config `clientStock` para kron:** **ningún ajuste** — igual que en los 3 módulos previos.

### Notas

- Las 4 notas de "hora difiere" son **exclusivamente zona horaria** (local UTC-4 vs nube UTC) — esperado por §10.b.
- `coordenada` **no entró en el cotejo** porque viajó **vacía** en el payload (regla payload-driven: campo vacío
  en local → se saltea), consistente con lo observado por el agente UI.
- `DM-INV-028` (Guardado y borrado antes de Enviar) **no aparece** en `_payloads.jsonl` ⇒ nunca se generó
  payload. Ausencia esperada, no es mismatch.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.
