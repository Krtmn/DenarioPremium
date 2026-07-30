# Capa WEB — smoke globalmp · LA TORTUGA

**RUN_ID:** `20260730_094753_smoke-completo`
**Base:** `http://denariolatortuga.ddns.net:8080/DenarioPremium`
**Empresa:** **00002 COMERCIALIZADORA DE ALIMENTOS GLOBAL M&P, C.A.**
⚠ Este cliente tiene **DOS empresas** (00001 HC TRADING MARKET 2021 / 00002 GLOBAL M&P) — el `<select>` de
empresa **no** trae una sola opción, a diferencia de otros clientes. Todos los cobros de hoy son de **00002**.
**⚠ Oráculo degradado:** la BD nube `global_mp` está **sin GRANT** (0 de 184 tablas) y QA decidió correr sin ella.
El oráculo es el **volcado de la BD local del móvil** + la **coherencia interna de la web**.

---

# COBROS (revisión) — 5 cobros enviados a mano por QA el 30/07/2026

| Parámetro | Valor |
|---|---|
| Alcance | 5 cobros enviados · **READ-ONLY** (solo Consultar/Buscar/Limpiar/descarga) |
| Resultado | **3 WEB-OK · 2 WEB-CALC-MISMATCH** + 1 defecto de filtro |
| Cobro Guardado | **no buscado, no abierto** — ausente de la web, **esperado** (nunca se envió) |
| Tasa | `737,88 BS = 1 USD` en los 5 · conversión BS→USD **divide** |

## Resumen por cobro

| Ref | Marca | Campos cotejados | Diferencias |
|---|---|---|---|
| 8352 | 🔴 **WEB-CALC-MISMATCH** | cabecera 14 · doc 22 col · 1 pago · 1 descuento | conversión del descuento **×tasa** en 3 celdas |
| 8353 | 🔴 **WEB-CALC-MISMATCH** | cabecera 18 · 2 docs · 1 pago · 2 descuentos | conversión de descuento y de Dif/Faltante **×tasa** en 3 celdas |
| 8354 | ✅ WEB-OK | cabecera 16 · 2 docs · sin pagos (correcto en Retención) | ninguna |
| 8355 | ✅ WEB-OK | cabecera 14 · 2 docs (parcial ×2) · 2 pagos | ninguna |
| 8356 | ✅ WEB-OK | cabecera 14 · 2 docs · 1 pago | ninguna |

Estatus literal que muestra la WEB en los 5: **"Por aprobar"** (no se interpretó `st_collection` con el catálogo).
Diferencia cobro `0,00` en los 5.

## Aritmética explícita (verificada contra lo que pinta la web)

**8352** · `83.734,62 − 50,00 = 83.684,62` = Monto a pagar = Σ pagos ✓ · `83.684,62 / 737,88 = 113,41` ✓
· `83.734,62 / 737,88 = 113,48` ✓
· 🔴 `Monto total descuento conversión` = **36.894,00** = `50 × 737,88`. Correcto: `50 / 737,88 = 0,07`
· **La cabecera se autocontradice:** `113,48 − 36.894,00 ≠ 113,41`; solo cierra con `113,48 − 0,07 = 113,41`

**8353** · `9.000,00 + 20.000,11 = 29.000,11` = total = Σ pagos ✓
· `FF081402: 20.000,11 + 1.000,00 (retIVA) + 332,00 (retISLR) = 21.332,11` = saldo ✓
· `FF081401: 9.000,00 + 1.000,00 (Desc.) + 773,05 (Diferencia/Faltante) = 10.773,05` = saldo ✓
· `10.773,05 + 21.332,11 = 32.105,16` = Monto total base ✓ · `14,60 + 28,91 = 43,51` ✓
· `1.000/737,88 = 1,36` (retIVA conv) ✓ · `332/737,88 = 0,45` (retISLR conv) ✓
· 🔴 `Total dcto. conversion` = **737.880,00** = `1.000 × 737,88`. Correcto: `1,36`
· 🔴 `Descuento conversión` = **570.418,13** = `773,05 × 737,88`. Correcto: `1,05`

**8354 (Retención)** · `700 + 400 = 1.100` ✓ · `500 + 1.000 = 1.500` ✓ · `1.100 + 1.500 = 2.600` ✓
· `IVA total 1.200 + ISLR total 1.400 = 2.600` ✓
· conv `0,95 + 0,54 = 1,49` · `0,68 + 1,36 = 2,04` · `1,63 + 1,90 = 3,53` = **el 3,53 USD de la lista** ✓
  ⇒ criterio **"suma de conversiones redondeadas por línea"** confirmado también en web — **NO es defecto**
· `Total Monto a pagar = 0,00` — coherente: una retención no tiene pago; el 2.600 vive en IVA+ISLR

**8355** · `5.000 + 10.000 = 15.000` = total = Σ pagos `1.500 + 13.500 = 15.000` ✓
· conv `2,03 + 18,30 = 20,33` ✓

**8356** · `90.523,12 + 85.099,70 = 175.622,82` = total = pago único ✓ · conv `122,68 + 115,33 = 238,01` ✓

---

## 🔴 DW-COB-H01 — La web PINTA la conversión del descuento multiplicada por la tasa · **S1 (grave, visible, financiero)**

El defecto que en el móvil era **inocuo**, en la web es **visible**. La web **no recalcula al vuelo: pinta el
dato crudo del servidor**. Celdas exactas:

| Ref | Ubicación exacta | Muestra | Debería | Operación |
|---|---|---|---|---|
| 8352 | cabecera `Monto total descuento conversión:` | **36.894,00 USD** | 0,07 | 50 × 737,88 |
| 8352 | `form:documentosPagadosDT` fila 1, col `Total dcto. conversion` | **36.894,00** | 0,07 | idem |
| 8352 | `form:discountsDT` fila `037245`, col `Monto conversión` | **36.894,00 USD** | 0,07 | idem |
| 8353 | cabecera `Monto total descuento conversión:` | **737.880,00 USD** | 1,36 | 1.000 × 737,88 |
| 8353 | `form:documentosPagadosDT` fila `FF081401`, col `Total dcto. conversion` | **737.880,00** | 1,36 | idem |
| 8353 | `form:discountsDT` fila `FF081401`, col `Monto conversión` | **737.880,00 USD** | 1,36 | idem |
| 8353 | `form:documentosPagadosDT` fila `FF081401`, col `Descuento conversión` | **570.418,13** | 1,05 | 773,05 × 737,88 |

**Impacto:** un usuario ve **US$ 36.894,00 de descuento** en un cobro de **BS 83.684,62** (≈ US$ 113). En el
8353, **US$ 737.880,00** de descuento sobre un cobro de US$ 39,30. La propia cabecera queda incoherente.
**Error absoluto:** 36.893,93 USD (8352) · 737.878,64 + 570.417,08 USD (8353).

**Pasos para reproducir:** COBROS → `# Ref` = 8352 → Buscar → Consultar → mirar `Monto total descuento
conversión` en la cabecera y la columna `Total dcto. conversion` de la tabla de documentos.

**Causa raíz (localizada por el agente móvil en el código):** `convertirMonto()`
(`collection-logic.service.ts:2286-2299`) recibe la moneda **del documento** (rama que multiplica) en vez de la
**del cobro**. La retención siempre pasa la del cobro, por eso el 8354 está limpio.
**El discriminador no es el tipo de cobro sino si el documento fue EDITADO** (descuento / retención / pago
parcial): pagar el saldo completo sin tocar nada graba bien — por eso 8356 está correcto.

> 🔑 **Por qué el `61.749.207,41` del volcado NO aparece:** `form:documentosPagadosDT` tiene 22 columnas y
> **no incluye la conversión del monto pagado**. Ese campo mal guardado no tiene celda donde pintarse, ni en
> la app ni en la web. El que sí llega a pantalla es el del **descuento**.

## 🔴 DW-COB-H02 — La columna `Descuento conversión` mezcla concepto **y** va multiplicada · S2

En 8353 / `FF081401` esa columna muestra **570.418,13** = `773,05 × 737,88`, pero **773,05 no es un descuento**:
es el `Diferencia/Faltante` (el descuento es 1.000,00, en otra columna). La celda está **multiplicada Y bajo
etiqueta equivocada**. Correcto: `773,05 / 737,88 = 1,05`, en una columna "Dif/Faltante conversión".

## 🔴 DW-COB-H03 — El filtro `Status` no filtra · S2

Con `Status = APROBADO` (value 24) + Buscar: **50 filas, 10 páginas**, mix `11 Por aprobar / 3 RECHAZADO /
36 APROBADO` — **idéntico al baseline sin filtro**. Repetido con `RECHAZADO` (25): mismo resultado exacto.
**No es la pantalla ignorando filtros:** el control `Tipo Cobro = Retención` devolvió **1 fila (8354)** y
`# Ref = 8352` devolvió **1 fila**. Es `Status` específicamente.
Opciones del control: `0` Status · `12` Por aprobar · `17` Enviado · `24` APROBADO · `25` RECHAZADO · `26` CON DIFERENCIA.

## ⚠ DW-COB-H04 — Conteo de adjuntos por debajo de lo declarado · **sin veredicto (WEB-N/A)**

El ZIP del 8352 trae **1 entrada** y el sondeo por URL halla **1 imagen**, pero el volcado declara
`nu_attachments = 2` (y 4 para los otros). **No se marca como defecto de la web**: el agente móvil ya reportó
que ese contador no es fiable (8355 declara 4 y el servicio ve 3) y su enumeración quedó ⛔ BLOCKED.
Sin BD nube no hay oráculo. **Requiere confirmación manual de QA.**

## ✅ Los 2 defectos de presentación del móvil NO se repiten en la web — la web los corrige

- **`Total Depósitos` sin formato de miles:** la web **no tiene** esas líneas; el depósito se muestra en la
  tabla de pagos **bien formateado** (`1.500,00 BS`, `175.622,82 BS`), no `1500` / `175622.82`.
- **Timestamp ISO crudo en la retención:** barrido de toda la página del 8354 con `/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/`
  → **0 coincidencias**. La fecha del comprobante sale `20/07/2026`.

## ✅ `Limpiar` funciona bien acá — el defecto sistémico NO se reproduce

Probado con los controles **efectivamente fijados** (Status=APROBADO/24 y Tipo=Retención/2): tras `Limpiar`
vuelven a su placeholder y el listado a 50 filas. **El defecto de los otros 5 módulos (otro cliente) no aplica
a cobros de La Tortuga.**

## Adjuntos

`cobro_8352.zip` descargado y verificado: magic **`PK 03 04`**, **169.926 bytes**, **1 entrada** `8352_0.jpeg`
(205.160 b). Sondeo por URL directa: 8352→1 · 8353→2 · 8354→2 · 8355→2 · 8356→1 imagen.
🔴 Ambas copias del ZIP borradas, **0 residuos**.

## Patrones / selectores nuevos (insumo de consolidación)

| Patrón | Detalle |
|---|---|
| **Los 2 lectores de cabecera son complementarios — reconfirmado** | En `detalleCobro` el **hermano-del-padre** da Ref/Estatus/Fecha/Cliente/Empresa/Comentario y deja **vacíos** los totales; `leerCabecera()` da **solo** los totales. Unir con `h[k] \|\| p[k]`. Cabecera toda vacía = lectura fallida |
| 🔑 **`form:documentosPagadosDT` tiene 22 columnas y NO incluye "monto a pagar conversión"** | Están los gemelos `Monto doc. conversión`, `Saldo doc. conversión`, `Total dcto. conversion`, `Retención IVA/ISLR conversión`, `Descuento conversión` — pero **no** la del monto pagado. **Por eso el `61.749.207,41` nunca llega a pantalla** |
| **Tabla de pagos = `form:j_idt178`** | Anclar por `tablaPorColumnas(['Forma de pago','Monto cobrado'])`. En Retención renderiza `"No se encontraron registros."` (correcto) |
| **`form:discountsDT` rinde 3 `<tr>` por descuento** | 1 fila padre (valores repetidos en `_c3/_c4/_c5`) + 1 vacía + 1 de la subtabla anidada `form:discountsDT:{N}:j_idt358`. Un lector genérico cuenta 6 filas para 2 descuentos. En Retención la tabla **no existe** (`null`) |
| **Formulario de filtros = `form:j_idt116`** | Sufijos: Buscar `[id$=":ajax"]` · Limpiar `[id$=":botonLimpiar"]` · `[id$=":n_ref"]` · `[id$=":orderStatus"]` · `[id$=":idTipo"]` · `[id$=":idEnterprise"]` |
| **Conteo de adjuntos sin descargar** | `fetch('/denario/resources/images/cobros/{ref}_{n}.jpeg')` — **sin** el prefijo `/DenarioPremium`. Read-only y barato |
| 🔴 **La 2ª copia del ZIP cae en el directorio PADRE** | Playwright la dejó en `DenarioPremiunMovil\.playwright-mcp\`, **no** en `qa-piloto-automatizacion\.playwright-mcp\`. Buscarla solo en el cwd deja el adjunto de producción en disco |
| **El vocabulario de marcas no cubre "filtro roto"** | `Status` no filtra no es field ni calc mismatch de un registro. Se usó `WEB-FIELD-MISMATCH` por cercanía. Convendría `WEB-FUNC-DEFECT` |

---

# DEVOLUCIONES · INVENTARIOS · VISITAS

## DEVOLUCIÓN Ref 169 — ✅ WEB-OK

Cotejo completo contra el manifiesto: cliente **AS04 ABASTO EL SITIO DSG**, empresa 00002, producto **PCE03**,
**2 CAJA**, factura `FAC-0730-01`, **lote `LOTE-QA-0730`**, tipo Cambio X Cambio, motivo 49. **0 diffs.**
🔑 **El detalle de devoluciones SÍ tiene columnas `Lote` y `Fecha vencimiento` y las llena bien** — dato clave
para el contraste con inventarios (abajo).
Defectos del módulo: `Limpiar` **no resetea** los selects (`Status`, `Tiene Adjunto`) · **ordenamiento roto**
(`# Ref`, `Cliente`, `Fecha`) · encabezado con typo **`Fecha Devoluciòn`** (acento grave).

## INVENTARIO Ref 104 — ⚠ llegó, pero la web NO publica lote ni vencimiento

El registro está y sus datos de identidad y cantidad coinciden. **Pero el detalle no muestra dos campos que el
móvil sí envió:** lote **`LOTEQA30`** y vencimiento **`31/07/2026`**.
Columnas del detalle: `N° · Cod. producto · Producto · Estructura · Depósito · Exhibición` — sin toggler de fila.
**Sondeo del HTML completo (132 KB):** `lote` **0** · `LOTEQA30` **0** · `vencim` **0** · `expira` **0** ·
`batch` **0** · `31/07/2026` **0** coincidencias.

🔑 **El contraste que lo vuelve accionable:** **el detalle de DEVOLUCIONES, en esta misma web, sí tiene esas
columnas y las llena.** ⇒ no es una limitación del modelo ni del backend: **es la pantalla de inventarios**.
⇒ **Segundo cliente con el mismo defecto** (ya se había visto en latino_cosmetica / Isla Coche) ⇒ **no depende
de la playa**.
Defectos del módulo: `Limpiar` **no resetea** los selects · ordenamiento **mixto** (`Fecha creación` ✅ · `# Ref` ❌).

## VISITAS — Ref 574864

| Parámetro | Valor |
|---|---|
| Resultado | **WEB-OK** — todos los campos coinciden, **incluida la hora** |
| Baseline 00002 | 50 filas/pág · **45 Refs únicas** · 10 páginas |
| Tabla | `form:tablaVisit` · Buscar = **`[id$=":btnBuscar"]`** (⚠ **no** `:ajax`) · filtros `form:j_idt116` |

### 🔑 DW-VIS-001 — La web muestra la hora CORRECTA ⇒ el +4 h es solo del render móvil

| Dato | Móvil (BD + payload) | App al reabrir | **WEB** |
|---|---|---|---|
| Fecha de la visita | `2026-07-30 11:51:05` | **15:51** (+4 h) | **`30/07/2026 11:51:05`** ✅ |

Barrido de **todos** los patrones de fecha del HTML: aparece **un solo timestamp**, `30/07/2026 11:51:05`.
No hay ningún `15:51`. En la lista, `Fecha Enviada` = `30/07/2026 11:53:56` = el `da_real` del móvil.
⇒ **El dato está bien en origen, en el servidor y en la web. El +4 h vive únicamente en el formateo de la app.**
**El arreglo es de una sola capa.** No hay que tocar el dato ni migrar nada.

### Cotejo campo por campo — WEB-OK

Ref · Título · Empresa · Cód./Nombre cliente · Vendedor · **Orden de visita (1)** · Fecha planeada ·
Fecha Enviada · Status (`"visitado"`, literal) · Actividad (MERCHANDISING) · Motivo (VISIBILIDAD PDV) ·
Descripción · **Coordenada `11.0490586,-63.8649815` exacta dígito a dígito** · Adjuntos (0, botones `disabled`).

Adjuntos confirmados por dos vías: botones `disabled === true`, y el filtro `Adjuntos = Tiene Adjuntos`
reduce de 13 a 2 filas **excluyendo la 574864**. **0 residuos en disco** (verificado en cwd **y** en el
directorio padre `DenarioPremiunMovil\.playwright-mcp\`).

**Una sola fila por la visita** (tiene 1 actividad). En el baseline sí se ve la duplicación por actividad
(50 filas / **45 Refs**) — **comportamiento esperado, no defecto**. Al contar visitas, agrupar por `# Ref`.

### 🔴 DW-VIS-H01 — `Limpiar` salta la empresa a 00001 y muestra datos de OTRA empresa · **S1**

Reproducido **2/2**:
1. Empresa = **00002 GLOBAL M&P**, filtros puestos → listado de GLOBAL M&P (la 574864 primera)
2. **`Limpiar`** → el selector salta a **`HC TRADING MARKET 2021, C.A` (00001)**
3. Listado: 50 filas **de la otra empresa** (Refs 574862 · 574819 · 574673 · 574340 · 574320; clientes
   INVERSIONES V… / MINI MARKET L… / FRIGORIFICO L…) — **ninguno de GLOBAL M&P**. La 574864 desaparece.
4. **Sin ningún mensaje ni cambio visual fuera del propio selector.**

**Impacto:** un usuario con acceso a las dos empresas pulsa `Limpiar` y **queda mirando las visitas de otra
empresa creyendo que son las suyas**.

🔑 **El detalle que delata el bug:** en visitas el `<select>` de Empresa **SÍ tiene opción neutra**
(`"" = Seleccione Empresa`, `1`, `2`) — a diferencia de devoluciones e inventarios, donde solo hay `1` y `2`.
**`Limpiar` igual elige la primera empresa real (00001) en vez de la neutra** ⇒ no es que falte a dónde
resetear: **el reset apunta al índice equivocado**.

### ✅ Lo que funciona en visitas (mejor que en los otros dos)

`# Ref` → 1 fila ✓ · `Estatus` (`No visitado` → 0) ✓ · `Actividad` (MERCHANDISING → 13, incluye la 574864) ✓ ·
`Adjuntos` (13 → 2, sin la 574864) ✓ · **`Limpiar` SÍ resetea los selects de filtro** ✓ (el único problema es la
empresa) · **ordenamiento funciona** (`Ref` asc → 390 · 424 · 481 · 788 · 1250) ✓ · paginación ✓
Selector de Columnas: **WEB-N/A** — visitas no tiene toggler.

### 🔴 DW-VIS-H02 — Typo CSS `class="font.-bold"` × 8 en `detalleVisita.xhtml` · S4 · confirmado también acá

| Clase | Ocurrencias |
|---|---|
| **`font.-bold`** (con punto — clase inexistente) | **8** |
| `font-bold` (correcta) | 2 |

Las 8 mal escritas son **todas las etiquetas de la cabecera** (`No. de Ref.` · `Vendedor` · `Fecha planeada` ·
`Empresa` · `Código del cliente` · `Orden de visita` · `Nombre del cliente` · `Ubicación`); la única correcta es
`Titulo:`. **Efecto visible:** esas 8 no salen en negrita y `Titulo:` sí.
**Arreglo: borrar un punto, 8 veces, en un archivo.**
⚠ **2º cliente y 2ª playa con el mismo typo** ⇒ está en el fuente, no en una instalación.

### ⓘ Observaciones sin veredicto

- **`Geo` = "Fuera de Rango"** — coherente: la coordenada capturada (Margarita/Coche) está lejos de la sucursal
  registrada (área de Caracas). Esperable en laboratorio. **No es fallo de la web.**
- **`Fecha Iniciada` vacía** en la 574864, mientras otras visitas sí la traen (574862 → `30/07/2026 09:33`).
  El manifiesto del móvil **no reporta** campo de inicio ⇒ sin oráculo → **WEB-N/A**. Sugiere que el flujo
  automatizado no grabó `da_init`. **Requiere confirmación del móvil.**
- El detalle de visita **no publica la sucursal** del cliente (el de inventarios sí). Menor.

---

## 🔑 SÍNTESIS: `Limpiar` está roto de DOS maneras distintas, y el ordenamiento falla POR COLUMNA

| Módulo | `Limpiar` resetea selects | `Limpiar` cambia empresa | Ordenamiento |
|---|---|---|---|
| **devoluciones** | ❌ no (Status y Tiene Adjunto quedan puestos) | ✅ no la toca | ❌ roto (`# Ref`, `Cliente`, `Fecha`) |
| **inventarios** | ❌ no | ✅ no la toca | ⚠ **mixto**: `Fecha creación` ✅ · `# Ref` ❌ |
| **visitas** | ✅ **sí** | 🔴 **salta a 00001** (2/2) | ✅ funciona · paginación ✅ |
| cobros | ✅ sí | — | — |
| clientes potenciales | ❌ no | 🔴 sí | ❌ roto |
| pedidos | ✅ sí | ✅ no la toca | ✅ funciona |

⇒ Son **dos defectos independientes**, no uno: el **reset de los `selectOneMenu`** y el **reset de Empresa**.
⇒ El **ordenamiento falla por COLUMNA, no por módulo** (probado con espera de 2,5 s en ambos sentidos).
⇒ Los **filtros de datos funcionan en los 3 módulos** — a diferencia de cobros, donde `Status` no filtra.

## Patrones nuevos para consolidar

- Visitas usa **`[id$=":btnBuscar"]`** (no `:ajax`) y su mensaje de lista vacía es **`"No existe registro"`**
  (los demás módulos usan `"No se encontraron registros."`).
- El toggler de Columnas oculta con **clase, no `style.display`** → medir con `offsetWidth === 0`.
- El **estado JSF (filtros y ordenamiento) sobrevive a `page.goto()`** y solo se recupera eligiendo la opción
  placeholder a mano.
- El **sondeo barato de adjuntos por URL NO sirve en inventarios** (404 en las 4 variantes, incluso en registros
  que sí tienen). Señal fiable: `Ver adjuntos`/`Descargar` con `disabled === true`.
- En `detalleVisita.xhtml` el lector `span.font-bold` **solo levanta 1 de 9 campos** por el typo → usar
  **`span[class*="bold"]`** → `sp.closest('div').nextElementSibling`.

---

## Verificación puntual — flujo PEDIDO SUGERIDO (inventario 105 → pedido 15168)

Playa **la_tortuga** · empresa **00002 GLOBAL M&P** (verificada en las 3 páginas) · cliente **CY09** · read-only.
QA probó este flujo **a mano** en la app y pidió confirmarlo en la web.

### 1 · El vínculo entre ambos — **WEB-OK, BIDIRECCIONAL**

| Dirección | Dónde | Qué muestra la web | Veredicto |
|---|---|---|---|
| inventario → pedido | detalle inv. 105 | `Ver Pedido Relacionado:` → botón **`Ref.: 15168`** (`form:j_idt150`) | ✅ |
| pedido → inventario | detalle ped. 15168 | `Inventario relacionado:` → **`Ref.: 105`** | ✅ |

El botón fue pulsado: navega de `/pages/detalleInventario` a `/pages/detallePedido` mostrando el 15168.
En la BD local el enlace es doble (`id_order=15168` / `id_client_stock=105`) y **la web expone las dos patas**.
⇒ **Queda EXPLICADO el inventario 104** (que no tenía `Ver Pedido Relacionado`): ese inventario no generó
pedido, así que la ausencia del botón allí es **comportamiento correcto**, no un defecto. Sospecha cerrada.

### 2 · Cotejo campo por campo — **0 diffs en ambos registros**

**Inventario 105:** Ref · epoch `1785430833533.0` · 30/07/2026 13:00:33 · CY09 ABASTO YOSELIN · empresa 00002 ·
MA10 MARGARINA ALBECA · **12.00 CAJA en columna Exhibición** (Depósito = `-`) · Estatus **Enviado**. Todo ✅.

**Pedido 15168:** Ref · epoch `1785430846671.0` · 13:01:52 creación / 13:02:02 envío · CY09 (RIF J001673458) ·
empresa 00002 · MA10 · 12 CAJA · `Precio base: 17,97 USD` · base y total **215,64 USD** · conversión
**159.116,44 BS** · `Tipo de Pedido: FACTURA` · **Enviado**, `¿Por Aprobar?: NO`. Todo ✅.

### 3 · Aritmética explícita — **WEB-OK**

- `17,97 × 12 = 215,64` = base = total (IVA 0) → web `215,64` ✅
- Conversión **USD→BS multiplica** (correcto: el pedido está en USD):
  · subtotal `215,64 × 737,88 = 159.116,4432` → web **159.116,44** ✅
  · precio base `17,97 × 737,88 = 13.259,7036` → web **13.259,70** ✅
- Tasa reconstruida desde la web: `159.116,44 ÷ 215,64 = 737,8845…` ≈ **737,88** ✅
- Cruce interno: `13.259,70 × 12 = 159.116,40` vs `159.116,44` → **0,04 BS**. La web calcula la conversión
  sobre el **subtotal**, no multiplicando el unitario ya redondeado. **Método correcto, no es defecto.**

⚠ **Nada que ver con el defecto de cobros** (donde BS→USD debía dividir y multiplicaba): acá multiplicar es
lo correcto y la web multiplica. **Ningún factor entero, ninguna división indebida.**

### 4 · Lote y vencimiento — **WEB-MISSING (2.ª confirmación)**

Sondeo sobre `/pages/detalleInventario` del Ref 105: `/lote|vencim|expira|batch|caduc/gi` → **0 coincidencias
en `innerHTML` y 0 en `innerText`**. Columnas: `N° · Cod. producto · Producto · Estructura · Depósito · Exhibición`.

⇒ **No falta el valor: falta el contenedor.** No existe columna ni campo de lote, y el **vencimiento
`30/07/2026` no aparece en ninguna parte** (este inventario tiene el lote vacío, así que la prueba es la
ausencia de la columna **y** la del vencimiento, que sí tenía valor).
**2.º registro del mismo cliente con el mismo síntoma** (el 1.º fue el Ref 104), ahora con evidencia estructural.
**Devoluciones sí los muestra** ⇒ omisión específica de la pantalla de inventarios.

### Hallazgos nuevos de esta verificación

1. **El vínculo pedido → inventario no estaba documentado.** `WEB-RUNTIME §7` solo registra la dirección
   inventario → pedido. La contraria (`Inventario relacionado: Ref.: N` en `detallePedido`) es un **oráculo
   cruzado nuevo y utilizable**.
2. **La tasa está en la LISTA de pedidos pero NO en el detalle.** `Tasa conv.` es columna de `/pages/pedidos`;
   en `detallePedido` no hay ninguna mención de "tasa". Para auditar una conversión desde el detalle hay que
   **derivarla** (`conv ÷ monto`) o volver a la lista. Afecta a cualquier guión que lea la tasa del detalle.
3. **IVA 0 se publica como campo VACÍO, no como `0,00 USD`.** Un lector estricto lo marcaría `WEB-MISSING`;
   es presentación. **Los guiones deben tratar vacío ≡ 0 en IVA y descuentos.**
4. **Discordancia epoch↔fecha en el pedido — del lado MÓVIL, no de la web.** Los epochs distan 13,1 s
   (`…846671 − …833533`) pero las fechas mostradas distan 79 s (13:00:33 → 13:01:52). La web reproduce
   **ambos valores idénticos a la BD local** ⇒ la inconsistencia nace en el móvil (el código se sella al abrir
   el pedido y la fecha al guardarlo). **No es defecto web**; observación para el lado móvil.
5. **La sesión web expira entre corridas** — un `page.goto()` a un módulo redirigió a `login.xhtml`. Los
   guiones web deben comprobar el pathname tras navegar y re-loguear, en lugar de asumir sesión viva.
