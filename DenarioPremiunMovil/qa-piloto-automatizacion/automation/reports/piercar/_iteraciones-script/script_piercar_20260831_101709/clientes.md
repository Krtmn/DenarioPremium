# CLIENTES — piercar

- ✅ **DM-CLT-001** Navegar a Clientes desde Home _(3 botones visibles)_
- ✅ **DM-CLT-002** Click CLIENTES → lista de clientes _(50 clientes)_
- ✅ **DM-CLT-003** Buscar "7 CARS" en lista _(3 resultados)_
- ✅ **DM-CLT-009** Click en cliente → detalle _(detalle visible)_
- ✅ **DM-CLT-013** Tab "Doc. de Venta" _(2 filas en tabla)_
- ✅ **DM-CLT-017** Volver a lista desde detalle
- ✅ **DM-CLT-016** Volver a home clientes desde lista
- ✅ **DM-CLT-019** CLIENTE POTENCIAL → formulario con botones disabled _(9 inputs; Guardar disabled=true, Enviar disabled=true)_
- ✅ **DM-CLT-021** Llenar campos → botones Guardar/Enviar habilitados _(Guardar enabled=true, Enviar enabled=true; idEmpresa: none (disabled (1 empresa auto-asignada)))_
- ✅ **DM-CLT-024** Click Guardar → cliente potencial guardado _(alert btn: "OK"; "Test-CLT-SMOKE-830606" visible en BUSCAR · BD-LOCAL-NOT-FOUND)_
- ✅ **DM-CLT-026** Re-abrir Guardado → Enviar → 3 alertas → Enviado _(ref potencial: 1; en home clientes: 3 botones · BD-LOCAL-PENDING(id=-1,st=?) · BD-FIELD-OK)_
- ❌ **DM-CLT-031** Borrar cliente Guardado → desaparece de lista _(Alert button no encontrado: OK/Aceptar)_

**Resumen:** PASS:11 · FAIL:1
_Tiempo: 46.6s_