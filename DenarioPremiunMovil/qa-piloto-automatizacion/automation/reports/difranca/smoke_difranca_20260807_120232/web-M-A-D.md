# WEB — familias `M##` (muestreo BD↔web) · `A##` (adjuntos) · `D##` (comportamiento) + cotejo de registros nuevos

**RUN_ID:** `20260807_120232_smoke-difranca-tag20` · **Cliente:** difranca · **Playa:** EL YAQUE
(`denarioelyaque.ddns.net:8080`) · **Empresa principal:** DDHP_A12 · **Vendedor:** `Jose  Raad` (id_user 275)
**Modo:** READ-ONLY (solo `Buscar` / `Limpiar` / `<select>` de filtro / `Consultar` / adjuntos / paginación / ordenamiento)
**Fecha:** 2026-08-07

---

## Resumen ejecutivo

| Familia | Casos | WEB-OK | CALC-MISMATCH | FIELD-MISMATCH | MISSING | BLOCKED (N/A) |
|---|---|---|---|---|---|---|
| `C##` cotejo registros nuevos | 3 | 3 | — | — | — | — |
| `M##` muestreo BD↔web | 12 | 7 | 2 | 2 | 1 | — |
| `A##` adjuntos | 4 | 3 | — | — | — | 1 |
| `D##` comportamiento | 6 | 6 | — | — | — | — |
| **Total** | **25** | **19** | **2** | **2** | **1** | **1** |

**Registros muestreados: 109** — cobros 41 · pedidos 20 · devoluciones 20 · visitas 18 · clientes potenciales 20.
Cobertura: **las 3 empresas** (DDHP_A12 · DIFRANCA C.A · DH VITAL), **ambas monedas** (BSD y US$/USD),
**5 meses distintos** (oct-2024, feb-2025, jun/jul/ago-2026) y **los 4 `co_type`** que existen en la BD.

**Lo que decide el GO/NO-GO:** el único defecto de producto que reproduce sobre datos creados **hoy en tag 20**
es **`COB-RET-TOTAL-CERO`**, y difranca **sí usa el flujo de retención**. Todo lo demás que reproduce es
daño histórico o comportamiento ya conocido. No apareció ningún defecto nuevo de cálculo.

---

## `C##` — cotejo de los registros nuevos

Los 2 ya cotejados por la tanda anterior (cliente potencial 60, pedido 39795) no se repiten. El manifiesto
creció durante esta corrida y sumó la **visita 28223**, que también se cotejó.

| Caso | Módulo | Ref | Qué se verificó | Marca |
|---|---|---|---|---|
| `DW-DEV-C01` | devoluciones | **878** | 12 campos + lote + vencimiento | ✅ `WEB-OK` |
| `DW-PED-C13` | pedidos | **39796** | total, conversión, 55 líneas | ✅ `WEB-OK` |
| `DW-VIS-C01` | visitas | **28223** | cabecera, incidencia, descripción 120 chars | ✅ `WEB-OK` |

### Devolución 878 — `WEB-OK`

Pedido explícito: *verificar que la web muestre lote y vencimiento con esos valores exactos*.

| Campo | Móvil / BD | Web | |
|---|---|---|---|
| **Lote** | `LOTE-QA-2026` | `LOTE-QA-2026` | ✅ |
| **Fecha vencimiento** | `2027-03-15` | `15/03/2027` | ✅ |
| N° Factura | `5000098151` | `5000098151` | ✅ |
| Cantidad | 2 | 2 | ✅ |
| Cliente | CAR755 MULTIDISTRIBUIDORA JAKE, C.A | idem | ✅ |
| Empresa | DDHP_A12 | `*DISTRIBUIDORA DIAZ HERNANDEZ *` | ✅ |
| Precinto (`nu_seal`) | `PRE-DEV-001` | `PRE-DEV-001` | ✅ |
| Tipo (`id_type` 60) | Calidad | `Calidad` | ✅ |
| Motivo (`id_motive` 50) | — | `Producto con particulas extrañas (Inocuidad)` = `return_motive.na_motive` | ✅ |
| Comentario | `Test-DEV-SMOKE difranca tag20` | idem, bajo la etiqueta **`Observaciones`** | ✅ |
| Coordenada | `11.0490579,-63.864991` | idem | ✅ |
| Responsable | QA Automatizacion | idem | ✅ |

⚠ **No hubo sync diferida**: la devolución ya estaba visible al primer intento (no hizo falta reintentar).
⚠ Como manda el guión, **no se construyó oráculo de importes** (devoluciones no maneja montos).

### Pedido 39796 — `WEB-OK` (55 líneas)

| Campo | BD | Web | |
|---|---|---|---|
| Total items | 55 | 55 | ✅ |
| **Líneas renderizadas** | 55 | **55** (sin paginar) | ✅ |
| Monto Base / Total | 1 335 230,5024 BSD | `1.335.230,50 BSD` | ✅ |
| Conversión | 1 775,36 US$ | `1.775,36 US$` | ✅ |
| Tasa | 752,09 | `752,09 BSD = 1 US$` | ✅ |
| Código pedido (epoch) | `1786125284808.0` | idem | ✅ |
| Comentario / Responsable | `Test-PED-55LINEAS envio tag20` / `QA Carga 55` | idem | ✅ |

**Conversión:** `1.335.230,50 ÷ 752,09 = 1.775,36` ✅ (BSD→US$ divide).

**Σ de los 55 subtotales mostrados = 1.335.230,41**, contra cabecera `1.335.230,50` → **diferencia 0,09 BSD**.
**No es defecto.** Verificado en BD:

```
Σ nu_amount_total exacto            = 1 335 230,5024   → es lo que muestra la cabecera
Σ round(nu_amount_total, 2)         = 1 335 230,41     → es lo que muestra la suma de líneas
```
La web imprime cada línea redondeada a 2 decimales y el total desde el valor exacto; con 55 líneas el
redondeo acumula hasta ±0,275. La web es **fiel** a la BD en ambos extremos.

### Visita 28223 — `WEB-OK`

Ref, cliente CAR755, actividad `VENTA - REVENTA` (idType 2), motivo `EFECTIVA` (idMotive 262), status
`visitado` (st_visit 2), fecha enviada `07/08/2026 14:18:30` (= `da_real`), **1 incidencia** y descripción de
**120 chars exactos** (`Test-VIS-015-difranca-tag20 ` + 92 `X`) — todo ✅.
`Editar` y `Eliminar` **existen** por fila (se verificó su presencia; **nunca se pulsaron**).

⚠ **Falso positivo evitado:** la columna `Geo` dice `Falta Coordenada (Sucursal)` aunque el móvil sí mandó
coordenada. Se comprobó en BD que **`address_client.coordenada` de la sucursal 54331 está vacía**, mientras
`visit.coordenada` = `11.049043,-63.8649961` sí existe y el detalle la pinta. El aviso es **correcto** y se
refiere a la sucursal, no a la visita. **No es defecto.**

---

## `M##` — muestreo BD↔web

### Cobros — 41 registros (la familia donde apareció todo)

| Lote | Empresa | Rango | N | Resultado |
|---|---|---|---|---|
| junio-2026 | DDHP_A12 | 01–30/06/2026 | **25** | 25/25 OK en campos y aritmética |
| agosto-2026 | DIFRANCA C.A | 01–07/08/2026 | **5** | 3/5 OK · 2 `WEB-CALC-MISMATCH` (retenciones) |
| julio-2026 | DH VITAL | 01–31/07/2026 | **10** | 10/10 OK |
| oct-2024 | DDHP_A12 | ref 1590 | **1** | daño histórico (ver abajo) |

**Campos contrastados y resultado (los 25 de junio, contra `collection` + `collection_payment`):**

| Columna web | Campo BD | Aciertos |
|---|---|---|
| `# Ref` | `id_collection` | 25/25 |
| `Fecha Cobro` | `da_collection` | 25/25 |
| `Cliente` | `na_client` | 25/25 |
| `Total por cobrar` | `nu_amount_final` | 25/25 |
| `Monto cobrado` | Σ `nu_amount_partial` | 25/25 |
| `Diferencia cobro` | `nu_difference` | 25/25 |
| `Tasa conv.` | `nu_value_local` | 25/25 |
| `Monto conv.` | `nu_amount_total_conversion` | 25/25 |

**Oráculo `Diferencia cobro = Total por cobrar − Σ pagos` — se cumple 25/25.** Muestra de la cuenta:

```
20818:   990.983,77 − 828.668,85 = 162.314,92   ✅ (BD nu_difference = 162314.92)
20816: 1.084.334,96 − 356.822,38 = 727.512,58   ✅
20803:       491,00 − (101,00+160,00+230,00) = 0,00  ✅  (3 pagos)
20795:    32.555,80 −  32.555,27 =      0,53   ✅
20813:       974,69 − (125.000,00+213.301,11) = −337.326,42  ✅
```

**Conversiones — verificadas con la tasa del propio registro (`nu_value_local`), 41/41 correctas.**
La dirección **depende de la moneda del cobro** y la web acierta en ambas:

```
BSD → US$ (dividir):     990.983,77 ÷ 592,52 = 1.672,49  ✅   (cobro 20818)
                          891.372,00 ÷ 742,81 = 1.200,00  ✅   (cobro 21643, empresa DH VITAL)
                        7.937.060,87 ÷ 737,88 = 10.756,57 ✅   (cobro 21616)
US$ → BSD (multiplicar):     196,04 × 752,09 = 147.439,72 ✅   (cobro 21826)
                             500,00 × 752,09 = 376.045,00 ✅   (retención IVA de 21826)
                           1.671,14 × 742,81 = 1.241.339,50 ✅ (cobro 21651)
```
⚠ `parseMoneda()` **no hizo falta forzar**: `verificarConversion()` no devolvió `ok:null` en ningún caso
porque la web rotula con `BSD`/`US$`/`USD`, todos reconocidos por el helper ya corregido.

#### Los 3 `co_type=2` (retención) — verificados los 3, como pedía el guión

**Oráculo:** `Total a pagar = Σ(Monto a pagar por doc) = Ret.IVA + Ret.ISLR` (el saldo NO participa).

| Ref | Fecha | Moneda | Ret.IVA | Ret.ISLR | Esperado | **Web (detalle)** | BD `nu_amount_final` | Web (lista) | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| **21829** | 07/08/2026 | BSD | 1.000,00 | 500,00 | **1.500,00** | **0,00** ❌ | 1500 ✅ | 1.500,00 ✅ | `WEB-CALC-MISMATCH` |
| **21826** | 07/08/2026 | USD | 500,00 | 400,00 | **900,00** | **0,00** ❌ | 900 ✅ | 900,00 ✅ | `WEB-CALC-MISMATCH` |
| **1590** | 09/10/2024 | BSD | 0,00 | 0,00 | 0,00 | 0,00 | **0** (dañado) | 0,00 | daño histórico |

**La cuenta, explícita:**
```
21829:  Ret.IVA 1.000,00 + Ret.ISLR   500,00 = 1.500,00  = Σ(Monto a pagar)= 1.500,00  = BD 1500
        pero el detalle imprime  Total Monto a pagar: 0,00 BSD   →  faltan 1.500,00
21826:  Ret.IVA   500,00 + Ret.ISLR   400,00 =   900,00  = Σ(Monto a pagar)=   900,00  = BD 900
        pero el detalle imprime  Total Monto a pagar: 0,00 USD   →  faltan   900,00
```

🔑 **Localización nueva y útil:** el cero está **solo en `detalleCobro`**. La **lista** muestra
`Total por cobrar` = 1.500,00 / 900,00 **correctamente**, y **la BD guarda bien** (`nu_amount_final` 1500/900).
⇒ En tag 20 **el dato que manda la app y lo que persiste ya es correcto**; lo que sigue roto es el
**pie de totales del detalle** cuando `co_type=2`.
Se acotó además que **no afecta a `co_type=0`**: el cobro 21827 (misma empresa, mismo día) imprime
`Total Monto a pagar: 10.000,00 BSD` ✅ y su conversión `10.000,00 ÷ 752,09 = 13,30 US$` ✅.

El cobro **1590** exhibe además el conocido *«el documento sin retención guarda `nu_amount_paid` con su
saldo íntegro»*: `Monto a pagar = 49.982,12` con `Ret.IVA = Ret.ISLR = 0,00`. En la lista aparece
`Total por cobrar 0,00` y `Por cobrar conv. N/A` — coherente con `nu_amount_final = 0` en BD (daño ya escrito).

#### Observación de datos (no es defecto de la web): pagos en BS contra cobros en US$

En **6 de 25** filas de junio y en **6 de 10** de DH VITAL, la columna `Monto cobrado` rotula los pagos con la
**moneda del cobro**, produciendo importes absurdos:

```
20813  Total por cobrar 974,69 US$   ·  pagos "125.000,00 US$" + "213.301,11 US$"
21717  Total por cobrar 4.373,27 US$ ·  pagos "1.949,55" + "2.229.690,00" + "1.023.078,70" US$
       → Diferencia cobro −3.250.344,98 US$
```
Se verificó en BD que `collection_payment` **no guarda moneda propia** (`nu_amount_partial` a secas) y que
`nu_amount_partial_conversion` se calcula **multiplicando** por la tasa, es decir tratando el pago como US$.
**La web es fiel a la BD**; el problema es de modelo de datos y es **anterior a tag 20** (los registros son de
junio/julio 2026). Se reporta para que QA decida, **no como regresión**.

#### ⚠ Falso positivo detectado y descartado (queda documentado para no repetirlo)

Durante el muestreo pareció que **`Monto conv.` duplicaba `Por cobrar conv.`** (idénticas en 25/25 filas)
mientras BD tenía un valor distinto para la conversión de lo cobrado (Σ `nu_amount_partial_conversion`).
**Se comprobó antes de reportarlo y NO es defecto:** son dos campos distintos —
`nu_amount_total_conversion` y `nu_amount_final_conversion`— que **coinciden siempre que
`nu_amount_final == nu_amount_total`**, lo cual es el caso en todo `co_type=0`. El cobro **1590** lo prueba:
ahí divergen (`1.229,27 US$` vs `N/A`). Se mantiene vigente el anti-patrón de `_comunes.md`:
**`Monto conv.` no se deriva de `Monto cobrado`**.

### Pedidos — 20 registros · **20/20 `WEB-OK`**

Junio-2026, empresa DDHP_A12. Contra `order` + `order_detail`:

| Columna web | Campo BD | Aciertos |
|---|---|---|
| `Monto Base` / `Monto Total` | `nu_amount_total_base` / `nu_amount_total` | 20/20 |
| `Monto conv.` | `nu_amount_total_conversion` | 20/20 |
| `Total items` | `nu_details` = `count(order_detail)` | 20/20 |
| `Tasa conv.` | `nu_value_local` | 20/20 |
| `Cliente` · `Fecha creación` · `Estatus` | — | 20/20 |

**Σ líneas == cabecera en 20/20.** Conversión (US$→BSD, multiplica):
```
38943: 3.253,44 × 623,02 = 2.026.958,19  ✅
38940: 2.065,92 × 622,21 = 1.285.436,08  ✅
38923:   115,56 × 623,02 =    71.996,19  ✅
```

### Devoluciones — 20 registros · `WEB-FIELD-MISMATCH` en 1 columna

Cabecera y líneas correctas; el detalle de la **874** (5 líneas, la más rica del lote) cuadra 5/5 en
producto, **lote**, **vencimiento**, cantidad y motivo contra `return_detail`.

❌ **La columna `Estatus` sale VACÍA en las 20 históricas**, mientras la 878 (de hoy) muestra `Enviado`.
Causa raíz confirmada en BD: la lista **no lee `st_return`** (que vale `1` en las 795 devoluciones, idéntico
en históricas y nuevas) sino **`transaction_statuses`**, tabla que **solo tiene 2 filas para devoluciones**
—justamente 877 y 878, las creadas hoy—. ⇒ **793 de 795 devoluciones muestran el estatus en blanco.**
No es regresión de tag 20: al contrario, **tag 20 es la primera versión que puebla esa tabla** para
devoluciones. Es un hueco de *backfill* con impacto visible en la UI.

### Visitas — 18 registros · **18/18 `WEB-OK`**

Julio-2026, empresa DDHP_A12. Ref, `Fecha Programada` (`da_visit`), `Fecha Enviada` (`da_real`),
`Status` (`st_visit`=2 → `visitado`) y `Cod. Cliente` coinciden 18/18.
✅ **`VIS-WEB-LISTA-DUPLICA` NO reproduce**: 18 filas, 18 `Ref` únicos, cero duplicados.

### Clientes potenciales — 20 registros · `WEB-FIELD-MISMATCH` (vendedor)

`# Ref`, `Fecha`, `Rif. Cliente`, `Cliente` y `Responsable` coinciden **20/20** contra `potential_client`.
❌ **`Vendedor` pierde el apellido en 20/20** — reproduce el `CLT-VENDEDOR-SIN-APELLIDO` que ya levantó la
tanda `C##`. **Aporte nuevo: la causa raíz.**

```
users.name_user     = 'Jose'          ← es lo ÚNICO que pinta clientes potenciales
users.lastname_user = 'Raad' / 'Ibarra' / 'Flores'   ← existe y está poblado
salesman_view.na_user = 'Jose Raad'   ← la vista que YA da el nombre completo (la usan los demás módulos)
```
**Impacto medido:** las refs 58→36 son `id_user=279` (**Jose Ibarra**) y la ref 60 es `id_user=275`
(**Jose Raad**); las 20 filas muestran `Jose` ⇒ **dos vendedores distintos son indistinguibles en pantalla**.

---

## `A##` — adjuntos

🔴 Todos los ZIP descargados fueron **borrados** al terminar cada caso, barriendo **las dos** ubicaciones
(`DenarioPremiunMovil/` y `DenarioPremiunMovil/.playwright-mcp/`). Verificado: 0 archivos remanentes.

**Oráculo usado:** `transaction_image` + `transaction_files` (NO `nu_attachments`).
En difranca `transaction_signatures` está **vacía** para cobros, así que aquí ambos criterios coinciden.

| Caso | Registro | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| `DW-COB-A01` | cobro **21826** · `Descargar adjuntos` | 3 (2 img + 1 arch) | **3** · `PK\x03\x04` · 172.423 B · 315 ms · `failure()`=null | ✅ |
| `DW-COB-A02` | cobro **21826** · `Ver adjuntos` | visor abre | diálogo `Adjuntos` con las 2 imágenes cargadas (720 px) | ✅ |
| `DW-DEV-A03` | devolución **878** (sin adjuntos) | botones inhabilitados | `disabled=true` + `aria-disabled` + `ui-state-disabled` en **ambos** | ✅ |
| `DW-COB-A04` | cobro **1590** (oct-2024) | descarga | **sin evento `download` en 2 intentos** | ⛔ BLOCKED |

**Contenido del ZIP de 21826 — cuadra exacto:**
```
BD:  transaction_image = 2   ·  transaction_files = 1   ⇒ esperado 3
ZIP: 21826_0.jpeg (108.052 B) · 21826_1.jpeg (93.205 B) · 21826_0.pdf (5.013 B)  ⇒ 3  ✅
```
El caso **sin adjuntos** se validó por **atributo**, no por presencia: los botones existen pero están
`disabled` — comportamiento **correcto**, no defecto.

⚠ **`A04`:** el cobro de 2024 no dispara descarga (2 intentos, 25 s y 30 s de espera, sin diálogo ni error
visible), mientras uno creado hoy descarga en **315 ms**. Sugiere que el binario histórico ya no está en el
almacenamiento. Se deja como **BLOCKED / a confirmar por infra**, no como defecto de producto.

---

## `D##` — comportamiento

| Caso | Qué se probó | Resultado |
|---|---|---|
| `DW-PED-D01` | Paginación | ✅ 12 páginas, 50/100/200 por página, `Última` navega bien |
| `DW-PED-D02` | **Contador vs BD** | ✅ 11×50 + 29 = **579** = `count(order)` empresa 2 junio-2026 |
| `DW-PED-D03` | **Ordenamiento por `Monto Base`** | ✅ **numérico correcto** |
| `DW-PED-D04` | Lista vacía | ✅ `No se encontraron registros.`, paginador se mantiene |
| `DW-PED-D05` | Columnas y formato de importes | ✅ es-VE con separador de miles y 2 decimales; **ningún float crudo** |
| `DW-COB-D06` | Columnas esperadas de cobros | ✅ las 17 presentes |

**`D03` en detalle — `WEB-ORDENAMIENTO-NO-ORDENA` NO reproduce.** Se descartó el falso «ordena bien»
comprobando que **cruza magnitudes**: la página 1 arranca en `18,48` y **no** contiene los `1.xxx`
(un orden alfabético habría puesto `1.287,36` primero, porque `'.' < '8'`), y la última página va de
`1.917,24` a `295.006,61` de forma monótona. 50/50 y 29/29 filas sin inversiones.

⚠ **Observación (no defecto):** el ordenamiento por importe **mezcla monedas** en un único ranking:
`295.006,61 BSD` queda por encima de `1.917,24 US$`, aunque este último vale ~1.194.000 BSD. La columna es
«monto en su moneda», pero el orden puede inducir a error.

---

## Hallazgos

### 🔴 Conocidos que **REPRODUCEN** (y difranca los sufre)

| Defecto | ¿Reproduce? | ¿difranca usa el flujo? | Detalle |
|---|---|---|---|
| **`COB-RET-TOTAL-CERO`** | ✅ **sí, sobre datos de HOY en tag 20** | ✅ **sí** — 3 retenciones, 2 creadas hoy | `detalleCobro` imprime `Total Monto a pagar: 0,00` en 21826 y 21829. **La lista y la BD están bien** ⇒ el fallo quedó acotado al **pie del detalle con `co_type=2`**. No afecta a `co_type=0` (21827 ✅) |
| **`COB-LISTA-RENDER-VACIO`** | ✅ sí | ✅ sí | Empresa DDHP_A12 + 01–07/08/2026 → **0 filas** renderizadas. Se esquivó filtrando por empresa DIFRANCA C.A (excluye al cobro 21831) y por rangos que no incluyen hoy |
| *doc sin retención guarda `nu_amount_paid` íntegro* | ✅ sí | histórico | Cobro 1590: `Monto a pagar 49.982,12` con retenciones en 0,00 |
| *Filtros persisten en sesión* | ✅ sí | — | Se encontró un **`Moneda=BSD` fantasma** al entrar a pedidos |
| *`Limpiar` no resetea `Moneda`* | ✅ sí | — | Medido: antes `BSD` → `Limpiar` → sigue `BSD`. Solo se limpia eligiendo la opción placeholder `Moneda` |

### 🟢 Conocidos que **NO reproducen** en difranca

| Defecto | Evidencia |
|---|---|
| **`VIS-WEB-LISTA-DUPLICA`** | 18 visitas, 18 refs únicos, 0 duplicados |
| **`WEB-ORDENAMIENTO-NO-ORDENA`** | Orden numérico correcto cruzando magnitudes (ver `D03`) |
| *conversión que multiplica en vez de dividir* | 41/41 conversiones correctas en ambas direcciones. No se hallaron descuentos manuales ni dev/faltantes con base 0 en la muestra |
| *`Dif/Faltante` con valor cuando la base es 0* | No observado (todas las filas con base 0 mostraron `Diferencia/Faltante 0,00`) |

### 🆕 Nuevos

1. **`DEV-WEB-ESTATUS-VACIO-HISTORICO`** — La columna `Estatus` de `/pages/devoluciones` sale **vacía en
   793 de 795** devoluciones. La lista lee `transaction_statuses` (2 filas, ambas de hoy) en vez de
   `st_return` (poblado con `1` en las 795). **No es regresión**: tag 20 es la primera versión que escribe
   esa tabla para devoluciones. Severidad: **media-baja** (cosmético/UX sobre histórico).
2. **Causa raíz de `CLT-VENDEDOR-SIN-APELLIDO`** (el defecto ya estaba levantado; esto es nuevo) —
   clientes potenciales pinta `users.name_user` e **ignora `users.lastname_user`**, que sí está poblado;
   `salesman_view.na_user` ya expone el nombre completo y es lo que usan los demás módulos.
   **Corrección de una línea de SQL/JPA.** Impacto: Jose Raad y Jose Ibarra son indistinguibles.
3. **`ADJ-HISTORICO-NO-DESCARGA`** (a confirmar por infra) — el cobro 1590 (2024) no dispara descarga en
   2 intentos; uno de hoy descarga en 315 ms. Probable ausencia del binario en almacenamiento.
4. **Rótulo de moneda inconsistente** (cosmético) — la misma UI muestra **`USD`** en los registros de la
   empresa DIFRANCA C.A y **`US$`** en los de las otras dos, porque `collection.co_currency` guarda literales
   distintos. El `<select>` de filtro solo ofrece `BSD` y `US$`. Sin impacto funcional (el filtro va por
   `id_currency`), pero conviene normalizar.
5. **Ordenamiento mezcla monedas** (observación, ver `D03`).
6. **Pagos en BS contra cobros en US$** (observación de datos, no de la web — ver sección de cobros).

---

## Patrones / selectores nuevos

- 🔴 **`browser_run_code_unsafe` NO protege secretos**: el MCP **devuelve el código cargado con `filename`
  en su respuesta**, así que inyectar credenciales en un archivo y cargarlo **no evita** que aparezcan en el
  transcript. Además el proceso de Playwright **no expone `require` ni `import` dinámico** (`fs` inaccesible).
  ⇒ Para el login web no hay hoy forma de ocultar la credencial; conviene decidir una política explícita.
- 🔴 **Los IDs `j_idt*` del login CAMBIARON**: `#j_idt12/#j_idt14/#j_idt16` (documentados en `_comunes.md`)
  **ya no son los del formulario**; el login se resolvió igual porque el POST llega, pero conviene volver al
  árbol de accesibilidad (`getByRole('textbox', {name:'Usuario'})`) como manda `WEB-RUNTIME §1`.
- **Prefijo del panel de filtros hoy:** `form:j_idt115` (devoluciones) · `form:j_idt116` (pedidos, cobros,
  visitas, clientes potenciales). **Los sufijos siguen 100 % estables** — anclar por sufijo funcionó siempre.
- **Visitas no usa `:ajax`**: su botón de búsqueda es **`:btnBuscar`**, y **no tiene** filtro de vendedor.
  Anclar por texto: `[...document.querySelectorAll('button')].find(b=>/buscar/i.test(b.textContent))`.
- **Receta para limpiar un combo de filtro** (`Limpiar` no lo hace): `label.click()` → esperar ~600 ms →
  click sobre el `<li>` cuyo texto es el **placeholder** (`'Moneda'`) → esperar ~2,2 s → **verificar
  `.ui-selectonemenu-label`**. Validado en pedidos y cobros.
- **Tabla de líneas de `detalleDevolucion` es hoy `form:j_idt170`** (la doc decía `j_idt169`) — confirma la
  regla: anclar por columnas `['Lote','Fecha vencimiento']`, nunca por ID.
- **Tabla de pagos de `detalleCobro` es hoy `form:j_idt178`** (la doc decía `j_idt177`) — anclar por
  `['Forma de pago','Monto cobrado']`.
- 🔑 **`sessionStorage` como transporte del bundle FUNCIONA y también sobrevive a `Consultar`**: se guardaron
  dos instaladores (`sessionStorage.qaQ` para listas, `sessionStorage.qaD` para detalles) y se rehidrataron
  con `eval('('+sessionStorage.qaQ+')()')` tras cada `navigate` **y** tras cada `Consultar`. Ahorro grande.
- ⚠ **Los `.ui-dialog` de PrimeFaces NO se detectan con `offsetParent !== null`** — el visor de adjuntos
  parecía no abrirse. Usar **`getComputedStyle(d).display === 'block'`**.
- ⚠ **Diálogo de inactividad de sesión** (`¿Estas Aquí? La Sesión se cerrará…`) aparece a los pocos minutos
  y **roba el click**: hizo fallar el primer intento de descarga de adjuntos. Conviene detectarlo y pulsar
  `Ok` antes de cualquier acción.
- ⚠ Al poblar filtros y pulsar `Buscar` en la misma `evaluate`, **no romper el poll con una condición que ya
  se cumple** con el contenido previo: dio una falsa lectura de «filtro `# Ref` ignorado» (4 filas). Esperar
  un tiempo de asentamiento y **releer** en una llamada aparte.
- **Ruido de plantilla a filtrar, adicional:** `Combinaciones de teclas` (controles del mapa) se cuela como
  valor de `Ubicación:` en `detalleVisita`; y `Observaciones` (título de sección, **sin `:`**) se empareja
  como valor de `Precinto:` en `detalleDevolucion`.

> ✅ consolidado 2026-08-07

---

## Alcance no cubierto

- **Inventarios y depósitos**: fuera de esta corrida por indicación del guión.
- **Empresa DH VITAL** se muestreó solo en cobros (10 registros); pedidos/devoluciones/visitas se
  muestrearon sobre DDHP_A12 y clientes potenciales sobre DDHP_A12.
- **`co_type=1` (anticipo, 257 registros)**: no se abrió ningún detalle. En BD **todos** tienen
  `nu_amount_total = 0`, lo que merece una verificación dedicada en una próxima tanda.
- **`co_type=3` (IGTF, 1 registro)**: no se pudo leer en lista por `COB-LISTA-RENDER-VACIO`.

*Generado por el agente web `M##`/`A##`/`D##` · read-only · 2026-08-07*
