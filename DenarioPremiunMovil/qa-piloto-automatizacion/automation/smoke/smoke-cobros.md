# Smoke — COBROS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.cobros`
**VG clave:** leer `vgs.requiredCollectionAttachments` del perfil cliente antes de DM-COB-016/018/019.

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-COB-001 | Click módulo Cobros | Botones COBRO y BUSCAR siempre visibles; RETENCIÓN/IGTF/25%IVA según VGs | FAIL: COBRO o BUSCAR ausentes |
| DM-COB-002 | Click COBRO → formulario | 5 tabs; Documentos/Pagos/Total/Adjuntos `disabled`; campo Cliente vacío | FAIL: tabs habilitadas sin cliente |
| DM-COB-004 | Seleccionar `cliente_test` en modal (`h.clickIonItem`); llenar Comentario si `requiredComment=true` (`h.fillIonInput`) | 4 tabs habilitadas | FAIL: tabs siguen bloqueadas |
| DM-COB-007 | Tab Documentos | Lista de documentos + leyenda Vigente/Vencido/A favor | FAIL: tab vacía con documentos en catálogo |
| DM-COB-008 | Click checkbox en documento (coordenadas con `pg.mouse.click`) | Monto total a pagar en sticky de Pagos actualizado | FAIL: monto no cambia |
| DM-COB-009 | Tab Pagos → Click "Agregar método de pago" | Modal con métodos habilitados para el cliente | FAIL: modal no abre |
| DM-COB-040 | Marcar `metodo_pago` → AGREGAR → `h.selectIonPopover` banco → `h.fillIonInput` nro depósito + monto = total | Diferencia en **azul** (0,00) | FAIL: diferencia en rojo con datos completos |
| DM-COB-012 | Monto < total → observar diferencia; monto = total → observar | Rojo cuando insuficiente; azul cuando cubre | FAIL: color no cambia |
| DM-COB-014 | Tab Total | Tabla + acordeones por método; totales no nulos | FAIL: tab vacía |
| DM-COB-016 | Tab Adjuntos | Acordeones Imágenes/Archivo/Firma visibles según VGs | FAIL: acordeón Imágenes ausente — ver nota adjunto abajo |
| DM-COB-018 | Click Guardar | Alert "El Cobro se ha guardado"; cobro en BUSCAR Estatus: Guardado | FAIL: sin alert |
| DM-COB-019 | Click Enviar → ACEPTAR | Cobro "Por Enviar"/"Enviado" SIN segunda alerta | ⏭ SKIP si `vgs.requiredCollectionAttachments=true` — ver nota abajo |
| DM-COB-029 | Click RETENCIÓN → cliente → documentos → Tab Total → Guardar → Enviar | Guardado OK; Enviado OK (sin Tab Pagos) | N/A si `vgs.cobroRetencion=false`; SKIP envío si `requiredCollectionAttachments=true` |
| DM-COB-036 | Click IGTF → cliente → selector tasa IGTF → documento → Guardar/Enviar | Guardado y Enviado OK | N/A si `vgs.userCanSelectIGTF=false` |
| DM-COB-037 | Click COBRO 25% IVA → flujo igual que cobro normal | Guardado y Enviado OK | N/A si `vgs.userCanCollectIva=false` |
| DM-COB-020 | Pulsar atrás con cobro nuevo con cambios | Modal 3 opciones: Guardar y salir / Salir sin guardar / Cancelar | FAIL: sale sin modal |
| DM-COB-021 | Elegir "Salir sin guardar" (cobro **nuevo**, nunca guardado) | Cobro no aparece en BUSCAR | FAIL: aparece Guardado |
| DM-COB-022 | Click BUSCAR | Lista con cobros + searchbar; botón eliminar solo en Guardado | FAIL: lista vacía |
| DM-COB-024 | Click en cobro Guardado | Formulario editable; botones guardar/enviar activos | FAIL: solo lectura |
| DM-COB-026 | Botón basura en Guardado → confirmar ELIMINAR | Cobro desaparece | FAIL: persiste |
| DM-COB-038 | Pulsar atrás → "Guardar y salir" | Cobro aparece en BUSCAR Estatus: Guardado | FAIL: no en lista |
| DM-COB-039 | Abrir Guardado → cambiar tasa (`h.fillIonInput` `#manualRateInput`) → blur → Guardar | Montos recalculados; al reabrir tasa nueva persiste | N/A si `vgs.enabledManualRate=false` |
| DM-COB-028 | — | — | N/A si `vgs.cobroPrepago=false` (leer `smoke_na_estructural` del perfil) |

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
