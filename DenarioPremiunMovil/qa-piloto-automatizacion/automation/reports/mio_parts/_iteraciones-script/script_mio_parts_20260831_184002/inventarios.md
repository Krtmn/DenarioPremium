# INVENTARIOS — mio_parts

- ✅ **DM-INV-001** Tile Inventarios → home _(botones: INVENTARIO, BUSCAR)_
- ✅ **DM-INV-002** Click INVENTARIO → form _(tabs: [General, Inventario, Resumen, Adjuntos]; Inventario disabled: true)_
- ✅ **DM-INV-004** Seleccionar cliente _("MIO PARTS & SERVICES, C.A.Código: J409074560 Saldo BS: 3.858" · tabs habilitadas)_
- ✅ **DM-INV-008** Tab Inventario → lista productos _(7 ítems visibles)_
- ✅ **DM-INV-010** Click producto → modal captura _(modal abierto (intento 2))_
- ✅ **DM-INV-011** Llenar campos modal _(cantidad: 5; expirationBatch: true; lote: LOTE-QA-4952)_
- ✅ **DM-INV-012** Aceptar modal → producto marcado
- ✅ **DM-INV-016** Tab Resumen → productos capturados _(1 ítems (app-inventario ion-row))_
- ⬜ **DM-INV-017** Pedido Sugerido visible _(suggestedOrderByDispatchAndReturn=false)_
- ⬜ **DM-INV-020** Días para siguiente inventario _(suggestedOrderByDispatchAndReturn=false)_
- ✅ **DM-INV-021** Click Guardar → Guardado _(alerts: "Aceptar"/"OK" · BD-SAVED(st=3))_
- ✅ **DM-INV-022** Click Enviar → Enviado _(ref: N/A · BD-LOCAL-OK(id=143,st=1) · BD-FIELD-OK)_
- ✅ **DM-INV-023** BUSCAR → lista _(1 ítems)_
- ✅ **DM-INV-025** Searchbar filtra _("MIO PA" → 1 resultado(s))_
- ✅ **DM-INV-026** Click Guardado → form abre _((defecto conocido: puede abrir en tab General))_
- ✅ **DM-INV-028** Trash Guardado → desaparece _(alert: "OK" · form visible: false)_

**Resumen:** PASS:14 · N/A:2
_Tiempo: 108.1s_