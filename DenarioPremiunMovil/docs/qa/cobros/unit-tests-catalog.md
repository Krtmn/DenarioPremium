# Cobros — Catálogo de tests unitarios

**Specs:**
- `src/app/services/collection/collection-logic.service.spec.ts`
- `src/app/cobros/.../cobro-pagos.component.spec.ts`
- `src/app/cobros/.../cobro-general.component.spec.ts`

**Correr:** `npm run test:cobros`  
**Estado:** ver salida de `npm run test:cobros` (incluye COB-DISC-001).  
**CI:** `.github/workflows/cobros-unit.yml` (PR que toque cobros/collection).

Los unitarios validan **lógica de negocio** y regresiones UI críticas. Smoke dispositivo: [smoke-manual.md](./smoke-manual.md).

---

## 1. Smoke del servicio

| Caso | Qué hace |
|------|----------|
| `should be created` | El servicio se inyecta correctamente en TestBed. |

## 2. Always partial payment + tolerancia

| Caso | Qué hace |
|------|----------|
| special alwaysPartialPayment mode | Modo fijo especial: exceso dentro de rango habilita Enviar. |
| alwaysPartialPayment + parcial activo | Exige monto exacto (pagado ≠ a pagar → OFF). |

## 3. Retenciones — voucher y fecha

| Caso | Qué hace |
|------|----------|
| normalize… preserve voucher/date | Conserva voucher y fecha al normalizar. |
| enforce nuVoucherLength | Longitud configurada obligatoria. |
| allow empty when optional | Vacío OK si no es obligatorio. |
| length even when optional | Si se escribe, debe cumplir longitud. |
| syncLegacy… first line | Copia 1ª línea con monto a legacy. |
| map nu/da voucher from SQL | Mapea columnas voucher/fecha. |

## 4. Documentos / montos

| ID | Qué hace |
|----|----------|
| **DM-COB-008** | Dos docs completos suman `montoTotalPagar`. |
| **COB-DOCS-001** | Parciales multi-página vía `collectionDetails` (no solo página actual). |
| **COB-DOCS-001** | `applyExistingSelection` restaura `inPaymentPartial` + monto parcial. |
| **DM-COB-046** | Parcial usa monto parcial, no saldo completo. |
| **DM-COB-041** | Retenciones IVA/ISLR bajan el neto. |

## 5. Flags de módulo

| ID | Qué hace |
|----|----------|
| **DM-COB-028** | Anticipo: Documentos OFF, Pagos ON. |
| **DM-COB-029** | Retención: Documentos ON, Pagos OFF; total = suma retenciones. |
| **DM-COB-037** | Cobro 25%: ambas pestañas + `cobro25`. |

## 6. Completitud de métodos de pago

| ID | Qué hace |
|----|----------|
| **DM-COB-010** | Efectivo: monto &gt; 0. |
| **DM-COB-011** | Cheque: monto, fechas, banco, nº. |
| **DM-COB-039** | Pago móvil: monto, fecha, bancos, doc, ref. |
| **DM-COB-040** | Depósito: banco, cuenta, nº, fecha, monto. |
| **DM-COB-042** | Otros: monto + nombre. |
| **COB-TR-001** | TR sin/con `clientBankAccount` y nueva cuenta. |
| **P0 multi-método** | Efectivo OK + depósito incompleto → incompleto global. |

## 7. Tolerancia absoluta (`TipoTolerancia = 0`)

| ID | Qué hace |
|----|----------|
| **DM-COB-012** | Faltante dentro/fuera de rango−. |
| **DM-COB-043** | Exacto → ON. |
| **DM-COB-012** | Pagado 0 → OFF. |
| **DM-COB-012** | Exceso dentro de rango+ → ON (`<`). |
| **DM-COB-012** | Exceso en límite rango+ → OFF. |
| **DM-COB-012** | `tolerancia0=false` exige exacto en `validateToSend`. |
| **DM-COB-012** | Moneda cruzada usa rango+ convertido. |

## 8. Tolerancia porcentual (`TipoTolerancia != 0`)

| ID | Qué hace |
|----|----------|
| **DM-COB-012-%** | Exceso / faltante dentro y fuera de % (`<=`). |

## 9. Gates de envío / dinero (P1)

| ID | Qué hace |
|----|----------|
| **P1 difference codes** | Con `enableDifferenceCodes`, Otros sin código → Enviar OFF. |
| **P1 IGTF** | IGTF embebido 3% sobre 100 → total 103. |
| **P1 anticipo auto** | `shouldCreateAutomatedPrepaidOnSend` solo con exceso &gt; rango. |
| **P1 retention invalid** | Suma &gt; saldo o ambos 0 → inválido. |
| **P1 add payment** | `nuDifference >= 0` bloquea agregar método. |
| **P1 docs for send** | Sin doc listo → false; seleccionado+save → true. |

## 10. Componentes

| ID | Spec | Qué hace |
|----|------|----------|
| filtros banco | cobro-pagos | Filtra / limpia búsqueda de bancos y cuentas. |
| **COB-TR-002** | cobro-pagos | `setMonto` fuerza `disableSendButton=true` y revalida. |
| **COB-TR-003** | cobro-general | Hidrata TR sin invertir cuentas; restaura nueva cuenta. |
| **P2 filtro moneda** | cobro-documents | Filtra docs de la página por moneda. |
| **P2 parcial UI** | cobro-documents | Sync flag parcial a doc/detail/open. |
| **COB-DISC-001** | cobro-documents | `clearDocumentDiscountUiState` limpia buffers; `checkCollectDiscount` deja 0 sin líneas. |
| **P2 totales** | cobro-total | Format montos, columnas retención, docs negativos. |
| **P2 lista** | cobros-list | Búsqueda por nombre cliente / vacío. |

## 11. Oleada 2 — service

| ID | Qué hace |
|----|----------|
| **COB-DOCS-001** | `addSelectedDocumentsSalesFromMemory` reinyecta doc off-page con parcial. |
| **P1 IGTF separado** | `separateIgtf=true` → total neto 100, IGTF 3 (no 103). |
| **P1 referencias** | TR sin ref → false; efectivo sin ref → true; monto 0 → false. |
| **DM-COB-028** | Anticipo: pago con monto parcial → Enviar ON; sin monto → OFF. |

## 12. COB-DISC-001 — descuentos por documento

| ID | Qué hace |
|----|----------|
| **COB-DISC-001** | Manual discount solo en el `coDocument` que lo tiene; el otro queda `[]`. |
| **COB-DISC-001** | Descuentos distintos por doc no se cruzan. |
| **COB-DISC-001** | Match con `co_document` con espacios vía `normalizeCoDocument`. |

---

## Relación con bugs

| Bug ID | Cubierto |
|--------|----------|
| COB-DOCS-001 | Sí (totales + applyExistingSelection + reinjection SQL) |
| COB-DISC-001 | Sí (`attachCollectionDetailDiscountsToDetails`) |
| COB-TR-001 | Sí (completitud TR) |
| COB-TR-002 | Sí (setMonto) |
| COB-TR-003 | Sí (hidratación) |
| COB-TR-004 | Smoke/config — ver AGENTS.md |

Cierre restante: [hardening-backlog.md](./hardening-backlog.md) (smoke dispositivo + matriz guion).
