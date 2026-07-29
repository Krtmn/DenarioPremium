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

---

## MUESTREO BD ↔ WEB (`M##`) — el bloque que más defectos encuentra

Tomar **20–30 cobros históricos**, no solo los de la corrida, **cubriendo los 3 `co_type`**:

```sql
SELECT c.id_collection, c.co_collection, c.co_type, c.co_client, c.co_currency,
       c.nu_amount_total, c.nu_amount_final, c.nu_amount_igtf, c.id_deposit, c.da_collection,
       s.na_status AS estatus_real
FROM collection c
LEFT JOIN LATERAL (SELECT ts.* FROM transaction_statuses ts
                   WHERE ts.co_transaction = c.co_collection
                   ORDER BY ts.da_transaction_statuses DESC LIMIT 1) ts ON true
LEFT JOIN statuses s ON s.id_status = ts.id_status
ORDER BY c.id_collection DESC LIMIT 30;
```

| ID | Verifica |
|----|----------|
| **DW-COB-M01** | Los 30 aparecen en la lista (rango de fechas que los abarque) |
| **DW-COB-M02** | `Monto cobrado` de la lista == `nu_amount_total` de BD, en los 30 |
| **DW-COB-M03** | **Estatus** de la web == `estatus_real` del query (⚠ **no** `st_collection` contra el catálogo) |
| **DW-COB-M04** | 🧮 En **5 detalles por cada `co_type`**: los cálculos del bloque `C##` a escala |
| **DW-COB-M05** | 💎 **Consistencia lista ↔ detalle** en TODOS los muestreados: `Total por cobrar` de la fila == `Total Monto a pagar` de la cabecera del detalle |
| **DW-COB-M06** | Todo cobro con `id_deposit` no nulo ofrece `Consultar Depósito`, y el depósito lo incluye |

> 💎 **`M05` es el caso estrella.** Así se encontró `COB-RET-TOTAL-CERO`: la lista decía 12,00 y el detalle
> 0,00. Aplicado a 30 registros —y sobre todo a **todos los de `co_type=2`**— destapa cualquier otra
> divergencia de presentación del mismo tipo.

---

## COMPORTAMIENTO (`D##`)

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-COB-D01** | **Paginación** (la lista trae 50 por página) | pág. 2 trae filas distintas, sin repetir ni saltar |
| **DW-COB-D02** | **Orden por `# Ref`** | ordena como **número**, no como texto |
| **DW-COB-D03** | **Orden** por `Monto cobrado` y por `Fecha Cobro` | numérico y cronológico correctos |
| **DW-COB-D04** | Selector **`Columnas`** (la lista tiene 18 únicas) | ocultar/mostrar no descoloca los datos |
| **DW-COB-D05** | Lista **vacía** | mensaje de vacío, sin error |
| **DW-COB-D06** | 🔴 **El `<select>` "Estatus del Cobro" de la fila NO se toca** | documentar como decisión: es control de **escritura** en producción |

### 📎 Descarga de adjuntos (`DW-COB-A##`) — probado, funciona

Aplica a **todo módulo con adjuntos** (cobros, devoluciones, depósitos, inventarios, clientes potenciales,
visitas). Receta completa y oráculo en `../web-selectors/_comunes.md`.

| ID | Verifica | PASS cuando |
|----|----------|-------------|
| **DW-COB-A01** | `Descargar adjuntos` **dispara una descarga** | el evento `download` se captura (medido: **1,2 s**) y `download.failure()` es `null` |
| **DW-COB-A02** | El nombre del archivo sigue el patrón | `cobro_<ref>.zip` |
| **DW-COB-A03** | **Es un ZIP real**, no una página de error | magic bytes `PK\x03\x04` y tamaño > 0 |
| **DW-COB-A04** | 🔑 **El contenido cuadra con la BD** | nº de entradas == `transaction_image` **+** `transaction_files` de esa transacción. ⚠ **Contar solo `transaction_files` da falso negativo** (para el cobro 119: 1 en la tabla, **3 en el ZIP**) |
| **DW-COB-A05** | Los **nombres** de las entradas == los de la BD | `119_0.jpeg`, `119_1.jpeg`, `119_0.pdf` |
| **DW-COB-A06** | Transacción **sin adjuntos** | ⚠ definir el esperado: ¿ZIP vacío, mensaje, o botón deshabilitado? Si el botón ni aparece → correcto, no defecto |
| **DW-COB-A07** | `Ver adjuntos` abre el visor | sin romper la vista (no descargar masivamente) |

🔴 **Borrar el ZIP al terminar cada caso**: contiene **adjuntos reales de un cliente productivo**.
Nunca dejarlo en disco ni commitearlo.

> ℹ En `el_valle` `cloudAttachments=false` (adjuntos en el servidor local, no en nube) y aun así la descarga
> funciona. En un cliente con `cloudAttachments=true` conviene re-verificar: la ruta de origen cambia.

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
