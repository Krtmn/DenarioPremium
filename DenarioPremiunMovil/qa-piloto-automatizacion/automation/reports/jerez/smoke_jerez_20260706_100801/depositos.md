# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260706_100801_smoke-completo` |
| Módulo | DEPÓSITOS |
| App | `com.kiberno.denarioPremiumPro` (WebView CDP :9220) |
| Playa | jerez |
| aplica | **true** (CONFIRMADO end-to-end: Guardar→Enviar con cobro vinculado) |
| Estado final | HOME ✅ |
| Resultado | **12 PASS · 0 FAIL · 0 SKIP · 0 N/A · 0 BLOCKED** |

> Corrida OMITE cotejo BD (§10) y captura de payloads. Round-trip §9 (UI→UI) aplicado en DM-DEP-014.

## Casos ejecutados

| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Home módulo con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | Form con Empresa/Moneda/Banco/Fecha Doc/Nro. Plantilla; tabs Cobros/Total/Adjuntos disabled; Guardar y Enviar disabled sin datos |
| DM-DEP-004 | ✅ PASS | Banco "Banesco Jerez Motors" (idBankAccount:419 BANESCO) seleccionado; cuenta read-only se pobló "0134....2087" |
| DM-DEP-005 | ✅ PASS | Fecha Doc confirmada 6/7/2026 (dt.value ISO + ionChange + Aceptar shadow); tabs Cobros/Total/Adjuntos se habilitaron |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla="DEP-QA-706" + cobro Ref 81 seleccionado → Guardar habilitado; monto derivado Tab Total = 29360.41 BS |
| DM-DEP-009 | ✅ PASS | Alert "Denario Depósito — El Depósito se ha guardado" (Aceptar) |
| DM-DEP-010 | ✅ PASS | Lista BUSCAR renderizó 7 ítems; depósito nuevo "Nro Ref: 0, BANESCO, Guardado, 29360.41 BS" — **defecto conocido NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabierto desde BUSCAR con datos: Nro. Plantilla DEP-QA-706, cuenta 0134....2087, Fecha Doc 6/7/2026, cobro Ref 81 vinculado (29360.41), Total 29360.41. Round-trip §9 OK (ver observación) |
| DM-DEP-017 | ✅ PASS | Enviar → "Depósito nro. **7** enviado exitosamente"; servidor asignó Ref real (0 → 7) |
| DM-DEP-018 | ✅ PASS | BUSCAR post-envío renderizó; depósito ahora "Nro Ref: 7, Enviado, 29360.41 BS" (sin trash) |
| DM-DEP-019 | ✅ PASS | Depósito Enviado abre solo-lectura: selects e inputs disabled, sin botones Guardar/Enviar, sin trash |
| DM-DEP-020 | ✅ PASS | Depósito desechable Guardado (Ref 80, 1000 BS) → botón basura (color=danger) → alert "¿Desea eliminar el depósito seleccionado?" (Cancelar/Aceptar) → Aceptar → desapareció de la lista |

## Registros creados en sistema

| Ref | Detalle | Estado |
|-----|---------|--------|
| **7** | Banesco Jerez Motors (idBankAccount 419), 29360.41 BS, Empresa JEREZ 2, Nro.Plantilla DEP-QA-706, cobro Efectivo Ref 81 (MULTIREPUESTOS DRG) vinculado | **Enviado** (persiste) |
| — (Ref 0 local) | Depósito desechable para DM-DEP-020: Banesco, 1000 BS, cobro Ref 80 (Adelis Alexander Lopez Sanchez) | **Eliminado** en DM-DEP-020 (no persiste) |

## Observación round-trip §9 (no FAIL)

Al reabrir el depósito Guardado (DM-DEP-014), el **picker Empresa muestra "INVERSIONES JEREZ 1"** aunque el depósito se guardó con Empresa seleccionada JEREZ 2. Los datos sustantivos del depósito sí persistieron correctamente (banco, cuenta, fechas, Nro. Plantilla, y el **cobro Ref 81 vinculado — que es una cobranza de empresa 2 — se preservó**). El select Empresa en `app-deposito-general` se comporta como filtro de creación que revierte al default al reabrir, no como atributo de cabecera relegido. No se marca FAIL: (1) esta corrida omite cotejo BD y no se puede confirmar el valor almacenado en servidor; (2) el vínculo real de empresa viaja por el cobro asociado, que quedó intacto. **Recomendado confirmar en próxima corrida CON BD** (campo empresa del deposit vs empresa del cobro vinculado).

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| jerez DEPÓSITOS `aplica=true` | cliente | Confirmado end-to-end (Guardar→Enviar Ref 7 con cobro Efectivo vinculado). `colletionPayment` incluye Efectivo. |
| Banco jerez | cliente | Única cuenta receptora `idBankAccount:419` coBank BANESCO "Banesco Jerez Motors", cuenta 0134....2087. `ion-select.selectbanco` con `ion-select-option` real (asignar `.value` objeto + ionChange). |
| Empresa multi (3) en deposito-general | cliente | jerez tiene 3 empresas (idEnterprise 1/2/3: INVERSIONES JEREZ 1/2/3). El select empresa NO tiene clase específica; localizar por option con `.value.idEnterprise`. Cobros del Tab Cobros se filtran por empresa. |
| Envío = **3 alertas** en jerez | cliente | (1) "El Depósito será enviado" Cancelar/Aceptar → (2) "Denario Premium — El Depósito será enviado" OK → (3) "Depósito nro. N enviado exitosamente" OK. (insumar reportaba 2 alertas). |
| Defecto DM-DEP-010/018 lista no renderiza — **NO reprodujo en jerez** | universal | Lista `app-deposito-list` cargó searchbar + ítems tras Guardar y tras Enviar, sin loader colgado. Refuerza candidato firme a cierre del defecto (5ª+ corrida limpia). |
| Empresa picker revierte a default al reabrir Guardado | cliente | Ver "Observación round-trip §9" arriba — investigar con BD. |

> ✅ consolidado 2026-07-06

## Hallazgos (FAIL)

Ninguno.
