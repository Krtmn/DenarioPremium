# Smoke — DEVOLUCIONES
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.devoluciones`
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

---

## Verificación BD — modelo de 2 agentes (UI emite · BD coteja · ver RUNTIME §10)

> **PILOTO (devoluciones):** la verificación profunda campo-a-campo la hace un **agente BD separado** con `automation/db/cotejo-bd.js`. El agente de UI **NO** hace el cotejo; solo **emite el manifiesto** con los `co_return` que crea.

**Trabajo del agente UI — emitir manifiesto.** Tras cada DM-DEV-016 (Guardar) / DM-DEV-018 (Enviar), capturar el `co_return` recién creado y anexarlo al manifiesto de la corrida (vía Bash, con la herramienta del agente — NO desde el page-eval):
```bash
# 1) leer el co_return recién creado (el último en local)
node automation/db/local-query.js "SELECT co_return, id_return, st_delivery FROM returns ORDER BY rowid DESC LIMIT 1"
# 2) anexar una línea JSON al manifiesto (action: sent|saved)
echo '{"module":"devoluciones","co_x":"<co_return>","action":"sent"}' >> "{RUN_DIR}_bd-manifest.jsonl"
```
El manifiesto es el **contrato** que el agente BD consume. Si el agente UI no anota un `co_return`, el agente BD no lo verifica.

**Trabajo del agente BD** (lo lanza el orquestador, sin Playwright): lee `{RUN_DIR}_bd-manifest.jsonl`, y por cada `co_x` corre `node automation/db/cotejo-bd.js {QA_CLIENTE} devoluciones <co_x>` → cotejo **campo por campo** (regla local-driven) → arma la sub-sección `## Verificación BD`. Ver el prompt del Agente BD en el orquestador y la mecánica en **RUNTIME §10**.

---

### (Referencia) Consultas BD sueltas — cotejo manual / fallback
Si se quiere chequear a mano (o el manifiesto no está disponible). Mecánica, vocabulario (`BD-OK/MISMATCH/N-A/INFO`) y blindaje (BD caída ⇒ `BD-N/A`, **nunca** tumba el smoke): **RUNTIME §10**.

```bash
node automation/db/query.js {QA_CLIENTE} "SELECT r.id_return, r.co_return, r.st_return, r.nu_amount, (SELECT count(*) FROM return_detail d WHERE d.id_return=r.id_return) det FROM \"return\" r ORDER BY r.da_created DESC LIMIT 5"
```

**Qué confirmar** en la fila recién creada:
- `return` existe; `st_return` ∈ `statuses` tipo `dev` (1=Por aprobar, 8=Enviado) — **NO** vía `lov` (ver modelo §4.3/§5).
- `det` (nº `return_detail`) = nº de productos agregados por UI.

**2) Local — cotejo guardado→enviado (⚠ tabla local PLURAL `returns`):**
```bash
node automation/db/local-query.js "SELECT co_return, id_return, st_delivery FROM returns ORDER BY rowid DESC LIMIT 5"
node automation/db/local-query.js "SELECT count(*) en_cola FROM pending_transactions WHERE type='return'"
```
- `id_return>0` & `st_delivery=1` → **BD-OK** (enviado) · `id_return=0` → **BD-SAVED** (guardado, sin enviar) · en cola → **BD-QUEUED** · en `failed_transactions` (type='return') → **BD-MISMATCH**.
- **Correlación: Nro.Ref UI = `id_return`** → `BD-INFO` hasta graduar a FAIL.
