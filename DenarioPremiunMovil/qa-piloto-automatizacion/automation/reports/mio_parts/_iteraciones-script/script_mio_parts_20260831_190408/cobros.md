# COBROS — mio_parts

- ⬜ **DM-COB-006** Comentario obligatorio _(requiredComment=false)_
- ⬜ **DM-COB-036** DM-COB-036 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-044** DM-COB-044 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-045** DM-COB-045 _(userCanSelectIGTF=false (IGTF inactivo))_
- ⬜ **DM-COB-037** Cobro 25% IVA _(userCanCollectIva=false)_
- ✅ **DM-COB-001** Módulo Cobros → home (COBRO + BUSCAR) _(botones: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, BUSCAR)_
- ✅ **DM-COB-002** COBRO → form 5 tabs; resto disabled sin cliente _(tabs: 5 (General/Documentos/Pagos/Total/Adjuntos) · habilitadas: 1)_
- ✅ **DM-COB-004** Seleccionar cliente → tabs habilitadas _(cliente: "MIO PARTS & SERVICES, C.A." · tabs habilitadas: 5)_
- ✅ **DM-COB-007** Tab Documentos → lista + leyenda _(documentos: 4 · leyenda: true)_
- ✅ **DM-COB-008** Marcar documento → total en Pagos _(marcados: 4 · total: "Monto total a pagar BS: 2.677.302,32 Diferencia BS: -2.677.3")_
- ✅ **DM-COB-009** Tab Pagos → modal métodos de pago _(métodos: Efectivo, Depósito, Transferencia, Pago Móvil)_
- ✅ **DM-COB-040** Completar pago Efectivo = total → diferencia azul _(monto: 267730232 · antes: -2.677.302,32(red) · después: 0,00(blue))_
- ✅ **DM-COB-012** Diferencia rojo (insuf.) → azul (cubre) _(antes: red · después: blue)_
- ✅ **DM-COB-043** Diferencia se actualiza con el monto _(antes: -2.677.302,32 · después: 0,00)_
- ✅ **DM-COB-016** Tab Adjuntos → acordeones visibles _(imágenes: true · archivo: true · firma: true)_
- ✅ **DM-COB-018** Guardar cobro → alert confirmación _(alert: "Denario Cobros · El Cobro se ha guardado")_
- 🚫 **DM-COB-019** Enviar cobro (con adjunto) _(Fase 2 — ensureAdjunto/mock cámara standalone pendiente)_
- ✅ **DM-COB-022** BUSCAR → lista con searchbar _(lista: true · ítems: 1 · searchbar: true)_
- ✅ **DM-COB-024** Abrir Guardado → form editable _(tabs accesibles: 5)_
- ✅ **DM-COB-026** Eliminar Guardado → desaparece _(antes: 1 · después: 0)_
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

**Resumen:** N/A:5 · PASS:16 · BLOCKED:13
_Tiempo: 69.8s_