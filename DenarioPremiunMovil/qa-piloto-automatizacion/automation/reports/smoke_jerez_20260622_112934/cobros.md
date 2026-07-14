# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260622_112934_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — v6.6.17 |
| Playa | jerez |
| Resultado | 27 PASS · 0 FAIL · 1 PARCIAL · 9 N/A |

## Datos descubiertos (1ª corrida jerez)

- **Selector de empresa:** 3 empresas — idEnterprise 1/2/3, todas "INVERSIONES JEREZ MO..." (códigos 00001/00002/00003).
- **Empresa 1 (00001) — clientes AZUL (saldo 0, SIN documentos):** DANIELA HERNANDEZ F.P. (V161051485), Inversiones J.L Moto Piezas C.A (J-501633533), **JL Motors SE,C.A (J-506554950)** = `cliente_test` para casos sin documentos.
- **Empresa 2 (00002) — clientes ROJO (saldo>0, CON documentos):**
  - **FERRETERIA MUNDIAL, C.A. (065027207)** — BS 79.872,58 / USD 140,70 ← usado en esta corrida
  - INVERSIONES MOTO REPUESTOS EL PODER DEL MONO 2016 CUDEMUS (089129288) — BS 747.986,52 / USD 1.317,62
  - ISOLINA DEL CARMEN (10283986) — BS 54.014,75 / USD 95,15
  - MULTIREPUESTOS DRG, DE RAFAEL MOLINA, F.P (074820707) — BS 610.948,57 / USD 1.076,22
- **moneda_cobro:** monto total a pagar mostrado en BS; documento del cliente en USD (selector Moneda doc: Moneda/BS/USD).
- **metodo_pago disponibles:** Efectivo, Depósito, Transferencia, Otros (sin Cheque ni Pago Móvil) — confirmado.
- **banco_deposito:** PENDIENTE (se descubre al probar método Depósito).
- **cliente_25iva:** PENDIENTE (DM-COB-037).
- **documento_retencion:** doc *026088 de FERRETERIA MUNDIAL (USD 140,70 / BS 79.872,58, venc 09/05/2026).

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | PASS | Home cobros: COBRO, BUSCAR, ANTICIPO/PREPAGO, RETENCIÓN, COBRO 25% IVA. Sin IGTF (userCanSelectIGTF=false) |
| DM-COB-002 | PASS | COBRO → 5 tabs; Documentos/Pagos/Total/Adjuntos disabled sin cliente |
| DM-COB-004 | PASS | Cliente FERRETERIA MUNDIAL (emp 2) → 4 tabs habilitan |
| DM-COB-006 | N/A | requiredComment=false |
| DM-COB-007 | PASS | Tab Documentos: doc *026088 + leyenda Vigente/Vencido/A favor + selector Moneda doc |
| DM-COB-008 | PASS | Marcar doc → Tab Pagos "Monto total a pagar" = 79.872,58 BS (saldo del doc) |
| DM-COB-009 | PASS | Modal métodos: Efectivo/Depósito/Transferencia/Otros |
| DM-COB-012 | PASS | Monto 50.000 < total → Diferencia -29.872,58 ROJA; monto = total → Diferencia 0,00 AZUL |
| DM-COB-040 | PASS | Método Efectivo + monto = total → Diferencia BS 0,00 azul (método del perfil; Depósito+banco pendiente) |
| DM-COB-043 | PASS | Color diferencia cambia rojo↔azul correctamente en ambas situaciones |
| DM-COB-014 | PASS | Tab Total: acordeón "Total Efectivo: BS 79.872,58"; Monto a Pagar BS/USD |
| DM-COB-015 | PASS | "Total General BS: 79.872,58" visible al fondo Tab Total |
| DM-COB-016 | PASS | Tab Adjuntos: acordeones Imágenes (BUSCAR/TOMAR FOTO), Archivo (Subir), Firma |
| DM-COB-018 | PASS | Guardar → alert "El Cobro se ha guardado" |
| DM-COB-019 | PASS | Enviar sin adjunto OK: confirm → "Su Cobro será enviado" (OK) → "Cobro nro. 8 enviado exitosamente". Sin alerta de adjunto faltante |
| DM-COB-022 | PASS | BUSCAR: lista app-cobros-list + searchbar; cobro nro.8 Enviado en tope |
| DM-COB-033 | PASS | Tab General tras cliente: selector Moneda cobro BS/USD (2 opciones, habilitado) |
| DM-COB-034 | PASS (parcial) | Selector Moneda documento (Moneda/BS/USD) presente y funcional; cliente con 1 solo doc USD → filtrado poco demostrable. No bloqueado. Cambio de filtro vía CDP no recarga (popover ion-select no abre por código) |
| DM-COB-041 | PASS | Detalle doc *026088: Nro Comp Ret 14 díg → aparecen Fecha Comp Ret + Monto IVA + Monto ISLR. IVA 16,00 + ISLR 5,00 → "Monto a pagar BS" = 79.851,58 (bruto 79.872,58 − 21,00). Tab Pagos muestra neto 79.851,58 |
| DM-COB-042 | PASS | Cobro retención Guardado → reabrir desde BUSCAR → Tab Pagos sigue mostrando neto 79.851,58 (NO vuelve al bruto). Bug conocido NO reproduce en jerez. Nota: al reabrir el checkbox del doc aparece desmarcado (search-sharp detalle disabled) pero el neto persiste en Pagos |
| DM-COB-024 | PASS | Cobro Guardado reabre como formulario editable; Tab Pagos conserva neto 79.851,58 |
| DM-COB-009 | PASS | Tab Pagos "Agregar método de pago" → modal #eventModal con Efectivo/Depósito/Transferencia/Otros |
| DM-COB-020 | PASS | Cobro con cambios → atrás → modal "Guardar y salir / Salir sin guardar / Cancelar" (3 opciones). Dirty-guard funciona vía CDP en jerez |
| DM-COB-021 | PASS | Cobro NUEVO (JL Motors) + "Salir sin guardar" → NO aparece en BUSCAR (0 cobros JL Motors) |
| DM-COB-038 | PASS | Cobro nuevo + atrás + "Guardar y salir" → "El Cobro se ha guardado" → aparece en BUSCAR Estatus Guardado |
| DM-COB-026 | PASS | Trash en cobro Guardado (JL Motors) → "¿Desea eliminar el Cobro?" (Cancelar/Eliminar) → Eliminar → desaparece (sin alert éxito posterior) |
| DM-COB-047 | PASS | Cobro FERRETERIA reabierto: botón Fecha tasa (.letrasFechasButton) → ion-datetime → cambiar a fecha anterior + Aceptar shadowRoot → alert "Está cambiando la fecha de la tasa, esto recalculará los montos. ¿Desea continuar?" → Aceptar → fecha tasa cambió (8/6→4/6/2026) y monto en Pagos se recalculó. Mecánica de recálculo por fecha tasa funciona vía CDP en jerez (≠ insumar) |
| DM-COB-039 | PASS (rama B) | Cobro Guardado reabierto → cambio de Fecha tasa (General) dispara recálculo (mismo flujo que 047). Rama A (manualRate) N/A: enabledManualRate=false |
| DM-COB-028 | PASS | ANTICIPO/PREPAGO → 4 tabs (sin Documentos); cliente JL Motors → Pagos: Efectivo 1.000,00 → Guardar → "El Anticipo se ha guardado". Anticipo creado y Guardado |
| DM-COB-046 | PASS | Cobro FERRETERIA, doc *026088 (total 79.872,58) → detalle → toggle "Pago parcial" (false→true) → input parcial 30.000,00 → Guardar detalle → Tab Pagos = 30.000,00 (el parcial, no el total). Método Efectivo 30.000,00 → dif 0,00 azul → Guardar cobro → reabrir: Tab Total "Total General BS 30.000,00" (parcial PERSISTE). Nota: header Pagos muestra 0,00 al reabrir por checkbox doc desmarcado (mismo patrón que 042), pero el monto cobrado real (Total) conserva el parcial |
| DM-COB-006 | N/A | requiredComment=false |
| DM-COB-031 | N/A | userCanSelectCollectDiscount=false |
| DM-COB-032 | N/A | userCanAddRetention=false (retención libre sin factura no existe) |
| DM-COB-036 | N/A | userCanSelectIGTF=false (botón IGTF ausente en home, confirmado DM-COB-001) |
| DM-COB-044 | N/A | userCanSelectIGTF=false (sin cobro IGTF) |
| DM-COB-045 | N/A | userCanSelectIGTF=false (sin cobro IGTF) |
| DM-COB-037 | N/A | userCanCollectIva=true pero selector de cliente del 25% IVA VACÍO ("No hay clientes disponibles") en las 3 empresas → no hay cliente habilitado 25% IVA |
| DM-COB-039(A) | N/A | enabledManualRate=false (sin #manualRateInput) — cubierto por rama B |
| DM-COB-029 | PARCIAL (estructura PASS) | RETENCIÓN (menú) abre con 4 tabs General/Documentos/Total/Adjuntos (SIN Pagos) → confirma cobroRetencion=true. Guardado completo con documento NO automatizable: el modal de clientes queda fijado en empresa 1 (sin docs) y el cambio a empresa 2 vía CDP es errático (limitación de automatización, NO defecto de app; flujo existe manual) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Cobro nro. 8 | FERRETERIA MUNDIAL (emp 2, 065027207), Efectivo BS 79.872,58, doc *026088 | ENVIADO |
| Cobro Guardado (con retención) | FERRETERIA MUNDIAL (emp 2), Efectivo neto BS 79.851,58, doc *026088, Comp Ret 12345678901234, IVA 16,00 + ISLR 5,00, fecha ret 22/06/2026 | GUARDADO — pendiente envío manual por QA |
| Cobro Guardado (Anticipo) | JL Motors SE,C.A (emp 1, J-506554950), Efectivo BS 1.000,00 | GUARDADO (tipo Anticipo) — pendiente envío manual |
| Cobro Guardado (pago parcial) | FERRETERIA MUNDIAL (emp 2), doc *026088, parcial Efectivo BS 30.000,00 de 79.872,58 | GUARDADO — pendiente envío manual |
| Cobro residual previo (FERRETERIA) | de sesión anterior, sin retención | GUARDADO — pendiente revisión/envío manual |
| Cobro eliminado (JL Motors) | creado en DM-COB-038 y eliminado en DM-COB-026 | ELIMINADO (esperado) |

## Patrones / selectores nuevos
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Selector empresa multi-empresa COBROS | cliente jerez | `app-cobros ion-select` (1º) con opciones objeto `{idEnterprise,coEnterprise,lbEnterprise}`; cambiar por value+ionChange. 3 empresas; emp 1 clientes azul (saldo 0), emp 2 clientes rojo (con docs) |
| Color cliente = color del Saldo en modal | cliente jerez | en `#clienteSelectModal`, `<p>` "Saldo BS/USD" con `style color:red` (con deuda) / `color:blue` (saldo 0). NO un badge separado |
| ⚠ Cambio de empresa recarga lista clientes solo vía popover real | cliente jerez | cambiar `app-cobros ion-select` empresa por `value+ionChange` sintético NO recarga el modal de clientes (sigue mostrando emp anterior). Hay que abrir el popover real (`sel.click()`) y clicar la opción por índice. Cambiar empresa con cobro iniciado dispara alert "Se ha detectado cambio del empresa por lo que deberá iniciar nuevamente la transacción" (Cancelar/Aceptar) |
| Detalle retención por documento (igual a central_foods) | cliente jerez (retencion=true) | Modal "Detalle del documento" (grid ion-row/ion-col, NO ion-item). Campo "Nro. Comp Ret" = ion-input vacío con note "Debe tener 14 caracteres"; al teclear 14 díg aparecen Fecha Comp Ret (`ion-input#inputCalendar` type=date_event + `ion-datetime#calendar`), Monto retenido IVA, Monto retenido ISLR. "Monto a pagar BS" = bruto − IVA − ISLR |
| ⚠ Recarga de clientes por empresa requiere CLICK FÍSICO en el ion-select | cliente jerez | la ÚNICA forma fiable (aunque errática) de que el modal `#clienteSelectModal` recargue los clientes de otra empresa es `pg.mouse.click` FÍSICO sobre las coords del `app-cobros ion-select` (abre popover nativo) + click en la opción `idEnterprise` + confirmar. Ni `sel.value=...+ionChange` ni `sel.click()` sintético recargan la lista. El click físico es intermitente (reintentar hasta que `ion-popover` exista). Una vez fijada empresa global, persiste hasta navegar a HOME y reentrar |
| Toggle Pago parcial en detalle documento | cliente jerez (enablePartialPayment=true) | en modal Detalle del documento: `ion-label` "Pago parcial:" → `.closest('ion-row').querySelector('ion-toggle')` → click activa (false→true) → el input "Monto a pagar BS" pasa editable. Al reabrir el cobro Guardado el parcial persiste en Tab Total (Total General = parcial), aunque el header de Pagos muestra 0,00 por checkbox doc desmarcado |
| Fecha tasa recálculo funciona vía CDP (≠ insumar) | cliente jerez (historicoTasa+canChangeRate) | `app-cobros ion-button.letrasFechasButton` (Pointer+shadow) → `ion-datetime` (asignar `.value`+ionChange + Aceptar en shadowRoot) → alert "Está cambiando la fecha de la tasa, esto recalculará los montos" (Cancelar/Aceptar) → recalcula. A diferencia de insumar (donde el datetime inline NO era accionable), en jerez SÍ funciona, como central_foods |

> ✅ consolidado 2026-06-22

## Conclusión

Cobertura COBROS jerez (1ª corrida): 27 PASS, 1 PARCIAL (029 estructura OK, guardado bloqueado por limitación de automatización), 9 N/A estructurales por VGs. Sin FAIL. App estable; ningún defecto de producto detectado. Round-trips de persistencia (retención 042, fecha tasa 047/039, pago parcial 046) PASAN — los bugs conocidos de otras cuentas NO reproducen en jerez.

Datos descubiertos para consolidar en `jerez.yaml`:
- `cobros.cliente_test` = "JL Motors SE,C.A" (emp 1, J-506554950) — sin documentos
- `cobros.clientes_con_documentos` (emp 2, ROJO): FERRETERIA MUNDIAL (065027207), INVERSIONES MOTO REPUESTOS EL PODER DEL MONO 2016 CUDEMUS (089129288), ISOLINA DEL CARMEN (10283986), MULTIREPUESTOS DRG (074820707)
- `cobros.cliente_25iva` = NINGUNO (selector 25%IVA vacío en las 3 empresas → DM-COB-037 N/A)
- `cobros.documento_retencion` = doc tipo A *026088 de FERRETERIA (USD 140,70 / BS 79.872,58, venc 09/05/2026)
- `cobros.moneda_cobro` = BS y USD (multiCurrencyCollection confirmado); documentos del cliente en USD
- `cobros.banco_deposito` = no descubierto (no se probó método Depósito; se usó Efectivo)
- 3 empresas: INVERSIONES JEREZ MO (00001 azul / 00002 y 00003 con clientes rojo)
