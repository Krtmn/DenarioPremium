# BUGS.md — Incidencias mapeadas (Denario Premium Mobile)

Fuente de verdad de bugs ya diagnosticados/resueltos.  
Reglas cortas de prevención: `.cursor/rules/bug-prevention.mdc`.  
Contexto operativo de dominio: `AGENTS.md`.

Formato por entrada: síntoma → causa → fix → cómo evitar → archivos → estado.

---

## [COB-TR-001] Transferencia: Enviar OFF con monto exacto (`clientBankAccount`)

- **Síntoma:** Con Transferencia y monto exacto, Enviar no se habilitaba; con exceso sí (anticipo automático).
- **Causa:** `isTransferenciaPaymentComplete` exigía siempre `nuevaCuenta` cuando `clientBankAccount=true`, aunque el usuario hubiera elegido cuenta existente (`numeroCuentaCliente`).
- **Fix:** Exigir `nuevaCuenta` solo si `showNuevaCuenta`; si no, exigir `numeroCuentaCliente`. Con `clientBankAccount=false` no pedir emisor.
- **Evitar:** No acoplar completitud TR a “Nueva Cuenta” salvo ese modo UI. Probar monto exacto y exceso por separado.
- **Archivos:** `collection-logic.service.ts` (`isTransferenciaPaymentComplete`, `hasIncompletePaymentMethods`).
- **Estado:** fixed (`86d9de56` y cherry-picks relacionados).

---

## [COB-TR-002] Bajar monto dejaba Enviar ON

- **Síntoma:** Tras habilitar Enviar, al bajar el monto el botón seguía ON sin revalidar.
- **Causa:** `setMonto` / flujo de UI reactivaba o no forzaba revalidación completa de tolerancia/completitud.
- **Fix:** Al cambiar monto, no forzar ON; revalidar vía `validateToSend` / tolerancia.
- **Evitar:** Cualquier path que haga `onCollectionValidToSend(true)` al editar monto sin pasar por validación completa.
- **Archivos:** `cobro-pagos.component.ts`, `collection-logic.service.ts`.
- **Estado:** fixed (`d6653e86`).

---

## [COB-TR-003] Guardar → reabrir Transferencia: Enviar OFF

- **Síntoma:** Cobro TR válido, tras guardar y reabrir, Enviar en OFF.
- **Causa:** En `loadPayments` case `'tr'`, mapeo invertido emisor/receptor (`numeroCuenta` ← `nuClientBankAccount`, etc.) y pickers sin restaurar.
- **Fix:** `buildHydratedTransferenciaPayment`: receptor ← `nuBankAccount`, emisor ← `nuClientBankAccount`; restaurar `bankAccountSelected` / `clientBankAccountSelected`.
- **Evitar:** Al hidratar TR, respetar contrato SQLite↔UI (ver `AGENTS.md` sección Cobros). No invertir campos “por simetría” con Depósito/PM.
- **Archivos:** `cobro-general.component.ts`.
- **Estado:** fixed (`714cd04d`). Fase 2 pendiente: Nueva Cuenta + carreras al reabrir.

---

## [COB-TR-004] Enviar ON con monto muy bajo (ej. 0.1) — no es bug de TR

- **Síntoma:** Con 0.1 ya se habilita Enviar.
- **Causa:** `tolerancia0=true`, `TipoTolerancia=0`, `RangoToleranciaNegativa` grande (ej. 100000): `checkTolerancia` habilita si el faltante ≤ rango; solo bloquea `montoTotalPagado <= 0`.
- **Fix:** Ninguno de código si el negocio acepta esa config. Ajustar rangos de tolerancia en config empresa.
- **Evitar:** No diagnosticar como bug de Transferencia/completitud sin revisar `tolerancia0` y rangos. Recordar bypass de `createAutomatedPrepaid` en exceso.
- **Archivos:** `collection-logic.service.ts` (`checkTolerancia`, `validateToSend`, `onCollectionValidToSend`).
- **Estado:** documented (comportamiento por config).

---

## [COB-RET-001] Retención multi-documento permite enviar con docs en blanco

- **Síntoma:** Módulo Retención (`coType`/`coTypeModule` = `2`): con 2+ facturas seleccionadas, completar retención solo en una y dejar otra en 0 permite Enviar/Guardar; el documento vacío viaja sin monto/comprobante/fecha.
- **Causa:** `validateToSend` (rama `coType == '2'`) solo exigía suma global `getDetailRetentionTotal` > 0. El header `sendOrSave` para tipo 2 validaba adjuntos, no completitud por documento.
- **Fix:** Helpers `isRetentionDetailComplete` / `areAllRetentionDetailsComplete` (monto > 0 + voucher/fecha legacy o líneas dinámicas con `idCollectRetention` y `validateRetentionVoucherValue`). `validateToSend` usa el helper (reemplaza criterio de suma). Header bloquea **Enviar** con alerta si algún detalle está incompleto (Guardar permitido tras General válida; ver COB-SAVE-001). Lista vacía → incompleto.
- **Evitar:** No habilitar Enviar en retención solo por suma > 0; cada documento seleccionado debe estar completo.
- **Archivos:** `collection-logic.service.ts`, `cobros-header.component.ts`, `collection-logic.service.spec.ts`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-PREPAID-001] Anticipo automático no dispara en USD (sí en BS)

- **Síntoma:** Con `prepaidRangeAmount=1` USD, cobro USD (ej. a pagar 333.46, pagado 335 → excedente ~1.54) no crea anticipo. En BS con excedente >= mínimo sí. Montos irreales enormes sí reaccionan.
- **Causa:** `getPrepaidExcessAmount` anulaba el excedente si `isPositiveExcessWithinTolerance` (misma regla que Enviar: `tolerancia0` + `MonedaTolerancia` + `RangoToleranciaPositiva` alto). En USD el sobrante “normal” quedaba en 0 y nunca superaba el umbral de anticipo; en BS la moneda ≠ `MonedaTolerancia` y el filtro no aplicaba.
- **Fix:** Desacoplar: anticipo solo usa excedente > 0 vs `prepaidRangeAmount` (`>=`); tolerancia sigue solo en `checkTolerancia` (Enviar).
- **Evitar:** No reutilizar rangos de tolerancia positiva para decidir anticipo automático.
- **Archivos:** `collection-logic.service.ts` (`getPrepaidExcessAmount`, `resolveAutomatedPrepaid`).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-PREPAID-002] Anticipo automático no se envía con el cobro (queda ~5 min)

- **Síntoma:** Al Enviar cobro normal con anticipo automático, el cobro sale de inmediato (o queda Por Enviar) pero el anticipo no se encola/envía hasta el siguiente BackgroundSync (~5 min). Offline: anticipo puede no aparecer como Por Enviar junto al cobro.
- **Causa:** `saveSend` del cobro hacía `insertPending` + `runPendingQueue` primero; el anticipo se creaba después y su `runPendingQueue` se descartaba por `isProcessingPending` (sin reintento).
- **Fix:** (B) Enviar cobro normal: persistir → `refreshAutomatedPrepaidBeforeSend` → `createAnticipo*(…, enqueuePending=false)` → `insertPendingTransactionBatch([cobro, anticipo?])` + un `runPendingQueue`. (C) AutoSend: si `runPendingQueue` llega con cola ocupada → dirty-requeue acotado al terminar el pase (mutex intacto).
- **Evitar:** No encolar cobro y anticipo en dos `saveSend`/`runPendingQueue` separados sin dirty-requeue. No fusionar en 1 POST WS. No tocar umbral `prepaidRangeAmount` (COB-PREPAID-001).
- **Archivos:** `cobros-header.component.ts`, `collection-logic.service.ts`, `auto-send.service.ts` (+ specs).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [CLI-SALDOS-001] Lista vs detalle: Saldo USD/BS cruzados

- **Síntoma:** GLOBAL MP / AS04: Saldo USD **2,84** (BS mal rotulado 2.096,23). Correcto: USD **2.096,23** / BS **≈1.546.766**.
- **Causa (QA):** `clients.co_currency='BS'` pero `nu_balance`/docs en USD. La app particionaba saldos por `c.co_currency` y convertía de más (`2.096,23 / tasa ≈ 2,84`).
- **Fix (blindaje app, display-only):**
  - SQL lista/búsqueda/detalle: Saldo = buckets `document_sales` **local/hard** filtrados por **empresa**; no particionar por `c.co_currency`; no pisar `coCurrency` con moneda de un doc.
  - `fixClientListSaldos` / selector: `resolveClientBalanceTotals(..., true)`; **no muta** `coCurrency`.
  - Lista/selector etiquetan Saldo local/hard (como detalle). Detalle usa la misma semántica.
  - `goToClient` no convierte `saldo1` (los buckets ya vienen de docs).
  - Maestro GLOBAL MP sigue recomendado (`co_currency` alineado al saldo); crédito puede seguir con etiqueta de cliente.
- **Evitar:** mutar `client.coCurrency` globalmente; mappers grandes; tocar Cobros/Pedidos.
- **Archivos:** `clientes-database-services.service.ts`, `client-logic.service.ts`, `cliente-selector`, `client-list` HTML, `client-detail`.
- **Estado:** blindaje en app; validar AS04 + un cliente con docs en moneda local.

---

## [CLI-CREDIT-001] Detalle: Crédito Bs/$ cruzados (Saldo OK)

- **Síntoma:** En detalle de cliente, Saldo local/hard está bien; Crédito/Crédito disponible muestran Bs donde va $ y viceversa.
- **Causa:** Tras CLI-SALDOS-001, Saldo etiqueta fijo `localCurrency`/`hardCurrency`. Crédito seguía rotulando por `client.coCurrency` y su opuesta (y restaba `saldo1+saldo2` mezclados).
- **Fix (display-only):** `initializeClientCredits` convierte el límite a local/hard y resta el saldo de la misma moneda. No muta `coCurrency`.
- **Evitar:** no etiquetar crédito con `coCurrency` del maestro si la pantalla de Saldo ya es local/hard.
- **Archivos:** `client-detail.component.ts/.html` (+ spec).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-DOCS-001] Pagos parciales perdidos al paginar Documentos

- **Síntoma:** En Cobros (Normal / 25%), parciales en página 1 no suman en Pago tras ir a página 2 (y viceversa).
- **Causa:** `getDocumentsSales` hace `clearDocumentSalesState`; `addSelectedDocumentsSales` solo reinyectaba desde SQLite `collection_details` (cobro nuevo no tiene filas). `calculatePayment` iteraba solo `documentSales` de la página actual.
- **Fix:** Sumar desde `collection.collectionDetails` (`accumulateAmountToPayFromCollectionDetails`); reinyectar seleccionados en memoria (`addSelectedDocumentsSalesFromMemory`); restaurar `inPaymentPartial`/`nuAmountPaid` en `applyExistingSelection`; alinear helpers `resolvePersisted*`.
- **Evitar:** No acoplar totales de Pago a la página visible. No inventar un Map paralelo a `collectionDetails`. Parciales tipados sin Guardar en el modal siguen fuera de alcance.
- **Archivos:** `collection-logic.service.ts`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-DISC-001] Descuento manual de un documento aparece en otros al reabrir

- **Síntoma:** Cobro guardado con Descuento manual solo en doc A; al reabrir y abrir lupa de doc B, UI muestra "Descuentos Seleccionados: Descuento manual: X" aunque Total Descuento de B sea 0.
- **Causa:** En reopen (`cobros-list`), los descuentos se adjuntaban con `d.coCollection === detail.coCollection` (compartido por todos los details). Además `openDocumentSale` llamaba `setCollectionDetailDiscounts` y podía reescribir el manual en el doc abierto.
- **Fix:** `attachCollectionDetailDiscountsToDetails` por `normalizeCoDocument`; usarlo en lista y `prepareCollectionDetailsForSend`; hidratar UI solo con `checkCollectDiscount`; `clearDocumentDiscountUiState` al abrir/cerrar detalle.
- **Evitar:** No adjuntar hijos de detalle (descuentos/retenciones) solo por `coCollection`. No mutar `collectionDetailDiscounts` al abrir la lupa.
- **Archivos:** `collection-logic.service.ts`, `cobros-list.component.ts`, `cobro-documents.component.ts`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-SAVE-001] Guardar deshabilitado tras General válida (pagos incompletos)

- **Síntoma:** Con pestaña General completa, el botón Guardar permanece OFF al agregar método de pago vacío, documentos sin pagar o retención incompleta.
- **Causa:** `blockSaveAndSendForInvalidPayments`, `validateToSend` y `sendOrSave` acoplaban Guardar a completitud de pagos/documentos/retención (misma regla que Enviar).
- **Fix:** `updateSaveButtonAvailability()` + `generalTabValidForSave` (desde `unlockTabs`/`onCollectionValid`). Pagos incompletos solo bloquean Enviar. Header: validaciones de pago/retención solo en rama `sendOrSave === true`. Slots vacíos siguen filtrándose al persistir (`getNonEmptyCollectionPayments`).
- **Evitar:** No volver a llamar `onCollectionValidToSave(false)` desde `validateToSend` por pagos/referencias. No bloquear Guardar en retención multi-doc (solo Enviar).
- **Archivos:** `collection-logic.service.ts`, `cobros-header.component.ts`, `collection-logic.service.spec.ts`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-SAVE-002] Guardar permanece ON tras guardar sin cambios

- **Síntoma:** Tras pulsar Guardar (sin salir), el botón sigue habilitado aunque no hubo más ediciones; al reabrir borrador igual.
- **Causa:** `updateSaveButtonAvailability` solo miraba General válida (COB-SAVE-001); no usaba `collectionPersistedBaseline` / `collectionDirtySincePersist`. `validateToSend` marcaba dirty en cada recálculo.
- **Fix:** `hasChangesToSave = !collectionPersistedBaseline || collectionDirtySincePersist` en `updateSaveButtonAvailability`. `notifyCollectionEdited()` para acciones de usuario; quitar dirty de `validateToSend`. Wiring en Pagos/General/Documents/Total/header adjuntos.
- **Evitar:** No llamar `markCollectionDirty` desde hidratación/reapertura (`pauseCollectionDirtyTracking`, `recentOpenCollect`). No reactivar Guardar con `validateToSend` solo.
- **Archivos:** `collection-logic.service.ts`, `cobro-pagos/general/documents/total`, `cobros-header.component.ts`, specs + smoke #12.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-FALT-001] Pagos: monto total a pagar no se actualiza al poner faltante en 0 (Guardado)

- **Síntoma:** Cobro Guardado reabierto con Diferencia/Faltante > 0; al poner faltante en 0,0000, en Pagos el “monto total a pagar” sigue en el neto viejo (doc − faltante) y no refleja el saldo completo.
- **Causa:** (1) `validate()` exigía `difFaltante > 0` para habilitar Guardar y saltaba `calculatePayment`. (2) En SAVED, `resolveDetailNetAmountToPay` + `normalizeDocumentNetAmountFromPaid` retenían `nuAmountPaid` viejo (`paid < net` → paid) y `preserveAmountsWithoutRecalc` congelaba `montoTotalPagar`. (3) Cancelar no restauraba `nuAmountDiscount` mutado en memoria.
- **Fix:** Guardar por monto válido (no por faltante > 0); sync `detail.nuAmountPaid` al neto nuevo (`syncOpenDetailNuAmountPaidFromAmountPaid`); `forceRecalc` al validar/cambiar faltante; en docs no parciales preferir `expectedNet` si `paid < expectedNet`; snapshot/restore de faltante al abrir/cancelar (`captureOpenDetailFaltanteBackup` / `restoreDocumentSaleState`). `syncCollectionDetailDiscountConversion` en batch/sync usa tasa/moneda del cobro persistido (no asume `this.collection` UI).
- **Evitar:** No acoplar Guardar del documento a `nuAmountDiscount > 0`. Tras bajar/quitar faltante en Guardado, refrescar totales (`forceRecalc` o sync de `nuAmountPaid`) antes de confiar en `preserveAmountsWithoutRecalc`. No dejar `nuAmountPaid` stale en detail cuando el neto esperado sube. No leer `this.collection.nuValueLocal` sin null-check en paths de `saveCollectionBatch`/sync.
- **Tests:** `npm run test:cobros` — `cobro-documents.component.spec.ts` (validate con faltante 0 + sync detail); `collection-logic.service.spec.ts` describe `COB-FALT-001` + `syncCollectionDetailDiscountConversion` (incl. batch sin `this.collection`).
- **Archivos:** `cobro-documents.component.ts`, `collection-logic.service.ts` (+ specs); checklist `.cursor/rules/bug-prevention.mdc`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [VND-LOAD-001] Vendedor: modal "Cargando..." ~20–60s al abrir

- **Síntoma:** Al entrar a Vendedor (listado distribuidoras), overlay “Cargando...” bloquea la UI hasta que responde el WS (~20s+).
- **Causa:** `ngOnInit` hacía `showLoading()` y solo `hideLoading` en `.finally()` de `userservice/userinformation`. Las empresas ya estaban en SQLite pero el modal esperaba el HTTP pesado (`UserServiceManager` por empresa/moneda/unidad).
- **Fix (móvil):** No usar modal global; pintar empresas al toque; métricas en background con spinner inline en el acordeón.
- **Fix (WS):** `UserServiceManager`: paralelizar empresas; prefetch planes/monedas/unidades; solo planes reales (sin SP/sintéticos que la app no pinta); cache 2 min por `idUser`.
- **Evitar:** No amarrar `MessageService.showLoading` a endpoints de métricas lentos si el listado maestro es local. No hacer N×`getPedidosVendedoresCurrency` ni SP descartado.
- **Archivos:** móvil `vendedores.component.ts` / `.html`; WS `UserServiceManager.java`, `PlanCuotaEmpresaViewRepository.java`.
- **Estado:** mitigated app + WS optimizado (pendiente redeploy WS y medir POST otra vez).

---

## [COB-DATE-001] Fecha TR/PM elegida se pierde al Guardar/reabrir

- **Síntoma:** En Pagos, elegir fecha distinta a hoy (ej. Transferencia `01/08/2026`) se ve bien en UI; tras Guardar/Enviar y reabrir aparece hoy.
- **Causa:** `getFechaValor` (y rutas `getFecha`/`onOpenCalendar`) de TR/PM solo actualizaban `daCollectionPayment`. La hidratación en `loadPayments` usa `fecha: payment.daValue`, que quedaba en “hoy” (set al crear/seleccionar banco). Depósito ya escribía `daValue`.
- **Fix:** Al cambiar fecha TR/PM, sincronizar ambos campos (`daValue` + `daCollectionPayment`) vía `syncPaymentDateFields`.
- **Evitar:** No persistir solo `daCollectionPayment` si la UI rehidrata desde `daValue`. No mezclar el modelo de fecha de Cheque (`fechaValor` → `daValue`).
- **Tests:** `cobro-pagos.component.spec.ts` describe `COB-DATE-001` (TR y PM).
- **Archivos:** `cobro-pagos.component.ts` (+ spec); checklist bug-prevention.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [INV-SEARCH-001] Buscador Inventarios sensible a tildes

- **Síntoma:** Buscar “Azucar” vs “Azúcar” (o “Calorias” vs “Calorías”) en Inventarios devuelve conteos distintos; a veces “No hay productos” con tilde o menos resultados sin tilde.
- **Causa:** `getProductsSearchedByCoProductAndNaProduct` ya usa `convertToSqliteAccentGlob` (SQL OK), pero `inventario-product-list.getVisibleProducts()` refiltraba en memoria con `.toLowerCase().includes()` (sensible a tildes) y descartaba matches válidos.
- **Fix:** Normalizar NFD + quitar diacríticos en término y en `coProduct`/`naProduct` antes del `includes` (solo listado visible de Inventarios).
- **Evitar:** No añadir un segundo filtro en memoria accent-sensitive sobre resultados ya buscados con GLOB. No tocar Pedidos/otros módulos sin pedido explícito.
- **Tests:** `inventario-product-list.component.spec.ts` describe `INV-SEARCH-001`.
- **Archivos:** `inventario-product-list.component.ts` (+ spec); checklist bug-prevention.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-INV-COMMENT-001] Comentario: Espacio del teclado ignorado (Cobros / Inventarios)

- **Síntoma:** En Comentario (Cobros e Inventarios), la tecla Espacio no registra al primer toque; hay que pulsar varias veces o el teclado inserta un punto. No ocurre en Pedidos/Depósitos/Devoluciones.
- **Causa:** `cleanString()` hacía `trim()` en cada `ionInput` y reescribía `ngModel`/`input.value`, borrando el espacio trailing (`"hola "` → `"hola"`). `setComment()` en Cobros además aplicaba `.trim()` antes de limpiar.
- **Fix:** Alinear con Pedidos: `cleanString` solo quita `;` `'` `"` (sin trim). Validación de vacío sigue usando `.trim() == ""`.
- **Evitar:** No hacer `trim()` en handlers `ionInput` de comentario; trim solo en validación/persistencia si hace falta.
- **Tests:** `collection-logic.service.spec.ts` describe `COB-INV-COMMENT-001`; `inventario-general.component.spec.ts` mismo criterio.
- **Archivos:** `collection-logic.service.ts`, `cobro-general.component.ts`, `inventario-general.component.ts` (+ specs).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [COB-TOTAL-001] Total General USD = 0 al reabrir cobro Guardado (hard)

- **Síntoma:** Cobro hard/USD Guardado: al reabrir, TOTAL muestra Total General = 0 aunque Monto a pagar, Pago y métodos (TR) tienen monto correcto.
- **Causa:** Al reabrir, `loadPaymentMethods` vacía arrays UI; `getDocumentsSales(..., includeSelected)` llama `calculatePayment(..., forceRecalc=true)` y `syncMontosPagadosFromPayments` sumaba UI vacía → `nuAmountTotal = 0`. Luego `loadPayments` + preserve restauraba `montoTotalPagado` (Pago OK) pero no `collection.nuAmountTotal` (Total General). `getDocumentsSales` early-return solo para TO_SEND; SAVED y SENT sí entran al path. QA lo vio en hard/Guardado.
- **Fix:** Fallback a suma de `collectionPayments.nuAmountPartial` si UI=0; `syncNuAmountTotalFromPaidAmounts` en preserve y full recalc; `saveCollection` (cobro normal) alinea `nuAmountTotal` al pagado antes de INSERT. Retención (`coType` 2) no se toca.
- **Evitar:** No asumir que arrays UI de pago están hidratados cuando `getDocumentsSales` hace `forceRecalc`. Total General = `nuAmountTotal` ≠ `montoTotalPagado` runtime.
- **Archivos:** `collection-logic.service.ts` (+ spec).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [LOGIN-CASE-001] Cambio de usuario falso por mayúsculas/minúsculas

- **Síntoma:** Usuario guardado en "Recuérdame" con distinta capitalización (ej. `Vendedor01` vs `vendedor01`) dispara modal de cambio de usuario y borra BD local al aceptar.
- **Causa:** `onLogin` comparaba `localStorage.getItem("login")` con el login ingresado de forma case-sensitive; el backend auth acepta el mismo usuario sin distinguir mayúsculas.
- **Fix:** Comparar logins con `trim()` + `toLowerCase()` antes de mostrar el modal de cambio de usuario.
- **Evitar:** No usar `!=` directo sobre login almacenado; alinear validación local con semántica del auth server.
- **Archivos:** `login.component.ts` (`onLogin`).
- **Estado:** fixed.

---

## [PED-COMMENT-001] Pedido enviado no abre detalle si `requiredCommentOrder` se activó después

- **Síntoma:** Pedido enviado con comentario vacío (creado cuando `requiredCommentOrder=false`) no deja ver Total/Adjuntos al reabrir si la config ya está en `true`.
- **Causa:** `isCommentRequiredMissing` / `segmentLock` exigían comentario aunque `pedidoModificable=false` (input disabled); `lockSegments` bloqueaba las pestañas.
- **Fix:** Si el pedido no es editable (`!pedidoModificable`), no tratar el comentario como faltante obligatorio.
- **Evitar:** No exigir campos obligatorios de edición en pedidos solo-lectura/enviados; Guardado/nuevo sí siguen la config actual.
- **Archivos:** `pedido.component.ts` (`isCommentRequiredMissing`).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [INV-SAVE-001] Guardar/Enviar deshabilitados hasta inventario completo

- **Síntoma:** Tras seleccionar cliente en General, Guardar y Enviar permanecen OFF hasta completar todas las filas de productos (cantidad, lote, etc.).
- **Causa:** `updateHeaderButtons()` acoplaba ambos botones a `checkValidStockToSend()`. El header abría confirmación sin validar campos al click.
- **Fix:** `updateSaveButtonAvailability()` (General + dirty) y `updateSendButtonAvailability()` (General). `saveStock()` / `sendStock()` validan con `hasStockFieldErrors()` antes del modal (como `sendCollect()` en Cobros). Guardar también valida al pulsar (simétrico a Enviar).
- **Evitar:** No volver a acoplar Guardar a `checkValidStockToSend()` en product-list/adjuntos. No forzar `onStockValidToSave(true)` en hidratación sin dirty.
- **Archivos:** `inventarios-logic.service.ts`, `inventario-header`, `inventario-general`, `inventario-product-list`, `inventario-actividades`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [INV-SAVE-002] Guardar permanece ON tras guardar sin cambios

- **Síntoma:** Tras guardar inventario (sin salir), Guardar sigue habilitado aunque no hubo más ediciones; al reabrir borrador igual.
- **Causa:** No existía `stockPersistedBaseline` / `stockDirtySincePersist`; selección de cliente forzaba `onStockValidToSave(true)`.
- **Fix:** `hasChangesToSave` en `updateSaveButtonAvailability`. `notifyStockEdited()` en ediciones de usuario; `markStockOpenedFromPersistedCopy()` al reabrir; `applyPersistSucceededBaseline()` tras persistir.
- **Evitar:** No llamar `markStockDirty` desde hidratación (`pauseStockDirtyTracking`). No usar `updateHeaderButtons()` para acoplar save+send.
- **Archivos:** `inventarios-logic.service.ts`, componentes de inventario, specs + smoke Inventarios #1–4.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [DEP-SAVE-001] Guardar/Enviar deshabilitados hasta cobros completos

- **Síntoma:** Guardar exigía banco + cobros en el botón; Enviar solo cobros; validación parcial al click.
- **Causa:** `refreshHeaderSaveDisabled()` acoplaba Guardar a cobros; `hasAtLeastOneDepositCollectRow()` era la única validación al pulsar.
- **Fix:** `updateSaveButtonAvailability()` (General + dirty) y `updateSendButtonAvailability()` (General). `validateDepositBeforeAction()` + `hasDepositFieldErrors()` antes de confirmación en Guardar y Enviar.
- **Evitar:** No volver a acoplar Guardar a `depositCollect.length` en el header. Validar plantilla, banco, firma y GPS al click.
- **Archivos:** `deposit.service.ts`, `depositos-header`, `deposito-general`, `deposito-cobros`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [DEP-SAVE-002] Guardar permanece ON tras guardar sin cambios

- **Síntoma:** Tras guardar depósito, Guardar sigue habilitado sin más ediciones; al reabrir igual.
- **Causa:** `applyPersistSucceededBaseline()` no refrescaba botones; dirty existía solo para salida (`goBack`).
- **Fix:** `updateSaveButtonAvailability()` con `hasChangesToSave`; `notifyDepositEdited()` en general/cobros/adjuntos; baseline al reabrir.
- **Evitar:** No forzar `onDepositValidToSave(true)` en hidratación sin dirty.
- **Archivos:** `deposit.service.ts`, componentes depósito, specs + smoke Depósitos.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [POT-SAVE-001] Guardar/Enviar deshabilitados hasta formulario completo

- **Síntoma:** Guardar y Enviar exigían formulario completo en tiempo real (`checkForm`); validación parcial al click; Enviar mostraba éxito antes de persistir.
- **Causa:** `cannotSavePotentialClient` / `cannotSendPotentialClient` acoplados a `checkForm()`; header sin `validateBeforeAction`; `setResult` disparaba `CLI_SEND_MSG` antes del INSERT.
- **Fix:** `updatePotentialClientSaveButtonAvailability()` (General + dirty) y `updatePotentialClientSendButtonAvailability()` (General). `validatePotentialClientBeforeAction()` + `hasPotentialClientFieldErrors()` antes de confirmación. Éxito de envío tras persistir.
- **Evitar:** No volver a acoplar Enviar a `validPotentialClient` en el header. Validar `naResponsible`, firma y GPS al click.
- **Archivos:** `client-logic.service.ts`, `client-header`, `client-new-potential-client`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [POT-SAVE-002] Guardar permanece ON tras guardar sin cambios

- **Síntoma:** Tras guardar potencial, Guardar sigue habilitado sin más ediciones; al reabrir igual.
- **Causa:** No existía baseline/dirty para botón Guardar; solo `newPotentialClientChanged` para salida.
- **Fix:** `applyPotentialClientPersistSucceededBaseline()` + `notifyPotentialClientEdited()`; `markPotentialClientOpenedFromPersistedCopy()` al reabrir guardado.
- **Evitar:** No forzar `cannotSavePotentialClient = false` en hidratación sin dirty.
- **Archivos:** `client-logic.service.ts`, formulario potencial, specs + smoke Clientes.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [DEV-SAVE-001] Guardar/Enviar deshabilitados hasta productos completos

- **Síntoma:** Guardar exigía productos completos en el botón; Enviar también; validación parcial al click; Guardar persistía sin confirmación.
- **Causa:** `updateSendButtonState()` acoplaba Guardar y Enviar a `coDocument` + `quProduct`; lógica duplicada en `devolucion-product-list`.
- **Fix:** `updateSaveButtonAvailability()` (General + dirty) y `updateSendButtonAvailability()` (General). `validateReturnBeforeAction()` + `hasReturnFieldErrors()` antes de confirmación en Guardar y Enviar.
- **Evitar:** No volver a llamar `onReturnValidToSave` desde product-list. Validar productos, firma y GPS al click.
- **Archivos:** `return-logic.service.ts`, `devoluciones-header`, `devolucion-general`, `devolucion-product-list`.
- **Estado:** fixed (pendiente QA dispositivo).

---

## [DEV-SAVE-002] Guardar permanece ON tras guardar sin cambios

- **Síntoma:** Tras guardar devolución, Guardar sigue habilitado sin más ediciones; al reabrir igual.
- **Causa:** `setChange(false, true)` tras guardar dejaba Guardar ON; no existía baseline/dirty para el botón.
- **Fix:** `applyReturnPersistSucceededBaseline()` + `notifyReturnEdited()`; `markReturnOpenedFromPersistedCopy()` al reabrir persistido.
- **Evitar:** No forzar `onReturnValidToSave(true)` en hidratación sin dirty.
- **Archivos:** `return-logic.service.ts`, componentes devoluciones, specs + smoke Devoluciones.
- **Estado:** fixed (pendiente QA dispositivo).

---

## Cómo añadir una entrada nueva

1. ID estable: `[MODULO-TEMA-NNN]`.
2. Completar las 6 viñetas del formato.
3. Si aplica a un módulo concreto, una línea en `.cursor/rules/bug-prevention.mdc` (checklist), no pegar el post-mortem entero ahí.
4. Si es contrato de dominio reutilizable, resumen corto en `AGENTS.md` y detalle aquí.
