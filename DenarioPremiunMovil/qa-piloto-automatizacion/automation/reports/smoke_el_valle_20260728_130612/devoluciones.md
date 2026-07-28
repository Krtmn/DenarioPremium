# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260728_130612_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente / Playa | el_valle — **La Tortuga** (`denariolatortuga.ddns.net:8081/PremiumWS`) |
| Empresa | PROCESADORA DE ALIMENTOS COVADONGA,C.A (idEnterprise 1 · co 00001) |
| App | `com.kiberno.denarioPremiumPro` — v1.0 · db_version 19 · **`window.ng=true`** |
| Vendedor | id_user 319 |
| Resultado | **13 PASS · 0 FAIL · 0 SKIP · 1 N/A · 0 BLOCKED** |
| Wall-clock | ~23 min · 0 cuelgues de CDP · 0 crashes de app |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | Tile Devoluciones → `app-devoluciones`; botones **DEVOLUCIÓN** y **BUSCAR** visibles |
| DM-DEV-002 | ✅ PASS | Form abre en `devolucion-general`; tabs **Productos/Adjuntos `disabled=true`** sin cliente; Guardar/Enviar disabled; Empresa preseleccionada y **bloqueada** |
| DM-DEV-004 | ✅ PASS | Cliente ARMAS DEL ROSARIO, C.A (idClient 2862 · J404786856) → 3 tabs habilitan **sin factura**; **NO existe `#invoiceSelect`** (coherente con `validateReturn=false`) |
| DM-DEV-006 | ✅ PASS | Responsable/Precinto/Comentario aceptan valor; Tipo = 4 opciones en popover: **Calidad 60 (default) · Cambio X Cambio 63 · PostVenta 52 · Servicio 59** |
| DM-DEV-011 | 🚫 N/A | `validateReturn=false` ⇒ no hay selector de factura que habilite tabs. El Nro. de factura se tipea por producto (`requeridedNroFactura=true`) — cubierto en DM-DEV-014 |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO → familias inline (EMBUTIDOS 66 · LACTEOS 9 · PRODUCTO FRESCO EN VENTA 5) → ALAS DE POLLO (C0051) → acordeón expande con Lote/Nro.Factura/Cantidad/Fecha Venc/Unidad/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 + Nro.Factura P00004560 ⇒ **`imagenEnviar` pasa de `disabled=true` a `false`** |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: acordeones **`images` (Imágenes)** + **`file` (Archivo)** + **`sign` (Firma)**, canvas 280×220 — las 3 VGs activas |
| DM-DEV-016 | ✅ PASS | Alert `Denario Devolución` · **"¡Su Devolución se ha guardado!"** · botón **OK** |
| DM-DEV-018 | ✅ PASS | 3 alerts: "¿Desea enviar la devolución?" (Cancelar/**Aceptar**) → "¡Su Devolución será enviada!" (OK) → **"Devolución nro. 177 enviada exitosamente"** (OK) → vuelve al home del módulo |
| DM-DEV-019 | ✅ PASS | Lista BUSCAR: `Nro. Ref: 177 · Cliente: J404786856 - ARMAS DEL ROSARIO, C.A · Estatus: Enviado · Fecha: 28/07/2026` |
| DM-DEV-021 | ✅ PASS | Searchbar filtra en tiempo real: `ZZZZNOEXISTE`→0 ítems · `ARMAS`→1 · vacío→1. **Trash solo en Guardado** (Ref 0 con trash; Ref 177 Enviado sin trash) |
| DM-DEV-022 | ✅ PASS | Devolución Guardada reabre **editable**: 3 tabs accesibles, `readonly=false`/`disabled=false` en todos los campos; valores persistidos 1:1 (§9) |
| DM-DEV-024 | ✅ PASS | Trash → alert "¿Desea eliminar la devolución?" (Cancelar/**Eliminar**) → el ítem **desaparece** de la lista (sin alert de éxito posterior) |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **177** | ARMAS DEL ROSARIO, C.A · Calidad · ALAS DE POLLO (C0051) ×2 · lote LOTE-QA-728 · fact. P00004560 · venc. 31/12/2026 · motivo 36 Empaque Sucio (Inocuidad) · precinto PRE-20260728 | **Enviado** — BD-OK (`id_return=177`, `st_return=1`) |
| — (Ref 0) | ARMAS DEL ROSARIO, C.A · Calidad · COSTILLA CHINA DE CERDO (C0003) ×3 · lote LOTE-GUARD-728 · fact. P00004427 · motivo 37 Empaque Mojado · precinto PRE-GUARDADA-728 · `co_return 1785270272470.0` | Creada Guardada como insumo de DM-DEV-022/024 y **eliminada** en DM-DEV-024 (no llegó a la nube — correcto) |

## Verificación BD (RUNTIME §10 / §10.b)

**Baseline** (antes del módulo): `return` = 1 fila · `max(id_return)=176`.
**Diff tras Enviar** (poll ~10 s): 1 fila nueva → **`id_return=177`** ⇒ **sync a nube INMEDIATA** (no diferida).

Cabecera `return` (id 177):

| Campo | Valor en nube | UI |
|---|---|---|
| `co_return` | 1785269255502.0 | — |
| `id_client` / `co_client` / `na_client` | 2862 / J404786856 / ARMAS DEL ROSARIO, C.A | ✅ |
| `st_return` | **1 = Enviado** | ✅ |
| `id_type` | **60** (Calidad) | ✅ |
| `na_responsible` | QA AUTOMATIZACION | ✅ |
| `nu_seal` | PRE-20260728 | ✅ |
| `tx_description` | Devolucion QA smoke el_valle 20260728 | ✅ (comentario) |
| `id_enterprise` / `co_enterprise` | 1 / 00001 | ✅ |
| `coordenada` | 11.0490577,-63.8649833 | ✅ GPS (`userMustActivateGPS=true`) |
| `has_attachments` / `nu_attachments` | false / 0 | firma NO requerida pese a `signatureReturn=true` |
| `nu_amount` / `co_type` / `co_currency` | null | consistente con piercar/dm-electronica/latino — **no es mismatch** |

Detalle `return_detail` (1 fila, `co_detail=2`):

| Campo | Valor en nube | UI |
|---|---|---|
| `co_product` / `na_product` | C0051 / ALAS DE POLLO | ✅ |
| `qu_product` | 2.0000 | ✅ |
| `nu_lote` | LOTE-QA-728 | ✅ |
| `co_document` | **P00004560** | ✅ (Nro. factura tipeado) |
| `da_duedate` | 2026-12-31T04:00:00Z | ✅ (31/12/2026, offset UTC-4 → nota, no mismatch) |
| `id_motive` | **36** (Empaque Sucio · Inocuidad) | ✅ |
| `co_measure_unit` / `na_measure_unit` | PZA / PIEZA | ✅ |
| `nu_price` / `nu_amount` | null | la web no muestra montos en devoluciones — esperado |

**Marca: `BD-OK` · `BD-FIELD-OK` (14 campos de cabecera + 10 de detalle, todos los llenos cuadran).**
**Conclusión guardado→enviado: ✅** — lo guardado se envió, completo y sin duplicados.

- **Local: `BD-N/A`** — `sqlite3` no existe en el device (build La Tortuga v1.0), `local-query.js` falla siempre. Degradado al primer intento según lo previsto; el cotejo se resolvió por nube + payload + UI.
- **Payload:** hook `nativePromise` capturó `POST .../returnservice/return` ✅ (confirma que el gap de captura no aplica a `return` en este build).
- Manifiesto anexado a `_bd-manifest.jsonl` (`co_x = 1785269255502.0`, `action: sent`).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **`ion-icon[name="arrow-back-outline"]` dentro del selector de productos** | universal *(candidato)* | Vuelve de la lista de productos a la lista de **familias** sin salir del form. Junto a él vive `ion-icon[name="search-circle-sharp"]` (buscador de productos). Evita tener que abandonar el formulario cuando se entra a la familia equivocada |
| **Orden de ion-inputs del acordeón con `validateReturn=false`** | universal — **2.ª confirmación** (ferrenuestro-20260723 + el_valle) | idx0=**Lote** (plain) · idx1=**Nro. Factura** (`inp-write`, text, requerido, viaja como `co_document`) · idx2=**Cantidad** (`inp-write`, **type=number**). Selects: Unidad · Motivo |
| **Fecha de vencimiento del lote = `ion-modal.fechasModal` + `ion-datetime[presentation=date]` SIN botones** | universal *(candidato)* | El botón "Fecha" del acordeón abre `fechasModal`; el `ion-datetime` **no tiene botones de confirmación**: basta `dt.value=ISO` + `ionChange`/`ionValueChange` + `dt.confirm(ISO)` y **el modal se cierra solo**. El botón pasa a mostrar la fecha (`31/12/2026`) |
| **`setClientfromSelector` NO dispara alert en form fresco** | universal — refina `[latino_cosmetica][ferrenuestro-20260723]` | En un formulario nuevo, `general.setClientfromSelector(obj)` fija cliente + habilita tabs y **el `#clienteSelectModal` se cierra solo**, sin alert. El alert "Se ha detectado cambio del cliente…" (Cancelar/Aceptar) solo aparece si ya había un cliente fijado |
| **⚠ Click real sobre `#clienteSelectModal ion-item` es POCO FIABLE** | universal *(candidato)* | El click por coordenadas sobre el ítem seleccionó **un cliente vecino** (la lista es alfabética y re-renderiza tras `scrollIntoView`) y disparó el alert de cambio de cliente. **Vía recomendada: abrir el modal con click en `ion-input#clienteSelect` y fijar el cliente por `setClientfromSelector`** |
| **Familias de devolución ≠ catálogo de pedidos** | cliente (el_valle) | Solo 3 familias devolvibles: EMBUTIDOS (PRODUCTOS TERMINADOS) 66 · LACTEOS 9 · **PRODUCTO FRESCO EN VENTA 5**. `ALAS DE POLLO` (C0051) y `COSTILLA CHINA DE CERDO` (C0003) están en **PRODUCTO FRESCO**, no en EMBUTIDOS (E####) |
| **Tipos de devolución el_valle** | cliente (el_valle) | Calidad **60** (default) · **Cambio X Cambio 63** · PostVenta **52** · Servicio **59**. ⚠ el_valle **SÍ tiene CxC** — contrasta con piercar/jerez/dm-electronica/latino (que no lo tienen); alinea con globalmp/don-theo/ferrenuestro |
| **23 motivos de devolución (`id_motive`)** | cliente (el_valle) | 36=Empaque Sucio (Inocuidad) · 37=Empaque Mojado (Inocuidad) · 49=Atuendo ó vestimenta de caleteros (Servicio, **default**) · 45 · 62 · 38 · 52 · 47 · 54 · 57 · 51 · 44 · 56 · 46 · 39 · 40 · 50 · 41 · 43 · 53 · 48 · 55 · 58 |
| **Alerts del módulo (build La Tortuga v1.0)** | universal | Título = `Denario Devolución` (el de éxito de envío usa `Denario Premium`). Guardar → 1 alert **OK**. Enviar → **3 alerts**: confirm (Cancelar/**Aceptar**) → "será enviada" (OK) → "Devolución nro. N enviada exitosamente" (OK). Borrado → "¿Desea eliminar la devolución?" (Cancelar/**Eliminar**), **sin alert de éxito posterior** |
| **Dirty-guard del form DEVOLUCIONES vía `clickBack` funciona** | universal — confirma `[latino_cosmetica][ferrenuestro-20260723]` | `img.fechaAtras`→`closest('a')` + MouseEvent dispara el modal de 3 botones **"Guardar y salir / Salir sin guardar / Cancelar"**. "Salir sin guardar" en una devolución **ya Guardada NO la borra** (correcto, §4) |
| **`co_return` del ítem de producto ≠ `co_return` de la cabecera** | universal — **observación, no defecto** | En memoria, `productList[i].coReturn` lleva el epoch del momento de **agregar el producto** (1785269791877.0) mientras la cabecera lleva el de **apertura del form** (1785269255502.0). Al persistir, `return_detail.co_return` queda correctamente alineado con el de cabecera. No usar el `coReturn` del ítem para el manifiesto |
| **Bootstrap barato de agente: `window.__qaSrc` + `eval`** | universal *(infraestructura)* | `eval` **SÍ está disponible** en el sandbox de `browser_run_code_unsafe` y las `function` declarations del código evaluado se propagan al scope de la llamada. Guardando el prelude una vez en `window.__qaSrc`, cada paso posterior solo necesita `connectOverCDP` + `eval(await pg.evaluate(()=>window.__qaSrc))` — reduce ~10× el tamaño (y el costo en tokens) de cada `browser_run_code_unsafe` |

### Helpers de módulo usados (necesarios para el REPLAY de la traza)

```js
window.__qaDev.setCliente(nombre)   // busca en general.selectorCliente.clientes -> setClientfromSelector + applyChanges
window.__qaDev.accInputs()          // ion-input visibles dentro de ion-accordion (0=Lote 1=NroFactura 2=Cantidad)
window.__qaDev.fillAcc(n, val)      // native value setter + input/change + ionInput/ionChange + blur
window.__qaDev.setSelect(n, v)      // n-esimo ion-select visible del form (0=Unidad|Empresa, 1=Motivo|Tipo segun tab)
```

## Traza (QA_MODE=record)

**TRAZA: 48 ops · 11 casos grabados** → `_trace/devoluciones.trace.json` · `validateTrace()` = `[]` (estructuralmente válida).
Incluye solo casos PASS. **DM-DEV-022/024 quedaron sin ops** (dependen de una 2.ª devolución Guardada creada fuera de la secuencia y de coordenadas relativas del ítem de lista); **DM-DEV-011** es N/A. Se limpiaron del volcado las ops de exploración (familia EMBUTIDOS equivocada + back) y el click no fiable sobre el ítem del modal de clientes. `data` lleva los 14 valores run-específicos.

## Hallazgos

**Sin FAIL.** Observaciones menores (ninguna bloquea):

1. **La UI móvil NO muestra montos** en devoluciones (ni en el acordeón del producto, ni en la lista, ni en el detalle) — coincide con la web y con `nu_price`/`nu_amount` = `null` en BD. No hay divergencia que reportar.
2. **Firma no exigida pese a `signatureReturn=true`**: la devolución se guardó y envió con `nu_attachments=0` / `has_attachments=false`. Comportamiento idéntico a ferrenuestro, dm-electronica y latino_cosmetica ⇒ la VG habilita el acordeón de firma pero **no la vuelve obligatoria**.
3. **Alert "Se ha detectado cambio del cliente"** apareció tras un click por coordenadas en el modal de clientes que seleccionó un vecino de la lista. Es limitación del click sintético (ver patrón arriba), no defecto de la app.
4. El hook de payload registró **4 POST repetidos a `collectionservice/collection`** durante el módulo: son los reintentos del cobro atascado del módulo COBROS (defecto ya reportado a desarrollo). No afectan a devoluciones.

## Estado final

App en **HOME** (`app-home`, `http://localhost/home`). Sin alerts residuales activos. Sin crashes durante todo el módulo.
