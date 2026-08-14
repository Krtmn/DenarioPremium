# Smoke Test — Módulo COBROS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | COBROS |
| Dispositivo | CDP 127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | globalmp |
| Fecha ejecución | 2026-06-06 |
| Resultado | **19 PASS · 0 FAIL · 3 SKIP · 8 N/A** |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-COB-001 | ✅ PASS | Botones COBRO, RETENCIÓN, BUSCAR visibles. Sin IGTF, 25%IVA, ANTICIPO → VGs `userCanSelectIGTF=false`, `userCanCollectIva=false`, `cobroPrepago=false` |
| DM-COB-002 | ✅ PASS | 5 tabs visibles: General (enabled), Documentos/Pagos/Total/Adjuntos (disabled). Empresa auto-seleccionada (COMERCIALIZADORA DE, idEnterprise:2). Campo Cliente vacío |
| DM-COB-004 | ✅ PASS | Tras seleccionar BIG MARKET 22 (via `#clienteSelectModal.present()` + MouseEvent click en ion-item) + llenar Comentario → las 4 tabs restantes se habilitaron |
| DM-COB-006 | ✅ PASS | `requiredComment=true` confirmado: clase `ng-invalid ion-invalid ion-touched` + "¡Campo Obligatorio!" visible en Comentario vacío. Tabs permanecen deshabilitadas hasta llenar |
| DM-COB-007 | ✅ PASS | Tab Documentos: 4 facturas (FF078757-FF078760, tipo A, USD, vigentes 9 días, tasa 549,37). Leyenda Vigente/Vencido/A favor visible |
| DM-COB-008 | ✅ PASS | Checkbox FF078757 marcado → Pagos muestra "Monto total a pagar BS: 797.872,03" |
| DM-COB-015 | ✅ PASS | Tab Total: "Total General BS: 797.872,03" visible. Columnas Retención IVA / Retención ISLR presentes → `retencion=true` |
| DM-COB-033 | 🚫 N/A | `multiCurrency=false` — sin selector de moneda cobro activo |
| DM-COB-034 | 🚫 N/A | `multiCurrency=false` |
| DM-COB-041 | 🚫 N/A | Sin documentos vencidos (rojo) para BIG MARKET 22 en esta sesión. Todos los documentos son vigentes (9 días). `retencion=true` inferido de columnas en Tab Total |
| DM-COB-042 | 🚫 N/A | Depende de DM-COB-041 |
| DM-COB-009 | ✅ PASS | Modal `#eventModal`: métodos Depósito y Transferencia disponibles |
| DM-COB-040 | ✅ PASS | Depósito: banco MERCANTIL seleccionado, Nro. 00112345678, Monto 797.872,03 BS (tipear "79787203" → campo centavos acumulativo). Diferencia BS: 0,00 en azul |
| DM-COB-012 | ✅ PASS | Diferencia roja (rgb(255,0,0)) con monto < total (−797.872,03 rojo) |
| DM-COB-043 | ✅ PASS | Color diferencia correcto: rojo cuando insuficiente, azul (0,00) cuando cubre exactamente |
| DM-COB-014 | ✅ PASS | Tab Total post-pago: Pago BS 797.872,03, Diferencia 0,00. "Total Depósitos: BS 797872.03 / USD 1.452,34". "Total General BS: 797.872,03" |
| DM-COB-016 | ✅ PASS | Tab Adjuntos: acordeones Imágenes, Archivo, Firma — todos visibles |
| DM-COB-018 | ✅ PASS | Alert "El Cobro se ha guardado" al presionar imagenGuardar |
| DM-COB-019 | ✅ PASS | Sin alerta de adjunto: "El Cobro será enviado" → ACEPTAR → "Su Cobro será enviado" → OK → "Cobro nro. 5438 enviado exitosamente". `requiredCollectionAttachments=false` para cobros normales |
| DM-COB-022 | ✅ PASS | Lista BUSCAR: cobros con Estatus Guardado/Enviado/APROBADO. Cobro 5438 hallado (Estatus: Enviado). Botones basura (danger) solo en Guardado. Searchbar funcional |
| DM-COB-024 | ✅ PASS | Cobro Guardado reabre en formulario editable; cliente BIG MARKET 22 pre-cargado; tabs habilitadas; imagenGuardar e imagenEnviar activos |
| DM-COB-026 | ✅ PASS | Alert "¿Desea eliminar el Cobro?" → ELIMINAR → cobro desaparece de lista |
| DM-COB-020 | ⏭ SKIP | CDP: `img.fechaAtras` no activa el guard Angular (dirty-check). Modal 3 opciones no aparece. Requiere hardware back button o swipe — no simulable con Playwright CDP |
| DM-COB-021 | ✅ PASS | Cobro nuevo sin guardar, al presionar atrás via CDP → NO aparece en BUSCAR. Cobro correctamente descartado |
| DM-COB-038 | ⏭ SKIP | Depende de DM-COB-020 — hardware back no simulable via CDP |
| DM-COB-029 | ✅ PASS (Guardado) ⏭ SKIP (Envío) | RETENCIÓN: 4 tabs (General/Documentos/Total/Adjuntos, sin Pagos). BIG MARKET 22, FF078757 seleccionado, Comentario llenado. Guardado OK ("La Retención se ha guardado"). Envío → alerta "debe agregar al menos un adjunto" → SKIP. `requiredCollectionAttachments=true` para Retención |
| DM-COB-028 | 🚫 N/A | `cobroPrepago=false` — botón ANTICIPO/PREPAGO ausente |
| DM-COB-036 | 🚫 N/A | `userCanSelectIGTF=false` — botón IGTF ausente |
| DM-COB-037 | 🚫 N/A | `userCanCollectIva=false` — botón 25%IVA ausente |
| DM-COB-039 | 🚫 N/A | `enabledManualRate=false` — "Tasa BS:" es read-only display, `#manualRateInput` no existe en DOM |

---

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **Cobro nro. 5438** | BIG MARKET 22 (BM17) · FF078757 · Depósito MERCANTIL · BS 797.872,03 / USD 1.452,34 · Comentario: Test-COB-QA-GlobalMP | Enviado |
| **Retención (sin nro.)** | BIG MARKET 22 (BM17) · FF078757 · Comentario: Test-COB-029-Retencion-QA | Guardado — Pendiente envío manual por QA (requiere adjunto) |

---

## VGs descubiertas en esta corrida

| VG | Valor confirmado | Señal observada |
|----|-----------------|-----------------|
| `requiredComment` | **true** | "¡Campo Obligatorio!" + `ng-invalid ion-invalid ion-touched` en Comentario vacío; tabs bloqueadas |
| `requiredCollectionAttachments` | **false** (cobro normal) · **true** (Retención) | Cobro normal enviado sin adjunto; Retención → alerta "debe agregar al menos un adjunto" |
| `cobroRetencion` | **true** | Botón RETENCIÓN visible en HOME Cobros; formulario sin tab Pagos |
| `retencion` | **true** | Columnas "Retención IVA" y "Retención ISLR" en Tab Total |
| `sizeRetention` | **TBD** | No confirmado — sin documentos vencidos elegibles en BIG MARKET 22 |
| `userCanSelectIGTF` | **false** | Botón IGTF ausente en HOME Cobros |
| `userCanCollectIva` | **false** | Botón 25%IVA ausente en HOME Cobros |
| `cobroPrepago` | **false** | Botón ANTICIPO/PREPAGO ausente en HOME Cobros |
| `enabledManualRate` | **false** | `#manualRateInput` no existe; "Tasa BS:" es display read-only |
| `enterpriseEnabled` | **true** | Empresa COMERCIALIZADORA DE (idEnterprise:2) auto-seleccionada |
| `multiCurrency` | **false** | Confirmado desde corrida pedidos; sin selector de moneda alterna |

---

## Datos de prueba confirmados (cobros)

| Campo | Valor |
|-------|-------|
| `modules.cobros.cliente_test` | `BIG MARKET 22, C.A` |
| `modules.cobros.cliente_code` | `BM17` |
| `modules.cobros.metodo_pago` | `Depósito` (también disponible: `Transferencia`) |
| `modules.cobros.banco_deposito` | `MERCANTIL - 01050030351030355770` |
| `modules.cobros.moneda_cobro` | `USD` |
| Tasa USD vigente | `549,37 BS` (Fecha Tasa: 29/5/2026) |
| Métodos disponibles | Depósito, Transferencia (sin Efectivo) |
| `smoke_na_estructural` | `[DM-COB-033, DM-COB-034, DM-COB-028, DM-COB-036, DM-COB-037, DM-COB-039, DM-COB-041, DM-COB-042]` |

---

## Patrones nuevos CDP — globalmp cobros

| # | Patrón | Descripción |
|---|--------|-------------|
| P1 | `ion-button_home_cobros_requiere_pointer+mouse` | Botones COBRO/RETENCIÓN/BUSCAR en home requieren `PointerEvent(pointerdown/up) + MouseEvent(click)` combinados. Solo `TouchEvent` funciona para el primer click post-carga; `PointerEvent+MouseEvent` es más consistente |
| P2 | `clienteSelectModal_usar_present()` | El modal de cliente no se activa con click/touch en `#clienteSelect`. Usar `document.querySelector('#clienteSelectModal').present()` directamente |
| P3 | `monto_deposito_campo_centavos` | Campo Monto (depósito) usa formato centavos acumulativo. Para BS 797.872,03 → Backspace×20 para limpiar + `pg.keyboard.type('79787203')` + Tab. No usar native value setter (formatea mal) |
| P4 | `imagenGuardar_mouse_click_directo` | `pg.mouse.click(267, 32)` sobre imagenGuardar funciona sin PointerEvent adicional |
| P5 | `imagenEnviar_requiere_pointer+mouse` | `imagenEnviar` requiere `PointerEvent(pointerdown/up) + MouseEvent(click)` — solo `pg.mouse.click()` a veces no activa el handler Angular |
| P6 | `back_button_no_activa_dirty_guard` | `img.fechaAtras` click via CDP NO activa el guard de cambios sin guardar de Angular. Hardware back button / swipe requerido físicamente. DM-COB-020/038 SKIP estructural |
| P7 | `requiredCollectionAttachments_dual_mode` | VG diferenciada por tipo: `false` para cobros normales, `true` para Retención. Verificar si el YAML debe tener campo separado `requiredRetentionAttachments` |
| P8 | `buscar_lista_patron_pointer+mouse+click` | `BUSCAR` también requiere `PointerEvent+MouseEvent` para abrir la lista de cobros |

---

## Estado final

App en **HOME** (`/home`). Corrida completada sin bloqueos críticos.

*Generado: 2026-06-06 · Agente QA CDP · RUN_ID 20260605_162806_smoke-completo*
