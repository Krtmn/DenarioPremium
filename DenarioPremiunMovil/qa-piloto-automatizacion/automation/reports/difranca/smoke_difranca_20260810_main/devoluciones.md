# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `smoke_difranca_20260810_main` |
| Módulo | DEVOLUCIONES |
| Build | `main` · commit `99b138fa` · app v1.0 / db19 · `window.ng=TRUE` · `sqlitePlugin` disponible |
| Playa / tenant | EL YAQUE · difranca |
| Empresa | **DDHP_A12 (id 2)** — preseleccionada por la app, no hubo que tocarla |
| Cliente de prueba | CAR755 — MULTIDISTRIBUIDORA JAKE, C.A |
| Resultado | **15 PASS · 1 FAIL · 0 BLOCKED · 2 N/A** |
| Registros creados | **Ref 879** (Enviada, 2 adjuntos) + 1 Guardada (creada y eliminada en el caso DM-DEV-024) |
| Baseline `return` | 795 → **796** (exactamente +1, el nuestro) |
| Dispositivo al cerrar | **HOME** ✅ |

> ⚠ El módulo arrancó con una espera: al conectar, el dispositivo estaba en `app-inventarios` y el
> agente de INVENTARIOS **seguía conduciéndolo** (se midió movimiento del DOM en 3 muestras a 30 s).
> No se pisó. Se esperó hasta que `inventarios.md` quedó escrito (15:35) y el dispositivo volvió a HOME.

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Tile Devoluciones → botones `DEVOLUCIÓN` y `BUSCAR` visibles |
| DM-DEV-002 | ✅ PASS | Form abre con tabs `Productos`/`Adjuntos` **disabled** y sin cliente; Guardar/Enviar `disabled` |
| DM-DEV-004 | ✅ PASS | CAR755 fijado al **1.er intento** (`hasClient=true`, `cliente.coClient='CAR755'`); las 3 tabs habilitan |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valor y llegan al modelo (`newReturn.naResponsible`, `nuSeal`, `txComment`); Tipo = `Calidad(60)` default |
| DM-DEV-011 | 🚫 N/A | `returnLogic.validateReturn=false` **leído en el modelo** y `ion-input#invoiceSelect` ausente ⇒ no hay selector de factura que probar |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familias → BBK → `ACBA300U` agregado; acordeón creado |
| DM-DEV-014 | ✅ PASS | `Cantidad Devuelta=2` ⇒ **Guardar y Enviar habilitan en el mismo tick** |
| DM-DEV-015 | ✅ PASS | 3 acordeones: `images` · `file` (`userCanUploadFiles=true`) · `sign` (`signatureReturn=true`) + 1 `canvas` |
| DM-DEV-016 | ✅ PASS | Alert `Denario Devolución` / *"¡Su Devolución se ha guardado!"* `[OK]` |
| DM-DEV-018 | ✅ PASS | 3 alertas → **Ref 879**; navega al home del módulo |
| DM-DEV-019 | ✅ PASS | BUSCAR lista 6 devoluciones con Nro.Ref, cliente, Estatus y Fecha |
| DM-DEV-021 | ✅ PASS | Filtro en vivo: 6 → **2** (`JAKE`) → **0** (`ZZZZNOEXISTE`) → **6** al vaciar |
| DM-DEV-022 | ✅ PASS | Guardada reabre **editable** (todos los inputs `disabled=false`/`readonly=false`), 3 tabs, datos precargados |
| DM-DEV-024 | ✅ PASS | Trash → `[Cancelar/**Eliminar**]` → lista 7→6, guardados 1→0 |
| **DM-DEV-A01** | ✅ PASS | 🔴 **Encargo especial — adjunto punta a punta.** Ver `## H-1` |
| **DM-DEV-A02** | ❌ **FAIL** | 🔴 **El Estatus vacío se reproduce EN EL MÓVIL**, no solo en la web. Ver `## H-2` |
| **DM-DEV-A03** | ✅ PASS | `PRD-LISTA-CORTA-CATALOGO` **NO reproduce** en devoluciones. Ver `## H-3` |
| **DM-DEV-A04** | 🚫 N/A | Moneda/tasa: devoluciones **no maneja importes ni moneda** (ver `## Notas`) |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **879** | CAR755 · `ACBA300U` ×2 · lote `QALOTE100826` · factura `5000098151` · motivo 49 · tipo Calidad(60) · **2 adjuntos** | **Enviado** — `BD-OK` |
| (sin Ref) | CAR755 · `AMPSU10` ×3 · solo Guardado, usado para DM-DEV-022/024 | **Eliminado** — 0 filas en `returns` y `return_details` |

---

## Verificación BD

**Manifiesto emitido** (`_bd-manifest.jsonl`): `{"module":"devoluciones","co_x":"1786390673055.0","action":"sent"}`

### Nube — `return` id 879

| Campo | UI cargó | Nube trae | ✓ |
|---|---|---|---|
| `na_responsible` | QA Automatizacion | QA Automatizacion | ✅ |
| `nu_seal` | QA10082026 | QA10082026 | ✅ |
| `tx_description` | Smoke main 2026-08-10 - devolucion con adjunto | idem | ✅ |
| `id_type` | 60 (Calidad) | 60 | ✅ |
| `co_client` | CAR755 | CAR755 | ✅ |
| `id_enterprise` | 2 (DDHP_A12) | 2 | ✅ |
| `has_attachments` / `nu_attachments` | 2 fotos | `true` / `2` | ✅ |
| `st_return` | — | 1 | ✅ |

`return_detail`: `ACBA300U` · `qu_product=2.0000` · `co_measure_unit=UND` · `nu_lote=QALOTE100826` ·
`co_document=5000098151` · `id_motive=49` · `da_duedate=null` (no se llenó). **1 línea = 1 producto.** ✅
`nu_price`/`nu_amount` = `null` — esperado en este módulo, **no es mismatch**.

### Local (`window.sqlitePlugin`)

`returns` → `id_return=879`, `st_delivery=**1**`, `nu_attachments=2`, `has_attachments='true'` ·
`pending_transactions` type='return' = **0** · `failed_transactions` = **0** ·
`count(*)=6` == `count(DISTINCT co_return)=6` (**sin duplicados**).

**Conclusión guardado→enviado: `BD-OK`.** Lo que se guardó se envió, íntegro.

### 🔴 Sync a nube: **INMEDIATA**, no diferida

El perfil y `module-selectors` dicen *"sync de devoluciones DIFERIDA 5-12 min en difranca"*. **En `main` no.**
El correlativo del servidor (879) volvió **en el 3.er alert del envío**, y la fila estaba en nube al
consultarla segundos después (`da_created 19:43:43`). ⇒ **Corregir el perfil.**

---

## 🔴 H-1 · El adjunto SÍ sube desde el móvil — y `DEV-ADJUNTOS-404` **no es de devoluciones**

**Pregunta del encargo:** *¿el archivo nunca sube desde el móvil, o sube y la web no lo encuentra?*
**Respuesta: sube, y la web lo encuentra perfectamente. Lo que falta son los archivos HISTÓRICOS, en TODOS los módulos.**

### Punta a punta de la Ref 879 (creada hoy en `main`)

| Paso | Resultado |
|---|---|
| Adjuntar 2 fotos con `installCameraMock` → `mockCameraAdjunto` | `adjuntoService.fotos = 2`, `hasItems() = true`, 2 slides en el carrusel |
| Enviar | Ref 879 |
| Fila en `return` | `has_attachments = true`, `nu_attachments = 2` ✅ |
| Filas en `transaction_image` | **`879_0.jpeg`** y **`879_1.jpeg`** |
| Archivo en el servidor | 🟢 **HTTP 200**, `image/jpeg`, **162 bytes** (exactamente el JPEG mock) |

```
GET /denario/resources/images/devoluciones/879_0.jpeg  →  200  image/jpeg  162 B
GET /denario/resources/images/devoluciones/879_1.jpeg  →  200  image/jpeg  162 B
```

### El patrón de nombre/carpeta es **IDÉNTICO** al de cobros — no hay diferencia

La hipótesis del encargo (*"¿el patrón de nombre o de carpeta es distinto?"*) queda **descartada**:

| Módulo | `transaction_image.na_image` | Carpeta |
|---|---|---|
| cobros | `21843_0.jpeg` | `/denario/resources/images/cobros/` |
| pedidos | `39794_0.jpeg` | `…/pedidos/` |
| **devoluciones** | **`879_0.jpeg`** | **`…/devoluciones/`** |

Mismo esquema `{id_transaction}_{n}.{ext}`, misma tabla, misma raíz. **Devoluciones no tiene nada especial.**

### 🔴 La causa real: los archivos anteriores al ~2026-08-07 **no están en disco, en NINGÚN módulo**

Medido con `curl` directo contra `denarioelyaque.ddns.net:8080`:

| Adjunto | Registrado | HTTP |
|---|---|---|
| `devoluciones/879_0.jpeg` (nuestro) | 2026-08-10 | **200** |
| `devoluciones/877_0.jpeg` | 2026-08-07 14:03 | **200** |
| `visitas/28219_0.jpeg` | 2026-08-07 13:55 | **200** |
| `inventarios/16_0.jpeg` | 2026-08-07 14:00 | **200** |
| `cobros/21824_0.jpeg` · `21843_0.jpeg` | 2026-08-07 / 08-10 | **200** |
| `devoluciones/876_0.jpg` | 2026-08-04 | **404** |
| 🔴 **`cobros/21823_0.jpg`** | **2026-08-04** | 🔴 **404** |
| 🔴 `cobros/21820_0.jpg`, `21816_0.jpg` | 2026-08-04 | 🔴 **404** |
| `devoluciones/873_0.jpg`, `874`, `875`, `871`, `860`, `845` | 2026-07 y antes | **404** |
| `devoluciones/385_0.jpeg` · `cobros/2794_0.jpeg` · `visitas/4755_0.jpeg` | 2025 y 2024 | **404** |

**Dos conclusiones que corrigen el diagnóstico de la capa web:**

1. **No es la extensión.** Se probaron `.jpeg` **viejos** (2024-11, 2025-02, 2025-06) y también dan 404.
   Lo que discrimina es la **fecha**, no `jpg` vs `jpeg`.
2. **No es de devoluciones.** `cobros/21823_0.jpg` del **2026-08-04** da 404 igual. La capa web reportó
   *"los otros 4 módulos descargan bien"* porque muestreó, por azar, **cobros y pedidos recién creados**
   (`21838`, `39794`, ambos posteriores al corte) contra **devoluciones históricas** (876…845, todas
   anteriores). Con la muestra invertida el veredicto se da vuelta.

**El corte está entre 2026-08-04 14:25 UTC y 2026-08-07 13:55 UTC.** No se puede afinar más porque
en ese intervalo **no se registró ni un adjunto** en toda la BD (se verificó: `da_update >= '2026-08-05'`
devuelve como primera fila la de 08-07 13:55). Coincide con la ventana del despliegue de `main`.

**Reencuadre propuesto para `DEV-ADJUNTOS-404`:** no es *"devoluciones promete 555 adjuntos y no entrega
ninguno"*, sino **"los archivos de adjuntos anteriores al despliegue no están en el filesystem del
servidor, en los 5 módulos"**. Devoluciones lo hace visible porque casi todos sus adjuntos son viejos
(1.218 de 1.223 son `.jpg` pre-corte); cobros lo disimula porque tiene tráfico nuevo constante.
⇒ Es un tema de **datos/infraestructura del despliegue**, no un defecto del móvil ni del módulo.

> El botón `Descargar adjuntos` que **falla en silencio** sigue siendo un defecto de producto válido y
> aparte (capa web): con los archivos ausentes debería informar, no quedarse mudo.

---

## ❌ H-2 · `DEV-ESTATUS-VACIO` — el Estatus vacío **también pasa en el móvil** (histórico)

**El móvil SÍ tiene campo Estatus y SÍ lo muestra… en unas devoluciones y en otras no.** Medido sobre las 6 de la lista:

| Nro. Ref | Estatus en el móvil | `st_return` local | Fila en `transaction_statuses` |
|---|---|---|---|
| 879 (nuestra) | **Enviado** | 0 (`st_delivery=1`) | no (rotula por estado local) |
| 878 | **Enviado** | 1 | ✅ `id_status=8` |
| 877 | **Enviado** | 1 | ✅ `id_status=18` |
| 867 | 🔴 **(vacío)** | 1 | ❌ ninguna |
| 865 | 🔴 **(vacío)** | 1 | ❌ ninguna |
| 857 | 🔴 **(vacío)** | 1 | ❌ ninguna |

DOM real de una vacía: `<p> Estatus: </p>` — el campo se renderiza, el valor sale vacío.

### Causa raíz (cerrada, y es la misma en web y en móvil)

El rótulo **no sale de `return.st_return`**: sale de un JOIN contra **`transaction_statuses`** por
`co_transaction`. Esa tabla es de **historial y está apenas poblada**: en la BD local tiene **2 filas
`dev`** (878 y 877) para 6 devoluciones, y en la nube **2 filas para las 795 históricas**. Sin fila, no
hay rótulo — ni en la web ni en el móvil.

Y no hay fallback posible por `st_return`: **las 795 devoluciones tienen `st_return = 1`**, pero en el
catálogo `statuses` de la nube **`id_status=1` es `env`/`ped` de la empresa 3 (DIF_A12)** — el valor
correcto para (empresa 2, `dev`) sería **8**. El mismo patrón está en cobros (`st_collection=1` en
19.782/19.782), y explica de paso `COB-WEB-FILTRO-STATUS`. Pedidos en cambio guarda `st_order=6`, que
**sí** es `env`/`ped`/empresa 2 — por eso pedidos rotula bien.

### 🟢 Lo bueno: en `main` los registros NUEVOS quedan correctos

La Ref 879 **sí generó su fila** en `transaction_statuses` de la nube, con `id_status=8` — el valor
correcto para `dev`/empresa 2. ⇒ El defecto es **estrictamente histórico**; los registros creados sobre
`main` rotulan bien de aquí en adelante. Esto explica y respalda el descarte de QA
(*"no reprodujo en las devoluciones enviadas hoy"*) — pero el descarte tapó que **el dato viejo sigue
roto y que también afecta al móvil**, que es lo que ve el vendedor en su historial.

**Severidad:** funcional, baja-media. No bloquea operación; degrada el historial.
**Sugerencia a desarrollo:** fallback a `st_return` cuando falte la fila de `transaction_statuses`, y
corregir el `st_return`/`st_collection` que se escribe como `1` literal en vez del `id_status` del
catálogo para (empresa, tipo).

---

## ✅ H-3 · `PRD-LISTA-CORTA-CATALOGO` **no** reproduce en devoluciones

El selector de productos de devoluciones **sí pagina completo**:

- Familia **BBK**, badge **114** → arrancó con **50** ítems (`page=0`, `scrollDisable=false`) y con
  scroll real de rueda llegó a **114 de 114** (`page=2`, `scrollDisable=true`, `ion-infinite-scroll`
  quedó `disabled=true`).
- Familia **Ampollas**, badge **16** → renderizó **16**.
- Las 7 familias suman **450**, exactamente los 450 productos activos de DDHP_A12.

⚠ **Trampa de medición:** el conteo inicial de 50 se lee como "la lista se corta". Además, disparar
`ionInfinite` por código **no la hace crecer**; lo que la hace crecer es `pg.mouse.wheel` real.
Concluir el defecto sin el gesto real habría dado un **FAIL falso**.

También se verificó que **`PRD-BUSCADOR-NO-REPUEBLA` no reproduce acá**: vaciar el searchbar de la lista
de devoluciones devolvió los 6 ítems (6 → 2 → 0 → **6**).

---

## Notas de veredicto (chequeado contra `defectos-conocidos.yaml`)

- **`expirationBatch`**: Lote y Fecha de vencimiento se renderizan y se dejaron **vacíos** en la
  devolución Guardada; guardó igual. **3.ª confirmación** del alcance por módulo. **No es hallazgo.**
- **Moneda (`BSD`/`US$`/`USD`)** — `DM-DEV-A04` **N/A**: devoluciones **no maneja importes**. Ni la tabla
  local `returns` (21 columnas, ninguna de moneda/monto) ni `return_detail` de nube traen moneda; los
  `nu_price`/`nu_amount` de la línea llegaron `null`. **No hay superficie donde el bug de `USD` tratado
  como local pueda manifestarse en este módulo.**
- **Coordenada**: `newReturn.coordenada = "11.049061,-63.864996"` con `userCanSaveGPS=false` — coherente
  con la nota ya documentada (la VG gobierna el flag, no la captura). **No es hallazgo.**
- **Guardar/Enviar `disabled` al reabrir un Guardado** sin tocar nada: comportamiento defensivo correcto.
- **Back desde form recién Guardado**: sin dirty-guard (form limpio). Correcto.
- **`COB-CONTADOR-ADJUNTOS`**: en devoluciones **no reprodujo** — `nu_attachments=2` == 2 filas en
  `transaction_image` == 2 archivos servidos con 200.

---

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **Paginar el catálogo de productos: `pg.mouse.wheel`, NO `ionInfinite` por código** | universal (candidato) | En `productos-tab-return-product-list`, disparar `ionInfinite` sintético **no mueve nada** (3 vueltas: 50/50/50). Con `pg.mouse.move(180,500)` + `pg.mouse.wheel(0,2500)` ×8 pasó a **114/114**, `page` 0→2, `scrollDisable→true`. **Medir el corte de catálogo SOLO con el gesto real**, o se levanta un FAIL falso. |
| ⚠ **`devolucion-product-list` es el CARRITO, no el catálogo** | universal | El catálogo es **`productos-tab-return-product-list`**. Confundirlos hace buscar `onIonInfinite` en un componente que no lo tiene (`NO-METHOD`) y gastar intentos. Componentes del tab: `productos-tab` › `productos-tab-search` › `productos-tab-structure-list` › `productos-tab-return-product-list`; el carrito es `devolucion-product-list`. |
| **Paginar el modal de clientes: `devolucion-general.selectorCliente.onIonInfinite`** | universal | **NO** `returnLogic.selectorService.onIonInfinite` (no existe → `TypeError`). Cortar por `scrollCliente.scrollDisable===true`, ~900 ms/vuelta, cerrar con `ng.applyChanges`. Medido: 50 → 100 → 100 → **148**, corte en la 4.ª. |
| 🔴 **`#clienteSelectModal` NO persiste la paginación (2.ª confirmación en difranca)** | cliente | La 2.ª apertura volvió a 50 y hubo que repaginar las 148. Contradice alipascua/el_palmar. **Paginar siempre.** |
| ⚠ **Rect `0×0` en el modal de clientes = el modal se CERRÓ, no "el ítem está fuera del viewport"** | universal | Un click con coords inválidas cierra el modal; a partir de ahí todos los `ion-item` devuelven `{0,0,0,0}` y el bucle de `scrollIntoView` + re-leer rect falla **3 de 3** sin decir por qué. **Diagnosticar con `#clienteSelectModal.show-modal` antes de reintentar**, y anclar los `querySelectorAll` a `.show-modal`. Costó 2 llamadas. |
| ✅ **Click real en `#clienteSelectModal ion-item` acierta el cliente exacto (4.ª confirmación)** | universal | `scrollIntoView({block:'center'})` → 1 s → re-leer rect → validar centro en viewport → `mouse.click(delay:130)`. **2 de 2** aciertos. No hizo falta `setClientfromSelector`. En form fresco **no hay alert** de cambio de cliente. |
| 🔴 **Envío = 3 alertas en `main` (antes eran 2)** | cliente | `[Cancelar/Aceptar]` → `[OK]` → **`[OK]` "Devolución nro. 879 enviada exitosamente"**. La corrida `difranca-20260807` documentó *"solo 2 alertas, la Ref no se puede leer del alert acá"* — **en `main` sí se puede**. Corregir la nota. |
| 🔴 **Sync de devoluciones INMEDIATA en `main`** | cliente | Contradice la nota "DIFERIDA 5-12 min" del perfil y de `module-selectors`. Correlativo del servidor en el 3.er alert, fila en nube al instante. |
| **Campos del acordeón de producto: por `ion-input.label` y con el acordeón COLAPSADO** | universal (2.ª conf.) | `Lote` (opt) · `Nro Factura` (opt, `requeridedNroFactura=false`) · `Cantidad Devuelta` (**`required=true`**, `type=number`). Se llenaron los 3 sin expandir. Selects: `Unidad` (22/UND) · `Motivo` (default **49**). |
| **Etiquetas de alert leídas (no predichas)** | cliente | Guardado `[OK]` · Envío `[Cancelar/**Aceptar**]`→`[OK]`→`[OK]` · Borrado `[Cancelar/**Eliminar**]` · Dirty-guard `[Guardar y salir/**Salir sin guardar**/Cancelar]`. **Todas en minúsculas mixtas**, resueltas por igualdad exacta case-insensitive: **9 alerts, 0 reintentos**. |
| ⚠ **El dirty-guard salta al salir de un Guardado aunque solo se hayan navegado tabs** | cliente | Al volver de un Guardado reabierto tras visitar Productos/Adjuntos **sin editar nada**, apareció el alert de 3 botones con **`.alert-message` VACÍO** (solo título). Leer los botones, no el mensaje. No es FAIL. |
| 🔑 **Oráculo de Estatus: `transaction_statuses` LOCAL, no `st_return`** | universal (candidato) | `SELECT r.id_return, ts.id_status, s.na_status FROM returns r LEFT JOIN transaction_statuses ts ON ts.co_transaction=r.co_return AND ts.co_transaction_type='dev' LEFT JOIN statuses s ON s.id_status=ts.id_status`. Explica en una consulta por qué unas filas rotulan y otras no. La tabla local `statuses` **solo tiene `(id_status, co_status, na_status, status_action)`** — sin `id_enterprise` ni `co_transaction_type` (la de nube sí los tiene). |
| 🔑 **Probar los adjuntos con `curl` contra la web ANTES de crear nada** | universal | `curl -o /dev/null -w "%{http_code}" http://<host>:8080/denario/resources/images/{modulo}/{ref}_{n}.{ext}` cruzado con `transaction_image` reencuadró `DEV-ADJUNTOS-404` **sin tocar el dispositivo**. Regla: **antes de culpar a un módulo, probar el mismo patrón en OTRO módulo y en OTRA fecha** — el sesgo de muestreo (viejo vs nuevo) fue exactamente lo que torció el diagnóstico web. |
| **`transaction_image` es la tabla de adjuntos** | universal | `(id_transaction_image, na_transaction, id_transaction, na_image, co_operation, da_update)`. `na_transaction` ∈ `cobros/pedidos/visitas/devoluciones/clientes/inventarios`. Documentos → `transaction_files`; firmas → `transaction_signatures` (fuera de `nu_attachments`). |
| ⚠ **`ng.getComponent(...)` de un tab revienta al salir del tab** | universal (re-confirmado) | `devolucion-product-list` deja de existir fuera de Productos. Anclar a `app-devoluciones` y bajar por `comp.returnLogic`. |

---

## Resumen para el orquestador

- **15 PASS · 1 FAIL · 0 BLOCKED · 2 N/A** — módulo conducible de punta a punta, **9 alerts sin un reintento**.
- **El adjunto SÍ sube desde el móvil**, con el mismo patrón de nombre que cobros, y el archivo se
  descarga con **HTTP 200**. `DEV-ADJUNTOS-404` **hay que reencuadrarlo**: no es de devoluciones, es
  pérdida de los archivos anteriores al despliegue en los 5 módulos.
- **El Estatus vacío también afecta al móvil** en las devoluciones históricas; la causa es
  `transaction_statuses` sin filas, y en `main` los registros nuevos ya salen correctos.
- Dos notas del perfil **quedan desmentidas por `main`**: sync inmediata (no diferida) y envío con
  3 alertas (no 2).
- Dispositivo en **HOME**.
