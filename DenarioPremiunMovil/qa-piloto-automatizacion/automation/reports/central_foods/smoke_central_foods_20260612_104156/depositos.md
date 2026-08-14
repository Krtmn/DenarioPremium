# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260612_104156_smoke-completo` |
| Módulo | DEPÓSITOS |
| Cliente | central_foods |
| App | `com.kiberno.denarioPremiumPro` |
| CDP | `:9220` |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A |

> `modules.depositos.aplica = true` → ejecutado normalmente.
> Datos: cliente cobros "ALEJANDRA LEDEZMA" · Nro. Plantilla=104156 · Banco BANESCO - *** 1040480 · Moneda BS.
> **Nota de datos resuelta:** el Tab Cobros **NO estaba vacío** — había 7 cobros enviados pendientes de depositar de sesiones previas (ALEJANDRA LEDEZMA, ALEXBERT RODRIGUEZ, MIGUEL MAYOR). Por eso NO aplicó el fallback N/A; los casos que dependen de seleccionar cobros se ejecutaron con datos reales.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Click módulo → `/depositos`, home con botones DEPÓSITO y BUSCAR |
| DM-DEP-002 | ✅ PASS | DEPÓSITO → form `app-deposito`; tabs Cobros/Total/Adjuntos disabled; Guardar/Enviar disabled. Campos: Empresa, Fecha Depósito, **Moneda**, Banco, Fecha Doc |
| DM-DEP-004 | ✅ PASS | Banco "BANESCO - *** 1040480" seleccionado (asignar `option.value` objeto + ionChange); Cuenta banco read-only auto-llena `01340026110261040480` |
| DM-DEP-005 | ✅ PASS | Fecha Doc datetime abre con **HOY** (2026-06-12, no el bug "mayo 2021" de insumar); valor asignado + Aceptar en shadowRoot → "12/6/2026", modal cierra |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla=104156 → 4 tabs habilitan; tras marcar 1 cobro en Tab Cobros, "Monto total depositado: 1000 BS" y Guardar habilita. **No hay campo Monto libre** — el monto = suma de cobros seleccionados |
| DM-DEP-009 | ✅ PASS | Guardar → alert "Denario Depósito" / "El Depósito se ha guardado" / Aceptar |
| DM-DEP-010 | ✅ PASS | BUSCAR tras guardar renderiza la lista; depósito aparece "Nro Ref: 0 · BANES · Guardado · 1000.0000 BS". **Defecto v6.6.14 NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabrir Guardado → form con datos previos: Banco ✓, Cuenta ✓, Moneda BS ✓, Fecha Doc 12/6/2026 ✓, cobro vinculado + total 1000 BS ✓ en Tab Cobros/Total. ⚠ Ver Hallazgo H1 (Nro. Plantilla no persiste) |
| DM-DEP-017 | ✅ PASS | Enviar → 3 alertas: "El Depósito será enviado" (Cancelar/Aceptar) → "El Depósito será enviado" (OK) → "**Depósito nro. 4 enviado exitosamente**". Ref 0 → Ref **4** Enviado (servidor asigna correlativo) |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar renderiza; depósito ahora "Nro Ref: 4 · Enviado". **Defecto render NO reprodujo** |
| DM-DEP-019 | ✅ PASS | Click depósito Enviado → form **solo lectura**: banco select disabled, Nro. Plantilla read-only, **sin** botones Guardar/Enviar/basura. Tabs reducidas a General/Total/Adjuntos (sin Cobros). Sin basura/datos espurios |
| DM-DEP-020 | ✅ PASS | Basura en depósito Guardado (creado para el caso) → alert **"¿Desea eliminar el depósito seleccionado?"** (Cancelar/Aceptar) → Aceptar → ítem desaparece de la lista (sin alert de éxito posterior, borrado silencioso) |

## ¿Reprodujo DM-DEP-010/018?
**NO.** La lista BUSCAR renderizó correctamente en las 3 ocasiones probadas (tras guardar, tras enviar, y tras borrar). El defecto conocido v6.6.14 (`deposit.service.ts`, lista no renderiza tras guardar) **no se reprodujo en central_foods**, consistente con las 2 corridas limpias previas de insumar (0609, 0610). Refuerza el candidato a cierre del defecto.

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Depósito Nro. 4 | BANESCO *** 1040480 · BS · 1000.0000 · cobro ALEJANDRA LEDEZMA (Ref 17) · Fecha 2026-06-12 12:40:59 · Nro. Plantilla intentado 104156 (no persistió) | **Enviado** (DM-DEP-017) |
| Depósito Nro. 0 (temporal) | BANESCO *** 1040480 · BS · 17068.9464 · cobro ALEJANDRA LEDEZMA (Ref 27) | **Eliminado** en DM-DEP-020 (no queda registro) |

## Discrepancias VG (CSV dev vs UI)
| VG | CSV dev | Observado en UI | ¿Discrepancia? |
|----|---------|-----------------|----------------|
| `multiCurrencyDeposit` | true | **Selector Moneda presente** (BS / US$) en el form de depósito | ✅ Coincide |
| `signatureDeposit` | true (prompt) | **No verificable de forma concluyente** — no se exploró el Tab Adjuntos en busca del acordeón Firma (el flujo no requirió adjunto/firma para guardar ni enviar; envío end-to-end NO exigió firma). Sin evidencia de bloqueo por firma | ⚠ No confirmado (ver nota) |
| `clientBankAccount` | false | El Banco es **cuenta del receptor/empresa** (8 bancos propios: BANESCO/BANPLUS/BNC/MERCANTIL/PROVINCIAL/TESORO/VENEZUELA), **no** hay asociación de cuenta bancaria del cliente | ✅ Coincide |
| `enterpriseEnabled` | false | Hay label "Empresa:" con select **disabled** mostrando "CENTRAL FOODS C.A." (preseleccionada, 1 sola opción, no editable) | ⚠ Menor: el campo existe pero es display fijo no editable — coherente con enterpriseEnabled=false (sin selección de empresa real) |

**Nota signatureDeposit:** no se ejecutó un caso dedicado a Adjuntos/Firma (no está en la lista de casos asignados) y el envío del depósito **no requirió firma** para completarse end-to-end. Queda como gap de verificación; recomendable explorar Tab Adjuntos en una corrida futura para confirmar el acordeón Firma.

## Hallazgos
**H1 — Nro. Plantilla no persiste en round-trip (Guardar → reabrir).** Severidad: media.
Al guardar el depósito se escribió `Nro. Plantilla = 104156` (`fillIonInput`, valor confirmado en el input antes de Guardar). Al reabrir el depósito Guardado desde BUSCAR (DM-DEP-014), el campo **Nro. Plantilla aparece vacío** (re-leído tras esperar 1.5s para descartar render asíncrono). El resto de datos del depósito sí persiste correctamente (banco, cuenta, moneda, fecha doc, cobro vinculado, monto total). Es una divergencia silenciosa de oráculo de persistencia (RUNTIME §9): un valor editable ingresado por el usuario revierte a vacío al reabrir.
- No bloquea Guardar/Enviar (esos se habilitan por la selección de cobros, no por la plantilla).
- El depósito se envió igualmente (Ref 4 Enviado).
- Requiere confirmar en código si el campo es write-only / se asigna server-side, o si es un bug real de relectura. Marcado como hallazgo, **no** como FAIL del caso DM-DEP-014 (el caso pide "formulario con datos previos" y sí los muestra).

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| Banco DEPÓSITOS central_foods = `ion-select.selectbanco` con `ion-select-option` reales | cliente (central_foods) | Igual que insumar/globalmp/romher en DEPÓSITOS: asignar `option.value` (objeto idBankAccount/coBank) + ionChange. 8 cuentas propias del receptor |
| Selector Moneda en form depósito (`multiCurrencyDeposit=true`) | universal (cuando VG true) | `ion-select` con opciones BS/US$ (objeto coCurrency); default BS. Confirma efecto DOM de `multiCurrencyDeposit` |
| Nro. Plantilla / Comentario por contexto de texto del padre | cliente | Los ion-input del form no tienen `id`/`label` accesible; localizar por `parentElement.innerText` que contiene "Nro. Plantilla:" / "Comentario:" / "Banco:" |
| Tab Cobros: filas en grid (no ion-item) | cliente | Las filas de cobros se leen del `innerText` del componente (Cliente/Fecha Cob./Referencia/Monto Depósito/Monto Cobro); checkbox por `ion-checkbox` visible → `mouse.click` en coords; "Monto total depositado: N BS" se actualiza al marcar |
| Fecha Doc datetime abre con HOY (no "mayo 2021") | cliente | A diferencia de insumar, en central_foods el ion-datetime de Fecha Doc abre con la fecha actual ya cargada; aun así se asignó valor antes de Aceptar por seguridad |
| Envío depósito = 3 alertas | cliente | "El Depósito será enviado" (Cancelar/Aceptar) → "El Depósito será enviado" (OK) → "Depósito nro. N enviado exitosamente" (OK). Ref 0 → Ref real |
| Borrado depósito Guardado = CON confirmación, sin alert de éxito | cliente | "¿Desea eliminar el depósito seleccionado?" (Cancelar/Aceptar) → ítem desaparece silenciosamente (sin alert posterior). Trash `ion-button[color="danger"]` solo en filas Guardado |
| Depósito Enviado = solo lectura | universal | Banco select `disabled`, inputs read-only, sin Guardar/Enviar/basura; tabs reducidas a General/Total/Adjuntos (sin Cobros) |

*Defecto v6.6.14 DM-DEP-010/018 (lista BUSCAR no renderiza) NO reprodujo en central_foods — 3ª/4ª corrida limpia acumulada (insumar 0609, insumar 0610, central_foods 0612 ×2 verificaciones).*

> ✅ consolidado 2026-06-12
