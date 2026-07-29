# Smoke WEB — Módulo COBROS

**Ruta:** `/pages/cobros` · **Tabla:** `form:cobrosDT` (única, no compartida) · **Detalle:** `/pages/detalleCobro`
**Reglas operativas:** `automation/web/WEB-RUNTIME.md` · **Selectores:** `../web-selectors/_comunes.md`
**Modo:** 🔴 **READ-ONLY** — solo `Buscar` / `Limpiar` / `Consultar`.

> Es el módulo con más cálculos de todo el smoke: conversión, retenciones IVA/ISLR, pago parcial,
> diferencias y el enlace al depósito. Y el que ramifica por `co_type`.

---

## Dos familias de casos

| Prefijo | Qué prueba | ¿Depende del móvil? | Cuándo corre |
|---|---|---|---|
| **`DW-COB-C##`** | **Cotejo**: que lo que el móvil envió llegó bien y los cálculos cuadran | **Sí** — necesita líneas de `{RUN_DIR}_bd-manifest.jsonl` | En *offset*, tras el módulo móvil de cobros |
| **`DW-COB-F##`** | **Filtros**: que la web encuentra lo que se le pide | **No** — solo necesita que existan cobros | Cualquier momento, incluso **sin dispositivo** |

⚠ Los `F##` no son decorativos: **el cotejo entero depende de que el filtro `# Ref` funcione.** Si ese filtro
está roto, todos los `C##` darían `WEB-MISSING` falso. Por eso los `F##` corren **primero**.

---

## Las 3 ramas de `co_type` — estructuras distintas, no variantes del mismo caso

| `co_type` | Tipo | Tabla de **pagos** | Tabla de **documentos** | Ojo |
|---|---|---|---|---|
| **0** | Cobro normal | ✅ con filas | ✅ con filas | el caso base |
| **1** | **Anticipo/Prepago** | ✅ con filas | ❌ **vacía / ausente** | no aplica documentos |
| **2** | **Retención** | ❌ **sin filas** | ✅ con filas + montos de retención | se salda con la retención, no con pagos |

**Esta diferencia es la causa del defecto conocido** (`DW-COB-C09`): la cabecera del detalle parece calcular
`Σ(pagos)`; en una retención no hay pagos ⇒ muestra `0,00`.

---

## Casos de COTEJO (`C##`)

Cada caso toma su registro del manifiesto (`"modulo":"cobros"`). Antes de buscar: `gatePorBD(marca_bd, {refServidor: ref})`.

| ID | Aplica a | Qué verifica | PASS cuando |
|----|----------|--------------|-------------|
| **DW-COB-C01** | todos | **Presencia**: el cobro existe en la lista filtrando por `# Ref` | 1 fila, y su `# Ref` == la del manifiesto |
| **DW-COB-C02** | todos | **Doble llave**: `No. de Ref.` en cabecera del detalle **y** `Código cobro` (epoch `co_collection`) | ambos coinciden con el manifiesto |
| **DW-COB-C03** | todos | **Cabecera**: cliente, vendedor, empresa, fecha, moneda, comentario | `cotejarCampos` → 0 diffs (fechas por día; vacío en móvil se saltea) |
| **DW-COB-C04** | todos | **Estatus**: el que muestra la web | coincide con el estatus real de BD vía `transaction_statuses` (⚠ **NO** con el catálogo `statuses` sobre `st_collection` — ver `modelo-datos-denario.md §10`) |
| **DW-COB-C05** | todos | **Conversión**: `Monto cobrado` ↔ `Monto conv.` con `Tasa conv.` | `verificarConversion` OK. ⚠ La **dirección depende de la moneda**: BS→US$ divide, US$→BS multiplica |
| **DW-COB-C06** | `co_type` 0 y 1 | **Σ pagos**: la tabla de pagos suma el monto cobrado | `verificarSuma(pagos, monto_cobrado)` OK |
| **DW-COB-C07** | `co_type` 0 y 2 | **Documentos aplicados**: nro, monto doc, saldo, monto a pagar, pago parcial | cada línea cuadra con el manifiesto |
| **DW-COB-C08** | `co_type` **2** | **Retención**: `Retención IVA` + `Retención ISLR` == neto aplicado al documento | suma exacta (tolerancia 0,01) |
| **DW-COB-C09** | `co_type` **2** | 🐞 **REGRESIÓN**: `Total Monto a pagar` de la cabecera == `nu_amount_final` | **FALLA HOY** (muestra `0,0000` con valor real `12,00`). Ver defecto `COB-RET-TOTAL-CERO` |
| **DW-COB-C10** | `co_type` **1** | **Anticipo sin documentos**: la tabla de documentos está vacía o ausente | 0 filas, y el monto sale íntegro de pagos |
| **DW-COB-C11** | si el cobro fue depositado | **Enlace al depósito**: la fila ofrece `Consultar Depósito` y lleva al depósito correcto | el depósito destino incluye este `# Ref` entre sus cobros hijos |
| **DW-COB-C12** | todos | **Diferencia**: `Diferencia cobro` == `Total por cobrar` − `Monto cobrado` | resta exacta (0,00 si cerró) |

**Datos reales disponibles hoy** (corrida `20260728_130612`, La Tortuga / COVADONGA):
`co_type=0` → **Ref 120** (472,90) y **121** (50,00) · `co_type=1` → **Ref 119** (20,00, depositado) ·
`co_type=2` → **Ref 122** (12,00; IVA 10 + ISLR 2). Tasa del día **725,75** (US$ → BS, **multiplica**).

---

## Casos de FILTROS (`F##`)

**Método uniforme:** `Limpiar` → poner el filtro → `Buscar` → leer `form:cobrosDT` → comparar contra lo esperado
(que se calcula con `query.js` sobre la misma condición) → `Limpiar`.

⚠ **Verificar el `value` del input antes de confiar en un listado:** el filtro JSF **persiste entre
navegaciones por URL**. Volver a `/pages/cobros` conserva el filtro anterior y devuelve un conjunto recortado.

| ID | Filtro | PASS cuando | Nivel |
|----|--------|-------------|-------|
| **DW-COB-F01** | **`# Ref`** con una ref existente | devuelve **exactamente 1 fila**, la correcta | 🔴 **crítico** |
| **DW-COB-F02** | **`# Ref`** con una ref inexistente (ej. `999999`) | devuelve **0 filas** y un mensaje de vacío, sin error | 🔴 **crítico** |
| **DW-COB-F03** | **Limpiar** tras F01 | la lista vuelve al total sin filtro (el input queda vacío) | 🔴 **crítico** |
| **DW-COB-F04** | **Vendedor** | todas las filas son de ese vendedor; el conteo coincide con BD | 🔴 **crítico** |
| **DW-COB-F05** | **Rango de fechas** (Inicio/Final) del día de la corrida | trae los cobros de esa fecha; ninguno fuera del rango | 🔴 **crítico** |
| **DW-COB-F06** | **Tipo Cobro** = Retención | solo cobros con `co_type=2`; conteo == BD | 🟡 módulo |
| **DW-COB-F07** | **Tipo Cobro** = Anticipo/Prepago | solo `co_type=1` | 🟡 módulo |
| **DW-COB-F08** | **Status** | solo cobros en ese estatus; contrastar con `transaction_statuses` | 🟡 módulo |
| **DW-COB-F09** | **Cliente** | solo cobros de ese cliente | 🟢 opcional |
| **DW-COB-F10** | **Depositado** | solo cobros con depósito asociado (`collection.id_deposit` no nulo) | 🟢 opcional |
| **DW-COB-F11** | **Tiene Adjunto** | coherente con los adjuntos reales | 🟢 opcional |
| **DW-COB-F12** | **Combinación** Vendedor + rango de fechas | intersección correcta, no unión | 🟡 módulo |

**Niveles:** 🔴 crítico = corre **siempre** (de él depende el cotejo) · 🟡 módulo = corre si hay presupuesto ·
🟢 opcional = solo en corridas de validación profunda de la web.

> **El oráculo de los filtros es la BD**, no el ojo: para cada filtro, la misma condición se consulta con
> `node automation/db/query.js {cliente} "SELECT count(*) ..."` y se compara contra las filas que muestra la web.
> Un filtro que devuelve **de más** es tan defecto como uno que devuelve de menos.

---

## Veredictos

`WEB-OK` · `WEB-MISSING` · `WEB-FIELD-MISMATCH` · `WEB-CALC-MISMATCH` · `WEB-N/A`
Para los `F##`, un filtro que devuelve un conjunto incorrecto es **`WEB-FIELD-MISMATCH`** (es la web la que falla,
no el dato). Si el filtro no existe en esta playa → `WEB-N/A` con el motivo.

## Ledger

```json
{"run_id":"<RUN_ID>","capa":"web","modulo":"cobros","caso":"DW-COB-C05","ref":"120","marca":"WEB-OK","ms":0}
{"run_id":"<RUN_ID>","capa":"web","modulo":"cobros","caso":"DW-COB-F01","ref":null,"marca":"WEB-OK","ms":0}
```
Los `F##` van con `"ref":null` — no cotejan un registro, prueban la web.

---

*Guión F2 · escrito sobre oráculos ya verificados en la corrida `el_valle-20260728` · 2026-07-28*
