# Smoke WEB — Módulo DEVOLUCIONES

**Ruta:** `/pages/devoluciones` · **Tabla:** `form:pedidosDT` ⚠ **compartida** · **Detalle:** `/pages/detalleDevolucion`
**Reglas:** `../WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md` · **Modo:** 🔴 READ-ONLY

## 🔴 Particularidad que define este guión: **devoluciones NO maneja montos**

Confirmado en el reconocimiento: **ni la lista ni el detalle muestran importes**. Solo **cantidad**.

⇒ **No hay oráculo de cálculo.** No inventar uno. Lo que se verifica acá es **integridad de datos**:
cantidad, lote, N° de factura, fecha de vencimiento, motivo, tipo y precinto.

> Si en alguna playa aparecieran montos en devoluciones, **reportarlo como hallazgo** — sería una diferencia
> de comportamiento entre servidores, no un caso a validar de rutina.

⚠ `verificarContexto(ctx, 'devoluciones', esDetalle, playa)` antes de leer.

## Familias
`C##` cotejo · `F##` filtros · `M##` muestreo BD↔web · `D##` comportamiento

---

## COTEJO (`C##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-DEV-C01** | Presencia por `# Ref` | 1 fila y coincide |
| **DW-DEV-C02** | Cabecera: fecha, vendedor, empresa, **código y nombre del cliente**, responsable | `cotejarCampos` → 0 diffs |
| **DW-DEV-C03** | **Tipo de devolución** (ej. `Calidad`) | == lo enviado (`id_type` en BD) |
| **DW-DEV-C04** | **Precinto** y **Observaciones** | exactos ⚠ `Observaciones` **no lleva `:`** → la regla de cabecera estándar lo pierde; leerlo aparte |
| **DW-DEV-C05** | **Líneas**: cód. producto, producto, **cantidad**, **lote**, **N° factura**, **fecha de vencimiento**, `Devolución en`, **motivo** | cada línea cuadra 1:1 |
| **DW-DEV-C06** | Nº de líneas == las enviadas | igual |
| **DW-DEV-C07** | Estatus | coincide con la UI (⚠ **no** interpretar `st_return` con el catálogo `statuses`) |
| **DW-DEV-C08** | Adjuntos y **firma** presentes si el móvil los mandó | coherente |
| **DW-DEV-C09** | **Ubicación / coordenada** | ⚠ puede **no ser texto visible** (vive en el HTML del mapa): buscarla ahí antes de darla por faltante |

**Datos reales** (`el_valle-20260728`): **Ref 177** — ARMAS DEL ROSARIO · tipo `Calidad` ·
`C0051` ALAS DE POLLO ×2 · lote `LOTE-QA-728` · factura `P00004560` · venc. `31/12/2026` ·
motivo `Empaque Sucio (Inocuidad)` · precinto `PRE-20260728`.

⚠ **La tabla hija es `form:j_idt169`** (auto-generado) → anclar por estructura:
`__qaW.tablaPorColumnas(['Cod. producto','Lote','Motivo'])`.

---

## FILTROS (`F##`)

| ID | Filtro | PASS | Nivel |
|----|--------|------|-------|
| **DW-DEV-F01** | `# Ref` existente | 1 fila | 🔴 |
| **DW-DEV-F02** | `# Ref` inexistente | 0 filas, sin error | 🔴 |
| **DW-DEV-F03** | `Limpiar` | vuelve al total | 🔴 |
| **DW-DEV-F04** | Vendedor | conteo == BD | 🔴 |
| **DW-DEV-F05** | Rango de fechas | ninguna fuera del rango | 🔴 |
| **DW-DEV-F06** | Status | solo ese estatus | 🟡 |
| **DW-DEV-F07** | Cliente | solo ese cliente | 🟢 |
| **DW-DEV-F08** | Tiene Adjunto | coherente | 🟢 |
| **DW-DEV-F09** | Vendedor + fechas | intersección | 🟡 |

---

## MUESTREO BD ↔ WEB (`M##`)

```sql
SELECT r.id_return, r.co_return, r.st_return, r.id_type, r.nu_seal, r.da_return, r.co_client
FROM return r ORDER BY r.id_return DESC LIMIT 30;
-- líneas:
SELECT co_return, count(*) n, sum(qu_product) unidades FROM return_detail GROUP BY co_return;
```

| ID | Verifica |
|----|----------|
| **DW-DEV-M01** | Los 30 aparecen en la lista |
| **DW-DEV-M02** | Tipo y fecha de la lista == BD, en los 30 |
| **DW-DEV-M03** | En **5 detalles al azar**: nº de líneas y **cantidades** == `return_detail` |
| **DW-DEV-M04** | **Lote y N° de factura** llegaron íntegros (no truncados ni vacíos) en los muestreados |
| **DW-DEV-M05** | **Consistencia lista ↔ detalle** (cliente, fecha, estatus) |

> 💡 `M04` importa: `requeridedNroFactura=true` hace obligatorio el nº de factura en el móvil, así que
> **ninguna devolución debería tener ese campo vacío en la web**. Si aparece vacío, es defecto.

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica |
|----|----------|
| **DW-DEV-D01** | Paginación *(⚠ en `el_valle` había solo 3 devoluciones: si no hay volumen, `WEB-N/A` por falta de datos)* |
| **DW-DEV-D02** | Orden por `# Ref` (numérico) y por fecha |
| **DW-DEV-D03** | Selector `Columnas` |
| **DW-DEV-D04** | Lista vacía → mensaje, sin error |
| **DW-DEV-D05** | `Descargar adjuntos` / `Ver adjuntos` **abren** sin romper la vista *(no descargar masivamente)* |

---

## Veredictos y ledger

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-N/A`
⚠ **`WEB-CALC-MISMATCH` no aplica** en este módulo: no hay cálculos que verificar.

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"devoluciones","caso":"DW-DEV-C05","ref":"177","marca":"WEB-OK","ms":0}
```
