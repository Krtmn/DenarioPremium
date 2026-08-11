# WEB funcional — familias `F##` (filtros) y `A##` (adjuntos)

**RUN_ID:** `20260806_web-funcional` · **Cliente:** el_palmar · **Playa:** isla_coche
**URL:** http://denarioislacoche.ddns.net:8080/DenarioPremium · **Usuario web:** `***` / `***`
**Fecha:** 2026-08-06 · **Modo:** 🔴 READ-ONLY (solo `Buscar` / `Limpiar` / selects de filtro / `Consultar` /
`Ver adjuntos` / `Descargar adjuntos`)
**Alcance:** 7 módulos transaccionales. Las familias `M##` y `D##` quedan para otro agente.

> Este archivo es **nuevo**: no toca `web.md` (corrida del 05/08, familia `C##`).

## Guarda de tenant — ✅ verificada antes de leer nada

| Comprobación | Resultado |
|---|---|
| `[id$=":idEnterprise_input"]` trae **CENTRAL EL PALMAR, S.A.** y **C.A. DESTILERIA YARACUY** (por TEXTO) | ✅ |
| Vendedor **266 Dilcia Duarte** existe (`value=266`; en visitas label `1276 - Dilcia Duarte`) | ✅ |
| Host = `denarioislacoche.ddns.net` en todos los módulos | ✅ |

---

## Veredicto ejecutivo

| Pregunta de la QA | Respuesta |
|---|---|
| 🔴 **¿Funciona el filtro `# Ref`?** | **SÍ — `WEB-OK` en los 6 módulos que lo tienen.** Match **exacto** (no *contains*), ref inexistente → 0 filas con mensaje limpio. **El cotejo `C##` del 05/08 se apoyó en una base sana.** ⚠ Pero con **dos trampas** documentadas abajo. |
| **¿Se descargan los adjuntos?** | **SÍ.** ZIP real (`PK 03 04`), `download.failure()` = `null`, 1,4–2,5 s. Probado en **3 módulos**: cobros, devoluciones, inventarios. |
| **¿El contenido cuadra con la BD?** | **SÍ, contra `transaction_image` + `transaction_files`.** ⚠ **NO cuadra contra `nu_attachments`**, que cuenta también la firma — y la firma **no viene en el ZIP**. |
| 🔴 **A06 (pendiente del 05/08)** | **RESUELTO: los botones aparecen siempre pero salen `disabled` cuando no hay adjuntos.** No es defecto. Verificado en 5 módulos. |
| **Defectos nuevos** | **2** (`PED-WEB-STATUS-NO-REPUEBLA`, `VIS-WEB-COORD-POR-REVISAR`) + 1 inconsistencia de `Limpiar`. |

**Conteos:** `F##` **59 casos** → 56 `WEB-OK` · 2 `WEB-FAIL` · 1 `WEB-N/A` (limitación documentada).
`A##` **26 casos** → 26 `WEB-OK` · 0 `WEB-FAIL` · 0 ⛔ BLOCKED.

---

## `F##` — Filtros

### 🔴🔴 El caso que sostiene todo el cotejo: el filtro `# Ref`

Probado con refs reales **y** con ref inexistente en los 6 módulos que ofrecen el filtro:

| Módulo | Ref probada | Resultado | Ref inexistente (`999999`) | Marca |
|---|---|---|---|---|
| cobros | `27084` | **1 fila**, `# Ref`=27084, Dilcia Duarte | 0 filas · *"No se encontraron registros."* | **WEB-OK** |
| pedidos | `13806` | **1 fila**, Enviado, 06/08 16:13 | 0 filas · idem | **WEB-OK** |
| devoluciones | `73` | **1 fila**, Enviado, 05/08 14:52 | 0 filas · idem | **WEB-OK** |
| inventarios | `17` | **1 fila**, Enviado, 05/08 15:38 | 0 filas · idem | **WEB-OK** |
| depósitos | `3` | **1 fila**, BP645, DEP-QA-0805 | 0 filas · idem | **WEB-OK** |
| visitas | `18` | **1 fila** | 0 filas · *"No existe registro"* | **WEB-OK** |
| clientes potenciales | — | **el filtro NO EXISTE** (sí la columna `# Ref`) | — | **WEB-N/A** |

**Propiedades del filtro `# Ref` (verificadas, no asumidas):**

| Prueba | Resultado | Lectura |
|---|---|---|
| `2708` con refs `27080…27089` existentes | devuelve **solo** la ref `2708` | **match EXACTO**, no *contains* → no hay riesgo de falso positivo |
| ref válida + **rango de fechas que la excluye** (julio) | **devuelve 1 fila igual** | ✅ **`# Ref` IGNORA el rango de fechas** — el cotejo no se rompe por el rango por defecto |
| ref válida + **Empresa equivocada** | **0 filas** | 🔴 **TRAMPA: Empresa SÍ tapa a `# Ref`** → falso `WEB-MISSING` si no se fija Empresa |
| texto no numérico (`abc`) | el input lo **rechaza** (queda vacío) → lista completa | correcto, no es defecto |
| `0` y `-5` | tratados como "sin filtro" → lista completa | inconsistente con `999999`→0 filas, pero **inocuo** |

> 🔴 **Conclusión operativa:** anclar el cotejo al `# Ref` es correcto, **siempre que se fije Empresa =
> CENTRAL EL PALMAR antes de `Buscar`**. El rango de fechas no hace falta ajustarlo.

### Cobros (`/pages/cobros` · `form:cobrosDT`)

Oráculo BD: `id_enterprise=1`, `da_collection >= 2026-08-01` → **41 cobros**; `id_user=266` → **36**.

| ID | Qué se probó | Resultado | Evidencia | Marca |
|---|---|---|---|---|
| DW-COB-F01 | `# Ref` = 27084 | 1 fila correcta | ver tabla anterior | **WEB-OK** |
| DW-COB-F02 | `# Ref` = 9999999 | 0 filas, sin error | *"No se encontraron registros."* | **WEB-OK** |
| DW-COB-F03 | `Limpiar` | input `n_ref` = `""`, lista → 41 | 41 web == 41 BD; Empresa **conservada** | **WEB-OK** |
| DW-COB-F04 | Vendedor = Dilcia Duarte | 36 filas, **todas** de Dilcia | 36 web == 36 BD (25 VES + 11 USD) | **WEB-OK** |
| DW-COB-F05 | Rango de fechas | 05/08→**30** · 06/08→**6** · julio→**0** · restaurado→36 | BD: 30 y 6. Ambos extremos inclusive | **WEB-OK** |
| DW-COB-F06 | Tipo Cobro = Retención | **6**, todas "Retención" | BD `co_type=2` → 6 | **WEB-OK** |
| DW-COB-F07 | Tipo Cobro = Anticipo/Prepago | **6**, todas "Anticipo/Prepago" | BD `co_type=1` → 6 | **WEB-OK** |
| DW-COB-F06b | Tipo = Cobros / IGTF / Cobro 25% | **21 / 2 / 1**, valor único en cada caso | BD `co_type` 0/3/4 → 21/2/1 | **WEB-OK** |
| DW-COB-F08 | Status | Enviado(`2`)→36 · Por aprobar(`12`)→0 | partición completa y complementaria | **WEB-OK** |
| DW-COB-F10 | Depositado | SI→**1** (con Depósito no vacío) · NO→**35** | BD `id_deposit not null` → 1 | **WEB-OK** |
| DW-COB-F11 | Tiene Adjunto | SI→**29** · NO→**7** | BD `has_attachments` → 29/7 | **WEB-OK** |
| DW-COB-F12 | Vendedor + rango de fechas | 36 (intersección, no unión) | 36 ≠ 41 ⇒ intersecta | **WEB-OK** |
| **DW-COB-F13** | ⚠ **Moneda** (el que escondió un cobro) | **USD→11 (solo USD)** · **VES→25 (solo VES)** · sin filtro→36 | BD: 11 USD + 25 VES = 36 ✅ | **WEB-OK** |

> ⚠ **El filtro Moneda quedó explícitamente descartado como causa de falsos `WEB-MISSING`:** filtra exacto
> y la suma de las dos monedas reconstruye el total. El incidente del 05/08 fue de operación (filtro puesto),
> no de producto.

### Pedidos (`/pages/pedidos` · `form:pedidosDT`)

Oráculo BD: `id_enterprise=1`, agosto → **4 pedidos** (todos USD, 1 con adjunto); `id_user=266` → 2.

| ID | Qué se probó | Resultado | Evidencia | Marca |
|---|---|---|---|---|
| DW-PED-F01 | `# Ref` = 13806 | 1 fila correcta | Enviado · 06/08 16:13 · Dilcia | **WEB-OK** |
| DW-PED-F02 | `# Ref` inexistente | 0 filas, sin error | mensaje de vacío | **WEB-OK** |
| DW-PED-F03 | `Limpiar` | `n_ref` = `""` ✅ **pero Empresa vuelve a DESTILERIA** → 0 filas | reproducido 2/2 | **WEB-OK** ⚠ |
| DW-PED-F04 | Vendedor = Dilcia | **2**, todas de Dilcia | BD → 2 | **WEB-OK** |
| DW-PED-F05 | Rango de fechas | julio→0 · agosto→4 | BD → 4 | **WEB-OK** |
| **DW-PED-F06** | **Status** | 🔴 **las 4 opciones devuelven 0 filas** con 4 pedidos "Enviado" en lista | ver defecto ⬇ | **WEB-FAIL** |
| DW-PED-F09 | Moneda | USD→4 · VES→0 | BD: 4 USD | **WEB-OK** |
| DW-PED-F10 | Tiene Adjunto | SI→1 · NO→3 | BD → 1 | **WEB-OK** |
| DW-PED-F11 | Vendedor + fechas | 2 (intersección) | ✅ | **WEB-OK** |

### Devoluciones (`/pages/devoluciones` · `form:pedidosDT`)

Oráculo BD: `id_enterprise=1`, agosto → **3** (`id_return` 71-73), 1 con adjunto.

| ID | Qué se probó | Resultado | Marca |
|---|---|---|---|
| DW-DEV-F01 | `# Ref` = 73 | 1 fila correcta | **WEB-OK** |
| DW-DEV-F02 | `# Ref` inexistente | 0 filas, sin error | **WEB-OK** |
| DW-DEV-F03 | `Limpiar` | `n_ref`=`""`, vuelve a 3, **Empresa conservada** | **WEB-OK** |
| DW-DEV-F04 | Vendedor = Dilcia | 3, todas de Dilcia (== BD) | **WEB-OK** |
| DW-DEV-F05 | Rango de fechas | julio→0 · agosto→3 | **WEB-OK** |
| DW-DEV-F06 | Status | Enviado(`3`)→3, todas "Enviado" · Por aprobar(`13`)→0 | **WEB-OK** |
| DW-DEV-F08 | Tiene Adjunto | SI→1 · NO→2 (== BD) | **WEB-OK** |
| DW-DEV-F09 | Vendedor + fechas | intersección correcta | **WEB-OK** |

> ✅ **Resuelta la duda del guión sobre los "dos `Enviado`" (`8` y `23`):** ese par aparece **solo cuando
> Empresa = C.A. DESTILERIA YARACUY**. Con **CENTRAL EL PALMAR** el combo se repuebla a **`3` Enviado / `13`
> Por aprobar**, sin duplicado ⇒ **no hay ambigüedad al filtrar en el tenant de la corrida**. El duplicado es
> un problema de **datos del catálogo `statuses` de la empresa 2**, no del filtro. Ver tabla de estatus abajo.

### Inventarios (`/pages/inventarios` · `form:pedidosDT`)

Oráculo BD: `id_enterprise=1`, agosto → **2** (`id_client_stock` 15 y 17).

| ID | Qué se probó | Resultado | Marca |
|---|---|---|---|
| DW-INV-F01 | `# Ref` = 17 | 1 fila correcta | **WEB-OK** |
| DW-INV-F02 | `# Ref` inexistente | 0 filas, sin error | **WEB-OK** |
| DW-INV-F03 | `Limpiar` | `n_ref`=`""` ✅ **pero Empresa vuelve a DESTILERIA** | **WEB-OK** ⚠ |
| DW-INV-F04 | Vendedor = Dilcia | 1 (ref 17) | **WEB-OK** |
| DW-INV-F05 | Rango de fechas | julio→0 · agosto→2 | **WEB-OK** |
| DW-INV-F07 | Status | Enviado(`4`)→2 · Por aprobar(`14`)→0 | **WEB-OK** |
| DW-INV-F08 | Tiene Adjunto | SI→ref 15 · NO→ref 17 (== BD) | **WEB-OK** |
| DW-INV-F09 | Vendedor + fechas | intersección correcta | **WEB-OK** |

### Depósitos (`/pages/depositos` · `form:pedidosDT`)

Oráculo BD: `id_enterprise=1`, agosto → **1** (`id_deposit` 3).

| ID | Qué se probó | Resultado | Marca |
|---|---|---|---|
| DW-DEP-F01 | `# Ref` = 3 | 1 fila (BP645 · DEP-QA-0805) | **WEB-OK** |
| DW-DEP-F02 | `# Ref` inexistente | 0 filas, sin error | **WEB-OK** |
| DW-DEP-F03 | `Limpiar` | `n_ref`=`""`, Empresa conservada | **WEB-OK** |
| DW-DEP-F04 | Vendedor = Dilcia | 1 | **WEB-OK** |
| DW-DEP-F05 | Rango de fechas | julio→0 · agosto→1 | **WEB-OK** |
| DW-DEP-F06 | Status | Enviado(`5`)→1 · Por aprobar(`15`)→0 | **WEB-OK** |
| DW-DEP-F07 | Moneda | VES→1 · USD→0 | **WEB-OK** |
| DW-DEP-F08 | Vendedor + fechas | intersección correcta | **WEB-OK** |

*Depósitos **no tiene** filtro `Tiene Adjunto`.*

### Visitas (`/pages/visitas` · `form:tablaVisit`)

| ID | Qué se probó | Resultado | Marca |
|---|---|---|---|
| DW-VIS-F01 | `# Ref` = 18 | 1 fila | **WEB-OK** |
| DW-VIS-F02 | `# Ref` inexistente | 0 filas · *"No existe registro"* | **WEB-OK** |
| DW-VIS-F03 | `Limpiar` | `n_ref`=`""`, vuelve a 3, Empresa conservada | **WEB-OK** |
| DW-VIS-F04 | Vendedor = `1276 - Dilcia Duarte` | 1 fila, "Dilcia Duarte" | **WEB-OK** |
| DW-VIS-F05 | Rango de fechas | julio→0 · agosto→3 | **WEB-OK** |
| **DW-VIS-F10** | **Coordenadas** | 🔴 `Por Revisar`→**3** filas cuyo `Geo` real es `Falta Coordenada (Sucursal)` | **WEB-FAIL** |
| DW-VIS-D06 | 🔴 `Editar` / `Eliminar` por fila | **presentes** en las 3 filas — **NO se clickearon** (decisión de seguridad) | **WEB-OK** (solo presencia) |

### Clientes potenciales (`/pages/clientesPotenciales` · `form:pedidosDT`)

| ID | Qué se probó | Resultado | Marca |
|---|---|---|---|
| DW-CLT-F01 | Vendedor = Dilcia | 1 fila (ref 31) | **WEB-OK** |
| DW-CLT-F02 | Rango de fechas | julio→0 · agosto→1 | **WEB-OK** |
| DW-CLT-F03 | `Limpiar` | lista vuelve a 1, Empresa conservada | **WEB-OK** |
| DW-CLT-F04 | Vendedor + fechas | intersección correcta | **WEB-OK** |
| DW-CLT-F05 | Tiene Adjunto | SI→0 · NO→ref 31 (== BD) | **WEB-OK** |
| DW-CLT-F06 | **Ausencia de filtro `# Ref`** | confirmada: **no existe `n_ref`** en el panel, aunque **la lista sí trae la columna `# Ref`** | **WEB-N/A** (limitación, no defecto) |

---

## `A##` — Adjuntos

### Lo que efectivamente se descargó (y se borró)

| Caso | Módulo · Ref | Archivo | Tamaño | Magic | Entradas | `failure()` | Tiempo |
|---|---|---|---|---|---|---|---|
| DW-COB-A01…A05 | cobros **27084** | `cobro_27084.zip` | 260.899 B | `50 4B 03 04` | **3** | `null` | **1.529 ms** |
| DW-COB-A01b | cobros **27073** | `cobro_27073.zip` | 169.442 B | `50 4B 03 04` | **2** | `null` | **2.451 ms** |
| DW-DEV-A01…A05 | devoluciones **72** | `devolucion_72.zip` | 124.435 B | `50 4B 03 04` | **2** | `null` | **2.270 ms** |
| DW-INV-A01…A05 | inventarios **15** | `inventario_15.zip` | 169.430 B | `50 4B 03 04` | **2** | `null` | **1.453 ms** |

🔴 **Los 4 ZIP fueron borrados**, y también las copias que Playwright deja automáticamente en
`DenarioPremiunMovil/.playwright-mcp/`. Verificación final: **0 archivos residuales**. Ninguno fue abierto.

### 🔑 El oráculo correcto — `nu_attachments` NO sirve para el ZIP

| Ref | `nu_attachments` (BD) | `transaction_image` | `transaction_signatures` | **Entradas del ZIP** | ¿Cuadra? |
|---|---|---|---|---|---|
| cobro **27084** | **4** | 3 | 1 | **3** | ✅ contra `image` · ❌ contra `nu_attachments` |
| cobro **27073** | **3** | 2 | 1 | **2** | ✅ contra `image` · ❌ contra `nu_attachments` |
| devolución **72** | — | 2 | 1 | **2** | ✅ contra `image` |
| inventario **15** | — | 2 | 0 | **2** | ✅ contra `image` |

> 🔴 **Hallazgo de método:** `nu_attachments` = `transaction_image` **+** `transaction_signatures`, y **la firma
> nunca viaja en el ZIP**. Contrastar el ZIP contra `nu_attachments` produce un **falso `WEB-FAIL` de −1
> sistemático**. La tabla de "verdad de BD" del prompt (27084=4, 27073=3…) es la cuenta de la **app**, no la del
> **ZIP**. **Oráculo válido: `transaction_image` + `transaction_files`** — exactamente lo que dice el guión.
> En esta BD `transaction_files` = **0**, así que hoy el ZIP == `transaction_image`. Confirmado 4/4.

**Nombres (DW-\*-A05): coinciden 1:1 con la BD, sin excepción.**

| Ref | BD imágenes | BD firma | ZIP |
|---|---|---|---|
| 27084 | `27084_0.jpeg` `27084_1.jpeg` `27084_2.jpeg` | `27084_0.jpg` | `27084_0.jpeg` `27084_1.jpeg` `27084_2.jpeg` — **firma ausente** ✅ |
| 27073 | `27073_0.jpeg` `27073_1.jpeg` | `27073_0.jpg` | `27073_0.jpeg` `27073_1.jpeg` — **firma ausente** ✅ |
| 72 | `72_0.jpeg` `72_1.jpeg` | `72_0.jpg` | `72_0.jpeg` `72_1.jpeg` ✅ |
| 15 | `15_0.jpeg` `15_1.jpeg` | — | `15_0.jpeg` `15_1.jpeg` ✅ |

**Patrón de nombre del ZIP (DW-\*-A02) — descubierto por módulo:**
`cobro_<ref>.zip` · `devolucion_<ref>.zip` · `inventario_<ref>.zip` → **`{modulo_singular}_{ref}.zip`**.

### 🔴🔴 `A06` — RESUELTO: la duda que quedó abierta del 05/08

**Pregunta:** los botones `Descargar adjuntos` / `Ver adjuntos` aparecían en **todos** los detalles, incluso en
uno con **0 adjuntos** en BD. ¿ZIP vacío? ¿mensaje? ¿botón deshabilitado?

**Respuesta con evidencia — los botones SIEMPRE se renderizan, pero salen `disabled` cuando no hay adjuntos.**

| Módulo | Ref sin adjuntos (BD: 0 filas en `transaction_image`/`files`/`signatures`) | `Descargar adjuntos` | `Ver adjuntos` |
|---|---|---|---|
| cobros | **27079** | presente · **`disabled=true`** | presente · **`disabled=true`** |
| devoluciones | **73** | presente · **`disabled=true`** | presente · **`disabled=true`** |
| inventarios | **17** | presente · **`disabled=true`** | presente · **`disabled=true`** |
| depósitos | **3** | presente · **`disabled=true`** | presente · **`disabled=true`** |
| clientes potenciales | **31** | presente · **`disabled=true`** (rotulado `Descargar Adjunto`) | presente · **`disabled=true`** |

**Control negativo:** se forzó el click sobre el botón deshabilitado del cobro 27079 → **ningún evento
`download` en 20 s, ningún ZIP vacío, ningún mensaje de error, la vista no se rompió.**
**Control positivo:** en 27084/27073/72/15 (con adjuntos) el mismo botón está `disabled=false` y descarga.

> ✅ **Veredicto A06: comportamiento CORRECTO, no es defecto.** El esperado queda fijado como
> **"botón presente pero deshabilitado"**. La observación del 05/08 fue incompleta: registró la *presencia*
> del botón pero no su atributo `disabled`. **El pendiente se cierra.**

### `A07` — `Ver adjuntos` abre el visor

| Qué | Evidencia |
|---|---|
| Mecanismo | `onclick` → **`PF('galeria').show()`** (widget PrimeFaces `galeria`, `<div role="dialog" aria-modal="true">`) |
| ¿Abre? | **Sí.** Tras el click: `aria-hidden="false"`, se inyecta la máscara `#form:j_idt376_modal`, y el diálogo **intercepta los eventos de puntero** (modal activo) |
| Contenido | Exactamente **las 3 imágenes del cobro 27084**: `…/denario/resources/images/cobros/27084_0.jpeg`, `_1.jpeg`, `_2.jpeg` — **las mismas del ZIP y de la BD** |
| ¿Rompe la vista? | **No.** Se mantiene en `/pages/detalleCobro` con `No. de Ref.: 27084`; al cerrar (`hide()`) `aria-hidden` vuelve a `true` y la máscara desaparece |
| Marca | **WEB-OK** |

⚠ **Trampa de automatización:** el diálogo `galeria` lleva la clase **`ui-hidden-container`**, por lo que
`el.offsetParent !== null` da **`false` aunque el visor esté abierto**. Detectarlo por `offsetParent` produce
un **falso "el visor no abre"**. Anclar a **`aria-hidden`** + presencia de `#<id>_modal`.

---

## Hallazgos

### 🔴 D-01 · `PED-WEB-STATUS-NO-REPUEBLA` — el filtro **Status** de Pedidos nunca encuentra nada

| | |
|---|---|
| **Módulo** | Pedidos (`/pages/pedidos`) · caso `DW-PED-F06` |
| **Severidad** | **Alta** — el filtro es inutilizable en la empresa principal |
| **Síntoma** | Con **4 pedidos "Enviado"** visibles en la lista, filtrar por `Status` devuelve **0 filas en las 4 opciones** (`Enviado`, `Por aprobar`, `Enviado`, `Guardado`) |
| **Causa raíz** | El combo `orderStatus` **no se repuebla al cambiar Empresa**: conserva el juego de la empresa por defecto (**DESTILERIA YARACUY**) |

**Evidencia decisiva** — carga fresca (Empresa = DESTILERIA) → cambio a CENTRAL EL PALMAR → `Buscar`:
el combo **queda idéntico** en los 3 momentos: `6 Enviado`, `16 Por aprobar`, `21 Enviado`, `-1 Guardado`.

Contraste contra el catálogo `statuses` (es **por empresa Y por tipo de transacción**):

| `id_status` | `na_status` | `id_enterprise` | `co_transaction_type` |
|---|---|---|---|
| **1** | Enviado | **1** (EL PALMAR) | ped ← **el que tienen los 4 pedidos** |
| **11** | Por aprobar | **1** | ped |
| 6 · 21 | Enviado | **2** (YARACUY) | ped ← **los que ofrece el combo** |
| 16 | Por aprobar | **2** | ped |

BD: los pedidos 13803-13806 tienen `id_status = 1`. El combo **nunca ofrece el `1`** ⇒ **ninguna opción puede
coincidir jamás**.

**Aislado a Pedidos.** Los otros 4 módulos **sí** repueblan al cambiar Empresa y su filtro Status funciona:

| Módulo | Combo con Empresa 2 (fresco) | Combo tras poner EL PALMAR | ¿Filtra bien? |
|---|---|---|---|
| **pedidos** | 6 / 16 / 21 / -1 | **6 / 16 / 21 / -1 (NO cambia)** | ❌ **0 filas siempre** |
| devoluciones | 8 / 18 / **23** | 3 / 13 | ✅ 3 filas |
| inventarios | 9 / 19 / 24 | 4 / 14 | ✅ 2 filas |
| cobros | (4 opciones) | 2 / 12 | ✅ 36 filas |
| depósitos | — | 5 / 15 | ✅ 1 fila |

**Repro:** `/pages/pedidos` → Empresa = CENTRAL EL PALMAR → `Buscar` (4 filas "Enviado") → `Status` = Enviado →
`Buscar` → **0 filas**.

### 🔴 D-02 · `VIS-WEB-COORD-POR-REVISAR` — el filtro Coordenadas devuelve de más

| | |
|---|---|
| **Módulo** | Visitas (`/pages/visitas`) · caso `DW-VIS-F10` |
| **Severidad** | Media |
| **Síntoma** | Las **3** visitas de agosto tienen `Geo` = **`Falta Coordenada (Sucursal)`**. El filtro `Coordenadas = Por Revisar` (`value=0`) devuelve **las 3 igual** |

| Opción | `value` | Filas | Esperado |
|---|---|---|---|
| `Por Revisar` | 0 | **3** | **0** ❌ |
| `No Realizado` | 1 | 0 | 0 ✅ |
| **`Falta Coordenada (Sucursal)`** | 2 | **3** | **3** ✅ |
| `Falta Coordenada (Destino)` · `Fuera de Rango` · `Correcto` | 3/4/5 | 0 | 0 ✅ |

Dos opciones **mutuamente excluyentes** devuelven el **mismo** conjunto ⇒ `Por Revisar` no filtra (se comporta
como "sin filtro"). Un filtro que devuelve **de más** es tan defecto como uno que devuelve de menos.
⚠ **Relacionado, no idéntico** al defecto ya conocido de `Coordenadas = No Realizado` (`playas.yaml`, playa
caribe): acá `No Realizado` da 0 **correctamente**; el que falla es `Por Revisar`.

### ⚠ D-03 · `Limpiar` no se comporta igual en los 7 módulos

`Limpiar` **siempre** vacía `n_ref` correctamente (✅ en 7/7), pero con la **Empresa** hace dos cosas distintas:

| Módulo | Empresa tras `Limpiar` | Efecto |
|---|---|---|
| **pedidos** · **inventarios** | **vuelve a C.A. DESTILERIA YARACUY** | la lista queda vacía/recortada ⇒ **falso `WEB-MISSING`** |
| cobros · devoluciones · depósitos · visitas · clientes potenciales | **conserva** CENTRAL EL PALMAR | correcto |

Reproducido 2/2 en una tanda limpia y sin diálogos de por medio.
**Impacto sobre el guión:** el oráculo *"`Limpiar` vuelve al total"* **no aplica tal cual** en pedidos e
inventarios. ⇒ **tras cada `Limpiar`, re-fijar Empresa antes del siguiente `Buscar`.**

### ⚠ D-04 · Catálogo `statuses`: dos "Enviado" para la empresa 2

`statuses` tiene, para **DESTILERIA YARACUY**, **dos filas con el mismo `na_status = 'Enviado'`** por tipo de
transacción (ped `6`/`21`, dev `8`/`23`, inv `9`/`24`). Es un problema de **datos**, no del filtro: los combos
muestran fielmente lo que hay. **En CENTRAL EL PALMAR no ocurre.** Cierra la duda abierta del guión de
devoluciones: filtrar por el literal `Enviado` **es ambiguo solo en el tenant 2**.

### ℹ D-05 · Observaciones menores

- **`# Ref` no es único en Visitas:** la lista es **por actividad** — la visita `17` ocupa **2 filas**
  (`COBRANZA` y `VENTA EN RUTA`). Filtrar por `# Ref` puede devolver legítimamente **>1 fila**: un oráculo
  *"exactamente 1 fila"* daría un falso FAIL. La ref `18` sí devolvió 1.
- **Visitas muestra 3 filas** contra **2** registros en la tabla `visit` de agosto — coherente con lo anterior
  (filas por actividad). No es discrepancia de datos.
- **`# Ref` = `0` o `-5`** se tratan como "sin filtro" (lista completa) mientras `999999` devuelve 0 filas.
  Inconsistencia menor, sin impacto.
- **Rótulo desparejo:** en clientes potenciales el botón es **`Descargar Adjunto`** (singular, A mayúscula);
  en los otros 5 módulos es **`Descargar adjuntos`**. Un selector por texto exacto **falla ahí**.
- **Diálogo de inactividad** (`¿Estas Aquí?`, 20 s) aparece sin aviso y **bloquea todos los clicks** con su
  máscara modal. Fue la causa de una tanda perdida. Se resuelve clickeando `[id$=":confirm"]` (mantener sesión).
- **Cobros pasó de 41 a 42 filas durante la corrida** (se creó un cobro mientras se leía) — evidencia viva de
  por qué **nunca** hay que anclar al índice de fila.
- **Rango de fechas por defecto** confirmado: `01/{mes}` → hoy (`01/08/2026..06/08/2026`).

---

## Patrones / selectores nuevos

### 🔴 Playwright deja una copia de cada descarga DENTRO del repo

`download.saveAs(destino)` **no evita** que el MCP guarde además una copia en
`DenarioPremiunMovil/.playwright-mcp/<nombre>.zip` (fuera de `qa-piloto-automatizacion/`, un nivel arriba).
⇒ **Borrar SIEMPRE las dos ubicaciones** tras cada caso `A##`. Riesgo real de dejar adjuntos productivos en
disco (y de que entren a git desde una carpeta no ignorada).

```powershell
Remove-Item $destino -Force
Get-ChildItem 'C:\...\DenarioPremiunMovil\.playwright-mcp' -Filter *.zip | Remove-Item -Force
```

### Sufijos estables confirmados en esta tanda

```
:n_ref  ·  :ajax (Buscar)  ·  :btnBuscar (SOLO visitas)  ·  :botonLimpiar
:idEnterprise_label/_input  ·  :idSalesmaView_label/_input  ·  :idSalesman_* (SOLO visitas)
:dateB_input / :dateF_input  ·  :idTipo_*  ·  :idCurrency_*  ·  :idDep_*  ·  :attachStatus_*
:orderStatus_*  ·  :clientSOM_*  ·  :idType_* :idMotive_* :idRol_* :idEstatus_*
:selectAttach_* :selectDispatch_* :selectCoordinadas_*  (SOLO visitas)
:consultar (por fila)  ·  :confirm (diálogo de inactividad → mantener sesión)
```

### Correcciones a `web-selectors/_comunes.md`

| Afirmación vigente | Corrección medida |
|---|---|
| *"visitas: ❌ sin FILTRO de Ref"* | ❌ **Falso: `/pages/visitas` SÍ tiene `[id$=":n_ref"]`** y funciona (ref 18 → 1 fila). La que **no** lo tiene es **clientes potenciales** |
| *"el filtro Empresa se resetea al entrar fresco a CADA módulo"* | Matiz: se resetea en la **primera** entrada de la sesión; luego puede quedar pegajoso. **La regla operativa no cambia: fijar Empresa siempre.** Y además **`Limpiar` lo resetea en pedidos e inventarios** |
| *"en devoluciones `orderStatus` trae dos `Enviado` (`8` y `23`)"* | Cierto **solo con Empresa = DESTILERIA YARACUY**. Con EL PALMAR el combo se repuebla a `3`/`13`, sin duplicado |
| *"el oráculo del ZIP son `transaction_image` + `transaction_files`"* | ✅ **Confirmado 4/4.** Agregar: **`nu_attachments` NO sirve** (incluye la firma, que no va al ZIP) |

### Recetas nuevas

**1. Esperar el fin del ajax por señal (nada de `waitForTimeout` fijo):**
```js
while (!PrimeFaces.ajax.Queue.isEmpty()) await new Promise(r=>setTimeout(r,150));
```
Sostuvo ~120 `Buscar` con 0 lecturas atrasadas. **Todos** los conteos cuadraron contra BD al primer intento.

**2. `<select>` de PrimeFaces por ÍNDICE cuando el texto es ambiguo** (dos `Enviado`):
```js
// leer sin abrir el combo:  [id$=":<campo>_input"] option  → {i, value, texto}
// elegir:  click [id$=":<campo>_label"]  →  click #<prefijo>_<i>
```
Imprescindible para distinguir opciones homónimas: por texto es **imposible**.

**3. Detectar si el visor de adjuntos abrió** (⚠ `offsetParent` miente por `ui-hidden-container`):
```js
const el = PF('galeria').jq[0];
const abierto = el.getAttribute('aria-hidden') === 'false'
             && !!document.getElementById(el.id + '_modal');
```

**4. Guardar el harness en `sessionStorage` y rehidratarlo tras cada `navigate`:**
```js
eval('('+sessionStorage.qaW+')()');   // sobrevive a navigate; el bundle en window no
```

**5. Neutralizar el diálogo de inactividad dentro del `settle`:**
```js
const d=[...document.querySelectorAll('.ui-dialog')].find(x=>x.offsetParent && /Estas Aqu/i.test(x.textContent));
if(d) d.querySelector('[id$=":confirm"]').click();
```

---

## Cobertura y límites

| Familia | Ejecutados | WEB-OK | WEB-FAIL | WEB-N/A | ⛔ BLOCKED |
|---|---|---|---|---|---|
| `F##` | 59 | 56 | 2 | 1 | 0 |
| `A##` | 26 | 26 | 0 | 0 | 0 |
| **Total** | **85** | **82** | **2** | **1** | **0** |

**No ejecutado** (fuera de presupuesto, nivel 🟢 opcional): `DW-COB-F09` (Cliente), `DW-PED-F07` (Tipo Pedido),
`DW-PED-F08`/`DW-DEV-F07`/`DW-INV-F06` (Cliente), `DW-VIS-F06/F07/F08/F09/F11/F12/F13/F14`.
El `<select>` **"Estatus del Cobro"** de la fila **no se tocó** (control de escritura en producción) —
`DW-COB-D06` documentado como decisión.

*Agente web · familias F## y A## · 2026-08-06 · read-only sobre producción*
