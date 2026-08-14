# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260604_122859_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | 14678405BR003855 |
| App | `com.kiberno.denarioPremiumPro` — romher (El Yaque) |
| Playa | El Yaque — `denarioelyaque.ddns.net:8081` |
| Resultado | **14 PASS · 0 FAIL · 1 SKIP · 3 N/A** |
| Fecha | 2026-06-04 |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Botones visibles: COBRO, ANTICIPO/PREPAGO, RETENCIÓN, BUSCAR. Sin IGTF ni 25% IVA. |
| DM-COB-002 | ✅ PASS | 5 tabs General/Documentos/Pagos/Total/Adjuntos; solo General habilitado sin cliente |
| DM-COB-004 | ✅ PASS | Selección SIDON + Comentario: "Cobro QA smoke romher" → 4 tabs habilitadas |
| DM-COB-007 | ✅ PASS | Tab Documentos: leyenda Vigente/Vencido/A favor + FA-0201375108 (USD) con checkbox |
| DM-COB-008 | ✅ PASS | Checkbox checked → "Monto total a pagar VED: 72.385,49" actualizado en Pagos |
| DM-COB-009 | ✅ PASS | `#eventModal` abierto con métodos: Depósito / Transferencia / Otros |
| DM-COB-040 | ✅ PASS | Depósito: Banco Provincial - 0948780100071619, monto 72.385,49 → Diferencia VED: 0,00 en azul |
| DM-COB-012 | ✅ PASS | Diferencia rojo cuando insuficiente (-72.385,49), azul cuando cubre (0,00) |
| DM-COB-014 | ✅ PASS | Tab Total: tabla FA-0201375108, acordeón "Total Depósitos" con monto, Total General VED: 72.385,49 |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: 3 acordeones visibles — Imágenes / Archivo / Firma |
| DM-COB-018 | ✅ PASS | Alert "El Cobro se ha guardado" — Aceptar |
| DM-COB-019 | ✅ PASS | Flujo 3 alertas: "El Cobro será enviado" → "Su Cobro será enviado" → "Cobro nro. 15734 enviado exitosamente". `requiredCollectionAttachments=false` confirmado |
| DM-COB-029 | ⏭ SKIP | Retención guardada OK (alert "La Retención se ha guardado"). Enviar BLOQUEADO: `imagenEnviar` disabled (opacity 0.5). Patrón `retencion_adjunto_propio` confirmado en romher |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` — botón IGTF no existe en UI |
| DM-COB-037 | 🚫 N/A | `userCanCollectIva=false` — botón COBRO 25% IVA no existe en UI |
| DM-COB-020 | ✅ PASS | Back con cobro dirty → `#alertSaveOrExit` visible: "Guardar y salir / Salir sin guardar / Cancelar" |
| DM-COB-021 | ✅ PASS | "Salir sin guardar" → cobro no aparece en lista (2 Guardado = retención + DM-COB-038; no hay 3ro) |
| DM-COB-022 | ✅ PASS | BUSCAR → `app-cobros-list` con cobros por cliente, searchbar, trash solo en Guardado |
| DM-COB-038 | ✅ PASS | Back → "Guardar y salir" → alert "El Cobro se ha guardado" → cobro aparece en BUSCAR Estatus: Guardado |
| DM-COB-024 | ✅ PASS | Click ion-item Guardado en cobros-list → formulario editable, Guardar habilitado, Enviar habilitado |
| DM-COB-026 | ✅ PASS | Trash en Guardado → alert "¿Desea eliminar el Cobro?" Cancelar/Eliminar → Eliminar → cobro desaparece |
| DM-COB-039 | 🚫 N/A | `enabledManualRate=false` — `#manualRateInput` no existe en UI |
| DM-COB-028 | ✅ PASS | Botón ANTICIPO/PREPAGO visible (`cobroPrepago=true`). No ejecutado flujo completo (VG descubierta) |

---

## Variables globales descubiertas en esta corrida

| VG | Valor | Evidencia |
|----|-------|-----------|
| `requiredCollectionAttachments` | **false** | Cobro nro. 15734 enviado sin adjunto, sin alerta de bloqueo |
| `cobroRetencion` | **true** | Botón RETENCIÓN visible y funcional |
| `userCanSelectIGTF` | **false** | Botón IGTF ausente en pantalla principal Cobros |
| `userCanCollectIva` | **false** | Botón COBRO 25% IVA ausente |
| `cobroPrepago` | **true** | Botón ANTICIPO/PREPAGO visible |
| `enabledManualRate` | **false** | `#manualRateInput` no encontrado en ningún formulario de cobro |
| `requiredComment` | **true** | Sin comentario → tabs Documentos/Pagos/Total/Adjuntos permanecen disabled |

---

## Patrones nuevos descubiertos (romher · cobros)

| # | Patrón | Descripción |
|---|--------|-------------|
| P-ROM-COB-001 | `cobros_clienteSelect_click_en_nombre_p_no_masInfo` | Seleccionar cliente en `#clienteSelectModal` (modo nuevo cobro): click en el `<p>` con el nombre (y≈top del item). Click en el centro del ion-item activa botón `masInfo` que navega a BUSCAR en lugar de seleccionar. |
| P-ROM-COB-002 | `cobros_buscar_usa_app_cobros_list` | BUSCAR → `#clienteSelectModal` en modo cobros muestra clientes → click abre `app-cobros-list` con todos los cobros del sistema. |
| P-ROM-COB-003 | `cobros_back_requiere_mouse_click_coords` | Mismo patrón que pedidos/visitas: `dispatchEvent(MouseEvent)` en `img.fechaAtras` NO dispara modal `#alertSaveOrExit`. Requiere `getBoundingClientRect() + pg.mouse.click()`. |
| P-ROM-COB-004 | `cobros_requiredComment_true_bloquea_tabs` | En romher `requiredComment=true`: sin Comentario los tabs Documentos/Pagos/Total/Adjuntos permanecen disabled. Llenar Comentario con `fillIonInput` desbloquea. |
| P-ROM-COB-005 | `cobros_retencion_enviar_disabled_sin_adjunto` | Retención: `imagenEnviar` queda `button-disabled` (opacity 0.5) hasta que se agrega un adjunto. Mock camera no logró inyectar foto — pendiente investigar en corrida futura. |
| P-ROM-COB-006 | `cobros_monto_deposito_requiere_ionBlur_manual` | Campo Monto en acordeón Depósito: `fillIonInput` no recalcula diferencia. Requiere además `inp.dispatchEvent(new FocusEvent('blur', {bubbles:true}))` y `ionBlur` CustomEvent. |
| P-ROM-COB-007 | `cobros_deposito_acorreon_expandido_automaticamente` | En romher el acordeón Depósito abre expandido tras seleccionar banco (no requiere click en header). |
| P-ROM-COB-008 | `cobros_envio_tres_alertas_confirmado_romher` | Igual que insumar: (1) "El Cobro será enviado" → (2) "Su Cobro será enviado" → (3) "Cobro nro. X enviado exitosamente". Patrón #15 en DELTA confirmado para romher. |
| P-ROM-COB-009 | `cobros_delete_con_confirmacion_romher` | Trash en `app-cobros-list` → alert "¿Desea eliminar el Cobro?" con Cancelar/Eliminar. |

---

## Registros creados en sistema

| Ref | Tipo | Cliente | Detalle | Estado |
|-----|------|---------|---------|--------|
| Cobro nro. 15734 | COBRO | SUPERMERCADO SIDON, C.A. (0001000111) | FA-0201375108, Banco Provincial, VED 72.385,49 | **Enviado** |
| Sin nro | RETENCIÓN | SUPERMERCADO SIDON, C.A. (0001000111) | FA-0201375108 | **Guardado — Pendiente envío manual** (adjunto requerido) |
| Sin nro (eliminado) | COBRO | SUPERMERCADO SIDON, C.A. (0001000111) | Solo Comentario "Test DM-COB-038 guardar y salir" | **Eliminado** en DM-COB-026 |

> **Nota retención:** El envío fue bloqueado porque `imagenEnviar` quedó disabled. Requiere agregar foto manualmente desde el dispositivo o investigar mockCameraAdjunto en build de producción romher.

---

## Hallazgos

### Sin FAILs en esta corrida.

### Observación crítica: DM-COB-029 retención mock camera

El helper `mockCameraAdjunto` no logró inyectar la foto en la retención de romher (fotoCount=0 en carrusel tras click en TOMAR FOTO con mock instalado). Posibles causas:
1. Build de producción AOT con Zone.js aislada — el mock de `Camera.getPhoto` no está en la zona de Angular cuando se llama `tomarImg()`.
2. La retención usa un `AdjuntoService` distinto al cobro regular.
3. El TOMAR FOTO button en retención puede tener un handler `(click)` diferente.

**Impacto:** DM-COB-029 SKIP en romher hasta investigar.

### Observación: CDP se reconectó mid-run

PID del WebView cambió (8853 → 14189) durante la sesión. Requirió `adb forward tcp:9220 localabstract:webview_devtools_remote_14189`. App reinició en HOME. No se perdió data (cobro 15734 ya fue enviado antes del reinicio).
