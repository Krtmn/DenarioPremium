# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260817_145314_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente | kron — CHOCOLATES KRON, C.A (`KRON_ADM`, `id_enterprise` 1) |
| Dispositivo | Infinix X6728 (HOT 60i) · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — v1.0 / db19 · `window.ng=true` |
| Playa | **ISLA COCHE** — `denarioislacoche.ddns.net:8081/PremiumWS/services/` (confirmada por el host del POST) |
| Usuario | `scarlet` · `id_user` 309 · `co_user` `VE0002` · 30 clientes |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Home del módulo con botones `DEVOLUCIÓN` y `BUSCAR` visibles |
| DM-DEV-002 | ✅ PASS | Form abre con tabs Productos/Adjuntos `disabled=true` y sin cliente; `imagenGuardar`/`imagenEnviar` ambos `disabled` |
| DM-DEV-004 | ✅ PASS | Cliente anclado por `co_client` `J504480975` → `MINIMARKET BICENTENARIA CCS, C.A.`; las 3 tabs habilitan. `validateReturn=false` ⇒ sin campo Factura en cabecera (VG inactiva) |
| DM-DEV-006 | ✅ PASS | `#responsable`="QA AUTOMATIZACION", `#precinto`="PRE-0817", `#comentario`="Smoke QA kron 20260817 devoluciones" aceptados; Tipo abre **`ion-popover`** con 4 opciones |
| DM-DEV-011 | 🚫 N/A | `validateReturn=false` verificado en el **modelo** (`returnLogic.validateReturn`) y en DOM (no existe `ion-input#invoiceSelect`) ⇒ no hay selector de factura en cabecera |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familia `GRAGEADOS` → `51104106` BALLS BLANCO 10X1KG; acordeón expande con Lote / Nro Factura / Cantidad Devuelta / Unidad / Motivo / botón Fecha |
| DM-DEV-014 | ✅ PASS | Par medido: con factura+cantidad llenas, `imagenEnviar` pasa `disabled` **true→false** (Guardar ya venía habilitado al agregar el producto) |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos con los 3 acordeones esperados: `images`, `file` (`userCanUploadFiles=true`), `sign` (`signatureReturn=true`, canvas 280×220) |
| DM-DEV-016 | ✅ PASS | Alert `Denario Devolución` — "¡Su Devolución se ha guardado!" `[OK]`. Local `st_delivery=3`, `id_return=0` → **BD-SAVED** |
| DM-DEV-018 | ✅ PASS | 3 alertas: `[Cancelar/Aceptar]` → `[OK]` → **"Devolución nro. 178 enviada exitosamente"** `[OK]`; navega al home del módulo → **BD-OK** |
| DM-DEV-019 | ✅ PASS | Lista con Nro.Ref / Cliente / Estatus / Fecha: Ref 178 (Enviado), Ref 177 (Enviado) |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real 2→1 con "BICENTENARIA"; al vaciar **repuebla a 2**. Trash solo en el ítem Guardado |
| DM-DEV-022 | ✅ PASS | Devolución Guardada reabierta: form **editable** (`readonly=false`/`disabled=false`), 3 tabs accesibles, cabecera y línea precargadas 1:1 |
| DM-DEV-024 | ✅ PASS | Trash → alert "¿Desea eliminar la devolución?" `[Cancelar/Eliminar]` → el ítem desaparece (sin alert de éxito posterior) |

## Registros creados en sistema

| Ref | Epoch (`co_return`) | Cliente | Factura | Líneas | Estado |
|-----|---------------------|---------|---------|--------|--------|
| **178** | `1786997229819.0` | `J504480975` MINIMARKET BICENTENARIA CCS | `FACT50029953` | 1 — `51104106` BALLS BLANCO 10X1KG ×3 BUL, motivo 49, lote vacío | **Enviado** · BD-OK |
| 0 (local) | `1786998000721.0` | `J504480975` MINIMARKET BICENTENARIA CCS | `ZZZ-NO-EXISTE-999` | 1 — `51104118` BALLS BLANCO 12X500GR ×5 | Guardado → **eliminado en DM-DEV-024** |

## Verificación BD

**Baseline:** `return` = 2 filas, `max(id_return)` = 177.

**Nube (`return` id 178)** — diff de baseline, sync **INMEDIATA** (<10 s, sin poll extendido):

| Campo | UI / local | Nube | ✓ |
|---|---|---|---|
| `co_return` | `1786997229819.0` | `1786997229819.0` | ✓ |
| `st_return` | — | `1` (Enviado) | ✓ |
| `co_client` | `J504480975` | `J504480975` | ✓ |
| `na_client` | MINIMARKET BICENTENARIA CCS, | idem | ✓ |
| `id_type` | 63 (Cambio X Cambio) | 63 | ✓ |
| `tx_description` | "Smoke QA kron 20260817 devoluciones" | idem (local `tx_comment`) | ✓ |
| `nu_seal` | `PRE-0817` | `PRE-0817` | ✓ |
| `na_responsible` | `QA AUTOMATIZACION` | idem | ✓ |
| `co_enterprise` | `KRON_ADM` | `KRON_ADM` | ✓ |
| `nu_amount` / `co_currency` | — | `NULL` / `NULL` | esperado (§ devoluciones sin montos) |

**`return_detail` (1 línea, `co_detail` 3):** `co_product` `51104106` ✓ · `qu_product` `3.0000` ✓ · `co_measure_unit` `BUL` ✓ · `na_product` BALLS BLANCO 10X1KG ✓ · `co_document` **`FACT50029953`** ✓ · `id_motive` 49 ✓ · `nu_lote` `''` ✓ · `da_duedate` `null` ✓ · `co_operation` **`'I'`** · `nu_price`/`nu_amount` `NULL`.

**Local (`sqlitePlugin`):** enviada → `st_delivery=1`, `id_return=178`; `pending_transactions`=0; `failed_transactions`=0. Guardada eliminada → `returns`=0 **y** `return_details`=0 para su `co_return` (borrado en cascada, sin huérfanos).

**Payload:** POST `returnservice/return` capturado **1 sola vez y con `data`** completo → `{RUN_DIR}_payloads.jsonl`. Trae `coInvoice:null`/`idInvoice:null` (sin factura de cabecera) y el `coDocument` en el detalle; `nuAttachments:0`, `hasAttachments:"false"`.

**Conclusión guardado→enviado:** lo guardado se envió íntegro. **BD-OK**, cotejo campo-a-campo **16/16 + línea completa**, 0 duplicados (`count(*) == count(DISTINCT co_return)`).

> ⚠ Nota sobre la trampa de `co_operation` NULL: **`return_detail` trae `'I'`, no NULL** — el filtro `<> 'D'` no oculta líneas nuevas en esta tabla (medido: `activos=1`, `total=1` con `IS DISTINCT FROM`). La trampa observada en `collection_payment` **no aplica acá**; se comprobó antes de concluir.

## Veredictos solicitados

### 1. `expirationBatch` en DEVOLUCIONES → **NO exige lote ni fecha de vencimiento**

Con la VG en `true` para kron, en este módulo Lote y Fecha de vencimiento **se renderizan pero son opcionales**:

- El `ion-input` **Lote llega `required=false`**, mientras Nro Factura y Cantidad Devuelta llegan `required=true`.
- Se **guardó y se envió** con `nu_lote=''` y `da_duedate=null`, sin ninguna alerta de validación, y así llegó a la nube.

⇒ **3.ª confirmación del alcance POR MÓDULO** de esta VG, tras `[el_palmar-20260805]` (obligatoria en INVENTARIOS, no en DEVOLUCIONES) y `[difranca-20260807]`. Queda cerrado el pendiente del perfil de kron: **`expirationBatch` no gobierna devoluciones**. No derivar el comportamiento de un módulo del otro.

### 2. El Nro. de factura **NO valida contra facturas reales** — es texto libre

Prueba directa, en dos registros:

- Con la factura **real** `FACT50029953` (cartera VE0002, saldo íntegro): aceptada, enviada, llegó a la nube como `co_document`.
- Con el valor **inexistente** `ZZZ-NO-EXISTE-999`: **aceptado igual**, habilitó Guardar y Enviar, persistió en local y sobrevivió el round-trip Guardar→reabrir sin ninguna advertencia.

Coincide con el dato observado de la QA (Ref 177 usa `co_document='15352'`, un número suelto). Consistente con `validateReturn=false` y con `coInvoice:null`/`idInvoice:null` en el payload: **el campo es obligatorio (`requeridedNroFactura=true`) pero su contenido no se contrasta con ninguna factura**. Es el comportamiento esperado de la VG, no un defecto — se deja como dato de perfil.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|---|---|---|
| **Selector de empresa: 2.ª confirmación de la 4.ª variante (`disabled=true` + OBJETO)** | universal (builds v1.0/db19, 1 empresa) | En `app-devolucion` con UNA empresa: 1 solo `ion-select`, **sin `formcontrolname`**, `disabled=true`, `value` = objeto completo (`{idEnterprise:1, coEnterprise:"KRON_ADM", lbEnterprise:"CHOCOLATES KRON, C.A", coCurrencyDefault:"USD", prioritySelection:0, enterpriseDefault:"true"}`). Repite `[grupo_fiel-20260817]` **pero con `enterpriseEnabled=TRUE`** ⇒ refuerza que la VG no gobierna la variante. **No tocar.** |
| **`expirationBatch` no aplica a DEVOLUCIONES — 3.ª confirmación** | universal | Ver veredicto 1. El discriminador barato es leer `required` del `ion-input` "Lote" del acordeón: llega `false` mientras factura/cantidad llegan `true`. |
| **Nro. Factura = texto libre con `validateReturn=false`** | universal | Ver veredicto 2. Un valor inexistente pasa validación, persiste y viaja como `coDocument`. |
| **`co_operation` viene `'I'` en `return_detail`** | universal | La trampa de NULL medida en `collection_payment` **no aplica** a esta tabla; `<> 'D'` no oculta líneas nuevas. Verificado con `IS DISTINCT FROM` antes de concluir. |
| **Catálogo: `co_operation='D'` no baja al device — 3.ª confirmación, ahora en `return_type`** | universal | BD tiene 12 tipos; solo 4 activos (52 PostVenta, 59 Servicio, 60 Calidad, 63 Cambio X Cambio) y **`returnLogic.returnTypes` trae exactamente esos 4**. La basura de pruebas ("hola", "prueba", "problemas", "Prueba Tovar") **no llega a la app**. |
| **Tipo de devolución abre `ion-popover` (1 click); Motivo no hizo falta tocarlo** | universal | Reconfirma `[grupo_fiel-20260817]`: en `app-devolucion` el Tipo es popover con `ion-item`, `value` **number**. Se resolvió con 1 click sin fallback al `ion-alert`. |
| **Campos del acordeón se llenan COLAPSADO por `ion-input.label` — 3.ª confirmación** | universal | 2.ª devolución cargada sin expandir, buscando `x.label==='Nro Factura'` / `'Cantidad Devuelta'`. Más estable que el índice y que `.inp-write` (que cambia de clase al editar). |
| **`waitForFunction` sobre `#clienteSelectModal.show-modal` + `ion-item.length>0`** | universal | Resolvió el modal a la 1.ª en las 2 aperturas, sin un solo rect 0×0. |
| **La lista del `#clienteSelectModal` PERSISTIÓ entre aperturas** | cliente | 30 clientes, `scrollDisable=true` en 2 vueltas la 1.ª vez; en la 2.ª ya venían los 30. Alinea alipascua/el_palmar/grupo_fiel, contrasta difranca. Igual conviene paginar siempre (el corte es inmediato). |
| **🔴 Anclar el cliente por `co_client`, nunca por nombre (trampa real de datos en kron)** | cliente | Conviven **tres** "MINIMARKET BICENTENARIA" en la cartera VE0002: `J409215121`, `J504480975` (CCS) y `J505383973` (VALENCIA). El match por `Código:\s*J504480975` en el `textContent` del `ion-item` acertó **2 de 2**. |
| **Localizar producto por código: captura + igualdad exacta** | universal | `/Código:\s*([A-Za-z0-9.\-]+?)\s*(?:Precio\|Existencia\|Stock\|$)/` + comparación exacta. Imprescindible acá: los códigos comparten prefijo (`51104106` / `51104107` / `51104118` / `51104119`). |
| **Familia de un producto sin explorar la UI** | universal | `SELECT p.co_product, s.na_product_structure FROM product p JOIN product_structure s USING (co_product_structure)` → `51104106` = **GRAGEADOS**. `short_na_product` **NO** da la familia (contradice la nota de `[alipascua-20260804]`): acá devuelve "BALLS BLANCO 10", un nombre truncado. |
| **Envío = 3 alertas y la 3.ª trae el correlativo** | cliente | `Devolución nro. 178 enviada exitosamente`. Como grupo_fiel; contrasta difranca (2 alertas). Reconfirma **Ref UI = `id_return`**. |
| **Reparto de etiquetas de alert (leídas, no predichas)** | cliente | Guardado `[OK]` · Envío `[Cancelar/**Aceptar**]`→`[OK]`→`[OK]` · Borrado `[Cancelar/**Eliminar**]` · Dirty-guard `[Guardar y salir / **Salir sin guardar** / Cancelar]`. Recorrido por igualdad exacta case-insensitive filtrando `width>0` resolvió **los 8 alerts del módulo sin un solo reintento**. |
| **`PRD-BUSCADOR-NO-REPUEBLA` NO reproduce en DEVOLUCIONES** | universal | Vaciar el searchbar repobló la lista (1→2) sin empty-state. 2.ª confirmación tras grupo_fiel de que el defecto está acotado a PRODUCTOS. |
| **La lista BUSCAR OCULTA los botones DEVOLUCIÓN/BUSCAR — 6.ª confirmación** | universal | Back al home del módulo antes de crear otra devolución. `clickBack` (`img.fechaAtras`→`closest('a')`, filtrando `width>0`) funcionó en form, lista y home; no hizo falta `ionBackButton`. |
| **Dirty-guard: aparece al salir de un form REABIERTO, no de uno recién Guardado** | cliente | Back desde el form recién guardado: sin alert (form limpio). Back desde el mismo registro reabierto desde BUSCAR: sí dispara los 3 botones. |
| **Borrado en cascada verificado en local** | universal | 2.ª/3.ª confirmación: `returns`=0 **y** `return_details`=0 para el `co_return` eliminado, sin detalles huérfanos. |
| **⚠ `st_return` local ≠ nube tras enviar** | universal | Local dejó `st_return=0` con `st_delivery=1`, mientras la nube trae `st_return=1`. Ratifica RUNTIME §10: **el discriminador fiable es `st_delivery`**, no `st_*`. |
| **Hook de payload: comprobar, no asumir** | universal | Al arrancar, `window.__qaDataHook` **ya estaba en `true`** (lo dejó un agente previo) y `__qaH` traía solo `fillIonInput`/`activeAlertInfo`. La guarda propia evitó apilar un 2.º wrapper: **1 POST capturado, 0 duplicados, con `data`**. Namespace propio `__qaDEV` instaló limpio. |

> ✅ consolidado 2026-08-17

## Hallazgos

**Ninguno** — 0 FAIL. Dos observaciones de **datos** (no defectos de la release):

1. **Basura de pruebas en el catálogo `return_type` (nube).** De 12 tipos, 8 están borrados (`co_operation='D'`): además de la basura evidente ("hola", "prueba" ×2, "problemas", "Prueba Tovar"), están borrados **tres tipos de aspecto legítimo — `Despacho` (53), `Vencidos` (61) y `Falla` (62)**. La app se comporta bien (solo baja los 4 activos), pero conviene que el cliente confirme si esos tres debían estar activos. No afecta ningún caso.
2. **Tres clientes homónimos "MINIMARKET BICENTENARIA"** en la cartera de `VE0002` (`J409215121`, `J504480975`, `J505383973`), distinguibles solo por `co_client` y por el sufijo de ciudad. Riesgo operativo para el vendedor en pantalla, no defecto de la app.

*Sin adjuntos por instrucción de QA: no se usó el mock de cámara ni se adjuntó imagen/archivo/firma en ningún caso. El envío procedió igual con `signatureReturn=true` (`nuAttachments:0`), consistente con dm-electronica/ferrenuestro/latino.*

**TRAZA:** no aplica (sin `QA_MODE=record`).

---

## Verificación BD (payload ↔ nube) — Agente BD, cotejo campo-a-campo automático

| co_x | Marca | Campos cabecera | Hijas (payload/nube) | Mismatches | Notas |
|---|---|---|---|---|---|
| `1786997229819.0` (Ref 178) | **BD-FIELD-OK** | **13/13 OK** | `return_detail` 1/1 OK | **0** | 1 (zona horaria en `da_return`) |

**Cabecera (13/13):** `co_return`, `da_return`, `na_responsible`, `nu_seal`, `id_type`, `tx_description`,
`id_user`, `co_client`, `id_client`, `co_enterprise`, `id_enterprise`, `nu_attachments`, `has_attachments`
— todos coinciden payload↔nube.

**Línea única (9/9):** `51104106` BALLS BLANCO 10X1KG × **3 BUL**, factura `FACT50029953`, `id_motive=49`.
Incluye `qu_product` 3 vs `3.0000` (formato decimal de la BD, no es diferencia).

### Notas de calibración

1. `da_return`: hora local UTC-4 vs nube UTC ⇒ **nota**, no mismatch.
2. ✅ `nu_lote` / `da_duedate` **no entraron en el cotejo** (vacíos en el payload, regla payload-driven) —
   consistente con que `expirationBatch` **no los exige** en este módulo. **Confirmación automática** de lo que
   el agente UI midió a mano.
3. ✅ `coInvoice` / `idInvoice` (NULL) **no se reportaron como mismatch** — consistente con que el Nro. de
   factura **no se valida** contra facturas reales en este módulo.
4. La devolución **eliminada** (`co_return` 1786998000721.0, DM-DEV-024, factura inventada
   `ZZZ-NO-EXISTE-999`) **no está en `_payloads.jsonl`** ⇒ nunca se envió, no aplica cotejo.
5. 🆕 **3.ª corrida del motor contra el esquema de `kron`** (tras clientes y pedidos): el config `return`
   **no requirió ajustes**, igual que los anteriores.

**Conteo por marca:** BD-FIELD-OK 1 · BD-FIELD-MISMATCH 0 · BD-SAVED 0 · BD-N/A 0.

> Coincide con el cotejo manual 16/16 del agente UI: dos métodos independientes, mismo veredicto.
