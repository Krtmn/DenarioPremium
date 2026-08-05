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

## [COB-PREPAID-001] Anticipo automático no dispara en USD (sí en BS)

- **Síntoma:** Con `prepaidRangeAmount=1` USD, cobro USD (ej. a pagar 333.46, pagado 335 → excedente ~1.54) no crea anticipo. En BS con excedente >= mínimo sí. Montos irreales enormes sí reaccionan.
- **Causa:** `getPrepaidExcessAmount` anulaba el excedente si `isPositiveExcessWithinTolerance` (misma regla que Enviar: `tolerancia0` + `MonedaTolerancia` + `RangoToleranciaPositiva` alto). En USD el sobrante “normal” quedaba en 0 y nunca superaba el umbral de anticipo; en BS la moneda ≠ `MonedaTolerancia` y el filtro no aplicaba.
- **Fix:** Desacoplar: anticipo solo usa excedente > 0 vs `prepaidRangeAmount` (`>=`); tolerancia sigue solo en `checkTolerancia` (Enviar).
- **Evitar:** No reutilizar rangos de tolerancia positiva para decidir anticipo automático.
- **Archivos:** `collection-logic.service.ts` (`getPrepaidExcessAmount`, `resolveAutomatedPrepaid`).
- **Estado:** fixed (pendiente QA dispositivo).

---

## [CLI-SALDOS-001] Lista vs detalle: Saldo USD/BS cruzados

- **Síntoma:** Lista/selector (ej. AS04, `conversionDocument=true`): USD 2,84 / BS 2.096,23. Detalle: BS ~1.546.766 / USD 2.096,23 (correcto). Crédito/docs/web: ~2.096,23 USD.
- **Causa:** Con `conversionDocument=true`, SQL usa `saldo1`=local y `saldo2`=hard. La lista/selector siempre combinaban con semántica cliente/opuesta (`toHardCurrency` sobre el USD) → 2,84 bajo “Saldo USD”. El detalle ya usaba `resolveClientBalanceTotals(..., true)`.
- **Fix:** `mapRawSaldosToClientOppositeDisplay` en `ClientLogicService` (reusa `resolveClientBalanceTotals` si `conversionDocument=true`, si no `resolveClientCurrencyPairBalances`); `fixClientListSaldos` y el cálculo del selector lo usan. No mutar saldos del cliente en detalle.
- **Evitar:**
  - No asumir `saldo1`/`saldo2` = local/hard sin mirar `conversionDocument`.
  - No “arreglar” solo con swap de labels en HTML.
  - No mutar saldos del cliente del detalle con `fixClientListSaldos` (rompe crédito disponible y otros usos).
  - No cambiar SQL de saldos sin alinear lista + detalle + post-proceso.
- **Archivos:** `client-logic.service.ts`, `cliente-selector.component.ts`; detalle ya OK en `client-detail.component.ts`; SQL en `clientes-database-services.service.ts`.
- **Estado:** fixed en fuente; QA dispositivo requiere **rebuild + `cap copy`/`sync`** (el APK con `--no-sync` / live-reload caído seguía el `main.js` viejo → 2,84). Follow-up: `getClientById` truthy vs `== 'true'`.

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

## Cómo añadir una entrada nueva

1. ID estable: `[MODULO-TEMA-NNN]`.
2. Completar las 6 viñetas del formato.
3. Si aplica a un módulo concreto, una línea en `.cursor/rules/bug-prevention.mdc` (checklist), no pegar el post-mortem entero ahí.
4. Si es contrato de dominio reutilizable, resumen corto en `AGENTS.md` y detalle aquí.
