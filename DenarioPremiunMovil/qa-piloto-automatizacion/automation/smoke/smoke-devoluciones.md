# Smoke — DEVOLUCIONES
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}/{QA_CLIENTE}.yaml` → `modules.devoluciones`
**VG clave:** `vgs.validateReturn` — si `true`, seleccionar factura para habilitar tabs.

---

## Casos

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-DEV-001 | Click módulo Devoluciones | Botones DEVOLUCIÓN y BUSCAR visibles | FAIL: pantalla vacía |
| DM-DEV-002 | Click DEVOLUCIÓN → formulario | Tabs Productos/Adjuntos `disabled`; sin cliente | FAIL: tabs habilitadas sin cliente |
| DM-DEV-004 | Seleccionar `cliente_test` en modal; si `validateReturn=true` → campo Factura aparece | Campo Factura visible (VG activa) o tabs habilitadas (VG inactiva) | FAIL: campo Factura ausente con VG activa |
| DM-DEV-006 | `h.fillIonInput` campos Responsable, Precinto, Comentario; `h.selectIonPopover` Tipo | Campos aceptan valores; Tipo con opciones en popover | FAIL: campos no editan |
| DM-DEV-011 | Si `validateReturn=true`: click en selector Factura → elegir `factura_test`; tabs habilitadas | Tab Productos accesible | FAIL: tabs siguen bloqueadas tras seleccionar factura |
| DM-DEV-013 | Tab Productos → Click AGREGAR PRODUCTO → seleccionar `producto_test` | Acordeón producto expandido con campos Cantidad, Lote, Motivo | FAIL: acordeón no expande |
| DM-DEV-014 | `h.fillIonInput` cantidad (campo `inp-write`) | Botones Guardar/Enviar habilitados | FAIL: botones siguen deshabilitados con cantidad |
| DM-DEV-015 | Tab Adjuntos | Acordeones Imágenes + Archivo (si `userCanUploadFiles`) + Firma (si `signatureReturn`) visibles | FAIL: acordeón ausente con VG activa |
| DM-DEV-016 | Click Guardar | Alert "¡Su Devolución se ha guardado!" | FAIL: sin alert |
| DM-DEV-018 | Click Enviar → ACEPTAR | Alert "¡Su Devolución será enviada!"; navega a home devoluciones | FAIL: sigue en Guardado |
| DM-DEV-019 | Click BUSCAR | Devolución en lista con Nro.Ref, cliente, Estatus, Fecha | FAIL: lista vacía |
| DM-DEV-021 | Escribir en searchbar | Lista filtra en tiempo real; botón eliminar solo en Guardado | FAIL: no filtra |
| DM-DEV-022 | Click en devolución Guardada | Formulario editable; 3 tabs accesibles; factura precargada | FAIL: solo lectura |
| DM-DEV-024 | Botón basura en Guardado → ELIMINAR | Devolución desaparece | FAIL: persiste |
