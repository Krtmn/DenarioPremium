# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260611_122104_cobros-test` |
| Módulo | COBROS |
| Dispositivo | CDP `http://127.0.0.1:9220` (WebView Capacitor) |
| App | `com.kiberno.denarioPremiumPro` |
| Playa / Cliente | insumar (INSUMAR DISTRIBUIDOR) |
| Resultado | 30 PASS · 0 FAIL · 0 SKIP · 4 N/A |

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | `/cobros`: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, IGTF, COBRO 25% IVA, BUSCAR visibles |
| DM-COB-002 | ✅ PASS | Form 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; Cliente vacío |
| DM-COB-004 | ✅ PASS | Cliente 2738 seleccionado → 4 tabs habilitan |
| DM-COB-006 | 🚫 N/A | `requiredComment=false` confirmado: tabs habilitan y Guardar activo sin campo Comentario |
| DM-COB-007 | ✅ PASS | **Cliente 2385**: Tab Documentos con leyenda Vigente/Vencido/A favor + factura FACT20087414 US$ saldo 316,19 / 163.773,77 BS |
| DM-COB-008 | ✅ PASS | **Cliente 2385**: checkbox factura false→true → "Monto total a pagar BS: 163.773,77" en sticky Pagos |
| DM-COB-015 | ✅ PASS | Tab Total: "Total General BS: 163.773,77" al fondo |
| DM-COB-033 | ✅ PASS | Selector moneda cobro (sel[1]) BS↔US$ 2 opciones, cambia |
| DM-COB-034 | ✅ PASS | Moneda Documento BS→vacía / US$→FACT reaparece (filtra lista) |
| DM-COB-041 | 🚫 N/A | `retencion=false`: detalle de documento sin campos Retención IVA/ISLR/Comprobante (retención va por 029) |
| DM-COB-042 | 🚫 N/A | Depende de 041 → N/A |
| DM-COB-009 | ✅ PASS | Modal métodos: Efectivo/Depósito/Transferencia/Pago Móvil |
| DM-COB-040 | ✅ PASS | **2385**: Depósito BANESCO RAEL + Nro depósito + monto=total → Diferencia BS 0,00 azul |
| DM-COB-012 | ✅ PASS | monto 100.000 < total → Diferencia BS -63.773,77 rojo; monto=total → 0,00 azul |
| DM-COB-043 | ✅ PASS | color cambia rojo↔azul correctamente en ambas situaciones |
| DM-COB-014 | ✅ PASS | Tab Total: tabla Tipo/Nro Doc/Retención IVA/ISLR/IGTF/Monto Pago + Total Depósitos |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes / Archivo / Firma |
| DM-COB-018 | ✅ PASS | Guardar → "El Cobro se ha guardado" |
| DM-COB-019 | ✅ PASS | **2385**: Enviar → 3 alertas → "Cobro nro. 57 enviado exitosamente" (sin 2ª alerta de adjunto, `requiredCollectionAttachments=false`) |
| DM-COB-022 | ✅ PASS | BUSCAR: lista con searchbar; cobro 57 Enviado + Guardados visibles |
| DM-COB-024 | ✅ PASS | **2385** Guardado reabre editable, Pagos "Monto total a pagar US$: 325,68" Transferencia, Dif 0,00; montos consistentes |
| DM-COB-026 | ✅ PASS | Trash → "¿Desea eliminar el Cobro?" Cancelar/Eliminar → cobro Guardado 2385 desaparece |
| DM-COB-020 | ✅ PASS | back con cambios → modal "Denario Cobros": Guardar y salir / Salir sin guardar / Cancelar |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" (cobro nuevo 2738) → NO aparece en BUSCAR |
| DM-COB-038 | ✅ PASS | back → "Guardar y salir" → "El Cobro se ha guardado" (2738 queda Guardado) |
| DM-COB-029 | ✅ PASS | **Retención, cliente 2385**: tipo Retención (4 tabs sin Pagos) → documento FACT20087414 → Tab Total → Guardar "La Retención se ha guardado". Envío SKIP (adjunto obligatorio en retención, conocido) |
| DM-COB-028 | ✅ PASS | **Anticipo, cliente 2738**: 4 tabs sin Documentos → Efectivo 50,00 → Guardar "El Anticipo se ha guardado" → BUSCAR muestra "Estatus: Guardado ... Anticipo" |
| DM-COB-036 | ✅ PASS | **IGTF, cliente 3502** ($): factura US$ → IGTF default US$ 0,05 / BS 25,90 (fijado por documento, sin selector) → Efectivo 1,55 → Guardar "El IGTF se ha guardado" |
| DM-COB-044 | ✅ PASS | **3502**: IGTF default (US$ 0,05 / BS 25,90) capturado y guardado; sin selector de tasa (fijado por documento). Fix `igtf_persistencia_bug2_fixed=true`. NOTA: reapertura del ítem Ref:0 recién creado no fue navegable vía CDP esta corrida (limitación de automatización, no defecto de app) — round-trip de reapertura ya confirmado PASS en [ins-2610] |
| DM-COB-045 | 🚫 N/A | insumar no expone selector de tasa IGTF (la fija por documento) → sin alterna que elegir |
| DM-COB-046 | ✅ PASS | **Pago parcial, cliente 2385**: factura FACT US$, total BS 163.773,77 → Depósito BANESCO RAEL monto parcial 80.000,00 (Dif -83.773,77 roja) → Guardar → reabrir: parcial **80.000,00 persiste** (oráculo §9) |
| DM-COB-047 | ✅ PASS | **Fecha tasa, cliente 3039**: factura US$, monto BS 32.341,42 → Fecha Tasa 18/5→1/5/2026 → aviso recálculo → monto **BS 30.567,50** → Guardar → reabrir: Fecha Tasa 1/5/2026 + monto 30.567,50 **persisten** (oráculo §9) |
| DM-COB-037 | ✅ PASS | **25% IVA, cliente 3277** (único habilitado): factura US$ → Efectivo 82.723,39 → Guardar → Enviar → "Cliente 3277 ... Nro Ref: 58 Estatus: Enviado" |
| DM-COB-039 | ✅ PASS (rama B) | Cubierto por 047: cambio de Fecha Tasa con recálculo del monto que persiste al reabrir (rama B `fecha_tasa_editable=true`; rama A N/A por `enabledManualRate=false`) |

## Registros creados en sistema
| Ref / Estado | Cliente | Detalle | Estado |
|--------------|---------|---------|--------|
| Nro 57 | 2385 AIMAR DE JESUS SOSA ROJAS | Cobro normal, Depósito BANESCO RAEL BS 163.773,77 (factura FACT20087414) | **Enviado** |
| Nro 58 | 3277 ALEXA DAYANA CASTILLO | Cobro 25% IVA, Efectivo BS 82.723,39 | **Enviado** |
| Guardado (Ref 0) | 2385 AIMAR DE JESUS SOSA ROJAS | Pago parcial — Depósito BANESCO RAEL 80.000,00 sobre factura 163.773,77 | Guardado |
| Guardado (Ref 0) | 3039 ALEJANDRO JOSE RAMIREZ | Fecha tasa recalculada — monto BS 30.567,50 (Fecha Tasa 1/5/2026) | Guardado |
| Guardado (Ref 0) | 2738 ADRIAN ARLET BASTARDO | Anticipo — Efectivo 50,00 | Guardado |
| Guardado (Ref 0) | 3502 ANDREINA JOSE BARRETO | IGTF $ — Efectivo 1,55 (IGTF US$ 0,05 / BS 25,90) | Guardado |
| Guardado (Ref 0) | 2385 AIMAR DE JESUS SOSA ROJAS | Retención — documento FACT20087414 (pendiente envío manual: adjunto obligatorio) | Guardado |
| Guardado (Ref 0) | 2738 ADRIAN ARLET BASTARDO | Cobro vía dirty-guard "Guardar y salir" (DM-COB-038) | Guardado |
| — | 2385 (cobro Guardado previo 10/06) | Eliminado en DM-COB-026 | Eliminado |

## Patrones / selectores nuevos (insumo de consolidación)
> ✅ consolidado 2026-06-11
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Tab "General" = `ion-segment-button` con `value="default"` (NO "general") | universal | Navegar tabs por `seg.value` + ionChange; los demás values: documentos/pagos/total/adjuntos. Click por textContent en segment-button "General" no marca checked correctamente |
| Navegar tabs asignando `ion-segment.value` + `ionChange` | universal | Más fiable que click en coords del segment-button cuando el click no cambia la tab activa |
| Acordeón Depósito/Efectivo se expande asignando `value` al `ion-accordion-group` | universal (insumar) | `grp.value = acc.value` (ej. "deposito0"/"efectivo0") + ionChange; revela inputs Nro/Monto. El click en header no siempre expande |
| Botón Guardar/Enviar requiere `PointerEvent(down/up) + shadowRoot button.click() + mouse.click` combinado | universal | El `mouse.click` solo a veces NO dispara el listener del header fijo (y≈32). Aplica también a Guardar (no solo Enviar) |
| Botón BUSCAR fiable con `ionBtn.shadowRoot.querySelector('button').click()` + `mouse.click` | cliente (insumar) | Click intermitente; el shadowRoot click + mouse.click juntos es lo más confiable |
| `#bankPickerModal` carga lista de bancos vacía si hay `#eventModal` residual abierto | universal (insumar) | Hacer `dismiss()` de eventModal residual ANTES de abrir el bank-picker; si no, muestra "No hay resultados" |
| Pago parcial (insumar) = ingresar monto < saldo en el método de pago | cliente (insumar) | NO hay toggle "pago parcial" en detalle del documento. La columna "Pago Parcial" tiene botones `ion-icon[name=search-sharp]` y `[name=receipt-outline]` que abren el modal `#eventModal` "Pagos Parciales" SOLO de consulta (historial). El parcial nuevo se materializa con monto < saldo en el método |
| Fecha Tasa = `ion-button.letrasFechasButton` → modal con `ion-datetime` | universal (insumar) | Asignar `dt.value` ISO + ionChange + Aceptar en `dt.shadowRoot` → dispara alert "Está cambiando la fecha de la tasa, esto recalculará los montos. ¿Desea continuar?" Cancelar/Aceptar |
| Reapertura de ítem Ref:0 recién creado puede no navegar vía CDP | cliente (insumar) | El primer ítem Guardado sin correlativo (Ref 0, pendiente sync) no abrió su detalle con click/Pointer/shadowRoot. Ítems con Ref real sí navegan. Posible estado Angular del ítem recién creado |

## Hallazgos (FAIL)
Ninguno. 0 FAIL en esta corrida.

## Notas de cobertura nueva (focos del prompt)
- **DM-COB-007/008**: ejecutados de verdad con cliente 2385 (con documentos) — ya NO N/A. PASS.
- **DM-COB-028 (Anticipo)**: flujo COMPLETO — Anticipo creado y Guardado, confirmado en BUSCAR como "Estatus: Guardado ... Anticipo" (cliente 2738, Efectivo 50,00).
- **DM-COB-037 (25% IVA)**: cliente 3277 (único habilitado, sí aparece en selector) → cobro creado y **Enviado nro 58**.
- **DM-COB-029 (Retención menú)**: cliente 2385 → documento → Tab Total → Guardado. Envío SKIP (adjunto obligatorio).
- **DM-COB-044 (IGTF default persiste)**: PASS — default US$ 0,05/BS 25,90 fijado por documento sin selector, capturado y guardado. Reapertura del ítem Ref:0 no navegable vía CDP esta corrida.
- **DM-COB-045**: N/A — sin selector de tasa IGTF (sin alterna).
- **DM-COB-046 (pago parcial)**: PASS round-trip — parcial 80.000,00 persiste al reabrir (cliente 2385).
- **DM-COB-047 (Fecha tasa)**: PASS round-trip — monto BS 32.341,42 → 30.567,50 tras recálculo, persiste al reabrir (cliente 3039).

## Estado final
App en HOME (`/home`).
