# PEDIDOS — mio_parts

- ✅ **DM-PED-001** Tile Pedidos → home del módulo _(botones: PEDIDO, BUSCAR, COPIAR)_
- ✅ **DM-PED-002** Form de pedido con tabs bloqueadas sin cliente _(tabs: General · Pedido(bloq) · Total(bloq) · Adjunto(bloq))_
- ✅ **DM-PED-006** Seleccionar cliente → tabs habilitadas _("ACCESORIOS Y AUTOREPUESTOS JOTA, C.A. (J507679705)" (vía modal, 50 clientes cargados en 1 ronda/s) · tabs libres: 4 · lockSegments: false · hasClient: true)_
- ✅ **DM-PED-REQ-001** REQ · Enviar habilitado al iniciar la transacción _(nace habilitado)_
- ✅ **DM-PED-REQ-002** REQ · Rechaza el envío con obligatorios vacíos y dice qué falta _(C1 ok · C2 ok vía alerta — "Denario Debe agregar al menos un producto al pedido." · Enviar quedó DESHAB)_
- ✅ **DM-PED-VG-001** Mapa de VGs de cabecera (selects del Tab General) _(6 select(s) con cliente (antes: 1) —  |  |  |  |  |  · ⚠ YAML multiCurrency=true pero no hay selector de Moneda)_
- ✅ **DM-PED-015** Tab Pedido → catálogo con productos _(variante "drilldown-o-anidado" · categorías: 7 · accordions: 0)_
- ❌ **DM-PED-029** Sin ítems → Guardar/Enviar deshabilitados _(carrito: 0 líneas · Guardar: habil · Enviar: deshab)_
- ❌ **DM-PED-017** Cargar cantidad → la línea entra al carrito _(el panel no expuso input de cantidad — Inventario: 4)_
- 🚫 **DM-PED-VG-002** Mapa de VGs de línea (selects del panel de producto) _(no se llegó a expandir ningún producto (ver PED-017))_
- ❌ **DM-PED-024** Tab Total con los importes del pedido _(sin líneas en el carrito (ver PED-017))_
- 🚫 **DM-PED-IVA-001** IVA de línea reflejado en el Tab Total _(no se pudo leer el Tab Total)_
- ⬜ **DM-PED-DSC-001** Descuento por producto aplica y baja el total _(el panel de línea no ofrece "% Descuento" ⇒ userCanSelectProductDiscount=false. La ausencia del selector ES la señal de la VG, no un fallo)_
- ⬜ **DM-PED-DSC-002** Descuento global aplica y baja el total _(el Tab Total no ofrece selector de descuento global ⇒ userCanSelectGlobalDiscount=false. Selects presentes: ninguno)_
- 🚫 **DM-PED-TOT-001** Aritmética del Tab Total (Base − Desc + IVA = Total) _(no se pudieron leer las cifras (base: ?, total: ?))_
- ❌ **DM-PED-026** Borrar línea desde el Tab Total → recalcula _(sin líneas que borrar)_
- ❌ **DM-PED-030** Guardar pedido → alert de confirmación _(el carrito quedó vacío y no se pudo reponer una línea)_
- ❌ **DM-PED-REQ-003** REQ · Sin pestaña en rojo falso con el formulario completo (F1) _(F1: pestaña(s) en ROJO sin campos obligatorios pendientes: Pedido · marcas en pantalla: 0 borde + 0 mensaje)_
- ❌ **DM-PED-031** Enviar pedido → confirmación y vuelta al home _(el pedido no llegó a guardarse (ver PED-030) · BD-N/A)_
- ❌ **DM-PED-034** BUSCAR → el searchbar filtra en tiempo real _(0 ítems → "ZZZZZZ" → 0 → al vaciar → 0)_
- ❌ **DM-PED-035** Abrir un pedido de la lista → formulario rehidratado _(sin pedidos en la lista)_
- ❌ **DM-PED-032** Atrás con cambios → dirty-guard _(no hay formulario abierto que ensuciar)_
- ⬜ **DM-PED-037** Borrar un pedido Guardado desde la lista _(sin botón de borrado en la lista (0 ítem/s): sólo los Guardado lo muestran)_

**Resumen:** PASS:7 · FAIL:10 · BLOCKED:3 · N/A:3
_Tiempo: 88.3s_