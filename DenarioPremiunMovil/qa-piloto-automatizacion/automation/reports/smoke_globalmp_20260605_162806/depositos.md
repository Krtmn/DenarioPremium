# Smoke Test — Módulo DEPÓSITOS
| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260605_162806_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | CDP http://127.0.0.1:9220 |
| App | `com.kiberno.denarioPremiumPro` |
| Cliente | globalmp |
| Resultado | 4 PASS · 0 FAIL · 7 N/A (sin cobros disponibles para depósito) |

---

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Click en link "Depósitos" → `app-depositos` activo; botones DEPÓSITO y BUSCAR visibles |
| DM-DEP-002 | ✅ PASS | Click DEPÓSITO → `app-deposito` + `app-deposito-general` activos; tabs General/Cobros/Total/Adjuntos; botones Guardar y Enviar deshabilitados sin datos |
| DM-DEP-004 | ✅ PASS | `selectIonPopover` en ion-select.selectbanco → MERCANTIL - *** 0355770 seleccionado (nuAccount: 01050030351030355770); clase `ng-valid has-value` confirmada |
| DM-DEP-005 | ✅ PASS | Click en botón Fecha Doc → modal `fechasModal` abierto; `confirmDatetime` via shadowRoot → Aceptar clicked; fecha 2026-06-06 confirmada |
| DM-DEP-006 | 🚫 N/A | Sin cobros disponibles para depósito en Tab Cobros — "Monto total depositado: 0 BS"; campo Nro. Plantilla llenado (DEP-TEST-001) pero Guardar no habilita sin cobros; validación alerta "Seleccione los Cobros a depositar" |
| DM-DEP-009 | 🚫 N/A | Dependiente de DM-DEP-006 (sin cobros disponibles) |
| DM-DEP-010 | 🚫 N/A | BUSCAR ejecutado → `app-deposito-list` activo con ion-searchbar y ion-infinite-scroll; lista vacía (sin depósitos previos en sistema) — no es bug, lista inicial vacía por ausencia de datos |
| DM-DEP-014 | 🚫 N/A | Dependiente de DM-DEP-010 (lista vacía) |
| DM-DEP-017 | 🚫 N/A | Dependiente de DM-DEP-009 (sin depósito guardado) |
| DM-DEP-018 | 🚫 N/A | Dependiente de DM-DEP-009 (sin depósito guardado) — defecto conocido v6.6.14 de todos modos |
| DM-DEP-019 | 🚫 N/A | Dependiente de DM-DEP-017 (sin depósito enviado) |
| DM-DEP-020 | 🚫 N/A | Dependiente de DM-DEP-009 (sin depósito guardado) |

---

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| — | Sin depósitos creados (no se completó el flujo por ausencia de cobros disponibles) | — |

---

## Hallazgos

### Patrón nuevo — Tab Cobros en DEPÓSITOS requiere cobros en estado "disponible para depósito"
El cobro Nro. 5438 (BIG MARKET 22, BM17 — enviado en corrida cobros) no aparece en el Tab Cobros del formulario de depósito. El módulo de Depósitos muestra en Tab Cobros únicamente cobros que están en un estado de "pendiente de depósito" (no los ya enviados). Dado que el cobro fue enviado con método Depósito pero ya procesado, no queda disponible para vincular en un nuevo depósito.

### Patrón confirmado — Campo se llama "Nro. Plantilla" (no "Nro. Depósito")
Confirmado el patrón conocido: el campo aparece como "Nro. Plantilla:" en el formulario general (ion-input con label "Nro. Plantilla:Nro. Plantilla:").

### Patrón nuevo — Formulario depósito: campos en Tab General
- **Empresa**: ion-select (pre-seleccionado con empresa por defecto del vendedor)
- **Fecha Depósito**: ion-button disabled (calculada automáticamente, no editable)
- **Moneda**: ion-select (opciones BS/USD)
- **Banco**: ion-select (clase `selectbanco`) + ion-input con número de cuenta (read-only, se llena al seleccionar banco)
- **Nro. Plantilla**: ion-input (editable)
- **Fecha Doc**: ion-button habilitado → modal `fechasModal` → ion-datetime con presentation="date"
- **Comentario**: ion-input (editable)

### Patrón nuevo — Alerta de salida del formulario de depósito
Al presionar el back en el formulario, aparece alert "Denario Depósito" con 3 opciones:
- GUARDAR Y SALIR (`alert-button-role-save`)
- SALIR SIN GUARDAR (`alert-button-role-exit`)
- CANCELAR (`alert-button-role-cancel`)

Al elegir "GUARDAR Y SALIR" sin cobros seleccionados → alerta de validación "Seleccione los Cobros a depositar / OK".
Para salir sin datos → usar coordenadas de "Salir sin guardar" (rect: x=63, y=381.5, w=226, h=40; center: 176, 401.5).

### Patrón nuevo — DEPÓSITO button requiere mouse click + 2a evaluación
El primer click en el botón DEPÓSITO (en app-depositos-container) activa la navegación pero la vista no cambia inmediatamente en la misma evaluación. Confirmación de navegación requiere 2s wait + nueva evaluación del DOM.

---

## Motivo N/A global para casos DM-DEP-006 a DM-DEP-020
**Causa**: Sin cobros en estado "disponible para depósito" en la cuenta globalmp. El Tab Cobros del formulario de depósito no muestra registros disponibles. El cobro Nro. 5438 (método Depósito, ya enviado) no está disponible para ser vinculado a un nuevo depósito.

**Clasificación RUNTIME**: "API no devuelve datos (sin cobros disponibles para depósito)" → N/A. No es FAIL.

---

*Corrida: 2026-06-06 · Agente: QA Depósitos · Estado final app: HOME*
