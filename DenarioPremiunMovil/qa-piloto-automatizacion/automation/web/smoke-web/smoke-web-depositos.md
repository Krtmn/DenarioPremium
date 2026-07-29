# Smoke WEB — Módulo DEPÓSITOS

**Ruta:** `/pages/depositos` · **Tabla:** `form:pedidosDT` ⚠ **compartida** · **Detalle:** `/pages/detalleDeposito`
**Reglas:** `../WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md` · **Modo:** 🔴 READ-ONLY

> 💎 **El módulo con el oráculo más limpio de todo el smoke:** el detalle lista **los cobros que componen el
> depósito**, así que `Σ(cobros hijos) == Monto depositado` es una verificación cerrada y sin ambigüedad.
> Además cruza dos módulos: valida depósitos **y** la coherencia con cobros.

⚠ `verificarContexto(ctx, 'depositos', esDetalle, playa)` antes de leer — `form:pedidosDT` lo comparten 5 módulos.

## Familias
`C##` cotejo (depende del móvil) · `F##` filtros · `M##` muestreo BD↔web · `D##` comportamiento *(estas 3 no dependen del móvil)*

---

## COTEJO (`C##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-DEP-C01** | Presencia por `# Ref` | 1 fila y coincide |
| **DW-DEP-C02** | Cabecera: fecha depósito, **banco**, **N° cuenta**, vendedor, empresa, **N° planilla**, fecha de planilla | `cotejarCampos` → 0 diffs |
| **DW-DEP-C03** | `Monto depositado` == lo enviado por el móvil | exacto |
| **DW-DEP-C04** | 💎 🧮 **Σ(`Monto cobrado` de los cobros hijos) == `Monto depositado`** | `verificarSuma` OK (tol. 0,01) |
| **DW-DEP-C05** | **Los cobros hijos son los correctos**: cada `N° Ref cobro` está en el manifiesto/BD y ninguno sobra | conjunto exacto, ni de más ni de menos |
| **DW-DEP-C06** | 🧮 **Conversión**: `Monto depositado` ↔ `Monto depositado conv.` con `Tasa conv.` | ⚠ dirección según moneda (US$→BS **multiplica**) |
| **DW-DEP-C07** | **Enlace inverso**: en `/pages/cobros`, cada cobro hijo ofrece `Consultar Depósito` y lleva a **este** depósito | ida y vuelta íntegra |
| **DW-DEP-C08** | Cada cobro hijo: forma de pago, banco, N° documento, fecha documento | cuadra con el detalle del cobro |
| **DW-DEP-C09** | Estatus del depósito | coincide con la UI y con BD (⚠ **no** interpretar `st_deposit` con el catálogo `statuses`) |

**Datos reales** (`el_valle-20260728`): **Ref 1** — 20,00 USD · banco `BANCO MERCANTIL COVADONGA**9555 NUEVO`
(`co_bank 1101003`) · planilla `DEP-QA-0728` · **1 cobro hijo: Ref 119** (anticipo, 20,00). Σ = 20,00 ✅

⚠ **La tabla hija es `form:j_idt163`** (auto-generado) → **anclar por estructura**:
`__qaW.tablaPorColumnas(['N° Ref cobro','Monto cobrado'])`. **Nunca** escribir `j_idt163` en un guión.

🔴 **Trampa de modelo de datos:** `deposit_collection_payment` está **VACÍA**. El vínculo real depósito↔cobro
es la FK **`collection.id_deposit`**. Consultar por ahí:
```sql
SELECT id_collection, nu_amount_total FROM collection WHERE id_deposit = <id_deposit>;
```

---

## FILTROS (`F##`)

| ID | Filtro | PASS | Nivel |
|----|--------|------|-------|
| **DW-DEP-F01** | `# Ref` existente | 1 fila | 🔴 |
| **DW-DEP-F02** | `# Ref` inexistente | 0 filas, sin error | 🔴 |
| **DW-DEP-F03** | `Limpiar` | vuelve al total | 🔴 |
| **DW-DEP-F04** | Vendedor | conteo == BD | 🔴 |
| **DW-DEP-F05** | Rango de fechas | ninguno fuera del rango | 🔴 |
| **DW-DEP-F06** | Status | solo ese estatus | 🟡 |
| **DW-DEP-F07** | Moneda | solo esa moneda | 🟡 |
| **DW-DEP-F08** | Vendedor + fechas | intersección | 🟡 |

---

## MUESTREO BD ↔ WEB (`M##`)

```sql
SELECT d.id_deposit, d.nu_amount_doc, d.co_bank, d.nu_document, d.da_deposit, d.st_deposit
FROM deposit d ORDER BY d.id_deposit DESC LIMIT 30;
-- y por cada uno, sus cobros:
SELECT id_deposit, count(*) n, sum(nu_amount_total) suma FROM collection
WHERE id_deposit IS NOT NULL GROUP BY id_deposit;
```

| ID | Verifica |
|----|----------|
| **DW-DEP-M01** | Los depósitos de BD aparecen en la lista |
| **DW-DEP-M02** | `Monto depositado` de la lista == `nu_amount_doc` de BD, en todos |
| **DW-DEP-M03** | 💎 🧮 **En TODOS los muestreados: Σ(cobros con ese `id_deposit`) == monto del depósito** — el oráculo aplicado a escala, no solo al de la corrida |
| **DW-DEP-M04** | **Consistencia lista ↔ detalle** (banco, planilla, monto) |
| **DW-DEP-M05** | Ningún cobro aparece en **dos** depósitos distintos | 

> `M03` es de altísimo rendimiento: si algún depósito histórico no cuadra con sus cobros, es un
> descuadre contable real, no un detalle de presentación.

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica |
|----|----------|
| **DW-DEP-D01** | Paginación |
| **DW-DEP-D02** | Orden por `# Ref` (numérico, no texto) y por `Monto depositado` |
| **DW-DEP-D03** | Selector `Columnas` |
| **DW-DEP-D04** | Lista vacía → mensaje, sin error |
| **DW-DEP-D05** | El botón **`Consultar Depósito`** desde cobros llega al depósito correcto |

> ℹ **Defecto conocido** `DM-DEP-018/019/020` (la lista BUSCAR no renderiza tras guardar) es **del móvil**,
> no de la web. En `el_valle-20260728` **no reprodujo**. No confundirlo con un fallo web.

---

## Veredictos y ledger

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-CALC-MISMATCH` · `WEB-N/A`

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"depositos","caso":"DW-DEP-C04","ref":"1","marca":"WEB-OK","ms":0}
```
