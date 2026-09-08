# COBROS — 4k

- ⬜ **DM-COB-036** DM-COB-036 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-044** DM-COB-044 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-045** DM-COB-045 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-037** Cobro 25% IVA _(userCanCollectIva=false)_
- ✅ **DM-COB-001** Módulo Cobros → home (COBRO + BUSCAR) _(botones: COBRO, ANTICIPO/PREPAGO, BUSCAR)_
- ✅ **DM-COB-002** COBRO → form 5 tabs; resto disabled sin cliente _(tabs: 5 (General/Documentos/Pagos/Total/Adjuntos) · habilitadas: 1)_
- ✅ **DM-COB-004** Seleccionar cliente → tabs habilitadas _(pedido: "C.0060" · clickeado: "motor s diesel, c.a. código: c.0060 saldo bs: 3.103.116,00 saldo usd: 3.566,80 m" · tabs habilitadas: 5 · comentario escrito ✓)_
- ✅ **DM-COB-REQ-001** REQ · Enviar habilitado al iniciar la transacción _(nace deshabilitado — esperado en este módulo: primero hay que agregar un método de pago)_
- ❌ **DM-COB-REQ-002** REQ · Rechaza el envío con obligatorios vacíos y dice qué falta _(C1 ok (deshabilitado) pero C2 NO: no hay marca ni mensaje que indique qué falta)_
- ✅ **DM-COB-007** Tab Documentos → lista + leyenda _(documentos: 3 · leyenda: true)_
- ✅ **DM-COB-008** Marcar documento → total en Pagos _(marcados: 3 · total: "Monto total a pagar Bs: 765.600,00 Diferencia Bs: -765.600,0")_
- ✅ **DM-COB-048** Detalle del documento → botón «Asignar descuento» abre el modal _(userCanSelectCollectDiscount=true · tope configurado: 85%)_
- ✅ **DM-COB-049** Descuento 10% (≤ 85%) se acepta _(«DESC 10 TEST» marcado: true · disponible: — · alerta: ninguna)_
- ✅ **DM-COB-050** 10% + 80% = 90% > 85% ⇒ se rechaza _(alerta: "Denario Cobros · Se superó el límite de descuento (85%). Máximo disponible: 75%." · «DESC 10 TEST» sigue marcado: true)_
- ❌ **DM-COB-052** Tras el rechazo, la casilla NO queda tildada _(«Probando» quedó marcado: true. 🔴 El descuento NO se aplicó (lo confirma el propio aviso) pero la casilla sigue tildada: el vendedor ve puesto un descuento que no está. La rama que rechaza en toggleTempSelection hace return sin detectChanges(), al revés que sus dos hermanas, y el binding [checked] no reescribe el DOM. CONFIRMAR A MANO antes de reportar.)_
- ✅ **DM-COB-051** Tasa escrita: 85% se acepta · 86% se rechaza _(85% → alerta: "ninguna", marcado: true · 86% → alerta: "Denario Cobros · Se superó el límite de descuento (85%). Máximo disponible: 85%.", marcado: false (debe quedar false: al exceder se QUITA))_
- ✅ **DM-COB-009** Tab Pagos → modal métodos de pago _(métodos: Efectivo, Cheque, Depósito, Transferencia, Pago Móvil)_
- ✅ **DM-COB-040** Completar pago Efectivo = total → diferencia azul _(monto: 76560000 · antes: -765.600,00(red) · después: 0,00(blue))_
- ✅ **DM-COB-012** Diferencia rojo (insuf.) → azul (cubre) _(antes: red · después: blue)_
- ✅ **DM-COB-043** Diferencia se actualiza con el monto _(antes: -765.600,00 · después: 0,00)_
- ✅ **DM-COB-016** Tab Adjuntos → acordeones visibles _(imágenes: true · archivo: true · firma: false)_
- ✅ **DM-COB-REQ-003** REQ · Sin pestaña en rojo falso con el formulario completo (F1) _(5 pestaña(s), ninguna en rojo con el formulario completo)_
- ✅ **DM-COB-018** Guardar cobro → alert confirmación _(clic:mouse/loading · alert: "Denario Cobros · El Cobro se ha guardado" · BD-FIELD-OK)_
- ✅ **DM-COB-022** BUSCAR → lista con searchbar _(lista: true · ítems: 20 · searchbar: true)_
- ✅ **DM-COB-024** Reabrir Guardado → los datos persisten _(tabs accesibles: 5 · 2 campo(s) con valor conservados · total: —)_
- ❌ **DM-COB-019** Enviar cobro → pasa de Guardado a Enviado _(⚠ la lista quedó VACÍA — no se puede confirmar el envío desde la UI · clic:mouse · diálogo: "Denario Cobros · El Cobro será enviado" · tras enviar → guardados: 0 · enviados: 0 · total en lista: 0)_
- ⬜ **DM-COB-026** Eliminar Guardado _(no quedan cobros Guardados (el del flujo anterior se envió). Cubrirlo requiere montar un 2.º cobro — pendiente de construir)_
- ✅ **DM-COB-020** Atrás con cambios → modal Salir/Guardar _(modal: "Denario Cobros")_
- ✅ **DM-COB-021** Salir sin guardar → no persiste _(salió por modal: true · home: true)_
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

**Resumen:** N/A:5 · PASS:21 · FAIL:3 · BLOCKED:12
_Tiempo: 120.2s_