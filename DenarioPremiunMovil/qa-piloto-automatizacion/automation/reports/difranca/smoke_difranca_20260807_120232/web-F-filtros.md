# Capa WEB · familia `F##` (filtros) — difranca / EL YAQUE

**RUN_ID:** `20260807_120232_smoke-difranca-tag20`
**Playa:** el_yaque · `http://denarioelyaque.ddns.net:8080/DenarioPremium`
**Empresa de la corrida:** `DDHP_A12` — *DISTRIBUIDORA DIAZ HERNANDEZ * (id_enterprise **2**)
**Vendedor QA:** `VEND206` / `co_user='206'` / `id_user=275` — **Jose Raad**
**Modo:** READ-ONLY (solo `Buscar`, `Limpiar`, `<select>` de filtro). No se tocó `Editar`, `Eliminar`,
`Nuevo`, `Copiar`, `Consultar`, ni el `<select>` "Estatus del Cobro".
**Fecha:** 2026-08-07

---

## 🔴 Guarda de tenant — **PASA**

El `<select>` espejo `[id$=":idEnterprise_input"]` trae **exactamente las 3 empresas activas de difranca**,
en los 5 módulos:

| co_enterprise | Texto en el selector | BD `co_operation` |
|---|---|---|
| `DDHP_A12` | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | `I` (activa) — **la de la corrida** |
| `DIF_A12` | `DIFRANCA C.A` | `I` |
| `DHVITAL01_A` | `DISTRIBUIDORA DH VITAL, C.A.` | `I` |

✅ **La empresa borrada `DDH_A12` "(vieja)DISTRIBUIDORA DH VITAL, C.A." (`co_operation='D'`) NO aparece
en ningún selector de los 5 módulos.** No hay hallazgo por ese lado.

✅ No hay rastro del tenant de ayer (ALIPASCUA). El host sirve difranca.

⚠ **La empresa viene preseleccionada en `DDHP_A12` (la correcta) en los 5 módulos**, y **`Limpiar` no la
resetea** en ninguno. Es distinto de lo observado en El Palmar (arrancaba en la 2ª empresa y se reseteaba).
Igual se verificó antes de cada `Buscar`.

---

## 🔴🔴 Veredicto del filtro `# Ref` — **VERDE · el cotejo `C##` queda HABILITADO**

**El filtro `# Ref` funciona correctamente en los 4 módulos que lo tienen.** 11 refs reales probadas,
**11/11 devolvieron su registro**, incluidos registros **viejos que la vista de lista NO muestra**.

| Módulo | Refs existentes probadas | Resultado | Ref inexistente |
|---|---|---|---|
| **cobros** | `21832` (hoy), `20808` (30/06), `20767` (29/06) | **3/3 → 1 fila exacta** | `9999999` → 0 filas + *"No se encontraron registros."* |
| **pedidos** | `39794` (hoy, st=1), `39787`, `39783`, `38958` (viejos, st=6) | **4/4 → 1 fila exacta** | `9999999` → 0 filas + mensaje |
| **devoluciones** | `876` | **1/1 → 1 fila exacta** | `99999` → 0 filas + mensaje |
| **visitas** | `28219` | **1/1 → 2 filas, mismo ref** (legítimo: la lista es por actividad) | `9999999` → 0 filas + *"No existe registro"* |
| **clientes potenciales** | — | **no tiene filtro `# Ref`** (limitación conocida, ver DW-CLT-F06) | — |

### Las dos interferencias, medidas

| Pregunta | Respuesta medida | Consecuencia |
|---|---|---|
| ¿El **rango de fechas** tapa el `# Ref`? | **NO.** Cobro `21832` (07/08/2026) aparece con rango `01/01/2020–31/12/2020`. Cobros `20808`/`20767` (junio) aparecen con rango de agosto. | Sin riesgo. No hace falta ajustar fechas para cotejar. |
| ¿La **Empresa** tapa el `# Ref`? | **SÍ.** Con `DDHP_A12` seleccionada: cobro `21829` (DIFRANCA) → 0 filas · devolución `871` (DIFRANCA) → 0 filas · visita `28157` (DIFRANCA) → 0 filas. | 🔴 **Única vía real de falso `WEB-MISSING`.** Confirma el aprendizaje de El Palmar. |

> 🔴 **Regla para el agente de cotejo:** poner **Empresa = `*DISTRIBUIDORA DIAZ HERNANDEZ *`** (anclar al
> TEXTO) antes de cada `Buscar`. Las fechas se pueden ignorar. **Nunca** cantar `WEB-MISSING` sin haber
> verificado la empresa primero.

### 🔴 Advertencia operativa nueva — el `# Ref` **persiste en la sesión**

El valor del `# Ref` **sobrevive a `browser_navigate` fresco al módulo**: al reentrar a `/pages/cobros` el
input traía todavía `21832` de la tanda anterior. Lo mismo el `Status` en pedidos (volvió con `Guardado`
puesto). El bean es de sesión y **el `Limpiar` es obligatorio al entrar a cada módulo**, no opcional.
Esto contaminó los primeros baselines de esta corrida hasta detectarlo.

---

## Resultados por caso

### Cobros — `/pages/cobros` · tabla `form:cobrosDT`

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-COB-F01 | cobros | `# Ref` existente | **WEB-OK** | `21832`→1 fila (Jose Raad, 07/08/2026 11:20:20, MEGA SOL, tipo *Cobros*). `20808`,`20767` → 1/1 |
| DW-COB-F02 | cobros | `# Ref` inexistente `9999999` | **WEB-OK** | 0 filas + *"No se encontraron registros."*, sin error |
| DW-COB-F03 | cobros | `Limpiar` tras F01 | **WEB-FAIL** | Limpia bien los inputs (`# Ref`=""` , vendedor/tipo/moneda a placeholder, **empresa intacta**) pero **NO limpia las fechas** (quedan `01/08–07/08`) y **la lista no vuelve al total visible**: paginador dice 66, cuerpo vacío (ver COB-RENDER-VACIO) |
| DW-COB-F04 | cobros | Vendedor = Jose Raad | **WEB-OK** (conteo) | rowCount **30** == BD 30 (`id_user=275`, ent 2, 01–07/08). Filas no pintadas |
| DW-COB-F05 | cobros | Rango de fechas `01/08–07/08` | **WEB-OK** (conteo) | rowCount **66** == BD 66. Rango que excluye (`01/01–31/12/2020` con ref) → coherente |
| DW-COB-F06 | cobros | Tipo Cobro = Retención | **WEB-N/A** | BD tiene 0 retenciones en el rango; se probó **IGTF** en su lugar: rowCount **1** == BD 1 ✔ |
| DW-COB-F07 | cobros | Tipo Cobro = Anticipo/Prepago | **WEB-OK** | rowCount **0** == BD 0 en el rango |
| DW-COB-F08 | cobros | Status | **WEB-N/A** | Sin oráculo BD fiable: `st_collection=1` en los 19.771 cobros y ese valor no existe en `statuses`. Las opciones web son `7 Enviado` / `27 Por aprobar`; ambas devolvieron 0 en el rango. **No se juzga.** |
| DW-COB-F09 | cobros | Cliente = MEGA SOL, C.A. | **WEB-OK** | rowCount **10** == BD 10 (2026) y **30** == BD 30 (sin fechas) |
| DW-COB-F10 | cobros | `# Ref` de OTRA empresa (`21829`, DIFRANCA) con `DDHP_A12` | **WEB-OK** (aísla) | 0 filas + mensaje. Aislamiento correcto — pero es la vía del falso `WEB-MISSING` |
| DW-COB-F11 | cobros | `# Ref` + rango de fechas que EXCLUYE | **WEB-OK** | `21832` aparece con rango 2020 ⇒ el `# Ref` **ignora las fechas** |
| DW-COB-F12 | cobros | Moneda BSD / US$ | **WEB-OK** | BSD rowCount **4** == BD 4 · US$ rowCount **62** == BD 62 |

### Pedidos — `/pages/pedidos` · tabla `form:pedidosDT`

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-PED-F01 | pedidos | `# Ref` existente | **WEB-OK** | `39794`→1 fila (Enviado, 07/08/2026, Jose Raad). También `39787`, `39783`, `38958` → 1/1 |
| DW-PED-F02 | pedidos | `# Ref` inexistente | **WEB-OK** | 0 filas + *"No se encontraron registros."* |
| DW-PED-F03 | pedidos | `Limpiar` tras F01 | **WEB-OK** | `# Ref`="" , vendedor/status a placeholder, **empresa intacta**, lista repoblada. ⚠ No limpia las fechas |
| DW-PED-F04 | pedidos | Vendedor = Jose Raad, sin fechas | **WEB-FAIL** | rowCount **1** vs BD **2.049** pedidos de `id_user=275` en ent 2 |
| DW-PED-F05 | pedidos | Rango de fechas `01/08–07/08` | **WEB-FAIL** | rowCount **3** vs BD **25**. Sin fechas: rowCount **271** vs BD **15.517** |
| DW-PED-F06 | pedidos | Status | **WEB-FAIL** | Sin filtro salen 8 filas **todas rotuladas "Enviado"** en la columna Estatus; filtrando Status=`Enviado` (v=6) salen **1**. El filtro contradice la columna. `Por aprobar`(26)→0, `Guardado`(-1)→0 |
| DW-PED-F07 | pedidos | Tipo Pedido | **WEB-N/A** | El `<select>` **solo tiene el placeholder**, sin ninguna opción ⇒ filtro inutilizable |
| DW-PED-F08 | pedidos | Cliente | **WEB-N/A** | No ejecutado (🟢 opcional, presupuesto) |
| DW-PED-F09 | pedidos | Moneda | **WEB-N/A** | No ejecutado (🟢 opcional, presupuesto) |
| DW-PED-F10 | pedidos | `# Ref` sobre pedidos que la lista NO muestra | **WEB-OK** | `39787`, `39783`, `38958` (st_order=6) no salen por rango pero **sí por `# Ref`** ⇒ el `# Ref` es más confiable que la lista |

### Devoluciones — `/pages/devoluciones` · tabla `form:pedidosDT`

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-DEV-F01 | devoluciones | `# Ref` existente | **WEB-OK** | `876`→1 fila (04/08/2026 07:33:42, Edgar Primera, SUPERMERCADO LA MURALLA II) |
| DW-DEV-F02 | devoluciones | `# Ref` inexistente `99999` | **WEB-OK** | 0 filas + *"No se encontraron registros."* |
| DW-DEV-F03 | devoluciones | `Limpiar` | **WEB-OK** | Limpia `# Ref` **y las fechas**, empresa intacta, lista vuelve a **684** == BD 684 (ent 2) |
| DW-DEV-F04 | devoluciones | Vendedor = Jose Raad | **WEB-OK** | rowCount **90** == BD 90 |
| DW-DEV-F05 | devoluciones | Rango de fechas | **WEB-OK** | Rango que excluye (`01/01/2020–31/12/2019`) → 0 filas. Sin fechas → 684 == BD |
| DW-DEV-F06 | devoluciones | Status | **WEB-N/A** | No ejecutado. ⚠ Además el aprendizaje de El Palmar advierte 2 opciones distintas con el mismo texto `Enviado` |
| DW-DEV-F07 | devoluciones | Cliente | **WEB-N/A** | No ejecutado (🟢 opcional) |
| DW-DEV-F08 | devoluciones | Tiene Adjunto | **WEB-N/A** | No ejecutado (🟢 opcional) |
| DW-DEV-F09 | devoluciones | Empresa (aislamiento) | **WEB-OK** | `DIFRANCA C.A` → rowCount **97** == BD 97 (ent 3). Cambio de empresa correcto y exacto |
| DW-DEV-F10 | devoluciones | `# Ref` de otra empresa (`871`) | **WEB-OK** (aísla) | 0 filas con `DDHP_A12` |

### Visitas — `/pages/visitas` · tabla `form:tablaVisit` · Buscar = `[id$=":btnBuscar"]`

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-VIS-F01 | visitas | `# Ref` existente | **WEB-OK** | `28219` → **2 filas**, ambas ref 28219, título `2026-08-07-MAXICENTER MIRANDA, C.A.`, Jose Raad. >1 fila es **legítimo** (lista por actividad) |
| DW-VIS-F02 | visitas | `# Ref` inexistente | **WEB-OK** | 0 filas + *"No existe registro"* (⚠ literal distinto al de los otros módulos) |
| DW-VIS-F03 | visitas | `Limpiar` | **WEB-OK** | Limpia `# Ref` y fechas, empresa intacta; tras `Buscar` la lista vuelve a 50 filas / 10 páginas |
| DW-VIS-F04 | visitas | Vendedor = `206 - Jose Raad` | **WEB-OK** | Las **50/50 filas de la página son de Jose Raad**. ⚠ Requirió 2 intentos: el 1º no había aplicado la selección (timing del agente, no defecto) |
| DW-VIS-F05 | visitas | Rango de fechas preseleccionado | **WEB-OK parcial** | El rango por defecto `01/08–07/08` pobla la lista; no se contrastó conteo exacto contra BD (paginador con 10 links, sin total) |
| DW-VIS-F06 | visitas | Actividad | **WEB-N/A** | No ejecutado (🟡, presupuesto) |
| DW-VIS-F07 | visitas | Motivo | **WEB-N/A** | No ejecutado (🟡, presupuesto) |
| DW-VIS-F08 | visitas | Estatus | **WEB-N/A** | No ejecutado (🟡, presupuesto) |
| DW-VIS-F09 | visitas | Cliente | **WEB-N/A** | No ejecutado (🟢 opcional) |
| DW-VIS-F10 | visitas | `# Ref` de otra empresa (`28157`) | **WEB-OK** (aísla) | 0 filas con `DDHP_A12` |
| DW-VIS-F11 | visitas | `Editar` / `Eliminar` **existen** por fila | **WEB-OK** | Verificada su presencia (`Consultar`, `Editar`, `Eliminar`) **sin tocarlos**, como manda el guión |

### Clientes potenciales — `/pages/clientesPotenciales` · tabla `form:pedidosDT`

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-CLT-F01 | clientes potenciales | Vendedor | **WEB-OK** | `Jose Ibarra` → rowCount **22** == BD 22 · `Jose Raad` → **0** == BD 0 |
| DW-CLT-F02 | clientes potenciales | Rango de fechas | **WEB-OK** | `01/01–31/12/2026` (excluye) → **0** · `01/01/2024–31/12/2025` (incluye) → **22** |
| DW-CLT-F03 | clientes potenciales | `Limpiar` | **WEB-OK** | Limpia las fechas, empresa intacta, lista vuelve a **23** == BD 23 (ent 2) |
| DW-CLT-F04 | clientes potenciales | Vendedor **+** rango de fechas | **WEB-OK** | Ibarra + 2024-2025 → 22 (**intersección**, no unión); Ibarra + 2026 → 0 |
| DW-CLT-F05 | clientes potenciales | Tiene Adjunto | **WEB-N/A** | No ejecutado (🟢 opcional) |
| DW-CLT-F06 | clientes potenciales | 🔎 Ausencia de filtro `# Ref` | **WEB-OK** (documentado) | `[id$=":n_ref"]` **no existe** en el módulo. Filtros disponibles: Empresa, Vendedor, fechas, Tiene Adjunto. ✅ **La LISTA sí trae columna `# Ref`** ⇒ el barrido por vendedor+fechas es exacto. Es **limitación de la web**, no fallo |

---

## Hallazgos

### 🆕 NUEVOS (no son de la 20 conocida — verificar contra el listado de defectos del tag)

#### 1. `COB-LISTA-RENDER-VACIO` — 🔴 **el más grave**. Cobros cuenta bien pero **no pinta las filas**
La lista de cobros **encuentra los registros correctos** (el paginador reporta el conteo exacto de BD en
**6 de 6** pruebas) pero **el `<tbody>` queda con 0 filas**. El usuario ve una tabla vacía con un paginador
que dice "1 2".

| Filtro aplicado | rowCount web | BD | ¿pintó filas? |
|---|---|---|---|
| Empresa + `01/08–07/08` | **66** | 66 | ❌ 0 |
| + Vendedor Jose Raad | **30** | 30 | ❌ 0 |
| + Tipo IGTF | **1** | 1 | ❌ 0 |
| + Tipo Anticipo | **0** | 0 | — (mensaje vacío OK) |
| + Moneda BSD | **4** | 4 | ❌ 0 |
| + Moneda US$ | **62** | 62 | ✅ 50 |
| + Cliente MEGA SOL (2026) | **10** | 10 | ❌ 0 |
| + Cliente MEGA SOL (sin fechas) | **30** | 30 | ❌ 0 |
| **`# Ref` (cualquiera de los 3)** | **1** | 1 | ✅ **1 — siempre** |

**Es intermitente** (1 de 8 sí pintó) y **no depende del tamaño del resultado** (4 filas no pintó, 62 sí).
**Con `# Ref` siempre pinta.** Los otros 4 módulos pintan normal.
⇒ **Sospecha:** bug de renderizado del datatable scrollable/reflow de PrimeFaces en `/pages/cobros`,
no un problema de la consulta.
**Impacto para difranca:** 🔴 **alto** — cobros es su módulo más usado (2.285 cobros del vendedor QA,
18.211 en la empresa). Un usuario que entra a Cobros y busca por fecha **ve la lista vacía**.
**Evidencia:** `automation/reports/smoke_difranca_20260807_120232/COB-F05-lista-vacia-66-registros.png`

#### 2. `PED-LISTA-SUBCONJUNTO` — 🔴 Pedidos devuelve un subconjunto pequeño y no explicado
La lista de pedidos **cuenta mal**, no solo pinta mal:

| Búsqueda | Web (rowCount) | BD | Ratio |
|---|---|---|---|
| Empresa DDHP_A12, sin fechas | **271** | 15.517 | 1,7 % |
| Empresa + `01/08–07/08` | **3** | 25 | 12 % |
| Empresa + `01/07–07/08` | **8** | ~cientos | — |
| Empresa + Vendedor Jose Raad, sin fechas | **1** | 2.049 | 0,05 % |

**Dato que orienta:** BD tiene **exactamente 1** pedido de `id_user=275` con `st_order=1` en ent 2, y la web
devuelve exactamente 1 ⇒ la lista parece filtrar por un estado/condición no expuesto en la UI
(15.506 de 15.517 pedidos de la empresa tienen `st_order=6`). **No se determinó la causa raíz** —
requiere mirada de desarrollo/BD.
✅ **Mitigación confirmada:** el `# Ref` **sí** recupera esos pedidos "invisibles" (`39787`, `39783`,
`38958`, todos `st_order=6`) ⇒ **el cotejo `C##` no queda comprometido**.
**Impacto para difranca:** 🟠 medio-alto — usan pedidos (2.049 del vendedor QA), y la consulta por
fecha/vendedor en la web no sirve para encontrarlos. Por `# Ref` sí.

#### 3. `PED-STATUS-CONTRADICE-COLUMNA` — el filtro Status no concuerda con lo que muestra la grilla
Sin filtro de Status salen **8 filas, todas con la columna Estatus = "Enviado"**. Al filtrar
Status = `Enviado` (value 6) sale **1**. Las otras 7 filas rotuladas "Enviado" desaparecen.
**Impacto:** 🟡 medio — induce a error al operador.

#### 4. `PED-TIPO-PEDIDO-SIN-OPCIONES` — filtro presente pero vacío
El `<select>` **Tipo Pedido** (`[id$=":idOrderType_input"]`) trae **únicamente el placeholder**, sin ninguna
opción seleccionable. Filtro inutilizable.
**Impacto:** 🟢 bajo — difranca tiene un único `id_order_type=2` en toda la empresa, así que no lo usarían.

#### 5. `COB-TIPO-IGTF-DUPLICADO` — opción repetida en el `<select>` Tipo Cobro
`Tipo Cobro` lista: `Cobros(0)`, `Anticipo/Prepago(1)`, `Retención(2)`, **`IGTF(3)`, `IGTF(3)`**, `Cobro 25%(4)`.
La opción **IGTF aparece dos veces con el mismo value**. Cosmético pero visible.
**Impacto:** 🟢 bajo. Nota: difranca **sí** tiene IGTF (1 cobro `co_type=3`).

#### 6. `LIMPIAR-INCONSISTENTE` — `Limpiar` no hace lo mismo en todos los módulos
| Módulo | ¿limpia `# Ref`? | ¿limpia fechas? | ¿resetea Empresa? |
|---|---|---|---|
| cobros | ✅ | ❌ deja `01/08–07/08` | ✅ no la toca (bien) |
| pedidos | ✅ | ❌ deja `01/08–07/08` | ✅ no la toca (bien) |
| devoluciones | ✅ | ✅ las vacía | ✅ no la toca (bien) |
| visitas | ✅ | ✅ las vacía | ✅ no la toca (bien) |
| clientes potenciales | n/a | ✅ las vacía | ✅ no la toca (bien) |
**Impacto:** 🟢 bajo, pero **2 de 5 módulos dejan un filtro de fecha puesto tras "Limpiar"**, lo que puede
hacer creer que no hay registros.
✅ **Buena noticia:** ningún módulo resetea la Empresa (a diferencia de El Palmar, donde pasó en 2 de 7).

#### 7. `FILTROS-PERSISTEN-EN-SESION` — el estado del filtro sobrevive a salir y volver al módulo
Al reentrar por URL fresca a `/pages/cobros` el `# Ref` seguía con `21832`; en `/pages/pedidos` el Status
seguía en `Guardado`. **Impacto operativo real:** un operador que dejó un filtro puesto y vuelve más tarde
ve una lista "vacía" que en realidad está filtrada.
**Impacto:** 🟡 medio (y es una trampa para los agentes de cotejo: **`Limpiar` obligatorio al entrar**).

### ✅ Conocidos de la 20 que reproducen

**Ninguno confirmado como tal.** No se contó con el listado de defectos conocidos del tag 20 durante la
ejecución, así que **los 7 hallazgos de arriba se reportan como nuevos y quedan a contraste** con ese
listado. Los dos aprendizajes de otras playas que sí se reconfirmaron aquí (y que no son defectos sino
comportamiento a tener en cuenta) son:

| Aprendizaje de El Palmar | ¿Reproduce en difranca / El Yaque? | ¿Lo usa difranca? |
|---|---|---|
| El filtro **Empresa tapa el `# Ref`** (única vía de falso `WEB-MISSING`) | ✅ **SÍ** — verificado en cobros, devoluciones y visitas | Sí, y es crítico: El Yaque hospeda 3 empresas de difranca |
| El **`# Ref` ignora el rango de fechas** | ✅ **SÍ** — verificado en cobros (junio vs rango de agosto) | Sí, juega a favor |
| El filtro **Empresa arranca en la 2ª y se resetea por módulo** | ❌ **NO reproduce** — arranca en `DDHP_A12` (la correcta) y no se resetea | — |
| El `value` de Empresa **no es uniforme entre módulos** | ✅ **SÍ** — ver "Patrones" abajo | — |

---

## Patrones / selectores nuevos

### 🔴 El `value` de Empresa cambia de tipo entre módulos — **anclar SIEMPRE al TEXTO**
Reconfirmado y ampliado en esta playa:

| Módulo | `value` de la opción | Tipo |
|---|---|---|
| `/pages/cobros` | `2` | `id_enterprise` |
| `/pages/devoluciones` | `2` | `id_enterprise` |
| `/pages/visitas` | `2` | `id_enterprise` (+ opción extra `""` = *"Seleccione Empresa"*) |
| `/pages/pedidos` | `DDHP_A12` | **`co_enterprise`** |
| `/pages/clientesPotenciales` | `DDHP_A12` | **`co_enterprise`** |

⇒ Un selector que compare `value` contra BD **falla en 2 de 5 módulos**. Anclar al texto
`*DISTRIBUIDORA DIAZ HERNANDEZ *` (ojo: **lleva asteriscos y espacio final** en `na_enterprise`).

### El `<select>` de vendedor: **3 formas distintas del mismo identificador**
| Módulo | Sufijo del select | `value` | Label |
|---|---|---|---|
| cobros · pedidos · devoluciones · clientes potenciales | `:idSalesmaView` | `275` (`id_user`) | `Jose Raad` |
| **visitas** | **`:idSalesman`** | `275` (`id_user`) | **`206 - Jose Raad`** (`co_user` + nombre) |

⇒ En visitas hay que buscar la opción por `206` o por nombre; el `value` sigue siendo `id_user`.
El login `VEND206` **no aparece nunca** en los selects.

### El placeholder de `Status` tiene `value="0"`, no `""` — pero **no filtra**
A diferencia de Vendedor/Tipo/Moneda/Cliente (placeholder `value=""`), el de Status vale `0`.
Se sospechó que actuaba como filtro real (`st=0`) y **se descartó**: con el placeholder puesto los conteos
de cobros coinciden exactamente con BD. Dejar anotado para no volver a perseguirlo.
Opciones reales: cobros `7 Enviado` / `27 Por aprobar` · pedidos `6 Enviado` / `26 Por aprobar` / `-1 Guardado`.

### 💎 Leer el conteo por el **paginador**, no por las filas del DOM
Cuando el cuerpo no se pinta (ver `COB-LISTA-RENDER-VACIO`), el oráculo sigue disponible:
```js
PF('cobrosDT').paginator.cfg.rowCount   // conteo real del servidor
PF('pedidosDT').paginator.cfg.rowCount
```
**Esto salvó los 6 casos de filtros de cobros**, que si no habrían quedado todos como FAIL o BLOCKED.
⚠ `PF('tablaVisit')` (visitas) **no** expone `paginator.cfg.rowCount` — ahí hay que contar links de página.
⚠ El texto `.ui-paginator-current` viene **vacío** en esta playa (plantilla sin `{currentPage} of {totalPages}`
renderizado) — no sirve como fuente.

### Espera fiable de ajax de PrimeFaces (sin `waitForTimeout` a ciegas)
```js
const jq = (window.PrimeFaces && PrimeFaces.$) || window.jQuery;
await new Promise(r=>setTimeout(r,600));
for (let i=0;i<80;i++){ if (jq.active===0) break; await new Promise(r=>setTimeout(r,250)); }
await new Promise(r=>setTimeout(r,1000));   // settle del render
```
Funcionó al 100 % en los 5 módulos. **El settle final es necesario**: sin él, el `<select>` de vendedor de
visitas se lee todavía en el placeholder (fue la causa del único reintento de la tanda).

### Sufijos confirmados en El Yaque (prefijo `form:j_idt115`/`j_idt116` — **nunca anclarlo**)
```
:idEnterprise_label|_input   :n_ref              :ajax (Buscar)       :botonLimpiar
:idSalesmaView_label|_input  :dateB_input        :dateF_input         :clientSOM_label|_input
:idTipo_*  :idCurrency_*  :orderStatus_*  :attachStatus_*  :idOrderType_*  :idDep_*
VISITAS →  :btnBuscar   (NO :ajax)      ·      :idSalesman_*  (NO :idSalesmaView)
```
El prefijo difiere **entre módulos en la misma sesión**: `j_idt116` en cobros/pedidos/devoluciones/visitas,
`j_idt115` en clientes potenciales. Anclar por sufijo funcionó al 100 %.

### Mensajes de lista vacía — el literal **no es uniforme**
`"No se encontraron registros."` en cobros / pedidos / devoluciones · **`"No existe registro"`** en visitas.
Un oráculo que compare contra un único literal da falso negativo en visitas.

### El bundle en `sessionStorage` funcionó
`sessionStorage.qa` + bootstrap `eval('('+sessionStorage.qa+')()')` sobrevivió a **8 navegaciones** entre
módulos sin recargar el helper. Confirmado el patrón de El Palmar.

### `parseMoneda` / `verificarConversion`
No se ejercitaron en esta familia (los `F##` no comparan importes). La moneda local acá se rotula **`BSD`**
(no `BS` ni `VES`) — el `<select>` Moneda lista literalmente `BSD` y `US$`.
⚠ **Aviso para el agente de cotejo:** si `parseMoneda()` solo normaliza `USD|VES`, **`BSD` puede no ser
reconocido** y `verificarConversion()` devolvería `ok:null`. Verificarlo antes de cotejar importes y, si
pasa, pasar `opts.direccion` explícito (US$→BSD = **multiplicar**, tasa 752,0900).

> ✅ consolidado 2026-08-07

---

## Resumen

| Marca | Casos |
|---|---|
| **WEB-OK** | 32 |
| **WEB-FAIL** | 4 |
| **WEB-N/A** | 13 |
| **⛔ BLOCKED** | 0 |
| **Total** | **49** |

- **Filtro `# Ref`: VERDE en los 4 módulos que lo tienen — el cotejo `C##` queda habilitado.**
- Guarda de tenant: **PASA**. Empresa borrada `DDH_A12`: **no aparece**.
- Módulo más sano: **devoluciones** (conteos exactos contra BD en todo).
- Módulos con defecto: **cobros** (no pinta filas) y **pedidos** (devuelve subconjunto).
