# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260624_125056_smoke-completo` |
| Módulo | COBROS |
| Cliente / Playa | jerez (INVERSIONES JEREZ MOTORS — multi-empresa 00001/00002/00003) |
| App | `com.kiberno.denarioPremiumPro` |
| Conexión | CDP `127.0.0.1:9220` (Playwright MCP) |
| Estado inicial | HOME (módulo Cobros — corrida previa dejó un cobro nuevo abierto; se limpió con dirty-guard "Salir sin guardar") |
| Estado final | HOME app (`/home`, `app-home`) ✅ |
| Resultado | 26 PASS · 0 FAIL · 2 SKIP · 4 N/A |

## Parámetros de prueba usados

| Dato | Valor real en corrida |
|------|------------------------|
| Empresa con documentos | **2ª empresa (00002)** y 3ª (00003) — clientes en ROJO. Cambio de empresa vía selector Empresa del **form General** (NO dentro del modal de clientes) |
| Clientes usados (emp 2, ROJO) | FERRETERIA MUNDIAL (065027207), ISOLINA DEL CARMEN (10283986), MULTIREPUESTOS DRG (074820707), INVERSIONES MOTO REPUESTOS EL PODER DEL MONO (089129288) |
| Cliente cobro normal enviado | Agro Maquinas Kukenan, C.A. (J-504221724, emp 3) — doc A *009089 USD 678,10 / BS 384.943,81 |
| Cliente sin documentos (emp 1) | DANIELA HERNANDEZ F.P. (V161051485) — Anticipo y "Guardar y salir" |
| Documento retención | A *026088 (FERRETERIA MUNDIAL / ISOLINA) USD 140,70 / BS 79.872,58, Vencido 46 días, venc 09/05/2026 |
| Retención de prueba | IVA 10,00 BS + ISLR 5,00 BS, comprobante 14 díg `12345678901234`, fecha 24/06/2026 → Monto a pagar neto 79.857,58 BS |
| Método de pago | Efectivo (disponibles: Efectivo/Depósito/Transferencia/Otros — sin Cheque ni Pago Móvil) |
| Moneda | multiCurrencyCollection=true: selector cobro BS/USD; selector Moneda documento Moneda/BS/USD; tasa BS 567,68 |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home módulo: COBRO, BUSCAR, RETENCIÓN, IGTF, COBRO 25% IVA, ANTICIPO/PREPAGO visibles |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs; General activo, Documentos/Pagos/Total/Adjuntos disabled; Cliente vacío |
| DM-COB-004 | ✅ PASS | Seleccionar cliente (Agro Maquinas Kukenan) → 4 tabs habilitan sin Comentario (confirma requiredComment=false) |
| DM-COB-006 | 🚫 N/A | requiredComment=false → tabs habilitan sin comentario; no aplica validación |
| DM-COB-007 | ✅ PASS | Tab Documentos lista docs (*009089/*009913/*009939) + leyenda Vigente/Vencido/A favor |
| DM-COB-008 | ✅ PASS | Marcar doc *009089 → Tab Pagos "Monto total a pagar BS: 384.943,81" |
| DM-COB-015 | ✅ PASS | Tab Total: "Total General BS: 384.943,81" visible |
| DM-COB-033 | ✅ PASS | Tab General selector Moneda cobro BS/USD (2 opciones), habilitado |
| DM-COB-034 | ✅ PASS | Tab Documentos selector Moneda doc (Moneda/BS/USD); lista responde al cambio (3 docs USD/BS) |
| DM-COB-041 | ✅ PASS | Detalle doc *026088: comprobante 14 díg + Fecha Comp Ret + IVA 10,00 + ISLR 5,00 → Monto a pagar neto 79.857,58 (= bruto 79.872,58 − 15,00); Tab Pagos muestra el neto |
| DM-COB-042 | ✅ PASS | Round-trip: reabrir Guardado → Pagos sigue 79.857,58; detalle conserva comprobante + IVA 10,00 + ISLR 5,00. **El bug "vuelve al bruto" NO reproduce** |
| DM-COB-009 | ✅ PASS | Tab Pagos "Agregar método" → modal #eventModal con Efectivo/Depósito/Transferencia/Otros |
| DM-COB-040 | ✅ PASS | Efectivo + monto = total → Diferencia BS 0,00 en **azul** |
| DM-COB-012 | ✅ PASS | Diferencia roja (insuficiente) → azul (cubre) |
| DM-COB-043 | ✅ PASS | Con doc + método: monto < total = roja; monto = total = azul |
| DM-COB-014 | ✅ PASS | Tab Total: tabla con Monto a Pagar BS/USD, Retención IVA, Retención ISLR, Total Efectivo, acordeones GENERAL/TOTAL |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo (Subir Archivo), Firma (Borrar) |
| DM-COB-018 | ✅ PASS | Guardar → alert "Denario Cobros / El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | Enviar → 3 alertas (confirm → "Su Cobro será enviado" → "Cobro nro. 23 enviado exitosamente") SIN alerta de adjunto (requiredCollectionAttachments=false) |
| DM-COB-022 | ✅ PASS | BUSCAR: app-cobros-list con searchbar; cobros con Estatus; trash SOLO en Guardado (no en Por aprobar/Enviado) |
| DM-COB-024 | ✅ PASS | Reabrir Guardado → form editable, Guardar/Enviar activos; montos + retención coinciden con lo guardado |
| DM-COB-026 | ✅ PASS | Trash en Guardado → alert "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → Eliminar → desaparece (5→4), sin alert de éxito posterior |
| DM-COB-020 | ✅ PASS | Atrás con cambios → modal 3 opciones (Guardar y salir / Salir sin guardar / Cancelar) |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" en cobro nuevo (IGTF/25%IVA) → NO aparece en BUSCAR |
| DM-COB-038 | ✅ PASS | Atrás → "Guardar y salir" (DANIELA) → "El Cobro se ha guardado" → aparece en BUSCAR como Guardado |
| DM-COB-028 | ✅ PASS | ANTICIPO/PREPAGO → 4 tabs (sin Documentos) → DANIELA + Efectivo 100,00 → "El Anticipo se ha guardado"; visible en BUSCAR |
| DM-COB-029 | ✅ PASS (Guardado) | RETENCIÓN → 4 tabs (sin Pagos) → MULTIREPUESTOS DRG + 1 doc → Tab Total → "La Retención se ha guardado" |
| DM-COB-046 | ✅ PASS | Detalle doc → toggle "Pago parcial:" (false→true) → input "Monto a pagar BS" editable → 40.000,00 → Tab Pagos muestra el parcial (no el total 79.872,58); persiste en round-trip al reabrir |
| DM-COB-047 | ✅ PASS | Cobro Guardado reabierto: Fecha Tasa 8/6→4/6/2026 → alert recálculo → Monto recalculado 79.857,58 → 78.829,06; Fecha Tasa persiste al reabrir |
| DM-COB-039 | ✅ PASS (rama B) | Rama A N/A (enabledManualRate=false, sin #manualRateInput). Rama B (Fecha Tasa en Guardado) recalcula y persiste (ver 047) |
| DM-COB-036 | ⚠ PASS parcial | Botón IGTF presente y abre flujo (5 tabs) con clientes seleccionables — **contradice VG userCanSelectIGTF=false**. No se logró cargar documento USD para completar el cobro $ |
| DM-COB-044 | 🚫 N/A (operativo) | No se cargó documento USD para cobro $ tipo IGTF en esta corrida → no se pudo descubrir/verificar persistencia del default IGTF. (Selector IGTF "0%/3%" observado en cobro normal, ver hallazgos) |
| DM-COB-045 | 🚫 N/A (operativo) | Igual que 044 — sin cobro $ IGTF completable |
| DM-COB-037 | 🚫 N/A | COBRO 25% IVA abre, pero el modal de cliente muestra "No hay clientes disponibles" → ningún cliente habilitado 25% IVA (coincide cliente_25iva=null) |
| DM-COB-031 | 🚫 N/A | userCanSelectCollectDiscount=false (estructural, sin descuento en cobro) |
| DM-COB-032 | 🚫 N/A | userCanAddRetention=false (retención libre sin factura, estructural) |
| Envío RETENCIÓN (029) | ⏭ SKIP | Envío de retención requiere adjunto (defecto conocido todas las playas) → Guardado, pendiente envío manual |

## Registros creados en sistema

| Ref / Cliente | Tipo | Detalle | Estado |
|---------------|------|---------|--------|
| Nro. 23 — Agro Maquinas Kukenan (J-504221724) | Cobro normal | Efectivo BS 384.943,81 (doc *009089) | **ENVIADO** |
| FERRETERIA MUNDIAL (065027207) | Cobro con retención | IVA 10,00 + ISLR 5,00, neto 79.857,58; luego se le cambió Fecha Tasa→78.829,06 | Guardado (pendiente envío manual) |
| DANIELA HERNANDEZ F.P. (V161051485) | Anticipo/Prepago | Efectivo 100,00 | Guardado (pendiente envío manual) |
| DANIELA HERNANDEZ F.P. (V161051485) | Cobro normal ("Guardar y salir") | Solo cliente (sin pago) | Guardado (pendiente envío manual) |
| MULTIREPUESTOS DRG (074820707) | Retención (tipo menú) | 1 documento | Guardado (pendiente envío manual — envío requiere adjunto) |
| FERRETERIA MUNDIAL (065027207) — pago parcial | Cobro normal | Efectivo parcial 40.000,00 sobre doc *026088 | **ELIMINADO** (DM-COB-026) |

Nota: el cobro de "pago parcial" se guardó bajo FERRETERIA (el documento *026088 es común a varios clientes de emp 2); se usó luego para verificar borrado (026).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| **Selección de empresa (multi-empresa jerez)** | cliente (jerez) | El modal `#clienteSelectModal` lista SOLO los clientes de la empresa activa. La empresa se cambia con el `ion-select` de **Empresa en el form General** (value objeto `{idEnterprise,coEnterprise,...}`), NO dentro del modal. Cambiar empresa dispara alert "Se ha detectado cambio del empresa... deberá iniciar nuevamente la transacción" (Cancelar/Aceptar). Empresa 1 (00001)=clientes saldo 0 sin docs; empresa 2/3=clientes ROJO con docs |
| **Searchbar del modal de clientes** | cliente (jerez) | Es `input.search-input.inputsSearch` (placeholder "Clientes..."), NO `ion-searchbar`. ⚠ El filtro de texto NO responde a eventos sintéticos vía CDP (input/InputEvent/keyboard.type no disparan el listener Angular). Estrategia fiable: seleccionar el cliente directamente del DOM (lista de 50 con scroll virtual) o usar el selector de Empresa para acotar |
| Acordeón Efectivo (Pagos) | universal | `ion-accordion value="efectivo0"`; expandir con `grp.value="efectivo0"` + ionChange. Campos: Nro. Recibo, Monto (centavos acumulativo), Fecha |
| Monto métodos = centavos acumulativo | universal | El input Monto interpreta dígitos como centavos: BS 384.943,81 → teclear `38494381` (Backspace para limpiar + keyboard.type + Tab + blur). El punto/coma se ignora |
| Detalle documento — campos retención | cliente (jerez, retencion=true) | Modal "Detalle Del Documento" (`ion-modal.show-modal`, id `eventModal`). Nro. Comp Ret = ion-input editable (nota "Debe tener 14 caracteres" — hint persistente rojo, NO bloquea Guardar). Al teclear 14 díg aparecen Fecha Comp Ret + Monto retenido IVA + Monto retenido ISLR. Monto a pagar = saldo − IVA − ISLR |
| Toggle Pago parcial (detalle) | universal | `ion-toggle` en row con label "Pago parcial:" (al final del detalle); al activar (false→true), el ion-input "Monto a pagar BS" pasa editable. Enfocar con `nat.focus()`+click para teclear el parcial |
| Abrir detalle documento (search-sharp) | universal | `ion-icon[name="search-sharp"]` (col Seleccione, x≈19-27) habilitado solo tras marcar checkbox del doc. Abrir con Pointer(down/up)+`shadowBtn.click()`+MouseEvent('click') sobre el `ion-button` padre; coords exactas del centro del icono |
| Moneda doc filtra lista | cliente (jerez) | Tab Documentos: selector Moneda doc default "Moneda" (sin filtro, 0 docs visibles) → elegir USD/BS carga la lista. Los docs del cliente son USD; en un cobro $ tipo IGTF la lista a veces no carga (ver hallazgo IGTF) |
| Fecha Tasa recálculo | universal | `ion-button.letrasFechasButton` → modal `fechasModal` con ion-datetime: setear `dt.value` ISO + ionChange + Aceptar en shadowRoot → alert "Está cambiando la fecha de la tasa, esto recalculará los montos. ¿Desea continuar?" → recalcula Monto total a pagar. La app ajusta a la fecha con tasa disponible más cercana (1/6→4/6) |
| Botones home (textos exactos) | cliente (jerez) | COBRO · BUSCAR · RETENCIÓN · IGTF · COBRO 25% IVA · ANTICIPO/PREPAGO |
| Mensajes de guardado por tipo | universal | "El Cobro se ha guardado" / "El Anticipo se ha guardado" / "La Retención se ha guardado" |

## Hallazgos / Discrepancias VG vs UI (no FAIL, requieren revisión de config)

1. **IGTF visible pese a `userCanSelectIGTF=false`** (id97): el botón **IGTF** aparece en el home y abre un cobro tipo IGTF funcional (5 tabs, clientes seleccionables). Además, en el **Tab Documentos de un cobro normal** existe un selector IGTF con opciones "IGTF - 0%" e "IGTF 3% - 3%". La VG del CSV dice false pero la UI lo expone. **Posible bug de configuración o VG desactualizada.** No se pudo completar el cobro $ tipo IGTF (no se cargó documento USD elegible en esta corrida), por lo que 044/045 quedan N/A operativo, no verificados.

2. **COBRO 25% IVA — botón presente pero sin clientes** (`userCanCollectIva=true`, `cliente_25iva=null`): el botón abre el flujo pero el modal de cliente muestra "No hay clientes disponibles" → DM-COB-037 N/A confirmado (ningún cliente habilitado 25% IVA en ninguna empresa).

3. **Reset visual del Tab Documentos al reabrir un Guardado**: al reabrir un cobro Guardado, el Tab Documentos resetea el selector Moneda doc a "Moneda" (sin filtro) y el checkbox del documento aparece desmarcado, mostrando "Monto total a pagar 0,00" momentáneamente. **El dato guardado NO se corrompe** (el pago Efectivo y la retención IVA/ISLR persisten correctamente, verificado en el detalle y en la Diferencia). Es un comportamiento de la vista, no pérdida de datos. No es FAIL.

4. **Dirty-guard funciona en jerez**: el modal "Guardar y salir / Salir sin guardar / Cancelar" aparece de forma fiable con la secuencia de 5 eventos pointer/mouse sobre el `<a>` padre de `img.fechaAtras` (igual que central_foods, ≠ globalmp). DM-COB-020/021/038 NO son SKIP en jerez.

5. **Retención persiste en round-trip (042)**: el bug conocido (monto vuelve al bruto al reabrir) NO reproduce en jerez — el neto 79.857,58 y los montos IVA 10,00 / ISLR 5,00 se conservan al reabrir el Guardado.
