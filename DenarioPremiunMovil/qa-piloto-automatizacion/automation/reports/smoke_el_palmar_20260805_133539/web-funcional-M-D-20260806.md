# Corrida WEB funcional — familias `M##` (muestreo BD↔web) y `D##` (comportamiento)

**RUN_ID:** `20260806_web-funcional` · **Cliente:** el_palmar · **Playa:** isla_coche
**Base:** `http://denarioislacoche.ddns.net:8080/DenarioPremium` · **Usuario:** `***` / `***`
**Fecha:** 2026-08-06 · **Modo:** 🔴 READ-ONLY (solo `Buscar`, `Limpiar`, `<select>` de filtro, `Consultar`,
paginación y ordenamiento de columnas). No se tocó `Editar`, `Eliminar`, `Nuevo`, `Copiar`, el `<select>`
"Estatus del Cobro" ni ningún submit.

**Guarda de tenant verificada antes de leer:** host `denarioislacoche.ddns.net:8080`, `<select>` de Empresa
con **CENTRAL EL PALMAR, S.A.** (1002) y **C.A. DESTILERIA YARACUY** (1003) por TEXTO, y vendedor
**266 Dilcia Duarte** presente entre los 33 del combo.

---

## Resumen

| Familia | Casos | WEB-OK | WEB-CALC-MISMATCH | WEB-N/A | ⛔ BLOCKED |
|---|---|---|---|---|---|
| `M##` — muestreo BD↔web | 27 | 22 | 3 | 2 | 0 |
| `D##` — comportamiento | 16 | 12 | 4 | 0 | 0 |
| **Total** | **43** | **34** | **7** | **2** | **0** |

**Registros cotejados contra BD: 161** (lista) + **12 detalles** abiertos con `Consultar`.
*(En `_web-results.jsonl` estos 43 casos se expanden a **50 líneas**: los casos que se evaluaron sobre varias
refs — `DW-COB-M04` sobre 5 detalles, `DW-COB-M05` sobre 2, `DW-DEP-M02` sobre los 3 depósitos — llevan una
línea por ref.)*

🔴 **2 hallazgos nuevos de impacto financiero** (uno crítico en depósitos, uno alto en cobros/anticipos),
**4 de formato/presentación** y **1 observación de ordenamiento**.
✅ El defecto conocido `COB-RET-TOTAL-CERO` **no reprodujo** en ninguna de las dos empresas.

---

## M## — Muestreo BD ↔ web

### Cuántos registros por módulo

| Módulo | Registros en lista | Detalles abiertos | Cobertura de la muestra |
|---|---|---|---|
| **cobros** | **29** | **7** | los 5 `co_type` (0·1·2·3·4) × VES y USD × empresas 1002 y 1003 · ene→ago 2026 |
| **pedidos** | **103** | 1 | 42 de 1002 (oct–nov 2025) + 61 de 1003 (1–5 jun 2025) |
| **depósitos** | **3** | **2** | universo completo del módulo |
| **devoluciones** | **4** | 1 | universo completo del módulo |
| **visitas** | **18** (22 filas) | 0 | universo completo del tenant |
| **inventarios** | **3** | 1 | 1 histórico + 2 del 05/08; los 13 restantes son de empresa `LMP01` |
| **clientes potenciales** | **1** | 0 | los 30 históricos son `LMP01`/`0.0`/NULL, fuera del tenant |
| | **161** | **12** | |

### Casos

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-COB-M01 | cobros | Los 29 de la muestra aparecen en la lista (rango 01/01–06/08/2026, las 2 empresas) | **WEB-OK** | 13/13 en CENTRAL EL PALMAR (3 pág.), 16/16 en DESTILERIA (1 pág.) |
| DW-COB-M02 | cobros | `Monto cobrado` de la lista == `nu_amount_total` de BD, en los 29 | **WEB-OK** | incl. multi-pago: 27058 → `20.000.000,0000 + 25.000.000,0000` = 45.000.000 = `nu_amount_total` |
| DW-COB-M03 | cobros | Estatus web == `transaction_statuses` | **WEB-OK** | 29/29 "Enviado" |
| DW-COB-M04 | cobros | Aritmética en 7 detalles, uno por rama de `co_type` | **WEB-OK** | ver §Aritmética verificada |
| DW-COB-M05 | cobros | 💎 lista `Total por cobrar` == detalle `Total Monto a pagar` | **WEB-CALC-MISMATCH** | OK en 5/7; **falla en los anticipos 27038 y 27023** (ver H-2) |
| DW-COB-M06 | cobros | Cobros con `id_deposit` ofrecen enlace al depósito | **WEB-N/A** | ninguno de los 29 muestreados tiene `id_deposit` (solo 3 en toda la BD, cubiertos en depósitos) |
| DW-COB-M07 | cobros | Conversión con la tasa **del registro** (no la del día) en los 29 | **WEB-OK** | VES→USD divide y USD→VES multiplica, ambas direcciones correctas |
| DW-PED-M01 | pedidos | Conteo web == conteo BD en 2 ventanas | **WEB-OK** | 42 = 42 (1002, oct–nov 2025) · 61 = 61 (1003, 1–5 jun 2025) |
| DW-PED-M02 | pedidos | `Monto Base` == `nu_amount_final` + `nu_amount_discount` | **WEB-OK** | 13798: 63.723,2712 + 2.948,2488 = **66.671,5200** = web |
| DW-PED-M03 | pedidos | `Monto Total` == `nu_amount_total` · `Total items` == `nu_details` | **WEB-OK** | 103/103 |
| DW-PED-M04 | pedidos | `Monto conv.` == `Monto Total` × / ÷ tasa según moneda | **WEB-OK** | 13797 (VES): 8.127,3312 / 181,3037 = **44,8272** ✓ · 13801 (USD): 36.542,32 × 181,3037 = **6.625.257,82** ✓ |
| DW-PED-M05 | pedidos | Detalle: cabecera y Σ de líneas | **WEB-OK** | 13756: ver §Aritmética |
| DW-DEP-M01 | depósitos | Los 3 del universo aparecen | **WEB-OK** | refs 1, 2, 3 (tras limpiar `# Ref` pre-cargado — ver P-3) |
| DW-DEP-M02 | depósitos | 💎 Σ(cobros hijos) == `Monto depositado` | **WEB-CALC-MISMATCH** | **falla en 2 de 3** (ver H-1) |
| DW-DEP-M03 | depósitos | `Monto depositado conv.` coherente con monto y tasa | **WEB-CALC-MISMATCH** | dep 1: 15,80 × 181,3037 = 2.864,60 ≠ **347.341,6285** mostrado |
| DW-DEV-M01 | devoluciones | Conteo y cabecera contra BD | **WEB-OK** | 4 = 4 · ref 70 → 07/10/2025, Felix Escalona, SUPERMARKET LARENSE ✓ |
| DW-DEV-M02 | devoluciones | Líneas: cantidad, factura, motivo (sin montos, correcto) | **WEB-OK** | 3 líneas = BD: 10/`Ggkk`, 36/`7`, 5/`Ggg` |
| DW-VIS-M01 | visitas | Las 18 del tenant aparecen; multi-actividad ocupa varias filas | **WEB-OK** | 22 filas / 18 refs: ref 15 ×3, refs 6 y 17 ×2 |
| DW-VIS-M02 | visitas | Fechas, cliente, estatus contra BD | **WEB-OK** | id 1 → 13/05/2025 "No visitado" ✓ · id 5 → 11/11/2025 16:44 "visitado" ✓ |
| DW-VIS-M03 | visitas | `Editar`/`Eliminar` **existen** por fila (no se ejecutan) | **WEB-OK** | presentes en las 22 filas |
| DW-INV-M01 | inventarios | Histórico del tenant en la lista | **WEB-OK** | ref 14 (07/10/2025, 1002) presente |
| DW-INV-M02 | inventarios | Aislamiento de tenant: los 13 de `LMP01` NO aparecen | **WEB-OK** | 0 filas de `LMP01` bajo 1002 y 1003 |
| DW-INV-M03 | inventarios | Detalle: epoch, líneas, ubicación, enlace a pedido | **WEB-OK** | `Código inventario` 1759860751130.0 ✓ · 3 líneas ✓ · 2 Depósito + 1 Exhibición ✓ · `Ver Pedido Relacionado` ✓ |
| DW-CLP-M01 | clientes potenciales | Muestreo histórico | **WEB-N/A** | los 30 históricos son de `LMP01`/`0.0`/NULL; el tenant solo expone 1002/1003 |
| DW-CLP-M02 | clientes potenciales | Aislamiento de tenant | **WEB-OK** | solo el ref 31 del 05/08; ningún `LMP01` filtrado |
| DW-COB-M08 | cobros | `Diferencia cobro` == Σpagos − `Total por cobrar` | **WEB-OK** | 27058: 45.000.000 − 34.031.083,9995 = **10.968.916,0005** ✓ |
| DW-COB-M09 | cobros | Retenciones: `Total a pagar` == Σ(Monto a pagar) == IVA+ISLR | **WEB-OK** | 27051 y 27024 exactos (ver §Aritmética) |

### Aritmética verificada — los que cuadran

**27051** · `co_type=2` retención · VES · 1003 · 2 documentos
```
Monto total base      = 29.833.750,0078 + 35.317.877,5132 = 65.151.627,5210  ✓ (Σ Saldo doc)
    conversión         65.151.627,5210 / 652,9726          =     99.776,9700  ✓
Total Monto a pagar   = 1.000,0000 + 2.000,0000            =      3.000,0000  ✓ (Σ Monto a pagar)
                      = Ret.IVA 2.000 + Ret.ISLR 1.000     =      3.000,0000  ✓ (oráculo co_type 2)
    conversión         3.000 / 652,9726                    =          4,5944  ✓
lista `Total por cobrar` 3.000,0000  ==  detalle `Total Monto a pagar` 3.000,0000  ✓  ← M05
```

**27024** · `co_type=2` retención · VES · 1002 · 1 documento
```
Total Monto a pagar = Monto a pagar 260,0000 = Ret.IVA 260,0000 + ISLR 0  = 260,0000  ✓
    conversión       260 / 419,9873                                        =   0,6191  ✓
Monto total base    = Saldo doc 23.183,2990   → /419,9873 = 55,2000        ✓
lista 260,0000 == detalle 260,0000  ✓   (la etiqueta `Retención ISLR` no se renderiza por ser 0 — esperado)
```

**27058** · `co_type=0` · VES · 1003 · 2 pagos, genera anticipo
```
Monto total base    = Saldo doc                        = 34.031.083,9995  ✓
Total Monto a pagar = 34.031.083,9995 − 0 − 0 − 0 + 0  = 34.031.083,9995  ✓ (oráculo co_type 0)
Σ pagos             = 25.000.000 + 20.000.000          = 45.000.000,0000  = nu_amount_total  ✓
Diferencia de cobro = 45.000.000 − 34.031.083,9995     = 10.968.916,0005  ✓  → anticipo 27059 por ese importe exacto
conversiones          25.000.000/652,9726 = 38.286,4457 · 20.000.000/652,9726 = 30.629,1566
                      Σ = 68.915,6023 = `Monto conv.` de la lista  ✓
lista 34.031.083,9995 == detalle 34.031.083,9995  ✓
```

**27061** · `co_type=3` IGTF · VES · 1003
```
Total Monto a pagar = 58.767,5340  ✓   conversión 58.767,534 / 652,9726 = 90,0000  ✓
documento `IGTF-1784814610438.0`  ✓ (patrón co_document='IGTF-<epoch>')
pago: `Prepago Automático` 58.767,5340  ✓
lista 58.767,5340 == detalle 58.767,5340  ✓
NOTA: `Monto total IGTF` = 0,0000 en un cobro de tipo IGTF — coincide con BD (`nu_amount_igtf`=0),
      el importe viaja en la base. No es defecto de la web; sí conviene revisarlo con negocio.
```

**13756** · pedido · 1002 · 7 líneas, con descuento e IVA
```
Monto Base Pedido  1.209,8500 − Descuento 181,4775 + IVA 59,1124 = 1.087,4849 = Monto Total Pedido  ✓
Σ subtotales de las 7 líneas:
  158,9925 + 132,2719 + 36,3440 + 658,9200 + 25,9022 + 45,9279 + 29,1264 = 1.087,4849               ✓ exacto
conversiones: 1.209,85 × 177,6143 = 214.886,66 ✓ · 181,4775 × 177,6143 = 32.232,99 ✓
              59,1124 × 177,6143 = 10.499,21 ✓ · 1.087,4849 × 177,6143 = 193.152,87 ✓
```

---

## D## — Comportamiento

| ID | Módulo | Qué se probó | Resultado | Evidencia |
|---|---|---|---|---|
| DW-COB-D01 | cobros | Paginación: 3 páginas de 50 | **WEB-OK** | 50+50+48 = 148; pág.1 termina en 27019 y pág.2 arranca en 27018; **sin repetir ni saltear** |
| DW-COB-D02 | cobros | Orden por `# Ref` | **WEB-OK** | descendente estricto en las 3 páginas |
| DW-COB-D03 | cobros | Orden por `Total por cobrar` (ida y vuelta) | **WEB-OK** | asc 0,0000 → 125.480,6292, 50 filas preservadas, `aria-sort=ascending` |
| DW-COB-D04 | cobros | Columnas esperadas | **WEB-OK** | 17 únicas (PrimeFaces las duplica en el `thead`: 34 `th`) |
| DW-COB-D05 | cobros | Columnas ordenables | **WEB-OK** | solo `# Ref`, `Fecha Cobro`, `Total por cobrar`, `Diferencia cobro` |
| DW-COB-D06 | cobros | 🔴 `<select>` "Estatus del Cobro" NO se toca | **WEB-OK** | decisión documentada: es control de **escritura** en producción |
| DW-COB-D07 | cobros | Orden por importe mezclando monedas | **WEB-CALC-MISMATCH** | ordena el número crudo sin normalizar: `0,0000 USD` intercalado entre VES (ver H-6) |
| DW-VIS-D01 | visitas | Orden por `Ref` ascendente **numérico** | **WEB-OK** | 1,2,3…18 — como texto habría dado 1,10,11,…,2 |
| DW-VIS-D02 | visitas | Orden por `Ref` descendente | **WEB-OK** | 18,17,17,16,15,15,15,14… y conserva las 22 filas |
| DW-VIS-D03 | visitas | Columnas esperadas | **WEB-OK** | 16 columnas incl. `Editar`/`Eliminar`, `Geo`, `Actividad`, `Motivo` |
| DW-PED-D01 | pedidos | Paginación | **WEB-OK** | 61 registros en 2 páginas (50+11), sin solapamiento |
| DW-PED-D02 | pedidos | Columnas y formato de importes en la lista | **WEB-OK** | 15 columnas; todos los importes en es-VE con separador de miles y 4 decimales |
| DW-PED-D03 | pedidos | Formato de importes **dentro del detalle** | **WEB-CALC-MISMATCH** | decimales variables: `IVA 16.0%: 8,6 USD`, `5,53`, `4,024`, `1.527,483` (ver H-5) |
| DW-INV-D01 | inventarios | Numeración de líneas del detalle | **WEB-CALC-MISMATCH** | la columna `N°` muestra **"1" en las 3 filas** (ver H-3) |
| DW-INV-D02 | inventarios | Formato de cantidades | **WEB-CALC-MISMATCH** | `6.00 Caja`, `9.00 Kilogramo`, `9.00 Saco` — punto decimal en-US (ver H-4) |
| DW-CLP-D01 | clientes potenciales | Lista vacía | **WEB-OK** | "No se encontraron registros.", limpio, sin traza de error |

---

## Hallazgos

### 🔴 NUEVOS

#### H-1 · `DEP-MONTO-UN-PAGO` — el monto depositado toma UN pago, no la suma (CRÍTICO)

`Monto depositado` guarda el importe de **una sola forma de pago del cobro — la última —** en vez de
`Σ(pagos)`. Con cobros de un solo pago el defecto es invisible; con multi-pago **sub-reporta el depósito**.

| Dep | Formas de pago del cobro | Σ real | `Monto depositado` (web y BD) | Δ |
|---|---|---|---|---|
| **1** | Depósito 1.000,00 + Transferencia 900,00 + **Efectivo 15,80** | **1.915,80 USD** | **15,8000 USD** | **−99,2 %** |
| 2 | **Transferencia 3.840,00** (único) | 3.840,00 USD | 3.840,0000 USD | ✓ (1 solo pago ⇒ no lo expone) |
| **3** | Depósito 10.000,00 + **Efectivo 6.820,4436** | **16.820,4436 VES** | **6.820,4436 VES** | **−59,5 %** |

**Verificable sin BD, en la propia pantalla:**

- *En la lista* (dep 1): `Monto depositado` **15,8000 USD** · `Tasa conv.` **181,3037** ·
  `Monto depositado conv.` **347.341,6285 VES**.
  `15,80 × 181,3037 = 2.864,60`, no 347.341,63. Y `347.341,6285 / 181,3037 = **1.915,80**` — la conversión
  sí se calculó con el total correcto. **La fila se contradice a sí misma.**
- *En el mismo detalle del dep 1*, la fila hija "Efectivo 15,8000 USD" muestra `Monto conv.` **2.864,5985 VES**.
  ⇒ **la misma página convierte 15,80 de dos maneras distintas.**
- *En el detalle del dep 3*: hijas `10.000,0000 + 6.820,4436 = 16.820,4436` contra cabecera `6.820,4436`.

**Impacto:** el oráculo `Σ(cobros hijos) == Monto depositado` falla en **2 de 3 depósitos** (los 2 cuyo cobro
tiene más de una forma de pago). Es dinero reportado de menos en un módulo de conciliación bancaria.
**Reproduce en la corrida de ayer** (dep 3, 05/08/2026), no es solo histórico.

**Evidencia BD:** `deposit.nu_amount_doc` = 15.8000 / 3840.0000 / 6820.4436 ·
`collection_payment` de 26833 = 1000.0000 + 900.0000 + 15.8000 · de 27083 = 10000.0000 + 6820.4436.

---

#### H-2 · `COB-ANTIC-PAGADO-CERO` — anticipos con total en cero y conversión "N/A" (ALTO)

En cobros `co_type=1` (Anticipo/Prepago), la web muestra el total de cabecera en **0,0000** mientras su
propia tabla de pagos trae el importe real:

| | 27038 (DESTILERIA) | 27023 (CENTRAL EL PALMAR) | **27020 (control)** |
|---|---|---|---|
| Tabla de pagos | Transferencia **2.500,0000 VES** (conv. 4,3287 ✓) | Transferencia **32.000,0000 VES** (conv. 76,1928 ✓) | Prepago Automático **6.816,7010 VES** |
| Pie `Monto pagado` | **0,0000 VES** ❌ | **0,0000 VES** ❌ | **6.816,7010 VES** ✅ |
| Pie `Monto pagado conversión` | **0,0000 USD** ❌ | **0,0000 USD** ❌ | **16,2307 USD** ✅ |
| Pie `Tasa de conversión` | 577,5461 (presente) | 419,9873 (presente) | 419,9873 |
| Lista `Total por cobrar` | 0,0000 | 0,0000 | 6.816,7010 |
| Lista `Monto conv.` / `Tasa conv.` | **"N/A"** / **"N/A"** | **"N/A"** / **"N/A"** | 16,2307 / 419,9873 |

El **control 27020** —mismo `co_type`, misma estructura (1 pago, sin tabla de documentos)— muestra el valor
correcto: el campo sí significa "monto pagado" y el 0 es un defecto, no una convención.

**Alcance medido:** `SELECT … WHERE nu_amount_total<>0 AND nu_amount_total_conversion=0` desde 2025-01-01
devuelve **19 registros**, **el 100 % `co_type=1`**, y **todos con `usos=0`** (ningún cobro los referencia por
`co_original_collection`) ⇒ **el 0 no es "saldo ya consumido"**. Varios son de importe alto y multi-pago:
26996 (23.600.000,00 · 3 pagos), 26978 (18.460.000,00 · 4 pagos), 26909 (10.820.085,20 · 4 pagos).

🔑 **Refina el defecto conocido.** El disparador de `Monto conv./Tasa conv. = "N/A"` **no es
`nu_amount_total = 0`** (como se anotó el 05/08) sino **`nu_amount_total_conversion = 0`**. Por eso aparece
también en anticipos con `Monto cobrado` ≠ 0 y con tasa guardada. La rama con `nu_amount_total = 0`
(retenciones) es un subconjunto.

---

#### H-3 · `INV-NUMERO-LINEA-FIJO` — el `N°` de línea no incrementa (menor)

`detalleInventario` ref 14: las **3** líneas muestran `N°` = **"1"**. En `detalleDevolucion` (1,2,3) y en
`detallePedido` (1..7) la numeración sí es correcta ⇒ es específico de inventarios.

#### H-4 · `INV-CANTIDAD-FORMATO-EN-US` — cantidades con punto decimal (menor)

Mismo detalle: `Depósito: 6.00 Caja` · `9.00 Kilogramo` · `Exhibición: 9.00 Saco`. Punto decimal y **2**
decimales, contra el es-VE de coma y **4** decimales del resto de la aplicación.

#### H-5 · `PED-DECIMALES-VARIABLES` — importes con decimales truncados en el detalle de pedido (menor)

Dentro de la celda compuesta `Monto Total` de cada línea, los importes pierden los ceros a la derecha y
quedan con 1 a 4 decimales según el valor, mezclados en la misma celda:
`Precio base: 53,7500 USD` (4) · `Descuento 15.0%: 8,0633 USD` (4) · **`IVA 16.0% : 8,6 USD` (1)** ·
`Importe + IVA: 54,2867 USD` (4). Otros: `5,53`, `4,024`, `22,806`, `1.527,483`, `31,33`.
Los totales de cabecera del mismo pedido sí usan 4 decimales fijos.

#### H-6 · `COB-ORDEN-MEZCLA-MONEDAS` — el orden por importe ignora la moneda (observación)

Ordenar por `Total por cobrar` compara el número crudo sin normalizar: un `0,0000 USD` queda intercalado
entre valores VES, y un cobro de 100 USD ordena por debajo de uno de 200 VES pese a valer ~370× más.
Afecta a cualquier lista con monedas mezcladas. No rompe datos; sí hace inútil el orden como herramienta.

#### H-7 · `DEP-DETALLE-OMITE-PAGO` — el detalle del depósito no lista todas las formas de pago (a confirmar)

El detalle del depósito 1 listó **2** filas hijas (Depósito 1.000,00 y Efectivo 15,80) mientras el cobro 26833
tiene **3** formas de pago en `collection_payment` (falta **Transferencia 900,00**). Puede ser un filtro
deliberado por método depositable; **queda como pregunta para producto**, no se levanta como defecto cerrado.

### ✅ CONOCIDOS — qué reprodujo y qué no

| Defecto conocido | Veredicto |
|---|---|
| `COB-RET-TOTAL-CERO` (retención con `Total Monto a pagar: 0,00`) | **NO reproduce.** 5 retenciones revisadas (27051, 27024, 27003, 26994, 26920) muestran el total correcto y coincidente entre lista y detalle, en **ambas** empresas |
| `Monto conv.`/`Tasa conv.` = **"N/A"** con `nu_amount_total = 0` | **Reproduce**, en las 4 retenciones con total 0 (27024, 27003, 26994, 26920). ⚠ Ver H-2: la condición real es `nu_amount_total_conversion = 0`, más amplia |
| Conversión que **multiplica en vez de dividir** | **NO reproduce** en la muestra. Las dos direcciones salieron correctas en 29 cobros y 103 pedidos (VES→USD divide, USD→VES multiplica) |
| `Dif/Faltante conversión` con valor teniendo base 0 | **No observado** en la muestra histórica (todas las columnas `Dif/Faltante` y su conversión vinieron 0,0000 de forma consistente) |
| Cobros con `nu_amount_total = 0` mostrando "N/A" (5 casos del 05/08, en observación) | **Confirmado y explicado**: es la misma familia de H-2 |

---

## Patrones / selectores nuevos

**Estado de filtros al entrar a un módulo (medido hoy, 7 módulos):**

| Comportamiento | Detalle |
|---|---|
| 🔴 **`navigate` fresco RESETEA el rango de fechas** al mes en curso, pero **conserva la Empresa** | Verificado en cobros: tras volver de un detalle la lista traía 8 filas (01/08–06/08) en vez de las 48 del rango que yo había puesto. **Hay que re-poner las fechas en cada entrada al módulo.** Matiza lo escrito en `web-selectors/cobros.md` ("el filtro no se pierde"): la **Empresa** no se pierde, las **fechas** sí |
| 🔴 **Cambiar Empresa re-renderiza el panel y BORRA el `# Ref`** | Setear Empresa y `# Ref` en la *misma* `evaluate` hace que el `# Ref` se pierda y `Buscar` devuelva el listado completo. ⇒ **siempre en dos llamadas: primero Empresa, después `# Ref` + `Buscar`** |
| 🔴 **En depósitos el `# Ref` vino PRE-CARGADO con `3`** al entrar fresco | Recortó la lista a 1 fila y estuvo a punto de producir un `WEB-MISSING` falso sobre los depósitos 1 y 2. ⇒ **leer y limpiar `n_ref` antes de todo `Buscar`**, no asumirlo vacío |
| **Empresa inicial por módulo** | CENTRAL EL PALMAR: cobros, depósitos, devoluciones, visitas, clientes potenciales · **DESTILERIA: pedidos e inventarios** (coincide con lo ya documentado para esos dos) |

**Selectores y anclajes confirmados:**

- Paginación: `.ui-paginator-next` / `.ui-paginator-prev` responden a `.click()`; el combo `Filas por página`
  ofrece **50 / 100 / 200**. El texto del paginador sale como `FP123NE…` (iconos sin texto) ⇒ **contar filas,
  no parsear el paginador**.
- Ordenamiento: `th.click()` sobre `.ui-sortable-column`; el estado se lee en **`th[aria-sort]`**
  (`ascending`/`descending`) — mucho más fiable que inspeccionar clases CSS.
- **Cobros solo tiene 4 columnas ordenables**: `# Ref`, `Fecha Cobro`, `Total por cobrar`, `Diferencia cobro`.
  `Monto cobrado` **no** es ordenable (es la celda multi-pago).
- **Visitas**: el encabezado se llama **`Ref`**, no `# Ref` (los demás módulos usan `# Ref`). Buscar es
  `[id$=":btnBuscar"]`; el resto de módulos usa `[id$=":ajax"]`.
- **Clientes potenciales**: el `<select>` de Empresa usa `value` = `co_enterprise` (`1002`/`1003`), a
  diferencia de devoluciones que es posicional. Reconfirma **anclar por TEXTO**.
- **Lector de detalle autocontenido** (cabecera por *hoja-siguiente* + pie por *mismo-padre* + tablas por
  columnas) funcionó sin ajustes en los **7** tipos de detalle tocados (cobro, depósito, pedido, devolución,
  inventario). Recomendado promoverlo a `web-helpers.js`.
- Confirmado de nuevo: en la cabecera leída por *hoja-siguiente*, `Tasa de conversión` se contamina con
  `"Documentos Pagados"`; el valor bueno sale del pie por *mismo-padre*. **Usar las dos reglas siempre.**

**Datos del tenant útiles para próximas corridas:**

- Empresa **1002** tiene 19.420 cobros y **1003** 6.871; el histórico de **pedidos llega hasta 2025-11**
  (13.767 registros) con un único pedido en 2026 (13802, 29/05/2026).
- **Depósitos, devoluciones, inventarios, visitas y clientes potenciales casi no tienen histórico**: 3, 4, 14,
  18 y 31 registros en total. Para muestrear esos módulos **hay que irse a 2024–2025**, y en inventarios y
  clientes potenciales la mayoría pertenece a la empresa `LMP01`, **invisible bajo este tenant** ⇒ `WEB-N/A`
  legítimo, no defecto.

---

## Notas de operación

- No se ejecutó ninguna acción de escritura. `Editar`/`Eliminar` de visitas se verificaron **por presencia**.
- El `# Ref` ignora el rango de fechas (confirmado) pero **sí** queda tapado por Empresa.
- Ninguna caída de sesión JSF durante la corrida; se verificó `document.title`/`pathname` tras cada `navigate`.
- 0 casos ⛔ BLOCKED.

*Agente web · familias `M##` + `D##` · 2026-08-06 · read-only sobre producción*
