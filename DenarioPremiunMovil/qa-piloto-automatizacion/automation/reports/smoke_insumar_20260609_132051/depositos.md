# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260609_132051_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente / Playa | insumar (INSUMAR DISTRIBUIDOR — Isla Coche) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| CDP | `http://127.0.0.1:9220` (connectOverCDP) |
| `modules.depositos.aplica` | `true` (confirmado en perfil + UI) |
| Banco de prueba | BANESCO RAEL (idBank 4, cuenta ***1029301) |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A** |

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Click módulo Depósitos → `/depositos` (`app-depositos`) con botones DEPÓSITO y BUSCAR visibles |
| DM-DEP-002 | ✅ PASS | DEPÓSITO → formulario con tabs General/Cobros/Total/Adjuntos; campos Empresa, Fecha Depósito (calculada), Moneda, Banco, Nro. Plantilla, Fecha Doc, Comentario; Guardar y Enviar deshabilitados sin datos |
| DM-DEP-004 | ✅ PASS | `ion-select.selectbanco` → asignación de objeto-value → Banco "BANESCO RAEL" reflejado en el campo (5 bancos disponibles) |
| DM-DEP-005 | ✅ PASS | Botón Fecha Doc (`.letrasFechasButton`) → modal datetime → value=hoy + Aceptar (shadowRoot) → "9/6/2026" confirmado |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla `fillIonInput` ("QA2848623") + cobro marcado en Tab Cobros → botón Guardar se habilita |
| DM-DEP-009 | ✅ PASS | Click Guardar → alert "Denario Depósito — El Depósito se ha guardado" |
| DM-DEP-010 | ✅ PASS | BUSCAR → lista renderiza el depósito Guardado (Nro Ref 0, Banco 04, Estatus Guardado, Monto BS 2000.00). **Defecto v6.6.14 NO reproducido** (ver Hallazgos) |
| DM-DEP-014 | ✅ PASS | Click en depósito Guardado → formulario con datos previos intactos (banco, Nro. Plantilla, fechas); editable, no solo lectura |
| DM-DEP-017 | ✅ PASS | Enviar → "El Depósito será enviado" → Aceptar → "Depósito nro. 12 enviado exitosamente"; pasa a Enviado |
| DM-DEP-018 | ✅ PASS | BUSCAR tras guardar/enviar renderiza la lista (12 ítems); el depósito aparece como Nro Ref 12 Enviado. **Defecto v6.6.14 NO reproducido** |
| DM-DEP-019 | ✅ PASS | Click en depósito Enviado (Nro Ref 12) → solo lectura: Guardar/Enviar no visibles, sin botón eliminar (trash=0) |
| DM-DEP-020 | ✅ PASS | Trash en depósito Guardado → alert "¿Desea eliminar el depósito seleccionado?" CANCELAR/ACEPTAR → confirmar → desaparece (13→12 ítems) |

## Registros creados en sistema

| Ref | Nro. Plantilla | Banco | Monto | Estado final | Detalle |
|-----|----------------|-------|-------|--------------|---------|
| 12 | QA2848623 | BANESCO RAEL (04) | 2000.00 BS | **Enviado** | Depósito enviado al servidor (recibió Nro. Ref 12). Cobro vinculado: ref 50 (ALEJANDRO JOSE RAMIREZ GUARTAJ, 2026-06-04) |
| 0 (local) | QA3128907 | BANESCO RAEL (04) | 5000.00 BS | **Eliminado** | Creado en estado Guardado para DM-DEP-020; eliminado vía botón basura con confirmación. No persiste |

## Hallazgos

> No hay FAIL. Se documentan dos observaciones relevantes:

1. **Defecto conocido DM-DEP-010/018 (v6.6.14 `deposit.service.ts`) NO se reprodujo en esta corrida.**
   La lista BUSCAR renderizó correctamente tras guardar y tras enviar (12–13 ítems visibles, incluyendo el depósito recién creado en estado Guardado). En corridas previas (romher / insumar 20260603) la lista no renderizaba tras guardar. En esta sesión (insumar 20260609) el render fue consistente en los 3 accesos a BUSCAR. Candidato a verificar si el bug fue corregido o si es intermitente — recomendado revisar en próxima corrida antes de marcar como resuelto en RUNTIME §5.

2. **Flujo completo de Depósitos validado end-to-end** (cubre gap G3 de `module-selectors.md`): por primera vez en las corridas registradas se completó Guardar→Enviar con cobro vinculado (insumar tenía 17 cobros pendientes de depósito disponibles en Tab Cobros). Se confirma: monto derivado de cobros (sin campo libre), envío en 2 alertas ("El Depósito será enviado" → "Depósito nro. X enviado exitosamente"), borrado CON confirmación previa ("¿Desea eliminar el depósito seleccionado?").

## Notas técnicas (para consolidar en module-selectors)

- **Banco:** `ion-select.selectbanco` con `value` = **objeto** `{idBankAccount, naBank, ...}`, no string. Asignar el objeto del `ion-select-option` + `ionChange` (igual patrón que actividades en Visitas). Al elegir banco, la Cuenta (ion-input read-only idx 0) se autocompleta con `nuAccount`.
- **Fecha Doc:** confirmar con `dt.value = 'YYYY-MM-DD'` + `ionChange` ANTES del Aceptar del shadowRoot. Solo pulsar Aceptar dejó el botón con texto vacío (label sin valor) — el set explícito del value lo resolvió.
- **Tab Cobros:** 17 cobros pendientes de depósito; checkbox vía `pg.mouse.click` en coords exactas. 1er checkbox marca el cobro (no es "seleccionar todos"). Guardar habilita en cuanto hay ≥1 cobro marcado + banco + Nro. Plantilla + fecha.
- **Enviar:** botón `ion-button.imagenEnviar` respondió a Pointer(down/up)+Mouse click. Flujo: alert confirm "El Depósito será enviado" (Cancelar/Aceptar) → "Depósito nro. X enviado exitosamente".
- **Estados:** trash (`ion-button[color="danger"]`) presente solo en ítems Guardado de la lista; ausente en Enviado. Depósito Enviado abre en solo lectura (sin imagenGuardar/imagenEnviar, sin trash).
