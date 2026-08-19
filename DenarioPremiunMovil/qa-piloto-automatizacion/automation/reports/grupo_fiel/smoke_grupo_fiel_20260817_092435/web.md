# Capa WEB — Denario Premium web (JSF/PrimeFaces)

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-17 |
| **RUN_ID** | `20260817_092435_smoke-completo` |
| **Cliente** | grupo_fiel — GRUPO FIEL, S.A. (GRUFISA), empresa única `00001` |
| **Playa** | El Yaque — `http://denarioelyaque.ddns.net:8080/DenarioPremium` |
| **Modo** | 🔴 READ-ONLY (solo `Buscar` / `Limpiar` / `Consultar`) |
| **Familias** | F## filtros · C## cotejo móvil→web · C-HOY cotejo BD→web de las transacciones manuales de QA · M## muestreo · A## adjuntos · D## comportamiento |

---

## Familia F## — Filtros

**Playa:** el_yaque (`denarioelyaque.ddns.net:8080`) · **Empresa:** GRUPO FIEL, S.A. (GRUFISA), única (00001)
**Veredicto de arranque:** 🟢 filtro `# Ref` OPERATIVO en los 6 módulos que lo exponen. 12/12 refs reales
devolvieron **exactamente** su fila. Ninguna ref inexistente devolvió el listado completo.
**Oráculo:** todo conteo contrastado contra `node automation/db/query.js grupo_fiel` (185/185 tablas).

### pedidos — `/pages/pedidos` · `form:pedidosDT`
| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-PED-F01 | `# Ref` = 1354 · 1355 | 1 fila, la correcta | 1 fila cada una (1354 Johana 17/08 · 1355) | WEB-OK |
| DW-PED-F02 | `# Ref` = 99999999 | 0 filas, sin error | 0 + "No se encontraron registros." | WEB-OK |
| DW-PED-F03 | `Limpiar` tras F01 | vuelve al total, input vacío | `ref=""` · 432 | WEB-OK |
| DW-PED-F04 | Vendedor = Johana Belandria | conteo == BD (24) | 24 contadas, 100 % Johana | WEB-OK |
| DW-PED-F05 | Fechas 10/08–12/08 | conteo == BD (191); nada fuera de rango | 191; todas dentro | WEB-OK |
| DW-PED-F11 | Vendedor + fechas 17/08 | intersección == BD (2) | 2 → refs 1354, 1355 | WEB-OK |
| — | baseline sin filtro (01/08–17/08) | == BD (432) | 432 | WEB-OK |

### cobros — `/pages/cobros` · `form:cobrosDT`
| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-COB-F01 | `# Ref` = 27,28,29,30,31,32 | 1 fila correcta c/u | **6/6** exactas (29=Anticipo/Prepago, 30=Retención) | WEB-OK |
| DW-COB-F02 | `# Ref` = 99999999 | 0 filas, sin error | 0 + mensaje de vacío | WEB-OK |
| DW-COB-F03 | `Limpiar` | vuelve al total | `ref=""`, fechas al default, 10 | WEB-OK |
| DW-COB-F04 | Vendedor = Johana | conteo == BD (6) | 6 | WEB-OK |
| DW-COB-F05 | Fechas 17/08–17/08 | == BD (6) | 6, todas 17/08 | WEB-OK |
| DW-COB-F12 | Vendedor + fechas | intersección == BD (6) | 6 → refs 27–32 | WEB-OK |
| — | 🔑 fechas 01/01/2020–31/12/2020 + `# Ref` 27 | el Ref **no** debe quedar tapado | devuelve la fila igual | WEB-OK |
| — | baseline sin filtro | == BD (10) | 10 | WEB-OK |

### devoluciones — `/pages/devoluciones` · `form:pedidosDT`
| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-DEV-F01 | `# Ref` = 1 | 1 fila | 1 (Johana, 17/08 09:00:57) | WEB-OK |
| DW-DEV-F02 | `# Ref` = 99999999 y = 2 | 0 filas | 0 en ambos → el filtro **discrimina** | WEB-OK |
| DW-DEV-F03 | `Limpiar` | vuelve al total (1) | 1 | WEB-OK |
| DW-DEV-F04 | Vendedor Johana / Freddy Mora | 1 / 0 (BD) | 1 / 0 | WEB-OK |
| DW-DEV-F05 | Fechas julio / 17-08 | 0 / 1 | 0 / 1 | WEB-OK |

### depositos — `/pages/depositos` · `form:pedidosDT`
| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-DEP-F01 | `# Ref` = 1 | 1 fila | 1 (Johana, 17/08 09:14:03) | WEB-OK |
| DW-DEP-F02 | `# Ref` = 99999999 y = 2 | 0 filas | 0 en ambos | WEB-OK |
| DW-DEP-F03 | `Limpiar` | vuelve al total (1) | 1 | WEB-OK |
| DW-DEP-F04 | Vendedor Johana / Freddy | 1 / 0 | 1 / 0 | WEB-OK |
| DW-DEP-F05 | Fechas julio / 17-08 | 0 / 1 | 0 / 1 | WEB-OK |

### inventarios — `/pages/inventarios` · `form:pedidosDT`
| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-INV-F01 | `# Ref` = 1 | 1 fila | 1 (Johana) | WEB-OK |
| DW-INV-F02 | `# Ref` = 99999999 y = 2 | 0 filas | 0 en ambos | WEB-OK |
| DW-INV-F03 | `Limpiar` | vuelve al total (1) | 1 | WEB-OK |
| DW-INV-F04 | Vendedor Johana / Freddy | 1 / 0 | 1 / 0 | WEB-OK |
| DW-INV-F05 | Fechas julio / 17-08 | 0 / 1 | 0 / 1 | WEB-OK |

### visitas — `/pages/visitas` · `form:tablaVisit`
| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-VIS-F01 | `# Ref` = 105 | 1 fila | 1 (Johana) | WEB-OK |
| DW-VIS-F02 | `# Ref` = 99999999 y = 104 (no existe en BD) | 0 filas | 0 + **"No existe registro"** | WEB-OK |
| DW-VIS-F03 | `Limpiar` | vuelve al total (43) | 43 | WEB-OK |
| DW-VIS-F04 | Vendedor ×4 | Johana 1 · JESUS 28 · Jenny 10 · Freddy 0 (BD) | **4/4 exactos** | WEB-OK |
| DW-VIS-F05 | Fechas ×4 | 17/08→1 · 10-11/08→37 · julio→0 · 13/08→4 | **4/4 exactos**, nada fuera de rango | WEB-OK |
| — | baseline sin filtro | == BD (43) | 43 | WEB-OK |

### clientes potenciales — `/pages/clientesPotenciales` · `form:pedidosDT`
⚠ **Sin input `# Ref`** (`[id$=":n_ref"]` no existe en el DOM) — confirmado. Sí trae la **columna** `# Ref`,
así que el barrido por vendedor + fechas es **exacto**, no aproximado.

| Caso | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| DW-CLT-F01 | Vendedor Johana / GILBERTO / Freddy | 2 / 1 / 0 (BD) | 2 (refs 34,35) · 1 (ref 1) · 0 | WEB-OK |
| DW-CLT-F02 | Fechas 17/08 · 13/08 · julio | 2 / 1 / 0 | 2 (34,35) · 1 (ref 1) · 0 | WEB-OK |
| DW-CLT-F03 | `Limpiar` | vuelve al total (3) | fechas vacías · 3 | WEB-OK |
| DW-CLT-F04 | Vendedor Johana **+** 13/08 | **0** (el del 13/08 es de GILBERTO) | 0 → es **intersección**, no unión | WEB-OK |

**Resumen F##:** 42 casos · **42 WEB-OK** · 0 mismatch · 0 BLOCKED.

**Consecuencia para la corrida:** los `C##` pueden localizar por `# Ref` en los 6 módulos sin ajustar fechas
(medido: el rango **no** tapa el Ref) y sin tocar Empresa (única, preseleccionada, no reseteable).
En clientes potenciales, localizar por **vendedor + fecha** y leer la columna `# Ref`.

### Observaciones de F## que condicionan al resto de la capa web

| # | Observación | Impacto |
|---|---|---|
| 1 | **`enterpriseEnabled=false` NO elimina el selector de Empresa en la web**: existe en los 7 módulos con una sola opción, preseleccionada y nunca reseteada | Inocuo acá: la Empresa **no puede** causar un falso `WEB-MISSING`. Divergencia leve contra el YAML |
| 2 | 🔴 La columna `Vendedor` de clientesPotenciales trae **solo el primer nombre** (`Johana`) mientras el resto de módulos trae el nombre completo (`Johana Belandria`) | Cotejar por nombre completo ahí daría **falso `WEB-FIELD-MISMATCH`** |
| 3 | Columna de Ref: `# Ref` en 6 módulos, **`Ref` (sin `#`) en visitas** | Un lector que busque siempre `# Ref` devuelve `undefined` en visitas |
| 4 | Mensaje de lista vacía no uniforme: `"No se encontraron registros."` en 6 módulos · **`"No existe registro"`** en visitas | Oráculo de lista vacía debe aceptar ambos |
| 5 | `clientesPotenciales` arranca con las **fechas vacías**; los otros 6 arrancan en `01/{mes}–hoy` | No asumir rango por defecto |
| 6 | El `value` de Empresa es **mixto dentro del mismo tenant**: `00001` (co_enterprise) en pedidos y clientesPotenciales · `1` (id_enterprise) en cobros, devoluciones, depósitos, inventarios y visitas | Anclar por TEXTO, nunca por value |
| 7 | ⚠ La BD **se mueve durante la corrida** (`potential_client` pasó de 2 a 3 filas: la corrida móvil creó el ref 35) | Tomar baseline BD y conteo web con la mínima separación posible |

### Correcciones al conocimiento previo (build de hoy desmiente `[difranca-20260807]`)

1. **Los filtros ya NO persisten a `browser_navigate`** — medido en cobros y pedidos: al volver por URL fresca, vendedor en placeholder, fechas al default y `# Ref` vacío. La disciplina `Limpiar` + verificar estado sigue siendo correcta (ahora redundante, no dañina). **A verificar por build**, no derogar sin re-medir en otra playa.
2. **`Limpiar` SÍ resetea las fechas en cobros** (rango 2020 → volvió a 01/08–17/08). La tabla decía "❌ NO en cobros y pedidos".
3. **Visitas SÍ tiene filtro de vendedor en El Yaque**: `[id$=":idSalesman_input"]`, 11 vendedores, label `co_user - nombre` (`003 - Johana Belandria`), `value` = `id_user`. Queda derogada la nota "en El Yaque visitas NO tuvo filtro de vendedor".

---

## Familia C-HOY — Transacciones manuales de QA (2026-08-17)

**Playa:** El Yaque (`denarioelyaque.ddns.net:8080`) · **Empresa:** GRUPO FIEL, S.A. (GRUFISA) `00001` — única opción
en los 7 módulos, verificada por TEXTO antes de cada lectura · **Vendedor:** Johana Belandria (`co_user 003` / `id_user 463`)
**Origen de verdad:** BD nube `grupo_fiel` (read-only) · **Sentido del cotejo:** BD → WEB · **Modo:** 🔴 READ-ONLY (solo `Consultar` / `Buscar`)

**Resultado: 11 WEB-OK · 1 WEB-FIELD-MISMATCH · 0 WEB-MISSING · 0 BLOCKED — 12/12 registros localizados en la web.**

| Módulo | Ref | Marca |
|---|---|---|
| pedidos | 1354 · 1355 | 🟢 WEB-OK ×2 |
| cobros | 27 · 28 · 29 · 30 · 31 · 32 | 🟢 WEB-OK ×6 |
| devoluciones | 1 | 🟢 WEB-OK |
| inventarios | 1 | 🟢 WEB-OK |
| depósitos | 1 | 🟠 **WEB-FIELD-MISMATCH** (campo `Banco`) |
| visitas | 105 | 🟢 WEB-OK |
| clientes potenciales | (id_client 34) | 🟢 WEB-OK |

---

### PEDIDOS

#### DW-PED-HOY-01 · Ref 1354 · 🟢 WEB-OK

Doble llave: `No. de Ref. = 1354` + `Código pedido = 1786971374230.0` (== `co_order`) ✅

| Campo | BD | WEB | ✓ |
|---|---|---|---|
| Fecha del pedido | `2026-08-17T12:59:43Z` | `17/08/2026 08:59:43` | ✓ mismo día (UTC-4, nota) |
| Estatus / ¿Por Aprobar? | `st_order=1` | `Enviado` / `NO` | ✓ |
| Cód./Nombre cliente | `J505472895` | `J505472895` · `BACALAO VA BIEN, C.A.` | ✓ |
| Vendedor · Empresa · Responsable | 463 · 00001 · `gv` | `Johana Belandria` · `GRUPO FIEL, S.A. (GRUFISA)` · `gv` | ✓ |
| Condición de pago | `CodContado` | `CONTADO` | ✓ (enriquecimiento = nota) |
| Fecha de despacho | `2026-08-19` | `19/08/2026` | ✓ |
| Comentario | `ped1` | `ped1` | ✓ |
| Total items | `nu_details=3` | `3` · 3 líneas en detalle | ✓ |
| Coordenada | `11.049014,-63.864986` | `11.049014,-63.864986` | ✓ exacta |
| Almacén / Lista precio | `005` / `PREC*-02` | `ALMACEN MARACAIBO` / `02 - Precio 2 - Nota de Entrega` | ✓ (enriquecimiento) |

**Aritmética verificada (tol. 0,01):**

```
Subtotal bruto  = 10x3.756,66 + 15x6.064,32 + 7x3.559,88
                = 37.566,60 + 90.964,80 + 24.919,16 = 153.450,56 BS   OK web 153.450,56
Descuento global (nu_discount 7 %) = 153.450,56 x 0,07 = 10.741,5392  OK web 10.741,54
Monto Total     = 153.450,56 - 10.741,5392 = 142.709,0208             OK web 142.709,02
Suma subtotales de linea = 34.936,94 + 84.597,26 + 23.174,82 = 142.709,02   OK (== Monto Total Pedido)
Conversion (BS->USD, DIVIDE): 142.709,0208 / 771,07 = 185,0792        OK web 185,08
DW-PED-C11: Subtotal bruto - Descuento bonif. = 153.450,56 - 0,00 = Monto Base Pedido   OK
```

**Diffs: ninguno.**

#### DW-PED-HOY-02 · Ref 1355 · 🟢 WEB-OK

Doble llave: `1355` + `1786971590046.0` ✅ · Cliente `J500572220` / `BELMENY, C.A.` ✅ ·
Condición `CodCredito` → **CREDITO** ✅ · Tipo `Pedido Factura` · Comentario `pedi2` ✅ · Despacho `19/08/2026` ✅ ·
Coordenada `11.049014,-63.864986` ✅ · Total items `2` == `nu_details` ✅

**Aritmética verificada — cadena completa descuento global + IVA 16 %:**

```
Subtotal bruto = 21x5.424,49 + 8x5.227,86 = 113.914,29 + 41.822,88 = 155.737,17   OK web 155.737,17
Descuento global 7 % = 155.737,17 x 0,07 = 10.901,6019                            OK web 10.901,60
Base neta   = 155.737,17 - 10.901,6019 = 144.835,5681   (== nu_amount_final)
IVA 16 %    = 144.835,5681 x 0,16 = 23.173,6909                                   OK web 23.173,69
Monto Total = 144.835,5681 + 23.173,6909 = 168.009,2590                           OK web 168.009,26
Suma subtotales = 122.890,74 + 45.118,52 = 168.009,26                             OK
Conversion: 168.009,259 / 771,07 = 217,8911   OK web 217,89 ; suma conv. de linea = 159,38+58,51 = 217,89   OK
```

**Diffs: ninguno.**

---

### COBROS

#### DW-COB-HOY-01 · Ref 27 · `co_type 0` normal · 🟢 WEB-OK

Cabecera: `27` · `17/08/2026 09:04:04` (BD `13:04:04Z`, nota UTC-4) · `J298776161` / `COMPLEJO MEDICO SAN LUCAS, C.A` ·
Johana Belandria · GRUPO FIEL · Responsable `gv` · Comentario `c1` · `Diferencia de cobro 0,00` (== `nu_difference`) ·
Estatus **web: `Por aprobar`** · Depósito: la fila ofrece `Consultar Depósito` (`id_deposit=1`) ✅

```
Monto total base = suma(Saldo doc) = 295.639,02 BS                 OK web 295.639,02   (NO suma de Monto doc)
Total a pagar (co_type 0) = 295.639,02 - 0 dcto - (0 IVA + 0 ISLR) - 0 Dif + 0 IGTF
                          = 295.639,02 BS                          OK web = nu_amount_final
Suma de pagos = 95.000,00 (ef) + 200.639,02 (tr) = 295.639,02      OK == Monto cobrado
Conversion (BS->USD, DIVIDE, tasa PROPIA 748,79): 295.639,02 / 748,79 = 394,8223   OK web 394,82
```

Doc `A020358` · fecha `20/07/2026` ✅ · tipo `A` ✅ · Pago parcial `NO` ✅ · saldo = monto = a pagar = 295.639,02 ✅ ·
sin Doc Retención ✅. Pago tr: banco `BANCO VENEZOLANO DE CREDITO`, cuenta `01040038400380102269`, Nro Doc `trf123`,
fecha valor `01/08/2026` — todos == BD ✅. **Diffs: ninguno.**

#### DW-COB-HOY-02 · Ref 28 · `co_type 0` con retenciones · 🟢 WEB-OK

```
Monto total base = Saldo doc = 223.111,98 BS    OK web   (Monto doc es 258.809,90 -> confirma el oraculo)
Total a pagar = 223.111,98 - 0 - (3.000,00 IVA + 111.111,98 ISLR) - 0 + 0
              = 223.111,98 - 114.111,98 = 109.000,00 BS             OK web = nu_amount_final
Suma de pagos = 109.000,00 (Pago Movil)                             OK
Conversiones / 771,07:  109.000,00->141,3620   223.111,98->289,3537
                        3.000,00->3,8907   111.111,98->144,1010   258.809,90->335,6497     OK todas
```

Doc `B065582` · `05/08/2026` ✅ · Doc Retención `33333211525264` ✅ · Fecha Comprobante `01/08/2026` (== `da_voucher`) ✅ ·
Comentario `c2` ✅. Pago Móvil: receptor `BANCO VENEZOLANO DE CREDITO` (`na_bank`), **Banco Emisor `BANCO VENEZUELA`**
(== `nu_collection_payment` → reconfirma que ese campo NO es un importe), `Tipo Documento E - 192687774` (== `nu_document`),
`Referencia 123` (== `nu_payment_doc`). **Diffs: ninguno.**

#### DW-COB-HOY-03 · Ref 29 · `co_type 1` anticipo/prepago · 🟢 WEB-OK

Pie **reducido** confirmado (`Monto pagado` / `… conversión` / `Tasa`) y **`form:documentosPagadosDT` AUSENTE** —
única tabla en la página es la de pagos ✅ (DW-COB-C10).

```
Monto pagado = 100,00 USD   OK == nu_amount_total ; suma de pagos = 100,00 (Otros)   OK
Conversion (USD->BS, MULTIPLICA): 100,00 x 771,07 = 77.107,00 BS   OK web 77.107,00
```

Cliente `J408595060` / `GRUPO COMERCIALIZADORA FERCO, COMPAÑIA ANONIMA` (con Ñ, como BD) ✅ ·
Nro Documento `test_otros_$` ✅ · Comentario `ant1` ✅. **Diffs: ninguno.**

#### DW-COB-HOY-04 · Ref 30 · `co_type 2` retención · 🟢 WEB-OK — **🔴 la regresión `COB-RET-TOTAL-CERO` NO reproduce**

```
Oraculo co_type 2: Total a pagar = suma(Monto a pagar por doc) = Ret.IVA + Ret.ISLR
                                 = 1.500,00 + 700,00 = 2.200,00 BS    OK web 2.200,00   (NO 0,00)
El SALDO no participa: Monto total base = 768.959,27 BS (saldo integro) y NO entra en el total   OK
Conversiones /771,07: 768.959,27->997,2626   1.500->1,9453   700->0,9078    OK
Total conv. = 1,95 + 0,91 = 2,86 USD    OK web 2,86 (== nu_amount_total_conversion)
```

Tabla de pagos: **"No se encontraron registros."** ✅ (0 `collection_payment` en BD) · lista con `Monto cobrado` vacío ✅ ·
Doc `B065428` · Doc Retención `27472772738244` ✅ · Comentario `ret` ✅.
🔑 **Hallazgo:** el defecto `COB-RET-TOTAL-CERO` (el detalle mostraba `0,00` en cobros de retención) **no se reproduce
en El Yaque / grupo_fiel**. **Diffs: ninguno.**

#### DW-COB-HOY-05 · Ref 31 · `co_type 0` USD con **pago parcial** · 🟢 WEB-OK

```
Doc B064821 · Pago parcial = SI · Saldo doc 114,17 USD · Monto a pagar 100,00 USD · Dif/Faltante 0,00
Total a pagar = suma(Monto a pagar por doc) = 100,00 USD    OK web 100,00 (== nu_amount_final)
ATENCION: la forma "suma(Saldo) - dcto - ret - Dif" daria 114,17 y marcaria un CALC-MISMATCH FALSO:
   con Pago parcial = SI la diferencia (14,17) NO se refleja en Diferencia/Faltante.
Suma de pagos = 100,00 (Efectivo, ref eft)    OK
Conversion (USD->BS, MULTIPLICA): 100,00 x 771,07 = 77.107,00 BS    OK web 77.107,00
```

Cliente `J508521803` / `FARMA VID DR PORTILLO, CA` ✅ · Comentario `c3` ✅ · sin Doc Retención ni Fecha Comprobante ✅.
⚠ **Nota de BD, no defecto web:** `Saldo doc. conversión = 88.031,50 BS` mientras `114,17 × 771,07 = 88.033,06`
(Δ 1,56 BS). La web reproduce fielmente `nu_balance_doc_conversion`; el redondeo lo introdujo el móvil. **Diffs: ninguno.**

#### DW-COB-HOY-06 · Ref 32 · `co_type 0`, 2 pagos + pago parcial · 🟢 WEB-OK

```
Suma de pagos = 8.000,00 (ef) + 2.000,00 (Pago Movil) = 10.000,00 BS   OK == Total a pagar == nu_amount_total
Total a pagar = suma(Monto a pagar por doc) = 10.000,00                OK (Pago parcial = SI)
   ATENCION: "Saldo - ret" daria 31.355,42 - (1.000+1.355) = 29.000,42 -> oraculo equivocado para pago parcial
Monto total base = Saldo doc = 31.355,42                               OK
Conversiones /771,07: 10.000->12,9690   31.355,42->40,6648   1.000->1,2969   1.355->1,7573    OK
```

Doc `B065289` · Doc Retención `14242425251511` ✅ · Fecha Comprobante `01/08/2026` ✅ ·
Pago Móvil: receptor `VENEZUELA USD$`, emisor `BANCO VENEZOLANO DE CREDITO`, cuenta `01020874290000499213`,
`Tipo Documento V - 1293087`, `Referencia 123456` — todos == BD ✅ · Comentario `c3` ✅. **Diffs: ninguno.**

---

### DEVOLUCIONES · DW-DEV-HOY-01 · Ref 1 · 🟢 WEB-OK

| Campo | BD | WEB | ✓ |
|---|---|---|---|
| Fecha devolución | `2026-08-17T13:00:57Z` | `17/08/2026 09:00:57` | ✓ (nota UTC-4) |
| Cliente | `J500572220` | `J500572220` · `BELMENY, C.A.` | ✓ |
| Responsable / Vendedor / Empresa | `gv` / 463 / 00001 | `gv` / `Johana Belandria` / GRUFISA | ✓ |
| Tipo de devolución | `id_type=60` | `Calidad` | ✓ |
| Precinto | `nu_seal=''` | *(vacío)* | ✓ |
| Observaciones | `tx_description='test_dev1'` | `test_dev1` | ✓ ⚠ etiqueta **sin `:`** |
| Estatus (lista) | `st_return=1` | `Enviado` | ✓ |
| N° de líneas | 2 | 2 | ✓ |

Líneas (tabla `form:j_idt169`, anclada por columnas):

| # web | Producto | Cantidad | N° Factura | Motivo | BD |
|---|---|---|---|---|---|
| 1 | `5LTS` Caja de Agua 5lts 2und | **12** | `13716` | Microbiologia-Producto Fuera de especificación (Calidad) | `co_detail 2` (`qu 12`, `id_motive 51`) ✓ |
| 2 | `5LTS` Caja de Agua 5lts 2und | **10** | `13716` | Color-Producto Fuera de especificación (Calidad) | `co_detail 1` (`qu 10`, `id_motive 52`) ✓ |

Lote y Fecha de vencimiento vacíos ✅ · `Devolución en = CJA` ✅.
✅ **Sin columnas de dinero** — no se construyó oráculo de importes (`nu_amount` NULL en BD).
📝 **Nota (no defecto):** el orden de filas está invertido respecto a `co_detail`; el par **(motivo, cantidad)** es
correcto en ambas. **Diffs: ninguno.**

---

### INVENTARIOS · DW-INV-HOY-01 · Ref 1 · 🟢 WEB-OK

Doble llave: `No. de Ref. = 1` + `Código inventario = 1786971293875.0` (== `co_client_stock`) ✅
Fecha `17/08/2026 08:54:53` ✅ · Cliente `J307257164` / `ASAOS GRILL, C.A.` ✅ · Vendedor / Empresa ✅ ·
Comentario `inv1` ✅ · Estatus (lista) `Enviado` ✅ · Coordenada del mapa `11.049022,-63.864987` vs BD
`11.049022,-63.8649875` ✅ (la web trunca 1 decimal — nota) · `Ver Pedido Relacionado` **vacío**, correcto:
`client_stock.id_order` es NULL ✅

📦 **Cantidad por ubicación, sin sumar ni mezclar** (3 filas = 3 `client_stock_detail_unit`):

| Producto | Depósito | Exhibición | Lote | Vencimiento | BD |
|---|---|---|---|---|---|
| `1.5LTS` | **2.00 CAJA** | `-` | `l4` | 17/08/2026 | `dep`, `qu 2`, `l4` ✓ |
| `1.5LTS` | `-` | **10.00 CAJA** | `l1` | 17/08/2026 | `exh`, `qu 10`, `l1` ✓ |
| `330ML` | `-` | **12.00 CAJA** | `l2` | 17/08/2026 | `exh`, `qu 12`, `l2` ✓ |

🟠 **Observación menor `INV-DET-NUMERO-FILA-CONSTANTE`:** la columna `N°` del detalle imprime **`1` en las 3 filas**
(HTML crudo verificado). En `detallePedido` la misma columna numera 1-2-3 correctamente ⇒ es específico de
`detalleInventario`. **Cosmético, no altera ningún dato** ⇒ no baja el veredicto. **Diffs de dato: ninguno.**

---

### DEPÓSITOS · DW-DEP-HOY-01 · Ref 1 · 🟠 **WEB-FIELD-MISMATCH** (1 campo)

| Campo | BD | WEB (lista y detalle) | ✓ |
|---|---|---|---|
| Fecha depósito | `2026-08-17T13:14:03Z` | `17/08/2026 09:14:03` | ✓ (nota UTC-4) |
| **Banco** | `co_bank='7738'` → **`bank.na_bank='BANESCO'`** | **`7738`** | ❌ **MISMATCH** |
| N° cuenta | `01340009180093087738` | `01340009180093087738` | ✓ |
| **N° Planilla** | `nu_document = ''` (vacío) | **celda en blanco** | ✅ *(verificado: sin `null`, sin placeholder, sin `0`)* |
| Fecha de planilla | `da_document 2026-08-17T04:00Z` | `17/08/2026 00:00:00` | ✓ |
| Monto depositado | `95.000,00` | `95.000,00 BS` | ✓ |
| Observaciones | `tx_comment='dep1'` | `dep1` | ✓ |
| Vendedor / Empresa | 463 / 00001 | Johana Belandria / GRUFISA | ✓ |
| Estatus (lista) | `st_deposit=1` | `Enviado` | ✓ |

**Aritmética:**

```
Suma(cobros hijos) == Monto depositado:  95.000,00 == 95.000,00 BS          OK
El hijo unico es la porcion en EFECTIVO del cobro 27 (295.639,02 = 95.000 ef + 200.639,02 tr):
la tabla hija lista SOLO la forma de pago depositada -> se deposita el efectivo   OK (oraculo confirmado)
Conversion (BS->USD, DIVIDE): 95.000,00 / 771,07 = 123,2054                 OK web 123,21
Enlace cruzado: el cobro Ref 27 ofrece "Consultar Deposito" y el deposito lista "N Ref cobro = 27"   OK (ida y vuelta)
```

🟠 **DEFECTO `DEP-BANCO-CODIGO-CRUDO`** — el campo rotulado **`Banco`** muestra el **código** `7738` en vez del nombre
**`BANESCO`**, tanto en la columna de la lista como en la cabecera del detalle. El nombre existe en el catálogo
(`bank`: `co_bank='7738'` → `na_bank='BANESCO'`, `id_bank=2`, empresa `00001`) y **la misma web sí lo resuelve en cobros**
(`Banco receptor: BANCO VENEZOLANO DE CREDITO`) ⇒ inconsistencia interna de la propia web, no del dato.
Impacto: el operador ve un código sin significado donde debería leer el nombre del banco.

---

### VISITAS · DW-VIS-HOY-01 · Ref 105 · 🟢 WEB-OK

**Lista** (`form:tablaVisit`, columna **`Ref` sin `#`**):

| Campo | BD | WEB | ✓ |
|---|---|---|---|
| Título | patrón `{YYYY-MM-DD}-{cliente}` | `2026-08-17-AREPAS LA ORIGINAL, C.A` | ✓ patrón cumplido |
| Fecha Programada | `da_visit 2026-08-17T12:54:12Z` | `17/08/2026` | ✓ |
| Fecha Iniciada | `da_initial 12:54:12Z` | `17/08/2026 08:54:12` | ✓ (nota UTC-4) |
| Fecha Enviada | `da_real 12:54:45Z` | `17/08/2026 08:54:45` | ✓ (nota UTC-4) |
| Status | `st_visit=2`, `is_visited=true` | `visitado` | ✓ |
| Geo | `st_coordinate=2` | `Falta Coordenada (Sucursal)` | ✓ clasificación **coherente**: la visita SÍ tiene coordenada, la que falta es la de la sucursal |
| Cliente | `J506762650` | `J506762650` · `AREPAS LA ORIGINAL, C.A` | ✓ |
| Actividad / Motivo / Descripción | `incidence` `co_type 82` / `co_cause 190` / `v1` | `COBRANZA` / `COBRANZA + RETENCION` / `v1` | ✓ |

**Detalle:** `No. de Ref. 105` ✅ · `Vendedor Johana Belandria` ✅ · `Fecha planeada 17/08/2026 08:54:12` ✅ ·
`Empresa GRUFISA` ✅ · `Código del cliente J506762650` ✅ · **`Orden de visita 1`** (== `nu_sequence`) ✅ ·
tabla `form:visitasDT`: 1 actividad, 1:1 con `incidence` ✅ · coordenada del mapa `11.049022,-63.864988` vs BD
`11.0490221,-63.8649879` ✅ (truncado, nota).
✅ `Editar` / `Eliminar` **NO se tocaron**. **Diffs: ninguno.**

---

### CLIENTES POTENCIALES · DW-CLT-HOY-01 · epoch `1786971771934.0` (id_client 34) · 🟢 WEB-OK

Localizado **sin filtro de `# Ref`** (no existe `:n_ref` en el DOM): con las fechas vacías la lista trae 3 filas y la
columna `# Ref` da el barrido exacto → fila `# Ref = 34`.
🔑 **Llave del detalle:** `Código = 1786971771934.0` == `co_client` ✅ (el detalle **no expone** `No. de Ref.`).

| Campo | BD | WEB | ✓ |
|---|---|---|---|
| Nombre | `Emma W` | `Emma W` | ✓ |
| Fecha de Registro | `2026-08-17T13:03:58Z` | `17/08/2026 09:03:58` | ✓ (nota UTC-4) |
| **Cédula** (RIF) | `nu_rif 129210234` | `129210234` | ✓ |
| Responsable | `gv` | `gv` | ✓ |
| Correo | `g@gmail.com` | `g@gmail.com` | ✓ |
| Teléfono | `0295123327` | `0295123327` | ✓ |
| Dirección / Dirección Entrega | `Valle` / `Valle` | `Valle` / `Valle` | ✓ |
| Comentario | `tx_client 'test1'` | `test1` | ✓ |
| Web | `na_web_site 't'` | `t` | ✓ **la trampa C09 no reprodujo** |
| Coordenada de transacción | `11.049013,-63.864988` | `11.049013,-63.864988` | ✓ exacta |
| Vendedor | 463 `Johana Belandria` | **`Johana`** | ✓ *(solo el primer nombre — **NO** es mismatch, ya medido en F##)* |

**Diffs: ninguno.**

---

### Verificación aritmética independiente

Las 44 igualdades citadas arriba se re-corrieron fuera del navegador con tolerancia 0,01: **44 / 44 OK, 0 fallos.**

### Estatus reportados (tal como los muestra la WEB, sin interpretar `st_*` contra `statuses`)

`pedidos → Enviado` · `cobros → Por aprobar` (los 6) · `devoluciones → Enviado` · `inventarios → Enviado` ·
`depósitos → Enviado` · `visitas → visitado`.

### Hallazgos y descubrimientos de C-HOY

| # | Tipo | Detalle |
|---|---|---|
| 1 | 🟠 **Defecto web nuevo** `DEP-BANCO-CODIGO-CRUDO` | Depósitos muestra `co_bank` (`7738`) donde debe mostrar `na_bank` (`BANESCO`), en lista y detalle. Cobros sí resuelve el nombre ⇒ inconsistencia interna de la web |
| 2 | 🟠 Cosmético `INV-DET-NUMERO-FILA-CONSTANTE` | La columna `N°` de `detalleInventario` imprime `1` en todas las filas |
| 3 | 🟢 Regresión que **NO** reproduce | `COB-RET-TOTAL-CERO`: el cobro de retención (Ref 30) muestra `2.200,00`, no `0,00` |
| 4 | 🔑 **Oráculo corregido** | El total de un cobro es **Σ(columna «Monto a pagar» de los documentos)**, válido para `co_type 0` y `2`. La forma `Σ(Saldo) − dcto − ret − Dif + IGTF` **falla con `Pago parcial = SI`** (habría dado 2 CALC-MISMATCH falsos, en los Refs 31 y 32) |
| 5 | 📝 Nota de dato (no defecto web) | Ref 31: `Saldo doc. conversión` = 88.031,50 BS vs `114,17 × 771,07` = 88.033,06 (Δ 1,56). La web reproduce fielmente lo que guardó el móvil; el redondeo lo introdujo el móvil |

### Patrones y selectores nuevos (insumo de consolidación)

1. 🔴 **La cabecera del detalle se lee con una TERCERA regla: el `div` HERMANO.** Ni padre-primero ni hoja-siguiente. El marcado real es `div.col-…>span.font-bold("Etiqueta:")` seguido de un `div` hermano con el VALOR. Con `leerCabecera()` (padre-primero) **las 11 claves de cabecera salieron vacías**; con la regla del hermano salieron todas. Convivencia medida: **padre-primero resuelve el PIE de totales, div-hermano resuelve la CABECERA** — correr las dos y quedarse con la que dé valor, campo por campo.
2. 🔴🔴 **`detalleVisita.xhtml` usa `class="font.-bold"` — CON UN PUNTO.** Typo del build: `span.font-bold` **no matchea nada** en esa página (la única que rompe el patrón, probada contra las otras 6). ⇒ anclar por `span` genérico + `textContent.endsWith(':')`, nunca por la clase.
3. 🔑 **Oráculo universal del total de un cobro:** `Total Monto a pagar = Σ(columna «Monto a pagar» de documentosPagadosDT)` — se cumplió en los 5 cobros con documentos (27, 28, 30, 31, 32), `co_type 0` y `2`.
4. **Anclajes de tablas en este build (corridos −1 respecto de difranca):** pagos de `detalleCobro` = `form:j_idt177` (difranca: `j_idt178`) · líneas de devolución = `form:j_idt169` (difranca: `j_idt170`) · tabla hija de depósito = `form:j_idt163`. ⇒ `tablaPorColumnas([...])` obligatorio, nunca el id.
5. 💎 **Receta de ciclo barata y estable — 3 llamadas por registro, 12/12 sin reintentos:** `browser_navigate(/pages/{modulo})` → `evaluate(rehidratar + abrirRef('{tabla}', ref))` → `evaluate(rehidratar + leer)`. El `abrirRef` construye el mapa `# Ref → botón` y clickea `[id$=":consultar"]` **dentro de la misma fila** — nunca toca `Editar`/`Eliminar`/`Copiar` y es inmune al corrimiento de índices. Transporte por `sessionStorage` reconfirmado: sobrevivió a ~15 navegaciones y 12 `Consultar` sin reinstalar.
6. ⚠ **Caveat del lector:** una etiqueta con valor vacío y **sin espacio final** puede absorber la etiqueta siguiente (en el pedido 1354, `IVA:` con importe 0 devolvió `"Conversión IVA:"`). El guard `/^[^:]{1,45}:\s/` no lo atrapa porque no hay espacio tras el `:`.

**Estado del entorno al cerrar:** pestaña 0 intacta, CDP `:9220` no tocado, cero escrituras en producción.

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Familia M## — Muestreo BD ↔ web (histórico)

**Playa:** el_yaque · **Empresa:** GRUPO FIEL, S.A. (GRUFISA) — única (`co_enterprise 00001`, `id_enterprise 1`),
verificada por TEXTO en los 4 módulos (el `select` trae **una sola** opción ⇒ sin riesgo de tenant cruzado).
**Modo:** READ-ONLY. Solo `Buscar` / `Consultar`. No se tocó `Editar`, `Eliminar`, `Copiar` ni el `select`
"Estatus del Cobro".

### 🔴 Corrección al volumen esperado (medido hoy en BD, `co_operation <> 'D'`)

El reparto que traía el brief estaba **muy desactualizado**. Volumen real:

| Módulo | Brief decía | **Real BD** | Histórico (<17/08) | Desde |
|---|---|---|---|---|
| pedidos | 432 en agosto | **982** | **979** | 19/05/2026 |
| cobros | 10 total / 4 hist. | **32** | **26** | 18/05/2026 |
| visitas | 43 | 43 | **42** | 10/08/2026 |
| clientes potenciales | 3 | 3 | **1** | 13/08/2026 |
| devoluciones · inventarios · depósitos | 1 c/u, de hoy | 1 c/u | **0** | — |

⇒ Se pudo cubrir **la población histórica COMPLETA de cobros (26/26)**, no solo 4.

### Qué se muestreó y con qué criterio

| Módulo | Muestra | Criterio | Detalles abiertos |
|---|---|---|---|
| **cobros** | **26 / 26** (100 % del histórico) | población completa: los 3 `co_type`, 4 meses (may/jun/jul/ago), 6 tasas distintas, con y sin retención, con y sin diferencia, con y sin depósito | **6** (refs 4, 5, 7, 10, 14, 19) |
| **pedidos** | **42 / 979** (muestra estratificada, ~4 %) | estratos mes × moneda × vendedor, 1–5 por estrato: 4 meses, **ambas monedas** (USD solo existe en mayo), **los 10 vendedores** con pedidos, con y sin IVA, con y sin descuento global | **3** (refs 134, 573, 650) |
| **visitas** | **42 / 42** (100 % del histórico) | población completa: 4 días, 4 vendedores, 8 actividades distintas, con envío mismo-día y diferido | **2** (refs 50, 72) |
| **clientes potenciales** | **3 / 3** (1 histórico + 2 de hoy) | población completa | **1** (ref 1) |
| devoluciones · inventarios · depósitos | — | **WEB-N/A** (sin histórico, confirmado en BD) | — |

🔴 **Cobertura acotada declarada:** en **pedidos** se muestrearon **42 de 979** refs (estratificado, no exhaustivo);
los conteos, en cambio, **sí se verificaron sobre el 100 %** de 7 ventanas de fecha (ver M01). En **cobros y
visitas** la muestra es la **población histórica completa**. Los detalles abiertos son **12 en total**, no todos
los registros: para los no abiertos se juzga solo la fila de lista.

---

### DW-COB-M01…M27 — cobros (26 históricos)

Rango `01/01/2026–17/08/2026` → **contados (paginador) 32 = pintados 32 = BD 32** (26 históricos + 6 de hoy).
Estatus cotejado contra `estatus_real` (último `transaction_statuses` → `statuses`), **no** contra `st_collection`.

| # Ref | `co_type` | Marca | Campos cotejados (lista) | Diffs |
|---|---|---|---|---|
| 1, 2, 3, 15, 18 | 1 Anticipo | `WEB-OK` | Monto cobrado · Total por cobrar · Estatus · Tipo · Vendedor · Fecha | ninguno en lista ⚠ detalle no abierto (ver defecto 1) |
| **4** | 0 Cobro | `WEB-OK` | + detalle completo + docs + pagos | ninguno |
| **5** | 1 Anticipo | `WEB-OK` | + detalle (pie `Monto pagado` correcto) | ninguno |
| 6, 8, 11, 16, 20, 21, 23, 25, 26 | 0 Cobro | `WEB-OK` | Monto cobrado · Total por cobrar · Diferencia · Monto conv. · Tasa · Estatus | ninguno |
| **7** | 2 Retención | `WEB-OK` | + detalle + `Doc Retención` + Ret.IVA | ninguno |
| 9, 12, 22, 24 | 1 Anticipo | `WEB-OK` | Monto cobrado · Total por cobrar · Monto conv. · Tasa | ninguno |
| **10** | 0 Cobro | `WEB-OK` | + detalle multi-documento (2 docs) | ninguno |
| 13, 17 | 2 Retención | `WEB-OK` | `Nro Retención` == `nu_voucher_retention` · Total por cobrar == Ret.IVA | ninguno |
| **14** | 1 Anticipo | **`WEB-CALC-MISMATCH`** | detalle: pie `Monto pagado` **0,00 BS** vs pagos **81.423,31 BS** | 🔴 defecto 1 |
| **19** | 1 Anticipo | **`WEB-CALC-MISMATCH`** | detalle: pie `Monto pagado` **0,00 BS** vs pagos **50.000,00 BS** | 🔴 defecto 1 |

**Aritmética explícita verificada (31/31 aserciones OK):**

```
Cobro 4  (co_type 0, 1 doc)
  Total Monto a pagar   = suma(Monto a pagar) = 45.531,43                 -> web 45.531,43  OK
  Monto total base      = suma(Saldo doc)     = 45.531,43                 -> web 45.531,43  OK
  conv base   45.531,43 / 515,18 =  88,3798                               -> web     88,38  OK
  conv pago   46.371,00 / 515,18 =  90,0094                               -> web     90,01  OK
  Diferencia  46.371,00 - 45.531,43 = 839,57                              -> web    839,57  OK  (= BD nu_difference)

Cobro 7  (co_type 2, retencion - el SALDO no participa)
  Total = Ret.IVA + Ret.ISLR = 3.973,59 + 0,00 = 3.973,59                 -> web  3.973,59  OK
  suma(Monto a pagar) = 3.973,59                                          -> web  3.973,59  OK
  Monto total base = suma(Saldo doc) = 28.808,55                          -> web 28.808,55  OK
  conv  3.973,59 / 515,18 = 7,7130 · 28.808,55 / 515,18 = 55,9192         -> web 7,71 / 55,92 OK
  Doc Retencion 20260100000046 == BD nu_voucher_retention                                   OK

Cobro 10 (co_type 0, 2 documentos)
  suma(Monto a pagar) = 23.734,75 + 28.690,56 = 52.425,31                 -> web 52.425,31  OK
  suma(Saldo doc)     = 23.734,75 + 28.690,56 = 52.425,31                 -> web 52.425,31  OK
  conv 52.425,31 / 517,96 = 101,2149                                      -> web    101,21  OK
  Diferencia 53.396,00 - 52.425,31 = 970,69                               -> web    970,69  OK

Cobro 14 / 19 (co_type 1, anticipo NO aplicado)
  pagos    81.423,31 BS  ·  conv 81.423,31 / 517,96 = 157,1997            -> web    157,20  OK
  pagos    50.000,00 BS  ·  conv 50.000,00 / 721,35 =  69,3079            -> web     69,31  OK
  pie "Monto pagado"  0,00 BS   =/=  81.423,31 / 50.000,00                     MISMATCH
```

`Monto cobrado` de la lista == `nu_amount_total` en **26/26**. `Total por cobrar` == `nu_amount_final` en
**26/26**. `Nro Retención` == `nu_voucher_retention` en **3/3**. Vendedores == `users` en **26/26**.
Estatus == `estatus_real` en **26/26** (24 «Por aprobar» st=3, 2 «Aprobado» st=1: refs 21 y 22).

**DW-COB-M27:** ningún cobro histórico tiene `id_deposit` ⇒ el caso "cobro con depósito vinculado" no es
evaluable sobre histórico. El único con `Consultar Depósito` es el **27, de hoy** (cubierto por C-HOY).
→ `WEB-N/A`.

---

### DW-PED-M01…M45 — pedidos (42 muestreados · conteos sobre el 100 %)

**M01 — conteo por ventana (paginador vs BD):**

| Ventana | Web contados | BD total | BD visible vía `salesman_view` | Veredicto |
|---|---|---|---|---|
| 01/05–30/06 | **125** | 128 | **125** | 🔴 3 ocultos (defecto 2) |
| 01/07–01/07 | 23 | 23 | 23 | ✓ |
| 24/07–27/07 | 75 | 75 | 75 | ✓ |
| 01/08–07/08 | 137 | 137 | 137 | ✓ |
| 10/08–10/08 | 35 | 35 | 35 | ✓ |
| 11/08–12/08 | 156 | 156 | 156 | ✓ |
| 13/08–13/08 | 61 | 61 | 61 | ✓ |

Global histórico: **BD 979 · visibles 976 · faltan 3**.

**M02/M03/M05 — por registro (42):** `Monto Base` == `nu_amount_total_base`, `Monto Total` == `nu_amount_total`,
`Total items` == `nu_details`, `Monto conv.` y `Tasa conv.` == BD, en **41/42** (el que falta es el ref 112, que
no aparece en la lista).

Muestra: refs 1, 2, 3 (USD, mayo — única moneda USD del histórico; conv **multiplica**: 53,20 × 517,96 = 27.555,5) ·
37, 38, 39, 60, 61, 62 · **112** 🔴 · 133, **134**, 135, 136, 137 · 557 · **573** · 648, 649, **650**, 651, 652,
654, 655, 663 · 778, 779, 780, 793, **801**, 804, 805, 808, 811, 819 · 864, 949, 958, 959, 968, 1098, 1099, 1100.

**Aritmética explícita (M04, 3 detalles abiertos):**

```
Pedido 134  (con IVA 16 %)
  suma subtotales de linea = 17.889,98 + 11.549,52 + 16.971,61 + 11.990,34 = 58.401,45
                                                                -> Monto Total Pedido 58.401,45  OK
  Monto Base 50.346,08 x 1,16 = 58.401,4528                     -> 58.401,45                     OK
  Monto Base 50.346,08 + IVA 8.055,37 = 58.401,45                                                OK
  suma(order_detail.nu_amount_total) BD = 58.401,4528            == suma web                     OK
  conv: 50.346,08/633,36 = 79,4903 -> 79,49 · 8.055,37/633,36 = 12,7186 -> 12,72
        58.401,45/633,36 = 92,2089 -> 92,21   (79,49 + 12,72 = 92,21)                            OK

Pedido 573  (descuento global 10 %)
  brutos de linea: 15x5.837,48 + 100x3.616,14 + 20x3.426,72 = 517.710,60 -> Subtotal bruto       OK
  descuento global = 517.710,60 x 10 % = 51.771,06               -> web 51.771,06                OK
  Monto Total = 517.710,60 - 51.771,06 = 465.939,54              -> web 465.939,54               OK
  suma subtotales de linea = 78.805,98 + 325.452,60 + 61.680,96 = 465.939,54  (dcto PRORRATEADO
       por linea: 15x5.837,48x0,90 = 78.805,98)                                                  OK
  suma(order_detail) BD = 465.939,54                             == suma web                     OK
  conv: 697,51 - 69,75 = 627,76 · 465.939,54/742,23 = 627,7564                                   OK

Pedido 650  (sin IVA ni descuento)
  suma = 34.470,40 + 7.275,16 + 11.744,18 + 12.185,90 = 65.675,64  -> Monto Total 65.675,64      OK
  precio base x unidades por linea: 3.447,04x10 · 3.637,58x2 · 5.872,09x2 · 6.092,95x2           OK
  conv 65.675,64 / 746,63 = 87,9628                              -> 87,96                        OK
```

---

### DW-VIS-M01…M42 — visitas (42 históricas, población completa)

Conteo por día: **10/08 → 11 · 11/08 → 26 · 12/08 → 1 · 13/08 → 4 = 42** — coincide **exactamente** con BD.
Ventana 01/08–31/08 → **43** (42 + la de hoy, ref 105). Refs presentes: 1–4, 35–72. **0 faltantes.**

| Verificación | Resultado |
|---|---|
| **M01** las 42 aparecen filtrando por un rango que las abarque | ✅ 42/42 |
| **M02** Estatus + las 3 fechas (Programada / Iniciada / Enviada) == BD (`da_visit`,`da_initial`,`da_real`) | ✅ 42/42 · incluye 8 con **envío diferido** (iniciada 11/08, enviada 12–13/08): refs 39–42, 63, 65–67, 71 — coinciden con BD |
| **M03** actividades y motivos == `incidence`+`incidence_type`+`incidence_motive` | ✅ 4/4 cotejados en BD (refs 1, 50, 64, 72) y 2/2 en detalle |
| **M04** coordenadas | BD tiene `coordenada` en 42/42. La lista da veredicto `Geo` (Correcto / Fuera de Rango / Falta Coordenada **(Sucursal)**). ⚠ «Falta Coordenada (Sucursal)» se refiere a la sucursal del **cliente**, no a la de la visita → **no es defecto**. El detalle **no imprime la coordenada como texto** (vive en el mapa), igual que `detalleInventario` |
| **M05** consistencia lista ↔ detalle (cliente, vendedor, orden de visita) | ✅ 2/2 (refs 50, 72): `Orden de visita` 1 == `nu_sequence` 1 |
| **M06** patrón del título `{fecha}-{cliente}` | ✅ 42/42 — usa la fecha **programada**, no la real (ref 71: título `2026-08-11-…`, enviada 13/08) |

Marca: **`WEB-OK` en 42/42.** Vendedores: 473 CATLEN PALENCIA (4), 476 JESUS RODRIGUEZ (27), 477 Jenny Camacho (11)
— todos == BD. Detalle ref 72: `VENTA EN RUTA` / `VENTA EFECTIVA` / `Despacho al cliente` == BD ✓.
Detalle ref 50: `COBRANZA NO EFECTIVA` / `PROBLEMAS CON EL BANCO` == BD ✓.

---

### DW-CLT-M01…M03 — clientes potenciales (3/3)

| # Ref | Marca | Cotejo |
|---|---|---|
| **1** (histórico, 13/08) | `WEB-OK` | RIF · nombre · responsable · fecha · **detalle**: correo, teléfono, dirección, dirección de entrega, coordenada, comentario |
| 34, 35 (de hoy) | `WEB-OK` | lista: RIF, cliente, responsable, fecha == BD |

- **RIF:** `1086432724-IXY` == `nu_rif` — **completo, sin truncar** ✓ (3/3)
- **Detalle ref 1 sin truncar:** `glegmagi@gmail.com` · `0414-4638636` ·
  `c/principal #4 URB Villa Caribe, Turmero` == `tx_address` ·
  `c/ Camilo Torres, frente a migass panadería` == `tx_address_dispatch` ·
  `10.2257664,-67.4728654` == `coordenada` · `cerca del colegio Libertador` == `tx_client` ✓
- **Sin duplicados:** BD → 0 RIF repetidos entre potenciales y **0 choques contra `client`** ✓
- ⚠ La columna **Vendedor** trae **solo el primer nombre** (`GILBERTO` por `GILBERTO LEGMAGI`) — ya documentado,
  **NO es mismatch**. Reconfirmado.

---

### Módulos sin histórico — `WEB-N/A` confirmado en BD

| Módulo | Tabla | Registros | Fecha | Marca |
|---|---|---|---|---|
| devoluciones | `return` | 1 | 17/08/2026 09:00 | `WEB-N/A` — sin registros históricos |
| inventarios | `client_stock` | 1 | 17/08/2026 08:54 | `WEB-N/A` — sin registros históricos |
| depósitos | `deposit` | 1 | 17/08/2026 09:14 | `WEB-N/A` — sin registros históricos |

El esfuerzo se volcó en pedidos, cobros y visitas.

---

## HALLAZGOS DE M##

### 🔴 1. `COB-ANTICIPO-MONTO-PAGADO-CERO` — NUEVO · severidad alta

El **pie del detalle** de un cobro `co_type = 1` (Anticipo/Prepago) imprime `nu_amount_final` en lugar de
`nu_amount_total`. Cuando el anticipo **aún no está aplicado a un documento** (`nu_amount_final = 0`), el detalle
informa **`Monto pagado: 0,00 BS`** pese a que el dinero se cobró.

| Evidencia | Ref 19 | Ref 14 |
|---|---|---|
| Lista → `Monto cobrado` | 50.000,00 BS | 81.423,31 BS |
| Detalle → **tabla de pagos** (misma página) | 50.000,00 BS · 69,31 USD | 81.423,31 BS · 157,20 USD |
| Detalle → **pie `Monto pagado`** | **0,00 BS** 🔴 | **0,00 BS** 🔴 |
| BD `nu_amount_total` / `nu_amount_final` | 50000,00 / **0,00** | 81423,31 / **0,00** |

**Contraste que acota la causa:** el ref **5** (anticipo con `nu_amount_final = 839,57`) muestra en el pie
**`839,57 BS`**, coincidente con su tabla de pagos ⇒ el pie **no siempre** está roto: falla exactamente cuando
`nu_amount_final = 0`.

**Alcance en este tenant:** 7 de los 13 anticipos históricos cumplen la condición → refs **1, 2, 3, 14, 15, 18, 19**
(verificados en detalle el 14 y el 19; los otros 5 no se abrieron).
**Impacto de negocio:** el detalle de un anticipo de 50.000 BS le dice al usuario que se pagó **cero**.
Marca: `WEB-CALC-MISMATCH`.

### 🟠 2. Pedidos ocultos por `salesman_view` — **REPRODUCE** el pendiente ya conocido, con cifras exactas

No es nuevo: es el pendiente `PENDIENTE-pedidos-ocultos-salesman-view`. **Se confirma en grupo_fiel**, y cierra la
duda de si el join era por `id_user` o por `co_user`.

- `id_user = 461` (`co_user 027`, login `001`, «027 027») **no está en `salesman_view`**.
- Sus **3 pedidos** — refs **112, 113, 114**, todos del **22/06/2026**, `st_order = 6` (Enviado), **29.826,38 BS**
  en total — existen en `"order"` con `co_operation <> 'D'` y **no aparecen** en `/pages/pedidos`.
- Medición que lo prueba sin ambigüedad: ventana 01/05–30/06 → **BD 128 · web 125 · BD filtrado por `salesman_view` 125**.
  Global histórico: **BD 979 · web 976**.
- El join que reproduce la web es **`order.id_user IN (SELECT id_user FROM salesman_view)`** ⇒ **por `id_user`**,
  como decía la nota. Marca: `WEB-FIELD-MISMATCH` (la lista devuelve **de menos**).

### 🟡 3. `COB-LISTA-TASA-NA` — NUEVO · menor (divergencia lista ↔ detalle)

En la **lista** de cobros, `Tasa conv.` muestra **`N/A`** y `Monto conv.` **`N/A USD`** en los 10 cobros históricos
cuyo `nu_amount_total_conversion = 0` (refs **1, 2, 3, 7, 13, 14, 15, 17, 18, 19** — todos anticipos y retenciones).
Pero el **detalle de esos mismos cobros sí muestra la tasa**:

- ref 7 → lista `Tasa conv. N/A` · detalle **`Tasa de conversión: 515,18`** y `Total Monto a pagar conversión: 7,71 USD`
- ref 19 → lista `N/A` · detalle **`721,35`**

BD guarda `nu_value_local` en **26/26**. La lista suprime la tasa cuando el importe convertido es 0, lo que la hace
inconsistente con su propio detalle. Marca: `WEB-FIELD-MISMATCH` (presentación).

### 🟢 4. Defectos conocidos que **NO** reproducen aquí

- **`COB-RET-TOTAL-CERO`: no reproduce.** Verificado en **las 3** retenciones históricas (refs 7, 13, 17):
  `Total por cobrar` de la lista == `Total Monto a pagar` del detalle (3.973,59 · 12.699,62 · 15.620,32).
- **`DEP-BANCO-CODIGO-CRUDO` no contamina cobros:** `detalleCobro` muestra el **nombre** del banco (`BANESCO`,
  `BANCO VENEZUELA`), no el código. El defecto es específico de depósitos.
- **`INV-DET-NUMERO-FILA-CONSTANTE`:** no evaluable (inventarios sin histórico). En `detallePedido`, `detalleCobro`
  y `detalleVisita` la columna `N°` numera **correctamente** (1,2,3,4).

### ⚪ 5. Dos falsas alarmas descartadas antes de reportarlas

1. **«El filtro de fechas de visitas está roto»** — las 2 primeras búsquedas de `/pages/visitas` devolvieron **1 fila**
   con rangos que contenían 42 registros (incluso con 01/01–31/12). **No es defecto:** a partir de la 3.ª búsqueda los
   conteos son exactos (11+26+1+4 = 42). Es **resultado rancio de la primera búsqueda** tras cargar la página.
   ⇒ **repetir el `Buscar` antes de concluir nada en visitas.**
2. **«El detalle de cliente potencial no muestra la Cédula/RIF»** — el lector devolvía `Cédula: ":"`. Las líneas crudas
   muestran `Cédula::` y en la **línea siguiente** `1086432724-IXY`. **El producto está bien**; era un bug del parser.

## Patrones y selectores nuevos de M##

1. 🔑 **El detalle completo se lee con `document.getElementById('form').innerText` — una sola regla para cabecera Y pie.**
   Reemplaza con ventaja el par `leerCabecera` (padre-primero) + div-hermano. Cada línea es o bien `"Etiqueta:"` seguida
   del valor en la **línea siguiente** (cabecera), o bien `"Etiqueta: valor"` en la **misma línea** (pie de totales).
   Es inmune al typo `class="font.-bold"` de `detalleVisita` (no ancla por clase) y resuelve el **pie** de
   `detalleCobro`/`detallePedido`, que con padre-primero sale **corrido en uno** (cada etiqueta absorbe la siguiente).
   ⚠ **`document.querySelector('form')` NO sirve**: la página tiene 4 `form` y el primero (`menuform`) tiene 86
   caracteres. Hay que tomar **`#form`** o el de mayor `innerText`.
2. 🔴 **Guard obligatorio para `Cédula::`.** Con la regla "misma línea", `"Cédula::"` matchea y devuelve el valor `":"`,
   **ocultando el RIF que está en la línea siguiente**. Casi produce un falso `WEB-FIELD-MISMATCH`. ⇒ si el valor
   capturado en la misma línea no contiene ningún alfanumérico, descartarlo y caer a la línea siguiente.
3. **Tablas hijas medidas en ESTE build:** `detalleCobro` pagos = **`form:j_idt177`** (difranca tenía 178) ·
   `detalleCobro` documentos = `form:documentosPagadosDT` (id semántico ✅) ·
   `detalleVisita` actividades = **`form:visitasDT`** ← **id SEMÁNTICO, no `j_idt`** (dato nuevo) ·
   `detallePedido` líneas = `form:pedidosDT`.
4. **`/pages/visitas`: la PRIMERA búsqueda devuelve resultado rancio.** Hacer un `Buscar` de calentamiento y medir en
   el siguiente, o no cantar `WEB-MISSING` sin repetir.
5. **Reconfirmado: el rango de fechas NO tapa el `# Ref`.** Además, **visitas SÍ tiene `[id$=":n_ref"]`**.
6. **Rows-per-page:** `.ui-paginator-rpp-options` acepta `50|100|200`; `el.value='200' + dispatchEvent('change')`
   funciona y **persiste entre búsquedas**. Imprescindible para leer ventanas de más de 50 filas de una pasada.
7. **Botón `Buscar`:** `[id$=":ajax"]` en cobros/pedidos/clientesPotenciales · `[id$=":btnBuscar"]` en visitas.
8. **Oráculo de pedidos, refinado con evidencia:** `nu_amount_total_base` **cambia de significado** según el caso — es
   la **base neta sin IVA** cuando hay IVA (ref 134: `base × 1,16 = total`) y el **bruto antes del descuento** cuando
   hay descuento global (ref 573: `base − dto = total`). El invariante que **siempre** se cumple es
   **`Σ(subtotales de línea) == Monto Total`** y **`Monto conv. == Monto Total / tasa`**. Usar ése.

**Convivencia:** no se tocó el dispositivo ni el CDP `:9220`; se trabajó en la pestaña 1 y la pestaña 0 quedó intacta.

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Familia A## — Adjuntos

🔴 **Los adjuntos de este tenant NO son recuperables desde la web. 7/7 módulos.** Ni descarga ni visor.

**Oráculo BD** (`transaction_image` + `transaction_files`, `co_operation <> 'D'`) — uniforme en todos los
registros probados: **2 jpeg + 1 documento = 3 entradas esperadas** por registro.
⚠ **Nunca se usó `nu_attachments`**: para los cobros 27-32 vale **4** porque incluye la firma, que no viaja en el
ZIP ⇒ habría dado el falso −1 sistemático ya documentado.

| Módulo | Caso | Qué se probó | Esperado | Obtenido | Marca |
|---|---|---|---|---|---|
| cobros | DW-COB-A01/04 | `Descargar adjuntos` en Ref 27 | evento `download`, ZIP `PK`, 3 entradas (27_0.jpeg, 27_1.jpeg, 27_0.pdf) | **sin evento**; el POST devuelve `200 text/html;charset=UTF-8`, **sin `Content-Disposition`**; 0 bytes | **WEB-MISSING** |
| cobros | DW-COB-A07 | `Ver adjuntos` Ref 27 | visor con las 2 imágenes | el diálogo abre y lista **los 2 nombres exactos de BD**, pero `src=http://localhost:8282/...` → `naturalWidth=0` | **WEB-MISSING** |
| pedidos | DW-PED-A01/04/08 | Ref 1354 (1354_0.jpeg, 1354_1.jpeg, 1354_0.xlsx) | 3 entradas | idéntico: descarga 0; visor `localhost:8282/.../pedidos/1354_0.jpeg`, no carga | **WEB-MISSING** |
| devoluciones | DW-DEV-A01/04/08 | Ref 1 | 3 entradas | idéntico | **WEB-MISSING** |
| depósitos | DW-DEP-A01/04/08 | Ref 1 | 3 entradas | idéntico | **WEB-MISSING** |
| inventarios | DW-INV-A01/04/08 | Ref 1 | 3 entradas | idéntico | **WEB-MISSING** |
| visitas | DW-VIS-A01/04/08 | Ref 105 (105_0/1.jpeg, 105_0.xlsx) | 3 entradas | idéntico | **WEB-MISSING** |
| clientes pot. | DW-CLT-A01/04/08 | id_client 34 (34_0/1.jpeg, 34_0.pdf) | 3 entradas | idéntico; carpeta `clientes` | **WEB-MISSING** |
| clientes pot. | DW-CLT-A07 | **Ref 35, 0 filas en ambas tablas** | comportamiento sin adjuntos | los botones **sí** aparecen, pero el visor **no abre** (correcto) y no descarga | **WEB-OK** |
| cobros | A-extra | filtro `Tiene Adjunto` vs BD (`has_attachments=true` = 10/10 en el rango) | SI→10 · NO→0 | SI→10 · NO→0 | **WEB-OK** |

**Aritmética del oráculo:** esperado por registro = `transaction_image` 2 + `transaction_files` 1 = **3**;
obtenido en el ZIP = **0 (no hubo ZIP)** en los 7 módulos.

**Nota de datos:** los cobros 23-26 tienen `has_attachments=true` con `nu_attachments=1` y **0 filas** en ambas
tablas ⇒ son **solo firma**, sin nada descargable. No se contaron como adjuntos.

### Defectos nuevos de A##

1. 🔴 **`ADJ-DESCARGA-NO-ENTREGA-ZIP`** (alta · 7/7 módulos) — `Descargar adjuntos` es un `button type=submit`
   **sin `onclick`**; el POST re-renderiza la página (`text/html`, **sin `Content-Disposition`**, sin growl ni
   mensaje de error) y no entrega archivo. Falla **silenciosa**: el usuario no distingue "no hay adjuntos" de
   "el servidor no los mandó".
2. 🔴 **`ADJ-VISOR-URL-LOCALHOST`** (alta · 7/7 módulos) — el visor construye la URL absoluta
   `http://localhost:8282/denario/resources/images/<carpeta>/<archivo>?pfdrid_c=true`. Desde cualquier navegador
   que no sea el del propio servidor, la imagen nunca carga. Se probaron 4 variantes: `localhost:8282` → error ·
   `denarioelyaque.ddns.net:8282` → **timeout** (puerto no expuesto) · `:8080/denario/...` y
   `:8080/DenarioPremium/resources/...` → error. **Los metadatos son correctos** (nombres y cantidad calzan 1:1
   con `transaction_image`); lo roto es **la entrega**.
3. 🟡 **`ADJ-VISOR-OMITE-DOCUMENTOS`** (media) — el visor solo lista `transaction_image`. El documento de
   `transaction_files` (pdf/xlsx) **no se ofrece en ninguna superficie**: al no funcionar la descarga, queda
   inalcanzable por completo.
4. 🟢 **`CLT-BOTON-DESCARGAR-ADJUNTO-SINGULAR`** (baja) — en clientes potenciales el botón se rotula
   `Descargar Adjunto`; en los otros 6, `Descargar adjuntos`. Un selector por texto exacto falla ahí.

---

## Familia D## — Comportamiento

| Módulo | Caso | Qué se probó | Esperado | Obtenido | Marca |
|---|---|---|---|---|---|
| pedidos | DW-PED-D01 | contados vs pintados vs BD | rowCount == BD | paginador **433** == BD **433** (`da_order` 01/08–17/08, `co_operation<>'D'`) | **WEB-OK** |
| pedidos | DW-PED-D01 | rows-per-page 200→50 y página 2 | 50 pintados, sin repetir ni saltar | pág.1 `1356…1181` (50) · pág.2 `1180…1072` (50), **contiguas, 0 solape**; rowCount se mantiene 433 | **WEB-OK** |
| pedidos | D-extra | persistencia del rpp entre búsquedas | rpp sobrevive a `Buscar` | 200 tras cambiar → **200 tras `Buscar`**; el estado es **por módulo** | **WEB-OK** |
| pedidos | DW-PED-D02 | orden `# Ref` asc/desc, numérico | numérico, no texto | asc `648,649,650…` == **min BD 648** · desc `1356,1355,1354` == **max BD 1356** | **WEB-OK** |
| pedidos | D-extra | el orden **no pierde el filtro** | filtro intacto | con `# Ref=1354`: antes rowCount 1 / input `1354`; tras ordenar **rowCount 1 / input `1354`** | **WEB-OK** |
| cobros | DW-COB-D01 | contados vs pintados vs BD | == | paginador **10** == pintados **10** == BD **10** (`da_collection >= 01/08`) | **WEB-OK** |
| visitas | DW-VIS-D01 | conteo | == BD | pintados **43** == BD **43**, 1 sola página (rpp 50) | **WEB-OK** |
| 6 módulos | DW-*-D0x | mensaje de lista vacía (`# Ref=999999`) | literal correcto | `"No se encontraron registros."` en cobros, pedidos, devoluciones, depósitos, inventarios; **`"No existe registro"`** en visitas | **WEB-OK** |
| cobros | DW-COB-D05 | formato es-VE + moneda del registro | `2.000.000,00` + moneda propia | `77.107,00 BS`, `295.639,02 BS`, `100,00 USD`, `12,97 USD` — miles `.`, decimales `,`, 2 dec., moneda por registro | **WEB-OK** |
| pedidos | DW-PED-D05 | formato | idem | `155.737,17 BS` / `217,89 USD` / `771,07 BS = 1 USD` | **WEB-OK** |
| cobros / pedidos | DW-*-D0x | columnas presentes, ninguna vacía en toda la página | 18 y 14 columnas, sin columna muerta | **0 columnas vacías** en ambos | **WEB-OK** |
| cobros | DW-COB-D03 | columna `Monto cobrado` vs BD | 1 importe == `nu_amount_total` | **N importes concatenados**, y **vacío** cuando no hay pagos | **WEB-FIELD-MISMATCH** |
| clientes pot. · devol. · depós. · inv. | DW-*-D01 | paginación | — | 3 · 1 · 1 · 1 registros: **sin volumen que paginar** | **WEB-N/A** |
| todos | DW-*-D0x | selector `Columnas` (mostrar/ocultar) | — | **no probado** — recorte de cobertura declarado | **WEB-N/A** |

**Aritmética explícita**

```
Conversion pedido 1355: 168.009,26 BS / 771,07 = 217,89 USD    == web  OK  (BS->USD: DIVIDE)
Conversion cobro 31:    100,00 USD x 771,07 = 77.107,00 BS     == web  OK  (USD->BS: MULTIPLICA)
Conversion cobro 28:    109.000,00 / 771,07 = 141,36 USD       == web  OK
Diferencia cobro 23:    37.578,13 - 36.642,91 = 935,22 BS      == web  OK
Cobro 32: celda = "2.000,00 BS" + "8.000,00 BS" -> suma 10.000,00   == BD nu_amount_total 10.000,00
Cobro 27: celda = "200.639,02 BS" + "95.000,00 BS" -> suma 295.639,02 == BD 295.639,02
Cobro 30: celda VACIA  vs  BD nu_amount_total 2.200,00 BS      =>  -2.200,00 sin mostrar
```

### Defecto nuevo de D##

5. 🟡 **`COB-LISTA-MONTO-COBRADO-POR-PAGO`** (media) — la columna `Monto cobrado` de `/pages/cobros` no renderiza
   el total del cobro sino **un importe por forma de pago, concatenados sin separador**
   (`"2.000,00 BS 8.000,00 BS"`). La suma sí cuadra con BD, pero un parser de un solo número lee `2.000,00` y
   canta un MISMATCH falso.
   **Corolario grave:** con **cero** formas de pago la celda queda **vacía** — es el caso del Ref 30,
   `Tipo de Cobro = Retención` (`co_type=2`), cuya columna `Pagos` también viene vacía.
   ⚠ Esto **amplía** el defecto conocido `COB-RET-TOTAL-CERO` (co_type=2 ⇒ Σ pagos = 0) a una **superficie nueva,
   la LISTA**, y con una manifestación distinta: **vacío**, no `0,00`. No se levanta como hallazgo independiente
   de causa raíz.

### Recorte de cobertura declarado

- El selector **`Columnas`** (mostrar/ocultar) **no se probó** en ningún módulo.
- **Paginación** no evaluable en clientes potenciales (3), devoluciones (1), depósitos (1) e inventarios (1):
  sin volumen que paginar.

### Patrones / selectores nuevos de A## y D##

- **Botón `Descargar adjuntos` = `button type="submit"` sin `onclick`**, id `j_idt*` (`form:j_idt161` cobros ·
  `form:j_idt202` pedidos). Se encuentra bien por rol+nombre; lo que no llega es el archivo.
  ⚠ En clientes potenciales el texto es **`Descargar Adjunto`** (singular, A mayúscula) ⇒ anclar con
  `/descargar\s+adjunto/i`.
- 🔑 **Diagnóstico correcto de una descarga rota:** no basta `waitForEvent('download')` (solo dice "timeout").
  Escuchar `page.on('response')` y mirar **`content-type` + `content-disposition`** distingue *"el servidor no
  mandó el archivo"* de *"el click no llegó"*. Fue lo que convirtió un BLOCKED en un defecto con evidencia.
- **El visor `Ver adjuntos` sirve de oráculo de existencia**: `.ui-dialog` con
  `getComputedStyle(d).display==='block'` (confirmado: `offsetParent` **no** sirve). Con 0 adjuntos **no abre**
  (Ref 35) y con adjuntos **sí** ⇒ discrimina sin depender de la descarga.
- **Ruta de recursos de adjuntos:** `http://localhost:8282/denario/resources/images/<carpeta>/<archivo>?pfdrid_c=true`.
  Carpetas: `cobros · pedidos · devoluciones · depositos · inventarios · visitas · clientes` — **`clientes`**,
  igual que `na_transaction` en BD (no `clientes_potenciales`, que era la duda abierta en la doc).
- **`PF('<tabla>').paginator.cfg`** expone, además de `rowCount`: **`rows`** (rows-per-page vigente) y **`page`**
  (índice 0-based). Las tres juntas permiten afirmar "contados == pintados == página correcta" en una sola lectura.
  Reconfirmado: **`PF('tablaVisit')` no expone paginator** (lanza) ⇒ en visitas contar `.ui-paginator-page`.
- **Visitas tiene DOS paginadores** (arriba y abajo): `.ui-paginator-rpp-options` devuelve
  `["50","100","200","50","100","200"]` ⇒ usar `querySelector` (el primero), nunca `querySelectorAll` sin deduplicar.
- **Cambiar rows-per-page sin `browser_click`:** `sel.value='50'; sel.dispatchEvent(new Event('change',{bubbles:true}))`
  sobre `.ui-paginator-rpp-options` — funciona y respeta la regla de no anclar `j_idt*`.
- **Ordenar:** `th.click()` sobre el `th` con `.ui-sortable-column`; 1.er click = **asc**, 2.º = **desc**;
  **conserva el filtro y el rowCount**.
- **La moneda en GRUPO FIEL se rotula `USD` y `BS`** (no `US$`, no `BSD`) ⇒ `parseMoneda()` los normaliza bien y
  `verificarConversion()` **sí** deduce la dirección en esta playa.
- ⚠ **El rango de fechas por defecto (mes en curso hasta hoy) SÍ acota la lista** (pedidos 433 de 982 · cobros 10
  de 32). No contradice lo medido antes (las fechas no tapan el `# Ref`): acota el **listado sin filtro**, no la
  búsqueda por Ref. **Todo conteo global debe compararse contra BD con el mismo rango.**

**Confirmación de borrado de adjuntos (obligatoria):** barrido explícito en las **dos** ubicaciones —
`DenarioPremiunMovil/.playwright-mcp/` → **0** archivos `*.zip|*.jpeg|*.jpg|*.png|*.pdf|*.xlsx|*.crdownload|*.part`;
cwd `qa-piloto-automatizacion/` → **0**. Matiz honesto: **en esta corrida nunca llegó a bajar ningún archivo**,
precisamente porque la descarga está rota ⇒ no hubo dato productivo en disco en ningún momento; el barrido igual
se ejecutó y quedó en cero.

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

---

## Re-test A## — Adjuntos tras el fix del rutero (desarrollo)

RUN_ID 20260817_092435_smoke-completo · cliente grupo_fiel · playa **el_yaque**
(`http://denarioelyaque.ddns.net:8080/DenarioPremium`) · empresa **GRUPO FIEL, S.A. (GRUFISA)** · read-only.
Oráculo de contenido: `transaction_image` ∪ `transaction_files`. Horas de creación en **UTC** (`da_update`);
la web muestra local UTC−4.

### 🔑 Hallazgo central: el fix es de RENDER, no de registro — y la URL ya no es `localhost`

El visor **ya no construye `http://localhost:8282/...`**. Ahora construye, para **todos** los registros
(viejos y nuevos por igual):

```
http://denarioelyaque.ddns.net:8080/denario/resources/images/{carpeta}/{ref}_{n}.jpeg?pfdrid_c=true
```

Es decir: **`ADJ-VISOR-URL-LOCALHOST` está corregido**, y la corrección alcanza también a los registros viejos.
Lo que distingue viejos de nuevos **no es la URL — es idéntica — sino si el archivo existe** en la ubicación que
ese rutero sirve. Los archivos anteriores al fix **nunca se escribieron ahí y no se migraron**.

### A/B de visitas — mismo módulo, misma URL, distinto resultado

| Ref | Cliente | Creada (UTC) | URL que construye el visor | ¿Carga? | Descarga: ct / content-disposition / bytes | Marca |
|---|---|---|---|---|---|---|
| **105** | AREPAS LA ORIGINAL, C.A | **12:54** 🔴 antes | `…:8080/denario/resources/images/visitas/105_0.jpeg?pfdrid_c=true` | ❌ `naturalWidth=0` · HTTP **404** `text/html` 738 B | `200 text/html;charset=UTF-8` · **sin `Content-Disposition`** · **sin evento download** | **WEB-MISSING** |
| **106** | CHICHA EL ARABITO, C.A | **16:00** 🟢 después | `…/visitas/106_0.jpeg?pfdrid_c=true` (+ `_1`, `_2`) | ✅ 3/3 · `1080×2340` · HTTP **200 `image/jpeg`** | **`application/zip`** · `attachment; filename="visita_106.zip"` · **391.163 B, 3 entradas** | **WEB-OK** |
| **107** | AREPAS LA ORIGINAL, C.A | **16:01** 🟢 después | `…/visitas/107_0.jpeg?pfdrid_c=true` | ✅ `720×1600` · HTTP **200 `image/jpeg`** 93.205 B | **`application/zip`** · `attachment; filename="visita_107.zip"` · **145.386 B, 2 entradas** | **WEB-OK** |

105 y 107 son **el mismo cliente** y la **misma plantilla de URL**: la única variable es el momento de creación.
Entradas de los ZIP = exactamente el oráculo BD (106: 3 imágenes + 0 archivos · 107: 1 imagen `107_0.jpeg` +
1 archivo `107_0.xlsx`).

### Otros módulos — el fix es TRANSVERSAL

Prueba UI completa (visor abierto + botón `Descargar adjuntos`):

| Módulo | Ref | Creado (UTC) | Visor (`naturalWidth`) | Descarga (ct / content-disposition) | ZIP | Marca |
|---|---|---|---|---|---|---|
| cobros | **27** | 13:06 🔴 antes | ❌ 0 y 0 (2 img) | `200 text/html` · **sin CD** | — sin evento | **WEB-MISSING** |
| cobros | **36** | 15:50 🟢 después | ✅ `1080×2340`, `3060×4080`, `1080×2340` | **`application/zip`** · `cobro_36.zip` | **1.629.554 B, 3 entradas** | **WEB-OK** |
| pedidos | **1357** | 16:21 🟢 después | ✅ 2/2 `1080×2340` | **`application/zip`** · `pedido_1357.zip` | **287.534 B, 2 entradas** | **WEB-OK** |
| inventarios | **1** | 12:56 🔴 antes | ❌ 0 y 0 (2 img) | `200 text/html` · **sin CD** | — sin evento | **WEB-MISSING** |

Sondeo HTTP directo sobre la **misma URL que usa el visor** (22 archivos, 7 módulos):

| Módulo / carpeta | 🔴 Anteriores al fix → **404** | 🟢 Posteriores al fix → **200 `image/jpeg`** |
|---|---|---|
| `visitas` | 105 (12:54) | 106 (16:00) · 107 (16:01) · 110 (16:05) |
| `cobros` | 27·28·29·30·31·32 (13:06–13:17) · **33 (15:35)** | **34 (15:39)** · 35 (15:47) · 36 (15:50) |
| `pedidos` | 1354 (12:59) · 1355 (13:00) | 1357 (16:21) · 1358 (16:22) |
| `devoluciones` | 1 (13:02) | 3 (15:58) |
| `depositos` | 1 (13:15) | 2 (15:40) |
| `clientes` (potenciales) | 34 (13:03) · **36 (15:28)** | ⚠️ **sin muestra posterior al fix** |
| `inventarios` | 1 (12:56) | ⚠️ **sin muestra posterior al fix** |

### ⏱ La hora del fix queda acotada a una ventana de 4½ minutos

El corte 404/200 es **monótono en el tiempo y sin una sola excepción** en los 22 archivos:

- último 404 → **cobro 33, `15:35:14` UTC**
- primer 200 → **cobro 34, `15:39:45` UTC**

⇒ **el fix entró entre las 15:35:14 y las 15:39:45 UTC del 17/08/2026** (11:35–11:39 hora local).
Nota: `clientes 36` (15:28) da 404 **y eso confirma el corte en vez de contradecirlo** — es anterior a la ventana.
Por eso **no hay evidencia de que clientes potenciales quede excluido**: simplemente no existe todavía ningún
cliente potencial ni inventario creado después del fix. Es un **hueco de muestra, no un veredicto**: hay que
re-probar esos dos módulos con un registro nuevo antes de darlos por buenos.

### 🔴 Corrección a un diagnóstico previo del reporte A##

`Descargar adjuntos` **sigue siendo un `button type="submit"` SIN `onclick`** (verificado en los 4 módulos:
`form:j_idt142` visitas · `j_idt161` cobros · `j_idt202` pedidos · `j_idt155` inventarios) **y aun así entrega el
ZIP perfectamente** en los registros nuevos. ⇒ **la ausencia de `onclick` NUNCA fue la causa** de
`ADJ-DESCARGA-NO-ENTREGA-ZIP`. La causa real era la misma que la del visor: el servlet no encontraba los archivos
y devolvía la página (`200 text/html`) en lugar del ZIP. No perseguir más el `onclick`.

### Veredicto — tres líneas

1. **¿El visor quedó arreglado?** **SÍ.** Ya no apunta a `localhost:8282`: construye la URL contra el host real y
   sirve `200 image/jpeg` con imagen que renderiza (`naturalWidth` real) en 5 módulos.
   **`ADJ-VISOR-URL-LOCALHOST` → CERRADO.**
2. **¿La descarga quedó arreglada?** **SÍ**, y por la misma causa raíz: devuelve `application/zip` con
   `Content-Disposition: attachment` y ZIP válido cuyas entradas cuadran 4/4 con el oráculo BD.
   **`ADJ-DESCARGA-NO-ENTREGA-ZIP` → CERRADO** (y su diagnóstico del `onclick` queda desmentido).
3. **¿Sirve también a los registros viejos?** **NO.** Todo lo creado antes de las ~15:37 UTC sigue
   **irrecuperable desde la web** — visor 404 y descarga sin ZIP — porque el rutero nuevo apunta a una ubicación
   donde esos archivos nunca se escribieron y **no hubo migración**. Los adjuntos de la mañana (7 módulos,
   ≈20 archivos, incluidos los de firma bajo `…/images/firmas/visitas/`) están perdidos para la web salvo backfill.
   **Defecto abierto nuevo: `ADJ-BACKFILL-PENDIENTE`** (severidad media-alta: datos productivos existentes e
   inaccesibles). **No es regresión del fix, es alcance faltante.**

### Patrones / selectores nuevos del re-test

1. **URL de recurso de adjunto (post-fix):** `{origin}/denario/resources/images/{carpeta}/{ref}_{n}.jpeg?pfdrid_c=true`.
   Las firmas van aparte: `…/images/firmas/visitas/{ref}_{n}.jpg`. El contexto es **`/denario`**, no
   `/DenarioPremium`; `/DenarioPremium/resources/…` da 404 (probado). Ya **no** aparece `localhost:8282`.
2. 🔴 **El visor de adjuntos ROBA EL CLICK**, igual que el diálogo de inactividad. Su
   `.ui-widget-overlay.ui-dialog-mask` intercepta el click sobre `Descargar adjuntos`: Playwright reintenta 30 s y
   expira con un error engañoso. ⇒ **cerrar el visor antes de descargar** (`.ui-dialog-titlebar-close`) y confirmar
   `getComputedStyle(d).display !== 'block'`.
3. **Oráculo de descarga sin tocar disco:** `page.on('response')` + `content-type`/`content-disposition` distingue
   *"el servidor no mandó el archivo"* de *"el click no llegó"*. Funcionó 7/7. `waitForEvent('download')` solo dice
   "timeout" y no discrimina.
4. ⚠️ **El MCP guarda una copia del download en `.playwright-mcp/` aunque se llame `download.delete()`**, y
   **renombra** `visita_107.zip` → `visita-107.zip` (guion, no guion bajo). Hay que borrarla explícitamente;
   `dl.delete()` **no** alcanza.
5. **`require` no existe** dentro de `browser_run_code_unsafe` ⇒ el tamaño / magic-bytes del ZIP se verifica desde
   PowerShell con `[System.IO.Compression.ZipFile]::OpenRead`, no desde el snippet.
6. **IDs de los botones de adjunto por módulo** (`j_idt*`, **no anclar**): visitas `142`/`144` · cobros `161`/`163`
   · pedidos `202`/`204` · inventarios `155`/`157`. Anclar siempre por texto `/descargar\s+adjunto/i` y `/ver\s+adjunto/i`.
7. **Login en El Yaque:** `browser_type` con target de rol a11y (`textbox "Usuario"`) **falla** en este MCP
   (`Unexpected token "" while parsing css selector`). Vía que funciona 100 %: `input[placeholder="Usuario"]` ·
   `input[placeholder="Clave"]` · `button[type="submit"]`.
8. **Visitas:** `Fecha Iniciada` viene en **local UTC−4**, útil para fechar el registro contra `da_update` (UTC).
   Reconfirmado el calentamiento: la 1.ª búsqueda devuelve resultado rancio.
9. 🔴 **`query.js` — dos trampas medidas hoy:** `WHERE da_update > '2026-08-17 15:20'` devolvió **0 filas** habiendo
   filas posteriores (usar `da_update::date='…'`); y un `LIMIT 40` **ocultó por completo las filas de `inventarios`**,
   lo que casi produce un falso "el visor inventa imágenes". Subir el LIMIT o filtrar por módulo antes de concluir.
10. **Filtro nuevo en visitas:** `[id$=":selectAttach_input"]` (*Adjuntos*, 3 opciones) — permite listar directamente
    los registros con adjunto sin barrer.

> ✅ consolidado 2026-08-17 — promovido a module-selectors / web-selectors / YAML `[grupo_fiel-20260817]`

### 🔴 Confirmación de borrado de adjuntos

Se descargaron **4 ZIP con adjuntos reales de clientes productivos** (`visita_106`, `visita_107`, `cobro_36`,
`pedido_1357`). **Los cuatro fueron borrados inmediatamente tras verificar sus entradas.** Barrido final recursivo
de `*.zip *.jpeg *.jpg *.pdf *.xlsx` en las **dos** ubicaciones:

- `DenarioPremiunMovil\.playwright-mcp\` → **limpio, 0 adjuntos**
- `qa-piloto-automatizacion\` (incluye su propio `.playwright-mcp\`) → **limpio, 0 adjuntos**

No se tocó el dispositivo, ni el CDP `:9220`, ni la pestaña 0. Toda la interacción fue read-only
(`Buscar` · `Consultar` · `Ver adjuntos` · `Descargar adjuntos`).

---

## Familia C## — Cotejo móvil → web (registros creados por la corrida)

Playa **el_yaque** (`denarioelyaque.ddns.net:8080`) · Empresa **GRUPO FIEL, S.A. (GRUFISA)** · READ-ONLY.
Los 5 registros venían con **BD-FIELD-OK**; acá se verifica **cómo se ven en la web**.
Resultado: **5/5 WEB-OK, 0 diffs, 0 BLOCKED, sin reintentos.**

| Módulo | # Ref | Marca |
|---|---|---|
| pedidos | 1356 | ✅ WEB-OK |
| devoluciones | 2 | ✅ WEB-OK |
| inventarios | 2 | ✅ WEB-OK |
| depositos | 3 | ✅ WEB-OK |
| visitas | 111 | ✅ WEB-OK |

---

### PEDIDOS · Ref 1356 — ✅ WEB-OK

**Doble llave:** `No. de Ref. = 1356` + `Código pedido = 1786975326913.0` — ambas coinciden con el manifiesto.

| Campo | Móvil / BD | Web | ✓ |
|---|---|---|---|
| Cliente | `J-504863246` MP GELATO C.A. | `J-504863246` / MP GELATO C.A. | ✅ |
| Vendedor | `co_user 003` / id_user 463 | Johana Belandria | ✅ |
| Empresa | `00001` | GRUPO FIEL, S.A. (GRUFISA) | ✅ |
| Tipo de Pedido | `id_order_type 4` · Pedido Factura | Pedido Factura | ✅ |
| Lista de precio | `co_list 03` | `03 - Precio 3 - Factura Fiscal` | ✅ |
| Comentario | Test-PED-SMOKE-140810 | Test-PED-SMOKE-140810 | ✅ |
| Fecha | 2026-08-17 | 17/08/2026 10:10:19 | ✅ (por día) |
| Estatus | `st_order 1` | **Enviado** · ¿Por Aprobar? NO | ✅ |
| Total items | `nu_details 1` | 1 (lista) = 1 línea (detalle) | ✅ |
| Línea | `1.5LTS` ×2 CAJA @ 3.238,50 · almacén 005 | `1.5LTS` Caja de Agua 1.5lts 6und · `2 CAJA` · Precio base 3.238,50 BS · ALMACEN MARACAIBO | ✅ |
| Condición de pago | `CodContado` | **CONTADO** | nota (enriquecimiento, no mismatch) |

#### 🧮 Aritmética verificada (toda al céntimo)

```
Base bruta      3.238,50 x 2                    = 6.477,00 BS   OK web "Subtotal bruto" y "Monto Base Pedido"
Descuento 7 %   6.477,00 x 0,07                 =   453,39 BS   OK web "Descuento" / "Descuento Global"
Base neta       6.477,00 - 453,39               = 6.023,61 BS   OK == BD nu_amount_final
IVA 16 %        6.023,61 x 0,16                 =   963,7776    OK web "IVA" = 963,78
  ATENCION: el IVA va sobre la base NETA, no sobre la bruta:
    6.477,00 x 0,16 = 1.036,32  =/=  963,78  -> descartado
Monto Total     6.023,61 + 963,7776             = 6.987,3876    OK web "Monto Total Pedido" == BD nu_amount_total
Descuento bonificacion = 0,00 (no hubo)                         OK
```

**Conversión — BS → USD ⇒ DIVIDE, tasa propia del registro `nu_value_local = 771,07`:**

```
6.987,3876 / 771,07 =  9,0619  -> web "Conversion Monto Total"        =  9,06 USD  OK
6.477,0000 / 771,07 =  8,4000  -> web "Monto Base Pedido Conversion"  =  8,40 USD  OK
  453,3900 / 771,07 =  0,5880  -> web "Conversion Descuento (Global)" =  0,59 USD  OK
  963,7776 / 771,07 =  1,2499  -> web "Conversion IVA"                =  1,25 USD  OK
```

**Aritmética de la línea** (la celda trae 4 valores, hay que partirla):

```
IVA de linea      3.238,50 x 0,16          =   518,16 BS  OK web "IVA 16.0%: 518,16 BS"
Importe + IVA     3.238,50 + 518,16        = 3.756,66 BS  OK web "Importe + IVA: 3.756,66 BS"
Subtotal de linea 3.756,66 x 2 x (1-0,07)  = 6.987,3876   OK web "Subtotal: 6.987,39 BS"
  ATENCION: el Subtotal de linea YA trae aplicado el descuento global
            (por eso =/= 3.756,66 x 2 = 7.513,32)
Invariante suma(subtotales de linea) == Monto Total Pedido -> 6.987,39 == 6.987,39  OK
Conversion de linea 3.238,50 / 771,07 = 4,2000 -> web "Precio base: 4,20 USD"  OK
                      518,16 / 771,07 = 0,6720 -> web 0,67 USD  OK
                    3.756,66 / 771,07 = 4,8720 -> web 4,87 USD  OK
```

**Coherencia lista ↔ detalle:** Monto Base 6.477,00 · Monto Total 6.987,39 · Monto conv. 9,06 USD ·
Tasa 771,07 BS = 1 USD — idénticos en ambas vistas. ✅

---

### DEVOLUCIONES · Ref 2 — ✅ WEB-OK

Confirmado el invariante del módulo: **ni la lista ni el detalle exponen columna de dinero alguna**
⇒ no se construye oráculo de importes.

| Campo | Móvil / BD | Web | ✓ |
|---|---|---|---|
| # Ref | 2 | 2 | ✅ |
| Cliente | `J-504863246` MP GELATO C.A. | `J-504863246` / MP GELATO C.A. | ✅ |
| Vendedor / Empresa | 003 / `00001` | Johana Belandria / GRUFISA | ✅ |
| Tipo de devolución | `id_type 59` → Servicio | **Servicio** | ✅ |
| Responsable | QA AUTOMATIZACION | QA AUTOMATIZACION | ✅ |
| Precinto | PRE-88123 | PRE-88123 | ✅ |
| Observaciones | QA smoke devoluciones 20260817 | QA smoke devoluciones 20260817 | ✅ |
| Coordenada | 11.0490212,-63.8649873 | 11.0490212,-63.8649873 | ✅ exacta |
| Fecha | 2026-08-17 | 17/08/2026 11:06:59 | ✅ |
| Estatus | — | **Enviado** (lista) | ✅ |
| N° de líneas | 1 | 1 | ✅ |

**Línea 1:** `1.5LTS` · Caja de Agua 1.5lts 6und · **Cantidad 6** ✅ · N° Factura **B066127** ✅ ·
Motivo **Tiempos de Despacho (Servicio)** (`id_motive 48`) ✅ ·
**Lote VACÍO** ✅ y **Fecha de vencimiento VACÍA** ✅ — correcto: en BD `nu_lote=''` y `da_duedate=null`,
la web no inventa valores.

📝 *Observación nueva (no defecto):* la columna `Devolución en` muestra **`CJA`**, que es exactamente
`co_measure_unit` en BD ⇒ por la regla BD-driven es **OK**. Pero es una **inconsistencia de presentación
entre módulos**: pedidos sí enriquece la misma unidad a `CAJA` (`na_measure_unit`). Misma familia que
`DEP-BANCO-CODIGO-CRUDO`, severidad cosmética.

---

### INVENTARIOS · Ref 2 — ✅ WEB-OK

**Doble llave:** `No. de Ref. = 2` + `Código inventario = 1786980326244.0` ✅

| Campo | Móvil / BD | Web | ✓ |
|---|---|---|---|
| Cliente | `J-504863246` MP GELATO C.A. | `J-504863246` / MP GELATO C.A. | ✅ |
| Sucursal | `id_address_client 67785` | CALLE 76 CON AVENIDA 3D … MARACAIBO ZULIA 4001 | ✅ |
| Vendedor / Empresa | 003 / `00001` | Johana Belandria / GRUFISA | ✅ |
| Comentario | inv2 QA smoke | inv2 QA smoke | ✅ |
| Fecha | 2026-08-17 | 17/08/2026 11:25:26 | ✅ |
| Estatus | — | **Enviado** (lista) | ✅ |
| Líneas | 3 líneas / 2 productos | 3 filas / 2 productos | ✅ |
| `Ver Pedido Relacionado` | `id_order = null` | etiqueta presente, **valor vacío y sin enlace** | ✅ esperado |

**📦 Cantidad por ubicación — respetada, sin sumar ni mezclar:**

| # | Producto | Depósito | Exhibición | Lote | Vencimiento | ✓ |
|---|---|---|---|---|---|---|
| 1 | `1.5LTS` Caja de Agua 1.5lts 6und | **3.00 CAJA** | `-` | QAINV3 | 17/08/2026 | ✅ dep 3 |
| 2 | `1.5LTS` Caja de Agua 1.5lts 6und | `-` | **8.00 CAJA** | QAINV1 | 17/08/2026 | ✅ exh 8 |
| 3 | `330ML` Caja de Agua 330ml 24und | `-` | **5.00 CAJA** | QAINV2 | 17/08/2026 | ✅ exh 5 |

La ubicación que no aplica se pinta `-` en su columna — el patrón se cumple en las 3 filas.
*(El orden de las filas difiere del manifiesto; el conjunto es idéntico ⇒ no es mismatch: el manifiesto
no fija orden.)*

🔴 **`INV-DET-NUMERO-FILA-CONSTANTE` — REPRODUCIDO, ahora con 3 filas.** La columna `N°` imprime
**`1`, `1`, `1`** en vez de `1`, `2`, `3`. Este registro era la oportunidad de confirmarlo con más de una
fila y queda confirmado sin ambigüedad. **No es hallazgo nuevo.**

---

### DEPÓSITOS · Ref 3 — ✅ WEB-OK

| Campo | Móvil / BD | Web | ✓ |
|---|---|---|---|
| # Ref | 3 | 3 | ✅ |
| Banco | `co_bank 7738` / `na_bank BANESCO` | **`7738`** | ⚠ ver defecto abajo |
| N° cuenta | 01340009180093087738 | 01340009180093087738 | ✅ |
| N° Planilla | PL-QA-0817 | PL-QA-0817 | ✅ |
| Monto depositado | 8.000,00 BS | 8.000,00 BS | ✅ |
| Observaciones | QA smoke depositos 20260817 | QA smoke depositos 20260817 | ✅ |
| Fecha depósito / planilla | 2026-08-17 | 17/08/2026 11:46:25 / 17/08/2026 | ✅ |
| Estatus | — | **Enviado** (lista) | ✅ |
| Cobro vinculado | Ref 32 | `N° Ref cobro 32` en la tabla hija | ✅ |

🔴 **`DEP-BANCO-CODIGO-CRUDO` — REPRODUCIDO.** La web muestra el **código** `7738` en vez del nombre
`BANESCO`. Confirmado contra BD: `SELECT na_bank FROM bank WHERE co_bank='7738'` → **`BANESCO`** ⇒ el
nombre existe en el catálogo y no se está resolviendo. **No es hallazgo nuevo.**
⚠ **Matiz nuevo que aporta este registro:** ocurre **en la LISTA además del detalle** — la columna `Banco`
de `/pages/depositos` también imprime `7738`. El defecto registrado hablaba del detalle.

#### 🧮 Aritmética del depósito

```
Conversion (BS -> USD, DIVIDE, tasa 771,07):
  8.000,00 / 771,07 = 10,3752  -> web "Monto depositado conv." = 10,38 USD  OK
```

**Tabla hija (`form:j_idt163`, anclada por columnas `['N° Ref cobro','Monto cobrado']`) — 2 filas:**

| N° | Ref cobro | Forma de pago | Banco | N° Doc | Monto cobrado | Monto conv. |
|---|---|---|---|---|---|---|
| 1 | 32 | **Efectivo** | — | efect | **8.000,00 BS** | 10,38 USD ✅ |
| 2 | 32 | Pago Movil | VENEZUELA USD$ | 123456 | 2.000,00 BS | 2,59 USD ✅ |

⚠ **Σ de las filas = 8.000 + 2.000 = 10.000,00 ≠ 8.000,00 depositados — y NO es un descuadre.**
Las dos filas son las **formas de pago del MISMO cobro 32** (mismo `N° Ref cobro` repetido), no dos cobros
distintos. Confirmado en BD: `SELECT nu_amount_total FROM collection WHERE id_deposit=3` → **una sola fila,
cobro 32, 10.000,0000**. El caveat de `_comunes.md` («NO sumar sus filas contra el monto depositado») queda
**reconfirmado con datos**.

**El oráculo válido en este build es el del EFECTIVO:**
`Σ(pagos en Efectivo del cobro 32) = 8.000,00 == Monto depositado 8.000,00` ✅
Coherente con la regla del producto: **depósitos solo aplica sobre el efectivo cobrado**.

---

### VISITAS · Ref 111 — ✅ WEB-OK

Leídas **lista y detalle** (el detalle solo no alcanza: estatus y fechas de inicio/envío viven en la lista).

| Campo | Móvil / BD | Web | Dónde | ✓ |
|---|---|---|---|---|
| Ref | 111 | 111 | ambas | ✅ |
| Cliente | `J-504863246` MP GELATO C.A. | `J-504863246` / MP GELATO C.A. | ambas | ✅ |
| Vendedor / Empresa | 003 / `00001` | Johana Belandria / GRUFISA | detalle | ✅ |
| Orden de visita | 1 | 1 | detalle | ✅ |
| Actividad | MERCHANDISING (`co_type 47`) | MERCHANDISING | ambas | ✅ |
| Motivo | VISIBILIDAD PDV (`co_cause 184`) | VISIBILIDAD PDV | ambas | ✅ |
| Descripción | Test-VIS-019-121500 | Test-VIS-019-121500 | ambas | ✅ íntegra |
| Estatus | Visitado | **visitado** | lista | ✅ |
| Fecha Programada | `da_visit` 2026-08-17 12:12:22 | 17/08/2026 · detalle 12:12:22 | ambas | ✅ |
| Fecha Iniciada | `da_initial` 12:12:22 | **12:12:22** | lista | ✅ **al segundo** |
| Fecha Enviada | `da_real` 12:14:50 | **12:14:50** | lista | ✅ **al segundo** |
| Coordenada | 11.0490123,-63.8649878 | **11.0490123,-63.8649878** | HTML del mapa | ✅ exacta |
| Actividades | 1 | 1 fila en `form:visitasDT` | detalle | ✅ |

**Las 3 fechas coincidieron al segundo, sin desfase UTC** — no hizo falta el veredicto por día.

**`Título`:** `2026-08-17-MP GELATO C.A.` — **cumple el patrón `{YYYY-MM-DD}-{cliente}`** que genera el móvil.

**Coordenada:** el HTML del mapa trae **dos** variantes — `11.049012,-63.864988` (centrado del mapa,
truncada) y `11.0490123,-63.8649878` (la real). Quedarse con la de **más decimales** da coincidencia exacta.

📝 **`Geo = "Falta Coordenada (Sucursal)"` — coherente, NO es mismatch.** `Geo` es una **clasificación que
calcula la web** comparando la coordenada de la visita contra la **de la sucursal**; el literal dice que falta
la coordenada **de la sucursal** (`id_address_client 67785`), no la de la visita — que sí está y es exacta.

---

### Resumen de defectos vistos en estos 5 registros

| Defecto | Estado | Evidencia en esta familia |
|---|---|---|
| `DEP-BANCO-CODIGO-CRUDO` | **Reproducido** (ya registrado) | Depósito Ref 3 muestra `7738`; BD tiene `na_bank='BANESCO'`. **Nuevo matiz: también en la LISTA**, no solo en el detalle |
| `INV-DET-NUMERO-FILA-CONSTANTE` | **Reproducido** (ya registrado) | Inventario Ref 2: columna `N°` = `1,1,1` en sus 3 filas |
| Unidad cruda en devoluciones (`CJA` vs `CAJA`) | 📝 Observación nueva, cosmética | `Devolución en = CJA`; pedidos enriquece la misma unidad a `CAJA`. **No es mismatch BD-driven** (BD tiene `CJA`) |

**Ningún hallazgo funcional nuevo.** Los 5 registros que el móvil envió se ven **completos y correctos** en la
web, con todos los cálculos cuadrando al céntimo.

### Patrones / selectores nuevos de C##

1. 🔴 **GUARD NUEVO Y NECESARIO para la regla `#form.innerText`** — el patrón «misma línea»
   `^(.+?):\s*(.*)$` **matchea también los timestamps `HH:mm:ss`** y fabrica claves basura partiendo la hora:
   `"17/08/2026 10": "10:19"` (detallePedido) · `"1 1.5LTS … 17/08/2026 00": "00:00"` (una por fila en
   detalleInventario). ⇒ **descartar toda línea cuya clave empiece con patrón de fecha**:
   `if (/^\d{1,2}\/\d{2}\/\d{4}/.test(clave)) continue;`. Se suma al guard ya documentado de `Cédula::`.
2. **El `value` del `select` Empresa cambia de TIPO entre módulos** (reconfirma «anclar por TEXTO»):
   `00001` (`co_enterprise`) en pedidos · `1` (`id_enterprise`) en devoluciones, inventarios y depósitos ·
   `1` en visitas, que además trae **2 opciones** (incluye `Seleccione Empresa`).
3. **Las tablas hijas `j_idt*` se corren entre playas, y NO de forma monótona:** `detalleDevolucion` es
   `form:j_idt169` en grupo_fiel y era `170` en difranca (**−1**, hacia atrás). `detalleDeposito` sigue en
   `form:j_idt163`. ⇒ anclar por columnas es obligatorio.
4. **Receta de 5 llamadas con filtro `# Ref` — 5/5 sin un solo reintento:** navegar → fijar `:n_ref` +
   `Buscar` + esperar ajax → **leer lista en llamada aparte** → `abrirRef` → leer detalle.
   Espera de ajax: `600 ms` → poll `jq.active === 0` (máx 80×250 ms) → **settle de 1.200 ms**.
5. **Contadores:** `PF('pedidosDT').paginator.cfg` expuso `{rowCount, rows, page}` en pedidos, devoluciones,
   inventarios y depósitos (contados == pintados == 1 en los cuatro). En visitas **no expone** ⇒ se cuentan
   `.ui-paginator-page` = **2**, que son los **dos paginadores** (arriba y abajo), no dos páginas.
6. **Sesión JSF caducada:** `browser_navigate` **no falla** — devuelve `login.xhtml` con
   `document.title = "DenarioPremium - Login"`. ⇒ **chequear `location.pathname` tras cada `navigate`**.
7. **`detalleDeposito`:** la etiqueta `Firma:` **absorbe el botón `Descargar adjuntos`** con la regla de misma
   línea (mismo patrón ya visto en `Sucursal:` de `detallePedido`) ⇒ sumar los textos de botón al ruido.

---
