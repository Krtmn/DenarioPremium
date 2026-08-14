# Capa WEB — RUN 20260804_162329_smoke-completo · cliente alipascua

Playa: **el_yaque** · `http://denarioelyaque.ddns.net:8080/DenarioPremium`
Empresa verificada en pantalla: **ALIPASCUA, C.A.** (única opción del filtro `idEnterprise`, n=1) ✅
Guarda de playa: `host=denarioelyaque.ddns.net:8080` + pathname → `verificarContexto(...,'el_yaque').ok = true` en
`/pages/cobros`, `/pages/detalleCobro`, `/pages/clientesPotenciales`, `/pages/detalleClientePotencial`.
Login: usuario `***` / clave `***` → `/pages/main` OK. Sin ViewExpired en toda la corrida.
Modo: **READ-ONLY** — solo `Consultar`, `Buscar`, `Limpiar` y los `<select>` de FILTRO. No se tocó ningún
`statusMenu` de fila, ni Editar/Eliminar/Aprobar/Guardar.

---

## COBROS

### DW-COB-001 · # Ref 39236 · co_type 0 (normal) · **WEB-CALC-MISMATCH**

| Campo | Móvil / BD nube | Web (literal) | Veredicto |
|---|---|---|---|
| Aparece en la web | sí (BD-OK) | sí, lista + detalle | ✅ |
| **Estatus (texto de la WEB)** | st_collection=3 | **"Por aprobar"** (lista `Estatus del Cobro` y detalle `Estatus:`) | ⚠️ la web NO dice "Enviado" |
| Cliente | J296437246 MICROEMPRESA ORINOCO | `Código del cliente: J296437246` · `Nombre del cliente: MICROEMPRESA ORINOCO` | ✅ |
| Fecha | 2026-08-04 | `04/08/2026 15:42:13` | ✅ mismo día |
| Moneda | BSD | `BSD` (lista) · `Moneda: BSD` (docs) | ✅ |
| Tasa | 746,6297 | `Tasa de conversión: 746,6297` · lista `746,6297 BSD = 1 US$` | ✅ |
| Monto total (Σ pagos) | 185.000,0000 | **no hay total explícito**; lista `Monto cobrado` = `10.000,0000 BSD 170.000,0000 BSD 5.000,0000 BSD` | ⚠️ ver (e) |
| Monto final / neto | 179.063,4753 | `Total Monto a pagar: 179.063,4753 BSD` · lista `Total por cobrar: 179.063,4753 BSD` | ✅ |
| Diferencia | 5.936,5247 | `Diferencia de cobro: 5.936,5247` · lista `Diferencia cobro: 5.936,5247 BSD` | ✅ |
| Vendedor / Responsable | 002 | `Wilmen Lara` / `gv` | ✅ |
| Comentario | c1 | `c1` | ✅ |

**Pagos (tabla `form:j_idt178`, 3/3 presentes):**

| N° | Forma de pago | Banco / Doc | Monto cobrado | Monto conv. | Comprobación |
|---|---|---|---|---|---|
| 1 | Transferencia | BANESCO · doc 12456 | 170.000,0000 BSD | 227,6898 US$ | 170.000 / 746,6297 = 227,6898 ✅ |
| 2 | Efectivo | — | 5.000,0000 BSD | 6,6968 US$ | 5.000 / 746,6297 = 6,6968 ✅ |
| 3 | Deposito | PROVEEDOR IANCARINA · doc dep1 | 10.000,0000 BSD | 13,3935 US$ | 10.000 / 746,6297 = 13,3935 ✅ |

**Documentos (tabla `form:documentosPagadosDT`, 2/2 presentes):**

| N° | Factura | Pago parcial | Monto doc | Monto a pagar | Diferencia/Faltante | **Descuento conversión** | Moneda conv. |
|---|---|---|---|---|---|---|---|
| 1 | FACT46964 | **SI** | 1.283.755,1062 | **1.500,0000** | **755,0000** | **563.705,4235** | US$ |
| 2 | FACT46965 | NO | 177.563,4753 | 177.563,4753 | 0,0000 | 0,0000 | US$ |

**Aritmética explícita (todas las verificaciones):**

```
Σ pagos            170.000 + 5.000 + 10.000            = 185.000,0000  ✅ (= total BD)
Total a pagar      1.500,0000 + 177.563,4753           = 179.063,4753  ✅ = web
Diferencia         185.000,0000 − 179.063,4753         =   5.936,5247  ✅ = web
Monto conv.(lista) 185.000,0000 / 746,6297             =     247,7801  ✅ = web 247,7801
Por cobrar conv.   179.063,4753 / 746,6297             =     239,8290  ✅ = web 239,8290
Dif. cambiaria       5.936,5247 / 746,6297             =       7,9511  ✅ = web 7,9511
Monto total base   1.283.755,1062 + 177.563,4753       = 1.461.318,5815 ✅ = web
base conversión    1.461.318,5815 / 746,6297           =   1.957,2200  ✅ = web 1.957,2200
doc1 conversión    1.283.755,1062 / 746,6297           =   1.719,4000  ✅ = web
doc2 conversión      177.563,4753 / 746,6297           =     237,8200  ✅ = web
🔴 Descuento conv.       755,0000 / 746,6297 (correcto)  =       1,0112
🔴                       755,0000 × 746,6297 (la web)    = 563.705,4235 ← MOSTRADO
```

⇒ **WEB-CALC-MISMATCH**: los campos base cuadran, pero el derivado `Descuento conversión`
está multiplicado en vez de dividido (error de factor **tasa² ≈ 557.400×**).

**Inconsistencia interna adicional de la propia web:** el pie dice
`Monto total descuento: 0,0000 BSD` y `Monto total descuento conversión: 0,0000 US$`,
pero la fila 1 muestra `Descuento conversión = 563.705,4235 US$`. Σ(hijos) ≠ total de cabecera.

---

### DW-COB-002 · # Ref 39237 · co_type 1 (anticipo) · **WEB-OK**

| Campo | Móvil / BD nube | Web (literal) | Veredicto |
|---|---|---|---|
| **Estatus (WEB)** | st_collection=3 | **"Por aprobar"** | ⚠️ literal |
| Cliente | J295847190 MICROEMPRESA VIVERES - DISTRIB | `J295847190` / `MICROEMPRESA VIVERES - DISTRIB` | ✅ |
| Fecha | 2026-08-04 | `04/08/2026 15:46:52` | ✅ |
| Tipo | anticipo | lista: `Tipo de Cobro: Anticipo/Prepago` | ✅ |
| Monto | 3.000,0000 BSD | `Monto pagado: 3.000,0000 BSD` | ✅ |
| Pagos | 1 (pago móvil, Provincial) | 1 fila: `Pago Movil` · `BANCO PROVINCIAL` · ref `123456786` · `3.000,0000 BSD` | ✅ |
| Documentos | 0 | tabla `documentosPagadosDT` **ausente** | ✅ |
| Diferencia | — | `Diferencia de cobro: 0,0000` | ✅ |
| Empresa | ALIPASCUA | `ALIPASCUA, C.A.` | ✅ |

```
Monto pagado conversión   3.000,0000 / 746,6297 = 4,0181  ✅ = web 4,0181 US$
Monto conv. (lista)       ídem                            ✅ = web 4,0181 US$
```

Diffs: **0**. Datos extra que la web completa por su cuenta (Banco Emisor, Tipo Documento, Nº teléfono,
cuenta) no se juzgan.

---

### DW-COB-003 · # Ref 39238 · co_type 2 (retención, **US$**) · **WEB-OK** (con hallazgo de filtro)

🔴 **No aparecía en el listado por defecto.** El filtro **`Moneda` de `/pages/cobros` viene preseleccionado
en `BSD`**, y 39238 es en US$. Con `Moneda = BSD` + `# Ref = 39238` el resultado es **0 filas** →
habría sido un **falso WEB-MISSING**. Al poner el filtro en `US$` aparece de inmediato.

| Campo | Móvil / BD nube | Web (literal) | Veredicto |
|---|---|---|---|
| **Estatus (WEB)** | st_collection=3 | **"Por aprobar"** | ⚠️ literal |
| Cliente | J296437246 MICROEMPRESA ORINOCO | `J296437246` / `MICROEMPRESA ORINOCO` | ✅ |
| Fecha | 2026-08-04 | `04/08/2026 15:49:07` | ✅ |
| Moneda | **US$** | lista `1.800,0000 US$` · docs `Moneda: US$` | ✅ |
| Monto | 1.800,0000 US$ | lista `Total por cobrar: 1.800,0000 US$` | ✅ |
| Retención IVA | 1.000 | `Retención IVA: 1.000,0000 US$` | ✅ |
| Retención ISLR | 800 | `Retención ISLR: 800,0000 US$` | ✅ |
| Documentos | 2 | FACT46964 + FACT46965 | ✅ |
| Pagos | 0 | tabla de pagos: `No se encontraron registros.` | ✅ |
| Nro Retención | — | `12345678912345` | ✅ |
| Coordenada | — | `11.0490608,-63.864995` | nota |

```
Ret. IVA conversión    1.000,0000 × 746,6297 = 746.629,7000 ✅ = web (US$→BSD multiplica)
Ret. ISLR conversión     800,0000 × 746,6297 = 597.303,7600 ✅ = web
Σ retenciones          1.000 + 800           =   1.800,0000 ✅ = Total por cobrar
Monto conv. (lista)    1.800,0000 × 746,6297 = 1.343.933,46 ✅ = web
Monto total base       1.719,4000 + 237,8200 =   1.957,2200 ✅ = web
base conversión        1.957,2200 × 746,6297 = 1.461.318,58 ✅ = web 1.461.318,5815
doc1 conversión        1.719,4000 × 746,6297 = 1.283.755,11 ✅ = web
doc2 conversión          237,8200 × 746,6297 =   177.563,48 ✅ = web
```

Diffs: **0**. Todas las conversiones US$→BSD **multiplican correctamente**.

**Observación — ⚠ DEFECTO YA CONOCIDO, NO reportar como nuevo:** el pie muestra `Total Monto a pagar: 0,0000
US$` pese a que la fila 1 tiene `Monto a pagar = 1.800,0000`. Mismo comportamiento en 39239. Esto es
**`COB-RET-TOTAL-CERO`** de `automation/defectos-conocidos.yaml` (detectado en tag 20, resuelto en tag 21,
estado *monitoreo*): la cabecera calcula Σ(pagos) y un cobro por retención no tiene filas de pago.
⇒ **Reproduce en El Yaque / alipascua ⇒ este build NO tiene el fix del tag 21.** Es el caso de regresión
DW-COB-C09. El importe de negocio (1.800) sí se muestra bien en la lista y en las retenciones.

---

### DW-COB-004 · # Ref 39239 · co_type 2 (retención, BSD) — el no declarado · **WEB-OK / EXISTE**

✅ **Confirmado: 39239 EXISTE en la web.** Estatus que muestra la pantalla: **"Por aprobar"**
(mismo estado que los otros 3 — no quedó en un estado distinto ni huérfano).

| Campo | BD nube | Web (literal) | Veredicto |
|---|---|---|---|
| Existe | sí | lista + detalle | ✅ |
| **Estatus (WEB)** | — | **"Por aprobar"** | ✅ mismo que 39236/37/38 |
| Cliente | J296437246 MICROEMPRESA ORINOCO | `J296437246` / `MICROEMPRESA ORINOCO` | ✅ |
| Monto | 1.800,0000 **BSD** | lista `Total por cobrar: 1.800,0000 BSD` | ✅ |
| Fecha/hora envío | 20:11 UTC | `04/08/2026 16:10:16` (UTC-4) | ✅ mismo día |
| Documentos | 2 (FACT50019379 + FACT47169) | fila 1 `FACT47169`, fila 2 `FACT50019379` | ✅ ambos |
| Retenciones | IVA 1.000 + ISLR 800 | `Retención IVA: 1.000,0000 BSD` · `Retención ISLR: 800,0000 BSD` | ✅ |
| Pagos | 0 | `No se encontraron registros.` | ✅ |
| Comentario | — | `ret` · Nro Retención `11111111111422` | nota |
| Coordenada | — | `11.0490605,-63.8649944` | nota |

```
Ret. IVA conversión     1.000,0000 / 746,6297 = 1,3394 ✅ = web (BSD→US$ divide)
Ret. ISLR conversión      800,0000 / 746,6297 = 1,0715 ✅ = web
Monto conv. (lista)     1.800,0000 / 746,6297 = 2,4109 ✅ = web 2,4109 US$
Monto total base    1.092.991,2178 + 819.306,6350 = 1.912.297,8528 ✅ = web
base conversión     1.912.297,8528 / 746,6297     =     2.561,2400 ✅ = web
doc1 conversión     1.092.991,2178 / 746,6297     =     1.463,9000 ✅ = web
doc2 conversión       819.306,6350 / 746,6297     =     1.097,3400 ✅ = web
```

Diffs: **0**. Aquí las conversiones BSD→US$ **dividen correctamente** — incluido el mismo par de
retenciones que en 39238 se multiplicó (correcto, porque allí la moneda era US$).

---

## 🔴 ¿El bug de conversión es VISIBLE para el usuario final?

Esta es la sub-sección que decide la severidad.

### Cobro 39236 — `nu_amount_paid_conversion` = 1.119.944,55 US$ en la hija FACT46964

**Método:** barrido de `document.body.innerText` completo del detalle (2.760 caracteres) y de la lista,
buscando literalmente `1.119.944` / `1119944`, más enumeración de **las 22 columnas** de
`form:documentosPagadosDT` incluyendo comprobación de columnas ocultas (`display:none` / `offsetParent`).

**Resultado — dos hallazgos, hay que separarlos:**

1. **El valor 1.119.944,55 NO se muestra en ninguna parte de la web.** No aparece en el detalle, no aparece
   en la lista, y **la tabla de documentos no expone ninguna columna "Monto a pagar conversión"**. Ninguna
   columna está oculta: las 22 son visibles. ⇒ Para *ese campo puntual*, el defecto es **solo de
   persistencia**.

2. 🔴 **PERO el mismo defecto de dirección SÍ es visible, en otra columna del mismo renglón.**
   La columna **`Descuento conversión`** de FACT46964 muestra **`563.705,4235`** con **`Moneda conv. = US$`**:

   ```
   755,0000 × 746,6297 = 563.705,4235   ← lo que la web MUESTRA
   755,0000 / 746,6297 =       1,0112   ← lo correcto en US$
   ```

   Es exactamente el mismo error que en `nu_amount_paid_conversion` (multiplicar donde corresponde dividir),
   aplicado al descuento de 755,00.

**Conclusión de severidad: el defecto de conversión ES visible para el usuario final.**
No por el campo que se buscaba, sino por su gemelo `Descuento conversión`: un descuento real de
**755 BSD (≈ 1,01 US$)** se le presenta al usuario como **563.705,42 US$**, un error de ~557.400×, en la
pantalla de detalle de un cobro de producción. **Sube de severidad.**

**Agravante:** la web se contradice a sí misma — `Monto total descuento conversión: 0,0000 US$` en el pie
frente a `563.705,4235 US$` en la fila. Un usuario que sume los hijos no llega al total.

**Atenuante (importante para acotar el alcance):** todos los *derivados de cabecera y de lista* se muestran
**bien** — `Monto conv. 247,7801`, `Por cobrar conv. 239,8290`, `Diferencia cambiaria 7,9511`,
`Total Monto a pagar conversión 239,8290`, `Monto total base conversión 1.957,2200`. **El importe que el
usuario lee como total del cobro no está contaminado**; la contaminación está confinada a la columna de
descuento de la fila del documento.

### Cobro 39238 — `nu_amount_paid_conversion` = 237,8200 sin convertir

**Resultado: la web NO lo muestra mal.** El detalle de 39238 es internamente coherente:

| Doc | Monto doc (US$) | Monto doc. conversión (BSD) | Comprobación |
|---|---|---|---|
| FACT46964 | 1.719,4000 | 1.283.755,1062 | 1.719,40 × 746,6297 = 1.283.755,1062 ✅ |
| FACT46965 | **237,8200** | **177.563,4753** | 237,82 × 746,6297 = 177.563,4753 ✅ |

El `237,8200` aparece en pantalla como `Monto doc` / `Saldo doc.` / `Monto a pagar` **en US$**, que es la
moneda de la transacción — no como una conversión errónea. ⇒ Para 39238, **el defecto es únicamente de
persistencia**, invisible en la web.

---

## CLIENTES POTENCIALES

### DW-CLT-001 · ref 1 · epoch 1785875941285.0 · **WEB-OK**

Localizado sin filtro de `# Ref` (no existe en este módulo): filtro por defecto vendedor=todos + fechas
`01/08/2026`–`04/08/2026` → **1 sola fila** en el rango, coincidente. La lista **sí trae columna `# Ref`** = `1`.

| Campo | Móvil (BD-OK) | Web (literal) | Veredicto |
|---|---|---|---|
| `# Ref` (id_client) | 1 | `1` (lista) | ✅ |
| **`Código:` (epoch co_client)** | 1785875941285.0 | **`1785875941285.0`** | ✅ exacto |
| Nombre | Test-CLT-SMOKE-163935 | `Test-CLT-SMOKE-163935` | ✅ |
| RIF | J987654321 | `Cédula:: J987654321` · lista `Rif. Cliente: J987654321` | ✅ |
| Vendedor | co_user 002 (id_user 468) | `Wilmen` — = "Wilmen Lara" de cobros | ✅ |
| Fecha | 2026-08-04 16:41:12 | `04/08/2026 16:41:12` | ✅ mismo día **y misma hora** |
| **Coordenada** | 11.0490433,-63.8649957 | **`11.0490433,-63.8649957`** | ✅ exacta, dígito a dígito |
| Empresa | ALIPASCUA, C.A. (id 2) | filtro `idEnterprise` = `ALIPASCUA, C.A.` (única) | ✅ |
| Dirección | AV PRINCIPAL EL YAQUE QA | `AV PRINCIPAL EL YAQUE QA` | ✅ |
| Dirección despacho | AV PRINCIPAL EL YAQUE QA DESPACHO | `Dirección Entrega: …DESPACHO` | ✅ |
| Comentario | Cliente potencial de prueba QA smoke | `Comentario: Cliente potencial de prueba QA smoke` | ✅ |
| Responsable | RESPONSABLE QA | `RESPONSABLE QA` | ✅ |
| Correo | qa.smoke@kiberno.com | `qa.smoke@kiberno.com` | ✅ |
| Teléfono | 04141234567 | `04141234567` | ✅ |
| Web | www.qasmoke.test | `www.qasmoke.test` | ✅ |

**14/14 campos llenos en el móvil coinciden. Diffs: 0. Notas de zona horaria: 0.**

---

## Resumen

| Caso | Ref | Módulo | Marca |
|---|---|---|---|
| DW-COB-001 | 39236 | cobros | **WEB-CALC-MISMATCH** (`Descuento conversión` = 755 × tasa) |
| DW-COB-002 | 39237 | cobros | WEB-OK |
| DW-COB-003 | 39238 | cobros | WEB-OK (⚠ oculto por el filtro Moneda=BSD por defecto) |
| DW-COB-004 | 39239 | cobros | WEB-OK — **existe**, estatus "Por aprobar" |
| DW-CLT-001 | 1 | clientes_potenciales | WEB-OK (14/14) |

**Estatus que muestra la WEB para los 4 cobros: "Por aprobar"** — no "Enviado". Reportado literal, sin
deducirlo de `st_collection=3`. El filtro `Status` de la lista ofrece: Enviado · Por aprobar · Aprobado ·
Rechazado, y los 4 cayeron en "Por aprobar".

**Adjuntos:** los botones `Descargar adjuntos` / `Ver adjuntos` aparecen en **los 4** detalles, incluido
39238 que según BD tiene **0 adjuntos** ⇒ la presencia del botón **no** es indicador de existencia de
adjuntos.

## Patrones / selectores nuevos de la web (insumo de consolidación)

1. 🔴 **El filtro `Moneda` de `/pages/cobros` viene preseleccionado en `BSD` — genera falsos `WEB-MISSING`.**
   Un cobro en US$ **no aparece** aunque se filtre por su `# Ref` exacto. Antes de cantar `WEB-MISSING` en
   cobros hay que **reintentar con `Moneda = US$`**. Opciones: `""`=todas · `1`=BSD · `2`=US$.
2. **Los `<select>` de PrimeFaces están ocultos** → `browser_select_option` falla con TimeoutError. Patrón que
   sí funciona: `click [id$=":<campo>_label"]` → `click li[id$=":<campo>_<indice>"]` dentro de
   `[id$=":<campo>_panel"]`. Los `li` traen `data-label`.
3. **Anclar por sufijo, nunca a `j_idt*`** (auto-generados): `input[id$=":n_ref"]`, `button[id$=":ajax"]`
   (Buscar), `button[id$=":botonLimpiar"]`, `input[id$=":dateB_input"]`/`[id$=":dateF_input"]`,
   `select[id$=":idCurrency_input"]`, `[id$=":idEnterprise_input"]`, `[id$=":orderStatus_input"]`.
4. **Rango de fechas por defecto** = `01/{mes}/{año}` → hoy, idéntico en cobros y clientesPotenciales.
5. ⚠ **`leerCabecera()` NO alcanza en el detalle de cobro** — devuelve `''` para la cabecera superior porque
   el valor es la **hoja siguiente**, no un textNode del mismo padre. Sí funciona para el bloque de totales
   del pie. Receta: `leerHojas()` + emparejar `etiqueta:`→siguiente para la cabecera.
6. **Tablas del detalle de cobro:** pagos = `form:j_idt178` (auto-generado, anclar con
   `tablaPorColumnas(['Forma de pago','Monto cobrado'])`; sus columnas **varían por forma de pago**);
   documentos = `form:documentosPagadosDT` (semántico, estable, 22 columnas, ninguna oculta).
   Retención → tabla de pagos con `"No se encontraron registros."`. Anticipo → `documentosPagadosDT`
   **ausente**, no vacía.
7. **Nombres de columna contraintuitivos en `documentosPagadosDT`:** el descuento de un documento se muestra
   en **`Diferencia/Faltante`** (no en `Total descuento`), y su conversión en **`Descuento conversión`**.
   **No existe columna "Monto a pagar conversión"** — `nu_amount_paid_conversion` no tiene representación web.
8. **La lista de cobros es un oráculo de conversión gratis** (`Monto conv.`, `Por cobrar conv.`,
   `Diferencia cambiaria`, `Tasa conv.`) sin abrir el detalle. `Monto cobrado` **concatena un importe por
   pago** → hay que sumar.
9. **El total bruto (185.000) no se muestra en el detalle**, solo desagregado por pago; la cabecera muestra el
   neto y la diferencia.
10. **Estatus web de alipascua:** cobros recién enviados desde el móvil muestran **"Por aprobar"**, no
    "Enviado". Confirma la advertencia de no traducir `st_collection` con el catálogo genérico.
11. **Clientes potenciales:** la lista **duplica los `th`** (7 × 2 = 14) — leer por índice de `td`. El detalle
    **no tiene `No. de Ref.`**: la llave es `Código:` = epoch `co_client`. `Cédula::` viene con doble dos
    puntos. Botón de fila: `#form\:pedidosDT\:0\:consultar`.
12. **Convivencia web ‖ móvil reconfirmada:** pestaña 1 propia, sin tocar la pestaña 0 ni el CDP `:9220`;
    navegación directa por URL sin `ViewExpired` en ~8 min de sesión.
13. **El filtro JSF `# Ref` persiste, pero `browser_navigate` a la ruta lo resetea.**

---
*Generado por Claude Code · Agente WEB read-only · 2026-08-04*

---

# 2Âª tanda WEB â€” PEDIDOS y DEVOLUCIONES

Login `***`/`***` OK â†’ `/pages/main`. Guarda de playa verificada en cada pÃ¡gina:
`host=denarioelyaque.ddns.net:8080` â†’ `el_yaque` âœ… Â· empresa del filtro = **ALIPASCUA, C.A.** (Ãºnica opciÃ³n).
Read-only estricto: solo `Consultar`, `Buscar` y el filtro `# Ref`.

## PEDIDO Â· # Ref 4309 Â· `DW-PED-001` â†’ **WEB-OK**

| Campo | MÃ³vil / BD (BD-OK) | Web | âœ” |
|---|---|---|---|
| # Ref | 4309 | 4309 | âœ” |
| **Estatus (literal web)** | st_order=1 | **`Enviado`** Â· `Â¿Por Aprobar?: NO` | âœ” |
| CÃ³digo pedido (epoch) | 1785876691636.0 | 1785876691636.0 | âœ” |
| Fecha | 2026-08-04 | 04/08/2026 17:03:24 (envÃ­o 17:03:28) | âœ” mismo dÃ­a |
| Vendedor | 002 | Wilmen Lara | âœ” |
| Cliente | V28556138 RENZO FERNANDO MARTINEZ MEJIAS | idÃ©ntico | âœ” |
| Tipo pedido | id_order_type=2 | Nota | âœ” |
| Producto | 75992200000281 | 75992200000281 Â· DESINFECTANTE AROMA CEREZA 12X1LTRS | âœ” |
| Cantidad / unidad | 2 UNI | 2 UNIDAD | âœ” |
| AlmacÃ©n | co_warehouse 01 | ALMACEN | âœ” |
| Cond. pago | id_payment_condition=6 | CONTADO | âœ” |
| Comentario | Test-PED-SMOKE-170049 | Test-PED-SMOKE-170049 | âœ” |
| Coordenada | 11.0490588,-63.8649885 | 11.0490588,-63.8649885 | âœ” |
| Moneda / tasa | US$ Â· 746,6297 | `746,6297 BSD = 1 US$` | âœ” |

**Descuentos â€” ambos se reflejan:**

- Producto 5 %: la grilla rotula literalmente **`Descuento 5.0%: 0,089 US$`** â†’ `1,78 Ã— 0,05 = 0,089` âœ”
- Global 7 %: pie **`Descuento Global: 0,2367 US$`** â†’ `(1,691 Ã— 2) Ã— 0,07 = 0,23674` âœ”
- Pie **`Descuento : 0,4147 US$`** = `0,089Ã—2 + 0,23674 = 0,41474` âœ” (= `nu_amount_discount_total`)

**AritmÃ©tica explÃ­cita (todo cuadra):**

```
Precio base unit          1,7800 US$   -> 1,78 x 2 = 3,56 = Subtotal bruto / Monto Base Pedido  OK
Descuento 5 % unit        0,0890 US$   -> 1,78 x 0,05 = 0,089                                   OK
Importe - desct unit      1,6910 US$   -> 1,78 - 0,089 = 1,691                                  OK
Bruto de linea            3,3820 US$   -> 1,691 x 2
Descuento Global 7 %      0,2367 US$   -> 3,382 x 0,07 = 0,23674                                OK
Subtotal de linea         3,1453 US$   -> 3,382 x 0,93 = 3,14526  (= Monto Total Pedido)        OK
Conversion (x 746,6297):
  1,78     -> 1.329,000866   vs web 1.329,0009    OK
  0,089    ->    66,450043   vs web    66,4501    OK
  1,691    -> 1.262,550823   vs web 1.262,5509    OK
  3,14526  -> 2.348,344530   vs web 2.348,3445    OK  (= nu_amount_final_conversion BD)
  3,56     -> 2.658,001732   vs web 2.658,0017    OK
  0,23674  ->   176,757115   vs web   176,7571    OK
```

**Notas (no son mismatch):**

1. `ConversiÃ³n Descuento: 309,6273 BSD`. El crudo BD `0,41474 Ã— 746,6297 = 309,6572` (Î” 0,03 BSD). La web
   convirtiÃ³ el valor **ya redondeado a 4 decimales**. Artefacto de precisiÃ³n de display amplificado por la
   tasa; el total del pedido cuadra exacto. âš  Inconsistencia interna menor: `ConversiÃ³n Descuento Global` usa
   el crudo, `ConversiÃ³n Descuento` usa el redondeado.
2. **`IVA :` y `ConversiÃ³n IVA:` se rinden con la etiqueta pero SIN valor** (celda vacÃ­a), mientras
   `Descuento bonif.` sÃ­ imprime `0,0000 US$`. El mÃ³vil mandÃ³ `iva_pct=0 / nu_amount_tax=0`. CosmÃ©tico.
3. En este build la grilla de lÃ­neas **no tiene fila `IVA` ni `Importe + IVA`** â€” las 4 sub-etiquetas son
   `Precio base` Â· `Descuento X%` Â· `Importe - desct` Â· `Subtotal`.

### Veredicto de `PED-IVA-CONV-DIV-CANTIDAD` â†’ **NO REPRODUCE**

âš  El orÃ¡culo textual del defecto (IVA de lÃ­nea convertido Ã· cantidad) **no es literalmente aplicable**: este
pedido tiene **IVA 0 %** y la grilla ni siquiera rinde las celdas `IVA` / `Importe + IVA`. Aun asÃ­ la prueba
autocontenida fue concluyente por proporcionalidad:

```
ratio conv / US$ por celda de la grilla (cantidad = 2):
  Precio base       1.329,0009 / 1,7800  = 746,6297   <- = tasa exacta
  Descuento 5 %        66,4501 / 0,0890  = 746,6303   <- = tasa (redondeo del 4o decimal)
  Importe - desct   1.262,5509 / 1,6910  = 746,6297   <- = tasa exacta
  Subtotal (linea)  2.348,3445 / 3,1453  = 746,6297   <- = tasa exacta
```

Ninguna celda aparece dividida entre 2 (un Ã·cantidad darÃ­a ratio 373,3). AdemÃ¡s la identidad
`Importe-desct Ã— cantidad = Subtotal` **falla igual en las dos columnas y por el mismo factor** (el descuento
global del 7 %), no por un sesgo de conversiÃ³n:

```
US$ :   1,691       x 2 = 3,382        -> 3,1453     => factor 0,930000
conv:   1.262,5509  x 2 = 2.525,1018   -> 2.348,3445 => factor 0,930000   (identico => sin sesgo por columna)
```

â‡’ **No reproduce en este build de El Yaque.** Queda pendiente re-verificarlo con un pedido **con IVA â‰  0**,
que es el escenario exacto del defecto (las celdas afectadas no existen cuando IVA = 0).

## DEVOLUCIÃ“N Â· # Ref 73 Â· `DW-DEV-001` â†’ **WEB-OK**

| Campo | MÃ³vil / BD (BD-OK) | Web | âœ” |
|---|---|---|---|
| # Ref | 73 | 73 | âœ” |
| **Estatus (literal web)** | st_return=1 | **`Enviado`** (en la lista; el detalle no muestra Estatus) | âœ” |
| Fecha | 2026-08-04 | 04/08/2026 17:33:26 | âœ” mismo dÃ­a |
| Vendedor | 002 | Wilmen Lara | âœ” |
| Empresa | ALIP_BSD (id 2) | ALIPASCUA, C.A. | âœ” |
| Cliente | V28556138 / RENZO FERNANDO MARTINEZ MEJIAS | idÃ©ntico | âœ” |
| Tipo devoluciÃ³n | 52 = PostVenta | **PostVenta** | âœ” |
| Responsable | QA AUTOMATIZACION | QA AUTOMATIZACION | âœ” |
| Precinto | PRE-0804 | PRE-0804 | âœ” |
| Observaciones | Devolucion QA smoke 20260804 - producto en mal estado | idÃ©ntico | âœ” |
| Coordenada | 11.0490433,-63.8649956 | 11.0490433,-63.8649956 | âœ” |
| Producto | 7591473004525 ACEITE DE OLIVA EXTRA VIRGEN MARY 12X500 GRS | idÃ©ntico | âœ” |
| Cantidad | 2 | 2 | âœ” |
| Unidad (`DevoluciÃ³n en`) | UNI | UNI | âœ” |
| **NÂ° Factura** (`coDocument`) | 46986 | 46986 | âœ” |
| Motivo | id 34 = Empaque Roto/Mal Sellado (Calidad) | **Empaque Roto/Mal Sellado (Calidad)** | âœ” |
| Lote / Fecha vencimiento | vacÃ­o en el mÃ³vil | vacÃ­o | saltado (local-driven) |

**Sin orÃ¡culo de importes:** confirmado que el detalle de devoluciones **no muestra ninguna columna de
dinero**. Coherente con `WEB-RUNTIME Â§7`.

**Nota:** el detalle de devoluciÃ³n **no expone el epoch** (`co_return 1785879207191.0` no aparece) â€” la Ãºnica
llave web es el `No. de Ref.`. Contrasta con pedidos, que sÃ­ rinde `CÃ³digo pedido:`.

## Patrones nuevos de la 2Âª tanda

1. **La sesiÃ³n web NO sobrevive entre agentes.** La pestaÃ±a quedÃ³ viva pero `browser_navigate` redirigiÃ³ a
   `login.xhtml`. PatrÃ³n: navegar, comprobar el pathname y **re-loguear si cayÃ³ en login**.
2. ðŸ”´ **CORRIGE el aprendizaje de la 1Âª tanda: el filtro `Moneda` NO siempre viene en BSD.** En
   `/pages/pedidos` de El Yaque hoy vino preseleccionado en **`US$` (value=2)**. La regla real es **leer el
   `value` del select antes de buscar**, no asumir ninguna moneda.
3. **`/pages/devoluciones` no tiene filtro `Moneda`** (ni `Tipo`): solo Empresa Â· # Ref Â· Vendedor Â· Cliente Â·
   rango de fechas Â· Tiene Adjunto Â· Status. El falso-MISSING por moneda no puede pasar ahÃ­.
4. **Los prefijos de los formularios de filtro cambian por mÃ³dulo** (`form:j_idt116:*` pedidos,
   `form:j_idt115:*` devoluciones). Anclar por sufijo funciona en ambos.
5. **`leerCabecera()` devuelve TODO vacÃ­o en `/pages/detalleDevolucion`** (11 claves con `''`) â†’ usar
   `leerHojas()`+emparejar sÃ­ o sÃ­. En **detallePedido** sÃ­ funciona **para el bloque de totales del pie**.
6. **La grilla de lÃ­neas del detalle de pedido mete 4 sub-campos dentro de UNA celda** (`Precio base:` Â·
   `Descuento X%:` Â· `Importe - desct:` Â· `Subtotal:` concatenados). Hay que parsear la celda por
   sub-etiquetas. La etiqueta del descuento **lleva el porcentaje literal** (`Descuento 5.0%:`) â†’ sirve para
   verificar el % de descuento de producto sin BD.
7. **Grilla de devoluciones = `form:j_idt170`** (auto-generado) â†’ anclar por
   `tablaPorColumnas(['NÂ° Factura','Motivo','Cantidad'])`.
8. **`Observaciones` no lleva `:`** en detalleDevolucion â€” se pierde con el emparejado estÃ¡ndar; viene como
   hoja suelta despuÃ©s de `Precinto`.
9. **Estatus en El Yaque (dato del dÃ­a):** pedidos y devoluciones enviados desde el mÃ³vil muestran
   **`Enviado`**, no "Por aprobar" (a diferencia de cobros hoy). El detalle de pedido aÃ±ade
   `Â¿Por Aprobar?: NO`; el detalle de devoluciÃ³n **no muestra Estatus** (solo la lista).
10. **Opciones del `<select>` Status de pedidos:** `0=todas` Â· `2=Por aprobar` Â· `6=Enviado` Â· `-1=Guardado`.
    Tipo Pedido: `2=Nota` Â· `3=Factura`.
11. **Vendedor 002 = `468 = Wilmen Lara`** en el select de vendedores de El Yaque (confirmado por value).


---

# 3Âª tanda (2026-08-05) â€” INVENTARIOS + DEPÃ“SITOS Â· â›” NO EVALUABLE: el host sirve OTRO TENANT

> âœ… **CAUSA CONFIRMADA POR LA QA (2026-08-05):** el cliente **alipascua fue MIGRADO de playa**. No es un
> fallo de la web ni un error de filtro del agente. Se documenta porque la detecciÃ³n automÃ¡tica funcionÃ³ y
> deja una lecciÃ³n de mÃ©todo.

Playa objetivo: **el_yaque** Â· `http://denarioelyaque.ddns.net:8080/DenarioPremium`
Login `***`/`***` â†’ `/pages/main` OK (HTTP 200, sin ViewExpired). **La web responde perfecto.**
Lo que falla no es el sitio: **es la identidad de la base que hay detrÃ¡s de esa URL.**

## ðŸ”´ WEB-INFRA-001 â€” el DDNS sirve otro tenant entre el 04 y el 05/08

| Evidencia | 04/08 (1Âª/2Âª tanda) | 05/08 (mismo host+puerto) |
|---|---|---|
| Empresas del filtro `idEnterprise` | **ALIPASCUA, C.A.** â€” Ãºnica, `n=1` | `*DISTRIBUIDORA DIAZ HERNANDEZ *` Â· `DIFRANCA C.A` Â· `DISTRIBUIDORA DH VITAL, C.A.` â€” `n=3`, **sin ALIPASCUA** |
| Vendedor `002` | `id 468` = **Wilmen Lara**, presente | **no existe id 468**; el select trae 274-291 |
| Cobros del 04/08 en `/pages/cobros` | `# Ref` **39236-39239**, tasa **746,6297** | `# Ref` **21819** y **21809**, tasas **752,09** y **748,79** |
| `# Ref 39236` buscado explÃ­cito | aparece (WEB-CALC-MISMATCH) | **"No se encontraron registros"** |
| DepÃ³sitos 01â†’05/08 | control `id_deposit=1` BANESCO 600.000 BSD | **0 registros en las 3 empresas** |

Mismo usuario, misma URL, mismo puerto, **rango de `# Ref` de otro orden de magnitud** (21,7k vs 39,2k)
â‡’ no es un filtro mal puesto ni un permiso: **es otra base de datos**. Reconfirmado tras re-login limpio.

**Sondeo de las 4 playas conocidas con el mismo usuario web:** ALIPASCUA, C.A. **no es visible en ninguna**
(el_yaque â†’ DIAZ HERNANDEZ/DIFRANCA/DH VITAL Â· caribe â†’ CENTRAL FOODS Â· la_tortuga â†’ HC TRADING/GLOBAL M&P Â·
isla_coche â†’ CENTRAL EL PALMAR/DESTILERIA YARACUY).

**Arquitectura de puertos:** el mÃ³vil escribe contra `:8081/PremiumWS/services/`, la web vive en
`:8080/DenarioPremium`. Hoy `:8081/PremiumWS/` sigue desplegado (responde 403, no 404). Un `HTTP 200` en la
web **no** prueba que la API ni el tenant sean los de la corrida.

## ENCARGO 1 â€” INVENTARIO # Ref 5 Â· `DW-INV-001` â†’ **WEB-N/A**

| VerificaciÃ³n pedida | Resultado |
|---|---|
| a. Â¿Aparece? | **No evaluable** â€” ninguna de las 3 empresas disponibles es ALIPASCUA |
| b. Estatus literal | no observable |
| c. Cabecera (cliente/fecha/vendedor/empresa/comentario/coordenada) | no observable |
| d. Detalle (producto, cantidad, unidad, tipo existencia) | no observable |
| e. Lote / vencimiento espurios (`da_expiration:"2026-08-04"` con `nu_batch:""`) | **âš  QUEDA ABIERTO** â€” punto de mÃ¡s riesgo del encargo, sin mirar |
| f. AritmÃ©tica de montos | **el mÃ³dulo no maneja montos**: columnas = `Detalle Â· # Ref Â· Estatus Â· Fecha creaciÃ³n Â· Vendedor Â· Cliente`. Sin orÃ¡culo de dinero |

**No se marca `WEB-MISSING`**: el registro estÃ¡ `BD-OK` en la nube de ALIPASCUA; la base que hoy responde en
esa URL no es esa. Un MISSING serÃ­a un falso positivo contra una BD ajena.

## DepÃ³sito DM-DEP-017 â€” Â¿llegÃ³ o no? â†’ **RESUELTO POR BD, no por web**

La verificaciÃ³n web quedÃ³ `WEB-N/A` por doble motivo: (1) tenant ajeno â€” el **control positivo tambiÃ©n
desaparece** (`id_deposit=1` BANESCO 600.000 BSD, que *tenÃ­a* que estar), y cuando el control positivo falla
lo que se estÃ¡ midiendo es la base, no el envÃ­o; (2) `gatePorBD('BD-QUEUED')` â†’ `{evaluar:false,
marca:'WEB-N/A'}`: **un `BD-QUEUED` no puede dar `WEB-MISSING` nunca**, la web no puede mostrar lo que no
recibiÃ³.

ðŸ”´ **Pero la BD nube de alipascua SÃ es accesible (es independiente de la playa) y cierra el caso:**

```
SELECT ... FROM deposit  â†’  1 sola fila: id_deposit=1, 600.000,0000 BSD, banco 0134, da_update 20:03:17
                            (el preexistente de QA; NUESTRO DEP-QA-0804 de 5.000 BSD NO ESTÃ)

Ultima actividad por tabla (prueba de que la BD seguia VIVA y recibiendo despues del envio):
  collection    1124 filas   ultimo 2026-08-04 20:11:15
  order         4032 filas   ultimo 2026-08-04 21:03:28
  return           2 filas   ultimo 2026-08-04 21:38:53   <- DESPUES del intento de deposito
  client_stock     5 filas   ultimo 2026-08-04 22:24:39   <- DESPUES del intento de deposito
  deposit          1 fila    ultimo 2026-08-04 20:03:17   <- CONGELADO en el baseline
  visit           13 filas   ultimo 2026-08-04 19:34:34
```

**Veredicto: el depÃ³sito NUNCA llegÃ³, y no fue por sync diferida.** La devoluciÃ³n (21:38) y el inventario
(22:24) entraron a la nube **despuÃ©s** del intento de envÃ­o del depÃ³sito (~21:00), con el mismo dispositivo y
la misma cola. El canal estaba vivo; el `deposit` es el Ãºnico tipo que no se despachÃ³. **DM-DEP-017 queda
confirmado como FAIL real**, ~24 h despuÃ©s.

## Cotejo del manifiesto â€” cobertura web final

| MÃ³dulo | Caso | Ref | Marca BD | Cotejo web |
|---|---|---|---|---|
| clientes | DM-CLT-026 | 1 | BD-OK | âœ… `DW-CLT-001` WEB-OK |
| pedidos | DM-PED-031 | 4309 | BD-OK | âœ… `DW-PED-001` WEB-OK |
| devoluciones | DM-DEV-018 | 73 | BD-OK | âœ… `DW-DEV-001` WEB-OK |
| inventarios | DM-INV-022 | 5 | BD-OK | â›” **WEB-N/A** â€” Ãºnico `BD-OK` sin cotejo web |
| depositos | DM-DEP-017 | null | BD-QUEUED | â›” WEB-N/A por gate (resuelto por BD) |
| cobros | â€” | 39236-39239 | (QA a mano) | âœ… 1Âª tanda: 3 WEB-OK + 1 WEB-CALC-MISMATCH |

**Read-only:** no se tocÃ³ ningÃºn control de escritura. Solo `Buscar`, `<select>` de filtro y navegaciÃ³n por URL.

## Patrones nuevos de la 3Âª tanda (los mÃ¡s valiosos de la corrida)

1. **ðŸ”´ La guarda de playa por HOST no detecta un cambio de TENANT.** `verificarContexto(...,'el_yaque').ok`
   dio `true` todo el tiempo mientras la web servÃ­a datos de otro cliente. **Hace falta una guarda de EMPRESA:**
   antes de leer, comprobar que el `<select id$=":idEnterprise_input">` contiene la empresa esperada del YAML.
   `verificarEmpresa(opciones, 'ALIPASCUA')` â†’ si no estÃ¡, `WEB-N/A` inmediato, sin barrer. Es la Ãºnica
   comprobaciÃ³n que habrÃ­a evitado un falso MISSING hoy.
2. **Fingerprint barato de tenant:** el par (lista de empresas, presencia del `id` de vendedor esperado)
   identifica la base en **una sola** llamada `browser_evaluate`, antes de cualquier `Buscar`.
3. **El orden de magnitud del `# Ref` es un detector de base equivocada** (39,2k vs 21,7k). Si las refs del
   dÃ­a estÃ¡n en otro orden que las del manifiesto, sospechar de la base antes que del registro.
4. **Cambiar el `<select>` Empresa BORRA el filtro `# Ref`** (queda `value=""`), igual que `browser_navigate`.
5. **El bundle `__qaW` no sobrevive a `browser_navigate`** â†’ reinyectar `BUNDLE_DOM` en **cada** pÃ¡gina.
6. **La sesiÃ³n web es por host:** saltar a otra playa tumba la sesiÃ³n de la anterior. Re-loguear tras sondeos.
7. **Columnas reales de las listas:** inventarios â†’ `Detalle Â· # Ref Â· Estatus Â· Fecha creaciÃ³n Â· Vendedor Â·
   Cliente` (**sin montos**); depÃ³sitos â†’ `â€¦ Â· Banco Â· NÂ° Planilla Â· Monto depositado Â· Monto depositado conv.
   Â· Tasa conv.`
8. **Registrar en el YAML del cliente el par (web `:8080`, API `:8081`)** y validarlo por empresa, no por host.

