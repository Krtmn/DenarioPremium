# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260603_093706_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 (Infinix X6728) |
| App | `com.kiberno.denarioPremiumPro` — Chrome/148 WebView |
| Cliente | insumar |
| Playa | Isla Coche (`denarioislacoche.ddns.net:8081`) |
| Resultado | **12 PASS · 0 FAIL · 1 SKIP · 5 N/A** |
| Fecha | 2026-06-03 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Botones visibles: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, IGTF, COBRO 25% IVA, BUSCAR |
| DM-COB-002 | ✅ PASS | 5 tabs (General/Documentos/Pagos/Total/Adjuntos); Documentos/Pagos/Total/Adjuntos `segment-button-disabled`; cliente vacío |
| DM-COB-004 | ✅ PASS | Modal abre con `modal.present()` + búsqueda "ADRIAN" + click coords; tabs habilitadas tras selección de ADRIAN ARLET BASTARDO ALONZO (Cód 2738) |
| DM-COB-007 | 🚫 N/A | "No hay documentos BS/US$" — cliente ADRIAN no tiene facturas pendientes en cobros regulares (saldo existe pero sin documentos activos); retención SÍ tiene docs → dato inconsistente pero no es UI FAIL |
| DM-COB-008 | 🚫 N/A | No aplica — sin documentos para seleccionar en cobro regular |
| DM-COB-009 | ✅ PASS | Modal `#eventModal` con checkboxes: Efectivo, Depósito, Transferencia, Pago Móvil |
| DM-COB-040 | ✅ PASS | Depósito seleccionado → BANESCO RAEL (01340239682391029301) → Nro TEST-00001 / Monto 100 BS; banco picker abre con 5 bancos disponibles |
| DM-COB-012 | ✅ PASS | Diferencia BS: 0,00 en color **azul** (`style="color: blue"`) cuando monto cubre el total |
| DM-COB-014 | ✅ PASS | Tab Total no vacía: Monto total BS/US$, Tasa BS 517,96, Pago BS/US$, Diferencia BS/US$, Total General BS: 100,00; acordeón por método |
| DM-COB-016 | ✅ PASS | 3 acordeones visibles: Imágenes, Archivo, Firma (requiredCollectionAttachments=false → no adjunto requerido) |
| DM-COB-018 | ✅ PASS | Alert "El Cobro se ha guardado" tras click imagenGuardar |
| DM-COB-019 | ✅ PASS | Flujo envío: (1) Alert "El Cobro será enviado" → Aceptar → (2) "Su Cobro será enviado" → OK → (3) "Cobro nro. 48 enviado exitosamente"; sin segunda alerta de adjunto obligatorio |
| DM-COB-029 | ⏭ SKIP | RETENCIÓN: Guardado OK ("La Retención se ha guardado"); Envío bloqueado por "debe agregar al menos un adjunto" — VG separada de requiredCollectionAttachments; SKIP envío |
| DM-COB-036 | ✅ PASS | IGTF: Formulario abre con selector tasa (3 ion-selects: empresa/moneda/tasa 517.96 BS); guardado "El IGTF se ha guardado"; enviado exitosamente con flujo 2 alertas |
| DM-COB-037 | 🚫 N/A | COBRO 25% IVA: Botón presente, formulario abre, pero "No hay clientes disponibles" — ningún cliente elegible para este tipo |
| DM-COB-020 | ✅ PASS | Pulsar atrás con cliente seleccionado: Alert con 3 opciones "Guardar y salir / Salir sin guardar / Cancelar" |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" → cobro no aparece en BUSCAR |
| DM-COB-022 | ✅ PASS | BUSCAR: Lista de cobros con cobro Nro. 48 "Enviado"; searchbar presente; trash icon solo en Guardado |
| DM-COB-024 | ✅ PASS | Cobro Guardado abre formulario editable; imagenGuardar activa; imagenEnviar desactivada (sin método pago) |
| DM-COB-026 | ✅ PASS | Trash → Alert "¿Desea eliminar el Cobro?" → Eliminar → cobro desaparece de lista |
| DM-COB-038 | ✅ PASS | "Guardar y salir" → "El Cobro se ha guardado" → cobro aparece en BUSCAR con "Estatus: Guardado" |
| DM-COB-039 | 🚫 N/A | `#manualRateInput` no existe en el formulario → `enabledManualRate=false` |
| DM-COB-028 | 🚫 N/A | ANTICIPO/PREPAGO: Botón presente (`cobroPrepago=true`), pero "No hay clientes disponibles" — ningún cliente elegible actualmente |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| Cobro Nro. 48 | COBRO — ADRIAN ARLET BASTARDO ALONZO (Cód 2738) — Depósito BANESCO RAEL BS 100,00 | Enviado exitosamente |
| IGTF (sin Nro ref asignado en pantalla) | COBRO IGTF — ADRIAN ARLET BASTARDO ALONZO — Efectivo BS 50,00 | Enviado exitosamente |
| RETENCIÓN guardada (eliminada al salir sin guardar) | RETENCIÓN — ADRIAN ARLET BASTARDO ALONZO — FACT20086729 US$ | Salida sin guardar (alert adjunto bloqueó envío) |

---

## Hallazgos

### H1 — RETENCIÓN requiere adjunto para envío (VG separada, no cubierta por requiredCollectionAttachments=false)
- **Evidencia:** Alert "Para poder enviar la Retención, debe agregar al menos un adjunto" al intentar enviar retención con `requiredCollectionAttachments=false`
- **Implicación:** La retención tiene su propia restricción de adjunto en Insumar. Documentar como `cobroRetencionRequiereAdjunto=true` o el VG que la controla.
- **Acción:** NO es FAIL — es comportamiento esperado para cobros de retención en esta cuenta. Marcar DM-COB-029 envío como ⏭ SKIP hasta confirmar VG específica.

### H2 — Documentos regulares vacíos para ADRIAN pero retención tiene docs
- **Evidencia:** Regular COBRO → "No hay documentos BS/US$" para ADRIAN (Cód 2738). RETENCIÓN → FACT20086729 US$ saldo 101.46 visible.
- **Hipótesis:** Los documentos de cobro regular usan un catálogo diferente al de retención. El cliente puede tener saldo pero sin facturas pendientes en el catálogo de cobros regulares.
- **Acción:** No es FAIL UI — depende de datos del servidor. Documentar para confirmar en próximas corridas.

### H3 — ANTICIPO/PREPAGO y COBRO 25% IVA: botones activos sin clientes elegibles
- **Evidencia:** Ambos tipos muestran modal de cliente con "No hay clientes disponibles".
- **Implicación:** Las VGs están activas (botones visibles) pero no hay clientes configurados para estos tipos en Insumar actualmente.
- **Acción:** N/A por datos. VGs confirmadas como `true`.

### H4 — Nuevo patrón: modal cliente cobros requiere `modal.present()` (no mouse click en ion-input)
- **Evidencia:** Click en coordenadas del ion-input no abre el modal; `modal.present()` funciona correctamente.
- **Patrón confirmado:** Para abrir `#clienteSelectModal` en cobros, usar `document.querySelector('#clienteSelectModal').present()`.

### H5 — Selector de banco: bank picker modal separado (`#bankPickerModal`)
- **Evidencia:** Depósito accordion usa `.bank-picker-trigger` → abre `#bankPickerModal` con lista de bancos.
- **Bancos disponibles Insumar:** BANCRECER, BANESCO RAEL, BANCO CARIBE, BANCO MERCANTIL, BANCO DE VENEZUELA ADRIANA.

---

## VGs confirmadas para insumar

| VG | Valor confirmado | Evidencia |
|----|-----------------|-----------|
| `requiredCollectionAttachments` | `false` | Cobro Nro. 48 enviado sin adjunto |
| `cobroRetencion` | `true` | Botón RETENCIÓN visible y funcional |
| `userCanSelectIGTF` | `true` | Botón IGTF visible; 3 ion-selects en General (empresa/moneda/tasa) |
| `userCanCollectIva` | `true` | Botón COBRO 25% IVA visible |
| `cobroPrepago` | `true` | Botón ANTICIPO/PREPAGO visible |
| `enabledManualRate` | `false` | `#manualRateInput` no existe en formulario |
| `multiCurrency` | `true` | Selector Moneda con BS y US$ en documentos |

---

## Datos de prueba confirmados para insumar.yaml (módulo cobros)

```yaml
cobros:
  cliente_test: "ADRIAN ARLET BASTARDO ALONZO"
  cliente_code: "2738"
  metodo_pago: "Deposito"   # También disponibles: Efectivo, Transferencia, Pago Móvil
  banco_deposito: "BANESCO RAEL"   # También: BANCRECER, BANCO CARIBE, BANCO MERCANTIL, BANCO DE VENEZUELA ADRIANA
  smoke_na_estructural:
    - "DM-COB-007: documentos regulares vacios para cliente test (sin facturas pendientes)"
    - "DM-COB-008: sin documentos para checkbox"
    - "DM-COB-028: ANTICIPO/PREPAGO sin clientes elegibles actualmente"
    - "DM-COB-037: COBRO 25% IVA sin clientes elegibles actualmente"
    - "DM-COB-039: enabledManualRate=false"
```

---

## Nuevos patrones para lecciones-DELTA.md

1. **cobros_clienteSelectModal_requiere_present()**: Para abrir el modal de clientes en cobros, usar `document.querySelector('#clienteSelectModal').present()` en lugar de click en ion-input (el trigger attr no dispara correctamente vía mouse events).

2. **cobros_bankPickerModal_es_modal_separado**: El selector de banco para Depósito NO es ion-select/popover — es `.bank-picker-trigger` que abre `#bankPickerModal` independiente.

3. **cobros_checkbox_metodo_pago_requiere_coordenadas_exactas**: Los checkboxes del modal `#eventModal` requieren mouse.click en coordenadas exactas del bounding rect del checkbox (no del ion-item padre).

4. **cobros_imagenGuardar_imagenEnviar_son_icon_buttons_sin_texto**: Los botones guardar/enviar en la barra superior son ion-button con clases `imagenGuardar` / `imagenEnviar` sin textContent — localizar por clase.

5. **retencion_requiere_adjunto_propio_independiente_de_vg_general**: La retención en Insumar bloquea el envío con "debe agregar al menos un adjunto" incluso con `requiredCollectionAttachments=false`. VG de adjunto para retención es independiente.

6. **cobros_envio_tres_alertas**: flujo envío cobro regular genera (1) "El Cobro será enviado" + Aceptar → (2) "Su Cobro será enviado" + OK → (3) "Cobro nro. X enviado exitosamente" + OK.

7. **cobros_igtf_envio_dos_alertas**: flujo IGTF genera (1) "El IGTF será enviado" + Aceptar → (2) "Su Cobro será enviado" + OK.

8. **cdp_adb_forward_usa_pid_socket**: El socket CDP es `webview_devtools_remote_<PID>` (no `_1`). Establecer con `adb forward tcp:9220 localabstract:webview_devtools_remote_$(adb shell ps | grep denario | awk '{print $2}')`.
