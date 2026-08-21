# Devoluciones — Catálogo de tests unitarios

**Spec principal:** `src/app/services/returns/return-logic.service.spec.ts`

**Correr:**

```bash
cd DenarioPremiunMovil
npx ng test --include=src/app/services/returns/return-logic.service.spec.ts --no-watch --browsers=ChromeHeadless
```

**Smoke dispositivo:** [smoke-manual.md](./smoke-manual.md)

Los unitarios validan **lógica de botones Guardar/Enviar** y validación al click. Overlay, SQLite real, GPS y flujo Home→módulo quedan en smoke manual.

---

## 1. Guardar / baseline (`return-logic.service`)

| ID / caso | Qué hace |
|-----------|----------|
| **DEV-SAVE-001** | `updateSaveButtonAvailability`: General OK + sin baseline → Guardar ON. |
| **DEV-SAVE-001** | Baseline limpio (`returnPersistedBaseline` sin dirty) → Guardar OFF aunque General OK. |
| **DEV-SAVE-002** | `markReturnDirty` tras `applyReturnPersistSucceededBaseline` → Guardar ON de nuevo. |
| — | `markReturnOpenedFromPersistedCopy` (reapertura) → Guardar OFF hasta dirty (smoke manual). |

## 2. Enviar / validación al click

| ID / caso | Qué hace |
|-----------|----------|
| **DEV-SEND-001** | `updateSendButtonAvailability`: General OK → Enviar ON sin productos. |
| **DEV-SEND-001** | `hasReturnFieldErrors` true con `productList` vacío. |
| **DEV-SEND-001** | Sin cliente → mensaje `DEV_MSJ_ERROR_NO_CLIENT`. |
| **DEV-SEND-001** | `validateReturn` sin factura → `DEV_MSJ_ERROR_NO_INVOICE`. |
| **DEV-SEND-001** | `requeridedNroFactura` + `coDocument` vacío → producto incompleto. |
| **DEV-SEND-001** | `stDelivery` TO_SEND o SENT → read-only, botones OFF. |
| **DEV-SEND-001** | `signatureReturn` sin adjuntos → **no** error (solo UI). |

## Fuera de unitarios (manual / N/A)

- Hints visuales en `devolucion-general` / `devolucion-product-list` tras `sendValidationAttempted`.
- Confirmación Guardar (`DEV_MSJ_SAVE_QUESTION`) y Enviar (`DENARIO_DEV_CONFIRM_SEND`) en header.
- Auto `"0"` en `coDocument` cuando `!requeridedNroFactura && !validateReturn`.
- Cola AutoSend y persistencia SQLite (`ReturnDatabaseService`).
