# CLIENTES — mio_parts

- ✅ **DM-CLT-001** Navegar a Clientes desde Home _(3 botones visibles)_
- ✅ **DM-CLT-002** Click CLIENTES → lista de clientes _(50 clientes)_
- ✅ **DM-CLT-003** Buscar "A" en lista _(50 resultados)_
- ✅ **DM-CLT-009** Click en cliente → detalle _(detalle visible)_
- ✅ **DM-CLT-013** Tab "Doc. de Venta" _(4 filas en tabla)_
- ✅ **DM-CLT-017** Volver a lista desde detalle
- ✅ **DM-CLT-016** Volver a home clientes desde lista
- ✅ **DM-CLT-019** CLIENTE POTENCIAL → formulario con botones disabled _(9 inputs; Guardar disabled=false, Enviar disabled=false)_
- ✅ **DM-CLT-021** Llenar campos → botones Guardar/Enviar habilitados _(Guardar enabled=true, Enviar enabled=true; idEmpresa: none (disabled (1 empresa auto-asignada)))_
- ✅ **DM-CLT-024** Click Guardar → cliente potencial guardado _(alert btn: "Aceptar"; "Test-CLT-SMOKE-615471" visible en BUSCAR · BD-LOCAL-NOT-FOUND)_
- ✅ **DM-CLT-026** Re-abrir Guardado → Enviar → 3 alertas → Enviado _(ref potencial: 134; en home clientes: 3 botones · BD-LOCAL-PENDING(id=-1,st=?) · BD-FIELD-OK)_
- ✅ **DM-CLT-031** Borrar cliente Guardado → desaparece de lista _("Test-CLT-DEL-615471" eliminado OK)_

**Resumen:** PASS:12
_Tiempo: 58.7s_