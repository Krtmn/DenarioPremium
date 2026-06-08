# Smoke — COBROS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.cobros`
**VGs clave:** leer antes de ejecutar:
- `vgs.requiredCollectionAttachments` → DM-COB-016/018/019
- `vgs.retencion` + `vgs.sizeRetention` → DM-COB-041/042 (retención en detalle de documento)
- `vgs.cobroRetencion` → DM-COB-029 (botón RETENCIÓN home)
- `vgs.multiCurrency` → DM-COB-033/034
- `vgs.requiredComment` → DM-COB-006

---

## Casos (~30, orden de ejecución)

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-COB-001 | Click módulo Cobros | Botones COBRO y BUSCAR siempre visibles; RETENCIÓN/IGTF/25%IVA/ANTICIPO según VGs | FAIL: COBRO o BUSCAR ausentes |
| DM-COB-002 | Click COBRO → formulario | 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; campo Cliente vacío | FAIL: tabs habilitadas sin cliente |
| DM-COB-004 | Seleccionar `cliente_test` en modal (`h.clickIonItem`); llenar Comentario si `requiredComment=true` (`h.fillIonInput`) | 4 tabs habilitadas | FAIL: tabs siguen bloqueadas |
| DM-COB-006 | Con cliente seleccionado, dejar Comentario vacío e intentar guardar o navegar a otra tab | Borde de error + etiqueta roja en campo Comentario | N/A si `vgs.requiredComment=false`; FAIL: no aparece error o permite guardar con campo vacío |
| DM-COB-007 | Tab Documentos | Lista de documentos + leyenda Vigente/Vencido/A favor | FAIL: tab vacía con documentos en catálogo |
| DM-COB-008 | Click checkbox en documento (coordenadas con `pg.mouse.click`) | Monto total a pagar en sticky de Pagos actualizado | FAIL: monto no cambia |
| DM-COB-015 | Desplazarse al final del Tab Total | Línea "Total General [moneda]: X" visible | FAIL: Total General ausente o vacío |
| DM-COB-033 | Tab General → selector de moneda del cobro → cambiar entre monedas disponibles | Selector habilitado con al menos 2 opciones; campo actualiza | N/A si `vgs.multiCurrency=false`; FAIL: selector bloqueado con VG activa |
| DM-COB-034 | Tab Documentos → selector Moneda documento → cambiar entre monedas | Lista de documentos recarga/filtra por moneda | N/A si `vgs.multiCurrency=false`; FAIL: documentos no cambian al cambiar moneda |
| DM-COB-041 | Tab Documentos → abrir **detalle** de 1 documento en rojo → ingresar comprobante (longitud exacta según UI «Debe tener N caracteres»; leer de `vgs.sizeRetention`) + fecha retención + monto IVA + ISLR (leer de `modules.cobros.monto_retencion_iva/islr`) → Guardar detalle; Comentario cobro: `Test-COB-041` | Tab Pagos muestra monto neto = saldo − (IVA + ISLR) | N/A si `vgs.retencion=false`; FAIL: Pagos muestra monto bruto sin restar retenciones |
| DM-COB-042 | (encadena DM-COB-041) Completar método de pago con monto = monto neto → Guardar cobro → BUSCAR → reabrir cobro Guardado → verificar Tab Pagos y detalle documento | Pagos muestra mismo monto neto; detalle documento conserva IVA + ISLR | N/A si DM-COB-041 N/A; **FAIL conocido:** al reabrir el total puede volver al bruto (bug pendiente de fix) |
| DM-COB-009 | Tab Pagos → Click "Agregar método de pago" | Modal con métodos habilitados para el cliente | FAIL: modal no abre |
| DM-COB-040 | Marcar `metodo_pago` → AGREGAR → `h.selectIonPopover` banco → `h.fillIonInput` nro depósito + monto = total | Diferencia en **azul** (0,00) | FAIL: diferencia en rojo con datos completos |
| DM-COB-012 | Monto < total → observar diferencia; monto = total → observar | Rojo cuando insuficiente; azul cuando cubre | FAIL: color no cambia |
| DM-COB-043 | (extiende DM-COB-012) Con documento seleccionado y método de pago activo: ingresar monto < total → diferencia **roja**; monto = total → diferencia **azul** | Color cambia correctamente en ambas situaciones | FAIL: color no cambia; diferencia no se actualiza |
| DM-COB-014 | Tab Total | Tabla + acordeones por método; totales no nulos | FAIL: tab vacía |
| DM-COB-016 | Tab Adjuntos | Acordeones Imágenes/Archivo/Firma visibles según VGs | FAIL: acordeón Imágenes ausente — ver nota adjunto abajo |
| DM-COB-018 | Click Guardar | Alert "El Cobro se ha guardado"; cobro en BUSCAR Estatus: Guardado | FAIL: sin alert |
| DM-COB-019 | Click Enviar → ACEPTAR | Cobro "Por Enviar"/"Enviado" SIN segunda alerta | ⏭ SKIP si `vgs.requiredCollectionAttachments=true` — ver nota abajo |
| DM-COB-022 | Click BUSCAR | Lista con cobros + searchbar; botón eliminar solo en Guardado | FAIL: lista vacía |
| DM-COB-024 | Click en cobro Guardado | Formulario editable; botones guardar/enviar activos; **verificar que montos y retenciones (si DM-COB-041 aplicó) se mantienen al reabrir** | FAIL: solo lectura; montos no coinciden con lo guardado |
| DM-COB-026 | Botón basura en Guardado → confirmar ELIMINAR | Cobro desaparece | FAIL: persiste |
| DM-COB-020 | Pulsar atrás con cobro nuevo con cambios | Modal 3 opciones: Guardar y salir / Salir sin guardar / Cancelar | FAIL: sale sin modal |
| DM-COB-021 | Elegir "Salir sin guardar" (cobro **nuevo**, nunca guardado) | Cobro no aparece en BUSCAR | FAIL: aparece Guardado |
| DM-COB-038 | Pulsar atrás → "Guardar y salir" | Cobro aparece en BUSCAR Estatus: Guardado | FAIL: no en lista |
| DM-COB-029 | Click RETENCIÓN → cliente → documentos → Tab Total → Guardar | Guardado OK (sin Tab Pagos); Envío según nota adjunto abajo | N/A si `vgs.cobroRetencion=false`; SKIP envío si `requiredCollectionAttachments=true` |
| DM-COB-028 | Click ANTICIPO/PREPAGO → cliente → Tab Pagos (sin Documentos) → monto → Guardar | Guardado OK; sin tab Documentos | N/A si `vgs.cobroPrepago=false` (leer `smoke_na_estructural` del perfil) |
| DM-COB-036 | Click IGTF → cliente → selector tasa IGTF → documento → Guardar/Enviar | Guardado y Enviado OK | N/A si `vgs.userCanSelectIGTF=false` |
| DM-COB-037 | Click COBRO 25% IVA → flujo igual que cobro normal | Guardado y Enviado OK | N/A si `vgs.userCanCollectIva=false` |
| DM-COB-039 | Abrir Guardado → cambiar tasa (`h.fillIonInput` `#manualRateInput`) → blur → Guardar | Montos recalculados; al reabrir tasa nueva persiste | N/A si `vgs.enabledManualRate=false` |

---

## ⚠ Nota — Adjunto obligatorio (DM-COB-016 / DM-COB-019 / DM-COB-029)

**Si `vgs.requiredCollectionAttachments=true` (leer perfil cliente):**
- DM-COB-016: verificar acordeones visibles → **PASS**. NO intentar agregar foto.
- DM-COB-018: guardar → **PASS**.
- DM-COB-019: marcar **⏭ SKIP**. Documentar cobro como "Guardado, pendiente envío manual por QA".
- DM-COB-029 envío: igual → **⏭ SKIP**.
- Incluir cobros Guardados en tabla "Registros creados en sistema" con nota "Pendiente envío manual".

**Si `vgs.requiredCollectionAttachments=false`:**
- DM-COB-016, DM-COB-018, DM-COB-019: ejecutar normalmente.
- DM-COB-019 PASS si cobro queda "Por Enviar"/"Enviado" sin segunda alerta de adjunto.

## ⚠ Nota — Retención en documento (DM-COB-041 / DM-COB-042)

`vgs.retencion` controla si los campos de retención aparecen en el **detalle de un documento** dentro de un cobro normal (distinto de `cobroRetencion` que controla el botón RETENCIÓN home).

- Leer `vgs.sizeRetention` para saber la longitud exacta del número de comprobante (8, 14 o 16 caracteres según UI).
- Leer `modules.cobros.documento_retencion` para el documento de prueba (factura en rojo con saldo conocido).
- Leer `modules.cobros.monto_retencion_iva` y `monto_retencion_islr` para los montos de retención.
- DM-COB-042: FAIL conocido si al reabrir el cobro el monto en Pagos vuelve al bruto — documentar como FAIL (bug activo) pero continuar corrida.
