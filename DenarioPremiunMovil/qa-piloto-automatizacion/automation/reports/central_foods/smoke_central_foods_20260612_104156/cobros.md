# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | COBROS |
| Cliente | central_foods (CENTRAL FOODS) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa | El Yaque (denarioelyaque.ddns.net) |
| Resultado | **28 PASS · 0 FAIL · 1 SKIP · 5 N/A** (34 casos) |

> Reporte escrito incrementalmente. VGs clave: requiredCollectionAttachments=true (envíos SKIP), retencion=true (041/042 aplican, sizeRetention=14), userCanSelectIGTF=false (036/044/045 N/A), userCanCollectIva=false (037 N/A), enablePartialPayment=true (046), historicoTasa+canChangeRate=true (047, 039-B), enabledManualRate=false (039-A N/A).

**Cliente usado:** ALEJANDRA LEDEZMA (Cód 00029) — Saldo BS 32.937,68 / US$ 57,03. Documentos US$: FACT0615669 (saldo 10,80 / BS 6.237,54), FACT0615878 (7,72), FACT0616209 (2,26), FACT0616267 (29,98), FACT0616402 (6,27).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Home Cobros: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, BUSCAR. SIN botón IGTF ni 25%IVA (coincide userCanSelectIGTF=false, userCanCollectIva=false). |
| DM-COB-002 | ✅ PASS | COBRO → 5 tabs; Documentos/Pagos/Total/Adjuntos disabled; Cliente vacío. |
| DM-COB-004 | ✅ PASS | Cliente ALEJANDRA LEDEZMA (00029) seleccionado → 4 tabs habilitadas. requiredComment=false (sin comentario). |
| DM-COB-006 | 🚫 N/A | requiredComment=false [csv] — comentario no obligatorio. |
| DM-COB-007 | ✅ PASS | Documentos: 5 facturas + leyenda Vigente/Vencido/A favor. |
| DM-COB-008 | ✅ PASS | Checkbox FACT0615669 → Pagos sticky "Monto total a pagar BS: 6.237,5400", Diferencia BS -6.237,54. |
| DM-COB-033 | ✅ PASS | General → selector Moneda cobro con 2 opciones (BS/US$); al cambiar a US$ alert "¿Seguro desea cambiar la moneda? El cobro será reiniciado!" (Cancelar/Aceptar). Cancelar mantiene BS + documento. multiCurrencyCollection=true confirmado. |
| DM-COB-034 | ✅ PASS | Documentos → selector Moneda Documento (Moneda/BS/US$): BS→0 docs (todos los del cliente son US$); US$→5 docs. Lista filtra por moneda. |
| DM-COB-009 | ✅ PASS | "Agregar método de pago" → modal con Efectivo/Depósito/Transferencia/Otros/Pago Móvil (sin Cheque, coincide VG). |
| DM-COB-040 | ✅ PASS | Efectivo + AGREGAR + Monto=6.237,54 → Diferencia BS 0,0000 en **azul**. |
| DM-COB-012 | ✅ PASS | Monto 3.000 (<total) → Diferencia -3.237,54 **rojo**; Monto=total → 0,0000 **azul**. |
| DM-COB-043 | ✅ PASS | Doc + método activo: monto<total → diferencia **roja**; monto=total → **azul**. Color cambia correctamente. |
| DM-COB-014 | ✅ PASS | Tab Total: tabla Monto a Pagar BS/US$ + Tasa + Pago + Diferencia, columnas Retención IVA/ISLR (retencion=true), acordeón "Total Efectivo: BS 6.237,54". Totales no nulos. |
| DM-COB-015 | ✅ PASS | Final del Tab Total muestra "Total General BS: 6.237,5400". |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes, Archivo, Firma (userCanUploadFiles=true). No se agrega foto (requiredCollectionAttachments=true). |
| DM-COB-018 | ✅ PASS | Guardar → alert "Denario Cobros / El Cobro se ha guardado". Cobro #1 (normal Efectivo BS 6.237,54). |
| DM-COB-019 | ⏭ SKIP | requiredCollectionAttachments=true → envío exige adjunto, no viable por CDP. Cobro queda Guardado (envío manual pendiente). |
| DM-COB-022 | ✅ PASS | BUSCAR → app-cobros-list con searchbar; cobro Guardado #1 con trash; ítems "Por aprobar"/Enviados SIN trash. |
| DM-COB-024 | ✅ PASS | Reabrir Guardado → form editable, Guardar/Enviar activos; Monto total a pagar BS 6.237,54 y Diferencia 0,00 persisten (round-trip §9 OK). |
| DM-COB-020 | ✅ PASS | Cobro nuevo con cambios → atrás (Pointer+Mouse sobre `<a>` de `img.fechaAtras`) → modal "Denario Cobros" con 3 opciones: Guardar y salir / Salir sin guardar / Cancelar. |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" en cobro nuevo (nunca guardado) → vuelve a home; no se crea registro en BUSCAR (sólo persisten los Guardados explícitos). |
| DM-COB-009 retest | — | (cubierto en 040) |
| DM-COB-046 | ✅ PASS | Cobro #2: factura FACT0615878 (total BS 4.458,69) → detalle documento (icono search-sharp `openDocumentSale`) → toggle "Pago parcial:" (false→true) → input parcial editable = 3,50 → Guardar detalle → Pagos "Monto total a pagar BS: 3,5000" (parcial, no total). Efectivo 3,50 → Diferencia 0,00 → Guardar cobro → BUSCAR → reabrir → Pagos sigue **BS 3,5000** (round-trip §9 OK). enablePartialPayment=true confirmado. |
| DM-COB-041 | ✅ PASS | Cobro #3: FACT0615878 (bruto BS 4.458,686) → detalle → Nro Comp Ret=12345678901234 (14 díg, nota "Debe tener 14 caracteres" coincide sizeRetention=14) + Fecha Comp Ret 2026-06-10 + IVA 1,0000 + ISLR 0,5000 → Guardar detalle. "Monto a pagar BS" = 4.457,186 (bruto − IVA − ISLR). Tab Pagos muestra **neto BS 4.457,1860** (no bruto). **1ª verificación real de retención por documento en esta cuenta.** |
| DM-COB-042 | ✅ PASS (sin bug) | Efectivo = 4.457,186 → Diferencia 0,00 → Guardar cobro → BUSCAR → reabrir → Pagos sigue **BS 4.457,1860**; detalle conserva comprobante/fecha/IVA 1,0000/ISLR 0,5000 (round-trip §9 OK). El bug conocido (volver al bruto al reabrir) **NO reproduce** en central_foods. |
| DM-COB-047 | ✅ PASS | Cobro #4: FACT0616209 (total BS 1.305,2630) → General → Fecha Tasa 11/6→20/5/2026 → alert "Está cambiando la fecha de la tasa, esto recalculará los montos. ¿Desea continuar?" (Cancelar/Aceptar) → Aceptar → Pagos recalculado a **BS 1.177,2566**. Efectivo 1.177,2566 → Guardar → BUSCAR → reabrir → Fecha 20/5/2026 y Pagos **BS 1.177,2566** persisten (round-trip §9 OK). |
| DM-COB-039 | ✅ PASS (rama B) | Sobre el cobro #4 **Guardado** reabierto: cambiar Fecha Tasa 20/5→4/6/2026 → mismo alert recálculo → Aceptar → Pagos recalcula a **BS 1.266,4588** (Diferencia -89,20 al no cubrir el pago previo). canChangeRate/historicoTasa=true confirmado. enabledManualRate=false → **rama A N/A** (sin #manualRateInput). |
| DM-COB-038 | ✅ PASS | Cobro nuevo (cliente+documento) → atrás → modal 3 opciones → "Guardar y salir" → "El Cobro se ha guardado" → vuelve a home. Aparece Guardado en BUSCAR. |
| DM-COB-028 | ✅ PASS | ANTICIPO/PREPAGO → 4 tabs (General/Pagos/Total/Adjuntos, **sin Documentos**) → cliente ALEJANDRA → Pagos: Efectivo + Monto 50,00 → Guardar → "El Anticipo se ha guardado". Visible en BUSCAR como tipo **Anticipo** (Guardado). cobroPrepago=true confirmado. |
| DM-COB-029 | ✅ PASS (envío SKIP) | RETENCIÓN → 4 tabs (General/Documentos/Total/**sin Pagos**) → cliente + FACT0615669 → Total → Guardar → "La Retención se ha guardado". Visible en BUSCAR tipo **Retención** (Guardado). Envío SKIP (adjunto obligatorio en retención, no viable por CDP). cobroRetencion=true confirmado. |
| DM-COB-026 | ✅ PASS | BUSCAR → trash de un cobro Guardado → alert "Denario Cobros / ¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → Eliminar → cobro desaparece (Guardados 7→6, sin alert de éxito posterior). |
| DM-COB-009 | ✅ PASS | (mismo modal de métodos de 040) "Agregar método de pago" abre con métodos habilitados. |

## Registros creados en sistema (todos Estatus: Guardado, cliente 00029 ALEJANDRA LEDEZMA)
| Ref | Tipo | Detalle | Estado |
|-----|------|---------|--------|
| #1 | Cobros | FACT0615669, Efectivo BS 6.237,54 (pago completo) | Guardado — pendiente envío manual (adjunto) |
| #2 | Cobros | FACT0615878, **Pago parcial** 3,50 (Efectivo) | Guardado — pendiente envío manual |
| #3 | Cobros | FACT0615878, **Retención** comp 12345678901234 + IVA 1,0000 + ISLR 0,5000, neto BS 4.457,186 (Efectivo) | Guardado — pendiente envío manual |
| #4 | Cobros | FACT0616209, **Fecha tasa 20/5/2026** recalc BS 1.177,2566 (Efectivo) | Guardado — pendiente envío manual |
| #5 | Anticipo | Efectivo 50,00 (DM-COB-028) | Guardado — pendiente envío manual |
| #6 | Retención | FACT0615669 (DM-COB-029) | Guardado — pendiente envío manual (adjunto obligatorio retención) |
| #7 | Cobros | "Guardar y salir" (DM-COB-038) | Guardado — luego **ELIMINADO** en DM-COB-026 |

> Envíos NO ejecutados: requiredCollectionAttachments=true + adjunto obligatorio en retención → todos los cobros quedan **Guardados pendientes de envío manual por QA**.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Dirty-guard back (cobro) requiere secuencia completa sobre `<a>` padre | cliente central_foods (build) | `img.fechaAtras` → `closest('a')` → disparar `pointerdown/mousedown/pointerup/mouseup/click` (los 5) sobre el `<a>`. `mouse.click` solo y `MouseEvent` solo NO disparan el guard. Modal "Denario Cobros": Guardar y salir / Salir sin guardar / Cancelar. Contrasta con globalmp (requería hardware back). |
| Detalle de documento (`openDocumentSale`) | universal COBROS | Icono `ion-icon[name="search-sharp"]` dentro de `ion-button` (col "Seleccione", x≈27) — **disabled hasta que el documento está `isSelected`**. Abrir con Pointer(down/up)+shadowBtn.click()+MouseEvent. `receipt-outline` (x≈136) = `openPartialPayment` (historial, solo lectura, NO el detalle). |
| Detalle de documento = ion-modal apilable | universal COBROS | "Detalle del documento" y "Pagos Parciales" son `ion-modal`. Si se apilan residuos (con `#eventModal`), cerrarlos con `m.dismiss()` sobre cada `ion-modal.show-modal`. Dismiss en cascada puede devolver hasta HOME. |
| Checkbox de documento (selección) | universal COBROS | `mouse.click` en coords del `ion-checkbox` es intermitente; fallback fiable: `cb.checked=true` + `dispatchEvent(CustomEvent('ionChange',{detail:{checked:true,value}}))`. |
| Item lista BUSCAR (abrir Guardado) | universal COBROS | `ion-item` con `detail="true"` sin `button`. Click fiable: secuencia completa pointer/mouse sobre el `ion-label` interno + el `ion-item`. `mouse.click` simple a veces no navega. |
| Retención por detalle de documento | cliente central_foods (retencion=true) | Nro Comp Ret = `ion-input` ngModel con nota `ion-note "Debe tener 14 caracteres"` (sizeRetention=14) → typear por teclado. Al validar comprobante aparecen Fecha Comp Ret (`ion-input#inputCalendar` type=date_event; setear `ion-datetime#calendar`.value + ionChange), Monto retenido IVA/ISLR (inputs cents-accumulator: 4 decimales, typear dígitos). "Monto a pagar BS" = bruto − IVA − ISLR. |
| Fecha Tasa recálculo | universal COBROS | `ion-button.letrasFechasButton` (Pointer+shadow) → `ion-datetime` (setear `.value` ISO + ionChange + Aceptar en shadowRoot) → alert "Está cambiando la fecha de la tasa, esto recalculará los montos. ¿Desea continuar?" (Cancelar/Aceptar) → recalcula "Monto total a pagar". Funciona en cobro nuevo (047) y Guardado reabierto (039-B). |
| Selector moneda cobro (033) | cliente central_foods (multiCurrencyCollection=true) | General: ion-select BS/US$ (2 opc). Cambiar dispara alert "¿Seguro desea cambiar la moneda? El cobro será reiniciado!" (Cancelar/Aceptar). Cancelar conserva moneda+documento. |
| Selector Moneda Documento (034) | cliente central_foods | Documentos: ion-select Moneda/BS/US$ filtra la lista; BS→0 docs (cartera US$), US$→5 docs. |

> ✅ consolidado 2026-06-12

## Discrepancias VG (CSV dev vs UI) y observaciones
- **IGTF realmente ausente:** home Cobros NO muestra botón IGTF → `userCanSelectIGTF=false` confirmado en UI. 036/044/045 N/A. No hay línea IGTF en Tab Total. ✔ coincide CSV.
- **25% IVA realmente ausente:** home Cobros NO muestra botón 25%IVA → `userCanCollectIva=false` confirmado. 037 N/A. ✔ coincide CSV.
- **enterpriseEnabled=false confirmado:** selector Empresa con 1 sola opción (CENTRAL FOODS C.A.), sin elección real. ✔
- **retencion=true confirmado en UI:** detalle de documento muestra campos Retención IVA/ISLR/Comprobante (14 díg) y Tab Total muestra columnas Retención IVA/ISLR. **041/042 ejecutados de verdad por 1ª vez en esta cuenta — PASS, sin el bug de reapertura.** ✔
- **enablePartialPayment=true confirmado:** toggle "Pago parcial:" presente en detalle. 046 PASS. ✔
- **multiCurrencyCollection=true confirmado:** selector moneda cobro activo (033/034 PASS). ✔
- **Métodos de pago en UI:** Efectivo / Depósito / Transferencia / Otros / Pago Móvil (Cheque ausente). ✔ coincide CSV.
- **requiredComment=false confirmado:** tabs se habilitan sin comentario. 006 N/A. ✔
- **requiredCollectionAttachments=true confirmado:** envío no ejecutado (019 SKIP); cobros quedan Guardados. ✔
- Sin discrepancias CSV↔UI detectadas.

## Hallazgos (FAIL)
Ninguno. 0 FAIL. Nota positiva: el bug conocido de DM-COB-042 (monto vuelve al bruto al reabrir) **NO reproduce** en central_foods — la retención por documento persiste correctamente (neto + IVA/ISLR) en el round-trip.
| DM-COB-036 | 🚫 N/A | userCanSelectIGTF=false [csv y UI: sin botón IGTF en home] → IGTF no disponible. |
| DM-COB-044 | 🚫 N/A | depende de IGTF (userCanSelectIGTF=false). |
| DM-COB-045 | 🚫 N/A | depende de IGTF (userCanSelectIGTF=false). |
| DM-COB-037 | 🚫 N/A | userCanCollectIva=false [csv y UI: sin botón 25%IVA en home] → cobro 25% IVA no disponible. |

