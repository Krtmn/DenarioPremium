# Reporte de Facturaciones — validación en El Yaque

> 🔴 **DOCUMENTO SUPERADO — NO USAR SUS CONCLUSIONES.**
> QA aportó el 2026-08-14 el criterio real del reporte (*cobradas = solo `invoice`; pendientes = `document_sale` con factura creada y deuda activa*), y con él **varias conclusiones de este archivo quedaron retiradas** (entre ellas "el ajuste no está desplegado en Isla Coche", "La Tortuga pierde el 73%" y el "tope de 256 filas").
> **Estatus válido: `RONDA-2-estatus-20260814.md`** (§3 lista lo retirado y por qué).

---


**Fecha:** 2026-08-13 · **Pantalla:** `/pages/facturaciones` · **Modo:** READ-ONLY
**Tenant de esa playa:** difranca · **Empresa:** DDHP_A12 (*DISTRIBUIDORA DIAZ HERNANDEZ*)
**Oráculo:** BD del cliente (GRANT read-only disponible)
**Contexto:** el reporte viene de varios ajustes por la brecha entre Profit y las tablas de Denario.

> ⚠ **Sin acceso a Profit.** Todo lo de acá es *Denario contra Denario*: valida que el reporte y la
> descarga sean fieles a lo que hay en la base. **No valida que la base refleje a Profit** — esa
> comparación sigue siendo manual del lado del equipo.

---

## Resumen

| Qué | Veredicto |
|---|---|
| **Pantalla** — ¿muestra los registros correctos? | ✅ **Sí**, salvo una asimetría con las NDB borradas |
| **Descarga** — ¿trae los registros correctos? | 🔴 **No. Trae 30 de 54.** |

---

## 1. Cómo funciona el reporte (medido, no supuesto)

| # | Regla | Evidencia |
|---|---|---|
| 1 | Se arma sobre **`document_sale`**, no sobre `invoice` | Los totales cuadran al céntimo contra `document_sale`; contra `invoice` no |
| 2 | Muestra solo tipos **FACT y NDB** | NCR (6.484 activos) y ADEL (10.326 activos) no aparecen nunca |
| 3 | El filtro *Consolidado / Facturas cobradas / Pendientes por cobrar* es por **estado de cobro** (`nu_balance`), no por tipo de documento | Con Consolidado salen ambos estados |
| 4 | **Incluye los documentos con `co_operation='D'`** | Ver §2 |

### Cotejo exacto de la vista por defecto (01–13/08/2026)

| | Web | BD | |
|---|---|---|---|
| Documentos | 18 | 18 | ✅ |
| FACT | 13 · 29.893,84 | 13 · 29.893,84 | ✅ |
| NDB | 5 · 269,97 | 5 · 269,97 | ✅ |
| **Total** | **30.163,81** | **30.163,81** | ✅ |

Sumadas las 18 filas de pantalla una a una. Cuadra al céntimo.

---

## 2. ✅ El ajuste funciona: el reporte ya NO oculta los documentos borrados

Prueba aislada — **04/09/2024**, día en que *todos* los FACT/NDB del cliente están marcados
`co_operation='D'`:

| | |
|---|---|
| En BD (FACT+NDB, todos `'D'`) | **27** |
| En pantalla | **26** |

Si el reporte filtrara por `co_operation`, ese día saldría **vacío**. No sale vacío: muestra 26 de 27.

**Lectura del ajuste.** Apunta a que el reporte deje de depender del `co_operation` de Denario: si un
proceso marca `'D'` documentos que en Profit siguen vigentes, filtrarlos hacía desaparecer
facturación real. Mostrándolos igual, el reporte vuelve a parecerse a Profit **a pesar** del dato
corrupto.

> 🔴 **Es un parche en la capa de presentación, y conviene tenerlo claro:** resuelve el síntoma del
> soft-delete, pero **no puede** resolver el de los documentos que nunca llegaron a Denario — esos
> no están en ninguna tabla y ningún cambio en el reporte los va a mostrar. La inconsistencia de
> estados entre `invoice` y `document_sale` tampoco se corrige mostrando más filas.

---

## 3. 🟡 Hallazgo — asimetría entre FACT y NDB con el mismo flag de borrado

Dos pruebas aisladas, cada una en un día elegido para que el resultado sea inequívoco:

| Día | En BD | En pantalla | Conclusión |
|---|---|---|---|
| **04/09/2024** | 26 FACT `'D'` + 1 NDB `'D'` | **26** | Las FACT borradas **sí** salen |
| **27/01/2025** | 40 FACT `'I'` + 14 NDB `'I'` + 4 NDB `'D'` | **54** | Las NDB borradas **no** salen |

⇒ **El mismo `co_operation='D'` se trata distinto según el tipo de documento.** Las notas de débito
borradas quedan fuera; las facturas borradas entran.

Si el criterio del ajuste es "mostrar lo que Profit considera vigente aunque Denario lo haya
marcado borrado", la regla debería aplicar igual a las NDB. **A confirmar con desarrollo si la
diferencia es intencional.**

⚠ *Cabo suelto menor:* en la prueba semanal (01–07/09/2024) BD da 230 y la pantalla 226. Con la
regla de arriba deberían ser 224. Quedan 2 filas sin explicar; no se aisló.

---

## 4. 🔴 Defecto — la descarga NO trae los registros que muestra la pantalla

**Caso:** 27/01/2025, empresa DDHP_A12, filtro *Consolidado*.
**Botón:** `Exportar Reporte` (`title="Exportar Reporte"`) → `FacturacionTotalizada.xls`
**Evidencia:** `export_27ene2025_DDHP_A12.xls` (en esta carpeta)

| | Pantalla | Descarga |
|---|---|---|
| Documentos | **54** | **30** |
| Faltan | — | **24** |

### Los 24 que faltan, desglosados

**a) Las 14 NDB — ausencia estructural.**
El archivo se arma desde **`invoice`** (trae columnas de producto: estructura, código, cantidad,
unidad, precio base, descuento, total). Las notas de débito **no existen en `invoice`** —
verificado: de las 14 NDB del día, **0 tienen fila en `invoice`**. Por diseño del archivo, nunca
podrán salir.

⇒ **Pantalla y descarga no comparten fuente:** la pantalla lee `document_sale`, el archivo lee
`invoice`. Por eso no pueden coincidir.

**b) 10 FACT que sí tienen factura y líneas — se pierden igual.**
`0000040106`, `0000040107`, `0000040116`, `0000040117`, `0000040118`, `0000040119`, `0000040120`,
`0000040121`, `0000040122`, `0000040123`.
Las 40 FACT del día tienen fila en `invoice` **y** líneas de detalle. Aun así solo salen 30.

**El archivo tiene exactamente 256 líneas de datos.** Los 30 documentos incluidos suman 256
justas; los 10 ausentes suman otras 183. Descarta **documentos completos**, no corta a la mitad.

⇒ Apunta a un **tope de 256 filas** en la generación del archivo. El mecanismo exacto de selección
es para desarrollo con el código a la vista.

### Por qué importa

El archivo no avisa de nada: no dice que esté recortado, no trae leyenda de truncamiento, y su
cabecera de *Parámetros de Búsqueda* declara el mismo rango y empresa que la pantalla. **Quien lo
descargue para conciliar contra Profit va a creer que tiene la facturación completa del período y
le van a faltar registros** — justo el escenario que motivó estos ajustes.

---

## 5. Estado de los datos en este tenant (contexto)

difranca **no reproduce** la falla reportada de sincronización:

| Métrica | Valor |
|---|---|
| FACT/NDB activos en julio 2026 | **1.316** (no 3) |
| FACT/NDB con `co_operation='D'` en may–ago 2026 | **0** |
| Documentos `'D'` (todos) | 5.228, concentrados en ago-2024 → ene-2025 |
| `invoice` con `co_operation='D'` | **0** — el soft-delete solo ocurre en `document_sale` |

⇒ Sirve para validar la **lógica** del reporte, no para reproducir la brecha con Profit.

⚠ Los **4 documentos IGTF** marcados `'D'` este mes no vienen de Profit: los genera la app
(`co_document_sale = IGTF-<co_collection>`, `nu_document` vacío). Son otro asunto.

---

## 6. Qué falta

- **Repetir en las otras playas.** Cada una tiene otro tenant y otros datos; la regla del §3 y el
  tope del §4 deberían reproducirse, porque son de la aplicación y no del cliente.
- **Aislar las 2 filas del cabo suelto** (§3).
- **Confirmar con desarrollo** si la asimetría FACT/NDB del §3 es intencional.

## Método

Cada caso se probó eligiendo un día donde el resultado fuera inequívoco (todos borrados, o borrados
de un solo tipo), en vez de rangos grandes donde un conteo se puede explicar de varias maneras.
Los códigos de la pantalla se compararon uno a uno contra la BD; el `.xls` se parseó y se cruzaron
los documentos distintos contra los de la consulta.
