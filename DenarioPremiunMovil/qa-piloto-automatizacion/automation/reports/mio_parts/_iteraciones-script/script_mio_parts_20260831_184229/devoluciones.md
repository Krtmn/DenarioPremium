# DEVOLUCIONES — mio_parts

- ✅ **DM-DEV-001** Tile Devoluciones → home con 2 botones _(botones: DEVOLUCIÓN, BUSCAR)_
- ✅ **DM-DEV-002** DEVOLUCIÓN → form / tabs disabled _(tabs: ["General","Productos","Adjuntos"] · Productos disabled: true · Adjuntos disabled: true)_
- ✅ **DM-DEV-003** Tab disabled sin cliente → no cambia _(segment antes: default · después: default)_
- ✅ **DM-DEV-017** Botones guardar/enviar disabled sin cliente _(guardar visible: true disabled: true · enviar visible: true disabled: true)_
- ✅ **DM-DEV-005** Búsqueda ZZZZZZZ en selector → sin resultados _(msg: "No hay clientes disponibles")_
- ✅ **DM-DEV-004** Seleccionar cliente → tabs habilitadas _(cliente: "MIO PARTS & SERVICES, C.A.Código: J409074560 Saldo BS: 3.858" · Productos habilitada: true)_
- ✅ **DM-DEV-DATA-001** Cliente de prueba con facturas devolvibles _("MIO PARTS & SERVICES, C.A." dejó el módulo ejecutable al primer intento)_
- ⬜ **DM-DEV-008** DM-DEV-008 _(validateReturn=false en perfil)_
- ⬜ **DM-DEV-009** DM-DEV-009 _(validateReturn=false en perfil)_
- ⬜ **DM-DEV-010** DM-DEV-010 _(validateReturn=false en perfil)_
- ✅ **DM-DEV-006** Campos editables Tab General (Responsable/Comentario) _(responsable: "Test-DEV-006")_
- ✅ **DM-DEV-007** Fecha devolución solo lectura (button disabled) _(fechaDevButton disabled: true)_
- ✅ **DM-DEV-011** Tab Productos → botón Agregar Producto visible _(botonAddAmarillo visible: true)_
- ✅ **DM-DEV-012** Seleccionar estructura → lista de productos _(estructura: "FILTROS SF 16")_
- ✅ **DM-DEV-013** Seleccionar producto → acordeón Cantidad/Unidad/Motivo _(producto: "FILTRO ELEMENTO COMBUSTIBLE ENCAVACódigo")_
- ✅ **DM-DEV-014** Ingresar cantidad (dentro del máximo de la factura) → queda en el campo _(máximo permitido por la factura: 1 · cantidad LEÍDA del campo: "1" · unidad: true · motivo: true)_
- ✅ **DM-DEV-015** Tab Adjuntos → acordeones visibles _(imágenes: true · archivo: true · firma: true · acordeones visibles: 3)_
- ✅ **DM-DEV-016** Guardar devolución → mensaje confirmación _(alert: "¿Desea guardar la devolución?")_
- ✅ **DM-DEV-019** Guardar + BUSCAR → aparece Guardado en lista _(ítems: 1 · Guardado: 1)_
- ✅ **DM-DEV-022** Abrir Guardado → form editable con tabs accesibles _(tabs accesibles: 3)_
- ⬜ **DM-DEV-018** Enviar devolución → modal confirmación → home módulo _(perfil sin factura_test (cliente no exige nro. de factura))_
- ⬜ **DM-DEV-VAL-001** Cantidad mayor a la facturada → la app bloquea el envío _(perfil sin factura_test: no hay tope contra el que validar)_
- ✅ **DM-DEV-021** BUSCAR → lista con searchbar _(searchbar: true · ítems: 1)_
- ⬜ **DM-DEV-023** Abrir Enviado → solo lectura _(sin devoluciones Enviado/Por Enviar que abrir — 1 ítem(s) en lista, estados presentes: Guardado. Requiere que DEV-018 (Enviar) complete antes.)_
- ✅ **DM-DEV-024** Eliminar Guardado → modal + desaparece de lista _(antes: 1 Guardado · después: 0 · btn: "Eliminar")_
- ✅ **DM-DEV-025** Atrás desde lista → home módulo _(home visible: true)_
- ✅ **DM-DEV-020** Atrás sin guardar → modal Salir/Guardar → "Salir sin guardar" → home _(modal: true · salió por modal: true · home: true)_

**Resumen:** PASS:21 · N/A:6
_Tiempo: 138.9s_