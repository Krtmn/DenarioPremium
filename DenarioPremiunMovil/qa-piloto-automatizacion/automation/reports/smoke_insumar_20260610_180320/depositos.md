# Smoke Test — Módulo DEPÓSITOS

| Parámetro | Valor |
|-----------|-------|
| RUN_ID | `20260610_180320_smoke-completo` |
| Módulo | DEPÓSITOS |
| Dispositivo | CDP `127.0.0.1:9220` (WebView Capacitor) |
| App | `com.kiberno.denarioPremiumPro` — v6.6.14 |
| Playa / Cliente | insumar (INSUMAR DISTRIBUIDOR) |
| Resultado | 12 PASS · 0 FAIL · 0 SKIP · 0 N/A |

`modules.depositos.aplica = true` → smoke ejecutado completo.

## Casos ejecutados
| ID | Resultado | Evidencia / Señal |
|----|-----------|-------------------|
| DM-DEP-001 | ✅ PASS | Módulo abre en `app-depositos` con botones DEPÓSITO (180,107) y BUSCAR (180,176) |
| DM-DEP-002 | ✅ PASS | Form `app-deposito`, 4 tabs (General/Cobros/Total/Adjuntos), campos Empresa/Moneda/Banco/Fecha Doc/Fecha Depósito; Guardar y Enviar deshabilitados sin datos |
| DM-DEP-004 | ✅ PASS | Banco BANESCO RAEL seleccionado (`ion-select.selectbanco`, idBankAccount:12, coBank:04); cuenta read-only autocompletó `01340239682391029301` |
| DM-DEP-005 | ✅ PASS | Fecha Doc confirmada 10/6/2026 vía modal `fechasModal` + `ion-datetime` Aceptar (shadowRoot) |
| DM-DEP-006 | ✅ PASS | Nro. Plantilla = 180320; tras marcar 1 cobro en Tab Cobros, Guardar se habilita (monto derivado de cobros, sin campo Monto libre) |
| DM-DEP-009 | ✅ PASS | Guardar → alert "Denario Depósito" / Aceptar; depósito aparece en BUSCAR como Estatus: Guardado (Ref 0, Banco 04, 19:22:42) |
| DM-DEP-010 | ✅ PASS | BUSCAR renderiza lista (14 items): depósito Guardado en tope + Enviados Ref 5–12. **Defecto v6.6.14 NO reprodujo** |
| DM-DEP-014 | ✅ PASS | Reabrir Guardado → form con datos previos: plantilla=180320, banco=04, Fecha Doc=10/6/2026 (persistencia round-trip OK); Guardar+Enviar habilitados |
| DM-DEP-017 | ✅ PASS | Enviar → confirmación [Cancelar/Aceptar] → resultado [OK]; depósito pasa a Estatus: Enviado con Ref 13 asignado |
| DM-DEP-018 | ✅ PASS | BUSCAR tras enviar renderiza (13 items), Enviado Ref 13 en tope, sin Guardados pendientes. **Defecto v6.6.14 NO reprodujo** |
| DM-DEP-019 | ✅ PASS | Click Enviado (Ref 13) → solo lectura: plantilla=180320, inputs disabled, Guardar/Enviar NO visibles, **sin botón eliminar** |
| DM-DEP-020 | ✅ PASS | 2º depósito Guardado (plantilla 180320b) muestra trash `ion-button[color="danger"]`; click → alert confirmación [Cancelar/Aceptar] → Aceptar → desaparece de la lista (14→13) |

## Registros creados en sistema
| Ref | Detalle | Estado |
|-----|---------|--------|
| Ref 13 | Banco BANESCO RAEL (04), Nro.Plantilla 180320, Fecha Doc 10/6/2026, 1 cobro vinculado (ALFREDO LUIS ALVES FERREIRA, 2026-06-04). Creado Guardado → **Enviado** | Enviado (persiste en sistema) |
| Ref 0 (transitorio) | Banco BANESCO RAEL (04), Nro.Plantilla 180320b, Fecha Doc 10/6/2026, 1 cobro. Creado para DM-DEP-020 → **eliminado** | Eliminado (no persiste) |

## Defecto DM-DEP-010/018/019/020 (v6.6.14 `deposit.service.ts`)
- **NO reprodujo.** La lista BUSCAR renderizó correctamente tras Guardar, tras Enviar y tras Eliminar en las 4 verificaciones de esta corrida.
- Consistente con la corrida 0609 (tampoco reprodujo). Dos corridas consecutivas sin reproducir → el bug aparece **corregido o ya no es reproducible** en este build/datos. Se recomienda actualizar el estado del defecto a "no reproducible 2 corridas (0609, 0610)" — pendiente de confirmación de fix en código por la QA antes de cerrarlo.

## Patrones / selectores nuevos (insumo de consolidación)
| Patrón / selector | Universal o cliente | Detalle |
|-------------------|---------------------|---------|
| `ion-modal.fechasModal ion-datetime` abre **sin valor inicial** (mes "mayo de 2021") | universal (depósitos) | `confirmDatetime` solo (Aceptar shadow) deja Fecha Doc **vacía**. Hay que **asignar `dt.value` ISO + ionChange ANTES** de pulsar Aceptar. Confirmado insumar [ins-2610]. Cierra gap G3 parcial. |
| Selección de banco depósito insumar = `ion-select.selectbanco` con **`ion-select-option` reales** | cliente insumar | A diferencia de COBROS (insumar usa `#bankPickerModal`), en DEPÓSITOS insumar SÍ usa `ion-select.selectbanco` + asignar `option.value` (objeto idBankAccount/coBank/...). Coincide con globalmp/romher. [ins-2610] |
| Lista `app-deposito-list`: `ION-ROW` contenedor abarca toda la lista (top..bottom gigante) | universal (depósitos) | Calcular coords sobre el **`ion-item`** individual, NO el `ion-row` padre (su centro cae fuera de viewport y selecciona el item equivocado). [ins-2610] |
| Borrado de depósito Guardado = **CON confirmación** (alert Cancelar/Aceptar) | cliente insumar | Distinto a Inventarios (directo sin confirmar). Item Guardado: trash en `ion-button[color="danger"]` dentro del `ion-item`. [ins-2610] |
| Flujo envío depósito = 2 alertas: confirmación [Cancelar/Aceptar] → resultado [OK] | cliente insumar | Servidor asigna Nro.Ref real al enviar (Ref 0 → Ref 13). [ins-2610] |
| Gap **G3 (DEPÓSITOS flujo envío completo)** cerrado | — | Guardar→Enviar con cobro vinculado ejecutado end-to-end en insumar (Ref 13 Enviado). El bug de render NO bloqueó. [ins-2610] |

> ✅ consolidado 2026-06-10

## Hallazgos (FAIL)
Ninguno. 12/12 PASS.
