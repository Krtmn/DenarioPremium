# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260804_162329_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Dispositivo | 14678405BR003855 (Infinix X6728 / HOT 60i) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · `window.ng=true` |
| Playa | EL YAQUE — `denarioelyaque.ddns.net:8081` |
| Empresa | ALIPASCUA, C.A. (`ALIP_BSD`, id_enterprise=2) — única, selector `disabled` |
| Usuario | coUser 002 · idUser 468 |
| Cliente de prueba | V28556138 — RENZO FERNANDO MARTINEZ MEJIAS (idClient 1744) |
| **Factura usada** | **46986** (devolución enviada) · **46987** (devolución guardada/eliminada) |
| Producto | 7591473004525 — ACEITE DE OLIVA EXTRA VIRGEN MARY 12X500 GRS (familia IANCARINA) |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| GPS | ✅ Sin problemas — `coordenada` real `11.0490433,-63.8649956` viajó en el payload y persistió en nube |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `/devoluciones` abre con botones **DEVOLUCIÓN** y **BUSCAR** visibles |
| DM-DEV-002 | ✅ PASS | Form abre con tabs **Productos/Adjuntos `disabled`** y sin cliente; empresa auto-asignada ALIPASCUA (`ion-select` `disabled=true`) |
| DM-DEV-004 | ✅ PASS | Cliente V28556138 fijado (`comp.cliente` + `hasClient`) → **3 tabs habilitan**. `validateReturn=false` ⇒ NO hay selector de factura en cabecera (`ion-input#invoiceSelect` ausente) — comportamiento correcto de la VG |
| DM-DEV-006 | ✅ PASS | `#responsable`="QA AUTOMATIZACION", `#precinto`="PRE-0804", `#comentario`=texto de 52 car.; Tipo con 3 opciones en popover: **Calidad(60, default) / PostVenta(52) / Servicio(59)** → fijado 52 |
| DM-DEV-011 | 🚫 N/A | **VG inactiva**: `returnLogic.validateReturn=false` leído del modelo Angular ⇒ el selector de factura de cabecera no existe en UI. El Nro. Factura vive por producto (VG `requeridedNroFactura=true`) |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familias inline (7: CASA CLEAN/IANCARINA/ISOLA FOODS/JAI 28 GROUP/OLYMPIA/PARAWA/SUALCA) → IANCARINA → producto → **acordeón expandido** con Lote / Nro Factura / Cantidad / Unidad / Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 + Nro Factura=46986 → **`imagenEnviar` pasa de `disabled:true` a `disabled:false`** (transición observada, no estado supuesto) |
| DM-DEV-015 | ✅ PASS | Tab ADJUNTOS con los **3 acordeones**: `images` (Imágenes) · `file` (Archivo, `userCanUploadFiles=true`) · `sign` (Firma, `signatureReturn=true`, canvas presente) |
| DM-DEV-016 | ✅ PASS | Alert **"¡Su Devolución se ha guardado!"** (header "Denario Devolución", botón **"OK"**) |
| DM-DEV-018 | ✅ PASS | 3 alertas: "¿Desea enviar la devolución?" [Cancelar/**Aceptar**] → "¡Su Devolución será enviada!" [OK] → **"Devolución nro. 73 enviada exitosamente"** [OK]. **BD-OK** |
| DM-DEV-019 | ✅ PASS | Lista BUSCAR muestra `Nro. Ref: 73 · Cliente: V28556138 - RENZO FERNANDO MARTINEZ MEJIAS · Estatus: Enviado · Fecha: 04/08/2026` |
| DM-DEV-021 | ✅ PASS | Filtro en tiempo real: "RENZO"→1 ítem · "ZZZNOEXISTE"→0 · vacío→2. **Trash solo en el ítem Guardado** (`trash:true` en Ref 0; `trash:false` en Ref 73 y 72 Enviados) |
| DM-DEV-022 | ✅ PASS | Guardada reabierta: **editable** (`readonly=false`/`disabled=false` en los 4 inputs), **3 tabs accesibles**, factura y detalle precargados. Round-trip §9 completo (ver abajo) |
| DM-DEV-024 | ✅ PASS | Trash → alert **"¿Desea eliminar la devolución?"** [Cancelar/**Eliminar**] → la devolución desaparece (3→2 ítems). Sin alert de éxito posterior (consistente con insumar/globalmp) |

## Registros creados en sistema

| Ref (id_return) | co_return | Detalle | Estado |
|-----|-----------|---------|--------|
| **73** | `1785879207191.0` | Cliente V28556138 · Tipo PostVenta(52) · Responsable "QA AUTOMATIZACION" · Precinto PRE-0804 · 1 producto: 7591473004525 ×2 UNI · **Factura 46986** · Motivo 34 (Empaque Roto/Mal Sellado) | ✅ **Enviado** (`st_return=1` nube, `st_delivery=1` local) |
| 0 (nunca sincronizó) | `1785879870257.0` | Cliente V28556138 · Tipo Servicio(59) · Responsable "QA GUARDADO" · Precinto PRE-GUARD-02 · 1 producto: 7591473004525 ×3 UNI · **Factura 46987** · Motivo 37 (Empaque Mojado) | 🗑 Creada como **Guardado** para DM-DEV-022/024 y **eliminada** en DM-DEV-024 — no llegó a la nube (correcto) |

## Verificación BD

**Baseline (inicio del módulo, nube):** `return` → 1 fila, `max(id_return)=72` · `return_detail` → 2 filas.

**Diff de baseline al cierre:** exactamente **1 fila nueva**, `id_return=73`. Sin filas inesperadas.

### Cotejo campo-a-campo — Ref 73 (`co_return 1785879207191.0`) → **BD-OK**

| Campo cargado en UI | Payload `returnservice/return` | Nube (`return` / `return_detail`) | ✓ |
|---|---|---|---|
| Cliente V28556138 (idClient 1744) | `coClient`/`idClient` | `co_client=V28556138`, `id_client=1744` | ✓ |
| Tipo PostVenta | `idType:52` | `id_type=52` | ✓ |
| Responsable | `naResponsible:"QA AUTOMATIZACION"` | `na_responsible` idem | ✓ |
| Precinto | `nuSeal:"PRE-0804"` | `nu_seal="PRE-0804"` | ✓ |
| Comentario (obligatorio, `requiredComment=true`) | `txComment` | `tx_description` (fieldMap `tx_comment`→`tx_description`) idem | ✓ |
| Empresa | `coEnterprise:"ALIP_BSD"`, `idEnterprise:2` | idem | ✓ |
| Vendedor | `coUser:"002"`, `idUser:468` | `id_user=468` | ✓ |
| GPS | `coordenada:"11.0490433,-63.8649956"` | `coordenada` idem | ✓ |
| Producto | `coProduct:"7591473004525"`, `idProduct:563` | `co_product` idem | ✓ |
| Cantidad 2 | `quProduct:2` | `qu_product=2.0000` | ✓ |
| **Nro. Factura 46986** | `coDocument:"46986"` | `co_document="46986"` | ✓ |
| Motivo 34 | `idMotive:34` | `id_motive=34` | ✓ |
| Unidad UNI | `coMeasureUnit:"UNI"`, `idUnit:19` | `co_measure_unit="UNI"` | ✓ |
| Lote (no cargado) | `nuLote:""` | `nu_lote=""` | ✓ |
| Fecha venc. (no cargada) | `daDueDate:null` | `da_duedate=null` | ✓ |
| Sin adjuntos ni firma | `nuAttachments:0`, `hasAttachments:"false"` | `nu_attachments=0`, `has_attachments=false` | ✓ |

`nu_amount=null` / `co_type=null` / `co_currency=null` — **esperado**: devoluciones no maneja montos (confirmado a nivel de esquema y payload en `[gmp-20260730]`). **No se construyó oráculo de importes** ni se buscaron defectos de conversión: no hay ninguna columna de monto/tasa/`*_conversion` en `return`/`return_detail` ni en el POST.

### Estado local (`window.sqlitePlugin`)

```
returns:              co_return 1785879207191.0 → id_return=73, st_delivery=1   ⇒ ENVIADO
return_details:       1 fila (7591473004525 ×2, co_document 46986, id_motive 34)
pending_transactions  (type='return'): 0   ⇒ nada atascado
failed_transactions   (type='return'): 0   ⇒ nada rechazado
duplicados nube:      count(*)=2 == count(DISTINCT co_return)=2  ⇒ sin duplicados
```

**Conclusión guardado→enviado:** lo que se guardó **se envió**. La devolución pasó Guardar → Enviar → nube en la misma ventana (**sync INMEDIATA** en este servidor/build, sin latencia diferida; el poll de 10 s no hizo falta). `co_return` eliminado `1785879870257.0` **no existe** en la nube — correcto: nunca se intentó enviar.

### Round-trip §9 (Guardar → reabrir) — sin divergencias

Devolución guardada `1785879870257.0`, reabierta desde BUSCAR:

| Campo | Guardado | Releído | ✓ |
|---|---|---|---|
| Cliente | V28556138 | RENZO FERNANDO MARTINEZ MEJIAS (V28556138) | ✓ |
| Responsable | QA GUARDADO | QA GUARDADO | ✓ |
| Precinto | PRE-GUARD-02 | PRE-GUARD-02 | ✓ |
| Comentario | "Devolucion QA en GUARDADO para round-trip y borrado" | idem | ✓ |
| **Tipo (cambio sobre default)** | **59 Servicio** (default era 60 Calidad) | **59** — no revirtió al default | ✓ |
| Nro. Factura | 46987 | 46987 | ✓ |
| Cantidad | 3 | 3 | ✓ |
| Motivo | 37 | 37 | ✓ |
| Unidad | 19 (UNI) | 19 | ✓ |

Ambos sabores del oráculo cubiertos: **default conservado** (unidad 19) y **cambio conservado** (tipo 60→59, motivo 49→37).

**Borrado limpio:** tras ELIMINAR, ni `returns` ni `return_details` conservan el `co_return` — sin detalles huérfanos (ratifica `[gmp-20260730]`).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`await alert.dismiss()` en bucle sobre TODOS los `ion-alert` CUELGA el `evaluate`** | universal (candidato) | Iterar `document.querySelectorAll('ion-alert')` haciendo `await a.dismiss()` **nunca resuelve** para los alerts **ocultos/acumulados** de `<app-message>` (son `<ion-alert [isOpen]>` estáticos que jamás se presentaron) ⇒ `TIMEOUT` del watchdog. **Fix: hacer dismiss SOLO sobre los visibles** (`:not(.overlay-hidden)` + `offsetParent!==null`), o cerrar por click en el botón. Refina la receta de limpieza de alerts residuales de `devoluciones.md`, que hoy dice `querySelectorAll('ion-alert').forEach(a=>a.dismiss())` |
| **Los 14 `ion-backdrop` acumulados NO eran huérfanos** | universal | Todos pertenecían a `ion-alert`/`ion-modal`; el filtro `!b.closest('ion-alert') && !b.closest('ion-modal')` removió **0**. El modal de cliente reabrió con un simple 2º click en `ion-input#clienteSelect`: **el 1er intento fallido fue timing (modal aún cerrado al leer), no intercepción** — diagnosticar con `elementFromPoint` antes de culpar a los backdrops |
| **Modal de cliente PAGINADO también en DEVOLUCIONES** (50 de 64) | cliente `[alipascua-20260804]` | `general.selectorCliente.onIonInfinite({target:{complete(){}}})` en bucle hasta que `clientes.length` no crece. El cliente objetivo V28556138 era el **ítem 63** — sin paginar "no existe". ⚠ **La lista cargada PERSISTE** entre aperturas del modal: en la 2ª devolución ya venían los 64 sin repaginar |
| **Click REAL en `#clienteSelectModal ion-item` funciona** (3ª confirmación) | universal | `scrollIntoView({block:'center'})` + esperar ~900 ms + **re-leer el rect** + `pg.mouse.click` → cliente exacto **2 de 2**, modal cierra solo, tabs habilitan. NO hizo falta `setClientfromSelector`. Ratifica `[gmp-20260730]` sobre la nota vieja de "cliente vecino" |
| ⚠ **Rect `0×0` en ítems de modal cerrado** (hermano del `fechaAtras`) | universal | Con el modal `show-modal=false` los 64 `ion-item` **siguen en el DOM** y `getBoundingClientRect()` devuelve `{0,0,0,0}` ⇒ el click cae al vacío sin error. **Validar `width>0` además de `y` en viewport** antes de clickear |
| **Etiquetas de alert MIXTAS en el mismo build** | cliente `[alipascua-20260804]` | Los alerts **informativos** usan **"OK"**, pero el de **confirmación de envío** usa **[Cancelar/"Aceptar"]** y el de borrado **[Cancelar/"Eliminar"]**. No asumir una sola etiqueta: recorrer por **igualdad exacta** en orden de preferencia `aceptar → ok → eliminar` |
| **Tipos y motivos de devolución — alipascua** | cliente `[alipascua-20260804]` | Tipos: **Calidad(60, default) / PostVenta(52) / Servicio(59)** — sin CxC(63) (igual a piercar/jerez/latino). Motivos: **24 opciones, ids 34-59**, default **49**. ⚠ **NO coinciden con el catálogo del prompt** (35/28/33/30/31/32) — ver Notas |
| **Acordeón producto con `validateReturn=false`: orden de inputs** (2ª confirmación) | universal | `idx0`=Lote (plain) · `idx1`=Nro Factura (`inp-write`, text, **requerido**) · `idx2`=Cantidad (`inp-write`, **type=number**). Selects: `[0]`=Unidad (UNI=19) · `[1]`=Motivo. Ratifica `[ferrenuestro-20260723]` |
| ✅ **`expirationBatch=false` NO oculta los campos** (confirmación en El Yaque v1.0) | universal | El acordeón renderiza igual el input Lote y **1 `ion-datetime`** (Fecha Venc.); ambos quedaron vacíos y el envío procedió. Ratifica `[el_valle-20260728]`: la VG gobierna la **validación**, no la **visibilidad**. **No es hallazgo** |
| **Empresa: `ion-select` `disabled=true` con la empresa auto-asignada** | universal (build v1.0/db19) | Igual que en el form de cliente potencial: leer `sel.disabled` primero; no hay nada que setear. 3ª confirmación del patrón `[latino_cosmetica-20260729][alipascua-20260804]` |
| **Familias inline por `short_na_product`** | cliente | Para ubicar la familia de un producto sin explorar: `SELECT short_na_product FROM product WHERE co_product='<cod>'` en la nube (aquí `IANCARINAACEITE` → familia **IANCARINA**). `returnLogic.productList` está **vacío** hasta entrar a una familia |
| **`clickBack` (`img.fechaAtras`→`closest('a')` + `mouse.click`) FUNCIONA** | cliente `[alipascua-20260804]` | Opera en form, lista y home del módulo. Filtrar por `width>0`. No hizo falta el fallback `ionBackButton` |
| **Lista BUSCAR oculta los botones DEVOLUCIÓN/BUSCAR** | cliente `[alipascua-20260804]` | Desde la vista lista no se ven; hay que hacer back al home del módulo antes de crear otra devolución (como piercar; **contrasta** con dm-electronica) |
| **Captura de payload `__qaDataHook` reutilizable entre agentes** | universal | El hook con guarda instalado por el agente de CLIENTES **seguía activo y capturando con `data`**; bastó leer `window.__qaPayloadsData` filtrando por URL. **No reinstalar** (apila wrappers). `returnservice/return` capturado **1 sola vez**, sin duplicados |
| **`window.sqlitePlugin` operativo en El Yaque v1.0** | cliente `[alipascua-20260804]` | Tablas **plurales** `returns` / `return_details` + `pending_transactions` / `failed_transactions` legibles. `local-query.js` (adb+sqlite3) no hace falta |
| ⚠ **`ng.getComponent('devolucion-general')` revienta fuera del tab General** | universal | Al navegar a la lista de familias/productos el componente se desmonta → `Error: Expecting instance of DOM Element`. Usar `app-devoluciones` como raíz estable (`comp.returnLogic`) |
| ⚠ **`JSON.stringify` de `returnLogic` en el puente Playwright da "circular structure"** | universal | Los servicios inyectados traen `Subscription._parentage`. **Serializar DENTRO del `pg.evaluate`** devolviendo un string ya recortado |

## Notas

- **Catálogo de motivos: el YAML/prompt no coincide con la app.** El prompt indicaba `35 Vencido · 28 Tapas Rotas · 33 producto en mal estado · 30/31 No funciona · 32 not working`. La app (y `returnLogic.returnMotives`) expone **24 motivos con ids 34-59** de otro dominio (alimentos: "Empaque Roto/Mal Sellado", "Azúcar aterronada", "Presencia de Plagas"…), default **49**. **No es un defecto de la app** — es el catálogo del prompt el que está desactualizado o pertenece a otra empresa/playa. Se usaron ids reales (34 y 37). Corregir el dato de prueba en el YAML del cliente.
- **Tipo 53 "Despacho" no existe en UI**: solo 60/52/59. Se usó 52 (PostVenta), como pedía el prompt.
- **Enviar SIN firma** con `signatureReturn=true`: el payload viajó con `nuAttachments:0` / `hasAttachments:"false"` y el envío procedió. **NO se levanta como hallazgo** (RUNTIME §5: la VG habilita la firma, no la vuelve obligatoria). Tampoco hubo adjunto obligatorio que bloqueara el envío, así que no aplicó la regla de "dejar en Guardado".
- **Guardar habilita con cero productos** (`imagenGuardar` `disabled:false` apenas hay cliente), mientras `imagenEnviar` permanece `disabled` hasta que hay cantidad. Coherente con "guardar borrador" — informativo, no defecto.
- **1 cuelgue de CDP** (`TIMEOUT:limpiar-backdrops`) causado por el bucle de `await dismiss()` descrito arriba (helper propio, no la app). No costó ningún caso: se re-diagnosticó y el flujo siguió. El watchdog cerró el módulo con 1/2 cuelgues, sin abortar.
- **Oráculo cruzado de cobros (conversión de moneda / campos derivados absurdos): no aplica.** Se verificó a nivel de esquema y payload que `return`/`return_detail` **no tienen ninguna columna de monto, precio, tasa ni `*_conversion`**, y que el POST tampoco los lleva. No hay superficie donde reproducir ese defecto en este módulo, ni se encontró ningún registro hijo con valores no cargados.

## Hallazgos

Ninguno. 0 FAIL.
