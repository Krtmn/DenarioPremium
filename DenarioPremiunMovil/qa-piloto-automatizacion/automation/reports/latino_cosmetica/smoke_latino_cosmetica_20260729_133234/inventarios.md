# Smoke Test — Módulo INVENTARIOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260729_133234_smoke-completo` |
| Módulo | INVENTARIOS |
| Dispositivo | Infinix X6728 (Infinix HOT 60i) · Android 15 · `da9f78b6e785fffc` |
| App | `com.kiberno.denarioPremiumPro` — app_version 1.0 · db_version 19 · `window.ng=true` |
| Playa | isla_coche — `http://denarioislacoche.ddns.net:8081/PremiumWS` |
| Cliente | latino_cosmetica — LATINOCOSMETICA C.A. (`00001`) · usuario 100 / NEIMY PARRA (id_user 477) |
| Resultado | **16 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |
| Watchdog | 0 cuelgues de operación · 1 `CDP-DOWN` recuperado (forward stale, re-mapeado al mismo PID 21744) |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-INV-001 | ✅ PASS | Tile Inventarios → `/inventarios`, `app-inventarios` con botones `INVENTARIO` + `BUSCAR` |
| DM-INV-002 | ✅ PASS | 4 tabs `General/Inventario/Resumen/Adjuntos`; Inventario/Resumen/Adjuntos **disabled** y `ion-input#clienteSelect` vacío (correcto sin cliente) |
| DM-INV-004 | ✅ PASS | `setClientfromSelector(ANNELI CA)` → cliente `ANNELI CA (13)`, las 4 tabs habilitadas (hubo que descartar el `ion-modal` residual primero — quirk conocido) |
| DM-INV-008 | ✅ PASS | Tab Inventario: familias `BELOTTI 74 / BELOTTI COLOR PLUS 0 / PROKPIL 70 / ROIAL 8` + sub-segmentos UBICACIÓN (Exhibición/Depósito) y FILTRO (Todos/Inventariados) + `input[placeholder="Búsqueda de productos"]`; BELOTTI lista 74 productos con código |
| DM-INV-010 | ✅ PASS | Click en `Código: 3058` → `ion-modal.inventory-type-stocks-modal` con Cantidad (number), Lote (text), Fecha de vencimiento (`#expDate0` = hoy), tipo fijo "Exhibición - 1", select UNIDAD, iconos close/checkmark/trash/add |
| DM-INV-011 | ✅ PASS | `fillNgModelKeyboard`: cantidad `6`, lote `QA0729` reflejados en el modal; `#expDate0=2026-07-29T04:00:00`. El payload posterior confirma que el **ngModel** tomó ambos (`quStock:6`, `nuBatch:"QA0729"`) |
| DM-INV-012 | ✅ PASS | `checkmark-outline` → modal cierra sin alert de validación; producto queda `Inventariado: Exhibición` |
| DM-INV-016 | ✅ PASS | Tab Resumen: tabla `Sel/Código/Producto/Exhibición/Depósito/Acción` → `3058 · BELOTTI ACOND CEBOLLA X 300 ML · 6 UNIDAD · Depósito -` |
| DM-INV-017 | ✅ PASS | `ion-button.botonAddAmarillo` presente (VG `false` — divergencia ya documentada, no es hallazgo nuevo) → abre `inventario-sugerido-modal`: `Días desde último Inventario: 1 / Días para siguiente Inventario: 1 / 3058 - BELOTTI ACOND CEBOLLA X 300 ML`. Cerrado con `dismiss(null,'cancel')` — **no se creó pedido** (`/inventarios` intacto, captura conservada) |
| DM-INV-020 | ✅ PASS | `Días para siguiente Inventario: 1` visible en el modal sugerido (no en Tab General) y corroborado en el payload: `daysSinceLast:1`, `daysUntilNext:1` |
| DM-INV-021 | ✅ PASS | Guardar → `¿Desea guardar el Inventario?` [Cancelar/Aceptar] → **`Inventario guardado con éxito`** [OK]. No navega fuera del form (conocido). En BUSCAR aparece `Nro. Ref.: 0 · 13 - ANNELI CA · Estatus: Guardado · 29/07/2026` |
| DM-INV-022 | ✅ PASS | Enviar → `¿Desea enviar el Inventario?` → `El Inventario será enviado` → **`Inventario nro. 18 enviado exitosamente`** → navega al home de inventarios. **Sin crash.** POST `clientstockservice/clientstock` capturado |
| DM-INV-023 | ✅ PASS | BUSCAR lista 14-15 ítems con `Nro. Ref. / Cliente / Estatus / Fecha`; Ref 18 visible como **Enviado** |
| DM-INV-025 | ✅ PASS | Searchbar `Inventarios...` filtra en tiempo real: 14 → `SPECTRAS` 4 → `ZZZZZ` 0 → vacío 14 |
| DM-INV-026 | ✅ PASS | Click en el Guardado **SÍ abre el formulario** (cliente `ANNELI CA (13)`, 4 tabs, capturas cargadas). Abre en tab **General** en lugar de Inventario = **defecto conocido cosmético**, no re-marcado FAIL |
| DM-INV-028 | ✅ PASS | Trash `ion-button[color="danger"]` del Guardado → **`¡EL Inventario se borro con exito!`** directo sin confirmación previa → lista 15 → 14, Ref 0 desaparece; BD local queda con **0** guardados |

## Registros creados en sistema

| Ref (servidor) | Caso | Cliente | Productos y cantidades | Lote / Venc. | Estado |
|-----|------|---------|------------------------|--------------|--------|
| **18** | DM-INV-022 | ANNELI CA (co 13 · idClient 34) | `3058` BELOTTI ACOND CEBOLLA X 300 ML — **6 UNIDAD** (Exhibición) | `QA0729` / 29-07-2026 | ✅ **Enviado** (`id_client_stock=18`, `st_delivery=1`) |
| — (Ref 0, temporal) | DM-INV-021/028 | ANNELI CA (co 13) | `3058` BELOTTI ACOND CEBOLLA X 300 ML — **2 UNIDAD** (Exhibición), lote vacío | — | 🗑 Guardado y **borrado** en DM-INV-028 (registro de prueba del borrado, no llegó a enviarse) |

> ℹ️ **El manifiesto ya traía dos inventarios de esta misma corrida**, de **intentos previos de este módulo interrumpidos por el reinicio de la app** (no son de otro módulo ni de QA a mano): **Ref 16** (ANNELI CA · 3058 ×5 UND · lote QA0729 · 14:39) y **Ref 17** (ANNELI CA · 3058 ×6 · 15:30). Ninguno de esos intentos dejó reporte ni ledger. La capa web debería evaluar **las 3 Refs: 16, 17 y 18** — todas de latino_cosmetica / ANNELI CA / producto 3058.

**Guardados pendientes de envío manual:** ninguno (regla de adjuntos no aplicó — inventarios no exige adjunto en esta playa; `nuAttachments:0`, `hasAttachments:"false"`, y Enviar funcionó sin tocar la cámara).

## Verificación BD

- **Nube:** `BD-N/A` — BD de latino_cosmetica **sin GRANT** (0/185 tablas). No se gastaron intentos. La llegada a la nube la evalúa la capa web por **Nro.Ref 18**.
- **Local (device, vía `window.sqlitePlugin`):**
  - `client_stocks` → `co_client_stock=1785360333631.0`, **`id_client_stock=18`**, **`st_delivery=1`** ⇒ el servidor devolvió su PK y el registro quedó marcado como enviado.
  - `pending_transactions = 0` · `failed_transactions = 0` ⇒ nada atascado ni rechazado.
  - Guardados residuales (`st_delivery=3` o `id=0`) = **0** tras DM-INV-028 ⇒ el trash borra de verdad, no solo de la lista.
  - **Conclusión guardado→enviado: ✅ confirmado (BD-OK local).** Marca formal del manifiesto = `BD-N/A` por la nube sin GRANT.
- **Payload** (`_payloads.jsonl`, 1 línea): `quStock:6`, `nuBatch:"QA0729"`, `daExpiration:"2026-07-29T04:00:00"`, `coUnit:"UND"`/`naUnit:"UNIDAD"`, `ubicacion:"exh"`, `idClient:34`, `coEnterprise:"00001"`, `daysSinceLast:1`, `daysUntilNext:1`.
  ⚠ El payload manda `stClientStock:0` y `stDelivery:2` — **corroborar por `id_client_stock` + `st_delivery` local**, no por el `st` del payload (mismo caveat que la corrida del 14/07).
- **Round-trip §9:** Guardar → reabrir desde BUSCAR → **cantidad 6, lote `QA0729` y fecha 29/07/2026 idénticos**, y Resumen `6 UNIDAD`. Sin divergencias silenciosas.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| 🔴 **`ion-loading` se apila SOBRE el `ion-alert` y su backdrop se come el click** | universal | `ion-loading` `z-index:40015` vs `ion-alert` `z-index:20016`: `alertButtonCoords` da coords válidas pero `elementFromPoint` cae en `ION-BACKDROP.sc-ion-loading-md … backdrop-no-tappable` ⇒ el alert **no se cierra nunca** y reaparece idéntico en cada intento (3 iteraciones perdidas antes de diagnosticarlo). Fix: `await l.dismiss()` de todo `ion-loading` visible **antes** de clickear un botón de alert. **Ya promovido a `_comunes.md`** |
| **El 1.er click en INVENTARIO no abre el formulario** (por el alert de geolocalización) | cliente (isla_coche v1.0) | El 1.er click se consume mostrando `¡Alerta! / Para poder grabar la ubicación…` y la app queda en el home de inventarios; hay que despachar loading+alert y **re-clickear** INVENTARIO. Patrón fiable: click → bucle ≤8×1,5 s {dismiss loading + Aceptar} hasta `ion-segment-button` visibles. **Ya promovido a `inventarios.md`** |
| ✅ **La lista BUSCAR SÍ navega — revierte el BLOCKED de el_valle** | universal *(con `window.ng=true`)* | Dispatch Pointer+Mouse sobre el `ion-item` **+** `mouse.click` en el centro del **`ion-label`** (no del `ion-item`) abre el Guardado en ~4 s. Contradice `[el_valle-20260728]` y **desbloquea DM-INV-026**. **Ya promovido a `inventarios.md`** |
| **Envío = 3 alertas; la 3.ª trae el Nro.Ref** | universal *(candidato)* | `¿Desea enviar…?` → `El Inventario será enviado` → **`Inventario nro. <REF> enviado exitosamente`**. La Ref del servidor se obtiene sin volver a la lista. **Ya promovido a `inventarios.md`** |
| **Tablas locales: `client_stocks` / `client_stocks_details` / `client_stocks_details_units`** | universal | Doble plural en las hijas; el smoke sugería `client_stock_detail` (nombre de la **nube**). Un nombre errado **aborta toda la transacción** sqlitePlugin y se pierden las demás queries del batch. **Ya promovido a `inventarios.md`** |
| `inventario-sugerido-modal` **sin** línea "Sugerido UNIDADES: N" | cliente | Solo `Moneda:` + días + `<cod> - <producto>` + ACEPTAR. Coherente con `suggestedOrderByDispatchAndReturn=false`. Además **se abre DUPLICADO** si se hace dispatch Pointer+Mouse *y* `mouse.click`: descartar ambas instancias. **Ya promovido a `inventarios.md`** |
| Reconfirmado: `ion-modal` residual mantiene tabs `disabled` **y** el campo cliente vacío | universal | Tras `setClientfromSelector` el snapshot inmediato daba `cliente=""` + 3 tabs DIS; `dismiss(null,'cancel')` + ~1,2 s → `ANNELI CA (13)` y 4 tabs OK. **No juzgar DM-INV-004 por el snapshot inmediato** |
| Reconfirmado: `expirationBatch=false` = validación, no visibilidad | universal | 2.ª captura aceptada con **lote vacío** (`nuBatch` sin valor) y campos igualmente renderizados |
| `setClientfromSelector` **no** dispara alert de deuda en INVENTARIOS | cliente/módulo | En PEDIDOS (misma corrida, mismo cliente ANNELI CA) sí dispara "deuda vencida"; en inventarios no hay alert. El bucle de alerts igual debe estar por si aparece |

## Hallazgos

**Sin FAIL.** Ningún defecto nuevo de la app. Observaciones:

1. ℹ️ **DM-INV-026 (defecto conocido) reconfirmado**: el formulario Guardado reabre en tab **General** en vez de Inventario. Cosmético, no FAIL. Novedad útil: **esta corrida sí pudo evaluarlo** (en el_valle quedó BLOCKED por no poder navegar la lista).
2. ℹ️ **Botón PEDIDO SUGERIDO con `suggestedOrderByDispatchAndReturn=false`** — 6.ª playa con la misma divergencia UI-vs-config. Ya documentado; sigue pendiente de VERIFICAR con desarrollo (sospecha: la VG que gobierna el botón sería `suggestedOrder`). No se levanta como hallazgo nuevo.
3. ⚠️ **Riesgo de automatización (no de app): el `ion-loading` sobre el `ion-alert`.** Consumió 3 intentos y un tramo del módulo. Ya está en `_comunes.md` como chequeo obligatorio previo a cualquier click sobre alertas.
4. ℹ️ **Baseline al empezar: max Ref = 17** → el inventario de esta pasada es el **18**. Las Refs **16 y 17** (ANNELI CA, producto 3058, 14:39 y 15:30) son de **intentos previos de este mismo módulo** cortados por el reinicio de la app: ya estaban en `_bd-manifest.jsonl` pero sin reporte ni ledger. Se dejan tal cual (son envíos reales y persistieron); este reporte cubre los 16 casos completos y la Ref 18. Refs 14-15 (otros clientes) son ajenas al módulo.
