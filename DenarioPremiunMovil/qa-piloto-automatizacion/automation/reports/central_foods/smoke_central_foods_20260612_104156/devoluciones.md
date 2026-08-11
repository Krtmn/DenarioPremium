# Smoke Test — Módulo DEVOLUCIONES

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | DEVOLUCIONES |
| Cliente | central_foods (CENTRAL FOODS C.A.) |
| App | `com.kiberno.denarioPremiumPro` |
| VGs clave | `validateReturn=true` · `requeridedNroFactura=true` · `multiInvoices=false` · `mesesFacturas=3` · `signatureReturn=true` · `userCanUploadFiles=true` |
| Resultado | **14 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

> Nota inicio: la app venía con modales residuales de la corrida COBROS ("Detalle del documento" / "Pagos Parciales" / "Seleccione método de cobro") abiertos sobre HOME — se hizo `dismiss()` de todos antes de empezar. App limpia en HOME.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEV-001 | ✅ PASS | `/devoluciones`, app-devoluciones visible, botones DEVOLUCIÓN + BUSCAR |
| DM-DEV-002 | ✅ PASS | Form abre; tabs General(enabled)/Productos(disabled)/Adjuntos(disabled); sin cliente |
| DM-DEV-004 | ✅ PASS | Cliente ALEJANDRA LEDEZMA (00029) seleccionado → aparece campo Factura `#invoiceSelect` (VG validateReturn=true honrada). Tabs siguen disabled (falta factura) |
| DM-DEV-006 | ✅ PASS | `#responsable`,`#precinto`,`#comentario` editan vía fillIonInput; Tipo popover: Calidad=60/PostVenta=52/Servicio=59 (default Calidad) |
| DM-DEV-011 | ✅ PASS | `#invoiceSelect` abre **modal con facturas reales** de ALEJANDRA (últimos 3m); elegida 0616402 → tabs Productos+Adjuntos se habilitan. **Confirma que validateReturn=true exige factura para desbloquear tabs** |
| DM-DEV-013 | ✅ PASS | AGREGAR PRODUCTO muestra lista **restringida a los productos de la factura** (3 ítems de 0616402, NO árbol de familias). SUNNY FLAKES (0566) → acordeón con Lote/NroFactura/Cantidad/Unidad/Motivo |
| DM-DEV-014 | ✅ PASS | Cantidad=2 en `.inp-write`; NroFactura **autollenado=0616402** (no se edita a mano); Guardar+Enviar habilitan |
| DM-DEV-015 | ✅ PASS | Tab Adjuntos: Imágenes (BUSCAR/TOMAR FOTO) + Archivo (userCanUploadFiles=true) + Firma (signatureReturn=true) — los 3 acordeones presentes |
| DM-DEV-016 | ✅ PASS | Alert "Denario Devolución — ¡Su Devolución se ha guardado!" (OK) |
| DM-DEV-018 | ✅ PASS | Enviar → confirm "¿Desea enviar la devolución?" (Aceptar) → "¡Su Devolución será enviada!" (OK) → navega a home devoluciones. **central_foods: 2 alertas** (sin 3ª "nro X exitosamente" de insumar/romher) |
| DM-DEV-019 | ✅ PASS | BUSCAR → lista con Nro.Ref/Cliente/Estatus/Fecha; devolución enviada aparece **Nro.Ref 6 — ALEJANDRA LEDEZMA — Enviado — 12/06/2026** (correlativo asignado al enviar) |
| DM-DEV-021 | ✅ PASS | Searchbar filtra realtime: "ALEJANDRA"→6, "ZZZNOMATCH"→0, vacío→6. Trash solo en Guardado (0 en lista todo-Enviado; 1 al existir un Guardado) |
| DM-DEV-022 | ✅ PASS | Abro Guardado (Ref 0): form editable, cliente + **factura 0616402 precargada**, 3 tabs accesibles, producto ZUCARITAS persistió en Tab Productos (oráculo round-trip OK) |
| DM-DEV-024 | ✅ PASS | Trash en Guardado → confirm "¿Desea eliminar la devolución?" CANCELAR/Eliminar → Eliminar → ítem desaparece (7→6). **Sin alert de éxito post-borrado** (= insumar) |

## Datos descubiertos
- **cliente_test:** ALEJANDRA LEDEZMA (Cód 00029) — confirmado, con facturas devolvibles
- **factura_test:** **0616402** (Fecha 10/06/2026) — factura real con productos devolvibles
  - Otras facturas disponibles (últimos 3m, mesesFacturas=3 honrado): 0613762 (19/03), 0615669 (19/05), 0615878 (24/05), 0616209 (03/06), 0616267 (04/06)
- **producto_test:** **CEREAL SUNNY FLAKES 24X230 GRS (Cód 0566)** (usado en envío); alterna: CEREAL KELLOG'S ZUCARITAS 24X250 GRS (0570), CEREAL KELLOG'S CORN POPS 24X180 GRS (0572)
  - Los 3 son los únicos devolvibles de la factura 0616402 (lista restringida por factura)
- **Empresa:** CENTRAL FOODS C.A. (idEnterprise 1, coEnterprise CF_A25, moneda US$) — preseleccionada
- **Tipos de devolución (popover):** Calidad=60, PostVenta=52, Servicio=59
- **Motivos (select por producto):** lista de motivos de calidad/servicio/inocuidad (ej. "Azúcar aterronada (Calidad)", "Cant. Producto Reciba Incompleta (Servicio)", "Empaque Mojado (Inocuidad)")
- **Unidad (select):** UNIDAD / BULTO

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Nro.Ref 6 | Devolución ALEJANDRA LEDEZMA (00029), factura 0616402, prod SUNNY FLAKES (0566) cant 2, Tipo Calidad | **Enviado** (queda en sistema) |
| Nro.Ref 0 (local) | Devolución ALEJANDRA LEDEZMA (00029), factura 0616402, prod ZUCARITAS (0570) cant 1 | Guardado → **Eliminado** en DM-DEV-024 (no queda residuo) |

## Discrepancias VG
- **Ninguna discrepancia bloqueante.** Todas las VGs de devoluciones del CSV dev se confirmaron en UI:
  - `validateReturn=true` ✅ — campo Factura `#invoiceSelect` aparece tras elegir cliente y **las tabs solo se habilitan al seleccionar factura** (verificado: tras cliente las tabs siguen disabled; tras factura se habilitan).
  - `requeridedNroFactura=true` ✅ — Nro Factura presente en el acordeón del producto y **autollenado** con la factura seleccionada.
  - `multiInvoices=false` ✅ (consistente) — la lista de productos a agregar se restringe a la única factura seleccionada; NroFactura del producto viene fijado a esa factura, no se puede mezclar otra.
  - `mesesFacturas=3` ✅ — el listado de facturas abarca 19/03/2026 → 10/06/2026 (dentro de 3 meses de hoy 12/06).
  - `signatureReturn=true` ✅ — acordeón Firma en Tab Adjuntos.
  - `userCanUploadFiles=true` ✅ — acordeón Archivo en Tab Adjuntos.
- **Nota (no es discrepancia):** pese a `enterpriseEnabled=false`, el form tiene un ion-select de empresa **preseleccionado y oculto** (CENTRAL FOODS C.A.), sin selector visible para el usuario — coherente con enterpriseEnabled=false (no hay elección de empresa).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `#invoiceSelect` (ion-input) | universal — solo con `validateReturn=true` | Campo Factura que aparece tras seleccionar cliente. Click abre **ion-modal** (`show-modal`) con ítems "Nro Factura: NNNN / Fecha: dd/mm/aaaa"; click en el ítem (top, y≈top+15) lo selecciona y cierra el modal. Las tabs Productos/Adjuntos solo se habilitan tras esta selección. NO existe en clientes con validateReturn=false |
| AGREGAR PRODUCTO con validateReturn=true | cliente/VG | Con validateReturn=true, "Agregar Producto" lista directamente los **productos de la factura** (lista plana, ej. "CEREAL ... Código: NNNN"), NO el árbol de familias del insumar (validateReturn=false). Click en el producto lo añade como acordeón colapsado |
| NroFactura autollenado en acordeón | universal — `validateReturn=true` | El input NroFactura del acordeón del producto viene **prellenado** con la factura seleccionada (idx 1 de los ion-input del acordeón) — no requiere tipearlo. Con validateReturn=false sí es libre |
| Dirty-guard al reabrir Guardado | cliente (central_foods, build El Yaque) | Navegar a Tab Productos en un Guardado reabierto marca el form dirty; al pulsar atrás aparece alert "Denario Devolución" (Guardar y salir / Salir sin guardar / Cancelar). "Salir sin guardar" mantiene el Guardado (correcto, no FAIL) |
| Tipo devolución central_foods | cliente | popover values: Calidad=60, PostVenta=52, Servicio=59 (mismos que insumar/romher) |
| Envío = 2 alertas (no 3) | cliente | central_foods: confirm "¿Desea enviar la devolución?" → "¡Su Devolución será enviada!". NO muestra la 3ª alerta "Devolución nro. X enviada exitosamente" de insumar/romher |
| Borrado Guardado sin alert de éxito | cliente (= insumar) | "¿Desea eliminar la devolución?" CANCELAR/Eliminar → Eliminar → ítem desaparece sin alert de confirmación post-borrado |

> ✅ consolidado 2026-06-12

## Hallazgos (FAIL)
Ninguno. 14/14 PASS.
