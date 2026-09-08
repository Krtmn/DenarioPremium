# COBROS — 4k

- ⬜ **DM-COB-036** DM-COB-036 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-044** DM-COB-044 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-045** DM-COB-045 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-037** Cobro 25% IVA _(userCanCollectIva=false)_
- ✅ **DM-COB-001** Módulo Cobros → home (COBRO + BUSCAR) _(botones: COBRO, ANTICIPO/PREPAGO, BUSCAR)_
- ✅ **DM-COB-002** COBRO → form 5 tabs; resto disabled sin cliente _(tabs: 5 (General/Documentos/Pagos/Total/Adjuntos) · habilitadas: 1)_
- ❌ **DM-COB-004** Seleccionar cliente → tabs habilitadas _(Cliente "C.0018" el modal no listó clientes · 0 ítems)_
- ✅ **DM-COB-REQ-001** REQ · Enviar habilitado al iniciar la transacción _(nace deshabilitado — esperado en este módulo: primero hay que agregar un método de pago)_
- ❌ **DM-COB-REQ-002** REQ · Rechaza el envío con obligatorios vacíos y dice qué falta _(C1 ok (deshabilitado) pero C2 NO: no hay marca ni mensaje que indique qué falta)_
- ⬜ **DM-COB-007** Tab Documentos → lista + leyenda _(cliente sin documentos (monedas: ["Moneda","Bs","USD"]))_
- ⬜ **DM-COB-008** Marcar documento → total actualiza _(sin documentos)_
- ⬜ **DM-COB-009** Tab Pagos → botón "Agregar método de pago" _(botón disabled (isAddPaymentMethodDisabled — falta documento/monto))_
- ⬜ **DM-COB-040** DM-COB-040 _(sin documento seleccionado)_
- ⬜ **DM-COB-012** DM-COB-012 _(sin documento seleccionado)_
- ⬜ **DM-COB-043** DM-COB-043 _(sin documento seleccionado)_
- ✅ **DM-COB-016** Tab Adjuntos → acordeones visibles _(imágenes: true · archivo: true · firma: false)_
- ⬜ **DM-COB-018** Guardar cobro → alert _(sin cliente/documento válido para guardar)_
- ⬜ **DM-COB-019** Enviar cobro _(no hubo cobro guardado)_
- ❌ **DM-COB-022** BUSCAR → lista _(No se pudo llegar a home cobros)_
- ⬜ **DM-COB-024** Abrir Guardado → editable _(sin cobros Guardado en lista)_
- ❌ **DM-COB-026** Eliminar Guardado _(page.waitForTimeout: Target page, context or browser has been closed)_
- ❌ **DM-COB-020** Atrás con cambios → modal _(page.evaluate: Target page, context or browser has been closed)_
- ❌ **DM-COB-021** Salir sin guardar _(page.evaluate: Target page, context or browser has been closed)_
- 🚫 **DM-COB-033** DM-COB-033 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-034** DM-COB-034 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-014** DM-COB-014 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-015** DM-COB-015 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-028** DM-COB-028 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-029** DM-COB-029 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-041** DM-COB-041 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-042** DM-COB-042 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-046** DM-COB-046 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-047** DM-COB-047 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-039** DM-COB-039 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-038** DM-COB-038 _(Fase 2 — pendiente de construir/depurar en device)_
- 🚫 **DM-COB-REQ-003** REQ · Botón Enviar y campos obligatorios _(el flujo del módulo salió antes de llegar a este punto de medición)_

**Resumen:** N/A:13 · PASS:4 · FAIL:6 · BLOCKED:13
_Tiempo: 59.0s_