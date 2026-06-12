# Smoke — DEPÓSITOS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}/{QA_CLIENTE}.yaml` → `modules.depositos`

---

## ⚠ Verificar antes de ejecutar

Leer `modules.depositos.aplica` del perfil cliente:
- Si `aplica=false` → marcar **todos los casos como N/A**, documentar `motivo_na`, navegar a Home. No ejecutar ningún caso.
- Si `aplica=true` → ejecutar normalmente.

---

## Casos (solo si `aplica=true`)

| ID | Acción clave | PASS cuando | FAIL / N/A |
|----|-------------|-------------|------------|
| DM-DEP-001 | Click módulo Depósitos | Home con botones DEPÓSITO y BUSCAR | FAIL: pantalla vacía |
| DM-DEP-002 | Click DEPÓSITO → formulario | Campos: Banco, Fecha Doc, Nro Depósito, Monto; botones deshabilitados sin datos | FAIL: botones activos sin datos |
| DM-DEP-004 | `h.selectIonPopover` Banco (`COB_BANCO_RECEPTOR`) | Banco seleccionado en campo | FAIL: selector vacío |
| DM-DEP-005 | `h.confirmDatetime(pg)` en selector Fecha Doc | Fecha seleccionada | FAIL: fecha no se confirma |
| DM-DEP-006 | `h.fillIonInput` Nro Depósito + Monto | Botón Guardar habilitado | FAIL: botón sigue deshabilitado |
| DM-DEP-009 | Click Guardar | Alert confirmación; depósito en BUSCAR Estatus: Guardado | FAIL: sin alert |
| DM-DEP-010 | Click BUSCAR | Lista con depósito Guardado | **Defecto conocido v6.6.14:** lista puede no renderizar — si persiste documentar FAIL con descripción del bug |
| DM-DEP-014 | Click en depósito Guardado | Formulario con datos previos | FAIL: vacío o solo lectura |
| DM-DEP-017 | Click Enviar → ACEPTAR | Depósito "Enviado" | FAIL: sigue Guardado |
| DM-DEP-018 | BUSCAR tras guardar | Lista muestra depósito | **Defecto conocido:** puede no renderizar (bug `deposit.service.ts`) |
| DM-DEP-019 | BUSCAR → click en depósito Enviado | Solo lectura, sin botón eliminar | FAIL: editable o con basura |
| DM-DEP-020 | Botón basura en Guardado → confirmar | Desaparece | FAIL: persiste |
