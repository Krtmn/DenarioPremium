# Smoke WEB — Módulo PEDIDOS

**Ruta:** `/pages/pedidos` · **Tabla:** `form:pedidosDT` ⚠ **compartida** · **Detalle:** `/pages/detallePedido`
**Reglas:** `../WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md` · **Modo:** 🔴 READ-ONLY

> ⚠ `form:pedidosDT` lo usan **5 módulos** y también la **tabla hija del propio detalle**.
> `verificarContexto(ctx, 'pedidos', esDetalle, playa)` **antes de leer**, siempre.

🔴 **Controles prohibidos en este módulo:** `Nuevo Pedido` y `Copiar` (por fila). Solo `Consultar`.

## Familias

| Prefijo | Qué | ¿Depende del móvil? |
|---|---|---|
| `C##` | **Cotejo** del manifiesto | sí |
| `F##` | **Filtros** | no |
| `M##` | **Muestreo BD ↔ web** | no |
| `D##` | **Comportamiento** de la web | no |

---

## COTEJO (`C##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-PED-C01** | Presencia por `# Ref` | 1 fila y coincide |
| **DW-PED-C02** | **Doble llave**: `No. de Ref.` + `Código pedido` (epoch `co_order`) | ambas coinciden con el manifiesto |
| **DW-PED-C03** | Cabecera: cliente, cód. cliente, vendedor, empresa, fecha, comentario, **fecha de despacho** | `cotejarCampos` → 0 diffs |
| **DW-PED-C04** | `¿Por Aprobar?` y `Estatus` | coherentes con BD (`st_order`) y con la UI |
| **DW-PED-C05** | **Líneas**: cód. producto, unidades, precio base, subtotal, **almacén**, **lista de precio**, unidad | cada línea cuadra 1:1 |
| **DW-PED-C06** | `Total items` == nº de líneas del detalle | igual, y == `nu_details` en BD |
| **DW-PED-C07** | 🧮 **Σ líneas == `Monto Total Pedido`** | suma exacta (tol. 0,01) |
| **DW-PED-C08** | 🧮 **Línea = cantidad × precio** (cada una) | producto exacto |
| **DW-PED-C09** | 🧮 **Conversión** con `Tasa conv.` | ⚠ **la dirección depende de la moneda**: US$→BS **multiplica** |
| **DW-PED-C10** | 🧮 **Σ conversiones de línea == `Monto conv.` de cabecera** | suma exacta |
| **DW-PED-C11** | 🧮 `Subtotal bruto` − `Descuento bonif.` == `Monto Base Pedido` | resta exacta |
| **DW-PED-C12** | Campos que la web **enriquece** (código → descripción) | ⚠ **nota, no mismatch**: `CodContado`→`CONTADO`, almacén `010`→`PRODUCTO TERMINADO`, unidad `PZA-C0051`→`PIEZA` |

**Datos reales** (`el_valle-20260728`): **Ref 437**, epoch `1785262080793`, 2 líneas —
`C0051` ×2 @4,80 = 9,60 · `C0003` ×3 @6,80 = 20,40 → **30,00 USD**; tasa **725,75** → **21.772,50 BS**.

⚠ **Los totales de cabecera comparten padre con la etiqueta** → leerlos con `__qaW.leerCabecera()`
(padre-primero), no con la regla "hoja siguiente". Afecta a `Subtotal bruto`, `Descuento bonif.`,
`Monto Base Pedido`, `Monto Base Pedido Conversion`, `Monto Total Pedido`.

---

## FILTROS (`F##`)

Método: `Limpiar` → filtrar → `Buscar` → contar → comparar contra el mismo `WHERE` en SQL → `Limpiar`.
⚠ El filtro JSF **persiste entre navegaciones**: verificar el `value` del input antes de confiar.

| ID | Filtro | PASS | Nivel |
|----|--------|------|-------|
| **DW-PED-F01** | `# Ref` existente | 1 fila, la correcta | 🔴 |
| **DW-PED-F02** | `# Ref` inexistente | 0 filas, sin error | 🔴 |
| **DW-PED-F03** | `Limpiar` tras F01 | vuelve al total | 🔴 |
| **DW-PED-F04** | Vendedor | todas del vendedor; conteo == BD | 🔴 |
| **DW-PED-F05** | Rango de fechas | ninguna fuera del rango | 🔴 |
| **DW-PED-F06** | Status | solo ese estatus | 🟡 |
| **DW-PED-F07** | Tipo Pedido | solo ese tipo | 🟡 |
| **DW-PED-F08** | Cliente | solo ese cliente | 🟢 |
| **DW-PED-F09** | Moneda (US$) | coherente | 🟢 |
| **DW-PED-F10** | Tiene Adjunto | coherente con adjuntos reales | 🟢 |
| **DW-PED-F11** | Vendedor **+** rango de fechas | **intersección**, no unión | 🟡 |

---

## MUESTREO BD ↔ WEB (`M##`)

Tomar **20–30 pedidos históricos** (no solo los de la corrida) y contrastar contra BD:

```sql
SELECT o.id_order, o.co_order, o.st_order, o.nu_details, o.nu_amount_base, o.nu_amount_total,
       o.co_client, o.co_currency, o.da_order
FROM "order" o ORDER BY o.id_order DESC LIMIT 30;   -- ⚠ "order" es palabra reservada: entre comillas
```

| ID | Verifica |
|----|----------|
| **DW-PED-M01** | Los 30 aparecen en la lista (filtrando por rango de fechas que los abarque) |
| **DW-PED-M02** | `Monto Total` de la **lista** == `nu_amount_total` de BD, en los 30 |
| **DW-PED-M03** | `Total items` == `nu_details`, en los 30 |
| **DW-PED-M04** | 🧮 En **5 detalles al azar**: Σ líneas == total, y Σ líneas == `sum(order_detail)` en BD |
| **DW-PED-M05** | **Consistencia lista ↔ detalle**: los montos de la fila == los del detalle |

> 💡 `M05` es el patrón que destapó el defecto de cobros (`Total: 0,00` en retención). Es barato y rinde:
> cualquier divergencia lista↔detalle es defecto de presentación seguro.

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-PED-D01** | **Paginación** (la lista trae 50 por página) | pág. 2 trae filas distintas, sin repetir ni saltar |
| **DW-PED-D02** | **Orden por columna** — `# Ref` (numérico) | ordena como número, **no como texto** (`10` después de `9`, no antes) |
| **DW-PED-D03** | **Orden por columna** — `Monto Total` y `Fecha` | numérico y cronológico correcto |
| **DW-PED-D04** | Selector **`Columnas`** | ocultar/mostrar respeta la selección y no descoloca los datos |
| **DW-PED-D05** | Lista **vacía** (filtro sin resultados) | mensaje de vacío, **sin error** ni tabla rota |
| **DW-PED-D06** | **Ida y vuelta** lista → detalle → volver | se conserva el filtro y la página |

---

## Veredictos y ledger

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-CALC-MISMATCH` · `WEB-N/A`
Filtro que devuelve un conjunto incorrecto → `WEB-FIELD-MISMATCH` (falla la web, no el dato).

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"pedidos","caso":"DW-PED-C07","ref":"437","marca":"WEB-OK","ms":0}
```
`F##`, `M##` y `D##` van con `"ref":null` (o la ref muestreada, en `M##`).

---

## 📎 ADJUNTOS (`A##`) — probado: la descarga del ZIP funciona

Receta completa y oráculo en `../web-selectors/_comunes.md`. Verificado end-to-end en cobros
(`cobro_119.zip`, 144 KB, 3 entradas, 1,2 s) con `page.waitForEvent('download')`.

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-PED-A01** | `Descargar adjuntos` dispara la descarga | el evento `download` se captura y `download.failure()` es `null` |
| **DW-PED-A02** | Patrón del nombre | ⚠ **descubrirlo**: en cobros es `cobro_<ref>.zip`; para pedido confirmar cuál es |
| **DW-PED-A03** | Es un ZIP real | magic bytes `PK` y tamaño > 0 |
| **DW-PED-A04** | 🔑 Contenido == BD | nº de entradas == `transaction_image` **+** `transaction_files`. ⚠ **NO** contar solo `transaction_files`: da falso negativo |
| **DW-PED-A05** | Nombres de las entradas == los de la BD | coinciden 1:1 |
| **DW-PED-A06** | ⚠ **La FIRMA no viene en el ZIP** | verificado en cobros: `transaction_signatures` tenía `119_0.jpg` y **no estaba** en el ZIP. Confirmar si acá pasa igual y **si es lo esperado** |
| **DW-PED-A07** | Transacción **sin** adjuntos | definir el esperado (¿ZIP vacío, mensaje, botón ausente?). Si el botón no aparece → correcto |
| **DW-PED-A08** | `Ver adjuntos` abre el visor | sin romper la vista |

⚠ Anclar el botón **por TEXTO** (`getByRole('button', { name: /Descargar adjuntos/i })`): su id es `j_idt*`.
⚠ En las tablas de adjuntos el filtro es `na_transaction='pedidos'` — **verificar el valor exacto**: solo se
confirmó `'cobros'`; el resto de los módulos no tenía adjuntos en la corrida de referencia.

🔴 **Borrar el ZIP tras cada caso**: contiene adjuntos reales de un cliente productivo.
