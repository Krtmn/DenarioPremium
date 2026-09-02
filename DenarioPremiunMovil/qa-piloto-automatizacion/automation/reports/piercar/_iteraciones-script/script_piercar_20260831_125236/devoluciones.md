# DEVOLUCIONES — piercar

- ✅ **DM-DEV-001** Tile Devoluciones → home con 2 botones _(botones: DEVOLUCIÓN, BUSCAR)_
- ✅ **DM-DEV-002** DEVOLUCIÓN → form / tabs disabled _(tabs: ["General","Productos","Adjuntos"] · Productos disabled: true · Adjuntos disabled: true)_
- ✅ **DM-DEV-003** Tab disabled sin cliente → no cambia _(segment antes: default · después: default)_
- ✅ **DM-DEV-017** Botones guardar/enviar disabled sin cliente _(guardar visible: true disabled: true · enviar visible: true disabled: true)_
- ✅ **DM-DEV-005** Búsqueda ZZZZZZZ en selector → sin resultados _(msg: "No hay clientes disponibles")_
- ✅ **DM-DEV-004** validateReturn: la FACTURA habilita las tabs (no el cliente) _(cliente "RAFAEL  PIT STOPCódigo: RAFAPITSOP Saldo USD: 2.756,99  Sald" → PRODUCTOS deshabilitada (correcto); factura "Nro Factura: 10056 Fecha: 01/06/2026" (31 disponibles) → PRODUCTOS habilitada)_
- ✅ **DM-DEV-DATA-001** Cliente de prueba con facturas devolvibles _("RAFAEL  PIT STOP" dejó el módulo ejecutable al primer intento)_
- ✅ **DM-DEV-008** VG validateReturn: campo Factura visible tras cliente _(invoiceSelect visible: true)_
- ✅ **DM-DEV-009** Selector de facturas lista las facturas del cliente _(31 factura(s) en InvoiceeSelectModal · elegida: "Nro Factura: 10056 Fecha: 01/06/2026" (la del perfil))_
- ✅ **DM-DEV-010** Factura elegida queda en el campo y habilita PRODUCTOS _(campo Factura: "10056" · elegida en el modal: "Nro Factura: 10056 Fecha: 01/06/2026")_
- ✅ **DM-DEV-006** Campos editables Tab General (Responsable/Comentario) _(responsable: "Test-DEV-006")_
- ✅ **DM-DEV-007** Fecha devolución solo lectura (button disabled) _(fechaDevButton disabled: true)_
- ✅ **DM-DEV-011** Tab Productos → botón Agregar Producto visible _(botonAddAmarillo visible: true)_
- ✅ **DM-DEV-012** Seleccionar estructura → lista de productos _(estructura: "(sin estructura — productos de la factura)")_
- ✅ **DM-DEV-013** Seleccionar producto → acordeón Cantidad/Unidad/Motivo _(producto: "Amortiguador DELANTERO DERECHO-IZQUIERDO")_
- ✅ **DM-DEV-014** Ingresar cantidad → producto en carrito _(cantidad: 3 · unidad: true · motivo: true)_
- ❌ **DM-DEV-015** Tab Adjuntos → acordeones visibles _(imágenes: false · archivo: false · firma: false)_
- ✅ **DM-DEV-016** Guardar devolución → mensaje confirmación _(alert: "¡Su Devolución se ha guardado!")_
- ✅ **DM-DEV-019** Guardar + BUSCAR → aparece Guardado en lista _(ítems: 2 · Guardado: 2)_
- ✅ **DM-DEV-022** Abrir Guardado → form editable con tabs accesibles _(tabs accesibles: 3)_
- ❌ **DM-DEV-018** Enviar devolución → modal confirmación _(No se pudo llegar a home devoluciones)_
- ❌ **DM-DEV-021** BUSCAR → lista con searchbar _(searchbar: false · ítems: 0)_
- ❌ **DM-DEV-023** Abrir Enviado → solo lectura _(No hay ítems Enviado/PorEnviar en lista)_
- ❌ **DM-DEV-024** Eliminar Guardado → modal + desaparece _(No se pudo llegar a home devoluciones)_
- ❌ **DM-DEV-025** Atrás desde lista → home módulo _(img.fechaAtras no encontrado)_
- ❌ **DM-DEV-020** Atrás sin guardar → modal Salir/Guardar → home _(No se pudo llegar a home devoluciones)_

**Resumen:** PASS:19 · FAIL:7
_Tiempo: 363.1s_