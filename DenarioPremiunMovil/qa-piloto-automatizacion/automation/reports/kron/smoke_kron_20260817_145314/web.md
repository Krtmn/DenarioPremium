# Capa WEB — CHOCOLATES KRON, C.A.

| Parámetro | Valor |
|-----------|-------|
| **Fecha** | 2026-08-17 |
| **RUN_ID** | `20260817_145314_smoke-completo` |
| **Cliente** | `kron` — CHOCOLATES KRON, C.A. · empresa única `KRON_ADM` |
| **Playa** | **Isla Coche** — `http://denarioislacoche.ddns.net:8080/DenarioPremium` |
| **Vendedora QA** | SCARLET FLOREZ · `id_user 309` · `co_user VE0002` · login `scarlet` |
| **Modo** | 🔴 READ-ONLY (solo `Buscar` / `Limpiar` / `Consultar`) |

---

## Familia F## — Filtros

**Veredicto de arranque:** 🟢 **filtro `# Ref` OPERATIVO** en los 5 módulos que lo exponen y tienen dato hoy
(pedidos · cobros · devoluciones · inventarios · visitas). **8/8 refs devolvieron exactamente su registro.**
Depósitos → `WEB-N/A` (**0 filas en toda la tabla `deposit`**, confirmado en BD).
Clientes potenciales → sin filtro de Ref **por diseño**; barrido vendedor+fechas validado contra BD.
⇒ **Los `C##` pueden cotejar por `# Ref` con confianza.**

Todos los conteos se contrastaron contra BD **con el mismo rango** que tenía puesto la web.

| Módulo | Filtro probado | Esperado | Obtenido | Marca |
|---|---|---|---|---|
| pedidos | `# Ref` = 5085 | 1 fila, la 5085 | rowCount 1 · pintados 1 · ref 5085 | WEB-OK |
| pedidos | `# Ref` = 99999999 | 0 filas, sin error | rowCount 0 · "No se encontraron registros." | WEB-OK |
| pedidos | `Limpiar` tras filtrar | vuelve al total, input vacío | 512 · `n_ref=""` · fechas 01/08–17/08 | WEB-OK |
| pedidos | baseline sin filtro (mes en curso) | == BD mismo rango | web 512 == BD 512 | WEB-OK |
| pedidos | Vendedor = SCARLET FLOREZ | == BD (6) | 6 filas, todas SCARLET | WEB-OK |
| pedidos | Fechas 17/08–17/08 | == BD (1) | 1 fila | WEB-OK |
| pedidos | Vendedor + fechas (agosto) | **intersección**, no unión | 6 (no 512+6) | WEB-OK |
| pedidos | 🔑 `# Ref` 5085 con rango **01/01/2020–31/12/2020** | las fechas NO tapan el Ref | 1 fila, ref 5085 | WEB-OK |
| cobros | `# Ref` = 348 · 349 · 350 · 351 | 1 fila cada uno | **4/4 exactos** | WEB-OK |
| cobros | `# Ref` = 99999999 | 0 filas, sin error | rowCount 0 | WEB-OK |
| cobros | `Limpiar` | vuelve al total | 4 · refs 351/350/349/348 | WEB-OK |
| cobros | baseline sin filtro | == BD (4) | 4 | WEB-OK |
| cobros | Vendedor = SCARLET FLOREZ | == BD (4) | 4 | WEB-OK |
| cobros | Tipo Cobro = **Retención** | solo `co_type=2` | 1 fila → ref **351** ✅ | WEB-OK |
| cobros | Tipo Cobro = **Anticipo/Prepago** | solo `co_type=1` | 1 fila → ref **350** ✅ | WEB-OK |
| cobros | Tipo Cobro = **Cobros** | solo `co_type=0` | 2 filas → refs **349, 348** ✅ | WEB-OK |
| devoluciones | `# Ref` = 177 | 1 fila | rowCount 1 · ref 177 | WEB-OK |
| devoluciones | `# Ref` = 99999999 · `Limpiar` · baseline · Vendedor | 0 · total · 1 · 1 | todos exactos | WEB-OK |
| inventarios | `# Ref` = 2 | 1 fila | rowCount 1 · ref 2 | WEB-OK |
| inventarios | `# Ref` = 99999999 · `Limpiar` · baseline · Vendedor | 0 · total · 1 · 1 | todos exactos | WEB-OK |
| visitas | `# Ref` = 142 | la visita 142 | 2 filas, **ambas Ref 142** (la lista es **por actividad**) | WEB-OK |
| visitas | `# Ref` = 99999999 | 0 filas | 0 · **"No existe registro"** (literal propio) | WEB-OK |
| visitas | `Limpiar` · baseline | vuelve al total | 20 filas = **18 refs únicos** (127 y 142 traen 2 actividades) == BD 18 | WEB-OK |
| visitas | Vendedor = SCARLET FLOREZ | == BD (1 visita) | 2 filas, ambas Ref 142 | WEB-OK |
| **depositos** | `# Ref` presente · fechas 2020–2026 | sin registros que probar | 0 filas · BD `count(*) FROM deposit` = **0** | **WEB-N/A** |
| clientesPotenciales | 🔎 ausencia de filtro `# Ref` | limitación por diseño | `[id$=":n_ref"]` **no existe**; la LISTA sí trae columna `# Ref` | WEB-N/A (por diseño) |
| clientesPotenciales | Rango amplio 2020–2026 | == BD visible | web 6 == BD 6 | WEB-OK |
| clientesPotenciales | Vendedor = MARIANNA TRILLO | == BD (5) | 5 | WEB-OK |
| clientesPotenciales | Fechas dic-2025 / feb-2026 | == BD (2 / 4) | 2 y 4 | WEB-OK |
| clientesPotenciales | Vendedor **+** fechas feb-2026 | **intersección** (3) | 3 | WEB-OK |
| clientesPotenciales | `Limpiar` | vuelve al total | 6 · fechas **vaciadas** · vendedor reseteado | WEB-OK |

**Resumen F##:** 41 casos · **36 WEB-OK · 5 WEB-N/A** (depósitos sin datos) · 0 mismatch · 0 BLOCKED.

### Observación sobre datos históricos — **no es hallazgo de esta release** (`WEB-RUNTIME §5.a`)

`potential_client` tiene **72 filas en BD** y la web lista **6**. Los 66 restantes tienen un `id_user` que **ya
no existe en `users`** (vendedores dados de baja: 281→30 registros, 215→27, 213→2, 304→2, 206→1…).
El conteo web coincide **exactamente** con el `JOIN users` (6 = 5 de MARIANNA TRILLO + 1 de IVETTE)
⇒ **el filtro no está roto.**

El módulo **no tiene ningún registro posterior al 2026-02-06** y la corrida de hoy aún no había creado
clientes potenciales al momento de esta medición ⇒ **no reproduce en la versión en prueba.**
Es la **misma familia** que el pendiente conocido de *pedidos ocultos por `salesman_view`*.
**Severidad baja:** no afecta datos de usuarios activos.

### Por diseño, observado con el cobro 351 (retención) — NO se reporta (`WEB-RUNTIME §5.b`)

`Monto cobrado` vino **vacía** en el 351 (retención) y con **desglose múltiple** en los normales.
Confirmado como comportamiento de diseño, no defecto.

### Patrones y selectores nuevos — lo que DIFIERE de El Yaque

1. 🔴 **VISITAS: la columna se llama `Ref`, NO `# Ref`.** Encabezados reales: `Detalle · Editar · Eliminar ·
   **Ref** · Título · Fecha Programada · Fecha Iniciada · Fecha Enviada · Status · Geo`. Un extractor que busque
   `/^#\s*Ref/` devuelve **`null` en toda la tabla**. El *input* del filtro sí es `[id$=":n_ref"]`.
2. 🔴 **ANTI-PATRÓN NUEVO: `boton.click()` sobre `Buscar`/`Limpiar` puede navegar a página de error.**
   Son `<button type="submit">` con `onclick="PrimeFaces.ab({...});return false;"`. En `/pages/cobros` un
   `.click()` desde `evaluate` acabó en `chrome-error://chromewebdata/` y se perdió el contexto.
   **Vía robusta (0 fallos en 30+ búsquedas):**
   ```js
   const oc = boton.getAttribute('onclick');
   if (oc) new Function(oc).call(boton); else boton.click();
   ```
3. 🔴 **`Limpiar` NO se comporta igual en todos los módulos:**
   | Módulo | Fechas tras `Limpiar` | Selects |
   |---|---|---|
   | pedidos · cobros · devoluciones · inventarios · visitas · depositos | **resetea al mes en curso** | no los toca |
   | **clientesPotenciales** | **las VACÍA** ⇒ muestra el histórico completo | **SÍ resetea el vendedor** |
   Contradice lo documentado ("Limpiar no resetea combos"): en clientes potenciales **sí**.
4. **Mapa del `value` de Empresa en kron** (única, `CHOCOLATES KRON, C.A.`) — reconfirma **anclar por TEXTO**:
   `KRON_ADM` en `/pages/pedidos` y `/pages/clientesPotenciales` · **`1`** en cobros, devoluciones,
   inventarios, visitas y depositos.
5. **Label del vendedor con DOBLE espacio:** `"SCARLET  FLOREZ"` en el `.ui-selectonemenu-label` (la `<option>`
   trae uno solo). En **visitas** el label es `"VE0002 - SCARLET  FLOREZ"` (`co_user` + nombre) y el sufijo es
   **`:idSalesman`**, no `:idSalesmaView`. Un `===` literal falla en ambos casos.
6. **Visitas tiene MÁS filtros de los documentados:** `:idRol` · `:idSalesman` (**sí existe**) · `:idClient` ·
   `:idEstatus` · `:idType` · `:idMotive` · `:selectAttach` · `:selectDispatch` · `:selectCoordinadas`
   (arranca en `-1`, no en `0`). Botón `:btnBuscar`, **no** `:ajax`. `PF('tablaVisit')` sigue **sin exponer
   paginator** ⇒ el conteo sale del `.ui-datatable-header` (`"Total de Resultados: N"`), que en kron **sí** viene poblado.
7. **`Tipo Cobro` (`:idTipo`) mapea 1:1 a `co_type`:** `0|Cobros` · `1|Anticipo/Prepago` · `2|Retención` ·
   **`4|Cobro 25%`** (opción no vista antes). Verificado contra BD ref por ref.
   **`Status` de cobros en kron trae 6 opciones con valores distintos a El Yaque:** `0|Status` · `7|Por aprobar` ·
   `2|Enviado` · `12|Pendiente` · `11|Aprobado` · `13|Rechazado`.
8. **Lista vacía:** `"No se encontraron registros."` en pedidos · cobros · devoluciones · inventarios ·
   **depositos** · clientesPotenciales; **`"No existe registro"`** solo en **visitas**.
9. **Reconfirmado en isla_coche: las fechas NO tapan el `# Ref`.** Con una sola empresa en el tenant, la vía
   clásica de falso `WEB-MISSING` (Empresa mal puesta) **no existe en kron**.
10. **Esquema BD de kron — dos trampas:** `users` **no tiene `co_user`** (solo `login_user`, `name_user`,
    `lastname_user`); `potential_client` **sí** lo tiene y su fecha es **`da_client`**.
11. ⚠ **Matiz al "184/184 tablas legibles": `visit_view` NO es legible** —
    `permission denied for sequence visit_view_seq`. Las *tablas* tienen GRANT, la **secuencia** de esa vista no.
    Si un `M##` necesita `visit_view`, va a chocar.
12. **La sesión JSF estaba caducada al arrancar** y el primer `browser_navigate` devolvió `login.xhtml`
    **sin fallar** (confirmado otra vez). El transporte por `sessionStorage` sobrevivió al re-login y a las
    ~10 navegaciones siguientes.
13. **`PF('<tabla>').paginator.cfg` funcionó como oráculo de conteo en los 6 módulos con paginator** y **no**
    quedó rancio en las 30+ mediciones. Aun así se usó **espera auto-validante** (poll hasta que los refs
    pintados igualen el ref buscado): hace inofensivo el riesgo de lectura rancia sin pagar dos llamadas.

> ✅ consolidado 2026-08-17

---

## Familia C-HOY — Transacciones manuales de QA (2026-08-17)

**Veredicto: 8/8 `WEB-OK`.** Origen de verdad = **BD nube kron**; el cotejo es **BD → WEB**.
Vendedora `scarlet` (`co_user VE0002`, `id_user 309`) · empresa única `CHOCOLATES KRON, C.A.` · playa
**Isla Coche** (guarda verificada en cada página). Tasa **771,07 BS = 1 USD** en las 8.
Fechas: la web muestra **UTC−4**, BD guarda **UTC** ⇒ veredicto por día.

| # | Caso | Módulo | Ref | Rasgo | Marca |
|---|---|---|---|---|---|
| 1 | DW-PED-HOY-01 | pedidos | 5085 | BIMBO · USD · 2 líneas | **WEB-OK** |
| 2 | DW-COB-HOY-01 | cobros | 348 | normal · BS · **con descuento** | **WEB-OK** |
| 3 | DW-COB-HOY-02 | cobros | 349 | normal · USD · transferencia | **WEB-OK** |
| 4 | DW-COB-HOY-03 | cobros | 350 | **anticipo** (`co_type 1`) | **WEB-OK** |
| 5 | DW-COB-HOY-04 | cobros | 351 | **retención** (`co_type 2`) | **WEB-OK** |
| 6 | DW-DEV-HOY-01 | devoluciones | 177 | tipo 60 · sin montos | **WEB-OK** |
| 7 | DW-INV-HOY-01 | inventarios | 2 | 3 lotes · comentario `inv1` | **WEB-OK** |
| 8 | DW-VIS-HOY-01 | visitas | 142 | `nu_sequence` 1 · 2 actividades | **WEB-OK** |

**0 diffs · 0 FIELD-MISMATCH · 0 CALC-MISMATCH · 0 BLOCKED.**

### DW-PED-HOY-01 · pedido 5085

Doble llave: `No. de Ref.` **5085** + `Código pedido` **1786990315465.0** == `co_order` ✅
Cabecera: `J000469199` BIMBO DE VENEZUELA C.A · SCARLET FLOREZ · CHOCOLATES KRON, C.A. ·
`Responsable` **gv** · `Comentario` **Ped1** · `Fecha de despacho` **19/08/2026** ·
`Fecha del pedido` 17/08 14:15:11 == `da_order` 18:15:11 UTC · `Estatus` **Enviado** (`st_order` 1) ·
`Total items` **2** == `nu_details`.
📝 `Condicion de pago`: la web muestra **CREDITO 15 DIAS** y BD guarda `co_payment_condition` = **15**
⇒ **enriquecimiento de la web, NOTA no mismatch.**

```
Linea 1 = 10 x 61,44                    =   614,40 USD  == nu_amount_total linea 0   OK
Linea 2 =  5 x 101,40                   =   507,00 USD  == nu_amount_total linea 1   OK
suma subtotales == Monto Total Pedido   = 1.121,40 USD  == nu_amount_total           OK
Subtotal bruto - Dcto bonif. == Base    = 1.121,40 USD  == nu_amount_total_base      OK
Conversion (USD->BS, MULTIPLICA): 1.121,40 x 771,07 = 864.677,898 -> web 864.677,90  OK (dif 0,002 < 0,01)
suma conversiones de linea = 473.745,41 + 390.932,49 = 864.677,90                    OK
Precio base conv. L1 = 61,44 x 771,07  = 47.374,5408 -> web 47.374,54                OK
Precio base conv. L2 = 101,40 x 771,07 = 78.186,498  -> web 78.186,50                OK
```

### DW-COB-HOY-01 · cobro 348 (normal · BS · **con descuento**)

`J075129342` ONCE ONCE, C.A · `Diferencia de cobro` **0,00** == `nu_difference`.
`Responsable` y `Comentario` **vacíos en BD** ⇒ se saltean (regla local-driven).
Documento **FACT00090890** (`Pago parcial = NO`): `Monto doc` 8.854.967,88 · `Saldo doc.` 916.031,16 ·
`Monto a pagar` 900.031,16 — los tres == BD. Pago **Efectivo**, `Nro Documento` **efect1**.

```
ORACULO UNICO: Total a pagar == suma(Monto a pagar) = 900.031,16 BS == nu_amount_final   OK
Saldo - descuento == Total a pagar: 916.031,16 - 16.000,00 = 900.031,16                  OK
   (nu_amount_discount_total = 16.000 -> userCanSelectCollectDiscount=true EJERCIDO)
suma pagos == Monto cobrado = 900.031,16                                                 OK
Conversion (BS->USD, DIVIDE): 900.031,16 / 771,07 = 1.167,2496 -> web 1.167,25           OK
Saldo doc. conversion: 916.031,16 / 771,07 = 1.188,0006 -> web 1.188,00                  OK
Total dcto. conversion: 16.000,00 / 771,07 =    20,7504 -> web    20,75                  OK
Consistencia lista <-> detalle: Total por cobrar == Total Monto a pagar = 900.031,16     OK
```

### DW-COB-HOY-02 · cobro 349 (normal · USD · transferencia)

`Responsable` **gv** · `Comentario` **c2** · pago **Transferencia** BANCO DEL TESORO, doc **754757**,
cuenta enmascarada `0163***********0212`.

```
Total a pagar == suma(Monto a pagar) = 12.870,00 USD == nu_amount_final                  OK
suma pagos = 12.870,00                                                                   OK
Conversion (USD->BS, MULTIPLICA): 12.870,00 x 771,07 = 9.923.670,90 BS == BD exacto       OK
Monto doc. conversion: 14.355,00 x 771,07 = 11.068.709,85                                OK
```

### DW-COB-HOY-03 · cobro 350 (**anticipo**, `co_type 1`)

Lista: `Tipo de Cobro` = **Anticipo/Prepago** ✅ · ALIMENTOS J.M.A., C.A. (`J401243401`) ·
`Responsable` **g** · `Comentario` **h** · pago **Deposito** BANCO BICENTENARIO, doc **dep2**.
Pie **reducido** y **`documentosPagadosDT` AUSENTE del DOM** — coherente con BD: `collection_detail` tiene
**0 filas** para el 350 ✅

```
Monto pagado == nu_amount_final = 2.500,00 BS                                            OK
suma pagos = 2.500,00                                                                    OK
Conversion (BS->USD, DIVIDE): 2.500,00 / 771,07 = 3,2422 -> web 3,24                     OK
```

🔑 **Reconfirmado: la condición histórica del "anticipo en 0,00" NO se da en esta versión.**
`nu_amount_final` está poblado (2.500) y la web lo muestra en **los dos** lados: lista `Total por cobrar`
2.500,00 y detalle `Monto pagado` 2.500,00.

### DW-COB-HOY-04 · cobro 351 (**retención**, `co_type 2`)

`Nro Retención` **55555555558882** (== `nu_voucher_retention`) · `Fecha Comprobante` 01/08/2026 ·
`Responsable` **gv** · `Comentario` **f** · tabla de pagos → `"No se encontraron registros."` (por diseño).

```
Total a pagar == suma(Monto a pagar) = 1.500,00 BS == nu_amount_final                    OK
Retencion IVA + ISLR == Total: 1.000,00 + 500,00 = 1.500,00                              OK
Conversion IVA:  1.000,00 / 771,07 = 1,2969 -> web 1,30                                  OK
Conversion ISLR:   500,00 / 771,07 = 0,6485 -> web 0,65                                  OK
suma conversiones == Total conv.: 1,30 + 0,65 = 1,95                                     OK
Conversion del total: 1.500,00 / 771,07 = 1,9453 -> web 1,95                             OK
```

🐞 **`COB-RET-TOTAL-CERO` NO REPRODUCE.** La cabecera del detalle muestra `Total Monto a pagar` = **1.500,00 BS**,
no `0,00`, y **coincide con la lista**. El caso estrella **M05** pasa.
⚠ Redactado como *"no reproduce en la versión en prueba"*, no como *"se corrigió"* (`WEB-RUNTIME §5.a`).

❌ **Por diseño, NO se reporta (`§5.b`):** en la lista, `Pagos` y `Monto cobrado` vinieron **vacías** en el 351.
Es una retención: no hay método de pago que desglosar. Confirmado en BD (`collection_payment` = 0 filas para el
351, mientras 348/349/350 sí tienen la suya).

### DW-DEV-HOY-01 · devolución 177

Sin oráculo de importes (la web no expone ni una columna de dinero) — correcto.
`Responsable` **gv** · `Precinto` **vacío** == `nu_seal` `""` · `Tipo de devolución` **Calidad** ← `id_type` 60
(enriquecimiento, nota) · `Observaciones` → **f** == `tx_description`.
Línea única: `51090507` CORAZONES MEDIANOS FORRADOS 2 X 1 · **Cantidad 15** == `qu_product` ·
`N° Factura` **15352** == `co_document` · `Devolución en` **BUL** ~ `na_measure_unit` BULTO ·
`Lote` vacío == `nu_lote` `""` · `Fecha vencimiento` vacía == `da_duedate` NULL ✅

### DW-INV-HOY-01 · inventario 2

Doble llave: `No. de Ref.` **2** + `Código inventario` **1786990248040.0** == `co_client_stock` ✅
`Comentario` **inv1** · `Ver Pedido Relacionado` **vacío** == `id_order` NULL ✅

La tabla muestra **3 filas** contra **2 productos** en `client_stock_detail`: **es correcto** — el grano de la
vista es la **unidad/lote** (`client_stock_detail_unit`), que tiene exactamente 3 filas:

| Lote | `co_product_unit` | `ubicacion` | `qu_stock` | Web `Depósito` | Web `Exhibición` |
|---|---|---|---|---|---|
| f1 | 52077005BUL | `exh` | 10 | `-` | **10.00 BULTO** ✅ |
| f2 | 52077005BUL | `dep` | 1 | **1.00 BULTO** | `-` ✅ |
| f3 | 51104160BUL | `exh` | 5 | `-` | **5.00 BULTO** ✅ |

Reconfirma la regla: **la ubicación NO es una columna** — `exh` se expresa poniendo la cantidad en `Exhibición`
y dejando `Depósito` en `-`. `Fecha expiración` 17/08/2026 == `da_expiration` en las 3 ✅

### DW-VIS-HOY-01 · visita 142

La lista devuelve **2 filas con el mismo `Ref` 142** (una por actividad) — **esperado, no defecto**:
`VISITA FUERA DE RUTA / VENTA EFECTIVA` y `NO COMPRO / PRECIO MUY ALTO`, ambas con `Descripción` **v1**.
La tabla hija del detalle trae las **mismas 2** ⇒ lista y detalle consistentes ✅
`Orden de visita` **1** == `nu_sequence` · `Status` **visitado** == `st_visit` 2 / `is_visited` true ·
`Fecha planeada` 14:09:17 == `da_visit` 18:09:17 UTC · `Fecha Iniciada` 14:09:18 · `Fecha Enviada` 14:10:38 ·
Título `2026-08-17-BIMBO DE VENEZUELA C.A` ✅
❌ **Por diseño (`§5.b`):** `Geo = "Falta Coordenada (Sucursal)"` — la visita **sí** tiene coordenada
(`11.0490212,-63.864987`, `st_coordinate` 2); la etiqueta compara contra la **sucursal**. No se reporta.

---

## Familia A## — Adjuntos y validación del fix del rutero

> 🟢 **VEREDICTO: el fix del rutero FUNCIONA en Isla Coche — visor Y descarga — en los 8 registros post-fix.
> `inventarios` queda CERRADO. Los registros viejos siguen en 404 y NO hubo migración.**

**Evidencia dura** (`page.request.get` directo contra el servidor):

| URL | Status |
|---|---|
| `/denario/resources/images/cobros/348_0.jpeg?pfdrid_c=true` | **200** `image/jpeg` 93.205 B |
| `/denario/resources/images/inventarios/2_0.jpeg?pfdrid_c=true` | **200** `image/jpeg` 108.052 B |
| `/denario/resources/images/visitas/142_2.jpeg?pfdrid_c=true` | **200** `image/jpeg` 105.428 B |
| `/DenarioPremium/resources/images/cobros/348_0.jpeg` (contexto viejo, archivo NUEVO) | **404** |
| `/denario/resources/images/cobros/347_0.jpeg` (viejo, 19/06) | **404** |
| `/denario/resources/images/pedidos/3590_0.jpeg` (viejo, 29/06) | **404** |
| `/denario/resources/images/visitas/120_0.jpeg` (viejo, 28/07) | **404** |
| `/denario/resources/images/firmas/{cobros,inventarios,devoluciones}/…jpg` | **200** |

**Nunca apareció `localhost:8282`.** El contexto es **`/denario`**, confirmado por contraste.

🔴 **Oráculo usado: `transaction_image` ∪ `transaction_files`. NUNCA `nu_attachments`** — confirmado
**empíricamente**: en los 4 cobros `nu_attachments` = **4** y el ZIP trae **3**; el cuarto es la **firma**
(`transaction_signatures`), que **no viaja en el ZIP** ⇒ el −1 sistemático es real.

⚠ **CORRECCIÓN AL ORÁCULO DEL ENUNCIADO:** 3 registros tenían documento y la tabla del brief decía `—`.
`350_0.pdf`, `351_0.xlsx` y `177_0.xlsx` **sí existen** en `transaction_files` y **sí aparecen en el ZIP**.

### Resultado por registro (post-fix: creados 18:09–18:41 UTC, posteriores a la ventana 15:35–15:39)

| Caso | Módulo · Ref | `naturalWidth` | ZIP (`Content-Type` / nombre / tamaño) | Entradas vs oráculo BD | Marca |
|---|---|---|---|---|---|
| DW-PED-AHOY-01 | pedidos 5085 | **720**×1600 ×2 | `application/zip` · `pedido_5085.zip` · 172.417 B | 2 jpeg + `5085_0.pdf` = **3/3** | **WEB-OK** |
| DW-COB-AHOY-01 | cobros 348 | **720** ×2 | `cobro_348.zip` · 172.411 B | 2 jpeg + `348_0.pdf` = **3/3** | **WEB-OK** |
| DW-COB-AHOY-02 | cobros 349 | **720** ×2 | `cobro_349.zip` · 244.424 B | 2 jpeg + `349_0.xlsx` = **3/3** | **WEB-OK** |
| DW-COB-AHOY-03 | cobros 350 | **720** ×2 | `cobro_350.zip` · 176.219 B | 2 jpeg + **`350_0.pdf`** = **3/3** | **WEB-OK** |
| DW-COB-AHOY-04 | cobros 351 | **720** ×2 | `cobro_351.zip` · 244.424 B | 2 jpeg + **`351_0.xlsx`** = **3/3** | **WEB-OK** |
| DW-DEV-AHOY-01 | devoluciones 177 | **720** ×2 | `devolucion_177.zip` · 244.424 B | 2 jpeg + **`177_0.xlsx`** = **3/3** | **WEB-OK** |
| **DW-INV-AHOY-01** | **inventarios 2** | **720** ×2 | `inventario_2.zip` · 172.399 B | 2 jpeg + `2_0.pdf` = **3/3** | **WEB-OK** 🎉 |
| DW-VIS-AHOY-01 | visitas 142 | **720** ×3 | `visita_142.zip` · 335.877 B | 3 jpeg + `142_0.xlsx` = **4/4** | **WEB-OK** |

**8/8 visores abrieron · 8/8 imágenes con `naturalWidth` > 0 (720×1600 reales, ninguna en 0) ·
8/8 descargas con `application/zip` + `Content-Disposition: attachment` · 25/25 entradas == oráculo BD ·
0 `localhost:8282`.**

### Contraste con registros VIEJOS (pre-fix) — A/B dentro del mismo tenant

| Registro viejo | Fecha | Filas en `transaction_image`/`files` | Botones en el detalle | Recurso vía HTTP |
|---|---|---|---|---|
| cobro **347** | 19/06/2026 | **0** | ambos **`disabled`** | **404** |
| pedido **3590** | 29/06/2026 | **0** | ambos **`disabled`** | **404** |
| visita **120** | 28/07/2026 | **0** | — | **404** |
| inventario **1** | 12/02/2026 | **0** (`nu_attachments`=0) | — | sin recurso |

🔑 **Ningún registro viejo sirvió contenido ⇒ NO hubo migración.** Confirmado por dos vías (botón deshabilitado
y 404 directo).

🔑 **MATIZ IMPORTANTE, distinto a `grupo_fiel`:** en kron los viejos **no** son "pre-fix sin migrar" — **no
tienen NINGUNA fila** en `transaction_image`/`transaction_files`/`transaction_signatures`. Su `nu_attachments`
= 1-2 es un **contador huérfano**. Por eso la web hace lo correcto dejando los botones inertes, y por eso el
404 de los viejos **era esperable con o sin fix**: el peso de la validación recae en los **200 de los nuevos**,
que sí son concluyentes.

🔴 **DATO NUEVO que corrige la doc:** en kron/Isla Coche **los botones de adjunto vienen `disabled`**
(`disabled=true` + `ui-state-disabled`) cuando el registro no tiene contenido real. **Corrige**
`[difranca-20260807]` *"los botones aparecen AUNQUE NO HAYA ADJUNTOS"*: aparecen, pero **inertes**.
⚠ El visor del cobro 347 llegó a abrirse **solo porque el helper forzó el `onclick`**, salteando el `disabled`
— **artefacto de automatización, no la experiencia real**. Re-verificado por el camino honesto. Abrió **vacío
(0 `<img>`)**: el visor **no inventa imágenes**, refleja BD.

### Firmas — ruta propia, confirmada y servida

`{origin}/denario/resources/images/firmas/{modulo}/{ref}_{n}.jpg` → **200** en `firmas/cobros/348_0.jpg`,
`firmas/inventarios/2_0.jpg` y `firmas/devoluciones/177_0.jpg`. Las variantes `firmas/348_0.jpg` y
`cobros/348_0.jpg` dan **404** ⇒ **el módulo intermedio es obligatorio**. La visita 142 no tiene fila de firma
en BD y su `firmas/visitas/142_0.jpg` da 404 — **coherente, no defecto**.

### ⚠ Único hueco que kron NO cierra

**`clientesPotenciales` sigue sin muestra post-fix**: kron no tiene ningún registro posterior al **2026-02-06**.
Marca `WEB-N/A`. Es el único módulo del hueco original que queda por verificar.

### 🔴 Confirmación de borrado de adjuntos — CON UNA UBICACIÓN NUEVA

Se descargaron **8 ZIP** con adjuntos reales de un cliente productivo. **Todos borrados.**

| Ubicación | Estado final |
|---|---|
| `qa-piloto-automatizacion/` (cwd, recursivo) | **0 archivos** ✅ |
| `DenarioPremiunMovil/.playwright-mcp/` | **0 archivos** (solo `.log`/`.yml` del MCP) ✅ |
| `qa-piloto-automatizacion/.playwright-mcp/` | **0 archivos** ✅ |
| 🔴 **`%TEMP%\playwright-artifacts-*\` — TERCERA ubicación, NO documentada** | **0 archivos**; barrido **por firma `PK`** sobre las 26 carpetas → 0 residuales ✅ |

🔴🔴 **HALLAZGO DE SEGURIDAD DE DATOS:** el MCP deja el **cuerpo crudo** del download en
`%TEMP%\playwright-artifacts-*\`, con **nombre UUID y SIN extensión** ⇒ **invisible a un barrido
`-Include *.zip`**. Se encontraron **7 archivos** (172 KB–335 KB) **después** de haber limpiado las dos
ubicaciones documentadas. **A partir de ahora hay que barrer por firma `PK\x03\x04`, no por extensión, y en las
TRES ubicaciones.**
*(Verificado por el orquestador tras la corrida: 46 carpetas `playwright-artifacts-*` en el sistema, **todas
vacías**; y en el repo solo quedan las imágenes propias de la app.)*

### Patrones y selectores nuevos de esta tanda

1. 🔴 **`hit()` necesita DOS vías, no una.** El anti-patrón documentado (`new Function(oc)` en vez de `.click()`)
   sirve para `Buscar`/`Limpiar`, pero **rompe** en los botones de adjunto: su `onclick` es
   `PrimeFaces.bcn(this,event,[...])` y **usa `event`** → `TypeError: Cannot read properties of undefined`.
   Receta que funcionó al 100 %:
   ```js
   const hit = (el) => { const oc = el.getAttribute('onclick');
     if (oc) { try { new Function('event', oc).call(el, new MouseEvent('click')); } catch(e) { el.click(); } }
     else el.click(); };
   ```
2. 🔴 **Los botones de adjunto vienen `disabled` cuando no hay contenido** ⇒ el oráculo barato de existencia ya
   no es "¿abre el visor?" sino **`boton.disabled`**, que además es lo que ve el usuario.
   ⚠ `hit()` **saltea el `disabled`** ⇒ un visor que abre vacío puede ser un artefacto propio.
3. 🔑 **`page.request.get(url)` es el diagnóstico definitivo del rutero** — da `status` + `content-length` sin
   depender del DOM, y permite contrastar `/denario` vs `/DenarioPremium` y nuevo vs viejo en **una sola llamada**.
   Más barato que `page.on('response')`.
4. 🔴 **Trampa de BD nueva: `collection_payment.co_operation` viene `NULL` en las filas nuevas** ⇒
   `WHERE co_operation <> 'D'` las **oculta** (`NULL <> 'D'` es `NULL`). Devolvió `[]` para los 4 cobros de hoy y
   casi produce un falso *"cobros sin pagos"*. **Usar `co_operation IS DISTINCT FROM 'D'`.**
   `order_detail`/`return_detail` sí traen `'I'` ⇒ **la trampa es por tabla, no se puede generalizar.**
5. **`client_stock_detail_unit` es el grano real del detalle de inventario web** (no `client_stock_detail`):
   una fila por lote/ubicación. Contar contra `client_stock_detail` da un falso *"la web muestra filas de más"*.
6. **Tabla de actividades del detalle de visita = `form:visitasDT`**, pero la de la **LISTA es `form:tablaVisit`**
   — ids distintos (los selectores documentaban `form:visitasDT` para la lista).
7. **Artefactos del lector `#form.innerText` (ninguno es defecto), a filtrar:** `Comentario:` vacío absorbe
   `Descargar adjuntos` · `Firma:` vacía absorbe `La Transacción no tiene coordenadas asignadas` ·
   `Precinto:` absorbe `Observaciones` · `Conversión IVA` absorbe `Monto Total Pedido: …` · en
   `detalleInventario` **las filas de la tabla de lotes entran como claves**.
   ⇒ **Guarda nueva: descartar claves de más de ~60 caracteres o que contengan varios campos.**
8. **`Observaciones` (título de sección, SIN `:`) es el contenedor real de `tx_description` en devoluciones** —
   el valor está en la línea siguiente. Un lector que exija etiqueta con `:` **pierde el campo**.
9. **Combinar `filtrar(ref)` + `leer()` + `abrirRef(ref)` en UNA sola `evaluate` funciona** (el `navigate` a
   detalle ocurre después del return): baja el ciclo de **4 llamadas a 3** por registro. Validado 8/8 sin reintentos.
10. **Enriquecimientos de la web a tratar como NOTA, nunca mismatch** (nuevos en kron):
    `co_payment_condition` `15` → **CREDITO 15 DIAS** · `id_type` 60 → **Calidad** ·
    `ubicacion` `exh`/`dep` → columnas `Exhibición`/`Depósito` · `co_measure_unit` **BUL** ↔ `na_measure_unit` **BULTO**.

> ✅ consolidado 2026-08-17

---

## Familia M## — Muestreo BD ↔ web (histórico)

Playa **isla_coche** · Empresa **`CHOCOLATES KRON, C.A.`** (única) · guarda de playa y de empresa verificadas
antes de cada lectura · **READ-ONLY**.

### 🔴 ALCANCE — lo cubierto y lo NO cubierto (explícito)

| Módulo | Registros en BD (**medidos hoy**) | Muestreados | Criterio |
|---|---|---|---|
| **cobros** | **72** | **72 en lista (100 %) + 7 detalles** | histórico completo, ventana 01/01–17/08 con rpp=200 |
| **pedidos** | **5.054** | **43 en lista + 2 detalles** + **barrido de invariante sobre los 5.054** | 2 ventanas: 19–21/06 (35) y 12–23/02 (8, los más viejos) |
| **visitas** | **142** | **24 en lista + 1 detalle** | 8 de junio + 16 repartidas Feb/Mar/Abr/May/Jul/Ago |
| depósitos | **0 filas** | — | **`WEB-N/A`** confirmado en BD |
| devoluciones | **3** ⚠ | — | **sin histórico**: los 3 son de hoy ⇒ no aporta muestreo |
| inventarios | **3** | — | ídem, sin histórico |
| clientes potenciales | **73 BD / 7 con `JOIN users`** | — | comportamiento ya medido y explicado; no se re-levanta |

⚠ **Tres correcciones al volumen que se le pasó al agente:** devoluciones son **3**, no 177 (177/178 es el
`max(id)`); cobros **72**, no 351. Mismo error de `max(id)` vs `count(*)` — **conviene medir siempre con `count`**.

Los 8 registros de hoy **no se re-cotejaron** (ya los cubrió C-HOY): se usaron **solo como control de
reproducibilidad §5.a**.

---

### COBROS — 72/72, cobertura del **100 % del histórico**

`72 contados == 72 pintados == página 0`. ⚠ **`COB-LISTA-RENDER-VACIO` NO reproduce** en esta playa/tenant.

**🔑 Mapeo de columnas descubierto y validado 72/72:**

| Columna web | Columna BD |
|---|---|
| `Monto cobrado` (Σ del desglose) | `nu_amount_total` |
| `Total por cobrar` | `nu_amount_final` |
| `Diferencia cobro` | **`nu_difference`** (⚠ **no derivar por resta**: en los anticipos con `nu_amount_final=0` da falso mismatch) |
| `Monto conv.` | `nu_amount_total_conversion` |
| `Tasa conv.` | `nu_value_local` |

**Resultado sobre las 72:** presencia 72/72 · `Monto cobrado` 71/71 comparables · `Total por cobrar` 72/72 ·
`Diferencia cobro` 72/72 · `Estatus` 72/72 (incluido el único **Rechazado**, ref 345) · `Tipo de Cobro` 72/72 ·
`Tasa` 66/66 · `Monto conv.` 66/66. **Cero mismatches.**

**Aritmética explícita — 7 detalles del histórico:**

| Ref | Tipo/Moneda | Aritmética verificada | Marca |
|---|---|---|---|
| **347** | t0 USD, con dcto, dif<0 | Σ(Monto a pagar)=486,35 == Total ✅ · base 516,79 − dcto 30,44 = **486,35** ✅ · pagos Efectivo 10,00 · dif = 10,00 − 486,35 = **−476,35** ✅ · 486,35×602,33 = **292.943,20** ✅ | WEB-OK |
| **343** | t0 BS, dif>0 | Σ=337.903,93 == Total ✅ · 366.457,57 − 28.553,64 = **337.903,93** ✅ · pagos 348.354,57 · dif = **10.450,64** ✅ → **generó el anticipo 344 por ese mismo importe** · /602,33 = **560,99** ✅ | WEB-OK |
| **344** | t1 BS anticipo | pie **reducido**, `documentosPagadosDT` **ausente** ✅ · `Monto pagado` 10.450,64 · forma de pago **`Prepago Automático`** (vuelto del 343; `co_original_collection` lo confirma) · /602,33 = **17,35** ✅ | WEB-OK |
| **110** | t0 BS **multi-pago** | 1.800.000,00 + 600.566,00 = **2.400.566,00** == `nu_amount_total` ✅ (desglose §5.b) · Σ(Monto a pagar)=2.605.127,67 == Total ✅ · dif = **−204.561,67** ✅ | WEB-OK |
| **345** | t0 BS **Rechazado** | Σ=53.313,90 == Total ✅ · **la fórmula larga también cierra**: 60.335,40 − 6.971,50 − **50,00 (Dif/Faltante)** = 53.313,90 ✅ | WEB-OK |
| **151** | t0 USD **Pago parcial = SÍ** | 🔑 **confirma en vivo la corrección del oráculo**: Σ(Saldo)=26.085,50 **≠** Total 16.085,50, pero **Σ(Monto a pagar)=16.085,50 == Total** ✅ · `Monto total base` = Σ(Saldo) = 26.085,50 ✅ | WEB-OK |
| **1** | t0 USD, el más viejo (12/02) | Σ=138,04 == Total ✅ · ×390,29 = **53.875,63** ✅ | WEB-OK |

**DW-COB-M06** (`Consultar Depósito`): **`WEB-N/A`** — los 72 cobros tienen `id_deposit` NULL y `deposit` está en 0 filas.

---

### PEDIDOS — 43 en lista + barrido de invariante sobre los 5.054

**Ventana 19–21/06:** `35 contados == 35 pintados == 35 en BD`. **10 comprobaciones × 35 registros, cero fallos**:
`Monto Total`==`nu_amount_total` · `Monto Base`==`nu_amount_total_base` · `Total items`==`nu_details` ·
`Monto conv.` · `Tasa` · Estatus (`st_order=6`→`Enviado`) · fecha · y el invariante
**Σ(`order_detail`) == Monto Total** 35/35.
*Ej.:* 1.605,60 × 602,33 = **967.101,05** ✅ · 80,00 × 602,33 = **48.186,40** ✅

**Ventana 12–23/02:** `8 == 8 == 8`. Acá **sí hay IVA 16 %** (en junio no) ⇒ `Monto Base ≠ Monto Total`:
9.020,00 × 1,16 = **10.463,20** ✅ · 6.004,56 × 1,16 = **6.965,29** ✅ · 842,90 × 1,16 = **977,76** ✅ (8/8).

**Detalle ref 8 (con IVA):** Σ(Subtotal de línea) 9.020,00 == **`Monto Base Pedido`** ·
`Monto Base` × 1,16 = `Monto Total` 10.463,20 ✅ · línea 90,20 × 100 BULTO = 9.020,00 ✅ ·
IVA 90,20 × 0,16 = **14,43** ✅ · `Importe + IVA` = **104,63** ✅ · convs ×405,35 ✅

🔑 **Invariante REFINADO:** `Σ(Subtotal de línea) == Monto Base Pedido` **siempre**, y
`Monto Base × (1+IVA) == Monto Total`. El `Σ líneas == Monto Total` documentado solo vale **con IVA = 0**.

---

### VISITAS — 24 muestreadas

**24/24** en `Fecha Programada`(=`da_visit`) · `Fecha Iniciada`(=`da_initial`) · `Fecha Enviada`(=`da_real`) ·
`Cod. Cliente` · `Status` · `Vendedor` · **`Geo` == `st_coordinate`** — y patrón de título `{fecha}-{cliente}` 24/24.

⛔ **`DW-VIS-M01` BLOCKED — el rango de fechas de visitas NO llega al servidor.**
Con `01/06/2026–30/06/2026` puestos y **verificados en los inputs**, tras **3 `Buscar`** (incluido el de
calentamiento) la lista devolvió siempre la **ref 142 del 17/08**. Probado por widget `setDate` **y** por
`value` + `input`/`change`/`blur`.
**Control que descarta las causas conocidas:** el filtro **`# Ref` SÍ funciona** en el mismo estado (ref 77 del
17/06 devuelta correctamente) y los 142 registros tienen `id_user` **válido en `users`** (no es el patrón del
vendedor de baja).
⇒ El agente lo dejó **señalado y sin firmar como defecto**, por ser materia de `F##`. **Pendiente de
verificación dirigida** (ver nota del orquestador al cierre).

**`DW-VIS-M03` `WEB-N/A`:** actividades/motivos **no cotejables** — no existe `visit_incidence` en este esquema
y **`visit_view` es ilegible** (`permission denied for sequence visit_view_seq`), pese al GRANT 184/184.

---

### 🟠 Observaciones sobre DATOS HISTÓRICOS — **§5.a aplicada, NO son hallazgos**

**1. Anticipos viejos sin conversión ni tasa en la lista.** Condición: `co_type=1` con
`nu_amount_total_conversion = 0` **y** `nu_amount_final = 0`. Afectados: **6** (refs 2, 3, 4, 5, 6, 8), del
**23/02 al 09/03/2026**. La lista muestra `Tasa conv. N/A`, `Monto conv. N/A` y `Total por cobrar 0,00`; el
detalle **sí** trae la tasa. **La web es fiel a BD en los tres campos.**
🔑 **Control fuerte:** el anticipo **350, creado HOY** y standalone, renderiza `Total por cobrar 2.500,00`,
tasa 771,07 y conv 3,24 **correctamente**; los anticipos 165/267/340/344 (30/03 en adelante) también.
⇒ **no reproduce desde 2026-03-09.** *(Es la misma familia que la observación de grupo_fiel — 2.º tenant.)*

**2. Dos pedidos con la línea IVA-inclusiva.** Condición: `Σ(order_detail.nu_amount_total) == nu_amount_total`
en vez de `== nu_amount_total_base`. **Barrido sobre los 5.054 pedidos: solo 2 afectados** (refs 3 y 4), ambos
del **2026-02-23**, el primer día de datos. La cabecera es **internamente coherente** y la web renderiza
fielmente la BD. ⇒ **no reproduce desde 2026-02-23.**

**3. Visita 77 con la actividad duplicada.** Su detalle lista **2 filas con `N° = 1`** e idéntica
Actividad/Motivo — distinto del patrón legítimo "una fila por actividad" (la ref 142 de hoy trae 2 actividades
**diferentes**). **No atribuible:** `visit_view` es ilegible, así que no se puede decidir si el duplicado está
en BD o lo genera la web. Queda como observación.

**4. Datos, no web:** los anticipos 4/5/6 traen importes implausibles rotulados `USD` (464.987,60 ·
1.222.110,00 · 402.230,00). `co_currency='USD'` **en BD** ⇒ la web coincide; es **calidad de dato** de febrero.

---

### Patrones y selectores nuevos

1. 🔴 **En este build los filtros NO persisten a `browser_navigate`, pero rows-per-page SÍ.** Tras `navigate`
   las fechas vuelven al mes en curso y el conteo cae de 72 a 4, mientras `.ui-paginator-rpp-options` **conserva
   200**. ⇒ **la persistencia es POR CONTROL, no global.**
2. 🔑 **Ciclo de detalle barato:** guardar el abridor **y** el lector como fuente en `sessionStorage` y
   rehidratar con `eval('('+sessionStorage.qaX+')')(ref)` → **3 llamadas por registro**, 8/8 sin reintentos,
   sobrevive a `navigate` y a `Consultar`.
3. 💎 **Muestreo por `# Ref` EN LOTE dentro de una sola `evaluate`** (setear `n_ref` → `Buscar` → esperar
   `jq.active===0` → leer → repetir): **8 registros por llamada**. Seguro contra lectura rancia porque la
   condición de corte es *"la primera fila empieza con el ref pedido"*. **Es lo que salvó visitas** con el
   filtro de fechas roto.
4. 🔴 **`detallePedido`: la celda `Monto Total` puede traer CUATRO valores, no dos.** Con IVA:
   `Precio base:` · `IVA 16.0%:` · `Importe + IVA:` · `Subtotal:`. La doc de `[difranca-20260807]` solo
   contempla dos. Parsear con `/(Precio base|IVA [\d.]+%|Importe \+ IVA|Subtotal)\s*:\s*([\d.,]+)/g`.
5. 🔑 **Oráculo de pedidos refinado** (ver arriba): `Σ(Subtotal) == Monto Base` siempre.
6. 🔑 **Mapeo BD de la lista de cobros** validado 72/72 (ver tabla arriba).
7. 🔑 **Visitas: `Geo` == `visit.st_coordinate`** — `0` Por Revisar · `1` No Realizado · `2` Falta Coordenada
   (Sucursal) · `3` Falta Coordenada (Destino) · `4` Fuera de Rango · `5` Correcto.
8. ⚠ **`users` de kron NO tiene `last_name_user` sino `lastname_user`**, y el nombre completo de la web es
   `name_user + ' ' + lastname_user`. Cotejar solo contra `name_user` produce un **falso `WEB-FIELD-MISMATCH`
   en el 100 % de las filas**.
9. ⚠ **Filtros nuevos en visitas de este build:** `:idRol_input` · `:idClient_input` · `:idMotive_input`
   (95 opciones) · `:selectDispatch_input` · **`:selectCoordinadas_input` con placeholder `value="-1"`**
   (no `""` ni `0`) — un lector que asuma `""` lo leerá como filtro activo.
10. ⚠ **kron no tiene `visit_incidence`**; las tablas de visitas son `visit`, `visit_cycles`, `visit_planning`,
    `visit_view` — y **ninguna de las legibles guarda actividad/motivo**.
11. ⚠ **`query.js` revienta por `statement timeout`** con subconsultas correlacionadas sobre 5.054 pedidos.
    Reescribir como `WITH s AS (SELECT co_order, sum(...) GROUP BY co_order) … JOIN` corre instantáneo.
    **Imprescindible para los barridos §5.a sobre la población completa.**
12. ⚠ **`Comentario` en `detalleCobro` absorbe el texto del botón `Descargar adjuntos`** cuando está vacío.
13. ✅ **`#form.innerText` funciona en `detalleVisita`** pese al typo `class="font.-bold"` — reconfirmado.
14. 🔴 **Medir con `count(*)`, nunca con `max(id)`** — el briefing traía 177 devoluciones (son 3) y 351 cobros
    (son 72). Es un error fácil y contamina el alcance declarado.

> ✅ consolidado 2026-08-17

---

## Verificación dirigida — filtro de fechas de /pages/visitas

**Veredicto: 🟢 NO ES DEFECTO.** El ⛔ BLOCKED del agente `M##` queda **descartado**: el filtro de rango de
fechas de `/pages/visitas` **funciona correctamente** en kron / isla_coche (build del 17/08/2026).

### Prueba decisiva — el POST sí lleva las fechas

Hook sobre `XMLHttpRequest.prototype.send`. El body del POST de `Buscar` contiene:

```
form:j_idt115:dateB_input  = 01/06/2026
form:j_idt115:dateF_input  = 30/06/2026
form:j_idt115:n_ref        = (vacio)
javax.faces.source         = form:j_idt115:btnBuscar
javax.faces.partial.render = form:tablaVisit form:messages
-> HTTP 200 · 489 ms · 81.754 bytes de respuesta
```

Los parámetros **viajan, bien formateados**, y el servidor **los honra** (la respuesta trajo junio, no la ref
142). No es "el filtro no viaja", ni "el servidor lo ignora", ni "viaja mal formateado".

### Ventanas probadas — 6/6 exactas contra BD

Oráculo: `SELECT count(DISTINCT id_visit) FROM visit WHERE co_operation IS DISTINCT FROM 'D' AND da_visit::date BETWEEN … AND …`

| Rango | Esperado (BD) | Obtenido (web, refs únicos) | Filas | Veredicto |
|---|---|---|---|---|
| 01/02–28/02/2026 | 1 | 1 (ref 1) | 1 | WEB-OK |
| 01/04–30/04/2026 | 27 | 27 (refs 13–39) | 28 | WEB-OK |
| **01/06–30/06/2026** | **23** | **23 (refs 67–89)** | 24 | WEB-OK |
| 01/08–31/08/2026 | 18 | 18 (refs 125–142) | 20 | WEB-OK |
| 17/08–17/08/2026 | 1 | 1 (ref 142) | 2 | WEB-OK |
| 01/01–31/01/2025 | 0 | 0 ("No existe registro") | 0 | WEB-OK |

⚠ **Filas ≠ refs**: la lista es **una fila por actividad** (en junio la ref 77 sale 2 veces).
**Un filtro roto no da seis resultados distintos y todos correctos.**

### Comparación cruzada — /pages/cobros, misma playa

| Ventana | BD | Web | Veredicto |
|---|---|---|---|
| 01/08–17/08/2026 (por defecto) | 4 | 4 | WEB-OK |
| 01/06–30/06/2026 | 6 | 6 | WEB-OK |
| 01/03–31/03/2026 | 38 | 38 | WEB-OK |

### Falsos positivos descartados explícitamente

- El `value` de los inputs, **releído después de disparar**: correcto (`01/06/2026` / `30/06/2026`).
- `PF(widget).getDate()`: junio, **sin revertir**.
- Los **11 `select`** de filtro verificados uno por uno en placeholder (`selectCoordinadas = -1`).
- Empresa: kron tiene **una sola** (`KRON_ADM`, 142/142 visitas) ⇒ no puede acotar nada.
- Ajax esperado por el **`loadend` del XHR real** + `jq.active===0`, nunca por tiempo fijo (198–1.153 ms).

### 🔑 Causa raíz del falso positivo

Al entrar a `/pages/visitas` **la tabla ya viene pintada con el resultado de la búsqueda anterior del bean**,
*antes* de tocar `Buscar` (medido: 24 filas de junio ya presentes al cargar). ⇒ si el `Buscar` no llega a
ejecutar su ajax, se lee un listado **poblado y coherente** que **parece** una respuesta al filtro.
En sesión virgen ese resultado previo es el listado **sin filtrar** (142 registros, encabezado por la ref 142
del 17/08) — **exactamente el síntoma reportado**.

**Disparador probable:** `[id$=":btnBuscar"]` es `<button type="submit">` con
`onclick="PrimeFaces.ab({...});return false;"`. Un `click()` que no cancele el default dispara un **submit
completo en vez del ajax** — la misma causa del `chrome-error://` ya anotado hoy en isla_coche.

### Patrones nuevos

- 🔴 **DEROGAR "la PRIMERA búsqueda de visitas devuelve resultado RANCIO".** No reproduce: con entrada fresca,
  `Buscar` #1 y #2 dieron idéntico. Lo que existe es que **la tabla viene pre-poblada con el resultado anterior
  del bean al entrar al módulo**. El `Buscar` de calentamiento **no arregla nada**; enganchar el `loadend` del
  XHR **sí**.
- **⚠ Índices de columna de `form:tablaVisit`** (kron/isla_coche): `td[0]`=Consultar · `td[1]`=Editar ·
  `td[2]`=Eliminar · **`td[3]`=`# Ref`** · `td[5]`=Fecha. Anclar a `td[0]`/`td[1]` devuelve
  `"DetalleConsultar"`/`"Editar"` — **falso vacío**.
- **⚠ En este build `el.value = …` en `dateB_input`/`dateF_input` NO revierte** (probado con
  `input`/`change`/`blur`). La nota contraria de `playas.yaml` es **específica de Caribe**.
  `PF(widget).setDate()` sigue siendo preferente por ser inmune al build.
- 🔴 **Los filtros de visitas PERSISTEN entre sesiones de agente**: se encontró `n_ref = 77` puesto por el
  agente anterior, sobreviviendo a `browser_navigate`. **Limpiar `n_ref` explícitamente antes de medir
  cualquier conteo.**
- 🔑 **Receta de instrumentación de ajax** (convirtió un BLOCKED en descarte): hook
  `XMLHttpRequest.prototype.open/send` guardando `{url, body, status, ms}`, y esperar `jq.active===0` **y**
  que todos los registros nuevos tengan `status !== null`, + settle 1,5 s. Permite además **leer qué parámetros
  viajaron**, que es la única forma tajante de separar *"filtro roto"* de *"artefacto de automatización"*.

> ✅ consolidado 2026-08-17

---

## Familia C## — Cotejo móvil → web (registros creados por la corrida)

Playa **isla_coche** (`verificarContexto(...,'isla_coche') → {ok:true}`) · Empresa anclada por TEXTO ·
READ-ONLY. Los 6 venían con **BD-FIELD-OK**; acá se verifica **la vista web**.
**Resultado: 6/6 `WEB-OK`, 0 diffs, 0 BLOCKED.**

| # Ref | Módulo | Marca | Campos cotejados | Diffs |
|---|---|---|---|---|
| **78** | clientes potenciales | **WEB-OK** | Código `1786993684489.0` · Fecha `15:10:37` · `Test-CLT-SMOKE-150841` · Cédula `J987654321` · Responsable · Correo · Teléfono · Dirección + Entrega · Coordenada `11.0490271,-63.8650027` | ninguno |
| **5086** | pedidos | **WEB-OK** | Código `1786994993455.0` · Enviado · `J504480975` · Tipo `PEDIDO ESTANDAR` · Cond. `CREDITO 15 DIAS` · Sucursal 68305 · línea `51104106` ×`2 BULTO` · lista `P1 - PRECIO 1` | ninguno |
| **178** | devoluciones | **WEB-OK** | Responsable · Tipo `Cambio X Cambio` (63) · Precinto `PRE-0817` · Observaciones · línea `51104106` ×**3** `BUL` · Factura `FACT50029953` · Motivo (49) · Lote y Venc. vacíos | ninguno · **sin montos** (correcto) |
| **3** | inventarios | **WEB-OK** | Código `1786998592656.0` · Comentario `invQA kron` · Sucursal 68305 · **3 filas / 2 productos** | ninguno |
| **1** ⭐ | depósitos | **WEB-OK** | Banco `0108` · cta `01080011180100121387` · Planilla `DEP-QA-KRON-0817` · **900.031,16 BS** · hija: cobro **348** / `Efectivo` / `efect1` | ninguno |
| **143** | visitas | **WEB-OK** | Orden de visita **1** · Status **visitado** · `J504480975` · **1 actividad**: `MERCHANDISING` / `VISIBILIDAD PDV` / `QA-VIS-015-KRON` | ninguno |

### Aritmética explícita (tolerancia 0,01)

**Pedido 5086** — tasa propia `771,07` · **USD→BS multiplica**

```
Linea:  2 BULTO x 101,40 USD = 202,80 USD == Subtotal                        OK (diff 0)
suma(Subtotal de linea) = 202,80 == Monto Base Pedido 202,80                 OK
Monto Base x (1+IVA) = 202,80 x (1+0) = 202,80 == Monto Total Pedido         OK
Subtotal bruto 202,80 - Descuento bonif. 0,00 = 202,80                       OK
101,40 x 771,07 =  78.186,498  -> web  78.186,50                             OK (diff 0,002)
202,80 x 771,07 = 156.372,996  -> web 156.373,00                             OK (diff 0,004)
```

**Depósito 1** — **BS→USD divide**

```
900.031,16 / 771,07 = 1.167,2496 -> web 1.167,25                             OK (diff 0,0004)
Oraculo = porcion EFECTIVO del cobro 348: collection_payment trae UNA sola
fila 'ef' = 900.031,16 BS (100 % efectivo) => deposito por el total es CORRECTO   OK
(NO se sumaron las filas de la tabla hija contra el monto)
```

**Inventario 3** — grano `client_stock_detail_unit`; la ubicación se lee **por columna**:

| Lote | Producto | Depósito | Exhibición | Venc. | BD |
|---|---|---|---|---|---|
| QAK1 | 51104106 | `-` | **7.00 BULTO** | 17/08/2026 | exh 7 ✅ |
| QAK2 | 51104106 | **3.00 BULTO** | `-` | 17/08/2026 | dep 3 ✅ |
| QAK3 | 51104107 BALLS FRESA | `-` | **5.00 BULTO** | 17/08/2026 | exh 5 ✅ |

3 filas contra 2 productos = **correcto**. *(La web las ordena QAK2/QAK1/QAK3: solo orden, no contenido.)*

**Fechas:** todas coinciden **por día**; la web muestra local UTC−4 vs nube UTC ⇒ **nota**, no diff.

### 🔴 Observación que CONFIRMA un defecto abierto — 2.º tenant

**Cabecera de `/pages/depositos`: `Monto total en BS: 0,00` y `Monto total en USD: 0,00`** con **1 fila** de
`900.031,16 BS` / `1.167,25 USD`. **Persiste después de pulsar `Buscar`** (XHR 200).
⇒ **Reproduce el defecto `D-02`** detectado en la verificación de indicadores de grupo_fiel, que allí tenía
**n = 1** y no se había podido replicar. **Ahora son 2 tenants y 2 playas.**
Y en **pedidos** la cabecera **sí** calcula `Total Base: 1.385.042,10` pero también trae
`Monto total en USD: 0,00` ⇒ **reproduce también `D-01`**.

🔹 **Banco como CÓDIGO (`0108`) en lista y detalle**, no como nombre de catálogo. El valor almacenado
(`co_bank='0108'`) se renderiza fiel ⇒ **no es mismatch de dato**, es decisión de presentación — **misma familia
que `DEP-BANCO-CODIGO-CRUDO`** de grupo_fiel, ahora en 2.º tenant.

### Patrones / selectores nuevos

1. 🔴 **La sesión web expira y la web MIENTE:** el POST de `Buscar` devuelve **`302 → login.xhtml`** y la tabla
   **queda con el resultado ANTERIOR pintado**. Se perdieron 3 intentos creyendo que el filtro no se aplicaba,
   cuando el body del POST **sí** llevaba los parámetros correctos.
   ⇒ **Instrumentá el XHR y mirá el `status`**, no solo el `loadend`. Un `Total de Resultados` que no cambia +
   fechas fuera del rango pedido = **sesión caída, no filtro roto**.
2. 🔴 **Nunca hacer `navigate` directo a un módulo justo después de un POST de otro módulo:** devuelve
   `<partial-response><error-name>java.lang.IndexOutOfBoundsException` y la página queda **en blanco**
   (`document.title === ''`, 0 forms). **Pasá por `/pages/main` primero.** Chequeo barato: `document.title !== ''`.
3. 🟢 **`page.addInitScript(bundle)` reinstala el bundle solo en cada navegación** — se paga una vez y sobrevive
   a los `Consultar` (que son navegación completa, no ajax). Elimina el re-pegado por módulo.
4. 🔴 **Parser `#form`: el fallback "valor en la línea siguiente" NO puede descartar líneas con `:`** — **la hora
   los trae**. `Fecha planeada de visita:` → `17/08/2026 16:57:33` se perdía. Regla correcta: la línea siguiente
   **es** el valor salvo que **termine en `:`** o sea texto de botón (lista negra:
   `Descargar adjuntos|Ver adjuntos|Regresar|Imprimir|Volver|Consultar`). Con eso **`Firma:` ya no absorbe
   `Descargar adjuntos`**.
5. ⚠ **Trampa nueva del mismo tipo: los TÍTULOS DE SECCIÓN se cuelan como valor.** En
   `detalleClientePotencial`, `Web:` está vacío y el parser toma **`Contacto`**, encabezado de la sección
   siguiente. BD `na_web_site = NULL` ⇒ el valor real es vacío.
6. **Botón Buscar:** `:btnBuscar` en **visitas**, pero **`:ajax`** en pedidos / devoluciones / inventarios /
   depósitos / clientesPotenciales ⇒ **anclar por texto**.
7. ⚠ **`Empresa` en el DETALLE sí trae el punto final: `CHOCOLATES KRON, C.A.`** — el rótulo sin punto
   (`lb_enterprise`) **no apareció en ninguno de los 6 detalles**. ⇒ el rótulo depende de **dónde** se lea.
8. ⚠ **`Observaciones` es título SIN `:` en devoluciones pero CON `:` en depósitos.** Manejar ambos.
9. **Contexto BD útil:** `visit` **sí** tiene GRANT (a diferencia de `visit_view`) · el catálogo de causa es
   **`incidence_motive`**, no `incidence_cause` · `order_type` guarda `id_enterprise = NULL` (filtrar por
   `id_enterprise=1` devuelve 0 filas) · `deposit_collection_payment` **vacía** ⇒ el vínculo es
   `collection.id_deposit`.

> ✅ consolidado 2026-08-17

---
