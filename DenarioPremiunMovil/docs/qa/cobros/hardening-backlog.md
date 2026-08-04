# Cobros — Backlog de blindaje QA

## Estado (2026-08-04)

| Capa | Estado |
|------|--------|
| Unit + component (oleadas 1–2) | **Hecho** — `npm run test:cobros` → **70 SUCCESS** |
| Smoke manual P3 | Checklist en [smoke-manual.md](./smoke-manual.md) — **pendiente ejecutar en dispositivo** |
| CI P4 | Workflow `.github/workflows/cobros-unit.yml` |

## Completado

### Oleada 1
- Multi-método, applyExistingSelection, COB-TR-002/003, Otros+diff codes, IGTF embebido, anticipo gate, retentionInvalid, tolerancia0/cruzada, add payment, docs send, pagos/general specs, CI, smoke doc.

### Oleada 2
- [x] Reinjection SQL `addSelectedDocumentsSalesFromMemory`  
- [x] IGTF separado (`separateIgtf`)  
- [x] `validateReferencePayment` (sin ref / efectivo / monto 0)  
- [x] Anticipo `coType=1` validateToSend ON/OFF  
- [x] cobro-documents: filtro moneda + sync parcial  
- [x] cobro-total: format/columns/docs negativos  
- [x] cobros-list: filtro búsqueda  

## Qué vendría después (para “cerrar” Cobros)

Ya no es más unitario de lógica crítica. El cierre es **validación humana + trazabilidad + mantenimiento**:

| Prioridad | Acción | Tipo |
|-----------|--------|------|
| **A — Cierre release** | Ejecutar [smoke-manual.md](./smoke-manual.md) en dispositivo (build release) y firmar | Manual |
| **B — Trazabilidad** | Matriz guion DM-COB-001…047 ↔ unit / component / manual / N/A | Doc QA |
| **C — Política** | Regla: todo bug nuevo `COB-*` en `BUGS.md` trae ≥1 test o justificación “solo manual” | Proceso |
| **D — Opcional bajo demanda** | Adjuntos, GPS, persistencia SQLite real, enviar al WS, race de tabs | Solo si regresan bugs |
| **E — Siguiente módulo** | Repetir plantilla `docs/qa/<modulo>/` + `test:<modulo>` (Pedidos / Devoluciones / Clientes) | Escala |

**No recomendado ahora:** E2E Appium completo de Cobros — el ROI es bajo frente a 70 unitarios + smoke corto.

## Definition of Done QA (Cobros)

- [x] Bugs `COB-*` de `BUGS.md` con test o justificación (COB-TR-004 = config/smoke).  
- [x] Completitud ef/ch/de/tr/pm/ot.  
- [x] Tolerancia absoluto + % + tolerancia0 off + cruzada.  
- [x] Totales multi-doc / parcial / retención / IGTF embebido+separado / reinjection.  
- [x] Tipos módulo anticipo / retención / 25%.  
- [x] Componentes críticos (pagos, general, documents, total, list).  
- [ ] Smoke P3 pasado en build de release (**humano — único blocker de cierre**).  
- [x] `test:cobros` en CI por path.

Catálogo: [unit-tests-catalog.md](./unit-tests-catalog.md).
