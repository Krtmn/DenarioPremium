# Smoke — DEPÓSITOS
## Estado inicial: HOME | Estado final: HOME

**Inicio:** `h.connectCdp(page)` → `h.waitSyncOverlay(pg)`
**Datos de prueba:** leer `automation/clientes/{QA_CLIENTE}.yaml` → `modules.depositos`

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

---

## Verificación BD (round-trip al servidor · ver RUNTIME §10)

Solo si `modules.depositos.aplica=true`. Tras DM-DEP-017 (Enviar) y DM-DEP-009 (Guardar), confirmar el depósito en BD. Mecánica, vocabulario y blindaje (BD caída ⇒ `BD-N/A`, **nunca** tumba el smoke): **RUNTIME §10**.

> 🔴🔴 **CORREGIDO 2026-08-17 (4 confirmaciones: `[ins-2622]`, `[grupo_fiel-20260817]`, `[kron-20260817]`).**
> La versión anterior de este guión mandaba contar la hija **`deposit_collection_payment`**. **Esa tabla NUNCA
> se puebla** — verificada VACÍA en los dos tenants y en todo el histórico ⇒ **producía `BD-MISMATCH` falsos en
> cada corrida.** El vínculo real es el **FK invertido `collection.id_deposit`**. **No volver a cotejar por esa tabla.**

```bash
# 1) Cabecera del depósito + nº de cobros vinculados POR EL FK INVERTIDO (no por la N:M)
node automation/db/query.js {QA_CLIENTE} "SELECT d.id_deposit, d.co_deposit, d.st_deposit, d.nu_amount_doc, d.da_deposit, (SELECT count(*) FROM collection c WHERE c.id_deposit=d.id_deposit) cobros FROM deposit d ORDER BY d.id_deposit DESC LIMIT 5"

# 2) Qué cobros exactamente — para cotejar contra collectionIds:[…] del payload
node automation/db/query.js {QA_CLIENTE} "SELECT id_collection, co_collection, id_deposit FROM collection WHERE id_deposit = <id_deposit>"
```

**Qué confirmar** en la fila recién creada:
- `deposit` existe; `nu_amount_doc` = el Monto tipeado en UI; `st_deposit` = Guardado (5) / Enviado (9).
- 🔑 **`cobros` = nº de cobros que agrupa el depósito**, y el conjunto de `id_collection` debe coincidir con el
  array **`collectionIds:[…]`** del payload `depositservice/deposit`. **Los 3 oráculos válidos del vínculo
  cobro↔depósito son:** (a) `collection.id_deposit` en la nube · (b) `collectionIds` del payload · (c)
  `deposit_collects` en la BD **local**.
- ⛔ **`deposit_collection_payment` NO es oráculo** — está vacía siempre; si un cotejo la mira, el resultado es
  `BD-INFO`, **nunca** `BD-MISMATCH`.
- ⚠ `deposit` **no tiene `da_created`** → ordenar por `id_deposit`/`da_deposit`.
- ⚠ `deposit` **no tiene `co_user`** — el vendedor va solo por `id_user`. Y en `collection_payment` el monto es
  **`nu_amount_partial`**, no `nu_amount`. `[kron-20260817]`
- ⚠ **Secuenciación de datos:** para cubrir **DM-DEP-017 (Enviar) Y DM-DEP-020 (Borrar)** hacen falta
  **≥2 cobros con efectivo** disponibles al llegar al módulo — con uno solo, Enviar consume el pool y el borrado
  queda **N/A por datos**. Verificar antes: `collection_payments.co_payment_method='ef'` menos los ya presentes
  en `deposit_collects`. `[latino_cosmetica-20260729][grupo_fiel-20260817][kron-20260817]`
- Nota: el defecto conocido DM-DEP-010/018 (lista BUSCAR no renderiza) es de **UI** — la BD puede tener el registro aunque la lista no lo muestre; esta verificación lo confirma.

**2) Local — cotejo guardado→enviado (⚠ tabla local PLURAL `deposits`):**
```bash
node automation/db/local-query.js "SELECT co_deposit, id_deposit, st_delivery FROM deposits ORDER BY rowid DESC LIMIT 5"
node automation/db/local-query.js "SELECT count(*) en_cola FROM pending_transactions WHERE type='deposit'"
```
- `id_deposit>0` & `st_delivery=1` → **BD-OK** (enviado) · `id_deposit=0` → **BD-SAVED** (guardado, sin enviar) · en cola → **BD-QUEUED** · en `failed_transactions` (type='deposit') → **BD-MISMATCH**.
- **Correlación: Nro.Ref UI = `id_deposit`** → `BD-INFO` hasta graduar a FAIL.
