# Smoke WEB — Módulo INVENTARIOS (toma de inventario en el cliente)

**Ruta:** `/pages/inventarios` · **Tabla:** `form:pedidosDT` ⚠ **compartida** · **Detalle:** `/pages/detalleInventario`
**Reglas:** `../WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md` · **Modo:** 🔴 READ-ONLY

## Particularidades que definen este guión

1. **La cantidad va SEPARADA POR UBICACIÓN**: el detalle trae columnas **`Depósito`** y **`Exhibición`**,
   no una sola cantidad. El cotejo tiene que respetar esa separación.
2. **`expirationBatch` gobierna la VALIDACIÓN, no la visibilidad** — los campos `Lote` y `Fecha expiración`
   se renderizan siempre; la VG decide si son obligatorios en el móvil. En la web **siempre deben mostrarse**
   si el móvil los mandó.
3. **La cabecera trae `Ver Pedido Relacionado`** → enlace cruzado a pedidos, verificable.

⚠ `verificarContexto(ctx, 'inventarios', esDetalle, playa)` antes de leer.
⚠ La tabla hija del detalle **también** es `form:pedidosDT` → doble motivo para verificar el contexto.

## Familias
`C##` cotejo · `F##` filtros · `M##` muestreo BD↔web · `D##` comportamiento

---

## COTEJO (`C##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-INV-C01** | Presencia por `# Ref` | 1 fila y coincide |
| **DW-INV-C02** | **Doble llave**: `No. de Ref.` + `Código inventario` (epoch `co_client_stock`) | ambas coinciden |
| **DW-INV-C03** | Cabecera: fecha, vendedor, **código y nombre del cliente**, **sucursal**, empresa, comentario | `cotejarCampos` → 0 diffs |
| **DW-INV-C04** | **Líneas**: cód. producto, producto, **Estructura** | 1:1 con lo enviado |
| **DW-INV-C05** | 📦 **Cantidad por ubicación**: `Depósito` y `Exhibición` por separado | cada una en su columna, **sin sumarlas ni mezclarlas** |
| **DW-INV-C06** | **Lote** y **Fecha expiración** por línea | exactos (`nu_batch` / `da_expiration` en BD) |
| **DW-INV-C07** | 🔗 **`Ver Pedido Relacionado`** | si el móvil generó pedido desde el inventario, enlaza al pedido correcto; si no, ausente o vacío (no error) |
| **DW-INV-C08** | Estatus | coincide con la UI (⚠ no interpretar `st_*` con el catálogo `statuses`) |
| **DW-INV-C09** | **Coordenada** | ⚠ **no es texto visible**: vive en el HTML del mapa. Buscarla ahí y quedarse con la variante de **más decimales** (la otra es el centrado del mapa, truncada) |

**Datos reales** (`el_valle-20260728`): **Ref 2** — ABASTOS Y CARNICERIA HERMANOS FLORES CA ·
`C0051` ALAS DE POLLO · **5 PIEZA en Exhibición** · lote `LOTE-QA-INV728` · venc. `31/12/2026`.

---

## FILTROS (`F##`)

| ID | Filtro | PASS | Nivel |
|----|--------|------|-------|
| **DW-INV-F01** | `# Ref` existente | 1 fila | 🔴 |
| **DW-INV-F02** | `# Ref` inexistente | 0 filas, sin error | 🔴 |
| **DW-INV-F03** | `Limpiar` | vuelve al total | 🔴 |
| **DW-INV-F04** | Vendedor | conteo == BD | 🔴 |
| **DW-INV-F05** | Rango de fechas | ninguno fuera del rango | 🔴 |
| **DW-INV-F06** | Cliente | solo ese cliente | 🟡 |
| **DW-INV-F07** | Status | solo ese estatus | 🟡 |
| **DW-INV-F08** | Tiene Adjunto | coherente | 🟢 |
| **DW-INV-F09** | Vendedor + fechas | intersección | 🟡 |

---

## MUESTREO BD ↔ WEB (`M##`)

```sql
SELECT cs.id_client_stock, cs.co_client_stock, cs.co_client, cs.da_client_stock, cs.st_client_stock
FROM client_stock cs ORDER BY cs.id_client_stock DESC LIMIT 30;
-- líneas (⚠ stock_history tiene 300k+ filas: filtrar SIEMPRE por co_client_stock)
SELECT co_client_stock, count(*) n FROM client_stock_detail GROUP BY co_client_stock;
```

| ID | Verifica |
|----|----------|
| **DW-INV-M01** | Los inventarios de BD aparecen en la lista |
| **DW-INV-M02** | Cliente y fecha de la lista == BD |
| **DW-INV-M03** | En **5 detalles al azar**: nº de líneas y **cantidades por ubicación** == BD |
| **DW-INV-M04** | **Lote y fecha de expiración** llegaron íntegros donde el móvil los mandó |
| **DW-INV-M05** | **Consistencia lista ↔ detalle** |

⚠ **Cuidado con `stock_history` (300k+ filas):** nunca consultarla sin filtro. Filtrar por
`co_client_stock` o por rango de fechas acotado, o la consulta se cuelga.

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica |
|----|----------|
| **DW-INV-D01** | Paginación *(⚠ si hay pocos inventarios → `WEB-N/A` por falta de datos, no defecto)* |
| **DW-INV-D02** | Orden por `# Ref` (numérico) y por fecha |
| **DW-INV-D03** | Selector `Columnas` |
| **DW-INV-D04** | Lista vacía → mensaje, sin error |
| **DW-INV-D05** | El mapa del detalle **no bloquea** la lectura si no carga (es recurso externo) |

---

## Veredictos y ledger

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-N/A`
⚠ `WEB-CALC-MISMATCH` **casi no aplica**: no hay importes. Se usa solo si alguna vista totalizara unidades
y la suma no cuadrara.

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"inventarios","caso":"DW-INV-C05","ref":"2","marca":"WEB-OK","ms":0}
```
